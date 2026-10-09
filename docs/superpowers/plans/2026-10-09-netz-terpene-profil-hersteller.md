# Aroma-Netz mit Terpen-Schalter, Profil neu, Hersteller-Filter: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Aroma-Netz bekommt einen Schalter Geschmäcker/Terpene und eine Lesung außen an der Marke. Das Profil wird neu geordnet und bekommt Feldköpfe im Stil der Startseite. Der Katalog bekommt einen Hersteller-Filter, das Profil eine Hersteller-Rangliste.

**Architecture:**
- Die Profilwerte tragen künftig ein festes Terpen-Netz mit 10 Achsen (`terpenNetz`) statt der Terpenliste.
- Das Netz rechnet intern mit Vektoren je Modus. `NetzGrafik` nimmt beliebige Achsen.
- Drei Stränge: A (Netz) und C (Hersteller) laufen parallel in eigenen Worktrees, B (Profil) danach auf `main`.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), React 19, Prisma auf D1, Tailwind 4, Tests mit `node:test` über `npx tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-09-netz-terpene-profil-hersteller-design.md`

## Global Constraints

- Nur Aroma, nie Wirkung. Hersteller nur als Name, kein Logo, kein Link nach außen, kein Kauf- oder Apothekenhinweis (HWG).
- Kein `next dev`, `next build` oder `preview` lokal. Prüfen: `npx tsc --noEmit -p .` und `npm test`. Live-Prüfung nach dem Push (Memory `live-statt-dev`).
- Jeder sichtbare Text steht in `lib/i18n/de.ts` UND `lib/i18n/en.ts`. `en` muss dieselbe Form haben, sonst bricht `tsc`. `tests/i18n-literale.test.ts` verbietet Literale in Komponenten.
- `aromaNetzTexte` und ähnliche Funktionen, die der Server aufruft, dürfen nicht aus einer `"use client"`-Datei kommen.
- CPU-Grenze 10 ms je Anfrage. Keine neuen Abfragen je Seitenaufruf außer den hier genannten.
- UI-Regeln: `.claude/skills/ui-design-engine` (8-px-Raster, Tokens, Motion nur `transform`/`opacity`, reduzierte Bewegung).
- Keine Animation per `visibility: visible` einschalten (`tests/buch-verdeckte-seiten.test.ts`).
- Commits in Prosa, deutsch, mit Zeile `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nach jedem Strang auf `main` pushen.

## Review Focus

1. Alte `nutzer_profil`-Zeilen (Terpene als Liste, Verlauf ohne Terpene) dürfen weder Profil noch Startseite brechen. Der Terpen-Modus zeigt dann den Stand aus der Liste, ohne Zeitleiste (Test in Task A2 und A5).
2. Ein Profil ohne jede Terpenangabe zeigt keinen Schalter, nur das Geschmacksnetz (Test in Task A5).
3. Die Lesung an einer Marke am linken oder rechten Rand eines schmalen Netzes (494 px) ragt nicht aus dem Viewport. `lesungsLage` spiegelt nach innen, wenn außen zu wenig Platz ist (Test in Task A3).
4. Ein Hersteller-Parameter mit unbekannter oder kaputter Id liefert keinen Fehler, nur keine Treffer bzw. wird verworfen (Test in Task C1).
5. Hersteller ohne Namen (`hersteller: null`) tauchen in der Rangliste nicht auf. Zwei Hersteller mit gleichem Namen, aber verschiedener Id, bleiben getrennt (Test in Task C3).

---

## Strang A: Aroma-Netz (Worktree `netz-terpene`)

### Task A1: Feste Terpen-Achsen

**Files:**
- Create: `lib/terpen-achsen.ts`
- Test: `tests/terpen-achsen.test.ts`

**Interfaces:**
- Produces:
  - `TERPEN_ACHSEN: readonly { schluessel: TerpenSchluessel; name: string }[]`
  - `type TerpenSchluessel`, `type TerpenNetz = Record<TerpenSchluessel, number>`
  - `leeresTerpenNetz(): TerpenNetz`
  - `terpenSchluessel(name: string): TerpenSchluessel | null`
  - `hauptAroma(s: TerpenSchluessel): GeschmacksKategorie`
  - `terpenNetzAusVektor(profil: ReadonlyMap<string, number>): TerpenNetz`
  - `terpenNetzAusListe(liste: readonly { name: string; wert: number }[]): TerpenNetz`
  - `terpenNetzLesen(roh: unknown): TerpenNetz | null`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  TERPEN_ACHSEN, hauptAroma, leeresTerpenNetz, terpenNetzAusListe, terpenNetzAusVektor, terpenNetzLesen, terpenSchluessel,
} from "@/lib/terpen-achsen";

test("zehn feste Achsen in fester Reihenfolge, Namen wie in der Datenbank", () => {
  assert.deepEqual(TERPEN_ACHSEN.map((a) => a.name), [
    "Myrcen", "Limonen", "beta-Caryophyllen", "Linalool", "alpha-Pinen",
    "Terpinolen", "Humulen", "Ocimen", "Farnesen", "Nerolidol",
  ]);
});

test("terpenSchluessel: ohne Groß- und Kleinschreibung, Unbekanntes null", () => {
  assert.equal(terpenSchluessel(" beta-Caryophyllen "), "beta-caryophyllen");
  assert.equal(terpenSchluessel("Ester"), null);
});

test("hauptAroma: stärkster Anteil aus terpen-aromen", () => {
  assert.equal(hauptAroma("limonen"), "ZITRUS");
  assert.equal(hauptAroma("myrcen"), "ERDIG");
});

test("terpenNetzAusVektor: nur t:-Schlüssel der zehn, auf stärkstes |Gewicht| normiert", () => {
  const v = new Map([["t:Myrcen", 2], ["t:Limonen", -1], ["t:Guajol", 9], ["g:ZITRUS", 5]]);
  const n = terpenNetzAusVektor(v);
  assert.equal(n.myrcen, 1);
  assert.equal(n.limonen, -0.5);
  assert.equal(n.linalool, 0);
});

test("terpenNetzAusVektor: leerer Vektor ergibt lauter Nullen", () => {
  assert.deepEqual(terpenNetzAusVektor(new Map()), leeresTerpenNetz());
});

test("terpenNetzAusListe: alte Liste, fehlende Achsen 0, neu normiert", () => {
  const n = terpenNetzAusListe([{ name: "Linalool", wert: 0.5 }, { name: "Ester", wert: 1 }, { name: "Humulen", wert: -0.25 }]);
  assert.equal(n.linalool, 1);
  assert.equal(n.humulen, -0.5);
  assert.equal(n.myrcen, 0);
});

test("terpenNetzLesen: Objekt geprüft und geklemmt, Kaputtes null", () => {
  assert.equal(terpenNetzLesen({ myrcen: 3, quatsch: 1 })?.myrcen, 1);
  assert.equal(terpenNetzLesen("x"), null);
  assert.equal(terpenNetzLesen([1, 2]), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/terpen-achsen.test.ts`
Expected: FAIL, Modul `@/lib/terpen-achsen` fehlt.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { GeschmacksKategorie } from "@/db/enums";
import { aromaAnteile } from "@/lib/terpen-aromen";

/**
 * Die zehn Achsen des Terpen-Netzes (Spec 2026-10-09 A): für jedes Mitglied dieselben, damit Netze
 * vergleichbar bleiben und der Verlauf läuft. Namen wie in der Datenbank, Schlüssel wie in terpen-aromen.
 * Ester und Thiole sind keine Terpene und fehlen bewusst.
 */
export const TERPEN_ACHSEN = [
  { schluessel: "myrcen", name: "Myrcen" },
  { schluessel: "limonen", name: "Limonen" },
  { schluessel: "beta-caryophyllen", name: "beta-Caryophyllen" },
  { schluessel: "linalool", name: "Linalool" },
  { schluessel: "alpha-pinen", name: "alpha-Pinen" },
  { schluessel: "terpinolen", name: "Terpinolen" },
  { schluessel: "humulen", name: "Humulen" },
  { schluessel: "ocimen", name: "Ocimen" },
  { schluessel: "farnesen", name: "Farnesen" },
  { schluessel: "nerolidol", name: "Nerolidol" },
] as const;

