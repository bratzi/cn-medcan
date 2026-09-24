# Makeover „Grünes Buch“, Teilprojekt 3: Marke und Medien

Stand 2026-09-24 (Session 11). Löst in TP1 (`2026-09-23-makeover-gruenes-buch-design.md`) die Abschnitte 3 (Buch und
Wand), 4.2 (Wand-Schrift), 4.3 (Logo) und 4.5 (Bildbehandlung) ab, dazu in TP2
(`2026-09-24-makeover-teilprojekt-2-design.md`) alles, was die Wand betrifft (3.3 Zeile „Wand-Überschrift“, 4.2).
Alles andere aus TP1 und TP2 gilt weiter.

## 1. Ausgangslage und Ziel

Der Nutzer (Session 9, eingetaktet): Das Logo gefällt ihm nicht. Bilder und Video sind „zu laienhaft eingebaut“ und
sollen hochprofessionell, mit aktueller Technik und „awwwards-fähig“ eingebaut werden. „Die Bilder einfach negativ
machen ist der falsche Ansatz“ (gemeint ist der Dunkelmodus mit `invert(1)` plus `screen`). Im Storytelling sollen
freigestellte Motive stehen. Logo und Akzente sollen die Google-Schrift „Inspiration“ nutzen. Das gilt für das ganze
Projekt.

**Ziel:** Logo und Akzente wirken wie aus einem Guss. Die Motive liegen freigestellt und in Farbe auf der Buchseite
und funktionieren hell wie dunkel ohne Negativeffekt. Die Bewegung der Medien ist erzählerisch begründet und bleibt
in den Budgets von Workers Free.

**Design Read:** Marken- und Medien-Überarbeitung einer redaktionellen Community-Seite für Cannabis-Patient:innen in
Deutschland, Sprache „Buch mit Handschrift am Rand“, Tailwind v4 mit eigenen Tokens, GSAP auf der Startseite,
browser-native Bewegung überall sonst. **Regler:** Varianz 8, Bewegung 7, Dichte 3 (wie TP1).

## 2. Getroffene Entscheidungen

„Nutzer“ = im Brainstorming vom Nutzer gewählt. „Claude“ = von Claude festgelegt, nachdem der Nutzer die
Einzelfreigaben abgelehnt hat („frag net alle 3 min“); beim Lesen der Spec korrigierbar.

| Thema | Entscheidung | Verworfen | Von |
|---|---|---|---|
| Konzept | **Buch und Handschrift:** Graffiti, Drips und Sprühnebel entfallen ganz; die Community schreibt wie von Hand ins Buch | Inspiration ersetzt Sedgwick, Wand bleibt (Drips, Nebel); Inspiration nur für Logo und Akzente, Sedgwick bleibt (vier Familien, zwei Handschriften) | Nutzer |
| Farbe der Handschrift | **Kopierstift-Violett**, die bisherigen Werte von Sprühviolett | Königsblau (neues Token, zweite kräftige Farbe neben Grün); Graphit (Community tritt kaum hervor) | Nutzer |
| Bildquelle | **Pexels plus lokales Freistellen**, 0 € | eigene Fotos (später ohne Umbau tauschbar); generierte Serie über die Ideogram-API (0,03 bis 0,09 $ pro Bild, bricht „alles kostenlos“) | Nutzer |
| Bildfarbe | **Farbe, einheitlich gegradet** | Graustufen mit Farbe als Moment; Graustufen durchgehend (nah am heutigen Eindruck) | Nutzer |
| Technik | **browser-nativ plus ein WebGL-Effekt** | nur browser-nativ; nur Bilder tauschen | Nutzer |
| Logoform | **Wortmarke plus Unterzeile plus Signet** | nur Wortmarke (kein quadratisches Zeichen für Favicon und Instagram); Handschrift und Druck gemischt in einem Wort | Nutzer |
| Logofarbe | **Kopierstift-Violett**: Handschrift ist immer violett | Blattgrün (zweite Ausnahme von „Grün nur Bedienung“); Tinte-Schwarz | Nutzer |
| Komposition | **A „Randnotizen“**, dazu im Auftakt ein Flat-Lay aus zwei bis drei Motiven um den Titel | B Herbarium (kippt ins Bastelalbum, trägt im Katalog nicht); C Schreibtisch von oben (braucht die meisten, genau abgestimmten Motive, sprengt das Medienbudget) | Nutzer |
| Zuschnitt | **eine Spec, drei Wellen**, vor TP2 Welle 2 | alles in einem Plan | Nutzer |
| WebGL-Umsetzung | **eigener WebGL2-Baustein ohne Bibliothek** (rund 4 KB gz) | OGL (neue Abhängigkeit, größer); Three.js (zu schwer für einen Effekt) | Claude |
| Freistell-Werkzeug | **`rembg` (MIT) mit Modell `isnet-general-use` oder `u2net` (Apache-2.0)**, lokal in Python | `qwen-edit` (erzeugt laut Skill beim Hintergrund Halos, kostet über RunPod); remove.bg (gratis nur Vorschaugröße); BRIA RMBG (nicht kommerzielle Lizenz) | Claude |
| Schatten | **in der Pipeline gebacken** (weicher Kontaktschatten im Alphakanal) | CSS `drop-shadow` (Malkosten bei jeder Bewegung) | Claude |
| Auftakt-Titel | **die handschriftliche Wortmarke** statt „GRÜNES BUCH“ in Cormorant-Versalien und Grün; die Grün-Ausnahme für den Titel entfällt | Cormorant-Titel bleibt, Logo daneben (der Name stünde zweimal verschieden im ersten Bild) | Claude |
| Tiefenebenen | **CSS scroll-gekoppelt** (`animation-timeline`) auf allen Seiten | GSAP (nur auf der Startseite möglich, kostet JS) | Claude |
| Video-Grading | **per CSS-Filter** | Neukodierung (bräuchte ffmpeg in der Pipeline) | Claude |
| Handschrift auf Unterseiten | **nur `/umfragen`** (wie TP2: die Community spricht nur dort) | auch `/reviews` (Community-Stimmen) | Claude |

