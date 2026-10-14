# Instagram-Karten und Cowork-Ablauf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jede freigegebene Betreiber-Bewertung hat eine Bildkarte 1080 × 1350 als HTML, die Cowork per Screenshot in einen Publora-Entwurf verwandelt.

**Architecture:** Reine Funktion `igKarteHtml` (lib/ig-karte.ts) baut ein vollständiges HTML-Dokument ohne Layout der Seite. Route Handler `GET /api/ig-karte/[id]` liefert es aus, offen nur mit `?key=` gleich `IG_FEED_KEY` (gleiche Proxy-Regel wie der Feed). Der Feed bekommt pro Bewertung das Feld `karte`. Ein Anweisungstext für Cowork beschreibt Screenshot, Caption und Publora-Entwurf.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma/D1, Tests mit `node:test` über `npm test` (tsx).

**Spec:** `docs/superpowers/specs/2026-10-14-ig-karten-cowork-design.md`

**Abweichung von der Spec (technisch begründet):** Die Karte liegt unter `/api/ig-karte/<id>` statt `/ig-karte/<id>`. Seiten unter `app/[lang]/` erben Kopf, Fuß und Inseln des Root-Layouts; ein Route Handler liefert reines HTML und läuft ohne Sprach-Rewrite. Feld `karte` zeigt entsprechend auf `/api/ig-karte/<id>`.

## Global Constraints

- Nie kostenpflichtig; kein Bild-Rendern im Worker (Free-Plan 10 ms CPU). Die Karte ist HTML-Text, kein PNG.
- HWG: nur Aroma, Aussehen, Charge, Note. Keine Wirkung (`wirkung` nie ausgeben), Zitat nur ohne `hwgTreffer`.
- Zitat höchstens 140 Zeichen, an Wortgrenze gekürzt, mit „…“.
- Karte 1080 × 1350 px, feste dunkle Farbwelt, Pinsel-Logo `/marke/pinsel.webp`, Schriften Newsreader und Mr Dafoe.
- Schlüssel nie in Antworten: `karte` ohne `?key=`.
- Ohne Secret `IG_FEED_KEY` ist nichts offen.
- Commits in Prosa, Ende `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; Push nach `main` nach jeder Aufgabe.
- Kein `next dev`/`build` lokal; Prüfung live nach Push.

## Review Focus

- Blütenname oder Notiz mit `<`, `&`, `"` (z. B. „Apples & Bananas“): muss maskiert erscheinen, nicht als HTML. Test in Task 1.
- Bewertung ohne Note, ohne Charge, ohne Vertreiber, ohne Notiz: Karte rendert ohne Lücken oder „null“. Test in Task 1.
- Notiz mit Zeilenumbrüchen `\r\n`: Zitat einzeilig mit Leerzeichen. Test in Task 1.
- Unbekannte oder nicht freigegebene Id: 404, keine Daten. Test über `igKarteDaten`-Filter (`igReview` liefert `null`) in Task 2.
- Pfad `/api/ig-karte/` ohne Id oder mit weiterem Segment: kein Schlüsselzugang. Test in Task 2.

---

### Task 1: Kartenbaustein `lib/ig-karte.ts` und Feld `karte`

**Skills:** ui-design-engine, frontend-design, better-typography, test-driven-development

**Files:**
- Create: `lib/ig-karte.ts`
- Modify: `lib/ig-feed.ts` (Typ `IgReview` und `igReview`)
- Test: `tests/ig-karte.test.ts`, `tests/ig-feed.test.ts`

**Interfaces:**
- Produces: `kartenZitat(notiz: string | null): string | null`, `igKarteHtml(r: IgReview, ursprung: string): string`, Feld `IgReview.karte: string`.

