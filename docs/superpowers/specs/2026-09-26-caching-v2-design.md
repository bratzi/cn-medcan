# Caching v2 gegen Fehler 1102 — Design

**Stand:** 2026-09-26 (Session 22, Welle 1, Block W1-F) · **Status:** Entwurf, wartet auf Nutzerfreigabe
**Vorgänger:** `docs/superpowers/specs/2026-09-25-caching-design.md` (Cache Components, KV + D1-Tags) — gescheitert
bzw. zurückgenommen, siehe „Was schiefging“.
**Plan:** `docs/superpowers/plans/2026-09-26-caching-v2.md`

## Problem

Workers Free: 10 ms CPU je Request, Überschreitung = Fehler 1102 (`outcome: exceededCpu` im tail). Gemessen
(Session 19/20): /produkte 212 ms, /reviews 201 ms, /umfragen 78 ms; zuletzt **selbst /zugang** mit
`exceededCpu` bei 10 ms, obwohl die Seite weder Datenbank noch Sitzung anfasst. Cloudflare toleriert
Überschreitungen gelegentlich, deshalb läuft die Seite „meistens“. Workers Paid bleibt ausgeschlossen
(Regel „nie kostenpflichtig“).

## Was schiefging (nicht wiederholen)

| Versuch | Folge | Regel ab jetzt |
|---|---|---|
| `staticAssetsIncrementalCache` **zusammen mit** `enableCacheInterception` (98fe2db) | 1102 auf **jeder** Seite | Diese Kombination nie wieder. |
| KV-Incremental-Cache + D1-Tag-Cache mit `"remote": true` am D1-Binding (4d5195b) | Cloudflare-Build brach | Kein `"remote": true` an einem Binding in `wrangler.jsonc`. |
| Cache Components (`cacheComponents: true`) als großer Schalter über alle Seiten | nie live gemessen, Build braucht Daten | Kein Umbau vieler Seiten auf einmal. |

Gemeinsamer Fehler: große Schalter ohne vorherige Messung, die Ursache der CPU-Zeit blieb unbekannt.

## Neue Grundsätze

1. **Erst messen, dann ändern.** Schritt 0 ist ein einziger `wrangler tail` + curl-Lauf durch den Lead. Jeder
   folgende Schritt nennt eine erwartete Ersparnis und wird mit demselben Lauf nachgemessen.
2. **Daten cachen, nicht HTML.** Das HTML hängt bald vom Sprach-Cookie ab (i18n per Cookie, gleiche URLs,
   Nutzerentscheid Session 22) und schon heute von Rolle und Sitzung. Ein HTML-Cache müsste nach Sprache,
   Rolle und Sitzung schlüsseln — genau dort entstehen Datenlecks. Geteilte **Rohdaten** sind für alle gleich
   und sprachunabhängig (Inhalte bleiben in ihrer Sprache).
3. **Kleine, einzeln rücknehmbare Commits.** Jeder Schritt ist ein Commit, Rücknahme = `git revert <sha>`,
   keine Binding- oder Infrastrukturänderung in den ersten Schritten.
4. **Ohne neue Dienste zuerst.** Die ersten Schritte brauchen weder KV noch Cache API noch neue Bindings —
   nur Code im eigenen Worker. Plattform-Caches kommen erst, wenn Messung und Nutzerentscheid es tragen.

## CPU-Senken im Code (Befund, noch nicht gemessen)

Die Reihenfolge ist eine Einschätzung aus dem Code; Schritt 0 und 1 belegen oder widerlegen sie.

### S-1 Prisma- und Better-Auth-Instanz werden womöglich je Request neu gebaut

- `lib/prisma.ts:45` cacht den Client nur, solange **dasselbe Binding-Objekt** kommt
  (`globalerCache.prismaBinding === binding`). Ob workerd bzw. OpenNext (`getCloudflareContext`, Kontext je
  Request über `Symbol.for("__cloudflare-context__")`) je Request dasselbe `env.DB`-Objekt liefert, ist nicht
  belegt. Ist es jedes Mal neu, baut `lib/prisma.ts:49` je Request `new PrismaClient(...)`.
- Folgekosten: Der Prisma-7-Client (`runtime = "cloudflare"`, `@prisma/client/runtime/wasm-compiler-edge`)
  lädt den Query-Compiler als WASM (`lib/generated/prisma/internal/class.ts:43`), deserialisiert
  Parameterisierungsschema und Datenmodell im Konstruktor und hält seinen **Query-Plan-Cache je Instanz**
  (`queryPlanCache`, `queryPlanCacheMaxSize` im Runtime-Code). Neuer Client = leerer Plan-Cache = jede Abfrage
  wird erneut im WASM kompiliert.
