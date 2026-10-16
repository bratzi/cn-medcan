# Admin-Dashboard — Design

Stand: 2026-10-16. Nutzerentscheidungen: Publora-Daten per Routine täglich nach D1, Aufbau Übersicht plus
Unterseiten, Benachrichtigungen als offene Aufgaben mit Zähler (keine Mail, kein Push).

## Ziel

Der Betreiber erreicht die Verwaltung direkt aus dem Profil und sieht auf einen Blick, was zu tun ist und was auf
Instagram als Nächstes erscheint. Heute ist `/admin` eine lange Seite mit acht Abschnitten (620 Zeilen in
`app/[lang]/admin/page.tsx`); der einzige Einstieg ist eine Karte am Ende des Profils.

Erfolg: Ein Aufruf von `/admin` zeigt offene Aufgaben mit Zahl, den Kalender der nächsten Posts und führt mit einem
Klick in jeden Bereich. Keine neue Verwaltungsfunktion, nur Ordnung und Überblick.

## Nicht im Umfang

- Mail- oder Push-Benachrichtigung (Block C).
- Posts aus dem Dashboard heraus planen, ändern oder löschen. Der Kalender zeigt nur.
- Live-Abruf der Publora-API aus dem Worker. Kein Publora-Schlüssel im Worker.

## Aufbau

### Übersicht `/admin`

- Kopf: Titel „Verwaltung“, Stand der Publora-Daten („Stand: 16.10., 06:00“).
- **Aufgaben**: Kacheln je Bereich mit offener Zahl, Kachel ist Link auf die Unterseite. Null-Kacheln stehen gedämpft
  hinten, Kacheln mit Zahl vorn (nach Zahl absteigend). Bereiche und Zählregel:
  - Bewertungen: nicht freigegebene Reviews.
  - Mitglieder: nicht freigegebene Mitglieder.
  - Gemeldet: offene Meldungen (Kommentare/Inhalte, wie heute im Abschnitt „Gemeldet“).
  - Budpics: offene Budpics.
  - Vorschläge: offene Strain-Vorschläge.
  - Jury: Beiträge mit Status `EINGEREICHT`.
  - Instagram: Posts mit Publora-Status `failed` in den letzten 14 Tagen.
  - Abstimmung und Kennwerte: ohne Zahl, nur Link (Werkzeuge, keine Aufgaben).
- **Kalender**: die nächsten 14 Tage als Liste nach Tag gruppiert (kein Monatsraster: auf 390 px lesbar). Je Post Uhrzeit
  (Europe/Berlin), Art (Karussell, Reel, Story), Titel aus der ersten Caption-Zeile, Status-Badge (geplant, Entwurf ohne
  Termin separat, veröffentlicht, fehlgeschlagen). Darunter „Entwürfe ohne Termin“ mit Zahl und Liste (höchstens 10).
  Darunter die letzten 7 Tage veröffentlicht, eingeklappt (`<details>`).
- Fehlen Publora-Daten oder sind sie älter als 48 h: Hinweis „Kalender veraltet, Routine prüfen“ statt Liste.

### Unterseiten

Jeder heutige Abschnitt wird eine eigene Seite unter `/admin/<bereich>`: `bewertungen`, `mitglieder`, `gemeldet`,
`budpics`, `abstimmung`, `kennwerte`. `vorschlaege` und `jury` gibt es schon. Der Inhalt wandert unverändert aus
`page.tsx` in je eine Datei; Server-Aktionen bleiben, wo sie sind. Jede Unterseite hat oben eine Leiste „Verwaltung“
mit allen Bereichen und ihren Zählern (aktueller Bereich markiert, `aria-current="page"`), auf 390 px horizontal
scrollbar innerhalb der Leiste, nie die Seite.

Revalidierung: Aktionen, die heute `/admin` revalidieren, revalidieren zusätzlich ihre Unterseite. Alle Admin-Seiten
bleiben dynamisch (Sitzung) und hinter `adminErforderlich`.

### Einstieg im Profil

