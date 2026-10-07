# Profil und Dashboard — Design

**Datum:** 2026-10-07
**Status:** vom Nutzer freigegeben (2026-10-07, Session 44, nach Grilling in Session 43)
**Bezug:** Empfehlungen T11 (`lib/empfehlung.ts`, Migration 0014), Sortenkennwerte (`lib/kennwerte.ts`),
Netzdiagramm (`components/review/Netzdiagramm.tsx`, `lib/netz.ts`)

---

## 1. Ziel

Jedes Mitglied bekommt ein Profil mit seinen Bewertungen, den daraus abgeleiteten Vorlieben, Auswertungen
und einem eigenen Netz („Skill-Matrix“), das sich mit jeder Bewertung neu ergibt. Darauf bauen Vorschläge,
die von der Community bestätigt sind: wer Fruchtiges mag, bekommt fruchtige Sorten mit guter
Community-Wertung.

Das Profil stärkt den Kern der Seite: Bewertungen bekommen für den Bewertenden selbst einen Wert, und
jede neue Bewertung verändert sichtbar das eigene Bild.

## 2. Entscheidungen des Nutzers (bindend, nicht neu fragen)

1. **Sichtbarkeit:** privat und öffentlich. Öffentlich: Name, Avatar, Zahl der Bewertungen,
   Bewertungsliste, Vorlieben-Netz. Privat bleiben Vorschläge und Auswertungen. Das öffentliche Profil
   ist anfangs aus (Opt-in, Art. 9 DSGVO); der Schalter steht in `/mitglied`.
2. **Netz:** die 10 Geschmacksachsen als Netz, die Terpene als Rangliste mit Balken darunter.
3. **Rechnung:** wie das bestehende Empfehlungsprofil. Aroma der Sorte aus Herstellerterpenen,
   Community-Geschmack und eigenen Reglern, gewichtet mit der eigenen Gesamtnote (ab 3,5 positiv,
   bis 2 negativ). Das Netz zeigt „mag ich“ als Fläche und „mag ich nicht“ gestrichelt. Die
   Geschmacksregler sind Sweet-Spot-Werte und bedeuten allein kein „mag ich“.
4. **Bestätigt:** eine Sorte hat mindestens 2 freigegebene Bewertungen (Community oder Betreiber) mit
   Median der Gesamtnote ab 3,5. Rang = Aroma-Ähnlichkeit × Community-Note. Weniger als 3 bestätigte
   Treffer: mit Sorten nur nach Aroma auffüllen, sichtbar markiert „noch nicht bestätigt“.
5. **Auswertungen:** Top und Flop (je 3), du gegen Community (mit Satz „du bewertest im Schnitt 0,4
   strenger“), Overall-Schnitt je Kategorie, Verlauf des Netzes, Lieblingshersteller.
6. **Verlauf:** aus heutiger Sicht nachgerechnet. Beim Speichern die Reihe nach 1, 2, 3 … Bewertungen
   (nach Datum) rechnen und ablegen; keine Momentaufnahmen.
7. **Adressen:** privates Dashboard `/profil`; öffentlich `/profil/<kurz-id>` (kein Name in der URL);
   `/mitglied` bleibt Konto (Status, Avatar, Benachrichtigungen, Schalter öffentliches Profil).
8. **Navigation:** kein fünfter Menüpunkt. Der Knopf „Mein Konto“ heißt „Mein Profil“ und führt zu
   `/profil`; dort ein Reiter „Konto“ zu `/mitglied`. „Könnte dir gefallen“ zieht ins Profil um.
9. **Betreiber:** dieselben Regeln wie alle (Opt-in, kein Vergleich „wie nah bist du am Betreiber“).
10. **Mindestzahl:** Netz ab 1 Bewertung mit Hinweis „vorläufig, ab 3 aussagekräftig“ und Zähler. Ohne
    Bewertung eine leere Skizze mit Knopf „Erste Bewertung abgeben“.
11. **HWG:** Netz und Vorschläge nur Aroma, nie Wirkung. Vorschläge heißen neutral „Ähnlich im Aroma wie
    deine Favoriten“, ohne Kauf- oder Apothekenlink. Wirkung im Overall-Schnitt nur privat.
12. **Veränderung:** im Profil der Stand vor der letzten Bewertung als dünne Kontur, dazu eine
    Änderungszeile („seit X: Fruchtig stärker, Erdig schwächer“). Nach dem Speichern auf der Blütenseite
    ein Mini-Netz mit Animation vorher/nachher direkt dort.
