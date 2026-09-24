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
- **Gedruckt** (Betreiber): Newsreader, Geist, Geist Mono, Papier und Tinte. Messwerte, Reviews,
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
- Geist: 400, 500, 600. Newsreader 200 **nur ab 40 px** (`text-manifest`, `text-titel`, `text-kapitel`), sonst 500; 800 nur für kurze Kapitelmarken.
- Große Grade tragen negative Laufweite aus dem Token; nie per Klasse überschreiben.
- Auftakt (Referenz choreograffiti): die h1 ist die Wortmarke in `text-plakat` von Rand zu Rand.
- Jede Startseiten-Sektion trägt einen Buzz-Satz (höchstens drei Wörter) über `components/story/Schlagwort` in `text-kulisse`, `text-border`, aria-hidden; Sektion `relative isolate overflow-x-clip`.
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
- Zweiter Bogen (Spec Redesign 9): runde Bildrahmen (`rounded-full`) für die Prüfpunkte im Manifest, um die der Text per `shape-outside` fließt.
- Schatten nur als Ebenen-Signal (`shadow-md` Stimmzettel und Doppelseite, `shadow-lg` Dialoge).
  Freigestellte Motive tragen ihren Kontaktschatten aus der Pipeline, kein CSS-`drop-shadow`.
- Fokus: die globale Regel in `globals.css` (2 px `focus-ring`, 2 px Abstand); der Umriss folgt dem
  Radius des Elements. Nie `outline: none`.

## 6. Medien
- Seit Redesign 9 in **Farbe**: Freisteller mit Alpha (`scripts/medien/freistellen.py`, `freigestellt: true`, kein Mischmodus), Bühnenvideo im Auftakt (`Loop buehne`) in echten Farben. Schwarzweiß ist abgelöst.
- Stimme der Startseite ist **wir** (Spec Redesign 10); gesetzte Plätze des Betreibers werden auf der Startseite nicht erwähnt.
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
