import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { NotenLeiste } from "@/components/review/NotenLeiste";
import { de } from "@/lib/i18n/de";
import { eintrag } from "./hilfen/eintrag";

const zeige = (ohneWirkung: boolean) =>
  renderToStaticMarkup(createElement(NotenLeiste, { eintrag: eintrag(), w: de, sprache: "de", ohneWirkung }));

test("NotenLeiste: Auszug ohne Wirkung (Regel 9), voller Eintrag mit", () => {
  const label = de.schema.noten.wirkung.label;
  assert.match(zeige(false), new RegExp(`<dt[^>]*>${label}</dt>`));
  assert.doesNotMatch(zeige(true), new RegExp(`<dt[^>]*>${label}</dt>`));
  assert.equal((zeige(true).match(/<dt/g) ?? []).length, 4);
});

test("NotenLeiste: Zellen zentriert unter dem Urteil (Nutzer 2026-10-09)", () => {
  const html = zeige(false);
  assert.match(html, /<div class="flex min-w-0 flex-col items-center gap-1 text-center">/);
  assert.match(html, /<dd class="flex flex-col items-center gap-2">/);
});
