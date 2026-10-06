# Buch-Doppelseite: Stimme und Urteil, Design

**Datum:** 2026-10-05
**Status:** zur Freigabe
**Betroffen:** `components/review/Doppelseite.tsx`, `components/review/BewertungsBuch.tsx`,
`components/review/Buch.tsx`, `components/review/BuchNotiz.tsx`, `components/review/BuchReiter.tsx`,
`components/review/AromaKarte.tsx`, `components/review/eintrag.ts`, `lib/query/strains.ts`,
`lib/i18n/de.ts`, `lib/i18n/en.ts`, `app/globals.css`, neu: `components/review/BuchDoppelseite.tsx`,
`BlattUrteil.tsx`, `NotenLeiste.tsx`, `BuchKolophon.tsx`

---

## Worum es geht

Der Nutzer will das Buch auf der Blütenseite, das alle Bewertungen einer Sorte spiegelt, als
Blickfang der Seite. Aufgabe vom 2026-10-05:

- **Links die Person:** im Fokus der Text der Bewertung, der Name und das Avatar. Sekundär
  Datum, Charge und die Anzahl der Bewertungen dieser Person.
- **Rechts das Urteil:** oben die Blattbewertung, mehr im Fokus als heute. Der größte Blickfang
  ist die Terpenbewertung. Die fünf Noten (Aussehen, Geruch, Geschmack, Wirkung, Konsistenz)
  stehen dazwischen.
- Die Umsetzung soll UI und UX auf höchstem Niveau liefern, mit den installierten Design-Skills.

**Annahmen, die ich getroffen habe (bitte gegenlesen):**

1. "Das Buch auf der Bewerten-Seite" ist das blätterbare Buch `BewertungsBuch` auf der Blütenseite
   (`Doppelseite` mit `umfang="voll"`). Der Auszug auf der Startseite und auf `/reviews` bleibt
   unverändert.
2. "Terpenbewertung" ist die Aroma-Karte (Geschmacksachsen links, Terpene rechts, Bögen dazwischen).
3. "Blattbewertung" ist die Gesamtnote in Blättern.

## Befund live (2026-10-05, Chrome 1418 x 762)

Das Buch läuft heute auf kleinen Bildschirmen über seinen Rahmen. Der Rahmen ist 605 px hoch
(`--buch-h`), beide Seiten sind 722 px hoch. Die Fußzeile "Charge nicht angegeben" steht unterhalb
des Rahmens und überlagert die Überschrift "Deine Bewertung". Ursache: die Infotafel der Karte
reserviert seit `375bbc6` (heute, 21:37) fest 224 px, die Höhenrechnung von T7b ging noch von einer
Überlagerung aus. Diese Spec behebt das mit.

## Design Read

Reading this as: Produkt-Detailseite (aufgeschlagenes Buch) für Leser einer Cannabis-Community,
mit einer editorialen Sprache "Buch und Handschrift", gebaut mit nativem CSS auf den
Tailwind-v4-Tokens des Projekts, ohne neue Bibliothek.

Regler (`design-taste-frontend`): DESIGN_VARIANCE 6 (asymmetrisch durch angeschnittene Einlage und
großes Avatar, sonst ruhig), MOTION_INTENSITY 5 (einmalige, begründete Choreografie, keine
Dauerbewegung außer dem bestehenden Lichtfluss der Karte), VISUAL_DENSITY 5.

Konflikte der Skills mit dem Projekt, im Zweifel gilt die Brand Guideline: kein GSAP und kein
Lenis im Buch (`ui-design-engine` Abschnitt 7), keine neuen Illustrationen, keine Geviertstriche
im Text, nur Tokens für Farbe.

## 1. Aufbau

Ab `lg` zwei gleich breite Seiten wie bisher, damit das Umblättern (3D-Drehung um den Falz in
`Buch.tsx`) unverändert funktioniert. Beide Hälften behalten `data-buchseite`.

