# Bewertung v2, Buch, Empfehlungen: Masterplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (Nutzerwahl: eine Session je Task).
> Der Auftrag umfasst ~15 eigenständige Teilsysteme. Deshalb ist dies ein **Masterplan**: je Task
> steht hier das Was, das Warum, die Dateien, die Skills und die Abnahme. Zu Beginn jeder Session wird
> für genau diesen Task ein Detailplan mit Code-Schritten (TDD) geschrieben,
> `docs/superpowers/plans/2026-09-29-t<N>-<name>.md`. Danach folgt die Umsetzung, der Push, die
> Live-Prüfung, die Meldung an den Nutzer, das Sichern von HANDOFF und das Clear.

**Goal:** Das „Grüne Buch“ wird zum Buch zum Blättern. Die Bewertung trennt Sorte und Charge, misst
Terpene gegen den Median der Community, bekommt eine Gesamtnote in Blättern und trägt persönliche
Empfehlungen. Dazu kommen Avatare, eigene Budpics mit Freigabe, eine Terpen-Sektion und eine neue
Schalterleiste.

**Architecture:** Next 16 App Router auf Cloudflare Workers (Free), D1 über Prisma. Jede Rechenlogik
kommt als reine Funktion in `lib/`, mit Vitest-Tests (Median, Abweichung, Empfehlung, Fazit). Bilder
werden im Browser verkleinert (Canvas → WebP) und landen als BLOB in D1, weil R2 nicht kostenlos ist.
Ausgeliefert werden sie über eine gecachte Route.

**Tech Stack:** Next 16, React 19, Prisma + D1, better-auth, GSAP/Lenis, Tailwind, Vitest.

**Spec:** Nutzerauftrag vom 2026-09-29 (Chat, im HANDOFF zitiert) sowie dieser Plan.

## Global Constraints

- Nie kostenpflichtig: kein R2 und kein Paid-Plan. Bilder liegen in D1, ≤ 150 KB je Bild und ≤ 30 KB je Avatar.
- HWG: keine Wirk- oder Heilangaben, auch nicht in Empfehlungen („ähnliches Aroma“, nie „ähnliche Wirkung“).
- CPU-Limit Free 10 ms: Median und Empfehlung werden **beim Speichern einer Bewertung** vorberechnet und
  gespeichert, nicht je Seitenaufruf.
- Kein lokales `next dev` oder `next build`. Geprüft wird mit tsc, eslint und vitest lokal, dann Push und
  Live-Prüfung im Browser-MCP.
- Build-Regel: nach einem Code-Push ~13 min nicht erneut pushen.
- Regelwerke bei jeder UI-Arbeit: `ui-design-engine` und `docs/brand/gruenes-buch.md`. Bei D1 und Caching
  gilt `edge-stack-master`.
- Alle UI-Texte kommen in beide Wörterbücher (`lib/i18n` de/en).

## Review Focus

1. Sorte **ohne jede Community-Bewertung**: kein Median. Der grüne Regler fehlt, und es erscheint der
   Hinweis „noch kein Community-Wert“. Nichts zeigt 0 oder NaN.
2. Nutzer bewertet dieselbe Sorte ein zweites Mal: der Datensatz wird aktualisiert (upsert je
   Nutzer × Sorte), es entsteht kein Duplikat, und der Median wird neu berechnet.
3. Buch mit genau **einer** Bewertung: es wird nicht geblättert, der Play-Knopf ist verborgen, und ein
   Klick auf die Seiten tut nichts.
4. Upload von einem 12-MB-HEIC oder einer Nicht-Bilddatei: sauber abgelehnt mit Meldung. Der Server prüft
   Typ und Größe erneut, denn der Client ist nicht vertrauenswürdig.
5. `prefers-reduced-motion` oder Sparmodus an: kein Autoblättern, kein Video, keine Cursor-Animation. Das
   Blättern per Klick geht weiter, ohne Animation.

---

## Reihenfolge und Tasks

Die Tasks sind nach Abhängigkeit sortiert: erst das Testwerkzeug, dann die Schnellgewinne, dann das
Datenmodell, auf dem alles Weitere steht.

### T0: Testnutzer
- Freigegebenes Mitglied `testnutzer@book-of-terpz.test` mit zufälligem Passwort. Angelegt wird es über die
  better-auth-Registrierung live und danach in `/admin` freigegeben. Die Zugangsdaten kommen in `.env.local`
  (`TESTNUTZER_EMAIL`, `TESTNUTZER_PASSWORT`); die Datei ist gitignored.
