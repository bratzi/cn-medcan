# Startseite „Dein Kapitel“ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neue Startseiten-Sektion „Dein Kapitel“ nach der Abstimmung: Gäste sehen das öffentliche Kapitel des Betreibers als Schaufenster, Mitglieder ihr eigenes Kapitel.

**Architecture:** Die Startseite bleibt `force-static`. Das Schaufenster wird serverseitig mit der Seite gerendert (`lib/query/kapitel-start.ts`). Das eigene Kapitel kommt als neues Feld `kapitel` aus `/api/startseite` und ersetzt im Browser das Schaufenster per `<ViewTransition>` (Insel `KapitelImBrowser`, Muster wie `EmpfehlungenImBrowser`). Bewegung über eine neue GSAP-Choreografie `components/story/bewegung/kapitel.ts`.

**Tech Stack:** Next.js 16 App Router (Version im Repo, siehe AGENTS.md), React 19 (`ViewTransition` aus `react`), Prisma 7 auf Cloudflare D1, Tailwind v4, GSAP (nur in `components/story/bewegung/`), Tests mit `tsx --test` (`npm test`).

**Spec:** `docs/superpowers/specs/2026-10-09-startseite-dein-kapitel-design.md`

## Global Constraints

- Regelwerk `.claude/skills/ui-design-engine.md` gilt für jede Datei unter `app/**` und `components/**`: Abstände nur 8, 16, 24, 32, 40, 48, 64, 80, 96, 128 px; nur semantische Farbtokens; kein `dark:`.
- `font-hand` nur zusammen mit `text-notiz`, `text-vermerk`, `text-marke` oder `text-umschlag` in derselben Klassenzeile (Test `tests/marke.test.ts`). Namen und Handelsnamen nie in `font-hand`.
- Keine Wirkungsnote, keine Wirkungsaussage auf der Startseite (Regel 9, HWG).
- Kein Geviertstrich (U+2014), kein Gedankenstrich (U+2013) in neuen Texten.
- Keine deutschen Literale in Komponenten: Texte nur aus `lib/i18n/de.ts` und `lib/i18n/en.ts` (gleiche Form, Typ `Woerterbuch`).
- `sm:`/`md:`/`lg:` nie mit `min-[…px]:` auf derselben Eigenschaft mischen. In dieser Sektion nur `min-[640px]:` und `min-[1080px]:`.
- GSAP nur in `components/story/bewegung/`; animiert nur `transform`, `opacity`, `clip-path`.
- Keine neue npm-Abhängigkeit. Kein `next dev`/`next build` lokal (Dauerregel): prüfen mit `npm test`, `npx tsc --noEmit`, `npx eslint`, `npm run farben`; live nach Push.
- Client-Komponenten dürfen nichts importieren, was `server-only`, `@/lib/prisma` oder `@/lib/query/*` außer `@/lib/query/bewertung` zieht.
- Genau eine gefüllte Primäraktion in der Sektion.

## Review Focus

- Gast, Betreiber-Profil privat geschaltet oder nicht freigegeben: Sektion zeigt die leere Gast-Fassung (Satz plus „Konto anlegen“), nie Daten eines privaten Profils. Test in Task 2.
- Mitglied ohne freigegebene Bewertung (bewertet 0, kein Netz, kein „zuletzt“): kein leeres Netz, kein „Zuletzt“-Block, Satz `leerNetz` und Aktion „Erste Bewertung schreiben“. Test in Task 3.
- `/api/startseite` mit Fehler nur in der Kapitel-Abfrage: Stimmzettel und Empfehlungen funktionieren weiter, `kapitel` ist `null`. Test in Task 2.
- Sitzung lädt nach dem Einstieg der Bewegung (Knoten getauscht): neue Knoten stehen sichtbar ohne Inline-Clip, alte Knoten werden nicht mehr animiert. Test in Task 4 (Quelltext: `isConnected`, Abfrage im `onEnter`).
- Sehr langer Anzeigename (z. B. 40 Zeichen ohne Leerzeichen) bei 343 px Breite: Umbruch statt Überlauf (`wrap-break-word`, `min-w-0`). Test in Task 3 (Klassen im Markup).

---

### Task 1: Grundlage (Typ, reine Helfer, Texte, Sitzungsfeld)

Läuft zuerst und allein. Die Stränge A, B, C (Tasks 2 bis 4) bauen darauf und laufen danach parallel.

**Files:**
- Create: `lib/kapitel-start.ts`
- Modify: `lib/i18n/de.ts` (Block `start`, nach `abstimmung`), `lib/i18n/en.ts` (gleiche Stelle)
- Modify: `lib/startseite-sitzung.ts`
- Test: `tests/kapitel-start.test.ts`, `tests/startseite-sitzung.test.ts` (prüfen, ob vorhanden; sonst neu)

**Interfaces:**
- Produces:
  - `type KapitelDaten = { anzeigename: string; avatarId: string | null; bewertet: number; schnitt: number | null; dritte: { art: "gestimmt" | "vonEuch"; zahl: number }; netz: ProfilWerte | null; zuletzt: { slug: string; handelsname: string; gesamtnote: number | null; datum: string } | null }`
  - `function kapitelAus(e: KapitelEingabe): KapitelDaten` mit `type KapitelEingabe = Omit<KapitelDaten, "zuletzt"> & { zuletzt: { slug: string; handelsname: string; gesamtnote: number | null; erstelltAm: Date } | null }`
  - `function kapitelNotizen(d: KapitelDaten, texte: Woerterbuch["start"]["kapitel"], sprache: Sprache): Randnotiz[]`
  - `StartseitenSitzung.kapitel: KapitelDaten | null`; `sitzungsAntwort` nimmt optional `kapitel?: KapitelDaten | null`
  - `function kapitelAnzeige(stand: SitzungsStand): KapitelDaten | null`
  - Texte `w.start.kapitel` (Schlüssel siehe Step 3)

