import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { buttonKlassen } from "@/components/ui/Button";
import { Blatt } from "@/components/ui/Blatt";
import { EmptyState } from "@/components/ui/EmptyState";
import { Faktenliste } from "@/components/ui/Faktenliste";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  type TableProps,
} from "@/components/ui/Table";
import { namenLinkKlassen, textLinkKlassen } from "@/components/ui/textlink";

test("Buttons sind Pillen", () => {
  for (const variante of ["primary", "secondary", "ghost"] as const) {
    assert.match(buttonKlassen(variante), /\brounded-full\b/);
  }
});

test("Hover über Farbe statt Deckkraft", () => {
  assert.match(buttonKlassen("primary"), /\bhover:bg-accent-hover\b/);
  for (const variante of ["primary", "secondary", "ghost"] as const) {
    assert.doesNotMatch(buttonKlassen(variante), /hover:opacity/);
  }
});

test("Touch-Ziel md bleibt 44 px hoch", () => {
  assert.match(buttonKlassen("primary", "md"), /\bh-11\b/);
});

test("Sekundärbutton behält seinen sichtbaren Rahmen", () => {
  // border-transparent aus der Basis schlägt im CSS border-border-strong.
  assert.match(buttonKlassen("secondary"), /\bborder-border-strong\b/);
  assert.doesNotMatch(buttonKlassen("secondary"), /\bborder-transparent\b/);
});

test("Badge bricht als Pille nicht um", () => {
  const html = renderToStaticMarkup(createElement(Badge, null, "1 Apotheke"));
  assert.match(html, /\brounded-full\b/);
  assert.match(html, /\bwhitespace-nowrap\b/);
});

test("Textlinks: Blattgrün mit Unterstrich, Hover über Farbe", () => {
  const klassen = textLinkKlassen();
  assert.match(klassen, /\btext-accent\b/);
  assert.match(klassen, /\bunderline\b/);
  assert.match(klassen, /\bhover:text-accent-hover\b/);
  assert.doesNotMatch(klassen, /opacity/);
});

test("Namenslinks: Tinte, Hover nur über die Unterstrichfarbe", () => {
  const klassen = namenLinkKlassen();
  assert.match(klassen, /\btext-text\b/);
  assert.match(klassen, /\bdecoration-border-strong\b/);
  assert.match(klassen, /\bhover:decoration-text\b/);
  assert.doesNotMatch(klassen, /accent|opacity/);
});

test("Blatt ist eine eckige, erhabene Fläche", () => {
  const html = renderToStaticMarkup(createElement(Blatt, null, "Formular"));
  assert.match(html, /\bbg-surface-raised\b/);
  assert.match(html, /\bborder-border-strong\b/);
  assert.match(html, /\bshadow-md\b/);
  assert.doesNotMatch(html, /rounded/);
});

test("Faktenliste: je Paar ein dt und ein dd", () => {
  const html = renderToStaticMarkup(
    createElement(Faktenliste, {
      zeilen: [
        { begriff: "PZN", wert: "123" },
        { begriff: "Anbauland", wert: "Kanada" },
      ],
    }),
  );
  assert.match(html, /^<dl/);
  assert.equal(html.match(/<dt/g)?.length, 2);
  assert.equal(html.match(/<dd/g)?.length, 2);
});

test("Buchtabelle: kein Rahmen, kein Zebra, kräftige Linie unter dem Kopf", () => {
  const kopf = createElement(TableHead, null, createElement(TableRow, null, createElement(TableHeaderCell, null, "Charge")));
  const rumpf = createElement(TableBody, null, createElement(TableRow, null, createElement(TableCell, null, "A1")));
  const html = renderToStaticMarkup(
    createElement(Table, { caption: "Chargen" } as TableProps, createElement(Fragment, null, kopf, rumpf)),
  );
  assert.doesNotMatch(html, /even:bg-/);
  assert.doesNotMatch(html, /rounded-lg|border border-border/);
  assert.match(html, /border-b-2 border-border-strong/);
  assert.match(html, /overflow-x-auto/);
  assert.match(html, /tabindex="0"/);
});

test("Leerzustand ohne Kasten, Titel in Cormorant", () => {
  const html = renderToStaticMarkup(createElement(EmptyState, { titel: "Noch nichts da." }));
  assert.match(html, /\bfont-buch\b/);
  assert.doesNotMatch(html, /\bborder\b|bg-surface-raised/);
});

test("Badges mit kleinem Text: warning und accent in Tinte, Zustand über Rahmen und Marker", () => {
  const warnung = renderToStaticMarkup(createElement(Badge, { variante: "warning" } as BadgeProps, "Nachbestellt"));
  const akzent = renderToStaticMarkup(createElement(Badge, { variante: "accent" } as BadgeProps, "Deine Stimme"));
  assert.doesNotMatch(warnung, /\btext-warning\b/);
  assert.match(warnung, /\bborder-warning\b/);
  assert.doesNotMatch(akzent, /\btext-accent\b/);
  assert.match(akzent, /\bborder-accent\b/);
});

test("Buchtabelle: der scrollende Rahmen ist eine benannte Region", () => {
  const html = renderToStaticMarkup(
    createElement(Table, { caption: "Chargen" } as TableProps, createElement(TableBody, null)),
  );
  assert.match(html, /<div role="region" aria-label="Chargen" tabindex="0"/);
});

test("Einzelstehende Textlinks sind 44 px hoch", async () => {
  const { einzelLinkKlassen } = await import("@/components/ui/textlink");
  assert.match(einzelLinkKlassen(), /\bmin-h-11\b/);
  assert.match(einzelLinkKlassen(), /\bhover:text-accent-hover\b/);
});
