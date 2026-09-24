# Makeover „Grünes Buch“, Teilprojekt 2: die übrigen Seiten

**Stand:** 2026-09-24 · **Status:** Entwurf, Freigabe durch den Nutzer steht aus · **Vorgänger:**
`docs/superpowers/specs/2026-09-23-makeover-gruenes-buch-design.md` (Teilprojekt 1, live) · **Pläne:** je Welle
einer, entstehen nach der Freigabe mit `superpowers:writing-plans`, zuerst Welle 1.

## 1. Ausgangslage und Ziel

Teilprojekt 1 hat die Marke festgelegt und die Startseite neu gebaut. Die übrigen Seiten erben seitdem nur Farben
und Schriften. Aufgebaut sind sie wie eine gewöhnliche App: Überschrift, grauer Absatz, Karten. Die beiden
Kernseiten (`/reviews`, `/umfragen`) stehen nicht einmal in der Hauptnavigation.

**Erfolg heißt:** Wer von der Startseite weiterklickt, bleibt im selben Buch, und der Kern der Seite (die eigenen
Bewertungen des Betreibers und die Abstimmung) steht auch auf den Unterseiten vorn.

**Umfang:** alle Routen außer `/`: `/reviews`, `/umfragen`, `/produkte`, `/produkte/[slug]`, `/apotheken`,
`/apotheken/[slug]`, `/mitglied`, `/anmelden`, `/registrieren`, `/zugang`, `/admin`, `not-found`, dazu eine neue
Fehlerseite. Dazu kommt der Kleinkram in Dateien, die ohnehin angefasst werden (Abschnitt 2, Zeile „Umfang“).

**Unverändert bleiben:** Datenmodell, Server Actions, Zugriffskontrolle, Routen, Preislogik (§ 10 HWG),
Filterlogik, das Passwort-Gate, die Startseite (bis auf den Umzug der Doppelseite, 4.3).

**Design Read** (`design-taste-frontend` 0.B): Nachschlage- und Mitmachseiten einer Editorial-Community-Seite für
Cannabis-Patient:innen in Deutschland, Sprache „Buch, die Wand nur beim Mitreden“, Tailwind v4 mit eigenen Tokens,
Bewegung nur über CSS. **Regler** je Seitentyp:

| Seitentyp | Seiten | Varianz | Bewegung | Dichte |
|---|---|---|---|---|
| Kernseiten | `/reviews`, `/umfragen`, `/produkte/[slug]` | 6 | 2 | 3 |
| Verzeichnis | `/produkte`, `/apotheken`, `/apotheken/[slug]` | 4 | 2 | 5 |
| Konto | `/anmelden`, `/registrieren`, `/zugang`, `/mitglied`, `not-found` | 4 | 1 | 3 |
| Werkbank | `/admin` | 3 | 1 | 7 |

`design-taste-frontend` erklärt Katalog, Tabellen und Admin für außerhalb seines Geltungsbereichs (Abschnitt 13).
Für Verzeichnis und Werkbank gelten deshalb `better-layout` und `ui-design-engine`, nicht die Landingpage-Regeln.

## 2. Getroffene Entscheidungen

| Frage | Entscheidung (Nutzer, 2026-09-24) | Verworfen, weil |
|---|---|---|
| Umfang | **Optik plus Kleinkram:** alle Seiten im Stil Buch und Wand, dazu Korrekturen in ohnehin angefassten Dateien (Hydrations-Sperre, `Meldung`, Texte, Hover, falscher Preis-Satz) | nur Optik (bekannte Fehler blieben in angefassten Dateien stehen); Optik plus Review-Formular (Spec zu groß, wird eigenes Vorhaben); erst das Review-Formular (Nutzer will zuerst das Makeover) |
| Zuschnitt | **eine Spec, drei Wellen**, je Welle ein Plan und ein Live-Gang | ein Plan (sehr lang, lange nichts live); drei Specs (gemeinsame Bausteine würden in Welle 1 ohne Kenntnis der anderen Seiten festgelegt) |
| Navigation | **Kern zuerst:** 01 Bewertungen, 02 Abstimmung, 03 Produkte, 04 Apotheken, „Mein Konto“ ohne Nummer als abgesetzte Pille | fünf gleichrangige Punkte (Konto ist kein Inhalt); unverändert (Kern nur über die Startseite erreichbar) |
| Produktkopf | **Titelblatt statt Glas**, kein Herstellerbild, das Reel wandert zu seiner Bewertung | Glas über eigener Textur (Glas passt nicht zu Papier); Glas mit Herstellerbild (verstößt gegen Leitplanke 5, Datei liegt ohnehin nicht im Repo) |
| Ansatz | **A: durchgehend Buch, Dichte je Seitentyp** | B „Zwei Register“ (Katalog und Apotheken blieben „0815“); C „GSAP auch auf Kernseiten“ (bricht Regel 7 in `ui-design-engine`, rund 60 KB JS je Seite, Nachschlageseiten erzählen nicht) |
| Note auf der Produktseite | **„Meine Note“** aus der neuesten eigenen Bewertung; das Community-Mittel steht getrennt bei den Community-Stimmen | gemischtes Mittel wie heute (Community-Stimmen stünden gleichrangig neben dem Betreiber) |
| Katalog-Einträge | **Zeilen** mit festen Spalten | Kartenraster (drei Karten nebeneinander lassen sich schlecht vergleichen) |
| Vermerk im Katalog | **„Von mir getestet“** mit Note an jeder bewerteten Sorte | ohne Vermerk (der Kern bliebe im Katalog unsichtbar) |
| Feldbuch-Raster | **nur Startseite** | auf allen Seiten (Deko-Linien ohne Inhalt, `design-taste-frontend` 9.F; zum Nachschlagen soll der Grund ruhig sein) |
| Wand | **nur `/umfragen`** | weitere Seiten (die Community spricht nur dort) |
| Bewegung | **nur CSS** (Hover, Fokus, Zustände) | GSAP und Lenis (Regel 7) |
| Visuelle Vorschau | nur Text, kein Browser-Companion (Nutzer) | – |

