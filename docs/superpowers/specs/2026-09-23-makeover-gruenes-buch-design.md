# Makeover „Grünes Buch“ – Teilprojekt 1: Brand Guideline, Tokens, Startseite

**Stand:** 2026-09-23 · **Status:** Entwurf zur Durchsicht · **Folgt:** Implementierungsplan (writing-plans)

## 1. Ausgangslage und Ziel

Der Nutzer hält die heutige Seite für „kacke bis 0815“ und verlangt ein komplettes Makeover
samt Brand Guideline. Teilprojekt 1 legt die Marke fest und baut die Startseite neu. Die
übrigen Seiten erben Farben und Schriften sofort über die Tokens; ihr Layout-Umbau ist
Teilprojekt 2 mit eigener Spec.

**Erfolg heißt:** Die Seite wirkt eigenständig statt generisch, und wer die Startseite
herunterscrollt, versteht den Kern (eigene Reviews plus Community-Umfrage) ohne Erklärung.

**Unverändert bleiben:** Datenmodell, Server Actions, Zugriffskontrolle, Routen, Preis-
Sichtbarkeit (§10 HWG), das Passwort-Gate.

## 2. Getroffene Entscheidungen

| Frage | Entscheidung | Verworfen, weil |
|---|---|---|
| Name | **Grünes Buch** (Nutzerwahl) | Klarblatt, Feldbuch, Offenes Herbar, Grünbuch. Hinweis gegeben: „Das Grüne Buch“ ist auch Gaddafis Manifest; ohne Artikel und im Pflanzenkontext vom Nutzer akzeptiert |
| Leitreferenz | **moneyincheck.org**, adaptiert, nicht kopiert | – |
| Zweite Stimme | Touch von **Wizard Trees / Doja Pak**: Graffiti, Schnörkel, Sprühfarbe | – |
| Dosierung | **60 % Buch / 40 % Wand**; die Referenz führt | 80/20 (zu brav), 90/10 |
| Tonalität | **Du + Ich** (der Betreiber spricht persönlich) | Du + Wir, Sie + neutral |
| Reviews auf der Startseite | **Höhepunkt der Scroll-Story** | eigene Sektion vor/nach der Umfrage, nur Navigation |
| Hell/Dunkel | **Hell ist die Marke, Dark Mode abgeleitet**, System-Präferenz | nur hell, dunkel zuerst |
| Motion-Stack | **GSAP + ScrollTrigger + SplitText + Lenis**, nur auf der Startseite | CSS-only (zu wenig Inszenierung), OGL/WebGL + Lottie (schwer, riskant, Lottie-Dateien fehlen) |
| Medienquelle | **Pexels-API** zur Entwicklungszeit, selbst gehostet | Unsplash (API verlangt Hotlinking, also Besucher-IP an Dritte); Pixabay vorerst nicht (Nutzer) |
| „Wirkung“ im Höhepunkt | **nicht auf der Startseite**, nur im vollständigen Eintrag | groß gesetzte Wirkungsnote liest sich öffentlich als Wirksamkeitsversprechen |
| Visuelle Vorschau | nur Text, kein Browser-Companion (Nutzer) | – |
| Zuschnitt | Teilprojekt 1 = Guideline + Tokens + Primitives + Layout-Rahmen + Startseite | alles in einem Durchgang |

**Korrektur gegenüber dem Chat (Abschnitt 4, Kapitel „Wissen bündeln“):** Im Chat standen
„echte Vorschläge der Community als Tags“. Vorschläge tragen einen Handelsnamen und eine
unmoderierte Freitext-Begründung (`UmfrageVorschlag.begruendung`). Handelsnamen als große
Graffiti auf der öffentlichen Startseite wären Produktinszenierung (§10 HWG), Freitext wäre
ungeprüft öffentlich. Die Wand zeigt deshalb **echte Zahlen** (siehe 5.3), keine Namen.

## 3. Markenkonzept: Buch und Wand

- **Das Buch** ist die Stimme des Betreibers: systematisch, belegbar, an Chargen gebunden.
  Papiergrau, Tinte, Blattgrün, dünne Editorial-Serif, Graustufen-Motive, Feldbuch-Raster
  (Messlinien, *Cannabis sativa L.*, Terpen-Strukturformeln als Fotomotiv, nicht gezeichnet).
