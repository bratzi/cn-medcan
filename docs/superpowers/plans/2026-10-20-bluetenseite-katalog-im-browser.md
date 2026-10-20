# Blütenseite: Katalog im Browser – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/blueten` filtert, sortiert und blättert sofort im Browser, mit neuen Filtern (Community-Score, Nur bewertet, Terpene, CBD-reich), mobiler Leiste plus Schublade und Karten, die die Community-Note vorn tragen.

**Architecture:** Eine gecachte Route `GET /api/katalog` liefert alle aktiven Handelsnamen und Kultivare als kompaktes JSON (D1 baut das JSON per SQL, der Worker reicht nur durch). Reine Funktionen in `lib/katalog/` verdichten, filtern, sortieren und zählen. Eine Client-Insel `KatalogAnsicht` hält den Filter in der URL über `history.replaceState`/`pushState`, ohne Next-Router und ohne Server.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (`@opennextjs/cloudflare`), Prisma auf D1 (`$queryRawUnsafe`), Tailwind v4 Tokens, zod, Tests mit `node:test` über `npm test` (`tsx --test "tests/**/*.test.ts"`).

**Spec:** `docs/superpowers/specs/2026-10-20-bluetenseite-katalog-im-browser-design.md`

## Global Constraints

- Free-Plan: höchstens 10 ms Worker-CPU je Anfrage; kein R2, nichts Kostenpflichtiges.
- `unstable_cache` nur mit Tag und `revalidate: 3600`; KV-Schreibvorgänge bleiben weit unter 1000 am Tag.
- Fachkreis-Gate: Bestandszeilen ohne Fachkreis nur mit `nur_fuer_fachkreise = 0` (Regel aus `bestandSichtbarkeit`, `lib/query/strains.ts:52`). Der öffentliche Cache enthält nie Zeilen mit `nur_fuer_fachkreise = 1`.
- UI nach `.claude/skills/ui-design-engine.md`: Abstände nur 8er-Leiter, nur semantische Tokens, kein `dark:`, Pillen `rounded-full`, Handelsnamen nie in Handschrift, Touch-Ziele ≥ 44 px, Bewegung nur CSS 180–350 ms, kein GSAP/Lenis außerhalb `components/story/bewegung/`.
- Texte: Du-Form, kein Geviert- oder Gedankenstrich als Trenner, nie „Ware“ im sichtbaren Text (Blüte/Strain), nie „Stärke“ (Variante). Alle Texte in `lib/i18n/de.ts` **und** `lib/i18n/en.ts`.
- Kein lokales `next dev`; geprüft wird live nach dem Push (Memory „Live statt Dev“).
- Commits auf Deutsch in Prosa, Ende mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Jeder Implementer lädt vorher seine Skills (Zeile „Skills:“ je Task) und nennt sie in seiner Meldung.

## Review Focus

1. **Deep-Link mit Filter** (`/blueten?terp=Myrcen&note=4&seite=2`): nach dem Laden genau diese Auswahl und Seite, keine Rückkehr auf Seite 1. Test in Task 2 (Rundweg) und Task 5 (Start liest `location.search`).
2. **Seite hinter dem Ende** (`?seite=99` oder Filter verkleinert die Treffer): Seite wird auf die letzte gültige geklemmt, nie leere Liste mit Trefferzahl > 0. Test in Task 2.
3. **Kultivar ohne Kennwerte oder Strain ohne Kultivar:** erscheint ohne Note, fällt bei „Nur bewertet“ und Mindestnote heraus, wirft nie. Test in Task 2.
4. **Suche mit Umlauten und Groß-/Kleinschreibung** („SÜẞ“, „sour diesel“): findet wie erwartet. Test in Task 2.
5. **Katalog-Route liefert Fehler oder ist langsam:** Startliste bleibt stehen, Hinweis mit „erneut versuchen“, Filter deaktiviert. Test in Task 5 (Zustandsfunktion) und live in Task 6.

---

## Dateistruktur

| Datei | Verantwortung | Task |
|---|---|---|
| `lib/katalog/typen.ts` | Wire-Format und verdichtete Typen | 0 |
| `lib/katalog/laden.ts` | SQL, Cache, Fachkreis-Variante | 1 |
| `app/api/katalog/route.ts` | Route Handler | 1 |
| `lib/katalog/revalidieren.ts` | `revalidiereKatalog()` | 1 |
| `lib/query/filter.ts` | Schema um `note`, `bewertet`, `terp`, `cbd`, neue Sortierungen | 2 |
| `lib/katalog/verdichten.ts` | Waren zu Kultivaren, Top-Terpene | 2 |
| `lib/katalog/filtern.ts` | Filtern, Sortieren, Blättern, Zählen je Option | 2 |
| `components/katalog/FilterFelder.tsx` | alle Filterfelder, geteilt von Leiste und Schublade | 3 |
| `components/katalog/MobilLeiste.tsx` | mitlaufende Leiste mit Suche, Filter-Knopf, Sortierung | 3 |
| `components/katalog/FilterSchublade.tsx` | `<dialog>` von unten | 3 |
| `components/katalog/KatalogKarte.tsx` | Karte je Blüte und je Strain, Community vorn | 4 |
| `components/katalog/Blaettern.tsx` | Seitennavigation | 4 |
| `components/katalog/KatalogAnsicht.tsx` | Client-Insel, Zustand, URL | 5 |
| `app/[lang]/blueten/page.tsx` | statisch, Startliste, Insel | 5 |
| `app/api/katalog/budpics/route.ts` | Budpics je Kultivar, lazy | 5 |

**Parallelität:** Task 0 macht der Controller auf `main`. Danach laufen **Task 1, 2, 3, 4 parallel** in je einem Worktree (sie teilen nur `lib/katalog/typen.ts` und die Signaturen unten). Task 5 nach dem Merge von 1–4, Task 6 (Live-Prüfung) als eigener Agent nach dem Deploy.

---

### Task 0: Typen festlegen (Controller, auf main)

**Skills:** edge-stack-master

**Files:**
- Create: `lib/katalog/typen.ts`

- [ ] **Step 1: Datei anlegen**

```ts
import type { Darreichungsform, GeschmacksKategorie, KultivarTyp } from "@/db/enums";

/**
 * Wire-Format von GET /api/katalog (Spec 2026-10-20 Blütenseite). Kurze Schlüssel, weil ~700 Zeilen
 * über die Leitung gehen; nur in dieser Datei und in lib/katalog/laden.ts (SQL) ausgeschrieben.
 */
export type KatalogBestand = {
  /** Apotheken-Slug */ a: string;
  /** Status, z. B. "VERFUEGBAR" */ s: string;
  /** Preis je Gramm in Cent */ p: number | null;
};

export type KatalogWare = {
  i: string; // id
  s: string; // slug
  h: string; // handelsname
  k: string | null; // kultivarId
  y: KultivarTyp;
  f: Darreichungsform;
  g: string | null; // genetik
  t0: number; t1: number; // THC min/max %
  c0: number; c1: number; // CBD min/max %
  v: string | null; // vertreiberId
  b: string | null; // herstellerBildPfad
  /** Top-3-Terpennamen nach Rang */ tp: string[];
  /** Sichtbare Bestandszeilen (Fachkreis-Gate schon angewandt) */ st: KatalogBestand[];
  /** aktualisiertAm ISO, für "relevanz" */ u: string;
};

export type KatalogKultivar = {
  i: string;
  n: string; // name
  s: string | null; // slug
  /** Community-Mittel 1–5 oder null */ cn: number | null;
  /** Anzahl Community-Stimmen */ ca: number;
  /** Mittel der redaktionellen Gesamtnoten oder null */ en: number | null;
  /** Letzte Bewertung ISO oder null */ lb: string | null;
};

export type KatalogDaten = {
  stand: string; // ISO-Zeit des Aufbaus
  fachkreis: boolean;
  waren: KatalogWare[];
  kultivare: KatalogKultivar[];
  vertreiber: { i: string; n: string }[];
  terpene: { n: string; g: GeschmacksKategorie }[];
  apotheken: { s: string; n: string }[];
};

/** Eine Zeile der Blüten-Ansicht, im Browser aus Waren verdichtet. */
export type BlueteZeile = {
  id: string;
  name: string;
  slug: string | null;
  typ: KultivarTyp;
  thcMin: number; thcMax: number;
  cbdMax: number;
  terpene: { name: string; geschmack: GeschmacksKategorie | null }[];
  vertreiberIds: string[];
  handelsnamen: number;
  community: { note: number; stimmen: number } | null;
  eigeneNote: number | null;
  letzteBewertung: string | null;
  bildSlug: string | null;
  herstellerBildPfad: string | null;
  /** Kleingeschrieben, ohne Diakritika: Name, Handelsnamen, Genetik, Vertreiber */
  suchtext: string;
  waren: KatalogWare[];
};

/** Zeile der Strain-Ansicht: die Ware plus Kultivarwerte. */
export type StrainZeile = KatalogWare & {
  kultivarName: string | null;
  community: { note: number; stimmen: number } | null;
  eigeneNote: number | null;
  letzteBewertung: string | null;
  terpenGeschmack: (GeschmacksKategorie | null)[];
  suchtext: string;
};
```