**Nicht Teil dieses Vorhabens** und als Nächstes vorgesehen: das Formular, mit dem der Betreiber eigene Bewertungen
anlegt und freigibt. Bis dahin entstehen Bewertungen nur über den Seed. Die Live-Datenbank ist leer.

## 3. Gemeinsame Bausteine

Alle Bausteine kommen mit Welle 1, sofern nicht anders vermerkt. Sie liegen dort, wo auch die übrigen liegen:
Grundbausteine unter `components/ui/`, Seitengerüst unter `components/layout/`, Fachliches unter
`components/<fach>/`.

### 3.1 Kopf und Fuß

- **Kopf** (`components/layout/Kopf.tsx`): links die Wortmarke, daneben die nummerierten Punkte 01 Bewertungen
  (`/reviews`), 02 Abstimmung (`/umfragen`), 03 Produkte (`/produkte`), 04 Apotheken (`/apotheken`), rechts
  abgesetzt „Mein Konto“ (`/mitglied`) als Pille ohne Nummer (Stil `secondary`, Höhe 44 px).
- **Aktive Seite:** `aria-current="page"` und ein Unterstrich in `text` (2 px, Abstand 8 px), nicht nur Farbe.
  Aktiv ist ein Punkt, wenn der Pfad gleich `href` ist oder mit `href + "/"` beginnt. Dafür gibt es die kleine
  Client-Komponente `components/layout/NavLink.tsx` (`usePathname`). Die Regel steht als reine Funktion
  `istAktiv(pfad, href)` daneben und ist getestet. Der Kopf selbst bleibt Server Component und liest keine Sitzung.
- **Handy** (unter 768 px): erste Zeile Wortmarke und „Mein Konto“, zweite Zeile die vier nummerierten Punkte als
  seitlich wischbare Leiste (`overflow-x-auto`, `scroll-snap`). Die Leiste ist so breit, dass der nächste Punkt
  sichtbar anschaut. Keine ausgeblendete Navigation, kein Menüknopf.
- **Fuß** (`components/layout/Fuss.tsx`): Die Fußnavigation bekommt dieselben Einträge in derselben Reihenfolge.
  Schlusszeile, Tag und Bildnachweise bleiben.

### 3.2 Seitenkopf

`components/layout/Seitenkopf.tsx`, Server Component. Props: `titel` (Pflicht), `satz` (optional),
`zurueck` (optional, `{ href, text }`), `schmal` (optional, für die Kontoseiten: Spalte `max-w-120` statt
`max-w-360`), `children` (optional, für Zusätze wie die E-Mail auf `/mitglied`).

- Rückweg als Textlink über dem Titel („Alle Produkte“, „Alle Apotheken“), ohne Pfeil.
- Titel `h1` in Cormorant 300 `text-kapitel`, `text-balance`, `wrap-break-word`.
- Satz in Geist `text-body` `text-text-muted`, `text-pretty`, `max-w-[56ch]`, höchstens 20 Wörter, Du und Ich.
- Keine Oberzeile, keine Nummer, linksbündig. Behälter wie bisher `max-w-360`, Rand `px-4 sm:px-8`, oben
  `pt-16 sm:pt-24`, Abstand Titel zu Satz 16 px.

### 3.3 Schriftstufen auf Unterseiten

| Ebene | Schrift | Klasse |
|---|---|---|
| Seitentitel (`h1`) | Cormorant 300 | `font-buch text-kapitel font-light` |
| Abschnitt (`h2`) | Cormorant 500 | `font-buch text-h1 font-medium` |
| Innere Überschrift (`h3`) | Geist 600 | `text-h3 font-semibold` |
| Handelsname in Listen | Cormorant 500 | `font-buch text-h3 font-medium` (bzw. `text-h2`) |
| Zahlen, Noten, Chargen | Geist Mono | `numeric` |
| Wand-Überschrift (nur `/umfragen`) | Sedgwick | `font-wand text-tag` |

Genau ein `h1` je Seite, keine Sprünge in der Hierarchie. Höchstens drei Schriftgrade je Abschnitt (Regel 3).

### 3.4 Gruppieren, Blatt, Doppelseite

- `Card` ist nicht mehr der Standardbehälter. Gegliedert wird über Abstand, 16 px innerhalb einer Gruppe und
  mindestens 32 px zwischen Gruppen (`better-layout`), und über Haarlinien in `border`, wo Abstand allein nicht
  trägt.
- **Blatt** (`components/ui/Blatt.tsx`, neu): eckige Fläche `bg-surface-raised`, `border border-border-strong`,
  `shadow-md`, Innenabstand `p-6 sm:p-8`. Für Formulare und den Vorschlagsbereich. Eine Fläche mit Bedeutung: hier
  schreibst du etwas.
- **Doppelseite** (`components/review/Doppelseite.tsx`, aus `components/story/NeuesterEintrag.tsx` herausgelöst):
  dieselbe Machart wie auf der Startseite. Details in 4.3.
- `Card`, `CardHeader`, `CardBody`, `CardFooter` bleiben, bis Welle 3 den letzten Nutzer entfernt hat, dann
  entfallen sie. Dasselbe gilt für `Spinner`.

### 3.5 Faktenliste

`components/ui/Faktenliste.tsx`, neu. Props: `zeilen: { begriff: string; wert: ReactNode }[]`. Ein `dl`, je Paar
eine Zeile mit Haarlinie oben (`border-t border-border`, `py-4`), ab `sm` zweispaltig (`grid-cols-[16rem_1fr]`),
Begriff `text-small text-text-muted`, Wert `text-body text-text`. Ersetzt `Faktenblock` (Produktseite, Welle 1) und
`Stammdaten` (Apothekenseite, Welle 2).

### 3.6 Buchtabelle

Die geteilte `components/ui/Table.tsx` wird zur Buchtabelle. Das wirkt überall, wo `Table` benutzt wird.
- Kein Rahmen um die Tabelle, keine Zebrastreifen, kein getönter Kopf.
- Kopfzellen `text-small font-semibold text-text`, darunter eine kräftige Linie (`border-b-2 border-border-strong`).
- Zeilen mit Haarlinie (`border-t border-border`), Zellen `py-4`.
- Der Rahmen mit `overflow-x-auto`, `tabIndex={0}` und Fokusring bleibt, damit breite Tabellen auf dem Handy
  wischbar und per Tastatur erreichbar sind.

