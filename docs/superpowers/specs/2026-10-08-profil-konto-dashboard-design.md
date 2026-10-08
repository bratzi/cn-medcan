# Profil und Konto: Dein Kapitel im Grünen Buch (Design)

**Datum:** 2026-10-08 (Session 50)
**Status:** Entwurf, wartet auf Freigabe des Nutzers
**Bezug:** Spec Profil `2026-10-07-profil-dashboard-design.md` (Stufe 1 bis 3 live), Brand
`docs/brand/gruenes-buch.md`, Regelwerk `.claude/skills/ui-design-engine.md`

## 1. Auftrag

### Was der Nutzer gesagt hat
- Profil und Konto aktualisieren, nicht schmal, volle Breite als Art Dashboard, beide Seiten, ausbauen.
- Ausbau mit allen vier Bausteinen: Kennzahlen-Leiste, Umfragen im Konto, Meine Bewertungen,
  Aktivität und Verteilung. Weiter zwei Reiter.
- „Dieselbe Güte wie die Startseite vom UX und UI“, mit allen Design-Skills aus dem Set, „agenturlike,
  als ob wir eine Awwwards-Auszeichnung dafür bekommen haben“.
- Profil-Reste K1 und M2 mitnehmen.

### Erfolg
- Wer von der Startseite auf `/profil` wechselt, bleibt im selben Buch: gleiches Raster, gleiche zwei
  Stimmen (Druck und Hand), gleiche ruhige Bewegung. Kein Bruch zu einer generischen Karten-Ansicht.
- Ab 1080 px tragen beide Seiten die volle Fensterbreite auf dem Feldbuch-Raster; darunter eine
  klare Spalte ohne Überlauf bei 390 px.
- Die Umfragen-Schleife (Produktkern) ist im Konto sichtbar und persönlich: deine Stimme, ihr
  Ausgang, die Bewertung, die daraus wurde.
- Keine Mehrkosten: keine Migration, keine neue Bibliothek, kein GSAP außerhalb der Startseite.

### Eingesetzte Skills
`build-awwwards-quality-sites` (Art Direction, Bewegung als Erzählung), `design-taste-frontend`
(Design Read, Regler, Pre-Flight), `better-layout` (Raster, Gruppierung, Lesereihenfolge), `dataviz`
(Diagrammform, Marken, Barrierefreiheit), `ui-design-engine` (verbindliche Projektregeln, gehen bei
Konflikten vor). Beim Bauen dazu: `frontend-design`, `animate`, `emil-design-eng`, `better-ui`,
`better-typography`, `better-accessibility`, `better-writing`. Prüfung: `better-interface`,
`web-design-guidelines`, `critique-visual-hierarchy`, `critique-composition`,
`critique-information-density`, `critique-brand-consistency` an Screenshots der Live-Seite.

## 2. Design Read

Persönliches Kapitel im Grünen Buch für verifizierte Mitglieder, in der editorialen Buch-Sprache der
Startseite, als Daten-Ansicht mit mittlerer Dichte. Regler (`design-taste-frontend`): **Varianz 6,
Bewegung 5, Dichte 5**. Varianz unter der Startseite, weil hier gelesen und verglichen wird; Dichte
höher, weil es Daten sind; Bewegung ruhig und nur dort, wo sie etwas erzählt.

## 3. Leitidee: Dein Kapitel

Die Startseite ist das Buch des Betreibers. `/profil` ist **dein Kapitel darin**: dein Name steht als
Kapitelüberschrift im gedruckten Display-Grad, deine Zahlen stehen als Randnotizen wie auf der
Startseite (Zahl gedruckt, Wort von Hand, denn du bist Community), deine Daten liegen als Felder auf
dem Feldbuch-Raster. `/mitglied` ist dasselbe Kapitel von der anderen Seite: was du mitbestimmst
(Stimmen, Vorschläge) und was du einstellst.

Drei Mittel tragen die Idee, alle schon im Buch vorhanden:
1. **Feldbuch-Raster** (10 Spalten ab 1080 px, 4 darunter) als sichtbares Ordnungssystem; jedes Feld
   beginnt und endet auf einer Rasterlinie.
2. **Randnotizen** (Muster `Randspalte`/`AuftaktZahlen`): Zahl `numeric text-display`, Wort
   `font-hand text-notiz text-logo`.
3. **Freisteller und Schlagwort**: eine freigestellte Blüte im Kapitelkopf, dahinter ein blasser
   Buzz-Satz (`Schlagwort`), wie jede Startseiten-Sektion.

