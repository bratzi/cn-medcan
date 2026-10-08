# Profil und Konto: Dein Kapitel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/profil` und `/mitglied` werden über die volle Breite zu „deinem Kapitel im Grünen Buch“: Feldbuch-Raster, Kapitelkopf mit Freisteller und Randnotizen, Felder statt Karten, neue Bausteine (Aktivität, Notenverteilung, Bewertungs-Register mit Bildern, Umfrage jetzt, Meine Stimmen), dazu K1 (Profil-Upsert in der D1-Batch) und M2 (Verlauf rechnet nur 60 Netze).

**Architecture:** Task 1 legt auf `main` das Fundament: K1, M2, `erstelltAm` am Mitglied, alle Texte, das CSS der Bewegung und die Kapitel-Bausteine (`KapitelRaster`, `Feld`, `FeldSkelett`, `Randnotizen`, `Kapitelkopf`, neuer `ProfilReiter`). Drei Stränge bauen danach parallel in Worktrees die neuen Bausteine samt reiner Logik. Task 5 verdrahtet beide Seiten im Raster mit `Suspense` und `<ViewTransition>`, führt Regelwerk und Brand nach, prüft und geht live. Alle Bewegung ist CSS (`animation-timeline: view()`), kein GSAP.

**Tech Stack:** Next.js 16.3 App Router auf Cloudflare Workers (OpenNext), React 19.2 (`ViewTransition` aus `react`), Prisma 7 mit D1, Tailwind 4, Tests mit `node:test` über `tsx --test`, `better-sqlite3` für SQL, `react-dom/server` für Render-Tests.

**Spec:** `docs/superpowers/specs/2026-10-08-profil-konto-dashboard-design.md` (vom Nutzer freigegeben 2026-10-08, samt Regeländerungen in Abschnitt 11)

**Entscheidungen beim Planen (dem Nutzer zu nennen):**
- Aktivität und Notenverteilung als HTML-Säulen und -Balken statt Server-SVG: gleiche Optik, einfacher zugänglich, Höhe/Breite als Prozent im `style` (Datencodierung, kein Abstand; Regel 2 verbietet nur Pixel-Abstände).
- Der Freisteller im Kapitelkopf steht erst ab 1080 px; darunter entfällt er, damit Name und Reiter bei 390 × 700 ohne Scrollen sichtbar sind.
- Die Felder der Seiten bleiben in der Seitendatei (wie heute), damit die Quelltext-Tests die Reihenfolge prüfen können.

## Global Constraints

- Next.js 16: vor jeder Next-API `node_modules/next/dist/docs/` lesen (AGENTS.md). `params` und `searchParams` sind Promises. `ViewTransition` aus `react` braucht keine Konfiguration (`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`).
- Kein `next dev`, `next build`, `next preview` lokal. Prüfen nur mit `npm test`, `npx tsc --noEmit -p .`, `npx eslint <geänderte Dateien>`, `npm run farben`. Live-Prüfung macht der Controller nach dem Push per Browser-MCP.
- Vor UI-Arbeit Skill `ui-design-engine` laden und `.claude/skills/ui-design-engine.md` befolgen: Abstände nur 8, 16, 24, 32, 40, 48, 64, 80, 96, 128 px; nur semantische Farbtokens; kein `dark:`; Flächen eckig, Pillen `rounded-full`; Fokus global; Touch-Ziele ≥ 44 px.
- Handschrift (`font-hand`) nur mit `text-notiz`, `text-vermerk`, `text-marke`, `text-umschlag` oder `text-kulisse` in derselben Klassenliste (`tests/marke.test.ts`), höchstens sechs Wörter, nie Namen, Zahlen, Daten.
- Datengrafik in `text`/`text-muted`, nie in `accent`. Säulen und Balken eckig, ohne Hintergrundspur.
- Bewegung nur CSS, nur `transform`/`translate`/`scale`, `opacity`, `clip-path`; jede Regel unter `prefers-reduced-motion: no-preference` und `:root:not([data-sparmodus])`; scroll-gekoppelt zusätzlich unter `@supports (animation-timeline: view())`. Kein Import von `gsap` oder `lenis`.
- Texte nur in `lib/i18n/de.ts` und `lib/i18n/en.ts`. **Alle neuen Schlüssel legt Task 1 an**, spätere Tasks fügen keine hinzu. Ohne Geviertstrich (U+2014) und Gedankenstrich (U+2013) als Trenner. Du-Form.
- HWG: keine Wirkungsversprechen, kein Apothekenlink. Die Wirkungsnote steht nur in „Schnitte“.
- Jede Prisma-Liste mit `take`. Workers-CPU 10 ms: nichts O(n²) je Aufruf.
- Zeilenenden erhalten: `git ls-files --eol <datei>`; CRLF-Dateien nie als LF zurückschreiben. Neue Dateien LF.
- Kommentare und Commits auf Deutsch in Prosa. Commit-Ende: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Nie `git add -A` (Worktrees unter `.claude/`), nur benannte Dateien.
- Implementer der Stränge: kein Push, kein Merge, nur Commits im eigenen Worktree-Branch. Keine npm-Installationen.
- Keine Migration, keine neue Tabelle.

## Review Focus

1. Neues Mitglied ohne Bewertung, ohne Stimme: alle Randnotizen zeigen 0 bzw. entfallen sinnvoll, Aktivität, Verteilung, Register und Stimmen zeigen ihren Leersatz, nie leere Achsen. Abgesichert in Task 2 (Leerfälle), Task 3 (`registerAnsicht([])`), Task 4 (`kontoNotizen` mit Nullen, `MeineStimmen` leer).
2. Ungültige oder fremde Suchparameter (`?sortierung=xyz`, `?alle=ja`, doppelte Parameter als Array): fällt auf Datum und 10 Einträge zurück, kein Absturz. Abgesichert in Task 3 (`registerParameter`).
3. Zeitzone und Monatsgrenzen: eine Bewertung am 31. um 23:30 Ortszeit landet im UTC-Monat; der laufende Monat ist immer der letzte Balken, auch am 1. Abgesichert in Task 2 (`monatsReihe`).
4. Lange Handelsnamen (60 Zeichen ohne Leerzeichen) und lange Anzeigenamen im Register, in den Stimmen und im Kapitelkopf: Umbruch statt Überlauf bei 390 px. Abgesichert in Task 1, 3, 4 (Klasse `wrap-break-word` im Markup geprüft) und live in Task 5.
5. Laufende Runde ohne eigene Stimme bei nicht freigegebenem Konto: kein „Zur Abstimmung“ als Primäraktion, sondern der Freigabe-Hinweis. Abgesichert in Task 4 (`UmfrageJetzt`).

## Stränge und Reihenfolge

```
Task 1 (Fundament: K1, M2, erstelltAm, Texte, CSS, Kapitel-Bausteine)  ← zuerst, Controller, auf main
   ├── Strang A: Task 2 (Aktivität, Notenverteilung, Profil-Randnotizen)
   ├── Strang B: Task 3 (Bewertungs-Register mit Bildern)
   └── Strang C: Task 4 (Konto: Umfrage jetzt, Meine Stimmen, Konto-Randnotizen)
Task 5 (Controller: Merge, beide Seiten verdrahten, Regelwerk, Review, Push, Live)  ← zuletzt
```

Die Stränge teilen keine Datei.
- Strang A besitzt `lib/profil-dashboard.ts`, `components/profil/Aktivitaet.tsx`, `components/profil/NotenVerteilung.tsx`, `tests/profil-dashboard.test.ts`.
- Strang B besitzt `lib/bewertungs-register.ts`, `lib/query/profil.ts` (nur `ladeAuswertungsZeilen`), `lib/profil-typen.ts`, `components/profil/BewertungsRegister.tsx`, `tests/bewertungs-register.test.ts`.
- Strang C besitzt `lib/konto.ts`, `lib/query/konto.ts`, `components/mitglied/UmfrageJetzt.tsx`, `components/mitglied/MeineStimmen.tsx`, `tests/konto.test.ts`.

---

### Task 1: Fundament (Controller, auf main)

**Files:**
- Modify: `lib/profil.ts` (neu `profilErsetzen`, `d1Datum`, Typ `ProfilZeile`)
- Modify: `lib/query/profil.ts` (`profilFortschreiben`: Upsert in die Batch)
- Modify: `lib/profil-verlauf.ts` (M2)
- Modify: `lib/session.ts` (`erstelltAm`)
- Modify: `lib/i18n/de.ts`, `lib/i18n/en.ts`
- Modify: `app/globals.css`
- Create: `components/kapitel/KapitelRaster.tsx`, `components/kapitel/Feld.tsx`, `components/kapitel/FeldSkelett.tsx`, `components/kapitel/Randnotizen.tsx`, `components/kapitel/Kapitelkopf.tsx`
- Modify: `components/profil/ProfilReiter.tsx`
- Create: `tests/profil-ersetzen.test.ts`, `tests/kapitel.test.ts`
- Modify: `tests/profil-verlauf.test.ts`

**Interfaces:**
- Produces in `lib/profil.ts`:
  - `type ProfilZeile = { geschmack: string; terpene: string; anzahl: number; gewichtet: number; oeffentlich: string; verlauf: string; berechnetAm: Date }`
  - `d1Datum(d: Date): string` (ISO mit `+00:00` statt `Z`, wie der Prisma-D1-Adapter schreibt)
  - `profilErsetzen(mitgliedId: string, z: ProfilZeile): SqlAnweisung`
- Produces `AngemeldetesMitglied.erstelltAm: Date`.
- Produces `components/kapitel/Feld.tsx`: `type FeldSpalten = 3 | 4 | 6 | 10`; `Feld(props: { id: string; titel: string; satz?: string; spalten: FeldSpalten; stimmzettel?: boolean; className?: string; children: ReactNode })`. Rendert `<section data-feld aria-labelledby={id + "-titel"}>` mit `<h2 id={id + "-titel"}>`.
- Produces `components/kapitel/FeldSkelett.tsx`: `FeldSkelett(props: { spalten: FeldSpalten; hoehe?: "klein" | "mittel" | "gross" })`.
- Produces `components/kapitel/KapitelRaster.tsx`: `KapitelRaster(props: { children: ReactNode })` (Raster 4/10 Spalten, `gap-y-16`).
- Produces `components/kapitel/Randnotizen.tsx`: `type Randnotiz = { zahl: string; wort: string; satz: string }`; `Randnotizen(props: { notizen: readonly Randnotiz[]; beschriftung: string })`.
- Produces `components/kapitel/Kapitelkopf.tsx`: `Kapitelkopf(props: { name: string; avatarId: string | null; reiter: ReactNode; bild?: ReactNode; schlagwort: string; ton: "gruen" | "lila"; aktion?: ReactNode })`.
- Produces `ProfilReiter` mit gleichen Props wie heute (`aktiv`, `texte`, `ungelesen?`), neue Optik.
- Produces Texte (Step 9): `w.profil.kapitel.*`, `w.profil.aktivitaet*`, `w.profil.verteilung*`, `w.profil.register*`, `w.profil.sortierung.*`, `w.mitglied.kapitel.*`, `w.mitglied.umfrage*`, `w.mitglied.stimmen*`, `w.mitglied.ausgang.*` und weitere unten.
- Produces CSS-Hooks: `.kapitel-name`, `.kapitel-notiz-wort` (mit `--i`), `.kapitel-tiefe`, `[data-feld]`, `[data-saeule]`, `[data-balken]`, `[data-netz-erscheinen]`.

- [ ] **Step 1: Failing test für `profilErsetzen`**

```ts
// tests/profil-ersetzen.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

import { d1Datum, profilErsetzen, type ProfilZeile } from "@/lib/profil";

const zeile = (anzahl: number): ProfilZeile => ({
  geschmack: '{"FRUCHTIG":1}',
  terpene: "[]",
  anzahl,
  gewichtet: anzahl,
  oeffentlich: "{}",
  verlauf: "[]",
  berechnetAm: new Date(Date.UTC(2026, 9, 8, 12, 0, 0)),
});

function tabelle() {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE nutzer_profil (
    mitglied_id TEXT PRIMARY KEY, geschmack TEXT NOT NULL, terpene TEXT NOT NULL,
    anzahl INTEGER NOT NULL, gewichtet INTEGER NOT NULL, oeffentlich TEXT, verlauf TEXT,
    berechnet_am DATETIME NOT NULL)`);
  return db;
}

test("d1Datum schreibt wie der Prisma-D1-Adapter", () => {
  assert.equal(d1Datum(new Date(Date.UTC(2026, 9, 8, 12, 0, 0))), "2026-10-08T12:00:00.000+00:00");
});

test("profilErsetzen legt an und ersetzt beim zweiten Mal (eine Zeile)", () => {
  const db = tabelle();
  for (const n of [1, 2]) {
    const a = profilErsetzen("m1", zeile(n));
    db.prepare(a.sql).run(...a.params);
  }
  const zeilen = db.prepare("SELECT * FROM nutzer_profil").all() as Record<string, unknown>[];
  assert.equal(zeilen.length, 1);
  assert.equal(zeilen[0].anzahl, 2);
  assert.equal(zeilen[0].verlauf, "[]");
  assert.equal(zeilen[0].berechnet_am, "2026-10-08T12:00:00.000+00:00");
});

test("profilErsetzen bindet genau acht Werte, Mitglied zuerst", () => {
  const a = profilErsetzen("m1", zeile(3));
  assert.equal(a.params.length, 8);
  assert.equal(a.params[0], "m1");
  assert.match(a.sql, /ON CONFLICT\(mitglied_id\) DO UPDATE/);
});
```

- [ ] **Step 2: Laufen lassen, muss scheitern**

Run: `npx tsx --test tests/profil-ersetzen.test.ts`
Expected: FAIL, `profilErsetzen` ist nicht exportiert.

- [ ] **Step 3: `profilErsetzen` in `lib/profil.ts`**

Oben beim Import ergänzen (falls `SqlAnweisung` noch nicht importiert ist): `import type { SqlAnweisung } from "@/lib/empfehlung";`. Am Dateiende:

```ts
/** Eine Zeile `nutzer_profil`, wie `profilFortschreiben` sie schreibt. */
export type ProfilZeile = {
  geschmack: string;
  terpene: string;
  anzahl: number;
  gewichtet: number;
  oeffentlich: string;
  verlauf: string;
  berechnetAm: Date;
};

/** D1 speichert DateTime so, wie der Prisma-D1-Adapter schreibt: ISO mit +00:00 statt Z. */
export function d1Datum(d: Date): string {
  return d.toISOString().replace("Z", "+00:00");
}

