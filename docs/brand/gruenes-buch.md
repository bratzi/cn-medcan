# Grünes Buch: Brand Guideline

Stand 2026-09-24. Quelle der Entscheidungen: `docs/superpowers/specs/2026-09-23-makeover-gruenes-buch-design.md`.
Code-Regeln dazu: `.claude/skills/ui-design-engine.md`. Tokens: `app/globals.css` (geprüft mit `npm run farben`).

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
- Verboten: Wortmarke in Sedgwick, Tag in Blattgrün, Tag ohne Kontur auf Fotos, verzerren, Schatten,
  Verläufe (einzige Ausnahme: der Holo-Schimmer auf dem Aufkleber beim Hover).

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
| `spray-400` | 0.72 0.15 305 | #bb8aef |
| `spray-500` | 0.52 0.20 305 | #853dc2 |
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
| `accent-hover` (neu) | blatt-700 | blatt-500 |
| `accent-fg` | neutral-0 | neutral-1000 |
| `accent-subtle` | blatt-100 | blatt-900 |
| `spray` (neu, nur Wand) | spray-500 | spray-400 |
| `spray-fg` (neu) | neutral-0 | neutral-1000 |
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
| spray als Text / surface | 5.06 | 7.33 |
| spray-fg / spray | 5.94 | 7.66 |
| danger / surface | 5.01 | 6.74 |
| danger-fg / danger | 5.88 | 7.04 |
| success / surface | 4.73 | 8.76 |
| success-fg / success | 5.56 | 9.15 |
| warning-Rahmen / surface (3.0) | 3.08 | 10.18 |
| warning-fg / warning | 5.40 | 10.63 |
| text / accent-subtle | 13.59 | 12.07 |

Regeln: Blattgrün ist der einzige Bedienakzent, genau eine gefüllte Primäraktion pro Ansicht.
Einzige Ausnahme außerhalb der Bedienung ist der Titel „Grünes Buch“ im Auftakt. Sprühviolett ist
Material der Wand und erscheint nie auf Buttons, Links oder Fokus. Datengrafiken stehen in Tinte
(`text`), nicht in Grün. Kein reines Schwarz oder Weiß.

## 4. Typografie

| Rolle | Schrift | Schnitte | Einsatz |
|---|---|---|---|
| Buch-Display | **Cormorant Garamond** | 300, 300 italic, 500 | 300: Kapitel, Manifest, große Zitate; 500: randfüllender Titel im Auftakt und die Schlusszeile (die Referenz setzt ihren Titel in 400, nicht light); nur ab 40 px |
| Text und Bedienung | **Geist** (vorhanden) | variabel | Fließtext, Buttons, Formulare, Navigation |
| Messwerte | **Geist Mono** (vorhanden) | variabel | Noten, Chargen, Zahlen (`tabular-nums`) |
| Wand | **Sedgwick Ave Display** | 400 | Tags, Wand-Überschriften, „Wähl mit“; nie Fließtext, Daten, Formulare, Namen |

| Token | Wert | Zeilenhöhe | Schrift |
|---|---|---|---|
| `text-titel` | `clamp(3.5rem, 2rem + 6vw, 8rem)` | 1.05 | Cormorant 300 |
| `text-kapitel` | `clamp(2.5rem, 1.5rem + 3.5vw, 5rem)` | 1.1 | Cormorant 300 |
| `text-tag` | `clamp(2rem, 1rem + 4vw, 5rem)` | 1.1 | Sedgwick Ave Display |
| `text-auftakt` | `clamp(4.5rem, 20vw, 21rem)` | 0.86 | Cormorant 500 |
| `text-wortmarke` | `1.75rem` | 1 | Cormorant 500 |

Betonung über die Kursive derselben Familie. Tags in natürlicher Schreibung, nie per `text-transform`.
Verboten: Sedgwick für Fließtext, Daten, Formulare, Namen; Cormorant 300 unter 40 px; mehr als
drei Schriftgrade je Sektion.

## 5. Formen und Raster

