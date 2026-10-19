# Admin-Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin` wird eine Übersicht mit offenen Aufgaben (Zähler) und Publora-Kalender; jeder Bereich bekommt eine eigene Unterseite; das Profil führt direkt dorthin.

**Architecture:** Reine Funktionen (Kachel-Sortierung, Publora-Zeilen, Kalender-Gruppierung) in `lib/`, getestet mit `node:test`. Zähler als `count`-Abfragen in `lib/query/admin-uebersicht.ts`. Publora-Daten kommen per Skript (`scripts/publora-sync.ts`) über `POST /api/publora-sync` in die D1-Tabelle `publora_post`. Die heutigen Abschnitte aus `app/[lang]/admin/page.tsx` wandern in `components/admin/bereiche/*` und je eine Unterseite; ein Admin-Layout prüft das Recht und zeigt die Bereichsleiste.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (@opennextjs/cloudflare), Prisma mit D1, Tailwind-Tokens „Book of Terpz“, Tests `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-16-admin-dashboard-design.md`

## Global Constraints

- Kein Publora-Schlüssel im Worker; der Worker liest nur D1.
- Keine Mail, kein Push, kein Planen/Ändern von Posts aus dem Dashboard.
- Kalender: nächste 14 Tage, nach Tag gruppiert in `Europe/Berlin`; Entwürfe ohne Termin höchstens 10; letzte 7 Tage veröffentlicht eingeklappt.
- „Veraltet“, wenn kein Stand oder Stand älter als 48 h.
- Sync: höchstens 500 Zeilen je Lauf, Posts älter als 30 Tage verwirft das Skript; Route ersetzt in einer Transaktion.
- Instagram-Aufgabe zählt Posts mit Status `failed` der letzten 14 Tage.
- Admin-Seiten bleiben dynamisch und nur für `rolle === "ADMIN"`; Nicht-Admins bekommen `notFound()`, Gäste `redirect("/anmelden?weiter=…")`.
- Navigation bekommt keinen Admin-Link.
- UI nach Skill `ui-design-engine`: Tokens, 8px-Raster, 390 px ohne Querscroll, Trefferfläche ≥ 44 px, hell und dunkel.
- Wording: nie „Ware“ (Blüte/Strain), nie „Stärke“ (Variante). Admin-Texte fest deutsch (wie heute).
- Kein `next dev`/`build` lokal (Projektregel): prüfen per `npx tsc --noEmit -p .` und `npm test`, live nach Push.
- Lies vor Next-Code die passende Anleitung in `node_modules/next/dist/docs/` (AGENTS.md).

## Review Focus

- Sommerzeitwechsel 25.10.2026: Post 26.10. 00:30 Berlin (= 25.10. 23:30 UTC) muss unter dem 26.10. stehen. Test in Task 3.
- Publora liefert unbekannte/fehlende Felder (kein `scheduledTime`, kein `content`, keine `mediaUrls`): Zeile bleibt, Art `bild`, Titel leer, kein Absturz. Test in Task 2.
- Sync mit kaputtem Body (keine Liste, 501 Zeilen, Status fremd): 400, Tabelle unverändert. Test in Task 2 (`syncPruefen`).
- Ein Zähler scheitert (z. B. Tabelle `publora_post` fehlt vor der Migration): Kachel zeigt „–“, Seite rendert. Test in Task 1 (`sicherZaehlen`).
- Gast oder Mitglied ruft `/admin/bewertungen` direkt auf: Redirect bzw. 404, keine Daten. Quelltext-Test in Task 4.

---

## Datei-Struktur

| Datei | Verantwortung |
|---|---|
| `lib/admin-aufgaben.ts` | Bereiche, Kachel-Sortierung, `sicherZaehlen` (rein) |
| `lib/query/admin-uebersicht.ts` | `ladeAdminZaehler()` (Prisma-`count`s, `cache`) |
| `migrations/0028_publora_post.sql`, `prisma/schema.prisma` | Tabellen `publora_post`, `sync_stand` |
| `lib/publora-sync.ts` | Publora-Rohzeilen formen, Body prüfen (rein) |
| `app/api/publora-sync/route.ts` | Schlüssel prüfen, Tabelle ersetzen |
| `scripts/publora-sync.ts` | Publora holen, an Route schicken |
| `lib/admin-kalender.ts` | Kalender-Gruppierung, Veraltet-Prüfung (rein) |
| `lib/query/publora-kalender.ts` | Zeilen und Stand aus D1 |
| `app/[lang]/admin/layout.tsx` | Recht prüfen, Kopf, `AdminLeiste` |
| `components/admin/AdminLeiste.tsx` | Bereichsleiste mit Zählern (Client, `usePathname`) |
| `components/admin/bereiche/*.tsx` | heutige Abschnitte, unverändert verschoben |
| `app/[lang]/admin/<bereich>/page.tsx` | je eine Unterseite |
| `app/[lang]/admin/page.tsx` | Übersicht: Kacheln + Kalender |
| `components/admin/AufgabenKacheln.tsx`, `components/admin/PostKalender.tsx` | Darstellung Übersicht |
| `app/[lang]/profil/page.tsx` | Kopf-Aktion „Verwaltung“ mit Zahl |

Parallele Stränge: **A** = Task 1 → Task 6; **B** = Task 2 → Task 3; **C** = Task 4. Task 5 braucht 1, 3, 4. Task 7 zuletzt.

---

### Task 1: Aufgaben-Zähler

**Skills:** prisma-client-api, edge-stack-master, test-driven-development

**Files:**
- Create: `lib/admin-aufgaben.ts`, `lib/query/admin-uebersicht.ts`
- Test: `tests/admin-aufgaben.test.ts`

**Interfaces:**
- Produces:
  - `type AdminBereich = "bewertungen" | "mitglieder" | "gemeldet" | "budpics" | "vorschlaege" | "jury" | "instagram" | "abstimmung" | "kennwerte"`
  - `const ADMIN_BEREICHE: readonly { id: AdminBereich; titel: string; href: string; zaehlt: boolean }[]`
  - `type AdminZaehler = Partial<Record<AdminBereich, number | null>>` (`null` = Abfrage gescheitert)
  - `kachelReihenfolge(z: AdminZaehler): typeof ADMIN_BEREICHE[number][]`
  - `summeOffen(z: AdminZaehler): number`
  - `sicherZaehlen(f: () => Promise<number>): Promise<number | null>`
  - `ladeAdminZaehler(): Promise<AdminZaehler>` (server-only, `cache`)