- Abnahme: Anmeldung live mit dem Testnutzer klappt, der Status ist freigegeben.

### T1: Videos austauschen
- Storytelling Video 1 kommt von Pexels 7667290. Das Hero- bzw. erste Bild bekommt eine Theme-Variante:
  dunkel wie bisher, hell mit Pexels 3153124 (per `<source media="(prefers-color-scheme…)">` oder über das
  Theme-Attribut in `components/medien/Loop.tsx`). Die Dateien kommen einmal über die Pexels-Download-URL,
  in kleiner Auflösung (≤ 1280 px, SD-Datei), dazu ein Standbild-WebP. Lizenz-Credit gehört in den Fuß.
- Dateien: `public/medien/*`, `lib/medien.ts`, `components/medien/Loop.tsx`, Credits in `Fuss.tsx`.
- Skills: `ffmpeg` (nur falls lokal vorhanden, sonst direkt die kleine Pexels-Datei), `cloudflare:web-perf`.

### T2: Schalterleiste unten rechts
- Eine feste, vertikale, zurückhaltende Leiste unten rechts (kleine 36-px-Symbole mit 44-px-Trefferfläche,
  halbtransparent, bei Hover voll) mit vier Schaltern:
  1. **Sprache als Flagge**: sie zeigt die aktive Sprache (DE bzw. GB) und wechselt beim Klick.
  2. **Theme**: der bisherige `ThemaSchalter`, verkleinert.
  3. **Cursor**: Standard ↔ Joint (die Bong folgt in T13).
  4. **Sparmodus**: pausiert Videos, Lenis, GSAP-Endlosschleifen, JointCursor, Karten-Puls und
     Blob-Rotation. Er wird per `data-sparmodus` auf `<html>` und in localStorage gespeichert und ist
     vorbelegt, wenn `saveData` aktiv ist.
- Sprache und Theme verlassen Kopf und Menü.
- Dateien: neu `components/layout/SchalterLeiste.tsx`, `lib/sparmodus.ts` (+Test), Anpassungen in
  `Kopf.tsx`, `KopfMenue.tsx`, `SprachSchalter.tsx`, `ThemaSchalter.tsx`, `JointCursor.tsx`,
  `medien/loops.ts`, `app/globals.css`, `app/layout.tsx`.
- Skills: `better-ui`, `fitts-law`, `emil-design-eng`, `better-accessibility`, `ui-design-engine`.

### T3: Datenmodell Bewertung v2 (Fundament)
- Migration `0009_bewertung_v2.sql`:
  - `gesamtnote` REAL (0.5–5 in 0,5er-Schritten) und `qualitaet_*` als **Charge** (mit Kennzeichnung).
  - Terpen-Intensität je Terpen, **auch für Terpene ohne Herstellerangabe** (`herstellerangabe` bool abgeleitet).
  - Unique-Index (nutzer_id, produkt_id).
  - Tabelle `sorten_kennwerte` (produkt_id, terpen- und geschmacks-Median als JSON, overall-Median,
    Gesamtnote-Mittel, Anzahl, aktualisiert_am). Befüllt wird sie beim Speichern.
- Regeln (reine Funktionen `lib/bewertung-v2.ts` + Tests):
  - Overall: je höher, desto besser.
  - Qualität (Charge): Sweet Spot in der Mitte, Score = 1 − |x − Mitte| / Halbspanne. Sie fließt **nicht**
    in die Sortenkennwerte.
  - Terpene: Median der Community je Terpen. Die Abweichung des Nutzers ist mittlere |Δ| zum Median plus
    die Liste der ergänzten Terpene.
- Bestehende Bewertungen werden migriert (Gesamtnote NULL, bleibt zulässig).
- Skills: `migration`, `cloudflare-d1`, `prisma-client-api`, `test-driven-development`, `edge-stack-master`.

### T4: Bewertungsmaske in der Blütenseite, /bewerten entfällt
- Die vorhandene Maske in der Blütenseite wird zur einzigen. Angemeldete, freigegebene Nutzer sehen ihre
  gespeicherte Bewertung vorbelegt; Speichern ist ein upsert.
- Ganz oben: **Gesamtnote mit 5 Cannabisblättern**, groß und zentral, mit halben Blättern (Klick auf die
  linke oder rechte Blatthälfte), gefüllt grün, leer nur Kontur, Tastatur per Pfeil ±0,5.
