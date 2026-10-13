# Vertreiber sichtbar machen

**Datum:** 2026-10-13 (Session 58)
**Status:** Entwurf, Grundsatzentscheidungen vom Nutzer bestätigt
**Vorgänger:** `2026-10-13-vertreiber-bewertung-design.md` (Kultivar, Vertreiber, Kennwerte, live seit `c54ee90`)

## Ziel

Großer Punkt des Nutzers (2026-10-09): Die Seite soll lehren, dass dieselbe Blüte von verschiedenen
Vertreibern kommt und dass der Vertreiber die Qualität der Ware prägt. Seit Session 56 trennt das
Datenmodell Blüte (Kultivar) und Ware (Handelsname eines Vertreibers), und die Chargenqualität zählt für
den Vertreiber. Sichtbar ist das bisher nur auf der Blütenseite ab zwei Vertreibern und in der
Vertreiber-Wahl beim Bewerten. Dieses Teilprojekt macht es auf der Startseite deutlich und zieht es durch
Katalog, Blütenseite und Reviews.

## Entscheidungen des Nutzers (2026-10-13)

1. **Startseite:** neues Kapitel mit echtem Beispiel aus den Daten.
2. **Sichtbarkeit:** alle vier Stellen: Katalogkarte „bei N Vertreibern“, Vergleich auf der Blütenseite
   immer, Reviews nennen die Charge des Vertreibers, Katalog-Ansicht je Blüte.
3. **Keine eigene Seite je Vertreiber** (HWG, wie in der Vorgänger-Spec).

Mit **(C)** markierte Punkte hat Claude entschieden; der Nutzer kann sie beim Lesen ändern.

## Befund (Live-Datenbank 2026-10-13)

- 137 Kultivare haben mehr als einen aktiven Handelsnamen. Kein aktiver Handelsname ist ohne Kultivar.
- **Kein Kultivar hat schon zwei Vertreiber mit bewerteter Charge.** Die meisten bewerteten Kultivare
  haben genau einen bewerteten Vertreiber (z. B. MAC 1: 5 Vertreiber, 1 bewertet).
- Folge: Das Startseiten-Beispiel muss auch mit nur einem bewerteten Vertreiber tragen. Es lädt dann
  ein, die Ware eines anderen Vertreibers zu bewerten, statt zu vergleichen.

## 1. Startseiten-Kapitel „Gleiche Blüte, andere Ware“

**Ort (C):** direkt nach `TransparentMachen`. Dort erklärt die Startseite die drei Prüfpunkte (Overall,
Terpz, Beschaffenheit); das neue Kapitel sagt im Anschluss, wofür die Beschaffenheit zählt.

**Inhalt:**
- Kapitelkopf im Stil der Story (`Schlagwort`/`UeberlaufWort` wie die Nachbarn), Text (C): „Gleiche
  Blüte,“ / Überlauf „andere Ware.“
- Absatz (C): „Overall und Terpene beschreiben die Blüte, egal woher sie kommt. Qualität, Restfeuchte
  und Frische hängen am Vertreiber: wie er lagert und wie frisch seine Charge ist. Darum bewerten wir
  beides getrennt.“
- **Beispielkarte:** Name des Kultivars, darunter bis zu vier Zeilen je Vertreiber: Vertreibername,
  Handelsname klein, Qualität als Blätter (`BlattAnzeige`) mit Zahl der Bewertungen, sonst
  „noch keine Charge bewertet“. Sortiert nach Zahl der Bewertungen, dann Name; nie nach Qualität.
  Mehr als vier Vertreiber: Zeile „und {n} weitere“.
- Unter der Karte zwei Textlinks: „Zur Blüte“ (Handelsname mit den meisten Bewertungen) und
  „Alle {n} Vertreiber im Katalog“ (`/blueten?kultivar=<id>`).
- Hat nur ein Vertreiber eine bewertete Charge, steht unter der Karte (C): „Hast du sie von einem anderen
  Vertreiber? Deine Charge macht den Vergleich möglich.“ mit Link auf die Blütenseite eines noch
  unbewerteten Handelsnamens (`#bewerten`).
- Satz klein (HWG): „Erfahrungen der Mitglieder, keine Empfehlung.“

