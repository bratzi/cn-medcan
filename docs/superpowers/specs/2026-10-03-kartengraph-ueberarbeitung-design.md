# Kartengraph-Überarbeitung — Design

**Datum:** 2026-10-03
**Status:** zur Freigabe
**Betroffen:** `components/review/AromaKarte.tsx`, `components/review/AromaErkundung.tsx`,
`components/review/GesamteindruckLeiste.tsx`, `components/review/SortenKopf.tsx`,
`components/story/AromaSektion.tsx`, `app/[lang]/blueten/[slug]/page.tsx`,
`lib/aromakarte.ts`, `lib/regler-raster.ts`, `lib/query/bewertung.ts`,
`lib/bewertung-eingabe.ts`, `prisma/schema.prisma`, `migrations/`

---

## Worum es geht

Der Kartengraph der Aroma-Erkundung bleibt in seiner Grundform so, wie er heute auf der
Startseite steht; der Nutzer hat diese Form am 2026-10-03 ausdrücklich bestätigt. Geändert
werden zehn Punkte, die alle denselben Kern haben: die Karte soll nur noch zeigen, was
wirklich gemessen oder bewertet wurde, und die Bedienung soll einfacher sein.

Der Betreiber kennt die Geschmacks-Intensität der Herstellerangaben nicht. Jede
Darstellung, die sie behauptet, ist deshalb eine Erfindung und fällt weg. Was bleibt, ist
der Community-Median mit seinem Ring.

---

## 1. Herstellerangaben als Intensität fallen weg

**Heute:** Die grüne Herstellerserie steht als vertikaler Soll-Strich auf jeder
Geschmacksachse (`AromaKarte.tsx:879-900`), der Balken der Bewertung färbt sich an ihr
(`bezug="serie"`), und die Legende führt sie als eigene Serie.

**Neu:**
- Der Soll-Strich entfällt vollständig, mit Legendeneintrag und `LegendenMuster art="soll"`.
- `bezug` fällt als Prop weg: der Bezug ist immer der Community-Median (der grüne Ring am
  Regler). Was heute `bezug="median"` tut, gilt überall.
- Die grüne Serie wird nicht mehr an die Karte gereicht. `erkundungsDaten` liefert in
  `serien` nur noch die Community-Reihe (lila).
- Der stille Herstellerstreifen hinter den Bögen (`herstellerKraft`) bleibt: er sagt nur,
  welche Terpene der Hersteller nennt, nicht wie stark ein Geschmack ist.
- Die Ebenen (`hersteller`, `ergaenzt`, `geist`) bleiben vollständig erhalten, samt
  Hinweis "laut Hersteller nicht enthalten". Das ist eine Enthalten-Aussage, keine
  Intensitäts-Aussage.
- `herstellerProfil` und `herstellerTreue` bleiben für das Fazit unangetastet; sie sind
  eine Rangfolge-Nähe, keine Kartendarstellung.

Der Sortenkopf behält seine Terpen-Anteilsbalken: das sind echte Laborwerte in Prozent,
keine geschätzte Geschmacksintensität.

## 2. Overall und Diese Charge mit derselben Granularität

**Heute:** `GesamteindruckLeiste` fährt `schritt={1}`, `BeschaffenheitsLeiste` fährt
`schritt={0.1}`. Die Noten liegen in `prisma/schema.prisma:250-254` als `Int`.

**Neu:** Overall übernimmt `schritt={0.1}` und die Formatierung mit einer
Nachkommastelle. Dafür werden die fünf Notenspalten von `Int` auf `Float` migriert.

SQLite und damit D1 kennt kein `ALTER COLUMN TYPE`. Die Migration läuft daher als
Tabellenkopie im Muster der bestehenden Migrationen: neue Tabelle mit `REAL`,
`INSERT ... SELECT`, Umbenennen, Indizes neu. Eingespielt wird remote ausschließlich über
`npx wrangler d1 execute … --remote --file`, durch den Nutzer (Dauerregel).

Eingabevalidierung in `lib/bewertung-eingabe.ts`: Bereich 1 bis 5, auf 0,1 gerundet,
0 heißt weiterhin "keine Note". `mittleNoten` rundet weiter auf eine Nachkommastelle.
Die versteckten Felder in `AromaErkundung` geben `Math.round(wert * 10) / 10` statt
`Math.round(wert)`.

## 3. Geschmack über 0 heißt aktiv