## 3. Konzept: Buch und Handschrift

- **Gedruckt spricht der Betreiber:** Messwerte, Reviews, Katalog, Handelsnamen, Rechtshinweise, Bedienung. Schriften
  Cormorant Garamond, Geist, Geist Mono wie bisher.
- **Von Hand geschrieben wird, was mitgeschrieben wird:** die Community (Stimmen, Vorschläge, Zähler, „Wähl mit.“,
  „Ihr schlagt vor.“) und der Titel auf dem Umschlag (Logo). Schrift Inspiration, Farbe `kopierstift`.
- **Das Buch führt deutlich.** Handschrift nur in kurzen Zeilen, höchstens etwa sechs Wörter, nie als Absatz.
- **Randnotiz** ist die Form der Handschrift: auf breiten Ansichten in einer Randspalte neben dem gedruckten Text,
  auf dem Handy direkt zwischen den Absätzen.
- **Motive liegen auf der Seite** wie hineingelegte Dinge: freigestellt, in Farbe, mit weichem Kontaktschatten, in
  zwei Tiefenebenen (vor und hinter der Schrift). Daneben gibt es **Tafeln**: rechteckige Farbfotos, eckig wie eine
  eingeklebte Bildtafel, für Motive, die sich nicht freistellen lassen (Trichom-Makro, Video).
- Die Geschichte des Kopierstifts trägt den WebGL-Effekt: Der Kopierstift schreibt grauviolett und läuft kräftig
  violett aus, sobald er feucht wird (Anilinfarbstoff). So „entwickelt“ sich ein Motiv aus einem Tintenfleck (Abschnitt 9).

**Leitplanken** (Brand Guideline 9) bleiben, mit einer Änderung: Leitplanke 4 heißt **„Handelsnamen nie in
Handschrift.“** Leitplanken 2, 3 und 5 gelten für jedes neue Motiv.

## 4. Schrift

| Rolle | Schrift | Schnitte | Einsatz |
|---|---|---|---|
| Buch-Display | Cormorant Garamond | 300, 300 italic, 500 | unverändert |
| Text und Bedienung | Geist | variabel | unverändert |
| Messwerte | Geist Mono | variabel | unverändert |
| **Handschrift** | **Inspiration** | **400** (einziger Schnitt) | Logo, Randnotizen, „Wähl mit.“, Community-Überschriften auf `/umfragen` |

- Einbindung über `next/font/google` (`Inspiration`, Subset `latin`, `display: swap`, `adjustFontFallback`),
  Variable `--font-inspiration`. Sedgwick Ave Display wird entfernt.
- Tokens: `font-hand` ersetzt `font-wand`. `text-notiz` ersetzt `text-tag`: `clamp(2rem, 1.25rem + 3vw, 4.5rem)`,
  Zeilenhöhe 1.2 (Schreibschrift mit langen Ober- und Unterlängen). Neu `text-umschlag` für die Wortmarke im Auftakt:
  `clamp(5rem, 1rem + 17vw, 20rem)`, Zeilenhöhe 0.95, zweizeilig. `text-marke` für den Kopf: `2.5rem`, Zeilenhöhe 1.
- **Mindestgröße 32 px.** Beim Umsetzen mit `better-typography` am gerenderten Text prüfen; liest sich „ü“ oder das
  „B“ bei 32 px nicht, wird die Grenze angehoben, nicht die Schrift verkleinert.
- Keine Versalien (Schreibschrift in Großbuchstaben ist unlesbar), keine Laufweite, keine synthetische Fett- oder
  Kursivschrift (`font-synthesis: none` auf `font-hand`, es gibt nur 400). Texte in natürlicher Schreibung.