- **Die Wand** ist die Stimme der Community: Graffiti-Handstyle, Schnörkel, Sprühnebel, Drips,
  Marker-Striche, in **Sprühviolett**. Sie erscheint überall, wo die Community mitredet
  (Abstimmung, Vorschlag, Stimmen, „Wähl mit“), und als bewusster Bruch in Story-Übergängen.
- **Der Bruch hat eine Funktion:** Er zeigt, wer spricht. Messwerte, Reviews, Katalogdaten
  bleiben immer Buch.

### 3.1 Harte Leitplanken

1. **Kiffer-Anmutung nur in Form, Schrift und Textur, nie in Aussagen.** Kein „high“,
   „stoned“, „dank“, kein 420, keine Aussagen über Wirkung oder Heilung.
2. **Kein Konsum im Bild:** keine Joints, Bongs, Rauchschwaden, Konsumierenden.
3. **Keine Maskottchen, Comicfiguren, Zauberer** (Jugendschutz).
4. **Handelsnamen nie als Graffiti.** Namen stehen immer in Buch-Typografie.
5. **Keine Blüten, die einem Handelsnamen zuzuordnen sind**; Pflanze, Blatt, Anbau, Labor,
   Makro von Trichomen sind erlaubt.
6. **Preise und Bestände** bleiben hinter der Freigabe (bestehende Logik, unverändert).
7. **Rechtshinweise** stehen sachlich in Buch-Typografie, nie als Wand.

### 3.2 Tonalität

- Du + Ich. Buch-Texte sachlich und warm, ganze Sätze. Wand-Texte kurz, Imperativ
  („Wähl mit.“, „Dein Vorschlag.“).
- **Neue Seitentexte ohne Geviertstrich (—) und ohne Gedankenstrich (–) als Trenner**
  (`design-taste-frontend` 9.G). Bestehende Texte anderer Seiten folgen in Teilprojekt 2.
- Keine Füllverben („revolutionieren“, „nahtlos“), keine erfundenen Zahlen.

## 4. Visuelles System

### 4.1 Farben

Notation OKLCH (wie bisher). Alle Werte liegen im sRGB-Gamut, alle Paare sind **gemessen**
(WCAG 2.2, Skript `scripts/farben-pruefen.mjs`, entsteht in Schritt 2 aus der Rechnung dieser
Spec). Neutraltöne mit Farbton 165 (leichter Grünstich), eine Skala für beide Modi.

**Grundfarben (Primitives, nie direkt in Komponenten):**

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

`success` liegt bei 140°, 30° vom Blattgrün (170°) entfernt, damit „erfolgreich“ und
„klickbar“ nicht dieselbe Farbe sind.

**Semantische Tokens (die bestehenden Namen bleiben, dadurch erben alle Seiten sofort):**

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

**Gemessene Kontraste (Mindestwert in Klammern):**

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

**Regeln:** Blattgrün ist der einzige Bedienakzent, genau eine gefüllte Primäraktion pro
Ansicht. Sprühviolett ist Material der Wand und erscheint nie auf Buttons, Links oder
Fokus. Kein reines Schwarz oder Weiß. Umschaltung Hell/Dunkel wie bisher über
`prefers-color-scheme` plus `data-theme`, ein Mechanismus für alle Tokens.

### 4.2 Schriften

Alle über `next/font/google`, selbst gehostet, `display: swap`.

| Rolle | Schrift | Schnitte | Einsatz |
|---|---|---|---|
| Buch-Display | **Cormorant Garamond** | 300, 300 italic, 500 | 300: Kapitel, Manifest, große Zitate; 500: randfüllender Titel im Auftakt und die Schlusszeile (die Referenz setzt ihren Titel in 400, nicht light); nur ab 40 px |
| Text und Bedienung | **Geist** (vorhanden) | variabel | Fließtext, Buttons, Formulare, Navigation |
| Messwerte | **Geist Mono** (vorhanden) | variabel | Noten, Chargen, Zahlen (`tabular-nums`) |
| Wand | **Sedgwick Ave Display** | 400 | Tags, Wand-Überschriften, „Wähl mit“; nie Fließtext, Daten, Formulare, Namen |