/**
 * Upsert des Profils als Anweisung für dieselbe D1-batch wie die Vorschläge
 * (Review Profil K1): beide stehen atomar oder keiner.
 */
export function profilErsetzen(mitgliedId: string, z: ProfilZeile): SqlAnweisung {
  return {
    sql: `INSERT INTO nutzer_profil (mitglied_id, geschmack, terpene, anzahl, gewichtet, oeffentlich, verlauf, berechnet_am)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(mitglied_id) DO UPDATE SET geschmack = excluded.geschmack, terpene = excluded.terpene,
        anzahl = excluded.anzahl, gewichtet = excluded.gewichtet, oeffentlich = excluded.oeffentlich,
        verlauf = excluded.verlauf, berechnet_am = excluded.berechnet_am`,
    params: [mitgliedId, z.geschmack, z.terpene, z.anzahl, z.gewichtet, z.oeffentlich, z.verlauf, d1Datum(z.berechnetAm)],
  };
}
```

Prüfen, dass `lib/empfehlung.ts` nicht aus `lib/profil.ts` importiert (sonst Kreis): `grep -n "lib/profil\"" lib/empfehlung.ts` muss leer sein. Ein reiner `import type` ist auch im Kreis unschädlich.

- [ ] **Step 4: `profilFortschreiben` umstellen**

In `lib/query/profil.ts` den Import um `profilErsetzen` ergänzen und das Ende von `profilFortschreiben` ersetzen:

```ts
  // Atomar ersetzen: D1-batch läuft als eine Transaktion, Prismas $transaction
  // auf D1 dagegen als Einzelabfragen (siehe lib/auth.ts). Vorschläge und
  // Profil gehen in dieselbe Batch (Review Profil K1).
  const { DB } = await getEnv();
  const anweisungen = [...empfehlungenErsetzen(mitgliedId, liste), profilErsetzen(mitgliedId, daten)];
  await DB.batch(anweisungen.map((a) => DB.prepare(a.sql).bind(...a.params)));
}
```

Die Zeile `await prisma.nutzerProfil.upsert(...)` entfällt. `daten` hat bereits genau die Felder von `ProfilZeile`; tsc meldet Abweichungen.

- [ ] **Step 5: Tests laufen lassen**

Run: `npx tsx --test tests/profil-ersetzen.test.ts tests/profil.test.ts tests/profil-seite.test.ts`
Expected: PASS.

- [ ] **Step 6: Failing test für M2**

An `tests/profil-verlauf.test.ts` anhängen (die Helfer `b`, `sorten` stehen oben in der Datei):

```ts
import { geschmacksBeitraege } from "@/lib/empfehlung";
import { geschmackAusVektor } from "@/lib/profil";

/** Die Rechnung vor M2: Netz für jeden Schritt, danach gekürzt. */
function verlaufAlt(reihe: VerlaufEingabe[]) {
  const sortiert = [...reihe].sort(
    (a, c) => a.erstelltAm.getTime() - c.erstelltAm.getTime() || (a.strainId < c.strainId ? -1 : a.strainId > c.strainId ? 1 : 0),
  );
  const beitraege = geschmacksBeitraege(sortiert, sorten);
  const summe = new Map<string, number>();
  const schritte = sortiert.map((x, i) => {
    for (const [k, w] of beitraege[i]) summe.set(k, (summe.get(k) ?? 0) + w);
    return { anzahl: i + 1, datum: x.erstelltAm.toISOString(), geschmack: geschmackAusVektor(summe) };
  });
  return schritte.slice(-VERLAUF_HOECHSTENS);
}

test("profilVerlauf (M2): gleiches Ergebnis wie vorher für 1, 60, 61 und 130 Bewertungen", () => {
  const achsen = ["fruchtig", "erdig", "zitrus", "suess"];
  for (const n of [1, 60, 61, 130]) {
    const reihe = Array.from({ length: n }, (_, i) =>
      b(`s${i}`, [5, 1.5, 4, 3, null][i % 5], { [achsen[i % 4]]: (i % 5) + 1 }, (i % 28) + 1),
    );
    assert.deepEqual(profilVerlauf(reihe, sorten), verlaufAlt(reihe), `n = ${n}`);
  }
});
```

Run: `npx tsx --test tests/profil-verlauf.test.ts`
Expected: PASS schon jetzt (Referenz gleich Bestand). Das ist der Schutz für den Umbau.

- [ ] **Step 7: M2 umsetzen**

In `lib/profil-verlauf.ts` den Rumpf von `profilVerlauf` ab `const summe` ersetzen:

```ts
  const summe = new Map<string, number>();
  const schritte: VerlaufSchritt[] = [];
  // Summen für alle, das Netz nur für die gespeicherten letzten Schritte (Review Profil M2).
  const ab = Math.max(0, reihe.length - VERLAUF_HOECHSTENS);
  reihe.forEach((bewertung, i) => {
    for (const [k, x] of beitraege[i]) summe.set(k, (summe.get(k) ?? 0) + x);
    if (i < ab) return;
    schritte.push({ anzahl: i + 1, datum: bewertung.erstelltAm.toISOString(), geschmack: geschmackAusVektor(summe) });
  });
  return schritte;
```

Run: `npx tsx --test tests/profil-verlauf.test.ts`
Expected: PASS.

- [ ] **Step 8: `erstelltAm` am Mitglied**

In `lib/session.ts` im Typ `AngemeldetesMitglied` nach `kurzId` ergänzen:

```ts
  /** Seit wann es den Mitgliedssatz gibt (Randnotiz „dabei seit“ im Konto). */
  erstelltAm: Date;
```

und im Rückgabeobjekt von `aktuellesMitglied` nach `kurzId: satz.kurzId,`:

```ts
    erstelltAm: satz.erstelltAm,
```

Run: `npx tsc --noEmit -p .` und alle Stellen beheben, die `AngemeldetesMitglied` von Hand bauen (Tests, Mocks): `grep -rn "kurzId:" tests lib app | grep -v generated`. Dort `erstelltAm: new Date(0)` ergänzen.

- [ ] **Step 9: Alle neuen Texte**

In `lib/i18n/de.ts` im Block `profil` (vor der schließenden Klammer, nach `herstellerLeer`):

```ts
    kapitel: {
      schlagwort: "dein Geschmack",
      notizenLeiste: "Deine Zahlen",
      bewertet: "bewertet",
      schnitt: "im Schnitt",
      community: "zur Community",
      hersteller: "Hersteller",
      zuletzt: "zuletzt",
      srBewertet: "{zahl} Bewertungen",
      srSchnitt: "Im Schnitt {zahl} von 5",
      srCommunity: "Im Schnitt {zahl} Abstand zur Community",
      srHersteller: "Blüten von {zahl} Herstellern bewertet",
      srZuletzt: "Zuletzt bewertet am {zahl}",
    },
    aktivitaetTitel: "Deine Aktivität",
    aktivitaetSatz: "Bewertungen je Monat, die letzten zwölf Monate.",
    aktivitaetLeer: "In den letzten zwölf Monaten noch keine Bewertung.",
    aktivitaetMonat: "Monat",
    aktivitaetAnzahl: "Bewertungen",
    verteilungTitel: "Deine Noten",
    verteilungSatz: "Wie oft du welche Gesamtnote vergibst, gerundet.",
    verteilungStufe: "Note {stufe}: {anzahl}",
    verteilungLeer: "Mit deiner ersten Bewertung entsteht hier deine Verteilung.",
    registerTitel: "Deine Bewertungen",
    registerSatz: "Alle Sorten, die du bewertet hast, mit deinem Bild oder dem der Sorte.",
    registerSortierung: "Sortieren nach",
    sortierung: { datum: "Neueste", note: "Beste Note", abstand: "Größter Abstand" },
    registerAlle: "Alle {anzahl} zeigen",
    registerNote: "Deine Note {note} von 5",
    registerCommunity: "Community {note} aus {anzahl}",
    registerOhneCommunity: "Noch keine anderen Noten",
    registerAbstand: "Abstand {wert}",
    registerLeer: "Noch keine Bewertung. Deine erste steht dann hier, mit Bild.",
```

Im Block `mitglied` (vor der schließenden Klammer):

```ts
    kapitel: {
      schlagwort: "deine Stimme",
      notizenLeiste: "Deine Zahlen",
      dabei: "dabei seit",
      gestimmt: "gestimmt",
      getroffen: "getroffen",
      vorgeschlagen: "vorgeschlagen",
      neu: "neu",
      srDabei: "Dabei seit {zahl}",
      srGestimmt: "{zahl} Stimmen abgegeben",
      srGetroffen: "{zahl} deiner Stimmen haben gewonnen",
      srVorgeschlagen: "{zahl} Blüten vorgeschlagen",
      srNeu: "{zahl} ungelesene Nachrichten",
    },
    umfrageTitel: "Die Umfrage jetzt",
    umfrageKeine: "Gerade läuft keine Runde. Die nächste steht auf der Umfragenseite.",
    zuDenUmfragen: "Zu den Umfragen",
    vorschlaegeBis: "Vorschläge bis {datum}",
    deineWahl: "deine Wahl",
    nochNichtGestimmt: "Du hast noch nicht abgestimmt.",
    zurAbstimmung: "Zur Abstimmung",
    zurRunde: "Zur Runde",
    stimmeErstNachFreigabe: "Deine Stimme zählt, sobald der Betreiber dein Konto freigegeben hat.",
    stimmenTitel: "Deine Stimmen",
    stimmenSatz: "Was aus deinen Stimmen geworden ist.",
    stimmenLeer: "Noch keine Stimme abgegeben.",
    ausgang: { laeuft: "läuft", gewonnen: "gewonnen", nichtGewonnen: "nicht gewonnen" },
    zurBewertung: "Zur Bewertung",
    gestimmtAm: "Gestimmt am {datum}",
    einstellungenTitel: "Einstellungen",
```

In `lib/i18n/en.ts` an denselben Stellen dieselben Schlüssel:

```ts
    kapitel: {
      schlagwort: "your taste",
      notizenLeiste: "Your numbers",
      bewertet: "rated",
      schnitt: "on average",
      community: "vs community",
      hersteller: "producers",
      zuletzt: "last",
      srBewertet: "{zahl} ratings",
      srSchnitt: "On average {zahl} out of 5",
      srCommunity: "On average {zahl} apart from the community",
      srHersteller: "Flowers from {zahl} producers rated",
      srZuletzt: "Last rated on {zahl}",
    },
    aktivitaetTitel: "Your activity",
    aktivitaetSatz: "Ratings per month, the last twelve months.",
    aktivitaetLeer: "No rating in the last twelve months yet.",
    aktivitaetMonat: "Month",
    aktivitaetAnzahl: "Ratings",
    verteilungTitel: "Your scores",
    verteilungSatz: "How often you give each overall score, rounded.",
    verteilungStufe: "Score {stufe}: {anzahl}",
    verteilungLeer: "Your distribution appears with your first rating.",
    registerTitel: "Your ratings",
    registerSatz: "Every strain you rated, with your photo or the strain's.",
    registerSortierung: "Sort by",
    sortierung: { datum: "Newest", note: "Best score", abstand: "Largest gap" },
    registerAlle: "Show all {anzahl}",
    registerNote: "Your score {note} out of 5",
    registerCommunity: "Community {note} from {anzahl}",
    registerOhneCommunity: "No other scores yet",
    registerAbstand: "Gap {wert}",
    registerLeer: "No rating yet. Your first one will show up here, with a photo.",
```

```ts
    kapitel: {
      schlagwort: "your vote",
      notizenLeiste: "Your numbers",
      dabei: "member since",
      gestimmt: "voted",
      getroffen: "won",
      vorgeschlagen: "suggested",
      neu: "new",
      srDabei: "Member since {zahl}",
      srGestimmt: "{zahl} votes cast",
      srGetroffen: "{zahl} of your votes won",
      srVorgeschlagen: "{zahl} flowers suggested",
      srNeu: "{zahl} unread messages",
    },
    umfrageTitel: "The poll right now",
    umfrageKeine: "No round is running. The next one shows up on the polls page.",
    zuDenUmfragen: "Go to polls",
    vorschlaegeBis: "Suggestions until {datum}",
    deineWahl: "your pick",
    nochNichtGestimmt: "You have not voted yet.",
    zurAbstimmung: "Vote now",
    zurRunde: "Open round",
    stimmeErstNachFreigabe: "Your vote counts once the operator has approved your account.",
    stimmenTitel: "Your votes",
    stimmenSatz: "What became of your votes.",
    stimmenLeer: "No vote cast yet.",
    ausgang: { laeuft: "running", gewonnen: "won", nichtGewonnen: "did not win" },
    zurBewertung: "Read the review",
    gestimmtAm: "Voted on {datum}",
    einstellungenTitel: "Settings",
```

Run: `npx tsc --noEmit -p .` (prüft, dass `en` die Form von `de` hat) und `npx tsx --test tests/i18n*.test.ts`.
Expected: PASS.

- [ ] **Step 10: CSS der Kapitel-Bewegung**

In `app/globals.css` direkt nach `@keyframes schreiben { … }` einfügen:

```css
/* ==========================================================================
   Kapitel (Spec Profil und Konto 8): Profil und Konto bewegen sich nur per
   CSS. Jede Regel hat einen Grund in der Spec; ohne Unterstützung oder bei
   reduzierter Bewegung und im Sparmodus steht alles sofort.
   ========================================================================== */

@media (prefers-reduced-motion: no-preference) {
  /* Hierarchie: das Kapitel beginnt mit deinem Namen. */
  :root:not([data-sparmodus]) .kapitel-name {
    animation: kapitel-auf 0.7s var(--ease-standard) backwards;
  }

  /* Erzählung: die Wörter der Randnotizen werden mitgeschrieben. */
  :root:not([data-sparmodus]) .kapitel-notiz-wort {
    animation: schreiben 0.8s var(--ease-standard) calc(0.3s + var(--i, 0) * 80ms) backwards;
  }
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    /* Brand 7: der Abschnitt wird als Vorhang von oben aufgedeckt. */
    :root:not([data-sparmodus]) [data-feld] {
      animation: feld-vorhang linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 40%;
    }

    /* Brand 7: Tiefenebene, der Freisteller wandert mit dem Scrollweg. */
    :root:not([data-sparmodus]) .kapitel-tiefe {
      animation: kapitel-tiefe linear both;
      animation-timeline: view();
      animation-range: cover;
    }

    /* Erzählung: die Menge wächst von der Grundlinie. */
    :root:not([data-sparmodus]) [data-saeule] {
      transform-origin: bottom;
      animation: saeule-wachsen linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 35%;
    }

    :root:not([data-sparmodus]) [data-balken] {
      transform-origin: left;
      animation: balken-wachsen linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 35%;
    }

    /* Zustand: dein Netz steht. */
    :root:not([data-sparmodus]) [data-netz-erscheinen] {
      animation: netz-erscheinen linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
  }
}