export type TerpenSchluessel = (typeof TERPEN_ACHSEN)[number]["schluessel"];
export type TerpenNetz = Record<TerpenSchluessel, number>;

const SCHLUESSEL = new Set<string>(TERPEN_ACHSEN.map((a) => a.schluessel));
const zwei = (x: number) => Math.round(x * 100) / 100 + 0;

export function leeresTerpenNetz(): TerpenNetz {
  return Object.fromEntries(TERPEN_ACHSEN.map((a) => [a.schluessel, 0])) as TerpenNetz;
}

export function terpenSchluessel(name: string): TerpenSchluessel | null {
  const k = name.trim().toLowerCase();
  return SCHLUESSEL.has(k) ? (k as TerpenSchluessel) : null;
}

/** Stärkstes Aroma eines Terpens: Farbe seiner Marke und seines Blütenkeils. */
export function hauptAroma(s: TerpenSchluessel): GeschmacksKategorie {
  const anteile = aromaAnteile({ name: s, geschmack: "ERDIG" });
  return [...anteile].sort((a, b) => b.anteil - a.anteil)[0].geschmack;
}

function normiert(roh: TerpenNetz): TerpenNetz {
  const max = Math.max(0, ...Object.values(roh).map(Math.abs));
  const aus = leeresTerpenNetz();
  if (max > 0) for (const a of TERPEN_ACHSEN) aus[a.schluessel] = zwei(roh[a.schluessel] / max);
  return aus;
}

/** Aus dem Profilvektor (`t:<Name>`), wie geschmackAusVektor für die Geschmacksachsen. */
export function terpenNetzAusVektor(profil: ReadonlyMap<string, number>): TerpenNetz {
  const roh = leeresTerpenNetz();
  for (const [k, x] of profil) {
    if (!k.startsWith("t:")) continue;
    const s = terpenSchluessel(k.slice(2));
    if (s) roh[s] += x;
  }
  return normiert(roh);
}

/** Alte Form in `nutzer_profil.terpene` (Liste, bis 8 positiv und 3 negativ). */
export function terpenNetzAusListe(liste: readonly { name: string; wert: number }[]): TerpenNetz {
  const roh = leeresTerpenNetz();
  for (const e of liste) {
    const s = terpenSchluessel(e.name);
    if (s && Number.isFinite(e.wert)) roh[s] = e.wert;
  }
  return normiert(roh);
}

