import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { sprachParameter } from "@/lib/i18n/vorrendern";

import { importbaum, ohneKommentare } from "./hilfen/importbaum";

const lies = (datei: string) => readFileSync(datei, "utf8");

/**
 * Plan 2026-10-20 (Vorrendern), Task 1: Diese statischen Seiten rendert der Build mit dem
 * D1-Abzug in beiden Sprachen vor (scripts/cf-build.mjs). Ihr Inhalt kommt nur aus D1 und Code.
 */
const VORGERENDERT = [
  "app/[lang]/page.tsx",
  "app/[lang]/blueten/page.tsx",
  "app/[lang]/reviews/page.tsx",
  "app/[lang]/neu/page.tsx",
  "app/[lang]/jury/page.tsx",
  "app/[lang]/jury/team/page.tsx",
  "app/[lang]/jury/favourites/page.tsx",
  "app/[lang]/zugang/page.tsx",
  "app/[lang]/ig/page.tsx",
];

/** Lesen das Secret IMPRESSUM_JSON, das im Build fehlt: vorgerendert stünden dort Platzhalter. */
const MIT_SECRET = ["app/[lang]/impressum/page.tsx", "app/[lang]/datenschutz/page.tsx"];

/** Eigene Parameter ohne generateStaticParams: bleiben beim ersten Aufruf. */
const EIGENE_PARAMETER = [
  "app/[lang]/jury/[slug]/page.tsx",
  "app/[lang]/jury/ausgabe/[slug]/page.tsx",
  "app/[lang]/jury/seite/[nummer]/page.tsx",
  "app/[lang]/reviews/band/[band]/page.tsx",
];

function mitVorrendern(wert: string | undefined, pruefe: () => void) {
  const vorher = process.env.VORRENDERN;
  if (wert === undefined) delete process.env.VORRENDERN;
  else process.env.VORRENDERN = wert;
  try {
    pruefe();
  } finally {
    if (vorher === undefined) delete process.env.VORRENDERN;
    else process.env.VORRENDERN = vorher;
  }
}

test("sprachParameter: ohne VORRENDERN=1 keine Pfade, die Seite entsteht beim ersten Aufruf", () => {
  for (const wert of [undefined, "", "0", "true"]) {
    mitVorrendern(wert, () => assert.deepEqual(sprachParameter(), [], String(wert)));
  }
});

test("sprachParameter: mit VORRENDERN=1 beide Sprachen", () => {
  mitVorrendern("1", () => assert.deepEqual(sprachParameter(), [{ lang: "de" }, { lang: "en" }]));
});

test("Vorgerenderte Seiten exportieren generateStaticParams über sprachParameter", () => {
  for (const datei of VORGERENDERT) {
    const quelle = lies(datei);
    assert.match(quelle, /import \{ sprachParameter \} from "@\/lib\/i18n\/vorrendern";/, datei);
    assert.match(quelle, /export function generateStaticParams\(\) \{\s*return sprachParameter\(\);\s*\}/, datei);
    assert.match(quelle, /export const dynamic = "force-static";/, datei);
  }
});

test("Impressum, Datenschutz, Seiten mit eigenen Parametern und das Layout bleiben ohne generateStaticParams", () => {
  for (const datei of [...MIT_SECRET, ...EIGENE_PARAMETER, "app/[lang]/layout.tsx"]) {
    assert.doesNotMatch(lies(datei), /generateStaticParams/, datei);
  }
});

function seiten(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name).split("\\").join("/");
    if (statSync(pfad).isDirectory()) return seiten(pfad);
    return name === "page.tsx" ? [pfad] : [];
  });
}

test("Jede force-static-Seite ist vorgerendert oder bewusst ausgenommen", () => {
  const statisch = seiten("app/[lang]").filter((datei) => /export const dynamic = "force-static";/.test(lies(datei)));
  assert.deepEqual(statisch.sort(), [...VORGERENDERT, ...MIT_SECRET, ...EIGENE_PARAMETER].sort());
});

/**
 * Wer im Render-Baum einer vorgerenderten Seite ein Secret liest, bekommt im Build nur den
 * Platzhalter und liefert ihn bis zur nächsten Revalidierung aus. Die Definitionen selbst
 * (lib/cloudflare.ts, lib/rechtliches.ts) zählen nicht, nur Aufrufe anderswo.
 */