**Auswahl des Beispiels** (`lib/query/vertreiber-beispiel.ts`, `ladeVertreiberBeispiel()`):
Kandidaten sind Kultivare mit mindestens zwei aktiven Handelsnamen. Rangfolge: Zahl der Vertreiber mit
bewerteter Charge (absteigend), Summe der Qualitäts-Bewertungen (absteigend), Zahl der aktiven
Handelsnamen (absteigend), Name (aufsteigend). Umsetzung (C) mit Prisma ohne Roh-SQL: erst
`sortenKennwerte` mit `qualitaetAnzahl > 0` samt `strain.kultivarId` (wenige Zeilen), dann
`strain.groupBy` nach `kultivarId` für die Handelsnamen-Zahl der Kandidaten, dann die Zeilen des
Gewinners. Gibt es keinen bewerteten Kultivar mit zwei Handelsnamen, gewinnt der Kultivar mit den meisten
aktiven Handelsnamen; alle Zeilen zeigen dann „noch keine Charge bewertet“ und die Einladung.

**Leer und Fehler:** Kein Kultivar mit zwei Handelsnamen: Kapitel zeigt Kopf und Absatz ohne Karte.
Abfrage scheitert: ebenso, Fehler in `console.error`, `unstable_rethrow` wie in `NeuesterEintrag`.

**Statisch:** Die Startseite bleibt `force-static` mit `revalidate = 86400`. Speichern einer Bewertung
revalidiert `/` schon heute; das Beispiel zieht damit nach. Eigene Suspense-Grenze mit Skelett wie die
Nachbarn.

## 2. Katalog

### 2.1 Filter `kultivar`

- Neuer Suchparameter `kultivar` (eine Id, Muster wie in `/vorschlagen`: 32 bis 36 Zeichen hex/uuid),
  in `StrainFilter`, `parseStrainFilter`, `serialisiereFilter`, `baueWhere` (`kultivarId`).
- Chip in `AktiveFilter`: „Blüte: {name}“ (Name per Nachladen wie bei Vertreibern), entfernbar.
- Kein eigenes Feld in der Filterleiste (C): man kommt über Links hierher.

### 2.2 Karte „bei N Vertreibern“

- `ProduktCard` bekommt optional `weitereVertreiber: number` (aktive Handelsnamen desselben Kultivars
  minus eins). Ist die Zahl größer als null, steht im Fuß unter dem Vertreibernamen ein Textlink
  „auch bei {n} weiteren Vertreibern“ auf `/blueten?kultivar=<id>`.
- Ermittelt nach der Listenabfrage mit einem `strain.groupBy` über die Kultivar-Ids der Seite (höchstens
  so viele wie Treffer je Seite). Gilt auch für die Katalog-Sektion der Startseite (`story/Katalog`).
- Im Filter `kultivar` entfällt der Link (C): man sieht die anderen schon.

### 2.3 Ansicht je Blüte

- Umschalter über der Trefferliste (C): „Handelsnamen | Blüten“, Parameter `ansicht=bluete`,
  Standard ohne Parameter wie heute. Als zwei Links mit `aria-current`, kein JS.
- `ladeKultivarListe(filter, fachkreis)` in `lib/query/kultivar-liste.ts`: Kultivare, die mindestens einen
  Handelsnamen haben, der zum Filter passt (`strains: { some: baueWhere(filter) }`), nach Name sortiert,
  gleiche Seitengröße und Blätterung. Andere Sortierungen gelten in dieser Ansicht nicht; die
  Sortierwahl ist dort ausgeblendet (C).
- **Kultivarkarte** (`components/produkt/KultivarKarte.tsx`, ohne Bild (C), weil es kein Bild je
  Kultivar gibt): Name als Überschrift, Typ-Badge (häufigster Typ der Handelsnamen), THC-Spanne über
  alle Handelsnamen, Vertreibernamen als Liste (bis fünf, dann „+{n}“), Community-Overall aus
  `kultivar_kennwerte` als Blätter mit Zahl der Bewertungen (nur ab einer Bewertung), Link
  „{n} Handelsnamen ansehen“ auf `/blueten?kultivar=<id>`.
- Zählt die Trefferzahl in Blüten: „{n} Blüten“.