- [ ] **Step 2: Typprüfung und Commit**

Run: `npx tsc --noEmit -p .` · Expected: keine Fehler.
```bash
git add lib/katalog/typen.ts && git commit -m "Katalog: Typen für das Wire-Format der Blütenseite"
git push origin main
```

---

### Task 1: Katalog-Route mit D1-JSON, Cache und Invalidierung (Strang A)

**Skills:** edge-stack-master, cloudflare-d1, cloudflare:workers-best-practices, prisma-client-api

**Files:**
- Create: `lib/katalog/laden.ts`, `app/api/katalog/route.ts`, `lib/katalog/revalidieren.ts`
- Modify: `app/[lang]/blueten/[slug]/aktionen.ts:160-165`, `app/[lang]/admin/aktionen.ts` (jede Stelle, die `revalidiereSprachen("/")` nach Strain-/Review-Änderung ruft)
- Test: `tests/katalog-laden.test.ts`

**Interfaces:**
- Consumes: `KatalogDaten` aus `lib/katalog/typen.ts`
- Produces: `ladeKatalog(fachkreis: boolean): Promise<string>` (fertiger JSON-Text), `KATALOG_SQL_WAREN(fachkreis: boolean): string`, `revalidiereKatalog(): void`, Route `GET /api/katalog` → `KatalogDaten`

- [ ] **Step 1: Failing test für das SQL (Gate und Felder)**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { KATALOG_SQL_WAREN } from "@/lib/katalog/laden";

test("Katalog-SQL: öffentlich nur Bestände ohne Fachkreis-Pflicht", () => {
  const sql = KATALOG_SQL_WAREN(false);
  assert.match(sql, /nur_fuer_fachkreise\s*=\s*0/);
  assert.match(sql, /s\.aktiv\s*=\s*1/);
});

test("Katalog-SQL: Fachkreis ohne Bestandsgrenze", () => {
  assert.doesNotMatch(KATALOG_SQL_WAREN(true), /nur_fuer_fachkreise/);
});

test("Katalog-SQL: jedes Wire-Feld der Ware ist gesetzt", () => {
  const sql = KATALOG_SQL_WAREN(false);
  for (const feld of ["i", "s", "h", "k", "y", "f", "g", "t0", "t1", "c0", "c1", "v", "b", "tp", "st", "u"])
    assert.match(sql, new RegExp(`'${feld}',`), `Feld ${feld} fehlt`);
});
```

- [ ] **Step 2: Test laufen lassen**

Run: `npx tsx --test tests/katalog-laden.test.ts` · Expected: FAIL, Modul fehlt.

- [ ] **Step 3: `lib/katalog/laden.ts` schreiben**

```ts
import { unstable_cache } from "next/cache";

import { getPrisma } from "@/lib/prisma";

/**
 * Baut das Katalog-JSON in D1 (json_group_array), damit der Worker nur Text durchreicht: der Neubau
 * muss unter 10 ms Worker-CPU bleiben (Free-Plan, edge-stack-master 1). Verschachtelte Arrays mit
 * json(...) umhüllen, sonst landen sie als String im Ergebnis.
 */
export function KATALOG_SQL_WAREN(fachkreis: boolean): string {
  const gate = fachkreis ? "" : " AND ps.nur_fuer_fachkreise = 0";
  return `SELECT json_group_array(json_object(
    'i', s.id, 's', s.slug, 'h', s.handelsname, 'k', s.kultivar_id, 'y', s.kultivar_typ,
    'f', s.darreichungsform, 'g', s.genetik, 't0', s.thc_min_prozent, 't1', s.thc_max_prozent,
    'c0', s.cbd_min_prozent, 'c1', s.cbd_max_prozent, 'v', s.vertreiber_id, 'b', s.hersteller_bild_pfad,
    'tp', json((SELECT json_group_array(te.name) FROM (SELECT st.terpen_id FROM strain_terpene st
           WHERE st.strain_id = s.id AND st.rang <= 3 ORDER BY st.rang) r JOIN terpene te ON te.id = r.terpen_id)),
    'st', json((SELECT json_group_array(json_object('a', ph.slug, 's', ps.status, 'p', ps.preis_pro_gramm_cent))
           FROM pharmacy_stock ps JOIN pharmacies ph ON ph.id = ps.pharmacy_id
           WHERE ps.strain_id = s.id${gate})),
    'u', s.aktualisiert_am
  )) AS j FROM strains s WHERE s.aktiv = 1`;
}

const SQL_KULTIVARE = `SELECT json_group_array(json_object(
  'i', k.id, 'n', k.name, 's', k.slug,
  'cn', CASE WHEN kk.anzahl > 0 THEN kk.gesamtnote_mittel END, 'ca', COALESCE(kk.anzahl, 0),
  'en', (SELECT avg(r.gesamtnote) FROM reviews r WHERE r.kultivar_id = k.id AND r.ist_redaktionell = 1 AND r.gesamtnote IS NOT NULL),
  'lb', (SELECT max(r.erstellt_am) FROM reviews r WHERE r.kultivar_id = k.id)
)) AS j FROM kultivare k LEFT JOIN kultivar_kennwerte kk ON kk.kultivar_id = k.id
WHERE EXISTS (SELECT 1 FROM strains s WHERE s.kultivar_id = k.id AND s.aktiv = 1)`;

const SQL_VERTREIBER = `SELECT json_group_array(json_object('i', u.id, 'n', u.name)) AS j FROM unternehmen u
WHERE EXISTS (SELECT 1 FROM strains s WHERE s.vertreiber_id = u.id AND s.aktiv = 1)`;
const SQL_TERPENE = `SELECT json_group_array(json_object('n', name, 'g', geschmack)) AS j FROM terpene`;
const SQL_APOTHEKEN = `SELECT json_group_array(json_object('s', slug, 'n', name)) AS j FROM pharmacies`;

async function baueKatalog(fachkreis: boolean): Promise<string> {
  const prisma = await getPrisma();
  const lies = async (sql: string) => ((await prisma.$queryRawUnsafe<{ j: string }[]>(sql))[0]?.j ?? "[]");
  const [waren, kultivare, vertreiber, terpene, apotheken] = await Promise.all([
    lies(KATALOG_SQL_WAREN(fachkreis)), lies(SQL_KULTIVARE), lies(SQL_VERTREIBER), lies(SQL_TERPENE),
    fachkreis ? lies(SQL_APOTHEKEN) : Promise.resolve("[]"),
  ]);
  // Zusammensetzen per Text, nicht per JSON.parse/stringify: spart die CPU des Neubaus.
  return `{"stand":${JSON.stringify(new Date().toISOString())},"fachkreis":${fachkreis},"waren":${waren},"kultivare":${kultivare},"vertreiber":${vertreiber},"terpene":${terpene},"apotheken":${apotheken}}`;
}

const katalogGecacht = unstable_cache(baueKatalog, ["katalog-v1"], { revalidate: 3600, tags: ["katalog"] });

export function ladeKatalog(fachkreis: boolean): Promise<string> {
  return katalogGecacht(fachkreis);
}
```

Vor dem Schreiben die Tabellennamen gegen `prisma/schema.prisma` (`@@map`) prüfen: `strains`, `strain_terpene`, `terpene`, `pharmacy_stock`, `kultivare`, `kultivar_kennwerte`, `reviews`, `unternehmen`; den Namen der Apotheken-Tabelle aus `model Pharmacy` übernehmen. `getPrisma` ist der bestehende Import aus `lib/prisma.ts` (gleicher Name wie in `lib/query/strains.ts` nachsehen).

- [ ] **Step 4: Route schreiben**

```ts
// app/api/katalog/route.ts
import { ladeKatalog } from "@/lib/katalog/laden";
import { istFachkreis } from "@/lib/query/fachkreis";

/** Katalog der Blütenseite (Spec 2026-10-20). Öffentlich im Browser cachebar, Fachkreis privat. */
export async function GET(): Promise<Response> {
  const fachkreis = await istFachkreis();
  const text = await ladeKatalog(fachkreis);
  return new Response(text, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": fachkreis ? "private, no-store" : "public, max-age=300, stale-while-revalidate=3600",
      vary: "cookie",
    },
  });
}
```

`proxy.ts` prüfen: `/api/katalog` muss hinter dem Entwicklungs-Gate liegen wie die Seite (nicht in die Ausnahmen aufnehmen).

- [ ] **Step 5: Invalidierung**

```ts
// lib/katalog/revalidieren.ts
import { revalidateTag } from "next/cache";