```
+--------------------------------------+--------------------------------------+
| LINKS: DIE STIMME                    | RECHTS: DAS URTEIL                   |
|                                      |                                      |
| (Avatar 128)  Name (text-h1)         | [5 Blätter]  4,5  von 5 Blättern     |
|               [Betreiber]            |                                      |
|                       "von euch"     | Aussehen Geruch Geschmack Wirkung Konsistenz
|                                      |   4,0     5,0     5,0      4,5      2,5
| Text der Bewertung, groß gesetzt,    |   ====    =====   =====    ====     ==
| bis zur Seitenhöhe, dann             |+-----------------------------------+
| "Weiterlesen"                        || Terpenbewertung | Beschaffenheit  |
|                                      ||      Diese Bewertung  [Karte|Netz]|
|                                      ||                                   |
|                                      ||  Karte: Balken, Bögen, Terpene    |
|                                      ||                                   |
| ------------------------------------ ||  Infotafel (fester Platz)         |
| Datum    Charge    Bewertungen       |+-----------------------------------+
| [Restfeuchte-Badge] Hinweis          | (Einlage läuft rechts und unten aus)
+--------------------------------------+--------------------------------------+
```

Unter `lg` stehen beide Seiten untereinander (erst Stimme, dann Urteil). Anders als heute gibt es
keine doppelte Fassung der Noten mehr: Noten und Restfeuchte stehen genau einmal im HTML, an ihrem
neuen Platz. Das streicht die `hidden lg:contents`-Paare aus `Doppelseite.tsx`.

## 2. Linke Seite: die Stimme

- **Kopf:** Avatar in `lg` (128 px, unter `sm` 80 px) mit feinem Ring (`ring-1`,
  `ring-offset-4`, 4 px als optische Korrektur, im Code begründet). Daneben der Name als `h3` in
  `font-buch text-h1 font-medium`, höchstens zwei Zeilen, ganzer Name im `title`. Die Überschrift
  trägt für Vorleser den Satz "Bewertung von {name}" (als `aria-label`, der sichtbare Name steht darin). Darunter die Marke
  `Betreiber` oder `Community` (Pille, wie heute). Ohne Autor und ohne Betreiber (Seed, gelöschtes
  Mitglied) kein Avatar, wie heute.
- **Randnotiz nur bei Community:** "von euch" in Handschrift (`font-hand text-vermerk
  text-kopierstift`), rechts im Kopf, mobil unter dem Namen. Das ist die Brand-Idee in einem Bild:
  der Betreiber spricht gedruckt, die Community schreibt mit. Die Marke `Community` bleibt als
  gedruckter Text bestehen, die Handschrift trägt nie allein die Information. Einmal geschrieben
  (siehe Abschnitt 4), kein Dauerlauf.
- **Text:** `BuchNotiz` mit größerer Schrift (`text-h3 font-normal`, Zeilenhöhe 28 px, Lesemaß
  `max-w-[52ch]`). Der Text füllt den Rest der Seite, die Messlogik (Zeilen zählen, "Weiterlesen",
  Blatt über der Seite) bleibt, nur `ZEILE` wird 28. Ohne Text steht ruhig und kursiv "Kein Text
  zu dieser Bewertung."
- **Kolophon unten:** `dl` mit drei Zellen, Datum, Charge, "Bewertungen insgesamt" (Zahl in
  `numeric`). Darunter, wie heute, das Restfeuchte-Badge, bei vorhandenem Wert mit dem erklärenden
  Satz daneben (höchstens zwei Zeilen). Ohne Charge steht "nicht angegeben".
- Schriftgrade: `text-h1` (Name), `text-h3` (Text), `text-small` (Kolophon), dazu die Handschrift.
  Das hält die Regel "höchstens drei Grade je Sektion".

## 3. Rechte Seite: das Urteil

- **Blatturteil oben** (`BlattUrteil`): fünf Blätter, je rund 50 px (heute 32), daneben die Zahl in
  `numeric text-kapitel` (Newsreader 200, ab 40 px erlaubt), dahinter "von 5 Blättern". Der
  Vorlesetext "4,5 von 5 Blättern" bleibt als `sr-only`. Ohne Gesamtnote (Altbewertung) entfällt
  die Zeile, nie eine 0 oder NaN. Die Blattzeichnung bleibt `BlattGlyphe`, es gibt keine zweite.
- **Notenleiste dazwischen** (`NotenLeiste`): fünf Spalten (mobil zwei), je Bezeichnung
  (`text-small text-text-muted`), Zahl (`numeric text-h2`, "/ 5" klein) und ein Tintenstrich
  darunter (`bg-text`, Länge = Wert von 5, auf einer Haarlinie, ohne gefüllte Spur, so wie die
  Brand "Linie ohne Hintergrundspur" verlangt). Alle fünf Noten, auch Wirkung, wie heute im vollen
  Eintrag.
