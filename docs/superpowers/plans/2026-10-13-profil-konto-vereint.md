# Profil und Konto vereint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein Knopf „Mein Profil“ im Kopf statt „Profil“ und „Mein Konto“; `/profil` zeigt Profil und Konto auf einer Seite ohne Reiter, mit klebendem Profilkopf; `/mitglied` leitet weiter.

**Architecture:** Zwei unabhängige Stränge in je einem Worktree. Strang A ändert nur den Kopf (Navigation, Knopf, Zähler). Strang B baut die Seite: ein neuer `ProfilKopf` (sticky ab 1080 px) mit Kennzahlen als Sprunglinks, darunter alle Boxen in einem 12er-Raster, aufgeteilt in `profil-reihen.tsx` und `konto-reihen.tsx` mit gemeinsamen, per `cache()` entdoppelten Ladern in `laden.ts`. Danach entfallen Reiter, Seitenleiste, Rahmen und die Konto-Seite.

**Tech Stack:** Next.js 16 App Router (React Server Components, Suspense-Streaming), Tailwind v4, Prisma 7 auf Cloudflare D1, Tests mit `node:test` über `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-13-profil-konto-vereint-design.md`

## Global Constraints

- Regelwerk `.claude/skills/ui-design-engine.md` gilt: Abstände nur 8, 16, 24, 32, 40, 48, 64 … px (gerade Tailwind-Stufen), keine arbitrary values für Abstände; nur semantische Farbtokens; Pillen `rounded-full`, Flächen eckig.
- Handschrift (`font-hand`) nur für Randnotiz-Wörter und Feldköpfe; Handelsnamen nie in Handschrift.
- Genau eine gefüllte Primäraktion je Ansicht: „Blüte bewerten“ im Profilkopf.
- Texte de und en, Du-Form, ohne Geviertstrich (U+2014) und ohne Gedankenstrich (U+2013) als Trenner.
- Touch-Ziele ≥ 44 px, Fokus sichtbar, Dekoration `aria-hidden`.
- CPU-Limit Free-Plan 10 ms: je Quelle eine Abfrage pro Aufruf (`cache()`), keine zusätzlichen Auswertungen im Kopf.
- Zeilenenden der Dateien beibehalten (LF bleibt LF, CRLF bleibt CRLF); vor jedem Commit `git diff --stat` prüfen: kein Diff über ganze Dateien.
- Nie `next dev`, `next build` oder Preview lokal starten (Live-Prüfung erst nach dem Push).
- Prüfbefehle: `npx tsx --test tests/<datei>.test.ts` für einzelne Tests, `npm test` für alle, `npx tsc --noEmit` für Typen.

## Review Focus

- Langer Anzeigename (60 Zeichen, auch ohne Leerzeichen) im Kopfknopf: endet mit „…“, Kopfzeile bleibt einzeilig, voller Name im `title` und für Screenreader. Test in Task A1.
- Mitglied ohne Bewertung: die Zahl „0 bewertet“ springt zur Netz-Box (`#netz-titel`), nie zu einer Box, die nicht gerendert wird. Test in Task B1.
- Alte Adressen: `/mitglied` landet per 308 auf `/profil`; `/profil?ansicht=aromen` zeigt die ganze Seite; Register-Links tragen kein `ansicht=` mehr. Tests in Task B2.
- Eine Abfrage scheitert (D1-Fehler): die betroffene Box zeigt den Fehlersatz, die Seite bleibt stehen, der Fehler wird geloggt. Test in Task B2.
- Zwei Primäraktionen (Profilkopf und Stimmzettel ohne Stimme): auf `/profil` ist „Zur Abstimmung“ sekundär. Test in Task B2.

---

## Stränge und Worktrees

| Strang | Worktree | Branch | Tasks |
|---|---|---|---|
| A Kopf | `C:\cn-wt\pk-kopf` | `pk-kopf` | A1 |
| B Seite | `C:\cn-wt\pk-seite` | `pk-seite` | B1, B2, B3 (in dieser Reihenfolge) |

Gemeinsam berühren beide nur `lib/i18n/de.ts` und `lib/i18n/en.ts`, in getrennten Abschnitten (A: `kopf.navigation`; B: `profil.koepfe`). Merge-Reihenfolge: B, dann A. Konflikte dort per Hand auflösen (beide Änderungen behalten).

Anlegen (im Hauptbaum `C:\cn`):

```bash
git worktree add -b pk-kopf C:/cn-wt/pk-kopf main
git worktree add -b pk-seite C:/cn-wt/pk-seite main
```

In jedem Worktree vor dem ersten Test: `node_modules` nicht neu installieren (Netz schonen), sondern als Verzeichnis-Junction verlinken:

```powershell
New-Item -ItemType Junction -Path C:\cn-wt\pk-kopf\node_modules -Target C:\cn\node_modules
New-Item -ItemType Junction -Path C:\cn-wt\pk-seite\node_modules -Target C:\cn\node_modules
```

---

## Strang A: Kopf

### Task A1: Ein Knopf „Mein Profil“ mit Namen

**Skills:** `ui-design-engine`, `better-accessibility`, `better-writing`, `emil-design-eng`

**Files:**
- Modify: `lib/navigation.ts`
- Modify: `components/layout/Kopf.tsx`
- Modify: `components/layout/KontoZaehler.tsx`
- Modify: `lib/i18n/de.ts` (nur `kopf.navigation`), `lib/i18n/en.ts` (nur `kopf.navigation`)
- Test: `tests/navigation.test.ts`

**Interfaces:**
- Produces: `PROFIL_LINK = { href: "/profil", schluessel: "profil" } as const` aus `lib/navigation.ts` (ersetzt `KONTO_LINK`); `KontoZaehler` bekommt die Prop `beschriftung: string`.

- [ ] **Step 1: Tests anpassen (rot)**

In `tests/navigation.test.ts` den ersten Test und den Kopf-Test ersetzen und einen Test für die Kürzung ergänzen:

```ts
import { HAUPTNAVIGATION, PROFIL_LINK, istAktiv } from "@/lib/navigation";

test("Kern zuerst: Bewertungen, Abstimmung, Blüten; Profil als ein Knopf (Nutzer 2026-10-13)", () => {
  assert.deepEqual(HAUPTNAVIGATION.map((eintrag) => eintrag.href), ["/reviews", "/umfragen", "/blueten"]);
  assert.deepEqual(PROFIL_LINK, { href: "/profil", schluessel: "profil" });
  assert.equal(de.kopf.navigation.profil, "Mein Profil");
  assert.equal(en.kopf.navigation.profil, "My profile");
  assert.equal("konto" in de.kopf.navigation, false);
  assert.equal(en.kopf.navigation.bewertungen, "Reviews");
});
```

Den Test „istAktiv: Profil und Konto sind getrennt …“ ersetzen durch:

```ts
test("istAktiv: nur das eigene Profil, fremde Profile zählen nicht", () => {
  assert.equal(istAktiv("/profil", "/profil"), true);
  assert.equal(istAktiv("/profil/abc123", "/profil"), false);
  assert.equal(istAktiv("/mitglied", "/profil"), false);
});
```

Im Test „Kopf: Leiste erst ab lg …“ die letzten zwei Zeilen ersetzen:

```ts
  // Ein Knopf statt Profil und Konto (Nutzer 2026-10-13); ohne Sitzung „Mein Profil“.
  assert.match(html, /<span class="max-lg:sr-only inline-block max-w-28 truncate align-bottom">Mein Profil<\/span>/);
  assert.doesNotMatch(html, /Mein Konto/);
  assert.equal((html.match(/href="\/profil"/g) ?? []).length, 2, "Knopf und Eintrag im Aufklappmenü");
```

Neuer Test am Ende:

```ts
test("Kopfknopf: langer Name wird gekürzt, voller Name bleibt lesbar (Review Focus)", () => {
  const q = readFileSync("components/layout/KontoZaehler.tsx", "utf8");
  assert.match(q, /max-w-28 truncate/);
  assert.match(q, /title=\{konto\.name \?\? undefined\}/);
  assert.match(q, /\{konto\.name \?\? beschriftung\}/);
});
```

Oben `import { readFileSync } from "node:fs";` ergänzen, falls nicht vorhanden.

- [ ] **Step 2: Rot prüfen**

Run: `npx tsx --test tests/navigation.test.ts`
Expected: FAIL (`PROFIL_LINK` fehlt, „Mein Konto“ noch im Kopf).

- [ ] **Step 3: Navigation**

`lib/navigation.ts`:

```ts
/**
 * Hauptnavigation, Kern zuerst (Spec TP2 3.1): die eigenen Bewertungen und
 * die Abstimmung vor Katalog und Apotheken. Seit 2026-10-13 (Nutzer) sind Profil
 * und Konto ein Knopf (PROFIL_LINK) und kein Menüpunkt mehr.
 */
export const HAUPTNAVIGATION = [
  { href: "/reviews", schluessel: "bewertungen" },
  { href: "/umfragen", schluessel: "abstimmung" },
  { href: "/blueten", schluessel: "blueten" },
  // Apotheken seit 2026-09-25 nur in Aussicht (Nutzer), deshalb nicht in der Navigation.
] as const;

/** Der eine Knopf rechts im Kopf; Text unter kopf.navigation.profil, angemeldet der Name. */
export const PROFIL_LINK = { href: "/profil", schluessel: "profil" } as const;
```

