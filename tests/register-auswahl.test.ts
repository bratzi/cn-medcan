import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { RegisterAuswahl, type RegisterAnsicht, type RegisterTexte } from "@/components/story/RegisterAuswahl";

/**
 * Register aufgewertet (T17, Nutzer 2026-09-30): Icons, Farben und die
 * Verbindung Terpen und Geschmack stehen im Server-HTML.
 */
const ANSICHT: RegisterAnsicht = {
  terpene: [
    {
      anker: "register-terpen-limonen",
      name: "Limonen",
      icon: "Limonen",
      sorten: 7,
      sortenText: "7 Sorten",
      sortenKurz: "7 Sorten",
      duft: "Zitrusschale",
      vorkommen: null,
      noten: [{ anker: "register-note-zitrus", geschmack: "ZITRUS", label: "Zitrus", anteil: 0.8, haupt: true }],
    },
    {
      anker: "register-terpen-myrcen",
      name: "Myrcen",
      icon: "Myrcen",
      sorten: 12,
      sortenText: "12 Sorten",
      sortenKurz: "12 Sorten",
      duft: null,
      vorkommen: null,
      noten: [{ anker: "register-note-erdig", geschmack: "ERDIG", label: "Erdig", anteil: 0.6, haupt: true }],
    },
  ],
  noten: [
    {
      anker: "register-note-zitrus",
      geschmack: "ZITRUS",
      label: "Zitrus",
      traeger: [{ anker: "register-terpen-limonen", name: "Limonen", icon: "Limonen", anteil: 0.8, sortenKurz: "7 Sorten" }],
      begleitstoffe: [],
    },
    {
      anker: "register-note-erdig",
      geschmack: "ERDIG",
      label: "Erdig",
      traeger: [{ anker: "register-terpen-myrcen", name: "Myrcen", icon: "Myrcen", anteil: 0.6, sortenKurz: "12 Sorten" }],
      begleitstoffe: [],
    },
  ],
};
const TEXTE = Object.fromEntries(
  ["terpene", "geschmaecker", "terpen", "geschmack", "duft", "vorkommen", "noten", "hauptnote", "traeger", "begleitstoffe"].map((k) => [k, k]),
) as RegisterTexte;

const html = renderToStaticMarkup(createElement(RegisterAuswahl, { ansicht: ANSICHT, start: "register-terpen-limonen", texte: TEXTE }));

function knopf(anker: string): string {
  const treffer = html.match(new RegExp(`<button[^>]*aria-controls="${anker}"[^>]*data-register-knopf[^>]*>`));
  assert.ok(treffer, `Pille ${anker} fehlt`);
  return treffer[0];
}

test("RegisterAuswahl: Pillen tragen ihre Verbindungen als Attribut", () => {
  assert.match(knopf("register-terpen-limonen"), /data-verbindung="register-note-zitrus"/);
  assert.match(knopf("register-note-erdig"), /data-verbindung="register-terpen-myrcen"/);
});

test("RegisterAuswahl: die gewählte Pille ist Quelle, ihre Gegenseite verbunden, der Rest gedimmt", () => {
  const limonen = knopf("register-terpen-limonen");
  assert.match(limonen, /aria-pressed="true"/);
  assert.match(limonen, /data-quelle=""/);
  assert.match(knopf("register-note-zitrus"), /data-verbunden=""/);
  assert.match(knopf("register-terpen-myrcen"), /data-gedimmt=""/);
  assert.doesNotMatch(knopf("register-note-zitrus"), /data-gedimmt=""/);
});

test("RegisterAuswahl: große Icons an den Tafeln, farbige Balken je Geschmack", () => {
  // Ein Icon je Tafel (vier Tafeln), jeweils ein SVG darin.
  assert.equal(html.match(/data-register-icon=""/g)?.length, 4);
  assert.match(html, /data-register-icon=""[^>]*><svg/);
  assert.match(html, /data-register-balken=""[^>]*data-geschmack="ZITRUS"[^>]*style="[^"]*background:#f2d129/);
  assert.match(html, /class="bogen-fluss"/);
});

/**
 * Register-Tafel im Violett-Glas (Nutzer 2026-09-30): die Beschreibung trägt .glas-tafel
 * statt des vollen Papiers, globals.css definiert die Klasse mit dem Violett der Glasmaske.
 */
const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const tafelRegel = css.match(/\.glas-tafel \{([^}]*)\}/)?.[1] ?? "";

test("RegisterAuswahl: jede Tafel trägt .glas-tafel statt des vollen Papiers", () => {
  const tafeln = html.match(/<article[^>]*data-register-tafel[^>]*>/g) ?? [];
  assert.equal(tafeln.length, 4);
  for (const tafel of tafeln) {
    assert.match(tafel, /class="[^"]*\bglas-tafel\b/);
    assert.doesNotMatch(tafel, /\bbg-surface\b/);
  }
});

test("globals.css: .glas-tafel ist Violett-Glas mit Weichzeichner, ohne Blob und ohne Bewegung", () => {
  assert.ok(tafelRegel, ".glas-tafel fehlt");
  assert.match(tafelRegel, /--glas:\s*var\(--color-kopierstift\)/);
  assert.match(tafelRegel, /linear-gradient\(160deg/);
  assert.match(tafelRegel, /backdrop-filter:\s*blur\(/);
  assert.match(tafelRegel, /border-radius:\s*var\(--radius-lg\)/);
  assert.match(tafelRegel, /color-mix\(in oklab, var\(--color-surface\)/, "Papier-Grundschicht fehlt");
  assert.doesNotMatch(tafelRegel, /animation|transform|\/\s*\d+%/, "keine Animation, keine Blob-Form");
});

test("globals.css: ohne backdrop-filter oder bei weniger Transparenz bleibt die Tafel fast deckend", () => {
  const ohne = css.match(/@supports not \(\(backdrop-filter: blur\(1px\)\)[^{]*\{\s*\.glas-tafel \{([^}]*)\}/)?.[1] ?? "";
  assert.match(ohne, /--tafel-papier:\s*9\d%/);
  const weniger = css.match(/@media \(prefers-reduced-transparency: reduce\) \{\s*\.glas-tafel \{([^}]*)\}/)?.[1] ?? "";
  assert.match(weniger, /--tafel-papier:\s*9\d%/);
  assert.match(weniger, /backdrop-filter:\s*none/);
});
