# Strain of the Month (Plan B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Abstimmung läuft als fester Monatsrhythmus „Strain of the Month“: Vorschläge 1.–14., Abstimmung 15.–Monatsende, Abschluss am 1. per Cron, ein Gewinner, eigene Seite `/sotm` und Sektion am Ende der Startseite.

**Architecture:** Eine reine Kalenderfunktion sagt, was zu einem Zeitpunkt fällig ist. Ein Ausführer (`sotmTakt`) bringt die Datenbank per D1-Batch in diesen Zustand, idempotent und ohne Prisma. Er läuft in der Route `POST /api/sotm/takt`; der Cron-Handler in `worker.mjs` ruft sie über das Service-Binding `WORKER_SELF_REFERENCE`, die Seite `/sotm` ruft sie als Fallback im Browser. Die Route revalidiert danach `/`, `/sotm`, `/admin`. Die Anzeige liest eine neue Abfrage `lib/query/sotm.ts`.

**Tech Stack:** Next.js 16 App Router (Doku `node_modules/next/dist/docs/`), Cloudflare Workers + D1 (Cron Triggers), Prisma nur für Lesen in der Anzeige, Tests `node:test` + `better-sqlite3` über `npx tsx --test --test-concurrency=2`.

**Spec:** `docs/superpowers/specs/2026-10-20-startseite-sotm-design.md` (Teil B)

## Global Constraints

- Zeiten in UTC. Phase VORSCHLAG 1. 00:00 bis 14. 23:59:59.999, ABSTIMMUNG 15. 00:00 bis Monatsende, Abschluss 1. des Folgemonats 00:00.
- Monat N stimmt über den SOTM von N+1 ab; `umfragen.monat` = `JJJJ-MM` des SOTM (N+1), unique.
- Ein Gewinner: `community_plaetze = 1`. Gleichstand: kleinere `reihenfolge` (früher aufgenommen). Keine Stimmen: kein SOTM.
- Der Takt nutzt kein Prisma und keinen Next-Server-Rechenpfad außer der Route selbst; CPU-Budget Free-Plan 10 ms.
- Jeder Takt-Schritt idempotent: zweimal ausführen ergibt denselben Zustand.
- Wording „Strain of the Month“, Kopfmenü „SOTM“, nie „Sorte“/„Ware“ in neuen Texten. Texte de + en.
- Migration per `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0029_sotm_monat.sql` (Claude führt selbst aus).
- Kein lokales `next dev`/`build`; live prüfen nach Push.

## Rulings aus der Planung (vom Nutzer zu bestätigen)

1. **Kandidaten am 15.:** Hat der Betreiber bis zum 15. keinen Vorschlag übernommen, übernimmt der Takt alle Vorschläge der Runde (je Strain einmal, Reihenfolge nach erstem Vorschlag) als COMMUNITY-Optionen. Sonst bleibt es bei der Auswahl des Betreibers. Grund: ohne Kandidaten fiele jeder Monat aus.
2. **Gleichstand:** bestehende Regel `gewinnerErmitteln` (kleinere `reihenfolge`) statt Vorschlagsdatum. Die Reihenfolge entsteht beim Übernehmen, also gleichwertig zur Spec, ohne neue Abfrage.
3. **Takt ohne Geheimnis:** Die Route führt nur aus, was nach Kalender fällig ist. Ein fremder Aufruf kann nichts vorziehen. Darum kein Secret.
4. **GESETZTE Plätze:** In SOTM-Runden vergibt der Admin keine gesetzten Plätze mehr (Knopf entfällt); gezählt wird nur COMMUNITY.

## Review Focus

1. Cron läuft nicht (Ausfall): erster Aufruf von `/sotm` nach dem 1. schließt die Runde und öffnet die nächste, ohne Doppelrunde.
2. Zwei Takte gleichzeitig (Cron + Browser): Unique-Index auf `monat` und `aktiv` verhindert zweite Runde; der zweite Takt meldet „nichts zu tun“ statt 500.
3. Bestehende aktive Altrunde ohne `monat` beim ersten Takt: wird beendet (Gewinner nach Regel), dann startet die SOTM-Runde.
4. Februar, Monat mit 30 Tagen, Jahreswechsel Dezember→Januar: Phasen und `monat` stimmen.
5. Gewinner-Strain inaktiv: SOTM-Sektion zeigt ihn ohne Bewerten-Knopf, kein Absturz.

