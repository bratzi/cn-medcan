# Auftakt als Eyecatcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die erste Ansicht der Startseite bekommt im leeren Raum zwischen Intro und Knopf drei Live-Zahlen (Sorten, Bewertungen, Stimmen), die in der bestehenden GSAP-Staffel einmal hochzählen; dazu Feinschliff an Raster, Introzeile und Verlauf.

**Architecture:** Eine `$queryRaw` mit drei Unterabfragen liefert die Zahlen (Muster `communityZahlen`), eine reine Zuordnung ohne `server-only` macht sie testbar. Eine async Serverkomponente `AuftaktZahlen` rendert sie in einem `Suspense` im `Auftakt`, mit Fehlerfang und Skelett. Die Bewegung hängt als letzter Schritt an die vorhandene Timeline in `components/story/bewegung/auftakt.ts`.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma auf D1, GSAP (nur unter `components/story/bewegung`), Tailwind v4 mit Token aus `app/globals.css`, Tests mit `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-08-auftakt-eyecatcher-design.md`

## Global Constraints

- Kein `next dev`, kein `next build`, kein Preview lokal. Prüfen heißt: `npx tsc --noEmit`, `npx eslint .`, `npm test`, `npm run farben`, dann pushen und live prüfen.
- Keine `$transaction` auf D1. Jede Query ist ein Sub-Request; drei Zahlen kommen aus **einer** `$queryRaw`.
- Tabellennamen aus `@@map`: `strains`, `reviews`, `stimmen`. Spalten `aktiv`, `freigegeben` (SQLite-Boolean, also `= 1`).
- § 10 HWG: keine Namen, keine Freitexte, keine Wirkungsaussage in der Zahlenleiste.
- gsap und lenis nur unter `components/story/bewegung` importieren (Test `bewegung.test.ts`).
- Zahlenmerkmal heißt `data-auftakt-zaehler`, **nie** `data-zaehler` (das greift `eintrag.ts` seitenweit ab).
- Zeitmarken der bestehenden Staffel bleiben: Film 0 s, Oberzeile 1,8 s, Intro 3,4 s. Zahlenleiste 4,2 s.
- Knopf „Bewerte jetzt mit" bekommt kein `data-story-einstieg`.
- 8px-Raster: Tailwind-Abstände nur in geraden Stufen (2, 4, 6, 8, 12, 16 …).
- Keine neuen npm-Pakete.
- Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nie `git add -A`.

## Review Focus

1. **Leere Datenbank (alles 0):** Die Leiste erscheint nicht; der Auftakt sieht aus wie heute. Test in Task 1 (`hatAuftaktZahlen`) und Task 2 (Komponente gibt `null`).
2. **Abfrage scheitert:** Der Auftakt steht vollständig, ohne Leiste, Fehler geloggt; Next-interne Unterbrechungen gehen durch. Quelltextprüfung in Task 2 (`unstable_rethrow` vor `console.error`).
3. **Englische Seite:** Zahlen mit Komma als Tausendertrenner (`1,284`), Wörter englisch, Einzahl bei 1. Test in Task 1 (Format) und Task 2 (Wörterbuch).
4. **Reduzierte Bewegung oder kein JavaScript:** Endwerte stehen sofort im HTML und werden nie auf 0 gesetzt. Quelltextprüfung in Task 2 (Endwert im Markup) und Task 3 (Zählen nur innerhalb der Timeline).
5. **Doppelseite schlägt auf:** Die Auftaktzahlen zählen nicht ein zweites Mal hoch. Test in Task 3 (`eintrag.ts` greift nur `[data-zaehler]`, Auftakt nutzt es nicht).

---

## Dateien

| Datei | Aufgabe |
|-------|---------|
| `lib/query/community.ts` | `alsZahl` wird exportiert (DRY) |
| `lib/query/auftakt-zahlen.ts` (neu) | Typ `AuftaktZahlen`, `zuAuftaktZahlen`, `hatAuftaktZahlen`, `auftaktEintraege` – rein, ohne `server-only` |
| `lib/query/start-zahlen.ts` (neu) | `auftaktZahlen()` – die eine `$queryRaw`, `server-only` |
| `lib/i18n/de.ts`, `lib/i18n/en.ts` | `start.auftakt.zahlen` mit drei `Mehrzahl` |
| `components/story/AuftaktZahlen.tsx` (neu) | async Serverkomponente, Fehlerfang, Markup der Leiste |
| `components/story/Skelette.tsx` | `AuftaktZahlenSkelett` |
| `components/story/Auftakt.tsx` | Einbau im `Suspense`, Feinschliff Raster und Verlauf |
| `components/story/bewegung/auftakt.ts` | Leiste einblenden und hochzählen |
| `tests/auftakt-zahlen.test.ts` (neu) | Tests Task 1 bis 3 |