## 4. Raster und Felder

- Seite volle Breite, kein `max-w`. Hinter der Seite liegt `FeldbuchRaster` (heute nur Startseite).
- Inhalt in einem Raster, das genau auf den Linien liegt: `grid grid-cols-4 min-[1080px]:grid-cols-10`,
  Spaltenabstand 0, kein seitlicher Rand außen. So deckt sich jede Feldkante mit einer Rasterlinie.
- **Felder statt Karten:** ein Feld ist eine eckige Fläche in `surface`, die das Raster unter sich
  abdeckt, mit 1 px `border` links (die Rasterlinie läuft so sichtbar weiter) und einem
  Kapitelstrich oben (1 px `border-strong`). Kein Kartenrahmen, kein Schatten. Innenabstand `p-6`,
  ab 1080 px `p-8`. Zwischen zwei Feldreihen 64 px, in denen das Raster frei durchläuft.
- Feldkopf: Titel `text-h3` gedruckt, darunter höchstens ein Satz `text-small text-text-muted`. Keine
  Kleinversal-Labels über Titeln (Eyebrow-Regel).
- Inhalte wachsen nicht beliebig mit: Fließtext `max-w-[68ch]`, Netz höchstens 640 px.
- Unter 1080 px: jedes Feld über alle 4 Spalten, Reihenfolge wie im Raster von links nach rechts,
  oben nach unten. Ausnahme: Randnotizen zwei je Reihe.
- Seitliches Polster unter 1080 px kommt aus dem Feld selbst (`p-6`), das Raster bleibt randlos.

## 5. Kapitelkopf (beide Reiter)

Eine Reihe über 10 Spalten, Höhe aus dem Inhalt (kein Vollbild, das hier wäre Zierde):
- **Links, Spalten 1 bis 6:** Avatar `lg` (128 px, rund wie heute), darunter dein Anzeigename in
  `font-buch text-kapitel` (gedruckt, Leitplanke: Namen nie in Handschrift), `text-balance`,
  `wrap-break-word`. Darunter die Reiter.
- **Reiter:** zwei große gedruckte Links `text-h2` („Profil“, „Konto“), aktiver mit Unterstrich in
  `accent` und `aria-current="page"`, ungelesene Nachrichten als Zahl-Badge am Konto. Ersetzt die
  heutige kleine Reiterleiste (`ProfilReiter` wird umgebaut, nicht doppelt geführt).
- **Rechts, Spalten 7 bis 10:** ein Freisteller in Farbe. Profil: das Bild deiner bestbewerteten
  Sorte (`ersatzBildId` bzw. dein Bewertungsbild), ohne Bewertungen ein festes Musterbild. Konto: das
  Bild der Sorte, für die du zuletzt gestimmt hast, sonst Musterbild. Über `components/medien/Bild`.
  Unter 1080 px kleiner neben dem Namen oder entfällt (Entscheidung beim Prototyp, Regel: Name und
  Reiter immer ohne Scrollen sichtbar bei 390 × 700).
- **Schlagwort** hinter dem Kopf: Profil „dein geschmack“ (grün), Konto „deine stimme“ (lila).
- Konto: „Abmelden“ als sekundärer Pillen-Button rechts oben im Kopf.

### Randnotizen-Leiste (Kennzahlen)
Direkt unter dem Kopf, fünf Notizen zu je 2 Rasterspalten (mobil 2 je Reihe, die fünfte über 4).
Zahl gedruckt `numeric text-display`, Wort von Hand `font-hand text-notiz text-logo`, je Paar ein
`sr-only`-Satz, sichtbare Teile `aria-hidden` (Muster `Randspalte`). Wörter höchstens drei.

**Profil** (aus Daten, die die Seite ohnehin lädt):
1. Bewertungen: Anzahl, „bewertet“
2. Ø eigene Gesamtnote, eine Nachkommastelle, „im schnitt“
3. Ø Abstand zur Community, mit Vorzeichen, „zur community“; ohne fremde Noten entfällt die Notiz
4. Verschiedene Hersteller, „hersteller“
5. Letzte Bewertung als Datum `TT.MM.`, „zuletzt“

**Konto:**
1. Mitglied seit, Jahr, „dabei seit“
2. Abgegebene Stimmen, „gestimmt“
3. Davon Gewinner, „getroffen“
4. Eingereichte Blüten-Vorschläge, „vorgeschlagen“
5. Ungelesene Nachrichten, „neu“