/** Gespeichertes Objekt prüfen; Unbekanntes fällt weg, Werte auf −1..1 geklemmt. */
export function terpenNetzLesen(roh: unknown): TerpenNetz | null {
  if (!roh || typeof roh !== "object" || Array.isArray(roh)) return null;
  const aus = leeresTerpenNetz();
  for (const [k, v] of Object.entries(roh)) {
    const s = terpenSchluessel(k);
    if (s && typeof v === "number" && Number.isFinite(v)) aus[s] = Math.max(-1, Math.min(1, v));
  }
  return aus;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/terpen-achsen.test.ts`
Expected: PASS (7 Tests).

- [ ] **Step 5: Commit**

```bash
git add lib/terpen-achsen.ts tests/terpen-achsen.test.ts
git commit -m "feat: zehn feste Terpen-Achsen fuer das Aroma-Netz"
```

### Task A2: Profilwerte und Verlauf tragen das Terpen-Netz

**Files:**
- Modify: `lib/profil-typen.ts` (ProfilWerte, VerlaufSchritt)
- Modify: `lib/profil.ts` (profilAnzeige, profilDaten, profilAusDaten, leereProfilWerte; TERPENE_POSITIV/NEGATIV entfallen)
- Modify: `lib/empfehlung.ts:188-199` (geschmacksBeitraege nimmt auch `t:`)
- Modify: `lib/profil-verlauf.ts` (Schritt mit `terpene`, Lesen)
- Modify: alle Tests, die `terpene:` als Liste in ProfilWerte bauen: `tests/kapitel-start-abfrage.test.ts`, `tests/live-netz.test.ts`, `tests/profil-bausteine.test.ts`, `tests/profil-verlauf-ui.test.ts`, `tests/profil-verlauf.test.ts`, `tests/profil.test.ts`, `tests/kapitel-aufschlag.test.ts`
- Test: `tests/profil-terpen-netz.test.ts`

**Interfaces:**
- Consumes: A1 (`TerpenNetz`, `terpenNetzAusVektor`, `terpenNetzAusListe`, `terpenNetzLesen`, `leeresTerpenNetz`)
- Produces:
  - `ProfilWerte = { geschmack; terpenNetz: TerpenNetz; anzahl; gewichtet }` (Feld `terpene` entfällt)
  - `VerlaufSchritt = { anzahl; datum; geschmack; terpene?: TerpenNetz }`
  - `nutzer_profil.terpene` speichert `JSON.stringify(terpenNetz)` (Objekt). `profilAusDaten` liest Objekt oder alte Liste.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { profilAusDaten, profilDaten, leereProfilWerte } from "@/lib/profil";
import { profilVerlauf, verlaufAusDaten, verlaufDaten } from "@/lib/profil-verlauf";

test("Speichern und Lesen: Terpen-Netz als Objekt", () => {
  const w = { ...leereProfilWerte(), terpenNetz: { ...leereProfilWerte().terpenNetz, linalool: 1, myrcen: -0.5 }, anzahl: 2, gewichtet: 2 };
  const z = profilDaten(w);
  assert.deepEqual(profilAusDaten(z).terpenNetz, w.terpenNetz);
});

test("Alte Zeile mit Liste: Netz aus der Liste (Review Focus 1)", () => {
  const z = { geschmack: "{}", terpene: JSON.stringify([{ name: "Limonen", wert: 0.5 }, { name: "Humulen", wert: -0.5 }]), anzahl: 3, gewichtet: 3 };
  const n = profilAusDaten(z).terpenNetz;
  assert.equal(n.limonen, 1);
  assert.equal(n.humulen, -1);
});

test("Kaputtes JSON: leeres Terpen-Netz, kein Fehler", () => {
  const n = profilAusDaten({ geschmack: "x", terpene: "{kaputt", anzahl: 0, gewichtet: 0 }).terpenNetz;
  assert.ok(Object.values(n).every((x) => x === 0));
});

test("Verlauf: Schritt trägt terpene, alter Schritt ohne bleibt lesbar", () => {
  const alt = verlaufAusDaten(JSON.stringify([{ anzahl: 1, datum: "2026-10-01T00:00:00.000Z", geschmack: { ZITRUS: 1 } }]));
  assert.equal(alt[0].terpene, undefined);
  const neu = verlaufAusDaten(JSON.stringify([{ anzahl: 1, datum: "2026-10-01T00:00:00.000Z", geschmack: {}, terpene: { linalool: 1 } }]));
  assert.equal(neu[0].terpene?.linalool, 1);
  assert.equal(verlaufAusDaten(verlaufDaten(neu))[0].terpene?.linalool, 1);
});
```

Dazu in `tests/profil-verlauf.test.ts` einen Fall ergänzen, der `profilVerlauf` mit einer Sorte mit Terpen „Linalool“ und Note 5 rechnet und `schritte.at(-1)?.terpene?.linalool === 1` prüft. Baue die Eingabe wie die bestehenden Fälle dieser Datei.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/profil-terpen-netz.test.ts tests/profil-verlauf.test.ts`
Expected: FAIL (`terpenNetz` undefined).

- [ ] **Step 3: Implement**

`lib/profil-typen.ts`:
```ts
import type { TerpenNetz } from "@/lib/terpen-achsen";
export type ProfilWerte = {
  geschmack: Record<GeschmacksKategorie, number>;
  /** Zehn feste Terpen-Achsen (lib/terpen-achsen), −1..1 auf das stärkste |Gewicht| normiert. */
  terpenNetz: TerpenNetz;
  anzahl: number;
  gewichtet: number;
};
export type VerlaufSchritt = { anzahl: number; datum: string; geschmack: Geschmack; terpene?: TerpenNetz };
```

`lib/profil.ts`: `leereProfilWerte` gibt `terpenNetz: leeresTerpenNetz()`. `profilAnzeige` ersetzt den Block mit `terpenWerte` und `positiv`/`negativ` durch `terpenNetz: terpenNetzAusVektor(profil)`. `TERPENE_POSITIV`/`TERPENE_NEGATIV` löschen. `profilDaten`: `terpene: JSON.stringify(w.terpenNetz)`. `profilAusDaten`:
```ts
const t = json(z.terpene);
const terpenNetz = Array.isArray(t)
  ? terpenNetzAusListe(t.filter((x): x is { name: string; wert: number } => !!x && typeof x.name === "string" && typeof x.wert === "number"))
  : (terpenNetzLesen(t) ?? leeresTerpenNetz());
return { geschmack, terpenNetz, anzahl: z.anzahl, gewichtet: z.gewichtet };
```

`lib/empfehlung.ts` `geschmacksBeitraege`: Bedingung zu `if (k.startsWith("g:") || k.startsWith("t:")) aus.set(k, gewicht * x);`. Kommentar darüber auf „`g:`- und `t:`-Schlüssel“ ändern. `lib/live-netz.ts` liest nur Geschmack über `geschmackAusVektor` (ignoriert `t:`): mit `npx tsx --test tests/live-netz.test.ts` bestätigen.

`lib/profil-verlauf.ts`: im Schritt `terpene: terpenNetzAusVektor(summe)` ergänzen. In `verlaufAusDaten` nach dem Geschmack:
```ts
const tn = terpenNetzLesen((s as Record<string, unknown>).terpene);
aus.push(tn ? { anzahl, datum, geschmack: g, terpene: tn } : { anzahl, datum, geschmack: g });
```

Bestehende Tests: jedes `terpene: [...]` in ProfilWerte-Literalen durch `terpenNetz: leereProfilWerte().terpenNetz` (oder passende Werte) ersetzen. Fälle, die die Rangliste prüfen (`profil.test.ts`, Positiv/Negativ-Grenzen), werden zu Prüfungen auf `terpenNetz`.

`app/[lang]/profil/page.tsx` und `app/[lang]/profil/[kurzId]/page.tsx` nutzen `werte.terpene` noch für `TerpenRangliste`. In dieser Task übergangsweise beide Stellen entfernen (Feld „Terpene“ zeigt bis Task A5 nichts, siehe dort). Konkret: in `ReiheNetz` das zweite `Feld id="terpene"` löschen und das Netz-Feld auf `spalten={10}` setzen. In `[kurzId]` die Zeile `<TerpenRangliste … />` löschen. Imports nachziehen. `components/profil/TerpenRangliste.tsx` löschen, Texte `terpeneTitel` und `terpeneEherNicht` in `de.ts` und `en.ts` löschen, wenn `grep -rn "terpeneTitel\|terpeneEherNicht" app components lib` danach leer ist.

- [ ] **Step 4: Run tests**

Run: `npx tsc --noEmit -p .` and `npm test`
Expected: tsc ohne Ausgabe, alle Tests grün.

- [ ] **Step 5: Commit**

```bash
git add -A lib app components tests
git commit -m "feat: Profilwerte und Verlauf tragen ein festes Terpen-Netz statt der Terpenliste"
```

### Task A3: Netz-Vektoren und Lage der Lesung

**Files:**
- Create: `lib/netz-vektor.ts`
- Test: `tests/netz-vektor.test.ts`

**Interfaces:**
- Consumes: A1, `GESCHMACKS_ACHSEN` aus `@/lib/query/bewertung`, `NETZ_MAX = 5`
- Produces:
  - `type NetzModus = "geschmack" | "terpene"`
  - `geschmackVektor(g: Geschmack): number[]` (Reihenfolge `GESCHMACKS_ACHSEN`)
  - `terpenVektor(t: TerpenNetz): number[]` (Reihenfolge `TERPEN_ACHSEN`)
  - `zwischenVektor(a: readonly number[], b: readonly number[], t: number): number[]`
  - `netzAusVektor(v: readonly number[]): { mag: number[]; magNicht: number[] }` (0..5)
  - `vektorAenderung(vorher, nachher, hoechstens = 2): { index: number; differenz: number }[]` (Schwelle 0,05 wie `netz-aenderung`)
  - `type LesungsLage = { seite: "links" | "rechts" | "oben" | "unten" }`
  - `lesungsLage(index: number, anzahl: number, platz?: { links: number; rechts: number }): LesungsLage`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { lesungsLage, netzAusVektor, vektorAenderung, zwischenVektor } from "@/lib/netz-vektor";

test("zwischenVektor: Anfang, Ende, Mitte", () => {
  assert.deepEqual(zwischenVektor([0, 1], [1, 0], 0), [0, 1]);
  assert.deepEqual(zwischenVektor([0, 1], [1, 0], 1), [1, 0]);
  assert.deepEqual(zwischenVektor([0, 1], [1, 0], 0.5), [0.5, 0.5]);
});

test("netzAusVektor: positiv in mag, negativ in magNicht, Skala 5", () => {
  assert.deepEqual(netzAusVektor([1, -0.5, 0]), { mag: [5, 0, 0], magNicht: [0, 2.5, 0] });
});

test("vektorAenderung: größte zuerst, unter 0,05 nicht", () => {
  assert.deepEqual(vektorAenderung([0, 0, 0], [0.5, -0.2, 0.01]), [{ index: 0, differenz: 0.5 }, { index: 1, differenz: -0.2 }]);
});

test("lesungsLage: erste Achse oben, rechte Hälfte rechts, linke links, gegenüber unten (10 Achsen)", () => {
  assert.equal(lesungsLage(0, 10).seite, "oben");
  assert.equal(lesungsLage(2, 10).seite, "rechts");
  assert.equal(lesungsLage(5, 10).seite, "unten");
  assert.equal(lesungsLage(8, 10).seite, "links");
});

test("lesungsLage: zu wenig Platz außen spiegelt nach innen (Review Focus 3)", () => {
  assert.equal(lesungsLage(2, 10, { links: 400, rechts: 40 }).seite, "links");
  assert.equal(lesungsLage(8, 10, { links: 40, rechts: 400 }).seite, "rechts");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/netz-vektor.test.ts`
Expected: FAIL, Modul fehlt.

- [ ] **Step 3: Write minimal implementation**

```ts
import { NETZ_MAX } from "@/lib/netz-skala";
import type { Geschmack } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";
import { TERPEN_ACHSEN, type TerpenNetz } from "@/lib/terpen-achsen";

/** Ansicht des Aroma-Netzes (Spec 2026-10-09 A). */
export type NetzModus = "geschmack" | "terpene";

const zwei = (x: number) => Math.round(x * 100) / 100 + 0;
/** Wie lib/netz-aenderung: kleine Schwankungen zählen nicht. */
const SCHWELLE = 0.05;
/** Mindestbreite der Lesung in px; weniger Platz außen spiegelt sie nach innen. */
export const LESUNG_BREITE = 176;

export function geschmackVektor(g: Geschmack): number[] {
  return GESCHMACKS_ACHSEN.map((a) => g[a.enumWert] ?? 0);
}

export function terpenVektor(t: TerpenNetz): number[] {
  return TERPEN_ACHSEN.map((a) => t[a.schluessel] ?? 0);
}

export function zwischenVektor(a: readonly number[], b: readonly number[], t: number): number[] {
  return a.map((x, i) => x + ((b[i] ?? 0) - x) * t);
}

export function netzAusVektor(v: readonly number[]): { mag: number[]; magNicht: number[] } {
  return { mag: v.map((x) => Math.max(0, x) * NETZ_MAX), magNicht: v.map((x) => Math.max(0, -x) * NETZ_MAX) };
}

export function vektorAenderung(vorher: readonly number[], nachher: readonly number[], hoechstens = 2) {
  return nachher
    .map((x, index) => ({ index, differenz: zwei(x - (vorher[index] ?? 0)) }))
    .filter((a) => Math.abs(a.differenz) >= SCHWELLE)
    .sort((a, b) => Math.abs(b.differenz) - Math.abs(a.differenz) || a.index - b.index)
    .slice(0, hoechstens);
}

export type LesungsLage = { seite: "links" | "rechts" | "oben" | "unten" };

/**
 * Wohin die Lesung an Achse `index` aufgeht (Nutzer 2026-10-09: nach außen, nicht in die Mitte).
 * Achse 0 zeigt nach oben, die weiteren im Uhrzeigersinn wie lib/netz.ts. `platz` ist der freie Raum
 * links und rechts der Marke im Viewport; reicht er außen nicht, geht die Lesung nach innen.
 */
export function lesungsLage(index: number, anzahl: number, platz?: { links: number; rechts: number }): LesungsLage {
  const winkel = ((index / anzahl) * 360) % 360;
  let seite: LesungsLage["seite"] =
    winkel < 20 || winkel > 340 ? "oben" : Math.abs(winkel - 180) < 20 ? "unten" : winkel < 180 ? "rechts" : "links";
  if (platz && seite === "rechts" && platz.rechts < LESUNG_BREITE) seite = "links";
  else if (platz && seite === "links" && platz.links < LESUNG_BREITE) seite = "rechts";
  return { seite };
}
```

`NETZ_MAX` liegt heute in `components/profil/NetzGrafik.tsx`. Verschiebe es nach `lib/netz-skala.ts` (`export const NETZ_MAX = 5;`). `NetzGrafik` importiert es von dort und exportiert es weiter (`export { NETZ_MAX } from "@/lib/netz-skala";`), damit bestehende Importe gültig bleiben.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/netz-vektor.test.ts`
Expected: PASS (5 Tests).

- [ ] **Step 5: Commit**

```bash
git add lib/netz-vektor.ts lib/netz-skala.ts components/profil/NetzGrafik.tsx tests/netz-vektor.test.ts
git commit -m "feat: Netz-Vektoren und Lage der Lesung aussen an der Marke"
```

### Task A4: NetzGrafik mit beliebigen Achsen

**Files:**
- Modify: `components/profil/NetzGrafik.tsx`
- Modify: `lib/aroma-farben.ts` (neue `farbKreis`)
- Test: `tests/netz-grafik-achsen.test.ts`

**Interfaces:**
- Consumes: A1 (`TERPEN_ACHSEN`, `hauptAroma`)
- Produces:
  - `type NetzAchse = { key: string; farbe: string; icon: React.ReactNode }`
  - `geschmacksAchsen(): NetzAchse[]`, `terpenAchsen(): NetzAchse[]` (beide in `NetzGrafik.tsx`, ohne `"use client"`)
  - `NetzGrafik` Prop `achsen?: readonly NetzAchse[]` (Standard: `geschmacksAchsen()`). Länge von `mag`/`magNicht` = Länge von `achsen`.
  - `farbKreis(farben: readonly string[]): string`. `bluetenKreis(achsen)` ruft `farbKreis(achsen.map(vollFarbe))`.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { NetzGrafik, terpenAchsen } from "@/components/profil/NetzGrafik";
import { bluetenKreis, farbKreis, vollFarbe } from "@/lib/aroma-farben";

test("farbKreis: gleiche Ausgabe wie bluetenKreis für Geschmäcker", () => {
  assert.equal(bluetenKreis(["ZITRUS", "ERDIG"]), farbKreis([vollFarbe("ZITRUS"), vollFarbe("ERDIG")]));
});

test("NetzGrafik mit Terpen-Achsen: zehn Marken, Farbe aus dem Hauptaroma", () => {
  const html = renderToStaticMarkup(
    createElement(NetzGrafik, { mag: Array(10).fill(2), magNicht: Array(10).fill(0), marken: true, achsen: terpenAchsen() }),
  );
  assert.equal((html.match(/netz-marke /g) ?? []).length, 10);
  assert.match(html, new RegExp(`--netz-farbe:${vollFarbe("ZITRUS").replace(/[()]/g, "\\$&")}`));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/netz-grafik-achsen.test.ts`
Expected: FAIL (`terpenAchsen` und `farbKreis` fehlen).

- [ ] **Step 3: Implement**

`lib/aroma-farben.ts`:
```ts
/** Farbkreis aus beliebigen Farben, erste oben, im Uhrzeigersinn (Blüte des Netzes). */
export function farbKreis(farben: readonly string[]): string {
  if (farben.length === 0) return "transparent";
  const schritt = 360 / farben.length;
  const stufen = farben.map((farbe, index) => `${farbe} ${Math.round(schritt * index * 10) / 10}deg`);
  return `conic-gradient(from 0deg at 50% 50%, ${stufen.join(", ")}, ${farben[0]} 360deg)`;
}

export function bluetenKreis(achsen: readonly GeschmacksKategorie[]): string {
  return farbKreis(achsen.map(vollFarbe));
}
```

`components/profil/NetzGrafik.tsx`:
- `import { GeschmackIcon, TerpenIcon } from "@/components/review/AromaIcon";`, `import { farbKreis, vollFarbe } from "@/lib/aroma-farben";`, `import { TERPEN_ACHSEN, hauptAroma } from "@/lib/terpen-achsen";`
- Neu:
```ts
export type NetzAchse = { key: string; farbe: string; icon: React.ReactNode };

export function geschmacksAchsen(): NetzAchse[] {
  return GESCHMACKS_ACHSEN.map((a) => ({ key: a.key, farbe: vollFarbe(a.enumWert), icon: <GeschmackIcon geschmack={a.enumWert} className="size-5" /> }));
}

export function terpenAchsen(): NetzAchse[] {
  return TERPEN_ACHSEN.map((a) => ({ key: a.schluessel, farbe: vollFarbe(hauptAroma(a.schluessel)), icon: <TerpenIcon name={a.schluessel} className="size-5" /> }));
}
```
- `gleichmaessig(wert, radius, anzahl)` nimmt die Achsenzahl (`Array.from({ length: anzahl }, () => wert)`).
- In der Komponente: `const liste = achsen ?? geschmacksAchsen();`, `const bluete = farbKreis(liste.map((a) => a.farbe));`. Alle Stellen mit `GESCHMACKS_ACHSEN[i].key` werden `liste[i].key`. Alle `vollFarbe(GESCHMACKS_ACHSEN[i].enumWert)` werden `liste[i].farbe`. Das Icon in `netz-marke-kreis` wird `liste[i].icon`.
- Die Konstante `BLUETE` entfällt.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/netz-grafik-achsen.test.ts tests/mini-netz.test.ts tests/profil-verlauf-ui.test.ts`
Expected: PASS. Bestehende Netz-Tests unverändert grün.

- [ ] **Step 5: Commit**

```bash
git add lib/aroma-farben.ts components/profil/NetzGrafik.tsx tests/netz-grafik-achsen.test.ts
git commit -m "feat: NetzGrafik zeichnet beliebige Achsen, Terpen-Achsen mit Farbe des Hauptaromas"
```

### Task A5: AromaNetz mit Schalter und Lesung außen

**Files:**
- Modify: `components/profil/AromaNetz.tsx`
- Modify: `components/profil/ProfilNetz.tsx`
- Modify: `lib/aroma-netz-texte.ts` (neue Schlüssel in `AromaNetzTexte`)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (Abschnitte `profil` und `profilOeffentlich`)
- Modify: `app/globals.css` (Klasse `.netz-lesung` für die Lage)
- Test: `tests/aroma-netz-schalter.test.ts`

**Interfaces:**
- Consumes: A1 bis A4 (`NetzModus`, `geschmackVektor`, `terpenVektor`, `zwischenVektor`, `netzAusVektor`, `vektorAenderung`, `lesungsLage`, `geschmacksAchsen`, `terpenAchsen`, `TERPEN_ACHSEN`, `terpenAnzeige`)
- Produces:
  - `NetzStand = { geschmack: Geschmack; terpene?: TerpenNetz; datum?: string; anzahl?: number }`
  - `AromaNetz` Props unverändert plus implizit: Schalter nur, wenn der letzte Stand `terpene` mit einem Wert ≠ 0 hat.
  - Neue Texte (in `profil` und `profilOeffentlich`, beide mit denselben Werten): `modusGeschmack: "Geschmäcker"`, `modusTerpene: "Terpene"`, `modusWahl: "Netz zeigt"`, `terpenSkala: "Terpene, gemessen an deinem stärksten"` (en: `"Flavours"`, `"Terpenes"`, `"Net shows"`, `"Terpenes, measured against your strongest"`). `netzTexte()` in `lib/profil-oeffentlich.ts` übernimmt die öffentlichen Fassungen. `aromaNetzTexte` und `AromaNetzTexte` nehmen die vier Schlüssel auf.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { de } from "@/lib/i18n/de";
import { profilNetzTexte } from "@/lib/aroma-netz-texte";
import { leereProfilWerte } from "@/lib/profil";

const basis = leereProfilWerte();
const zeige = (terpenNetz = basis.terpenNetz) =>
  renderToStaticMarkup(
    createElement(ProfilNetz, {
      werte: { ...basis, geschmack: { ...basis.geschmack, ZITRUS: 1 }, terpenNetz, anzahl: 4, gewichtet: 4 },
      texte: profilNetzTexte(de.profil),
      achsen: de.label.geschmack,
      sprache: "de",
    }),
  );

test("Schalter Geschmäcker | Terpene nur mit Terpenwerten (Review Focus 2)", () => {
  assert.doesNotMatch(zeige(), /role="radiogroup"/);
  const html = zeige({ ...basis.terpenNetz, linalool: 1 });
  assert.match(html, /role="radiogroup"/);
  assert.match(html, new RegExp(de.profil.modusGeschmack));
  assert.match(html, new RegExp(de.profil.modusTerpene));
});

test("Lesung nicht mehr mittig im Netz", async () => {
  const { readFileSync } = await import("node:fs");
  const quelle = readFileSync("components/profil/AromaNetz.tsx", "utf8");
  assert.doesNotMatch(quelle, /netz-lesung[^"]*top-1\/2 left-1\/2/);
  assert.match(quelle, /lesungsLage\(/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/aroma-netz-schalter.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`ProfilNetz.tsx`: Stände tragen die Terpene mit.
```ts
const staende: NetzStand[] =
  verlauf.length >= 2
    ? verlauf.map((s) => ({ geschmack: s.geschmack, terpene: s.terpene, datum: s.datum, anzahl: s.anzahl }))
    : [{ geschmack: werte.geschmack, terpene: werte.terpenNetz }];
```
Den letzten Stand immer mit `werte.terpenNetz` überschreiben, falls sein `terpene` fehlt (alter Verlauf): `staende[staende.length - 1] = { ...staende.at(-1)!, terpene: staende.at(-1)!.terpene ?? werte.terpenNetz };`

`AromaNetz.tsx`, Kernänderungen:
1. Zustand `const [modus, setModus] = useState<NetzModus>("geschmack");`
2. `const hatTerpene = Object.values(staende[letzter].terpene ?? {}).some((x) => x !== 0);`
3. Im Terpen-Modus gilt die Zeitleiste nur, wenn jeder Stand `terpene` hat: `const terpenVerlauf = staende.every((s) => s.terpene);`. Sonst arbeitet der Terpen-Modus mit `[staende[letzter]]`. Dafür `const reihe = modus === "terpene" && !terpenVerlauf ? [staende[letzter]] : staende;`. Alle bisherigen Zugriffe auf `staende` laufen über `reihe`. Beim Moduswechsel `setIndex(reihe.length - 1)`.
4. Vektor je Stand: `const vektor = (s: NetzStand) => (modus === "terpene" ? terpenVektor(s.terpene ?? leeresTerpenNetz()) : geschmackVektor(s.geschmack));`
5. Der Morph-Effekt arbeitet auf `number[]` statt `Geschmack`: `ziel = vektor(reihe[i])` als `useMemo` über `[modus, i, reihe]` mit Schlüssel `ziel.join(",")`, Interpolation mit `zwischenVektor`. Ein Moduswechsel ist damit ein Morph vom gezeigten Vektor zum neuen.
6. `const achsen = modus === "terpene" ? terpenAchsen() : geschmacksAchsen();` an `NetzGrafik` (`achsen={achsen}`).
7. Namen der Achsen: `const namen = modus === "terpene" ? TERPEN_ACHSEN.map((a) => terpenAnzeige(a.name, sprache)) : GESCHMACKS_ACHSEN.map((a) => achsenTexte[a.enumWert]);`. Die Prop `achsen` (Geschmacksnamen) heißt intern `achsenTexte`. Daraus `beschreibung` (srMag/srMagNicht/srNeutral mit `achse: namen[n]`) und die Lesung.
8. Änderungssatz: `vektorAenderung(vektor(reihe[i-1]), vektor(reihe[i]))`, Liste `liste.map((a) => t(a.differenz > 0 ? texte.staerker : texte.schwaecher, { achse: namen[a.index] })).join(", ")`.
9. Skalensatz: `{modus === "terpene" ? texte.terpenSkala : texte.netzSkala}. {texte.netzHinweis}`.
10. Schalter über dem Netz, nur bei `hatTerpene`. Gebaut wie der Ansichtsschalter in `components/review/AromaKarte.tsx` (Suche dort nach `naechsteAnsicht` und `role="radiogroup"`). Zwei `role="radio"`-Knöpfe, `aria-checked`, Roving-Tabindex, Pfeiltasten über `naechsteAnsicht` (aus `AromaKarte` importieren; liegt sie in einer `"use client"`-Datei, vorher nach `lib/ansicht-taste.ts` verschieben und in `AromaKarte` von dort importieren). Beschriftung `aria-label={texte.modusWahl}`. Optik: dieselben Klassen wie der Schalter „Karte | Netz“.
11. Lesung außen. Die Marke liegt bei `orte[aktiv]` (Prozentlage wie in `NetzGrafik`). Exportiere aus `NetzGrafik.tsx` `markenLage(index: number, anzahl: number): { x: number; y: number }` in Prozent (0..100), aus derselben Rechnung wie `orte`. Platz im Viewport beim Aktivieren messen: `const r = rahmen.current?.getBoundingClientRect();` und `platz = { links: r.left + (x / 100) * r.width, rechts: innerWidth - (r.left + (x / 100) * r.width) }`. Dann `const lage = lesungsLage(aktiv, achsen.length, platz);`. Die Lesung:
```tsx
<div
  aria-hidden="true"
  data-seite={lage.seite}
  className="netz-lesung pointer-events-none absolute z-20 grid w-44 justify-items-start gap-1 rounded-lg border bg-surface-raised/95 p-3 text-start shadow-md backdrop-blur-sm"
  style={{ left: `${x}%`, top: `${y}%`, borderColor: achsen[aktiv].farbe }}
>
  <span className="flex items-center gap-2">{achsen[aktiv].icon}<span className="font-buch text-h3 leading-tight text-text">{lesung.name}</span></span>
  {lesung.wert ? <span className="text-caption text-text-muted text-balance">{lesung.wert}</span> : null}
</div>
```
CSS in `app/globals.css` (Abstand 28 px = halbe Marke 22 px + 6 px Luft):
```css
.netz-lesung[data-seite="rechts"] { transform: translate(28px, -50%); }
.netz-lesung[data-seite="links"] { transform: translate(calc(-100% - 28px), -50%); }
.netz-lesung[data-seite="oben"] { transform: translate(-50%, calc(-100% - 28px)); }
.netz-lesung[data-seite="unten"] { transform: translate(-50%, 28px); }
```
Der Rahmen des Netzes (`relative`-Div um `NetzGrafik`) bekommt `overflow-visible`. Die Lesung darf über Nachbarn ragen, darum `z-20`. Die Felder im Profil dürfen sie nicht abschneiden: `Feld` hat kein `overflow-hidden`, das so lassen.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/aroma-netz-schalter.test.ts tests/profil-verlauf-ui.test.ts tests/kapitel-aufschlag.test.ts` then `npx tsc --noEmit -p .` and `npm test`
Expected: alle grün.

- [ ] **Step 5: Commit, push**

```bash
git add -A components lib app tests
git commit -m "feat: Aroma-Netz mit Schalter Geschmaecker/Terpene und Lesung aussen an der Marke"
```
Den Strang auf `main` mergen und pushen (siehe Abschluss).

### Task A6: Netze überall gleich

**Files:**
- Modify (nur falls nötig): `lib/query/kapitel-start.ts`, `app/api/startseite/route.ts`, `app/[lang]/profil/[kurzId]/page.tsx`
- Test: `tests/kapitel-start-abfrage.test.ts` (Fall ergänzen)

**Interfaces:**
- Consumes: A2 (`ProfilWerte.terpenNetz`), A5 (`ProfilNetz`)

- [ ] **Step 1: Write the failing test**

In `tests/kapitel-start-abfrage.test.ts` einen Fall ergänzen: das Ergebnis der Kapitel-Abfrage (wie die vorhandenen Fälle gebaut) trägt `netz.terpenNetz`, wenn das gespeicherte Profil Terpene hat. Assertion: `assert.equal(kapitel.netz?.terpenNetz.linalool, 1)`.

- [ ] **Step 2: Run test**

Run: `npx tsx --test tests/kapitel-start-abfrage.test.ts`
Expected: PASS, wenn das Profil unverändert durchgereicht wird. FAIL nur, wenn eine Stelle Felder einzeln kopiert. Dann diese Stelle auf das ganze `ProfilWerte` umstellen.

- [ ] **Step 3: Öffentliches Profil prüfen**

`app/[lang]/profil/[kurzId]/page.tsx` nutzt `ProfilNetz` mit `netz`-Texten aus `netzTexte(w)`. Diese tragen nach A5 die Modus-Texte. `npx tsc --noEmit -p .` muss grün sein.

- [ ] **Step 4: Commit**

```bash
git add -A lib app tests
git commit -m "test: Kapitel und oeffentliches Profil reichen das Terpen-Netz durch"
```

---

## Strang C: Hersteller (Worktree `hersteller`, parallel zu A)

### Task C1: Filter-Parameter und Abfrage

**Files:**
- Modify: `lib/query/filter.ts` (Schema, `LEERER_FILTER`, `serialisiereFilter`, `istFilterLeer`)
- Modify: `lib/query/strains.ts` (Bedingung, Facette `hersteller`)
- Test: `tests/filter-hersteller.test.ts`

**Interfaces:**
- Produces:
  - `StrainFilter.hersteller: string[]` (Unternehmen-Ids, Kleinbuchstaben, Muster wie `slugListe`)
  - `FilterFacetten.hersteller: { id: string; name: string; anzahl: number }[]` (nur Hersteller aktiver Sorten, nach Name)

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { istFilterLeer, parseStrainFilter, serialisiereFilter } from "@/lib/query/filter";

const id = "4a5761be-5783-43ea-8223-a9e58cc75af8";

test("hersteller: Liste aus Komma und Mehrfachwert, doppelt einmal", () => {
  const f = parseStrainFilter({ hersteller: [`${id},${id}`, "abc-1"] });
  assert.deepEqual(f.hersteller, [id, "abc-1"]);
  assert.equal(serialisiereFilter(f).get("hersteller"), `${id},abc-1`);
  assert.equal(istFilterLeer(f), false);
});

test("hersteller: Kaputtes fällt weg, kein Fehler (Review Focus 4)", () => {
  const f = parseStrainFilter({ hersteller: "<script>,,  " });
  assert.deepEqual(f.hersteller, []);
  assert.equal(istFilterLeer(f), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/filter-hersteller.test.ts`
Expected: FAIL (`hersteller` undefined).

- [ ] **Step 3: Implement**

`filter.ts`: im Schema `hersteller: slugListe,`, in `LEERER_FILTER` `hersteller: [],`, in `serialisiereFilter` nach `apotheke`:
```ts
if (filter.hersteller.length > 0) params.set("hersteller", filter.hersteller.join(","));
```
In `istFilterLeer` `&& filter.hersteller.length === 0`.

`strains.ts`, nach dem Geschmacksfilter:
```ts
if (filter.hersteller.length > 0) bedingungen.herstellerId = { in: filter.hersteller };
```
Facette: in `ladeFilterFacetten` eine weitere Abfrage im `Promise.all`:
```ts
prisma.strain.groupBy({ by: ["herstellerId"], where: { aktiv: true, herstellerId: { not: null } }, _count: { _all: true } }),
```
dann die Namen in einer zweiten Abfrage: `prisma.unternehmen.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })`. Daraus `hersteller` (nach Name sortiert, `localeCompare(…, "de")`). Den Kommentar über der Funktion auf die neue Zahl der Abfragen anpassen. Im Typ `FilterFacetten` `hersteller: { id: string; name: string; anzahl: number }[];` ergänzen.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/filter-hersteller.test.ts` and `npx tsc --noEmit -p .`
Expected: PASS. tsc meldet ggf. Stellen, die `FilterFacetten` vollständig bauen (Tests, Platzhalter): dort `hersteller: []` ergänzen.

- [ ] **Step 5: Commit**

```bash
git add lib/query/filter.ts lib/query/strains.ts tests
git commit -m "feat: Katalogfilter nach Hersteller, Facette mit Sortenzahl"
```

### Task C2: Hersteller im Filterpanel und als Chip

**Files:**
- Modify: `components/produkt/FilterLeiste.tsx`
- Modify: `components/produkt/AktiveFilter.tsx`
- Modify: `app/[lang]/blueten/page.tsx` (Namen der Hersteller an `AktiveFilter`, wie `apothekenNamen`)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (Katalogtexte: `hersteller: "Hersteller"`, `herstellerSuche: "Hersteller suchen"`, `herstellerEntfernen: "Hersteller {name} entfernen"`; en: `"Manufacturer"`, `"Search manufacturers"`, `"Remove manufacturer {name}"`)
- Test: `tests/filter-hersteller-ui.test.ts`

**Interfaces:**
- Consumes: C1 (`StrainFilter.hersteller`, `FilterFacetten.hersteller`)
- Produces: `AktiveFilter` Prop `herstellerNamen?: ReadonlyMap<string, string>`

- [ ] **Step 1: Write the failing test**

Rendere `AktiveFilter` mit `filter = { ...leererFilter(), hersteller: [id] }` und `herstellerNamen = new Map([[id, "Aurora"]])` per `renderToStaticMarkup`. Assertion: Chip mit „Aurora“, Entfernen-Link ohne `hersteller=` im `href`. Baue das wie die vorhandenen `AktiveFilter`-Tests (`grep -rln "AktiveFilter" tests`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/filter-hersteller-ui.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- `AktiveFilter`: Chips für `filter.hersteller` genau wie für `filter.apotheke` (Muster dort kopieren, Name aus `herstellerNamen`, sonst die Id).
- `FilterLeiste`: neuer Abschnitt „Hersteller“ nach „Apotheke“, gebaut wie der Apotheken-Abschnitt (Checkbox-Liste, `name="hersteller"`). Davor ein Suchfeld (`type="search"`, `aria-label={texte.herstellerSuche}`), das die Liste im Browser per Teilstring filtert. Je Eintrag die Sortenzahl in `text-text-muted numeric`. Ist die Leiste eine Server-Komponente, kommt die Suche in eine kleine Client-Insel `components/produkt/HerstellerAuswahl.tsx`.
- `blueten/page.tsx`: `herstellerNamen={new Map(facetten.hersteller.map((h) => [h.id, h.name]))}`.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/filter-hersteller-ui.test.ts tests/i18n-literale.test.ts` and `npx tsc --noEmit -p .`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add -A components app lib tests
git commit -m "feat: Hersteller im Filterpanel mit Suche und als entfernbarer Chip"
```

### Task C3: Hersteller-Rangliste im Profil

**Files:**
- Modify: `lib/lieblingshersteller.ts` (neue `herstellerRangliste`)
- Modify: `lib/query/lieblingshersteller.ts` (Id mitlesen, Rangliste liefern)
- Modify: `lib/profil-typen.ts` (`HerstellerRang`)
- Modify: `components/profil/Lieblingshersteller.tsx` (Liste mit Blättern und Link)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (`herstellerTitel: "Deine Hersteller"`, `herstellerLeer: "Sobald du eine Blüte mit Hersteller bewertet hast, steht er hier."`, `herstellerZeile: "{name}: im Schnitt {note} von 5 aus {anzahl}"`; en entsprechend)
- Modify: `app/[lang]/profil/page.tsx` (nur der Typ der Daten ändert sich, Prop-Name `daten` bleibt)
- Test: `tests/hersteller-rangliste.test.ts`

**Interfaces:**
- Produces:
  - `type HerstellerRang = { id: string; name: string; mittel: number; anzahl: number }`
  - `herstellerRangliste(zeilen: readonly { herstellerId: string | null; hersteller: string | null; note: number }[], hoechstens = 5): HerstellerRang[]`
  - `ladeLieblingshersteller(mitgliedId): Promise<HerstellerRang[]>` (Name bleibt, Rückgabe ist jetzt die Liste; leer statt null)

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { herstellerRangliste } from "@/lib/lieblingshersteller";

test("Rangliste: Mittel absteigend, Gleichstand mehr Bewertungen zuerst, höchstens 5", () => {
  const z = [
    { herstellerId: "a", hersteller: "Aurora", note: 4 },
    { herstellerId: "b", hersteller: "Bedrocan", note: 4 },
    { herstellerId: "b", hersteller: "Bedrocan", note: 4 },
    { herstellerId: "c", hersteller: "Cannamedical", note: 5 },
  ];
  assert.deepEqual(herstellerRangliste(z).map((r) => r.id), ["c", "b", "a"]);
  assert.equal(herstellerRangliste(z)[1].anzahl, 2);
});

test("Ohne Hersteller fällt weg; gleicher Name, andere Id bleibt getrennt (Review Focus 5)", () => {
  const z = [
    { herstellerId: null, hersteller: null, note: 5 },
    { herstellerId: "x", hersteller: "Gleich", note: 3 },
    { herstellerId: "y", hersteller: "Gleich", note: 4 },
  ];
  assert.deepEqual(herstellerRangliste(z).map((r) => r.id), ["y", "x"]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/hersteller-rangliste.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/lieblingshersteller.ts`:
```ts
/** Alle Hersteller mit eigener Bewertung, bestes Mittel zuerst (Spec 2026-10-09 C). Privat, keine Werbung (HWG). */
export function herstellerRangliste(
  zeilen: readonly { herstellerId: string | null; hersteller: string | null; note: number }[],
  hoechstens = 5,
): HerstellerRang[] {
  const je = new Map<string, { name: string; summe: number; anzahl: number }>();
  for (const z of zeilen) {
    if (!z.herstellerId || !z.hersteller) continue;
    const e = je.get(z.herstellerId) ?? { name: z.hersteller, summe: 0, anzahl: 0 };
    e.summe += z.note;
    e.anzahl += 1;
    je.set(z.herstellerId, e);
  }
  return [...je]
    .map(([id, e]) => ({ id, name: e.name, mittel: Math.round((e.summe / e.anzahl) * 10) / 10, anzahl: e.anzahl }))
    .sort((a, b) => b.mittel - a.mittel || b.anzahl - a.anzahl || a.name.localeCompare(b.name, "de"))
    .slice(0, hoechstens);
}
```
Die alte Funktion `lieblingshersteller` löschen, wenn `grep -rn "lieblingshersteller(" lib app components tests` keinen anderen Aufrufer zeigt. Alte Tests auf `herstellerRangliste` umschreiben.

Query: `strain: { select: { hersteller: { select: { id: true, name: true } } } }` und
```ts
return herstellerRangliste(zeilen.map((z) => ({ herstellerId: z.strain.hersteller?.id ?? null, hersteller: z.strain.hersteller?.name ?? null, note: noteOderErsatz(z) })));
```

Komponente (`daten: HerstellerRang[] | undefined`):
```tsx
if (daten === undefined) return <p className="max-w-[68ch] text-body text-text text-pretty">{texte.herstellerFehler}</p>;
if (daten.length === 0) return <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.herstellerLeer}</p>;
return (
  <ol className="flex flex-col gap-4">
    {daten.map((h) => (
      <li key={h.id} className="flex flex-col gap-1">
        <Link prefetch={false} href={`/blueten?hersteller=${h.id}`} className={namenLinkKlassen()}>
          {h.name}
        </Link>
        <span className="flex items-center gap-3">
          <BlattAnzeige note={h.mittel} text={t(texte.herstellerZeile, { name: h.name, note: formatiereZahl(h.mittel, 1, sprache), anzahl: h.anzahl })} />
          <span className="font-hand text-notiz text-logo numeric">{h.anzahl}×</span>
        </span>
      </li>
    ))}
  </ol>
);
```
`herstellerSatz` entfällt, wenn nicht mehr genutzt.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/hersteller-rangliste.test.ts` and `npx tsc --noEmit -p .` and `npm test`
Expected: grün.

- [ ] **Step 5: Commit, push**

```bash
git add -A lib components app tests
git commit -m "feat: Rangliste deiner Hersteller im Profil, verlinkt auf den gefilterten Katalog"
```
Strang C auf `main` mergen und pushen.

---

## Strang B: Profil neu ordnen (auf `main`, nach A und C)

### Task B1: Feldköpfe im Stil der Startseite

**Files:**
- Create: `components/kapitel/FeldKopf.tsx`
- Modify: `components/kapitel/Feld.tsx` (Breite 5, Prop `kopf`)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (Abschnitt `profil.koepfe`)
- Test: `tests/feld-kopf.test.ts`

**Interfaces:**
- Produces:
  - `type FeldKopfTexte = { vor: string; betont: string; nach?: string; schlagwort: string }`
  - `Feld` Prop `kopf?: FeldKopfTexte`. Mit `kopf` ersetzt `FeldKopf` die `h2`, `titel` bleibt für `aria` und Fallback.
  - `FeldSpalten` = `3 | 4 | 5 | 6 | 10`, `FELD_SPALTEN[5] = "min-[1080px]:col-span-5"`
  - `profil.koepfe`: `aktivitaet`, `netz`, `topFlop`, `noten`, `hersteller`, `schnitte`, `community`, `register`, `vorschlaege`, jeweils `FeldKopfTexte`.

de-Texte:
```ts
koepfe: {
  aktivitaet: { vor: "Deine", betont: "Spur", schlagwort: "seit dem ersten blatt" },
  netz: { vor: "Deine", betont: "Aromen", schlagwort: "was dir schmeckt" },
  topFlop: { vor: "Top und", betont: "Flop", schlagwort: "ganz oben, ganz unten" },
  noten: { vor: "Deine", betont: "Noten", schlagwort: "wie streng du bist" },
  hersteller: { vor: "Deine", betont: "Hersteller", schlagwort: "wer liefert" },
  schnitte: { vor: "Deine", betont: "Schnitte", schlagwort: "im mittel" },
  community: { vor: "Du und die", betont: "Community", schlagwort: "zweite stimme" },
  register: { vor: "Deine", betont: "Bewertungen", schlagwort: "dein buch" },
  vorschlaege: { vor: "Ähnlich im", betont: "Aroma", nach: "wie deine Favoriten", schlagwort: "probier mal" },
},
```
en-Texte sinngleich: `{ vor: "Your", betont: "Trail", schlagwort: "since the first leaf" }` usw., `vorschlaege: { vor: "Similar in", betont: "aroma", nach: "to your favourites", schlagwort: "try this" }`.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Feld } from "@/components/kapitel/Feld";

test("Feld mit Kopf: Buchschrift, betontes Wort in Handschrift, Schlagwort, mittig", () => {
  const html = renderToStaticMarkup(
    createElement(Feld, { id: "netz", titel: "Deine Aromen", spalten: 10, kopf: { vor: "Deine", betont: "Aromen", schlagwort: "was dir schmeckt" } }),
  );
  assert.match(html, /<h2[^>]*id="netz-titel"[^>]*font-buch[^>]*text-center/);
  assert.match(html, /<em class="farbverlauf hand-betont">Aromen<\/em>/);
  assert.match(html, /aria-hidden="true"[^>]*font-hand[^>]*>was dir schmeckt/);
});

test("Breite 5 vorhanden", async () => {
  const { FELD_SPALTEN } = await import("@/components/kapitel/Feld");
  assert.equal(FELD_SPALTEN[5], "min-[1080px]:col-span-5");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/feld-kopf.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`components/kapitel/FeldKopf.tsx`:
```tsx
import { Schlagwort } from "@/components/story/Schlagwort";

export type FeldKopfTexte = { vor: string; betont: string; nach?: string; schlagwort: string };

/**
 * Kopf eines Profilfelds wie die Sektionsköpfe der Startseite (Nutzer 2026-10-09: mehr Akzentschrift,
 * Güte der Startseite): Buchschrift mittig, ein Wort in Handschrift mit Farbverlauf, dahinter blass das
 * Schlagwort. Das Feld braucht `relative isolate overflow-x-clip`.
 */
export function FeldKopf({ id, texte, ton = "gruen" }: { id: string; texte: FeldKopfTexte; ton?: "gruen" | "lila" }) {
  return (
    <>
      <Schlagwort satz={texte.schlagwort} ton={ton} oben="top-2" />
      <h2 id={id} className="font-buch text-h2 text-text text-center text-balance">
        {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em>
        {texte.nach ? ` ${texte.nach}` : null}
      </h2>
    </>
  );
}
```
Prüfe vorher in `app/globals.css`, ob es `text-h2` gibt (`grep -n "\-\-text-h2" app/globals.css`). Gibt es keinen, nimm `text-h3` mit `min-[1080px]:text-h2` nur dann, wenn `text-h2` existiert, sonst `text-h3`.

`Feld.tsx`: `FeldSpalten` um 5 erweitern, `FELD_SPALTEN[5]` ergänzen, Prop `kopf?: FeldKopfTexte` und `ton?`. Mit `kopf`: Section-Klasse zusätzlich `relative isolate overflow-x-clip`. Statt `<h2>` dann `<FeldKopf id={`${id}-titel`} texte={kopf} ton={ton} />`. Der `satz` steht mittig (`text-center mx-auto`).

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/feld-kopf.test.ts tests/i18n-literale.test.ts` and `npx tsc --noEmit -p .`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add -A components lib tests
git commit -m "feat: Feldkoepfe im Profil wie die Sektionskoepfe der Startseite"
```

### Task B2: Profil in neuer Reihenfolge

**Files:**
- Modify: `app/[lang]/profil/page.tsx`
- Test: `tests/profil-reihenfolge.test.ts`

**Interfaces:**
- Consumes: A (Netz-Feld ohne Terpene), C3 (`Lieblingshersteller` mit Liste), B1 (`kopf`, Breite 5)

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quelle = readFileSync("app/[lang]/profil/page.tsx", "utf8");
const lage = (id: string) => {
  const i = quelle.indexOf(`id="${id}"`);
  assert.ok(i >= 0, `Feld ${id} fehlt`);
  return i;
};

test("Profil: Aktivität, Netz, Top/Flop, Noten+Hersteller, Schnitte+Community, Bewertungen, Ähnlich (Nutzer 2026-10-09)", () => {
  const reihe = ["aktivitaet", "netz", "topflop", "verteilung", "hersteller", "schnitte", "community", "bewertungen", "vorschlaege"].map(lage);
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
});

test("Kein Feld Terpene mehr, jedes Feld mit Kopf", () => {
  assert.doesNotMatch(quelle, /id="terpene"/);
  const felder = quelle.match(/<Feld\b[^>]*>/g) ?? [];
  assert.ok(felder.length >= 9);
  for (const f of felder) assert.match(f, /kopf=/, f);
});

test("Noten und Hersteller, Schnitte und Community je halbe Breite", () => {
  for (const id of ["verteilung", "hersteller", "schnitte", "community"]) {
    assert.match(quelle, new RegExp(`id="${id}"[^>]*spalten=\\{5\\}`));
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/profil-reihenfolge.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

Neue Reihenfolge der `Suspense`-Blöcke in `ProfilPage` nach `Notizen`:
1. `ReiheAktivitaet` (aus `ReiheAuswertung` herausgelöst: nur das Feld `aktivitaet`, `spalten={10}`, `kopf={texte.koepfe.aktivitaet}`; bei `zeilen === null` das Fehlerfeld wie heute)
2. `ReiheNetz` (Feld `netz`, `spalten={10}`, `kopf={texte.koepfe.netz}`)
3. `ReiheAuswertung`, ohne Aktivität: `topflop` (10), dann `verteilung` (5) + `hersteller` (5), dann `schnitte` (5) + `community` (5). Ohne Schnitte (keine Bewertung) rendert sie nichts.
4. `ReiheRegister` (`kopf={texte.koepfe.register}`)
5. `ReiheVorschlaege` (`kopf={texte.koepfe.vorschlaege}`)

Jedes `Feld` bekommt sein `kopf`, im Wechsel `ton="gruen"`/`"lila"` (Startseite Regel 12): aktivitaet gruen, netz lila, topflop gruen, verteilung lila, hersteller lila, schnitte gruen, community gruen, bewertungen lila, vorschlaege gruen. Die Skelette der `Suspense`-Fallbacks passend: Aktivität `FeldSkelett spalten={10}`, Netz `spalten={10} hoehe="gross"`, Auswertung `spalten={10}`. `FeldSkelett` muss Breite 5 nicht kennen. Kommentare der Reihen-Funktionen auf die neue Ordnung anpassen.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/profil-reihenfolge.test.ts` and `npx tsc --noEmit -p .` and `npm test`
Expected: grün.

- [ ] **Step 5: Commit, push**

```bash
git add -A app tests
git commit -m "feat: Profil in neuer Reihenfolge, Aktivitaet zuerst, Aehnlich im Aroma zuletzt"
git push origin main
```

---

## Abschluss

- [ ] Nach Strang A und C: je `git checkout main && git merge --no-ff <branch>`, `npm test`, `git push origin main`, Worktree entfernen.
- [ ] Nach B: HANDOFF aktualisieren (was live ist, was offen).
- [ ] Live-Prüfung gesammelt (Browser-MCP, Fenster muss sichtbar sein, sonst nur DOM):
  - `/profil` hell und dunkel, 494 px und Desktop: Reihenfolge, Feldköpfe, Schalter Geschmäcker/Terpene mit Morph, Lesung außen an linker und rechter Marke, Zeitleiste in beiden Modi.
  - Öffentliches Profil `/profil/<kurzId>`: Schalter, keine Terpen-Balken.
  - Startseite „Dein Kapitel“: Schalter, Lesung außen, kein Querscroll.
  - `/blueten`: Abschnitt Hersteller mit Suche, Chip, Ergebnisse. Link aus der Profil-Rangliste filtert.
