# Profil am Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kopfleiste mit Fläche und Linie auf allen Seiten außer über dem Hero der Startseite; Profil ab 1080 px mit fester Identitätsspalte links und Reitern rechts, ohne Hintergrundwort und Freisteller.

**Architecture:** CSS-Zustand des Kopfs über ein Attribut `data-start`, das `KopfZustand` nur auf der Startseite setzt. Das Profil bekommt einen Rahmen `ProfilRahmen` (Seitenleiste plus Inhalt), eine Seitenleiste `ProfilSeitenleiste` und eine Reiterleiste `ProfilReiter`. Die Seite rendert über `?ansicht=` nur den gewählten Reiter (weniger Abfragen, weniger CPU). Die vorhandenen Felder (`Feld`, `FeldKopf`, Auswertungs-Komponenten) bleiben und werden neu angeordnet.

**Tech Stack:** Next.js 16 App Router (Server Components, `searchParams` als Promise), Tailwind v4, `node:test` über `tsx --test` mit `react-dom/server`.

**Spec:** `docs/superpowers/specs/2026-10-13-profil-desktop-design.md`

## Global Constraints

- Kein `next dev`, kein lokaler Build. Prüfweg: `npm test`, `npm run typecheck`, `npx eslint <dateien>`, pushen, Workers Build (~12 min) abwarten, live per Browser-MCP prüfen (Memory `live-statt-dev`). Nach Deploy die Seite mit Query frisch laden (`/profil?f=<n>`), der Router-Cache zeigt sonst den alten Stand.
- Design-Skills laden, bevor UI gebaut wird: `frontend-design`, `better-layout`, `better-typography`; Regelwerk `ui-design-engine` (8px-Raster, Tokens, keine arbitrary Abstände, Rasterbreite `max-w-360`). Abschluss: `critique-composition`, `critique-visual-hierarchy`, `better-interface` an Live-Screenshots.
- Sichtbare Texte nur aus `lib/i18n/de.ts` und `lib/i18n/en.ts`.
- Zeilenenden der berührten Datei beibehalten. Commits in Prosa mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- HWG: Wirkung bleibt privat; öffentliche Profile zeigen keine Auswertungen.
- Parallel zu Teilprojekt A: Feld „Deine Hersteller“ nur verschieben, nicht ändern. A benennt es in `Lieblingsvertreiber` um; wer zuletzt merged, gleicht Import und Feld-Id an.

## Review Focus

- Unbekannter oder doppelter `?ansicht=`-Wert (`?ansicht=xyz`, `?ansicht=a&ansicht=b`): fällt auf Übersicht zurück, kein 500. Test in Task 3.
- Mitglied ohne Bewertung: Übersicht zeigt Leersatz und „Blüte bewerten“, keine leeren Kästen; Reiter Vertreiber zeigt den Leersatz. Test in Task 3.
- Sehr langer Anzeigename (40 Zeichen ohne Leerzeichen) in der 20rem-Spalte: bricht um, kein Querscroll. Test in Task 2.
- Öffentliches Profil ohne öffentliche Bewertungen: Reiter Bewertungen entfällt nicht still, sondern zeigt `netzLeer`/Leersatz; private Reiter fehlen ganz. Test in Task 4.
- Seitenwechsel von `/` auf `/profil` ohne Scroll: Kopf hat sofort Fläche (Attribut wird beim Pfadwechsel neu gesetzt). Test in Task 1.

---

## File Structure

- `components/layout/KopfZustand.tsx`: setzt `data-start` am Kopf nur auf der Startseite.
- `app/globals.css` (Abschnitt `.kopf`): Fläche und Linie als Grundzustand, Durchsicht nur mit `data-start`.
- `components/profil/ProfilRahmen.tsx` (neu): Rahmen `max-w-360`, zwei Spalten ab 1080 px.
- `components/profil/ProfilSeitenleiste.tsx` (neu): Identität, Zahlen, Aromen, Aktionen.
- `components/profil/ProfilReiter.tsx` (neu): Reiter als Links mit `aria-current`.
- `lib/profil-ansicht.ts` (neu): `PROFIL_ANSICHTEN`, `ansichtAus(searchParams)`, `liebsteAromen(geschmack, n)`.
- `components/kapitel/Randnotizen.tsx`: Variante `kompakt` (eigenes 2×2-Raster, kein Subgrid).
- `components/kapitel/FeldKopf.tsx`, `components/kapitel/Feld.tsx`: Größe `klein` für Felder in Reitern.
- `app/[lang]/profil/page.tsx`: neue Anordnung.
- `app/[lang]/profil/[kurzId]/page.tsx`: dieselbe Seitenleiste und Reiter, nur öffentliche Inhalte.

---

### Task 1: Kopfleiste mit Fläche und Linie

