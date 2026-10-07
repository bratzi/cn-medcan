# Profil Stufe 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Profil zeigt, wie sich das eigene Netz entwickelt: Kontur „vor der letzten Bewertung“ mit Änderungszeile, einen Verlauf zum Durchblättern, den Lieblingshersteller, und nach dem Speichern einer Bewertung erscheint auf der Blütenseite ein Mini-Netz, das von vorher nach jetzt wächst.

**Architecture:** Der Verlauf wird beim Speichern aus heutiger Sicht nachgerechnet und als JSON in der neuen Spalte `nutzer_profil.verlauf` abgelegt (eine Zeile, ein Upsert, keine n-zeilige Batch). Die Rechnung ist additiv: jede Bewertung trägt einen festen Vektor bei, die Schritte sind Präfixsummen in Datumsreihenfolge, also O(n × 10) statt O(n²). Lieblingshersteller wird je Aufruf aus den eigenen Bewertungen gerechnet. Das Mini-Netz vergleicht den echten Stand vor und nach dem Speichern (zweimal `ladeProfil` in der Action), damit auch das Bearbeiten einer älteren Bewertung stimmt.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma 7 mit D1, Tailwind 4, `node:test` über `tsx --test`, `better-sqlite3` für SQL-Tests, `react-dom/server` für Render-Tests.

**Spec:** `docs/superpowers/specs/2026-10-07-profil-dashboard-design.md` (Abschnitt 2 Punkte 5, 6, 12; Abschnitt 10)

**Abweichung von der Spec (Claude, dem Nutzer zu nennen):** Die Spec skizziert eine Tabelle `nutzer_profil_verlauf (mitglied_id, schritt, datum, geschmack)`. Der Plan legt dieselben Daten als JSON-Spalte `nutzer_profil.verlauf` ab: ein Upsert statt bis zu 1000 Zeilen je Speichern, atomar mit dem Profil, gleiche Aussage. Gespeichert werden die letzten 60 Schritte.

## Global Constraints

- Next.js 16 App Router. Vor Next-API-Nutzung `node_modules/next/dist/docs/` lesen (AGENTS.md). `params` ist ein Promise.
- Kein `next dev`, `next build`, `next preview` lokal. Prüfen nur per `npm test`, `npx tsc --noEmit -p .`, `npx eslint <geänderte Dateien>`. Live-Prüfung macht der Controller nach dem Push. `npx vitest` ist nicht der Testläufer.
- Design-Regelwerk: Skill `ui-design-engine` vor UI-Arbeit laden (8-px-Raster, Tokens aus `app/globals.css`). Datengrafik in Tinte (`currentColor` auf `text-text`), nie in Blattgrün. Gestrichelt `stroke-dasharray="4 4"`, Kontur 1,5 px; die Kontur „vorher“ 1 px mit `stroke-opacity` 0.45, ohne Fläche.
- Bewegung: nur im Mini-Netz, 700 ms, Ausklingen kubisch. `prefers-reduced-motion: reduce` zeigt sofort den neuen Stand.
- Zeilenenden je Datei erhalten: `git ls-files --eol <datei>`. CRLF sind u. a. `prisma/schema.prisma`, `components/review/BewertungsFormular.tsx`, `app/[lang]/blueten/[slug]/aktionen.ts`. Nie eine CRLF-Datei als LF zurückschreiben. Neue Dateien in LF.
- Texte nur in `lib/i18n/de.ts` und `lib/i18n/en.ts` (`tests/i18n-literale.test.ts`). Alle neuen Schlüssel legt Task 1 an; spätere Tasks fügen keine hinzu. Neue Komponenten trägt erst Task 6 in die Liste von `tests/i18n-literale.test.ts` ein.
- HWG: Netz, Verlauf und Mini-Netz nur Aroma, nie Wirkung. Kein Kauf- oder Apothekenlink. Verlauf, Kontur, Änderungszeile und Lieblingshersteller sind privat: nie auf `/profil/<kurz-id>`.
- Workers-CPU 10 ms: Verlauf nur beim Speichern bzw. bei veraltetem Stand rechnen, nie je Seitenaufruf. Jede Prisma-Liste mit `take`.
- Kommentare und Commits auf Deutsch in Prosa. Commit-Ende: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Implementer: kein Push, kein Merge, nur Commits im eigenen Worktree-Branch.
- Migration: Remote-D1 spielt der Controller selbst ein, exakt `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0020_profil_verlauf.sql`, **vor** dem ersten Push. Prisma liest bei `findUnique` alle Spalten; ohne Migration scheitert `/profil`.
- Nach Änderungen an `prisma/schema.prisma`: `npm run db:generate`. Keine zusätzlichen npm-Installationen.

## Review Focus

1. Mitglied mit genau einer Bewertung: keine Kontur, keine Änderungszeile, Verlauf-Karte mit Hinweis statt Regler. Abgesichert in Task 4 (Render-Tests) und Task 6 (Seite).
2. Letzte Bewertung im Mittelfeld (Note zwischen 2 und 3,5) oder Altbewertung ohne Gesamtnote: der Schritt ist gleich dem vorigen, die Zeile sagt „blieb gleich“. Abgesichert in Task 2 (Verlauf) und Task 1 (`netzAenderung` leer).
3. Eine ältere Bewertung wird bearbeitet (Upsert behält `erstelltAm`): das Mini-Netz vergleicht den echten Stand vor und nach dem Speichern, nicht Schritt n − 1. Abgesichert in Task 5 (Quelltexttest: `ladeProfil` vor `profilFortschreiben`).
4. `verlauf` ist NULL (Profile vor 0020) oder kaputt: Seite zeigt Netz ohne Kontur und den Verlauf-Hinweis, kein Absturz. Abgesichert in Task 2 (`verlaufAusDaten`).
5. `prefers-reduced-motion: reduce`: das Mini-Netz zeigt sofort den neuen Stand. Abgesichert in Task 5 (`startFortschritt`).

## Stränge und Reihenfolge

```
Task 1 (Fundament: Migration, Typen, netzAenderung, NetzGrafik, alle Texte)  ← zuerst, allein, auf main
   ├── Strang A: Task 2 (Verlauf rechnen und ablegen)
   ├── Strang B: Task 3 (Lieblingshersteller)
   ├── Strang C: Task 4 (ProfilNetz mit Kontur, NetzVerlauf)
   └── Strang D: Task 5 (Mini-Netz nach dem Speichern)
Task 6 (Controller: Merge, Seite /profil verdrahten, Gesamtreview, Remote-D1, Push, Live)  ← zuletzt
```

Die Stränge teilen keine Datei. Strang A besitzt `lib/empfehlung.ts`, `lib/profil.ts`, `lib/profil-verlauf.ts`, `lib/query/profil.ts`, `tests/profil-verlauf.test.ts`. Strang B besitzt `lib/lieblingshersteller.ts`, `lib/query/lieblingshersteller.ts`, `components/profil/Lieblingshersteller.tsx`, `tests/lieblingshersteller.test.ts`. Strang C besitzt `components/profil/ProfilNetz.tsx`, `components/profil/NetzVerlauf.tsx`, `tests/profil-verlauf-ui.test.ts`. Strang D besitzt `app/[lang]/blueten/[slug]/aktionen.ts`, `app/[lang]/blueten/[slug]/page.tsx`, `components/review/BewertungsFormular.tsx`, `components/review/MiniNetz.tsx`, `lib/netz-animation.ts`, `tests/mini-netz.test.ts`.

---

### Task 1: Fundament (Controller, auf main)