- [ ] **Step 1: Failing test** `tests/admin-aufgaben.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_BEREICHE, kachelReihenfolge, sicherZaehlen, summeOffen } from "@/lib/admin-aufgaben";

test("Kacheln: offene nach Zahl absteigend vorn, Null und Werkzeuge hinten in Grundreihenfolge", () => {
  const r = kachelReihenfolge({ bewertungen: 2, mitglieder: 0, gemeldet: 5, budpics: null, vorschlaege: 0, jury: 1, instagram: 0 });
  assert.deepEqual(r.map((b) => b.id), ["gemeldet", "bewertungen", "jury", "mitglieder", "budpics", "vorschlaege", "instagram", "abstimmung", "kennwerte"]);
});

test("summeOffen ignoriert null und Werkzeuge", () => {
  assert.equal(summeOffen({ bewertungen: 2, gemeldet: 5, budpics: null }), 7);
});

test("sicherZaehlen: Fehler wird null", async () => {
  assert.equal(await sicherZaehlen(async () => 3), 3);
  assert.equal(await sicherZaehlen(async () => { throw new Error("no such table"); }), null);
});

test("jeder Bereich hat /admin/<id>", () => {
  for (const b of ADMIN_BEREICHE) assert.equal(b.href, `/admin/${b.id}`);
});
```

- [ ] **Step 2:** `npx tsx --test tests/admin-aufgaben.test.ts` → FAIL (Modul fehlt).

- [ ] **Step 3: Implementierung** `lib/admin-aufgaben.ts`

```ts
/** Bereiche der Verwaltung (Spec 2026-10-16 Admin-Dashboard). Reihenfolge = Grundreihenfolge der Leiste. */
export type AdminBereich = "bewertungen" | "mitglieder" | "gemeldet" | "budpics" | "vorschlaege" | "jury" | "instagram" | "abstimmung" | "kennwerte";

export const ADMIN_BEREICHE = [
  { id: "bewertungen", titel: "Bewertungen", href: "/admin/bewertungen", zaehlt: true },
  { id: "mitglieder", titel: "Mitglieder", href: "/admin/mitglieder", zaehlt: true },
  { id: "gemeldet", titel: "Gemeldet", href: "/admin/gemeldet", zaehlt: true },
  { id: "budpics", titel: "Budpics", href: "/admin/budpics", zaehlt: true },
  { id: "vorschlaege", titel: "Vorschläge", href: "/admin/vorschlaege", zaehlt: true },
  { id: "jury", titel: "Jury", href: "/admin/jury", zaehlt: true },
  { id: "instagram", titel: "Instagram", href: "/admin/instagram", zaehlt: true },
  { id: "abstimmung", titel: "Abstimmung", href: "/admin/abstimmung", zaehlt: false },
  { id: "kennwerte", titel: "Kennwerte", href: "/admin/kennwerte", zaehlt: false },
] as const satisfies readonly { id: AdminBereich; titel: string; href: string; zaehlt: boolean }[];

/** null = Abfrage gescheitert (Kachel zeigt „–“). */
export type AdminZaehler = Partial<Record<AdminBereich, number | null>>;

export function kachelReihenfolge(z: AdminZaehler) {
  const offen = (id: AdminBereich) => z[id] ?? 0;
  const mitZahl = ADMIN_BEREICHE.filter((b) => b.zaehlt && offen(b.id) > 0).sort((a, b) => offen(b.id) - offen(a.id));
  return [...mitZahl, ...ADMIN_BEREICHE.filter((b) => !mitZahl.includes(b))];
}

export function summeOffen(z: AdminZaehler): number {
  return ADMIN_BEREICHE.reduce((s, b) => s + (b.zaehlt ? (z[b.id] ?? 0) : 0), 0);
}

export async function sicherZaehlen(f: () => Promise<number>): Promise<number | null> {
  try {
    return await f();
  } catch (fehler) {
    console.error("Admin-Zähler fehlgeschlagen", fehler);
    return null;
  }
}
```

`/admin/instagram` zeigt den Kalender (Task 5); die Kachel braucht das Ziel.

- [ ] **Step 4: Abfragen** `lib/query/admin-uebersicht.ts`

```ts
import "server-only";

import { cache } from "react";

import { sicherZaehlen, type AdminZaehler } from "@/lib/admin-aufgaben";
import { getPrisma } from "@/lib/prisma";

const VIERZEHN_TAGE = 14 * 24 * 60 * 60 * 1000;

/** Alle offenen Zahlen in einem Promise.all, nur count (Spec Daten/Zähler). Je Anfrage einmal. */
export const ladeAdminZaehler = cache(async (): Promise<AdminZaehler> => {
  const prisma = await getPrisma();
  const [bewertungen, mitglieder, gemeldet, budpics, vorschlaege, jury, instagram] = await Promise.all([
    // Gleiche Regel wie offeneBewertungen in lib/query/reviews.ts.
    sicherZaehlen(() => prisma.review.count({ where: { freigegeben: false, istRedaktionell: false } })),
    sicherZaehlen(() => prisma.mitglied.count({ where: { freigegeben: false } })),
    sicherZaehlen(() => prisma.kommentar.count({ where: { status: "GEMELDET" } })),
    sicherZaehlen(() => prisma.budpic.count({ where: { status: "OFFEN" } })),
    sicherZaehlen(() => prisma.sortenVorschlag.count({ where: { status: "OFFEN" } })),
    sicherZaehlen(() => prisma.juryBeitrag.count({ where: { status: "EINGEREICHT" } })),
    sicherZaehlen(() => prisma.publoraPost.count({ where: { status: "failed", geplantAm: { gte: new Date(Date.now() - VIERZEHN_TAGE).toISOString() } } })),
  ]);
  return { bewertungen, mitglieder, gemeldet, budpics, vorschlaege, jury, instagram };
});
```

`prisma.publoraPost` kommt aus Task 2. Läuft Strang A vor B, Zeile `instagram` vorerst `sicherZaehlen(async () => 0)` und im Merge auf die Abfrage umstellen (Reviewer prüft).

- [ ] **Step 5:** `npx tsx --test tests/admin-aufgaben.test.ts` → PASS; `npx tsc --noEmit -p .` → 0 Fehler.
- [ ] **Step 6: Commit** `git add lib/admin-aufgaben.ts lib/query/admin-uebersicht.ts tests/admin-aufgaben.test.ts && git commit -m "feat(admin): Aufgaben-Zähler je Bereich"`

---

### Task 2: Publora-Spiegel (Tabelle, Formung, Route, Skript)

**Skills:** cloudflare-d1, prisma-cli, prisma-client-api, edge-stack-master, migration, test-driven-development

**Files:**
- Create: `migrations/0028_publora_post.sql`, `lib/publora-sync.ts`, `app/api/publora-sync/route.ts`, `scripts/publora-sync.ts`
- Modify: `prisma/schema.prisma` (Ende), danach `npm run db:generate`
- Test: `tests/publora-sync.test.ts`

**Interfaces:**
- Consumes: `publoraPosts()`, `markenAus()` aus `scripts/ig-gemeinsam.ts`; `igSchluesselOk()` aus `lib/ig-schluessel.ts`.
- Produces:
  - Prisma `PubloraPost { id, gruppe, plattform, art, status, geplantAm: String?, titel, abgerufenAm }`, `SyncStand { schluessel, stand }`
  - `type PostArt = "karussell" | "reel" | "story" | "bild"`
  - `type PubloraZeile = { id: string; gruppe: string; plattform: string; art: PostArt; status: string; geplantAm: string | null; titel: string }`
  - `publoraZeilen(posts: unknown[], jetzt?: Date): PubloraZeile[]`
  - `syncPruefen(body: unknown): string[]` (leer = ok)
  - `SYNC_MAX = 500`, `PUBLORA_STATUS = ["draft","scheduled","published","failed"]`