**Files:**
- Modify: `components/layout/KopfZustand.tsx`, `app/globals.css` (Block `.kopf`, Zeilen ~1204-1240)
- Test: `tests/kopf-flaeche.test.ts`

**Interfaces:**
- Produces: Attribut `data-start` am `[data-kopf]`-Element, gesetzt genau dann, wenn der Pfad die Startseite ist (`/` oder `/<sprache>` mit Sprache aus `lib/i18n/sprache-kern.ts`).
- Produces: Hilfsfunktion `istStartseite(pfad: string): boolean` in `components/layout/KopfZustand.tsx` exportiert.

- [ ] **Step 1: Write the failing test**

`tests/kopf-flaeche.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { istStartseite } from "@/components/layout/KopfZustand";

test("istStartseite: nur / und die Sprachwurzel", () => {
  assert.equal(istStartseite("/"), true);
  assert.equal(istStartseite("/en"), true);
  assert.equal(istStartseite("/en/"), true);
  assert.equal(istStartseite("/profil"), false);
  assert.equal(istStartseite("/en/profil"), false);
});

test("Kopf: Fläche und Linie als Grundzustand, Durchsicht nur auf der Startseite oben", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const block = css.slice(css.indexOf(".kopf {"), css.indexOf(".kopf {") + 600);
  assert.match(block, /background:\s*var\(--color-surface-raised\)/);
  assert.match(block, /border-bottom:\s*1px solid var\(--color-border\)/);
  assert.match(css, /\.kopf\[data-start\]:not\(\[data-gescrollt\]\)/);
});

test("KopfZustand setzt data-start bei jedem Pfadwechsel neu (Review Focus)", () => {
  const q = readFileSync("components/layout/KopfZustand.tsx", "utf8");
  assert.match(q, /toggleAttribute\("data-start", istStartseite\(pfad\)\)/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/kopf-flaeche.test.ts`
Expected: FAIL (`istStartseite` nicht exportiert).

- [ ] **Step 3: Implement**

In `components/layout/KopfZustand.tsx` oberhalb der Komponente (die Sprachen aus `lib/i18n/sprache-kern.ts` importieren; heißt die Liste dort anders, den echten Namen nehmen):

```ts
import { SPRACHEN } from "@/lib/i18n/sprache-kern";

/** Startseite: dort schwebt der Kopf oben durchsichtig über dem Hero (Spec Profil Desktop 2026-10-13). */
export function istStartseite(pfad: string): boolean {
  const teile = pfad.split("/").filter(Boolean);
  return teile.length === 0 || (teile.length === 1 && (SPRACHEN as readonly string[]).includes(teile[0]));
}
```

Im Effekt direkt nach `if (!kopf) return;`: `kopf.toggleAttribute("data-start", istStartseite(pfad));`. Den Kommentar der Komponente um „und markiert die Startseite (data-start)“ ergänzen.

In `app/globals.css` den Block `.kopf { … }` bis vor `.kopf[data-gescrollt]` ersetzen durch:

```css
/* Kopf (Nutzer 2026-10-13): überall Fläche und Linie, damit er am PC nicht verloren
   auf den Rasterlinien liegt. Nur auf der Startseite oben durchsichtig über dem Hero. */
.kopf {
  --kopf-deckkraft: 78%;
  --kopf-weich: blur(10px) saturate(1.2);
  background: var(--color-surface-raised);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  transition:
    background-color 0.35s var(--ease-standard),
    border-color 0.35s var(--ease-standard),
    backdrop-filter 0.35s var(--ease-standard);
}

.kopf[data-start]:not([data-gescrollt]) {
  background: transparent;
  border-bottom-color: transparent;
  box-shadow: none;
}
```

Die bestehenden Regeln `.kopf[data-gescrollt]`, `:root[data-theme="light"] .kopf` und die `prefers-color-scheme: light`-Regel auf `.kopf[data-start]` einschränken (Selektoren zu `.kopf[data-start][data-gescrollt]`, `:root[data-theme="light"] .kopf[data-start]`, `:root:not([data-theme="dark"]) .kopf[data-start]`), damit sie nur die Startseite betreffen. `.buehne-dunkel` bleibt unverändert (nur Startseite).

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/kopf-flaeche.test.ts`, `npm test`, `npm run typecheck`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add components/layout/KopfZustand.tsx app/globals.css tests/kopf-flaeche.test.ts
git commit -m "feat: Kopfleiste mit Flaeche und Linie, durchsichtig nur ueber dem Hero der Startseite"
```

---

### Task 2: Seitenleiste, Reiter und Rahmen

**Files:**
- Create: `lib/profil-ansicht.ts`, `components/profil/ProfilRahmen.tsx`, `components/profil/ProfilSeitenleiste.tsx`, `components/profil/ProfilReiter.tsx`
- Modify: `components/kapitel/Randnotizen.tsx` (Prop `kompakt`), `lib/i18n/de.ts`, `lib/i18n/en.ts` (Abschnitt `profil.seite`)
- Test: `tests/profil-seitenleiste.test.ts`

