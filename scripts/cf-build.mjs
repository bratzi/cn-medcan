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
 * Scheitert Export, Import oder Prüfung: Warnung `[vorrendern] …`, Build ohne VORRENDERN wie
 * bisher. Scheitert der Build selbst: Exit-Code ungleich 0.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const DB = "cn-medcan-db";
const LOKALE_D1 = join(".wrangler", "state", "v3", "d1");

/** Soll der Build einen D1-Abzug ziehen? Nur im Workers Build oder ausdrücklich. */
export function sollVorrendern(env) {
  return env.WORKERS_CI === "1" || env.VORRENDERN_DATEN === "1";
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
 * Zieht den Abzug: export --remote, lokale D1 verwerfen, import --local, Plausibilität.
 * `fuehreAus(befehl, args)` liefert { status, stdout } (im Test ein Stub, ohne echte Prozesse).
 * Gibt { ok, grund } zurück und wirft nie.
 */
export function ziehAbzug(fuehreAus, { verzeichnis, loesche }) {
  const datei = join(verzeichnis, "d1.sql");
  const exp = fuehreAus("npx", ["wrangler", "d1", "export", DB, "--remote", "--output", datei]);
  if (exp.status !== 0) return { ok: false, grund: "Export der Live-D1 fehlgeschlagen" };
  loesche(LOKALE_D1);
  const imp = fuehreAus("npx", ["wrangler", "d1", "execute", DB, "--local", "--file", datei]);
  if (imp.status !== 0) return { ok: false, grund: "Import in die lokale D1 fehlgeschlagen" };
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
      });
      abzugOk = ergebnis.ok;
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

  const env = buildEnv(process.env, abzugOk);
  for (const [befehl, args] of [
    ["npx", ["opennextjs-cloudflare", "build"]],
    ["node", ["scripts/bundle-env-bereinigen.mjs"]],
  ]) {
    const r = spawnSync(befehl, args, { shell: process.platform === "win32", stdio: "inherit", env });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