- Die Qualität wird als „Diese Charge“ beschriftet und hat eine Sweet-Spot-Skala in der Mitte.
- `/bewerten/[slug]` antwortet mit 308 auf `/blueten/[slug]#bewerten` (`lib/alte-adressen.ts`).
- Dateien: `components/review/BewertungsFormular.tsx`, neu `BlattNote.tsx`, `app/blueten/[slug]/page.tsx`,
  `app/bewerten/aktionen.ts` wird zu `app/blueten/[slug]/aktionen.ts`.
- Skills: `animate`, `fitts-law`, `better-accessibility`, `emil-design-eng`, `ui-design-engine`.

### T5: Aroma-Karte korrigieren
- Denkfehler: ein Geschmack aktiviert alle seine Terpene. Die Lösung hat drei Ebenen:
  1. **Hervorgehoben** (voller Puls): Terpene aus der Herstellerangabe.
  2. **Vom Nutzer ergänzt** (gestrichelte Kontur, eigene Farbe): nur Terpene, die der Nutzer selbst im
     Sweet Spot setzt.
  3. **Nur über Geschmack verbunden**, aber nicht im Strain: ein blasser Geisterbogen ohne Puls, im Hover
     mit dem Hinweis „passt zum Geschmack, laut Hersteller nicht enthalten“.
- Wählt man einen Geschmack, leuchten **nur die Schnittmenge** mit Ebene 1 und 2 auf, alle übrigen bleiben
  Geister. So bleiben Effekte und Puls erhalten, zeigen aber nur Echtes.
- Die Skala links bekommt „Terpen-Intensität: Sweet Spot gesucht“, der grüne Regler steht auf dem
  **Community-Median** (statt Herstellerwert), der Nutzerregler daneben.
- Am Kartenende steht die **Abweichungsmetrik**: „Deine Nase vs. Community: Ø Δ x, n ergänzte Terpene“.
- Dateien: `lib/aromakarte.ts` (+Tests), `components/review/AromaKarte.tsx`, `SweetSpot.tsx`,
  `AromaErkundung.tsx`.
- Skills: `dataviz`, `critique-visual-hierarchy`, `law-of-similarity`, `animate`, `ui-design-engine`.

### T6: Fazit nachschärfen
- `lib/fazit.ts` wird neu gebaut und in zwei Teile getrennt: **Sorte** (Overall, Terpen-Abgleich,
  Gesamtnote) und **Charge** (Qualitäts-Balance). Dazu kommen das Community-Fazit (Median) und
  „Deine/Betreiber-Bewertung im Vergleich“. Die Charge taucht nie im Sortenwert auf.
- Skills: `better-writing`, `test-driven-development`.

### T7: Buch zum Blättern
- Alle Bewertungen einer Sorte (Betreiber zuerst, dann Community) laufen in **einer** Doppelseite
  (`Doppelseite.tsx`). Die linke Seite zeigt Kopf, Avatar, Name, Datum, Blätter-Note und darunter den
  Bewertungstext, der die bisher freie Fläche füllt. Die rechte Seite zeigt Werte, Karte und Charge.
- Umblättern per CSS-3D-Seitendrehung (`rotateY`, `transform-origin` am Falz, Schatten-Verlauf):
  - Klick links heißt zurück, Klick rechts heißt weiter. Pfeiltasten und Wischen gehen ebenfalls.
  - Autoplay alle 8 s mit Play/Pause-Knopf im Stil von `LoopSchalter`. Es pausiert bei Hover, Fokus,
    verborgenem Tab, Sparmodus und reduced-motion.
- Die bisherige Liste untereinander entfällt.
- Skills: `animate`, `apple-design`, `emil-design-eng`, `better-accessibility`, `build-awwwards-quality-sites`.

### T8: Avatare
- Jeder Nutzer kann in `/mitglied` ein Bild hochladen. Es wird im Browser auf 128×128 WebP zugeschnitten
  und in D1 (`nutzer_avatar`) gespeichert. Ohne Bild erscheint ein generierter Initialen-Kreis.
- Die Komponente `components/ui/Avatar.tsx` steht überall neben dem Nutzernamen: Buch, Community,
  Kopf-Konto, Admin.
- Bild-Route `app/api/bild/[id]/route.ts` mit `Cache-Control: public, max-age=31536000, immutable`
  (die ID wechselt bei neuem Bild).
- Skills: `better-ui`, `security-review` (Upload), `cloudflare-d1`.