- [ ] **Step 1: Failing test schreiben** `tests/kapitel-start.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { kapitelAus, kapitelNotizen } from "@/lib/kapitel-start";
import { de } from "@/lib/i18n/de";
import { leereProfilWerte } from "@/lib/profil";

const basis = {
  anzeigename: "GrünesBuch",
  avatarId: null,
  bewertet: 5,
  schnitt: 4.4333,
  dritte: { art: "vonEuch" as const, zahl: 21 },
  netz: { ...leereProfilWerte(), anzahl: 5, gewichtet: 4 },
  zuletzt: { slug: "remexian", handelsname: "Remexian 30/1 PGF CIS", gesamtnote: 4.5, erstelltAm: new Date("2026-10-08T10:00:00Z") },
};

test("kapitelAus rundet den Schnitt auf eine Stelle und macht das Datum JSON-fest", () => {
  const d = kapitelAus(basis);
  assert.equal(d.schnitt, 4.4);
  assert.equal(d.zuletzt?.datum, "2026-10-08T10:00:00.000Z");
});

test("kapitelAus: ohne Bewertung kein Netz und kein Zuletzt", () => {
  const d = kapitelAus({ ...basis, bewertet: 0, schnitt: null, zuletzt: null });
  assert.equal(d.netz, null);
  assert.equal(d.zuletzt, null);
});

test("kapitelAus: Netz ohne Gewicht zählt als kein Netz", () => {
  assert.equal(kapitelAus({ ...basis, netz: { ...leereProfilWerte(), anzahl: 2, gewichtet: 0 } }).netz, null);
});

test("kapitelNotizen: drei Notizen, ohne Schnitt zwei", () => {
  const t = de.start.kapitel;
  const voll = kapitelNotizen(kapitelAus(basis), t, "de");
  assert.deepEqual(voll.map((n) => n.wort), [t.bewertet, t.imSchnitt, t.vonEuch]);
  assert.equal(voll[1].zahl, "4,4");
  const ohne = kapitelNotizen(kapitelAus({ ...basis, schnitt: null }), t, "de");
  assert.deepEqual(ohne.map((n) => n.wort), [t.bewertet, t.vonEuch]);
});

test("kapitelNotizen: Mitglied zeigt gestimmt", () => {
  const n = kapitelNotizen(kapitelAus({ ...basis, dritte: { art: "gestimmt", zahl: 3 } }), de.start.kapitel, "de");
  assert.equal(n[2].wort, de.start.kapitel.gestimmt);
  assert.equal(n[2].zahl, "3");
});
```

- [ ] **Step 2: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/kapitel-start.test.ts`
Expected: FAIL, Modul `@/lib/kapitel-start` fehlt.

- [ ] **Step 3: Texte anlegen.** In `lib/i18n/de.ts` im Objekt `start` direkt nach dem Block `abstimmung: { … },`:

```ts
    kapitel: {
      vor: "Dein",
      betont: "Kapitel",
      schlagwort: "dein buch",
      vermerk: "so sieht ein kapitel aus",
      satzGast: "Jede Bewertung und jede Stimme landet in deinem Kapitel.",
      notizen: "Zahlen aus dem Kapitel",
      bewertet: "bewertet",
      imSchnitt: "im schnitt",
      gestimmt: "gestimmt",
      vonEuch: "von euch",
      satzBewertet: "Bewertet: {zahl}",
      satzSchnitt: "Im Schnitt {zahl} von 5 Blättern",
      satzGestimmt: "Gestimmt: {zahl}",
      satzVonEuch: "Bewertungen von euch: {zahl}",
      zuletzt: "Zuletzt bewertet",
      schnittText: "{zahl} von 5",
      zumKapitel: "Zu deinem Kapitel",
      kontoAnlegen: "Konto anlegen",
      leerNetz: "Dein Netz entsteht mit deiner ersten Bewertung.",
      ersteBewertung: "Erste Bewertung schreiben",
      geladen: "Dein Kapitel ist aufgeschlagen.",
    },
```

In `lib/i18n/en.ts` an derselben Stelle:

```ts
    kapitel: {
      vor: "Your",
      betont: "chapter",
      schlagwort: "your book",
      vermerk: "this is what a chapter looks like",
      satzGast: "Every review and every vote ends up in your chapter.",
      notizen: "Numbers from the chapter",
      bewertet: "reviewed",
      imSchnitt: "on average",
      gestimmt: "voted",
      vonEuch: "from you",
      satzBewertet: "Reviewed: {zahl}",
      satzSchnitt: "On average {zahl} of 5 leaves",
      satzGestimmt: "Voted: {zahl}",
      satzVonEuch: "Reviews from you: {zahl}",
      zuletzt: "Last reviewed",
      schnittText: "{zahl} of 5",
      zumKapitel: "To your chapter",
      kontoAnlegen: "Create account",
      leerNetz: "Your web takes shape with your first review.",
      ersteBewertung: "Write your first review",
      geladen: "Your chapter is open.",
    },
```

- [ ] **Step 4: `lib/kapitel-start.ts` schreiben** (rein, ohne Datenbank, client-tauglich)

```ts
import type { Randnotiz } from "@/components/kapitel/Randnotizen";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { ProfilWerte } from "@/lib/profil-typen";

/**
 * Ein Kapitel auf der Startseite (Spec Dein Kapitel 4): das Schaufenster des Betreibers oder das eigene.
 * JSON-fest, weil das eigene über /api/startseite kommt. Nur Aroma, nie Wirkung (HWG).
 */
export type KapitelDaten = {
  anzeigename: string;
  avatarId: string | null;
  /** Freigegebene Bewertungen zu aktiven Sorten. */
  bewertet: number;
  /** Mittel der eigenen Gesamtnoten, eine Stelle; null ohne Gesamtnote. */
  schnitt: number | null;
  /** Dritte Randnotiz: eigene Stimmen (Mitglied) oder Community-Bewertungen (Schaufenster). */
  dritte: { art: "gestimmt" | "vonEuch"; zahl: number };
  /** null ohne Bewertung oder ohne gewichtete Bewertung. */
  netz: ProfilWerte | null;
  zuletzt: { slug: string; handelsname: string; gesamtnote: number | null; datum: string } | null;
};

export type KapitelEingabe = Omit<KapitelDaten, "zuletzt"> & {
  zuletzt: { slug: string; handelsname: string; gesamtnote: number | null; erstelltAm: Date } | null;
};

