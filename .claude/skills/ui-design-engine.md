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
- Du + Ich. Neue Texte ohne Geviertstrich (U+2014) und ohne Gedankenstrich (U+2013) als Trenner. Keine Füllverben, keine erfundenen Zahlen.
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
