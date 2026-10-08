# Profil und Konto als Dashboard (Design)

**Datum:** 2026-10-08 (Session 50)
**Status:** Entwurf, wartet auf Freigabe des Nutzers
**Bezug:** Spec Profil `2026-10-07-profil-dashboard-design.md` (Stufe 1 bis 3 sind live)

## 1. Ziel

`/profil` und `/mitglied` (Reiter „Profil“ und „Konto“) stehen heute in einer 720 px schmalen
Spalte, alle Karten untereinander. Der Nutzer will beide Seiten **über die volle Breite als
Dashboard** und **inhaltlich ausgebaut**.

### Was der Nutzer gesagt hat
- Profil und Konto aktualisieren, nicht schmal, volle Breite als Art Dashboard, beide Seiten.
- Ausbauen mit allen vier angebotenen Bausteinen: Kennzahlen-Leiste, Umfragen im Konto, Meine
  Bewertungen, Aktivität und Verteilung.
- Weiter zwei Reiter (Profil = Geschmack und Auswertung, Konto = Status, Umfragen, Nachrichten,
  Einstellungen).
- Offene Profil-Reste K1 und M2 aus den Reviews mitnehmen.

### Erfolg
- Ab `lg` (1024 px) nutzen beide Seiten die Breite in einem Raster; kein Bereich ist breiter als
  sein Inhalt sinnvoll trägt (Fließtext bleibt bei `max-w-[68ch]`).
- Unter `lg` stapeln die Bereiche in einer sinnvollen Lesereihenfolge, kein Seitenüberlauf bei 390 px.
- Die Umfragen-Schleife (Produktkern) ist im Konto sichtbar: laufende Runde, eigene Stimme, was aus
  früheren Stimmen geworden ist.
- Keine Mehrkosten: keine neue Tabelle, keine neue Migration, D1-Abfragen je Seitenaufruf höchstens
  plus zwei.

## 2. Rahmen (Entscheidung Claude)

- Container wie der Katalog (`app/[lang]/blueten/page.tsx`): `mx-auto w-full max-w-7xl px-4 py-16
  sm:px-6`. Volle Breite heißt also 1280 px Inhalt, nicht randlos: randlos würde Tabellen und
  Diagramme auf 1920 px zerziehen.
- Raster ab `lg`: 12 Spalten, `gap-6` (24 px). Darunter eine Spalte, `gap-6`.
- Bereiche bleiben `Card` mit `CardHeader`/`CardBody` (eckig, Regel 5). Jede Karte trägt
  `h-full`, damit Nachbarn in einer Reihe gleich hoch enden.
- Kopf (beide Reiter gleich): Avatar, h1, Unterzeile, rechts Abmelden (Konto) bzw. nichts; darunter
  `ProfilReiter`; darunter die Kennzahlen-Leiste des Reiters.

## 3. Kennzahlen-Leiste (neu, beide Reiter)

Komponente `components/profil/Kennzahlen.tsx`: eine `dl`-Leiste, ab `sm` 2 Spalten, ab `lg` so
viele Spalten wie Kacheln (4 bzw. 5). Jede Kachel: Wert in `numeric text-h1`, Bezeichnung in
`text-small text-text-muted`. Fehlt ein Wert (Abfrage gescheitert), steht „–“ nicht, sondern die
Kachel entfällt. Kein Hochzählen (Regel 7: Story-Bewegung nur auf der Startseite).

**Profil** (alle aus Daten, die die Seite schon lädt, keine neue Abfrage):
1. Bewertungen (Anzahl)
2. Ø eigene Gesamtnote (eine Nachkommastelle, de-DE)
3. Ø Abstand zur Community (vorzeichenbehaftet, nur Sorten mit fremden Noten; ohne solche entfällt)
4. Letzte Bewertung (Datum)

**Konto** (aus der neuen Konto-Abfrage, Abschnitt 5):
1. Mitglied seit (Monat und Jahr)
2. Abgegebene Stimmen
3. Davon Gewinner (Stimmen, deren Sorte gewonnen hat)
4. Eingereichte Blüten-Vorschläge (`SortenVorschlag`, wie heute die Liste)
5. Ungelesene Nachrichten

## 4. Reiter Profil

### Raster ab lg (Entscheidung Claude)
| Reihe | Links | Rechts |
|---|---|---|
| 1 | Geschmacksnetz (7 Spalten) | Terpen-Rangliste (5) |
| 2 | Verlauf des Netzes (7) | Bestätigte Vorschläge (5) |
| 3 | Aktivität je Monat (8) | Notenverteilung (4) |
| 4 | Top/Flop (6) | Du und die Community (6) |
| 5 | Lieblingshersteller (4) | Schnitte (8) |
| 6 | Meine Bewertungen (12) | |