- [ ] **Step 1: Migration** `migrations/0028_publora_post.sql`

```sql
-- 0028_publora_post (Spec 2026-10-16 Admin-Dashboard). Per wrangler d1 execute --file, genau einmal.
CREATE TABLE IF NOT EXISTS publora_post (
  id TEXT PRIMARY KEY NOT NULL,
  gruppe TEXT NOT NULL,
  plattform TEXT NOT NULL,
  art TEXT NOT NULL,
  status TEXT NOT NULL,
  geplant_am TEXT,
  titel TEXT NOT NULL DEFAULT '',
  abgerufen_am TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS publora_post_geplant ON publora_post(geplant_am);
CREATE TABLE IF NOT EXISTS sync_stand (
  schluessel TEXT PRIMARY KEY NOT NULL,
  stand TEXT NOT NULL
);
```

Schema ans Ende von `prisma/schema.prisma`:

```prisma
/// Spiegel der Publora-Posts für den Admin-Kalender (Spec 2026-10-16), ersetzt je Sync-Lauf.
model PubloraPost {
  id          String  @id
  gruppe      String
  plattform   String
  art         String
  status      String
  geplantAm   String? @map("geplant_am")
  titel       String  @default("")
  abgerufenAm String  @map("abgerufen_am")

  @@index([geplantAm], map: "publora_post_geplant")
  @@map("publora_post")
}

model SyncStand {
  schluessel String @id
  stand      String

  @@map("sync_stand")
}
```

Dann `npm run db:generate`.

- [ ] **Step 2: Failing test** `tests/publora-sync.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { publoraZeilen, SYNC_MAX, syncPruefen } from "@/lib/publora-sync";

const JETZT = new Date("2026-10-16T10:00:00Z");
const url = (n: string) => `https://cdn.publora.com/x/1729-${n}`;

test("Art aus Medien und Marke", () => {
  const z = publoraZeilen([
    { id: "1", postGroupId: "g1", status: "scheduled", scheduledTime: "2026-10-20T17:00:00Z", content: "So bewerten wir\nmehr", mediaUrls: [url("bot-k-a-1.png"), url("bot-k-a-2.png")] },
    { id: "2", postGroupId: "g2", status: "draft", mediaUrls: [url("bot-r-x.mp4")] },
    { id: "3", postGroupId: "g3", status: "draft", mediaUrls: [url("bot-story-r-x.mp4")] },
    { id: "4", postGroupId: "g4", status: "published", scheduledTime: "2026-10-15T17:00:00Z", mediaUrls: [url("abc.png")] },
  ], JETZT);
  assert.deepEqual(z.map((x) => x.art), ["karussell", "reel", "story", "bild"]);
  assert.equal(z[0].titel, "So bewerten wir");
  assert.equal(z[0].plattform, "instagram");
});

test("fehlende Felder: Zeile bleibt, kein Absturz", () => {
  const [z] = publoraZeilen([{ postGroupId: "g9" }], JETZT);
  assert.deepEqual(z, { id: "g9", gruppe: "g9", plattform: "instagram", art: "bild", status: "unbekannt", geplantAm: null, titel: "" });
  assert.deepEqual(publoraZeilen([null, 3, "x", {}], JETZT), []);
});

test("Titel max 120 Zeichen, älter als 30 Tage fliegt, Doppel-Id einmal", () => {
  const z = publoraZeilen([
    { id: "a", postGroupId: "g", status: "published", scheduledTime: "2026-09-01T10:00:00Z", content: "alt" },
    { id: "b", postGroupId: "g", status: "draft", content: "x".repeat(200) },
    { id: "b", postGroupId: "g", status: "draft", content: "doppelt" },
  ], JETZT);
  assert.equal(z.length, 1);
  assert.equal(z[0].titel.length, 120);
});

test("syncPruefen", () => {
  const ok = { id: "1", gruppe: "g", plattform: "instagram", art: "reel", status: "draft", geplantAm: null, titel: "" };
  assert.deepEqual(syncPruefen({ posts: [ok] }), []);
  assert.ok(syncPruefen(null).length > 0);
  assert.ok(syncPruefen({ posts: "x" }).length > 0);
  assert.ok(syncPruefen({ posts: Array(SYNC_MAX + 1).fill(ok) }).length > 0);
  assert.ok(syncPruefen({ posts: [{ ...ok, status: "boom" }] }).length > 0);
  assert.ok(syncPruefen({ posts: [{ ...ok, art: "video" }] }).length > 0);
  assert.ok(syncPruefen({ posts: [{ ...ok, geplantAm: "morgen" }] }).length > 0);
});
```

- [ ] **Step 3:** `npx tsx --test tests/publora-sync.test.ts` → FAIL.

- [ ] **Step 4: Implementierung** `lib/publora-sync.ts`

```ts
/** Publora-Rohposts in Zeilen für den Admin-Kalender formen und den Sync-Body prüfen (Spec 2026-10-16). Rein. */
export type PostArt = "karussell" | "reel" | "story" | "bild";
export type PubloraZeile = { id: string; gruppe: string; plattform: string; art: PostArt; status: string; geplantAm: string | null; titel: string };

export const SYNC_MAX = 500;
export const PUBLORA_STATUS = ["draft", "scheduled", "published", "failed", "unbekannt"] as const;
const ARTEN: readonly PostArt[] = ["karussell", "reel", "story", "bild"];
const DREISSIG_TAGE = 30 * 24 * 60 * 60 * 1000;

const text = (v: unknown) => (typeof v === "string" ? v : "");

function artAus(urls: unknown): PostArt {
  const liste = Array.isArray(urls) ? urls.filter((u): u is string => typeof u === "string") : [];
  if (liste.some((u) => /\/\d+-bot-story-/.test(u))) return "story";
  if (liste.some((u) => /\.mp4$/i.test(u))) return "reel";
  return liste.length > 1 ? "karussell" : "bild";
}

export function publoraZeilen(posts: unknown[], jetzt: Date = new Date()): PubloraZeile[] {
  const grenze = jetzt.getTime() - DREISSIG_TAGE;
  const gesehen = new Set<string>();
  const zeilen: PubloraZeile[] = [];
  for (const roh of posts) {
    if (!roh || typeof roh !== "object") continue;
    const p = roh as Record<string, unknown>;
    const gruppe = text(p.postGroupId);
    const id = text(p.id) || gruppe;
    if (!id || gesehen.has(id)) continue;
    const zeit = text(p.scheduledTime);
    const geplantAm = zeit && !Number.isNaN(Date.parse(zeit)) ? new Date(zeit).toISOString() : null;
    if (geplantAm && Date.parse(geplantAm) < grenze) continue;
    gesehen.add(id);
    const status = text(p.status);
    zeilen.push({
      id,
      gruppe: gruppe || id,
      plattform: text(p.platform) || "instagram",
      art: artAus(p.mediaUrls),
      status: (PUBLORA_STATUS as readonly string[]).includes(status) ? status : "unbekannt",
      geplantAm,
      titel: text(p.content).split("\n")[0].trim().slice(0, 120),
    });
  }
  return zeilen;
}

