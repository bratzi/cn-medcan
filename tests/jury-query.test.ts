import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import { zuKarte } from "@/lib/query/jury";

test("zuKarte: Titelbild = erstes Bild nach Position, Sorte aus der Bewertung", () => {
  const k = zuKarte({
    slug: "gelato", titel: "Gelato", anriss: "a", veroeffentlichtAm: new Date("2026-10-20"),
    autor: { anzeigename: "Wal", kurzId: "abc", profilOeffentlich: true },
    bilder: [{ id: "b2", position: 1, breite: 1, hoehe: 1, symbolbild: false, alt: "" }, { id: "b1", position: 0, breite: 1, hoehe: 1, symbolbild: true, alt: "" }],
    review: { kultivar: { name: "Gelato", slug: "gelato" } },
  });
  assert.equal(k.titelbild?.id, "b1");
  assert.deepEqual(k.sorte, { name: "Gelato", slug: "gelato" });
  assert.deepEqual(k.autor, { name: "Wal", kurzId: "abc" });
});

test("zuKarte: privates Profil ohne kurzId", () => {
  const k = zuKarte({ slug: "x", titel: "x", anriss: "", veroeffentlichtAm: new Date(), autor: { anzeigename: "A", kurzId: "k", profilOeffentlich: false }, bilder: [], review: null });
  assert.equal(k.autor.kurzId, null);
  assert.equal(k.titelbild, null);
});
