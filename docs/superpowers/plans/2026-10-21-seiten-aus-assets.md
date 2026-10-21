# Seiten aus Assets, Worker nur als Tor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leseseiten kommen als fertige Dateien aus Static Assets, `worker.mjs` prüft nur das Gate und liefert sie aus; kein 1102 mehr auf dem Free-Plan.

**Architecture:** Next rendert im Workers Build wie bisher vor (D1-Abzug, `VORRENDERN=1`). Ein neuer Schritt verschiebt das vorgerenderte HTML der Leseseiten nach `.open-next/assets/_seiten/` und entfernt diese Einträge aus dem KV-Vorrat. `worker.mjs` bildet die Adresse auf die Datei ab und antwortet über `env.ASSETS.fetch`, ohne Next. Persönliches lädt eine Client-Insel über `/api/ich/strain`. Änderungen stoßen über einen Deploy-Hook einen Neubau an (≤ 15 am Tag plus einer täglich).

**Tech Stack:** Next.js 16.3.6, @opennextjs/cloudflare 1.20.x, Cloudflare Workers Free (Static Assets, Workers Builds, D1, Cron), Prisma + D1, Tests mit `tsx --test` (node:test).

**Spec:** `docs/superpowers/specs/2026-10-21-seiten-aus-assets-design.md`

## Global Constraints

- Kostenlos, nie Paid: Workers Free, Static Assets (≤ 20 000 Dateien je Version, ≤ 25 MiB je Datei), Workers Builds Free (3000 Build-Minuten/Monat, 1 gleichzeitig, Timeout 20 min).
- Leseseiten: CPU je Aufruf Median ≤ 3 ms, nie über 10 ms.
- Neue Bewertung öffentlich nach etwa 5 Minuten.
- Hinweis nach jedem Speichern einer Bewertung: Beta, erscheint in etwa 5 Minuten.
- Deploy-Hook-URL ist ein Secret (`DEPLOY_HOOK_URL`, `wrangler secret put`), nie in `wrangler.jsonc`.
- Deploy-Hook dedupliziert nur, solange ein Build `queued`/`initializing` ist; Rate-Limit 10/min je Worker.
- Kein `export const runtime = "edge"`; `getCloudflareContext()` nur in `lib/cloudflare.ts` (edge-stack-master).
- Rolle nur aus dem signierten Gate-Token (`lib/gate.ts`), nie aus Query, Header oder ungeprüftem Cookie.
- Wording: Blüte/Strain, Variante; nie „Ware“, nie „Stärke“ in neuen sichtbaren Texten.
- Kein `next dev` lokal; Live-Prüfung per Browser-MCP, Stichproben, keine Schleifen über alle Seiten (Netzwerk schonen).
- Commits auf Deutsch in Prosa, mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- Direkter Abruf `/_seiten/de/blueten/x/standard.html` ohne Gate-Cookie: muss auf `/zugang` umleiten, nie Inhalt liefern (Test in Task 2).
- Adresse mit unbekanntem `?vertreiber=` oder kaputtem Prozent-Encoding: fällt auf die Standardvariante, kein 500 (Test in Task 1).
- Client-Navigation (Next `Link`, Anfrage mit `RSC: 1` bzw. `?_rsc=`) auf eine Leseseite: Tor liefert HTML, Next fällt auf harte Navigation zurück, kein kaputter Zustand (Test in Task 2, Live-Prüfung Task 8).
- Viele Kommentare/Likes an einem Tag: Tageszähler stoppt bei 15 Neubauten, keine Build-Minuten-Lawine (Test in Task 6).
- Mitglied ohne Freigabe bzw. abgelaufene Sitzung: Insel zeigt Hinweis bzw. Gastzustand, nie das Formular (Test in Task 5).

---

## Stränge (parallel, je ein Worktree)

Jeder Implementer lädt vor dem ersten Edit die Skills seiner Task per Skill-Tool und nennt sie im Bericht. Reviews laden zusätzlich superpowers:requesting-code-review, bei UI better-interface und web-design-guidelines.

- **Strang A** (Tor und Dateien): Task 1 → Task 2 → Task 3. Dateien: `lib/seiten-tor.ts`, `worker.mjs`, `wrangler.jsonc`, `scripts/seiten-in-assets.mjs`, `scripts/cf-build.mjs`.
- **Strang B** (Strain-Seite statisch, Insel): Task 4 → Task 5. Dateien: `app/[lang]/blueten/[slug]/**`, `app/api/ich/strain/route.ts`, `components/sorte/**`, `components/produkt/Titelblatt.tsx`.
- **Strang C** (Neubau und Hinweis): Task 6 → Task 7. Dateien: `lib/neubau.ts`, `lib/i18n/revalidiere.ts`, `migrations/0033_neubau.sql`, `lib/i18n/de.ts`, `lib/i18n/en.ts`, `components/review/BewertungsFormular.tsx`.
- **Zusammenführung:** Task 8 (Doku, Deploy, Live-Prüfung als eigener Agent).

Berührungspunkte: Strang A erwartet die Dateinamen aus Task 4 (`<slug>/<auswahl>`). `worker.mjs` wird von A (Tor) und C (Cron) geändert: C ändert nur `scheduled`, A nur `fetch`; beim Merge beide übernehmen.

---

### Task 1: Adresse auf Datei abbilden (reine Funktion)

**Skills:** superpowers:test-driven-development, edge-stack-master, cloudflare:workers-best-practices

**Files:**
- Create: `lib/seiten-tor.ts`
- Test: `tests/seiten-tor.test.ts`

**Interfaces:**
- Produces:
  - `export const SEITEN_PRAEFIX = "/_seiten";`
  - `export function auswahlSegment(vertreiberId: string | null, alle: boolean): string` liefert `"standard"`, `"v-<id>"` oder `"v-<id>-alle"`.
  - `export function seitenDatei(sprache: "de" | "en", pfad: string, suche: URLSearchParams): string | null` liefert den Asset-Pfad oder `null` (keine Leseseite).
  - Leseseiten: `/`, `/blueten`, `/blueten/<slug>`, `/jury`, `/jury/<rest…>`, `/neu`, `/reviews`, `/reviews/<rest…>`.
  - Dateinamen: `/_seiten/<sprache>/index.html` für `/`, sonst `/_seiten/<sprache><pfad>/index.html`. Strain: `/_seiten/<sprache>/blueten/<slug>/<auswahl>.html`.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { auswahlSegment, seitenDatei } from "@/lib/seiten-tor";

const q = (s = "") => new URLSearchParams(s);

test("auswahlSegment: Standard, Vertreiber, alle", () => {
  assert.equal(auswahlSegment(null, false), "standard");
  assert.equal(auswahlSegment("abc", false), "v-abc");
  assert.equal(auswahlSegment("abc", true), "v-abc-alle");
  assert.equal(auswahlSegment(null, true), "standard");
});

test("seitenDatei: feste Leseseiten", () => {
  assert.equal(seitenDatei("de", "/", q()), "/_seiten/de/index.html");
  assert.equal(seitenDatei("en", "/blueten", q("typ=INDICA")), "/_seiten/en/blueten/index.html");
  assert.equal(seitenDatei("de", "/jury/seite/2", q()), "/_seiten/de/jury/seite/2/index.html");
  assert.equal(seitenDatei("de", "/neu", q("f=4")), "/_seiten/de/neu/index.html");
});

test("seitenDatei: Strain mit Auswahl", () => {
  assert.equal(seitenDatei("de", "/blueten/mac-1", q()), "/_seiten/de/blueten/mac-1/standard.html");
  assert.equal(seitenDatei("de", "/blueten/mac-1", q("vertreiber=da73")), "/_seiten/de/blueten/mac-1/v-da73.html");
  assert.equal(seitenDatei("de", "/blueten/mac-1", q("vertreiber=da73&alle=1")), "/_seiten/de/blueten/mac-1/v-da73-alle.html");
});