export function syncPruefen(body: unknown): string[] {
  const posts = (body as { posts?: unknown } | null)?.posts;
  if (!Array.isArray(posts)) return ["posts fehlt"];
  if (posts.length > SYNC_MAX) return [`höchstens ${SYNC_MAX} Zeilen`];
  const fehler: string[] = [];
  posts.forEach((roh, i) => {
    const z = roh as Partial<PubloraZeile> | null;
    if (!z || typeof z.id !== "string" || !z.id || typeof z.gruppe !== "string" || typeof z.plattform !== "string" || typeof z.titel !== "string") fehler.push(`${i}: Felder`);
    else if (!ARTEN.includes(z.art as PostArt)) fehler.push(`${i}: art`);
    else if (!(PUBLORA_STATUS as readonly string[]).includes(z.status ?? "")) fehler.push(`${i}: status`);
    else if (z.geplantAm !== null && (typeof z.geplantAm !== "string" || Number.isNaN(Date.parse(z.geplantAm)))) fehler.push(`${i}: geplantAm`);
  });
  return fehler;
}
```

Prüfe: Test „Art“ — `bot-story-r-x.mp4` muss `story` liefern, nicht `reel` (Reihenfolge der Abfragen oben).

- [ ] **Step 5:** Test → PASS.

- [ ] **Step 6: Route** `app/api/publora-sync/route.ts`

```ts
import { NextResponse } from "next/server";

import { igSchluesselOk } from "@/lib/ig-schluessel";
import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { syncPruefen, type PubloraZeile } from "@/lib/publora-sync";
import { getPrisma } from "@/lib/prisma";

/** Publora-Spiegel ersetzen (Spec 2026-10-16 Admin-Dashboard). Gleicher Schlüssel wie /api/jury-ig. */
export async function POST(anfrage: Request) {
  if (!(await igSchluesselOk(anfrage))) return NextResponse.json({ fehler: "kein Zugriff" }, { status: 401 });
  const body: unknown = await anfrage.json().catch(() => null);
  const fehler = syncPruefen(body);
  if (fehler.length) return NextResponse.json({ fehler }, { status: 400 });
  const posts = (body as { posts: PubloraZeile[] }).posts;
  const jetzt = new Date().toISOString();
  const prisma = await getPrisma();
  // Ganz oder gar nicht: löschen, einfügen, Stand setzen in einer Transaktion.
  await prisma.$transaction([
    prisma.publoraPost.deleteMany({}),
    ...posts.map((p) => prisma.publoraPost.create({ data: { ...p, abgerufenAm: jetzt } })),
    prisma.syncStand.upsert({ where: { schluessel: "publora" }, create: { schluessel: "publora", stand: jetzt }, update: { stand: jetzt } }),
  ]);
  revalidiereSprachen("/admin");
  return NextResponse.json({ ok: true, zeilen: posts.length });
}
```

Prüfe in `lib/proxy-regeln.ts`, wie `/api/jury-ig` vom Gate ausgenommen ist, und nimm `/api/publora-sync` gleich auf (sonst blockt der Proxy die Routine).

- [ ] **Step 7: Skript** `scripts/publora-sync.ts`

```ts
/**
 * Publora-Posts in den Admin-Kalender spiegeln (Spec 2026-10-16 Admin-Dashboard).
 *   npx tsx scripts/publora-sync.ts
 * Braucht PUBLORA_API_KEY, IG_FEED_URL, IG_FEED_KEY (wie die IG-Routine). Fehler: Abbruch ohne Wiederholung.
 */
import { publoraZeilen, SYNC_MAX } from "../lib/publora-sync";
import { publoraPosts, umgebung } from "./ig-gemeinsam";

async function main() {
  const env = umgebung();
  const zeilen = publoraZeilen(await publoraPosts()).slice(0, SYNC_MAX);
  const ziel = new URL("/api/publora-sync", env.IG_FEED_URL);
  ziel.searchParams.set("key", env.IG_FEED_KEY ?? "");
  const antwort = await fetch(ziel, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ posts: zeilen }) });
  if (!antwort.ok) throw new Error(`Sync ${antwort.status}: ${await antwort.text()}`);
  console.log(`Publora-Spiegel: ${zeilen.length} Posts`);
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
```

Prüfe in `scripts/ig-jury.ts`, wie `ursprung` und `schluessel` aus `IG_FEED_URL` gebildet werden, und nimm denselben Weg (Exportnamen von `umgebung` exakt übernehmen).

- [ ] **Step 8:** `npx tsc --noEmit -p .` → 0; `npm test` → alles grün.
- [ ] **Step 9: Commit** `git add migrations/0028_publora_post.sql prisma/schema.prisma lib/generated lib/publora-sync.ts app/api/publora-sync scripts/publora-sync.ts tests/publora-sync.test.ts lib/proxy-regeln.ts && git commit -m "feat(admin): Publora-Spiegel in D1 per Sync-Route"`

---

### Task 3: Kalender-Gruppierung und Abfrage

**Skills:** prisma-client-api, test-driven-development

**Files:**
- Create: `lib/admin-kalender.ts`, `lib/query/publora-kalender.ts`
- Test: `tests/admin-kalender.test.ts`

**Interfaces:**
- Consumes: `PubloraZeile`, `PostArt` aus Task 2; Prisma `publoraPost`, `syncStand`.
- Produces:
  - `type KalenderTag = { tag: string /* YYYY-MM-DD Berlin */; posts: PubloraZeile[] }`
  - `type Kalender = { kommend: KalenderTag[]; entwuerfe: PubloraZeile[]; entwuerfeGesamt: number; vergangen: PubloraZeile[]; veraltet: boolean; stand: string | null }`
  - `kalenderBauen(zeilen: PubloraZeile[], stand: string | null, jetzt?: Date): Kalender`
  - `berlinTag(iso: string): string`
  - `ladeKalender(): Promise<Kalender>` (server-only)

- [ ] **Step 1: Failing test** `tests/admin-kalender.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { berlinTag, kalenderBauen } from "@/lib/admin-kalender";
import type { PubloraZeile } from "@/lib/publora-sync";

const JETZT = new Date("2026-10-16T10:00:00Z");
const z = (id: string, status: string, geplantAm: string | null): PubloraZeile => ({ id, gruppe: id, plattform: "instagram", art: "reel", status, geplantAm, titel: id });