Die Karte „Verwaltung“ rückt im Profil nach oben (erste Karte nach dem Kopf) und zeigt die Summe offener Aufgaben
(„7 offen“) als Badge am Knopf. Dazu ein Knopf „Verwaltung“ in den Kopf-Aktionen des Profils (`ProfilKopf`), nur für
ADMIN. Die Navigation bleibt ohne Admin-Link (sonst würde jede Seite dynamisch).

## Daten

### Zähler

`lib/query/admin-uebersicht.ts`: `ladeAdminZaehler()` liefert alle Zahlen in einem `Promise.all` aus `count`-Abfragen
(keine Listen). Wird von Übersicht, Leiste und Profilkarte genutzt; per React `cache` je Anfrage einmal.

### Publora-Spiegel

Migration `0027_publora_post.sql`, Tabelle `publora_post`:

| Spalte | Typ | Inhalt |
|---|---|---|
| `id` | TEXT PK | Publora-Post-Id |
| `gruppe` | TEXT | `postGroupId` |
| `plattform` | TEXT | z. B. `instagram` |
| `art` | TEXT | `karussell`, `reel`, `story`, `bild` (aus Medien und Marke abgeleitet) |
| `status` | TEXT | Publora-Status roh (`draft`, `scheduled`, `published`, `failed`) |
| `geplant_am` | TEXT NULL | ISO-Zeit |
| `titel` | TEXT | erste Caption-Zeile, höchstens 120 Zeichen |
| `abgerufen_am` | TEXT | ISO-Zeit des Laufs |

Dazu eine Zeile in einer kleinen Tabelle `sync_stand` (`schluessel` PK, `stand`) mit `publora` = Zeit des letzten
erfolgreichen Laufs.

**Weg**: Neues Skript `scripts/publora-sync.ts` holt `publoraPosts()` (vorhandener Helfer), formt die Zeilen
(`lib/publora-sync.ts`, reine Funktion, getestet) und schickt sie per `POST /api/publora-sync` (Schlüssel wie
`/api/jury-ig`, `igSchluesselOk`). Die Route prüft die Form, ersetzt den Tabelleninhalt in einer Transaktion
(löschen, einfügen, Stand setzen) und revalidiert `/admin`. Höchstens 500 Zeilen je Lauf, ältere als 30 Tage
verwirft das Skript.

Die bestehende Instagram-Routine ruft das Skript als ersten Schritt jedes Laufs auf (Mo, Mi, Fr). Für „täglich“
kommt eine eigene leichte Cloud-Routine dazu, täglich 06:00 Europe/Berlin, die nur das Skript ausführt. Fehler: Abbruch
ohne Wiederholung, Stand bleibt alt, das Dashboard zeigt „veraltet“.

## Darstellung

Regeln aus `ui-design-engine` (Buch-Optik, 8px-Raster, Tokens), Kacheln als Karten mit Zahl in `numeric`, Status als
vorhandene `Badge`-Varianten (geplant neutral, veröffentlicht success, fehlgeschlagen danger, Entwurf warning). Hell und
dunkel, 390 px ohne Querscroll, Fokusringe, Kacheln mindestens 44 px Trefferfläche.

## Fehler

- Zähler-Abfrage scheitert: Kachel zeigt „–“, Rest der Seite bleibt (je Zähler eigenes `catch`).
- Publora-Spiegel leer oder alt: Hinweis statt Kalender.
- Sync-Route: 401 ohne Schlüssel, 400 bei falscher Form, keine Teil-Ersetzung (Transaktion).

## Tests

- `lib/publora-sync.ts`: Art-Ableitung, Titelkürzung, 30-Tage-Grenze, Formprüfung.
- Kalender-Gruppierung nach Tag in Europe/Berlin (Sommerzeit-Wechsel 25.10.2026).
- Aufgaben-Sortierung der Kacheln.
- Quelltext-Tests wie bisher: jede Unterseite ruft `adminErforderlich`, Route prüft Schlüssel.
- Live: `/admin` und je eine Unterseite, hell/dunkel, 390 px.
