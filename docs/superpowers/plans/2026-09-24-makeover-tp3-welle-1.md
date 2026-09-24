# Makeover „Grünes Buch“ Teilprojekt 3, Welle 1 (Marke) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Marke von „Buch und Wand“ auf „Buch und Handschrift“ umstellen: Inspiration in Kopierstift-Violett für Wortmarke, Randnotizen und Community-Zeilen, Signet „gB“ als Favicon und App-Icon, Graffiti (Sedgwick, Drips, Nebel, Marmor, „gb“-Tag) ganz raus, und live stellen.

**Architecture:** Tailwind v4 mit Tokens in `app/globals.css`, Server Components, Bewegung nur auf der Startseite über die bestehende `StoryBuehne` (GSAP, dynamisch geladen). Die Wortmarke wird ein Baustein mit zwei Größen (`kopf`, `umschlag`); ihr Einstieg im Auftakt läuft per CSS, damit sie ohne JavaScript steht. „Wird geschrieben“ ist ein gemeinsamer `clip-path`-Ablauf (`schreiben.ts` und `@keyframes schreiben`). Das Signet entsteht einmal zur Entwicklungszeit aus der Schriftdatei (Satori über `next/og`, `sharp`).

**Tech Stack:** Next.js 16.3.6 (App Router), React 19.2, Tailwind v4, `next/font/google` (Inspiration), GSAP 3.15 (nur Startseite), `sharp`, `next/og`, Tests mit `node:test` über `tsx` (`npm test`), Rendering in Tests mit `react-dom/server`.

**Spec:** `docs/superpowers/specs/2026-09-24-makeover-teilprojekt-3-marke-medien-design.md`, für diese Welle Abschnitte 3 bis 6, 8, 11, 12, 13 (Welle 1) und 15. Marke bisher: `docs/brand/gruenes-buch.md`, Code-Regeln: `.claude/skills/ui-design-engine.md` (beide werden in Task 10 umgeschrieben).

## Entscheidungen in diesem Plan (beim Lesen korrigierbar)

Die Spec lässt diese Punkte offen oder widerspricht sich; Claude hat so entschieden:

1. **Neues Token `text-vermerk` (2rem = 32 px, Zeilenhöhe 1.2, 400)** für „von euch“, das „x“ der eigenen Stimme und die zwei Handschrift-Stationen der Schleife. Die Spec nennt dort „32 px“, aber kein Token.
2. **Stationen der Schleife in `text-vermerk` statt `text-notiz`.** `text-notiz` wächst bis 72 px; die Station „Ihr stimmt ab.“ am rechten Rand verdeckte dann gut die Hälfte des Videos, und die Handschrift wäre doppelt so groß wie die gedruckten Stationen daneben (31 px). Mindestgröße 32 px bleibt.
3. **Die Wortmarke im Auftakt schreibt sich per CSS, nicht per GSAP.** Sie steht damit ab dem ersten Frame im HTML, auch ohne JavaScript und ohne auf das GSAP-Paket zu warten (LCP ist laut Spec 14 voraussichtlich die Wortmarke). Die `h1` trägt deshalb kein `data-story-einstieg` mehr.
4. **Die kleine Wortmarke im Fuß entfällt.** Der Fuß zeigt nur die große, angeschnittene Wortmarke (`aria-hidden`), **einzeilig** statt zweizeilig, damit der Fuß nicht zwei Bildschirmhöhen braucht.
5. **`Kandidat` zieht aus `UmfrageKarte.tsx` in eine eigene Datei.** `UmfrageKarte` importiert über `StimmFormular` eine Server Action mit `server-only` und lässt sich im Test nicht rendern; `Kandidat` schon. So sind „von euch“ und „x“ echt getestet statt per Quelltext-Regex.
6. **Spec 15.5 („ohne JavaScript alle Randnotizen sichtbar“):** Randspalte (Sektion 3) und Stimmzettel (Sektion 6) bleiben gestreamt mit Skelett, wie Spec 8 („Zustände bleiben“, Skelette in neuer Form) und TP1 es vorsehen. Geprüft wird, dass alles im ersten HTML steht, was nicht aus der Datenbank kommt (Wortmarke, Unterzeile, „Wähl mit.“, Stationen). Soll die Randspalte ohne Suspense ins erste HTML, kostet das eine D1-Abfrage vor dem ersten Byte; das wäre eine Zeile in Task 5.
7. **Dauerregel des Nutzers vom 2026-09-24: kein lokales Dev-System.** Kein `next dev`, kein `opennextjs-cloudflare preview`, kein lokaler `next build`. Lokal laufen nur Tests, Typecheck, Lint und Farbprüfung. Jeder Task wird nach `main` gepusht (Workers Builds baut und stellt live), geprüft wird live per Browser-MCP. Die Spec-Prüfpunkte 15.1 (`next build`) und 15.4 bis 15.10 laufen damit gegen die Live-Adresse.

## Global Constraints

- Abstände nur aus der Leiter 8, 16, 24, 32, 40, 48, 64, 80, 96, 128 px (gerade Tailwind-Stufen); 4 px nur als begründete optische Korrektur in einem Paar. Keine arbitrary values für Abstände. Art-direktierte Größen in `vw`/`%` nur in `components/story/` und `components/marke/`.
- Nur semantische Farbtokens (`surface`, `surface-raised`, `surface-sunken`, `border`, `border-strong`, `text`, `text-muted`, `accent`, `accent-hover`, `accent-fg`, `accent-subtle`, `kopierstift`, `kopierstift-fg`, `danger`/`success`/`warning`), keine `dark:`-Varianten, keine Primitives, kein Hex in Komponenten.
- `accent` (Blattgrün) ist der einzige Bedienakzent, **ohne Ausnahme** (Spec TP3 5). `kopierstift` nur für Handschrift und Wortmarke, nie auf Buttons, Links oder Fokus.
- Handschrift (`font-hand`, Inspiration) nur 400, **nie unter 32 px**, nur zusammen mit `text-marke`, `text-umschlag`, `text-notiz` oder `text-vermerk`. Keine Versalien, keine Laufweite, keine Rotation. Nie für Handelsnamen, Daten, Zahlen, Formulare, Fließtext, Rechtshinweise (Spec TP3 4). Handschriftliche Zeichen nur aus Glyphen der Schrift.
- „Wird geschrieben“: `clip-path: inset()` von links nach rechts, 0,6 bis 0,9 s je Zeile, einmal (Spec TP3 11). Nur `transform`, `opacity`, `clip-path` animieren.
- GSAP und Lenis nur in `components/story/bewegung/`, nur auf der Startseite, nie bei reduzierter Bewegung. Kein neues npm-Paket (Memory `netzwerk-schonen`).
- Texte: Du und Ich, kein Geviertstrich (U+2014), kein Gedankenstrich (U+2013) als Trenner, keine Umschrift („fuer“) in neuem Seitentext. Wortlaut exakt aus Spec TP3 12.
- **CRLF:** Fast alle berührten Dateien haben CRLF (`git ls-files --eol`). Teiländerungen daran nur mit dem Edit-Werkzeug (erhält CRLF). Dateien, die ein Task vollständig neu schreibt, dürfen mit LF entstehen; neue Dateien mit LF.
- **Kein lokales Dev-System** (Entscheidung 7). Nach jedem Task: committen und **einmal** `git push origin main`; bei Netzfehler nicht wiederholen, sondern melden. Nicht auf den Build pollen: weiterarbeiten, die Live-Prüfung an den Prüfpunkten (Task 4, Task 7, Task 9, Task 11) machen. Welcher Stand live ist, zeigt ein Merkmal der Änderung im HTML (je Prüfpunkt angegeben); steht noch der alte Stand, einmal den Build im Cloudflare-Dashboard ansehen (Worker `cn-medcan` → Deployments).
- Live-Adresse: `https://cn-medcan.w-helwich.workers.dev` (hinter dem Seitenpasswort). Browser-Prüfungen im **sichtbaren** Tab (im Hintergrund-Tab laufen GSAP und Client-Navigation nicht sichtbar). Bei „Permission denied“ im Browser-Werkzeug sofort melden, dass ein Freigabe-Fenster wartet.
- Vor jedem Push prüfen, dass keine Geheimnisse getrackt sind (`git status` zeigt nur Projektdateien; `.env.local`, `.dev.vars` sind ignoriert).
- Nach jedem Task eine Zeile in `HANDOFF.md` unter `### Teilprojekt 3 „Marke und Medien“` („Welle 1, Task N erledigt: …, live seit Push `<hash>`“), im selben Commit wie der Task.
- Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Skills je Task stehen unter **Skills**; zu Beginn jedes Tasks laden und dem Nutzer in einem Satz nennen (Memory `skills-einsatzregeln`, `design-skills-einsatz`).
- Einzeltests: `npx tsx --test tests/<datei>.test.ts`; alles: `npm test`. Dazu je Task `npm run typecheck` und `npm run lint`.

## Review Focus

1. **Community-Zahlen, bei denen nur eine über 0 liegt oder genau 1 ist** (z. B. 0 Stimmen, 3 Vorschläge, 1 Runde): Die Randspalte zeigt alle drei Zahlen mit richtigem Numerus („0 Stimmen“, „1 Runde“), nicht die Leitsätze. Test: Task 5 (`tests/community.test.ts`).
2. **Eigene Stimme und Herkunft auf dem Stimmzettel:** „von euch“ steht nie an einem gesetzten Platz, das „x“ nur an der gewählten Option und nie in der Vorschlagsphase. Tests: Task 7 (`tests/handschrift.test.ts`).
3. **Reduzierte Bewegung und ohne JavaScript:** Die Wortmarke steht sofort vollständig, die `h1` ist nie per Einstieg versteckt, und die Schreib-Animation hinterlässt am Ende keinen Schnitt, der Schwünge abschneidet. Tests: Task 3 (`tests/marke.test.ts`, `tests/bewegung.test.ts`), Task 4 (Ränder gleich in CSS und GSAP).
4. **Große Zahlen (1.234.567) in der Randspalte bei 320 px:** Zahl und Wort brechen um, statt seitlich überzulaufen; die Randzahlen kollidieren nicht mit den Noten-Zählern der Doppelseite (`data-zaehler`). Tests: Task 5.
5. **Schrift lädt nicht oder spät** (Google Fonts blockiert, langsames Netz): Rückfall-Schrift in derselben Größe, ohne synthetischen Fett- oder Kursivschnitt, Handschrift-Grade nie unter 32 px. Test: Task 2.

---

### Task 1: Kopierstift-Violett (Farben umbenennen, neue Paare messen)

**Skills:** `ui-design-engine`, `better-colors`

**Files:**
- Create: `tests/marke.test.ts`
- Modify: `app/globals.css`, `scripts/farben-pruefen.mjs`, `components/story/WissenBuendeln.tsx`, `components/story/GemeinsamLernen.tsx`, `components/story/Abstimmung.tsx`, `app/umfragen/page.tsx`, `HANDOFF.md`

**Interfaces:**
- Produces: Tokens `--color-violett-400`, `--color-violett-500` (Primitive), `--color-kopierstift`, `--color-kopierstift-fg` (Rollen), Utility `text-kopierstift`. `--color-spray*` gibt es danach nicht mehr.

- [ ] **Step 1: Stand prüfen**

```bash
git switch main
git status --short
git pull --ff-only origin main
```
Expected: sauberer Baum, `main` aktuell.

- [ ] **Step 2: Failing test anlegen** (`tests/marke.test.ts`, neu)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");
const css = lies("app/globals.css");

test("Kopierstift-Violett: Werte von Sprühviolett, neuer Name (Spec TP3 5)", () => {
  assert.match(css, /--color-violett-400:\s*oklch\(0\.72 0\.15 305\);/);
  assert.match(css, /--color-violett-500:\s*oklch\(0\.52 0\.2 305\);/);
  assert.match(css, /--color-kopierstift:\s*var\(--color-violett-500\);/);
  assert.equal(css.match(/--color-kopierstift:\s*var\(--color-violett-400\);/g)?.length, 2);
  assert.doesNotMatch(css, /--color-spray/);
});

test("Farbprüfung misst Kopierstift auf allen drei Papieren", () => {
  const skript = lies("scripts/farben-pruefen.mjs");
  for (const flaeche of ["surface", "surface-raised", "surface-sunken"]) {
    assert.match(skript, new RegExp(`\\["kopierstift", "${flaeche}", 4\\.5\\]`), flaeche);
  }
  assert.doesNotMatch(skript, /spray/);
});
```

- [ ] **Step 3: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/marke.test.ts`
Expected: FAIL in beiden Tests (`--color-violett-400` fehlt, `spray` im Skript).

- [ ] **Step 4: `app/globals.css` umbenennen** (Edit-Werkzeug, vier Schritte in dieser Reihenfolge)

a) Primitive:
```css
  --color-spray-400: oklch(0.72 0.15 305);
  --color-spray-500: oklch(0.52 0.2 305);
```
wird zu
```css
  /* Kopierstift-Violett: die Farbe der Handschrift (Spec TP3 5). */
  --color-violett-400: oklch(0.72 0.15 305);
  --color-violett-500: oklch(0.52 0.2 305);
```

b) Rollen hell:
```css
  --color-spray: var(--color-spray-500);
  --color-spray-fg: var(--color-neutral-0);
```
wird zu
```css
  --color-kopierstift: var(--color-violett-500);
  --color-kopierstift-fg: var(--color-neutral-0);
```

c) Rollen dunkel (beide Dunkel-Blöcke, `replace_all`): `--color-spray: var(--color-spray-400);` → `--color-kopierstift: var(--color-violett-400);` und `--color-spray-fg: var(--color-neutral-1000);` → `--color-kopierstift-fg: var(--color-neutral-1000);`

d) Restliche Verweise in der Komponenten-Schicht (`replace_all`): `var(--color-spray-400)` → `var(--color-violett-400)`, danach `var(--color-spray)` → `var(--color-kopierstift)`. Diese Stellen (`.wand-textur`, `.gb-tag`, `.fuss-tag`) fallen in Task 4 und Task 8 ganz weg.

- [ ] **Step 5: `scripts/farben-pruefen.mjs` anpassen** (Edit-Werkzeug)

```js
  "spray-400": "0.72 0.15 305",
  "spray-500": "0.52 0.2 305",
```
→
```js
  "violett-400": "0.72 0.15 305",
  "violett-500": "0.52 0.2 305",
```

```js
  spray: ["spray-500", "spray-400"],
  "spray-fg": ["neutral-0", "neutral-1000"],
```
→
```js
  kopierstift: ["violett-500", "violett-400"],
  "kopierstift-fg": ["neutral-0", "neutral-1000"],
```

```js
  ["spray", "surface", 4.5],
  ["spray-fg", "spray", 4.5],
```
→
```js
  // Handschrift hat dünne Haarstriche: 4.5 wie normaler Text, obwohl die Grade groß sind (Spec TP3 5).
  ["kopierstift", "surface", 4.5],
  ["kopierstift", "surface-raised", 4.5],
  ["kopierstift", "surface-sunken", 4.5],
  ["kopierstift-fg", "kopierstift", 4.5],
```

- [ ] **Step 6: Utility in den Komponenten umbenennen** (Edit-Werkzeug, `replace_all` `text-spray` → `text-kopierstift`) in `components/story/WissenBuendeln.tsx`, `components/story/GemeinsamLernen.tsx`, `components/story/Abstimmung.tsx`, `app/umfragen/page.tsx`.

Run: `git grep -n "spray" -- app components lib scripts`
Expected: nur noch Kommentare, `url(#spray-rau)` in `.gb-tag`/`.fuss-tag` und `components/marke/SprayFilter.tsx` (fallen in Task 4 und Task 8), keine `text-spray`, kein `--color-spray`.

- [ ] **Step 7: Tests und Farbprüfung**

Run: `npx tsx --test tests/marke.test.ts` → PASS.
Run: `npm run farben`
Expected: Exit 0, darunter die Zeilen
```
kopierstift / surface                hell      5.06
kopierstift / surface                dunkel    7.33
kopierstift / surface-raised         hell      5.53
kopierstift / surface-raised         dunkel    6.88
kopierstift / surface-sunken         hell      4.61
kopierstift / surface-sunken         dunkel    7.66
kopierstift-fg / kopierstift         hell      5.94
kopierstift-fg / kopierstift         dunkel    7.66
```

- [ ] **Step 8: HANDOFF-Abschnitt anlegen** (Edit-Werkzeug, direkt vor `### 0. Live-Stand und Sessionablauf`)

```markdown
### Teilprojekt 3 „Marke und Medien“

Spec: `docs/superpowers/specs/2026-09-24-makeover-teilprojekt-3-marke-medien-design.md`. Plan Welle 1:
`docs/superpowers/plans/2026-09-24-makeover-tp3-welle-1.md` (Ausführung Native, direkt auf `main`, jeder Task
gepusht und live geprüft; Dauerregel: kein lokales Dev-System).

- Welle 1, Task 1 erledigt: Sprühviolett heißt Kopierstift (`violett-*`, `kopierstift*`), neue Paare gemessen
  (surface-raised 5.53/6.88, surface-sunken 4.61/7.66).
```

- [ ] **Step 9: Gesamtlauf, Commit, Push**

```bash
npm test && npm run typecheck && npm run lint
git add tests/marke.test.ts app/globals.css scripts/farben-pruefen.mjs components/story/WissenBuendeln.tsx components/story/GemeinsamLernen.tsx components/story/Abstimmung.tsx app/umfragen/page.tsx HANDOFF.md
git commit -m "refactor: Sprühviolett heißt Kopierstift, Kontrast auf allen Papieren gemessen (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```
Expected: alle grün, Push einmal ohne Fehler.

---

### Task 2: Handschrift-Tokens und Inspiration laden

**Skills:** `ui-design-engine`, `better-typography`

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`, `tests/marke.test.ts`, `HANDOFF.md`

**Interfaces:**
- Produces: CSS-Variable `--font-inspiration` (aus `next/font`), Utility `font-hand`, Textgrade `text-marke` (2.5rem/1), `text-umschlag` (`clamp(5rem, 1rem + 17vw, 20rem)`/0.95), `text-notiz` (`clamp(2rem, 1.25rem + 3vw, 4.5rem)`/1.2), `text-vermerk` (2rem/1.2), alle mit Gewicht 400. Sedgwick und `font-wand` bleiben bis Task 8 geladen, damit bis dahin nichts ungestylt ist.

- [ ] **Step 1: Failing tests anhängen** (an das Ende von `tests/marke.test.ts`)

```ts
const HAND_GRADE = ["marke", "umschlag", "notiz", "vermerk"] as const;

function token(name: string): string {
  const treffer = new RegExp(`--text-${name}:\\s*([^;]+);`).exec(css);
  assert.ok(treffer, `--text-${name} fehlt`);
  return treffer[1].trim();
}

