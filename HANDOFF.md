# HANDOFF — Stand der Arbeit

> Übergabemedium zwischen Sessions. Wird nach jedem Arbeitsblock aktualisiert und committet.
> Wer hier weiterarbeitet, liest diese Datei zuerst und braucht den Chatverlauf nicht.

**Letzte Aktualisierung:** 2026-09-23
**Repo:** https://github.com/bratzi/cn-medcan (public)
**Branch:** `main`

---

## Worum es bei diesem Projekt wirklich geht

`cn-medcan` ist **kein reiner Produktkatalog.** Der Katalog, die Apothekenbestände und die Filter
sind Beiwerk. Der Kern sind zwei Dinge, die zentral und sichtbar auf der Startseite stehen:

1. **Die eigenen Reviews des Betreibers** — der zentrale Anhaltspunkt der Seite. Bewertet nach dem
   festen Schema in `lib/query/bewertung.ts`, gebunden an eine konkrete Charge. Community-Reviews
   existieren, aber als Zweitstimme darunter, nicht gleichrangig.
2. **Umfragen, die den nächsten Strain bestimmen** — verifizierte Mitglieder wählen, was der
   Betreiber als nächstes probiert und bewertet. Das Ergebnis ist verbindlich für die nächste
   Review. Diese Schleife ist das Alleinstellungsmerkmal, gekoppelt an den Instagram-Account des
   Betreibers.

Wer hier Features priorisiert: dieser Kern hat Vorrang vor Katalogkomfort.

---

## ⇢ Hier geht es weiter

Zwei Arbeitsblöcke stehen an, **in dieser Reihenfolge**. Block A ist das Fundament, Block B setzt
darauf auf.

- **Block A — Umstellung Supabase → Cloudflare D1.** Geplant, noch nicht umgesetzt. Fünf Wellen,
  unten beschrieben.
- **Block B — Mitglieder, Umfragen, Reviews als Produktkern.** Entwurf steht unten, Umsetzung nach
  Block A.

Dazwischen liegt außerdem die einzige noch fehlende Seite: `app/produkte/[slug]/page.tsx`. Ihre
Bausteine sind fertig (`GlasHeader`, `TerpenMap`, `BestandTabelle`, `BewertungsListe`,
`InstagramEmbed`); die Seite setzt sie nur zusammen. Aufbau: Glas-Header → Faktenblock als `<dl>`
→ `CannabinoidBar` → `TerpenChips` (alle Ränge) → `BestandTabelle` → Chargentabelle → `TerpenMap`
mit `verdichteGeschmacksMatrix(reviews)` → `BewertungsListe`. `params` ist ein Promise.

---

## Block A — Umstellung auf Cloudflare D1

### Warum
Supabase entfällt: das Konto des Nutzers führt zu viele Free-Projekte. **Cloudflare D1** braucht
keinen weiteren Account und kein weiteres Projekt, es läuft als Binding im vorhandenen
Cloudflare-Konto. Belegte Free-Limits: 5 GB Speicher, 5 Mio. gelesene Zeilen/Tag, 100 000
geschriebene Zeilen/Tag.

Neon wurde verworfen (neuer Account, Suspend nach 5 Minuten mit Kaltstart), obwohl das
Projektlimit dort kein Problem gewesen wäre.

### Der Punkt, der den RLS-Verlust tragbar macht
RLS greift nur, wenn die Verbindung eine Nutzeridentität trägt. Prisma verbindet als Eigentümer —
die Policies waren also ausschließlich auf dem `supabase-js`-Pfad wirksam, der mit Supabase
ohnehin wegfällt. Das HWG-Gate liegt in der Abfrageschicht, wo es mit `bestandSichtbarkeit()` in
`lib/query/strains.ts` schon implementiert ist. CHECK-Constraints funktionieren in SQLite weiter.

### Zwei belegte D1-Eigenheiten, die den Plan formen
1. **Keine Transaktionen.** Prisma führt `$transaction` als Einzelabfragen aus. Die Abfrageschicht
   nutzt `Promise.all`, ist also nicht betroffen. Wichtig für Block B: „eine Stimme pro Mitglied"
   darf **nicht** über eine Transaktion abgesichert werden, sondern über einen Unique-Index.
2. **Migrationen hybrid.** `prisma migrate dev` fällt weg. Stattdessen
   `wrangler d1 migrations create` → `prisma migrate diff --from-local-d1 --to-schema-datamodel`
   → `wrangler d1 migrations apply --local` bzw. `--remote`.