---

### Task 1: Abfrage und Zuordnung

**Files:**
- Modify: `lib/query/community.ts` (Funktion `alsZahl`, heute nicht exportiert)
- Create: `lib/query/auftakt-zahlen.ts`
- Create: `lib/query/start-zahlen.ts`
- Test: `tests/auftakt-zahlen.test.ts`

**Interfaces:**
- Consumes: `alsZahl(wert: unknown): number` aus `lib/query/community.ts`; `formatiereZahl(wert: number, stellen?: number, sprache?: Sprache): string` aus `lib/format.ts`; `mehrzahl(sprache, eintrag, anzahl)` aus `lib/i18n/text.ts`.
- Produces:
  - `type AuftaktZahlen = { sorten: number; bewertungen: number; stimmen: number }`
  - `zuAuftaktZahlen(zeilen: readonly Partial<Record<keyof AuftaktZahlen, unknown>>[] | null | undefined): AuftaktZahlen`
  - `hatAuftaktZahlen(zahlen: AuftaktZahlen): boolean`
  - `type AuftaktEintrag = { schluessel: keyof AuftaktZahlen; zahl: number; text: string; wort: string }`
  - `auftaktEintraege(zahlen: AuftaktZahlen, texte: Woerterbuch["start"]["auftakt"]["zahlen"], sprache: Sprache): AuftaktEintrag[]`
  - `auftaktZahlen(): Promise<AuftaktZahlen>` (in `lib/query/start-zahlen.ts`)

- [ ] **Step 1: Failing Test schreiben**

Datei `tests/auftakt-zahlen.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { zuAuftaktZahlen, hatAuftaktZahlen } from "@/lib/query/auftakt-zahlen";

const lies = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

test("Zeile aus D1 wird zu Zahlen, egal ob number, bigint oder string", () => {
  assert.deepEqual(zuAuftaktZahlen([{ sorten: 412, bewertungen: 37n, stimmen: "1284" }]), {
    sorten: 412,
    bewertungen: 37,
    stimmen: 1284,
  });
});

test("fehlende oder kaputte Werte werden 0", () => {
  const null3 = { sorten: 0, bewertungen: 0, stimmen: 0 };
  assert.deepEqual(zuAuftaktZahlen([]), null3);
  assert.deepEqual(zuAuftaktZahlen(undefined), null3);
  assert.deepEqual(zuAuftaktZahlen(null), null3);
  assert.deepEqual(zuAuftaktZahlen([{ sorten: "viele", bewertungen: -1, stimmen: null }]), null3);
});

test("leere Datenbank: keine Leiste, eine Zahl über 0: Leiste", () => {
  assert.equal(hatAuftaktZahlen({ sorten: 0, bewertungen: 0, stimmen: 0 }), false);
  assert.equal(hatAuftaktZahlen({ sorten: 0, bewertungen: 0, stimmen: 1 }), true);
});

test("Abfrage: eine queryRaw mit drei Unterabfragen, keine Transaktion", () => {
  const quelle = lies("lib/query/start-zahlen.ts");
  assert.match(quelle, /import "server-only"/);
  assert.match(quelle, /\$queryRaw/);
  assert.doesNotMatch(quelle, /\$transaction|\.count\(/);
  assert.match(quelle, /FROM strains WHERE aktiv = 1/);
  assert.match(quelle, /FROM reviews WHERE freigegeben = 1/);
  assert.match(quelle, /FROM stimmen\)/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/auftakt-zahlen.test.ts`
Expected: FAIL, `Cannot find module '@/lib/query/auftakt-zahlen'`

- [ ] **Step 3: `alsZahl` exportieren**

In `lib/query/community.ts` die Zeile

```ts
function alsZahl(wert: unknown): number {
```

ersetzen durch

```ts
export function alsZahl(wert: unknown): number {
```

- [ ] **Step 4: Reine Zuordnung schreiben**

Datei `lib/query/auftakt-zahlen.ts`:

