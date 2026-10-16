import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { BildVerwaltung } from "@/components/admin/jury/BildVerwaltung";
import { AusgabenVerwaltung } from "@/components/admin/jury/AusgabenVerwaltung";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

/** useRouter verlangt einen eingehängten App Router; im Test genügt ein leerer. */
function zeige(element: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: {} as never }, element));
}

const bild = (i: number) => ({ id: `b${i}`, breite: 10, hoehe: 10, symbolbild: false, alt: "" });

test("BildVerwaltung: Upload nur unter JURY_BILDER_MAX", () => {
  const voll = zeige(createElement(BildVerwaltung, { beitragId: "x", bilder: [0, 1, 2, 3, 4].map(bild), texte: de.admin.jury }));
  assert.doesNotMatch(voll, /type="file"/);
  const frei = zeige(createElement(BildVerwaltung, { beitragId: "x", bilder: [0, 1, 2, 3].map(bild), texte: de.admin.jury }));
  assert.match(frei, /type="file"/);
  assert.match(frei, /aria-label="[^"]*Symbolbild/);
});

test("BildVerwaltung: jedes Bild hat vier benannte Knöpfe", () => {
  const html = zeige(createElement(BildVerwaltung, { beitragId: "x", bilder: [0, 1].map(bild), texte: de.admin.jury }));
  for (const nr of [1, 2]) {
    for (const was of ["nach vorn", "nach hinten", "Symbolbild", "löschen"]) {
      assert.match(html, new RegExp(`aria-label="[^"]*Bild ${nr}[^"]*${was}|aria-label="[^"]*${was}[^"]*Bild ${nr}`), `${was} ${nr}`);
    }
  }
});

test("AusgabenVerwaltung: Formular und Liste", () => {
  const ausgabe = { id: "a1", slug: "heft-1", titel: "Heft eins", einleitung: "", erscheintAm: null, status: "ENTWURF", beitraege: 2 };
  const html = zeige(createElement(AusgabenVerwaltung, { ausgaben: [ausgabe], texte: de.admin.jury }));
  assert.match(html, /name="titel"/);
  assert.match(html, /Heft eins/);
  assert.match(html, new RegExp(de.admin.jury.ausgabeVeroeffentlichen));
});

test("Admin-Texte: de und en gleich aufgebaut, ohne Gedankenstrich", () => {
  assert.deepEqual(Object.keys(en.admin.jury).sort(), Object.keys(de.admin.jury).sort());
  assert.doesNotMatch(JSON.stringify(de.admin.jury), /[–—]/);
});