**Interfaces:**
- Consumes: `Avatar` (`components/ui`, Größe `lg` = 128 px), `Badge`, `buttonKlassen`, `Randnotizen`, `Randnotiz`, `Geschmack` (`lib/profil-typen.ts`), `GESCHMACKS_KATEGORIEN` (`lib/profil.ts` oder `db/enums.ts`, dort nachsehen).
- Produces:
  - `export const PROFIL_ANSICHTEN = ["uebersicht", "aromen", "bewertungen", "vertreiber"] as const; export type ProfilAnsicht = (typeof PROFIL_ANSICHTEN)[number];`
  - `ansichtAus(roh: string | string[] | undefined): ProfilAnsicht`
  - `liebsteAromen(geschmack: Geschmack, n = 2): GeschmacksKategorie[]` (positive Werte absteigend, höchstens n)
  - `ProfilRahmen({ seitenleiste, reiter, children })`
  - `ProfilSeitenleiste({ name, avatarId, rolle, seit, notizen, aromen, aktionen, texte, sprache })` mit `rolle: "betreiber" | "mitglied" | null`, `seit: Date | null`, `notizen: readonly Randnotiz[]`, `aromen: readonly string[]` (schon übersetzte Namen), `aktionen: readonly { href: string; text: string; art: "primary" | "secondary" }[]`
  - `ProfilReiter({ basis, aktiv, reiter, beschriftung })` mit `reiter: readonly { ansicht: ProfilAnsicht; text: string }[]`, `basis: string` (z. B. `/profil`); Links `basis` für Übersicht, sonst `${basis}?ansicht=<ansicht>`
  - `Randnotizen` Prop `kompakt?: boolean`

- [ ] **Step 1: Write the failing test**

`tests/profil-seitenleiste.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { ProfilSeitenleiste } from "@/components/profil/ProfilSeitenleiste";
import { de } from "@/lib/i18n/de";
import { ansichtAus, liebsteAromen } from "@/lib/profil-ansicht";
import { leereProfilWerte } from "@/lib/profil";

const leererGeschmack = () => leereProfilWerte().geschmack;

test("ansichtAus: bekannte Werte, sonst Übersicht (Review Focus)", () => {
  assert.equal(ansichtAus("aromen"), "aromen");
  assert.equal(ansichtAus("xyz"), "uebersicht");
  assert.equal(ansichtAus(["aromen", "bewertungen"]), "aromen");
  assert.equal(ansichtAus(undefined), "uebersicht");
});

test("liebsteAromen: nur positive, stärkste zuerst", () => {
  const g = { ...leererGeschmack(), ZITRUS: 0.4, ERDIG: 1, DIESEL: -1 };
  assert.deepEqual(liebsteAromen(g), ["ERDIG", "ZITRUS"]);
  assert.deepEqual(liebsteAromen(leererGeschmack()), []);
});

const leiste = (name: string) =>
  renderToStaticMarkup(
    createElement(ProfilSeitenleiste, {
      name,
      avatarId: null,
      rolle: "betreiber",
      seit: new Date("2026-09-01T00:00:00Z"),
      notizen: [{ zahl: "6", wort: "bewertet", satz: "6 Bewertungen" }],
      aromen: ["Erdig", "Zitrus"],
      aktionen: [{ href: "/blueten", text: "Blüte bewerten", art: "primary" }],
      texte: de.profil.seite,
      sprache: "de",
    }),
  );

test("Seitenleiste: Name als h1, Rolle, dabei seit, Zahlen, Aromen, Aktion", () => {
  const html = leiste("GrünesBuch");
  assert.match(html, /<h1[^>]*>GrünesBuch<\/h1>/);
  assert.match(html, /Betreiber/);
  assert.match(html, /dabei seit September 2026/);
  assert.match(html, /6 Bewertungen/);
  assert.match(html, /Erdig/);
  assert.match(html, /href="\/blueten"/);
  assert.doesNotMatch(html, /text-kulisse|kapitel-tiefe/);
});

test("Seitenleiste: langer Name bricht um (Review Focus)", () => {
  assert.match(leiste("A".repeat(40)), /<h1[^>]*wrap-break-word/);
});

test("Reiter: Links, aktiver mit aria-current, Übersicht ohne Query", () => {
  const html = renderToStaticMarkup(
    createElement(ProfilReiter, {
      basis: "/profil",
      aktiv: "aromen",
      beschriftung: "Bereiche des Profils",
      reiter: [
        { ansicht: "uebersicht", text: "Übersicht" },
        { ansicht: "aromen", text: "Aromen" },
      ],
    }),
  );
  assert.match(html, /<nav[^>]*aria-label="Bereiche des Profils"/);
  assert.match(html, /href="\/profil"[^>]*>Übersicht/);
  assert.match(html, /href="\/profil\?ansicht=aromen"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/profil\?ansicht=aromen"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/profil-seitenleiste.test.ts`
