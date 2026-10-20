# Startseite neu geordnet und Strain of the Month

**Datum:** 2026-10-20 (Session 74)
**Status:** Entwurf vom Nutzer freigegeben (Session 74), Spec zur Prüfung
**Umsetzung:** zwei Pläne nacheinander, keine parallelen Agents (Netz): Plan A Startseite, Plan B SOTM.

## Ziel

Die Startseite erzählt zuerst, wie hier bewertet wird, und zeigt die Bewertung mit ihren drei Noten im
Fokus. Die Abstimmung über den nächsten Strain wird zum festen Monatsrhythmus „Strain of the Month“ (SOTM):
ohne Handschaltung durch den Betreiber, mit einem Gewinner je Monat, den alle Mitglieder und der Betreiber
bewerten.

Nutzerangaben (Session 73/74):
- „Bewertung“ heißt Overall · Terpz · Qualität. Diese drei Noten werden aus `TransparentMachen` gelöst und
  als eigene Sektion gezeigt.
- SOTM läuft automatisch nach Kalender.
- Den SOTM bewerten alle Mitglieder und der Betreiber.

Annahmen (vom Entwurf übernommen, nicht einzeln bestätigt):
- Umfragen bleiben freiwillige Events und stehen zuletzt auf der Startseite (Memory „Produktkern“).
- Die bestehende Freigabe von Mitglieder-Reviews durch den Admin bleibt unverändert.

## Teil A: Startseite

### Korrektur Nutzer (2026-10-20, nach Plan A)

„Bewertung“ ist die Aroma-Karte (`AromaSektion`: „Was das Datenblatt verspricht, prüfen wir nach.“ mit Beispielblüte,
Overall, Terpz, Qualität). Das Storytelling (`TransparentMachen`) bleibt komplett mit Overall, Terpz, Qualität.
Gültige Reihenfolge: Auftakt, Terpen-Band, Storytelling, Dein Kapitel, Bewertung (AromaSektion), Neuester Eintrag,
Terpene und ihre Geschmäcker (TerpenRegister), Katalog, Wissen, Lernen, Empfehlungen, SOTM. Die Sektion
`BewertungSchritte` und der Abschnitt „Bewertung (Sektion 5)“ unten sind verworfen.

### Reihenfolge (ursprünglicher Entwurf, überholt)

| # | Sektion | Quelle heute | Änderung |
|---|---|---|---|
| 1 | Auftakt | `Auftakt` | keine |
| 2 | Terpen-Band | `TerpenBand` | keine |
| 3 | Storytelling | `TransparentMachen` | nur noch Manifest-Text, ohne die drei Prüfpunkte |
| 4 | Dein Kapitel | `DeinKapitel` | keine |
| 5 | Bewertung | neu `BewertungSchritte` | Overall, Terpz, Qualität als Schritte 1 bis 3 mit einer Beispielblüte |
| 6 | Neuester Eintrag | `NeuesterEintrag` | keine |
| 7 | Terpene und ihre Geschmäcker | `TerpenRegister` + `AromaSektion` | keine |
| 8 | Katalog | `Katalog` + `VertreiberKapitel` | eine Sektion, eine Suche (siehe unten) |
| 9 | Wissen | `WissenBuendeln` | keine |
| 10 | Lernen | `GemeinsamLernen` | keine |
| 11 | Empfehlungen | `Empfehlungen` | keine |
| 12 | Strain of the Month | `Abstimmung` | ersetzt durch `SotmSektion` (Plan B); in Plan A bleibt `Abstimmung` am Ende |

### Bewertung (Sektion 5)

- Die drei Prüfpunkte (Video-Blobs, Ringe, Texte `overall`, `terpz`, `qualitaet`) ziehen aus
  `TransparentMachen` in die neue Komponente `components/story/BewertungSchritte.tsx`. Die Bild- und
  Bewegungssprache bleibt gleich.
- Jeder Punkt trägt eine Schrittzahl 1, 2, 3 und zeigt die Note dieser Kategorie an einer Beispielblüte.
- Beispielblüte: die zuletzt veröffentlichte Betreiber-Review (dieselbe Quelle wie `NeuesterEintrag`).
  Gibt es keine, entfällt die Note, die Schritte bleiben.
- `TransparentMachen` behält nur den Manifest-Text.

### Katalog als eine Sektion (Sektion 8)

- Eine Suche (`SortenSuche`) oben. Nach Wahl eines Strains klappt darunter die Vertreiber-Leiste
  „Gleiche Blüte, anderer Vertreiber“ auf (heute `VertreiberKapitel`/`SortenExplorer`).
- Ohne gewählten Strain zeigt die Sektion den bisherigen Katalog-Inhalt.
- Der Zustand liegt in `explorer-zustand.ts`; es gibt keine zweite Suche mehr auf der Seite.

### Technik

- Die Seite bleibt `force-static` mit `revalidate = 86400`. Neue Daten (Beispielblüte) kommen aus
  bestehenden, gecachten Abfragen. Kein zusätzlicher D1-Zugriff je Anfrage (1102-Befund, siehe Anhang).
- Texte in den Wörterbüchern de/en; Wording „Blüte/Strain“, nie „Ware“ oder „Sorte“ in neuen Texten.

## Teil B: Strain of the Month

### Kalender

Monat N stimmt über den SOTM von Monat N+1 ab.

| Zeitraum (UTC) | Phase |
|---|---|
| 1. 00:00 bis 14. 23:59 | VORSCHLAG: Mitglieder schlagen Strains vor |
| 15. 00:00 bis Monatsende | ABSTIMMUNG: Mitglieder stimmen ab |
| 1. des Folgemonats 00:00 | Abschluss: Gewinner ist SOTM dieses Monats, neue Runde beginnt |

