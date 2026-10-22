import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const QUELLE = readFileSync(join(process.cwd(), "app/[lang]/blueten/[slug]/sorten-inhalt.tsx"), "utf8");

test("Produktseite: Rückweg als 44-px-Einzellink", () => {
  assert.match(QUELLE, /className=\{einzelLinkKlassen\(\)\}>\s*\{w\.bluete\.alleBlueten\}/);
});

test("Produktseite: die Bewertungsmaske sitzt am Anker #bewerten, kein Link führt mehr auf /bewerten", () => {
  assert.match(QUELLE, /id="bewerten"/);
  // Statisch als Gast: die Maske tauscht die Insel ein (Spec 2026-10-21, Seiten aus Assets, 3.3).
  assert.doesNotMatch(QUELLE, /<BewertungsFormular\b/);
  assert.match(QUELLE, /<BewertenInsel\b/);
  // Der Budpic-Zugang im Titelblatt fragt dieselbe Antwort wie die Maske.
  // Ohne Vertreiber, wie BewertenInsel (Plan 2026-10-22): ein Abruf je Seite.
  assert.match(QUELLE, /insel: \{ kultivarId: sorte\.kultivar\.id, vertreiberId: null \}/);
  // Der zweite Weg ("Erste Bewertung abgeben") steht seit T7 über dem Buch: tests/buch.test.ts.
  assert.equal(QUELLE.match(/href="#bewerten"/g)?.length, 1);
  assert.doesNotMatch(QUELLE, /["`]\/bewerten\//);
  // Gäste kommen nach dem Anmelden zurück an die Maske: das Fragment steckt kodiert im Ziel.
  assert.match(QUELLE, /\/anmelden\?weiter=\$\{encodeURIComponent\(`\$\{basis\}#bewerten`\)\}/);
});

test("Produktseite: keine Hilfszeile, die auf nicht gezeigte Ränge verweist", () => {
  assert.doesNotMatch(QUELLE, /Rang 1 ist das dominante Terpen/);
});

test("Angaben zur Blüte stehen oben, als ein Block mit dem Terpenprofil (Nutzer 2026-10-05)", () => {
  // Ein Block, nicht gesplittet: Fakten, Wirkstoffspannen und Profil gehören zusammen.
  assert.match(QUELLE, /<TerpenProfil/);
  // Terpen-Chips entfallen: dieselbe Information nicht zweimal in zwei Formen.
  assert.doesNotMatch(QUELLE, /<TerpenChips/);
  // Nicht doppelt: der Sortenkopf der Erkundung wiederholt hier das Titelblatt, also nur
  // auf der Startseite.
  assert.doesNotMatch(QUELLE, /<SortenKopf/);
  // Der Block steht vor dem Bewertungsbuch und damit weit vor dem Rating.
  assert.ok(QUELLE.indexOf("{angabenZurBluete}") < QUELLE.indexOf("<BewertungsBuch"));
  // Die Erkundung steckt im Block, den die Bewerten-Insel für Gäste und Mitglieder zeigt.
  assert.ok(QUELLE.indexOf("{angabenZurBluete}") < QUELLE.indexOf("{erkundungsBlock}"));
});

test("Bewerten-Kopf: die Insel tauscht ihn für Freigegebene wie vor dem Umbau, id bleibt", () => {
  assert.match(QUELLE, /kopfFreigegeben=\{<SektionsKopf id="bewerten-titel" titel=\{texte\.bewerten\} satz=\{w\.bewerten\.satz\} \/>\}/);
  assert.match(QUELLE, /kopfVorbelegt=\{<SektionsKopf id="bewerten-titel" titel=\{texte\.deineBewertung\} satz=\{w\.bewerten\.satz\} \/>\}/);
  assert.match(QUELLE, /kopfGast=\{\s*<SektionsKopf\s+id="bewerten-titel"/);
  const insel = readFileSync(join(process.cwd(), "components/sorte/BewertenInsel.tsx"), "utf8");
  assert.ok(insel.includes("ich.vorbelegung ? kopfVorbelegt : kopfFreigegeben"));
});

test("Keine Vertreiber-Auswahl auf der Strain-Seite: kein Buchfilter, keine Leiste (Plan 2026-10-22)", () => {
  assert.doesNotMatch(QUELLE, /auswahlQuery|HerstellerLeiste|alle: "1"|vertreiber=/);
  assert.match(QUELLE, /ladeSortenBewertungen\(sorte\.kultivar\.id, null\)/);
  assert.match(readFileSync(join(process.cwd(), "components/review/BewertungsBuch.tsx"), "utf8"), /id="bewertungen-titel" className="scroll-mt-\[calc\(var\(--kopf-h,4rem\)\+2rem\)\] /);
});