Die Wörter werden beim ersten Anzeigen „geschrieben“ (bestehendes `@keyframes schreiben`, 80 ms
versetzt). Zahlen zählen **nicht** hoch: das bräuchte JavaScript-Bewegung, die das Regelwerk der
Startseite vorbehält.

## 6. Reiter Profil

### Raster ab 1080 px (Spalten in Klammern)
| Reihe | Felder |
|---|---|
| 1 | Geschmacksnetz (6), Terpene (4) |
| 2 | Bestätigte Vorschläge (6), Verlauf des Netzes (4) |
| 3 | Aktivität, 12 Monate (10) |
| 4 | Notenverteilung (3), Top und Flop (4), Lieblingshersteller (3) |
| 5 | Du und die Community (6), Schnitte (4) |
| 6 | Meine Bewertungen (10) |

Rhythmus bewusst wechselnd (6/4, 6/4 gespiegelt im Gewicht, 10, 3/4/3, 6/4, 10), damit keine
Reihe die vorige wiederholt (Layout-Wiederholungsverbot). Das Netz steht oben, weil es der Kern des
Profils ist; die lange Liste steht unten.

### Bestehende Felder
Inhalt wie heute, nur aus der Karte ins Feld. `TerpenRangliste` bekommt ein eigenes Feld. Der
Fehlerfall `netzFehlt` gilt für Netz, Terpene und Verlauf gleich.

### Aktivität (neu)
- Säulen je Monat der letzten 12 Monate inklusive laufendem, Wert = eigene Bewertungen.
- Form nach `dataviz`: eine Reihe, Größe über Zeit, also Säulen; keine Legende (der Titel nennt die
  Reihe), Werte direkt über jeder Säule ab 1, Null ohne Zahl. Säulen eckig (Projektregel 5 geht vor
  der runden Datenkante aus `dataviz`), 2 px Abstand zwischen Säulen.
- Farbe: Fläche `text-muted` mit geringer Deckkraft, der laufende Monat in `text` (Regel 4: Daten in
  Tinte, nicht in `accent`). Achse nur als Grundlinie, Monatskürzel per `Intl` darunter.
- Kein Tooltip: alle Werte stehen direkt an den Säulen, ein Tooltip wiederholte sie nur (begründete
  Abweichung von der Hover-Vorgabe in `dataviz`). Hover hebt die Säule auf `text` an.
- Server-SVG ohne Bibliothek, `aria-hidden`, daneben `sr-only`-Tabelle Monat/Anzahl.
- Ohne Bewertung im Zeitraum: ein Satz und der Weg zur ersten Bewertung, keine leere Achse.

### Notenverteilung (neu)
Waagerechte Balken je Notenstufe (`w.schema.noten`, ganze Noten aus `noteOderErsatz`), Zahl am
Balkenende, **ohne Hintergrundspur** (Pre-Flight-Verbot gefüllter Spuren). Farbe wie oben, häufigste
Stufe in `text`. `sr-only`-Liste.

### Meine Bewertungen (neu): Register mit Bildern
- Statt einer Tabellenwüste ein Bild-Register: je Bewertung ein Eintrag mit Bild (dein erstes
  Bewertungsbild, sonst `ersatzBildId`), Handelsname gedruckt (Link auf die Blütenseite), deine Note
  groß `numeric text-h2`, darunter Community-Mittel mit Anzahl und Abstand, Datum.
- Ab 1080 px 5 Einträge je Reihe (je 2 Rasterspalten), darunter 2. Bild 4:5, `object-contain` auf
  `surface-sunken` (Freisteller und Fotos gemischt sauber).
- Sortieren über Pillen-Links über dem Register (`?sortierung=datum|note|abstand`), aktiver mit
  `aria-current`, Richtung fest (Datum neu zuerst, Note hoch zuerst, Abstand größter Betrag zuerst),
  ungültig fällt auf `datum`. Ohne JavaScript, scrollt per Anker `#bewertungen` zurück.
- Erst 10 Einträge, darunter „Alle n zeigen“ (`?alle=1`), dann alle geladenen (höchstens 1000; die
  Bilder laden `lazy`).
- Hover: Bild skaliert 1,03 (transform, 250 ms), Name bekommt die Unterstrichfarbe.
- Datenquelle: `ladeAuswertungsZeilen` liefert Zeilen schon; neu dazu je Sorte `slug`,
  `herstellerBildPfad` und die erste eigene Bild-Id in derselben Abfrage (`select` über die Relation,
  keine Schleife).

