# Startseite neu geordnet (Plan A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Startseite zeigt Storytelling, Dein Kapitel, dann eine eigene Sektion „Bewertung“ (Overall, Terpz, Qualität als Schritte 1–3 mit Beispielblüte) und führt Katalog und „Gleiche Blüte, anderer Vertreiber“ zu einer Sektion mit einer Suche zusammen.

**Architecture:** Die drei Prüfpunkte ziehen aus `TransparentMachen` in eine neue Server-Komponente `BewertungSchritte`; die Beispielwerte rechnet eine reine Funktion aus dem neuesten Betreiber-Eintrag (bestehende, gecachte Abfrage). Der Katalog bekommt den Sorten-Explorer als zuklappbaren Teil: ohne gewählten Strain steht die Katalog-Reihe, nach einer Wahl klappt die Vertreiber-Leiste auf. Die Seite bleibt `force-static`.

**Tech Stack:** Next.js 16 App Router (siehe `node_modules/next/dist/docs/`), React 19, Tailwind v4, GSAP-Choreografien unter `components/story/bewegung/`, Tests mit `node:test` über `npx tsx --test --test-concurrency=2`.

**Spec:** `docs/superpowers/specs/2026-10-20-startseite-sotm-design.md` (Teil A)

## Global Constraints

- Seite bleibt `export const dynamic = "force-static"; export const revalidate = 86400;` — keine Sitzungsabfrage, kein neuer D1-Zugriff je Anfrage.
- Wording: „Blüte“/„Strain“, nie „Ware“ oder „Sorte“ in neuen sichtbaren Texten; „Variante“ statt „Stärke“.
- Texte immer in `lib/i18n/de.ts` und `lib/i18n/en.ts` (Typ in `lib/i18n/typen.ts` folgt aus `de`).
- Keine Noten-Rangfolge als Werbung (HWG): Beispielwerte zeigen eine Bewertung, keine Bestenliste.
- UI-Regeln aus `.claude/skills/ui-design-engine.md` (8px-Raster, Tokens, `prefers-reduced-motion`).
- Kein `next dev`/`build` lokal; Prüfung live nach Push.

## Review Focus

1. Kein Betreiber-Eintrag vorhanden: Sektion „Bewertung“ steht mit Schritten, ohne Werte, ohne Fehler.
2. Eintrag ohne Feuchtewert (`feuchtigkeitProzent` null) oder ohne Terpene: der betroffene Schritt zeigt keinen Wert statt „null“/„NaN“.
3. Ohne JavaScript: Katalog-Reihe sichtbar, Explorer zu; Suche bleibt bedienbar als Link auf `/blueten`.
4. Scroll-Choreografie: Wort-für-Wort-Aufdecken und Zeiger-Tiefe wirken weiter in der neuen Sektion (Selektoren `data-story="transparent"` angepasst).
5. 390 px Breite: neue Sektion ohne Querscroll (Prüfpunkt `w-64` passt).

---

### Task 1: Beispielwerte als reine Funktion

**Skills:** prisma-client-api (nur Lesen der Typen), better-writing

**Files:**
- Create: `lib/bewertung-beispiel.ts`
- Test: `tests/bewertung-beispiel.test.ts`

**Interfaces:**
- Consumes: `BandEintrag` aus `lib/query/buch-band.ts` (`review.aussehen|geruch|geschmack|konsistenz: number`, `review.feuchtigkeitProzent: number | null`, `produkt.terpene: KartenTerpen[]`, `produkt.bluete`, `produkt.vertreiber`).
- Produces: `export type BeispielWerte = { bluete: string; vertreiber: string | null; slug: string; overall: number; terpen: string | null; feuchte: number | null }` und `export function beispielWerte(eintrag: BandEintrag | null): BeispielWerte | null`.

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { beispielWerte } from "@/lib/bewertung-beispiel";
import type { BandEintrag } from "@/lib/query/buch-band";

function eintrag(teil: { feuchte?: number | null; terpene?: { name: string }[] } = {}): BandEintrag {
  return {
    review: { aussehen: 4, geruch: 5, geschmack: 4, konsistenz: 3, feuchtigkeitProzent: teil.feuchte === undefined ? 11 : teil.feuchte },
    produkt: { handelsname: "Remexian 30/1", bluete: "Remexian", vertreiber: "Purplefarm", slug: "remexian", bildPfad: null,
      terpene: (teil.terpene ?? [{ name: "Myrcen" }]).map((t, i) => ({ name: t.name, geschmack: "ERDIG", konzentrationProzent: 1, rang: i + 1 })) },
  } as unknown as BandEintrag;
}

test("Overall ist der Schnitt der vier Achsen, auf eine Stelle", () => {
  assert.deepEqual(beispielWerte(eintrag()), { bluete: "Remexian", vertreiber: "Purplefarm", slug: "remexian", overall: 4, terpen: "Myrcen", feuchte: 11 });
});