- `lib/auth.ts:88` koppelt Better Auth an die Client-Identität: neuer Prisma-Client ⇒ `betterAuth({...})`
  wird in `lib/auth.ts:107` neu erzeugt (Endpunkte, Schemas, Adapter) — nur um eine Sitzung zu prüfen.
- Auch wenn der Client stabil ist: Der **erste** Request je Isolat zahlt WASM-Instanziierung, Plan-Kompilierung
  und das Nachladen der Routenmodule (OpenNext `routePreloadingBehavior: "none"`). Bei wenig Verkehr ist fast
  jeder Request ein erster — das würde erklären, warum sogar /zugang 1102 zeigt.

### S-2 Better Auth läuft auch für Besucher ohne Anmeldung

- `lib/session.ts:34-40` (`sitzung`) ruft immer `getAuth()` und `auth.api.getSession()`, auch wenn gar kein
  Better-Auth-Cookie mitkommt. Aufrufer im Request-Pfad jeder Startseite:
  `components/story/Abstimmung.tsx:19`, dazu `app/umfragen/page.tsx:68` und
  `app/api/benachrichtigungen/route.ts:12` — Letzteres fragt `KontoZaehler` (Kopf, Root-Layout) bei jedem
  Seitenwechsel ab (60 s sessionStorage-Deckel), also eine **zweite Worker-Invocation je Navigation**.
- `lib/session.ts:54` macht für Angemeldete bei **jedem Render** ein `prisma.mitglied.upsert(...)` — eine
  Schreibabfrage (D1-Write, Plan-Kompilierung, Ergebnis-Mapping), obwohl der Satz fast immer existiert.

### S-3 Keine Wiederverwendung geteilter Daten, dazu Doppelabfragen

- Alles ist `force-dynamic` (`app/page.tsx:21`, `app/produkte/page.tsx:27`, `app/produkte/[slug]/page.tsx:51`,
  `app/reviews/page.tsx:16`, `app/umfragen/page.tsx:24`, `app/apotheken/page.tsx:15`) und
  `open-next.config.ts:3` nutzt `defineCloudflareConfig()` ohne Overrides, also Incremental-, Tag-Cache und
  Queue = `"dummy"` (`node_modules/@opennextjs/cloudflare/dist/api/config.js:45-57`). Jede Seite rendert jedes
  Mal vollständig, auch vorgerenderte.
- **Startseite, anonym: rund 9 Prisma-Abfragen je Aufruf**, jede mit Plan-Kompilierung und Ergebnis-Mapping in JS:
  `ladeAromaVorzeige` (`lib/query/strains.ts:1072`, verschachtelt: Hersteller, Terpene→Terpen, bis 50 Reviews)
  und `ladeTerpenKatalog` (`lib/query/strains.ts:1140`, **ohne `take`**) aus `components/story/AromaSektion.tsx:15-18`,
  danach `erkundungsDaten(...)` mit JSON-Parse je Review (`components/story/AromaSektion.tsx:42`,
  `components/review/erkundung-daten.ts:30-44`); `neuesteRedaktionelleReview` (`lib/query/reviews.ts:142`);
  `communityZahlen` (`lib/query/umfragen.ts:270`); `aktiveUmfrage` + `umfrageLaden` (`lib/query/umfragen.ts:60-101`,
  3 Abfragen, davon 2 nacheinander); `ladeStrainListe` (`lib/query/strains.ts:438-457`, 2 Abfragen mit
  Terpenen und Beständen je Zeile) aus `components/story/Katalog.tsx:24`. Angemeldet kommen Sitzung,
  Mitglied-Upsert und `eigeneStimme` dazu.
- **Blütendetail doppelt:** `generateMetadata` lädt `ladeStrainDetail(slug, false)`
  (`app/produkte/[slug]/page.tsx:53-55`), die Seite danach erneut `ladeStrainDetail(slug, fachkreis)`
  (`app/produkte/[slug]/page.tsx:149`) — die schwerste Abfrage des Projekts (`lib/query/strains.ts:487`,
  Reviews `take: 50`, Bestände, Chargen) zweimal, ohne `cache()`.
- `/produkte`: `ladeFilterFacetten` = 7 Abfragen (`lib/query/strains.ts:719-777`) plus Liste, je Aufruf.
- `/zugang` liest `searchParams` (`app/zugang/page.tsx:12-13`) und ist damit dynamisch, obwohl der Inhalt fest ist.

### Kleinere Posten (nur mitnehmen, wenn ohnehin im Schritt)

- HMAC-Schlüssel wird je Prüfung neu importiert (`lib/gate.ts:32-44`), und das Gate-Token wird je Request
  zweimal geprüft: in `proxy.ts:19` und erneut in `lib/query/fachkreis.ts:27`.
- Der Proxy (`proxy.ts:35`) läuft auch vor `/api/benachrichtigungen` und vor jeder Seite.

