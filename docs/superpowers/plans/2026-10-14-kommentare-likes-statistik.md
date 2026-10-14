# Kommentare, Likes, Statistik und IG-Feed – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verifizierte Mitglieder liken Bewertungen, Blüten und Mitglieder (folgen) und kommentieren Bewertungen und öffentliche Profile; `/reviews` zeigt Zahlen aus dem Buch; `/api/ig-feed` liefert Cowork neue Betreiber-Reviews und Umfrage-Ergebnisse.

**Architecture:** Eine additive Migration `0023` legt `likes`, `kommentare`, `kommentar_meldungen` und `zaehler` an. Reine Logik (Prüfung, Wortfilter, Rechte, Zählerdeltas) liegt in kleinen `lib/`-Dateien mit Tests; Server-Aktionen in `app/[lang]/reaktionen/aktionen.ts` schreiben Zeile und Zähler in einem `$transaction`-Batch. Anzeigen lesen nur `zaehler`; „habe ich geliket“ lädt eine Client-Insel mit Sitzung. Statistik und Feed lesen vorberechnete Tabellen mit `LIMIT`.

**Tech Stack:** Next.js 16 App Router auf Cloudflare Workers (OpenNext), D1 über Prisma 7 (`getPrisma()`), Tests mit `tsx --test` (node:test, `assert/strict`).

**Spec:** `docs/superpowers/specs/2026-10-14-kommentare-likes-statistik-design.md` (freigegeben 2026-10-14). Strang D (IG-Feed) vom Nutzer am 2026-10-14 zusätzlich freigegeben, Hintergrund Memory `instagram-verwaltung`.

## Global Constraints

- Kommentieren, Liken, Melden nur mit `freigabeErforderlich()` aus `lib/session.ts`; Lesen für alle.
- Kommentartext: getrimmt, 1 bis 1000 Zeichen, reiner Text. Meldegrund höchstens 200 Zeichen.
- Ratenbremse: 10 Kommentare je Mitglied und Stunde.
- Melde-Schwelle: bei der **3.** Meldung `status = 'GEMELDET'`.
- Statistik: Bestbewertet/Niedrigst bewertet erst ab **3** Bewertungen; je Liste **5** Einträge.
- Zähler nie per `COUNT` im Request-Pfad; nur `zaehler` lesen.
- Private Profile: keine Pinnwand; Name privater Mitglieder ohne Profil-Link.
- HWG: keine Wirkung in Texten, Feed und Statistik; Wortfilter `lib/hwg-filter.ts`.
- Nach jeder Migration `db/constraints.sql` erneut laufen lassen; neue Wertelisten in `db/enums.ts` **und** als Trigger in `db/constraints.sql`.
- Remote-Migration spielt Claude selbst ein: `npx wrangler d1 execute cn-medcan-db --remote --file migrations/0023_kommentare_likes.sql` und `npm run db:constraints:remote` (Memory `d1-remote-nur-nutzer`).
- Kein `next dev`/`build` lokal; prüfen per `npx tsc --noEmit`, `npm test`, Push, Live-Browser (Memory `live-statt-dev`).
- Startseite mitziehen: Bewertungskarten der Startseite zeigen Like- und Kommentarzahl (Memory `startseite-mitziehen`).
- Commits enden mit `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; Push nach jedem Task auf `main`.

## Review Focus

1. Liken-Entliken in schneller Folge darf den Zähler nie unter 0 oder doppelt zählen → Test in Task 2 (`zaehlerDelta` bei P2002 und bei fehlender Zeile).
2. Ein Profil wird privat, nachdem Kommentare geschrieben wurden → Pinnwand verschwindet, Aktion `schreibeKommentar` auf dieses Profil lehnt ab → Test in Task 6.
3. Kommentar mit Umlauten/Großschreibung („HILFT bei Übelkeit“) muss der Filter fangen, „hilfreich“ und „Schmerzensgeld“-artige Teilwörter nicht → Test in Task 5.
4. Löschen einer Bewertung (Verwerfen in `/admin`) hinterlässt keine verwaisten Likes, Kommentare, Zähler → Test in Task 2 (`raeumeZielAb` erzeugt drei deleteMany) und Aufruf in Task 9.
5. Feed darf nie unfreigegebene Bewertungen, Community-Bewertungen oder offene Bilder enthalten → Test in Task 12.

## Stränge und Reihenfolge

- **F Fundament** (Task 1–2) zuerst, seriell, auf `main`.
- Danach parallel, je ein Worktree: **A Likes** (Task 3–4), **B Kommentare** (Task 5–9), **C Statistik** (Task 10–11).
- **D IG-Feed** (Task 12) ist unabhängig von F und darf sofort parallel laufen.
- Merge-Reihenfolge: D, A, B, C. Danach Task 13 (Startseite + Live-Prüfung) auf `main`.

## Dateiübersicht

| Datei | Zweck |
|---|---|
| `migrations/0023_kommentare_likes.sql` | neue Tabellen, rein additiv |
| `prisma/schema.prisma` | Modelle `Like`, `Kommentar`, `KommentarMeldung`, `Zaehler` |
| `db/enums.ts`, `db/constraints.sql` | `ZIEL_ARTEN`, `KOMMENTAR_ZIELE`, `KOMMENTAR_STATUS`, neue `BENACHRICHTIGUNG_ARTEN` |
| `lib/reaktionen.ts` | reine Hilfen: Zählerschlüssel, Deltas, `raeumeZielAb` |
| `lib/query/reaktionen.ts` | Lesen: Zähler je Ziel, eigene Likes, Kommentarlisten |
| `app/[lang]/reaktionen/aktionen.ts` | Server-Aktionen Like, Kommentar, Melden, Löschen |
| `components/reaktionen/LikeKnopf.tsx` | Client-Insel Herz + Zahl |
| `components/reaktionen/Kommentare.tsx`, `KommentarFeld.tsx` | Liste und Eingabe |
| `lib/kommentar-eingabe.ts`, `lib/hwg-filter.ts`, `lib/kommentar-rechte.ts` | reine Prüfung |
| `lib/query/buch-statistik.ts`, `components/review/BuchStatistik.tsx` | Strang C |
| `app/api/ig-feed/route.ts`, `lib/query/ig-feed.ts` | Strang D |

---

### Task 1: Migration, Schema, Wertelisten (Strang F)

Skills: cloudflare-d1, prisma-client-api, migration, edge-stack-master

**Files:**
- Create: `migrations/0023_kommentare_likes.sql`
- Modify: `prisma/schema.prisma` (Modelle anhängen, Relationen an `Mitglied`)
- Modify: `db/enums.ts` (neue Listen, `BENACHRICHTIGUNG_ARTEN` erweitern)
- Modify: `db/constraints.sql` (Trigger)
- Test: `tests/reaktionen-schema.test.ts`

**Interfaces:**
- Produces: `ZIEL_ARTEN = ["BEWERTUNG","BLUETE","MITGLIED"]`, `type ZielArt`; `KOMMENTAR_ZIELE = ["BEWERTUNG","PROFIL"]`, `type KommentarZiel`; `KOMMENTAR_STATUS = ["SICHTBAR","GEMELDET","GELOESCHT"]`, `type KommentarStatus`; `BENACHRICHTIGUNG_ARTEN` um `"LIKE","FOLGT","KOMMENTAR","KOMMENTAR_GEMELDET"`. Prisma-Delegates `prisma.like`, `prisma.kommentar`, `prisma.kommentarMeldung`, `prisma.zaehler`.

- [ ] **Step 1: Failing test**

```ts
// tests/reaktionen-schema.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ZIEL_ARTEN, KOMMENTAR_ZIELE, KOMMENTAR_STATUS, BENACHRICHTIGUNG_ARTEN } from "@/db/enums";

const lies = (p: string) => readFileSync(p, "utf8");

test("0023: vier Tabellen, rein additiv", () => {
  const sql = lies("migrations/0023_kommentare_likes.sql");
  for (const t of ["likes", "kommentare", "kommentar_meldungen", "zaehler"]) assert.match(sql, new RegExp(`CREATE TABLE "${t}"`));
  assert.doesNotMatch(sql, /DROP TABLE|d1_migrations/);
});

