# Instagram als Produktmarke – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** @bookofterpz wird mit Karussell-Vorlagen, Wochen-Reel, Redaktionsplan, Landingpage `/ig` und Profiltexten zur professionellen Markenpräsenz des Portals.

**Architecture:** Bestehende Kette bleibt (HTML-Karte → Edge/Chromium-Screenshot → Publora-Entwurf). Neu: mehrseitige Karussells (`lib/ig-karussell.ts`), Entwürfe mit mehreren Medien, Reels mit Remotion und Portal-Touren mit Playwright plus ffmpeg im eigenen Paket `video/`, eine öffentliche Seite `/ig` ohne Passwort-Gate.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers, TypeScript, `node:test` via `tsx --test`, Publora REST, Microsoft Edge headless / Chromium.

**Spec:** `docs/superpowers/specs/2026-10-15-instagram-produktmarke-design.md`

## Global Constraints

- Nie veröffentlichen, nie Termin setzen: nur Publora-Entwürfe, der Betreiber gibt frei.
- HWG: kein Sortenname als Kaufanreiz, keine Wirkung, Beschwerden, Dosierung, Preise, Apotheken, Aufforderung zu Konsum oder Bezug. Jeder Text läuft durch `hwgTreffer` und `IG_SPERRE`.
- Neue Pakete nur im eigenen Paket `video/`, nie im Worker-Bundle. Keine kostenpflichtigen Dienste (Publora Free: 15 Posts im Monat).
- Format Feed 1080 × 1350, Reel 1080 × 1920, 15 bis 30 s.
- Farben und Schriften nach `docs/brand/gruenes-buch.md`: Newsreader, Kicker in Mr Dafoe, Pinsel-Logo, 8px-Raster.
- Kein lokales `next dev/build`: pushen, live prüfen (Browser-MCP).
- Säulenfarben: transparenz `#3fbf94`, mitbestimmen `#b48cf0`, wissen `#f2d129`, portal `#c98a3e`.
- Code, Kommentare, Commits auf Deutsch wie im Bestand.

## Review Focus

1. Karussell mit Sonderzeichen oder HTML im Text → muss maskiert erscheinen, nie als Markup (Test in Task 1).
2. Sperrwort auf einer mittleren Slide statt in der Caption → ganzes Karussell abgelehnt (Test in Task 1).
3. Karussell schon in Publora vorhanden → Abbruch vor dem Anlegen, kein Doppel (Test `markenAus` mit Slide-Suffix in Task 2).
4. Reel außerhalb 15 bis 30 s oder mit Sperrwort in einer Szene → vor dem Rendern abgelehnt (Test in Task 4).
5. Besucher aus der Bio ohne Passwort → `/ig` lädt ohne Gate, alle anderen Seiten bleiben gesperrt (Test in Task 5).

## Stränge (parallel, je ein Worktree)

| Strang | Tasks | hängt ab von |
|---|---|---|
| A Karussell | 1, 2 | – |
| B Redaktion | 3 | Schnittstelle aus Task 1 (hier festgelegt), nicht vom Code |
| C Reel | 4 | – |
| D Landingpage | 5 | – |
| E Profil | 6 | Task 2 für das Anlegen der Pin-Entwürfe (Inhalte parallel) |

---

### Task 1: Karussell-Vorlagen

Skills: ui-design-engine, better-typography, better-colors, critique-visual-hierarchy, law-of-similarity, test-driven-development

**Files:**
- Create: `lib/ig-karussell.ts`
- Test: `tests/ig-karussell.test.ts`

**Interfaces:**
- Consumes: `KARTEN_STIL`, `logoHtml`, `maske`, `IG_SPERRE` aus `lib/ig-karte.ts`; `hwgTreffer` aus `lib/hwg-filter.ts`
- Produces:
  - `type IgSaeule = "transparenz" | "mitbestimmen" | "wissen" | "portal"`
  - `const SAEULEN_FARBE: Record<IgSaeule, string>`
  - `type IgSlide = { typ: "cover"; kicker: string; titel: string } | { typ: "inhalt"; titel: string; text?: string; punkte?: string[] } | { typ: "cta"; titel: string; text: string }`
  - `type IgKarussell = { saeule: IgSaeule; schluessel: string; slides: IgSlide[] }`
  - `function karussellPruefen(k: IgKarussell): string[]` (leer = in Ordnung)
  - `function igSlideHtml(k: IgKarussell, index: number, ursprung: string): string`
  - `function karussellMarke(k: IgKarussell): string` → `bot-k-<saeule>-<schluessel>`

- [ ] **Step 1: Failing Tests schreiben** (`tests/ig-karussell.test.ts`)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { igSlideHtml, karussellMarke, karussellPruefen, SAEULEN_FARBE, type IgKarussell } from "@/lib/ig-karussell";

const k: IgKarussell = {
  saeule: "wissen",
  schluessel: "terpene-lesen",
  slides: [
    { typ: "cover", kicker: "Wissen", titel: "Terpene & <Aroma>" },
    { typ: "inhalt", titel: "Was sind Terpene?", text: "Duftstoffe der Pflanze.", punkte: ["Zitrus", "Kiefer"] },
    { typ: "cta", titel: "Mehr im Buch", text: "Link in Bio" },
  ],
};

test("gültiges Karussell hat keine Fehler", () => {
  assert.deepEqual(karussellPruefen(k), []);
});

test("Struktur: Cover zuerst, CTA zuletzt, 3 bis 10 Slides", () => {
  assert.ok(karussellPruefen({ ...k, slides: k.slides.slice(1) }).some((f) => f.includes("Cover")));
  assert.ok(karussellPruefen({ ...k, slides: k.slides.slice(0, 2) }).some((f) => f.includes("CTA")));
  const elf = [k.slides[0], ...Array(9).fill(k.slides[1]), k.slides[2]];
  assert.ok(karussellPruefen({ ...k, slides: elf }).some((f) => f.includes("10")));
});

