# Bilder zur Bewertung — Design

**Datum:** 2026-10-06
**Status:** vom Nutzer freigegeben (2026-10-06)
**Bezug:** Budpics (T9, Migration 0012), Buch-Doppelseite (Spec 2026-10-05)

---

## 1. Ziel

Wer eine Sorte bewertet, kann bis zu drei Bilder zu seiner Bewertung abgeben. Im Buch stehen sie auf
der linken Seite unter dem Text als ein ruhiges Bildfeld mit Diashow und füllen den Leerraum, der
bei kurzen Texten heute leer bleibt. Ohne eigenes Bild steht dort ab `lg` das Herstellerbild oder
sonst das Musterbild der Sorte. Ein
freigegebenes Bewertungsbild ist zugleich ein Budpic der Sorte: ein Bild, zwei Orte.

Nutzerzitat: „Es soll ermöglicht werden, Bilder und Videos bei der Bewertung abzugeben. Diese sollen
dann im Buch links auf der Seite über oder unter dem Text stehen und den Leerraum dezent füllen. Wenn
nichts hochgeladen wurde, soll das Musterbild gefüllt sein.“

## 2. Entscheidungen des Nutzers (bindend)

1. Zuerst nur Bilder. Video kommt später (Nicht-Ziel, Abschnitt 13).
2. Hochladen dürfen alle, die bewerten dürfen (freigeschaltete Mitglieder und der Betreiber).
   Bilder des Betreibers sind sofort sichtbar. Community-Bilder starten `OFFEN` und erscheinen erst
   nach der Freigabe in /admin, wie Budpics.
3. Höchstens drei Bilder je Bewertung. Im Buch links ein einziges Bildfeld **unter** dem Text, mit
   Diashow wie bei den Budpics. Es füllt den Leerraum; die Höhe gibt ab `lg` die rechte Seite vor.
4. Freigegebene Bewertungsbilder zählen zusätzlich als Budpics der Sorte, ohne doppelte Ablage.
5. Ohne freigegebenes Bild: ein Ersatzbild wie in der Produktkarte, zuerst das Herstellerbild
   (`blueteBild(bildPfad)`), sonst das Musterbild (`musterBildId(slug)` aus `lib/budpics.ts`).
   Unter `lg` kein Ersatzbild.
6. Komplett kostenfrei: kein R2, nur Dienste mit harter Free-Grenze. Bilder als WebP-BLOB in D1 wie
   die Budpics: höchstens 150 KB, lange Kante höchstens 1280 px, im Browser verkleinert.
7. Bild und Bewertung werden getrennt freigegeben; die Freigabe einer Bewertung gibt ihre Bilder
   nicht mit frei.

## 3. Bestand, auf dem aufgebaut wird

| Baustein | Datei | Rolle hier |
|---|---|---|
| Tabelle `budpics` | `migrations/0012_budpics.sql`, `prisma/schema.prisma` (`Budpic`) | nimmt die Bewertungsbilder auf |
| Grenzwerte, Musterbild | `lib/budpics.ts` | `BUDPIC_MAX_BYTES`, `BUDPIC_MAX_KANTE`, `musterBildId` |
| Verkleinern im Browser | `lib/bild-verkleinern.ts` | unverändert genutzt |
| Prüfung auf dem Server | `lib/bild-pruefen.ts` | unverändert genutzt (Magic Bytes, RIFF, Maße) |
| Budpic-Upload | `app/[lang]/blueten/[slug]/budpic-aktionen.ts` | Vorbild für die neue Aktion |
| Freigabe | `app/[lang]/admin/budpic-aktionen.ts`, `components/admin/BudpicFreigabe.tsx` | gilt unverändert auch für Bewertungsbilder |
| Auslieferung | `app/api/bild/[id]/route.ts`, `app/api/bild/offen/[id]/route.ts` | öffentlich nur `FREIGEGEBEN`; offen nur hinter Anmeldung |
| Diashow | `components/produkt/BudpicDiashow.tsx` | im Buch wiederverwendet |
| Bewertung speichern | `app/[lang]/blueten/[slug]/aktionen.ts` (`bewertungSpeichern`) | Upsert je Mitglied und Sorte, die Review-Id bleibt beim Überschreiben gleich |
| Buch | `components/review/BuchDoppelseite.tsx` | linke Seite bekommt das Bildfeld |
| Formular | `components/review/BewertungsFormular.tsx` | bekommt den Abschnitt „Bilder“ |