test("ohne Eintrag kein Beispiel", () => {
  assert.equal(beispielWerte(null), null);
});

test("fehlende Feuchte und Terpene bleiben null", () => {
  const w = beispielWerte(eintrag({ feuchte: null, terpene: [] }));
  assert.equal(w?.feuchte, null);
  assert.equal(w?.terpen, null);
});
```

- [ ] **Step 2:** `npx tsx --test --test-concurrency=2 tests/bewertung-beispiel.test.ts` — FAIL (Modul fehlt).

- [ ] **Step 3: Implementierung**

```ts
import type { BandEintrag } from "@/lib/query/buch-band";

/** Werte der Beispielblüte für die Sektion „Bewertung“ (Spec 2026-10-20, Teil A). */
export type BeispielWerte = {
  bluete: string;
  vertreiber: string | null;
  slug: string;
  /** Schnitt aus Aussehen, Geruch, Geschmack, Konsistenz, eine Nachkommastelle. */
  overall: number;
  /** Führendes Terpen laut Datenblatt; null ohne Terpene. */
  terpen: string | null;
  feuchte: number | null;
};

export function beispielWerte(eintrag: BandEintrag | null): BeispielWerte | null {
  if (!eintrag) return null;
  const { review: r, produkt: p } = eintrag;
  const overall = Math.round(((r.aussehen + r.geruch + r.geschmack + r.konsistenz) / 4) * 10) / 10;
  return { bluete: p.bluete, vertreiber: p.vertreiber, slug: p.slug, overall, terpen: p.terpene[0]?.name ?? null, feuchte: r.feuchtigkeitProzent };
}
```

- [ ] **Step 4:** Test erneut — PASS.
- [ ] **Step 5:** Commit `feat(start): Beispielwerte der Bewertung`.

---

### Task 2: Sektion „Bewertung“ aus TransparentMachen lösen

**Skills:** ui-design-engine, emil-design-eng, better-typography, better-writing, react-best-practices

**Files:**
- Create: `components/story/BewertungSchritte.tsx`
- Modify: `components/story/TransparentMachen.tsx` (PUNKTE, RINGE, Punkt, Paar, Buzz und die drei `<Paar>` heraus; nur `h2` mit Manifest-Satz bleibt)
- Modify: `components/story/bewegung/punkte.ts:35` (`[data-story="transparent"]` → `[data-story="bewertung"]`)
- Modify: `components/story/bewegung/transparent.ts` (Selektor findet Zeilen in beiden Sektionen, siehe Step 3)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (`start.bewertung`)
- Test: `tests/start-bewertung-sektion.test.ts`

**Interfaces:**
- Consumes: `beispielWerte`, `BeispielWerte` (Task 1); `ladeNeuestenBetreiberEintrag()` aus `lib/query/buch-band.ts`; `sicher` aus `lib/sicher.ts`.
- Produces: `export async function BewertungSchritte(): Promise<JSX.Element>`; Wörterbuch `start.bewertung = { titel, schritt: "Schritt {nummer}", beispiel: "Am Beispiel: {bluete}", overall: "{wert} von 5", terpz: "Führt: {terpen}", qualitaet: "{wert} % Feuchte" }`.

- [ ] **Step 1: Failing test** (Quelltext-Prüfung wie `tests/bewegung.test.ts`)

```ts
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("TransparentMachen trägt nur noch das Manifest", () => {
  const q = readFileSync("components/story/TransparentMachen.tsx", "utf8");
  assert.doesNotMatch(q, /<Paar\b|PUNKTE/);
});

test("BewertungSchritte nummeriert Overall, Terpz, Qualität 1 bis 3", () => {
  const q = readFileSync("components/story/BewertungSchritte.tsx", "utf8");
  assert.match(q, /data-story="bewertung"/);
  assert.match(q, /overall[\s\S]*terpz[\s\S]*qualitaet/);
  assert.match(q, /ladeNeuestenBetreiberEintrag/);
});

test("Texte de/en vorhanden", () => {
  for (const w of [de, en]) {
    assert.ok(w.start.bewertung.titel);
    assert.match(w.start.bewertung.schritt, /\{nummer\}/);
  }
});