test("Sperrwort auf mittlerer Slide lehnt ab", () => {
  const boese = { ...k, slides: [k.slides[0], { typ: "inhalt" as const, titel: "Hilft beim Einschlafen" }, k.slides[2]] };
  assert.ok(karussellPruefen(boese).length > 0);
});

test("Längen: Titel höchstens 60, Text höchstens 220, Punkte höchstens 4 zu je 60", () => {
  const lang = { ...k, slides: [k.slides[0], { typ: "inhalt" as const, titel: "x".repeat(61) }, k.slides[2]] };
  assert.ok(karussellPruefen(lang).some((f) => f.includes("Titel")));
});

test("schluessel nur a-z0-9-", () => {
  assert.ok(karussellPruefen({ ...k, schluessel: "A B" }).some((f) => f.includes("schluessel")));
});

test("Slide-HTML maskiert, zeigt Seitenzahl und Säulenfarbe", () => {
  const h = igSlideHtml(k, 0, "https://x.dev");
  assert.ok(h.startsWith("<!doctype html>"));
  assert.ok(h.includes("Terpene &amp; &lt;Aroma&gt;"));
  assert.ok(h.includes("1 / 3"));
  assert.ok(h.includes(SAEULEN_FARBE.wissen));
  assert.ok(h.includes("width:1080px") && h.includes("height:1350px"));
  const mitte = igSlideHtml(k, 1, "https://x.dev");
  assert.ok(mitte.includes("<li>Zitrus</li>") && mitte.includes("2 / 3"));
  assert.ok(!mitte.includes("undefined"));
});

test("Marke", () => {
  assert.equal(karussellMarke(k), "bot-k-wissen-terpene-lesen");
});
```

- [ ] **Step 2: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/ig-karussell.test.ts`
Expected: FAIL, Modul `@/lib/ig-karussell` fehlt.

- [ ] **Step 3: Implementieren** (`lib/ig-karussell.ts`)

```ts
import { hwgTreffer } from "@/lib/hwg-filter";
import { IG_SPERRE, KARTEN_STIL, logoHtml, maske } from "@/lib/ig-karte";

/**
 * Karussell-Vorlagen für Instagram (Spec 2026-10-15 Produktmarke): Cover, Inhalt, CTA im Stil der
 * Themenkarte. Jede Säule hat eine Akzentfarbe, damit das Profilraster ruhig und wiedererkennbar wirkt.
 */
export type IgSaeule = "transparenz" | "mitbestimmen" | "wissen" | "portal";

export const SAEULEN_FARBE: Record<IgSaeule, string> = {
  transparenz: "#3fbf94",
  mitbestimmen: "#b48cf0",
  wissen: "#f2d129",
  portal: "#c98a3e",
};

export type IgSlide =
  | { typ: "cover"; kicker: string; titel: string }
  | { typ: "inhalt"; titel: string; text?: string; punkte?: string[] }
  | { typ: "cta"; titel: string; text: string };

export type IgKarussell = { saeule: IgSaeule; schluessel: string; slides: IgSlide[] };

const TITEL_MAX = 60;
const TEXT_MAX = 220;
const PUNKT_MAX = 60;

function texte(s: IgSlide): string[] {
  if (s.typ === "cover") return [s.kicker, s.titel];
  if (s.typ === "cta") return [s.titel, s.text];
  return [s.titel, s.text ?? "", ...(s.punkte ?? [])];
}

export function karussellPruefen(k: IgKarussell): string[] {
  const fehler: string[] = [];
  if (!(k.saeule in SAEULEN_FARBE)) fehler.push("saeule unbekannt");
  if (!/^[a-z0-9-]{2,40}$/.test(k.schluessel)) fehler.push("schluessel: nur a-z, 0-9 und Bindestrich, 2 bis 40 Zeichen");
  const n = k.slides.length;
  if (n < 3 || n > 10) fehler.push(`Slides: ${n} statt 3 bis 10`);
  if (k.slides[0]?.typ !== "cover") fehler.push("erste Slide muss Cover sein");
  if (k.slides[n - 1]?.typ !== "cta") fehler.push("letzte Slide muss CTA sein");
  k.slides.forEach((s, i) => {
    if (s.titel.length > TITEL_MAX) fehler.push(`Slide ${i + 1}: Titel länger als ${TITEL_MAX}`);
    if (s.typ !== "cover" && (s.text ?? "").length > TEXT_MAX) fehler.push(`Slide ${i + 1}: Text länger als ${TEXT_MAX}`);
    if (s.typ === "inhalt" && s.punkte && (s.punkte.length > 4 || s.punkte.some((p) => p.length > PUNKT_MAX)))
      fehler.push(`Slide ${i + 1}: höchstens 4 Punkte zu je ${PUNKT_MAX}`);
    const alles = texte(s).join(" ");
    const sperre = IG_SPERRE.exec(alles);
    if (hwgTreffer(alles)) fehler.push(`Slide ${i + 1}: HWG-Filter schlägt an`);
    if (sperre) fehler.push(`Slide ${i + 1}: Sperrwort ${sperre[0]}`);
  });
  return fehler;
}

export function karussellMarke(k: IgKarussell): string {
  return `bot-k-${k.saeule}-${k.schluessel}`;
}

function inhalt(s: IgSlide): string {
  if (s.typ === "cover") return `<p class="kicker">${maske(s.kicker)}</p><h1 class="gross">${maske(s.titel)}</h1>`;
  if (s.typ === "cta") return `<h1>${maske(s.titel)}</h1><p class="text">${maske(s.text)}</p><p class="cta">Link in Bio</p>`;
  const punkte = s.punkte?.length ? `<ul>${s.punkte.map((p) => `<li>${maske(p)}</li>`).join("")}</ul>` : "";
  return `<h1>${maske(s.titel)}</h1>${s.text ? `<p class="text">${maske(s.text)}</p>` : ""}${punkte}`;
}

export function igSlideHtml(k: IgKarussell, index: number, ursprung: string): string {
  const farbe = SAEULEN_FARBE[k.saeule];
  const s = k.slides[index];
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>${maske(s.titel)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mr+Dafoe&family=Newsreader:ital,opsz,wght@0,6..72,200;0,6..72,400;1,6..72,400&display=block">
<style>${KARTEN_STIL}
.karte{border-top:16px solid ${farbe}}
.kicker{font-family:"Mr Dafoe",cursive;font-size:80px;color:${farbe};margin:auto 0 0;line-height:1}
h1{font-weight:200;font-size:88px;line-height:1.05;margin:0;letter-spacing:-0.01em;text-wrap:balance}
h1.gross{font-size:120px;margin-bottom:auto}
.text{font-size:44px;line-height:1.4;margin:0;text-wrap:pretty}
ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:24px}
li{font-size:40px;padding-left:32px;border-left:4px solid ${farbe}}
.cta{font-family:"Mr Dafoe",cursive;font-size:96px;color:${farbe};margin:0}
.fuss{display:flex;justify-content:space-between}
</style></head><body><main class="karte">
${logoHtml(ursprung)}
${inhalt(s)}
<p class="fuss"><span>Book of Terpz</span><span>${index + 1} / ${k.slides.length}</span></p>
</main></body></html>`;
}
```

- [ ] **Step 4: Tests grün**

Run: `npx tsx --test tests/ig-karussell.test.ts`
Expected: PASS (7 Tests). Schlägt „Hilft beim Einschlafen“ nicht an, prüfen ob `IG_SPERRE` `hilft`/`schlaf` enthält (tut es).

- [ ] **Step 5: Optik prüfen**: `critique-visual-hierarchy` und `critique-composition` auf je eine gerenderte Slide pro Typ (aus Task 2 `--probe`, oder HTML-Datei direkt in Edge öffnen). Abweichungen vom Grünen Buch korrigieren.

- [ ] **Step 6: Commit**

```bash
git add lib/ig-karussell.ts tests/ig-karussell.test.ts
git commit -m "feat(ig): Karussell-Vorlagen Cover, Inhalt, CTA mit Säulenfarbe"
```

---

### Task 2: Karussell-Entwurf in Publora

Skills: lean-build, test-driven-development, verification-before-completion

**Files:**
- Modify: `scripts/ig-gemeinsam.ts` (Funktion `entwurf` auf mehrere Medien, `markenAus` mit Slide-Suffix)
- Create: `scripts/ig-karussell.ts`
- Test: `tests/ig-gemeinsam.test.ts` (ergänzen)

**Interfaces:**
- Consumes: alles aus Task 1
- Produces:
  - `entwurfMedien(caption: string, medien: { pfad: string; name: string; typ: "image/png" | "video/mp4" }[]): Promise<string>`
  - `entwurf(caption, png, dateiname)` bleibt als Hülle über `entwurfMedien` erhalten (bestehende Aufrufer).
  - `markenAus` liefert für `…/<ts>-bot-k-wissen-x-1.png` die Marke `bot-k-wissen-x` (Suffix `-<zahl>` bei `bot-k-` abgeschnitten) und erkennt auch `.mp4`.
  - CLI: `npx tsx scripts/ig-karussell.ts <datei.json> [--probe]`, JSON `{ "karussell": IgKarussell, "caption": string }`

- [ ] **Step 1: Failing Tests ergänzen** (`tests/ig-gemeinsam.test.ts`)

```ts
import { markenAus } from "../scripts/ig-gemeinsam";