- Nie für Handelsnamen, Daten, Zahlen, Formulare, Fließtext, Rechtshinweise. Zahlen neben einer Randnotiz stehen
  gedruckt in Geist Mono.
- Handschriftliche Zeichen entstehen nur aus Glyphen der Schrift; keine gezeichneten Unterstreichungen oder Kringel
  (`design-taste-frontend` und `build-awwwards-quality-sites` verbieten selbst gezeichnete SVG-Illustrationen).

## 5. Farbe

- Primitive `spray-400/500` heißen `violett-400/500`, **Werte unverändert** (0.72 0.15 305 / 0.52 0.20 305).
- Rolle `spray` heißt **`kopierstift`**, `spray-fg` heißt `kopierstift-fg`; hell `violett-500`, dunkel `violett-400`.
  „Tinte“ bleibt der Name der Textfarbe (TP2: „Balken in Tinte“), deshalb nicht „tinte“.
- Gemessen (bleibt gültig): `kopierstift` als Text auf `surface` 5.06 hell, 7.33 dunkel. **Neu zu messen** und in
  `scripts/farben-pruefen.mjs` aufzunehmen: `kopierstift` auf `surface-raised` (Blatt, Stimmzettel) und auf
  `surface-sunken`, jeweils ≥ 4.5 (Schreibschrift hat dünne Haarstriche, deshalb gilt die Grenze für normalen Text,
  obwohl die Grade groß sind).
- Regeln: Kopierstift nie auf Buttons, Links oder Fokus. Blattgrün ist der einzige Bedienakzent, **ohne Ausnahme**
  (die Ausnahme für den Auftakt-Titel entfällt mit Abschnitt 8.1). Datengrafiken in Tinte wie bisher.

## 6. Logo und Signet

`components/marke/Wortmarke.tsx`, Server Component, zwei Größen:

- **`kopf`** (Kopf, auch auf allen Unterseiten): „Grünes Buch“ in Inspiration, `text-marke`, `kopierstift`. Der
  Name ist echter Text (zugänglicher Name „Grünes Buch“), kein Bild. Der Kopf bleibt ≤ 80 px hoch.
- **`umschlag`** (Auftakt, Fuß): die Wortmarke zweizeilig in `text-umschlag`, darunter die **Unterzeile** „Charge
  für Charge“ in Geist 500, `text-caption`, per CSS in Versalien, `tracking-gesperrt` (0.3 em), in `text`. Schwung
  über Ordnung, das Prinzip aus dem Doja-Logo (TP1 4.3).
- Schutzraum rundum mindestens die Höhe des „G“. Mindestgröße Wortmarke 32 px.
- **Signet** „gB“ in Inspiration, `violett-500` auf `neutral-100`, quadratisch, Glyphen der Schrift, nicht gezeichnet.
  Entsteht einmal per Skript `scripts/marke/signet.ts` aus der Schriftdatei (OFL, abgelegt unter
  `assets/marke/Inspiration-Regular.ttf` samt `OFL.txt`) über Satori aus `next/og` und `sharp`. Ausgabe:
  `app/icon.png` (512), `app/apple-icon.png` (180), `app/favicon.ico` (PNG-Einträge 32 und 16 in einem ICO-Container,
  ersetzt die Next-Vorlage) und
  `assets/marke/signet-1080.png` für das Instagram-Profilbild (nicht ausgeliefert).
- Hell und dunkel über dieselben Tokens. Verboten: Wortmarke in Cormorant oder Geist, Logo in Grün, Verzerren,
  Schatten, Verläufe, Versalien der Wortmarke.
- **Entfällt:** „gb“-Tag, Aufkleber mit Stanzkontur, Holo-Schimmer, `SprayFilter.tsx` (`spray-rau`, `stanzkontur`).

## 7. Medien

### 7.1 Arten

`lib/medien.ts` bekommt neue Arten; `foto` (Graustufen) und `maske` entfallen:

| Art | Was | Dateien | Darstellung |
|---|---|---|---|
| `objekt` | freigestelltes Motiv mit Alphakanal und gebackenem Kontaktschatten | `<datei>-<breite>.avif` und `.webp` in 480, 960, 1440 (nie breiter als das Original) | liegt frei auf der Seite, keine Mischmodi |
| `tafel` | rechteckiges Farbfoto, fester Ausschnitt (3:2 oder 4:5) | `.avif` und `.webp` in 640, 1280, 1920 | eckig, keine Mischmodi |
| `video` | wie bisher, SD-Datei plus Standbild | `.mp4`, `-standbild.webp` | eckig als Tafel, Grading per CSS |

Felder je Eintrag wie bisher (`id`, `art`, `pexelsId`, `datei`, `breite`, `hoehe`, `alt`, `urheber`, `quelle`), neu
`lizenz: "Pexels"` (für den Nachweis im Fuß) und bei `tafel` das Seitenverhältnis. `tests/medien.test.ts` prüft
weiter: jede Datei in `public/medien/` hat einen Eintrag und umgekehrt, dazu neu: jedes `objekt` hat einen
Alphakanal (per `sharp().metadata().hasAlpha`).