Expected: FAIL (Module fehlen).

- [ ] **Step 3: Implement**

`lib/profil-ansicht.ts`:

```ts
import type { GeschmacksKategorie } from "@/db/enums";
import type { Geschmack } from "@/lib/profil-typen";

export const PROFIL_ANSICHTEN = ["uebersicht", "aromen", "bewertungen", "vertreiber"] as const;
export type ProfilAnsicht = (typeof PROFIL_ANSICHTEN)[number];

/** Reiter aus `?ansicht=`; Unbekanntes oder Fehlendes zeigt die Übersicht, Mehrfachwerte den ersten. */
export function ansichtAus(roh: string | string[] | undefined): ProfilAnsicht {
  const wert = Array.isArray(roh) ? roh[0] : roh;
  return (PROFIL_ANSICHTEN as readonly string[]).includes(wert ?? "") ? (wert as ProfilAnsicht) : "uebersicht";
}

/** Die stärksten positiven Geschmacksachsen für die Chips der Seitenleiste. */
export function liebsteAromen(geschmack: Geschmack, n = 2): GeschmacksKategorie[] {
  return (Object.entries(geschmack) as [GeschmacksKategorie, number][])
    .filter(([, wert]) => wert > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([achse]) => achse);
}
```

(Falls `GeschmacksKategorie` nicht in `db/enums.ts` liegt: `grep -rn "export type GeschmacksKategorie" db lib`.)

i18n `profil.seite` (de):

```ts
    seite: {
      betreiber: "Betreiber",
      mitglied: "Mitglied",
      dabeiSeit: "dabei seit {datum}",
      aromen: "Mag am liebsten",
      reiterLeiste: "Bereiche des Profils",
      zahlen: "Deine Zahlen",
      reiter: { uebersicht: "Übersicht", aromen: "Aromen", bewertungen: "Bewertungen", vertreiber: "Vertreiber" },
      bewerten: "Blüte bewerten",
      bearbeiten: "Profil bearbeiten",
    },
```

(en: `"Operator"`, `"Member"`, `"member since {datum}"`, `"Likes most"`, `"Profile sections"`, `"Your numbers"`, `{ uebersicht: "Overview", aromen: "Aromas", bewertungen: "Ratings", vertreiber: "Distributors" }`, `"Rate a flower"`, `"Edit profile"`.)

`components/profil/ProfilSeitenleiste.tsx`:

```tsx
import Link from "next/link";

import { Randnotizen, type Randnotiz } from "@/components/kapitel/Randnotizen";
import { Avatar, Badge, buttonKlassen } from "@/components/ui";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  name: string;
  avatarId: string | null;
  rolle: "betreiber" | "mitglied" | null;
  seit: Date | null;
  notizen: readonly Randnotiz[];
  aromen: readonly string[];
  aktionen: readonly { href: string; text: string; art: "primary" | "secondary" }[];
  texte: Woerterbuch["profil"]["seite"];
  sprache: Sprache;
};

const MONAT = { de: "de-DE", en: "en-GB" } as const;

/**
 * Identität des Profils (Spec Profil Desktop 2026-10-13): ab 1080 px eine feste Spalte links,
 * darunter ein Kopfblock. Kein Hintergrundwort, keine Freisteller-Blüte.
 */
export function ProfilSeitenleiste({ name, avatarId, rolle, seit, notizen, aromen, aktionen, texte, sprache }: Props) {
  const datum = seit ? new Intl.DateTimeFormat(MONAT[sprache], { month: "long", year: "numeric", timeZone: "UTC" }).format(seit) : null;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-6 min-[1080px]:flex-col min-[1080px]:items-start">
        <Avatar name={name} bildId={avatarId} groesse="lg" className="max-[1079px]:size-24 shrink-0" />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-buch text-h1 font-normal text-text text-balance wrap-break-word">{name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {rolle ? <Badge variante={rolle === "betreiber" ? "accent" : "neutral"}>{texte[rolle]}</Badge> : null}
            {datum ? <span className="text-small text-text-muted">{t(texte.dabeiSeit, { datum })}</span> : null}
          </div>
        </div>
      </div>
      <Randnotizen notizen={notizen} beschriftung={texte.zahlen} kompakt />
      {aromen.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-small text-text-muted">{texte.aromen}</p>
          <ul className="flex flex-wrap gap-2">
            {aromen.map((a) => (
              <li key={a}>
                <Badge variante="neutral">{a}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {aktionen.length > 0 ? (
        <div className="flex flex-wrap gap-4 min-[1080px]:flex-col min-[1080px]:items-stretch">
          {aktionen.map((a) => (
            <Link key={a.href} prefetch={false} href={a.href} className={buttonKlassen(a.art, "md")}>
              {a.text}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
```

