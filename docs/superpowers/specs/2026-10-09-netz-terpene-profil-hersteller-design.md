# Aroma-Netz mit Terpen-Schalter, Profil neu geordnet, Hersteller-Filter

**Datum:** 2026-10-09 (Session 55)
**Status:** vom Nutzer im Chat freigegeben, Spec zur Durchsicht

## Ziel

Das Profil soll mehr Wert zeigen und sich lesen wie die Startseite. Dafür gibt es drei Änderungen:

1. Das Aroma-Netz bekommt einen Schalter „Geschmäcker | Terpene“. Das bisherige Feld „Terpene“, eine einfache
   Balkenliste, entfällt. Der Nutzer fand es „viel zu simpel, kaum Mehrwert“.
2. Die Lesung beim Überfahren einer Marke steht außen neben der Marke, nicht mehr in der Mitte des Netzes.
3. Das Profil wird neu geordnet. Dazu kommt ein Hersteller-Filter im Katalog und eine Rangliste der Hersteller
   im Profil. Heute sieht der Nutzer keinen Lieblingshersteller und kann im Katalog keinen Hersteller wählen.

Beides gilt für jedes Aroma-Netz der Seite: eigenes Profil, öffentliches Profil (`/profil/[kurzId]`), „Dein
Kapitel“ auf der Startseite. Nur Aroma, nie Wirkung (HWG).

## Entscheidungen des Nutzers

- Terpen-Achsen sind **zehn feste Hauptterpene**, für jedes Mitglied gleich. So bleiben Netze vergleichbar, und
  der Verlauf funktioniert.
- Hersteller: **Filter im Katalog und Rangliste im Profil**. Mitglieder markieren keine eigenen Lieblinge.
- „Du und die Community“ bleibt im Profil, neben den Schnitten.
- Nicht Teil dieser Spec, sondern eigene spätere Durchgänge (HANDOFF): Hersteller und Vertreiber getrennt
  bewerten; Likes und Folgen.

## A. Aroma-Netz: Terpen-Modus und Lesung außen

### Achsen

Die zehn Terpene in `lib/terpen-aromen.ts` mit eigener Aroma-Beschreibung, in dieser Reihenfolge:
Myrcen, Limonen, β-Caryophyllen, Linalool, α-Pinen, Terpinolen, Humulen, Ocimen, Farnesen, Nerolidol.
Neue Konstante `TERPEN_ACHSEN` (Name wie im Katalog, Schlüssel wie in `terpen-aromen`). Die Begleitstoffe
Ester und Thiole sind keine Terpene und bleiben draußen.

- Marke: `TerpenIcon`. Die Farbe ist die des stärksten Aromas des Terpens (`aromaAnteile`, dann `vollFarbe`).
- Blüte: `bluetenKreis` über die Hauptaromen der zehn Terpene, damit die Fläche die Aromafarben zeigt.
- Name in der Lesung und für Screenreader: `terpenAnzeige(name, sprache)`.

### Daten

- `profilAnzeige` liefert neu `terpenNetz: Record<TerpenSchluessel, number>`. Jede Achse liegt zwischen −1 und 1
  und ist auf das stärkste |Gewicht| unter den zehn normiert, genau wie `geschmack`. Quelle sind die
  vorhandenen `t:`-Einträge des Profilvektors.
- Gespeichert wird `terpenNetz` im vorhandenen JSON der Spalte `nutzer_profil.terpene`, als Objekt
  `{ liste, netz }`. Es gibt keine Schema-Migration. `profilAusDaten` liest beide Formen. Bei der alten Form
  (nur Liste) entsteht `netz` aus der Liste: fehlende Achsen sind 0, die Normierung wird neu gerechnet. Nach
  höchstens 24 h rechnet sich jede Zeile ohnehin neu.
- Verlauf: Jeder `VerlaufSchritt` bekommt das optionale Feld `terpene` (gleiche Form wie `terpenNetz`).
  `profilVerlauf` rechnet es mit denselben Präfixsummen. `verlaufAusDaten` lässt das Feld bei alten Schritten
  leer.
- `liste` (die Rangliste) wird nur noch für Empfehlungstexte gebraucht. Ob sie überhaupt noch gelesen wird,
  prüft der Plan. Wird sie nicht gelesen, entfällt sie.
- `KapitelDaten.netz` und die öffentliche Profilseite reichen `terpenNetz` durch.

### Schalter

- Ein Segmentschalter „Geschmäcker | Terpene“ über dem Netz, gebaut wie der Schalter „Karte | Netz“ in
  `AromaKarte` (Radiogroup nach APG, Pfeiltasten über `naechsteAnsicht`).
- Der Wechsel morpht die Werte über denselben rAF-Weg wie der Verlauf. Die Marken blenden über.
- Reduzierte Bewegung: Sprung ohne Morph.
- Die Zeitleiste gilt für beide Modi. Fehlen im Verlauf die Terpene (alte Schritte), zeigt der Terpen-Modus
  nur den heutigen Stand, ohne Zeitleiste.
- Legende, Skalensatz und Änderungssatz („seit der letzten Bewertung …“) nennen die Achsen des aktiven Modus.
- Hat ein Profil keine Terpenwerte, ist der Schalter nicht da.

### Lesung außen

- Die Lesung (Icon, Name, Wert) erscheint außen an der aktiven Marke. Ihre Lage hängt vom Winkel der Achse ab:
  rechte Hälfte nach rechts, linke Hälfte nach links, oben und unten mittig über bzw. unter der Marke.
  Rechnung als reine Funktion `lesungsLage(index, anzahl)` mit Test.