13. **Stufen:** ein Plan, drei Stufen, jede einzeln live, innerhalb einer Stufe parallele Stränge.

**Technikentscheidung (Claude, dem Nutzer genannt):** beim Speichern einer Bewertung rechnen und ablegen
(Workers-CPU 10 ms); beim Aufruf von `/profil` neu rechnen, wenn der Stand älter als 24 h ist, damit neue
Community-Werte ankommen. Cron verworfen: auch dort 10 ms CPU im Free-Plan.

## 3. Stufen

| Stufe | Inhalt | Live-Prüfpunkt |
|---|---|---|
| 1 | `/profil` privat: Netz + Terpenliste, bestätigte Vorschläge, Top/Flop, du gegen Community, Overall-Schnitt, Navigation „Mein Profil“ mit Reiter „Konto“ | eigenes Profil des Betreibers live ansehen |
| 2 | öffentliches Profil `/profil/<kurz-id>` mit Opt-in-Schalter in `/mitglied`, Link vom Namen im Buch | Schalter an, Profil als Gast öffnen |
| 3 | Verlauf des Netzes, Kontur „vorher“ mit Änderungszeile, Lieblingshersteller, Mini-Netz nach dem Speichern auf der Blütenseite | Bewertung speichern, Mini-Netz sehen |

Diese Spec beschreibt Stufe 1 vollständig. Stufe 2 und 3 stehen in Abschnitt 9 und 10 als Rahmen; ihr
Plan entsteht, wenn Stufe 1 live ist.

## 4. Daten (Stufe 1)

### 4.1 Migration `0017_nutzer_profil.sql` (rein additiv)

```sql
CREATE TABLE "nutzer_profil" (
    "mitglied_id" TEXT NOT NULL PRIMARY KEY,
    "geschmack" TEXT NOT NULL,      -- JSON {achse: -1..1}, 10 Achsen, normiert auf das stärkste |Gewicht|
    "terpene" TEXT NOT NULL,        -- JSON [{name, wert: -1..1}], höchstens 8 positiv + 3 negativ
    "anzahl" INTEGER NOT NULL,      -- gezählte Bewertungen (alle eigenen, auch Mittelfeld)
    "gewichtet" INTEGER NOT NULL,   -- davon mit Gewicht ≠ 0 (ab 3,5 oder bis 2)
    "berechnet_am" DATETIME NOT NULL,
    CONSTRAINT "nutzer_profil_mitglied_id_fkey" FOREIGN KEY ("mitglied_id") REFERENCES "mitglied" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "nutzer_empfehlungen" ADD COLUMN "bestaetigt" BOOLEAN NOT NULL DEFAULT false;
```

Alter Code läuft mit der Migration weiter (neue Tabelle, neue Spalte mit Vorgabe). Remote spielt der
Controller sie vor dem ersten Push ein, der sie liest.

### 4.2 Profilwerte

Grundlage ist der Profilvektor aus `profilAus` (`lib/empfehlung.ts`), unverändert gerechnet. Neu:

- **Gesamtnote fehlt** (Altbewertungen vor v2): ersatzweise das Mittel der fünf Noten
  (`berechneGesamtnote`). Gilt für Profil und Empfehlungen gleich, damit Altbewertungen zählen.
- **Geschmack:** die 10 Schlüssel `g:<KATEGORIE>`, geteilt durch das größte |x| über diese 10. Ergebnis
  je Achse in −1..1. Positiver Teil × 5 bildet die Fläche „mag ich“, |negativer Teil| × 5 die
  gestrichelte Linie „mag ich nicht“. Eine Achse ist nie zugleich beides.
- **Terpene:** Schlüssel `t:<Name>`, geteilt durch das größte |x| über alle Terpene. Die 8 stärksten
  positiven als Rangliste, dazu höchstens 3 negative als „eher nicht“.
- **Leer:** ohne gewichtete Bewertung bleiben `geschmack` alle 0 und `terpene` leer; `anzahl` und
  `gewichtet` tragen den Zähler.

Reine Funktion `profilAnzeige(bewertungen, sorten): ProfilWerte` in `lib/profil.ts`, getestet.

### 4.3 Bestätigte Vorschläge

`AROMA_SPALTEN` bekommt `k.gesamtnote_median AS gn, k.anzahl AS an`; `SortenAroma` bekommt optional
`community?: { median: number | null; anzahl: number }`.

In `empfehlungenBerechnen` (nach dem Kosinus, vor dem Schnitt auf 6):

