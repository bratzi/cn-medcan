# Vertreiber sichtbar machen – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Startseite, Katalog, Blütenseite und Reviews zeigen deutlich, dass dieselbe Blüte von mehreren Vertreibern kommt und der Vertreiber die Chargenqualität prägt.

**Architecture:** Drei unabhängige Stränge in je einem git-Worktree (Memory `plaene-parallel-schneiden`). Sie teilen keine Code-Datei; die einzige Verbindung ist die URL `/blueten?kultivar=<id>`. In `lib/i18n/de.ts` und `en.ts` schreibt jeder Strang nur in seinen eigenen Block. Daten über Prisma (`await getPrisma()`), alles Server Components, kein neues Client-JS.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma 7 mit D1, Tailwind v4, Tests mit `node:test` + `tsx` + `react-dom/server`.

**Spec:** `docs/superpowers/specs/2026-10-13-vertreiber-sichtbar-design.md`

## Global Constraints

- **Skills zuerst (Memory `skills-einsatzregeln`, Dauerregel):** Jeder Implementer lädt vor dem ersten Edit per Skill-Tool die in seinem Task unter **Skills** genannten Skills. `ui-design-engine` und `edge-stack-master` sind Wrapper: danach `.claude/skills/ui-design-engine.md` bzw. `.claude/skills/edge-stack-master.md` vollständig lesen. Im Bericht nennen, welche Skills geladen wurden.
- Next.js 16 weicht ab: vor neuem Routing- oder Caching-Code die passende Anleitung unter `node_modules/next/dist/docs/` lesen (AGENTS.md).
- Kein `next dev`, kein `next build`, kein `preview` lokal (Memory `live-statt-dev`). Prüfen mit `npx tsx --test <datei>`, `npm test`, `npx tsc --noEmit -p .`.
- Prisma-Client vor `tsc` frisch: `npx prisma generate` (war in Session 58 veraltet).
- Abstände nur aus der Leiter 8/16/24/32/40/48/64/80/96/128 px; nur semantische Farbtokens; kein `dark:`; Handelsnamen nie in Handschrift; `font-hand` nur mit einem Handschrift-Grad (`ui-design-engine` 2 bis 4).
- Texte: du/wir, ohne Geviert- und Gedankenstrich (U+2014, U+2013), keine Superlative, keine Kauf- oder Apothekenlinks (HWG).
- Vertreiber nie nach Qualität sortieren. Reihenfolge: Zahl der Bewertungen absteigend, dann Name.
- Jede Listenabfrage hat `take` und gezieltes `select`; keine Query in einer Schleife (`edge-stack-master` 4).
- Kultivar-Id-Muster überall: `/^[0-9a-f-]{32,36}$/` (wie `app/[lang]/vorschlagen/page.tsx:28`).
- Commits auf Deutsch, Prosa, Endzeile `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `lib/i18n/en.ts` muss dieselbe Form wie `de.ts` haben (Typ `Woerterbuch`); jeder neue deutsche Schlüssel bekommt sein englisches Gegenstück.

## Review Focus

1. `?kultivar=` mit unbekannter, gültig geformter Id: Liste leer, Chip „Blüte: unbekannt“ entfernbar, kein Fehler. Test in Task B1/B3.
2. Handelsnamen ohne Vertreiber (`vertreiber_id` null): zählen nicht als „weitere Vertreiber“, erscheinen als „Vertreiber unbekannt“. Tests in Task B2 und A1.
3. Umschalten der Ansicht auf Seite 3: führt auf Seite 1, behält die übrigen Filter. Test in Task B3.
4. Sehr lange Kultivar- und Handelsnamen in Beispielkarte und Kultivarkarte brechen um (`wrap-break-word`), kein Querscroll. Test (Klasse vorhanden) in A2 und B3.
5. Beispiel-Kultivar, dessen Vertreiber alle unbewertet sind: Karte zeigt alle Zeilen mit „noch keine Charge bewertet“ und die Einladung; kein Link „Zur Blüte“ auf eine Ware ohne Slug. Test in Task A2.

---

## Strang A: Startseite (Worktree `C:\cn-wt\vs-start`, Branch `vs-start`)

### Task A1: Beispielwahl

**Skills:** `prisma-client-api`, `edge-stack-master`, `cloudflare-d1`

**Files:**
- Create: `lib/query/vertreiber-beispiel.ts`
- Test: `tests/vertreiber-beispiel.test.ts`

**Interfaces:**
- Consumes: `ladeVertreiberDerBluete(kultivarId: string, aktuelleId: string): Promise<VertreiberEintrag[]>` und Typ `VertreiberEintrag` aus `lib/query/vertreiber.ts` (unverändert; mit `aktuelleId = ""` ist keine Zeile `aktuell`).
- Produces:
  - `type BeispielKandidat = { kultivarId: string; name: string; bewerteteVertreiber: number; bewertungen: number; handelsnamen: number }`
  - `function waehleBeispiel(kandidaten: readonly BeispielKandidat[]): BeispielKandidat | null`
  - `type VertreiberBeispiel = { kultivarId: string; name: string; zeilen: VertreiberEintrag[] }`
  - `async function ladeVertreiberBeispiel(): Promise<VertreiberBeispiel | null>`

- [ ] **Step 1: Failing tests schreiben**

```ts
// tests/vertreiber-beispiel.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { waehleBeispiel, type BeispielKandidat } from "@/lib/query/vertreiber-beispiel";

const k = (teil: Partial<BeispielKandidat>): BeispielKandidat => ({
  kultivarId: "k", name: "K", bewerteteVertreiber: 0, bewertungen: 0, handelsnamen: 2, ...teil,
});

test("waehleBeispiel: mehr bewertete Vertreiber schlagen mehr Bewertungen", () => {
  const sieger = waehleBeispiel([
    k({ kultivarId: "a", name: "A", bewerteteVertreiber: 1, bewertungen: 9 }),
    k({ kultivarId: "b", name: "B", bewerteteVertreiber: 2, bewertungen: 2 }),
  ]);
  assert.equal(sieger?.kultivarId, "b");
});

test("waehleBeispiel: Gleichstand über Bewertungen, Handelsnamen, dann Name", () => {
  assert.equal(waehleBeispiel([k({ kultivarId: "a", bewertungen: 1 }), k({ kultivarId: "b", bewertungen: 3 })])?.kultivarId, "b");
  assert.equal(waehleBeispiel([k({ kultivarId: "a", handelsnamen: 2 }), k({ kultivarId: "b", handelsnamen: 5 })])?.kultivarId, "b");
  assert.equal(waehleBeispiel([k({ kultivarId: "z", name: "Zkittlez" }), k({ kultivarId: "m", name: "MAC 1" })])?.kultivarId, "m");
});

test("waehleBeispiel: nur Kultivare mit mindestens zwei Handelsnamen, sonst null", () => {
  assert.equal(waehleBeispiel([k({ handelsnamen: 1, bewerteteVertreiber: 1 })]), null);
  assert.equal(waehleBeispiel([]), null);
});