Die Regel, die bisher nur implizit galt, wird die ausdrückliche Funktionsweise der
Karte: ein Geschmackswert über 0 macht den Geschmack aktiv und sichtbar, unabhängig
davon, ob der Hersteller ihn nennt.

Heute entscheidet `achseFarbig` über die Schwelle `SPUERBAR`. Künftig gilt: Wert > 0 ist
aktiv. Die Achse wird gezeichnet, gefärbt und trägt ihre Bögen, auch wenn sie laut
Hersteller nicht im Profil steht. Ein deaktiviertes Terpen, das diesen Geschmack trägt,
wird dadurch aktivierbar (Punkt 4).

## 4. Terpene per Klick, keine Stärkeregler

**Heute:** `terpenRegler` zeichnet je Terpen eine Spur 0 bis 5 rechts in der Karte;
gespeichert wird eine ganze Stufe je Terpen (`TERPEN_STUFEN_MAX`).

**Neu:**
- Die Terpen-Stärkeregler entfallen. `terpenRegler`, `terpenSpur`, `terpenTaste`,
  `terpenZeiger`, `TERPEN_STUFEN_MAX` und `kartenHoeheMitReglern` fallen weg oder
  schrumpfen auf das An/Aus-Modell.
- Ein Terpen ist an oder aus. Gespeichert wird 0 oder 1. Der Knoten rechts wird zur
  Schaltfläche: Klick schaltet um, Tastatur über Enter und Leertaste, Zustand über
  `aria-pressed`.
- Der Community-Ring am Terpen wird zum Anteil: wie viele Bewertende dieses Terpen
  aktiviert haben. Das ist derselbe Median-Pfad, nur auf 0 bis 1 gelesen.
- **Automatik:** Zieht man einen Geschmack über 0 und ist dieser Geschmack eindeutig
  genau einem Terpen der Sorte zuzuordnen, schaltet dieses Terpen sich selbst an.
- **Mehrdeutig:** Tragen mehrere Terpene denselben Geschmack, schaltet sich keines
  automatisch an. Stattdessen pulsieren die Kandidaten in Kopierstift-Violett
  (`--color-kopierstift`) als Aufforderung; der Nutzer wählt im nächsten Schritt per
  Klick. Das Pulsieren endet, sobald eines der Kandidaten-Terpene an ist oder der
  Geschmack wieder auf 0 steht. Bei `prefers-reduced-motion: reduce` statt Puls ein
  ruhiger violetter Ring.
- Zieht man einen Geschmack zurück auf 0, bleibt ein automatisch aktiviertes Terpen an.
  Es wieder abzuschalten ist eine eigene Entscheidung des Nutzers, kein Nebeneffekt.

Kandidatenermittlung: `leuchtendeTerpene(achse, terpene, ebenen)` in `lib/aromakarte.ts`
liefert bereits die Träger einer Achse. Darauf setzt eine neue reine Funktion
`terpenKandidaten(achse, terpene)` auf, die nach Anteil ab 0,2 filtert und die Fälle
"keiner", "genau einer" und "mehrere" unterscheidet. Sie wird mit Tests zuerst gebaut.

Datenseite: `terpenIntensitaet` bleibt als Spalte, enthält künftig nur 0 und 1.
`mittleTerpenIntensitaet` und der Median in `sorten_kennwerte` lesen das weiter; alte
Werte 1 bis 4 werden beim Lesen als "an" gedeutet. Eine Datenmigration der alten Werte
ist nicht nötig, weil 1 bis 5 ohnehin alle "an" bedeuten.

## 5. Angaben zur Blüte nach oben

**Heute:** Auf der Blütenseite steht der Abschnitt `texte.angaben` mit `Faktenliste`,
`CannabinoidBar` und `TerpenChips` nach der Aroma-Erkundung
(`app/[lang]/blueten/[slug]/page.tsx:329-354`).

**Neu:** Der Abschnitt rückt direkt unter Bild und Sortenüberschrift, also in den
Sortenkopf, vor Schritt 1 der Erkundung. Umsetzung ohne Doppelung: der Abschnitt wird als
Node in den bestehenden `bild`-Slot von `AromaErkundung` gereicht, zusammen mit dem
`SortenKopf`. Die Startseite bleibt unberührt, sie hat keinen solchen Block.