(`Badge` kennt `neutral | success | warning | danger | accent`; `Avatar` nimmt `className`.)

`components/profil/ProfilReiter.tsx`:

```tsx
import Link from "next/link";

import type { ProfilAnsicht } from "@/lib/profil-ansicht";

type Props = { basis: string; aktiv: ProfilAnsicht; reiter: readonly { ansicht: ProfilAnsicht; text: string }[]; beschriftung: string };

/** Reiter als Links (Spec Profil Desktop): ohne JavaScript bedienbar, der Server rendert nur den gewählten. */
export function ProfilReiter({ basis, aktiv, reiter, beschriftung }: Props) {
  return (
    <nav aria-label={beschriftung} className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex min-w-max gap-2 border-b border-border">
        {reiter.map((r) => {
          const href = r.ansicht === "uebersicht" ? basis : `${basis}?ansicht=${r.ansicht}`;
          const ist = r.ansicht === aktiv;
          return (
            <li key={r.ansicht}>
              <Link
                prefetch={false}
                href={href}
                scroll={false}
                aria-current={ist ? "page" : undefined}
                className={`inline-flex min-h-11 items-center border-b-2 px-4 text-small font-medium transition-colors duration-fast ${
                  ist ? "border-accent text-text" : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {r.text}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

`components/profil/ProfilRahmen.tsx`:

```tsx
import type { ReactNode } from "react";

/**
 * Profil ab 1080 px (Spec Profil Desktop): links die Identität, fest beim Scrollen, rechts Reiter und
 * Inhalt. Gleiche Breite wie die Kopfleiste (max-w-360). Darunter einspaltig.
 */
export function ProfilRahmen({ seitenleiste, reiter, children }: { seitenleiste: ReactNode; reiter: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-8 px-4 py-10 sm:px-8 min-[1080px]:grid-cols-[20rem_minmax(0,1fr)] min-[1080px]:gap-12 min-[1080px]:py-16">
      <aside className="min-[1080px]:sticky min-[1080px]:top-[calc(var(--kopf-h,4rem)+2rem)] min-[1080px]:self-start">{seitenleiste}</aside>
      <div className="flex min-w-0 flex-col gap-8">
        {reiter}
        {children}
      </div>
    </div>
  );
}
```

`components/kapitel/Randnotizen.tsx`: Prop `kompakt?: boolean`. Mit `kompakt` statt der Subgrid-Klassen am `ul` `grid grid-cols-2 gap-x-6 gap-y-6 max-[1079px]:grid-cols-4` und am `li` `flex min-w-0 flex-col gap-1 @container` (ohne `col-span-*` und `px-*`), Zahl `text-h2` statt `text-display`. Der Rest (sr-only-Satz, aria-hidden, Animation) bleibt.

- [ ] **Step 4: Run tests**

Run: `npx tsx --test tests/profil-seitenleiste.test.ts`, `npm test`, `npm run typecheck`, `npx eslint components lib --quiet`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add -A components/profil components/kapitel/Randnotizen.tsx lib/profil-ansicht.ts lib/i18n/de.ts lib/i18n/en.ts tests/profil-seitenleiste.test.ts
git commit -m "feat: Profil-Seitenleiste, Reiter und Rahmen fuer den Desktop"
```

---

### Task 3: Eigenes Profil neu anordnen

**Files:**
- Modify: `app/[lang]/profil/page.tsx`, `components/kapitel/FeldKopf.tsx`, `components/kapitel/Feld.tsx`, `components/profil/Aktivitaet.tsx` (kompakte Reihe), `lib/profil-dashboard.ts` (`monatsReihe` ab erster Bewertung)
- Modify tests: `tests/profil-seite.test.ts`, `tests/profil-reihenfolge.test.ts`
- Test: `tests/profil-ansichten.test.ts`

**Interfaces:**
- Consumes: alles aus Task 2; vorhandene Ladefunktionen der Seite (`profilLaden`, `zeilenLaden`, `textLaden`, `ladeLieblingshersteller`, `ladeEmpfehlungen`).
- Produces: `Feld` Props `groesse?: "gross" | "klein"` (Vorgabe `gross`, an `FeldKopf` weitergereicht: `klein` setzt `text-h2` statt `text-display`), `rahmen?: "raster" | "karte"` (Vorgabe `raster` = heutige Kanten `border-t border-l`; `karte` = `rounded-lg border border-border`), `spalten?: FeldSpalten` (jetzt optional, siehe unten). `monatsReihe(daten, heute, sprache, { abErster?: boolean })`: mit `abErster` beginnt die Reihe beim Monat der ersten Bewertung (höchstens 12 Monate).

- [ ] **Step 1: Write the failing tests**

`tests/profil-ansichten.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { monatsReihe } from "@/lib/profil-dashboard";

const q = () => readFileSync("app/[lang]/profil/page.tsx", "utf8");

test("Profilseite: Rahmen, Seitenleiste, Reiter, kein Kapitelkopf mehr", () => {
  const s = q();
  for (const teil of ["<ProfilRahmen", "<ProfilSeitenleiste", "<ProfilReiter", "ansichtAus("]) assert.ok(s.includes(teil), teil);
  assert.doesNotMatch(s, /<Kapitelkopf|<KapitelRaster|KopfBild/);
});

test("Profilseite: je Ansicht nur deren Reihen", () => {
  const s = q();
  assert.match(s, /ansicht === "uebersicht"/);
  assert.match(s, /ansicht === "aromen"/);
  assert.match(s, /ansicht === "bewertungen"/);
  assert.match(s, /ansicht === "vertreiber"/);
});

test("Spur kompakt: beginnt beim Monat der ersten Bewertung", () => {
  const heute = new Date("2026-10-13T00:00:00Z");
  const reihe = monatsReihe([new Date("2026-09-02T00:00:00Z"), new Date("2026-10-01T00:00:00Z")], heute, "de", { abErster: true });
  assert.equal(reihe.length, 2);
  assert.deepEqual(reihe.map((m) => m.anzahl), [1, 1]);
});

test("Spur kompakt ohne Bewertung: leere Reihe, kein Fehler (Review Focus)", () => {
  assert.deepEqual(monatsReihe([], new Date("2026-10-13T00:00:00Z"), "de", { abErster: true }), []);
});
```

(Den Feldnamen für die Zahl je Monat in `monatsReihe` vorher nachsehen: `grep -n "export function monatsReihe" -A20 lib/profil-dashboard.ts`; heißt er nicht `anzahl`, im Test anpassen.)

In `tests/profil-seite.test.ts` die Liste der erwarteten Teile ersetzen durch `["<ProfilRahmen", "<ProfilSeitenleiste", "<ProfilReiter", "<ProfilNetz", "<EmpfehlungsListe", "<Aktivitaet", "<NotenVerteilung", "<TopFlop", "<Lieblingshersteller", "<CommunityVergleich", "<Schnitte", "<BewertungsRegister"]`. `tests/profil-reihenfolge.test.ts` an die neue Reihenfolge der Übersicht anpassen (Netz, Top und Flop, Spur, Noten) oder, wenn er die alte Gesamtreihenfolge prüft, auf die Reihenfolge innerhalb jeder Ansicht umschreiben.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx tsx --test tests/profil-ansichten.test.ts tests/profil-seite.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`components/kapitel/Feld.tsx`: Prop `groesse?: "gross" | "klein"`, an `<FeldKopf … groesse={groesse} />`. `components/kapitel/FeldKopf.tsx`: Prop `groesse: "gross" | "klein" = "gross"`, `h2`-Klasse `${groesse === "klein" ? "text-h2" : "text-display"}`. Bestehenden `Feld`-Test um einen Fall `groesse: "klein"` ergänzen (`/<h2[^>]*text-h2/`).

`lib/profil-dashboard.ts` `monatsReihe`: vierter Parameter `optionen: { abErster?: boolean } = {}`; mit `abErster` und leerer Liste `[]` zurückgeben, sonst Startmonat = max(Monat der frühesten Bewertung, heute minus 11 Monate).

`app/[lang]/profil/page.tsx` neu strukturieren:

```tsx
export default async function ProfilPage({ searchParams }: { searchParams: Promise<SuchParameter> }) {
  const mitglied = await aktuellesMitglied();
  const { w, sprache } = await textLaden();
  if (!mitglied) redirect("/anmelden?weiter=%2Fprofil");
  const parameter = await searchParams;
  const ansicht = ansichtAus(parameter.ansicht);
  const register = registerParameter(parameter);
  const id = mitglied.mitgliedId;
  const s = w.profil.seite;

  return (
    <ProfilRahmen
      seitenleiste={
        <Suspense fallback={<ProfilSeitenleiste name={mitglied.anzeigename} avatarId={mitglied.avatarId} rolle={null} seit={mitglied.erstelltAm} notizen={[]} aromen={[]} aktionen={[]} texte={s} sprache={sprache} />}>
          <Seitenleiste id={id} />
        </Suspense>
      }
      reiter={
        <ProfilReiter
          basis="/profil"
          aktiv={ansicht}
          beschriftung={s.reiterLeiste}
          reiter={PROFIL_ANSICHTEN.map((a) => ({ ansicht: a, text: s.reiter[a] }))}
        />
      }
    >
      {ansicht === "uebersicht" ? (
        <Suspense fallback={<FeldSkelett spalten={10} hoehe="gross" />}>
          <AnsichtUebersicht id={id} />
        </Suspense>
      ) : null}
      {ansicht === "aromen" ? (
        <Suspense fallback={<FeldSkelett spalten={10} hoehe="gross" />}>
          <ReiheNetz id={id} />
          <ReiheVorschlaege id={id} />
        </Suspense>
      ) : null}
      {ansicht === "bewertungen" ? (
        <Suspense fallback={<FeldSkelett spalten={10} hoehe="gross" />}>
          <ReiheRegister id={id} register={register} />
        </Suspense>
      ) : null}
      {ansicht === "vertreiber" ? (
        <Suspense fallback={<FeldSkelett spalten={10} />}>
          <AnsichtVertreiber id={id} />
        </Suspense>
      ) : null}
    </ProfilRahmen>
  );
}
```

`Seitenleiste` (async, in derselben Datei) baut aus `aktuellesMitglied()`, `zeilenLaden(id)` und `profilLaden(id)`: `notizen` wie bisher in `Notizen` (`profilNotizen(...)`), `aromen = liebsteAromen((profil?.werte ?? leereProfilWerte()).geschmack).map((a) => w.label.geschmack[a])`, `rolle = mitglied.rolle === "ADMIN" ? "betreiber" : "mitglied"`, `aktionen = [{ href: "/blueten", text: s.bewerten, art: "primary" }, { href: "/mitglied", text: s.bearbeiten, art: "secondary" }]`.

Die bisherigen Funktionen bleiben und bekommen ihre Raster-Hülle von den Ansichten:
- `AnsichtUebersicht`: `<div className="grid grid-cols-1 gap-8 min-[1280px]:grid-cols-12">` mit Netz (`min-[1280px]:col-span-7`) und Top/Flop (`col-span-5`), darunter Spur kompakt (`col-span-7`, `monatsReihe(…, { abErster: true })`) und Noten (`col-span-5`). Ohne Bewertung (`zeilen?.length === 0`): ein `Feld` mit `texte.leer` (Leersatz der Seite; Schlüssel mit `grep -n "leer" lib/i18n/de.ts` im Abschnitt `profil` finden) und Knopf „Blüte bewerten“.
- `AnsichtVertreiber`: `Lieblingshersteller`, `Schnitte`, `CommunityVergleich` untereinander bis 1280 px, darüber zwei Spalten (`grid-cols-2`, Hersteller über beide).
- Alle `Feld` in Ansichten mit `groesse="klein"`, `rahmen="karte"` und **ohne** `spalten`. `Feld` macht `spalten` optional: ohne `spalten` setzt es weder `col-span-4` noch eine Klasse aus `FELD_SPALTEN`; die Breite bestimmt das Raster der Ansicht über `className` (z. B. `min-[1280px]:col-span-7`).
- `Notizen`, `KopfBild`, `Kapitelkopf`, `KapitelRaster` und `ViewTransition name="kapitel-kopf"` aus der Profilseite entfernen (Komponenten bleiben für `/mitglied`).
- `Feld` setzt heute `border-t border-l` als Rasterkanten; im neuen Rahmen Felder mit `rounded-lg border border-border` zeigen: Prop `rahmen?: "raster" | "karte"` (Vorgabe `raster`), in Ansichten `karte`.

- [ ] **Step 4: Run tests**

Run: `npm test`, `npm run typecheck`, `npx eslint app components lib --quiet`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add -A app/[lang]/profil/page.tsx components lib tests
git commit -m "feat: Profil mit Seitenleiste und Reitern, Felder je Reiter"
```

---

### Task 4: Öffentliches Profil im selben Aufbau

**Files:**
- Modify: `app/[lang]/profil/[kurzId]/page.tsx`, `lib/query/profil-oeffentlich.ts` (Feld `seit`, `rolle`)
- Test: `tests/profil-oeffentlich-desktop.test.ts`

**Interfaces:**
- Consumes: `ProfilRahmen`, `ProfilSeitenleiste`, `ProfilReiter`, `ansichtAus`.
- Produces: `ladeOeffentlichesProfil` liefert zusätzlich `seit: Date` (aus `mitglied.erstelltAm`) und `rolle: "betreiber" | "mitglied"`.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Öffentliches Profil: Seitenleiste und nur öffentliche Reiter", () => {
  const q = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  for (const teil of ["<ProfilRahmen", "<ProfilSeitenleiste", "<ProfilReiter"]) assert.ok(q.includes(teil), teil);
  assert.match(q, /\["uebersicht", "bewertungen"\]/);
  assert.doesNotMatch(q, /Schnitte|CommunityVergleich|Lieblingshersteller|Lieblingsvertreiber/);
  assert.match(q, /aktionen=\{\[\]\}/);
});

