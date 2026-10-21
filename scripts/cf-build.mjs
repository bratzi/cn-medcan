/**
 * npm run cf-build (Workers Builds: `npx prisma generate && npm run cf-build`).
 *
 * Plan 2026-10-20 (Vorrendern), Task 1: Im Workers Build (WORKERS_CI=1) oder mit
 * VORRENDERN_DATEN=1 zieht das Script einen Abzug der Live-D1 in die lokale D1
 * (.wrangler/state, die getPlatformProxy im Build liest) und setzt VORRENDERN=1. Dann rendert
 * `opennextjs-cloudflare build` die statischen Seiten beider Sprachen mit echten Daten vor
 * (lib/i18n/vorrendern.ts), und `opennextjs-cloudflare deploy` legt sie in KV. Ohne das baute
 * nach jedem Deploy der erste Besucher jede Seite im Request (700 bis 1300 ms CPU).
 *
 * Scheitert Export, Import oder Prüfung: lokal Warnung `[vorrendern] …` und Build ohne VORRENDERN;
 * im Workers Build (WORKERS_CI=1) Abbruch (Spec 2026-10-21, Seiten aus Assets, 5).
 * Danach kopiert scripts/seiten-in-assets.mjs die vorgerenderten Leseseiten nach .open-next/assets/_seiten.
 * Scheitert der Build mit VORRENDERN, folgt ein zweiter Build ohne; scheitert auch der:
 * Exit-Code ungleich 0.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const DB = "cn-medcan-db";
const LOKALE_D1 = join(".wrangler", "state", "v3", "d1");

/** Soll der Build einen D1-Abzug ziehen? Nur im Workers Build oder ausdrücklich. */
export function sollVorrendern(env) {
  return env.WORKERS_CI === "1" || env.VORRENDERN_DATEN === "1";
}

/**
 * Im Workers Build ohne Abzug abbrechen (Spec 2026-10-21, 5): ohne vorgerenderte Dateien fiele
 * jede Leseseite auf den teuren Weg zurück. Die alte Version bleibt live. Lokal bleibt es bei der Warnung.
 */
export function brichtAb(env, abzugOk) {
  return env.WORKERS_CI === "1" && !abzugOk;
}

/** Env für `opennextjs-cloudflare build`: VORRENDERN=1 nur nach erfolgreichem Abzug. */
export function buildEnv(env, abzugOk) {
  const neu = { ...env };
  delete neu.VORRENDERN;
  if (abzugOk) neu.VORRENDERN = "1";
  return neu;
}