Eine Serif ist hier begründet (`design-taste-frontend` 4.1): Die Marke ist buchstäblich ein
Buch. Betonung in Überschriften über die Italic derselben Schrift, nie über eine fremde
Familie. Die bestehende Größenskala (caption bis display) bleibt; neu:

| Token | Wert | Zeilenhöhe | Schrift |
|---|---|---|---|
| `text-titel` | `clamp(3.5rem, 2rem + 6vw, 8rem)` | 1.05 | Cormorant 300 |
| `text-kapitel` | `clamp(2.5rem, 1.5rem + 3.5vw, 5rem)` | 1.1 | Cormorant 300 |
| `text-tag` | `clamp(2rem, 1rem + 4vw, 5rem)` | 1.1 | Sedgwick Ave Display |

Kursive mit Unterlängen (g, j, p, q, y) bekommen mindestens 1.1 Zeilenhöhe plus Reserve nach
unten. Die Feineinstellung (Laufweite, `text-wrap: balance`, optische Größen) erfolgt beim
Umsetzen mit `better-typography`.

### 4.3 Logo

- **Wortmarke:** „Grünes Buch“ in Cormorant Garamond 300, sauber gesetzt.
- **Tag:** darüber, leicht gedreht, „gb“ in Sedgwick Ave Display in `spray`, mit
  Schnörkel-Unterstrich aus der Schrift selbst (Glyphen), aufgeraut über einen SVG-Filter
  (`feTurbulence` + `feDisplacementMap`) und einen weichen Overspray (`feGaussianBlur`
  auf einer Kopie). Ein Drip kommt aus der Medien-Pipeline (Pexels-Foto, zu Alpha-Maske
  umgerechnet). Keine von Hand gezeichneten Pfade.
- **Akzente aus den Referenzlogos (Bildersuche, 2026-09-23):**
  - *Doja Pak:* ein Tag in **einem Zug** (Marker-Handstyle), dessen Anfangsschwung als
    Schleife das ganze Wort umschließt; darunter ruhige, **weit gesperrte Versalien**
    („EXCLUSIVE“). Übernommen: das „gb“-Tag bekommt die umschließende Schleife (Glyphen-
    Schwung von Sedgwick, sonst weglassen), darunter „GRÜNES BUCH“ in Geist, Versalien,
    Laufweite 0.3em. Der Bruch wild/geordnet ist genau Buch und Wand im Kleinen.
  - *Wizard Trees:* Psychedelic-Plakatschrift, zwei Zeilen ineinander verzahnt, Spirale im
    Buchstaben, **weiße Aufkleber-Kontur** um die schwarze Form (Stanzkontur), Violett als
    Fläche. Übernommen: nur die Stanzkontur, erzeugt per SVG-Filter (`feMorphology`
    dilate in `surface-raised` hinter dem Tag), damit das Tag wie ein aufgeklebter Sticker
    auf dem Buch sitzt. Nicht übernommen: Spirale (müsste gezeichnet werden), Zauberer-
    Figur (Leitplanke 3), Violett als Vollfläche (Sprühviolett bleibt Material der Wand).
- Komponente `components/marke/Wortmarke.tsx` (Server Component), zwei Größen: `kopf`
  (Header, Tag statisch) und `buehne` (Hero, Tag wird per Animation „gesprüht“).
- Zugänglicher Name: „Grünes Buch“; das Tag ist `aria-hidden`.

### 4.4 Formen

- **Pillen** (`radius-full`): Buttons, Chips, Badges, Filter-Einstiege.
- **Eckig** (`0`): Flächen, Karten, Bilder, Eingabefelder, Tabellen, wie Buchseiten.
- Schatten nur als Ebenen-Signal, auf Farbton 165 getönt.
- Der globale Fokusring bleibt (2 px `focus-ring`, 2 px Abstand) und übernimmt den Radius
  des Elements (`border-radius: inherit` statt fest `radius-sm`).

### 4.5 Bildbehandlung

- Motive vor hellem Grund, in Graustufen. **Hell:** `mix-blend-mode: multiply` auf Papier.
  **Dunkel:** `filter: invert(1)` plus `mix-blend-mode: screen`. Freistellen entfällt.
