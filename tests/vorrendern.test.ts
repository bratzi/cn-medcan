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
