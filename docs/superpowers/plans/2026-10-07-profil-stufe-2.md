# Profil Stufe 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jedes Mitglied kann sein Profil öffentlich schalten (Opt-in, Vorgabe aus). Dann zeigt `/profil/<kurz-id>` Name, Avatar, Zahl und Liste der freigegebenen Bewertungen und das Aroma-Netz, und der Name im Buch verlinkt dorthin.

**Architecture:** Zwei neue Spalten an `mitglied` (`profil_oeffentlich`, `kurz_id`). Die Kurz-Id entsteht beim ersten Einschalten und bleibt beim Ausschalten erhalten, damit die Adresse beim Wiedereinschalten gleich bleibt. Die öffentliche Seite liest nur den gespeicherten Stand aus `nutzer_profil` (kein Neurechnen bei fremden Aufrufen) und die freigegebenen Bewertungen. Aus heißt 404. Das Buch bekommt je Eintrag `autorProfil` (Kurz-Id nur bei öffentlichem Profil, sonst null).

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), Prisma 7 mit D1, Tailwind 4, `node:test` über `tsx --test`, `better-sqlite3` für SQL-Tests, `react-dom/server` für Render-Tests.

**Spec:** `docs/superpowers/specs/2026-10-07-profil-dashboard-design.md` (Abschnitt 9, dazu die Entscheidungen in `HANDOFF.md`, Session 44)

## Global Constraints

- Next.js 16 App Router. Vor Next-API-Nutzung `node_modules/next/dist/docs/` lesen (AGENTS.md). `params` ist ein Promise.
- Kein `next dev`, `next build`, `next preview` lokal. Prüfen nur per `npm test`, `npx tsc --noEmit -p .`, `npx eslint <geänderte Dateien>`. Live-Prüfung macht der Controller nach dem Push.
- Design-Regelwerk: Skill `ui-design-engine` vor UI-Arbeit laden (8-px-Raster, Tokens aus `app/globals.css`). Datengrafik in Tinte, nie in Blattgrün.
- Zeilenenden je Datei erhalten: `git ls-files --eol <datei>`. CRLF sind hier u. a. `prisma/schema.prisma`, `tests/navigation.test.ts`, `app/[lang]/datenschutz/page.tsx`. Nie eine CRLF-Datei als LF zurückschreiben. Neue Dateien in LF.
- Texte nur in `lib/i18n/de.ts` und `lib/i18n/en.ts` (`tests/i18n-literale.test.ts`). Alle neuen Schlüssel legt Task 1 an; spätere Tasks fügen keine hinzu. Ausnahme: die Datenschutzseite ist deutscher Fließtext im JSX (wie bisher).
- Öffentlich nie: Vorschläge, Auswertungen (Top/Flop, Community, Schnitte), E-Mail, Instagram-Name, unfreigegebene Bewertungen. HWG: Netz nur Aroma, kein Kauf- oder Apothekenlink.
- Öffentliches Profil ist anfangs AUS (Art. 9 DSGVO). Aus = `notFound()`, auch für den Inhaber selbst.
- Kurz-Id: 8 Zeichen aus `23456789abcdefghjkmnpqrstuvwxyz`, eindeutig (Unique-Index), nie aus dem Namen abgeleitet.
- Öffentliche Seite: `robots: { index: false, follow: false }`, `dynamic = "force-dynamic"`.
- Workers-CPU 10 ms: kein Neurechnen des Profils auf `/profil/<kurz-id>`. Jede Prisma-Liste mit `take`.
- Kommentare und Commits auf Deutsch in Prosa. Commit-Ende: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Implementer: kein Push, kein Merge, nur Commits im eigenen Worktree-Branch.
- Migration: Remote-D1 spielt der Controller selbst ein, exakt `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0018_profil_oeffentlich.sql`, **vor** dem ersten Push von Code, der die Spalten liest.
- Nach Änderungen an `prisma/schema.prisma`: `npm run db:generate`. Keine zusätzlichen npm-Installationen.

## Review Focus

1. Kurz-Id in falscher Form (`/profil/ABC`, `/profil/x'--`, 40 Zeichen): 404 ohne Datenbankabfrage. Abgesichert durch `istKurzId` (Task 1) und die Seite (Task 5).
2. Profil aus, Kurz-Id bekannt (früher geteilt): 404, auch für den Inhaber. Abgesichert durch `ladeOeffentlichesProfil` (Task 5, Where-Klausel mit `profilOeffentlich: true`).
3. Öffentliches Profil mit unfreigegebenen Bewertungen: Liste und Zahl zeigen nur freigegebene. Abgesichert durch `oeffentlicheBewertungen` (Task 5).
4. Aus- und wieder Einschalten: dieselbe Adresse. Abgesichert durch `sichtbarkeitsDaten` (Task 2).
5. Eintrag ohne Autor (Seed, gelöschtes Mitglied) oder mit privatem Profil: Name bleibt reiner Text, kein Link. Abgesichert durch `autorProfilAus` (Task 3) und die Render-Tests (Task 3).

## Stränge und Reihenfolge

```
Task 1 (Fundament: Migration, Prisma, Kurz-Id, alle Texte)   ← zuerst, allein, auf main
   ├── Strang A: Task 2 (Session, Action, Schalter in /mitglied)
   ├── Strang B: Task 3 (Buch: Name verlinkt)
   ├── Strang C: Task 4 (Navigation istAktiv, Datenschutz)
   └── Strang D: Task 5 (Query und Seite /profil/<kurz-id>)
Task 6 (Controller: Merge, Gesamtreview, Remote-D1, Push, Live)  ← zuletzt
```

Die Stränge teilen keine Datei. Strang A besitzt `lib/session.ts`, `app/[lang]/mitglied/*`, `components/mitglied/ProfilSichtbarkeit.tsx`. Strang B besitzt `lib/query/strains.ts`, `lib/query/reviews.ts`, `components/review/*`. Strang C besitzt `lib/navigation.ts`, `tests/navigation.test.ts`, `app/[lang]/datenschutz/page.tsx`. Strang D besitzt `lib/profil-oeffentlich.ts`, `lib/query/profil-oeffentlich.ts`, `app/[lang]/profil/[kurzId]/page.tsx`, `components/profil/OeffentlicheBewertungen.tsx`.

---

### Task 1: Fundament (Controller, auf main)