- Sie darf über Nachbarelemente ragen: absolut, `z-index` über dem Feld, das Netz schneidet nicht ab
  (`overflow: visible` am Netzrahmen). Auf schmalen Schirmen bleibt sie im Viewport: die Lage wird an den
  Rändern gespiegelt oder geklemmt.
- Gestaltung wie heute (Rand in der Achsfarbe, `bg-surface-raised/90`), aber als Etikett statt Kreis.
- Die Bedienung bleibt: Überfahren, Fokus, Antippen.

### Entfällt

- Feld „Terpene“ im Profil und `components/profil/TerpenRangliste.tsx`. Ebenso die Texte `terpeneTitel` und
  `terpeneEherNicht`, falls sie sonst nirgends genutzt werden.

## B. Profil neu ordnen

Neue Reihenfolge in `app/[lang]/profil/page.tsx`:

| Reihe | Inhalt | Breite (von 10) |
|---|---|---|
| 1 | Kopf, Randnotizen | wie heute |
| 2 | Aktivität (Zeitstrahl) | 10 |
| 3 | Aroma-Netz mit Schalter | 10 |
| 4 | Top und Flop | 10 |
| 5 | Notenverteilung · Hersteller-Rangliste | 5 · 5 |
| 6 | Schnitte · Du und die Community | 5 · 5 |
| 7 | Deine Bewertungen (Register) | 10 |
| 8 | Ähnlich im Aroma (Vorschläge) | 10 |

- `FeldSpalten` bekommt die Breite 5.
- Je Reihe ein eigenes `Suspense` mit passendem Skelett, wie heute. Die Abfragen bleiben bei einer je Quelle
  (`cache`).
- Ohne Bewertung: Aktivität mit Leersatz, Netz-Leerskizze, die Auswertungsfelder entfallen wie heute.

### Startseiten-Niveau

- Feldköpfe wie die Sektionsköpfe der Startseite: Buchschrift, ein Wort betont in Handschrift
  (`hand-betont`, `farbverlauf`), darüber ein `Schlagwort` in Handschrift. Neue Komponente `FeldKopf`, die
  `Feld` statt der heutigen `h2` nutzt. Texte bekommen dafür die Teile `vor`, `betont`, `schlagwort` wie
  `start.kapitel`.
- Mehr Handschrift: Zahlwörter (wie die Randnotizen der Startseite), Vermerke unter Netz und Top/Flop.
- Abstände im 8-px-Raster, Regeln aus `ui-design-engine` (Abschnitt Typografie, Badges, Motion).
- Die Startseite bleibt unverändert. Eine Ausnahme ist „Dein Kapitel“, das den Netzschalter mitbekommt
  (Memory `startseite-mitziehen`).

## C. Hersteller

### Katalog-Filter

- `StrainFilter` bekommt `hersteller: string[]`, als Slug-Liste wie `apotheke`. URL-Parameter `hersteller`,
  kommagetrennt.
- Abfrage: `strain.hersteller.name` in der Auswahl. Slug aus dem Namen über die vorhandene Slug-Funktion, oder
  über eine neue Spalte, falls Namen nicht eindeutig sluggen. Der Plan prüft die Daten.
- UI: Abschnitt „Hersteller“ im Filterpanel, Mehrfachauswahl mit Suche (die Liste ist lang). Zu jedem
  Hersteller die Zahl der Sorten. Chip in `AktiveFilter`.
- Keine Werbung: Hersteller nur als Name, kein Logo, kein Link nach außen (HWG).

### Profil-Rangliste

- `lieblingshersteller` wird zu `herstellerRangliste`: alle Hersteller mit mindestens einer eigenen Bewertung,
  sortiert nach Mittel (gleiches Mittel: mehr Bewertungen zuerst), höchstens 5. Jede Zeile zeigt Name, Mittel
  als Blätter (`BlattAnzeige`) und Anzahl.
- Der Name verlinkt auf `/blueten?hersteller=<slug>`.
- Fehlerfall und Leerfall wie heute (`herstellerFehler`, `herstellerLeer`).

## Tests

- Reine Funktionen: `terpenNetz` (Normierung, Vorzeichen, leere Achsen), Lesen alter und neuer
  `terpene`-JSON, `profilVerlauf` mit Terpenen, `lesungsLage`, `herstellerRangliste`, Filter parsen und
  serialisieren mit `hersteller`.
- Komponenten per `renderToStaticMarkup`: Schalter vorhanden nur mit Terpenwerten, Reihenfolge der Profilfelder,
  kein Feld „Terpene“ mehr, Hersteller-Links.
- Regel-Test: Feldköpfe nutzen `FeldKopf`.

## Umsetzung

Drei Stränge nach Memory `plaene-parallel-schneiden`:

- **A** Netz (Daten, Schalter, Lesung) und **C** Hersteller (Filter, Rangliste) sind unabhängig: parallel, je
  ein Worktree.
- **B** Profil-Reihenfolge und Feldköpfe baut auf A auf (Feld „Terpene“ fällt weg) und kommt nach dem Merge
  von A.
- Nach jedem Strang pushen. Live-Prüfung gesammelt am Ende: Profil hell, dunkel, 494 px und Desktop;
  öffentliches Profil; „Dein Kapitel“; Katalogfilter.