test("berlinTag über Sommerzeitwechsel", () => {
  assert.equal(berlinTag("2026-10-25T23:30:00Z"), "2026-10-26");
  assert.equal(berlinTag("2026-10-24T22:30:00Z"), "2026-10-25");
});

test("kommend 14 Tage nach Tag, Entwürfe max 10, vergangen 7 Tage veröffentlicht", () => {
  const zeilen = [
    z("a", "scheduled", "2026-10-20T17:00:00Z"),
    z("b", "scheduled", "2026-10-20T16:00:00Z"),
    z("c", "scheduled", "2026-11-05T17:00:00Z"), // > 14 Tage
    z("d", "published", "2026-10-15T17:00:00Z"),
    z("e", "published", "2026-10-01T17:00:00Z"), // > 7 Tage zurück
    z("f", "failed", "2026-10-15T17:00:00Z"),
    ...Array.from({ length: 12 }, (_, i) => z(`e${i}`, "draft", null)),
  ];
  const k = kalenderBauen(zeilen, "2026-10-16T04:00:00Z", JETZT);
  assert.deepEqual(k.kommend.map((t) => [t.tag, t.posts.map((p) => p.id)]), [["2026-10-20", ["b", "a"]]]);
  assert.equal(k.entwuerfe.length, 10);
  assert.equal(k.entwuerfeGesamt, 12);
  assert.deepEqual(k.vergangen.map((p) => p.id), ["d", "f"]);
  assert.equal(k.veraltet, false);
});

test("veraltet ohne Stand oder nach 48 h", () => {
  assert.equal(kalenderBauen([], null, JETZT).veraltet, true);
  assert.equal(kalenderBauen([], "2026-10-14T09:59:00Z", JETZT).veraltet, true);
  assert.equal(kalenderBauen([], "2026-10-14T10:01:00Z", JETZT).veraltet, false);
});
```

- [ ] **Step 2:** Test → FAIL.

- [ ] **Step 3: Implementierung** `lib/admin-kalender.ts`

```ts
import type { PubloraZeile } from "@/lib/publora-sync";

/** Admin-Kalender aus dem Publora-Spiegel (Spec 2026-10-16): Liste nach Berliner Tag, kein Monatsraster. Rein. */
export type KalenderTag = { tag: string; posts: PubloraZeile[] };
export type Kalender = { kommend: KalenderTag[]; entwuerfe: PubloraZeile[]; entwuerfeGesamt: number; vergangen: PubloraZeile[]; veraltet: boolean; stand: string | null };

const TAG = 24 * 60 * 60 * 1000;
// Intl einmal je Isolate.
const BERLIN = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });

export function berlinTag(iso: string): string {
  return BERLIN.format(new Date(iso));
}

const zeit = (p: PubloraZeile) => Date.parse(p.geplantAm ?? "");

export function kalenderBauen(zeilen: PubloraZeile[], stand: string | null, jetzt: Date = new Date()): Kalender {
  const t = jetzt.getTime();
  const kommendeListe = zeilen
    .filter((p) => p.status !== "published" && p.geplantAm && zeit(p) >= t && zeit(p) < t + 14 * TAG)
    .sort((a, b) => zeit(a) - zeit(b));
  const kommend: KalenderTag[] = [];
  for (const p of kommendeListe) {
    const tag = berlinTag(p.geplantAm!);
    const letzter = kommend.at(-1);
    if (letzter?.tag === tag) letzter.posts.push(p);
    else kommend.push({ tag, posts: [p] });
  }
  const alleEntwuerfe = zeilen.filter((p) => p.status === "draft" && !p.geplantAm);
  const vergangen = zeilen
    .filter((p) => (p.status === "published" || p.status === "failed") && p.geplantAm && zeit(p) < t && zeit(p) >= t - 7 * TAG)
    .sort((a, b) => zeit(b) - zeit(a) || a.id.localeCompare(b.id));
  const veraltet = !stand || Number.isNaN(Date.parse(stand)) || t - Date.parse(stand) > 2 * TAG;
  return { kommend, entwuerfe: alleEntwuerfe.slice(0, 10), entwuerfeGesamt: alleEntwuerfe.length, vergangen, veraltet, stand };
}
```

- [ ] **Step 4:** Test → PASS.

- [ ] **Step 5: Abfrage** `lib/query/publora-kalender.ts`

```ts
import "server-only";

import { kalenderBauen, type Kalender } from "@/lib/admin-kalender";
import { getPrisma } from "@/lib/prisma";
import type { PostArt } from "@/lib/publora-sync";

/** Spiegel lesen; fehlt die Tabelle (vor Migration 0028), gilt der Kalender als veraltet. */
export async function ladeKalender(): Promise<Kalender> {
  try {
    const prisma = await getPrisma();
    const [zeilen, stand] = await Promise.all([
      prisma.publoraPost.findMany({ take: 500, orderBy: { geplantAm: "asc" } }),
      prisma.syncStand.findUnique({ where: { schluessel: "publora" } }),
    ]);
    return kalenderBauen(zeilen.map(({ abgerufenAm: _a, ...z }) => ({ ...z, art: z.art as PostArt })), stand?.stand ?? null);
  } catch (fehler) {
    console.error("ladeKalender fehlgeschlagen", fehler);
    return kalenderBauen([], null);
  }
}
```

- [ ] **Step 6:** `npx tsc --noEmit -p .` → 0; `npm test` grün.
- [ ] **Step 7: Commit** `git add lib/admin-kalender.ts lib/query/publora-kalender.ts tests/admin-kalender.test.ts && git commit -m "feat(admin): Kalender aus dem Publora-Spiegel"`

---

### Task 4: Unterseiten, Layout, Bereichsleiste

**Skills:** safe-refactor, ui-design-engine, better-layout, react-best-practices, edge-stack-master

**Files:**
- Create: `app/[lang]/admin/layout.tsx`, `components/admin/AdminLeiste.tsx`, `components/admin/bereiche/{Abstimmung,Ergebnisse,Gemeldet,Bewertungen,Mitglieder,Budpics,Kennwerte}.tsx`, `app/[lang]/admin/{bewertungen,mitglieder,gemeldet,budpics,abstimmung,kennwerte}/page.tsx`
- Modify: `app/[lang]/admin/page.tsx` (Abschnitte raus; bis Task 5 bleibt eine schlichte Linkliste), `app/[lang]/admin/jury/page.tsx`, `app/[lang]/admin/vorschlaege/page.tsx` (eigenen Kopf entfernen, falls das Layout ihn liefert)
- Test: `tests/admin-seiten.test.ts`

**Interfaces:**
- Consumes: `ADMIN_BEREICHE`, `AdminZaehler` (Task 1). Ist Task 1 noch nicht gemergt: in diesem Worktree Task 1 Step 3 Datei `lib/admin-aufgaben.ts` übernehmen, Zähler im Layout per `ladeAdminZaehler` erst nach Merge; bis dahin `{}` übergeben.
- Produces: `AdminLeiste({ zaehler }: { zaehler: AdminZaehler })` (Client), Bereichskomponenten `AbstimmungBereich`, `ErgebnisBereich`, `GemeldeteBereich`, `BewertungenBereich`, `MitgliederBereich({ eigeneMitgliedId })`, `BudpicListe({ status })`, `KennwerteBereich` — unverändert aus `page.tsx` verschoben (`UmfrageBereich` heißt jetzt `AbstimmungBereich`).

- [ ] **Step 1: Failing test** `tests/admin-seiten.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { ADMIN_BEREICHE } from "@/lib/admin-aufgaben";

