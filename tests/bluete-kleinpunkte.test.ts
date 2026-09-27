// Kleinpunkte aus dem Review "Blüte vorschlagen" (HANDOFF Session 18, Welle W1-C).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { gelesenIdsPruefen, MAX_BENACHRICHTIGUNGEN } from "@/lib/benachrichtigung";
import { D1_HAEPPCHEN, inHaeppchen } from "@/lib/haeppchen";
import { unternehmensSchluessel } from "@/lib/stamm-id";
import {
  blueteVorschlagPruefen,
  freigabeKonflikt,
  herstellerRolleNachFreigabe,
  vorschlaegeBuendeln,
  vorschlagPfad,
  type OffenerVorschlag,
} from "@/lib/vorschlag-eingabe";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

test("inHaeppchen: D1 erlaubt ~100 Bind-Werte, Haeppchen bleiben bei 90", () => {
  assert.equal(D1_HAEPPCHEN, 90);
  const ids = Array.from({ length: 200 }, (_, i) => `id-${i}`);
  const teile = inHaeppchen(ids);
  assert.deepEqual(teile.map((t) => t.length), [90, 90, 20]);
  assert.deepEqual(teile.flat(), ids);
  assert.deepEqual(inHaeppchen([]), []);
  assert.deepEqual(inHaeppchen([1, 2, 3], 2), [[1, 2], [3]]);
});

