import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { terpeneNachtragen } from "@/lib/vorschlag-eingabe";

const lies = (pfad: string) => readFileSync(pfad, "utf8");

// Review Important 1: bricht die Freigabe nach dem Anlegen ab, holt ein zweiter
// Klick die Terpene nach, statt sie still zu verlieren.
test("terpeneNachtragen: neu angelegt oder gleiche Id ohne Terpene, sonst nicht", () => {
  assert.equal(terpeneNachtragen({ gewaehlt: 2, neuAngelegt: true, gleicheId: false, vorhandeneTerpene: 0 }), true);
  assert.equal(terpeneNachtragen({ gewaehlt: 2, neuAngelegt: false, gleicheId: true, vorhandeneTerpene: 0 }), true);
  // Import-Bluete mit eigenen Terpenen wird nicht ueberschrieben
  assert.equal(terpeneNachtragen({ gewaehlt: 2, neuAngelegt: false, gleicheId: true, vorhandeneTerpene: 3 }), false);
  assert.equal(terpeneNachtragen({ gewaehlt: 0, neuAngelegt: true, gleicheId: false, vorhandeneTerpene: 0 }), false);
});

test("Freigabe nutzt terpeneNachtragen ausserhalb des Anlegen-Zweigs", () => {
  const quelle = lies("app/admin/vorschlag-aktionen.ts");
  assert.match(quelle, /terpeneNachtragen\(/);
  assert.match(quelle, /strainTerpen\.count\(/);
});

// Review Important 2: der Zaehler laedt bei Seitenwechsel und nach An-/Abmelden neu.
test("KontoZaehler laedt bei Navigation und nach An- und Abmelden neu", () => {
  const zaehler = lies("components/layout/KontoZaehler.tsx");
  assert.match(zaehler, /usePathname\(\)/);
  assert.match(zaehler, /\[pfad, neuLaden\]/);
  assert.match(zaehler, /ZAEHLER_NEU/);
  for (const datei of ["components/auth/AnmeldeFormular.tsx", "components/auth/AbmeldeButton.tsx", "components/auth/RegistrierFormular.tsx"]) {
    assert.match(lies(datei), /zaehlerZuruecksetzen\(\)/, datei);
  }
});

// Review Minor 3, hochgestuft: eine Antwort, die nach "gelesen" ankommt, gilt nicht mehr.
test("KontoZaehler verwirft Antworten, die vor dem Gelesen-Markieren gestartet sind", () => {
  const zaehler = lies("components/layout/KontoZaehler.tsx");
  assert.match(zaehler, /stand\.current/);
});