export function kapitelAus(e: KapitelEingabe): KapitelDaten {
  const ohneBewertung = e.bewertet === 0;
  return {
    anzeigename: e.anzeigename,
    avatarId: e.avatarId,
    bewertet: e.bewertet,
    schnitt: ohneBewertung || e.schnitt === null ? null : Math.round(e.schnitt * 10) / 10,
    dritte: e.dritte,
    netz: ohneBewertung || !e.netz || e.netz.gewichtet === 0 ? null : e.netz,
    zuletzt:
      ohneBewertung || !e.zuletzt
        ? null
        : { slug: e.zuletzt.slug, handelsname: e.zuletzt.handelsname, gesamtnote: e.zuletzt.gesamtnote, datum: e.zuletzt.erstelltAm.toISOString() },
  };
}

export function kapitelNotizen(d: KapitelDaten, texte: Woerterbuch["start"]["kapitel"], sprache: Sprache): Randnotiz[] {
  const ganz = (n: number) => formatiereZahl(n, 0, sprache);
  const notizen: Randnotiz[] = [
    { zahl: ganz(d.bewertet), wort: texte.bewertet, satz: t(texte.satzBewertet, { zahl: ganz(d.bewertet) }) },
  ];
  if (d.schnitt !== null) {
    const zahl = formatiereZahl(d.schnitt, 1, sprache);
    notizen.push({ zahl, wort: texte.imSchnitt, satz: t(texte.satzSchnitt, { zahl }) });
  }
  const gestimmt = d.dritte.art === "gestimmt";
  notizen.push({
    zahl: ganz(d.dritte.zahl),
    wort: gestimmt ? texte.gestimmt : texte.vonEuch,
    satz: t(gestimmt ? texte.satzGestimmt : texte.satzVonEuch, { zahl: ganz(d.dritte.zahl) }),
  });
  return notizen;
}
```

Prüfen: `formatiereZahl(4.4, 1, "de")` ergibt `"4,4"` und `formatiereZahl(3, 0, "de")` `"3"`; sonst die Tests an das tatsächliche Format anpassen, nicht die Funktion.

- [ ] **Step 5: Sitzungsfeld.** In `lib/startseite-sitzung.ts`:

```ts
import type { KapitelDaten } from "@/lib/kapitel-start";
```

Typ erweitern:

```ts
export type StartseitenSitzung = {
  abstimmung: { umfrageId: string | null; zustand: StimmZustand };
  empfehlungen: { art: "GAST" } | { art: "LISTE"; eintraege: EmpfehlungsEintrag[] };
  budpicZugang: BudpicZugang;
  /** Das eigene Kapitel (Spec Dein Kapitel 4.2); null für Gäste und wenn die Abfrage scheitert. */
  kapitel: KapitelDaten | null;
};
```

`sitzungsAntwort`: Eingabe um `kapitel?: KapitelDaten | null` erweitern; im Gast-Zweig `kapitel: null`, im Mitglied-Zweig `kapitel: eingabe.kapitel ?? null`. Neue Funktion am Ende:

```ts
/** Das eigene Kapitel, sobald die Sitzung da ist; sonst bleibt das Schaufenster stehen. */
export function kapitelAnzeige(stand: SitzungsStand): KapitelDaten | null {
  return stand.status === "fertig" ? stand.daten.kapitel : null;
}
```

- [ ] **Step 6: Sitzungstest ergänzen.** Prüfen, ob `tests/startseite-sitzung.test.ts` existiert (`ls tests | grep sitzung`). Dort (oder in `tests/kapitel-start.test.ts`) anhängen:

```ts
import { kapitelAnzeige, sitzungsAntwort } from "@/lib/startseite-sitzung";

test("Sitzung: Gast ohne Kapitel, Mitglied mit Kapitel, laden ohne Kapitel", () => {
  const kapitel = kapitelAus(basis);
  const gast = sitzungsAntwort({ mitglied: null, umfrageId: null, eigeneOptionId: null, empfehlungen: [], kapitel });
  assert.equal(gast.kapitel, null);
  const mitglied = sitzungsAntwort({ mitglied: { freigegeben: true }, umfrageId: null, eigeneOptionId: null, empfehlungen: [], kapitel });
  assert.deepEqual(kapitelAnzeige({ status: "fertig", daten: mitglied }), kapitel);
  assert.equal(kapitelAnzeige({ status: "laedt" }), null);
  assert.equal(kapitelAnzeige({ status: "fehler" }), null);
});
```

- [ ] **Step 7: Tests und Typen**

Run: `npx tsx --test tests/kapitel-start.test.ts && npx tsc --noEmit && npm test`
Expected: alles PASS. Schlägt ein bestehender Test fehl, weil `StartseitenSitzung` jetzt `kapitel` verlangt (Objektliterale in Tests), dort `kapitel: null` ergänzen.

- [ ] **Step 8: Commit**

```bash
git add lib/kapitel-start.ts lib/startseite-sitzung.ts lib/i18n/de.ts lib/i18n/en.ts tests/
git commit -m "feat: Grundlage Startseite Dein Kapitel (Typ, Notizen, Texte, Sitzungsfeld)"
```

---

### Task 2 (Strang A): Abfragen und `/api/startseite`

**Files:**
- Create: `lib/query/kapitel-start.ts`
- Modify: `app/api/startseite/route.ts`
- Test: `tests/kapitel-start-abfrage.test.ts`

**Interfaces:**
- Consumes: `kapitelAus`, `KapitelDaten` (Task 1); `stimmZahlen(mitgliedId)` aus `lib/query/konto.ts`; `oeffentlicheWerte(roh)` und `profilAusDaten(z)` aus `lib/profil.ts`.
- Produces: `ladeSchaufensterKapitel(): Promise<KapitelDaten | null>` (React `cache`), `ladeEigenesKapitel(mitgliedId: string): Promise<KapitelDaten | null>`.

- [ ] **Step 1: Failing test** `tests/kapitel-start-abfrage.test.ts` (Quelltext-Test wie `tests/startseite-eintrag.test.ts`; die Abfragen selbst werden in Step 5 gegen Remote-D1 lesend geprüft)

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const quelle = readFileSync("lib/query/kapitel-start.ts", "utf8");
const route = readFileSync("app/api/startseite/route.ts", "utf8");

test("Schaufenster nur aus öffentlichem, freigegebenem Betreiber-Profil", () => {
  const teil = quelle.slice(quelle.indexOf("export const ladeSchaufensterKapitel"));
  assert.match(teil, /rolle: "ADMIN"/);
  assert.match(teil, /profilOeffentlich: true/);
  assert.match(teil, /freigegeben: true/);
  // Netz nur aus dem öffentlichen Stand, nie aus dem privaten.
  assert.match(teil, /oeffentlicheWerte\(/);
  assert.doesNotMatch(teil, /profilAusDaten\(/);
});

test("Zählungen nur freigegeben und aktive Sorte", () => {
  assert.match(quelle, /freigegeben: true, strain: \{ aktiv: true \}/);
});

test("Eigenes Kapitel rechnet das Profil nicht neu (CPU-Limit)", () => {
  assert.doesNotMatch(quelle, /profilFortschreiben|aktuellesProfil/);
});

test("API: Kapitel-Fehler bricht die Sitzung nicht", () => {
  assert.match(route, /ladeEigenesKapitel\(mitglied\.mitgliedId\)\.catch\(/);
  assert.match(route, /kapitel,/);
});
```