`OHNE_UNTERSEITEN` und `istAktiv` bleiben unverändert.

- [ ] **Step 4: Texte**

`lib/i18n/de.ts`, Abschnitt `kopf.navigation`: `profil: "Mein Profil",` und die Zeile `konto: "Mein Konto",` löschen. `lib/i18n/en.ts` entsprechend: `profil: "My profile",`, `konto` löschen. Danach `grep -rn "navigation.konto\|navigation\[\"konto\"\]\|KONTO_LINK" app components lib tests` muss leer sein; Treffer auf `PROFIL_LINK` beziehungsweise `navigation.profil` umstellen.

- [ ] **Step 5: KontoZaehler trägt die Beschriftung**

In `components/layout/KontoZaehler.tsx` die Signatur und das Rendern ändern:

```tsx
export function KontoZaehler({ texte, sprache, beschriftung }: { texte: Mehrzahl; sprache: Sprache; beschriftung: string }) {
```

Im `return` als erstes Kind vor dem Avatar:

```tsx
      {/* Ein Knopf für Profil und Konto (Nutzer 2026-10-13): angemeldet der Name, höchstens so
          breit wie früher „Mein Konto“ (max-w-28), sonst mit „…“; der volle Name steht im title
          und bleibt für Screenreader im Text. Schmal nur das Symbol beziehungsweise der Avatar. */}
      <span className="max-lg:sr-only inline-block max-w-28 truncate align-bottom" title={konto.name ?? undefined}>
        {konto.name ?? beschriftung}
      </span>
```

Den Kommentar über der Funktion um einen Satz ergänzen: „Seit 2026-10-13 auch der Text des Knopfs: ohne Sitzung `beschriftung`, mit Sitzung der Anzeigename.“

- [ ] **Step 6: Kopf**

In `components/layout/Kopf.tsx`:
- Import `HAUPTNAVIGATION, PROFIL_LINK` statt `KONTO_LINK`.
- Der Knopf: `href={PROFIL_LINK.href}`; die Zeile `<span className="max-lg:sr-only">{w.kopf.navigation[KONTO_LINK.schluessel]}</span>` entfällt; `<KontoZaehler texte={w.kopf.ungelesen} sprache={sprache} beschriftung={w.kopf.navigation[PROFIL_LINK.schluessel]} />`.
- Im Aufklappmenü der letzte Eintrag: `href={PROFIL_LINK.href}` mit `{w.kopf.navigation[PROFIL_LINK.schluessel]}`.
- Doku-Kommentar oben: „"Mein Profil" steht abgesetzt als Pille“ bleibt; den Absatz „Bewusst ein fester Link …“ ergänzen um „Den Namen setzt KontoZaehler nach dem Laden ein.“

Hinweis: `HAUPTNAVIGATION` hat jetzt drei Einträge; `w.kopf.navigation[eintrag.schluessel]` typisiert weiter, weil `profil` im Wörterbuch bleibt.

- [ ] **Step 7: Grün prüfen**

Run: `npx tsx --test tests/navigation.test.ts` → PASS.
Run: `npx tsc --noEmit` → keine Fehler.
Run: `npm test` → alle grün (Tests, die „Mein Konto“ erwarten, auf „Mein Profil“ umstellen).

- [ ] **Step 8: Commit**

```bash
git diff --stat
git add lib/navigation.ts components/layout/Kopf.tsx components/layout/KontoZaehler.tsx lib/i18n/de.ts lib/i18n/en.ts tests/navigation.test.ts
git commit -m "feat(kopf): ein Knopf Mein Profil statt Profil und Mein Konto"
```

---

## Strang B: Seite

### Task B1: Profilkopf mit Kennzahlen als Sprunglinks

**Skills:** `ui-design-engine`, `better-layout`, `better-typography`, `better-accessibility`

**Files:**
- Create: `components/profil/ProfilKopf.tsx`
- Create: `lib/profil-kopf.ts`
- Modify: `components/kapitel/Randnotizen.tsx` (Typ `Randnotiz.href`, Prop `leiste`, Schlüssel)
- Modify: `components/ui/Avatar.tsx` (Größe `kopf`, 64 px)
- Modify: `app/globals.css` (Sprungziel-Abstand)
- Test: `tests/profil-kopf.test.ts`

**Interfaces:**
- Produces:
  - `type Randnotiz = { zahl: string; wort: string; satz: string; href?: string }`
  - `Randnotizen({ notizen, beschriftung, kompakt?, leiste? })`
  - `kopfNotizen(profil: readonly Randnotiz[], konto: readonly Randnotiz[]): Randnotiz[]` aus `lib/profil-kopf.ts`
  - `ProfilKopf(props: { name: string; avatarId: string | null; rolle: "betreiber" | "mitglied" | null; seit: Date | null; notizen: readonly Randnotiz[]; aromen: readonly string[]; aktionen: readonly { href: string; text: string; art: "primary" | "secondary" }[]; texte: Woerterbuch["profil"]["seite"]; sprache: Sprache; zahlenLabel?: string })`
  - Avatar-Größe `"kopf"` (`size-16`, Bild 64 px)

- [ ] **Step 1: Failing Tests**

`tests/profil-kopf.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Randnotizen } from "@/components/kapitel/Randnotizen";
import { ProfilKopf } from "@/components/profil/ProfilKopf";
import { de } from "@/lib/i18n/de";
import { kopfNotizen } from "@/lib/profil-kopf";

const n = (wort: string) => ({ zahl: "1", wort, satz: `Satz ${wort}` });
const konto = [n("dabei seit"), n("Stimmen"), n("gewonnen"), n("Vorschläge"), n("ungelesen")];

test("kopfNotizen: vier Profilzahlen und vier Kontozahlen, jede mit Sprungziel; dabei seit entfällt", () => {
  const z = kopfNotizen([n("bewertet"), n("im Schnitt"), n("Vertreiber"), n("zuletzt")], konto);
  assert.deepEqual(z.map((x) => x.wort), ["bewertet", "im Schnitt", "Vertreiber", "zuletzt", "Stimmen", "gewonnen", "Vorschläge", "ungelesen"]);
  assert.deepEqual(z.map((x) => x.href), [
    "#bewertungen-titel", "#topflop-titel", "#vertreiber-titel", "#bewertungen-titel",
    "#stimmen-titel", "#stimmen-titel", "#meine-vorschlaege-titel", "#nachrichten-titel",
  ]);
});

test("kopfNotizen: ohne Bewertung springt „0 bewertet“ zum Netz, nie ins Leere (Review Focus)", () => {
  const z = kopfNotizen([n("bewertet")], konto);
  assert.equal(z[0].href, "#netz-titel");
  assert.equal(z.length, 5);
});

test("kopfNotizen: Profil nicht ladbar, dann nur die Kontozahlen", () => {
  assert.deepEqual(kopfNotizen([], konto).map((x) => x.wort), ["Stimmen", "gewonnen", "Vorschläge", "ungelesen"]);
});

test("Randnotizen: mit href ein Link samt Vorlesesatz, als Leiste acht Spalten ab 1080 px", () => {
  const html = renderToStaticMarkup(createElement(Randnotizen, { notizen: [{ ...n("bewertet"), href: "#netz-titel" }], beschriftung: "Deine Zahlen", leiste: true }));
  assert.match(html, /grid-cols-4[^"]*min-\[1080px\]:grid-cols-8/);
  assert.match(html, /<a href="#netz-titel"[^>]*min-h-11[^>]*><span class="sr-only">Satz bewertet<\/span>/);
});

const basis = {
  name: "GrünesBuch",
  avatarId: null,
  rolle: "betreiber" as const,
  seit: new Date("2026-09-01T00:00:00Z"),
  notizen: [{ ...n("bewertet"), href: "#bewertungen-titel" }],
  aromen: ["Blumig", "Zitrus"],
  aktionen: [
    { href: "/blueten", text: "Blüte bewerten", art: "primary" as const },
    { href: "#einstellungen-titel", text: "Profil bearbeiten", art: "secondary" as const },
  ],
  texte: de.profil.seite,
  sprache: "de" as const,
};

test("ProfilKopf: Name als h1, Rolle, dabei seit, Aromen, Zahlen, eine Primäraktion, sticky ab 1080 px", () => {
  const html = renderToStaticMarkup(createElement(ProfilKopf, basis));
  assert.match(html, /<h1[^>]*>GrünesBuch<\/h1>/);
  assert.match(html, /Betreiber/);
  assert.match(html, /dabei seit September 2026/);
  assert.match(html, /Blumig/);
  assert.match(html, /href="#bewertungen-titel"/);
  assert.match(html, /min-\[1080px\]:sticky/);
  assert.equal((html.match(/href="#einstellungen-titel"/g) ?? []).length, 1);
});

test("ProfilKopf: langer Name bricht um statt die Leiste zu sprengen (Review Focus)", () => {
  const html = renderToStaticMarkup(createElement(ProfilKopf, { ...basis, name: "A".repeat(60) }));
  assert.match(html, /<h1 class="[^"]*wrap-break-word/);
});

test("Sprungziele landen unter Seitenkopf und Profilkopf", () => {
  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /\[data-feld\] \[id\$="-titel"\] \{\s*scroll-margin-top: 6rem;/);
  assert.match(css, /@media \(width >= 67\.5rem\) \{\s*\[data-feld\] \[id\$="-titel"\] \{\s*scroll-margin-top: 16rem;/);
});
```

