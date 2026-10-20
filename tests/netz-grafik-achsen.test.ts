import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { NetzGrafik, terpenAchsen } from "@/components/profil/NetzGrafik";
import { bluetenKreis, farbKreis, vollFarbe } from "@/lib/aroma-farben";

test("farbKreis: gleiche Ausgabe wie bluetenKreis für Geschmäcker", () => {
  assert.equal(bluetenKreis(["ZITRUS", "ERDIG"]), farbKreis([vollFarbe("ZITRUS"), vollFarbe("ERDIG")]));
});

test("NetzGrafik mit Terpen-Achsen: elf Marken, Limonen in der Farbe von Zitrus", () => {
  const html = renderToStaticMarkup(
    createElement(NetzGrafik, { mag: Array(11).fill(2), magNicht: Array(11).fill(0), marken: true, achsen: terpenAchsen() }),
  );
  assert.equal((html.match(/netz-marke /g) ?? []).length, 11);
  assert.ok(html.includes(`--netz-farbe:${vollFarbe("ZITRUS")}`));
});
