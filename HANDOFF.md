# HANDOFF — Stand der Arbeit

> Übergabemedium zwischen Sessions. Wird nach jedem Arbeitsblock aktualisiert und committet.
> Wer hier weiterarbeitet, liest diese Datei zuerst und braucht den Chatverlauf nicht.

**Letzte Aktualisierung:** 2026-09-23
**Repo:** https://github.com/bratzi/cn-medcan (public)
**Branch:** `main`

---

## ⇢ Hier geht es weiter: Umstellung von Supabase auf Cloudflare D1

**Status: geplant, noch nicht umgesetzt.** Der Code steht aktuell auf Supabase Postgres. Die
Umstellung ist der nächste Arbeitsblock und unten in fünf Wellen zerlegt.

### Warum die Umstellung
Der Nutzer hat auf seinem Supabase-Konto zu viele Free-Projekte und will Supabase nicht nutzen.
Gewählt wurde **Cloudflare D1**, weil es keinen weiteren Account und kein weiteres Projekt
braucht — es läuft als Binding im bereits vorhandenen Cloudflare-Konto. Belegte Free-Limits:
5 GB Speicher, 5 Mio. gelesene Zeilen pro Tag, 100 000 geschriebene Zeilen pro Tag.

Neon wäre die Postgres-Alternative gewesen (100 Projekte pro Org, 0,5 GB pro Projekt), wurde aber
verworfen: neuer Account, und Suspend nach 5 Minuten Inaktivität mit Kaltstart.

### Der Punkt, der die Entscheidung tragbar macht
Ohne Supabase-Auth verliert RLS fast seinen Sinn: RLS greift nur, wenn die Verbindung eine
Nutzeridentität trägt. Prisma verbindet als Eigentümer. Die RLS-Policies waren also ausschließlich
auf dem `supabase-js`-Pfad wirksam — der mit Supabase ohnehin wegfällt. Der Verlust von RLS in
SQLite ist damit kein echter Rückschritt. Das HWG-Gate liegt in der Abfrageschicht, wo es mit
`bestandSichtbarkeit()` in `lib/query/strains.ts` schon implementiert ist. CHECK-Constraints
funktionieren in SQLite weiter und bleiben erhalten.

### Zwei belegte Eigenheiten von D1, die den Plan formen
1. **D1 unterstützt keine Transaktionen.** Prisma führt `$transaction` als Einzelabfragen aus, die
   ACID-Garantie fällt weg. Die Abfrageschicht nutzt `Promise.all`, ist also nicht betroffen. Der
   Seed darf keine Transaktionsannahme enthalten.
2. **Migrationen laufen hybrid.** `prisma migrate dev` fällt weg. Stattdessen:
   `wrangler d1 migrations create` → `prisma migrate diff --from-local-d1 --to-schema-datamodel`
   erzeugt das SQL → `wrangler d1 migrations apply --local` bzw. `--remote`.

### SQLite-Umbauten am Schema, die Folgen im ganzen Code haben
| Bisher (Postgres) | Neu (SQLite/D1) | Folge |
|---|---|---|
| `enum` (7 Stück) | `String` + TS-Union-Typ | Prisma-Enums gibt es in SQLite nicht. Die Typen wandern in eine neue Datei `db/enums.ts`. **Alle Importe von `@/lib/generated/prisma/enums` müssen umgezogen werden** — betrifft `lib/labels.ts`, `lib/query/*`, `components/produkt/*`. |
| `Decimal @db.Decimal(4,1)` | `Float` | Prozentwerte. Preise sind schon `Int` in Cent und bleiben unverändert. |
| `Json` | `String` | `geschmacksMatrix` wird als JSON-Text gespeichert. `parseGeschmacksMatrix` in `lib/query/bewertung.ts` validiert ohnehin schon — nur `JSON.parse` davorziehen. |
| `@db.Uuid`, `@db.VarChar(5)`, `@db.Date` | entfällt | `@default(uuid())` funktioniert weiter, Datumsfelder werden `DateTime`. |
| `contains` mit `mode: "insensitive"` | **nicht unterstützt** | Der Freitextfilter braucht einen Ersatz. Lösung: eine zusätzliche, kleingeschriebene Suchspalte `suchtext` am `Strain`, beim Schreiben gefüllt, und `contains` darauf mit kleingeschriebener Eingabe. Kein `LOWER()` in der Query, weil Prisma das auf SQLite nicht abbildet. |
| RLS-Policies | entfallen | `supabase/rls.sql` wird zu `db/constraints.sql` reduziert: nur die 16 CHECK-Constraints bleiben, alle `create policy` und `ist_fachkreis()` fallen. |

### Fachkreis-Nachweis ohne Supabase-Auth
Gewählt: **vorerst keine Nutzeranmeldung.** Bewertungen bleiben redaktionell (Seed, später ein
Admin-Skript). Der Fachkreis-Zugang läuft über ein **zweites Passwort** im bestehenden Gate:

- `SITE_PASSWORD` → normaler Zugang, Rolle `gast`
- `FACHKREIS_PASSWORD` → Zugang **plus** Rolle `fachkreis`, sieht Preise und Bestände

