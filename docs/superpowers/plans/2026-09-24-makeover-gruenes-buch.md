# Makeover „Grünes Buch“ (Teilprojekt 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Marke „Grünes Buch“ festschreiben (Guideline, Tokens, Schriften, Primitives, Logo) und die Startseite als Scroll-Story in neun Sektionen neu bauen, mit Medien von Pexels und GSAP/Lenis als einziger Bewegungsschicht.

**Architecture:** Alle Seiten erben Farben, Schriften und Formen über die semantischen Tokens in `app/globals.css`. Die Startseite besteht aus einer Server-Komponente je Sektion unter `components/story/`, jede Datensektion mit eigener `Suspense`-Grenze. Bewegung kommt ausschließlich aus einer einzigen Client-Insel `StoryBuehne`, die GSAP und Lenis erst nach dem Hydrieren dynamisch lädt und ihre Ziele über `data-story`-Attribute findet; ohne JavaScript und bei reduzierter Bewegung steht jede Sektion vollständig da. Medien werden zur Entwicklungszeit per Skript von Pexels geholt, mit `sharp` aufbereitet, in `public/medien/` abgelegt und in `lib/medien.ts` verzeichnet.

**Tech Stack:** Next.js 16.3.6 (App Router) auf Cloudflare Workers via OpenNext, React 19, Tailwind CSS 4.3.3 (CSS-first, `@theme`), Prisma 7 + D1, `next/font/google`, GSAP 3.13+ (ScrollTrigger, SplitText), Lenis, `sharp` 0.35 (bereits über Next installiert), Tests mit `node:test` über `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-09-23-makeover-gruenes-buch-design.md` (freigegeben am 2026-09-24). Abschnitt 13 der Spec hält die Präzisierungen aus dieser Planung fest; bei Widerspruch gilt Abschnitt 13.

## Global Constraints

- Arbeit auf dem Branch `makeover/gruenes-buch`. **Push nach `main` ist der Live-Gang** (Workers Builds): erst nach dem Go des Nutzers, vorher fragen, ob Citrix getrennt ist.
- Neue Abhängigkeiten: **nur `gsap` und `lenis`** (Spec 6.1). `sharp` wird direkt genutzt (0.35.4 liegt über Next vor). `tsx` ist schon da.
- **Netzwerk schonen:** `npm install gsap lenis` genau einmal. Jede Pexels-Anfrage genau einmal, keine Wiederholungsschleifen, kein Polling. Bei einem Netzfehler sofort anhalten und dem Nutzer melden.
- Kein `export const runtime = "edge"`. Prisma nur über `await getPrisma()`, keine Query in einer Schleife, jede Listenabfrage mit `take` (`edge-stack-master`).
- Farben in Komponenten **nur über semantische Tokens** (`text-text`, `bg-surface-raised`, `text-spray` …), nie `blatt-*`, `spray-*`, `neutral-*`, Hex oder `oklch()` in Komponenten. Keine `dark:`-Farbvarianten.
- **Blattgrün (`accent`) ist der einzige Bedienakzent**, genau eine gefüllte Primäraktion pro Ansicht. **Sprühviolett (`spray`) nie auf Buttons, Links oder Fokus.**
- Schriften: Cormorant Garamond (Buch-Display, 300 nur ab 40 px, sonst 500), Geist (Text und Bedienung), Geist Mono (Messwerte, `numeric`), Sedgwick Ave Display (nur Wand). **Handelsnamen nie in Sedgwick.**
- **Neue Seitentexte ohne Geviertstrich (—) und ohne Gedankenstrich (–) als Trenner.** Bereichsangaben wie „18,0–22,0 %“ in bestehenden Komponenten sind erlaubt. Du + Ich. Keine Füllverben, keine erfundenen Zahlen, keine Aussagen über Wirkung oder Heilung.
- Leitplanken (Spec 3.1) verbatim: 1. Kiffer-Anmutung nur in Form, Schrift und Textur, nie in Aussagen. 2. Kein Konsum im Bild. 3. Keine Maskottchen, Comicfiguren, Zauberer. 4. Handelsnamen nie als Graffiti. 5. Keine Blüten, die einem Handelsnamen zuzuordnen sind. 6. Preise und Bestände bleiben hinter der Freigabe. 7. Rechtshinweise sachlich in Buch-Typografie.
- Die **„Wirkung“-Note erscheint auf der Startseite nicht.**
- Bewegung nur über `transform`, `opacity`, `clip-path`, Masken-Position (einzige Ausnahme: der Strichversatz der Schleife in Sektion 4, Spec 13). Keine Endlosschleifen außer Video-Loops. Bei `prefers-reduced-motion: reduce` werden GSAP und Lenis **nicht geladen**.
- Budgets (Spec 6.4): zusätzliches JS der Startseite **≤ 60 KB gz** nach dem Hydrieren; LCP **< 2,5 s**; CLS **< 0,1**; Medien der ersten Ansicht **≤ 400 KB**; eine zusätzliche Abfrage pro Request (`communityZahlen()`).
- 8-px-Raster: Abstände nur aus der Leiter 8, 16, 24, 32, 40, 48, 64, 80, 96, 128 px (Tailwind `p-2` = 8 px bei `--spacing: 4px`, also nur gerade Stufen). 4 px nur als begründete optische Korrektur in einem Paar.
- **Lokal läuft `npm run cf-build` nicht** (Windows, Symlinks, `EPERM`). Nachweis lokal über `npm run build` und `npm run dev` im Browser; workerd läuft erst live nach dem Push (Workers Builds).
- **Skills laden, ohne dass der Nutzer daran erinnert.** Jeder Task nennt unter **Skills** die Skills, die vor dem ersten Schritt geladen werden. Dem Nutzer in einem Satz sagen, welche geladen sind.
- Commit-Nachrichten auf Deutsch, Präfix wie im Repo (`feat:`, `docs:`, `test:`, `fix:`), jede endet mit einer Leerzeile und `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Das Browser-Werkzeug (Chrome-Erweiterung) für Sichtprüfungen: `list_connected_browsers` → Nutzer wählen lassen → `select_browser` → `tabs_context_mcp`. Screenshots laufen oft in einen Timeout: dann `zoom`, `get_page_text`, `javascript_tool`. Bei „Permission denied“ sofort sagen, dass ein Freigabe-Fenster wartet.

## Review Focus

1. **Leere Datenbank** (die Cloud-D1 ist live leer): Jede Sektion zeigt ihren Leerzustand ohne Fehler, die Wand zeigt statt „0 Stimmen“ die drei Leitsätze. Getestet in Task 8 (`wandTags`), live geprüft in Task 16.
2. **Kaputte oder leere Geschmacksmatrix** (`parseGeschmacksMatrix` fällt auf Nullen zurück): Die Doppelseite zeigt einen Satz statt eines auf einen Punkt geschrumpften Netzes. Getestet in Task 8 (`istLeereMatrix`).
3. **Stimmzustände nach dem Umzug der Logik** (ANONYM, FREIGABE_OFFEN, STIMMBERECHTIGT, ABGESTIMMT): Die Startseite zeigt denselben Zustand wie bisher. Getestet in Task 8 (`stimmZustand`).
4. **JavaScript fehlt oder der Bewegungs-Chunk lädt nicht:** Der Auftakt bleibt nicht unsichtbar. Ohne Skript greift die Ausblendung gar nicht (`@media (scripting: enabled)`), mit Skript blendet ein CSS-Notfall nach 2,5 s ein. Getestet in Task 13 (Quelltext-Test auf `globals.css`), im Browser geprüft in Task 16.
5. **Sehr lange Handelsnamen bei 390 px** (Doppelseite, Stimmzettel, Katalogkarte): kein horizontales Überlaufen der Seite. Geprüft in Task 12 und Task 16 im Browser mit eingesetztem langem Namen.

---

## Dateistruktur

**Neu:**

| Datei | Verantwortung |
|---|---|
| `docs/brand/gruenes-buch.md` | Brand Guideline (Spec 7) |
| `scripts/farben/oklch.mjs` | OKLCH → sRGB, Gamut, Luminanz, Kontrast (reine Funktionen) |
| `scripts/farben-pruefen.mjs` | prüft `globals.css` gegen die Spec-Tabellen 4.1, bricht bei Verstoß ab |
| `lib/medien.ts` | Verzeichnis aller Medien, Dateinamen, `srcSet` |
| `scripts/medien/pexels.ts` | Pexels-Zugriff (Key aus `.env.local`, eine Anfrage, kein Retry) |
| `scripts/medien/verarbeitung.ts` | `sharp`: Graustufen-WebP, Alpha-Maske, Wahl der SD-Videodatei |
| `scripts/medien/suchen.ts` | Kandidaten suchen (Spec 6.3, Schritt 1) |
| `scripts/medien/aufbereiten.ts` | gewählte Medien laden und nach `public/medien/` schreiben |
| `public/medien/*` | aufbereitete Bilder, Masken, Video |
| `components/medien/Bild.tsx`, `Textur.tsx`, `Loop.tsx` | einzige Stellen, die Medien rendern |
| `components/marke/SprayFilter.tsx`, `Wortmarke.tsx` | SVG-Filter und Marke |
| `components/layout/Kopf.tsx`, `Fuss.tsx` | Header und Footer aus dem Layout |
| `lib/query/community.ts` | reine Zuordnung der Community-Zahlen und Wand-Tags |
| `lib/netz.ts` | Geometrie des Netzdiagramms |
| `components/umfrage/stimmzustand.ts` | reine Bestimmung des Stimmzustands |
| `components/story/*.tsx` | eine Server-Komponente je Sektion, Skelette, Netzdiagramm, `StoryBuehne` |
| `components/story/bewegung/*.ts` | Choreografien je Sektion, Start und Aufräumen |
| `tests/*.test.ts` | `node:test`-Tests |

**Geändert:** `package.json`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `components/ui/Button.tsx`, `components/ui/Badge.tsx`, `components/umfrage/UmfrageKarte.tsx`, `lib/query/umfragen.ts`, `lib/query/reviews.ts`, `.claude/skills/ui-design-engine.md`, `.claude/skills/ui-design-engine/SKILL.md`, `HANDOFF.md`.

**Bewusst unverändert:** `components/review/ReviewKarte.tsx` (bleibt die Karte für `/reviews`; die Doppelseite ist eine eigene Komponente, Spec 13), Datenmodell, Server Actions, Zugriffskontrolle, Preislogik.

---

### Task 1: Branch, Brand Guideline, Regelwerk `ui-design-engine`

**Skills:** `design-taste-frontend`, `better-colors`, `better-typography`, `build-awwwards-quality-sites`

**Files:**
- Create: `docs/brand/gruenes-buch.md`
- Modify: `.claude/skills/ui-design-engine.md` (vollständig neu), `.claude/skills/ui-design-engine/SKILL.md` (nur `description`)

**Interfaces:**
- Consumes: Spec Abschnitte 3, 4, 5, 7, 13
- Produces: die Regeln, auf die sich alle folgenden Tasks berufen (Token-Namen, Rollen, Checkliste)

- [ ] **Step 1: Branch anlegen**

```bash
git switch -c makeover/gruenes-buch
```

Expected: `Switched to a new branch 'makeover/gruenes-buch'`

- [ ] **Step 2: Brand Guideline schreiben**

`docs/brand/gruenes-buch.md` mit genau diesen zehn Abschnitten (Spec 7). Tabellen und Werte werden **wörtlich aus der Spec übernommen**, nicht neu formuliert:

```markdown
# Grünes Buch: Brand Guideline

Stand 2026-09-24. Quelle der Entscheidungen: docs/superpowers/specs/2026-09-23-makeover-gruenes-buch-design.md.
Code-Regeln dazu: .claude/skills/ui-design-engine.md. Tokens: app/globals.css (geprüft mit `npm run farben`).

## 1. Idee: Buch und Wand
Das Buch ist meine Stimme: systematisch, belegbar, an Chargen gebunden. Die Wand ist die Stimme
der Community: Graffiti-Handstyle, Schnörkel, Sprühnebel, Drips in Sprühviolett. Verhältnis 60 zu 40,
das Buch führt. Der Bruch zeigt, wer spricht: Messwerte, Reviews, Katalogdaten, Handelsnamen und
Rechtshinweise sind immer Buch. Die Wand erscheint, wo die Community mitredet (Abstimmung,
Vorschlag, Stimmen, „Wähl mit“), und als bewusster Bruch in Story-Übergängen.

## 2. Name und Logo
- Wortmarke „Grünes Buch“ in Cormorant Garamond. Ab 40 px in 300, darunter in 500 (Kopfzeile: 28 px, 500).
- Tag „gb“ in Sedgwick Ave Display in Sprühviolett, leicht gedreht, aufgeraut (SVG-Filter `spray-rau`),
  mit Stanzkontur wie ein Aufkleber (SVG-Filter `stanzkontur`). Keine von Hand gezeichneten Pfade.
- Aufkleber (Bühne): Tag, darunter „GRÜNES BUCH“ in Geist, Versalien, Laufweite 0,3 em.
- Schutzraum: rundum mindestens die Höhe des „G“ der Wortmarke frei.
- Mindestgröße: Wortmarke 24 px, Tag 20 px.
- Hell und dunkel: Wortmarke in `text`, Tag in `spray`; beide Modi über dieselben Tokens.
- Verboten: Wortmarke in Sedgwick, Tag in Blattgrün, Tag ohne Kontur auf Fotos, verzerren, Schatten, Verläufe
  (einzige Ausnahme: der Holo-Schimmer auf dem Aufkleber beim Hover).

## 3. Farben
[Tabelle „Grundfarben“ aus Spec 4.1 wörtlich]
[Tabelle „Semantische Tokens“ aus Spec 4.1 wörtlich]
[Tabelle „Gemessene Kontraste“ aus Spec 4.1 wörtlich]
Regeln: Blattgrün ist der einzige Bedienakzent, genau eine gefüllte Primäraktion pro Ansicht.
Sprühviolett ist Material der Wand und erscheint nie auf Buttons, Links oder Fokus. Datengrafiken
stehen in Tinte (`text`), nicht in Grün. Kein reines Schwarz oder Weiß.

## 4. Typografie
[Rollentabelle aus Spec 4.2 wörtlich]
[Größentabelle aus Spec 4.2 wörtlich, ergänzt um `text-auftakt` clamp(4.5rem, 20vw, 21rem), 0.86, Cormorant 500
 und `text-wortmarke` 1.75rem, 1, Cormorant 500]
Betonung über die Kursive derselben Familie. Tags in natürlicher Schreibung, nie per text-transform.
Verboten: Sedgwick für Fließtext, Daten, Formulare, Namen; Cormorant 300 unter 40 px; mehr als drei Schriftgrade je Sektion.

## 5. Formen und Raster
Pillen für Buttons, Chips, Badges, Filter-Einstiege. Alles andere eckig wie Buchseiten
(Flächen, Karten, Bilder, Eingabefelder, Tabellen). Ein einziger Bogen: der Rahmen um das
Netzdiagramm im neuesten Eintrag. 8-px-Raster wie bisher. Schatten nur als Ebenen-Signal, Farbton 165.
Feldbuch-Raster hinter der Startseite: Spalten in `border`, 10 ab 1080 px, 4 darunter.

## 6. Bildsprache
Motive vor hellem Grund, in Graustufen: Blatt, Pflanze, Anbau, Labor, Trichom-Makro, Notizbuch.
Hell: multiply auf Papier. Dunkel: invert plus screen. Wand-Texturen (Drips, Nebel, Marmorierung)
sind Alpha-Masken, eingefärbt in `spray`. Videos: höchstens zwei, stumm, mit Standbild, erst in der Nähe geladen.
Quelle nur Pexels, selbst gehostet, jede Datei in lib/medien.ts mit Urheber, Nachweis im Footer.
Ausgeschlossen: Konsum (Joints, Bongs, Rauch, Konsumierende), Figuren, Blüten mit erkennbarem
Handelsnamen, Schriftzüge im Bild („MEDICINE“), fremde Graffiti-Tags.

## 7. Bewegung
[Liste aus Spec 4.6 wörtlich, ergänzt um die zwei Präzisierungen aus Spec 13: Manifest-Einfärbung über
 Deckkraft, Schleife über Strichversatz]

## 8. Tonalität und Sprache
Du + Ich. Buch-Texte sachlich und warm, ganze Sätze. Wand-Texte kurz, Imperativ („Wähl mit.“,
„Schlag vor.“). Kein Geviertstrich, kein Gedankenstrich als Trenner. Keine Füllverben
(„revolutionieren“, „nahtlos“), keine erfundenen Zahlen. Verbotene Wörter: high, stoned, dank, 420,
Heilung, heilt, wirkt gegen.

## 9. Leitplanken HWG und Jugendschutz
[Liste 1 bis 7 aus Spec 3.1 wörtlich]

## 10. Do's und Don'ts
| Regel | Do | Don't |
|---|---|---|
| Wer spricht | Handelsname in Cormorant auf dem Stimmzettel | Handelsname als Sprüh-Tag |
| Bedienakzent | „Wähl mit“ als grüne Pille | violetter Button |
| Datengrafik | Netzdiagramm in Tinte mit 12 % Fläche | Netz in Blattgrün |
| Wand-Text | „Stimm ab.“ | „Hier kannst du jetzt ganz einfach abstimmen!“ |
| Buch-Text | „Ich schreibe auf, was drin ist.“ | „Wir revolutionieren Cannabis-Reviews.“ |
| Motiv | Blatt vor hellem Grund, Graustufen | Joint vor dunklem Grund |
| Wirkung | Wirkung nur im vollständigen Eintrag | große Wirkungsnote auf der Startseite |
| Zahlen | echte Zähler oder die Leitsätze | „Über 10.000 zufriedene Nutzer“ |
| Trenner | „Grünes Buch. Charge für Charge.“ | „Grünes Buch — Charge für Charge“ |
| Formen | eckige Karte, Pillen-Button | abgerundete Karte, eckiger Button |
```

Die eckigen Klammern oben sind Übernahme-Anweisungen: an ihrer Stelle steht in der Datei der genannte Spec-Inhalt, keine Klammer bleibt stehen.

- [ ] **Step 3: `ui-design-engine.md` vollständig neu schreiben**

Inhalt von `.claude/skills/ui-design-engine.md` ersetzen durch:

```markdown
---
name: ui-design-engine
description: Design-System-Regelwerk "Grünes Buch" (Buch und Wand, 8px-Raster) für diesen Medizinalcannabis-Katalog. Greift immer beim Bauen oder Ändern von UI-Komponenten, Seiten, Layouts oder Styles in diesem Projekt (alles unter app/** und components/**, sowie app/globals.css): Spacing, Typografie, Farbe, Formen, Medien, Motion, Zustände, Badges, Barrierefreiheit. Marke in docs/brand/gruenes-buch.md, hier die verbindlichen Code-Regeln und die Abschluss-Checkliste.
---

# UI Design Engine: Grünes Buch

Die Marke steht in `docs/brand/gruenes-buch.md`. Diese Datei übersetzt sie in Regeln für Code.
Tokens liegen in `app/globals.css` (Tailwind v4, `@theme`) und werden von `npm run farben` gegen
die Spec geprüft. Allgemeine Frontend-Qualität kommt aus `frontend-design`; bei Konflikten zu
Spacing, Farbe, Formen, Motion oder Tokens gilt diese Datei. Für Design-Arbeit werden zusätzlich
die Design-Skills geladen (Zuordnung in der Memory `design-skills-einsatz`).

## 1. Zwei Stimmen
- **Buch** (Betreiber): Cormorant Garamond, Geist, Geist Mono, Papier und Tinte, Graustufen-Motive.
- **Wand** (Community): Sedgwick Ave Display, `spray`, Wand-Texturen aus `components/medien/Textur`.
- Wand nur, wo die Community spricht (Abstimmung, Vorschlag, Community-Zahlen, „Wähl mit“) und als
  bewusster Bruch in Story-Übergängen. Messwerte, Reviews, Katalogdaten, Handelsnamen und
  Rechtshinweise sind immer Buch.

## 2. 8px-Raster
- Abstände (padding, margin, gap) nur aus der Leiter 8, 16, 24, 32, 40, 48, 64, 80, 96, 128 px
  (`--spacing: 4px`, also nur gerade Tailwind-Stufen). 4 px nur als optische Korrektur in einem
  zusammengehörigen Paar, mit Begründung im Code.
- Keine arbitrary values für Abstände (`p-[13px]`, `gap-[10px]`), kein inline `style` mit Pixeln.
- **Erlaubt:** art-direktierte Größen und Positionen in `components/story/` und `components/marke/`
  in `vw`, `vh`, `%` oder Brüchen (`w-[42vw]`, `left-[44vw]`, `md:gap-[40vh]`), weil sie Komposition
  sind, kein Abstand zwischen Inhalten. `max-w-[68ch]` und ähnliche Lesemaße bleiben erlaubt.

## 3. Typografie
| Rolle | Klasse | Einsatz |
|---|---|---|
| Buch-Display | `font-buch` | Kapitel, Manifest, Zitate, Wortmarke, Handelsname im Eintrag |
| Text und Bedienung | `font-sans` (Standard) | Fließtext, Buttons, Formulare, Navigation |
| Messwerte | `numeric` (Geist Mono, `tabular-nums`) | Noten, Chargen, Zahlen |
| Wand | `font-wand` | Tags, Wand-Zeilen, „Wähl mit.“; nie Fließtext, Daten, Formulare, Namen |

Größen: `text-caption` 13, `text-small` 14, `text-body` 16, `text-h3` 20, `text-h2` 25, `text-h1` 31,
`text-display` 39 px; fluide Display-Tokens `text-wortmarke` (1.75rem, 500), `text-kapitel`
(clamp 2.5 bis 5rem, 300), `text-titel` (clamp 3.5 bis 8rem, 300), `text-auftakt`
(clamp 4.5rem, 20vw, 21rem, 500), `text-tag` (clamp 2 bis 5rem, 400).
- Geist: 400, 500, 600. Cormorant 300 **nur ab 40 px** (`text-kapitel`, `text-titel`), sonst 500.
  Sedgwick 400, nicht unter 25 px.
- Betonung über die Kursive derselben Familie. Tags in natürlicher Schreibung, kein `uppercase` auf Sedgwick.
- `text-balance` auf Überschriften, `text-pretty` auf Beschreibungen, `wrap-break-word` wo lange
  Handelsnamen stehen. Höchstens drei Schriftgrade je Sektion.
- Laufweite: `tracking-gesperrt` (0.3em) nur im Aufkleber; kleine Versalien-Zeilen `tracking-wide`.

## 4. Farbe
Komponenten nutzen nur semantische Tokens:
`surface`, `surface-raised`, `surface-sunken`, `border`, `border-strong`, `text`, `text-muted`,
`accent`, `accent-hover`, `accent-fg`, `accent-subtle`, `spray`, `spray-fg`, `focus-ring`,
`danger`/`success`/`warning` (+ `-fg`).
- `accent` (Blattgrün) ist der einzige Bedienakzent: Buttons, Links, aktive Zustände, Fokus.
  Genau eine gefüllte Primäraktion pro Ansicht. Hover über `accent-hover`, nicht über Deckkraft.
  Einzige Ausnahme außerhalb der Bedienung: der randfüllende Titel „Grünes Buch“ im Auftakt
  (Spec 5.1), weil der Name selbst grün ist.
- `spray` nur für die Wand; nie auf Buttons, Links oder Fokus.
- Datengrafiken in `text`/`text-muted` (Linie plus Fläche mit geringer Deckkraft), nicht in `accent`.
- Verboten in Komponenten: Primitives (`blatt-*`, `spray-400/500`, `neutral-*`), Hex, `oklch()`,
  Tailwind-Standardpaletten, `dark:`-Farbvarianten. Dark Mode entsteht allein über die Tokens.
- Wer ein Token ändert, ändert die Tabelle in `scripts/farben-pruefen.mjs` mit und lässt `npm run farben` laufen.

## 5. Formen
- `--radius-sm/md/lg` sind 0: `rounded-sm/md/lg` ergeben eckige Flächen (Karten, Bilder, Felder,
  Tabellen). Pillen ausdrücklich mit `rounded-full`: Buttons, Badges, Chips, Filter-Einstiege.
- Einziger Bogen: der Rahmen um das Netzdiagramm (`rounded-t-full`).
- Schatten nur als Ebenen-Signal (`shadow-md` Stimmzettel und Doppelseite, `shadow-lg` Dialoge).
- Fokus: die globale Regel in `globals.css` (2 px `focus-ring`, 2 px Abstand); der Umriss folgt dem
  Radius des Elements. Nie `outline: none`.

## 6. Medien
- Bilder, Masken und Videos **nur** über `components/medien/Bild`, `Textur`, `Loop`; ein `<img>`
  gibt es nur in `Bild.tsx`. Keine Next-Bildoptimierung, kein Hotlinking.
- Jede Datei in `public/medien/` steht in `lib/medien.ts` (Test `tests/medien.test.ts`).
- Motive nach Brand Guideline 6 und Leitplanken; Fotos in Graustufen mit `medien-buch`, Videos mit
  `medien-video`, Wand-Texturen mit `wand-textur`.

## 7. Bewegung
- **CSS** für Hover, Fokus, Tippen: 180 bis 350 ms (`--duration-fast/normal/slow`), nur Farbe,
  Deckkraft, Unterstrichfarbe, Easing aus Tokens.
- **Story-Bewegung** nur auf der Startseite, nur in `components/story/bewegung/`, gestartet von
  `StoryBuehne`. Keine andere Datei importiert `gsap` oder `lenis`. Ziele über `data-story`.
- Nur `transform`, `opacity`, `clip-path`, Masken-Position. Ausnahme: `strokeDashoffset` der
  Schleife (Sektion 4). Keine Endlosschleifen außer Video-Loops.
- Reduzierte Bewegung: GSAP und Lenis werden nicht geladen, Endzustände stehen sofort da.
- Der statische erste Frame ist ohne JavaScript vollständig. Ausgeblendet wird vor dem Start nur
  `[data-story-einstieg]`, und nur unter `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`
  mit CSS-Notfall nach 2,5 s. Navigation und Primäraktion sind nie ausgeblendet.
- Geteilter Text (SplitText) mit `aria: "auto"`; Links und Hervorhebungen werden nicht geteilt.

## 8. Barrierefreiheit
- Kontrast Text ≥ 4.5:1, Grafik und Rahmen ≥ 3:1; `text-muted` nur auf den gemessenen Flächen.
- Sichtbarer Fokus überall, Touch-Ziele ≥ 44 px, jedes Feld mit `<label>`, Fehler nicht nur über Farbe.
- Kein Zustand nur über Farbe. Interaktiv sind nur `button`, `a`, `input`.
- Dekoration (`Textur`, Raster, Wasserzeichen, Tag, Diagramm-Doppel) ist `aria-hidden`.
- Hochzählende Ziffern und Diagramme haben den Endwert als `sr-only`-Text.

## 9. Sprache und Leitplanken
- Du + Ich. Neue Texte ohne „—“ und ohne „–“ als Trenner. Keine Füllverben, keine erfundenen Zahlen.
- Leitplanken 1 bis 7 aus `docs/brand/gruenes-buch.md` Abschnitt 9 gelten für jeden Text und jedes Motiv.
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
3. Buch und Wand richtig verteilt, Handelsnamen nie in Sedgwick?
4. Schriftrollen und Gewichte nach Regel 3, höchstens drei Grade je Sektion?
5. Pillen und eckige Flächen nach Regel 5?
6. Hell und dunkel geprüft (`prefers-color-scheme` und `data-theme="dark"`)?
7. Fokus sichtbar, Touch-Ziele ≥ 44 px, Dekoration `aria-hidden`?
8. Ohne JavaScript vollständig, bei reduzierter Bewegung kein GSAP/Lenis geladen?
9. Medien nur über `components/medien`, alle in `lib/medien.ts`?
10. Texte ohne Geviert- und Gedankenstrich, Leitplanken 1 bis 7 eingehalten?
11. Zahlen und Daten de-DE über `Intl`?
12. Qualitätskriterien von `frontend-design` und die Review-Skills (`interface-review`, `web-design-guidelines`) durchlaufen?
```

- [ ] **Step 4: Wrapper-Beschreibung angleichen**

In `.claude/skills/ui-design-engine/SKILL.md` nur die Zeile `description:` durch dieselbe `description` wie in Step 3 ersetzen; im Text „8px-Grid, Typo-Skala, OKLCH-Farbtokens …“ durch „Buch und Wand, 8px-Raster, Tokens, Formen, Medien, Bewegung, Barrierefreiheit, Checkliste“ ersetzen.

- [ ] **Step 5: Prüfen**

Run: `grep -n "\[Tabelle\|\[Liste\|\[Rollentabelle\|\[Größentabelle" docs/brand/gruenes-buch.md`
Expected: keine Ausgabe (alle Übernahme-Anweisungen ersetzt).

Run: `grep -c "—" docs/brand/gruenes-buch.md .claude/skills/ui-design-engine.md`
Expected: `0` für `ui-design-engine.md`; in der Guideline nur in der Don't-Spalte der Tabelle 10 (1 Treffer).

- [ ] **Step 6: Commit**

```bash
git add docs/brand/gruenes-buch.md .claude/skills/ui-design-engine.md .claude/skills/ui-design-engine/SKILL.md
git commit -m "docs: Brand Guideline Gruenes Buch und Regelwerk ui-design-engine neu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Farbrechnung und Prüfskript

**Skills:** `better-colors`, `superpowers:test-driven-development`

**Files:**
- Create: `scripts/farben/oklch.mjs`, `scripts/farben-pruefen.mjs`, `tests/farben.test.ts`
- Modify: `package.json` (Skripte `test`, `farben`)

**Interfaces:**
- Produces: `oklchZuLinearSrgb(l, c, h): [number, number, number]`, `imGamut(rgb, toleranz?): boolean`, `relativeLuminanz(rgb): number`, `kontrast(luminanzA, luminanzB): number`, `linearZuHex(rgb): string`, `parseOklch(text): [number, number, number] | null`; Befehl `npm run farben` (Exit 0 = alles in Ordnung); Befehl `npm test`.

- [ ] **Step 1: Test-Skripte in `package.json` eintragen**

In `"scripts"` ergänzen:

```json
    "test": "tsx --test \"tests/**/*.test.ts\"",
    "farben": "node scripts/farben-pruefen.mjs",