test("Wertelisten und Trigger stimmen überein", () => {
  assert.deepEqual([...ZIEL_ARTEN], ["BEWERTUNG", "BLUETE", "MITGLIED"]);
  assert.deepEqual([...KOMMENTAR_ZIELE], ["BEWERTUNG", "PROFIL"]);
  assert.deepEqual([...KOMMENTAR_STATUS], ["SICHTBAR", "GEMELDET", "GELOESCHT"]);
  for (const a of ["LIKE", "FOLGT", "KOMMENTAR", "KOMMENTAR_GEMELDET"]) assert.ok((BENACHRICHTIGUNG_ARTEN as readonly string[]).includes(a), a);
  const c = lies("db/constraints.sql");
  for (const t of ["likes_insert_chk", "kommentare_insert_chk", "kommentare_update_chk", "zaehler_insert_chk"]) assert.match(c, new RegExp(t));
  for (const a of ["LIKE", "FOLGT", "KOMMENTAR", "KOMMENTAR_GEMELDET"]) assert.match(c, new RegExp(`'${a}'`));
});
```

- [ ] **Step 2:** `npx tsx --test tests/reaktionen-schema.test.ts` → FAIL (Datei fehlt / Export fehlt).

- [ ] **Step 3: Migration schreiben** – Inhalt exakt wie im Spec-Abschnitt „Datenmodell“, Kopfkommentar im Stil von `0017` (`-- 0023_kommentare_likes`, Zweck, „Rein additiv“). Dazu Index `CREATE INDEX "likes_mitglied_idx" ON "likes"("mitglied_id","ziel_art");` für „was ich gemocht habe“.

- [ ] **Step 4: Schema** – an `prisma/schema.prisma` anhängen:

```prisma
/// Like eines Mitglieds auf eine Bewertung, Blüte (Kultivar) oder ein Mitglied (= folgen). Spec 2026-10-14.
model Like {
  mitgliedId String   @map("mitglied_id")
  mitglied   Mitglied @relation("LikesVon", fields: [mitgliedId], references: [id], onDelete: Cascade)
  /// Werte nach ZIEL_ARTEN in db/enums.ts.
  zielArt    String   @map("ziel_art")
  zielId     String   @map("ziel_id")
  erstelltAm DateTime @default(now()) @map("erstellt_am")

  @@id([mitgliedId, zielArt, zielId])
  @@index([zielArt, zielId], map: "likes_ziel_idx")
  @@index([mitgliedId, zielArt], map: "likes_mitglied_idx")
  @@map("likes")
}

/// Kommentar an einer Bewertung oder einer Profil-Pinnwand. Sofort sichtbar, ab 3 Meldungen ausgeblendet.
model Kommentar {
  id         String   @id @default(uuid())
  autorId    String   @map("autor_id")
  autor      Mitglied @relation("KommentareVon", fields: [autorId], references: [id], onDelete: Cascade)
  /// Werte nach KOMMENTAR_ZIELE.
  zielArt    String   @map("ziel_art")
  zielId     String   @map("ziel_id")
  text       String
  /// Werte nach KOMMENTAR_STATUS.
  status     String   @default("SICHTBAR")
  erstelltAm DateTime @default(now()) @map("erstellt_am")

  meldungen KommentarMeldung[]

  @@index([zielArt, zielId, status, erstelltAm], map: "kommentare_ziel_idx")
  @@index([autorId], map: "kommentare_autor_idx")
  @@map("kommentare")
}

model KommentarMeldung {
  kommentarId String    @map("kommentar_id")
  kommentar   Kommentar @relation(fields: [kommentarId], references: [id], onDelete: Cascade)
  mitgliedId  String    @map("mitglied_id")
  mitglied    Mitglied  @relation("MeldungenVon", fields: [mitgliedId], references: [id], onDelete: Cascade)
  grund       String?
  erstelltAm  DateTime  @default(now()) @map("erstellt_am")

  @@id([kommentarId, mitgliedId])
  @@map("kommentar_meldungen")
}

/// Vorberechnete Zähler je Ziel (CPU-Limit 10 ms). kommentare zählt nur SICHTBAR.
model Zaehler {
  zielArt    String @map("ziel_art")
  zielId     String @map("ziel_id")
  likes      Int    @default(0)
  kommentare Int    @default(0)

  @@id([zielArt, zielId])
  @@map("zaehler")
}
```

In `model Mitglied` ergänzen: `likes Like[] @relation("LikesVon")`, `kommentare Kommentar[] @relation("KommentareVon")`, `meldungen KommentarMeldung[] @relation("MeldungenVon")`. Dann `npm run db:generate`.

- [ ] **Step 5: Enums** – in `db/enums.ts` nach `BENACHRICHTIGUNG_ARTEN`:

```ts
/** Ziele eines Likes (Spec Kommentare/Likes 2026-10-14). MITGLIED liken heißt folgen. */
export const ZIEL_ARTEN = ["BEWERTUNG", "BLUETE", "MITGLIED"] as const;
export type ZielArt = (typeof ZIEL_ARTEN)[number];

/** Wo kommentiert wird: unter einer Bewertung oder auf der Pinnwand eines öffentlichen Profils. */
export const KOMMENTAR_ZIELE = ["BEWERTUNG", "PROFIL"] as const;
export type KommentarZiel = (typeof KOMMENTAR_ZIELE)[number];

export const KOMMENTAR_STATUS = ["SICHTBAR", "GEMELDET", "GELOESCHT"] as const;
export type KommentarStatus = (typeof KOMMENTAR_STATUS)[number];
```

`BENACHRICHTIGUNG_ARTEN` wird `["VORSCHLAG_FREIGEGEBEN", "VORSCHLAG_ABGELEHNT", "LIKE", "FOLGT", "KOMMENTAR", "KOMMENTAR_GEMELDET"]`.

- [ ] **Step 6: Trigger** – in `db/constraints.sql` den bestehenden `benachrichtigungen_insert_chk` um die vier Werte erweitern und neue Trigger im selben Stil (`drop trigger if exists …; create trigger … before insert … when new.x not in (…) begin select raise(abort, '…'); end;`) für `likes.ziel_art`, `kommentare.ziel_art`+`status` (insert und update), `zaehler.ziel_art` anlegen.

- [ ] **Step 7:** `npm run db:migrate:local && npm run db:constraints:local`, dann `npx tsx --test tests/reaktionen-schema.test.ts` → PASS, `npx tsc --noEmit` sauber.

- [ ] **Step 8: Remote + Commit**

```bash
npx wrangler d1 execute cn-medcan-db --remote --file migrations/0023_kommentare_likes.sql
npm run db:constraints:remote
git add migrations/0023_kommentare_likes.sql prisma/schema.prisma db/enums.ts db/constraints.sql tests/reaktionen-schema.test.ts
git commit -m "feat(reaktionen): Tabellen für Likes, Kommentare, Meldungen und Zähler"
git push origin main
```

---

### Task 2: Kernhilfen `lib/reaktionen.ts` (Strang F)

Skills: prisma-client-api, test-driven-development, edge-stack-master

**Files:**
- Create: `lib/reaktionen.ts`
- Test: `tests/reaktionen.test.ts`

**Interfaces:**
- Consumes: `ZielArt`, `KommentarZiel` aus Task 1.
- Produces:
  - `zaehlerUpsert(prisma, art: ZielArt, id: string, feld: "likes" | "kommentare", delta: 1 | -1)` → Prisma-Promise (für `$transaction([...])`), nie unter 0.
  - `kommentarZaehlerZiele(ziel: KommentarZiel, zielId: string, kultivarId: string | null): Array<{ art: ZielArt; id: string }>` – `PROFIL` → `[{MITGLIED, zielId}]`; `BEWERTUNG` → `[{BEWERTUNG, zielId}]` plus `{BLUETE, kultivarId}` wenn vorhanden.
  - `raeumeZielAb(prisma, art: ZielArt, id: string)` → Array dreier Prisma-Promises (likes, kommentare (ziel_art BEWERTUNG/PROFIL passend), zaehler).
  - `istDoppelt(e: unknown): boolean` – P2002.

- [ ] **Step 1: Failing test**

```ts
// tests/reaktionen.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { kommentarZaehlerZiele, zaehlerUpsert, raeumeZielAb, istDoppelt } from "@/lib/reaktionen";