- [ ] **Step 2:** Run `npx tsx --test tests/kapitel-start-abfrage.test.ts`. Expected: FAIL (Datei fehlt).

- [ ] **Step 3: `lib/query/kapitel-start.ts` schreiben**

```ts
import "server-only";

import { cache } from "react";

import { kapitelAus, type KapitelDaten } from "@/lib/kapitel-start";
import { getPrisma } from "@/lib/prisma";
import { oeffentlicheWerte, profilAusDaten } from "@/lib/profil";
import { stimmZahlen } from "@/lib/query/konto";

const FREI = { freigegeben: true, strain: { aktiv: true } } as const;

const ZULETZT = {
  orderBy: [{ erstelltAm: "desc" }, { id: "asc" }],
  select: { gesamtnote: true, erstelltAm: true, strain: { select: { slug: true, handelsname: true } } },
} as const;

async function eigeneZahlen(autorId: string) {
  const prisma = await getPrisma();
  const wo = { ...FREI, autorId };
  const [bewertet, schnitt, zuletzt] = await Promise.all([
    prisma.review.count({ where: wo }),
    prisma.review.aggregate({ where: { ...wo, gesamtnote: { not: null } }, _avg: { gesamtnote: true } }),
    prisma.review.findFirst({ where: wo, ...ZULETZT }),
  ]);
  return {
    bewertet,
    schnitt: schnitt._avg.gesamtnote ?? null,
    zuletzt: zuletzt
      ? { slug: zuletzt.strain.slug, handelsname: zuletzt.strain.handelsname, gesamtnote: zuletzt.gesamtnote, erstelltAm: zuletzt.erstelltAm }
      : null,
  };
}

/**
 * Schaufenster für Gäste (Spec Dein Kapitel 4.1): das öffentliche Kapitel des Betreibers, nur was
 * /profil/<kurzId> ohnehin zeigt. Privat oder nicht freigegeben: null, die Sektion zeigt dann die
 * leere Gast-Fassung. Statisch mit der Seite (300 s).
 */
export const ladeSchaufensterKapitel = cache(async (): Promise<KapitelDaten | null> => {
  const prisma = await getPrisma();
  const m = await prisma.mitglied.findFirst({
    where: { rolle: "ADMIN", profilOeffentlich: true, freigegeben: true },
    orderBy: { erstelltAm: "asc" },
    select: { id: true, anzeigename: true, avatar: { select: { id: true } }, profil: { select: { oeffentlich: true } } },
  });
  if (!m) return null;
  const [zahlen, vonEuch] = await Promise.all([
    eigeneZahlen(m.id),
    prisma.review.count({ where: { ...FREI, istRedaktionell: false } }),
  ]);
  return kapitelAus({
    anzeigename: m.anzeigename,
    avatarId: m.avatar?.id ?? null,
    ...zahlen,
    dritte: { art: "vonEuch", zahl: vonEuch },
    netz: oeffentlicheWerte(m.profil?.oeffentlich ?? null),
  });
});

/**
 * Das eigene Kapitel für /api/startseite (Spec 4.2). Liest den gespeicherten Profilstand, rechnet nie
 * neu (CPU-Limit 10 ms); neu gerechnet wird auf /profil. null, wenn das Mitglied fehlt.
 */
export async function ladeEigenesKapitel(mitgliedId: string): Promise<KapitelDaten | null> {
  const prisma = await getPrisma();
  const [m, zahlen, stimmen] = await Promise.all([
    prisma.mitglied.findUnique({
      where: { id: mitgliedId },
      select: { anzeigename: true, avatar: { select: { id: true } }, profil: true },
    }),
    eigeneZahlen(mitgliedId),
    stimmZahlen(mitgliedId),
  ]);
  if (!m) return null;
  return kapitelAus({
    anzeigename: m.anzeigename,
    avatarId: m.avatar?.id ?? null,
    ...zahlen,
    dritte: { art: "gestimmt", zahl: stimmen.stimmen },
    netz: m.profil ? profilAusDaten(m.profil) : null,
  });
}
```

Vor dem Schreiben prüfen und bei Abweichung anpassen (nicht raten):
- `prisma/schema.prisma`, Modell `Mitglied`: heißen die Felder `erstelltAm`, `avatar`, `profil` so? (`grep -n "^model Mitglied" -A45 prisma/schema.prisma`). Gibt es kein `erstelltAm`, nach `id` ordnen.
- `profilAusDaten` erwartet `{ geschmack, terpene, anzahl, gewichtet }`: passt das Modell `NutzerProfil`? (`lib/query/profil.ts:105-110` nutzt es genauso.)

- [ ] **Step 4: Route erweitern.** In `app/api/startseite/route.ts`:

```ts
import { ladeEigenesKapitel } from "@/lib/query/kapitel-start";
```

Im Mitglied-Zweig das `Promise.all` ersetzen:

```ts
  const [umfrageId, liste, kapitel] = await Promise.all([
    aktiveUmfrageId(),
    ladeEmpfehlungen(mitglied.mitgliedId),
    // Kein Pflichtinhalt (Spec 4.3): scheitert das Kapitel, bleibt das Schaufenster, der Rest läuft weiter.
    ladeEigenesKapitel(mitglied.mitgliedId).catch((fehler: unknown) => {
      console.error("ladeEigenesKapitel fehlgeschlagen", fehler);
      return null;
    }),
  ]);
```

und in `sitzungsAntwort({ … })` des Mitglied-Zweigs `kapitel,` ergänzen. Den Docblock der Route um „das eigene Kapitel“ ergänzen.