---

### Task 1: Kalender

**Skills:** lean-build, test-driven-development

**Files:**
- Create: `lib/sotm/kalender.ts`
- Test: `tests/sotm-kalender.test.ts`

**Interfaces:**
- Produces:
  - `export type SotmPhase = "VORSCHLAG" | "ABSTIMMUNG"`
  - `export function monatSchluessel(d: Date): string` → `"2026-10"`
  - `export function folgeMonat(schluessel: string): string` → `"2026-11"`, `"2026-12"`→`"2027-01"`
  - `export function sotmLage(jetzt: Date): { phase: SotmPhase; laufenderMonat: string; zielMonat: string; phaseEndet: Date }`
  - `export function resttage(jetzt: Date, ende: Date): number` (aufgerundet, min. 0)

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { folgeMonat, monatSchluessel, resttage, sotmLage } from "@/lib/sotm/kalender";

test("Monatsschlüssel und Folgemonat, auch über den Jahreswechsel", () => {
  assert.equal(monatSchluessel(new Date("2026-10-20T12:00:00Z")), "2026-10");
  assert.equal(folgeMonat("2026-10"), "2026-11");
  assert.equal(folgeMonat("2026-12"), "2027-01");
});

test("1. bis 14.: Vorschläge, Ende am 15. 00:00 UTC", () => {
  const l = sotmLage(new Date("2026-10-14T23:59:59Z"));
  assert.equal(l.phase, "VORSCHLAG");
  assert.equal(l.zielMonat, "2026-11");
  assert.equal(l.phaseEndet.toISOString(), "2026-10-15T00:00:00.000Z");
});

test("ab dem 15.: Abstimmung bis Monatsende, Februar und Dezember", () => {
  const feb = sotmLage(new Date("2027-02-15T00:00:00Z"));
  assert.equal(feb.phase, "ABSTIMMUNG");
  assert.equal(feb.phaseEndet.toISOString(), "2027-03-01T00:00:00.000Z");
  const dez = sotmLage(new Date("2026-12-31T23:00:00Z"));
  assert.equal(dez.zielMonat, "2027-01");
  assert.equal(dez.phaseEndet.toISOString(), "2027-01-01T00:00:00.000Z");
});

test("Resttage aufgerundet, nie negativ", () => {
  assert.equal(resttage(new Date("2026-10-20T12:00:00Z"), new Date("2026-11-01T00:00:00Z")), 12);
  assert.equal(resttage(new Date("2026-11-02T00:00:00Z"), new Date("2026-11-01T00:00:00Z")), 0);
});
```

- [ ] **Step 2:** `npx tsx --test --test-concurrency=2 tests/sotm-kalender.test.ts` — FAIL (Modul fehlt).

- [ ] **Step 3: Implementierung**

```ts
/** Kalender des Strain of the Month (Spec 2026-10-20, Teil B). Alles in UTC. */
export type SotmPhase = "VORSCHLAG" | "ABSTIMMUNG";