test("ladeVertreiberBeispiel: jede Abfrage begrenzt, kein Roh-SQL, Liste über ladeVertreiberDerBluete", () => {
  const q = readFileSync("lib/query/vertreiber-beispiel.ts", "utf8");
  assert.doesNotMatch(q, /\$queryRaw|\$executeRaw/);
  // Drei findMany, jede begrenzt: zweimal KANDIDATEN_MAX, einmal 20 (wie der groupBy-Rückfall).
  assert.equal((q.match(/findMany\(/g) ?? []).length, 3);
  assert.equal((q.match(/take: KANDIDATEN_MAX/g) ?? []).length, 2);
  assert.equal((q.match(/take: 20/g) ?? []).length, 2);
  assert.match(q, /ladeVertreiberDerBluete\(/);
});
```

- [ ] **Step 2: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/vertreiber-beispiel.test.ts`
Expected: FAIL, Modul `@/lib/query/vertreiber-beispiel` nicht gefunden.

- [ ] **Step 3: Implementieren**

```ts
// lib/query/vertreiber-beispiel.ts
import { getPrisma } from "@/lib/prisma";
import { ladeVertreiberDerBluete, type VertreiberEintrag } from "@/lib/query/vertreiber";

export type BeispielKandidat = {
  kultivarId: string;
  name: string;
  /** Verschiedene Vertreiber mit mindestens einer bewerteten Charge. */
  bewerteteVertreiber: number;
  /** Summe der Qualitäts-Bewertungen über alle Handelsnamen. */
  bewertungen: number;
  /** Aktive Handelsnamen des Kultivars. */
  handelsnamen: number;
};

export type VertreiberBeispiel = { kultivarId: string; name: string; zeilen: VertreiberEintrag[] };

/** Rangfolge der Spec (Abschnitt 1): nie nach Qualität, nur nach Menge, dann Name. */
export function waehleBeispiel(kandidaten: readonly BeispielKandidat[]): BeispielKandidat | null {
  const tauglich = kandidaten.filter((k) => k.handelsnamen >= 2);
  tauglich.sort(
    (a, b) =>
      b.bewerteteVertreiber - a.bewerteteVertreiber ||
      b.bewertungen - a.bewertungen ||
      b.handelsnamen - a.handelsnamen ||
      a.name.localeCompare(b.name, "de"),
  );
  return tauglich[0] ?? null;
}

const KANDIDATEN_MAX = 200;

async function bewerteteKandidaten(): Promise<BeispielKandidat[]> {
  const prisma = await getPrisma();
  const bewertet = await prisma.sortenKennwerte.findMany({
    where: { qualitaetAnzahl: { gt: 0 }, strain: { aktiv: true, kultivarId: { not: null } } },
    select: { qualitaetAnzahl: true, strain: { select: { kultivarId: true, vertreiberId: true } } },
    take: KANDIDATEN_MAX,
  });
  const jeKultivar = new Map<string, { vertreiber: Set<string>; bewertungen: number }>();
  for (const zeile of bewertet) {
    const id = zeile.strain.kultivarId;
    if (!id) continue;
    const eintrag = jeKultivar.get(id) ?? { vertreiber: new Set<string>(), bewertungen: 0 };
    if (zeile.strain.vertreiberId) eintrag.vertreiber.add(zeile.strain.vertreiberId);
    eintrag.bewertungen += zeile.qualitaetAnzahl;
    jeKultivar.set(id, eintrag);
  }
  const ids = [...jeKultivar.keys()];
  if (ids.length === 0) return [];
  const [zaehlung, namen] = await Promise.all([
    prisma.strain.groupBy({ by: ["kultivarId"], where: { aktiv: true, kultivarId: { in: ids } }, _count: { _all: true } }),
    prisma.kultivar.findMany({ where: { id: { in: ids } }, select: { id: true, name: true }, take: KANDIDATEN_MAX }),
  ]);
  const anzahl = new Map(zaehlung.map((z) => [z.kultivarId ?? "", z._count._all]));
  return namen.map((n) => ({
    kultivarId: n.id,
    name: n.name,
    bewerteteVertreiber: jeKultivar.get(n.id)?.vertreiber.size ?? 0,
    bewertungen: jeKultivar.get(n.id)?.bewertungen ?? 0,
    handelsnamen: anzahl.get(n.id) ?? 0,
  }));
}

/** Ohne bewertete Kandidaten: die Kultivare mit den meisten aktiven Handelsnamen. */
async function groessteKandidaten(): Promise<BeispielKandidat[]> {
  const prisma = await getPrisma();
  const zaehlung = await prisma.strain.groupBy({
    by: ["kultivarId"],
    where: { aktiv: true, kultivarId: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { kultivarId: "desc" } },
    take: 20,
  });
  const ids = zaehlung.map((z) => z.kultivarId).filter((id): id is string => id !== null);
  if (ids.length === 0) return [];
  const namen = await prisma.kultivar.findMany({ where: { id: { in: ids } }, select: { id: true, name: true }, take: 20 });
  const anzahl = new Map(zaehlung.map((z) => [z.kultivarId ?? "", z._count._all]));
  return namen.map((n) => ({ kultivarId: n.id, name: n.name, bewerteteVertreiber: 0, bewertungen: 0, handelsnamen: anzahl.get(n.id) ?? 0 }));
}

/** Beispiel für das Startseiten-Kapitel; null, wenn kein Kultivar zwei Handelsnamen hat. */
export async function ladeVertreiberBeispiel(): Promise<VertreiberBeispiel | null> {
  const sieger = waehleBeispiel(await bewerteteKandidaten()) ?? waehleBeispiel(await groessteKandidaten());
  if (!sieger) return null;
  const zeilen = await ladeVertreiberDerBluete(sieger.kultivarId, "");
  return { kultivarId: sieger.kultivarId, name: sieger.name, zeilen };
}
```

Jede `findMany` muss ein `take` haben; der letzte Test zählt das nach.

- [ ] **Step 4: Tests grün**

Run: `npx tsx --test tests/vertreiber-beispiel.test.ts` → PASS. Dann `npx prisma generate && npx tsc --noEmit -p .` → keine Fehler.

- [ ] **Step 5: Commit**

```bash
git add lib/query/vertreiber-beispiel.ts tests/vertreiber-beispiel.test.ts
git commit -m "feat: Beispielwahl für das Vertreiber-Kapitel der Startseite"
```

### Task A2: Kapitel „Gleiche Blüte, andere Ware“

**Skills:** `ui-design-engine` (+ Datei lesen), `frontend-design`, `design-taste-frontend`, `build-awwwards-quality-sites`, `better-layout`, `better-writing`, `law-of-common-region`, `better-accessibility`

**Files:**
- Create: `components/story/VertreiberBeispielKarte.tsx` (rein darstellend, testbar)
- Create: `components/story/VertreiberKapitel.tsx` (Sektion mit Suspense und Laden)
- Modify: `app/[lang]/page.tsx` (nach `<TransparentMachen />` einfügen)
- Modify: `lib/i18n/de.ts` (nur Block `start`: neuer Unterblock `vertreiber`, in `start.skelett` Schlüssel `vertreiber`)
- Modify: `lib/i18n/en.ts` (dieselben Schlüssel)
- Test: `tests/vertreiber-kapitel.test.ts`

**Interfaces:**
- Consumes: `ladeVertreiberBeispiel`, `VertreiberBeispiel` (Task A1); `BlattAnzeige({ note, text })` aus `components/review/BlattAnzeige`; `Schlagwort` aus `components/story/Schlagwort`; `SkelettAnsage`, `SKELETT_FLAECHE` aus `components/story/Skelette`; `mehrzahl`, `t` aus `lib/i18n/text`; `formatiereZahl` aus `lib/format`; `textLinkKlassen` aus `components/ui/textlink` (wie in `app/[lang]/blueten/page.tsx` genutzt).
- Produces: `VertreiberBeispielKarte({ beispiel, texte, sprache })`, `VertreiberKapitel()`.

- [ ] **Step 1: Texte anlegen (de, im Block `start`)**

```ts
    vertreiber: {
      vor: "Gleiche Blüte,",
      betont: "andere",
      nach: "Ware.",
      schlagwort: "wer liefert",
      absatz:
        "Overall und Terpene beschreiben die Blüte, egal woher sie kommt. Qualität, Restfeuchte und Frische hängen am Vertreiber: wie er lagert und wie frisch seine Charge ist. Darum bewerten wir beides getrennt.",
      beispiel: "Zum Beispiel {name}",
      liste: "Vertreiber von {name}",
      qualitaet: "Qualität {note} von 5",
      anzahl: { one: "{anzahl} Bewertung", other: "{anzahl} Bewertungen" },
      ohneCharge: "noch keine Charge bewertet",
      unbekannt: "Vertreiber unbekannt",
      weitere: { one: "und {anzahl} weiterer Vertreiber", other: "und {anzahl} weitere Vertreiber" },
      zurBluete: "Zur Blüte {name}",
      alleImKatalog: { one: "{anzahl} Vertreiber im Katalog", other: "Alle {anzahl} Vertreiber im Katalog" },
      einladung: "Hast du sie von einem anderen Vertreiber? Deine Charge macht den Vergleich möglich.",
      einladungLink: "Charge von {vertreiber} bewerten",
      hinweis: "Erfahrungen der Mitglieder, keine Empfehlung.",
    },
```

In `start.skelett`: `vertreiber: "Beispiel wird geladen",`

en (gleiche Stelle in `en.ts`):

```ts
    vertreiber: {
      vor: "Same flower,",
      betont: "different",
      nach: "batch.",
      schlagwort: "who supplies",
      absatz:
        "Overall and terpenes describe the flower, wherever it comes from. Quality, moisture and freshness depend on the distributor: how they store it and how fresh their batch is. That is why we rate both separately.",
      beispiel: "For example {name}",
      liste: "Distributors of {name}",
      qualitaet: "Quality {note} of 5",
      anzahl: { one: "{anzahl} rating", other: "{anzahl} ratings" },
      ohneCharge: "no batch rated yet",
      unbekannt: "Distributor unknown",
      weitere: { one: "and {anzahl} more distributor", other: "and {anzahl} more distributors" },
      zurBluete: "Go to {name}",
      alleImKatalog: { one: "{anzahl} distributor in the catalogue", other: "All {anzahl} distributors in the catalogue" },
      einladung: "Got it from another distributor? Your batch makes the comparison possible.",
      einladungLink: "Rate the batch from {vertreiber}",
      hinweis: "Members' experiences, not a recommendation.",
    },
```

In `start.skelett` (en): `vertreiber: "Loading example",`

- [ ] **Step 2: Failing tests schreiben**

```ts
// tests/vertreiber-kapitel.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { VertreiberBeispielKarte } from "@/components/story/VertreiberBeispielKarte";
import { de } from "@/lib/i18n/de";
import type { VertreiberEintrag } from "@/lib/query/vertreiber";

const zeile = (teil: Partial<VertreiberEintrag>): VertreiberEintrag => ({
  slug: "s", handelsname: "H", vertreiberName: "V", qualitaet: null, restfeuchte: null, anzahl: 0, aktuell: false, ...teil,
});
const zeige = (zeilen: VertreiberEintrag[]) =>
  renderToStaticMarkup(
    createElement(VertreiberBeispielKarte, { beispiel: { kultivarId: "abc", name: "MAC 1", zeilen }, texte: de.start.vertreiber, sprache: "de" }),
  );

test("Beispielkarte: zwei bewertete Vertreiber, kein Einladungssatz, Links auf Blüte und Katalog", () => {
  const html = zeige([
    zeile({ slug: "a", handelsname: "Enua MAC", vertreiberName: "Enua", qualitaet: 4.2, anzahl: 3 }),
    zeile({ slug: "b", handelsname: "avaay MAC", vertreiberName: "avaay", qualitaet: 3.1, anzahl: 1 }),
  ]);
  assert.match(html, /MAC 1/);
  assert.match(html, /Enua/);
  assert.match(html, /Qualität 4,2 von 5/);
  assert.match(html, /href="\/blueten\/a"/);
  assert.match(html, /href="\/blueten\?kultivar=abc"/);
  assert.doesNotMatch(html, new RegExp(de.start.vertreiber.einladung));
  assert.match(html, new RegExp(de.start.vertreiber.hinweis));
  assert.doesNotMatch(html, /apotheke|kaufen|bester|beste /i);
});

test("Beispielkarte: ein bewerteter Vertreiber lädt zur Charge eines unbewerteten ein", () => {
  const html = zeige([
    zeile({ slug: "a", vertreiberName: "Enua", qualitaet: 4, anzahl: 2 }),
    zeile({ slug: "b", vertreiberName: "avaay" }),
  ]);
  assert.match(html, new RegExp(de.start.vertreiber.einladung));
  assert.match(html, /href="\/blueten\/b#bewerten"/);
  assert.match(html, /Charge von avaay bewerten/);
  assert.match(html, new RegExp(de.start.vertreiber.ohneCharge));
});

test("Beispielkarte: keiner bewertet, alle Zeilen ohne Charge, Einladung auf die erste Ware", () => {
  const html = zeige([zeile({ slug: "a", vertreiberName: "Enua" }), zeile({ slug: "b", vertreiberName: null })]);
  assert.equal(html.split(de.start.vertreiber.ohneCharge).length - 1, 2);
  assert.match(html, /Vertreiber unbekannt/);
  assert.match(html, /href="\/blueten\/a#bewerten"/);
});

test("Beispielkarte: höchstens vier Zeilen, Rest als Satz", () => {
  const html = zeige(["a", "b", "c", "d", "e", "f"].map((s) => zeile({ slug: s, vertreiberName: s.toUpperCase() })));
  assert.equal((html.match(/<li/g) ?? []).length, 4);
  assert.match(html, /und 2 weitere Vertreiber/);
  assert.match(html, /Alle 6 Vertreiber im Katalog/);
});

test("Beispielkarte: lange Namen brechen um", () => {
  const html = zeige([zeile({ handelsname: "X".repeat(120) }), zeile({ slug: "b" })]);
  assert.match(html, /wrap-break-word/);
});

test("Startseite: Kapitel direkt nach TransparentMachen", () => {
  const q = readFileSync("app/[lang]/page.tsx", "utf8");
  assert.ok(q.indexOf("<TransparentMachen />") < q.indexOf("<VertreiberKapitel />"));
  assert.ok(q.indexOf("<VertreiberKapitel />") < q.indexOf("<TerpenRegister />"));
});

test("VertreiberKapitel: eigene Suspense-Grenze, Schlagwort, Fehler mit unstable_rethrow", () => {
  const q = readFileSync("components/story/VertreiberKapitel.tsx", "utf8");
  assert.match(q, /<Suspense/);
  assert.match(q, /<Schlagwort/);
  assert.match(q, /unstable_rethrow/);
  assert.match(q, /data-story="vertreiber"/);
});
```

- [ ] **Step 3: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/vertreiber-kapitel.test.ts` → FAIL (Modul fehlt).

- [ ] **Step 4: `VertreiberBeispielKarte` implementieren**

```tsx
// components/story/VertreiberBeispielKarte.tsx
import Link from "next/link";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { textLinkKlassen } from "@/components/ui/textlink";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { VertreiberBeispiel } from "@/lib/query/vertreiber-beispiel";

const ZEILEN_MAX = 4;

type Props = { beispiel: VertreiberBeispiel; texte: Woerterbuch["start"]["vertreiber"]; sprache: Sprache };

/**
 * Beispielkarte des Vertreiber-Kapitels (Spec 2026-10-13 Vertreiber sichtbar, Abschnitt 1).
 * Reihenfolge kommt aus ladeVertreiberDerBluete (Bewertungen, dann Name), nie nach Qualität (HWG).
 */
export function VertreiberBeispielKarte({ beispiel, texte, sprache }: Props) {
  const { zeilen } = beispiel;
  const sichtbar = zeilen.slice(0, ZEILEN_MAX);
  const rest = zeilen.length - sichtbar.length;
  const bewertet = zeilen.filter((z) => z.anzahl > 0);
  const meistBewertet = bewertet[0] ?? null;
  const einladen = bewertet.length <= 1 ? (zeilen.find((z) => z.anzahl === 0) ?? null) : null;

  return (
    <div className="flex flex-col gap-6 border border-border-strong bg-surface-raised p-8 shadow-md sm:p-12">
      <p className="font-buch text-h2 font-medium text-balance text-text wrap-break-word">{t(texte.beispiel, { name: beispiel.name })}</p>
      <ul aria-label={t(texte.liste, { name: beispiel.name })} className="flex flex-col divide-y divide-border border-y border-border">
        {sichtbar.map((z) => (
          <li key={z.slug} className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
            <span className="min-w-0">
              <span className="block text-body text-text wrap-break-word">{z.vertreiberName ?? texte.unbekannt}</span>
              <span className="block text-caption text-text-muted wrap-break-word">{z.handelsname}</span>
            </span>
            {z.qualitaet !== null && z.anzahl > 0 ? (
              <span className="flex flex-col gap-2">
                <BlattAnzeige note={z.qualitaet} text={t(texte.qualitaet, { note: formatiereZahl(z.qualitaet, 1, sprache) })} />
                <span className="text-small text-text-muted numeric">{mehrzahl(sprache, texte.anzahl, z.anzahl)}</span>
              </span>
            ) : (
              <span className="text-small text-text-muted">{texte.ohneCharge}</span>
            )}
          </li>
        ))}
      </ul>
      {rest > 0 ? <p className="text-small text-text-muted">{mehrzahl(sprache, texte.weitere, rest)}</p> : null}
      {einladen ? (
        <p className="max-w-[60ch] text-body text-pretty text-text">
          {texte.einladung}{" "}
          <Link prefetch={false} href={`/blueten/${einladen.slug}#bewerten`} className={textLinkKlassen()}>
            {t(texte.einladungLink, { vertreiber: einladen.vertreiberName ?? texte.unbekannt })}
          </Link>
        </p>
      ) : null}
      <p className="flex flex-wrap gap-x-8 gap-y-2 text-body">
        {meistBewertet ? (
          <Link prefetch={false} href={`/blueten/${meistBewertet.slug}`} className={textLinkKlassen()}>
            {t(texte.zurBluete, { name: beispiel.name })}
          </Link>
        ) : null}
        <Link prefetch={false} href={`/blueten?kultivar=${beispiel.kultivarId}`} className={textLinkKlassen()}>
          {mehrzahl(sprache, texte.alleImKatalog, zeilen.length)}
        </Link>
      </p>
      <p className="text-caption text-text-muted">{texte.hinweis}</p>
    </div>
  );
}
```

Prüfe vor dem Schreiben, dass `textLinkKlassen` aus `@/components/ui/textlink` exportiert wird (`grep -n "export function textLinkKlassen" components/ui/textlink.ts*`); sonst den Import nehmen, den `app/[lang]/blueten/page.tsx` nutzt.

- [ ] **Step 5: `VertreiberKapitel` implementieren**

```tsx
// components/story/VertreiberKapitel.tsx
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";

import { Schlagwort } from "@/components/story/Schlagwort";
import { SKELETT_FLAECHE, SkelettAnsage } from "@/components/story/Skelette";
import { VertreiberBeispielKarte } from "@/components/story/VertreiberBeispielKarte";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { ladeVertreiberBeispiel, type VertreiberBeispiel } from "@/lib/query/vertreiber-beispiel";

/** Lädt das Beispiel; leer und Fehler zeigen nur Kopf und Absatz (Spec Abschnitt 1). */
async function Beispiel() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  let beispiel: VertreiberBeispiel | null;
  try {
    beispiel = await ladeVertreiberBeispiel();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("ladeVertreiberBeispiel fehlgeschlagen", fehler);
    return null;
  }
  if (!beispiel) return null;
  return <VertreiberBeispielKarte beispiel={beispiel} texte={w.start.vertreiber} sprache={sprache} />;
}

/** Nach TransparentMachen: wofür die Beschaffenheit zählt (Spec 2026-10-13 Vertreiber sichtbar). */
export async function VertreiberKapitel() {
  const w = await holeWoerterbuch();
  const texte = w.start.vertreiber;
  return (
    <section
      aria-labelledby="vertreiber-kapitel-titel"
      data-story="vertreiber"
      className="relative isolate overflow-x-clip px-4 pt-24 pb-32 sm:px-8 sm:pt-32 sm:pb-48"
    >
      <Schlagwort satz={texte.schlagwort} ton="gruen" />
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-8">
          <h2 id="vertreiber-kapitel-titel" className="font-buch text-kapitel text-balance text-text max-md:text-center">
            {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em> {texte.nach}
          </h2>
          <p className="max-w-[56ch] text-body text-pretty text-text max-md:mx-auto max-md:text-center">{texte.absatz}</p>
        </div>
        <Suspense
          fallback={
            <div role="status" data-skelett="" className="flex flex-col gap-4">
              <SkelettAnsage text={w.start.skelett.vertreiber} />
              <span aria-hidden="true" className={`${SKELETT_FLAECHE} h-96 w-full`} />
            </div>
          }
        >
          <Beispiel />
        </Suspense>
      </div>
    </section>
  );
}
```

Prüfe `hand-betont` und `farbverlauf` gegen `NeuesterEintrag.tsx:85` (gleiches Muster). Der Schlagwort-Ton `gruen` wechselt mit dem `lila` von `TerpenRegister` danach (`ui-design-engine` 4).

- [ ] **Step 6: In die Startseite einhängen**

In `app/[lang]/page.tsx` Import `import { VertreiberKapitel } from "@/components/story/VertreiberKapitel";` ergänzen und direkt nach `<TransparentMachen />` die Zeile `<VertreiberKapitel />` einfügen.

- [ ] **Step 7: Tests grün, Typen grün**

Run: `npx tsx --test tests/vertreiber-kapitel.test.ts` → PASS. `npx tsc --noEmit -p .` → keine Fehler. `npm test` → alles grün (bestehende Story-Tests prüfen evtl. die Sektionsliste; anpassen, wenn ein Test die exakte Reihenfolge der Sektionen festschreibt, und das im Bericht nennen).

- [ ] **Step 8: Commit**

```bash
git add components/story/VertreiberBeispielKarte.tsx components/story/VertreiberKapitel.tsx app/[lang]/page.tsx lib/i18n/de.ts lib/i18n/en.ts tests/vertreiber-kapitel.test.ts
git commit -m "feat: Startseiten-Kapitel Gleiche Blüte, andere Ware"
```

---

## Strang B: Katalog (Worktree `C:\cn-wt\vs-katalog`, Branch `vs-katalog`)

### Task B1: Filter `kultivar` und `ansicht`, Listeneintrag mit Kultivar und Vertreiber

**Skills:** `prisma-client-api`, `edge-stack-master`

**Files:**
- Modify: `lib/query/filter.ts` (Schema, `LEERER_FILTER`, `serialisiereFilter`, `istFilterLeer`)
- Modify: `lib/query/strains.ts` (`baueWhere` exportieren und um `kultivarId` ergänzen; `listenSelect`, `ListenZeile`, `StrainListenEintrag`, `zuListenEintrag` um `kultivarId` und `vertreiberId`)
- Test: `tests/katalog-kultivar-filter.test.ts`

**Interfaces:**
- Produces:
  - `StrainFilter.kultivar: string | undefined`, `StrainFilter.ansicht: "ware" | "bluete"`
  - `export function baueWhere(filter: StrainFilter, fachkreis: boolean): Prisma.StrainWhereInput`
  - `StrainListenEintrag.kultivarId: string | null`, `StrainListenEintrag.vertreiberId: string | null`

- [ ] **Step 1: Failing tests**

```ts
// tests/katalog-kultivar-filter.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { istFilterLeer, parseStrainFilter, serialisiereFilter } from "@/lib/query/filter";

const ID = "ed9c2468f2c9b661441986de9d72f496";

test("kultivar: gültige Id gelesen und geschrieben, Großschreibung normalisiert", () => {
  const f = parseStrainFilter({ kultivar: ID.toUpperCase() });
  assert.equal(f.kultivar, ID);
  assert.equal(serialisiereFilter(f).get("kultivar"), ID);
  assert.equal(istFilterLeer(f), false);
});

test("kultivar: Müll fällt still weg", () => {
  for (const roh of ["", "abc", "x".repeat(40), "'; drop", ["a", "b"]]) {
    assert.equal(parseStrainFilter({ kultivar: roh as string }).kultivar, undefined);
  }
});

test("ansicht: nur bluete umschaltet, Standard ware, nicht in der URL und kein Filter", () => {
  assert.equal(parseStrainFilter({}).ansicht, "ware");
  assert.equal(parseStrainFilter({ ansicht: "quatsch" }).ansicht, "ware");
  const f = parseStrainFilter({ ansicht: "bluete" });
  assert.equal(f.ansicht, "bluete");
  assert.equal(serialisiereFilter(f).get("ansicht"), "bluete");
  assert.equal(serialisiereFilter(parseStrainFilter({})).has("ansicht"), false);
  assert.equal(istFilterLeer(f), true);
});

test("strains.ts: baueWhere exportiert, filtert kultivarId, Liste trägt kultivarId und vertreiberId", () => {
  const q = readFileSync("lib/query/strains.ts", "utf8");
  assert.match(q, /export function baueWhere/);
  assert.match(q, /bedingungen\.kultivarId = filter\.kultivar/);
  assert.match(q, /kultivarId: zeile\.kultivarId/);
  assert.match(q, /vertreiberId: zeile\.vertreiberId/);
});
```

- [ ] **Step 2: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/katalog-kultivar-filter.test.ts` → FAIL.

- [ ] **Step 3: Schema erweitern (`lib/query/filter.ts`)**

Nach `vertreiber: slugListe,` einfügen:

```ts
  /** Kultivar-Id (Spec 2026-10-13 Vertreiber sichtbar 2.1): alle Handelsnamen einer Blüte. */
  kultivar: z
    .unknown()
    .transform((rohwert) => (ersterWert(rohwert) ?? "").trim().toLowerCase())
    .transform((wert) => (/^[0-9a-f-]{32,36}$/.test(wert) ? wert : undefined))
    .catch(undefined),
  /** Ansicht der Liste: je Handelsname (Standard) oder je Blüte (2.3). Kein Filter. */
  ansicht: z
    .unknown()
    .transform((rohwert): "ware" | "bluete" => (ersterWert(rohwert) === "bluete" ? "bluete" : "ware"))
    .catch("ware" as const),
```

`ersterWert` liefert bei einem Array den ersten String; der Test mit `["a","b"]` ergibt `"a"` und fällt durch das Muster. In `LEERER_FILTER` `kultivar: undefined, ansicht: "ware",` ergänzen. In `serialisiereFilter` nach der `vertreiber`-Zeile:

```ts
  if (filter.kultivar) params.set("kultivar", filter.kultivar);
  if (filter.ansicht === "bluete") params.set("ansicht", "bluete");
```

In `istFilterLeer` die Bedingung `&& !filter.kultivar` anhängen (die Ansicht zählt bewusst nicht).

- [ ] **Step 4: `lib/query/strains.ts` erweitern**

- `function baueWhere(` wird `export function baueWhere(`.
- Nach `if (filter.vertreiber.length > 0) ...`: `if (filter.kultivar) bedingungen.kultivarId = filter.kultivar;`
- `listenSelect`: `kultivarId: true, vertreiberId: true,` nach `herstellerBildPfad: true,`.
- `ListenZeile`: `kultivarId: string | null; vertreiberId: string | null;`
- `StrainListenEintrag`: nach `vertreiberName`:

```ts
  /** Blüte (Kultivar) dieses Handelsnamens, für „bei N Vertreibern“. */
  kultivarId: string | null;
  vertreiberId: string | null;
```

- `zuListenEintrag`: `kultivarId: zeile.kultivarId, vertreiberId: zeile.vertreiberId,` nach `vertreiberName`.

Melden Typfehler in Test-Fixtures fehlende Felder (`npx tsc --noEmit -p .`), dort `kultivarId: null, vertreiberId: null` ergänzen.

- [ ] **Step 5: Tests und Typen grün**

Run: `npx tsx --test tests/katalog-kultivar-filter.test.ts` → PASS. `npx prisma generate && npx tsc --noEmit -p .` → ok. `npm test` → grün.

- [ ] **Step 6: Commit**

```bash
git add lib/query/filter.ts lib/query/strains.ts tests/katalog-kultivar-filter.test.ts
git commit -m "feat: Katalogfilter kultivar und Ansicht je Blüte im Filterzustand"
```

### Task B2: Abfragen je Kultivar

**Skills:** `prisma-client-api`, `edge-stack-master`, `cloudflare-d1`

**Files:**
- Create: `lib/query/kultivar-liste.ts`
- Test: `tests/kultivar-liste.test.ts`

**Interfaces:**
- Consumes: `baueWhere`, `StrainFilter`, `StrainListenEintrag` (Task B1); `TREFFER_PRO_SEITE` aus `lib/query/filter.ts`; `istKultivarTyp` aus `lib/enums` bzw. dem Modul, das `strains.ts` für `verenge(istKultivarTyp, "HYBRID")` importiert (Import aus `strains.ts` Kopf übernehmen).
- Produces:
  - `async function ladeVertreiberJeKultivar(kultivarIds: readonly string[]): Promise<Map<string, Set<string>>>`
  - `function weitereVertreiber(eintrag: Pick<StrainListenEintrag, "kultivarId" | "vertreiberId">, jeKultivar: ReadonlyMap<string, ReadonlySet<string>>): number`
  - `type KultivarListenEintrag = { id: string; name: string; typ: KultivarTyp; thcMin: number | null; thcMax: number | null; vertreiber: string[]; handelsnamen: number; overall: number | null; bewertungen: number }`
  - `type KultivarListe = { eintraege: KultivarListenEintrag[]; gesamt: number; seite: number; seitenAnzahl: number }`
  - `function verdichteKultivar(zeile: KultivarZeile): KultivarListenEintrag` (exportiert für Tests, `KultivarZeile` ebenfalls exportiert)
  - `async function ladeKultivarListe(filter: StrainFilter, fachkreis: boolean): Promise<KultivarListe>`

- [ ] **Step 1: Failing tests**

```ts
// tests/kultivar-liste.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { verdichteKultivar, weitereVertreiber, type KultivarZeile } from "@/lib/query/kultivar-liste";

const jeKultivar = new Map([["k1", new Set(["v1", "v2", "v3"])]]);

test("weitereVertreiber: andere Vertreiber derselben Blüte ohne den eigenen", () => {
  assert.equal(weitereVertreiber({ kultivarId: "k1", vertreiberId: "v1" }, jeKultivar), 2);
  assert.equal(weitereVertreiber({ kultivarId: "k1", vertreiberId: null }, jeKultivar), 3);
  assert.equal(weitereVertreiber({ kultivarId: "k2", vertreiberId: "v1" }, jeKultivar), 0);
  assert.equal(weitereVertreiber({ kultivarId: null, vertreiberId: "v1" }, jeKultivar), 0);
});

const zeile = (teil: Partial<KultivarZeile>): KultivarZeile => ({
  id: "k1",
  name: "MAC 1",
  kennwerte: null,
  strains: [],
  ...teil,
});

test("verdichteKultivar: Typ-Mehrheit, THC-Spanne, Vertreiber eindeutig und sortiert, unbekannte fehlen", () => {
  const e = verdichteKultivar(
    zeile({
      kennwerte: { gesamtnoteMittel: 3.8, anzahl: 4 },
      strains: [
        { kultivarTyp: "INDICA", thcMinProzent: 20, thcMaxProzent: 22, vertreiber: { name: "Zeta" } },
        { kultivarTyp: "HYBRID", thcMinProzent: 18, thcMaxProzent: 25, vertreiber: { name: "Alpha" } },
        { kultivarTyp: "INDICA", thcMinProzent: 24, thcMaxProzent: 26, vertreiber: { name: "Zeta" } },
        { kultivarTyp: "INDICA", thcMinProzent: 21, thcMaxProzent: 21, vertreiber: null },
      ],
    }),
  );
  assert.equal(e.typ, "INDICA");
  assert.equal(e.thcMin, 18);
  assert.equal(e.thcMax, 26);
  assert.deepEqual(e.vertreiber, ["Alpha", "Zeta"]);
  assert.equal(e.handelsnamen, 4);
  assert.equal(e.overall, 3.8);
  assert.equal(e.bewertungen, 4);
});

test("verdichteKultivar: ohne Kennwerte kein Overall, ohne Handelsnamen keine Spanne", () => {
  const e = verdichteKultivar(zeile({}));
  assert.equal(e.overall, null);
  assert.equal(e.bewertungen, 0);
  assert.equal(e.thcMin, null);
  assert.equal(e.typ, "HYBRID");
});

test("kultivar-liste.ts: groupBy statt Schleife, jede findMany mit take, Blätterung wie die Liste", () => {
  const q = readFileSync("lib/query/kultivar-liste.ts", "utf8");
  assert.match(q, /groupBy\(\{\s*by: \["kultivarId", "vertreiberId"\]/);
  assert.match(q, /strains: \{ some: /);
  assert.match(q, /orderBy: \{ name: "asc" \}/);
  assert.match(q, /take: TREFFER_PRO_SEITE/);
  assert.doesNotMatch(q, /for \([^)]*\) \{[^}]*await/);
});
```

- [ ] **Step 2: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/kultivar-liste.test.ts` → FAIL.

- [ ] **Step 3: Implementieren**

```ts
// lib/query/kultivar-liste.ts
import { getPrisma } from "@/lib/prisma";
import { TREFFER_PRO_SEITE, type StrainFilter } from "@/lib/query/filter";
import { baueWhere, type StrainListenEintrag } from "@/lib/query/strains";
// istKultivarTyp und KultivarTyp: denselben Import wie lib/query/strains.ts verwenden.
import { istKultivarTyp, type KultivarTyp } from "@/db/enums";

/** Je Kultivar die Ids seiner Vertreiber mit aktivem Handelsnamen (ohne unbekannte). */
export async function ladeVertreiberJeKultivar(kultivarIds: readonly string[]): Promise<Map<string, Set<string>>> {
  const ids = [...new Set(kultivarIds)];
  const ergebnis = new Map<string, Set<string>>();
  if (ids.length === 0) return ergebnis;
  const prisma = await getPrisma();
  const gruppen = await prisma.strain.groupBy({
    by: ["kultivarId", "vertreiberId"],
    where: { aktiv: true, kultivarId: { in: ids }, vertreiberId: { not: null } },
  });
  for (const g of gruppen) {
    if (!g.kultivarId || !g.vertreiberId) continue;
    const menge = ergebnis.get(g.kultivarId) ?? new Set<string>();
    menge.add(g.vertreiberId);
    ergebnis.set(g.kultivarId, menge);
  }
  return ergebnis;
}

/** „auch bei N weiteren Vertreibern“: Vertreiber derselben Blüte ohne den eigenen (Spec 2.2). */
export function weitereVertreiber(
  eintrag: Pick<StrainListenEintrag, "kultivarId" | "vertreiberId">,
  jeKultivar: ReadonlyMap<string, ReadonlySet<string>>,
): number {
  if (!eintrag.kultivarId) return 0;
  const menge = jeKultivar.get(eintrag.kultivarId);
  if (!menge) return 0;
  return menge.size - (eintrag.vertreiberId && menge.has(eintrag.vertreiberId) ? 1 : 0);
}

export type KultivarZeile = {
  id: string;
  name: string;
  kennwerte: { gesamtnoteMittel: number | null; anzahl: number } | null;
  strains: { kultivarTyp: string; thcMinProzent: number; thcMaxProzent: number; vertreiber: { name: string } | null }[];
};

export type KultivarListenEintrag = {
  id: string;
  name: string;
  typ: KultivarTyp;
  thcMin: number | null;
  thcMax: number | null;
  /** Vertreibernamen, eindeutig, alphabetisch; unbekannte fehlen. */
  vertreiber: string[];
  handelsnamen: number;
  overall: number | null;
  bewertungen: number;
};

export type KultivarListe = { eintraege: KultivarListenEintrag[]; gesamt: number; seite: number; seitenAnzahl: number };

/** Typ-Mehrheit (Gleichstand: alphabetisch), THC-Spanne und Vertreiber einer Kultivarzeile. */
export function verdichteKultivar(zeile: KultivarZeile): KultivarListenEintrag {
  const typen = new Map<string, number>();
  for (const s of zeile.strains) typen.set(s.kultivarTyp, (typen.get(s.kultivarTyp) ?? 0) + 1);
  const mehrheit = [...typen].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
  const typ: KultivarTyp = mehrheit && istKultivarTyp(mehrheit) ? mehrheit : "HYBRID";
  const vertreiber = [...new Set(zeile.strains.flatMap((s) => (s.vertreiber ? [s.vertreiber.name] : [])))].sort((a, b) =>
    a.localeCompare(b, "de"),
  );
  return {
    id: zeile.id,
    name: zeile.name,
    typ,
    thcMin: zeile.strains.length > 0 ? Math.min(...zeile.strains.map((s) => s.thcMinProzent)) : null,
    thcMax: zeile.strains.length > 0 ? Math.max(...zeile.strains.map((s) => s.thcMaxProzent)) : null,
    vertreiber,
    handelsnamen: zeile.strains.length,
    overall: zeile.kennwerte?.anzahl ? zeile.kennwerte.gesamtnoteMittel : null,
    bewertungen: zeile.kennwerte?.anzahl ?? 0,
  };
}

/** Ansicht je Blüte (Spec 2.3): Kultivare mit mindestens einem passenden Handelsnamen, nach Name. */
export async function ladeKultivarListe(filter: StrainFilter, fachkreis: boolean): Promise<KultivarListe> {
  const prisma = await getPrisma();
  const strainWhere = baueWhere(filter, fachkreis);
  const where = { strains: { some: strainWhere } };
  const seite = Math.max(1, filter.seite);
  const [zeilen, gesamt] = await Promise.all([
    prisma.kultivar.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (seite - 1) * TREFFER_PRO_SEITE,
      take: TREFFER_PRO_SEITE,
      select: {
        id: true,
        name: true,
        kennwerte: { select: { gesamtnoteMittel: true, anzahl: true } },
        strains: {
          where: strainWhere,
          select: { kultivarTyp: true, thcMinProzent: true, thcMaxProzent: true, vertreiber: { select: { name: true } } },
          take: 50,
        },
      },
    }),
    prisma.kultivar.count({ where }),
  ]);
  return {
    eintraege: zeilen.map(verdichteKultivar),
    gesamt,
    seite,
    seitenAnzahl: Math.max(1, Math.ceil(gesamt / TREFFER_PRO_SEITE)),
  };
}
```

Vor dem Schreiben: `grep -n "istKultivarTyp\|KultivarTyp" lib/query/strains.ts | head` und denselben Importpfad verwenden. Ist `istKultivarTyp` dort nicht exportiert, aus seinem Ursprungsmodul importieren.

- [ ] **Step 4: Tests und Typen grün**

Run: `npx tsx --test tests/kultivar-liste.test.ts` → PASS. `npx tsc --noEmit -p .` → ok.

- [ ] **Step 5: Commit**

```bash
git add lib/query/kultivar-liste.ts tests/kultivar-liste.test.ts
git commit -m "feat: Abfragen je Kultivar für Katalogkarte und Blüten-Ansicht"
```

### Task B3: Katalog-Oberfläche

**Skills:** `ui-design-engine` (+ Datei lesen), `frontend-design`, `better-layout`, `better-writing`, `better-accessibility`, `law-of-similarity`, `hicks-law`, `jakobs-law`

**Files:**
- Create: `components/produkt/KultivarKarte.tsx`
- Create: `components/produkt/AnsichtUmschalter.tsx`
- Modify: `components/produkt/ProduktCard.tsx` (optional `weitereVertreiber`)
- Modify: `components/produkt/AktiveFilter.tsx` (Chip „Blüte“, Prop `kultivarName`)
- Modify: `components/produkt/FilterLeiste.tsx` (Sortierwahl in Blüten-Ansicht ausblenden; Zurücksetzen behält `ansicht`)
- Modify: `app/[lang]/blueten/page.tsx` (Ansicht wählen, Zählung, Kultivar-Name, `weitereVertreiber`)
- Modify: `components/story/Katalog.tsx` (`weitereVertreiber` auch auf der Startseite)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (nur Block `katalog`)
- Test: `tests/katalog-bluete-ansicht.test.ts`

**Interfaces:**
- Consumes: Task B1 (`StrainFilter.kultivar`, `.ansicht`, `StrainListenEintrag.kultivarId/vertreiberId`), Task B2 (`ladeVertreiberJeKultivar`, `weitereVertreiber`, `ladeKultivarListe`, `KultivarListenEintrag`), `BlattAnzeige`, `Badge`, `Card`, `CardBody` aus `components/ui`, `serialisiereFilter`.
- Produces: `KultivarKarte({ kultivar, filter, w, sprache })`, `AnsichtUmschalter({ filter, texte })`, `ProduktCard` Prop `weitereVertreiber?: number`, `AktiveFilter` Prop `kultivarName?: string | null`.

- [ ] **Step 1: Texte (de, Block `katalog`)**

Unter `katalog.karte` ergänzen:

```ts
      weitereVertreiber: { one: "auch bei {anzahl} weiteren Vertreiber", other: "auch bei {anzahl} weiteren Vertreibern" },
