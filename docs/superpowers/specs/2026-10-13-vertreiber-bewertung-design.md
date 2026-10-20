# Vertreiber, Blüte und Charge trennen

**Datum:** 2026-10-13 (Session 56)
**Status:** Entwurf, Grundsatzentscheidungen vom Nutzer bestätigt
**Teilprojekt A** von zwei (B: `2026-10-13-profil-desktop-design.md`), parallel umsetzbar.

## Ziel

Der Nutzer (2026-10-13): Eine Blüte kommt von verschiedenen Vertreibern. Der Hersteller baut an
(z. B. in Kanada), der Vertreiber bringt sie in Deutschland in den Verkehr (z. B. Remexian bei
Citrus Sprizz). Die Overall-Bewertung hängt an den Terpenen und beschreibt die Blüte, egal woher
sie kommt. Die Chargenbewertung (Qualität, Restfeuchte, Frische) zählt für den Vertreiber, weil er
für Lagerung und Frische der Ware verantwortlich ist. Beim Bewerten wählt man die Blüte und dann
den Vertreiber, von dem die Ware stammt.

## Befund (Live-Datenbank 2026-10-13)

- `strains` ist der BfArM-Handelsname, also schon die Ware **eines** Vertreibers
  (z. B. „avaay 22/1 BCP“, „Enua 22/1 BCP CA“). 710 aktive Handelsnamen, 402 verschiedene
  `kultivar_name`, 25 ohne Kultivarnamen.
- `strains.hersteller_id` enthält meist den deutschen Vertreiber (Cannamedical, Demecan, avaay).
  `importeur_id` ist nur bei 64 gesetzt. 5 Unternehmen haben die Rolle `IMPORTEUR`.
- 27 Bewertungen, 2 Chargen.

## Entscheidungen (Nutzer, 2026-10-13)

1. **Blüte = Kultivar über alle Vertreiber.** Neue Ebene `Kultivar`. Jeder Handelsname hängt an
   genau einem Kultivar.
2. **Umdeuten:** der heutige Eintrag in `hersteller_id` wird zum Vertreiber. Der echte Hersteller
   (Anbauer) ist ein neues, optionales Feld und wird nach und nach gepflegt.
3. **Bewertet wird die Ware eines Vertreibers** (ein Handelsname, optional mit Charge). Overall,
   Terpene und Geschmack fließen in den Schnitt des Kultivars. Qualität, Restfeuchte und Frische
   fließen in den Schnitt des Vertreibers. Dieselbe Blüte darf man von mehreren Vertreibern bewerten
   (die Regel „eine Bewertung je Mitglied und Handelsname“ bleibt).

## Datenmodell

Migration `0021_vertreiber_kultivar.sql`, vorwärts gerichtet, ohne Datenverlust:

- **Neue Tabelle `kultivare`**: `id`, `name` (unique, `COLLATE NOCASE`, getrimmt), `erstellt_am`. Kein Slug:
  es gibt keine eigene Kultivar-Seite (siehe „Nicht in diesem Teilprojekt“).
- **`strains.kultivar_id`** (nullable in der Migration, danach im Code als gesetzt behandelt):
  Rückfüllung je `lower(trim(kultivar_name))`. Handelsnamen ohne Kultivarnamen bekommen einen eigenen
  Kultivar mit ihrem Handelsnamen. Index auf `kultivar_id`.
- **`strains.vertreiber_id`**: neue Spalte, Fremdschlüssel auf `unternehmen`.
  Rückfüllung: `coalesce(importeur_id, hersteller_id)`.
- **`strains.hersteller_id`** bleibt die Spalte für den echten Hersteller. Rückfüllung: nur behalten,
  wenn `importeur_id` gesetzt war und sich von `hersteller_id` unterscheidet, sonst `NULL`.
- **`strains.importeur_id`** wird nach der Rückfüllung geleert und nicht mehr gelesen. Die Spalte bleibt
  stehen: sie steckt im Fremdschlüssel der Tabellendefinition, SQLite kann sie nicht per `DROP COLUMN`
  entfernen. Im Prisma-Schema als veraltet kommentiert.
- **`unternehmen.rolle`** bleibt als Hinweis, steuert aber nichts mehr. Ein Unternehmen kann Hersteller
  und Vertreiber zugleich sein. `@@unique([name, rolle])` bleibt bestehen, damit die Migration keine
  Zusammenführung braucht.
- **Beschaffenheit** bekommt die Achse `frische` (0 bis 5, mehr ist besser, Hinweis „Wie frisch die
  Ware wirkt: alt und heuig oder frisch verpackt“). JSON-Feld, keine Migration.
- **Kennwerte:** `SortenKennwerte` (Mediane je Handelsname) bleibt. Neu ist `kultivar_kennwerte` mit
  denselben Medianen für Terpene und Geschmack, über alle Handelsnamen des Kultivars. Neu ist
  `vertreiber_kennwerte` mit Qualitäts-Schnitt (0 bis 5), Mittel je Beschaffenheitsachse, Median der Restfeuchte
  und Anzahl der Bewertungen. Dieselben drei Werte bekommt `sorten_kennwerte` je Handelsname
  (Spalten `qualitaet_mittel`, `restfeuchte_median`, `qualitaet_anzahl`). Qualitäts-Schnitt: je Achse
  `qualitaetsScore` (Sweet Spot in der Mitte), für Frische `wert / 5` (mehr ist besser), gemittelt
  und mal 5. Beide werden beim Speichern und Freigeben einer Bewertung fortgeschrieben, wie heute
  `SortenKennwerte` (Rechnung in Schreibschicht, kein Cron).