test("Vorgerenderte Seiten lesen beim Rendern keine Secrets (auch transitiv)", () => {
  const definitionen = new Set(["lib/cloudflare.ts", "lib/rechtliches.ts"]);
  const baum = importbaum([...VORGERENDERT, "app/[lang]/layout.tsx"]);
  assert.ok(baum.size > VORGERENDERT.length, "Importbaum wurde nicht aufgelöst");
  for (const [datei, quelle] of baum) {
    if (definitionen.has(datei)) continue;
    assert.doesNotMatch(ohneKommentare(quelle), /requireVar\(|ladeRechtliches\(/, datei);
  }
});

// --- scripts/cf-build.mjs: Entscheidung ohne echte Prozesse ---

import { anzahlAusJson, brichtAb, buildEnv, sollVorrendern, trenneTrigger, ziehAbzug } from "../scripts/cf-build.mjs";
import { sprachTags } from "@/lib/i18n/revalidiere";

type Lauf = { status: number; stdout: string };

function stub(antworten: Partial<Record<"export" | "import" | "pruef", Lauf>>) {
  const aufrufe: string[] = [];
  const geloescht: string[] = [];
  const fuehreAus = (_b: string, args: string[]): Lauf => {
    const art = args.includes("export") ? "export" : args.includes("--file") ? "import" : "pruef";
    aufrufe.push(art);
    return antworten[art] ?? { status: 0, stdout: "" };
  };
  const ergebnis = ziehAbzug(fuehreAus, {
    verzeichnis: "x",
    loesche: (p: string) => geloescht.push(p),
    lies: () => SCHEMA,
    schreibe: () => {},
  });
  return { ergebnis, aufrufe, geloescht };
}

const SCHEMA = [
  'CREATE TABLE "strains" ("id" TEXT, "kultivar_id" TEXT REFERENCES "kultivare" ("id"));',
  "CREATE TRIGGER strains_check BEFORE INSERT ON strains",
  "begin",
  "  select case when NEW.id is null then raise(abort, 'x') end;",
  "end;",
  'CREATE TABLE "kultivare" ("id" TEXT);',
].join("\n");

const OK_JSON = { status: 0, stdout: JSON.stringify([{ results: [{ n: 42 }], success: true }]) };

test("cf-build: Abzug nur im Workers Build oder mit VORRENDERN_DATEN=1", () => {
  assert.equal(sollVorrendern({}), false);
  assert.equal(sollVorrendern({ WORKERS_CI: "1" }), true);
  assert.equal(sollVorrendern({ VORRENDERN_DATEN: "1" }), true);
  assert.equal(sollVorrendern({ WORKERS_CI: "0" }), false);
});

test("cf-build: ohne Abzug bricht nur der Workers Build ab (Spec 2026-10-21, 5)", () => {
  assert.equal(brichtAb({ WORKERS_CI: "1" }, false), true);
  assert.equal(brichtAb({ WORKERS_CI: "1" }, true), false);
  assert.equal(brichtAb({ VORRENDERN_DATEN: "1" }, false), false);
  assert.equal(brichtAb({}, false), false);
});

test("cf-build: Export, Import und Prüfung ok → Env mit VORRENDERN=1", () => {
  const { ergebnis, aufrufe, geloescht } = stub({ pruef: OK_JSON });
  assert.equal(ergebnis.ok, true);
  assert.deepEqual(aufrufe, ["export", "export", "import", "import", "import", "pruef"]);
  assert.equal(geloescht.length, 1, "alte lokale D1 vor dem Import verworfen");
  assert.equal(buildEnv({ A: "b" }, ergebnis.ok).VORRENDERN, "1");
});

test("cf-build: Export scheitert → kein Import, Env ohne VORRENDERN", () => {
  const { ergebnis, aufrufe, geloescht } = stub({ export: { status: 1, stdout: "" } });
  assert.equal(ergebnis.ok, false);
  assert.deepEqual(aufrufe, ["export"]);
  assert.equal(stub({ export: { status: 1, stdout: "" } }).geloescht.length, 0);
  assert.deepEqual(geloescht, [], "lokale D1 bleibt unberührt");
  assert.equal(buildEnv({ VORRENDERN: "1" }, ergebnis.ok).VORRENDERN, undefined);
});

test("cf-build: Import scheitert oder leere DB → ohne VORRENDERN", () => {
  assert.equal(stub({ import: { status: 1, stdout: "" } }).ergebnis.ok, false);
  const leer = { status: 0, stdout: JSON.stringify([{ results: [{ n: 0 }] }]) };
  assert.equal(stub({ pruef: leer }).ergebnis.ok, false);
  assert.equal(stub({ pruef: { status: 0, stdout: "Müll" } }).ergebnis.ok, false);
});

test("cf-build: Trigger getrennt, inneres end; der CASE-Klausel zählt nicht als Ende", () => {
  const { ohneTrigger, trigger } = trenneTrigger(SCHEMA);
  assert.doesNotMatch(ohneTrigger, /TRIGGER|begin|raise/);
  assert.match(ohneTrigger, /CREATE TABLE "kultivare"/);
  assert.match(trigger, /^CREATE TRIGGER strains_check[\s\S]*raise\(abort, 'x'\) end;\nend;$/);
});

test("cf-build: anzahlAusJson verträgt Vorspann vor dem JSON", () => {
  assert.equal(anzahlAusJson(`Hinweis\n${OK_JSON.stdout}`), 42);
  assert.equal(anzahlAusJson(""), null);
});

test("cf-build: package.json ruft das Script", () => {
  assert.match(lies("package.json"), /"cf-build": "node scripts\/cf-build\.mjs"/);
});

// --- Revalidierung: stale statt abgelaufen ---

test("sprachTags: dieselben impliziten Tags wie revalidatePath", () => {
  assert.deepEqual(sprachTags("/"), ["_N_T_/de", "_N_T_/en"]);
  assert.deepEqual(sprachTags("/admin"), ["_N_T_/de/admin", "_N_T_/en/admin"]);
  assert.deepEqual(sprachTags("/reviews", "layout"), ["_N_T_/de/reviews/layout", "_N_T_/en/reviews/layout"]);
  assert.deepEqual(sprachTags("/", "layout"), ["_N_T_/de/layout", "_N_T_/en/layout"]);
});

test("revalidiereSprachen nutzt revalidateTag mit Profil max, nicht revalidatePath", () => {
  const quelle = ohneKommentare(lies("lib/i18n/revalidiere.ts"));
  assert.match(quelle, /revalidateTag\(tag, "max"\)/);
  assert.doesNotMatch(quelle, /revalidatePath/);
});