- **Karteneinlage als Blickfang:** die Terpenbewertung steht auf einer eingeklebten Tafel
  (`bg-surface` auf der helleren Seite, `border-border`, eckig), die ab `lg` rechts und unten bis
  an den Rand der Seite läuft. Sie nimmt rund 60 % der Seitenhöhe. Oben in der Einlage die
  Reiterleiste (`Terpenbewertung`, `Beschaffenheit`, `Reel`, je nach Inhalt) und rechts Legende
  und Ansichtsschalter in **einer** Zeile.
- **Terpenwahl des Bewertenden:** hat die Bewertung gespeicherte Terpene (`terpenIntensitaet`, seit
  2026-10-03 an/aus), stehen in der Karte nur diese Terpene voll, die übrigen blass. Ohne
  gespeicherte Wahl bleibt es beim bisherigen Bild. Gelesen wird über `terpenAnAus`, alte Stufen
  zählen als "an". Nicht gezeigt werden vom Bewertenden ergänzte Terpene, die der Hersteller nicht
  nennt; die Karte kennt im Buch nur die Terpene der Sorte.
- **Infotafel der Karte, kompakt:** im Buch ab `lg` feste 128 px statt 224 px, dicht gesetzt: Icon
  und Name, ein Satz (zwei Zeilen), eine Zeile Pillen. Der feste Platz bleibt (Nutzerentscheidung
  von heute, die Tafel überlagert die Karte nicht), er ist nur kleiner. Unter `lg` bleibt alles
  wie heute.
- Wirkung steht wie bisher nur im vollen Eintrag, nicht im Auszug.

## 4. Bewegung

Alles CSS, nur `transform`, `opacity`, `clip-path`, jeweils einmal, ohne GSAP. Jede Bewegung ist
begründet:

| Was | Wie | Warum |
|---|---|---|
| Blätter | wachsen nacheinander (Skalierung und Deckkraft, 70 ms Versatz) | Hierarchie: das Urteil kommt zuerst |
| Noten und Striche | Zahl blendet auf, Strich wächst von links (`scaleX`) | Wert wird lesbar gemacht, nicht nur gezeigt |
| Einlage | deckt sich von links nach rechts auf (`clip-path`) | Leserichtung der Karte: Geschmack nach Terpen |
| Name, Text, Kolophon links | blenden gestaffelt auf, 8 px nach oben | Seitenaufbau in Leserichtung |
| "von euch" | schreibt sich per `clip-path` (bestehendes `@keyframes schreiben`) | Handschrift wird geschrieben |

- **Auslöser:** `Buch.tsx` setzt `data-im-bild` am Stapel, sobald das Buch im Bild ist (heute nur
  für das Autoplay beobachtet, künftig immer). Die Bewegung hängt an
  `.buch-stapel[data-im-bild] > .buch-seite[data-aktiv]`. Beim Umblättern startet sie neu, mit
  rund 280 ms Verzögerung, damit sie nach der Drehung landet.
- **Ruhe:** nur unter `prefers-reduced-motion: no-preference` und ohne `data-sparmodus`. Sonst steht
  der Endzustand sofort. Ohne JavaScript steht ohnehin alles statisch da.
- Keine Dauerbewegung neu. Der Lichtfluss der Karte bleibt, wie er ist.

## 5. Höhe und Fluss

- `lg:h-(--buch-h)` wird `lg:min-h-(--buch-h)`: der Rahmen wächst mit dem Inhalt, nichts läuft
  mehr über den Rand. `--buch-h` bekommt Untergrenze 51 rem (heute 31,5 rem) und Obergrenze 54 rem
  (heute 46 rem): auf großen Bildschirmen wird das Buch größer und die Karte mit ihm.
- Der Textbereich links hat `flex: 1 1 0` und `min-h-0` (`basis-0`), trägt also nicht zur Höhe der
  Zeile bei: die rechte Seite gibt die Höhe vor, links wird gemessen, wie viele Zeilen passen. Fällt
  diese Eigenschaft in einem Browser aus, wächst die Seite mit langem Text, läuft aber nie über.
- Auf 762 px Viewport-Höhe steht das Buch damit rund 810 px hoch und wird um etwa 130 px
  gescrollt. Das ist gewollt: lieber ein vollständiger Rahmen als ein abgeschnittener Inhalt.

