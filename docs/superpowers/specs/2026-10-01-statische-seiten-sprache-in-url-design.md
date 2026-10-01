# Statische Seiten: Sprache in der URL, ISR über KV

**Stand:** Entwurf 2026-10-01, wartet auf Freigabe durch den Nutzer.
**Anlass:** Fehler 1102 (exceededCpu) auf dem Workers-Free-Plan.

## 1. Ziel und Erfolg

Der Worker soll seltener am CPU-Limit von 10 ms je Anfrage scheitern.

- Erfolg: Die Startseite, `/reviews`, `/impressum`, `/datenschutz` und `/zugang` sind im Build als statisch
  (`○` oder `●`) gelistet, nicht mehr als `ƒ`.
- Erfolg: In den Workers-Logs liegt die CPU-Zeit dieser Seiten kalt deutlich unter den heutigen
  400 bis 1800 ms. Vergleichswert: `/icon.png` (statisch) braucht kalt 40 bis 160 ms, warm 5 bis 10 ms.
- Kein Ziel: 1102 ganz beseitigen. Auch statische Seiten laufen durch den Worker (Gate, Routing, Cache).
  Dynamische Seiten (Blütenseite, Bewerten, Mitglied, Admin, `/blueten` mit Filtern) bleiben dynamisch.

## 2. Befund (gemessen 2026-10-01)

- Bundle 21,4 MiB, `Worker Startup Time: 29 ms`. Das Laden des Workers ist nicht die Ursache.
- Jede Seite ist dynamisch, weil `app/layout.tsx` über `holeSprache()` Cookie und `Accept-Language`
  liest (`lib/i18n/sprache.ts`). Damit rendert jede Anfrage das ganze Layout neu.
- Prisma-Client und Better Auth entstehen nur einmal je Isolate (Messung mit Log-Zeilen, `6390353`).

## 3. Nutzerentscheide

- Sprache wandert in die URL (2026-10-01). Das ersetzt den Entscheid „gleiche URLs, Cookie“ aus Session 22.
- Daten der Startseite bleiben über ISR frisch: alle 300 s, Cache in KV (2026-10-01).
- Kein Cloudflare Access, das Passwort-Gate im `proxy.ts` bleibt (2026-10-01).
- Nie kostenpflichtig: nur Free-Kontingente (KV Free, Durable Objects nicht nötig).

## 4. Entwurf

### 4.1 Routing

- Alle Seiten wandern unter `app/[lang]/`. Das Root-Layout liegt in `app/[lang]/layout.tsx`.
  `generateStaticParams` liefert `de` und `en`.
- Deutsch behält die heutigen URLs ohne Präfix. Der Proxy schreibt `/x` intern auf `/de/x` um
  (Rewrite, kein Redirect). Englisch steht sichtbar unter `/en/x`.
- Ein direkter Aufruf von `/de/x` leitet per 308 auf `/x` (eine URL je Inhalt).
- Sprachwahl: Der Proxy leitet `/x` nur dann auf `/en/x`, wenn das Cookie `sprache=en` gesetzt ist.
  Ohne Cookie greift `Accept-Language` nur beim ersten Besuch der Startseite. Danach entscheidet die URL.
- Der Umschalter setzt weiter das Cookie und navigiert auf die Gegen-URL.
- `app/api/**` bleibt außerhalb von `[lang]`. Route Handler und Server Actions lesen die Sprache weiter aus
  dem Cookie, weil `next/root-params` dort nicht verfügbar ist.

### 4.2 Sprache im Code

- `holeSprache()` liest in Server Components `lang` aus `next/root-params` statt Cookie und Header.
  Die 34 Aufrufer bleiben unverändert.
- Für Server Actions und Route Handler gibt es eine eigene Funktion `holeSpracheAusAnfrage()` mit der
  heutigen Cookie-Logik (`lib/i18n/aktionen.ts`).
- Alle internen Links bekommen das Präfix über eine Hilfsfunktion `pfad(sprache, href)`. Bei Deutsch bleibt
  der Pfad unverändert.

### 4.3 Statische Seiten

- Startseite, `/reviews`, `/impressum`, `/datenschutz`, `/zugang`: `export const revalidate = 300`
  (Rechtsseiten und `/zugang`: `false`, rein statisch).
- Teile mit Sitzung auf der Startseite wandern in den Browser, nach dem Muster von `KontoZaehler`:
  - `Abstimmung`: Umfrage und Stimmenstand bleiben statisch. Ob das Mitglied abstimmen darf und schon
    abgestimmt hat, holt ein neuer Endpunkt `/api/abstimmung/status`.
  - `Empfehlungen`: Die persönliche Liste holt ein neuer Endpunkt `/api/empfehlungen`. Der statische Teil
    zeigt den Platzhalter für Gäste.
- `/blueten` bleibt dynamisch (Filter über `searchParams`).

### 4.4 Cache (OpenNext)

- `open-next.config.ts`: `incrementalCache: withRegionalCache(kvIncrementalCache, { mode: "long-lived" })`,
  `queue: memoryQueue`. Kein Tag-Cache, weil nur zeitbasiert revalidiert wird.
- `wrangler.jsonc`: KV-Namespace `NEXT_INC_CACHE_KV`, Service-Binding `WORKER_SELF_REFERENCE` auf
  `cn-medcan`.
- Schreiblast: 5 Seiten × 2 Sprachen × höchstens 288 Revalidierungen am Tag, nur bei Aufrufen. Realistisch
  weit unter 1000 Schreibvorgängen am Tag (KV Free). Wird das Limit erreicht, schlägt nur das Schreiben fehl,
  ausgeliefert wird weiter der alte Stand.
- Den KV-Namespace legt der Nutzer an: `npx.cmd wrangler kv namespace create NEXT_INC_CACHE_KV`, die ID kommt in
  `wrangler.jsonc`.

### 4.5 Was gleich bleibt

- Passwort-Gate im Proxy, Rechtsseiten ohne Gate.
- Inhalte bleiben in ihrer Sprache, übersetzt wird nur die Oberfläche.
- Alte Weiterleitungen (`/produkte`, `/bewerten`) funktionieren weiter.

## 5. Fehlerfälle

- KV nicht erreichbar: OpenNext rendert die Seite wie heute dynamisch, die Seite bleibt erreichbar.
- Ungültiges `lang` (z. B. `/fr/x`): `notFound()`.
- Endpunkte für Sitzungsteile ohne Anmeldung: leere Antwort, nie ein Fehler (wie `/api/benachrichtigungen`).

## 6. Prüfung

- Tests: Proxy-Sprachlogik als reine Funktion (Rewrite, 308 von `/de`, Cookie `en`), `pfad()`.
- Build-Log nach Push: Die fünf Seiten statisch gelistet.
- Live: Logs 24 h nach dem Deploy mit dem Befund von heute vergleichen (CPU je Pfad kalt und warm, Zahl der
  `exceededCpu`). Englisch und Deutsch je einmal im Browser, Umschalter, Abstimmen als Mitglied.

## 7. Risiken

- Großer Umbau: alle Seiten wandern in einen neuen Ordner, alle Links bekommen das Präfix.
- `next/root-params` und ISR unter OpenNext 1.20 sind live nicht erprobt. Der Plan beginnt deshalb mit
  einem kleinen Schritt: nur `/impressum` unter `[lang]` statisch, pushen, Logs prüfen. Erst dann der Rest.