```

- [ ] **Step 2: Failing test schreiben**

`tests/farben.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  imGamut,
  kontrast,
  linearZuHex,
  oklchZuLinearSrgb,
  parseOklch,
  relativeLuminanz,
} from "../scripts/farben/oklch.mjs";

test("Weiß in OKLCH ergibt sRGB-Weiß", () => {
  for (const kanal of oklchZuLinearSrgb(1, 0, 0)) {
    assert.ok(Math.abs(kanal - 1) < 1e-4, `Kanal ${kanal}`);
  }
});

test("Kontrast Weiß auf Schwarz ist 21", () => {
  const weiss = relativeLuminanz([1, 1, 1]);
  const schwarz = relativeLuminanz([0, 0, 0]);
  assert.equal(Math.round(kontrast(weiss, schwarz) * 100) / 100, 21);
  assert.equal(kontrast(weiss, schwarz), kontrast(schwarz, weiss));
});

test("neutral-100 ergibt den Hexwert aus der Spec", () => {
  assert.equal(linearZuHex(oklchZuLinearSrgb(0.935, 0.006, 165)), "#e6ebe8");
  assert.equal(linearZuHex(oklchZuLinearSrgb(0.52, 0.2, 305)), "#853dc2");
});

test("Text auf Papier (hell) liegt bei 14.95 wie in der Spec gemessen", () => {
  const text = relativeLuminanz(oklchZuLinearSrgb(0.2, 0.009, 165));
  const papier = relativeLuminanz(oklchZuLinearSrgb(0.935, 0.006, 165));
  assert.ok(Math.abs(kontrast(text, papier) - 14.95) < 0.02);
});

test("stark gesättigtes Grün liegt außerhalb von sRGB", () => {
  assert.equal(imGamut(oklchZuLinearSrgb(0.7, 0.4, 150)), false);
  assert.equal(imGamut(oklchZuLinearSrgb(0.6, 0.115, 170)), true);
});

test("parseOklch liest Werte und lehnt anderes ab", () => {
  assert.deepEqual(parseOklch("oklch(0.99 0.003 165)"), [0.99, 0.003, 165]);
  assert.equal(parseOklch("rgb(1 2 3)"), null);
  assert.equal(parseOklch("var(--color-neutral-100)"), null);
});
```

- [ ] **Step 3: Test laufen lassen, er muss scheitern**

Run: `npm test`
Expected: FAIL, `Cannot find module '../scripts/farben/oklch.mjs'`

- [ ] **Step 4: Farbrechnung implementieren**

`scripts/farben/oklch.mjs`:

```js
/**
 * Farbrechnung fuer die Token-Pruefung (Spec 4.1).
 *
 * OKLCH -> OKLab -> lineares sRGB nach Bjoern Ottosson. Luminanz und
 * Kontrast nach WCAG 2.2. Reine Funktionen, keine Abhaengigkeit.
 */

/** @returns {[number, number, number]} lineares sRGB, ungeklemmt */
export function oklchZuLinearSrgb(l, c, h) {
  const winkel = (h * Math.PI) / 180;
  const a = c * Math.cos(winkel);
  const b = c * Math.sin(winkel);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;

  return [
    4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  ];
}

/** Liegt die Farbe im sRGB-Wuerfel? Toleranz fuer Rundung der Matrix. */
export function imGamut(rgb, toleranz = 1e-4) {
  return rgb.every((kanal) => kanal >= -toleranz && kanal <= 1 + toleranz);
}

/** Relative Luminanz aus linearem sRGB (WCAG). */
export function relativeLuminanz([r, g, b]) {
  const klemme = (x) => Math.min(Math.max(x, 0), 1);
  return 0.2126 * klemme(r) + 0.7152 * klemme(g) + 0.0722 * klemme(b);
}

/** Kontrastverhaeltnis, Reihenfolge egal. */
export function kontrast(luminanzA, luminanzB) {
  const hell = Math.max(luminanzA, luminanzB);
  const dunkel = Math.min(luminanzA, luminanzB);
  return (hell + 0.05) / (dunkel + 0.05);
}

function gamma(x) {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
}