/** Liest die Anzahl aus `wrangler d1 execute --json`; null, wenn die Ausgabe nicht passt. */
export function anzahlAusJson(ausgabe) {
  try {
    const start = ausgabe.indexOf("[");
    const daten = JSON.parse(ausgabe.slice(start));
    const n = Number(daten?.[0]?.results?.[0]?.n);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Trennt die Trigger aus einem Schema-Abzug. Trigger prüfen Inserts (etwa Abstimmungsphase der
 * Umfrage) und würden den Datenimport abbrechen; sie kommen erst nach den Daten.
 * Ein Trigger endet mit einer eigenen Zeile `END;` (inneres `… end;` in CASE zählt nicht).
 */
export function trenneTrigger(sql) {
  const trigger = sql.match(/^CREATE TRIGGER[\s\S]*?^END;$/gim) ?? [];
  const ohneTrigger = trigger.reduce((rest, t) => rest.replace(t, ""), sql);
  return { ohneTrigger, trigger: trigger.join("\n") };
}

/**
 * Zieht den Abzug: Schema und Daten getrennt exportieren (--remote), lokale D1 verwerfen, dann
 * lokal importieren in der Reihenfolge Schema ohne Trigger, Daten, Trigger. Ein einziger
 * Gesamtabzug lässt sich nicht einspielen: er fügt Zeilen ein, bevor referenzierte Tabellen
 * (kultivare) existieren, und Trigger lehnen Altdaten ab. Danach Plausibilität.
 * `fuehreAus(befehl, args)` liefert { status, stdout } (im Test ein Stub, ohne echte Prozesse).
 * Gibt { ok, grund } zurück und wirft nie.
 */
export function ziehAbzug(fuehreAus, { verzeichnis, loesche, lies, schreibe }) {
  const pfad = (name) => join(verzeichnis, name);
  const exportiere = (flag, datei) =>
    fuehreAus("npx", ["wrangler", "d1", "export", DB, "--remote", flag, "--output", pfad(datei)]).status === 0;
  if (!exportiere("--no-data", "schema.sql") || !exportiere("--no-schema", "daten.sql")) {
    return { ok: false, grund: "Export der Live-D1 fehlgeschlagen" };
  }
  try {
    const { ohneTrigger, trigger } = trenneTrigger(lies(pfad("schema.sql")));
    schreibe(pfad("tabellen.sql"), ohneTrigger);
    schreibe(pfad("trigger.sql"), trigger);
  } catch {
    return { ok: false, grund: "Schema-Abzug nicht lesbar" };
  }
  loesche(LOKALE_D1);
  for (const datei of ["tabellen.sql", "daten.sql", "trigger.sql"]) {
    const imp = fuehreAus("npx", ["wrangler", "d1", "execute", DB, "--local", "--file", pfad(datei)]);
    if (imp.status !== 0) return { ok: false, grund: `Import in die lokale D1 fehlgeschlagen (${datei})` };
  }
  const pruef = fuehreAus("npx", [
    "wrangler", "d1", "execute", DB, "--local", "--json",
    "--command", "SELECT count(*) AS n FROM strains WHERE aktiv = 1",
  ]);
  const n = pruef.status === 0 ? anzahlAusJson(pruef.stdout) : null;
  if (n === null || n <= 0) return { ok: false, grund: `Plausibilität: aktive Strains = ${n}` };
  return { ok: true, grund: `${n} aktive Strains lokal` };
}

function echterLauf(befehl, args, erfassen = false) {
  const r = spawnSync(befehl, args, {
    shell: process.platform === "win32",
    stdio: erfassen ? ["ignore", "pipe", "inherit"] : "inherit",
    encoding: "utf8",
  });
  return { status: r.status ?? 1, stdout: r.stdout ?? "" };
}

function main() {
  let abzugOk = false;
  if (sollVorrendern(process.env)) {
    const verzeichnis = mkdtempSync(join(tmpdir(), "cn-d1-"));
    try {
      const ergebnis = ziehAbzug((b, a) => echterLauf(b, a, a.includes("--json")), {
        verzeichnis,
        loesche: (pfad) => rmSync(pfad, { recursive: true, force: true }),
        lies: (pfad) => readFileSync(pfad, "utf8"),
        schreibe: (pfad, inhalt) => writeFileSync(pfad, inhalt),
      });
      abzugOk = ergebnis.ok;
      if (brichtAb(process.env, ergebnis.ok)) {
        console.error(`[vorrendern] FEHLER: ${ergebnis.grund}. Abbruch, die alte Version bleibt live`);
        rmSync(verzeichnis, { recursive: true, force: true });
        process.exit(1);
      }
      console.log(
        ergebnis.ok
          ? `[vorrendern] D1-Abzug bereit (${ergebnis.grund}), Build rendert beide Sprachen vor`
          : `[vorrendern] WARNUNG: ${ergebnis.grund}. Build ohne Vorrendern, Seiten entstehen beim ersten Aufruf`,
      );
    } finally {
      rmSync(verzeichnis, { recursive: true, force: true });
    }
  } else {
    console.log("[vorrendern] aus (weder WORKERS_CI=1 noch VORRENDERN_DATEN=1)");
  }

  const lauf = (befehl, args, env) =>
    spawnSync(befehl, args, { shell: process.platform === "win32", stdio: "inherit", env }).status ?? 1;
  let status = lauf("npx", ["opennextjs-cloudflare", "build"], buildEnv(process.env, abzugOk));
  if (status !== 0 && abzugOk) {
    console.log("[vorrendern] WARNUNG: Build mit Vorrendern fehlgeschlagen, zweiter Versuch ohne Vorrendern");
    status = lauf("npx", ["opennextjs-cloudflare", "build"], buildEnv(process.env, false));
  }
  if (status !== 0) process.exit(status);
  status = lauf("node", ["scripts/seiten-in-assets.mjs"], buildEnv(process.env, false));
  if (status !== 0) process.exit(status);
  status = lauf("node", ["scripts/bundle-env-bereinigen.mjs"], buildEnv(process.env, false));
  if (status !== 0) process.exit(status);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