1. Bestätigt ist eine Sorte mit `anzahl ≥ 2` und `median ≥ 3,5`.
2. Bestätigte nach `kosinus × median / 5` absteigend, höchstens 6.
3. Sind es weniger als 3, wird mit unbestätigten nach reinem Kosinus auf 6 aufgefüllt. Sind es 3 oder
   mehr, stehen nur bestätigte in der Liste.
4. Jede `Empfehlung` trägt `bestaetigt: boolean`, gespeichert in der neuen Spalte.

Die Vorauswahl von 150 Kandidaten in D1 bleibt; eine bestätigte Sorte außerhalb der 150 ähnlichsten
fällt heraus. Das ist gewollt: die Ähnlichkeit bleibt Voraussetzung.

Die Startseite („Was dir schmecken könnte“) liest dieselbe Tabelle und bekommt die neue Reihenfolge ohne
weitere Änderung; ihr Link „zu deinem Konto“ zeigt auf `/profil`.

### 4.4 Fortschreiben

`profilFortschreiben(mitgliedId)` in `lib/query/profil.ts` ersetzt den Aufruf von
`empfehlungenFortschreiben` in `bewertungSpeichern`. Sie lädt eigene Bewertungen und Sortenaroma einmal,
rechnet Empfehlungen und Profilwerte und schreibt beides in einer D1-`batch` (Empfehlungen ersetzen,
`nutzer_profil` per `INSERT … ON CONFLICT(mitglied_id) DO UPDATE`). Ein Fehler bleibt wie heute
geloggt und meldet die Bewertung nicht als gescheitert.

`/profil` ruft `profilFortschreiben` vor dem Lesen auf, wenn `nutzer_profil` fehlt oder `berechnet_am`
älter als 24 h ist (`PROFIL_GUELTIG_MS`). Scheitert das, zeigt die Seite den alten Stand oder den
Leerzustand.

### 4.5 Auswertungen (je Aufruf, ohne Speicher)

Eine Abfrage lädt die eigenen Bewertungen (`take: 1000`) mit Sorte (Slug, Handelsname, Hersteller) und
`sorten_kennwerte` (Median, Mittel, Anzahl). Daraus rechnet die reine Funktion
`auswertungen(eigene): Auswertungen` in `lib/profil.ts`:

- **Top und Flop:** nach Gesamtnote (Ersatz wie 4.2), Gleichstand nach Datum (neuere zuerst). Top die
  ersten 3, Flop die letzten 3 der übrigen. Bei 3 oder weniger Bewertungen kein Flop.
- **Du gegen Community:** je Bewertung mit mindestens einer fremden freigegebenen Bewertung der Sorte.
  Community-Mittel ohne die eigene: `(mittel × n − eigene) / (n − 1)`, falls die eigene freigegeben ist
  (sie steckt dann im Mittel), sonst `mittel`. Satz: Mittel der Differenzen, auf 0,1 gerundet, als
  „strenger“ (negativ), „milder“ (positiv) oder „wie die Community“ (|d| < 0,1). Dazu die 3 Sorten mit
  der größten Abweichung. Ab 2 vergleichbaren Bewertungen, sonst ein Hinweis.
- **Overall-Schnitt je Kategorie:** Mittel von Aussehen, Geruch, Geschmack, Wirkung, Konsistenz und
  Gesamtnote über alle eigenen, auf 0,1 gerundet. Wirkung steht nur hier, privat.

CPU: reine Arithmetik über höchstens 1000 Zeilen, deutlich unter 10 ms.

## 5. Seite `/profil` (Stufe 1)

Server Component, dynamisch, `robots: noindex`. Ohne Anmeldung Weiterleitung nach
`/anmelden?weiter=%2Fprofil`. Breite wie `/mitglied` (`max-w-180`), Karten aus `components/ui`.

Kopf: Avatar, Name, Zähler „N Bewertungen“. Darunter die Reiterleiste **Profil | Konto**
(`components/profil/ProfilReiter.tsx`), dieselbe auf `/mitglied`; aktiver Reiter mit
`aria-current="page"`.

Reihenfolge der Karten:

1. **Deine Aromen** — `ProfilNetz` (10 Achsen, Fläche „mag ich“ in Tinte, „mag ich nicht“ gestrichelt,
   Legende mit beiden Formen, nicht nur Farbe) und darunter `TerpenRangliste` (Balken, Anzeigenamen über
   `terpenAnzeige`). Unter 3 gewichteten Bewertungen der Hinweis „vorläufig, ab 3 aussagekräftig“ mit
   Zähler. Ohne Bewertung eine leere Skizze (Ringe und Achsen) und der Knopf „Erste Bewertung abgeben“
   zu `/blueten`. Nur Mittelfeld-Bewertungen: Hinweis, dass nur Noten ab 3,5 oder bis 2 das Netz formen.
   Werte zusätzlich als Liste für Screenreader, das SVG ist `aria-hidden`.
