# Statische Seiten: Sprache als internes Pfadsegment, ISR über KV

**Stand:** umgesetzt 2026-10-01 (Plan docs/superpowers/plans/2026-10-01-statische-seiten.md), live seit dem Push aus Task 10.
**Anlass:** Fehler 1102 (exceededCpu) auf dem Workers-Free-Plan.

## 1. Ziel und Erfolg

Der Worker soll seltener am CPU-Limit von 10 ms je Anfrage scheitern.

- Erfolg: Die Startseite, `/reviews`, `/impressum`, `/datenschutz` und `/zugang` stehen im Build-Log nicht mehr
  als `ƒ` (dynamisch), sondern als ISR-Routen unter `/[lang]/…`.
- Erfolg: Ein zweiter Aufruf dieser Seiten kommt aus dem Cache (Antwort-Header `x-opennext-cache: HIT` oder
  `x-nextjs-cache: HIT`), und in den Workers-Logs liegt ihre CPU-Zeit deutlich unter den heutigen
  400 bis 1800 ms kalt. Vergleichswert: `/icon.png` (statisch) braucht kalt 40 bis 160 ms, warm 5 bis 10 ms.
- Kein Ziel: 1102 ganz beseitigen. Auch statische Seiten laufen durch den Worker (Gate, Routing, Cache).
  Dynamische Seiten (Blütenseite, Mitglied, Admin, Umfragen, `/blueten` mit Filtern) bleiben dynamisch.

## 2. Befund (gemessen 2026-10-01)

- Bundle 21,4 MiB, `Worker Startup Time: 29 ms`. Das Laden des Workers ist nicht die Ursache.
- Jede Seite ist dynamisch, weil `app/layout.tsx` über `holeSprache()` Cookie und `Accept-Language`
  liest (`lib/i18n/sprache.ts`). Damit rendert jede Anfrage das ganze Layout neu.
- Prisma-Client und Better Auth entstehen nur einmal je Isolate (Messung mit Log-Zeilen, `6390353`).

## 3. Nutzerentscheide

- Die Sprache wandert in den Pfad (2026-10-01). Umgesetzt als **internes** Segment: sichtbare URLs bleiben
  gleich (siehe 8.).
- Daten der Startseite bleiben über ISR frisch: alle 300 s, Cache in KV (2026-10-01).
- Kein Cloudflare Access, das Passwort-Gate im `proxy.ts` bleibt (2026-10-01).
- Nie kostenpflichtig: nur KV Free und ein Service-Binding, kein R2, keine Durable Objects.

## 4. Entwurf

### 4.1 Routing

- Alle Seiten wandern unter `app/[lang]/`, das Root-Layout nach `app/[lang]/layout.tsx`. `app/api/**`,
  `app/globals.css` und die Icons bleiben, wo sie sind.
- **Sichtbare URLs bleiben unverändert**, für Deutsch und Englisch. Der Proxy bestimmt die Sprache wie heute
  (`bestimmeSprache`: Cookie `sprache`, sonst `Accept-Language`, sonst Deutsch) und schreibt jede Seitenanfrage
  intern um: `/x` wird zu `/de/x` oder `/en/x` (Rewrite, kein Redirect). Links und Weiterleitungen im Code
  bleiben, wie sie sind.
- Die internen Pfade sind von außen nicht erreichbar: `/de/x` wird selbst zu `/de/de/x` umgeschrieben und
  landet im 404 (`app/[lang]/[...rest]/page.tsx`).
- Der Proxy läuft jetzt auch für `/impressum`, `/datenschutz`, `/zugang` und für Pfade mit Punkt. Die
  Gate-Ausnahmen stehen im Code (`lib/proxy-regeln.ts`), nicht mehr im Matcher. Ausgenommen vom Proxy bleiben
  nur `_next/…`, `favicon.ico`, `icon.png`, `apple-icon.png`.