- [ ] **Step 2: Rot prüfen**

Run: `npx tsx --test tests/profil-kopf.test.ts`
Expected: FAIL (Module `ProfilKopf`, `profil-kopf` fehlen).

- [ ] **Step 3: Randnotizen**

In `components/kapitel/Randnotizen.tsx`:

```tsx
export type Randnotiz = { zahl: string; wort: string; satz: string; href?: string };
```

Signatur um `leiste = false` erweitern (`leiste?: boolean`, Doku: „Profilkopf: eine Reihe, vier Spalten, ab 1080 px acht; Typografie wie kompakt.“). Die Klassen der Liste:

```tsx
      className={
        leiste
          ? "grid grid-cols-4 gap-x-6 gap-y-4 min-[1080px]:grid-cols-8"
          : kompakt
            ? "grid grid-cols-2 gap-x-6 gap-y-6 max-[1079px]:grid-cols-4"
            : "col-span-4 grid grid-cols-subgrid gap-y-8 min-[1080px]:col-span-10"
      }
```

Innerhalb der Map `const klein = kompakt || leiste;` und überall, wo bisher `kompakt` die Klassen wählt, `klein` verwenden. Schlüssel `key={`${i}-${n.wort}`}`. Inhalt je Notiz:

```tsx
      {notizen.map((n, i) => {
        const inhalt = (
          <>
            <span className="sr-only">{n.satz}</span>
            <span aria-hidden="true" className={`numeric text-text ${klein ? "text-h2" : "text-display"}`}>
              {n.zahl}
            </span>
            <span
              aria-hidden="true"
              style={{ "--i": i } as CSSProperties}
              className={`kapitel-notiz-wort font-hand text-notiz text-logo wrap-break-word hyphens-auto ${klein ? "kapitel-notiz-wort--kompakt" : ""}`}
            >
              {n.wort}
            </span>
          </>
        );
        return (
          <li key={`${i}-${n.wort}`} className={klein ? "@container flex min-w-0 flex-col gap-1" : "@container col-span-2 flex min-w-0 flex-col gap-2 px-6 last:odd:col-span-4 min-[1080px]:px-8 min-[1080px]:last:odd:col-span-2"}>
            {n.href ? (
              // Sprunglink zur Box (Spec Profil und Konto vereint 3.1); ganze Notiz als Trefferfläche.
              <a href={n.href} className="flex min-h-11 min-w-0 flex-col gap-1 text-text transition-colors duration-fast ease-standard hover:text-accent">
                {inhalt}
              </a>
            ) : (
              inhalt
            )}
          </li>
        );
      })}
```

- [ ] **Step 4: Avatar-Größe**

In `components/ui/Avatar.tsx` die Tabelle `GROESSE` ergänzen (Reihenfolge der Schlüssel nach Größe):

```ts
  kopf: { klasse: "size-16", seite: 64, schrift: "text-h3" },
```

zwischen `md` und `lg`. Den Typ `AvatarGroesse` nicht von Hand pflegen, falls er per `keyof typeof GROESSE` entsteht; sonst `"kopf"` ergänzen.

- [ ] **Step 5: kopfNotizen**

`lib/profil-kopf.ts`:

```ts
import type { Randnotiz } from "@/components/kapitel/Randnotizen";

/** Sprungziele der Profilzahlen in der Reihenfolge von profilNotizen (ohne Community). */
const PROFIL_ZIELE = ["#bewertungen-titel", "#topflop-titel", "#vertreiber-titel", "#bewertungen-titel"] as const;

/** Sprungziele der Kontozahlen in der Reihenfolge von kontoNotizen ohne „dabei seit“. */
const KONTO_ZIELE = ["#stimmen-titel", "#stimmen-titel", "#meine-vorschlaege-titel", "#nachrichten-titel"] as const;

/**
 * Die Zahlen im Profilkopf (Spec Profil und Konto vereint 3.1): erst das Profil, dann das Konto, jede
 * ein Sprunglink zu ihrer Box. „dabei seit“ steht schon unter dem Namen und entfällt. Ohne Bewertung
 * gibt es nur „0 bewertet“; Register, Top/Flop und Vertreiber werden dann nicht gerendert, darum
 * springt die Zahl zum Netz, das zur ersten Bewertung einlädt.
 */
export function kopfNotizen(profil: readonly Randnotiz[], konto: readonly Randnotiz[]): Randnotiz[] {
  const ohneBewertung = profil.length === 1;
  return [
    ...profil.slice(0, PROFIL_ZIELE.length).map((n, i) => ({ ...n, href: ohneBewertung ? "#netz-titel" : PROFIL_ZIELE[i] })),
    ...konto.slice(1, 1 + KONTO_ZIELE.length).map((n, i) => ({ ...n, href: KONTO_ZIELE[i] })),
  ];
}
```

- [ ] **Step 6: ProfilKopf**

`components/profil/ProfilKopf.tsx`:

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
  /** Beschriftung der Zahlenliste; ohne Angabe „Deine Zahlen“ (eigenes Profil). */
  zahlenLabel?: string;
};

const MONAT = {
  de: new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
};

/**
 * Profilkopf (Spec Profil und Konto vereint 3.1): volle Breite, klebt ab 1080 px unter dem Seitenkopf.
 * Ab 1280 px eine Reihe (Identität, Zahlen, Aktionen), von 1080 bis 1279 px Identität und Aktionen
 * oben, Zahlen darunter; schmaler ein Kopfblock, der mitscrollt (auf dem Telefon wäre er zu hoch).
 */