Die Rolle wird in das bereits HMAC-signierte Cookie geschrieben, also nicht manipulierbar.
`lib/gate.ts` signiert künftig `gate:<rolle>:<ablauf>`, und `lib/query/fachkreis.ts` liest die
Rolle aus dem Cookie statt aus einem Supabase-JWT.

---

## Die Umstellung in fünf Wellen

**Welle 1 — Fundament, sequenziell (alles andere hängt daran)**
1. `npm uninstall @supabase/supabase-js @supabase/ssr @prisma/adapter-pg pg @types/pg dotenv`,
   `npm install @prisma/adapter-d1`. `lib/supabase/` löschen.
2. `wrangler.jsonc`: `d1_databases`-Binding `DB` wieder aufnehmen, `database_name: "cn-medcan-db"`,
   `migrations_dir: "migrations"`. Danach `npm run cf-typegen`.
3. `prisma/schema.prisma` auf `provider = "sqlite"` umstellen, alle Umbauten aus der Tabelle oben,
   Feld `suchtext` am `Strain` ergänzen.
4. `db/enums.ts` anlegen: die sieben Wertelisten als `as const`-Arrays plus abgeleitete
   Union-Typen, dazu `istKultivarTyp()`-artige Guards für das Parsen aus der DB.
5. `prisma.config.ts`: `datasource`-Block und `dotenv`-Import entfernen, `migrations.seed`
   behalten. D1 braucht keine Verbindungs-URL.
6. `lib/prisma.ts`: `PrismaD1`-Adapter mit dem `DB`-Binding. **Wichtig:** der Client kann nicht
   mehr als Modul-Singleton entstehen, weil das Binding erst im Request-Kontext existiert.
   Also `getPrisma()` async über `getEnv()` aus `lib/cloudflare.ts`, mit Caching pro Isolate nur
   wenn das Binding identisch ist.

**Welle 2 — zwei Agents parallel**
7. `lib/query/*`: Enum-Importe umziehen, Freitextfilter auf `suchtext` umstellen,
   `lib/query/fachkreis.ts` auf das Gate-Cookie umschreiben, `parseGeschmacksMatrix` um
   `JSON.parse` erweitern, `getPrisma()`-Aufrufe auf `await` umstellen.
8. `lib/gate.ts`, `proxy.ts`, `app/zugang/page.tsx`, `app/api/zugang/route.ts`: Rolle im Token,
   zweites Passwort, ein Hinweis auf der Zugangsseite, dass es zwei Zugänge gibt.

**Welle 3 — zwei Agents parallel**
9. `lib/labels.ts` und `components/produkt/*`: Enum-Importe auf `@/db/enums` umziehen.
10. `db/constraints.sql` aus `supabase/rls.sql` ableiten (nur CHECK-Constraints),
    `supabase/` löschen, `db/README.md` mit der neuen Befehlsfolge.

**Welle 4 — sequenziell**
11. `prisma/seed.ts` anpassen: kein `dotenv`, keine Transaktionsannahme, `geschmacksMatrix` als
    JSON-String, `suchtext` mitschreiben. Seed läuft über `wrangler d1 execute` oder ein
    Node-Skript gegen die lokale D1-Datei — prüfen, was mit dem Adapter außerhalb des Workers
    funktioniert, und wenn es nicht geht, den Seed als generiertes SQL ausliefern.
12. Migration erzeugen und lokal anwenden.

**Welle 5 — die noch fehlende Seite und Verifikation**
13. `app/produkte/[slug]/page.tsx` bauen. Alle Bausteine sind fertig: `GlasHeader`, `TerpenMap`,
    `BestandTabelle`, `BewertungsListe`, `InstagramEmbed`. Aufbau: Glas-Header → Faktenblock als
    `<dl>` → `CannabinoidBar` → `TerpenChips` (alle Ränge) → `BestandTabelle` → Chargentabelle →
    `TerpenMap` mit `verdichteGeschmacksMatrix(reviews)` → `BewertungsListe`. `params` ist ein
    Promise. `generateMetadata` mit dem Handelsnamen. Hinweis auf Verschreibungspflicht.
14. `npx tsc --noEmit`, `npx eslint . --max-warnings=0`, `npx next build`, dann
    `npm run db:migrate:local` und der Seed, dann `npm run dev` gegen echte Daten.

---

## Was schon fertig ist und die Umstellung übersteht

- Scaffold, Cloudflare-Anbindung, `lib/cloudflare.ts` als einziger Binding-Zugang
- Zugangsschutz: `proxy.ts`, `lib/gate.ts`, `app/zugang/page.tsx`, `app/api/zugang/route.ts`
  (wird in Welle 2 um die Rolle erweitert, nicht ersetzt)
- Design-System: `.claude/skills/ui-design-engine.md`, Tokens in `app/globals.css`
  (Akzent: klinisches Tiefblau `oklch(0.52 0.11 240)`), 11 Primitives in `components/ui/`
- Edge-Regelwerk: `.claude/skills/edge-stack-master.md` — der Supabase-Abschnitt darin muss auf
  D1 umgeschrieben werden