- [ ] **Step 1: Failing tests schreiben** – `tests/ig-karte.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { igKarteHtml, kartenZitat } from "@/lib/ig-karte";
import type { IgReview } from "@/lib/ig-feed";

const r: IgReview = { id: "r1", url: "https://x.dev/blueten/s", karte: "https://x.dev/api/ig-karte/r1", bluete: "Apples & Bananas", vertreiber: "MGF <Via>", charge: "C1", gesamtnote: 4.5, aromen: ["ZITRUS", "SUESS"], notiz: "Zitrus vorne", bilder: [], datum: "2026-10-01T00:00:00.000Z" };

test("Zitat: kurz bleibt, lang wird an Wortgrenze gekürzt", () => {
  assert.equal(kartenZitat("Zitrus vorne"), "Zitrus vorne");
  const lang = "wort ".repeat(40).trim();
  const z = kartenZitat(lang)!;
  assert.ok(z.length <= 140);
  assert.ok(z.endsWith("…"));
  assert.ok(!z.slice(0, -1).endsWith(" "));
});

test("Zitat: Umbrüche werden Leerzeichen, leer und HWG ergeben null", () => {
  assert.equal(kartenZitat("a\r\n\r\nb"), "a b");
  assert.equal(kartenZitat(null), null);
  assert.equal(kartenZitat("   "), null);
  assert.equal(kartenZitat("hilft bei Migräne"), null);
});

test("HTML maskiert und enthält Kerndaten", () => {
  const h = igKarteHtml(r, "https://x.dev");
  assert.ok(h.startsWith("<!doctype html>"));
  assert.ok(h.includes("Apples &amp; Bananas"));
  assert.ok(h.includes("MGF &lt;Via&gt;"));
  assert.ok(!h.includes("<Via>"));
  assert.ok(h.includes("4,5"));
  assert.ok(h.includes("Zitrus") && h.includes("Süß"));
  assert.ok(h.includes("C1"));
  assert.ok(h.includes("https://x.dev/marke/pinsel.webp"));
  assert.ok(h.includes("width:1080px") && h.includes("height:1350px"));
});

test("fehlende Felder erzeugen keine Lücken", () => {
  const h = igKarteHtml({ ...r, gesamtnote: null, charge: null, vertreiber: null, notiz: null, aromen: [] }, "https://x.dev");
  assert.ok(!h.includes("null"));
  assert.ok(!h.includes("undefined"));
  assert.ok(!h.includes("Charge"));
});
```

In `tests/ig-feed.test.ts` ergänzen:

```ts
test("Feld karte ohne Schlüssel", () => {
  assert.equal(igReview(basis, ursprung)!.karte, "https://x.dev/api/ig-karte/r1");
});
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag prüfen**

Run: `npm test 2>&1 | tail -12` – Expected: FAIL (Modul `@/lib/ig-karte` fehlt, `karte` undefined).

- [ ] **Step 3: `lib/ig-feed.ts` erweitern** – Typ `IgReview` um `karte: string` nach `url`, in `igReview` nach `url:` die Zeile `karte: \`${ursprung}/api/ig-karte/${z.id}\`,` einfügen.

- [ ] **Step 4: `lib/ig-karte.ts` schreiben**