## 7. Reiter Konto

### Raster ab 1080 px
| Reihe | Felder |
|---|---|
| 1 | Umfrage jetzt (6), Status (4) |
| 2 | Meine Stimmen (10) |
| 3 | Benachrichtigungen (6), Meine Blüten-Vorschläge (4) |
| 4 | Profilbild (3), Angaben (4), Öffentliches Profil (3) |
| 5 | Verwaltung, nur Admin (10, flach) |

### Umfrage jetzt (neu)
- Läuft eine Runde: das Feld ist ein **Stimmzettel** (Regel 5 erlaubt dort `shadow-md`): Rundentitel
  gedruckt, Phase in Klartext, bei `VORSCHLAG` „Vorschläge bis“ Datum, bei `ABSTIMMUNG` deine Wahl
  (Handelsname gedruckt) mit Vermerk von Hand „deine wahl“ (`font-hand text-vermerk`, Regel 1:
  Vermerke am Stimmzettel) oder der Satz „Du hast noch nicht abgestimmt.“ und die eine gefüllte
  Primäraktion der Seite „Zur Abstimmung“. Nicht freigegeben: Hinweis, dass deine Stimme erst nach
  der Freigabe zählt.
- Läuft keine: ein Satz und Link auf `/umfragen`.

### Meine Stimmen (neu): die Schleife
- Je Runde mit deiner Stimme ein Eintrag, neueste zuerst, höchstens 10, 5 je Reihe wie das Register:
  Bild der gewählten Sorte, Handelsname, Rundentitel, Datum der Stimme, Ausgang als Badge mit
  Klartext und Formmarker („läuft“, „gewonnen“, „nicht gewonnen“). Bei gewonnen und vorhandener
  Bewertung (`ergebnisReviewId`) der Link „Zur Bewertung“.
- Leer: „Noch keine Stimme abgegeben.“ und Link zu `/umfragen`.

### Datenzugriff `lib/query/konto.ts` (neu)
Eine `findMany` auf `stimme` (`take: 10`, `orderBy abgegebenAm desc`) mit `select` über
`option.strain` (slug, handelsname, herstellerBildPfad), `option.istGewinner`,
`option.ergebnisReviewId`, `umfrage.titel/phase`; eine `$queryRaw` für `COUNT(*)` und
`SUM(o.ist_gewinner)` aller Stimmen; `aktiveUmfrage()` und `eigeneStimme()` wie vorhanden. „Dabei
seit“ aus `mitglied.erstelltAm`: `aktuellesMitglied()` liest den Satz schon mit allen Skalaren, das
Feld kommt nur in `AngemeldetesMitglied` dazu. Plus höchstens zwei Abfragen je Aufruf.

### Bestehende Felder
Status, Benachrichtigungen, Vorschläge, Avatar, Sichtbarkeit, Angaben, Verwaltung: Inhalt wie heute.

## 8. Bewegung (nur CSS, jede mit Grund)

| Was | Wie | Grund |
|---|---|---|
| Kapitelname | `clip-path: inset()` von unten, einmal beim Laden, 0,7 s | Hierarchie: das Kapitel beginnt |
| Wörter der Randnotizen | `schreiben` von links, 80 ms versetzt | Erzählung: von Hand mitgeschrieben |
| Felder | Vorhang `clip-path: inset()` von oben beim Eintritt (`animation-timeline: view()`) | Brand 7: Sektionswechsel als Vorhang |
| Freisteller | Tiefenebene, `translate` gekoppelt an den Scrollweg | Brand 7: Tiefenebenen auf allen Seiten |
| Säulen und Balken | `scale` von der Grundlinie beim Eintritt, 40 ms versetzt | Erzählung: die Menge wächst |
| Netz | Deckkraft und `scale` aus der Mitte beim Eintritt | Zustand: dein Netz steht |
| Reiterwechsel | React `<ViewTransition>`: Kopf bleibt stehen, Inhalt blendet über | Brand 7: Seitenwechsel |
| Skelett zu Inhalt | `<ViewTransition>` um jede `Suspense` | Zustand: geladen |
| Hover | Farbe, Unterstrichfarbe, Bild-`scale` 1,03, 180 bis 350 ms | Rückmeldung |

