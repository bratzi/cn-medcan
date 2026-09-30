# Plan: Sweet Spot in der Aroma-Karte, Terpen-Regler in der Karte, Terpen-Band dezenter

**Datum:** 2026-09-30 (Session 36)
**Branch:** `sweet-spot` (Worktree `C:\cn-t14`, von `main` @ `603e107`)
**Spec:** keine eigene Datei. Bindend sind die Nutzeraussagen unten (wörtlich) und die
Entscheidungen des Nutzers vom 2026-09-30.

## Nutzeraussagen (bindend)

1. „Neues Terpene-Band bitte die Icons bisschen dezenter. Wirken nicht passend ins Design.“
2. „Ich möchte keine extra Boxen für die Terpen Sweet Spots. Ich möchte, dass wir die Sweet
   Spots in die Karte einbauen, nämlich bei den Geschmäckern. Die Skala von 0 bis 5 wird zu
   einer Sweet-Spot-Skala. Die Mitte ist der Sweet Spot, wie bei dem Sweet Spot schon bisher.
   Die Funken bei dem Regler funken nur, wenn der Regler direkt auf dem Sweet Spot in der
   Mitte ist. Damit soll dem End-User dargestellt sein, dass das der Geschmack ist, den man
   erreichen möchte. Dementsprechend auch die Animationen der Farben, Geschwindigkeit und
   Pulsierung einstellen.“
3. „Wir entfernen es nicht, wir bauen dieses Feature um und in den Graph rein. Wenn ich einen
   Regler bewege, der eigentlich nicht enthalten ist, dann sollst du davon ausgehen, dass ich
   als User das Terpen ‚hinzufüge‘. Wenn ich ihn auf 0 setze, dann ist er nicht enthalten.
   Dafür brauche ich keine 2 Regler, die am Ende dasselbe darstellen.“
4. Bedeutung der Geschmacksskala: **zu wenig – genau richtig – zu viel** (0 = zu wenig,
   Mitte 2,5 = genau richtig, 5 = zu viel).
5. Bereits gespeicherte Geschmackswerte: **weiter zählen**, keine Migration.

## Global Constraints

- Projektregeln: `AGENTS.md` (Next.js 16 mit Abweichungen, Doku in `node_modules/next/dist/docs/`).
- UI-Regeln: Skill `ui-design-engine` (Buch und Handschrift, 8px-Raster, Tokens aus `app/globals.css`,
  Trefferflächen mindestens 44 px, Kontrast, reduzierte Bewegung und Sparmodus `:root[data-sparmodus]`).
- Kommentare, Texte und Commit-Nachrichten auf Deutsch, im Stil der umgebenden Dateien
  (Begründung mit „Nutzer 2026-09-30“ wo eine Entscheidung vom Nutzer kommt).
- Keine Literale in Komponenten: sichtbare Texte stehen in `lib/i18n/de.ts` und `lib/i18n/en.ts`
  (Typen in `lib/i18n/typen.ts`), geprüft von `tests/i18n-literale.test.ts`.
- **Kein** `next dev`, `next build`, `next start` oder Preview lokal. Prüfen mit `npm test` und
  `npx tsc --noEmit -p .` im Worktree `C:\cn-t14`. Keine npm-Installationen.
- Keine Wirkungsaussagen (HWG): nur Duft und Geschmack.
- Animationen nur transform/opacity bzw. stroke-dash; bei `prefers-reduced-motion: reduce` und im
  Sparmodus stehen sie (bestehende Klassen `.bogen-fluss`, `.bogen-voll`, `.delta-funke` tun das schon).
- Die Fazit-Berechnung (`lib/fazit.ts`, `herstellerTreue`, Server-Kennwerte) bleibt unverändert.

---

## Task 1: Terpen-Band dezenter

**Datei:** `components/story/TerpenBand.tsx` (ggf. `app/globals.css`, Abschnitt „Terpen-Band“).

Das Band zwischen Hero und Story (seit `603e107`) zeigt die Terpen-Icons zu groß und zu kräftig.
Heute: Icon `size-10` in einer `size-14`-Fläche, Farbe `text-text`, Band mit `border-y` und `py-6`,
Abstand `gap-12 sm:gap-16`.

Ziel: ruhig, im Buch-Stil, wie eine Randleiste.
- Icon 24 px (`size-6`), Farbe gedämpft (`text-text-muted`), bei Hover/Fokus `text-text`.
- Trefferfläche bleibt 44 px (`size-11`), rund, Fokusring wie bisher.
- Band flacher: `py-4` statt `py-6`; Linien oben/unten als Haarlinie in `border-border` bleiben.
- Abstände enger: `gap-8 sm:gap-12` (und das `pr-*` der Liste passend, damit der Lauf nahtlos bleibt).
- Tooltip (Inhalt und Gestaltung) bleibt unverändert.
- Skeleton-Höhe im Suspense-Fallback an die neue Bandhöhe anpassen.