export function ProfilKopf({ name, avatarId, rolle, seit, notizen, aromen, aktionen, texte, sprache, zahlenLabel }: Props) {
  const datum = seit ? MONAT[sprache].format(seit) : null;
  return (
    <div data-profil-kopf="" className="z-30 border-b border-border bg-surface min-[1080px]:sticky min-[1080px]:top-[var(--kopf-h,4rem)]">
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 items-center gap-x-8 gap-y-4 px-4 py-4 sm:px-8 min-[1080px]:grid-cols-[minmax(0,1fr)_auto] min-[1280px]:grid-cols-[auto_minmax(0,1fr)_auto]">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={name} bildId={avatarId} groesse="kopf" className="shrink-0" />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="font-buch text-h2 font-normal text-text text-balance wrap-break-word">{name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              {rolle ? <Badge variante={rolle === "betreiber" ? "accent" : "neutral"}>{texte[rolle]}</Badge> : null}
              {datum ? <span className="text-small text-text-muted">{t(texte.dabeiSeit, { datum })}</span> : null}
              {aromen.length > 0 ? (
                <ul aria-label={texte.aromen} className="flex flex-wrap gap-2">
                  {aromen.map((a) => (
                    <li key={a}>
                      <Badge variante="neutral">{a}</Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
        {notizen.length > 0 ? (
          <div className="min-w-0 min-[1080px]:col-span-2 min-[1080px]:row-start-2 min-[1280px]:col-span-1 min-[1280px]:col-start-2 min-[1280px]:row-start-1">
            <Randnotizen notizen={notizen} beschriftung={zahlenLabel ?? texte.zahlen} leiste />
          </div>
        ) : null}
        {aktionen.length > 0 ? (
          <div className="flex flex-wrap gap-4 min-[1080px]:col-start-2 min-[1080px]:row-start-1 min-[1280px]:col-start-3">
            {aktionen.map((a) => (
              <Link key={a.href} prefetch={false} href={a.href} className={buttonKlassen(a.art, "md")}>
                {a.text}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Sprungziel-Abstand**

In `app/globals.css` direkt nach der Regel `.kapitel-notiz-wort--kompakt { … }`:

```css
/* Sprungziele im Profil (Spec Profil und Konto vereint 3.1): Feldtitel landen unter Seitenkopf und
   Profilkopf statt darunter. Ab 1080 px klebt der Profilkopf (bis rund 176 px) unter dem Seitenkopf. */
[data-feld] [id$="-titel"] {
  scroll-margin-top: 6rem;
}

@media (width >= 67.5rem) {
  [data-feld] [id$="-titel"] {
    scroll-margin-top: 16rem;
  }
}
```

- [ ] **Step 8: Grün prüfen**

Run: `npx tsx --test tests/profil-kopf.test.ts tests/kapitel.test.ts` → PASS.
Run: `npx tsc --noEmit` → keine Fehler.

- [ ] **Step 9: Commit**

```bash
git diff --stat
git add components/profil/ProfilKopf.tsx lib/profil-kopf.ts components/kapitel/Randnotizen.tsx components/ui/Avatar.tsx app/globals.css tests/profil-kopf.test.ts
git commit -m "feat(profil): Profilkopf mit Kennzahlen als Sprunglinks"
```

### Task B2: Eine Seite für Profil und Konto

**Skills:** `ui-design-engine`, `better-layout`, `react-best-practices`, `edge-stack-master`, `better-writing`

**Files:**
- Create: `app/[lang]/profil/laden.ts`, `app/[lang]/profil/spalten.ts`, `app/[lang]/profil/profil-reihen.tsx`, `app/[lang]/profil/konto-reihen.tsx`
- Modify: `app/[lang]/profil/page.tsx` (ganz neu)
- Delete: `app/[lang]/mitglied/page.tsx` (die Datei `aktionen.ts` daneben bleibt)
- Modify: `components/kapitel/FeldSkelett.tsx` (Prop `className`)
- Modify: `components/mitglied/UmfrageJetzt.tsx` (Prop `aktion`)
- Modify: `components/profil/BewertungsRegister.tsx` (Ziel ohne `ansicht`)
- Modify: `lib/alte-adressen.ts`, `next.config.ts` (Weiterleitung)
- Modify: alle Stellen mit `"/mitglied"` (siehe Step 8)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts` (nur `profil.koepfe`)
- Test: `tests/profil-vereint.test.ts` (neu); anpassen: `tests/profil-seite.test.ts`, `tests/profil-ansichten.test.ts`, `tests/profil-reihenfolge.test.ts`, `tests/konto.test.ts`, `tests/bluete-benachrichtigungen.test.ts`, `tests/bluete-kleinpunkte.test.ts`, `tests/i18n-literale.test.ts`, `tests/alte-adressen.test.ts`

**Interfaces:**
- Consumes: `ProfilKopf`, `kopfNotizen`, `Randnotiz` aus Task B1.
- Produces: `SPALTEN` aus `app/[lang]/profil/spalten.ts`; Lader aus `laden.ts`: `textLaden`, `profilLaden`, `zeilenLaden`, `nachrichtenLaden`, `vorschlaegeLaden`, `stimmenLaden`, `stimmZahlenLaden`, `umfrageLaden`, `oderNull`, `oderUndefined`; `ALTE_KONTO_WEITERLEITUNGEN` aus `lib/alte-adressen.ts`.

- [ ] **Step 1: Failing Tests**

`tests/profil-vereint.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

import { ALTE_KONTO_WEITERLEITUNGEN } from "@/lib/alte-adressen";

const lies = (p: string) => readFileSync(p, "utf8");
const seite = () => lies("app/[lang]/profil/page.tsx");
const profilReihen = () => lies("app/[lang]/profil/profil-reihen.tsx");
const kontoReihen = () => lies("app/[lang]/profil/konto-reihen.tsx");

test("/profil: keine Reiter, Profilkopf, alle Reihen in fester Reihenfolge", () => {
  const q = seite();
  assert.doesNotMatch(q, /ProfilReiter|ProfilRahmen|ProfilSeitenleiste|ansichtAus|\?ansicht=/);
  const reihe = ["<ProfilKopf", "<ReiheGeschmack", "<ReiheVerlauf", "<ReiheRegister", "<ReiheAehnliches", "<ReiheVertreiber", "<ReiheMitbestimmen", "<ReiheStimmen", "<ReiheNachrichten", "<ReiheEinstellungen"].map((s) => q.indexOf(s));
  assert.ok(reihe.every((i) => i > 0), JSON.stringify(reihe));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  assert.match(q, /redirect\("\/anmelden\?weiter=%2Fprofil"\)/);
  assert.match(q, /index: false/);
});

test("/profil: Boxen mit eindeutigen Ids und den Sprungzielen des Profilkopfs", () => {
  const alle = profilReihen() + kontoReihen();
  // "netz" steht zweimal (Leer- und Vollzweig von ReiheGeschmack/ReiheNetz), rendert aber nur einmal.
  for (const id of ["topflop", "aktivitaet", "verteilung", "bewertungen", "aehnliches", "vertreiber", "schnitte", "community", "umfrage", "meine-vorschlaege", "stimmen", "nachrichten", "status", "einstellungen"]) {
    assert.equal((alle.match(new RegExp(`id="${id}"`, "g")) ?? []).length, 1, id);
  }
  assert.doesNotMatch(alle, /id="vorschlaege"/);
});

test("/profil: eine Primäraktion, der Stimmzettel ist hier sekundär (Review Focus)", () => {
  assert.match(kontoReihen(), /<UmfrageJetzt[\s\S]*?aktion="secondary"/);
  assert.doesNotMatch(seite() + profilReihen() + kontoReihen(), /buttonKlassen\("primary"/);
  assert.match(lies("components/mitglied/UmfrageJetzt.tsx"), /buttonKlassen\(aktion\)/);
});

test("/profil: Teilfehler werden geloggt, Redirects gehen durch (Review Focus)", () => {
  const q = lies("app/[lang]/profil/laden.ts");
  assert.match(q, /unstable_rethrow\(fehler\)/);
  assert.match(q, /console\.error\(`\$\{name\} fehlgeschlagen`, fehler\)/);
  for (const f of ["benachrichtigungenLaden", "eigeneVorschlaege", "ladeStimmen", "stimmZahlen", "aktiveUmfrage", "aktuellesProfil", "ladeAuswertungsZeilen"]) assert.match(q, new RegExp(`${f}\\(`), f);
});

test("/profil: Konto-Boxen tragen Formulare, Abmelden und die Verwaltung nur für Admins", () => {
  const q = kontoReihen();
  for (const s of ["<ProfilFormular", "<AvatarFormular", "<ProfilSichtbarkeit", "<AbmeldeButton", "<GelesenMarkieren ids={ungelesen} />", "<MeineStimmen", "<UmfrageJetzt"]) assert.ok(q.includes(s), s);
  assert.match(q, /rolle === "ADMIN"/);
  assert.match(q, /href="\/admin"/);
});

test("Alte Adressen: /mitglied leitet dauerhaft auf /profil (Review Focus)", () => {
  assert.deepEqual([...ALTE_KONTO_WEITERLEITUNGEN], [{ source: "/mitglied", destination: "/profil", permanent: true }]);
  assert.match(lies("next.config.ts"), /\.\.\.ALTE_KONTO_WEITERLEITUNGEN/);
  assert.equal(existsSync("app/[lang]/mitglied/page.tsx"), false);
});

test("Register-Links ohne ansicht, Sprungziel bleibt die Überschrift (Review Focus)", () => {
  const q = lies("components/profil/BewertungsRegister.tsx");
  assert.doesNotMatch(q, /ansicht/);
  assert.match(q, /#bewertungen-titel/);
});

test("Kein Link im Code zeigt mehr auf /mitglied", () => {
  for (const p of ["app/[lang]/admin/vorschlag-aktionen.ts", "components/vorschlag/BlueteVorschlagFormular.tsx", "app/[lang]/blueten/[slug]/aktionen.ts", "app/[lang]/mitglied/aktionen.ts", "app/[lang]/vorschlagen/aktionen.ts"]) {
    assert.doesNotMatch(lies(p), /"\/mitglied"/, p);
  }
});
```

- [ ] **Step 2: Rot prüfen**

Run: `npx tsx --test tests/profil-vereint.test.ts`
Expected: FAIL.

- [ ] **Step 3: Lader und Spalten**

`app/[lang]/profil/laden.ts`:

```ts
import { unstable_rethrow } from "next/navigation";
import { cache } from "react";

import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { benachrichtigungenLaden } from "@/lib/query/benachrichtigungen";
import { ladeStimmen, stimmZahlen } from "@/lib/query/konto";
import { aktuellesProfil, ladeAuswertungsZeilen } from "@/lib/query/profil";
import { aktiveUmfrage } from "@/lib/query/umfragen";
import { eigeneVorschlaege } from "@/lib/query/vorschlaege";

/** Fehler eines Teils reißen die Seite nicht mit; Redirects gehen durch. */
export function oderNull<T>(name: string) {
  return (fehler: unknown): T | null => {
    unstable_rethrow(fehler);
    console.error(`${name} fehlgeschlagen`, fehler);
    return null;
  };
}

/** Wie oderNull, aber undefined: der Aufrufer unterscheidet „gescheitert“ von „keiner“. */
export function oderUndefined<T>(name: string) {
  return (fehler: unknown): T | undefined => {
    unstable_rethrow(fehler);
    console.error(`${name} fehlgeschlagen`, fehler);
    return undefined;
  };
}

type Ergebnis<F extends (...a: never[]) => Promise<unknown>> = Awaited<ReturnType<F>>;

// Je Aufruf eine Abfrage je Quelle, auch wenn Kopf und Boxen sie lesen (CPU-Limit 10 ms).
// Erst das Profil: ist es veraltet, schreibt es auch die Vorschläge neu.
export const textLaden = cache(async () => {
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  return { w, sprache };
});
export const profilLaden = cache((id: string) => aktuellesProfil(id).catch(oderNull<Ergebnis<typeof aktuellesProfil>>("aktuellesProfil")));
export const zeilenLaden = cache((id: string) => ladeAuswertungsZeilen(id).catch(oderNull<Ergebnis<typeof ladeAuswertungsZeilen>>("ladeAuswertungsZeilen")));
export const nachrichtenLaden = cache((id: string) => benachrichtigungenLaden(id).catch(oderNull<Ergebnis<typeof benachrichtigungenLaden>>("benachrichtigungenLaden")));
export const vorschlaegeLaden = cache((id: string) => eigeneVorschlaege(id).catch(oderNull<Ergebnis<typeof eigeneVorschlaege>>("eigeneVorschlaege")));
export const stimmenLaden = cache((id: string) => ladeStimmen(id).catch(oderNull<Ergebnis<typeof ladeStimmen>>("ladeStimmen")));
export const stimmZahlenLaden = cache((id: string) => stimmZahlen(id).catch(oderNull<Ergebnis<typeof stimmZahlen>>("stimmZahlen")));
export const umfrageLaden = cache(() => aktiveUmfrage().catch(oderNull<Ergebnis<typeof aktiveUmfrage>>("aktiveUmfrage")));
```

Falls der Hilfstyp `Ergebnis` mit den Signaturen nicht typisiert, je Zeile `Awaited<ReturnType<typeof …>>` ausschreiben wie im alten Code.

`app/[lang]/profil/spalten.ts`:

```ts
/** Breiten im 12er-Raster ab 1280 px (Spec Profil und Konto vereint 3.2); ausgeschrieben, damit Tailwind sie findet. */
export const SPALTEN = {
  4: "min-[1280px]:col-span-4",
  5: "min-[1280px]:col-span-5",
  6: "min-[1280px]:col-span-6",
  7: "min-[1280px]:col-span-7",
  12: "min-[1280px]:col-span-12",
} as const;
```

- [ ] **Step 4: Bausteine anpassen**

`components/kapitel/FeldSkelett.tsx`: Prop `className?: string` ergänzen und als letztes Argument an `cn(…)` geben.

`components/mitglied/UmfrageJetzt.tsx`: Prop `aktion?: "primary" | "secondary"` (Standard `"primary"`, Doku: „Auf /profil sekundär: dort ist ‚Blüte bewerten‘ die eine Primäraktion.“); der Link „Zur Abstimmung“ nutzt `buttonKlassen(aktion)`.

`components/profil/BewertungsRegister.tsx`, Funktion `ziel`:

```ts
const ziel = (sortierung: Sortierung, alle: boolean) => {
  const p = new URLSearchParams();
  if (sortierung !== "datum") p.set("sortierung", sortierung);
  if (alle) p.set("alle", "1");
  const q = p.toString();
  // Sprungziel ist die Überschrift des Felds (Feld id="bewertungen").
  return q ? `/profil?${q}#bewertungen-titel` : "/profil#bewertungen-titel";
};
```

- [ ] **Step 5: Feldköpfe der Konto-Boxen (Texte)**

In `lib/i18n/de.ts` unter `profil.koepfe` ergänzen:

```ts
      umfrage: { vor: "Die Umfrage", betont: "jetzt", schlagwort: "wähl mit" },
      meineVorschlaege: { vor: "Deine", betont: "Vorschläge", schlagwort: "was noch fehlt" },
      stimmen: { vor: "Deine", betont: "Stimmen", schlagwort: "was daraus wurde" },
      nachrichten: { vor: "Deine", betont: "Nachrichten", schlagwort: "post für dich" },
      status: { vor: "Dein", betont: "Status", schlagwort: "stimmrecht" },
      einstellungen: { vor: "Deine", betont: "Einstellungen", schlagwort: "nur für dich" },
      verwaltung: { vor: "Die", betont: "Verwaltung", schlagwort: "nur betreiber" },
```

In `lib/i18n/en.ts` unter `profil.koepfe`:

```ts
      umfrage: { vor: "The poll", betont: "now", schlagwort: "have your say" },
      meineVorschlaege: { vor: "Your", betont: "suggestions", schlagwort: "still missing" },
      stimmen: { vor: "Your", betont: "votes", schlagwort: "what came of them" },
      nachrichten: { vor: "Your", betont: "messages", schlagwort: "post for you" },
      status: { vor: "Your", betont: "status", schlagwort: "voting rights" },
      einstellungen: { vor: "Your", betont: "settings", schlagwort: "just for you" },
      verwaltung: { vor: "The", betont: "admin", schlagwort: "operator only" },
```

- [ ] **Step 6: Profil-Reihen**

`app/[lang]/profil/profil-reihen.tsx`: die Server-Komponenten aus dem alten `page.tsx` übernehmen und so schneiden. Jede Reihe gibt Fragmente aus `Feld rahmen="karte" groesse="klein"` mit `className={SPALTEN[n]}` zurück. Ohne Bewertung (`zeilen.length === 0`) oder bei Fehler (`zeilen === null`) rendern alle Reihen außer `ReiheGeschmack` `null`.

```tsx
import Link from "next/link";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { Feld } from "@/components/kapitel/Feld";
import { Aktivitaet } from "@/components/profil/Aktivitaet";
import { BewertungsRegister } from "@/components/profil/BewertungsRegister";
import { CommunityVergleich } from "@/components/profil/CommunityVergleich";
import { Lieblingsvertreiber } from "@/components/profil/Lieblingsvertreiber";
import { NotenVerteilung } from "@/components/profil/NotenVerteilung";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { Schnitte } from "@/components/profil/Schnitte";
import { TopFlop } from "@/components/profil/TopFlop";
import { buttonKlassen } from "@/components/ui";
import { registerAnsicht, type registerParameter } from "@/lib/bewertungs-register";
import { begruendungText } from "@/lib/empfehlung-text";
import { auswertungen, leereProfilWerte } from "@/lib/profil";
import { monatsReihe, notenVerteilung } from "@/lib/profil-dashboard";
import { ladeEmpfehlungen } from "@/lib/query/empfehlungen";
import { ladeLieblingsvertreiber } from "@/lib/query/lieblingsvertreiber";

import { oderNull, oderUndefined, profilLaden, textLaden, zeilenLaden } from "./laden";
import { SPALTEN } from "./spalten";

/** Reihe 1: Netz (7) und Top/Flop (5); ohne Bewertung das Netz allein mit Einladung, bei Fehler der Fehlersatz. */
export async function ReiheGeschmack({ id }: { id: string }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  const texte = w.profil;
  if (zeilen === null || zeilen.length === 0) {
    return (
      <Feld id="netz" rahmen="karte" groesse="klein" titel={texte.netzTitel} kopf={texte.koepfe.netz} ton="lila" className={SPALTEN[12]}>
        <p className={`max-w-[68ch] text-body ${zeilen === null ? "text-text" : "text-text-muted"}`}>{zeilen === null ? texte.fehler : texte.leer}</p>
        {zeilen === null ? null : (
          // Die gefüllte Primäraktion steht schon im Profilkopf: hier die zweite Stufe.
          <Link prefetch={false} href="/blueten" className={`${buttonKlassen("secondary", "md")} self-start`}>
            {texte.seite.bewerten}
          </Link>
        )}
      </Feld>
    );
  }
  const a = auswertungen(zeilen);
  return (
    <>
      <ReiheNetz id={id} className={SPALTEN[7]} />
      <Feld id="topflop" rahmen="karte" groesse="klein" titel={texte.topFlopTitel} kopf={texte.koepfe.topFlop} ton="lila" className={SPALTEN[5]}>
        <TopFlop top={a.top} flop={a.flop} texte={texte} sprache={sprache} />
      </Feld>
    </>
  );
}
```

`ReiheNetz` übernimmt den Körper der alten Funktion `ReiheNetz` (Prop `netzKlasse` heißt jetzt `className`), unverändert sonst.

```tsx
/** Reihe 2: Spur (7) und Noten (5). */
export async function ReiheVerlauf({ id }: { id: string }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  if (!zeilen || zeilen.length === 0) return null;
  const texte = w.profil;
  return (
    <>
      <Feld id="aktivitaet" rahmen="karte" groesse="klein" titel={texte.aktivitaetTitel} kopf={texte.koepfe.aktivitaet} ton="gruen" satz={texte.aktivitaetSatz} className={SPALTEN[7]}>
        <Aktivitaet monate={monatsReihe(zeilen.map((z) => z.erstelltAm), new Date(), sprache, { abErster: true })} texte={texte} kompakt />
      </Feld>
      <Feld id="verteilung" rahmen="karte" groesse="klein" titel={texte.verteilungTitel} kopf={texte.koepfe.noten} ton="lila" satz={texte.verteilungSatz} className={SPALTEN[5]}>
        <NotenVerteilung stufen={notenVerteilung(zeilen)} texte={texte} />
      </Feld>
    </>
  );
}

/** Reihe 3: das Register über die volle Breite. */
export async function ReiheRegister({ id, register }: { id: string; register: ReturnType<typeof registerParameter> }) {
  const [{ w, sprache }, zeilen] = await Promise.all([textLaden(), zeilenLaden(id)]);
  if (!zeilen || zeilen.length === 0) return null;
  const texte = w.profil;
  return (
    <Feld id="bewertungen" rahmen="karte" groesse="klein" titel={texte.registerTitel} kopf={texte.koepfe.register} ton="lila" satz={texte.registerSatz} className={SPALTEN[12]}>
      <BewertungsRegister ansicht={registerAnsicht(zeilen, register)} sortierung={register.sortierung} alle={register.alle} texte={texte} sprache={sprache} />
    </Feld>
  );
}
```

`ReiheAehnliches`: Körper der alten `ReiheVorschlaege`, mit `Feld id="aehnliches"` und `className={SPALTEN[12]}`; vorab `const zeilen = await zeilenLaden(id); if (!zeilen || zeilen.length === 0) return null;`.

`ReiheVertreiber`: Körper der alten `AnsichtVertreiber` ohne den Leer-Zweig (stattdessen `if (!zeilen || zeilen.length === 0) return null;`), Fragment statt umschließendem Grid: `vertreiber` mit `SPALTEN[12]`, `schnitte` mit `SPALTEN[6]`, `community` mit `a.schnitte ? SPALTEN[6] : SPALTEN[12]`.

`registerParameter` nur als Typ importieren (`import type`), falls `type`-Import einer Funktion nicht erlaubt ist: `import { registerAnsicht } from …` und `import type { registerParameter } from …` getrennt.

- [ ] **Step 7: Konto-Reihen**

`app/[lang]/profil/konto-reihen.tsx`: die Teile aus `app/[lang]/mitglied/page.tsx` übernehmen (`STATUS_VARIANTE`, `Status`, `ReiheUmfrage`, `ReiheStimmen`, `ReiheNachrichten`) und so umbauen. Alle Felder mit `rahmen="karte" groesse="klein"`, Feldkopf aus `w.profil.koepfe`, Schlagwort-Ton abwechselnd.

```tsx
import Link from "next/link";

import { AbmeldeButton } from "@/components/auth/AbmeldeButton";
import { ProfilFormular } from "@/components/auth/ProfilFormular";
import { Feld } from "@/components/kapitel/Feld";
import { AvatarFormular } from "@/components/mitglied/AvatarFormular";
import { GelesenMarkieren } from "@/components/mitglied/GelesenMarkieren";
import { MeineStimmen } from "@/components/mitglied/MeineStimmen";
import { ProfilSichtbarkeit } from "@/components/mitglied/ProfilSichtbarkeit";
import { UmfrageJetzt } from "@/components/mitglied/UmfrageJetzt";
import { Badge, buttonKlassen, textLinkKlassen } from "@/components/ui";
import type { VorschlagStatus } from "@/db/enums";
import { benachrichtigungSatz } from "@/lib/benachrichtigung";
import { formatiereDatum } from "@/lib/format";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { eigeneStimme } from "@/lib/query/umfragen";
import type { aktuellesMitglied } from "@/lib/session";

import { nachrichtenLaden, oderNull, stimmenLaden, textLaden, umfrageLaden, vorschlaegeLaden } from "./laden";
import { SPALTEN } from "./spalten";

type Mitglied = NonNullable<Awaited<ReturnType<typeof aktuellesMitglied>>>;
```

- `ReiheMitbestimmen({ id, freigegeben })`: `Feld id="umfrage"` mit `stimmzettel`, `kopf={w.profil.koepfe.umfrage}`, `ton="gruen"`, `className={SPALTEN[7]}`, darin `<UmfrageJetzt … aktion="secondary" />`; `Feld id="meine-vorschlaege"` mit `kopf={w.profil.koepfe.meineVorschlaege}`, `ton="lila"`, `className={SPALTEN[5]}`, Inhalt wie bisher „Meine Vorschläge“ samt Knopf „Blüte vorschlagen“ (sekundär).
- `ReiheStimmen({ id })`: `Feld id="stimmen"`, `kopf={w.profil.koepfe.stimmen}`, `ton="gruen"`, `satz={texte.stimmenSatz}`, `className={SPALTEN[12]}`, Inhalt wie bisher.
- `ReiheNachrichten({ id, freigegeben, rolle })`: `Feld id="nachrichten"` (`kopf={w.profil.koepfe.nachrichten}`, `ton="lila"`, `SPALTEN[7]`) mit Inhalt wie bisher samt `<GelesenMarkieren ids={ungelesen} />`; daneben `Status` als `Feld id="status"` (`kopf={w.profil.koepfe.status}`, `ton="gruen"`, `SPALTEN[5]`).
- `ReiheEinstellungen({ mitglied })`: ein Feld über die volle Breite, drei Spalten ab 1280 px, darunter Abmelden; für Admins danach die Verwaltung.

```tsx
/** Reihe 9 (Spec 3.2): Angaben, Profilbild, Öffentliches Profil nebeneinander, darunter Abmelden. */
export async function ReiheEinstellungen({ mitglied }: { mitglied: Mitglied }) {
  const { w } = await textLaden();
  const texte = w.mitglied;
  return (
    <>
      <Feld id="einstellungen" rahmen="karte" groesse="klein" titel={texte.einstellungenTitel} kopf={w.profil.koepfe.einstellungen} ton="lila" className={SPALTEN[12]}>
        <div className="grid grid-cols-1 gap-8 min-[1280px]:grid-cols-3">
          <section aria-labelledby="angaben-titel" className="flex flex-col gap-4">
            <h3 id="angaben-titel" className="font-buch text-h3 text-text">{texte.angaben}</h3>
            <ProfilFormular anzeigename={mitglied.anzeigename} instagramHandle={mitglied.instagramHandle} texte={texte.profil} />
          </section>
          <section aria-labelledby="avatar-titel" className="flex flex-col gap-4">
            <h3 id="avatar-titel" className="font-buch text-h3 text-text">{texte.avatar.titel}</h3>
            <AvatarFormular name={mitglied.anzeigename} avatarId={mitglied.avatarId} texte={texte.avatar} meldungen={w.meldung} />
          </section>
          <section aria-labelledby="sichtbarkeit-titel" className="flex flex-col gap-4">
            <h3 id="sichtbarkeit-titel" className="font-buch text-h3 text-text">{texte.sichtbarkeit.titel}</h3>
            <ProfilSichtbarkeit
              an={mitglied.profilOeffentlich}
              // Die Kurz-Id eines privaten Profils bleibt auf dem Server (Review Minor 5).
              kurzId={mitglied.profilOeffentlich ? mitglied.kurzId : null}
              moeglich={mitglied.freigegeben}
              texte={texte.sichtbarkeit}
            />
          </section>
        </div>
        <div className="border-t border-border pt-6">
          <AbmeldeButton texte={w.auth.formular} />
        </div>
      </Feld>
      {/* Der einzige Einstieg zu /admin, bewusst nicht in der Navigation (die müsste sonst die Sitzung lesen). */}
      {mitglied.rolle === "ADMIN" ? (
        <Feld id="verwaltung" rahmen="karte" groesse="klein" titel={texte.verwaltung} kopf={w.profil.koepfe.verwaltung} ton="gruen" satz={texte.verwaltungText} className={SPALTEN[12]}>
          <Link prefetch={false} href="/admin" className={`${buttonKlassen("secondary")} self-start`}>
            {texte.zurVerwaltung}
          </Link>
        </Feld>
      ) : null}
    </>
  );
}
```

Hinweis: die `-titel`-Ids der h3 (`angaben-titel`, `avatar-titel`, `sichtbarkeit-titel`) dürfen keine Feld-Id doppeln; kein Feld heißt `angaben`, `avatar` oder `sichtbarkeit`.

- [ ] **Step 8: Seite**

`app/[lang]/profil/page.tsx` ganz ersetzen:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import type { Randnotiz } from "@/components/kapitel/Randnotizen";
import { FeldSkelett } from "@/components/kapitel/FeldSkelett";
import { ProfilKopf } from "@/components/profil/ProfilKopf";
import { registerParameter } from "@/lib/bewertungs-register";
import { holeWoerterbuch } from "@/lib/i18n";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { kontoNotizen } from "@/lib/konto";
import { leereProfilWerte } from "@/lib/profil";
import { liebsteAromen } from "@/lib/profil-ansicht";
import { profilNotizen } from "@/lib/profil-dashboard";
import { kopfNotizen } from "@/lib/profil-kopf";
import { aktuellesMitglied } from "@/lib/session";

import { ReiheEinstellungen, ReiheMitbestimmen, ReiheNachrichten, ReiheStimmen } from "./konto-reihen";
import { nachrichtenLaden, profilLaden, stimmZahlenLaden, textLaden, vorschlaegeLaden, zeilenLaden } from "./laden";
import { ReiheAehnliches, ReiheGeschmack, ReiheRegister, ReiheVertreiber, ReiheVerlauf } from "./profil-reihen";
import { SPALTEN } from "./spalten";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await holeWoerterbuch()).profil.titel, robots: { index: false, follow: false } };
}

type SuchParameter = Record<string, string | string[] | undefined>;

/**
 * Mein Profil (Spec Profil und Konto vereint 2026-10-13): oben der Profilkopf (ab 1080 px sticky),
 * darunter alle Boxen ohne Reiter, vom Geschmack über die Mitbestimmung bis zu den Einstellungen.
 * Jede Reihe streamt für sich; jede Quelle wird je Aufruf einmal gelesen (laden.ts, CPU 10 ms).
 * `?ansicht=` aus alten Links wird ignoriert. Nur Aroma in Netz und Vorschlägen (HWG).
 */
export default async function ProfilPage({ searchParams }: { searchParams: Promise<SuchParameter> }) {
  const mitglied = await aktuellesMitglied();
  const { w, sprache } = await textLaden();
  if (!mitglied) redirect("/anmelden?weiter=%2Fprofil");
  const register = registerParameter(await searchParams);
  const id = mitglied.mitgliedId;
  const s = w.profil.seite;
  const kopf = {
    name: mitglied.anzeigename,
    avatarId: mitglied.avatarId,
    rolle: mitglied.rolle === "ADMIN" ? ("betreiber" as const) : ("mitglied" as const),
    seit: mitglied.erstelltAm,
    aktionen: seitenAktionen(s),
    texte: s,
    sprache,
  };
  const skelett = <FeldSkelett rahmen="karte" className={SPALTEN[12]} />;

  return (
    <div className="pb-16">
      <Suspense fallback={<ProfilKopf {...kopf} notizen={[]} aromen={[]} />}>
        <Kopf id={id} {...kopf} />
      </Suspense>
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-8 px-4 pt-8 sm:px-8 min-[1080px]:pt-12 min-[1280px]:grid-cols-12">
        <Suspense fallback={<FeldSkelett rahmen="karte" hoehe="gross" className={SPALTEN[12]} />}>
          <ReiheGeschmack id={id} />
        </Suspense>
        <Suspense fallback={skelett}>
          <ReiheVerlauf id={id} />
        </Suspense>
        <Suspense fallback={skelett}>
          <ReiheRegister id={id} register={register} />
        </Suspense>
        <Suspense fallback={skelett}>
          <ReiheAehnliches id={id} />
        </Suspense>
        <Suspense fallback={skelett}>
          <ReiheVertreiber id={id} />
        </Suspense>
        <Suspense fallback={skelett}>
          <ReiheMitbestimmen id={id} freigegeben={mitglied.freigegeben} />
        </Suspense>
        <Suspense fallback={skelett}>
          <ReiheStimmen id={id} />
        </Suspense>
        <Suspense fallback={skelett}>
          <ReiheNachrichten id={id} freigegeben={mitglied.freigegeben} rolle={mitglied.rolle} />
        </Suspense>
        <Suspense fallback={skelett}>
          <ReiheEinstellungen mitglied={mitglied} />
        </Suspense>
      </div>
    </div>
  );
}

/** Die zwei Wege im Profilkopf; auch im Suspense-Fallback bekannt. */
function seitenAktionen(s: Woerterbuch["profil"]["seite"]) {
  return [
    { href: "/blueten", text: s.bewerten, art: "primary" },
    { href: "#einstellungen-titel", text: s.bearbeiten, art: "secondary" },
  ] as const;
}

/** Zahlen und liebste Aromen; die Quellen teilen sich Kopf und Boxen über laden.ts. */
async function Kopf({ id, ...kopf }: { id: string } & Omit<Parameters<typeof ProfilKopf>[0], "notizen" | "aromen">) {
  const [{ w, sprache }, zeilen, profil, zahlen, vorschlaege, nachrichten] = await Promise.all([
    textLaden(),
    zeilenLaden(id),
    profilLaden(id),
    stimmZahlenLaden(id),
    vorschlaegeLaden(id),
    nachrichtenLaden(id),
  ]);
  // Ohne auswertungen(): die Community-Zahl steht nicht im Kopf (ohneCommunity), das spart CPU.
  const profilZahlen: Randnotiz[] =
    zeilen === null
      ? []
      : profilNotizen(
          { zeilen, differenz: null, hersteller: new Set(zeilen.map((z) => z.vertreiber).filter(Boolean)).size },
          w.profil.kapitel,
          sprache,
          { ohneCommunity: true },
        );
  const kontoZahlen = kontoNotizen(
    {
      dabeiSeit: kopf.seit ?? new Date(),
      stimmen: zahlen?.stimmen ?? 0,
      gewonnen: zahlen?.gewonnen ?? 0,
      vorgeschlagen: vorschlaege?.length ?? 0,
      ungelesen: nachrichten?.filter((n) => !n.gelesen).length ?? 0,
    },
    w.mitglied.kapitel,
    sprache,
  );
  const aromen = liebsteAromen((profil?.werte ?? leereProfilWerte()).geschmack).map((a) => w.label.geschmack[a]);
  return <ProfilKopf {...kopf} notizen={kopfNotizen(profilZahlen, kontoZahlen)} aromen={aromen} />;
}
```

Danach `app/[lang]/mitglied/page.tsx` löschen: `git rm "app/[lang]/mitglied/page.tsx"`.

- [ ] **Step 9: Weiterleitung und Links**

`lib/alte-adressen.ts` ergänzen:

```ts
/** /mitglied war bis 2026-10-13 die Konto-Seite; seitdem steht alles auf /profil (Spec Profil und Konto vereint 3.3). */
export const ALTE_KONTO_WEITERLEITUNGEN = [
  { source: "/mitglied", destination: "/profil", permanent: true },
] as const satisfies ReadonlyArray<{ source: string; destination: string; permanent: boolean }>;
```

`next.config.ts`: `import { ALTE_KATALOG_WEITERLEITUNGEN, ALTE_KONTO_WEITERLEITUNGEN } from "./lib/alte-adressen";` und `return [...ALTE_KATALOG_WEITERLEITUNGEN, ...ALTE_KONTO_WEITERLEITUNGEN];`, Kommentar um „/mitglied -> /profil“ ergänzen.

Links und Revalidierung:
- `app/[lang]/admin/vorschlag-aktionen.ts:269`: `link: "/profil#meine-vorschlaege-titel"`.
- `components/vorschlag/BlueteVorschlagFormular.tsx:221`: `href="/profil#meine-vorschlaege-titel"`.
- `revalidiereSprachen("/mitglied")` in `app/[lang]/admin/vorschlag-aktionen.ts:138`, `app/[lang]/blueten/[slug]/aktionen.ts:136`, `app/[lang]/mitglied/aktionen.ts:45,97,106`, `app/[lang]/vorschlagen/aktionen.ts:109` auf `"/profil"` umstellen; steht `"/profil"` in derselben Funktion schon, die Zeile löschen statt doppeln. In `app/[lang]/mitglied/aktionen.ts:139` die Liste `["/mitglied", "/", "/reviews"]` zu `["/profil", "/", "/reviews"]`.
- Danach: `grep -rn '"/mitglied' app components lib` darf nur noch `lib/alte-adressen.ts` treffen. Texte in `lib/i18n`, die auf „Konto“ als Seite verweisen, mit `grep -n "Konto\b\|account page" lib/i18n/de.ts lib/i18n/en.ts` prüfen und auf „Profil“ umformulieren, wo sie einen Ort meinen.

- [ ] **Step 10: Alte Tests nachziehen**

- `tests/profil-seite.test.ts`: die Tests „/profil: Kapitel-Reihenfolge …“, „/mitglied: Titel ist der Reiter Konto …“ und „/mitglied: erst Konto …“ löschen (ersetzt durch `tests/profil-vereint.test.ts`). In den übrigen Tests, die `seite()` lesen und Teile suchen, die jetzt in `profil-reihen.tsx` stehen (`netzFehlt`, `verlauf={verlauf}`, `<Feld id="vorschlaege"`), `seite()` durch das Lesen von `app/[lang]/profil/profil-reihen.tsx` ersetzen und `id="vorschlaege"` zu `id="aehnliches"`.
- `tests/profil-ansichten.test.ts`: die Tests „Profilseite: Rahmen, Seitenleiste, Reiter …“ und „Profilseite: je Ansicht nur deren Reihen“ löschen; die Spur-Tests bleiben.
- `tests/profil-reihenfolge.test.ts`: Tests auf die Reiter löschen; „Kein Feld Terpene mehr, jedes Feld mit Kopf, klein und als Karte, ohne Rasterspalten“ gegen `profil-reihen.tsx` plus `konto-reihen.tsx` prüfen lassen.
- `tests/konto.test.ts`, Test „Seiten: Teilfehler werden geloggt …“: statt `app/[lang]/mitglied/page.tsx` die Datei `app/[lang]/profil/laden.ts` lesen.
- `tests/bluete-benachrichtigungen.test.ts` und `tests/bluete-kleinpunkte.test.ts`: `app/[lang]/mitglied/page.tsx` durch `app/[lang]/profil/konto-reihen.tsx` ersetzen; `benachrichtigungenLaden(id)` und `eigeneVorschlaege(id)` stehen jetzt in `laden.ts` (dort prüfen).
- `tests/i18n-literale.test.ts`: `"app/[lang]/mitglied/page.tsx"` ersetzen durch `"app/[lang]/profil/profil-reihen.tsx"`, `"app/[lang]/profil/konto-reihen.tsx"`, `"components/profil/ProfilKopf.tsx"`.
- `tests/alte-adressen.test.ts`: nichts löschen; der neue Test steht in `profil-vereint.test.ts`.

- [ ] **Step 11: Grün prüfen**

Run: `npx tsx --test tests/profil-vereint.test.ts` → PASS.
Run: `npx tsc --noEmit` → keine Fehler.
Run: `npm test` → alle grün.

- [ ] **Step 12: Commit**

```bash
git diff --stat
git add -A "app/[lang]/profil" "app/[lang]/mitglied" components lib next.config.ts tests
git commit -m "feat(profil): Profil und Konto auf einer Seite, /mitglied leitet weiter"
```

### Task B3: Öffentliches Profil ohne Reiter, Altbausteine weg

**Skills:** `ui-design-engine`, `better-layout`, `safe-refactor`

**Files:**
- Modify: `app/[lang]/profil/[kurzId]/page.tsx`
- Delete: `components/profil/ProfilRahmen.tsx`, `components/profil/ProfilReiter.tsx`, `components/profil/ProfilSeitenleiste.tsx`, `components/kapitel/Kapitelkopf.tsx`, `components/kapitel/KapitelRaster.tsx`
- Modify: `lib/profil-ansicht.ts` (nur `liebsteAromen` bleibt)
- Test: `tests/profil-oeffentlich-desktop.test.ts`, `tests/profil-seitenleiste.test.ts`, `tests/kapitel.test.ts`, `tests/i18n-literale.test.ts`

**Interfaces:**
- Consumes: `ProfilKopf` (Task B1), `SPALTEN` (Task B2).

- [ ] **Step 1: Tests anpassen (rot)**

`tests/profil-oeffentlich-desktop.test.ts`, ersten Test ersetzen:

```ts
test("Öffentliches Profil: Profilkopf ohne Aktionen, Netz und Bewertungen untereinander, keine Reiter", () => {
  const q = readFileSync("app/[lang]/profil/[kurzId]/page.tsx", "utf8");
  assert.match(q, /<ProfilKopf/);
  assert.match(q, /aktionen=\{\[\]\}/);
  assert.doesNotMatch(q, /ProfilReiter|ProfilRahmen|ProfilSeitenleiste|ansicht/);
  assert.ok(q.indexOf('id="netz"') < q.indexOf('id="bewertungen"'));
});
```

(`readFileSync` importieren, falls nicht vorhanden.)

`tests/profil-seitenleiste.test.ts`: die Tests zu `ansichtAus`, `ProfilSeitenleiste`, `ProfilReiter` und `ProfilRahmen` löschen; „liebsteAromen“ bleibt; „Öffentliches Profil: neutrale Beschriftung der Zahlen“ auf `ProfilKopf` umstellen (gleiche Props wie zuvor ohne `aktionen`-Inhalt, Erwartung `aria-label="Zahlen"`). Die Datei danach in `tests/profil-aromen.test.ts` umbenennen (`git mv`).

`tests/kapitel.test.ts`: die Tests „KapitelRaster: …“ und „Kapitelkopf: …“ samt Imports löschen.

`tests/i18n-literale.test.ts`: `"components/kapitel/KapitelRaster.tsx"` und `"components/kapitel/Kapitelkopf.tsx"` aus der Liste löschen.

- [ ] **Step 2: Rot prüfen**

Run: `npx tsx --test tests/profil-oeffentlich-desktop.test.ts`
Expected: FAIL.

- [ ] **Step 3: Öffentliche Seite**

In `app/[lang]/profil/[kurzId]/page.tsx`:
- Imports: `ProfilKopf` statt `ProfilRahmen`, `ProfilReiter`, `ProfilSeitenleiste`; `liebsteAromen` aus `@/lib/profil-ansicht` (ohne `ansichtAus`); `SPALTEN` aus `../spalten`.
- `searchParams` und `sichtbar` entfallen (Signatur nur noch `{ params }: Params`, Typ `SuchParameter` löschen).
- Aufbau:

```tsx
  return (
    <div className="pb-16">
      <ProfilKopf
        name={profil.anzeigename}
        avatarId={profil.avatarId}
        rolle={profil.rolle}
        seit={profil.seit}
        notizen={[{ zahl: String(profil.anzahl), wort: s.reiter.bewertungen, satz: mehrzahl(sprache, w.profil.anzahl, profil.anzahl), href: "#bewertungen-titel" }]}
        aromen={werte ? liebsteAromen(werte.geschmack).map((a) => w.label.geschmack[a]) : []}
        aktionen={[]}
        texte={s}
        sprache={sprache}
        zahlenLabel={s.zahlenNeutral}
      />
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-8 px-4 pt-8 sm:px-8 min-[1080px]:pt-12 min-[1280px]:grid-cols-12">
        <Feld id="netz" rahmen="karte" groesse="klein" titel={texte.netzTitel} className={SPALTEN[12]}>
          {/* Inhalt unverändert aus dem bisherigen Zweig „uebersicht“ */}
        </Feld>
        <Feld id="bewertungen" rahmen="karte" groesse="klein" titel={texte.bewertungenTitel} className={SPALTEN[12]}>
          <OeffentlicheBewertungen bewertungen={profil.bewertungen} anzahl={profil.anzahl} texte={texte} w={w} sprache={sprache} />
        </Feld>
      </div>
    </div>
  );
```

Den Doku-Kommentar über der Funktion auf „Aufbau wie Mein Profil: Profilkopf, darunter Netz und Bewertungen“ anpassen.

- [ ] **Step 4: Altbausteine löschen**

```bash
git rm components/profil/ProfilRahmen.tsx components/profil/ProfilReiter.tsx components/profil/ProfilSeitenleiste.tsx components/kapitel/Kapitelkopf.tsx components/kapitel/KapitelRaster.tsx
```

`lib/profil-ansicht.ts`: `PROFIL_ANSICHTEN`, `ProfilAnsicht` und `ansichtAus` löschen; `liebsteAromen` bleibt. Danach `grep -rn "ProfilRahmen\|ProfilReiter\|ProfilSeitenleiste\|Kapitelkopf\|KapitelRaster\|ansichtAus\|PROFIL_ANSICHTEN" app components lib tests` muss leer sein (Kommentare in `globals.css` dürfen bleiben).

- [ ] **Step 5: Grün prüfen**

Run: `npx tsc --noEmit` → keine Fehler.
Run: `npm test` → alle grün.

- [ ] **Step 6: Commit**

```bash
git diff --stat
git add -A app components lib tests
git commit -m "refactor(profil): öffentliches Profil ohne Reiter, Rahmen, Reiter und Kapitelkopf entfernt"
```

---

## Abschluss (Controller)

1. Gesamtreview je Strang (Skills `better-interface`, `web-design-guidelines`, `caveman-review` oder `superpowers:requesting-code-review`).
2. Merge nach `main`: erst `pk-seite`, dann `pk-kopf`; Konflikte in `lib/i18n/de.ts`/`en.ts` durch Behalten beider Hunks lösen. Danach `npx tsc --noEmit` und `npm test` auf `main`.
3. Push nach `main` (Deploy läuft über GitHub).
4. Live per Browser: Kopfknopf abgemeldet und angemeldet (Name, Kürzung), `/mitglied` → `/profil`, `/profil` bei 1440, 1124 und 390 px hell und dunkel (Sticky-Kopf, Sprunglinks landen unter dem Kopf, kein Querscroll), `/profil/<kurz-id>`.
5. CPU von `/profil` in der Workers-Telemetrie (Abfrage aus HANDOFF Session 54); liegt sie deutlich über `/reviews` oder kommt 1102, das in HANDOFF als Folgeaufgabe vermerken (Nachladen der unteren Reihen beim Scrollen, Spec 4).
6. HANDOFF aktualisieren, Worktrees entfernen.