- [ ] **Step 5: Abfrage gegen Remote-D1 lesend gegenprüfen** (nur lesen, keine Schreibbefehle)

```bash
npx wrangler d1 execute cn-medcan-db --remote --json --command "SELECT m.anzeigename, (SELECT count(*) FROM reviews r JOIN strains s ON s.id=r.strain_id WHERE r.autor_id=m.id AND r.freigegeben=1 AND s.aktiv=1) n, (SELECT round(avg(r.gesamtnote),1) FROM reviews r JOIN strains s ON s.id=r.strain_id WHERE r.autor_id=m.id AND r.freigegeben=1 AND s.aktiv=1 AND r.gesamtnote IS NOT NULL) schnitt FROM mitglied m WHERE m.rolle='ADMIN' AND m.profil_oeffentlich=1 AND m.freigegeben=1"
```

Expected: eine Zeile „GrünesBuch“, `n` = 5 (Stand 2026-10-09), `schnitt` eine Zahl. Spaltennamen bei Fehler aus `prisma/schema.prisma` (`@map`) nehmen. Ergebnis im Bericht nennen.

- [ ] **Step 6:** Run `npx tsx --test tests/kapitel-start-abfrage.test.ts && npx tsc --noEmit && npm test`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/query/kapitel-start.ts app/api/startseite/route.ts tests/kapitel-start-abfrage.test.ts
git commit -m "feat: Kapitel-Abfragen und eigenes Kapitel in /api/startseite"
```

---

### Task 3 (Strang B): Sektion, Komposition und Insel

**Files:**
- Create: `components/kapitel-start/KapitelAufschlag.tsx`, `components/kapitel-start/KapitelImBrowser.tsx`, `components/story/DeinKapitel.tsx`
- Modify: `app/[lang]/page.tsx` (nach `<Abstimmung />`)
- Modify: `tests/i18n-literale.test.ts` und `tests/hover.test.ts` (neue Dateien in die Dateilisten, falls die Tests Listen führen)
- Test: `tests/kapitel-aufschlag.test.ts`

**Interfaces:**
- Consumes: `KapitelDaten`, `kapitelNotizen`, `kapitelAnzeige` (Task 1); `ladeSchaufensterKapitel` (Task 2, nur in `DeinKapitel.tsx`). Ist Task 2 im Worktree noch nicht da, `DeinKapitel.tsx` zuletzt schreiben und die Funktion mit der Signatur aus Task 2 importieren; `tsc` läuft erst nach dem Merge grün.
- Produces: Markup-Vertrag für Task 4: Wurzel `data-story="kapitel"` (am `<section>`), Name `data-story="kapitel-name"`, je Randnotiz-Wort `data-story="kapitel-wort"`.

- [ ] **Step 1: Failing test** `tests/kapitel-aufschlag.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KapitelAufschlag, kapitelTexte } from "@/components/kapitel-start/KapitelAufschlag";
import { de } from "@/lib/i18n/de";
import { kapitelAus } from "@/lib/kapitel-start";
import { leereProfilWerte } from "@/lib/profil";

const t = de.start.kapitel;
const daten = kapitelAus({
  anzeigename: "GrünesBuch",
  avatarId: null,
  bewertet: 5,
  schnitt: 4.4,
  dritte: { art: "vonEuch", zahl: 21 },
  netz: { ...leereProfilWerte(), geschmack: { ...leereProfilWerte().geschmack, zitrus: 1 }, anzahl: 5, gewichtet: 4 },
  zuletzt: { slug: "remexian", handelsname: "Remexian 30/1 PGF CIS", gesamtnote: 4.5, erstelltAm: new Date("2026-10-08T10:00:00Z") },
});
const zeige = (art: "schaufenster" | "eigen", d = daten) =>
  renderToStaticMarkup(createElement(KapitelAufschlag, { daten: d, art, texte: kapitelTexte(de), sprache: "de" }));

test("Schaufenster: Vermerk, Konto anlegen, eine Primäraktion", () => {
  const html = zeige("schaufenster");
  assert.match(html, new RegExp(t.vermerk));
  assert.match(html, /href="\/registrieren"/);
  assert.match(html, new RegExp(t.kontoAnlegen));
  assert.doesNotMatch(html, new RegExp(t.zumKapitel));
});

test("Eigenes Kapitel: kein Vermerk, Zu deinem Kapitel", () => {
  const html = zeige("eigen");
  assert.doesNotMatch(html, new RegExp(t.vermerk));
  assert.match(html, /href="\/profil"/);
  assert.match(html, new RegExp(t.zumKapitel));
});

test("Name gedruckt, umbrechend, mit Bewegungsziel", () => {
  const html = zeige("eigen");
  const name = html.slice(html.indexOf('data-story="kapitel-name"') - 200, html.indexOf("GrünesBuch") + 20);
  assert.doesNotMatch(name, /font-hand/);
  assert.match(name, /wrap-break-word/);
  assert.equal((html.match(/data-story="kapitel-wort"/g) ?? []).length, 3);
});

test("Zuletzt: Handelsname als Link, keine Wirkung", () => {
  const html = zeige("eigen");
  assert.match(html, /href="\/blueten\/remexian"/);
  assert.match(html, /Remexian 30\/1 PGF CIS/);
  assert.doesNotMatch(html, /Wirkung/);
});

test("Ohne Bewertung: Leer-Satz und Erste Bewertung statt Netz und Zuletzt", () => {
  const leer = kapitelAus({ ...daten, bewertet: 0, schnitt: null, netz: null, zuletzt: null, dritte: { art: "gestimmt", zahl: 2 } });
  const html = zeige("eigen", leer);
  assert.match(html, new RegExp(t.leerNetz));
  assert.match(html, /href="\/blueten"/);
  assert.match(html, new RegExp(t.ersteBewertung));
  assert.doesNotMatch(html, new RegExp(t.zuletzt));
  assert.doesNotMatch(html, new RegExp(t.zumKapitel));
});
```

Hinweis: `kapitelAus` erwartet `zuletzt` mit `erstelltAm`; im Leer-Test `zuletzt: null` übergeben (wie oben). Prüfen, ob `leereProfilWerte().geschmack` ein Record über alle Achsen ist (`lib/profil.ts:61`).

- [ ] **Step 2:** Run `npx tsx --test tests/kapitel-aufschlag.test.ts`. Expected: FAIL (Modul fehlt).

- [ ] **Step 3: `components/kapitel-start/KapitelAufschlag.tsx`** (ohne `"use client"`, aber client-tauglich: wird auch in der Insel gerendert)

```tsx
import Link from "next/link";

