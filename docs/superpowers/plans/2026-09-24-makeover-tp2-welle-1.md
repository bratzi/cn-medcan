# Makeover „Grünes Buch“ Teilprojekt 2, Welle 1 (Kernseiten) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die drei Kernseiten `/reviews`, `/umfragen` und `/produkte/[slug]` samt den gemeinsamen Bausteinen (Kopf, Seitenkopf, Buchtabelle, Leerzustand, Fehlerseite) in die Sprache „Buch und Wand“ bringen und live stellen.

**Architecture:** Server Components mit Tailwind v4 und den semantischen Tokens aus `app/globals.css`. Neue Grundbausteine unter `components/ui/`, das Seitengerüst unter `components/layout/`, Bewertungsdarstellung unter `components/review/`. Die Doppelseite der Startseite wird herausgelöst und von Startseite, `/reviews` und Produktseite geteilt. Eine Leseabfrage bekommt ein Feld mehr (`istRedaktionell`), das Datenmodell bleibt.

**Tech Stack:** Next.js 16.3.6 (App Router), React 19.2, Tailwind v4, Prisma 7 mit D1, Tests über `node:test` mit `tsx` (`npm test`), Rendering in Tests über `react-dom/server`.

**Spec:** `docs/superpowers/specs/2026-09-24-makeover-teilprojekt-2-design.md` (Abschnitte 3, 4, 7, 8, 9 gelten für diese Welle). Marke: `docs/brand/gruenes-buch.md`. Code-Regeln: `.claude/skills/ui-design-engine.md`.

## Global Constraints

- Abstände nur aus der Leiter 8, 16, 24, 32, 40, 48, 64, 80, 96, 128 px (gerade Tailwind-Stufen); 4 px nur als begründete optische Korrektur in einem Paar. Keine arbitrary values für Abstände.
- Nur semantische Farbtokens (`surface`, `surface-raised`, `surface-sunken`, `border`, `border-strong`, `text`, `text-muted`, `accent`, `accent-hover`, `accent-fg`, `accent-subtle`, `spray`, `danger`/`success`/`warning`), keine `dark:`-Varianten, keine Primitives, kein Hex.
- `accent` nur für Bedienung (Buttons, Links, aktive Zustände); Datengrafiken in `text`/`text-muted`; `spray` nur Wand, nie auf Buttons, Links oder Fokus.
- Pillen (`rounded-full`) für Buttons, Badges, Chips; alles andere eckig. Touch-Ziele ≥ 44 px (`h-11`). Kein `hover:opacity-*`; Hover über `accent-hover` bzw. Unterstrichfarbe, 180 bis 350 ms.
- Schriftstufen (Spec 3.3): Seitentitel `font-buch text-kapitel font-light`, Abschnitt `font-buch text-h1 font-medium`, innere Überschrift `text-h3` (Geist 600), Zahlen `numeric`, Wand `font-wand text-tag`. Cormorant 300 nur ab 40 px. Höchstens drei Schriftgrade je Abschnitt. Genau ein `h1` je Seite.
- Handelsnamen nie in Sedgwick, unverändert, Umbruch statt Kürzung (`wrap-break-word`, bei großen Namen zusätzlich `hyphens-auto`).
- Texte: Du und Ich, kein Geviertstrich (U+2014), kein Gedankenstrich (U+2013) als Trenner, keine Umschrift („fuer“), Knöpfe beginnen mit einem Verb. Wortlaut neuer Sätze exakt aus Spec Abschnitt 7.
- Konten heißen „freigeschaltet“ (Spec 3.11).
- Kein GSAP, kein Lenis außerhalb der Startseite. Kein neues npm-Paket (Memory `netzwerk-schonen`).
- Dateien mit CRLF (z. B. `app/layout.tsx`) beim Schreiben per Skript nicht auf LF umstellen; das Repo ist gemischt.
- Gearbeitet wird auf dem Branch `makeover/tp2-welle-1`. `main` wird erst nach dem Go des Nutzers per Fast-Forward aktualisiert (Push nach `main` = Live-Gang über Workers Builds).
- Nach jedem Task: eine Zeile in `HANDOFF.md` unter „Teilprojekt 2“ („Welle 1, Task N erledigt: …“), im selben Commit wie der Task.
- Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Skills je Task stehen unter **Skills**; zu Beginn jedes Tasks laden und dem Nutzer in einem Satz nennen (Memory `skills-einsatzregeln`, `design-skills-einsatz`).
- Einzeltests: `npx tsx --test tests/<datei>.test.ts`; alles: `npm test`.

## Review Focus

1. **Sehr lange Handelsnamen ohne Leerzeichen bei 390 px** sollen in Titelblatt, Doppelseite, Inhaltsverzeichnis und Vorschlagsliste umbrechen statt überzulaufen. Tests: Task 7, Task 8, Task 10 prüfen `wrap-break-word`.
2. **Bewertung ohne Charge** soll „Bewertet am {Datum}“ ohne das Wort „Charge“ zeigen, die volle Doppelseite „Charge nicht angegeben“. Tests: Task 7, Task 8.
3. **Produkt nur mit Community-Bewertungen** soll „Noch nicht von mir getestet.“ zeigen, keinen Abschnitt „Meine Bewertungen“, aber das Community-Mittel. Tests: Task 6 (`teileBewertungen`), Task 8 (`Titelblatt`, `CommunityStimmen`).
4. **Ungültige oder fremde Reel-URL** soll weder ein `iframe` noch den Platzhalter „Kein Video hinterlegt“ noch eine Ersatz-URL aus der Umgebung erzeugen. Test: Task 7.
5. **Pfade, die nur mit einem Navigationspfad beginnen** (`/produkte-archiv`), dürfen den Punkt nicht aktiv markieren, echte Unterseiten (`/produkte/x`) schon. Test: Task 4.

---

### Task 1: Textlinks, Blatt, Faktenliste

**Skills:** `ui-design-engine`, `better-ui`, `better-layout`

**Files:**
- Create: `components/ui/textlink.ts`, `components/ui/Blatt.tsx`, `components/ui/Faktenliste.tsx`
- Modify: `components/ui/index.ts`
- Test: `tests/primitive.test.ts`

**Interfaces:**
- Produces: `textLinkKlassen(className?: string): string`, `namenLinkKlassen(className?: string): string`, `Blatt({ children, className?, id? })`, `Faktenliste({ zeilen: readonly Fakt[], className? })`, `type Fakt = { begriff: string; wert: ReactNode }`; alle zusätzlich über `@/components/ui` exportiert.

- [ ] **Step 1: Branch anlegen**

```bash
git switch -c makeover/tp2-welle-1
git branch --show-current
```
Expected: `makeover/tp2-welle-1`

- [ ] **Step 2: Failing tests anhängen** (an das Ende von `tests/primitive.test.ts`; die Importe an den Anfang zu den übrigen)

```ts
import { Blatt } from "@/components/ui/Blatt";
import { Faktenliste } from "@/components/ui/Faktenliste";
import { namenLinkKlassen, textLinkKlassen } from "@/components/ui/textlink";

test("Textlinks: Blattgrün mit Unterstrich, Hover über Farbe", () => {
  const klassen = textLinkKlassen();
  assert.match(klassen, /\btext-accent\b/);
  assert.match(klassen, /\bunderline\b/);
  assert.match(klassen, /\bhover:text-accent-hover\b/);
  assert.doesNotMatch(klassen, /opacity/);
});

test("Namenslinks: Tinte, Hover nur über die Unterstrichfarbe", () => {
  const klassen = namenLinkKlassen();
  assert.match(klassen, /\btext-text\b/);
  assert.match(klassen, /\bdecoration-border-strong\b/);
  assert.match(klassen, /\bhover:decoration-text\b/);
  assert.doesNotMatch(klassen, /accent|opacity/);
});

test("Blatt ist eine eckige, erhabene Fläche", () => {
  const html = renderToStaticMarkup(createElement(Blatt, null, "Formular"));
  assert.match(html, /\bbg-surface-raised\b/);
  assert.match(html, /\bborder-border-strong\b/);
  assert.match(html, /\bshadow-md\b/);
  assert.doesNotMatch(html, /rounded/);
});

test("Faktenliste: je Paar ein dt und ein dd", () => {
  const html = renderToStaticMarkup(
    createElement(Faktenliste, {
      zeilen: [
        { begriff: "PZN", wert: "123" },
        { begriff: "Anbauland", wert: "Kanada" },
      ],
    }),
  );
  assert.match(html, /^<dl/);
  assert.equal(html.match(/<dt/g)?.length, 2);
  assert.equal(html.match(/<dd/g)?.length, 2);
});
```

- [ ] **Step 3: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/primitive.test.ts`
Expected: FAIL mit „Cannot find module '@/components/ui/Blatt'“ (bzw. `textlink`).

- [ ] **Step 4: `components/ui/textlink.ts` anlegen**

```ts
import { cn } from "@/lib/cn";

/**
 * Textlinks (Spec TP2 3.10): Blattgrün mit Unterstrich, Hover über das
 * eigene Token statt über Deckkraft. Den Fokus zeichnet die globale Regel
 * in globals.css.
 */
export function textLinkKlassen(className?: string): string {
  return cn(
    "text-accent underline underline-offset-2 transition-colors duration-fast ease-standard hover:text-accent-hover",
    className,
  );
}

/**
 * Handelsnamen als Link in Listen (Inhaltsverzeichnis, Vorschläge,
 * Stimmzettel): Tinte, der Unterstrich zeigt den Link, beim Hover dunkelt
 * nur die Unterstrichfarbe nach (Guideline 7).
 */
export function namenLinkKlassen(className?: string): string {
  return cn(
    "text-text underline decoration-border-strong underline-offset-4 transition-colors duration-fast ease-standard hover:decoration-text",
    className,
  );
}
```

- [ ] **Step 5: `components/ui/Blatt.tsx` anlegen**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/**
 * Eine Fläche mit Bedeutung: hier schreibst du etwas (Formulare, Vorschlag).
 * Dieselbe Machart wie Doppelseite und Stimmzettel (Spec TP2 3.4), eckig.
 */
export function Blatt({ children, className, id }: Props) {
  return (
    <div
      id={id}
      className={cn("border border-border-strong bg-surface-raised p-6 shadow-md sm:p-8", className)}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 6: `components/ui/Faktenliste.tsx` anlegen**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Fakt = { begriff: string; wert: ReactNode };

/**
 * Begriff und Wert paarweise wie im Feldbuch (Spec TP2 3.5). Bewusst ein
 * `dl`: keine Tabelle (nur eine Spalte Werte) und keine bloße Liste.
 */
export function Faktenliste({ zeilen, className }: { zeilen: readonly Fakt[]; className?: string }) {
  return (
    <dl className={cn("flex flex-col", className)}>
      {zeilen.map((zeile) => (
        <div
          key={zeile.begriff}
          className="grid grid-cols-1 gap-2 border-t border-border py-4 sm:grid-cols-[16rem_1fr] sm:gap-8"
        >
          <dt className="text-small text-text-muted">{zeile.begriff}</dt>
          <dd className="min-w-0 text-body text-text">{zeile.wert}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 7: Exporte in `components/ui/index.ts` ergänzen** (nach dem `Badge`-Block)

```ts
export { Blatt } from "./Blatt";

export { Faktenliste } from "./Faktenliste";
export type { Fakt } from "./Faktenliste";

export { namenLinkKlassen, textLinkKlassen } from "./textlink";
```

- [ ] **Step 8: Test laufen lassen, er muss bestehen**

Run: `npx tsx --test tests/primitive.test.ts`
Expected: PASS (alle Tests der Datei).

- [ ] **Step 9: HANDOFF-Zeile und Commit**

In `HANDOFF.md` unter dem Teilprojekt-2-Block ergänzen: `- Welle 1, Task 1 erledigt: textLinkKlassen, namenLinkKlassen, Blatt, Faktenliste (Branch makeover/tp2-welle-1).`

```bash
git add components/ui/textlink.ts components/ui/Blatt.tsx components/ui/Faktenliste.tsx components/ui/index.ts tests/primitive.test.ts HANDOFF.md
git commit -m "feat(ui): Textlinks, Blatt und Faktenliste (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Buchtabelle und Leerzustand ohne Kasten

**Skills:** `ui-design-engine`, `better-layout`, `better-typography`

**Files:**
- Modify: `components/ui/Table.tsx` (ganze Datei), `components/ui/EmptyState.tsx` (ganze Datei)
- Test: `tests/primitive.test.ts`

**Interfaces:**
- Consumes: nichts Neues.
- Produces: unveränderte Signaturen von `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell`, `EmptyState({ titel, beschreibung?, aktion?, className? })`. Wirkt sofort auf allen Seiten, die sie benutzen (gewollt, Spec 10).

- [ ] **Step 1: Failing tests anhängen** (Importe oben ergänzen: `Fragment` aus `react`, die Table-Teile, `EmptyState`)

```ts
import { Fragment } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";

test("Buchtabelle: kein Rahmen, kein Zebra, kräftige Linie unter dem Kopf", () => {
  const kopf = createElement(TableHead, {
    children: createElement(TableRow, { children: createElement(TableHeaderCell, { children: "Charge" }) }),
  });
  const rumpf = createElement(TableBody, {
    children: createElement(TableRow, { children: createElement(TableCell, { children: "A1" }) }),
  });
  const html = renderToStaticMarkup(
    createElement(Table, { caption: "Chargen", children: createElement(Fragment, null, kopf, rumpf) }),
  );
  assert.doesNotMatch(html, /even:bg-/);
  assert.doesNotMatch(html, /rounded-lg|border border-border/);
  assert.match(html, /border-b-2 border-border-strong/);
  assert.match(html, /overflow-x-auto/);
  assert.match(html, /tabindex="0"/);
});

test("Leerzustand ohne Kasten, Titel in Cormorant", () => {
  const html = renderToStaticMarkup(createElement(EmptyState, { titel: "Noch nichts da." }));
  assert.match(html, /\bfont-buch\b/);
  assert.doesNotMatch(html, /\bborder\b|bg-surface-raised/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/primitive.test.ts`
Expected: FAIL in „Buchtabelle …“ (findet `even:bg-`) und „Leerzustand …“ (findet `border`).

- [ ] **Step 3: `components/ui/Table.tsx` ersetzen**

```tsx
import type { ReactNode, ThHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type TableProps = {
  /** Pflicht: beschreibt den Tabelleninhalt. */
  caption: string;
  /** Caption nur fuer Screenreader, wenn die Ueberschrift schon daneben steht. */
  captionVersteckt?: boolean;
  children: ReactNode;
  className?: string;
  /** Klassen fuer den scrollenden Rahmen. */
  wrapperClassName?: string;
};

/**
 * Buchtabelle (Spec TP2 3.6): kein Rahmen, kein Zebra, eine kraeftige Linie
 * unter dem Kopf, Haarlinien zwischen den Zeilen. Der Rahmen scrollt
 * seitlich (`min-w-full` innen), damit schmale Viewports nicht die ganze
 * Seite mitscrollen; `tabIndex` macht ihn per Tastatur erreichbar, den Fokus
 * zeichnet die globale Regel.
 */
export function Table({
  caption,
  captionVersteckt,
  children,
  className,
  wrapperClassName,
}: TableProps) {
  return (
    <div tabIndex={0} className={cn("w-full max-w-full overflow-x-auto", wrapperClassName)}>
      <table className={cn("w-full min-w-full border-collapse text-body", className)}>
        <caption
          className={cn(captionVersteckt ? "sr-only" : "pb-4 text-left text-small text-text-muted")}
        >
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ children, className }: { children: ReactNode; className?: string }) {
  return <tbody className={className}>{children}</tbody>;
}

/** Haarlinie zwischen den Zeilen; die kraeftige Linie traegt der Kopf. */
export function TableRow({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={cn("border-t border-border", className)}>{children}</tr>;
}

export type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement> & {
  children: ReactNode;
  /** Rechtsbuendig fuer Zahlenspalten. */
  numerisch?: boolean;
};

export function TableHeaderCell({
  children,
  numerisch,
  scope = "col",
  className,
  ...rest
}: TableHeaderCellProps) {
  return (
    <th
      scope={scope}
      className={cn(
        "border-b-2 border-border-strong px-4 pt-2 pb-4 align-bottom text-small font-semibold text-text",
        numerisch ? "text-right" : "text-left",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  numerisch,
  className,
}: {
  children: ReactNode;
  numerisch?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-4 align-top text-body text-text",
        numerisch ? "numeric text-right" : undefined,
        className,
      )}
    >
      {children}
    </td>
  );
}
```

- [ ] **Step 4: `components/ui/EmptyState.tsx` ersetzen**