**Files:**
- Create: `migrations/0018_profil_oeffentlich.sql`, `tests/profil-oeffentlich-migration.test.ts`
- Modify: `prisma/schema.prisma` (CRLF, `model Mitglied`)
- Create: `lib/kurz-id.ts`, `tests/kurz-id.test.ts`
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts`

**Interfaces:**
- Produces: Spalten `mitglied.profil_oeffentlich` (BOOLEAN, Vorgabe false) und `mitglied.kurz_id` (TEXT, unique, NULL erlaubt); Prisma `Mitglied.profilOeffentlich: boolean`, `Mitglied.kurzId: string | null`.
- Produces aus `lib/kurz-id.ts`: `KURZ_ID_ZEICHEN: string`, `KURZ_ID_LAENGE = 8`, `neueKurzId(zufall?: (n: number) => Uint8Array): string`, `istKurzId(wert: string): boolean`, `profilHref(kurzId: string): string` (liefert `/profil/<kurzId>`).
- Produces Texte: `w.profilOeffentlich` (Seite), `w.mitglied.sichtbarkeit` (Schalter), siehe Step 5.

- [ ] **Step 1: Migrationstest schreiben**

```ts
// tests/profil-oeffentlich-migration.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/** Migration 0018 (Spec Profil 9): Opt-in fürs öffentliche Profil, Kurz-Id eindeutig. */
function datenbank() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE "mitglied" ("id" TEXT NOT NULL PRIMARY KEY); INSERT INTO "mitglied" VALUES ('m1'), ('m2');`);
  db.exec(readFileSync(join(process.cwd(), "migrations", "0018_profil_oeffentlich.sql"), "utf8"));
  return db;
}

test("0018: bestehende Mitglieder sind privat und ohne Kurz-Id", () => {
  const db = datenbank();
  assert.deepEqual(db.prepare(`SELECT "profil_oeffentlich" AS o, "kurz_id" AS k FROM "mitglied" WHERE "id" = 'm1'`).get(), { o: 0, k: null });
});

test("0018: Kurz-Id ist eindeutig, mehrere NULL sind erlaubt", () => {
  const db = datenbank();
  db.prepare(`UPDATE "mitglied" SET "kurz_id" = 'abcd2345' WHERE "id" = 'm1'`).run();
  assert.throws(() => db.prepare(`UPDATE "mitglied" SET "kurz_id" = 'abcd2345' WHERE "id" = 'm2'`).run(), /UNIQUE/);
});
```

- [ ] **Step 2: Test laufen lassen, scheitert** — `npx tsx --test tests/profil-oeffentlich-migration.test.ts`, Expected: FAIL (ENOENT).

- [ ] **Step 3: Migration und Schema**

```sql
-- 0018_profil_oeffentlich
--
-- Profil Stufe 2 (Spec 2026-10-07, Abschnitt 9): öffentliches Profil als Opt-in,
-- Vorgabe aus (Art. 9 DSGVO). Die Kurz-Id entsteht beim ersten Einschalten und
-- bleibt beim Ausschalten erhalten. Rein additiv: alter Code läuft weiter.

-- AlterTable
ALTER TABLE "mitglied" ADD COLUMN "profil_oeffentlich" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mitglied" ADD COLUMN "kurz_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "mitglied_kurz_id_key" ON "mitglied"("kurz_id");
```

In `model Mitglied` nach `rolle` (CRLF erhalten):

```prisma
  /// Öffentliches Profil unter /profil/<kurzId> (Spec Profil 9). Opt-in, Vorgabe aus.
  profilOeffentlich Boolean @default(false) @map("profil_oeffentlich")
  /// 8 Zeichen, beim ersten Einschalten vergeben, bleibt beim Ausschalten.
  kurzId            String? @unique @map("kurz_id")
```

Dann `npm run db:generate`.

- [ ] **Step 4: Kurz-Id mit Test**

```ts
// tests/kurz-id.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { istKurzId, KURZ_ID_LAENGE, KURZ_ID_ZEICHEN, neueKurzId, profilHref } from "@/lib/kurz-id";

test("neueKurzId: 8 Zeichen aus dem Alphabet", () => {
  for (let i = 0; i < 200; i++) {
    const id = neueKurzId();
    assert.equal(id.length, KURZ_ID_LAENGE);
    assert.ok(istKurzId(id), id);
  }
});

test("neueKurzId: verwirft Bytes jenseits des Vielfachen (keine Schieflage)", () => {
  // 248 = 8 * 31 ist das erste verworfene Byte; danach kommt 0, also das erste Zeichen.
  const folge = [248, 255, ...Array(8).fill(0)];
  const id = neueKurzId((n) => Uint8Array.from(folge.splice(0, n)));
  assert.equal(id, KURZ_ID_ZEICHEN[0].repeat(8));
});

test("istKurzId: nur genau 8 Zeichen aus dem Alphabet", () => {
  assert.equal(istKurzId("abcd2345"), true);
  for (const falsch of ["", "abcd234", "abcd23456", "ABCD2345", "abcd2301", "abcd-345", "x'--aaaa"]) {
    assert.equal(istKurzId(falsch), false, falsch);
  }
});

test("profilHref", () => {
  assert.equal(profilHref("abcd2345"), "/profil/abcd2345");
});
```

```ts
// lib/kurz-id.ts
/**
 * Kurz-Id des öffentlichen Profils (Spec Profil 9): 8 Zeichen, keine Namen in
 * der URL. Ohne 0, 1, i, l, o, damit sie sich abschreiben lässt. Zufall aus
 * crypto, verworfene Bytes vermeiden eine Schieflage zugunsten früher Zeichen.
 */
export const KURZ_ID_ZEICHEN = "23456789abcdefghjkmnpqrstuvwxyz";
export const KURZ_ID_LAENGE = 8;

const GRENZE = 256 - (256 % KURZ_ID_ZEICHEN.length);
const MUSTER = new RegExp(`^[${KURZ_ID_ZEICHEN}]{${KURZ_ID_LAENGE}}$`);

function zufallsBytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

export function neueKurzId(zufall: (n: number) => Uint8Array = zufallsBytes): string {
  let id = "";
  while (id.length < KURZ_ID_LAENGE) {
    for (const b of zufall(KURZ_ID_LAENGE - id.length)) {
      if (b < GRENZE) id += KURZ_ID_ZEICHEN[b % KURZ_ID_ZEICHEN.length];
    }
  }
  return id;
}

export function istKurzId(wert: string): boolean {
  return MUSTER.test(wert);
}

export function profilHref(kurzId: string): string {
  return `/profil/${kurzId}`;
}
```