UI und UX: Der Block steht nicht als zweite große Sektion unter dem Kopf, sondern wird in
den Kopf eingepasst — die Fakten als `dl` in der rechten Spalte des `SortenKopf` neben
Kultivar und Wirkstoffen, die Cannabinoid-Leiste direkt darunter. Die Terpen-Chips
entfallen dort, weil der Sortenkopf das Terpenprofil mit Anteilsbalken schon zeigt;
dieselbe Information zweimal nebeneinander ist Lärm.

## 6. Startseite als Example mit demselben Code

Die Startseite nutzt heute schon `NoteUndErkundung` und darüber `AromaErkundung` mit
`eingabe={false}`, also die Anzeige ohne Regler-Maske.

**Neu:** Sie nutzt denselben Pfad wie die Bewertungsseiten, also die volle Maske mit allen
Reglern, nur ohne Veröffentlichen. Dafür bekommt `AromaErkundung` statt des booleschen
`eingabe` einen Modus:

```ts
modus?: "anzeige" | "example" | "maske"
```

- `maske`: wie heute `eingabe={true}`. Versteckte Formularfelder, Speichern.
- `example`: identisches Verhalten und identische Optik, ohne die versteckten
  Formularfelder und ohne Speichern-Pfad. Regler starten bei 0, wie in der echten Maske
  (Nutzerentscheid 2026-10-03). Ein Hinweissatz sagt, dass nichts gespeichert wird;
  `texte.aroma.erkundung.nichtsGespeichert` steht dafür schon bereit.
- `anzeige`: der heutige Nur-Lese-Zustand, weiter in Gebrauch auf der Buchseite
  (`Doppelseite.tsx`).

Das bestehende `eingabe` wird intern aus `modus` abgeleitet; es gibt keinen zweiten
Komponentenbaum und keine Kopie. `AromaSektion` reicht `modus="example"`.

## 7. Die Terpen- und Geschmacks-Sektion darf nicht springen

**Heute:** Die Infotafel unter der Karte reserviert `min-h-80 sm:min-h-56`
(`AromaKarte.tsx:1290`) und liegt erst ab `lg` als absolute Überlagerung über der Karte.
Unter `lg` wächst sie mit ihrem Inhalt über die reservierte Höhe hinaus — und die ganze
Sektion springt, je nachdem welches Terpen man überfährt.

**Neu:** Die Tafel überlagert bei jeder Breite: `absolute` am unteren Rand der Karte,
`min-h-0` im Fluss. Die Sektion hat damit eine feste Höhe, unabhängig vom Tafelinhalt.
Lange Texte werden in der Tafel selbst gescrollt (`max-h` plus `overflow-y-auto`), nicht
durch Wachsen nach außen. Der Platzhalter `min-h-*` fällt weg.

## 8. Terpen-Band der Startseite: hoch, mit Infos im Band, und endlich funktionsfähig

**Heute:** `components/story/TerpenBand.tsx` zeigt nur Icons in einem 78 px hohen Band
(`py-4` plus 44 px Trefffläche). Duft und Geschmacksnoten stecken in einem Tooltip, der
absolut unter dem Icon aufklappt. `components/story/TerpenBandKopie.tsx` klont die Liste
im Browser ein zweites Mal, `app/globals.css` (Abschnitt Terpen-Band, Zeilen 1841-1876)
lässt die Spur per `animation: terpen-band 60s linear infinite` und `translate: -50%`
laufen.

**Drei Fehler, die der Nutzer am 2026-10-03 gemeldet hat:**

1. Der Lauf ist nicht endlos, es entstehen Lücken.
2. Beim Überfahren erscheint nichts.
3. Beim Klicken erscheint nichts.

**Erste Hypothesen, bevor etwas geändert wird:**

- Lücken: `translate: -50%` ist nur dann nahtlos, wenn genau zwei gleich breite Listen
  nebeneinander stehen **und** eine Liste mindestens so breit ist wie das Fenster. Ist
  eine Liste schmaler, laeuft nach ihr sichtbar Leere durch. Abhilfe: so viele Kopien
  einfügen, dass eine Kachel die Fensterbreite übersteigt, und die Verschiebung an der
  Kachelbreite statt an Prozent der Spur ausrichten.
- Nichts beim Überfahren: `overflow-x-clip` auf der Sektion zusammen mit dem absolut
  unter das Band gelegten Tooltip, oder die laufende `translate`-Animation, die unter dem
  Zeiger wegwandert, bevor `group-hover` greift.