/** Nach Änderungen an Strains, Kennwerten oder Reviews: Katalog und Filter-Facetten neu bauen. */
export function revalidiereKatalog(): void {
  revalidateTag("katalog", "max");
  revalidateTag("facetten", "max");
}
```

Signatur von `revalidateTag` in `node_modules/next/dist/docs/` nachlesen (Next 16 verlangt ggf. ein Profil als zweites Argument); passend übernehmen. Aufruf `revalidiereKatalog()` direkt neben jedes `revalidiereSprachen("/")` in `app/[lang]/blueten/[slug]/aktionen.ts` und in den Admin-Aktionen, die Strains, Reviews oder Kennwerte ändern (`grep -rn 'revalidiereSprachen("/")' app`).

- [ ] **Step 6: Tests grün, Typen grün**

Run: `npx tsx --test tests/katalog-laden.test.ts && npx tsc --noEmit -p .` · Expected: PASS, keine Fehler.

- [ ] **Step 7: Commit**

```bash
git add lib/katalog/laden.ts lib/katalog/revalidieren.ts app/api/katalog/route.ts tests/katalog-laden.test.ts app
git commit -m "Katalog: Route /api/katalog, JSON aus D1, Cache mit Tag katalog"
```

---

### Task 2: Filterschema, Verdichten, Filtern, Sortieren, Zählen (Strang B)

**Skills:** test-driven-development, react-best-practices (nur Teil Datenstrukturen), hicks-law

**Files:**
- Modify: `lib/query/filter.ts`
- Create: `lib/katalog/verdichten.ts`, `lib/katalog/filtern.ts`
- Test: `tests/katalog-filtern.test.ts`, `tests/filter.test.ts` (bestehend erweitern, sonst neu `tests/filter-katalog.test.ts`)

**Interfaces:**
- Consumes: Typen aus `lib/katalog/typen.ts`
- Produces:
  - `StrainFilter` erweitert um `note: number | undefined` (3, 3.5, 4, 4.5), `bewertet: boolean`, `terp: string[]`, `cbd: boolean`; `SORTIERUNGEN` = `["community","stimmen","neueste","name","thc_absteigend","thc_aufsteigend","preis_aufsteigend","relevanz"]`, Standard `"community"`.
  - `normalisiere(text: string): string`
  - `verdichte(daten: KatalogDaten): { blueten: BlueteZeile[]; strains: StrainZeile[] }`
  - `filtere(daten: { blueten: BlueteZeile[]; strains: StrainZeile[] }, filter: StrainFilter): KatalogErgebnis`
  - `type KatalogErgebnis = { ansicht: "bluete"; zeilen: BlueteZeile[] ; gesamt: number; seite: number; seitenAnzahl: number } | { ansicht: "ware"; zeilen: StrainZeile[]; gesamt: number; seite: number; seitenAnzahl: number }`
  - `zaehleOptionen(daten, filter): OptionsZahlen` mit `type OptionsZahlen = { typ: Record<string, number>; form: Record<string, number>; geschmack: Record<string, number>; terp: Record<string, number>; vertreiber: Record<string, number>; note: Record<"3"|"3.5"|"4"|"4.5", number>; bewertet: number; cbd: number }` – je Option die Trefferzahl, wenn nur diese Option zusätzlich zum übrigen Filter gelten würde (bei Mehrfachauswahl derselben Gruppe: Gruppe ohne eigene Auswahl rechnen, wie üblich bei Facetten).

- [ ] **Step 1: Failing tests Schema-Rundweg**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { leererFilter, parseStrainFilter, serialisiereFilter } from "@/lib/query/filter";

test("Filter: neue Parameter laufen hin und zurück", () => {
  const url = new URLSearchParams("note=4&bewertet=1&terp=Myrcen,Limonen&cbd=1&sortierung=stimmen&seite=2");
  const f = parseStrainFilter(url);
  assert.equal(f.note, 4);
  assert.equal(f.bewertet, true);
  assert.deepEqual(f.terp, ["Myrcen", "Limonen"]);
  assert.equal(f.cbd, true);
  assert.equal(f.sortierung, "stimmen");
  assert.equal(serialisiereFilter(f).toString(), url.toString().replace("%2C", ","));
});

test("Filter: ungültige Note und alte Sortierung fallen auf Standard", () => {
  const f = parseStrainFilter(new URLSearchParams("note=2&sortierung=relevanz"));
  assert.equal(f.note, undefined);
  assert.equal(f.sortierung, "relevanz");
  assert.equal(leererFilter().sortierung, "community");
  assert.equal(serialisiereFilter(leererFilter()).toString(), "");
});

test("Filter: Terpen-Namen nur aus sicheren Zeichen, höchstens 8", () => {
  const f = parseStrainFilter(new URLSearchParams("terp=Myrcen,<script>,a,b,c,d,e,f,g,h"));
  assert.ok(!f.terp.includes("<script>"));
  assert.ok(f.terp.length <= 8);
});
```

Hinweis: `relevanz` bleibt gültig (alte Links), nur der Standard wird `community`. `serialisiereFilter` lässt `sortierung` weg, wenn sie `community` ist.

- [ ] **Step 2: Laufen lassen** · Run: `npx tsx --test tests/filter-katalog.test.ts` · Expected: FAIL.

- [ ] **Step 3: Schema erweitern** in `lib/query/filter.ts`:

```ts
export const SORTIERUNGEN = [
  "community", "stimmen", "neueste", "name", "thc_absteigend", "thc_aufsteigend", "preis_aufsteigend", "relevanz",
] as const;
export const NOTEN_STUFEN = [3, 3.5, 4, 4.5] as const;

const terpListe = z
  .unknown()
  .transform((rohwert) => {
    const teile = (Array.isArray(rohwert) ? rohwert : [rohwert])
      .filter((teil): teil is string => typeof teil === "string")
      .flatMap((teil) => teil.split(","))
      .map((teil) => teil.trim())
      .filter((teil) => /^[\p{L}0-9 .-]{2,40}$/u.test(teil));
    return [...new Set(teile)].slice(0, 8);
  })
  .catch([] as string[]);

const schalter = z
  .unknown()
  .transform((rohwert) => {
    const wert = ersterWert(rohwert)?.toLowerCase();
    return wert === "1" || wert === "true" || wert === "ja";
  })
  .catch(false);

// im Objekt strainFilterSchema ergänzen:
  note: z
    .unknown()
    .transform((rohwert) => Number(ersterWert(rohwert)))
    .pipe(z.number().refine((n) => (NOTEN_STUFEN as readonly number[]).includes(n)))
    .optional()
    .catch(undefined),
  bewertet: schalter,
  terp: terpListe,
  cbd: schalter,
// sortierung: .catch("community")
```

`nurVerfuegbar` auf `schalter` umstellen. `LEERER_FILTER` um `note: undefined, bewertet: false, terp: [], cbd: false, sortierung: "community"` ergänzen. In `serialisiereFilter` nach `vertreiber`:

```ts
  if (filter.note !== undefined) params.set("note", String(filter.note));
  if (filter.bewertet) params.set("bewertet", "1");
  if (filter.terp.length > 0) params.set("terp", filter.terp.join(","));
  if (filter.cbd) params.set("cbd", "1");
```
und die Sortierbedingung auf `filter.sortierung !== "community"`. `istFilterLeer` um die vier Felder ergänzen. Alle Aufrufer der alten Liste (`lib/query/strains.ts` `orderBy`-Switch) behandeln neue Werte wie `relevanz` (Server-Pfad bleibt bis Task 5 lauffähig): `case "community": case "stimmen": case "neueste":` vor `case "relevanz":` einfügen.

- [ ] **Step 4: Tests grün** · Run: `npx tsx --test tests/filter-katalog.test.ts` und `npm test` · Expected: PASS, bestehende Filtertests weiter grün (Erwartung `sortierung: "relevanz"` als Standard in alten Tests auf `"community"` anpassen und das im Commit nennen).

- [ ] **Step 5: Failing tests Verdichten und Filtern**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { filtere, normalisiere, verdichte, zaehleOptionen } from "@/lib/katalog/filtern";
import type { KatalogDaten, KatalogWare } from "@/lib/katalog/typen";
import { leererFilter } from "@/lib/query/filter";

const ware = (x: Partial<KatalogWare> & Pick<KatalogWare, "i" | "h">): KatalogWare => ({
  s: x.i, k: null, y: "HYBRID", f: "BLUETE", g: null, t0: 20, t1: 22, c0: 0, c1: 0.5, v: null, b: null, tp: [], st: [],
  u: "2026-10-01T00:00:00Z", ...x,
});