- Der Betreiber schaltet Phasen nicht mehr. Der Phasen-Schalter in `RundeSteuerung` entfällt; Vorschläge
  übernehmen und Optionen pflegen bleibt Admin-Aufgabe.
- Ein Gewinner je Runde: `communityPlaetze` = 1.
- Gleichstand: der Strain mit dem früheren Vorschlag (`UmfrageVorschlag.erstelltAm`) gewinnt.
- Keine Stimmen: kein SOTM für diesen Monat; die Sektion sagt das.

### Daten

- Migration `0029_sotm_monat.sql`: Spalte `umfragen.monat TEXT` (Format `JJJJ-MM`, Monat des SOTM, also
  N+1), Unique-Index darauf. Bestehende Umfragen behalten `NULL`.
- `phase` und `aktiv` bleiben; der Trigger aus `db/constraints.sql` sichert weiter genau eine aktive Runde.
- Kein neues Modell für den SOTM selbst: der SOTM ist der Gewinner der beendeten Runde mit `monat` = aktueller
  Monat.

### Abschluss per Cron

- `wrangler.jsonc` bekommt `triggers.crons`: `0 0 1 * *` (Abschluss und neue Runde) und `0 0 15 * *`
  (Wechsel in ABSTIMMUNG). Cron Triggers sind im Free-Plan enthalten.
- `worker.mjs` erhält einen `scheduled`-Handler. Er arbeitet mit dem D1-Binding direkt in einem `DB.batch`,
  nicht über Prisma und nicht über den Next-Server: der Cron hat dasselbe 10-ms-CPU-Budget.
- Jeder Schritt ist idempotent: er prüft Phase und `monat` vor dem Schreiben. Ein zweiter Lauf ändert nichts.
- Fallback: verpasst der Cron einen Lauf, holt der nächste Aufruf von `/sotm` oder der Admin-Seite den
  fälligen Schritt nach (dieselbe Funktion, gleiche Idempotenz).
- Nach dem Schreiben revalidiert der Handler `/` und `/sotm` über den bestehenden Tag-Cache.

### Bewerten

- Den SOTM bewerten alle verifizierten Mitglieder und der Betreiber über den bestehenden Bewertungsweg der
  Blüte. Mitglieder-Reviews brauchen weiter die Admin-Freigabe.

### Oberfläche

- Name „Strain of the Month“, Kopfmenü „SOTM“, Route `/[lang]/sotm`. `/[lang]/umfragen` leitet mit 301 auf
  `/[lang]/sotm` um.
- Sektion auf der Startseite (`SotmSektion`, zuletzt):
  - oben groß der aktuelle SOTM: Bild, Monat, Zahl der Mitgliederbewertungen und ihr Schnitt,
    Betreiber-Review (falls vorhanden), Knopf „Jetzt bewerten“;
  - darunter die laufende Runde für den nächsten Monat: Vorschlagen oder Abstimmen je nach Phase;
  - Restzeit der Phase als Text („noch 6 Tage“), kein tickender Countdown (statische Seite, CPU).
- Personenbezogenes (eigene Stimme, eigener Vorschlag) lädt `StartSitzung` im Browser wie heute.

### Fehlerfälle

- Cron schlägt fehl: Fallback beim nächsten Aufruf, Log-Eintrag mit Runde und Schritt.
- Kein SOTM: Sektion zeigt „Diesen Monat kein Strain of the Month“ und die laufende Runde.
- Strain des SOTM inaktiv geworden: SOTM bleibt sichtbar, ohne Vertreiber-Leiste.

## Tests

- Kalender als reine Funktion (`lib/sotm/kalender.ts`): Phase und Restzeit zu einem Datum, Monatsgrenzen,
  Februar, Jahreswechsel.
- Gewinnerwahl als reine Funktion: Mehrheit, Gleichstand (früherer Vorschlag), keine Stimmen.
- Abschluss-Schritt gegen eine Test-D1: zweimal ausführen ergibt denselben Zustand.
- Startseite: Reihenfolge der Sektionen, Katalog mit nur einer Suche.
- Tests mit `npx tsx --test --test-concurrency=2`. Live-Prüfung nach Push (kein lokales `next dev`).

## Nicht Teil dieser Spec

- Apotheken und Preise (zurückgestellt).
- Instagram-Posts zum SOTM (später, über die bestehende Routine).
- Umbau der Bewertungsfreigabe.

## Anhang: Befund Fehler 1102 (Session 74)

Quelle: Cloudflare Workers Observability, Worker `cn-medcan`, 2026-10-13 bis 2026-10-20.

- 54 Anfragen mit „Worker exceeded CPU time limit“ in 7 Tagen. Betroffen: `/blueten` (10), `/reviews` (9),
  `/` (8), Strain-Seiten (15), `/datenschutz` und `/impressum` (je 3), APIs.
- Nach dem Deploy vom 2026-10-19 23:41 UTC (b67da31): keine weiteren 1102 bis 2026-10-20 09:00 UTC.
- Ursache: Seitenaufbau ohne Cache-Treffer braucht weit mehr als die 10 ms des Free-Plans (Median
  `/profil` 145 ms, `/blueten` 44 ms, `/` 56 ms; Spitzen bis 1123 ms). Cache-Treffer liegen bei etwa 10 ms.
  Cloudflare duldet Überschreitungen zeitweise und bricht dann ab.
- Daraus für diese Spec: keine neue Rechenarbeit im Anfragepfad, statische Seiten bleiben statisch, der Cron
  arbeitet ohne Prisma.