- Wand-Texturen (Drips, Sprühnebel, Pinselstriche): Fotos schwarzer Sprühfarbe auf heller
  Wand, per `sharp` in Alpha-Masken umgerechnet (Luminanz wird Deckkraft), eingefärbt über
  `mask-image` mit `background-color: var(--color-spray)`. Damit funktionieren sie in beiden
  Modi ohne zweite Datei.
- Videos: höchstens zwei, SD-Dateien von Pexels, stumm, `playsinline`, mit Standbild,
  verzögert geladen, Graustufen per CSS-Filter. Bei reduzierter Bewegung nur Standbild.
- Jedes Motiv hat eine erzählerische Rolle; kein Deko-Stock.

### 4.6 Motion-Prinzipien

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

### 4.7 Feldbuch-Raster

Ein feines Raster (Linien in `border`, 1 px) liegt als feste Ebene hinter der ganzen
Startseite, 10 Spalten ab 1080 px, 4 Spalten darunter, `pointer-events: none`. Darauf
verstreut, sehr blass, handschriftliche Randnotizen aus dem Feldbuch (Chargenkürzel,
Messwerte wie „RF 11 %“) als Textur. Sie tragen keine Information und sind `aria-hidden`.

### 4.8 Referenzwerte moneyincheck.org (im Browser gemessen, 2026-09-23)

- Skalierung: `html { font-size: min(0.58vw, 0.99vh, 11.1px) }`, unter 1080 px fest 10 px;
  die ganze Seite in rem. Übernommen wird das Prinzip (Display-Größen an den Viewport
  gekoppelt), nicht die Formel: unsere Tokens bleiben `clamp()`.
- Größen: Titel 34 rem / 400 / Versalien; Manifest 9,6 rem / 200 / Zeilenhöhe 1,35;
  Autorentext 4,4 rem / 200 / −0,01 em; Schlusszeile 13 rem; Fließtext 2,2 rem / 300.
- Hervorhebung fett-kursiv in derselben Familie; handschriftliche Akzente („say hello“,
  gekritzelter Unterstrich) nur im Footer.
- Handy: kein WebGL, Wort-Einfärbung bleibt, Figuren-Videos bleiben.
- Reduzierte Bewegung: Übergänge aus, Deko-Objekte ausgeblendet.

## 5. Startseite

**Design Read:** Überarbeitung (Overhaul) einer Community-Seite im Editorial-Stil für
Cannabis-Patient:innen in Deutschland, Sprache „Buch mit Graffiti-Bruch“, Tailwind v4 +
eigene Tokens + GSAP/Lenis. **Regler:** Varianz 8, Bewegung 7, Dichte 3.

### 5.1 Sektionen

Jede Sektion hat eine eigene Layoutform. Keine Kapitelnummern, höchstens drei kleine
Oberzeilen auf der ganzen Seite, kein Scroll-Hinweis.

