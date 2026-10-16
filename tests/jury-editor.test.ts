import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup as rendere } from "react-dom/server";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { BeitragEditor } from "@/components/jury/BeitragEditor";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

/** useRouter verlangt einen eingehängten App Router; im Test genügt ein leerer. */
function zeige(props: ComponentProps<typeof BeitragEditor>): string {
  return rendere(createElement(AppRouterContext.Provider, { value: {} as never }, createElement(BeitragEditor, props)));
}

const BEWERTUNGEN = [{ id: "r1", label: "Gelato über Alpha" }];

test("Editor: Felder mit Labels, Zeichenzähler, Bewertung wählbar, Vorschau", () => {
  const html = zeige({ beitrag: null, bewertungen: BEWERTUNGEN, texte: de.profil.jury });
  for (const name of ["titel", "anriss", "text", "reviewId"]) assert.match(html, new RegExp(`name="${name}"`));
  assert.match(html, /<label[^>]*for=/);
  assert.match(html, /Gelato über Alpha/);
  assert.match(html, /maxLength="90"|maxlength="90"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-live="polite"/);
});

test("Editor: Einreichen nur bei gespeichertem Entwurf", () => {
  const neu = zeige({ beitrag: null, bewertungen: [], texte: de.profil.jury });
  assert.doesNotMatch(neu, new RegExp(de.profil.jury.einreichen));
  const beitrag = { id: "b1", slug: "x", titel: "Titel", anriss: "", text: "Text", reviewId: "r1", notiz: "Bitte kürzen" };
  const html = zeige({ beitrag, bewertungen: BEWERTUNGEN, texte: de.profil.jury });
  assert.match(html, new RegExp(de.profil.jury.einreichen));
  assert.match(html, /Bitte kürzen/);
  assert.match(html, /value="Titel"/);
});

test("Jury-Texte: de und en gleich aufgebaut, ohne Gedankenstrich", () => {
  assert.deepEqual(Object.keys(en.profil.jury).sort(), Object.keys(de.profil.jury).sort());
  assert.doesNotMatch(JSON.stringify([de.profil.jury, en.profil.jury]), /[–—]/);
});

test("Editor: frisch gespeichert zeigt die Meldung gleich beim Aufbau", () => {
  const beitrag = { id: "b1", slug: "x", titel: "T", anriss: "", text: "Text", reviewId: null, notiz: null };
  const html = zeige({ beitrag, bewertungen: [], texte: de.profil.jury, frischGespeichert: true });
  assert.match(html, /Entwurf gespeichert\./);
  assert.doesNotMatch(zeige({ beitrag, bewertungen: [], texte: de.profil.jury }), /Entwurf gespeichert\./);
});

test("Liste: nach dem Einreichen steht die Bestätigung da", async () => {
  const { EigeneBeitraege } = await import("@/components/jury/EigeneBeitraege");
  const props = { beitraege: [], bewertungen: [], offen: null, texte: de.profil.jury };
  const mit = rendere(createElement(AppRouterContext.Provider, { value: {} as never }, createElement(EigeneBeitraege, { ...props, eingereicht: true })));
  assert.match(mit, /Eingereicht\. Wir melden uns/);
  const ohne = rendere(createElement(AppRouterContext.Provider, { value: {} as never }, createElement(EigeneBeitraege, props)));
  assert.doesNotMatch(ohne, /Eingereicht\. Wir melden uns/);
});