function attrappe() {
  const rufe: Array<[string, string, unknown]> = [];
  const modell = (name: string) => new Proxy({}, { get: (_t, op: string) => (arg: unknown) => (rufe.push([name, op, arg]), Promise.resolve()) });
  return { rufe, prisma: { like: modell("like"), kommentar: modell("kommentar"), zaehler: modell("zaehler") } as never };
}

test("Kommentar an Bewertung zählt bei Bewertung und Blüte, an Profil beim Mitglied", () => {
  assert.deepEqual(kommentarZaehlerZiele("BEWERTUNG", "r1", "k1"), [{ art: "BEWERTUNG", id: "r1" }, { art: "BLUETE", id: "k1" }]);
  assert.deepEqual(kommentarZaehlerZiele("BEWERTUNG", "r1", null), [{ art: "BEWERTUNG", id: "r1" }]);
  assert.deepEqual(kommentarZaehlerZiele("PROFIL", "m1", "egal"), [{ art: "MITGLIED", id: "m1" }]);
});

test("Zähler: +1 legt an, -1 senkt nur über 0", () => {
  const { rufe, prisma } = attrappe();
  zaehlerUpsert(prisma, "BEWERTUNG", "r1", "likes", 1);
  zaehlerUpsert(prisma, "BEWERTUNG", "r1", "likes", -1);
  assert.equal(rufe[0][1], "upsert");
  assert.deepEqual((rufe[0][2] as { create: unknown }).create, { zielArt: "BEWERTUNG", zielId: "r1", likes: 1 });
  assert.equal(rufe[1][1], "updateMany");
  assert.deepEqual((rufe[1][2] as { where: unknown }).where, { zielArt: "BEWERTUNG", zielId: "r1", likes: { gt: 0 } });
});

test("Abräumen löscht Likes, Kommentare und Zähler des Ziels", () => {
  const { rufe, prisma } = attrappe();
  raeumeZielAb(prisma, "BEWERTUNG", "r1");
  assert.deepEqual(rufe.map((r) => r[0] + "." + r[1]), ["like.deleteMany", "kommentar.deleteMany", "zaehler.deleteMany"]);
  raeumeZielAb(prisma, "MITGLIED", "m1");
  assert.deepEqual((rufe[4][2] as { where: unknown }).where, { zielArt: "PROFIL", zielId: "m1" });
});

test("P2002 gilt als doppelt", () => {
  assert.equal(istDoppelt({ code: "P2002" }), true);
  assert.equal(istDoppelt(new Error("x")), false);
});
```

- [ ] **Step 2:** `npx tsx --test tests/reaktionen.test.ts` → FAIL (Modul fehlt).

- [ ] **Step 3: Implementierung**

```ts
// lib/reaktionen.ts
import type { PrismaClient } from "@prisma/client";
import type { KommentarZiel, ZielArt } from "@/db/enums";

/**
 * Reine Hilfen für Likes und Kommentare (Spec 2026-10-14). Zähler werden beim Schreiben
 * gepflegt, nie beim Lesen gezählt (CPU-Limit 10 ms). Alles hier liefert Prisma-Promises,
 * die der Aufrufer in einem $transaction-Batch bündelt.
 */
type Db = Pick<PrismaClient, "like" | "kommentar" | "zaehler">;

export function zaehlerUpsert(prisma: Db, art: ZielArt, id: string, feld: "likes" | "kommentare", delta: 1 | -1) {
  if (delta === 1) {
    return prisma.zaehler.upsert({
      where: { zielArt_zielId: { zielArt: art, zielId: id } },
      create: { zielArt: art, zielId: id, [feld]: 1 },
      update: { [feld]: { increment: 1 } },
    });
  }
  return prisma.zaehler.updateMany({ where: { zielArt: art, zielId: id, [feld]: { gt: 0 } }, data: { [feld]: { decrement: 1 } } });
}

export function kommentarZaehlerZiele(ziel: KommentarZiel, zielId: string, kultivarId: string | null): Array<{ art: ZielArt; id: string }> {
  if (ziel === "PROFIL") return [{ art: "MITGLIED", id: zielId }];
  return kultivarId ? [{ art: "BEWERTUNG", id: zielId }, { art: "BLUETE", id: kultivarId }] : [{ art: "BEWERTUNG", id: zielId }];
}

/** Polymorphe Ziele haben keinen Fremdschlüssel: wer ein Ziel löscht, räumt hiermit im selben Batch ab. */
export function raeumeZielAb(prisma: Db, art: ZielArt, id: string) {
  const kommentarZiel: KommentarZiel | null = art === "BEWERTUNG" ? "BEWERTUNG" : art === "MITGLIED" ? "PROFIL" : null;
  return [
    prisma.like.deleteMany({ where: { zielArt: art, zielId: id } }),
    prisma.kommentar.deleteMany({ where: kommentarZiel ? { zielArt: kommentarZiel, zielId: id } : { id: "__keins__" } }),
    prisma.zaehler.deleteMany({ where: { zielArt: art, zielId: id } }),
  ];
}

export function istDoppelt(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "P2002";
}
```

(Prüfe den Import-Pfad des Prisma-Typs in `lib/prisma.ts` und übernimm ihn; der generierte Client liegt unter `lib/generated`.)

- [ ] **Step 4:** Test → PASS; `npx tsc --noEmit` sauber.
- [ ] **Step 5:** Commit `feat(reaktionen): Zähler- und Abräumhilfen` und Push.

---

### Task 3: Like-Aktion und Lesen (Strang A)

Skills: react-best-practices, edge-stack-master, test-driven-development, prisma-client-api

**Files:**
- Create: `lib/like-regeln.ts`, `lib/query/reaktionen.ts`, `app/[lang]/reaktionen/aktionen.ts`
- Test: `tests/like-regeln.test.ts`

**Interfaces:**
- Consumes: `zaehlerUpsert`, `istDoppelt` (Task 2); `freigabeErforderlich` (`lib/session.ts`).
- Produces:
  - `likeErlaubt(p: { art: ZielArt; zielId: string; ichId: string; zielAutorId: string | null; oeffentlich: boolean }): "ok" | "selbst" | "weg"`
  - `zaehlerFuer(art: ZielArt, ids: string[]): Promise<Map<string, { likes: number; kommentare: number }>>` in `lib/query/reaktionen.ts`
  - `eigeneLikes(art: ZielArt, ids: string[]): Promise<Set<string>>` (leer ohne Sitzung)
  - Server-Aktion `schalteLike(art: ZielArt, zielId: string): Promise<{ ok: true; geliket: boolean; likes: number } | { ok: false; fehler: "anmelden" | "freigabe" | "selbst" | "weg" }>`
  - Server-Aktion `ladeEigeneLikes(art: ZielArt, ids: string[]): Promise<string[]>`

- [ ] **Step 1: Failing test**

```ts
// tests/like-regeln.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { likeErlaubt } from "@/lib/like-regeln";

const basis = { art: "BEWERTUNG" as const, zielId: "r1", ichId: "m1", zielAutorId: "m2", oeffentlich: true };

test("fremde, öffentliche Bewertung darf geliket werden", () => assert.equal(likeErlaubt(basis), "ok"));
test("eigene Bewertung nicht", () => assert.equal(likeErlaubt({ ...basis, zielAutorId: "m1" }), "selbst"));
test("sich selbst folgen nicht", () => assert.equal(likeErlaubt({ ...basis, art: "MITGLIED", zielId: "m1", zielAutorId: "m1" }), "selbst"));
test("unfreigegebene Bewertung oder privates Profil gilt als weg", () => assert.equal(likeErlaubt({ ...basis, oeffentlich: false }), "weg"));
test("Blüte hat keinen Autor", () => assert.equal(likeErlaubt({ ...basis, art: "BLUETE", zielAutorId: null }), "ok"));
```

- [ ] **Step 2:** Test → FAIL.
- [ ] **Step 3: `lib/like-regeln.ts`**

```ts
import type { ZielArt } from "@/db/enums";