```

Unter `katalog.aktiv` ergänzen:

```ts
      kultivar: "Blüte: {wert}",
      kultivarBeschreibung: "Blüte {wert}",
```

Neuer Unterblock `katalog.ansicht`:

```ts
    ansicht: {
      titel: "Ansicht",
      ware: "Handelsnamen",
      bluete: "Blüten",
    },
```

Neuer Unterblock `katalog.kultivar`:

```ts
    kultivar: {
      anzahl: { one: "{anzahl} Blüte", other: "{anzahl} Blüten" },
      handelsnamen: { one: "{anzahl} Handelsname ansehen", other: "{anzahl} Handelsnamen ansehen" },
      vertreiber: { one: "bei {anzahl} Vertreiber", other: "bei {anzahl} Vertreibern" },
      mehrVertreiber: "+{anzahl}",
      vertreiberUnbekannt: "Vertreiber unbekannt",
      overall: "Overall {note} von 5",
      bewertungen: { one: "{anzahl} Bewertung", other: "{anzahl} Bewertungen" },
      thc: "{von} bis {bis} % THC",
    },
```

en im selben Block:

```ts
      weitereVertreiber: { one: "also from {anzahl} other distributor", other: "also from {anzahl} other distributors" },
      kultivar: "Flower: {wert}",
      kultivarBeschreibung: "Flower {wert}",
    ansicht: { titel: "View", ware: "Products", bluete: "Flowers" },
    kultivar: {
      anzahl: { one: "{anzahl} flower", other: "{anzahl} flowers" },
      handelsnamen: { one: "View {anzahl} product", other: "View {anzahl} products" },
      vertreiber: { one: "from {anzahl} distributor", other: "from {anzahl} distributors" },
      mehrVertreiber: "+{anzahl}",
      vertreiberUnbekannt: "Distributor unknown",
      overall: "Overall {note} of 5",
      bewertungen: { one: "{anzahl} rating", other: "{anzahl} ratings" },
      thc: "{von} to {bis} % THC",
    },