import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { Avatar, buttonKlassen, namenLinkKlassen } from "@/components/ui";
import { formatiereDatum, formatiereZahl } from "@/lib/format";
import { kapitelNotizen, type KapitelDaten } from "@/lib/kapitel-start";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { netzTexte } from "@/lib/profil-oeffentlich";

/** Nur die Texte, die das Kapitel braucht: die Insel serialisiert sie ins HTML, nicht das ganze Wörterbuch. */
export type KapitelTexte = {
  kapitel: Woerterbuch["start"]["kapitel"];
  profil: Woerterbuch["profil"];
  profilOeffentlich: Woerterbuch["profil"];
  achsen: Woerterbuch["label"]["geschmack"];
};

export function kapitelTexte(w: Woerterbuch): KapitelTexte {
  return { kapitel: w.start.kapitel, profil: w.profil, profilOeffentlich: netzTexte(w), achsen: w.label.geschmack };
}

/**
 * Der Aufschlag eines Kapitels auf der Startseite (Spec Dein Kapitel 3): Name als Titel, Zahlen als
 * Randnotizen (Zahl gedruckt, Wort von Hand), das Aroma-Netz als einziges Bild, darunter „Zuletzt
 * bewertet“ und genau eine Aktion. Schaufenster (Betreiber, Gast) und eigenes Kapitel teilen die
 * Komposition, damit beim Umblättern nichts springt. Nur Aroma, nie Wirkung (HWG).
 */