/** Ob ein Like zulässig ist. „weg“ heißt: Ziel fehlt oder ist nicht öffentlich (Spec Fehler und Grenzen). */
export function likeErlaubt(p: { art: ZielArt; zielId: string; ichId: string; zielAutorId: string | null; oeffentlich: boolean }): "ok" | "selbst" | "weg" {
  if (!p.oeffentlich) return "weg";
  if (p.zielAutorId === p.ichId) return "selbst";
  return "ok";
}
```

- [ ] **Step 4: Lesen `lib/query/reaktionen.ts`** (`import "server-only"`): `zaehlerFuer` per `prisma.zaehler.findMany({ where: { zielArt: art, zielId: { in: ids } } })` in Map, fehlende Ids → `{likes:0,kommentare:0}`; `eigeneLikes` ruft `aktuellesMitglied()`, ohne Mitglied leeres Set, sonst `prisma.like.findMany({ where: { mitgliedId, zielArt: art, zielId: { in: ids } }, select: { zielId: true } })`. `ids` vorher auf höchstens 100 kürzen.

- [ ] **Step 5: Aktion `app/[lang]/reaktionen/aktionen.ts`** (`"use server"`): Sitzung holen (`aktuellesMitglied`; null → `anmelden`; `!freigegeben` → `freigabe`). Ziel laden je Art: `BEWERTUNG` → `prisma.review.findUnique({ select: { autorId, freigegeben } })`; `BLUETE` → `prisma.kultivar.findUnique` (öffentlich = existiert); `MITGLIED` → `prisma.mitglied.findUnique({ select: { id, profilOeffentlich } })` mit `zielAutorId = id`. `likeErlaubt` prüfen. Bestehende Zeile suchen; wenn vorhanden: `$transaction([like.delete, zaehlerUpsert(-1)])`, sonst `$transaction([like.create, zaehlerUpsert(+1)])`, `istDoppelt` → als Erfolg werten. Danach Zähler lesen und zurückgeben. Bei neuem Like Benachrichtigung `LIKE` bzw. `FOLGT` an den Inhaber, nur wenn heute keine gleiche Art mit gleichem `link` existiert (`prisma.benachrichtigung.findFirst({ where: { mitgliedId, art, link, erstelltAm: { gte: Tagesbeginn } } })`). Texte über `lib/benachrichtigung.ts` neue Funktionen `textLike(name)`, `textFolgt(name)`. Am Ende `revalidateTag("buch-statistik")`.
- [ ] **Step 6:** `npx tsx --test tests/like-regeln.test.ts` PASS, `npx tsc --noEmit` sauber.
- [ ] **Step 7:** Commit `feat(likes): Like umschalten mit Zähler und Benachrichtigung`, Push.

---

### Task 4: `LikeKnopf` und Einbau (Strang A)

Skills: ui-design-engine, better-accessibility, fitts-law, emil-design-eng, react-best-practices

**Files:**
- Create: `components/reaktionen/LikeKnopf.tsx`
- Modify: Bewertungskarte im großen Buch (`components/review/BuchDoppelseite.tsx`), Bewertungsbuch der Blütenseite (`components/review/BewertungsBuch.tsx`), Blütenkopf (`components/review/SortenKopf.tsx`), öffentliches Profil (`app/[lang]/profil/[kurzId]/page.tsx`), `/profil` neue Reihe `ReiheGemocht` in `app/[lang]/profil/profil-reihen.tsx`, `lib/i18n/de.ts` + `en.ts` (Schlüssel `reaktionen.*`)
- Test: `tests/like-knopf.test.ts`

**Interfaces:**
- Consumes: `schalteLike`, `ladeEigeneLikes` (Task 3), `zaehlerFuer` (Task 3).
- Produces: `<LikeKnopf art={ZielArt} zielId={string} anzahl={number} text={{ moegen: string; folgen: string; anmelden: string }} />` (bei `art="MITGLIED"` gilt `text.folgen`).

- [ ] **Step 1: Failing test** (Quelltextprüfung wie `tests/profil-vereint.test.ts`):

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lies = (p: string) => readFileSync(p, "utf8");

test("LikeKnopf: Client-Insel, aria-pressed, optimistisch mit Rücksprung, 44px Trefferfläche", () => {
  const q = lies("components/reaktionen/LikeKnopf.tsx");
  assert.match(q, /^"use client";/);
  assert.match(q, /aria-pressed=/);
  assert.match(q, /useOptimistic|setAnzahl\(vorher\)/);
  assert.match(q, /min-h-11/);
});

test("LikeKnopf steht an Bewertung, Blüte und öffentlichem Profil", () => {
  for (const p of ["components/review/BuchDoppelseite.tsx", "components/review/BewertungsBuch.tsx", "components/review/SortenKopf.tsx", "app/[lang]/profil/[kurzId]/page.tsx"]) assert.match(lies(p), /<LikeKnopf/, p);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Knopf**

```tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import type { ZielArt } from "@/db/enums";
import { ladeEigeneLikes, schalteLike } from "@/app/[lang]/reaktionen/aktionen";