test("Zeiger-Tiefe gilt der neuen Sektion", () => {
  assert.match(readFileSync("components/story/bewegung/punkte.ts", "utf8"), /data-story="bewertung"/);
});
```

- [ ] **Step 2:** Test laufen lassen — FAIL.

- [ ] **Step 3: Implementierung**
  - `BewertungSchritte.tsx`: PUNKTE, RINGE, `Punkt`, `Paar`, `Buzz` unverändert aus `TransparentMachen.tsx` herüberkopieren (dort löschen). `Punkt` bekommt Props `nummer: 1 | 2 | 3` und `wert: string | null`; über `h3` steht `t(w.start.bewertung.schritt, { nummer })` in `text-small text-text-muted`, unter dem Text, falls `wert`, ein `<p className="text-body text-text">{wert}</p>`.
  - Sektion: `<section aria-labelledby="bewertung-titel" data-story="bewertung" className="feldbuch-raster relative isolate overflow-x-clip bg-surface px-4 py-24 sm:px-8 sm:py-32">`, `h2#bewertung-titel` in `font-buch text-kapitel`, darunter bei vorhandenem Beispiel `t(texte.beispiel, { bluete: bluetenZeile(...) })` als Link `prefetch={false}` auf `/blueten/${slug}`. Die drei `<Paar>` stehen in `<div data-story="manifest">`, damit `transparent.ts` die Zeilen weiter aufdeckt (`[data-story="manifest"] [data-manifest-zeile]` findet dann beide Sektionen; `transparent.ts` nur ändern, falls es `querySelector` statt `toArray` nutzt).
  - Daten: `const beispiel = beispielWerte(await sicher(() => ladeNeuestenBetreiberEintrag(), null, "Bewertung-Beispiel"));`. Werte: overall `t(texte.overall, { wert: formatiereZahl(b.overall, 1, sprache) })`, terpz `b.terpen ? t(texte.terpz, { terpen: b.terpen }) : null`, qualitaet `b.feuchte != null ? t(texte.qualitaet, { wert: formatiereZahl(b.feuchte, 0, sprache) }) : null`.
  - `TransparentMachen`: die `z-10`-Ebene und `data-story="transparent"` bleiben (Auftakt-Pin in `auftakt.ts:222`).
  - Texte de: `titel: "So bewerten wir"`, `schritt: "Schritt {nummer}"`, `beispiel: "Am Beispiel: {bluete}"`, `overall: "{wert} von 5"`, `terpz: "Führt: {terpen}"`, `qualitaet: "{wert} % Feuchte"`; en: `"How we rate"`, `"Step {nummer}"`, `"Example: {bluete}"`, `"{wert} of 5"`, `"Leading: {terpen}"`, `"{wert} % moisture"`.

- [ ] **Step 4:** Tests + `npx tsc --noEmit` — PASS.
- [ ] **Step 5:** Commit `feat(start): eigene Sektion Bewertung mit Schritten 1 bis 3`.

---

### Task 3: Katalog und Vertreiber als eine Sektion

**Skills:** ui-design-engine, react-best-practices, better-layout, hicks-law, animate

**Files:**
- Modify: `components/story/Katalog.tsx` (Explorer einbetten)
- Modify: `components/story/SortenExplorer.tsx` (Prop `zu?: ReactNode`)
- Modify: `components/story/explorer-zustand.ts` (`explorerStart(sorten, offen = true)`; zu = `sorte: ""`)
- Delete: Einbindung von `VertreiberKapitel` in `app/[lang]/page.tsx` (Datei bleibt bis Task 4, dann löschen, falls ungenutzt)
- Test: `tests/startseite-katalog-eins.test.ts`, bestehende `tests/startseite-vertreiber.test.ts` anpassen

**Interfaces:**
- Consumes: `ladeSortenExplorer()`, `SortenExplorer`, `KAPITEL_RASTER`.
- Produces: `explorerStart(sorten, offen?: boolean)`; `SortenExplorer` Prop `zu?: ReactNode` — solange keine Sorte gewählt ist (`zustand.sorte === ""`), rendert der Explorer Suche und Pillen und darunter `zu` (die Katalog-Reihe) statt Bild und Vertreiber-Leiste.

- [ ] **Step 1: Failing tests**

```ts
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { explorerStart, explorerZustand } from "@/components/story/explorer-zustand";

const sorten = [{ slug: "a", waren: [{ vertreiberId: "v1" }] }] as never;

test("zu gestartet: keine Sorte gewählt, Wahl klappt auf", () => {
  const z = explorerStart(sorten, false);
  assert.equal(z.sorte, "");
  const auf = explorerZustand({ typ: "sorte", slug: "a", ersteWare: "v1" }, z);
  assert.equal(auf.sorte, "a");
});

test("offen bleibt Standard", () => {
  assert.equal(explorerStart(sorten).sorte, "a");
});

test("Startseite hat genau eine Sortensuche", () => {
  const seite = readFileSync("app/[lang]/page.tsx", "utf8");
  assert.doesNotMatch(seite, /<VertreiberKapitel\b/);
  assert.match(readFileSync("components/story/Katalog.tsx", "utf8"), /SortenExplorer/);
});
```

- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3: Implementierung**
  - `explorerStart(sorten, offen = true)`: bei `offen === false` `{ sorte: "", ware: null, vergleich: [], suche: "" }`.
  - `SortenExplorer`: `useReducer(..., sorten, (s) => explorerStart(s, zu === undefined))`. `const sorte = alle.find(...) ?? (zu === undefined ? sorten[0] : undefined)`. Ohne `sorte` und mit `zu`: Suche + Pillen (keine aktiv, `tabbar` = erste sichtbare) und darunter `zu`. Mit Sorte: bisherige Darstellung plus Knopf „Zurück zum Katalog“ (`texte.zurueck`), der `senden({ typ: "sorte", slug: "", ersteWare: null })` schickt. Auf- und Zuklappen mit `WeicheHoehe` (`components/ui/WeicheHoehe.tsx`), reduzierte Bewegung respektiert.
  - `Katalog.tsx`: Kopf (Titel, Text, „Ganzer Katalog“) bleibt; Einstiege-Leiste und `<Reihe />` wandern als `zu` in den Explorer: `<Suspense fallback={<KatalogSkelett …/>}><KatalogExplorer zu={<>{einstiege}<Reihe /></>} /></Suspense>`, wobei `KatalogExplorer` (lokal in `Katalog.tsx`) `ladeSortenExplorer()` per `sicher` lädt und bei leer/Fehler nur `zu` rendert. Der Kopf der Vertreiber-Sektion entfällt; Überschrift „Gleiche Blüte, anderer Vertreiber“ steht als `h3` über der aufgeklappten Leiste.
  - Text `start.vertreiber.zurueck`: de „Zurück zum Katalog“, en „Back to the catalogue“.
  - `tests/startseite-vertreiber.test.ts`: Erwartungen auf `VertreiberKapitel` in der Seite auf `Katalog` umstellen.
- [ ] **Step 4:** Alle Tests + `npx tsc --noEmit` — PASS.
- [ ] **Step 5:** Commit `feat(start): Katalog und Vertreiber in einer Sektion`.

---

### Task 4: Reihenfolge der Startseite und der Choreografien

**Skills:** ui-design-engine, serial-position-effect, improve-animations (nur lesen)

**Files:**
- Modify: `app/[lang]/page.tsx`
- Modify: `components/story/bewegung/start.ts` (Reihenfolge = Seitenreihenfolge; Bewertung nutzt `transparent`/`punkte`, keine neue Choreografie)
- Delete: `components/story/VertreiberKapitel.tsx`, falls nach Task 3 nirgends importiert (`grep -rn VertreiberKapitel app components`)
- Test: `tests/startseite-reihenfolge.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Startseite in der Reihenfolge der Spec", () => {
  const q = readFileSync("app/[lang]/page.tsx", "utf8");
  const folge = ["Auftakt", "TerpenBand", "TransparentMachen", "DeinKapitel", "BewertungSchritte", "NeuesterEintrag",
    "TerpenRegister", "AromaSektion", "Katalog", "WissenBuendeln", "GemeinsamLernen", "Empfehlungen", "Abstimmung"];
  const stellen = folge.map((n) => q.indexOf(`<${n} />`));
  assert.ok(stellen.every((s) => s >= 0), JSON.stringify(stellen));
  for (let i = 1; i < stellen.length; i++) assert.ok(stellen[i - 1] < stellen[i], folge[i]);
  assert.match(q, /dynamic = "force-static"/);
});
```

- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** `page.tsx` umstellen (Kommentar mit Datum 2026-10-20 und Spec-Verweis), `BewertungSchritte` importieren. In `start.ts` die Reihenfolge prüfen: `transparent` deckt beide Sektionen auf und steht vor `kapitel`; `register` nach `kapitel`. Bestehende Tests `tests/bewegung.test.ts`, `tests/kapitel-aufschlag.test.ts` an neue Reihenfolge anpassen, falls sie Positionen prüfen.
- [ ] **Step 4:** Volle Suite `npx tsx --test --test-concurrency=2 tests/*.test.ts` + `npx tsc --noEmit` — PASS.
- [ ] **Step 5:** Commit `feat(start): Reihenfolge nach Spec 2026-10-20`, push nach `main`.

---

### Task 5: Live-Prüfung

**Skills:** better-interface, web-design-guidelines, critique-visual-hierarchy

- [ ] Nach Deploy `/` und `/en` per Browser-MCP: Reihenfolge, Schritte 1–3 mit Beispielwerten, Katalog zu → Strain wählen → Vertreiber-Leiste klappt auf → „Zurück zum Katalog“.
- [ ] Hell und dunkel, 390 px ohne Querscroll, reduzierte Bewegung.
- [ ] Observability: CPU von `GET /` bleibt im bisherigen Rahmen (Cache-Treffer ≈ 10 ms).
- [ ] HANDOFF aktualisieren, Commit `docs: HANDOFF Plan A live`.
