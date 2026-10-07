import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MiniNetz } from "@/components/review/MiniNetz";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import { ausklingen, startFortschritt, zwischenGeschmack } from "@/lib/netz-animation";
import type { Geschmack } from "@/lib/profil-typen";

const g = (teil: Partial<Geschmack> = {}): Geschmack =>
  ({ ...Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])), ...teil }) as Geschmack;

test("zwischenGeschmack: Anfang vorher, Ende nachher, Mitte dazwischen", () => {
  const v = g({ FRUCHTIG: 0.2 }), n = g({ FRUCHTIG: 1 });
  assert.equal(zwischenGeschmack(v, n, 0).FRUCHTIG, 0.2);
  assert.equal(zwischenGeschmack(v, n, 1).FRUCHTIG, 1);
  assert.ok(Math.abs(zwischenGeschmack(v, n, 0.5).FRUCHTIG - 0.6) < 1e-9);
});

test("ausklingen: 0 und 1 fest, monoton, schnell am Anfang", () => {
  assert.equal(ausklingen(0), 0);
  assert.equal(ausklingen(1), 1);
  assert.ok(ausklingen(0.5) > 0.5);
  assert.equal(ausklingen(2), 1);
});

test("startFortschritt: reduzierte Bewegung zeigt sofort den neuen Stand", () => {
  assert.equal(startFortschritt(true), 1);
  assert.equal(startFortschritt(false), 0);
});

const mini = (vorher: Geschmack | null, nachher: Geschmack) =>
  renderToStaticMarkup(createElement(MiniNetz, { vorher, nachher, texte: de.bewerten, achsen: de.label.geschmack }));

test("MiniNetz: Kontur vorher, Änderung als Text, Link ins Profil", () => {
  const html = mini(g({ FRUCHTIG: 0.4 }), g({ FRUCHTIG: 1, ERDIG: -0.5 }));
  assert.match(html, /So hat sich dein Netz verändert/);
  assert.match(html, /data-netz="vorher"/);
  assert.match(html, /Fruchtig stärker, Erdig schwächer\./);
  assert.match(html, /href="\/profil"/);
  assert.doesNotMatch(html, /apotheke/i);
});

test("MiniNetz: ohne Veränderung der Hinweis, ohne vorher keine Kontur", () => {
  assert.match(mini(g({ SUESS: 1 }), g({ SUESS: 1 })), /Dein Netz bleibt gleich/);
  assert.doesNotMatch(mini(null, g({ SUESS: 1 })), /data-netz="vorher"/);
});

test("bewertungSpeichern: Stand vorher VOR profilFortschreiben, nachher danach", () => {
  const q = readFileSync("app/[lang]/blueten/[slug]/aktionen.ts", "utf8");
  const vorher = q.indexOf("const vorher = await ladeProfil(");
  const fort = q.indexOf("await profilFortschreiben(");
  const nachher = q.indexOf("await ladeProfil(", fort);
  assert.ok(vorher > 0 && fort > vorher && nachher > fort);
  assert.match(q, /netz,?\s*\}/);
});

test("BewertungsFormular zeigt das Mini-Netz nach Erfolg und setzt es beim neuen Senden zurück", () => {
  const q = readFileSync("components/review/BewertungsFormular.tsx", "utf8");
  assert.match(q, /setNetz\(null\)/);
  assert.match(q, /setNetz\(ergebnis\.netz\)/);
  assert.match(q, /<MiniNetz/);
});
