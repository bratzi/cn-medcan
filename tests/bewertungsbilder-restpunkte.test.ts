import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const lies = (pfad: string) => readFileSync(join(process.cwd(), pfad), "utf8");
const FORMULAR = lies("components/review/BewertungsFormular.tsx");
const BILDER = lies("components/review/BewertungsBilder.tsx");
const KARTE = lies("components/review/AromaKarte.tsx");
const NOTIZ = lies("components/review/BuchNotiz.tsx");

test("Formular: Live-Bereich ist sr-only, Bildhinweis nur bei gesendeten Bildern", () => {
  assert.match(FORMULAR, /<p aria-live="polite" className="sr-only">/);
  assert.match(FORMULAR, /bilderGesendet > 0 && !istBetreiber/);
  assert.doesNotMatch(FORMULAR, /mitBildern && !istBetreiber/);
});

test("Bilder: nach dem Abbau keine Vorschau-URLs und kein Zustand mehr", () => {
  assert.match(BILDER, /gemountet\.current = false/);
  assert.match(BILDER, /if \(!gemountet\.current\) \{[^}]*URL\.revokeObjectURL\(bild\.vorschau\)[^}]*return;/);
});

test("Aroma-Karte: Fieldsets stecken in sr-only-Hüllen, Begleitstoffe brechen schmal um", () => {
  assert.doesNotMatch(KARTE, /<fieldset className="sr-only/);
  assert.equal((KARTE.match(/<div className="sr-only">\s*<fieldset className="min-w-0">/g) ?? []).length, 2);
  assert.match(KARTE, /maxWidth: schmal \? `\$\{aktBreite - punkt\.x\}px` : undefined,\s*whiteSpace: schmal \? "normal" : undefined,\s*\}\}\s*>\s*\{\/\* Hinweis in eigener/);
});

test("Aroma-Karte: Messung hängt per Callback-Ref am montierten Element, nicht per Effekt", () => {
  assert.match(KARTE, /const messRef = useCallback\(\s*\(element: HTMLDivElement \| null\) => \{/);
  assert.match(KARTE, /new ResizeObserver\(/);
  assert.match(KARTE, /return \(\) => beobachter\.disconnect\(\);\s*\},\s*\[kompakt\],\s*\);/);
  assert.doesNotMatch(KARTE, /const messRef = useRef/);
  assert.match(KARTE, /ref=\{messRef\}/);
});

test("BuchNotiz: Effekt hängt an mitBild statt am ReactNode", () => {
  assert.match(NOTIZ, /const mitBild = Boolean\(bild\)/);
  assert.match(NOTIZ, /\[offen, text, mitBild\]/);
  assert.doesNotMatch(NOTIZ, /\[offen, text, bild\]/);
});