### T9: Budpics
- Hochladen können nur angemeldete, freigegebene Nutzer, und zwar an jeder Stelle, an der ein Blütenbild
  erscheint (Blütenseite, Karte im Katalog über „Bild beitragen“). Mehrere Dateien sind möglich; jede wird
  im Browser auf ≤ 1280 px und ≤ 150 KB WebP verkleinert.
- Tabelle `budpics` (produkt_id, nutzer_id, daten BLOB, breite, hoehe, status offen/frei/abgelehnt,
  erstellt_am). Freigabe in `/admin` als eigener Abschnitt.
- Anzeige: freigegebene Bilder laufen als Diashow (Überblenden, 5 s, Pause bei Hover und im Sparmodus).
  Ohne echtes Bild erscheint ein **zufälliges, pro Sorte stabiles** Musterbild aus `public/medien/bluete-*`
  (Hash des Slugs). Der Tooltip nennt Nutzer und Datum, beim Muster „Musterbild“.
- Skills: `security-review`, `animate`, `better-accessibility`, `cloudflare-d1`.

### T10: Vorschlagen und Anlegen mit einem Wert
- THC und CBD werden als **ein** Wert eingegeben, nicht als Spanne. Das gilt für Vorschlag, Admin-Anlage und
  Validierung (`lib/admin-eingabe.ts`, `lib/mitglied-eingabe.ts` + Tests). Im Formular gibt es Upload
  (Budpics aus T9).
- Skills: `surgical-patch`, `better-writing`.

### T11: Persönliche Empfehlungen (HIGH FEATURE)
- Aus allen Bewertungen des Nutzers (Gesamtnote ≥ 3,5 positiv, ≤ 2 negativ, gewichtet) entsteht ein
  **Geschmacksprofil**: ein Vektor über Terpene und Geschmäcker aus seinen Reglern und den Herstellerangaben
  der Sorte.
- Jede nicht bewertete Sorte bekommt ein Ähnlichkeitsmaß (Kosinus) zum Profil. Negative Sorten ziehen ab.
  Top 6 mit Begründung: „weil dir *X* gefiel: gemeinsam Myrcen, Limonen, zitrisch“.
- Nur Aroma, nie Wirkung (HWG). Berechnet wird beim Speichern einer Bewertung; das Ergebnis liegt in
  `nutzer_empfehlungen`.
- Ausgabe in `/mitglied` („Könnte dir gefallen“), auf der Blütenseite („Ähnlich im Aroma“, auch für Gäste
  über die Terpen-Ähnlichkeit) und **auf der Startseite als eigene Sektion**. Für Gäste ist das eine
  erklärende Teaser-Seite mit Anmelde-Aufruf; Angemeldete sehen ihre Liste.
- Skills: `lean-build`, `test-driven-development`, `peak-end-rule`, `better-writing`, `design-taste-frontend`.

### T12: Startseite „Terpene und Geschmäcker“
- Eine neue Sektion zwischen Storytelling und „Was der Hersteller verspricht“. Sie zeigt alle verfügbaren
  Terpene und Geschmäcker als interaktives Register: Terpen wählen, dann Duft, Vorkommen und Geschmäcker.
  Geschmack wählen, dann Terpene; dazu die Zahl unserer Sorten mit dem Terpen. Zur Nachbarsektion wird
  angeglichen, Bewegung mit GSAP, nur Duft-Aussagen (HWG).
- Skills: `build-awwwards-quality-sites`, `design-taste-frontend`, `frontend-design`, `dataviz`,
  `critique-information-density`, `hicks-law`, `ui-design-engine`.

### T13: Bong-Cursor (wenn Zeit ist)
- Eine dritte Cursoroption: die Bong als SVG, mit Blubberblasen (CSS) und Rauch (Wiederverwendung von
  `joint-rauch.ts`). Aus bei Sparmodus und reduced-motion.
- Skills: `animate`, `emil-design-eng`.

### T14: Impressum-Interview
- Das Interview läuft mit `AskUserQuestion` und füllt `lib/rechtliches.ts` (Name, Anschrift, Kontakt,
  Verantwortlicher, Hosting, Datenschutzangaben zu Avataren und Budpics aus T8/T9). Es findet nach T9
  statt, damit die Datenschutzerklärung die Uploads abdeckt.

## Ablauf je Task

1. Detailplan schreiben (writing-plans), 2. TDD umsetzen, 3. tsc, eslint und vitest, 4. commit und push,
5. nach dem Build live prüfen (Browser-MCP, Desktop und 390 px, hell und dunkel), 6. dem Nutzer melden,
7. HANDOFF aktualisieren und pushen, dann das Clear freigeben.
