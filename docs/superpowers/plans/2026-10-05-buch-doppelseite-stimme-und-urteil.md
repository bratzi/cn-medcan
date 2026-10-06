# Buch-Doppelseite: Stimme und Urteil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das blätterbare Buch auf der Blütenseite zeigt links die Person (Avatar, Name, Text, Kolophon) und rechts das Urteil (Blatturteil, fünf Noten, Terpenbewertung als Karteneinlage), ohne dass der Inhalt über den Rahmen läuft.

**Architecture:** Ein neuer Server-Baustein `BuchDoppelseite` ersetzt den `voll`-Zweig von `Doppelseite` und setzt drei kleine Bausteine zusammen (`BlattUrteil`, `NotenLeiste`, `BuchKolophon`). `Doppelseite` bleibt nur für den Auszug. Die Höhe wächst per `min-h`, die Choreografie ist reines CSS und hängt an `data-im-bild` am Stapel. Die Zahl der Bewertungen je Autor kommt aus einer eigenen, abgesicherten `groupBy`-Abfrage.

**Tech Stack:** Next.js (App Router, RSC), React, Tailwind v4 mit Projekt-Tokens, Prisma 7 auf Cloudflare D1, `node:test` mit `tsx`.

**Spec:** `docs/superpowers/specs/2026-10-05-buch-doppelseite-stimme-und-urteil-design.md` (Commit `a56e0a5`). Wer einen Task umsetzt, liest die Spec mit.

## Global Constraints

- Kein GSAP, kein Lenis im Buch. Bewegung nur `transform`, `opacity`, `clip-path`, einmalig, keine neue Dauerbewegung (`ui-design-engine` Abschnitt 7).
- Abstände nur aus der Leiter 8, 16, 24, 32, 40, 48, 64, 80, 96, 128 px; 4 px nur als optische Korrektur mit Begründung im Code.
- Nur semantische Farbtokens, kein `dark:`, keine Hex- oder `oklch()`-Werte in Komponenten; `npm run farben` bleibt grün.
- Neue Texte ohne Geviertstrich (U+2014) und Gedankenstrich (U+2013). Jeder sichtbare Text kommt aus dem Wörterbuch (de und en); neue Dateien kommen in `UMGESTELLT` von `tests/i18n-literale.test.ts`.
- `font-hand` steht in derselben Zeile mit einem Handschrift-Grad (`text-vermerk`), nie unter 32 px, nie für Namen, Zahlen oder Fließtext.
- Höchstens drei Schriftgrade je Sektion. Interaktiv sind nur `button`, `a`, `input`.
- Beide Hälften einer Doppelseite behalten `data-buchseite="links"` und `"rechts"`; Umblättern, Autoplay, Tastatur und Wischen in `Buch.tsx` bleiben unverändert.
- Die rechte Hälfte (Einlage mit Karte) rendert der Server nur für nahe Seiten (`NurAufgeschlagen`, CPU-Limit).
- Der Auszug (Startseite, `/reviews`) bleibt Byte für Byte gleich.
- Lokal nur `npm test`, `npm run typecheck`, `npm run lint`, `npm run farben`. Kein `next dev`, `next build`, `preview`. Geprüft wird live nach dem Push, zwischen zwei Pushes mindestens 15 Minuten.
- Keine Subagents (Credits). Seriell arbeiten.
- Baseline vor dem Start (`main`, `a56e0a5`): 570 Tests grün, `tsc` sauber, Lint mit genau zwei bekannten Fehlern (`AromaKarte.tsx` `setMontiert` im Effekt, `RegisterAuswahl.tsx:179`). Es darf kein dritter Lint-Fehler dazukommen.
- Commits in Prosa, mit der Zeile `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Bash-Aufrufe unter etwa 7000 Zeichen halten (längere Heredocs brechen ab). Größere Dateien mit dem Write-Werkzeug schreiben.

## Review Focus

1. **Altbewertung ohne Gesamtnote, ohne Text, ohne Charge, ohne Autor** (Seed, gelöschtes Mitglied): kein `NaN`, keine leere Zahl, kein Avatar mit Initial für "Anonym", sinnvolle Ersatztexte. Getestet in Task 4 und 7.
2. **Sehr langer Name und sehr langer Text:** der Name klammert auf zwei Zeilen und steht ganz im `title`, der Text endet mit "Weiterlesen", nichts läuft über den Rahmen. Getestet in Task 5 und 7.
3. **Gespeicherte Terpenwahl ohne Treffer in der Sorte, oder mit alten Stufen 1 bis 5:** alte Stufen zählen als "an", eine Wahl ohne Treffer blendet alle Terpene aus, keine Wahl lässt das bisherige Bild. Getestet in Task 3.
4. **Autor-Zahlen schlagen fehl** (D1 nicht erreichbar): die Seite lädt, nur die Zahl fehlt. Getestet in Task 1.
5. **Reduzierte Bewegung, Sparmodus, kein JavaScript:** alle Endzustände stehen sofort da, nichts bleibt unsichtbar. Getestet in Task 8.

---

## Task 1: Anzahl der Bewertungen je Autor

**Files:**
- Create: `lib/query/autoren.ts`
- Create: `tests/autoren.test.ts`
- Modify: `lib/query/strains.ts` (Import, `ReviewEintrag`, `reviews`-Select, `ladeStrainDetail`)
- Modify: `components/review/eintrag.ts` (`EintragDaten`, `alsEintrag`)

**Interfaces:**
- Produces: `ladeAutorZahlen(autorIds: readonly string[], quelle?: AutorZahlenQuelle): Promise<ReadonlyMap<string, number>>`, `autorZahlen(zeilen: readonly AutorZahl[]): ReadonlyMap<string, number>`, Typen `AutorZahl = { autorId: string | null; anzahl: number }` und `AutorZahlenQuelle`.
- Produces: `ReviewEintrag.autorBewertungen?: number | null` und `EintragDaten.autorBewertungen?: number | null`.

- [ ] **Step 1: Failing test schreiben**

Datei `tests/autoren.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { alsEintrag } from "@/components/review/eintrag";
import { autorZahlen, ladeAutorZahlen } from "@/lib/query/autoren";
import type { ReviewEintrag } from "@/lib/query/strains";

const quelle = (datei: string) => readFileSync(join(process.cwd(), datei), "utf8");

const REVIEW: ReviewEintrag = {
  id: "r1",
  istRedaktionell: false,
  autorName: "Mia",
  gesamtnote: 4,
  aussehen: 4,
  geruch: 4,
  geschmack: 4,
  wirkung: 4,
  konsistenz: 4,
  feuchtigkeitProzent: null,
  geschmacksMatrix: null,
  terpenIntensitaet: null,
  beschaffenheit: null,
  notiz: null,
  instagramReelUrl: null,
  chargenNr: null,
  erstelltAm: new Date("2026-09-12T12:00:00Z"),
};

test("autorZahlen: je Autor die Anzahl, Zeilen ohne Autor fallen weg", () => {
  const karte = autorZahlen([
    { autorId: "a", anzahl: 7 },
    { autorId: null, anzahl: 3 },
    { autorId: "b", anzahl: 1 },
  ]);
  assert.deepEqual([...karte], [["a", 7], ["b", 1]]);
});

test("ladeAutorZahlen: ohne Autoren keine Abfrage", async () => {
  let aufrufe = 0;
  const karte = await ladeAutorZahlen([], async () => {
    aufrufe += 1;
    return [];
  });
  assert.equal(aufrufe, 0);
  assert.equal(karte.size, 0);
});

test("ladeAutorZahlen: jede Id nur einmal gefragt, Zahlen kommen zurück", async () => {
  let gefragt: readonly string[] = [];
  const karte = await ladeAutorZahlen(["a", "b", "a"], async (ids) => {
    gefragt = ids;
    return [{ autorId: "a", anzahl: 5 }];
  });
  assert.deepEqual(gefragt, ["a", "b"]);
  assert.equal(karte.get("a"), 5);
  assert.equal(karte.get("b"), undefined);
});

test("ladeAutorZahlen: scheitert die Abfrage, fehlt nur die Zahl und die Seite bleibt", async () => {
  const karte = await ladeAutorZahlen(["a"], async () => {
    throw new Error("D1 nicht erreichbar");
  });
  assert.equal(karte.size, 0);
});

test("alsEintrag reicht die Zahl der Bewertungen des Autors durch, ohne Zahl bleibt null", () => {
  const produkt = { handelsname: "Nebelharz 22 (fiktiv)", slug: "nebelharz-22" };
  assert.equal(alsEintrag({ ...REVIEW, autorBewertungen: 7 }, produkt).autorBewertungen, 7);
  assert.equal(alsEintrag(REVIEW, produkt).autorBewertungen, null);
  assert.equal(alsEintrag({ ...REVIEW, autorBewertungen: null }, produkt).autorBewertungen, null);
});