Test: bestehende Tests grün; kein neuer Test nötig (reine Optik).

---

## Task 2: Sweet-Spot-Skala der Geschmäcker in der Aroma-Karte

**Dateien:** `lib/aromakarte.ts`, `components/review/AromaKarte.tsx`, `lib/i18n/de.ts`,
`lib/i18n/en.ts`, `lib/i18n/typen.ts` (falls nötig), Tests in `tests/`.

Gilt für jede Aroma-Karte (Bewertungsmaske, Anzeige auf Startseite und Blütenseite, Buch).

### 2a. Reine Funktionen (`lib/aromakarte.ts`)

- Neu `sweetSpotStaerke(wert: number): number`: `0`, wenn `!(wert > SPUERBAR)`; sonst
  `0.5 + 4.5 * qualitaetsScore(wert)` (aus `lib/bewertung-v2.ts`, Mitte `QUALITAET_MITTE = 2.5`),
  auf zwei Stellen gerundet. Ergebnis 0,5 an den Rändern (Wert 5), 5 genau im Sweet Spot.
- Neu `imSweetSpot(wert: number): boolean`: `Math.abs(wert - QUALITAET_MITTE) < 0.01`.
- Neu `SWEET_SPOT_FUNKEN: readonly number[] = [2.1, 2.25, 2.4, 2.6, 2.75, 2.9]` (Skalenwerte der
  Funken rund um den Griff).
- `funkenPunkte` entfällt (samt Tests in `tests/terpen-fluss.test.ts`).
- Tests (node:test wie die bestehenden): `sweetSpotStaerke(0) === 0`, `(2.5) === 5`, `(5) === 0.5`,
  `(1.25) === 2.75`, `(3.75) === 2.75`; `imSweetSpot(2.5)` true, `(2.4)` false, `(2.5000001)` true.

### 2b. Linien (Bögen) nach Sweet Spot

In `AromaKarte.tsx` beim Zeichnen der Bögen Geschmack → Terpen: Breite, Tempo und Strichlänge
kommen nicht mehr aus dem rohen Wert, sondern aus `sweetSpotStaerke`:
- `linienBreite(sweetSpotStaerke(wert), notenAnteil)` (gleitender Wert),
- `flussDauer(sweetSpotStaerke(zielWert))`, `flussStrich(sweetSpotStaerke(zielWert))` (Zielwert).
Folge: genau im Sweet Spot ist die Linie am dicksten, am schnellsten und pulsiert durchgehend
(`bogen-voll`); zu den Rändern hin (zu wenig / zu viel) dünner, langsamer, kürzerer Lichtstrich.
Ob eine Linie überhaupt erscheint, bleibt wie heute (`bogenSchicht`, `wert > SPUERBAR`).

### 2c. Funken nur im Sweet Spot

Die Funken (`.delta-funke`) auf dem Überstand über dem Median entfallen. Stattdessen: ist ein
Regler da (`regler`) und `imSweetSpot(regler.werte[key])` (Zielwert, nicht der gleitende), sprühen
am Griff dieser Achse die Funken an den Stellen `SWEET_SPOT_FUNKEN` (x über `balkenEnde`),
`r = 1.75`, Farbe `FARBE.gruen` (Sweet Spot = Ziel erreicht), versetzte `animationDelay` wie
bisher. Sonst keine Funken. Der lila/grüne Balken und der pulsierende Überstand/Fehlstück gegen
den Community-Median (`balkenVergleich`, `.delta-puls`) bleiben unverändert.

### 2d. Skala und Spur

- Spur-Verlauf der Regler (`linearGradient id={spurId}`): Sweet-Spot-Stil symmetrisch,
  `border` am Rand (0 % und 100 %), `accent` in der Mitte (50 %).
- Skala über den Balken: die gestrichelten Linien bei 0 bis 5 bleiben; die Linie bei 2,5
  kommt dazu, durchgezogen in `var(--color-accent)`, Deckkraft 0,5. Beschriftung statt der
  Zahlen 0 bis 5 drei Wörter: bei 0 „zu wenig“, bei 2,5 „Sweet Spot“ (font-medium, `text-text`
  bzw. volle Deckkraft), bei 5 „zu viel“. Achtung: die Balken wachsen nach links, 5 steht links.
  Auf schmalen Karten dürfen sich die Wörter nicht überlappen (textAnchor passend: „zu viel“
  `start`, „Sweet Spot“ `middle`, „zu wenig“ `end`).