```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EmptyStateProps = {
  titel: string;
  beschreibung?: string;
  /** Optionale Aktion, z. B. ein Button oder Link zum Zuruecksetzen der Filter. */
  aktion?: ReactNode;
  className?: string;
};

/**
 * Leerer Zustand (Spec TP2 3.9): ein Satz in Cormorant, darunter was hier
 * entsteht oder was zu tun ist, hoechstens eine Aktion. Kein Kasten: die
 * Seite ist Papier, der leere Platz braucht keinen Rahmen.
 */
export function EmptyState({ titel, beschreibung, aktion, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-start gap-4 py-8", className)}>
      <div className="flex flex-col gap-2">
        <p className="font-buch text-h2 font-medium text-balance text-text">{titel}</p>
        {beschreibung ? (
          <p className="max-w-[56ch] text-body text-pretty text-text-muted">{beschreibung}</p>
        ) : null}
      </div>
      {aktion}
    </div>
  );
}
```

- [ ] **Step 5: Test laufen lassen, er muss bestehen**

Run: `npx tsx --test tests/primitive.test.ts`
Expected: PASS.

- [ ] **Step 6: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 2 erledigt: Buchtabelle, Leerzustand ohne Kasten (wirkt auf allen Seiten).`

```bash
git add components/ui/Table.tsx components/ui/EmptyState.tsx tests/primitive.test.ts HANDOFF.md
git commit -m "feat(ui): Buchtabelle und Leerzustand ohne Kasten (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Seitenkopf, Seitenrahmen, Titelblatt-Skelett

**Skills:** `ui-design-engine`, `better-typography`, `better-layout`

**Files:**
- Create: `components/layout/Seitenkopf.tsx`, `components/layout/Skelette.tsx`
- Modify: `components/story/Skelette.tsx` (zwei Exporte umbenennen)
- Test: `tests/seitenkopf.test.ts`

**Interfaces:**
- Consumes: `textLinkKlassen()` (Task 1).
- Produces: `seitenRahmen(schmal?: boolean): string`, `ABSCHNITT_TITEL: string`, `Seitenkopf({ titel, satz?, zurueck?: { href, text }, schmal?, children? })`, `TitelblattSkelett()`; aus `components/story/Skelette.tsx` zusätzlich exportiert: `SKELETT_FLAECHE: string`, `SkelettAnsage({ text })`.

- [ ] **Step 1: Failing test `tests/seitenkopf.test.ts` anlegen**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Seitenkopf, seitenRahmen, ABSCHNITT_TITEL } from "@/components/layout/Seitenkopf";
import { TitelblattSkelett } from "@/components/layout/Skelette";

test("Seitenkopf: genau ein h1 in Cormorant 300, Satz darunter, keine Oberzeile", () => {
  const html = renderToStaticMarkup(createElement(Seitenkopf, { titel: "Bewertungen", satz: "Ein Satz." }));
  assert.equal(html.match(/<h1/g)?.length, 1);
  assert.match(html, /font-buch text-kapitel font-light/);
  assert.match(html, /Ein Satz\./);
  assert.doesNotMatch(html, /uppercase/);
});

test("Seitenkopf: Rückweg als Textlink über dem Titel", () => {
  const html = renderToStaticMarkup(
    createElement(Seitenkopf, { titel: "X", zurueck: { href: "/produkte", text: "Alle Produkte" } }),
  );
  assert.match(html, /href="\/produkte"/);
  assert.ok(html.indexOf("Alle Produkte") < html.indexOf("<h1"));
});

test("Seitenrahmen: breit 1440, schmal 480 px", () => {
  assert.match(seitenRahmen(), /\bmax-w-360\b/);
  assert.match(seitenRahmen(true), /\bmax-w-120\b/);
});

test("Abschnittstitel in Cormorant 500", () => {
  assert.match(ABSCHNITT_TITEL, /font-buch text-h1 font-medium/);
});

