# Neuigkeiten-Seite „Was ist neu“ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statische Seite `/neu` mit Meldungen und „Gerade in Arbeit“, im Hauptmenü verlinkt.

**Architecture:** Inhalt als typisiertes Array in `lib/neuigkeiten/eintraege.ts`, reine Hilfsfunktionen in `lib/neuigkeiten/gruppieren.ts`, Seite `app/[lang]/neu/page.tsx` (force-static) nach Muster `impressum`. Texte der Seite im Wörterbuch (`lib/i18n/de.ts`, `en.ts`).

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind, vitest.

**Spec:** `docs/superpowers/specs/2026-10-20-neuigkeiten-design.md`

## Global Constraints

- Keine Fachwörter in Meldungen: nie „Deploy“, „Commit“, „Migration“, „Cache“; nie „Ware“, nie „Stärke“.
- Kein HWG-Werbeversprechen zu Wirkung oder Heilung.
- Titel höchstens 80 Zeichen, Text höchstens 3 Sätze, beide Sprachen gefüllt.
- Typname `Neuigkeit` (nicht `Meldung`: der Name ist in `lib/i18n/typen.ts` belegt).
- Design nach `ui-design-engine`; Akzent (Handschrift) aufs kurze Element (Tageszahl).

## Review Focus

- Meldung mit Datum in der Zukunft: Wächter-Test schlägt fehl.
- Zwei Meldungen am selben Tag: stabile Reihenfolge (Reihenfolge im Array).
- Leeres `IN_ARBEIT`: Abschnitt verschwindet ganz, keine leere Überschrift.
- Monatsname in en: `Intl.DateTimeFormat` mit Sprache, nicht fest deutsch.
- Menüzeile ab `lg` mit fünftem Punkt: einzeilig ohne Überlauf (live prüfen).

---

### Task 1: Datenmodul, Gruppierung, Wächter-Test

**Files:** Create `lib/neuigkeiten/eintraege.ts`, `lib/neuigkeiten/gruppieren.ts`, `tests/neuigkeiten.test.ts`

**Interfaces — Produces:**
```ts
export type Art = "neu" | "besser" | "behoben";
export type Zweisprachig = { de: string; en: string };
export type Neuigkeit = { id: string; datum: string; art: Art; titel: Zweisprachig; text: Zweisprachig; link?: string };
export type InArbeit = { id: string; titel: Zweisprachig; text: Zweisprachig };
export const NEUIGKEITEN: readonly Neuigkeit[];
export const IN_ARBEIT: readonly InArbeit[];
export function nachMonat(liste: readonly Neuigkeit[]): { monat: string; eintraege: Neuigkeit[] }[]; // "YYYY-MM", neueste zuerst
```
- [ ] Test: IDs eindeutig, Datum ISO und nicht in Zukunft, Längen, verbotene Wörter, Links mit `/`; `nachMonat` sortiert neueste zuerst und behält Array-Reihenfolge bei gleichem Datum.
- [ ] Implementieren, `npx vitest run tests/neuigkeiten.test.ts` grün, commit.

### Task 2: Rückblick-Inhalt (parallel zu Task 3)

**Files:** Modify `lib/neuigkeiten/eintraege.ts`
- [ ] Aus `git log` und `HANDOFF.md` 15 bis 25 sichtbare Meilensteine verdichten, de und en, Ton nach `better-writing`. `IN_ARBEIT` aus den offenen großen To-Dos im HANDOFF.
- [ ] Wächter-Test grün, commit.

### Task 3: Seite, Menü, Wörterbuch

**Files:** Create `app/[lang]/neu/page.tsx`; Modify `lib/navigation.ts`, `lib/i18n/de.ts`, `lib/i18n/en.ts`
- [ ] Wörterbuch: `kopf.navigation.neu` („Neu“/„New“), Block `neu` mit `titel`, `satz`, `metaBeschreibung`, `inArbeit`, `art.{neu,besser,behoben}`, `ansehen`.
- [ ] `HAUPTNAVIGATION` um `{ href: "/neu", schluessel: "neu" }` am Ende.
- [ ] Seite: `Seitenkopf`, Abschnitt „Gerade in Arbeit“ (nur wenn nicht leer), Monate mit `<time>`, Etikett per `Badge`, Tageszahl in `font-hand text-logo`.
- [ ] `npx tsc --noEmit`, Suite grün, commit, push, live prüfen (lg-Menüzeile, 390 px, hell/dunkel, de/en).

### Task 4: Automatik

- [ ] Memory „Sessionabschluss“ um Schritt „Meldung in `lib/neuigkeiten/eintraege.ts` und `IN_ARBEIT` angleichen“ ergänzen; HANDOFF-Abschnitt aktualisieren.