| # | Sektion | Schicht | Layout | Inhalt | Bewegung (volle Fassung) | Handy (< 768 px) |
|---|---|---|---|---|---|---|
| 1 | **Auftakt** | Buch + Tag | randfüllender Titel mit überlagertem Leitobjekt | „Grünes Buch“ in Versalien, Cormorant 500, in `accent`, randfüllend über zwei Zeilen; das Leitobjekt (Buch mit Blatt, Graustufen, `multiply`) liegt **über** den Buchstaben; darüber die Unterzeile „Cannabis, offen gelegt.“, darunter „Ich teste Sorten nach festem Schema. Du entscheidest mit, welche als Nächstes drankommt.“ und Button **Wähl mit** (Anker `#abstimmung`); das „gb“-Tag sitzt schräg am Titel | Einstieg: Titel Wort für Wort, dann Tag gesprüht, dann Drip; Navigation und Button sind sofort bedienbar | Titel zweizeilig, Leitobjekt kleiner, weiter überlagernd |
| 2 | **Transparent machen** | Buch | Manifest, danach gepinnte Bühne | Kopfzeile wie bei einer Zeitung („Grünes Buch.“, Datum der neuesten Review, „Charge für Charge.“); dann „Hinter jedem Handelsnamen steckt eine Charge. Ich schreibe auf, was drin ist.“ als großer Absatz (Cormorant 300); danach drei Feldbuch-Notizen (Aussehen, Geruch, Restfeuchte) | Manifest: Wörter färben sich scroll-gekoppelt von `text-muted` zu `text` (Referenz); danach Zoom Blatt → Blüte → Trichom an den Scrollweg gekoppelt | ohne Pin, Einfärbung bleibt, drei Bilder untereinander |
| 3 | **Wissen bündeln** | Wand | horizontaler Schwenk | „Einer allein weiß wenig. Hier sammelt sich, was viele erfahren.“ plus echte Zahlen als Tags (5.3) | vertikales Scrollen schwenkt die Wand seitlich, Tags sprühen beim Eintritt auf | kein Schwenk, Wand vertikal gestapelt |
| 4 | **Gemeinsam lernen** | Buch mit Wand-Einschub | Schleifen-Diagramm | „Ihr schlagt vor. Ihr stimmt ab. Ich teste. Alle lesen.“; erklärt 1 bis 2 gesetzte und 2 gewählte Plätze | die Schleife zeichnet sich als Linie (Datengrafik) | Linie vertikal |
| 5 | **Der neueste Eintrag** (Höhepunkt) | Buch | aufgeschlagene Doppelseite | echte neueste Review: Handelsname, Charge, Datum, **vier** Noten (Aussehen, Geruch, Geschmack, Konsistenz) als Mono-Ziffern, Geschmacksmatrix als Netzdiagramm, höchstens drei Zeilen Text, Link **Ganzen Eintrag lesen** | Seite „schlägt auf“ (Clip-Pfad), Ziffern zählen einmal hoch | Doppelseite wird eine Spalte |
| 6 | **Die Abstimmung** (`#abstimmung`) | Wand | Wand mit Stimmzettel | „Was teste ich als Nächstes?“; gesetzte Plätze **gestempelt**, gewählte **gesprüht markiert**; Namen immer in Buch-Typo; Stimmabgabe mit allen Zuständen | Markierungen sprühen beim Eintritt auf; Stimmabgabe ohne Scroll-Animation | eine Spalte |
| 7 | **Katalog** | Buch, ruhig | horizontale Reihe (Scroll-Snap) | sechs Produkte, Einstiege als Pillen (Indica, Sativa, Zitrus, Nur verfügbare), Link zum Katalog; Preise nur mit Freigabe | nur Einblendung | wischbar |
| 8 | **Apotheken** | Buch | Satz plus Link | ein Satz, Link **Apotheken ansehen** | keine | – |
| 9 | **Footer** | Buch + großes Tag | Schlusszeile, dann Abschluss | Schlusszeile „Du liest mit. Du wählst mit.“ in Cormorant 500, groß; darunter große Wortmarke, Navigation, Rechtshinweis (sachlich), Bildnachweise aus `lib/medien.ts` | Schlusszeile steht als Kontur (`-webkit-text-stroke`) und füllt sich scroll-gekoppelt Wort für Wort (Referenz); Tag sprüht einmal | gestapelt |

Die „Wirkung“-Note erscheint auf der Startseite nicht; der vollständige Eintrag zeigt alle
fünf Noten unverändert.

### 5.2 Zustände

| Sektion | Leer | Laden | Fehler |
|---|---|---|---|
| 3 Wissen bündeln | alle Zahlen 0 → statt Zahlen die drei Leitsätze als Tags | Skelett in Wandform | wie leer |
| 5 Neuester Eintrag | „Das erste Kapitel wird gerade geschrieben.“ plus Hinweis auf die Abstimmung | Skelett in Doppelseitenform | Fehlergrenze mit Satz, Seite bleibt bedienbar |
| 6 Abstimmung | „Gerade läuft keine Runde. Die nächste steht hier, sobald sie eröffnet ist.“ | Skelett | wie heute (Meldung) |
| 6 Stimmzustände | ANONYM, FREIGABE_OFFEN, STIMMBERECHTIGT, ABGESTIMMT (bestehende Logik) | – | – |
| 7 Katalog | bestehender Leerzustand in neuer Form | Skelett-Reihe | – |