export function monatSchluessel(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function folgeMonat(schluessel: string): string {
  const [jahr, monat] = schluessel.split("-").map(Number);
  return monatSchluessel(new Date(Date.UTC(jahr, monat, 1)));
}

export function sotmLage(jetzt: Date) {
  const jahr = jetzt.getUTCFullYear();
  const monat = jetzt.getUTCMonth();
  const laufenderMonat = monatSchluessel(jetzt);
  const vorschlag = jetzt.getUTCDate() < 15;
  return {
    phase: (vorschlag ? "VORSCHLAG" : "ABSTIMMUNG") as SotmPhase,
    laufenderMonat,
    zielMonat: folgeMonat(laufenderMonat),
    phaseEndet: vorschlag ? new Date(Date.UTC(jahr, monat, 15)) : new Date(Date.UTC(jahr, monat + 1, 1)),
  };
}

export function resttage(jetzt: Date, ende: Date): number {
  return Math.max(0, Math.ceil((ende.getTime() - jetzt.getTime()) / 86_400_000));
}
```

- [ ] **Step 4:** Test — PASS.
- [ ] **Step 5:** Commit `feat(sotm): Kalender`.

---

### Task 2: Migration `monat`

**Skills:** cloudflare-d1, cloudflare:wrangler, prisma-cli, migration

**Files:**
- Create: `migrations/0029_sotm_monat.sql`
- Modify: `prisma/schema.prisma` (Modell `Umfrage`: `monat String? @unique`; Kommentar zu `vorschlagBisAm` „es gibt keinen Cron“ korrigieren)
- Test: `tests/sotm-migration.test.ts`

- [ ] **Step 1: Failing test** (Muster wie `tests/bewertungsbilder-migration.test.ts`)

```ts
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

test("0029 fügt umfragen.monat mit Unique-Index hinzu, zweimal einspielbar ist nicht nötig, einmal reicht", () => {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE umfragen (id TEXT PRIMARY KEY, titel TEXT NOT NULL, phase TEXT NOT NULL, aktiv TEXT UNIQUE)`);
  db.exec(readFileSync("migrations/0029_sotm_monat.sql", "utf8"));
  db.prepare(`INSERT INTO umfragen (id, titel, phase, aktiv, monat) VALUES ('a', 't', 'VORSCHLAG', 'AKTIV', '2026-11')`).run();
  assert.throws(() => db.prepare(`INSERT INTO umfragen (id, titel, phase, monat) VALUES ('b', 't', 'BEENDET', '2026-11')`).run(), /UNIQUE/);
  db.prepare(`INSERT INTO umfragen (id, titel, phase) VALUES ('c', 't', 'BEENDET')`).run();
  db.prepare(`INSERT INTO umfragen (id, titel, phase) VALUES ('d', 't', 'BEENDET')`).run();
});
```

- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** Migration:

```sql
-- 0029_sotm_monat (Spec 2026-10-20 Teil B). Per wrangler d1 execute --file, genau einmal.
-- Monat (JJJJ-MM) des Strain of the Month, über den diese Runde abstimmt. Altrunden: NULL.
ALTER TABLE umfragen ADD COLUMN monat TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS umfragen_monat_key ON umfragen(monat);
```

  Schema: `monat String? @unique` im Modell `Umfrage` mit `///`-Kommentar; `npx prisma generate`.
- [ ] **Step 4:** Test + `npx tsc --noEmit` — PASS. Dann remote einspielen: `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0029_sotm_monat.sql`. Expected: „Executed 2 commands“. Prüfen: `npx wrangler d1 execute cn-medcan-db --remote --command "PRAGMA table_info(umfragen)"` zeigt `monat`.
- [ ] **Step 5:** Commit `feat(sotm): Spalte umfragen.monat (Migration 0029)`.

---

### Task 3: Takt (Planer + Ausführer)

**Skills:** cloudflare-d1, edge-stack-master, test-driven-development

**Files:**
- Create: `lib/sotm/takt.ts`
- Test: `tests/sotm-takt.test.ts`

**Interfaces:**
- Consumes: `sotmLage`, `folgeMonat` (Task 1); `gewinnerErmitteln` aus `lib/umfrage-eingabe.ts`; Spalte `monat` (Task 2).
- Produces:
  - `export type SqlZiel = { alle<T>(sql: string, ...werte: unknown[]): Promise<T[]>; batch(befehle: { sql: string; werte: unknown[] }[]): Promise<void> }`
  - `export function d1Ziel(db: D1Database): SqlZiel`
  - `export type TaktErgebnis = { schritte: ("BEENDET" | "ABSTIMMUNG" | "KANDIDATEN" | "NEUE_RUNDE")[] }`
  - `export async function sotmTakt(db: SqlZiel, jetzt: Date, neueId: () => string = () => crypto.randomUUID()): Promise<TaktErgebnis>`

Ablauf von `sotmTakt` (jeder Schritt liest neu, schreibt in einem `batch`):
1. Aktive Runde lesen: `SELECT id, phase, monat FROM umfragen WHERE aktiv = 'AKTIV'`.
2. Ist eine aktive Runde da und ihr `monat` ist NULL oder `monat <= lage.laufenderMonat` (abgelaufen): Stimmen je Option zählen (`SELECT o.id, o.herkunft, o.reihenfolge, COUNT(s.id) AS stimmen FROM umfrage_optionen o LEFT JOIN stimmen s ON s.option_id = o.id WHERE o.umfrage_id = ? GROUP BY o.id`), `gewinnerErmitteln(optionen, 1)`, dann batch: `UPDATE umfrage_optionen SET ist_gewinner = 1 WHERE id IN (...)` (nur wenn Gewinner), `UPDATE umfragen SET phase='BEENDET', aktiv=NULL, endet_am=? WHERE id=? AND aktiv='AKTIV'`. Schritt `BEENDET`.
3. Keine aktive Runde und keine Runde mit `monat = lage.zielMonat`: `INSERT OR IGNORE INTO umfragen (id, titel, phase, aktiv, start_am, vorschlag_bis_am, community_plaetze, erstellt_am, monat) VALUES (?, ?, 'VORSCHLAG', 'AKTIV', ?, ?, 1, ?, ?)` mit Titel `Strain of the Month ${zielMonat}` und `vorschlag_bis_am` = 15. 00:00 − 1 ms. Schritt `NEUE_RUNDE`. Ist die neue Runde schon in ABSTIMMUNG-Zeit (Start am 15. oder später, Fallback), gleich mit Schritt 4 weiter.
4. Aktive Runde in VORSCHLAG, `lage.phase === "ABSTIMMUNG"` und `monat === lage.zielMonat`: Hat sie keine COMMUNITY-Option, Kandidaten aus `umfrage_vorschlaege` übernehmen (Ruling 1): je `strain_id` einmal, sortiert nach `MIN(erstellt_am)`, `INSERT OR IGNORE INTO umfrage_optionen (id, umfrage_id, strain_id, reihenfolge, herkunft, ist_gewinner, erstellt_am) VALUES (...,'COMMUNITY',0,?)` plus `UPDATE umfrage_vorschlaege SET uebernommen = 1 WHERE umfrage_id = ?` (Schritt `KANDIDATEN`); dann `UPDATE umfragen SET phase='ABSTIMMUNG' WHERE id=? AND phase='VORSCHLAG'` (Schritt `ABSTIMMUNG`).
5. Spaltennamen vor dem Schreiben gegen `prisma/schema.prisma` (`@map`) und `db/constraints.sql` prüfen; Datumswerte so schreiben, wie Prisma sie in D1 ablegt (in einer bestehenden Zeile nachsehen: `SELECT start_am FROM umfragen LIMIT 1` remote; ISO-Text oder Millisekunden).

- [ ] **Step 1: Failing tests** mit `better-sqlite3`. Testhilfe baut die Tabellen `umfragen`, `umfrage_optionen`, `umfrage_vorschlaege`, `stimmen` mit den Spalten aus `prisma/schema.prisma` (inkl. `monat`, Unique auf `aktiv` und `monat`) und ein `SqlZiel` über `db.prepare(...).all(...)` / `db.transaction`.

```ts
test("leer am 3. Oktober: neue Runde für November in VORSCHLAG", async () => {
  const { ziel, db } = testDb();
  const r = await sotmTakt(ziel, new Date("2026-10-03T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["NEUE_RUNDE"]);
  assert.deepEqual(db.prepare("SELECT phase, aktiv, monat, community_plaetze FROM umfragen").all(),
    [{ phase: "VORSCHLAG", aktiv: "AKTIV", monat: "2026-11", community_plaetze: 1 }]);
});

test("zweimal am selben Tag: nichts Neues", async () => {
  const { ziel } = testDb();
  await sotmTakt(ziel, new Date("2026-10-03T00:00:00Z"), ids());
  assert.deepEqual((await sotmTakt(ziel, new Date("2026-10-03T00:01:00Z"), ids())).schritte, []);
});

test("am 15. ohne übernommene Kandidaten: Vorschläge werden Optionen, Phase ABSTIMMUNG", async () => {
  const { ziel, db } = testDb();
  await sotmTakt(ziel, new Date("2026-10-03T00:00:00Z"), ids());
  vorschlag(db, "s1", "m1", "2026-10-04T00:00:00Z");
  vorschlag(db, "s2", "m2", "2026-10-05T00:00:00Z");
  vorschlag(db, "s1", "m3", "2026-10-06T00:00:00Z");
  const r = await sotmTakt(ziel, new Date("2026-10-15T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["KANDIDATEN", "ABSTIMMUNG"]);
  assert.deepEqual(db.prepare("SELECT strain_id, reihenfolge FROM umfrage_optionen ORDER BY reihenfolge").all(),
    [{ strain_id: "s1", reihenfolge: 1 }, { strain_id: "s2", reihenfolge: 2 }]);
});

test("am 1. November: Gewinner markiert, Runde beendet, Dezember-Runde offen", async () => {
  const { ziel, db } = testDb();
  /* Runde wie oben bis ABSTIMMUNG, dann je eine Stimme für s2 */
  const r = await sotmTakt(ziel, new Date("2026-11-01T00:00:00Z"), ids());
  assert.deepEqual(r.schritte, ["BEENDET", "NEUE_RUNDE"]);
  assert.equal(db.prepare("SELECT o.strain_id FROM umfrage_optionen o WHERE ist_gewinner = 1").get()?.strain_id, "s2");
  assert.equal(db.prepare("SELECT monat FROM umfragen WHERE aktiv = 'AKTIV'").get()?.monat, "2026-12");
});

test("Gleichstand: früher übernommene Option gewinnt; keine Stimmen: kein Gewinner", async () => { /* ... */ });
test("Altrunde ohne monat wird beim ersten Takt beendet", async () => { /* ... */ });
test("Cron verpasst: erster Takt am 20. November schließt Oktober-Runde, neue Dezember-Runde startet in ABSTIMMUNG", async () => { /* ... */ });
```

  Die drei letzten Tests vollständig ausschreiben (gleiche Hilfen `testDb`, `ids`, `vorschlag`, `stimme(db, optionId, mitgliedId)`).
- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:** `lib/sotm/takt.ts` nach obigem Ablauf; `d1Ziel` mappt `alle` auf `db.prepare(sql).bind(...werte).all()` → `.results`, `batch` auf `db.batch(befehle.map(...))`. Kein `import "server-only"` (Worker-Einstieg nutzt es nicht direkt, aber Tests importieren).
- [ ] **Step 4:** Tests + `npx tsc --noEmit` — PASS.
- [ ] **Step 5:** Commit `feat(sotm): Takt schließt und öffnet Runden nach Kalender`.

---

### Task 4: Route und Cron

**Skills:** cloudflare:workers-best-practices, cloudflare:wrangler, edge-stack-master

**Files:**
- Create: `app/api/sotm/takt/route.ts`
- Modify: `worker.mjs` (Handler `scheduled`)
- Modify: `wrangler.jsonc` (`"triggers": { "crons": ["0 0 1 * *", "0 0 15 * *"] }`)
- Test: `tests/sotm-cron.test.ts`

**Interfaces:**
- Consumes: `sotmTakt`, `d1Ziel` (Task 3); `getEnv()` aus `lib/cloudflare.ts`; `revalidiereSprachen`.
- Produces: `POST /api/sotm/takt` → `200 { schritte: [...] }`; bei Fehler `500 { fehler }` mit `console.error("sotm-takt", fehler)`.

- [ ] **Step 1: Failing test** (Quelltext-Prüfung)

```ts
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("Cron: zwei Termine, Handler ruft die Route über das Service-Binding", () => {
  const w = readFileSync("wrangler.jsonc", "utf8");
  assert.match(w, /"0 0 1 \* \*"/);
  assert.match(w, /"0 0 15 \* \*"/);
  const e = readFileSync("worker.mjs", "utf8");
  assert.match(e, /scheduled\s*\(/);
  assert.match(e, /WORKER_SELF_REFERENCE\.fetch\([^)]*\/api\/sotm\/takt/);
});

test("Route revalidiert Start, SOTM und Admin nur bei Änderung", () => {
  const r = readFileSync("app/api/sotm/takt/route.ts", "utf8");
  assert.match(r, /export async function POST/);
  assert.match(r, /schritte\.length > 0/);
  for (const p of ['"/"', '"/sotm"', '"/admin"']) assert.ok(r.includes(`revalidiereSprachen(${p}`), p);
});
```

- [ ] **Step 2:** FAIL bestätigen.
- [ ] **Step 3:**
  - Route:

```ts
import { NextResponse } from "next/server";

import { getEnv } from "@/lib/cloudflare";
import { revalidiereSprachen } from "@/lib/i18n/revalidiere";
import { d1Ziel, sotmTakt } from "@/lib/sotm/takt";

/** Takt des Strain of the Month: Cron (worker.mjs) und Fallback von /sotm. Führt nur Fälliges aus. */
export async function POST() {
  try {
    const { DB } = await getEnv();
    const { schritte } = await sotmTakt(d1Ziel(DB), new Date());
    if (schritte.length > 0) {
      revalidiereSprachen("/");
      revalidiereSprachen("/sotm");
      revalidiereSprachen("/admin");
    }
    return NextResponse.json({ schritte });
  } catch (fehler) {
    console.error("sotm-takt", fehler);
    return NextResponse.json({ fehler: "Takt fehlgeschlagen" }, { status: 500 });
  }
}
```

  (Binding-Namen in `lib/cloudflare.ts` nachsehen; heißt es nicht `DB`, den echten Namen nehmen.)
  - `worker.mjs`: im Objekt `einstieg` ergänzen:

```js
  // Strain of the Month (Spec 2026-10-20 Teil B): am 1. und 15. um 00:00 UTC. Die Route führt nur Fälliges aus.
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(
      env.WORKER_SELF_REFERENCE.fetch("https://cn-medcan.intern/api/sotm/takt", { method: "POST" }).then(async (antwort) => {
        if (!antwort.ok) console.error("sotm-cron", antwort.status, await antwort.text());
      }),
    );
  },
```

  - Prüfen, ob der Passwort-Proxy (`proxy.ts`/Gate) `/api/sotm/takt` blockiert; wenn ja, Pfad freigeben wie andere öffentliche APIs.
- [ ] **Step 4:** Tests + tsc — PASS.
- [ ] **Step 5:** Commit `feat(sotm): Cron am 1. und 15. über Route /api/sotm/takt`.

---

### Task 5: Abfrage für die Anzeige

**Skills:** prisma-client-api, edge-stack-master

**Files:**
- Create: `lib/query/sotm.ts`
- Test: `tests/sotm-abfrage.test.ts`

**Interfaces:**
- Produces:
  - `export type SotmAnsicht = { monat: string; strain: { slug: string; handelsname: string; bluete: string; aktiv: boolean; bildPfad: string | null }; mitglieder: { anzahl: number; schnitt: number | null }; betreiber: { gesamtnote: number | null } | null }`
  - `export async function aktuellerSotm(jetzt?: Date): Promise<SotmAnsicht | null>` — beendete Runde mit `monat = monatSchluessel(jetzt)`, Gewinner-Option, freigegebene Reviews des Strains seit Monatsbeginn: Community-Anzahl und Schnitt `gesamtnote`, Betreiber-Review (`istRedaktionell`).
  - `export function sotmAus(roh: …): SotmAnsicht` reine Umformung, getestet ohne DB.
  - Laufende Runde liefert die bestehende `aktiveUmfrage()`.

- [ ] **Step 1: Failing test** für `sotmAus`: Schnitt auf eine Stelle, ohne Community-Reviews `schnitt: null`, ohne Betreiber `betreiber: null`, inaktiver Strain `aktiv: false`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Abfrage mit Prisma `findFirst` + `select` (inline, siehe `tests/kapitel-start-abfrage.test.ts` zur Form), `take` begrenzen, `React.cache`.
- [ ] **Step 4:** PASS + tsc.
- [ ] **Step 5:** Commit `feat(sotm): Abfrage aktueller Strain of the Month`.

---

### Task 6: Oberfläche — Sektion, Seite, Menü, Weiterleitung

**Skills:** ui-design-engine, frontend-design, better-interface, peak-end-rule, von-restorff-effect, better-writing, react-best-practices

**Files:**
- Create: `components/sotm/SotmSektion.tsx` (Server), `components/sotm/SotmTaktImBrowser.tsx` (Client, ruft einmal `POST /api/sotm/takt`, wenn `phaseEndet` in der Vergangenheit liegt, dann `router.refresh()`)
- Create: `app/[lang]/sotm/page.tsx` (Inhalt der bisherigen `app/[lang]/umfragen/page.tsx` übernehmen, oben `SotmSektion` groß)
- Delete: `app/[lang]/umfragen/page.tsx` nach Übernahme; Aktionen `app/[lang]/umfragen/aktionen.ts` nach `app/[lang]/sotm/aktionen.ts` verschieben, Importe anpassen
- Modify: `lib/alte-adressen.ts` (`/umfragen` und `/:lang/umfragen` → `/sotm`, `permanent: true`; Test `tests/alte-adressen.test.ts` ergänzen)
- Modify: `lib/navigation.ts` (`{ href: "/sotm", schluessel: "sotm" }`), `lib/i18n/de.ts`/`en.ts` (`nav.sotm: "SOTM"`, Block `sotm`)
- Modify: `app/[lang]/page.tsx` (`<Abstimmung />` → `<SotmSektion />`), `components/story/bewegung/abstimmung.ts` Selektor prüfen
- Modify: `components/admin/RundeSteuerung.tsx` (Phasen-Knopf und gesetzte Plätze raus, Hinweis „läuft nach Kalender“), `app/[lang]/admin/umfrage-aktionen.ts` (`phaseWeiterschalten`, `umfrageAnlegen`, `gesetztenPlatzVergeben` entfernen, Aufrufer anpassen)
- Modify: alle `revalidiereSprachen("/umfragen")` → `"/sotm"`
- Test: `tests/sotm-oberflaeche.test.ts`, bestehende Umfrage-Tests anpassen

Inhalt `SotmSektion` (Spec Teil B, Oberfläche):
- Kopf „Strain of the Month“, Monat lang ausgeschrieben (`Intl.DateTimeFormat(sprache, { month: "long", year: "numeric" })` auf Modulebene je Sprache).
- Mit SOTM: Bild (`SortenBild`/`bildPfad`), Name über `bluetenZeile`, „{anzahl} Mitglieder bewerten, Schnitt {schnitt}“, Betreiber-Note falls da, Knopf primary „Jetzt bewerten“ → `/blueten/{slug}#bewerten` (nur wenn `aktiv`).
- Ohne SOTM: „Diesen Monat gibt es keinen Strain of the Month.“
- Darunter laufende Runde: bestehende `UmfrageKarte` (zustand „im-browser“) und Text „Vorschläge bis {datum}, noch {tage} Tage“ bzw. „Abstimmung bis {datum}, noch {tage} Tage“ aus `sotmLage`/`resttage`.
- Startseite bleibt `force-static`; Tage-Text ist beim Bauen berechnet (bei täglicher Revalidierung genau genug).

- [ ] **Step 1: Failing tests**: Seite `/sotm` existiert, `/umfragen` leitet 301/308 weiter, Navigation nennt `/sotm`, Startseite enthält `<SotmSektion />` statt `<Abstimmung />`, `RundeSteuerung` hat keinen Phasen-Knopf, Texte de/en (`sotm.titel`, `sotm.keiner`, `sotm.jetztBewerten`, `sotm.rest.vorschlag`, `sotm.rest.abstimmung`).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Umsetzen wie oben.
- [ ] **Step 4:** Volle Suite + tsc — PASS.
- [ ] **Step 5:** Commit `feat(sotm): Seite /sotm, Sektion auf der Startseite, Menü SOTM`, push.

---

### Task 7: Live und Start der ersten Runde

**Skills:** better-interface, web-design-guidelines, cloudflare:wrangler

- [ ] Nach Deploy einmal `POST /api/sotm/takt` (per Browser-`fetch` auf der Live-Seite). Erwartet: Altrunde (falls aktiv) `BEENDET`, dann `NEUE_RUNDE` mit `monat = 2026-11` in ABSTIMMUNG (heute ist der 20.) und Kandidaten aus Vorschlägen.
- [ ] Remote prüfen: `npx wrangler d1 execute cn-medcan-db --remote --command "SELECT titel, phase, monat, aktiv FROM umfragen ORDER BY erstellt_am DESC LIMIT 3"`.
- [ ] `/sotm`, `/` (Sektion am Ende), `/umfragen` → `/sotm`, Kopfmenü „SOTM“; hell/dunkel, 390 px.
- [ ] Cron-Trigger in Cloudflare sichtbar (Observability nach dem 1.11. auf `sotm-cron`-Fehler prüfen, als HANDOFF-Punkt).
- [ ] HANDOFF aktualisieren.