```ts
import type { GeschmacksKategorie } from "@/db/enums";
import { hwgTreffer } from "@/lib/hwg-filter";
import type { IgReview } from "@/lib/ig-feed";
import { de } from "@/lib/i18n/de";

/**
 * Instagram-Karte als eigenständiges HTML (Spec 2026-10-14 IG-Karten): Cowork öffnet sie und macht einen
 * Screenshot 1080 × 1350. Kein PNG im Worker (10 ms CPU), keine Wirkung (HWG).
 */
const ZITAT_MAX = 140;

export function kartenZitat(notiz: string | null): string | null {
  if (!notiz) return null;
  const text = notiz.replace(/\s+/g, " ").trim();
  if (!text || hwgTreffer(text)) return null;
  if (text.length <= ZITAT_MAX) return text;
  const schnitt = text.slice(0, ZITAT_MAX - 1);
  const grenze = schnitt.lastIndexOf(" ");
  return `${(grenze > 0 ? schnitt.slice(0, grenze) : schnitt).replace(/[\s,.;:–-]+$/, "")}…`;
}

function maske(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const note = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function igKarteHtml(r: IgReview, ursprung: string): string {
  const aromen = r.aromen.map((a) => de.label.geschmack[a as GeschmacksKategorie] ?? a).map(maske);
  const zitat = kartenZitat(r.notiz);
  const zeilen = [
    r.vertreiber ? `<p class="vertreiber">${maske(r.vertreiber)}</p>` : "",
    r.gesamtnote !== null ? `<p class="note"><span>${note(r.gesamtnote)}</span> von 5 Blättern</p>` : "",
    aromen.length ? `<p class="aromen">${aromen.join(" · ")}</p>` : "",
    zitat ? `<blockquote>„${maske(zitat)}“</blockquote>` : "",
    r.charge ? `<p class="charge">Charge ${maske(r.charge)}</p>` : "",
  ].join("");
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>${maske(r.bluete)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mr+Dafoe&family=Newsreader:opsz,wght@6..72,200;6..72,400;6..72,600&display=block">
<style>
html,body{margin:0;background:#0d1210}
.karte{width:1080px;height:1350px;box-sizing:border-box;padding:96px;display:flex;flex-direction:column;gap:40px;
background:radial-gradient(120% 80% at 50% 0%,#17221d 0%,#0d1210 70%);color:#e9efec;font-family:Newsreader,Georgia,serif}
.logo{width:240px;height:auto}
h1{font-weight:200;font-size:96px;line-height:1.05;margin:24px 0 0;letter-spacing:-0.01em;text-wrap:balance}
.vertreiber{font-size:36px;color:#93a39b;margin:0}
.note{font-size:40px;color:#93a39b;margin:0}
.note span{font-family:"Mr Dafoe",cursive;font-size:160px;color:#3fbf94;line-height:1;margin-right:16px}
.aromen{font-size:40px;letter-spacing:0.08em;text-transform:uppercase;margin:0}
blockquote{margin:0;padding-left:32px;border-left:4px solid #3fbf94;font-style:italic;font-size:40px;line-height:1.35}
.charge{font-size:32px;color:#93a39b;margin:0}
.fuss{margin-top:auto;font-size:28px;color:#93a39b;letter-spacing:0.08em}
</style></head><body><main class="karte">
<img class="logo" src="${ursprung}/marke/pinsel.webp" alt="Book of Terpz">
<h1>${maske(r.bluete)}</h1>${zeilen}
<p class="fuss">Bewertung im Book of Terpz · Link in Bio</p>
</main></body></html>`;
}
```

Hinweis Gestaltung: Farben sind die festen Hex-Gegenstücke der Tokens (`--color-neutral-1000`, `--color-blatt-500` dunkel), weil die Karte ohne `globals.css` läuft. Feinschliff nach ui-design-engine (8px-Raster: alle Abstände Vielfache von 8) erlaubt, Tests müssen grün bleiben.

- [ ] **Step 5: Tests grün** – Run: `npm test 2>&1 | tail -9`, Expected: `fail 0`. Dazu `npx tsc --noEmit -p .` ohne Ausgabe.

- [ ] **Step 6: Commit und Push**

```bash
git add lib/ig-karte.ts lib/ig-feed.ts tests/ig-karte.test.ts tests/ig-feed.test.ts
git commit -m "feat(ig-karte): Kartenbaustein als HTML und Feld karte im Feed"
git push origin main
```

### Task 2: Route `/api/ig-karte/[id]` und Schlüsselregel

**Skills:** edge-stack-master, test-driven-development

**Files:**
- Modify: `lib/proxy-regeln.ts` (`igFeedSchluessel`)
- Modify: `lib/query/ig-feed.ts` (neue Funktion `igReviewEinzeln`)
- Create: `app/api/ig-karte/[id]/route.ts`
- Test: `tests/proxy-regeln.test.ts`

**Interfaces:**
- Consumes: `igKarteHtml(r, ursprung)`, `igReview` aus Task 1.
- Produces: `igReviewEinzeln(id: string, ursprung: string): Promise<IgReview | null>`.

- [ ] **Step 1: Failing test** – in `tests/proxy-regeln.test.ts` nach dem IG-Feed-Test:

```ts
test("IG-Karte: Schlüssel nur auf /api/ig-karte/<id>", () => {
  assert.equal(igFeedSchluessel("/api/ig-karte/abc-1", "?key=k"), "k");
  assert.equal(igFeedSchluessel("/api/ig-karte/", "?key=k"), null);
  assert.equal(igFeedSchluessel("/api/ig-karte", "?key=k"), null);
  assert.equal(igFeedSchluessel("/api/ig-karte/a/b", "?key=k"), null);
  assert.equal(igFeedSchluessel("/ig-karte/a", "?key=k"), null);
});
```

- [ ] **Step 2: Fehlschlag prüfen** – `npm test 2>&1 | tail -9`, Expected: 1 fail.

- [ ] **Step 3: Regel erweitern** – in `lib/proxy-regeln.ts`:

```ts
/**
 * Instagram-Feed und -Karten für Cowork (Nutzer 2026-10-14): bleiben hinter dem Gate, außer die
 * Anfrage trägt ?key=. Liefert den Schlüssel zum Prüfen gegen IG_FEED_KEY, sonst null.
 * Gilt nur für genau /api/ig-feed und /api/ig-karte/<id>, nie für Seiten oder andere Routen.
 */
export function igFeedSchluessel(pfad: string, suche: string): string | null {
  if (pfad !== "/api/ig-feed" && !/^\/api\/ig-karte\/[^/]+$/.test(pfad)) return null;
  return new URLSearchParams(suche).get("key") || null;
}
```

- [ ] **Step 4: Abfrage für eine Id** – in `lib/query/ig-feed.ts` den `select`-Block aus `igReviews` in eine Konstante `REVIEW_AUSWAHL` heben (beide Funktionen nutzen sie) und die Abbildung Zeile → `igReview(...)` in eine Funktion `alsIgReview(z, ursprung)`; dann:

```ts
/** Eine freigegebene Betreiber-Review für die Instagram-Karte; sonst null. */
export async function igReviewEinzeln(id: string, ursprung: string): Promise<IgReview | null> {
  const prisma = await getPrisma();
  const z = await prisma.review.findUnique({ where: { id }, select: REVIEW_AUSWAHL });
  return z ? alsIgReview(z, ursprung) : null;
}
```

`igReviews` bleibt im Verhalten gleich (`findMany` mit `select: REVIEW_AUSWAHL`, dann `.map((z) => alsIgReview(z, ursprung)).filter(...)`).

- [ ] **Step 5: Route Handler** – `app/api/ig-karte/[id]/route.ts`:

```ts
import { igKarteHtml } from "@/lib/ig-karte";
import { igReviewEinzeln } from "@/lib/query/ig-feed";