```ts
import { alsZahl } from "@/lib/query/community";

/**
 * Zahlen der Leiste im Auftakt (Spec 2026-10-08 Auftakt, 3), ohne
 * Datenbankzugriff und ohne "server-only": die reine Zuordnung ist so
 * testbar. Die Abfrage steht in lib/query/start-zahlen.ts.
 *
 * Bewusst nur Zähler, keine Namen und keine Freitexte (§ 10 HWG).
 */
export type AuftaktZahlen = {
  sorten: number;
  bewertungen: number;
  stimmen: number;
};

type Zeile = Partial<Record<keyof AuftaktZahlen, unknown>>;

export function zuAuftaktZahlen(zeilen: readonly Zeile[] | null | undefined): AuftaktZahlen {
  const zeile = zeilen?.[0];
  return {
    sorten: alsZahl(zeile?.sorten),
    bewertungen: alsZahl(zeile?.bewertungen),
    stimmen: alsZahl(zeile?.stimmen),
  };
}

/** Alles 0 heißt: noch nichts zu zeigen, die Leiste bleibt weg. */
export function hatAuftaktZahlen(zahlen: AuftaktZahlen): boolean {
  return zahlen.sorten + zahlen.bewertungen + zahlen.stimmen > 0;
}
```

- [ ] **Step 5: Abfrage schreiben**

Datei `lib/query/start-zahlen.ts`:

```ts
import "server-only";

import { getPrisma } from "@/lib/prisma";
import { zuAuftaktZahlen, type AuftaktZahlen } from "@/lib/query/auftakt-zahlen";

/**
 * Drei Zähler für die Leiste im Auftakt (Spec 2026-10-08 Auftakt, 4).
 *
 * Eine Abfrage mit drei Unterabfragen statt drei `count()`: jede Query ist
 * ein Sub-Request, und eine Transaktion gibt es auf D1 nicht. Tabellennamen
 * wie in den @@map-Angaben des Schemas. Die Stimmen zählen dasselbe wie
 * `communityZahlen` in der Randspalte.
 */
export async function auftaktZahlen(): Promise<AuftaktZahlen> {
  const prisma = await getPrisma();
  const zeilen = await prisma.$queryRaw<{ sorten: unknown; bewertungen: unknown; stimmen: unknown }[]>`
    SELECT
      (SELECT COUNT(*) FROM strains WHERE aktiv = 1) AS sorten,
      (SELECT COUNT(*) FROM reviews WHERE freigegeben = 1) AS bewertungen,
      (SELECT COUNT(*) FROM stimmen) AS stimmen
  `;
  return zuAuftaktZahlen(zeilen);
}
```

- [ ] **Step 6: Tests laufen lassen**

Run: `npx tsx --test tests/auftakt-zahlen.test.ts tests/community.test.ts`
Expected: PASS, alle Tests grün (community.test.ts unverändert grün nach dem Export).

- [ ] **Step 7: Commit**

```bash
git add lib/query/community.ts lib/query/auftakt-zahlen.ts lib/query/start-zahlen.ts tests/auftakt-zahlen.test.ts
git commit -m "feat: Abfrage der drei Auftaktzahlen" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Texte, Komponente, Einbau

**Files:**
- Modify: `lib/i18n/de.ts` (Block `start.auftakt`, heute Zeile ~622)
- Modify: `lib/i18n/en.ts` (Block `start.auftakt`, heute Zeile ~613)
- Modify: `lib/query/auftakt-zahlen.ts` (Funktion `auftaktEintraege` ergänzen)
- Create: `components/story/AuftaktZahlen.tsx`
- Modify: `components/story/Skelette.tsx` (neues `AuftaktZahlenSkelett`)
- Modify: `components/story/Auftakt.tsx`
- Test: `tests/auftakt-zahlen.test.ts`

**Interfaces:**
- Consumes: `AuftaktZahlen`, `hatAuftaktZahlen`, `auftaktZahlen()` aus Task 1; `holeSprache`, `holeWoerterbuch` aus `@/lib/i18n`; `SKELETT_FLAECHE`, `SkelettAnsage` aus `Skelette.tsx`; `w.start.skelett.zahlen` (gibt es schon).
- Produces:
  - Wörterbuch `start.auftakt.zahlen: { sorten: Mehrzahl; bewertungen: Mehrzahl; stimmen: Mehrzahl }`
  - `auftaktEintraege(zahlen, texte, sprache): AuftaktEintrag[]` mit `AuftaktEintrag = { schluessel; zahl; text; wort }` (`text` ist die formatierte Zahl)
  - Markup: `<dl data-story="zahlen" data-story-einstieg="">`, je Zahl `<span aria-hidden="true" data-auftakt-zaehler="" data-ziel="<zahl>">` mit dem formatierten Endwert als Text. Task 3 sucht genau diese Selektoren.

- [ ] **Step 1: Failing Tests ergänzen**

An `tests/auftakt-zahlen.test.ts` anhängen (Import oben um `auftaktEintraege` erweitern und Wörterbücher importieren):

```ts
import { auftaktEintraege } from "@/lib/query/auftakt-zahlen";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

