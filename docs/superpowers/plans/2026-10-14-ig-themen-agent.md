# Instagram-Themen-Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine Cloud-Routine legt dreimal pro Woche Publora-Entwürfe an: neue Bewertungen und eigene Themen-Posts mit gerenderter Karte.

**Architecture:** Reine Funktionen in `lib/` (Themenkarte, Caption-Prüfung), gemeinsame Skript-Helfer in `scripts/ig-gemeinsam.ts` (Umgebung, Browser, Publora, Marken), zwei Skripte (`ig-entwuerfe.ts`, `ig-thema.ts`), eine Agent-Anweisung im Repo und eine Claude-Code-Routine, die sie ausführt.

**Tech Stack:** TypeScript mit tsx, `node:test`, Chromium/Edge headless, Publora REST, Claude Code Routines.

**Spec:** `docs/superpowers/specs/2026-10-14-ig-themen-agent-design.md`

## Global Constraints

- Nie kostenpflichtig; Bilder nur als gerenderte HTML-Karte.
- HWG: nie Wirkung, Linderung, Krankheit, Dosierung, Konsumaufforderung; Caption-Prüfung blockiert.
- Marke = Bild-Dateiname (`<reviewId>.png`, `bot-thema-<art>-<schluessel>.png`), nie Text in der Caption.
- Nur Entwürfe, nie `scheduledTime`, nie `status: "scheduled"`.
- Keine neuen npm-Pakete. Skripte importieren nur abhängigkeitsfreie Module aus `lib/`.
- Höchstens 3 offene Themen-Entwürfe des Agents.
- Commits in Prosa mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, Push nach `main` je Aufgabe.

## Review Focus

- Caption mit Wirkwort in gebeugter Form („entspannend“, „beruhigende“): Prüfung muss anschlagen. Test in Task 1.
- Themen mit `&`, `<` oder Anführungszeichen: maskiert. Test in Task 1.
- `IG_FEED_URL` ohne `key`-Parameter: klare Fehlermeldung, kein Absturz mit undefined. Test in Task 2.
- Linux ohne `/opt/pw-browsers`: klare Fehlermeldung „kein Browser“. Test in Task 2.
- Publora-Post ohne `media`-Feld in `list-posts`: Markenleser liefert leere Liste, kein Absturz. Test in Task 2.

---

### Task 1: Themenkarte und Caption-Prüfung

**Skills:** ui-design-engine, frontend-design, better-typography, test-driven-development

**Files:**
- Create: `lib/ig-themen-karte.ts`, `tests/ig-themen-karte.test.ts`
- Modify: `lib/ig-karte.ts` (Export `IG_SPERRE`, Export `maske`, Konstante `KARTEN_STIL` und `logoHtml` teilen), `lib/ig-caption.ts` (+ `igCaptionPruefen`), `tests/ig-caption.test.ts`

**Interfaces:**
- Produces: `type IgThema = { art: "terpen" | "feature" | "mission" | "schema"; kicker: string; titel: string; text: string; punkte: string[]; farbe?: string }`, `igThemenKarteHtml(t: IgThema, ursprung: string): string`, `igCaptionPruefen(caption: string): string[]`, `IG_SPERRE: RegExp`.

- [ ] **Step 1: Failing tests**

`tests/ig-themen-karte.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { igThemenKarteHtml, type IgThema } from "@/lib/ig-themen-karte";

const t: IgThema = { art: "terpen", kicker: "Terpen im Porträt", titel: "Limonen & Co", text: "Riecht nach <Zitrusschale>.", punkte: ["Vorkommen: Zitronenschale", "Aroma: Zitrus"], farbe: "#f2d129" };

test("Themenkarte maskiert und enthält alle Teile", () => {
  const h = igThemenKarteHtml(t, "https://x.dev");
  assert.ok(h.startsWith("<!doctype html>"));
  assert.ok(h.includes("Limonen &amp; Co"));
  assert.ok(h.includes("&lt;Zitrusschale&gt;"));
  assert.ok(h.includes("Terpen im Porträt"));
  assert.ok(h.includes("Vorkommen: Zitronenschale"));
  assert.ok(h.includes("#f2d129"));
  assert.ok(h.includes("width:1080px") && h.includes("height:1350px"));
  assert.ok(h.includes("https://x.dev/marke/pinsel-of.webp"));
});

test("ohne Punkte und Farbe keine Lücken", () => {
  const h = igThemenKarteHtml({ ...t, punkte: [], farbe: undefined }, "https://x.dev");
  assert.ok(!h.includes("undefined") && !h.includes("null") && !h.includes("<ul>"));
});

test("ungültige Farbe fällt auf Blattgrün zurück", () => {
  const h = igThemenKarteHtml({ ...t, farbe: "red;}body{x" }, "https://x.dev");
  assert.ok(!h.includes("red;}"));
});
```