test("seitenDatei: unbrauchbare Werte fallen auf Standard oder null", () => {
  assert.equal(seitenDatei("de", "/blueten/mac-1", q("vertreiber=../x")), "/_seiten/de/blueten/mac-1/standard.html");
  assert.equal(seitenDatei("de", "/blueten/mac-1", q("ware=irgendwas")), "/_seiten/de/blueten/mac-1/standard.html");
  assert.equal(seitenDatei("de", "/blueten/%E0%A4%A", q()), null);
  assert.equal(seitenDatei("de", "/blueten/a/b", q()), null);
  assert.equal(seitenDatei("de", "/admin", q()), null);
  assert.equal(seitenDatei("de", "/api/katalog", q()), null);
  assert.equal(seitenDatei("de", "/blueten/", q()), "/_seiten/de/blueten/index.html");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/seiten-tor.test.ts`
Expected: FAIL, Modul `@/lib/seiten-tor` nicht gefunden.

- [ ] **Step 3: Write minimal implementation**

```ts
/**
 * Welche Datei unter Static Assets eine Leseseite trägt (Spec 2026-10-21, Seiten aus Assets, 3.1/3.2).
 * Ohne Next- und ohne Node-Abhängigkeit: worker.mjs bündelt diese Datei direkt.
 * `?ware=` wählt seit dem Umbau keine eigene Datei mehr; die Insel belegt die Variante im Formular vor.
 */
export const SEITEN_PRAEFIX = "/_seiten";

const FESTE = [/^\/$/, /^\/blueten$/, /^\/neu$/, /^\/jury(\/[a-z0-9-]+)*$/, /^\/reviews(\/[a-z0-9-]+)*$/];
const STRAIN = /^\/blueten\/([a-z0-9-]+)$/;
const ID = /^[A-Za-z0-9-]{1,64}$/;

export function auswahlSegment(vertreiberId: string | null, alle: boolean): string {
  if (!vertreiberId) return "standard";
  return alle ? `v-${vertreiberId}-alle` : `v-${vertreiberId}`;
}

export function seitenDatei(sprache: "de" | "en", pfad: string, suche: URLSearchParams): string | null {
  let sauber: string;
  try {
    sauber = decodeURIComponent(pfad);
  } catch {
    return null;
  }
  if (sauber.length > 1) sauber = sauber.replace(/\/+$/, "");
  const strain = STRAIN.exec(sauber);
  if (strain) {
    const roh = suche.get("vertreiber");
    const vertreiber = roh && ID.test(roh) ? roh : null;
    return `${SEITEN_PRAEFIX}/${sprache}/blueten/${strain[1]}/${auswahlSegment(vertreiber, suche.get("alle") === "1")}.html`;
  }
  if (!FESTE.some((muster) => muster.test(sauber))) return null;
  return sauber === "/" ? `${SEITEN_PRAEFIX}/${sprache}/index.html` : `${SEITEN_PRAEFIX}/${sprache}${sauber}/index.html`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/seiten-tor.test.ts`
Expected: PASS (4 Tests).

- [ ] **Step 5: Commit**

```bash
git add lib/seiten-tor.ts tests/seiten-tor.test.ts
git commit -m "Tor: Adresse einer Leseseite auf ihre Asset-Datei abbilden"
```

---

### Task 2: Tor in `worker.mjs`

**Skills:** superpowers:test-driven-development, edge-stack-master, cloudflare:workers-best-practices, cloudflare:wrangler, better-auth, security-review

**Files:**
- Create: `lib/tor.ts` (Tor-Logik als testbare Funktion)
- Modify: `worker.mjs` (fetch-Handler), `wrangler.jsonc` (`assets.run_worker_first`)
- Test: `tests/tor.test.ts`

**Interfaces:**
- Consumes: `seitenDatei`, `SEITEN_PRAEFIX` aus Task 1; `tokenPruefen`, `COOKIE_NAME` aus `lib/gate.ts`; `istOhneGate` aus `lib/proxy-regeln.ts`; `bestimmeSprache`, `SPRACH_COOKIE` aus `lib/i18n/sprache-kern.ts`; `SPRACH_ERKENNUNG` aus `lib/i18n/schalter.ts`.
- Produces: `export async function tor(request: Request, env: TorEnv): Promise<Response | null>`. `null` heißt: an Next weitergeben. `type TorEnv = { ASSETS: { fetch(r: Request | string): Promise<Response> }; SITE_PASSWORD?: string; SITE_SESSION_SECRET?: string }`.
- Insel-Abkürzung: `GET /api/ich/strain` ohne Better-Auth-Cookie liefert `{"zugang":"gast"}` ohne Next. Das Cookie heißt `better-auth.session_token`, mit Präfix `__Secure-` unter HTTPS; geprüft wird nur das Vorhandensein, wie in `lib/sitzungs-cookie.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { tokenErzeugen } from "@/lib/gate";
import { tor } from "@/lib/tor";

const SECRET = "s".repeat(32);
function env(dateien: Record<string, string>) {
  return {
    SITE_PASSWORD: "pw",
    SITE_SESSION_SECRET: SECRET,
    ASSETS: {
      async fetch(r: Request | string) {
        const pfad = new URL(typeof r === "string" ? r : r.url).pathname;
        return pfad in dateien ? new Response(dateien[pfad], { status: 200 }) : new Response("nf", { status: 404 });
      },
    },
  };
}
async function mitGate(url: string, extra: Record<string, string> = {}) {
  const token = await tokenErzeugen(SECRET, "besucher");
  return new Request(url, { headers: { cookie: `cn_gate=${token}`, ...extra } });
}

test("ohne Gate-Cookie: Umleitung auf /zugang, auch für /_seiten", async () => {
  for (const pfad of ["/blueten/mac-1", "/_seiten/de/blueten/mac-1/standard.html"]) {
    const antwort = await tor(new Request(`https://x.dev${pfad}`), env({}));
    assert.equal(antwort?.status, 307);
    assert.match(antwort!.headers.get("location")!, /\/zugang\?weiter=/);
  }
});

test("mit Gate: liefert die Datei der Variante als HTML", async () => {
  const antwort = await tor(await mitGate("https://x.dev/blueten/mac-1?vertreiber=v1"), env({ "/_seiten/de/blueten/mac-1/v-v1.html": "<p>v1</p>" }));
  assert.equal(antwort?.status, 200);
  assert.equal(await antwort!.text(), "<p>v1</p>");
  assert.match(antwort!.headers.get("content-type")!, /text\/html/);
});

test("RSC-Anfrage bekommt HTML (Next navigiert dann hart)", async () => {
  const antwort = await tor(await mitGate("https://x.dev/blueten/mac-1?_rsc=abc", { RSC: "1" }), env({ "/_seiten/de/blueten/mac-1/standard.html": "<p>s</p>" }));
  assert.match(antwort!.headers.get("content-type")!, /text\/html/);
});

test("fehlende Datei, Admin, API: an Next (null)", async () => {
  assert.equal(await tor(await mitGate("https://x.dev/blueten/neu-da"), env({})), null);
  assert.equal(await tor(await mitGate("https://x.dev/admin"), env({})), null);
  assert.equal(await tor(await mitGate("https://x.dev/api/katalog"), env({})), null);
});

test("/_seiten direkt mit Gate: 404, nie Durchgriff", async () => {
  const antwort = await tor(await mitGate("https://x.dev/_seiten/de/index.html"), env({ "/_seiten/de/index.html": "x" }));
  assert.equal(antwort?.status, 404);
});

test("Insel ohne Sitzungscookie: gast ohne Next", async () => {
  const antwort = await tor(await mitGate("https://x.dev/api/ich/strain?kultivar=k&vertreiber=v"), env({}));
  assert.deepEqual(await antwort!.json(), { zugang: "gast" });
  assert.equal(antwort!.headers.get("cache-control"), "private, no-store");
});

test("Sprache aus Cookie", async () => {
  const antwort = await tor(await mitGate("https://x.dev/", { cookie: `cn_gate=${await tokenErzeugen(SECRET, "besucher")}; sprache=en` }), env({ "/_seiten/en/index.html": "en" }));
  assert.equal(await antwort!.text(), "en");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/tor.test.ts`
Expected: FAIL, Modul `@/lib/tor` nicht gefunden.

- [ ] **Step 3: Write minimal implementation** (`lib/tor.ts`)

```ts
import { COOKIE_NAME, tokenPruefen } from "@/lib/gate";
import { SPRACH_ERKENNUNG } from "@/lib/i18n/schalter";
import { bestimmeSprache, SPRACH_COOKIE } from "@/lib/i18n/sprache-kern";
import { istOhneGate } from "@/lib/proxy-regeln";
import { SEITEN_PRAEFIX, seitenDatei } from "@/lib/seiten-tor";

export type TorEnv = {
  ASSETS: { fetch(r: Request | string): Promise<Response> };
  SITE_PASSWORD?: string;
  SITE_SESSION_SECRET?: string;
};

/**
 * Leichter Weg vor Next (Spec 2026-10-21, Seiten aus Assets, 3.2): Gate prüfen, Leseseite als Datei
 * ausliefern. `null` heißt: Next übernimmt (Admin, Aktionen, API, Seiten ohne Datei).
 * Dieselben Regeln wie proxy.ts; Gate-Prüfung über lib/gate.ts, nie über einen ungeprüften Cookie-Teil.
 */
export async function tor(request: Request, env: TorEnv): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const url = new URL(request.url);
  const cookies = leseCookies(request.headers.get("cookie"));

  if (url.pathname.startsWith(`${SEITEN_PRAEFIX}/`) || url.pathname === SEITEN_PRAEFIX) {
    if (!(await gateOffen(env, cookies))) return zumGate(url);
    return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  if (url.pathname === "/api/ich/strain") {
    if (!(await gateOffen(env, cookies))) return zumGate(url);
    if (hatSitzung(cookies)) return null;
    return Response.json({ zugang: "gast" }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const sprache = bestimmeSprache({
    cookie: cookies.get(SPRACH_COOKIE),
    acceptLanguage: request.headers.get("accept-language"),
    erkennungAktiv: SPRACH_ERKENNUNG,
  });
  const datei = seitenDatei(sprache, url.pathname, url.searchParams);
  if (!datei) return null;
  if (!istOhneGate(url.pathname) && !(await gateOffen(env, cookies))) return zumGate(url);
  const antwort = await env.ASSETS.fetch(new URL(datei, url).toString());
  if (antwort.status !== 200) return null;
  return new Response(antwort.body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Hinter dem Gate: nie in geteilten Caches ablegen.
      "Cache-Control": "private, no-cache",
      Vary: "Cookie",
    },
  });
}

function leseCookies(kopf: string | null): Map<string, string> {
  const karte = new Map<string, string>();
  for (const teil of (kopf ?? "").split(";")) {
    const i = teil.indexOf("=");
    if (i > 0) karte.set(teil.slice(0, i).trim(), teil.slice(i + 1).trim());
  }
  return karte;
}

function hatSitzung(cookies: Map<string, string>): boolean {
  return cookies.has("better-auth.session_token") || cookies.has("__Secure-better-auth.session_token");
}

async function gateOffen(env: TorEnv, cookies: Map<string, string>): Promise<boolean> {
  if (!env.SITE_PASSWORD || !env.SITE_SESSION_SECRET) return true;
  return (await tokenPruefen(env.SITE_SESSION_SECRET, cookies.get(COOKIE_NAME))) !== null;
}

function zumGate(url: URL): Response {
  const ziel = new URL("/zugang", url);
  ziel.searchParams.set("weiter", url.pathname + url.search);
  return new Response(null, { status: 307, headers: { Location: ziel.toString(), "Cache-Control": "no-store" } });
}
```

Prüfen, ob der Cookie-Name `better-auth.session_token` stimmt: `node -e "import('better-auth/cookies').then(m=>console.log(m.getSessionCookie.toString()))"` und das Ergebnis mit `hatSitzung` abgleichen. Abweichung: Namen in `hatSitzung` übernehmen.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/tor.test.ts`
Expected: PASS (7 Tests).

- [ ] **Step 5: In `worker.mjs` einhängen**

Im `fetch` von `einstieg`, nach dem `/_next/static/`-Zweig:

```js
    const antwort = await tor(request, env);
    if (antwort) return antwort;
    return worker.fetch(request, env, ctx);
```

Import oben: `import { tor } from "./lib/tor.ts";` (wrangler bündelt TypeScript selbst; der Alias `@/` wird über `tsconfig.json` `paths` aufgelöst). Bricht `wrangler deploy --dry-run --outdir .tmp-dry` am Alias, in `lib/tor.ts` und `lib/seiten-tor.ts` relative Importe verwenden.

- [ ] **Step 6: `wrangler.jsonc`: Worker vor Assets für Leseseiten**

In `assets` ergänzen:

```jsonc
		// Leseseiten liegen unter /_seiten, das Tor in worker.mjs prüft vorher das Gate (Spec 2026-10-21).
		"run_worker_first": ["/_seiten/*"]
```

Begründung: Alle anderen Leseseiten-Adressen (`/blueten/x`) sind keine Asset-Pfade und erreichen den Worker ohnehin. Nur der direkte Abruf `/_seiten/...` würde sonst am Gate vorbei ausgeliefert.

- [ ] **Step 7: Typecheck und alle Tests**

Run: `npm run typecheck && npm test`
Expected: grün.

- [ ] **Step 8: Commit**

```bash
git add lib/tor.ts tests/tor.test.ts worker.mjs wrangler.jsonc
git commit -m "Tor in worker.mjs: Gate prüfen, Leseseiten aus Assets ohne Next"
```

---

### Task 3: Build verschiebt Leseseiten nach Assets

**Skills:** superpowers:test-driven-development, edge-stack-master, cloudflare:nextjs-on-cloudflare, cloudflare:wrangler

**Files:**
- Create: `scripts/seiten-in-assets.mjs`
- Modify: `scripts/cf-build.mjs` (Aufruf nach `opennextjs-cloudflare build`; ohne D1-Abzug in CI abbrechen)
- Test: `tests/seiten-in-assets.test.ts`

**Interfaces:**
- Consumes: Dateinamen aus Task 1 und Task 4: Next legt vorgerendertes HTML unter `.next/server/app/<sprache>/<pfad>.html` ab (z. B. `.next/server/app/de.html`, `.next/server/app/de/blueten.html`, `.next/server/app/de/blueten/mac-1/standard.html`).
- Produces: `export function planeVerschiebung(dateien: string[]): { quelle: string; ziel: string }[]` (rein, testbar) und `export function verschiebe(wurzel: string): { anzahl: number }` (führt aus).

- [ ] **Step 1: Ablage prüfen** (einmalig, lokal, ohne Deploy)

Run: `VORRENDERN_DATEN=1 npx next build` und danach `find .next/server/app -name "*.html" | head -20`, außerdem `ls .open-next/cache` falls vorhanden.
Erwartet: HTML je Seite wie oben. Weicht die Ablage ab, Pfadregeln in Step 3 anpassen. KV-Vorrat: OpenNext legt ihn unter `.open-next/cache/<buildId>/<pfad>.cache` ab; Namensschema hier notieren.

- [ ] **Step 2: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { planeVerschiebung } from "../scripts/seiten-in-assets.mjs";

test("planeVerschiebung: Leseseiten nach _seiten, Rest bleibt", () => {
  const plan = planeVerschiebung([
    "de.html",
    "en/blueten.html",
    "de/blueten/mac-1/standard.html",
    "de/blueten/mac-1/v-x-alle.html",
    "de/jury/seite/2.html",
    "de/admin.html",
    "de/impressum.html",
    "_not-found.html",
  ]);
  assert.deepEqual(plan, [
    { quelle: "de.html", ziel: "_seiten/de/index.html" },
    { quelle: "en/blueten.html", ziel: "_seiten/en/blueten/index.html" },
    { quelle: "de/blueten/mac-1/standard.html", ziel: "_seiten/de/blueten/mac-1/standard.html" },
    { quelle: "de/blueten/mac-1/v-x-alle.html", ziel: "_seiten/de/blueten/mac-1/v-x-alle.html" },
    { quelle: "de/jury/seite/2.html", ziel: "_seiten/de/jury/seite/2/index.html" },
  ]);
});
```

- [ ] **Step 3: Write minimal implementation**

```js
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Verschiebt vorgerenderte Leseseiten in die Static Assets (Spec 2026-10-21, Seiten aus Assets, 3.1).
 * Strain-Varianten behalten ihren Dateinamen, alle anderen werden zu <pfad>/index.html, passend zu
 * lib/seiten-tor.ts. Die Seiten fliegen aus dem KV-Vorrat: sonst kostet jeder Deploy Schreibvorgänge.
 */
const FEST = /^(de|en)(\/(blueten|neu|jury(\/[a-z0-9-]+)*|reviews(\/[a-z0-9-]+)*))?\.html$/;
const STRAIN = /^(de|en)\/blueten\/[a-z0-9-]+\/(standard|v-[A-Za-z0-9-]+)\.html$/;

export function planeVerschiebung(dateien) {
  const plan = [];
  for (const quelle of dateien) {
    if (STRAIN.test(quelle)) plan.push({ quelle, ziel: `_seiten/${quelle}` });
    else if (FEST.test(quelle)) plan.push({ quelle, ziel: `_seiten/${quelle.replace(/\.html$/, "")}/index.html` });
  }
  return plan;
}

function alleHtml(wurzel) {
  const aus = [];
  const lauf = (ordner) => {
    for (const name of readdirSync(ordner)) {
      const pfad = join(ordner, name);
      if (statSync(pfad).isDirectory()) lauf(pfad);
      else if (name.endsWith(".html")) aus.push(relative(wurzel, pfad).split("\\").join("/"));
    }
  };
  lauf(wurzel);
  return aus;
}

export function verschiebe(projekt) {
  const quelle = join(projekt, ".next/server/app");
  const assets = join(projekt, ".open-next/assets");
  const plan = planeVerschiebung(alleHtml(quelle));
  for (const { quelle: q, ziel } of plan) {
    const nach = join(assets, ziel);
    mkdirSync(dirname(nach), { recursive: true });
    copyFileSync(join(quelle, q), nach);
  }
  entferneAusKvVorrat(projekt, plan);
  return { anzahl: plan.length };
}

function entferneAusKvVorrat(projekt, plan) {
  const cache = join(projekt, ".open-next/cache");
  let builds;
  try {
    builds = readdirSync(cache);
  } catch {
    return;
  }
  for (const build of builds) {
    for (const { quelle } of plan) {
      rmSync(join(cache, build, quelle.replace(/\.html$/, ".cache")), { force: true });
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { anzahl } = verschiebe(process.cwd());
  console.log(`[seiten] ${anzahl} Leseseiten nach .open-next/assets/_seiten`);
  if (anzahl > 19000) {
    console.error("[seiten] mehr als 19 000 Dateien, Grenze 20 000 je Version");
    process.exit(1);
  }
}
```

Name des `.cache`-Eintrags aus Step 1 übernehmen, falls er abweicht.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/seiten-in-assets.test.ts`
Expected: PASS.

- [ ] **Step 5: `scripts/cf-build.mjs` einbinden**

In `main()` nach dem erfolgreichen Build und vor `bundle-env-bereinigen`:

```js
  status = lauf("node", ["scripts/seiten-in-assets.mjs"], buildEnv(process.env, false));
  if (status !== 0) process.exit(status);
```

Und im Abzweig ohne Abzug, wenn `process.env.WORKERS_CI === "1"`: statt weiterbauen abbrechen (Spec 5: ohne Dateien fiele alles auf den teuren Weg):

```js
      if (!ergebnis.ok && process.env.WORKERS_CI === "1") {
        console.error(`[vorrendern] FEHLER: ${ergebnis.grund}. Abbruch, die alte Version bleibt live`);
        process.exit(1);
      }
```

Den bestehenden Test zu `cf-build.mjs` (`tests/cf-build*.test.ts`, falls vorhanden) auf das neue Verhalten anpassen.

- [ ] **Step 6: Tests, Commit**

Run: `npm test`
Expected: grün.

```bash
git add scripts/seiten-in-assets.mjs scripts/cf-build.mjs tests/seiten-in-assets.test.ts
git commit -m "Build: vorgerenderte Leseseiten in Static Assets, raus aus dem KV-Vorrat"
```

---

### Task 4: Strain-Seite statisch je Variante

**Skills:** superpowers:test-driven-development, edge-stack-master, cloudflare:nextjs-on-cloudflare, react-best-practices, prisma-client-api, ui-design-engine

**Files:**
- Create: `app/[lang]/blueten/[slug]/[auswahl]/page.tsx` (die bisherige Seite, statisch)
- Modify: `app/[lang]/blueten/[slug]/page.tsx` (wird zur Weiterleitung für den Ausweichweg), `components/sorte/HerstellerLeiste.tsx`, `components/sorte/WareLeiste.tsx` (`wareHref`)
- Create: `lib/strain-varianten.ts`
- Test: `tests/strain-varianten.test.ts`

**Interfaces:**
- Consumes: `auswahlSegment` aus Task 1.
- Produces:
  - `export function leseAuswahl(segment: string): { vertreiberId: string | null; alle: boolean } | null`, die Umkehrung von `auswahlSegment`.
  - `export async function strainVarianten(): Promise<{ lang: string; slug: string; auswahl: string }[]>` für `generateStaticParams`: je aktivem Kultivar `standard`, je Vertreiber `v-<id>` und `v-<id>-alle`, beide Sprachen.
  - Die Seite unter `[auswahl]` rendert immer als Gast und ohne Fachkreis (`fachkreis = false`, `mitglied = null`), liest keine Cookies, keine `searchParams`.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { auswahlSegment } from "@/lib/seiten-tor";
import { leseAuswahl, variantenFuer } from "@/lib/strain-varianten";

test("leseAuswahl ist die Umkehrung von auswahlSegment", () => {
  for (const [id, alle] of [[null, false], ["abc-1", false], ["abc-1", true]] as const) {
    assert.deepEqual(leseAuswahl(auswahlSegment(id, alle)), { vertreiberId: id, alle: id ? alle : false });
  }
  assert.equal(leseAuswahl("quatsch"), null);
});

test("variantenFuer: Standard plus je Vertreiber zwei, je Sprache", () => {
  const v = variantenFuer([{ slug: "mac-1", vertreiberIds: ["a", "b"] }]);
  assert.equal(v.length, 2 * (1 + 2 * 2));
  assert.ok(v.some((x) => x.lang === "en" && x.slug === "mac-1" && x.auswahl === "v-b-alle"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/strain-varianten.test.ts`
Expected: FAIL, Modul fehlt.

- [ ] **Step 3: Implementierung `lib/strain-varianten.ts`**

```ts
import { getPrisma } from "@/lib/prisma";
import { sprachParameter } from "@/lib/i18n/vorrendern";
import { auswahlSegment } from "@/lib/seiten-tor";

/** Umkehrung von auswahlSegment: "standard", "v-<id>", "v-<id>-alle". */
export function leseAuswahl(segment: string): { vertreiberId: string | null; alle: boolean } | null {
  if (segment === "standard") return { vertreiberId: null, alle: false };
  const treffer = /^v-([A-Za-z0-9-]+?)(-alle)?$/.exec(segment);
  return treffer ? { vertreiberId: treffer[1], alle: Boolean(treffer[2]) } : null;
}

export function variantenFuer(sorten: { slug: string; vertreiberIds: string[] }[]) {
  const sprachen = ["de", "en"];
  return sprachen.flatMap((lang) =>
    sorten.flatMap(({ slug, vertreiberIds }) => [
      { lang, slug, auswahl: auswahlSegment(null, false) },
      ...vertreiberIds.flatMap((id) => [
        { lang, slug, auswahl: auswahlSegment(id, false) },
        { lang, slug, auswahl: auswahlSegment(id, true) },
      ]),
    ]),
  );
}

/** Für generateStaticParams: nur im Build mit D1-Abzug (VORRENDERN=1), sonst leer. */
export async function strainVarianten() {
  if (sprachParameter().length === 0) return [];
  const prisma = await getPrisma();
  const zeilen = await prisma.strain.findMany({
    where: { aktiv: true, kultivar: { isNot: null } },
    select: { vertreiberId: true, kultivar: { select: { slug: true } } },
    take: 5000,
  });
  const karte = new Map<string, Set<string>>();
  for (const z of zeilen) {
    if (!z.kultivar) continue;
    const set = karte.get(z.kultivar.slug) ?? new Set<string>();
    if (z.vertreiberId) set.add(z.vertreiberId);
    karte.set(z.kultivar.slug, set);
  }
  return variantenFuer([...karte].map(([slug, ids]) => ({ slug, vertreiberIds: [...ids] })));
}
```

`sprachParameter()` vorher lesen (`lib/i18n/vorrendern.ts`): liefert es ohne `VORRENDERN` eine leere Liste, passt die Abfrage oben. Sonst die dortige Bedingung direkt übernehmen. Feldnamen (`aktiv`, `vertreiberId`, Relation `kultivar`) gegen `prisma/schema.prisma` prüfen.

- [ ] **Step 4: Seite verschieben**

`app/[lang]/blueten/[slug]/page.tsx` nach `app/[lang]/blueten/[slug]/[auswahl]/page.tsx` verschieben (`git mv`) und dort:
- `export const dynamic = "force-dynamic";` samt Kommentar ersetzen durch:

```ts
/** Statisch je Variante, als Gast (Spec 2026-10-21, Seiten aus Assets, 3.1). Persönliches lädt die Insel. */
export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = true;
export function generateStaticParams() {
  return strainVarianten();
}
```

- `searchParams` entfällt. `wahl` kommt aus `leseAuswahl(params.auswahl)` (`null` → `notFound()`): `{ ware: undefined, vertreiber: auswahl.vertreiberId ?? undefined }`, `alleVertreiber = auswahl.alle || !aktive.ware.vertreiberId`.
- `aktuellesMitglied()` und `istFachkreis()` fallen aus dem ersten `Promise.all`; `mitglied = null`, `fachkreis = false`, `freigegeben = null`. `ladeEigeneBewertung` und `ladeLiveNetzBasis` fallen weg (wandern in Task 5).
- Der Abschnitt `#bewerten` rendert den Gastzweig (Erkundung, Anmelden-Hinweis) und reicht in Task 5 die statischen Formular-Props an die Insel.
- Links `?${auswahlQuery}` und `&alle=1` bleiben als öffentliche Adressen bestehen; `Link` wird dort zu `<a>` (harte Navigation, das Tor liefert die Datei).
- `produktZuSorte`-Weiterleitung alter Produktadressen bleibt im Ausweichweg (Step 5).

- [ ] **Step 5: Ausweichweg `app/[lang]/blueten/[slug]/page.tsx`**

Neue, kleine dynamische Seite: Sie läuft nur, wenn das Tor keine Datei fand (neuer Kultivar seit dem Build, alte Produktadresse, `?ware=`).

```tsx
import { notFound, permanentRedirect, redirect } from "next/navigation";

import { produktZuSorte, ladeSorte, waehleAktiveWare } from "@/lib/query/sorte";
import { auswahlSegment } from "@/lib/seiten-tor";

export const dynamic = "force-dynamic";

/** Ausweichweg ohne Datei (Spec 2026-10-21, 5): auf die Variante umschreiben oder alte Adressen weiterleiten. */
export default async function SorteOhneDatei({ params, searchParams }: { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ lang, slug }, suche] = await Promise.all([params, searchParams]);
  const sorte = await ladeSorte(slug);
  if (!sorte) {
    const ziel = await produktZuSorte(`/blueten/${slug}`, new URLSearchParams(suche as Record<string, string>).toString());
    if (ziel) permanentRedirect(ziel);
    notFound();
  }
  const erster = (w: string | string[] | undefined) => (Array.isArray(w) ? w[0] : w);
  const aktive = waehleAktiveWare(sorte.waren, { ware: erster(suche.ware), vertreiber: erster(suche.vertreiber) });
  if (!aktive) notFound();
  redirect(`/${lang}/blueten/${slug}/${auswahlSegment(aktive.ware.vertreiberId || null, erster(suche.alle) === "1")}`);
}
```

`redirect` auf den internen Pfad: prüfen, ob der Browser dadurch `/de/...` in der Adresszeile sieht. Wenn ja, stattdessen auf die öffentliche Adresse `/blueten/<slug>?vertreiber=<id>` leiten. Diese Anfrage geht danach durch das Tor; nach dem nächsten Neubau existiert die Datei. Bis dahin rendert `[auswahl]` mit `dynamicParams = true` einmal im Request. Dieser seltene Fall ist bekannt und in Spec 5 abgedeckt.

- [ ] **Step 6: HerstellerLeiste und wareHref**

In `components/sorte/HerstellerLeiste.tsx`: `Link` durch `<a>` ersetzen (`prefetch`/`scroll` entfallen), `href` an `#hersteller-titel` anhängen, damit die harte Navigation an der Leiste landet. Den Test `tests/hersteller-leiste.test.ts` anpassen: Er prüft weiter `aria-current` und `href`.

- [ ] **Step 7: Typecheck, Tests, Commit**

Run: `npm run typecheck && npm test`
Expected: grün.

```bash
git add -A app/[lang]/blueten lib/strain-varianten.ts tests/strain-varianten.test.ts components/sorte tests/hersteller-leiste.test.ts
git commit -m "Strain-Seite statisch je Vertreiber-Variante, Ausweichweg für fehlende Dateien"
```

---

### Task 5: Persönliche Insel

**Skills:** superpowers:test-driven-development, edge-stack-master, react-best-practices, better-auth, prisma-client-api, ui-design-engine, better-accessibility, better-interface

**Files:**
- Create: `app/api/ich/strain/route.ts`, `lib/ich-strain.ts`, `components/sorte/BewertenInsel.tsx`
- Modify: `app/[lang]/blueten/[slug]/[auswahl]/page.tsx` (Abschnitt `#bewerten`, Titelblatt-Budpic), `components/produkt/Titelblatt.tsx` (Budpic-Zugang aus der Insel)
- Test: `tests/ich-strain.test.ts`

**Interfaces:**
- Consumes: `aktuellesMitglied` (`lib/session.ts`), `ladeEigeneBewertung` (`lib/query/strains.ts:1317`), `vorbelegungAus` (`lib/bewertung-vorbelegung.ts:60`), `ladeLiveNetzBasis` (`lib/query/profil.ts:211`).
- Produces:
  - `export type IchStrain = { zugang: "gast" } | { zugang: "mitglied" } | { zugang: "freigegeben"; istBetreiber: boolean; vorbelegung: Vorbelegung | null; liveNetz: LiveNetzBasis | null };`
  - `export async function ichStrain(deps, eingabe: { kultivarId: string; vertreiberId: string | null; strainId: string }): Promise<IchStrain>` mit injizierten Abhängigkeiten (testbar).
  - `GET /api/ich/strain?kultivar=<id>&vertreiber=<id>&strain=<id>` antwortet mit `IchStrain`, `Cache-Control: private, no-store`.
  - `<BewertenInsel gast={ReactNode} formularProps={…statische Props…} kultivarId vertreiberId strainId vorgewaehlt />`, Client-Komponente.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { ichStrain } from "@/lib/ich-strain";

const eingabe = { kultivarId: "k", vertreiberId: "v", strainId: "s" };
const basis = {
  ladeEigeneBewertung: async () => null,
  ladeLiveNetzBasis: async () => null,
  vorbelegungAus: (r: unknown) => r as never,
};

test("ohne Sitzung: gast", async () => {
  assert.deepEqual(await ichStrain({ ...basis, mitglied: async () => null }, eingabe), { zugang: "gast" });
});

test("ohne Freigabe: mitglied, keine Daten", async () => {
  const r = await ichStrain({ ...basis, mitglied: async () => ({ mitgliedId: "m", freigegeben: false, rolle: "MITGLIED" }) as never }, eingabe);
  assert.deepEqual(r, { zugang: "mitglied" });
});

test("freigegeben: Vorbelegung und Live-Netz, Fehler im Netz kostet nur das Netz", async () => {
  const r = await ichStrain(
    {
      ...basis,
      mitglied: async () => ({ mitgliedId: "m", freigegeben: true, rolle: "ADMIN" }) as never,
      ladeEigeneBewertung: async () => ({ id: "r" }) as never,
      ladeLiveNetzBasis: async () => {
        throw new Error("kaputt");
      },
    },
    eingabe,
  );
  assert.equal(r.zugang, "freigegeben");
  if (r.zugang !== "freigegeben") return;
  assert.equal(r.istBetreiber, true);
  assert.deepEqual(r.vorbelegung, { id: "r" });
  assert.equal(r.liveNetz, null);
});

test("ohne Vertreiber: keine eigene Bewertung", async () => {
  let gefragt = false;
  await ichStrain(
    { ...basis, mitglied: async () => ({ mitgliedId: "m", freigegeben: true, rolle: "MITGLIED" }) as never, ladeEigeneBewertung: async () => ((gefragt = true), null) },
    { ...eingabe, vertreiberId: null },
  );
  assert.equal(gefragt, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/ich-strain.test.ts`
Expected: FAIL, Modul fehlt.

- [ ] **Step 3: `lib/ich-strain.ts`**

```ts
import type { Vorbelegung } from "@/lib/bewertung-vorbelegung";
import type { LiveNetzBasis } from "@/lib/query/profil";

export type IchStrain =
  | { zugang: "gast" }
  | { zugang: "mitglied" }
  | { zugang: "freigegeben"; istBetreiber: boolean; vorbelegung: Vorbelegung | null; liveNetz: LiveNetzBasis | null };

type Deps = {
  mitglied: () => Promise<{ mitgliedId: string; freigegeben: boolean; rolle: string } | null>;
  ladeEigeneBewertung: (autorId: string, kultivarId: string, vertreiberId: string) => Promise<unknown | null>;
  ladeLiveNetzBasis: (mitgliedId: string, strainId: string) => Promise<LiveNetzBasis | null>;
  vorbelegungAus: (review: never) => Vorbelegung;
};

/** Was die statische Strain-Seite nicht wissen darf (Spec 2026-10-21, 3.3). Rechte entscheidet der Server. */
export async function ichStrain(deps: Deps, e: { kultivarId: string; vertreiberId: string | null; strainId: string }): Promise<IchStrain> {
  const m = await deps.mitglied();
  if (!m) return { zugang: "gast" };
  if (!m.freigegeben) return { zugang: "mitglied" };
  const [eigene, liveNetz] = await Promise.all([
    e.vertreiberId ? deps.ladeEigeneBewertung(m.mitgliedId, e.kultivarId, e.vertreiberId) : Promise.resolve(null),
    deps.ladeLiveNetzBasis(m.mitgliedId, e.strainId).catch((fehler: unknown) => {
      console.error("ladeLiveNetzBasis fehlgeschlagen", fehler);
      return null;
    }),
  ]);
  return { zugang: "freigegeben", istBetreiber: m.rolle === "ADMIN", vorbelegung: eigene ? deps.vorbelegungAus(eigene as never) : null, liveNetz };
}
```

Typen `Vorbelegung` und `LiveNetzBasis` aus den genannten Dateien prüfen; sind sie nicht exportiert, dort exportieren.

- [ ] **Step 4: Route `app/api/ich/strain/route.ts`**

```ts
import { ladeEigeneBewertung } from "@/lib/query/strains";
import { ladeLiveNetzBasis } from "@/lib/query/profil";
import { vorbelegungAus } from "@/lib/bewertung-vorbelegung";
import { ichStrain } from "@/lib/ich-strain";
import { aktuellesMitglied } from "@/lib/session";

export const dynamic = "force-dynamic";

const ID = /^[A-Za-z0-9-]{1,64}$/;

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const kultivarId = q.get("kultivar") ?? "";
  const strainId = q.get("strain") ?? "";
  const vertreiber = q.get("vertreiber");
  if (!ID.test(kultivarId) || !ID.test(strainId) || (vertreiber && !ID.test(vertreiber))) {
    return Response.json({ fehler: "parameter" }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
  const daten = await ichStrain(
    { mitglied: aktuellesMitglied, ladeEigeneBewertung, ladeLiveNetzBasis, vorbelegungAus: vorbelegungAus as never },
    { kultivarId, vertreiberId: vertreiber || null, strainId },
  );
  return Response.json(daten, { headers: { "Cache-Control": "private, no-store" } });
}
```

Gäste ohne Sitzungscookie erreichen diese Route nie (Tor, Task 2).

- [ ] **Step 5: `components/sorte/BewertenInsel.tsx`**

```tsx
"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { BewertungsFormular } from "@/components/review/BewertungsFormular";
import type { IchStrain } from "@/lib/ich-strain";

type FormularProps = Omit<ComponentProps<typeof BewertungsFormular>, "vorbelegung" | "liveNetz" | "istBetreiber" | "vorgewaehlt">;

type Props = {
  gast: ReactNode;
  nichtFreigegeben: ReactNode;
  formular: FormularProps;
  vorgewaehlt: { vertreiberId: string | null; strainId: string | null };
  kultivarId: string;
  strainId: string;
};

/** Tauscht den Gastzustand gegen die Maske, sobald /api/ich/strain eine Freigabe meldet (Spec 2026-10-21, 3.3). */
export function BewertenInsel({ gast, nichtFreigegeben, formular, vorgewaehlt, kultivarId, strainId }: Props) {
  const [ich, setIch] = useState<IchStrain>({ zugang: "gast" });
  useEffect(() => {
    const q = new URLSearchParams({ kultivar: kultivarId, strain: strainId });
    if (vorgewaehlt.vertreiberId) q.set("vertreiber", vorgewaehlt.vertreiberId);
    const abbruch = new AbortController();
    fetch(`/api/ich/strain?${q}`, { signal: abbruch.signal, credentials: "same-origin" })
      .then((r) => (r.ok ? (r.json() as Promise<IchStrain>) : null))
      .then((daten) => daten && setIch(daten))
      .catch(() => {});
    return () => abbruch.abort();
  }, [kultivarId, strainId, vorgewaehlt.vertreiberId]);

  if (ich.zugang === "mitglied") return nichtFreigegeben;
  if (ich.zugang !== "freigegeben") return gast;
  const ware = new URLSearchParams(window.location.search).get("ware");
  return (
    <BewertungsFormular
      {...formular}
      istBetreiber={ich.istBetreiber}
      vorbelegung={ich.vorbelegung}
      liveNetz={ich.liveNetz}
      vorgewaehlt={{
        vertreiberId: vorgewaehlt.vertreiberId,
        strainId: ich.vorbelegung?.strainId ?? (ware ? (formular.waren.flatMap((w) => w.produkte).find((p) => p.slug === ware)?.id ?? vorgewaehlt.strainId) : vorgewaehlt.strainId),
      }}
    />
  );
}
```

Feldnamen von `waren`/`produkte` gegen `WareKarte` in `lib/query/sorte.ts` prüfen. Dazu ein Test mit `renderToStaticMarkup`: Ohne Effekt rendert die Insel `gast`.

- [ ] **Step 6: Seite anbinden**

In `[auswahl]/page.tsx` ersetzt der Abschnitt `#bewerten` die Verzweigung `mitglied?.freigegeben ? … : …` durch `<BewertenInsel>`. Übergeben werden:
- `gast`: der bisherige Gastzweig (Erkundung + Anmelden-Link)
- `nichtFreigegeben`: Erkundung + `w.bewerten.nichtFreigegeben`
- `formular`: alle statischen Props wie bisher (`strainId`, `kultivarId`, `waren`, `wareTexte`, `handelsname`, `terpene`, `chargen`, `katalog`, `aromaTexte`, `texte`, `bildMeldungen`, `achsen`, `zuordnung`, `...erkundung`, `gesamteindruck`)

`SektionsKopf`-Titel: statisch `texte.bewerten`. Titelblatt-Budpic: `zugang` statisch `"gast"`; `BudpicBeitragen` (Client) fragt bei Bedarf selbst `/api/ich/strain` und schaltet bei `freigegeben` bzw. `mitglied` um. Die Antwort teilen sich beide Inseln über einen Modul-Cache (`let anfrage: Promise<IchStrain> | null`) in `lib/ich-strain-client.ts`, dann gibt es nur einen Fetch je Seite.

- [ ] **Step 7: Typecheck, Tests, Commit**

Run: `npm run typecheck && npm test`
Expected: grün.

```bash
git add app/api/ich lib/ich-strain.ts lib/ich-strain-client.ts components/sorte/BewertenInsel.tsx components/produkt app/[lang]/blueten tests/ich-strain.test.ts
git commit -m "Strain-Seite: Persönliches als Insel über /api/ich/strain"
```

---

### Task 6: Neubau über Deploy-Hook

**Skills:** superpowers:test-driven-development, edge-stack-master, cloudflare:wrangler, cloudflare-d1, cloudflare:workers-best-practices, migration

**Files:**
- Create: `lib/neubau.ts`, `migrations/0033_neubau.sql`
- Modify: `lib/i18n/revalidiere.ts`, `lib/cloudflare.ts` (Accessor `deployHookUrl()`), `worker.mjs` (`scheduled`: täglicher Neubau), `wrangler.jsonc` (Cron `0 3 * * *`)
- Test: `tests/neubau.test.ts`

**Interfaces:**
- Produces:
  - `export const NEUBAU_JE_TAG = 15;`
  - `export async function neubauAnstossen(deps: { zaehle: (tag: string) => Promise<number>; sende: () => Promise<Response>; heute: () => string }): Promise<"gesendet" | "deckel" | "fehler">`
  - `export function neubauVormerken(): void`: einmal je Request, läuft in `after()`.
  - Migration: Tabelle `neubau_zaehler(tag TEXT PRIMARY KEY, anzahl INTEGER NOT NULL)`.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { NEUBAU_JE_TAG, neubauAnstossen } from "@/lib/neubau";

const heute = () => "2026-10-22";

test("unter dem Deckel: sendet", async () => {
  let gesendet = 0;
  const r = await neubauAnstossen({ zaehle: async () => 3, sende: async () => ((gesendet++), new Response("{}")), heute });
  assert.equal(r, "gesendet");
  assert.equal(gesendet, 1);
});

test("über dem Deckel: sendet nicht", async () => {
  let gesendet = 0;
  const r = await neubauAnstossen({ zaehle: async () => NEUBAU_JE_TAG + 1, sende: async () => ((gesendet++), new Response("{}")), heute });
  assert.equal(r, "deckel");
  assert.equal(gesendet, 0);
});

test("Hook-Fehler: kein Wiederholen, meldet fehler", async () => {
  let versuche = 0;
  const r = await neubauAnstossen({ zaehle: async () => 1, sende: async () => ((versuche++), new Response("x", { status: 500 })), heute });
  assert.equal(r, "fehler");
  assert.equal(versuche, 1);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/neubau.test.ts`
Expected: FAIL, Modul fehlt.

- [ ] **Step 3: Migration `migrations/0033_neubau.sql`**

```sql
-- Tageszähler für Neubauten über den Deploy-Hook (Spec 2026-10-21, Seiten aus Assets, 3.4).
-- Deckel schützt das Budget von Workers Builds Free (3000 Build-Minuten im Monat).
CREATE TABLE IF NOT EXISTS neubau_zaehler (
  tag TEXT PRIMARY KEY NOT NULL,
  anzahl INTEGER NOT NULL
);
```

Danach laut `db/README.md` `db/constraints.sql` erneut ausführen. Remote einspielen: `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0033_neubau.sql` (Claude führt selbst aus).

- [ ] **Step 4: `lib/neubau.ts`**

```ts
import "server-only";

import { after } from "next/server";
import { cache } from "react";

import { deployHookUrl, getEnv } from "@/lib/cloudflare";

/** Höchstens so viele Neubauten am Tag aus Änderungen; dazu einer täglich per Cron (Spec 2026-10-21, 3.4). */
export const NEUBAU_JE_TAG = 15;

export async function neubauAnstossen(deps: { zaehle: (tag: string) => Promise<number>; sende: () => Promise<Response>; heute: () => string }) {
  const anzahl = await deps.zaehle(deps.heute());
  if (anzahl > NEUBAU_JE_TAG) return "deckel" as const;
  const antwort = await deps.sende();
  if (!antwort.ok) {
    console.error("neubau: Deploy-Hook", antwort.status, await antwort.text());
    return "fehler" as const;
  }
  return "gesendet" as const;
}

/** Je Request ein Objekt: mehrere revalidiereSprachen-Aufrufe einer Aktion lösen einen Neubau aus. */
const vorgemerkt = cache(() => ({ ja: false }));

export function neubauVormerken(): void {
  const merker = vorgemerkt();
  if (merker.ja) return;
  merker.ja = true;
  after(async () => {
    const url = deployHookUrl();
    if (!url) return; // lokal und in Tests ohne Secret
    const { DB } = await getEnv();
    await neubauAnstossen({
      heute: () => new Date().toISOString().slice(0, 10),
      zaehle: async (tag) =>
        (await DB.prepare("INSERT INTO neubau_zaehler (tag, anzahl) VALUES (?1, 1) ON CONFLICT(tag) DO UPDATE SET anzahl = anzahl + 1 RETURNING anzahl")
          .bind(tag)
          .first<{ anzahl: number }>())?.anzahl ?? 1,
      sende: () => fetch(url, { method: "POST" }),
    }).catch((fehler) => console.error("neubau", fehler));
  });
}
```

`lib/cloudflare.ts`: `export function deployHookUrl(): string | null` liest `DEPLOY_HOOK_URL` aus `getEnvSync()` und liefert `null`, wenn es fehlt. Den Stil der vorhandenen Accessoren übernehmen. Danach `npm run cf-typegen`.

- [ ] **Step 5: In `revalidiereSprachen` einhängen**

In `lib/i18n/revalidiere.ts`, am Anfang von `revalidiereSprachen`:

```ts
  // Leseseiten liegen als Dateien in Assets (Spec 2026-10-21): erst ein Neubau macht die Änderung sichtbar.
  if (!pfad.startsWith("/admin") && !pfad.startsWith("/profil")) neubauVormerken();
```

`after()` und `cache()` wirken in Route Handlern und Server Actions. Im Cron-Pfad (`/api/sotm/takt`) gilt das ebenso. Wirft `neubauVormerken` außerhalb eines Requests, in `try/catch` fassen und loggen.

- [ ] **Step 6: Täglicher Neubau**

`wrangler.jsonc` `triggers.crons` um `"0 3 * * *"` ergänzen. In `worker.mjs` `scheduled(controller, env, ctx)`: bei `controller.cron === "0 3 * * *"` `fetch(env.DEPLOY_HOOK_URL, { method: "POST" })` in `ctx.waitUntil`, mit Logging wie beim SOTM-Cron. Die beiden SOTM-Crons laufen unverändert weiter (`controller.cron` unterscheiden).

- [ ] **Step 7: Tests, Commit**

Run: `npm run typecheck && npm test`
Expected: grün.

```bash
git add lib/neubau.ts lib/i18n/revalidiere.ts lib/cloudflare.ts migrations/0033_neubau.sql worker.mjs wrangler.jsonc cloudflare-env.d.ts tests/neubau.test.ts
git commit -m "Neubau über Deploy-Hook nach Änderungen, Deckel 15 am Tag, täglicher Neubau"
```

---

### Task 7: Hinweis nach dem Speichern

**Skills:** superpowers:test-driven-development, better-writing, ui-design-engine

**Files:**
- Modify: `lib/i18n/de.ts:713-714`, `lib/i18n/en.ts` (gleiche Schlüssel), `components/review/BewertungsFormular.tsx:156`
- Test: `tests/bewertungs-hinweis.test.ts`

**Interfaces:**
- Produces: Wörterbuch `w.bewerten.gespeichert` und `w.bewerten.eingegangen` mit Beta-Hinweis.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("Hinweis nach dem Speichern nennt Beta und etwa 5 Minuten", () => {
  assert.match(de.bewerten.gespeichert, /Beta/);
  assert.match(de.bewerten.gespeichert, /5 Minuten/);
  assert.match(de.bewerten.eingegangen, /Freigabe/);
  assert.match(de.bewerten.eingegangen, /5 Minuten/);
  assert.match(en.bewerten.gespeichert, /beta/i);
  assert.match(en.bewerten.gespeichert, /5 minutes/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/bewertungs-hinweis.test.ts`
Expected: FAIL.

- [ ] **Step 3: Texte**

`lib/i18n/de.ts`:

```ts
    gespeichert: "Danke! Deine Bewertung ist gespeichert. Wir sind noch in der Beta: auf der Seite erscheint sie in etwa 5 Minuten.",
    eingegangen: "Danke! Deine Bewertung ist eingegangen. Nach der Freigabe erscheint sie in etwa 5 Minuten auf der Seite, wir sind noch in der Beta.",
```

`lib/i18n/en.ts` (Schlüssel `bewerten`):

```ts
    gespeichert: "Thanks! Your review is saved. We are still in beta: it shows up on the page in about 5 minutes.",
    eingegangen: "Thanks! Your review has arrived. Once approved, it shows up on the page in about 5 minutes; we are still in beta.",
```

`BewertungsFormular.tsx:156` bleibt in der Logik gleich (`sofortSichtbar ? gespeichert : eingegangen`). Prüfen, dass die Meldung sichtbar bleibt und nicht nach kurzer Zeit verschwindet. Verschwindet sie, für diese Meldung das Ausblenden entfernen.

- [ ] **Step 4: Tests, Commit**

Run: `npm test`
Expected: grün.

```bash
git add lib/i18n/de.ts lib/i18n/en.ts components/review/BewertungsFormular.tsx tests/bewertungs-hinweis.test.ts
git commit -m "Bewertung: Hinweis auf Beta und etwa 5 Minuten bis zur Anzeige"
```

---

### Task 8: Zusammenführen, Doku, Deploy, Live-Prüfung

**Skills:** edge-stack-master, cloudflare:wrangler, cloudflare-d1, cloudflare:web-perf, superpowers:verification-before-completion, web-design-guidelines, better-interface

**Files:**
- Modify: `.claude/skills/edge-stack-master.md` (§6: neue oberste Stufe „Assets mit Tor“, Begründung aus Spec 1), `HANDOFF.md`, `lib/neuigkeiten/eintraege.ts` (Meldung für /neu)

- [ ] **Step 1:** Stränge A, B, C nach `main` mergen; Konflikte in `worker.mjs` (fetch von A, scheduled von C) beide übernehmen. `npm run typecheck && npm test` grün.
- [ ] **Step 2:** Secret setzen: Deploy-Hook im Dashboard anlegen (Worker `www` → Settings → Builds → Deploy Hooks, Branch `main`). Kann Claude das nicht über die API, URL vom Nutzer holen. Dann `npx wrangler secret put DEPLOY_HOOK_URL`.
- [ ] **Step 3:** Migration 0033 remote einspielen (Task 6, Step 3), `db/constraints.sql` remote erneut ausführen.
- [ ] **Step 4:** `edge-stack-master.md` §6 ergänzen: „Stufe 0: Leseseiten als Dateien in Static Assets, `worker.mjs`-Tor (lib/tor.ts). Grund: auf Free kostet schon der OpenNext-Cache-Treffer 2 bis 12 ms, ein Neubau im Request 100 bis 450 ms (Messung 2026-10-21). Aktualität über Deploy-Hook (lib/neubau.ts).“ Dazu die /neu-Meldung (Beta-Hinweis, Seiten schneller).
- [ ] **Step 5:** Push nach `main` (Workers Build startet). Build-Log prüfen: `[vorrendern] D1-Abzug bereit`, `[seiten] N Leseseiten` mit N ≈ 2 × (427 + 2 × 581) ≈ 3200 plus feste Seiten. Build-Dauer notieren; über 10 Minuten: in HANDOFF als Risiko für das Build-Budget festhalten und die `-alle`-Varianten als ersten Kandidaten zum Streichen nennen.
- [ ] **Step 6: Live-Prüfung als eigener Agent** (Browser-MCP, Stichproben, keine Schleife):
  - Startseite, `/blueten`, `/blueten/mac-1`, `/blueten/mac-1?vertreiber=<id>` eines Strains mit mehreren Vertreibern, `&alle=1`, beide Sprachen: Inhalt da, kein 1102.
  - Ohne Gate-Cookie (privates Fenster): `/blueten/mac-1` und `/_seiten/de/index.html` leiten auf `/zugang`.
  - Angemeldet und freigegeben: Formular erscheint, Vorbelegung stimmt. Bewertung speichern, Hinweistext sichtbar, nach etwa 5 Minuten öffentlich sichtbar.
  - Offene Punkte aus S86 mitnehmen: Logo-Wechsel bei mehreren Vertreibern, `/admin/strains` Bearbeiten-Formular, Sativa/Indica-Info-Knopf. Browser-Tab danach wieder auf dunkel.
  - Observability: `cpuTimeMs` je URL der Leseseiten, Median ≤ 3 ms, kein `exceededCpu`; dazu `/api/ich/strain` mit Sitzung messen. Über 10 ms in HANDOFF als Folgeaufgabe (Insel ohne Next in `worker.mjs`).
- [ ] **Step 7:** HANDOFF aktualisieren (Stand, Messwerte, offene Folgeaufgaben: `/api/katalog` kostet 113 ms und braucht denselben Weg, Insel ohne Next falls nötig), committen, pushen.