const DATEN: KatalogDaten = {
  stand: "2026-10-20T00:00:00Z", fachkreis: false,
  waren: [
    ware({ i: "w1", h: "Süße Zitrone 22/1", k: "k1", tp: ["Limonen", "Myrcen"], v: "u1" }),
    ware({ i: "w2", h: "Sour Diesel 20/1", k: "k2", tp: ["Caryophyllen"], y: "SATIVA", c1: 0.5, v: "u2" }),
    ware({ i: "w3", h: "Ohne Sorte 18/1", k: null, tp: ["Myrcen"], c0: 5, c1: 8 }),
    ware({ i: "w4", h: "Süße Zitrone 25/1", k: "k1", tp: ["Myrcen", "Limonen"], t1: 26, v: "u2" }),
  ],
  kultivare: [
    { i: "k1", n: "Süße Zitrone", s: "suesse-zitrone", cn: 4.3, ca: 12, en: 4.5, lb: "2026-10-10T00:00:00Z" },
    { i: "k2", n: "Sour Diesel", s: "sour-diesel", cn: null, ca: 0, en: null, lb: null },
  ],
  vertreiber: [{ i: "u1", n: "Alpha GmbH" }, { i: "u2", n: "Beta AG" }],
  terpene: [{ n: "Limonen", g: "ZITRUS" }, { n: "Myrcen", g: "ERDIG" }, { n: "Caryophyllen", g: "WUERZIG" }],
  apotheken: [],
};
const V = verdichte(DATEN);
const f = (x: Partial<ReturnType<typeof leererFilter>>) => ({ ...leererFilter(), ...x });

test("Verdichten: eine Blüte je Kultivar, Strain ohne Kultivar als eigene Zeile", () => {
  assert.deepEqual(V.blueten.map((b) => b.id).sort(), ["k1", "k2", "w3"]);
  const k1 = V.blueten.find((b) => b.id === "k1")!;
  assert.equal(k1.handelsnamen, 2);
  assert.equal(k1.thcMax, 26);
  assert.deepEqual(k1.community, { note: 4.3, stimmen: 12 });
  assert.deepEqual(k1.terpene.map((t) => t.name), ["Limonen", "Myrcen"].sort((a, b) => a.localeCompare(b)));
});

test("Suche: ohne Umlaute und Großschreibung", () => {
  assert.equal(normalisiere("SÜẞE"), "susse");
  assert.deepEqual(filtere(V, f({ q: "suesse" })).zeilen.map((z) => z.id), []);
  assert.deepEqual(filtere(V, f({ q: "SÜSSE" })).zeilen.map((z) => z.id), ["k1"]);
  assert.deepEqual(filtere(V, f({ q: "sour diesel" })).zeilen.map((z) => z.id), ["k2"]);
  assert.deepEqual(filtere(V, f({ q: "beta" })).zeilen.map((z) => z.id).sort(), ["k1", "k2"]);
});

test("Community: Mindestnote und nur bewertet lassen Zeilen ohne Note fallen", () => {
  assert.deepEqual(filtere(V, f({ note: 4 })).zeilen.map((z) => z.id), ["k1"]);
  assert.deepEqual(filtere(V, f({ note: 4.5 })).zeilen.map((z) => z.id), []);
  assert.deepEqual(filtere(V, f({ bewertet: true })).zeilen.map((z) => z.id), ["k1"]);
});

test("Terpene: alle gewählten unter den Top 3", () => {
  assert.deepEqual(filtere(V, f({ terp: ["Myrcen"] })).zeilen.map((z) => z.id).sort(), ["k1", "w3"]);
  assert.deepEqual(filtere(V, f({ terp: ["Myrcen", "Limonen"] })).zeilen.map((z) => z.id), ["k1"]);
});

test("CBD-reich, Typ, Vertreiber, THC", () => {
  assert.deepEqual(filtere(V, f({ cbd: true })).zeilen.map((z) => z.id), ["w3"]);
  assert.deepEqual(filtere(V, f({ typ: ["SATIVA"] })).zeilen.map((z) => z.id), ["k2"]);
  assert.deepEqual(filtere(V, f({ vertreiber: ["u1"] })).zeilen.map((z) => z.id), ["k1"]);
  assert.deepEqual(filtere(V, f({ thcMin: 25 })).zeilen.map((z) => z.id), ["k1"]);
});

test("Sortierung community: bewertete zuerst, dann Name", () => {
  assert.deepEqual(filtere(V, f({})).zeilen.map((z) => z.id), ["k1", "w3", "k2"].sort((a, b) =>
    a === "k1" ? -1 : b === "k1" ? 1 : 0));
  assert.equal(filtere(V, f({})).zeilen[0]!.id, "k1");
});

test("Blättern: Seite hinter dem Ende wird geklemmt", () => {
  const e = filtere(V, f({ seite: 99 }));
  assert.equal(e.seite, 1);
  assert.equal(e.seitenAnzahl, 1);
  assert.equal(e.zeilen.length, 3);
});

test("Strain-Ansicht: je Handelsname, mit Kultivarnote", () => {
  const e = filtere(V, f({ ansicht: "ware", kultivar: "k1" }));
  assert.equal(e.ansicht, "ware");
  assert.deepEqual(e.zeilen.map((z) => z.i).sort(), ["w1", "w4"]);
  assert.equal(e.ansicht === "ware" && e.zeilen[0]!.community?.stimmen, 12);
});

test("Zählen je Option: Gruppe ohne eigene Auswahl", () => {
  const z = zaehleOptionen(V, f({ terp: ["Myrcen"] }));
  assert.equal(z.terp["Myrcen"], 2);
  assert.equal(z.terp["Limonen"], 1);
  assert.equal(z.bewertet, 1);
});
```

- [ ] **Step 6: Laufen lassen** · Run: `npx tsx --test tests/katalog-filtern.test.ts` · Expected: FAIL.

- [ ] **Step 7: `lib/katalog/verdichten.ts` und `lib/katalog/filtern.ts` schreiben**

```ts
// lib/katalog/verdichten.ts
import type { GeschmacksKategorie, KultivarTyp } from "@/db/enums";
import type { BlueteZeile, KatalogDaten, KatalogWare, StrainZeile } from "@/lib/katalog/typen";

export function normalisiere(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").replace(/ß|ẞ/g, "ss").toLowerCase().trim();
}

/** Top 3 über alle Handelsnamen: 4 minus Rang je Ware, Gleichstand alphabetisch (wie lib/query/kultivar-liste.ts). */
function topTerpene(waren: readonly KatalogWare[], geschmack: ReadonlyMap<string, GeschmacksKategorie>) {
  const punkte = new Map<string, number>();
  for (const w of waren) w.tp.forEach((n, i) => punkte.set(n, (punkte.get(n) ?? 0) + 3 - i));
  return [...punkte]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name]) => ({ name, geschmack: geschmack.get(name) ?? null }));
}