test("Öffentliches Profil ohne Bewertungen zeigt den Leersatz (Review Focus)", () => {
  const q = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.match(q, /texte\.netzLeer/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/profil-oeffentlich-desktop.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

`lib/query/profil-oeffentlich.ts`: im Select `erstelltAm: true, rolle: true` ergänzen, Rückgabe `seit: m.erstelltAm`, `rolle: m.rolle === "ADMIN" ? "betreiber" : "mitglied"`.

`app/[lang]/profil/[kurzId]/page.tsx`: Props um `searchParams` erweitern; `const ansicht = ansichtAus((await searchParams).ansicht)`; erlaubt sind nur `uebersicht` und `bewertungen` (andere Werte auf `uebersicht`). Aufbau:

```tsx
    <ProfilRahmen
      seitenleiste={
        <ProfilSeitenleiste
          name={profil.anzeigename}
          avatarId={profil.avatarId}
          rolle={profil.rolle}
          seit={profil.seit}
          notizen={[{ zahl: String(profil.anzahl), wort: w.profil.seite.reiter.bewertungen, satz: mehrzahl(sprache, w.profil.anzahl, profil.anzahl) }]}
          aromen={werte ? liebsteAromen(werte.geschmack).map((a) => w.label.geschmack[a]) : []}
          aktionen={[]}
          texte={w.profil.seite}
          sprache={sprache}
        />
      }
      reiter={
        <ProfilReiter
          basis={`/profil/${kurzId}`}
          aktiv={sichtbar}
          beschriftung={w.profil.seite.reiterLeiste}
          reiter={(["uebersicht", "bewertungen"] as const).map((a) => ({ ansicht: a, text: w.profil.seite.reiter[a] }))}
        />
      }
    >
      {sichtbar === "uebersicht" ? (/* bisherige Netz-Karte, Inhalt unverändert, als Feld groesse="klein" rahmen="karte" */) : (/* bisherige Bewertungs-Karte */)}
    </ProfilRahmen>
```

mit `const sichtbar = ansicht === "bewertungen" ? "bewertungen" : "uebersicht";`. Die bisherigen `Card`-Blöcke werden zu `Feld`-Blöcken (`id="netz"` / `id="bewertungen"`, `titel` aus `texte.netzTitel` / `texte.bewertungenTitel`, ohne `kopf`). Den Kommentar „Nie Vorschläge oder Auswertungen (privat), nie Wirkung (HWG)“ behalten.

- [ ] **Step 4: Run tests**

Run: `npm test`, `npm run typecheck`
Expected: grün.

- [ ] **Step 5: Commit**

```bash
git add -A "app/[lang]/profil/[kurzId]/page.tsx" lib/query/profil-oeffentlich.ts tests/profil-oeffentlich-desktop.test.ts
git commit -m "feat: Oeffentliches Profil mit Seitenleiste und Reitern"
```

---

### Task 5: Live prüfen und Design-Abschluss

- [ ] **Step 1: Push und Build**

`git push origin main`; nach ~12 Minuten einmal den Check-Run „Workers Builds: cn-medcan“ des Commits ansehen (`gh api repos/bratzi/cn-medcan/commits/<sha>/check-runs --jq '.check_runs[]|.status+" "+(.conclusion//"")'`). Nicht pollen.

- [ ] **Step 2: Live per Browser-MCP (angemeldet), jeweils mit frischer Query**

- `/profil?f=1` bei 1440 px: Seitenleiste links sticky, Reiter rechts, kein Hintergrundwort, keine Blüte, Kopfleiste mit Fläche und Linie auf Inhaltsbreite.
- Reiter Aromen, Bewertungen, Vertreiber: je nur deren Felder; `?ansicht=xyz` zeigt Übersicht.
- `/` oben: Kopf durchsichtig über dem Hero, nach Scroll mit Fläche. Danach per Klick auf `/profil`: Kopf sofort mit Fläche.
- 1146 px und 494 px (über ein gleich-origin-iframe mit `transform: scale`, wie in Session 55/56): kein Querscroll, Seitenleiste wird Kopfblock, Reiter scrollen waagerecht.
- Dunkles Thema einmal ansehen.
- Öffentliches Profil `/profil/<kurzId>` mit zwei Reitern.

- [ ] **Step 3: Design-Abschluss**

Skills `critique-composition`, `critique-visual-hierarchy`, `better-interface` laden und an Screenshots (1440 px hell und dunkel, 494 px) anwenden. Gefundene „major issue“ sofort beheben, Minor im HANDOFF notieren.

- [ ] **Step 4: HANDOFF und Commit**

HANDOFF-Abschnitt „Profil am Desktop umgesetzt“ mit Commits, Live-Befund, offenen Minors; committen und pushen.