- `/api/**` wird nie umgeschrieben, bleibt aber hinter dem Gate (außer `/api/zugang` und `/api/sprache`).
- Sprachwechsel: ein normales Formular schickt `POST /api/sprache` (Route Handler, ohne Gate). Er setzt das
  Cookie und leitet mit 303 auf die Seite zurück, von der der Wechsel kam (Referer, nur eigener Origin). Die
  Server Action `spracheSetzen` entfällt: ihr `refresh()` rendert im selben Request noch die alte Sprache,
  weil der Proxy die Anfrage schon umgeschrieben hat.

### 4.2 Sprache im Code

- `holeSprache()` liest in Server Components `lang` aus `next/root-params` statt Cookie und Header.
  Die Aufrufer in Seiten und Komponenten bleiben unverändert.
- Server Actions und Route Handler können `next/root-params` nicht nutzen (Next wirft dort). Sie nehmen
  `holeSpracheAusAnfrage()` und `holeWoerterbuchAusAnfrage()` aus `lib/i18n/anfrage.ts` mit derselben Regel
  wie der Proxy. Die Wörterbücher liegen dafür in `lib/i18n/woerterbuecher.ts`.
- `NavLink` vergleicht den Pfad ohne Sprachpräfix (`ohneSprachPraefix`), weil der Server beim Rendern den
  internen Pfad sieht, der Browser den sichtbaren.

### 4.3 Statische Seiten

- Kein `generateStaticParams` im Layout: Next würde sonst jede Seite unter `[lang]` als statisch einstufen,
  und Seiten mit Cookies scheiterten zur Laufzeit („Page changed from static to dynamic“). Stattdessen
  schaltet jede statische Seite selbst um: `export const dynamic = "force-static"` plus `revalidate`.
  Gerendert wird beim ersten Aufruf, nicht im Build (der Build hat weder D1 noch Secrets).
- `revalidate`: Startseite und `/reviews` 300 s; `/impressum` und `/datenschutz` 86400 s (eine Änderung an
  `IMPRESSUM_JSON` greift spätestens nach einem Tag, sofort mit dem nächsten Push); `/zugang` `false`.
- Teile mit Sitzung auf der Startseite wandern in den Browser, nach dem Muster von `KontoZaehler`. Ein
  Endpunkt `GET /api/startseite` liefert alles auf einmal (ein Worker-Aufruf statt drei):
  - Abstimmung: Id der laufenden Runde und der Stimmzustand des Mitglieds. Zeigt die statische Seite eine
    andere Runde (Cache bis 300 s alt), erscheint statt der Aktion ein Link „Zur Abstimmung“.
  - Empfehlungen: die eigene Liste mit Begründung in der Sprache der Anfrage, für Gäste der Hinweis.
  - Budpic-Zugang (`gast`, `mitglied`, `freigegeben`) für „Bild beitragen“ an den Katalogkarten.
- Der Katalog auf der Startseite zeigt die Sicht ohne Fachkreis (sie ist für alle gleich). Die Fachkreis-Sicht
  bleibt auf `/blueten`.
- `/blueten` bleibt dynamisch (Filter über `searchParams`).
- Nach dem Abstimmen auf der Startseite lädt die Insel ihren Zustand neu. Die Stimmenzahlen der statischen
  Seite sind bis zu 300 s alt.

### 4.4 Cache (OpenNext)

- `open-next.config.ts`: `incrementalCache: kvIncrementalCache` (ohne Regional Cache: die Cache API wirkt auf
  `*.workers.dev` nicht, der Wrapper kostete dort je Treffer nur CPU), `queue: memoryQueue`,
  `enableCacheInterception: true`. Kein Tag-Cache, weil nur zeitbasiert revalidiert wird (`revalidatePath` bleibt
  wirkungslos für den Cache).
- Cache-Interception liefert Treffer, ohne den Next-Server zu laden. Der Proxy (Gate) läuft vorher, im
  OpenNext-Quelltext geprüft (`core/routingHandler.js`).