```

(Die beiden ersten en-Zeilen gehören in `katalog.karte` bzw. `katalog.aktiv`, genau wie im Deutschen.)

- [ ] **Step 2: Failing tests**

```ts
// tests/katalog-bluete-ansicht.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AktiveFilter } from "@/components/produkt/AktiveFilter";
import { AnsichtUmschalter } from "@/components/produkt/AnsichtUmschalter";
import { KultivarKarte } from "@/components/produkt/KultivarKarte";
import { de } from "@/lib/i18n/de";
import { parseStrainFilter } from "@/lib/query/filter";

const ID = "ed9c2468f2c9b661441986de9d72f496";
const kultivar = {
  id: ID, name: "Black Cherry Punch", typ: "INDICA" as const, thcMin: 20, thcMax: 30,
  vertreiber: ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta"], handelsnamen: 7, overall: 3.8, bewertungen: 4,
};

test("AnsichtUmschalter: zwei Links, aktuelle Ansicht mit aria-current, Wechsel auf Seite 1 mit übrigen Filtern", () => {
  const filter = parseStrainFilter({ typ: "INDICA", seite: "3" });
  const html = renderToStaticMarkup(createElement(AnsichtUmschalter, { filter, texte: de.katalog.ansicht }));
  assert.match(html, /aria-current="page"[^>]*>Handelsnamen/);
  assert.match(html, /href="\/blueten\?typ=INDICA&amp;ansicht=bluete"/);
  assert.doesNotMatch(html, /seite=3/);
});