/** Instagram-Karte als HTML für den Screenshot in Cowork (Spec 2026-10-14). Zugang nur mit ?key= (Proxy). */
export async function GET(anfrage: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ursprung = new URL(anfrage.url).origin;
  const review = await igReviewEinzeln(id, ursprung);
  if (!review) return new Response("Nicht gefunden", { status: 404 });
  return new Response(igKarteHtml(review, ursprung), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=900", "X-Robots-Tag": "noindex" },
  });
}
```

Vorher `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` lesen und prüfen, dass `params` ein Promise ist.

- [ ] **Step 6: Grün prüfen** – `npm test 2>&1 | tail -9` (`fail 0`), `npx tsc --noEmit -p .` leer.

- [ ] **Step 7: Commit und Push**

```bash
git add lib/proxy-regeln.ts lib/query/ig-feed.ts "app/api/ig-karte/[id]/route.ts" tests/proxy-regeln.test.ts
git commit -m "feat(ig-karte): Route für die Instagram-Karte mit Schlüsselzugang"
git push origin main
```

### Task 3: Live-Prüfung und Cowork-Anweisung

**Skills:** verification-before-completion, better-writing

**Files:**
- Create: `docs/instagram/cowork-anweisung.md`

- [ ] **Step 1: Deploy abwarten, live prüfen** (Browser-MCP, Schlüssel aus `.env.ig-feed`):
  - `/api/ig-feed?key=…`: jede Review hat `karte`, keine `umfragen`.
  - `<karte>?key=…` mit Fenster 1080 × 1350: Logo, Name, Note, Aromen, Zitat sichtbar, nichts abgeschnitten. Mindestens „Apples & Bananas“ (Maskierung) und eine Review ohne Charge ansehen.
  - `<karte>` ohne Schlüssel: Weiterleitung auf `/zugang`.
  - `/api/ig-karte/gibtsnicht?key=…`: 404.

- [ ] **Step 2: Anweisungstext schreiben** – `docs/instagram/cowork-anweisung.md` mit diesen Abschnitten (Prosa, ohne Geheimnisse):
  1. Zweck und Freigabepflicht: nie selbst veröffentlichen, nur Entwürfe.
  2. Quellen: Feed-URL `https://cn-medcan.w-helwich.workers.dev/api/ig-feed?key=<IG_FEED_KEY>`; Datei `gepostet.txt` im Cowork-Projekt mit einer Review-Id je Zeile.
  3. Ablauf je neue Review: Karte `<karte>?key=<IG_FEED_KEY>` im Browser öffnen, Viewport 1080 × 1350, Screenshot als PNG; Caption schreiben; Publora-Entwurf: `POST https://api.publora.com/api/v1/create-post` mit Header `x-publora-key`, Body `{"content": <caption>, "platforms": [<INSTAGRAM_PLATFORM_ID>]}` ohne `scheduledTime`; PNG über `/api/v1/get-upload-url` hochladen; `/api/v1/update-post`; Id in `gepostet.txt`; Nutzer benachrichtigen.
  4. Caption-Regeln: Deutsch, 2–4 Sätze zu Aroma, Aussehen, Charge, Note; „Link in Bio“; 5–10 Hashtags (z. B. #bookofterpz #medizinalcannabis #terpene #sortenbewertung); verboten: Wirkung, Linderung, Krankheiten, Dosierung, „hilft“, „gegen“, „bei Schmerzen/Schlaf/Angst“, Konsumaufforderung.
  5. Takt: je neue Review ein Entwurf, höchstens 2 Pflege-Posts pro Woche aus älteren Reviews; Publora-Monatsgrenze 15 prüfen.
  6. Wartung: Instagram-Verbindung in Publora vor 2026-12-13 per „Reconnect“ erneuern.
  7. Fallback: kann Cowork den Screenshot nicht hochladen, Nutzer informieren (Variante B, lokales Playwright-Skript, folgt als eigene Aufgabe).

- [ ] **Step 3: Cowork-Fähigkeit klären** – Nutzer fragen, ob Cowork Dateien hochladen kann, oder es mit ihm im ersten Cowork-Lauf testen. Ergebnis in HANDOFF.md vermerken.

- [ ] **Step 4: Commit und Push**

```bash
git add docs/instagram/cowork-anweisung.md
git commit -m "docs(instagram): Anweisung für das Cowork-Projekt"
git push origin main
```
