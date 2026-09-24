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