test("Einträge deutsch: Tausenderpunkt, Mehrzahl, feste Reihenfolge", () => {
  assert.deepEqual(auftaktEintraege({ sorten: 412, bewertungen: 37, stimmen: 1284 }, de.start.auftakt.zahlen, "de"), [
    { schluessel: "sorten", zahl: 412, text: "412", wort: "Sorten im Katalog" },
    { schluessel: "bewertungen", zahl: 37, text: "37", wort: "Bewertungen im Buch" },
    { schluessel: "stimmen", zahl: 1284, text: "1.284", wort: "Stimmen abgegeben" },
  ]);
});

test("Einträge englisch: Tausenderkomma, Einzahl bei 1", () => {
  const eintraege = auftaktEintraege({ sorten: 1, bewertungen: 1, stimmen: 1284 }, en.start.auftakt.zahlen, "en");
  assert.deepEqual(eintraege.map((e) => e.wort), ["strain in the catalogue", "review in the book", "votes cast"]);
  assert.equal(eintraege[2].text, "1,284");
});

test("Einzahl deutsch bei 1", () => {
  const eintraege = auftaktEintraege({ sorten: 1, bewertungen: 1, stimmen: 1 }, de.start.auftakt.zahlen, "de");
  assert.deepEqual(eintraege.map((e) => e.wort), ["Sorte im Katalog", "Bewertung im Buch", "Stimme abgegeben"]);
});

test("Komponente: Fehlerfang, Endwert im HTML, eigenes Zählermerkmal", () => {
  const quelle = lies("components/story/AuftaktZahlen.tsx");
  assert.match(quelle, /unstable_rethrow\(fehler\);\s*console\.error/);
  assert.match(quelle, /hatAuftaktZahlen/);
  assert.match(quelle, /data-story="zahlen"/);
  assert.match(quelle, /data-story-einstieg=""/);
  assert.match(quelle, /data-auftakt-zaehler=""/);
  assert.match(quelle, /data-ziel=\{eintrag\.zahl\}/);
  assert.match(quelle, /\{eintrag\.text\}/);
  assert.doesNotMatch(quelle, /data-zaehler/);
});