## 4. Datenmodell und Migration

### Entscheidung: Spalte `review_id` an `budpics`, keine eigene Tabelle

Ein Bewertungsbild ist ein Budpic mit Bezug auf eine Bewertung. Eine eigene Tabelle hätte das Bild
entweder doppelt abgelegt (150 KB je Kopie in D1) oder die Budpic-Diashow, die Freigabe, die
Bild-Route und das Ablehnen (BLOB leeren) hätten alle eine zweite Quelle bekommen. Mit einer Spalte
bleibt alles, was heute für Budpics gilt, ohne Änderung auch für Bewertungsbilder richtig:
`ladeFreieBudpics` zeigt sie in der Sortendiashow, /admin listet sie in derselben Warteschlange,
`/api/bild/<id>` liefert sie aus. Das erfüllt Entscheidung 4 ohne jede Kopie.

### Migration `migrations/0016_bewertungsbilder.sql`

```sql
-- 0016_bewertungsbilder
--
-- Bilder zur Bewertung (Spec 2026-10-06): ein Budpic kann zu einer Bewertung
-- gehoeren. Kein neues Bildlager: dieselbe Tabelle, dieselbe Freigabe, dieselbe
-- Route. Ein Bild ohne review_id ist ein freies Budpic wie bisher.
--
-- SQLite erlaubt ADD COLUMN mit REFERENCES, wenn der Standardwert NULL ist.
-- Wird die Bewertung geloescht (Verwerfen in /admin), gehen ihre Bilder mit.

ALTER TABLE "budpics" ADD COLUMN "review_id" TEXT
  REFERENCES "reviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "budpics_review_id_status_idx" ON "budpics"("review_id", "status");
```

Kein Tabellenumbau, keine Datenübernahme: bestehende Zeilen behalten `review_id = NULL`.

### Prisma (`prisma/schema.prisma`)

```prisma
model Budpic {
  // ... wie bisher
  reviewId String? @map("review_id")
  review   Review? @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@index([reviewId, status])
}

model Review {
  // ... wie bisher
  bilder Budpic[]
}
```

### Begründungen der Detailregeln

- **`ON DELETE CASCADE` an `review_id`:** `bewertungVerwerfen` löscht eine Community-Bewertung
  endgültig; ihre Bilder sind Teil dieses Inhalts und sollen nicht als freie Budpics übrig bleiben.
- **Überschreiben einer Bewertung** (Upsert in `bewertungSpeichern`) behält die Review-Id; die
  Bilder bleiben also an der Bewertung hängen. Entfernen ist ein eigener Schritt (Abschnitt 5).
- **`mitglied_id` bleibt Pflicht** und wird wie bisher aus der Sitzung gesetzt. Wird ein Mitglied
  gelöscht, gehen seine Bilder wie heute mit (Budpic-Cascade); die Bewertung selbst bleibt
  (`SetNull` am Autor) und zeigt dann das Ersatzbild.
- **Reihenfolge:** `erstellt_am` aufsteigend, also in der Reihenfolge des Hochladens. Keine eigene
  Positionsspalte; Umsortieren ist kein Ziel.
- **Zählen bis drei:** es zählen die Zeilen der Bewertung mit Status `OFFEN` oder `FREIGEGEBEN`.
  Abgelehnte Zeilen (BLOB schon geleert) zählen nicht, damit ein abgelehntes Bild durch ein neues
  ersetzt werden kann.

### Konstanten (`lib/budpics.ts`)

```ts
/** Bilder je Bewertung (Spec 2026-10-06, Nutzer). */
export const BEWERTUNGSBILD_MAX = 3;
```

## 5. Upload-Fluss im Formular

### Server Actions (neue Datei `app/[lang]/blueten/[slug]/bewertungsbild-aktionen.ts`)

**`bewertungsbildHochladen(formData)`** — eine Datei je Aufruf, wie `budpicHochladen`:

1. `freigabeErforderlich()`; sonst Meldung `budpic.nurFreigeschaltet`.
2. Datei vorhanden, Größe ≤ `BUDPIC_MAX_BYTES` **vor** dem Einlesen, dann `bildPruefen` mit
   `BUDPIC_MAX_KANTE`.
3. Sorte über `strainId` laden, muss aktiv sein.
4. Die Bewertung über `autorId_strainId` (Mitglied aus der Sitzung, nie aus dem Formular) laden.
   Ohne Bewertung: Meldung `bewertungsbild.ohneBewertung`.
5. Zählen wie in Abschnitt 4; bei drei: Meldung `bewertungsbild.zuViele` mit `{ max: 3 }`.
6. Für Community-Mitglieder zusätzlich die bestehende Grenze `BUDPIC_MAX_OFFEN` (10 offene Bilder je
   Mitglied über alle Sorten). Sie schützt die Warteschlange; Bewertungsbilder zählen mit, weil sie
   dieselbe Warteschlange füllen.
7. Ein `INSERT` mit `reviewId`, `strainId`, `mitgliedId`, Maßen und `status`:
   `FREIGEGEBEN` beim Betreiber (`rolle === "ADMIN"`), sonst `OFFEN`.
8. Neu laden: `/admin`; beim Betreiber zusätzlich `/blueten/<slug>`, `/blueten` und `/`.

**`bewertungsbildEntfernen(formData)`** — löscht ein eigenes Bild:
`istBudpicId(id)`, Zeile mit `id`, `mitgliedId` aus der Sitzung und `reviewId IS NOT NULL` suchen,
sonst Meldung „Das Bild gibt es nicht mehr.“. Danach `delete` und dieselben Pfade neu laden wie
beim Hochladen eines freigegebenen Bildes.

**Warum nicht im selben Aufruf wie `bewertungSpeichern`:** Drei Bilder wären 450 KB in einer
Anfrage, und ein einzelnes kaputtes Bild würde die ganze Bewertung scheitern lassen. Getrennte
Aufrufe halten jede Anfrage klein, ein Fehler trifft nur eine Datei, und die Bewertung (der Kern)
ist gespeichert, bevor das erste Bild unterwegs ist. Das Muster gibt es schon (`BudpicBeitragen`).

### Ablauf im Browser (`BewertungsFormular`)

Neuer Abschnitt „Bilder“ im Teil „Charge und Notiz“, unter der Notiz, als eigene Client-Komponente
`components/review/BewertungsBilder.tsx`:

1. **Vorhandene Bilder** der eigenen Bewertung stehen als kleine Kacheln (je 96 px Kante, 8px-Raster)
   mit Zustand „freigegeben“ oder „wartet auf Freigabe“ und einem Knopf „Entfernen“
   (`bewertungsbildEntfernen`, sofort, mit `router.refresh()`). Die Daten kommen über die
   Vorbelegung (`Vorbelegung.bilder: { id, breite, hoehe, status }[]`, ohne BLOB).
2. **Auswählen:** `input type="file" multiple accept="image/jpeg,image/png,image/webp"`. Es werden
   höchstens `3 − vorhandene` Dateien angenommen; ein Überschuss ergibt den Hinweis
   `bewertungsbild.zuViele`. Jede Datei wird **sofort beim Auswählen** mit
   `bildVerkleinernFrei(datei, { maxKante: BUDPIC_MAX_KANTE, maxBytes: BUDPIC_MAX_BYTES })`
   verkleinert und als Vorschau (Object-URL) gezeigt; Fehler beim Verkleinern stehen je Datei
   darunter. Vorgemerkte Bilder lassen sich vor dem Absenden wieder abwählen. Object-URLs werden beim
   Abwählen und beim Abbau freigegeben.
3. **Absenden:** zuerst `bewertungSpeichern` wie heute. Nur bei Erfolg die vorgemerkten Bilder
   nacheinander mit `bewertungsbildHochladen` senden; der Knopf zeigt „Bild 2 von 3 wird
   hochgeladen“. Danach ein `router.refresh()`.
4. **Rückmeldung:** die bestehende Erfolgsmeldung bleibt; bei Bildern ergänzt um „Bilder erscheinen
   nach der Freigabe“ (Community) bzw. nichts Zusätzliches (Betreiber). Gescheiterte Bilder bleiben
   vorgemerkt und werden mit Grund gelistet, damit ein erneutes Absenden nur sie schickt.