In `tests/ig-caption.test.ts` ergänzen (Import um `igCaptionPruefen` erweitern):

```ts
test("Caption-Prüfung: gültig ergibt leere Liste", () => {
  const c = "Limonen riecht nach frischer Zitronenschale.\n\nWelches Terpen kommt als Nächstes? Link in Bio\n\n#bookofterpz #terpene #limonen";
  assert.deepEqual(igCaptionPruefen(c), []);
});

test("Caption-Prüfung: Wirkung, auch gebeugt, und Hashtag-Zahl", () => {
  assert.ok(igCaptionPruefen("Myrcen wirkt entspannend. #a #b #c").length > 0);
  assert.ok(igCaptionPruefen("Eine beruhigende Sorte. #a #b #c").length > 0);
  assert.ok(igCaptionPruefen("Hilft gegen Stress. #a #b #c").length > 0);
  assert.ok(igCaptionPruefen("Duftet nach Kiefer. #a #b").length > 0);
  assert.ok(igCaptionPruefen("Duftet nach Kiefer. #a #b #c #d #e #f").length > 0);
  assert.ok(igCaptionPruefen(`${"x".repeat(2201)} #a #b #c`).length > 0);
});
```

- [ ] **Step 2:** `npm test 2>&1 | grep -E "^ℹ (pass|fail)"` – Expected: fail > 0.

- [ ] **Step 3: `lib/ig-karte.ts` teilen** – `IG_SPERRE` um gebeugte Formen ergänzen und exportieren:

```ts
export const IG_SPERRE = /ballert|knallt|bal+ern|\bhigh\b|stoned|breit\b|wirk|rausch|rauch|kiff|dröhn|entspann|beruhig|schlaf|schmerz|angst|\bdaily\b|dosis|dosier|\bthc\b|\bcbd\b|hilft|lindert|gegen\s+(stress|schmerz|angst|übelkeit)|stimmungs|euphor|therap|heil/i;
```

`maske` exportieren. Den `<style>`-Grundblock (html/body, `.karte`, `.logo`, `.logo i`, `.fuss`) als `export const KARTEN_STIL` und das Logo-Markup als `export function logoHtml(ursprung: string): string` herausziehen; `igKarteHtml` nutzt beide. Bestehende Tests bleiben grün.

- [ ] **Step 4: `lib/ig-themen-karte.ts`**

```ts
import { KARTEN_STIL, logoHtml, maske } from "@/lib/ig-karte";

/** Themen-Post für Instagram (Spec 2026-10-14 Themen-Agent): gleicher Stil wie die Bewertungskarte. */
export type IgThema = { art: "terpen" | "feature" | "mission" | "schema"; kicker: string; titel: string; text: string; punkte: string[]; farbe?: string };

const BLATT = "#3fbf94";