### 7.2 Pipeline (Entwicklungszeit, nie im Request-Pfad)

1. **Suchen:** `scripts/medien/suchen.ts` wie bisher (Pexels-API, einmal, keine Wiederholung), neue Suchbegriffe aus 7.4.
2. **Auswählen** durch Ansehen nach Leitplanken und 7.4, Eintrag in `lib/medien.ts`.
3. **Freistellen** (`objekt`): Original laden, `rembg` lokal (Python-CLI, Modell `isnet-general-use`, sonst `u2net`),
   Ergebnis als PNG mit Alpha. Danach auf das Motiv zuschneiden plus 6 % Rand. Gelingt das Freistellen nicht sauber
   (Halos, abgeschnittene Blattspitzen), wird das Motiv verworfen, nicht von Hand nachgebessert.
4. **Graden** (`objekt`, `tafel`), in `scripts/medien/verarbeitung.ts`, ein gemeinsamer Parametersatz `GRADING` für
   alle Motive: Weißabgleich über den hellsten Bereich des Motivs, Sättigung 0.85, eine gemeinsame sanfte Tonkurve,
   leichte Tönung Richtung Farbton 165 (Papier). Ziel ist, dass Motive aus verschiedenen Aufnahmen wie aus einer
   Serie wirken.
5. **Schatten** (`objekt`): weicher Kontaktschatten aus der eigenen Silhouette (unscharf, nach unten versetzt,
   `neutral-900`, Deckkraft 22 %), unter das Motiv in denselben Alphakanal gerechnet. Auf dunklem Papier wird er
   von selbst fast unsichtbar, das ist gewollt.
6. **Ausgeben:** AVIF (Qualität 55, mit Alpha) und WebP (Qualität 76, mit Alpha) in den Breiten aus 7.1.
7. **Werkzeug installieren (Welle 2, erster Schritt):** `pip install "rembg[cpu,cli]"`, das Modell lädt beim ersten
   Aufruf (rund 170 MB). Beides einmal, mit der Zustimmung aus dem Brainstorming. Bei einem Netzfehler sofort stoppen
   und melden (Memory `netzwerk-schonen`). Läuft `onnxruntime` unter Python 3.14 nicht, wird das gemeldet, bevor
   eine andere Python-Version oder ein anderes Werkzeug geholt wird.

### 7.3 Darstellung

- `components/medien/Bild.tsx` rendert `<picture>` mit `<source type="image/avif">` und `<img>` (WebP), `srcset`
  und `sizes` aus `lib/medien.ts`, Breite und Höhe gegen Layoutsprünge. Einzige Stelle mit `<img>` wie bisher.
- CSS: `.medien-buch` mit `multiply`, `invert` und `screen` entfällt ganz. Neu `.medien-objekt` und `.medien-tafel`:
  hell ohne Filter, dunkel `filter: brightness(0.9)`, damit helle Motive auf dunklem Papier nicht blenden.
  `.medien-video`: `filter: saturate(0.85) contrast(1.03)`, dunkel zusätzlich `brightness(0.9)`.
- **Tiefenebenen:** Hilfsklassen `.tiefe-vorn` und `.tiefe-hinten` verschieben ein Motiv scroll-gekoppelt per
  `animation-timeline: view()` (vorn −6 % bis +6 %, hinten die halbe Strecke, nur `transform`). Nur unter
  `@supports (animation-timeline: view())` und `prefers-reduced-motion: no-preference`; sonst steht das Motiv still.
  Ein Element mit `.tiefe-*` ist nie gleichzeitig Ziel von GSAP (Einblendungen laufen am umgebenden Element).
- `components/medien/Textur.tsx` und die Masken `drip`, `nebel`, `marmor` (Dateien und Einträge) entfallen.

### 7.4 Motive

Kriterien für jedes Motiv: Studioaufnahme vor hellem, ruhigem Grund (Freistellen), kein Schriftzug und kein Etikett
im Bild, kein Konsum, keine Figuren, keine Blüte mit erkennbarem Handelsnamen. Suchbegriffe englisch (Pexels).

| id | Art | Motiv | Suchbegriff | Einsatz |
|---|---|---|---|---|
| `blatt` | objekt | einzelnes Cannabisblatt (Kandidat 7668040, schon auf Weiß) | cannabis leaf white background | Auftakt vorn, Transparent machen |
| `heft` | objekt | aufgeschlagenes Notizbuch, leer, von oben | open notebook white background | Auftakt hinten |
| `stift` | objekt | Bleistift, schräg | pencil white background | Abstimmung, Kopf von `/umfragen` |
| `lupe` | objekt | Lupe | magnifying glass white background | Neuester Eintrag, Kopf von `/reviews` |
| `bluete` | objekt | zwei getrocknete Blüten (heute 20288575, neu freistellen) | dried cannabis bud white background | Transparent machen |
| `standgefaess` | objekt | Apothekengefäß aus Glas oder Porzellan, ohne Etikett | apothecary jar white background | Apotheken, Kopf von `/apotheken` (TP2 Welle 2) |
| `trichom` | tafel | Trichom-Makro (heute 30439065), 4:5 | cannabis trichomes macro | Transparent machen |
| `pflanze-loop` | video | Pflanzen im Wind (heute 12361112) | unverändert | Gemeinsam lernen |