test("Layout prüft Recht: Gast Redirect, Nicht-Admin notFound", () => {
  const q = readFileSync("app/[lang]/admin/layout.tsx", "utf8");
  assert.match(q, /redirect\("\/anmelden\?weiter=%2Fadmin"\)/);
  assert.match(q, /rolle !== "ADMIN"\) notFound\(\)/);
});

test("jede Unterseite existiert und prüft selbst (Layouts schützen keine parallelen Requests)", () => {
  for (const b of ADMIN_BEREICHE) {
    if (b.id === "instagram") continue; // Task 5
    const pfad = `app/[lang]/admin/${b.id}/page.tsx`;
    assert.ok(existsSync(pfad), pfad);
    assert.match(readFileSync(pfad, "utf8"), /adminSeite\(|adminErforderlich\(/, pfad);
  }
});

test("Übersicht enthält keine Abschnitte mehr", () => {
  const q = readFileSync("app/[lang]/admin/page.tsx", "utf8");
  assert.doesNotMatch(q, /async function (MitgliederBereich|BewertungenBereich|BudpicListe)/);
});
```

Lies vorher in `node_modules/next/dist/docs/` den Abschnitt zu Layouts: Layouts rendern nicht bei jeder Navigation neu und ersetzen keine Rechteprüfung je Seite. Darum prüft jede Seite selbst über einen Helfer `adminSeite()`.

- [ ] **Step 2:** Test → FAIL.

- [ ] **Step 3: Helfer** in `lib/session.ts` ergänzen (neben `adminErforderlich`):

```ts
/** Für Admin-Seiten: Gast zur Anmeldung, Nicht-Admin 404 (die Seite soll nicht verraten, dass es sie gibt). */
export async function adminSeite(weiter = "/admin") {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) redirect(`/anmelden?weiter=${encodeURIComponent(weiter)}`);
  if (mitglied.rolle !== "ADMIN") notFound();
  return mitglied;
}
```

(`redirect`, `notFound` aus `next/navigation` importieren, falls nicht vorhanden.)

- [ ] **Step 4: Layout** `app/[lang]/admin/layout.tsx`

```tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { AdminLeiste } from "@/components/admin/AdminLeiste";
import { ladeAdminZaehler } from "@/lib/query/admin-uebersicht";
import { aktuellesMitglied } from "@/lib/session";

export const metadata: Metadata = { title: "Verwaltung", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const mitglied = await aktuellesMitglied();
  if (!mitglied) redirect("/anmelden?weiter=%2Fadmin");
  if (mitglied.rolle !== "ADMIN") notFound();
  const zaehler = await ladeAdminZaehler();
  return (
    <div className="mx-auto w-full max-w-320 px-4 py-16 sm:px-8">
      <AdminLeiste zaehler={zaehler} />
      <div className="mt-8 flex flex-col gap-8">{children}</div>
    </div>
  );
}
```

- [ ] **Step 5: Leiste** `components/admin/AdminLeiste.tsx`

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_BEREICHE, type AdminZaehler } from "@/lib/admin-aufgaben";

/** Bereichsleiste der Verwaltung: scrollt in sich auf schmalen Schirmen, nie die Seite. */
export function AdminLeiste({ zaehler }: { zaehler: AdminZaehler }) {
  const pfad = usePathname();
  const aktiv = (href: string) => pfad.endsWith(href);
  return (
    <nav aria-label="Verwaltung" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-2 border-b border-border">
        <li>
          <Link prefetch={false} href="/admin" aria-current={pfad.endsWith("/admin") ? "page" : undefined} className="inline-flex min-h-11 items-center px-3 text-body text-text-muted aria-[current=page]:border-b-2 aria-[current=page]:border-accent aria-[current=page]:text-text">
            Übersicht
          </Link>
        </li>
        {ADMIN_BEREICHE.map((b) => {
          const zahl = b.zaehlt ? zaehler[b.id] : undefined;
          return (
            <li key={b.id}>
              <Link prefetch={false} href={b.href} aria-current={aktiv(b.href) ? "page" : undefined} className="inline-flex min-h-11 items-center gap-2 px-3 text-body text-text-muted aria-[current=page]:border-b-2 aria-[current=page]:border-accent aria-[current=page]:text-text">
                {b.titel}
                {zahl ? <span className="numeric rounded-full bg-warning-subtle px-2 text-small text-text">{zahl}</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

Token-Namen (`bg-warning-subtle`, `border-accent`) gegen `app/globals.css` prüfen und bei Abweichung die vorhandenen nehmen (Skill ui-design-engine).

- [ ] **Step 6: Abschnitte verschieben.** Jede Funktion aus `page.tsx` (Zeilen 79–546: `UmfrageBereich`, `ErgebnisBereich`, `GemeldeteBereich`, `BewertungenBereich`, `MitgliederBereich`, `BudpicListe`, Kennwerte-Karte) wörtlich in eine Datei unter `components/admin/bereiche/` verschieben, mit genau den Imports, die sie braucht, und `export`. Konstanten (`ROLLEN_LABEL`, `DATUM`, `MAX_ZEILEN`) dorthin, wo sie genutzt werden. Keine Logik ändern. `VorschlaegeKarte` und `JuryKarte` entfallen (ersetzt durch Leiste und Kacheln).

- [ ] **Step 7: Unterseiten**, Muster (für jede der sechs Seiten mit passendem Bereich, Titel und Suspense-Text aus der alten `page.tsx`):

```tsx
// app/[lang]/admin/bewertungen/page.tsx
import { Suspense } from "react";

import { BewertungenBereich } from "@/components/admin/bereiche/Bewertungen";
import { Spinner } from "@/components/ui";
import { adminSeite } from "@/lib/session";

export default async function AdminBewertungenPage() {
  await adminSeite("/admin/bewertungen");
  return (
    <Suspense fallback={<Spinner text="Bewertungen werden geladen" />}>
      <BewertungenBereich />
    </Suspense>
  );
}
```

`abstimmung/page.tsx` zeigt `AbstimmungBereich` und `ErgebnisBereich`; `budpics/page.tsx` beide `BudpicListe` (OFFEN, FREIGEGEBEN); `mitglieder/page.tsx` übergibt `eigeneMitgliedId={(await adminSeite("/admin/mitglieder")).mitgliedId}`. `jury/page.tsx` und `vorschlaege/page.tsx`: vorhandene Prüfung auf `adminSeite(...)` umstellen, eigenen äußeren Rahmen (`mx-auto max-w-…`) entfernen, da das Layout ihn setzt.

- [ ] **Step 8: Übersicht vorläufig.** `app/[lang]/admin/page.tsx` auf `await adminSeite(); return <h1 className="text-h1 text-text">Verwaltung</h1>;` kürzen (Task 5 füllt sie).

- [ ] **Step 9:** `npx tsc --noEmit -p .` → 0; `npm test` → grün (Quelltext-Tests, die `app/[lang]/admin/page.tsx` lesen, auf die neue Datei umstellen; Inhalt der Prüfung nicht abschwächen).
- [ ] **Step 10: Commit** `git add app/[lang]/admin components/admin lib/session.ts tests && git commit -m "refactor(admin): Bereiche als Unterseiten mit Leiste"`

---

### Task 5: Übersicht mit Kacheln und Kalender, Seite Instagram

**Skills:** ui-design-engine, frontend-design, better-layout, better-typography, critique-visual-hierarchy, critique-information-density, better-accessibility

**Files:**
- Create: `components/admin/AufgabenKacheln.tsx`, `components/admin/PostKalender.tsx`, `app/[lang]/admin/instagram/page.tsx`
- Modify: `app/[lang]/admin/page.tsx`
- Test: `tests/admin-uebersicht.test.ts`

**Interfaces:**
- Consumes: `kachelReihenfolge`, `AdminZaehler`, `ladeAdminZaehler` (Task 1); `Kalender`, `ladeKalender` (Task 3); `adminSeite` (Task 4).
- Produces: `AufgabenKacheln({ zaehler })`, `PostKalender({ kalender, kompakt? })`.

- [ ] **Step 1: Failing test** `tests/admin-uebersicht.test.ts` (Render wie `tests/jury-editor.test.ts`, `renderToStaticMarkup`):

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AufgabenKacheln } from "@/components/admin/AufgabenKacheln";
import { PostKalender } from "@/components/admin/PostKalender";
import { kalenderBauen } from "@/lib/admin-kalender";

test("Kacheln: Zahl, Strich bei Fehler, Link je Bereich", () => {
  const html = renderToStaticMarkup(createElement(AufgabenKacheln, { zaehler: { gemeldet: 3, budpics: null } }));
  assert.match(html, /href="\/admin\/gemeldet"[\s\S]*?>3</);
  assert.match(html, /href="\/admin\/budpics"[\s\S]*?–/);
  assert.ok(html.indexOf("/admin/gemeldet") < html.indexOf("/admin/bewertungen"));
});

test("Kalender: veraltet zeigt Hinweis statt Liste", () => {
  const html = renderToStaticMarkup(createElement(PostKalender, { kalender: kalenderBauen([], null) }));
  assert.match(html, /Kalender veraltet, Routine prüfen/);
});

test("Kalender: Tag, Uhrzeit Berlin, Art, Status", () => {
  const k = kalenderBauen([{ id: "a", gruppe: "a", plattform: "instagram", art: "reel", status: "scheduled", geplantAm: "2026-10-20T17:00:00Z", titel: "So bewerten wir" }], "2026-10-16T04:00:00Z", new Date("2026-10-16T10:00:00Z"));
  const html = renderToStaticMarkup(createElement(PostKalender, { kalender: k }));
  assert.match(html, /19:00/);
  assert.match(html, /Reel/);
  assert.match(html, /So bewerten wir/);
  assert.match(html, /geplant/);
});
```

Hinweis: `kalenderBauen` nutzt `new Date()` als Standard; die Komponente rechnet nichts selbst, sie zeigt nur `kalender`.

- [ ] **Step 2:** Test → FAIL.

- [ ] **Step 3: Kacheln** `components/admin/AufgabenKacheln.tsx`

```tsx
import Link from "next/link";

import { Card } from "@/components/ui";
import { kachelReihenfolge, type AdminZaehler } from "@/lib/admin-aufgaben";

/** Offene Aufgaben je Bereich; Kacheln mit Zahl vorn, leere gedämpft (Spec Übersicht). */
export function AufgabenKacheln({ zaehler }: { zaehler: AdminZaehler }) {
  return (
    <section aria-labelledby="aufgaben-titel" className="flex flex-col gap-4">
      <h2 id="aufgaben-titel" className="text-h3 text-text">Aufgaben</h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {kachelReihenfolge(zaehler).map((b) => {
          const zahl = b.zaehlt ? zaehler[b.id] : undefined;
          const offen = typeof zahl === "number" && zahl > 0;
          return (
            <li key={b.id}>
              <Link prefetch={false} href={b.href} className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                <Card className={`flex h-full min-h-24 flex-col justify-between gap-2 p-4 ${offen ? "" : "opacity-70"}`}>
                  <span className="text-body text-text">{b.titel}</span>
                  {b.zaehlt ? (
                    <span className={`numeric text-h2 ${offen ? "text-text" : "text-text-muted"}`}>{zahl === null ? "–" : (zahl ?? 0)}</span>
                  ) : (
                    <span className="text-small text-text-muted">Öffnen</span>
                  )}
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Kalender** `components/admin/PostKalender.tsx`

```tsx
import { Badge } from "@/components/ui";
import type { BadgeVariante } from "@/components/ui";
import type { Kalender } from "@/lib/admin-kalender";
import type { PostArt, PubloraZeile } from "@/lib/publora-sync";

const ART: Record<PostArt, string> = { karussell: "Karussell", reel: "Reel", story: "Story", bild: "Bild" };
const STATUS: Record<string, [string, BadgeVariante]> = {
  scheduled: ["geplant", "neutral"],
  draft: ["Entwurf", "warning"],
  published: ["veröffentlicht", "success"],
  failed: ["fehlgeschlagen", "danger"],
  unbekannt: ["unbekannt", "neutral"],
};
const UHR = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
const TAG = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "long", day: "numeric", month: "long" });
const STAND = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Zeile({ p }: { p: PubloraZeile }) {
  const [text, variante] = STATUS[p.status] ?? STATUS.unbekannt;
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2">
      {p.geplantAm ? <span className="numeric w-12 text-body text-text">{UHR.format(new Date(p.geplantAm))}</span> : null}
      <span className="text-small text-text-muted">{ART[p.art]}</span>
      <span className="min-w-0 flex-1 text-body text-text wrap-break-word">{p.titel || "Ohne Titel"}</span>
      <Badge variante={variante}>{text}</Badge>
    </li>
  );
}

