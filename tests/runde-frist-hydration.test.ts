import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { nimmtVorschlaegeAn, vorschlagFristPruefen } from "@/lib/umfrage-eingabe";

function quelle(datei: string): string {
  return readFileSync(join(process.cwd(), datei), "utf8");
}

// 27.09.2026, 10:00 in Berlin (CEST, UTC+2).
const JETZT = new Date("2026-09-27T08:00:00Z");

test("Vorschlagsfrist: leer ist erlaubt und wird null", () => {
  assert.deepEqual(vorschlagFristPruefen("", JETZT), { ok: true, wert: null });
  assert.deepEqual(vorschlagFristPruefen("   ", JETZT), { ok: true, wert: null });
});

test("Vorschlagsfrist: gilt bis zum Ende des Tages in Berlin (Sommerzeit)", () => {
  const e = vorschlagFristPruefen("2026-10-05", JETZT);
  assert.ok(e.ok);
  assert.equal(e.wert?.toISOString(), "2026-10-05T21:59:59.999Z");
});

test("Vorschlagsfrist: Ende des Tages in Berlin auch in der Winterzeit", () => {
  const e = vorschlagFristPruefen("2026-12-01", JETZT);
  assert.ok(e.ok);
  assert.equal(e.wert?.toISOString(), "2026-12-01T22:59:59.999Z");
});

test("Vorschlagsfrist: heute ist noch erlaubt", () => {
  const e = vorschlagFristPruefen("2026-09-27", JETZT);
  assert.ok(e.ok);
});

test("Vorschlagsfrist: ein vergangener Tag wird abgewiesen", () => {
  const e = vorschlagFristPruefen("2026-09-26", JETZT);
  assert.equal(e.ok, false);
});

test("Vorschlagsfrist: kein gueltiges Datum wird abgewiesen", () => {
  for (const roh of ["2026-02-30", "morgen", "2026-9-5", "27.09.2026"]) {
    assert.equal(vorschlagFristPruefen(roh, JETZT).ok, false, roh);
  }
});

test("Runde anlegen: Formular hat das Feld, die Aktion schreibt es", () => {
  const formular = quelle("components/admin/RundeAnlegenFormular.tsx");
  assert.match(formular, /name="vorschlagBisAm"/);
  assert.match(formular, /type="date"/);

  const aktion = quelle("app/admin/umfrage-aktionen.ts");
  assert.match(aktion, /vorschlagFristPruefen\(/);
  assert.match(aktion, /vorschlagBisAm:/);
});

for (const datei of [
  "components/auth/AnmeldeFormular.tsx",
  "components/auth/RegistrierFormular.tsx",
  "components/auth/ProfilFormular.tsx",
]) {
  test(`Hydrationssperre: ${datei} sperrt Absenden bis zur Hydration`, () => {
    const q = quelle(datei);
    assert.match(q, /useHydriert\(\)/);
    assert.match(q, /disabled=\{!hydriert \|\| laeuft\}/);
  });
}

test("nimmtVorschlaegeAn: nur in der Vorschlagsphase und nur bis zur Frist", () => {
  const jetzt = new Date("2026-10-05T10:00:00Z");
  assert.equal(nimmtVorschlaegeAn({ phase: "VORSCHLAG", vorschlagBisAm: null }, jetzt), true);
  assert.equal(nimmtVorschlaegeAn({ phase: "VORSCHLAG", vorschlagBisAm: new Date("2026-10-06T00:00:00Z") }, jetzt), true);
  assert.equal(nimmtVorschlaegeAn({ phase: "VORSCHLAG", vorschlagBisAm: new Date("2026-10-01T21:59:59Z") }, jetzt), false);
  assert.equal(nimmtVorschlaegeAn({ phase: "ABSTIMMUNG", vorschlagBisAm: null }, jetzt), false);
});