test("markenAus: Karussell-Slides ergeben eine Marke, Videos zählen mit", () => {
  const posts = [
    { mediaUrls: ["https://c.dev/images/171-bot-k-wissen-terpene-1.png", "https://c.dev/images/171-bot-k-wissen-terpene-2.png"] },
    { mediaUrls: ["https://c.dev/videos/172-bot-reel-schema.mp4"] },
    { mediaUrls: ["https://c.dev/images/173-abc123.png"] },
  ];
  assert.deepEqual([...markenAus(posts)].sort(), ["abc123", "bot-k-wissen-terpene", "bot-reel-schema"]);
});
```

(Import-Stil an den Kopf der bestehenden Datei anpassen.)

- [ ] **Step 2:** `npx tsx --test tests/ig-gemeinsam.test.ts` → FAIL (Slides als zwei Marken, mp4 fehlt).

- [ ] **Step 3: `markenAus` anpassen**

```ts
      const name = typeof url === "string" ? /\/\d+-([^/]+)\.(png|mp4)$/i.exec(url)?.[1] : undefined;
      if (name) marken.add(name.startsWith("bot-k-") ? name.replace(/-\d+$/, "") : name);
```

- [ ] **Step 4: `entwurf` verallgemeinern**

```ts
type Medium = { pfad: string; name: string; typ: "image/png" | "video/mp4" };

/** Entwurf ohne Termin mit einem oder mehreren Medien (Karussell, Reel); Dateinamen tragen die Marke. */
export async function entwurfMedien(caption: string, medien: Medium[]): Promise<string> {
  const plattform = pflicht(umgebung(), "INSTAGRAM_PLATFORM_ID");
  const { postGroupId } = await publora<{ postGroupId: string }>("create-post", { content: caption, platforms: [plattform] });
  for (const m of medien) {
    const { uploadUrl, mediaId } = await publora<{ uploadUrl: string; mediaId: string }>("get-upload-url", {
      fileName: m.name,
      contentType: m.typ,
      type: m.typ === "video/mp4" ? "video" : "image",
      postGroupId,
    });
    const hoch = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": m.typ }, body: readFileSync(m.pfad) });
    if (!hoch.ok) throw new Error(`Upload ${m.name}: ${hoch.status}`);
    // Ohne diesen Schritt bleibt das Medium in Publora auf „uploading“ (Live 2026-10-14).
    const { mediaFile } = await publora<{ mediaFile?: { status?: string } }>(`complete-media/${mediaId}`, {});
    if (mediaFile?.status !== "ready") throw new Error(`${m.name} nicht bereit: ${mediaFile?.status ?? "unbekannt"} (Entwurf ${postGroupId})`);
  }
  return postGroupId;
}

