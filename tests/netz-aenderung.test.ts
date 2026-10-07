import { test } from "node:test";
import assert from "node:assert/strict";

import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import type { Geschmack } from "@/lib/profil-typen";

const leer = (): Geschmack => Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])) as Geschmack;

test("netzAenderung: die zwei größten Differenzen, größte zuerst", () => {
  const nachher = { ...leer(), FRUCHTIG: 0.6, ERDIG: -0.3, ZITRUS: 0.1 };
  assert.deepEqual(netzAenderung(leer(), nachher), [
    { achse: "FRUCHTIG", differenz: 0.6 },
    { achse: "ERDIG", differenz: -0.3 },
  ]);
});

test("netzAenderung: unter der Schwelle zählt nicht, gleicher Stand ergibt leere Liste", () => {
  const g = { ...leer(), SUESS: 0.5 };
  assert.deepEqual(netzAenderung(g, { ...g, SUESS: 0.54 }), []);
  assert.deepEqual(netzAenderung(g, g), []);
});

test("netzAenderung: Gleichstand nach Achsenreihenfolge, stabil", () => {
  const a = netzAenderung(leer(), { ...leer(), HOLZIG: 0.4, ZITRUS: 0.4 });
  assert.deepEqual(a.map((x) => x.achse), ["ZITRUS", "HOLZIG"]);
});

test("aenderungsListe: stärker und schwächer mit Achsennamen", () => {
  const text = aenderungsListe(
    [{ achse: "FRUCHTIG", differenz: 0.6 }, { achse: "ERDIG", differenz: -0.3 }],
    de.label.geschmack,
    { staerker: de.profil.staerker, schwaecher: de.profil.schwaecher },
  );
  assert.equal(text, "Fruchtig stärker, Erdig schwächer");
});