- Nichts beim Klicken: ein Klick ist bisher überhaupt nicht vorgesehen. Nur `:hover` und
  `:focus-within` öffnen die Tafel, und `tabIndex={0}` auf einem `span` erhält beim
  Mausklick in manchen Browsern keinen Fokus.

Diese drei Punkte werden nicht geraten, sondern live im Browser nachgewiesen
(`superpowers:systematic-debugging`, Browser-MCP, Dauerregel: keine lokale Dev-Instanz),
bevor der Code sich ändert.

**Neue Form (nur Web, ab `sm`):**

- Das Band darf 2,5-mal so hoch werden: aus 78 px werden rund 195 px.
- Die Infos wandern **in** das Band. Je Terpen steht neben dem Icon eine Spalte mit Name,
  Duft und den Geschmacksnoten samt Farbpunkt und Anteilsbalken, wie heute im Tooltip.
- Im Ruhezustand ist diese Spalte ausgegraut (`text-text-muted`, gedämpfte Balken).
  Beim Überfahren des Terpens tritt sie in volle Farbe und voller Lesbarkeit hervor.
- Der aufklappende Tooltip entfällt damit. Keine absolute Tafel mehr, kein Clipping,
  keine Überlagerung. Das loest Fehler 2 und 3 an der Wurzel: die Infos sind immer da,
  Überfahren ändert nur ihre Betonung.
- Für Screenreader bleibt je Terpen ein zusammenhängender Textblock; der heutige
  `role="tooltip"` mit `aria-describedby` fällt weg, weil die Beschreibung nun sichtbarer
  Inhalt ist.
- Das Anhalten des Laufs bei `:hover` und `:focus-within` bleibt.

**Mobil (unter `sm`):** unverändert. Der Nutzer hat die heutige Mobilform ausdrücklich
als in Ordnung bezeichnet. Dort bleibt es beim schmalen Icon-Band; die Infospalte wird
ausgeblendet, damit die Zeile nicht ausufert.

**CPU-Grenze:** Die Startseite stand schon einmal am 1102er Limit. Die Infos je Terpen
mehrfach zu rendern kostet Serverarbeit. Deshalb bleibt es beim bisherigen Vorgehen: der
Server rendert eine Kachel, der Browser klont sie für den nahtlosen Lauf. Die Kopien
werden in `TerpenBandKopie` erzeugt, nicht auf dem Server.

## 9. Infobox der Karte wechselt im Web beim Überfahren, nicht erst beim Klick

**Heute:** Die Infotafel unter der Karte (`AromaKarte.tsx:1284-1340`) hängt an `aktiv`
und `terpenAktiv`. Gesetzt werden die beiden über `onPointerEnter` auf den
SVG-Elementen (Zeilen 967, 1059), über `onMouseEnter` und `onFocus` auf den
HTML-Zeilen (1206, 1234, 1263) und über `onPointerDown` (968, 1060). Ein Teil dieser
Treffflächen entsteht nur, wenn `regler` beziehungsweise `terpenRegler` gesetzt ist, also
nur in der Maske. In der Anzeige fehlt dort die Fläche, und es bleibt der Klick.

**Neu (nur Web):** Das Überfahren einer Geschmacksachse oder eines Terpens wechselt die
Box, in jedem Modus, ohne Klick. Dafür bekommt jede Achse und jedes Terpen eine
Trefffläche, die unabhängig von `regler` und `terpenRegler` existiert: ein
unsichtbarer, aber treffbarer Bereich über dem Knoten und seiner Zeile, mindestens
44 px hoch, mit `onPointerEnter` und `onFocus`. Der Klick bleibt erhalten, er ist dann
nur nicht mehr nötig.

**Mobil:** unverändert. Es gibt dort kein Überfahren; der Nutzer hat die heutige
Mobilform als in Ordnung bezeichnet. Die Umstellung gilt über `@media (hover: hover)`
beziehungsweise `pointerType === "mouse"`, damit ein Fingertipp sich nicht ändert.

Welche Trefffläche heute tatsächlich fehlt, wird zuerst live im Browser nachgewiesen
(`superpowers:systematic-debugging`), nicht geraten. Punkt 7 (die Tafel überlagert und
springt nicht mehr) und dieser Punkt gehören zusammen und werden in einem Strang
umgesetzt.

## 10. Mobile: die Wortmarke im Hero braucht Abstand zum Displayrand