export function igThemenKarteHtml(t: IgThema, ursprung: string): string {
  const farbe = t.farbe && /^#[0-9a-f]{6}$/i.test(t.farbe) ? t.farbe : BLATT;
  const punkte = t.punkte.length ? `<ul>${t.punkte.slice(0, 4).map((p) => `<li>${maske(p)}</li>`).join("")}</ul>` : "";
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>${maske(t.titel)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mr+Dafoe&family=Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,400;1,6..72,400&display=block">
<style>${KARTEN_STIL}
.kicker{font-family:"Mr Dafoe",cursive;font-size:72px;color:${farbe};margin:24px 0 0;line-height:1}
h1{font-weight:200;font-size:104px;line-height:1.05;margin:0;letter-spacing:-0.01em;text-wrap:balance}
.text{font-size:44px;line-height:1.4;margin:0;text-wrap:pretty}
ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:16px}
li{font-size:36px;color:#93a39b;padding-left:32px;border-left:4px solid ${farbe}}
</style></head><body><main class="karte">
${logoHtml(ursprung)}
<p class="kicker">${maske(t.kicker)}</p><h1>${maske(t.titel)}</h1><p class="text">${maske(t.text)}</p>${punkte}
<p class="fuss">Book of Terpz · Link in Bio</p>
</main></body></html>`;
}
```

- [ ] **Step 5: `igCaptionPruefen`** in `lib/ig-caption.ts`:

```ts
import { IG_SPERRE, kartenZitat } from "@/lib/ig-karte";
import { hwgTreffer } from "@/lib/hwg-filter";

/** Prüft eine Instagram-Caption vor dem Entwurf; leere Liste = in Ordnung. */
export function igCaptionPruefen(caption: string): string[] {
  const fehler: string[] = [];
  const ohneTags = caption.replace(/#[\p{L}\p{N}_]+/gu, "");
  if (hwgTreffer(ohneTags)) fehler.push("HWG-Filter schlägt an");
  const treffer = IG_SPERRE.exec(ohneTags);
  if (treffer) fehler.push(`Sperrwort: ${treffer[0]}`);
  const tags = caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  if (tags.length < 3 || tags.length > 5) fehler.push(`Hashtags: ${tags.length} statt 3 bis 5`);
  if (caption.length > 2200) fehler.push("länger als 2200 Zeichen");
  return fehler;
}
```

`igCaption` (Bewertungen) auf 5 Hashtags kürzen: `GRUND_TAGS = ["#bookofterpz", "#medizinalcannabis", "#terpene"]` plus höchstens zwei Aromen; bestehenden Test anpassen (`#suess` bleibt drin, `#sortenbewertung` raus).

- [ ] **Step 6:** `npm test` grün, `npx tsc --noEmit -p .` leer.
- [ ] **Step 7:** Commit `feat(ig): Themenkarte und Caption-Prüfung`, Push.

### Task 2: Gemeinsame Skript-Helfer, cloudfähig, Themen-Skript

**Skills:** edge-stack-master, test-driven-development

**Files:**
- Create: `scripts/ig-gemeinsam.ts`, `scripts/ig-thema.ts`, `tests/ig-gemeinsam.test.ts`
- Modify: `scripts/ig-entwuerfe.ts` (nutzt Helfer)

**Interfaces:**
- Produces in `scripts/ig-gemeinsam.ts`: `feedSchluessel(env: Record<string,string|undefined>): string`, `browserPfad(plattform: NodeJS.Platform, gibts: (p: string) => boolean, liste?: (dir: string) => string[], env?: Record<string,string|undefined>): string`, `markenAus(posts: unknown[]): Set<string>`, `umgebung(): Record<string,string>`, `screenshot(url: string, ziel: string): void`, `entwurf(caption: string, png: string, dateiname: string): Promise<string>`, `publoraPosts(): Promise<unknown[]>`.

- [ ] **Step 1: Failing tests** `tests/ig-gemeinsam.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { browserPfad, feedSchluessel, markenAus } from "../scripts/ig-gemeinsam";

test("Schlüssel aus IG_FEED_KEY oder IG_FEED_URL", () => {
  assert.equal(feedSchluessel({ IG_FEED_KEY: "a" }), "a");
  assert.equal(feedSchluessel({ IG_FEED_URL: "https://x.dev/api/ig-feed?key=b" }), "b");
  assert.throws(() => feedSchluessel({ IG_FEED_URL: "https://x.dev/api/ig-feed" }), /IG_FEED_KEY/);
});

test("Browser: Umgebung, Windows-Edge, Linux-Playwright, sonst Fehler", () => {
  assert.equal(browserPfad("linux", () => true, () => [], { IG_BROWSER: "/b" }), "/b");
  const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  assert.equal(browserPfad("win32", (p) => p === edge, () => []), edge);
  assert.equal(browserPfad("linux", (p) => p.endsWith("/chrome"), () => ["chromium-1194", "ffmpeg-1011"]), "/opt/pw-browsers/chromium-1194/chrome-linux/chrome");
  assert.throws(() => browserPfad("linux", () => false, () => []), /kein Browser/);
});

test("Marken aus list-posts, auch ohne media", () => {
  const m = markenAus([{ media: [{ sourceFileName: "abc.png" }] }, { media: [{ sourceFileName: "bot-thema-terpen-limonen.png" }] }, {}, null]);
  assert.deepEqual([...m].sort(), ["abc", "bot-thema-terpen-limonen"]);
});
```

- [ ] **Step 2:** Fehlschlag prüfen.

- [ ] **Step 3: `scripts/ig-gemeinsam.ts`** schreiben: Inhalte aus `scripts/ig-entwuerfe.ts` (`envLesen`, `publora`, `entwurf`, `screenshot`) hierher verschieben und erweitern:
  - `umgebung()`: `{ ...envLesen(".env"), ...envLesen(".env.ig-feed"), ...process.env }` (Umgebung gewinnt).
  - `feedSchluessel(env)`: `env.IG_FEED_KEY` oder `new URL(env.IG_FEED_URL).searchParams.get("key")`, sonst `throw new Error("IG_FEED_KEY fehlt (auch nicht in IG_FEED_URL)")`.
  - `browserPfad(...)`: Reihenfolge `env.IG_BROWSER`; win32: Edge-Pfade (x86, dann 64 Bit); sonst `liste("/opt/pw-browsers")` nach `/^chromium-\d+$/` filtern, absteigend sortieren, `/opt/pw-browsers/<name>/chrome-linux/chrome` nehmen, wenn `gibts`; sonst `throw new Error("kein Browser gefunden (IG_BROWSER setzen)")`.
  - `screenshot(url, ziel)`: Argumente wie bisher plus `--no-sandbox` außer auf win32; `url` darf `file://` sein.
  - `entwurf(caption, png, dateiname)`: wie bisher (`create-post`, `get-upload-url` mit `fileName: dateiname`, `PUT`, `complete-media`, Status `ready` prüfen); liest Schlüssel aus `umgebung()`.
  - `publoraPosts()`: `GET https://api.publora.com/api/v1/list-posts` (Header `x-publora-key`), liefert das Array `posts` (falls fehlt: `[]`).
  - `markenAus(posts)`: alle `media[].sourceFileName` ohne `.png`, robust gegen fehlende Felder.

- [ ] **Step 4: `scripts/ig-entwuerfe.ts`** auf die Helfer umstellen: erledigt = `.ig-gepostet.txt` ∪ `markenAus(await publoraPosts())` (Publora nur abfragen, wenn nicht `--probe`); Bilddateiname bleibt `<id>.png`.

- [ ] **Step 5: `scripts/ig-thema.ts`**

```ts
/**
 * Themen-Post als Publora-Entwurf (Spec 2026-10-14 Themen-Agent).
 *   npx --yes tsx scripts/ig-thema.ts /tmp/thema.json [--probe]
 * JSON: { "schluessel": "limonen", "thema": IgThema, "caption": "…" }
 * Prüft die Caption (HWG, Sperrliste, 3–5 Hashtags), rendert die Karte lokal und legt den Entwurf an.
 * Bild heißt bot-thema-<art>-<schluessel>.png (Marke für den Agenten). Doppelte Marke = Abbruch.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { igCaptionPruefen } from "../lib/ig-caption";
import { igThemenKarteHtml, type IgThema } from "../lib/ig-themen-karte";
import { entwurf, markenAus, publoraPosts, screenshot, umgebung } from "./ig-gemeinsam";

async function main() {
  const [datei, ...rest] = process.argv.slice(2);
  if (!datei) throw new Error("Pfad zur JSON-Datei fehlt");
  const { schluessel, thema, caption } = JSON.parse(readFileSync(datei, "utf8")) as { schluessel: string; thema: IgThema; caption: string };
  if (!/^[a-z0-9-]{2,40}$/.test(schluessel)) throw new Error("schluessel nur a-z, 0-9, Bindestrich");
  const fehler = igCaptionPruefen(caption);
  if (fehler.length) throw new Error(`Caption abgelehnt: ${fehler.join("; ")}`);
  const marke = `bot-thema-${thema.art}-${schluessel}`;
  const ursprung = new URL(umgebung().IG_FEED_URL ?? "https://cn-medcan.w-helwich.workers.dev").origin;
  const ordner = resolve("tmp/ig");
  mkdirSync(ordner, { recursive: true });
  const html = join(ordner, `${marke}.html`);
  const png = join(ordner, `${marke}.png`);
  writeFileSync(html, igThemenKarteHtml(thema, ursprung));
  screenshot(pathToFileURL(html).href, png);
  if (rest.includes("--probe")) return console.log(`Probe: ${png}`);
  if (markenAus(await publoraPosts()).has(marke)) throw new Error(`Thema schon vorhanden: ${marke}`);
  const gruppe = await entwurf(caption, png, `${marke}.png`);
  console.log(`Entwurf angelegt: ${thema.titel} (Publora ${gruppe})`);
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
```

- [ ] **Step 6:** `npm test` grün, `tsc` leer. Lokal: `npx tsx scripts/ig-entwuerfe.ts --probe` (meldet „Keine neuen Bewertungen“) und eine Probe mit `/tmp`-JSON für Limonen über `ig-thema.ts --probe`; PNG ansehen.
- [ ] **Step 7:** Commit `feat(ig): gemeinsame Skript-Helfer, Cloud-Browser, Themen-Skript`, Push.

### Task 3: Themenpool, Agent-Anweisung, Routine

**Skills:** better-writing, verification-before-completion

**Files:**
- Create: `docs/instagram/themen.md`, `docs/instagram/agent-anweisung.md`
- Modify: `docs/instagram/skript.md` (Verweis), `HANDOFF.md`

- [ ] **Step 1: `docs/instagram/themen.md`**: Terpene aus `lib/terpen-aromen.ts` (Namen, Aromarichtungen) mit Vorkommen in Pflanzen; Features mit Pfad auf der Website (Bewertungsschema `/reviews`, Aroma-Karte, Chargen, Restfeuchte, Abstimmung `/umfragen`, Kommentare/Likes, Statistik); Mission; je Eintrag ein `schluessel`. Faktenquelle angeben.

- [ ] **Step 2: `docs/instagram/agent-anweisung.md`**: Ablauf aus Spec Abschnitt 5 als nummerierte Anweisung, Caption-Regeln aus dem Instagram-Skill-Bündel (Hook ≤ 125 Zeichen, Körper 2–4 kurze Absätze, Abschluss mit Frage oder „Link in Bio“, 3–5 Hashtags, kein KI-Ton: keine Gedankenstriche als Stilmittel, keine Floskeln „Tauche ein“, „Entdecke“, „In der Welt von“), HWG-Liste, Bremse (≥ 3 offene Themen-Entwürfe), Beispiel-JSON für `ig-thema.ts`, Abschlussbericht per Push-Nachricht. Kein Schreiben ins Repo.

- [ ] **Step 3:** Commit `docs(instagram): Themenpool und Agent-Anweisung`, Push.

- [ ] **Step 4: Probelauf** – einmalige Routine (Umgebung `env_01GF1VY9UqxLgGhViv5AvwNJ`, Repo `bratzi/cn-medcan`, `claude-sonnet-5-5`, Werkzeuge Bash, Read, Glob, Grep, Write) mit Prompt: „Lies docs/instagram/agent-anweisung.md und führe sie aus, aber nur mit --probe: keine Publora-Entwürfe. Berichte, welches Thema und welche Caption du gewählt hättest.“ Log lesen, Fehler beheben.

- [ ] **Step 5: Dauer-Routine** anlegen: Name „Book of Terpz Instagram-Agent“, Cron `0 16 * * 1,3,5`, Prompt: „Lies docs/instagram/agent-anweisung.md und führe sie vollständig aus.“ Link `https://claude.ai/code/routines/<id>` melden. Einmal sofort `run`, Entwurf in Publora prüfen.

- [ ] **Step 6:** HANDOFF und Memory nachziehen, Commit `docs: HANDOFF Instagram-Agent`, Push.
