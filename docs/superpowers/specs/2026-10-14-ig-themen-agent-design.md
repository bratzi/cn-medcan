# Instagram-Themen-Agent in der Cloud – Design

**Datum:** 2026-10-14 · **Status:** Entwurf, wartet auf Review
**Baut auf:** `2026-10-14-ig-karten-cowork-design.md` (Karten, Feed, `scripts/ig-entwuerfe.ts`)

## Ziel

Ein Agent in Anthropics Cloud (Claude Code Routine) füllt den Instagram-Account **@bookofterpz** selbstständig mit
**Entwürfen** in Publora: neue Betreiber-Bewertungen und eigene Themen-Posts (Terpene, Features der Website, Zweck der
Seite, Bewertungsschema). Er lernt aus dem, was der Betreiber mit den Entwürfen macht. Veröffentlichen bleibt immer beim
Betreiber.

## Rahmen

- Nie kostenpflichtig: keine KI-Bilddienste, kein Apify, kein Pixfaro. Bilder sind gerenderte HTML-Karten.
- HWG: nur Duft, Geschmack, Aussehen, Vorkommen, Chemie, Charge, Note, Funktionen der Website. Nie Wirkung, Linderung,
  Krankheit, Dosierung, Konsumaufforderung. Bei Terpenen besonders streng („Myrcen entspannt“ ist verboten).
- Publora Free: 15 veröffentlichte Posts/Monat. Entwürfe zählen nicht, sollen aber nicht zulaufen.
- Cloud-Umgebung „Default“ (geprüft 2026-10-14): Variablen `PUBLORA_API_KEY`, `INSTAGRAM_PLATFORM_ID`, `IG_FEED_URL`;
  Netz zu Publora, Website, Google Fonts offen; Chromium unter `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
- Der Agent schreibt nicht ins Repo (kein Commit, kein Push, also kein Deploy). Sein Gedächtnis ist Publora selbst.

## Bausteine

### 1. Skript `scripts/ig-entwuerfe.ts` cloudfähig

- Browser: `IG_BROWSER` (Pfad) oder automatisch Edge (Windows) bzw. `/opt/pw-browsers/chromium*/chrome-linux/chrome`
  (Linux, dann mit `--no-sandbox`).
- Schlüssel: `IG_FEED_KEY` oder aus dem `key`-Parameter von `IG_FEED_URL`.
- Variablen aus der Umgebung haben Vorrang vor `.env`-Dateien.
- „Schon gepostet“ zusätzlich aus Publora: Eine Bewertung gilt als erledigt, wenn ein Post in `list-posts` ein Bild mit
  `sourceFileName` `<reviewId>.png` trägt (so heißen die Bilder schon). `.ig-gepostet.txt` bleibt lokal als zweite Quelle.
- **Marke = Bild-Dateiname**, nie Text in der Caption: auf Instagram unsichtbar, in Publora dauerhaft lesbar.

### 2. Themenkarte `lib/ig-themen-karte.ts`

Reine Funktion `igThemenKarteHtml(t: IgThema, ursprung: string): string`, gleicher Stil wie die Bewertungskarte
(1080 × 1350, dunkel, Logo mit „of“, Newsreader und Mr Dafoe). `IgThema = { art: "terpen" | "feature" | "mission" |
"schema"; kicker: string; titel: string; text: string; punkte: string[] (0–4); farbe?: string (Hex, z. B. Aromafarbe) }`.
Alle Texte werden maskiert. Der Agent rendert sie als lokale Datei (`file://`), ohne Deploy.

### 3. Themen-Skript `scripts/ig-thema.ts`

`npx tsx scripts/ig-thema.ts <thema.json>`: liest `{ thema: IgThema, caption: string, schluessel: string }`, prüft die
Caption mit `igCaptionPruefen` (HWG-Filter plus `IG_SPERRE`, Länge ≤ 2200, 3–5 Hashtags), rendert die Karte, legt den
Publora-Entwurf mit Bild an (`create-post`, `get-upload-url`, `PUT`, `complete-media`); das Bild heißt
`bot-thema-<art>-<schluessel>.png` (Marke). `--probe` nur PNG. Bricht bei Prüffehler ab.

