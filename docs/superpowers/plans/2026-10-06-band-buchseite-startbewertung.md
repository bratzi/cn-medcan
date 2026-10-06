# Plan 2026-10-06: Terpen-Band, rechte Buchseite, Bewertung auf der Startseite

Drei unabhängige Stränge aus Nutzerwünschen vom 2026-10-06. Je Strang ein Worktree, parallele
Implementer. Kein eigener Spec: die Nutzerzitate in den Aufgaben sind die Vorgabe.

## Global Constraints

- Next.js 16 App Router auf Cloudflare Workers (OpenNext). Vor Next-API-Nutzung
  `node_modules/next/dist/docs/` lesen (AGENTS.md).
- Kein `next dev`, `next build`, `next preview` lokal. Prüfen nur per `npm test`, `npx tsc --noEmit -p .`,
  `npx eslint <geänderte Dateien>`. Die Live-Prüfung macht der Controller nach dem Push.
- Design-Regelwerk: Skill `ui-design-engine` (8-px-Raster, Tokens aus `app/globals.css`, Buch und
  Handschrift). Vor UI-Arbeit laden.
- Zeilenenden je Datei erhalten: `git ls-files --eol <datei>` zeigt `i/crlf` oder `i/lf`. Nie eine
  CRLF-Datei als LF zurückschreiben (Python: `open(..., newline="")`).
- Texte in `lib/i18n/de.ts` und `lib/i18n/en.ts`, keine Literale in Komponenten
  (`tests/i18n-literale.test.ts`).
- Kommentare und Commits auf Deutsch in Prosa, im Stil der Umgebung. Commit-Ende:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Bewegung nur bei `prefers-reduced-motion: no-preference`, Sparmodus `[data-sparmodus]` beachten.
- Kein Push, kein Merge. Nur Commits im eigenen Worktree-Branch.

## Task 1: Terpen-Band der Startseite

Dateien: `components/story/TerpenBand.tsx`, `app/globals.css` (Abschnitt „Terpen-Band“, ab
Zeile ~1912), `tests/terpen-register.test.ts`. `TerpenBandKopie.tsx` klont die Einträge und muss
nur angepasst werden, wenn nötig.

Nutzer: „auf der Startseite das Band soll stehen bleiben, wenn ich mit der Maus drüber laufe.
Außerdem sind mir da zu viele Infos drauf, mach einfach das Icon und den Namen hin und wenn ich
drüber hover, soll das Band stehen bleiben und diese zusätzlichen Infos, die aktuell alle drauf
sind, dann einfach zusätzlich anzeigen. Den Namen ein bisschen größer, bisschen mehr Abstand,
designtechnisch schön gestalten, so dass das Band so breit bleibt wie es aktuell ist.“

Befund des Controllers (Ursache der fehlenden Pause): die Laufregel
`:root:not([data-sparmodus]) .terpen-band-spur:not(:has(> [aria-hidden]:empty))` hat
Spezifität (0,5,0) und setzt per `animation`-Kurzschrift `animation-play-state` auf `running`.
Die Pause-Regel `.terpen-band:hover .terpen-band-spur` hat nur (0,3,0) und verliert. Fix: die
Pause trägt denselben Selektorkopf, z. B.
`:root:not([data-sparmodus]) .terpen-band:is(:hover, :focus-within) .terpen-band-spur:not(:has(> [aria-hidden]:empty)) { animation-play-state: paused; }`.

Vorgaben:
1. Pause beim Überfahren und bei Tastaturfokus, siehe Befund.
2. Ruhezustand ab `sm`: je Eintrag nur Icon und Name. Name größer als heute (`text-body`), in
   `font-buch`, Vorschlag `text-h2`; großzügigerer Abstand zwischen Icon und Name und zwischen
   den Einträgen, im 8-px-Raster.
3. Beim Überfahren des Bands (Band-Gruppe, z. B. `group/band` an der section) erscheinen die
   heutigen Zusatzinfos (Sortenzahl, Duft, drei Noten mit Farbbalken) zusätzlich, eingeblendet
   per Deckkraft (und optional kleiner Verschiebung), das überfahrene Terpen voll lesbar.
   Kein Layoutsprung in der Breite: die Breite eines Eintrags bleibt in Ruhe und beim Überfahren
   gleich, sonst ruckt der Lauf und `--band-kachel` stimmt nicht mehr.
4. Die Bandhöhe ab `sm` bleibt `h-48` (192 px), das Skelett (falls vorhanden) gleich. Alles muss
   in 192 px passen, auch mit eingeblendeten Infos.