/** Nächste 14 Tage nach Tag, Entwürfe ohne Termin, letzte 7 Tage eingeklappt. Zeigt nur, plant nichts. */
export function PostKalender({ kalender: k }: { kalender: Kalender }) {
  return (
    <section aria-labelledby="kalender-titel" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="kalender-titel" className="text-h3 text-text">Instagram-Kalender</h2>
        {k.stand ? <span className="numeric text-small text-text-muted">Stand: {STAND.format(new Date(k.stand))}</span> : null}
      </div>
      {k.veraltet ? (
        <p role="status" className="text-body text-warning">Kalender veraltet, Routine prüfen.</p>
      ) : (
        <>
          {k.kommend.length === 0 ? <p className="text-body text-text-muted">In den nächsten 14 Tagen ist nichts geplant.</p> : null}
          {k.kommend.map((t) => (
            <div key={t.tag} className="flex flex-col">
              <h3 className="text-body font-medium text-text">{TAG.format(new Date(`${t.tag}T12:00:00Z`))}</h3>
              <ul className="divide-y divide-border">{t.posts.map((p) => <Zeile key={p.id} p={p} />)}</ul>
            </div>
          ))}
          <div className="flex flex-col">
            <h3 className="text-body font-medium text-text">Entwürfe ohne Termin <span className="numeric text-text-muted">({k.entwuerfeGesamt})</span></h3>
            <ul className="divide-y divide-border">{k.entwuerfe.map((p) => <Zeile key={p.id} p={p} />)}</ul>
          </div>
          {k.vergangen.length > 0 ? (
            <details>
              <summary className="min-h-11 cursor-pointer text-body text-text">Letzte 7 Tage ({k.vergangen.length})</summary>
              <ul className="divide-y divide-border">{k.vergangen.map((p) => <Zeile key={p.id} p={p} />)}</ul>
            </details>
          ) : null}
        </>
      )}
    </section>
  );
}
```

`BadgeVariante`-Werte und Token `text-warning` gegen `components/ui` und `app/globals.css` prüfen.

- [ ] **Step 5: Übersicht** `app/[lang]/admin/page.tsx`

```tsx
import { AufgabenKacheln } from "@/components/admin/AufgabenKacheln";
import { PostKalender } from "@/components/admin/PostKalender";
import { ladeAdminZaehler } from "@/lib/query/admin-uebersicht";
import { ladeKalender } from "@/lib/query/publora-kalender";
import { adminSeite } from "@/lib/session";