2. **Ähnlich im Aroma wie deine Favoriten** — die bestehende `EmpfehlungsListe` mit Begründung, je
   Eintrag ein Badge „noch nicht bestätigt“ bei `bestaetigt = false`. Kein Kauf- oder Apothekenlink.
3. **Top und Flop** — zwei Listen mit Note und Link zur Blütenseite.
4. **Du und die Community** — der Satz, dann die 3 größten Abweichungen (eigene Note, Community-Note).
5. **Deine Schnitte** — sechs Werte als ruhige Kennzahlenreihe (Note mit einer Nachkommastelle).

`/mitglied` verliert die Karte „Könnte dir gefallen“ und bekommt die Reiterleiste. Titel bleibt
„Konto“.

## 6. Navigation und Texte

- `KONTO_LINK.href` wird `/profil`; `kopf.navigation.konto` wird „Mein Profil“ / „My profile“.
- `istAktiv` markiert den Knopf auch auf `/mitglied` (zweiter Pfad), weil Konto ein Reiter des Profils
  ist.
- Texte, die „Mein Konto“ nennen (Vorschlagen, Datenschutz, Kopf-Kommentare), heißen „Mein Profil“
  bzw. verweisen auf den Reiter „Konto“.
- Alle neuen Texte in `lib/i18n/de.ts` und `lib/i18n/en.ts` unter `profil`.
- Nach dem Speichern einer Bewertung zusätzlich `revalidiereSprachen("/profil")`.

## 7. Gestaltung

Regelwerk `ui-design-engine` (Buch und Handschrift, 8-px-Raster, Tokens aus `app/globals.css`).
Datengrafik in Tinte, nicht in Blattgrün (Grün ist Bedienung), wie das bestehende Netzdiagramm.
Gestrichelt `stroke-dasharray="4 4"`, Kontur 1,5 px. Balken der Terpenliste in Tinte mit 12 % Fläche,
negative Balken gestrichelt umrandet ohne Fläche. Keine Bewegung in Stufe 1.

## 8. Tests

- `lib/profil.ts`: Normierung, Fläche und Strichlinie getrennt, Leerzustand, Ersatz-Gesamtnote,
  Top/Flop-Grenzen, Community-Mittel ohne eigene, Satzrichtung, Rundung.
- `lib/empfehlung.ts`: Bestätigt-Regel (Grenzen 2 und 3,5), Rang Kosinus × Median, Auffüllen unter 3,
  nur Bestätigte ab 3.
- Migration 0017 mit `better-sqlite3` auf dem Stand nach 0016.
- Navigation: `istAktiv` für `/profil` und `/mitglied`.
- `tests/i18n-literale.test.ts` deckt die neuen Komponenten ab.

## 9. Stufe 2 (Rahmen)

`mitglied.profil_oeffentlich` (Vorgabe 0) und `mitglied.kurz_id` (8 Zeichen, eindeutig, beim
Einschalten vergeben). `/profil/<kurz-id>` zeigt Name, Avatar, Zahl und Liste der freigegebenen
Bewertungen und das Netz, nie Vorschläge oder Auswertungen. Aus: 404. Der Name im Buch verlinkt nur bei
öffentlichem Profil. Datenschutzerklärung ergänzen.

## 10. Stufe 3 (Rahmen)

`nutzer_profil_verlauf` (mitglied_id, schritt, datum, geschmack) beim Speichern nachgerechnet für
1 … n Bewertungen nach Datum. Kontur „vorher“ = Schritt n − 1, Änderungszeile aus den zwei größten
Differenzen. Lieblingshersteller = Hersteller mit dem höchsten Mittel ab 2 eigenen Bewertungen.
Mini-Netz nach dem Speichern auf der Blütenseite mit Animation vorher/nachher (reduzierte Bewegung:
direkt der neue Stand). CPU der Verlaufsrechnung prüfen: n Profile über die bewerteten Sorten, ohne
Kandidatensuche.

## 11. Nicht-Ziele

Kein Vergleich mit dem Betreiber, keine Wirkung in Netz oder Vorschlägen, keine Kauf- oder
Apothekenlinks, kein Cron, kein fünfter Menüpunkt, keine Folgen-Funktion.