export function KapitelAufschlag({
  daten,
  art,
  texte: alle,
  sprache,
}: {
  daten: KapitelDaten;
  art: "schaufenster" | "eigen";
  texte: KapitelTexte;
  sprache: Sprache;
}) {
  const texte = alle.kapitel;
  const notizen = kapitelNotizen(daten, texte, sprache);
  const leer = daten.bewertet === 0;
  const aktion =
    art === "schaufenster"
      ? { href: "/registrieren", text: texte.kontoAnlegen }
      : leer
        ? { href: "/blueten", text: texte.ersteBewertung }
        : { href: "/profil", text: texte.zumKapitel };

  return (
    <div className="grid grid-cols-1 gap-12 min-[1080px]:grid-cols-10 min-[1080px]:gap-x-16">
      <div className="flex min-w-0 flex-col gap-8 min-[1080px]:col-span-6">
        {art === "schaufenster" ? (
          <p className="font-hand text-vermerk text-kopierstift">{texte.vermerk}</p>
        ) : null}
        <div className="flex min-w-0 flex-col gap-6 min-[640px]:flex-row min-[640px]:items-center">
          {/* ring-offset-4 = 4px: optische Korrektur wie im Buch, der Ring liegt wie ein Stempel. */}
          <Avatar
            name={daten.anzeigename}
            bildId={daten.avatarId}
            groesse="lg"
            className="ring-1 ring-border-strong ring-offset-4 ring-offset-surface max-[639px]:size-20"
          />
          <p data-story="kapitel-name" className="min-w-0 font-buch text-titel text-text wrap-break-word">
            {daten.anzeigename}
          </p>
        </div>
        <ul aria-label={texte.notizen} className="grid grid-cols-2 gap-8 min-[640px]:grid-cols-3">
          {notizen.map((n) => (
            <li key={n.wort} className="flex min-w-0 flex-col gap-2">
              <span className="sr-only">{n.satz}</span>
              <span aria-hidden="true" className="numeric text-display text-text">
                {n.zahl}
              </span>
              <span aria-hidden="true" data-story="kapitel-wort" className="font-hand text-notiz text-logo wrap-break-word">
                {n.wort}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 min-[1080px]:col-span-4">
        {daten.netz ? (
          <div data-netz-erscheinen="" className="mx-auto w-full max-w-96">
            <ProfilNetz
              werte={daten.netz}
              texte={art === "schaufenster" ? alle.profilOeffentlich : alle.profil}
              achsen={alle.achsen}
              sprache={sprache}
            />
          </div>
        ) : (
          <p className="max-w-[48ch] text-body text-text-muted text-pretty">
            {art === "schaufenster" ? texte.satzGast : texte.leerNetz}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6 border-t border-border pt-8 min-[1080px]:col-span-10 min-[1080px]:flex-row min-[1080px]:items-center min-[1080px]:justify-between">
        {daten.zuletzt ? (
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-small text-text-muted">{texte.zuletzt}</p>
            <p className="font-buch text-h3 wrap-break-word">
              <Link prefetch={false} href={`/blueten/${daten.zuletzt.slug}`} className={namenLinkKlassen()}>
                {daten.zuletzt.handelsname}
              </Link>
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {daten.zuletzt.gesamtnote !== null ? (
                <BlattAnzeige
                  note={daten.zuletzt.gesamtnote}
                  text={t(texte.schnittText, { zahl: formatiereZahl(daten.zuletzt.gesamtnote, 1, sprache) })}
                />
              ) : null}
              <span className="numeric text-small text-text-muted">{formatiereDatum(daten.zuletzt.datum, sprache)}</span>
            </div>
          </div>
        ) : (
          <span />
        )}
        <Link prefetch={false} href={aktion.href} className={buttonKlassen("primary")}>
          {aktion.text}
        </Link>
      </div>
    </div>
  );
}
```

Vor dem Schreiben prüfen und anpassen: Exporte von `@/components/ui` (`Avatar`, `buttonKlassen`, `namenLinkKlassen`: `grep -n "export" components/ui/index.ts`); Token `text-logo` existiert (`grep -n "color-logo" app/globals.css`); `max-w-96` ist erlaubt (Größe, kein Abstand). `<span />` als Platzhalter nur, damit `justify-between` die Aktion rechts hält; ist es unnötig, weglassen.

- [ ] **Step 4:** Run `npx tsx --test tests/kapitel-aufschlag.test.ts`. Expected: PASS.

- [ ] **Step 5: Insel `components/kapitel-start/KapitelImBrowser.tsx`**

```tsx
"use client";

import { ViewTransition, type ReactNode } from "react";

import { KapitelAufschlag, type KapitelTexte } from "@/components/kapitel-start/KapitelAufschlag";
import { useStartSitzung } from "@/components/story/StartSitzung";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { kapitelAnzeige } from "@/lib/startseite-sitzung";

/**
 * Schaufenster oder eigenes Kapitel (Spec Dein Kapitel 4.3). Das statische HTML trägt das
 * Schaufenster; kommt die Sitzung mit einem Kapitel zurück, schlägt das Buch das eigene auf
 * (ViewTransition, bei reduzierter Bewegung sofort). Laden und Fehler lassen das Schaufenster stehen.
 */
export function KapitelImBrowser({ schaufenster, texte, sprache }: { schaufenster: ReactNode; texte: KapitelTexte; sprache: Sprache }) {
  const sitzung = useStartSitzung();
  const eigenes = sitzung ? kapitelAnzeige(sitzung.stand) : null;
  return (
    <>
      <ViewTransition key={eigenes ? "eigen" : "schaufenster"}>
        <div>{eigenes ? <KapitelAufschlag daten={eigenes} art="eigen" texte={texte} sprache={sprache} /> : schaufenster}</div>
      </ViewTransition>
      <p aria-live="polite" className="sr-only">
        {eigenes ? texte.kapitel.geladen : ""}
      </p>
    </>
  );
}
```

Hinweis: `ViewTransition` mit `key`-Wechsel ist das Muster aus der React-Doku für einen Austausch; prüfen in `node_modules/next/dist/docs/` (Suchwort `ViewTransition`), ob `experimental.viewTransition` in `next.config.ts` schon an ist (`app/[lang]/mitglied/page.tsx` nutzt es bereits).

- [ ] **Step 6: Sektion `components/story/DeinKapitel.tsx`** (Server)

```tsx
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";

import { KapitelAufschlag, kapitelTexte } from "@/components/kapitel-start/KapitelAufschlag";
import { KapitelImBrowser } from "@/components/kapitel-start/KapitelImBrowser";
import { Schlagwort } from "@/components/story/Schlagwort";
import { buttonKlassen } from "@/components/ui";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import type { KapitelDaten } from "@/lib/kapitel-start";
import { ladeSchaufensterKapitel } from "@/lib/query/kapitel-start";

/**
 * Sektion „Dein Kapitel“ (Spec Dein Kapitel, Nutzer 2026-10-09): nach der Abstimmung schließt sich
 * die Schleife beim Leser. Gäste sehen das öffentliche Kapitel des Betreibers, Mitglieder ihr eigenes.
 */
export async function DeinKapitel() {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  const texte = w.start.kapitel;
  const kapitelTexteFuerInsel = kapitelTexte(w);
  let daten: KapitelDaten | null;
  try {
    daten = await ladeSchaufensterKapitel();
  } catch (fehler) {
    unstable_rethrow(fehler);
    console.error("ladeSchaufensterKapitel fehlgeschlagen", fehler);
    daten = null;
  }
  const schaufenster = daten ? (
    <KapitelAufschlag daten={daten} art="schaufenster" texte={kapitelTexteFuerInsel} sprache={sprache} />
  ) : (
    <div className="flex flex-col items-start gap-6">
      <p className="max-w-[48ch] text-body text-text-muted text-pretty">{texte.satzGast}</p>
      <Link prefetch={false} href="/registrieren" className={buttonKlassen("primary")}>
        {texte.kontoAnlegen}
      </Link>
    </div>
  );
  return (
    <section
      id="kapitel"
      aria-labelledby="kapitel-titel"
      data-story="kapitel"
      className="relative isolate overflow-x-clip px-4 pt-24 pb-32 sm:px-8 sm:pt-32 sm:pb-48"
    >
      <Schlagwort satz={texte.schlagwort} ton="gruen" />
      <div className="mx-auto flex w-full max-w-360 flex-col gap-12">
        <h2 id="kapitel-titel" className="font-buch text-kapitel text-text max-md:text-center">
          {texte.vor} <em className="farbverlauf hand-betont">{texte.betont}</em>
        </h2>
        <KapitelImBrowser schaufenster={schaufenster} texte={kapitelTexteFuerInsel} sprache={sprache} />
      </div>
    </section>
  );
}
```

Den Ton des Schlagworts gegen die Nachbarn prüfen: Grün und Lila wechseln sich ab (`grep -n "Schlagwort" components/story/*.tsx`); die Sektion davor ist die Abstimmung, danach der Katalog. Passenden Ton wählen.

- [ ] **Step 7: Einhängen.** In `app/[lang]/page.tsx`: `import { DeinKapitel } from "@/components/story/DeinKapitel";` und nach `<Abstimmung />` die Zeile `<DeinKapitel />` mit Kommentar `{/* Nach der Abstimmung schließt sich die Schleife bei dir (Nutzer 2026-10-09). */}`.

- [ ] **Step 8: Listen-Tests.** `grep -n "components/story/NeuesterEintrag.tsx\|components/review/BuchDoppelseite.tsx" tests/i18n-literale.test.ts tests/hover.test.ts`: führen die Tests Dateilisten, die drei neuen Dateien dort eintragen.

- [ ] **Step 9: Alles prüfen**

Run: `npx tsc --noEmit && npx eslint components/kapitel-start components/story/DeinKapitel.tsx "app/[lang]/page.tsx" && npm test && npm run farben`
Expected: alles grün, `tests/marke.test.ts` eingeschlossen (`font-hand` steht mit `text-notiz` bzw. `text-vermerk`).

- [ ] **Step 10: Commit**

```bash
git add components/kapitel-start components/story/DeinKapitel.tsx "app/[lang]/page.tsx" tests/
git commit -m "feat: Startseiten-Sektion Dein Kapitel mit Schaufenster und eigenem Kapitel"
```

---

### Task 4 (Strang C): Bewegung

**Files:**
- Create: `components/story/bewegung/kapitel.ts`
- Modify: `components/story/bewegung/start.ts` (Import und Eintrag in `SCROLL_CHOREOGRAFIEN` nach `abstimmung`)
- Test: `tests/bewegung.test.ts` (anhängen)

**Interfaces:**
- Consumes: Markup-Vertrag aus Task 3 (`data-story="kapitel"`, `"kapitel-name"`, `"kapitel-wort"`); `SCHREIBEN_AB`, `SCHREIBEN_BIS` aus `./schreiben`; Typ `Choreografie` aus `./typen`.
- Produces: `export const kapitel: Choreografie`.

- [ ] **Step 1: Failing test** an `tests/bewegung.test.ts` anhängen (die Datei hat schon `bewegung(datei)` und `readFileSync`)

```ts
test("Kapitel: Name deckt sich auf, Wörter schreiben sich, nur getauschte Knoten bleiben stehen", () => {
  const ablauf = bewegung("kapitel.ts");
  assert.match(ablauf, /'\[data-story="kapitel"\]'/);
  assert.match(ablauf, /SCHREIBEN_AB/);
  assert.match(ablauf, /isConnected/);
  assert.match(ablauf, /onEnter/);
  assert.match(ablauf, /once: true/);
  assert.doesNotMatch(ablauf, /\b(width|height|top|left)\s*:/);
  const start = bewegung("start.ts");
  assert.match(start, /import \{ kapitel \} from "\.\/kapitel"/);
  assert.match(start, /abstimmung,\n\s*kapitel,/);
});
```

- [ ] **Step 2:** Run `npx tsx --test tests/bewegung.test.ts`. Expected: FAIL (Datei fehlt).

- [ ] **Step 3: `components/story/bewegung/kapitel.ts`**

```ts
import { SCHREIBEN_AB, SCHREIBEN_BIS } from "./schreiben";
import type { Choreografie } from "./typen";

/** Gedruckt deckt sich von links auf; geschrieben wird nur die Handschrift. */
const NAME_AB = { clipPath: "inset(-10% 100% -10% 0%)" };
const NAME_BIS = { clipPath: "inset(-10% 0% -10% 0%)", duration: 0.9, ease: "power3.out", clearProps: "clipPath" };

/**
 * Sektion „Dein Kapitel“ (Spec Dein Kapitel 5): der Name deckt sich auf, die Wörter der Randnotizen
 * schreiben sich nacheinander; das Netz zeichnet sich per CSS ein ([data-netz-erscheinen]).
 * Die Insel kann das Schaufenster jederzeit gegen das eigene Kapitel tauschen. Deshalb werden die
 * Ausgangszustände nur an den Knoten gesetzt, die beim Start da sind, und im onEnter nur die
 * animiert, die noch im Dokument hängen. Getauschte Knoten kommen ohne Clip und stehen sofort.
 */
export const kapitel: Choreografie = ({ gsap, ScrollTrigger }) => {
  const sektion = document.querySelector<HTMLElement>('[data-story="kapitel"]');
  if (!sektion) return;
  const name = gsap.utils.toArray<HTMLElement>('[data-story="kapitel-name"]', sektion);
  const woerter = gsap.utils.toArray<HTMLElement>('[data-story="kapitel-wort"]', sektion);
  gsap.set(name, NAME_AB);
  gsap.set(woerter, SCHREIBEN_AB);

  const ausloeser = ScrollTrigger.create({
    trigger: sektion,
    start: "top 70%",
    once: true,
    onEnter: () => {
      const n = name.filter((el) => el.isConnected);
      const w = woerter.filter((el) => el.isConnected);
      const ablauf = gsap.timeline();
      if (n.length) ablauf.fromTo(n, NAME_AB, NAME_BIS);
      if (w.length) ablauf.fromTo(w, SCHREIBEN_AB, { ...SCHREIBEN_BIS, stagger: 0.2 }, n.length ? "-=0.4" : 0);
    },
  });

  return () => {
    ausloeser.kill();
    gsap.set([...name, ...woerter], { clearProps: "clipPath" });
  };
};
```

Prüfen: Bekommt eine Choreografie in diesem Projekt `ScrollTrigger` im Werkzeug (`components/story/bewegung/typen.ts`: ja, `Werkzeug.ScrollTrigger`)? Lädt `start.ts` die Module bei reduzierter Bewegung gar nicht (Regel 7)? Dann reicht die Choreografie ohne eigene Abfrage von `prefers-reduced-motion`.

- [ ] **Step 4: Registrieren.** In `components/story/bewegung/start.ts` `import { kapitel } from "./kapitel";` zu den anderen Imports und in `SCROLL_CHOREOGRAFIEN` direkt nach `abstimmung,` die Zeile `kapitel,`.

- [ ] **Step 5:** Run `npx tsx --test tests/bewegung.test.ts && npx tsc --noEmit && npx eslint components/story/bewegung && npm test`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/story/bewegung/kapitel.ts components/story/bewegung/start.ts tests/bewegung.test.ts
git commit -m "feat: Bewegung für Dein Kapitel (Name deckt auf, Randnotizen schreiben)"
```

---

### Task 5: Zusammenführen, Gesamtprüfung, live

**Files:** keine neuen; `HANDOFF.md` aktualisieren.

- [ ] **Step 1:** Stränge A, B, C in `main` mergen (Reihenfolge A, B, C), nach jedem Merge `npx tsc --noEmit && npm test`.
- [ ] **Step 2:** Gesamtprüfung: `npx tsc --noEmit && npx eslint . && npm test && npm run farben`. Expected: alles grün.
- [ ] **Step 3:** `git push origin main` (Dauerregel: Push ist Live-Gang). Deploy einmal per `npx wrangler deployments list` abwarten, nicht pollen.
- [ ] **Step 4: Live prüfen** per Browser-MCP auf `https://cn-medcan.w-helwich.workers.dev/` (Tab neu laden, alte Kopie meiden):
  - als Mitglied 1418 px dunkel: eigenes Kapitel (Name, drei Notizen, Netz, Zuletzt, „Zu deinem Kapitel“), Umblättern vom Schaufenster sichtbar, Bewegung beim Hineinscrollen;
  - hell (`data-theme="light"`);
  - 494 px oder schmaler: eine Spalte, `document.documentElement.scrollWidth <= innerWidth`;
  - als Gast (abmelden oder Inkognito mit Gate-Cookie): Schaufenster „GrünesBuch“ mit Vermerk und „Konto anlegen“;
  - Konsole ohne Fehler; Stimmzettel und Empfehlungen funktionieren weiter.
- [ ] **Step 5:** `HANDOFF.md` aktualisieren (was live ist, was nicht gesehen wurde), committen, pushen.
