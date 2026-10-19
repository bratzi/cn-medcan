import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AufgabenKacheln } from "@/components/admin/AufgabenKacheln";
import { PostKalender } from "@/components/admin/PostKalender";
import { kalenderBauen } from "@/lib/admin-kalender";

test("Kacheln: Zahl, Strich bei Fehler, Link je Bereich", () => {
  const html = renderToStaticMarkup(createElement(AufgabenKacheln, { zaehler: { gemeldet: 3, budpics: null } }));
  assert.match(html, /href="\/admin\/gemeldet"[\s\S]*?>3</);
  assert.match(html, /href="\/admin\/budpics"[\s\S]*?–/);
  assert.ok(html.indexOf("/admin/gemeldet") < html.indexOf("/admin/bewertungen"));
});

test("Kalender: veraltet zeigt Hinweis statt Liste", () => {
  const html = renderToStaticMarkup(createElement(PostKalender, { kalender: kalenderBauen([], null) }));
  assert.match(html, /Kalender veraltet, Routine prüfen/);
});

test("Kalender: Tag, Uhrzeit Berlin, Art, Status", () => {
  const k = kalenderBauen([{ id: "a", gruppe: "a", plattform: "instagram", art: "reel", status: "scheduled", geplantAm: "2026-10-20T17:00:00Z", titel: "So bewerten wir" }], "2026-10-16T04:00:00Z", new Date("2026-10-16T10:00:00Z"));
  const html = renderToStaticMarkup(createElement(PostKalender, { kalender: k }));
  assert.match(html, /19:00/);
  assert.match(html, /Reel/);
  assert.match(html, /So bewerten wir/);
  assert.match(html, /geplant/);
});