test("KultivarKarte: Name, Typ, Spanne, fünf Vertreiber plus Rest, Overall, Link mit Filter", () => {
  const filter = parseStrainFilter({ typ: "INDICA", ansicht: "bluete" });
  const html = renderToStaticMarkup(createElement(KultivarKarte, { kultivar, filter, w: de, sprache: "de" }));
  assert.match(html, /Black Cherry Punch/);
  assert.match(html, /Indica/i);
  assert.match(html, /20 bis 30 % THC/);
  assert.match(html, /Epsilon/);
  assert.doesNotMatch(html, /Zeta/);
  assert.match(html, /\+2/);
  assert.match(html, /Overall 3,8 von 5/);
  assert.match(html, new RegExp(`href="/blueten\\?typ=INDICA&amp;kultivar=${ID}"`));
  assert.match(html, /7 Handelsnamen ansehen/);
  assert.match(html, /wrap-break-word/);
});

test("KultivarKarte: ohne Bewertung kein Overall, ohne Vertreiber der Ersatztext", () => {
  const html = renderToStaticMarkup(
    createElement(KultivarKarte, { kultivar: { ...kultivar, vertreiber: [], overall: null, bewertungen: 0 }, filter: parseStrainFilter({}), w: de, sprache: "de" }),
  );
  assert.doesNotMatch(html, /Overall/);
  assert.match(html, /Vertreiber unbekannt/);
});