## 6. Daten

- Neu `autorBewertungen: number | null` in `ReviewEintrag` und `EintragDaten`: Anzahl der
  freigegebenen Bewertungen des Autors über alle Sorten. Ohne Autor (Seed, gelöschtes Mitglied)
  `null`, dann entfällt die Zelle. Pro Mitglied und Sorte gibt es höchstens eine Bewertung
  (`@@unique([autorId, strainId])`), die Zahl zählt also Sorten.
- Quelle: eine Abfrage `groupBy` über die Autoren der geladenen Bewertungen, getrennt von der
  Sortenabfrage und in `try/catch`: scheitert sie, fehlt nur die Zahl, die Seite bleibt. Die Seite
  ist statisch (`revalidate = 300`), die Abfrage läuft also höchstens alle fünf Minuten je Sorte.
- Keine Migration, keine Schemaänderung.

## 7. Texte (de und en, über das Wörterbuch)

Neu unter `buch`: `bewertungVon` ("Bewertung von {name}"), `vonEuch` ("von euch" / "from you"),
`datum`, `chargeLabel`, `bewertungenInsgesamt`, `keinText`. `reiterKarte` heißt künftig
"Terpenbewertung" (en: "Terpene rating"). Keine Geviertstriche. Neue Dateien kommen in die Liste
`UMGESTELLT` von `tests/i18n-literale.test.ts`.

## 8. Was gleich bleibt

Umblättern, Autoplay, Tastatur, Wischen, `NurAufgeschlagen` (die Einlage rendert der Server nur für
die offene Seite und ihre Nachbarn, CPU-Limit), alle Reiter (Beschaffenheit, Reel), die Karte
selbst (Geometrie, Hover, Lichtfluss), Auszug auf Startseite und `/reviews`, Abstufung der
Überschriften, Datenschutz (der Name stand schon öffentlich im Buch).

## 9. Entscheidungen von mir, bitte kippen, was nicht passt

1. Restfeuchte wandert in den Kolophon links (sie ist eine Eigenschaft der Charge).
2. Beschaffenheit und Reel bleiben Reiter in der Einlage, die Leiste bleibt unverändert.
3. Die Zahl "Bewertungen" zählt alle freigegebenen Bewertungen des Mitglieds, nicht nur diese Sorte.
4. "von euch" in Handschrift nur bei Community-Einträgen.
5. Der Reiter heißt "Terpenbewertung" statt "Aroma-Karte" (dein Wort). Die Karte selbst und das
   Formular behalten ihren Namen.
6. Die Terpenwahl des Bewertenden hebt die gewählten Terpene hervor (Abschnitt 3).
7. Mobil gilt dieselbe Reihenfolge untereinander, ohne Sonderlayout.

## 10. Tests und Prüfung

- Tests zuerst (TDD): `tests/doppelseite.test.ts` trennt sich in Auszug (unverändert) und Buch
  (neu, `tests/buch-doppelseite.test.ts`). Neu: Reihenfolge links (Kopf, Text, Kolophon) und rechts
  (Urteil, Noten, Einlage), eine Fassung der Noten, Handschrift nur bei Community, kein Avatar ohne
  Autor, Zelle "Bewertungen" nur mit Zahl, Terpenwahl ändert die Stärken, `min-h` statt `h`.
  `tests/aroma-ebenen.test.ts` und `tests/buch.test.ts` ziehen nach.
- Lokal nur `npm test`, `npm run typecheck`, `npm run lint`, `npm run farben` (keine Dev-Server,
  Dauerregel).
- Live in zwei Pushes: erst Struktur und Höhe, dann Feinschliff. Geprüft mit Browser 1 bei
  1418 x 762 und größer, hell und dunkel. Live gibt es nur einen Eintrag (Betreiber,
  `thc-akut-25-rs11`): Community-Zustände (Avatar-Foto, Zahl, Handschrift) sind durch Tests belegt,
  nicht live zu sehen.
- Abschluss mit den Skills `web-design-guidelines`, `better-accessibility`,
  `critique-visual-hierarchy` und der Checkliste aus `ui-design-engine` Abschnitt 11.

## 11. Bewusst nicht dabei

Ergänzte Terpene des Bewertenden in der Karte, eine Profilseite je Mitglied, ein Sonderlayout für
das Handy, die Umgestaltung des Auszugs auf Startseite und `/reviews`.