Jede Datensektion hat eine eigene `Suspense`-Grenze; Skelette ersetzen den `Spinner` auf der
Startseite.

### 5.3 Daten

- Bestehend: `aktiveUmfrage()`, `eigeneStimme()`, `aktuellesMitglied()`,
  `neuesteRedaktionelleReview()`, `ladeStrainListe()`, `istFachkreis()`.
- **Neu:** `communityZahlen()` in `lib/query/umfragen.ts`: Anzahl abgegebener Stimmen
  gesamt, Anzahl Vorschläge gesamt, Anzahl beendeter Runden. **Eine** Abfrage (Unterabfragen
  in einem SQL-Statement über `$queryRaw`), keine Namen, keine Freitexte.

## 6. Technik

### 6.1 Dateien

| Datei | Änderung |
|---|---|
| `docs/brand/gruenes-buch.md` | **neu:** die Brand Guideline (Preset), Inhalt siehe 7 |
| `.claude/skills/ui-design-engine.md` (+ Ordner) | **umgeschrieben** auf die Guideline; bleibt das verbindliche Regelwerk für `app/**` und `components/**` |
| `app/globals.css` | Primitives und semantische Tokens neu (4.1), Schrift-Variablen, neue Größen, Radius-Regel, Fokus-Radius, Masken-Hilfsklassen für Wand-Texturen |
| `app/layout.tsx` | Schriften (Cormorant, Sedgwick), `metadata` auf „Grünes Buch“, Header mit `Wortmarke`, neuer Footer mit Bildnachweisen |
| `components/ui/*` | Primitives auf die Formregel (Button/Badge Pille; Card/Input/Select/Table eckig); `accent-hover` statt Opacity-Hover |
| `components/marke/Wortmarke.tsx`, `SprayFilter.tsx` | **neu** |
| `components/story/*` | **neu:** eine Server-Komponente je Sektion, Skelette, `StoryBuehne.tsx` (einzige Client-Insel für Bewegung) |
| `components/review/ReviewKarte.tsx`, `components/umfrage/UmfrageKarte.tsx` | Darstellung für die Startseite (Doppelseite, Wand-Stimmzettel); Logik und Props-Vertrag bleiben |
| `app/page.tsx` | setzt die Sektionen zusammen, bleibt Server Component und `force-dynamic` |
| `lib/query/umfragen.ts` | `communityZahlen()` |
| `lib/medien.ts` | **neu:** Verzeichnis aller Medien (Datei, Breiten, Maße, Alt-Text, Quelle, Urheber, Lizenz, URL) |
| `components/medien/Bild.tsx`, `Textur.tsx`, `Loop.tsx` | **neu:** `Bild` = `<img>` mit `srcset`/`sizes` aus `lib/medien.ts` und der Hell/Dunkel-Behandlung; `Textur` = Wand-Maske in `spray`; `Loop` = Video mit Standbild und Nahladen. Keine Next-Bildoptimierung: Auf Workers bräuchte sie Cloudflare Images; die Breiten entstehen stattdessen in der Pipeline. Die ESLint-Regel `@next/next/no-img-element` wird nur in `Bild.tsx` mit dieser Begründung abgeschaltet |
| `scripts/medien/suchen.mjs`, `scripts/medien/aufbereiten.mjs` | **neu:** Pipeline (6.3) |
| `scripts/farben-pruefen.mjs` | **neu:** Gamut und Kontraste aller Paare aus 4.1, bricht bei einem Verstoß ab |
| `public/medien/*` | **neu:** aufbereitete Bilder, Masken, Videos |
| `package.json` | `gsap`, `lenis` |

### 6.2 Bewegung: eine Client-Insel

- `StoryBuehne` (`"use client"`) wird einmal am Ende von `app/page.tsx` gerendert und
  findet ihre Ziele über `data-story="…"`-Attribute im Server-HTML.
- Beim Mounten: `matchMedia("(prefers-reduced-motion: reduce)")` → bei `reduce` sofort
  zurück. Sonst `Promise.all([import("gsap"), import("gsap/ScrollTrigger"),
  import("gsap/SplitText"), import("lenis")])`, erst nach dem Hydrieren.