### 3.7 Verzeichnis (Welle 2)

`components/ui/Verzeichnis.tsx`, neu: eine Liste (`ul`) mit Haarlinie zwischen den Einträgen
(`divide-y divide-border`) und das Grundgerüst einer Zeile. Jede Zeile hat genau einen Link (den Namen). Er deckt
die ganze Zeile ab (`after:absolute after:inset-0`), damit die Zeile auf dem Handy leicht zu treffen ist. Der
Fokusring sitzt sichtbar um die Zeile. Fachliche Zeilen: `ProduktZeile` (5.1), `ApothekenZeile` (5.2).

### 3.8 Filterpillen (Welle 2)

Checkboxen der Filterleiste werden als Pillen dargestellt. Technisch bleibt jede Option eine echte Checkbox in
einem `label`. Die Pille ist 44 px hoch. Gewählt: Fläche `accent-subtle`, Rahmen `accent`, davor ein Haken „✓“, also
nicht nur über Farbe. Fokus über `has-focus-visible` am `label`. Die Klassen liefert eine Funktion
`auswahlPilleKlassen()` in `components/ui/`. Die Einstiegs-Pillen der Startseite sind Links und bleiben, wie sie
sind.

### 3.9 Zustände

- **Leer:** `components/ui/EmptyState.tsx` verliert den Kasten. Titel als Satz in Cormorant 500 (`text-h2`),
  darunter eine Zeile in Geist, was hier entsteht oder was zu tun ist, dazu höchstens eine Aktion. Ein Abschnitt,
  der leer nur wiederholen würde, was anderswo schon steht, entfällt stattdessen (4.3).
- **Laden:** Skelette in der Form des Inhalts statt `Spinner`. Die Skelette der Startseite
  (`components/story/Skelette.tsx`: Doppelseite, Stimmzettel, Katalog) werden wiederverwendet. Neu: Titelblatt,
  Verzeichnis, Tabelle, Formularblatt. Sie liegen in `components/layout/Skelette.tsx`.