Begründung: oben das Netz als Kern des Profils, rechts daneben die Terpene, die heute unter dem
Netz stehen und es nach unten schieben. Verlauf neben die Vorschläge, weil beide „was folgt aus
meinem Geschmack“ erzählen. Zahlenlastiges (Aktivität, Verteilung, Schnitte) in der Mitte, die
lange Liste ans Ende. Mobil gilt dieselbe Reihenfolge, links vor rechts.

`TerpenRangliste` wandert aus der Netz-Karte in eine eigene Karte. Der Fehlerfall „Netz fehlt“
(`netzFehlt`) gilt für Netz-, Terpen- und Verlaufskarte gleich.

### Aktivität je Monat (neu)
- Säulen je Monat der letzten 12 Monate (inklusive laufendem), Höhe = Zahl eigener Bewertungen.
- Server-SVG ohne Bibliothek, `components/profil/Aktivitaet.tsx`. Farbe `text-muted` als Fläche,
  der laufende Monat in `text` (Regel 4: Datengrafik nicht in `accent`).
- Monatskürzel an der x-Achse (`Intl` de/en), Wert über der Säule nur, wenn > 0.
- Barrierefrei: SVG `aria-hidden`, daneben eine `sr-only`-Tabelle Monat/Anzahl.
- Ohne Bewertungen in 12 Monaten: Satz statt Grafik.

### Notenverteilung (neu)
- Waagerechte Balken je Notenstufe des Schemas (`w.schema.noten`, ganze Noten, gerundet aus
  `noteOderErsatz`), Länge = Anzahl, Zahl am Balkenende.
- Gleiche Farbregeln und `sr-only`-Liste wie oben. `components/profil/NotenVerteilung.tsx`.

### Meine Bewertungen (neu)
- Alle eigenen Bewertungen aus `ladeAuswertungsZeilen` (lädt schon bis 1000 Zeilen).
- Ab `md` eine Tabelle: Sorte (Link auf die Blütenseite), Datum, eigene Note, Community-Mittel
  (mit Anzahl), Abstand. Unter `md` je Bewertung ein Block mit denselben Angaben.
- Sortieren über Links im Tabellenkopf (`?sortierung=datum|note|abstand`, Richtung fest: Datum neu
  zuerst, Note hoch zuerst, Abstand größter Betrag zuerst). Kein JavaScript nötig; aktive Spalte mit
  `aria-sort`. Ungültiger Wert fällt auf `datum`.
- Erst 20 Zeilen, darunter Link „Alle n zeigen“ (`?alle=1`), weil 1000 Zeilen den Worker und das
  Lesen sprengen würden. Mit `alle=1` höchstens alle geladenen (1000).
- Sortierung und Kürzung als reine Funktion in `lib/profil-dashboard.ts`, getestet.

### Bestehende Karten
Inhalt unverändert. Wo eine Karte breiter wird als vorher (Netz 7 Spalten ≈ 730 px), wächst das Netz
nicht mit: `ProfilNetz` behält seine Höchstbreite und steht zentriert.

## 5. Reiter Konto

### Raster ab lg (Entscheidung Claude)
Zwei Spalten, 8 links (Geschehen) und 4 rechts (Einstellungen), jede Spalte stapelt für sich:

- **Links:** Umfrage jetzt, Meine Stimmen, Benachrichtigungen, Meine Blüten-Vorschläge,
  Verwaltung (nur Admin).
- **Rechts:** Status (Freigabe, Rolle), Öffentliches Profil, Avatar, Angaben (Name, Instagram).

Mobil: links vor rechts, also zuerst Umfrage und Stimmen, Einstellungen am Ende.

### Umfrage jetzt (neu)
- Läuft eine Runde (`aktiveUmfrage()`): Titel, Phase in Klartext, bei `VORSCHLAG` das Datum
  `vorschlagBisAm`, bei `ABSTIMMUNG` die eigene Stimme (Handelsname, gedruckt) oder der Satz
  „Du hast noch nicht abgestimmt“ und ein Link zur Runde. Nicht freigegeben: Hinweis, dass Stimmen
  erst nach der Freigabe zählen (Text gibt es in `w.mitglied` schon sinngemäß, wird wiederverwendet).
- Läuft keine: ein Satz und Link auf `/umfragen`.
- Handschrift erlaubt (Regel 1, Community spricht): Überschrift der Karte darf `font-hand
  text-vermerk` tragen. **Entscheidung Claude: nein**, das Dashboard bleibt gedruckt, Handschrift
  bleibt der Startseite und `/umfragen` vorbehalten.

### Meine Stimmen (neu)
- Je Runde, in der das Mitglied gestimmt hat, neueste zuerst, höchstens 20: Rundentitel, Datum der
  Stimme, gewählte Sorte (Link), Ausgang als Badge mit Klartext: „läuft“, „gewonnen“, „nicht
  gewonnen“. Bei gewonnen und vorhandener Bewertung (`ergebnisReviewId`) ein Link „zur Bewertung“
  auf die Blütenseite der Sorte.