- [ ] **Step 5: Texte (de und en, gleiche Schlüssel)**

In `lib/i18n/de.ts` unter `mitglied`, nach `avatar`:

```ts
    sichtbarkeit: {
      titel: "Öffentliches Profil",
      satz: "Andere sehen dann deinen Namen, dein Profilbild, deine freigegebenen Bewertungen und dein Aroma-Netz. Vorschläge und Auswertungen bleiben privat.",
      istAn: "Dein Profil ist öffentlich.",
      istAus: "Dein Profil ist privat.",
      einschalten: "Profil öffentlich machen",
      ausschalten: "Wieder privat machen",
      laeuft: "Wird gespeichert …",
      ansehen: "Öffentliches Profil ansehen",
      adresse: "Adresse: {adresse}",
      fehler: "Das hat nicht geklappt. Versuch es noch einmal.",
    },
```

In `lib/i18n/de.ts` nach dem Block `profil`:

```ts
  profilOeffentlich: {
    titel: "Profil von {name}",
    netzTitel: "Aromen",
    netzSatz: "Aus den Bewertungen: Fläche für das, was {name} mag, gestrichelt für das, was eher nicht.",
    netzLeer: "Noch kein Aroma-Netz.",
    magIch: "mag",
    magIchNicht: "mag nicht",
    netzSkala: "Geschmack, gemessen an der stärksten Vorliebe",
    vorlaeufig: "Vorläufig: {anzahl} von 3 deutlichen Bewertungen.",
    nurMittelfeld: "Noch keine deutliche Vorliebe.",
    srMag: "{achse}: mag, {wert} von 5",
    srMagNicht: "{achse}: mag nicht, {wert} von 5",
    bewertungenTitel: "Bewertungen",
    bewertungenLeer: "Noch keine freigegebene Bewertung.",
    neueste: "Die neuesten {anzahl}.",
    ohneNote: "ohne Gesamtnote",
  },
```

In `lib/i18n/en.ts` dieselben Schlüssel:

```ts
    sichtbarkeit: {
      titel: "Public profile",
      satz: "Others then see your name, your profile picture, your published reviews and your aroma web. Suggestions and statistics stay private.",
      istAn: "Your profile is public.",
      istAus: "Your profile is private.",
      einschalten: "Make profile public",
      ausschalten: "Make private again",
      laeuft: "Saving …",
      ansehen: "View public profile",
      adresse: "Address: {adresse}",
      fehler: "That did not work. Please try again.",
    },
```

```ts
  profilOeffentlich: {
    titel: "Profile of {name}",
    netzTitel: "Aromas",
    netzSatz: "From the reviews: filled for what {name} likes, dashed for what rather not.",
    netzLeer: "No aroma web yet.",
    magIch: "likes",
    magIchNicht: "dislikes",
    netzSkala: "Taste, relative to the strongest preference",
    vorlaeufig: "Preliminary: {anzahl} of 3 clear reviews.",
    nurMittelfeld: "No clear preference yet.",
    srMag: "{achse}: likes, {wert} of 5",
    srMagNicht: "{achse}: dislikes, {wert} of 5",
    bewertungenTitel: "Reviews",
    bewertungenLeer: "No published review yet.",
    neueste: "The latest {anzahl}.",
    ohneNote: "no overall rating",
  },
```

- [ ] **Step 6: Prüfen** — `npm test`, `npx tsc --noEmit -p .`, `npx eslint lib/kurz-id.ts tests/kurz-id.test.ts tests/profil-oeffentlich-migration.test.ts`. Expected: alles grün.

- [ ] **Step 7: Commit** — `feat: Fundament öffentliches Profil (Migration 0018, Kurz-Id, Texte)`

---

### Task 2 (Strang A): Session, Action und Schalter in /mitglied

**Files:**
- Modify: `lib/session.ts` (Typ `AngemeldetesMitglied` und Rückgabe)
- Create: `lib/profil-sichtbarkeit.ts`, `tests/profil-sichtbarkeit.test.ts`
- Modify: `app/[lang]/mitglied/aktionen.ts` (neue Action)
- Create: `components/mitglied/ProfilSichtbarkeit.tsx`
- Modify: `app/[lang]/mitglied/page.tsx` (neue Karte nach „Profilbild“)

**Interfaces:**
- Consumes: `neueKurzId`, `profilHref` aus `lib/kurz-id.ts`; `istEindeutigkeitsfehler` aus `lib/prisma-fehler.ts`; Texte `w.mitglied.sichtbarkeit`.
- Produces: `AngemeldetesMitglied.profilOeffentlich: boolean`, `AngemeldetesMitglied.kurzId: string | null`; `sichtbarkeitsDaten(an: boolean, kurzId: string | null, neu: () => string): { profilOeffentlich: boolean; kurzId?: string }`; Action `profilSichtbarkeitSetzen(an: boolean): Promise<ProfilErgebnis>`.

- [ ] **Step 1: Test der reinen Regel**

```ts
// tests/profil-sichtbarkeit.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { sichtbarkeitsDaten } from "@/lib/profil-sichtbarkeit";

const neu = () => "neu23456";

test("Einschalten ohne Kurz-Id vergibt eine", () => {
  assert.deepEqual(sichtbarkeitsDaten(true, null, neu), { profilOeffentlich: true, kurzId: "neu23456" });
});

test("Wieder einschalten behält die alte Adresse", () => {
  assert.deepEqual(sichtbarkeitsDaten(true, "alt23456", neu), { profilOeffentlich: true });
});

test("Ausschalten behält die Kurz-Id, schreibt sie aber nicht", () => {
  assert.deepEqual(sichtbarkeitsDaten(false, "alt23456", neu), { profilOeffentlich: false });
  assert.deepEqual(sichtbarkeitsDaten(false, null, neu), { profilOeffentlich: false });
});

test("ProfilSichtbarkeit: aus zeigt Einschalten, an zeigt Adresse und Link", async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { ProfilSichtbarkeit } = await import("@/components/mitglied/ProfilSichtbarkeit");
  const { de } = await import("@/lib/i18n/de");
  const aus = renderToStaticMarkup(createElement(ProfilSichtbarkeit, { an: false, kurzId: "alt23456", texte: de.mitglied.sichtbarkeit }));
  assert.match(aus, /Dein Profil ist privat\./);
  assert.match(aus, /Profil öffentlich machen/);
  assert.doesNotMatch(aus, /\/profil\/alt23456/);
  const an = renderToStaticMarkup(createElement(ProfilSichtbarkeit, { an: true, kurzId: "alt23456", texte: de.mitglied.sichtbarkeit }));
  assert.match(an, /Dein Profil ist öffentlich\./);
  assert.match(an, /href="\/profil\/alt23456"/);
  assert.match(an, /Wieder privat machen/);
});
```