test("Vorschlaege werden in Haeppchen geschlossen, nie mit allen Ids auf einmal", () => {
  const quelle = lies("app/admin/vorschlag-aktionen.ts");
  assert.match(quelle, /for \(const teil of inHaeppchen\(/);
  assert.match(quelle, /id: \{ in: teil \}/);
  assert.doesNotMatch(quelle, /id: \{ in: offene\.map/);
});

test("gelesenIdsPruefen: nur Texte, ohne Doppelte, hoechstens so viele wie angezeigt", () => {
  assert.equal(MAX_BENACHRICHTIGUNGEN, 20);
  assert.deepEqual(gelesenIdsPruefen(["a", "b", "a", 3, "", null]), ["a", "b"]);
  assert.deepEqual(gelesenIdsPruefen("a"), []);
  assert.deepEqual(gelesenIdsPruefen(undefined), []);
  const viele = Array.from({ length: 30 }, (_, i) => `n${i}`);
  assert.equal(gelesenIdsPruefen(viele).length, 20);
});

test("Gelesen gilt nur fuer die angezeigten Benachrichtigungen", () => {
  const aktion = lies("app/mitglied/aktionen.ts");
  assert.match(aktion, /export async function benachrichtigungenGelesen\(roh: unknown\)/);
  assert.match(aktion, /id: \{ in: ids \}, mitgliedId: mitglied\.mitgliedId, gelesenAm: null/);
  const seite = lies("app/mitglied/page.tsx");
  assert.match(seite, /<GelesenMarkieren ids=\{ungelesen\} \/>/);
  assert.match(lies("lib/query/benachrichtigungen.ts"), /take: MAX_BENACHRICHTIGUNGEN/);
});

test("unternehmensSchluessel: Wortgrenze wie Python auch hinter Umlauten", () => {
  // Python re: ö ist ein Wortzeichen, "pharma" steht also nicht am Wortende
  assert.equal(unternehmensSchluessel("Nord Pharmaö"), "nord pharmaö");
  assert.equal(unternehmensSchluessel("Grün GmbH"), "grün");
  assert.equal(unternehmensSchluessel("Aurora Pharma GmbH"), "aurora");
  assert.equal(unternehmensSchluessel("Bedrocan International-X"), "bedrocan-x");
});

test("herstellerRolleNachFreigabe: Importeur wird BEIDES, sonst bleibt die Rolle", () => {
  assert.equal(herstellerRolleNachFreigabe("IMPORTEUR"), "BEIDES");
  assert.equal(herstellerRolleNachFreigabe("HERSTELLER"), null);
  assert.equal(herstellerRolleNachFreigabe("BEIDES"), null);
});

test("Freigabe hebt einen gefundenen Importeur auf BEIDES", () => {
  const quelle = lies("app/admin/vorschlag-aktionen.ts");
  assert.match(quelle, /herstellerRolleNachFreigabe\(vorhanden\.rolle\)/);
  assert.match(quelle, /unternehmen\.update\(/);
});

test("freigabeKonflikt: gleiche Id mit anderem Namen ist ein Konflikt (Korrektur wuerde verschluckt)", () => {
  const b = { id: "id-a", slug: "apples-bananas", handelsname: "Apples & Bananas" };
  assert.equal(freigabeKonflikt("id-a", "Apples & Bananas", b), null);
  assert.deepEqual(freigabeKonflikt("id-a", "Apples and Bananas", b), {
    slug: "apples-bananas",
    handelsname: "Apples & Bananas",
  });
  assert.deepEqual(freigabeKonflikt("id-b", "Apples & Bananas", b), {
    slug: "apples-bananas",
    handelsname: "Apples & Bananas",
  });
  assert.equal(freigabeKonflikt("id-a", "X", null), null);
});

test("Freigabe: P2002 beim Anlegen nur hinnehmen, wenn die Bluete mit dieser Id wirklich steht", () => {
  const quelle = lies("app/admin/vorschlag-aktionen.ts");
  assert.match(quelle, /let angelegt = false;/);
  assert.match(quelle, /neuAngelegt: angelegt/);
  assert.match(quelle, /strain\.findUnique\(\{ where: \{ id: strainId \}/);
});

test("Freigabe aus zwei Tabs: doppelte Terpen-Zeilen werfen nicht", () => {
  const quelle = lies("app/admin/vorschlag-aktionen.ts");
  assert.match(quelle, /strainTerpen\.createMany\([\s\S]*?\}\);\s*\} catch \(fehler\) \{\s*(\/\/[^\n]*\n\s*)?if \(!istEindeutigkeitsfehler\(fehler\)\) throw fehler;/);
});

test("Inaktive Blueten: kein Link ins Leere, Freigabe schaltet sie wieder an", () => {
  assert.match(lies("lib/query/vorschlaege.ts"), /select: \{ id: true, slug: true, handelsname: true, aktiv: true \}/);
  assert.match(lies("app/vorschlagen/aktionen.ts"), /if \(vorhanden\?\.aktiv\)/);
  assert.match(lies("app/admin/vorschlag-aktionen.ts"), /data: \{ aktiv: true \}/);
});

test("Doppelvorschlag verlinkt auf Mein Konto", () => {
  assert.match(lies("app/vorschlagen/aktionen.ts"), /schonVorgeschlagen: true/);
  assert.match(lies("components/vorschlag/BlueteVorschlagFormular.tsx"), /href="\/mitglied"/);
});

test("vorschlagPfad: Suchbegriff bleibt erhalten, auch ueber die Anmeldung", () => {
  assert.equal(vorschlagPfad(""), "/vorschlagen");
  assert.equal(vorschlagPfad("Apples & Bananas"), "/vorschlagen?name=Apples%20%26%20Bananas");
  const seite = lies("app/vorschlagen/page.tsx");
  assert.match(seite, /redirect\(`\/anmelden\?weiter=\$\{encodeURIComponent\(vorschlagPfad\(nameVorbelegt\)\)\}`\)/);
});

test("Leeres Suchergebnis zeigt nur einen Vorschlags-Einstieg", () => {
  const katalog = lies("app/produkte/page.tsx");
  assert.match(katalog, /liste\.eintraege\.length > 0 \? \(\s*<p className="text-small text-text-muted">\s*Blüte fehlt\?/);
});

test("Schreibvarianten eines Namens landen in einer Gruppe", () => {
  const varianten = ["Apples & Bananas", "apples bananas", " APPLES-BANANAS ", "Apples/Bananas"];
  const liste: OffenerVorschlag[] = varianten.map((name, i) => {
    const e = blueteVorschlagPruefen({ get: (f: string) => ({ handelsname: name, quelle: "q" })[f] ?? null }, []);
    assert.ok(e.ok);
    return {
      id: `v${i}`,
      mitgliedId: `m${i}`,
      anzeigename: `M${i}`,
      handelsname: e.wert.handelsname,
      schluessel: e.wert.schluessel,
      hersteller: null,
      kultivarName: null,
      kultivarTyp: null,
      thcProzent: null,
      cbdProzent: null,
      terpene: [],
      quelle: "q",
      notiz: null,
      erstelltAm: new Date(2026, 8, 25, i),
    };
  });
  const gruppen = vorschlaegeBuendeln(liste);
  assert.equal(gruppen.length, 1);
  assert.equal(gruppen[0].schluessel, "apples-bananas");
  assert.equal(gruppen[0].vorschlaege.length, 4);
});

test("Hersteller in der Freigabe: bestehende zur Auswahl, neuer Name moeglich", () => {
  assert.match(lies("lib/query/vorschlaege.ts"), /export async function herstellerNamen\(/);
  const liste = lies("components/admin/BlueteVorschlaege.tsx");
  assert.match(liste, /<datalist id=\{HERSTELLER_LISTE\}>/);
  assert.match(lies("components/admin/BlueteFreigabe.tsx"), /list=\{herstellerListe\}/);
});