Das bisherige Leitobjekt (Spiralheft mit **Ahornblatt**) entfällt. Findet sich für ein Motiv nichts, das die
Kriterien erfüllt, entfällt der Einsatz, statt ein schwächeres Motiv zu nehmen.

## 8. Startseite

Sektionsfolge und Daten wie TP1 5.1 bis 5.3. Geändert:

1. **Auftakt als Umschlag.** `h1` ist die Wortmarke in `umschlag`-Größe (Name „Grünes Buch“, zweizeilig), darunter
   die Unterzeile. Darüber weiter „Cannabis, offen gelegt.“ (Cormorant italic), darunter der Satz und die Pille
   **Wähl mit** (Grün). Flat-Lay: `heft` liegt **hinter** der Schrift (`tiefe-hinten`), `blatt` **vor** den
   Buchstaben, leicht gedreht, und überdeckt einen Teil von „Buch“ (`tiefe-vorn`). Das `blatt` entwickelt sich beim
   Laden aus Kopierstift-Tinte (9). Einstieg: Wortmarke wird Zeile für Zeile „geschrieben“ (`clip-path` von links),
   dann Unterzeile, dann Tinte. Navigation und Pille sind ab dem ersten Frame bedienbar. Handy: Wortmarke
   zweizeilig, Motive kleiner, weiter überlagernd.
2. **Transparent machen:** Bühne `blatt` → `bluete` (Objekte) → `trichom` (Tafel), sonst wie heute (GSAP-Zoom).
3. **Wissen bündeln** als **Seite mit Randspalte:** links der gedruckte Satz „Einer allein weiß wenig. Hier sammelt
   sich, was viele erfahren.“, ab `lg` rechts die Randspalte mit drei Randnotizen: Zahl gedruckt in Geist Mono
   `text-display`, das Wort handschriftlich (`text-notiz`): „Stimmen“, „Vorschläge“, „Runden“ (Einzahl bei 1).
   Leer oder Fehler: die drei Leitsätze handschriftlich. Grund `surface` statt `surface-sunken`, kein Schwenk
   (`bewegung/wand.ts` entfällt); jede Notiz „wird geschrieben“ beim Eintritt, die Zahlen zählen einmal hoch.
   `wandTags()` wird zu `randnotizen()` und liefert Zahl und Wort getrennt.
4. **Gemeinsam lernen:** „Ihr schlagt vor.“ und „Ihr stimmt ab.“ in Handschrift (`text-notiz`, ≥ 32 px), „Ich
   teste.“ und „Alle lesen.“ gedruckt. Der Loop in der Mitte ist eine Tafel in Farbe (7.3), eckig.
5. **Der neueste Eintrag:** Die `lupe` liegt an der Kante der Doppelseite (`tiefe-vorn`) und entwickelt sich aus
   Tinte (9), nachdem die Doppelseite aufgeschlagen ist.
6. **Die Abstimmung:** „Wähl mit.“ handschriftlich, wird beim Eintritt geschrieben. Wasserzeichen-Tag und Drip
   entfallen. Der `stift` liegt schräg neben dem Stimmzettel. Auf dem Stimmzettel: gesetzte Plätze behalten den
   gedruckten Stempel „Gesetzt“; Community-Plätze bekommen die Randnotiz **„von euch“** (Handschrift, 32 px, statt
   Sprühnebel); die eigene Stimme bekommt zusätzlich zum Badge „Deine Stimme“ ein handgeschriebenes „x“ vor dem
   Namen (`aria-hidden`, Glyphe der Schrift).
7. **Katalog:** unverändert.
8. **Apotheken:** das `standgefaess` neben dem Satz.
9. **Fuß:** Schlusszeile unverändert. Statt des „gb“-Tags läuft die Wortmarke in `umschlag`-Größe angeschnitten
   unten aus dem Bild (`aria-hidden`, der Name steht im Kopf), darüber Navigation, Rechtshinweis, Bildnachweise.

Zustände (TP1 5.2) bleiben; die Skelette der Sektionen 3 und 6 verlieren ihre Wandform und zeigen Randspalte bzw.
Stimmzettel.

## 9. WebGL-Effekt „Kopierstift läuft“

