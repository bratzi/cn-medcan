# Statische Seiten (Sprache als internes Pfadsegment) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Startseite, `/reviews`, `/impressum`, `/datenschutz` und `/zugang` kommen je Sprache aus dem Cache (ISR über KV) statt bei jedem Aufruf neu gerendert zu werden, damit der Worker seltener mit 1102 am CPU-Limit scheitert.

**Architecture:** Alle Seiten wandern unter `app/[lang]/`. Der Proxy bestimmt die Sprache wie heute (Cookie, sonst `Accept-Language`) und schreibt jede Seitenanfrage intern auf `/de/…` oder `/en/…` um; sichtbare URLs und Links bleiben gleich. Server Components lesen die Sprache aus `next/root-params`, Server Actions und Route Handler aus der Anfrage. Fünf Seiten schalten per `dynamic = "force-static"` plus `revalidate` auf ISR; was auf der Startseite vom Betrachter abhängt, holt der Browser über einen Endpunkt `/api/startseite`.

**Tech Stack:** Next.js 16.3 (App Router, `proxy.ts`, `next/root-params`), `@opennextjs/cloudflare` 1.20 (KV-Incremental-Cache, Regional Cache, memoryQueue, Cache-Interception), Cloudflare Workers Free, D1 über Prisma 7, Tests mit `node:test` über `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-01-statische-seiten-sprache-in-url-design.md`

## Global Constraints

- Nie kostenpflichtig: nur KV Free und ein Service-Binding; kein R2, keine Durable Objects, kein Paid-Plan.
- Kein lokales Dev-System: kein `next dev`, kein `next build`, kein `opennextjs-cloudflare preview`, keine Hintergrund-Server. Lokal nur `npm test`, `npm run typecheck`, `npm run lint`, `npm run typegen` (erzeugt nur Typen).
- Prüfweg ist der Push nach `main` (Workers Builds baut ~13 min). Nur an den zwei Prüfpunkten pushen (Task 6, Task 10), danach mindestens 15 min keinen Code pushen. Auf den Build nicht pollen: einmal im Hintergrund warten, dann einmal prüfen.
- Netz schonen: ein Push, keine Wiederholung bei Netzfehler; bei Netzfehler sofort stoppen und melden.
- Repo ist öffentlich: keine Secrets in getrackten Dateien. Die KV-Namespace-ID ist kein Secret.
- Dateien mit CRLF nie mit `sed -i` bearbeiten. Edit-Tool oder Node-Skripte, die nur Teilstrings ersetzen.
- Pfade mit eckigen Klammern in der Shell immer in Anführungszeichen (`"app/[lang]"`), sonst greift das Glob.
- Sprachregel unverändert: `bestimmeSprache` (Cookie `sprache`, sonst `Accept-Language` bei `I18N_OEFFENTLICH`, sonst `de`).
- Sichtbare URLs, Links und Weiterleitungen im Code bleiben unverändert.
- Kommentare und Commit-Texte auf Deutsch in normaler Prosa, Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Skills je Task laden: immer `edge-stack-master`; bei Proxy, Cache und OpenNext zusätzlich `cloudflare:nextjs-on-cloudflare` und `cloudflare:workers-best-practices`; bei Dateien unter `app/**` und `components/**` `ui-design-engine`; für die Testreihenfolge `superpowers:test-driven-development`.
- Das Regelwerk `edge-stack-master` verlangt lokal `cf-build` und `preview`. Das ersetzt hier die Dauerregel des Nutzers durch die Live-Prüfung an den Prüfpunkten.

## Review Focus

1. Eine Server Action auf einer statischen Seite (Abstimmen auf der Startseite, Bild beitragen) oder ein Route Handler ruft `next/root-params` auf. Erwartet: Actions und Route Handler laden nichts aus `@/lib/i18n` oder `lib/i18n/sprache.ts`. Test: Task 3, `tests/i18n-anfrage.test.ts`.
2. Abgemeldeter Aufruf einer gecachten Seite. Erwartet: Umleitung auf `/zugang`, nie der Cache-Inhalt. Tests: Task 2 (`istOhneGate("/")` ist `false`), Task 5 (Gate vor dem Rewrite im Proxy), live in Task 6.
3. Scanner-Pfade mit Punkt (`/wp-login.php`). Erwartet: Sie laufen durch den Proxy und enden am Gate oder im dynamischen 404, nie als Cache-Eintrag. Tests: Task 2 (`istOhneGate`), Task 5 (Matcher in `tests/rechtliches.test.ts`).
4. Englisch per `Accept-Language` ohne Cookie auf einer statischen Seite. Erwartet: der englische Cache-Eintrag (`/en/…`), nicht der deutsche. Tests: Task 2 (`internerPfad`), Task 5 (Proxy liest `accept-language`), live in Task 6.
5. Die statische Startseite (bis 300 s alt) zeigt eine andere Runde als die laufende. Erwartet: ein Link „Zur Abstimmung“ statt eines falschen Stimmzustands. Test: Task 7 (`stimmzettelAnzeige` mit fremder Runde).

---

### Task 1: Cache-Infrastruktur (KV, Service-Binding, OpenNext)

**Files:**
- Create: `tests/cache-infrastruktur.test.ts`
- Modify: `wrangler.jsonc` (nach dem Block `d1_databases`)
- Modify: `open-next.config.ts` (ganze Datei)
- Modify: `cloudflare-env.d.ts:4-13` (`interface __BaseEnv_CloudflareEnv`)
- Modify: `next.config.ts` (letzte Zeilen, Aufruf von `initOpenNextCloudflareForDev`)

**Interfaces:**
- Consumes: nichts.
- Produces: Binding `NEXT_INC_CACHE_KV` (KV) und `WORKER_SELF_REFERENCE` (Service) im Worker; OpenNext-Konfiguration mit KV-Cache, memoryQueue, Cache-Interception. `npm run typegen` startet kein workerd mehr (Voraussetzung für Task 5).

- [ ] **Step 1: Failing test schreiben**

`tests/cache-infrastruktur.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei: string) => readFileSync(datei, "utf8");

// Spec 2026-10-01 (statische Seiten), 4.4: ISR braucht KV, das Service-Binding fuer die
// Revalidierung und die OpenNext-Konfiguration zusammen, sonst faellt der Cache im Worker
// still aus (edge-stack-master, Abschnitt 6).
test("ISR-Infrastruktur: KV, Service-Binding und OpenNext-Konfiguration gehören zusammen", () => {
  const wrangler = lies("wrangler.jsonc");
  assert.match(wrangler, /"binding": "NEXT_INC_CACHE_KV",\s*"id": "[0-9a-f]{32}"/);
  assert.match(wrangler, /"binding": "WORKER_SELF_REFERENCE",\s*"service": "cn-medcan"/);
  assert.doesNotMatch(wrangler, /r2_buckets|durable_objects/);

  const config = lies("open-next.config.ts");
  assert.match(config, /withRegionalCache\(kvIncrementalCache/);
  assert.match(config, /shouldLazilyUpdateOnCacheHit: false/);
  assert.match(config, /queue: memoryQueue/);
  assert.match(config, /enableCacheInterception: true/);
  assert.doesNotMatch(config, /r2IncrementalCache|doQueue|tagCache/);
});

test("next typegen startet kein lokales workerd", () => {
  assert.match(
    lies("next.config.ts"),
    /if \(process\.env\.NODE_ENV === "development"\) void initOpenNextCloudflareForDev\(\);/,
  );
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/cache-infrastruktur.test.ts`
Expected: FAIL, beide Tests (kein `NEXT_INC_CACHE_KV` in `wrangler.jsonc`, kein Guard in `next.config.ts`).

- [ ] **Step 3: KV-Namespace per Cloudflare-MCP anlegen (idempotent)**

Tool `mcp__plugin_cloudflare_cloudflare__execute` (Schema vorher per `ToolSearch` mit `select:mcp__plugin_cloudflare_cloudflare__execute` laden), Code:

```js
async () => {
  const titel = "cn-medcan-next-inc-cache";
  const liste = await cloudflare.request({
    method: "GET",
    path: `/accounts/${accountId}/storage/kv/namespaces`,
    query: { per_page: 100 },
  });
  const vorhanden = (liste.result ?? []).find((ns) => ns.title === titel);
  if (vorhanden) return { id: vorhanden.id, neu: false };
  const neu = await cloudflare.request({
    method: "POST",
    path: `/accounts/${accountId}/storage/kv/namespaces`,
    body: { title: titel },
  });
  return { id: neu.result.id, neu: true };
}
```

Expected: `{ id: "<32 Hex-Zeichen>", neu: true }`. Die `id` für Step 4 notieren. Scheitert der Aufruf (Auth-Fehler): stoppen und den Nutzer bitten, `npx.cmd wrangler kv namespace create cn-medcan-next-inc-cache` auszuführen und die ID zu nennen.

- [ ] **Step 4: Bindings in `wrangler.jsonc` eintragen**

Mit dem Edit-Tool den Abschluss des D1-Blocks ersetzen. Alt:

```jsonc
			"migrations_dir": "migrations"
		}
	]
```

Neu (die ID aus Step 3 einsetzen, sie besteht aus 32 Hex-Zeichen):

```jsonc
			"migrations_dir": "migrations"
		}
	],

	// Cache fuer statische Seiten (ISR, Spec 2026-10-01): OpenNext legt gerenderte
	// Seiten in KV ab. Free-Plan: 1000 Schreibvorgaenge am Tag, hart begrenzt, keine
	// Kosten. Die ID ist kein Geheimnis. Angelegt per Cloudflare-API am 2026-10-01.
	"kv_namespaces": [
		{
			"binding": "NEXT_INC_CACHE_KV",
			"id": "ID_AUS_STEP_3"
		}
	],

	// Zeitbasierte Revalidierung: OpenNexts memoryQueue ruft den eigenen Worker
	// ueber dieses Service-Binding auf (Spec 2026-10-01, 4.4). Kostenlos.
	"services": [
		{
			"binding": "WORKER_SELF_REFERENCE",
			"service": "cn-medcan"
		}
	]
```

`ID_AUS_STEP_3` durch die echte ID ersetzen; danach darf der Text `ID_AUS_STEP_3` nirgends mehr stehen.

- [ ] **Step 5: `open-next.config.ts` ersetzen**

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

/**
 * Cache fuer statische Seiten (Spec docs/superpowers/specs/2026-10-01-statische-seiten-sprache-in-url-design.md, 4.4).
 *
 * - KV statt R2: das Projekt bleibt kostenfrei, die Free-Grenzen sind hart.
 * - Regional Cache (Cache API) vor KV spart KV-Lesezugriffe. Ohne Nachladen bei
 *   jedem Treffer: das kostete je Aufruf einen KV-Lesezugriff und CPU im
 *   waitUntil, und CPU ist hier der Engpass (Fehler 1102).
 * - memoryQueue fuer die zeitbasierte Revalidierung ueber das Service-Binding
 *   WORKER_SELF_REFERENCE; keine Durable Objects.
 * - Kein Tag-Cache: es wird nur nach Zeit revalidiert.
 * - Cache-Interception liefert Treffer, ohne den Next-Server zu laden. Der
 *   Proxy (Passwort-Gate) laeuft vorher (OpenNext core/routingHandler.js).
 */
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(kvIncrementalCache, {
    mode: "long-lived",
    shouldLazilyUpdateOnCacheHit: false,
  }),
  queue: memoryQueue,
  enableCacheInterception: true,
});
```

- [ ] **Step 6: Typen der Bindings ergänzen**

In `cloudflare-env.d.ts` (generierte Datei, nur von Hand ergänzen, nicht neu erzeugen: der Generator verlöre die von Hand ergänzten Secret-Typen) im `interface __BaseEnv_CloudflareEnv` nach `BETTER_AUTH_SECRET: string;` einfügen:

```ts
	NEXT_INC_CACHE_KV: KVNamespace;
	WORKER_SELF_REFERENCE: Fetcher;
```

- [ ] **Step 7: `initOpenNextCloudflareForDev` nur in `next dev`**

In `next.config.ts` die letzten Zeilen ersetzen. Alt:

```ts
// Bindings (IMAGES, Secrets, ...) auch in `next dev` verfuegbar machen.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
```

Neu:

```ts
// Bindings (IMAGES, Secrets, ...) auch in `next dev` verfuegbar machen. Nur dort:
// `next typegen` und `next build` laden diese Datei ebenfalls und sollen kein
// lokales workerd starten (Plan 2026-10-01, statische Seiten).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.NODE_ENV === "development") void initOpenNextCloudflareForDev();
```

- [ ] **Step 8: Tests und Typprüfung**

Run: `npx tsx --test tests/cache-infrastruktur.test.ts`
Expected: PASS (2 Tests).

Run: `npm run typecheck`
Expected: keine Fehler.

- [ ] **Step 9: Commit (nicht pushen)**

```bash
git add tests/cache-infrastruktur.test.ts wrangler.jsonc open-next.config.ts cloudflare-env.d.ts next.config.ts
git commit -m "feat(cache): KV-Cache, Service-Binding und Cache-Interception für ISR

Grundlage für statische Seiten (Spec 2026-10-01): OpenNext legt gerenderte Seiten
in KV ab, der Regional Cache spart Lesezugriffe, die memoryQueue revalidiert über
das Service-Binding. next.config startet workerd nur noch in next dev.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Proxy-Regeln als reine Funktionen

**Files:**
- Create: `lib/proxy-regeln.ts`
- Create: `tests/proxy-regeln.test.ts`

**Interfaces:**
- Consumes: `type Sprache` aus `lib/i18n/sprache-kern.ts`.
- Produces:
  - `istOhneGate(pfad: string): boolean`
  - `istApiPfad(pfad: string): boolean`
  - `internerPfad(sprache: Sprache, pfad: string): string`
  - `ohneSprachPraefix(pfad: string): string`

- [ ] **Step 1: Failing test schreiben**