## Ansatz

### Stufe A — Grundlast senken, ohne jeden Cache (Schritte 1–5 im Plan)

1. **Diagnose:** Neubau von Prisma- und Auth-Instanz einmal je Isolat protokollieren (eine `console.log`-Zeile
   mit Zähler) — belegt oder widerlegt S-1 im tail.
2. **Isolatweite Clients:** Prisma-Client und Better-Auth-Instanz einmal je Isolat, nicht mehr an die
   Identität des Binding-Objekts gekoppelt (das Binding zeigt je Deployment immer auf dieselbe D1). Bleibt
   innerhalb von `lib/prisma.ts`/`lib/auth.ts`, Zugriff weiter nur über `getEnv()` aus `lib/cloudflare.ts`.
3. **Anonym ohne Better Auth:** `sitzung()` prüft zuerst, ob überhaupt ein Better-Auth-Sitzungscookie
   (`better-auth.session_token` bzw. `__Secure-better-auth.session_token`) mitkommt; ohne Cookie `null`, ohne
   `getAuth()`. Sicherheitsneutral: ohne Cookie kann Better Auth ohnehin keine Sitzung finden.
4. **Kein Schreiben je Render:** `aktuellesMitglied()` liest mit `findUnique`; nur wenn der Satz fehlt, das
   bisherige `upsert` (Nachlegen nach abgebrochenem Hook bleibt erhalten).
5. **Doppelabfrage Blütendetail weg:** `generateMetadata` nutzt eine schlanke Abfrage (nur `handelsname`) oder
   beide Aufrufe teilen sich eine per React `cache()` gekapselte Ladefunktion.

### Stufe B — Datencache pro Isolat (Schritt 6)

`lib/memo.ts` mit `merke(schluessel, ttlMs, lader)`: begrenzte Map im Modulbereich (höchstens 64 Einträge,
älteste fliegen), speichert **nur aufgelöste, serialisierbare Werte** mit Ablaufzeit, nie eine offene
Promise über Request-Grenzen hinweg (workerd erlaubt kein I/O „im Namen eines anderen Requests“; eine in
Request A begonnene und in Request B erwartete Promise ist genau dieser Fall). Fehler werden nicht gecacht.

- Kandidaten (für alle gleich, keine Sitzung): `ladeTerpenKatalog`, `ladeAromaVorzeige`,
  `neuesteRedaktionelleReview`, `communityZahlen`, `aktiveUmfrage` (Zählstände dürfen nachlaufen,
  Nutzerentscheid 2026-09-25), `ladeStrainListe(leererFilter(), fachkreis)` für die Startseite,
  `ladeFilterFacetten(fachkreis)`, `ladeStrainDetail(slug, fachkreis)`, `redaktionelleReviews()`,
  `ladeApothekenListe()`.
- **Rolle als Teil des Schlüssels**, nie als Wert im Cache: `katalog:start:fk=1` und `…:fk=0` getrennt.
  Sitzungsbezogenes (`eigeneStimme`, `aktuellesMitglied`, Benachrichtigungen) wird nie gemerkt.
- Wache: statischer Test, dass keine Datei, die `merke(` aufruft, `lib/session`, `lib/query/fachkreis`,
  `cookies` oder `headers` importiert; `bestandSichtbarkeit()` bleibt die einzige Sichtbarkeitsgrenze.
- Invalidierung: Admin-Aktionen rufen `vergiss(praefix)` — wirkt nur im eigenen Isolat. Andere Isolate sehen
  die Änderung erst nach Ablauf der TTL. Deshalb ist die TTL eine **Nutzerentscheidung** (siehe unten).
- Speicher: Einträge sind klein (Katalog ≤ 24 Zeilen je Seite, Terpene ≈ 30), 64 Einträge liegen weit unter
  128 MB je Isolat.
- Warum nicht `"use cache"`: Der Default-Handler von Next ist ebenfalls ein In-Memory-LRU pro Instanz
  (`node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md:243-259`), verlangt aber
  `cacheComponents: true` — den großen Schalter, der den Build an Daten und Suspense-Umbauten bindet — und
  serialisiert gerenderte RSC-Ausgabe statt schlanker Daten. Gleicher Nutzen, deutlich mehr Risiko.
- Warum nicht `unstable_cache`: läuft über den Incremental Cache, der hier `"dummy"` ist; ohne neue Bindings
  wirkungslos.

### Stufe C — Statisch, was statisch ist (Schritt 7)

- `/zugang` ohne `searchParams` im Server: `weiter` und `fehler` liest eine kleine Client-Komponente aus
  `location.search` (ohne JavaScript: Ziel `/`, Fehlermeldung fehlt — Formular funktioniert weiter).