- **Aufgabe (eine):** Ein Motiv entwickelt sich aus einem violetten Tintenfleck, der sich mit ausgefranster Kante
  ausbreitet wie nasse Kopierstift-Tinte in Papier, bis das Farbfoto dasteht. Einsatz genau zweimal: `blatt` im
  Auftakt, `lupe` beim neuesten Eintrag. Einmal pro Seitenaufruf je Motiv.
- **Ort:** `components/story/bewegung/tinte.ts`, gestartet von `StoryBuehne`, per dynamischem Import. Damit gilt
  alles aus TP1 6.2: nur Startseite, nicht bei reduzierter Bewegung, erst nach dem Hydrieren.
- **Technik:** WebGL2 ohne Bibliothek. Ein Programm, ein bildschirmfüllendes Dreieck, eine Textur (das schon
  dekodierte `<img>` als Quelle über `currentSrc`), Uniforms Fortschritt, Ursprung, Tintenfarbe. Fragment-Shader:
  Rauschfeld (fraktales Value-Noise) plus Abstand vom Ursprung ergibt eine Schwelle; vor der Front transparent, an
  der Front ein schmales Band in Tintenfarbe, dahinter das Foto mit seinem Alphakanal. Dauer 1,6 s, Easing aus den
  Tokens. Tintenfarbe aus `--color-kopierstift`, einmal über einen 2D-Canvas nach sRGB umgerechnet.
- **Ablauf:** Motiv nähert sich dem Viewport (IntersectionObserver) → Canvas in derselben Box anlegen, Textur laden
  → im selben Frame `<img>` ausblenden und den Effekt starten → am Ende `<img>` einblenden, Canvas entfernen,
  Kontext freigeben (`WEBGL_lose_context`), Listener und Observer abmelden. Nie mehr als ein Kontext gleichzeitig.
- **Grenzen:** Pixeldichte höchstens 2, keine Allokation pro Frame, bei verborgenem Dokument sofort Endzustand.
- **Rückfall:** kein WebGL2, Kontextverlust, Shader-Fehler oder Textur nicht ladbar → das `<img>` bleibt einfach
  sichtbar (im Auftakt blendet die bestehende Einstiegslogik es ein). Ohne JavaScript und bei reduzierter Bewegung
  ist das Motiv sofort da. Der Effekt verdeckt nie Text oder Bedienung.

## 10. Unterseiten und Seitenwechsel

- **Seitenkopf mit Motiv:** `Seitenkopf` (TP2 3.2) bekommt die optionale Prop `motiv` (id eines `objekt`). Das Motiv
  liegt rechts, teils hinter dem Titel (Titel vorn), `tiefe-hinten`, ab `md` etwa ein Drittel der Breite; auf dem
  Handy klein rechts oben über dem Titel. Zuordnung: `/reviews` → `lupe`, `/umfragen` → `stift` (beide hier, Welle 3);
  `/produkte` → `blatt`, `/apotheken` → `standgefaess` (mit TP2 Welle 2, wenn diese Seiten den Seitenkopf bekommen).
  Produktseite, Konto, Verwaltung und `not-found` bleiben ohne Motiv.
- **Seitenwechsel per React `<ViewTransition>`** (App Router, keine Konfiguration, Doku
  `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`):
  - Die Wortmarke im Kopf trägt einen festen Namen und steht beim Wechsel still.
  - Ein Motiv, das auf der Startseite und im Seitenkopf der Zielseite liegt, wandert mit: `lupe` (Neuester Eintrag →
    `/reviews`), `stift` (Abstimmung → `/umfragen`), später `standgefaess` und `blatt`. Ein Name kommt je Seite nur
    einmal vor; das zweite `blatt` in „Transparent machen“ trägt keinen.
  - Der Rest blendet kurz über (200 ms). Bei reduzierter Bewegung keine Animation
    (`::view-transition-group(*)` ohne Animation).
  - Beim Umsetzen prüfen, wie React ein Paar behandelt, dessen altes Element außerhalb des Viewports liegt; fliegt es
    von außerhalb herein, trägt das Motiv den Namen nur in der Sektion mit dem Link.
  - Browser ohne Unterstützung navigieren normal.
- **Handschrift auf Unterseiten** nur auf `/umfragen`: die `h2` „Schlag vor.“, „Stimm ab.“, „Eure Vorschläge.“ in
  `font-hand text-notiz text-kopierstift`, ohne Nebel-Textur; Stimmzettel wie Startseite 8.6.

## 11. Bewegung (Änderungen an Brand Guideline 7 und `ui-design-engine` 7)

- Die Wand „sprüht“ nicht mehr; Handschrift „wird geschrieben“: `clip-path: inset()` von links nach rechts, 0,6 bis
  0,9 s je Zeile, einmal. Drips entfallen.
- **Neu erlaubt:** CSS scroll-gekoppelte Animationen (`animation-timeline`) für Tiefenebenen, auf allen Seiten, nur
  `transform`, nur mit `@supports` und `prefers-reduced-motion: no-preference`.