`tests/proxy-regeln.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { internerPfad, istApiPfad, istOhneGate, ohneSprachPraefix } from "@/lib/proxy-regeln";

test("Ohne Passwort: Login, Rechtsseiten, Sprachwechsel", () => {
  for (const pfad of ["/zugang", "/impressum", "/datenschutz", "/api/zugang", "/api/sprache"]) {
    assert.equal(istOhneGate(pfad), true, pfad);
  }
});

test("Alles andere liegt hinter dem Passwort, auch API, interne Pfade und Scanner-Pfade", () => {
  const geschuetzt = [
    "/",
    "/reviews",
    "/umfragen",
    "/blueten/x",
    "/mitglied",
    "/admin",
    "/api",
    "/api/startseite",
    "/api/benachrichtigungen",
    "/wp-login.php",
    "/zugangsdaten",
    "/de/impressum",
  ];
  for (const pfad of geschuetzt) assert.equal(istOhneGate(pfad), false, pfad);
});

test("API-Pfade: nur /api und darunter", () => {
  assert.equal(istApiPfad("/api"), true);
  assert.equal(istApiPfad("/api/startseite"), true);
  assert.equal(istApiPfad("/apotheken"), false);
  assert.equal(istApiPfad("/apix"), false);
  assert.equal(istApiPfad("/"), false);
});

test("Interner Pfad: Sprache als erstes Segment", () => {
  assert.equal(internerPfad("de", "/"), "/de");
  assert.equal(internerPfad("en", "/"), "/en");
  assert.equal(internerPfad("de", "/reviews"), "/de/reviews");
  assert.equal(internerPfad("en", "/blueten/amp-classic-25-1"), "/en/blueten/amp-classic-25-1");
  // Von außen aufgerufene interne Pfade gehen nicht durch, sie landen im 404.
  assert.equal(internerPfad("de", "/de/reviews"), "/de/de/reviews");
});

test("ohneSprachPraefix kehrt internerPfad um und lässt Wörter in Ruhe", () => {
  for (const sprache of ["de", "en"] as const) {
    for (const pfad of ["/", "/reviews", "/blueten/x"]) {
      assert.equal(ohneSprachPraefix(internerPfad(sprache, pfad)), pfad);
    }
  }
  assert.equal(ohneSprachPraefix("/denkmal"), "/denkmal");
  assert.equal(ohneSprachPraefix("/english"), "/english");
  assert.equal(ohneSprachPraefix("/reviews"), "/reviews");
  assert.equal(ohneSprachPraefix(""), "");
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/proxy-regeln.test.ts`
Expected: FAIL mit „Cannot find module '@/lib/proxy-regeln'“.

- [ ] **Step 3: `lib/proxy-regeln.ts` schreiben**

```ts
import type { Sprache } from "@/lib/i18n/sprache-kern";

/**
 * Regeln des Proxys als reine Funktionen (Spec 2026-10-01, statische Seiten,
 * 4.1), damit sie ohne Next testbar sind. proxy.ts setzt sie nur zusammen.
 * Ohne Next-Abhaengigkeit: NavLink nutzt ohneSprachPraefix im Browser.
 */

/**
 * Ohne Passwort erreichbar: die Login-Seite samt Route, Impressum und
 * Datenschutz (§ 5 DDG, Art. 13 DSGVO) und der Sprachwechsel, der auch auf
 * diesen Seiten funktionieren muss.
 */
const OHNE_GATE = ["/zugang", "/impressum", "/datenschutz", "/api/zugang", "/api/sprache"] as const;

export function istOhneGate(pfad: string): boolean {
  return OHNE_GATE.some((frei) => pfad === frei || pfad.startsWith(`${frei}/`));
}

/** Route Handler: hinter dem Gate, aber ohne Sprach-Rewrite. */
export function istApiPfad(pfad: string): boolean {
  return pfad === "/api" || pfad.startsWith("/api/");
}

/**
 * Der interne Pfad einer Seite: die Sprache als erstes Segment, das Root-Layout
 * liegt in app/[lang]/. "/" wird zu "/de", "/reviews" zu "/en/reviews". So legt
 * Next jede Seite je Sprache getrennt ab, ohne dass das Layout Cookies liest.
 */
export function internerPfad(sprache: Sprache, pfad: string): string {
  return pfad === "/" ? `/${sprache}` : `/${sprache}${pfad}`;
}

/**
 * Umkehrung von internerPfad. Der Server rendert unter dem internen Pfad
 * (/de/reviews), der Browser kennt den sichtbaren (/reviews).
 */
export function ohneSprachPraefix(pfad: string): string {
  const treffer = /^\/(de|en)(?:\/|$)/.exec(pfad);
  if (!treffer) return pfad;
  const rest = pfad.slice(treffer[1].length + 1);
  return rest === "" ? "/" : rest;
}
```

- [ ] **Step 4: Test laufen lassen**

Run: `npx tsx --test tests/proxy-regeln.test.ts`
Expected: PASS (5 Tests).

- [ ] **Step 5: Commit**

```bash
git add lib/proxy-regeln.ts tests/proxy-regeln.test.ts
git commit -m "feat(proxy): Regeln für Gate und Sprachsegment als reine Funktionen

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Sprache in Server Actions und Route Handlern aus der Anfrage

**Files:**
- Create: `lib/i18n/woerterbuecher.ts`
- Create: `lib/i18n/anfrage.ts`
- Create: `tests/i18n-anfrage.test.ts`
- Modify: `lib/i18n/index.ts` (ganze Datei)
- Modify: `app/blueten/[slug]/aktionen.ts:10,13,48`
- Modify: `app/blueten/[slug]/budpic-aktionen.ts:7,27`
- Modify: `app/mitglied/aktionen.ts:11,34,74`
- Modify: `app/umfragen/aktionen.ts:9,29,87`
- Modify: `app/vorschlagen/aktionen.ts:11,31`

**Interfaces:**
- Consumes: `bestimmeSprache`, `SPRACH_COOKIE`, `type Sprache` (`lib/i18n/sprache-kern.ts`), `I18N_OEFFENTLICH` (`lib/i18n/schalter.ts`).
- Produces:
  - `WOERTERBUECHER: Record<Sprache, Woerterbuch>` in `lib/i18n/woerterbuecher.ts` (weiter auch aus `@/lib/i18n` exportiert)
  - `holeSpracheAusAnfrage(): Promise<Sprache>` und `holeWoerterbuchAusAnfrage(): Promise<Woerterbuch>` in `lib/i18n/anfrage.ts`

- [ ] **Step 1: Failing test schreiben**

`tests/i18n-anfrage.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Alle .ts/.tsx unter einem Ordner, rekursiv. */
function dateien(ordner: string): string[] {
  return readdirSync(ordner, { recursive: true, encoding: "utf8" })
    .filter((name) => /\.tsx?$/.test(name))
    .map((name) => join(ordner, name));
}

// Spec 2026-10-01 (statische Seiten), 4.2: next/root-params wirft in Server Actions und
// Route Handlern. Beide nehmen die Sprache deshalb aus der Anfrage (lib/i18n/anfrage.ts),
// nie aus "@/lib/i18n" oder lib/i18n/sprache.ts.
test("Server Actions und Route Handler lesen die Sprache aus der Anfrage", () => {
  const verboten = /from "@\/lib\/i18n"|from "@\/lib\/i18n\/sprache"|next\/root-params/;
  const treffer = dateien("app").filter((datei) => {
    const quelle = readFileSync(datei, "utf8");
    const istAktion = /^\s*"use server";/m.test(quelle);
    const istRoute = /[\\/]route\.ts$/.test(datei);
    return (istAktion || istRoute) && verboten.test(quelle);
  });
  assert.deepEqual(treffer, []);
});