test("Auftakt: Zahlen im Suspense mit Skelett, Knopf ohne Einstieg", () => {
  const quelle = lies("components/story/Auftakt.tsx");
  assert.match(quelle, /<Suspense fallback=\{<AuftaktZahlenSkelett/);
  assert.match(quelle, /<AuftaktZahlen \/>/);
  const knopf = quelle.slice(quelle.indexOf("<Link"), quelle.indexOf("</Link>"));
  assert.doesNotMatch(knopf, /data-story-einstieg/);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/auftakt-zahlen.test.ts`
Expected: FAIL (`auftaktEintraege` fehlt, `de.start.auftakt.zahlen` ist `undefined`, Datei `AuftaktZahlen.tsx` fehlt).

- [ ] **Step 3: Texte deutsch**

In `lib/i18n/de.ts` im Block `start.auftakt` nach `mitmachen: "Bewerte jetzt mit",` einfügen:

```ts
      zahlen: {
        sorten: { one: "Sorte im Katalog", other: "Sorten im Katalog" },
        bewertungen: { one: "Bewertung im Buch", other: "Bewertungen im Buch" },
        stimmen: { one: "Stimme abgegeben", other: "Stimmen abgegeben" },
      },
```

- [ ] **Step 4: Texte englisch**

In `lib/i18n/en.ts` im Block `start.auftakt` nach `mitmachen: "Review with us",` einfügen:

```ts
      zahlen: {
        sorten: { one: "strain in the catalogue", other: "strains in the catalogue" },
        bewertungen: { one: "review in the book", other: "reviews in the book" },
        stimmen: { one: "vote cast", other: "votes cast" },
      },
```

Hinweis: `mehrzahl` setzt `{anzahl}` nur ein, wenn der Text es enthält; hier steht die Zahl getrennt, die Texte enthalten kein `{anzahl}`.

- [ ] **Step 5: `auftaktEintraege` ergänzen**

In `lib/query/auftakt-zahlen.ts` Importe ergänzen und am Ende anfügen:

```ts
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { mehrzahl } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
```

```ts
/** Eine Zahl der Leiste: Wert, formatierter Endwert für das HTML, Wort darunter. */
export type AuftaktEintrag = { schluessel: keyof AuftaktZahlen; zahl: number; text: string; wort: string };

const REIHENFOLGE = ["sorten", "bewertungen", "stimmen"] as const;

export function auftaktEintraege(
  zahlen: AuftaktZahlen,
  texte: Woerterbuch["start"]["auftakt"]["zahlen"],
  sprache: Sprache,
): AuftaktEintrag[] {
  return REIHENFOLGE.map((schluessel) => ({
    schluessel,
    zahl: zahlen[schluessel],
    text: formatiereZahl(zahlen[schluessel], 0, sprache),
    wort: mehrzahl(sprache, texte[schluessel], zahlen[schluessel]),
  }));
}
```

- [ ] **Step 6: Skelett**

In `components/story/Skelette.tsx` nach `RandspaltenSkelett` einfügen:

```tsx
/** Höhe wie die echte Zahlenleiste im Auftakt (Zahl in text-display, Wort in text-small), damit nichts springt. */
export function AuftaktZahlenSkelett({ ansage }: { ansage: string }) {
  return (
    <div role="status" data-skelett="" className="grid w-full max-w-3xl grid-cols-3 gap-4 sm:gap-8">
      <SkelettAnsage text={ansage} />
      {["sorten", "bewertungen", "stimmen"].map((schluessel) => (
        <span key={schluessel} aria-hidden="true" className={`${SKELETT_FLAECHE} mx-auto h-20 w-24 sm:w-32`} />
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Komponente**

Datei `components/story/AuftaktZahlen.tsx`:

```tsx
import { unstable_rethrow } from "next/navigation";

import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { auftaktEintraege, hatAuftaktZahlen, type AuftaktZahlen as Zahlen } from "@/lib/query/auftakt-zahlen";
import { auftaktZahlen } from "@/lib/query/start-zahlen";

/**
 * Die Zahlenleiste im Auftakt (Spec 2026-10-08 Auftakt, 3 und 5). Scheitert
 * die Abfrage oder ist alles 0, bleibt der Raum leer und der Auftakt steht
 * trotzdem; Next-interne Unterbrechungen gehen durch.
 *
 * Der Endwert steht im HTML: ohne JavaScript und bei reduzierter Bewegung
 * ist er sofort richtig. Die Ziffern sind aria-hidden, damit Vorleser nicht
 * das Hochzählen mitlesen; der Endwert steht als sr-only daneben. Das
 * Merkmal heißt data-auftakt-zaehler, nicht data-zaehler: das greift
 * eintrag.ts seitenweit ab.
 */
export async function AuftaktZahlen() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  let zahlen: Zahlen | null = null;
  try {
    zahlen = await auftaktZahlen();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("auftaktZahlen fehlgeschlagen", fehler);
  }
  if (!zahlen || !hatAuftaktZahlen(zahlen)) return null;

  return (
    <dl data-story="zahlen" data-story-einstieg="" className="grid w-full max-w-3xl grid-cols-3 gap-4 text-center sm:gap-8">
      {auftaktEintraege(zahlen, w.start.auftakt.zahlen, sprache).map((eintrag) => (
        <div key={eintrag.schluessel} className="flex flex-col-reverse items-center gap-2">
          <dt className="font-sans text-small uppercase tracking-gesperrt text-balance text-text/80">{eintrag.wort}</dt>
          <dd className="font-sans text-display font-light tabular-nums leading-none text-text">
            <span aria-hidden="true" data-auftakt-zaehler="" data-ziel={eintrag.zahl}>
              {eintrag.text}
            </span>
            <span className="sr-only">{eintrag.text}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 8: Einbau in den Auftakt**

In `components/story/Auftakt.tsx`:

Importe oben ergänzen:

```tsx
import { Suspense } from "react";

import { AuftaktZahlen } from "@/components/story/AuftaktZahlen";
import { AuftaktZahlenSkelett } from "@/components/story/Skelette";
```

`holeWoerterbuch` liefert heute nur `start.auftakt`; die Zeile

```tsx
  const texte = (await holeWoerterbuch()).start.auftakt;
```

ersetzen durch

```tsx
  const w = await holeWoerterbuch();
  const texte = w.start.auftakt;
```

Den Block „Bewerte jetzt mit" (beginnt mit dem Kommentar `{/* "Bewerte jetzt mit" zentriert im freien Raum unter dem Intro, …`) ersetzen durch:

```tsx
      {/* Im freien Raum unter dem Intro: erst die Zahlenleiste (Spec 2026-10-08 Auftakt),
          dann "Bewerte jetzt mit", Verlaufsrahmen wie "Mein Konto", folgt dem Zeiger wie
          die Storytelling-Videos (Nutzer 2026-09-25). */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-8 sm:gap-12 sm:px-8">
        <Suspense fallback={<AuftaktZahlenSkelett ansage={w.start.skelett.zahlen} />}>
          <AuftaktZahlen />
        </Suspense>
        <div data-punkt="" className="p-6">
          <Link prefetch={false}
            href="/blueten"
            data-punkt-tiefe="1"
            className="konto-pille inline-flex h-14 items-center justify-center rounded-full px-8 text-center whitespace-nowrap sm:px-10 font-sans text-small font-medium uppercase tracking-gesperrt text-text"
          >
            {texte.mitmachen}
          </Link>
        </div>
      </div>
```

- [ ] **Step 9: Tests, Typen, Lint**

Run: `npx tsx --test tests/auftakt-zahlen.test.ts tests/marke.test.ts tests/i18n-literale.test.ts && npx tsc --noEmit && npx eslint components/story lib/query`
Expected: PASS, keine Ausgabe von tsc und eslint. Scheitert `i18n-literale.test.ts`, steht ein Literal im Markup, das ins Wörterbuch gehört: verschieben, nicht den Test ändern.

- [ ] **Step 10: Commit**

```bash
git add lib/i18n/de.ts lib/i18n/en.ts lib/query/auftakt-zahlen.ts components/story/AuftaktZahlen.tsx components/story/Skelette.tsx components/story/Auftakt.tsx tests/auftakt-zahlen.test.ts
git commit -m "feat: Zahlenleiste im Auftakt" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Bewegung

**Files:**
- Modify: `components/story/bewegung/auftakt.ts` (Funktion `auftakt`, Timeline in `eroeffnen`)
- Test: `tests/auftakt-zahlen.test.ts`

**Interfaces:**
- Consumes: Selektoren aus Task 2: `[data-story="zahlen"]`, `[data-auftakt-zaehler]` mit `data-ziel`; `zahlFormat(lang, stellen)` aus `components/story/bewegung/zahlformat.ts`.
- Produces: nichts für spätere Tasks.

- [ ] **Step 1: Failing Test ergänzen**

An `tests/auftakt-zahlen.test.ts` anhängen:

```ts
test("Bewegung: Leiste bei 4,2 s, eigenes Merkmal, Endwerte beim Aufräumen", () => {
  const quelle = lies("components/story/bewegung/auftakt.ts");
  assert.match(quelle, /\[data-auftakt-zaehler\]/);
  assert.match(quelle, /'\[data-story="zahlen"\]'/);
  assert.match(quelle, /ZAHLEN_AB = 4\.2/);
  assert.match(quelle, /zahlFormat\(document\.documentElement\.lang, 0\)/);
  // Bestehende Marken bleiben (Nutzer 2026-09-25).
  assert.match(quelle, /'\[data-story="oberzeile"\]'[\s\S]*?1\.8,/);
  assert.match(quelle, /'\[data-story="intro"\]'[\s\S]*?3\.4,/);
});

test("Doppelseite greift nur [data-zaehler], der Auftakt nutzt es nicht", () => {
  assert.match(lies("components/story/bewegung/eintrag.ts"), /"\[data-zaehler\]"/);
  assert.doesNotMatch(lies("components/story/bewegung/auftakt.ts"), /\[data-zaehler\]/);
  assert.doesNotMatch(lies("components/story/AuftaktZahlen.tsx"), /data-zaehler=/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/auftakt-zahlen.test.ts`
Expected: FAIL beim ersten neuen Test (`ZAHLEN_AB` fehlt).

- [ ] **Step 3: Timeline ergänzen**

In `components/story/bewegung/auftakt.ts`:

Import oben ergänzen:

```ts
import { zahlFormat } from "./zahlformat";
```

Unter `const NOTFALL_MS = 8000;` einfügen:

```ts
/** Die Zahlenleiste folgt dem Intro (3,4 s), wenn es halb steht (Spec 2026-10-08 Auftakt, 6). */
const ZAHLEN_AB = 4.2;
```

In `auftakt` nach `if (einstieg.length === 0) return;` einfügen:

```ts
  // Eigenes Merkmal, nicht data-zaehler: das greift eintrag.ts seitenweit ab.
  const zaehler = gsap.utils
    .toArray<HTMLElement>("[data-auftakt-zaehler]")
    .filter((el) => Number.isFinite(Number(el.dataset.ziel)));
  const ganz = (wert: number) => zahlFormat(document.documentElement.lang, 0).format(wert);
  const endwerte = () => {
    for (const el of zaehler) el.textContent = ganz(Number(el.dataset.ziel));
  };
```

In `eroeffnen` direkt nach der Anweisung `ablauf = gsap.timeline(…)….fromTo('[data-story="intro"]', …, 3.4);` diesen Block einfügen:

```ts
    // Die Leiste fehlt, wenn die Abfrage scheiterte oder alles 0 ist: dann nichts tun.
    if (zaehler.length > 0) {
      ablauf.fromTo(
        '[data-story="zahlen"]',
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power2.out",
          // Erst hier auf 0: vorher steht der Endwert aus dem HTML, nie eine falsche Null.
          onStart: () => {
            for (const el of zaehler) el.textContent = ganz(0);
          },
        },
        ZAHLEN_AB,
      );
      for (const el of zaehler) {
        const stand = { wert: 0 };
        ablauf.to(
          stand,
          {
            wert: Number(el.dataset.ziel),
            duration: 1.6,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = ganz(Math.round(stand.wert));
            },
          },
          ZAHLEN_AB,
        );
      }
    }
```

Die beiden Aufräumfunktionen ergänzen, damit nach `revert` die Endwerte stehen:

```ts
  if (document.visibilityState === "visible") {
    eroeffnen();
    return () => {
      ablauf?.revert();
      endwerte();
    };
  }
```

und am Ende von `auftakt`:

```ts
  return () => {
    document.removeEventListener("visibilitychange", sichtbar);
    ablauf?.revert();
    endwerte();
  };
```

`ablauf` ist mit `let ablauf: ReturnType<typeof gsap.timeline> | null = null;` typisiert; nach der Zuweisung in `eroeffnen` ist es sicher nicht `null`. Meckert TypeScript an `ablauf.fromTo`, die Timeline vorher in eine lokale Konstante legen: `const zeitleiste = gsap.timeline(…)…; ablauf = zeitleiste;` und den Block auf `zeitleiste` schreiben.

- [ ] **Step 4: Tests, Typen, Lint**

Run: `npx tsx --test tests/auftakt-zahlen.test.ts tests/bewegung.test.ts && npx tsc --noEmit && npx eslint components/story/bewegung`
Expected: PASS, keine Ausgabe von tsc und eslint.

- [ ] **Step 5: Commit**

```bash
git add components/story/bewegung/auftakt.ts tests/auftakt-zahlen.test.ts
git commit -m "feat: Auftaktzahlen zaehlen in der Eroeffnung hoch" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Feinschliff, Gesamtlauf, Push

**Files:**
- Modify: `components/story/Auftakt.tsx`
- Test: `tests/auftakt-zahlen.test.ts`

**Interfaces:**
- Consumes: Auftakt nach Task 2.
- Produces: nichts.

- [ ] **Step 1: Failing Test ergänzen**

```ts
test("Feinschliff: Abstände im 8px-Raster, Verlauf trägt die Schrift", () => {
  const quelle = lies("components/story/Auftakt.tsx");
  // Nur gerade Tailwind-Stufen (4px je Stufe) an Oberzeile und Intro.
  const oberzeile = quelle.slice(quelle.indexOf('data-story="oberzeile"'), quelle.indexOf('data-story="intro"'));
  const intro = quelle.slice(quelle.indexOf('data-story="intro"'), quelle.indexOf("</p>", quelle.indexOf('data-story="intro"')));
  for (const block of [oberzeile, intro]) {
    for (const [, stufe] of block.matchAll(/\b(?:sm:)?mt-(\d+)\b/g)) assert.equal(Number(stufe) % 2, 0, `mt-${stufe} liegt nicht im 8px-Raster`);
  }
  assert.match(quelle, /from-surface\/40 via-surface\/30 to-surface/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/auftakt-zahlen.test.ts`
Expected: FAIL (`mt-6`/`sm:mt-12` an der Oberzeile sind gerade, aber der Verlauf ist noch `via-surface/5`).

- [ ] **Step 3: Raster und Verlauf**

In `components/story/Auftakt.tsx`:

1. Intro: `mt-2 … sm:mt-4` bleibt (gerade Stufen). Oberzeile: `mt-6 … sm:mt-12` bleibt. Prüfen, dass keine ungerade Stufe (`mt-1`, `mt-3`, `mt-5` …) an Logo, Oberzeile, Intro steht; falls doch, auf die nächste gerade Stufe runden.
2. Intro und Zahlenleiste als Gruppe (Spec 7.2): das Wort unter jeder Zahl trägt seit Task 2 dieselben Klassen wie das Intro (`font-sans text-small uppercase tracking-gesperrt`). Prüfen, dass beide gleich gesetzt sind; keine eigene Größe für die Wörter einführen.
3. Verlauf: `from-surface/40 via-surface/5 to-surface` ersetzen durch `from-surface/40 via-surface/30 to-surface`.
4. Kommentar über dem Verlauf ergänzen:

```tsx
        {/* Mitte auf 30 % statt 5 % (Spec 2026-10-08 Auftakt, 7.3): die Oberzeile trägt
            auch auf hellen Frames. Gemessen nach dem Deploy, Ziel 4,5:1. */}
```

- [ ] **Step 4: Gesamtlauf**

Run: `npx tsc --noEmit && npx eslint . && npm test && npm run farben`
Expected: tsc und eslint ohne Ausgabe; `ℹ fail 0`; „Farben in Ordnung".

- [ ] **Step 5: Commit und Push**

```bash
git add components/story/Auftakt.tsx tests/auftakt-zahlen.test.ts
git commit -m "fix: Verlauf ueber dem Auftaktfilm traegt die Schrift" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

- [ ] **Step 6: Live prüfen (nach ~6 min Workers Build)**

Kommt kein Build (Webhook), manuell auslösen wie in HANDOFF „Lehre Deploy" beschrieben, mit vollem Commit-Hash.

Im Browser-MCP auf `https://cn-medcan.w-helwich.workers.dev/`:

1. 1440 × 900, hell: Leiste steht zwischen Intro und Knopf, zählt bei ~4,2 s hoch, Endwerte stimmen mit dieser Messung überein:

```js
[...document.querySelectorAll("[data-auftakt-zaehler]")].map((el) => [el.dataset.ziel, el.textContent])
```

2. Kontrast der Oberzeile auf dem hellsten Frame messen (Video ist gleiche Herkunft, Canvas darf lesen):

```js
(() => {
  const v = [...document.querySelectorAll('[data-story="auftakt-film"] video')].find((x) => x.offsetParent);
  const z = document.querySelector('[data-story="oberzeile"]').getBoundingClientRect();
  const c = Object.assign(document.createElement("canvas"), { width: innerWidth, height: innerHeight });
  const g = c.getContext("2d");
  g.drawImage(v, 0, 0, innerWidth, innerHeight);
  const d = g.getImageData(z.left, z.top, z.width, z.height).data;
  let max = 0;
  for (let i = 0; i < d.length; i += 4) max = Math.max(max, 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
  return max;
})()
```

   Der Wert ist die hellste Stelle des Films hinter der Oberzeile vor dem Verlauf; bei mehreren Zeitpunkten wiederholen. Liegt der Kontrast nach Verlauf unter 4,5:1, `via-surface/30` in 10er-Schritten anheben, Test anpassen, erneut pushen.
3. 390 × 844: drei Spalten ohne Überlauf (`document.documentElement.scrollWidth <= innerWidth`), Wörter brechen sauber.
4. Dunkel, englisch (`/en`), reduzierte Bewegung (Endwerte stehen sofort), JavaScript aus (Endwerte im HTML).
5. Bis zur Doppelseite scrollen: die Auftaktzahlen ändern sich dabei nicht.

- [ ] **Step 7: HANDOFF**

`HANDOFF.md` um einen Block „Session 47" ergänzen: was live ist, was geprüft wurde, was offen bleibt. Commit `docs: HANDOFF nach Session 47`, push.