export async function entwurf(caption: string, png: string, dateiname: string): Promise<string> {
  return entwurfMedien(caption, [{ pfad: png, name: dateiname, typ: "image/png" }]);
}
```

Hinweis: Videos meldet Publora unter Umständen erst später als `ready` (Transcoding). Liefert `complete-media` beim Live-Test in Task 4 `processing`, dort für Videos `processing` zusätzlich zulassen.

- [ ] **Step 5:** `npx tsx --test tests/ig-gemeinsam.test.ts` → PASS.

- [ ] **Step 6: CLI `scripts/ig-karussell.ts`**

```ts
/**
 * Karussell als Publora-Entwurf (Spec 2026-10-15 Produktmarke).
 *   npx tsx scripts/ig-karussell.ts /tmp/karussell.json [--probe]
 * JSON: { "karussell": IgKarussell, "caption": "…" }. Prüft Slides und Caption, fotografiert jede Slide
 * und legt einen Entwurf mit allen Bildern an. Bildnamen bot-k-<saeule>-<schluessel>-<n>.png = Marke.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { igCaptionPruefen } from "../lib/ig-caption";
import { igSlideHtml, karussellMarke, karussellPruefen, type IgKarussell } from "../lib/ig-karussell";
import { entwurfMedien, markenAus, publoraPosts, screenshot, umgebung } from "./ig-gemeinsam";

async function main() {
  const [datei, ...rest] = process.argv.slice(2);
  if (!datei) throw new Error("Pfad zur JSON-Datei fehlt");
  const { karussell, caption } = JSON.parse(readFileSync(datei, "utf8")) as { karussell: IgKarussell; caption: string };
  const fehler = [...karussellPruefen(karussell), ...igCaptionPruefen(caption)];
  if (fehler.length) throw new Error(`abgelehnt: ${fehler.join("; ")}`);

  const marke = karussellMarke(karussell);
  const ursprung = new URL(umgebung().IG_FEED_URL ?? "https://cn-medcan.w-helwich.workers.dev").origin;
  const ordner = resolve("tmp/ig");
  mkdirSync(ordner, { recursive: true });
  const medien = karussell.slides.map((_, i) => {
    const name = `${marke}-${i + 1}`;
    // Aus file:// lädt Chromium Masken fremder Herkunft nicht (CORS): Logo direkt einbetten.
    const html = ["pinsel.webp", "pinsel-of.webp"].reduce(
      (h, datei) =>
        h.replaceAll(`${ursprung}/marke/${datei}`, `data:image/webp;base64,${readFileSync(resolve("public/marke", datei)).toString("base64")}`),
      igSlideHtml(karussell, i, ursprung),
    );
    const htmlPfad = join(ordner, `${name}.html`);
    const png = join(ordner, `${name}.png`);
    writeFileSync(htmlPfad, html);
    screenshot(pathToFileURL(htmlPfad).href, png);
    return { pfad: png, name: `${name}.png`, typ: "image/png" as const };
  });
  if (rest.includes("--probe")) {
    console.log(`Probe: ${medien.map((m) => m.pfad).join(", ")}`);
    return;
  }
  if (markenAus(await publoraPosts()).has(marke)) throw new Error(`Karussell schon vorhanden: ${marke}`);
  const gruppe = await entwurfMedien(caption, medien);
  console.log(`Entwurf angelegt: ${karussell.slides[0].titel} (${medien.length} Slides, Publora ${gruppe})`);
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
```

- [ ] **Step 7: Probe**: Beispiel-JSON aus Task 3 (`docs/instagram/karussells/so-bewerten-wir.json`) oder ein eigenes nach `tmp/ig/probe.json`; `npx tsx scripts/ig-karussell.ts tmp/ig/probe.json --probe`. PNGs ansehen (Read-Tool), dann einmal ohne `--probe`: Entwurf in Publora mit allen Slides prüfen. Kann Publora nur ein Bild je Entwurf, stoppen und melden.

- [ ] **Step 8: Gesamttests** `npm test` → alles grün (bestehende Aufrufer von `entwurf` unverändert).

- [ ] **Step 9: Commit**

```bash
git add scripts/ig-gemeinsam.ts scripts/ig-karussell.ts tests/ig-gemeinsam.test.ts
git commit -m "feat(ig): Karussell-Entwurf mit mehreren Slides in Publora"
```

---

### Task 3: Redaktionsplan und Routine umstellen

Skills: better-writing, serial-position-effect, peak-end-rule, von-restorff-effect, schedule

**Files:**
- Create: `docs/instagram/redaktionsplan.md`
- Create: `docs/instagram/karussells/so-bewerten-wir.json`, `manifest.json`, `stimm-mit-ab.json` (gleichzeitig Pin-Posts aus Task 6)
- Modify: `docs/instagram/agent-anweisung.md`
- Modify: `docs/instagram/themen.md` (Kopfzeile: dient nur noch als Faktenquelle)

**Interfaces:**
- Consumes: JSON-Format aus Task 2 (`{ karussell: IgKarussell, caption }`), Marke `bot-k-<saeule>-<schluessel>`
- Produces: Redaktionsplan mit Säule je Wochentag; Agent legt Mo und Fr je ein Karussell an.

- [ ] **Step 1: `redaktionsplan.md` schreiben.** Inhalt:
  - Wochenrhythmus-Tabelle aus der Spec (Mo Wissen, Mi Reel, Fr Transparenz oder Mitbestimmen im Wechsel).
  - Dramaturgie je Karussell: Cover mit einer Frage oder Behauptung (Hook, höchstens 6 Wörter), 2 bis 5 Inhaltsslides mit je einem Gedanken, wichtigste Aussage auf Slide 2 (Serial Position), CTA zuletzt mit genau einer Handlung (Peak-End).
  - Themenliste je Säule, mindestens 8 Wochen: Wissen aus `themen.md` (Terpene, Aromarichtungen, Restfeuchte, Chargenetikett, Trichome und Aussehen, Lagerung), Transparenz (fünf Noten, Blätter statt Sterne, warum Charge, wer bewertet), Mitbestimmen (so läuft eine Runde, gesetzte vs. gewählte Plätze, warum nur verifiziert, Mitglied werden), Portal (Aroma-Karte, Buch, Zahlen aus dem Buch, Vergleich) mit je `schluessel`.
  - Caption-Regeln: erste Zeile Hook (unter 125 Zeichen, sichtbar vor „mehr“), 2 bis 4 kurze Absätze, Schluss mit Frage an die Community oder „Link in Bio“, 3 bis 5 Hashtags (`#bookofterpz #medizinalcannabis #terpene` plus 0 bis 2 thematische).
  - HWG-Block aus der Spec wörtlich.
- [ ] **Step 2: Drei Karussell-JSONs** anlegen (Manifest = Säule transparenz; So bewerten wir = transparenz; Stimm mit ab = mitbestimmen), Texte aus Fakten in `themen.md` und `docs/brand/gruenes-buch.md`, keine erfundenen Zahlen. Prüfen mit `npx tsx scripts/ig-karussell.ts docs/instagram/karussells/manifest.json --probe` (erst nach Merge von Task 2; vorher nur Struktur gegen das Interface).
- [ ] **Step 3: `agent-anweisung.md` umstellen:**
  - Schritt 1 (Bewertungen) entfernen; Hinweis: Bewertungs-Posts nur noch auf Wunsch des Betreibers, lokal per `scripts/ig-entwuerfe.ts`.
  - Lauf Mo: Säule wissen. Lauf Mi: keinen Feed-Entwurf, nur im Bericht an das Reel der Woche erinnern (Thema aus dem Redaktionsplan nennen). Lauf Fr: transparenz und mitbestimmen im Wechsel nach `veroeffentlichteThemen`.
  - Bremse: 3 oder mehr offene Entwürfe (`bot-k-` und `bot-thema-`) → nichts anlegen.
  - Anlegen per `npx --yes tsx scripts/ig-karussell.ts /tmp/karussell.json`, Beispiel-JSON im Format von Task 2, mit dem Hinweis, Texte nie aus dem Beispiel zu kopieren.
  - `scripts/ig-lage.ts`: prüfen, ob es `bot-k-` als Themen zählt; sonst Regex dort um `bot-k-` erweitern (Test in `tests/` ergänzen, falls `ig-lage` eine testbare Funktion hat).
- [ ] **Step 4: Routine** `trig_01AhFzavSK5zreuGEASsz5Ws` bleibt Mo/Mi/Fr 16:00 UTC und liest die Anweisung aus dem Repo; nur prüfen (Skill `schedule`, auflisten), nicht ändern, außer der Prompt verweist auf den Bewertungsschritt.
- [ ] **Step 5: Commit**

```bash
git add docs/instagram
git commit -m "docs(instagram): Redaktionsplan nach Säulen, Agent legt Karussells statt Bewertungen an"
```

---

### Task 4: Wochen-Reel mit Remotion und Portal-Tour mit Playwright

Skills: remotion-official, remotion, animate, emil-design-eng, apple-design, playwright-recording, ffmpeg, better-typography, test-driven-development

Installation erlaubt (Betreiber 2026-10-15). Alles Video liegt in einem **eigenen Paket `video/`** mit eigener
`package.json`, damit kein Remotion- oder Playwright-Code ins Worker-Bundle gerät. ffmpeg per `winget install Gyan.FFmpeg`,
falls nicht vorhanden. Ton: stumm rendern, Musik setzt der Betreiber in der Instagram-App aus der lizenzfreien Bibliothek
(keine kostenpflichtigen Audio-Dienste).

**Files:**
- Create: `video/package.json`, `video/tsconfig.json`, `video/remotion.config.ts`
- Create: `video/src/index.ts`, `video/src/Root.tsx`, `video/src/ErklaerReel.tsx`
- Create: `video/tour/portal-tour.ts` (Playwright-Aufnahme), `video/tour/zuschnitt.ts` (ffmpeg auf 1080 × 1920, höchstens 30 s)
- Create: `lib/ig-reel.ts` (Datentyp und Prüfung ohne Remotion, im Hauptprojekt testbar)
- Create: `scripts/ig-reel.ts` (Hochladen als Publora-Video-Entwurf)
- Create: `docs/instagram/reels/so-bewerten-wir.json` + `.txt`
- Modify: `.gitignore` (`video/node_modules`, `video/out`)
- Test: `tests/ig-reel.test.ts`

**Interfaces:**
- Consumes: `IG_SPERRE` (`lib/ig-karte.ts`), `hwgTreffer`, `SAEULEN_FARBE`/`IgSaeule` (Task 1), `entwurfMedien`/`markenAus` (Task 2)
- Produces:
  - `type IgReelSzene = { kicker?: string; titel: string; text?: string; sekunden: number }`
  - `type IgReel = { saeule: IgSaeule; schluessel: string; szenen: IgReelSzene[] }`
  - `function reelPruefen(r: IgReel): string[]` (Gesamtdauer 15 bis 30 s, 3 bis 8 Szenen, je 2 bis 6 s, HWG)
  - Remotion-Komposition `ErklaerReel` (1080 × 1920, 30 fps), Props `IgReel & { farbe: string }`
  - Render: `cd video && npx remotion render src/index.ts ErklaerReel out/bot-reel-<schluessel>.mp4 --props=../docs/instagram/reels/<schluessel>.json`
  - Tour: `cd video && npx tsx tour/portal-tour.ts <pfad> <schluessel>` → `out/bot-reel-tour-<schluessel>.mp4`
  - Upload: `npx tsx scripts/ig-reel.ts <mp4> <caption.txt>` → Publora-Video-Entwurf, Marke = Dateiname

- [ ] **Step 1: Failing Tests** (`tests/ig-reel.test.ts`)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { reelPruefen, type IgReel } from "@/lib/ig-reel";

const r: IgReel = {
  saeule: "transparenz",
  schluessel: "so-bewerten-wir",
  szenen: [
    { kicker: "So bewerten wir", titel: "Fünf Noten", sekunden: 4 },
    { titel: "Aussehen & Geruch", text: "Jede Charge gleich geprüft.", sekunden: 5 },
    { titel: "An der Charge", sekunden: 5 },
    { titel: "Link in Bio", sekunden: 4 },
  ],
};

test("gültiges Reel", () => assert.deepEqual(reelPruefen(r), []));

test("Dauer 15 bis 30 s", () => {
  assert.ok(reelPruefen({ ...r, szenen: r.szenen.slice(0, 3) }).some((f) => f.includes("Dauer")));
  assert.ok(reelPruefen({ ...r, szenen: [...r.szenen, ...r.szenen] }).some((f) => f.includes("Dauer")));
});

test("Sperrwort in Szene lehnt ab", () => {
  assert.ok(reelPruefen({ ...r, szenen: [{ titel: "Entspannt am Abend", sekunden: 4 }, ...r.szenen.slice(1)] }).length > 0);
});

test("schluessel geprüft", () => {
  assert.ok(reelPruefen({ ...r, schluessel: "Ä x" }).some((f) => f.includes("schluessel")));
});
```

- [ ] **Step 2:** `npx tsx --test tests/ig-reel.test.ts` → FAIL.

- [ ] **Step 3: `lib/ig-reel.ts`**

```ts
import { hwgTreffer } from "@/lib/hwg-filter";
import { IG_SPERRE } from "@/lib/ig-karte";
import { SAEULEN_FARBE, type IgSaeule } from "@/lib/ig-karussell";

/** Wochen-Reel (Spec 2026-10-15 Produktmarke): Daten und Prüfung; gerendert wird in video/ mit Remotion. */
export type IgReelSzene = { kicker?: string; titel: string; text?: string; sekunden: number };
export type IgReel = { saeule: IgSaeule; schluessel: string; szenen: IgReelSzene[] };