Die Bewertung ist also immer zuerst gespeichert; ein Bildfehler macht sie nie ungültig.

### Vorschau offener eigener Bilder

`app/api/bild/offen/[id]/route.ts` liefert heute nur dem Betreiber. Neu: auch dem Mitglied, dem das
Bild gehört (`mitgliedId` gleich der Sitzung). Alle anderen bekommen weiter 404, Cache weiter
`private, no-store`. So sieht man im Formular die eigenen wartenden Bilder.

## 6. Freigabe in /admin

- Bewertungsbilder laufen durch die bestehende Budpic-Warteschlange (`BudpicListe`, `BudpicFreigabe`)
  mit denselben drei Aktionen: freigeben, ablehnen (BLOB leeren, Zeile bleibt), löschen.
- `ladeBudpicsNachStatus` liefert zusätzlich `ausBewertung: boolean` (`reviewId !== null`); die
  Kachel zeigt dann den Vermerk „aus einer Bewertung“. Mehr Unterschied gibt es nicht.
- Bild und Bewertung werden **getrennt** freigegeben. `bewertungFreigeben` gibt keine Bilder mit
  frei: ein Bild ist eigener Inhalt und wird einzeln angesehen.
- `budpic-aktionen.ts` (Admin) lädt nach jeder Änderung schon `/blueten/<slug>`, `/blueten`, `/` und
  `/admin` neu; das deckt Buch und Sortendiashow ab.

## 7. Anzeige im Buch

### Daten

- `ReviewEintrag` (`lib/query/strains.ts`) bekommt `bilder: { id: string; breite: number; hoehe: number; erstelltAm: Date }[]`.
  Die bestehende Abfrage der Bewertungen einer Sorte (`reviews: { …, take: 20, select: {…} }`)
  wählt dazu die Relation mit:
  `bilder: { where: { status: "FREIGEGEBEN" }, select: { id: true, breite: true, hoehe: true, erstelltAm: true }, orderBy: { erstelltAm: "asc" }, take: 3 }`,
  nie mit `daten`. Prisma löst das in eine zusätzliche Abfrage mit `IN` über höchstens 20
  Review-Ids auf, weit unter dem D1-Limit von 100 gebundenen Werten.
- `EintragDaten` (`components/review/eintrag.ts`) bekommt `bilder?: EintragBild[]` mit
  `EintragBild = { id: string; breite: number; hoehe: number; erstelltAm: Date }`; `alsEintrag`
  reicht `review.bilder` durch. `bildPfad` (Herstellerbild) und `slug` liegen dort schon.
- Die Beschriftung im Buch ist nur das Datum des Bildes (neue Funktion `alsBuchBilder` in
  `lib/budpic-anzeige.ts`, Ergebnis `DiashowBild[]` mit `beschriftung = formatiereDatum(erstelltAm, sprache)`);
  der Name steht schon im Kopf der Seite. In der Sortendiashow bleibt `alsDiashow` mit „Von Name, Datum“.

### Aufbau der linken Seite

Reihenfolge von oben nach unten: Kopf (Avatar, Name, Badge) — Text — **Bildfeld** — Kolophon.

- **Bildfeld** (neue Server-Komponente `components/review/BuchBildfeld.tsx`): ein `figure` mit feinem
  Rahmen (`border border-border`, `bg-surface-sunken`), Bild mit `object-cover`. Bei mehreren
  Bildern `BudpicDiashow` mit allen Regeln dort (5 s, Überblenden nur über `opacity`, Halt bei
  Hover, Fokus, verborgenem Tab, Sparmodus und `prefers-reduced-motion`, Pausenknopf). Bei genau
  einem Bild `BudpicBild` statisch, ohne Diashow. Die Bildunterschrift ist
  `text-caption text-text-muted` und einzeilig: das Datum, beim Ersatzbild „Symbolbild“.
- **Dezent:** keine Überlagerung auf dem Bild, kein Schatten, keine Rundung über das Raster hinaus;
  das Bild ordnet sich dem Text unter. Der Text bleibt der Hauptinhalt der Seite.