- **Fehler:** neu `app/error.tsx`, eine Client Component nach der Next-Doku im Projekt
  (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`: Prop `retry`; im Plan gegen
  die installierte Version prüfen, die Versionstabelle nennt auch `unstable_retry`). Inhalt im Seitenkopf-Stil,
  Wortlaut in Abschnitt 7. Der Fehler wird in `useEffect` über `console.error` protokolliert. Die Startseite behält
  ihre eigenen Fehlersätze je Sektion.

### 3.10 Links und Hover

- Eine Funktion `textLinkKlassen()` in `components/ui/` für alle Textlinks: `text-accent underline
  underline-offset-2`, Hover `text-accent-hover`, Übergang `duration-fast`.
- Alle `hover:opacity-*` und eigenen `focus-visible:outline-*`-Ketten in den angefassten Dateien entfallen. Der
  globale Fokusring aus `globals.css` gilt.
- Datengrafiken in Tinte, nie in `accent` (Guideline 3): `CannabinoidBar`, das Netzdiagramm, Balken jeder Art.
  `TerpenChips` zeigen Rang 1 über Gewicht und Rahmen `border-strong` statt über `accent`.

### 3.11 Texte

- Jeder sichtbare Text der angefassten Seiten wird durchgesehen (`better-writing`): Ich statt „der Betreiber“, Du
  statt Sie, keine Geviertstriche, keine Gedankenstriche als Trenner, keine Umschrift („fuer“, „oeffentlich“).
  Bereichsstriche in Zahlenbereichen (`formatiereProzentSpanne`) bleiben, sie sind keine Trenner.
- **Begriffe, einheitlich auf allen Seiten:** Konten werden „freigeschaltet“ (Badge „Freigeschaltet“ bzw. „Noch
  nicht freigeschaltet“), Bewertungen werden „veröffentlicht“. Der Katalog spricht von „Produkten“, die Texte in Du
  und Ich von „Sorten“. Knöpfe beginnen mit einem Verb.
- Der verbindliche Wortlaut der neuen Sätze steht in Abschnitt 7.

## 4. Welle 1: die Kernseiten

### 4.1 `/reviews`: das Buch selbst

1. Seitenkopf „Bewertungen“ mit Satz (7).
2. `h2` „Der neueste Eintrag“, darunter die neueste veröffentlichte eigene Bewertung als **Doppelseite im Umfang
   `auszug`** (wie auf der Startseite: vier Noten ohne Wirkung, Netzdiagramm, Notiz in drei Zeilen, Link „Ganzen
   Eintrag lesen“).
3. `h2` „Alle Einträge“ als **Inhaltsverzeichnis** (`components/review/Inhaltsverzeichnis.tsx`), nur bei mehr als
   einer Bewertung. Je Eintrag eine Zeile: Handelsname in Cormorant 500, eine Punktlinie
   (`border-b border-dotted border-border-strong`, `aria-hidden`, füllt den Raum), die Gesamtnote in Mono
   („4,2“), darunter klein Datum und Charge. Die Zeile verlinkt auf `/produkte/[slug]#eintrag-[id]`. Das Verzeichnis
   enthält alle geladenen Einträge, auch den neuesten.
4. Leer: Satz „Das erste Kapitel wird gerade geschrieben.“ mit dem Weg zur Abstimmung (7).

`ReviewKarte` entfällt und mit ihr die doppelte `Notenzeile`. Die Seite lädt weiter über `redaktionelleReviews()`
(höchstens 20). Mehr als 20 Einträge zu blättern ist nicht Teil dieses Vorhabens.

### 4.2 `/umfragen`: hier spricht die Wand

1. Seitenkopf „Abstimmung“ mit Satz (7).
2. **Laufende Runde:** `h2` als Wand-Tag nach Phase („Schlag vor.“ in der Vorschlagsphase, „Stimm ab.“ in der
   Abstimmung), darunter der **Stimmzettel**: `UmfrageKarte` mit `darstellung="wand"`, alle vier Stimmzustände wie
   auf der Startseite. Keine Runde: Leerzustand (7).
3. **Vorschläge** (nur bei laufender Runde): `h2` als Wand-Tag „Eure Vorschläge.“ mit weicher Nebel-Textur dahinter
   (`Textur`, `aria-hidden`).
   - Freigeschaltet und Vorschlagsphase: das Vorschlagsformular auf einem **Blatt** mit `h3` „Dein Vorschlag“.
   - Nicht angemeldet und Vorschlagsphase: Satz und Knopf „Anmelden“ (Logik wie heute).
   - Angemeldet, aber nicht freigeschaltet, und Vorschlagsphase: neuer Satz (7), keine neue Logik.
   - Die Vorschläge als Liste: Handelsname in Cormorant 500 (Link), Status-Badge („Offen“ bzw. „Auf der
     Wahlliste“), darunter „Von {Name}, {Datum}“ klein und die Begründung in Geist, `max-w-[68ch]`. Handelsnamen nie
     in Sedgwick (Leitplanke 4).
4. `h2` „Alle Runden“ als **Chronik**: je Runde Titel in Cormorant 500, Zeitraum in Mono („12.09.2026 bis
   24.09.2026“ bzw. „seit 12.09.2026“), Phase als Badge, bei beendeten Runden „Gewonnen:“ mit verlinkten Namen.
   Haarlinien zwischen den Runden.

Die Variante `darstellung="karte"` von `UmfrageKarte` entfällt, wenn sie danach nirgends mehr benutzt wird
(Stand heute: nur `/umfragen`). Mit ihr entfällt der Stimmbalken in `accent`.

### 4.3 `/produkte/[slug]`: der vollständige Eintrag

Die Reihenfolge dreht sich, der Kern kommt nach vorn:

1. Rückweg „Alle Produkte“.
2. **Titelblatt** (`components/produkt/Titelblatt.tsx`, ersetzt `GlasHeader`), ohne Fläche, unten abgeschlossen
   von einer kräftigen Linie (`border-b-2 border-border-strong`). Links: Handelsname als `h1` in Cormorant 300
   `text-kapitel` (Umbruch statt Kürzung, `hyphens-auto`), Kultivar in Cormorant 500 kursiv `text-h3`, Badges für
   Typ, Form und Verfügbarkeit („Bei 3 Apotheken verfügbar“ bzw. „Derzeit nicht lieferbar“), THC- und CBD-Spanne in
   Mono `text-h3`. Rechts (ab `lg`, auf dem Handy darunter): Bezeichnung „Meine Note“ in `text-small`, die Note in
   Mono `text-kapitel` mit „/ 5“, darunter „Bewertet am {Datum}, Charge {Nr}“ in `text-small`. Ohne eigene
   Bewertung: „Noch nicht von mir getestet.“ und der Textlink „Zur Abstimmung“. Kein Herstellerbild, kein Glas,
   kein Reel. Drei Schriftgrade (`text-kapitel`, `text-h3`, `text-small`); die Badges haben als Bauteil ihre
   eigene feste Größe.
3. Beschreibung des Produkts (falls vorhanden) als Absatz, `max-w-[68ch]`.
4. `h2` „Meine Bewertungen“ (bei einer: „Meine Bewertung“): je eigene veröffentlichte Bewertung eine
   **Doppelseite im Umfang `voll`**, neueste zuerst. Entfällt ohne eigene Bewertung, weil das Titelblatt das schon
   sagt.
5. `h2` „Geschmacksprofil“ mit „Aus {n} Bewertungen“: das über alle veröffentlichten Bewertungen verdichtete
   Netzdiagramm (`verdichteGeschmacksMatrix`). Nur bei mindestens zwei Bewertungen, sonst zeigt die einzelne
   Doppelseite schon genau dieses Diagramm. `TerpenMap` entfällt.
6. `h2` „Stimmen der Community“ (`components/review/CommunityStimmen.tsx`): oben „Mittel aus {n} Bewertungen: {x}
   von 5“, darunter je Bewertung eine Zeile mit Gesamtnote in Mono, Datum, Charge und Notiz. Entfällt, wenn es keine
   Community-Bewertung gibt.
7. `h2` „Produktdaten“: links die **Faktenliste** (bisher `Faktenblock`), rechts „Wirkstoffspannen“
   (`CannabinoidBar` in Tinte, dazu die Herstellerangabe als Text) und „Terpenprofil“ (`TerpenChips`).
8. `h2` „Chargen“ und `h2` „Apothekenbestände“ als Buchtabellen, mit den heutigen Einleitungssätzen.
9. Schlusszeile wie heute (Packungsgrößen, Stand der Daten).

**Doppelseite** (`components/review/Doppelseite.tsx`), Props: `review`, `umfang: "auszug" | "voll"`,
`ueberschrift: "h2" | "h3"`, `story?: boolean`.

| | `auszug` (Startseite, `/reviews`) | `voll` (Produktseite) |
|---|---|---|
| Überschrift | Handelsname | „Bewertung vom {Datum}“ (der Name steht schon im Titelblatt) |
| Noten | vier, ohne Wirkung (Spec 1, Abschnitt 2) | alle fünf |
| Netzdiagramm | ja | ja |
| Restfeuchte | nein | Badge mit Einordnung und Hinweissatz |
| Notiz | drei Zeilen (`line-clamp-3`) | vollständig |
| Reel | nein | `InstagramEmbed`, nur mit eigener URL der Bewertung, keine Ersatz-URL aus der Umgebung |
| Link | „Ganzen Eintrag lesen“ auf `/produkte/[slug]#eintrag-[id]` | keiner |

- Das `article` trägt `id="eintrag-{id}"` (Sprungziel) und `aria-labelledby` auf eine eindeutige, aus der Id
  gebildete Überschrift. Heute ist die Id fest (`eintrag-name`) und wäre bei mehreren Doppelseiten doppelt.
- `story` setzt die Attribute, die `StoryBuehne` auf der Startseite braucht (`data-story="doppelseite"`,
  `data-zaehler`, `data-ziel`). Nur die Startseite setzt `story`. Die Bewegung der Startseite muss danach
  unverändert laufen.
- Das Netzdiagramm zieht von `components/story/` nach `components/review/Netzdiagramm.tsx` und wird von Startseite
  und Produktseite benutzt.

### 4.4 Daten

- `ladeStrainDetail()` (`lib/query/strains.ts`) wählt bei `reviews` zusätzlich `istRedaktionell` aus. Die Abfrage
  bleibt eine, das Datenmodell unverändert. `ReviewEintrag` bekommt das Feld.
- Neue reine Funktion `teileBewertungen(reviews)` in `lib/query/bewertung.ts`: liefert `eigene` und `community`
  (je neueste zuerst), `meineNote` (Gesamtnote der neuesten eigenen, sonst `null`) und `communityMittel` (Mittel der
  Gesamtnoten, sonst `null`). Getestet.
- Die bisherige „Gesamtnote“ über alle Bewertungen entfällt.

### 4.5 Dateien (Welle 1)

| Datei | Änderung |
|---|---|
| `components/layout/Kopf.tsx`, `Fuss.tsx` | Navigation (3.1) |
| `components/layout/NavLink.tsx` | **neu**, Client Component, mit `istAktiv()` |
| `components/layout/Seitenkopf.tsx`, `Skelette.tsx` | **neu** (3.2, 3.9) |
| `components/ui/Blatt.tsx`, `Faktenliste.tsx` | **neu** (3.4, 3.5) |
| `components/ui/Table.tsx`, `EmptyState.tsx`, `index.ts` | Buchtabelle, Leerzustand ohne Kasten, `textLinkKlassen()` |
| `app/error.tsx` | **neu** (3.9) |
| `app/reviews/page.tsx`, `app/umfragen/page.tsx`, `app/produkte/[slug]/page.tsx` | Umbau nach 4.1 bis 4.3 |
| `components/review/Doppelseite.tsx`, `Inhaltsverzeichnis.tsx`, `CommunityStimmen.tsx`, `Netzdiagramm.tsx` | **neu** bzw. umgezogen |
| `components/story/NeuesterEintrag.tsx` | nutzt `Doppelseite` mit `story` |
| `components/produkt/Titelblatt.tsx` | **neu**, ersetzt `GlasHeader.tsx` |
| `components/produkt/CannabinoidBar.tsx`, `TerpenChips.tsx`, `BestandTabelle.tsx` | Tinte statt `accent`, Link-Klasse |
| `components/umfrage/UmfrageKarte.tsx` | Begriffe (3.11), Variante `karte` entfällt falls ungenutzt |
| `lib/query/strains.ts`, `lib/query/bewertung.ts` | 4.4 |
| **entfallen** | `GlasHeader.tsx`, `TerpenMap.tsx`, `ReviewKarte.tsx`, `BewertungsListe.tsx` |

## 5. Welle 2: der Katalog

### 5.1 `/produkte`: Verzeichnis

1. Seitenkopf „Produkte“ mit Satz (7). Kein zweites `<main>` mehr (das Layout hat schon eins).
2. Ab `lg` zwei Spalten: links die Filter (Breite wie heute), rechts die Treffer.
3. **Filter** (`components/produkt/FilterLeiste.tsx`): Gruppen über Abstand getrennt, Legenden in Geist 600
   `text-small`, Optionen als Filterpillen (3.8). Schieberegler und Auswahlfeld bleiben. Unter `lg` ist die Leiste
   zugeklappt: ein Knopf „Filter einstellen“ mit der Zahl der aktiven Filter, `aria-expanded` und `aria-controls`,
   schaltet sie auf. Ab `lg` ist sie immer offen. Die Filterlogik (URL, `router.replace`) bleibt unverändert.
4. Über den Treffern: „{n} von {gesamt} Produkten“ und die aktiven Filter als entfernbare Pillen
   (`AktiveFilter`), dazu „Alle Filter zurücksetzen“.
5. **Treffer als Verzeichnis** (3.7) mit `ProduktZeile` (`components/produkt/ProduktZeile.tsx`, neu):

   | Spalte (ab `lg`) | Inhalt |
   |---|---|
   | 1, breit | Handelsname in Cormorant 500 `text-h2` (Link), Kultivar kursiv, darunter klein die bis zu drei dominanten Terpene; bei eigener Bewertung „Von mir getestet: {x} von 5“ mit der Zahl in Mono |
   | 2 | Typ und Darreichungsform |
   | 3 | THC- und CBD-Spanne in Mono |
   | 4 | Verfügbarkeit als Badge, darunter mit Freigabe der günstigste Preis pro Gramm, sonst „Preis nur für Fachkreise“ |

   Unter `lg` stapelt sich die Zeile in derselben Reihenfolge. Kein Cannabinoid-Balken in der Liste, er bleibt der
   Produktseite.
6. Seitennavigation wie heute („Vorige Seite“, „Seite {n} von {m}“, „Nächste Seite“), neu gestaltet.
7. Leer: Leerzustand mit Knopf „Alle Filter zurücksetzen“ (7). Laden: Verzeichnis-Skelett.

`ProduktCard` bleibt für die Katalog-Reihe der Startseite. Sie verliert den Deckkraft-Hover, zeigt „für“ statt
„fuer“ und bekommt denselben Vermerk „Von mir getestet“.

### 5.2 `/apotheken`

Seitenkopf „Apotheken“ mit Satz (7), darunter das Verzeichnis mit `ApothekenZeile`
(`components/apotheke/ApothekenZeile.tsx`, neu): Name in Cormorant 500 (Link), PLZ in Mono und Ort, Badge
„Versandapotheke“ bzw. „Vor Ort“, Lieferzeit, Rezeptart, „{n} Produkte“ in Mono. Leer und Laden wie 5.1.

### 5.3 `/apotheken/[slug]`

1. Rückweg „Alle Apotheken“.
2. Kleines Titelblatt: Name als `h1` (Cormorant 300 `text-kapitel`), Badge und Ort, kräftige Linie darunter.
3. `h2` „Angaben der Apotheke“ als Faktenliste (bisher `Stammdaten`).
4. `h2` „Gelistete Produkte“ als Buchtabelle. Ohne Freigabe steht darüber der HWG-Hinweis als Text mit Randlinie
   (`border-l-2 border-border-strong pl-4`), kein Kasten, Wortlaut in 7. Links in der Tabelle über
   `textLinkKlassen()`.

### 5.4 Daten

- `ladeStrainListe()` lädt je Sorte die neueste veröffentlichte eigene Bewertung mit (Relation, `take: 1`, nur die
  fünf Noten) und liefert `meineNote: number | null` in `StrainListenEintrag`. Keine zusätzliche Abfrage je Zeile.
  Im Plan prüfen, ob Prisma die Relation mit dem D1-Adapter als zweite Abfrage ausführt. Das wäre ein Sub-Request
  pro Seitenaufruf, bei Workers Free unkritisch, aber zu notieren.
- Die Umrechnung von der Bewertung zu `meineNote` ist eine reine, getestete Funktion.

### 5.5 Dateien (Welle 2)

| Datei | Änderung |
|---|---|
| `components/ui/Verzeichnis.tsx`, `auswahlPilleKlassen()` in `components/ui/` | **neu** (3.7, 3.8) |
| `components/produkt/ProduktZeile.tsx`, `components/apotheke/ApothekenZeile.tsx` | **neu** |
| `app/produkte/page.tsx`, `app/apotheken/page.tsx`, `app/apotheken/[slug]/page.tsx` | Umbau nach 5.1 bis 5.3 |
| `components/produkt/FilterLeiste.tsx`, `AktiveFilter.tsx`, `ProduktCard.tsx` | Pillen, Umschaltknopf, Vermerk, Kleinkram |
| `lib/query/strains.ts` | 5.4 |

## 6. Welle 3: Konto und Verwaltung

### 6.1 `/anmelden` und `/registrieren`

- Seitenkopf mit `schmal` (Spalte `max-w-120`), linksbündig, darunter das Formular auf einem **Blatt** in
  derselben Spalte.
- Kleinkram: `AnmeldeFormular` und `RegistrierFormular` bekommen die Hydrations-Sperre (`useHydriert`,
  `disabled={laeuft || !hydriert}`) und zeigen Fehler und Erfolg über `Meldung`. Die Texte in
  `components/auth/fehlertexte.ts` sagen, wie man den Fehler behebt (`better-writing`).
- Unter dem Blatt der Wechsel zur jeweils anderen Seite als Textlink.

### 6.2 `/zugang`

- Kein zweites `<main>`. Seitenkopf-Stil in schmaler Spalte, Formular auf einem Blatt, Feld und Knopf aus den
  Primitives (`Field`, `Input`, `Button` als Pille). Das Formular bleibt ein nativer POST auf `/api/zugang` und
  funktioniert ohne JavaScript.
- Seitentitel in `metadata` „Zugang“ (heute „Zugang - cn-medcan“). Wortlaut in 7.

### 6.3 `/mitglied`

- Seitenkopf „Mein Konto“, darunter die E-Mail.
- `h2` „Status“ als Faktenliste: Status („Freigeschaltet“ bzw. „Noch nicht freigeschaltet“ als Badge) und Rolle,
  darunter ein Satz je Zustand (7).
- **Der falsche Satz fällt weg:** Heute verspricht die Seite Freigeschalteten „Sicht auf die Preisangaben“. Preise
  hängen aber am Fachkreis-Zugang (`istFachkreis()`), nicht an der Freischaltung. Der HWG-Preishinweis auf dieser
  Seite entfällt ebenfalls, er steht dort, wo Preise stehen (5.3).
- Für den Betreiber: Textlink „Zur Verwaltung“ (heute eine eigene Karte).
- `h2` „Angaben“ mit dem Profilformular auf einem Blatt. `ProfilFormular` bekommt Hydrations-Sperre und `Meldung`.
- „Abmelden“ als zurückhaltender Knopf (`ghost`) im Seitenkopf.

### 6.4 `/admin`: die Werkbank

- Seitenkopf „Verwaltung“ mit Satz (7), darunter drei Sprungmarken als Pillen (44 px): „Runde“, „Ergebnisse“,
  „Mitglieder“ auf die Abschnitts-Ids.
- Drei Abschnitte mit `h2` in Cormorant 500. Formulare auf Blättern, Kandidaten- und Mitgliedertabellen als
  Buchtabellen, dichter Abstand (16 px innerhalb, 32 px zwischen Gruppen).
- Keine Änderung an Aktionen, Phasenlogik, Rückfragen oder `useAktion`. Auch `MitgliedAktionen` speichert die
  Rolle weiter beim Umschalten (Entscheidung aus Block B, Schritt 7).
- Begriffe nach 3.11 („freischalten“).

### 6.5 `not-found`

Seitenkopf mit Titel und Satz (7), keine „404“-Zeile. Knöpfe „Zur Startseite“ (`primary`) und „Zu den Produkten“
(`secondary`).

### 6.6 Dateien (Welle 3)

| Datei | Änderung |
|---|---|
| `app/anmelden/page.tsx`, `app/registrieren/page.tsx`, `app/zugang/page.tsx`, `app/mitglied/page.tsx`, `app/admin/page.tsx`, `app/not-found.tsx` | Umbau nach 6.1 bis 6.5 |
| `components/auth/AnmeldeFormular.tsx`, `RegistrierFormular.tsx`, `ProfilFormular.tsx`, `fehlertexte.ts`, `AbmeldeButton.tsx` | Hydrations-Sperre, `Meldung`, Texte |
| `components/admin/*` | `Card` durch Abstand, Blatt und Buchtabelle ersetzen, Begriffe |
| `components/ui/Card.tsx`, `Spinner.tsx` | entfallen, wenn ungenutzt (3.4) |

## 7. Wortlaut

Verbindlich für die neuen und geänderten Sätze. Zahlen und Namen in `{}` kommen aus den Daten, Mehrzahl über
vollständige Sätze je Fall, nie aus Bruchstücken zusammengesetzt.

| Ort | Text |
|---|---|
| Navigation | „Bewertungen“, „Abstimmung“, „Produkte“, „Apotheken“, „Mein Konto“ |
| `/reviews` Satz | „Jede Sorte teste ich nach demselben Schema und schreibe dazu, welche Charge es war.“ |
| `/reviews` Abschnitte | „Der neueste Eintrag“, „Alle Einträge“ |
| `/reviews` leer | „Das erste Kapitel wird gerade geschrieben.“ / „Welche Sorte ich zuerst teste, entscheidet die Abstimmung.“ / Knopf „Zur Abstimmung“ |
| `/umfragen` Satz | „Ihr schlagt Sorten vor und wählt. Was gewinnt, teste ich als Nächstes.“ |
| `/umfragen` Wand | „Schlag vor.“ (Vorschlagsphase), „Stimm ab.“ (Abstimmung), „Eure Vorschläge.“ |
| `/umfragen` keine Runde | „Gerade läuft keine Runde.“ / „Die nächste steht hier, sobald sie eröffnet ist.“ |
| `/umfragen` Formular | `h3` „Dein Vorschlag“ |
| `/umfragen` nicht angemeldet | „Vorschlagen kannst du, sobald du angemeldet und freigeschaltet bist.“ / Knopf „Anmelden“ |
| `/umfragen` nicht freigeschaltet | „Sobald ich dein Konto freischalte, kannst du hier vorschlagen.“ |
| `/umfragen` keine Vorschläge | „Noch kein Vorschlag in dieser Runde.“ |
| `/umfragen` keine Runden | „Noch keine Runden.“ / „Hier steht jede Runde, sobald die erste eröffnet ist.“ |
| Produktseite Titelblatt | „Meine Note“, „Bewertet am {Datum}, Charge {Nr}“ (ohne Charge: „Bewertet am {Datum}“); ohne Bewertung „Noch nicht von mir getestet.“ / Textlink „Zur Abstimmung“ |
| Produktseite Abschnitte | „Meine Bewertung“ bzw. „Meine Bewertungen“, „Geschmacksprofil“ („Aus {n} Bewertungen“), „Stimmen der Community“ („Mittel aus {n} Bewertungen: {x} von 5“; bei einer: „Aus einer Bewertung: {x} von 5“), „Produktdaten“, „Chargen“, „Apothekenbestände“ |
| Doppelseite `voll` | Überschrift „Bewertung vom {Datum}“ |
| `/produkte` Satz | „Alle Produkte hier sind verschreibungspflichtig und nur mit Rezept in der Apotheke erhältlich.“ |
| `/produkte` Filterknopf | „Filter einstellen“ plus Zahl der aktiven Filter |
| `/produkte` leer | „Kein Produkt passt zu diesen Filtern.“ / „Nimm einen Filter heraus oder setze alle zurück.“ / Knopf „Alle Filter zurücksetzen“ |
| Katalog Vermerk | „Von mir getestet: {x} von 5“ |
| Katalog Preis | „Preis nur für Fachkreise“ |
| `/apotheken` Satz | „Diese Apotheken melden ihre Bestände. Lieferzeit und Rezeptart geben sie selbst an.“ |
| `/apotheken` leer | „Noch keine Apotheke eingetragen.“ / „Sobald eine Apotheke ihre Bestände meldet, steht sie hier.“ |
| `/apotheken/[slug]` HWG | „Preise verschreibungspflichtiger Arzneimittel zeige ich nach § 10 HWG nur Fachkreisen.“ |
| `/anmelden` Satz | „Mit deinem Konto schlägst du Sorten vor und stimmst ab. Freischalten muss ich dich einmal von Hand.“ |
| `/registrieren` Satz | „Nach der Registrierung schalte ich dein Konto von Hand frei. Bis dahin kannst du alles lesen.“ |
| `/zugang` | Titel „Noch geschlossen.“ / „Das Grüne Buch ist noch nicht öffentlich. Mit dem Zugangspasswort kommst du hinein.“ / Knopf „Seite öffnen“ / Fehler „Das Passwort stimmt nicht. Versuch es noch einmal.“ |
| `/mitglied` freigeschaltet | „Du bist freigeschaltet und kannst vorschlagen und abstimmen.“ |
| `/mitglied` nicht freigeschaltet | „Ich schalte Konten von Hand frei. Bis dahin kannst du alles lesen.“ |
| `/admin` Satz | „Runden eröffnen, Ergebnisse verknüpfen, Mitglieder freischalten.“ |
| `not-found` | Titel „Diese Seite steht nicht im Buch.“ / „Vielleicht wurde der Eintrag entfernt oder die Adresse hat sich geändert.“ |
| `app/error.tsx` | Titel „Diese Seite lässt sich gerade nicht laden.“ / „Versuch es gleich noch einmal. Klappt es nicht, lade die Seite in ein paar Minuten neu.“ / Knopf „Erneut versuchen“ / Textlink „Zur Startseite“ |

Texte, die hier nicht stehen, bleiben inhaltlich, werden aber nach 3.11 bereinigt.

## 8. Technik und Budgets

- **JavaScript:** Kein GSAP und kein Lenis außerhalb der Startseite. Neu im Client sind nur `NavLink`, der
  Umschaltknopf in der bestehenden Client-Komponente `FilterLeiste` und die von Next verlangte Fehlerseite.
- **Abfragen:** keine zusätzliche Abfrage je Seite außer der möglichen Relationsabfrage aus 5.4. Alle Seiten
  bleiben `force-dynamic`.
- **Serverkomponenten:** Alle neuen Bausteine außer `NavLink` und `app/error.tsx` sind Server Components.
- **Regeln:** `ui-design-engine` gilt vollständig (8-px-Raster, nur semantische Tokens, keine `dark:`-Varianten,
  Pillen und eckige Flächen, Touch-Ziele ab 44 px, Dekoration `aria-hidden`).
- **Kein neues Paket.**

## 9. Prüfung (je Welle)

1. `npm test`, `npm run typecheck`, `npx eslint .`, `npm run build`, `npm run farben` grün. Neue reine Funktionen
   (`istAktiv`, `teileBewertungen`, die Umrechnung zu `meineNote`) und neue Bausteine (Seitenkopf, Doppelseite in
   beiden Umfängen, Buchtabelle, Filterpille, Faktenliste) haben Tests, geschrieben nach RED→GREEN.
2. Im ausgelieferten HTML der angefassten Seiten kein Geviertstrich und kein Gedankenstrich mit Leerzeichen davor
   und danach (Abruf mit Gate-Cookie). Keine Umschrift („fuer“, „oeffentlich“) in sichtbaren Texten.
3. Genau ein `h1` je Seite, keine Sprünge in der Überschriftenhierarchie. Ids eindeutig (Doppelseiten).
4. Ohne JavaScript alle Inhalte lesbar. Ausnahme: Die Filter in `/produkte` brauchen JavaScript wie heute.
5. Tastatur: alle Bedienelemente erreichbar, Fokus sichtbar, `aria-current` im Kopf richtig, Filterknopf mit
   `aria-expanded`.
6. 390 px und 1440 px ohne seitliches Überlaufen der Seite (Tabellen wischen in ihrem Rahmen), Navigationsleiste
   wischbar, der nächste Punkt schaut an.
7. Hell und dunkel im Browser gesehen.
8. 200 % Textzoom ohne abgeschnittenen Inhalt.
9. Leerzustände gesehen: lokal über einen Filter ohne Treffer und eine Sorte ohne Bewertung, live über die leere
   Datenbank.
10. Startseite unverändert: Doppelseite schlägt auf, Zähler laufen, keine Konsolenfehler (Welle 1, wegen des Umzugs
    der Doppelseite).
11. Leitplanken 1 bis 7 gegen alle neuen Texte durchgesehen.
12. Review mit `better-interface` (samt `better-layout`, `better-typography`, `better-accessibility`, `better-ui`,
    `better-writing`) und `web-design-guidelines`. Befunde behoben oder begründet offen. Danach startet der Nutzer
    `/interface-review`.
13. Nach dem Go des Nutzers: Push nach `main` (= Live-Gang über Workers Builds), dann einmal live prüfen, kein
    Polling.

Browser-Prüfungen brauchen die verbundene Chrome-Erweiterung. Ist sie nicht verbunden, werden die Punkte als „nicht
verifiziert“ gemeldet.

## 10. Reihenfolge

1. Plan für Welle 1 (`superpowers:writing-plans`), Ausführungsart wählt der Nutzer.
2. Welle 1 umsetzen, prüfen (9), Go, live, HANDOFF.
3. Plan für Welle 2, umsetzen, prüfen, Go, live, HANDOFF.
4. Plan für Welle 3, umsetzen, prüfen, Go, live, HANDOFF.

Jede Welle ist für sich lauffähig. Gemeinsame Bausteine, die eine spätere Welle braucht, entstehen in der Welle, in
der sie zuerst gebraucht werden (3). Die Änderungen an `Table` und `EmptyState` wirken schon mit Welle 1 auf allen
Seiten. Das ist gewollt.

## 11. Nicht im Umfang

- Formular für eigene Bewertungen und deren Veröffentlichung in `/admin` (nächstes Vorhaben).
- Preise an die Freischaltung binden, `FACHKREIS_PASSWORD` ausbauen.
- `vorschlagBisAm` setzbar machen.
- Eigene Vorschläge und Stimmen auf `/mitglied`.
- Blättern in `/reviews` über 20 Einträge hinaus.
- Mailversand, eigene Domain, Instagram-Einbindung über das Reel hinaus.
- GSAP, Lenis und das Feldbuch-Raster auf Unterseiten.
- Änderungen an Datenmodell, Server Actions, Zugriffskontrolle, Filter- und Preislogik.

## 12. Eingesetzte Skills

Entwurf: `superpowers:brainstorming`, `ui-design-engine`, `design-taste-frontend` (Design Read, Regler; Katalog,
Tabellen und Admin außerhalb seines Geltungsbereichs), `better-layout`, `better-writing`. Beim Umsetzen je Task:
`frontend-design`, `better-typography`, `better-accessibility`, `better-ui`, `emil-design-eng`, `react-best-practices`;
für die Abfragen `prisma-client-api` und `edge-stack-master`; zum Abschluss jeder Welle `better-interface`,
`web-design-guidelines` und `/interface-review` (startet der Nutzer).

## 13. Präzisierungen gegenüber dem Chat

Beim Schreiben festgelegt, im Chat noch nicht genannt:

1. Der Katalog-Leerzustand sagt „Kein Produkt“ statt „Keine Sorte“: Die Seite heißt „Produkte“ (einheitliche
   Begriffe, 3.11).
2. Das Geschmacksprofil der Produktseite erscheint erst ab zwei Bewertungen. Bei einer zeigt die Doppelseite
   dasselbe Diagramm.
3. „Meine Bewertungen“ und „Stimmen der Community“ entfallen, wenn sie leer wären, statt einen Leerzustand zu
   zeigen. Das Titelblatt sagt schon „Noch nicht von mir getestet.“, und Community-Bewertungen lassen sich heute
   nirgends schreiben.
4. Konten heißen überall „freigeschaltet“ (heute gemischt: „freigegeben“, „Freigabe ausstehend“, „Freigabe steht
   aus“).
5. Das Reel erscheint nur, wenn die Bewertung eine eigene URL trägt, ohne Ersatz-URL aus der Umgebung.
6. Die Katalog-Reihe der Startseite (`ProduktCard`) zeigt den Vermerk „Von mir getestet“ ebenfalls.
7. „Ganzen Eintrag lesen“ springt auf den Eintrag (`#eintrag-{id}`), nicht nur an den Anfang der Produktseite.
8. `/umfragen`: Wer angemeldet, aber noch nicht freigeschaltet ist, bekommt in der Vorschlagsphase einen Satz statt
   nichts.

## 14. Offene Punkte

- Instagram-Handle „Grünes Buch“ prüfen (Nutzer, aus Teilprojekt 1).
- 4 npm-audit-Meldungen „high“ in bestehenden Abhängigkeiten (Nutzer entscheidet).
- Im Plan zu klären: `retry` oder `unstable_retry` in `app/error.tsx` (installierte Next-Version); ob die Relation
  aus 5.4 eine zweite D1-Abfrage erzeugt.
