# Auftakt als Eyecatcher — Design

**Datum:** 2026-10-08
**Status:** Entwurf, wartet auf die Freigabe des Nutzers
**Bezug:** `components/story/Auftakt.tsx`, `components/story/bewegung/auftakt.ts`,
`components/marke/Logo.tsx`, `lib/query/umfragen.ts` (`communityZahlen`),
`components/story/bewegung/zahlformat.ts`, Spec TP3 (Marke und Medien)

---

## 1. Ziel

Die erste Ansicht der Startseite soll hängenbleiben. Heute stehen dort Film, Logo, Claim und ein Knopf;
zwischen Intro und Knopf liegt ein großer leerer Raum. Dieser Raum bekommt drei Zahlen, die zeigen, dass
hinter der Marke echte Arbeit steht. Alles andere am Auftakt bleibt, was es ist, und wird nur geschärft.

Der Auftakt bleibt eine reine Markenbühne. Die laufende Umfrage und die letzte Review führen die Seite
bewusst **nicht** an; sie stehen weiter in ihren eigenen Sektionen.

## 2. Entscheidungen des Nutzers (bindend, nicht neu fragen)

1. **Botschaft:** nur die Marke. Keine Umfrage, keine Review in der ersten Ansicht.
2. **Bewegung:** wie heute, nur besser. Kein neues Werkzeug, kein WebGL, kein Shader. Die vorhandene
   GSAP-Staffel wird in Reihenfolge und Timing geschärft.
3. **Handlung:** keine zweite Handlung im Auftakt. Statt eines zweiten Knopfes stehen dort Live-Zahlen.

## 3. Die Zahlenleiste

Drei Zahlen, waagerecht, mittig, im heute leeren Raum zwischen Intro und Knopf. Jede Zahl groß in der
Serifenschrift, darunter ein Kleinwort in gesperrter Versalschrift wie die übrige Auftaktschrift.

| Zahl | Inhalt | Quelle |
|------|--------|--------|
| Sorten im Katalog | aktive Strains | `strains WHERE aktiv = 1` |
| Bewertungen im Buch | freigegebene Reviews | `reviews WHERE freigegeben = 1` |
| Stimmen abgegeben | alle Umfragestimmen | `stimmen` |

Die dritte Zahl steht auch in der Randspalte weiter unten (`communityZahlen`). Das ist gewollt: beide
Stellen zählen dasselbe und sollen nie auseinanderlaufen.

**Keine Namen, keine Freitexte, keine Wirkungsaussage** — § 10 HWG gilt hier wie überall.

## 4. Abfrage

Neue Funktion `auftaktZahlen()` in `lib/query/start-zahlen.ts`, genau nach dem Muster von
`communityZahlen` in `lib/query/umfragen.ts`:

```sql
SELECT
  (SELECT COUNT(*) FROM strains WHERE aktiv = 1) AS sorten,
  (SELECT COUNT(*) FROM reviews WHERE freigegeben = 1) AS bewertungen,
  (SELECT COUNT(*) FROM stimmen) AS stimmen
```

Eine `$queryRaw` mit drei Unterabfragen, **keine `$transaction`**: die gibt es auf D1 nicht, und jede
einzelne Query wäre ein eigener Sub-Request. Die Werte kommen als `unknown` zurück (D1 liefert je nach
Treiber `number` oder `bigint`) und werden wie in `zuCommunityZahlen` in Zahlen gewandelt.

Keine neue Tabelle, keine Migration, kein neuer Index: `strains.aktiv` und `reviews.freigegeben` sind
schon indexiert.

## 5. Einbau in den Auftakt

`Auftakt` ist heute eine Serverkomponente ohne Datenzugriff. Die Zahlen kommen in eine eigene
Serverkomponente `AuftaktZahlen` in einem `Suspense`, wie `WissenBuendeln` es mit der Randspalte macht:

- Fehler der Abfrage werden gefangen und geloggt (`unstable_rethrow` zuerst, damit Next-interne
  Unterbrechungen durchgehen). Scheitert sie, bleibt der Raum leer und der Auftakt steht trotzdem.
