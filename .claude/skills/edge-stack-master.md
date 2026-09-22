---
name: edge-stack-master
description: Regelwerk "Edge-Optimierung" für diesen Medizinalcannabis-Produktkatalog auf Cloudflare Workers (Next.js 16 App Router + @opennextjs/cloudflare). Greift bei jeder Arbeit an wrangler.jsonc, Bindings und lib/cloudflare.ts, an Datenzugriff über Supabase/Prisma, an Caching und Revalidation, an der Runtime-Wahl einer Route, an Bundle-Größe und Imports im Request-Pfad sowie an Build, Preview und Deployment. Definiert die verbindlichen Grenzen, die Sicherheitsregel zu RLS und die Abschluss-Checkliste.
---

# Edge-Stack-Master

Verbindliches Regelwerk für **diesen** Stack. Keine allgemeinen Edge-Ratschläge: alles hier bezieht sich auf
Worker `cn-medcan`, `main: ".open-next/worker.js"`, `@opennextjs/cloudflare` ^1.20.6, Next.js 16.3.6 / React 19,
Tailwind v4, Daten aus Supabase Postgres via Prisma (`@prisma/adapter-pg`) und `@supabase/supabase-js`.

Nicht Cloudflare Pages. Nicht `@cloudflare/next-on-pages` (deprecated). Nicht D1 — das `d1_databases`-Binding
`DB` in `wrangler.jsonc` ist Altlast und wird entfernt; baue nichts darauf und referenziere es nicht in neuem Code.

## 1. Workers-Limits und was daraus folgt