@keyframes kapitel-auf {
  from {
    clip-path: inset(100% 0 0 0);
  }
  to {
    clip-path: inset(0);
  }
}

@keyframes feld-vorhang {
  from {
    clip-path: inset(0 0 100% 0);
  }
  to {
    clip-path: inset(0);
  }
}

@keyframes kapitel-tiefe {
  from {
    translate: 0 -24px;
  }
  to {
    translate: 0 24px;
  }
}

@keyframes saeule-wachsen {
  from {
    scale: 1 0;
  }
  to {
    scale: 1 1;
  }
}

@keyframes balken-wachsen {
  from {
    scale: 0 1;
  }
  to {
    scale: 1 1;
  }
}

@keyframes netz-erscheinen {
  from {
    opacity: 0;
    scale: 0.9;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}

/* Seitenwechsel per <ViewTransition>: bei reduzierter Bewegung ohne Animation. */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation: none !important;
  }
}
```

Run: `npm run farben` und `npx tsx --test tests/bewegung.test.ts tests/marke.test.ts`
Expected: PASS (keine neuen Farben, keine Handschrift im CSS).

- [ ] **Step 11: Failing Render-Tests der Kapitel-Bausteine**

```tsx
// tests/kapitel.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Feld } from "@/components/kapitel/Feld";
import { FeldSkelett } from "@/components/kapitel/FeldSkelett";
import { Kapitelkopf } from "@/components/kapitel/Kapitelkopf";
import { KapitelRaster } from "@/components/kapitel/KapitelRaster";
import { Randnotizen } from "@/components/kapitel/Randnotizen";
import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { de } from "@/lib/i18n/de";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

test("Feld: Abschnitt mit Titel, data-feld und Spaltenklasse ab 1080 px", () => {
  const h = html(createElement(Feld, { id: "netz", titel: "Deine Aromen", satz: "Ein Satz.", spalten: 6 }, "Inhalt"));
  assert.match(h, /<section[^>]*data-feld/);
  assert.match(h, /aria-labelledby="netz-titel"/);
  assert.match(h, /<h2 id="netz-titel"[^>]*>Deine Aromen<\/h2>/);
  assert.match(h, /min-\[1080px\]:col-span-6/);
  assert.match(h, /col-span-4/);
  assert.doesNotMatch(h, /shadow/);
});

test("Feld als Stimmzettel trägt den Ebenenschatten", () => {
  assert.match(html(createElement(Feld, { id: "u", titel: "U", spalten: 6, stimmzettel: true }, "x")), /shadow-md/);
});

test("FeldSkelett: gleiche Spalten, aria-hidden", () => {
  const h = html(createElement(FeldSkelett, { spalten: 4, hoehe: "gross" }));
  assert.match(h, /aria-hidden="true"/);
  assert.match(h, /min-\[1080px\]:col-span-4/);
});

test("KapitelRaster: Feldbuch-Raster dahinter, 4 und 10 Spalten", () => {
  const h = html(createElement(KapitelRaster, null, "x"));
  assert.match(h, /feldbuch-raster/);
  assert.match(h, /grid-cols-4/);
  assert.match(h, /min-\[1080px\]:grid-cols-10/);
});