- [ ] **Step 2: Laufen lassen, scheitert** — `npx tsx --test tests/profil-sichtbarkeit.test.ts`.

- [ ] **Step 3: Regel**

```ts
// lib/profil-sichtbarkeit.ts
/**
 * Was der Schalter „Öffentliches Profil“ schreibt (Spec Profil 9). Die Kurz-Id
 * entsteht nur beim ersten Einschalten und bleibt beim Ausschalten stehen: so
 * führt eine einmal geteilte Adresse nach dem Wiedereinschalten wieder zum Profil.
 */
export function sichtbarkeitsDaten(
  an: boolean,
  kurzId: string | null,
  neu: () => string,
): { profilOeffentlich: boolean; kurzId?: string } {
  if (an && !kurzId) return { profilOeffentlich: true, kurzId: neu() };
  return { profilOeffentlich: an };
}
```

- [ ] **Step 4: Session** — in `lib/session.ts` den Typ um zwei Felder ergänzen (mit `///`-Kommentar wie die Nachbarn) und in der Rückgabe `profilOeffentlich: satz.profilOeffentlich, kurzId: satz.kurzId` setzen. `findUnique` mit `include` liefert alle Skalare, keine Abfrage mehr.

- [ ] **Step 5: Action** in `app/[lang]/mitglied/aktionen.ts` am Ende:

```ts
/**
 * Öffentliches Profil ein- oder ausschalten (Spec Profil 9, Opt-in). Das
 * Mitglied kommt aus der Sitzung. Trifft die neue Kurz-Id eine vergebene
 * (Unique-Index), wird höchstens dreimal neu gezogen; prüfen vor dem Schreiben
 * wäre eine Race Condition (lib/prisma-fehler.ts). Name im Buch und
 * Startseite ändern sich mit, deshalb auch / und /reviews.
 */
export async function profilSichtbarkeitSetzen(an: boolean): Promise<ProfilErgebnis> {
  const mitglied = await mitgliedErforderlich();
  const prisma = await getPrisma();
  for (let versuch = 0; versuch < 3; versuch++) {
    try {
      await prisma.mitglied.update({
        where: { id: mitglied.mitgliedId },
        data: sichtbarkeitsDaten(an === true, mitglied.kurzId, neueKurzId),
      });
      for (const pfad of ["/mitglied", "/", "/reviews"]) revalidiereSprachen(pfad);
      return { ok: true };
    } catch (fehler) {
      if (!istEindeutigkeitsfehler(fehler)) throw fehler;
    }
  }
  return { ok: false, fehler: (await holeWoerterbuchAusAnfrage()).mitglied.sichtbarkeit.fehler };
}
```

Imports ergänzen: `sichtbarkeitsDaten` aus `@/lib/profil-sichtbarkeit`, `neueKurzId` aus `@/lib/kurz-id`, `istEindeutigkeitsfehler` aus `@/lib/prisma-fehler`. `an === true` verhindert, dass ein beliebiger Wert aus dem Client als „an“ gilt.

- [ ] **Step 6: Komponente** (`"use client"`, Muster wie `components/auth/ProfilFormular.tsx`)

```tsx
// components/mitglied/ProfilSichtbarkeit.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { profilSichtbarkeitSetzen } from "@/app/[lang]/mitglied/aktionen";
import { Badge, Button, textLinkKlassen, useHydriert } from "@/components/ui";
import { profilHref } from "@/lib/kurz-id";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = { an: boolean; kurzId: string | null; texte: Woerterbuch["mitglied"]["sichtbarkeit"] };

/**
 * Schalter „Öffentliches Profil“ (Spec Profil 9). Zustand als Klartext und
 * Badge, nie nur Farbe. Ein Knopf statt Checkbox: die Wirkung ist eine
 * Veröffentlichung, die soll bewusst ausgelöst werden.
 */
export function ProfilSichtbarkeit({ an, kurzId, texte }: Props) {
  const router = useRouter();
  const hydriert = useHydriert();
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function umschalten() {
    setLaeuft(true);
    setFehler(null);
    const ergebnis = await profilSichtbarkeitSetzen(!an).catch(() => ({ ok: false as const, fehler: texte.fehler }));
    setLaeuft(false);
    if (!ergebnis.ok) {
      setFehler(ergebnis.fehler);
      return;
    }
    router.refresh();
  }

  const href = an && kurzId ? profilHref(kurzId) : null;
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="max-w-[68ch] text-body text-text-muted text-pretty">{texte.satz}</p>
      <p className="flex flex-wrap items-center gap-2 text-body text-text">
        <Badge variante={an ? "success" : "neutral"}>{an ? texte.istAn : texte.istAus}</Badge>
      </p>
      {href ? (
        <p className="flex flex-col gap-1 text-small text-text-muted">
          <span className="wrap-break-word">{t(texte.adresse, { adresse: href })}</span>
          <Link prefetch={false} href={href} className={textLinkKlassen()}>
            {texte.ansehen}
          </Link>
        </p>
      ) : null}
      {fehler ? (
        <p role="alert" className="text-small text-danger">
          {fehler}
        </p>
      ) : null}
      <Button type="button" variante="secondary" onClick={umschalten} disabled={!hydriert || laeuft}>
        {laeuft ? texte.laeuft : an ? texte.ausschalten : texte.einschalten}
      </Button>
    </div>
  );
}
```

Prüfe vorher die Props von `Button` und `Badge` in `components/ui/Button.tsx` und `components/ui/Badge.tsx` (Name der Variante-Prop) und passe an; der Test aus Step 1 legt nur Text und `href` fest.

- [ ] **Step 7: Karte in `/mitglied`** nach der Karte „Profilbild“ (`avatar-titel`), gleicher Aufbau:

```tsx
      <section aria-labelledby="sichtbarkeit-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="sichtbarkeit-titel" className="text-h3 text-text">
              {texte.sichtbarkeit.titel}
            </h2>
          </CardHeader>
          <CardBody>
            <ProfilSichtbarkeit an={mitglied.profilOeffentlich} kurzId={mitglied.kurzId} texte={texte.sichtbarkeit} />
          </CardBody>
        </Card>
      </section>
```

- [ ] **Step 8: Prüfen** — `npm test`, `npx tsc --noEmit -p .`, `npx eslint` auf alle geänderten Dateien. Achtung: Tests, die `AngemeldetesMitglied` als Objekt bauen, brauchen die zwei neuen Felder (`grep -rn "instagramHandle" tests`).

- [ ] **Step 9: Commit** — `feat: Schalter für das öffentliche Profil im Konto`

---

### Task 3 (Strang B): Name im Buch verlinkt

**Files:**
- Modify: `lib/query/strains.ts` (`ReviewEintrag`, Select bei Zeile ~625, Abbildung bei ~708)
- Modify: `lib/query/reviews.ts` (`RedaktionelleReview`, `AUSWAHL`, `Satz`, `zuAnsicht`)
- Modify: `components/review/eintrag.ts` (`EintragDaten`, `alsEintrag`)
- Modify: `components/review/BuchDoppelseite.tsx` (Name im `<span title>` der Überschrift)
- Modify: `components/review/Doppelseite.tsx` (Name in der Personzeile)
- Create: `lib/autor-profil.ts`
- Test: `tests/autor-profil.test.ts`; Erweiterung `tests/buch-doppelseite.test.ts`, `tests/doppelseite.test.ts`

**Interfaces:**
- Consumes: `profilHref` aus `lib/kurz-id.ts`; `namenLinkKlassen` aus `components/ui`.
- Produces: `autorProfilAus(autor: { profilOeffentlich: boolean; kurzId: string | null } | null): string | null`; Feld `autorProfil?: string | null` (Kurz-Id) an `ReviewEintrag`, `RedaktionelleReview`, `EintragDaten`.

- [ ] **Step 1: Tests**

```ts
// tests/autor-profil.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { autorProfilAus } from "@/lib/autor-profil";

test("autorProfilAus: nur bei öffentlichem Profil mit Kurz-Id", () => {
  assert.equal(autorProfilAus({ profilOeffentlich: true, kurzId: "abcd2345" }), "abcd2345");
  assert.equal(autorProfilAus({ profilOeffentlich: false, kurzId: "abcd2345" }), null);
  assert.equal(autorProfilAus({ profilOeffentlich: true, kurzId: null }), null);
  assert.equal(autorProfilAus(null), null);
});
```

In `tests/buch-doppelseite.test.ts` und `tests/doppelseite.test.ts` je einen Test im Stil der Datei (Helfer `zeige`/`eintrag` dort ansehen):

```ts
test("Name verlinkt nur bei öffentlichem Profil", () => {
  const offen = zeige({ istBetreiber: false, autorName: "Mia", autorProfil: "abcd2345" });
  assert.match(offen, /<a [^>]*href="\/profil\/abcd2345"[^>]*>Mia<\/a>/);
  const privat = zeige({ istBetreiber: false, autorName: "Mia", autorProfil: null });
  assert.doesNotMatch(privat, /\/profil\//);
  const ohneAutor = zeige({ istBetreiber: false, autorName: null, autorProfil: "abcd2345" });
  assert.doesNotMatch(ohneAutor, /\/profil\//);
});
```

- [ ] **Step 2: Laufen lassen, scheitern.**

- [ ] **Step 3: Regel**

```ts
// lib/autor-profil.ts
/**
 * Kurz-Id fürs Buch (Spec Profil 9): der Name verlinkt nur, wenn das Profil
 * öffentlich ist. Die Kurz-Id eines privaten Profils verlässt den Server nie.
 */
export function autorProfilAus(autor: { profilOeffentlich: boolean; kurzId: string | null } | null): string | null {
  return autor?.profilOeffentlich && autor.kurzId ? autor.kurzId : null;
}
```

- [ ] **Step 4: Queries** — in beiden Selects `autor: { select: { anzeigename: true, profilOeffentlich: true, kurzId: true, avatar: { select: { id: true } } } }`; Typ `Satz.autor` in `reviews.ts` entsprechend. Abbildung: `autorProfil: autorProfilAus(review.autor ?? null)` bzw. `autorProfilAus(satz.autor)`. Typen `ReviewEintrag`, `RedaktionelleReview`, `EintragDaten` bekommen `/** Kurz-Id des öffentlichen Profils; null bei privatem Profil oder ohne Autor. */ autorProfil?: string | null;`. `alsEintrag` reicht `autorProfil: review.autorProfil ?? null` durch.

- [ ] **Step 5: Komponenten** — Link nur, wenn `eintrag.autorName && eintrag.autorProfil`:

`BuchDoppelseite.tsx`, in der Überschrift:

```tsx
              {eintrag.autorName && eintrag.autorProfil ? (
                <Link prefetch={false} href={profilHref(eintrag.autorProfil)} title={name} className={namenLinkKlassen()}>
                  {name}
                </Link>
              ) : (
                <span title={name}>{name}</span>
              )}
```

`Doppelseite.tsx`, Personzeile: dieselbe Weiche um `{name}` im `span.text-body`, der Link trägt `namenLinkKlassen()`. `aria-label` der Überschrift bleibt unverändert.

- [ ] **Step 6: Prüfen** — `npm test`, `npx tsc --noEmit -p .`, `npx eslint` auf alle geänderten Dateien. Testhelfer (`tests/hilfen/eintrag.ts`) brauchen das Feld nicht, es ist optional.

- [ ] **Step 7: Commit** — `feat: Name im Buch verlinkt aufs öffentliche Profil`

---

### Task 4 (Strang C): Navigation und Datenschutz

**Files:**
- Modify: `lib/navigation.ts`, `tests/navigation.test.ts` (CRLF)
- Modify: `app/[lang]/datenschutz/page.tsx` (CRLF), `lib/rechtliches.ts` (nur `DATENSCHUTZ_STAND`)

**Interfaces:**
- Produces: `istAktiv("/profil/abcd2345", "/profil") === false`, `istAktiv("/profil", "/profil") === true`, `/mitglied` bleibt aktiv.

- [ ] **Step 1: Test** in `tests/navigation.test.ts` (CRLF!):