- Während der Abfrage steht ein Skelett in derselben Höhe, damit nichts springt.
- Die Zahlen stehen im Server-HTML. Ohne JavaScript und bei reduzierter Bewegung sind sie sofort richtig
  da; die Zählanimation ist nur Zugabe.

Die Startseite bleibt wie bisher statisch mit 300 s Gültigkeit. Die Zahlen sind deshalb bis zu fünf
Minuten alt. Das ist für Zähler dieser Art richtig und spart Sub-Requests.

## 6. Bewegung

Kein neues Werkzeug. Die Staffel in `components/story/bewegung/auftakt.ts` behält die Marken, die der
Nutzer am 2026-09-25 gesetzt hat („später und länger"), und bekommt die Zahlen als letzten Schritt:

| Zeit | Was |
|------|-----|
| 0 s | Film blendet auf (bestehend) |
| 0,6 s | Logo schreibt sich per CSS (bestehendes `schreiben`) |
| 1,8 s | Oberzeile blendet ein (bestehend) |
| 3,4 s | Intro blendet ein (bestehend) |
| 4,2 s | Zahlenleiste blendet ein, die Zahlen zählen dabei einmal hoch |

Die Zahlen nutzen `zahlformat.ts`, das es für die Zähler im Buch schon gibt — damit zählen sie in der
Sprache der Seite und mit den richtigen Trennzeichen. Sie tragen ein eigenes Merkmal
`data-auftakt-zaehler`, **nicht** `data-zaehler`: `eintrag.ts` greift alle `[data-zaehler]` der Seite ab
und würde sonst die Auftaktzahlen beim Aufschlagen der Doppelseite ein zweites Mal hochzählen. Die
Zahlenleiste trägt `data-story-einstieg`, damit der CSS-Notfall sie wie Oberzeile und Intro nach 8 s
zeigt, falls die Bühne nicht lädt. Bei
`prefers-reduced-motion: reduce` steht sofort der Endwert, genau wie `eintrag.ts` es heute schon macht.

Der Knopf „Bewerte jetzt mit" bleibt ab dem ersten Frame bedienbar und trägt weiterhin kein
`data-story-einstieg`. Glanzstreifen und das Wachsen des Logos auf 115 % beim Hinausscrollen bleiben
unverändert.

## 7. Feinschliff am Bestand

Das „nur besser" aus der Entscheidung des Nutzers, alles innerhalb der bestehenden Marke:

1. **Raster:** die Abstände zwischen Logo, Oberzeile, Intro und Zahlenleiste auf das 8px-Raster ziehen.
2. **Intro:** die Zeile ist seit `a0506dc` bis xl umbrechbar. Ihre Größe wird an die Zahlenleiste
   gebunden, damit beide als eine Gruppe lesen.
3. **Verlauf:** der Verlauf über dem Video setzt tiefer an, damit die Schrift auch auf hellen Frames
   trägt. Gemessen wird gegen die hellsten Frames beider Videos, Ziel ist 4,5:1 für die Oberzeile.

## 8. Prüfen

**Tests (`node --test`):**
- `auftaktZahlen` wandelt `bigint`, `number` und `null` richtig und wirft nicht bei leerer Datenbank.
- Zahlformat deutsch und englisch (vorhandene Hilfsfunktionen, neue Fälle).
- Der Auftakt rendert die drei Zahlen im Server-HTML (Quelltextprüfung wie bei den übrigen
  Startseitentests).

**Live nach dem Deploy:** 1440 px und 390 px, hell und dunkel, deutsch und englisch, reduzierte Bewegung,
und ein Lauf mit abgeschaltetem JavaScript.

## 9. Bewusst nicht in dieser Runde

- Umfrage oder Review im Auftakt (Entscheidung 1).
- Shader, Partikel, WebGL (Entscheidung 2).
- Eine zweite Handlung neben dem Knopf (Entscheidung 3).
- Neue Videos oder neues Bildmaterial.