/** Lineares sRGB als Hex, zur Kontrolle gegen die Spec-Tabelle. */
export function linearZuHex(rgb) {
  return (
    "#" +
    rgb
      .map((x) => Math.round(Math.min(Math.max(gamma(x), 0), 1) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

const OKLCH_MUSTER = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/;

/** @returns {[number, number, number] | null} */
export function parseOklch(text) {
  const treffer = OKLCH_MUSTER.exec(text.trim());
  if (!treffer) return null;
  return [Number(treffer[1]), Number(treffer[2]), Number(treffer[3])];
}
```

- [ ] **Step 5: Test laufen lassen, er muss bestehen**

Run: `npm test`
Expected: PASS, 6 Tests. Scheitert ein Spec-Wert (Hex oder 14.95) um die letzte Stelle: anhalten und dem Nutzer melden, nicht den Test anpassen. Die Werte wurden bei der Planung mit genau dieser Rechnung nachgerechnet (alle 20 Hexwerte und die Kontraste stimmen).

- [ ] **Step 6: Prüfskript schreiben**

`scripts/farben-pruefen.mjs`:

```js
/**
 * Prueft app/globals.css gegen die Farbtabellen der Spec 4.1.
 *
 *   npm run farben
 *
 * Bricht mit Exit 1 ab, wenn ein Grundwert abweicht, ausserhalb von sRGB
 * liegt, eine Rolle auf die falsche Grundfarbe zeigt, die beiden
 * Dunkel-Bloecke auseinanderlaufen oder ein Paar den Mindestkontrast
 * unterschreitet. Wer hier eine Tabelle aendert, aendert die Spec mit.
 */
import { readFileSync } from "node:fs";

import { imGamut, kontrast, oklchZuLinearSrgb, parseOklch, relativeLuminanz } from "./farben/oklch.mjs";

const GRUNDFARBEN = {
  "neutral-0": "0.99 0.003 165",
  "neutral-50": "0.965 0.004 165",
  "neutral-100": "0.935 0.006 165",
  "neutral-150": "0.905 0.007 165",
  "neutral-200": "0.86 0.008 165",
  "neutral-400": "0.615 0.012 165",
  "neutral-500": "0.52 0.012 165",
  "neutral-600": "0.47 0.012 165",
  "neutral-800": "0.3 0.011 165",
  "neutral-900": "0.2 0.009 165",
  "neutral-950": "0.165 0.008 165",
  "neutral-1000": "0.13 0.007 165",
  "blatt-100": "0.9 0.035 170",
  "blatt-400": "0.74 0.12 170",
  "blatt-500": "0.6 0.115 170",
  "blatt-600": "0.5 0.096 170",
  "blatt-700": "0.42 0.081 170",
  "blatt-900": "0.3 0.05 170",
  "spray-400": "0.72 0.15 305",
  "spray-500": "0.52 0.2 305",
  "danger-400": "0.7 0.15 25",
  "danger-500": "0.52 0.18 25",
  "warning-400": "0.8 0.13 80",
  "warning-500": "0.62 0.13 75",
  "success-400": "0.74 0.14 140",
  "success-500": "0.5 0.12 140",
};

/** Rolle -> [hell, dunkel] */
const ROLLEN = {
  surface: ["neutral-100", "neutral-950"],
  "surface-raised": ["neutral-50", "neutral-900"],
  "surface-sunken": ["neutral-150", "neutral-1000"],
  border: ["neutral-200", "neutral-800"],
  "border-strong": ["neutral-400", "neutral-500"],
  text: ["neutral-900", "neutral-50"],
  "text-muted": ["neutral-600", "neutral-400"],
  accent: ["blatt-600", "blatt-400"],
  "accent-hover": ["blatt-700", "blatt-500"],
  "accent-fg": ["neutral-0", "neutral-1000"],
  "accent-subtle": ["blatt-100", "blatt-900"],
  spray: ["spray-500", "spray-400"],
  "spray-fg": ["neutral-0", "neutral-1000"],
  "focus-ring": ["blatt-600", "blatt-400"],
  danger: ["danger-500", "danger-400"],
  success: ["success-500", "success-400"],
  warning: ["warning-500", "warning-400"],
  "danger-fg": ["neutral-0", "neutral-1000"],
  "success-fg": ["neutral-0", "neutral-1000"],
  "warning-fg": ["neutral-1000", "neutral-1000"],
};

/** [Vordergrund, Hintergrund, Mindestwert] */
const PAARE = [
  ["text", "surface", 4.5],
  ["text", "surface-raised", 4.5],
  ["text-muted", "surface", 4.5],
  ["text-muted", "surface-raised", 4.5],
  ["text-muted", "surface-sunken", 4.5],
  ["accent", "surface", 4.5],
  ["accent", "surface-raised", 4.5],
  ["accent-fg", "accent", 4.5],
  ["accent-fg", "accent-hover", 4.5],
  ["focus-ring", "surface", 3],
  ["border-strong", "surface", 3],
  ["border-strong", "surface-raised", 3],
  ["spray", "surface", 4.5],
  ["spray-fg", "spray", 4.5],
  ["danger", "surface", 4.5],
  ["danger-fg", "danger", 4.5],
  ["success", "surface", 4.5],
  ["success-fg", "success", 4.5],
  ["warning", "surface", 3],
  ["warning-fg", "warning", 4.5],
  ["text", "accent-subtle", 4.5],
];

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const fehler = [];

/** Inhalt des Blocks, der auf `selektor {` folgt, mit Klammerzaehlung. */
function block(selektor) {
  const start = css.indexOf(selektor);
  if (start === -1) return null;
  const auf = css.indexOf("{", start);
  let tiefe = 0;
  for (let i = auf; i < css.length; i++) {
    if (css[i] === "{") tiefe++;
    if (css[i] === "}") tiefe--;
    if (tiefe === 0) return css.slice(auf + 1, i);
  }
  return null;
}

function variablen(text) {
  const werte = new Map();
  for (const [, name, wert] of text.matchAll(/--color-([\w-]+):\s*([^;]+);/g)) werte.set(name, wert.trim());
  return werte;
}

const theme = block("@theme");
const dunkelMedia = block(':root:not([data-theme="light"])');
const dunkelAttribut = block(':root[data-theme="dark"]');
if (!theme || !dunkelMedia || !dunkelAttribut) {
  console.error("globals.css: @theme oder einer der beiden Dunkel-Bloecke fehlt.");
  process.exit(1);
}
const hell = variablen(theme);
const dunkelA = variablen(dunkelMedia);
const dunkelB = variablen(dunkelAttribut);

const linear = new Map();
for (const [name, soll] of Object.entries(GRUNDFARBEN)) {
  const [l, c, h] = soll.split(" ").map(Number);
  const ist = hell.get(name);
  const gelesen = ist ? parseOklch(ist) : null;
  if (!gelesen) fehler.push(`Grundfarbe ${name} fehlt oder ist kein oklch(): ${ist ?? "nicht gefunden"}`);
  else if (gelesen.some((wert, i) => Math.abs(wert - [l, c, h][i]) > 1e-9))
    fehler.push(`Grundfarbe ${name}: ${ist}, Spec: oklch(${soll})`);
  const rgb = oklchZuLinearSrgb(l, c, h);
  if (!imGamut(rgb)) fehler.push(`Grundfarbe ${name} liegt ausserhalb von sRGB`);
  linear.set(name, rgb);
}

function zeigtAuf(werte, rolle) {
  const treffer = /^var\(--color-([\w-]+)\)$/.exec(werte.get(rolle) ?? "");
  return treffer ? treffer[1] : null;
}

for (const [rolle, [sollHell, sollDunkel]] of Object.entries(ROLLEN)) {
  if (zeigtAuf(hell, rolle) !== sollHell) fehler.push(`hell: --color-${rolle} soll auf ${sollHell} zeigen, ist ${hell.get(rolle) ?? "nicht gesetzt"}`);
  for (const [name, werte] of [["dunkel (Media)", dunkelA], ["dunkel (data-theme)", dunkelB]]) {
    if (zeigtAuf(werte, rolle) !== sollDunkel) fehler.push(`${name}: --color-${rolle} soll auf ${sollDunkel} zeigen, ist ${werte.get(rolle) ?? "nicht gesetzt"}`);
  }
}

const zeilen = [];
for (const [vorne, hinten, minimum] of PAARE) {
  for (const [modus, index] of [["hell", 0], ["dunkel", 1]]) {
    const a = relativeLuminanz(linear.get(ROLLEN[vorne][index]));
    const b = relativeLuminanz(linear.get(ROLLEN[hinten][index]));
    const wert = kontrast(a, b);
    zeilen.push(`${`${vorne} / ${hinten}`.padEnd(34)} ${modus.padEnd(7)} ${wert.toFixed(2).padStart(6)}  (min ${minimum})`);
    if (wert < minimum) fehler.push(`${modus}: ${vorne} auf ${hinten} = ${wert.toFixed(2)}, verlangt ${minimum}`);
  }
}

console.log(zeilen.join("\n"));
if (fehler.length > 0) {
  console.error(`\n${fehler.length} Verstoss/Verstoesse:\n- ${fehler.join("\n- ")}`);
  process.exit(1);
}
console.log("\nFarben in Ordnung: Grundwerte, Gamut, Rollen hell/dunkel, Kontraste.");
```

- [ ] **Step 7: Skript gegen die alte `globals.css` laufen lassen, es muss scheitern**

Run: `npm run farben`
Expected: Exit 1 mit einer Liste von Verstößen (z. B. `Grundfarbe blatt-100 fehlt`). Das ist richtig: die Tokens werden erst in Task 3 umgestellt.

- [ ] **Step 8: Commit**

```bash
git add package.json scripts/farben/oklch.mjs scripts/farben-pruefen.mjs tests/farben.test.ts
git commit -m "test: Farbrechnung OKLCH und Pruefskript gegen die Spec-Tabellen

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tokens und Schriften

**Skills:** `better-colors`, `better-typography`, `ui-design-engine`

**Files:**
- Modify: `app/globals.css` (Abschnitte `@theme`, beide Dunkel-Blöcke, `@layer base`, neu `@layer components`)
- Modify: `app/layout.tsx` (nur Schriften)

**Interfaces:**
- Consumes: `npm run farben` aus Task 2
- Produces: Klassen `font-buch`, `font-wand`, `text-wortmarke`, `text-kapitel`, `text-titel`, `text-auftakt`, `text-tag`, `tracking-gesperrt`, Farben `accent-hover`, `spray`, `spray-fg`, Hilfsklassen `medien-buch`, `medien-video`, `wand-textur`, `feldbuch-raster`; CSS-Variablen `--font-cormorant`, `--font-sedgwick`

- [ ] **Step 1: `@theme` ersetzen**

In `app/globals.css` den Kopfkommentar und den gesamten `@theme { … }`-Block ersetzen durch:

```css
/* ==========================================================================
   Design-Tokens "Grünes Buch"
   Marke: docs/brand/gruenes-buch.md · Regeln: .claude/skills/ui-design-engine.md
   Farbwerte prueft `npm run farben` gegen die Spec (scripts/farben-pruefen.mjs).
   ========================================================================== */

@theme {
  /* ---- Schriften ------------------------------------------------------- */
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --font-buch: var(--font-cormorant), Georgia, "Times New Roman", serif;
  --font-wand: var(--font-sedgwick), "Segoe Print", cursive;

  /* ---- Spacing: Basis 4px, nur gerade Stufen (8px-Raster) -------------- */
  --spacing: 4px;

  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-8: 64px;
  --space-10: 80px;
  --space-12: 96px;
  --space-16: 128px;
  /* nur optische Korrektur in einem Icon/Text-Paar - mit Begruendung */
  --space-half: 4px;

  /* ---- Textskala: modular 1.25, Basis 16px ----------------------------- */
  --text-caption: 0.8125rem;
  --text-caption--line-height: 1rem;
  --text-caption--font-weight: 500;

  --text-small: 0.875rem;
  --text-small--line-height: 1.25rem;
  --text-small--font-weight: 400;

  --text-body: 1rem;
  --text-body--line-height: 1.5rem;
  --text-body--font-weight: 400;

  --text-h3: 1.25rem;
  --text-h3--line-height: 1.75rem;
  --text-h3--font-weight: 600;

  --text-h2: 1.5625rem;
  --text-h2--line-height: 2rem;
  --text-h2--font-weight: 600;

  --text-h1: 1.9375rem;
  --text-h1--line-height: 2.5rem;
  --text-h1--font-weight: 600;

  --text-display: 2.4375rem;
  --text-display--line-height: 3rem;
  --text-display--font-weight: 600;

  /* ---- Display "Grünes Buch" (Spec 4.2) -------------------------------- */
  /* Wortmarke im Kopf: Cormorant 500, weil 300 erst ab 40px traegt. */
  --text-wortmarke: 1.75rem;
  --text-wortmarke--line-height: 1;
  --text-wortmarke--font-weight: 500;

  --text-kapitel: clamp(2.5rem, 1.5rem + 3.5vw, 5rem);
  --text-kapitel--line-height: 1.1;
  --text-kapitel--font-weight: 300;

  --text-titel: clamp(3.5rem, 2rem + 6vw, 8rem);
  --text-titel--line-height: 1.05;
  --text-titel--font-weight: 300;

  /* Randfuellender Titel im Auftakt, zwei Zeilen Versalien. */
  --text-auftakt: clamp(4.5rem, 20vw, 21rem);
  --text-auftakt--line-height: 0.86;
  --text-auftakt--font-weight: 500;

  --text-tag: clamp(2rem, 1rem + 4vw, 5rem);
  --text-tag--line-height: 1.1;
  --text-tag--font-weight: 400;

  --tracking-gesperrt: 0.3em;

  /* ---- Grundfarben (Spec 4.1) - nie direkt in Komponenten -------------- */
  --color-neutral-0: oklch(0.99 0.003 165);
  --color-neutral-50: oklch(0.965 0.004 165);
  --color-neutral-100: oklch(0.935 0.006 165);
  --color-neutral-150: oklch(0.905 0.007 165);
  --color-neutral-200: oklch(0.86 0.008 165);
  --color-neutral-400: oklch(0.615 0.012 165);
  --color-neutral-500: oklch(0.52 0.012 165);
  --color-neutral-600: oklch(0.47 0.012 165);
  --color-neutral-800: oklch(0.3 0.011 165);
  --color-neutral-900: oklch(0.2 0.009 165);
  --color-neutral-950: oklch(0.165 0.008 165);
  --color-neutral-1000: oklch(0.13 0.007 165);

  --color-blatt-100: oklch(0.9 0.035 170);
  --color-blatt-400: oklch(0.74 0.12 170);
  --color-blatt-500: oklch(0.6 0.115 170);
  --color-blatt-600: oklch(0.5 0.096 170);
  --color-blatt-700: oklch(0.42 0.081 170);
  --color-blatt-900: oklch(0.3 0.05 170);

  --color-spray-400: oklch(0.72 0.15 305);
  --color-spray-500: oklch(0.52 0.2 305);

  --color-danger-400: oklch(0.7 0.15 25);
  --color-danger-500: oklch(0.52 0.18 25);
  --color-warning-400: oklch(0.8 0.13 80);
  --color-warning-500: oklch(0.62 0.13 75);
  --color-success-400: oklch(0.74 0.14 140);
  --color-success-500: oklch(0.5 0.12 140);

  /* ---- Semantische Tokens, hell (die Marke) ---------------------------- */
  --color-surface: var(--color-neutral-100);
  --color-surface-raised: var(--color-neutral-50);
  --color-surface-sunken: var(--color-neutral-150);
  --color-border: var(--color-neutral-200);
  --color-border-strong: var(--color-neutral-400);
  --color-text: var(--color-neutral-900);
  --color-text-muted: var(--color-neutral-600);
  --color-accent: var(--color-blatt-600);
  --color-accent-hover: var(--color-blatt-700);
  --color-accent-fg: var(--color-neutral-0);
  --color-accent-subtle: var(--color-blatt-100);
  --color-spray: var(--color-spray-500);
  --color-spray-fg: var(--color-neutral-0);
  --color-focus-ring: var(--color-blatt-600);
  --color-danger: var(--color-danger-500);
  --color-danger-fg: var(--color-neutral-0);
  --color-warning: var(--color-warning-500);
  --color-warning-fg: var(--color-neutral-1000);
  --color-success: var(--color-success-500);
  --color-success-fg: var(--color-neutral-0);

  /* ---- Formen (Spec 4.4) ------------------------------------------------ */
  /* Eckig ist die Regel: rounded-sm/md/lg ergeben 0. Pillen nur mit rounded-full. */
  --radius-sm: 0;
  --radius-md: 0;
  --radius-lg: 0;
  --radius-full: 9999px;

  /* ---- Ebenen: Schatten auf Farbton 165 --------------------------------- */
  --shadow-sm: 0 1px 2px oklch(0.2 0.009 165 / 0.06);
  --shadow-md: 0 2px 8px oklch(0.2 0.009 165 / 0.1);
  --shadow-lg: 0 8px 24px oklch(0.2 0.009 165 / 0.14);

  /* ---- Bewegung: Hover 180 bis 350 ms (Spec 4.6) ------------------------ */
  --ease-standard: cubic-bezier(0.2, 0, 0.2, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --duration-fast: 180ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
}
```

- [ ] **Step 2: Beide Dunkel-Blöcke ersetzen**

Den Block `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }` und den Block `:root[data-theme="dark"] { … }` durch dieselbe Belegung ersetzen (beide Male identisch, nur der Selektor unterscheidet sich):

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-surface: var(--color-neutral-950);
    --color-surface-raised: var(--color-neutral-900);
    --color-surface-sunken: var(--color-neutral-1000);
    --color-border: var(--color-neutral-800);
    --color-border-strong: var(--color-neutral-500);
    --color-text: var(--color-neutral-50);
    --color-text-muted: var(--color-neutral-400);
    --color-accent: var(--color-blatt-400);
    --color-accent-hover: var(--color-blatt-500);
    --color-accent-fg: var(--color-neutral-1000);
    --color-accent-subtle: var(--color-blatt-900);
    --color-spray: var(--color-spray-400);
    --color-spray-fg: var(--color-neutral-1000);
    --color-focus-ring: var(--color-blatt-400);
    --color-danger: var(--color-danger-400);
    --color-danger-fg: var(--color-neutral-1000);
    --color-warning: var(--color-warning-400);
    --color-warning-fg: var(--color-neutral-1000);
    --color-success: var(--color-success-400);
    --color-success-fg: var(--color-neutral-1000);

    --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.5);
    --shadow-md: 0 2px 8px oklch(0 0 0 / 0.55);
    --shadow-lg: 0 8px 24px oklch(0 0 0 / 0.6);
  }
}
```

und darunter `:root[data-theme="dark"] { … }` mit genau denselben 23 Zeilen.

- [ ] **Step 3: Basis- und Komponenten-Schicht anpassen**

In `@layer base` in der Regel `:focus-visible` die Zeile `border-radius: var(--radius-sm);` **löschen** und darüber kommentieren:

```css
  /* Einheitlicher Fokus, nie in Komponenten entfernt. Kein eigener Radius:
     der Umriss folgt dem Radius des Elements (Pille oder eckig). */
```

Nach dem `@layer base`-Block (vor „Reduced motion“) einfügen:

```css
/* ==========================================================================
   Material: Medien, Wand, Feldbuch
   ========================================================================== */

@layer components {
  /* Graustufen-Fotos vor hellem Grund verschmelzen mit dem Papier (Spec 4.5). */
  .medien-buch {
    mix-blend-mode: multiply;
  }

  .medien-video {
    filter: grayscale(1);
    mix-blend-mode: multiply;
  }

  /* Wand-Textur: Alpha-Maske aus der Pipeline, eingefaerbt in spray. */
  .wand-textur {
    background-color: var(--color-spray);
    mask-size: cover;
    mask-position: center;
    mask-repeat: no-repeat;
    -webkit-mask-size: cover;
    -webkit-mask-position: center;
    -webkit-mask-repeat: no-repeat;
  }

  /* Feldbuch-Raster hinter der Startseite (Spec 4.7). */
  .feldbuch-raster {
    background-image: linear-gradient(to right, var(--color-border) 1px, transparent 1px);
    background-size: calc(100% / 4) 100%;
  }

  @media (min-width: 1080px) {
    .feldbuch-raster {
      background-size: calc(100% / 10) 100%;
    }
  }
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .medien-buch {
    filter: invert(1);
    mix-blend-mode: screen;
  }

  :root:not([data-theme="light"]) .medien-video {
    filter: grayscale(1) invert(1);
    mix-blend-mode: screen;
  }
}

:root[data-theme="dark"] .medien-buch {
  filter: invert(1);
  mix-blend-mode: screen;
}

:root[data-theme="dark"] .medien-video {
  filter: grayscale(1) invert(1);
  mix-blend-mode: screen;
}
```

- [ ] **Step 4: Farbprüfung laufen lassen, sie muss jetzt bestehen**

Run: `npm run farben`
Expected: 42 Tabellenzeilen, am Ende `Farben in Ordnung: Grundwerte, Gamut, Rollen hell/dunkel, Kontraste.`, Exit 0.

- [ ] **Step 5: Schriften im Layout laden**

In `app/layout.tsx` den Import und die Font-Konstanten ersetzen:

```tsx
import {
  Cormorant_Garamond,
  Geist,
  Geist_Mono,
  Sedgwick_Ave_Display,
} from "next/font/google";
```

```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Variabel (300 bis 700), normal und kursiv: zwei Dateien (Spec 6.4). */
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

/** Nur die Wand. Ein Schnitt, eine Datei. */
const sedgwick = Sedgwick_Ave_Display({
  variable: "--font-sedgwick",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
```

und im `<html>`-Element:

```tsx
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${sedgwick.variable} h-full antialiased`}
```

- [ ] **Step 6: Typecheck, Lint, Build**

Run: `npm run typecheck && npx eslint . && npm run build`
Expected: alle drei grün. Der Build lädt die Schriften einmal von Google (einmaliger Netzzugriff, keine Wiederholung bei Fehler: anhalten und melden).

- [ ] **Step 7: Sichtprüfung**

`npm run dev` im Hintergrund starten, im Browser `http://localhost:3000/produkte` und `/reviews` öffnen (Gate-Passwort gibt der Nutzer ein, falls nötig). Prüfen: Papiergrau statt Weiß, Links und Primärbuttons grün, Karten eckig, keine Konsolenfehler. Dunkel prüfen per `javascript_tool`: `document.documentElement.dataset.theme = "dark"`.

- [ ] **Step 8: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: Tokens Gruenes Buch (Papier, Blattgruen, Spruehviolett, eckig) und Schriften Cormorant/Sedgwick

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Primitives nach der Formregel

**Skills:** `emil-design-eng`, `better-accessibility`, `ui-design-engine`, `superpowers:test-driven-development`

**Files:**
- Create: `tests/primitive.test.ts`
- Modify: `components/ui/Button.tsx`, `components/ui/Badge.tsx`

**Interfaces:**
- Consumes: Tokens `accent-hover`, `surface-sunken`, `--duration-fast`, `--radius-full` aus Task 3
- Produces: `buttonKlassen(variante, groesse, className?)` liefert Pillen mit Farb-Hover (Signatur unverändert)

- [ ] **Step 1: Failing test schreiben**

`tests/primitive.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { buttonKlassen } from "@/components/ui/Button";

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
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npm test`
Expected: FAIL in „Buttons sind Pillen“ (`rounded-md` statt `rounded-full`).

- [ ] **Step 3: `Button.tsx` anpassen**

`BASIS` und `VARIANTEN` ersetzen:

```tsx
const BASIS =
  "inline-flex items-center justify-center gap-2 rounded-full border border-transparent " +
  "font-medium whitespace-nowrap transition-colors duration-fast ease-standard " +
  "disabled:pointer-events-none disabled:opacity-50";

const VARIANTEN: Record<ButtonVariante, string> = {
  // Hover ueber eigene Tokens: bleibt in hell und dunkel korrekt und
  // haelt den Kontrast (accent-fg auf accent-hover 7.88 bzw. 5.40).
  primary: "bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "border-border-strong bg-surface-raised text-text hover:bg-surface-sunken",
  ghost: "bg-transparent text-text hover:bg-surface-sunken",
};
```

Die `focus-visible:`-Klassen entfallen, weil die globale `:focus-visible`-Regel denselben Ring zeichnet und jetzt dem Pillenradius folgt.

- [ ] **Step 4: `Badge.tsx` anpassen**

In der Klassenliste von `Badge` nur `rounded-sm` durch `rounded-full` ersetzen; `px-2` bleibt (8 px, auf der Leiter):

```tsx
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-caption",
```

- [ ] **Step 5: Test laufen lassen, er muss bestehen**

Run: `npm test`
Expected: PASS (Farben- und Primitive-Tests).

- [ ] **Step 6: Typecheck, Lint, Sichtprüfung**

Run: `npm run typecheck && npx eslint .`
Expected: grün.

Im Browser `/produkte`, `/umfragen`, `/anmelden`: Buttons und Badges als Pillen, Karten, Felder und Tabellen eckig, Fokus mit Tab sichtbar und rund um Pillen.

- [ ] **Step 7: Commit**

```bash
git add components/ui/Button.tsx components/ui/Badge.tsx tests/primitive.test.ts
git commit -m "feat: Primitives als Pillen mit Farb-Hover, Flaechen eckig

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 5: Medien-Verzeichnis und Pipeline

**Skills:** `superpowers:test-driven-development`, `edge-stack-master` (Skripte gehören nie in den Request-Pfad)

**Files:**
- Create: `lib/medien.ts`, `scripts/medien/pexels.ts`, `scripts/medien/verarbeitung.ts`, `scripts/medien/suchen.ts`, `scripts/medien/aufbereiten.ts`
- Create: `tests/medien.test.ts`, `tests/medien-verarbeitung.test.ts`

**Interfaces:**
- Produces (`lib/medien.ts`): `type MedienArt = "foto" | "maske" | "video"`, `type Medium`, `FOTO_BREITEN`, `MASKEN_BREITE`, `STANDBILD_BREITE`, `MEDIEN: readonly Medium[]`, `medium(id): Medium`, `fotoBreiten(m): number[]`, `dateienVon(m): string[]`, `bildQuelle(id): { src: string; srcSet: string }`
- Produces (`scripts/medien/verarbeitung.ts`): `zuGraustufenWebp(eingabe: Buffer, breite: number): Promise<Buffer>`, `zuMaskePng(eingabe: Buffer, breite: number, umkehren?: boolean): Promise<Buffer>`, `waehleSdVideo(dateien): PexelsVideoDatei | null`, `type PexelsVideoDatei`
- Produces: Befehle `npx tsx scripts/medien/suchen.ts "<begriff>" [--video]` und `npx tsx scripts/medien/aufbereiten.ts`

- [ ] **Step 1: Failing tests schreiben**

`tests/medien.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { MEDIEN, dateienVon, type Medium } from "@/lib/medien";

function beispiel(art: Medium["art"], breite = 4000): Medium {
  return {
    id: "x",
    art,
    pexelsId: 1,
    datei: "x",
    breite,
    hoehe: 3000,
    alt: art === "foto" ? "Beispiel" : "",
    urheber: "Jemand",
    quelle: "https://www.pexels.com/photo/1/",
  };
}

test("Fotos liegen in drei Breiten vor, nie breiter als das Original", () => {
  assert.deepEqual(dateienVon(beispiel("foto")), ["x-640.webp", "x-1280.webp", "x-1920.webp"]);
  assert.deepEqual(dateienVon(beispiel("foto", 1500)), ["x-640.webp", "x-1280.webp"]);
  assert.deepEqual(dateienVon(beispiel("foto", 500)), ["x-500.webp"]);
});

test("Masken und Videos haben feste Dateinamen", () => {
  assert.deepEqual(dateienVon(beispiel("maske")), ["x-maske.png"]);
  assert.deepEqual(dateienVon(beispiel("video")), ["x.mp4", "x-standbild.webp"]);
});

test("Schlüssel und Dateinamen sind eindeutig", () => {
  const ids = MEDIEN.map((m) => m.id);
  const dateien = MEDIEN.map((m) => m.datei);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(dateien).size, dateien.length);
});

test("jedes Foto hat einen Alt-Text, jede Quelle ist eine Pexels-Seite", () => {
  for (const m of MEDIEN) {
    if (m.art === "foto") assert.ok(m.alt.trim().length > 0, `${m.id}: Alt-Text fehlt`);
    assert.match(m.quelle, /^https:\/\/www\.pexels\.com\//, `${m.id}: Quelle`);
    assert.ok(m.urheber.trim().length > 0, `${m.id}: Urheber fehlt`);
  }
});

test("jede Datei in public/medien steht im Verzeichnis und umgekehrt", () => {
  const ordner = join(process.cwd(), "public", "medien");
  const vorhanden = existsSync(ordner)
    ? readdirSync(ordner).filter((datei) => !datei.startsWith("."))
    : [];
  const erwartet = MEDIEN.flatMap(dateienVon);
  assert.deepEqual([...vorhanden].sort(), [...erwartet].sort());
});
```

`tests/medien-verarbeitung.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";

import { waehleSdVideo, zuGraustufenWebp, zuMaskePng } from "../scripts/medien/verarbeitung";

/** Ein Graustufenstreifen 4 x 1: schwarz, dunkelgrau, hellgrau, weiß. */
async function streifen(): Promise<Buffer> {
  return sharp(Buffer.from([0, 85, 170, 255]), { raw: { width: 4, height: 1, channels: 1 } })
    .png()
    .toBuffer();
}

async function alphaWerte(png: Buffer): Promise<number[]> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const werte: number[] = [];
  for (let i = 0; i < info.width * info.height; i++) werte.push(data[i * info.channels + 3]);
  return werte;
}

test("Maske: dunkle Farbe wird deckend, heller Grund durchsichtig", async () => {
  const alpha = await alphaWerte(await zuMaskePng(await streifen(), 4));
  assert.ok(alpha[0] > 200, `schwarz → ${alpha[0]}`);
  assert.ok(alpha[3] < 50, `weiß → ${alpha[3]}`);
  assert.ok(alpha[0] > alpha[1] && alpha[1] > alpha[2] && alpha[2] > alpha[3], alpha.join(","));
});

test("Maske umgekehrt: helle Farbe wird deckend", async () => {
  const alpha = await alphaWerte(await zuMaskePng(await streifen(), 4, true));
  assert.ok(alpha[3] > 200 && alpha[0] < 50, alpha.join(","));
});

test("Graustufen-WebP vergrößert nie", async () => {
  const klein = await sharp({ create: { width: 100, height: 50, channels: 3, background: "#4bc39f" } })
    .jpeg()
    .toBuffer();
  const meta = await sharp(await zuGraustufenWebp(klein, 640)).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 100);
});

test("Video: größte SD-Datei bis 960 px, sonst kleinste MP4", () => {
  const datei = (quality: string | null, width: number, file_type = "video/mp4") => ({
    quality,
    width,
    height: Math.round(width * 0.5625),
    file_type,
    link: `https://example.test/${quality}-${width}.mp4`,
  });
  assert.equal(
    waehleSdVideo([datei("hd", 1920), datei("sd", 640), datei("sd", 960), datei("sd", 426)])?.width,
    960,
  );
  assert.equal(waehleSdVideo([datei("hd", 1920), datei("hd", 1280)])?.width, 1280);
  assert.equal(waehleSdVideo([datei("sd", 640, "video/webm")]), null);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npm test`
Expected: FAIL, `Cannot find module '@/lib/medien'` und `'../scripts/medien/verarbeitung'`.

- [ ] **Step 3: `lib/medien.ts` schreiben**

```ts
/**
 * Verzeichnis aller Medien der Seite (Spec 6.1).
 *
 * Eine Stelle fuer Datei, Masse, Alt-Text und Herkunft: die Komponenten in
 * components/medien lesen hier, scripts/medien/aufbereiten.ts erzeugt die
 * Dateien daraus, der Footer nennt daraus die Bildnachweise. Eine Datei in
 * public/medien ohne Eintrag hier ist ein Fehler (tests/medien.test.ts).
 *
 * Reine Daten, keine Abhaengigkeit: das Modul liegt im Request-Pfad.
 */

export type MedienArt = "foto" | "maske" | "video";

export type Medium = {
  /** Schluessel, unter dem Komponenten das Medium anfordern. */
  id: string;
  art: MedienArt;
  pexelsId: number;
  /** Basisname der Dateien in public/medien, ohne Breite und Endung. */
  datei: string;
  /** Masse des Originals: Seitenverhaeltnis fuer width/height, damit nichts springt. */
  breite: number;
  hoehe: number;
  /** Pflicht bei Fotos. Masken und Videos sind dekorativ und bleiben leer. */
  alt: string;
  urheber: string;
  /** Pexels-Seite des Motivs. */
  quelle: string;
  /** Nur Masken: helle Farbe auf dunklem Grund statt dunkel auf hell. */
  maskeUmkehren?: boolean;
};

export const FOTO_BREITEN = [640, 1280, 1920] as const;
export const MASKEN_BREITE = 960;
export const STANDBILD_BREITE = 1280;

/** Wird in Task 6 gefuellt. */
export const MEDIEN: readonly Medium[] = [];

export function medium(id: string): Medium {
  const gefunden = MEDIEN.find((m) => m.id === id);
  if (!gefunden) throw new Error(`Medium "${id}" fehlt in lib/medien.ts`);
  return gefunden;
}

/** Breiten, in denen ein Foto vorliegt: nie breiter als das Original. */
export function fotoBreiten(m: Medium): number[] {
  const breiten = FOTO_BREITEN.filter((breite) => breite <= m.breite);
  return breiten.length > 0 ? breiten : [m.breite];
}

/** Die Dateinamen, die zu einem Medium in public/medien liegen muessen. */
export function dateienVon(m: Medium): string[] {
  switch (m.art) {
    case "foto":
      return fotoBreiten(m).map((breite) => `${m.datei}-${breite}.webp`);
    case "maske":
      return [`${m.datei}-maske.png`];
    case "video":
      return [`${m.datei}.mp4`, `${m.datei}-standbild.webp`];
  }
}

export type BildQuelle = { src: string; srcSet: string };

/** src und srcSet eines Fotos; src ist die 1280er-Fassung als Rueckfall. */
export function bildQuelle(id: string): BildQuelle {
  const m = medium(id);
  if (m.art !== "foto") throw new Error(`Medium "${id}" ist kein Foto`);
  const breiten = fotoBreiten(m);
  const rueckfall = breiten.find((breite) => breite >= 1280) ?? breiten[breiten.length - 1];
  return {
    src: `/medien/${m.datei}-${rueckfall}.webp`,
    srcSet: breiten.map((breite) => `/medien/${m.datei}-${breite}.webp ${breite}w`).join(", "),
  };
}
```

- [ ] **Step 4: `scripts/medien/verarbeitung.ts` schreiben**

```ts
/**
 * Bildverarbeitung der Medien-Pipeline (Spec 6.3). Nur Entwicklungszeit:
 * wird nie aus app/, components/ oder lib/ importiert.
 */
import sharp from "sharp";

/** Graustufen-WebP in einer Breite, nie vergroessert. */
export async function zuGraustufenWebp(eingabe: Buffer, breite: number): Promise<Buffer> {
  return sharp(eingabe)
    .rotate()
    .resize({ width: breite, withoutEnlargement: true })
    .grayscale()
    .webp({ quality: 72 })
    .toBuffer();
}

/**
 * Wand-Textur als Alpha-Maske: Luminanz wird Deckkraft (Spec 4.5).
 * Dunkle Farbe auf hellem Grund wird deckend; mit `umkehren` helle Farbe
 * auf dunklem Grund. `normalise` spreizt den Tonwertumfang, damit auch
 * blasse Farbe eine kraeftige Maske ergibt. Die Farbe selbst bleibt
 * schwarz: eingefaerbt wird per CSS (`.wand-textur`).
 */
export async function zuMaskePng(eingabe: Buffer, breite: number, umkehren = false): Promise<Buffer> {
  const { data, info } = await sharp(eingabe)
    .rotate()
    .resize({ width: breite, withoutEnlargement: true })
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixel = info.width * info.height;
  const rgba = Buffer.alloc(pixel * 4);
  for (let i = 0; i < pixel; i++) {
    const helligkeit = data[i * info.channels];
    rgba[i * 4 + 3] = umkehren ? helligkeit : 255 - helligkeit;
  }

  return sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toBuffer();
}

export type PexelsVideoDatei = {
  quality: string | null;
  file_type: string;
  width: number | null;
  height: number | null;
  link: string;
};

/** Die breiteste SD-Datei bis 960 px; gibt es keine, die schmalste MP4. */
export function waehleSdVideo(dateien: readonly PexelsVideoDatei[]): PexelsVideoDatei | null {
  const mp4 = dateien.filter((d) => d.file_type === "video/mp4" && d.width !== null);
  const sd = mp4
    .filter((d) => d.quality === "sd" && (d.width ?? 0) <= 960)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  if (sd.length > 0) return sd[0];
  return [...mp4].sort((a, b) => (a.width ?? 0) - (b.width ?? 0))[0] ?? null;
}
```

- [ ] **Step 5: Tests laufen lassen, sie müssen bestehen**

Run: `npm test`
Expected: PASS. Der Verzeichnis-Test besteht trivial (leeres Verzeichnis, kein Ordner `public/medien`).

- [ ] **Step 6: Pexels-Zugriff schreiben**

`scripts/medien/pexels.ts`:

```ts
/**
 * Zugriff auf die Pexels-API, nur Entwicklungszeit (Spec 6.3).
 *
 * Jede Anfrage genau einmal: bei einem Fehler Abbruch mit Meldung, keine
 * Wiederholung (Memory netzwerk-schonen). Der Key kommt aus .env.local,
 * wird nie ausgegeben, nie gebuendelt und nie als Worker-Secret gesetzt.
 */

export function pexelsKey(): string {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Kein .env.local: der Key kann auch in der Umgebung stehen.
  }
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    console.error("PEXELS_API_KEY fehlt in .env.local.");
    process.exit(1);
  }
  return key;
}

export async function pexelsJson<T>(url: string, key: string): Promise<T> {
  const antwort = await fetch(url, { headers: { Authorization: key } });
  if (!antwort.ok) {
    console.error(`Pexels antwortet ${antwort.status} auf ${url}. Keine Wiederholung, Abbruch.`);
    process.exit(1);
  }
  return (await antwort.json()) as T;
}

export async function ladeDatei(url: string): Promise<Buffer> {
  const antwort = await fetch(url);
  if (!antwort.ok) {
    console.error(`Download ${antwort.status}: ${url}. Keine Wiederholung, Abbruch.`);
    process.exit(1);
  }
  return Buffer.from(await antwort.arrayBuffer());
}
```

- [ ] **Step 7: Suchskript schreiben**

`scripts/medien/suchen.ts`:

```ts
/**
 * Sucht Kandidaten auf Pexels (Spec 6.3, Schritt 1).
 *
 *   npx tsx scripts/medien/suchen.ts "cannabis leaf white background"
 *   npx tsx scripts/medien/suchen.ts "cannabis plants wind" --video
 *
 * Legt bis zu 15 Vorschauen (<id>.jpg) und kandidaten.json in
 * $MEDIEN_SCRATCH/<begriff>/ ab, Standard ist der Temp-Ordner. Eine Suche,
 * danach die Vorschauen nacheinander, keine Wiederholung.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ladeDatei, pexelsJson, pexelsKey } from "./pexels";

type Foto = {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  alt: string;
  src: { medium: string };
};

type Video = {
  id: number;
  width: number;
  height: number;
  url: string;
  duration: number;
  image: string;
  user: { name: string };
};

async function main() {
  const argumente = process.argv.slice(2);
  const video = argumente.includes("--video");
  const begriff = argumente.filter((a) => a !== "--video").join(" ").trim();
  if (!begriff) {
    console.error('Aufruf: npx tsx scripts/medien/suchen.ts "<suchbegriff>" [--video]');
    process.exit(1);
  }

  const key = pexelsKey();
  const name = (video ? "video-" : "") + begriff.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ziel = join(process.env.MEDIEN_SCRATCH ?? join(tmpdir(), "gruenes-buch-medien"), name);
  mkdirSync(ziel, { recursive: true });
  const anfrage = encodeURIComponent(begriff);
  const kandidaten: Record<string, unknown>[] = [];

  if (video) {
    const daten = await pexelsJson<{ videos: Video[] }>(
      `https://api.pexels.com/videos/search?query=${anfrage}&per_page=15&size=medium`,
      key,
    );
    for (const v of daten.videos) {
      writeFileSync(join(ziel, `${v.id}.jpg`), await ladeDatei(v.image));
      kandidaten.push({ id: v.id, urheber: v.user.name, quelle: v.url, breite: v.width, hoehe: v.height, dauer: v.duration });
    }
  } else {
    const daten = await pexelsJson<{ photos: Foto[] }>(
      `https://api.pexels.com/v1/search?query=${anfrage}&per_page=15`,
      key,
    );
    for (const f of daten.photos) {
      writeFileSync(join(ziel, `${f.id}.jpg`), await ladeDatei(f.src.medium));
      kandidaten.push({ id: f.id, urheber: f.photographer, quelle: f.url, breite: f.width, hoehe: f.height, alt: f.alt });
    }
  }

  writeFileSync(join(ziel, "kandidaten.json"), JSON.stringify(kandidaten, null, 2));
  console.log(`${kandidaten.length} Kandidaten in ${ziel}`);
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
```

- [ ] **Step 8: Aufbereitungsskript schreiben**

`scripts/medien/aufbereiten.ts`:

```ts
/**
 * Laedt die in lib/medien.ts gewaehlten Originale und legt die Dateien in
 * public/medien ab (Spec 6.3, Schritt 3). Vollstaendig vorhandene Medien
 * werden uebersprungen, der Lauf ist also wiederholbar ohne neue Downloads.
 *
 *   npx tsx scripts/medien/aufbereiten.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  MASKEN_BREITE,
  MEDIEN,
  STANDBILD_BREITE,
  dateienVon,
  fotoBreiten,
  type Medium,
} from "../../lib/medien";
import { ladeDatei, pexelsJson, pexelsKey } from "./pexels";
import { waehleSdVideo, zuGraustufenWebp, zuMaskePng, type PexelsVideoDatei } from "./verarbeitung";

const ZIEL = join(process.cwd(), "public", "medien");

/** Pexels liefert verkleinerte Fassungen ueber Parameter; 2400 px reichen fuer 1920. */
const ORIGINAL_PARAMETER = "?auto=compress&cs=tinysrgb&w=2400";

function schreibe(name: string, inhalt: Buffer) {
  writeFileSync(join(ZIEL, name), inhalt);
  console.log(`${name.padEnd(36)} ${Math.round(inhalt.length / 1024)} KB`);
}

async function bild(m: Medium, key: string) {
  const daten = await pexelsJson<{ src: { original: string } }>(
    `https://api.pexels.com/v1/photos/${m.pexelsId}`,
    key,
  );
  const original = await ladeDatei(daten.src.original + ORIGINAL_PARAMETER);
  if (m.art === "maske") {
    schreibe(`${m.datei}-maske.png`, await zuMaskePng(original, MASKEN_BREITE, m.maskeUmkehren));
    return;
  }
  for (const breite of fotoBreiten(m)) {
    schreibe(`${m.datei}-${breite}.webp`, await zuGraustufenWebp(original, breite));
  }
}

async function video(m: Medium, key: string) {
  const daten = await pexelsJson<{ image: string; video_files: PexelsVideoDatei[] }>(
    `https://api.pexels.com/videos/videos/${m.pexelsId}`,
    key,
  );
  const datei = waehleSdVideo(daten.video_files);
  if (!datei) throw new Error(`Video ${m.pexelsId}: keine MP4-Datei`);
  schreibe(`${m.datei}.mp4`, await ladeDatei(datei.link));
  schreibe(`${m.datei}-standbild.webp`, await zuGraustufenWebp(await ladeDatei(daten.image), STANDBILD_BREITE));
}

async function main() {
  mkdirSync(ZIEL, { recursive: true });
  const offen = MEDIEN.filter((m) => !dateienVon(m).every((d) => existsSync(join(ZIEL, d))));
  if (offen.length === 0) {
    console.log("Alle Medien vorhanden.");
    return;
  }
  const key = pexelsKey();
  for (const m of offen) {
    if (m.art === "video") await video(m, key);
    else await bild(m, key);
  }
}

main().catch((fehler) => {
  console.error(fehler);
  process.exit(1);
});
```

- [ ] **Step 9: Typecheck und Lint**

Run: `npm run typecheck && npx eslint .`
Expected: grün. Meldet TypeScript `Property 'loadEnvFile' does not exist`, ist `@types/node` zu alt für die Signatur: dann in `pexels.ts` die Zeile durch `(process as NodeJS.Process & { loadEnvFile(pfad: string): void }).loadEnvFile(".env.local");` ersetzen (Node 24 hat die Funktion, nur der Typ fehlt).

- [ ] **Step 10: Commit**

```bash
git add lib/medien.ts scripts/medien tests/medien.test.ts tests/medien-verarbeitung.test.ts
git commit -m "feat: Medien-Verzeichnis und Pexels-Pipeline (suchen, aufbereiten, Masken)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Mediensatz wählen, aufbereiten, Medien-Komponenten

**Skills:** `build-awwwards-quality-sites` (Asset-Regeln), `design-taste-frontend`, `frontend-design`

**Files:**
- Modify: `lib/medien.ts` (Einträge in `MEDIEN`)
- Create: `public/medien/*`, `components/medien/Bild.tsx`, `components/medien/Textur.tsx`, `components/medien/Loop.tsx`

**Interfaces:**
- Consumes: Pipeline aus Task 5
- Produces: Medien-IDs `leitobjekt`, `blatt`, `bluete`, `trichom` (Fotos), `drip`, `nebel`, `marmor` (Masken), `pflanze-loop` (Video); Komponenten `Bild({ id, sizes, className?, prioritaet?, dekorativ? })`, `Textur({ id, className?, story? })`, `Loop({ id, className? })`

- [ ] **Step 1: Kandidaten suchen (Netz: acht Suchen, je genau einmal)**

In **einem** Bash-Aufruf (Umgebungsvariablen gelten nicht über Aufrufe hinweg), mit `&&` verkettet, damit nach dem ersten Fehler nichts weiterläuft; `<scratchpad>` ist der Scratchpad-Ordner der Session:

```bash
export MEDIEN_SCRATCH="<scratchpad>/medien" && \
npx tsx scripts/medien/suchen.ts "leaf on open notebook" && \
npx tsx scripts/medien/suchen.ts "cannabis leaf white background" && \
npx tsx scripts/medien/suchen.ts "cannabis bud white background" && \
npx tsx scripts/medien/suchen.ts "trichomes macro" && \
npx tsx scripts/medien/suchen.ts "paint drip texture" && \
npx tsx scripts/medien/suchen.ts "spray paint texture white" && \
npx tsx scripts/medien/suchen.ts "marbling ink" && \
npx tsx scripts/medien/suchen.ts "cannabis plants wind" --video
```

Expected: je `N Kandidaten in …`. Scheitert eine Suche (Status ≠ 200, DNS): anhalten, dem Nutzer melden, nicht wiederholen. Die schon erfolgreichen Ordner bleiben liegen; weiter geht es erst nach Rückmeldung des Nutzers, und dann nur mit den fehlenden Begriffen.

- [ ] **Step 2: Auswählen**

Die Vorschauen mit dem Read-Tool ansehen (je Ordner die `.jpg`). Je Motiv genau einen Kandidaten wählen nach diesen Regeln, in dieser Reihenfolge:
1. Leitplanken: kein Konsum, keine Personen, kein Text oder Logo im Bild, keine fremden Graffiti-Tags, keine Blüte mit erkennbarem Produkt oder Etikett.
2. Heller, ruhiger Grund (Fotos): das Motiv muss mit `multiply` ins Papier übergehen. Ausnahme Trichom: dunkler Grund ist erlaubt, wenn es kein helles Makro gibt; dann im Hell-Modus prüfen (Step 6).
3. Masken: Farbe klar vom Grund getrennt, Form eindeutig (Drip: senkrechte Läufe; Nebel: weicher Sprühnebel; Marmor: Schlieren). Liegt die Farbe heller als der Grund, bekommt der Eintrag `maskeUmkehren: true`.
4. Leitobjekt: ein Buch oder Notizbuch mit einem Blatt darauf oder darin, hochformatig oder quadratisch; ohne Treffer in „leaf on open notebook“ das Notizbuch 479817 aus der Spec.
5. Bekannte Kandidaten aus der Spec (Abschnitt 4.5) haben Vorrang, wenn sie in den Suchen auftauchen und die Regeln erfüllen: Blatt 7668040, Trichom 30682041, Drip 11016984, Video 12361112.

- [ ] **Step 3: Einträge in `lib/medien.ts` schreiben**

`MEDIEN` mit acht Einträgen füllen; Werte (`pexelsId`, `breite`, `hoehe`, `urheber`, `quelle`) aus der jeweiligen `kandidaten.json`. Alt-Texte deutsch, sachlich, ohne Wertung. Form eines Eintrags:

```ts
export const MEDIEN: readonly Medium[] = [
  {
    id: "blatt",
    art: "foto",
    pexelsId: 7668040,
    datei: "blatt",
    breite: 4000, // aus kandidaten.json
    hoehe: 6000, // aus kandidaten.json
    alt: "Einzelnes Cannabisblatt vor hellem Grund",
    urheber: "Name aus kandidaten.json",
    quelle: "https://www.pexels.com/photo/…/", // aus kandidaten.json
  },
  // leitobjekt (foto), bluete (foto), trichom (foto),
  // drip (maske, alt ""), nebel (maske, alt ""), marmor (maske, alt ""),
  // pflanze-loop (video, alt "")
];
```

Alle acht IDs genau so: `leitobjekt`, `blatt`, `bluete`, `trichom`, `drip`, `nebel`, `marmor`, `pflanze-loop`; `datei` gleich der ID.

- [ ] **Step 4: Aufbereiten (Netz: je Medium eine API-Anfrage und ein Download)**

Run: `npx tsx scripts/medien/aufbereiten.ts`
Expected: pro Datei eine Zeile mit Größe. Richtwerte: WebP 640 unter 60 KB, 1280 unter 160 KB; Masken unter 150 KB; Video unter 3 MB. Liegt eine Maske darüber: `MASKEN_BREITE` bleibt, stattdessen einen ruhigeren Kandidaten wählen.

- [ ] **Step 5: Verzeichnis-Test**

Run: `npm test`
Expected: PASS, insbesondere „jede Datei in public/medien steht im Verzeichnis und umgekehrt“.

- [ ] **Step 6: Medien-Komponenten schreiben**

`components/medien/Bild.tsx`:

```tsx
/* eslint-disable @next/next/no-img-element -- Keine Next-Bildoptimierung: auf
   Workers braeuchte sie Cloudflare Images. Die Breiten entstehen stattdessen in
   scripts/medien/aufbereiten.ts (Spec 6.1). Einzige Stelle mit <img>. */
import { cn } from "@/lib/cn";
import { bildQuelle, medium } from "@/lib/medien";

type Props = {
  id: string;
  /** Wie breit das Bild im Layout wirklich ist, z. B. "(min-width: 768px) 45vw, 100vw". */
  sizes: string;
  className?: string;
  /** Nur fuer das LCP-Bild im Auftakt: sofort und mit hoher Prioritaet laden. */
  prioritaet?: boolean;
  /** Wiederholung desselben Motivs: leerer Alt-Text, damit nichts doppelt vorgelesen wird. */
  dekorativ?: boolean;
};

/** Graustufen-Foto aus der Pipeline, mit Hell/Dunkel-Behandlung (Spec 4.5). */
export function Bild({ id, sizes, className, prioritaet = false, dekorativ = false }: Props) {
  const m = medium(id);
  const { src, srcSet } = bildQuelle(id);
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      width={m.breite}
      height={m.hoehe}
      alt={dekorativ ? "" : m.alt}
      loading={prioritaet ? "eager" : "lazy"}
      fetchPriority={prioritaet ? "high" : "auto"}
      decoding="async"
      className={cn("medien-buch block h-auto w-full", className)}
    />
  );
}
```

`components/medien/Textur.tsx`:

```tsx
import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";
import { medium } from "@/lib/medien";

type Props = {
  id: string;
  className?: string;
  /** Ziel fuer die StoryBuehne (data-story), z. B. "tag-drip". */
  story?: string;
};

/** Wand-Textur: Alpha-Maske aus der Pipeline, eingefaerbt in spray. Rein dekorativ. */
export function Textur({ id, className, story }: Props) {
  const m = medium(id);
  if (m.art !== "maske") throw new Error(`Medium "${id}" ist keine Maske`);
  const maske = `url(/medien/${m.datei}-maske.png)`;
  const stil: CSSProperties = { maskImage: maske, WebkitMaskImage: maske };
  return (
    <span
      aria-hidden="true"
      data-story={story}
      className={cn("wand-textur pointer-events-none block", className)}
      style={stil}
    />
  );
}
```

`components/medien/Loop.tsx`:

```tsx
import { cn } from "@/lib/cn";
import { medium } from "@/lib/medien";

type Props = {
  id: string;
  className?: string;
};

/**
 * Stummes Video als Schleife (Spec 4.5). `preload="none"`: es laedt nichts,
 * bis die StoryBuehne es in der Naehe startet. Ohne JavaScript und bei
 * reduzierter Bewegung bleibt das Standbild stehen. Keine Hoehe in den
 * Klassen: Preflight setzt height:auto, Aufrufer duerfen h-full setzen.
 */
export function Loop({ id, className }: Props) {
  const m = medium(id);
  if (m.art !== "video") throw new Error(`Medium "${id}" ist kein Video`);
  return (
    <video
      aria-hidden="true"
      data-loop=""
      width={m.breite}
      height={m.hoehe}
      poster={`/medien/${m.datei}-standbild.webp`}
      muted
      loop
      playsInline
      preload="none"
      className={cn("medien-video block w-full object-cover", className)}
    >
      <source src={`/medien/${m.datei}.mp4`} type="video/mp4" />
    </video>
  );
}
```

- [ ] **Step 7: Typecheck, Lint, Tests**

Run: `npm run typecheck && npx eslint . && npm test`
Expected: grün; ESLint meldet `no-img-element` nirgends.

- [ ] **Step 8: Sichtprüfung der Dateien**

Die WebP-Dateien in 640 und die Masken mit dem Read-Tool ansehen: Motive entfärbt, Masken als klare Form (schwarz auf transparent). Stimmt eine Maske nicht (Form invertiert), `maskeUmkehren` am Eintrag umstellen, die Maskendatei löschen und Step 4 für dieses eine Medium erneut laufen lassen (einzige erlaubte Wiederholung, weil sie einen anderen Aufruf erzeugt).

- [ ] **Step 9: Commit**

```bash
git add lib/medien.ts public/medien components/medien
git commit -m "feat: Mediensatz von Pexels (Graustufen, Masken, Video) und Medien-Komponenten

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Marke, Kopf, Fuß

**Skills:** `frontend-design`, `design-taste-frontend`, `better-typography`, `better-accessibility`, `emil-design-eng`, `ui-design-engine`

**Files:**
- Create: `components/marke/SprayFilter.tsx`, `components/marke/Wortmarke.tsx`, `components/layout/Kopf.tsx`, `components/layout/Fuss.tsx`, `tests/texte.test.ts`
- Modify: `app/layout.tsx`, `app/globals.css` (`@layer components`)

**Interfaces:**
- Consumes: `Textur`, `MEDIEN` aus Task 6; Tokens aus Task 3
- Produces: `Wortmarke({ groesse: "kopf" | "buehne", className? })`; SVG-Filter `#spray-rau`, `#stanzkontur`; `data-story="tag"` (Aufkleber auf der Bühne), `data-story="schluss"`, Klasse `schlusszeile-fuellung`, `data-story="fuss-tag"`

- [ ] **Step 1: Failing test für die Satzzeichen-Regel schreiben**

`tests/texte.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Dateien mit neuen Seitentexten (Spec 3.2, Akzeptanz 2). */
const ORDNER = [
  "components/story",
  "components/story/bewegung",
  "components/layout",
  "components/marke",
  "components/medien",
];
/** app/page.tsx kommt in Task 9 dazu, wenn die alte Startseite ersetzt ist. */
const DATEIEN = ["app/layout.tsx"];

/** Geviertstrich überall, Gedankenstrich nur als Trenner zwischen Leerzeichen. */
const TRENNER = /—|\s–\s/;

function dateienIn(ordner: string): string[] {
  const pfad = join(process.cwd(), ordner);
  if (!existsSync(pfad)) return [];
  return readdirSync(pfad)
    .filter((datei) => /\.(ts|tsx)$/.test(datei))
    .map((datei) => `${ordner}/${datei}`);
}

test("neue Texte ohne Geviertstrich und ohne Gedankenstrich als Trenner", () => {
  const treffer: string[] = [];
  for (const datei of [...ORDNER.flatMap(dateienIn), ...DATEIEN]) {
    readFileSync(join(process.cwd(), datei), "utf8")
      .split("\n")
      .forEach((zeile, index) => {
        if (TRENNER.test(zeile)) treffer.push(`${datei}:${index + 1}: ${zeile.trim()}`);
      });
  }
  assert.deepEqual(treffer, []);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npm test`
Expected: FAIL mit `app/layout.tsx:…: default: "cn-medcan — Katalog …"`.

- [ ] **Step 3: SVG-Filter schreiben**

`components/marke/SprayFilter.tsx`:

```tsx
/**
 * SVG-Filter der Marke (Spec 4.3), einmal im Layout gerendert.
 *
 * spray-rau:   Kanten aufrauen (Turbulenz + Verschiebung) und einen weichen
 *              Overspray darunterlegen - aus der Schrift, ohne gezeichnete Pfade.
 * stanzkontur: Aufkleber-Kontur in surface-raised um die Form (Wizard Trees).
 */
export function SprayFilter() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
      <defs>
        <filter id="spray-rau" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} result="rauschen" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="rauschen"
            scale={3}
            xChannelSelector="R"
            yChannelSelector="G"
            result="rau"
          />
          <feGaussianBlur in="rau" stdDeviation={2.5} result="nebel" />
          <feComponentTransfer in="nebel" result="nebel-schwach">
            <feFuncA type="linear" slope={0.35} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="nebel-schwach" />
            <feMergeNode in="rau" />
          </feMerge>
        </filter>
        <filter id="stanzkontur" x="-25%" y="-25%" width="150%" height="150%">
          <feMorphology in="SourceAlpha" operator="dilate" radius={6} result="dick" />
          <feFlood style={{ floodColor: "var(--color-surface-raised)" }} result="flaeche" />
          <feComposite in="flaeche" in2="dick" operator="in" result="kontur" />
          <feMerge>
            <feMergeNode in="kontur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
```

- [ ] **Step 4: Wortmarke schreiben**

`components/marke/Wortmarke.tsx`:

```tsx
import { cn } from "@/lib/cn";

type Props = {
  groesse: "kopf" | "buehne";
  className?: string;
};

/**
 * Die Marke "Grünes Buch" (Spec 4.3).
 *
 * kopf:   Wortmarke in Cormorant 500 mit kleinem "gb"-Tag als Aufkleber
 *         darüber (Kopf und Fuß). Der Name ist Text, das Tag aria-hidden.
 * buehne: nur der Aufkleber (Tag, darunter gesperrte Versalien) am
 *         Auftakt-Titel. Dort trägt die Überschrift den Namen, deshalb ist
 *         der ganze Aufkleber aria-hidden.
 */
export function Wortmarke({ groesse, className }: Props) {
  if (groesse === "buehne") {
    return (
      <span aria-hidden="true" data-story="tag" className={cn("gb-aufkleber inline-flex", className)}>
        {/* gap-1 = 4px: Tag und Versalienzeile sind ein Zeichen, 8px risse es auseinander. */}
        <span className="gb-kontur inline-flex -rotate-6 flex-col items-center gap-1 px-2">
          <span className="gb-tag font-wand text-tag">gb</span>
          <span className="font-sans text-caption uppercase tracking-gesperrt text-text">
            Grünes Buch
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className={cn("relative inline-flex items-end pt-4 pl-4", className)}>
      <span className="relative font-buch text-wortmarke text-text">Grünes Buch</span>
      <span aria-hidden="true" className="gb-aufkleber absolute top-0 left-0 z-10">
        <span className="gb-kontur inline-flex -rotate-12">
          <span className="gb-tag font-wand text-h2 font-normal">gb</span>
        </span>
      </span>
    </span>
  );
}
```

- [ ] **Step 5: CSS für Aufkleber, Schlusszeile und Fuß-Tag**

In `app/globals.css` innerhalb von `@layer components { … }` ergänzen:

```css
  /* Aufkleber "gb" (Spec 4.3). Filter aus components/marke/SprayFilter. */
  .gb-aufkleber {
    position: relative;
  }

  .gb-kontur {
    filter: url(#stanzkontur);
  }

  /* Die Farbe steht hier und nicht als Utility, damit der Hover sie
     ueberschreiben kann (Utilities schlagen die Komponenten-Schicht). */
  .gb-tag {
    display: inline-block;
    color: var(--color-spray);
    filter: url(#spray-rau);
    background-image: linear-gradient(
      115deg,
      var(--color-spray) 30%,
      var(--color-blatt-400) 44%,
      var(--color-neutral-0) 52%,
      var(--color-spray-400) 60%,
      var(--color-spray) 74%
    );
    background-size: 300% 100%;
    background-position: 100% 0;
    -webkit-background-clip: text;
    background-clip: text;
    transition:
      color var(--duration-slow) var(--ease-out),
      background-position 700ms var(--ease-out);
  }

  /* Holo-Schimmer nur auf dem Aufkleber, nur bei Hover und erlaubter Bewegung. */
  @media (hover: hover) and (prefers-reduced-motion: no-preference) {
    a:hover .gb-tag,
    .gb-aufkleber:hover .gb-tag {
      color: transparent;
      background-position: 0 0;
    }
  }

  /* Schlusszeile: Kontur unten, gefuellte Zeile darueber im selben Feld. */
  .schlusszeile {
    display: grid;
  }

  .schlusszeile > span {
    grid-area: 1 / 1;
  }

  .schlusszeile-kontur {
    color: transparent;
    -webkit-text-stroke: 1px var(--color-text);
  }

  /* Grosses Tag, das unten und links aus dem Fuss laeuft (Doja Pak). */
  .fuss-tag {
    font-size: clamp(10rem, 42vw, 38rem);
    line-height: 0.8;
    margin-bottom: -0.28em;
    margin-left: -0.04em;
    color: var(--color-spray);
    transform: rotate(-6deg);
    filter: url(#spray-rau);
    pointer-events: none;
  }
```

- [ ] **Step 6: Kopf schreiben**

`components/layout/Kopf.tsx`:

```tsx
import Link from "next/link";

import { Wortmarke } from "@/components/marke/Wortmarke";

/**
 * Nummerierte Hauptnavigation (Spec 4.3, Wizard Trees). Die Nummern sind
 * Dekoration und aria-hidden; Kapitelköpfe der Startseite bleiben ohne
 * Nummern (Spec 5.1).
 *
 * Bewusst ein fester Link "Mein Konto" statt "Anmelden"/"Mein Konto" je nach
 * Sitzung: das Layout müsste dafür die Sitzung lesen und wäre auf jeder
 * Seite dynamisch. /mitglied leitet ohne Anmeldung selbst auf /anmelden weiter.
 */
const NAVIGATION = [
  { href: "/produkte", text: "Produkte" },
  { href: "/apotheken", text: "Apotheken" },
  { href: "/mitglied", text: "Mein Konto" },
] as const;

const NAV_LINK =
  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-small font-medium text-text " +
  "transition-colors duration-fast ease-standard hover:bg-surface-sunken";

export function Kopf() {
  return (
    <header className="relative z-10 border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-360 flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8">
        <Link href="/" className="inline-flex min-h-11 items-center px-2">
          <Wortmarke groesse="kopf" />
        </Link>

        <nav aria-label="Hauptnavigation">
          <ul className="flex flex-wrap items-center gap-2">
            {NAVIGATION.map((eintrag, index) => (
              <li key={eintrag.href}>
                <Link href={eintrag.href} className={NAV_LINK}>
                  <span aria-hidden="true" className="numeric text-caption text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {eintrag.text}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Fuß schreiben**

`components/layout/Fuss.tsx`:

```tsx
import Link from "next/link";

import { Wortmarke } from "@/components/marke/Wortmarke";
import { MEDIEN, type MedienArt } from "@/lib/medien";

const LINKS = [
  { href: "/reviews", text: "Einträge" },
  { href: "/umfragen", text: "Abstimmungen" },
  { href: "/produkte", text: "Produkte" },
  { href: "/apotheken", text: "Apotheken" },
] as const;

const ART_LABEL: Record<MedienArt, string> = { foto: "Foto", maske: "Textur", video: "Video" };

const TEXTLINK =
  "inline-flex min-h-11 items-center text-small text-accent underline underline-offset-4 " +
  "transition-colors duration-fast ease-standard hover:text-accent-hover";

/**
 * Fuß auf allen Seiten (Spec 5.1, Sektion 9). Die Schlusszeile steht
 * doppelt im selben Rasterfeld: unten als Kontur (aria-hidden), darüber
 * gefüllt. Auf der Startseite blendet die StoryBuehne die gefüllten Wörter
 * scroll-gekoppelt ein; ohne Bewegung ist die Zeile einfach gefüllt.
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

      <span aria-hidden="true" data-story="fuss-tag" className="fuss-tag block select-none font-wand">
        gb
      </span>

      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 px-4 pb-16 sm:grid-cols-[2fr_1fr] sm:px-8">
        <div className="flex flex-col items-start gap-6">
          <Wortmarke groesse="kopf" />
          <p className="max-w-[68ch] text-caption text-text-muted">
            Alle gelisteten Arzneimittel sind verschreibungspflichtig. Die Angaben dienen der
            Information und ersetzen keine medizinische oder pharmazeutische Beratung. Eine Abgabe
            von Arzneimitteln erfolgt über diese Seite nicht.
          </p>
        </div>

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
    </footer>
  );
}
```

- [ ] **Step 8: Layout umstellen**

`app/layout.tsx`: Import `Link` entfernen, `NAV_LINK` entfernen, neue Imports ergänzen, `metadata` und den `body` ersetzen:

```tsx
import { Fuss } from "@/components/layout/Fuss";
import { Kopf } from "@/components/layout/Kopf";
import { SprayFilter } from "@/components/marke/SprayFilter";
```

```tsx
export const metadata: Metadata = {
  title: {
    default: "Grünes Buch",
    template: "%s · Grünes Buch",
  },
  description:
    "Bewertungen verschreibungspflichtiger Cannabisarzneimittel nach festem Schema, jeweils an eine Charge gebunden. Die Community stimmt ab, welche Sorte als Nächstes bewertet wird.",
  robots: { index: false, follow: false },
};
```

```tsx
      <body className="min-h-full flex flex-col">
        <SprayFilter />
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:h-11 focus:items-center focus:rounded-full focus:bg-accent focus:px-4 focus:text-small focus:font-medium focus:text-accent-fg"
        >
          Direkt zum Inhalt
        </a>

        <Kopf />

        <main id="inhalt" className="flex-1">
          {children}
        </main>

        <Fuss />
      </body>
```

- [ ] **Step 9: Tests, Typecheck, Lint**

Run: `npm test && npm run typecheck && npx eslint .`
Expected: grün, auch `tests/texte.test.ts`.

- [ ] **Step 10: Sichtprüfung**

Im Browser `/produkte` (Startseite folgt in Task 9): Kopf mit Wortmarke und schrägem „gb“-Aufkleber mit heller Kontur, nummerierte Navigation; Hover auf die Wortmarke lässt das Tag schimmern; Fuß mit Schlusszeile, angeschnittenem großem Tag, Bildnachweisen. Dunkel per `document.documentElement.dataset.theme = "dark"` prüfen. Tastatur: Skip-Link, Wortmarke, drei Navigationspunkte, Fußlinks, „Bildnachweise“ in logischer Reihenfolge, Fokus sichtbar.

- [ ] **Step 11: Commit**

```bash
git add components/marke components/layout app/layout.tsx app/globals.css tests/texte.test.ts
git commit -m "feat: Wortmarke mit gb-Aufkleber, Kopf mit nummerierter Navigation, neuer Fuss

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Daten für die Startseite

**Skills:** `prisma-client-api` (Raw Queries), `edge-stack-master`, `cloudflare-d1`, `superpowers:test-driven-development`

**Files:**
- Create: `lib/query/community.ts`, `lib/netz.ts`, `components/umfrage/stimmzustand.ts`
- Create: `tests/community.test.ts`, `tests/netz.test.ts`, `tests/stimmzustand.test.ts`
- Modify: `lib/query/umfragen.ts` (neue Funktion am Ende des Abschnitts „Uebersicht“), `lib/query/reviews.ts`

**Interfaces:**
- Produces (`lib/query/community.ts`): `type CommunityZahlen = { stimmen: number; vorschlaege: number; runden: number }`, `zuCommunityZahlen(zeilen): CommunityZahlen`, `hatCommunityZahlen(z): boolean`, `wandTags(z: CommunityZahlen | null): string[]`, `LEITSAETZE`
- Produces (`lib/query/umfragen.ts`): `communityZahlen(): Promise<CommunityZahlen>`
- Produces (`lib/query/reviews.ts`): `RedaktionelleReview.geschmacksMatrix: GeschmacksMatrix`; `neuesteRedaktionelleReview` pro Request dedupliziert (`React.cache`)
- Produces (`lib/netz.ts`): `type NetzPunkt = { x: number; y: number }`, `netzPunkte(werte, max, radius, mitte): NetzPunkt[]`, `alsPolygon(punkte): string`, `istLeereMatrix(werte): boolean`
- Produces (`components/umfrage/stimmzustand.ts`): `stimmZustand(mitglied: { freigegeben: boolean } | null, eigeneOptionId: string | null): StimmZustand`

- [ ] **Step 1: Failing tests schreiben**

`tests/community.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { LEITSAETZE, hatCommunityZahlen, wandTags, zuCommunityZahlen } from "@/lib/query/community";

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

test("leere Datenbank: statt Nullen die drei Leitsätze", () => {
  const leer = { stimmen: 0, vorschlaege: 0, runden: 0 };
  assert.equal(hatCommunityZahlen(leer), false);
  assert.deepEqual(wandTags(leer), [...LEITSAETZE]);
  assert.deepEqual(wandTags(null), [...LEITSAETZE]);
});

test("echte Zahlen mit deutscher Schreibweise und Singular", () => {
  assert.deepEqual(wandTags({ stimmen: 1284, vorschlaege: 1, runden: 9 }), [
    "1.284 Stimmen",
    "1 Vorschlag",
    "9 Runden",
  ]);
});
```

`tests/netz.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { alsPolygon, istLeereMatrix, netzPunkte } from "@/lib/netz";

test("vier volle Achsen liegen oben, rechts, unten, links", () => {
  assert.deepEqual(netzPunkte([5, 5, 5, 5], 5, 10, 10), [
    { x: 10, y: 0 },
    { x: 20, y: 10 },
    { x: 10, y: 20 },
    { x: 0, y: 10 },
  ]);
});

test("Werte werden auf 0 bis max begrenzt", () => {
  assert.deepEqual(netzPunkte([0, 9, -3, 2.5], 5, 10, 10), [
    { x: 10, y: 10 },
    { x: 20, y: 10 },
    { x: 10, y: 10 },
    { x: 5, y: 10 },
  ]);
});

test("Polygon-Schreibweise für SVG", () => {
  assert.equal(alsPolygon([{ x: 1, y: 2 }, { x: 3.5, y: 4 }]), "1,2 3.5,4");
});

test("eine Matrix aus Nullen gilt als leer", () => {
  assert.equal(istLeereMatrix([0, 0, 0, 0, 0, 0, 0, 0]), true);
  assert.equal(istLeereMatrix([0, 0, 0.5, 0, 0, 0, 0, 0]), false);
});
```

`tests/stimmzustand.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { stimmZustand } from "@/components/umfrage/stimmzustand";

test("ohne Anmeldung: ANONYM", () => {
  assert.deepEqual(stimmZustand(null, null), { art: "ANONYM" });
});

test("angemeldet, nicht freigegeben: FREIGABE_OFFEN, auch wenn eine Stimme übergeben wird", () => {
  assert.deepEqual(stimmZustand({ freigegeben: false }, "opt-1"), { art: "FREIGABE_OFFEN" });
});

test("freigegeben ohne Stimme: STIMMBERECHTIGT", () => {
  assert.deepEqual(stimmZustand({ freigegeben: true }, null), { art: "STIMMBERECHTIGT" });
});

test("freigegeben mit Stimme: ABGESTIMMT mit der Option", () => {
  assert.deepEqual(stimmZustand({ freigegeben: true }, "opt-1"), { art: "ABGESTIMMT", optionId: "opt-1" });
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npm test`
Expected: FAIL, drei fehlende Module.

- [ ] **Step 3: `lib/query/community.ts` schreiben**

```ts
/**
 * Community-Zahlen fuer die Wand der Startseite (Spec 5.3), ohne
 * Datenbankzugriff und ohne "server-only": die reine Zuordnung ist so
 * testbar. Die Abfrage selbst steht in lib/query/umfragen.ts.
 *
 * Bewusst nur Zaehler: Vorschlaege tragen Handelsnamen und unmoderierten
 * Freitext, beides gehoert nicht als Graffiti auf die Startseite (Spec 2).
 */

export type CommunityZahlen = {
  stimmen: number;
  vorschlaege: number;
  runden: number;
};

type Zeile = Partial<Record<keyof CommunityZahlen, unknown>>;

/** Die Leitsaetze der Wand, wenn es noch nichts zu zaehlen gibt (Spec 5.2). */
export const LEITSAETZE = ["Schlag vor.", "Stimm ab.", "Lies mit."] as const;

const ZAHL = new Intl.NumberFormat("de-DE");

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

/** Die Tags der Wand: echte Zahlen, oder die Leitsaetze, wenn alles 0 ist oder die Abfrage fehlschlug. */
export function wandTags(zahlen: CommunityZahlen | null): string[] {
  if (!zahlen || !hatCommunityZahlen(zahlen)) return [...LEITSAETZE];
  return [
    `${ZAHL.format(zahlen.stimmen)} ${zahlen.stimmen === 1 ? "Stimme" : "Stimmen"}`,
    `${ZAHL.format(zahlen.vorschlaege)} ${zahlen.vorschlaege === 1 ? "Vorschlag" : "Vorschläge"}`,
    `${ZAHL.format(zahlen.runden)} ${zahlen.runden === 1 ? "Runde" : "Runden"}`,
  ];
}
```

- [ ] **Step 4: `lib/netz.ts` schreiben**

```ts
/**
 * Geometrie des Netzdiagramms (Geschmacksmatrix im neuesten Eintrag).
 * Reine Funktionen, damit die Darstellung testbar bleibt.
 */

export type NetzPunkt = { x: number; y: number };

/** Eine Nachkommastelle reicht fuer SVG; "+ 0" macht aus -0 eine 0. */
function runde(zahl: number): number {
  return Math.round(zahl * 10) / 10 + 0;
}

/**
 * Punkte je Achse: die erste Achse zeigt nach oben, die weiteren folgen im
 * Uhrzeigersinn. Werte werden auf 0 bis max begrenzt.
 */
export function netzPunkte(
  werte: readonly number[],
  max: number,
  radius: number,
  mitte: number,
): NetzPunkt[] {
  const anzahl = werte.length;
  return werte.map((wert, index) => {
    const anteil = max > 0 ? Math.min(Math.max(wert / max, 0), 1) : 0;
    const winkel = ((-90 + (360 / anzahl) * index) * Math.PI) / 180;
    return {
      x: runde(mitte + Math.cos(winkel) * radius * anteil),
      y: runde(mitte + Math.sin(winkel) * radius * anteil),
    };
  });
}

export function alsPolygon(punkte: readonly NetzPunkt[]): string {
  return punkte.map((p) => `${p.x},${p.y}`).join(" ");
}

/** parseGeschmacksMatrix faellt bei kaputten Daten auf Nullen zurueck: dann kein Netz. */
export function istLeereMatrix(werte: readonly number[]): boolean {
  return werte.every((wert) => wert <= 0);
}
```

- [ ] **Step 5: `components/umfrage/stimmzustand.ts` schreiben**

```ts
import type { StimmZustand } from "@/components/umfrage/UmfrageKarte";

/**
 * Der Stimmzustand des Betrachters aus bereits geladenen Daten - dieselbe
 * Entscheidung wie bisher in app/page.tsx, nur testbar. Die eigene Stimme
 * wird nur fuer freigegebene Mitglieder gelesen und ist deshalb optional.
 * Ueber das Schreiben entscheidet weiterhin allein die Server Action.
 */
export function stimmZustand(
  mitglied: { freigegeben: boolean } | null,
  eigeneOptionId: string | null,
): StimmZustand {
  if (!mitglied) return { art: "ANONYM" };
  if (!mitglied.freigegeben) return { art: "FREIGABE_OFFEN" };
  return eigeneOptionId ? { art: "ABGESTIMMT", optionId: eigeneOptionId } : { art: "STIMMBERECHTIGT" };
}
```

- [ ] **Step 6: Tests laufen lassen, sie müssen bestehen**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: `communityZahlen()` ergänzen**

In `lib/query/umfragen.ts` den Import ergänzen:

```ts
import { zuCommunityZahlen, type CommunityZahlen } from "@/lib/query/community";
```

und nach `umfragenUebersicht` einfügen:

```ts
/**
 * Drei Zaehler fuer die Wand der Startseite (Spec 5.3).
 *
 * Eine Abfrage mit drei Unterabfragen statt drei `count()`: jede Query ist
 * ein Sub-Request. Tabellennamen wie in den @@map-Angaben des Schemas.
 * Bewusst ohne Namen und Freitexte (Spec 2, §10 HWG).
 */
export async function communityZahlen(): Promise<CommunityZahlen> {
  const prisma = await getPrisma();
  const zeilen = await prisma.$queryRaw<{ stimmen: unknown; vorschlaege: unknown; runden: unknown }[]>`
    SELECT
      (SELECT COUNT(*) FROM stimmen) AS stimmen,
      (SELECT COUNT(*) FROM umfrage_vorschlaege) AS vorschlaege,
      (SELECT COUNT(*) FROM umfragen WHERE phase = 'BEENDET') AS runden
  `;
  return zuCommunityZahlen(zeilen);
}
```

- [ ] **Step 8: Review um die Geschmacksmatrix erweitern und deduplizieren**

In `lib/query/reviews.ts`:

```ts
import { cache } from "react";

import { parseGeschmacksMatrix, type GeschmacksMatrix } from "@/lib/query/bewertung";
```

`RedaktionelleReview` um `geschmacksMatrix: GeschmacksMatrix;` ergänzen (nach `konsistenz`), in `AUSWAHL` `geschmacksMatrix: true,` ergänzen und den Kommentar darüber ersetzen durch:

```ts
/** Gezieltes `select`. Die Geschmacksmatrix braucht die Doppelseite der Startseite (Netzdiagramm). */
```

`Satz` um `geschmacksMatrix: string;` ergänzen, in `zuAnsicht` `geschmacksMatrix: parseGeschmacksMatrix(satz.geschmacksMatrix),` ergänzen. `neuesteRedaktionelleReview` ersetzen durch:

```ts
/**
 * Die neueste freigegebene Bewertung des Betreibers, oder null.
 *
 * `freigegeben` steht hier nicht zur Debatte: eine unfreigegebene Bewertung
 * ist ein Entwurf und gehoert nicht auf die Startseite. `cache`: die
 * Startseite fragt sie zweimal (Kopfzeile und Doppelseite), die Datenbank
 * sieht pro Request eine Abfrage.
 */
export const neuesteRedaktionelleReview = cache(async (): Promise<RedaktionelleReview | null> => {
  const prisma = await getPrisma();
  const satz = await prisma.review.findFirst({
    where: { istRedaktionell: true, freigegeben: true },
    orderBy: { erstelltAm: "desc" },
    select: AUSWAHL,
  });
  return satz ? zuAnsicht(satz as Satz) : null;
});
```

- [ ] **Step 9: Typecheck, Lint, Tests**

Run: `npm run typecheck && npx eslint . && npm test`
Expected: grün. Meldet der Typecheck eine Stelle, die `RedaktionelleReview` von Hand baut, dort `geschmacksMatrix: leereGeschmacksMatrix()` ergänzen.

- [ ] **Step 10: Abfrage lokal gegen D1 prüfen**

Das SQL direkt gegen die lokale D1 prüfen (Datei unter `.wrangler/`, kein Netz; Telemetrie aus):

```bash
WRANGLER_SEND_METRICS=false npx wrangler d1 execute cn-medcan-db --local --command "SELECT (SELECT COUNT(*) FROM stimmen) AS stimmen, (SELECT COUNT(*) FROM umfrage_vorschlaege) AS vorschlaege, (SELECT COUNT(*) FROM umfragen WHERE phase = 'BEENDET') AS runden"
```

Expected: eine Zeile mit drei Zahlen. Die Einbindung über Prisma prüft Task 10 im Browser.

- [ ] **Step 11: Commit**

```bash
git add lib/query/community.ts lib/query/umfragen.ts lib/query/reviews.ts lib/netz.ts components/umfrage/stimmzustand.ts tests/community.test.ts tests/netz.test.ts tests/stimmzustand.test.ts
git commit -m "feat: communityZahlen, Geschmacksmatrix im neuesten Eintrag, Netz-Geometrie, Stimmzustand testbar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Startseite: Gerüst, Feldbuch-Raster, Auftakt

**Skills:** `build-awwwards-quality-sites`, `design-taste-frontend`, `frontend-design`, `better-layout`, `better-typography`, `cloudflare:web-perf` (LCP), `ui-design-engine`

**Files:**
- Create: `components/story/Skelette.tsx`, `components/story/FeldbuchRaster.tsx`, `components/story/Auftakt.tsx`
- Modify: `app/page.tsx` (vollständig neu), `tests/texte.test.ts` (`app/page.tsx` aufnehmen)

**Interfaces:**
- Consumes: `Bild`, `Textur`, `bildQuelle` (Task 6), `Wortmarke` (Task 7), `buttonKlassen` (Task 4)
- Produces: `WandSkelett`, `DoppelseitenSkelett`, `StimmzettelSkelett`, `KatalogSkelett` (alle mit `data-skelett`); `FeldbuchRaster`; `Auftakt` mit `data-story="auftakt" | "unterzeile" | "titel" | "intro" | "tag-drip"` und `data-story-einstieg`

- [ ] **Step 1: Skelette schreiben**

`components/story/Skelette.tsx`:

```tsx
/**
 * Skelette der Datensektionen (Spec 5.2): sie zeigen die Form, die gleich
 * kommt, statt eines Spinners. `data-skelett` braucht die StoryBuehne: die
 * Scroll-Abläufe starten erst, wenn kein Skelett mehr steht, sonst messen
 * sie eine Seite, die sich noch verschiebt.
 */
const FLAECHE = "block bg-surface-raised motion-safe:animate-pulse";

function Ansage({ text }: { text: string }) {
  return <span className="sr-only">{text}</span>;
}

export function WandSkelett() {
  return (
    <div role="status" data-skelett="" className="flex flex-wrap gap-8">
      <Ansage text="Zahlen werden geladen" />
      <span aria-hidden="true" className={`${FLAECHE} h-20 w-64`} />
      <span aria-hidden="true" className={`${FLAECHE} h-20 w-56 -rotate-2`} />
      <span aria-hidden="true" className={`${FLAECHE} h-20 w-48 rotate-1`} />
    </div>
  );
}

export function DoppelseitenSkelett() {
  return (
    <div role="status" data-skelett="" className="grid grid-cols-1 border border-border lg:grid-cols-2">
      <Ansage text="Eintrag wird geladen" />
      <div aria-hidden="true" className="flex flex-col gap-6 p-6 sm:p-12">
        <span className={`${FLAECHE} h-4 w-40`} />
        <span className={`${FLAECHE} h-16 w-3/4`} />
        <span className={`${FLAECHE} h-40 w-full`} />
      </div>
      <div aria-hidden="true" className="p-6 sm:p-12">
        <span className={`${FLAECHE} aspect-square w-full max-w-sm`} />
      </div>
    </div>
  );
}

export function StimmzettelSkelett() {
  return (
    <div role="status" data-skelett="">
      <Ansage text="Abstimmung wird geladen" />
      <span aria-hidden="true" className={`${FLAECHE} h-96 w-full`} />
    </div>
  );
}

export function KatalogSkelett() {
  return (
    <div role="status" data-skelett="" className="flex gap-4 overflow-hidden">
      <Ansage text="Produkte werden geladen" />
      {[0, 1, 2].map((stelle) => (
        <span key={stelle} aria-hidden="true" className={`${FLAECHE} h-96 w-72 shrink-0`} />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Feldbuch-Raster schreiben**

`components/story/FeldbuchRaster.tsx`:

```tsx
/**
 * Feines Spaltenraster und blasse Randnotizen hinter der Startseite
 * (Spec 4.7). Trägt keine Information, deshalb vollständig aria-hidden.
 * Die Notizen stehen in Cormorant kursiv wie Bleistift im Feldbuch, nicht
 * in Sedgwick: sie sind die Stimme des Buchs, nicht der Wand.
 */
const RANDNOTIZEN = [
  { text: "Ch. 24-117", links: "6%", oben: "14%", drehung: "-rotate-3" },
  { text: "RF 11 %", links: "82%", oben: "31%", drehung: "rotate-2" },
  { text: "Trichome dicht", links: "4%", oben: "47%", drehung: "-rotate-2" },
  { text: "Glas geöffnet 9:40", links: "74%", oben: "63%", drehung: "rotate-3" },
  { text: "Ch. 25-032", links: "10%", oben: "81%", drehung: "-rotate-1" },
] as const;

export function FeldbuchRaster() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="feldbuch-raster fixed inset-0" />
      {RANDNOTIZEN.map((notiz) => (
        <span
          key={notiz.text}
          className={`absolute hidden font-buch text-h3 font-light italic text-text-muted opacity-40 lg:block ${notiz.drehung}`}
          style={{ left: notiz.links, top: notiz.oben }}
        >
          {notiz.text}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Auftakt schreiben**

`components/story/Auftakt.tsx`:

```tsx
import Link from "next/link";
import { preload } from "react-dom";

import { Bild } from "@/components/medien/Bild";
import { Textur } from "@/components/medien/Textur";
import { Wortmarke } from "@/components/marke/Wortmarke";
import { buttonKlassen } from "@/components/ui";
import { bildQuelle } from "@/lib/medien";

/** Tatsächliche Breite des Leitobjekts: bestimmt, welche Datei geladen wird. */
const LEIT_SIZES = "(min-width: 768px) 42vw, 64vw";

/**
 * Sektion 1 (Spec 5.1): randfüllender Titel, das Leitobjekt liegt über den
 * Buchstaben (multiply), das "gb"-Tag sitzt schräg am Titel.
 *
 * `data-story-einstieg` markiert, was die StoryBuehne einblendet. Ohne
 * JavaScript und bei reduzierter Bewegung ist alles sofort sichtbar
 * (globals.css). Der Button "Wähl mit" trägt die Markierung bewusst nicht:
 * er ist ab dem ersten Frame bedienbar.
 */
export function Auftakt() {
  const leitobjekt = bildQuelle("leitobjekt");
  // LCP-Bild: vor allen anderen Ressourcen anfordern (Spec 6.4).
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
          data-story="unterzeile"
          data-story-einstieg=""
          className="font-buch text-h2 font-medium italic text-text-muted sm:text-h1"
        >
          Cannabis, offen gelegt.
        </p>

        <div className="relative mt-4">
          <h1
            id="auftakt-titel"
            data-story="titel"
            data-story-einstieg=""
            className="relative z-0 font-buch text-auftakt uppercase text-accent"
          >
            {/* Das Leerzeichen hält den zugänglichen Namen "Grünes Buch" zusammen. */}
            <span className="block">Grünes</span>{" "}
            <span className="block">Buch</span>
          </h1>

          <div className="pointer-events-none absolute top-1/2 right-0 z-10 w-[64vw] -translate-y-1/2 md:right-[4vw] md:w-[42vw]">
            <Bild id="leitobjekt" sizes={LEIT_SIZES} prioritaet />
          </div>

          <div
            data-story-einstieg=""
            className="absolute top-0 left-[40vw] z-20 flex -translate-y-1/3 flex-col items-center md:left-[46vw]"
          >
            <Wortmarke groesse="buehne" />
            <Textur id="drip" story="tag-drip" className="h-24 w-8" />
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

- [ ] **Step 4: Startseite neu aufsetzen**

`app/page.tsx` vollständig ersetzen:

```tsx
import { Auftakt } from "@/components/story/Auftakt";
import { FeldbuchRaster } from "@/components/story/FeldbuchRaster";

/**
 * Die Startseite als Scroll-Story (Spec 5.1). Sektion 9 ist der Fuß im
 * Layout. Jede Datensektion hat ihre eigene Suspense-Grenze; Bewegung kommt
 * allein aus der StoryBuehne am Ende.
 *
 * force-dynamic: die Seite ist nutzerbezogen (eigene Stimme, Preise nur mit
 * Freigabe) und darf nie als Ganzes gecacht werden.
 */
export const dynamic = "force-dynamic";

export default function StartPage() {
  return (
    <div className="relative isolate">
      <FeldbuchRaster />
      <Auftakt />
    </div>
  );
}
```

- [ ] **Step 5: Satzzeichen-Test auf die Startseite ausweiten**

In `tests/texte.test.ts`:

```ts
const DATEIEN = ["app/page.tsx", "app/layout.tsx"];
```

(den Kommentar darüber löschen).

- [ ] **Step 6: Tests, Typecheck, Lint**

Run: `npm test && npm run typecheck && npx eslint .`
Expected: grün.

- [ ] **Step 7: Sichtprüfung und Titel einpassen**

Im Browser `http://localhost:3000/` bei voller Fensterbreite. Im Tab messen:

```js
const h = document.querySelector("#auftakt-titel");
const zeilen = [...h.children].map((s) => Math.round(s.getBoundingClientRect().width));
({ zeilen, container: Math.round(h.getBoundingClientRect().width), ueberlauf: document.documentElement.scrollWidth > document.documentElement.clientWidth });
```

Ziel: die breitere Zeile („GRÜNES“) füllt 92 bis 100 % des Containers, `ueberlauf: false`. Sonst nur den `vw`-Wert in `--text-auftakt` (`app/globals.css`) anpassen, bis es stimmt. Dasselbe für 390 px Breite in einem gleich-originigen iframe:

```js
const f = document.createElement("iframe");
f.src = "/";
f.style.cssText = "position:fixed;inset:0 auto auto 0;width:390px;height:844px;z-index:2147483647;background:#fff";
document.body.append(f);
```

nach dem Laden im iframe dieselbe Messung über `f.contentDocument`. Danach das iframe entfernen (`f.remove()`).

Außerdem prüfen: Leitobjekt liegt über den Buchstaben und verschmilzt mit dem Papier; Tag mit Kontur und Drip; Button „Wähl mit“ sofort sichtbar; im Dunkelmodus (`data-theme="dark"`) wird das Leitobjekt hell auf dunkel.

- [ ] **Step 8: Commit**

```bash
git add components/story/Skelette.tsx components/story/FeldbuchRaster.tsx components/story/Auftakt.tsx app/page.tsx app/globals.css tests/texte.test.ts
git commit -m "feat: Startseite Auftakt mit randfuellendem Titel, Leitobjekt, gb-Tag und Feldbuch-Raster

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Sektionen 2 und 3: Transparent machen, Wissen bündeln

**Skills:** `build-awwwards-quality-sites`, `design-taste-frontend`, `better-layout`, `better-typography`, `react-best-practices` (Suspense, Deduplizierung), `ui-design-engine`

**Files:**
- Create: `components/story/TransparentMachen.tsx`, `components/story/WissenBuendeln.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `neuesteRedaktionelleReview` (dedupliziert), `communityZahlen`, `wandTags` (Task 8), `Bild`, `Textur` (Task 6), `WandSkelett` (Task 9), `BEWERTUNGS_ACHSEN`, `formatiereDatum`
- Produces: `data-story="transparent" | "manifest" | "buehne-bild" | "notizen" | "wand" | "wand-reihe" | "wand-tag"`, `data-story-vorhang` auf der Wand

- [ ] **Step 1: Sektion 2 schreiben**

`components/story/TransparentMachen.tsx`:

```tsx
import { Suspense } from "react";

import { Bild } from "@/components/medien/Bild";
import { formatiereDatum } from "@/lib/format";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";
import { neuesteRedaktionelleReview } from "@/lib/query/reviews";

const ERLAEUTERUNG: Record<string, string> = Object.fromEntries(
  BEWERTUNGS_ACHSEN.map((achse) => [achse.key, achse.erlaeuterung]),
);

/** Drei Feldbuch-Notizen, dazu der Zoom Blatt, Blüte, Trichom (Spec 5.1, Sektion 2). */
const NOTIZEN = [
  { titel: "Aussehen", bild: "blatt", text: ERLAEUTERUNG.aussehen },
  { titel: "Geruch", bild: "bluete", text: ERLAEUTERUNG.geruch },
  {
    titel: "Restfeuchte",
    bild: "trichom",
    text: "Zwischen 8 und 13 Prozent ist gut. Darunter wird es staubig, darüber droht Schimmel.",
  },
] as const;

const BUEHNE_SIZES = "(min-width: 768px) 45vw, 100vw";

/** Kopfzeile wie bei einer Zeitung: Stand ist das Datum des neuesten Eintrags. */
async function Stand() {
  const review = await neuesteRedaktionelleReview();
  if (!review) return <>Erste Ausgabe in Arbeit</>;
  return (
    <>
      {"Stand "}
      <time dateTime={review.erstelltAm.toISOString()}>{formatiereDatum(review.erstelltAm)}</time>
    </>
  );
}

export function TransparentMachen() {
  return (
    <section
      aria-labelledby="transparent-titel"
      data-story="transparent"
      className="px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto w-full max-w-360">
        <div className="grid grid-cols-1 gap-2 border-y-2 border-text py-2 text-small uppercase tracking-wide text-text sm:grid-cols-3 sm:items-center">
          <span className="font-buch text-h3 font-medium normal-case tracking-normal">Grünes Buch.</span>
          <span className="numeric sm:text-center">
            <Suspense fallback={<>Stand wird geladen</>}>
              <Stand />
            </Suspense>
          </span>
          <span className="sm:text-right">Charge für Charge.</span>
        </div>

        <h2
          id="transparent-titel"
          data-story="manifest"
          className="mt-16 max-w-5xl font-buch text-kapitel text-text text-balance"
        >
          Hinter jedem Handelsnamen steckt eine Charge. Ich schreibe auf, was drin ist.
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-8">
          {/* Bühne ab Tablet: drei Bilder übereinander, per CSS sticky. Die
              StoryBuehne blendet sie scroll-gekoppelt über; ohne Bewegung
              steht das letzte oben. Die Bilder sind hier Wiederholung,
              die zugänglichen stehen in den Notizen. */}
          <div aria-hidden="true" className="hidden md:block">
            <div className="sticky top-16 grid">
              {NOTIZEN.map((notiz) => (
                <div key={notiz.bild} data-story="buehne-bild" className="col-start-1 row-start-1 overflow-hidden">
                  <Bild id={notiz.bild} sizes={BUEHNE_SIZES} dekorativ />
                </div>
              ))}
            </div>
          </div>

          <ol data-story="notizen" className="flex flex-col gap-16 md:gap-[40vh] md:py-[20vh]">
            {NOTIZEN.map((notiz) => (
              <li key={notiz.titel} className="flex flex-col gap-4">
                <div className="md:hidden">
                  <Bild id={notiz.bild} sizes="100vw" />
                </div>
                <h3 className="font-buch text-h1 font-medium text-text">{notiz.titel}</h3>
                <p className="max-w-[48ch] text-body text-text-muted text-pretty">{notiz.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Sektion 3 schreiben**

`components/story/WissenBuendeln.tsx`:

```tsx
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Textur } from "@/components/medien/Textur";
import { WandSkelett } from "@/components/story/Skelette";
import { wandTags, type CommunityZahlen } from "@/lib/query/community";
import { communityZahlen } from "@/lib/query/umfragen";

const DREHUNG = ["-rotate-3", "rotate-2", "-rotate-1"] as const;
const TEXTUR = ["nebel", "marmor", "nebel"] as const;

/**
 * Die Tags der Wand: echte Zähler oder, wenn es nichts zu zählen gibt oder
 * die Abfrage scheitert, die drei Leitsätze (Spec 5.2). Ein Fehler hier darf
 * die Seite nicht kosten; Next-interne Unterbrechungen gehen trotzdem durch.
 */
async function WandReihe() {
  let zahlen: CommunityZahlen | null = null;
  try {
    zahlen = await communityZahlen();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("communityZahlen fehlgeschlagen", fehler);
  }

  return (
    <ul data-story="wand-reihe" className="wand-reihe flex flex-wrap items-center gap-x-16 gap-y-8">
      {wandTags(zahlen).map((text, index) => (
        <li key={text} data-story="wand-tag" className="relative isolate">
          <Textur id={TEXTUR[index % TEXTUR.length]} className="absolute -inset-8 -z-10 opacity-30" />
          <span className={`block font-wand text-tag text-spray ${DREHUNG[index % DREHUNG.length]}`}>{text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Sektion 3 (Spec 5.1): die Wand, erster Bruch in der Story. */
export function WissenBuendeln() {
  return (
    <section
      aria-labelledby="wissen-titel"
      data-story="wand"
      data-story-vorhang=""
      className="relative overflow-hidden bg-surface-sunken px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto w-full max-w-360">
        <h2 id="wissen-titel" className="max-w-4xl font-buch text-kapitel text-text text-balance">
          Einer allein weiß wenig. Hier sammelt sich, was viele erfahren.
        </h2>
        <div className="mt-16">
          <Suspense fallback={<WandSkelett />}>
            <WandReihe />
          </Suspense>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: In die Startseite einsetzen**

`app/page.tsx`: Imports ergänzen und den `return` ersetzen:

```tsx
import { TransparentMachen } from "@/components/story/TransparentMachen";
import { WissenBuendeln } from "@/components/story/WissenBuendeln";
```

```tsx
    <div className="relative isolate">
      <FeldbuchRaster />
      <Auftakt />
      <TransparentMachen />
      <WissenBuendeln />
    </div>
```

- [ ] **Step 4: Tests, Typecheck, Lint**

Run: `npm test && npm run typecheck && npx eslint .`
Expected: grün.

- [ ] **Step 5: Sichtprüfung**

Im Browser `/`:
- Kopfzeile mit Doppellinie und Datum (oder „Erste Ausgabe in Arbeit“), Manifest groß in Cormorant.
- Ab 768 px: links klebt die Bühne beim Scrollen, rechts laufen drei Notizen; darunter 768 px je Notiz ein Bild. Kein horizontales Überlaufen (Messung wie Task 9).
- Wand: Tags in Sprühviolett mit Textur dahinter. Mit lokalen Daten stehen Zahlen da; per `javascript_tool` prüfen, dass die Tags zu `wrangler d1 execute` aus Task 8 passen.
- Dunkel: Tags in `spray-400`, Texturen sichtbar, Bühne hell auf dunkel.

- [ ] **Step 6: Commit**

```bash
git add components/story/TransparentMachen.tsx components/story/WissenBuendeln.tsx app/page.tsx
git commit -m "feat: Sektionen Transparent machen (Manifest, Feldbuch-Buehne) und Wissen buendeln (Wand)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Sektionen 4 und 5: Gemeinsam lernen, Der neueste Eintrag

**Skills:** `build-awwwards-quality-sites`, `dataviz` (Netzdiagramm), `better-accessibility`, `better-typography`, `frontend-design`, `ui-design-engine`

**Files:**
- Create: `components/story/GemeinsamLernen.tsx`, `components/story/Netzdiagramm.tsx`, `components/story/NeuesterEintrag.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Loop` (Task 6), `netzPunkte`, `alsPolygon`, `istLeereMatrix` (Task 8), `RedaktionelleReview.geschmacksMatrix` (Task 8), `DoppelseitenSkelett` (Task 9), `GESCHMACKS_ACHSEN`, `BEWERTUNGS_ACHSEN`
- Produces: `Netzdiagramm({ matrix })`; `data-story="lernen" | "schleife" | "schleife-linie" | "eintrag" | "doppelseite"`, `data-zaehler` mit `data-ziel`

- [ ] **Step 1: Sektion 4 schreiben**

`components/story/GemeinsamLernen.tsx`:

```tsx
import { Loop } from "@/components/medien/Loop";

/**
 * Sektion 4 (Spec 5.1): die Schleife. Die Überschrift trägt die Aussage;
 * Kreis, Stationen und Video sind deren Bild und deshalb aria-hidden.
 * Die ersten beiden Stationen spricht die Community (Wand), die letzten
 * beiden das Buch.
 */
const STATIONEN = [
  { text: "Ihr schlagt vor.", wand: true, ort: "top-0 left-1/2 -translate-x-1/2" },
  { text: "Ihr stimmt ab.", wand: true, ort: "top-1/2 right-0 -translate-y-1/2" },
  { text: "Ich teste.", wand: false, ort: "bottom-0 left-1/2 -translate-x-1/2" },
  { text: "Alle lesen.", wand: false, ort: "top-1/2 left-0 -translate-y-1/2" },
] as const;

function stationKlasse(wand: boolean): string {
  // font-normal: text-h1 setzt 600, Sedgwick hat nur 400 (sonst künstlich fett).
  return wand ? "font-wand text-h1 font-normal text-spray" : "font-buch text-h1 font-medium text-text";
}

export function GemeinsamLernen() {
  return (
    <section aria-labelledby="lernen-titel" data-story="lernen" className="px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <h2 id="lernen-titel" className="font-buch text-kapitel text-text text-balance">
            Ihr schlagt vor. Ihr stimmt ab. Ich teste. Alle lesen.
          </h2>
          <p className="max-w-[56ch] text-body text-text-muted text-pretty">
            In jeder Runde setze ich ein oder zwei Sorten selbst. Zwei weitere Plätze wählt ihr. Was
            gewinnt, teste ich nach festem Schema, und der Eintrag steht danach hier für alle.
          </p>
        </div>

        <div aria-hidden="true" data-story="schleife" className="relative mx-auto hidden aspect-square w-full max-w-xl md:block">
          <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full text-text">
            <circle
              data-story="schleife-linie"
              cx="200"
              cy="200"
              r="160"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              pathLength={1}
              strokeDasharray="1"
            />
          </svg>
          <div className="absolute inset-1/4 overflow-hidden">
            <Loop id="pflanze-loop" className="h-full" />
          </div>
          {STATIONEN.map((station) => (
            <span
              key={station.text}
              className={`absolute bg-surface px-2 whitespace-nowrap ${station.ort} ${stationKlasse(station.wand)}`}
            >
              {station.text}
            </span>
          ))}
        </div>

        <ol aria-hidden="true" className="flex flex-col gap-6 border-l border-text pl-6 md:hidden">
          {STATIONEN.map((station) => (
            <li key={station.text} className={stationKlasse(station.wand)}>
              {station.text}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Netzdiagramm schreiben**

`components/story/Netzdiagramm.tsx`:

```tsx
import { alsPolygon, istLeereMatrix, netzPunkte } from "@/lib/netz";
import { GESCHMACKS_ACHSEN, type GeschmacksMatrix } from "@/lib/query/bewertung";

const GROESSE = 320;
const MITTE = GROESSE / 2;
const RADIUS = 110;
const MAX = 5;
const RINGE = [1, 2, 3, 4, 5] as const;
const WERT = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

/** Alle Achsen auf demselben Wert: ein Ring oder die Achsenenden. */
function gleichmaessig(wert: number, radius = RADIUS) {
  return netzPunkte(GESCHMACKS_ACHSEN.map(() => wert), MAX, radius, MITTE);
}

/**
 * Geschmacksmatrix als Netzdiagramm (Spec 5.1, Sektion 5). Datengrafik in
 * Tinte, nicht in Blattgrün: Grün ist Bedienung. Die Werte stehen zusätzlich
 * als Liste für Screenreader; das SVG ist aria-hidden. Umschlossen vom
 * einzigen Bogen der Seite (Spec 4.3, Wizard Trees, flach als Linie).
 */
export function Netzdiagramm({ matrix }: { matrix: GeschmacksMatrix }) {
  const werte = GESCHMACKS_ACHSEN.map((achse) => matrix[achse.key]);
  if (istLeereMatrix(werte)) {
    return <p className="text-body text-text-muted">Zu diesem Eintrag gibt es keine Geschmacksangaben.</p>;
  }

  const achsenEnden = gleichmaessig(MAX);
  const beschriftung = gleichmaessig(MAX, RADIUS + 28);

  return (
    <figure className="flex flex-col items-center gap-4 rounded-t-full border border-text px-6 pt-16 pb-6">
      <svg viewBox={`0 0 ${GROESSE} ${GROESSE}`} aria-hidden="true" className="w-full max-w-sm text-text">
        {RINGE.map((ring) => (
          <polygon
            key={ring}
            points={alsPolygon(gleichmaessig(ring))}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.15}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {achsenEnden.map((punkt, index) => (
          <line
            key={GESCHMACKS_ACHSEN[index].key}
            x1={MITTE}
            y1={MITTE}
            x2={punkt.x}
            y2={punkt.y}
            stroke="currentColor"
            strokeOpacity={0.15}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <polygon
          points={alsPolygon(netzPunkte(werte, MAX, RADIUS, MITTE))}
          fill="currentColor"
          fillOpacity={0.12}
          stroke="currentColor"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
        {beschriftung.map((punkt, index) => (
          <text
            key={GESCHMACKS_ACHSEN[index].key}
            x={punkt.x}
            y={punkt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={12}
            className="fill-text-muted font-sans"
          >
            {GESCHMACKS_ACHSEN[index].label}
          </text>
        ))}
      </svg>
      <figcaption className="text-small text-text-muted">Geschmack, Skala 0 bis 5</figcaption>
      <ul className="sr-only">
        {GESCHMACKS_ACHSEN.map((achse) => (
          <li key={achse.key}>{`${achse.label}: ${WERT.format(matrix[achse.key])} von 5`}</li>
        ))}
      </ul>
    </figure>
  );
}
```

- [ ] **Step 3: Sektion 5 schreiben**

`components/story/NeuesterEintrag.tsx`:

```tsx
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Netzdiagramm } from "@/components/story/Netzdiagramm";
import { DoppelseitenSkelett } from "@/components/story/Skelette";
import { buttonKlassen } from "@/components/ui";
import { formatiereDatum } from "@/lib/format";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";
import { neuesteRedaktionelleReview, type RedaktionelleReview } from "@/lib/query/reviews";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * "Wirkung" steht auf der Startseite nicht (Spec 2): groß gesetzt läse sie
 * sich öffentlich als Wirksamkeitsversprechen. Der vollständige Eintrag
 * zeigt alle fünf Noten.
 */
const STARTSEITEN_ACHSEN = BEWERTUNGS_ACHSEN.filter((achse) => achse.key !== "wirkung");

function Doppelseite({ review }: { review: RedaktionelleReview }) {
  return (
    <article
      aria-labelledby="eintrag-name"
      data-story="doppelseite"
      className="grid grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:grid-cols-2"
    >
      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12 lg:border-r lg:border-border">
        <p className="text-small text-text-muted">
          <time dateTime={review.erstelltAm.toISOString()}>{formatiereDatum(review.erstelltAm)}</time>
          {review.chargenNr ? (
            <>
              {" · Charge "}
              <span className="numeric">{review.chargenNr}</span>
            </>
          ) : null}
        </p>

        <h3 id="eintrag-name" className="font-buch text-kapitel text-text wrap-break-word hyphens-auto">
          {review.handelsname}
        </h3>

        <dl className="grid grid-cols-2 gap-6">
          {STARTSEITEN_ACHSEN.map((achse) => (
            // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
            <div key={achse.key} className="flex flex-col gap-1">
              <dt className="text-small text-text-muted">{achse.label}</dt>
              <dd className="numeric text-h1 text-text">
                <span aria-hidden="true" data-zaehler="" data-ziel={review[achse.key]}>
                  {NOTE.format(review[achse.key])}
                </span>
                <span aria-hidden="true" className="text-h3 text-text-muted">
                  {" / 5"}
                </span>
                <span className="sr-only">{`${NOTE.format(review[achse.key])} von 5`}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12">
        <Netzdiagramm matrix={review.geschmacksMatrix} />
        {review.notiz ? (
          <p className="line-clamp-3 max-w-[56ch] text-body text-text-muted">{review.notiz}</p>
        ) : null}
        <p className="mt-auto">
          <Link href={`/produkte/${review.slug}`} className={buttonKlassen("secondary", "md")}>
            Ganzen Eintrag lesen
          </Link>
        </p>
      </div>
    </article>
  );
}

/** Lädt den Eintrag; leer und Fehler haben eigene Sätze (Spec 5.2). */
async function EintragInhalt() {
  let review: RedaktionelleReview | null;
  try {
    review = await neuesteRedaktionelleReview();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("neuesteRedaktionelleReview fehlgeschlagen", fehler);
    return (
      <p className="border border-border bg-surface-raised p-8 text-body text-text">
        Der neueste Eintrag lässt sich gerade nicht laden. Der Rest der Seite funktioniert weiter.
      </p>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-start gap-6 border border-border bg-surface-raised p-8 sm:p-12">
        <p className="font-buch text-kapitel text-text">Das erste Kapitel wird gerade geschrieben.</p>
        <p className="max-w-[48ch] text-body text-text-muted">
          Welche Sorte ich zuerst teste, entscheidet die Abstimmung.
        </p>
        <Link href="#abstimmung" className={buttonKlassen("secondary", "md")}>
          Zur Abstimmung
        </Link>
      </div>
    );
  }

  return <Doppelseite review={review} />;
}

/** Sektion 5 (Spec 5.1): der Höhepunkt der Story. */
export function NeuesterEintrag() {
  return (
    <section
      aria-labelledby="eintrag-titel"
      data-story="eintrag"
      className="bg-surface-sunken px-4 py-24 sm:px-8 sm:py-32"
    >
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12">
        <h2 id="eintrag-titel" className="font-buch text-kapitel text-text">
          Der neueste Eintrag
        </h2>
        <Suspense fallback={<DoppelseitenSkelett />}>
          <EintragInhalt />
        </Suspense>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: In die Startseite einsetzen**

`app/page.tsx`: Imports ergänzen und im `return` nach `<WissenBuendeln />` einfügen:

```tsx
import { GemeinsamLernen } from "@/components/story/GemeinsamLernen";
import { NeuesterEintrag } from "@/components/story/NeuesterEintrag";
```

```tsx
      <GemeinsamLernen />
      <NeuesterEintrag />
```

- [ ] **Step 5: Tests, Typecheck, Lint**

Run: `npm test && npm run typecheck && npx eslint .`
Expected: grün.

- [ ] **Step 6: Sichtprüfung**

Im Browser `/`:
- Sektion 4 ab 768 px: Kreis mit vier Stationen auf der Linie, Standbild des Videos in der Mitte (noch kein Abspielen, das kommt mit Task 13); darunter die senkrechte Liste.
- Sektion 5 mit lokalen Daten: Datum, Charge, Handelsname in Cormorant, **vier** Noten (keine „Wirkung“), Netzdiagramm im Bogen, höchstens drei Zeilen Notiz, Button „Ganzen Eintrag lesen“ führt auf `/produkte/<slug>`.
- Leerzustand simulieren: per `javascript_tool` ist das nicht möglich; stattdessen den Text im Code gegenlesen und live in Task 16 prüfen (Cloud-D1 ist leer).
- Screenreader-Text: `document.querySelector('[data-story="doppelseite"]').innerText` enthält „von 5“ je Note, das SVG ist `aria-hidden`.

- [ ] **Step 7: Commit**

```bash
git add components/story/GemeinsamLernen.tsx components/story/Netzdiagramm.tsx components/story/NeuesterEintrag.tsx app/page.tsx
git commit -m "feat: Sektionen Gemeinsam lernen (Schleife) und Der neueste Eintrag (Doppelseite, Netzdiagramm)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Sektionen 6 bis 8: Abstimmung, Katalog, Apotheken

**Skills:** `better-accessibility` (Formular, Zustände), `emil-design-eng`, `better-layout`, `frontend-design`, `ui-design-engine`

**Files:**
- Create: `components/story/Abstimmung.tsx`, `components/story/Katalog.tsx`, `components/story/Apotheken.tsx`
- Modify: `components/umfrage/UmfrageKarte.tsx`, `app/globals.css` (`@layer components`), `app/page.tsx`

**Interfaces:**
- Consumes: `stimmZustand` (Task 8), `Textur` (Task 6), `StimmzettelSkelett`, `KatalogSkelett` (Task 9), bestehende `aktiveUmfrage`, `eigeneStimme`, `aktuellesMitglied`, `ladeStrainListe`, `istFachkreis`, `leererFilter`, `ProduktCard`
- Produces: `UmfrageKarte` mit optionaler Prop `darstellung?: "karte" | "wand"` (Standard `"karte"`, `/umfragen` unverändert); `id="abstimmung"`; `data-story="abstimmung" | "waehl-mit" | "spruehmarke" | "katalog"`

- [ ] **Step 1: `UmfrageKarte` um die Wand-Darstellung erweitern**

In `components/umfrage/UmfrageKarte.tsx`:

Import ergänzen:

```tsx
import { Textur } from "@/components/medien/Textur";
```

`Props` ergänzen:

```tsx
  /**
   * "karte" (Standard, /umfragen) oder "wand" (Startseite, Spec 5.1
   * Sektion 6): Stimmzettel an der Wand, gesetzte Plätze gestempelt,
   * wählbare gesprüht markiert. Logik und Zustände sind dieselben.
   */
  darstellung?: "karte" | "wand";
```

`Kandidat` bekommt den Parameter `darstellung: "karte" | "wand"` (in der Parameterliste und im Typ), und der Block von `<div className="flex flex-wrap items-baseline justify-between gap-2">` bis zum Ende der Badge-Gruppe wird:

```tsx
  const wand = darstellung === "wand";
  const name = (
    <Link
      href={`/produkte/${option.slug}`}
      className="text-body font-medium text-text underline underline-offset-2 wrap-break-word"
      title={option.handelsname}
    >
      {option.handelsname}
    </Link>
  );

  return (
    <li className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {wand && option.herkunft === "COMMUNITY" ? (
          <span className="relative isolate inline-block min-w-0">
            <Textur id="nebel" story="spruehmarke" className="absolute -inset-x-4 -inset-y-2 -z-10 opacity-40" />
            {name}
          </span>
        ) : (
          name
        )}

        <span className="flex items-center gap-2">
          {option.herkunft === "GESETZT" ? (
            wand ? (
              <span className="stempel" title="Vom Betreiber gesetzt, nicht zur Wahl gestellt">
                Gesetzt
              </span>
            ) : (
              <Badge variante="neutral" title="Vom Betreiber gesetzt, nicht zur Wahl gestellt">
                Gesetzter Platz
              </Badge>
            )
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
```

(der Balken darunter und das schließende `</li>` bleiben unverändert).

In `UmfrageKarte` die Signatur und den äußeren Rahmen ändern:

```tsx
export function UmfrageKarte({ umfrage, zustand, className, darstellung = "karte" }: Props) {
```

Die Überschrift im Body wird je nach Darstellung `h2` oder `h3` (auf der Startseite steht darüber die `h2` der Sektion):

```tsx
  const Titel = darstellung === "wand" ? "h3" : "h2";
```

```tsx
        <Titel className="max-w-[68ch] text-h2 text-text">{umfrage.titel}</Titel>
```

Die Kandidaten bekommen `darstellung={darstellung}`. Den Inhalt (`CardHeader`, `CardBody`, `CardFooter`) in eine Konstante `inhalt` legen und am Ende:

```tsx
  if (darstellung === "wand") {
    return (
      <div className={cn("stimmzettel border border-border-strong bg-surface-raised shadow-lg", className)}>
        {inhalt}
      </div>
    );
  }

  return <Card className={cn("border-accent", className)}>{inhalt}</Card>;
```

- [ ] **Step 2: CSS für Stempel und Wasserzeichen**

In `app/globals.css` innerhalb von `@layer components` ergänzen:

```css
  /* Stempel fuer gesetzte Plaetze auf dem Stimmzettel (Spec 5.1, Sektion 6).
     padding 4px oben/unten: optische Korrektur, der Rahmen traegt schon. */
  .stempel {
    display: inline-flex;
    align-items: center;
    border: 2px solid currentColor;
    padding: 4px 8px;
    color: var(--color-text-muted);
    font-family: var(--font-sans);
    font-size: var(--text-caption);
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transform: rotate(-4deg);
  }

  /* Ton-in-Ton-Tag hinter der Abstimmung (Spec 4.3, Doja-Merch). */
  .wasserzeichen {
    font-size: clamp(12rem, 45vw, 40rem);
    line-height: 0.8;
  }
```

- [ ] **Step 3: Sektion 6 schreiben**

`components/story/Abstimmung.tsx`:

```tsx
import { Suspense } from "react";

import { Textur } from "@/components/medien/Textur";
import { StimmzettelSkelett } from "@/components/story/Skelette";
import { UmfrageKarte } from "@/components/umfrage/UmfrageKarte";
import { stimmZustand } from "@/components/umfrage/stimmzustand";
import { aktiveUmfrage, eigeneStimme } from "@/lib/query/umfragen";
import { aktuellesMitglied } from "@/lib/session";

/**
 * Der Stimmzettel. Der Zustand entsteht hier und nur hier; die Karte zeigt
 * ihn an, und über das Schreiben entscheidet die Server Action erneut.
 * Umfrage und Sitzung laden parallel; die eigene Stimme nur für freigegebene
 * Mitglieder.
 */
async function Stimmzettel() {
  const [umfrage, mitglied] = await Promise.all([aktiveUmfrage(), aktuellesMitglied()]);
  if (!umfrage) {
    return (
      <p className="max-w-[48ch] border border-border-strong bg-surface-raised p-8 text-body text-text">
        Gerade läuft keine Runde. Die nächste steht hier, sobald sie eröffnet ist.
      </p>
    );
  }

  const optionId = mitglied?.freigegeben ? await eigeneStimme(umfrage.id, mitglied.mitgliedId) : null;
  return <UmfrageKarte umfrage={umfrage} zustand={stimmZustand(mitglied, optionId)} darstellung="wand" />;
}

/** Sektion 6 (Spec 5.1): die Wand mit dem Stimmzettel. Ziel des Buttons "Wähl mit". */
export function Abstimmung() {
  return (
    <section
      id="abstimmung"
      aria-labelledby="abstimmung-titel"
      data-story="abstimmung"
      data-story-vorhang=""
      className="relative isolate overflow-hidden px-4 py-24 sm:px-8 sm:py-32"
    >
      <span
        aria-hidden="true"
        className="wasserzeichen pointer-events-none absolute -right-8 -bottom-16 -z-10 select-none font-wand text-surface-sunken"
      >
        gb
      </span>

      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 lg:grid-cols-[2fr_3fr] lg:items-start">
        <div className="flex flex-col items-start gap-6">
          <h2 id="abstimmung-titel" className="font-buch text-kapitel text-text text-balance">
            Was teste ich als Nächstes?
          </h2>
          <p data-story="waehl-mit" className="relative -rotate-3 font-wand text-tag text-spray">
            Wähl mit.
            <Textur id="drip" className="absolute top-full left-1/3 h-16 w-6" />
          </p>
          <p className="max-w-[48ch] text-body text-text-muted text-pretty">
            Gesetzte Plätze bestimme ich. Über die übrigen stimmen freigegebene Mitglieder ab, eine
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

- [ ] **Step 4: Sektionen 7 und 8 schreiben**

`components/story/Katalog.tsx`:

```tsx
import Link from "next/link";
import { Suspense } from "react";

import { ProduktCard } from "@/components/produkt/ProduktCard";
import { KatalogSkelett } from "@/components/story/Skelette";
import { EmptyState, buttonKlassen } from "@/components/ui";
import { leererFilter } from "@/lib/query/filter";
import { istFachkreis } from "@/lib/query/fachkreis";
import { ladeStrainListe } from "@/lib/query/strains";

const ANZAHL = 6;

const EINSTIEGE = [
  { href: "/produkte?typ=INDICA", text: "Indica" },
  { href: "/produkte?typ=SATIVA", text: "Sativa" },
  { href: "/produkte?geschmack=ZITRUS", text: "Zitrus" },
  { href: "/produkte?nurVerfuegbar=1", text: "Nur verfügbare" },
] as const;

/** Sechs Produkte als wischbare Reihe. Preise nur mit Freigabe (bestehende Logik). */
async function Reihe() {
  const fachkreis = await istFachkreis();
  const liste = await ladeStrainListe(leererFilter(), fachkreis);
  // Bewusst in TypeScript zugeschnitten statt mit einer eigenen Abfrage.
  const eintraege = liste.eintraege.slice(0, ANZAHL);

  if (eintraege.length === 0) {
    return (
      <EmptyState titel="Keine Produkte im Katalog" beschreibung="Derzeit sind keine Handelsnamen hinterlegt." />
    );
  }

  return (
    <ul
      aria-label="Auswahl aus dem Katalog"
      className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8"
    >
      {eintraege.map((strain) => (
        <li key={strain.id} className="flex w-72 shrink-0 snap-start sm:w-88">
          <ProduktCard strain={strain} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

/** Sektion 7 (Spec 5.1): ruhiges Buch nach der Wand. */
export function Katalog() {
  return (
    <section aria-labelledby="katalog-titel" data-story="katalog" className="px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto flex w-full max-w-360 flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-2xl flex-col gap-4">
            <h2 id="katalog-titel" className="font-buch text-kapitel text-text">
              Der Katalog
            </h2>
            <p className="text-body text-text-muted text-pretty">
              Verschreibungspflichtige Cannabisarzneimittel nach ihren BfArM-Handelsnamen, mit
              Cannabinoidgehalt, Terpenprofil und gemeldeter Verfügbarkeit.
            </p>
          </div>
          <Link href="/produkte" className={buttonKlassen("secondary", "md")}>
            Gesamten Katalog ansehen
          </Link>
        </div>

        <ul aria-label="Einstiege in den Katalog" className="flex flex-wrap gap-2">
          {EINSTIEGE.map((eintrag) => (
            <li key={eintrag.href}>
              <Link href={eintrag.href} className={buttonKlassen("secondary", "sm")}>
                {eintrag.text}
              </Link>
            </li>
          ))}
        </ul>

        <Suspense fallback={<KatalogSkelett />}>
          <Reihe />
        </Suspense>
      </div>
    </section>
  );
}
```

`components/story/Apotheken.tsx`:

```tsx
import Link from "next/link";

import { buttonKlassen } from "@/components/ui";

/** Sektion 8 (Spec 5.1): ein Satz und ein Link. */
export function Apotheken() {
  return (
    <section aria-labelledby="apotheken-titel" className="px-4 pb-24 sm:px-8 sm:pb-32">
      <div className="mx-auto flex w-full max-w-360 flex-col items-start gap-6 border-t border-border pt-12">
        <h2 id="apotheken-titel" className="font-buch text-kapitel text-text">
          Apotheken
        </h2>
        <p className="max-w-[56ch] text-body text-text-muted text-pretty">
          Zu jeder gelisteten Versandapotheke stehen Standort, Lieferzeit, akzeptierte Rezeptarten
          und das gemeldete Sortiment.
        </p>
        <Link href="/apotheken" className={buttonKlassen("secondary", "md")}>
          Apotheken ansehen
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: In die Startseite einsetzen**

`app/page.tsx`: Imports ergänzen und im `return` nach `<NeuesterEintrag />` einfügen:

```tsx
import { Abstimmung } from "@/components/story/Abstimmung";
import { Apotheken } from "@/components/story/Apotheken";
import { Katalog } from "@/components/story/Katalog";
```

```tsx
      <Abstimmung />
      <Katalog />
      <Apotheken />
```

- [ ] **Step 6: Tests, Typecheck, Lint**

Run: `npm test && npm run typecheck && npx eslint .`
Expected: grün.

- [ ] **Step 7: Sichtprüfung inklusive Stimmzustände**

Im Browser `/`:
- „Wähl mit“ im Auftakt springt zu `#abstimmung`.
- Stimmzettel: Titel der Runde als `h3`, gesetzte Plätze mit Stempel, wählbare mit Sprühnebel hinter dem Namen, Namen in Buch-Typo, Wasserzeichen „gb“ blass dahinter.
- Abgemeldet: „Anmelden“-Button (Zustand ANONYM). Wenn ein freigegebenes Testkonto vorhanden ist: angemeldet abstimmen, danach „Deine Stimme ist gezählt“. Ohne Testkonto im Bericht als „nicht verifiziert“ nennen.
- `/umfragen` sieht aus wie vorher (Darstellung „karte“).
- Katalog: Reihe wischbar, Pillen-Einstiege, Tab erreicht jede Karte.
- **Lange Handelsnamen (Review Focus 5)** bei 390 px im iframe (wie Task 9, Step 7), danach:

```js
const d = f.contentDocument;
for (const el of d.querySelectorAll('#eintrag-name, #abstimmung a[title], [data-story="katalog"] h3 a')) {
  el.textContent = "Pedanios 22/1 Ghost Train Haze Kanada Sonderedition Charge Nord";
}
({ breite: d.documentElement.scrollWidth, sichtbar: d.documentElement.clientWidth });
```

Expected: `breite` gleich `sichtbar` (kein Überlaufen).

- [ ] **Step 8: Commit**

```bash
git add components/umfrage/UmfrageKarte.tsx components/story/Abstimmung.tsx components/story/Katalog.tsx components/story/Apotheken.tsx app/globals.css app/page.tsx
git commit -m "feat: Sektionen Abstimmung (Wand mit Stimmzettel), Katalog-Reihe und Apotheken

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 13: StoryBuehne: Grundgerüst und Auftakt-Choreografie

**Skills:** `build-awwwards-quality-sites` (GSAP, Lenis, ScrollTrigger), `animate`, `react-best-practices` (`bundle-dynamic-imports`, `bundle-defer-third-party`), `better-accessibility`, `superpowers:test-driven-development`

**Files:**
- Modify: `package.json`, `package-lock.json` (über `npm install`)
- Create: `components/story/StoryBuehne.tsx`, `components/story/bewegung/typen.ts`, `components/story/bewegung/loops.ts`, `components/story/bewegung/start.ts`, `components/story/bewegung/auftakt.ts`, `tests/bewegung.test.ts`
- Modify: `app/globals.css` (Einstieg und Notfall), `app/page.tsx`

**Interfaces:**
- Consumes: `data-story="titel" | "unterzeile" | "tag" | "tag-drip" | "intro"`, `data-story-einstieg`, `data-skelett`, `video[data-loop]`
- Produces: `type Werkzeug = { gsap; ScrollTrigger; SplitText; mm }`, `type Choreografie = (werkzeug: Werkzeug) => void | (() => void)`, `AB_TABLET`, `SCROLL_CHOREOGRAFIEN` in `start.ts` (Tasks 14 und 15 tragen dort ein), `starteBuehne(): Promise<() => void>`, `StoryBuehne` (rendert nichts)

- [ ] **Step 1: Failing test schreiben**

`tests/bewegung.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

test("Einstieg wird nur mit Skript und erlaubter Bewegung ausgeblendet, mit Notfall", () => {
  const block = /@media \(scripting: enabled\) and \(prefers-reduced-motion: no-preference\)\s*\{([\s\S]*?)\n\}/.exec(css);
  assert.ok(block, "Block @media (scripting: enabled) and (prefers-reduced-motion: no-preference) fehlt");
  assert.match(block[1], /\[data-story-einstieg\]\s*\{[^}]*opacity:\s*0/);
  assert.match(block[1], /animation:\s*einstieg-notfall\s+0s\s+linear\s+2\.5s\s+forwards/);
  assert.match(css, /@keyframes einstieg-notfall\s*\{\s*to\s*\{\s*opacity:\s*1;?\s*\}\s*\}/);
});

function dateien(ordner: string): string[] {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    if (statSync(pfad).isDirectory()) return name === "generated" ? [] : dateien(pfad);
    return /\.(ts|tsx)$/.test(name) ? [pfad] : [];
  });
}

test("gsap und lenis werden nur in components/story/bewegung importiert", () => {
  const erlaubt = join("components", "story", "bewegung");
  const verstoesse = ["app", "components", "lib"]
    .flatMap(dateien)
    .filter((pfad) => !pfad.startsWith(erlaubt))
    .filter((pfad) => /["'](gsap|lenis)(\/[\w]+)?["']/.test(readFileSync(pfad, "utf8")));
  assert.deepEqual(verstoesse, []);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npm test`
Expected: FAIL im ersten Test (Block fehlt); der zweite besteht.

- [ ] **Step 3: Einstieg und Notfall in `globals.css`**

Nach dem Block „Reduced motion“ am Dateiende anfügen:

```css
/* ==========================================================================
   Einstieg der Startseite (Spec 4.6, 9.3)
   Ausgeblendet wird nur, wenn Skripte laufen und Bewegung erlaubt ist. Die
   StoryBuehne blendet ein und nimmt dabei die Animation weg; laedt sie nicht,
   blendet der Notfall nach 2,5 s ein. Ohne Skript greift der Block gar nicht.
   ========================================================================== */

@media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
  [data-story-einstieg] {
    opacity: 0;
    animation: einstieg-notfall 0s linear 2.5s forwards;
  }
}

@keyframes einstieg-notfall {
  to {
    opacity: 1;
  }
}
```

- [ ] **Step 4: Test laufen lassen, er muss bestehen**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: GSAP und Lenis installieren (Netz: genau einmal)**

Run: `npm install gsap lenis`
Expected: zwei Pakete hinzugefügt, `package.json` mit `gsap` (≥ 3.13, SplitText ist darin frei enthalten) und `lenis`. Bei Netzfehler: anhalten, melden, nicht wiederholen.

- [ ] **Step 6: Typen und Loops schreiben**

`components/story/bewegung/typen.ts`:

```ts
import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";
import type { SplitText } from "gsap/SplitText";

/** Was jede Choreografie bekommt. Nur Typen: die Module laedt start.ts dynamisch. */
export type Werkzeug = {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
  SplitText: typeof SplitText;
  /** Ablaeufe nur ab einer Breite (Pin, Schwenk); raeumt beim Verlassen selbst auf. */
  mm: ReturnType<typeof gsap.matchMedia>;
};

/** Eine Sektion: legt ihre Tweens an, gibt bei Bedarf eine Aufraeumfunktion zurueck. */
export type Choreografie = (werkzeug: Werkzeug) => void | (() => void);

/** Ab hier Pin und Schwenk; darunter keine gepinnten Ablaeufe (Spec 5.1, Akzeptanz 7). */
export const AB_TABLET = "(min-width: 768px)";
```

`components/story/bewegung/loops.ts`:

```ts
/**
 * Video-Schleifen erst in der Naehe laden und abspielen, ausserhalb anhalten
 * (Spec 4.5). Laeuft nur, wenn die StoryBuehne laeuft, also nie bei
 * reduzierter Bewegung: dann bleibt das Standbild.
 */
export function beobachteLoops(): { stoppen: () => void } {
  const videos = [...document.querySelectorAll<HTMLVideoElement>("video[data-loop]")];
  const beobachter = new IntersectionObserver(
    (eintraege) => {
      for (const eintrag of eintraege) {
        const video = eintrag.target as HTMLVideoElement;
        if (eintrag.isIntersecting) {
          video.preload = "auto";
          void video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: "200px 0px" },
  );
  for (const video of videos) beobachter.observe(video);

  return {
    stoppen: () => {
      beobachter.disconnect();
      for (const video of videos) video.pause();
    },
  };
}
```

- [ ] **Step 7: Auftakt-Choreografie schreiben**

`components/story/bewegung/auftakt.ts`:

```ts
import type { Choreografie } from "./typen";

/**
 * Sektion 1: Titel Wort fuer Wort, dann das Tag gesprueht, dann der Drip
 * (Spec 5.1). Navigation und "Waehl mit" sind nie ausgeblendet.
 */
export const auftakt: Choreografie = ({ gsap, SplitText }) => {
  const titel = document.querySelector<HTMLElement>('[data-story="titel"]');
  if (!titel) return;

  const einstieg = gsap.utils.toArray<HTMLElement>("[data-story-einstieg]");
  // aria "auto": die h1 behaelt ihren Namen, die Woerter sind aria-hidden.
  const woerter = SplitText.create(titel, { type: "words", tag: "span", aria: "auto" }).words;

  gsap
    .timeline({ defaults: { ease: "power3.out" } })
    // Ab hier uebernimmt GSAP: der CSS-Notfall wird abgeschaltet, die Flaechen stehen.
    .set(einstieg, { animation: "none", opacity: 1 })
    .from(woerter, { yPercent: 40, opacity: 0, duration: 0.9, stagger: 0.14 })
    .from('[data-story="unterzeile"]', { opacity: 0, y: 12, duration: 0.6 }, 0.1)
    .from('[data-story="tag"]', { clipPath: "inset(0 100% 0 0)", duration: 0.6, ease: "power2.inOut" }, ">-0.3")
    .from('[data-story="tag-drip"]', { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "power1.in" })
    .from('[data-story="intro"]', { opacity: 0, y: 12, duration: 0.6 }, "<");
};
```

- [ ] **Step 8: Start und Aufräumen schreiben**

`components/story/bewegung/start.ts`:

```ts
import { auftakt } from "./auftakt";
import { beobachteLoops } from "./loops";
import type { Choreografie, Werkzeug } from "./typen";

/**
 * Scroll-Ablaeufe der Sektionen 2 bis 9. Sie starten erst, wenn kein
 * Skelett mehr steht: sonst messen sie eine Seite, deren Hoehe sich noch
 * aendert. Tasks 14 und 15 tragen hier ein.
 */
const SCROLL_CHOREOGRAFIEN: readonly Choreografie[] = [];

function wennInhaltGeladen(los: () => void): () => void {
  const fertig = () => document.querySelector("[data-skelett]") === null;
  if (fertig()) {
    los();
    return () => undefined;
  }
  const beobachter = new MutationObserver(() => {
    if (!fertig()) return;
    beobachter.disconnect();
    los();
  });
  beobachter.observe(document.body, { childList: true, subtree: true });
  return () => beobachter.disconnect();
}

/**
 * Laedt GSAP, ScrollTrigger, SplitText und Lenis und startet die Buehne
 * (Spec 6.2). Gibt die Aufraeumfunktion zurueck.
 */
export async function starteBuehne(): Promise<() => void> {
  const [{ gsap }, { ScrollTrigger }, { SplitText }, { default: Lenis }] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
    import("gsap/SplitText"),
    import("lenis"),
  ]);
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Lenis als einzige Scroll-Glaettung, getaktet ueber den GSAP-Ticker.
  const lenis = new Lenis({ autoRaf: false });
  lenis.on("scroll", ScrollTrigger.update);
  const takt = (sekunden: number) => lenis.raf(sekunden * 1000);
  gsap.ticker.add(takt);
  gsap.ticker.lagSmoothing(0);

  const mm = gsap.matchMedia();
  const werkzeug: Werkzeug = { gsap, ScrollTrigger, SplitText, mm };
  const aufraeumer: (() => void)[] = [];
  const merke = (ergebnis: void | (() => void)) => {
    if (ergebnis) aufraeumer.push(ergebnis);
  };

  const ctx = gsap.context(() => merke(auftakt(werkzeug)));

  let beendet = false;
  const stoppeWarten = wennInhaltGeladen(() => {
    if (beendet) return;
    ctx.add(() => {
      for (const choreografie of SCROLL_CHOREOGRAFIEN) merke(choreografie(werkzeug));
    });
    ScrollTrigger.refresh();
  });

  const neuMessen = () => ScrollTrigger.refresh();
  void document.fonts.ready.then(() => {
    if (!beendet) neuMessen();
  });
  window.addEventListener("load", neuMessen);
  const loops = beobachteLoops();

  return () => {
    beendet = true;
    stoppeWarten();
    loops.stoppen();
    window.removeEventListener("load", neuMessen);
    for (const aufraeumen of aufraeumer.splice(0)) aufraeumen();
    mm.revert();
    ctx.revert();
    gsap.ticker.remove(takt);
    lenis.destroy();
  };
}
```

- [ ] **Step 9: Client-Insel schreiben**

`components/story/StoryBuehne.tsx`:

```tsx
"use client";

import { useEffect } from "react";

/**
 * Die einzige Client-Insel für Bewegung (Spec 6.2). Rendert nichts, findet
 * ihre Ziele über data-story im Server-HTML und lädt GSAP und Lenis erst
 * nach dem Hydrieren. Bei reduzierter Bewegung wird nichts geladen; wechselt
 * die Einstellung zur Laufzeit auf "reduzieren", räumt sie auf und die
 * Endzustände stehen da.
 */
export function StoryBuehne() {
  useEffect(() => {
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stopp: (() => void) | null = null;
    let beendet = false;

    if (!reduziert.matches) {
      import("./bewegung/start")
        .then(({ starteBuehne }) => starteBuehne())
        .then((aufraeumen) => {
          if (beendet || reduziert.matches) aufraeumen();
          else stopp = aufraeumen;
        })
        .catch(() => {
          // Ohne Bewegung ist die Seite vollständig; der CSS-Notfall blendet den Auftakt ein.
        });
    }

    const beiWechsel = () => {
      if (!reduziert.matches) return;
      stopp?.();
      stopp = null;
    };
    reduziert.addEventListener("change", beiWechsel);

    return () => {
      beendet = true;
      reduziert.removeEventListener("change", beiWechsel);
      stopp?.();
      stopp = null;
    };
  }, []);

  return null;
}
```

- [ ] **Step 10: In die Startseite einsetzen**

`app/page.tsx`: Import ergänzen und `<StoryBuehne />` als letztes Kind nach `<Apotheken />`:

```tsx
import { StoryBuehne } from "@/components/story/StoryBuehne";
```

```tsx
      <Apotheken />
      <StoryBuehne />
```

- [ ] **Step 11: Tests, Typecheck, Lint, Build**

Run: `npm test && npm run typecheck && npx eslint . && npm run build`
Expected: grün.

- [ ] **Step 12: Sichtprüfung**

Im Browser `/` neu laden:
- Titel baut sich Wort für Wort auf, dann Tag und Drip, Button „Wähl mit“ ist vom ersten Frame an da.
- SplitText lief und der Name blieb erhalten: `document.querySelector("#auftakt-titel").getAttribute("aria-label")` ergibt `"Grünes Buch"`.
- Scrollen ist geglättet (Lenis): `document.documentElement.classList.contains("lenis")` ist `true`.
- Das Video in Sektion 4 spielt, sobald es in die Nähe kommt.
- Keine Konsolenfehler (`read_console_messages`).

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json app/globals.css app/page.tsx components/story/StoryBuehne.tsx components/story/bewegung tests/bewegung.test.ts
git commit -m "feat: StoryBuehne mit GSAP, SplitText und Lenis, Auftakt-Choreografie, Notfall-Einblendung

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Choreografie Sektionen 2 bis 4 und Vorhang

**Skills:** `build-awwwards-quality-sites`, `animate`, `emil-design-eng`

**Files:**
- Create: `components/story/bewegung/transparent.ts`, `components/story/bewegung/wand.ts`, `components/story/bewegung/schleife.ts`, `components/story/bewegung/vorhang.ts`
- Modify: `components/story/bewegung/start.ts` (`SCROLL_CHOREOGRAFIEN`), `app/globals.css` (`@layer components`)

**Interfaces:**
- Consumes: `Werkzeug`, `Choreografie`, `AB_TABLET` (Task 13); `data-story="manifest" | "buehne-bild" | "notizen" | "wand" | "wand-reihe" | "wand-tag" | "schleife-linie"`, `data-story-vorhang`
- Produces: `transparent`, `wand`, `schleife`, `vorhang` (je `Choreografie`); Klasse `ist-schwenk`

- [ ] **Step 1: Sektion 2**

`components/story/bewegung/transparent.ts`:

```ts
import { AB_TABLET, type Choreografie } from "./typen";

/**
 * Sektion 2: Manifest Wort fuer Wort scroll-gekoppelt (Referenz, ueber
 * Deckkraft statt Farbe, Spec 13), dann ab Tablet der Zoom Blatt, Bluete,
 * Trichom an den Scrollweg der Notizen gekoppelt. Die Buehne klebt per CSS.
 */
export const transparent: Choreografie = ({ gsap, SplitText, mm }) => {
  const manifest = document.querySelector<HTMLElement>('[data-story="manifest"]');
  if (manifest) {
    const woerter = SplitText.create(manifest, { type: "words", tag: "span", aria: "auto" }).words;
    gsap.fromTo(
      woerter,
      { opacity: 0.25 },
      {
        opacity: 1,
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: manifest, start: "top 80%", end: "bottom 45%", scrub: true },
      },
    );
  }

  mm.add(AB_TABLET, () => {
    const notizen = document.querySelector('[data-story="notizen"]');
    const stufen = gsap.utils.toArray<HTMLElement>('[data-story="buehne-bild"]');
    if (!notizen || stufen.length === 0) return;

    const ablauf = gsap.timeline({
      scrollTrigger: { trigger: notizen, start: "top center", end: "bottom center", scrub: true },
    });
    stufen.forEach((stufe, index) => {
      const bild = stufe.querySelector("img");
      if (index > 0) ablauf.fromTo(stufe, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "none" });
      if (bild) ablauf.fromTo(bild, { scale: 1 }, { scale: 1.3, duration: 1, ease: "none" }, "<");
    });
  });
};
```

- [ ] **Step 2: Sektion 3**

`components/story/bewegung/wand.ts`:

```ts
import { AB_TABLET, type Choreografie } from "./typen";

/**
 * Sektion 3: Tags spruehen beim Eintritt auf; ab Tablet pinnt die Wand und
 * vertikales Scrollen schwenkt sie seitlich (Spec 5.1). Darunter bleibt
 * sie gestapelt, ohne Pin.
 */
export const wand: Choreografie = ({ gsap, mm }) => {
  const sektion = document.querySelector<HTMLElement>('[data-story="wand"]');
  const reihe = document.querySelector<HTMLElement>('[data-story="wand-reihe"]');
  if (!sektion || !reihe) return;

  gsap.from(gsap.utils.toArray<HTMLElement>('[data-story="wand-tag"]'), {
    clipPath: "inset(0 100% 0 0)",
    duration: 0.7,
    stagger: 0.2,
    ease: "power2.inOut",
    scrollTrigger: { trigger: reihe, start: "top 80%", once: true },
  });

  mm.add(AB_TABLET, () => {
    sektion.classList.add("ist-schwenk");
    // offsetLeft statt getBoundingClientRect: unabhaengig vom laufenden Versatz.
    const strecke = () => Math.max(0, reihe.offsetLeft + reihe.scrollWidth - sektion.clientWidth);
    gsap.to(reihe, {
      x: () => -strecke(),
      ease: "none",
      scrollTrigger: {
        trigger: sektion,
        start: "top top",
        end: () => `+=${strecke()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    return () => sektion.classList.remove("ist-schwenk");
  });
};
```

CSS in `app/globals.css` innerhalb von `@layer components`:

```css
  /* Schwenk der Wand ab Tablet; die Klasse setzt die StoryBuehne (Spec 5.1, Sektion 3). */
  .ist-schwenk .wand-reihe {
    flex-wrap: nowrap;
    width: max-content;
    column-gap: 20vw;
    padding-inline: 10vw;
  }
```

- [ ] **Step 3: Sektion 4 und Vorhang**

`components/story/bewegung/schleife.ts`:

```ts
import type { Choreografie } from "./typen";

/**
 * Sektion 4: die Schleife zeichnet sich als Linie. Einzige Ausnahme von
 * "nur transform, opacity, clip-path" (Spec 13): eine 1,5-px-Linie in einem
 * kleinen SVG laesst sich nur ueber den Strichversatz zeichnen.
 */
export const schleife: Choreografie = ({ gsap }) => {
  const linie = document.querySelector<SVGCircleElement>('[data-story="schleife-linie"]');
  if (!linie) return;
  gsap.fromTo(
    linie,
    { strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      ease: "none",
      scrollTrigger: { trigger: linie, start: "top 75%", end: "bottom 50%", scrub: true },
    },
  );
};
```

`components/story/bewegung/vorhang.ts`:

```ts
import type { Choreografie } from "./typen";

/**
 * Bruch in der Story: die Wand-Sektionen werden per clip-path von oben
 * aufgedeckt (Spec 4.6), gekoppelt an den Scrollweg beim Eintritt.
 */
export const vorhang: Choreografie = ({ gsap }) => {
  for (const sektion of gsap.utils.toArray<HTMLElement>("[data-story-vorhang]")) {
    gsap.fromTo(
      sektion,
      { clipPath: "inset(0 0 100% 0)" },
      {
        clipPath: "inset(0 0 0% 0)",
        ease: "none",
        scrollTrigger: { trigger: sektion, start: "top bottom", end: "top 40%", scrub: true },
      },
    );
  }
};
```

- [ ] **Step 4: Eintragen**

In `components/story/bewegung/start.ts`:

```ts
import { schleife } from "./schleife";
import { transparent } from "./transparent";
import { vorhang } from "./vorhang";
import { wand } from "./wand";
```

```ts
/**
 * Reihenfolge = Seitenreihenfolge: ScrollTrigger misst in Anlegereihenfolge,
 * und alles unterhalb des Wand-Pins muss nach dem Pin entstehen. Der Vorhang
 * steht deshalb zuletzt, er deckt auch die Abstimmung unter dem Pin auf.
 */
const SCROLL_CHOREOGRAFIEN: readonly Choreografie[] = [transparent, wand, schleife, vorhang];
```

- [ ] **Step 5: Tests, Typecheck, Lint**

Run: `npm test && npm run typecheck && npx eslint .`
Expected: grün.

- [ ] **Step 6: Sichtprüfung**

Im Browser `/` bei voller Breite langsam scrollen:
- Manifest: Wörter werden von blass zu voll, gekoppelt an den Scrollweg.
- Bühne: links wechseln Blatt, Blüte, Trichom und zoomen, rechts laufen die Notizen.
- Wand: der Vorhang deckt sie auf, dann pinnt sie und schwenkt seitlich bis zum letzten Tag, danach geht es normal weiter; kein Sprung beim Lösen.
- Schleife: die Kreislinie zeichnet sich.
- Im iframe mit 390 px (wie Task 9): kein Pin (`f.contentDocument.querySelector(".pin-spacer")` ist `null`), Wand gestapelt, kein horizontales Überlaufen.

- [ ] **Step 7: Commit**

```bash
git add components/story/bewegung app/globals.css
git commit -m "feat: Choreografie Manifest, Feldbuch-Zoom, Wand-Schwenk, Schleife und Vorhang

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Choreografie Sektionen 5, 6 und 9

**Skills:** `build-awwwards-quality-sites`, `animate`, `better-accessibility`

**Files:**
- Create: `components/story/bewegung/eintrag.ts`, `components/story/bewegung/abstimmung.ts`, `components/story/bewegung/schluss.ts`
- Modify: `components/story/bewegung/start.ts`

**Interfaces:**
- Consumes: `data-story="doppelseite" | "spruehmarke" | "waehl-mit" | "abstimmung" | "fuss-tag"`, `[data-zaehler][data-ziel]`, `.schlusszeile-fuellung`
- Produces: `eintrag`, `abstimmung`, `schluss` (je `Choreografie`)

- [ ] **Step 1: Sektion 5**

`components/story/bewegung/eintrag.ts`:

```ts
import type { Choreografie } from "./typen";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Sektion 5: die Doppelseite schlaegt auf (clip-path von der Mitte), die
 * Noten zaehlen einmal hoch (Spec 5.1). Die Ziffern sind aria-hidden, der
 * Endwert steht als sr-only-Text daneben; beim Aufraeumen stehen wieder die
 * Endwerte da.
 */
export const eintrag: Choreografie = ({ gsap }) => {
  const seite = document.querySelector<HTMLElement>('[data-story="doppelseite"]');
  if (!seite) return;
  const zaehler = gsap.utils
    .toArray<HTMLElement>("[data-zaehler]")
    .filter((el) => Number.isFinite(Number(el.dataset.ziel)));

  const ablauf = gsap.timeline({ scrollTrigger: { trigger: seite, start: "top 75%", once: true } });
  ablauf
    .call(() => {
      for (const el of zaehler) el.textContent = NOTE.format(0);
    })
    .from(seite, { clipPath: "inset(0 50% 0 50%)", duration: 1.1, ease: "power3.inOut" });

  for (const el of zaehler) {
    const stand = { wert: 0 };
    ablauf.to(
      stand,
      {
        wert: Number(el.dataset.ziel),
        duration: 1,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = NOTE.format(stand.wert);
        },
      },
      "<0.2",
    );
  }

  return () => {
    for (const el of zaehler) el.textContent = NOTE.format(Number(el.dataset.ziel));
  };
};
```

- [ ] **Step 2: Sektion 6**

`components/story/bewegung/abstimmung.ts`:

```ts
import type { Choreografie } from "./typen";

/**
 * Sektion 6: Spruehmarken und "Waehl mit." spruehen beim Eintritt auf.
 * Die Stimmabgabe selbst bewegt sich nicht (Spec 5.1).
 */
export const abstimmung: Choreografie = ({ gsap }) => {
  const marken = gsap.utils.toArray<HTMLElement>('[data-story="waehl-mit"], [data-story="spruehmarke"]');
  if (marken.length === 0) return;
  gsap.from(marken, {
    clipPath: "inset(0 100% 0 0)",
    duration: 0.7,
    stagger: 0.15,
    ease: "power2.inOut",
    scrollTrigger: { trigger: '[data-story="abstimmung"]', start: "top 70%", once: true },
  });
};
```

- [ ] **Step 3: Sektion 9 (Fuß)**

`components/story/bewegung/schluss.ts`:

```ts
import type { Choreografie } from "./typen";

/**
 * Sektion 9: die Schlusszeile steht als Kontur und fuellt sich Wort fuer
 * Wort scroll-gekoppelt (Referenz); das grosse Tag sprueht einmal.
 * aria "none": beide sichtbaren Ebenen sind aria-hidden, vorgelesen wird
 * die sr-only-Fassung im Fuss.
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

  const tag = document.querySelector<HTMLElement>('[data-story="fuss-tag"]');
  if (tag) {
    gsap.from(tag, {
      clipPath: "inset(0 100% 0 0)",
      duration: 1.2,
      ease: "power2.inOut",
      scrollTrigger: { trigger: tag, start: "top 95%", once: true },
    });
  }
};
```

- [ ] **Step 4: Eintragen**

In `components/story/bewegung/start.ts` die Imports `abstimmung`, `eintrag`, `schluss` ergänzen und:

```ts
const SCROLL_CHOREOGRAFIEN: readonly Choreografie[] = [
  transparent,
  wand,
  schleife,
  eintrag,
  abstimmung,
  schluss,
  vorhang,
];
```

(der Kommentar zur Reihenfolge aus Task 14 bleibt darüber stehen).

- [ ] **Step 5: Tests, Typecheck, Lint, Build**

Run: `npm test && npm run typecheck && npx eslint . && npm run build`
Expected: grün.

- [ ] **Step 6: Sichtprüfung**

Im Browser `/` bis zum Ende scrollen:
- Doppelseite öffnet sich von der Mitte, die vier Noten zählen hoch und enden auf den echten Werten (mit `innerText` der `sr-only`-Spans vergleichen).
- Stimmzettel: Sprühmarken und „Wähl mit.“ sprühen auf; Abstimmen funktioniert unverändert.
- Fuß: die Schlusszeile füllt sich Wort für Wort, das große Tag sprüht einmal.
- Auf `/produkte` wechseln und zurück zu `/`: keine Konsolenfehler, Animationen laufen erneut (Aufräumen und Neustart).

- [ ] **Step 7: Commit**

```bash
git add components/story/bewegung
git commit -m "feat: Choreografie Doppelseite, Abstimmung und Schlusszeile

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Prüfung, Übergabe, Live-Gang

**Skills:** `superpowers:verification-before-completion`, `interface-review`, `web-design-guidelines`, `design-taste-frontend` (Pre-Flight), `build-awwwards-quality-sites` (Validierung), `cloudflare:web-perf`, `better-accessibility`, `edge-stack-master` (Abschluss-Checkliste), `superpowers:finishing-a-development-branch`

**Files:**
- Modify: nur, was die Prüfung als Befund ergibt; `HANDOFF.md`

**Interfaces:**
- Consumes: alles aus Tasks 1 bis 15
- Produces: Prüfbericht (im Chat), aktualisiertes `HANDOFF.md`, nach Go: `main` mit dem Makeover, live

- [ ] **Step 1: Automatische Prüfungen (Akzeptanz 1)**

Run: `npm test && npm run farben && npm run typecheck && npx eslint . && npm run build`
Expected: alles grün.

- [ ] **Step 2: JS-Budget messen (Akzeptanz 8, ≤ 60 KB gz)**

```bash
node -e "const fs=require('fs'),z=require('zlib'),p='.next/static/chunks';let s=0;for(const f of fs.readdirSync(p,{recursive:true})){if(!String(f).endsWith('.js'))continue;const b=fs.readFileSync(p+'/'+f),t=b.toString();if(/ScrollTrigger|SplitText|lenis|starteBuehne|einstieg|data-story/.test(t)){const g=z.gzipSync(b).length;s+=g;console.log(String(f).padEnd(60),g)}}console.log('gesamt gz',s)"
```

Expected: `gesamt gz` ≤ 61440. Darüber: Befund nennen und dem Nutzer vorlegen (nicht eigenmächtig Plugins streichen).

- [ ] **Step 3: Browserprüfungen (Akzeptanz 2 bis 7, 9, 12)**

Mit dem Browser-Werkzeug auf `http://localhost:3000` (Dev-Server) jeweils per `javascript_tool`:

1. **Satzzeichen im gerenderten Text:** `/—| – /.test(document.querySelector("main").innerText + document.querySelector("footer").innerText)` ist `false`.
2. **Ohne JavaScript vollständig:**
   ```js
   fetch("/").then((r) => r.text()).then((html) => {
     const d = new DOMParser().parseFromString(html, "text/html");
     return {
       ueberschriften: [...d.querySelectorAll("main h1, main h2")].map((h) => h.textContent.trim()),
       abstimmung: !!d.querySelector("#abstimmung form, #abstimmung a[href^='/anmelden'], #abstimmung p"),
       inlineUnsichtbar: d.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]').length,
     };
   });
   ```
   Expected: acht Überschriften (Auftakt bis Apotheken), `abstimmung: true`, `inlineUnsichtbar: 0`. Die CSS-Seite ist durch `tests/bewegung.test.ts` abgedeckt.
3. **Reduzierte Bewegung:** Den Nutzer bitten, in Windows „Einstellungen, Barrierefreiheit, Visuelle Effekte, Animationseffekte“ auszuschalten. Neu laden, dann: `document.querySelector("#auftakt-titel").hasAttribute("aria-label")` ist `false` (SplitText lief nicht), `document.documentElement.classList.contains("lenis")` ist `false`, und `read_network_requests` zeigt keine der Chunks aus Step 2. Alle Sektionen sichtbar. Danach den Nutzer bitten, die Einstellung zurückzustellen.
4. **Tastatur:** Reihenfolge der Bedienelemente:
   ```js
   [...document.querySelectorAll("a[href], button, input, summary")].filter((e) => e.offsetParent).map((e) => e.textContent.trim().slice(0, 30))
   ```
   Expected: Skip-Link, Wortmarke, Navigation, „Wähl mit“, Katalog-Einstiege und Karten, Apotheken, Fuß. Mit Tab stichprobenartig durchgehen: Fokus überall sichtbar. `#auftakt-titel` hat den Namen „Grünes Buch“, das Manifest seinen ganzen Satz.
5. **Hell und dunkel:** mit `document.documentElement.dataset.theme = "dark"` alle Sektionen durchscrollen; Bilder hell auf dunkel, Masken in `spray-400`, keine unlesbaren Flächen. Danach `delete document.documentElement.dataset.theme`.
6. **1440 px und 390 px:** Überlauf-Messung wie Task 9 und Task 12 (lange Namen) im iframe; `.pin-spacer` im 390-px-iframe `null`.
7. **LCP und CLS:**
   ```js
   new Promise((fertig) => {
     let cls = 0; let lcp = 0;
     new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true });
     new PerformanceObserver((l) => { const e = l.getEntries().at(-1); lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
     setTimeout(() => fertig({ lcp: Math.round(lcp), cls: Math.round(cls * 1000) / 1000 }), 3000);
   });
   ```
   Expected: `lcp` < 2500, `cls` < 0.1 (Dev-Server ist langsamer als live; die Live-Werte in Step 8 sind maßgeblich).
8. **Medien der ersten Ansicht:** `performance.getEntriesByType("resource").filter((e) => e.name.includes("/medien/") && e.startTime < 3000).reduce((s, e) => s + e.transferSize, 0)` ≤ 409600.
9. **Bestehende Seiten:** `/reviews`, `/umfragen`, `/produkte`, `/admin` laden ohne Konsolenfehler (`read_console_messages`), lesbar mit den neuen Tokens.

Jeder nicht ausführbare Punkt wird im Bericht als „nicht verifiziert“ genannt.

- [ ] **Step 4: Inhaltliche Durchsicht (Akzeptanz 10, 11)**

- Leitplanken 1 bis 7 gegen alle neuen Texte (`grep -rn ">" components/story components/layout components/marke` lesen) und alle Dateien in `public/medien/` (mit dem Read-Tool ansehen).
- Reviews in dieser Reihenfolge laden und anwenden: `interface-review`, `web-design-guidelines`, Pre-Flight-Liste von `design-taste-frontend`, Validierung aus `build-awwwards-quality-sites`, Abschluss-Checkliste aus `edge-stack-master` und aus `ui-design-engine`.
- Befunde beheben (je Befund ein Commit `fix: …`, danach Step 1 erneut) oder mit Begründung als offen festhalten.

- [ ] **Step 5: HANDOFF aktualisieren und committen**

In `HANDOFF.md` unter „Hier geht es weiter“: Makeover Teilprojekt 1 umgesetzt auf `makeover/gruenes-buch`, Prüfbericht in Kurzform (grün, nicht verifiziert, offene Befunde), nächster Schritt „Go für den Live-Gang“, danach Teilprojekt 2 (eigene Spec für die übrigen Seiten).

```bash
git add HANDOFF.md
git commit -m "docs: HANDOFF - Makeover Teilprojekt 1 umgesetzt, Pruefbericht, Go ausstehend

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Go des Nutzers einholen**

Dem Nutzer den Prüfbericht vorlegen und fragen: „Go für den Live-Gang? Und ist Citrix getrennt?“ Ohne beides kein Push.

- [ ] **Step 7: Nach dem Go: zusammenführen und pushen**

```bash
git switch main
git merge --ff-only makeover/gruenes-buch
git push origin main
```

Expected: Push erfolgreich. Bei Netzfehler: nicht wiederholen, melden (Memory `netzwerk-schonen`).

- [ ] **Step 8: Live prüfen (einmal, kein Polling)**

Nach Rückmeldung des Nutzers, dass der Build durch ist (oder einmal im Dashboard unter Worker, Deployments nachsehen): `https://cn-medcan.w-helwich.workers.dev/` mit Passwort-Cookie im Browser öffnen.
- **Leere Datenbank (Review Focus 1):** Die Cloud-D1 ist leer. Erwartet: Wand mit „Schlag vor.“, „Stimm ab.“, „Lies mit.“; Eintrag „Das erste Kapitel wird gerade geschrieben.“; Abstimmung „Gerade läuft keine Runde …“; Katalog-Leerzustand. Keine Konsolenfehler.
- LCP und CLS wie Step 3.7, jetzt maßgeblich.
- `/reviews`, `/umfragen`, `/produkte`, `/admin` (307 ohne Anmeldung) wie bisher.

- [ ] **Step 9: Session abschließen**

`HANDOFF.md` mit dem Live-Stand ergänzen (nur diese Datei: löst keinen Build aus), committen, pushen, dem Nutzer sagen, dass gecleart werden kann (Memory `periodic-session-handoff`).

---

## Ausfuehrungsprotokoll (aus dem Ledger uebernommen, 2026-09-24)

Der Ledger unter `.superpowers/sdd/` wurde nach dem Live-Gang geloescht. Seine Entscheidungen
(Rulings), offenen Befunde und zurueckgestellten Kleinigkeiten stehen hier, damit Teilprojekt 2
sie kennt. Wortlaut unveraendert.

- Setup: Ruling: kein Git-Worktree, sondern Branch makeover/gruenes-buch im Repo (Plan Task 1 Step 1) — ein Worktree braeuchte ein zweites npm install (Netz schonen, Memory) — Kosten falls falsch: Arbeit liegt im Hauptarbeitsverzeichnis, main bleibt unberuehrt bis zum Go.
- Setup: Ruling: keine Harness-Todos (kein Todo-Werkzeug verfuegbar), Fortschritt nur im Ledger — Kosten falls falsch: keine.
- Task 1: Ruling: Guideline vorab committet statt in einem Commit mit ui-design-engine (Plan Step 6) — Nutzer wollte mitten im Task clearen, Arbeit sichern — Kosten falls falsch: ein Commit mehr im Branch.
- Task 1: Ruling: ui-design-engine.md Regel 9 zitierte das verbotene Zeichen als Glyphe, Plan-Expected verlangt aber 0 Treffer fuer "—" — Zeichen per Name und Codepunkt benannt (U+2014, U+2013), Regel inhaltlich gleich — Kosten falls falsch: eine Zeile Wortlaut.
- Task 3: Ruling: `npx eslint .` brach mit heap out of memory ab (zwei worker.js >1 MB in .wrangler/tmp aus frueherem preview) — `.wrangler/**` in globalIgnores von eslint.config.mjs aufgenommen, mit Task 3 committet (Datei nicht in der Plan-Liste) — Kosten falls falsch: eine Ignore-Zeile.
- Task 3: Ruling: Sichtpruefung Step 7 nur per HTTP (Seiten 200, Schriftvariablen am html, Tokens/Klassen im ausgelieferten CSS), Browser-Erweiterung nicht verbunden — Blickpruefung hell/dunkel und Konsole nachholen, sobald der Browser verbunden ist (spaetestens vor dem Final Review) — Kosten falls falsch: ein Darstellungsfehler faellt spaeter auf.
- Task 3: Hinweis: Dateien mit CRLF (z. B. app/layout.tsx) beim Schreiben per Skript nicht auf LF umstellen; Repo ist gemischt (git ls-files --eol).
- Task 4: Ruling: `duration-fast` (Plan T4, spaeter T9/T13-Zeilen) erzeugte keine Klasse, Tailwind v4 liest duration-* aus --transition-duration-* — in @theme --transition-duration-fast/normal/slow: var(--duration-*) ergaenzt; --duration-* bleibt fuer var()-Nutzung — Kosten falls falsch: drei Alias-Zeilen. Gilt fuer alle spaeteren duration-fast/normal/slow im Plan.
- Task 4: Ruling: Sekundaerbutton hatte keinen sichtbaren Rahmen (border-transparent in BASIS schlug border-border-strong, cn() ohne tailwind-merge) — border-transparent aus BASIS in primary/ghost verschoben, Test "Sekundärbutton behält seinen sichtbaren Rahmen" RED->GREEN — Kosten falls falsch: keine, Verhalten der anderen Varianten gleich.
- Task 4: Ruling: Verfuegbarkeits-Badge brach in der Pille zweizeilig um ("1 / Apotheke") — whitespace-nowrap im Badge, Test "Badge bricht als Pille nicht um" RED->GREEN — Kosten falls falsch: sehr lange Badge-Texte koennten ueberstehen (heute nur kurze).
- Task 5: Ruling: sharp nicht in package.json aufgenommen, die Pipeline nutzt das transitiv vorhandene sharp 0.35.4 (keine zusaetzliche npm-Installation, Memory netzwerk-schonen) — Kosten falls falsch: faellt sharp aus dem Baum, bricht nur die Entwicklungszeit-Pipeline; dann sharp als devDependency eintragen.
- Task 6: Ruling: Trichom 30439065 (helles Makro) statt Spec-Kandidat 30682041 (dunkler Grund) — Plan-Regel 2: dunkler Grund nur, wenn es kein helles Makro gibt — Kosten falls falsch: ein Foto tauschen.
- Task 6: Ruling: Drip 4862581 (gelbe Laeufe auf Orange, maskeUmkehren) statt Spec-Kandidat 11016984 — dessen Maske faerbt die ganze Flaeche halbdeckend (Rosa auf Rosa, Laeufe nur als Relief), Regel 3 verlangt klare Trennung — Kosten falls falsch: eine Maske tauschen.
- Task 6: Ruling: Leitobjekt 8534174 (Notizbuch, Blatt, Lilie, Stift auf Weiss, hochformatig); 479817 kam in der Suche nicht vor. Bluete 20288575, Nebel 1193879 (Sprenkel), Marmor 33199141 (dunkle Schlieren auf hellem Grund), Video 12361112 (Spec).
- Task 6: Ruling: Richtwerte ueberschritten und vom Nutzer so akzeptiert ("zu viel Aufwand, mach weiter"): nebel-maske.png 533 KB, marmor-maske.png 1081 KB (Richtwert 150), pflanze-loop.mp4 5,2 MB (Richtwert 3 MB), Standbild 188 KB — Kosten falls falsch: CSS-Masken laden sofort beim Rendern, auch ausserhalb des Sichtfelds, und zaehlen damit ins 400-KB-Budget der Startseite -> in Task 15 (web-perf) pruefen. Erprobte Loesung liegt bereit: Masken 3:2-Zuschnitt + 16 Alpha-Stufen (sichtbar verlustfrei, Marmor ~121 KB, Nebel ~235 KB); Video mit ffmpeg (imageio_ffmpeg: C:\Users\w.helwich\AppData\Roaming\Python\Python314\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe) ohne Ton, grau, Quadrat 540 (Loop erscheint nur 288x288), 12 s, CRF 26 -> 1,68 MB, im Einzelbild ohne sichtbaren Unterschied.
- Task 6: Hinweis: package.json ohne "type": "module" -> .ts-Skripte sind CJS, kein Top-Level-await (Pipeline nutzt main(), ok).
- Task 7: Ruling: Plan setzte das grosse Fuss-Tag zwischen Schlusszeile und Rechtshinweis; durch Drehung (eigene Ebene) und margin-bottom -0.28em verdeckte es Rechtshinweis und Wortmarke (im Browser gesehen) — Tag ans Ende des Fusses verschoben, Spec 4.3 "laeuft angeschnitten aus dem Bild" — Kosten falls falsch: Reihenfolge im Fuss. Spaetere Tasks (StoryBuehne) greifen per data-story="fuss-tag" zu, Reihenfolge egal.
- Task 9: Ruling: Leitobjekt 5712437 (Kraftpapier-Spiralheft mit Ahornblatt und Stift, quer 4000x2670) statt 8534174 — 8534174 (weiss auf weiss) verschwand im Auftakt: hell graues Rechteck, dunkel unsichtbar; Spec-Heft 479817 liegt auf dunkelgruenem Grund (Regel 2). Abweichung von Plan-Regel 4 "hochformatig oder quadratisch" bewusst: quer passt in die Titelhoehe — Kosten falls falsch: ein Foto tauschen.
- Task 9: Ruling: Weissabgleich in zuGraustufenWebp (Randmedian >= 180 -> linear auf Weiss; dunkler Grund unveraendert), zwei Tests RED->GREEN bzw. Schutztest — Spec 4.5 verlangt Verschmelzen mit dem Papier — Kosten falls falsch: Fotos minimal heller; Fotos neu erzeugt (4 Downloads).
- Task 9: Ruling: Plan-Code isolierte das Mischen (Wrapper z-10 + -translate-y-1/2 = eigener Stapelkontext; isolate am Seiten-Wrapper ohne Hintergrund) — Wrapper per inset-y-0 my-auto h-fit ohne z/transform, Seiten-Wrapper bg-surface, weicher Rand mask-radial-closest-side from-70% (Tailwind 4.3; die Arbitrary-Klasse [mask-image:...] erzeugte Tailwind nicht) — Kosten falls falsch: keine.
- Task 9: Ruling: --text-auftakt clamp(4.5rem, 23.3vw, 22rem) statt 20vw/21rem — gemessen GRUENES = 3.818 x Schriftgroesse; Schnittmenge fuer 92-100 % bei 390/640/768/1024/1440 ist 23.0-23.6vw — gemessen: 1148 px Fenster 95.5 %, 2296 px 93 %, 390er-iframe 101 % nur wegen klassischer 15-px-Scrollleiste (echte Handys ~97 %) — Kosten falls falsch: Titel an einer Breite knapp.
- Task 10: Ruling: Buehnenbilder liegen per multiply uebereinander, ein oberes verdeckt ein unteres nicht (im Browser gesehen: Gemisch, Blatt lugt unten vor) — statisch nur das letzte sichtbar ([data-story="buehne-bild"]:not(:last-child){opacity:0} in globals.css), Plan-Satz "ohne Bewegung steht das letzte oben" damit erfuellt — Kosten falls falsch: keine. FUER TASK 15: Choreografie muss Bild 1 anfangs auf opacity 1 setzen und beim Einblenden des naechsten den Vorgaenger ausblenden (sonst bleibt Bild 1 unsichtbar bzw. schimmert durch).
- Task 10: Ruling: Wand-Texturen standen als harte lila Rechtecke hinter den Tags (im Browser gesehen) — Textur um weich (radial-gradient als zweite Maskenebene, mask-composite intersect) erweitert, Test RED->GREEN, in WissenBuendeln genutzt; spaetere Texturen hinter Text (z. B. spruehmarke in Task 11/12) ebenfalls weich — Kosten falls falsch: eine Prop.
- Task 11: Ruling: Netzdiagramm ohne Hover-Tooltip (dataviz-Standard) — Plan/Spec sehen Werte als sr-only-Liste vor, einzelne Reihe, redaktionelle Grafik — Kosten falls falsch: Sehende koennen Einzelwerte nicht ablesen; im Final Review bewerten.
- Task 11: Ruling: Kreis der Schleife blieb statisch ~20 % offen — vectorEffect non-scaling-stroke + pathLength=1/strokeDasharray=1 rechnen in verschiedenen Raeumen — vectorEffect am Kreis entfernt (Strich skaliert leicht mit, ~1.9 px) — Kosten falls falsch: minimal dickere Linie; Task 15 animiert strokeDashoffset weiter korrekt.
- Task 11: Befund fuer Final Review/Nutzer: Die Notiz der neuesten Review (Freitext des Betreibers) erscheint auf der Startseite; der Seed-Text nennt "kaum psychoaktive Wirkung". Spec 2 haelt die Wirkung-Note von der Startseite fern, Freitext ist ungefiltert -> HWG-Risiko pruefen (z. B. Notiz nur im vollstaendigen Eintrag).
- Task 12: Ruling: Drip unter "Waehl mit." lag als lila Balken ueber dem Fliesstext (im Browser gesehen) — -z-10 (Sektion ist isolate), Text liegt jetzt davor — Kosten falls falsch: keine.
- Task 12: Ruling: Stimmzettel-Namen in der Wand-Darstellung in Cormorant 500 (font-buch text-h3) statt Geist wie im Plan-Code — Plan-Step 7 und Brand Guideline 10 ("Handelsname in Cormorant auf dem Stimmzettel") verlangen Buch-Typo — Kosten falls falsch: eine Klasse. Sprühmarke hinter wählbaren Namen mit weich (Ruling Task 10).
- Task 12: Nicht verifiziert: Stimmzettel-Zustaende (Stempel, Spruehmarke, ANONYM/ABGESTIMMT) — lokal laeuft keine Runde; Render-Test scheitert am server-only-Import der Server Action. Geprueft: Anker #abstimmung, Leerzustand, Wasserzeichen, /umfragen unveraendert, Katalog-Reihe (6), lange Namen bei 390 ohne Ueberlauf.
- Task 13: Hinweis: npm install meldete 4 high severity vulnerabilities (bestehende Abhaengigkeiten, nicht gsap/lenis geprueft) — nicht angefasst, dem Nutzer melden. npm audit lief einmal (Registry-Abfrage).
- Task 13: Ruling: Fehlstart im Browser gemessen (kein Lenis, kein SplitText, Unterzeile/Intro blieben opacity 0, keine Konsolenfehler, weil .catch schluckt) — Ursache: Strict-Mode-Doppeleffekt, beendet wurde erst nach starteBuehne() geprueft; zwei Buehnen liefen, Aufraeumen der ersten zerlegte die zweite — Pruefung vor den Start gezogen; in der Entwicklung loggt .catch den Fehler — Kosten falls falsch: keine (Produktion hat keinen Doppeleffekt).
- Task 13: OFFEN: Sichtpruefung Step 12 nach der Korrektur (aria-label "Grünes Buch", Klasse lenis, Titel Wort fuer Wort, Video spielt, Konsole) — Browser-Erweiterung getrennt; vor dem Final Review nachholen. Dev-Server starb waehrend/nach next build (Exit 4), neu gestartet.
- Task 14: Ruling: Buehnen-Ablauf (Plan: nur Bild 2/3 von 0 auf 1) umgebaut — gsap.set Ausgangslage nur Bild 1 sichtbar, beim Einblenden des naechsten Vorgaenger auf 0 (multiply mischt sonst; CSS aus Task 10 blendet ohne Bewegung alle ausser dem letzten aus) — erledigt damit den "FUER TASK 15"-Vermerk aus Task 10 — Kosten falls falsch: Ablauf wirkt anders als geplant.
- Task 14: OFFEN: Sichtpruefung Step 6 (Manifest, Buehne, Wand-Pin/Schwenk ohne Sprung, Schleife, 390 px ohne Pin) — Browser getrennt; zusammen mit Task 13/15 nachholen.
- Task 15: OFFEN: Sichtpruefung Step 6 (Doppelseite von der Mitte, Noten zaehlen auf Endwerte, Spruehmarken, Schlusszeile fuellt sich, Fuss-Tag, Wechsel /produkte und zurueck ohne Konsolenfehler) — zusammen mit Task 13/14 nachholen.
- Final: Ruling: Stimmzettel/Katalog-Fehler (Spec: "wie heute"/"–") trotzdem abgefangen — ein DB-Aussetzer soll nicht die ganze Startseite kosten (vernuenftige Erwartung) — Kosten falls falsch: ein Satz statt Fehlerseite.
- Final: minor (deferred): Ladetexte ohne "…" (Skelette.tsx, TransparentMachen Suspense-Fallback).
- Final: minor (deferred): kein <meta name="theme-color">; Marke ohne translate="no".
- Final: minor (deferred): NeuesterEintrag/WissenBuendeln koennten sicher() statt eigenem try/catch nutzen (DRY).
- Final: minor (deferred): Drips (Auftakt, "Waehl mit.") wirken als blasse Balken statt Laeufe; Netzdiagramm ohne Hover-Werte.
- Final: OFFEN fuer Nutzer: Video-Loop spielt >5 s ohne Pause-Moeglichkeit (WCAG 2.2.2; bei reduzierter Bewegung spielt er nicht); Notiz-Freitext auf der Startseite (HWG, Seed nennt "Wirkung"); /interface-review nur vom Nutzer startbar; 4 high npm-audit-Meldungen in bestehenden Abhaengigkeiten.
- Task 16 Step 8: live geprueft (2026-09-24, einmal, kein Polling): / 200 mit Leitsaetzen, "Das erste Kapitel ...", "Gerade laeuft keine Runde ...", Katalog-Leerzustand; LCP 364 ms (Leitobjekt), CLS 0, TTFB 150 ms; Medien erste Ansicht 551 KB bei 2296-px-Fenster (bekannt, Nutzer informiert); /reviews, /umfragen, /produkte Leerzustaende ohne Konsolenfehler; /admin -> /anmelden. Hintergrund-Tab gibt Suspense-Inhalte erst frei, wenn sichtbar (Chrome), dort kein LCP.
- Final: fixed Kopfzeile Sektion 2 (Stand) fing Fehler von neuesteRedaktionelleReview nicht ab -> Seite kippte trotz Fehlergrenze in Sektion 5; dazu Stimmzettel und Katalog-Reihe — tests/sicher.test.ts RED->GREEN, suite 40/40.
- Final: fixed Auftakt: Unterzeile/Intro blieben opacity 0 (from() las Ziel 0 aus CSS-Einstieg) — Browser vorher 0/1/1/0 nach 5 s, nachher 1/1/1/1 (kein Unit-Test moeglich: GSAP im Browser).
- Final: fixed Hydrierungs-Meldungen auf / (GSAP-Inline-Styles vor der Hydrierung gestreamter Sektionen) — Start per requestIdleCallback; Browser vorher 4 Hydration-Errors, nachher keine; Seitenwechsel /produkte und zurueck raeumt auf und startet neu, Konsole leer.
- Task 13/14/15: Sichtpruefung nachgeholt: SplitText mit aria-label, Lenis, Manifest scrollgekoppelt, Buehne 1/0/0 -> 0/0.86/0.14, Wand-Pin haelt (Schwenk nur 6 px bei 3 kurzen Tags: Designfolge), Schleife gezeichnet, Zaehler enden auf Endwerten, Schlusszeile gefuellt, Fuss-Tag gesprueht, 390 px ohne Pin/Ueberlauf.
- Task 16 Step 3: Satzzeichen ok, ohne JS vollstaendig (8 Ueberschriften, Abstimmung, 0 inline unsichtbar), Tastatur-Reihenfolge ok, Fokus 2px focus-ring (Chrome rundet bei Zoom 1.25 auf 1.6), LCP 2012 ms (Leitobjekt, Dev, TTFB 1240), CLS 0, bestehende Seiten ohne Fehler. Reduzierte Bewegung: nicht verifiziert (Nutzer liess Animationseffekte an). Medien der ersten Ansicht: ~2,1 MB bei 2296-px-Fenster (Masken 1,6 MB laden beim Rendern, Standbild 188 KB) statt <= 400 KB -> Nutzer entscheidet.
- Final: fixed Mediengewicht (Nutzerentscheidung "erst verkleinern"): Masken 3:2 + 16 Stufen, Standbild quadratisch 576 — Tests Maske 3:2, 16 Stufen, Standbild-Quadrat RED->GREEN, suite 43/43; zusammen 1908 -> 453 KB. Erste Ansicht bleibt je nach Fensterbreite ueber 400 KB (Fotos der Buehne laden frueh, Masken beim Rendern) — weiteres Sparen nur per verzoegertem Laden der Masken.