### SQLite-Umbauten am Schema
| Bisher (Postgres) | Neu (SQLite/D1) | Folge |
|---|---|---|
| `enum` (7 Stück) | `String` + TS-Union | Prisma-Enums gibt es in SQLite nicht. Typen wandern nach `db/enums.ts`. **Alle Importe von `@/lib/generated/prisma/enums` müssen umgezogen werden** — `lib/labels.ts`, `lib/query/*`, `components/produkt/*`. |
| `Decimal @db.Decimal(4,1)` | `Float` | Prozentwerte. Preise sind schon `Int` in Cent, unverändert. |
| `Json` | `String` | `geschmacksMatrix` als JSON-Text. `parseGeschmacksMatrix` validiert schon, nur `JSON.parse` davorziehen. |
| `@db.Uuid`, `@db.VarChar(5)`, `@db.Date` | entfällt | `@default(uuid())` funktioniert weiter. |
| `contains` mit `mode: "insensitive"` | **nicht unterstützt** | Ersatz: Spalte `suchtext` am `Strain`, beim Schreiben kleingeschrieben gefüllt, `contains` darauf mit kleingeschriebener Eingabe. Kein `LOWER()` in der Query — Prisma bildet das auf SQLite nicht ab. |
| RLS-Policies | entfallen | `supabase/rls.sql` wird zu `db/constraints.sql`: nur die 16 CHECK-Constraints bleiben, `create policy` und `ist_fachkreis()` fallen. |

### Die fünf Wellen
**Welle 1 — Fundament, sequenziell**
1. `npm uninstall @supabase/supabase-js @supabase/ssr @prisma/adapter-pg pg @types/pg dotenv`,
   `npm install @prisma/adapter-d1`. `lib/supabase/` löschen.
2. `wrangler.jsonc`: `d1_databases`-Binding `DB`, `database_name: "cn-medcan-db"`,
   `migrations_dir: "migrations"`. Danach `npm run cf-typegen`.
3. `prisma/schema.prisma` auf `provider = "sqlite"`, alle Umbauten oben, Feld `suchtext` ergänzen.
4. `db/enums.ts`: sieben Wertelisten als `as const` plus Union-Typen und Guards zum Parsen.
5. `prisma.config.ts`: `datasource`-Block und `dotenv`-Import raus, `migrations.seed` behalten.
6. `lib/prisma.ts`: `PrismaD1`-Adapter mit dem `DB`-Binding. **Der Client kann kein
   Modul-Singleton mehr sein** — das Binding existiert erst im Request-Kontext. Also `getPrisma()`
   async über `getEnv()`, mit Caching pro Isolate nur bei identischem Binding.

**Welle 2 — zwei Agents parallel**
7. `lib/query/*`: Enum-Importe umziehen, Freitext auf `suchtext`, `getPrisma()` auf `await`,
   `parseGeschmacksMatrix` um `JSON.parse` erweitern.
8. `lib/labels.ts`, `components/produkt/*`: Enum-Importe auf `@/db/enums`.

**Welle 3 — sequenziell**
9. `db/constraints.sql` aus `supabase/rls.sql` ableiten, `supabase/` löschen, `db/README.md`.
10. `prisma/seed.ts`: kein `dotenv`, keine Transaktionsannahme, `geschmacksMatrix` als JSON-String,
    `suchtext` mitschreiben. Prüfen, ob der D1-Adapter außerhalb des Workers nutzbar ist; wenn
    nicht, den Seed als generiertes SQL für `wrangler d1 execute` ausliefern.
11. Migration erzeugen, lokal anwenden, seeden.

**Welle 4** — `app/produkte/[slug]/page.tsx` bauen.

**Welle 5** — Verifikation: `tsc`, `eslint`, `next build`, dann `npm run dev` gegen echte Daten.

---

## Block B — Mitglieder, Umfragen, Reviews (Entwurf, vom Nutzer bestätigt)

### Die vier Entscheidungen des Nutzers
1. **Verifizierung durch manuelle Freigabe.** Registrierung ist offen, Stimmrecht vergibt der
   Betreiber in einer Admin-Ansicht. Kein Mailversand-Dienst nötig, keine Wegwerf-Adressen-Lücke.
2. **Eigene Reviews zentral, Community-Reviews als Zweitstimme.** Die Freigabe-Warteschlange
   (`Review.freigegeben`) bleibt und wird gebraucht.