test("anfrage.ts lädt die Wörterbücher ohne Umweg über lib/i18n/index.ts", () => {
  const quelle = readFileSync("lib/i18n/anfrage.ts", "utf8");
  assert.match(quelle, /from "\.\/woerterbuecher"/);
  assert.match(quelle, /bestimmeSprache\(/);
  assert.doesNotMatch(quelle, /from "\.\/index"|from "\.\/sprache"|from "@\/lib\/i18n"/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/i18n-anfrage.test.ts`
Expected: FAIL. Der erste Test listet die fünf Action-Dateien, der zweite meldet „ENOENT … lib/i18n/anfrage.ts“.

- [ ] **Step 3: `lib/i18n/woerterbuecher.ts` anlegen**

```ts
import { de } from "./de";
import { en } from "./en";
import type { Sprache } from "./sprache-kern";
import type { Woerterbuch } from "./typen";

/**
 * Beide Wörterbücher ohne Sprachermittlung: für Server Components über
 * lib/i18n/index.ts, für Actions und Route Handler über lib/i18n/anfrage.ts.
 */
export const WOERTERBUECHER: Record<Sprache, Woerterbuch> = { de, en };
```

- [ ] **Step 4: `lib/i18n/anfrage.ts` anlegen**

```ts
import "server-only";

import { cookies, headers } from "next/headers";

import { I18N_OEFFENTLICH } from "./schalter";
import { bestimmeSprache, SPRACH_COOKIE, type Sprache } from "./sprache-kern";
import type { Woerterbuch } from "./typen";
import { WOERTERBUECHER } from "./woerterbuecher";

/**
 * Sprache einer Server Action oder eines Route Handlers (Spec 2026-10-01,
 * statische Seiten, 4.2). next/root-params wirft dort; deshalb dieselbe Regel
 * wie der Proxy, der die Seite umgeschrieben hat: Cookie, sonst
 * Accept-Language, sonst Deutsch. Server Components nehmen holeSprache().
 */
export async function holeSpracheAusAnfrage(): Promise<Sprache> {
  const [cookieSpeicher, anfrageHeader] = await Promise.all([cookies(), headers()]);
  return bestimmeSprache({
    cookie: cookieSpeicher.get(SPRACH_COOKIE)?.value,
    acceptLanguage: anfrageHeader.get("accept-language"),
    erkennungAktiv: I18N_OEFFENTLICH,
  });
}

export async function holeWoerterbuchAusAnfrage(): Promise<Woerterbuch> {
  return WOERTERBUECHER[await holeSpracheAusAnfrage()];
}
```

- [ ] **Step 5: `lib/i18n/index.ts` auf `woerterbuecher.ts` umstellen**

Ganze Datei:

```ts
import "server-only";

import { holeSprache } from "./sprache";
import type { Sprache } from "./sprache-kern";
import type { Woerterbuch } from "./typen";
import { WOERTERBUECHER } from "./woerterbuecher";

export { WOERTERBUECHER };

export async function holeWoerterbuch(): Promise<Woerterbuch> {
  return WOERTERBUECHER[await holeSprache()];
}

export { holeSprache };
export type { Sprache, Woerterbuch };
```

- [ ] **Step 6: Die fünf Action-Dateien umstellen**

`app/blueten/[slug]/aktionen.ts`, Zeile 10 und 13 ersetzen. Alt:

```ts
import { holeSprache, holeWoerterbuch, type Sprache, type Woerterbuch } from "@/lib/i18n";
```

Neu:

```ts
import { holeSpracheAusAnfrage, holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";
import type { Sprache } from "@/lib/i18n/sprache-kern";
```

Und die Zeile `import type { Meldung } from "@/lib/i18n/typen";` wird zu:

```ts
import type { Meldung, Woerterbuch } from "@/lib/i18n/typen";
```

Zeile 48 alt:

```ts
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
```

neu:

```ts
  const [w, sprache] = await Promise.all([holeWoerterbuchAusAnfrage(), holeSpracheAusAnfrage()]);
```

In `app/blueten/[slug]/budpic-aktionen.ts`, `app/mitglied/aktionen.ts`, `app/umfragen/aktionen.ts` und `app/vorschlagen/aktionen.ts` jeweils:
- die Zeile `import { holeWoerterbuch } from "@/lib/i18n";` ersetzen durch `import { holeWoerterbuchAusAnfrage } from "@/lib/i18n/anfrage";`
- jeden Aufruf `holeWoerterbuch()` ersetzen durch `holeWoerterbuchAusAnfrage()` (budpic-aktionen Zeile 27, mitglied Zeilen 34 und 74, umfragen Zeilen 29 und 87, vorschlagen Zeile 31).

Mit dem Edit-Tool, nicht mit `sed -i`.

- [ ] **Step 7: Tests, Typprüfung, Lint**

Run: `npx tsx --test tests/i18n-anfrage.test.ts`
Expected: PASS (2 Tests).

Run: `npm test`
Expected: alle Tests grün (vorher 525 plus die neuen aus Task 1 bis 3).

Run: `npm run typecheck`
Expected: keine Fehler.

Run: `npx eslint lib/i18n "app/blueten/[slug]/aktionen.ts" "app/blueten/[slug]/budpic-aktionen.ts" app/mitglied/aktionen.ts app/umfragen/aktionen.ts app/vorschlagen/aktionen.ts`
Expected: keine Meldungen.

- [ ] **Step 8: Commit**

```bash
git add lib/i18n tests/i18n-anfrage.test.ts "app/blueten/[slug]/aktionen.ts" "app/blueten/[slug]/budpic-aktionen.ts" app/mitglied/aktionen.ts app/umfragen/aktionen.ts app/vorschlagen/aktionen.ts
git commit -m "refactor(i18n): Server Actions lesen die Sprache aus der Anfrage

Vorbereitung für next/root-params (Spec 2026-10-01): das wirft in Server Actions
und Route Handlern. Die nehmen jetzt holeSpracheAusAnfrage() mit derselben Regel
wie der Proxy. Die Wörterbücher liegen dafür in einer eigenen Datei.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Sprachwechsel als Route Handler

**Files:**
- Create: `lib/i18n/sprachwechsel.ts`
- Create: `app/api/sprache/route.ts`
- Create: `tests/sprachwechsel.test.ts`
- Modify: `components/layout/SprachSchalter.tsx` (Import Zeile 1, Kommentar, `<form>`)
- Delete: `lib/i18n/aktionen.ts`
- Modify: `proxy.ts` (Matcher: `api/sprache` vom Gate ausnehmen, bis Task 5 den Matcher ersetzt)
- Modify: `tests/rechtliches.test.ts:28` (Liste der ausgenommenen Pfade)

**Interfaces:**
- Consumes: `sicheresZiel(wert, standard)` aus `lib/weiterleitung.ts`; `istSprache`, `SPRACH_COOKIE` aus `lib/i18n/sprache-kern.ts`.
- Produces: `zielNachSprachwechsel(referer: string | null, origin: string): string`; Route `POST /api/sprache` (Formularfeld `sprache`, Antwort 303).

- [ ] **Step 1: Failing test schreiben**

`tests/sprachwechsel.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { zielNachSprachwechsel } from "@/lib/i18n/sprachwechsel";

const ORIGIN = "https://cn-medcan.w-helwich.workers.dev";

test("Sprachwechsel führt auf die Seite zurück, von der er kam", () => {
  assert.equal(zielNachSprachwechsel(`${ORIGIN}/blueten?typ=INDICA`, ORIGIN), "/blueten?typ=INDICA");
  assert.equal(zielNachSprachwechsel(`${ORIGIN}/`, ORIGIN), "/");
  assert.equal(zielNachSprachwechsel(`${ORIGIN}/impressum`, ORIGIN), "/impressum");
});

test("Sprachwechsel: fremder, kaputter oder fehlender Referer führt auf die Startseite", () => {
  assert.equal(zielNachSprachwechsel(null, ORIGIN), "/");
  assert.equal(zielNachSprachwechsel("https://fremd.example/x", ORIGIN), "/");
  assert.equal(zielNachSprachwechsel("kein url", ORIGIN), "/");
  assert.equal(zielNachSprachwechsel(`${ORIGIN}//fremd.example`, ORIGIN), "/");
});

// Spec 2026-10-01, 4.1: refresh() der alten Server Action rendert nach dem Rewrite noch
// die alte Sprache. Ein normales Formular an den Route Handler laedt die Seite neu.
test("Schalter schickt ein normales Formular an /api/sprache", () => {
  const schalter = readFileSync("components/layout/SprachSchalter.tsx", "utf8");
  assert.match(schalter, /<form method="post" action="\/api\/sprache"/);
  assert.doesNotMatch(schalter, /spracheSetzen/);
  assert.equal(existsSync("lib/i18n/aktionen.ts"), false);
  const route = readFileSync("app/api/sprache/route.ts", "utf8");
  assert.match(route, /NextResponse\.redirect\(new URL\(ziel, anfrage\.url\), 303\)/);
  assert.match(route, /httpOnly: true/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/sprachwechsel.test.ts`
Expected: FAIL mit „Cannot find module '@/lib/i18n/sprachwechsel'“.

- [ ] **Step 3: `lib/i18n/sprachwechsel.ts` schreiben**

```ts
import { sicheresZiel } from "@/lib/weiterleitung";

/**
 * Wohin der Sprachwechsel zurückführt (Spec 2026-10-01, statische Seiten, 4.1):
 * auf die Seite, von der er kam, laut Referer. Nur der eigene Origin zählt,
 * sonst die Startseite; sicheresZiel sperrt zusätzlich Pfade wie
 * "//fremd.example".
 */
export function zielNachSprachwechsel(referer: string | null, origin: string): string {
  if (!referer) return "/";
  let url: URL;
  try {
    url = new URL(referer);
  } catch {
    return "/";
  }
  if (url.origin !== origin) return "/";
  return sicheresZiel(`${url.pathname}${url.search}`, "/");
}
```

- [ ] **Step 4: `app/api/sprache/route.ts` schreiben**

```ts
import { NextResponse, type NextRequest } from "next/server";

import { istSprache, SPRACH_COOKIE } from "@/lib/i18n/sprache-kern";
import { zielNachSprachwechsel } from "@/lib/i18n/sprachwechsel";

const EIN_JAHR_SEKUNDEN = 365 * 24 * 60 * 60;

/**
 * Ausdrückliche Sprachwahl (Spec Englisch 4.2). Seit 2026-10-01 ein Route
 * Handler statt einer Server Action (Spec statische Seiten, 4.1): Cookie
 * setzen, dann mit 303 zurück auf die Seite; der Proxy schreibt den nächsten
 * Aufruf mit der neuen Sprache um. Ohne Gate (lib/proxy-regeln.ts), weil der
 * Schalter auch auf /zugang und den Rechtsseiten steht. Geht ohne JavaScript.
 */
export async function POST(anfrage: NextRequest) {
  const daten = await anfrage.formData().catch(() => null);
  const wahl = daten?.get("sprache");
  const ziel = zielNachSprachwechsel(anfrage.headers.get("referer"), anfrage.nextUrl.origin);
  const antwort = NextResponse.redirect(new URL(ziel, anfrage.url), 303);
  if (istSprache(wahl)) {
    antwort.cookies.set(SPRACH_COOKIE, wahl, {
      path: "/",
      maxAge: EIN_JAHR_SEKUNDEN,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
  }
  return antwort;
}
```

- [ ] **Step 5: Schalter umstellen, alte Action löschen**

In `components/layout/SprachSchalter.tsx`:
- Zeile 1 `import { spracheSetzen } from "@/lib/i18n/aktionen";` löschen.
- Im Kommentar über `SprachSchalter` den Satz „Formular statt onClick: geht ohne JS und vor dem Hydrieren.“ ersetzen durch „Ein normales Formular an /api/sprache (Spec 2026-10-01, statische Seiten, 4.1): geht ohne JS und vor dem Hydrieren und lädt die Seite in der neuen Sprache neu.“
- `<form action={spracheSetzen} aria-label={gruppe}>` ersetzen durch `<form method="post" action="/api/sprache" aria-label={gruppe}>`.

Dann:

```bash
git rm lib/i18n/aktionen.ts
```

- [ ] **Step 6: `/api/sprache` im heutigen Matcher vom Gate ausnehmen**

In `proxy.ts` im Matcher-Literal `api/zugang|` ersetzen durch `api/zugang|api/sprache|`. Ergebnis:

```ts
    "/((?!zugang|api/zugang|api/sprache|impressum|datenschutz|_next/static|_next/image|favicon\\.ico|.*\\.).*)",
```

In `tests/rechtliches.test.ts` Zeile 28:

```ts
  for (const pfad of ["/impressum", "/datenschutz", "/zugang"]) {
```

ersetzen durch:

```ts
  for (const pfad of ["/impressum", "/datenschutz", "/zugang", "/api/sprache"]) {
```

- [ ] **Step 7: Tests, Typprüfung, Lint**

Run: `npx tsx --test tests/sprachwechsel.test.ts tests/rechtliches.test.ts`
Expected: PASS.

Run: `npm test` und `npm run typecheck`
Expected: grün, keine Fehler.

Run: `npx eslint lib/i18n/sprachwechsel.ts app/api/sprache/route.ts components/layout/SprachSchalter.tsx proxy.ts`
Expected: keine Meldungen.

- [ ] **Step 8: Commit**

```bash
git add lib/i18n/sprachwechsel.ts app/api/sprache/route.ts tests/sprachwechsel.test.ts components/layout/SprachSchalter.tsx proxy.ts tests/rechtliches.test.ts
git commit -m "feat(i18n): Sprachwechsel als Route Handler statt Server Action

Ein normales Formular an /api/sprache setzt das Cookie und leitet mit 303 auf die
Seite zurück. Die Server Action rendert nach dem kommenden Sprach-Rewrite im
selben Request noch die alte Sprache (Spec 2026-10-01, 4.1).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Umzug nach `app/[lang]`, Proxy-Rewrite, Sprache aus `next/root-params`

Atomarer Schritt: ohne Rewrite fände keine Seite mehr ihre Route, ohne Umzug zeigte das Rewrite ins Leere.

**Files:**
- Move: `app/layout.tsx`, `app/page.tsx`, `app/error.tsx`, `app/not-found.tsx` und die Ordner `app/admin`, `app/anmelden`, `app/apotheken`, `app/blueten`, `app/datenschutz`, `app/impressum`, `app/mitglied`, `app/registrieren`, `app/reviews`, `app/umfragen`, `app/vorschlagen`, `app/zugang` nach `app/[lang]/`
- Create: `app/[lang]/[...rest]/page.tsx`
- Create: `tests/sprach-segment.test.ts`
- Modify: `app/[lang]/layout.tsx` (CSS-Import, Props-Typ, Sprachprüfung)
- Modify: `app/[lang]/blueten/[slug]/page.tsx:67,406` und `app/[lang]/apotheken/[slug]/page.tsx:56,286` (Props-Typen)
- Modify: `lib/i18n/sprache.ts` (ganze Datei)
- Modify: `proxy.ts` (ganze Datei)
- Modify: `components/layout/NavLink.tsx:8,23`
- Modify: `tests/rechtliches.test.ts:19-34`
- Modify: alle Verweise auf die verschobenen Pfade in `app`, `components`, `lib`, `tests`, `scripts` (per Skript in Step 4)

**Interfaces:**
- Consumes: `istOhneGate`, `istApiPfad`, `internerPfad`, `ohneSprachPraefix` (Task 2); `holeSpracheAusAnfrage` (Task 3).
- Produces: Root-Param `lang` (`import { lang } from "next/root-params"`); `holeSprache()` liest ihn. Alle Seiten unter `app/[lang]/…`; Imports `@/app/[lang]/…` (z. B. `@/app/[lang]/umfragen/aktionen`).

- [ ] **Step 1: Failing tests schreiben**

`tests/sprach-segment.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const lies = (datei: string) => readFileSync(datei, "utf8");

// Spec 2026-10-01 (statische Seiten), 4.1 und 4.2.
test("Root-Layout liegt im internen Sprachsegment und liest die Sprache aus dem Pfad", () => {
  assert.equal(existsSync("app/layout.tsx"), false);
  assert.equal(existsSync("app/page.tsx"), false);
  const layout = lies("app/[lang]/layout.tsx");
  assert.match(layout, /from "next\/root-params"/);
  assert.match(layout, /if \(!istSprache\(await lang\(\)\)\) notFound\(\);/);
  assert.match(layout, /import "\.\.\/globals\.css";/);
  // Kein generateStaticParams: Next stufte sonst jede Seite als statisch ein (Spec 4.3).
  assert.doesNotMatch(layout, /generateStaticParams/);
});

test("holeSprache liest root-params, keine Cookies und Header", () => {
  const quelle = lies("lib/i18n/sprache.ts");
  assert.match(quelle, /from "next\/root-params"/);
  assert.doesNotMatch(quelle, /next\/headers|cookies\(|headers\(/);
});

test("Unbekannte Pfade enden im 404 der Sprache", () => {
  assert.match(lies("app/[lang]/[...rest]/page.tsx"), /notFound\(\);/);
  assert.equal(existsSync("app/[lang]/not-found.tsx"), true);
});

test("Proxy: erst Gate, dann Sprach-Rewrite; API ohne Rewrite", () => {
  const proxy = lies("proxy.ts");
  assert.match(proxy, /!istOhneGate\(pathname\)/);
  assert.match(proxy, /if \(istApiPfad\(pathname\)\) return NextResponse\.next\(\);/);
  assert.match(proxy, /acceptLanguage: request\.headers\.get\("accept-language"\)/);
  assert.match(proxy, /intern\.pathname = internerPfad\(sprache, pathname\);/);
  assert.match(proxy, /return NextResponse\.rewrite\(intern\);/);
  assert.ok(proxy.indexOf("istOhneGate(pathname)") < proxy.indexOf("NextResponse.rewrite(intern)"));
});

test("NavLink vergleicht ohne Sprachpräfix", () => {
  assert.match(
    lies("components/layout/NavLink.tsx"),
    /istAktiv\(ohneSprachPraefix\(usePathname\(\) \?\? ""\), href\)/,
  );
});
```

In `tests/rechtliches.test.ts` den Block von Zeile 19 (`/** Das Matcher-Muster aus proxy.ts …`) bis Zeile 34 (Ende des Tests „Impressum und Datenschutz sind vom Passwort-Gate ausgenommen“) ersetzen durch:

```ts
/** Das Matcher-Muster aus proxy.ts, so wie Next es statisch liest. */
function proxyMuster(): RegExp {
  const treffer = lesen("proxy.ts").match(/matcher:\s*\[[\s\S]*?"(\/\(\(\?![^"]+)"/);
  assert.ok(treffer, "Matcher in proxy.ts nicht gefunden");
  return new RegExp(`^${treffer[1].replace(/\\\\/g, "\\")}$`);
}

test("Impressum und Datenschutz sind vom Passwort-Gate ausgenommen", () => {
  for (const pfad of ["/impressum", "/datenschutz", "/zugang", "/api/sprache"]) {
    assert.equal(istOhneGate(pfad), true, `${pfad} liegt hinter dem Gate`);
  }
  for (const pfad of ["/", "/reviews", "/mitglied", "/umfragen", "/admin"]) {
    assert.equal(istOhneGate(pfad), false, `${pfad} ist nicht mehr geschützt`);
  }
});

// Seit 2026-10-01 laufen auch Rechtsseiten (Sprach-Rewrite) und Pfade mit Punkt
// (Scanner sollen am Gate enden, nicht im Cache) durch den Proxy.
test("Der Proxy läuft für alle Seiten, auch Rechtsseiten und Pfade mit Punkt", () => {
  const muster = proxyMuster();
  for (const pfad of ["/", "/reviews", "/impressum", "/datenschutz", "/zugang", "/wp-login.php", "/api/benachrichtigungen"]) {
    assert.equal(muster.test(pfad), true, `${pfad} läuft am Proxy vorbei`);
  }
  for (const pfad of ["/_next/static/chunks/a.js", "/_next/image", "/favicon.ico", "/icon.png", "/apple-icon.png"]) {
    assert.equal(muster.test(pfad), false, `${pfad} läuft durch den Proxy`);
  }
});
```

und oben im Import-Block von `tests/rechtliches.test.ts` nach dem Import aus `"../lib/rechtliches"` ergänzen:

```ts
import { istOhneGate } from "../lib/proxy-regeln";
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/sprach-segment.test.ts tests/rechtliches.test.ts`
Expected: FAIL („app/layout.tsx“ existiert noch, Matcher schließt `/impressum` aus).

- [ ] **Step 3: Seiten verschieben**

```bash
mkdir -p "app/[lang]"
for eintrag in layout.tsx page.tsx error.tsx not-found.tsx admin anmelden apotheken blueten datenschutz impressum mitglied registrieren reviews umfragen vorschlagen zugang; do
  git mv "app/$eintrag" "app/[lang]/$eintrag"
done
ls app
```

Expected: In `app/` stehen nur noch `[lang]`, `api`, `apple-icon.png`, `favicon.ico`, `globals.css`, `icon.png`.

- [ ] **Step 4: Verweise auf die verschobenen Pfade anpassen**

Skript in den Scratchpad schreiben und ausführen (ersetzt nur Teilstrings, CRLF bleibt):

```bash
cat > "$TEMP/lang-pfade.cjs" <<'EOF'
const fs = require("fs");
const path = require("path");
const ordner = ["app", "components", "lib", "tests", "scripts"];
const einzeln = ["proxy.ts", "next.config.ts"];
const alle = (o) =>
  fs.readdirSync(o, { recursive: true, encoding: "utf8" })
    .filter((n) => /\.(ts|tsx|mjs|cjs)$/.test(n))
    .map((n) => path.join(o, n));
let geaendert = 0;
for (const datei of [...ordner.flatMap(alle), ...einzeln]) {
  const alt = fs.readFileSync(datei, "utf8");
  const neu = alt
    .replace(/@\/app\/(?!api\/|\[lang\]\/)/g, "@/app/[lang]/")
    .replace(/(["'`])app\/(?!api\/|\[lang\]|globals\.css|favicon\.ico|icon\.png|apple-icon\.png)/g, "$1app/[lang]/");
  if (neu !== alt) {
    fs.writeFileSync(datei, neu);
    geaendert += 1;
    console.log(datei);
  }
}
console.log(`${geaendert} Dateien angepasst`);
EOF
node "$TEMP/lang-pfade.cjs"
git grep -n -E "@/app/(admin|blueten|mitglied|umfragen|vorschlagen|error)|[\"'\`]app/(admin|anmelden|apotheken|blueten|datenschutz|impressum|mitglied|registrieren|reviews|umfragen|vorschlagen|zugang|layout|page|error|not-found)" -- app components lib tests scripts proxy.ts
```

Expected: Das Skript nennt die Action-Importe (u. a. `components/umfrage/StimmFormular.tsx`, `components/produkt/BudpicBeitragen.tsx`) und die Tests mit Pfaden (u. a. `tests/i18n-literale.test.ts`, `tests/hover.test.ts`, `tests/fehlerseite.test.ts`). Das abschließende `git grep` findet nichts mehr.

- [ ] **Step 5: Root-Layout anpassen**

In `app/[lang]/layout.tsx`:

Import-Block: `import "./globals.css";` ersetzen durch `import "../globals.css";`, und nach `import { Inspiration, Newsreader } from "next/font/google";` einfügen:

```ts
import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import type { ReactNode } from "react";
```

sowie nach `import { holeSprache, holeWoerterbuch } from "@/lib/i18n";`:

```ts
import { istSprache } from "@/lib/i18n/sprache-kern";
```

Die Funktionssignatur und ihre erste Zeile ersetzen. Alt:

```tsx
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [sprache, w] = await Promise.all([holeSprache(), holeWoerterbuch()]);
```

Neu:

```tsx
/**
 * Root-Layout im internen Sprachsegment (Spec 2026-10-01, statische Seiten,
 * 4.1): Der Proxy schreibt /x auf /de/x oder /en/x um; die Sprache steht damit
 * im Pfad, und das Layout liest keine Anfrage mehr. Andere Werte erreichen es
 * nur an Proxy und Rewrite vorbei.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  if (!istSprache(await lang())) notFound();
  const [sprache, w] = await Promise.all([holeSprache(), holeWoerterbuch()]);
```

- [ ] **Step 6: Props-Typen der zwei Detailseiten**

In `app/[lang]/blueten/[slug]/page.tsx` beide Vorkommen von `PageProps<"/blueten/[slug]">` ersetzen durch `{ params: Promise<{ slug: string }> }`. In `app/[lang]/apotheken/[slug]/page.tsx` beide Vorkommen von `PageProps<"/apotheken/[slug]">` ebenso durch `{ params: Promise<{ slug: string }> }`.

- [ ] **Step 7: 404 für unbekannte Pfade**

`app/[lang]/[...rest]/page.tsx`:

```tsx
import { notFound } from "next/navigation";

/**
 * Jeder Pfad ohne eigene Seite (Spec 2026-10-01, statische Seiten, 4.1): Der
 * Proxy schreibt alle Seitenpfade auf /de/… oder /en/… um; was keine Route hat,
 * landet hier und zeigt app/[lang]/not-found.tsx in der Sprache der Anfrage.
 * Dynamisch, legt also keinen Cache-Eintrag an.
 */
export default function UnbekanntePage(): never {
  notFound();
}
```

- [ ] **Step 8: `holeSprache` auf `next/root-params` umstellen**

`lib/i18n/sprache.ts`, ganze Datei:

```ts
import "server-only";

import { lang } from "next/root-params";

import { istSprache, type Sprache } from "./sprache-kern";

/**
 * Sprache der gerenderten Seite (Spec 2026-10-01, statische Seiten, 4.2): aus
 * dem internen Segment app/[lang], das der Proxy setzt. Server Components
 * lesen damit keine Anfrage mehr, und Seiten ohne Nutzerdaten können statisch
 * werden.
 *
 * Nicht in Server Actions und Route Handlern: dort wirft next/root-params. Die
 * nehmen holeSpracheAusAnfrage() aus lib/i18n/anfrage.ts.
 */
export async function holeSprache(): Promise<Sprache> {
  const wert = await lang();
  return istSprache(wert) ? wert : "de";
}
```

- [ ] **Step 9: Proxy mit Rewrite**

`proxy.ts`, ganze Datei:

```ts
import { NextResponse, type NextRequest } from "next/server";

import { bewertenWeiterleitung } from "@/lib/alte-adressen";
import { COOKIE_NAME, tokenPruefen } from "@/lib/gate";
import { I18N_OEFFENTLICH } from "@/lib/i18n/schalter";
import { bestimmeSprache, SPRACH_COOKIE } from "@/lib/i18n/sprache-kern";
import { internerPfad, istApiPfad, istOhneGate } from "@/lib/proxy-regeln";

/**
 * Zwei Aufgaben vor jeder Seite (Spec 2026-10-01, statische Seiten, 4.1):
 *
 * 1. Das Entwicklungs-Passwort. Ausgenommen sind Login, Impressum, Datenschutz
 *    (ohne Hürde erreichbar, § 5 DDG, Art. 13 DSGVO) und der Sprachwechsel,
 *    siehe lib/proxy-regeln.ts. Ohne gesetztes SITE_PASSWORD bleibt die Seite
 *    offen, damit ein fehlendes Secret nicht die lokale Entwicklung blockiert.
 *    In Produktion muss das Secret gesetzt sein, siehe README.
 * 2. Die Sprache als internes Pfadsegment: /x wird zu /de/x oder /en/x
 *    umgeschrieben (Rewrite, die URL im Browser bleibt). So legt Next jede
 *    Seite je Sprache getrennt ab, ohne dass das Layout Cookies liest.
 *
 * Gecachte Seiten laufen trotzdem hier durch: OpenNext ruft den Proxy vor der
 * Cache-Interception auf (core/routingHandler.js).
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Alte Bewertungsadresse, dauerhaft; vor dem Gate, das greift auf dem Ziel.
  const bewerten = bewertenWeiterleitung(pathname, search);
  if (bewerten) return NextResponse.redirect(new URL(bewerten, request.url), 308);

  if (!istOhneGate(pathname) && !(await gateOffen(request))) {
    const ziel = new URL("/zugang", request.url);
    ziel.searchParams.set("weiter", pathname + search);
    return NextResponse.redirect(ziel);
  }

  if (istApiPfad(pathname)) return NextResponse.next();

  const sprache = bestimmeSprache({
    cookie: request.cookies.get(SPRACH_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    erkennungAktiv: I18N_OEFFENTLICH,
  });
  const intern = request.nextUrl.clone();
  intern.pathname = internerPfad(sprache, pathname);
  return NextResponse.rewrite(intern);
}

async function gateOffen(request: NextRequest): Promise<boolean> {
  const passwort = process.env.SITE_PASSWORD;
  const secret = process.env.SITE_SESSION_SECRET;
  if (!passwort || !secret) return true;
  return (await tokenPruefen(secret, request.cookies.get(COOKIE_NAME)?.value)) !== null;
}

export const config = {
  matcher: [
    // Alles ausser Next-Interna und den Icons aus app/. Seit 2026-10-01 laufen
    // auch Impressum, Datenschutz, /zugang und Pfade mit Punkt hier durch: die
    // Seiten brauchen das Sprach-Rewrite, und Scanner-Pfade wie /wp-login.php
    // sollen am Gate enden statt einen Cache-Eintrag anzulegen. Echte Dateien aus
    // public/ liefert Cloudflare vor dem Worker aus; sie erreichen den Proxy nie.
    //
    // Das Muster muss ein Literal bleiben (Next liest es statisch). Ein Punkt
    // MUSS als doppelter Backslash plus Punkt stehen; ein einfacher Backslash
    // ist im JS-String nur ein Punkt, und das Muster passte auf mehr als gemeint.
    "/((?!_next/|favicon\\.ico|icon\\.png|apple-icon\\.png).*)",
  ],
};
```

- [ ] **Step 10: NavLink ohne Sprachpräfix**

In `components/layout/NavLink.tsx` nach `import { istAktiv } from "@/lib/navigation";` einfügen:

```ts
import { ohneSprachPraefix } from "@/lib/proxy-regeln";
```

und die Zeile

```tsx
  const aktiv = istAktiv(usePathname() ?? "", href);
```

ersetzen durch:

```tsx
  // Der Server rendert unter dem internen Pfad (/de/reviews), der Browser kennt
  // den sichtbaren (/reviews): ohne Präfix vergleichen, sonst weicht das
  // Hydrieren ab (Spec 2026-10-01, statische Seiten, 4.2).
  const aktiv = istAktiv(ohneSprachPraefix(usePathname() ?? ""), href);
```

- [ ] **Step 11: Typen neu erzeugen und prüfen**

Run (Zeitlimit 180 s; hängt der Befehl länger, abbrechen und melden): `npm run typegen`
Expected: `.next/types/root-params.d.ts` nennt `lang`, `.next/types/routes.d.ts` enthält `/[lang]`. Kein workerd-Prozess bleibt zurück (Task 1, Step 7).

Run: `npm run typecheck`
Expected: keine Fehler.

Run: `npm test`
Expected: alle Tests grün, auch die in Step 4 umgeschriebenen Pfad-Tests. Scheitert ein Test mit „This module is a placeholder for 'next/root-params'“, lädt er über eine Action oder Komponente `lib/i18n/sprache.ts`: den Import-Pfad finden und auf `lib/i18n/anfrage.ts` umstellen (Actions) bzw. melden (Komponenten).

Run: `npx eslint proxy.ts lib components/layout/NavLink.tsx "app/[lang]/layout.tsx" "app/[lang]/[...rest]/page.tsx"`
Expected: keine Meldungen.

- [ ] **Step 12: Commit (nicht pushen)**

```bash
git add -A app proxy.ts lib components tests scripts
git status --short
git commit -m "feat(i18n): Sprache als internes Pfadsegment app/[lang]

Alle Seiten liegen unter app/[lang]. Der Proxy bestimmt die Sprache wie bisher
und schreibt /x intern auf /de/x oder /en/x um; sichtbare URLs bleiben gleich.
Server Components lesen die Sprache aus next/root-params statt aus Cookie und
Header, damit Seiten statisch werden können (Spec 2026-10-01). Unbekannte Pfade
enden in einem 404 in der Sprache der Anfrage.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

`git status --short` vor dem Commit prüfen: nur erwartete Dateien, keine `.env*`, kein `.next/`.

---

### Task 6: Rechtsseiten und `/zugang` statisch, Prüfpunkt 1 (Push und Live-Prüfung)

**Files:**
- Create: `tests/statische-seiten.test.ts`
- Modify: `app/[lang]/impressum/page.tsx` (nach den Imports; Kommentar Zeile 17)
- Modify: `app/[lang]/datenschutz/page.tsx` (nach den Imports)
- Modify: `app/[lang]/zugang/page.tsx` (nach den Imports)

**Interfaces:**
- Consumes: alles aus Task 1 bis 5.
- Produces: `STATISCH`-Tabelle in `tests/statische-seiten.test.ts`, die Task 9 und Task 10 erweitern.

- [ ] **Step 1: Failing test schreiben**

`tests/statische-seiten.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei: string) => readFileSync(datei, "utf8");

/**
 * Spec 2026-10-01 (statische Seiten), 4.3: Jede statische Seite schaltet selbst um
 * (force-static plus revalidate), kein generateStaticParams. Gerendert wird beim ersten
 * Aufruf, nicht im Build: der Build hat weder D1 noch Secrets.
 */
const STATISCH: Record<string, string> = {
  "app/[lang]/impressum/page.tsx": "86400",
  "app/[lang]/datenschutz/page.tsx": "86400",
  "app/[lang]/zugang/page.tsx": "false",
};

test("Statische Seiten schalten selbst um", () => {
  for (const [datei, revalidate] of Object.entries(STATISCH)) {
    const quelle = lies(datei);
    assert.match(quelle, /export const dynamic = "force-static";/, datei);
    assert.match(quelle, new RegExp(`export const revalidate = ${revalidate};`), datei);
    assert.doesNotMatch(quelle, /generateStaticParams|force-dynamic/, datei);
  }
});

test("Statische Seiten lesen keine Sitzung", () => {
  for (const datei of Object.keys(STATISCH)) {
    assert.doesNotMatch(lies(datei), /lib\/session|aktuellesMitglied|istFachkreis|cookies\(|headers\(/, datei);
  }
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/statische-seiten.test.ts`
Expected: FAIL („Statische Seiten schalten selbst um“).

- [ ] **Step 3: Konfiguration in die drei Seiten**

In `app/[lang]/impressum/page.tsx` und `app/[lang]/datenschutz/page.tsx` jeweils direkt nach dem letzten `import` einfügen:

```ts

/**
 * Statisch je Sprache, täglich neu (Spec 2026-10-01, statische Seiten, 4.3).
 * Eine Änderung an IMPRESSUM_JSON greift spätestens nach einem Tag, sofort mit
 * dem nächsten Push (neuer Build, neuer Cache).
 */
export const dynamic = "force-static";
export const revalidate = 86400;
```

In `app/[lang]/impressum/page.tsx` im Kopfkommentar `(proxy.ts)` ersetzen durch `(lib/proxy-regeln.ts)`.

In `app/[lang]/zugang/page.tsx` direkt nach dem letzten `import` einfügen:

```ts

/**
 * Statisch je Sprache, ohne Ablauf (Spec 2026-10-01, statische Seiten, 4.3):
 * Der Text kommt nur aus dem Wörterbuch, `weiter` und `fehler` liest
 * ZugangFelder im Browser.
 */
export const dynamic = "force-static";
export const revalidate = false;
```

- [ ] **Step 4: Tests, Typprüfung, Lint**

Run: `npx tsx --test tests/statische-seiten.test.ts`
Expected: PASS (2 Tests).

Run: `npm test` und `npm run typecheck`
Expected: grün, keine Fehler.

Run: `npx eslint "app/[lang]/impressum/page.tsx" "app/[lang]/datenschutz/page.tsx" "app/[lang]/zugang/page.tsx"`
Expected: keine Meldungen.

- [ ] **Step 5: Commit und Push (Prüfpunkt 1)**

```bash
git add tests/statische-seiten.test.ts "app/[lang]/impressum/page.tsx" "app/[lang]/datenschutz/page.tsx" "app/[lang]/zugang/page.tsx"
git commit -m "feat(cache): Impressum, Datenschutz und Zugang statisch je Sprache

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

Bei Netzfehler nicht wiederholen, sondern melden.

- [ ] **Step 6: Auf den Build warten (einmal, im Hintergrund)**

Bash mit `run_in_background: true`: `sleep 840`. Auf die Benachrichtigung warten, nicht pollen.

- [ ] **Step 7: Build-Log prüfen (einmal)**

Tool `mcp__plugin_cloudflare_cloudflare__execute`:

```js
async () => {
  const builds = await cloudflare.request({
    method: "GET",
    path: `/accounts/${accountId}/builds/workers/1406f98f6bac4ea19a123496391118c7/builds`,
  });
  const letzter = builds.result[0];
  const log = await cloudflare.request({
    method: "GET",
    path: `/accounts/${accountId}/builds/builds/${letzter.build_uuid}/logs`,
  });
  const zeilen = (log.result?.lines ?? []).map((z) => z[1]);
  return {
    stand: [letzter.build_outcome, letzter.created_on, letzter.build_trigger_metadata?.commit_hash?.slice(0, 7)],
    routen: zeilen.filter((t) => /\[lang\]|Proxy|○|●|ƒ/.test(t)),
    cache: zeilen.filter((t) => /KV|populat|cache/i.test(t)),
    fehler: zeilen.filter((t) => /error|failed/i.test(t)).slice(0, 20),
  };
}
```

Expected: `build_outcome` ist `success` mit dem Commit aus Step 5. In `routen` stehen `/[lang]/impressum`, `/[lang]/datenschutz`, `/[lang]/zugang` nicht als `ƒ`. `cache` meldet ein erfolgreiches Befüllen von KV. Schlägt das Befüllen mit einem Rechtefehler fehl, stoppen und dem Nutzer melden: Das Build-Token braucht „Workers KV Storage: Edit“, die alte Version ist noch live.

- [ ] **Step 8: Live abgemeldet prüfen (Einzelabrufe, kein Cookie)**

PowerShell:

```powershell
$u = 'https://cn-medcan.w-helwich.workers.dev'
function Abruf($pfad, $sprache) {
  $kopf = @{}
  if ($sprache) { $kopf['Accept-Language'] = $sprache }
  try {
    $r = Invoke-WebRequest -UseBasicParsing "$u$pfad" -MaximumRedirection 0 -Headers $kopf
    $lang = if ($r.Content -match '<html[^>]*lang="([^"]+)"') { $Matches[1] } else { '-' }
    "$pfad $($r.StatusCode) lang=$lang cache=$($r.Headers['x-opennext-cache'])/$($r.Headers['x-nextjs-cache'])"
  } catch {
    "$pfad $($_.Exception.Response.StatusCode.value__) -> $($_.Exception.Response.Headers['Location'])"
  }
}
Abruf '/' $null
Abruf '/wp-login.php' $null
Abruf '/de/impressum' $null
Abruf '/impressum' $null
Abruf '/impressum' $null
Abruf '/impressum' 'en-GB,en;q=0.9'
Abruf '/zugang' $null
```

Expected:
- `/` und `/wp-login.php` und `/de/impressum`: 307 mit `Location` auf `/zugang?weiter=…` (Gate vor dem Cache).
- `/impressum` 200 `lang=de`; beim zweiten Abruf `cache=HIT` in einem der beiden Header.
- `/impressum` mit `en-GB`: 200 `lang=en-GB`.
- `/zugang` 200.

- [ ] **Step 9: Live angemeldet prüfen (Browser-MCP)**

Browser verbinden: `mcp__browser__list_connected_browsers`, Nutzer per AskUserQuestion wählen lassen, `mcp__browser__select_browser`. Dann der Reihe nach, je mit Screenshot oder `get_page_text`:
1. `/` lädt (Deutsch), Kopf mit Navigation, keine Fehlerseite.
2. `/reviews` lädt; der Navigationspunkt „Bewertungen“ ist markiert (`aria-current="page"`, per `javascript_tool`: `document.querySelector('[aria-current="page"]')?.textContent`).
3. Sprachknopf unten rechts klicken: Seite lädt neu auf Englisch, gleiche URL, `document.documentElement.lang === "en-GB"`. Erneut klicken: zurück auf Deutsch.
4. `/gibt-es-nicht`: 404-Seite im Buchstil („404“, Links zur Startseite und zum Katalog).
5. Eine Blütenseite öffnen (Link aus `/blueten`) und Bewerten-Bereich sichtbar.
6. `/impressum` in beiden Sprachen.

Befunde notieren. Ist etwas kaputt: stoppen, Ursache per `superpowers:systematic-debugging` suchen, Fix als neuer Commit, erst dann weiter.

- [ ] **Step 10: CPU der statischen Seiten in den Logs**

Tool `mcp__plugin_cloudflare_cloudflare__execute`:

```js
async () => {
  const jetzt = Date.now();
  const r = await cloudflare.request({
    method: "POST",
    path: `/accounts/${accountId}/workers/observability/telemetry/query`,
    body: {
      queryId: "adhoc",
      view: "events",
      timeframe: { from: jetzt - 30 * 60e3, to: jetzt },
      limit: 500,
      parameters: {
        datasets: ["cloudflare-workers"],
        filters: [{ key: "$workers.scriptName", operation: "eq", type: "string", value: "cn-medcan" }],
      },
    },
  });
  return r.result.events.events
    .filter((e) => e.$workers?.cpuTimeMs != null)
    .map((e) => [e.$workers.cpuTimeMs, e.$workers.outcome, e.$workers.event?.request?.url ?? ""].join(" "))
    .slice(0, 60);
}
```

Expected: Zweite und weitere Abrufe von `/impressum` deutlich unter den dynamischen Seiten; Ergebnis für den Bericht festhalten.

---

### Task 7: Endpunkt `/api/startseite`

**Files:**
- Create: `lib/startseite-sitzung.ts`
- Create: `app/api/startseite/route.ts`
- Create: `tests/startseite-sitzung.test.ts`
- Modify: `lib/query/umfragen.ts:60-68` (`aktiveUmfrage`)

**Interfaces:**
- Consumes: `stimmZustand(mitglied, eigeneOptionId)` aus `components/umfrage/stimmzustand.ts`; `type StimmZustand` aus `components/umfrage/UmfrageKarte.tsx`; `type EmpfehlungsEintrag` aus `components/empfehlung/EmpfehlungsListe.tsx`; `type BudpicZugang` aus `components/produkt/BudpicBeitragen.tsx`; `begruendungText` aus `lib/empfehlung-text.ts`; `ladeEmpfehlungen` aus `lib/query/empfehlungen.ts`; `eigeneStimme` aus `lib/query/umfragen.ts`; `aktuellesMitglied` aus `lib/session.ts`; `holeSpracheAusAnfrage` und `WOERTERBUECHER` (Task 3).
- Produces:
  - `type StartseitenSitzung = { abstimmung: { umfrageId: string | null; zustand: StimmZustand }; empfehlungen: { art: "GAST" } | { art: "LISTE"; eintraege: EmpfehlungsEintrag[] }; budpicZugang: BudpicZugang }`
  - `type SitzungsStand = { status: "laedt" } | { status: "fehler" } | { status: "fertig"; daten: StartseitenSitzung }`
  - `sitzungsAntwort(eingabe): StartseitenSitzung`
  - `type StimmzettelAnzeige = StimmZustand["art"] | "laedt" | "fehler" | "veraltet"` und `stimmzettelAnzeige(stand: SitzungsStand, umfrageId: string): StimmzettelAnzeige`
  - `eigeneStimmeAuf(stand: SitzungsStand, umfrageId: string, optionId: string): boolean`
  - `type EmpfehlungenAnzeige` und `empfehlungenAnzeige(stand: SitzungsStand): EmpfehlungenAnzeige`
  - `aktiveUmfrageId(): Promise<string | null>` in `lib/query/umfragen.ts`
  - Route `GET /api/startseite` → JSON `StartseitenSitzung`, `Cache-Control: private, no-store`

- [ ] **Step 1: Failing test schreiben**

`tests/startseite-sitzung.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  eigeneStimmeAuf,
  empfehlungenAnzeige,
  sitzungsAntwort,
  stimmzettelAnzeige,
  type SitzungsStand,
  type StartseitenSitzung,
} from "@/lib/startseite-sitzung";

const LISTE = [{ slug: "a", handelsname: "A", begruendung: "weil dir B gefiel" }];
const fertig = (daten: StartseitenSitzung): SitzungsStand => ({ status: "fertig", daten });

test("Gäste: anonymer Stimmzettel, Gast-Empfehlungen, Gast-Zugang", () => {
  assert.deepEqual(sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [] }), {
    abstimmung: { umfrageId: null, zustand: { art: "ANONYM" } },
    empfehlungen: { art: "GAST" },
    budpicZugang: "gast",
  });
});

test("Mitglied ohne Freischaltung: Freigabe offen, Liste, Zugang mitglied", () => {
  const antwort = sitzungsAntwort({ mitglied: { freigegeben: false }, umfrageId: "u1", eigeneOptionId: null, empfehlungen: LISTE });
  assert.deepEqual(antwort.abstimmung, { umfrageId: "u1", zustand: { art: "FREIGABE_OFFEN" } });
  assert.deepEqual(antwort.empfehlungen, { art: "LISTE", eintraege: LISTE });
  assert.equal(antwort.budpicZugang, "mitglied");
});

test("Freigeschaltet: stimmberechtigt oder abgestimmt, Zugang freigegeben", () => {
  const offen = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: "u1", eigeneOptionId: null, empfehlungen: [] });
  assert.deepEqual(offen.abstimmung.zustand, { art: "STIMMBERECHTIGT" });
  assert.equal(offen.budpicZugang, "freigegeben");
  const gewaehlt = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: "u1", eigeneOptionId: "o2", empfehlungen: [] });
  assert.deepEqual(gewaehlt.abstimmung.zustand, { art: "ABGESTIMMT", optionId: "o2" });
});

test("Stimmzettel: Laden, Fehler, Gast", () => {
  assert.equal(stimmzettelAnzeige({ status: "laedt" }, "u1"), "laedt");
  assert.equal(stimmzettelAnzeige({ status: "fehler" }, "u1"), "fehler");
  const gast = sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [] });
  assert.equal(stimmzettelAnzeige(fertig(gast), "u1"), "ANONYM");
});

test("Stimmzettel: gleiche Runde zeigt den Zustand, fremde oder keine Runde den Link zur Abstimmung", () => {
  const gewaehlt = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: "u1", eigeneOptionId: "o2", empfehlungen: [] });
  assert.equal(stimmzettelAnzeige(fertig(gewaehlt), "u1"), "ABGESTIMMT");
  assert.equal(stimmzettelAnzeige(fertig(gewaehlt), "u0"), "veraltet");
  const ohneRunde = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: null, eigeneOptionId: null, empfehlungen: [] });
  assert.equal(stimmzettelAnzeige(fertig(ohneRunde), "u1"), "veraltet");
});

test("Eigene Stimme nur auf der eigenen Option der gezeigten Runde", () => {
  const gewaehlt = fertig(sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: "u1", eigeneOptionId: "o2", empfehlungen: [] }));
  assert.equal(eigeneStimmeAuf(gewaehlt, "u1", "o2"), true);
  assert.equal(eigeneStimmeAuf(gewaehlt, "u1", "o3"), false);
  assert.equal(eigeneStimmeAuf(gewaehlt, "u0", "o2"), false);
  assert.equal(eigeneStimmeAuf({ status: "laedt" }, "u1", "o2"), false);
});

test("Empfehlungen: Laden, Fehler, Gast, leer, Liste", () => {
  assert.deepEqual(empfehlungenAnzeige({ status: "laedt" }), { art: "laedt" });
  assert.deepEqual(empfehlungenAnzeige({ status: "fehler" }), { art: "fehler" });
  const gast = sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [] });
  assert.deepEqual(empfehlungenAnzeige(fertig(gast)), { art: "gast" });
  const leer = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: null, eigeneOptionId: null, empfehlungen: [] });
  assert.deepEqual(empfehlungenAnzeige(fertig(leer)), { art: "leer" });
  const voll = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: null, eigeneOptionId: null, empfehlungen: LISTE });
  assert.deepEqual(empfehlungenAnzeige(fertig(voll)), { art: "liste", eintraege: LISTE });
});

test("Endpunkt: privat, Gäste ohne Datenbank, Sprache aus der Anfrage", () => {
  const route = readFileSync("app/api/startseite/route.ts", "utf8");
  assert.match(route, /"Cache-Control": "private, no-store"/);
  assert.match(route, /if \(!mitglied\) \{/);
  assert.ok(route.indexOf("if (!mitglied) {") < route.indexOf("aktiveUmfrageId()"));
  assert.match(route, /holeSpracheAusAnfrage\(\)/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/startseite-sitzung.test.ts`
Expected: FAIL mit „Cannot find module '@/lib/startseite-sitzung'“.

- [ ] **Step 3: `lib/startseite-sitzung.ts` schreiben**

```ts
import type { EmpfehlungsEintrag } from "@/components/empfehlung/EmpfehlungsListe";
import type { BudpicZugang } from "@/components/produkt/BudpicBeitragen";
import type { StimmZustand } from "@/components/umfrage/UmfrageKarte";
import { stimmZustand } from "@/components/umfrage/stimmzustand";

/**
 * Die nutzerbezogenen Teile der statischen Startseite (Spec 2026-10-01,
 * statische Seiten, 4.3): was /api/startseite liefert und welche Variante die
 * Inseln im Browser daraus zeigen. Reine Funktionen, im Route Handler und im
 * Browser dieselben.
 */
export type StartseitenSitzung = {
  /** umfrageId: die laufende Runde laut Datenbank; null ohne Runde und für Gäste. */
  abstimmung: { umfrageId: string | null; zustand: StimmZustand };
  empfehlungen: { art: "GAST" } | { art: "LISTE"; eintraege: EmpfehlungsEintrag[] };
  budpicZugang: BudpicZugang;
};

export type SitzungsStand =
  | { status: "laedt" }
  | { status: "fehler" }
  | { status: "fertig"; daten: StartseitenSitzung };

export function sitzungsAntwort(eingabe: {
  mitglied: { freigegeben: boolean } | null;
  umfrageId: string | null;
  eigeneOptionId: string | null;
  empfehlungen: readonly EmpfehlungsEintrag[];
}): StartseitenSitzung {
  const { mitglied } = eingabe;
  if (!mitglied) {
    return {
      abstimmung: { umfrageId: eingabe.umfrageId, zustand: { art: "ANONYM" } },
      empfehlungen: { art: "GAST" },
      budpicZugang: "gast",
    };
  }
  return {
    abstimmung: { umfrageId: eingabe.umfrageId, zustand: stimmZustand(mitglied, eingabe.eigeneOptionId) },
    empfehlungen: { art: "LISTE", eintraege: [...eingabe.empfehlungen] },
    budpicZugang: mitglied.freigegeben ? "freigegeben" : "mitglied",
  };
}

export type StimmzettelAnzeige = StimmZustand["art"] | "laedt" | "fehler" | "veraltet";

/**
 * Welche Aktionszeile der statische Stimmzettel zeigt. "veraltet": Die Seite
 * kommt aus dem Cache (bis 300 s alt) und zeigt eine andere Runde als die
 * laufende; dann führt ein Link auf /umfragen statt eines falschen Zustands.
 */
export function stimmzettelAnzeige(stand: SitzungsStand, umfrageId: string): StimmzettelAnzeige {
  if (stand.status === "laedt") return "laedt";
  if (stand.status === "fehler") return "fehler";
  const { umfrageId: laufend, zustand } = stand.daten.abstimmung;
  if (zustand.art === "ANONYM") return "ANONYM";
  return laufend === umfrageId ? zustand.art : "veraltet";
}

/** Ob die eigene Stimme auf dieser Option der gezeigten Runde liegt (Vermerk und Badge). */
export function eigeneStimmeAuf(stand: SitzungsStand, umfrageId: string, optionId: string): boolean {
  if (stand.status !== "fertig") return false;
  const { umfrageId: laufend, zustand } = stand.daten.abstimmung;
  return laufend === umfrageId && zustand.art === "ABGESTIMMT" && zustand.optionId === optionId;
}

export type EmpfehlungenAnzeige =
  | { art: "laedt" }
  | { art: "fehler" }
  | { art: "gast" }
  | { art: "leer" }
  | { art: "liste"; eintraege: EmpfehlungsEintrag[] };

export function empfehlungenAnzeige(stand: SitzungsStand): EmpfehlungenAnzeige {
  if (stand.status === "laedt") return { art: "laedt" };
  if (stand.status === "fehler") return { art: "fehler" };
  const { empfehlungen } = stand.daten;
  if (empfehlungen.art === "GAST") return { art: "gast" };
  return empfehlungen.eintraege.length === 0 ? { art: "leer" } : { art: "liste", eintraege: empfehlungen.eintraege };
}
```

- [ ] **Step 4: `aktiveUmfrageId` in `lib/query/umfragen.ts`**

Die Funktion `aktiveUmfrage` (Zeilen 54 bis 68 samt Kommentar) ersetzen durch:

```ts
/**
 * Die Id der laufenden Umfrage, oder null (eine Zeile, ein Feld; für
 * /api/startseite).
 *
 * "Laufend" heisst `aktiv = 'AKTIV'`. Dass es davon hoechstens eine gibt,
 * sichert der Unique-Index auf der Spalte - nicht diese Funktion.
 */
export async function aktiveUmfrageId(): Promise<string | null> {
  const prisma = await getPrisma();
  const satz = await prisma.umfrage.findUnique({
    where: { aktiv: "AKTIV" },
    select: { id: true },
  });
  return satz?.id ?? null;
}

/** Die laufende Umfrage mit Kandidaten und Stimmen, oder null. */
export async function aktiveUmfrage(): Promise<UmfrageAnsicht | null> {
  const id = await aktiveUmfrageId();
  return id ? umfrageLaden(id) : null;
}
```

- [ ] **Step 5: `app/api/startseite/route.ts` schreiben**

```ts
import { NextResponse } from "next/server";

import { begruendungText } from "@/lib/empfehlung-text";
import { holeSpracheAusAnfrage } from "@/lib/i18n/anfrage";
import { WOERTERBUECHER } from "@/lib/i18n/woerterbuecher";
import { ladeEmpfehlungen } from "@/lib/query/empfehlungen";
import { aktiveUmfrageId, eigeneStimme } from "@/lib/query/umfragen";
import { aktuellesMitglied } from "@/lib/session";
import { sitzungsAntwort } from "@/lib/startseite-sitzung";

const PRIVAT = { "Cache-Control": "private, no-store" };

/**
 * Die nutzerbezogenen Teile der statischen Startseite in einem Aufruf (Spec
 * 2026-10-01, statische Seiten, 4.3): Stimmzustand zur laufenden Runde, eigene
 * Empfehlungen mit Begründung in der Sprache der Anfrage, Budpic-Zugang. Gäste
 * bekommen ihre Antwort ohne Datenbank. Ein Fehler endet als 500; die Inseln
 * zeigen dann ihre Fehlertexte.
 */
export async function GET() {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) {
    return NextResponse.json(
      sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [] }),
      { headers: PRIVAT },
    );
  }

  const sprache = await holeSpracheAusAnfrage();
  const w = WOERTERBUECHER[sprache];
  const [umfrageId, liste] = await Promise.all([aktiveUmfrageId(), ladeEmpfehlungen(mitglied.mitgliedId)]);
  const eigeneOptionId =
    umfrageId && mitglied.freigegeben ? await eigeneStimme(umfrageId, mitglied.mitgliedId) : null;

  return NextResponse.json(
    sitzungsAntwort({
      mitglied,
      umfrageId,
      eigeneOptionId,
      empfehlungen: liste.map((e) => ({
        slug: e.slug,
        handelsname: e.handelsname,
        begruendung: begruendungText(e, w, sprache),
      })),
    }),
    { headers: PRIVAT },
  );
}
```

- [ ] **Step 6: Tests, Typprüfung, Lint**

Run: `npx tsx --test tests/startseite-sitzung.test.ts tests/i18n-anfrage.test.ts`
Expected: PASS.

Run: `npm test` und `npm run typecheck`
Expected: grün, keine Fehler.

Run: `npx eslint lib/startseite-sitzung.ts lib/query/umfragen.ts app/api/startseite/route.ts`
Expected: keine Meldungen.

- [ ] **Step 7: Commit**

```bash
git add lib/startseite-sitzung.ts lib/query/umfragen.ts app/api/startseite/route.ts tests/startseite-sitzung.test.ts
git commit -m "feat(start): Endpunkt /api/startseite für die Teile mit Sitzung

Ein Aufruf liefert Stimmzustand, eigene Empfehlungen und Budpic-Zugang, damit die
Startseite statisch werden kann (Spec 2026-10-01, 4.3). Zeigt die gecachte Seite
eine andere Runde, führt der Stimmzettel auf /umfragen.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Stimmzettel der Startseite im Browser

**Files:**
- Create: `components/story/StartSitzung.tsx`
- Create: `components/umfrage/StimmzettelImBrowser.tsx`
- Create: `tests/startseite-statisch.test.ts`
- Modify: `components/umfrage/Kandidat.tsx` (Props, zwei Vermerke)
- Modify: `components/umfrage/UmfrageKarte.tsx` (Props, `gewaehlteOption`, Kandidaten, Aktionszeile)
- Modify: `components/umfrage/StimmFormular.tsx` (nach erfolgreicher Stimme)
- Modify: `components/story/Abstimmung.tsx` (Stimmzettel ohne Sitzung)
- Modify: `app/[lang]/page.tsx` (Inhalt in `StartSitzung`)

**Interfaces:**
- Consumes: `SitzungsStand`, `StartseitenSitzung`, `stimmzettelAnzeige`, `eigeneStimmeAuf`, `StimmzettelAnzeige` (Task 7).
- Produces:
  - `StartSitzung({ children })` und `useStartSitzung(): { stand: SitzungsStand; neuLaden: () => void } | null` in `components/story/StartSitzung.tsx`
  - `StimmzettelAktion({ umfrageId, varianten })` und `EigeneStimme({ umfrageId, optionId, children })` in `components/umfrage/StimmzettelImBrowser.tsx`
  - `UmfrageKarte` nimmt `zustand: StimmZustand | "im-browser"`; `Kandidat` nimmt `gewaehlt: boolean | { umfrageId: string }`

- [ ] **Step 1: Failing test schreiben**

`tests/startseite-statisch.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lies = (datei: string) => readFileSync(datei, "utf8");

// Spec 2026-10-01 (statische Seiten), 4.3.
test("Stimmzettel der Startseite liest keine Sitzung", () => {
  assert.doesNotMatch(lies("components/story/Abstimmung.tsx"), /lib\/session|aktuellesMitglied|eigeneStimme|stimmZustand/);
  assert.match(lies("components/story/Abstimmung.tsx"), /zustand="im-browser"/);
});

test("Ein Abruf für alle Inseln, nur in StartSitzung", () => {
  assert.match(lies("components/story/StartSitzung.tsx"), /fetch\("\/api\/startseite"/);
  assert.doesNotMatch(lies("components/umfrage/StimmzettelImBrowser.tsx"), /fetch\(/);
  assert.match(lies("app/[lang]/page.tsx"), /<StartSitzung>/);
});

test("Abstimmen auf der Startseite lädt den Zustand neu statt der gecachten Seite", () => {
  assert.match(lies("components/umfrage/StimmFormular.tsx"), /if \(sitzung\) sitzung\.neuLaden\(\);\s*else router\.refresh\(\);/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/startseite-statisch.test.ts`
Expected: FAIL („ENOENT … components/story/StartSitzung.tsx“ und Abstimmung liest `aktuellesMitglied`).

- [ ] **Step 3: `components/story/StartSitzung.tsx` schreiben**

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { SitzungsStand, StartseitenSitzung } from "@/lib/startseite-sitzung";

type Kontext = { stand: SitzungsStand; neuLaden: () => void };

const SitzungsKontext = createContext<Kontext | null>(null);

/** Danach zeigen die Inseln ihren Fehlertext, und die StoryBuehne wartet nicht länger. */
const ZEITLIMIT_MS = 8000;

async function laden(): Promise<SitzungsStand> {
  try {
    const antwort = await fetch("/api/startseite", {
      credentials: "same-origin",
      signal: AbortSignal.timeout(ZEITLIMIT_MS),
    });
    if (!antwort.ok) return { status: "fehler" };
    return { status: "fertig", daten: (await antwort.json()) as StartseitenSitzung };
  } catch {
    return { status: "fehler" };
  }
}

/**
 * Die nutzerbezogenen Teile der statischen Startseite (Spec 2026-10-01,
 * statische Seiten, 4.3): ein Abruf von /api/startseite für alle Inseln
 * (Stimmzettel, Empfehlungen, Budpic-Zugang). neuLaden() holt den Stand nach
 * dem Abstimmen erneut; bis dahin bleibt der alte stehen.
 */
export function StartSitzung({ children }: { children: ReactNode }) {
  const [stand, setStand] = useState<SitzungsStand>({ status: "laedt" });
  const [runde, setRunde] = useState(0);

  useEffect(() => {
    let aktuell = true;
    // setStand nur im .then(): kein setState direkt im Effekt-Körper (react-hooks/set-state-in-effect).
    void laden().then((neu) => {
      if (aktuell) setStand(neu);
    });
    return () => {
      aktuell = false;
    };
  }, [runde]);

  const neuLaden = useCallback(() => setRunde((alt) => alt + 1), []);
  const wert = useMemo(() => ({ stand, neuLaden }), [stand, neuLaden]);
  return <SitzungsKontext.Provider value={wert}>{children}</SitzungsKontext.Provider>;
}

/** null außerhalb der Startseite, etwa auf /umfragen: dort kennt der Server den Zustand. */
export function useStartSitzung(): Kontext | null {
  return useContext(SitzungsKontext);
}
```

- [ ] **Step 4: `components/umfrage/StimmzettelImBrowser.tsx` schreiben**

```tsx
"use client";

import type { ReactNode } from "react";

import { useStartSitzung } from "@/components/story/StartSitzung";
import { eigeneStimmeAuf, stimmzettelAnzeige, type StimmzettelAnzeige } from "@/lib/startseite-sitzung";

/**
 * Die Aktionszeile des statischen Stimmzettels (Startseite, Spec 2026-10-01,
 * statische Seiten, 4.3): Alle Varianten rendert der Server vorab, der Browser
 * wählt nach dem Stand von /api/startseite. Über das Schreiben entscheidet
 * weiter allein die Server Action.
 */
export function StimmzettelAktion({
  umfrageId,
  varianten,
}: {
  umfrageId: string;
  varianten: Record<StimmzettelAnzeige, ReactNode>;
}) {
  const sitzung = useStartSitzung();
  return <>{varianten[sitzung ? stimmzettelAnzeige(sitzung.stand, umfrageId) : "laedt"]}</>;
}

/** Vermerk und Badge der eigenen Stimme, sobald der Browser sie kennt. */
export function EigeneStimme({
  umfrageId,
  optionId,
  children,
}: {
  umfrageId: string;
  optionId: string;
  children: ReactNode;
}) {
  const sitzung = useStartSitzung();
  return sitzung && eigeneStimmeAuf(sitzung.stand, umfrageId, optionId) ? <>{children}</> : null;
}
```

- [ ] **Step 5: `Kandidat` mit Vermerk aus dem Browser**

In `components/umfrage/Kandidat.tsx`:

Imports ergänzen (nach `import Link from "next/link";`):

```ts
import type { ReactNode } from "react";
```

und nach `import { namenLinkKlassen } from "@/components/ui/textlink";`:

```ts
import { EigeneStimme } from "@/components/umfrage/StimmzettelImBrowser";
```

In `KandidatProps` die Zeile `gewaehlt: boolean;` ersetzen durch:

```ts
  /**
   * Liegt die eigene Stimme hier? true/false weiß der Server (/umfragen). Mit
   * { umfrageId } entscheidet der Browser (statische Startseite, EigeneStimme).
   */
  gewaehlt: boolean | { umfrageId: string };
```

Vor `export function Kandidat(` einfügen:

```tsx
/** Zeigt den Inhalt nur bei der eigenen Stimme, auch wenn erst der Browser sie kennt. */
function BeiEigenerStimme({
  gewaehlt,
  optionId,
  children,
}: {
  gewaehlt: KandidatProps["gewaehlt"];
  optionId: string;
  children: ReactNode;
}) {
  if (gewaehlt === true) return children;
  if (gewaehlt === false) return null;
  return (
    <EigeneStimme umfrageId={gewaehlt.umfrageId} optionId={optionId}>
      {children}
    </EigeneStimme>
  );
}
```

Den Vermerk ersetzen. Alt:

```tsx
          {gewaehlt ? (
            <span aria-hidden="true" data-story="vermerk" className={VERMERK}>
              x
            </span>
          ) : null}
```

Neu:

```tsx
          <BeiEigenerStimme gewaehlt={gewaehlt} optionId={option.id}>
            <span aria-hidden="true" data-story="vermerk" className={VERMERK}>
              x
            </span>
          </BeiEigenerStimme>
```

Das Badge ersetzen. Alt:

```tsx
          {gewaehlt ? <Badge variante="accent">{texte.deineStimme}</Badge> : null}
```

Neu:

```tsx
          <BeiEigenerStimme gewaehlt={gewaehlt} optionId={option.id}>
            <Badge variante="accent">{texte.deineStimme}</Badge>
          </BeiEigenerStimme>
```

- [ ] **Step 6: `UmfrageKarte` mit Zustand aus dem Browser**

In `components/umfrage/UmfrageKarte.tsx`:

Nach `import { StimmFormular } from "@/components/umfrage/StimmFormular";` einfügen:

```ts
import { StimmzettelAktion } from "@/components/umfrage/StimmzettelImBrowser";
```

In `type Props` die Zeile `zustand: StimmZustand;` ersetzen durch:

```ts
  /** "im-browser": statische Startseite, der Zustand kommt aus /api/startseite (StimmzettelAktion). */
  zustand: StimmZustand | "im-browser";
```

In `UmfrageKarte` die Zeile

```ts
  const gewaehlteOption = zeigeStimmen && zustand.art === "ABGESTIMMT" ? zustand.optionId : null;
```

ersetzen durch:

```ts
  const gewaehlteOption =
    zustand !== "im-browser" && zeigeStimmen && zustand.art === "ABGESTIMMT" ? zustand.optionId : null;
```

Im `Kandidat`-Aufruf `gewaehlt={option.id === gewaehlteOption}` ersetzen durch:

```tsx
              gewaehlt={zustand === "im-browser" ? zeigeStimmen && { umfrageId: umfrage.id } : option.id === gewaehlteOption}
```

Den Block der Aktionszeile ersetzen. Alt:

```tsx
      <div className="border-t border-border bg-surface-raised px-6 py-4">
        <Aktionsbereich umfrage={umfrage} zustand={zustand} ort={ort} w={w} />
      </div>
```

Neu:

```tsx
      <div className="border-t border-border bg-surface-raised px-6 py-4">
        {zustand === "im-browser" && umfrage.phase === "ABSTIMMUNG" ? (
          <StimmzettelAktion
            umfrageId={umfrage.id}
            varianten={{
              laedt: (
                <p aria-busy="true" className="min-h-11 text-small text-text-muted">
                  <span className="sr-only">{w.start.skelett.abstimmung}</span>
                </p>
              ),
              fehler: <p className="text-small text-text-muted">{w.start.abstimmung.fehler}</p>,
              veraltet: (
                <Link prefetch={false} href="/umfragen" className={buttonKlassen("secondary", "md")}>
                  {w.reviews.zurAbstimmung}
                </Link>
              ),
              ANONYM: <Aktionsbereich umfrage={umfrage} zustand={{ art: "ANONYM" }} ort={ort} w={w} />,
              FREIGABE_OFFEN: <Aktionsbereich umfrage={umfrage} zustand={{ art: "FREIGABE_OFFEN" }} ort={ort} w={w} />,
              STIMMBERECHTIGT: <Aktionsbereich umfrage={umfrage} zustand={{ art: "STIMMBERECHTIGT" }} ort={ort} w={w} />,
              ABGESTIMMT: <Aktionsbereich umfrage={umfrage} zustand={{ art: "ABGESTIMMT", optionId: "" }} ort={ort} w={w} />,
            }}
          />
        ) : (
          <Aktionsbereich umfrage={umfrage} zustand={zustand === "im-browser" ? { art: "ANONYM" } : zustand} ort={ort} w={w} />
        )}
      </div>
```

Außerhalb der Abstimmungsphase hängt die Aktionszeile nicht vom Zustand ab; deshalb dort direkt `Aktionsbereich`.

- [ ] **Step 7: `StimmFormular` lädt auf der Startseite die Insel neu**

In `components/umfrage/StimmFormular.tsx` nach `import { stimmeAbgeben } from "@/app/[lang]/umfragen/aktionen";` einfügen:

```ts
import { useStartSitzung } from "@/components/story/StartSitzung";
```

Nach `const router = useRouter();` einfügen:

```ts
  const sitzung = useStartSitzung();
```

Am Ende von `absenden` die Zeile `    router.refresh();` ersetzen durch:

```ts
    // Auf der statischen Startseite holt die Insel ihren Zustand neu; refresh()
    // brächte dort nur die gecachte Seite (Spec 2026-10-01, statische Seiten, 4.3).
    if (sitzung) sitzung.neuLaden();
    else router.refresh();
```

- [ ] **Step 8: `Abstimmung` ohne Sitzung**

In `components/story/Abstimmung.tsx`:

Die Imports `import { stimmZustand } from "@/components/umfrage/stimmzustand";`, `import { aktuellesMitglied } from "@/lib/session";` löschen und `import { aktiveUmfrage, eigeneStimme } from "@/lib/query/umfragen";` ersetzen durch `import { aktiveUmfrage } from "@/lib/query/umfragen";`.

Kommentar und Ladeteil von `Stimmzettel` ersetzen. Alt:

```tsx
/**
 * Der Stimmzettel. Der Zustand entsteht hier und nur hier; die Karte zeigt
 * ihn an, und über das Schreiben entscheidet die Server Action erneut.
 * Umfrage und Sitzung laden parallel; die eigene Stimme nur für freigegebene
 * Mitglieder.
 */
async function Stimmzettel() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const geladen = await sicher(
    async () => {
      const [umfrage, mitglied] = await Promise.all([aktiveUmfrage(), aktuellesMitglied()]);
      const optionId =
        umfrage && mitglied?.freigegeben ? await eigeneStimme(umfrage.id, mitglied.mitgliedId) : null;
      return { umfrage, mitglied, optionId };
    },
    null,
    "Stimmzettel",
  );
```

Neu:

```tsx
/**
 * Der Stimmzettel. Die Seite ist statisch (Spec 2026-10-01, statische Seiten,
 * 4.3): hier lädt nur die Runde; wer schaut und ob er schon gestimmt hat,
 * klärt der Browser über /api/startseite (StimmzettelAktion). Über das
 * Schreiben entscheidet die Server Action.
 */
async function Stimmzettel() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const geladen = await sicher(async () => ({ umfrage: await aktiveUmfrage() }), null, "Stimmzettel");
```

Am Ende von `Stimmzettel`:

```tsx
  const { umfrage, mitglied, optionId } = geladen;
```

ersetzen durch:

```tsx
  const { umfrage } = geladen;
```

und

```tsx
  return <UmfrageKarte umfrage={umfrage} zustand={stimmZustand(mitglied, optionId)} w={w} sprache={sprache} />;
```

durch:

```tsx
  return <UmfrageKarte umfrage={umfrage} zustand="im-browser" w={w} sprache={sprache} />;
```

- [ ] **Step 9: Startseite in `StartSitzung` fassen**

In `app/[lang]/page.tsx` nach den bestehenden Imports `import { StartSitzung } from "@/components/story/StartSitzung";` einfügen und den Rückgabewert von `StartPage` einfassen:

```tsx
export default function StartPage() {
  return (
    <StartSitzung>
      <div className="relative isolate bg-surface">
        <FeldbuchRaster />
        <Auftakt />
        {/* Band der Terpene zwischen Hero und Story (Nutzer 2026-09-30). */}
        <TerpenBand />
        <TransparentMachen />
        {/* T12: Register der Terpene und Geschmäcker, vor der Aroma-Karte (Nutzer 2026-09-29). */}
        <TerpenRegister />
        <AromaSektion />
        <WissenBuendeln />
        <GemeinsamLernen />
        <NeuesterEintrag />
        <Empfehlungen />
        <Abstimmung />
        <Katalog />
        <StoryBuehne />
      </div>
    </StartSitzung>
  );
}
```

`export const dynamic = "force-dynamic";` bleibt in diesem Task noch stehen (Task 9 stellt um).

- [ ] **Step 10: Tests, Typprüfung, Lint**

Run: `npx tsx --test tests/startseite-statisch.test.ts tests/umfrage-karte.test.ts tests/bewegung.test.ts tests/stimmzustand.test.ts`
Expected: PASS.

Run: `npm test` und `npm run typecheck`
Expected: grün, keine Fehler.

Run: `npx eslint components/story/StartSitzung.tsx components/umfrage components/story/Abstimmung.tsx "app/[lang]/page.tsx"`
Expected: keine Meldungen.

- [ ] **Step 11: Commit**

```bash
git add components/story/StartSitzung.tsx components/umfrage components/story/Abstimmung.tsx "app/[lang]/page.tsx" tests/startseite-statisch.test.ts
git commit -m "feat(start): Stimmzettel der Startseite holt den Zustand im Browser

Die Karte rendert alle Varianten der Aktionszeile vorab, StartSitzung wählt nach
/api/startseite. Nach dem Abstimmen lädt die Insel neu statt der gecachten Seite.
/umfragen bleibt serverseitig (Spec 2026-10-01, 4.3).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Empfehlungen und Katalog im Browser, Startseite statisch

**Files:**
- Create: `components/empfehlung/EmpfehlungenImBrowser.tsx`
- Create: `components/produkt/BudpicBeitragenImBrowser.tsx`
- Modify: `components/story/Empfehlungen.tsx` (Imports, Inhalt)
- Modify: `components/produkt/BudpicBeitragen.tsx` (Props-Typ exportieren)
- Modify: `components/produkt/ProduktCard.tsx` (Props, Fußzeile)
- Modify: `components/story/Katalog.tsx` (Imports, `Reihe`)
- Modify: `app/[lang]/page.tsx` (Segment-Konfiguration, Kommentar)
- Modify: `tests/statische-seiten.test.ts` (Tabelle `STATISCH`)
- Modify: `tests/startseite-statisch.test.ts` (neuer Test)

**Interfaces:**
- Consumes: `useStartSitzung` (Task 8); `empfehlungenAnzeige` (Task 7); `EmpfehlungsListe`, `EmpfehlungsEintrag`; `BudpicBeitragen`.
- Produces: `EmpfehlungenImBrowser({ varianten, texte })`; `BudpicBeitragenImBrowser(props: Omit<BudpicBeitragenProps, "zugang">)`; `type BudpicBeitragenProps`; `ProduktCard` nimmt `zugang?: BudpicZugang | "im-browser"`.

- [ ] **Step 1: Failing tests erweitern**

In `tests/statische-seiten.test.ts` die Tabelle ersetzen durch:

```ts
const STATISCH: Record<string, string> = {
  "app/[lang]/page.tsx": "300",
  "app/[lang]/impressum/page.tsx": "86400",
  "app/[lang]/datenschutz/page.tsx": "86400",
  "app/[lang]/zugang/page.tsx": "false",
};
```

In `tests/startseite-statisch.test.ts` am Ende anfügen:

```ts
test("Empfehlungen und Katalog der Startseite lesen keine Sitzung und keinen Fachkreis", () => {
  for (const datei of ["components/story/Empfehlungen.tsx", "components/story/Katalog.tsx"]) {
    assert.doesNotMatch(lies(datei), /lib\/session|aktuellesMitglied|budpicZugang\(|istFachkreis|ladeEmpfehlungen/, datei);
  }
  assert.match(lies("components/story/Katalog.tsx"), /ladeStrainListe\(leererFilter\(\), false\)/);
  assert.match(lies("components/story/Katalog.tsx"), /zugang="im-browser"/);
  for (const datei of ["components/empfehlung/EmpfehlungenImBrowser.tsx", "components/produkt/BudpicBeitragenImBrowser.tsx"]) {
    assert.doesNotMatch(lies(datei), /fetch\(/, datei);
  }
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/statische-seiten.test.ts tests/startseite-statisch.test.ts`
Expected: FAIL (Startseite noch `force-dynamic`, Katalog liest `istFachkreis`).

- [ ] **Step 3: `components/empfehlung/EmpfehlungenImBrowser.tsx` schreiben**

```tsx
"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { useStartSitzung } from "@/components/story/StartSitzung";
import { einzelLinkKlassen } from "@/components/ui/textlink";
import { empfehlungenAnzeige } from "@/lib/startseite-sitzung";

type Props = {
  /** Vom Server vorab gerendert: alles außer der Liste selbst. */
  varianten: { laedt: ReactNode; fehler: ReactNode; gast: ReactNode; leer: ReactNode };
  texte: { startSatz: string; hinweis: string; konto: string };
};

/**
 * „Was dir schmecken könnte“ auf der statischen Startseite (T11; Spec
 * 2026-10-01, statische Seiten, 4.3): Die Liste kommt samt Begründung in der
 * Sprache der Anfrage aus /api/startseite. Nur Aroma, nie Wirkung (HWG).
 */
export function EmpfehlungenImBrowser({ varianten, texte }: Props) {
  const sitzung = useStartSitzung();
  const anzeige = sitzung ? empfehlungenAnzeige(sitzung.stand) : ({ art: "laedt" } as const);
  if (anzeige.art !== "liste") return <>{varianten[anzeige.art]}</>;
  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.startSatz}</p>
      <EmpfehlungsListe eintraege={anzeige.eintraege} />
      <p className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <span className="text-caption text-text-muted">{texte.hinweis}</span>
        <Link prefetch={false} href="/mitglied" className={einzelLinkKlassen()}>
          {texte.konto}
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: `components/story/Empfehlungen.tsx` umstellen**

Den Import-Block ersetzen durch:

```tsx
import Link from "next/link";

import { EmpfehlungenImBrowser } from "@/components/empfehlung/EmpfehlungenImBrowser";
import { Schlagwort } from "@/components/story/Schlagwort";
import { SKELETT_FLAECHE, SkelettAnsage } from "@/components/story/Skelette";
import { buttonKlassen } from "@/components/ui";
import { holeWoerterbuch } from "@/lib/i18n";
```

Die Funktion `EmpfehlungenInhalt` samt Kommentar darüber löschen (`EmpfehlungenSkelett` bleibt).

In `Empfehlungen` den Block

```tsx
        <Suspense fallback={<EmpfehlungenSkelett ansage={texte.laden} />}>
          <EmpfehlungenInhalt />
        </Suspense>
```

ersetzen durch:

```tsx
        {/* Statische Seite (Spec 2026-10-01, statische Seiten, 4.3): die Liste holt der Browser. */}
        <EmpfehlungenImBrowser
          texte={{ startSatz: texte.startSatz, hinweis: texte.hinweis, konto: w.kopf.navigation.konto }}
          varianten={{
            laedt: <EmpfehlungenSkelett ansage={texte.laden} />,
            fehler: <p className="border border-border bg-surface-raised p-8 text-body text-text">{texte.fehler}</p>,
            gast: (
              <div className="flex flex-col items-start gap-6">
                <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.startSatzGast}</p>
                <Link prefetch={false} href="/anmelden?weiter=%2F%23empfehlungen" className={buttonKlassen("primary", "md")}>
                  {texte.anmelden}
                </Link>
                <p className="text-caption text-text-muted">{texte.hinweis}</p>
              </div>
            ),
            leer: (
              <div className="flex flex-col items-start gap-6">
                <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.leer}</p>
                <Link prefetch={false} href="/blueten" className={buttonKlassen("secondary", "md")}>
                  {texte.zuDenBlueten}
                </Link>
              </div>
            ),
          }}
        />
```

Der Skelett-Platzhalter trägt weiter `data-skelett`: Die StoryBuehne startet erst, wenn `/api/startseite` geantwortet hat (höchstens 8 s).

- [ ] **Step 5: Budpic-Zugang aus dem Browser**

In `components/produkt/BudpicBeitragen.tsx` direkt nach dem Ende von `type Props = { … };` einfügen:

```ts
export type BudpicBeitragenProps = Props;
```

`components/produkt/BudpicBeitragenImBrowser.tsx`:

```tsx
"use client";

import { BudpicBeitragen, type BudpicBeitragenProps } from "@/components/produkt/BudpicBeitragen";
import { useStartSitzung } from "@/components/story/StartSitzung";

/**
 * „Bild beitragen“ an den Katalogkarten der statischen Startseite (Spec
 * 2026-10-01, statische Seiten, 4.3): Wer schaut, sagt /api/startseite. Bis
 * dahin steht nichts da, damit kein falscher Anmelde-Link aufblitzt.
 */
export function BudpicBeitragenImBrowser(props: Omit<BudpicBeitragenProps, "zugang">) {
  const stand = useStartSitzung()?.stand;
  if (stand?.status !== "fertig") return null;
  return <BudpicBeitragen {...props} zugang={stand.daten.budpicZugang} />;
}
```

In `components/produkt/ProduktCard.tsx`:
- nach `import { BudpicBeitragen, type BudpicZugang } from "@/components/produkt/BudpicBeitragen";` einfügen: `import { BudpicBeitragenImBrowser } from "@/components/produkt/BudpicBeitragenImBrowser";`
- in `type Props` die Zeilen

```ts
  /** Wer schaut, fuer "Bild beitragen". */
  zugang?: BudpicZugang;
```

ersetzen durch:

```ts
  /** Wer schaut, fuer "Bild beitragen". "im-browser": statische Startseite, aus /api/startseite. */
  zugang?: BudpicZugang | "im-browser";
```

- den Aufruf von `BudpicBeitragen` in der Fußzeile ersetzen. Alt:

```tsx
        <BudpicBeitragen
          zugang={zugang}
          strainId={strain.id}
          slug={strain.slug}
          sprache={sprache}
          texte={w.budpic}
          meldungen={budpicMeldungen(w)}
          kompakt
        />
```

Neu:

```tsx
        {zugang === "im-browser" ? (
          <BudpicBeitragenImBrowser
            strainId={strain.id}
            slug={strain.slug}
            sprache={sprache}
            texte={w.budpic}
            meldungen={budpicMeldungen(w)}
            kompakt
          />
        ) : (
          <BudpicBeitragen
            zugang={zugang}
            strainId={strain.id}
            slug={strain.slug}
            sprache={sprache}
            texte={w.budpic}
            meldungen={budpicMeldungen(w)}
            kompakt
          />
        )}
```

- [ ] **Step 6: Katalog der Startseite ohne Sitzung und Fachkreis**

In `components/story/Katalog.tsx`:
- `import { budpicZugang, ladeFreieBudpics } from "@/lib/query/budpics";` ersetzen durch `import { ladeFreieBudpics } from "@/lib/query/budpics";`
- `import { istFachkreis } from "@/lib/query/fachkreis";` löschen.
- Den Kommentar `/** Sechs Produkte als wischbare Reihe. Preise nur mit Freigabe (bestehende Logik). */` ersetzen durch:

```ts
/**
 * Sechs Produkte als wischbare Reihe. Die Startseite ist statisch und für alle
 * gleich (Spec 2026-10-01, statische Seiten, 4.3): ohne Fachkreis-Sicht, die
 * bleibt auf /blueten. „Bild beitragen“ klärt der Browser.
 */
```

- In `Reihe` die Zeile `    async () => ladeStrainListe(leererFilter(), await istFachkreis()),` ersetzen durch `    async () => ladeStrainListe(leererFilter(), false),`.
- Den Block

```tsx
  const [budpics, zugang] = await Promise.all([
    sicher(() => ladeFreieBudpics(eintraege.map((e) => e.id)), new Map(), "Katalog-Budpics"),
    sicher(() => budpicZugang(), "gast" as const, "Katalog-Zugang"),
  ]);
```

ersetzen durch:

```tsx
  const budpics = await sicher(() => ladeFreieBudpics(eintraege.map((e) => e.id)), new Map(), "Katalog-Budpics");
```

- Im `ProduktCard`-Aufruf `zugang={zugang}` ersetzen durch `zugang="im-browser"`.

- [ ] **Step 7: Startseite statisch**

In `app/[lang]/page.tsx` den Absatz und die Konfiguration

```tsx
 *
 * force-dynamic: die Seite ist nutzerbezogen (eigene Stimme, Preise nur mit
 * Freigabe) und darf nie als Ganzes gecacht werden.
 */
export const dynamic = "force-dynamic";
```

ersetzen durch:

```tsx
 *
 * Statisch je Sprache, alle 300 s neu (Spec 2026-10-01, statische Seiten,
 * 4.3): Was vom Betrachter abhängt (Stimmzettel, Empfehlungen, Budpic-Zugang),
 * holt StartSitzung im Browser. force-static macht cookies() und headers()
 * leer: eine vergessene Sitzungsabfrage zeigt hier die Gastansicht, statt die
 * Seite dynamisch zu machen.
 */
export const dynamic = "force-static";
export const revalidate = 300;
```

- [ ] **Step 8: Tests, Typprüfung, Lint**

Run: `npx tsx --test tests/statische-seiten.test.ts tests/startseite-statisch.test.ts tests/titelblatt.test.ts tests/prefetch.test.ts`
Expected: PASS.

Run: `npm test` und `npm run typecheck`
Expected: grün, keine Fehler.

Run: `npx eslint components/empfehlung components/produkt components/story/Empfehlungen.tsx components/story/Katalog.tsx "app/[lang]/page.tsx"`
Expected: keine Meldungen.

- [ ] **Step 9: Commit**

```bash
git add components/empfehlung components/produkt components/story/Empfehlungen.tsx components/story/Katalog.tsx "app/[lang]/page.tsx" tests/statische-seiten.test.ts tests/startseite-statisch.test.ts
git commit -m "feat(start): Startseite statisch je Sprache, alle 300 s neu

Empfehlungen und „Bild beitragen“ holt der Browser über /api/startseite, der
Katalog zeigt die Sicht ohne Fachkreis. Damit liest die Startseite keine Sitzung
mehr und kommt aus dem Cache (Spec 2026-10-01, 4.3).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: `/reviews` statisch, Prüfpunkt 2 (Push, Live-Prüfung, Log-Vergleich)

**Files:**
- Modify: `app/[lang]/reviews/page.tsx:12-17`
- Modify: `tests/statische-seiten.test.ts` (Tabelle `STATISCH`)

**Interfaces:**
- Consumes: alles aus Task 1 bis 9.
- Produces: Bericht mit Live-Befunden und CPU-Vergleich (für Task 11).

- [ ] **Step 1: Failing test**

In `tests/statische-seiten.test.ts` die Tabelle ersetzen durch:

```ts
const STATISCH: Record<string, string> = {
  "app/[lang]/page.tsx": "300",
  "app/[lang]/reviews/page.tsx": "300",
  "app/[lang]/impressum/page.tsx": "86400",
  "app/[lang]/datenschutz/page.tsx": "86400",
  "app/[lang]/zugang/page.tsx": "false",
};
```

Run: `npx tsx --test tests/statische-seiten.test.ts`
Expected: FAIL (`/reviews` noch `force-dynamic`).

- [ ] **Step 2: `/reviews` umstellen**

In `app/[lang]/reviews/page.tsx` ersetzen. Alt:

```tsx
/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank.
 * Anders als `/` und `/umfragen` ist diese Seite nicht nutzerbezogen - sie
 * ist der erste Kandidat fuer ISR, sobald die Cache-Bindings (KV, D1-Tags) stehen.
 */
export const dynamic = "force-dynamic";
```

Neu:

```tsx
/**
 * Statisch je Sprache, alle 300 s neu (Spec 2026-10-01, statische Seiten,
 * 4.3). Gerendert beim ersten Aufruf, nicht im Build: dort gibt es keine
 * erreichbare Datenbank. Die Seite ist nicht nutzerbezogen.
 */
export const dynamic = "force-static";
export const revalidate = 300;
```

- [ ] **Step 3: Tests, Typprüfung, Lint**

Run: `npm test` und `npm run typecheck`
Expected: grün, keine Fehler.

Run: `npx eslint "app/[lang]/reviews/page.tsx"`
Expected: keine Meldungen.

- [ ] **Step 4: Commit und Push (Prüfpunkt 2)**

Frühestens 15 min nach dem Push aus Task 6.

```bash
git add "app/[lang]/reviews/page.tsx" tests/statische-seiten.test.ts
git commit -m "feat(cache): /reviews statisch je Sprache, alle 300 s neu

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 5: Auf den Build warten und Build-Log prüfen**

Bash mit `run_in_background: true`: `sleep 840`. Auf die Benachrichtigung warten, nicht pollen. Dann einmal Tool `mcp__plugin_cloudflare_cloudflare__execute`:

```js
async () => {
  const builds = await cloudflare.request({
    method: "GET",
    path: `/accounts/${accountId}/builds/workers/1406f98f6bac4ea19a123496391118c7/builds`,
  });
  const letzter = builds.result[0];
  const log = await cloudflare.request({
    method: "GET",
    path: `/accounts/${accountId}/builds/builds/${letzter.build_uuid}/logs`,
  });
  const zeilen = (log.result?.lines ?? []).map((z) => z[1]);
  return {
    stand: [letzter.build_outcome, letzter.created_on, letzter.build_trigger_metadata?.commit_hash?.slice(0, 7)],
    routen: zeilen.filter((t) => /\[lang\]|Proxy|○|●|ƒ/.test(t)),
    cache: zeilen.filter((t) => /KV|populat|cache/i.test(t)),
    fehler: zeilen.filter((t) => /error|failed/i.test(t)).slice(0, 20),
  };
}
```

Expected: `success` mit dem Commit aus Step 4; `/[lang]`, `/[lang]/reviews`, `/[lang]/impressum`, `/[lang]/datenschutz`, `/[lang]/zugang` nicht als `ƒ`; KV-Befüllung ohne Fehler.

- [ ] **Step 6: Live abgemeldet**

PowerShell:

```powershell
$u = 'https://cn-medcan.w-helwich.workers.dev'
function Abruf($pfad, $sprache) {
  $kopf = @{}
  if ($sprache) { $kopf['Accept-Language'] = $sprache }
  try {
    $r = Invoke-WebRequest -UseBasicParsing "$u$pfad" -MaximumRedirection 0 -Headers $kopf
    $lang = if ($r.Content -match '<html[^>]*lang="([^"]+)"') { $Matches[1] } else { '-' }
    "$pfad $($r.StatusCode) lang=$lang cache=$($r.Headers['x-opennext-cache'])/$($r.Headers['x-nextjs-cache'])"
  } catch {
    "$pfad $($_.Exception.Response.StatusCode.value__) -> $($_.Exception.Response.Headers['Location'])"
  }
}
Abruf '/' $null
Abruf '/reviews' $null
Abruf '/api/startseite' $null
Abruf '/impressum' $null
```

Expected: `/`, `/reviews`, `/api/startseite` je 307 auf `/zugang?weiter=…`; `/impressum` 200.

- [ ] **Step 7: Live angemeldet (Browser-MCP)**

1. `/` zweimal laden; per `javascript_tool` die Antwort prüfen: `fetch('/', {credentials:'same-origin'}).then(r => [r.status, r.headers.get('x-opennext-cache'), r.headers.get('x-nextjs-cache')])`. Expected beim zweiten Mal: `HIT` in einem der Header.
2. Startseite: Abschnitt „Was dir schmecken könnte“ zeigt Liste, Leer- oder Gasttext (nicht das Skelett); Stimmzettel zeigt eine Aktionszeile passend zum Konto; Katalogkarten zeigen „Bild beitragen“ passend zum Konto; Animationen laufen (StoryBuehne startet).
3. Hat das Konto noch nicht abgestimmt und läuft eine Abstimmung: nicht abstimmen, ohne den Nutzer zu fragen (eine echte Stimme ist nicht umkehrbar). Stattdessen per `javascript_tool` prüfen: `fetch('/api/startseite').then(r => r.json())` liefert `abstimmung.zustand.art` und dieselbe `umfrageId` wie die Karte.
4. `/reviews` lädt in Deutsch und Englisch (Sprachknopf), Inhaltsverzeichnis-Sprünge `#eintrag-…` funktionieren.
5. `/umfragen`, `/mitglied`, eine Blütenseite: unverändert dynamisch und funktionsfähig.

- [ ] **Step 8: CPU-Vergleich**

Tool `mcp__plugin_cloudflare_cloudflare__execute`, letzte 60 min je Pfad zusammengefasst:

```js
async () => {
  const jetzt = Date.now();
  const r = await cloudflare.request({
    method: "POST",
    path: `/accounts/${accountId}/workers/observability/telemetry/query`,
    body: {
      queryId: "adhoc",
      view: "events",
      timeframe: { from: jetzt - 60 * 60e3, to: jetzt },
      limit: 2000,
      parameters: {
        datasets: ["cloudflare-workers"],
        filters: [{ key: "$workers.scriptName", operation: "eq", type: "string", value: "cn-medcan" }],
      },
    },
  });
  const gruppen = {};
  for (const e of r.result.events.events) {
    const w = e.$workers ?? {};
    if (w.cpuTimeMs == null) continue;
    const url = w.event?.request?.url ?? "";
    const pfad = url ? new URL(url).pathname.replace(/\/blueten\/[^/]+/, "/blueten/:s") : "?";
    (gruppen[pfad] ??= []).push([w.cpuTimeMs, w.outcome]);
  }
  return Object.entries(gruppen).map(([pfad, werte]) => {
    const cpu = werte.map((x) => x[0]).sort((a, b) => a - b);
    const ueber = werte.filter((x) => x[1] === "exceededCpu").length;
    return `${pfad} n=${cpu.length} p50=${cpu[cpu.length >> 1]} max=${cpu[cpu.length - 1]} exceededCpu=${ueber}`;
  });
}
```

Expected: `/`, `/reviews`, `/impressum` mit niedrigem Median bei Cache-Treffern. Ergebnis wörtlich in den Bericht. Den Vergleich über 24 h (Spec 6.) als offenen Punkt für die nächste Session in HANDOFF notieren (Task 11).

---

### Task 11: Doku und Übergabe

**Files:**
- Modify: `.claude/skills/edge-stack-master.md` (Abschnitt 6, Absatz „Wenn ISR genutzt wird …“)
- Modify: `docs/superpowers/specs/2026-10-01-statische-seiten-sprache-in-url-design.md` (Kopfzeile „Stand“)
- Modify: `HANDOFF.md` (neuer Abschnitt oben unter „Hier geht es weiter“)

**Interfaces:**
- Consumes: Bericht aus Task 6 und Task 10.
- Produces: aktueller Stand für die nächste Session.

- [ ] **Step 1: Regelwerk an die Entscheidung anpassen**

In `.claude/skills/edge-stack-master.md`, Abschnitt 6, die Aufzählungspunkte

```markdown
- ein **Service-Binding `WORKER_SELF_REFERENCE`**, das auf den eigenen Worker (`cn-medcan`) zeigt,
- für zeitbasierte Revalidation zusätzlich eine Durable-Object-Queue (`NEXT_CACHE_DO_QUEUE`), für
  On-Demand-Revalidation zusätzlich ein Tag-Cache-Binding,
```

ersetzen durch:

```markdown
- ein **Service-Binding `WORKER_SELF_REFERENCE`**, das auf den eigenen Worker (`cn-medcan`) zeigt,
- für zeitbasierte Revalidation die **memoryQueue** über dieses Service-Binding (Entscheid 2026-10-01:
  keine Durable Objects; bei unserer Last reicht die Entdoppelung je Isolate), für On-Demand-Revalidation
  zusätzlich ein Tag-Cache-Binding (derzeit keins: `revalidatePath` wirkt nicht auf den Cache),
- **so umgesetzt seit 2026-10-01**: `open-next.config.ts` (KV hinter Regional Cache ohne Nachladen je Treffer,
  memoryQueue, Cache-Interception), Seiten schalten je Seite per `dynamic = "force-static"` plus `revalidate`
  um, die Sprache steht im internen Segment `app/[lang]` (Spec
  `docs/superpowers/specs/2026-10-01-statische-seiten-sprache-in-url-design.md`),
```

und in der Abschluss-Checkliste `NEXT_INC_CACHE_R2_BUCKET` ersetzen durch `NEXT_INC_CACHE_KV`.

- [ ] **Step 2: Spec-Stand**

In der Spec die Zeile `**Stand:** …` ersetzen durch `**Stand:** umgesetzt 2026-10-01 (Plan docs/superpowers/plans/2026-10-01-statische-seiten.md), live seit dem Push aus Task 10.`

- [ ] **Step 3: HANDOFF ergänzen**

In `HANDOFF.md` unter `## ⇢ Hier geht es weiter` einen neuen Abschnitt `### ⇢ SESSION 37 (2026-10-01): Statische Seiten gegen 1102` mit: was live ist (Commits), Befunde aus Task 6 und Task 10 (Cache-Header, CPU-Tabelle), offene Punkte (24-h-Vergleich der Logs gegen den Befund vom 2026-10-01: Startseite kalt 400 bis 1832 ms, 62× exceededCpu in 24 h; Abstimmen auf der Startseite live mit dem Nutzer prüfen; Live-Prüfliste aus Session 36). Kurz, Stichpunkte wie die Abschnitte darunter.

- [ ] **Step 4: Commit und Push**

```bash
git add .claude/skills/edge-stack-master.md docs/superpowers/specs/2026-10-01-statische-seiten-sprache-in-url-design.md HANDOFF.md
git commit -m "docs: statische Seiten umgesetzt, Regelwerk und HANDOFF nachgezogen

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

(Ein reiner Doku-Push löst einen Build mit identischem Code aus und ist unkritisch.)