5. Mobil (unter `sm`) bleibt das schmale Icon-Band wie heute.
6. Tests in `tests/terpen-register.test.ts`: Pause-Selektor wie oben; Name in `font-buch` und
   größer; Infos in Ruhe `opacity-0`, beim Überfahren sichtbar. Bestehende Band-Tests an die neue
   Absicht anpassen (der Test „Infos im Band, ausgegraut“ beschreibt den alten Stand).

## Task 2: Rechte Buchseite neu gestalten (Terpenbewertung und Beschaffenheit)

Dateien: `components/review/BuchDoppelseite.tsx`, `components/review/BuchReiter.tsx`,
`components/review/BeschaffenheitsLeiste.tsx`, ggf. `components/review/AromaKarte.tsx` (nur der
`kompakt`-Zweig), `app/globals.css`, zugehörige Tests (`tests/buch-*.test.ts`,
`tests/aroma-kompakt.test.ts`).

Nutzer: „Die Tabs Terpenbewertung und Beschaffenheit sind so ein hässlicher schwarzer Kasten,
eingebettet im Buch. Das geht sicherlich schöner. Bitte Award-winning Skill nutzen, um das Buch
auf der rechten Seite vor allem im Hinblick auf die Terpenbewertung und Beschaffenheit neu zu
designen.“

Vorgaben:
1. Skill `build-awwwards-quality-sites` laden und als Gestaltungsleitlinie nutzen, zusammen mit
   `ui-design-engine` (Marke „Grünes Buch“, `docs/brand/gruenes-buch.md`). Ergebnis muss zum Buch
   passen: Papier, Tinte, Handschrift, kein dunkler Fremdkörper.
2. Die Einlage (heute eine dunkle Fläche mit Rand, bis an den rechten und unteren Rand) wird zu
   einem Teil der Buchseite: z. B. Papierton der Seite statt Kasten, Reiter als Lesezeichen- oder
   Registerreiter am Seitenrand, Haarlinien statt Kastenrand. Hell und dunkel beide stimmig.
3. Inhalt bleibt: Reiter „Terpenbewertung“ (Aroma-Karte, Karte/Netz-Schalter), „Beschaffenheit“,
   ggf. „Reel“. Bedienung (Radiogroup, Tastatur) und Barrierefreiheit bleiben erhalten.
4. Kein Überlauf: ab `lg` bleibt die rechte Seite höhenbestimmend, bei 1143 px und 1418 px darf
   nichts über den Rahmen laufen; mobil unter 640 px kein waagerechter Scrollbalken.
5. Die Golden-Master- und Bausteintests anpassen, wo sie die alte Optik festschreiben; neue
   Tests für die neue Struktur.

## Task 3: Bewertungsbereich der Startseite nach aktuellem Bewertungsschema

Dateien: `components/story/AromaSektion.tsx`, `components/review/NoteUndErkundung.tsx`, ggf.
`components/review/SortenKopf.tsx`; Referenz: `components/review/BewertungsFormular.tsx` und
`app/[lang]/blueten/[slug]/page.tsx` (Abschnitt `#bewerten`). Tests dazu.

Nutzer: „Auf der Startseite muss die Gesamtnote unter den Strain, den wir bewerten. Quasi über
Overall, aber unter Apples & Bananas. So wie es in der Bewertung auch angegeben ist, eines jeden
einzelnen Strains. Bitte bau nochmal unser aktuelles Bewertungsschema auf die Startseite ein und
baue die Startseite demnach um. Nur den Bewertungssektor.“

Vorgaben:
1. Der Bewertungssektor der Startseite folgt Aufbau und Reihenfolge der Bewertung auf der
   Blütenseite (`BewertungsFormular` im Modus Erkundung/Example): Sortenkopf mit Strainname
   (heute „Apples & Bananas“), darunter die Gesamtnote (Blätter, `BlattNote`), darunter
   „Overall“, dann „Terpz“ usw. Heute steht die Gesamtnote über allem.
2. Möglichst dieselben Bausteine wiederverwenden wie die Blütenseite, keine zweite Fassung des
   Schemas. Startseite bleibt Vorführung: nichts wird gespeichert (`modus="example"`).
3. Nur der Bewertungssektor ändert sich, der Rest der Startseite nicht.
4. CPU-Grenze 10 ms je Request (Workers Free): keine zusätzlichen Datenabfragen, wenn vermeidbar.
5. Tests: Reihenfolge Strainname → Gesamtnote → Overall im gerenderten Markup.