Belegte Werte (Quelle: https://developers.cloudflare.com/workers/platform/limits/):

| Limit | Free | Paid | Konsequenz für uns |
|---|---|---|---|
| CPU-Zeit pro Request | 10 ms | bis 5 min möglich, **Default 30 s** | CPU-Zeit ist reine Rechenzeit; Warten auf DB oder Fetch zählt nicht mit. 10 ms sind für SSR mit Markdown-Parsing oder großen Array-Transformationen zu wenig — auf Free gilt: keine Rechenarbeit im Request-Pfad, die sich in den Build oder in Cache verlagern lässt. |
| Sub-Requests pro Invocation | 50 | 10.000 | Jeder `fetch`, jeder Binding-Call, jeder Supabase-Roundtrip zählt. Eine Produktliste, die pro Zeile eine Query macht, sprengt auf Free eine Seite mit 50 Produkten allein durch die DB. |
| Simultan offene Verbindungen | 6 | 6 | Harte Parallelitätsgrenze. `Promise.all` über mehr als 6 Fetches bringt keinen Zeitgewinn; batche stattdessen in der Query. |
| Script-Größe | 64 MiB **unkomprimiert**, kein Limit auf die komprimierte Größe | dito | Die 64 MiB sind für unsere Größenordnung kein realistisches Risiko — das Bundle-Argument ist hier **Startup-/CPU-Zeit und Isolate-Speicher**, nicht das Größenlimit. Argumentiere nie mit einem "1 MB Gzip-Limit"; das gilt für Workers-Bundles in dieser Form nicht. |
| Memory pro Isolate | 128 MB | 128 MB | JS-Heap plus WASM. Keine vollständigen Datensätze in Modul-Scope-Caches laden, keine unbounded Maps als "Cache" im Modulkopf. |
| Env-Vars/Secrets pro Worker | 64 | 128, je ≤ 5 KB | Keine großen JSON-Blobs oder Zertifikate als Variable. |

**Import-Regeln, die daraus folgen** (gelten für jedes Modul, das aus einer Server Component, einem Route
Handler, einer Server Action oder Middleware erreichbar ist):

- Keine schweren Libraries im Request-Pfad. Konkret unerwünscht: `moment`, `lodash` als Vollimport
  (`import _ from "lodash"`), `date-fns` als Vollimport, `axios` (es gibt `fetch`).
- **Datum und Zahl über `Intl`**, nicht über eine Formatierungs-Library:
  `new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })`,
  `new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" })`.
  `Intl`-Instanzen sind im Konstruktor teuer — auf Modulebene einmal anlegen, nicht pro Tabellenzeile.
- Formatter, Regexes und Zod-Schemas auf Modulebene definieren, damit sie pro Isolate einmal gebaut werden.
- Node-Builtins nur nutzen, soweit `nodejs_compat` sie abdeckt. Nichts aus `fs`, `child_process`, `net`,
  `dns` im Request-Pfad — das läuft in `next dev` womöglich und fällt im Worker um.
- Ein Modul, das nur beim Build oder in einem Script gebraucht wird (Seed, Import, Migration), darf nicht
  aus einer Route importiert werden — sonst hängt sein ganzer Abhängigkeitsbaum im Worker-Bundle.
- Bei Verdacht auf Bundle-Zuwachs: `npm run cf-build` laufen lassen und die Ausgabe unter `.open-next/`
  ansehen, nicht nach Gefühl urteilen.

## 2. Runtime-Wahl

**`export const runtime = "edge"` wird in diesem Projekt nicht gesetzt.** Auch nicht "zur Sicherheit".
Wenn du es in einer Datei findest, entferne es.

Grund: OpenNext bündelt die Next.js-**Node.js**-Server-Runtime und lässt sie im Worker unter `nodejs_compat`
laufen. Das ist der Default und der unterstützte Pfad. `runtime = "edge"` schaltet Next auf die Edge-Runtime
um, schneidet damit Node-APIs weg, die unser Datenpfad (Prisma, `@prisma/adapter-pg`) braucht, und bringt
keinen Vorteil — der Code läuft bereits auf Workers, es gibt keine Lambda, der man entkommen müsste.

Die echten Stellschrauben pro Route sind stattdessen:
- **Rendering-Modus**: statisch vorrendern, wo die Daten nicht nutzerabhängig sind (`generateStaticParams`,
  statisches Segment) statt SSR pro Request.
- **`revalidate`-Zeit** — die Entscheidung, wie alt eine Katalogseite sein darf.
- **Zahl und Form der Queries** (§4) — das dominiert die Antwortzeit, nicht die Runtime-Wahl.
- **Streaming/Suspense**, um die erste Byte-Zeit von der langsamsten Query zu entkoppeln.

`compatibility_flags` bleiben `["nodejs_compat", "global_fetch_strictly_public"]`.
`global_fetch_strictly_public` heißt: ein `fetch` auf die eigene Domain geht über das öffentliche Netz —
kein Self-Fetch als interner Shortcut, für Worker-zu-Worker-Aufrufe ein Service-Binding nutzen.

## 3. Bindings

**Einziger Zugriffspunkt ist `lib/cloudflare.ts`** (`getEnv()`, `getEnvSync()`).
`getCloudflareContext()` wird nirgends sonst importiert — nicht in Components, nicht in Pages, nicht in
Route Handlern, nicht in anderen `lib/`-Modulen.

Begründung, beides zählt:
1. **Testbarkeit**: ein Modul, das `getCloudflareContext()` direkt zieht, ist ohne workerd nicht testbar.
   Über `lib/cloudflare.ts` ist genau eine Stelle zu mocken.
2. **Ein einziger Fehlerpfad**: fehlt ein Binding, soll die Fehlermeldung an einer Stelle formuliert sein und
   sagen, *welches* Binding fehlt und *wo* es zu konfigurieren ist. Sonst bekommt man pro Aufrufer ein
   anderes `undefined`-Symptom tief in der Renderphase.

Regeln:
- Neues Binding → Accessor in `lib/cloudflare.ts` ergänzen, der bei Abwesenheit mit klarer Meldung wirft.
- `getEnvSync()` nur im Request-Kontext (Route Handler, Server Action); auf Modulebene und im Build-Pfad
  `getEnv()` (async).
- Nach jeder Änderung an den Bindings in `wrangler.jsonc`: `npm run cf-typegen`, damit `CloudflareEnv` stimmt.
- Binding-Typen kommen aus `cloudflare-env.d.ts`, nicht aus handgeschriebenen Interfaces.

## 4. Datenzugriff: Supabase + Prisma

Prisma läuft **ausschließlich serverseitig**. Kein Prisma-Import in einer Client Component.

**Singleton pro Isolate.** Der Prisma-Client mit `@prisma/adapter-pg` wird einmal pro Isolate erzeugt und
über Requests hinweg wiederverwendet — nicht pro Request neu instanziiert. Ein neuer Client pro Request
bedeutet Adapter-Setup und Verbindungsaufbau pro Request und frisst genau die CPU-Zeit aus §1. Muster:
Modul-Scope-Variable mit Lazy-Init in `lib/`, nie ein `new PrismaClient()` in einer Page oder einem Handler.

**Pooler-Port, und der klassische Fehler.** Belegt über
https://supabase.com/docs/guides/database/connecting-to-postgres :
- **Runtime im Worker → Transaction-Pooler, Port 6543.** Workers können keine dauerhaften TCP-Pools halten:
  Isolates sind kurzlebig, können jederzeit verworfen werden, und es laufen viele parallel. Eine
  Direktverbindung pro Isolate erschöpft die Postgres-Verbindungen. Der Transaction-Pooler ist ausdrücklich
  für serverless/edge gedacht, weil dort viele kurzlebige Verbindungen entstehen.
- **Migrationen → Direktverbindung, Port 5432.** `prisma migrate` braucht eine Session mit nativen
  Postgres-Kommandos; das ist im Transaction-Mode nicht möglich.
- **Der klassische Fehler ist, für beides eine einzige URL zu benutzen.** Entweder laufen Migrationen gegen
  den Pooler und scheitern mit unklaren Fehlern (Advisory-Locks, Prepared-Statement-Fehler), oder die
  Runtime verbindet direkt und erschöpft unter Last die Verbindungen. Also: zwei getrennte Variablen —
  Runtime-URL (6543) und Migrations-/Direct-URL (5432) — und wer eine Migration ausführt, prüft vorher,
  welche er zieht.
- Der Session-Pooler läuft ebenfalls auf 5432 und ist nicht unser Runtime-Pfad.

**Prepared Statements sind im Transaction-Pooling-Modus nicht verfügbar** (gleiche Quelle; Supabase nennt
Prisma dort ausdrücklich). Konsequenzen:
- In der Runtime-Verbindung muss die Prepared-Statement-Nutzung abgeschaltet sein, sonst gibt es sporadische
  Fehler, die erst unter Parallelität auftreten und lokal nie reproduzieren.
- Kein Performance-Gewinn aus Statement-Wiederverwendung erwarten — jede Query wird geplant. Das ist ein
  weiteres Argument für wenige, gezielte Queries statt viele kleine.

**Query-Regeln:**
- Keine N+1. Relationen über `include`/`select` in **einer** Query holen, nicht in einer Schleife nachladen.
  Jede Query ist ein Sub-Request (§1).
- `select` gezielt statt Default-Vollprojektion. Wir holen keine Langtexte für eine Kachelliste.
- **Jede Listenabfrage hat ein `take`.** Nie unbounded. Auch "es sind doch nur 40 Produkte" nicht — es sind
  irgendwann 4000. Paginierung per Cursor (`cursor` + `take`), nicht `skip` über große Offsets.
- Aggregate über `count`/`groupBy` in der DB, nicht durch Laden und Zählen in JS (Memory, §1).
- Keine Query im Render-Pfad einer Client Component. Daten fließen von Server Components nach unten.

## 5. RLS-Grenze — Sicherheitsregel, nicht Stil

**Prisma verbindet mit der Service-Rolle und umgeht damit Row Level Security vollständig.** Jede Zeile, die
Prisma lesen kann, liest es — unabhängig davon, welcher Nutzer den Request gestellt hat.

Daraus folgt bindend:
- **Alles, was pro Nutzer gefiltert werden muss, läuft über `@supabase/supabase-js` mit dem Nutzer-JWT**,
  damit die RLS-Policies in Postgres greifen. Nicht über Prisma mit einem selbstgeschriebenen
  `where: { userId }`.
- Ein `where: { userId }` in Prisma ist **keine** Zugriffskontrolle, sondern ein Filter, der beim nächsten
  Refactor oder in einem vergessenen Zweig wegfällt, ohne dass etwas fehlschlägt. Der Fehlermodus ist
  stilles Datenleck, nicht ein Fehler.
- Prisma ist zulässig für Aufgaben, die legitim **ohne** Nutzerkontext laufen: Katalog- und
  Produktstammdaten, Terpen-/Referenztabellen, statische Generierung und `generateStaticParams`, Seeds,
  Importe, Migrationen, Aggregate über öffentlich sichtbare Daten, interne Wartungsjobs.
- Der Supabase Service-Role-Key gehört nie in Client-Code und nie in eine `NEXT_PUBLIC_*`-Variable (§7).
- Bei neuen Tabellen mit nutzerbezogenen Daten: RLS aktivieren und Policies schreiben, auch wenn der
  aktuelle Zugriff nur über Prisma läuft. RLS ist die letzte Verteidigungslinie, nicht der Ersatz für sie.

## 6. Caching-Kaskade

Reihenfolge der Prüfung — nimm immer die **oberste** Stufe, die die Anforderung erfüllt:

1. **Statische RSC-Ausgabe (Build-Zeit).** Daten ändern sich nur mit einem Deploy oder selten und sind für
   alle gleich: Produktdetailseiten, Terpen-Profile, rechtliche Seiten. `generateStaticParams` + statisches
   Rendering. Null CPU-Zeit und null Sub-Requests im Request-Pfad. Für einen Produktkatalog ist das der
   Normalfall, nicht die Ausnahme.
2. **`revalidate` / `unstable_cache` (ISR).** Daten für alle Nutzer gleich, dürfen aber Minuten alt sein:
   Katalogliste, Verfügbarkeiten, Preise. Segment-`export const revalidate = <s>` für eine ganze Seite,
   `unstable_cache` für eine einzelne teure Funktion mit eigenen Tags. On-Demand-Invalidierung über
   `revalidateTag`/`revalidatePath`, wenn ein Import- oder Admin-Vorgang Daten ändert.
3. **Cache API** (`caches.default`). Für das, was Next nicht abdeckt: eigener Route Handler, Antwort auf
   einen Upstream-Fetch, generierte Bild- oder JSON-Antwort mit explizit gebautem Cache-Key. Colo-lokal,
   nicht global — gut für Wiederholungen aus derselben Region, kein Ersatz für ISR.
4. **KV.** Nur für klein, heiß gelesen, selten geschrieben und tolerant gegenüber Verzögerung bis zur
   globalen Sichtbarkeit: Feature-Flags, Konfigurations-Snapshots, Redirect-Maps. **Nicht** für Preise,
   Bestände oder alles, wo eine veraltete Antwort ein fachliches Problem ist — KV ist eventually consistent.

Nicht cachen: nutzerbezogene Antworten (§5), alles hinter Auth, alles mit `Set-Cookie`.

**Wenn ISR genutzt wird, braucht OpenNext eigene Infrastruktur** (Quelle: https://opennext.js.org/cloudflare/caching):
- ein **R2-Bucket** mit Binding **`NEXT_INC_CACHE_R2_BUCKET`** als Incremental Cache (optional
  `NEXT_INC_CACHE_R2_PREFIX`, Default `incremental-cache`),
- ein **Service-Binding `WORKER_SELF_REFERENCE`**, das auf den eigenen Worker (`cn-medcan`) zeigt,
- für zeitbasierte Revalidation zusätzlich eine Durable-Object-Queue (`NEXT_CACHE_DO_QUEUE`), für
  On-Demand-Revalidation zusätzlich ein Tag-Cache-Binding,
- KV ist als Incremental-Cache-Backend laut OpenNext **nicht empfohlen** (eventual consistency).

Konsequenz: Eine Änderung, die `revalidate` oder `unstable_cache` einführt, ohne diese Bindings in
`wrangler.jsonc` und die OpenNext-Cache-Konfiguration zu ergänzen, ist unvollständig — es "funktioniert" in
`next dev` und fällt im Worker still zurück oder um. Beides zusammen ändern oder gar nicht.

## 7. Secrets

- **Niemals in `wrangler.jsonc`.** Die Datei ist versioniert. Kein Service-Role-Key, kein
  Datenbank-Passwort, kein API-Token unter `vars`.
- Produktion: `wrangler secret put <NAME>`. Lokal: **`.dev.vars`**, und `.dev.vars` steht in `.gitignore`.
- `NEXT_PUBLIC_*` wird in das Client-Bundle eingebacken und ist damit **öffentlich**. Dort darf nur hinein,
  was auf einer Visitenkarte stehen könnte: Supabase-Projekt-URL und der Anon-Key (der ist für
  RLS-gebundenen Zugriff gedacht). **Nie** der Service-Role-Key, nie eine Datenbank-URL, nie ein Admin-Token.
- Datenbank-URLs (Pooler und Direct) sind Secrets, beide.
- Ein Secret, das versehentlich committet wurde, ist kompromittiert: rotieren, nicht nur löschen.

## 8. Deploy-Gate

In dieser Reihenfolge, jeder Schritt grün, bevor der nächste läuft:

1. `npm run typecheck` — grün. Nach Binding-Änderungen vorher `npm run cf-typegen`.
2. `npm run cf-build` (`opennextjs-cloudflare build`) — grün. `next build` allein reicht nicht: der
   OpenNext-Schritt ist der, der bei Node-Inkompatibilitäten und Bundling-Problemen bricht.
3. `npm run preview` — das ist **workerd**, nicht `next dev`. Smoke-Test der betroffenen Pfade: Startseite,
   eine Katalogliste, eine Produktdetailseite, jeder geänderte Route Handler. Konsole auf Runtime-Fehler
   prüfen. Dieser Schritt ist nicht optional — er ist der einzige, der Binding- und Runtime-Fehler vor dem
   Deploy zeigt.
4. Erst dann `npm run deploy`.

Ein Deploy, das sich nur auf `next dev` stützt, gilt als ungetestet: `next dev` läuft in Node, nicht in workerd.

## 9. Zugriffsschutz der Dev-Umgebung

Die private `.dev`-Subdomain liegt hinter **Cloudflare Access (Zero Trust)** mit **One-time PIN per E-Mail**.
Access authentifiziert vor dem Worker; der Worker braucht dafür **keine eigene Auth-Logik** — keine
Login-Seite, kein Passwort-Middleware-Hack, kein Basic-Auth.

Ergänzend, weil der Worker über `workers.dev` oder eine andere Route eventuell direkt erreichbar bleibt:
Die Absicherung ist erst vollständig, wenn der Worker den Header **`Cf-Access-Jwt-Assertion`** validiert —
Signatur gegen die öffentlichen Schlüssel des Zero-Trust-Teams, `aud` gegen die Application-AUD, plus
Ablaufprüfung. Fehlt oder ist das Token ungültig, antwortet der Worker 403 statt Inhalte auszuliefern.
Ein selbst gesetzter Header ist kein Nachweis; nur das verifizierte JWT ist einer.

Diese Validierung gehört hinter einen Schalter (Umgebungsvariable), damit `npm run preview` lokal nicht
gegen sie läuft; ihr AUD-/Secret-Wert wird nach §7 behandelt.

## 10. Abschluss-Checkliste

Vor dem Fertigmelden einer Edge-Aufgabe jeden Punkt tatsächlich prüfen — nicht aus dem Gedächtnis bejahen:

- [ ] Kein `export const runtime = "edge"` hinzugefügt oder stehen gelassen.
- [ ] Kein `getCloudflareContext()` außerhalb von `lib/cloudflare.ts`.
- [ ] Kein neues D1-Artefakt, kein Bezug auf das Alt-Binding `DB`.
- [ ] Keine schwere Library neu im Request-Pfad; Datums-/Zahlenformatierung über `Intl`, Formatter auf Modulebene.
- [ ] Prisma-Client als Singleton, kein `new PrismaClient()` pro Request; kein Prisma-Import in Client Code.
- [ ] Runtime-Verbindung über Transaction-Pooler 6543 mit deaktivierten Prepared Statements; Migrationen über Direktverbindung 5432.
- [ ] Jede neue Listenabfrage hat `take` und gezieltes `select`; keine Query in einer Schleife.
- [ ] Nutzerbezogene Daten über `supabase-js` mit Nutzer-JWT, nicht über Prisma mit `where`-Filter.
- [ ] Caching auf der obersten passenden Stufe; wenn ISR neu genutzt wird, sind `NEXT_INC_CACHE_R2_BUCKET` und `WORKER_SELF_REFERENCE` konfiguriert.
- [ ] Keine Secrets in `wrangler.jsonc`; nichts Geheimes unter `NEXT_PUBLIC_*`.
- [ ] Nach Binding-Änderung `npm run cf-typegen` gelaufen.
- [ ] `npm run typecheck` grün.
- [ ] `npm run cf-build` grün.
- [ ] `npm run preview` gestartet und die betroffenen Pfade in workerd manuell geprüft.
- [ ] Bericht nennt, was in workerd getestet wurde und was ungetestet bleibt.

## Ungeprüft — vor Nutzung nachrecherchieren

Diese Punkte sind hier bewusst ohne Zahl formuliert, weil sie nicht belegt wurden:

- Startup-/Kaltstart-CPU-Budget für die Modulauswertung eines Workers: keine Zahl genannt. Wenn es für eine
  Entscheidung zählt, aktuelle Cloudflare-Doku prüfen.
- Größenlimits einzelner Cache-API-Einträge und KV-Werte: nicht belegt, vor Nutzung nachsehen.
- Die genaue Adapter-/Connection-String-Option zum Abschalten der Prepared Statements: gegen die installierte
  `@prisma/adapter-pg`-Version prüfen, nicht aus dem Gedächtnis setzen.
- Aktueller Stand des Repos: `package.json` enthält (noch) `drizzle-orm`/`drizzle-kit` und D1-Scripts, aber
  kein `@prisma/*` und kein `@supabase/supabase-js`. Die Regeln in §4 und §5 gelten ab dem Zeitpunkt, an dem
  der Supabase/Prisma-Pfad eingezogen ist; vorher prüfen, was tatsächlich installiert ist.