export function reelPruefen(r: IgReel): string[] {
  const fehler: string[] = [];
  if (!/^[a-z0-9-]{2,40}$/.test(r.schluessel)) fehler.push("schluessel: nur a-z, 0-9 und Bindestrich");
  if (!(r.saeule in SAEULEN_FARBE)) fehler.push("saeule unbekannt");
  if (r.szenen.length < 3 || r.szenen.length > 8) fehler.push(`Szenen: ${r.szenen.length} statt 3 bis 8`);
  const dauer = r.szenen.reduce((s, z) => s + z.sekunden, 0);
  if (dauer < 15 || dauer > 30) fehler.push(`Dauer: ${dauer} s statt 15 bis 30`);
  r.szenen.forEach((z, i) => {
    if (z.sekunden < 2 || z.sekunden > 6) fehler.push(`Szene ${i + 1}: 2 bis 6 Sekunden`);
    if (z.titel.length > 40 || (z.text ?? "").length > 120) fehler.push(`Szene ${i + 1}: zu lang`);
    const alles = [z.kicker, z.titel, z.text].filter(Boolean).join(" ");
    if (hwgTreffer(alles) || IG_SPERRE.test(alles)) fehler.push(`Szene ${i + 1}: HWG/Sperrwort`);
  });
  return fehler;
}
```

- [ ] **Step 4:** Test → PASS.

- [ ] **Step 5: Remotion-Paket anlegen.** Skill `remotion-official` laden und dessen aktuelle Projektstruktur befolgen; Versionen dort bzw. per `npm view remotion version` ermitteln und exakt pinnen (alle `@remotion/*` gleiche Version). Abhängigkeiten: `remotion`, `@remotion/cli`, `@remotion/google-fonts`, `react`, `react-dom`; dev: `playwright`, `tsx`, `typescript`. `cd video && npm install && npx playwright install chromium`.

- [ ] **Step 6: `video/src/ErklaerReel.tsx`.** Hintergrund wie die Karte (Radialverlauf `#17221d`→`#0d1210`), 16 px Säulenbalken oben, Pinsel-Logo aus `public/marke/` per `staticFile` (in `remotion.config.ts` `Config.setPublicDir("../public")`), zwei maskierte Ebenen wie `logoHtml` (Blattgrün `#3fbf94`, „of“ `#b48cf0`), Newsreader 200 und Mr Dafoe über `@remotion/google-fonts`. Je Szene eine `<Sequence>` mit `durationInFrames = sekunden * 30`; Einblenden per `spring({ fps, frame, config: { damping: 200 } })` für Opazität und 48 px Hub, Ausblenden in den letzten 12 Frames per `interpolate`. Fußzeile „Book of Terpz · Link in Bio“. Gesamtlänge per `calculateMetadata` aus den Props. Skills `animate` und `emil-design-eng`: nichts federt über, keine Rotation, kein Zoom über 1,04. Vorschau mit `npx remotion studio`.

- [ ] **Step 7: Portal-Tour** `video/tour/portal-tour.ts`: Playwright Chromium, Viewport 430 × 932, `deviceScaleFactor: 2.5`, `recordVideo` nach `out/raw`; Ablauf: Seite laden (Zugang über `IG_TOUR_PASSWORT` aus `.env.ig-feed`, solange das Gate aktiv ist), langsam scrollen (`mouse.wheel` 120 px alle 60 ms), definierte Selektoren anklicken, je 1 s stehen. Danach `zuschnitt.ts` ruft ffmpeg: `-vf "scale=1080:-2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0d1210" -t 30 -r 30 -c:v libx264 -pix_fmt yuv420p -movflags +faststart` → `out/bot-reel-tour-<schluessel>.mp4`. Skills `playwright-recording` und `ffmpeg`. Keine Bewertungsseite mit Sortennamen im Fokus (HWG): Tour zeigt Startseite, Schema, Umfragen, Aroma-Karte.

- [ ] **Step 8: `scripts/ig-reel.ts`** (Hauptprojekt):

```ts
/**
 * Reel als Publora-Video-Entwurf (Spec 2026-10-15 Produktmarke).
 *   npx tsx scripts/ig-reel.ts video/out/bot-reel-<schluessel>.mp4 docs/instagram/reels/<schluessel>.txt
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";

import { igCaptionPruefen } from "../lib/ig-caption";
import { entwurfMedien, markenAus, publoraPosts } from "./ig-gemeinsam";

async function main() {
  const [mp4, captionDatei] = process.argv.slice(2);
  if (!mp4 || !captionDatei) throw new Error("Aufruf: ig-reel.ts <mp4> <caption.txt>");
  const name = basename(mp4);
  if (!/^bot-reel-[a-z0-9-]+\.mp4$/.test(name)) throw new Error("Dateiname muss bot-reel-<schluessel>.mp4 sein");
  const caption = readFileSync(captionDatei, "utf8").trim();
  const fehler = igCaptionPruefen(caption);
  if (fehler.length) throw new Error(`Caption abgelehnt: ${fehler.join("; ")}`);
  if (markenAus(await publoraPosts()).has(name.replace(/\.mp4$/, ""))) throw new Error(`Reel schon vorhanden: ${name}`);
  const gruppe = await entwurfMedien(caption, [{ pfad: mp4, name, typ: "video/mp4" }]);
  console.log(`Reel-Entwurf angelegt (Publora ${gruppe})`);
}

main().catch((f: unknown) => {
  console.error(f instanceof Error ? f.message : f);
  process.exit(1);
});
```

- [ ] **Step 9: Erstes Reel.** `docs/instagram/reels/so-bewerten-wir.json` (Props inkl. `farbe` aus `SAEULEN_FARBE`, 4 bis 6 Szenen, 20 bis 25 s) und `.txt` (Caption). Vor dem Rendern `reelPruefen` über einen Einzeiler laufen lassen. Rendern, mit `ffprobe` prüfen (1080 × 1920, 30 fps, H.264, unter 30 s), Standbilder ansehen, hochladen, Entwurf in Publora ansehen. Meldet `complete-media` für Video `processing`, in `entwurfMedien` für `video/mp4` auch `processing` akzeptieren und Test ergänzen.

- [ ] **Step 10: Commit**

```bash
git add video/package.json video/package-lock.json video/tsconfig.json video/remotion.config.ts video/src video/tour lib/ig-reel.ts scripts/ig-reel.ts tests/ig-reel.test.ts docs/instagram/reels .gitignore
git commit -m "feat(ig): Wochen-Reel mit Remotion, Portal-Tour mit Playwright"
```

---

### Task 5: Landingpage `/ig` ohne Passwort-Gate

Skills: ui-design-engine, design-taste-frontend, frontend-design, better-layout, better-writing, better-accessibility, hicks-law, fitts-law, edge-stack-master, react-best-practices, web-design-guidelines

**Files:**
- Create: `app/[lang]/ig/page.tsx`
- Modify: `lib/proxy-regeln.ts:14` (`"/ig"` in `OHNE_GATE`)
- Test: `tests/proxy-regeln.test.ts` (ergänzen)

**Interfaces:**
- Consumes: `Seitenkopf`, `seitenRahmen` aus `components/layout/Seitenkopf`, `textLinkKlassen`, `cn`, Muster von `app/[lang]/impressum/page.tsx`
- Produces: öffentliche Seite `/ig` und `/<lang>/ig`

- [ ] **Step 1: Failing Test** in `tests/proxy-regeln.test.ts` nach dem Muster der bestehenden OHNE_GATE-Tests (Zeile 7 und 25): `/ig` und `/de/ig` gelten als ohne Gate; `/ig-irgendwas`, `/reviews` bleiben gesperrt. Exakte Funktionsnamen aus der Datei übernehmen.
- [ ] **Step 2:** `npx tsx --test tests/proxy-regeln.test.ts` → FAIL.
- [ ] **Step 3:** `"/ig"` in `OHNE_GATE` aufnehmen; Kommentar: „Landingpage aus der Instagram-Bio, muss ohne Passwort erreichbar sein (Spec 2026-10-15).“ Prüfen, dass der Präfix-Abgleich `/ig-feed` o. ä. nicht mitöffnet (Test aus Step 1).
- [ ] **Step 4:** Test → PASS.
- [ ] **Step 5: Seite bauen** (`force-static`, `revalidate = 86400`, nur Deutsch wie Impressum, `robots: index true`). Aufbau:
  - Kopf: Logo-Handschrift, Satz der Positionierung aus der Spec.
  - Drei Karten (Hick: genau drei Wege): „So bewerten wir“ (→ `/reviews`), „Abstimmen“ (→ `/umfragen`), „Mitglied werden“ (→ `/registrieren`, Hauptaktion, Von-Restorff hervorgehoben). Je Karte Säulenfarbe als linke Kante, ein Satz Nutzen.
  - Hinweis klein darunter: Inhalte nur zu Aroma, Aussehen und Qualität; keine Beratung, keine Werbung für Arzneimittel.
  - Ziele mindestens 48 px hoch (Fitts), Fokusring, Überschriftenfolge h1→h2.
  - Hinter dem Gate liegende Ziele: siehe offene Frage unten; bis zur Entscheidung führen die Karten auf die Gate-Seite `/zugang` mit dem Ziel als Parameter, falls `/zugang` das unterstützt, sonst direkt.
- [ ] **Step 6:** `npm test` grün, `npx tsc --noEmit` ohne Fehler. Pushen, live `https://cn-medcan.w-helwich.workers.dev/ig` im Browser-MCP in 390 px und 1280 px prüfen, ohne Passwort-Cookie (privates Fenster). `web-design-guidelines` und `better-accessibility` auf das Ergebnis.
- [ ] **Step 7: Commit**

```bash
git add app/[lang]/ig lib/proxy-regeln.ts tests/proxy-regeln.test.ts
git commit -m "feat(ig): Landingpage /ig für die Instagram-Bio, ohne Passwort-Gate"
```

**Offene Frage an den Betreiber (vor Step 5):** Die Seite liegt hinter einem Passwort-Gate. Wohin führen die drei Wege für IG-Besucher, solange das Gate aktiv ist?

---

### Task 6: Profil, Highlights, Pin-Posts

Skills: better-writing, critique-brand-consistency, aesthetic-usability, ui-design-engine

**Files:**
- Create: `docs/instagram/profil.md`
- Create: `lib/ig-highlight.ts` + `scripts/ig-highlights.ts` (vier Highlight-Cover 1080 × 1920 als PNG nach `tmp/ig/highlights/`)
- Test: `tests/ig-highlight.test.ts`

**Interfaces:**
- Consumes: `SAEULEN_FARBE`, `IgSaeule` (Task 1), `logoHtml`, `maske`, `KARTEN_STIL` (Bestand), `screenshot` (Bestand, Fenstergröße als neuer optionaler Parameter `groesse = "1080,1350"`), `scripts/ig-karussell.ts` (Task 2) für Pins
- Produces: `function igHighlightHtml(titel: string, saeule: IgSaeule, ursprung: string): string`

- [ ] **Step 1: `profil.md`** mit: Name-Feld („Book of Terpz | Sortenbewertung“), Bio (höchstens 150 Zeichen, drei Zeilen: Nutzen, Community-Abstimmung, CTA auf Link), Link `https://cn-medcan.w-helwich.workers.dev/ig`, Kategorie „Website“ (keine Gesundheits-Kategorie), vier Highlights mit Säule und je 3 bis 5 Story-Ideen, Pin-Reihenfolge Manifest, So bewerten wir, Stimm mit ab. Alle Texte gegen `IG_SPERRE` geprüft (kurzer Probelauf mit `igCaptionPruefen`-Logik ohne Hashtag-Regel).
- [ ] **Step 2: Failing Test** `tests/ig-highlight.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { igHighlightHtml } from "@/lib/ig-highlight";
import { SAEULEN_FARBE } from "@/lib/ig-karussell";

test("Highlight-Cover: 1080x1920, maskiert, Säulenfarbe", () => {
  const h = igHighlightHtml("FAQ & <Co>", "portal", "https://x.dev");
  assert.ok(h.includes("width:1080px") && h.includes("height:1920px"));
  assert.ok(h.includes("FAQ &amp; &lt;Co&gt;"));
  assert.ok(h.includes(SAEULEN_FARBE.portal));
});
```

- [ ] **Step 3:** FAIL prüfen, dann `lib/ig-highlight.ts` umsetzen: zentrierter Kreis (Instagram schneidet rund) mit 640 px Durchmesser in Säulenfarbe als Ring, darin Titel in Mr Dafoe 120 px; `KARTEN_STIL` übernehmen und `.karte` auf 1920 px Höhe überschreiben.

```ts
import { KARTEN_STIL, maske } from "@/lib/ig-karte";
import { SAEULEN_FARBE, type IgSaeule } from "@/lib/ig-karussell";

/** Story-Highlight-Cover (Spec 2026-10-15): Instagram zeigt nur den mittleren Kreis. */
export function igHighlightHtml(titel: string, saeule: IgSaeule, _ursprung: string): string {
  const farbe = SAEULEN_FARBE[saeule];
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${maske(titel)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mr+Dafoe&display=block">
<style>${KARTEN_STIL}
.karte{height:1920px;align-items:center;justify-content:center}
.kreis{width:640px;height:640px;border-radius:50%;border:16px solid ${farbe};display:grid;place-items:center;box-sizing:border-box}
.kreis p{font-family:"Mr Dafoe",cursive;font-size:120px;color:${farbe};margin:0;text-align:center;line-height:1}
</style></head><body><main class="karte"><div class="kreis"><p>${maske(titel)}</p></div></main></body></html>`;
}
```

- [ ] **Step 4:** PASS. `screenshot` um optionalen Parameter `groesse` erweitern (Standard `"1080,1350"`, bestehende Tests grün), `scripts/ig-highlights.ts` rendert die vier Cover (Was ist das/transparenz, So bewerten wir/transparenz, Abstimmen/mitbestimmen, FAQ/portal).
- [ ] **Step 5:** `critique-brand-consistency` auf Highlights und Bio gegen `docs/brand/gruenes-buch.md`.
- [ ] **Step 6:** Nach Merge von Task 2 und 3: die drei Pin-Karussells als Entwürfe anlegen (`scripts/ig-karussell.ts`), Bio und Highlights setzt der Betreiber in der App (Anleitung in `profil.md`).
- [ ] **Step 7: Commit**

```bash
git add docs/instagram/profil.md lib/ig-highlight.ts scripts/ig-highlights.ts scripts/ig-gemeinsam.ts tests/ig-highlight.test.ts
git commit -m "feat(ig): Profiltexte, Highlight-Cover und Pin-Posts"
```

---

## Abschluss

- [ ] `npm test` grün, `npx tsc --noEmit` sauber, Push nach `main`, `/ig` live geprüft.
- [ ] Publora: höchstens 3 offene Entwürfe zum Start (3 Pins), Reel als Entwurf; Limit 15/Monat im Blick.
- [ ] HANDOFF.md: Stand, Erfolgsmessung nach acht Wochen (Profilbesuche, Link-Klicks `/ig`, Mitgliedsanträge), Token-Ablauf Publora 2026-12-13.