`igCaptionPruefen(caption): string[]` (leer = ok) liegt in `lib/ig-caption.ts`; `IG_SPERRE` wird dafür aus
`lib/ig-karte.ts` exportiert.

### 4. Themenpool `docs/instagram/themen.md`

Startliste, die der Agent nutzt und um eigene Ideen ergänzt (im Lauf, nicht im Repo):
- Terpene aus `lib/terpen-aromen.ts` und der Aroma-Karte: je Terpen Duft, Vorkommen in Pflanzen, Aromarichtungen.
- Features: Bewertungsschema mit fünf Noten, Aroma-Karte, Chargen-Bezug, Restfeuchte-Hinweis, Abstimmung über den
  nächsten Strain, Kommentare und Likes, Statistik „Zahlen aus dem Buch“.
- Mission: ehrliche, chargengenaue Bewertungen; Community wählt mit; nur verifizierte Mitglieder stimmen ab.
Quelle der Fakten ist immer das Repo (Code, `docs/brand/gruenes-buch.md`), nicht Erfindung.

### 5. Agent-Anweisung `docs/instagram/agent-anweisung.md` und Routine

Die Routine startet mit einem kurzen Prompt, der auf diese Datei verweist. Ablauf je Lauf:
1. Kein `npm ci`: Die Skripte importieren nur abhängigkeitsfreie Module aus `lib/`; `npx --yes tsx` holt tsx aus der
   npm-Registry (erreichbar). Plan prüft das mit einem Lauf in frischem Klon ohne `node_modules`.
2. Bewertungen: `npx tsx scripts/ig-entwuerfe.ts --max=2`.
3. Lage lesen: `list-posts` – eigene Posts erkennen am Bildnamen `bot-thema-…` bzw. `<reviewId>.png`. Zählen: offene Entwürfe des Agents, veröffentlichte,
   gelöschte (fehlen gegenüber früher nicht feststellbar, daher nur: was ist veröffentlicht, was liegt noch).
4. Wenn ≥ 3 eigene Themen-Entwürfe offen liegen: keinen neuen anlegen, nur berichten.
5. Sonst ein Thema wählen: nicht wiederholen, was in den letzten 20 Posts (Bildnamen) vorkam; Arten abwechseln; Arten
   bevorzugen, deren Entwürfe der Betreiber veröffentlicht hat.
6. Caption nach den Regeln aus dem Instagram-Skill-Bündel (in der Anweisung zusammengefasst): Hook in den ersten 125
   Zeichen, kurzer Körper, Frage oder Hinweis „Link in Bio“ am Ende, 3–5 Hashtags (Nische/mittel/breit), kein KI-Ton
   (keine Gedankenstriche als Stilmittel, keine Floskeln wie „Tauche ein“), Deutsch, du-Form.
7. `scripts/ig-thema.ts` ausführen; bei Prüffehler Caption umschreiben, höchstens zweimal, sonst Thema verwerfen.
8. Bericht als Push-Nachricht: was angelegt, was übersprungen, warum.

Takt: Montag, Mittwoch, Freitag um 18:00 Berlin (Cron `0 16 * * 1,3,5` UTC, im Winter 17:00 Berlin). Modell
`claude-sonnet-5-5`. Werkzeuge: Bash, Read, Glob, Grep, Write (nur `/tmp`).

## Tests

- `igThemenKarteHtml`: maskiert, enthält Titel/Kicker/Punkte, keine `null`/`undefined`, Größe 1080 × 1350.
- `igCaptionPruefen`: meldet Wirkwörter („entspannt“, „hilft gegen“), zu viele/wenige Hashtags, Überlänge; gültige
  Caption ergibt leere Liste.
- Schlüssel aus `IG_FEED_URL`, Browserwahl je Plattform (reine Funktionen, ohne Start).
- Live: einmaliger Probelauf der Routine mit `--probe`, dann ein echter Lauf; Entwurf in Publora ansehen.

## Nicht Teil

Karussells (später), Reels, Stories, Reichweitenzahlen, automatisches Veröffentlichen, Umfrage-Posts.