- **Neu erlaubt:** der WebGL-Effekt aus 9, nur in `components/story/bewegung/tinte.ts`.
- **Neu erlaubt:** Seitenwechsel per `<ViewTransition>` aus 10.
- Hover „Graustufen zu Farbe“ (TP1 4.6) entfällt, die Motive sind schon farbig.
- Weiter gilt: jede Animation in einem Satz begründbar, keine Endlosschleifen außer dem Video, GSAP und Lenis nur auf
  der Startseite und nie bei reduzierter Bewegung.

## 12. Wortlaut

| Ort | Text |
|---|---|
| Unterzeile der Wortmarke | „Charge für Charge“ (gespeichert in natürlicher Schreibung, Versalien per CSS) |
| Randnotiz Stimmzettel, Community-Platz | „von euch“ |
| Randnotizen Wissen bündeln | „Stimme“/„Stimmen“, „Vorschlag“/„Vorschläge“, „Runde“/„Runden“ neben der Zahl; leer: „Schlag vor.“, „Stimm ab.“, „Lies mit.“ (unverändert) |
| `/umfragen` | unverändert: „Schlag vor.“, „Stimm ab.“, „Eure Vorschläge.“ |
| Alt-Texte neuer Motive | bei der Auswahl, beschreibend, ohne erfundene Angaben (z. B. „Aufgeschlagenes, leeres Notizbuch auf hellem Grund“) |

Alle Texte ohne Geviert- und Gedankenstrich, Du und Ich, keine Füllverben.

## 13. Dateien je Welle

**Welle 1: Marke**

| Datei | Änderung |
|---|---|
| `app/layout.tsx` | Inspiration statt Sedgwick, `SprayFilter` raus |
| `app/globals.css` | `font-hand`, `text-notiz`, `text-umschlag`, `text-marke`, `violett-*`, `kopierstift*`; Wand-Klassen, `.wand-textur`, `.gb-*`, `.wasserzeichen`, `.fuss-tag` (Sedgwick) raus; „geschrieben“-Einstieg |
| `components/marke/Wortmarke.tsx` | neu nach 6 (`kopf`, `umschlag`) |
| `components/marke/SprayFilter.tsx`, `components/medien/Textur.tsx`, `components/story/bewegung/wand.ts` | entfallen |
| `components/story/Auftakt.tsx` | Titel als Wortmarke, Tag und Drip raus (Motive bleiben bis Welle 2 wie heute) |
| `components/story/WissenBuendeln.tsx`, `lib/query/community.ts` | Randspalte, `randnotizen()` |
| `components/story/GemeinsamLernen.tsx`, `Abstimmung.tsx`, `Skelette.tsx`, `components/layout/Fuss.tsx` | Handschrift statt Wand |
| `components/umfrage/UmfrageKarte.tsx`, `app/umfragen/page.tsx` | Randnotiz „von euch“, „x“ der eigenen Stimme, Handschrift-`h2` |
| `components/story/bewegung/*` | Sprühen → Schreiben, Drip-Ablauf raus |
| `lib/medien.ts`, `public/medien/*-maske.png` | Masken raus |
| `scripts/marke/signet.ts`, `assets/marke/*`, `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico` | neu (6) |
| `scripts/farben-pruefen.mjs` | Umbenennung, neue Paare (5) |
| `docs/brand/gruenes-buch.md`, `.claude/skills/ui-design-engine.md` | auf „Buch und Handschrift“ umgeschrieben |

**Welle 2: Medien**

| Datei | Änderung |
|---|---|
| `scripts/medien/aufbereiten.ts`, `verarbeitung.ts`, neu `freistellen.ts` | Freistellen, Grading, Schatten, AVIF/WebP (7.2) |
| `lib/medien.ts`, `tests/medien.test.ts`, `public/medien/*` | neue Arten und Motive (7.1, 7.4), alte Graustufen-Dateien raus |
| `components/medien/Bild.tsx`, `app/globals.css` | `<picture>`, `.medien-objekt`, `.medien-tafel`, `.tiefe-*`; `multiply`/`invert` raus |
| `components/story/Auftakt.tsx`, `TransparentMachen.tsx`, `GemeinsamLernen.tsx`, `NeuesterEintrag.tsx`, `Abstimmung.tsx`, `Apotheken.tsx` | Motive nach 8 |
| `components/story/bewegung/tinte.ts`, `StoryBuehne.tsx` | WebGL-Effekt (9) |

**Welle 3: Unterseiten**

| Datei | Änderung |
|---|---|
| `components/layout/Seitenkopf.tsx` | Prop `motiv` |
| `app/reviews/page.tsx`, `app/umfragen/page.tsx` | Motiv im Seitenkopf |
| `components/layout/Kopf.tsx`, `components/story/NeuesterEintrag.tsx`, `Abstimmung.tsx` | `<ViewTransition>`-Namen |
| `app/globals.css` | Seitenwechsel-Animation, reduzierte Bewegung |