/** Herz mit Zahl (Spec Strang A). Zahl kommt statisch aus zaehler; ob ich geliket habe, lädt die Insel nach. */
export function LikeKnopf({ art, zielId, anzahl: start, text }: { art: ZielArt; zielId: string; anzahl: number; text: { moegen: string; folgen: string; anmelden: string } }) {
  const [anzahl, setAnzahl] = useState(start);
  const [an, setAn] = useState(false);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [laeuft, starte] = useTransition();
  useEffect(() => { ladeEigeneLikes(art, [zielId]).then((ids) => setAn(ids.includes(zielId))).catch(() => {}); }, [art, zielId]);
  const klick = () => {
    const vorher = anzahl, warAn = an;
    setAn(!warAn); setAnzahl(vorher + (warAn ? -1 : 1));
    starte(async () => {
      const r = await schalteLike(art, zielId);
      if (r.ok) { setAn(r.geliket); setAnzahl(r.likes); return; }
      setAn(warAn); setAnzahl(vorher);
      setHinweis(r.fehler === "anmelden" || r.fehler === "freigabe" ? text.anmelden : null);
    });
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={klick} disabled={laeuft} aria-pressed={an}
        aria-label={art === "MITGLIED" ? text.folgen : text.moegen}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full px-3 text-small text-text-muted transition-colors duration-fast hover:text-text aria-pressed:text-accent">
        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill={an ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
        <span className="tabular-nums">{anzahl}</span>
      </button>
      {hinweis && <span role="status" className="text-small text-text-muted">{hinweis}</span>}
    </span>
  );
}
```

- [ ] **Step 4: Einbau** – an jeder genannten Stelle Zahl über `zaehlerFuer` der Elternkomponente (eine Abfrage je Seite für alle sichtbaren Ids) laden und `<LikeKnopf … text={w.reaktionen.knopf} />` neben Datum/Autor setzen; im öffentlichen Profil `art="MITGLIED"` im Profilkopf, Beschriftung „Folgen“. `/profil` neue Reihe „Gemocht und gefolgt“ (`id="gemocht"`): drei Listen aus `prisma.like.findMany({ where: { mitgliedId }, orderBy: { erstelltAm: "desc" }, take: 30 })`, gruppiert nach Art, Namen nachgeladen; Profilkopf-Notizen „Folgende“ und „Likes erhalten“ aus `zaehler` (`MITGLIED`, eigene Id) und Summe `zaehler.likes` über eigene Bewertungen (eine `aggregate`-Abfrage über `zielId in eigeneReviewIds`, gecacht wie die anderen Kopfzahlen in `app/[lang]/profil/laden.ts`). i18n-Schlüssel `reaktionen.knopf.{moegen,folgen,anmelden}`, `profil.koepfe.gemocht`, `profil.kopf.folgende`, `profil.kopf.likesErhalten` in de und en.
- [ ] **Step 5:** Tests PASS, `npm test` vollständig grün, `npx tsc --noEmit` sauber.
- [ ] **Step 6:** Commit `feat(likes): Herz an Bewertung, Blüte und Profil`, Push.

---

### Task 5: Kommentar-Eingabe und HWG-Filter (Strang B)

Skills: test-driven-development, better-writing

**Files:**
- Create: `lib/hwg-filter.ts`, `lib/kommentar-eingabe.ts`
- Test: `tests/kommentar-eingabe.test.ts`

**Interfaces:**
- Produces: `hwgTreffer(text: string): string | null` (erstes Treffer-Wort oder null); `kommentarPruefen(roh: unknown): { ok: true; text: string } | { ok: false; fehler: "leer" | "lang" | "hwg" }`; `MAX_KOMMENTAR = 1000`; `meldegrundPruefen(roh: unknown): string | null` (≤200, sonst gekürzt).

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { hwgTreffer } from "@/lib/hwg-filter";
import { kommentarPruefen, meldegrundPruefen, MAX_KOMMENTAR } from "@/lib/kommentar-eingabe";

test("Filter fängt Wirkversprechen, auch groß und mit Umlauten", () => {
  for (const s of ["Hilft bei Migräne", "HILFT BEI Übelkeit", "heilt alles", "gut gegen Schmerzen", "my go-to for anxiety", "cures insomnia", "nimm das bei Depression"]) assert.ok(hwgTreffer(s), s);
});

test("Filter lässt Aroma und Teilwörter in Ruhe", () => {
  for (const s of ["sehr hilfreich beschrieben", "riecht nach Zitrus, Diesel im Abgang", "Schmerzensgeld ist kein Thema", "Therapiehund? nein, Katze"]) assert.equal(hwgTreffer(s), null, s);
});

test("Kommentar: getrimmt, 1 bis 1000 Zeichen, HWG", () => {
  assert.deepEqual(kommentarPruefen("  schön fruchtig  "), { ok: true, text: "schön fruchtig" });
  assert.deepEqual(kommentarPruefen("   "), { ok: false, fehler: "leer" });
  assert.deepEqual(kommentarPruefen(7), { ok: false, fehler: "leer" });
  assert.deepEqual(kommentarPruefen("x".repeat(MAX_KOMMENTAR + 1)), { ok: false, fehler: "lang" });
  assert.deepEqual(kommentarPruefen("hilft bei Schlafstörung"), { ok: false, fehler: "hwg" });
});

test("Meldegrund höchstens 200 Zeichen, leer wird null", () => {
  assert.equal(meldegrundPruefen(""), null);
  assert.equal(meldegrundPruefen("a".repeat(300))?.length, 200);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: `lib/hwg-filter.ts`**

```ts
/**
 * Wortfilter gegen Heilversprechen in Kommentaren (HWG, Spec 2026-10-14). Grob mit Absicht:
 * lieber einmal zu viel ablehnen. Ganze Wörter/Wendungen, klein, Umlaute normiert.
 * „hilfreich“, „Schmerzensgeld“ oder „Therapiehund“ treffen nicht, weil Wortgrenzen gelten.
 */
const MUSTER = [
  "heilt", "heilen", "heilung", "hilft bei", "hilft gegen", "gegen schmerzen", "gegen schlafstoerung",
  "schmerzen", "schmerz", "therapie", "depression", "depressionen", "angst", "angststoerung", "schlafstoerung",
  "schlafstoerungen", "migraene", "uebelkeit", "krebs", "epilepsie", "adhs", "ptbs", "entzuendung",
  "cures", "cure", "heals", "helps with", "for pain", "pain", "anxiety", "insomnia", "depression", "nausea", "cancer", "therapy",
];

function normiere(s: string): string {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

const REGEX = MUSTER.map((m) => ({ m, r: new RegExp(`(^|[^a-z])${m.replace(/ /g, "\\s+")}($|[^a-z])`) }));

export function hwgTreffer(text: string): string | null {
  const t = normiere(text);
  return REGEX.find(({ r }) => r.test(t))?.m ?? null;
}
```

- [ ] **Step 4: `lib/kommentar-eingabe.ts`**

```ts
import { hwgTreffer } from "@/lib/hwg-filter";

export const MAX_KOMMENTAR = 1000;
export const MAX_MELDEGRUND = 200;

export function kommentarPruefen(roh: unknown): { ok: true; text: string } | { ok: false; fehler: "leer" | "lang" | "hwg" } {
  const text = typeof roh === "string" ? roh.trim() : "";
  if (!text) return { ok: false, fehler: "leer" };
  if (text.length > MAX_KOMMENTAR) return { ok: false, fehler: "lang" };
  if (hwgTreffer(text)) return { ok: false, fehler: "hwg" };
  return { ok: true, text };
}

export function meldegrundPruefen(roh: unknown): string | null {
  const t = typeof roh === "string" ? roh.trim() : "";
  return t ? t.slice(0, MAX_MELDEGRUND) : null;
}
```

- [ ] **Step 5:** PASS (bei Fehlschlag Muster/Grenzen anpassen, nicht Tests). Commit `feat(kommentare): Eingabeprüfung und HWG-Wortfilter`, Push.

---

### Task 6: Kommentar-Rechte (Strang B)

Skills: test-driven-development, security-review

**Files:**
- Create: `lib/kommentar-rechte.ts`
- Test: `tests/kommentar-rechte.test.ts`

**Interfaces:**
- Produces:
  - `darfLoeschen(p: { ichId: string; istAdmin: boolean; autorId: string; inhaberId: string }): boolean`
  - `darfSchreiben(p: { ziel: KommentarZiel; zielOeffentlich: boolean }): boolean` – `PROFIL` nur bei öffentlichem Profil, `BEWERTUNG` nur bei freigegebener.
  - `MELDE_SCHWELLE = 3`; `nachMeldung(anzahlNachher: number, status: KommentarStatus): KommentarStatus`
  - `RATE_GRENZE = 10`; `zuSchnell(anzahlLetzteStunde: number): boolean`

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { darfLoeschen, darfSchreiben, nachMeldung, zuSchnell } from "@/lib/kommentar-rechte";

const b = { ichId: "x", istAdmin: false, autorId: "a", inhaberId: "i" };
test("Löschen: Autor, Inhaber, Admin ja; Fremder nein", () => {
  assert.equal(darfLoeschen({ ...b, ichId: "a" }), true);
  assert.equal(darfLoeschen({ ...b, ichId: "i" }), true);
  assert.equal(darfLoeschen({ ...b, istAdmin: true }), true);
  assert.equal(darfLoeschen(b), false);
});
test("Schreiben nur an öffentlichem Ziel; privates Profil hat keine Pinnwand", () => {
  assert.equal(darfSchreiben({ ziel: "PROFIL", zielOeffentlich: false }), false);
  assert.equal(darfSchreiben({ ziel: "PROFIL", zielOeffentlich: true }), true);
  assert.equal(darfSchreiben({ ziel: "BEWERTUNG", zielOeffentlich: false }), false);
});
test("Dritte Meldung blendet aus, gelöscht bleibt gelöscht", () => {
  assert.equal(nachMeldung(2, "SICHTBAR"), "SICHTBAR");
  assert.equal(nachMeldung(3, "SICHTBAR"), "GEMELDET");
  assert.equal(nachMeldung(5, "GELOESCHT"), "GELOESCHT");
});
test("Ratenbremse ab dem 11. Kommentar je Stunde", () => {
  assert.equal(zuSchnell(9), false);
  assert.equal(zuSchnell(10), true);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3:**

```ts
import type { KommentarStatus, KommentarZiel } from "@/db/enums";

export const MELDE_SCHWELLE = 3;
export const RATE_GRENZE = 10;

export function darfLoeschen(p: { ichId: string; istAdmin: boolean; autorId: string; inhaberId: string }): boolean {
  return p.istAdmin || p.ichId === p.autorId || p.ichId === p.inhaberId;
}

/** Privates Profil = keine Pinnwand; unfreigegebene Bewertung = nicht öffentlich (Spec Entscheidung 4). */
export function darfSchreiben(p: { ziel: KommentarZiel; zielOeffentlich: boolean }): boolean {
  return p.zielOeffentlich;
}

export function nachMeldung(anzahlNachher: number, status: KommentarStatus): KommentarStatus {
  if (status !== "SICHTBAR") return status;
  return anzahlNachher >= MELDE_SCHWELLE ? "GEMELDET" : "SICHTBAR";
}

/** anzahlLetzteStunde = schon geschriebene; der nächste wäre der (n+1)-te. */
export function zuSchnell(anzahlLetzteStunde: number): boolean {
  return anzahlLetzteStunde >= RATE_GRENZE;
}
```

- [ ] **Step 4:** PASS. Commit `feat(kommentare): Rechte, Melde-Schwelle, Ratenbremse`, Push.

---

### Task 7: Kommentar-Aktionen und Lesen (Strang B)

Skills: edge-stack-master, prisma-client-api, security-review

**Files:**
- Create: `app/[lang]/reaktionen/kommentar-aktionen.ts` (eigene Datei, damit Strang A und B nicht kollidieren)
- Create: `lib/query/kommentare.ts`
- Modify: `lib/benachrichtigung.ts` (`textKommentar(name)`, `textKommentarGemeldet()`)
- Test: `tests/kommentar-aktionen.test.ts`

**Interfaces:**
- Consumes: Task 2, 5, 6.
- Produces:
  - `schreibeKommentar(ziel: KommentarZiel, zielId: string, text: string): Promise<{ ok: true; kommentar: KommentarAnsicht } | { ok: false; fehler: "anmelden" | "freigabe" | "leer" | "lang" | "hwg" | "schnell" | "weg" }>`
  - `loescheKommentar(id: string): Promise<{ ok: boolean }>`
  - `meldeKommentar(id: string, grund?: string): Promise<{ ok: boolean }>`
  - `adminEntscheide(id: string, wahl: "freigeben" | "loeschen"): Promise<{ ok: boolean }>` (mit `adminErforderlich()`)
  - `ladeKommentare(ziel: KommentarZiel, zielId: string, vor?: string): Promise<{ eintraege: KommentarAnsicht[]; weitere: boolean }>` – nur `SICHTBAR`, älteste zuerst, 20 je Seite, `vor` = ISO-Zeit des letzten Eintrags (Cursor).
  - `type KommentarAnsicht = { id: string; text: string; erstelltAm: string; autor: { name: string; avatarId: string | null; kurzId: string | null /* null bei privatem Profil */ }; darfLoeschen: boolean }`
  - `gemeldeteKommentare(): Promise<Array<KommentarAnsicht & { meldungen: number; gruende: string[] }>>`

- [ ] **Step 1: Failing test** (Quelltextwächter, weil Aktionen Sitzung brauchen):

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const q = () => readFileSync("app/[lang]/reaktionen/kommentar-aktionen.ts", "utf8");

test("Kommentar-Aktionen: Sitzung aus dem Server, Prüfung, Batch, Abräumen der Zähler", () => {
  const s = q();
  assert.match(s, /^"use server";/);
  assert.match(s, /kommentarPruefen\(/);
  assert.match(s, /darfSchreiben\(/);
  assert.match(s, /zuSchnell\(/);
  assert.match(s, /nachMeldung\(/);
  assert.match(s, /darfLoeschen\(/);
  assert.match(s, /adminErforderlich\(\)/);
  assert.match(s, /\$transaction\(/);
  assert.match(s, /revalidateTag\("buch-statistik"\)/);
  assert.doesNotMatch(s, /formData\.get\("autorId"\)|autorId: (?!ich\.mitgliedId)/);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementierung `schreibeKommentar`** – Reihenfolge: `aktuellesMitglied()` (null → `anmelden`, `!freigegeben` → `freigabe`); `kommentarPruefen(text)`; Ziel laden (`BEWERTUNG`: `review.findUnique({ select: { freigegeben, autorId, strain: { select: { kultivarId } } } })`, öffentlich = `freigegeben`; `PROFIL`: `mitglied.findUnique({ select: { id, profilOeffentlich } })`); `darfSchreiben`; `zuSchnell(await prisma.kommentar.count({ where: { autorId, erstelltAm: { gte: vor1h } } }))` – das eine `count` ist erlaubt, es läuft nur beim Schreiben und trifft `kommentare_autor_idx`; `$transaction([kommentar.create, ...kommentarZaehlerZiele(...).map(z => zaehlerUpsert(prisma, z.art, z.id, "kommentare", 1))])`; Benachrichtigung `KOMMENTAR` an Inhaber (Autor der Bewertung bzw. Profilinhaber), nicht bei `inhaber === ich`; `revalidateTag("buch-statistik")`.
- [ ] **Step 4: `loescheKommentar`** – Kommentar + Inhaber laden, `darfLoeschen`, `status = 'GELOESCHT'`; Zähler −1 nur, wenn vorher `SICHTBAR`. **`meldeKommentar`** – freigegeben, nicht eigener Kommentar, `kommentarMeldung.create` (`istDoppelt` → ok), Anzahl Meldungen lesen, `nachMeldung`; bei Wechsel auf `GEMELDET`: Status setzen, Zähler −1, Benachrichtigung `KOMMENTAR_GEMELDET` an alle `rolle = 'ADMIN'`. **`adminEntscheide`** – `freigeben`: Status `SICHTBAR`, Meldungen löschen, Zähler +1; `loeschen`: `GELOESCHT`. Aufräumen gelöschter Texte älter 30 Tage: `prisma.kommentar.deleteMany({ where: { status: "GELOESCHT", erstelltAm: { lt: vor30Tagen } } })` am Anfang von `gemeldeteKommentare()`.
- [ ] **Step 5: Lesen `lib/query/kommentare.ts`** – `findMany({ where: { zielArt, zielId, status: "SICHTBAR", ...(vor ? { erstelltAm: { gt: new Date(vor) } } : {}) }, orderBy: { erstelltAm: "asc" }, take: 21, select: { id, text, erstelltAm, autorId, autor: { select: { anzeigename, profilOeffentlich, kurzId, avatar: { select: { id: true } } } } } })`; 21. Eintrag → `weitere: true`; `kurzId` nur bei `profilOeffentlich`. Feldnamen des Avatars aus `lib/session.ts` übernehmen.
- [ ] **Step 6:** Test PASS, tsc sauber. Commit `feat(kommentare): schreiben, löschen, melden, Admin-Entscheid`, Push.

---

### Task 8: Kommentar-Oberfläche (Strang B)

Skills: ui-design-engine, better-accessibility, better-writing, emil-design-eng, react-best-practices

**Files:**
- Create: `components/reaktionen/Kommentare.tsx` (Client: Liste, „Mehr laden“, Löschen, Melden), `components/reaktionen/KommentarFeld.tsx` (Client: Textarea mit Zähler 0/1000, Hinweis HWG, Absenden)
- Modify: `components/review/BewertungsBuch.tsx` (unter jeder Bewertung aufklappbar „Kommentare (n)“), `components/review/BuchDoppelseite.tsx` (Link „Kommentare (n)“ zur Blütenseite `#bewertung-<id>`), `app/[lang]/profil/[kurzId]/page.tsx` (Pinnwand nur bei öffentlichem Profil), `lib/i18n/de.ts`, `lib/i18n/en.ts`, `lib/rechtliches.ts` (Absatz Kommentare/Melden in den Nutzungsbedingungen)
- Test: `tests/kommentare-ui.test.ts`

**Interfaces:**
- Consumes: Task 7.
- Produces: `<Kommentare ziel={KommentarZiel} zielId={string} anzahl={number} text={w.reaktionen.kommentare} />`.

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lies = (p: string) => readFileSync(p, "utf8");

test("Kommentarfeld: Grenze 1000, HWG-Hinweis, Fehler als Live-Region", () => {
  const f = lies("components/reaktionen/KommentarFeld.tsx");
  assert.match(f, /maxLength=\{MAX_KOMMENTAR\}/);
  assert.match(f, /role="alert"|aria-live="polite"/);
  assert.match(f, /hinweisHwg/);
});

test("Pinnwand nur bei öffentlichem Profil", () => {
  assert.match(lies("app/[lang]/profil/[kurzId]/page.tsx"), /profilOeffentlich[\s\S]{0,200}<Kommentare[\s\S]{0,80}ziel="PROFIL"/);
});

test("Bewertungen auf der Blütenseite tragen Kommentare", () => {
  assert.match(lies("components/review/BewertungsBuch.tsx"), /<Kommentare[\s\S]{0,80}ziel="BEWERTUNG"/);
});

test("Texte de und en vorhanden", () => {
  for (const p of ["lib/i18n/de.ts", "lib/i18n/en.ts"]) assert.match(lies(p), /hinweisHwg/, p);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Bauen.** Liste: `<ol>` mit Avatar (vorhandene Avatar-Komponente wie im Profilkopf), Name (Link `/profil/<kurzId>` nur wenn `kurzId`), relatives Datum über `lib/format.ts`, Text mit `whitespace-pre-line break-words`. Löschen/Melden als Textknöpfe `min-h-11`, Melden fragt per `<details>` nach optionalem Grund. Fehlertexte: `leer` „Schreib erst etwas.“, `lang` „Höchstens 1000 Zeichen.“, `hwg` „Bitte keine Aussagen über Wirkung auf Krankheiten oder Beschwerden.“, `schnell` „Kurz durchatmen: höchstens 10 Kommentare pro Stunde.“, `anmelden` „Anmelden zum Mitreden“ (Link `/anmelden`), `freigabe` „Nach der Freigabe kannst du mitreden.“, `weg` „Nicht mehr verfügbar.“ – englisch sinngemäß. Hinweis unter dem Feld (`hinweisHwg`): „Keine Wirkversprechen, keine Gesundheitsdaten anderer.“ Typografie und Abstände nach `ui-design-engine` (8px-Raster, Tokens).
- [ ] **Step 4:** Tests PASS, `npm test` grün, tsc sauber. Commit `feat(kommentare): Liste, Feld, Pinnwand`, Push.

---

### Task 9: Admin „Gemeldete Kommentare“ und Abräumen beim Löschen (Strang B)

Skills: ui-design-engine, edge-stack-master

**Files:**
- Modify: `app/[lang]/admin/page.tsx` (neuer Abschnitt `id="gemeldet-titel"`), `app/[lang]/admin/aktionen.ts` (beim Verwerfen einer Bewertung `...raeumeZielAb(prisma, "BEWERTUNG", id)` in denselben Batch), Mitglied-Löschung falls vorhanden (`raeumeZielAb(prisma, "MITGLIED", id)`)
- Test: `tests/admin-kommentare.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Admin zeigt gemeldete Kommentare mit Freigeben und Löschen", () => {
  const s = readFileSync("app/[lang]/admin/page.tsx", "utf8");
  assert.match(s, /id="gemeldet-titel"/);
  assert.match(s, /gemeldeteKommentare\(\)/);
  assert.match(s, /adminEntscheide/);
});

test("Verwerfen einer Bewertung räumt Likes, Kommentare und Zähler ab", () => {
  assert.match(readFileSync("app/[lang]/admin/aktionen.ts", "utf8"), /raeumeZielAb\(prisma, "BEWERTUNG"/);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** Abschnitt im Stil der vorhandenen `<h2 … className="text-h3 text-text">`-Abschnitte; je Eintrag Text, Autor, Zahl der Meldungen, Gründe, zwei Formulare (Freigeben sekundär, Löschen primär-destruktiv). Leer: „Nichts gemeldet.“ **Step 4:** PASS, tsc. Commit `feat(admin): gemeldete Kommentare entscheiden`, Push.

---

### Task 10: Buch-Statistik lesen (Strang C)

Skills: edge-stack-master, prisma-client-api, test-driven-development

**Files:**
- Create: `lib/buch-statistik.ts` (rein), `lib/query/buch-statistik.ts` (Lesen)
- Test: `tests/buch-statistik.test.ts`

**Interfaces:**
- Produces:
  - `type StatistikEintrag = { titel: string; href: string; wert: number }`
  - `type BuchStatistik = { meistBewertet: StatistikEintrag[]; best: StatistikEintrag[]; niedrigst: StatistikEintrag[]; bluetenKommentare: StatistikEintrag[]; bewertungenKommentare: StatistikEintrag[]; bewertungenLikes: StatistikEintrag[] }`
  - `ordneNoten(zeilen: Array<{ titel: string; href: string; mittel: number | null; anzahl: number }>, richtung: "best" | "niedrigst"): StatistikEintrag[]` (Schwelle 3, 5 Einträge, Gleichstand nach Anzahl absteigend, dann Titel)
  - `ladeBuchStatistik(): Promise<BuchStatistik>` mit `"use cache"` + `cacheTag("buch-statistik")` (vorher in `node_modules/next/dist/docs/` die aktuelle Cache-API nachlesen und die im Repo genutzte Form übernehmen).

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ordneNoten } from "@/lib/buch-statistik";

const z = (titel: string, mittel: number | null, anzahl: number) => ({ titel, href: `/blueten/${titel}`, mittel, anzahl });

test("Bestbewertet erst ab drei Bewertungen, höchstens fünf", () => {
  const r = ordneNoten([z("a", 4.9, 2), z("b", 4.5, 3), z("c", 4.1, 7), z("d", 3, 3), z("e", 2, 4), z("f", 1, 5), z("g", 4.5, 9)], "best");
  assert.deepEqual(r.map((e) => e.titel), ["g", "b", "c", "d", "e"]);
});

test("Niedrigst bewertet dreht die Reihenfolge, null fällt raus", () => {
  const r = ordneNoten([z("a", 1.2, 3), z("b", null, 9), z("c", 2, 3)], "niedrigst");
  assert.deepEqual(r.map((e) => e.titel), ["a", "c"]);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** `ordneNoten` implementieren (filter `anzahl >= 3 && mittel !== null`, sortieren, `slice(0, 5)`, `wert = Math.round(mittel*10)/10`). `ladeBuchStatistik`: `prisma.kultivarKennwerte.findMany({ orderBy: { anzahl: "desc" }, take: 5, include: { kultivar: { select: { name: true } } } })` für meistBewertet; für best/niedrigst alle Kennwerte mit `anzahl >= 3` (`select` nur Name, Mittel, Anzahl) und `ordneNoten`; `prisma.zaehler.findMany({ where: { zielArt: "BLUETE", kommentare: { gt: 0 } }, orderBy: { kommentare: "desc" }, take: 5 })`, dito `BEWERTUNG` nach `kommentare` und nach `likes`; Namen per `findMany({ where: { id: { in } } })` nachladen; Bewertungen nur `freigegeben`. Href der Blüte: Slug des ersten Strains des Kultivars (wie in `lib/query/vertreiber-beispiel.ts` gelöst übernehmen), Bewertung: `/blueten/<slug>#bewertung-<id>`.
- [ ] **Step 4:** PASS, tsc. Commit `feat(statistik): Zahlen aus dem Buch vorberechnet lesen`, Push.

---

### Task 11: Abschnitt „Zahlen aus dem Buch“ in `/reviews` (Strang C)

Skills: ui-design-engine, better-typography, better-layout, law-of-common-region, dataviz

**Files:**
- Create: `components/review/BuchStatistik.tsx`
- Modify: `app/[lang]/reviews/seite.tsx` (zwischen `GrossesBuch` und `Ranglisten`), `lib/i18n/de.ts`, `lib/i18n/en.ts`
- Test: `tests/buch-statistik-ui.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("/reviews: Statistik zwischen Buch und Ranglisten, keine Wirkung", () => {
  const s = readFileSync("app/[lang]/reviews/seite.tsx", "utf8");
  const buch = s.indexOf("<GrossesBuch"), stat = s.indexOf("<BuchStatistik"), rang = s.indexOf("<Ranglisten");
  assert.ok(buch > 0 && stat > buch && rang > stat, `${buch} ${stat} ${rang}`);
  const k = readFileSync("components/review/BuchStatistik.tsx", "utf8");
  assert.doesNotMatch(k, /wirkung|Wirkung/);
  assert.match(k, /noch zu wenig|leer/i);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** Server-Komponente: Überschrift „Zahlen aus dem *Buch*“ (Handschrift-Wort wie „Deine *Aromen*“), sechs Karten im Raster `grid gap-6 sm:grid-cols-2 lg:grid-cols-3`, je `<ol>` mit Rang, Titel-Link, Zahl von Hand im Akzent (`font-hand text-accent`, gleiche Klasse wie die Profilkopf-Zahlen), Einheit gedruckt („Bewertungen“, „Ø“, „Kommentare“, „Likes“). Titel: „Meistbewertet“, „Am besten bewertet“, „Am niedrigsten bewertet“, „Meistkommentierte Blüten“, „Meistkommentierte Bewertungen“, „Meistgemocht“. Leere Liste: „Noch zu wenig Bewertungen.“ **Step 4:** PASS, `npm test`, tsc. Commit `feat(reviews): Zahlen aus dem Buch`, Push.

---

### Task 12: `/api/ig-feed` (Strang D, sofort parallel)

Skills: edge-stack-master, security-review, test-driven-development

**Files:**
- Create: `lib/ig-feed.ts` (rein: Abbildung), `lib/query/ig-feed.ts` (Lesen), `app/api/ig-feed/route.ts`
- Test: `tests/ig-feed.test.ts`

**Interfaces:**
- Produces: `GET /api/ig-feed` → `200 application/json`, `Cache-Control: public, max-age=900`:

```json
{
  "stand": "2026-10-14T12:00:00.000Z",
  "reviews": [{ "id": "…", "url": "https://…/blueten/<slug>", "bluete": "…", "vertreiber": "…", "charge": "…", "gesamtnote": 4.3, "aromen": ["ZITRUS","BLUMIG"], "notiz": "…", "bilder": ["https://…/api/bild/<id>"], "datum": "…" }],
  "umfragen": [{ "id": "…", "titel": "…", "beendetAm": "…", "gewinner": [{ "bluete": "…", "stimmen": 12 }], "url": "https://…/umfragen" }],
  "hinweis": "Nur Aroma, Aussehen, Charge. Keine Aussagen zur Wirkung (HWG)."
}
```

- `igReview(zeile): IgReview | null` – gibt `null`, wenn `!freigegeben || !istRedaktionell`; nimmt nur Bilder mit `status === "FREIGEGEBEN"`; lässt `wirkung` und jede Note außer `gesamtnote` weg; `notiz` wird `null`, wenn `hwgTreffer(notiz)`.

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { igReview } from "@/lib/ig-feed";

const basis = { id: "r1", slug: "s", handelsname: "Lemon", vertreiber: "Adrex", charge: "C1", gesamtnote: 4.31, aromen: ["ZITRUS"], notiz: "Zitrus vorne", bilder: [{ id: "b1", status: "FREIGEGEBEN" }, { id: "b2", status: "OFFEN" }], erstelltAm: new Date("2026-10-01"), freigegeben: true, istRedaktionell: true, wirkung: 5 };
const ursprung = "https://x.dev";

test("nur freigegebene Betreiber-Reviews", () => {
  assert.equal(igReview({ ...basis, freigegeben: false }, ursprung), null);
  assert.equal(igReview({ ...basis, istRedaktionell: false }, ursprung), null);
});

test("nur freigegebene Bilder, keine Wirkung, Note gerundet", () => {
  const r = igReview(basis, ursprung)!;
  assert.deepEqual(r.bilder, ["https://x.dev/api/bild/b1"]);
  assert.equal("wirkung" in r, false);
  assert.equal(r.gesamtnote, 4.3);
  assert.equal(r.url, "https://x.dev/blueten/s");
});

test("Notiz mit Wirkversprechen fällt weg", () => {
  assert.equal(igReview({ ...basis, notiz: "hilft bei Migräne" }, ursprung)!.notiz, null);
});
```

- [ ] **Step 2:** FAIL.
- [ ] **Step 3: `lib/ig-feed.ts`**

```ts
import { hwgTreffer } from "@/lib/hwg-filter";

/** Öffentlicher Feed für die Instagram-Pflege in Cowork (Nutzer 2026-10-14). Nur, was die Website ohnehin öffentlich zeigt. */
export type IgReviewZeile = { id: string; slug: string; handelsname: string; vertreiber: string | null; charge: string | null; gesamtnote: number | null; aromen: string[]; notiz: string | null; bilder: Array<{ id: string; status: string }>; erstelltAm: Date; freigegeben: boolean; istRedaktionell: boolean; wirkung?: number };
export type IgReview = { id: string; url: string; bluete: string; vertreiber: string | null; charge: string | null; gesamtnote: number | null; aromen: string[]; notiz: string | null; bilder: string[]; datum: string };

export function igReview(z: IgReviewZeile, ursprung: string): IgReview | null {
  if (!z.freigegeben || !z.istRedaktionell) return null;
  return {
    id: z.id,
    url: `${ursprung}/blueten/${z.slug}`,
    bluete: z.handelsname,
    vertreiber: z.vertreiber,
    charge: z.charge,
    gesamtnote: z.gesamtnote === null ? null : Math.round(z.gesamtnote * 10) / 10,
    aromen: z.aromen,
    notiz: z.notiz && !hwgTreffer(z.notiz) ? z.notiz : null,
    bilder: z.bilder.filter((b) => b.status === "FREIGEGEBEN").map((b) => `${ursprung}/api/bild/${b.id}`),
    datum: z.erstelltAm.toISOString(),
  };
}
```

Strang D braucht `lib/hwg-filter.ts` aus Task 5: Wenn D vor B läuft, legt D die Datei mit genau dem Inhalt aus Task 5 Step 3 an; B übernimmt sie dann unverändert (Merge ohne Konflikt, weil identisch).

- [ ] **Step 4: Lesen + Route.** `lib/query/ig-feed.ts`: letzte 10 `review.findMany({ where: { freigegeben: true, istRedaktionell: true }, orderBy: { erstelltAm: "desc" }, take: 10, select: … })` mit Strain (slug, handelsname, vertreiber.name), Charge-Nummer, Aromen (oberste zwei Achsen aus `geschmacksMatrix`, gleiche Logik wie `liebsteAromen` in `lib/profil-ansicht.ts`), Bildern (`budpics` mit `reviewId`); Umfragen über `beendeteRundenMitGewinnern(3)` aus `lib/query/umfragen.ts`. `app/api/ig-feed/route.ts`: `export async function GET(req: Request)`, Ursprung aus `new URL(req.url).origin`, JSON mit `Cache-Control: public, max-age=900`. Keine Sitzung, keine personenbezogenen Daten außer dem Betreiber-Namen der Seite.
- [ ] **Step 5:** PASS, tsc. Commit `feat(ig-feed): öffentlicher JSON-Feed für die Instagram-Pflege`, Push. Live: `https://cn-medcan.w-helwich.workers.dev/api/ig-feed` im Browser öffnen, JSON prüfen.

---

### Task 13: Startseite mitziehen, Gesamtprüfung, HANDOFF (nach Merge)

Skills: ui-design-engine, verification-before-completion, critique-visual-hierarchy

**Files:**
- Modify: `components/story/NeuesterEintrag.tsx` (und weitere Bewertungskarten der Startseite) – Herz-Zahl und Kommentarzahl als reine Anzeige mit Link zur Bewertung; Zahlen über die bestehende Startseiten-Abfrage (`/api/startseite`) aus `zaehler` mitliefern
- Modify: `HANDOFF.md`
- Test: `tests/startseite-reaktionen.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Startseite zeigt Likes und Kommentare an der neuesten Bewertung", () => {
  const s = readFileSync("components/story/NeuesterEintrag.tsx", "utf8");
  assert.match(s, /likes/);
  assert.match(s, /kommentare/);
});
```

- [ ] **Step 2:** FAIL. **Step 3:** Einbauen. **Step 4:** `npm test` vollständig grün, `npx tsc --noEmit` sauber, Push.
- [ ] **Step 5: Live-Prüfung** (Browser-MCP, 1440 und 390 px, hell und dunkel): Herz an Bewertung/Blüte/Profil, Zahl springt und bleibt nach Reload; Kommentar schreiben, HWG-Ablehnung („hilft bei Migräne“), löschen; Pinnwand fehlt bei privatem Profil; `/reviews` Statistik; `/api/ig-feed`; CPU in der Worker-Telemetrie.
- [ ] **Step 6:** HANDOFF aktualisieren (Commits, Live-Befund, offene Punkte), Commit `docs: HANDOFF Kommentare, Likes, Statistik, IG-Feed`, Push.