## 3. Blütenseite: Vergleich immer

- `VertreiberVergleich` erscheint auch mit nur einem Eintrag. Der Titel bleibt „Diese Blüte bei anderen
  Vertreibern“; statt der Liste steht dann (C) „Bisher kennen wir sie nur von {vertreiber}.“
- Neuer Erklärsatz (C), ersetzt `vergleichSatz`: „Overall und Terpene zählen für die Blüte, Qualität,
  Restfeuchte und Frische für den Vertreiber. Erfahrungen der Mitglieder, keine Empfehlung.“
- Unter der Liste immer „Vertreiber fehlt? Vorschlagen“ (`/vorschlagen?kultivar=<id>`, vorhandener
  Text `bluete.vertreiber.fehlt`) und bei mindestens zwei Einträgen „Alle im Katalog“
  (`/blueten?kultivar=<id>`).

## 4. Reviews: Charge des Vertreibers

- In `BuchDoppelseite` (große Bewertungs-Doppelseite auf `/reviews`, Startseite „Neuester Eintrag“) steht
  im Register Beschaffenheit über der Leiste eine Zeile (C): „Charge von {vertreiber}“ und klein
  „zählt für den Vertreiber“ (vorhandener Text `zaehltVertreiber` ohne Namen in neuer Form).
- Ohne bekannten Vertreiber: „Charge, Vertreiber unbekannt“.
- Die Zeile erscheint, wo `eintrag.vertreiber` gesetzt ist (`alsEintrag` mit `produkt`, also `/reviews` und
  Startseite). Auf der Blütenseite steht der Vertreiber schon im Titelblatt; dort entfällt die Zeile (C).
- Startseite zieht über dieselbe Komponente mit (Memory `startseite-mitziehen`).

## HWG

Unverändert aus der Vorgänger-Spec: keine Rangfolge der Vertreiber, kein Logo, kein Kauf- oder
Apothekenlink, keine Superlative. Sortierung überall nach Zahl der Bewertungen oder Name, nie nach
Qualität. Das Startseiten-Beispiel zeigt dieselben Daten, die die Blütenseite öffentlich zeigt, und trägt
den Satz „Erfahrungen der Mitglieder, keine Empfehlung.“ Keine Seite je Vertreiber.

## Rechenzeit (Free-Plan, 10 ms CPU)

- Startseite: Beispiel wird nur beim statischen Neubau gerechnet.
- Katalog: eine zusätzliche `groupBy` je Seite; Blüten-Ansicht ersetzt die Listenabfrage, keine
  zusätzliche Runde. Keine Schleifen über alle Kultivare im Worker.

## Tests

- Rein: Rangfolge der Beispielwahl (Funktion über fertige Zahlen, ohne DB), Filter `kultivar`
  (parse, serialisiere, ungültige Id), `weitereVertreiber` je Karte, Typ-Mehrheit und THC-Spanne der
  Kultivarkarte.
- Komponenten (Render-zu-String wie bestehende Tests): Kapitel mit 0/1/2 bewerteten Vertreibern,
  Vergleich mit einem Eintrag, Karte mit und ohne Link, Doppelseite mit und ohne Vertreiber.
- Live per Browser-MCP nach dem Push (Memory `live-statt-dev`): Startseite hell und dunkel 1440 und
  494 px, Katalog beide Ansichten, Blütenseite mit einem und mehreren Vertreibern, `/reviews`.

## Schnitt für parallele Umsetzung

Drei Stränge ohne gemeinsame Code-Dateien; sie verbinden sich nur über die URL `/blueten?kultivar=<id>`.
Gemeinsam sind `lib/i18n/de.ts` und `en.ts`: jeder Strang schreibt nur in seinen eigenen Block
(`start.vertreiber`, `katalog.*`, `bluete.vertreiber` und `buch.*`), damit der Merge textlich sauber bleibt.

1. **Startseite:** Abschnitt 1.
2. **Katalog:** Abschnitt 2.
3. **Blütenseite und Reviews:** Abschnitte 3 und 4.

## Nicht in diesem Teilprojekt

- Eigene Seite je Kultivar oder je Vertreiber.
- Bilder je Kultivar.
- Likes und Folgen (eigener großer Punkt).