3. **Umfrage mit gesetzten und erwählten Plätzen.** Eine Runde ergibt 3 bis 4 getestete Strains:
   - **1 bis 2 gesetzte Plätze** — der Betreiber wählt sie selbst, sie stehen von Anfang an fest
     und werden **nicht** abgestimmt. Er testet sie ohnehin.
   - **2 Community-Plätze** — darüber entscheidet die Abstimmung.

   Ablauf in drei Phasen:
   `VORSCHLAG` → Mitglieder schlagen Strains mit Begründung vor.
   `ABSTIMMUNG` → der Betreiber übernimmt geeignete Vorschläge als Kandidaten. **Jedes Mitglied
   hat genau eine Stimme; die zwei Vorschläge mit den meisten Stimmen gewinnen** die beiden
   Community-Plätze. Die Umfrage hat ein Enddatum.
   `BEENDET` → alle Gewinner (gesetzte plus erwählte) werden mit den daraus entstehenden Reviews
   verknüpft.

   Konsequenz für die Oberfläche: gesetzte und erwählte Plätze müssen sichtbar unterschieden sein,
   sonst wirkt die Abstimmung manipuliert. Gesetzte Kandidaten tragen keinen Stimmenzähler.
4. **Preise sehen alle verifizierten Mitglieder.** Ausdrückliche Entscheidung des Nutzers.
   **Einordnung, die im Code als Kommentar stehen muss:** §10 HWG adressiert Fachkreise, also
   Angehörige der Heilberufe — „verifiziertes Mitglied" ist das nicht. Die Preisanzeige braucht
   deshalb einen deutlichen Hinweis. Die Rolle `fachkreis` bleibt im Datenmodell erhalten, damit
   die strengere Variante ohne Schemaänderung nachziehbar ist.

### Auth: Better Auth mit D1
Das Skill `better-auth` ist installiert (Better Auth mit D1-Adapter, OAuth, RBAC). Better Auth
verwaltet seine eigenen Tabellen (`user`, `session`, `account`, `verification`). Unsere Felder
kommen als eigene Tabelle `mitglied` mit `1:1` auf `user`, damit ein Better-Auth-Update unsere
Spalten nicht anfasst:

- `mitglied`: `userId` (1:1), `anzeigename`, `instagramHandle`, `freigegeben` (Boolean, die
  manuelle Verifizierung), `rolle` (`mitglied` | `fachkreis` | `admin`), `freigegebenAm`,
  `freigegebenVon`.

Das bisherige Passwort-Gate in `proxy.ts` **bleibt zusätzlich bestehen**, solange die Seite in der
geschlossenen Entwicklungsphase ist. Es schützt die ganze Seite; Better Auth regelt, wer darin
abstimmen darf. Das zweite Passwort (`FACHKREIS_PASSWORD`) wird mit Block B überflüssig und
entfällt dann.

### Neue Modelle
| Modell | Felder (Kern) | Wichtig |
|---|---|---|
| `Umfrage` | `titel`, `beschreibung`, `phase` (`VORSCHLAG`/`ABSTIMMUNG`/`BEENDET`), `startAm`, `vorschlagBisAm`, `endetAm`, `communityPlaetze` (Int, Default 2) | Genau **eine** Umfrage darf aktiv sein — über einen partiellen Unique-Index oder eine Prüfung in der Schreibschicht sicherstellen und kommentieren. Kein einzelnes `gewinnerStrainId`: eine Runde hat mehrere Gewinner. |
| `UmfrageVorschlag` | `umfrageId`, `strainId`, `mitgliedId`, `begruendung`, `uebernommen` | Unique `(umfrageId, mitgliedId, strainId)` — ein Mitglied schlägt einen Strain nur einmal vor. |
| `UmfrageOption` | `umfrageId`, `strainId`, `reihenfolge`, **`herkunft`** (`GESETZT`/`COMMUNITY`), `istGewinner`, `ergebnisReviewId` | `GESETZT` = Wahl des Betreibers, nicht abstimmbar, ohne Stimmenzähler in der Oberfläche. `COMMUNITY` = aus einem übernommenen Vorschlag, abstimmbar. Unique `(umfrageId, strainId)` und `(umfrageId, reihenfolge)`. Beim Beenden werden die `communityPlaetze` stimmenstärksten `COMMUNITY`-Optionen plus alle `GESETZT`-Optionen als `istGewinner` markiert. |
| `Stimme` | `umfrageId`, `optionId`, `mitgliedId`, `abgegebenAm` | **Unique `(umfrageId, mitgliedId)`** — jedes Mitglied hat genau eine Stimme, die zwei stimmenstärksten Community-Optionen gewinnen. Das ist die einzige Absicherung gegen Doppelstimmen; **nicht** über eine Transaktion lösen, D1 hat keine. Die Schreibschicht muss zusätzlich prüfen, dass `optionId` zur Umfrage gehört **und** `herkunft = COMMUNITY` ist — sonst ließe sich auf einen gesetzten Platz abstimmen. |
| `Review` (Änderung) | neu: `istRedaktionell` (Boolean) | Trennt die Reviews des Betreibers von Community-Reviews. `autorId` wird Relation auf `mitglied`. |