- Damit sieht das Mitglied die Schleife: meine Stimme → Gewinner → Bewertung des Betreibers.

### Datenzugriff (neu) `lib/query/konto.ts`
Eine `findMany` auf `stimme` mit `select` über `option.strain`, `option.istGewinner`,
`option.ergebnisReviewId`, `umfrage.titel/phase` (`take: 20`, `orderBy abgegebenAm desc`) und eine
`count` für die Gesamtzahl der Stimmen samt Gewinner (`groupBy` geht auf der Relation nicht, daher
`$queryRaw` mit `COUNT(*)` und `SUM(o.ist_gewinner)`). Dazu `aktiveUmfrage()` (vorhanden, gecacht)
und `eigeneStimme()` (vorhanden). Mitglied seit kommt aus `mitglied.erstelltAm`: `aktuellesMitglied()` liest den Satz mit allen
Skalaren schon, das Feld kommt nur in `AngemeldetesMitglied` dazu (keine weitere Abfrage). Alle Teile mit Fehlerfang wie auf
`/profil` (`oderNull`), ein Fehler reißt die Seite nicht mit.

## 6. Profil-Reste

### K1 (Review Stufe 1): Profil-Upsert in die D1-Batch
`profilFortschreiben` schreibt heute erst die Vorschläge per `DB.batch`, dann das Profil per Prisma.
Scheitert das zweite, passen Vorschläge und Profil nicht zusammen. Neu: das Upsert läuft als
`INSERT … ON CONFLICT(mitglied_id) DO UPDATE` in derselben Batch. `berechnet_am` wird gebunden wie
der D1-Adapter schreibt (`toISOString().replace("Z", "+00:00")`). Die SQL-Erzeugung als reine
Funktion neben `empfehlungenErsetzen` (`profilErsetzen`), getestet.

### M2 (Review Stufe 3): CPU der Verlaufsrechnung
`profilVerlauf` rechnet `geschmackAusVektor` für jeden Schritt, behält aber nur die letzten 60.
Neu: Summen weiter für alle, das Netz aber nur für die letzten 60 Schritte. Der teure Teil
(`geschmacksBeitraege`) bleibt linear; mehr bringt erst ein Zwischenspeicher, der hier nicht lohnt.
Bestehender Leistungstest bleibt, Ergebnis muss gleich bleiben (Test vergleicht alt und neu).

M10 („Kleinkram Verlauf“) ist nirgends aufgeschrieben und wird **nicht** geraten.

## 7. Texte
Neue Schlüssel in `lib/i18n/de.ts` und `en.ts` unter `profil` (Kennzahlen, Aktivität, Verteilung,
Bewertungsliste, Sortierung) und `mitglied` (Kennzahlen, Umfrage jetzt, Meine Stimmen, Ausgänge).
Du-Form, ohne Geviert- und Gedankenstrich, keine Wirkungsversprechen (HWG). Die Wirkungsnote steht
wie bisher nur in „Schnitte“.

## 8. Fehler und Leerzustände
- Jeder Bereich hat einen Leerzustand mit einem Satz und, wo sinnvoll, dem nächsten Schritt
  (erste Bewertung, zur Umfrage, Blüte vorschlagen).
- Gescheiterte Abfrage: Satz `texte.fehler` in der Karte, Rest der Seite steht.
- Neues Mitglied ohne alles: Kennzahlen zeigen 0, Diagramme zeigen ihren Leersatz, keine leeren
  Achsen.

## 9. Tests
- `lib/profil-dashboard.ts`: Monatsreihe (Monatsgrenzen, Zeitzone UTC, laufender Monat), Verteilung
  (Rundung, Stufen ohne Bewertung als 0), Kennzahlen (ohne Community-Werte entfällt Abstand),
  Sortierung und Kürzung, ungültige `sortierung`.
- `lib/empfehlung.ts` bzw. `lib/profil.ts`: `profilErsetzen` liefert ein Upsert mit allen Spalten.
- `lib/profil-verlauf.ts`: gleiches Ergebnis wie vorher für 1, 60, 61 und 1000 Bewertungen.
- Konto-Zuordnung (Stimme zu Ausgang „läuft/gewonnen/nicht gewonnen“) als reine Funktion.
- tsc, eslint, `npm run farben`, Vitest; danach live per Browser-MCP: 1440 und 390 px, hell und
  dunkel, beide Reiter, als Betreiber und (wenn möglich) als Mitglied ohne Bewertungen.

## 10. Nicht im Umfang
- Keine neue Tabelle, keine Migration, keine Client-Komponente für Sortierung oder Filter.
- Öffentliches Profil `/profil/<kurz-id>` bleibt wie es ist.
- Kein Diagramm-Paket.