- `/impressum` und `/datenschutz` (kommen in Welle 1) von Anfang an ohne dynamische API (kein `cookies`,
  `headers`, `searchParams`, keine Sitzung), damit Next sie vorrendert.
- Ehrliche Grenze: Mit Incremental Cache `"dummy"` liefert OpenNext vorgerenderte Seiten **nicht** aus dem
  Build aus, sondern rendert bei Cache-Fehlgriff neu. Der Gewinn ist hier „billig rendern“, nicht „gar nicht
  rendern“. Null-CPU-Auslieferung braucht Stufe D.

### Stufe D — Plattform-Cache, nur nach Messung und Nutzerentscheid (Schritt 8, optional)

- **Cache API (`caches.default`)** für dieselben Daten wie Stufe B, colo-weit statt isolatweit. Laut
  Cloudflare-Doku wirkt die Cache API auf `*.workers.dev` nicht (Operationen ohne Effekt); die Seite läuft auf
  `cn-medcan.w-helwich.workers.dev`. **Vor Nutzung belegen** (Doku „How the Cache works“ / Cache API), sonst
  erst mit eigener Domain. Gilt ebenso für OpenNexts Regional Cache, der auf der Cache API aufsetzt.
- **`staticAssetsIncrementalCache` allein**, ohne `enableCacheInterception`, nur für vorgerenderte Seiten
  (/zugang, /impressum, /datenschutz): liefert Build-HTML über das ASSETS-Binding. Nie in Kombination mit
  Interception. Nur mit eigenem Messlauf vorher/nachher und nach ausdrücklicher Freigabe, weil die Kombination
  schon einmal alles gebrochen hat und nicht belegt ist, welcher Teil schuld war.
- **Nicht in diesem Design:** KV-Incremental-Cache, D1-Tag-Cache, DO-Queue, R2, Cache Components.
  `routePreloadingBehavior` (`onStart`/`withWaitUntil`) verschiebt das Nachladen der Routen nur in
  denselben ersten Request bzw. in `waitUntil` — ob `waitUntil`-CPU gegen die 10 ms zählt, ist nicht belegt;
  daher nicht einplanen.

## Erfolgskriterium

- Im Messlauf (Plan Schritt 0) hat jeder **warme** Aufruf (zweiter und folgende im selben Isolat) von `/`,
  `/produkte`, `/produkte/<slug>`, `/umfragen`, `/zugang`, `/api/benachrichtigungen` `outcome: "ok"` und
  `cpuTime` < 10 ms.
- Kalte Aufrufe dürfen darüber liegen (Cloudflare toleriert Ausreißer), sollen aber sinken; Zielgröße nach
  Messung festlegen.
- Kein Datenleck: Preise nur mit Fachkreis-Rolle, eigene Stimme sofort sichtbar, Admin-Freigaben spätestens
  nach TTL überall sichtbar, im eigenen Isolat sofort.
- Keine neuen Kosten, keine neuen Bindings in Stufe A–C.

## Offene Nutzerentscheide

1. **TTL des Datencaches (Stufe B):** 300 s (bisheriger Entscheid „bis 5 Minuten alt“) oder 60 s, weil
   Admin-Änderungen isolatübergreifend nur über die TTL ankommen.
2. **Eigene Domain** (Voraussetzung für Cache API und Regional Cache, nebenbei für Cloudflare Access):
   ja/nein/später.
3. **Stufe D `staticAssetsIncrementalCache` allein** für rein statische Seiten ausprobieren: ja/nein.
4. **Impressum und Datenschutz außerhalb des Passwort-Gates** (Proxy-Matcher-Ausnahme): spart den Proxy-Lauf
   und entspricht der Pflicht zur leichten Erreichbarkeit, sobald die Seite öffentlich ist — ja/erst beim
   Livegang.

## Risiken

- **Isolatweiter Client (Schritt 2):** Wenn ein D1-Binding-Objekt doch an einen Request gebunden ist, wirft
  der zweite Request „Cannot perform I/O on behalf of a different request“. Gegenmittel: Schritt 1 liefert
  zuerst den Befund; Rücknahme per Revert; alternativ Client mit dem Binding aus `cloudflare:workers` (`env`
  auf Modulebene, dann als Accessor in `lib/cloudflare.ts`).
- **Cookie-Abkürzung (Schritt 3):** Falscher Cookiename ⇒ Angemeldete erscheinen abgemeldet. Gegenmittel:
  Namen aus Better Auth ableiten (Präfix `better-auth`, `__Secure-` bei `useSecureCookies`), Test, Live-Prüfung
  angemeldet.
- **Veraltete Daten (Stufe B):** bis TTL; bewusst, siehe Entscheid 1.
- **Messung verzerrt durch Kaltstarts:** jeder Lauf mit mehreren Wiederholungen je URL, kalt/warm getrennt
  auswerten.
