---
name: edge-stack-master
description: Regelwerk "Edge-Optimierung" für diesen Medizinalcannabis-Produktkatalog auf Cloudflare Workers (Next.js 16 App Router + @opennextjs/cloudflare). Greift bei jeder Arbeit an wrangler.jsonc, Bindings und lib/cloudflare.ts, an Datenzugriff über D1/Prisma, an Caching und Revalidation, an der Runtime-Wahl einer Route, an Bundle-Größe und Imports im Request-Pfad sowie an Build, Preview und Deployment. Definiert die verbindlichen Grenzen, die Sicherheitsregel zur fehlenden Zugriffskontrolle in der Datenbank und die Abschluss-Checkliste.
---

# Edge-Stack-Master

Verbindliches Regelwerk für **diesen** Stack. Keine allgemeinen Edge-Ratschläge: alles hier bezieht sich auf
Worker `cn-medcan`, `main: ".open-next/worker.js"`, `@opennextjs/cloudflare` ^1.20.6, Next.js 16.3.6 / React 19,
Tailwind v4, Daten aus **Cloudflare D1** via Prisma (`@prisma/adapter-d1`).

Nicht Cloudflare Pages. Nicht `@cloudflare/next-on-pages` (deprecated). **Kein Supabase** — der Supabase-Pfad
(`@supabase/supabase-js`, `@supabase/ssr`, `lib/supabase/`, `supabase/rls.sql`) ist entfernt; er steht in der
Git-Historie. Baue nichts darauf und referenziere ihn nicht in neuem Code.

## 1. Workers-Limits und was daraus folgt

