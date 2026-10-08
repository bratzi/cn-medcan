# Buch-Doppelseite Fokus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Nutzer wählte: Controller setzt selbst um, am Ende eine unabhängige Prüfung). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Die Buch-Doppelseite stellt das Urteil zentriert in den Fokus, setzt die Stimme der Person als kursives Zitat mit handschriftlichem Vermerk ab und fasst die Person als kleines Exlibris ein.

**Architecture:** Nur bestehende Bausteine ändern: `BuchDoppelseite` (Kopf links, Vermerk), `BuchNotiz` (Zitat), `BlattUrteil` (zentriert, Note in Mr Dafoe), `NotenLeiste` (Zellen zentriert). Alle Bücher nutzen dieselbe Komponente, damit wirkt es überall.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Tests mit `tsx --test`.

**Spec:** `docs/superpowers/specs/2026-10-09-buch-doppelseite-fokus-design.md`

## Global Constraints

- Regelwerk `.claude/skills/ui-design-engine.md`; `font-hand` nur mit `text-notiz`/`text-vermerk`/`text-marke`/`text-umschlag` in derselben Klassenzeile; Namen nie in `font-hand`.
- Abstände nur auf der 8-px-Leiter; nur semantische Tokens.
- `auszug` ohne Wirkung bleibt.
- Neue Texte ohne Geviert- und Gedankenstrich, Texte nur aus `lib/i18n/de.ts`/`en.ts`.

## Review Focus

- Sehr langer Name im Exlibris bei 343 px: umbrechen statt überlaufen (Test Task 1).
- Community ohne Autor (anonym): Exlibris ohne Avatar, kein leerer Kreis (Test Task 1).
- Note 0,5 oder 5,0 in Mr Dafoe: `sr-only` liest weiter den Satz (Test Task 2).
- Text mit eigenen Anführungszeichen: `<q>` setzt außen zusätzlich welche; akzeptiert (sichtbar, kein Fehler).
- Notiz-Messung (`notizZeilen`) zählt mit `text-h3`-Zeilen; Kursive ändert die Zeilenhöhe nicht (Test bestehend).

---

### Task 1: Exlibris und Stimme (linke Seite)

**Files:** Modify `components/review/BuchDoppelseite.tsx`, `components/review/BuchNotiz.tsx`, `lib/i18n/de.ts`, `lib/i18n/en.ts` (`buch.meineNotiz`). Test: `tests/buch-doppelseite.test.ts`.

- [ ] Tests anpassen und ergänzen: Avatar `size-10` in einer Pille `rounded-full border border-border-strong`, kein `size-32`; Überschrift `text-h3` statt `text-h1`; Vermerk „meine notiz“ (Betreiber) bzw. „von euch“ (Community) mit `data-eintritt="schreiben"` über dem Text; Text in `<q>` innerhalb eines `font-buch italic` Absatzes mit `border-l-2 border-accent pl-4`; ohne Text kein Vermerk.
- [ ] Laufen lassen, rot.
- [ ] Umsetzen.
- [ ] `npx tsx --test tests/buch-doppelseite.test.ts tests/buch-notiz.test.ts tests/marke.test.ts tests/i18n-literale.test.ts`, grün.
- [ ] Commit.

### Task 2: Urteil im Fokus (rechte Seite)

**Files:** Modify `components/review/BlattUrteil.tsx`, `components/review/NotenLeiste.tsx`, `.claude/skills/ui-design-engine.md` (Ausnahme Gesamtnote im Buch). Test: `tests/buch-bausteine.test.ts`, `tests/noten-leiste.test.ts`.

- [ ] Tests: `BlattUrteil` als `flex flex-col items-center text-center`, Note `font-hand text-notiz text-logo`, `sr-only` unverändert; `NotenLeiste`-Zellen `items-center text-center`.
- [ ] Rot, umsetzen, grün.
- [ ] Commit.

### Task 3: Abschluss

- [ ] `npx tsc --noEmit`, `npx eslint components lib app tests`, `npm test`, `npm run farben`.
- [ ] Push, live `/reviews` (1143 px, 494 px, hell und dunkel), Blütenseite, Startseite.
- [ ] Eine unabhängige Prüfung (Reviewer) über den Diff, Befunde in einer Welle beheben.
- [ ] HANDOFF.