function mehrheit(waren: readonly KatalogWare[]): KultivarTyp {
  const n = new Map<KultivarTyp, number>();
  for (const w of waren) n.set(w.y, (n.get(w.y) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "HYBRID";
}

export function verdichte(daten: KatalogDaten): { blueten: BlueteZeile[]; strains: StrainZeile[] } {
  const geschmack = new Map(daten.terpene.map((t) => [t.n, t.g]));
  const vertreiber = new Map(daten.vertreiber.map((v) => [v.i, v.n]));
  const kultivare = new Map(daten.kultivare.map((k) => [k.i, k]));
  const gruppen = new Map<string, KatalogWare[]>();
  for (const w of daten.waren) {
    const schluessel = w.k && kultivare.has(w.k) ? w.k : w.i;
    gruppen.set(schluessel, [...(gruppen.get(schluessel) ?? []), w]);
  }
  const blueten: BlueteZeile[] = [...gruppen].map(([id, waren]) => {
    const k = kultivare.get(id);
    const vIds = [...new Set(waren.flatMap((w) => (w.v ? [w.v] : [])))];
    const name = k?.n ?? waren[0]!.h;
    return {
      id, name, slug: k?.s ?? null, typ: mehrheit(waren),
      thcMin: Math.min(...waren.map((w) => w.t0)), thcMax: Math.max(...waren.map((w) => w.t1)),
      cbdMax: Math.max(...waren.map((w) => w.c1)),
      terpene: topTerpene(waren, geschmack), vertreiberIds: vIds, handelsnamen: waren.length,
      community: k && k.cn !== null && k.ca > 0 ? { note: k.cn, stimmen: k.ca } : null,
      eigeneNote: k?.en ?? null, letzteBewertung: k?.lb ?? null,
      bildSlug: waren[0]!.s, herstellerBildPfad: waren.find((w) => w.b)?.b ?? null,
      suchtext: normalisiere([name, ...waren.map((w) => `${w.h} ${w.g ?? ""}`), ...vIds.map((v) => vertreiber.get(v) ?? "")].join(" ")),
      waren,
    };
  });
  const strains: StrainZeile[] = daten.waren.map((w) => {
    const k = w.k ? kultivare.get(w.k) : undefined;
    return {
      ...w, kultivarName: k?.n ?? null,
      community: k && k.cn !== null && k.ca > 0 ? { note: k.cn, stimmen: k.ca } : null,
      eigeneNote: k?.en ?? null, letzteBewertung: k?.lb ?? null,
      terpenGeschmack: w.tp.map((n) => geschmack.get(n) ?? null),
      suchtext: normalisiere(`${w.h} ${k?.n ?? ""} ${w.g ?? ""} ${w.v ? vertreiber.get(w.v) ?? "" : ""}`),
    };
  });
  return { blueten, strains };
}
```

```ts
// lib/katalog/filtern.ts
import type { BlueteZeile, KatalogWare, StrainZeile } from "@/lib/katalog/typen";
import { normalisiere } from "@/lib/katalog/verdichten";
import { NOTEN_STUFEN, TREFFER_PRO_SEITE, type StrainFilter } from "@/lib/query/filter";

export { normalisiere, verdichte } from "@/lib/katalog/verdichten";

type Verdichtet = { blueten: BlueteZeile[]; strains: StrainZeile[] };
export type KatalogErgebnis =
  | { ansicht: "bluete"; zeilen: BlueteZeile[]; gesamt: number; seite: number; seitenAnzahl: number }
  | { ansicht: "ware"; zeilen: StrainZeile[]; gesamt: number; seite: number; seitenAnzahl: number };
export type OptionsZahlen = {
  typ: Record<string, number>; form: Record<string, number>; geschmack: Record<string, number>;
  terp: Record<string, number>; vertreiber: Record<string, number>;
  note: Record<string, number>; bewertet: number; cbd: number;
};

const CBD_REICH = 1;

/** Bestandsbedingungen gelten wie im Server je Zeile gemeinsam (lib/query/strains.ts baueWhere). */
function bestandPasst(w: KatalogWare, f: StrainFilter): boolean {
  if (!f.nurVerfuegbar && f.apotheke.length === 0 && f.preisMax === undefined) return true;
  return w.st.some((b) =>
    (!f.nurVerfuegbar || b.s === "VERFUEGBAR") &&
    (f.apotheke.length === 0 || f.apotheke.includes(b.a)) &&
    (f.preisMax === undefined || (b.p !== null && b.p <= f.preisMax)));
}

/** Prüfung je Ware (alles, was an der einzelnen Ware hängt). */
function warePasst(w: KatalogWare, f: StrainFilter, geschmackVon: (n: string) => string | null): boolean {
  if (f.typ.length && !f.typ.includes(w.y)) return false;
  if (f.form.length && !f.form.includes(w.f)) return false;
  if (w.t1 < f.thcMin || w.t0 > f.thcMax) return false;
  if (f.cbd && w.c1 < CBD_REICH) return false;
  if (f.vertreiber.length && !(w.v && f.vertreiber.includes(w.v))) return false;
  if (f.kultivar && w.k !== f.kultivar) return false;
  if (f.geschmack.length) {
    const erstes = w.tp[0] ? geschmackVon(w.tp[0]) : null;
    if (!erstes || !f.geschmack.includes(erstes as never)) return false;
  }
  return bestandPasst(w, f);
}

function communityPasst(c: { note: number } | null, eigene: number | null, f: StrainFilter): boolean {
  if (f.bewertet && !c && eigene === null) return false;
  if (f.note !== undefined && (!c || c.note < f.note)) return false;
  return true;
}

function terpPasst(namen: readonly string[], f: StrainFilter): boolean {
  return f.terp.every((t) => namen.includes(t));
}

function geschmackKarte(v: Verdichtet): (n: string) => string | null {
  const m = new Map<string, string>();
  for (const s of v.strains) s.tp.forEach((n, i) => { const g = s.terpenGeschmack[i]; if (g) m.set(n, g); });
  return (n) => m.get(n) ?? null;
}

function blueteTreffer(v: Verdichtet, f: StrainFilter): BlueteZeile[] {
  const g = geschmackKarte(v);
  const q = f.q ? normalisiere(f.q) : "";
  return v.blueten.filter((b) =>
    (!q || b.suchtext.includes(q)) &&
    communityPasst(b.community, b.eigeneNote, f) &&
    terpPasst(b.terpene.map((t) => t.name), f) &&
    b.waren.some((w) => warePasst(w, f, g)));
}

function strainTreffer(v: Verdichtet, f: StrainFilter): StrainZeile[] {
  const g = geschmackKarte(v);
  const q = f.q ? normalisiere(f.q) : "";
  return v.strains.filter((s) =>
    (!q || s.suchtext.includes(q)) && communityPasst(s.community, s.eigeneNote, f) && terpPasst(s.tp, f) && warePasst(s, f, g));
}

type Sortierbar = { name: string; community: { note: number; stimmen: number } | null; letzteBewertung: string | null; thcMax: number; preis: number | null; geaendert: string };

function vergleiche(f: StrainFilter) {
  const name = (a: Sortierbar, b: Sortierbar) => a.name.localeCompare(b.name, "de");
  const note = (x: Sortierbar) => x.community?.note ?? -1;
  return (a: Sortierbar, b: Sortierbar): number => {
    switch (f.sortierung) {
      case "community": return note(b) - note(a) || (b.community?.stimmen ?? 0) - (a.community?.stimmen ?? 0) || name(a, b);
      case "stimmen": return (b.community?.stimmen ?? 0) - (a.community?.stimmen ?? 0) || name(a, b);
      case "neueste": return (b.letzteBewertung ?? "").localeCompare(a.letzteBewertung ?? "") || name(a, b);
      case "thc_absteigend": return b.thcMax - a.thcMax || name(a, b);
      case "thc_aufsteigend": return a.thcMax - b.thcMax || name(a, b);
      case "preis_aufsteigend": return (a.preis ?? Infinity) - (b.preis ?? Infinity) || name(a, b);
      case "relevanz": return b.geaendert.localeCompare(a.geaendert) || name(a, b);
      default: return name(a, b);
    }
  };
}

const minPreis = (waren: readonly KatalogWare[]) => {
  const p = waren.flatMap((w) => w.st.flatMap((b) => (b.p === null ? [] : [b.p])));
  return p.length ? Math.min(...p) : null;
};

function seitenweise<T>(alle: T[], f: StrainFilter) {
  const seitenAnzahl = Math.max(1, Math.ceil(alle.length / TREFFER_PRO_SEITE));
  const seite = Math.min(Math.max(1, f.seite), seitenAnzahl);
  return { zeilen: alle.slice((seite - 1) * TREFFER_PRO_SEITE, seite * TREFFER_PRO_SEITE), gesamt: alle.length, seite, seitenAnzahl };
}

export function filtere(v: Verdichtet, f: StrainFilter): KatalogErgebnis {
  const cmp = vergleiche(f);
  if (f.ansicht === "ware") {
    const s = strainTreffer(v, f).map((z) => ({ z, k: { name: z.h, community: z.community, letzteBewertung: z.letzteBewertung, thcMax: z.t1, preis: minPreis([z]), geaendert: z.u } }));
    s.sort((a, b) => cmp(a.k, b.k));
    return { ansicht: "ware", ...seitenweise(s.map((x) => x.z), f) };
  }
  const b = blueteTreffer(v, f).map((z) => ({ z, k: { name: z.name, community: z.community, letzteBewertung: z.letzteBewertung, thcMax: z.thcMax, preis: minPreis(z.waren), geaendert: z.waren.map((w) => w.u).sort().at(-1) ?? "" } }));
  b.sort((x, y) => cmp(x.k, y.k));
  return { ansicht: "bluete", ...seitenweise(b.map((x) => x.z), f) };
}

const anzahl = (v: Verdichtet, f: StrainFilter) =>
  f.ansicht === "ware" ? strainTreffer(v, f).length : blueteTreffer(v, f).length;

/** Je Option: Treffer, wenn ihre Gruppe nur diese Option trüge (Facetten-Logik). */
export function zaehleOptionen(v: Verdichtet, f: StrainFilter): OptionsZahlen {
  const je = <K extends "typ" | "form" | "geschmack" | "terp" | "vertreiber">(gruppe: K, werte: readonly string[]) =>
    Object.fromEntries(werte.map((w) => [w, anzahl(v, { ...f, [gruppe]: gruppe === "terp" ? [...f.terp.filter((t) => t !== w), w] : [w] } as StrainFilter)]));
  const alleTerpene = [...new Set(v.strains.flatMap((s) => s.tp))];
  const alleVertreiber = [...new Set(v.strains.flatMap((s) => (s.v ? [s.v] : [])))];
  return {
    typ: je("typ", ["INDICA", "SATIVA", "HYBRID"]),
    form: je("form", [...new Set(v.strains.map((s) => s.f))]),
    geschmack: je("geschmack", [...new Set(v.strains.flatMap((s) => s.terpenGeschmack.filter((g): g is NonNullable<typeof g> => g !== null)))]),
    terp: je("terp", alleTerpene),
    vertreiber: je("vertreiber", alleVertreiber),
    note: Object.fromEntries(NOTEN_STUFEN.map((n) => [String(n), anzahl(v, { ...f, note: n })])),
    bewertet: anzahl(v, { ...f, bewertet: true }),
    cbd: anzahl(v, { ...f, cbd: true }),
  };
}
```

Terpene sind eine **UND**-Gruppe: deshalb zählt `terp` die Auswahl **plus** die Option (nicht ersetzt). Der Test „Zählen je Option“ bestätigt das. Performance: `zaehleOptionen` ruft `anzahl` ~60-mal über ~700 Zeilen, also ~40 000 einfache Prüfungen; im Browser < 20 ms. Falls messbar langsamer, in Task 5 per `useDeferredValue` entkoppeln, nicht hier optimieren.

- [ ] **Step 8: Tests grün** · Run: `npx tsx --test tests/katalog-filtern.test.ts tests/filter-katalog.test.ts && npm test && npx tsc --noEmit -p .` · Expected: PASS. Den Test „Sortierung community“ beim Grünmachen vereinfachen, wenn er zu umständlich ist, aber die Aussage „bewertete zuerst“ behalten.

- [ ] **Step 9: Commit**

```bash
git add lib/query/filter.ts lib/query/strains.ts lib/katalog/verdichten.ts lib/katalog/filtern.ts tests/katalog-filtern.test.ts tests/filter-katalog.test.ts
git commit -m "Katalog: Filter um Community-Note, Nur bewertet, Terpene, CBD-reich; Filtern und Zählen im Browser"
```

---

### Task 3: Filterfelder, mobile Leiste, Schublade (Strang C)

**Skills:** ui-design-engine, frontend-design, better-layout, hicks-law, fitts-law, apple-design, emil-design-eng, better-accessibility

**Files:**
- Create: `components/katalog/FilterFelder.tsx`, `components/katalog/MobilLeiste.tsx`, `components/katalog/FilterSchublade.tsx`
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (Block `katalog.leiste` erweitern)
- Test: `tests/katalog-ui.test.ts`

**Interfaces:**
- Consumes: `StrainFilter`, `NOTEN_STUFEN`, `SORTIERUNGEN` aus `lib/query/filter.ts` (Task 2, Namen wie oben), `OptionsZahlen` aus `lib/katalog/filtern.ts` (Typ wie oben in Task 2), `KatalogDaten` für Namenslisten.
- Produces:
  - `FilterFelder(props: { filter: StrainFilter; zahlen: OptionsZahlen | null; daten: Pick<KatalogDaten, "vertreiber" | "terpene" | "apotheken" | "fachkreis"> | null; setze: (teil: Partial<StrainFilter>) => void; texte: Woerterbuch["katalog"]["leiste"]; labels: Pick<Woerterbuch["label"], "kultivarTyp" | "darreichungsform" | "geschmack">; sprache: Sprache; deaktiviert: boolean })`
  - `MobilLeiste(props: { filter: StrainFilter; aktiv: number; gesamt: number; setze: (teil: Partial<StrainFilter>) => void; oeffne: () => void; texte: Woerterbuch["katalog"]["leiste"] })`
  - `FilterSchublade(props: { offen: boolean; schliesse: () => void; gesamt: number; zuruecksetzen: () => void; texte: Woerterbuch["katalog"]["leiste"]; children: React.ReactNode })`
  - Neue Wörterbuchschlüssel in `katalog.leiste`: `community`, `mindestnote`, `alleNoten`, `abNote` ("ab {note}"), `nurBewertet`, `terpene`, `mehrTerpene`, `wenigerTerpene`, `cbdReich`, `filterKnopf`, `trefferZeigen` ("{anzahl} Treffer zeigen" mit Mehrzahl über `mehrzahl`), `schliessen`, `vertreiberSuchen`, `sortierungen: { community, stimmen, neueste, name, thc_absteigend, thc_aufsteigend, preis_aufsteigend, relevanz }`.

**Inhalte und Regeln:**

- Reihenfolge der Gruppen exakt wie Spec „Filter (neu geordnet)“: Suche (nur Desktop, mobil in der Leiste), Community (Stufen als Pillen-Segment `alle · ab 3 · ab 3,5 · ab 4 · ab 4,5`, Zahl je Pille aus `zahlen.note`, darunter Schalter „Nur bewertet“), Terpene (Chips mit Icon aus dem bestehenden Terpen-Register, acht häufigste sichtbar nach `zahlen.terp`, Knopf „mehr“ klappt den Rest), Geschmack (Chips), Typ (Segment), THC-Slider (bestehende `RangeSlider` aus `components/ui`), Schalter „CBD-reich“, Hersteller (Suchfeld plus Checkbox-Liste mit Zahl, alphabetisch), Darreichungsform, Verfügbarkeit, Apotheke und Preis nur bei `daten.fachkreis`.
- Gruppen 1–3 offen, ab Geschmack `<details>` mit `<summary>` (eine Zeile je Gruppe, Zahl aktiver Auswahl im Summary). Kein JS für Auf/Zu.
- Option mit Zahl 0 und nicht gewählt: `aria-disabled` nicht setzen, nur `text-text-muted` und Zahl „0“; anklickbar bleibt sie (Spec: abgeschwächt, nicht versteckt).
- Freitext und Slider verzögert 300 ms wie heute (`DEBOUNCE_MS` aus `components/produkt/FilterLeiste.tsx` übernehmen), alles andere sofort über `setze`.
- Terpen-Icons: bestehende Icon-Komponente suchen (`grep -rn "TerpenIcon\|terpen-icons" components lib`) und wiederverwenden.
- `MobilLeiste`: nur unter `lg` (`lg:hidden`), `sticky top-(--kopf-h,4rem) z-20`, Höhe 56 px (`h-14`), Fläche `bg-surface/95 backdrop-blur-sm border-b border-border`; Suchfeld (flex-1), Knopf „Filter“ als Pille mit Zähler-Badge (`aktiv`), Sortierung als `<select>`; alle Ziele ≥ 44 px.
- `FilterSchublade`: `<dialog>` mit `showModal()` bei `offen`, `close()` sonst; `onCancel` → `schliesse`; Fläche `fixed inset-x-0 bottom-0 max-h-[85dvh] w-full max-w-none bg-surface shadow-lg`, oben Ziehgriff (rein optisch, `aria-hidden`), Titel, Schließen-Knopf (44 px); Inhalt scrollt (`overflow-y-auto overscroll-contain`), Fuß fest mit `zuruecksetzen` (sekundär) und Primärknopf „N Treffer zeigen“ (`bg-accent`, `rounded-full`, `hover:bg-accent-hover`), der `schliesse` ruft. Einfahren per CSS: `translate-y-full` zu `translate-y-0`, `transition-transform duration-normal ease-standard`, `motion-reduce:transition-none`; Startzustand per `@starting-style` in `app/globals.css` (Block `.katalog-schublade`), Backdrop `::backdrop` mit `bg-text/40`-Entsprechung über Token-Variable.

- [ ] **Step 1: Failing Wächter-Test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const lies = (p: string) => readFileSync(p, "utf8");

test("Schublade: echtes dialog, Escape, reduzierte Bewegung", () => {
  const s = lies("components/katalog/FilterSchublade.tsx");
  assert.match(s, /<dialog/);
  assert.match(s, /showModal\(\)/);
  assert.match(s, /onCancel=/);
  assert.match(s, /motion-reduce:transition-none/);
});

test("Filterfelder: Reihenfolge Community vor Terpene vor Geschmack vor Typ", () => {
  const s = lies("components/katalog/FilterFelder.tsx");
  const pos = ["texte.community", "texte.terpene", "texte.geschmack", "texte.kultivarTyp"].map((k) => s.indexOf(k));
  assert.ok(pos.every((p) => p > 0), "Gruppe fehlt");
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
});

test("Filterfelder: Preis und Apotheke nur im Fachkreis, keine dark:-Klassen", () => {
  const s = lies("components/katalog/FilterFelder.tsx");
  assert.match(s, /daten\?\.fachkreis/);
  for (const d of ["FilterFelder", "MobilLeiste", "FilterSchublade"])
    assert.doesNotMatch(lies(`components/katalog/${d}.tsx`), /\bdark:/);
});

test("Wörterbuch: neue Schlüssel in de und en", () => {
  for (const datei of ["lib/i18n/de.ts", "lib/i18n/en.ts"]) {
    const s = lies(datei);
    for (const k of ["mindestnote", "nurBewertet", "cbdReich", "trefferZeigen", "vertreiberSuchen"]) assert.match(s, new RegExp(`${k}:`), `${k} fehlt in ${datei}`);
  }
});
```

- [ ] **Step 2: Laufen lassen** · Run: `npx tsx --test tests/katalog-ui.test.ts` · Expected: FAIL.
- [ ] **Step 3: Wörterbuch** de/en ergänzen (Typ in `lib/i18n/typen.ts` folgt aus `de.ts`, prüfen). Deutsche Texte: `community: "Community"`, `mindestnote: "Community-Note"`, `alleNoten: "alle"`, `abNote: "ab {note}"`, `nurBewertet: "Nur bewertet"`, `terpene: "Terpene"`, `mehrTerpene: "mehr"`, `wenigerTerpene: "weniger"`, `cbdReich: "CBD-reich (ab 1 %)"`, `filterKnopf: "Filter"`, `trefferZeigen: { eins: "1 Treffer zeigen", viele: "{anzahl} Treffer zeigen" }` (Form an `mehrzahl` in `lib/i18n/text.ts` anpassen), `schliessen: "Schließen"`, `vertreiberSuchen: "Hersteller suchen"`, Sortierungen: `"Community-Note"`, `"meiste Stimmen"`, `"neueste Bewertung"`, `"Name"`, `"THC absteigend"`, `"THC aufsteigend"`, `"Preis aufsteigend"`, `"zuletzt geändert"`. Englisch sinngemäß.
- [ ] **Step 4: Drei Komponenten schreiben** nach „Inhalte und Regeln“. Bestehende Bausteine aus `components/ui` (`Field`, `RangeSlider`, `Select`, `Button`) und die Klassenkonstanten `CHECKBOX_ZEILE`, `CHECKBOX`, `SUCHFELD` aus `components/produkt/FilterLeiste.tsx` übernehmen (dorthin nicht zurückschreiben; die alte Leiste fällt in Task 5 weg).
- [ ] **Step 5: Tests und Typen** · Run: `npx tsx --test tests/katalog-ui.test.ts && npm test && npx tsc --noEmit -p . && npx eslint components/katalog` · Expected: PASS.
- [ ] **Step 6: Checkliste** `.claude/skills/ui-design-engine.md` Abschnitt 11 durchgehen, Ergebnis in die Meldung.
- [ ] **Step 7: Commit**

```bash
git add components/katalog lib/i18n app/globals.css tests/katalog-ui.test.ts
git commit -m "Katalog: Filterfelder neu geordnet, mobile Leiste und Schublade"
```

---

### Task 4: Karten mit Community vorn, Blättern (Strang C2)

**Skills:** ui-design-engine, frontend-design, critique-information-density, critique-visual-hierarchy, von-restorff-effect, emil-design-eng

**Files:**
- Create: `components/katalog/KatalogKarte.tsx`, `components/katalog/Blaettern.tsx`
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (Block `katalog.karte`)
- Test: `tests/katalog-karte.test.ts`

**Interfaces:**
- Consumes: `BlueteZeile`, `StrainZeile` aus `lib/katalog/typen.ts`; `BlattAnzeige` (`components/review/BlattAnzeige.tsx`), `TerpenChips` (`components/produkt/TerpenChips.tsx`), `Bild` (`components/medien/Bild`), `BudpicDiashow` + `DiashowBild`, `musterBildId` (`lib/budpics`), `blueteBild` (`lib/medien`), Formatierer aus `lib/format`.
- Produces:
  - `BlueteKarte(props: { zeile: BlueteZeile; vertreiberName: (id: string) => string; budpics?: readonly DiashowBild[]; texte: KartenTexte; sprache: Sprache })`
  - `StrainKarte(props: { zeile: StrainZeile; vertreiberName: (id: string) => string; texte: KartenTexte; sprache: Sprache; fachkreis: boolean })`
  - `type KartenTexte = Woerterbuch["katalog"]["karte"] & { kultivarTyp: Woerterbuch["label"]["kultivarTyp"]; darreichungsform: Woerterbuch["label"]["darreichungsform"] }`
  - `Blaettern(props: { seite: number; seitenAnzahl: number; geheZu: (seite: number) => void; hrefFuer: (seite: number) => string; texte: Pick<Woerterbuch["katalog"], "seitennavigation" | "vorige" | "naechste" | "seiteVon"> })`

**Aufbau der Karte (von oben):**
1. Bildfläche wie heute in `components/produkt/KultivarKarte.tsx` (gleiche Höhe, Diashow oder Musterbild).
2. **Community-Zeile:** Note in `font-hand text-notiz text-logo` (Ausnahme Regel 3 wie AuftaktZahlen), daneben `BlattAnzeige` mit der Note, darunter gedruckt „{n} Stimmen“ (`mehrzahl`, `numeric text-caption`). Eigene Note, falls vorhanden, gedruckt rechts: „Buch {note}“ (`text-caption text-text-muted`). Ohne Stimmen: gedruckt „noch keine Stimmen“ und Link „als Erste:r bewerten“ auf `/blueten/{slug}#bewerten` (Anker der Bewertungsmaske auf der Detailseite prüfen und echten Anker nehmen). `sr-only`-Text mit dem vollen Wert („Community-Note 4,3 von 5 aus 12 Stimmen“).
3. Name in `font-buch text-sorte` (gedruckt, nie Handschrift), Link über die ganze Karte wie heute (`after:`-Trick aus `KultivarKarte`), Ziel: Sortenseite `/blueten/{slug}`, ohne Slug `/blueten?kultivar={id}&ansicht=ware`.
4. `TerpenChips` mit den Top 3.
5. Fußzeile `text-caption text-text-muted numeric`: Typ · THC-Spanne · CBD max · „{n} Varianten“ bzw. Vertreibername.
- StrainKarte: gleicher Aufbau, Community-Zeile trägt den Zusatz „Wert der Blüte“, Name = Handelsname, Fuß mit Vertreiber, Bestrahlung entfällt; bei `fachkreis` und Preis: günstigster Preis je Gramm (`formatierePreisProGramm`).
- `Blaettern`: `<nav aria-label>` mit Vor/Zurück als Links (`hrefFuer`) die per `onClick` `preventDefault` + `geheZu` rufen (ohne JS funktionieren die Links), dazwischen Seitenzahlen (erste, letzte, ±1 um die aktuelle, Lücken als „…“ `aria-hidden`), aktuelle Seite `aria-current="page"`; alle Ziele 44 px, Pillen.

- [ ] **Step 1: Failing Wächter-Test**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const karte = readFileSync("components/katalog/KatalogKarte.tsx", "utf8");

test("Karte: Community-Zeile steht vor Name und THC", () => {
  const c = karte.indexOf("data-community");
  const n = karte.indexOf("data-name");
  const thc = karte.indexOf("data-fuss");
  assert.ok(c > 0 && n > c && thc > n, "Reihenfolge Community, Name, Fuß");
});

test("Karte: Handelsname nie in Handschrift, Wert hat sr-only-Text", () => {
  assert.doesNotMatch(karte, /data-name[^>]*font-hand/);
  assert.match(karte, /sr-only/);
});

test("Blättern: Links funktionieren ohne JS, aktuelle Seite markiert", () => {
  const b = readFileSync("components/katalog/Blaettern.tsx", "utf8");
  assert.match(b, /href=\{hrefFuer\(/);
  assert.match(b, /aria-current="page"/);
  assert.match(b, /preventDefault\(\)/);
});
```

- [ ] **Step 2: Laufen lassen** · Expected: FAIL.
- [ ] **Step 3: Wörterbuch `katalog.karte`** (de/en): `stimmen` (Mehrzahl), `keineStimmen: "noch keine Stimmen"`, `alsErsteBewerten: "als Erste:r bewerten"`, `buchNote: "Buch {note}"`, `wertDerBluete: "Wert der Blüte"`, `varianten` (Mehrzahl, „{anzahl} Varianten“), `srNote: "Community-Note {note} von 5 aus {stimmen} Stimmen"`.
- [ ] **Step 4: Komponenten schreiben** (Client-tauglich: kein `async`, keine Server-Importe; `"use client"` nur, wenn Hooks nötig, sonst weglassen, damit Server und Client sie teilen).
- [ ] **Step 5: Tests, Typen, Lint** · Run: `npx tsx --test tests/katalog-karte.test.ts && npm test && npx tsc --noEmit -p . && npx eslint components/katalog` · Expected: PASS.
- [ ] **Step 6: Checkliste ui-design-engine 11**, Ergebnis in die Meldung.
- [ ] **Step 7: Commit**

```bash
git add components/katalog/KatalogKarte.tsx components/katalog/Blaettern.tsx lib/i18n tests/katalog-karte.test.ts
git commit -m "Katalog: Karten mit Community-Note vorn, Blättern ohne Neuladen"
```

---

### Task 5: Seite verdrahten (Strang D, nach Merge von 1–4)

**Skills:** react-best-practices, edge-stack-master, ui-design-engine, better-accessibility, superpowers:verification-before-completion

**Files:**
- Create: `components/katalog/KatalogAnsicht.tsx`, `lib/katalog/zustand.ts`, `app/api/katalog/budpics/route.ts`
- Modify: `app/[lang]/blueten/page.tsx`
- Delete (nach grünem Ersatz, `grep` vorher): `components/produkt/FilterLeiste.tsx`, `components/produkt/AktiveFilter.tsx` nur wenn sonst unbenutzt; `components/produkt/KultivarKarte.tsx`, `ProduktCard.tsx` **nicht** löschen, wenn andere Seiten sie nutzen
- Test: `tests/katalog-zustand.test.ts`, `tests/katalog-seite.test.ts`

**Interfaces:**
- Consumes: alles aus Task 1–4 mit den dort genannten Namen.
- Produces: `KatalogAnsicht(props: { start: { zeilen: BlueteZeile[]; gesamt: number }; texte: …; labels: …; sprache: Sprache })`; `ladeZustand`-Reducer in `lib/katalog/zustand.ts`:

```ts
export type Ladezustand = { art: "start" } | { art: "laedt" } | { art: "bereit"; daten: KatalogDaten } | { art: "fehler" };
export type Ereignis = { typ: "laden" } | { typ: "geladen"; daten: KatalogDaten } | { typ: "fehlgeschlagen" };
export function weiter(z: Ladezustand, e: Ereignis): Ladezustand {
  switch (e.typ) {
    case "laden": return z.art === "bereit" ? z : { art: "laedt" };
    case "geladen": return { art: "bereit", daten: e.daten };
    case "fehlgeschlagen": return z.art === "bereit" ? z : { art: "fehler" };
  }
}
export function filterDeaktiviert(z: Ladezustand): boolean { return z.art !== "bereit"; }
```

- [ ] **Step 1: Failing Tests**

```ts
// tests/katalog-zustand.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { filterDeaktiviert, weiter } from "@/lib/katalog/zustand";

const DATEN = { stand: "", fachkreis: false, waren: [], kultivare: [], vertreiber: [], terpene: [], apotheken: [] };

test("Fehler beim Laden: Filter aus, Startliste bleibt (kein bereit)", () => {
  const z = weiter(weiter({ art: "start" }, { typ: "laden" }), { typ: "fehlgeschlagen" });
  assert.equal(z.art, "fehler");
  assert.equal(filterDeaktiviert(z), true);
});

test("Erneut versuchen nach Fehler führt zu bereit", () => {
  const z = weiter(weiter({ art: "fehler" }, { typ: "laden" }), { typ: "geladen", daten: DATEN });
  assert.equal(z.art, "bereit");
  assert.equal(filterDeaktiviert(z), false);
});
```

```ts
// tests/katalog-seite.test.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("Blütenseite: statisch, kein Suspense-key am Filter, kein Router-Aufruf in der Insel", () => {
  const seite = readFileSync("app/[lang]/blueten/page.tsx", "utf8");
  assert.match(seite, /export const dynamic = "force-static"/);
  assert.doesNotMatch(seite, /Suspense[^>]*key=/);
  const insel = readFileSync("components/katalog/KatalogAnsicht.tsx", "utf8");
  assert.doesNotMatch(insel, /router\.(replace|push)/);
  assert.match(insel, /history\.replaceState/);
  assert.match(insel, /history\.pushState/);
  assert.match(insel, /popstate/);
  assert.match(insel, /window\.location\.search/);
  assert.match(insel, /aria-live="polite"/);
});
```

- [ ] **Step 2: Laufen lassen** · Expected: FAIL.
- [ ] **Step 3: `lib/katalog/zustand.ts`** mit dem Code aus „Produces“.
- [ ] **Step 4: `KatalogAnsicht.tsx`** (`"use client"`):
  - Filter-Zustand: `useState(() => leererFilter())`, im ersten `useEffect` `parseStrainFilter(new URLSearchParams(window.location.search))` setzen (wie `ZugangFelder`, Seite bleibt statisch).
  - Laden: `useEffect` → `dispatch({typ:"laden"})`, `fetch("/api/katalog", { priority: "low" } as RequestInit)` → `json()` → `geladen`; `catch` → `fehlgeschlagen`. Knopf „erneut versuchen“ im Fehlerfall ruft denselben Ablauf.
  - `verdichtet = useMemo(() => daten && verdichte(daten), [daten])`; `ergebnis = useMemo(() => verdichtet && filtere(verdichtet, filter), …)`; `zahlen = useMemo(() => verdichtet && zaehleOptionen(verdichtet, useDeferredValue(filter)), …)` (deferred, damit Tippen flüssig bleibt).
  - `setze(teil)`: neuer Filter `{ ...filter, ...teil, seite: "seite" in teil ? teil.seite! : 1 }`, `history.replaceState(null, "", url)` mit `serialisiereFilter`; Seitenwechsel über `geheZu(seite)`: `history.pushState`, dann `listeRef.current?.scrollIntoView({ block: "start", behavior: reduziert ? "auto" : "smooth" })`.
  - `popstate` → Filter aus `location.search` neu lesen.
  - Vor `bereit`: Startliste (Props) anzeigen, `FilterFelder` mit `deaktiviert`; mit Filter im Deep-Link stattdessen Skelett (bestehendes Skelett-Muster aus `components/story/Skelette` oder `components/ui` übernehmen).
  - Layout: `MobilLeiste` + `FilterSchublade` (enthält `FilterFelder`) unter `lg`; ab `lg` `<aside className="hidden lg:block w-72 shrink-0 sticky top-[calc(var(--kopf-h,4rem)+2rem)] max-h-[calc(100dvh-var(--kopf-h,4rem)-4rem)] overflow-y-auto">` mit `FilterFelder`.
  - Über der Liste: Ansicht-Umschalter (bestehend `components/produkt/AnsichtUmschalter.tsx` auf `setze({ ansicht })` umbauen oder Logik inline), Trefferzahl `aria-live="polite"`, aktive Filter als Chips (je Chip `setze` mit entferntem Wert, „alle löschen“ → `setze(leererFilter())`).
  - Karten: `BlueteKarte`/`StrainKarte`, Raster wie heute `grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3`; leeres Ergebnis: bestehende `EmptyState` mit „zurücksetzen“ und „vorschlagen“.
  - Budpics: je sichtbarer Blüte per `IntersectionObserver` sammeln, gebündelt `fetch("/api/katalog/budpics?ids=…")`, Ergebnis in einer Map; Musterbild bis dahin.
- [ ] **Step 5: `app/api/katalog/budpics/route.ts`**: liest `ids` (höchstens 24, Muster `/^[0-9a-f-]{32,36}$/`), ruft `ladeFreieBudpicsJeKultivar`, antwortet `{ [kultivarId]: { id, breite, hoehe, nutzer, erstelltAm }[] }` mit `cache-control: public, max-age=300`. Die Beschriftung baut der Client mit `w.budpic.von` wie `alsDiashow` (Funktion clientfähig machen oder Logik im Client nachbilden).
- [ ] **Step 6: `page.tsx`** umbauen: `export const dynamic = "force-static"; export const revalidate = 3600;` keine `searchParams`; Startliste: erste 24 Blüten ohne Filter per `ladeKatalog(false)` → `verdichte` → `filtere(…, leererFilter())` auf dem Server (CPU: einmal je Revalidierung, akzeptiert); Kopf (h1, Einleitung) bleibt; `<KatalogAnsicht start={…} … />`. `generateMetadata` bleibt.
- [ ] **Step 7: Tests, Typen, Lint, ganze Suite** · Run: `npm test && npx tsc --noEmit -p . && npx eslint app/[lang]/blueten components/katalog lib/katalog` · Expected: alles grün; ungenutzte Altkomponenten per `grep -rn` prüfen und nur dann löschen.
- [ ] **Step 8: Neuigkeit** in `lib/neuigkeiten/eintraege.ts` (Muster der vorhandenen Einträge): „Blütenseite: Filtern ohne Warten, Community-Note vorn“, den Eintrag „Gerade in Arbeit“ zur Blütenseite, falls vorhanden, auf erledigt setzen.
- [ ] **Step 9: Commit und Push**

```bash
git add -A app/[lang]/blueten components/katalog lib/katalog app/api/katalog tests lib/neuigkeiten components/produkt
git commit -m "Blütenseite: Katalog im Browser, statische Seite, Filtern und Blättern ohne Neuladen"
git push origin main
```

---

### Task 6: Live-Prüfung (eigener Agent nach dem Deploy)

**Skills:** web-design-guidelines, critique-information-density, critique-visual-hierarchy, better-accessibility, superpowers:verification-before-completion

- [ ] **Step 1:** Build-Status einmal über die Cloudflare-API prüfen (Vorgehen „Lehre Deploy“ in `HANDOFF.md`), kein Polling.
- [ ] **Step 2:** Per Browser-MCP `https://www.bookofterpz.workers.dev/blueten` bei 390 px und 1280 px, hell und `data-theme="dark"`: Screenshots; Filterwechsel und Blättern; `read_network_requests` zeigt nach dem ersten `/api/katalog` **keine** weiteren Dokument- oder RSC-Anfragen bei Filterwechseln.
- [ ] **Step 3:** Deep-Link `/blueten?terp=Myrcen&note=4&seite=2`, Zurück-Knopf nach zwei Seitenwechseln, Schublade mit Tastatur (Tab bleibt drin, Escape schließt, Fokus zurück auf den Filter-Knopf).
- [ ] **Step 4:** CPU-Zeit von `/api/katalog` beim ersten Aufruf nach Revalidierung im Cloudflare-Log (`query_worker_observability` bzw. Cloudflare-API): unter 10 ms. Sonst Befund melden: Rückfall laut Spec (JSON beim Import nach KV schreiben) als eigener Task.
- [ ] **Step 5:** Größe der Antwort `/api/katalog` (gzip) notieren, Ziel < 200 KB.
- [ ] **Step 6:** Befunde mit Screenshots melden; Fehler als Liste mit Datei und Zeile, nicht selbst beheben.