Einspielen: Claude selbst mit `npx wrangler d1 execute cn-medcan-db --remote --file` (Memory
`d1-remote-nur-nutzer`). Vor dem Einspielen eine Zählabfrage, danach dieselbe zum Vergleich.

## Bewerten

Die Bewertung findet weiter auf der Blütenseite eines Handelsnamens statt (`/blueten/[slug]`).

- **Vertreiber-Wahl oben in der Bewertungsmaske:** „Deine Ware ist von …“ als Auswahl aller
  Handelsnamen desselben Kultivars, je mit Vertreibername und Handelsname. Die Wahl führt auf die
  Blütenseite dieses Handelsnamens (Link, kein Formularwechsel, damit Charge und Kennwerte stimmen).
  Gibt es nur einen, steht der Vertreiber als Text.
- **„Vertreiber fehlt?“** führt auf `/vorschlagen?kultivar=<kultivarId>`. Der Sortenvorschlag bekommt das
  Feld Kultivar (vorbelegt) und die Felder Vertreiber und Hersteller (Hersteller optional). Die
  Freigabe im Admin legt den Handelsnamen unter diesem Kultivar an.
- **Schritte der Maske** bekommen sichtbare Zuordnung:
  - Overall und Terpz: Vermerk „zählt für die Blüte <Kultivar>“.
  - Diese Charge: Vermerk „zählt für den Vertreiber <Name>“. Neue Achse Frische neben den vier
    Beschaffenheitsachsen und der Restfeuchte. Der Satz `chargeSatz` wird ergänzt: „Qualität,
    Restfeuchte und Frische gehören zur Charge und zum Vertreiber, nicht zur Blüte.“
- Das Charge-Fazit vergleicht mit dem Vertreiber-Schnitt statt nur mit der eigenen Charge.

## Anzeige

- **Blütenseite:** Das Titelblatt behält den Handelsnamen als Titel und den Kultivar darunter. Neu ist
  die Zeile „von <Vertreiber>“, der Hersteller nur, wenn bekannt („angebaut von <Hersteller>“). In den
  Angaben heißen die Zeilen Vertreiber und Hersteller (statt Hersteller und Importeur). Neuer Abschnitt **„Diese Blüte bei anderen Vertreibern“**:
  je Handelsname des Kultivars eine Zeile mit Vertreiber, Qualitäts-Schnitt (Blätter), Restfeuchte
  (Median) und Zahl der Bewertungen, sortiert nach Zahl der Bewertungen. Neutral, kein Kauf- oder
  Apothekenlink (HWG).
- **Community-Werte auf der Blütenseite:** Aroma und Terpene aus `kultivar_kennwerte`, Qualität aus
  `vertreiber_kennwerte` des angezeigten Handelsnamens.
- **Katalog:** bleibt je Handelsname (eine Karte je Ware). Filter „Hersteller“ wird zu „Vertreiber“,
  URL-Parameter `vertreiber`. Alte Links mit `hersteller=` werden weiter gelesen und filtern nach Vertreiber (gleiche Ids).
  Karte zeigt den Vertreiber.
- **Profil:** „Deine Hersteller“ wird „Deine Vertreiber“: Qualitäts-Schnitt deiner Chargen je
  Vertreiber statt Gesamtnote, verlinkt auf den gefilterten Katalog. Teilprojekt B setzt das Feld in
  die neue Anordnung, Teilprojekt A liefert Daten und Texte.
- **Startseite** (Memory `startseite-mitziehen`): Review-Karten und das Kapitel nennen Blüte und
  Vertreiber („Black Cherry Punch · avaay“).
- **Admin:** Freigabe und Bearbeitung einer Blüte mit Feldern Kultivar, Vertreiber, Hersteller.

## HWG

Vertreiber sind Unternehmen, deren Arzneimittel wir bewerten. Wir zeigen Erfahrungen von
Mitgliedern, keine Werbung: keine Bestenliste der Vertreiber auf öffentlichen Seiten, kein Logo, kein
Kauflink, keine wertenden Superlative im Seitentext. Der Vergleich steht nur bei der jeweiligen Blüte
und im privaten Profil. Wirkung bleibt privat.

## Fehler und Grenzfälle

- Handelsname ohne Vertreiber: Zeile „Vertreiber unbekannt“, keine Vertreiber-Kennwerte.
- Kultivar mit nur einem Handelsnamen: Abschnitt „bei anderen Vertreibern“ entfällt.
- Alte Bewertungen ohne `frische`: Achse fehlt im Mittel, kein Ersatzwert.
- Kennwerte-Abfrage scheitert: Seite zeigt eigene Werte und einen Satz, wie heute.

## Tests

- Migration: SQL-Test gegen eine lokale SQLite-Kopie mit Fixtures (Rückfüllung Kultivar, Vertreiber
  aus Importeur bzw. Hersteller, Hersteller nur bei abweichendem Importeur).
- Reine Funktionen: Kultivar-Schlüssel, Vertreiber-Kennwerte (Mittel, Median, Anzahl),
  Zuordnung der Bewertungsteile zu Kultivar und Vertreiber.
- Komponenten: Vertreiber-Wahl, Abschnitt „bei anderen Vertreibern“, Filter und Umleitung `hersteller`.
- Live per Browser-MCP nach dem Push (Memory `live-statt-dev`).

## Nicht in diesem Teilprojekt

- Katalog nach Kultivar gruppieren (eine Karte je Blüte).
- Eigene Seite je Kultivar oder je Vertreiber.
- Likes und Folgen (eigener großer Punkt).