test("Randnotizen: Zahl gedruckt, Wort von Hand, Satz für Screenreader, gestaffelt", () => {
  const h = html(
    createElement(Randnotizen, {
      beschriftung: "Deine Zahlen",
      notizen: [
        { zahl: "12", wort: "bewertet", satz: "12 Bewertungen" },
        { zahl: "3,9", wort: "im Schnitt", satz: "Im Schnitt 3,9 von 5" },
      ],
    }),
  );
  assert.match(h, /aria-label="Deine Zahlen"/);
  assert.match(h, /class="sr-only">12 Bewertungen</);
  assert.match(h, /numeric[^"]*text-display/);
  assert.match(h, /font-hand text-notiz/);
  assert.match(h, /--i:1/);
});

test("Kapitelkopf: Name als h1 gedruckt, bricht um, Schlagwort aria-hidden", () => {
  const h = html(
    createElement(Kapitelkopf, {
      name: "A".repeat(60),
      avatarId: null,
      reiter: createElement("nav", null, "R"),
      schlagwort: "dein Geschmack",
      ton: "gruen",
    }),
  );
  assert.match(h, /<h1[^>]*kapitel-name[^>]*>A{60}<\/h1>/);
  assert.match(h, /wrap-break-word/);
  assert.match(h, /font-buch/);
  assert.match(h, /aria-hidden="true"[^>]*>dein Geschmack</);
});

test("ProfilReiter: aktiv mit aria-current, ungelesene Zahl mit Text", () => {
  const h = html(createElement(ProfilReiter, { aktiv: "konto", texte: de.profil, ungelesen: { anzahl: 2, text: "2 ungelesen" } }));
  assert.match(h, /aria-current="page"[^>]*>Konto/);
  assert.match(h, /text-h2/);
  assert.match(h, /2 ungelesen/);
});
```

Run: `npx tsx --test tests/kapitel.test.ts`
Expected: FAIL, Module fehlen.

- [ ] **Step 12: `KapitelRaster`, `Feld`, `FeldSkelett`**

```tsx
// components/kapitel/KapitelRaster.tsx
import type { ReactNode } from "react";

import { FeldbuchRaster } from "@/components/story/FeldbuchRaster";

/**
 * Dein Kapitel im Grünen Buch (Spec Profil und Konto 4): volle Breite auf dem
 * Feldbuch-Raster der Startseite, 4 Spalten, ab 1080 px 10. Spaltenabstand 0,
 * damit jede Feldkante auf einer Rasterlinie liegt; zwischen den Reihen 64 px,
 * in denen das Raster frei durchläuft.
 */
export function KapitelRaster({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate overflow-x-clip bg-surface">
      <FeldbuchRaster />
      <div className="grid grid-cols-4 gap-y-16 pb-24 min-[1080px]:grid-cols-10">{children}</div>
    </div>
  );
}
```

```tsx
// components/kapitel/Feld.tsx
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type FeldSpalten = 3 | 4 | 6 | 10;

/** Feste Klassen je Breite: Tailwind findet nur ausgeschriebene Namen. */
export const FELD_SPALTEN: Record<FeldSpalten, string> = {
  3: "min-[1080px]:col-span-3",
  4: "min-[1080px]:col-span-4",
  6: "min-[1080px]:col-span-6",
  10: "min-[1080px]:col-span-10",
};

type Props = {
  id: string;
  titel: string;
  satz?: string;
  spalten: FeldSpalten;
  /** Nur „Umfrage jetzt“: der Stimmzettel liegt als Ebene auf dem Buch (Regel 5). */
  stimmzettel?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Ein Feld statt einer Karte (Spec 4): eckige Fläche in `surface`, die das
 * Raster unter sich abdeckt, links die Rasterlinie als Kante, oben der
 * Kapitelstrich. Unter 1080 px über alle 4 Spalten.
 */
export function Feld({ id, titel, satz, spalten, stimmzettel = false, className, children }: Props) {
  return (
    <section
      data-feld=""
      aria-labelledby={`${id}-titel`}
      className={cn(
        "col-span-4 flex min-w-0 flex-col gap-6 border-t border-l border-t-border-strong border-l-border bg-surface p-6 min-[1080px]:p-8",
        FELD_SPALTEN[spalten],
        stimmzettel && "bg-surface-raised shadow-md",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h2 id={`${id}-titel`} className="text-h3 text-text text-balance">
          {titel}
        </h2>
        {satz ? <p className="max-w-[68ch] text-small text-text-muted text-pretty">{satz}</p> : null}
      </div>
      {children}
    </section>
  );
}
```

```tsx
// components/kapitel/FeldSkelett.tsx
import { cn } from "@/lib/cn";

import { FELD_SPALTEN, type FeldSpalten } from "./Feld";

const HOEHE = { klein: "h-40", mittel: "h-80", gross: "h-120" } as const;

/** Platzhalter in der Form des Felds, solange es streamt (Spec 9). */
export function FeldSkelett({ spalten, hoehe = "mittel" }: { spalten: FeldSpalten; hoehe?: keyof typeof HOEHE }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "col-span-4 flex flex-col gap-6 border-t border-l border-t-border-strong border-l-border bg-surface p-6 min-[1080px]:p-8",
        FELD_SPALTEN[spalten],
      )}
    >
      <div className="h-6 w-40 bg-surface-sunken" />
      <div className={cn("w-full bg-surface-sunken", HOEHE[hoehe])} />
    </div>
  );
}
```

`h-120` (480 px) und `w-40` liegen auf der 4-px-Skala der Leiter (8er-Vielfache); prüfen, dass `h-120` im Projekt sonst schon vorkommt oder `--spacing` es erzeugt (Tailwind 4 rechnet jede Zahl × 4 px).

- [ ] **Step 13: `Randnotizen`**

```tsx
// components/kapitel/Randnotizen.tsx
import type { CSSProperties } from "react";

export type Randnotiz = { zahl: string; wort: string; satz: string };

/**
 * Deine Zahlen als Randnotizen (Spec 5, Muster Randspalte der Startseite):
 * Zahl gedruckt, Wort von Hand, weil das Mitglied Community ist (Regel 1,
 * Spec 11). Vorgelesen wird je Notiz ein Satz; die sichtbaren Teile sind
 * aria-hidden. Je Notiz 2 Rasterspalten, unter 1080 px zwei je Reihe, die
 * fünfte über die ganze Breite. Die Zahl zählt nicht hoch (Regel 7).
 */
export function Randnotizen({ notizen, beschriftung }: { notizen: readonly Randnotiz[]; beschriftung: string }) {
  return (
    <ul aria-label={beschriftung} className="col-span-4 grid grid-cols-subgrid gap-y-8 min-[1080px]:col-span-10">
      {notizen.map((n, i) => (
        <li
          key={n.wort}
          className="col-span-2 flex min-w-0 flex-col gap-2 px-6 last:odd:col-span-4 min-[1080px]:px-8 min-[1080px]:last:odd:col-span-2"
        >
          <span className="sr-only">{n.satz}</span>
          <span aria-hidden="true" className="numeric text-display text-text">
            {n.zahl}
          </span>
          <span
            aria-hidden="true"
            style={{ "--i": i } as CSSProperties}
            className="kapitel-notiz-wort font-hand text-notiz text-logo"
          >
            {n.wort}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 14: `Kapitelkopf`**

```tsx
// components/kapitel/Kapitelkopf.tsx
import type { ReactNode } from "react";

import { Schlagwort } from "@/components/story/Schlagwort";
import { Avatar } from "@/components/ui";

type Props = {
  name: string;
  avatarId: string | null;
  /** Der ProfilReiter. */
  reiter: ReactNode;
  /** Freisteller rechts (ab 1080 px), schon als <Bild> gebaut. */
  bild?: ReactNode;
  schlagwort: string;
  ton: "gruen" | "lila";
  /** Konto: „Abmelden“. */
  aktion?: ReactNode;
};

/**
 * Kapitelkopf (Spec 5): dein Name als Kapitelüberschrift, gedruckt (Namen
 * nie in Handschrift), darunter die Reiter. Rechts ab 1080 px ein
 * Freisteller als Tiefenebene, dahinter ein Schlagwort wie in jeder
 * Startseiten-Sektion.
 */
export function Kapitelkopf({ name, avatarId, reiter, bild, schlagwort, ton, aktion }: Props) {
  return (
    <header className="relative isolate col-span-4 grid grid-cols-subgrid overflow-x-clip pt-16 min-[1080px]:col-span-10 min-[1080px]:pt-24">
      <Schlagwort satz={schlagwort} ton={ton} oben="top-8 sm:top-12" />
      <div className="col-span-4 flex min-w-0 flex-col gap-8 px-6 min-[1080px]:col-span-6 min-[1080px]:px-8">
        <div className="flex items-start justify-between gap-4">
          <Avatar name={name} bildId={avatarId} groesse="lg" />
          {aktion}
        </div>
        <h1 className="kapitel-name font-buch text-kapitel text-text text-balance wrap-break-word">{name}</h1>
        {reiter}
      </div>
      {bild ? (
        <div aria-hidden="true" className="hidden min-[1080px]:col-span-4 min-[1080px]:flex min-[1080px]:items-end min-[1080px]:px-8">
          <div className="kapitel-tiefe w-full">{bild}</div>
        </div>
      ) : null}
    </header>
  );
}
```

- [ ] **Step 15: `ProfilReiter` neu**

Den Rumpf von `ProfilReiter` ersetzen (Props und `REITER` bleiben):

```tsx
export function ProfilReiter({ aktiv, texte, ungelesen }: Props) {
  return (
    <nav aria-label={texte.reiterLeiste} className="flex flex-wrap gap-x-8 gap-y-2">
      {REITER.map((r) => (
        <Link
          key={r.id}
          prefetch={false}
          href={r.href}
          aria-current={aktiv === r.id ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 text-h2 transition-colors duration-fast ease-standard hover:text-text",
            // cn mischt nicht (ohne tailwind-merge): die Textfarbe steht je Zustand genau einmal.
            aktiv === r.id
              ? "text-text underline decoration-accent decoration-2 underline-offset-8"
              : "text-text-muted",
          )}
        >
          {r.id === "profil" ? texte.reiterProfil : texte.reiterKonto}
          {r.id === "konto" && ungelesen && ungelesen.anzahl > 0 ? (
            <Badge variante="accent" zeichen={false}>
              <span aria-hidden="true" className="numeric">{ungelesen.anzahl}</span>
              <span className="sr-only">{ungelesen.text}</span>
            </Badge>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
```

Doc-Kommentar über der Funktion um „Seit Spec Profil und Konto 5 groß im Kapitelkopf“ ergänzen.

- [ ] **Step 16: Tests, tsc, eslint**

Run: `npx tsx --test tests/kapitel.test.ts tests/profil-seite.test.ts && npx tsc --noEmit -p . && npx eslint components/kapitel components/profil/ProfilReiter.tsx lib/profil.ts lib/query/profil.ts lib/profil-verlauf.ts lib/session.ts`
Expected: PASS, keine Befunde. Fällt `tests/profil-seite.test.ts` an einer Optikklasse des alten Reiters, den Test auf die neue Klasse anpassen.

- [ ] **Step 17: Gesamtlauf und Commit**

Run: `npm test`
Expected: alle grün.

```bash
git add lib/profil.ts lib/query/profil.ts lib/profil-verlauf.ts lib/session.ts lib/i18n/de.ts lib/i18n/en.ts app/globals.css components/kapitel components/profil/ProfilReiter.tsx tests/profil-ersetzen.test.ts tests/profil-verlauf.test.ts tests/kapitel.test.ts
git commit -m "feat: Fundament Kapitel (K1, M2, Texte, Raster, Felder, Randnotizen, Kopf)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Dazu die in Step 8 angepassten Test- oder Mock-Dateien benennen.

---

### Task 2 (Strang A): Aktivität, Notenverteilung, Profil-Randnotizen

**Files:**
- Create: `lib/profil-dashboard.ts`
- Create: `components/profil/Aktivitaet.tsx`, `components/profil/NotenVerteilung.tsx`
- Test: `tests/profil-dashboard.test.ts`

**Interfaces:**
- Consumes: `AuswertungsZeile` (`lib/profil-typen.ts`), `noteOderErsatz` (`lib/profil.ts`), `Randnotiz` (`components/kapitel/Randnotizen.tsx`), Texte `w.profil.kapitel.*`, `w.profil.aktivitaet*`, `w.profil.verteilung*` aus Task 1, `formatiereZahl`, `formatiereDatum` (`lib/format.ts`), `t` (`lib/i18n/text.ts`).
- Produces in `lib/profil-dashboard.ts`:
  - `type Monat = { schluessel: string; kurz: string; anzahl: number; laufend: boolean }` (`schluessel` = `"2026-10"`)
  - `monatsReihe(daten: readonly Date[], jetzt: Date, sprache: Sprache): Monat[]` (immer 12, ältester zuerst, letzter `laufend`)
  - `type Stufe = { stufe: 1 | 2 | 3 | 4 | 5; anzahl: number }`
  - `notenVerteilung(zeilen: readonly AuswertungsZeile[]): Stufe[]` (immer 5, Stufe 1 zuerst)
  - `profilNotizen(eingabe: { zeilen: readonly AuswertungsZeile[]; differenz: number | null; hersteller: number }, texte: Woerterbuch["profil"]["kapitel"], sprache: Sprache): Randnotiz[]`
- Produces Komponenten: `Aktivitaet(props: { monate: readonly Monat[]; texte: Woerterbuch["profil"] })`, `NotenVerteilung(props: { stufen: readonly Stufe[]; texte: Woerterbuch["profil"] })`.

- [ ] **Step 1: Failing Tests**

```ts
// tests/profil-dashboard.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Aktivitaet } from "@/components/profil/Aktivitaet";
import { NotenVerteilung } from "@/components/profil/NotenVerteilung";
import { de } from "@/lib/i18n/de";
import { monatsReihe, notenVerteilung, profilNotizen } from "@/lib/profil-dashboard";
import type { AuswertungsZeile } from "@/lib/profil-typen";

const z = (gesamtnote: number | null, tag: string, community: AuswertungsZeile["community"] = null): AuswertungsZeile => ({
  slug: "s",
  handelsname: "S",
  erstelltAm: new Date(tag),
  gesamtnote,
  aussehen: 3,
  geruch: 3,
  geschmack: 3,
  wirkung: 3,
  konsistenz: 3,
  community,
});

test("monatsReihe: zwölf Monate, laufender zuletzt, UTC-Grenzen", () => {
  const jetzt = new Date("2026-10-01T00:30:00Z");
  const r = monatsReihe(
    [new Date("2026-09-30T23:30:00Z"), new Date("2026-10-01T00:10:00Z"), new Date("2025-10-15T12:00:00Z"), new Date("2025-09-30T12:00:00Z")],
    jetzt,
    "de",
  );
  assert.equal(r.length, 12);
  assert.equal(r[11].schluessel, "2026-10");
  assert.equal(r[11].laufend, true);
  assert.equal(r[11].anzahl, 1);
  assert.equal(r[10].anzahl, 1);
  assert.equal(r[0].schluessel, "2025-11");
  assert.equal(r.reduce((s, m) => s + m.anzahl, 0), 2, "Oktober 2025 und älter liegen außerhalb");
  assert.equal(r.filter((m) => m.laufend).length, 1);
});

test("monatsReihe: Jahreswechsel und Monatskürzel je Sprache", () => {
  const r = monatsReihe([], new Date("2026-01-15T12:00:00Z"), "en");
  assert.equal(r[0].schluessel, "2025-02");
  assert.equal(r[11].schluessel, "2026-01");
  assert.equal(r[11].kurz, "Jan");
});

test("notenVerteilung: fünf Stufen, gerundet, Ersatznote ohne Gesamtnote", () => {
  const v = notenVerteilung([z(4.5, "2026-01-01"), z(4.4, "2026-01-01"), z(1, "2026-01-01"), z(null, "2026-01-01")]);
  assert.deepEqual(v.map((s) => s.stufe), [1, 2, 3, 4, 5]);
  assert.equal(v[0].anzahl, 1);
  assert.equal(v[3].anzahl, 1);
  assert.equal(v[4].anzahl, 1);
  assert.equal(v[2].anzahl, 1, "ohne Gesamtnote zählt das Mittel 3 der Teilnoten");
});

test("profilNotizen: fünf Notizen; ohne Community-Abstand entfällt sie", () => {
  const zeilen = [z(4, "2026-10-02T10:00:00Z"), z(3, "2026-09-01T10:00:00Z")];
  const mit = profilNotizen({ zeilen, differenz: -0.4, hersteller: 2 }, de.profil.kapitel, "de");
  assert.deepEqual(mit.map((n) => n.wort), ["bewertet", "im Schnitt", "zur Community", "Hersteller", "zuletzt"]);
  assert.equal(mit[0].zahl, "2");
  assert.equal(mit[1].zahl, "3,5");
  assert.equal(mit[2].zahl, "−0,4");
  assert.equal(mit[4].zahl, "02.10.");
  const ohne = profilNotizen({ zeilen, differenz: null, hersteller: 2 }, de.profil.kapitel, "de");
  assert.equal(ohne.length, 4);
});

test("profilNotizen: ohne Bewertung nur „0 bewertet“", () => {
  const n = profilNotizen({ zeilen: [], differenz: null, hersteller: 0 }, de.profil.kapitel, "de");
  assert.deepEqual(n.map((x) => [x.zahl, x.wort]), [["0", "bewertet"]]);
});

test("Aktivitaet: Säulen mit data-saeule, Wert nur ab 1, Tabelle für Screenreader, Leersatz", () => {
  const monate = monatsReihe([new Date("2026-10-02T10:00:00Z")], new Date("2026-10-08T10:00:00Z"), "de");
  const h = renderToStaticMarkup(createElement(Aktivitaet, { monate, texte: de.profil }));
  assert.equal((h.match(/data-saeule/g) ?? []).length, 12);
  assert.match(h, /<table class="sr-only"/);
  assert.doesNotMatch(h, /accent/);
  const leer = renderToStaticMarkup(createElement(Aktivitaet, { monate: monatsReihe([], new Date(), "de"), texte: de.profil }));
  assert.match(leer, /noch keine Bewertung/);
  assert.doesNotMatch(leer, /data-saeule/);
});

test("NotenVerteilung: Balken ohne Spur, Liste für Screenreader, Leersatz", () => {
  const h = renderToStaticMarkup(createElement(NotenVerteilung, { stufen: notenVerteilung([z(4, "2026-01-01")]), texte: de.profil }));
  assert.equal((h.match(/data-balken/g) ?? []).length, 1, "nur Stufen mit Anzahl bekommen einen Balken");
  assert.match(h, /Note 4: 1/);
  const leer = renderToStaticMarkup(createElement(NotenVerteilung, { stufen: notenVerteilung([]), texte: de.profil }));
  assert.match(leer, /ersten Bewertung/);
});
```

Run: `npx tsx --test tests/profil-dashboard.test.ts`
Expected: FAIL, Module fehlen.

- [ ] **Step 2: `lib/profil-dashboard.ts`**

```ts
import type { Randnotiz } from "@/components/kapitel/Randnotizen";
import { formatiereDatum, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { noteOderErsatz } from "@/lib/profil";
import type { AuswertungsZeile } from "@/lib/profil-typen";

export type Monat = { schluessel: string; kurz: string; anzahl: number; laufend: boolean };
export type Stufe = { stufe: 1 | 2 | 3 | 4 | 5; anzahl: number };

/** Formatter auf Modulebene (Regel 10), Monat in UTC wie die Schlüssel. */
const MONATE: Record<Sprache, Intl.DateTimeFormat> = {
  de: new Intl.DateTimeFormat("de-DE", { month: "short", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }),
};

const schluessel = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

/** Bewertungen je Monat, die letzten zwölf inklusive laufendem (Spec 6, Aktivität). */
export function monatsReihe(daten: readonly Date[], jetzt: Date, sprache: Sprache): Monat[] {
  const reihe: Monat[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(jetzt.getUTCFullYear(), jetzt.getUTCMonth() - i, 1));
    reihe.push({ schluessel: schluessel(d), kurz: MONATE[sprache].format(d).replace(".", ""), anzahl: 0, laufend: i === 0 });
  }
  const index = new Map(reihe.map((m, i) => [m.schluessel, i]));
  for (const d of daten) {
    const i = index.get(schluessel(d));
    if (i !== undefined) reihe[i].anzahl++;
  }
  return reihe;
}

/** Wie oft welche gerundete Gesamtnote (Spec 6, Notenverteilung); immer fünf Stufen. */
export function notenVerteilung(zeilen: readonly AuswertungsZeile[]): Stufe[] {
  const stufen: Stufe[] = ([1, 2, 3, 4, 5] as const).map((stufe) => ({ stufe, anzahl: 0 }));
  for (const z of zeilen) {
    const n = Math.min(5, Math.max(1, Math.round(noteOderErsatz(z))));
    stufen[n - 1].anzahl++;
  }
  return stufen;
}

/** Datum als TT.MM. bzw. DD/MM, ohne Jahr. */
const TAG: Record<Sprache, Intl.DateTimeFormat> = {
  de: new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }),
  en: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", timeZone: "Europe/Berlin" }),
};

/**
 * Die Randnotizen des Profils (Spec 5). Ohne Bewertung nur „0 bewertet“; der
 * Abstand zur Community entfällt ohne Vergleich. Vorzeichen als echtes Minus.
 */
export function profilNotizen(
  { zeilen, differenz, hersteller }: { zeilen: readonly AuswertungsZeile[]; differenz: number | null; hersteller: number },
  texte: Woerterbuch["profil"]["kapitel"],
  sprache: Sprache,
): Randnotiz[] {
  const anzahl = String(zeilen.length);
  const notizen: Randnotiz[] = [{ zahl: anzahl, wort: texte.bewertet, satz: t(texte.srBewertet, { zahl: anzahl }) }];
  if (zeilen.length === 0) return notizen;

  const schnitt = formatiereZahl(zeilen.reduce((s, z) => s + noteOderErsatz(z), 0) / zeilen.length, 1, sprache);
  notizen.push({ zahl: schnitt, wort: texte.schnitt, satz: t(texte.srSchnitt, { zahl: schnitt }) });
  if (differenz !== null) {
    const betrag = formatiereZahl(Math.abs(differenz), 1, sprache);
    const zahl = differenz > 0 ? `+${betrag}` : differenz < 0 ? `−${betrag}` : betrag;
    notizen.push({ zahl, wort: texte.community, satz: t(texte.srCommunity, { zahl }) });
  }
  notizen.push({ zahl: String(hersteller), wort: texte.hersteller, satz: t(texte.srHersteller, { zahl: hersteller }) });
  const letzte = zeilen.reduce((a, b) => (b.erstelltAm > a.erstelltAm ? b : a)).erstelltAm;
  notizen.push({
    zahl: TAG[sprache].format(letzte),
    wort: texte.zuletzt,
    satz: t(texte.srZuletzt, { zahl: formatiereDatum(letzte, sprache) }),
  });
  return notizen;
}
```

Hinweis: `de-DE` mit `day`/`month` liefert `02.10.` (mit Schlusspunkt), `en-GB` liefert `02/10`. Weicht die Laufzeit ab, die Formatierung anpassen, nicht den Test.

Run: `npx tsx --test tests/profil-dashboard.test.ts`
Expected: Logik-Tests PASS, Render-Tests FAIL.

- [ ] **Step 3: `Aktivitaet`**

```tsx
// components/profil/Aktivitaet.tsx
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Monat } from "@/lib/profil-dashboard";
import { cn } from "@/lib/cn";

/**
 * Bewertungen je Monat (Spec 6): eine Reihe, also Säulen, keine Legende.
 * Werte stehen direkt an den Säulen, darum kein Tooltip. Tinte statt Blattgrün
 * (Regel 4), der laufende Monat dunkler. Höhe als Prozent im style ist
 * Datencodierung, kein Abstand. Die Grafik ist aria-hidden, vorgelesen wird
 * die Tabelle.
 */
export function Aktivitaet({ monate, texte }: { monate: readonly Monat[]; texte: Woerterbuch["profil"] }) {
  const hoechstens = Math.max(0, ...monate.map((m) => m.anzahl));
  if (hoechstens === 0) return <p className="max-w-[68ch] text-body text-text-muted">{texte.aktivitaetLeer}</p>;
  return (
    <div>
      <div aria-hidden="true" className="flex h-48 items-end gap-2 border-b border-border-strong">
        {monate.map((m) => (
          <div key={m.schluessel} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
            {m.anzahl > 0 ? <span className="numeric text-caption text-text">{m.anzahl}</span> : null}
            <div
              data-saeule=""
              style={{ height: `${(m.anzahl / hoechstens) * 100}%` }}
              className={cn(
                "w-full transition-colors duration-fast ease-standard hover:bg-text",
                m.laufend ? "bg-text" : "bg-text-muted/40",
              )}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-2">
        {monate.map((m) => (
          <span key={m.schluessel} className={cn("min-w-0 flex-1 truncate text-center text-caption", m.laufend ? "text-text" : "text-text-muted")}>
            {m.kurz}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{texte.aktivitaetTitel}</caption>
        <thead>
          <tr>
            <th scope="col">{texte.aktivitaetMonat}</th>
            <th scope="col">{texte.aktivitaetAnzahl}</th>
          </tr>
        </thead>
        <tbody>
          {monate.map((m) => (
            <tr key={m.schluessel}>
              <th scope="row">{m.schluessel}</th>
              <td>{m.anzahl}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

`h-48` ist 192 px (Leiter-Vielfaches von 8). `bg-text-muted/40` ist Deckkraft auf einem Token, kein Primitiv. `npm run farben` danach laufen lassen. Die Säule ohne Wert hat Höhe 0 und bleibt unsichtbar; ihr Monatskürzel steht trotzdem.

- [ ] **Step 4: `NotenVerteilung`**

```tsx
// components/profil/NotenVerteilung.tsx
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { Stufe } from "@/lib/profil-dashboard";

/**
 * Wie oft du welche Note vergibst (Spec 6): waagerechte Balken ohne
 * Hintergrundspur, Zahl am Ende, häufigste Stufe in Tinte. Die sichtbare
 * Grafik ist aria-hidden, vorgelesen wird die Liste.
 */
export function NotenVerteilung({ stufen, texte }: { stufen: readonly Stufe[]; texte: Woerterbuch["profil"] }) {
  const hoechstens = Math.max(0, ...stufen.map((s) => s.anzahl));
  if (hoechstens === 0) return <p className="max-w-[68ch] text-body text-text-muted">{texte.verteilungLeer}</p>;
  return (
    <div>
      <ul className="sr-only">
        {stufen.map((s) => (
          <li key={s.stufe}>{t(texte.verteilungStufe, { stufe: s.stufe, anzahl: s.anzahl })}</li>
        ))}
      </ul>
      <div aria-hidden="true" className="flex flex-col gap-2">
        {[...stufen].reverse().map((s) => (
          <div key={s.stufe} className="flex items-center gap-4">
            <span className="numeric w-4 text-small text-text-muted">{s.stufe}</span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {s.anzahl > 0 ? (
                <div
                  data-balken=""
                  // Höchstens 85 %, damit die Zahl daneben im Feld bleibt.
                  style={{ width: `${(s.anzahl / hoechstens) * 85}%` }}
                  className={cn("h-6", s.anzahl === hoechstens ? "bg-text" : "bg-text-muted/40")}
                />
              ) : null}
              <span className="numeric text-small text-text">{s.anzahl}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Tests, tsc, eslint, farben**

Run: `npx tsx --test tests/profil-dashboard.test.ts && npx tsc --noEmit -p . && npx eslint lib/profil-dashboard.ts components/profil/Aktivitaet.tsx components/profil/NotenVerteilung.tsx && npm run farben`
Expected: PASS, keine Befunde.

- [ ] **Step 6: Commit**

```bash
git add lib/profil-dashboard.ts components/profil/Aktivitaet.tsx components/profil/NotenVerteilung.tsx tests/profil-dashboard.test.ts
git commit -m "feat: Aktivität, Notenverteilung und Randnotizen des Profils

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 (Strang B): Bewertungs-Register mit Bildern

**Files:**
- Modify: `lib/profil-typen.ts` (neu `RegisterZeile`)
- Modify: `lib/query/profil.ts` (nur `ladeAuswertungsZeilen`)
- Create: `lib/bewertungs-register.ts`
- Create: `components/profil/BewertungsRegister.tsx`
- Test: `tests/bewertungs-register.test.ts`

**Interfaces:**
- Consumes: `AuswertungsZeile`, `noteOderErsatz`, `ersatzBildId` (`lib/bewertungsbilder.ts`), `Bild`, `BudpicBild` (`components/medien/Bild.tsx`), Texte `w.profil.register*`, `w.profil.sortierung.*` aus Task 1, `formatiereDatum`, `formatiereZahl`, `t`, `textLinkKlassen` (`components/ui`).
- Produces in `lib/profil-typen.ts`:
  - `type RegisterZeile = AuswertungsZeile & { strainId: string; hersteller: string | null; bildPfad: string | null; eigenesBild: { id: string; breite: number; hoehe: number; offen: boolean } | null }`
- Produces `ladeAuswertungsZeilen(mitgliedId: string): Promise<RegisterZeile[]>` (gleiche Abfrage, mehr `select`).
- Produces in `lib/bewertungs-register.ts`:
  - `const SORTIERUNGEN = ["datum", "note", "abstand"] as const; type Sortierung = (typeof SORTIERUNGEN)[number]`
  - `REGISTER_ANFANG = 10`
  - `registerParameter(sp: Record<string, string | string[] | undefined>): { sortierung: Sortierung; alle: boolean }`
  - `type RegisterEintrag = { slug: string; handelsname: string; note: number; datum: Date; community: { mittel: number; anzahl: number } | null; abstand: number | null; bild: { art: "medium"; id: string } | { art: "eigen"; id: string; breite: number; hoehe: number; offen: boolean } }`
  - `registerAnsicht(zeilen: readonly RegisterZeile[], p: { sortierung: Sortierung; alle: boolean }): { eintraege: RegisterEintrag[]; gesamt: number }`
- Produces `BewertungsRegister(props: { ansicht: ReturnType<typeof registerAnsicht>; sortierung: Sortierung; alle: boolean; texte: Woerterbuch["profil"]; sprache: Sprache })`.

- [ ] **Step 1: Failing Tests**

```ts
// tests/bewertungs-register.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { BewertungsRegister } from "@/components/profil/BewertungsRegister";
import { registerAnsicht, registerParameter, REGISTER_ANFANG } from "@/lib/bewertungs-register";
import { de } from "@/lib/i18n/de";
import type { RegisterZeile } from "@/lib/profil-typen";

const r = (slug: string, note: number, tag: number, community: RegisterZeile["community"] = null, eigen = false): RegisterZeile => ({
  slug,
  handelsname: slug.toUpperCase(),
  erstelltAm: new Date(Date.UTC(2026, 8, tag)),
  gesamtnote: note,
  aussehen: 3,
  geruch: 3,
  geschmack: 3,
  wirkung: 3,
  konsistenz: 3,
  community,
  strainId: `id-${slug}`,
  hersteller: null,
  bildPfad: null,
  eigenesBild: eigen ? { id: "b1", breite: 800, hoehe: 1000, offen: true } : null,
});

test("registerParameter: gültig, ungültig, Array", () => {
  assert.deepEqual(registerParameter({ sortierung: "note", alle: "1" }), { sortierung: "note", alle: true });
  assert.deepEqual(registerParameter({ sortierung: "xyz", alle: "ja" }), { sortierung: "datum", alle: false });
  assert.deepEqual(registerParameter({ sortierung: ["abstand", "note"] }), { sortierung: "abstand", alle: false });
  assert.deepEqual(registerParameter({}), { sortierung: "datum", alle: false });
});

test("registerAnsicht: Datum neu zuerst, Note hoch zuerst, Abstand größter Betrag zuerst", () => {
  const zeilen = [
    r("a", 4, 1, { mittel: 2, anzahl: 3 }),
    r("b", 5, 3, { mittel: 4.8, anzahl: 2 }),
    r("c", 2, 2, null),
  ];
  assert.deepEqual(registerAnsicht(zeilen, { sortierung: "datum", alle: false }).eintraege.map((e) => e.slug), ["b", "c", "a"]);
  assert.deepEqual(registerAnsicht(zeilen, { sortierung: "note", alle: false }).eintraege.map((e) => e.slug), ["b", "a", "c"]);
  assert.deepEqual(
    registerAnsicht(zeilen, { sortierung: "abstand", alle: false }).eintraege.map((e) => e.slug),
    ["a", "b", "c"],
    "ohne Community-Wert ans Ende",
  );
});

test("registerAnsicht: erst zehn, mit alle alle; Bild eigen oder Ersatz", () => {
  const viele = Array.from({ length: 13 }, (_, i) => r(`s${i}`, 3, i + 1, null, i === 12));
  const kurz = registerAnsicht(viele, { sortierung: "datum", alle: false });
  assert.equal(kurz.eintraege.length, REGISTER_ANFANG);
  assert.equal(kurz.gesamt, 13);
  assert.equal(registerAnsicht(viele, { sortierung: "datum", alle: true }).eintraege.length, 13);
  assert.equal(kurz.eintraege[0].bild.art, "eigen");
  assert.equal(kurz.eintraege[1].bild.art, "medium");
});

test("registerAnsicht: leer", () => {
  assert.deepEqual(registerAnsicht([], { sortierung: "datum", alle: false }), { eintraege: [], gesamt: 0 });
});

const render = (zeilen: RegisterZeile[], alle = false) =>
  renderToStaticMarkup(
    createElement(BewertungsRegister, {
      ansicht: registerAnsicht(zeilen, { sortierung: "datum", alle }),
      sortierung: "datum",
      alle,
      texte: de.profil,
      sprache: "de",
    }),
  );

test("BewertungsRegister: Sortier-Links mit aria-current, Name bricht um, Link auf die Blüte", () => {
  const lang = "X".repeat(60);
  const h = render([r(lang.toLowerCase(), 4, 1, { mittel: 3.2, anzahl: 4 })]);
  assert.match(h, /href="\/profil\?sortierung=note#bewertungen-titel"/);
  assert.match(h, /aria-current="true"[^>]*>Neueste/);
  assert.match(h, /href="\/blueten\/x{60}"/);
  assert.match(h, /wrap-break-word/);
  assert.match(h, /Community 3,2 aus 4/);
});

test("BewertungsRegister: „Alle n zeigen“ nur bei mehr als zehn und nicht bei alle", () => {
  const viele = Array.from({ length: 11 }, (_, i) => r(`s${i}`, 3, i + 1));
  assert.match(render(viele), /Alle 11 zeigen/);
  assert.doesNotMatch(render(viele, true), /Alle 11 zeigen/);
  assert.match(render([]), /Noch keine Bewertung/);
});

test("ladeAuswertungsZeilen: eigenes Bild, Hersteller und Bildpfad in derselben Abfrage, mit take", () => {
  const q = readFileSync("lib/query/profil.ts", "utf8");
  const teil = q.slice(q.indexOf("export async function ladeAuswertungsZeilen"));
  assert.match(teil, /bilder:\s*\{/);
  assert.match(teil, /take:\s*1/);
  assert.match(teil, /herstellerBildPfad:\s*true/);
  assert.match(teil, /hersteller:\s*\{\s*select:\s*\{\s*name:\s*true/);
});
```

Run: `npx tsx --test tests/bewertungs-register.test.ts`
Expected: FAIL.

- [ ] **Step 2: Typ und Abfrage**

In `lib/profil-typen.ts` nach `AuswertungsZeile`:

```ts
/** Eine eigene Bewertung für das Register (Spec Profil und Konto 6): mit Bild und Hersteller. */
export type RegisterZeile = AuswertungsZeile & {
  strainId: string;
  hersteller: string | null;
  /** `strains.hersteller_bild_pfad`, für `ersatzBildId`. */
  bildPfad: string | null;
  /** Dein erstes Bild zu dieser Bewertung (offen oder freigegeben), sonst null. */
  eigenesBild: { id: string; breite: number; hoehe: number; offen: boolean } | null;
};
```

In `lib/query/profil.ts`, `ladeAuswertungsZeilen`: Rückgabetyp auf `Promise<RegisterZeile[]>` (Import ergänzen), im `select` statt `strain: { select: { slug: true, handelsname: true } }`:

```ts
      strain: { select: { slug: true, handelsname: true, herstellerBildPfad: true, hersteller: { select: { name: true } } } },
      // Dein erstes Bild zur Bewertung (Spec 2026-10-06): offene sieht der Eigentümer über /api/bild/offen.
      bilder: {
        where: { status: { in: ["OFFEN", "FREIGEGEBEN"] } },
        orderBy: { erstelltAm: "asc" },
        take: 1,
        select: { id: true, breite: true, hoehe: true, status: true },
      },
```

und im `return zeilen.map(...)`-Objekt zusätzlich:

```ts
    strainId: z.strainId,
    hersteller: z.strain.hersteller?.name ?? null,
    bildPfad: z.strain.herstellerBildPfad,
    eigenesBild: z.bilder[0]
      ? { id: z.bilder[0].id, breite: z.bilder[0].breite, hoehe: z.bilder[0].hoehe, offen: z.bilder[0].status === "OFFEN" }
      : null,
```

Prüfen, dass `/api/bild/offen/<id>` dem Eigentümer ausliefert: `grep -rn "offen" app/api/bild` lesen. Liefert es nur Admins aus, statt `offen` den Fall „nur FREIGEGEBEN“ wählen (`where: { status: "FREIGEGEBEN" }`, `offen: false`) und das im Commit nennen.

Run: `npx tsc --noEmit -p .`
Expected: sauber (`RegisterZeile` ist Untertyp von `AuswertungsZeile`, `auswertungen()` nimmt es weiter).

- [ ] **Step 3: `lib/bewertungs-register.ts`**

```ts
import { ersatzBildId } from "@/lib/bewertungsbilder";
import { noteOderErsatz } from "@/lib/profil";
import type { RegisterZeile } from "@/lib/profil-typen";

export const SORTIERUNGEN = ["datum", "note", "abstand"] as const;
export type Sortierung = (typeof SORTIERUNGEN)[number];

/** So viele Einträge stehen, bis jemand „Alle zeigen“ wählt (Spec 6). */
export const REGISTER_ANFANG = 10;

export type RegisterEintrag = {
  slug: string;
  handelsname: string;
  note: number;
  datum: Date;
  community: { mittel: number; anzahl: number } | null;
  /** eigene − Community; null ohne Community-Wert. */
  abstand: number | null;
  bild: { art: "medium"; id: string } | { art: "eigen"; id: string; breite: number; hoehe: number; offen: boolean };
};

const erster = (w: string | string[] | undefined) => (Array.isArray(w) ? w[0] : w);

/** Liest `?sortierung=` und `?alle=1`; alles andere fällt auf Datum und den Anfang zurück. */
export function registerParameter(sp: Record<string, string | string[] | undefined>): { sortierung: Sortierung; alle: boolean } {
  const s = erster(sp.sortierung);
  return {
    sortierung: (SORTIERUNGEN as readonly string[]).includes(s ?? "") ? (s as Sortierung) : "datum",
    alle: erster(sp.alle) === "1",
  };
}

/** Sortiert und kürzt das Register (Spec 6). Richtung je Sortierung fest. */
export function registerAnsicht(
  zeilen: readonly RegisterZeile[],
  { sortierung, alle }: { sortierung: Sortierung; alle: boolean },
): { eintraege: RegisterEintrag[]; gesamt: number } {
  const eintraege: RegisterEintrag[] = zeilen.map((z) => {
    const note = noteOderErsatz(z);
    const c = z.community && z.community.mittel !== null && z.community.anzahl > 0 ? { mittel: z.community.mittel, anzahl: z.community.anzahl } : null;
    return {
      slug: z.slug,
      handelsname: z.handelsname,
      note,
      datum: z.erstelltAm,
      community: c,
      abstand: c ? note - c.mittel : null,
      bild: z.eigenesBild ? { art: "eigen", ...z.eigenesBild } : { art: "medium", id: ersatzBildId(z.bildPfad, z.slug) },
    };
  });
  const nachDatum = (a: RegisterEintrag, b: RegisterEintrag) => b.datum.getTime() - a.datum.getTime();
  const vergleich: Record<Sortierung, (a: RegisterEintrag, b: RegisterEintrag) => number> = {
    datum: nachDatum,
    note: (a, b) => b.note - a.note || nachDatum(a, b),
    abstand: (a, b) =>
      (a.abstand === null ? 1 : 0) - (b.abstand === null ? 1 : 0) ||
      Math.abs(b.abstand ?? 0) - Math.abs(a.abstand ?? 0) ||
      nachDatum(a, b),
  };
  eintraege.sort(vergleich[sortierung]);
  return { eintraege: alle ? eintraege : eintraege.slice(0, REGISTER_ANFANG), gesamt: eintraege.length };
}
```

Run: `npx tsx --test tests/bewertungs-register.test.ts`
Expected: Logik-Tests PASS, Render-Tests FAIL.

- [ ] **Step 4: `BewertungsRegister`**

```tsx
// components/profil/BewertungsRegister.tsx
import Link from "next/link";

import { Bild, BudpicBild } from "@/components/medien/Bild";
import { textLinkKlassen } from "@/components/ui";
import { SORTIERUNGEN, type registerAnsicht, type Sortierung } from "@/lib/bewertungs-register";
import { cn } from "@/lib/cn";
import { formatiereDatum, formatiereZahl } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

type Props = {
  ansicht: ReturnType<typeof registerAnsicht>;
  sortierung: Sortierung;
  alle: boolean;
  texte: Woerterbuch["profil"];
  sprache: Sprache;
};

const ziel = (sortierung: Sortierung, alle: boolean) => {
  const p = new URLSearchParams();
  if (sortierung !== "datum") p.set("sortierung", sortierung);
  if (alle) p.set("alle", "1");
  const q = p.toString();
  // Sprungziel ist die Überschrift des Felds (Feld id="bewertungen").
  return `/profil${q ? `?${q}` : ""}#bewertungen-titel`;
};

/**
 * Deine Bewertungen als Register mit Bildern (Spec 6): je Eintrag dein Bild
 * oder das der Sorte, die Note groß, darunter Community und Abstand.
 * Sortiert wird über Links, ohne JavaScript. Ab 1080 px fünf je Reihe.
 */
export function BewertungsRegister({ ansicht, sortierung, alle, texte, sprache }: Props) {
  if (ansicht.gesamt === 0) return <p className="max-w-[68ch] text-body text-text-muted">{texte.registerLeer}</p>;
  return (
    <div className="flex flex-col gap-8">
      <nav aria-label={texte.registerSortierung} className="flex flex-wrap items-center gap-2">
        <span className="text-small text-text-muted">{texte.registerSortierung}</span>
        {SORTIERUNGEN.map((s) => (
          <Link
            key={s}
            prefetch={false}
            scroll={false}
            href={ziel(s, alle)}
            aria-current={s === sortierung ? "true" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-small transition-colors duration-fast ease-standard",
              s === sortierung ? "border-text bg-text text-surface" : "border-border text-text hover:border-border-strong",
            )}
          >
            {texte.sortierung[s]}
          </Link>
        ))}
      </nav>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 min-[1080px]:grid-cols-5">
        {ansicht.eintraege.map((e) => (
          <li key={e.slug} className="group flex min-w-0 flex-col gap-4">
            <div className="aspect-4/5 overflow-hidden bg-surface-sunken">
              {e.bild.art === "eigen" ? (
                <BudpicBild
                  id={e.bild.id}
                  breite={e.bild.breite}
                  hoehe={e.bild.hoehe}
                  offen={e.bild.offen}
                  alt={e.handelsname}
                  className="size-full object-contain transition-transform duration-normal ease-standard group-hover:scale-103"
                />
              ) : (
                <Bild
                  id={e.bild.id}
                  sizes="(min-width: 1080px) 20vw, (min-width: 640px) 33vw, 50vw"
                  dekorativ
                  className="size-full object-contain transition-transform duration-normal ease-standard group-hover:scale-103"
                />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Link prefetch={false} href={`/blueten/${e.slug}`} className={cn(textLinkKlassen(), "font-buch text-body wrap-break-word")}>
                {e.handelsname}
              </Link>
              <p className="flex items-baseline gap-2">
                <span className="sr-only">{t(texte.registerNote, { note: formatiereZahl(e.note, 1, sprache) })}</span>
                <span aria-hidden="true" className="numeric text-h2 text-text">
                  {formatiereZahl(e.note, 1, sprache)}
                </span>
                <span className="text-caption text-text-muted numeric">{formatiereDatum(e.datum, sprache)}</span>
              </p>
              <p className="text-small text-text-muted">
                {e.community
                  ? t(texte.registerCommunity, { note: formatiereZahl(e.community.mittel, 1, sprache), anzahl: e.community.anzahl })
                  : texte.registerOhneCommunity}
              </p>
              {e.abstand !== null ? (
                <p className="text-small text-text numeric">
                  {t(texte.registerAbstand, {
                    wert: `${e.abstand > 0 ? "+" : e.abstand < 0 ? "−" : ""}${formatiereZahl(Math.abs(e.abstand), 1, sprache)}`,
                  })}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {!alle && ansicht.gesamt > ansicht.eintraege.length ? (
        <Link prefetch={false} scroll={false} href={ziel(sortierung, true)} className={cn(textLinkKlassen(), "self-start")}>
          {t(texte.registerAlle, { anzahl: ansicht.gesamt })}
        </Link>
      ) : null}
    </div>
  );
}
```

`textLinkKlassen` heißt im Projekt so (`components/ui/textlink.ts`); falls der Export anders heißt, `grep -n "export" components/ui/textlink.ts` und anpassen. `group-hover:scale-103` und `aspect-4/5` sind Tailwind-4-Werte; `duration-normal` und `ease-standard` sind Tokens. Kein Link-Text darf ein Geviertstrich sein. Das Minus `−` ist kein Gedankenstrich.

- [ ] **Step 5: Tests, tsc, eslint**

Run: `npx tsx --test tests/bewertungs-register.test.ts tests/profil.test.ts && npx tsc --noEmit -p . && npx eslint lib/bewertungs-register.ts lib/query/profil.ts lib/profil-typen.ts components/profil/BewertungsRegister.tsx`
Expected: PASS, keine Befunde.

- [ ] **Step 6: Commit**

```bash
git add lib/profil-typen.ts lib/query/profil.ts lib/bewertungs-register.ts components/profil/BewertungsRegister.tsx tests/bewertungs-register.test.ts
git commit -m "feat: Register deiner Bewertungen mit Bildern, sortierbar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4 (Strang C): Konto: Umfrage jetzt, Meine Stimmen, Randnotizen

**Files:**
- Create: `lib/konto.ts`, `lib/query/konto.ts`
- Create: `components/mitglied/UmfrageJetzt.tsx`, `components/mitglied/MeineStimmen.tsx`
- Test: `tests/konto.test.ts`

**Interfaces:**
- Consumes: `UmfrageAnsicht` (`lib/query/umfragen.ts`), `UmfragePhase` (`db/enums.ts`), `ersatzBildId`, `Bild`, `Badge`, `buttonKlassen`, `textLinkKlassen`, `Randnotiz`, Texte `w.mitglied.kapitel.*`, `w.mitglied.umfrage*`, `w.mitglied.stimmen*`, `w.mitglied.ausgang.*`, `w.umfrage.phasen` (vorhanden), `formatiereDatum`, `t`.
- Produces in `lib/konto.ts`:
  - `type Ausgang = "laeuft" | "gewonnen" | "nichtGewonnen"`
  - `stimmAusgang(phase: UmfragePhase, istGewinner: boolean): Ausgang`
  - `type StimmZeile = { umfrageId: string; rundentitel: string; phase: UmfragePhase; abgegebenAm: Date; slug: string; handelsname: string; bildPfad: string | null; istGewinner: boolean; ergebnisReviewId: string | null }`
  - `kontoNotizen(e: { dabeiSeit: Date; stimmen: number; gewonnen: number; vorgeschlagen: number; ungelesen: number }, texte: Woerterbuch["mitglied"]["kapitel"]): Randnotiz[]` (immer fünf)
- Produces in `lib/query/konto.ts`:
  - `MEINE_STIMMEN = 10`
  - `ladeStimmen(mitgliedId: string): Promise<StimmZeile[]>`
  - `stimmZahlen(mitgliedId: string): Promise<{ stimmen: number; gewonnen: number }>`
- Produces Komponenten:
  - `UmfrageJetzt(props: { umfrage: UmfrageAnsicht | null; eigeneOptionId: string | null; freigegeben: boolean; texte: Woerterbuch["mitglied"]; phasen: Woerterbuch["umfrage"]["phasen"]; sprache: Sprache })`
  - `MeineStimmen(props: { stimmen: readonly StimmZeile[]; texte: Woerterbuch["mitglied"]; sprache: Sprache })`

Vorab prüfen: `grep -n "phasen" lib/i18n/de.ts` zeigt den Pfad von `phasen` (Abschnitt `umfrage`, Zeile ~577). Steht er tiefer verschachtelt, den Prop-Typ entsprechend (`Woerterbuch["umfrage"]["…"]["phasen"]`) setzen. Die Seite der laufenden Runde: `grep -rn "href=\"/umfragen" components app | head` zeigt, ob Runden unter `/umfragen` oder `/umfragen/<id>` stehen; der Link „Zur Abstimmung“ zeigt dorthin.

- [ ] **Step 1: Failing Tests**

```ts
// tests/konto.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { MeineStimmen } from "@/components/mitglied/MeineStimmen";
import { UmfrageJetzt } from "@/components/mitglied/UmfrageJetzt";
import { de } from "@/lib/i18n/de";
import { kontoNotizen, stimmAusgang, type StimmZeile } from "@/lib/konto";
import type { UmfrageAnsicht } from "@/lib/query/umfragen";

test("stimmAusgang", () => {
  assert.equal(stimmAusgang("VORSCHLAG", false), "laeuft");
  assert.equal(stimmAusgang("ABSTIMMUNG", true), "laeuft");
  assert.equal(stimmAusgang("BEENDET", true), "gewonnen");
  assert.equal(stimmAusgang("BEENDET", false), "nichtGewonnen");
});

test("kontoNotizen: fünf, auch mit Nullen; Jahr als Zahl", () => {
  const n = kontoNotizen(
    { dabeiSeit: new Date("2025-03-01T00:00:00Z"), stimmen: 0, gewonnen: 0, vorgeschlagen: 0, ungelesen: 0 },
    de.mitglied.kapitel,
  );
  assert.deepEqual(n.map((x) => x.zahl), ["2025", "0", "0", "0", "0"]);
  assert.deepEqual(n.map((x) => x.wort), ["dabei seit", "gestimmt", "getroffen", "vorgeschlagen", "neu"]);
  assert.equal(n[1].satz, "0 Stimmen abgegeben");
});

const umfrage = (phase: UmfrageAnsicht["phase"]): UmfrageAnsicht => ({
  id: "u1",
  titel: "Runde Oktober",
  beschreibung: null,
  phase,
  startAm: new Date("2026-10-01T00:00:00Z"),
  vorschlagBisAm: new Date("2026-10-10T00:00:00Z"),
  endetAm: null,
  communityPlaetze: 2,
  optionen: [
    { id: "o1", strainId: "s1", handelsname: "Sorte Eins", slug: "sorte-eins", reihenfolge: 1, herkunft: "COMMUNITY", istGewinner: false, stimmen: 3, ergebnisReviewId: null },
  ],
  stimmenGesamt: 3,
});

const jetzt = (p: Partial<Parameters<typeof UmfrageJetzt>[0]>) =>
  renderToStaticMarkup(
    createElement(UmfrageJetzt, {
      umfrage: umfrage("ABSTIMMUNG"),
      eigeneOptionId: null,
      freigegeben: true,
      texte: de.mitglied,
      phasen: de.umfrage.phasen,
      sprache: "de",
      ...p,
    }),
  );

test("UmfrageJetzt: ohne Stimme die Primäraktion", () => {
  const h = jetzt({});
  assert.match(h, /Du hast noch nicht abgestimmt/);
  assert.match(h, /Zur Abstimmung/);
  assert.match(h, /Abstimmung läuft/);
});

test("UmfrageJetzt: mit Stimme die Wahl gedruckt und der Vermerk von Hand", () => {
  const h = jetzt({ eigeneOptionId: "o1" });
  assert.match(h, /Sorte Eins/);
  assert.match(h, /font-hand text-vermerk[^>]*>deine Wahl/);
  assert.doesNotMatch(h, /Zur Abstimmung/);
});

test("UmfrageJetzt: nicht freigegeben ohne Primäraktion, mit Hinweis", () => {
  const h = jetzt({ freigegeben: false });
  assert.match(h, /sobald der Betreiber dein Konto freigegeben hat/);
  assert.doesNotMatch(h, /Zur Abstimmung/);
});

test("UmfrageJetzt: Vorschlagsphase mit Datum; keine Runde mit Link", () => {
  assert.match(jetzt({ umfrage: umfrage("VORSCHLAG") }), /Vorschläge bis 10\.10\.2026/);
  const h = jetzt({ umfrage: null });
  assert.match(h, /Gerade läuft keine Runde/);
  assert.match(h, /href="\/umfragen"/);
});

const s = (p: Partial<StimmZeile>): StimmZeile => ({
  umfrageId: "u1",
  rundentitel: "Runde September",
  phase: "BEENDET",
  abgegebenAm: new Date("2026-09-05T10:00:00Z"),
  slug: "sorte-eins",
  handelsname: "Sorte Eins",
  bildPfad: null,
  istGewinner: true,
  ergebnisReviewId: "r1",
  ...p,
});

test("MeineStimmen: Ausgang als Badge mit Text, Link zur Bewertung nur bei Gewinn mit Bewertung", () => {
  const h = renderToStaticMarkup(
    createElement(MeineStimmen, {
      stimmen: [s({}), s({ umfrageId: "u2", istGewinner: false, ergebnisReviewId: null }), s({ umfrageId: "u3", phase: "ABSTIMMUNG" })],
      texte: de.mitglied,
      sprache: "de",
    }),
  );
  assert.match(h, />gewonnen</);
  assert.match(h, />nicht gewonnen</);
  assert.match(h, />läuft</);
  assert.equal((h.match(/Zur Bewertung/g) ?? []).length, 1);
  assert.match(h, /wrap-break-word/);
});

test("MeineStimmen: leer mit Weg zu den Umfragen", () => {
  const h = renderToStaticMarkup(createElement(MeineStimmen, { stimmen: [], texte: de.mitglied, sprache: "de" }));
  assert.match(h, /Noch keine Stimme abgegeben/);
  assert.match(h, /href="\/umfragen"/);
});

test("lib/query/konto: Stimmen mit take, Zahlen in einer Abfrage", () => {
  const q = readFileSync("lib/query/konto.ts", "utf8");
  assert.match(q, /take:\s*MEINE_STIMMEN/);
  assert.match(q, /SUM\(/);
  assert.match(q, /COUNT\(\*\)/);
});
```

Run: `npx tsx --test tests/konto.test.ts`
Expected: FAIL.

- [ ] **Step 2: `lib/konto.ts`**

```ts
import type { Randnotiz } from "@/components/kapitel/Randnotizen";
import type { UmfragePhase } from "@/db/enums";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";

export type Ausgang = "laeuft" | "gewonnen" | "nichtGewonnen";

/** Was aus einer Stimme wurde (Spec 7): Gewinner stehen erst mit BEENDET fest. */
export function stimmAusgang(phase: UmfragePhase, istGewinner: boolean): Ausgang {
  if (phase !== "BEENDET") return "laeuft";
  return istGewinner ? "gewonnen" : "nichtGewonnen";
}

export type StimmZeile = {
  umfrageId: string;
  rundentitel: string;
  phase: UmfragePhase;
  abgegebenAm: Date;
  slug: string;
  handelsname: string;
  bildPfad: string | null;
  istGewinner: boolean;
  ergebnisReviewId: string | null;
};

/** Die Randnotizen des Kontos (Spec 5), immer fünf, auch mit Nullen. */
export function kontoNotizen(
  e: { dabeiSeit: Date; stimmen: number; gewonnen: number; vorgeschlagen: number; ungelesen: number },
  texte: Woerterbuch["mitglied"]["kapitel"],
): Randnotiz[] {
  const jahr = String(e.dabeiSeit.getUTCFullYear());
  return [
    { zahl: jahr, wort: texte.dabei, satz: t(texte.srDabei, { zahl: jahr }) },
    { zahl: String(e.stimmen), wort: texte.gestimmt, satz: t(texte.srGestimmt, { zahl: e.stimmen }) },
    { zahl: String(e.gewonnen), wort: texte.getroffen, satz: t(texte.srGetroffen, { zahl: e.gewonnen }) },
    { zahl: String(e.vorgeschlagen), wort: texte.vorgeschlagen, satz: t(texte.srVorgeschlagen, { zahl: e.vorgeschlagen }) },
    { zahl: String(e.ungelesen), wort: texte.neu, satz: t(texte.srNeu, { zahl: e.ungelesen }) },
  ];
}
```

- [ ] **Step 3: `lib/query/konto.ts`**

```ts
import { istUmfragePhase } from "@/db/enums";
import { getPrisma } from "@/lib/db";
import type { StimmZeile } from "@/lib/konto";

/** So viele Runden zeigt „Deine Stimmen“ (Spec 7). */
export const MEINE_STIMMEN = 10;

/** Deine letzten Stimmen mit Sorte, Runde und Ausgang, eine Abfrage (Spec 7). */
export async function ladeStimmen(mitgliedId: string): Promise<StimmZeile[]> {
  const prisma = await getPrisma();
  const zeilen = await prisma.stimme.findMany({
    where: { mitgliedId },
    orderBy: { abgegebenAm: "desc" },
    take: MEINE_STIMMEN,
    select: {
      umfrageId: true,
      abgegebenAm: true,
      umfrage: { select: { titel: true, phase: true } },
      option: {
        select: {
          istGewinner: true,
          ergebnisReviewId: true,
          strain: { select: { slug: true, handelsname: true, herstellerBildPfad: true } },
        },
      },
    },
  });
  return zeilen.map((z) => ({
    umfrageId: z.umfrageId,
    rundentitel: z.umfrage.titel,
    // Werte an den Triggern vorbei fallen auf „beendet“ statt ungeprüft durchzugehen.
    phase: istUmfragePhase(z.umfrage.phase) ? z.umfrage.phase : "BEENDET",
    abgegebenAm: z.abgegebenAm,
    slug: z.option.strain.slug,
    handelsname: z.option.strain.handelsname,
    bildPfad: z.option.strain.herstellerBildPfad,
    istGewinner: z.option.istGewinner,
    ergebnisReviewId: z.option.ergebnisReviewId,
  }));
}

/** Alle deine Stimmen und wie viele davon gewonnen haben, eine Abfrage. */
export async function stimmZahlen(mitgliedId: string): Promise<{ stimmen: number; gewonnen: number }> {
  const prisma = await getPrisma();
  const [z] = await prisma.$queryRawUnsafe<{ n: unknown; g: unknown }[]>(
    `SELECT COUNT(*) AS n, COALESCE(SUM(o.ist_gewinner), 0) AS g
     FROM stimmen s JOIN umfrage_optionen o ON o.id = s.option_id
     WHERE s.mitglied_id = ?`,
    mitgliedId,
  );
  return { stimmen: Number(z?.n) || 0, gewonnen: Number(z?.g) || 0 };
}
```

Vorab prüfen: `grep -n "istUmfragePhase\|export function ist" db/enums.ts` (gibt es den Wächter nicht, `(UMFRAGE_PHASEN as readonly string[]).includes(...)` nehmen), `grep -n "export async function getPrisma" -r lib` (Importpfad), `grep -n "@@map(\"umfrage_optionen\")\|@@map(\"stimmen\")" prisma/schema.prisma` (Tabellennamen).

- [ ] **Step 4: `UmfrageJetzt`**

```tsx
// components/mitglied/UmfrageJetzt.tsx
import Link from "next/link";

import { buttonKlassen, textLinkKlassen } from "@/components/ui";
import { formatiereDatum } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import type { UmfrageAnsicht } from "@/lib/query/umfragen";

type Props = {
  umfrage: UmfrageAnsicht | null;
  eigeneOptionId: string | null;
  freigegeben: boolean;
  texte: Woerterbuch["mitglied"];
  phasen: Woerterbuch["umfrage"]["phasen"];
  sprache: Sprache;
};

/**
 * Die Runde jetzt, als Stimmzettel (Spec 7): Phase in Klartext, deine Wahl
 * gedruckt mit Vermerk von Hand, sonst die eine Primäraktion der Seite. Ohne
 * Freigabe keine Primäraktion, sondern der Hinweis.
 */
export function UmfrageJetzt({ umfrage, eigeneOptionId, freigegeben, texte, phasen, sprache }: Props) {
  if (!umfrage) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="max-w-[68ch] text-body text-text-muted">{texte.umfrageKeine}</p>
        <Link prefetch={false} href="/umfragen" className={textLinkKlassen()}>
          {texte.zuDenUmfragen}
        </Link>
      </div>
    );
  }
  const wahl = umfrage.optionen.find((o) => o.id === eigeneOptionId) ?? null;
  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-buch text-h2 text-text wrap-break-word">{umfrage.titel}</p>
        <p className="text-small text-text-muted">
          {phasen[umfrage.phase]}
          {umfrage.phase === "VORSCHLAG" && umfrage.vorschlagBisAm ? (
            <>
              <span aria-hidden="true"> · </span>
              {t(texte.vorschlaegeBis, { datum: formatiereDatum(umfrage.vorschlagBisAm, sprache) })}
            </>
          ) : null}
        </p>
      </div>
      {umfrage.phase === "ABSTIMMUNG" && wahl ? (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <Link prefetch={false} href={`/blueten/${wahl.slug}`} className={`${textLinkKlassen()} font-buch text-h3 wrap-break-word`}>
            {wahl.handelsname}
          </Link>
          <span className="font-hand text-vermerk text-logo">{texte.deineWahl}</span>
        </div>
      ) : null}
      {umfrage.phase === "ABSTIMMUNG" && !wahl ? (
        freigegeben ? (
          <>
            <p className="text-body text-text">{texte.nochNichtGestimmt}</p>
            <Link prefetch={false} href="/umfragen" className={buttonKlassen("primary")}>
              {texte.zurAbstimmung}
            </Link>
          </>
        ) : (
          <p className="max-w-[68ch] text-body text-text-muted">{texte.stimmeErstNachFreigabe}</p>
        )
      ) : null}
      {umfrage.phase !== "ABSTIMMUNG" ? (
        <Link prefetch={false} href="/umfragen" className={textLinkKlassen()}>
          {texte.zurRunde}
        </Link>
      ) : null}
    </div>
  );
}
```

Der Mittelpunkt ` · ` ist Bestand im Projekt (Profilkopf) und kein Gedankenstrich. Stimmt der Pfad der Abstimmung nicht mit `/umfragen` überein (Vorab-Prüfung oben), den Pfad in beiden Links und im Test anpassen.

- [ ] **Step 5: `MeineStimmen`**

```tsx
// components/mitglied/MeineStimmen.tsx
import Link from "next/link";

import { Bild } from "@/components/medien/Bild";
import { Badge, textLinkKlassen } from "@/components/ui";
import { ersatzBildId } from "@/lib/bewertungsbilder";
import { formatiereDatum } from "@/lib/format";
import type { Sprache } from "@/lib/i18n/sprache-kern";
import { t } from "@/lib/i18n/text";
import type { Woerterbuch } from "@/lib/i18n/typen";
import { stimmAusgang, type Ausgang, type StimmZeile } from "@/lib/konto";

const VARIANTE: Record<Ausgang, "warning" | "success" | "neutral"> = {
  laeuft: "warning",
  gewonnen: "success",
  nichtGewonnen: "neutral",
};

/**
 * Die Schleife (Spec 7): deine Stimme, ihr Ausgang, die Bewertung daraus.
 * Ausgang als Badge mit Klartext und Formmarker, nie nur Farbe.
 */
export function MeineStimmen({ stimmen, texte, sprache }: { stimmen: readonly StimmZeile[]; texte: Woerterbuch["mitglied"]; sprache: Sprache }) {
  if (stimmen.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-body text-text-muted">{texte.stimmenLeer}</p>
        <Link prefetch={false} href="/umfragen" className={textLinkKlassen()}>
          {texte.zuDenUmfragen}
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 min-[1080px]:grid-cols-5">
      {stimmen.map((s) => {
        const ausgang = stimmAusgang(s.phase, s.istGewinner);
        return (
          <li key={s.umfrageId} className="flex min-w-0 flex-col gap-4">
            <div className="aspect-4/5 overflow-hidden bg-surface-sunken">
              <Bild id={ersatzBildId(s.bildPfad, s.slug)} sizes="(min-width: 1080px) 20vw, (min-width: 640px) 33vw, 50vw" dekorativ className="size-full object-contain" />
            </div>
            <div className="flex flex-col gap-2">
              <Badge variante={VARIANTE[ausgang]}>{texte.ausgang[ausgang]}</Badge>
              <Link prefetch={false} href={`/blueten/${s.slug}`} className={`${textLinkKlassen()} font-buch text-body wrap-break-word`}>
                {s.handelsname}
              </Link>
              <p className="text-small text-text-muted wrap-break-word">{s.rundentitel}</p>
              <p className="text-caption text-text-muted numeric">{t(texte.gestimmtAm, { datum: formatiereDatum(s.abgegebenAm, sprache) })}</p>
              {ausgang === "gewonnen" && s.ergebnisReviewId ? (
                <Link prefetch={false} href={`/blueten/${s.slug}`} className={textLinkKlassen()}>
                  {texte.zurBewertung}
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

Vorab `grep -n "BadgeVariante =" -A3 components/ui/Badge.tsx`: gibt es `warning`, `success`, `neutral`? Sonst nächstliegende vorhandene nehmen.

- [ ] **Step 6: Tests, tsc, eslint**

Run: `npx tsx --test tests/konto.test.ts && npx tsc --noEmit -p . && npx eslint lib/konto.ts lib/query/konto.ts components/mitglied/UmfrageJetzt.tsx components/mitglied/MeineStimmen.tsx && npx tsx --test tests/marke.test.ts`
Expected: PASS, keine Befunde.

- [ ] **Step 7: Commit**

```bash
git add lib/konto.ts lib/query/konto.ts components/mitglied/UmfrageJetzt.tsx components/mitglied/MeineStimmen.tsx tests/konto.test.ts
git commit -m "feat: Konto zeigt die Umfrage jetzt und deine Stimmen

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Seiten verdrahten, Regelwerk, Review, Live (Controller)

**Files:**
- Modify: `app/[lang]/profil/page.tsx`, `app/[lang]/mitglied/page.tsx`
- Modify: `tests/profil-seite.test.ts`, `tests/i18n-literale.test.ts`
- Modify: `.claude/skills/ui-design-engine.md` (Regel 1, Regel 7, Checkliste), `docs/brand/gruenes-buch.md` (Abschnitt 1 und 5)
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes alles aus Task 1 bis 4.

- [ ] **Step 1: Merge der Stränge**

```bash
git merge --no-ff <branch-strang-a> -m "merge: Strang A (Kapitel: Aktivität, Verteilung)"
git merge --no-ff <branch-strang-b> -m "merge: Strang B (Kapitel: Register)"
git merge --no-ff <branch-strang-c> -m "merge: Strang C (Kapitel: Konto)"
npm test && npx tsc --noEmit -p .
```

Expected: alle grün.

- [ ] **Step 2: Seitentest auf die neue Ordnung umstellen (failing)**

In `tests/profil-seite.test.ts` den Reihenfolge-Test ersetzen:

```ts
test("/profil: Kapitel-Reihenfolge, Raster, kein Apothekenlink", () => {
  const q = seite();
  const reihe = [
    "<Kapitelkopf",
    "<Randnotizen",
    "<ProfilNetz",
    "<TerpenRangliste",
    "<EmpfehlungsListe",
    "<NetzVerlauf",
    "<Aktivitaet",
    "<NotenVerteilung",
    "<TopFlop",
    "<Lieblingshersteller",
    "<CommunityVergleich",
    "<Schnitte",
    "<BewertungsRegister",
  ].map((s) => q.indexOf(s));
  assert.ok(reihe.every((i) => i > 0), JSON.stringify(reihe));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  assert.match(q, /<KapitelRaster/);
  assert.match(q, /<ViewTransition/);
  assert.match(q, /<Suspense/);
  assert.doesNotMatch(q, /apotheke/i);
  assert.doesNotMatch(q, /max-w-180/);
  assert.match(q, /<ProfilReiter\s+aktiv="profil"/);
});

test("/mitglied: Kapitel mit Umfrage, Stimmen, Einstellungen; ein Primärknopf", () => {
  const q = readFileSync("app/[lang]/mitglied/page.tsx", "utf8");
  const reihe = ["<Kapitelkopf", "<Randnotizen", "<UmfrageJetzt", "<MeineStimmen", "<GelesenMarkieren", "<AvatarFormular", "<ProfilFormular", "<ProfilSichtbarkeit"].map((s) =>
    q.indexOf(s),
  );
  assert.ok(reihe.every((i) => i > 0), JSON.stringify(reihe));
  assert.deepEqual([...reihe].sort((a, b) => a - b), reihe);
  assert.doesNotMatch(q, /buttonKlassen\("primary"\)/, "die Primäraktion steht nur in UmfrageJetzt");
  assert.doesNotMatch(q, /max-w-180/);
});
```

Den alten Test „/mitglied: Überschrift ist der Reiter Konto“ prüfen und anpassen: die h1 ist jetzt der Name; der Seitentitel (`generateMetadata`) bleibt `reiterKonto`. Den Test auf `generateMetadata` und `reiterKonto` umschreiben.

Run: `npx tsx --test tests/profil-seite.test.ts`
Expected: FAIL.

- [ ] **Step 3: `/profil` neu**

`app/[lang]/profil/page.tsx` vollständig ersetzen. Gerüst (Felder in der Reihenfolge der Spec, Abschnitt 6):

```tsx
import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { cache, Suspense, ViewTransition } from "react";

import { EmpfehlungsListe } from "@/components/empfehlung/EmpfehlungsListe";
import { Feld } from "@/components/kapitel/Feld";
import { FeldSkelett } from "@/components/kapitel/FeldSkelett";
import { Kapitelkopf } from "@/components/kapitel/Kapitelkopf";
import { KapitelRaster } from "@/components/kapitel/KapitelRaster";
import { Randnotizen } from "@/components/kapitel/Randnotizen";
import { Bild } from "@/components/medien/Bild";
import { Aktivitaet } from "@/components/profil/Aktivitaet";
import { BewertungsRegister } from "@/components/profil/BewertungsRegister";
import { CommunityVergleich } from "@/components/profil/CommunityVergleich";
import { Lieblingshersteller } from "@/components/profil/Lieblingshersteller";
import { NetzVerlauf } from "@/components/profil/NetzVerlauf";
import { NotenVerteilung } from "@/components/profil/NotenVerteilung";
import { ProfilNetz } from "@/components/profil/ProfilNetz";
import { ProfilReiter } from "@/components/profil/ProfilReiter";
import { Schnitte } from "@/components/profil/Schnitte";
import { TerpenRangliste } from "@/components/profil/TerpenRangliste";
import { TopFlop } from "@/components/profil/TopFlop";
import { registerAnsicht, registerParameter } from "@/lib/bewertungs-register";
import { ersatzBildId } from "@/lib/bewertungsbilder";
import { musterBildId } from "@/lib/budpics";
import { begruendungText } from "@/lib/empfehlung-text";
import { formatiereDatum } from "@/lib/format";
import { holeSprache, holeWoerterbuch } from "@/lib/i18n";
import { mehrzahl, t } from "@/lib/i18n/text";
import { aenderungsListe, netzAenderung } from "@/lib/netz-aenderung";
import { auswertungen, leereProfilWerte, noteOderErsatz } from "@/lib/profil";
import { monatsReihe, notenVerteilung, profilNotizen } from "@/lib/profil-dashboard";
import { ungeleseneAnzahl } from "@/lib/query/benachrichtigungen";
import { ladeEmpfehlungen } from "@/lib/query/empfehlungen";
import { ladeLieblingshersteller } from "@/lib/query/lieblingshersteller";
import { aktuellesProfil, ladeAuswertungsZeilen } from "@/lib/query/profil";
import { aktuellesMitglied } from "@/lib/session";
```

Datenzugriff je Aufruf geteilt über `cache()` auf Modulebene (eine Abfrage je Quelle, auch wenn mehrere Felder sie lesen):

```tsx
const profilLaden = cache((id: string) => aktuellesProfil(id).catch(oderNull<Awaited<ReturnType<typeof aktuellesProfil>>>("aktuellesProfil")));
const zeilenLaden = cache((id: string) => ladeAuswertungsZeilen(id).catch(oderNull<Awaited<ReturnType<typeof ladeAuswertungsZeilen>>>("ladeAuswertungsZeilen")));
```

`oderNull` und `oderUndefined` bleiben wie heute. Die Reihenfolge „erst Profil, dann Vorschläge“ bleibt: `ladeEmpfehlungen` läuft im Vorschläge-Feld erst nach `await profilLaden(id)`.

Seitenkörper:

```tsx
export default async function ProfilPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const mitglied = await aktuellesMitglied();
  const [w, sprache] = await Promise.all([holeWoerterbuch(), holeSprache()]);
  if (!mitglied) redirect("/anmelden?weiter=%2Fprofil");
  const texte = w.profil;
  const id = mitglied.mitgliedId;
  const register = registerParameter(await searchParams);
  const ungelesen = await ungeleseneAnzahl(id).catch(() => 0);

  return (
    <KapitelRaster>
      <ViewTransition name="kapitel-kopf">
        <Kapitelkopf
          name={mitglied.anzeigename}
          avatarId={mitglied.avatarId}
          schlagwort={texte.kapitel.schlagwort}
          ton="gruen"
          bild={<Suspense fallback={null}><KopfBild id={id} /></Suspense>}
          reiter={<ProfilReiter aktiv="profil" texte={texte} ungelesen={{ anzahl: ungelesen, text: mehrzahl(sprache, w.kopf.ungelesen, ungelesen) }} />}
        />
      </ViewTransition>
      <Suspense fallback={<FeldSkelett spalten={10} hoehe="klein" />}>
        <ViewTransition><Notizen id={id} /></ViewTransition>
      </Suspense>
      {/* Reihe 1 bis 6 nach Spec 6, je Reihe ein Suspense mit Skeletten gleicher Spalten. */}
      …
    </KapitelRaster>
  );
}
```

Je Reihe eine async Funktion in derselben Datei (`ReiheNetz`, `ReiheVorschlaege`, `ReiheAktivitaet`, `ReiheAuswertung`, `ReiheCommunity`, `ReiheRegister`), die ihre Felder als Fragment zurückgibt. Inhalte der Felder übernehmen die heutigen Karteninhalte unverändert (ProfilNetz mit `vorher` aus `verlauf.at(-2)` und `aenderung` wie heute; `netzFehlt` wie heute; EmpfehlungsListe wie heute samt Hinweiszeile). Neu:
- `KopfBild`: aus `zeilenLaden(id)` die bestbewertete Zeile (`noteOderErsatz`), Bild per `ersatzBildId(z.bildPfad, z.slug)`; ohne Zeilen `musterBildId("profil")`. `<Bild id={…} sizes="(min-width: 1080px) 35vw, 0px" dekorativ />`.
- `Notizen`: `const a = auswertungen(zeilen)`, dann `<Randnotizen beschriftung={texte.kapitel.notizenLeiste} notizen={profilNotizen({ zeilen, differenz: a.community.differenz, hersteller: new Set(zeilen.map((z) => z.hersteller).filter(Boolean)).size }, texte.kapitel, sprache)} />`; bei `zeilen === null` nichts rendern.
- Netz-Feld: `<div data-netz-erscheinen className="flex justify-center"><ProfilNetz … /></div>`, Netz höchstens `max-w-160` (640 px).
- Aktivität: `<Aktivitaet monate={monatsReihe(zeilen.map((z) => z.erstelltAm), new Date(), sprache)} texte={texte} />`.
- Verteilung: `<NotenVerteilung stufen={notenVerteilung(zeilen)} texte={texte} />`.
- Register: `<Feld id="bewertungen" spalten={10} titel={texte.registerTitel} satz={texte.registerSatz}><BewertungsRegister ansicht={registerAnsicht(zeilen, register)} sortierung={register.sortierung} alle={register.alle} texte={texte} sprache={sprache} /></Feld>`. Die Sortier-Links springen auf `#bewertungen-titel`, die h2 des Felds.

Spalten je Feld exakt nach Spec 6: Netz 6, Terpene 4, Vorschläge 6, Verlauf 4, Aktivität 10, Verteilung 3, Top/Flop 4, Hersteller 3, Community 6, Schnitte 4, Register 10. Skelette in denselben Spalten, Höhen: Netz `gross`, Register `gross`, sonst `mittel`.

Run: `npx tsx --test tests/profil-seite.test.ts && npx tsc --noEmit -p .`
Expected: PASS für `/profil`, `/mitglied` noch FAIL.

- [ ] **Step 4: `/mitglied` neu**

Gleiches Muster. Daten: `benachrichtigungenLaden`, `eigeneVorschlaege`, `aktiveUmfrage`, `ladeStimmen`, `stimmZahlen`, je mit `.catch(oderNull)`; `eigeneStimme(umfrage.id, id)` nur bei laufender Runde. Kopf: `aktion={<AbmeldeButton texte={w.auth.formular} />}`, `schlagwort={w.mitglied.kapitel.schlagwort}`, `ton="lila"`, Bild: Sorte der letzten Stimme (`ladeStimmen(id)[0]`) per `ersatzBildId`, sonst `musterBildId("konto")`. Randnotizen aus `kontoNotizen({ dabeiSeit: mitglied.erstelltAm, stimmen, gewonnen, vorgeschlagen: vorschlaege.length, ungelesen: ungelesenIds.length }, w.mitglied.kapitel)`.

Reihen nach Spec 7: Umfrage jetzt (6, `stimmzettel`) | Status (4); Meine Stimmen (10); Benachrichtigungen (6) | Meine Blüten-Vorschläge (4); Profilbild (3) | Angaben (4) | Öffentliches Profil (3); Verwaltung nur Admin (10). Inhalte von Status, Benachrichtigungen, Vorschlägen, Avatar, Angaben, Sichtbarkeit, Verwaltung unverändert aus der heutigen Seite übernehmen. Der Button „Blüte vorschlagen“ bleibt `secondary`.

Run: `npx tsx --test tests/profil-seite.test.ts && npm test && npx tsc --noEmit -p . && npx eslint app/[lang]/profil/page.tsx app/[lang]/mitglied/page.tsx && npm run farben`
Expected: alles grün.

- [ ] **Step 5: i18n-Wächter**

In `tests/i18n-literale.test.ts` in `UMGESTELLT` ergänzen:

```ts
  // Kapitel Profil und Konto (Spec 2026-10-08)
  "components/kapitel/Feld.tsx",
  "components/kapitel/FeldSkelett.tsx",
  "components/kapitel/KapitelRaster.tsx",
  "components/kapitel/Kapitelkopf.tsx",
  "components/kapitel/Randnotizen.tsx",
  "components/profil/Aktivitaet.tsx",
  "components/profil/NotenVerteilung.tsx",
  "components/profil/BewertungsRegister.tsx",
  "components/mitglied/UmfrageJetzt.tsx",
  "components/mitglied/MeineStimmen.tsx",
```

Run: `npx tsx --test tests/i18n-literale.test.ts`
Expected: PASS.

- [ ] **Step 6: Regelwerk und Brand nachführen**

`.claude/skills/ui-design-engine.md` Regel 1, Liste „Nur, wo die Community spricht“, ergänzen um: „seit 2026-10-08 (Nutzer, Spec Profil und Konto 11) die Randnotizen im Kapitelkopf von `/profil` und `/mitglied` und der Vermerk ‚deine Wahl‘ am Stimmzettel im Konto“. Regel 7 ergänzen: „Profil und Konto bewegen sich nur per CSS (`.kapitel-*`, `[data-feld]`, `[data-saeule]`, `[data-balken]`, `[data-netz-erscheinen]` in `globals.css`), Seitenwechsel zwischen den Reitern per `<ViewTransition name=\"kapitel-kopf\">`.“ Regel 2 oder 5 ergänzen: „Feldbuch-Raster und Schlagwort stehen seit 2026-10-08 auch auf `/profil` und `/mitglied` (Kapitel).“ In `docs/brand/gruenes-buch.md` Abschnitt 1 einen Satz zur Randnotiz im Kapitel, Abschnitt 5 „Feldbuch-Raster hinter der Startseite und hinter deinem Kapitel (Profil, Konto)“.

- [ ] **Step 7: Gesamtreview**

Ein frischer Reviewer (Opus) über den Diff seit dem Spec-Commit mit Skill `superpowers:requesting-code-review` und zusätzlich `better-interface` über die geänderten UI-Dateien. Befunde der Schwere Kritisch und Wichtig beheben, mit Test, eigener Commit `fix: Review Kapitel`.

- [ ] **Step 8: Commit, Push, Build prüfen**

```bash
git add app/[lang]/profil/page.tsx app/[lang]/mitglied/page.tsx tests/profil-seite.test.ts tests/i18n-literale.test.ts .claude/skills/ui-design-engine.md docs/brand/gruenes-buch.md
git commit -m "feat: Profil und Konto als dein Kapitel im Grünen Buch

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push origin main
```

Kommt kein Workers Build an (HANDOFF, Lehre Deploy), über die Cloudflare-API manuell starten (voller Commit-Hash).

- [ ] **Step 9: Live prüfen**

Chrome im Vordergrund (sonst laufen keine Animationen und Screenshots scheitern). Als Betreiber angemeldet:
- `/profil` bei 1440, 1080, 1024 und 390 px (390 per Iframe gleicher Herkunft), hell und dunkel: Raster deckt sich mit den Feldkanten, kein Seitenüberlauf (`document.documentElement.scrollWidth <= innerWidth`), Name und Reiter bei 390 × 700 ohne Scrollen sichtbar, Vorhang und Säulen beim Scrollen, Freisteller ab 1080 px.
- `?sortierung=note`, `?sortierung=abstand`, `?alle=1`, `?sortierung=xyz`.
- `/mitglied` gleiche Breiten: Stimmzettel, Stimmen, Einstellungen unten, ein gefüllter Knopf höchstens.
- Reiterwechsel: Kopf bleibt stehen.
- Reduzierte Bewegung (DevTools-Emulation per `javascript_tool` nicht möglich; per CSS-Prüfung: `getComputedStyle(feld).animationName` unter `matchMedia("(prefers-reduced-motion: reduce)")` dokumentieren als nicht geprüft, wenn nicht emulierbar).
- Tastatur: Tab durch beide Reiter, Fokus sichtbar.
- Screenshots durch `critique-visual-hierarchy`, `critique-composition`, `critique-information-density`, `critique-brand-consistency`; Befunde als Liste an den Nutzer, Kleinkram sofort beheben.

- [ ] **Step 10: HANDOFF**

`HANDOFF.md` mit Stand, Live-Ergebnis, Nicht-Geprüftem und offenen Review-Punkten aktualisieren, committen, pushen.