Scroll-gekoppeltes nur unter `@supports (animation-timeline: view())` und
`prefers-reduced-motion: no-preference`; ohne Unterstützung steht alles sofort. Reduziert: keine
Animation, keine Übergänge. Ohne JavaScript vollständig. Kein GSAP, kein Lenis, keine Endlosschleife.

## 9. Laden, Leere, Fehler
- Kopf und Reiter stehen sofort (eine Abfrage: Sitzung). Jede Feldreihe streamt in eigener
  `Suspense` mit einem Skelett in der Form des Felds (Muster `AuftaktZahlenSkelett`). Geteilte Daten
  über `cache()`, damit Netz, Terpene und Kennzahlen dieselbe Abfrage nutzen.
- Jedes Feld hat einen Leerzustand: ein Satz in Du-Form und der nächste Schritt (erste Bewertung,
  zur Umfrage, Blüte vorschlagen). Neues Mitglied: Randnotizen zeigen 0, Diagramme ihren Satz.
- Gescheiterte Abfrage: Satz `texte.fehler` im Feld, der Rest steht (`oderNull` wie heute).

## 10. Profil-Reste

### K1: Profil-Upsert in die D1-Batch
`profilFortschreiben` schreibt heute erst die Vorschläge per `DB.batch`, dann das Profil per Prisma.
Neu: `INSERT … ON CONFLICT(mitglied_id) DO UPDATE` in derselben Batch, als reine Funktion
`profilErsetzen` neben `empfehlungenErsetzen`. `berechnet_am` wird gebunden wie der D1-Adapter
schreibt: `toISOString().replace("Z", "+00:00")`.

### M2: CPU der Verlaufsrechnung
`profilVerlauf` rechnet das Netz (`geschmackAusVektor`) nur noch für die letzten 60 Schritte, die
Summen weiter für alle. Ergebnis gleich (Test vergleicht für 1, 60, 61, 1000 Bewertungen).

M10 ist nirgends aufgeschrieben und wird nicht geraten.

## 11. Regeländerungen (bitte bestätigen)
1. **Handschrift auf `/profil` und `/mitglied`:** Regel 1 nennt die Orte der Community-Stimme; neu
   dazu die Randnotizen des Kapitelkopfs und der Vermerk „deine wahl“ am Stimmzettel. Grund: das
   Mitglied ist Community. Grenzen bleiben (≥ 32 px, ≤ 6 Wörter, nie Namen, Zahlen, Daten).
2. **Feldbuch-Raster und Schlagwort außerhalb der Startseite**, auf diesen zwei Seiten.
3. Regelwerk und Brand-Dokument werden mit diesen zwei Punkten nachgeführt.

## 12. Texte
Neue Schlüssel in `lib/i18n/de.ts` und `en.ts` (Randnotizen, Aktivität, Verteilung, Register,
Sortierung, Umfrage jetzt, Stimmen, Ausgänge, Leersätze). Du-Form, keine Geviert- und
Gedankenstriche, keine Füllverben, keine Wirkungsversprechen (HWG). Wirkungsnote nur in „Schnitte“.
Vor Abschluss Text-Durchsicht mit `better-writing`.

## 13. Tests
- `lib/profil-dashboard.ts` (neu, rein): Monatsreihe (Grenzen, UTC, laufender Monat), Verteilung
  (Rundung, leere Stufen), Randnotizen (Abstand entfällt ohne fremde Noten), Sortierung, Kürzung,
  ungültige `sortierung`.
- `lib/konto.ts` (neu, rein): Stimme zu Ausgang („läuft“, „gewonnen“, „nicht gewonnen“).
- `profilErsetzen`: ein Upsert mit allen Spalten und Datumsformat.
- `profilVerlauf`: gleiches Ergebnis wie vorher.
- `tests/marke.test.ts` greift weiter: jede `font-hand` mit Handschrift-Grad.
- tsc, eslint, `npm run farben`, Vitest.
- Live per Browser-MCP (Chrome im Vordergrund): 1440, 1080, 1024, 390 px, hell und dunkel, beide
  Reiter, als Betreiber; Screenshots durch die `critique-*`-Skills und `better-interface`; reduzierte
  Bewegung; Tastatur durch beide Reiter.

## 14. Nicht im Umfang
Keine Migration, keine neue Tabelle, keine Diagramm-Bibliothek, kein GSAP auf diesen Seiten, keine
Client-Komponente für Sortierung. Öffentliches Profil `/profil/<kurz-id>` bleibt wie es ist
(kann das Kapitel-Muster später übernehmen).