- **`BudpicDiashow`** bekommt eine Prop `className` für das äußere `figure` (Standard wie heute
  `"flex w-full flex-col gap-2"`), damit es im Buch `h-full min-h-0` sein kann; `rahmen` wird im
  Buch `"min-h-0 w-full flex-1"`. Bestehende Aufrufer ändern sich nicht.

### Höhe und Leerraum ab `lg`

Die rechte Seite gibt die Höhe vor (Spec 2026-10-05). Der Text (`BuchNotiz`) ist heute
`lg:flex-[1_1_0px]` und misst seine eigene Fläche, um die Zeilenzahl zu bestimmen; er trägt nichts
zur Höhe bei. Das Bildfeld gehört deshalb **in dieselbe Fläche**, unter den Absatz:

- `BuchNotiz` bekommt eine optionale Prop `bild?: ReactNode`. Sie steht im selben Container unter
  Absatz und Knopf, in einem Wrapper `relative mt-2 w-full lg:min-h-48 lg:flex-1`; das Bild darin
  ist ab `lg` `absolute inset-0`. Der Absatz bleibt `flex-none`.
- Die Messung zieht den Platz des Bildes ab: neue Konstante `BILD_PLATZ = 208` (192 px
  Untergrenze `min-h-48` plus 16 px Abstand aus `gap-2` und `mt-2`), nur wenn `bild` gesetzt ist.
  Passt der Text in `platz − BILD_PLATZ`, steht er ganz und das Bild bekommt den ganzen Rest. Sonst
  `zeilen = max(1, floor((platz − BILD_PLATZ − KNOPF_PLATZ) / ZEILE))`, der Text endet mit
  „Weiterlesen“, das Bild hat seine Untergrenze. Weil die gemessene Fläche von der Seite und nicht
  vom Inhalt kommt, bleibt die Messung stabil.
- Offen („Weiterlesen“) legt sich der Text wie heute als Blatt über die linke Seite; das Bildfeld
  ist dann `lg:hidden`.
- Ohne Text (`keinText`) verliert der Platzhaltertext sein `lg:flex-1`; das Bildfeld steht danach
  als eigener Block mit `lg:min-h-48 lg:flex-[1_1_0px]` und füllt den Raum bis zum Kolophon.

### Unterhalb `lg` (mobil und Tablet)

- Die Seiten stehen untereinander; die Höhe ergibt sich aus dem Inhalt. Ein eigenes Bild hat dort
  ein festes Seitenverhältnis `aspect-[4/3] w-full` mit `max-h-[60svh]`, damit ein Hochformatfoto
  nicht den Bildschirm füllt.
- Ohne eigenes Bild wird unterhalb `lg` **kein** Ersatzbild gezeigt (Nutzer 2026-10-06): dort gibt es
  keinen Leerraum zu füllen. Das Ersatzbild trägt `max-lg:hidden`.

### Ersatzbild ohne eigenes Bild

Ohne freigegebenes Bewertungsbild (auch wenn Bilder noch `OFFEN` sind) steht ab `lg` ein Ersatzbild,
in derselben Reihenfolge wie in der Produktkarte (Nutzer 2026-10-06):

1. das Herstellerbild der Sorte, `blueteBild(eintrag.bildPfad)` aus `lib/medien.ts`;
2. sonst das Musterbild `musterBildId(eintrag.slug)` aus `lib/budpics.ts`.

Gezeigt mit `Bild id={…} dekorativ` und `object-contain`. Die Beschriftung übernimmt die
Produktkarte (`components/produkt/ProduktCard.tsx`): sie kennzeichnet Herstellerbild **und**
Musterbild gleich, mit `title={w.budpic.muster}` am `figure` und der Bildunterschrift
`w.katalog.karte.symbolbild` („Symbolbild“), weil beide nicht die bewertete Blüte zeigen.
Dieselbe Sorte zeigt auf jeder Doppelseite dasselbe Ersatzbild.

### CPU-Grenze

Die Diashow ist eine Client-Komponente. Wie die rechte Seite wird sie nur auf nahen Seiten gerendert
(`NurAufgeschlagen` bekommt dafür eine optionale Prop `ersatz?: ReactNode`, die auf fernen Seiten
statt `null` steht); ferne Seiten zeigen nur das erste Bild statisch als `BudpicBild`. Damit kommt je
Doppelseite höchstens ein `img` dazu; das Server-Rendern bleibt im 10-ms-Budget (Abschnitt 9).