### Oberfläche
- **Startseite:** oben die aktuelle Umfrage als Kernelement (Phase, Kandidaten, Stimmenzahl,
  Restlaufzeit, Abstimm-Button oder Hinweis „Freigabe ausstehend"), daneben die neueste eigene
  Review mit Instagram-Reel. Der Katalog rutscht darunter.
- `/umfragen` — laufende und vergangene Umfragen mit Ergebnis und verknüpfter Review.
- `/reviews` — alle eigenen Reviews chronologisch, Community-Reviews je Charge darunter.
- `/mitglied` — eigenes Konto, Freigabestatus, eigene Vorschläge und Stimmen.
- `/admin` — nur Rolle `admin`: Mitglieder freigeben, Vorschläge übernehmen, Umfragephase
  weiterschalten, Community-Reviews freigeben.
- Schreibzugriffe als Server Actions. **Jede Schreibaktion prüft serverseitig `freigegeben` und
  die Rolle** — nie im Client entscheiden.

### Reihenfolge für Block B
1. Better Auth mit D1-Adapter einrichten, Schema erweitern, Migration.
2. Registrierung, Anmeldung, `/mitglied`.
3. `/admin` mit Freigabe von Mitgliedern.
4. Umfragemodell, Server Actions für Vorschlag und Stimme, Umfragephasen.
5. Startseite umbauen: Umfrage und neueste Review als Kern.
6. `/umfragen`, `/reviews`.
7. `FACHKREIS_PASSWORD` und das zweite Gate-Passwort ausbauen, Preisanzeige an die Mitgliedsrolle
   binden, HWG-Hinweis setzen.

---

## Was fertig ist und beide Blöcke übersteht

- Scaffold, Cloudflare-Anbindung, `lib/cloudflare.ts` als einziger Binding-Zugang
- Zugangsschutz: `proxy.ts`, `lib/gate.ts` (HMAC-Cookie, zeitkonstanter Vergleich),
  `app/zugang/page.tsx`, `app/api/zugang/route.ts`
- Design-System: `.claude/skills/ui-design-engine.md`, Tokens in `app/globals.css`
  (Akzent: klinisches Tiefblau `oklch(0.52 0.11 240)`), 11 Primitives in `components/ui/`
- Edge-Regelwerk: `.claude/skills/edge-stack-master.md` — der Supabase-Abschnitt muss auf D1
  umgeschrieben werden
- Produktkomponenten: `ProduktCard`, `CannabinoidBar`, `TerpenChips`, `GlasHeader`, `TerpenMap`,
  `BestandTabelle`, `BewertungsListe`, `InstagramEmbed`, `FilterLeiste`, `AktiveFilter`
- Seiten: Layout, Landing, `/produkte` mit Live-Filter, `/apotheken` und Detail, 404
- Fachlogik: `lib/query/bewertung.ts`, `lib/query/filter.ts`, `lib/format.ts`, `lib/labels.ts`

**Verifikationsstand:** `tsc` grün · `eslint` grün, null Warnungen · `next build` grün, 6 Routen.

---

## Bekannte Blocker

### 1. Workers-Bundle baut auf Windows nicht
`npx opennextjs-cloudflare build` bricht ab mit `EPERM ... symlink`. OpenNext legt beim Bündeln
Symlinks an, Windows erlaubt das ohne erhöhte Rechte nicht. **Kein Code-Fehler** — `next build`
läuft durch.
- **Weg C (empfohlen): Build und Deploy in GitHub Actions auf Ubuntu.** Passt zum Grund, aus dem
  das Repo public ist: unbegrenzte Actions-Minuten. Braucht einen Workflow und ein
  Cloudflare-API-Token in den Repository-Secrets.
- Weg A: Windows Developer Mode aktivieren. Weg B: Terminal als Administrator.

### 2. Alle Datenseiten sind `force-dynamic`
Bewusst, weil ein Prerender ohne Datenbank scheitern würde. Entfällt mit ISR, sobald die
R2-Bindings stehen. TODO über `ladeFilterFacetten` in `lib/query/strains.ts`.

---

## Blockiert auf Input vom Nutzer

`C:\cn\.env.local` ist mit Platzhaltern angelegt und gitignored. Durch D1 gibt es **keine
Datenbank-Zugangsdaten** mehr:

| Variable | Wert |
|---|---|
| `SITE_PASSWORD` | frei wählbar, öffnet die Seite |
| `FACHKREIS_PASSWORD` | frei wählbar, anderes Passwort; entfällt mit Block B |
| `SITE_SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_INSTAGRAM_REEL_URL` | optional, darf leer bleiben |

Mit Block B kommt hinzu: `BETTER_AUTH_SECRET` (gleiche Erzeugung wie oben) und `BETTER_AUTH_URL`.

Einmalig für die Datenbank, kein Eintrag in `.env.local`:
```sh
npx wrangler login
npx wrangler d1 create cn-medcan-db     # database_id in wrangler.jsonc eintragen
```
Für rein lokale Entwicklung genügt sogar das nicht — wrangler arbeitet gegen eine Datei in
`.wrangler/`.

---

## Arbeitsweise in diesem Projekt

- **Installierte Skills von sich aus nutzen**, nicht erst auf Zuruf. Zuordnung:
  `prisma-upgrade-v7` bei Prisma-Fehlern, die nach Breaking Change riechen · `prisma-client-api`
  bei Queries · `prisma-driver-adapter-implementation` beim D1-Adapter · `prisma-cli` bei
  `migrate diff` · `cloudflare-d1` nur für D1-Plattformverhalten, nicht für ORM-Fragen (Datei ist
  auf Drizzle ausgerichtet und trägt `last_verified: 2025-01-15`) · `better-auth` für Block B ·
  `cloudflare:wrangler` bei jedem wrangler-Befehl · `cloudflare:workers-best-practices` ·
  `cloudflare:web-perf` · `ui-design-engine` bei allem unter `app/**` und `components/**` ·
  `edge-stack-master` bei Bindings, Datenzugriff, Caching, Deployment.
- **`AGENTS.md` im Projektroot beachten** (wird von `next dev` selbst geschrieben): Next 16 hat
  Breaking Changes gegenüber älterem Wissen. Vor Next-spezifischem Code die passende Anleitung in
  `node_modules/next/dist/docs/` lesen, statt aus dem Gedächtnis zu arbeiten. Zwei Fälle hatten
  wir schon: `searchParams` und `params` sind Promises, und die `middleware`-Konvention wurde
  durch `proxy.ts` ersetzt.
- Antwortstil: Caveman-Modus `full`, deutsch. Gilt für den Chat, **nicht** für Code, Kommentare,
  Commits und Dokumente wie diese Datei.
- Verifikation vor jeder Fertigmeldung: `npx tsc --noEmit` und `npx eslint . --max-warnings=0`,
  bei Seitenänderungen zusätzlich `npx next build`. Behauptungen nur mit Beleg.
- Commit je abgeschlossener Welle, Push sobald Typecheck und Build grün sind.
- Unabhängige Teilaufgaben parallel an Subagents, jeder mit expliziten Dateigrenzen.
  **Vor einem Session-Clear alle Agents stoppen** — sie sterben sonst mitten im Schreiben.
- **Heredocs werden in dieser Umgebung teils verstümmelt** — Dateiinhalte über das Write-Tool
  schreiben. Hat schon dreimal Arbeit gekostet.
- Farbtoken: immer die semantischen Aliase (`bg-accent`, `text-danger`), **nie** die Ramp-Stufen
  (`bg-accent-600`). Nur die Aliase kippen im Dunkelmodus mit; war schon ein Kontrastbug.
- Glasmorphismus ist projektweit unerwünscht, **mit einer dokumentierten Ausnahme**: der Header der
  Produktdetailseite. Steht im Dateikopf von `components/produkt/GlasHeader.tsx`.
- Verworfen, nicht erneut vorschlagen: Supabase (zu viele Free-Projekte), Neon (neuer Account,
  Kaltstart), vinext, Cloudflare Pages, Cloudflare Access (braucht eigene Domain), Instagram
  `embed.js` (Tracking ohne Einwilligung), `tailwind-v4-shadcn` (kollidiert mit
  `ui-design-engine`).