- Ein `gsap.context`, eine Lenis-Instanz, an ScrollTrigger gekoppelt (`lenis.on("scroll",
  ScrollTrigger.update)`, Ticker über `gsap.ticker`). `ScrollTrigger.refresh()` nach
  `document.fonts.ready` und nach dem Laden der Medien.
- Aufräumen beim Unmount: `ctx.revert()`, `lenis.destroy()`, Ticker-Callback entfernen.
- Split-Text: SplitText mit `aria`-Behandlung; das Original bleibt als zugänglicher Name
  erhalten, die Teilstücke sind `aria-hidden`. Links und Hervorhebungen werden nicht geteilt.
- Wechselt die Präferenz zur Laufzeit auf `reduce`, räumt die Insel auf und setzt die
  Endzustände.
- Kein `window.addEventListener("scroll")`, kein React-State pro Frame.

### 6.3 Medien-Pipeline

1. `node scripts/medien/suchen.mjs "<suchbegriff>" [--video]` liest `PEXELS_API_KEY` aus
   `.env.local`, fragt die Pexels-API einmal ab (keine Wiederholungen) und legt bis zu
   15 Kandidaten in kleiner Vorschaugröße plus `kandidaten.json` (ID, Urheber, URL, Maße) in
   den Scratch-Ordner.
2. Auswahl durch Ansehen nach Guideline 3.1 und 4.5. Die Auswahl wird in `lib/medien.ts`
   eingetragen.
3. `node scripts/medien/aufbereiten.mjs` lädt die gewählten Originale, erzeugt mit `sharp`
   Graustufen-WebP in 640/1280/1920 px bzw. Alpha-Masken-PNG für Wand-Texturen und legt sie
   in `public/medien/` ab. Videos werden als SD-Datei übernommen, dazu ein Standbild.
4. `sharp` ist über Next bereits installiert; die Pipeline braucht keine weitere Abhängigkeit.
5. Die Keys werden nie gebündelt, nie als Worker-Secret gesetzt.

Pexels-Lizenz: frei nutzbar ohne Pflichtnennung; genannt wird trotzdem (Footer,
`lib/medien.ts`).

### 6.4 Budgets

- Zusätzliches JS nur auf der Startseite, nach dem Hydrieren: **≤ 60 KB gz**, gemessen an der
  Build-Ausgabe.
- LCP: Leitobjekt im Auftakt, vorgeladen (`preload()` aus `react-dom` plus
  `fetchPriority="high"`), **< 2,5 s**; CLS **< 0,1**
  (Maße für alle Medien, Schrift-Fallbacks mit `adjustFontFallback`).
- Schriften: Cormorant 2 Dateien, Sedgwick 1, Geist/Geist Mono wie bisher.
- Medien gesamt auf der Startseite (erste Ansicht): ≤ 400 KB; Videos erst bei Annäherung.
- Workers Free: eine zusätzliche Abfrage pro Request (`communityZahlen()`).

## 7. Inhalt der Brand Guideline (`docs/brand/gruenes-buch.md`)

1. Idee: Buch und Wand, 60/40, wer spricht wann
2. Name und Logo: Wortmarke, Tag, Schutzraum, Mindestgröße, Varianten hell/dunkel, Verbote
3. Farben: Primitives, Rollen, gemessene Paare, Regeln (4.1)
4. Typografie: Rollen, Größen, Betonung, Verbote (4.2)
5. Formen und Raster: Pillen/eckig, 8-px-Raster (bleibt), Schatten
6. Bildsprache: Motivregeln, Behandlung, Wand-Texturen, Video (4.5), Quellen und Nachweise
7. Bewegung: Prinzipien, Buch-Bewegung vs. Wand-Bewegung, reduzierte Bewegung (4.6)
8. Tonalität und Sprache: Du + Ich, Buch- vs. Wandtexte, Satzzeichen, verbotene Wörter (3.2)
9. Leitplanken HWG und Jugendschutz (3.1)
10. Do's und Don'ts mit je einem Beispiel pro Regel

## 8. Nicht im Umfang

- Layout-Umbau von `/reviews`, `/reviews/[…]`, `/umfragen`, `/produkte`, `/produkte/[slug]`,
  `/apotheken`, `/apotheken/[slug]`, `/mitglied`, `/anmelden`, `/registrieren`, `/admin`,
  `/zugang` (Teilprojekt 2; bis dahin erben sie Tokens und Schriften).