## 8. Kopplung an die Budpics der Sorte

- Ein freigegebenes Bewertungsbild ist eine Zeile in `budpics` mit Status `FREIGEGEBEN`;
  `ladeFreieBudpics` findet es ohne Änderung. Es erscheint also in der Diashow der Produktkarte und
  der Blütenseite, mit „Von Name, Datum“ wie jedes Budpic.
- Die Sortendiashow zeigt weiter die neuesten `BUDPIC_MAX_ANZEIGE` (8) Bilder, gemischt aus freien
  Budpics und Bewertungsbildern.
- Abgelehnt, gelöscht oder mit der Bewertung verworfen: verschwindet an beiden Orten zugleich, weil
  es nur eine Zeile gibt. Öffentliche Antworten der Bild-Route sind höchstens eine Stunde gecacht
  (bestehende Regel `CACHE_STUNDE`).
- Ein Bild ist nie doppelt gespeichert.

## 9. Grenzen (alle hart und kostenfrei)

| Grenze | Wert | Wie eingehalten |
|---|---|---|
| D1 Zeilengröße | 2 MB | ein Bild ≤ 150 KB je Zeile, BLOB als gebundener Parameter |
| D1 Speicher (Free) | 5 GB | 150 KB je Bild ergibt rund 34 000 Bilder insgesamt (Budpics und Bewertungsbilder zusammen); abgelehnte Bilder geben ihren BLOB frei; Grenze je Bewertung 3, offene je Mitglied 10 |
| D1 Lesen/Schreiben (Free) | 5 Mio. Zeilen gelesen, 100 000 geschrieben je Tag | ein Insert je Bild; Anzeige ohne `daten`, eine Zusatzabfrage je Seite; Bilder per Route mit Cache |
| Workers CPU (Free) | 10 ms je Anfrage | kein Bildumbau auf dem Server, nur Kopfprüfung (`bildPruefen`); Diashow nur auf nahen Seiten |
| Server-Action-Body | 1 MB Standard | eine Datei ≤ 150 KB je Aufruf |
| Kein R2, kein Images-Dienst | — | nur D1 und Worker |

## 10. Fehlerfälle

| Fall | Verhalten |
|---|---|
| Nicht angemeldet oder nicht freigeschaltet | Meldung `budpic.nurFreigeschaltet`, nichts gespeichert |
| Bewertung noch nicht gespeichert | Aktion lehnt mit `bewertungsbild.ohneBewertung` ab; im Formular kommt es nicht vor, weil die Bilder erst nach erfolgreichem Speichern laufen |
| Mehr als drei Bilder | Browser nimmt den Überschuss nicht an; Server zählt erneut und lehnt mit `bewertungsbild.zuViele` ab |
| Datei zu groß, falsches Format, HEIC, SVG | Meldungen aus `bild-verkleinern` und `bild-pruefen` (`bild.zuGross`, `bild.format`, `bild.keinBild`, `bild.masse`, `bild.eingabeGross`) je Datei |
| Zehn offene Bilder des Mitglieds | `budpic.zuVieleOffen` |
| Sorte inaktiv oder weg | `budpic.sorteUnbekannt` |
| Sitzung läuft während des Uploads ab | geworfener Fehler wird je Datei als `budpic.fehlgeschlagen` gemeldet, nächste Datei läuft weiter; die Bewertung ist schon gespeichert |
| Bild abgelehnt | erscheint nirgends; im Formular als „abgelehnt“, zählt nicht zur Grenze, kann ersetzt werden |
| Bewertung verworfen | Bilder per Cascade weg |
| Fremdes Bild entfernen | Aktion findet keine Zeile mit eigener `mitgliedId`, Meldung, nichts gelöscht |
| Bild-Route mit offener oder fremder id | 404 wie bisher |
| Kein JavaScript | Buch zeigt das erste Bild statisch; Hochladen braucht JavaScript (Verkleinern im Browser), der Abschnitt „Bilder“ ist bis zur Hydrierung deaktiviert wie der Speichern-Knopf |

