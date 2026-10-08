import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BlattUrteil } from "@/components/review/BlattUrteil";
import { BuchKolophon } from "@/components/review/BuchKolophon";
import { NotenLeiste } from "@/components/review/NotenLeiste";
import type { EintragDaten } from "@/components/review/eintrag";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { eintrag } from "./hilfen/eintrag";

type Sprache = "de" | "en";
const blatt = (note: number, w: Woerterbuch = de, sprache: Sprache = "de") => renderToStaticMarkup(createElement(BlattUrteil, { note, w, sprache }));
const noten = (teil: Partial<EintragDaten> = {}) => renderToStaticMarkup(createElement(NotenLeiste, { eintrag: eintrag(teil), w: de, sprache: "de" }));
const kolophon = (teil: Partial<EintragDaten> = {}, w: Woerterbuch = de, sprache: Sprache = "de") =>
  renderToStaticMarkup(createElement(BuchKolophon, { eintrag: eintrag(teil), w, sprache }));

test("Blatturteil: fünf große Blätter, die Zahl in der Buchschrift, der Wert für Vorleser als Text", () => {
  const html = blatt(3.5);
  assert.equal(html.match(/<svg aria-hidden="true" viewBox="0 0 24 24"/g)?.length, 5);
  // Drei volle Blätter zu je zwei Hälften plus die linke Hälfte des halben.
  assert.equal(html.match(/fill-accent opacity-100/g)?.length, 7);
  // Seit 2026-10-09 (Nutzer): zentriert im Fokus, die Note in der Akzentschrift.
  // Haarlinie unter dem Urteil (Spec 4).
  assert.match(html, /^<div class="flex w-full flex-col items-center gap-2 border-b border-border pb-6 text-center">/);
  assert.match(html, /<span aria-hidden="true" class="font-hand text-notiz text-logo">3,5<\/span>/);
  assert.match(html, /<span aria-hidden="true" class="text-small text-text-muted">von 5 Blättern<\/span>/);
  assert.match(html, /<span class="sr-only">3,5 von 5 Blättern<\/span>/);
});

test("Blatturteil: zwischen lg und xl schmaler, damit die Zahl neben den Blättern bleibt", () => {
  // Live 2026-10-06 bei 1143 px: 256 px Blätter plus Zahl passten nicht in die Seite, die Zahl brach um.
  assert.match(blatt(4), /<span aria-hidden="true" class="flex w-56 shrink-0 sm:w-64 lg:w-48 xl:w-64">/);
});

test("Blatturteil: die Blätter wachsen nacheinander, die Zahl kommt danach", () => {
  const html = blatt(4);
  assert.deepEqual([...html.matchAll(/data-eintritt="blatt" style="--i:(\d)"/g)].map((m) => Number(m[1])), [0, 1, 2, 3, 4]);
  assert.match(html, /data-eintritt="auf" style="--i:5"/);
});

test("Blatturteil: englische Texte und Dezimalpunkt", () => {
  const html = blatt(4.5, en, "en");
  assert.match(html, />4\.5</);
  assert.match(html, />of 5 leaves</);
  assert.match(html, /4\.5 of 5 leaves/);
});

test("Notenleiste: fünf Noten in der Reihenfolge des Schemas, Zahl mit einer Nachkommastelle", () => {
  const html = noten();
  assert.deepEqual(
    [...html.matchAll(/<dt[^>]*>([^<]+)<\/dt>/g)].map((m) => m[1]),
    ["Aussehen", "Geruch", "Geschmack", "Wirkung", "Konsistenz"],
  );
  assert.deepEqual([...html.matchAll(/<span aria-hidden="true">(\d,\d)<\/span>/g)].map((m) => m[1]), ["4,0", "5,0", "5,0", "4,5", "2,5"]);
  assert.match(html, /<span class="sr-only">4,5 von 5<\/span>/);
});

test("Notenleiste: der Tintenstrich ist so lang wie die Note von fünf, ohne gefüllte Spur", () => {
  const html = noten();
  assert.deepEqual(
    [...html.matchAll(/data-eintritt="strich" style="[^"]*transform:scaleX\(([\d.]+)\)/g)].map((m) => Number(m[1])),
    [0.8, 1, 1, 0.9, 0.5],
  );
  assert.doesNotMatch(html, /bg-surface-sunken|bg-border\b/);
});

test("Notenleiste: Werte außerhalb von 0 bis 5 sprengen den Strich nicht", () => {
  const html = noten({ aussehen: 0, geruch: 7 });
  assert.match(html, /transform:scaleX\(0\)/);
  assert.equal(html.match(/transform:scaleX\(1\)/g)?.length, 2);
});

test("Kolophon: Datum, Charge und Zahl der Bewertungen als Begriff und Wert", () => {
  const html = kolophon();
  assert.deepEqual([...html.matchAll(/<dt[^>]*>([^<]+)<\/dt>/g)].map((m) => m[1]), ["Datum", "Charge", "Bewertungen insgesamt"]);
  assert.match(html, /<time dateTime="2026-09-12T12:00:00.000Z">12\.09\.2026<\/time>/);
  assert.match(html, /<span class="numeric">CH-2401<\/span>/);
  assert.match(html, /<dd[^>]*>7<\/dd>/);
});

test("Kolophon: ohne Charge steht nicht angegeben, ohne Zahl entfällt die Zelle, eine Null bleibt sichtbar", () => {
  const html = kolophon({ chargenNr: null, autorBewertungen: null });
  assert.match(html, />nicht angegeben</);
  assert.doesNotMatch(html, /Bewertungen insgesamt/);
  assert.equal(html.match(/<dt/g)?.length, 2);
  assert.doesNotMatch(kolophon({ autorBewertungen: undefined }), /Bewertungen insgesamt/);
  assert.match(kolophon({ autorBewertungen: 0 }), /<dd[^>]*>0<\/dd>/);
});

test("Kolophon: Restfeuchte als Badge mit dem erklärenden Satz, ohne Wert nur das Badge", () => {
  const mit = kolophon({ feuchtigkeitProzent: 11.2 });
  assert.match(mit, />Restfeuchte optimal · 11,2\s%</);
  assert.match(mit, /8 bis 13 % Restfeuchte gelten als optimaler Bereich\./);
  const ohne = kolophon({ feuchtigkeitProzent: null });
  assert.match(ohne, />Restfeuchte unbekannt</);
  assert.doesNotMatch(ohne, /Keine Angabe zur Restfeuchte/);
  assert.match(kolophon({ feuchtigkeitProzent: 5 }), />Zu trocken · 5,0\s%</);
});

test("Kolophon: der Hinweis klammert ab lg auf zwei Zeilen, der ganze Satz steht im title", () => {
  const html = kolophon({ feuchtigkeitProzent: 5 });
  assert.match(html, /title="Unter 8 % Restfeuchte[^"]*" class="[^"]*\blg:line-clamp-2\b/);
});

test("Kolophon: englische Begriffe und Datumsform", () => {
  const html = kolophon({}, en, "en");
  assert.deepEqual([...html.matchAll(/<dt[^>]*>([^<]+)<\/dt>/g)].map((m) => m[1]), ["Date", "Batch", "Reviews in total"]);
  assert.match(html, />12\/09\/2026</);
});
