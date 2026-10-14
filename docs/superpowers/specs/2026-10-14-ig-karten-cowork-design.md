# Instagram-Karten und Cowork-Ablauf – Design

**Datum:** 2026-10-14 · **Status:** Entwurf, vom Nutzer im Chat freigegeben (Variante A), Spec wartet auf Review

## Ziel

Neue Betreiber-Bewertungen landen als fertiger Instagram-Entwurf in Publora; der Nutzer gibt jeden Post per Klick frei.
Bilder kosten nichts und zeigen die Bewertungsdaten exakt. Umfragen bleiben vorerst außen vor (Nutzer 2026-10-14).

## Rahmen

- Nie kostenpflichtig: kein Ideogram, kein RunPod, kein Bild-Rendern im Worker (Free-Plan 10 ms CPU, `next/og`
  mit Satori/resvg sprengt das, vgl. Fehler 1102).
- HWG: nur Aroma, Aussehen, Charge, Note. Keine Wirkung, kein Heilversprechen, kein Foto, das Konsum zeigt.
- Publora Free: 15 Posts/Monat, Instagram nur mit Medium (Entwurf anlegen, `/get-upload-url`, `/update-post`).
- Instagram-Token läuft 2026-12-13 ab (Reconnect in Publora).

## Bausteine

### 1. Kartenseite `/ig-karte/[id]`

- Rendert eine freigegebene Betreiber-Bewertung als Fläche 1080 × 1350 px (Instagram-Hochformat 4:5), sonst nichts:
  kein Kopf, kein Fuß, kein Gate-Banner, keine Inseln/JS.
- Inhalt: Pinsel-Logo (Token `--color-logo`), Blütenname, Vertreiber, Gesamtnote als Blätter plus Zahl, zwei
  Hauptaromen (wie Feld `aromen` im Feed), Charge falls vorhanden, kurzes Zitat aus der Notiz (max. 140 Zeichen,
  an Wortgrenze gekürzt, nur wenn `hwgTreffer` nichts findet), Fußzeile mit Domain.
- Gestaltung nach `ui-design-engine` (Buch und Handschrift, Tokens aus `app/globals.css`), Dunkel als feste Farbwelt
  der Karte, unabhängig vom Theme des Betrachters.
- Daten über dieselbe Abfrage wie der Feed (`lib/query/ig-feed.ts`, neue Funktion für eine Id); nicht freigegeben
  oder nicht redaktionell ergibt 404.
- Zugang: hinter dem Gate, offen nur mit `?key=` gleich `IG_FEED_KEY` (Regel in `lib/proxy-regeln.ts` um den Pfad
  erweitern). `robots: noindex`.
- Caching: Seite statisch mit Revalidierung beim Freigeben/Ändern der Bewertung; kein Rechnen im Request-Pfad.

### 2. Feed-Feld `karte`

`IgReview` bekommt `karte: string` = `${ursprung}/ig-karte/<id>`, ohne Schlüssel (der gehört nicht in die Antwort);
Cowork hängt `?key=` selbst an.

### 3. Cowork-Ablauf (Variante A)

Cowork-Projekt „Book of Terpz Instagram“ mit Anweisungstext aus `docs/instagram/cowork-anweisung.md`:

1. Feed mit Schlüssel abrufen, Bewertungen nehmen, die noch nicht gepostet sind (Liste gepostete Ids im
   Cowork-Projekt als Datei pflegen).
2. Kartenseite mit Schlüssel im Browser öffnen, Fenster/Viewport 1080 × 1350, Screenshot als PNG.
3. Caption schreiben: Deutsch, Aroma/Aussehen/Charge, Link-Hinweis „Link in Bio“, 5–10 Hashtags ohne Wirkungsbezug;
   HWG-Liste aus dem Anweisungstext prüfen.
4. Publora: `POST /api/v1/create-post` als Entwurf (ohne `scheduledTime`) für `INSTAGRAM_PLATFORM_ID`, PNG per
   `/get-upload-url` hochladen, `/update-post`. Nie selbst veröffentlichen.
5. Nutzer benachrichtigen; er prüft und plant in Publora.

Takt: je neue Betreiber-Bewertung ein Entwurf, dazu höchstens 2 Pflege-Posts pro Woche (Monatsgrenze 15 beachten,
Zähler in Publora prüfen). Pflege-Posts nutzen ältere Bewertungen als Karte.

**Erster Schritt der Umsetzung:** prüfen, ob Cowork Screenshots als Datei hochladen kann. Wenn nicht, gilt Fallback
Variante B: lokales Playwright-Skript `scripts/ig-karten.mjs` erzeugt PNGs und Entwürfe, Cowork schreibt nur Captions.

### 4. Anweisungstext

`docs/instagram/cowork-anweisung.md` (Prosa, ohne Geheimnisse; Schlüssel trägt der Nutzer in Cowork ein): Ablauf
oben, HWG-Grenzen mit verbotenen Wörtern, Freigabepflicht, Takt, Reconnect-Termin.

## Tests

- `igReview` liefert `karte` mit Ursprung und Id, ohne Schlüssel.
- Zitat-Kürzung: max. 140 Zeichen, Wortgrenze, entfällt bei HWG-Treffer.
- Proxy-Regel: `/ig-karte/x` nur mit richtigem `key` offen, ohne Secret nie.
- Live: Karte im Browser bei 1080 × 1350, Screenshot sieht aus wie gedacht.

## Nicht Teil

Umfrage-Posts, automatisches Veröffentlichen, Fotos aus Bewertungen, Reels/Stories.