test("AktiveFilter: Chip Blüte mit Namen, unbekannte Id als unbekannt, Entfernen behält Ansicht", () => {
  const filter = parseStrainFilter({ kultivar: ID, ansicht: "bluete" });
  const mit = renderToStaticMarkup(createElement(AktiveFilter, { filter, kultivarName: "Black Cherry Punch", w: de, sprache: "de" }));
  assert.match(mit, /Blüte: Black Cherry Punch/);
  assert.match(mit, /href="\/blueten\?ansicht=bluete"/);
  const ohne = renderToStaticMarkup(createElement(AktiveFilter, { filter, kultivarName: null, w: de, sprache: "de" }));
  assert.match(ohne, /Blüte: unbekannt/);
});

test("ProduktCard: Link auf die anderen Vertreiber nur mit Zahl größer null", () => {
  const q = readFileSync("components/produkt/ProduktCard.tsx", "utf8");
  assert.match(q, /weitereVertreiber/);
  assert.match(q, /\/blueten\?kultivar=\$\{strain\.kultivarId\}/);
});

test("Katalogseite: Ansicht schaltet die Abfrage, Startseite reicht weitereVertreiber durch", () => {
  const seite = readFileSync("app/[lang]/blueten/page.tsx", "utf8");
  assert.match(seite, /filter\.ansicht === "bluete"/);
  assert.match(seite, /ladeKultivarListe\(/);
  assert.match(seite, /ladeVertreiberJeKultivar\(/);
  assert.match(seite, /<AnsichtUmschalter/);
  const start = readFileSync("components/story/Katalog.tsx", "utf8");
  assert.match(start, /weitereVertreiber=/);
});

test("FilterLeiste: Sortierwahl nicht in der Blüten-Ansicht, Zurücksetzen behält die Ansicht", () => {
  const q = readFileSync("components/produkt/FilterLeiste.tsx", "utf8");
  assert.match(q, /filter\.ansicht === "bluete" \? null :/);
  assert.match(q, /ansicht: filter\.ansicht/);
});
```

- [ ] **Step 3: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/katalog-bluete-ansicht.test.ts` → FAIL.

- [ ] **Step 4: `AnsichtUmschalter`**

```tsx
// components/produkt/AnsichtUmschalter.tsx
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { serialisiereFilter, type StrainFilter } from "@/lib/query/filter";

type Props = { filter: StrainFilter; texte: Woerterbuch["katalog"]["ansicht"] };

const ANSICHTEN = ["ware", "bluete"] as const;

/** Handelsnamen | Blüten (Spec 2.3): zwei Links, ohne JS; ein Wechsel führt auf Seite 1. */
export function AnsichtUmschalter({ filter, texte }: Props) {
  return (
    <nav aria-label={texte.titel}>
      <ul className="flex flex-wrap gap-2">
        {ANSICHTEN.map((ansicht) => {
          const aktiv = filter.ansicht === ansicht;
          const ziel = serialisiereFilter({ ...filter, ansicht, seite: 1 }).toString();
          return (
            <li key={ansicht}>
              <Link
                prefetch={false}
                href={ziel ? `/blueten?${ziel}` : "/blueten"}
                aria-current={aktiv ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-small transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                  aktiv ? "border-accent bg-accent text-accent-fg" : "border-border-strong bg-surface-raised text-text hover:border-accent-hover",
                )}
              >
                {ansicht === "ware" ? texte.ware : texte.bluete}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

Hinweis zur Reihenfolge der Parameter: `serialisiereFilter` schreibt `typ` vor `kultivar` vor `ansicht`; die Test-Erwartungen folgen dieser Reihenfolge. Weicht sie ab, den Test an die tatsächliche Reihenfolge von `serialisiereFilter` anpassen, nicht die Funktion umbauen.

- [ ] **Step 5: `KultivarKarte`**

```tsx
// components/produkt/KultivarKarte.tsx
import Link from "next/link";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { Badge, Card, CardBody } from "@/components/ui";
import { textLinkKlassen } from "@/components/ui/textlink";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { serialisiereFilter, type StrainFilter } from "@/lib/query/filter";
import type { KultivarListenEintrag } from "@/lib/query/kultivar-liste";

const VERTREIBER_MAX = 5;

type Props = { kultivar: KultivarListenEintrag; filter: StrainFilter; w: Woerterbuch; sprache: Sprache };

/** Karte je Blüte (Spec 2.3), ohne Bild: es gibt kein Bild je Kultivar. */
export function KultivarKarte({ kultivar, filter, w, sprache }: Props) {
  const texte = w.katalog.kultivar;
  const sichtbar = kultivar.vertreiber.slice(0, VERTREIBER_MAX);
  const rest = kultivar.vertreiber.length - sichtbar.length;
  const ziel = serialisiereFilter({ ...filter, kultivar: kultivar.id, ansicht: "ware", seite: 1 }).toString();
  return (
    <Card className="flex w-full flex-col">
      <CardBody className="flex flex-1 flex-col gap-4">
        <h3 className="font-buch text-h3 text-text wrap-break-word">{kultivar.name}</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variante="neutral">{w.label.kultivarTyp[kultivar.typ]}</Badge>
        </div>
        {kultivar.thcMin !== null && kultivar.thcMax !== null ? (
          <p className="numeric text-small text-text">
            {t(texte.thc, { von: formatiereZahl(kultivar.thcMin, 0, sprache), bis: formatiereZahl(kultivar.thcMax, 0, sprache) })}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <p className="text-small text-text-muted">{mehrzahl(sprache, texte.vertreiber, kultivar.vertreiber.length)}</p>
          {sichtbar.length > 0 ? (
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-small text-text">
              {sichtbar.map((name) => (
                <li key={name} className="wrap-break-word">{name}</li>
              ))}
              {rest > 0 ? <li className="text-text-muted">{t(texte.mehrVertreiber, { anzahl: rest })}</li> : null}
            </ul>
          ) : (
            <p className="text-small text-text-muted">{texte.vertreiberUnbekannt}</p>
          )}
        </div>
        {kultivar.overall !== null ? (
          <div className="flex flex-col gap-2">
            <BlattAnzeige note={kultivar.overall} text={t(texte.overall, { note: formatiereZahl(kultivar.overall, 1, sprache) })} />
            <span className="text-small text-text-muted numeric">{mehrzahl(sprache, texte.bewertungen, kultivar.bewertungen)}</span>
          </div>
        ) : null}
        <p className="mt-auto text-body">
          <Link prefetch={false} href={`/blueten?${ziel}`} className={textLinkKlassen()}>
            {mehrzahl(sprache, texte.handelsnamen, kultivar.handelsnamen)}
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}
```

Prüfe die Signatur von `formatiereZahl(wert, stellen, sprache)` in `lib/format.ts`; der Vertreiber-Vergleich nutzt sie genauso.

- [ ] **Step 6: `ProduktCard` erweitern**

Props: `/** Andere Vertreiber derselben Blüte (Spec 2.2); 0 oder fehlend: kein Link. */ weitereVertreiber?: number;` mit Default `weitereVertreiber = 0` in der Signatur. Im `CardFooter` die `span` mit dem Vertreibernamen ersetzen durch:

```tsx
        <span className="flex min-w-0 flex-col gap-2">
          <span className="text-small text-text-muted wrap-break-word">
            {strain.vertreiberName ?? w.katalog.karte.vertreiberUnbekannt}
          </span>
          {weitereVertreiber > 0 && strain.kultivarId ? (
            <Link prefetch={false} href={`/blueten?kultivar=${strain.kultivarId}`} className={textLinkKlassen()}>
              <span className="text-small">{mehrzahl(sprache, w.katalog.karte.weitereVertreiber, weitereVertreiber)}</span>
            </Link>
          ) : null}
        </span>
```

Imports `textLinkKlassen` und `mehrzahl` ergänzen.

- [ ] **Step 7: `AktiveFilter` erweitern**

Prop `/** Name der Blüte zum Filter kultivar; null: unbekannt. */ kultivarName?: string | null;`. Nach der Vertreiber-Schleife:

```tsx
  if (filter.kultivar) {
    const name = kultivarName ?? texte.vertreiberUnbekannt;
    chips.push({
      schluessel: "kultivar",
      text: t(texte.kultivar, { wert: name }),
      beschreibung: t(texte.kultivarBeschreibung, { wert: name }),
      ziel: ohne({ kultivar: undefined }),
    });
  }
```

(`texte.vertreiberUnbekannt` ist im Block `katalog.aktiv` das Wort „unbekannt“.)

- [ ] **Step 8: `FilterLeiste` anpassen**

Die `<Select id={`${basisId}-sortierung`} …/>` in `{filter.ansicht === "bluete" ? null : ( … )}` einschließen. Den Zurücksetzen-Aufruf ändern zu `schreibe({ ...leererFilter(), sortierung: filter.sortierung, ansicht: filter.ansicht })`.

- [ ] **Step 9: Katalogseite verdrahten (`app/[lang]/blueten/page.tsx`)**

In `Ergebnisbereich`:

```tsx
  const bluetenAnsicht = filter.ansicht === "bluete";
  const [liste, kultivare, facetten, zugang, kultivarName] = await Promise.all([
    bluetenAnsicht ? null : ladeStrainListe(filter, fachkreis),
    bluetenAnsicht ? ladeKultivarListe(filter, fachkreis) : null,
    ladeFilterFacetten(fachkreis),
    budpicZugang(),
    filter.kultivar
      ? getPrisma().then((p) => p.kultivar.findUnique({ where: { id: filter.kultivar! }, select: { name: true } })).then((k) => k?.name ?? null)
      : Promise.resolve(null),
  ]);
  const eintraege = liste?.eintraege ?? [];
  const [budpics, jeKultivar] = await Promise.all([
    ladeFreieBudpics(eintraege.map((e) => e.id)),
    filter.kultivar ? Promise.resolve(new Map<string, Set<string>>()) : ladeVertreiberJeKultivar(eintraege.flatMap((e) => (e.kultivarId ? [e.kultivarId] : []))),
  ]);
  const gesamt = liste?.gesamt ?? kultivare?.gesamt ?? 0;
  const seite = liste?.seite ?? kultivare?.seite ?? 1;
  const seitenAnzahl = liste?.seitenAnzahl ?? kultivare?.seitenAnzahl ?? 1;
  const sichtbar = liste?.eintraege.length ?? kultivare?.eintraege.length ?? 0;
```

- Trefferzeile: in der Blüten-Ansicht `mehrzahl(sprache, texte.kultivar.anzahl, gesamt)`, sonst wie bisher mit `gesamt` und `sichtbar`.
- Über der Trefferzeile `<AnsichtUmschalter filter={filter} texte={texte.ansicht} />`.
- `AktiveFilter` bekommt `kultivarName={kultivarName}`.
- `FilterLeiste` bekommt `gesamt={gesamt}`.
- Leerzustand: Bedingung `sichtbar === 0`.
- Liste: in der Blüten-Ansicht `kultivare.eintraege.map((k) => <li key={k.id} className="flex"><KultivarKarte kultivar={k} filter={filter} w={w} sprache={sprache} /></li>)`, sonst die `ProduktCard`-Liste mit zusätzlich `weitereVertreiber={weitereVertreiber(strain, jeKultivar)}`.
- Blätterung nutzt `seite` und `seitenAnzahl` statt `liste.seite`/`liste.seitenAnzahl`.
- Imports: `getPrisma` aus `@/lib/prisma`, `ladeKultivarListe`, `ladeVertreiberJeKultivar`, `weitereVertreiber` aus `@/lib/query/kultivar-liste`, `KultivarKarte`, `AnsichtUmschalter`.

Den Kultivar-Namen nicht als eigene Funktion in `strains.ts` anlegen (Strang-Grenze); die Zeile oben reicht. Wer sie lesbarer will: kleine Hilfsfunktion `ladeKultivarName(id)` in `lib/query/kultivar-liste.ts`, mit `findUnique` und `select: { name: true }`.

- [ ] **Step 10: Startseite `components/story/Katalog.tsx`**

Nach dem Zuschnitt der `eintraege`: 

```tsx
  const jeKultivar = await sicher(
    () => ladeVertreiberJeKultivar(eintraege.flatMap((e) => (e.kultivarId ? [e.kultivarId] : []))),
    new Map<string, Set<string>>(),
    "Katalog-Vertreiber",
  );
```

und an `ProduktCard` `weitereVertreiber={weitereVertreiber(strain, jeKultivar)}` übergeben. Import aus `@/lib/query/kultivar-liste`.

- [ ] **Step 11: Tests, Typen, alle Tests**

Run: `npx tsx --test tests/katalog-bluete-ansicht.test.ts` → PASS. `npx tsc --noEmit -p .` → ok. `npm test` → grün.

- [ ] **Step 12: Commit**

```bash
git add components/produkt/KultivarKarte.tsx components/produkt/AnsichtUmschalter.tsx components/produkt/ProduktCard.tsx components/produkt/AktiveFilter.tsx components/produkt/FilterLeiste.tsx app/[lang]/blueten/page.tsx components/story/Katalog.tsx lib/i18n/de.ts lib/i18n/en.ts tests/katalog-bluete-ansicht.test.ts
git commit -m "feat: Katalog zeigt Vertreiber je Blüte und eine Ansicht je Blüte"
```

---

## Strang C: Blütenseite und Reviews (Worktree `C:\cn-wt\vs-bluete`, Branch `vs-bluete`)

### Task C1: Vertreiber-Vergleich immer

**Skills:** `ui-design-engine` (+ Datei lesen), `better-writing`, `better-layout`, `better-accessibility`

**Files:**
- Modify: `components/review/VertreiberVergleich.tsx`
- Modify: `app/[lang]/blueten/[slug]/page.tsx:376-381` (Bedingung und Props)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (nur Block `bluete.vertreiber`)
- Modify: `tests/vertreiber-bluete.test.ts` (Erwartung „entfällt bei einem“ ersetzen)

**Interfaces:**
- Consumes: `VertreiberEintrag` aus `lib/query/vertreiber.ts` (unverändert).
- Produces: `VertreiberVergleich({ eintraege, kultivarId, texte, sprache })` – neue Pflicht-Prop `kultivarId: string`; rendert `null` nur bei leerer Liste.

- [ ] **Step 1: Texte (de, `bluete.vertreiber`)**

`vergleichSatz` ersetzen durch:

```ts
      vergleichSatz: "Overall und Terpene zählen für die Blüte, Qualität, Restfeuchte und Frische für den Vertreiber. Erfahrungen der Mitglieder, keine Empfehlung.",
```

Neu:

```ts
      nurEiner: "Bisher kennen wir sie nur von {vertreiber}.",
      alleImKatalog: "Alle im Katalog",
```

en:

```ts
      vergleichSatz: "Overall and terpenes count for the flower; quality, moisture and freshness count for the distributor. Members' experiences, not a recommendation.",
      nurEiner: "So far we only know it from {vertreiber}.",
      alleImKatalog: "All in the catalogue",
```

- [ ] **Step 2: Tests anpassen und ergänzen (`tests/vertreiber-bluete.test.ts`)**

Den Test „VertreiberVergleich: entfällt bei nur einem Handelsnamen …“ ersetzen durch:

```ts
test("VertreiberVergleich: leer entfällt, ein Eintrag nennt den einen Vertreiber, sonst Zeile je Vertreiber ohne Kauflink", () => {
  const p = { kultivarId: "k1", texte: de.bluete.vertreiber, sprache: "de" as const };
  assert.equal(renderToStaticMarkup(createElement(VertreiberVergleich, { ...p, eintraege: [] })), "");
  const einer = renderToStaticMarkup(createElement(VertreiberVergleich, { ...p, eintraege: [eintraege[1]] }));
  assert.match(einer, /Bisher kennen wir sie nur von avaay\./);
  assert.match(einer, /href="\/vorschlagen\?kultivar=k1"/);
  assert.doesNotMatch(einer, /<ul/);
  assert.doesNotMatch(einer, /href="\/blueten\?kultivar=k1"/);
  const html = renderToStaticMarkup(createElement(VertreiberVergleich, { ...p, eintraege }));
  assert.match(html, /Enua Pharma GmbH/);
  assert.match(html, /11,5/);
  assert.match(html, /href="\/vorschlagen\?kultivar=k1"/);
  assert.match(html, /href="\/blueten\?kultivar=k1"/);
  assert.doesNotMatch(html, /apotheke|kaufen/i);
});
```

Im Test „die Zeile der angezeigten Ware trägt „diese Ware““ und überall, wo `VertreiberVergleich` gerendert wird, `kultivarId: "k1"` ergänzen. Den Seiten-Test „Blütenseite: …“ ergänzen um:

```ts
  assert.match(q, /vertreiberListe\.length > 0 && strain\.kultivar/);
  assert.match(q, /kultivarId=\{strain\.kultivar\.id\}/);
```

- [ ] **Step 3: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/vertreiber-bluete.test.ts` → FAIL.

- [ ] **Step 4: `VertreiberVergleich` umbauen**

```tsx
import Link from "next/link";

import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { textLinkKlassen } from "@/components/ui/textlink";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl, t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { VertreiberEintrag } from "@/lib/query/vertreiber";

type Props = { eintraege: readonly VertreiberEintrag[]; kultivarId: string; texte: Woerterbuch["bluete"]["vertreiber"]; sprache: Sprache };

/**
 * „Diese Blüte bei anderen Vertreibern“ (Spec 2026-10-13): neutral, ohne Kauf- oder Apothekenlink (HWG).
 * Seit Spec „Vertreiber sichtbar“ 3 auch mit nur einem Vertreiber, damit fehlende vorgeschlagen werden.
 */
export function VertreiberVergleich({ eintraege, kultivarId, texte, sprache }: Props) {
  if (eintraege.length === 0) return null;
  const einer = eintraege.length === 1 ? eintraege[0] : null;
  return (
    <section aria-labelledby="vertreiber-vergleich-titel" className="flex flex-col gap-6">
      <h3 id="vertreiber-vergleich-titel" className="text-h3 text-text">
        {texte.vergleichTitel}
      </h3>
      <p className="max-w-[68ch] text-small text-text-muted text-pretty">{texte.vergleichSatz}</p>
      {einer ? (
        <p className="text-body text-text wrap-break-word">{t(texte.nurEiner, { vertreiber: einer.vertreiberName ?? texte.unbekannt })}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {/* Zeilen unverändert aus der bisherigen Fassung übernehmen (li mit Name, Handelsname, „diese Ware“, BlattAnzeige oder ohneQualitaet, Restfeuchte und Anzahl). */}
        </ul>
      )}
      <p className="flex flex-wrap gap-x-8 gap-y-2 text-body">
        <Link prefetch={false} href={`/vorschlagen?kultivar=${kultivarId}`} className={textLinkKlassen()}>
          {texte.fehlt}
        </Link>
        {einer ? null : (
          <Link prefetch={false} href={`/blueten?kultivar=${kultivarId}`} className={textLinkKlassen()}>
            {texte.alleImKatalog}
          </Link>
        )}
      </p>
    </section>
  );
}
```

Der Kommentar im `<ul>` ist nur Anweisung an dich: dort exakt die bisherigen `eintraege.map((e) => <li …>)`-Zeilen aus der aktuellen Datei einsetzen, nichts daran ändern. `VertreiberWahl.tsx:61` nutzt für denselben Vorschlag `namenLinkKlassen()`; hier gilt `textLinkKlassen()`, weil der Link im Fließtext steht. Prüfe den Export mit `grep -n "export function textLinkKlassen" components/ui/textlink.ts*`.

- [ ] **Step 5: Blütenseite**

In `app/[lang]/blueten/[slug]/page.tsx` den Block

```tsx
      {vertreiberListe.length > 1 ? (
        <div className={SEKTION}>
          <VertreiberVergleich eintraege={vertreiberListe} texte={texte.vertreiber} sprache={sprache} />
        </div>
      ) : null}
```

ersetzen durch

```tsx
      {vertreiberListe.length > 0 && strain.kultivar ? (
        <div className={SEKTION}>
          <VertreiberVergleich eintraege={vertreiberListe} kultivarId={strain.kultivar.id} texte={texte.vertreiber} sprache={sprache} />
        </div>
      ) : null}
```

und den Kommentar darüber um „seit Spec Vertreiber sichtbar 3 auch mit einem Vertreiber“ ergänzen.

- [ ] **Step 6: Tests und Typen grün**

Run: `npx tsx --test tests/vertreiber-bluete.test.ts` → PASS. `npx tsc --noEmit -p .` → ok.

- [ ] **Step 7: Commit**

```bash
git add components/review/VertreiberVergleich.tsx app/[lang]/blueten/[slug]/page.tsx lib/i18n/de.ts lib/i18n/en.ts tests/vertreiber-bluete.test.ts
git commit -m "feat: Vertreiber-Vergleich auf der Blütenseite auch mit einem Vertreiber"
```

### Task C2: Charge des Vertreibers in der Doppelseite

**Skills:** `ui-design-engine` (+ Datei lesen), `better-writing`, `better-typography`, `law-of-proximity`

**Files:**
- Modify: `components/review/BuchDoppelseite.tsx:93-100` (Register Beschaffenheit)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (nur Block `buch`)
- Test: `tests/buch-doppelseite.test.ts` (neue Tests anhängen)

**Interfaces:**
- Consumes: `EintragDaten.vertreiber?: string | null` aus `components/review/eintrag.ts` (`undefined` ohne Produktbezug, `null` bei unbekanntem Vertreiber).
- Produces: keine neuen Exporte.

- [ ] **Step 1: Texte (de, Block `buch`)**

```ts
    chargeVon: "Charge von {vertreiber}",
    chargeUnbekannt: "Charge, Vertreiber unbekannt",
    zaehltVertreiber: "zählt für den Vertreiber",
```

en:

```ts
    chargeVon: "Batch from {vertreiber}",
    chargeUnbekannt: "Batch, distributor unknown",
    zaehltVertreiber: "counts for the distributor",
```

- [ ] **Step 2: Failing tests (an `tests/buch-doppelseite.test.ts` anhängen)**

```ts
const MIT_BESCHAFFENHEIT = { beschaffenheit: { budDichte: 3 } as EintragDaten["beschaffenheit"] };

test("Beschaffenheit nennt die Charge des Vertreibers, wenn der Eintrag ihn kennt", () => {
  const html = zeige({ ...MIT_BESCHAFFENHEIT, vertreiber: "avaay" });
  assert.match(html, /Charge von avaay/);
  assert.match(html, /zählt für den Vertreiber/);
});

test("Beschaffenheit: unbekannter Vertreiber hat einen eigenen Satz", () => {
  assert.match(zeige({ ...MIT_BESCHAFFENHEIT, vertreiber: null }), /Charge, Vertreiber unbekannt/);
});

test("Beschaffenheit ohne Produktbezug (Blütenseite) ohne Chargenzeile", () => {
  const html = zeige(MIT_BESCHAFFENHEIT);
  assert.doesNotMatch(html, /Charge von|Vertreiber unbekannt/);
});
```

Prüfe, dass `eintrag()` aus `tests/hilfen/eintrag.ts` `vertreiber` nicht vorbelegt; sonst im dritten Test `vertreiber: undefined` explizit setzen.

- [ ] **Step 3: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/buch-doppelseite.test.ts` → FAIL (neue Tests).

- [ ] **Step 4: Implementieren**

In `BuchDoppelseite.tsx` den `inhalt` des Registers „beschaffenheit“ ersetzen durch:

```tsx
      inhalt: (
        <div className="flex flex-col gap-4">
          {eintrag.vertreiber !== undefined ? (
            // Charge zählt für den Vertreiber (Spec Vertreiber sichtbar 4); auf der Blütenseite steht er im Titelblatt.
            <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="text-small text-text wrap-break-word">
                {eintrag.vertreiber ? t(w.buch.chargeVon, { vertreiber: eintrag.vertreiber }) : w.buch.chargeUnbekannt}
              </span>
              <span className="font-sans text-caption uppercase tracking-gesperrt text-text-muted">{w.buch.zaehltVertreiber}</span>
            </p>
          ) : null}
          <BeschaffenheitsLeiste werte={eintrag.beschaffenheit} feuchte={null} texte={texte} titelKlasse="lg:sr-only" />
        </div>
      ),
```

`t` ist in der Datei schon importiert (`t(w.buch.bewertungVon, …)`). Der Vermerk-Stil `font-sans text-caption uppercase tracking-gesperrt` folgt `ca25739` (Session 56).

- [ ] **Step 5: Tests und Typen grün**

Run: `npx tsx --test tests/buch-doppelseite.test.ts` → PASS. `npx tsc --noEmit -p .` → ok. `npm test` → grün.

- [ ] **Step 6: Commit**

```bash
git add components/review/BuchDoppelseite.tsx lib/i18n/de.ts lib/i18n/en.ts tests/buch-doppelseite.test.ts
git commit -m "feat: Doppelseite nennt die Charge des Vertreibers"
```

---

## Zusammenführen und Prüfen (Controller, seriell)

**Skills:** `superpowers:finishing-a-development-branch`, `better-interface`, `web-design-guidelines`, `critique-visual-hierarchy`, `critique-composition`

- [ ] Je Branch Gesamtreview (Subagent `superpowers:requesting-code-review`, UI-Branches zusätzlich mit `better-interface`).
- [ ] Merge in `main` in der Reihenfolge `vs-bluete`, `vs-katalog`, `vs-start`. Konflikte in `lib/i18n/de.ts`/`en.ts` sind nur Nachbarblöcke: beide Seiten behalten.
- [ ] Nach jedem Merge `npm test` und `npx tsc --noEmit -p .` auf `main`.
- [ ] Push nach `main` (Memory `immer-nach-github-pushen`), Build abwarten, dann live per Browser-MCP (Memory `live-statt-dev`, `browser-verbinden`): Startseite hell und dunkel bei 1440 und 494 px (Kapitel nach „Transparent machen“, Karte, Einladung), `/blueten` beide Ansichten und `?kultivar=`, Blütenseite mit einem und mehreren Vertreibern, `/reviews` Register Beschaffenheit. Vor „fehlt live“ frisch laden (`?f=1`).
- [ ] HANDOFF.md aktualisieren, committen, pushen.