export default async function AdminPage() {
  await adminSeite();
  const [zaehler, kalender] = await Promise.all([ladeAdminZaehler(), ladeKalender()]);
  return (
    <>
      <h1 className="text-h1 text-text">Verwaltung</h1>
      <AufgabenKacheln zaehler={zaehler} />
      <PostKalender kalender={kalender} />
    </>
  );
}
```

`app/[lang]/admin/instagram/page.tsx`: `await adminSeite("/admin/instagram")`, dann `<PostKalender kalender={await ladeKalender()} />`.

- [ ] **Step 6:** Test → PASS; `npx tsc --noEmit -p .` → 0; `npm test` grün.
- [ ] **Step 7: Commit** `git add components/admin/AufgabenKacheln.tsx components/admin/PostKalender.tsx app/[lang]/admin tests/admin-uebersicht.test.ts && git commit -m "feat(admin): Übersicht mit Aufgaben und Instagram-Kalender"`

---

### Task 6: Einstieg im Profil

**Skills:** ui-design-engine, better-writing, test-driven-development

**Files:**
- Modify: `app/[lang]/profil/page.tsx` (`seitenAktionen`, Aufruf Zeile ~83), `lib/i18n/de.ts`, `lib/i18n/en.ts` (`profil.seite`)
- Test: `tests/profil-admin-einstieg.test.ts`

**Interfaces:**
- Consumes: `ladeAdminZaehler`, `summeOffen` (Task 1).
- Produces: `seitenAktionen(s, offen: number | null)`; i18n `profil.seite.verwaltung` („Verwaltung“ / „Admin“), `profil.seite.verwaltungOffen` („Verwaltung · {zahl} offen“ / „Admin · {zahl} open“).

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("Profil: Verwaltung als Kopf-Aktion nur für ADMIN, mit Zahl", () => {
  const q = readFileSync("app/[lang]/profil/page.tsx", "utf8");
  assert.match(q, /rolle === "ADMIN"\s*\?\s*summeOffen\(await ladeAdminZaehler\(\)\)/);
  assert.match(q, /href: "\/admin"/);
  assert.equal(de.profil.seite.verwaltungOffen, "Verwaltung · {zahl} offen");
  assert.equal(en.profil.seite.verwaltungOffen, "Admin · {zahl} open");
});
```

- [ ] **Step 2:** Test → FAIL.
- [ ] **Step 3: Umsetzung.** In `profil/page.tsx`:

```ts
const offen = mitglied.rolle === "ADMIN" ? summeOffen(await ladeAdminZaehler()) : null;
// …
aktionen: seitenAktionen(s, offen),
```

```ts
function seitenAktionen(s: Woerterbuch["profil"]["seite"], offen: number | null) {
  const bewerten = { href: "/blueten", text: s.bewerten, art: "primary" } as const;
  if (offen === null) return [bewerten] as const;
  return [bewerten, { href: "/admin", text: offen > 0 ? t(s.verwaltungOffen, { zahl: String(offen) }) : s.verwaltung, art: "secondary" }] as const;
}
```

Den Typ der `aktionen` in `ProfilKopf` prüfen (`art`-Werte); passt `"secondary"` nicht, die vorhandene Nebenvariante nehmen. Die Karte „Verwaltung“ in `konto-reihen.tsx` bleibt.

- [ ] **Step 4:** Test → PASS; `npx tsc --noEmit -p .` → 0; `npm test` grün.
- [ ] **Step 5: Commit** `git commit -am "feat(profil): Verwaltung direkt aus dem Profilkopf mit offener Zahl"`

---

### Task 7: Routinen, Remote-Migration, Live-Prüfung (Controller, nicht Subagent)

**Skills:** cloudflare-d1, wrangler, schedule, verification-before-completion

- [ ] **Step 1:** Remote-Migration selbst einspielen (Memory-Regel): `npx wrangler d1 execute <DB-Name aus wrangler.jsonc> --remote --file migrations/0028_publora_post.sql`.
- [ ] **Step 2:** `docs/instagram/agent-anweisung.md`: als ersten Schritt jedes Laufs `npx --yes tsx scripts/publora-sync.ts` (Fehler melden, Lauf fortsetzen). Commit.
- [ ] **Step 3:** Neue Cloud-Routine per Skill `schedule`: täglich 06:00 Europe/Berlin, nur `npx --yes tsx scripts/publora-sync.ts`, gleiche Secrets wie die IG-Routine.
- [ ] **Step 4:** Lokal einmal `npx tsx scripts/publora-sync.ts` gegen live (nach Deploy), Ausgabe „Publora-Spiegel: N Posts“.
- [ ] **Step 5:** Push `main`; live per Browser: `/admin` (Kacheln, Kalender mit „So bewerten wir“ 21.10. Reel), `/admin/bewertungen`, `/admin/instagram`, Profil-Kopf-Knopf; hell/dunkel, 390 px ohne Querscroll.
- [ ] **Step 6:** HANDOFF aktualisieren, committen, pushen.