```ts
test("istAktiv: fremdes öffentliches Profil markiert Mein Profil nicht", () => {
  assert.equal(istAktiv("/profil/abcd2345", "/profil"), false);
  assert.equal(istAktiv("/profil", "/profil"), true);
  assert.equal(istAktiv("/mitglied", "/profil"), true);
  assert.equal(istAktiv("/blueten/x", "/blueten"), true);
});
```

- [ ] **Step 2: Laufen lassen, scheitert** (`/profil/abcd2345` liefert heute true).

- [ ] **Step 3: Umsetzung** in `lib/navigation.ts`:

```ts
/** Nur die Seite selbst zählt: unter /profil/<kurz-id> stehen fremde öffentliche Profile. */
const OHNE_UNTERSEITEN: ReadonlySet<string> = new Set(["/profil"]);

/** Aktiv sind die Seite selbst und ihre Unterseiten, nicht ein blosser Namensanfang. */
export function istAktiv(pfad: string, href: string): boolean {
  return [href, ...(AUCH_AKTIV[href] ?? [])].some(
    (h) => pfad === h || (!OHNE_UNTERSEITEN.has(h) && pfad.startsWith(`${h}/`)),
  );
}
```

- [ ] **Step 4: Datenschutz** — im Abschnitt `ds-beitraege` nach dem Absatz über Bewertungen einen Absatz ergänzen und den Code-Kommentar oben um eine Zeile zu `app/[lang]/profil/[kurzId]/page.tsx`, `app/[lang]/mitglied/aktionen.ts` (`profilSichtbarkeitSetzen`) und `nutzer_profil` erweitern:

```tsx
            <p className="text-pretty">
              Aus deinen Bewertungen berechnen wir dein Profil: ein Aroma-Netz, deine Terpene,
              Vorschläge mit ähnlichem Aroma und Auswertungen wie deine Schnitte. Das sehen nur du
              und, technisch bedingt, wir. Schaltest du unter „Mein Profil“ im Reiter „Konto“ dein
              öffentliches Profil ein, sehen alle unter einer zufälligen Adresse deinen
              Anzeigenamen, dein Profilbild, die Zahl und Liste deiner freigegebenen Bewertungen
              und dein Aroma-Netz; dein Name bei Bewertungen verweist dann dorthin. Vorschläge und
              Auswertungen bleiben privat. Das öffentliche Profil ist anfangs aus, du kannst es
              jederzeit wieder ausschalten; die Adresse führt dann ins Leere. Rechtsgrundlage ist
              deine Einwilligung durch das Einschalten (Art. 6 Abs. 1 lit. a DSGVO).
            </p>
```

`DATENSCHUTZ_STAND` in `lib/rechtliches.ts` auf `"7. Oktober 2026"` setzen (Format der bestehenden Angabe übernehmen). Prüfe, ob ein Test den Stand oder Text der Datenschutzseite festschreibt (`grep -rln "DATENSCHUTZ_STAND\|ds-beitraege" tests`) und ziehe ihn mit.

- [ ] **Step 5: Prüfen** — `npm test`, `npx tsc --noEmit -p .`, `npx eslint lib/navigation.ts "app/[lang]/datenschutz/page.tsx"`. `git ls-files --eol` und `git diff --stat`: CRLF-Dateien dürfen nicht komplett als geändert erscheinen.

- [ ] **Step 6: Commit** — `feat: Navigation und Datenschutz fürs öffentliche Profil`

---

### Task 5 (Strang D): Query und Seite /profil/<kurz-id>

**Files:**
- Create: `lib/profil-oeffentlich.ts` (rein: Typen, Konstante, `netzTexte`)
- Create: `lib/query/profil-oeffentlich.ts` (Datenbank)
- Create: `components/profil/OeffentlicheBewertungen.tsx`
- Create: `app/[lang]/profil/[kurzId]/page.tsx`
- Test: `tests/profil-oeffentlich.test.ts`

**Interfaces:**
- Consumes: `istKurzId` aus `lib/kurz-id.ts`; `profilAusDaten` aus `lib/profil.ts`; `ProfilWerte` aus `lib/profil-typen.ts`; `ProfilNetz`, `TerpenRangliste` (unverändert); `eintragHref` aus `components/review/eintrag.ts`; `BlattAnzeige` (Import wie in `components/review/Doppelseite.tsx`); Texte `w.profilOeffentlich`, `w.profil.anzahl`.
- Produces (aus `lib/profil-oeffentlich.ts`): `OEFFENTLICHE_BEWERTUNGEN = 50`; `type OeffentlicheBewertung = { id: string; slug: string; handelsname: string; gesamtnote: number | null; erstelltAm: Date }`; `type OeffentlichesProfil = { anzeigename: string; avatarId: string | null; anzahl: number; werte: ProfilWerte | null; bewertungen: OeffentlicheBewertung[] }`; `netzTexte(w: Woerterbuch): Woerterbuch["profil"]`; aus `lib/query/profil-oeffentlich.ts`: `ladeOeffentlichesProfil(kurzId: string): Promise<OeffentlichesProfil | null>`.

- [ ] **Step 1: Tests**