Pillen für Buttons, Chips, Badges, Filter-Einstiege. Alles andere eckig wie Buchseiten (Flächen,
Karten, Bilder, Eingabefelder, Tabellen). Ein einziger Bogen: der Rahmen um das Netzdiagramm im
neuesten Eintrag. 8-px-Raster wie bisher. Schatten nur als Ebenen-Signal, Farbton 165.
Feldbuch-Raster hinter der Startseite: Spalten in `border`, 10 ab 1080 px, 4 darunter.

## 6. Bildsprache

Motive vor hellem Grund, in Graustufen: Blatt, Pflanze, Anbau, Labor, Trichom-Makro, Notizbuch.
Hell: multiply auf Papier. Dunkel: invert plus screen. Wand-Texturen (Drips, Nebel, Marmorierung)
sind Alpha-Masken, eingefärbt in `spray`. Videos: höchstens zwei, stumm, mit Standbild, erst in der
Nähe geladen. Quelle nur Pexels, selbst gehostet, jede Datei in `lib/medien.ts` mit Urheber,
Nachweis im Fuß. Ausgeschlossen: Konsum (Joints, Bongs, Rauch, Konsumierende), Figuren, Blüten mit
erkennbarem Handelsnamen, Schriftzüge im Bild („MEDICINE“), fremde Graffiti-Tags.

## 7. Bewegung

- Jede Animation lässt sich in einem Satz begründen (Hierarchie, Erzählung, Rückmeldung,
  Zustandswechsel). Sonst entfällt sie.
- Buch bewegt sich ruhig: Zeilen und Wörter blenden gestaffelt ein, Bilder zoomen gekoppelt
  an den Scrollweg. Wand bewegt sich roh: Tags werden „gesprüht“ (Maske wischt auf),
  Drips laufen einmal nach unten.
- Nur `transform`, `opacity`, `clip-path`, Masken-Position. Keine Endlosschleifen außer den
  Video-Loops.
- `prefers-reduced-motion: reduce`: GSAP und Lenis werden **nicht geladen**, alle Endzustände
  stehen sofort da.
- Hover, Fokus und Tippen per CSS; ScrollTrigger nur für gepinnte oder gekoppelte Abläufe.
- Hover-Übergänge kurz: 0,18 bis 0,35 s, nur Farbe, Deckkraft, Unterstrichfarbe. Bilder
  wechseln beim Hover von Graustufen zu Farbe (0,7 s), nur dort, wo ein Foto Farbe hat.
- Sektionswechsel als Vorhang: der neue Abschnitt wird per `clip-path: inset()` von oben
  aufgedeckt.

Präzisierungen: Die Einfärbung des Manifests läuft über Deckkraft, nicht über Farbe. Die Schleife
in Sektion 4 zeichnet sich über den Strichversatz; das ist die einzige Ausnahme von „nur transform,
opacity, clip-path, Masken-Position“.

## 8. Tonalität und Sprache

Du + Ich. Buch-Texte sachlich und warm, ganze Sätze. Wand-Texte kurz, Imperativ („Wähl mit.“,
„Schlag vor.“). Kein Geviertstrich, kein Gedankenstrich als Trenner. Keine Füllverben
(„revolutionieren“, „nahtlos“), keine erfundenen Zahlen. Verbotene Wörter: high, stoned, dank,
420, Heilung, heilt, wirkt gegen.

## 9. Leitplanken HWG und Jugendschutz

1. **Kiffer-Anmutung nur in Form, Schrift und Textur, nie in Aussagen.** Kein „high“,
   „stoned“, „dank“, kein 420, keine Aussagen über Wirkung oder Heilung.
2. **Kein Konsum im Bild:** keine Joints, Bongs, Rauchschwaden, Konsumierenden.
3. **Keine Maskottchen, Comicfiguren, Zauberer** (Jugendschutz).
4. **Handelsnamen nie als Graffiti.** Namen stehen immer in Buch-Typografie.
5. **Keine Blüten, die einem Handelsnamen zuzuordnen sind**; Pflanze, Blatt, Anbau, Labor,
   Makro von Trichomen sind erlaubt.
6. **Preise und Bestände** bleiben hinter der Freigabe (bestehende Logik, unverändert).
7. **Rechtshinweise** stehen sachlich in Buch-Typografie, nie als Wand.

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