- Änderungen an Datenmodell, Server Actions, Zugriffskontrolle, Preislogik.
- Instagram-Einbindung, Mailversand, eigene Domain.
- Pixabay als zweite Medienquelle.
- Eigene Fotos des Betreibers.

## 9. Prüfung (Akzeptanzkriterien)

1. `npm run typecheck`, `npx eslint .`, `npm run build` grün; `scripts/farben-pruefen.mjs`
   ohne Verstoß.
2. Keine Geviertstriche und keine Gedankenstrich-Trenner in den neuen Seitentexten (Suche im
   gerenderten HTML der Startseite).
3. Ohne JavaScript: alle neun Sektionen vollständig lesbar, Abstimmung bedienbar (Server
   Actions), keine unsichtbaren Startzustände.
4. Mit `prefers-reduced-motion: reduce`: GSAP und Lenis werden nicht geladen (Netzwerk
   geprüft), Endzustände sichtbar.
5. Tastatur: alle Bedienelemente erreichbar, Fokus sichtbar, Reihenfolge logisch; Split-Text
   liest sich im Accessibility-Baum als ganzer Satz.
6. Hell und dunkel: alle Sektionen im Browser geprüft, Medien in beiden Modi sauber
   (multiply bzw. invert + screen), Wand-Masken in `spray`.
7. Desktop (1440 px) und Handy (390 px): kein horizontales Überlaufen, kein Pin auf dem Handy.
8. Budgets aus 6.4 eingehalten (Build-Ausgabe, `cloudflare:web-perf`).
9. Bildnachweise vollständig: jede Datei in `public/medien/` steht in `lib/medien.ts`.
10. Leitplanken 3.1 gegen alle neuen Texte und Motive durchgesehen.
11. Abschlussreview mit `interface-review` und `web-design-guidelines`, Pre-Flight-Liste von
    `design-taste-frontend`, Validierung aus `build-awwwards-quality-sites`; Befunde behoben
    oder begründet offen.
12. Bestehende Seiten laufen weiter (Stichprobe `/reviews`, `/umfragen`, `/produkte`,
    `/admin`: 200, keine Konsolenfehler) und sind mit den neuen Tokens lesbar.

Browser-Prüfungen (3 bis 7) brauchen die verbundene Chrome-Erweiterung; ist sie nicht
verbunden, prüft der Nutzer nach Anleitung oder die Punkte werden als „nicht verifiziert“
gemeldet.

## 10. Reihenfolge der Umsetzung

1. Brand Guideline schreiben, `ui-design-engine` umschreiben
2. Tokens, Schriften, `farben-pruefen.mjs`, Primitives
3. Wortmarke, Header, Footer
4. Medien-Pipeline, Mediensatz suchen, auswählen, aufbereiten
5. Startseite Sektion für Sektion, statisch vollständig
6. `StoryBuehne` mit GSAP/Lenis, Sektion für Sektion
7. Prüfung (9), dann Go des Nutzers, dann Push (= Live-Gang über Workers Builds)

## 11. Offene Inputs

- **Instagram-Handle** „Grünes Buch“ auf Verfügbarkeit prüfen (Nutzer).
- **Chrome-Erweiterung** für die Browser-Prüfungen verbinden (Nutzer).
- Pixabay-Key: nicht nötig (vorerst ohne Pixabay).

## 12. Eingesetzte Skills

`superpowers:brainstorming` (dieser Entwurf), `build-awwwards-quality-sites` (Art Direction,
Asset-Regeln, Motion-Stack), `design-taste-frontend` (Design Read, Regler, Anti-Slop-Regeln,
Pre-Flight), `better-colors` (Palette, Gamut, gemessene Kontraste). Beim Umsetzen:
`better-typography`, `better-layout`, `better-accessibility`, `emil-design-eng`, `animate`,
`frontend-design`, `cloudflare:web-perf`, zum Abschluss `interface-review` und
`web-design-guidelines`. `brand-guidelines` (Anthropic) wurde nicht installiert: Es wendet nur
Anthropics eigene Marke an und taugt nicht als allgemeines Guideline-Gerüst.