- `wrangler.jsonc`: KV-Namespace `NEXT_INC_CACHE_KV`, Service-Binding `WORKER_SELF_REFERENCE` auf `cn-medcan`.
- Den KV-Namespace legt Claude per Cloudflare-MCP an (eine API-Anfrage); die ID ist kein Geheimnis.
- Schreiblast: höchstens 10 Cache-Einträge (5 Seiten × 2 Sprachen), neu geschrieben nur, wenn nach Ablauf
  jemand die Seite aufruft. Dazu je Deploy ein paar Einträge aus dem Build (`opennextjs-cloudflare deploy`
  füllt KV). Bei dieser Nutzung weit unter 1000 Schreibvorgängen am Tag (KV Free). Wird das Limit erreicht,
  schlägt nur das Schreiben fehl, ausgeliefert wird weiter der alte Stand.
- `next.config.ts` startet `initOpenNextCloudflareForDev()` nur noch in `next dev`, damit `next typegen` kein
  lokales workerd startet.

### 4.5 Was gleich bleibt

- Passwort-Gate, Rechtsseiten ohne Gate, sichtbare URLs, Links, alte Weiterleitungen (`/produkte`, `/bewerten`).
- Inhalte bleiben in ihrer Sprache, übersetzt wird nur die Oberfläche.

## 5. Fehlerfälle

- KV nicht erreichbar: OpenNext rendert die Seite wie heute, die Seite bleibt erreichbar.
- `/api/startseite` scheitert oder antwortet nicht binnen 8 s: Die Inseln zeigen ihren Fehlertext, der Rest
  der Seite steht.
- Ungültiges `lang` (nur ohne Proxy erreichbar): `notFound()` im Layout.
- Scanner-Pfade mit Punkt (`/wp-login.php`): laufen durch den Proxy, also Gate oder dynamischer 404, kein
  Cache-Eintrag.
- Endpunkte ohne Anmeldung: Gast-Antwort, nie ein Fehler.

## 6. Prüfung

- Tests: Proxy-Regeln als reine Funktionen (Gate-Ausnahmen, API, interner Pfad, Matcher), Sprachwechsel-Ziel,
  Antwort und Anzeige der Startseiten-Inseln, Actions ohne `next/root-params`, Seiten-Konfiguration.
- Build-Log nach jedem Push: die Zielseiten nicht als `ƒ`, `populate cache` ohne Fehler.
- Live: abgemeldet per Einzelabruf (Gate, Rechtsseiten, Scanner-Pfad), angemeldet per Browser-MCP (Deutsch und
  Englisch, Sprachwechsel, Startseite mit Abstimmen, 404). Logs 24 h nach dem Deploy mit dem Befund von heute
  vergleichen (CPU je Pfad, Zahl der `exceededCpu`).

## 7. Risiken

- Großer Umbau: alle Seiten wandern in einen neuen Ordner. Deshalb zwei Push-Prüfpunkte: erst Umzug plus
  Rechtsseiten und `/zugang` statisch, dann Startseite und `/reviews`.
- `next/root-params` (seit Next 16.3) und ISR unter OpenNext 1.20 sind hier live nicht erprobt.
- Das Build-Token von Workers Builds braucht KV-Schreibrecht für `populate cache`. Fehlt es, scheitert der
  Deploy, und die alte Version bleibt live.

## 8. Änderungen beim Planen (2026-10-01)

- Sprache nur intern im Pfad statt sichtbarer `/en/…`-URLs: gleiche Wirkung auf den Cache, aber keine
  geänderten Links und keine Weiterleitungen. Damit gilt auch der frühere Entscheid „gleiche URLs“ weiter.
- `force-static` je Seite statt `generateStaticParams` im Layout (Begründung in 4.3).
- Sprachwechsel als Route Handler statt Server Action (Begründung in 4.1).
- Ein Endpunkt `/api/startseite` statt zwei; dazu der Budpic-Zugang der Katalogkarten.
- KV-Namespace per Cloudflare-MCP statt durch den Nutzer.
