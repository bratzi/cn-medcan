import { test } from "node:test";
import assert from "node:assert/strict";

import { profilAusDaten, profilDaten, leereProfilWerte } from "@/lib/profil";
import { verlaufAusDaten, verlaufDaten } from "@/lib/profil-verlauf";

test("Speichern und Lesen: Terpen-Netz als Objekt", () => {
  const w = { ...leereProfilWerte(), terpenNetz: { ...leereProfilWerte().terpenNetz, linalool: 1, myrcen: -0.5 }, anzahl: 2, gewichtet: 2 };
  const z = profilDaten(w);
  assert.deepEqual(profilAusDaten(z).terpenNetz, w.terpenNetz);
});

test("Alte Zeile mit Liste: Netz aus der Liste (Review Focus 1)", () => {
  const z = { geschmack: "{}", terpene: JSON.stringify([{ name: "Limonen", wert: 0.5 }, { name: "Humulen", wert: -0.5 }]), anzahl: 3, gewichtet: 3 };
  const n = profilAusDaten(z).terpenNetz;
  assert.equal(n.limonen, 1);
  assert.equal(n.humulen, -1);
});

test("Kaputtes JSON: leeres Terpen-Netz, kein Fehler", () => {
  const n = profilAusDaten({ geschmack: "x", terpene: "{kaputt", anzahl: 0, gewichtet: 0 }).terpenNetz;
  assert.ok(Object.values(n).every((x) => x === 0));
});

test("Verlauf: Schritt trägt terpene, alter Schritt ohne bleibt lesbar", () => {
  const alt = verlaufAusDaten(JSON.stringify([{ anzahl: 1, datum: "2026-10-01T00:00:00.000Z", geschmack: { ZITRUS: 1 } }]));
  assert.equal(alt[0].terpene, undefined);
  const neu = verlaufAusDaten(JSON.stringify([{ anzahl: 1, datum: "2026-10-01T00:00:00.000Z", geschmack: {}, terpene: { linalool: 1 } }]));
  assert.equal(neu[0].terpene?.linalool, 1);
  assert.equal(verlaufAusDaten(verlaufDaten(neu))[0].terpene?.linalool, 1);
});