Neue Meldungsschlüssel in `lib/i18n/de.ts` und `lib/i18n/en.ts`: `bewertungsbild.ohneBewertung`,
`bewertungsbild.zuViele`; dazu Texte unter `w.bewerten` für Abschnittstitel, Hinweis, Zustände
(„freigegeben“, „wartet auf Freigabe“, „abgelehnt“), „Entfernen“, Fortschritt und den Vermerk
„aus einer Bewertung“ in /admin.

## 11. Datenschutz

Die Datenschutzseite (`app/[lang]/datenschutz/page.tsx`) nennt Budpics schon. Sie wird um einen Satz
ergänzt: Bilder zu einer Bewertung werden wie Budpics gespeichert, erscheinen nach Freigabe auch in
der Bildergalerie der Sorte und werden mit der Bewertung gelöscht. Die Bilder werden im Browser neu
kodiert; dabei fallen EXIF-Daten (z. B. Ort) weg.

## 12. Tests (`node:test`, `tests/`)

Die Tests im Projekt prüfen reine Funktionen und Markup; Migrationen laufen gegen `better-sqlite3`
(Vorbild `tests/kennwerte-nachtragen.test.ts`). Deshalb liegt die Entscheidungslogik der Aktionen in
einer reinen Datei `lib/bewertungsbilder.ts`, die Aktionen rufen sie nur auf:

- `bildStatusFuer(rolle)`: `"FREIGEGEBEN"` für `ADMIN`, sonst `"OFFEN"`.
- `bilderFrei(zeilen)`: wie viele der drei Plätze noch frei sind; abgelehnte Zeilen zählen nicht.
- `annehmbareDateien(anzahlGewaehlt, vorhanden)`: wie viele der gewählten Dateien der Browser annimmt.

Testdateien:

- `tests/bewertungsbilder.test.ts` (neu): die drei Funktionen oben, inklusive Grenzfällen
  (0, 3, abgelehnte Zeilen, Überschuss bei der Auswahl).
- `tests/bewertungsbilder-migration.test.ts` (neu, `better-sqlite3`): `0012` bis `0016` anwenden;
  bestehende Budpics behalten `review_id NULL`; Löschen einer Bewertung löscht ihre Bilder
  (Cascade, `PRAGMA foreign_keys = ON` wie in D1); Aktualisieren der Bewertung lässt sie stehen;
  der Index `budpics_review_id_status_idx` existiert.
- `tests/buch-doppelseite.test.ts` (erweitert, Markup):
  - mit einem Bild: statisches Bild, keine Diashow-Knöpfe;
  - mit drei Bildern: Diashow mit „1 / 3“;
  - ohne Bild mit Herstellerbild: dessen Medien-Id, Beschriftung „Symbolbild“, `max-lg:hidden`;
  - ohne Bild und ohne Herstellerbild: `musterBildId(slug)`, Beschriftung „Symbolbild“;
  - Reihenfolge links: Kopf, Text, Bildfeld, Kolophon.
- `tests/budpics-anzeige.test.ts` (erweitert): Beschriftung im Buch nur mit Datum.
- Server-Actions, Bild-Route und `ladeFreieBudpics` mit Bewertungsbildern werden live geprüft
  (Dauerregel „Live statt Dev“): als Community-Mitglied drei Bilder hochladen, ein viertes
  versuchen, in /admin freigeben und ablehnen, Bewertung verwerfen; als Betreiber ein Bild, das
  sofort im Buch und in der Sortendiashow steht. Buch bei 1143 px und unter 640 px, kurzer und
  langer Text, null, eins und drei Bilder.

## 13. Nicht-Ziele

- **Video.** Kommt später und braucht eine eigene Entscheidung (Speicherort und Größe sprengen den
  D1-Weg; ein kostenfreier Weg ist noch offen). Datenmodell und Oberfläche hier legen nichts dafür an.
- Bild über dem Text (der Nutzer hat „unter dem Text“ gewählt).
- Umsortieren der Bilder, Zuschneiden im Browser, Bildunterschriften durch Nutzer.
- Bilder an der Bewertung in der Kartenansicht der Startseite oder in Teilen-Bildern.
- Automatische Freigabe der Bilder zusammen mit der Bewertung.