- Titel der Skala links oben (heute `texte.aroma.erkundung.intensitaet`, „Terpen-Intensität“):
  neuer Text aus `aroma.karte.sweetSkala.titel`.

### 2e. Texte (de/en)

Neu unter `aroma.karte.sweetSkala`: `titel` („Sweet Spot je Geschmack“ / „Sweet spot per flavour“),
`wenig` („zu wenig“ / „too little“), `mitte` („Sweet Spot“ / „sweet spot“), `viel` („zu viel“ /
„too much“). Geändert:
- `aroma.karte.hinweisRegler`: „Zieh die lila Punkte links: zu wenig, genau richtig oder zu viel?
  Die Mitte ist der Sweet Spot.“ / „Drag the purple dots on the left: too little, just right or too
  much? The middle is the sweet spot.“
- `aroma.karte.reglerLegende`: „Dein Eindruck je Geschmacksrichtung, Sweet Spot in der Mitte“ /
  „Your impression per flavour, sweet spot in the middle“.
- `aroma.erkundung.anleitung`: „Zieh die lila Punkte links in der Karte: zu wenig, genau richtig
  oder zu viel? Die Mitte ist der Sweet Spot. Dazu leuchten die Terpene dieser Sorte auf, die die
  Richtung tragen.“ (en sinngemäß).
- `aria-valuetext` der Geschmacks-Regler (sr-only fieldset): Zone vorn, dann „x von 5“:
  `wenig` wenn Wert < 2,25, `mitte` wenn 2,25 bis 2,75, `viel` wenn > 2,75.
`intensitaet` bleibt im Wörterbuch, falls anderswo genutzt; sonst entfernen.

### Tests

Bestehende Tests, die Funken über dem Median, Linienbreite am Rohwert oder die Zahlen-Skala
prüfen, an die neue Regel anpassen (nicht löschen, sondern auf das neue Verhalten umschreiben).
Neu mindestens: Karte mit Regler auf 2,5 zeigt `delta-funke`, auf 3 nicht; Linie bei 2,5
`bogen-voll`, bei 5 `bogen-fluss` mit `--fluss-dauer:6s`; Skala zeigt die drei Wörter.

---

## Task 3: Terpen-Regler in die Karte (Box entfällt)

**Dateien:** `components/review/AromaKarte.tsx`, `components/review/AromaErkundung.tsx`,
`components/review/BewertungsFormular.tsx` (Typ-Import), `lib/aromakarte.ts`,
`components/review/TerpenRegler.tsx` (löschen), i18n de/en/typen, Tests.

Heute steht unter der Karte die Box `TerpenRegler` (je Terpen eine Spur 0 bis 5, Herstellerterpene
vorn, „Weitere Terpene“ zugeklappt). Die Karte zeigt rechts ohnehin alle bekannten Terpene
(Hersteller, ergänzt, Geister). Die Regler wandern dorthin; die Box entfällt.

### 3a. Verhalten (unverändert gegenüber heute)

- Wert je Terpen 0 bis 5 in ganzen Stufen (`terpenZeiger`, `terpenTaste` aus `lib/regler-raster.ts`).
- Ein nicht vom Hersteller angegebenes Terpen gilt als ergänzt, sobald sein Regler über 0 steht;
  auf 0 ist es nicht enthalten (`terpenEbenen` in `lib/aromakarte.ts`, schon vorhanden).
- Versteckte Formularfelder `terpen-*`, „Deine Nase vs. Community“, Ebenen und Bögen reagieren wie
  bisher auf `eigeneIntensitaet` in `AromaErkundung.tsx`.
- Nur in der Bewertungsmaske (`eingabe`). In der Anzeige keine Terpen-Regler.

### 3b. Schnittstelle

`AromaKarte` bekommt optional
`terpenRegler?: { werte: Readonly<Record<string, number>>; median?: Readonly<Record<string, number>>; aendern: (terpen: string, wert: number) => void }`.
`median` enthält nur Terpene mit mindestens einer Bewertung (heute `zeilen` mit `anzahl`).
Begleitstoffe (Ester, Thiole) bekommen keinen Regler.
`AromaErkundung` übergibt es nur bei `eingabe`, `aendern` rundet auf ganze Stufen (wie heute).
Die Typen `KatalogEintrag` und `TerpenZeile` ziehen nach `lib/aromakarte.ts` um; Importe anpassen.

### 3c. Geometrie (spiegelbildlich zu den Geschmacksbalken)