## 14. Budgets

- JavaScript Startseite: **≤ 65 KB gz** (heute 58.968 B; WebGL rund +4 KB, `wand.ts` fällt weg). Unterseiten: kein
  zusätzliches Paket (`ViewTransition` ist Teil von React).
- Schriften: Inspiration eine Datei (Subset latin) statt Sedgwick.
- Medien der ersten Ansicht: ≤ 400 KB (AVIF). LCP < 2,5 s, CLS < 0,1; das LCP-Element ist voraussichtlich die
  Wortmarke (Text), das `heft` wird trotzdem mit hoher Priorität geladen.
- WebGL: Canvas nur während des Effekts (≤ 2 s), höchstens einer, danach freigegeben.
- Workers Free: keine neue Abfrage.

## 15. Prüfung (je Welle, Akzeptanzkriterien)

1. `npm test`, Typecheck, `eslint`, `npm run farben`, `next build` grün; `scripts/seiten-pruefen.ts` für alle
   geänderten Seiten ok.
2. Suche in `app/`, `components/`, `lib/` ohne Treffer: `font-wand`, `Sedgwick`, `spray`, `Textur`,
   `wand-textur` (ab Welle 1) sowie `mix-blend-mode` und `invert(` (ab Welle 2).
3. Gerenderte Handschrift nirgends unter 32 px (berechneter Stil), nie an einem Handelsnamen.
4. Browser, **sichtbarer Tab**: hell und dunkel; 320, 390, 800 und 1440 px ohne seitliches Überlaufen; Fokus sichtbar.
5. Ohne JavaScript: Wortmarke, alle Motive und alle Randnotizen sichtbar (Blick ins Roh-HTML, keine versteckten Stream-Blöcke).
6. Reduzierte Bewegung: GSAP, Lenis und `tinte.ts` werden nicht geladen, Tiefenebenen stehen still, Seitenwechsel
   ohne Animation, alle Endzustände sofort.
7. WebGL gezielt ausgeschaltet (Kontext verweigert): Motive erscheinen normal.
8. Seitenwechsel in Chrome: Wortmarke steht still, `lupe` und `stift` wandern mit; in einem Browser ohne Unterstützung
   normale Navigation.
9. Motive: jedes `objekt` hat Alpha, keine sichtbaren Halos auf `surface` und `surface-sunken` in beiden Modi,
   Leitplanken 2, 3, 5 eingehalten, Nachweis im Fuß.
10. Budgets aus 14 gemessen (Build-Ausgabe, LCP/CLS lokal und nach dem Live-Gang einmal live, kein Polling).
11. Design-Review nach jeder Welle mit `web-design-guidelines`; der Nutzer kann `/interface-review` starten.

## 16. Reihenfolge

1. TP3 Welle 1 (Marke) → Plan mit `superpowers:writing-plans`, Ausführung **Native**, Live-Gang nach Go.
2. TP3 Welle 2 (Medien) → eigener Plan, Live-Gang.
3. TP3 Welle 3 (Unterseiten) → eigener Plan, Live-Gang.
4. TP2 Welle 2 (Katalog) im neuen Stil, mit den Motiven für `/produkte` und `/apotheken`; dann TP2 Welle 3.

Zwischen Welle 1 und 2 stehen die Motive noch in Graustufen mit `multiply`/`invert`; das ist bekannt und wird mit
Welle 2 behoben.

## 17. Nicht im Umfang

Datenmodell, Review-Formular im Admin, Produktbilder (Leitplanke 5), eigene Fotos (später als Quelle tauschbar),
bezahlte Bildgenerierung, Three.js, weitere WebGL-Effekte, Handschrift auf `/reviews` und im Katalog, Instagram-
Einbindung (DSGVO-Frage bleibt beim Nutzer).

## 18. Offene Punkte

- Einmalige Downloads: `rembg` mit `onnxruntime` und das Modell (Welle 2), die Schriftdatei Inspiration (Welle 1,
  rund 100 KB, OFL). Je ein Versuch, bei Netzfehler stoppen.
- Ob `onnxruntime` unter Python 3.14 läuft, zeigt erst die Installation (7.2 Schritt 7).
- Unverändert offen beim Nutzer: Instagram-Handle, DSGVO-Frage zum Reel, 4 npm-audit „high“.

## 19. Eingesetzte Skills

Brainstorming: `superpowers:brainstorming`, `ui-design-engine`, `build-awwwards-quality-sites`,
`design-taste-frontend`, `better-typography`, `ideogram4` und `qwen-edit` (nur zur Bewertung, beide verworfen).
Umsetzung zusätzlich: `better-colors` (Kontraste 5), `animate` und `emil-design-eng` (Schreiben, Tinte,
Seitenwechsel), `better-accessibility`, `better-layout` (Randspalte), `cloudflare:web-perf` (Budgets),
`web-design-guidelines` (Review).
