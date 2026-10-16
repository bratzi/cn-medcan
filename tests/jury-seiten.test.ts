import "./server-only-stub";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BildBuehne } from "@/components/jury/BildBuehne";
import { JuryText } from "@/components/jury/JuryText";
import { de } from "@/lib/i18n/de";
import { juryTextBloecke } from "@/lib/jury-text";

test("JuryText: Zwischentitel als h2, Liste als ul, fett als strong, kein HTML", () => {
  const html = renderToStaticMarkup(createElement(JuryText, { bloecke: juryTextBloecke("## Nase\n\n**Beere** <b>x</b>\n\n- a\n- b") }));
  assert.match(html, /<h2[^>]*>Nase<\/h2>/);
  assert.match(html, /<strong>Beere<\/strong>/);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
  assert.match(html, /<ul[^>]*>.*<li[^>]*>a<\/li>/);
});

test("BildBuehne: Symbolbild gekennzeichnet, Bilder im Rahmen", () => {
  const html = renderToStaticMarkup(createElement(BildBuehne, { bilder: [{ id: "b1", breite: 800, hoehe: 1200, symbolbild: true, alt: "" }], name: "Gelato", texte: de.jury }));
  assert.match(html, /object-contain/);
  assert.match(html, /Symbolbild/);
});

test("BildBuehne: Daumenleiste nur bei mehreren Bildern, Rahmen ohne Bild", () => {
  const bild = (id: string) => ({ id, breite: 800, hoehe: 1200, symbolbild: false, alt: "" });
  const mehrere = renderToStaticMarkup(createElement(BildBuehne, { bilder: [bild("a"), bild("b")], name: "Gelato", texte: de.jury }));
  assert.match(mehrere, /Bild 2 zeigen/);
  const eins = renderToStaticMarkup(createElement(BildBuehne, { bilder: [bild("a")], name: "Gelato", texte: de.jury }));
  assert.doesNotMatch(eins, /Bild 1 zeigen/);
  const keins = renderToStaticMarkup(createElement(BildBuehne, { bilder: [], name: "Gelato", texte: de.jury }));
  assert.match(keins, /Kein Bild/);
});

test("Favourites sortieren nach Datum, nie nach Note", () => {
  const q = readFileSync("lib/query/jury.ts", "utf8");
  assert.match(q, /ladeJuryFavourites[\s\S]*?orderBy: \{ veroeffentlichtAm: "desc" \}/);
  assert.doesNotMatch(q, /orderBy:[^\n]*gesamtnote/);
});

test("Navigation enthält /jury", () => {
  assert.match(readFileSync("lib/navigation.ts", "utf8"), /href: "\/jury"/);
});

test("Seiten sind statisch und tragen den HWG-Hinweis", () => {
  for (const datei of [
    "app/[lang]/jury/page.tsx",
    "app/[lang]/jury/[slug]/page.tsx",
    "app/[lang]/jury/ausgabe/[slug]/page.tsx",
    "app/[lang]/jury/favourites/page.tsx",
    "app/[lang]/jury/team/page.tsx",
  ]) {
    const q = readFileSync(datei, "utf8");
    assert.match(q, /export const revalidate = 86400;/, datei);
    assert.match(q, /export const dynamic = "force-static";/, datei);
    assert.match(q, /JuryRahmen|JurySeite/, datei);
  }
  assert.match(readFileSync("components/jury/JuryRahmen.tsx", "utf8"), /<JuryFuss/);
  assert.match(readFileSync("components/jury/JuryFuss.tsx", "utf8"), /texte\.hwg/);
  assert.equal(de.jury.hwg, "Erfahrungsberichte zu Aussehen, Geruch und Geschmack. Keine Aussagen zur Wirkung.");
});

test("Wording: nie Ware, nie Stärke in den Jury-Texten", () => {
  const texte = JSON.stringify(de.jury);
  assert.doesNotMatch(texte, /\bWare\b|Stärke/);
});
