import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { baueTerpenRegister } from "@/lib/terpen-register";

const KATALOG = [
  { name: "Myrcen", geschmack: "ERDIG" as const, sorten: 12 },
  { name: "Limonen", geschmack: "ZITRUS" as const, sorten: 7 },
  { name: "Guajol", geschmack: "HOLZIG" as const, sorten: 0 },
];

test("baueTerpenRegister: jedes Terpen mit Schlüssel, Anker, Noten aus der Tabelle und Sortenzahl", () => {
  const { terpene } = baueTerpenRegister(KATALOG);
  assert.deepEqual(
    terpene.map((t) => [t.name, t.schluessel, t.anker, t.sorten]),
    [
      ["Guajol", "guajol", "register-terpen-guajol", 0],
      ["Limonen", "limonen", "register-terpen-limonen", 7],
      ["Myrcen", "myrcen", "register-terpen-myrcen", 12],
    ],
  );
  const myrcen = terpene.find((t) => t.name === "Myrcen");
  assert.deepEqual(myrcen?.noten.map((n) => n.geschmack), ["ERDIG", "FRUCHTIG", "KRAEUTRIG"]);
});

test("baueTerpenRegister: Terpen ohne Tabelleneintrag trägt nur seine Hauptnote aus der Datenbank", () => {
  const { terpene } = baueTerpenRegister(KATALOG);
  assert.deepEqual(terpene.find((t) => t.name === "Guajol")?.noten, [{ geschmack: "HOLZIG", anteil: 1 }]);
});

test("baueTerpenRegister: Noten in fester Reihenfolge, je Note die Terpene nach Anteil absteigend", () => {
  const { noten } = baueTerpenRegister(KATALOG);
  const fruchtig = noten.find((n) => n.geschmack === "FRUCHTIG");
  // Myrcen trägt 0,3 Fruchtig, Limonen 0,15; dazu Ester als Begleitstoff.
  assert.deepEqual(fruchtig?.terpene.map((t) => t.name), ["Myrcen", "Limonen"]);
  assert.deepEqual(fruchtig?.terpene.map((t) => t.sorten), [12, 7]);
  assert.deepEqual(fruchtig?.begleitstoffe.map((b) => b.name), ["Ester"]);
  assert.equal(fruchtig?.anker, "register-note-fruchtig");
  // Reihenfolge der Achsen wie GESCHMACKS_KATEGORIEN, leere Noten entfallen.
  assert.deepEqual(
    noten.map((n) => n.geschmack),
    ["DIESEL", "ZITRUS", "ERDIG", "SUESS", "HOLZIG", "KRAEUTRIG", "FRUCHTIG"],
  );
});

test("baueTerpenRegister: Diesel kommt allein über die Thiole, ohne Terpen", () => {
  const { noten } = baueTerpenRegister(KATALOG);
  const diesel = noten.find((n) => n.geschmack === "DIESEL");
  assert.deepEqual(diesel?.terpene, []);
  assert.deepEqual(diesel?.begleitstoffe.map((b) => b.name), ["Thiole"]);
});

test("baueTerpenRegister: ungültige Sortenzahlen werden 0, Anker bleiben ohne Sonderzeichen", () => {
  const { terpene } = baueTerpenRegister([
    { name: "beta-Caryophyllen", geschmack: "WUERZIG", sorten: Number.NaN },
    { name: "Trans Nerolidol", geschmack: "HOLZIG", sorten: -3 },
  ]);
  assert.deepEqual(
    terpene.map((t) => [t.anker, t.sorten]),
    [
      ["register-terpen-beta-caryophyllen", 0],
      ["register-terpen-trans-nerolidol", 0],
    ],
  );
});

test("baueTerpenRegister: leerer Katalog ergibt keine Terpene, nur die Noten der Begleitstoffe", () => {
  const { terpene, noten } = baueTerpenRegister([]);
  assert.deepEqual(terpene, []);
  assert.deepEqual(noten.map((n) => n.geschmack), ["DIESEL", "SUESS", "FRUCHTIG"]);
});

test("Terpen-Band läuft nahtlos: genug Kacheln und Verschiebung um eine Kachel (Nutzer 2026-10-03)", () => {
  const kopie = readFileSync(join(process.cwd(), "components/story/TerpenBandKopie.tsx"), "utf8");
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  // So viele Kopien, dass eine Kachel das Fenster überragt; vorher war es genau eine.
  assert.match(kopie, /kacheln|while \(/);
  // Die Verschiebung hängt an der gemessenen Kachelbreite, nicht an 50 % der Spur.
  assert.match(css, /--band-kachel/);
  assert.doesNotMatch(css, /@keyframes terpen-band\s*\{\s*to\s*\{\s*translate: -50% 0;/);
});

test("Terpen-Band: Ruhezustand nur Icon und Name, Infos erscheinen beim Überfahren (Nutzer 2026-10-06)", () => {
  const band = readFileSync(join(process.cwd(), "components/story/TerpenBand.tsx"), "utf8");
  // Kein aufklappender Tooltip: die Infos sind sichtbarer Inhalt.
  assert.doesNotMatch(band, /role="tooltip"/);
  assert.doesNotMatch(band, /aria-describedby/);
  // Das Band ist die Gruppe, über die die Infos erscheinen.
  assert.match(band, /group\/band/);
  // Name größer als body und im Buch-Display.
  assert.match(band, /font-buch[^"]*text-h2|text-h2[^"]*font-buch/);
  // Infos in Ruhe unsichtbar, beim Überfahren und bei Tastaturfokus sichtbar.
  assert.match(band, /opacity-0[^"]*group-hover\/band:opacity-100/);
  assert.match(band, /group-focus-within\/band:opacity-100/);
  // Nur Web: mobil bleibt das schmale Icon-Band.
  assert.match(band, /max-sm:hidden/);
  // Die Breite eines Eintrags ist fix, sonst ruckt der Lauf und --band-kachel stimmt nicht.
  assert.match(band, /w-64/);
});

test("Terpen-Band hält beim Überfahren und bei Fokus an: Pause trägt denselben Selektorkopf wie der Lauf (Nutzer 2026-10-06)", () => {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  // Der Lauf (0,5,0) setzt animation-play-state per Kurzschrift; eine schwächere Pause verliert.
  assert.match(
    css,
    /:root:not\(\[data-sparmodus\]\) \.terpen-band:is\(:hover, :focus-within\) \.terpen-band-spur:not\(:has\(> \[aria-hidden\]:empty\)\) \{\s*animation-play-state: paused;/,
  );
});