```ts
// tests/profil-oeffentlich.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { OeffentlicheBewertungen } from "@/components/profil/OeffentlicheBewertungen";
import { de } from "@/lib/i18n/de";
import { netzTexte } from "@/lib/profil-oeffentlich";

test("netzTexte: dritte Person statt „mag ich“, Rest aus profil", () => {
  const t = netzTexte(de);
  assert.equal(t.magIch, "mag");
  assert.equal(t.magIchNicht, "mag nicht");
  assert.equal(t.nurMittelfeld, de.profilOeffentlich.nurMittelfeld);
  assert.equal(t.terpeneTitel, de.profil.terpeneTitel);
});

test("OeffentlicheBewertungen: Links auf den Eintrag, Note oder Hinweis", () => {
  const html = renderToStaticMarkup(
    createElement(OeffentlicheBewertungen, {
      bewertungen: [
        { id: "r1", slug: "nebel-22", handelsname: "Nebel 22", gesamtnote: 4.5, erstelltAm: new Date("2026-10-01") },
        { id: "r2", slug: "harz-1", handelsname: "Harz 1", gesamtnote: null, erstelltAm: new Date("2026-09-01") },
      ],
      anzahl: 2,
      texte: de.profilOeffentlich,
      w: de,
      sprache: "de",
    }),
  );
  assert.match(html, /href="\/blueten\/nebel-22#eintrag-r1"[^>]*>Nebel 22</);
  assert.match(html, /ohne Gesamtnote/);
  assert.doesNotMatch(html, /Die neuesten/);
});

test("OeffentlicheBewertungen: leer und gekürzt", () => {
  const leer = renderToStaticMarkup(createElement(OeffentlicheBewertungen, { bewertungen: [], anzahl: 0, texte: de.profilOeffentlich, w: de, sprache: "de" }));
  assert.match(leer, /Noch keine freigegebene Bewertung\./);
  const eine = { id: "r1", slug: "a", handelsname: "A", gesamtnote: 3, erstelltAm: new Date() };
  const gekuerzt = renderToStaticMarkup(createElement(OeffentlicheBewertungen, { bewertungen: [eine], anzahl: 60, texte: de.profilOeffentlich, w: de, sprache: "de" }));
  assert.match(gekuerzt, /Die neuesten 1\./);
});

test("Seite: falsche Kurz-Id fragt die Datenbank nicht", async () => {
  const { readFileSync } = await import("node:fs");
  const quelle = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  // Reihenfolge: erst istKurzId, dann ladeOeffentlichesProfil.
  assert.ok(quelle.indexOf("istKurzId(") > 0 && quelle.indexOf("istKurzId(") < quelle.indexOf("ladeOeffentlichesProfil("));
  assert.match(quelle, /index: false/);
  assert.doesNotMatch(quelle, /aktuellesProfil|ladeEmpfehlungen|auswertungen/);
});
```

Reine Teile (Typen, Konstante, `netzTexte`) liegen in `lib/profil-oeffentlich.ts` ohne Datenbankimport, damit Test und Komponente die Query nicht laden.

- [ ] **Step 2: Laufen lassen, scheitern.**

- [ ] **Step 3: Reine Teile und Query**

```ts
// lib/profil-oeffentlich.ts
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { ProfilWerte } from "@/lib/profil-typen";

/** Länge der öffentlichen Liste; darüber steht „Die neuesten 50“. */
export const OEFFENTLICHE_BEWERTUNGEN = 50;

export type OeffentlicheBewertung = { id: string; slug: string; handelsname: string; gesamtnote: number | null; erstelltAm: Date };

export type OeffentlichesProfil = {
  anzeigename: string;
  avatarId: string | null;
  /** Freigegebene Bewertungen insgesamt, nicht nur die gezeigten. */
  anzahl: number;
  /** Gespeicherter Stand aus nutzer_profil; null, wenn noch nie gerechnet. */
  werte: ProfilWerte | null;
  bewertungen: OeffentlicheBewertung[];
};

/** Texte fürs Netz in dritter Person; alles Übrige wie im eigenen Profil. */
export function netzTexte(w: Woerterbuch): Woerterbuch["profil"] {
  const o = w.profilOeffentlich;
  return {
    ...w.profil,
    magIch: o.magIch,
    magIchNicht: o.magIchNicht,
    netzSkala: o.netzSkala,
    vorlaeufig: o.vorlaeufig,
    nurMittelfeld: o.nurMittelfeld,
    srMag: o.srMag,
    srMagNicht: o.srMagNicht,
  };
}
```

```ts
// lib/query/profil-oeffentlich.ts
import { getPrisma } from "@/lib/prisma";
import { profilAusDaten } from "@/lib/profil";
import { OEFFENTLICHE_BEWERTUNGEN, type OeffentlichesProfil } from "@/lib/profil-oeffentlich";

/**
 * Öffentliches Profil (Spec Profil 9): nur wenn eingeschaltet, sonst null (404).
 * Nie Vorschläge oder Auswertungen, nie unfreigegebene Bewertungen. Das Netz
 * kommt ungerechnet aus nutzer_profil: fremde Aufrufe lösen keine Rechnung aus
 * (CPU-Limit); der Stand erneuert sich beim Speichern und beim Besuch des Inhabers.
 */
export async function ladeOeffentlichesProfil(kurzId: string): Promise<OeffentlichesProfil | null> {
  const prisma = await getPrisma();
  const m = await prisma.mitglied.findFirst({
    where: { kurzId, profilOeffentlich: true },
    select: { id: true, anzeigename: true, avatar: { select: { id: true } }, profil: true },
  });
  if (!m) return null;
  const nurFrei = { autorId: m.id, freigegeben: true } as const;
  const [anzahl, zeilen] = await Promise.all([
    prisma.review.count({ where: nurFrei }),
    prisma.review.findMany({
      where: nurFrei,
      orderBy: { erstelltAm: "desc" },
      take: OEFFENTLICHE_BEWERTUNGEN,
      select: { id: true, gesamtnote: true, erstelltAm: true, strain: { select: { slug: true, handelsname: true } } },
    }),
  ]);
  return {
    anzeigename: m.anzeigename,
    avatarId: m.avatar?.id ?? null,
    anzahl,
    werte: m.profil ? profilAusDaten(m.profil) : null,
    bewertungen: zeilen.map((z) => ({
      id: z.id,
      slug: z.strain.slug,
      handelsname: z.strain.handelsname,
      gesamtnote: z.gesamtnote === null ? null : Number(z.gesamtnote),
      erstelltAm: z.erstelltAm,
    })),
  };
}
```

Prüfe die Signatur von `profilAusDaten` in `lib/profil.ts` (nimmt die Prisma-Zeile von `nutzerProfil`) und den Typ von `gesamtnote` (Float seit 0015).

- [ ] **Step 4: Liste**

```tsx
// components/profil/OeffentlicheBewertungen.tsx
import Link from "next/link";

import { eintragHref } from "@/components/review/eintrag";
import { namenLinkKlassen } from "@/components/ui";
import { formatiereDatum, formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { OeffentlicheBewertung } from "@/lib/profil-oeffentlich";

type Props = {
  bewertungen: OeffentlicheBewertung[];
  anzahl: number;
  texte: Woerterbuch["profilOeffentlich"];
  w: Woerterbuch;
  sprache: Sprache;
};

/** Freigegebene Bewertungen eines öffentlichen Profils, neueste zuerst, je Zeile ein Sprung ins Buch. */
export function OeffentlicheBewertungen({ bewertungen, anzahl, texte, w, sprache }: Props) {
  if (bewertungen.length === 0) return <p className="text-body text-text-muted">{texte.bewertungenLeer}</p>;
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {bewertungen.map((b) => (
          <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Link prefetch={false} href={eintragHref(b.slug, b.id)} className={namenLinkKlassen("text-body wrap-break-word")}>
              {b.handelsname}
            </Link>
            <span className="text-small text-text-muted">
              <span className="numeric">
                {b.gesamtnote === null ? texte.ohneNote : t(w.bewerten.blattWert, { wert: formatiereWert(b.gesamtnote, sprache) })}
              </span>
              <span aria-hidden="true"> · </span>
              <time dateTime={b.erstelltAm.toISOString()}>{formatiereDatum(b.erstelltAm, sprache)}</time>
            </span>
          </li>
        ))}
      </ul>
      {anzahl > bewertungen.length ? (
        <p className="text-caption text-text-muted">{t(texte.neueste, { anzahl: bewertungen.length })}</p>
      ) : null}
    </div>
  );
}
```