/** Kleinster Wert eines Grads in rem: fester Wert oder erstes Argument von clamp(). */
function mindestRem(wert: string): number {
  const treffer = /^(?:clamp\()?\s*([\d.]+)rem/.exec(wert);
  assert.ok(treffer, `kein rem-Wert: ${wert}`);
  return Number(treffer[1]);
}

test("Handschrift-Grade nie unter 32 px (Spec TP3 4)", () => {
  for (const name of HAND_GRADE) assert.ok(mindestRem(token(name)) >= 2, `${name}: ${token(name)}`);
  assert.equal(token("marke"), "2.5rem");
  assert.equal(token("umschlag"), "clamp(5rem, 1rem + 17vw, 20rem)");
  assert.equal(token("notiz"), "clamp(2rem, 1.25rem + 3vw, 4.5rem)");
  assert.equal(token("vermerk"), "2rem");
});

test("Handschrift: Inspiration mit Rückfall, nur 400, keine synthetischen Schnitte", () => {
  assert.match(css, /--font-hand:\s*var\(--font-inspiration\),[^;]*cursive;/);
  for (const name of HAND_GRADE) {
    assert.match(css, new RegExp(`--text-${name}--font-weight:\\s*400;`), name);
  }
  assert.match(css, /\.font-hand\s*\{[^}]*font-synthesis:\s*none/);
  assert.match(
    lies("app/layout.tsx"),
    /Inspiration\(\{[\s\S]*?variable: "--font-inspiration"[\s\S]*?weight: "400"[\s\S]*?adjustFontFallback: true/,
  );
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/marke.test.ts`
Expected: FAIL mit „--text-marke fehlt“ und fehlendem `--font-hand`.

- [ ] **Step 3: Inspiration in `app/layout.tsx` laden** (Edit-Werkzeug)

Import:
```ts
import {
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Inspiration,
  Sedgwick_Ave_Display,
} from "next/font/google";
```

Nach dem Block `const sedgwick = …;` einfügen:
```ts
/** Handschrift (Spec TP3 4): Wortmarke und Randnotizen. Ein Schnitt, eine Datei. */
const inspiration = Inspiration({
  variable: "--font-inspiration",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  adjustFontFallback: true,
});
```

Im `className` des `<html>` hinter `${sedgwick.variable} ` ergänzen: `${inspiration.variable} `.

- [ ] **Step 4: Tokens in `app/globals.css`** (Edit-Werkzeug)

Hinter `--font-wand: var(--font-sedgwick), "Segoe Print", cursive;` einfügen:
```css
  --font-hand: var(--font-inspiration), "Segoe Script", cursive;
```

Direkt vor `--tracking-gesperrt: 0.3em;` einfügen:
```css
  /* ---- Handschrift (Spec TP3 4): Inspiration, nur 400, nie unter 32 px -- */
  /* Wortmarke im Kopf aller Seiten. */
  --text-marke: 2.5rem;
  --text-marke--line-height: 1;
  --text-marke--font-weight: 400;

  /* Wortmarke im Auftakt (zweizeilig, h1) und angeschnitten im Fuß. */
  --text-umschlag: clamp(5rem, 1rem + 17vw, 20rem);
  --text-umschlag--line-height: 0.95;
  --text-umschlag--font-weight: 400;

  /* Randnotizen, "Wähl mit.", Handschrift-Überschriften auf /umfragen.
     Zeilenhöhe 1.2: lange Ober- und Unterlängen der Schreibschrift. */
  --text-notiz: clamp(2rem, 1.25rem + 3vw, 4.5rem);
  --text-notiz--line-height: 1.2;
  --text-notiz--font-weight: 400;

  /* Kurze Vermerke am Stimmzettel und in der Schleife: die Mindestgröße. */
  --text-vermerk: 2rem;
  --text-vermerk--line-height: 1.2;
  --text-vermerk--font-weight: 400;

```

Am Anfang von `@layer components {` (vor `.medien-buch`) einfügen:
```css
  /* Inspiration hat nur 400: keine künstlich fetten oder kursiven Schnitte. */
  .font-hand {
    font-synthesis: none;
  }

```

- [ ] **Step 5: Test laufen lassen**

Run: `npx tsx --test tests/marke.test.ts` → PASS (4 Tests).

- [ ] **Step 6: HANDOFF, Gesamtlauf, Commit, Push**

HANDOFF-Zeile unter Teilprojekt 3: „Welle 1, Task 2 erledigt: Inspiration geladen, Handschrift-Grade `text-marke`, `text-umschlag`, `text-notiz`, `text-vermerk` (neu, 32 px).“

```bash
npm test && npm run typecheck && npm run lint
git add app/layout.tsx app/globals.css tests/marke.test.ts HANDOFF.md
git commit -m "feat: Handschrift Inspiration mit eigenen Graden ab 32 px (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

### Task 3: Wortmarke und Auftakt als Umschlag

**Skills:** `ui-design-engine`, `better-typography`, `design-taste-frontend`, `animate`

**Files:**
- Modify: `components/marke/Wortmarke.tsx` (vollständig neu), `components/story/Auftakt.tsx` (vollständig neu), `components/story/bewegung/auftakt.ts` (vollständig neu), `app/globals.css`, `tests/marke.test.ts`, `tests/bewegung.test.ts`, `HANDOFF.md`

**Interfaces:**
- Consumes: `font-hand`, `text-marke`, `text-umschlag`, `text-kopierstift` (Task 1, 2).
- Produces: `Wortmarke({ groesse: "kopf" | "umschlag"; einzeilig?: boolean; className?: string })`, `Unterzeile({ className?: string })` (rendert `<p>`), Attribut `data-marke-zeile` an jeder Zeile der Umschlag-Wortmarke, CSS-Klassen `.auftakt-marke`, `.auftakt-unterzeile`, `@keyframes schreiben` mit den Rändern `inset(-50% 120% -50% -20%)` → `inset(-50% -20% -50% -20%)`. `data-story="oberzeile"` ersetzt `data-story="unterzeile"` an „Cannabis, offen gelegt.“.

- [ ] **Step 1: Failing tests anhängen**

An den Anfang von `tests/marke.test.ts` zu den Importen:
```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";
```

Ans Ende von `tests/marke.test.ts`:
```ts
const ohneTags = (html: string) => html.replace(/<[^>]+>/g, "");

test("Wortmarke im Kopf: Handschrift in Kopierstift, echter Text", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "kopf" }));
  assert.match(html, /\bfont-hand\b/);
  assert.match(html, /\btext-marke\b/);
  assert.match(html, /\btext-kopierstift\b/);
  assert.equal(ohneTags(html), "Grünes Buch");
  assert.doesNotMatch(html, /font-buch|aria-hidden|uppercase|text-accent|gb/);
});

test("Wortmarke als Umschlag: zwei Zeilen, ein zugänglicher Name", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "umschlag" }));
  assert.equal(html.match(/data-marke-zeile=""/g)?.length, 2);
  assert.match(html, /\btext-umschlag\b/);
  assert.equal(ohneTags(html), "Grünes Buch");
});

test("Wortmarke einzeilig (Fuß): bricht nicht um", () => {
  const html = renderToStaticMarkup(createElement(Wortmarke, { groesse: "umschlag", einzeilig: true }));
  assert.match(html, /\bwhitespace-nowrap\b/);
  assert.equal(html.match(/class="inline-block"/g)?.length, 2);
});

test("Unterzeile: gedruckt, natürliche Schreibung, Versalien per CSS", () => {
  const html = renderToStaticMarkup(createElement(Unterzeile));
  assert.match(html, /^<p /);
  assert.equal(ohneTags(html), "Charge für Charge");
  assert.match(html, /\buppercase\b/);
  assert.match(html, /\btracking-gesperrt\b/);
  assert.doesNotMatch(html, /font-hand/);
});

test("Auftakt: die h1 ist die Wortmarke, ohne Grün, ohne Tag, nie per Einstieg versteckt", () => {
  const quelle = lies("components/story/Auftakt.tsx");
  const h1 = /<h1[^>]*>\s*<Wortmarke groesse="umschlag" \/>\s*<\/h1>/.exec(quelle)?.[0];
  assert.ok(h1, "die h1 enthält nicht genau die Umschlag-Wortmarke");
  assert.match(h1, /className="auftakt-marke /);
  assert.doesNotMatch(h1, /data-story-einstieg/);
  assert.match(quelle, /<Unterzeile className="auftakt-unterzeile /);
  assert.doesNotMatch(quelle, /text-accent|uppercase|Textur|groesse="buehne"/);
});
```

Ans Ende von `tests/bewegung.test.ts`:
```ts
test("Wortmarke im Auftakt schreibt sich per CSS, nur bei erlaubter Bewegung, ohne Schnitt am Ende", () => {
  const bloecke = [...css.matchAll(/@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}/g)].map(
    (treffer) => treffer[1],
  );
  const block = bloecke.find((inhalt) => inhalt.includes(".auftakt-marke"));
  assert.ok(block, "Schreib-Einstieg fehlt oder steht ohne Bewegungsschutz");
  assert.match(block, /\.auftakt-marke \[data-marke-zeile\]\s*\{\s*animation:\s*schreiben [^;]*\bbackwards;/);
  assert.match(block, /\.auftakt-unterzeile\s*\{\s*animation:\s*schreiben [^;]*\bbackwards;/);
  assert.doesNotMatch(block, /forwards|\bboth\b/);
  assert.match(css, /@keyframes schreiben\s*\{/);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/marke.test.ts tests/bewegung.test.ts`
Expected: FAIL (`Unterzeile` ist kein Export, `groesse: "umschlag"` unbekannt, Schreib-Einstieg fehlt).

- [ ] **Step 3: `components/marke/Wortmarke.tsx` vollständig ersetzen**

```tsx
import { cn } from "@/lib/cn";

type Props = {
  groesse: "kopf" | "umschlag";
  /** Nur umschlag: "Grünes Buch" in einer Zeile (Fuß) statt in zwei (Auftakt). */
  einzeilig?: boolean;
  className?: string;
};

/**
 * Die Marke "Grünes Buch" (Spec TP3 6): handschriftlich in Inspiration,
 * immer in Kopierstift-Violett. Der Name ist echter Text, kein Bild; wo er
 * nur Bild ist (Fuß), setzt der Aufrufer aria-hidden.
 *
 * kopf:     eine Zeile in text-marke (40 px), im Kopf aller Seiten.
 * umschlag: text-umschlag, zweizeilig im Auftakt (dort als h1), einzeilig
 *           im Fuß. Das Leerzeichen zwischen den Zeilen hält den
 *           zugänglichen Namen "Grünes Buch" zusammen. An
 *           `data-marke-zeile` hängt der geschriebene Einstieg (globals.css).
 */
export function Wortmarke({ groesse, einzeilig = false, className }: Props) {
  if (groesse === "kopf") {
    return <span className={cn("font-hand text-marke text-kopierstift", className)}>Grünes Buch</span>;
  }

  const zeile = einzeilig ? "inline-block" : "block";
  return (
    <span className={cn("block font-hand text-umschlag text-kopierstift", einzeilig && "whitespace-nowrap", className)}>
      <span data-marke-zeile="" className={zeile}>
        Grünes
      </span>{" "}
      <span data-marke-zeile="" className={zeile}>
        Buch
      </span>
    </span>
  );
}

/**
 * Die Unterzeile der Wortmarke (Spec TP3 6): gedruckt in Geist 500,
 * gespeichert in natürlicher Schreibung, Versalien und Laufweite per CSS.
 */
export function Unterzeile({ className }: { className?: string }) {
  return (
    <p className={cn("font-sans text-caption uppercase tracking-gesperrt text-text", className)}>Charge für Charge</p>
  );
}
```

- [ ] **Step 4: `components/story/Auftakt.tsx` vollständig ersetzen**

```tsx
import Link from "next/link";
import { preload } from "react-dom";

import { Bild } from "@/components/medien/Bild";
import { Unterzeile, Wortmarke } from "@/components/marke/Wortmarke";
import { buttonKlassen } from "@/components/ui";
import { bildQuelle } from "@/lib/medien";

/** Tatsächliche Breite des Leitobjekts: bestimmt, welche Datei geladen wird. */
const LEIT_SIZES = "(min-width: 768px) 42vw, 64vw";

/**
 * Sektion 1 (Spec TP3 8.1): der Umschlag. Die h1 ist die handschriftliche
 * Wortmarke, darunter die gedruckte Unterzeile. Beide schreiben sich per
 * CSS (globals.css, `schreiben`) und stehen deshalb ohne JavaScript und bei
 * reduzierter Bewegung sofort da. Das Leitobjekt liegt bis TP3 Welle 2 wie
 * bisher über den Buchstaben.
 *
 * `data-story-einstieg` markiert, was die StoryBuehne einblendet: nur
 * Oberzeile und Satz. Der Button "Wähl mit" trägt die Markierung bewusst
 * nicht: er ist ab dem ersten Frame bedienbar.
 */
export function Auftakt() {
  const leitobjekt = bildQuelle("leitobjekt");
  // Größtes Bild der ersten Ansicht: vor allen anderen Ressourcen anfordern (Spec 6.4).
  preload(leitobjekt.src, {
    as: "image",
    imageSrcSet: leitobjekt.srcSet,
    imageSizes: LEIT_SIZES,
    fetchPriority: "high",
  });

  return (
    <section
      aria-labelledby="auftakt-titel"
      data-story="auftakt"
      className="relative overflow-hidden px-4 pt-8 pb-16 sm:px-8 sm:pt-12 sm:pb-24"
    >
      <div className="mx-auto w-full max-w-360">
        <p
          data-story="oberzeile"
          data-story-einstieg=""
          className="font-buch text-h2 font-medium italic text-text-muted sm:text-h1"
        >
          Cannabis, offen gelegt.
        </p>

        <div className="relative mt-4">
          <h1 id="auftakt-titel" data-story="titel" className="auftakt-marke relative z-0">
            <Wortmarke groesse="umschlag" />
          </h1>
          <Unterzeile className="auftakt-unterzeile relative z-0 mt-4" />

          {/* Ohne z-index und ohne transform: beides schafft einen eigenen
              Stapelkontext, und multiply mischte dann nur mit dem leeren
              Wrapper statt mit Titel und Papier. Zentriert per my-auto. */}
          <div className="pointer-events-none absolute inset-y-0 right-0 my-auto h-fit w-[64vw] md:right-[4vw] md:w-[42vw]">
            {/* Weicher Rand: der Grund des Fotos hat einen leichten Verlauf, ohne
                Maske bliebe dessen Kante als Rechteck ueber dem Titel stehen. */}
            <Bild
              id="leitobjekt"
              sizes={LEIT_SIZES}
              prioritaet
              className="mask-radial-closest-side mask-radial-from-70% mask-radial-to-100%"
            />
          </div>
        </div>

        <div className="mt-8 flex max-w-2xl flex-col items-start gap-6">
          <p data-story="intro" data-story-einstieg="" className="text-body text-text text-pretty sm:text-h3 sm:font-normal">
            Ich teste Sorten nach festem Schema. Du entscheidest mit, welche als Nächstes drankommt.
          </p>
          <Link href="#abstimmung" className={buttonKlassen("primary", "md")}>
            Wähl mit
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: `components/story/bewegung/auftakt.ts` vollständig ersetzen**

```ts
import type { Choreografie } from "./typen";

/**
 * Sektion 1 (Spec TP3 8.1): Wortmarke und Unterzeile schreiben sich per CSS
 * selbst (globals.css, `schreiben`). Hier blenden nur Oberzeile und Satz
 * ein. Navigation und "Wähl mit" sind nie ausgeblendet.
 */
export const auftakt: Choreografie = ({ gsap }) => {
  const einstieg = gsap.utils.toArray<HTMLElement>("[data-story-einstieg]");
  if (einstieg.length === 0) return;

  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    // Ab hier übernimmt GSAP: der CSS-Notfall wird abgeschaltet, die Flächen stehen.
    .set(einstieg, { animation: "none", opacity: 1 })
    // fromTo statt from: der Zielwert käme sonst aus dem CSS-Einstieg (opacity 0),
    // und die Zeile bliebe unsichtbar, weil die Bühne den Notfall abschaltet.
    .fromTo('[data-story="oberzeile"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.1)
    .fromTo('[data-story="intro"]', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.4);
};
```

- [ ] **Step 6: Schreib-Einstieg in `app/globals.css`** (Edit-Werkzeug, ans Dateiende hinter `@keyframes einstieg-notfall { … }`)

```css

/* ==========================================================================
   Geschriebener Einstieg der Wortmarke (Spec TP3 8.1, 11)
   Nur CSS und nur bei erlaubter Bewegung: die Wortmarke steht ab dem ersten
   Frame im HTML und braucht kein JavaScript. `backwards` hält den Schnitt nur
   bis zum Start; danach ist clip-path weg, und Schwünge der Schreibschrift
   dürfen über die Box hinausragen. Die Ränder gleichen SCHREIBEN_AB und
   SCHREIBEN_BIS in components/story/bewegung/schreiben.ts.
   ========================================================================== */

@media (prefers-reduced-motion: no-preference) {
  .auftakt-marke [data-marke-zeile] {
    animation: schreiben 0.8s var(--ease-standard) 0.1s backwards;
  }

  .auftakt-marke [data-marke-zeile] + [data-marke-zeile] {
    animation-delay: 0.8s;
  }

  .auftakt-unterzeile {
    animation: schreiben 0.6s var(--ease-standard) 1.5s backwards;
  }
}

@keyframes schreiben {
  from {
    clip-path: inset(-50% 120% -50% -20%);
  }
  to {
    clip-path: inset(-50% -20% -50% -20%);
  }
}
```

- [ ] **Step 7: Tests laufen lassen**

Run: `npx tsx --test tests/marke.test.ts tests/bewegung.test.ts` → PASS.
Run: `npm run typecheck`
Expected: grün. `components/layout/Kopf.tsx` und `components/layout/Fuss.tsx` rufen `Wortmarke groesse="kopf"` auf, das bleibt gültig.

- [ ] **Step 8: HANDOFF, Gesamtlauf, Commit, Push**

HANDOFF-Zeile: „Welle 1, Task 3 erledigt: Wortmarke handschriftlich (Kopf 40 px, Auftakt als h1 zweizeilig), Unterzeile ‚Charge für Charge‘, Tag und Drip im Auftakt raus, Einstieg per CSS.“

```bash
npm test && npm run typecheck && npm run lint
git add components/marke/Wortmarke.tsx components/story/Auftakt.tsx components/story/bewegung/auftakt.ts app/globals.css tests/marke.test.ts tests/bewegung.test.ts HANDOFF.md
git commit -m "feat: Wortmarke in Handschrift, Auftakt als Umschlag (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

### Task 4: Fuß mit angeschnittener Wortmarke, Schreiben als Baustein, Live-Prüfpunkt Marke

**Skills:** `ui-design-engine`, `animate`, `emil-design-eng`; für die Live-Prüfung `better-typography`

**Files:**
- Create: `components/story/bewegung/schreiben.ts`
- Modify: `components/layout/Fuss.tsx` (vollständig neu), `components/story/bewegung/schluss.ts` (vollständig neu), `app/globals.css`, `tests/marke.test.ts`, `tests/bewegung.test.ts`, `HANDOFF.md`

**Interfaces:**
- Consumes: `Wortmarke` mit `einzeilig` (Task 3), `@keyframes schreiben` (Task 3).
- Produces: `SCHREIBEN_AB: { clipPath: string }`, `SCHREIBEN_BIS: { clipPath: string; duration: number; ease: string; clearProps: string }` aus `components/story/bewegung/schreiben.ts`; `data-story="fuss-marke"`; CSS-Klasse `.fuss-marke`.

- [ ] **Step 1: Failing tests anhängen**

Ans Ende von `tests/marke.test.ts`:
```ts
test("Fuß: die Wortmarke läuft angeschnitten aus, kein Tag, kein zweiter Name", () => {
  const fuss = lies("components/layout/Fuss.tsx");
  assert.match(
    fuss,
    /<span aria-hidden="true" data-story="fuss-marke" className="fuss-marke block select-none text-umschlag">\s*<Wortmarke groesse="umschlag" einzeilig \/>\s*<\/span>/,
  );
  assert.equal(fuss.match(/<Wortmarke /g)?.length, 1);
  assert.doesNotMatch(fuss, /fuss-tag|font-wand|>\s*gb\s*</);
  assert.match(css, /\.fuss-marke\s*\{[^}]*margin-bottom:\s*-0\.35em/);
  assert.doesNotMatch(css, /\.fuss-tag/);
  assert.match(lies("components/story/bewegung/schluss.ts"), /data-story="fuss-marke"/);
});
```

In `tests/bewegung.test.ts` zu den Importen:
```ts
import { SCHREIBEN_AB, SCHREIBEN_BIS } from "@/components/story/bewegung/schreiben";
```
und ans Ende:
```ts
test("Schreiben: dieselben Ränder in GSAP und CSS, am Ende kein Schnitt", () => {
  assert.ok(css.includes(`clip-path: ${SCHREIBEN_AB.clipPath};`), "Startrand fehlt in @keyframes schreiben");
  assert.ok(css.includes(`clip-path: ${SCHREIBEN_BIS.clipPath};`), "Endrand fehlt in @keyframes schreiben");
  assert.equal(SCHREIBEN_BIS.clearProps, "clipPath");
  assert.ok(SCHREIBEN_BIS.duration >= 0.6 && SCHREIBEN_BIS.duration <= 0.9, `${SCHREIBEN_BIS.duration} s`);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/marke.test.ts tests/bewegung.test.ts`
Expected: FAIL („Cannot find module …/schreiben“, Fuß-Test).

- [ ] **Step 3: `components/story/bewegung/schreiben.ts` anlegen**

```ts
/**
 * Handschrift "wird geschrieben" (Spec TP3 11): clip-path von links nach
 * rechts, einmal, 0,6 bis 0,9 s je Zeile. Die negativen Ränder lassen
 * Ober- und Unterlängen und Schwünge der Schreibschrift stehen, die über
 * die Box hinausragen; am Ende nimmt clearProps den Schnitt ganz weg.
 * Dieselben Ränder nutzt der CSS-Einstieg der Wortmarke (@keyframes
 * schreiben in globals.css).
 */
export const SCHREIBEN_AB = { clipPath: "inset(-50% 120% -50% -20%)" };

export const SCHREIBEN_BIS = {
  clipPath: "inset(-50% -20% -50% -20%)",
  duration: 0.8,
  ease: "power2.inOut",
  clearProps: "clipPath",
};
```

- [ ] **Step 4: `components/story/bewegung/schluss.ts` vollständig ersetzen**

```ts
import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

/**
 * Sektion 9: die Schlusszeile steht als Kontur und füllt sich Wort für
 * Wort scroll-gekoppelt (Referenz); die Wortmarke unten im Fuß schreibt
 * sich einmal (Spec TP3 8.9). aria "none": beide sichtbaren Ebenen der
 * Schlusszeile sind aria-hidden, vorgelesen wird die sr-only-Fassung.
 */
export const schluss: Choreografie = ({ gsap, SplitText }) => {
  const fuellung = document.querySelector<HTMLElement>(".schlusszeile-fuellung");
  if (fuellung) {
    const woerter = SplitText.create(fuellung, { type: "words", tag: "span", aria: "none" }).words;
    gsap.fromTo(
      woerter,
      { opacity: 0 },
      {
        opacity: 1,
        stagger: 0.15,
        ease: "none",
        scrollTrigger: { trigger: fuellung, start: "top 95%", end: "bottom bottom", scrub: true },
      },
    );
  }

  const marke = document.querySelector<HTMLElement>('[data-story="fuss-marke"]');
  if (marke) {
    gsap.fromTo(marke, SCHREIBEN_AB, {
      ...SCHREIBEN_BIS,
      scrollTrigger: { trigger: marke, start: "top 95%", once: true },
    });
  }
};
```

- [ ] **Step 5: `components/layout/Fuss.tsx` vollständig ersetzen**

`ART_LABEL` bleibt in diesem Task unverändert (fällt mit den Masken in Task 8).

```tsx
import Link from "next/link";

import { Wortmarke } from "@/components/marke/Wortmarke";
import { MEDIEN, type MedienArt } from "@/lib/medien";
import { HAUPTNAVIGATION, KONTO_LINK } from "@/lib/navigation";

const LINKS = [...HAUPTNAVIGATION, KONTO_LINK];

const ART_LABEL: Record<MedienArt, string> = { foto: "Foto", maske: "Textur", video: "Video" };

const TEXTLINK =
  "inline-flex min-h-11 items-center text-small text-accent underline underline-offset-4 " +
  "transition-colors duration-fast ease-standard hover:text-accent-hover";

/**
 * Fuß auf allen Seiten (Spec 5.1, Sektion 9; Spec TP3 8.9). Die
 * Schlusszeile steht doppelt im selben Rasterfeld: unten als Kontur
 * (aria-hidden), darüber gefüllt. Auf der Startseite blendet die
 * StoryBuehne die gefüllten Wörter scroll-gekoppelt ein und schreibt die
 * Wortmarke; ohne Bewegung steht beides einfach da.
 */
export function Fuss() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface-raised">
      <div className="mx-auto w-full max-w-360 px-4 pt-16 sm:px-8 sm:pt-24">
        {/* Vorgelesen wird nur die sr-only-Fassung: die sichtbaren Ebenen teilt
            die StoryBuehne in Wörter, und ein aria-label auf einem span lesen
            Screenreader nicht zuverlässig vor. */}
        <p data-story="schluss" className="schlusszeile font-buch text-titel font-medium text-text">
          <span className="sr-only">Du liest mit. Du wählst mit.</span>
          <span aria-hidden="true" className="schlusszeile-kontur">
            Du liest mit. Du wählst mit.
          </span>
          <span aria-hidden="true" className="schlusszeile-fuellung">
            Du liest mit. Du wählst mit.
          </span>
        </p>
      </div>

      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 px-4 pb-16 sm:grid-cols-[2fr_1fr] sm:px-8">
        <p className="max-w-[68ch] text-caption text-text-muted">
          Alle gelisteten Arzneimittel sind verschreibungspflichtig. Die Angaben dienen der
          Information und ersetzen keine medizinische oder pharmazeutische Beratung. Eine Abgabe
          von Arzneimitteln erfolgt über diese Seite nicht.
        </p>

        <nav aria-label="Fußnavigation">
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={TEXTLINK}>
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="mx-auto w-full max-w-360 border-t border-border px-4 py-6 sm:px-8">
        <details>
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-caption text-text-muted">
            Bildnachweise
          </summary>
          <ul className="mt-2 flex flex-col gap-2 pb-2 text-caption text-text-muted">
            {MEDIEN.map((m) => (
              <li key={m.id}>
                {`${ART_LABEL[m.art]}: `}
                <a href={m.quelle} rel="noopener noreferrer" className="text-accent underline underline-offset-2">
                  {m.urheber}
                </a>
                {" auf Pexels"}
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* Zuletzt im Fuß: nur so läuft die Wortmarke über den negativen
          Außenabstand unten aus dem Bild, statt Rechtshinweis und Navigation
          zu verdecken. Der Name steht im Kopf, hier ist er Bild. */}
      <span aria-hidden="true" data-story="fuss-marke" className="fuss-marke block select-none text-umschlag">
        <Wortmarke groesse="umschlag" einzeilig />
      </span>
    </footer>
  );
}
```

- [ ] **Step 6: `.fuss-tag` in `app/globals.css` ersetzen** (Edit-Werkzeug)

Den Block ab `/* Grosses Tag, das unten und links aus dem Fuss laeuft (Doja Pak). */` bis zur schließenden Klammer von `.fuss-tag` ersetzen durch:
```css
  /* Die Wortmarke läuft unten angeschnitten aus dem Fuß (Spec TP3 8.9).
     em bezieht sich auf text-umschlag am selben Element. */
  .fuss-marke {
    margin-bottom: -0.35em;
    margin-left: -0.02em;
    pointer-events: none;
  }
```

- [ ] **Step 7: Tests laufen lassen**

Run: `npx tsx --test tests/marke.test.ts tests/bewegung.test.ts` → PASS.

- [ ] **Step 8: HANDOFF, Gesamtlauf, Commit, Push**

HANDOFF-Zeile: „Welle 1, Task 4 erledigt: Fuß mit angeschnittener Wortmarke statt ‚gb‘-Tag, kleine Wortmarke im Fuß entfällt, `schreiben.ts` als gemeinsamer Ablauf.“

```bash
npm test && npm run typecheck && npm run lint
git add components/story/bewegung/schreiben.ts components/story/bewegung/schluss.ts components/layout/Fuss.tsx app/globals.css tests/marke.test.ts tests/bewegung.test.ts HANDOFF.md
git commit -m "feat: Fuß mit angeschnittener Wortmarke, Schreiben als Baustein (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 9: Live-Prüfpunkt Marke** (Browser-MCP, sichtbarer Tab, Live-Adresse, angemeldet über das Seitenpasswort)

Stand erkennen: Im Roh-HTML von `/` steht `data-story="fuss-marke"`. Fehlt es, einmal im Dashboard den Build ansehen; läuft er noch, mit Task 5 weitermachen und diesen Schritt vor Task 6 nachholen.

Im `javascript_tool` auf `/`:
```js
(() => {
  const hand = [...document.querySelectorAll("body *")].filter(
    (el) =>
      getComputedStyle(el).fontFamily.includes("Inspiration") &&
      [...el.childNodes].some((knoten) => knoten.nodeType === 3 && knoten.textContent.trim()),
  );
  return {
    handschrift: hand.map((el) => `${parseFloat(getComputedStyle(el).fontSize)}px ${el.textContent.trim().slice(0, 24)}`),
    kopfHoehe: document.querySelector("header").getBoundingClientRect().height,
    ueberlauf: document.documentElement.scrollWidth - window.innerWidth,
  };
})()
```
Expected: jede Handschrift-Zeile ≥ 32 px; `ueberlauf` 0; `kopfHoehe` ≤ 80 bei Fensterbreite ≥ 1024.

Dann mit `resize_window` auf 320, 390, 800, 1024 und 1440 px Breite je einmal `ueberlauf` prüfen und per Screenshot (oder `zoom`, falls Screenshots in den Timeout laufen) ansehen: Wortmarke im Auftakt zweizeilig ohne Überlauf, Unterzeile gesperrt, Kopf-Wortmarke lesbar, Fuß-Wortmarke unten angeschnitten mit vollen Oberlängen. Dunkel: `document.documentElement.dataset.theme = "dark"` und dieselben Ansichten. `better-typography`: liest sich „ü“ und „B“ bei 32 und 40 px? Wenn nicht, die Grenze in `text-vermerk`/`text-marke` anheben (Spec TP3 4), neu testen, committen, pushen.

Ohne JavaScript (Roh-HTML) im `javascript_tool`:
```js
fetch("/", { credentials: "include" })
  .then((antwort) => antwort.text())
  .then((html) => ({
    h1: /<h1[^>]*>[\s\S]*?Grünes[\s\S]*?Buch[\s\S]*?<\/h1>/.test(html),
    h1Versteckt: /<h1[^>]*data-story-einstieg/.test(html),
    unterzeile: html.includes("Charge für Charge"),
  }))
```
Expected: `{ h1: true, h1Versteckt: false, unterzeile: true }`.

Ergebnis (bestanden, Abweichungen) als HANDOFF-Zeile nachtragen und mit dem nächsten Task committen.

---

### Task 5: Wissen bündeln als Seite mit Randspalte

**Skills:** `ui-design-engine`, `better-layout`, `animate`, `better-accessibility`

**Files:**
- Create: `components/story/Randspalte.tsx`, `components/story/bewegung/randnotizen.ts`, `tests/handschrift.test.ts`
- Modify: `lib/query/community.ts` (vollständig neu), `components/story/WissenBuendeln.tsx` (vollständig neu), `components/story/Skelette.tsx`, `components/story/bewegung/start.ts`, `lib/query/umfragen.ts` (Kommentar), `app/globals.css`, `tests/community.test.ts` (vollständig neu), `tests/bewegung.test.ts`, `HANDOFF.md`
- Delete: `components/story/bewegung/wand.ts`

**Interfaces:**
- Consumes: `SCHREIBEN_AB`, `SCHREIBEN_BIS` (Task 4), `communityZahlen()` aus `lib/query/umfragen.ts` (unverändert).
- Produces: `type Randnotiz = { zahl: number | null; wort: string }`, `randnotizen(zahlen: CommunityZahlen | null): Randnotiz[]` (ersetzt `wandTags`), `Randspalte({ notizen: readonly Randnotiz[] })`, `RandspaltenSkelett()` (ersetzt `WandSkelett`), Choreografie `randnotizen`, Attribute `data-story="randspalte"`, `data-story="randnotiz"`, `data-randzahl` + `data-ziel`.

- [ ] **Step 1: `tests/community.test.ts` vollständig ersetzen** (failing)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { LEITSAETZE, hatCommunityZahlen, randnotizen, zuCommunityZahlen } from "@/lib/query/community";

test("Zeile aus D1 wird zu Zahlen, egal ob number, bigint oder string", () => {
  assert.deepEqual(zuCommunityZahlen([{ stimmen: 12, vorschlaege: 3n, runden: "2" }]), {
    stimmen: 12,
    vorschlaege: 3,
    runden: 2,
  });
});

test("fehlende oder kaputte Werte werden 0", () => {
  assert.deepEqual(zuCommunityZahlen([]), { stimmen: 0, vorschlaege: 0, runden: 0 });
  assert.deepEqual(zuCommunityZahlen(undefined), { stimmen: 0, vorschlaege: 0, runden: 0 });
  assert.deepEqual(zuCommunityZahlen([{ stimmen: "viele", vorschlaege: -1, runden: null }]), {
    stimmen: 0,
    vorschlaege: 0,
    runden: 0,
  });
});

test("leere Datenbank oder Fehler: die drei Leitsätze, ohne Zahl", () => {
  const leer = { stimmen: 0, vorschlaege: 0, runden: 0 };
  const erwartet = LEITSAETZE.map((wort) => ({ zahl: null, wort }));
  assert.equal(hatCommunityZahlen(leer), false);
  assert.deepEqual(randnotizen(leer), erwartet);
  assert.deepEqual(randnotizen(null), erwartet);
});

test("echte Zahlen: Zahl und Wort getrennt, Mehrzahl", () => {
  assert.deepEqual(randnotizen({ stimmen: 1284, vorschlaege: 2, runden: 9 }), [
    { zahl: 1284, wort: "Stimmen" },
    { zahl: 2, wort: "Vorschläge" },
    { zahl: 9, wort: "Runden" },
  ]);
});

test("Einzahl bei genau 1 (Spec TP3 12)", () => {
  assert.deepEqual(
    randnotizen({ stimmen: 1, vorschlaege: 1, runden: 1 }).map((notiz) => notiz.wort),
    ["Stimme", "Vorschlag", "Runde"],
  );
});

test("nur eine Zahl über 0: alle drei Zahlen, auch die Nullen, keine Leitsätze", () => {
  assert.deepEqual(randnotizen({ stimmen: 0, vorschlaege: 3, runden: 0 }), [
    { zahl: 0, wort: "Stimmen" },
    { zahl: 3, wort: "Vorschläge" },
    { zahl: 0, wort: "Runden" },
  ]);
});
```

- [ ] **Step 2: `tests/handschrift.test.ts` anlegen** (failing)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Randspalte } from "@/components/story/Randspalte";
import type { Randnotiz } from "@/lib/query/community";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

function randspalte(...notizen: Randnotiz[]): string {
  return renderToStaticMarkup(createElement(Randspalte, { notizen }));
}

test("Randnotiz mit Zahl: Zahl gedruckt, Wort von Hand, vorgelesen als ein Satz", () => {
  const html = randspalte({ zahl: 1284, wort: "Stimmen" });
  assert.match(html, /<span class="sr-only">1\.284 Stimmen<\/span>/);
  assert.match(
    html,
    /<span aria-hidden="true" data-randzahl="" data-ziel="1284" class="numeric text-display text-text">1\.284<\/span>/,
  );
  assert.match(
    html,
    /<span aria-hidden="true" data-story="randnotiz" class="font-hand text-notiz text-kopierstift">Stimmen<\/span>/,
  );
});

test("Leitsatz: nur Handschrift, ohne Zahl, nichts versteckt", () => {
  const html = randspalte({ zahl: null, wort: "Schlag vor." });
  assert.match(
    html,
    /<span data-story="randnotiz" class="inline-block font-hand text-notiz text-kopierstift">Schlag vor\.<\/span>/,
  );
  assert.doesNotMatch(html, /aria-hidden|data-randzahl|sr-only/);
});

test("Große Zahlen brechen um statt überzulaufen", () => {
  const html = randspalte({ zahl: 1234567, wort: "Stimmen" });
  assert.match(html, /1\.234\.567/);
  assert.match(html, /<li class="flex min-w-0 flex-wrap /);
});

test("Wissen bündeln: Randspalte ab lg, kein Schwenk, keine Wand", () => {
  const quelle = lies("components/story/WissenBuendeln.tsx");
  assert.match(quelle, /lg:grid-cols-\[minmax\(0,2fr\)_minmax\(0,1fr\)\]/);
  assert.match(quelle, /<Suspense fallback=\{<RandspaltenSkelett \/>\}>/);
  assert.doesNotMatch(quelle, /bg-surface-sunken|Textur|wand|font-wand/);
});
```

- [ ] **Step 3: Bewegungstests anhängen** (failing)

In `tests/bewegung.test.ts` den fs-Import erweitern: `import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";` und ans Ende:
```ts
test("Randspalte ohne Schwenk und Pin: wand.ts ist weg (Spec TP3 8.3)", () => {
  assert.equal(existsSync(join("components", "story", "bewegung", "wand.ts")), false);
  const start = readFileSync(join("components", "story", "bewegung", "start.ts"), "utf8");
  assert.match(start, /\brandnotizen\b/);
  assert.doesNotMatch(start, /\bwand\b/);
  assert.doesNotMatch(css, /ist-schwenk|wand-reihe/);
});

test("Randzahlen haben ein eigenes Attribut, data-zaehler bleibt der Doppelseite", () => {
  const ablauf = readFileSync(join("components", "story", "bewegung", "randnotizen.ts"), "utf8");
  assert.match(ablauf, /"\[data-randzahl\]"/);
  assert.doesNotMatch(ablauf, /data-zaehler/);
  assert.doesNotMatch(readFileSync(join("components", "story", "Randspalte.tsx"), "utf8"), /data-zaehler/);
});
```

- [ ] **Step 4: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/community.test.ts tests/handschrift.test.ts tests/bewegung.test.ts`
Expected: FAIL (`randnotizen` ist kein Export, `Randspalte` fehlt, `wand.ts` existiert).

- [ ] **Step 5: `lib/query/community.ts` vollständig ersetzen**

```ts
/**
 * Community-Zahlen für die Randspalte der Startseite (Spec 5.3, Spec TP3
 * 8.3), ohne Datenbankzugriff und ohne "server-only": die reine Zuordnung
 * ist so testbar. Die Abfrage selbst steht in lib/query/umfragen.ts.
 *
 * Bewusst nur Zähler: Vorschläge tragen Handelsnamen und unmoderierten
 * Freitext, beides gehört nicht in Handschrift auf die Startseite
 * (Leitplanke 4).
 */

export type CommunityZahlen = {
  stimmen: number;
  vorschlaege: number;
  runden: number;
};

type Zeile = Partial<Record<keyof CommunityZahlen, unknown>>;

/** Eine Randnotiz: Zahl gedruckt, Wort von Hand. Ohne Zahl ist sie ein Leitsatz. */
export type Randnotiz = { zahl: number | null; wort: string };

/** Die Leitsätze der Randspalte, wenn es noch nichts zu zählen gibt (Spec 5.2). */
export const LEITSAETZE = ["Schlag vor.", "Stimm ab.", "Lies mit."] as const;

/** D1 liefert COUNT je nach Adapter als number, bigint oder string. */
function alsZahl(wert: unknown): number {
  if (typeof wert === "bigint") return wert >= 0n ? Number(wert) : 0;
  if (typeof wert === "number") return Number.isFinite(wert) && wert >= 0 ? wert : 0;
  if (typeof wert === "string" && /^\d+$/.test(wert)) return Number(wert);
  return 0;
}

export function zuCommunityZahlen(zeilen: readonly Zeile[] | null | undefined): CommunityZahlen {
  const zeile = zeilen?.[0];
  return {
    stimmen: alsZahl(zeile?.stimmen),
    vorschlaege: alsZahl(zeile?.vorschlaege),
    runden: alsZahl(zeile?.runden),
  };
}

export function hatCommunityZahlen(zahlen: CommunityZahlen): boolean {
  return zahlen.stimmen + zahlen.vorschlaege + zahlen.runden > 0;
}

/**
 * Die Notizen der Randspalte: Zahl und Wort getrennt, Einzahl bei 1
 * (Spec TP3 12). Die Leitsätze, wenn alles 0 ist oder die Abfrage
 * fehlschlug.
 */
export function randnotizen(zahlen: CommunityZahlen | null): Randnotiz[] {
  if (!zahlen || !hatCommunityZahlen(zahlen)) return LEITSAETZE.map((wort) => ({ zahl: null, wort }));
  return [
    { zahl: zahlen.stimmen, wort: zahlen.stimmen === 1 ? "Stimme" : "Stimmen" },
    { zahl: zahlen.vorschlaege, wort: zahlen.vorschlaege === 1 ? "Vorschlag" : "Vorschläge" },
    { zahl: zahlen.runden, wort: zahlen.runden === 1 ? "Runde" : "Runden" },
  ];
}
```

- [ ] **Step 6: `components/story/Randspalte.tsx` anlegen**

```tsx
import type { Randnotiz } from "@/lib/query/community";

const ZAHL = new Intl.NumberFormat("de-DE");

/**
 * Die Randspalte der Sektion 3 (Spec TP3 8.3): die Zahl gedruckt in Geist
 * Mono, das Wort von Hand. Mit Zahl wird die Notiz als ein Satz vorgelesen
 * (sr-only); die sichtbaren Teile sind aria-hidden, weil die StoryBuehne
 * die Zahl hochzählt. Ein Leitsatz steht allein und wird direkt gelesen.
 * `min-w-0` und `flex-wrap`: große Zahlen schieben das Wort in die nächste
 * Zeile, statt bei 320 px überzulaufen.
 */
export function Randspalte({ notizen }: { notizen: readonly Randnotiz[] }) {
  return (
    <ul data-story="randspalte" className="flex flex-col gap-8">
      {notizen.map((notiz) => {
        if (notiz.zahl === null) {
          return (
            <li key={notiz.wort}>
              <span data-story="randnotiz" className="inline-block font-hand text-notiz text-kopierstift">
                {notiz.wort}
              </span>
            </li>
          );
        }
        const zahl = ZAHL.format(notiz.zahl);
        return (
          <li key={notiz.wort} className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="sr-only">{`${zahl} ${notiz.wort}`}</span>
            <span aria-hidden="true" data-randzahl="" data-ziel={notiz.zahl} className="numeric text-display text-text">
              {zahl}
            </span>
            <span aria-hidden="true" data-story="randnotiz" className="font-hand text-notiz text-kopierstift">
              {notiz.wort}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 7: `components/story/WissenBuendeln.tsx` vollständig ersetzen**

```tsx
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Randspalte } from "@/components/story/Randspalte";
import { RandspaltenSkelett } from "@/components/story/Skelette";
import { randnotizen, type CommunityZahlen } from "@/lib/query/community";
import { communityZahlen } from "@/lib/query/umfragen";

/**
 * Die Notizen der Randspalte: echte Zähler oder, wenn es nichts zu zählen
 * gibt oder die Abfrage scheitert, die drei Leitsätze (Spec 5.2). Ein Fehler
 * hier darf die Seite nicht kosten; Next-interne Unterbrechungen gehen
 * trotzdem durch.
 */
async function RandspaltenInhalt() {
  let zahlen: CommunityZahlen | null = null;
  try {
    zahlen = await communityZahlen();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("communityZahlen fehlgeschlagen", fehler);
  }
  return <Randspalte notizen={randnotizen(zahlen)} />;
}

/**
 * Sektion 3 (Spec TP3 8.3): eine Buchseite mit Randspalte. Links der
 * gedruckte Satz, ab lg rechts die Randnotizen der Community; darunter
 * stehen sie direkt unter dem Satz. Grund ist das Papier, kein Schwenk.
 */
export function WissenBuendeln() {
  return (
    <section
      aria-labelledby="wissen-titel"
      data-story="wissen"
      data-story-vorhang=""
      className="relative px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-16">
        <h2 id="wissen-titel" className="max-w-4xl font-buch text-kapitel text-text text-balance">
          Einer allein weiß wenig. Hier sammelt sich, was viele erfahren.
        </h2>
        <div className="lg:border-l lg:border-border lg:pl-8">
          <Suspense fallback={<RandspaltenSkelett />}>
            <RandspaltenInhalt />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 8: Skelett umbauen** (`components/story/Skelette.tsx`, Edit-Werkzeug)

Die Funktion `WandSkelett` ersetzen durch:
```tsx
export function RandspaltenSkelett() {
  return (
    <div role="status" data-skelett="" className="flex flex-col gap-8">
      <SkelettAnsage text="Zahlen werden geladen" />
      {["w-48", "w-56", "w-40"].map((breite) => (
        <span key={breite} aria-hidden="true" className={`${SKELETT_FLAECHE} h-12 ${breite}`} />
      ))}
    </div>
  );
}
```

- [ ] **Step 9: `components/story/bewegung/randnotizen.ts` anlegen**

```ts
import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

const ZAHL = new Intl.NumberFormat("de-DE");

/**
 * Sektion 3 (Spec TP3 8.3): die Randnotizen werden beim Eintritt
 * geschrieben, die Zahlen zählen dabei einmal hoch. Eigenes Attribut
 * `data-randzahl`: `data-zaehler` gehört den Noten der Doppelseite
 * (eintrag.ts, eine Nachkommastelle). Vorgelesen wird die sr-only-Zeile;
 * beim Aufräumen stehen wieder die Endwerte da.
 */
export const randnotizen: Choreografie = ({ gsap }) => {
  const spalte = document.querySelector<HTMLElement>('[data-story="randspalte"]');
  if (!spalte) return;
  const notizen = gsap.utils.toArray<HTMLElement>('[data-story="randnotiz"]', spalte);
  const zahlen = gsap.utils
    .toArray<HTMLElement>("[data-randzahl]", spalte)
    .filter((el) => Number.isFinite(Number(el.dataset.ziel)));

  // Sofort auf 0: die Sektion liegt beim Laden unter dem Falz; der Sprung
  // vom Endwert auf 0 fiele sonst beim Eintritt ins Auge.
  for (const el of zahlen) el.textContent = ZAHL.format(0);

  const ablauf = gsap.timeline({ scrollTrigger: { trigger: spalte, start: "top 80%", once: true } });
  ablauf.fromTo(notizen, SCHREIBEN_AB, { ...SCHREIBEN_BIS, stagger: 0.25 });
  for (const el of zahlen) {
    const stand = { wert: 0 };
    ablauf.to(
      stand,
      {
        wert: Number(el.dataset.ziel),
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = ZAHL.format(Math.round(stand.wert));
        },
      },
      0,
    );
  }

  return () => {
    for (const el of zahlen) el.textContent = ZAHL.format(Number(el.dataset.ziel));
  };
};
```

- [ ] **Step 10: `start.ts` umstellen, `wand.ts` löschen** (Edit-Werkzeug)

Import `import { wand } from "./wand";` löschen, hinter `import { beobachteLoops } from "./loops";` einfügen: `import { randnotizen } from "./randnotizen";`

Kommentar und Liste:
```ts
/**
 * Scroll-Ablaeufe der Sektionen 2 bis 9. Sie starten erst, wenn kein
 * Skelett mehr steht: sonst messen sie eine Seite, deren Hoehe sich noch
 * aendert. Tasks 14 und 15 tragen hier ein.
 *
 * Reihenfolge = Seitenreihenfolge: ScrollTrigger misst in Anlegereihenfolge,
 * und alles unterhalb des Wand-Pins muss nach dem Pin entstehen. Der Vorhang
 * steht deshalb zuletzt, er deckt auch die Abstimmung unter dem Pin auf.
 */
const SCROLL_CHOREOGRAFIEN: readonly Choreografie[] = [
  transparent,
  wand,
```
wird zu
```ts
/**
 * Scroll-Ablaeufe der Sektionen 2 bis 9. Sie starten erst, wenn kein
 * Skelett mehr steht: sonst messen sie eine Seite, deren Hoehe sich noch
 * aendert.
 *
 * Reihenfolge = Seitenreihenfolge: ScrollTrigger misst in Anlegereihenfolge.
 * Der Vorhang steht zuletzt; er deckt Sektion 3 und die Abstimmung auf.
 */
const SCROLL_CHOREOGRAFIEN: readonly Choreografie[] = [
  transparent,
  randnotizen,
```

```bash
git rm components/story/bewegung/wand.ts
```

- [ ] **Step 11: Schwenk-CSS und Abfrage-Kommentar** (Edit-Werkzeug)

In `app/globals.css` den Block löschen:
```css
  /* Schwenk der Wand ab Tablet; die Klasse setzt die StoryBuehne (Spec 5.1, Sektion 3). */
  .ist-schwenk .wand-reihe {
    flex-wrap: nowrap;
    width: max-content;
    column-gap: 20vw;
    padding-inline: 10vw;
  }
```
In `lib/query/umfragen.ts`: ` * Drei Zaehler fuer die Wand der Startseite (Spec 5.3).` → ` * Drei Zaehler fuer die Randspalte der Startseite (Spec 5.3, Spec TP3 8.3).`

- [ ] **Step 12: Tests laufen lassen**

Run: `npx tsx --test tests/community.test.ts tests/handschrift.test.ts tests/bewegung.test.ts` → PASS.
Run: `git grep -n "wandTags\|WandSkelett\|wand-tag\|wand-reihe" -- app components lib tests`
Expected: keine Treffer.

- [ ] **Step 13: HANDOFF (inkl. Ergebnis Prüfpunkt Task 4), Gesamtlauf, Commit, Push**

HANDOFF-Zeile: „Welle 1, Task 5 erledigt: Wissen bündeln als Seite mit Randspalte (Zahl gedruckt, Wort von Hand), `wand.ts` und Schwenk raus.“

```bash
npm test && npm run typecheck && npm run lint
git add -A components/story lib/query/community.ts lib/query/umfragen.ts app/globals.css tests/community.test.ts tests/handschrift.test.ts tests/bewegung.test.ts HANDOFF.md
git commit -m "feat: Wissen bündeln als Seite mit Randspalte (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

### Task 6: Schleife und Abstimmung in Handschrift, Stimmzettel-Skelett

**Skills:** `ui-design-engine`, `better-layout`, `animate`

**Files:**
- Modify: `components/story/GemeinsamLernen.tsx`, `components/story/Abstimmung.tsx` (vollständig neu), `components/story/bewegung/abstimmung.ts` (vollständig neu), `components/story/Skelette.tsx`, `app/globals.css`, `tests/handschrift.test.ts`, `HANDOFF.md`

**Interfaces:**
- Consumes: `SCHREIBEN_AB`, `SCHREIBEN_BIS` (Task 4), `text-vermerk`, `text-notiz` (Task 2).
- Produces: `data-story="waehl-mit"` (bleibt), Selektor `[data-story="vermerk"]` in `abstimmung.ts` (Ziele entstehen in Task 7), `StimmzettelSkelett` in Form des Stimmzettels.

- [ ] **Step 1: Failing tests anhängen** (`tests/handschrift.test.ts`; Import `import { StimmzettelSkelett } from "@/components/story/Skelette";` oben ergänzen)

```ts
test("Schleife: die Community schreibt von Hand, das Buch druckt", () => {
  const quelle = lies("components/story/GemeinsamLernen.tsx");
  assert.match(quelle, /\{ text: "Ihr schlagt vor\.", hand: true,/);
  assert.match(quelle, /\{ text: "Ihr stimmt ab\.", hand: true,/);
  assert.match(quelle, /\{ text: "Ich teste\.", hand: false,/);
  assert.match(quelle, /"font-hand text-vermerk text-kopierstift"/);
  assert.doesNotMatch(quelle, /font-wand|wand:|Sedgwick/);
});

test("Abstimmung: „Wähl mit.“ von Hand, ohne Wasserzeichen und Drip", () => {
  const quelle = lies("components/story/Abstimmung.tsx");
  assert.match(quelle, /<p data-story="waehl-mit" className="font-hand text-notiz text-kopierstift">\s*Wähl mit\.\s*<\/p>/);
  assert.doesNotMatch(quelle, /wasserzeichen|Textur|font-wand|rotate/);
  assert.match(lies("components/story/bewegung/abstimmung.ts"), /SCHREIBEN_AB/);
});

test("Skelett des Stimmzettels hat die Form des Stimmzettels", () => {
  const html = renderToStaticMarkup(createElement(StimmzettelSkelett));
  assert.match(html, /role="status"/);
  assert.match(html, /data-skelett=""/);
  assert.match(html, /border border-border-strong bg-surface-raised shadow-md/);
  assert.ok((html.match(/bg-surface-sunken/g)?.length ?? 0) >= 4);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/handschrift.test.ts` → FAIL.

- [ ] **Step 3: `components/story/GemeinsamLernen.tsx` anpassen** (Edit-Werkzeug)

Kopf der Datei bis einschließlich `stationKlasse` ersetzen durch:
```tsx
import { Loop } from "@/components/medien/Loop";
import { Button } from "@/components/ui";

/**
 * Sektion 4 (Spec 5.1, Spec TP3 8.4): die Schleife. Die Überschrift trägt
 * die Aussage; Kreis, Stationen und Video sind deren Bild und deshalb
 * aria-hidden. Die ersten beiden Stationen schreibt die Community von Hand,
 * die letzten beiden druckt das Buch. Handschrift im Grad text-vermerk
 * (32 px, die Mindestgröße): so groß wie die gedruckten Stationen, und am
 * rechten Rand verdeckt sie das Video nicht.
 */
const STATIONEN = [
  { text: "Ihr schlagt vor.", hand: true, ort: "top-0 left-1/2 -translate-x-1/2" },
  { text: "Ihr stimmt ab.", hand: true, ort: "top-1/2 right-0 -translate-y-1/2" },
  { text: "Ich teste.", hand: false, ort: "bottom-0 left-1/2 -translate-x-1/2" },
  { text: "Alle lesen.", hand: false, ort: "top-1/2 left-0 -translate-y-1/2" },
] as const;

function stationKlasse(hand: boolean): string {
  return hand ? "font-hand text-vermerk text-kopierstift" : "font-buch text-h1 font-medium text-text";
}
```
Danach `replace_all` `stationKlasse(station.wand)` → `stationKlasse(station.hand)` (zwei Stellen).

- [ ] **Step 4: `components/story/Abstimmung.tsx` vollständig ersetzen**

```tsx
import { Suspense } from "react";

import { StimmzettelSkelett } from "@/components/story/Skelette";
import { UmfrageKarte } from "@/components/umfrage/UmfrageKarte";
import { stimmZustand } from "@/components/umfrage/stimmzustand";
import { aktiveUmfrage, eigeneStimme } from "@/lib/query/umfragen";
import { aktuellesMitglied } from "@/lib/session";
import { sicher } from "@/lib/sicher";

/**
 * Der Stimmzettel. Der Zustand entsteht hier und nur hier; die Karte zeigt
 * ihn an, und über das Schreiben entscheidet die Server Action erneut.
 * Umfrage und Sitzung laden parallel; die eigene Stimme nur für freigegebene
 * Mitglieder.
 */
async function Stimmzettel() {
  const geladen = await sicher(
    async () => {
      const [umfrage, mitglied] = await Promise.all([aktiveUmfrage(), aktuellesMitglied()]);
      const optionId =
        umfrage && mitglied?.freigegeben ? await eigeneStimme(umfrage.id, mitglied.mitgliedId) : null;
      return { umfrage, mitglied, optionId };
    },
    null,
    "Stimmzettel",
  );
  if (!geladen) {
    return (
      <p className="max-w-[48ch] border border-border-strong bg-surface-raised p-8 text-body text-text">
        Die Abstimmung lässt sich gerade nicht laden. Lade die Seite in ein paar Minuten neu, der Rest funktioniert weiter.
      </p>
    );
  }

  const { umfrage, mitglied, optionId } = geladen;
  if (!umfrage) {
    return (
      <p className="max-w-[48ch] border border-border-strong bg-surface-raised p-8 text-body text-text">
        Gerade läuft keine Runde. Die nächste steht hier, sobald sie eröffnet ist.
      </p>
    );
  }

  return <UmfrageKarte umfrage={umfrage} zustand={stimmZustand(mitglied, optionId)} />;
}

/**
 * Sektion 6 (Spec TP3 8.6): der Stimmzettel im Buch, "Wähl mit." von Hand.
 * Ziel des Buttons "Wähl mit".
 */
export function Abstimmung() {
  return (
    <section
      id="abstimmung"
      aria-labelledby="abstimmung-titel"
      data-story="abstimmung"
      data-story-vorhang=""
      className="relative px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 lg:grid-cols-[2fr_3fr] lg:items-start">
        <div className="flex flex-col items-start gap-6">
          <h2 id="abstimmung-titel" className="font-buch text-kapitel text-text text-balance">
            Was teste ich als Nächstes?
          </h2>
          <p data-story="waehl-mit" className="font-hand text-notiz text-kopierstift">
            Wähl mit.
          </p>
          <p className="max-w-[48ch] text-body text-text-muted text-pretty">
            Gesetzte Plätze bestimme ich. Über die übrigen stimmen freigeschaltete Mitglieder ab, eine
            Stimme pro Runde.
          </p>
        </div>

        <Suspense fallback={<StimmzettelSkelett />}>
          <Stimmzettel />
        </Suspense>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: `components/story/bewegung/abstimmung.ts` vollständig ersetzen**

```ts
import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

/**
 * Sektion 6 (Spec TP3 8.6): "Wähl mit." und die Vermerke auf dem
 * Stimmzettel ("von euch", das "x" der eigenen Stimme) werden beim
 * Eintritt geschrieben. Die Stimmabgabe selbst bewegt sich nicht.
 */
export const abstimmung: Choreografie = ({ gsap }) => {
  const notizen = gsap.utils.toArray<HTMLElement>('[data-story="waehl-mit"], [data-story="vermerk"]');
  if (notizen.length === 0) return;
  gsap.fromTo(notizen, SCHREIBEN_AB, {
    ...SCHREIBEN_BIS,
    stagger: 0.15,
    scrollTrigger: { trigger: '[data-story="abstimmung"]', start: "top 70%", once: true },
  });
};
```

- [ ] **Step 6: Stimmzettel-Skelett** (`components/story/Skelette.tsx`, Edit-Werkzeug)

Die Funktion `StimmzettelSkelett` ersetzen durch:
```tsx
/** Auf dem Blatt des Stimmzettels (surface-raised) braucht das Skelett die tiefere Fläche. */
const SKELETT_AUF_BLATT = "block bg-surface-sunken motion-safe:animate-pulse";

export function StimmzettelSkelett() {
  return (
    <div role="status" data-skelett="" className="border border-border-strong bg-surface-raised shadow-md">
      <SkelettAnsage text="Abstimmung wird geladen" />
      <div aria-hidden="true" className="border-b border-border px-6 py-4">
        <span className={`${SKELETT_AUF_BLATT} h-6 w-32 rounded-full`} />
      </div>
      <div aria-hidden="true" className="flex flex-col gap-6 px-6 py-6">
        <span className={`${SKELETT_AUF_BLATT} h-8 w-2/3`} />
        {["w-3/4", "w-1/2", "w-2/3"].map((breite) => (
          <span key={breite} className={`${SKELETT_AUF_BLATT} h-6 ${breite}`} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Wasserzeichen-CSS löschen** (`app/globals.css`, Edit-Werkzeug)

```css
  /* Ton-in-Ton-Tag hinter der Abstimmung (Spec 4.3, Doja-Merch). */
  .wasserzeichen {
    font-size: clamp(12rem, 45vw, 40rem);
    line-height: 0.8;
  }
```
ersatzlos löschen.

- [ ] **Step 8: Tests laufen lassen**

Run: `npx tsx --test tests/handschrift.test.ts` → PASS.

- [ ] **Step 9: HANDOFF, Gesamtlauf, Commit, Push**

HANDOFF-Zeile: „Welle 1, Task 6 erledigt: Schleife (Stationen der Community von Hand, 32 px), ‚Wähl mit.‘ von Hand, Wasserzeichen und Drip raus, Stimmzettel-Skelett in Zettelform.“

```bash
npm test && npm run typecheck && npm run lint
git add components/story/GemeinsamLernen.tsx components/story/Abstimmung.tsx components/story/bewegung/abstimmung.ts components/story/Skelette.tsx app/globals.css tests/handschrift.test.ts HANDOFF.md
git commit -m "feat: Schleife und Abstimmung in Handschrift, Stimmzettel-Skelett (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

### Task 7: Stimmzettel-Vermerke und /umfragen, Live-Prüfpunkt Community

**Skills:** `ui-design-engine`, `better-accessibility`, `emil-design-eng`

**Files:**
- Create: `components/umfrage/Kandidat.tsx`
- Modify: `components/umfrage/UmfrageKarte.tsx`, `app/umfragen/page.tsx`, `tests/handschrift.test.ts`, `tests/umfrage-karte.test.ts`, `tests/hover.test.ts`, `HANDOFF.md`

**Interfaces:**
- Consumes: `text-vermerk`, `text-notiz` (Task 2); Selektor `[data-story="vermerk"]` in `abstimmung.ts` (Task 6).
- Produces: `Kandidat(props: KandidatProps)`, `type KandidatProps = { option: UmfrageOptionAnsicht; gesamt: number; gewaehlt: boolean; zeigeStimmen: boolean }`, `stimmenAnteil(option, gesamt): number` aus `components/umfrage/Kandidat.tsx`.

- [ ] **Step 1: Failing tests anhängen** (`tests/handschrift.test.ts`; Importe oben ergänzen)

```ts
import { Kandidat, type KandidatProps } from "@/components/umfrage/Kandidat";
import type { UmfrageOptionAnsicht } from "@/lib/query/umfragen";
```

```ts
function option(teil: Partial<UmfrageOptionAnsicht> = {}): UmfrageOptionAnsicht {
  return {
    id: "o1",
    strainId: "s1",
    handelsname: "Nebelharz 22 (fiktiv)",
    slug: "nebelharz-22",
    reihenfolge: 1,
    herkunft: "COMMUNITY",
    istGewinner: false,
    stimmen: 3,
    ergebnisReviewId: null,
    ...teil,
  };
}

function kandidat(teil: Partial<KandidatProps> = {}): string {
  const props: KandidatProps = { option: option(), gesamt: 5, gewaehlt: false, zeigeStimmen: true, ...teil };
  return renderToStaticMarkup(createElement("ul", null, createElement(Kandidat, props)));
}

test("Community-Platz: Vermerk „von euch“ von Hand, der Name gedruckt", () => {
  const html = kandidat();
  assert.match(html, /<span data-story="vermerk" class="font-hand text-vermerk text-kopierstift">von euch<\/span>/);
  assert.doesNotMatch(html, /class="stempel"/);
  const name = /<a [^>]*>Nebelharz 22 \(fiktiv\)<\/a>/.exec(html)?.[0] ?? "";
  assert.match(name, /\bfont-buch\b/);
  assert.doesNotMatch(name, /font-hand/);
});

test("Gesetzter Platz: Stempel, kein Vermerk, keine Handschrift", () => {
  const html = kandidat({ option: option({ herkunft: "GESETZT", stimmen: null }) });
  assert.match(html, /class="stempel"/);
  assert.doesNotMatch(html, /von euch|font-hand/);
});

test("Eigene Stimme: handgeschriebenes x vor dem Namen, nur als Bild, dazu das Badge", () => {
  const html = kandidat({ gewaehlt: true });
  assert.match(
    html,
    /<span aria-hidden="true" data-story="vermerk" class="font-hand text-vermerk text-kopierstift">x<\/span><a /,
  );
  assert.match(html, /Deine Stimme/);
});

test("Ohne eigene Stimme kein x", () => {
  assert.doesNotMatch(kandidat({ gewaehlt: false }), />x</);
});

test("Das x hängt an derselben Bedingung wie die Zähler: nie in der Vorschlagsphase", () => {
  assert.match(
    lies("components/umfrage/UmfrageKarte.tsx"),
    /const gewaehlteOption = zeigeStimmen && zustand\.art === "ABGESTIMMT" \? zustand\.optionId : null;/,
  );
});

test("/umfragen: Community-Überschriften von Hand, ohne Nebel und ohne Drehung", () => {
  const quelle = lies("app/umfragen/page.tsx");
  assert.match(quelle, /const HAND_TITEL = "font-hand text-notiz text-kopierstift";/);
  assert.equal(quelle.match(/className=\{cn\(HAND_TITEL, "self-start"\)\}/g)?.length, 2);
  assert.doesNotMatch(quelle, /Textur|font-wand|WAND_TITEL|rotate/);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/handschrift.test.ts`
Expected: FAIL mit „Cannot find module '@/components/umfrage/Kandidat'“.

- [ ] **Step 3: `components/umfrage/Kandidat.tsx` anlegen**

```tsx
import Link from "next/link";

import { Badge } from "@/components/ui";
import { namenLinkKlassen } from "@/components/ui/textlink";
import type { UmfrageOptionAnsicht } from "@/lib/query/umfragen";

const ZAHL_FORMATTER = new Intl.NumberFormat("de-DE");

/** Handschrift am Stimmzettel: die Mindestgröße 32 px (Spec TP3 4 und 8.6). */
const VERMERK = "font-hand text-vermerk text-kopierstift";

export type KandidatProps = {
  option: UmfrageOptionAnsicht;
  gesamt: number;
  gewaehlt: boolean;
  zeigeStimmen: boolean;
};

export function stimmenAnteil(option: UmfrageOptionAnsicht, gesamt: number): number {
  if (option.stimmen === null || gesamt <= 0) return 0;
  return Math.min(Math.max(option.stimmen / gesamt, 0), 1) * 100;
}

/**
 * Ein Kandidat auf dem Stimmzettel. Der Handelsname ist gedruckt
 * (Cormorant, Leitplanke 4). Die Herkunft ist sichtbar unterschieden:
 * gesetzte Plätze tragen den Stempel "Gesetzt", Community-Plätze den
 * Vermerk "von euch" von Hand (Spec TP3 8.6). Die eigene Stimme bekommt
 * zum Badge ein handgeschriebenes "x" vor dem Namen, nur als Bild.
 * Gesetzte Plätze tragen keinen Zähler und keinen Balken: `stimmen` ist
 * dort `null` ("steht nicht zur Wahl"), nicht `0` ("niemand wollte sie").
 * Eigene Datei, damit er ohne die Server Action des Stimmformulars rendert.
 */
export function Kandidat({ option, gesamt, gewaehlt, zeigeStimmen }: KandidatProps) {
  return (
    <li className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="flex min-w-0 items-baseline gap-2">
          {gewaehlt ? (
            <span aria-hidden="true" data-story="vermerk" className={VERMERK}>
              x
            </span>
          ) : null}
          <Link
            href={`/produkte/${option.slug}`}
            className={namenLinkKlassen("min-w-0 font-buch text-h3 font-medium wrap-break-word")}
            title={option.handelsname}
          >
            {option.handelsname}
          </Link>
        </span>

        <span className="flex items-center gap-2">
          {option.herkunft === "GESETZT" ? (
            <span className="stempel" title="Von mir gesetzt, nicht zur Wahl gestellt">
              Gesetzt
            </span>
          ) : null}
          {option.herkunft === "COMMUNITY" ? (
            <span data-story="vermerk" className={VERMERK}>
              von euch
            </span>
          ) : null}
          {option.istGewinner ? <Badge variante="success">Gewinner</Badge> : null}
          {gewaehlt ? <Badge variante="accent">Deine Stimme</Badge> : null}
          {zeigeStimmen && option.stimmen !== null ? (
            <span className="numeric text-small text-text">
              {`${ZAHL_FORMATTER.format(option.stimmen)} ${option.stimmen === 1 ? "Stimme" : "Stimmen"}`}
            </span>
          ) : null}
        </span>
      </div>

      {zeigeStimmen && option.stimmen !== null ? (
        <span aria-hidden="true" className="mt-2 flex h-2 w-full overflow-hidden bg-surface-sunken">
          {/* Datengrafik in Tinte, nicht in Blattgruen: Gruen ist Bedienung. */}
          <span className="block h-full bg-text" style={{ width: `${stimmenAnteil(option, gesamt)}%` }} />
        </span>
      ) : null}
    </li>
  );
}
```

- [ ] **Step 4: `components/umfrage/UmfrageKarte.tsx` umstellen** (Edit-Werkzeug)

a) Importblock (Zeilen 1 bis 10) ersetzen durch:
```tsx
import Link from "next/link";

import { Badge, buttonKlassen } from "@/components/ui";
import { Kandidat } from "@/components/umfrage/Kandidat";
import { StimmFormular } from "@/components/umfrage/StimmFormular";
import { PHASEN_LABEL } from "@/components/umfrage/phasen";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereRelativ } from "@/lib/format";
import type { UmfrageAnsicht } from "@/lib/query/umfragen";
```

b) Die Funktion `stimmenAnteil` und den Block von `/**\n * Ein Kandidat. Auf dem Stimmzettel spricht das Buch:` bis zur schließenden Klammer der Funktion `Kandidat` löschen (heute Zeilen 42 bis 110). `ZAHL_FORMATTER` bleibt (Gesamtzahl der Stimmen).

c) Doc-Kommentar über `export function UmfrageKarte`:
```tsx
/**
 * Die laufende Runde als Stimmzettel an der Wand (Spec TP2 4.2), auf der
 * Startseite und auf /umfragen gleich. Gesetzte Plaetze gestempelt, waehlbare
 * gespruht markiert. Server Component.
 */
```
→
```tsx
/**
 * Die laufende Runde als Stimmzettel im Buch (Spec TP2 4.2, Spec TP3 8.6),
 * auf der Startseite und auf /umfragen gleich. Gesetzte Plätze gestempelt,
 * Community-Plätze von Hand vermerkt (Kandidat.tsx). Server Component.
 */
```

- [ ] **Step 5: `app/umfragen/page.tsx` umstellen** (Edit-Werkzeug)

a) Zeile `import { Textur } from "@/components/medien/Textur";` löschen.

b)
```tsx
/** Wand-Ueberschrift: kurz, Imperativ, in Sprühviolett (Guideline 8). */
const WAND_TITEL = "font-wand text-tag text-kopierstift";
```
→
```tsx
/** Handschrift-Überschrift: kurz, Imperativ, in Kopierstift (Spec TP3 10). */
const HAND_TITEL = "font-hand text-notiz text-kopierstift";
```

c) Doc-Kommentar: ` * Hier spricht die Wand (Spec TP2 4.2): Tags in Sedgwick, Namen und\n * Begruendungen im Buchstil.` → ` * Hier spricht die Community (Spec TP3 10): Überschriften von Hand,\n * Namen und Begründungen gedruckt.`

d) `className={cn(WAND_TITEL, "-rotate-2 self-start")}` → `className={cn(HAND_TITEL, "self-start")}`

e)
```tsx
          <div className="relative isolate self-start">
            <Textur id="nebel" weich className="absolute -inset-x-8 -inset-y-4 -z-10 opacity-40" />
            <h2 id="vorschlaege-titel" className={cn(WAND_TITEL, "-rotate-1")}>
              Eure Vorschläge.
            </h2>
          </div>
```
→
```tsx
          <h2 id="vorschlaege-titel" className={cn(HAND_TITEL, "self-start")}>
            Eure Vorschläge.
          </h2>
```

- [ ] **Step 6: Bestehende Tests auf die neue Datei ausrichten** (Edit-Werkzeug)

`tests/umfrage-karte.test.ts`, Zeile 6:
```ts
const QUELLE = readFileSync(join(process.cwd(), "components/umfrage/UmfrageKarte.tsx"), "utf8");
```
→
```ts
/** Der Stimmzettel und sein Kandidat (seit TP3 eigene Datei, damit er ohne Server Action rendert). */
const QUELLE = ["components/umfrage/UmfrageKarte.tsx", "components/umfrage/Kandidat.tsx"]
  .map((datei) => readFileSync(join(process.cwd(), datei), "utf8"))
  .join("\n");
```

`tests/hover.test.ts`: in `DATEIEN` hinter `"components/umfrage/StimmFormular.tsx",` die Zeile `"components/umfrage/Kandidat.tsx",` einfügen.

- [ ] **Step 7: Tests laufen lassen**

Run: `npx tsx --test tests/handschrift.test.ts tests/umfrage-karte.test.ts tests/hover.test.ts` → PASS.

- [ ] **Step 8: HANDOFF, Gesamtlauf, Commit, Push**

HANDOFF-Zeile: „Welle 1, Task 7 erledigt: Stimmzettel mit ‚von euch‘ und ‚x‘ von Hand, `Kandidat` eigene Datei, /umfragen-Überschriften von Hand ohne Nebel.“

```bash
npm test && npm run typecheck && npm run lint
git add components/umfrage/Kandidat.tsx components/umfrage/UmfrageKarte.tsx app/umfragen/page.tsx tests/handschrift.test.ts tests/umfrage-karte.test.ts tests/hover.test.ts HANDOFF.md
git commit -m "feat: Stimmzettel-Vermerke von Hand, /umfragen ohne Wand (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 9: Live-Prüfpunkt Community** (Browser-MCP, sichtbarer Tab)

Stand erkennen: Im Roh-HTML von `/umfragen` steht `font-hand text-notiz`. Sonst wie in Task 4 Step 9 verfahren.

Auf `/` und `/umfragen` das Skript aus Task 4 Step 9 (Handschrift ≥ 32 px, kein Überlauf) bei 320, 390, 800, 1024 und 1440 px, hell und dunkel. Ansehen:
- Sektion 3: ab 1024 px Randspalte rechts neben dem Satz mit Trennlinie, darunter die Notizen unter dem Satz; beim Hineinscrollen schreiben sich die Wörter, die Zahlen zählen hoch (live ohne Daten: die drei Leitsätze).
- Sektion 4 (ab 768 px): die Stationen „Ihr schlagt vor.“ und „Ihr stimmt ab.“ verdecken das Video höchstens am Rand.
- Sektion 6 und `/umfragen`: „Wähl mit.“ schreibt sich; läuft eine Runde, stehen „von euch“ an den Community-Plätzen und kein Vermerk an gesetzten Plätzen. Läuft live keine Runde, das im HANDOFF als „nicht live geprüft, durch Tests abgedeckt“ vermerken.
- Tastatur: Tab durch Kopf, Auftakt-Button, Stimmzettel; Fokus überall sichtbar, keine Handschrift an Links oder Buttons.

Ergebnis als HANDOFF-Zeile nachtragen, mit Task 8 committen.

---

### Task 8: Aufräumen (Sedgwick, SprayFilter, Textur, Masken, alte Tokens)

**Skills:** `ui-design-engine`, `safe-refactor`

**Files:**
- Delete: `components/marke/SprayFilter.tsx`, `components/medien/Textur.tsx`, `public/medien/drip-maske.png`, `public/medien/nebel-maske.png`, `public/medien/marmor-maske.png`
- Modify: `app/layout.tsx`, `app/globals.css`, `lib/medien.ts`, `components/layout/Fuss.tsx`, `scripts/medien/aufbereiten.ts`, `scripts/medien/verarbeitung.ts`, `components/story/FeldbuchRaster.tsx`, `components/story/Katalog.tsx`, `components/story/bewegung/vorhang.ts`, `tests/marke.test.ts`, `tests/medien.test.ts`, `tests/medien-verarbeitung.test.ts`, `tests/primitive.test.ts`, `HANDOFF.md`

**Interfaces:**
- Produces: `MedienArt = "foto" | "video"` (Welle 2 ergänzt `objekt` und `tafel`); `MASKEN_BREITE`, `maskeUmkehren`, `zuMaskePng`, `Textur`, `SprayFilter`, `font-wand`, `text-tag`, `text-auftakt`, `text-wortmarke` gibt es nicht mehr.

- [ ] **Step 1: Failing tests anhängen** (`tests/marke.test.ts`; Importe oben um `readdirSync, statSync` aus `node:fs` ergänzen)

```ts
function quellen(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) return name === "generated" ? [] : quellen(pfad);
    return /\.(ts|tsx|css)$/.test(name) ? [pfad] : [];
  });
}

const QUELLEN = ["app", "components", "lib"].flatMap(quellen);

test("keine Reste von Wand und Graffiti in app, components, lib (Spec TP3 15.2)", () => {
  const treffer = QUELLEN.flatMap((pfad) =>
    readFileSync(pfad, "utf8")
      .split("\n")
      .flatMap((zeile, index) =>
        /font-wand|sedgwick|spray|textur|text-tag\b|text-auftakt|text-wortmarke|gb-/i.test(zeile)
          ? [`${pfad}:${index + 1}: ${zeile.trim()}`]
          : [],
      ),
  );
  assert.deepEqual(treffer, []);
});

test("Handschrift nur in den Handschrift-Graden: nie unter 32 px (Spec TP3 15.3)", () => {
  const GRAD = /text-(marke|umschlag|notiz|vermerk)\b/;
  const treffer = QUELLEN.filter((pfad) => /\.tsx?$/.test(pfad) && !pfad.endsWith(join("marke", "Wortmarke.tsx")))
    .flatMap((pfad) =>
      readFileSync(pfad, "utf8")
        .split("\n")
        .flatMap((zeile, index) => (zeile.includes("font-hand") && !GRAD.test(zeile) ? [`${pfad}:${index + 1}`] : [])),
    );
  assert.deepEqual(treffer, []);
});
```

Wer einen Kommentar mit `font-hand` schreibt, nennt den Grad in derselben Zeile, sonst schlägt der zweite Test an.

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/marke.test.ts`
Expected: FAIL mit Treffern in `app/layout.tsx` (Sedgwick, SprayFilter), `app/globals.css` (`--font-wand`, `.gb-*`, `.wand-textur`, `--text-tag` …), `components/marke/SprayFilter.tsx`, `components/medien/Textur.tsx`, `components/layout/Fuss.tsx` („Textur“), `components/story/FeldbuchRaster.tsx`.

- [ ] **Step 3: Dateien löschen**

```bash
git rm components/marke/SprayFilter.tsx components/medien/Textur.tsx public/medien/drip-maske.png public/medien/nebel-maske.png public/medien/marmor-maske.png
```

- [ ] **Step 4: `app/layout.tsx`** (Edit-Werkzeug)

- `  Sedgwick_Ave_Display,` aus dem Import löschen.
- `import { SprayFilter } from "@/components/marke/SprayFilter";` löschen.
- Den Block `/** Nur die Wand. Ein Schnitt, eine Datei. */` bis `});` von `const sedgwick` löschen.
- Im `className` `${sedgwick.variable} ` löschen.
- Die Zeile `        <SprayFilter />` löschen.

- [ ] **Step 5: `app/globals.css`** (Edit-Werkzeug)

- `  --font-wand: var(--font-sedgwick), "Segoe Print", cursive;` löschen.
- Im Block „Display Grünes Buch“ löschen: den Kommentar `/* Wortmarke im Kopf: Cormorant 500, weil 300 erst ab 40px traegt. */` samt drei `--text-wortmarke`-Zeilen; die zwei Kommentarzeilen `/* Randfuellender Titel im Auftakt, zwei Zeilen Versalien. */` und `/* 23.3vw: … */` samt drei `--text-auftakt`-Zeilen; die drei `--text-tag`-Zeilen. `--text-kapitel` und `--text-titel` bleiben.
- Überschrift `   Material: Medien, Wand, Feldbuch` → `   Material: Medien, Handschrift, Feldbuch`.
- Löschen: Block `/* Wand-Textur: Alpha-Maske aus der Pipeline, eingefaerbt in spray. */` + `.wand-textur { … }`; Block `/* Aufkleber "gb" (Spec 4.3). … */` + `.gb-aufkleber`, `.gb-kontur`, Kommentar + `.gb-tag { … }`; Block `/* Holo-Schimmer … */` + `@media (hover: hover) and (prefers-reduced-motion: no-preference) { … }`.

Run: `git grep -n -i "spray\|sedgwick\|wand\|gb-\|text-tag\|auftakt\b" -- app/globals.css`
Expected: keine Treffer außer `.auftakt-marke`/`.auftakt-unterzeile`-Zeilen (Task 3).

- [ ] **Step 6: `lib/medien.ts`** (Edit-Werkzeug)

- `export type MedienArt = "foto" | "maske" | "video";` → `export type MedienArt = "foto" | "video";`
- `  /** Pflicht bei Fotos. Masken und Videos sind dekorativ und bleiben leer. */` → `  /** Pflicht bei Fotos. Videos sind dekorativ und bleiben leer. */`
- Löschen: `  /** Nur Masken: helle Farbe auf dunklem Grund statt dunkel auf hell. */` und `  maskeUmkehren?: boolean;`
- Löschen: `export const MASKEN_BREITE = 960;`
- Löschen: die drei Einträge mit `id: "drip"`, `id: "nebel"`, `id: "marmor"` (je von `  {` bis `  },`).
- In `dateienVon` löschen: `    case "maske":` und `      return [\`${m.datei}-maske.png\`];`

- [ ] **Step 7: Pipeline-Skripte** (Edit-Werkzeug)

`scripts/medien/aufbereiten.ts`:
- Import: `  MASKEN_BREITE,` löschen; `import { waehleSdVideo, zuGraustufenWebp, zuMaskePng, zuStandbildWebp, type PexelsVideoDatei } from "./verarbeitung";` → `import { waehleSdVideo, zuGraustufenWebp, zuStandbildWebp, type PexelsVideoDatei } from "./verarbeitung";`
- In `bild()` löschen:
```ts
  if (m.art === "maske") {
    schreibe(`${m.datei}-maske.png`, await zuMaskePng(original, MASKEN_BREITE, m.maskeUmkehren));
    return;
  }
```

`scripts/medien/verarbeitung.ts`: den Block von `/**\n * Wand-Textur als Alpha-Maske: Luminanz wird Deckkraft (Spec 4.5).` bis zur schließenden Klammer von `zuMaskePng` löschen.

- [ ] **Step 8: Übrige Stellen** (Edit-Werkzeug)

- `components/layout/Fuss.tsx`: `{ foto: "Foto", maske: "Textur", video: "Video" }` → `{ foto: "Foto", video: "Video" }`
- `components/story/FeldbuchRaster.tsx`, Kopfkommentar: ` * Die Notizen stehen in Cormorant kursiv wie Bleistift im Feldbuch, nicht\n * in Sedgwick: sie sind die Stimme des Buchs, nicht der Wand.` → ` * Die Notizen stehen in Cormorant kursiv wie Bleistift im Feldbuch, nicht\n * in Handschrift: sie sind die Stimme des Buchs, nicht der Community.`
- `components/story/Katalog.tsx`: `/** Sektion 7 (Spec 5.1): ruhiges Buch nach der Wand. */` → `/** Sektion 7 (Spec 5.1): ruhiges Buch nach der Abstimmung. */`
- `components/story/bewegung/vorhang.ts`: ` * Bruch in der Story: die Wand-Sektionen werden per clip-path von oben\n * aufgedeckt (Spec 4.6), gekoppelt an den Scrollweg beim Eintritt.` → ` * Sektionswechsel als Vorhang: Sektionen mit data-story-vorhang werden per\n * clip-path von oben aufgedeckt (Spec 4.6), gekoppelt an den Scrollweg beim Eintritt.`

- [ ] **Step 9: Tests der entfernten Teile anpassen** (Edit-Werkzeug)

`tests/medien.test.ts`:
```ts
test("Masken und Videos haben feste Dateinamen", () => {
  assert.deepEqual(dateienVon(beispiel("maske")), ["x-maske.png"]);
  assert.deepEqual(dateienVon(beispiel("video")), ["x.mp4", "x-standbild.webp"]);
});
```
→
```ts
test("Videos haben feste Dateinamen", () => {
  assert.deepEqual(dateienVon(beispiel("video")), ["x.mp4", "x-standbild.webp"]);
});
```

`tests/medien-verarbeitung.test.ts`: `zuMaskePng` aus dem Import löschen; die Hilfen `streifen` und `alphaWerte` sowie die vier Tests „Maske: dunkle Farbe wird deckend, heller Grund durchsichtig“, „Maske umgekehrt: helle Farbe wird deckend“, „Maske wird auf 3:2 zugeschnitten“, „Maske hat höchstens 16 Deckkraftstufen“ löschen.

`tests/primitive.test.ts`: `import { Textur } from "@/components/medien/Textur";` und den Test „Textur weich: zweite Maskenebene blendet die Kanten aus“ löschen.

- [ ] **Step 10: Tests laufen lassen**

Run: `npm test` → PASS (alle Dateien).
Run: `npm run typecheck && npm run lint` → grün.

- [ ] **Step 11: HANDOFF (inkl. Ergebnis Prüfpunkt Task 7), Commit, Push**

HANDOFF-Zeile: „Welle 1, Task 8 erledigt: Sedgwick, SprayFilter, Textur, Masken (drip, nebel, marmor) und alte Tokens entfernt; Suche nach Wand-Resten in app/components/lib als Test.“

```bash
git add -A app components lib scripts/medien public/medien tests HANDOFF.md
git commit -m "refactor: Wand und Graffiti vollständig entfernt (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

### Task 9: Signet „gB“, Favicon und App-Icon

**Skills:** `ui-design-engine`, `better-colors`

**Files:**
- Create: `assets/marke/Inspiration-Regular.ttf`, `assets/marke/OFL.txt`, `scripts/marke/ico.ts`, `scripts/marke/signet.ts`, `tests/signet.test.ts`, `app/icon.png`, `app/apple-icon.png`, `assets/marke/signet-1080.png`
- Modify: `app/favicon.ico` (ersetzt die Next-Vorlage), `HANDOFF.md`

**Interfaces:**
- Produces: `icoAusPngs(bilder: readonly IcoBild[]): Buffer`, `type IcoBild = { kante: number; png: Buffer }` aus `scripts/marke/ico.ts`. Next liest `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` als Datei-Konvention (Doku: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md`).

- [ ] **Step 1: Schriftdatei laden** (einmal; bei Netzfehler sofort stoppen und melden, Memory `netzwerk-schonen`)

```bash
mkdir -p assets/marke
curl -fsSL -o assets/marke/Inspiration-Regular.ttf https://raw.githubusercontent.com/google/fonts/main/ofl/inspiration/Inspiration-Regular.ttf
curl -fsSL -o assets/marke/OFL.txt https://raw.githubusercontent.com/google/fonts/main/ofl/inspiration/OFL.txt
```
Expected: zwei Dateien, die TTF rund 100 KB. Nur bei **HTTP 404** (kein Netzfehler) einmal über die CSS-Schnittstelle, die für `curl` TrueType ausliefert:
```bash
curl -fsS "https://fonts.googleapis.com/css2?family=Inspiration" | grep -o "https://[^)]*\.ttf"
```
und die ausgegebene Adresse nach `assets/marke/Inspiration-Regular.ttf` laden. Ohne `OFL.txt` aus dem Google-Fonts-Repo nicht weitermachen (Lizenztext nicht selbst schreiben), sondern melden.

- [ ] **Step 2: Failing test anlegen** (`tests/signet.test.ts`)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import sharp from "sharp";

import { icoAusPngs } from "../scripts/marke/ico";

async function quadrat(kante: number): Promise<Buffer> {
  return sharp({ create: { width: kante, height: kante, channels: 4, background: "#853dc2" } }).png().toBuffer();
}

test("ICO-Container: Kopf, Verzeichnis, PNG-Daten in Reihenfolge", async () => {
  const gross = await quadrat(32);
  const klein = await quadrat(16);
  const ico = icoAusPngs([
    { kante: 32, png: gross },
    { kante: 16, png: klein },
  ]);
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 2);
  assert.deepEqual([ico[6], ico[7], ico.readUInt16LE(10), ico.readUInt16LE(12)], [32, 32, 1, 32]);
  assert.equal(ico.readUInt32LE(14), gross.length);
  assert.equal(ico.readUInt32LE(18), 6 + 2 * 16);
  assert.deepEqual([ico[22], ico[23]], [16, 16]);
  assert.equal(ico.readUInt32LE(30), klein.length);
  assert.equal(ico.readUInt32LE(34), 6 + 2 * 16 + gross.length);
  assert.deepEqual(ico.subarray(38, 38 + gross.length), gross);
  assert.equal(ico.length, 38 + gross.length + klein.length);
});

test("ICO: Kante 256 steht als 0 im Verzeichnis, größere werden abgelehnt", async () => {
  const ico = icoAusPngs([{ kante: 256, png: await quadrat(1) }]);
  assert.deepEqual([ico[6], ico[7]], [0, 0]);
  assert.throws(() => icoAusPngs([{ kante: 512, png: Buffer.alloc(1) }]), /256/);
});

test("Schrift der Marke liegt mit Lizenz im Repo", () => {
  assert.equal(readFileSync("assets/marke/Inspiration-Regular.ttf").readUInt32BE(0), 0x00010000);
  assert.match(readFileSync("assets/marke/OFL.txt", "utf8"), /SIL OPEN FONT LICENSE/i);
});

test("Signet liegt in allen Größen vor (Spec TP3 6)", async () => {
  const soll = [
    ["app/icon.png", 512],
    ["app/apple-icon.png", 180],
    ["assets/marke/signet-1080.png", 1080],
  ] as const;
  for (const [datei, kante] of soll) {
    const meta = await sharp(readFileSync(datei)).metadata();
    assert.deepEqual([meta.format, meta.width, meta.height], ["png", kante, kante], datei);
  }
  const ico = readFileSync("app/favicon.ico");
  assert.equal(ico.readUInt16LE(4), 2);
  assert.deepEqual([ico[6], ico[22]], [32, 16]);
});
```

- [ ] **Step 3: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/signet.test.ts`
Expected: FAIL mit „Cannot find module '../scripts/marke/ico'“.

- [ ] **Step 4: `scripts/marke/ico.ts` anlegen**

```ts
/**
 * Baut einen ICO-Container aus fertigen PNG-Bildern (Spec TP3 6). Einträge
 * mit PNG-Daten verstehen alle Browser; eine Bibliothek dafür wäre ein neues
 * Paket (Memory netzwerk-schonen). Nur Entwicklungszeit.
 */
export type IcoBild = { kante: number; png: Buffer };

const KOPF = 6;
const EINTRAG = 16;

export function icoAusPngs(bilder: readonly IcoBild[]): Buffer {
  const verzeichnis = Buffer.alloc(KOPF + EINTRAG * bilder.length);
  verzeichnis.writeUInt16LE(0, 0);
  verzeichnis.writeUInt16LE(1, 2);
  verzeichnis.writeUInt16LE(bilder.length, 4);

  let versatz = verzeichnis.length;
  bilder.forEach(({ kante, png }, index) => {
    if (!Number.isInteger(kante) || kante < 1 || kante > 256) {
      throw new Error(`ICO: Kante ${kante} liegt nicht zwischen 1 und 256`);
    }
    const stelle = KOPF + EINTRAG * index;
    // 256 steht im Verzeichnis als 0 (ein Byte).
    verzeichnis.writeUInt8(kante === 256 ? 0 : kante, stelle);
    verzeichnis.writeUInt8(kante === 256 ? 0 : kante, stelle + 1);
    verzeichnis.writeUInt8(0, stelle + 2);
    verzeichnis.writeUInt8(0, stelle + 3);
    verzeichnis.writeUInt16LE(1, stelle + 4);
    verzeichnis.writeUInt16LE(32, stelle + 6);
    verzeichnis.writeUInt32LE(png.length, stelle + 8);
    verzeichnis.writeUInt32LE(versatz, stelle + 12);
    versatz += png.length;
  });

  return Buffer.concat([verzeichnis, ...bilder.map((bild) => bild.png)]);
}
```

- [ ] **Step 5: `scripts/marke/signet.ts` anlegen**

```ts
/**
 * Erzeugt das Signet "gB" aus der Schriftdatei (Spec TP3 6): Glyphen der
 * Inspiration in violett-500 auf neutral-100, quadratisch, nicht gezeichnet.
 * Einmal zur Entwicklungszeit, nie im Request-Pfad.
 *
 *   npx tsx scripts/marke/signet.ts
 *
 * Satori (über next/og) setzt die Glyphen, sharp skaliert. Ergebnis:
 * app/icon.png (512), app/apple-icon.png (180), app/favicon.ico (32 und 16)
 * und assets/marke/signet-1080.png für das Instagram-Profilbild.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { createElement } from "react";
import sharp from "sharp";

import { linearZuHex, oklchZuLinearSrgb } from "../farben/oklch.mjs";
import { icoAusPngs } from "./ico";

const KANTE = 1080;
/** Schriftgröße relativ zur Kante: "gB" mit Luft rundum. Nur diesen Wert und VERSATZ anpassen. */
const SCHRIFTGROESSE = Math.round(KANTE * 0.62);
/** Senkrechte Korrektur in px: die Schreibschrift sitzt in ihrer Zeilenbox oft zu hoch. */
const VERSATZ = 0;

/** Farben aus denselben OKLCH-Werten wie globals.css (Primitive violett-500, neutral-100). */
const VIOLETT_500 = linearZuHex(oklchZuLinearSrgb(0.52, 0.2, 305));
const NEUTRAL_100 = linearZuHex(oklchZuLinearSrgb(0.935, 0.006, 165));

function schreibe(pfad: string, inhalt: Buffer) {
  writeFileSync(join(process.cwd(), pfad), inhalt);
  console.log(`${pfad.padEnd(32)} ${Math.round(inhalt.length / 1024)} KB`);
}

async function main() {
  const schrift = readFileSync(join(process.cwd(), "assets/marke/Inspiration-Regular.ttf"));
  const antwort = new ImageResponse(
    createElement(
      "div",
      {
        style: {
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: NEUTRAL_100,
          color: VIOLETT_500,
          fontFamily: "Inspiration",
          fontSize: SCHRIFTGROESSE,
          lineHeight: 1,
          paddingTop: VERSATZ,
        },
      },
      "gB",
    ),
    { width: KANTE, height: KANTE, fonts: [{ name: "Inspiration", data: schrift, weight: 400, style: "normal" }] },
  );
  const gross = Buffer.from(await antwort.arrayBuffer());
  const png = (kante: number) => sharp(gross).resize(kante, kante).png({ compressionLevel: 9 }).toBuffer();

  schreibe("assets/marke/signet-1080.png", gross);
  schreibe("app/icon.png", await png(512));
  schreibe("app/apple-icon.png", await png(180));
  schreibe(
    "app/favicon.ico",
    icoAusPngs([
      { kante: 32, png: await png(32) },
      { kante: 16, png: await png(16) },
    ]),
  );
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
```

- [ ] **Step 6: Signet erzeugen und ansehen**

Run: `npx tsx scripts/marke/signet.ts`
Expected: vier Zeilen mit Dateigrößen, Exit 0.

`assets/marke/signet-1080.png` und `app/icon.png` mit dem Read-Werkzeug ansehen. Abnahme: „gB“ vollständig im Quadrat, rundum Luft (mindestens etwa ein Zehntel der Kante), optisch mittig, Farbe Violett auf hellem Papier. Ist etwas angeschnitten, `SCHRIFTGROESSE` in Schritten von 0,05 senken; sitzt es zu hoch oder zu tief, `VERSATZ` in Schritten von 20 px ändern; dann Step 6 wiederholen. `app/favicon.ico` bei 32 px ansehen: das „g“ und das „B“ sind als zwei Zeichen erkennbar.

- [ ] **Step 7: Tests laufen lassen**

Run: `npx tsx --test tests/signet.test.ts` → PASS (4 Tests).
Run: `npm test && npm run typecheck && npm run lint` → grün.

- [ ] **Step 8: HANDOFF, Commit, Push**

HANDOFF-Zeile: „Welle 1, Task 9 erledigt: Signet ‚gB‘ aus der Schriftdatei (OFL im Repo), `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` neu, `assets/marke/signet-1080.png` für Instagram (nicht ausgeliefert).“

```bash
git add assets/marke scripts/marke tests/signet.test.ts app/icon.png app/apple-icon.png app/favicon.ico HANDOFF.md
git commit -m "feat: Signet gB als Favicon und App-Icon aus der Schrift (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 9: Live-Prüfung Icons** (Browser-MCP)

Stand erkennen und prüfen im `javascript_tool` auf `/`:
```js
[...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')].map((link) => `${link.rel} ${link.getAttribute("sizes")} ${link.href}`)
```
Expected: ein `icon` mit `/favicon.ico`, ein `icon` mit `sizes 512x512` auf `/icon.png…`, ein `apple-touch-icon` mit `180x180`. Den Tab-Titel ansehen: das neue Signet steht im Tab (Browser-Cache: einmal hart neu laden).

---

### Task 10: Brand Guideline und Code-Regeln auf „Buch und Handschrift“

**Skills:** `better-writing`, `ui-design-engine`

**Files:**
- Modify: `docs/brand/gruenes-buch.md` (vollständig neu), `.claude/skills/ui-design-engine.md` (vollständig neu), `.claude/skills/ui-design-engine/SKILL.md`, `HANDOFF.md`

- [ ] **Step 1: `docs/brand/gruenes-buch.md` vollständig ersetzen**

````markdown
# Grünes Buch: Brand Guideline

Stand 2026-09-24 (TP3 „Marke und Medien“). Quellen der Entscheidungen:
`docs/superpowers/specs/2026-09-23-makeover-gruenes-buch-design.md` und für Marke, Handschrift und Bildsprache
`docs/superpowers/specs/2026-09-24-makeover-teilprojekt-3-marke-medien-design.md`.
Code-Regeln dazu: `.claude/skills/ui-design-engine.md`. Tokens: `app/globals.css` (geprüft mit `npm run farben`).

## 1. Idee: Buch und Handschrift

Das Buch ist meine Stimme: gedruckt, systematisch, belegbar, an Chargen gebunden. Messwerte, Reviews,
Katalogdaten, Handelsnamen, Rechtshinweise und Bedienung sind immer gedruckt. Von Hand geschrieben wird,
was mitgeschrieben wird: die Community (Stimmen, Vorschläge, Zähler, „Wähl mit.“, „Ihr schlagt vor.“) und
der Titel auf dem Umschlag, das Logo. Das Buch führt deutlich: Handschrift steht nur in kurzen Zeilen,
höchstens etwa sechs Wörter, nie als Absatz.

Die Form der Handschrift ist die **Randnotiz**: auf breiten Ansichten in einer Randspalte neben dem
gedruckten Text, auf dem Handy direkt zwischen den Absätzen. Motive liegen auf der Seite wie
hineingelegte Dinge: freigestellt, in Farbe, mit weichem Kontaktschatten, vor oder hinter der Schrift.
Was sich nicht freistellen lässt (Trichom-Makro, Video), steht als eckige **Tafel** im Buch.

Der Kopierstift erzählt mit: Er schreibt grauviolett und läuft kräftig violett aus, sobald er feucht
wird. Daher kommen die Farbe der Handschrift und der eine WebGL-Effekt (Abschnitt 7).

## 2. Name und Logo

- **Wortmarke** „Grünes Buch“ in Inspiration (400), immer in `kopierstift`. Der Name ist echter Text,
  kein Bild. Im Kopf in `text-marke` (40 px, eine Zeile), im Auftakt als `h1` in `text-umschlag`
  (zweizeilig), im Fuß in `text-umschlag` einzeilig und unten angeschnitten.
- **Unterzeile** „Charge für Charge“ in Geist 500, `text-caption`, Versalien per CSS, Laufweite 0,3 em,
  in `text`. Gespeichert in natürlicher Schreibung. Schwung über Ordnung.
- **Signet** „gB“ in Inspiration, `violett-500` auf `neutral-100`, quadratisch, aus den Glyphen der Schrift
  (`scripts/marke/signet.ts`): Favicon, App-Icon, Instagram-Profilbild.
- Schutzraum: rundum mindestens die Höhe des „G“ der Wortmarke frei. Mindestgröße der Wortmarke 32 px.
- Hell und dunkel über dieselben Tokens.
- Verboten: Wortmarke in Cormorant oder Geist, Logo in Grün, verzerren, Schatten, Verläufe, Versalien
  der Wortmarke, gezeichnete Unterstreichungen oder Kringel.

## 3. Farben

**Grundfarben** (nie direkt in Komponenten):

| Token | OKLCH | Hex |
|---|---|---|
| `neutral-0` | 0.99 0.003 165 | #fafcfb |
| `neutral-50` | 0.965 0.004 165 | #f1f4f3 |
| `neutral-100` | 0.935 0.006 165 | #e6ebe8 |
| `neutral-150` | 0.905 0.007 165 | #dce1de |
| `neutral-200` | 0.86 0.008 165 | #ccd3d0 |
| `neutral-400` | 0.615 0.012 165 | #7e8783 |
| `neutral-500` | 0.52 0.012 165 | #636b67 |
| `neutral-600` | 0.47 0.012 165 | #555d59 |
| `neutral-800` | 0.30 0.011 165 | #29302c |
| `neutral-900` | 0.20 0.009 165 | #121715 |
| `neutral-950` | 0.165 0.008 165 | #0b0f0d |
| `neutral-1000` | 0.13 0.007 165 | #050807 |
| `blatt-100` | 0.90 0.035 170 | #c8e6da |
| `blatt-400` | 0.74 0.12 170 | #4bc39f |
| `blatt-500` | 0.60 0.115 170 | #139676 |
| `blatt-600` | 0.50 0.096 170 | #0c745b |
| `blatt-700` | 0.42 0.081 170 | #065b46 |
| `blatt-900` | 0.30 0.05 170 | #0d362a |
| `violett-400` | 0.72 0.15 305 | #bb8aef |
| `violett-500` | 0.52 0.20 305 | #853dc2 |
| `danger-400` / `-500` | 0.70 0.15 25 / 0.52 0.18 25 | #ed756e / #ba2b2e |
| `warning-400` / `-500` | 0.80 0.13 80 / 0.62 0.13 75 | #e9b452 / #b37903 |
| `success-400` / `-500` | 0.74 0.14 140 / 0.50 0.12 140 | #79c069 / #3a732c |

**Rollen:**

| Rolle | Hell | Dunkel |
|---|---|---|
| `surface` (Papier) | neutral-100 | neutral-950 |
| `surface-raised` | neutral-50 | neutral-900 |
| `surface-sunken` | neutral-150 | neutral-1000 |
| `border` (dekorativ) | neutral-200 | neutral-800 |
| `border-strong` (Kontrollgrenze) | neutral-400 | neutral-500 |
| `text` | neutral-900 | neutral-50 |
| `text-muted` | neutral-600 | neutral-400 |
| `accent` (einziger Bedienakzent) | blatt-600 | blatt-400 |
| `accent-hover` | blatt-700 | blatt-500 |
| `accent-fg` | neutral-0 | neutral-1000 |
| `accent-subtle` | blatt-100 | blatt-900 |
| `kopierstift` (Handschrift und Logo) | violett-500 | violett-400 |
| `kopierstift-fg` | neutral-0 | neutral-1000 |
| `focus-ring` | blatt-600 | blatt-400 |
| `danger` / `success` / `warning` | jeweils -500 | jeweils -400 |
| `danger-fg` / `success-fg` | neutral-0 | neutral-1000 |
| `warning-fg` | neutral-1000 | neutral-1000 |

**Gemessene Kontraste** (Mindestwert in Klammern):

| Paar | Hell | Dunkel |
|---|---|---|
| text / surface | 14.95 (4.5) | 17.41 |
| text / surface-raised | 16.34 | 16.34 |
| text-muted / surface | 5.62 | 5.21 |
| text-muted / surface-raised | 6.14 | 4.89 |
| text-muted / surface-sunken | 5.12 | 5.44 |
| accent als Linktext / surface | 4.72 | 8.80 |
| accent als Linktext / surface-raised | 5.16 | 8.26 |
| accent-fg / accent | 5.54 | 9.20 |
| accent-fg / accent-hover | 7.88 | 5.40 |
| focus-ring / surface (3.0) | 4.72 | 8.80 |
| border-strong / surface (3.0) | 3.06 | 3.52 |
| border-strong / surface-raised (3.0) | 3.34 | 3.30 |
| kopierstift als Text / surface | 5.06 | 7.33 |
| kopierstift als Text / surface-raised | 5.53 | 6.88 |
| kopierstift als Text / surface-sunken | 4.61 | 7.66 |
| kopierstift-fg / kopierstift | 5.94 | 7.66 |
| danger / surface | 5.01 | 6.74 |
| danger-fg / danger | 5.88 | 7.04 |
| success / surface | 4.73 | 8.76 |
| success-fg / success | 5.56 | 9.15 |
| warning-Rahmen / surface (3.0) | 3.08 | 10.18 |
| warning-fg / warning | 5.40 | 10.63 |
| text / accent-subtle | 13.59 | 12.07 |

Regeln: Blattgrün ist der einzige Bedienakzent, ohne Ausnahme, genau eine gefüllte Primäraktion pro
Ansicht. Kopierstift-Violett ist die Farbe der Handschrift und des Logos und erscheint nie auf Buttons,
Links oder Fokus. Für Kopierstift gilt 4.5 wie für normalen Text, weil die Schreibschrift dünne
Haarstriche hat. Datengrafiken stehen in Tinte (`text`), nicht in Grün. Kein reines Schwarz oder Weiß.

## 4. Typografie

| Rolle | Schrift | Schnitte | Einsatz |
|---|---|---|---|
| Buch-Display | **Cormorant Garamond** | 300, 300 italic, 500 | 300: Kapitel, Manifest, große Zitate; 500: Schlusszeile, Handelsnamen im Eintrag; nur ab 40 px in 300 |
| Text und Bedienung | **Geist** | variabel | Fließtext, Buttons, Formulare, Navigation, Unterzeile der Wortmarke |
| Messwerte | **Geist Mono** | variabel | Noten, Chargen, Zahlen (`tabular-nums`), auch die Zahl neben einer Randnotiz |
| Handschrift | **Inspiration** | 400 (einziger Schnitt) | Wortmarke, Randnotizen, „Wähl mit.“, Vermerke am Stimmzettel, Community-Überschriften auf `/umfragen` |

| Token | Wert | Zeilenhöhe | Schrift |
|---|---|---|---|
| `text-titel` | `clamp(3.5rem, 2rem + 6vw, 8rem)` | 1.05 | Cormorant 300 |
| `text-kapitel` | `clamp(2.5rem, 1.5rem + 3.5vw, 5rem)` | 1.1 | Cormorant 300 |
| `text-umschlag` | `clamp(5rem, 1rem + 17vw, 20rem)` | 0.95 | Inspiration |
| `text-notiz` | `clamp(2rem, 1.25rem + 3vw, 4.5rem)` | 1.2 | Inspiration |
| `text-marke` | `2.5rem` | 1 | Inspiration |
| `text-vermerk` | `2rem` | 1.2 | Inspiration |

Handschrift nie unter 32 px, keine Versalien, keine Laufweite, keine synthetischen Schnitte, Texte in
natürlicher Schreibung. Nie für Handelsnamen, Daten, Zahlen, Formulare, Fließtext, Rechtshinweise.
Betonung im Druck über die Kursive derselben Familie. Verboten: Cormorant 300 unter 40 px; mehr als drei
Schriftgrade je Sektion.

## 5. Formen und Raster

Pillen für Buttons, Chips, Badges, Filter-Einstiege. Alles andere eckig wie Buchseiten (Flächen,
Karten, Tafeln, Eingabefelder, Tabellen). Ein einziger Bogen: der Rahmen um das Netzdiagramm im
neuesten Eintrag. 8-px-Raster wie bisher. Schatten nur als Ebenen-Signal, Farbton 165; freigestellte
Motive tragen ihren Kontaktschatten aus der Pipeline. Feldbuch-Raster hinter der Startseite: Spalten in
`border`, 10 ab 1080 px, 4 darunter.

## 6. Bildsprache

Motive liegen **freigestellt und in Farbe** auf der Seite, alle mit demselben Grading, damit Aufnahmen
aus verschiedenen Quellen wie eine Serie wirken, und mit weichem Kontaktschatten. Was sich nicht
freistellen lässt, steht als eckige **Tafel** in Farbe. Kein Negativeffekt: dunkel werden Motive nur
leicht abgedunkelt. Motive: Blatt, Blüte, Trichom-Makro, Notizbuch, Bleistift, Lupe, Apothekengefäß,
Pflanze. Videos: höchstens zwei, stumm, mit Standbild, erst in der Nähe geladen, als Tafel. Quelle
Pexels, lokal freigestellt, selbst gehostet, jede Datei in `lib/medien.ts` mit Urheber und Lizenz,
Nachweis im Fuß. Ausgeschlossen: Konsum (Joints, Bongs, Rauch, Konsumierende), Figuren, Blüten mit
erkennbarem Handelsnamen, Schriftzüge und Etiketten im Bild.

Umsetzung mit TP3 Welle 2. Bis dahin stehen die Motive noch in Graustufen (hell `multiply`, dunkel
`invert` plus `screen`).

## 7. Bewegung

- Jede Animation lässt sich in einem Satz begründen (Hierarchie, Erzählung, Rückmeldung,
  Zustandswechsel). Sonst entfällt sie.
- Das Buch bewegt sich ruhig: Zeilen und Wörter blenden gestaffelt ein, Bilder zoomen gekoppelt an den
  Scrollweg. Handschrift „wird geschrieben“: `clip-path` von links nach rechts, 0,6 bis 0,9 s je Zeile,
  einmal. Die Wortmarke im Auftakt schreibt sich per CSS, damit sie ohne JavaScript steht.
- Tiefenebenen: Motive vor und hinter der Schrift verschieben sich scroll-gekoppelt per CSS
  (`animation-timeline`), nur `transform`, auf allen Seiten.
- „Kopierstift läuft“: ein Motiv entwickelt sich aus einem violetten Tintenfleck (WebGL), genau zweimal
  auf der Startseite (Blatt im Auftakt, Lupe am neuesten Eintrag), einmal pro Aufruf.
- Seitenwechsel per `<ViewTransition>`: die Wortmarke steht still, gemeinsame Motive wandern mit, der
  Rest blendet kurz über.
- Nur `transform`, `opacity`, `clip-path`. Keine Endlosschleifen außer den Video-Loops.
- `prefers-reduced-motion: reduce`: GSAP, Lenis und der WebGL-Effekt werden **nicht geladen**, alle
  Endzustände stehen sofort da, Seitenwechsel ohne Animation.
- Hover, Fokus und Tippen per CSS, 0,18 bis 0,35 s, nur Farbe, Deckkraft, Unterstrichfarbe.
- Sektionswechsel als Vorhang: der neue Abschnitt wird per `clip-path: inset()` von oben aufgedeckt.

Präzisierungen: Die Einfärbung des Manifests läuft über Deckkraft, nicht über Farbe. Die Schleife in
Sektion 4 zeichnet sich über den Strichversatz; das ist die einzige Ausnahme von „nur transform,
opacity, clip-path“.

## 8. Tonalität und Sprache

Du + Ich. Gedruckte Texte sachlich und warm, ganze Sätze. Handschrift kurz: Imperativ oder ein Wort
(„Wähl mit.“, „Schlag vor.“, „von euch“). Kein Geviertstrich, kein Gedankenstrich als Trenner. Keine
Füllverben („revolutionieren“, „nahtlos“), keine erfundenen Zahlen. Verbotene Wörter: high, stoned,
dank, 420, Heilung, heilt, wirkt gegen.

## 9. Leitplanken HWG und Jugendschutz

1. **Anmutung nur in Form und Schrift, nie in Aussagen.** Kein „high“, „stoned“, „dank“, kein 420,
   keine Aussagen über Wirkung oder Heilung.
2. **Kein Konsum im Bild:** keine Joints, Bongs, Rauchschwaden, Konsumierenden.
3. **Keine Maskottchen, Comicfiguren, Zauberer** (Jugendschutz).
4. **Handelsnamen nie in Handschrift.** Namen stehen immer gedruckt.
5. **Keine Blüten, die einem Handelsnamen zuzuordnen sind**; Pflanze, Blatt, Anbau, Labor,
   Makro von Trichomen sind erlaubt.
6. **Preise und Bestände** bleiben hinter der Freigabe (bestehende Logik, unverändert).
7. **Rechtshinweise** stehen sachlich gedruckt, nie in Handschrift.

## 10. Do's und Don'ts

| Regel | Do | Don't |
|---|---|---|
| Wer spricht | Handelsname in Cormorant auf dem Stimmzettel | Handelsname in Handschrift |
| Logo | Wortmarke in Kopierstift, Unterzeile gedruckt | Logo in Grün oder in Versalien |
| Bedienakzent | „Wähl mit“ als grüne Pille | violetter Button |
| Datengrafik | Netzdiagramm in Tinte mit 12 % Fläche | Netz in Blattgrün |
| Handschrift | „Stimm ab.“ | „Hier kannst du jetzt ganz einfach abstimmen!“ |
| Druck | „Ich schreibe auf, was drin ist.“ | „Wir revolutionieren Cannabis-Reviews.“ |
| Motiv | freigestelltes Blatt in Farbe auf dem Papier | Joint vor dunklem Grund, Foto negativ per `invert` |
| Wirkung | Wirkung nur im vollständigen Eintrag | große Wirkungsnote auf der Startseite |
| Zahlen | echte Zähler oder die Leitsätze | „Über 10.000 zufriedene Nutzer“ |
| Trenner | „Grünes Buch. Charge für Charge.“ | „Grünes Buch — Charge für Charge“ |
| Formen | eckige Karte, Pillen-Button | abgerundete Karte, eckiger Button |
````

- [ ] **Step 2: `.claude/skills/ui-design-engine.md` vollständig ersetzen**

````markdown
---
name: ui-design-engine
description: Design-System-Regelwerk "Grünes Buch" (Buch und Handschrift, 8px-Raster) für diesen Medizinalcannabis-Katalog. Greift immer beim Bauen oder Ändern von UI-Komponenten, Seiten, Layouts oder Styles in diesem Projekt (alles unter app/** und components/**, sowie app/globals.css): Spacing, Typografie, Farbe, Formen, Medien, Motion, Zustände, Badges, Barrierefreiheit. Marke in docs/brand/gruenes-buch.md, hier die verbindlichen Code-Regeln und die Abschluss-Checkliste.
---

# UI Design Engine: Grünes Buch

Die Marke steht in `docs/brand/gruenes-buch.md`. Diese Datei übersetzt sie in Regeln für Code.
Tokens liegen in `app/globals.css` (Tailwind v4, `@theme`) und werden von `npm run farben` gegen
die Spec geprüft. Allgemeine Frontend-Qualität kommt aus `frontend-design`; bei Konflikten zu
Spacing, Farbe, Formen, Motion oder Tokens gilt diese Datei. Für Design-Arbeit werden zusätzlich
die Design-Skills geladen (Zuordnung in der Memory `design-skills-einsatz`).

## 1. Zwei Stimmen
- **Gedruckt** (Betreiber): Cormorant Garamond, Geist, Geist Mono, Papier und Tinte. Messwerte, Reviews,
  Katalogdaten, Handelsnamen, Rechtshinweise und Bedienung sind immer gedruckt.
- **Von Hand** (Community und Logo): Inspiration (`font-hand`) in `kopierstift`. Nur, wo die Community
  spricht (Stimmen, Vorschläge, Zähler, „Wähl mit.“, Vermerke am Stimmzettel, Überschriften auf
  `/umfragen`), und in der Wortmarke. Kurze Zeilen, höchstens etwa sechs Wörter, nie Absätze.
- Form der Handschrift ist die Randnotiz: ab `lg` in einer Randspalte neben dem gedruckten Text,
  darunter direkt zwischen den Absätzen.
- Handschriftliche Zeichen nur aus Glyphen der Schrift; keine gezeichneten Unterstreichungen, Kringel
  oder SVG-Illustrationen.

## 2. 8px-Raster
- Abstände (padding, margin, gap) nur aus der Leiter 8, 16, 24, 32, 40, 48, 64, 80, 96, 128 px
  (`--spacing: 4px`, also nur gerade Tailwind-Stufen). 4 px nur als optische Korrektur in einem
  zusammengehörigen Paar, mit Begründung im Code.
- Keine arbitrary values für Abstände (`p-[13px]`, `gap-[10px]`), kein inline `style` mit Pixeln.
- **Erlaubt:** art-direktierte Größen und Positionen in `components/story/` und `components/marke/`
  in `vw`, `vh`, `%` oder Brüchen (`w-[42vw]`, `left-[44vw]`), weil sie Komposition sind, kein Abstand
  zwischen Inhalten. `max-w-[68ch]` und ähnliche Lesemaße bleiben erlaubt.

## 3. Typografie
| Rolle | Klasse | Einsatz |
|---|---|---|
| Buch-Display | `font-buch` | Kapitel, Manifest, Zitate, Handelsname im Eintrag und auf dem Stimmzettel |
| Text und Bedienung | `font-sans` (Standard) | Fließtext, Buttons, Formulare, Navigation, Unterzeile der Wortmarke |
| Messwerte | `numeric` (Geist Mono, `tabular-nums`) | Noten, Chargen, Zahlen, die Zahl neben einer Randnotiz |
| Handschrift | `font-hand` | Wortmarke, Randnotizen, „Wähl mit.“, Vermerke; nie Fließtext, Daten, Zahlen, Formulare, Namen, Rechtshinweise |

Größen: `text-caption` 13, `text-small` 14, `text-body` 16, `text-h3` 20, `text-h2` 25, `text-h1` 31,
`text-display` 39 px; gedruckte Display-Grade `text-kapitel` (clamp 2.5 bis 5rem, 300), `text-titel`
(clamp 3.5 bis 8rem, 300). Handschrift-Grade: `text-marke` (2.5rem, Kopf), `text-umschlag`
(clamp 5 bis 20rem, Wortmarke im Auftakt und im Fuß), `text-notiz` (clamp 2 bis 4.5rem, Randnotizen,
„Wähl mit.“, Überschriften auf `/umfragen`), `text-vermerk` (2rem, Vermerke am Stimmzettel und in der
Schleife).
- Geist: 400, 500, 600. Cormorant 300 **nur ab 40 px** (`text-kapitel`, `text-titel`), sonst 500.
- Inspiration nur 400 (`.font-hand` setzt `font-synthesis: none`) und **nie unter 32 px**: `font-hand`
  steht immer zusammen mit einem der vier Handschrift-Grade in derselben Zeile (Test `tests/marke.test.ts`).
- Handschrift ohne Versalien, ohne Laufweite, ohne Drehung, in natürlicher Schreibung.
- Betonung im Druck über die Kursive derselben Familie.
- `text-balance` auf Überschriften, `text-pretty` auf Beschreibungen, `wrap-break-word` wo lange
  Handelsnamen stehen. Höchstens drei Schriftgrade je Sektion.
- Laufweite: `tracking-gesperrt` (0.3em) nur in der Unterzeile der Wortmarke; kleine Versalien-Zeilen `tracking-wide`.

## 4. Farbe
Komponenten nutzen nur semantische Tokens:
`surface`, `surface-raised`, `surface-sunken`, `border`, `border-strong`, `text`, `text-muted`,
`accent`, `accent-hover`, `accent-fg`, `accent-subtle`, `kopierstift`, `kopierstift-fg`, `focus-ring`,
`danger`/`success`/`warning` (+ `-fg`).
- `accent` (Blattgrün) ist der einzige Bedienakzent, **ohne Ausnahme**: Buttons, Links, aktive
  Zustände, Fokus. Genau eine gefüllte Primäraktion pro Ansicht. Hover über `accent-hover`, nicht über
  Deckkraft.
- `kopierstift` nur für Handschrift und Wortmarke; nie auf Buttons, Links oder Fokus. Gemessen auf
  `surface`, `surface-raised` und `surface-sunken` (jeweils ≥ 4.5 in beiden Modi).
- Datengrafiken in `text`/`text-muted` (Linie plus Fläche mit geringer Deckkraft), nicht in `accent`.
- Verboten in Komponenten: Primitives (`blatt-*`, `violett-*`, `neutral-*`), Hex, `oklch()`,
  Tailwind-Standardpaletten, `dark:`-Farbvarianten. Dark Mode entsteht allein über die Tokens.
- Wer ein Token ändert, ändert die Tabelle in `scripts/farben-pruefen.mjs` mit und lässt `npm run farben` laufen.

## 5. Formen
- `--radius-sm/md/lg` sind 0: `rounded-sm/md/lg` ergeben eckige Flächen (Karten, Tafeln, Felder,
  Tabellen). Pillen ausdrücklich mit `rounded-full`: Buttons, Badges, Chips, Filter-Einstiege.
- Einziger Bogen: der Rahmen um das Netzdiagramm (`rounded-t-full`).
- Schatten nur als Ebenen-Signal (`shadow-md` Stimmzettel und Doppelseite, `shadow-lg` Dialoge).
  Freigestellte Motive tragen ihren Kontaktschatten aus der Pipeline, kein CSS-`drop-shadow`.
- Fokus: die globale Regel in `globals.css` (2 px `focus-ring`, 2 px Abstand); der Umriss folgt dem
  Radius des Elements. Nie `outline: none`.

## 6. Medien
- Bilder und Videos **nur** über `components/medien/Bild` und `Loop`; ein `<img>` gibt es nur in
  `Bild.tsx`. Keine Next-Bildoptimierung, kein Hotlinking.
- Jede Datei in `public/medien/` steht in `lib/medien.ts` (Test `tests/medien.test.ts`).
- Motive nach Brand Guideline 6 und Leitplanken. Ziel ab TP3 Welle 2: freigestellte Motive in Farbe
  (`objekt`) und Tafeln (`tafel`), keine Mischmodi, kein `invert`. Bis dahin Fotos in Graustufen mit
  `medien-buch`, Videos mit `medien-video`.
- Die Marke ist Text: Wortmarke und Handschrift werden nie als Bild eingebunden. Das Signet entsteht
  mit `scripts/marke/signet.ts` aus der Schriftdatei.

## 7. Bewegung
- **CSS** für Hover, Fokus, Tippen: 180 bis 350 ms (`--duration-fast/normal/slow`), nur Farbe,
  Deckkraft, Unterstrichfarbe, Easing aus Tokens.
- **Story-Bewegung** nur auf der Startseite, nur in `components/story/bewegung/`, gestartet von
  `StoryBuehne`. Keine andere Datei importiert `gsap` oder `lenis`. Ziele über `data-story`.
- Nur `transform`, `opacity`, `clip-path`. Ausnahme: `strokeDashoffset` der Schleife (Sektion 4).
  Keine Endlosschleifen außer Video-Loops.
- Handschrift „wird geschrieben“: `clip-path: inset()` von links, 0,6 bis 0,9 s je Zeile, einmal.
  Ränder und Dauer aus `components/story/bewegung/schreiben.ts` (GSAP) und `@keyframes schreiben`
  (CSS, gleiche Ränder, Test in `tests/bewegung.test.ts`). Die Wortmarke im Auftakt schreibt sich per
  CSS mit `backwards`, damit sie ohne JavaScript steht und am Ende nichts abgeschnitten bleibt.
- Neu erlaubt: CSS scroll-gekoppelte Tiefenebenen (`animation-timeline: view()`, nur `transform`, nur
  unter `@supports` und `prefers-reduced-motion: no-preference`), der WebGL-Effekt „Kopierstift läuft“
  nur in `components/story/bewegung/tinte.ts`, Seitenwechsel per `<ViewTransition>`.
- Reduzierte Bewegung: GSAP, Lenis und `tinte.ts` werden nicht geladen, Endzustände stehen sofort da.
- Der statische erste Frame ist ohne JavaScript vollständig. Ausgeblendet wird vor dem Start nur
  `[data-story-einstieg]`, und nur unter `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`
  mit CSS-Notfall nach 2,5 s. Navigation, Primäraktion und die Wortmarke sind nie ausgeblendet.
- Geteilter Text (SplitText) mit `aria: "auto"`; Links und Hervorhebungen werden nicht geteilt.
- Hochzählende Zahlen tragen je Zweck ein eigenes Attribut (`data-zaehler` Noten, `data-randzahl`
  Randspalte), damit sich Abläufe nicht gegenseitig greifen.

## 8. Barrierefreiheit
- Kontrast Text ≥ 4.5:1, Grafik und Rahmen ≥ 3:1; `text-muted` nur auf den gemessenen Flächen.
- Sichtbarer Fokus überall, Touch-Ziele ≥ 44 px, jedes Feld mit `<label>`, Fehler nicht nur über Farbe.
- Kein Zustand nur über Farbe. Interaktiv sind nur `button`, `a`, `input`.
- Dekoration (Raster, Fuß-Wortmarke, das handgeschriebene „x“, Diagramm-Doppel) ist `aria-hidden`.
  Der Vermerk „von euch“ bleibt lesbar: er trägt die Herkunft des Platzes.
- Hochzählende Ziffern und Diagramme haben den Endwert als `sr-only`-Text.

## 9. Sprache und Leitplanken
- Du + Ich. Neue Texte ohne Geviertstrich (U+2014) und ohne Gedankenstrich (U+2013) als Trenner. Keine Füllverben, keine erfundenen Zahlen.
- Leitplanken 1 bis 7 aus `docs/brand/gruenes-buch.md` Abschnitt 9 gelten für jeden Text und jedes Motiv.
  Leitplanke 4: Handelsnamen nie in Handschrift.
- Preise und Bestände nur über die bestehende Freigabelogik (`bestandSichtbarkeit()`, `istFachkreis()`).
- Die „Wirkung“-Note steht nicht auf der Startseite.

## 10. Domäne
- Verfügbarkeits-Badges tragen immer Klartext plus Marker mit unterscheidbarer Form.
- Cannabinoid-Bereiche als Zahl mit Einheit (`18,0–22,0 % THC`), Balken nur zusätzlich.
- Zahlen, Preise, Daten über `Intl` in de-DE, Formatter auf Modulebene.
- Handelsnamen unverändert, nie gekürzt; Umbruch statt Ellipse.

## 11. Checkliste vor Abschluss einer UI-Aufgabe
1. Abstände auf der Leiter, jedes 4 px begründet, arbitrary values nur nach Regel 2?
2. Nur semantische Farbtokens, kein `dark:`, `npm run farben` grün?
3. Gedruckt und Handschrift richtig verteilt, Handelsnamen nie in Handschrift, Handschrift nie unter 32 px?
4. Schriftrollen und Gewichte nach Regel 3, höchstens drei Grade je Sektion?
5. Pillen und eckige Flächen nach Regel 5?
6. Hell und dunkel geprüft (`prefers-color-scheme` und `data-theme="dark"`), live per Browser-MCP?
7. Fokus sichtbar, Touch-Ziele ≥ 44 px, Dekoration `aria-hidden`?
8. Ohne JavaScript vollständig, bei reduzierter Bewegung kein GSAP/Lenis geladen?
9. Medien nur über `components/medien`, alle in `lib/medien.ts`?
10. Texte ohne Geviert- und Gedankenstrich, Leitplanken 1 bis 7 eingehalten?
11. Zahlen und Daten de-DE über `Intl`?
12. Qualitätskriterien von `frontend-design` und die Review-Skills (`interface-review`, `web-design-guidelines`) durchlaufen?
````

- [ ] **Step 3: Wrapper `.claude/skills/ui-design-engine/SKILL.md`** (Edit-Werkzeug)

In der `description` `(Buch und Wand, 8px-Raster)` → `(Buch und Handschrift, 8px-Raster)`; im Text `Sie enthält Buch und Wand, 8px-Raster,` → `Sie enthält Buch und Handschrift, 8px-Raster,`.

- [ ] **Step 4: Prüfen**

Run: `git grep -n -i "sedgwick\|spray\|wand-textur\|font-wand" -- docs/brand .claude/skills/ui-design-engine.md .claude/skills/ui-design-engine`
Expected: keine Treffer.
Run: `npm test` → grün (die Dokumente sind nicht Teil der Tests, aber `texte.test.ts` darf nicht brechen).

- [ ] **Step 5: HANDOFF, Commit, Push**

HANDOFF-Zeile: „Welle 1, Task 10 erledigt: Brand Guideline und `ui-design-engine` auf ‚Buch und Handschrift‘ umgeschrieben.“

```bash
git add docs/brand/gruenes-buch.md .claude/skills/ui-design-engine.md .claude/skills/ui-design-engine/SKILL.md HANDOFF.md
git commit -m "docs: Brand Guideline und Code-Regeln auf Buch und Handschrift (TP3 Welle 1)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

---

### Task 11: Abschlussprüfung live und Übergabe

**Skills:** `superpowers:verification-before-completion`, `web-design-guidelines`, `better-accessibility`, `cloudflare:web-perf`

**Files:**
- Modify: `HANDOFF.md` (und was die Prüfung an Fehlern findet, je mit Test)

- [ ] **Step 1: Lokale Prüfungen ohne Server** (Spec 15.1, 15.2)

```bash
npm test && npm run typecheck && npm run lint && npm run farben
git grep -n -i "font-wand\|sedgwick\|spray\|textur\|wand-textur" -- app components lib
```
Expected: alles grün, `git grep` ohne Treffer.

- [ ] **Step 2: Live-Stand bestätigen**

Im Browser-MCP (sichtbarer Tab) `/` laden; im Roh-HTML stehen `data-story="randspalte"` oder das Skelett, `data-marke-zeile`, und `<link rel="icon" … /icon.png`. Steht der Stand von Task 10 noch nicht, einmal den Build im Dashboard ansehen. Schlug der Build fehl: Log laden (Deployments → Build → „Download log“), Ursache mit `superpowers:systematic-debugging` beheben, Test dazu, Commit, Push.

- [ ] **Step 3: Seitenregeln live** (Spec 15.1, `seiten-pruefen.ts` gegen die Live-Adresse)

```bash
MSYS_NO_PATHCONV=1 PRUEF_BASIS=https://cn-medcan.w-helwich.workers.dev npx tsx scripts/seiten-pruefen.ts / /umfragen /reviews /produkte /apotheken /gibt-es-nicht
```
Expected: keine Verstöße. Antwortet die Live-Seite mit 307 (das Gate-Geheimnis der Live-Umgebung weicht von `.env.local` ab), dieselben Regeln im Browser prüfen:
```js
Promise.all(["/", "/umfragen", "/reviews", "/produkte", "/apotheken"].map((pfad) =>
  fetch(pfad, { credentials: "include" }).then((antwort) => antwort.text()).then((html) => {
    const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((treffer) => treffer[1]);
    return {
      pfad,
      h1: html.match(/<h1[\s>]/g)?.length ?? 0,
      geviert: /—/.test(text),
      trenner: /(?<!\d)\s–\s|\s–\s(?!\d)/.test(text),
      doppelteIds: [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))],
    };
  }),
))
```
Expected: je Seite `h1: 1`, `geviert: false`, `trenner: false`, `doppelteIds: []`.

- [ ] **Step 4: Ansichten live** (Spec 15.3, 15.4)

Auf `/`, `/umfragen`, `/reviews` bei 320, 390, 800, 1024, 1440 px, hell und dunkel (`document.documentElement.dataset.theme = "dark"`): das Skript aus Task 4 Step 9 (Handschrift ≥ 32 px, `ueberlauf` 0, Kopfhöhe ≤ 80 ab 1024 px) und ein Blick per Screenshot oder `zoom`. Keine Handschrift an einem Handelsnamen (`[...document.querySelectorAll('a[href^="/produkte/"]')].some((a) => getComputedStyle(a).fontFamily.includes("Inspiration"))` ist `false`). Fokus per Tab sichtbar.

- [ ] **Step 5: Ohne JavaScript** (Spec 15.5, mit Entscheidung 6)

```js
fetch("/", { credentials: "include" }).then((antwort) => antwort.text()).then((html) => ({
  wortmarke: /<h1[^>]*>[\s\S]*?Grünes[\s\S]*?Buch[\s\S]*?<\/h1>/.test(html),
  h1Versteckt: /<h1[^>]*data-story-einstieg/.test(html),
  unterzeile: html.includes("Charge für Charge"),
  waehlMit: /data-story="waehl-mit"[^>]*>Wähl mit\./.test(html),
  stationen: html.includes("Ihr schlagt vor.") && html.includes("Ihr stimmt ab."),
  fussMarke: html.includes('data-story="fuss-marke"'),
}))
```
Expected: alle `true`, `h1Versteckt` `false`. Randspalte und Stimmzettel kommen gestreamt (Entscheidung 6); im HANDOFF so vermerken.

- [ ] **Step 6: Reduzierte Bewegung** (Spec 15.6)

Das Browser-MCP kann `prefers-reduced-motion` nicht emulieren. Abgedeckt durch Tests (Task 3: CSS nur unter `no-preference`; `StoryBuehne` lädt bei `reduce` nichts, unverändert). Ist im Windows des Nutzers „Animationseffekte“ aus, einmal live ansehen: Wortmarke sofort da, keine Bewegung. Sonst im HANDOFF als „live nicht geprüft, durch Tests abgedeckt“ vermerken.

- [ ] **Step 7: Budgets live** (Spec 14, 15.10)

JS der Story (gleiche Methode wie TP1, nur live), nach einmal Scrollen bis zum Fuß:
```js
(async () => {
  const adressen = [...new Set(performance.getEntriesByType("resource").map((e) => e.name))]
    .filter((adresse) => adresse.includes("/_next/static/chunks/") && adresse.endsWith(".js"));
  let summe = 0;
  const zeilen = [];
  for (const adresse of adressen) {
    const text = await (await fetch(adresse)).text();
    if (!/ScrollTrigger|SplitText|lenis|starteBuehne|einstieg|data-story/.test(text)) continue;
    const gz = await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
    summe += gz.byteLength;
    zeilen.push(`${adresse.split("/").pop()} ${gz.byteLength}`);
  }
  return { zeilen, summe };
})()
```
Expected: `summe` ≤ 66.560 B (65 KB), erwartet unter dem TP1-Wert 58.968 B (`wand.ts` fällt weg).

LCP und CLS nach frischem Laden von `/` (sichtbarer Tab):
```js
new Promise((fertig) => {
  let lcp = 0;
  let cls = 0;
  new PerformanceObserver((liste) => { for (const e of liste.getEntries()) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((liste) => { for (const e of liste.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  setTimeout(() => fertig({ lcp: Math.round(lcp), cls: Number(cls.toFixed(3)) }), 1000);
})
```
Expected: `lcp` < 2500, `cls` < 0.1. Werte ins HANDOFF.

- [ ] **Step 8: Design-Review** (Spec 15.11)

`web-design-guidelines` über die in Welle 1 geänderten Dateien (`git diff --name-only 56f4da6..HEAD -- app components`). Befunde mit Schwere; alles über „niedrig“ beheben (je mit Test, Commit, Push), den Rest ins HANDOFF. Dem Nutzer sagen, dass er `/interface-review` starten kann.

- [ ] **Step 9: HANDOFF sichern, pushen, Bescheid geben**

In `HANDOFF.md`:
- „⇢ NÄCHSTE SESSION“ auf TP3 Welle 2 umstellen: „Plan TP3 Welle 2 (Medien) mit `superpowers:writing-plans` aus Spec TP3 Abschnitte 7, 8, 9, 13 (Welle 2), 14, 15; erster Schritt `pip install "rembg[cpu,cli]"` (einmal, bei Netzfehler stoppen). Ausführung Native, geprüft live.“
- Unter Teilprojekt 3: was verifiziert ist (mit Werten aus Step 3 bis 7), was ausdrücklich nicht (reduzierte Bewegung live, Stimmzettel-Vermerke live ohne laufende Runde), Entscheidungen 1 bis 7 dieses Plans, offene Befunde aus Step 8.
- Die Dauerregel „kein lokales Dev-System, geprüft wird live“ in „Live-Stand und Sessionablauf“.

```bash
git status --short
git add HANDOFF.md
git commit -m "docs: HANDOFF - TP3 Welle 1 live und geprüft, nächste Session Welle 2" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```
Dann dem Nutzer sagen: Welle 1 ist live und geprüft, `git status` sauber und gepusht, keine Hintergrundprozesse, HANDOFF nennt Welle 2 als nächste Aufgabe; er kann clearen.