- Neue Konstante `REIHE = 44` (Zeilenabstand der Terpenspalte mit Reglern) und reine Funktion
  `kartenHoeheMitReglern(anzahl: number, hoehe: number): number =
  Math.max(hoehe, OBEN + RAND_UNTEN + (anzahl - 1) * REIHE)` in `lib/aromakarte.ts`
  (`anzahl` = Einträge der rechten Spalte inklusive Begleitstoffe).
- Mit `terpenRegler`: die Karte wird so hoch; die rechte Spalte verteilt sich über die ganze Höhe
  (`terpeneImKarte(anzahl, breite, gesamtHoehe)`), die Geschmacksachsen links behalten ihren
  Abstand (berechnet mit der normalen Höhe) und stehen vertikal mittig
  (Versatz `(gesamtHoehe - normaleHoehe) / 2`). Netz-Mittelpunkt auf die Gesamthöhe zentriert,
  Radius unverändert. viewBox und Prozent-Positionen der HTML-Beschriftungen nutzen die Gesamthöhe.
- Regler-Spur je Terpen rechts vom Knoten: von `knoten.x + 16` (Wert 0) bis `aktBreite - 14`
  (Wert 5), auf Höhe `knoten.y + 8`. Name (HTML) darüber auf `knoten.y - 10`, `text-small`,
  ohne Umbruch, zu lang mit Ellipse (`maxWidth` bis zum rechten Rand), `pointer-events-none`.

### 3d. Optik

- Spur: `rect` 4 hoch, `rx 2`, `GRAU`, Deckkraft 0,35, beim Überfahren des Terpens 0,9.
- Füllung von 0 bis zum Wert: Linie 4 breit, runde Enden, `FARBE.lila`.
- Griff: Kreis r 7 (überfahren 8), Füllung `FARBE.lila`, Rand `var(--color-surface)` 2, Schatten
  wie der Geschmacksgriff. Bei Wert 0 bleibt der Griff sichtbar (am Knoten), Deckkraft 0,6.
- Community-Median: grüner Ring r 9 (`FARBE.gruen`, 2 breit) mit Saum in Papierfarbe wie links.
- Trefferfläche: `rect` von `knoten.x + 4` bis zum rechten Rand, `knoten.y - 22` bis `+ 22`
  (44 hoch), `touch-none`, Ziehen setzt den Wert (Pointer Capture), `onPointerEnter` hebt das
  Terpen hervor (wie das Überfahren des Namens heute).

### 3e. Tastatur und Screenreader

Zweites `fieldset` (sr-only) neben dem der Geschmäcker: je Terpen ein `input type="range"`
0 bis 5, `step 1`, Label mit `terpenAnzeige(name)`, `aria-valuetext` wie heute im TerpenRegler
(`einordnung` + „x von 5“, bei Median „· Community-Median y“), Tasten über `terpenTaste`.
Fokus per Tastatur hebt das Terpen hervor und zeichnet einen Fokusring (r 12, `--color-focus-ring`)
um seinen Griff. Legende des fieldset neu: `aroma.karte.terpenLegende`
(„Wie stark du jedes Terpen riechst, 0 bis 5. Über 0 bei einem nicht angegebenen Terpen heißt:
von dir ergänzt.“ / en sinngemäß).

### 3f. Aufräumen

- `components/review/TerpenRegler.tsx` löschen; Eintrag in `tests/i18n-literale.test.ts` entfernen.
- `weitereOffen` und `reglerTerpene` in `lib/aromakarte.ts` entfernen, wenn danach unbenutzt
  (samt Tests). `einordnung` (Stufenname) nach `AromaKarte.tsx` oder `lib/` holen.
- Unbenutzte i18n-Schlüssel entfernen (`aroma.terpenRegler.weitere`, `weitereHinweis`,
  `nichtAngegeben`, `schwach`, `stark`, `aroma.erkundung.jeTerpen`), benutzte behalten.
- `aroma.karte.ergaenztHinweis`: „Von dir ergänzt, laut Hersteller nicht enthalten.“ /
  „Added by you, not included according to the producer.“
- `aroma.karte.hinweisRegler` um die rechte Seite ergänzen: „… Rechts: wie stark du jedes Terpen
  riechst; über 0 bei einem nicht angegebenen Terpen heißt ergänzt.“ (en sinngemäß).
- Tests zum TerpenRegler (`tests/aroma-ebenen.test.ts`) auf die Karten-Regler umschreiben:
  Maske rendert je Terpen einen Range-Input im Terpen-fieldset; Anzeige ohne Maske rendert keinen;
  `kartenHoeheMitReglern` (z. B. 3 Einträge → Mindesthöhe, 30 Einträge → 48 + 48 + 29·44 = 1372).