Prüfe `w.bewerten.blattWert` (Text mit `{wert}`) in `lib/i18n/de.ts`; passt er nicht als Kurzform, nimm `w.profil.note` (`"{note} von 5"`, Parameter `note`).

- [ ] **Step 5: Seite**

```tsx
// app/[lang]/profil/[kurzId]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OeffentlicheBewertungen } from "@/components/profil/OeffentlicheBewertungen";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { TerpenRangliste } from "@/components/profil/TerpenRangliste";
import { Avatar, Card, CardBody, CardHeader } from "@/components/ui";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { istKurzId } from "@/lib/kurz-id";
import { netzTexte } from "@/lib/profil-oeffentlich";
import { ladeOeffentlichesProfil } from "@/lib/query/profil-oeffentlich";

/** Aus heißt sofort 404 (Spec Profil 9): kein Cache, der ein ausgeschaltetes Profil weiter zeigt. */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ kurzId: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { kurzId } = await params;
  const w = await holeWoerterbuch();
  const profil = istKurzId(kurzId) ? await ladeOeffentlichesProfil(kurzId).catch(() => null) : null;
  return {
    title: profil ? t(w.profilOeffentlich.titel, { name: profil.anzeigename }) : w.profil.titel,
    robots: { index: false, follow: false },
  };
}

/**
 * Öffentliches Profil (Spec Profil 9, Opt-in): Name, Avatar, Zahl und Liste der
 * freigegebenen Bewertungen und das Aroma-Netz. Nie Vorschläge oder
 * Auswertungen (privat), nie Wirkung (HWG). Ohne Einschalten 404, auch für
 * den Inhaber selbst; der Kopfknopf „Mein Profil“ ist hier nicht aktiv.
 */
export default async function OeffentlichesProfilPage({ params }: Params) {
  const { kurzId } = await params;
  if (!istKurzId(kurzId)) notFound();
  const [profil, w, sprache] = await Promise.all([ladeOeffentlichesProfil(kurzId), holeWoerterbuch(), holeSprache()]);
  if (!profil) notFound();
  const texte = w.profilOeffentlich;
  const werte = profil.werte;

  return (
    <div className="mx-auto w-full max-w-180 px-4 py-16 sm:px-8">
      <div className="flex items-center gap-4">
        <Avatar name={profil.anzeigename} bildId={profil.avatarId} groesse="md" />
        <div className="min-w-0">
          <h1 className="text-h1 text-text wrap-break-word">{profil.anzeigename}</h1>
          <p className="mt-2 text-body text-text-muted numeric">{mehrzahl(sprache, w.profil.anzahl, profil.anzahl)}</p>
        </div>
      </div>

      <section aria-labelledby="netz-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="netz-titel" className="text-h3 text-text">
              {texte.netzTitel}
            </h2>
          </CardHeader>
          <CardBody className="flex flex-col items-center gap-8">
            {werte && werte.anzahl > 0 ? (
              <>
                <p className="max-w-[68ch] self-start text-body text-text-muted text-pretty">
                  {t(texte.netzSatz, { name: profil.anzeigename })}
                </p>
                <ProfilNetz werte={werte} texte={netzTexte(w)} achsen={w.label.geschmack} sprache={sprache} />
                <TerpenRangliste terpene={werte.terpene} texte={w.profil} sprache={sprache} />
              </>
            ) : (
              <p className="self-start text-body text-text-muted">{texte.netzLeer}</p>
            )}
          </CardBody>
        </Card>
      </section>

      <section aria-labelledby="bewertungen-titel" className="mt-8">
        <Card>
          <CardHeader>
            <h2 id="bewertungen-titel" className="text-h3 text-text">
              {texte.bewertungenTitel}
            </h2>
          </CardHeader>
          <CardBody>
            <OeffentlicheBewertungen bewertungen={profil.bewertungen} anzahl={profil.anzahl} texte={texte} w={w} sprache={sprache} />
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
```

`werte.anzahl > 0` hält die Leerskizze mit dem Knopf „Erste Bewertung abgeben“ von fremden Profilen fern (ProfilNetz zeigt sie nur bei `anzahl === 0`).

- [ ] **Step 6: Prüfen** — `npm test`, `npx tsc --noEmit -p .`, `npx eslint` auf die neuen Dateien. `tests/i18n-literale.test.ts` muss grün bleiben (keine Literale außer `" · "` mit `aria-hidden`, wie in `/profil`).

- [ ] **Step 7: Commit** — `feat: öffentliches Profil unter /profil/<kurz-id>`

---

### Task 6: Controller (Merge, Review, Remote-D1, Push, Live)

- [ ] Stränge A bis D nacheinander nach `main` mergen, danach `npm test`, `npx tsc --noEmit -p .`, `npx eslint .` (oder auf alle geänderten Dateien).
- [ ] Gesamtreview (`superpowers:requesting-code-review`) über den Bereich ab Task 1; Fixwelle.
- [ ] Remote-D1: `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0018_profil_oeffentlich.sql`.
- [ ] Push nach `main`. Workers Build prüfen (HANDOFF „Lehre Deploy“), notfalls manuell auslösen mit vollem Hash.
- [ ] Live: `/mitglied` Schalter ein, Adresse öffnen, Netz und Liste sichtbar; Buch auf einer Blütenseite mit eigener Bewertung: Name verlinkt; Schalter aus, Adresse gibt 404, Name nicht mehr verlinkt; `/profil/ABC` 404; Kopfknopf auf `/profil/<id>` nicht aktiv.
- [ ] HANDOFF aktualisieren, committen, pushen.