**Heute:** Die h1 im Hero ist die handschriftliche Wortmarke
(`components/story/Auftakt.tsx:74`, `components/marke/Wortmarke.tsx`) in der Größe
`text-plakat`. Der Token steht in `app/globals.css:90`:

```css
--text-plakat: clamp(6rem, 1rem + 15vw, 22rem);
```

Der Container trägt `px-4`, also 16 px je Seite. Auf einem 390 px breiten Telefon ergibt
`1rem + 15vw` rund 74 px — unter der Untergrenze von `6rem`, also 96 px. Die Untergrenze
greift damit auf jedem Telefon und macht die Schrift breiter, als der Platz hergibt. Der
Schriftzug klebt am Displayrand.

**Neu:** Die Untergrenze wird gesenkt, damit die Wortmarke auf kleinen Geräten wirklich
mit dem Fenster skaliert, und das Padding auf Mobil wächst auf eine Stufe, die sichtbar
Luft lässt:

- `--text-plakat` bekommt eine kleinere Untergrenze, sodass bei 360 bis 430 px Breite
  die Wortmarke samt Padding in die Zeile passt, ohne an den Rand zu stoßen.
- Der Hero-Container im Auftakt bekommt mobil mehr Seitenrand als `px-4`.
- Geprüft wird an den schmalen Breiten 320, 360, 390 und 430 px: links und rechts muss
  sichtbarer Abstand bleiben, und die Wortmarke bleibt einzeilig.
- Ab `sm` bleibt alles wie heute. Die Desktopform ist nicht gemeint.

Die Konturen hinter der Wortmarke (`marke-kontur-1` bis `-4`) nutzen dieselbe Größe und
ziehen automatisch mit; sie müssen nicht gesondert angefasst werden, aber ihr Überstand
wird bei der Prüfung mitgesehen.

---

## Reihenfolge und Schnitt

Vier Stränge; je Strang ein Worktree, parallel umsetzbar:

| Strang | Inhalt | Dateien |
|---|---|---|
| A | Herstellerstriche weg (1), Geschmack über 0 aktiv (3), Sprung weg (7), Box wechselt beim Überfahren (9) | `AromaKarte.tsx`, `erkundung-daten.ts`, `aromakarte.ts` |
| B | Terpene per Klick (4) | `AromaKarte.tsx`, `aromakarte.ts`, `regler-raster.ts`, `bewertung-eingabe.ts` |
| C | Overall-Granularität (2) samt Migration | `GesamteindruckLeiste.tsx`, `schema.prisma`, `migrations/`, `bewertung-eingabe.ts` |
| D | Angaben nach oben (5), Startseite als Example (6) | `blueten/[slug]/page.tsx`, `SortenKopf.tsx`, `AromaErkundung.tsx`, `AromaSektion.tsx` |
| E | Terpen-Band: Fehler finden und beheben, hohe Form mit Infos im Band (8) | `TerpenBand.tsx`, `TerpenBandKopie.tsx`, `app/globals.css` |
| F | Wortmarke im Hero mobil schmaler, mit Abstand (10) | `app/globals.css`, `components/story/Auftakt.tsx` |

A und B berühren beide `AromaKarte.tsx`; B übernimmt deshalb den Stand von A. C, D und E sind von beiden frei. E beruehrt als einziger Strang das Terpen-Band und
kollidiert mit nichts.

## Prüfen

- Reine Funktionen zuerst mit Tests: `terpenKandidaten`, die 0/1-Deutung in
  `mittleTerpenIntensitaet`, die 0,1-Rundung in `lib/bewertung-eingabe.ts`.
- Bestehende Tests unter `tests/` müssen grün bleiben; die Tests zum Soll-Strich und zu
  den Terpen-Stufen werden mit ihrem Feature entfernt, nicht stillgelegt.
- Danach Push auf `main` und Prüfung live im Browser (Dauerregel: kein `next dev` lokal):
  Startseite, eine Blütenseite, die Bewertungsmaske, die Buchseite.

## Was ausdrücklich nicht geändert wird

- Die Grundform des Kartengraphs: Achsen links, Terpene rechts, Bögen dazwischen,
  Umschalter Karte und Netz. Der Nutzer hat die heutige Startseiten-Form bestätigt.
- Overall bleibt "mehr ist besser"; nur die Geschmacksmatrix ist Sweet Spot.
- Die Fazit-Berechnung in `lib/fazit.ts` und `herstellerTreue`.
- Apotheken und Preise (zurückgestellt).