**Files:**
- Create: `migrations/0020_profil_verlauf.sql`, `tests/profil-verlauf-migration.test.ts`
- Modify: `prisma/schema.prisma` (CRLF, `model NutzerProfil`)
- Modify: `lib/profil-typen.ts`
- Create: `lib/netz-aenderung.ts`, `tests/netz-aenderung.test.ts`
- Create: `components/profil/NetzGrafik.tsx`; Modify: `components/profil/ProfilNetz.tsx` (nur Umbau auf NetzGrafik, gleiche Ausgabe)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts`

**Interfaces:**
- Produces: Spalte `nutzer_profil.verlauf` (TEXT, NULL erlaubt); Prisma `NutzerProfil.verlauf: string | null`.
- Produces in `lib/profil-typen.ts`:
  - `type Geschmack = Record<GeschmacksKategorie, number>` (−1..1 je Achse)
  - `type VerlaufSchritt = { anzahl: number; datum: string; geschmack: Geschmack }` (`datum` ISO-Text, `anzahl` = Zahl der Bewertungen bis hier, ab 1)
  - `type NetzAenderung = { achse: GeschmacksKategorie; differenz: number }`
  - `type Lieblingshersteller = { name: string; mittel: number; anzahl: number }`
- Produces aus `lib/netz-aenderung.ts`: `AENDERUNG_SCHWELLE = 0.05`, `netzAenderung(vorher: Geschmack, nachher: Geschmack, hoechstens?: number): NetzAenderung[]`, `aenderungsListe(liste: readonly NetzAenderung[], achsen: Record<GeschmacksKategorie, string>, texte: { staerker: string; schwaecher: string }): string`.
- Produces aus `components/profil/NetzGrafik.tsx`: `netzAusGeschmack(g: Geschmack): { mag: number[]; magNicht: number[] }` (Werte 0..5 in der Reihenfolge von `GESCHMACKS_ACHSEN`) und `NetzGrafik(props: { mag: readonly number[]; magNicht: readonly number[]; kontur?: readonly number[] | null; beschriftung?: readonly string[] | null; className?: string })`.
- Produces Texte: neue Schlüssel unter `w.profil` und `w.bewerten`, siehe Step 7.

- [ ] **Step 1: Migrationstest schreiben**

```ts
// tests/profil-verlauf-migration.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/** Migration 0020 (Profil Stufe 3): Verlauf als JSON-Spalte, bestehende Profile ohne Verlauf. */
test("0020: bestehende Profile haben verlauf NULL, neue Werte lassen sich schreiben", () => {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE "nutzer_profil" ("mitglied_id" TEXT NOT NULL PRIMARY KEY, "geschmack" TEXT NOT NULL);
           INSERT INTO "nutzer_profil" VALUES ('m1', '{}');`);
  db.exec(readFileSync(join(process.cwd(), "migrations", "0020_profil_verlauf.sql"), "utf8"));
  assert.deepEqual(db.prepare(`SELECT "verlauf" AS v FROM "nutzer_profil"`).get(), { v: null });
  db.prepare(`UPDATE "nutzer_profil" SET "verlauf" = '[]'`).run();
  assert.deepEqual(db.prepare(`SELECT "verlauf" AS v FROM "nutzer_profil"`).get(), { v: "[]" });
});
```

- [ ] **Step 2: Test laufen lassen, scheitert** — `npx tsx --test tests/profil-verlauf-migration.test.ts`, Expected: FAIL (ENOENT).

- [ ] **Step 3: Migration und Schema**

```sql
-- 0020_profil_verlauf
--
-- Profil Stufe 3 (Spec 2026-10-07, Abschnitt 10): Verlauf des Netzes, beim
-- Speichern aus heutiger Sicht nachgerechnet. JSON-Liste der letzten 60 Schritte
-- [{anzahl, datum, geschmack}]; NULL, bis das Profil neu gerechnet ist.
-- Rein additiv: alter Code laeuft weiter.

-- AlterTable
ALTER TABLE "nutzer_profil" ADD COLUMN "verlauf" TEXT;
```

In `model NutzerProfil` nach `oeffentlich` (CRLF erhalten):

```prisma
  /// Verlauf des Netzes (Stufe 3): JSON [{anzahl, datum, geschmack}], die letzten 60 Schritte; null bis zur nächsten Rechnung.
  verlauf     String?
```

Dann `npm run db:generate`. Test erneut: PASS.

- [ ] **Step 4: Typen ergänzen** — ans Ende von `lib/profil-typen.ts`:

```ts
/** Geschmacksachsen −1..1, normiert auf das stärkste |Gewicht| (wie ProfilWerte.geschmack). */
export type Geschmack = Record<GeschmacksKategorie, number>;

/** Ein Schritt im Verlauf des Netzes (Spec Profil 10): das Netz nach den ersten `anzahl` Bewertungen. */
export type VerlaufSchritt = { anzahl: number; datum: string; geschmack: Geschmack };

/** Veränderung einer Achse zwischen zwei Ständen; positiv heißt „stärker gemocht“. */
export type NetzAenderung = { achse: GeschmacksKategorie; differenz: number };

/** Hersteller mit dem höchsten Mittel ab 2 eigenen Bewertungen (Spec Profil 10). */
export type Lieblingshersteller = { name: string; mittel: number; anzahl: number };
```

- [ ] **Step 5: `netzAenderung` mit Test**

```ts
// tests/netz-aenderung.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import type { Geschmack } from "@/lib/profil-typen";

const leer = (): Geschmack => Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])) as Geschmack;

test("netzAenderung: die zwei größten Differenzen, größte zuerst", () => {
  const vorher = leer();
  const nachher = { ...leer(), FRUCHTIG: 0.6, ERDIG: -0.3, ZITRUS: 0.1 };
  assert.deepEqual(netzAenderung(vorher, nachher), [
    { achse: "FRUCHTIG", differenz: 0.6 },
    { achse: "ERDIG", differenz: -0.3 },
  ]);
});

test("netzAenderung: unter der Schwelle zählt nicht, gleicher Stand ergibt leere Liste", () => {
  const g = { ...leer(), SUESS: 0.5 };
  assert.deepEqual(netzAenderung(g, { ...g, SUESS: 0.54 }), []);
  assert.deepEqual(netzAenderung(g, g), []);
});

test("netzAenderung: Gleichstand nach Achsenreihenfolge, stabil", () => {
  const a = netzAenderung(leer(), { ...leer(), HOLZIG: 0.4, ZITRUS: 0.4 });
  assert.deepEqual(a.map((x) => x.achse), ["ZITRUS", "HOLZIG"]);
});

test("aenderungsListe: stärker und schwächer mit Achsennamen", () => {
  const text = aenderungsListe(
    [{ achse: "FRUCHTIG", differenz: 0.6 }, { achse: "ERDIG", differenz: -0.3 }],
    de.label.geschmack,
    { staerker: de.profil.staerker, schwaecher: de.profil.schwaecher },
  );
  assert.equal(text, "Fruchtig stärker, Erdig schwächer");
});
```

Prüfe vor dem Test, dass `GESCHMACKS_KATEGORIEN` mit `ZITRUS` beginnt und `HOLZIG` danach kommt (`db/enums.ts`); sonst die Erwartung im dritten Test an die echte Reihenfolge anpassen. Prüfe, dass `de.label.geschmack.FRUCHTIG` „Fruchtig“ und `ERDIG` „Erdig“ heißt.

```ts
// lib/netz-aenderung.ts
import { GESCHMACKS_KATEGORIEN, type GeschmacksKategorie } from "@/db/enums";
import { t } from "@/lib/i18n/text";
import type { Geschmack, NetzAenderung } from "@/lib/profil-typen";

/**
 * Veränderung des Netzes zwischen zwei Ständen (Spec Profil 2.12): die Achsen
 * mit der größten Differenz, für Änderungszeile und Mini-Netz. Kleine
 * Schwankungen unter 0,05 zählen nicht; nur Aroma, nie Wirkung (HWG).
 */
export const AENDERUNG_SCHWELLE = 0.05;

const zwei = (x: number) => Math.round(x * 100) / 100 + 0;

export function netzAenderung(vorher: Geschmack, nachher: Geschmack, hoechstens = 2): NetzAenderung[] {
  return GESCHMACKS_KATEGORIEN.map((achse) => ({ achse, differenz: zwei((nachher[achse] ?? 0) - (vorher[achse] ?? 0)) }))
    .filter((a) => Math.abs(a.differenz) >= AENDERUNG_SCHWELLE)
    .sort(
      (a, b) =>
        Math.abs(b.differenz) - Math.abs(a.differenz) ||
        GESCHMACKS_KATEGORIEN.indexOf(a.achse) - GESCHMACKS_KATEGORIEN.indexOf(b.achse),
    )
    .slice(0, hoechstens);
}

/** „Fruchtig stärker, Erdig schwächer“ in der Sprache der Seite. */
export function aenderungsListe(
  liste: readonly NetzAenderung[],
  achsen: Record<GeschmacksKategorie, string>,
  texte: { staerker: string; schwaecher: string },
): string {
  return liste.map((a) => t(a.differenz > 0 ? texte.staerker : texte.schwaecher, { achse: achsen[a.achse] })).join(", ");
}
```

Run: `npx tsx --test tests/netz-aenderung.test.ts` — Expected: PASS (nach Step 7, weil die Texte dort entstehen; Step 7 vorziehen ist erlaubt).

- [ ] **Step 6: `NetzGrafik` herauslösen** — `components/profil/NetzGrafik.tsx` übernimmt aus `ProfilNetz.tsx` die Konstanten `GROESSE`, `MITTE`, `RADIUS`, `MAX`, `RINGE`, die Hilfe `gleichmaessig` und den Block `<div className="relative w-full max-w-sm">…</div>` (SVG mit Ringen, Achsen, Fläche `data-netz="mag"`, Strichlinie `data-netz="mag-nicht"`, Achsenbeschriftung). Neu ist nur die Kontur:

```tsx
// components/profil/NetzGrafik.tsx (Kern; Ringe, Achsen, Polygone 1:1 aus ProfilNetz)
import type { Geschmack } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";
import { alsPolygon, netzPunkte } from "@/lib/netz";

export const NETZ_MAX = 5;

/** Werte 0..5 je Achse in der Reihenfolge von GESCHMACKS_ACHSEN: Fläche „mag ich“, Strichlinie „mag ich nicht“. */
export function netzAusGeschmack(g: Geschmack): { mag: number[]; magNicht: number[] } {
  return {
    mag: GESCHMACKS_ACHSEN.map((a) => Math.max(0, g[a.enumWert] ?? 0) * NETZ_MAX),
    magNicht: GESCHMACKS_ACHSEN.map((a) => Math.max(0, -(g[a.enumWert] ?? 0)) * NETZ_MAX),
  };
}

type Props = {
  mag: readonly number[];
  magNicht: readonly number[];
  /** Dünne Kontur eines früheren Stands („mag ich“-Teil, 0..5); null ohne. */
  kontur?: readonly number[] | null;
  /** Achsennamen in GESCHMACKS_ACHSEN-Reihenfolge; null für das Mini-Netz ohne Beschriftung. */
  beschriftung?: readonly string[] | null;
  className?: string;
};

/**
 * Nur die Grafik des Aroma-Netzes, ohne Texte (Profil, Verlauf, Mini-Netz).
 * Tinte statt Blattgrün; das SVG ist aria-hidden, die Werte nennt der Aufrufer.
 */
export function NetzGrafik({ mag, magNicht, kontur = null, beschriftung = null, className = "w-full max-w-sm" }: Props) {
  // … Ringe und Achsen wie bisher …
  // nach den Ringen/Achsen, VOR der Fläche:
  // {kontur && kontur.some((x) => x > 0) ? (
  //   <polygon data-netz="vorher" points={alsPolygon(netzPunkte(kontur, NETZ_MAX, RADIUS, MITTE))}
  //     fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} vectorEffect="non-scaling-stroke" />
  // ) : null}
  // … Fläche mag (wenn mag.some(x>0)), Strichlinie mag-nicht (wenn magNicht.some(x>0)) wie bisher …
  // Beschriftung nur, wenn `beschriftung` gesetzt ist (span je Achse wie bisher, Text = beschriftung[i]).
}
```

Der Wrapper bekommt `className={\`relative ${className}\`}`. `ProfilNetz` ruft danach `const { mag, magNicht } = netzAusGeschmack(werte.geschmack)` und rendert `<NetzGrafik mag={mag} magNicht={magNicht} beschriftung={GESCHMACKS_ACHSEN.map((a) => achsen[a.enumWert])} />` an der Stelle des alten Blocks. Legende, Screenreader-Liste und Hinweise bleiben in `ProfilNetz` unverändert.

Run: `npx tsx --test tests/profil-bausteine.test.ts tests/profil-oeffentlich.test.ts` — Expected: PASS ohne Änderung an den Tests (gleiche Ausgabe). Neuer Test ans Ende von `tests/profil-bausteine.test.ts`:

```ts
import { NetzGrafik } from "@/components/profil/NetzGrafik";

test("NetzGrafik: Kontur vorher dünn ohne Fläche, ohne Kontur kein data-netz=vorher", () => {
  const null10 = Array(10).fill(0);
  const mit = renderToStaticMarkup(createElement(NetzGrafik, { mag: [5, ...Array(9).fill(0)], magNicht: null10, kontur: [3, ...Array(9).fill(0)] }));
  assert.match(mit, /data-netz="vorher"[^>]*fill="none"[^>]*stroke-opacity="0.45"/);
  const ohne = renderToStaticMarkup(createElement(NetzGrafik, { mag: [5, ...Array(9).fill(0)], magNicht: null10 }));
  assert.doesNotMatch(ohne, /data-netz="vorher"/);
  assert.doesNotMatch(ohne, /<span/); // ohne Beschriftung keine Achsennamen
});
```

- [ ] **Step 7: Texte** — in `lib/i18n/de.ts` unter `profil` (nach `gesamt`) und gleichlautend strukturiert in `lib/i18n/en.ts`:

```ts
    vorher: "vor der letzten Bewertung",
    staerker: "{achse} stärker",
    schwaecher: "{achse} schwächer",
    aenderung: "Mit deiner Bewertung vom {datum}: {liste}.",
    aenderungGleich: "Mit deiner Bewertung vom {datum} blieb dein Netz gleich.",
    verlaufTitel: "Dein Verlauf",
    verlaufSatz: "Dein Netz nach jeder Bewertung, aus heutiger Sicht nachgerechnet.",
    verlaufSchritt: "Nach {anzahl} von {gesamt} Bewertungen · {datum}",
    verlaufRegler: "Stand nach Bewertung",
    verlaufLeer: "Ab zwei Bewertungen siehst du hier, wie dein Netz wächst.",
    herstellerTitel: "Lieblingshersteller",
    herstellerSatz: "{name}: im Schnitt {note} von 5 aus {anzahl} Bewertungen.",
    herstellerLeer: "Sobald du zwei Blüten desselben Herstellers bewertet hast, steht hier dein Liebling.",
```

en:

```ts
    vorher: "before your latest review",
    staerker: "{achse} stronger",
    schwaecher: "{achse} weaker",
    aenderung: "With your review from {datum}: {liste}.",
    aenderungGleich: "Your review from {datum} left your web unchanged.",
    verlaufTitel: "Your history",
    verlaufSatz: "Your web after each review, recalculated with today's data.",
    verlaufSchritt: "After {anzahl} of {gesamt} reviews · {datum}",
    verlaufRegler: "State after review",
    verlaufLeer: "From two reviews on, you can watch your web grow here.",
    herstellerTitel: "Favourite producer",
    herstellerSatz: "{name}: {note} out of 5 on average across {anzahl} reviews.",
    herstellerLeer: "Once you have reviewed two flowers from the same producer, your favourite shows up here.",
```

Unter `bewerten` (am Ende des Blocks), de:

```ts
    miniNetzTitel: "So hat sich dein Netz verändert",
    miniNetzAenderung: "{liste}.",
    miniNetzGleich: "Dein Netz bleibt gleich: nur Noten ab 3,5 oder bis 2 formen es.",
    miniNetzVorher: "vorher",
    miniNetzJetzt: "jetzt",
    miniNetzLink: "Zu deinem Profil",
    miniStaerker: "{achse} stärker",
    miniSchwaecher: "{achse} schwächer",
```

en:

```ts
    miniNetzTitel: "How your web changed",
    miniNetzAenderung: "{liste}.",
    miniNetzGleich: "Your web stays the same: only ratings from 3.5 up or 2 and below shape it.",
    miniNetzVorher: "before",
    miniNetzJetzt: "now",
    miniNetzLink: "Go to your profile",
    miniStaerker: "{achse} stronger",
    miniSchwaecher: "{achse} weaker",
```

- [ ] **Step 8: Alles prüfen** — `npm test` (alle grün), `npx tsc --noEmit -p .`, `npx eslint lib/netz-aenderung.ts components/profil/NetzGrafik.tsx components/profil/ProfilNetz.tsx lib/profil-typen.ts`.

- [ ] **Step 9: Commit**

```bash
git add migrations/0020_profil_verlauf.sql prisma/schema.prisma lib/profil-typen.ts lib/netz-aenderung.ts components/profil/NetzGrafik.tsx components/profil/ProfilNetz.tsx lib/i18n/de.ts lib/i18n/en.ts tests/profil-verlauf-migration.test.ts tests/netz-aenderung.test.ts tests/profil-bausteine.test.ts
git commit -m "feat: Fundament Profil Stufe 3 (Verlaufsspalte, Netzänderung, NetzGrafik, Texte)"
```

---

### Task 2 (Strang A): Verlauf rechnen und ablegen

**Files:**
- Modify: `lib/empfehlung.ts` (neue Funktion `geschmacksBeitraege`)
- Modify: `lib/profil.ts` (Normierung als `geschmackAusVektor` exportieren)
- Create: `lib/profil-verlauf.ts`, `tests/profil-verlauf.test.ts`
- Modify: `lib/query/profil.ts` (`profilFortschreiben` schreibt `verlauf`; `ladeProfil` liefert `verlauf`)

**Interfaces:**
- Consumes: `VerlaufSchritt`, `Geschmack` (Task 1), Spalte `verlauf`.
- Produces aus `lib/empfehlung.ts`: `geschmacksBeitraege(bewertungen: readonly EigeneBewertung[], sorten: readonly SortenAroma[]): Map<string, number>[]` (je Bewertung, nur `g:`-Schlüssel, Gewicht schon eingerechnet; leer bei Gewicht 0).
- Produces aus `lib/profil.ts`: `geschmackAusVektor(profil: ReadonlyMap<string, number>): Geschmack`.
- Produces aus `lib/profil-verlauf.ts`: `VERLAUF_HOECHSTENS = 60`, `type VerlaufEingabe = EigeneBewertung & { erstelltAm: Date }`, `profilVerlauf(bewertungen: readonly VerlaufEingabe[], sorten: readonly SortenAroma[]): VerlaufSchritt[]`, `verlaufDaten(s: readonly VerlaufSchritt[]): string`, `verlaufAusDaten(roh: string | null): VerlaufSchritt[]`.
- Produces aus `lib/query/profil.ts`: `ladeProfil` und `aktuellesProfil` liefern `{ werte: ProfilWerte; berechnetAm: Date; verlauf: VerlaufSchritt[] } | null`.

- [ ] **Step 1: Failing tests schreiben**

```ts
// tests/profil-verlauf.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import type { SortenAroma } from "@/lib/empfehlung";
import { profilAnzeige } from "@/lib/profil";
import { profilVerlauf, verlaufAusDaten, verlaufDaten, VERLAUF_HOECHSTENS, type VerlaufEingabe } from "@/lib/profil-verlauf";

// Sorten ohne Herstellerterpene: das Netz entsteht allein aus den Reglern.
const sorten: SortenAroma[] = [];
const tag = (n: number) => new Date(Date.UTC(2026, 8, n));
const b = (strainId: string, gesamtnote: number | null, geschmack: Record<string, number>, n: number): VerlaufEingabe => ({
  strainId,
  gesamtnote,
  terpene: {},
  geschmack,
  erstelltAm: tag(n),
});

test("profilVerlauf: ein Schritt je Bewertung, nach Datum, Zähler ab 1", () => {
  const reihe = [b("s2", 4.5, { erdig: 4 }, 3), b("s1", 5, { fruchtig: 5 }, 1)];
  const v = profilVerlauf(reihe, sorten);
  assert.deepEqual(v.map((s) => s.anzahl), [1, 2]);
  assert.equal(v[0].datum, tag(1).toISOString());
  assert.equal(v[0].geschmack.FRUCHTIG, 1);
  assert.equal(v[0].geschmack.ERDIG, 0);
  assert.ok(v[1].geschmack.ERDIG > 0);
});

test("profilVerlauf: letzter Schritt gleich dem Profilnetz", () => {
  const reihe = [b("s1", 5, { fruchtig: 5, suess: 2 }, 1), b("s2", 1.5, { erdig: 4 }, 2), b("s3", 4, { zitrus: 3 }, 3)];
  const letzter = profilVerlauf(reihe, sorten).at(-1)!;
  const netz = profilAnzeige(reihe, sorten).geschmack;
  for (const k of Object.keys(netz) as (keyof typeof netz)[]) assert.ok(Math.abs(letzter.geschmack[k] - netz[k]) <= 0.01, k);
});

test("profilVerlauf: Mittelfeld und fehlende Note lassen den Schritt gleich", () => {
  const v = profilVerlauf([b("s1", 5, { fruchtig: 5 }, 1), b("s2", 3, { erdig: 5 }, 2), b("s3", null, { erdig: 5 }, 3)], sorten);
  assert.deepEqual(v[1].geschmack, v[0].geschmack);
  assert.deepEqual(v[2].geschmack, v[0].geschmack);
});

test("profilVerlauf: höchstens 60 Schritte, die neuesten", () => {
  const reihe = Array.from({ length: 70 }, (_, i) => b(`s${i}`, 5, { fruchtig: 5 }, i + 1));
  const v = profilVerlauf(reihe, sorten);
  assert.equal(v.length, VERLAUF_HOECHSTENS);
  assert.equal(v[0].anzahl, 11);
  assert.equal(v.at(-1)!.anzahl, 70);
});

test("profilVerlauf: 1000 Bewertungen in unter 20 ms (CPU-Grenze 10 ms im Worker, hier großzügig)", () => {
  const reihe = Array.from({ length: 1000 }, (_, i) => b(`s${i}`, i % 2 ? 5 : 1, { fruchtig: i % 5, erdig: (i * 3) % 5 }, (i % 28) + 1));
  const start = performance.now();
  profilVerlauf(reihe, sorten);
  assert.ok(performance.now() - start < 20);
});

test("verlaufDaten/verlaufAusDaten: Hin und zurück, NULL und Kaputtes ergeben leere Liste", () => {
  const v = profilVerlauf([b("s1", 5, { fruchtig: 5 }, 1)], sorten);
  assert.deepEqual(verlaufAusDaten(verlaufDaten(v)), v);
  assert.deepEqual(verlaufAusDaten(null), []);
  assert.deepEqual(verlaufAusDaten("{kaputt"), []);
  assert.deepEqual(verlaufAusDaten('[{"anzahl":"x"}]'), []);
});

test("profilFortschreiben schreibt den Verlauf, ladeProfil liest ihn", () => {
  const q = readFileSync("lib/query/profil.ts", "utf8");
  assert.match(q, /verlauf: verlaufDaten\(profilVerlauf\(/);
  assert.match(q, /erstelltAm: true/);
  assert.match(q, /verlaufAusDaten\(/);
});
```

Prüfe vor dem Lauf in `lib/query/bewertung.ts`, dass die Achsenschlüssel `fruchtig`, `erdig`, `suess`, `zitrus` heißen (`GESCHMACKS_ACHSEN`).

- [ ] **Step 2: Laufen lassen, scheitert** — `npx tsx --test tests/profil-verlauf.test.ts`, Expected: FAIL (Modul fehlt).

- [ ] **Step 3: `geschmacksBeitraege` in `lib/empfehlung.ts`** (nach `profilAus`):

```ts
/**
 * Beitrag jeder Bewertung zu den Geschmacksachsen des Profils, Gewicht schon
 * eingerechnet; nur `g:`-Schlüssel. Dieselbe Rechnung wie profilAus, aber je
 * Bewertung einzeln: der Verlauf (Profil Stufe 3) summiert sie Schritt für
 * Schritt und bleibt so linear statt quadratisch.
 */
export function geschmacksBeitraege(bewertungen: readonly EigeneBewertung[], sorten: readonly SortenAroma[]): Map<string, number>[] {
  const jeId = new Map(sorten.map((s) => [s.strainId, s]));
  return bewertungen.map((bewertung) => {
    const aus = new Map<string, number>();
    const gewicht = bewertungsGewicht(bewertung.gesamtnote);
    if (gewicht === 0) return aus;
    for (const [k, x] of normiert(bewertungsVektor(bewertung, jeId.get(bewertung.strainId)))) {
      if (k.startsWith("g:")) aus.set(k, gewicht * x);
    }
    return aus;
  });
}
```

- [ ] **Step 4: `geschmackAusVektor` in `lib/profil.ts`** — die Normierung aus `profilAnzeige` herausziehen, `profilAnzeige` ruft sie auf (Verhalten gleich):

```ts
/** Die 10 Geschmacksachsen eines Profilvektors, auf das stärkste |Gewicht| normiert (Spec 4.2). */
export function geschmackAusVektor(profil: ReadonlyMap<string, number>): Geschmack {
  const geschmack = leererGeschmack();
  let maxG = 0;
  for (const k of GESCHMACKS_KATEGORIEN) maxG = Math.max(maxG, Math.abs(profil.get(`g:${k}`) ?? 0));
  if (maxG > 0) for (const k of GESCHMACKS_KATEGORIEN) geschmack[k] = zwei((profil.get(`g:${k}`) ?? 0) / maxG);
  return geschmack;
}
```

In `profilAnzeige`: `const geschmack = geschmackAusVektor(profil);` statt der bisherigen fünf Zeilen. `Geschmack` aus `@/lib/profil-typen` importieren.

- [ ] **Step 5: `lib/profil-verlauf.ts`**

```ts
import { istGeschmacksKategorie } from "@/db/enums";
import { geschmacksBeitraege, type EigeneBewertung, type SortenAroma } from "@/lib/empfehlung";
import { geschmackAusVektor, leereProfilWerte } from "@/lib/profil";
import type { VerlaufSchritt } from "@/lib/profil-typen";

/**
 * Verlauf des Netzes (Spec Profil 2.6 und 10): aus heutiger Sicht
 * nachgerechnet, keine Momentaufnahmen. Schritt k ist das Netz nach den
 * ersten k Bewertungen in Datumsreihenfolge. Läuft beim Speichern, nie je
 * Seitenaufruf; Präfixsummen halten es linear (Workers-CPU 10 ms).
 */
export const VERLAUF_HOECHSTENS = 60;

export type VerlaufEingabe = EigeneBewertung & { erstelltAm: Date };

export function profilVerlauf(bewertungen: readonly VerlaufEingabe[], sorten: readonly SortenAroma[]): VerlaufSchritt[] {
  const reihe = [...bewertungen].sort(
    (a, b) => a.erstelltAm.getTime() - b.erstelltAm.getTime() || a.strainId.localeCompare(b.strainId),
  );
  const beitraege = geschmacksBeitraege(reihe, sorten);
  const summe = new Map<string, number>();
  const schritte: VerlaufSchritt[] = [];
  reihe.forEach((bewertung, i) => {
    for (const [k, x] of beitraege[i]) summe.set(k, (summe.get(k) ?? 0) + x);
    schritte.push({ anzahl: i + 1, datum: bewertung.erstelltAm.toISOString(), geschmack: geschmackAusVektor(summe) });
  });
  return schritte.slice(-VERLAUF_HOECHSTENS);
}

export function verlaufDaten(schritte: readonly VerlaufSchritt[]): string {
  return JSON.stringify(schritte);
}

/** Liest die Spalte `verlauf`; NULL, Kaputtes oder ein falscher Schritt ergibt die leere Liste. */
export function verlaufAusDaten(roh: string | null): VerlaufSchritt[] {
  if (roh === null) return [];
  let wert: unknown;
  try {
    wert = JSON.parse(roh);
  } catch {
    return [];
  }
  if (!Array.isArray(wert)) return [];
  const aus: VerlaufSchritt[] = [];
  for (const s of wert) {
    if (!s || typeof s !== "object") return [];
    const { anzahl, datum, geschmack } = s as Record<string, unknown>;
    if (typeof anzahl !== "number" || typeof datum !== "string" || !geschmack || typeof geschmack !== "object") return [];
    const g = leereProfilWerte().geschmack;
    for (const [k, v] of Object.entries(geschmack)) {
      if (istGeschmacksKategorie(k) && typeof v === "number" && Number.isFinite(v)) g[k] = Math.max(-1, Math.min(1, v));
    }
    aus.push({ anzahl, datum, geschmack: g });
  }
  return aus;
}
```

- [ ] **Step 6: `lib/query/profil.ts`** — in `profilFortschreiben` dem `select` `erstelltAm: true` hinzufügen. Nach `const liste = …`:

```ts
  // Verlauf (Stufe 3): dieselben Bewertungen mit Datum, aus heutiger Sicht nachgerechnet.
  const mitDatum = bewertungen.map((b, i) => ({ ...b, erstelltAm: eigene[i].erstelltAm }));
```

und in `daten` die Zeile `verlauf: verlaufDaten(profilVerlauf(mitDatum, bewertete)),` ergänzen. `ladeProfil`:

```ts
export async function ladeProfil(
  mitgliedId: string,
): Promise<{ werte: ProfilWerte; berechnetAm: Date; verlauf: VerlaufSchritt[] } | null> {
  const prisma = await getPrisma();
  const z = await prisma.nutzerProfil.findUnique({ where: { mitgliedId } });
  return z ? { werte: profilAusDaten(z), berechnetAm: z.berechnetAm, verlauf: verlaufAusDaten(z.verlauf) } : null;
}
```

`aktuellesProfil` bekommt denselben Rückgabetyp (Signatur anpassen, Rumpf bleibt).

- [ ] **Step 7: Tests grün** — `npx tsx --test tests/profil-verlauf.test.ts tests/profil.test.ts tests/empfehlung*.test.ts`, dann `npm test`, `npx tsc --noEmit -p .`, `npx eslint lib/empfehlung.ts lib/profil.ts lib/profil-verlauf.ts lib/query/profil.ts`. Expected: alles grün.

- [ ] **Step 8: Commit**

```bash
git add lib/empfehlung.ts lib/profil.ts lib/profil-verlauf.ts lib/query/profil.ts tests/profil-verlauf.test.ts
git commit -m "feat: Verlauf des Netzes beim Speichern nachrechnen und ablegen"
```

---

### Task 3 (Strang B): Lieblingshersteller

**Files:**
- Create: `lib/lieblingshersteller.ts`, `lib/query/lieblingshersteller.ts`, `components/profil/Lieblingshersteller.tsx`, `tests/lieblingshersteller.test.ts`

**Interfaces:**
- Consumes: `Lieblingshersteller` (Task 1), `noteOderErsatz` aus `lib/profil.ts` (besteht), Texte `w.profil.hersteller*` (Task 1).
- Produces: `lieblingshersteller(zeilen: readonly { hersteller: string | null; note: number }[]): Lieblingshersteller | null`; `ladeLieblingshersteller(mitgliedId: string): Promise<Lieblingshersteller | null>`; Komponente `Lieblingshersteller({ daten, texte, sprache }: { daten: Lieblingshersteller | null; texte: Woerterbuch["profil"]; sprache: Sprache })`.

- [ ] **Step 1: Failing tests**

```ts
// tests/lieblingshersteller.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Lieblingshersteller } from "@/components/profil/Lieblingshersteller";
import { de } from "@/lib/i18n/de";
import { lieblingshersteller } from "@/lib/lieblingshersteller";

test("lieblingshersteller: höchstes Mittel ab 2 eigenen Bewertungen", () => {
  const z = [
    { hersteller: "Aurora", note: 5 },
    { hersteller: "Tilray", note: 4 },
    { hersteller: "Tilray", note: 4.5 },
    { hersteller: "Bedrocan", note: 3 },
    { hersteller: "Bedrocan", note: 3.5 },
  ];
  assert.deepEqual(lieblingshersteller(z), { name: "Tilray", mittel: 4.3, anzahl: 2 });
});

test("lieblingshersteller: ohne Hersteller oder unter 2 Bewertungen keiner", () => {
  assert.equal(lieblingshersteller([{ hersteller: null, note: 5 }, { hersteller: null, note: 5 }, { hersteller: "A", note: 5 }]), null);
  assert.equal(lieblingshersteller([]), null);
});

test("lieblingshersteller: Gleichstand erst nach Anzahl, dann nach Name", () => {
  const z = [
    { hersteller: "B", note: 4 }, { hersteller: "B", note: 4 },
    { hersteller: "A", note: 4 }, { hersteller: "A", note: 4 },
    { hersteller: "C", note: 4 }, { hersteller: "C", note: 4 }, { hersteller: "C", note: 4 },
  ];
  assert.equal(lieblingshersteller(z)?.name, "C");
  assert.equal(lieblingshersteller(z.slice(0, 4))?.name, "A");
});

test("lieblingshersteller: gleicher Name mit Leerzeichen zählt zusammen", () => {
  assert.equal(lieblingshersteller([{ hersteller: "Aurora ", note: 4 }, { hersteller: "Aurora", note: 4 }])?.anzahl, 2);
});

test("Lieblingshersteller: Satz mit Komma-Note, sonst Hinweis", () => {
  const mit = renderToStaticMarkup(createElement(Lieblingshersteller, { daten: { name: "Tilray", mittel: 4.3, anzahl: 2 }, texte: de.profil, sprache: "de" }));
  assert.match(mit, /Tilray: im Schnitt 4,3 von 5 aus 2 Bewertungen\./);
  const ohne = renderToStaticMarkup(createElement(Lieblingshersteller, { daten: null, texte: de.profil, sprache: "de" }));
  assert.match(ohne, /Sobald du zwei Blüten desselben Herstellers/);
});

test("ladeLieblingshersteller: nur eigene Bewertungen, begrenzt, Ersatznote", () => {
  const q = readFileSync("lib/query/lieblingshersteller.ts", "utf8");
  assert.match(q, /where: \{ autorId: mitgliedId \}/);
  assert.match(q, /take: /);
  assert.match(q, /noteOderErsatz\(/);
});
```

- [ ] **Step 2: Laufen lassen, scheitert** — `npx tsx --test tests/lieblingshersteller.test.ts`, Expected: FAIL.

- [ ] **Step 3: Implementierung**

```ts
// lib/lieblingshersteller.ts
import type { Lieblingshersteller } from "@/lib/profil-typen";

/**
 * Lieblingshersteller (Spec Profil 10): der Hersteller mit dem höchsten Mittel
 * der eigenen Gesamtnoten, ab 2 eigenen Bewertungen. Gleichstand: mehr
 * Bewertungen zuerst, dann der Name. Verglichen wird ungerundet.
 */
export function lieblingshersteller(zeilen: readonly { hersteller: string | null; note: number }[]): Lieblingshersteller | null {
  const je = new Map<string, { summe: number; anzahl: number }>();
  for (const z of zeilen) {
    const name = z.hersteller?.trim();
    if (!name) continue;
    const e = je.get(name) ?? { summe: 0, anzahl: 0 };
    e.summe += z.note;
    e.anzahl += 1;
    je.set(name, e);
  }
  const kandidaten = [...je]
    .filter(([, e]) => e.anzahl >= 2)
    .map(([name, e]) => ({ name, mittel: e.summe / e.anzahl, anzahl: e.anzahl }))
    .sort((a, b) => b.mittel - a.mittel || b.anzahl - a.anzahl || a.name.localeCompare(b.name, "de"));
  const erster = kandidaten[0];
  return erster ? { name: erster.name, mittel: Math.round(erster.mittel * 10) / 10, anzahl: erster.anzahl } : null;
}
```

```ts
// lib/query/lieblingshersteller.ts
import { lieblingshersteller } from "@/lib/lieblingshersteller";
import { getPrisma } from "@/lib/prisma";
import { noteOderErsatz } from "@/lib/profil";
import type { Lieblingshersteller } from "@/lib/profil-typen";

/** Eigene Bewertungen mit Hersteller der Sorte, je Aufruf gerechnet (reine Arithmetik, höchstens 1000 Zeilen). */
export async function ladeLieblingshersteller(mitgliedId: string): Promise<Lieblingshersteller | null> {
  const prisma = await getPrisma();
  const zeilen = await prisma.review.findMany({
    where: { autorId: mitgliedId },
    take: 1000,
    select: {
      gesamtnote: true,
      aussehen: true,
      geruch: true,
      geschmack: true,
      wirkung: true,
      konsistenz: true,
      strain: { select: { hersteller: { select: { name: true } } } },
    },
  });
  return lieblingshersteller(zeilen.map((z) => ({ hersteller: z.strain.hersteller?.name ?? null, note: noteOderErsatz(z) })));
}
```

```tsx
// components/profil/Lieblingshersteller.tsx
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Lieblingshersteller as Daten } from "@/lib/profil-typen";

type Props = { daten: Daten | null; texte: Woerterbuch["profil"]; sprache: Sprache };

/** Lieblingshersteller (Spec Profil 10), privat. Kein Kauf- oder Apothekenlink (HWG). */
export function Lieblingshersteller({ daten, texte, sprache }: Props) {
  if (!daten) return <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.herstellerLeer}</p>;
  return (
    <p className="max-w-[68ch] text-body text-text text-pretty">
      {t(texte.herstellerSatz, { name: daten.name, note: formatiereZahl(daten.mittel, 1, sprache), anzahl: daten.anzahl })}
    </p>
  );
}
```

Prüfe, dass `formatiereZahl(4.3, 1, "de")` „4,3“ liefert (`lib/format.ts:223`); sonst `formatiereWert` nehmen wie in `TopFlop`.

- [ ] **Step 4: Tests grün** — `npx tsx --test tests/lieblingshersteller.test.ts`, `npm test`, `npx tsc --noEmit -p .`, `npx eslint lib/lieblingshersteller.ts lib/query/lieblingshersteller.ts components/profil/Lieblingshersteller.tsx`.

- [ ] **Step 5: Commit**

```bash
git add lib/lieblingshersteller.ts lib/query/lieblingshersteller.ts components/profil/Lieblingshersteller.tsx tests/lieblingshersteller.test.ts
git commit -m "feat: Lieblingshersteller im Profil"
```

---

### Task 4 (Strang C): Kontur „vorher“, Änderungszeile, Verlauf zum Durchblättern

**Files:**
- Modify: `components/profil/ProfilNetz.tsx`
- Create: `components/profil/NetzVerlauf.tsx`, `tests/profil-verlauf-ui.test.ts`

**Interfaces:**
- Consumes: `NetzGrafik`, `netzAusGeschmack` (Task 1), `Geschmack`, `VerlaufSchritt` (Task 1), Texte `w.profil.vorher`, `verlauf*` (Task 1).
- Produces: `ProfilNetz` mit zwei optionalen Props `vorher?: Geschmack | null` und `aenderung?: string | null` (fertiger Satz; der Aufrufer baut ihn). `NetzVerlauf({ schritte, texte, achsen, sprache }: { schritte: readonly VerlaufSchritt[]; texte: Woerterbuch["profil"]; achsen: Woerterbuch["label"]["geschmack"]; sprache: Sprache })`, Client-Komponente.

- [ ] **Step 1: Failing tests**

```ts
// tests/profil-verlauf-ui.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { NetzVerlauf } from "@/components/profil/NetzVerlauf";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import type { Geschmack, ProfilWerte, VerlaufSchritt } from "@/lib/profil-typen";

const g = (teil: Partial<Geschmack> = {}): Geschmack =>
  ({ ...Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])), ...teil }) as Geschmack;
const werte = (geschmack: Geschmack): ProfilWerte => ({ geschmack, terpene: [], anzahl: 4, gewichtet: 4 });
const netz = (p: Record<string, unknown>) =>
  renderToStaticMarkup(createElement(ProfilNetz, { werte: werte(g({ FRUCHTIG: 1 })), texte: de.profil, achsen: de.label.geschmack, sprache: "de", ...p }));

test("ProfilNetz: Kontur vorher mit Legende und Änderungszeile", () => {
  const html = netz({ vorher: g({ FRUCHTIG: 0.5 }), aenderung: "Mit deiner Bewertung vom 02.10.2026: Fruchtig stärker." });
  assert.match(html, /data-netz="vorher"/);
  assert.match(html, /vor der letzten Bewertung/);
  assert.match(html, /Fruchtig stärker\./);
});

test("ProfilNetz: ohne vorher keine Kontur und keine Legende dafür (öffentliches Profil, erste Bewertung)", () => {
  const html = netz({});
  assert.doesNotMatch(html, /data-netz="vorher"/);
  assert.doesNotMatch(html, /vor der letzten Bewertung/);
});

const schritt = (anzahl: number, teil: Partial<Geschmack>): VerlaufSchritt => ({
  anzahl,
  datum: new Date(Date.UTC(2026, 8, anzahl)).toISOString(),
  geschmack: g(teil),
});
const verlauf = (schritte: VerlaufSchritt[]) =>
  renderToStaticMarkup(createElement(NetzVerlauf, { schritte, texte: de.profil, achsen: de.label.geschmack, sprache: "de" }));

test("NetzVerlauf: unter zwei Schritten nur der Hinweis", () => {
  assert.match(verlauf([schritt(1, { FRUCHTIG: 1 })]), /Ab zwei Bewertungen/);
  assert.match(verlauf([]), /Ab zwei Bewertungen/);
});

test("NetzVerlauf: Regler über alle Schritte, Start beim neuesten, Beschriftung mit Datum", () => {
  const html = verlauf([schritt(1, { FRUCHTIG: 1 }), schritt(2, { FRUCHTIG: 1, ERDIG: -0.5 }), schritt(3, { ZITRUS: 1 })]);
  assert.match(html, /type="range"/);
  assert.match(html, /min="0"/);
  assert.match(html, /max="2"/);
  assert.match(html, /value="2"/);
  assert.match(html, /Nach 3 von 3 Bewertungen · 03\.09\.2026/);
  assert.match(html, /aria-valuetext="Nach 3 von 3 Bewertungen · 03\.09\.2026"/);
});
```

Prüfe, dass `formatiereDatum(…, "de")` das Format `03.09.2026` liefert (`lib/format.ts:150`, wie `/profil/<kurz-id>` es zeigt); sonst die Erwartung an das echte Format anpassen.

- [ ] **Step 2: Laufen lassen, scheitert** — `npx tsx --test tests/profil-verlauf-ui.test.ts`, Expected: FAIL.

- [ ] **Step 3: `ProfilNetz` erweitern** — Props um `vorher?: Geschmack | null; aenderung?: string | null` ergänzen (Vorgabe null). Im Rumpf:

```tsx
  const kontur = vorher ? netzAusGeschmack(vorher).mag : null;
  const hatKontur = !!kontur && kontur.some((x) => x > 0);
```

`<NetzGrafik … kontur={hatKontur ? kontur : null} />`. In der Legende (innerhalb `hatMag || hatMagNicht`) nach „mag ich nicht“:

```tsx
            {hatKontur ? (
              <li className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6 text-text">
                  <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
                </svg>
                {texte.vorher}
              </li>
            ) : null}
```

Nach der `figcaption`: `{aenderung ? <p className="max-w-[48ch] text-center text-small text-text-muted text-pretty">{aenderung}</p> : null}`. Der Typ von `texte` bleibt `Woerterbuch["profil"]`; die öffentliche Seite übergibt weder `vorher` noch `aenderung`.

- [ ] **Step 4: `NetzVerlauf`**

```tsx
// components/profil/NetzVerlauf.tsx
"use client";

import { useState } from "react";

import { NetzGrafik, netzAusGeschmack } from "@/components/profil/NetzGrafik";
import { formatiereDatum } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { VerlaufSchritt } from "@/lib/profil-typen";
import { GESCHMACKS_ACHSEN } from "@/lib/query/bewertung";

type Props = {
  schritte: readonly VerlaufSchritt[];
  texte: Woerterbuch["profil"];
  achsen: Woerterbuch["label"]["geschmack"];
  sprache: Sprache;
};

/**
 * Verlauf des Netzes (Spec Profil 10): ein Regler über die gespeicherten
 * Schritte, Start beim neuesten. Der vorige Schritt steht als dünne Kontur
 * dahinter. Keine Bewegung; nur Aroma (HWG). Der Regler nennt den Stand als
 * aria-valuetext, das SVG ist stumm.
 */
export function NetzVerlauf({ schritte, texte, achsen, sprache }: Props) {
  const [index, setIndex] = useState(schritte.length - 1);
  if (schritte.length < 2) return <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.verlaufLeer}</p>;

  const i = Math.min(Math.max(index, 0), schritte.length - 1);
  const schritt = schritte[i];
  const gesamt = schritte[schritte.length - 1].anzahl;
  const { mag, magNicht } = netzAusGeschmack(schritt.geschmack);
  const kontur = i > 0 ? netzAusGeschmack(schritte[i - 1].geschmack).mag : null;
  const stand = t(texte.verlaufSchritt, { anzahl: schritt.anzahl, gesamt, datum: formatiereDatum(schritt.datum, sprache) });

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <p className="max-w-[68ch] self-start text-body text-text-muted text-pretty">{texte.verlaufSatz}</p>
      <NetzGrafik mag={mag} magNicht={magNicht} kontur={kontur} beschriftung={GESCHMACKS_ACHSEN.map((a) => achsen[a.enumWert])} />
      <label className="flex w-full max-w-sm flex-col gap-2">
        <span className="text-small text-text-muted">{texte.verlaufRegler}</span>
        <input
          type="range"
          min={0}
          max={schritte.length - 1}
          step={1}
          value={i}
          aria-valuetext={stand}
          onChange={(e) => setIndex(Number(e.currentTarget.value))}
          className="w-full accent-current"
        />
      </label>
      <p aria-hidden="true" className="text-small text-text-muted numeric">{stand}</p>
    </div>
  );
}
```

Vor dem Styling des Reglers `ui-design-engine` laden; gibt es in `components/ui` schon einen Regler-Baustein (z. B. für die Bewertungsregler), den nehmen statt des rohen `<input type="range">`, solange der Test (`type="range"`, `min/max/value`, `aria-valuetext`) erfüllt bleibt.

- [ ] **Step 5: Tests grün** — `npx tsx --test tests/profil-verlauf-ui.test.ts tests/profil-bausteine.test.ts tests/profil-oeffentlich.test.ts`, `npm test`, `npx tsc --noEmit -p .`, `npx eslint components/profil/ProfilNetz.tsx components/profil/NetzVerlauf.tsx`.

- [ ] **Step 6: Commit**

```bash
git add components/profil/ProfilNetz.tsx components/profil/NetzVerlauf.tsx tests/profil-verlauf-ui.test.ts
git commit -m "feat: Kontur vor der letzten Bewertung und Verlauf des Netzes"
```

---

### Task 5 (Strang D): Mini-Netz nach dem Speichern

**Files:**
- Modify: `app/[lang]/blueten/[slug]/aktionen.ts` (CRLF)
- Modify: `components/review/BewertungsFormular.tsx` (CRLF), `app/[lang]/blueten/[slug]/page.tsx` (Prop `achsen`)
- Create: `lib/netz-animation.ts`, `components/review/MiniNetz.tsx`, `tests/mini-netz.test.ts`

**Interfaces:**
- Consumes: `ladeProfil` aus `lib/query/profil.ts` (besteht; Strang A ergänzt nur ein Feld), `NetzGrafik`, `netzAusGeschmack`, `netzAenderung`, `aenderungsListe`, `Geschmack` (Task 1), Texte `w.bewerten.miniNetz*`, `miniStaerker`, `miniSchwaecher` (Task 1).
- Produces: `BewertungErgebnis` im Erfolgsfall mit `netz: { vorher: Geschmack | null; nachher: Geschmack } | null`. Aus `lib/netz-animation.ts`: `NETZ_DAUER_MS = 700`, `ausklingen(t: number): number`, `zwischenGeschmack(vorher: Geschmack, nachher: Geschmack, t: number): Geschmack`, `startFortschritt(reduziert: boolean): number`. Komponente `MiniNetz({ vorher, nachher, texte, achsen }: { vorher: Geschmack | null; nachher: Geschmack; texte: Woerterbuch["bewerten"]; achsen: Woerterbuch["label"]["geschmack"] })`.

- [ ] **Step 1: Failing tests**

```ts
// tests/mini-netz.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MiniNetz } from "@/components/review/MiniNetz";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { de } from "@/lib/i18n/de";
import { ausklingen, startFortschritt, zwischenGeschmack } from "@/lib/netz-animation";
import type { Geschmack } from "@/lib/profil-typen";

const g = (teil: Partial<Geschmack> = {}): Geschmack =>
  ({ ...Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])), ...teil }) as Geschmack;

test("zwischenGeschmack: Anfang vorher, Ende nachher, Mitte dazwischen", () => {
  const v = g({ FRUCHTIG: 0.2 }), n = g({ FRUCHTIG: 1 });
  assert.equal(zwischenGeschmack(v, n, 0).FRUCHTIG, 0.2);
  assert.equal(zwischenGeschmack(v, n, 1).FRUCHTIG, 1);
  assert.ok(Math.abs(zwischenGeschmack(v, n, 0.5).FRUCHTIG - 0.6) < 1e-9);
});

test("ausklingen: 0 und 1 fest, monoton, schnell am Anfang", () => {
  assert.equal(ausklingen(0), 0);
  assert.equal(ausklingen(1), 1);
  assert.ok(ausklingen(0.5) > 0.5);
  assert.equal(ausklingen(2), 1);
});

test("startFortschritt: reduzierte Bewegung zeigt sofort den neuen Stand", () => {
  assert.equal(startFortschritt(true), 1);
  assert.equal(startFortschritt(false), 0);
});

const mini = (vorher: Geschmack | null, nachher: Geschmack) =>
  renderToStaticMarkup(createElement(MiniNetz, { vorher, nachher, texte: de.bewerten, achsen: de.label.geschmack }));

test("MiniNetz: Kontur vorher, Änderung als Text, Link ins Profil", () => {
  const html = mini(g({ FRUCHTIG: 0.4 }), g({ FRUCHTIG: 1, ERDIG: -0.5 }));
  assert.match(html, /So hat sich dein Netz verändert/);
  assert.match(html, /data-netz="vorher"/);
  assert.match(html, /Fruchtig stärker, Erdig schwächer\./);
  assert.match(html, /href="\/profil"/);
  assert.doesNotMatch(html, /apotheke/i);
});

test("MiniNetz: ohne Veränderung der Hinweis, ohne vorher keine Kontur", () => {
  assert.match(mini(g({ SUESS: 1 }), g({ SUESS: 1 })), /Dein Netz bleibt gleich/);
  assert.doesNotMatch(mini(null, g({ SUESS: 1 })), /data-netz="vorher"/);
});

test("bewertungSpeichern: Stand vorher VOR profilFortschreiben, nachher danach", () => {
  const q = readFileSync("app/[lang]/blueten/[slug]/aktionen.ts", "utf8");
  const vorher = q.indexOf("const vorher = await ladeProfil(");
  const fort = q.indexOf("await profilFortschreiben(");
  const nachher = q.indexOf("await ladeProfil(", fort);
  assert.ok(vorher > 0 && fort > vorher && nachher > fort);
  assert.match(q, /netz,?\s*\}/);
});

test("BewertungsFormular zeigt das Mini-Netz nach Erfolg und setzt es beim neuen Senden zurück", () => {
  const q = readFileSync("components/review/BewertungsFormular.tsx", "utf8");
  assert.match(q, /setNetz\(null\)/);
  assert.match(q, /setNetz\(ergebnis\.netz\)/);
  assert.match(q, /<MiniNetz/);
});
```

- [ ] **Step 2: Laufen lassen, scheitert** — `npx tsx --test tests/mini-netz.test.ts`, Expected: FAIL.

- [ ] **Step 3: `lib/netz-animation.ts`**

```ts
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import type { Geschmack } from "@/lib/profil-typen";

/** Mini-Netz nach dem Speichern (Spec Profil 2.12): kurze Bewegung von vorher nach jetzt. */
export const NETZ_DAUER_MS = 700;

/** Kubisch ausklingend, auf 0..1 begrenzt. */
export function ausklingen(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

export function zwischenGeschmack(vorher: Geschmack, nachher: Geschmack, t: number): Geschmack {
  return Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, vorher[k] + (nachher[k] - vorher[k]) * t])) as Geschmack;
}

/** Mit reduzierter Bewegung steht sofort der neue Stand. */
export function startFortschritt(reduziert: boolean): number {
  return reduziert ? 1 : 0;
}
```

- [ ] **Step 4: `components/review/MiniNetz.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { NetzGrafik, netzAusGeschmack } from "@/components/profil/NetzGrafik";
import { GESCHMACKS_KATEGORIEN } from "@/db/enums";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import { ausklingen, NETZ_DAUER_MS, startFortschritt, zwischenGeschmack } from "@/lib/netz-animation";
import type { Geschmack } from "@/lib/profil-typen";

type Props = {
  vorher: Geschmack | null;
  nachher: Geschmack;
  texte: Woerterbuch["bewerten"];
  achsen: Woerterbuch["label"]["geschmack"];
};

const null10 = () => Object.fromEntries(GESCHMACKS_KATEGORIEN.map((k) => [k, 0])) as Geschmack;

/**
 * Mini-Netz nach dem Speichern (Spec Profil 2.12): das eigene Netz wächst von
 * vorher nach jetzt, die Kontur zeigt den alten Stand. Reduzierte Bewegung:
 * sofort der neue Stand. Die Änderung steht als Text, das SVG ist stumm.
 * Nur Aroma, kein Kauf- oder Apothekenlink (HWG).
 */
export function MiniNetz({ vorher, nachher, texte, achsen }: Props) {
  const start = vorher ?? null10();
  const [fortschritt, setFortschritt] = useState(0);

  useEffect(() => {
    const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (startFortschritt(reduziert) === 1) {
      setFortschritt(1);
      return;
    }
    let rahmen = 0;
    const beginn = performance.now();
    const schritt = (jetzt: number) => {
      const t = Math.min(1, (jetzt - beginn) / NETZ_DAUER_MS);
      setFortschritt(ausklingen(t));
      if (t < 1) rahmen = requestAnimationFrame(schritt);
    };
    rahmen = requestAnimationFrame(schritt);
    return () => cancelAnimationFrame(rahmen);
  }, [vorher, nachher]);

  const { mag, magNicht } = netzAusGeschmack(zwischenGeschmack(start, nachher, fortschritt));
  const kontur = vorher ? netzAusGeschmack(vorher).mag : null;
  const aenderung = netzAenderung(start, nachher);
  const satz =
    aenderung.length > 0
      ? t(texte.miniNetzAenderung, { liste: aenderungsListe(aenderung, achsen, { staerker: texte.miniStaerker, schwaecher: texte.miniSchwaecher }) })
      : texte.miniNetzGleich;

  return (
    <section aria-labelledby="mini-netz-titel" className="flex flex-col items-center gap-4 text-text">
      <h3 id="mini-netz-titel" className="self-start text-h3 text-text">{texte.miniNetzTitel}</h3>
      <NetzGrafik mag={mag} magNicht={magNicht} kontur={kontur} className="w-full max-w-48" />
      {kontur ? (
        <ul className="flex gap-6 text-small text-text-muted">
          <li className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6">
              <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeOpacity={0.45} strokeWidth={1} />
            </svg>
            {texte.miniNetzVorher}
          </li>
          <li className="inline-flex items-center gap-2">
            <svg viewBox="0 0 24 8" aria-hidden="true" className="h-2 w-6">
              <rect width="24" height="8" fill="currentColor" fillOpacity={0.12} stroke="currentColor" strokeWidth={1.5} />
            </svg>
            {texte.miniNetzJetzt}
          </li>
        </ul>
      ) : null}
      <p className="max-w-[48ch] text-center text-body text-text-muted text-pretty">{satz}</p>
      <Link prefetch={false} href="/profil" className="text-small text-text underline underline-offset-4">
        {texte.miniNetzLink}
      </Link>
    </section>
  );
}
```

Vorher `ui-design-engine` laden; die Typografie-Klassen (`text-h4`, `max-w-48`, Linkstil) an das Regelwerk und an bestehende Links in `components/review` angleichen. `text-h4` gibt es nicht als Token; `text-h3` bleibt.

- [ ] **Step 5: Action** — in `aktionen.ts` (CRLF erhalten) den Typ erweitern:

```ts
import { ladeProfil, profilFortschreiben } from "@/lib/query/profil";
import type { Geschmack } from "@/lib/profil-typen";

export type BewertungErgebnis =
  | { ok: true; sofortSichtbar: boolean; slug: string; netz: { vorher: Geschmack | null; nachher: Geschmack } | null }
  | { ok: false; fehler: string };
```

Vor `await prisma.review.upsert(…)`:

```ts
  // Mini-Netz (Spec Profil 2.12): der echte Stand vor dem Speichern, auch wenn eine
  // ältere Bewertung bearbeitet wird. Ohne Stand wächst das Netz aus der Mitte.
  const vorher = await ladeProfil(mitglied.mitgliedId).catch(() => null);
```

Den bestehenden `try`-Block ersetzen:

```ts
  let netz: { vorher: Geschmack | null; nachher: Geschmack } | null = null;
  try {
    await profilFortschreiben(mitglied.mitgliedId);
    const nachher = await ladeProfil(mitglied.mitgliedId);
    if (nachher) netz = { vorher: vorher?.werte.geschmack ?? null, nachher: nachher.werte.geschmack };
  } catch (fehler) {
    console.error("profilFortschreiben fehlgeschlagen", fehler);
  }
```

Rückgabe: `return { ok: true, sofortSichtbar: istBetreiber, slug: strain.slug, netz };`.

- [ ] **Step 6: Formular und Seite** — `BewertungsFormular.tsx` (CRLF erhalten): Prop `achsen: Woerterbuch["label"]["geschmack"]` in `Props` und in der Destrukturierung; State `const [netz, setNetz] = useState<{ vorher: Geschmack | null; nachher: Geschmack } | null>(null);`. In `absenden` neben `setErfolg(null)` ein `setNetz(null)`; nach `setErfolg(…)` ein `setNetz(ergebnis.netz)`. Unter `{erfolg ? <Meldung …> : null}`:

```tsx
        {netz ? <MiniNetz vorher={netz.vorher} nachher={netz.nachher} texte={texte} achsen={achsen} /> : null}
```

In `app/[lang]/blueten/[slug]/page.tsx` dem `<BewertungsFormular …>` `achsen={w.label.geschmack}` mitgeben.

- [ ] **Step 7: Tests grün** — `npx tsx --test tests/mini-netz.test.ts`, `npm test`, `npx tsc --noEmit -p .`, `npx eslint "app/[lang]/blueten/[slug]/aktionen.ts" "app/[lang]/blueten/[slug]/page.tsx" components/review/BewertungsFormular.tsx components/review/MiniNetz.tsx lib/netz-animation.ts`. Zeilenenden prüfen: `git ls-files --eol` und `git diff --stat` (eine CRLF-Datei, die komplett geändert erscheint, ist kaputt).

- [ ] **Step 8: Commit**

```bash
git add "app/[lang]/blueten/[slug]/aktionen.ts" "app/[lang]/blueten/[slug]/page.tsx" components/review/BewertungsFormular.tsx components/review/MiniNetz.tsx lib/netz-animation.ts tests/mini-netz.test.ts
git commit -m "feat: Mini-Netz mit Bewegung nach dem Speichern einer Bewertung"
```

---

### Task 6: Controller — Merge, Seite verdrahten, Review, Live

**Files:**
- Modify: `app/[lang]/profil/page.tsx`, `tests/profil-seite.test.ts`, `tests/i18n-literale.test.ts`, `HANDOFF.md`

- [ ] **Step 1: Merge** — Stränge A, B, C, D nacheinander nach `main` mergen (`git merge --no-ff`), nach jedem `npm test` und `npx tsc --noEmit -p .`.

- [ ] **Step 2: Seitentest erweitern** — in `tests/profil-seite.test.ts` die Reihenfolge-Erwartung ersetzen:

```ts
test("/profil: Reihenfolge Netz, Vorschläge, Top/Flop, Lieblingshersteller, Community, Schnitte, Verlauf; kein Apothekenlink", () => {
  const q = seite();
  const reihe = ["<ProfilNetz", "<EmpfehlungsListe", "<TopFlop", "<Lieblingshersteller", "<CommunityVergleich", "<Schnitte", "<NetzVerlauf"].map((s) => q.indexOf(s));
  assert.ok(reihe.every((i) => i > 0));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  assert.doesNotMatch(q, /apotheke/i);
  assert.match(q, /<ProfilReiter\s+aktiv="profil"/);
});

test("/profil: Kontur aus dem vorletzten Verlaufsschritt, nie auf dem öffentlichen Profil", () => {
  const q = seite();
  assert.match(q, /verlauf\.at\(-2\)/);
  assert.match(q, /vorher=\{/);
  const oeffentlich = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.doesNotMatch(oeffentlich, /vorher=|NetzVerlauf|Lieblingshersteller/);
});
```

- [ ] **Step 3: Seite verdrahten** — in `app/[lang]/profil/page.tsx`: `ladeLieblingshersteller` in das bestehende `Promise.all` (mit `.catch(oderNull<…>("ladeLieblingshersteller"))`). Nach `const werte = …`:

```ts
  const verlauf = profil?.verlauf ?? [];
  const letzter = verlauf.at(-1);
  const vorletzter = verlauf.at(-2);
  const aenderung =
    letzter && vorletzter
      ? (() => {
          const liste = netzAenderung(vorletzter.geschmack, letzter.geschmack);
          const datum = formatiereDatum(letzter.datum, sprache);
          return liste.length > 0
            ? t(texte.aenderung, { datum, liste: aenderungsListe(liste, w.label.geschmack, texte) })
            : t(texte.aenderungGleich, { datum });
        })()
      : null;
```

`<ProfilNetz … vorher={vorletzter?.geschmack ?? null} aenderung={aenderung} />`. Neue Karten im Stil der bestehenden (`section` mit `aria-labelledby`, `Card`/`CardHeader`/`CardBody`): „Lieblingshersteller“ (`id="hersteller-titel"`) zwischen Top/Flop und Community, innerhalb des `a.schnitte`-Zweigs; „Dein Verlauf“ (`id="verlauf-titel"`) nach Schnitte, außerhalb des Fehlerzweigs, nur wenn `!netzFehlt`, mit `<NetzVerlauf schritte={verlauf} texte={texte} achsen={w.label.geschmack} sprache={sprache} />`. Fehlt der Lieblingshersteller wegen eines Ladefehlers (`null` aus `oderNull`), zeigt die Karte den Leerhinweis; das ist vertretbar, weil die Angabe nebensächlich ist.

- [ ] **Step 4: Literal-Wächter** — in `tests/i18n-literale.test.ts` unter einem Kommentar `// Profil Stufe 3` eintragen: `components/profil/NetzGrafik.tsx`, `components/profil/NetzVerlauf.tsx`, `components/profil/Lieblingshersteller.tsx`, `components/review/MiniNetz.tsx`.

- [ ] **Step 5: Prüfen** — `npm test`, `npx tsc --noEmit -p .`, `npx eslint` auf alle geänderten Dateien. Commit: `feat: Profil Stufe 3 auf der Seite verdrahtet`.

- [ ] **Step 6: Gesamtreview** — Skill `superpowers:requesting-code-review` über `main` seit dem Fundament-Commit, mit diesem Plan und der Spec. Befunde nach `superpowers:receiving-code-review` beheben (Fixwelle), erneut testen.

- [ ] **Step 7: Remote-D1, dann Push** — `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0020_profil_verlauf.sql`. Erst danach `git push origin main`. Build über die Cloudflare-API prüfen (`GET /accounts/{id}/builds/workers/1406f98f6bac4ea19a123496391118c7/builds`), fehlt er: manuell mit vollem Hash auslösen (siehe HANDOFF, Lehre Deploy).

- [ ] **Step 8: Live** — als Betreiber: eine Bewertung speichern (z. B. eine bestehende aktualisieren), Mini-Netz erscheint unter der Erfolgsmeldung und wächst; `/profil`: Kontur und Änderungszeile, Lieblingshersteller, Verlauf-Regler mit Datum; mobil unter 640 px ohne Überlauf; `/profil/<kurz-id>` ohne Kontur, Verlauf und Hersteller. Danach das öffentliche Profil wieder privat schalten, falls eingeschaltet.

- [ ] **Step 9: HANDOFF** — Stand, Prüfergebnis und Offenes eintragen, committen, pushen.