- Produktkomponenten: `ProduktCard`, `CannabinoidBar`, `TerpenChips`, `GlasHeader`, `TerpenMap`,
  `BestandTabelle`, `BewertungsListe`, `InstagramEmbed`, `FilterLeiste`, `AktiveFilter`
- Seiten: Layout mit Sprunglink und Navigation, Landing, `/produkte` mit Live-Filter,
  `/apotheken` und Detail, 404
- Fachlogik: `lib/query/bewertung.ts` (festes Bewertungsschema), `lib/query/filter.ts`
  (URL-Filter, wirft nie), `lib/format.ts`, `lib/labels.ts`

**Verifikationsstand vor der Umstellung:** `tsc` grün · `eslint` grün, null Warnungen ·
`next build` grün, 6 Routen.

---

## Bekannte Blocker

### 1. Workers-Bundle baut auf Windows nicht
`npx opennextjs-cloudflare build` bricht ab mit
`EPERM: operation not permitted, symlink 'C:\cn\node_modules\@prisma\client' -> ...`.
OpenNext legt beim Bündeln Symlinks an; Windows erlaubt das ohne erhöhte Rechte nicht.
**Kein Code-Fehler** — `next build` läuft durch, die Entwicklung ist nicht blockiert.

Drei Wege, in dieser Reihenfolge zu empfehlen:
- **Weg C (empfohlen): Build und Deploy in GitHub Actions auf Ubuntu.** Dort existiert das Problem
  nicht. Passt zum Grund, aus dem das Repo public ist: unbegrenzte Actions-Minuten. Nötig sind ein
  Workflow und ein Cloudflare-API-Token in den Repository-Secrets.
- **Weg A: Windows Developer Mode aktivieren** (Einstellungen → System → Für Entwickler).
- **Weg B: Terminal als Administrator.** Funktioniert, für Routinearbeit falsch.

### 2. Alle Datenseiten sind `force-dynamic`
Bewusst gesetzt, weil ein Prerender zur Buildzeit ohne Datenbank scheitern würde. Entfällt mit ISR,
sobald die R2-Bindings stehen. Das TODO über `ladeFilterFacetten` in `lib/query/strains.ts`
beschreibt den Nachzug.

---

## Blockiert auf Input vom Nutzer

`C:\cn\.env.local` ist mit Platzhaltern angelegt und gitignored. Die Liste ist durch D1 kurz
geworden — **es gibt keine Datenbank-Zugangsdaten mehr**:

| Variable | Wert |
|---|---|
| `SITE_PASSWORD` | frei wählbar, öffnet die Seite |
| `FACHKREIS_PASSWORD` | frei wählbar, **anderes** Passwort, schaltet zusätzlich Preise frei |
| `SITE_SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_INSTAGRAM_REEL_URL` | optional, öffentliche Reel-URL, darf leer bleiben |

Einmalig für die Datenbank, kein Eintrag in `.env.local`:
```sh
npx wrangler login
npx wrangler d1 create cn-medcan-db     # database_id in wrangler.jsonc eintragen
```
Für rein lokale Entwicklung genügt sogar das nicht — wrangler arbeitet dann gegen eine Datei
unter `.wrangler/`.

---

## Arbeitsweise in diesem Projekt

- Antwortstil: Caveman-Modus `full` (knapp, keine Füllwörter), deutsch. Gilt für den Chat,
  **nicht** für Code, Kommentare, Commits und Dokumente wie diese Datei.
- Verifikation vor jeder Fertigmeldung: `npx tsc --noEmit` und `npx eslint . --max-warnings=0`,
  bei Seitenänderungen zusätzlich `npx next build`. Behauptungen nur mit Beleg.
- Commit je abgeschlossener Welle, Push sobald Typecheck und Build grün sind.
- Unabhängige Teilaufgaben parallel an Subagents geben, jeder mit expliziten Dateigrenzen, damit
  sich zwei nie dieselbe Datei teilen. **Vor einem Session-Clear alle Agents stoppen** — sie
  sterben sonst mitten im Schreiben.
- **Heredocs (`cat > datei <<EOF`) werden in dieser Umgebung teils verstümmelt** — Dateiinhalte
  über das Write-Tool schreiben. Das hat schon dreimal Arbeit gekostet.
- Farbtoken: immer die semantischen Aliase (`bg-accent`, `text-danger`), **nie** die Ramp-Stufen
  (`bg-accent-600`). Nur die Aliase kippen im Dunkelmodus mit; die Ramp-Variante war schon ein
  Kontrastbug.
- Glasmorphismus ist projektweit unerwünscht, **mit einer dokumentierten Ausnahme**: der Header
  der Produktdetailseite, ausdrücklich vom Nutzer gewünscht. Steht im Dateikopf von
  `components/produkt/GlasHeader.tsx` und gilt nur dort.
- Verworfen und nicht erneut vorschlagen: Supabase (zu viele Free-Projekte), Neon (neuer Account,
  Kaltstart), vinext, Cloudflare Pages, Cloudflare Access (braucht eigene Domain),
  Instagram `embed.js` (Tracking ohne Einwilligung).