test("Abfrage: die Sortenabfrage lädt die Autor-Id, die Zahlen kommen getrennt, über alle Sorten und nur freigegeben", () => {
  const strains = quelle("lib/query/strains.ts");
  assert.match(strains, /istRedaktionell: true,\s*autorId: true,/);
  assert.match(strains, /await ladeAutorZahlen\(/);
  assert.match(strains, /autorBewertungen: review\.autorId \? \(autorZahlen\.get\(review\.autorId\) \?\? null\) : null,/);
  const autoren = quelle("lib/query/autoren.ts");
  assert.match(autoren, /by: \["autorId"\]/);
  assert.match(autoren, /freigegeben: true/);
  assert.doesNotMatch(autoren, /strainId/, "die Zahl zählt über alle Sorten");
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/autoren.test.ts`
Expected: FAIL, `Cannot find module '@/lib/query/autoren'` (oder `ERR_MODULE_NOT_FOUND`).

- [ ] **Step 3: Baustein anlegen**

Datei `lib/query/autoren.ts`:

```ts
/**
 * Wie viele Bewertungen ein Mitglied insgesamt geschrieben hat (Buch, Spec 2026-10-05):
 * freigegebene Bewertungen über alle Sorten. Je Mitglied und Sorte gibt es höchstens eine
 * (Unique-Index über Autor und Sorte), die Zahl zählt also Sorten.
 *
 * Eigene Abfrage statt Zählung in der Sortenabfrage: die Zahl ist Beiwerk. Scheitert sie,
 * fehlt nur die Zahl im Buch, nie die Seite.
 */

/** Eine Zeile aus der Gruppierung. */
export type AutorZahl = { autorId: string | null; anzahl: number };

/** Woher die Zahlen kommen; in Tests wird sie ersetzt. */
export type AutorZahlenQuelle = (autorIds: readonly string[]) => Promise<readonly AutorZahl[]>;

async function ausDerDatenbank(autorIds: readonly string[]): Promise<readonly AutorZahl[]> {
  // Erst hier geladen: Tests der reinen Teile brauchen weder Cloudflare noch den Prisma-Client.
  const { getPrisma } = await import("@/lib/prisma");
  const prisma = await getPrisma();
  const zeilen = await prisma.review.groupBy({
    by: ["autorId"],
    where: { autorId: { in: [...autorIds] }, freigegeben: true },
    _count: { _all: true },
  });
  return zeilen.map((zeile) => ({ autorId: zeile.autorId, anzahl: zeile._count._all }));
}

export function autorZahlen(zeilen: readonly AutorZahl[]): ReadonlyMap<string, number> {
  const karte = new Map<string, number>();
  for (const zeile of zeilen) {
    if (zeile.autorId !== null) karte.set(zeile.autorId, zeile.anzahl);
  }
  return karte;
}

export async function ladeAutorZahlen(
  autorIds: readonly string[],
  quelle: AutorZahlenQuelle = ausDerDatenbank,
): Promise<ReadonlyMap<string, number>> {
  const ids = [...new Set(autorIds)];
  if (ids.length === 0) return new Map();
  try {
    return autorZahlen(await quelle(ids));
  } catch {
    return new Map();
  }
}
```

- [ ] **Step 4: `strains.ts` und `eintrag.ts` anpassen**

Als Datei `patch-task1.py` im Scratchpad ablegen und mit `python patch-task1.py` im Projektordner starten (Hilfsfunktion `patch` bricht ab, wenn ein Anker nicht genau einmal vorkommt):

```python
import io

def patch(pfad, paare):
    s = io.open(pfad, encoding="utf-8").read()
    for alt, neu in paare:
        assert s.count(alt) == 1, (pfad, alt[:60], s.count(alt))
        s = s.replace(alt, neu, 1)
    io.open(pfad, "w", encoding="utf-8", newline="").write(s)

patch("lib/query/strains.ts", [
    ('import { TREFFER_PRO_SEITE, type StrainFilter } from "./filter";',
     'import { ladeAutorZahlen } from "./autoren";\nimport { TREFFER_PRO_SEITE, type StrainFilter } from "./filter";'),
    ('  autorAvatarId?: string | null;\n  /** Gesamtnote in Blättern (T4); null bei Altbewertungen. */',
     '  autorAvatarId?: string | null;\n  /** Freigegebene Bewertungen des Autors über alle Sorten (Buch, Spec 2026-10-05); null ohne Autor oder ohne Zahl. */\n  autorBewertungen?: number | null;\n  /** Gesamtnote in Blättern (T4); null bei Altbewertungen. */'),
    ('          id: true,\n          istRedaktionell: true,\n          aussehen: true,',
     '          id: true,\n          istRedaktionell: true,\n          autorId: true,\n          aussehen: true,'),
    ('  if (!zeile) return null;\n\n  const { guenstigsterPreisCent, anzahlApothekenVerfuegbar } =\n    verdichteBestaende(\n      zeile.bestaende.map((bestand) => ({',
     '  if (!zeile) return null;\n\n  const autorZahlen = await ladeAutorZahlen(\n    zeile.reviews.flatMap((review) => (review.autorId ? [review.autorId] : [])),\n  );\n\n  const { guenstigsterPreisCent, anzahlApothekenVerfuegbar } =\n    verdichteBestaende(\n      zeile.bestaende.map((bestand) => ({'),
    ('      autorAvatarId: review.autor?.avatar?.id ?? null,\n',
     '      autorAvatarId: review.autor?.avatar?.id ?? null,\n      autorBewertungen: review.autorId ? (autorZahlen.get(review.autorId) ?? null) : null,\n'),
])

patch("components/review/eintrag.ts", [
    ('  autorAvatarId?: string | null;\n  /** Gesamtnote 0,5 bis 5 in Blättern (T4); null bei Altbewertungen. */',
     '  autorAvatarId?: string | null;\n  /** Freigegebene Bewertungen des Autors über alle Sorten; null oder fehlend ohne Zahl. */\n  autorBewertungen?: number | null;\n  /** Gesamtnote 0,5 bis 5 in Blättern (T4); null bei Altbewertungen. */'),
    ('    autorAvatarId: review.autorAvatarId ?? null,\n',
     '    autorAvatarId: review.autorAvatarId ?? null,\n    autorBewertungen: review.autorBewertungen ?? null,\n'),
])
print("ok")
```

- [ ] **Step 5: Tests und Typen prüfen**

Run: `npx tsx --test tests/autoren.test.ts && npx tsc --noEmit`
Expected: alle sechs Tests PASS, `tsc` ohne Ausgabe. Meldet `tsc` einen Fehler im `groupBy` (Typ von `by`), dann `by: ["autorId"] as const` setzen und erneut prüfen.

- [ ] **Step 6: Commit**

```bash
cd /c/cn && git add lib/query/autoren.ts lib/query/strains.ts components/review/eintrag.ts tests/autoren.test.ts
git commit -m "feat: Zahl der Bewertungen je Autor für das Buch, abgesichert gegen Abfragefehler"
```

(Commit-Text mit der Trailer-Zeile aus den Global Constraints ergänzen.)

---

## Task 2: Texte für de und en

**Files:**
- Modify: `lib/i18n/de.ts` (Block `buch`)
- Modify: `lib/i18n/en.ts` (Block `buch`)
- Create: `tests/buch-texte.test.ts`

**Interfaces:**
- Produces: `w.buch.bewertungVon` ("Bewertung von {name}"), `vonEuch`, `datum`, `chargeLabel`, `nichtAngegeben`, `bewertungenInsgesamt`, `keinText`, `blaetter`; `w.buch.reiterKarte` heißt "Terpenbewertung".

- [ ] **Step 1: Failing test schreiben**

Datei `tests/buch-texte.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";

const NEU = ["bewertungVon", "vonEuch", "datum", "chargeLabel", "nichtAngegeben", "bewertungenInsgesamt", "keinText", "blaetter"] as const;

test("Buch-Texte: neue Schlüssel in de und en, ohne Geviert- und Gedankenstrich", () => {
  for (const woerterbuch of [de, en]) {
    for (const schluessel of NEU) {
      const text = woerterbuch.buch[schluessel];
      assert.ok(text.length > 0, schluessel);
      assert.doesNotMatch(text, /[–—]/, schluessel);
    }
  }
  assert.equal(de.buch.bewertungVon, "Bewertung von {name}");
  assert.equal(en.buch.bewertungVon, "Review by {name}");
});

test("Der Reiter der Karte heißt Terpenbewertung", () => {
  assert.equal(de.buch.reiterKarte, "Terpenbewertung");
  assert.equal(en.buch.reiterKarte, "Terpene rating");
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/buch-texte.test.ts`
Expected: FAIL (`undefined` bei den neuen Schlüsseln, `Aroma-Karte` statt `Terpenbewertung`). Falls `tsx` den Import von `en` nicht auflöst, den Export-Namen in `lib/i18n/en.ts` prüfen (`export const en`).

- [ ] **Step 3: Wörterbücher ergänzen**

Als `patch-task2.py` ablegen und ausführen (gleiche Hilfsfunktion `patch` wie in Task 1):

```python
import io

def patch(pfad, paare):
    s = io.open(pfad, encoding="utf-8").read()
    for alt, neu in paare:
        assert s.count(alt) == 1, (pfad, alt[:60], s.count(alt))
        s = s.replace(alt, neu, 1)
    io.open(pfad, "w", encoding="utf-8", newline="").write(s)

patch("lib/i18n/de.ts", [
    ('    reiterKarte: "Aroma-Karte",', '    reiterKarte: "Terpenbewertung",'),
    ('    schliessen: "Schließen",\n  },\n  reviews: {',
     '    schliessen: "Schließen",\n'
     '    bewertungVon: "Bewertung von {name}",\n'
     '    vonEuch: "von euch",\n'
     '    datum: "Datum",\n'
     '    chargeLabel: "Charge",\n'
     '    nichtAngegeben: "nicht angegeben",\n'
     '    bewertungenInsgesamt: "Bewertungen insgesamt",\n'
     '    keinText: "Kein Text zu dieser Bewertung.",\n'
     '    blaetter: "von 5 Blättern",\n'
     '  },\n  reviews: {'),
])

patch("lib/i18n/en.ts", [
    ('    reiterKarte: "Aroma map",', '    reiterKarte: "Terpene rating",'),
    ('    schliessen: "Close",\n  },\n  reviews: {',
     '    schliessen: "Close",\n'
     '    bewertungVon: "Review by {name}",\n'
     '    vonEuch: "from you",\n'
     '    datum: "Date",\n'
     '    chargeLabel: "Batch",\n'
     '    nichtAngegeben: "not stated",\n'
     '    bewertungenInsgesamt: "Reviews in total",\n'
     '    keinText: "No text with this review.",\n'
     '    blaetter: "of 5 leaves",\n'
     '  },\n  reviews: {'),
])
print("ok")
```

- [ ] **Step 3b: Bestehende Tests, die den alten Reiter-Namen erwarten, anpassen**

Run: `grep -rn "Aroma-Karte" tests/doppelseite.test.ts`
Expected: eine Zeile (`role="tab"[^>]*aria-selected="true"[^>]*>Aroma-Karte<`). Dort `Aroma-Karte` durch `Terpenbewertung` ersetzen (der Test wird in Task 9 ohnehin gelöscht, bis dahin muss er grün bleiben).

- [ ] **Step 4: Tests prüfen**

Run: `npx tsx --test tests/buch-texte.test.ts tests/i18n-woerterbuch.test.ts tests/doppelseite.test.ts && npx tsc --noEmit`
Expected: PASS, `tsc` ohne Ausgabe (`en` hat dieselbe Form wie `de`).

- [ ] **Step 5: Commit**

```bash
cd /c/cn && git add lib/i18n/de.ts lib/i18n/en.ts tests/buch-texte.test.ts tests/doppelseite.test.ts
git commit -m "feat: Texte für das neue Buch, der Reiter der Karte heißt Terpenbewertung"
```

---
## Task 3: Gemeinsame Bausteine auslagern und die Terpenwahl lesen

`Doppelseite` (Auszug) und das neue Buch brauchen dieselben Falz-Klassen, dieselben Serien der Karte und dieselbe Animationshilfe. Sie werden ausgelagert, der Auszug muss dabei Byte für Byte gleich bleiben (Golden Master).

**Files:**
- Create: `components/review/falz.ts`, `components/review/aroma-serien.ts`, `components/review/eintritt.ts`
- Create: `tests/hilfen/eintrag.ts`, `tests/aroma-serien.test.ts`
- Create (nur lokal, nie committen): `scripts/golden-doppelseite.tmp.ts`
- Modify: `components/review/Doppelseite.tsx`

**Interfaces:**
- Produces: `FALZ_LINKS`, `FALZ_RECHTS` (Strings), `aromaSerien(eintrag: EintragDaten, w: Woerterbuch): AromaSerie[]`, `terpenWahlStaerken(terpene: readonly KartenTerpen[], wahl: TerpenIntensitaet): Record<string, number> | undefined`, `ablauf(i: number): CSSProperties` (setzt `--i`), Testhilfe `eintrag(teil?: Partial<EintragDaten>): EintragDaten`.
- Consumes: `terpenAnAus` aus `lib/query/bewertung.ts`, `herstellerProfil` aus `lib/aromakarte.ts`.

- [ ] **Step 1: Testhilfe und Golden-Master-Skript anlegen**

Datei `tests/hilfen/eintrag.ts`:

```ts
import type { EintragDaten } from "@/components/review/eintrag";

export const MATRIX = { diesel: 1, zitrus: 0, erdig: 5, suess: 1, wuerzig: 4, blumig: 0, holzig: 2, kraeutrig: 2, fruchtig: 0, minzig: 0 };

/** Eine Bewertung für die Tests der Doppelseiten; einzelne Felder lassen sich überschreiben. */
export function eintrag(teil: Partial<EintragDaten> = {}): EintragDaten {
  return {
    id: "r1",
    handelsname: "Nebelharz 22 (fiktiv)",
    slug: "nebelharz-22",
    aussehen: 4,
    geruch: 5,
    geschmack: 5,
    wirkung: 4.5,
    konsistenz: 2.5,
    geschmacksMatrix: MATRIX,
    feuchtigkeitProzent: 11.2,
    notiz: "Sehr dichte Blüten.",
    instagramReelUrl: null,
    chargenNr: "CH-2401",
    erstelltAm: new Date("2026-09-12T12:00:00Z"),
    istBetreiber: true,
    autorName: "Waldi",
    autorBewertungen: 7,
    gesamtnote: 3.5,
    terpene: [],
    terpenIntensitaet: {},
    beschaffenheit: {},
    ...teil,
  };
}
```

Datei `scripts/golden-doppelseite.tmp.ts` (Hilfsmittel für den Vergleich, wird am Ende von Task 9 gelöscht):

```ts
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { Doppelseite } from "@/components/review/Doppelseite";
import type { KartenTerpen } from "@/lib/aromakarte";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { eintrag } from "../tests/hilfen/eintrag";

const TERPENE: KartenTerpen[] = [
  { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.6, rang: 1 },
  { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 },
];

const VARIANTEN = [
  ["standard", eintrag({ terpene: TERPENE }), {}],
  ["story", eintrag({ terpene: TERPENE }), { story: true }],
  ["ohne-notiz", eintrag({ notiz: null }), {}],
  ["ohne-gesamtnote", eintrag({ gesamtnote: null }), {}],
  ["community", eintrag({ istBetreiber: false, autorName: "Mia", autorAvatarId: "bild-1" }), {}],
  ["ohne-autor", eintrag({ autorName: null, istBetreiber: false }), {}],
  ["ohne-charge", eintrag({ chargenNr: null }), {}],
  ["lang", eintrag({ notiz: "Sehr dichte Blüten. ".repeat(30), handelsname: "Sehrlangerhandelsnameohneleerzeichen" }), {}],
] as const;

const ausgabe = VARIANTEN.map(([name, daten, extra]) => ({
  name,
  html: [de, en].map((w, i) =>
    renderToStaticMarkup(
      createElement(
        KarteSofortKontext.Provider,
        { value: true },
        createElement(Doppelseite, { eintrag: daten, umfang: "auszug", ueberschrift: "h3", w, sprache: i === 0 ? "de" : "en", ...extra } as never),
      ),
    ),
  ),
}));
console.log(JSON.stringify(ausgabe, null, 1));
```

- [ ] **Step 2: Zustand vor dem Umbau festhalten**

Run:

```bash
cd /c/cn && SP="/c/Windows/TEMP/claude/c--cn/4e0d9527-c188-4341-8237-3a73cc0dc474/scratchpad" && npx tsx scripts/golden-doppelseite.tmp.ts > "$SP/golden-vorher.json" && wc -c "$SP/golden-vorher.json"
```

Expected: eine JSON-Datei von einigen hundert KB (acht Varianten, je zwei Sprachen). Bricht das Skript ab, die Fehlermeldung lesen und die Varianten anpassen (zum Beispiel einen Import), bis es läuft. Erst dann weiter.

- [ ] **Step 3: Failing test für die Terpenwahl schreiben**

Datei `tests/aroma-serien.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { aromaSerien, terpenWahlStaerken } from "@/components/review/aroma-serien";
import type { KartenTerpen } from "@/lib/aromakarte";
import { de } from "@/lib/i18n/de";
import { eintrag } from "./hilfen/eintrag";

const TERPENE: KartenTerpen[] = [
  { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.6, rang: 1 },
  { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 },
];

test("Terpenwahl: ohne gespeicherte Wahl bleibt es beim bisherigen Bild", () => {
  assert.equal(terpenWahlStaerken(TERPENE, {}), undefined);
});

test("Terpenwahl: gewählte Terpene voll, die übrigen aus", () => {
  assert.deepEqual(terpenWahlStaerken(TERPENE, { Myrcen: 1, Limonen: 0 }), { Myrcen: 1, Limonen: 0 });
});

test("Terpenwahl: alte Stufen über 0 zählen als an, ein fehlendes Terpen als aus", () => {
  assert.deepEqual(terpenWahlStaerken(TERPENE, { Myrcen: 3 }), { Myrcen: 1, Limonen: 0 });
  assert.deepEqual(terpenWahlStaerken(TERPENE, { Myrcen: 5, Limonen: 1 }), { Myrcen: 1, Limonen: 1 });
});

test("Terpenwahl: eine Wahl ohne Treffer in der Sorte blendet alle Terpene der Sorte aus", () => {
  assert.deepEqual(terpenWahlStaerken(TERPENE, { Pinen: 1 }), { Myrcen: 0, Limonen: 0 });
});

test("aromaSerien: Herstellerserie nur mit Terpenangaben, die Bewertung immer in lila", () => {
  const mit = aromaSerien(eintrag({ terpene: TERPENE }), de);
  assert.deepEqual(mit.map((serie) => [serie.name, serie.ton]), [["Laut Hersteller", "gruen"], ["Diese Bewertung", "lila"]]);
  const ohne = aromaSerien(eintrag({ terpene: [] }), de);
  assert.deepEqual(ohne.map((serie) => [serie.name, serie.ton]), [["Diese Bewertung", "lila"]]);
});
```

- [ ] **Step 4: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/aroma-serien.test.ts`
Expected: FAIL, Modul `@/components/review/aroma-serien` fehlt.

- [ ] **Step 5: Die drei Bausteine anlegen**

Datei `components/review/falz.ts`:

```ts
/**
 * Der Falz ab lg (Doppelseite und Buch): je Seite ein leiser Verlauf von 2rem an der
 * Mitte. Die Seiten sind deckend, weil das Buch (Buch.tsx) die Hälften einzeln um den Falz dreht.
 */
export const FALZ_LINKS =
  "lg:border-r lg:border-border lg:bg-[linear-gradient(to_left,color-mix(in_oklab,var(--color-text)_7%,transparent),transparent_2rem)]";
export const FALZ_RECHTS =
  "lg:bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-text)_7%,transparent),transparent_2rem)]";
```

Datei `components/review/eintritt.ts`:

```ts
import type { CSSProperties } from "react";

/**
 * Reihenfolge beim Einzug einer Buchseite (globals.css, `[data-eintritt]`): `--i` ist der Platz
 * in der Staffel, die Verzögerung rechnet das CSS daraus.
 */
export const ablauf = (platz: number): CSSProperties => ({ "--i": platz }) as CSSProperties;
```

Datei `components/review/aroma-serien.ts`:

```ts
import type { AromaSerie } from "@/components/review/AromaKarte";
import type { EintragDaten } from "@/components/review/eintrag";
import { herstellerProfil, type KartenTerpen } from "@/lib/aromakarte";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { terpenAnAus, type TerpenIntensitaet } from "@/lib/query/bewertung";

/** Zwei Serien: was die Herstellerangaben erwarten lassen und was diese Bewertung gefunden hat. */
export function aromaSerien(eintrag: EintragDaten, w: Woerterbuch): AromaSerie[] {
  const hersteller = herstellerProfil(eintrag.terpene);
  const serien: AromaSerie[] = [];
  if (hersteller) serien.push({ name: w.aroma.serien.hersteller, ton: "gruen", matrix: hersteller });
  serien.push({ name: w.review.dieseBewertung, ton: "lila", matrix: eintrag.geschmacksMatrix });
  return serien;
}

/**
 * Die Terpenwahl des Bewertenden als Stärke je Terpen der Sorte für die Karte: 1 gewählt, 0 nicht.
 * Seit 2026-10-03 speichert die Maske an (1) oder aus (0); Bewertungen davor tragen Stufen bis 5,
 * jede Stufe über 0 gilt als an (terpenAnAus). Ohne gespeicherte Wahl gibt es nichts zu zeigen:
 * undefined, die Karte nimmt dann die Herstellerangaben. Eine Wahl, die kein Terpen der Sorte trifft,
 * blendet alle aus. Vom Bewertenden ergänzte Terpene, die der Hersteller nicht nennt, kennt die
 * Karte im Buch nicht.
 */
export function terpenWahlStaerken(
  terpene: readonly KartenTerpen[],
  wahl: TerpenIntensitaet,
): Record<string, number> | undefined {
  if (Object.keys(wahl).length === 0) return undefined;
  return Object.fromEntries(terpene.map((terpen) => [terpen.name, terpenAnAus(wahl[terpen.name] ?? 0)]));
}
```

- [ ] **Step 6: `Doppelseite.tsx` benutzt die ausgelagerten Teile**

Als `patch-task3.py` ablegen und im Projektordner ausführen (Hilfsfunktion `patch` wie in Task 1):

```python
import io

def patch(pfad, paare):
    s = io.open(pfad, encoding="utf-8").read()
    for alt, neu in paare:
        assert s.count(alt) == 1, (pfad, alt[:60], s.count(alt))
        s = s.replace(alt, neu, 1)
    io.open(pfad, "w", encoding="utf-8", newline="").write(s)

patch("components/review/Doppelseite.tsx", [
    ('import { AromaKarte, type AromaSerie } from "@/components/review/AromaKarte";\n',
     'import { AromaKarte } from "@/components/review/AromaKarte";\nimport { aromaSerien } from "@/components/review/aroma-serien";\n'),
    ('import { herstellerProfil } from "@/lib/aromakarte";\n', ''),
    ('import { eintragAnker, eintragHref, type EintragDaten } from "@/components/review/eintrag";\n',
     'import { eintragAnker, eintragHref, type EintragDaten } from "@/components/review/eintrag";\nimport { FALZ_LINKS, FALZ_RECHTS } from "@/components/review/falz";\n'),
    ('const FALZ_LINKS =\n  "lg:border-r lg:border-border lg:bg-[linear-gradient(to_left,color-mix(in_oklab,var(--color-text)_7%,transparent),transparent_2rem)]";\nconst FALZ_RECHTS =\n  "lg:bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-text)_7%,transparent),transparent_2rem)]";\n\n', '\n'),
    ('/** Zwei Serien: was die Herstellerangaben erwarten lassen und was diese Bewertung gefunden hat. */\nfunction aromaSerien(eintrag: EintragDaten, w: Woerterbuch): AromaSerie[] {\n  const hersteller = herstellerProfil(eintrag.terpene);\n  const serien: AromaSerie[] = [];\n  if (hersteller) serien.push({ name: w.aroma.serien.hersteller, ton: "gruen", matrix: hersteller });\n  serien.push({ name: w.review.dieseBewertung, ton: "lila", matrix: eintrag.geschmacksMatrix });\n  return serien;\n}\n\n', ''),
])
print("ok")
```

Danach prüfen, dass zwischen `const SEITE = ...;` und `export type DoppelseiteProps` genau eine Leerzeile steht (der Patch lässt eine stehen).

- [ ] **Step 7: Alles prüfen, Auszug vergleichen**

Run:

```bash
cd /c/cn && SP="/c/Windows/TEMP/claude/c--cn/4e0d9527-c188-4341-8237-3a73cc0dc474/scratchpad" && npx tsx --test tests/aroma-serien.test.ts tests/doppelseite.test.ts && npx tsx scripts/golden-doppelseite.tmp.ts > "$SP/golden-nachher.json" && cmp "$SP/golden-vorher.json" "$SP/golden-nachher.json" && echo "AUSZUG GLEICH" && npx tsc --noEmit
```

Expected: alle Tests PASS, `AUSZUG GLEICH`, `tsc` ohne Ausgabe. Bei einem Unterschied ist der Auszug verändert: Patch zurücknehmen und prüfen, welche Zeile abweicht (`diff` der beiden JSON-Dateien).

- [ ] **Step 8: Commit**

```bash
cd /c/cn && git add components/review/falz.ts components/review/aroma-serien.ts components/review/eintritt.ts components/review/Doppelseite.tsx tests/hilfen/eintrag.ts tests/aroma-serien.test.ts
git status --short   # scripts/golden-doppelseite.tmp.ts bleibt untracked
git commit -m "refactor: Falz, Karten-Serien und Terpenwahl aus der Doppelseite ausgelagert, Auszug unverändert"
```

---

## Task 4: Blatturteil, Notenleiste und Kolophon

**Files:**
- Create: `components/review/BlattUrteil.tsx`, `components/review/NotenLeiste.tsx`, `components/review/BuchKolophon.tsx`
- Create: `tests/buch-bausteine.test.ts`
- Modify: `tests/i18n-literale.test.ts` (Liste `UMGESTELLT`)

**Interfaces:**
- Consumes: `ablauf` (Task 3), `eintrag()` (Task 3), `w.buch.*` (Task 2), `blattFuellungen` und `BlattGlyphe` aus `BlattAnzeige.tsx`.
- Produces: `BlattUrteil({ note: number; w: Woerterbuch; sprache: Sprache })`, `NotenLeiste({ eintrag: EintragDaten; w: Woerterbuch; sprache: Sprache })`, `BuchKolophon({ eintrag: EintragDaten; w: Woerterbuch; sprache: Sprache })`. Die Bausteine setzen `data-eintritt` und `--i` (Plätze: Blätter 0 bis 4, Zahl 5, Noten 5 bis 9, Kolophon 4).

- [ ] **Step 1: Failing tests schreiben**

Datei `tests/buch-bausteine.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BlattUrteil } from "@/components/review/BlattUrteil";
import { BuchKolophon } from "@/components/review/BuchKolophon";
import { NotenLeiste } from "@/components/review/NotenLeiste";
import type { EintragDaten } from "@/components/review/eintrag";
import { de } from "@/lib/i18n/de";
import { en } from "@/lib/i18n/en";
import { eintrag } from "./hilfen/eintrag";

type Sprache = "de" | "en";
const blatt = (note: number, w = de, sprache: Sprache = "de") => renderToStaticMarkup(createElement(BlattUrteil, { note, w, sprache }));
const noten = (teil: Partial<EintragDaten> = {}) => renderToStaticMarkup(createElement(NotenLeiste, { eintrag: eintrag(teil), w: de, sprache: "de" }));
const kolophon = (teil: Partial<EintragDaten> = {}, w = de, sprache: Sprache = "de") =>
  renderToStaticMarkup(createElement(BuchKolophon, { eintrag: eintrag(teil), w, sprache }));

test("Blatturteil: fünf große Blätter, die Zahl in der Buchschrift, der Wert für Vorleser als Text", () => {
  const html = blatt(3.5);
  assert.equal(html.match(/<svg aria-hidden="true" viewBox="0 0 24 24"/g)?.length, 5);
  // Drei volle Blätter zu je zwei Hälften plus die linke Hälfte des halben.
  assert.equal(html.match(/fill-accent opacity-100/g)?.length, 7);
  assert.match(html, /<span aria-hidden="true" class="numeric text-kapitel text-text">3,5<\/span>/);
  assert.match(html, /<span aria-hidden="true" class="text-small text-text-muted">von 5 Blättern<\/span>/);
  assert.match(html, /<span class="sr-only">3,5 von 5 Blättern<\/span>/);
});

test("Blatturteil: die Blätter wachsen nacheinander, die Zahl kommt danach", () => {
  const html = blatt(4);
  assert.deepEqual([...html.matchAll(/data-eintritt="blatt" style="--i:(\d)"/g)].map((m) => Number(m[1])), [0, 1, 2, 3, 4]);
  assert.match(html, /data-eintritt="auf" style="--i:5"/);
});

test("Blatturteil: englische Texte und Dezimalpunkt", () => {
  const html = blatt(4.5, en, "en");
  assert.match(html, />4\.5</);
  assert.match(html, />of 5 leaves</);
  assert.match(html, /4\.5 of 5 leaves/);
});

test("Notenleiste: fünf Noten in der Reihenfolge des Schemas, Zahl mit einer Nachkommastelle", () => {
  const html = noten();
  assert.deepEqual(
    [...html.matchAll(/<dt[^>]*>([^<]+)<\/dt>/g)].map((m) => m[1]),
    ["Aussehen", "Geruch", "Geschmack", "Wirkung", "Konsistenz"],
  );
  assert.deepEqual([...html.matchAll(/<span aria-hidden="true">(\d,\d)<\/span>/g)].map((m) => m[1]), ["4,0", "5,0", "5,0", "4,5", "2,5"]);
  assert.match(html, /<span class="sr-only">4,5 von 5<\/span>/);
});

test("Notenleiste: der Tintenstrich ist so lang wie die Note von fünf, ohne gefüllte Spur", () => {
  const html = noten();
  assert.deepEqual(
    [...html.matchAll(/data-eintritt="strich" style="[^"]*transform:scaleX\(([\d.]+)\)/g)].map((m) => Number(m[1])),
    [0.8, 1, 1, 0.9, 0.5],
  );
  assert.doesNotMatch(html, /bg-surface-sunken|bg-border\b/);
});

test("Notenleiste: Werte außerhalb von 0 bis 5 sprengen den Strich nicht", () => {
  const html = noten({ aussehen: 0, geruch: 7 });
  assert.match(html, /transform:scaleX\(0\)/);
  assert.equal(html.match(/transform:scaleX\(1\)/g)?.length, 2);
});

test("Kolophon: Datum, Charge und Zahl der Bewertungen als Begriff und Wert", () => {
  const html = kolophon();
  assert.deepEqual([...html.matchAll(/<dt[^>]*>([^<]+)<\/dt>/g)].map((m) => m[1]), ["Datum", "Charge", "Bewertungen insgesamt"]);
  assert.match(html, /<time datetime="2026-09-12T12:00:00.000Z">12\.09\.2026<\/time>/);
  assert.match(html, /<span class="numeric">CH-2401<\/span>/);
  assert.match(html, /<dd[^>]*>7<\/dd>/);
});

test("Kolophon: ohne Charge steht nicht angegeben, ohne Zahl entfällt die Zelle, eine Null bleibt sichtbar", () => {
  const html = kolophon({ chargenNr: null, autorBewertungen: null });
  assert.match(html, />nicht angegeben</);
  assert.doesNotMatch(html, /Bewertungen insgesamt/);
  assert.equal(html.match(/<dt/g)?.length, 2);
  assert.doesNotMatch(kolophon({ autorBewertungen: undefined }), /Bewertungen insgesamt/);
  assert.match(kolophon({ autorBewertungen: 0 }), /<dd[^>]*>0<\/dd>/);
});

test("Kolophon: Restfeuchte als Badge mit dem erklärenden Satz, ohne Wert nur das Badge", () => {
  const mit = kolophon({ feuchtigkeitProzent: 11.2 });
  assert.match(mit, />Restfeuchte optimal · 11,2\s%</);
  assert.match(mit, /8 bis 13 % Restfeuchte gelten als optimaler Bereich\./);
  const ohne = kolophon({ feuchtigkeitProzent: null });
  assert.match(ohne, />Restfeuchte unbekannt</);
  assert.doesNotMatch(ohne, /Keine Angabe zur Restfeuchte/);
  assert.match(kolophon({ feuchtigkeitProzent: 5 }), />Zu trocken · 5,0\s%</);
});

test("Kolophon: der Hinweis klammert ab lg auf zwei Zeilen, der ganze Satz steht im title", () => {
  const html = kolophon({ feuchtigkeitProzent: 5 });
  assert.match(html, /title="Unter 8 % Restfeuchte[^"]*" class="[^"]*\blg:line-clamp-2\b/);
});

test("Kolophon: englische Begriffe und Datumsform", () => {
  const html = kolophon({}, en, "en");
  assert.deepEqual([...html.matchAll(/<dt[^>]*>([^<]+)<\/dt>/g)].map((m) => m[1]), ["Date", "Batch", "Reviews in total"]);
  assert.match(html, />12\/09\/2026</);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/buch-bausteine.test.ts`
Expected: FAIL, die drei Module fehlen.

- [ ] **Step 3: `BlattUrteil.tsx` schreiben**

```tsx
import { BlattGlyphe, blattFuellungen } from "@/components/review/BlattAnzeige";
import { ablauf } from "@/components/review/eintritt";
import { formatiereWert } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

const BLAETTER = [1, 2, 3, 4, 5] as const;

/**
 * Das Urteil oben auf der rechten Buchseite (Spec 2026-10-05): fünf große Blätter, daneben die
 * Zahl in der leichten Buchschrift. Die Blätter sind Dekoration, der Wert steht für Vorleser als
 * Text. Es gibt nur eine Blattzeichnung, BlattGlyphe, wie in Eingabe und Anzeige.
 */
export function BlattUrteil({ note, w, sprache }: { note: number; w: Woerterbuch; sprache: Sprache }) {
  const wert = formatiereWert(note, sprache);
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <span aria-hidden="true" className="flex w-56 shrink-0 sm:w-64">
        {blattFuellungen(note).map((fuellung, index) => (
          <span key={BLAETTER[index]} data-eintritt="blatt" style={ablauf(index)} className="relative aspect-square min-w-0 flex-1">
            <BlattGlyphe fuellung={fuellung} vorschau={false} />
          </span>
        ))}
      </span>
      <p data-eintritt="auf" style={ablauf(5)} className="flex items-baseline gap-2">
        <span aria-hidden="true" className="numeric text-kapitel text-text">
          {wert}
        </span>
        <span aria-hidden="true" className="text-small text-text-muted">
          {w.buch.blaetter}
        </span>
        <span className="sr-only">{t(w.bewerten.blattWert, { wert })}</span>
      </p>
    </div>
  );
}
```

- [ ] **Step 4: `NotenLeiste.tsx` schreiben**

```tsx
import type { EintragDaten } from "@/components/review/eintrag";
import { ablauf } from "@/components/review/eintritt";
import { formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";

/**
 * Die fünf Noten zwischen Blatturteil und Karte (Spec 2026-10-05): Zahl und ein Tintenstrich
 * auf einer Haarlinie, ohne gefüllte Spur. Alle fünf, auch Wirkung: der volle Eintrag zeigt sie,
 * der Auszug auf der Startseite nie. Mobil zwei Spalten, ab sm fünf.
 */
export function NotenLeiste({ eintrag, w, sprache }: { eintrag: EintragDaten; w: Woerterbuch; sprache: Sprache }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-5 sm:gap-x-4">
      {BEWERTUNGS_ACHSEN.map((achse, index) => {
        const wert = eintrag[achse.key];
        const anteil = Math.min(Math.max(wert / 5, 0), 1);
        const zahl = formatiereZahl(wert, 1, sprache);
        return (
          // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
          <div key={achse.key} className="flex min-w-0 flex-col gap-1">
            <dt className="text-small text-text-muted">{w.schema.noten[achse.key].label}</dt>
            <dd className="flex flex-col gap-2">
              <span data-eintritt="auf" style={ablauf(5 + index)} className="numeric text-h2 text-text">
                <span aria-hidden="true">{zahl}</span>
                <span aria-hidden="true" className="text-small text-text-muted">
                  {" / 5"}
                </span>
                <span className="sr-only">{`${zahl} ${w.bluete.vonFuenf}`}</span>
              </span>
              <span aria-hidden="true" className="block border-b border-border">
                <span
                  data-eintritt="strich"
                  style={{ ...ablauf(5 + index), transform: `scaleX(${anteil})` }}
                  className="block h-1 origin-left bg-text"
                />
              </span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
```

- [ ] **Step 5: `BuchKolophon.tsx` schreiben**

```tsx
import type { EintragDaten } from "@/components/review/eintrag";
import { ablauf } from "@/components/review/eintritt";
import { Badge, type BadgeVariante } from "@/components/ui";
import { formatiereDatum, formatiereProzent, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { bewerteFeuchtigkeit, type FeuchtigkeitsEinordnung } from "@/lib/query/bewertung";

const FEUCHTIGKEIT: Record<FeuchtigkeitsEinordnung, BadgeVariante> = {
  optimal: "success",
  zu_trocken: "warning",
  zu_feucht: "danger",
  unbekannt: "neutral",
};

/** Hinweistext je Einordnung im Wörterbuch (schema.feuchte). */
const FEUCHTE_HINWEIS = {
  optimal: "optimal",
  zu_trocken: "zuTrocken",
  zu_feucht: "zuFeucht",
  unbekannt: "unbekannt",
} as const satisfies Record<FeuchtigkeitsEinordnung, string>;

/**
 * Das Kolophon unten auf der linken Buchseite (Spec 2026-10-05): Datum, Charge und die Zahl der
 * Bewertungen des Autors, darunter die Restfeuchte der Charge. Die Zahl fehlt ohne Autor oder
 * ohne Abfrageergebnis, nie steht dort eine 0 als Ersatz.
 */
export function BuchKolophon({ eintrag, w, sprache }: { eintrag: EintragDaten; w: Woerterbuch; sprache: Sprache }) {
  const feuchtigkeit = bewerteFeuchtigkeit(eintrag.feuchtigkeitProzent);
  const feuchtigkeitsText =
    eintrag.feuchtigkeitProzent === null
      ? w.review.feuchte[feuchtigkeit.einordnung]
      : `${w.review.feuchte[feuchtigkeit.einordnung]} · ${formatiereProzent(eintrag.feuchtigkeitProzent, 1, sprache)}`;
  // Ohne Messwert sagt das Badge schon alles.
  const hinweis = feuchtigkeit.einordnung === "unbekannt" ? null : w.schema.feuchte[FEUCHTE_HINWEIS[feuchtigkeit.einordnung]];
  return (
    <div data-eintritt="auf" style={ablauf(4)} className="mt-auto flex min-w-0 flex-col gap-4 border-t border-border pt-6">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="text-small text-text-muted">{w.buch.datum}</dt>
          <dd className="text-small text-text">
            <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm, sprache)}</time>
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="text-small text-text-muted">{w.buch.chargeLabel}</dt>
          <dd className="text-small text-text wrap-break-word">
            {eintrag.chargenNr ? <span className="numeric">{eintrag.chargenNr}</span> : w.buch.nichtAngegeben}
          </dd>
        </div>
        {typeof eintrag.autorBewertungen === "number" ? (
          <div className="flex min-w-0 flex-col gap-1">
            <dt className="text-small text-text-muted">{w.buch.bewertungenInsgesamt}</dt>
            <dd className="numeric text-small text-text">{formatiereZahl(eintrag.autorBewertungen, 0, sprache)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Badge variante={FEUCHTIGKEIT[feuchtigkeit.einordnung]}>{feuchtigkeitsText}</Badge>
        {hinweis ? (
          <p title={hinweis} className="max-w-[56ch] text-small text-text-muted text-pretty lg:line-clamp-2">
            {hinweis}
          </p>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Dateien in die Übersetzungs-Wache eintragen**

In `tests/i18n-literale.test.ts` in der Liste `UMGESTELLT` nach dem Eintrag `"components/review/Doppelseite.tsx",` ergänzen (Python-Patch mit `count == 1` wie oben):

```
  "components/review/BlattUrteil.tsx",
  "components/review/NotenLeiste.tsx",
  "components/review/BuchKolophon.tsx",
```

- [ ] **Step 7: Tests prüfen**

Run: `npx tsx --test tests/buch-bausteine.test.ts tests/i18n-literale.test.ts && npx tsc --noEmit`
Expected: PASS. Weicht ein Regex vom echten Markup ab (Attributreihenfolge, Leerzeichen), den Test an das tatsächliche, richtige Markup anpassen, nicht umgekehrt, außer es handelt sich um einen echten Fehler (zum Beispiel falsche Reihenfolge der Noten).

- [ ] **Step 8: Commit**

```bash
cd /c/cn && git add components/review/BlattUrteil.tsx components/review/NotenLeiste.tsx components/review/BuchKolophon.tsx tests/buch-bausteine.test.ts tests/i18n-literale.test.ts
git commit -m "feat: Blatturteil, Notenleiste und Kolophon als Bausteine des neuen Buchs"
```

---

## Task 5: Bewertungstext größer setzen und Titel der Tafel ohne Leiste

**Files:**
- Modify: `components/review/BuchNotiz.tsx`
- Modify: `components/review/BuchReiter.tsx`
- Create: `tests/buch-notiz.test.ts`, `tests/buch-reiter.test.ts`
- Modify: `tests/i18n-literale.test.ts` (Liste `UMGESTELLT`)

**Interfaces:**
- Consumes: `ablauf` (Task 3).
- Produces: `ReiterLeiste({ titel: string })`: zeigt die Leiste, und wo es keine gibt (nur ein Reiter), den Titel als `<p class="text-small font-medium text-text">`. `BuchNotiz` behält seine Props, setzt aber `data-eintritt="auf"` mit `--i: 2` und nimmt als Wurzel `lg:flex-[1_1_0px]`.

- [ ] **Step 1: Failing tests schreiben**

Datei `tests/buch-notiz.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BuchNotiz } from "@/components/review/BuchNotiz";

const zeige = (text: string) => renderToStaticMarkup(createElement(BuchNotiz, { text, weiterlesen: "Weiterlesen", schliessen: "Schließen" }));

test("Bewertungstext: größer gesetzt, im Lesemaß, ab sm in der Schrift der Überschrift ohne Fettung", () => {
  const html = zeige("Sehr dichte Blüten.");
  assert.match(html, /<p [^>]*class="[^"]*\bmax-w-\[52ch\][^"]*\btext-body\b[^"]*\bsm:text-h3\b[^"]*\bsm:font-normal\b/);
});

test("Bewertungstext: nimmt den Rest der Seite, ohne die Höhe der Zeile zu bestimmen", () => {
  const html = zeige("Sehr dichte Blüten.");
  assert.match(html, /<div [^>]*class="[^"]*\blg:min-h-0\b[^"]*\blg:flex-\[1_1_0px\]/);
  assert.doesNotMatch(html, /\blg:flex-1\b/);
});

test("Bewertungstext: wird mit der Seite eingeblendet", () => {
  assert.match(zeige("Text."), /data-eintritt="auf" style="--i:2"/);
});

test("Bewertungstext: ab lg erst sechs Zeilen, gemessen wird mit der Zeilenhöhe von text-h3", () => {
  assert.match(zeige("Sehr dichte Blüten. ".repeat(20)), /\blg:line-clamp-6\b/);
  const quelle = readFileSync(join(process.cwd(), "components/review/BuchNotiz.tsx"), "utf8");
  assert.match(quelle, /const ZEILE = 28;/);
});
```

Datei `tests/buch-reiter.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BuchReiter, ReiterLeiste } from "@/components/review/BuchReiter";

const TITEL = "Terpenbewertung";
const karte = createElement("div", { "data-karte": "1" }, createElement(ReiterLeiste, { titel: TITEL }));

test("Reiter: mit nur einer Tafel steht deren Titel statt einer Leiste", () => {
  const html = renderToStaticMarkup(
    createElement(BuchReiter, { bezeichnung: "Werte", reiter: [{ schluessel: "karte", titel: TITEL, inhalt: karte, eigeneLeiste: true }] }),
  );
  assert.match(html, /<p class="text-small font-medium text-text">Terpenbewertung<\/p>/);
  assert.doesNotMatch(html, /role="tablist"/);
});

test("Reiter: mit mehreren Tafeln steht die Leiste an der Stelle des Titels", () => {
  const html = renderToStaticMarkup(
    createElement(BuchReiter, {
      bezeichnung: "Werte",
      reiter: [
        { schluessel: "karte", titel: TITEL, inhalt: karte, eigeneLeiste: true },
        { schluessel: "beschaffenheit", titel: "Beschaffenheit", inhalt: createElement("p", null, "B") },
      ],
    }),
  );
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"[^>]*aria-selected="true"[^>]*>Terpenbewertung</);
  const anfang = html.indexOf('data-karte="1"');
  const offen = html.slice(anfang, html.indexOf("</div>", anfang));
  assert.doesNotMatch(offen, /<p class="text-small font-medium text-text">/);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/buch-notiz.test.ts tests/buch-reiter.test.ts`
Expected: FAIL (alte Klassen, `ReiterLeiste` ohne Titel).

- [ ] **Step 3: `BuchNotiz.tsx` und `BuchReiter.tsx` anpassen**

Als `patch-task5.py` ablegen und ausführen (Hilfsfunktion `patch` wie in Task 1):

```python
import io

def patch(pfad, paare):
    s = io.open(pfad, encoding="utf-8").read()
    for alt, neu in paare:
        assert s.count(alt) == 1, (pfad, alt[:60], s.count(alt))
        s = s.replace(alt, neu, 1)
    io.open(pfad, "w", encoding="utf-8", newline="").write(s)

patch("components/review/BuchNotiz.tsx", [
    ('import { buttonKlassen } from "@/components/ui";\n',
     'import { ablauf } from "@/components/review/eintritt";\nimport { buttonKlassen } from "@/components/ui";\n'),
    ('/** Zeilenhöhe von text-body (1.5rem) und Platz für den Knopf (h-9 + gap-2). */\nconst ZEILE = 24;',
     '/** Zeilenhöhe von text-h3 (1.75rem, ab sm) und Platz für den Knopf (h-9 + gap-2). */\nconst ZEILE = 28;'),
    ('      ref={flaeche}\n      data-buch-eigen={offen ? "" : undefined}',
     '      ref={flaeche}\n      data-eintritt="auf"\n      style={ablauf(2)}\n      data-buch-eigen={offen ? "" : undefined}'),
    ('"flex flex-col items-start gap-2 lg:min-h-0 lg:flex-1",',
     '// flex-basis 0: der Text trägt nicht zur Höhe der Zeile bei, die rechte Seite gibt sie vor.\n        "flex flex-col items-start gap-2 lg:min-h-0 lg:flex-[1_1_0px]",'),
    ('"max-w-[56ch] text-body text-pretty text-text",',
     '"max-w-[52ch] text-body text-pretty text-text sm:text-h3 sm:font-normal",'),
])

patch("components/review/BuchReiter.tsx", [
    ('/** Platzhalter für die Reiterleiste in einer Tafel mit `eigeneLeiste`. */\nexport function ReiterLeiste() {\n  return <>{useContext(LeisteKontext)}</>;\n}',
     '/**\n * Platzhalter für die Reiterleiste in einer Tafel mit `eigeneLeiste`. Wo es keine Leiste gibt\n * (nur eine Tafel), steht an ihrer Stelle der Titel der Tafel.\n */\nexport function ReiterLeiste({ titel }: { titel: string }) {\n  const leiste = useContext(LeisteKontext);\n  return leiste ?? <p className="text-small font-medium text-text">{titel}</p>;\n}'),
])
print("ok")
```

Hinweis: In `BuchNotiz.tsx` steht der Kommentar mitten in einer `cn(...)`-Argumentliste, das ist gültig. Sieht `eslint` oder `tsc` daran etwas, den Kommentar vor das `className` setzen.

- [ ] **Step 4: Die Aufrufer von `ReiterLeiste` nachziehen**

Run: `grep -rn "<ReiterLeiste" components app tests`
Expected: genau ein Treffer in `components/review/Doppelseite.tsx` (`karte(<ReiterLeiste />)`). Dort bis Task 9 `<ReiterLeiste titel={w.buch.reiterKarte} />` setzen, damit `tsc` grün bleibt.

- [ ] **Step 5: Beide Dateien in die Übersetzungs-Wache aufnehmen**

In `tests/i18n-literale.test.ts` nach `"components/review/BuchKolophon.tsx",` ergänzen:

```
  "components/review/BuchNotiz.tsx",
  "components/review/BuchReiter.tsx",
```

- [ ] **Step 6: Tests prüfen**

Run: `npx tsx --test tests/buch-notiz.test.ts tests/buch-reiter.test.ts tests/doppelseite.test.ts tests/i18n-literale.test.ts && npx tsc --noEmit`
Expected: PASS. In `tests/doppelseite.test.ts` darf nichts rot werden: der Test mit `lg:line-clamp-6` und `Weiterlesen` bleibt grün.

- [ ] **Step 7: Commit**

```bash
cd /c/cn && git add components/review/BuchNotiz.tsx components/review/BuchReiter.tsx components/review/Doppelseite.tsx tests/buch-notiz.test.ts tests/buch-reiter.test.ts tests/i18n-literale.test.ts
git commit -m "feat: Bewertungstext größer gesetzt, die Tafel ohne Reiterleiste trägt ihren Titel"
```

---
## Task 6: Aroma-Karte dicht setzen (Kopfzeile in einer Reihe, kleinere Infotafel)

Die Infotafel behält ihren festen Platz (Nutzerentscheidung vom 2026-10-05), wird im Buch ab `lg` aber 128 statt 224 px hoch. Legende und Ansichtsschalter stehen in der Kopfzeile neben der Reiterleiste statt in einer eigenen Zeile.

**Files:**
- Modify: `components/review/AromaKarte.tsx` (Kopfzeile ab Zeile 465 und 501, Infotafel ab Zeile 1190, Funktion `InfoTafel` ab Zeile 1360)
- Create: `tests/aroma-kompakt.test.ts`

**Interfaces:**
- Consumes: Prop `kompakt` der Karte (besteht).
- Produces: nichts Neues nach außen. Nur mit `kompakt` ändert sich das Markup, ohne `kompakt` bleibt es gleich (Formular, Startseite).

- [ ] **Step 1: Failing test schreiben**

Datei `tests/aroma-kompakt.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AromaKarte, KarteSofortKontext } from "@/components/review/AromaKarte";
import { de } from "@/lib/i18n/de";
import { aromaTexte } from "@/lib/i18n/typen";
import { MATRIX } from "./hilfen/eintrag";

const quelle = readFileSync(join(process.cwd(), "components/review/AromaKarte.tsx"), "utf8");

const karte = (kompakt: boolean) =>
  renderToStaticMarkup(
    createElement(
      KarteSofortKontext.Provider,
      { value: true },
      createElement(AromaKarte, {
        terpene: [],
        serien: [{ name: "Diese Bewertung", ton: "lila", matrix: MATRIX }],
        texte: aromaTexte(de, "de"),
        kompakt,
      }),
    ),
  );

test("Dicht: Legende und Ansichtsschalter stehen mit der Reiterleiste in einer Zeile", () => {
  const html = karte(true);
  assert.match(html, /<ul class="[^"]*\blg:order-2\b[^"]*\blg:ml-auto\b/);
  assert.doesNotMatch(html, /\blg:basis-full\b/);
  assert.match(html, /<div class="flex flex-wrap items-center justify-end gap-4 lg:order-3">/);
});

test("Nicht dicht: Formular und Startseite behalten ihre Kopfzeile", () => {
  const html = karte(false);
  assert.doesNotMatch(html, /\blg:order-[23]\b|\blg:ml-auto\b|\blg:h-32\b/);
  assert.match(html, /<div class="flex flex-wrap items-center justify-end gap-4">/);
});

test("Dicht: die Infotafel behält ihren festen Platz, ab lg 128 px statt 224 px", () => {
  assert.match(quelle, /"pointer-events-none grid h-56 justify-items-center overflow-hidden"/);
  assert.match(quelle, /"\*:max-h-56 \*:overflow-y-auto"/);
  assert.match(quelle, /kompakt && "lg:h-32 lg:\*:max-h-32"/);
  assert.match(karte(true), /\bh-56\b[^"]*\blg:h-32\b/);
  assert.doesNotMatch(karte(false), /\blg:h-32\b/);
});

test("Dicht: der Inhalt der Infotafel schrumpft auf Name, einen Satz in zwei Zeilen und eine Zeile Pillen", () => {
  assert.match(quelle, /kompakt && "lg:hidden"/);
  assert.match(quelle, /kompakt && "lg:line-clamp-2 lg:text-small"/);
  assert.match(quelle, /kompakt && "lg:max-h-8 lg:overflow-hidden"/);
  assert.equal(quelle.match(/kompakt=\{kompakt\}/g)?.length, 2, "beide Infotafeln bekommen kompakt");
});
```

- [ ] **Step 2: Test laufen lassen, er muss scheitern**

Run: `npx tsx --test tests/aroma-kompakt.test.ts`
Expected: FAIL (`lg:basis-full` steht noch, `lg:h-32` fehlt).

- [ ] **Step 3: `AromaKarte.tsx` anpassen**

Als `patch-task6.py` ablegen und im Projektordner ausführen (Hilfsfunktion `patch` wie in Task 1):

```python
import io

def patch(pfad, paare):
    s = io.open(pfad, encoding="utf-8").read()
    for alt, neu in paare:
        assert s.count(alt) == 1, (pfad, alt[:70], s.count(alt))
        s = s.replace(alt, neu, 1)
    io.open(pfad, "w", encoding="utf-8", newline="").write(s)

patch("components/review/AromaKarte.tsx", [
    # Kopfzeile: Legende und Schalter neben der Reiterleiste, Legende vor dem Schalter.
    ('      <div className="flex flex-wrap items-center justify-end gap-4">',
     '      <div className={cn("flex flex-wrap items-center justify-end gap-4", kompakt && "lg:order-3")}>'),
    ('kompakt && "lg:basis-full")}>',
     'kompakt && "lg:order-2 lg:ml-auto")}>'),
    # Infotafel: fester Platz, im Buch kleiner.
    ('          "*:max-h-56 *:overflow-y-auto",\n        )}',
     '          "*:max-h-56 *:overflow-y-auto",\n          // Dicht im Buch ab lg (Spec 2026-10-05): der feste Platz bleibt, ist aber kleiner.\n          kompakt && "lg:h-32 lg:*:max-h-32",\n        )}'),
    ('            key={`achse-${aktiveAchse.key}`}\n',
     '            key={`achse-${aktiveAchse.key}`}\n            kompakt={kompakt}\n'),
    ('            key={`terpen-${terpenAktiv}`}\n',
     '            key={`terpen-${terpenAktiv}`}\n            kompakt={kompakt}\n'),
    # InfoTafel selbst.
    ('  bezug,\n  children,\n}: {', '  bezug,\n  kompakt = false,\n  children,\n}: {'),
    ('  bezug: readonly React.ReactNode[];\n  children: React.ReactNode;\n}) {',
     '  bezug: readonly React.ReactNode[];\n  /** Dicht im Buch ab lg: ohne Kopfzeile, ein Satz in zwei Zeilen, eine Zeile Pillen. */\n  kompakt?: boolean;\n  children: React.ReactNode;\n}) {'),
    ('    <div className="flex w-full max-w-xl flex-col items-center gap-2 text-center transition-opacity duration-normal ease-out starting:opacity-0">',
     '    // gap-1 = 4px dicht: die Zeilen der Tafel sind ein zusammengehöriger Block in 128 px.\n    <div className={cn("flex w-full max-w-xl flex-col items-center gap-2 text-center transition-opacity duration-normal ease-out starting:opacity-0", kompakt && "lg:gap-1")}>'),
    ('      <p className="text-caption tracking-wide text-text-muted uppercase">{art}</p>',
     '      <p className={cn("text-caption tracking-wide text-text-muted uppercase", kompakt && "lg:hidden")}>{art}</p>'),
    ('      {hinweis ? <p className="text-caption text-text-muted text-pretty">{hinweis}</p> : null}',
     '      {hinweis ? <p className={cn("text-caption text-text-muted text-pretty", kompakt && "lg:hidden")}>{hinweis}</p> : null}'),
    ('      {children ? <p className="max-w-md font-buch text-body text-text-muted italic text-pretty">{children}</p> : null}',
     '      {children ? (\n        <p className={cn("max-w-md font-buch text-body text-text-muted italic text-pretty", kompakt && "lg:line-clamp-2 lg:text-small")}>\n          {children}\n        </p>\n      ) : null}'),
    ('        <div className="mt-2 flex flex-col items-center gap-2">',
     '        <div className={cn("mt-2 flex flex-col items-center gap-2", kompakt && "lg:mt-0")}>'),
    ('          {bezugTitel ? <p className="text-caption tracking-wide text-text-muted uppercase">{bezugTitel}</p> : null}',
     '          {bezugTitel ? <p className={cn("text-caption tracking-wide text-text-muted uppercase", kompakt && "lg:hidden")}>{bezugTitel}</p> : null}'),
    ('          <ul className="flex flex-wrap justify-center gap-2">{bezug}</ul>',
     '          <ul className={cn("flex flex-wrap justify-center gap-2", kompakt && "lg:max-h-8 lg:overflow-hidden")}>{bezug}</ul>'),
])
print("ok")
```

Hinweis: Der Kommentar `// gap-1 = 4px ...` steht in der Funktion `InfoTafel` direkt vor dem `<div`, das `return (` davor macht ihn zu einem JS-Kommentar in der Klammer, das ist gültig. Meldet `tsc` dort einen Fehler, den Kommentar als `{/* ... */}` setzen oder vor das `return` verschieben.

- [ ] **Step 4: Tests und Typen prüfen**

Run: `npx tsx --test tests/aroma-kompakt.test.ts tests/aroma-ebenen.test.ts tests/aromakarte.test.ts tests/aromakarte-v2.test.ts && npx tsc --noEmit`
Expected: PASS. Die bestehenden Tests zu `h-56` und `max-h-56` bleiben grün, weil die Grundklassen unverändert in `cn(...)` stehen.

- [ ] **Step 5: Lint-Stand prüfen**

Run: `npx eslint components/review/AromaKarte.tsx`
Expected: genau der eine bekannte Fehler (`react-hooks/set-state-in-effect` bei `setMontiert`). Kein zweiter.

- [ ] **Step 6: Commit**

```bash
cd /c/cn && git add components/review/AromaKarte.tsx tests/aroma-kompakt.test.ts
git commit -m "feat: Aroma-Karte im Buch dicht gesetzt, Kopfzeile in einer Reihe und kleinere Infotafel"
```

---

## Task 7: Das neue Buch zusammensetzen

**Files:**
- Create: `components/review/BuchDoppelseite.tsx`
- Create: `tests/buch-doppelseite.test.ts`
- Modify: `components/review/BewertungsBuch.tsx`
- Modify: `components/review/Doppelseite.tsx` (nur `<ReiterLeiste />`, falls noch nicht in Task 5 geschehen)
- Modify: `tests/buch.test.ts` (Zählung der `<dt`, Kommentar im CPU-Test)
- Modify: `tests/i18n-literale.test.ts` (Liste `UMGESTELLT`)

**Interfaces:**
- Consumes: alles aus Task 1 bis 6.
- Produces: `BuchDoppelseite({ eintrag: EintragDaten; ueberschrift: "h2" | "h3"; w: Woerterbuch; sprache: Sprache })`, ein Server-Baustein. Die rechte Hälfte zeigt Blatturteil und Noten immer, die Einlage nur auf nahen Seiten.

- [ ] **Step 1: Failing tests schreiben**

Datei `tests/buch-doppelseite.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { BuchDoppelseite } from "@/components/review/BuchDoppelseite";
import { BuchReiter } from "@/components/review/BuchReiter";
import type { EintragDaten } from "@/components/review/eintrag";
import type { KartenTerpen } from "@/lib/aromakarte";
import { de } from "@/lib/i18n/de";
import { eintrag } from "./hilfen/eintrag";

type Ueberschrift = "h2" | "h3";
const props = (teil: Partial<EintragDaten>, ueberschrift: Ueberschrift = "h3") => ({ eintrag: eintrag(teil), ueberschrift, w: de, sprache: "de" as const });

const zeige = (teil: Partial<EintragDaten> = {}, ueberschrift: Ueberschrift = "h3") =>
  // Karte sofort zeichnen: im Server-HTML steht sonst nur ihr Platzhalter (CPU-Limit, Fehler 1102).
  renderToStaticMarkup(createElement(KarteSofortKontext.Provider, { value: true }, createElement(BuchDoppelseite, props(teil, ueberschrift))));

/** Die zwei Seiten getrennt: alles vor der rechten Seite ist die linke. */
function seiten(html: string) {
  const teil = html.split('data-buchseite="rechts"');
  assert.equal(teil.length, 2, "genau eine rechte Seite");
  assert.equal(teil[0].split('data-buchseite="links"').length, 2, "genau eine linke Seite");
  return { links: teil[0], rechts: teil[1] };
}

const stellen = (html: string, teile: string[]) => teile.map((teil) => html.indexOf(teil));
const aufsteigend = (zahlen: number[]) => zahlen.every((zahl, i) => zahl >= 0 && (i === 0 || zahl > zahlen[i - 1]));

/** Die Props aller BuchReiter im Elementbaum (die Funktion wird direkt aufgerufen, ohne Rendern). */
function reiterProps(teil: Partial<EintragDaten>) {
  const funde: Record<string, unknown>[] = [];
  const suche = (knoten: unknown): void => {
    if (Array.isArray(knoten)) return knoten.forEach(suche);
    if (!knoten || typeof knoten !== "object" || !("props" in knoten)) return;
    const element = knoten as { type: unknown; props: Record<string, unknown> };
    if (element.type === BuchReiter) funde.push(element.props);
    suche(element.props.children);
  };
  suche(BuchDoppelseite(props(teil)));
  return funde;
}

test("Rahmen: eindeutige Id, Überschrift mit Namen, beide Hälften, die Höhe wächst mit dem Inhalt", () => {
  const html = zeige({ id: "r7" });
  assert.match(html, /<article id="eintrag-r7" aria-labelledby="eintrag-r7-titel"/);
  assert.match(html, /<h3 id="eintrag-r7-titel" title="Waldi" aria-label="Bewertung von Waldi"/);
  assert.match(zeige({}, "h2"), /<h2 id="eintrag-r1-titel"/);
  assert.match(html, /<article [^>]*class="[^"]*\blg:min-h-\(--buch-h\)/);
  assert.doesNotMatch(html, /\blg:h-\(--buch-h\)/);
  assert.match(html, /\blg:grid-cols-2\b/);
  // Nichts wird abgeschnitten: weder der Rahmen noch die Hälften verbergen Überlauf.
  assert.doesNotMatch(html, /(<article|data-buchseite="(links|rechts)") [^>]*class="[^"]*overflow-(clip|hidden)/);
  seiten(html);
});

test("Links: Avatar, Name, Marke, Text und Kolophon in dieser Reihenfolge, ohne Noten und Karte", () => {
  const { links } = seiten(zeige());
  assert.ok(
    aufsteigend(stellen(links, ['class="inline-flex shrink-0 select-none', ">Waldi<", ">Betreiber<", "Sehr dichte Blüten.", ">Datum<", ">Charge<", ">Bewertungen insgesamt<"])),
    "Reihenfolge links",
  );
  assert.doesNotMatch(links, /Aussehen|<figure|viewBox="0 0 24 24"/);
});

test("Rechts: Blätter, Zahl, fünf Noten und die Einlage mit der Karte in dieser Reihenfolge", () => {
  const { rechts } = seiten(zeige());
  assert.ok(aufsteigend(stellen(rechts, ['viewBox="0 0 24 24"', ">3,5<", ">Aussehen<", ">Konsistenz<", 'data-eintritt="einlage"', "<figure"])), "Reihenfolge rechts");
  assert.doesNotMatch(rechts, /Sehr dichte Blüten\.|>Datum</);
});

test("Die fünf Noten stehen genau einmal im HTML, mobil wie am Rechner", () => {
  const html = zeige();
  assert.equal(html.match(/>Aussehen</g)?.length, 1);
  // Fünf Noten plus Datum, Charge und Zahl im Kolophon.
  assert.equal(html.match(/<dt/g)?.length, 8);
  assert.doesNotMatch(html, /hidden lg:contents|contents lg:hidden/);
});

test("Handschrift nur bei Community: von euch am Rand, die Marke bleibt gedruckt", () => {
  const community = seiten(zeige({ istBetreiber: false, autorName: "Mia" })).links;
  assert.match(community, /<p data-eintritt="schreiben" style="--i:1" class="font-hand text-vermerk text-kopierstift[^"]*">von euch<\/p>/);
  assert.match(community, />Community</);
  const betreiber = seiten(zeige()).links;
  assert.doesNotMatch(betreiber, /font-hand|von euch/);
  assert.match(betreiber, />Betreiber</);
});

test("Ohne Autor und ohne Betreiber kein Kreis, sonst ein Avatar mit Ring", () => {
  const anonym = seiten(zeige({ autorName: null, istBetreiber: false })).links;
  assert.match(anonym, />Mitglied</);
  assert.doesNotMatch(anonym, /select-none/);
  const betreiber = seiten(zeige({ autorName: null })).links;
  assert.match(betreiber, />Book of Terpz</);
  assert.match(betreiber, /\bsize-32\b[^"]*\bring-1\b[^"]*\bmax-sm:size-20\b/);
});

test("Die Zahl der Bewertungen steht nur mit Zahl im Kolophon", () => {
  assert.match(seiten(zeige({ autorBewertungen: 12 })).links, />Bewertungen insgesamt<\/dt><dd[^>]*>12<\/dd>/);
  assert.doesNotMatch(zeige({ autorBewertungen: null }), /Bewertungen insgesamt/);
});

test("Ohne Text steht ruhig ein Hinweis, ohne Knopf", () => {
  const links = seiten(zeige({ notiz: null })).links;
  assert.match(links, /<p class="text-body text-text-muted italic lg:flex-1">Kein Text zu dieser Bewertung\.<\/p>/);
  assert.doesNotMatch(links, /Weiterlesen|<button/);
});

test("Langer Text: ab lg begrenzt mit Weiterlesen (nur ab lg), kurzer ohne Knopf", () => {
  const lang = zeige({ notiz: "Sehr dichte Blüten. ".repeat(20) });
  assert.match(lang, /<button [^>]*aria-expanded="false"[^>]*class="[^"]*\bmax-lg:hidden\b[^"]*"[^>]*>Weiterlesen<\/button>/);
  const kurz = zeige();
  assert.match(kurz, /\blg:line-clamp-6\b/);
  assert.doesNotMatch(kurz, /[" ]line-clamp-6/);
  assert.doesNotMatch(kurz, /Weiterlesen/);
});

test("Langer Name klammert ab lg auf zwei Zeilen, bricht um und steht ganz im title", () => {
  const name = "Ein sehr langer Anzeigename eines Mitglieds mit vielen Wörtern darin";
  const html = zeige({ autorName: name });
  assert.match(html, new RegExp(`title="${name}"`));
  assert.match(html, /<h3 [^>]*class="[^"]*\blg:line-clamp-2\b/);
  assert.match(html, /<h3 [^>]*class="[^"]*\bwrap-break-word\b/);
});

test("Ohne Gesamtnote (Altbewertung) keine Blätter und keine leere Zahl", () => {
  const html = zeige({ gesamtnote: null });
  assert.doesNotMatch(html, /von 5 Blättern|NaN|viewBox="0 0 24 24"/);
  assert.equal(html.match(/>Aussehen</g)?.length, 1);
});

test("Die Einlage läuft ab lg rechts und unten bis an den Rand der Seite", () => {
  const { rechts } = seiten(zeige());
  assert.match(rechts, /<div data-eintritt="einlage" style="--i:1" class="[^"]*\bbg-surface p-4\b[^"]*\blg:-mr-10\b[^"]*\blg:-mb-8\b[^"]*\blg:border-r-0\b[^"]*\blg:border-b-0\b/);
});

test("Reiter: Terpenbewertung zuerst, Beschaffenheit nur mit Werten, Reel erst nach dem Klick", () => {
  assert.doesNotMatch(zeige(), /role="tablist"/);
  assert.match(zeige(), /<p class="text-small font-medium text-text">Terpenbewertung<\/p>/);
  const mit = zeige({ beschaffenheit: { budDichte: 3 } as EintragDaten["beschaffenheit"] });
  assert.match(mit, /role="tab"[^>]*aria-selected="true"[^>]*>Terpenbewertung</);
  assert.match(mit, /role="tab"[^>]*>Beschaffenheit</);
  const reel = zeige({ instagramReelUrl: "https://www.instagram.com/reel/ABCdef123/" });
  assert.match(reel, /role="tab"[^>]*>Reel</);
  assert.match(reel, /Reel von Instagram laden/);
  assert.doesNotMatch(reel, /<iframe/);
  assert.match(reel, /class="[^"]*\blg:h-full\b[^"]*\blg:w-auto\b/);
  assert.doesNotMatch(zeige({ instagramReelUrl: "https://example.com/reel/x" }), /<iframe|Reel von Instagram laden/);
});

test("Sweet Spot der Terpene kommt nicht zurück, nur die Skala der Karte trägt ihn", () => {
  const html = zeige();
  assert.match(html, /<text[^>]*>Sweet Spot<\/text>/);
  assert.doesNotMatch(html.replace(/<text[^>]*>[^<]*<\/text>/g, ""), /Sweet Spot|Sweet-Spot/i);
});

test("Die Karte im Buch ist dicht und bekommt die Terpenwahl des Bewertenden als Stärken", () => {
  const terpene: KartenTerpen[] = [
    { name: "Myrcen", geschmack: "ERDIG", konzentrationProzent: 0.6, rang: 1 },
    { name: "Limonen", geschmack: "ZITRUS", konzentrationProzent: 0.4, rang: 2 },
  ];
  const reiter = (reiterProps({ terpene, terpenIntensitaet: { Myrcen: 1, Limonen: 0 } })[0].reiter as { inhalt: { props: Record<string, unknown> } }[])[0];
  assert.equal(reiter.inhalt.props.kompakt, true);
  assert.deepEqual(reiter.inhalt.props.staerken, { Myrcen: 1, Limonen: 0 });
  const ohneWahl = (reiterProps({ terpene })[0].reiter as { inhalt: { props: Record<string, unknown> } }[])[0];
  assert.equal(ohneWahl.inhalt.props.staerken, undefined);
});

test("Reiter bekommen nur serialisierbare Props (Server zu Client, sonst Fehlerseite live)", () => {
  const funde = reiterProps({ beschaffenheit: { budDichte: 3 } as EintragDaten["beschaffenheit"] });
  assert.equal(funde.length, 1, "genau ein BuchReiter im Baum");
  for (const reiter of funde[0].reiter as { schluessel: string; inhalt: unknown }[]) {
    assert.notEqual(typeof reiter.inhalt, "function", `Reiter ${reiter.schluessel} reicht eine Funktion`);
  }
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/buch-doppelseite.test.ts`
Expected: FAIL, `BuchDoppelseite` fehlt.

- [ ] **Step 3: `BuchDoppelseite.tsx` schreiben**

```tsx
import type { ReactNode } from "react";

import { InstagramEmbed, baueEmbedUrl } from "@/components/produkt/InstagramEmbed";
import { AromaKarte } from "@/components/review/AromaKarte";
import { aromaSerien, terpenWahlStaerken } from "@/components/review/aroma-serien";
import { BeschaffenheitsLeiste } from "@/components/review/BeschaffenheitsLeiste";
import { BlattUrteil } from "@/components/review/BlattUrteil";
import { BuchKolophon } from "@/components/review/BuchKolophon";
import { BuchNotiz } from "@/components/review/BuchNotiz";
import { BuchReiter, ReiterLeiste, type BuchReiterEintrag } from "@/components/review/BuchReiter";
import { NotenLeiste } from "@/components/review/NotenLeiste";
import { NurAufgeschlagen } from "@/components/review/NurAufgeschlagen";
import { eintragAnker, type EintragDaten } from "@/components/review/eintrag";
import { ablauf } from "@/components/review/eintritt";
import { FALZ_LINKS, FALZ_RECHTS } from "@/components/review/falz";
import { Avatar, Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import { aromaTexte, type Woerterbuch } from "@/lib/i18n/typen";

/**
 * Eine Seite des Buchs. Deckend (eigene Fläche) und `relative`, weil das Buch (Buch.tsx) die zwei
 * Hälften einzeln um den Falz dreht. Ab lg 40 px rechts und links, damit der Falz (2rem) nie unter
 * Text oder Bild reicht.
 */
const SEITE = "relative flex min-w-0 flex-col gap-6 bg-surface-raised p-6 sm:p-10 lg:px-10 lg:py-8";

export type BuchDoppelseiteProps = {
  eintrag: EintragDaten;
  ueberschrift: "h2" | "h3";
  w: Woerterbuch;
  sprache: Sprache;
};

/**
 * Eine Bewertung als aufgeschlagene Doppelseite im Buch (Spec 2026-10-05, Nutzer): links die Person
 * mit Avatar, Name und dem Text der Bewertung, unten das Kolophon; rechts das Urteil mit Blättern
 * und den fünf Noten, darunter die Terpenbewertung als Karteneinlage, die ab lg rechts und unten
 * bis an den Rand der Seite läuft.
 *
 * Die Höhe wächst mit dem Inhalt (`lg:min-h-(--buch-h)`, globals.css): nichts läuft über den
 * Rahmen. Der Text links trägt nicht zur Höhe bei, die rechte Seite gibt sie vor. Id und
 * Überschrift sind je Eintrag eindeutig, damit mehrere Doppelseiten gestapelt stehen können und
 * der Sprung auf #eintrag-… die richtige trifft.
 */
export function BuchDoppelseite({ eintrag, ueberschrift: Ueberschrift, w, sprache }: BuchDoppelseiteProps) {
  const texte = aromaTexte(w, sprache);
  const anker = eintragAnker(eintrag.id);
  const titelId = `${anker}-titel`;
  const name = eintrag.autorName ?? (eintrag.istBetreiber ? w.buch.betreiberName : w.buch.ohneName);
  // Ohne Autor und ohne Betreiber (ohneName) gibt es keinen Kreis, sonst stünde ein Initial für "Anonym".
  const hatPerson = Boolean(eintrag.autorName) || eintrag.istBetreiber;
  // Kein Ersatz aus der Umgebung: nur eine gültige eigene URL ergibt ein Reel.
  const reel = baueEmbedUrl(eintrag.instagramReelUrl) ? eintrag.instagramReelUrl : null;

  const karte = (kopf: ReactNode) => (
    <AromaKarte
      terpene={eintrag.terpene}
      serien={aromaSerien(eintrag, w)}
      staerken={terpenWahlStaerken(eintrag.terpene, eintrag.terpenIntensitaet)}
      texte={texte}
      kompakt
      kopf={kopf}
    />
  );
  const reiter: BuchReiterEintrag[] = [
    { schluessel: "karte", titel: w.buch.reiterKarte, inhalt: karte(<ReiterLeiste titel={w.buch.reiterKarte} />), eigeneLeiste: true },
  ];
  if (Object.keys(eintrag.beschaffenheit).length > 0) {
    reiter.push({
      schluessel: "beschaffenheit",
      titel: w.buch.reiterBeschaffenheit,
      inhalt: <BeschaffenheitsLeiste werte={eintrag.beschaffenheit} feuchte={null} texte={texte} />,
    });
  }
  if (reel) {
    reiter.push({
      schluessel: "reel",
      titel: w.buch.reiterReel,
      // Ab lg so hoch wie die Tafel, die Breite folgt dem Hochformat; der iframe lädt erst nach dem Klick.
      inhalt: (
        <div className="lg:min-h-0 lg:flex-1">
          <InstagramEmbed
            url={reel}
            bezeichnung={eintrag.handelsname}
            texte={w.reel}
            className="lg:h-full lg:w-auto lg:max-w-full lg:min-w-72"
          />
        </div>
      ),
    });
  }

  return (
    <article
      id={anker}
      aria-labelledby={titelId}
      className="grid scroll-mt-8 grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:min-h-(--buch-h) lg:grid-cols-2"
    >
      <div data-buchseite="links" className={cn(SEITE, FALZ_LINKS)}>
        <header data-eintritt="auf" style={ablauf(0)} className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {hatPerson ? (
            // ring-offset-4 = 4px: optische Korrektur, der feine Ring liegt wie ein Stempel um das Bild.
            <Avatar
              name={name}
              bildId={eintrag.autorAvatarId}
              groesse="lg"
              className="ring-1 ring-border-strong ring-offset-4 ring-offset-surface-raised max-sm:size-20"
            />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Ueberschrift
              id={titelId}
              title={name}
              aria-label={t(w.buch.bewertungVon, { name })}
              className="font-buch text-h1 font-medium text-balance text-text wrap-break-word lg:line-clamp-2"
            >
              {name}
            </Ueberschrift>
            <p>
              <Badge variante={eintrag.istBetreiber ? "accent" : "neutral"} zeichen={false}>
                {eintrag.istBetreiber ? w.buch.betreiber : w.buch.community}
              </Badge>
            </p>
          </div>
          {eintrag.istBetreiber ? null : (
            <p data-eintritt="schreiben" style={ablauf(1)} className="font-hand text-vermerk text-kopierstift max-sm:basis-full sm:ml-auto">
              {w.buch.vonEuch}
            </p>
          )}
        </header>

        {eintrag.notiz ? (
          <BuchNotiz text={eintrag.notiz} weiterlesen={w.buch.weiterlesen} schliessen={w.buch.schliessen} />
        ) : (
          <p className="text-body text-text-muted italic lg:flex-1">{w.buch.keinText}</p>
        )}

        <BuchKolophon eintrag={eintrag} w={w} sprache={sprache} />
      </div>

      <div data-buchseite="rechts" className={cn(SEITE, FALZ_RECHTS)}>
        {eintrag.gesamtnote !== null ? <BlattUrteil note={eintrag.gesamtnote} w={w} sprache={sprache} /> : null}
        <NotenLeiste eintrag={eintrag} w={w} sprache={sprache} />
        {/* Im Buch nur auf nahen Seiten (CPU-Limit, T7-Review), sonst immer. Die Fläche bleibt
            stehen: das Buch dreht sie beim Blättern. */}
        <NurAufgeschlagen>
          <div
            data-eintritt="einlage"
            style={ablauf(1)}
            className="flex min-h-0 flex-1 flex-col border border-border bg-surface p-4 lg:-mr-10 lg:-mb-8 lg:border-r-0 lg:border-b-0 lg:p-6"
          >
            <BuchReiter bezeichnung={w.buch.reiter} reiter={reiter} />
          </div>
        </NurAufgeschlagen>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: `BewertungsBuch.tsx` und die zwei bestehenden Tests umstellen**

Als `patch-task7.py` ablegen und ausführen (Hilfsfunktion `patch` wie in Task 1):

```python
import io

def patch(pfad, paare):
    s = io.open(pfad, encoding="utf-8").read()
    for alt, neu in paare:
        assert s.count(alt) == 1, (pfad, alt[:70], s.count(alt))
        s = s.replace(alt, neu, 1)
    io.open(pfad, "w", encoding="utf-8", newline="").write(s)

patch("components/review/BewertungsBuch.tsx", [
    ('import { Doppelseite } from "@/components/review/Doppelseite";\n',
     'import { BuchDoppelseite } from "@/components/review/BuchDoppelseite";\n'),
    ('<Doppelseite eintrag={alsEintrag(review, produkt)} umfang="voll" ueberschrift="h3" w={w} sprache={sprache} />',
     '<BuchDoppelseite eintrag={alsEintrag(review, produkt)} ueberschrift="h3" w={w} sprache={sprache} />'),
])

patch("tests/buch.test.ts", [
    ('  // Jede Seite ist eine Doppelseite im vollen Umfang: fünf Noten, seit T7b zweimal (ab lg links, mobil rechts).\n  assert.equal(html.match(/<dt/g)?.length, 30);',
     '  // Jede Seite ist eine Doppelseite im vollen Umfang: fünf Noten (einmal, rechts) plus Datum und Charge im Kolophon.\n  assert.equal(html.match(/<dt/g)?.length, 21);'),
    ('  // Seit T7b stehen die Noten links (billig, immer im Server-HTML); die Karte rechts nur nah.',
     '  // Noten (rechts oben) und Kolophon (links) sind billig und stehen immer im Server-HTML; die Einlage mit der Karte nur nah.'),
])

patch("components/review/Doppelseite.tsx", [
    ('karte(<ReiterLeiste />)', 'karte(<ReiterLeiste titel={w.buch.reiterKarte} />)'),
])
print("ok")
```

Falls `karte(<ReiterLeiste />)` schon in Task 5 ersetzt wurde, den letzten Eintrag weglassen (der Patch bricht dann bei `count == 1` ab, das ist gewollt).

- [ ] **Step 5: Datei in die Übersetzungs-Wache aufnehmen**

In `tests/i18n-literale.test.ts` nach `"components/review/BuchKolophon.tsx",` ergänzen: `"components/review/BuchDoppelseite.tsx",`.

- [ ] **Step 6: Tests prüfen**

Run: `npx tsx --test tests/buch-doppelseite.test.ts tests/buch.test.ts tests/i18n-literale.test.ts && npx tsc --noEmit`
Expected: PASS. Weicht ein Regex vom richtigen Markup ab, den Test anpassen. Ein echter Fehler (falsche Reihenfolge, fehlendes Element) wird im Code behoben.

- [ ] **Step 7: Commit**

```bash
cd /c/cn && git add components/review/BuchDoppelseite.tsx components/review/BewertungsBuch.tsx components/review/Doppelseite.tsx tests/buch-doppelseite.test.ts tests/buch.test.ts tests/i18n-literale.test.ts
git commit -m "feat: das Buch zeigt links die Person und rechts das Urteil mit der Terpenbewertung als Einlage"
```

---

## Task 8: Höhe und Einzug der Seite (CSS und Buch)

**Files:**
- Modify: `app/globals.css` (`--buch-h`, neuer Block vor dem Kommentar "Hintergrundvideo einer Sektion")
- Modify: `components/review/Buch.tsx` (Beobachter, `data-im-bild`)
- Modify: `tests/buch.test.ts` (neue Tests am Ende)

**Interfaces:**
- Consumes: `data-eintritt` und `--i` aus den Bausteinen (Task 4, 5, 7).
- Produces: Attribut `data-im-bild` am `.buch-stapel`, sobald das Buch im Bild ist.

- [ ] **Step 1: Failing tests schreiben**

Am Ende von `tests/buch.test.ts` anfügen (`css` und `readFileSync`, `join` sind dort schon vorhanden):

```ts
test("Höhe: der Rahmen wächst mit dem Inhalt, Untergrenze 51rem, Obergrenze 54rem", () => {
  assert.match(css, /--buch-h:\s*clamp\(51rem,\s*calc\(100svh - var\(--kopf-h, 4rem\) - 5rem\),\s*54rem\);/);
});

test("Einzug: nur mit Bewegung und ohne Sparmodus, nach data-im-bild, an der aufgeschlagenen Seite", () => {
  const block = /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*:root:not\(\[data-sparmodus\]\) \.buch-stapel\[data-im-bild\] > \.buch-seite\[data-aktiv\] \[data-eintritt\][\s\S]*?\n\}/.exec(css);
  assert.ok(block, "Block für den Einzug fehlt");
  for (const name of ["buch-auf", "buch-blatt", "buch-strich", "buch-einlage", "schreiben"]) {
    assert.match(block[0], new RegExp(`animation-name:\\s*${name};`), name);
  }
  assert.match(block[0], /animation-fill-mode:\s*backwards;/);
  assert.match(block[0], /animation-delay:\s*calc\(280ms \+ var\(--i, 0\) \* 70ms\);/);
});

test("Einzug: nur transform, opacity und clip-path, nie Layout", () => {
  for (const name of ["buch-auf", "buch-blatt", "buch-strich", "buch-einlage"]) {
    const keyframes = new RegExp(`@keyframes ${name} \\{([\\s\\S]*?)\\n\\}`).exec(css);
    assert.ok(keyframes, name);
    assert.doesNotMatch(keyframes[1], /\b(width|height|top|left|margin|padding)\b/, name);
  }
});

test("Einzug: ohne Skript, mit reduzierter Bewegung oder im Sparmodus bleibt alles sichtbar", () => {
  // Der Ausgangszustand ist nie versteckt: die Animationen hängen nur an der Bedingung oben,
  // `from` ohne `to`, der Endzustand ist der Stil des Elements selbst.
  const block = /@keyframes buch-auf \{([\s\S]*?)\n\}/.exec(css);
  assert.ok(block);
  assert.doesNotMatch(block[1], /\bto\b/);
  assert.doesNotMatch(css, /\[data-eintritt\][^{]*\{[^}]*\b(opacity: 0|visibility: hidden|display: none)/);
});

test("Einzug: das Buch meldet sich im Bild, auch mit nur einer Seite", () => {
  const quelle = readFileSync(join(process.cwd(), "components/review/Buch.tsx"), "utf8");
  assert.match(quelle, /data-im-bild=\{imBild \? "" : undefined\}/);
  assert.match(quelle, /const element = huelle\.current;\s*if \(!element\) return;/);
});
```

- [ ] **Step 2: Tests laufen lassen, sie müssen scheitern**

Run: `npx tsx --test tests/buch.test.ts`
Expected: FAIL (`--buch-h` noch 31.5rem, Block und Attribut fehlen).

- [ ] **Step 3: `Buch.tsx` und `globals.css` anpassen**

Als `patch-task8.py` ablegen und ausführen (Hilfsfunktion `patch` wie in Task 1; `globals.css` hat deutsche Umlaute, `encoding="utf-8"` bleibt):

```python
import io

def patch(pfad, paare):
    s = io.open(pfad, encoding="utf-8").read()
    for alt, neu in paare:
        assert s.count(alt) == 1, (pfad, alt[:70], s.count(alt))
        s = s.replace(alt, neu, 1)
    io.open(pfad, "w", encoding="utf-8", newline="").write(s)

patch("components/review/Buch.tsx", [
    ('  // Autoplay nur im Bild: außerhalb soll das Buch nicht weiterblättern, man käme sonst irgendwo heraus.\n  useEffect(() => {\n    const element = huelle.current;\n    if (!element || !mehrere) return;',
     '  // Im Bild: das Autoplay blättert nur dann weiter (sonst käme man irgendwo heraus), und der Einzug der\n  // Seite (globals.css, data-im-bild) beginnt erst, wenn man das Buch sieht. Gilt auch für eine einzelne Seite.\n  useEffect(() => {\n    const element = huelle.current;\n    if (!element) return;'),
    ('    beobachter.observe(element);\n    return () => beobachter.disconnect();\n  }, [mehrere]);',
     '    beobachter.observe(element);\n    return () => beobachter.disconnect();\n  }, []);'),
    ('        ref={buehne}\n        // Waagerecht wischt das Buch',
     '        ref={buehne}\n        data-im-bild={imBild ? "" : undefined}\n        // Waagerecht wischt das Buch'),
])

patch("app/globals.css", [
    ('  /* Feste Höhe der Doppelseite ab lg (Doppelseite.tsx, T7b, Nutzer 2026-09-30):\n     Bildschirm minus fester Kopf, minus 5rem = 1rem Luft über dem Buch (sein\n     scroll-mt) + 1rem Abstand + 44px Steuerung + 4px Rest. So passt die ganze\n     Doppelseite samt Blättern auf einen Bildschirm, ohne Scrollen. Untergrenze\n     31.5rem: darunter hätte die Aroma-Karte (mindestens 360px, AromaKarte.tsx)\n     mit Kopfzeile keinen Platz mehr; nach oben bleibt sie bei 46rem. */\n  --buch-h: clamp(31.5rem, calc(100svh - var(--kopf-h, 4rem) - 5rem), 46rem);',
     '  /* Mindesthöhe der Doppelseite ab lg (BuchDoppelseite.tsx, Spec 2026-10-05): Bildschirm minus\n     fester Kopf, minus 5rem = 1rem Luft über dem Buch (sein scroll-mt) + 1rem Abstand + 44px\n     Steuerung + 4px Rest. Der Rahmen wächst mit dem Inhalt (min-h, nicht h), nichts läuft über den\n     Rand. Untergrenze 51rem: Blatturteil, Noten und die Einlage mit der Karte (mindestens 360px,\n     AromaKarte.tsx) brauchen rund 810px. Auf kleinen Bildschirmen steht das Buch deshalb höher als\n     der Schirm, auf großen wächst es bis 54rem und die Karte mit ihm. */\n  --buch-h: clamp(51rem, calc(100svh - var(--kopf-h, 4rem) - 5rem), 54rem);'),
    ('/* Hintergrundvideo einer Sektion (GemeinsamLernen)',
     '''/* Einzug der Doppelseite im Buch (BuchDoppelseite.tsx, Spec 2026-10-05). Alles einmal, nur transform,
   opacity und clip-path. Es startet, sobald das Buch im Bild ist (`data-im-bild`, Buch.tsx) und die Seite
   aufgeschlagen ist; beim Umblättern beginnt es neu, nach der Drehung (280 ms). `--i` ist der Platz in
   der Staffel (components/review/eintritt.ts). Jede Bewegung hat einen Grund: Blätter und Zahl zeigen das
   Urteil zuerst, die Striche machen den Wert lesbar, die Einlage deckt sich in Leserichtung der Karte auf
   (Geschmack, dann Terpene), die Handschrift wird geschrieben. Nur mit Bewegung und ohne Sparmodus; sonst,
   und ohne Skript, steht der Endzustand sofort da. Die Keyframes tragen nur `from`: der Endzustand ist
   der Stil des Elements selbst. */
@keyframes buch-auf {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
}

@keyframes buch-blatt {
  from {
    opacity: 0;
    transform: scale(0.6) translateY(0.5rem);
  }
}

@keyframes buch-strich {
  from {
    transform: scaleX(0);
  }
}

@keyframes buch-einlage {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0 0 0 0);
  }
}

@media (prefers-reduced-motion: no-preference) {
  :root:not([data-sparmodus]) .buch-stapel[data-im-bild] > .buch-seite[data-aktiv] [data-eintritt] {
    animation-duration: 520ms;
    animation-timing-function: var(--ease-out);
    animation-fill-mode: backwards;
    animation-delay: calc(280ms + var(--i, 0) * 70ms);
  }

  :root:not([data-sparmodus]) .buch-stapel[data-im-bild] > .buch-seite[data-aktiv] [data-eintritt="auf"] {
    animation-name: buch-auf;
  }

  :root:not([data-sparmodus]) .buch-stapel[data-im-bild] > .buch-seite[data-aktiv] [data-eintritt="blatt"] {
    animation-name: buch-blatt;
    animation-duration: 420ms;
    transform-origin: 50% 100%;
  }

  :root:not([data-sparmodus]) .buch-stapel[data-im-bild] > .buch-seite[data-aktiv] [data-eintritt="strich"] {
    animation-name: buch-strich;
    animation-duration: 600ms;
  }

  :root:not([data-sparmodus]) .buch-stapel[data-im-bild] > .buch-seite[data-aktiv] [data-eintritt="einlage"] {
    animation-name: buch-einlage;
    animation-duration: 800ms;
    animation-timing-function: var(--ease-standard);
  }

  :root:not([data-sparmodus]) .buch-stapel[data-im-bild] > .buch-seite[data-aktiv] [data-eintritt="schreiben"] {
    animation-name: schreiben;
    animation-duration: 800ms;
    animation-timing-function: var(--ease-standard);
  }
}

/* Hintergrundvideo einer Sektion (GemeinsamLernen)'''),
])
print("ok")
```

- [ ] **Step 4: Tests prüfen**

Run: `npx tsx --test tests/buch.test.ts tests/bewegung.test.ts tests/marke.test.ts && npx tsc --noEmit && npm run farben`
Expected: PASS, `farben` grün (keine Token geändert). Der Test "kein Layout in den Keyframes" darf nichts finden: die Keyframes tragen nur `opacity`, `transform`, `clip-path`.

- [ ] **Step 5: Commit**

```bash
cd /c/cn && git add app/globals.css components/review/Buch.tsx tests/buch.test.ts
git commit -m "feat: das Buch wächst mit seinem Inhalt, und die Seite zieht beim Aufschlagen einmal ein"
```

---
## Task 9: `Doppelseite` auf den Auszug beschneiden

Das Buch hat jetzt seine eigene Doppelseite. Der `voll`-Zweig in `Doppelseite.tsx` ist tot und wird entfernt. Der Auszug auf Startseite und `/reviews` muss dabei Byte für Byte gleich bleiben (Golden Master aus Task 3).

**Files:**
- Modify (ersetzen): `components/review/Doppelseite.tsx`
- Modify: `app/[lang]/reviews/page.tsx`, `components/story/NeuesterEintrag.tsx` (Prop `umfang` entfällt)
- Modify (ersetzen): `tests/doppelseite.test.ts` (nur noch Auszug)
- Delete (nicht committet): `scripts/golden-doppelseite.tmp.ts`

**Interfaces:**
- Produces: `Doppelseite({ eintrag, ueberschrift, story?, w, sprache })`, ohne `umfang`.

- [ ] **Step 1: Neue Tests für den Auszug schreiben (sie laufen schon gegen den alten Code)**

`tests/doppelseite.test.ts` komplett ersetzen:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { KarteSofortKontext } from "@/components/review/AromaKarte";
import { Doppelseite, type DoppelseiteProps } from "@/components/review/Doppelseite";
import { alsEintrag, eintragHref } from "@/components/review/eintrag";
import { leereGeschmacksMatrix } from "@/lib/query/bewertung";
import { de } from "@/lib/i18n/de";
import { eintrag } from "./hilfen/eintrag";

const zeige = (props: Omit<DoppelseiteProps, "w" | "sprache">) =>
  // Karte sofort zeichnen: im Server-HTML steht sonst nur ihr Platzhalter (CPU-Limit, Fehler 1102).
  renderToStaticMarkup(
    createElement(KarteSofortKontext.Provider, { value: true }, createElement(Doppelseite, { ...props, w: de, sprache: "de" })),
  );

/** Die zwei Seiten einer Doppelseite getrennt: alles vor der rechten Seite ist die linke. */
function seiten(html: string) {
  const teil = html.split('data-buchseite="rechts"');
  assert.equal(teil.length, 2, "genau eine rechte Seite");
  assert.equal(teil[0].split('data-buchseite="links"').length, 2, "genau eine linke Seite");
  return { links: teil[0], rechts: teil[1] };
}

test("Auszug: vier Noten ohne Wirkung, Link springt auf den Eintrag", () => {
  const html = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.equal(html.match(/<dt/g)?.length, 4);
  assert.doesNotMatch(html, /Wirkung/);
  assert.match(html, /href="\/blueten\/nebelharz-22#eintrag-r1"/);
  assert.match(html, />Nebelharz 22 \(fiktiv\)<\/h3>/);
});

test("Auszug: links Kopf, Name, Blätter-Note und darunter der Text; rechts Werte, Karte und Charge", () => {
  const { links, rechts } = seiten(zeige({ eintrag: eintrag(), ueberschrift: "h3" }));
  assert.match(links, /<h3 id="eintrag-r1-titel"/);
  assert.match(links, />Waldi</);
  assert.match(links, /3,5 von 5 Blättern/);
  assert.match(links, /Sehr dichte Blüten\./);
  // Der Text steht unter Name und Note, nicht darüber.
  assert.ok(links.indexOf("3,5 von 5 Blättern") < links.indexOf("Sehr dichte Blüten."));
  assert.doesNotMatch(links, /<dt|<figure|Charge CH-2401/);
  assert.match(rechts, /<dt/);
  assert.match(rechts, /<figure/);
  assert.match(rechts, /Charge CH-2401/);
  assert.doesNotMatch(rechts, /Sehr dichte Blüten\./);
});

test("Ohne Gesamtnote (Altbewertung) keine Blätter und keine leere Zahl", () => {
  const html = zeige({ eintrag: eintrag({ gesamtnote: null }), ueberschrift: "h3" });
  assert.doesNotMatch(html, /von 5 Blättern|NaN/);
});

test("Ohne Autor (Seed, gelöschtes Mitglied) steht ein Ersatzname statt einer Lücke", () => {
  const betreiber = zeige({ eintrag: eintrag({ autorName: null }), ueberschrift: "h3" });
  assert.match(seiten(betreiber).links, />Book of Terpz</);
  const community = zeige({ eintrag: eintrag({ autorName: null, istBetreiber: false }), ueberschrift: "h3" });
  assert.match(seiten(community).links, />Mitglied</);
});

test("Auszug: Datum beim Namen, Charge rechts; der Text links bleibt gekürzt", () => {
  const { links, rechts } = seiten(zeige({ eintrag: eintrag(), ueberschrift: "h3" }));
  assert.match(links, /<time [^>]*>12\.09\.2026<\/time>/);
  assert.match(links, /line-clamp-6/);
  assert.match(rechts, /Charge CH-2401/);
});

test("Id und Überschrift eindeutig je Eintrag", () => {
  const html = zeige({ eintrag: eintrag({ id: "r7" }), ueberschrift: "h2" });
  assert.match(html, /<article id="eintrag-r7" aria-labelledby="eintrag-r7-titel"/);
  assert.match(html, /<h2 id="eintrag-r7-titel"/);
});

test("Story-Ziele nur, wenn die Startseite sie verlangt", () => {
  const ohne = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.doesNotMatch(ohne, /data-story|data-zaehler/);
  const mit = zeige({ eintrag: eintrag(), ueberschrift: "h3", story: true });
  assert.match(mit, /data-story="doppelseite"/);
  assert.equal(mit.match(/data-zaehler=""/g)?.length, 4);
  assert.match(mit, /data-ziel="5"/);
});

test("Der Auszug zeigt kein Reel, auch mit gültiger Adresse", () => {
  const html = zeige({ eintrag: eintrag({ instagramReelUrl: "https://www.instagram.com/reel/ABCdef12345/" }), ueberschrift: "h3" });
  assert.doesNotMatch(html, /<iframe|Reel von Instagram laden/);
});

test("Lange Handelsnamen brechen um statt überzulaufen", () => {
  const html = zeige({
    eintrag: eintrag({ handelsname: "Sehrlangerhandelsnameohneleerzeichenundmitvielenbuchstaben" }),
    ueberschrift: "h3",
  });
  assert.match(html, /wrap-break-word/);
  assert.match(html, /hyphens-auto/);
});

test("alsEintrag: Name und Slug vom Produkt, kaputte Matrix wird neutral, Autor und Gesamtnote durchgereicht", () => {
  const e = alsEintrag(
    {
      id: "r1",
      istRedaktionell: false,
      autorName: "Mia",
      gesamtnote: 4.5,
      aussehen: 4,
      geruch: 4,
      geschmack: 4,
      wirkung: 4,
      konsistenz: 4,
      feuchtigkeitProzent: null,
      geschmacksMatrix: "kaputt",
      terpenIntensitaet: null,
      beschaffenheit: null,
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
  assert.equal(e.istBetreiber, false);
  assert.equal(e.autorName, "Mia");
  assert.equal(e.gesamtnote, 4.5);
  assert.equal(eintragHref("nebelharz-22", "r1"), "/blueten/nebelharz-22#eintrag-r1");
});

test("Überschrift: auf Unterseiten kleiner als der Abschnittstitel, auf der Startseite wie bisher", () => {
  const unterseite = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.match(unterseite, /<h3 id="eintrag-r1-titel" class="[^"]*\btext-h2\b[^"]*"/);
  assert.doesNotMatch(unterseite, /<h3 id="eintrag-r1-titel" class="[^"]*text-kapitel/);
  const startseite = zeige({ eintrag: eintrag(), ueberschrift: "h3", story: true });
  assert.match(startseite, /<h3 id="eintrag-r1-titel" class="[^"]*\btext-kapitel\b/);
});

test("Buchfalz ab lg: je Seite ein leiser Verlauf von 2rem an der Mitte, die Seiten deckend fürs Umblättern", () => {
  const html = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.match(html, /<article [^>]*class="[^"]*\blg:grid-cols-2\b/);
  assert.match(
    html,
    /data-buchseite="links" class="[^"]*\bbg-surface-raised\b[^"]*\blg:bg-\[linear-gradient\(to_left,color-mix\(in_oklab,var\(--color-text\)_7%,transparent\),transparent_2rem\)\]/,
  );
  assert.match(
    html,
    /data-buchseite="rechts" class="[^"]*\bbg-surface-raised\b[^"]*\blg:bg-\[linear-gradient\(to_right,color-mix\(in_oklab,var\(--color-text\)_7%,transparent\),transparent_2rem\)\]/,
  );
  // Die Seiten haben ab sm 3rem Innenabstand: der Falz (2rem) reicht nicht unter Bild oder Text.
  assert.equal(html.match(/relative flex min-w-0 flex-col gap-8 bg-surface-raised p-6 sm:p-12/g)?.length, 2);
});

test("Der Auszug kennt weder Reiter noch Kolophon noch feste Höhe noch Einzug", () => {
  const html = zeige({ eintrag: eintrag(), ueberschrift: "h3" });
  assert.doesNotMatch(html, /--buch-h|role="tablist"|lg:grid-cols-5|lg:truncate|lg:contents|data-eintritt/);
});
```

- [ ] **Step 2: Neue Tests gegen den alten Code laufen lassen**

Run: `npx tsx --test tests/doppelseite.test.ts`
Expected: PASS. `umfang` fehlt in den Aufrufen, der alte Code fällt dann auf den Auszug zurück (`umfang === "voll"` ist false). Das beweist, dass der Auszug von diesen Tests abgedeckt ist, bevor etwas entfernt wird.

- [ ] **Step 3: `Doppelseite.tsx` ersetzen**

Datei `components/review/Doppelseite.tsx` mit diesem Inhalt (ohne `voll`):

```tsx
import Link from "next/link";

import { AromaKarte } from "@/components/review/AromaKarte";
import { aromaSerien } from "@/components/review/aroma-serien";
import { BlattAnzeige } from "@/components/review/BlattAnzeige";
import { eintragAnker, eintragHref, type EintragDaten } from "@/components/review/eintrag";
import { FALZ_LINKS, FALZ_RECHTS } from "@/components/review/falz";
import { KartenBild } from "@/components/review/SortenKopf";
import { Avatar, buttonKlassen } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereWert, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import { aromaTexte, type Woerterbuch } from "@/lib/i18n/typen";
import { BEWERTUNGS_ACHSEN } from "@/lib/query/bewertung";

/**
 * "Wirkung" nur im vollstaendigen Eintrag (Spec TP1 Abschnitt 2): gross
 * gesetzt laese sie sich oeffentlich als Wirksamkeitsversprechen.
 */
const AUSZUG_ACHSEN = BEWERTUNGS_ACHSEN.filter((achse) => achse.key !== "wirkung");

/**
 * Eine Seite der Doppelseite. Deckend (eigene Fläche) und `relative`, weil das
 * Buch (Buch.tsx) die zwei Hälften einzeln um den Falz dreht; der Falz ab lg
 * ist je Seite ein leiser Verlauf von 2rem an der Mitte. Die Seiten haben ab
 * sm 3rem Innenabstand, der Falz reicht also nie unter Bild oder Text.
 */
const SEITE = "relative flex min-w-0 flex-col gap-8 bg-surface-raised p-6 sm:p-12";

export type DoppelseiteProps = {
  eintrag: EintragDaten;
  ueberschrift: "h2" | "h3";
  /** Nur die Startseite: Ziele fuer die StoryBuehne (aufschlagen, hochzaehlen). */
  story?: boolean;
  w: Woerterbuch;
  sprache: Sprache;
};

/**
 * Eine Bewertung als Auszug in einer aufgeschlagenen Doppelseite (Spec TP2 4.3, T7, Nutzer
 * 2026-09-29): links Kopf, Name, Datum, Blätter-Note und darunter der gekürzte Bewertungstext;
 * rechts vier Werte, Karte und Charge mit dem Weg zum ganzen Eintrag. Das Buch auf der
 * Blütenseite setzt seine Doppelseiten in BuchDoppelseite.tsx. Id und Ueberschrift sind je
 * Eintrag eindeutig, damit "Ganzen Eintrag lesen" auf die Doppelseite im Buch springt.
 */
export function Doppelseite({ eintrag, ueberschrift: Ueberschrift, story = false, w, sprache }: DoppelseiteProps) {
  const texte = aromaTexte(w, sprache);
  const anker = eintragAnker(eintrag.id);
  const titelId = `${anker}-titel`;
  const datum = (
    <time dateTime={eintrag.erstelltAm.toISOString()}>{formatiereDatum(eintrag.erstelltAm, sprache)}</time>
  );
  const name = eintrag.autorName ?? (eintrag.istBetreiber ? w.buch.betreiberName : w.buch.ohneName);
  const charge = eintrag.chargenNr ? t(w.bluete.charge, { charge: eintrag.chargenNr }) : null;

  const noten = (
    <dl className="grid grid-cols-2 gap-6">
      {AUSZUG_ACHSEN.map((achse) => (
        // gap-1 = 4px: Bezeichnung und Wert sind ein Paar.
        <div key={achse.key} className="flex min-w-0 flex-col gap-1">
          <dt className="text-small text-text-muted">{w.schema.noten[achse.key].label}</dt>
          <dd className="numeric text-h1 text-text">
            <span aria-hidden="true" {...(story ? { "data-zaehler": "", "data-ziel": eintrag[achse.key] } : {})}>
              {formatiereZahl(eintrag[achse.key], 1, sprache)}
            </span>
            <span aria-hidden="true" className="text-h3 text-text-muted">
              {" / 5"}
            </span>
            <span className="sr-only">{`${formatiereZahl(eintrag[achse.key], 1, sprache)} ${w.bluete.vonFuenf}`}</span>
          </dd>
        </div>
      ))}
    </dl>
  );

  // Die Charge schließt die Seite ab wie eine Fußnote, darunter der Weg zum ganzen Eintrag.
  const fuss = (
    <div className="mt-auto flex min-w-0 flex-col gap-4">
      {charge ? <p className={cn("text-small text-text-muted", eintrag.chargenNr && "numeric")}>{charge}</p> : null}
      <p>
        <Link prefetch={false} href={eintragHref(eintrag.slug, eintrag.id)} className={buttonKlassen("secondary", "md")}>
          {w.review.ganzerEintrag}
        </Link>
      </p>
    </div>
  );

  return (
    <article
      id={anker}
      aria-labelledby={titelId}
      data-story={story ? "doppelseite" : undefined}
      className="grid scroll-mt-8 grid-cols-1 border border-border-strong bg-surface-raised shadow-md lg:grid-cols-2"
    >
      <div data-buchseite="links" className={cn(SEITE, FALZ_LINKS)}>
        {/* Kopf */}
        <Ueberschrift
          id={titelId}
          className={cn(
            "font-buch text-balance text-text wrap-break-word hyphens-auto",
            // Startseite: gross wie das Kapitel darueber. Unterseiten: kleiner als
            // der Abschnittstitel (h2, text-h1), damit die Ebenen absteigen (Spec 3.3).
            story ? "text-kapitel" : "text-h2 font-medium",
          )}
        >
          {eintrag.handelsname}
        </Ueberschrift>

        {/* Blütenbild zwischen Titel und Noten über die volle Breite der Karte,
            dasselbe wie in der Blütenübersicht (Nutzer 2026-09-26). */}
        {eintrag.bildPfad ? (
          <div className="contents">
            <KartenBild bildPfad={eintrag.bildPfad} symbolbild={w.aroma.sortenKopf.symbolbild} />
          </div>
        ) : null}

        <div className="contents">
          {/* Wer spricht: Avatar (T8) vor dem Namen. Ohne Autor und ohne Betreiber
              (ohneName) gibt es keinen Kreis, sonst stünde ein Initial für "Anonym". */}
          <div className="flex min-w-0 items-center gap-4">
            {eintrag.autorName || eintrag.istBetreiber ? (
              <Avatar name={name} bildId={eintrag.autorAvatarId} groesse="md" />
            ) : null}
            {/* gap-1 = 4px: Name und Datum sind ein Paar. Die Zeilen sind
                Blöcke, damit sie der Textausrichtung der Seite folgen. */}
            <p className="flex min-w-0 flex-col gap-1">
              <span className="text-body font-medium text-text wrap-break-word">{name}</span>
              <span className="text-small text-text-muted">{datum}</span>
            </p>
          </div>

          {eintrag.gesamtnote !== null ? (
            <div className="contents">
              <BlattAnzeige
                note={eintrag.gesamtnote}
                text={t(w.bewerten.blattWert, { wert: formatiereWert(eintrag.gesamtnote, sprache) })}
              />
            </div>
          ) : null}
        </div>

        {eintrag.notiz ? <p className="line-clamp-6 max-w-[56ch] text-body text-pretty text-text">{eintrag.notiz}</p> : null}
      </div>

      <div data-buchseite="rechts" className={cn(SEITE, FALZ_RECHTS)}>
        {noten}
        <AromaKarte terpene={eintrag.terpene} serien={aromaSerien(eintrag, w)} texte={texte} />
        {fuss}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Aufrufer und Skript aufräumen**

Als `patch-task9.py` ablegen und ausführen (Hilfsfunktion `patch` wie in Task 1):

```python
import io

def patch(pfad, paare):
    s = io.open(pfad, encoding="utf-8").read()
    for alt, neu in paare:
        assert s.count(alt) == 1, (pfad, alt[:70], s.count(alt))
        s = s.replace(alt, neu, 1)
    io.open(pfad, "w", encoding="utf-8", newline="").write(s)

patch("app/[lang]/reviews/page.tsx", [
    ('<Doppelseite eintrag={reviews[0]} umfang="auszug" ueberschrift="h3" w={w} sprache={sprache} />',
     '<Doppelseite eintrag={reviews[0]} ueberschrift="h3" w={w} sprache={sprache} />'),
])
patch("components/story/NeuesterEintrag.tsx", [
    ('<Doppelseite eintrag={review} umfang="auszug" ueberschrift="h3" story w={w} sprache={sprache} />',
     '<Doppelseite eintrag={review} ueberschrift="h3" story w={w} sprache={sprache} />'),
])
print("ok")
```

- [ ] **Step 5: Auszug vergleichen, alles prüfen**

Run:

```bash
cd /c/cn && SP="/c/Windows/TEMP/claude/c--cn/4e0d9527-c188-4341-8237-3a73cc0dc474/scratchpad" && npx tsx scripts/golden-doppelseite.tmp.ts > "$SP/golden-nachher2.json" && cmp "$SP/golden-vorher.json" "$SP/golden-nachher2.json" && echo "AUSZUG GLEICH" && npx tsx --test tests/doppelseite.test.ts tests/buch-doppelseite.test.ts tests/buch.test.ts tests/hover.test.ts tests/i18n-literale.test.ts && npx tsc --noEmit
```

Expected: `AUSZUG GLEICH`, alle Tests PASS, `tsc` ohne Ausgabe. Weicht der Auszug ab, `diff` der beiden JSON-Dateien lesen und die Abweichung im neuen `Doppelseite.tsx` beheben (der Auszug darf sich nicht ändern).

- [ ] **Step 6: Skript löschen, committen**

```bash
cd /c/cn && rm scripts/golden-doppelseite.tmp.ts && git status --short
git add components/review/Doppelseite.tsx app/\[lang\]/reviews/page.tsx components/story/NeuesterEintrag.tsx tests/doppelseite.test.ts
git commit -m "refactor: Doppelseite zeigt nur noch den Auszug, das Buch hat seine eigene"
```

Expected: `git status` zeigt vor dem Commit nur die genannten Dateien (kein `scripts/…tmp.ts`).

---

## Task 10: Gesamtprüfung vor dem Push

**Files:** keine Änderungen, nur Prüfung. Ändert sich etwas, gehört es in den Task, der es verursacht hat (neuer Commit).

- [ ] **Step 1: Alle lokalen Prüfungen**

Run:

```bash
cd /c/cn && npm test 2>&1 | tail -8 && npx tsc --noEmit && echo "TSC OK" && npm run farben 2>&1 | tail -3 && npm run lint 2>&1 | tail -6
```

Expected: `pass` = Baseline 570 plus die neuen Tests, `fail 0`; `TSC OK`; `farben` grün; Lint mit genau den zwei bekannten Fehlern (`AromaKarte.tsx` `setMontiert`, `RegisterAuswahl.tsx:179`), `2 problems`. Ein dritter Fehler ist ein Fehler dieses Plans und wird behoben.

- [ ] **Step 2: Keine Gedanken- und Geviertstriche in neuem Text**

Run: `cd /c/cn && git diff a56e0a5..HEAD -- . ':!docs' | grep -nP "^\+.*[\x{2013}\x{2014}]" || echo "KEINE"`
Expected: `KEINE`. Treffer in Code-Kommentaren ebenfalls durch Komma, Punkt oder Doppelpunkt ersetzen.

- [ ] **Step 3: Nichts Fremdes im Commit-Stand**

Run: `cd /c/cn && git status --short && git log --oneline a56e0a5..HEAD`
Expected: Arbeitsbaum sauber, neun Commits (Tasks 1 bis 9).

---

## Task 11: Push 1 und erste Live-Prüfung

**Files:** keine. Prüfung im Browser 1 (`mcp__browser__*`, vorher `list_connected_browsers`, Auswahl über `AskUserQuestion`, dann `select_browser`; das Fenster mit `tabId` 740369019 war 1418 x 762 breit, ein neuer Tab startet bei 494 x 762).

- [ ] **Step 1: Pushen**

Run: `cd /c/cn && git push origin main`
Expected: ein Push, kein Retry bei Netzfehler (dann stoppen und melden). Uhrzeit notieren. Der Workers-Build dauert 11 bis 14 Minuten, ein weiterer Push in dieser Zeit bricht ihn ab.

- [ ] **Step 2: HANDOFF.md schon jetzt nachführen (löst keinen Build aus)**

Im Abschnitt "Hier geht es weiter" kurz festhalten: Spec und Plan, was gepusht ist, dass die Live-Prüfung noch aussteht. Danach `git add HANDOFF.md && git commit -m "docs: HANDOFF mit dem Stand der Buch-Doppelseite"` und pushen erst nach der Live-Prüfung (zusammen mit Push 2).

- [ ] **Step 3: Einmal warten**

Run (PowerShell): `Start-Sleep -Seconds 590` und gleich noch einmal `Start-Sleep -Seconds 590`. Kein Abfrageschleife.

- [ ] **Step 4: Prüfen, ob der neue Stand live ist**

Im Browser `https://cn-medcan.w-helwich.workers.dev/blueten/thc-akut-25-rs11` laden und ausführen:

```js
(() => { const st = document.querySelector('.buch-stapel'); st.scrollIntoView({block:'start'}); window.scrollBy(0, -90);
  const a = st.querySelector('.buch-seite[data-aktiv] article'); const l = a.querySelector('[data-buchseite="links"]'); const r = a.querySelector('[data-buchseite="rechts"]'); const p = r.querySelector('[data-eintritt="einlage"]');
  const box = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; };
  return JSON.stringify({ iw: innerWidth, ih: innerHeight, imBild: st.hasAttribute('data-im-bild'), eintritte: a.querySelectorAll('[data-eintritt]').length, artikel: box(a), linksInhalt: l.scrollHeight, rechtsInhalt: r.scrollHeight, einlage: box(p), buchH: getComputedStyle(st).getPropertyValue('--buch-h') }); })()
```

Expected bei neuem Stand: `eintritte` größer 0, `buchH` enthält `51rem`. Steht noch der alte Stand (`eintritte` 0), den Build einmal im Cloudflare-Dashboard ansehen, nicht erneut pushen.

- [ ] **Step 5: Abnahme am Bildschirm (1418 x 762, dann hell und dunkel)**

Prüfen und je Punkt `ja` oder die Abweichung notieren:

1. `linksInhalt <= artikel.h + 1` und `rechtsInhalt <= artikel.h + 1`: nichts läuft über den Rahmen.
2. Die Einlage endet rechts und unten an der Kante des Rahmens: `einlage.x + einlage.w` ist `artikel.x + artikel.w`, `einlage.y + einlage.h` ist `artikel.y + artikel.h` (je +-2 px).
3. Screenshot der ganzen Doppelseite: Avatar, Name, Betreiber-Marke, Text, Kolophon links; fünf große Blätter mit Zahl, fünf Noten mit Strichen, Karte rechts. Keine Überlappung, keine abgeschnittene Zeile, keine leere Fläche größer als 100 px.
4. Mit der Maus über eine Geschmacksachse fahren: die Infotafel unter der Karte zeigt Name, Satz, Pillen in 128 px, die Karte springt nicht.
5. Helles Thema: `document.documentElement.setAttribute('data-theme','light')`, dunkles: `'dark'`. Beide Screenshots, Kontrast der Zahl und der Striche lesbar.
6. Aktualisieren der Seite mit dem Buch schon im Bild (Anker `#eintrag-…`): der Einzug läuft, danach steht alles. Mit `prefers-reduced-motion` (Emulation in den DevTools nicht möglich): per Code prüfen, dass `getAnimations()` auf `[data-eintritt]` leer ist, wenn `data-sparmodus` an `<html>` gesetzt ist (`document.documentElement.setAttribute('data-sparmodus','')` und `document.querySelector('.buch-seite[data-aktiv]').getAnimations({subtree:true}).length`).
7. Zweiter Tab mit 494 x 762 (mobil): beide Seiten untereinander, Avatar 80 px, keine waagrechte Scrollleiste, Karte lesbar.

- [ ] **Step 6: Befunde sammeln**

Jeden Befund als Zeile festhalten (Messwert oder Screenshot-Beobachtung). Daraus entsteht Task 12. Ohne Befund geht es direkt zu Step 3 von Task 12.

---

## Task 12: Feinschliff, Push 2, Abnahme

**Files:** nur, was die Befunde aus Task 11 verlangen, plus `HANDOFF.md` und die Spec.

Bekannte Kandidaten mit fertigem Gegenmittel, nur anwenden, wenn der Befund sie verlangt:

- **Der Text links bestimmt die Höhe** (die Seite wächst mit langem Text, obwohl rechts weniger Platz braucht): `flex-basis: 0` hat nicht gegriffen. Gegenmittel in `BuchNotiz.tsx`: Wurzel `lg:relative lg:min-h-0 lg:flex-1` und der Inhalt (`p` und Knopf) in einen Block `lg:absolute lg:inset-0 lg:flex lg:flex-col lg:gap-2`. Der Text trägt dann garantiert nichts zur Höhe bei, `flaeche.clientHeight` bleibt die Messgröße.
- **Die Karte hat weniger als 360 px Höhe oder die Achsen überlappen:** Untergrenze von `--buch-h` in `globals.css` um 2rem erhöhen und den Test aus Task 8 anpassen.
- **Der Einzug flackert beim Laden** (Inhalt erst sichtbar, dann kurz aus, dann ein): vor dem Start ausblenden nur unter `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)` mit CSS-Notfall nach 2,5 s, wie es `ui-design-engine` Abschnitt 7 für die Startseite beschreibt. Nur bauen, wenn der Befund es zeigt.
- **Die Marke `Community` und "von euch" konkurrieren:** "von euch" nach rechts außen, `max-sm:hidden`.

- [ ] **Step 1: Befunde beheben, je Befund ein Test zuerst, ein Commit**

Jeden Befund aus Task 11 wie ein kleiner Task behandeln: Test, der den Fehler zeigt, Korrektur, grün, Commit in Prosa.

- [ ] **Step 2: Spec an die Messwerte angleichen**

In `docs/superpowers/specs/2026-10-05-buch-doppelseite-stimme-und-urteil-design.md` Abschnitt 5 stehen 51 rem und rund 810 px. Weichen die Live-Messwerte aus Task 11 ab oder wurden in Step 1 weitere Werte geändert, die Zahlen dort nachziehen und das mit einem Commit in Prosa festhalten.

- [ ] **Step 3: Review mit den Skills, ohne Subagents**

Nacheinander laden und auf die Live-Screenshots und den Code anwenden: `web-design-guidelines`, `better-accessibility`, `critique-visual-hierarchy`, danach die Checkliste aus `ui-design-engine` Abschnitt 11 (zwölf Punkte, jeden einzeln mit Ja oder Befund). Befunde mit Schweregrad hoch sofort beheben, die übrigen in `HANDOFF.md` unter "offene Reste" aufnehmen.

- [ ] **Step 4: Abschluss verifizieren**

`superpowers:verification-before-completion` laden. Dann `npm test`, `npx tsc --noEmit`, `npm run farben`, `npm run lint` (zwei bekannte Fehler), und `git status` sauber.

- [ ] **Step 5: HANDOFF, Push 2, Abnahme**

`HANDOFF.md` fertig nachführen (Session 40: Spec, Plan, Umsetzung, Live-Befunde, offene Reste, Hinweis auf die lokalen Tags `archiv/*`). Committen, pushen, einmal warten (zweimal `Start-Sleep -Seconds 590`), die Messung aus Task 11 Step 4 und die Punkte 1 bis 7 aus Step 5 wiederholen. Ergebnis dem Nutzer melden, mit Screenshots hell und dunkel (`save_to_disk` nur, wenn er sie sehen soll), und mit der Grenze: Community-Zustände (Avatar-Foto, Zahl, Handschrift) sind nur durch Tests belegt, live gibt es nur den Eintrag des Betreibers.