Belegte Werte (Quelle: https://developers.cloudflare.com/workers/platform/limits/):

| Limit | Free | Paid | Konsequenz für uns |
|---|---|---|---|
| CPU-Zeit pro Request | 10 ms | bis 5 min möglich, **Default 30 s** | CPU-Zeit ist reine Rechenzeit; Warten auf DB oder Fetch zählt nicht mit. 10 ms sind für SSR mit Markdown-Parsing oder großen Array-Transformationen zu wenig — auf Free gilt: keine Rechenarbeit im Request-Pfad, die sich in den Build oder in Cache verlagern lässt. |
| Sub-Requests pro Invocation | 50 | 10.000 | Jeder `fetch` und jeder Binding-Call zählt, also auch jede einzelne D1-Query. Eine Produktliste, die pro Zeile eine Query macht, sprengt auf Free eine Seite mit 50 Produkten allein durch die DB. |
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
um, schneidet damit Node-APIs weg, die unser Datenpfad (Prisma, `@prisma/adapter-d1`) braucht, und bringt
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

## 4. Datenzugriff: D1 + Prisma

Prisma läuft **ausschließlich serverseitig**. Kein Prisma-Import in einer Client Component.

**Der Client ist kein Modul-Singleton — und das ist kein Versehen.** D1 kommt als Binding und existiert erst
im Request-Kontext; auf Modulebene gibt es das Binding schlicht nicht. Deshalb ist `getPrisma()` in
`lib/prisma.ts` **async** und cacht den Client pro Isolate nur, solange dasselbe Binding-Objekt kommt.
Trotzdem gilt unverändert: nie ein `new PrismaClient()` in einer Page, Komponente oder einem Handler — der
einzige Weg zum Client ist `await getPrisma()`.

**Keine Verbindungs-URLs, keine Pools, keine Prepared-Statement-Fallen.** D1 ist SQLite hinter dem Binding:
kein Port, kein Passwort, kein Pooler. Der frühere Supabase-Abschnitt über Port 6543 gegen 5432 ist damit
gegenstandslos. Was stattdessen zählt, steht in `db/README.md`.

**Vier D1-Eigenheiten, die den Code formen** — wer sie übergeht, baut etwas, das lokal läuft und in
Produktion falsch ist:

1. **Keine echten Transaktionen.** Prisma führt `$transaction` gegen D1 als Einzelabfragen aus. Eindeutigkeit
   wird über **Unique-Indizes** abgesichert, nie über eine Transaktion. Wer "erst prüfen, dann schreiben"
   baut, hat eine Race Condition gebaut.
2. **Kein `mode: "insensitive"`.** Prisma bildet das auf SQLite nicht ab, ein `LOWER()` in der Query auch
   nicht. Freitextsuche läuft über die kleingeschriebene Spalte `strains.suchtext`, gefüllt beim Schreiben.
   Wer eine neue durchsuchbare Spalte einführt, erweitert `suchtext` — und füllt es im Seed mit.
3. **Kein Json-Typ.** `reviews.geschmacks_matrix` ist JSON-Text. Gelesen wird sie ausschließlich über
   `parseGeschmacksMatrix()` — das validiert und fällt auf eine Nullmatrix zurück —, nie mit rohem
   `JSON.parse` in einer Komponente.
4. **Kein Decimal.** Prozentwerte sind `Float`, Preise bleiben `Int` in Cent. Geld nie als Float.

**Migrationen** laufen hybrid über `prisma migrate diff` und `wrangler d1 migrations apply`. `prisma migrate
dev` gibt es auf diesem Pfad nicht. Die Wertprüfungen (`db/constraints.sql`) müssen **nach jeder Migration**
erneut ausgeführt werden, weil SQLite beim Tabellenumbau alle Trigger verwirft. Das steht ausführlich in
`db/README.md`; wer eine Migration schreibt, liest die Datei vorher.

**Query-Regeln:**
- Keine N+1. Relationen über `include`/`select` in **einer** Query holen, nicht in einer Schleife nachladen.
  Jede Query ist ein Sub-Request (§1).
- `select` gezielt statt Default-Vollprojektion. Wir holen keine Langtexte für eine Kachelliste.
- **Jede Listenabfrage hat ein `take`.** Nie unbounded. Auch "es sind doch nur 40 Produkte" nicht — es sind
  irgendwann 4000. Paginierung per Cursor (`cursor` + `take`), nicht `skip` über große Offsets.
- Aggregate über `count`/`groupBy` in der DB, nicht durch Laden und Zählen in JS (Memory, §1).
- Keine Query im Render-Pfad einer Client Component. Daten fließen von Server Components nach unten.

## 5. Die Datenbank kennt keine Zugriffskontrolle — Sicherheitsregel, nicht Stil

**D1 hat kein Row Level Security.** Es gibt keine Policies, keine Rollen, keine Nutzeridentität auf der
Verbindung. Jede Zeile, die der Worker lesen darf, liest er — unabhängig davon, wer den Request gestellt hat.

Unter Supabase war es faktisch genauso: Prisma verband als Eigentümer und umging RLS vollständig. Die
Policies wirkten ausschließlich auf dem `supabase-js`-Pfad, den es nicht mehr gibt. Der Verlust ist also
kleiner, als er klingt — aber er verschiebt die **gesamte** Verantwortung in die Abfrageschicht.

Daraus folgt bindend:
- **Die fachliche Sichtbarkeitsgrenze liegt in `lib/query/`, und zwar an genau einer Stelle je Regel.** Für
  das Fachkreis-Gate nach §10 HWG ist das `bestandSichtbarkeit()` in `lib/query/strains.ts`. Sie formuliert
  die Bedingung einmal, damit Filter, Ausgabe und Facetten nicht auseinanderlaufen.
- Eine neue Abfrage auf `pharmacy_stock` geht über diese Funktion. Ein handgeschriebenes `where` daneben ist
  **keine** Zugriffskontrolle, sondern ein Filter, der beim nächsten Refactor wegfällt, ohne dass etwas
  fehlschlägt. Der Fehlermodus ist stilles Datenleck, nicht ein Fehler.
- **Die Rolle kommt nie aus einem ungeprüften Request-Bestandteil.** Sie stammt ausschließlich aus dem
  HMAC-signierten Gate-Token (`lib/gate.ts`), gelesen über `istFachkreis()` — nicht aus einem
  Query-Parameter, nicht aus einem Header, nicht aus einem Cookie-Teil ohne Signaturprüfung.
- Mit Block B (Better Auth) kommen Schreibzugriffe dazu. **Jede Server Action prüft serverseitig Freigabe und
  Rolle**, bevor sie schreibt — nie im Client entscheiden. Eindeutigkeit über Unique-Index, nicht über
  Transaktion (§4).
- Die Wertprüfungen in `db/constraints.sql` sind Datenintegrität, keine Zugriffskontrolle. Sie halten Müll
  aus Spalten fern, sie verhindern nicht das Lesen fremder Zeilen.

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
- **Kein R2** (Nutzer 2026-09-25: Projekt strikt kostenfrei, R2 rechnet über dem Free-Tier ab). Incremental
  Cache stattdessen **KV** (Binding `NEXT_INC_CACHE_KV`) hinter dem **Regional Cache** (Cache API, spart
  KV-Lesezugriffe); Free-Plan-Grenzen sind hart (Fehler statt Rechnung), Revalidate-Intervalle so wählen,
  dass 1000 KV-Schreibvorgänge/Tag nie erreicht werden. Tag-Cache über **D1** (`NEXT_TAG_CACHE_D1`),
- ein **Service-Binding `WORKER_SELF_REFERENCE`**, das auf den eigenen Worker (`cn-medcan`) zeigt,
- für zeitbasierte Revalidation zusätzlich eine Durable-Object-Queue (`NEXT_CACHE_DO_QUEUE`), für
  On-Demand-Revalidation zusätzlich ein Tag-Cache-Binding,
- KV ist laut OpenNext wegen eventual consistency nur zweite Wahl; wir nehmen es bewusst in Kauf (Minuten alte
  Katalogdaten sind vertretbar, Preise/Fachkreis und eigene Stimmen bleiben dynamisch).

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
- [ ] Kein Bezug auf Supabase (`supabase-js`, `lib/supabase/`, RLS-Policies, Pooler-Ports).
- [ ] Keine schwere Library neu im Request-Pfad; Datums-/Zahlenformatierung über `Intl`, Formatter auf Modulebene.
- [ ] Client ausschließlich über `await getPrisma()`, kein `new PrismaClient()` irgendwo sonst; kein Prisma-Import in Client Code.
- [ ] Keine Annahme von Transaktionen; Eindeutigkeit über Unique-Index. Kein `mode: "insensitive"`, Freitext über `suchtext`.
- [ ] Nach einer Migration `db/constraints.sql` erneut ausgeführt (SQLite verwirft Trigger beim Tabellenumbau).
- [ ] Jede neue Listenabfrage hat `take` und gezieltes `select`; keine Query in einer Schleife.
- [ ] Sichtbarkeitsgrenze über die Helfer in `lib/query/`, nicht über ein handgeschriebenes `where` daneben; Rolle nur aus dem signierten Gate-Token.
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
- D1-Limits des Free-Tiers (Speicher, gelesene und geschriebene Zeilen pro Tag): die Zahlen stammen aus der
  Planungsphase und wurden hier nicht neu belegt. Vor einer Zusage gegen die Cloudflare-Doku prüfen.
- Verhalten von `@prisma/adapter-d1` bei sehr großen Ergebnismengen und die D1-Grenze für die Länge eines
  einzelnen Statements: nicht belegt.
- **`npm run cf-build` läuft auf diesem Windows-Rechner nicht durch**: OpenNext legt beim Bündeln Symlinks an,
  und das scheitert ohne aktivierten Entwicklermodus mit `EPERM`. `next build` läuft. Damit sind
  `npm run preview` (workerd) und `npm run deploy` derzeit ungetestet — siehe HANDOFF.md.