test("Titelblatt-Skelett meldet sich als Status", () => {
  const html = renderToStaticMarkup(createElement(TitelblattSkelett));
  assert.match(html, /role="status"/);
  assert.match(html, /Produkt wird geladen/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/seitenkopf.test.ts`
Expected: FAIL mit „Cannot find module '@/components/layout/Seitenkopf'“.

- [ ] **Step 3: `components/layout/Seitenkopf.tsx` anlegen**

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

import { textLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";

/** Seitenrahmen der Unterseiten: breit fuer Inhalt, schmal fuer Konto und Formulare. */
export function seitenRahmen(schmal = false): string {
  return cn("mx-auto w-full px-4 sm:px-8", schmal ? "max-w-120" : "max-w-360");
}

/** Abschnittsueberschrift (h2) der Unterseiten: Cormorant 500, weil 300 erst ab 40 px traegt. */
export const ABSCHNITT_TITEL = "font-buch text-h1 font-medium text-balance text-text";

export type SeitenkopfProps = {
  titel: string;
  satz?: string;
  zurueck?: { href: string; text: string };
  /** Kontoseiten: Spalte 480 px statt 1440 px. */
  schmal?: boolean;
  /** Zusatz unter dem Satz, z. B. die E-Mail auf /mitglied. */
  children?: ReactNode;
};

/**
 * Kopf jeder Unterseite (Spec TP2 3.2): Titel in Cormorant 300, ein Satz in
 * Du und Ich, keine Oberzeile. Linksbuendig, auf allen Seiten gleich.
 */
export function Seitenkopf({ titel, satz, zurueck, schmal = false, children }: SeitenkopfProps) {
  return (
    <header className={cn(seitenRahmen(schmal), "pt-16 sm:pt-24")}>
      {zurueck ? (
        <p className="mb-8 text-small">
          <Link href={zurueck.href} className={textLinkKlassen()}>
            {zurueck.text}
          </Link>
        </p>
      ) : null}
      <h1 className="font-buch text-kapitel font-light text-balance text-text wrap-break-word">{titel}</h1>
      {satz ? <p className="mt-4 max-w-[56ch] text-body text-pretty text-text-muted">{satz}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </header>
  );
}
```

- [ ] **Step 4: Exporte in `components/story/Skelette.tsx` umbenennen**

`const FLAECHE = …` wird `export const SKELETT_FLAECHE = …`, `function Ansage(…)` wird `export function SkelettAnsage(…)`. Alle Verwendungen in derselben Datei mitziehen (`${FLAECHE}` → `${SKELETT_FLAECHE}`, `<Ansage` → `<SkelettAnsage`). Sonst nichts ändern.

- [ ] **Step 5: `components/layout/Skelette.tsx` anlegen**

```tsx
import { SKELETT_FLAECHE, SkelettAnsage } from "@/components/story/Skelette";

/** Titelblatt der Produktseite (Spec TP2 3.9): Name, Zeile, Note. */
export function TitelblattSkelett() {
  return (
    <div
      role="status"
      className="grid grid-cols-1 gap-8 border-b-2 border-border pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
    >
      <SkelettAnsage text="Produkt wird geladen" />
      <div aria-hidden="true" className="flex flex-col gap-4">
        <span className={`${SKELETT_FLAECHE} h-16 w-3/4`} />
        <span className={`${SKELETT_FLAECHE} h-6 w-1/3`} />
        <span className={`${SKELETT_FLAECHE} h-8 w-1/2`} />
      </div>
      <span aria-hidden="true" className={`${SKELETT_FLAECHE} h-20 w-40`} />
    </div>
  );
}
```

- [ ] **Step 6: Tests laufen lassen**

Run: `npx tsx --test tests/seitenkopf.test.ts`
Expected: PASS.

- [ ] **Step 7: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 3 erledigt: Seitenkopf, seitenRahmen, ABSCHNITT_TITEL, TitelblattSkelett.`

```bash
git add components/layout/Seitenkopf.tsx components/layout/Skelette.tsx components/story/Skelette.tsx tests/seitenkopf.test.ts HANDOFF.md
git commit -m "feat(layout): Seitenkopf und Titelblatt-Skelett (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Navigation „Kern zuerst“ in Kopf und Fuß

**Skills:** `ui-design-engine`, `better-layout`, `better-accessibility`, `react-best-practices`

**Files:**
- Create: `lib/navigation.ts`, `components/layout/NavLink.tsx`
- Modify: `components/layout/Kopf.tsx` (ganze Datei), `components/layout/Fuss.tsx` (nur `LINKS`)
- Test: `tests/navigation.test.ts`

**Interfaces:**
- Consumes: `buttonKlassen()` (bestehend).
- Produces: `HAUPTNAVIGATION: readonly { href: string; text: string }[]`, `KONTO_LINK: { href: "/mitglied"; text: "Mein Konto" }`, `istAktiv(pfad: string, href: string): boolean`, `NavLink({ href, className, aktivKlasse, children })` (Client Component).

- [ ] **Step 1: Failing test `tests/navigation.test.ts` anlegen**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { HAUPTNAVIGATION, KONTO_LINK, istAktiv } from "@/lib/navigation";

test("Kern zuerst: Bewertungen, Abstimmung, Produkte, Apotheken", () => {
  assert.deepEqual(
    HAUPTNAVIGATION.map((eintrag) => eintrag.href),
    ["/reviews", "/umfragen", "/produkte", "/apotheken"],
  );
  assert.deepEqual(
    HAUPTNAVIGATION.map((eintrag) => eintrag.text),
    ["Bewertungen", "Abstimmung", "Produkte", "Apotheken"],
  );
  assert.deepEqual(KONTO_LINK, { href: "/mitglied", text: "Mein Konto" });
});

test("istAktiv: die Seite selbst und ihre Unterseiten", () => {
  assert.equal(istAktiv("/produkte", "/produkte"), true);
  assert.equal(istAktiv("/produkte/nebelharz-22", "/produkte"), true);
});

test("istAktiv: kein Treffer über einen bloßen Namensanfang oder die Startseite", () => {
  assert.equal(istAktiv("/produkte-archiv", "/produkte"), false);
  assert.equal(istAktiv("/", "/reviews"), false);
  assert.equal(istAktiv("/reviews", "/umfragen"), false);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/navigation.test.ts`
Expected: FAIL mit „Cannot find module '@/lib/navigation'“.

- [ ] **Step 3: `lib/navigation.ts` anlegen**

```ts
/**
 * Hauptnavigation, Kern zuerst (Spec TP2 3.1): die eigenen Bewertungen und
 * die Abstimmung vor Katalog und Apotheken. "Mein Konto" steht getrennt,
 * weil es kein Inhalt ist.
 */
export const HAUPTNAVIGATION = [
  { href: "/reviews", text: "Bewertungen" },
  { href: "/umfragen", text: "Abstimmung" },
  { href: "/produkte", text: "Produkte" },
  { href: "/apotheken", text: "Apotheken" },
] as const;

export const KONTO_LINK = { href: "/mitglied", text: "Mein Konto" } as const;

/** Aktiv sind die Seite selbst und ihre Unterseiten, nicht ein blosser Namensanfang. */
export function istAktiv(pfad: string, href: string): boolean {
  return pfad === href || pfad.startsWith(`${href}/`);
}
```

- [ ] **Step 4: Test laufen lassen, er muss bestehen**

Run: `npx tsx --test tests/navigation.test.ts`
Expected: PASS.

- [ ] **Step 5: `components/layout/NavLink.tsx` anlegen**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { istAktiv } from "@/lib/navigation";

type Props = {
  href: string;
  className: string;
  /** Sichtbare Markierung zusaetzlich zu aria-current, nie nur Farbe. */
  aktivKlasse: string;
  children: ReactNode;
};

/**
 * Die einzige Client-Stelle im Kopf: nur der Browser kennt den Pfad. Der
 * Kopf selbst bleibt Server Component und liest keine Sitzung.
 */
export function NavLink({ href, className, aktivKlasse, children }: Props) {
  const aktiv = istAktiv(usePathname() ?? "", href);
  return (
    <Link href={href} aria-current={aktiv ? "page" : undefined} className={cn(className, aktiv && aktivKlasse)}>
      {children}
    </Link>
  );
}
```

- [ ] **Step 6: `components/layout/Kopf.tsx` ersetzen**

```tsx
import Link from "next/link";

import { NavLink } from "@/components/layout/NavLink";
import { Wortmarke } from "@/components/marke/Wortmarke";
import { buttonKlassen } from "@/components/ui/Button";
import { HAUPTNAVIGATION, KONTO_LINK } from "@/lib/navigation";

/**
 * Hauptnavigation, Kern zuerst (Spec TP2 3.1). Die Nummern sind Dekoration
 * und aria-hidden. "Mein Konto" steht abgesetzt als Pille ohne Nummer.
 * Die aktive Seite markiert NavLink: aria-current plus Unterstrich in Tinte.
 *
 * Bewusst ein fester Link "Mein Konto" statt "Anmelden"/"Mein Konto" je nach
 * Sitzung: das Layout muesste dafuer die Sitzung lesen und waere auf jeder
 * Seite dynamisch. /mitglied leitet ohne Anmeldung selbst auf /anmelden weiter.
 *
 * Handy: erste Zeile Wortmarke und Konto, darunter die vier Punkte als
 * wischbare Leiste bis an den Rand; der naechste Punkt schaut an.
 */
const NAV_LINK =
  "inline-flex h-11 items-center gap-2 rounded-full px-4 text-small font-medium whitespace-nowrap text-text " +
  "transition-colors duration-fast ease-standard hover:bg-surface-sunken";

const AKTIV = "underline decoration-text decoration-2 underline-offset-8";

export function Kopf() {
  return (
    <header className="relative z-10 border-b border-border bg-surface">
      <div className="mx-auto grid w-full max-w-360 grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-8 md:grid-cols-[auto_1fr_auto]">
        <Link href="/" className="inline-flex min-h-11 items-center justify-self-start px-2">
          <Wortmarke groesse="kopf" />
        </Link>

        <nav
          aria-label="Hauptnavigation"
          className="col-span-2 row-start-2 -mx-4 min-w-0 sm:-mx-8 md:col-span-1 md:col-start-2 md:row-start-1 md:mx-0 md:justify-self-end"
        >
          <ul className="flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 sm:scroll-px-8 sm:px-8 md:px-0">
            {HAUPTNAVIGATION.map((eintrag, index) => (
              <li key={eintrag.href} className="shrink-0 snap-start">
                <NavLink href={eintrag.href} className={NAV_LINK} aktivKlasse={AKTIV}>
                  <span aria-hidden="true" className="numeric text-caption text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {eintrag.text}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <NavLink
          href={KONTO_LINK.href}
          className={buttonKlassen("secondary", "md", "col-start-2 row-start-1 md:col-start-3")}
          aktivKlasse={AKTIV}
        >
          {KONTO_LINK.text}
        </NavLink>
      </div>
    </header>
  );
}
```

- [ ] **Step 7: `components/layout/Fuss.tsx` anpassen**

Die Konstante `LINKS` (Zeilen 7 bis 12) ersetzen durch:

```ts
const LINKS = [...HAUPTNAVIGATION, KONTO_LINK];
```

und den Import ergänzen: `import { HAUPTNAVIGATION, KONTO_LINK } from "@/lib/navigation";`

- [ ] **Step 8: Typecheck und Tests**

Run: `npm run typecheck && npx tsx --test tests/navigation.test.ts`
Expected: keine Typfehler, PASS.

- [ ] **Step 9: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 4 erledigt: Navigation Kern zuerst (Kopf, Fuss, NavLink mit aria-current).`

```bash
git add lib/navigation.ts components/layout/NavLink.tsx components/layout/Kopf.tsx components/layout/Fuss.tsx tests/navigation.test.ts HANDOFF.md
git commit -m "feat(layout): Navigation Kern zuerst mit aktiver Seite (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Fehlerseite `app/error.tsx`

**Skills:** `ui-design-engine`, `better-writing`, `better-accessibility`

**Files:**
- Create: `app/error.tsx`
- Test: `tests/fehlerseite.test.ts`

**Interfaces:**
- Consumes: `Seitenkopf`, `seitenRahmen` (Task 3), `textLinkKlassen` (Task 1), `Button` (bestehend).
- Produces: Default-Export `Fehler({ error, retry })` nach Next 16.3 (`retry` ist dort stabil, siehe `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md`).

- [ ] **Step 1: Failing test `tests/fehlerseite.test.ts` anlegen**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Fehler from "@/app/error";

test("Fehlerseite: Titel, Ausweg, Knopf und Rückweg", () => {
  const html = renderToStaticMarkup(createElement(Fehler, { error: new Error("x"), retry: () => {} }));
  assert.match(html, /<h1[^>]*>Diese Seite lässt sich gerade nicht laden\.<\/h1>/);
  assert.match(html, /Versuch es gleich noch einmal\. Klappt es nicht, lade die Seite in ein paar Minuten neu\./);
  assert.match(html, />Erneut versuchen</);
  assert.match(html, /href="\/"[^>]*>Zur Startseite</);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/fehlerseite.test.ts`
Expected: FAIL mit „Cannot find module '@/app/error'“.

- [ ] **Step 3: `app/error.tsx` anlegen**

```tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Button } from "@/components/ui/Button";
import { textLinkKlassen } from "@/components/ui/textlink";
import { cn } from "@/lib/cn";

/**
 * Fehlerseite im Buchstil (Spec TP2 3.9, Wortlaut Abschnitt 7). Greift, wenn
 * eine Unterseite beim Laden scheitert, etwa weil die Datenbank nicht
 * antwortet. `retry` laedt das Segment neu (Next 16.3: stabil). Die
 * Startseite behaelt ihre eigenen Fehlersaetze je Sektion.
 */
export default function Fehler({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Seitenkopf
        titel="Diese Seite lässt sich gerade nicht laden."
        satz="Versuch es gleich noch einmal. Klappt es nicht, lade die Seite in ein paar Minuten neu."
      />
      <div className={cn(seitenRahmen(), "flex flex-wrap items-center gap-8 pt-8 pb-24")}>
        <Button onClick={() => retry()}>Erneut versuchen</Button>
        <Link href="/" className={textLinkKlassen("text-small")}>
          Zur Startseite
        </Link>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Test laufen lassen, er muss bestehen**

Run: `npx tsx --test tests/fehlerseite.test.ts`
Expected: PASS.

- [ ] **Step 5: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 5 erledigt: app/error.tsx im Buchstil (retry).`

```bash
git add app/error.tsx tests/fehlerseite.test.ts HANDOFF.md
git commit -m "feat: Fehlerseite im Buchstil mit Ausweg (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Eigene und Community-Bewertungen trennen

**Skills:** `prisma-client-api`, `edge-stack-master`

**Files:**
- Modify: `lib/query/bewertung.ts` (Funktion anhängen), `lib/query/strains.ts` (Typ `ReviewEintrag`, `select` in `ladeStrainDetail`, Abbildung)
- Test: `tests/bewertungen-teilen.test.ts`

**Interfaces:**
- Produces: `teileBewertungen<T extends NotenQuelle & { istRedaktionell: boolean; erstelltAm: Date }>(reviews: readonly T[]): { eigene: T[]; community: T[]; meineNote: number | null; communityMittel: number | null }`; `ReviewEintrag` hat neu `istRedaktionell: boolean`.

- [ ] **Step 1: Failing test `tests/bewertungen-teilen.test.ts` anlegen**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { teileBewertungen } from "@/lib/query/bewertung";

function bewertung(id: string, istRedaktionell: boolean, tag: number, note: number) {
  return {
    id,
    istRedaktionell,
    erstelltAm: new Date(Date.UTC(2026, 8, tag, 12)),
    aussehen: note,
    geruch: note,
    geschmack: note,
    wirkung: note,
    konsistenz: note,
  };
}

test("eigene und Community getrennt, je neueste zuerst", () => {
  const t = teileBewertungen([
    bewertung("c1", false, 3, 3),
    bewertung("e1", true, 1, 4),
    bewertung("e2", true, 5, 5),
    bewertung("c2", false, 9, 2),
  ]);
  assert.deepEqual(t.eigene.map((b) => b.id), ["e2", "e1"]);
  assert.deepEqual(t.community.map((b) => b.id), ["c2", "c1"]);
});

test("Meine Note ist die Gesamtnote der neuesten eigenen, kein Mittel", () => {
  const t = teileBewertungen([bewertung("e1", true, 1, 2), bewertung("e2", true, 5, 5)]);
  assert.equal(t.meineNote, 5);
});

test("Community-Mittel über die Gesamtnoten, auf eine Stelle gerundet", () => {
  const t = teileBewertungen([
    bewertung("c1", false, 1, 3),
    bewertung("c2", false, 2, 4),
    bewertung("c3", false, 3, 4),
  ]);
  assert.equal(t.communityMittel, 3.7);
});

test("nur Community: keine eigene Note, Community vollständig", () => {
  const t = teileBewertungen([bewertung("c1", false, 1, 3)]);
  assert.equal(t.meineNote, null);
  assert.equal(t.eigene.length, 0);
  assert.equal(t.communityMittel, 3);
});

test("keine Bewertungen: beides null", () => {
  const t = teileBewertungen([]);
  assert.equal(t.meineNote, null);
  assert.equal(t.communityMittel, null);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/bewertungen-teilen.test.ts`
Expected: FAIL mit „teileBewertungen is not a function“ bzw. einem fehlenden Export.

- [ ] **Step 3: `teileBewertungen` an das Ende von `lib/query/bewertung.ts` anhängen**

```ts
type TeilbareBewertung = NotenQuelle & { istRedaktionell: boolean; erstelltAm: Date };

export type GeteilteBewertungen<T> = {
  eigene: T[];
  community: T[];
  /** Gesamtnote der neuesten eigenen Bewertung, sonst null. */
  meineNote: number | null;
  /** Mittel der Gesamtnoten der Community, sonst null. */
  communityMittel: number | null;
};

/**
 * Trennt die Stimme des Betreibers von der Community (Spec TP2 4.4). Beide
 * Listen neueste zuerst. "Meine Note" ist die Gesamtnote der neuesten
 * eigenen Bewertung und bewusst kein Mittel: eine aeltere Charge soll die
 * neueste Aussage nicht verwaessern, und die Community mischt nicht mit.
 */
export function teileBewertungen<T extends TeilbareBewertung>(
  reviews: readonly T[],
): GeteilteBewertungen<T> {
  const neuesteZuerst = [...reviews].sort((a, b) => b.erstelltAm.getTime() - a.erstelltAm.getTime());
  const eigene = neuesteZuerst.filter((review) => review.istRedaktionell);
  const community = neuesteZuerst.filter((review) => !review.istRedaktionell);

  const communityMittel =
    community.length > 0
      ? Math.round(
          (community.reduce((summe, review) => summe + berechneGesamtnote(review), 0) / community.length) * 10,
        ) / 10
      : null;

  return {
    eigene,
    community,
    meineNote: eigene.length > 0 ? berechneGesamtnote(eigene[0]) : null,
    communityMittel,
  };
}
```

- [ ] **Step 4: Test laufen lassen, er muss bestehen**

Run: `npx tsx --test tests/bewertungen-teilen.test.ts`
Expected: PASS.

- [ ] **Step 5: `istRedaktionell` in `lib/query/strains.ts` durchreichen**

Drei Stellen, sonst nichts:
1. Typ `ReviewEintrag` (bei Zeile 166): nach `id: string;` einfügen
   ```ts
   /** true = Bewertung des Betreibers, false = Community (Zweitstimme). */
   istRedaktionell: boolean;
   ```
2. In `ladeStrainDetail`, Block `reviews: { where: { freigegeben: true }, … select: {` (bei Zeile 560): nach `id: true,` einfügen `istRedaktionell: true,`
3. In der Abbildung `reviews: zeile.reviews.map((review) => ({` (bei Zeile 644): nach `id: review.id,` einfügen `istRedaktionell: review.istRedaktionell,`

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: keine Fehler. (`BewertungsListe` und `TerpenMap` benutzen `ReviewEintrag` weiter; ein zusätzliches Feld bricht sie nicht.)

- [ ] **Step 7: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 6 erledigt: teileBewertungen, ReviewEintrag.istRedaktionell (eine Abfrage, Datenmodell unverändert).`

```bash
git add lib/query/bewertung.ts lib/query/strains.ts tests/bewertungen-teilen.test.ts HANDOFF.md
git commit -m "feat(daten): eigene und Community-Bewertungen trennen (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Doppelseite als gemeinsame Komponente

**Skills:** `ui-design-engine`, `emil-design-eng`, `better-accessibility`, `better-typography`

**Files:**
- Create: `components/review/eintrag.ts`, `components/review/Doppelseite.tsx`
- Move: `components/story/Netzdiagramm.tsx` → `components/review/Netzdiagramm.tsx` (`git mv`)
- Modify: `components/story/NeuesterEintrag.tsx`, `tests/netz.test.ts` (Pfad)
- Test: `tests/doppelseite.test.ts`

**Interfaces:**
- Consumes: `ReviewEintrag` mit `istRedaktionell` (Task 6), `parseGeschmacksMatrix`, `BEWERTUNGS_ACHSEN`, `bewerteFeuchtigkeit` (bestehend), `InstagramEmbed`, `baueEmbedUrl` (bestehend).
- Produces: `type EintragDaten`, `eintragAnker(id): string` (`eintrag-{id}`), `eintragHref(slug, id): string` (`/produkte/{slug}#eintrag-{id}`), `alsEintrag(review: ReviewEintrag, produkt: { handelsname: string; slug: string }): EintragDaten`, `Doppelseite({ eintrag: EintragDaten; umfang: "auszug" | "voll"; ueberschrift: "h2" | "h3"; story?: boolean })`, `Netzdiagramm({ matrix })` unter neuem Pfad.

- [ ] **Step 1: Failing test `tests/doppelseite.test.ts` anlegen**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Doppelseite, type DoppelseiteProps } from "@/components/review/Doppelseite";
import { alsEintrag, eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";

const MATRIX = { diesel: 1, zitrus: 0, erdig: 5, suess: 1, wuerzig: 4, blumig: 0, holzig: 2, kraeutrig: 2 };

function eintrag(teil: Partial<EintragDaten> = {}): EintragDaten {
  return {
    id: "r1",
    handelsname: "Nebelharz 22 (fiktiv)",
    slug: "nebelharz-22",
    aussehen: 5,
    geruch: 5,
    geschmack: 4,
    wirkung: 5,
    konsistenz: 4,
    geschmacksMatrix: MATRIX,
    feuchtigkeitProzent: 11.2,
    notiz: "Sehr dichte Blüten.",
    instagramReelUrl: null,
    chargenNr: "CH-2401",
    erstelltAm: new Date("2026-09-12T12:00:00Z"),
    ...teil,
  };
}

const zeige = (props: DoppelseiteProps) => renderToStaticMarkup(createElement(Doppelseite, props));

test("Auszug: vier Noten ohne Wirkung, Link springt auf den Eintrag", () => {
  const html = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" });
  assert.equal(html.match(/<dt/g)?.length, 4);
  assert.doesNotMatch(html, /Wirkung/);
  assert.match(html, /href="\/produkte\/nebelharz-22#eintrag-r1"/);
  assert.match(html, /line-clamp-3/);
  assert.match(html, />Nebelharz 22 \(fiktiv\)<\/h3>/);
});

test("Voll: fünf Noten, Überschrift mit Datum, Restfeuchte, kein Link", () => {
  const html = zeige({ eintrag: eintrag(), umfang: "voll", ueberschrift: "h3" });
  assert.equal(html.match(/<dt/g)?.length, 5);
  assert.match(html, /Wirkung/);
  assert.match(html, /Bewertung vom/);
  assert.match(html, /Restfeuchte optimal/);
  assert.doesNotMatch(html, /Ganzen Eintrag lesen/);
  assert.doesNotMatch(html, /line-clamp-3/);
});

test("Voll ohne Charge sagt es ausdrücklich", () => {
  const html = zeige({ eintrag: eintrag({ chargenNr: null }), umfang: "voll", ueberschrift: "h3" });
  assert.match(html, /Charge nicht angegeben/);
});

test("Id und Überschrift eindeutig je Eintrag", () => {
  const html = zeige({ eintrag: eintrag({ id: "r7" }), umfang: "auszug", ueberschrift: "h2" });
  assert.match(html, /<article id="eintrag-r7" aria-labelledby="eintrag-r7-titel"/);
  assert.match(html, /<h2 id="eintrag-r7-titel"/);
});

test("Story-Ziele nur, wenn die Startseite sie verlangt", () => {
  const ohne = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3" });
  assert.doesNotMatch(ohne, /data-story|data-zaehler/);
  const mit = zeige({ eintrag: eintrag(), umfang: "auszug", ueberschrift: "h3", story: true });
  assert.match(mit, /data-story="doppelseite"/);
  assert.equal(mit.match(/data-zaehler=""/g)?.length, 4);
  assert.match(mit, /data-ziel="5"/);
});

test("Reel nur im vollen Eintrag und nur mit gültiger eigener URL", () => {
  const gueltig = "https://www.instagram.com/reel/ABCdef12345/";
  assert.match(zeige({ eintrag: eintrag({ instagramReelUrl: gueltig }), umfang: "voll", ueberschrift: "h3" }), /<iframe/);
  assert.doesNotMatch(zeige({ eintrag: eintrag({ instagramReelUrl: gueltig }), umfang: "auszug", ueberschrift: "h3" }), /<iframe/);
  const fremd = zeige({ eintrag: eintrag({ instagramReelUrl: "https://example.com/reel/x" }), umfang: "voll", ueberschrift: "h3" });
  assert.doesNotMatch(fremd, /<iframe|Kein Video hinterlegt/);
});

test("Lange Handelsnamen brechen um statt überzulaufen", () => {
  const html = zeige({
    eintrag: eintrag({ handelsname: "Sehrlangerhandelsnameohneleerzeichenundmitvielenbuchstaben" }),
    umfang: "auszug",
    ueberschrift: "h3",
  });
  assert.match(html, /wrap-break-word/);
  assert.match(html, /hyphens-auto/);
});

test("alsEintrag: Name und Slug vom Produkt, kaputte Matrix wird neutral", () => {
  const e = alsEintrag(
    {
      id: "r1",
      istRedaktionell: true,
      aussehen: 4,
      geruch: 4,
      geschmack: 4,
      wirkung: 4,
      konsistenz: 4,
      feuchtigkeitProzent: null,
      geschmacksMatrix: "kaputt",
      notiz: null,
      instagramReelUrl: null,
      chargenNr: null,
      erstelltAm: new Date("2026-09-12T12:00:00Z"),
    },
    { handelsname: "Nebelharz 22 (fiktiv)", slug: "nebelharz-22" },
  );
  assert.equal(e.handelsname, "Nebelharz 22 (fiktiv)");
  assert.equal(e.slug, "nebelharz-22");
  assert.deepEqual(e.geschmacksMatrix, leereGeschmacksMatrix());
  assert.equal(eintragHref("nebelharz-22", "r1"), "/produkte/nebelharz-22#eintrag-r1");
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/doppelseite.test.ts`
Expected: FAIL mit „Cannot find module '@/components/review/Doppelseite'“.

- [ ] **Step 3: Netzdiagramm verschieben und den Pfad im Test nachziehen**

```bash
git mv components/story/Netzdiagramm.tsx components/review/Netzdiagramm.tsx
```

In `tests/netz.test.ts` Zeile 37: `"components/story/Netzdiagramm.tsx"` → `"components/review/Netzdiagramm.tsx"`.

- [ ] **Step 4: `components/review/eintrag.ts` anlegen**

```ts
import { parseGeschmacksMatrix, type GeschmacksMatrix } from "@/lib/query/bewertung";
import type { ReviewEintrag } from "@/lib/query/strains";

/** Was die Doppelseite braucht: eine Bewertung samt Produktname, Matrix geprueft. */
export type EintragDaten = {
  id: string;
  handelsname: string;
  slug: string;
  aussehen: number;
  geruch: number;
  geschmack: number;
  wirkung: number;
  konsistenz: number;
  geschmacksMatrix: GeschmacksMatrix;
  feuchtigkeitProzent: number | null;
  notiz: string | null;
  instagramReelUrl: string | null;
  chargenNr: string | null;
  erstelltAm: Date;
};

/** Sprungziel des vollstaendigen Eintrags auf der Produktseite. */
export function eintragAnker(id: string): string {
  return `eintrag-${id}`;
}

export function eintragHref(slug: string, id: string): string {
  return `/produkte/${slug}#${eintragAnker(id)}`;
}

/**
 * Eine Bewertung der Produktseite als Eintrag: Name und Slug kommen vom
 * Produkt, die Matrix aus der JSON-Spalte wird geprueft (kaputt = neutral).
 */
export function alsEintrag(
  review: ReviewEintrag,
  produkt: { handelsname: string; slug: string },
): EintragDaten {
  return {
    id: review.id,
    handelsname: produkt.handelsname,
    slug: produkt.slug,
    aussehen: review.aussehen,
    geruch: review.geruch,
    geschmack: review.geschmack,
    wirkung: review.wirkung,
    konsistenz: review.konsistenz,
    geschmacksMatrix: parseGeschmacksMatrix(review.geschmacksMatrix),
    feuchtigkeitProzent: review.feuchtigkeitProzent,
    notiz: review.notiz,
    instagramReelUrl: review.instagramReelUrl,
    chargenNr: review.chargenNr,
    erstelltAm: review.erstelltAm,
  };
}
```

- [ ] **Step 5: `components/review/Doppelseite.tsx` anlegen**

```tsx
import Link from "next/link";

import { InstagramEmbed, baueEmbedUrl } from "@/components/produkt/InstagramEmbed";
import { Netzdiagramm } from "@/components/review/Netzdiagramm";
import { eintragAnker, eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { Badge, buttonKlassen, type BadgeVariante } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereProzent } from "@/lib/format";
import {
  BEWERTUNGS_ACHSEN,
  bewerteFeuchtigkeit,
  type FeuchtigkeitsEinordnung,
} from "@/lib/query/bewertung";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * "Wirkung" nur im vollstaendigen Eintrag (Spec TP1 Abschnitt 2): gross
 * gesetzt laese sie sich oeffentlich als Wirksamkeitsversprechen.
 */
const AUSZUG_ACHSEN = BEWERTUNGS_ACHSEN.filter((achse) => achse.key !== "wirkung");

const FEUCHTIGKEIT: Record<FeuchtigkeitsEinordnung, { variante: BadgeVariante; label: string }> = {
  optimal: { variante: "success", label: "Restfeuchte optimal" },
  zu_trocken: { variante: "warning", label: "Zu trocken" },
  zu_feucht: { variante: "danger", label: "Zu feucht" },
  unbekannt: { variante: "neutral", label: "Restfeuchte unbekannt" },
};

export type DoppelseiteProps = {
  eintrag: EintragDaten;
  /** "auszug": Startseite und /reviews; "voll": Produktseite. */
  umfang: "auszug" | "voll";
  ueberschrift: "h2" | "h3";
  /** Nur die Startseite: Ziele fuer die StoryBuehne (aufschlagen, hochzaehlen). */
  story?: boolean;
};

/**
 * Eine Bewertung als aufgeschlagene Doppelseite (Spec TP2 4.3). Links
 * Kopf und Noten, rechts Geschmack, Notiz und im vollen Eintrag das Reel.
 * Id und Ueberschrift sind je Eintrag eindeutig, damit mehrere Doppelseiten
 * auf einer Seite stehen koennen und "Ganzen Eintrag lesen" darauf springt.
 */
export function Doppelseite({ eintrag, umfang, ueberschrift: Ueberschrift, story = false }: DoppelseiteProps) {
  const voll = umfang === "voll";
  const achsen = voll ? BEWERTUNGS_ACHSEN : AUSZUG_ACHSEN;
  const anker = eintragAnker(eintrag.id);
  const titelId = `${anker}-titel`;
  const datum = (
    <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm)}</time>
  );
  const feuchtigkeit = bewerteFeuchtigkeit(eintrag.feuchtigkeitProzent);
  const feuchtigkeitsText =
    eintrag.feuchtigkeitProzent === null
      ? FEUCHTIGKEIT[feuchtigkeit.einordnung].label
      : `${FEUCHTIGKEIT[feuchtigkeit.einordnung].label} · ${formatiereProzent(eintrag.feuchtigkeitProzent)}`;
  // Kein Ersatz aus der Umgebung: nur eine gueltige eigene URL ergibt ein Reel.
  const reel = voll && baueEmbedUrl(eintrag.instagramReelUrl) ? eintrag.instagramReelUrl : null;

  return (
    <article
      id={anker}
      aria-labelledby={titelId}
      data-story={story ? "doppelseite" : undefined}
      className="grid scroll-mt-8 grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:grid-cols-2"
    >
      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12 lg:border-r lg:border-border">
        <p className="text-small text-text-muted">
          {voll ? (
            eintrag.chargenNr ? (
              <>
                {"Charge "}
                <span className="numeric">{eintrag.chargenNr}</span>
              </>
            ) : (
              "Charge nicht angegeben"
            )
          ) : (
            <>
              {datum}
              {eintrag.chargenNr ? (
                <>
                  {" · Charge "}
                  <span className="numeric">{eintrag.chargenNr}</span>
                </>
              ) : null}
            </>
          )}
        </p>

        <Ueberschrift
          id={titelId}
          className="font-buch text-kapitel font-light text-text wrap-break-word hyphens-auto"
        >
          {voll ? <>Bewertung vom {datum}</> : eintrag.handelsname}
        </Ueberschrift>

        <dl className="grid grid-cols-2 gap-6">
          {achsen.map((achse) => (
            // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
            <div key={achse.key} className="flex flex-col gap-1">
              <dt className="text-small text-text-muted">{achse.label}</dt>
              <dd className="numeric text-h1 text-text">
                <span
                  aria-hidden="true"
                  {...(story ? { "data-zaehler": "", "data-ziel": eintrag[achse.key] } : {})}
                >
                  {NOTE.format(eintrag[achse.key])}
                </span>
                <span aria-hidden="true" className="text-h3 text-text-muted">
                  {" / 5"}
                </span>
                <span className="sr-only">{`${NOTE.format(eintrag[achse.key])} von 5`}</span>
              </dd>
            </div>
          ))}
        </dl>

        {voll ? (
          <div className="flex flex-col items-start gap-2">
            <Badge variante={FEUCHTIGKEIT[feuchtigkeit.einordnung].variante}>{feuchtigkeitsText}</Badge>
            <p className="max-w-[56ch] text-small text-text-muted">{feuchtigkeit.hinweis}</p>
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-8 p-6 sm:p-12">
        <Netzdiagramm matrix={eintrag.geschmacksMatrix} />
        {eintrag.notiz ? (
          <p
            className={cn(
              "max-w-[56ch] text-body",
              voll ? "text-text" : "line-clamp-3 text-text-muted",
            )}
          >
            {eintrag.notiz}
          </p>
        ) : null}
        {reel ? <InstagramEmbed url={reel} bezeichnung={eintrag.handelsname} /> : null}
        {voll ? null : (
          <p className="mt-auto">
            <Link href={eintragHref(eintrag.slug, eintrag.id)} className={buttonKlassen("secondary", "md")}>
              Ganzen Eintrag lesen
            </Link>
          </p>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 6: `components/story/NeuesterEintrag.tsx` auf die gemeinsame Doppelseite umstellen**

Die lokale Funktion `Doppelseite`, die Konstanten `NOTE` und `STARTSEITEN_ACHSEN` samt Kommentar und die Importe von `Netzdiagramm`, `formatiereDatum` und `BEWERTUNGS_ACHSEN` entfernen. Neuer Import:

```ts
import { Doppelseite } from "@/components/review/Doppelseite";
```

In `EintragInhalt` die letzte Zeile `return <Doppelseite review={review} />;` ersetzen durch:

```tsx
  return <Doppelseite eintrag={review} umfang="auszug" ueberschrift="h3" story />;
```

`RedaktionelleReview` passt strukturell auf `EintragDaten` (zusätzliches `strainId` stört nicht). `components/story/bewegung/eintrag.ts` bleibt unverändert: `data-story="doppelseite"`, `data-zaehler`, `data-ziel` stehen weiter im HTML.

- [ ] **Step 7: Tests und Typecheck**

Run: `npx tsx --test tests/doppelseite.test.ts tests/netz.test.ts && npm run typecheck`
Expected: PASS, keine Typfehler.

- [ ] **Step 8: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 7 erledigt: Doppelseite (auszug/voll, story) in components/review, Netzdiagramm umgezogen, Startseite nutzt sie.`

```bash
git add components/review components/story/NeuesterEintrag.tsx tests/doppelseite.test.ts tests/netz.test.ts HANDOFF.md
git commit -m "refactor(review): Doppelseite als gemeinsame Komponente, auszug und voll (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Titelblatt, Community-Stimmen, Datengrafik in Tinte

**Skills:** `ui-design-engine`, `better-typography`, `better-ui`, `better-writing`

**Files:**
- Create: `components/produkt/Titelblatt.tsx`, `components/review/CommunityStimmen.tsx`
- Modify: `components/produkt/CannabinoidBar.tsx`, `components/produkt/TerpenChips.tsx`, `components/produkt/BestandTabelle.tsx`
- Test: `tests/titelblatt.test.ts`, `tests/hover.test.ts`

**Interfaces:**
- Consumes: `textLinkKlassen` (Task 1), `ABSCHNITT_TITEL` (Task 3), `berechneGesamtnote`, `ReviewEintrag` (Task 6).
- Produces: `type MeineBewertung = { note: number; erstelltAm: Date; chargenNr: string | null }`, `Titelblatt(props: TitelblattProps)` mit `{ handelsname, kultivarName, kultivarTyp, darreichungsform, anzahlApothekenVerfuegbar, thcMin, thcMax, cbdMin, cbdMax, meineBewertung: MeineBewertung | null }`, `CommunityStimmen({ bewertungen: readonly ReviewEintrag[]; mittel: number })`.

- [ ] **Step 1: Failing tests anlegen**

`tests/titelblatt.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { Titelblatt, type TitelblattProps } from "@/components/produkt/Titelblatt";
import { CommunityStimmen } from "@/components/review/CommunityStimmen";
import type { ReviewEintrag } from "@/lib/query/strains";

const BASIS: TitelblattProps = {
  handelsname: "Nebelharz 22 (fiktiv)",
  kultivarName: "Nebelharz",
  kultivarTyp: "INDICA",
  darreichungsform: "BLUETE",
  anzahlApothekenVerfuegbar: 2,
  thcMin: 20,
  thcMax: 24,
  cbdMin: 0,
  cbdMax: 1,
  meineBewertung: null,
};
const zeige = (props: TitelblattProps) => renderToStaticMarkup(createElement(Titelblatt, props));
const TAG = new Date("2026-09-12T12:00:00Z");

test("Meine Note mit Datum und Charge", () => {
  const html = zeige({ ...BASIS, meineBewertung: { note: 4.6, erstelltAm: TAG, chargenNr: "CH-2401" } });
  assert.match(html, /Meine Note/);
  assert.match(html, />4,6</);
  assert.match(html, /Bewertet am 12\.09\.2026, Charge CH-2401/);
});

test("Meine Note ohne Charge: nur das Datum", () => {
  const html = zeige({ ...BASIS, meineBewertung: { note: 4, erstelltAm: TAG, chargenNr: null } });
  assert.match(html, /Bewertet am 12\.09\.2026</);
  assert.doesNotMatch(html, /Charge/);
});

test("ohne eigene Bewertung: noch nicht getestet, Weg zur Abstimmung", () => {
  const html = zeige(BASIS);
  assert.match(html, /Noch nicht von mir getestet\./);
  assert.match(html, /href="\/umfragen"[^>]*>Zur Abstimmung</);
  assert.doesNotMatch(html, /Meine Note/);
});

test("Titelblatt: Papier statt Glas, kein Bild, langer Name bricht um", () => {
  const html = zeige({ ...BASIS, handelsname: "Sehrlangerhandelsnameohneleerzeichenundmitvielenbuchstaben" });
  assert.doesNotMatch(html, /backdrop-blur|background-image|bg-surface\/95/);
  assert.match(html, /<h1[^>]*wrap-break-word/);
  assert.match(html, /hyphens-auto/);
});

test("Verfügbarkeit in der Einzahl", () => {
  assert.match(zeige({ ...BASIS, anzahlApothekenVerfuegbar: 1 }), /Bei 1 Apotheke verfügbar/);
  assert.match(zeige({ ...BASIS, anzahlApothekenVerfuegbar: 0 }), /Derzeit nicht lieferbar/);
});

function stimme(id: string, note: number, notiz: string | null): ReviewEintrag {
  return {
    id,
    istRedaktionell: false,
    aussehen: note,
    geruch: note,
    geschmack: note,
    wirkung: note,
    konsistenz: note,
    feuchtigkeitProzent: null,
    geschmacksMatrix: null,
    notiz,
    instagramReelUrl: null,
    chargenNr: null,
    erstelltAm: TAG,
  };
}

test("Community: Mittel in Einzahl und Mehrzahl als ganze Sätze", () => {
  const eine = renderToStaticMarkup(createElement(CommunityStimmen, { bewertungen: [stimme("c1", 3, null)], mittel: 3 }));
  assert.match(eine, /Aus einer Bewertung: <span class="numeric">3,0<\/span> von 5/);
  const zwei = renderToStaticMarkup(
    createElement(CommunityStimmen, { bewertungen: [stimme("c1", 3, "Gut."), stimme("c2", 4, null)], mittel: 3.5 }),
  );
  assert.match(zwei, /Mittel aus 2 Bewertungen: <span class="numeric">3,5<\/span> von 5/);
  assert.equal(zwei.match(/<li/g)?.length, 2);
  assert.match(zwei, /<h2[^>]*>Stimmen der Community<\/h2>/);
});

test("Datengrafik in Tinte, Terpen-Chips als Pillen ohne Grün", () => {
  const balken = renderToStaticMarkup(createElement(CannabinoidBar, { thcMin: 20, thcMax: 24, cbdMin: 0, cbdMax: 1 }));
  assert.doesNotMatch(balken, /bg-accent/);
  const chips = renderToStaticMarkup(
    createElement(TerpenChips, { terpene: [{ name: "Myrcen", rang: 1 }, { name: "Limonen", rang: 2 }] }),
  );
  assert.doesNotMatch(chips, /accent/);
  assert.match(chips, /rounded-full/);
  assert.match(chips, /border-2 border-text/);
});
```

`tests/hover.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Angefasste Dateien der Welle 1: Hover nie über Deckkraft (Spec TP2 3.10). */
export const DATEIEN = [
  "components/produkt/BestandTabelle.tsx",
  "components/produkt/CannabinoidBar.tsx",
  "components/produkt/TerpenChips.tsx",
  "components/produkt/Titelblatt.tsx",
  "components/review/CommunityStimmen.tsx",
  "components/review/Doppelseite.tsx",
];

test("kein Deckkraft-Hover in den angefassten Dateien", () => {
  const treffer = DATEIEN.filter((datei) => /hover:opacity/.test(readFileSync(join(process.cwd(), datei), "utf8")));
  assert.deepEqual(treffer, []);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/titelblatt.test.ts tests/hover.test.ts`
Expected: FAIL (fehlende Module `Titelblatt`, `CommunityStimmen`; `hover.test` findet `hover:opacity` in `BestandTabelle.tsx`).

- [ ] **Step 3: `components/produkt/Titelblatt.tsx` anlegen**

```tsx
import Link from "next/link";

import { Badge } from "@/components/ui";
import { textLinkKlassen } from "@/components/ui/textlink";
import type { Darreichungsform, KultivarTyp } from "@/db/enums";
import { formatiereDatum, formatiereProzentSpanne } from "@/lib/format";
import { darreichungsformLabel, kultivarTypLabel } from "@/lib/labels";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export type MeineBewertung = { note: number; erstelltAm: Date; chargenNr: string | null };

export type TitelblattProps = {
  handelsname: string;
  kultivarName: string | null;
  kultivarTyp: KultivarTyp;
  darreichungsform: Darreichungsform;
  anzahlApothekenVerfuegbar: number;
  thcMin: number;
  thcMax: number;
  cbdMin: number;
  cbdMax: number;
  /** Neueste eigene Bewertung; null = noch nicht getestet. */
  meineBewertung: MeineBewertung | null;
};

function verfuegbarkeit(anzahl: number): string {
  if (anzahl === 0) return "Derzeit nicht lieferbar";
  if (anzahl === 1) return "Bei 1 Apotheke verfügbar";
  return `Bei ${anzahl} Apotheken verfügbar`;
}

/**
 * Titelblatt der Produktseite (Spec TP2 4.3), ersetzt den Glas-Kopf: Papier
 * statt Glas, kein Herstellerbild (Leitplanke 5), kein Reel (es steht bei
 * seiner Bewertung). Drei Schriftgrade (kapitel, h3, small); die Badges
 * haben als Bauteil ihre eigene Groesse.
 */
export function Titelblatt(props: TitelblattProps) {
  return (
    <section
      aria-labelledby="produkt-titel"
      className="grid grid-cols-1 gap-8 border-b-2 border-border-strong pb-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"
    >
      <div className="flex min-w-0 flex-col gap-4">
        <h1
          id="produkt-titel"
          className="font-buch text-kapitel font-light text-balance text-text wrap-break-word hyphens-auto"
        >
          {props.handelsname}
        </h1>
        {props.kultivarName ? (
          <p className="font-buch text-h3 font-medium italic text-text">{props.kultivarName}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Badge variante="neutral">{kultivarTypLabel[props.kultivarTyp]}</Badge>
          <Badge variante="neutral">{darreichungsformLabel[props.darreichungsform]}</Badge>
          <Badge variante={props.anzahlApothekenVerfuegbar > 0 ? "success" : "danger"}>
            {verfuegbarkeit(props.anzahlApothekenVerfuegbar)}
          </Badge>
        </div>
        <p className="numeric text-h3 font-normal text-text">
          {`THC ${formatiereProzentSpanne(props.thcMin, props.thcMax)}`}
          <span aria-hidden="true">{" · "}</span>
          <span className="sr-only">, </span>
          {`CBD ${formatiereProzentSpanne(props.cbdMin, props.cbdMax)}`}
        </p>
      </div>
      <MeineNote bewertung={props.meineBewertung} />
    </section>
  );
}

/** "Meine Note" ist die Gesamtnote der neuesten eigenen Bewertung, kein Mittel mit der Community. */
function MeineNote({ bewertung }: { bewertung: MeineBewertung | null }) {
  if (!bewertung) {
    return (
      <div className="flex flex-col gap-2 lg:items-end lg:text-right">
        <p className="text-h3 font-normal text-text">Noch nicht von mir getestet.</p>
        <Link href="/umfragen" className={textLinkKlassen("text-small")}>
          Zur Abstimmung
        </Link>
      </div>
    );
  }

  const datum = formatiereDatum(bewertung.erstelltAm);
  return (
    <div className="flex flex-col gap-2 lg:items-end lg:text-right">
      <p className="text-small text-text-muted">Meine Note</p>
      <p className="numeric text-kapitel font-normal text-text">
        {NOTE.format(bewertung.note)}
        <span aria-hidden="true" className="text-h3 text-text-muted">
          {" / 5"}
        </span>
        <span className="sr-only"> von 5</span>
      </p>
      <p className="text-small text-text-muted">
        {bewertung.chargenNr ? `Bewertet am ${datum}, Charge ${bewertung.chargenNr}` : `Bewertet am ${datum}`}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: `components/review/CommunityStimmen.tsx` anlegen**

```tsx
import { ABSCHNITT_TITEL } from "@/components/layout/Seitenkopf";
import { formatiereDatum } from "@/lib/format";
import { berechneGesamtnote } from "@/lib/query/bewertung";
import type { ReviewEintrag } from "@/lib/query/strains";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Die Zweitstimme (Spec TP2 4.3, Punkt 6): Community-Bewertungen getrennt
 * von den eigenen, mit eigenem Mittel. Die Seite zeigt den Abschnitt nur,
 * wenn es mindestens eine gibt.
 */
export function CommunityStimmen({
  bewertungen,
  mittel,
}: {
  bewertungen: readonly ReviewEintrag[];
  mittel: number;
}) {
  const anzahl = bewertungen.length;
  return (
    <section aria-labelledby="community-titel" className="flex flex-col gap-8">
      <h2 id="community-titel" className={ABSCHNITT_TITEL}>
        Stimmen der Community
      </h2>
      <p className="text-body text-text">
        {anzahl === 1 ? "Aus einer Bewertung: " : `Mittel aus ${anzahl} Bewertungen: `}
        <span className="numeric">{NOTE.format(mittel)}</span>
        {" von 5"}
      </p>
      <ul className="flex flex-col divide-y divide-border">
        {bewertungen.map((bewertung) => (
          <li key={bewertung.id} className="grid grid-cols-1 gap-2 py-6 sm:grid-cols-[8rem_1fr] sm:gap-8">
            <p className="numeric text-h2 font-normal text-text">
              {NOTE.format(berechneGesamtnote(bewertung))}
              <span aria-hidden="true" className="text-small text-text-muted">
                {" / 5"}
              </span>
              <span className="sr-only"> von 5</span>
            </p>
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-small text-text-muted">
                <time dateTime={bewertung.erstelltAm.toISOString()}>{formatiereDatum(bewertung.erstelltAm)}</time>
                {bewertung.chargenNr ? `, Charge ${bewertung.chargenNr}` : null}
              </p>
              {bewertung.notiz ? <p className="max-w-[68ch] text-body text-text">{bewertung.notiz}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: `CannabinoidBar.tsx` in Tinte setzen**

- `balkenKlasse="bg-accent"` → `balkenKlasse="bg-text"`
- `balkenKlasse="bg-border-strong"` → `balkenKlasse="bg-text-muted"`
- Die drei Kommentare mit Geviertstrich umformulieren (Zeilen 25, 31, 72): `—` durch einen Doppelpunkt bzw. Punkt ersetzen, z. B. `/* Die Zahl steht immer daneben, der Balken ist nur Redundanz. */`.

- [ ] **Step 6: `TerpenChips.tsx` als Pillen in Tinte**

Die Klassen des `li` ersetzen durch:

```tsx
            className={cn(
              // py-1 = 4px: Textzeile in einer Pille, wie beim Badge.
              "inline-flex items-baseline gap-2 rounded-full border bg-surface-raised px-4 py-1 text-small text-text",
              dominant ? "border-2 border-text font-medium" : "border-border-strong",
            )}
```

Den Kommentar mit Geviertstrich (Zeile 21) umformulieren: `… markiert, nicht durch Farbe.`

- [ ] **Step 7: `BestandTabelle.tsx` auf die Link-Klasse umstellen**

Beim Apotheken-Link (bei Zeile 87) `className="rounded-sm text-accent underline hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"` ersetzen durch `className={textLinkKlassen()}` und `import { textLinkKlassen } from "@/components/ui/textlink";` ergänzen. Weitere `hover:opacity`-Stellen in der Datei ebenso.

- [ ] **Step 8: Tests laufen lassen, sie müssen bestehen**

Run: `npx tsx --test tests/titelblatt.test.ts tests/hover.test.ts && npm run typecheck`
Expected: PASS, keine Typfehler.

- [ ] **Step 9: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 8 erledigt: Titelblatt, CommunityStimmen, Balken und Chips in Tinte, BestandTabelle-Links.`

```bash
git add components/produkt/Titelblatt.tsx components/review/CommunityStimmen.tsx components/produkt/CannabinoidBar.tsx components/produkt/TerpenChips.tsx components/produkt/BestandTabelle.tsx tests/titelblatt.test.ts tests/hover.test.ts HANDOFF.md
git commit -m "feat(produkt): Titelblatt, Community-Stimmen, Datengrafik in Tinte (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Produktseite als vollständiger Eintrag, Prüfskript

**Skills:** `ui-design-engine`, `frontend-design`, `better-layout`, `react-best-practices`

**Files:**
- Create: `scripts/seiten-pruefen.ts`
- Modify: `app/produkte/[slug]/page.tsx` (ganze Datei)
- Delete: `components/produkt/GlasHeader.tsx`, `components/produkt/TerpenMap.tsx`, `components/produkt/BewertungsListe.tsx`
- Test: `tests/hover.test.ts` (Liste erweitern), Prüfskript gegen den Dev-Server

**Interfaces:**
- Consumes: `Titelblatt`, `MeineBewertung` (Task 8), `CommunityStimmen` (Task 8), `Doppelseite`, `alsEintrag` (Task 7), `Netzdiagramm` (Task 7), `teileBewertungen` (Task 6), `Faktenliste`, `Fakt`, `textLinkKlassen` (Task 1), `seitenRahmen`, `ABSCHNITT_TITEL` (Task 3), `TitelblattSkelett` (Task 3).
- Produces: `npx tsx scripts/seiten-pruefen.ts <pfad…>` (Exit 1 bei Verstoß), von Task 10, 12, 13 und den Wellen 2 und 3 benutzt.

- [ ] **Step 1: Prüfskript `scripts/seiten-pruefen.ts` anlegen**

```ts
/**
 * Prueft ausgelieferte Seiten gegen Spec TP2 9.2 und 9.3: kein Geviertstrich,
 * kein Gedankenstrich als Trenner (Zahlenbereiche wie "22,0 – 28,0 %" sind
 * erlaubt), keine Umschrift, genau ein h1, keine doppelten Ids.
 * Aufruf gegen den laufenden Dev-Server:
 *   npx tsx scripts/seiten-pruefen.ts /reviews /umfragen /produkte/nebelharz-22
 * Das Gate-Cookie entsteht aus SITE_SESSION_SECRET in .env.local; der Wert
 * wird nie ausgegeben.
 */
import { readFileSync } from "node:fs";

import { COOKIE_NAME, tokenErzeugen } from "../lib/gate";

const BASIS = process.env.PRUEF_BASIS ?? "http://localhost:3000";

function geheimnis(): string {
  const zeile = readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .find((z) => z.startsWith("SITE_SESSION_SECRET="));
  if (!zeile) throw new Error("SITE_SESSION_SECRET fehlt in .env.local");
  return zeile.slice("SITE_SESSION_SECRET=".length).trim().replace(/^"|"$/g, "");
}

/** Sichtbarer Text ungefaehr: Skripte und Styles raus, Tags raus. */
function sichtbar(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
}

const REGELN: { name: string; muster: RegExp }[] = [
  { name: "Geviertstrich", muster: /—/ },
  { name: "Gedankenstrich als Trenner", muster: /(?<!\d)\s–\s|\s–\s(?!\d)/ },
  { name: "Umschrift", muster: /\b(fuer|oeffentlich|Uebersicht|aendern|koennen|muessen)\b/ },
];

async function pruefe(pfad: string, cookie: string): Promise<string[]> {
  const antwort = await fetch(`${BASIS}${pfad}`, { headers: { cookie }, redirect: "manual" });
  if (antwort.status !== 200 && antwort.status !== 404) return [`Status ${antwort.status}`];
  const html = await antwort.text();
  const text = sichtbar(html);
  const fehler = REGELN.filter((regel) => regel.muster.test(text)).map((regel) => {
    const stelle = text.search(regel.muster);
    return `${regel.name}: "${text.slice(Math.max(0, stelle - 40), stelle + 40).replace(/\s+/g, " ")}"`;
  });
  const h1 = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1 !== 1) fehler.push(`${h1} h1 statt genau einem`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((treffer) => treffer[1]);
  const doppelt = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (doppelt.length > 0) fehler.push(`doppelte Ids: ${doppelt.join(", ")}`);
  return fehler;
}

async function main() {
  const pfade = process.argv.slice(2);
  if (pfade.length === 0) throw new Error("Aufruf: npx tsx scripts/seiten-pruefen.ts /pfad …");
  const cookie = `${COOKIE_NAME}=${await tokenErzeugen(geheimnis(), "besucher")}`;
  let verstoesse = 0;
  for (const pfad of pfade) {
    const fehler = await pruefe(pfad, cookie);
    verstoesse += fehler.length;
    console.log(fehler.length === 0 ? `ok   ${pfad}` : `FEHL ${pfad}\n  ${fehler.join("\n  ")}`);
  }
  process.exitCode = verstoesse > 0 ? 1 : 0;
}

main();
```

- [ ] **Step 2: Dev-Server starten (falls er nicht läuft) und die alte Seite prüfen**

Run (im Hintergrund, `run_in_background`): `npm run dev`
Dann: `npx tsx scripts/seiten-pruefen.ts /produkte/nebelharz-22`
Expected: FEHL mit „Geviertstrich“ (der Glas-Kopf schreibt „— Mittel aus …“). Das ist der rote Zustand für diese Seite. Hängen gestreamte Inhalte (HANDOFF „Was beim Umsetzen anders kam“, Punkt 3): Dev-Server beenden, `.next` löschen, neu starten.

- [ ] **Step 3: `hover.test.ts` erweitern**

In `DATEIEN` ergänzen: `"app/produkte/[slug]/page.tsx"`.

Run: `npx tsx --test tests/hover.test.ts`
Expected: FAIL (die alte Seite hat `hover:opacity-70`).

- [ ] **Step 4: `app/produkte/[slug]/page.tsx` ersetzen**

```tsx
import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ABSCHNITT_TITEL, seitenRahmen } from "@/components/layout/Seitenkopf";
import { TitelblattSkelett } from "@/components/layout/Skelette";
import { BestandTabelle } from "@/components/produkt/BestandTabelle";
import { CannabinoidBar } from "@/components/produkt/CannabinoidBar";
import { TerpenChips } from "@/components/produkt/TerpenChips";
import { Titelblatt } from "@/components/produkt/Titelblatt";
import { CommunityStimmen } from "@/components/review/CommunityStimmen";
import { Doppelseite } from "@/components/review/Doppelseite";
import { Netzdiagramm } from "@/components/review/Netzdiagramm";
import { alsEintrag } from "@/components/review/eintrag";
import {
  Faktenliste,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  textLinkKlassen,
  type Fakt,
} from "@/components/ui";
import type { Bestrahlung } from "@/db/enums";
import { cn } from "@/lib/cn";
import {
  formatiereDatum,
  formatiereGramm,
  formatiereProzent,
  formatiereProzentSpanne,
} from "@/lib/format";
import { bestrahlungLabel, darreichungsformLabel, kultivarTypLabel } from "@/lib/labels";
import { teileBewertungen, verdichteGeschmacksMatrix } from "@/lib/query/bewertung";
import { istFachkreis } from "@/lib/query/fachkreis";
import { ladeStrainDetail, type StrainDetail, type UnternehmenEintrag } from "@/lib/query/strains";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine zur Buildzeit
 * erreichbare Datenbank - das D1-Binding existiert erst im Request. Entfaellt,
 * sobald ISR und die R2-Bindings stehen; dann gehoert hier
 * `generateStaticParams` hin (edge-stack-master, Caching-Kaskade Stufe 1).
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/produkte/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const strain = await ladeStrainDetail(slug, false);
  if (!strain) return { title: "Produkt nicht gefunden" };
  return {
    title: strain.handelsname,
    description: `Meine Bewertung, Cannabinoid- und Terpenprofil, Chargen und gemeldete Apothekenbestände zu ${strain.handelsname}.`,
  };
}

const ABSTAND = "mt-16 sm:mt-24";

function unternehmenWert(eintrag: UnternehmenEintrag): ReactNode {
  const name = eintrag.website ? (
    <a href={eintrag.website} rel="noopener noreferrer" target="_blank" className={textLinkKlassen("break-all")}>
      {eintrag.name}
    </a>
  ) : (
    eintrag.name
  );
  if (!eintrag.land) return name;
  return (
    <>
      {name} <span className="text-text-muted">({eintrag.land})</span>
    </>
  );
}

function produktFakten(strain: StrainDetail): Fakt[] {
  return [
    { begriff: "Handelsname", wert: strain.handelsname },
    { begriff: "Kultivar", wert: strain.kultivarName ?? "k. A." },
    { begriff: "Kultivartyp", wert: kultivarTypLabel[strain.kultivarTyp] },
    { begriff: "Darreichungsform", wert: darreichungsformLabel[strain.darreichungsform] },
    { begriff: "Genetik", wert: strain.genetik ?? "k. A." },
    { begriff: "PZN", wert: strain.pzn ? <span className="numeric">{strain.pzn}</span> : "k. A." },
    {
      begriff: "Bestrahlung",
      wert: bestrahlungLabel[strain.bestrahlung as Bestrahlung] ?? strain.bestrahlung,
    },
    { begriff: "Anbauland", wert: strain.anbauland ?? "k. A." },
    { begriff: "Hersteller", wert: strain.hersteller ? unternehmenWert(strain.hersteller) : "k. A." },
    { begriff: "Importeur", wert: strain.importeur ? unternehmenWert(strain.importeur) : "k. A." },
    {
      begriff: "Verschreibungspflicht",
      wert: strain.verschreibungspflichtig ? "Verschreibungspflichtig" : "Nicht verschreibungspflichtig",
    },
    { begriff: "BfArM-Listung", wert: strain.bfarmGelistet ? "Gelistet" : "Nicht gelistet" },
  ];
}

/**
 * Chargentabelle. Die gemessenen Werte einer Charge stehen bewusst neben der
 * deklarierten Spanne und werden nicht mit ihr verrechnet: zwei Chargen
 * desselben Handelsnamens koennen deutlich abweichen, und genau das ist die
 * Information.
 */
function Chargentabelle({ chargen }: { chargen: StrainDetail["chargen"] }) {
  if (chargen.length === 0) {
    return <p className="text-body text-text-muted">Für dieses Produkt liegen keine Chargendaten vor.</p>;
  }
  return (
    <Table caption="Analysewerte je Charge" captionVersteckt>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Charge</TableHeaderCell>
          <TableHeaderCell numerisch>THC gemessen</TableHeaderCell>
          <TableHeaderCell numerisch>CBD gemessen</TableHeaderCell>
          <TableHeaderCell>Analysedatum</TableHeaderCell>
          <TableHeaderCell>Verfall</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {chargen.map((charge) => (
          <TableRow key={charge.id}>
            <TableCell>
              <span className="numeric">{charge.chargenNr}</span>
            </TableCell>
            <TableCell numerisch>{formatiereProzent(charge.thcIst)}</TableCell>
            <TableCell numerisch>{formatiereProzent(charge.cbdIst)}</TableCell>
            <TableCell>{formatiereDatum(charge.analysedatum)}</TableCell>
            <TableCell>{formatiereDatum(charge.verfallsdatum)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Der vollstaendige Eintrag (Spec TP2 4.3): der Kern vorn. Titelblatt, meine
 * Bewertungen, Geschmacksprofil, Community, dann die Produktdaten. Leere
 * Abschnitte entfallen, statt einen Leerzustand zu zeigen (Spec 13.3).
 */
async function ProduktInhalt({ slug }: { slug: string }) {
  const fachkreis = await istFachkreis();
  const strain = await ladeStrainDetail(slug, fachkreis);
  if (!strain) notFound();

  const { eigene, community, meineNote, communityMittel } = teileBewertungen(strain.reviews);
  const neuesteEigene = eigene[0];
  const geschmack = verdichteGeschmacksMatrix(strain.reviews);
  const produkt = { handelsname: strain.handelsname, slug: strain.slug };
  const packungsgroessen = [...new Set(strain.bestaende.map((bestand) => bestand.packungGramm))].sort(
    (a, b) => a - b,
  );

  return (
    <>
      <Titelblatt
        handelsname={strain.handelsname}
        kultivarName={strain.kultivarName}
        kultivarTyp={strain.kultivarTyp}
        darreichungsform={strain.darreichungsform}
        anzahlApothekenVerfuegbar={strain.anzahlApothekenVerfuegbar}
        thcMin={strain.thcMinProzent}
        thcMax={strain.thcMaxProzent}
        cbdMin={strain.cbdMinProzent}
        cbdMax={strain.cbdMaxProzent}
        meineBewertung={
          neuesteEigene && meineNote !== null
            ? { note: meineNote, erstelltAm: neuesteEigene.erstelltAm, chargenNr: neuesteEigene.chargenNr }
            : null
        }
      />

      {strain.beschreibung ? (
        <p className="mt-8 max-w-[68ch] text-body text-pretty text-text">{strain.beschreibung}</p>
      ) : null}

      {eigene.length > 0 ? (
        <section aria-labelledby="meine-titel" className={cn(ABSTAND, "flex flex-col gap-8")}>
          <h2 id="meine-titel" className={ABSCHNITT_TITEL}>
            {eigene.length === 1 ? "Meine Bewertung" : "Meine Bewertungen"}
          </h2>
          {eigene.map((review) => (
            <Doppelseite key={review.id} eintrag={alsEintrag(review, produkt)} umfang="voll" ueberschrift="h3" />
          ))}
        </section>
      ) : null}

      {geschmack.anzahlBewertungen >= 2 ? (
        <section aria-labelledby="geschmack-titel" className={cn(ABSTAND, "flex flex-col gap-4")}>
          <h2 id="geschmack-titel" className={ABSCHNITT_TITEL}>
            Geschmacksprofil
          </h2>
          <p className="text-small text-text-muted">{`Aus ${geschmack.anzahlBewertungen} Bewertungen`}</p>
          <div className="mt-4 max-w-xl">
            <Netzdiagramm matrix={geschmack.matrix} />
          </div>
        </section>
      ) : null}

      {community.length > 0 && communityMittel !== null ? (
        <div className={ABSTAND}>
          <CommunityStimmen bewertungen={community} mittel={communityMittel} />
        </div>
      ) : null}

      <section aria-labelledby="daten-titel" className={ABSTAND}>
        <h2 id="daten-titel" className={ABSCHNITT_TITEL}>
          Produktdaten
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <Faktenliste zeilen={produktFakten(strain)} />
          <div className="flex flex-col gap-12">
            <div>
              <h3 className="text-h3 text-text">Wirkstoffspannen</h3>
              <CannabinoidBar
                className="mt-4"
                thcMin={strain.thcMinProzent}
                thcMax={strain.thcMaxProzent}
                cbdMin={strain.cbdMinProzent}
                cbdMax={strain.cbdMaxProzent}
              />
              <p className="mt-4 text-caption text-text-muted">
                {`Herstellerangabe: ${formatiereProzentSpanne(strain.thcMinProzent, strain.thcMaxProzent)} THC, ${formatiereProzentSpanne(strain.cbdMinProzent, strain.cbdMaxProzent)} CBD.`}
              </p>
            </div>
            <div>
              <h3 className="text-h3 text-text">Terpenprofil</h3>
              <p className="mt-2 text-small text-text-muted">Rang 1 ist das dominante Terpen.</p>
              <TerpenChips className="mt-4" terpene={strain.terpene} />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="chargen-titel" className={ABSTAND}>
        <h2 id="chargen-titel" className={ABSCHNITT_TITEL}>
          Chargen
        </h2>
        <p className="mt-2 max-w-[68ch] text-small text-text-muted">
          Gemessene Werte einzelner Chargen. Sie können innerhalb der zulässigen Toleranz von der deklarierten
          Spanne abweichen.
        </p>
        <div className="mt-8">
          <Chargentabelle chargen={strain.chargen} />
        </div>
      </section>

      <section aria-labelledby="bestaende-titel" className={ABSTAND}>
        <h2 id="bestaende-titel" className={ABSCHNITT_TITEL}>
          Apothekenbestände
        </h2>
        <p className="mt-2 max-w-[68ch] text-small text-text-muted">
          Von den Apotheken gemeldeter Stand, keine Verfügbarkeitszusage.
        </p>
        <div className="mt-8">
          <BestandTabelle bestaende={strain.bestaende} fachkreis={fachkreis} />
        </div>
      </section>

      <p className={cn(ABSTAND, "text-caption text-text-muted")}>
        {`Gemeldete Packungsgrößen: ${
          packungsgroessen.length > 0 ? packungsgroessen.map((gramm) => formatiereGramm(gramm)).join(", ") : "keine"
        }. Stand der Produktdaten: ${formatiereDatum(strain.aktualisiertAm)}.`}
      </p>
    </>
  );
}

export default async function ProduktDetailPage({ params }: PageProps<"/produkte/[slug]">) {
  const { slug } = await params;
  return (
    <div className={cn(seitenRahmen(), "pt-16 pb-24 sm:pt-24")}>
      <p className="mb-8 text-small">
        <Link href="/produkte" className={textLinkKlassen()}>
          Alle Produkte
        </Link>
      </p>
      <Suspense fallback={<TitelblattSkelett />}>
        <ProduktInhalt slug={slug} />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 5: Die abgelösten Komponenten löschen**

```bash
git rm components/produkt/GlasHeader.tsx components/produkt/TerpenMap.tsx components/produkt/BewertungsListe.tsx
```

Run: `npm run typecheck`
Expected: keine Fehler (nur die alte Produktseite hat diese drei importiert; geprüft beim Planen).

- [ ] **Step 6: Tests und Prüfskript**

Run: `npx tsx --test tests/hover.test.ts && npx tsx scripts/seiten-pruefen.ts /produkte/nebelharz-22 /produkte/pfefferstern-extrakt /produkte/gibt-es-nicht`
Expected: PASS; `ok` für alle drei Pfade (`/produkte/gibt-es-nicht` ist die 404-Seite und hat heute genau ein `h1`). Meldet „Umschrift“ eine Stelle aus Datenbankinhalt (Seed-Notizen wie „Blueten“), ist das Inhalt, kein Oberflächentext: im Prüfbericht notieren, nicht im Code ändern. Doppelte Ids oder ein fehlendes bzw. zweites `h1` sind dagegen echte Befunde und werden behoben.

- [ ] **Step 7: Community-Stimme lokal anlegen, ansehen, wieder löschen**

Die Seed-Daten enthalten nur eigene Bewertungen. Für die Sichtprüfung von Abschnitt 6 eine Community-Bewertung vorübergehend anlegen:

```bash
npx wrangler d1 execute cn-medcan-db --local --command "INSERT INTO reviews (id, strain_id, aussehen, geruch, geschmack, wirkung, konsistenz, geschmacks_matrix, notiz, freigegeben, ist_redaktionell, aktualisiert_am) SELECT 'tp2-community-test', id, 3, 4, 3, 3, 4, '{\"diesel\":0,\"zitrus\":3,\"erdig\":2,\"suess\":1,\"wuerzig\":1,\"blumig\":2,\"holzig\":1,\"kraeutrig\":1}', 'Testeintrag der Community.', 1, 0, CURRENT_TIMESTAMP FROM strains WHERE slug = 'nebelharz-22'"
```

Im Browser `/produkte/nebelharz-22` öffnen: Titelblatt mit „Meine Note“ (eigene Bewertung aus dem Seed), „Meine Bewertung“ mit voller Doppelseite (fünf Noten, Restfeuchte, Reel falls die Seed-URL gültig ist), „Geschmacksprofil“ „Aus 2 Bewertungen“, „Stimmen der Community“ mit „Aus einer Bewertung: 3,4 von 5“, danach Produktdaten, Chargen, Bestände. Danach löschen:

```bash
npx wrangler d1 execute cn-medcan-db --local --command "DELETE FROM reviews WHERE id = 'tp2-community-test'"
```

Expected: beide Befehle „1 command executed successfully“ bzw. ohne Fehler; die Seite zeigt danach keinen Community-Abschnitt und kein Geschmacksprofil mehr (nur eine Bewertung).

- [ ] **Step 8: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 9 erledigt: Produktseite als vollständiger Eintrag, Prüfskript scripts/seiten-pruefen.ts, GlasHeader/TerpenMap/BewertungsListe entfernt.`

```bash
git add scripts/seiten-pruefen.ts app/produkte/[slug]/page.tsx tests/hover.test.ts HANDOFF.md
git commit -m "feat(produkt): Produktseite als vollstaendiger Eintrag, Kern vorn (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: `/reviews` mit Doppelseite und Inhaltsverzeichnis

**Skills:** `ui-design-engine`, `frontend-design`, `better-typography`, `better-writing`

**Files:**
- Create: `components/review/Inhaltsverzeichnis.tsx`
- Modify: `app/reviews/page.tsx` (ganze Datei)
- Delete: `components/review/ReviewKarte.tsx`
- Test: `tests/inhaltsverzeichnis.test.ts`, `tests/hover.test.ts` (Liste)

**Interfaces:**
- Consumes: `EintragDaten`, `eintragHref` (Task 7), `Doppelseite` (Task 7), `namenLinkKlassen` (Task 1), `Seitenkopf`, `seitenRahmen`, `ABSCHNITT_TITEL` (Task 3), `DoppelseitenSkelett` (bestehend), `berechneGesamtnote`, `redaktionelleReviews()` (bestehend).
- Produces: `Inhaltsverzeichnis({ eintraege: readonly EintragDaten[] })`.

- [ ] **Step 1: Failing test `tests/inhaltsverzeichnis.test.ts` anlegen**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Inhaltsverzeichnis } from "@/components/review/Inhaltsverzeichnis";
import type { EintragDaten } from "@/components/review/eintrag";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";

function eintrag(id: string, handelsname: string, note: number, chargenNr: string | null): EintragDaten {
  return {
    id,
    handelsname,
    slug: id,
    aussehen: note,
    geruch: note,
    geschmack: note,
    wirkung: note,
    konsistenz: note,
    geschmacksMatrix: leereGeschmacksMatrix(),
    feuchtigkeitProzent: null,
    notiz: null,
    instagramReelUrl: null,
    chargenNr,
    erstelltAm: new Date("2026-09-12T12:00:00Z"),
  };
}

test("je Eintrag eine Zeile mit Sprunglink, Note und Datum", () => {
  const html = renderToStaticMarkup(
    createElement(Inhaltsverzeichnis, {
      eintraege: [eintrag("a", "Nebelharz 22", 4.2, "CH-1"), eintrag("b", "Zitronensegel 18", 3.8, null)],
    }),
  );
  assert.equal(html.match(/<li/g)?.length, 2);
  assert.match(html, /href="\/produkte\/a#eintrag-a"/);
  assert.match(html, />4,2</);
  assert.match(html, /12\.09\.2026/);
  assert.match(html, /Charge <span class="numeric">CH-1<\/span>/);
});

test("Punktlinie ist Dekoration, lange Namen brechen um", () => {
  const html = renderToStaticMarkup(
    createElement(Inhaltsverzeichnis, {
      eintraege: [eintrag("a", "Sehrlangerhandelsnameohneleerzeichenundmitvielenbuchstaben", 4, null)],
    }),
  );
  assert.match(html, /<span aria-hidden="true" class="[^"]*border-dotted/);
  assert.match(html, /wrap-break-word/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/inhaltsverzeichnis.test.ts`
Expected: FAIL mit „Cannot find module '@/components/review/Inhaltsverzeichnis'“.

- [ ] **Step 3: `components/review/Inhaltsverzeichnis.tsx` anlegen**

```tsx
import Link from "next/link";

import { eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { namenLinkKlassen } from "@/components/ui/textlink";
import { formatiereDatum } from "@/lib/format";
import { berechneGesamtnote } from "@/lib/query/bewertung";

const NOTE = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Alle Eintraege wie hinten in einem Buch (Spec TP2 4.1): Name, Punktlinie,
 * Note. Die ganze Zeile ist Klickflaeche (after:inset-0), der Name ist der
 * eine Link. Er springt auf den vollstaendigen Eintrag der Produktseite.
 */
export function Inhaltsverzeichnis({ eintraege }: { eintraege: readonly EintragDaten[] }) {
  return (
    <ol className="flex flex-col">
      {eintraege.map((eintrag) => (
        <li key={eintrag.id} className="relative py-4">
          <div className="flex items-baseline gap-4">
            <Link
              href={eintragHref(eintrag.slug, eintrag.id)}
              className={namenLinkKlassen(
                "min-w-0 font-buch text-h2 font-medium wrap-break-word after:absolute after:inset-0",
              )}
            >
              {eintrag.handelsname}
            </Link>
            <span aria-hidden="true" className="min-w-8 grow border-b border-dotted border-border-strong" />
            <span className="numeric shrink-0 text-h2 font-normal text-text">
              {NOTE.format(berechneGesamtnote(eintrag))}
              <span className="sr-only"> von 5</span>
            </span>
          </div>
          <p className="mt-2 text-small text-text-muted">
            <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm)}</time>
            {eintrag.chargenNr ? (
              <>
                {" · Charge "}
                <span className="numeric">{eintrag.chargenNr}</span>
              </>
            ) : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Test laufen lassen, er muss bestehen**

Run: `npx tsx --test tests/inhaltsverzeichnis.test.ts`
Expected: PASS.

- [ ] **Step 5: `app/reviews/page.tsx` ersetzen**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ABSCHNITT_TITEL, Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Doppelseite } from "@/components/review/Doppelseite";
import { Inhaltsverzeichnis } from "@/components/review/Inhaltsverzeichnis";
import { DoppelseitenSkelett } from "@/components/story/Skelette";
import { EmptyState, buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { redaktionelleReviews } from "@/lib/query/reviews";

/**
 * Kein Prerender zur Buildzeit: es gibt derzeit keine erreichbare Datenbank.
 * Anders als `/` und `/umfragen` ist diese Seite nicht nutzerbezogen - sie
 * ist der erste Kandidat fuer ISR, sobald die R2-Bindings stehen.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bewertungen",
  description: "Meine Bewertungen nach festem Schema, jeweils an eine konkrete Charge gebunden.",
};

/** Das Buch selbst (Spec TP2 4.1): der neueste Eintrag gross, alle im Inhaltsverzeichnis. */
async function ReviewsInhalt() {
  const reviews = await redaktionelleReviews();

  if (reviews.length === 0) {
    return (
      <EmptyState
        titel="Das erste Kapitel wird gerade geschrieben."
        beschreibung="Welche Sorte ich zuerst teste, entscheidet die Abstimmung."
        aktion={
          <Link href="/umfragen" className={buttonKlassen("secondary")}>
            Zur Abstimmung
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <section aria-labelledby="neueste-titel" className="flex flex-col gap-8">
        <h2 id="neueste-titel" className={ABSCHNITT_TITEL}>
          Der neueste Eintrag
        </h2>
        <Doppelseite eintrag={reviews[0]} umfang="auszug" ueberschrift="h3" />
      </section>

      {reviews.length > 1 ? (
        <section aria-labelledby="alle-titel" className="flex flex-col gap-8">
          <h2 id="alle-titel" className={ABSCHNITT_TITEL}>
            Alle Einträge
          </h2>
          <Inhaltsverzeichnis eintraege={reviews} />
        </section>
      ) : null}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <>
      <Seitenkopf
        titel="Bewertungen"
        satz="Jede Sorte teste ich nach demselben Schema und schreibe dazu, welche Charge es war."
      />
      <div className={cn(seitenRahmen(), "pt-12 pb-24 sm:pt-16")}>
        <Suspense fallback={<DoppelseitenSkelett />}>
          <ReviewsInhalt />
        </Suspense>
      </div>
    </>
  );
}
```

- [ ] **Step 6: `ReviewKarte` löschen, Liste im Hover-Test erweitern**

```bash
git rm components/review/ReviewKarte.tsx
```

In `tests/hover.test.ts` `DATEIEN` ergänzen: `"app/reviews/page.tsx"`, `"components/review/Inhaltsverzeichnis.tsx"`.

- [ ] **Step 7: Typecheck, Tests, Prüfskript**

Run: `npm run typecheck && npx tsx --test tests/inhaltsverzeichnis.test.ts tests/hover.test.ts && npx tsx scripts/seiten-pruefen.ts /reviews /`
Expected: keine Typfehler, PASS, `ok /reviews`, `ok /` (die Startseite nutzt die neue Doppelseite; genau ein `h1`, keine doppelten Ids).

- [ ] **Step 8: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 10 erledigt: /reviews mit Doppelseite und Inhaltsverzeichnis, ReviewKarte entfernt.`

```bash
git add components/review/Inhaltsverzeichnis.tsx app/reviews/page.tsx tests/inhaltsverzeichnis.test.ts tests/hover.test.ts HANDOFF.md
git commit -m "feat(reviews): Doppelseite und Inhaltsverzeichnis (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Stimmzettel als einzige Darstellung der Runde

**Skills:** `ui-design-engine`, `better-writing`, `better-accessibility`

**Files:**
- Modify: `components/umfrage/UmfrageKarte.tsx` (ganze Datei), `components/story/Abstimmung.tsx` (eine Zeile)
- Test: `tests/umfrage-karte.test.ts`

**Interfaces:**
- Consumes: `namenLinkKlassen` (Task 1), `Textur`, `StimmFormular`, `Badge`, `buttonKlassen` (bestehend).
- Produces: `UmfrageKarte({ umfrage, zustand, className?, ort?: "startseite" | "umfragen" })` ohne `darstellung`; `type StimmZustand` unverändert. `ort` steuert nur die Ziele der Links (Anmelden kehrt zurück, „Sorte vorschlagen“ springt auf `#vorschlaege`).

- [ ] **Step 1: Failing test `tests/umfrage-karte.test.ts` anlegen**

Die Karte importiert `StimmFormular` mit einer Server Action (`server-only`) und lässt sich deshalb nicht rendern (Ledger TP1, Task 12). Geprüft wird die Quelle:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const QUELLE = readFileSync(join(process.cwd(), "components/umfrage/UmfrageKarte.tsx"), "utf8");

test("Stimmbalken in Tinte, nicht in Blattgrün", () => {
  assert.doesNotMatch(QUELLE, /bg-accent\b/);
  assert.match(QUELLE, /bg-text\b/);
});

test("Begriffe: freigeschaltet statt Freigabe, Ich statt Betreiber", () => {
  assert.doesNotMatch(QUELLE, /Freigabe ausstehend|freigegebene Mitglieder|des Betreibers|Vom Betreiber/);
  assert.match(QUELLE, /Noch nicht freigeschaltet/);
});

test("nur noch der Stimmzettel, keine Karten-Variante", () => {
  assert.doesNotMatch(QUELLE, /darstellung|CardHeader|CardBody|CardFooter|<Card\b/);
});

test("Anmelden führt auf die Seite zurück, auf der der Stimmzettel steht", () => {
  assert.match(QUELLE, /%2Fumfragen/);
  assert.match(QUELLE, /#vorschlaege/);
});

test("Knöpfe mit 44 px", () => {
  assert.doesNotMatch(QUELLE, /buttonKlassen\("[a-z]+", "sm"\)/);
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/umfrage-karte.test.ts`
Expected: FAIL in allen fünf Tests.

- [ ] **Step 3: `components/umfrage/UmfrageKarte.tsx` ersetzen**

```tsx
import Link from "next/link";

import { Textur } from "@/components/medien/Textur";
import { Badge, buttonKlassen } from "@/components/ui";
import { namenLinkKlassen } from "@/components/ui/textlink";
import { StimmFormular } from "@/components/umfrage/StimmFormular";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereRelativ } from "@/lib/format";
import type { UmfrageAnsicht, UmfrageOptionAnsicht } from "@/lib/query/umfragen";
import type { UmfragePhase } from "@/db/enums";

const ZAHL_FORMATTER = new Intl.NumberFormat("de-DE");

const PHASEN_LABEL: Record<UmfragePhase, string> = {
  VORSCHLAG: "Vorschlagsphase",
  ABSTIMMUNG: "Abstimmung läuft",
  BEENDET: "Runde beendet",
};

/**
 * Der Zustand des Betrachters gegenueber dieser Runde.
 *
 * Er wird von der Seite aus `lib/session.ts` bestimmt und hier nur
 * angezeigt. Die Komponente entscheidet ueber keine Berechtigung - das tut
 * die Server Action, und zwar noch einmal.
 */
export type StimmZustand =
  | { art: "ANONYM" }
  | { art: "FREIGABE_OFFEN" }
  | { art: "STIMMBERECHTIGT" }
  | { art: "ABGESTIMMT"; optionId: string };

/** Wo der Stimmzettel steht: bestimmt nur die Ziele der Links. */
export type StimmzettelOrt = "startseite" | "umfragen";

const ZIELE: Record<StimmzettelOrt, { anmelden: string; vorschlagen: string }> = {
  startseite: { anmelden: "/anmelden?weiter=%2F", vorschlagen: "/umfragen#vorschlaege" },
  umfragen: { anmelden: "/anmelden?weiter=%2Fumfragen", vorschlagen: "#vorschlaege" },
};

type Props = {
  umfrage: UmfrageAnsicht;
  zustand: StimmZustand;
  className?: string;
  ort?: StimmzettelOrt;
};

function stimmenAnteil(option: UmfrageOptionAnsicht, gesamt: number): number {
  if (option.stimmen === null || gesamt <= 0) return 0;
  return Math.min(Math.max(option.stimmen / gesamt, 0), 1) * 100;
}

/**
 * Ein Kandidat. Auf dem Stimmzettel spricht das Buch: Handelsnamen in
 * Cormorant (Brand Guideline 10). Gesetzte Plaetze tragen keinen Zaehler
 * und keinen Balken: `stimmen` ist dort `null` ("steht nicht zur Wahl"),
 * nicht `0` ("niemand wollte sie").
 */
function Kandidat({
  option,
  gesamt,
  gewaehlt,
  zeigeStimmen,
}: {
  option: UmfrageOptionAnsicht;
  gesamt: number;
  gewaehlt: boolean;
  zeigeStimmen: boolean;
}) {
  const name = (
    <Link
      href={`/produkte/${option.slug}`}
      className={namenLinkKlassen("font-buch text-h3 font-medium wrap-break-word")}
      title={option.handelsname}
    >
      {option.handelsname}
    </Link>
  );

  return (
    <li className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {option.herkunft === "COMMUNITY" ? (
          <span className="relative isolate inline-block min-w-0">
            <Textur id="nebel" story="spruehmarke" weich className="absolute -inset-x-4 -inset-y-2 -z-10 opacity-40" />
            {name}
          </span>
        ) : (
          name
        )}

        <span className="flex items-center gap-2">
          {option.herkunft === "GESETZT" ? (
            <span className="stempel" title="Von mir gesetzt, nicht zur Wahl gestellt">
              Gesetzt
            </span>
          ) : null}
          {option.istGewinner ? <Badge variante="success">Gewinner</Badge> : null}
          {gewaehlt ? <Badge variante="accent">Deine Stimme</Badge> : null}
          {zeigeStimmen && option.stimmen !== null ? (
            <span className="numeric text-small text-text">
              {`${ZAHL_FORMATTER.format(option.stimmen)} ${option.stimmen === 1 ? "Stimme" : "Stimmen"}`}
            </span>
          ) : null}
        </span>
      </div>

      {zeigeStimmen && option.stimmen !== null ? (
        <span aria-hidden="true" className="mt-2 flex h-2 w-full overflow-hidden bg-surface-sunken">
          {/* Datengrafik in Tinte, nicht in Blattgruen: Gruen ist Bedienung. */}
          <span className="block h-full bg-text" style={{ width: `${stimmenAnteil(option, gesamt)}%` }} />
        </span>
      ) : null}
    </li>
  );
}

/** Die Zeile unter den Kandidaten: abstimmen, oder warum nicht. */
function Aktionsbereich({
  umfrage,
  zustand,
  ort,
}: {
  umfrage: UmfrageAnsicht;
  zustand: StimmZustand;
  ort: StimmzettelOrt;
}) {
  if (umfrage.phase === "BEENDET") {
    return (
      <p className="text-small text-text-muted">
        Diese Runde ist abgeschlossen. Das Ergebnis ist verbindlich für meine nächste Bewertung.
      </p>
    );
  }

  if (umfrage.phase === "VORSCHLAG") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-small text-text-muted">
          Es werden noch Sorten vorgeschlagen. Die Abstimmung beginnt danach.
        </p>
        <Link href={ZIELE[ort].vorschlagen} className={buttonKlassen("secondary", "md")}>
          Sorte vorschlagen
        </Link>
      </div>
    );
  }

  // Ab hier: ABSTIMMUNG.
  if (zustand.art === "ANONYM") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-small text-text-muted">
          Abstimmen kannst du, sobald du angemeldet und freigeschaltet bist.
        </p>
        <Link href={ZIELE[ort].anmelden} className={buttonKlassen("primary", "md")}>
          Anmelden
        </Link>
      </div>
    );
  }

  if (zustand.art === "FREIGABE_OFFEN") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge variante="warning">Noch nicht freigeschaltet</Badge>
        <p className="text-small text-text-muted">Sobald ich dein Konto freischalte, kannst du abstimmen.</p>
      </div>
    );
  }

  if (zustand.art === "ABGESTIMMT") {
    return (
      <p role="status" className="text-small text-text">
        <span className="font-medium">Deine Stimme ist gezählt. </span>
        <span className="text-text-muted">Eine Änderung ist nicht vorgesehen.</span>
      </p>
    );
  }

  const waehlbar = umfrage.optionen.filter((option) => option.herkunft === "COMMUNITY");
  if (waehlbar.length === 0) {
    return (
      <p className="text-small text-text-muted">In dieser Runde stehen alle Plätze fest. Es gibt nichts zu wählen.</p>
    );
  }

  return <StimmFormular umfrageId={umfrage.id} optionen={waehlbar} />;
}

/**
 * Die laufende Runde als Stimmzettel an der Wand (Spec TP2 4.2), auf der
 * Startseite und auf /umfragen gleich. Gesetzte Plaetze gestempelt, waehlbare
 * gespruht markiert. Server Component.
 */
export function UmfrageKarte({ umfrage, zustand, className, ort = "startseite" }: Props) {
  const zeigeStimmen = umfrage.phase !== "VORSCHLAG";
  // Die eigene Stimme haengt an derselben Bedingung wie die Zaehler: in der
  // Vorschlagsphase gibt es fachlich keine Stimmen, also darf dort auch kein
  // "Deine Stimme" stehen.
  const gewaehlteOption = zeigeStimmen && zustand.art === "ABGESTIMMT" ? zustand.optionId : null;

  const frist = umfrage.phase === "VORSCHLAG" ? umfrage.vorschlagBisAm : umfrage.endetAm;
  const fristLabel = umfrage.phase === "VORSCHLAG" ? "Vorschläge bis" : "Abstimmung bis";

  return (
    <div className={cn("stimmzettel border border-border-strong bg-surface-raised shadow-lg", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <Badge variante="accent">{PHASEN_LABEL[umfrage.phase]}</Badge>
        {frist && umfrage.phase !== "BEENDET" ? (
          <p className="text-small text-text-muted">
            {`${fristLabel} `}
            <time dateTime={frist.toISOString()} className="font-medium text-text">
              {formatiereDatum(frist)}
            </time>
            {` (${formatiereRelativ(frist)})`}
          </p>
        ) : null}
      </div>

      <div className="px-6 py-6">
        <h3 className="max-w-[68ch] text-h2 text-text">{umfrage.titel}</h3>
        {umfrage.beschreibung ? (
          <p className="mt-4 max-w-[68ch] text-body text-text-muted">{umfrage.beschreibung}</p>
        ) : null}

        <ul className="mt-8 flex flex-col">
          {umfrage.optionen.map((option) => (
            <Kandidat
              key={option.id}
              option={option}
              gesamt={umfrage.stimmenGesamt}
              gewaehlt={option.id === gewaehlteOption}
              zeigeStimmen={zeigeStimmen}
            />
          ))}
        </ul>

        {zeigeStimmen ? (
          <p className="numeric mt-8 text-small text-text-muted">
            {`${ZAHL_FORMATTER.format(umfrage.stimmenGesamt)} ${umfrage.stimmenGesamt === 1 ? "abgegebene Stimme" : "abgegebene Stimmen"}`}
          </p>
        ) : null}
      </div>

      <div className="border-t border-border bg-surface-raised px-6 py-4">
        <Aktionsbereich umfrage={umfrage} zustand={zustand} ort={ort} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `components/story/Abstimmung.tsx` anpassen**

`<UmfrageKarte umfrage={umfrage} zustand={stimmZustand(mitglied, optionId)} darstellung="wand" />` → `<UmfrageKarte umfrage={umfrage} zustand={stimmZustand(mitglied, optionId)} />` (`ort` ist standardmäßig `"startseite"`).

- [ ] **Step 5: Tests und Typecheck**

Run: `npx tsx --test tests/umfrage-karte.test.ts tests/stimmzustand.test.ts && npm run typecheck`
Expected: PASS, keine Typfehler (`app/umfragen/page.tsx` übergibt heute keine `darstellung` und bekommt bis Task 12 den Stimmzettel mit `ort="startseite"`).

- [ ] **Step 6: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 11 erledigt: UmfrageKarte nur noch Stimmzettel, Balken in Tinte, Begriffe freigeschaltet, ort-Prop.`

```bash
git add components/umfrage/UmfrageKarte.tsx components/story/Abstimmung.tsx tests/umfrage-karte.test.ts HANDOFF.md
git commit -m "refactor(umfrage): Stimmzettel als einzige Darstellung, Begriffe (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: `/umfragen`, hier spricht die Wand

**Skills:** `ui-design-engine`, `frontend-design`, `better-writing`, `better-layout`

**Files:**
- Create: `components/umfrage/zeitraum.ts`
- Modify: `app/umfragen/page.tsx` (ganze Datei)
- Test: `tests/zeitraum.test.ts`, `tests/hover.test.ts` (Liste)

**Interfaces:**
- Consumes: `UmfrageKarte` mit `ort` (Task 11), `stimmZustand` (bestehend), `Blatt`, `namenLinkKlassen`, `textLinkKlassen` (Task 1), `Seitenkopf`, `seitenRahmen`, `ABSCHNITT_TITEL` (Task 3), `EmptyState` (Task 2), `StimmzettelSkelett` (bestehend), `Textur` (bestehend).
- Produces: `rundenZeitraum(start: Date, ende: Date | null): string`.

- [ ] **Step 1: Failing test `tests/zeitraum.test.ts` anlegen**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { rundenZeitraum } from "@/components/umfrage/zeitraum";

test("Runde mit Ende: von bis, ohne Gedankenstrich", () => {
  assert.equal(
    rundenZeitraum(new Date("2026-09-12T12:00:00Z"), new Date("2026-09-24T12:00:00Z")),
    "12.09.2026 bis 24.09.2026",
  );
});

test("Runde ohne Ende: seit", () => {
  assert.equal(rundenZeitraum(new Date("2026-09-12T12:00:00Z"), null), "seit 12.09.2026");
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/zeitraum.test.ts`
Expected: FAIL mit „Cannot find module '@/components/umfrage/zeitraum'“.

- [ ] **Step 3: `components/umfrage/zeitraum.ts` anlegen**

```ts
import { formatiereDatum } from "@/lib/format";

/** Zeitraum einer Runde in Worten, ohne Gedankenstrich (Spec TP2 4.2). */
export function rundenZeitraum(start: Date, ende: Date | null): string {
  return ende ? `${formatiereDatum(start)} bis ${formatiereDatum(ende)}` : `seit ${formatiereDatum(start)}`;
}
```

- [ ] **Step 4: Test laufen lassen, er muss bestehen**

Run: `npx tsx --test tests/zeitraum.test.ts`
Expected: PASS.

- [ ] **Step 5: `app/umfragen/page.tsx` ersetzen**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { ABSCHNITT_TITEL, Seitenkopf, seitenRahmen } from "@/components/layout/Seitenkopf";
import { Textur } from "@/components/medien/Textur";
import { StimmzettelSkelett } from "@/components/story/Skelette";
import { Badge, Blatt, EmptyState, buttonKlassen, namenLinkKlassen, textLinkKlassen } from "@/components/ui";
import { UmfrageKarte } from "@/components/umfrage/UmfrageKarte";
import { VorschlagFormular } from "@/components/umfrage/VorschlagFormular";
import { stimmZustand } from "@/components/umfrage/stimmzustand";
import { rundenZeitraum } from "@/components/umfrage/zeitraum";
import type { UmfragePhase } from "@/db/enums";
import { cn } from "@/lib/cn";
import { formatiereDatum } from "@/lib/format";
import { ladeStrainAuswahl } from "@/lib/query/strains";
import {
  aktiveUmfrage,
  eigeneStimme,
  umfragenUebersicht,
  vorschlaegeLaden,
  type UmfrageUebersicht,
} from "@/lib/query/umfragen";
import { aktuellesMitglied } from "@/lib/session";

/** Nutzerbezogen (eigene Stimme, Freischaltung) - siehe app/page.tsx. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abstimmung",
  description: "Laufende und vergangene Runden: Ihr schlagt Sorten vor und wählt, was ich als Nächstes teste.",
};

const PHASEN_LABEL: Record<UmfragePhase, string> = {
  VORSCHLAG: "Vorschlagsphase",
  ABSTIMMUNG: "Abstimmung",
  BEENDET: "Beendet",
};

/** Wand-Ueberschrift: kurz, Imperativ, in Sprühviolett (Guideline 8). */
const WAND_TITEL = "font-wand text-tag text-spray";

function RundenZeile({ runde }: { runde: UmfrageUebersicht }) {
  return (
    <li className="grid grid-cols-1 gap-2 py-6 md:grid-cols-[minmax(0,1fr)_auto] md:gap-8">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="font-buch text-h2 font-medium text-text wrap-break-word">{runde.titel}</p>
        <p className="numeric text-small text-text-muted">{rundenZeitraum(runde.startAm, runde.endetAm)}</p>
        {runde.gewinner.length > 0 ? (
          <p className="text-body text-text">
            {"Gewonnen: "}
            {runde.gewinner.map((gewinner, index) => (
              <span key={gewinner.slug}>
                {index > 0 ? ", " : null}
                <Link href={`/produkte/${gewinner.slug}`} className={textLinkKlassen()}>
                  {gewinner.handelsname}
                </Link>
              </span>
            ))}
          </p>
        ) : null}
      </div>
      <div>
        <Badge variante={runde.istAktiv ? "accent" : "neutral"}>{PHASEN_LABEL[runde.phase]}</Badge>
      </div>
    </li>
  );
}

/**
 * Hier spricht die Wand (Spec TP2 4.2): Tags in Sedgwick, Namen und
 * Begruendungen im Buchstil. Der Stimmzustand entsteht wie auf der
 * Startseite ueber stimmZustand(); ueber das Schreiben entscheidet die
 * Server Action erneut.
 */
async function UmfragenInhalt() {
  const [umfrage, mitglied] = await Promise.all([aktiveUmfrage(), aktuellesMitglied()]);
  const optionId = umfrage && mitglied?.freigegeben ? await eigeneStimme(umfrage.id, mitglied.mitgliedId) : null;
  const zustand = stimmZustand(mitglied, optionId);

  // Das Vorschlagsformular braucht die Katalogliste. Sie wird nur geladen,
  // wenn sie auch angezeigt wird - sonst waere es eine Abfrage fuer nichts.
  const darfVorschlagen = umfrage?.phase === "VORSCHLAG" && mitglied?.freigegeben === true;

  const [vorschlaege, strains, runden] = await Promise.all([
    umfrage ? vorschlaegeLaden(umfrage.id) : Promise.resolve([]),
    darfVorschlagen ? ladeStrainAuswahl() : Promise.resolve([]),
    umfragenUebersicht(),
  ]);

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <section aria-labelledby="runde-titel" className="flex flex-col gap-8">
        {umfrage ? (
          <>
            <h2 id="runde-titel" className={cn(WAND_TITEL, "-rotate-2 self-start")}>
              {umfrage.phase === "VORSCHLAG" ? "Schlag vor." : "Stimm ab."}
            </h2>
            <UmfrageKarte umfrage={umfrage} zustand={zustand} ort="umfragen" />
          </>
        ) : (
          <>
            <h2 id="runde-titel" className="sr-only">
              Laufende Runde
            </h2>
            <EmptyState
              titel="Gerade läuft keine Runde."
              beschreibung="Die nächste steht hier, sobald sie eröffnet ist."
            />
          </>
        )}
      </section>

      {umfrage ? (
        <section id="vorschlaege" aria-labelledby="vorschlaege-titel" className="flex scroll-mt-8 flex-col gap-8">
          <div className="relative isolate self-start">
            <Textur id="nebel" weich className="absolute -inset-x-8 -inset-y-4 -z-10 opacity-40" />
            <h2 id="vorschlaege-titel" className={cn(WAND_TITEL, "-rotate-1")}>
              Eure Vorschläge.
            </h2>
          </div>

          {darfVorschlagen ? (
            <Blatt className="max-w-3xl">
              <h3 className="text-h3 text-text">Dein Vorschlag</h3>
              <div className="mt-6">
                <VorschlagFormular
                  umfrageId={umfrage.id}
                  strains={strains.map((strain) => ({ wert: strain.id, label: strain.handelsname }))}
                />
              </div>
            </Blatt>
          ) : null}

          {umfrage.phase === "VORSCHLAG" && !mitglied ? (
            <div className="flex flex-wrap items-center gap-4">
              <p className="text-body text-text-muted">
                Vorschlagen kannst du, sobald du angemeldet und freigeschaltet bist.
              </p>
              <Link href="/anmelden?weiter=%2Fumfragen" className={buttonKlassen("primary")}>
                Anmelden
              </Link>
            </div>
          ) : null}

          {umfrage.phase === "VORSCHLAG" && mitglied && !mitglied.freigegeben ? (
            <p className="text-body text-text-muted">Sobald ich dein Konto freischalte, kannst du hier vorschlagen.</p>
          ) : null}

          {vorschlaege.length === 0 ? (
            <p className="text-body text-text-muted">Noch kein Vorschlag in dieser Runde.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {vorschlaege.map((vorschlag) => (
                <li key={vorschlag.id} className="flex flex-col gap-2 py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <Link
                      href={`/produkte/${vorschlag.slug}`}
                      className={namenLinkKlassen("min-w-0 font-buch text-h2 font-medium wrap-break-word")}
                    >
                      {vorschlag.handelsname}
                    </Link>
                    {vorschlag.uebernommen ? (
                      <Badge variante="success">Auf der Wahlliste</Badge>
                    ) : (
                      <Badge variante="neutral">Offen</Badge>
                    )}
                  </div>
                  <p className="text-small text-text-muted">
                    {`Von ${vorschlag.vonAnzeigename}, ${formatiereDatum(vorschlag.erstelltAm)}`}
                  </p>
                  {vorschlag.begruendung ? (
                    <p className="max-w-[68ch] text-body text-text">{vorschlag.begruendung}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="runden-titel" className="flex flex-col gap-8">
        <h2 id="runden-titel" className={ABSCHNITT_TITEL}>
          Alle Runden
        </h2>
        {runden.length === 0 ? (
          <EmptyState titel="Noch keine Runden." beschreibung="Hier steht jede Runde, sobald die erste eröffnet ist." />
        ) : (
          <ol className="flex flex-col divide-y divide-border">
            {runden.map((runde) => (
              <RundenZeile key={runde.id} runde={runde} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

export default function UmfragenPage() {
  return (
    <>
      <Seitenkopf titel="Abstimmung" satz="Ihr schlagt Sorten vor und wählt. Was gewinnt, teste ich als Nächstes." />
      <div className={cn(seitenRahmen(), "pt-12 pb-24 sm:pt-16")}>
        <Suspense fallback={<StimmzettelSkelett />}>
          <UmfragenInhalt />
        </Suspense>
      </div>
    </>
  );
}
```

- [ ] **Step 6: Hover-Liste erweitern, Typecheck, Tests, Prüfskript**

In `tests/hover.test.ts` `DATEIEN` ergänzen: `"app/umfragen/page.tsx"`, `"components/umfrage/UmfrageKarte.tsx"`.

Run: `npm run typecheck && npx tsx --test tests/zeitraum.test.ts tests/hover.test.ts && npx tsx scripts/seiten-pruefen.ts /umfragen /`
Expected: keine Typfehler, PASS, `ok /umfragen`, `ok /`.

- [ ] **Step 7: Stimmzustände lokal ansehen**

Lokal läuft keine Runde (Ledger TP1, Task 12). Eine Runde über `/admin` eröffnen (angemeldet als Betreiber; der Nutzer hat lokal ein Admin-Konto) und nacheinander ansehen: `/umfragen` abgemeldet (Vorschlagsphase: Satz und „Anmelden“), angemeldet ohne Freischaltung (Satz „Sobald ich dein Konto freischalte …“), freigeschaltet (Blatt „Dein Vorschlag“). Einen Vorschlag einreichen, übernehmen, in die Abstimmung schalten, abstimmen: Balken in Tinte, „Deine Stimme“. Danach die Testrunde lokal löschen, wie in HANDOFF Block B Schritt 7 beschrieben (Tabellen `umfragen`, `umfrage_optionen`, `umfrage_vorschlaege`, `stimmen`), **außer** der Runde „test“ des Nutzers, die bleibt. Geht das Anmelden im Browserwerkzeug nicht (HANDOFF Schritt 5/6, Punkt 5), diesen Schritt als „nicht verifiziert“ melden.

- [ ] **Step 8: HANDOFF-Zeile und Commit**

`HANDOFF.md`: `- Welle 1, Task 12 erledigt: /umfragen mit Wand-Tags, Stimmzettel, Vorschlagsblatt, Chronik.`

```bash
git add components/umfrage/zeitraum.ts app/umfragen/page.tsx tests/zeitraum.test.ts tests/hover.test.ts HANDOFF.md
git commit -m "feat(umfragen): Wand, Stimmzettel, Vorschlagsblatt und Chronik (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Abschlussprüfung, Review, Live-Gang

**Skills:** `superpowers:verification-before-completion`, `better-interface` (samt `better-layout`, `better-typography`, `better-accessibility`, `better-ui`, `better-writing`), `web-design-guidelines`, `cloudflare:web-perf`

**Files:**
- Modify: `tests/texte.test.ts` (Listen), `components/ui/Field.tsx`, `components/ui/RangeSlider.tsx`, `components/ui/Select.tsx`, `components/ui/Spinner.tsx` (nur Kommentare), `HANDOFF.md`

- [ ] **Step 1: Texttest auf die Dateien der Welle 1 ausweiten**

In `tests/texte.test.ts`:

```ts
const ORDNER = [
  "components/story",
  "components/story/bewegung",
  "components/layout",
  "components/marke",
  "components/medien",
  "components/review",
  "components/umfrage",
  "components/ui",
];
const DATEIEN = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/error.tsx",
  "app/reviews/page.tsx",
  "app/umfragen/page.tsx",
  "app/produkte/[slug]/page.tsx",
  "components/produkt/Titelblatt.tsx",
  "components/produkt/CannabinoidBar.tsx",
  "components/produkt/TerpenChips.tsx",
  "components/produkt/BestandTabelle.tsx",
  "lib/navigation.ts",
];
```

Run: `npx tsx --test tests/texte.test.ts`
Expected: FAIL mit den Kommentarzeilen in `components/ui/Field.tsx:12`, `RangeSlider.tsx:21`, `Select.tsx:20`, `Spinner.tsx:12` (und jeder weiteren Fundstelle, die der Test nennt).

- [ ] **Step 2: Die genannten Kommentare umformulieren**

Je Fundstelle den Geviertstrich durch Doppelpunkt, Komma oder Punkt ersetzen, Inhalt gleich. Beispiel `Field.tsx:12`: `/** Muss eindeutig sein: verbindet `<label for>` mit dem Feld. */`.

Run: `npx tsx --test tests/texte.test.ts`
Expected: PASS.

- [ ] **Step 3: Alles automatisch Prüfbare**

Run: `npm test && npm run typecheck && npx eslint . && npm run farben && npm run build`
Expected: alle Tests grün, keine Typ- oder Lintfehler, Farben ohne Verstoß, Build erfolgreich. Die Build-Ausgabe notieren (Routen, Größe `/`); `/reviews`, `/umfragen`, `/produkte/[slug]` bleiben dynamisch.

- [ ] **Step 4: Prüfskript über alle angefassten Seiten**

Dev-Server laufen lassen (nach dem Build ggf. neu starten).

Run: `npx tsx scripts/seiten-pruefen.ts / /reviews /umfragen /produkte/nebelharz-22 /produkte/pfefferstern-extrakt /gibt-es-nicht`
Expected: sechsmal `ok`.

- [ ] **Step 5: Sichtprüfung im Browser (Spec 9, Punkte 4 bis 10)**

Browser-Erweiterung verbinden (`list_connected_browsers`, `select_browser`, `tabs_context_mcp`; leer: Nutzer bittet, Chrome neu zu starten; bei „Permission denied“ sofort sagen, dass ein Freigabe-Fenster wartet). Messungen nur im sichtbaren Tab. Je Punkt Ergebnis notieren:
1. Kopf: 1440 px eine Zeile, aktive Seite unterstrichen und `aria-current="page"` (per `javascript_tool`: `document.querySelector('[aria-current="page"]')?.textContent`); 390 px: Wortmarke und „Mein Konto“ oben, Leiste darunter wischbar, dritter Punkt schaut an.
2. `/reviews`, `/umfragen`, `/produkte/nebelharz-22` hell und dunkel (`document.documentElement.dataset.theme = "dark"`), 390 und 1440 px, kein seitliches Überlaufen (`document.documentElement.scrollWidth <= innerWidth`).
3. Tastatur: Tab durch Kopf, Seitenkopf, Doppelseite, Inhaltsverzeichnis, Stimmzettel; Fokus überall sichtbar.
4. 200 % Textzoom (Chrome-Zoom 200 %): nichts abgeschnitten.
5. Ohne JavaScript (DevTools-Einstellung oder `curl`-HTML): Inhalte der drei Seiten vollständig.
6. Startseite: Doppelseite schlägt auf, Zähler enden auf den Endwerten, Konsole ohne Fehler; „Ganzen Eintrag lesen“ springt auf `#eintrag-…` der Produktseite.
7. Leerzustand `/reviews`: nicht lokal herstellbar ohne Daten zu löschen; wird live geprüft (Cloud-D1 leer).
Nicht Prüfbares ausdrücklich als „nicht verifiziert“ notieren.

- [ ] **Step 6: Review mit `better-interface` und `web-design-guidelines`**

Umfang: `git diff main...makeover/tp2-welle-1` ohne Tests und Doku. Befunde nach Schweregrad; HIGH und MEDIUM beheben (je mit Test RED→GREEN, wo testbar), LOW beheben oder begründet offen lassen. Nach Korrekturen Step 3 und 4 wiederholen.

- [ ] **Step 7: HANDOFF schreiben, committen, Go erfragen**

`HANDOFF.md`, Teilprojekt-2-Block: Welle 1 umgesetzt auf `makeover/tp2-welle-1`, Prüfbericht in Kurzform (grün, nicht verifiziert, offene Befunde), nächster Schritt „Go für den Live-Gang“, danach `/interface-review` durch den Nutzer und Plan für Welle 2.

```bash
git add tests/texte.test.ts components/ui/Field.tsx components/ui/RangeSlider.tsx components/ui/Select.tsx components/ui/Spinner.tsx HANDOFF.md
git commit -m "test: Texte der Welle 1 ohne Trennstriche, Pruefbericht (TP2 Welle 1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Dem Nutzer kurz sagen, was live geht, und um das Go bitten. Nicht nach Citrix fragen (seit 2026-09-24 aufgehoben, Memory `netzwerk-schonen`).

- [ ] **Step 8: Nach dem Go: zusammenführen und pushen**

```bash
git switch main
git merge --ff-only makeover/tp2-welle-1
git push origin main
```

Expected: Push erfolgreich. Bei Netzfehler: nicht wiederholen, melden.

- [ ] **Step 9: Live prüfen (einmal, kein Polling)**

Nach Rückmeldung des Nutzers, dass der Build durch ist (oder einmal im Dashboard unter Worker, Deployments): auf `https://cn-medcan.w-helwich.workers.dev` mit Gate-Cookie (HANDOFF: einmal `fetch` POST auf `/api/zugang` mit `SITE_PASSWORD` aus `.env.local`, Wert nie ausgeben) im sichtbaren Tab `/reviews` (Leerzustand „Das erste Kapitel wird gerade geschrieben.“), `/umfragen` („Gerade läuft keine Runde.“, „Alle Runden“ mit „Noch keine Runden.“), `/` (Startseite unverändert), eine unbekannte Produktseite (404 im Buchstil) ansehen; Konsole ohne Fehler.

- [ ] **Step 10: Session abschließen**

`HANDOFF.md` mit dem Live-Stand ergänzen, den lokalen Branch `makeover/tp2-welle-1` nach `git merge-base --is-ancestor makeover/tp2-welle-1 main` löschen, committen, pushen (nur `HANDOFF.md` geändert: löst keinen Build aus), dem Nutzer sagen, dass gecleart werden kann (Memory `periodic-session-handoff`).
