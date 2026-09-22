# HANDOFF — Stand der Arbeit

> Übergabemedium zwischen Sessions. Wird nach jedem Arbeitsblock aktualisiert und committet.
> Wer hier weiterarbeitet, liest diese Datei zuerst und braucht den Chatverlauf nicht.

**Letzte Aktualisierung:** 2026-09-22
**Repo:** https://github.com/bratzi/cn-medcan (public)
**Branch:** `main`

---

## ⇢ Hier geht es weiter

**Der nächste Schritt ist genau einer: `app/produkte/[slug]/page.tsx` anlegen.**

Die Produktdetailseite fehlt als einzige Seite. Alle ihre Bausteine sind fertig und getestet:
`components/produkt/GlasHeader.tsx`, `TerpenMap.tsx`, `BestandTabelle.tsx`,
`BewertungsListe.tsx`, `InstagramEmbed.tsx`. Die Seite muss sie nur zusammensetzen.

Vorgehen für die Seite:
1. Server Component. `params` ist in Next 16 ein Promise, also `await params`.
2. `istFachkreis()` aus `lib/query/fachkreis.ts`, dann `ladeStrainDetail(slug, fachkreis)` aus
   `lib/query/strains.ts`. Bei `null` → `notFound()`.
3. Reihenfolge im Seitenaufbau: `GlasHeader` → Faktenblock als `<dl>` (Handelsname, Kultivar,
   Typ, Genetik, Darreichungsform, Bestrahlung, Anbauland, Hersteller und Importeur getrennt,
   PZN) → `CannabinoidBar` → `TerpenChips` mit allen Rängen → `BestandTabelle` → Chargentabelle
   → `TerpenMap` mit `verdichteGeschmacksMatrix(reviews)` → `BewertungsListe`.
4. `generateMetadata` mit dem Handelsnamen, kein zusätzlicher `metadata`-Export.
5. `export const dynamic = "force-dynamic"` mit Kommentar (siehe unten, ISR-Nachzug).
6. Sichtbarer Hinweis: verschreibungspflichtig, keine medizinische Beratung.

Danach: `npx tsc --noEmit`, `npx eslint . --max-warnings=0`, `npx next build` — alle drei müssen
grün sein. Dann committen und pushen.

**Danach in dieser Reihenfolge weiterarbeiten,** ohne auf Rückfragen zu warten, solange nichts
davon eine Entscheidung des Nutzers braucht:
1. Deploy-Blocker lösen (siehe „Bekannte Blocker", Weg C ist der empfohlene).
2. Datenbank scharf schalten, sobald `.env.local` gefüllt ist (siehe „Blockiert auf Input").
3. ISR statt `force-dynamic` einführen: R2-Bucket und `WORKER_SELF_REFERENCE` in `wrangler.jsonc`,
   dann das TODO über `ladeFilterFacetten` in `lib/query/strains.ts` abarbeiten.
4. Bewertungen einreichbar machen: Supabase-Auth-Login, Formular gegen das feste Schema aus
   `lib/query/bewertung.ts`, Server Action, Schreibpfad über `supabase-js` mit Nutzer-JWT —
   **nicht** über Prisma, weil Prisma RLS umgeht.

---

## Was das Projekt ist

`cn-medcan` — Produktkatalog für den deutschen Medizinalcannabis-Markt. Produkte nach
BfArM-Handelsnamen, Apothekenbestände mit Preis pro Gramm, chargenbezogene Community-Bewertungen.

**Harte Randbedingung: alles muss kostenlos bleiben.**

---

## Stack, wie er tatsächlich steht

| Schicht | Wahl |
|---|---|
| Framework | Next.js 16.3.6, React 19.2.8, App Router |
| Styling | Tailwind v4, CSS-first (`@theme` in `app/globals.css`), keine `tailwind.config.js` |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` 1.20.6 |
| Datenbank | Supabase Postgres (Free Tier) |
| ORM | Prisma 7.10 mit `@prisma/adapter-pg` |
| Nutzerzugriff | `@supabase/supabase-js` + `@supabase/ssr` |
| Zugangsschutz | Passwort-Gate in `proxy.ts` (früher `middleware.ts`) |

### Verworfene Alternativen — nicht erneut vorschlagen
- **D1 + Drizzle** war zuerst geplant, durch Supabase + Prisma ersetzt. Reste sind entfernt.
- **vinext** statt OpenNext — verworfen, weil echtes Next 16 gewünscht ist.
- **Cloudflare Pages** — verworfen, `next-on-pages` ist deprecated.
- **Cloudflare Access (Zero Trust, E-Mail-PIN)** — verworfen: schützt keine `workers.dev`-Subdomain,
  eine eigene Domain kostet Geld. Upgrade-Pfad steht in `.claude/skills/edge-stack-master.md`.
- **Instagram `embed.js`** — verworfen: Tracking-Cookies ohne Einwilligung (DSGVO ohne
  Consent-Banner nicht tragbar) und CPU-Kosten im 10-ms-Budget. Stattdessen validierter `<iframe>`.

### Zwei Grenzen, die jede Designentscheidung binden
1. **Workers Free Tier: 10 ms CPU pro Request, 50 Sub-Requests.** Daher: `Intl`-Formatter als
   Modulkonstanten, keine N+1-Queries, jede Liste mit `take`, Prisma-Client als Isolate-Singleton.
2. **§10 HWG** verbietet Publikumswerbung für verschreibungspflichtige Arzneimittel.
   Apothekenpreise und Bestände nur für Fachkreise — über `pharmacy_stock.nur_fuer_fachkreise`,
   eine RLS-Policy und `public.ist_fachkreis()`, das den **serverseitig** gesetzten Claim
   `app_metadata.rolle` liest. Der Claim darf nie aus Cookie, Body oder Header kommen.

---

## Fertig und verifiziert

- Scaffold, Cloudflare-Anbindung, `wrangler.jsonc`, `lib/cloudflare.ts` als einziger Binding-Zugang
- Datenschicht: `prisma/schema.prisma` (8 Modelle), `prisma.config.ts`, `lib/prisma.ts` als
  Isolate-Singleton, Supabase-Clients für Server und Browser
- `supabase/rls.sql`: RLS auf allen 8 Tabellen, 12 Policies mit vorangestelltem
  `drop policy if exists`, 16 Check-Constraints über `pg_constraint`-Prüfung
- `prisma/seed.ts`: 8 Terpene, 4 Unternehmen, 8 Strains, 5 Apotheken, 26 Bestandszeilen,
  6 Chargen, 6 Bewertungen — alle Handelsnamen und PZN erkennbar fiktiv
- Zugangsschutz: `proxy.ts`, `lib/gate.ts` (HMAC-Cookie, zeitkonstanter Vergleich),
  `app/zugang/page.tsx`, `app/api/zugang/route.ts`
- Design-System: `.claude/skills/ui-design-engine.md`, Tokens in `app/globals.css`
  (Akzent: klinisches Tiefblau `oklch(0.52 0.11 240)`), 11 Primitives in `components/ui/`
- Edge-Regelwerk: `.claude/skills/edge-stack-master.md`
- Abfrageschicht: `lib/query/{filter,strains,fachkreis,bewertung}.ts`
- Seiten: Layout mit Sprunglink und Navigation, Landing, `/produkte` mit Live-Filter,
  `/apotheken` und Detail, 404

**Verifikationsstand:** `npx tsc --noEmit` grün · `npx eslint . --max-warnings=0` grün ·
`npx next build` grün, 6 Routen. `npx opennextjs-cloudflare build` scheitert lokal, siehe unten.

---

## Bekannte Blocker

### 1. Workers-Bundle baut auf Windows nicht
`npx opennextjs-cloudflare build` bricht ab mit
`EPERM: operation not permitted, symlink 'C:\cn\node_modules\@prisma\client' -> ...`.
OpenNext legt beim Bündeln Symlinks an; Windows erlaubt das ohne erhöhte Rechte nicht.
**Kein Code-Fehler** — `next build` läuft durch, die Entwicklung ist nicht blockiert.

Drei Wege, in dieser Reihenfolge zu empfehlen:
- **Weg C (empfohlen): Build und Deploy in GitHub Actions auf Ubuntu.** Dort existiert das Problem
  nicht. Passt genau zum Grund, aus dem das Repo public ist: unbegrenzte Actions-Minuten. Nötig
  sind ein Workflow und ein Cloudflare-API-Token in den Repository-Secrets (nicht in `.env.local`).
- **Weg A: Windows Developer Mode aktivieren** (Einstellungen → System → Für Entwickler). Erlaubt
  Symlinks ohne Adminrechte, danach läuft der Build lokal.
- **Weg B: Terminal als Administrator** starten. Funktioniert, ist aber für Routinearbeit falsch.

### 2. Alle Datenseiten sind `force-dynamic`
Bewusst gesetzt, weil es keine erreichbare Datenbank gibt und ein Prerender zur Buildzeit
scheitern würde. Entfällt mit ISR, sobald die R2-Bindings stehen. Das TODO über
`ladeFilterFacetten` in `lib/query/strains.ts` beschreibt den Nachzug.

---

## Blockiert auf Input vom Nutzer

`C:\cn\.env.local` ist mit Platzhaltern angelegt und gitignored. Zu füllen:

| Variable | Quelle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `DATABASE_URL` | Settings → Database → **Transaction pooler, Port 6543** |
| `DIRECT_URL` | Settings → Database → **Direct connection, Port 5432** |
| `SITE_PASSWORD` | frei wählbar |
| `SITE_SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NEXT_PUBLIC_INSTAGRAM_REEL_URL` | optional, öffentliche Reel-URL |

Cloudflare-Zugangsdaten gehören **nicht** in die Datei — lokal `wrangler login`, für CI ein
API-Token in den GitHub-Repository-Secrets.

Sobald die Werte stehen:
```sh
npm run db:migrate          # Migration gegen DIRECT_URL
# supabase/rls.sql im Supabase SQL Editor ausfuehren
npm run db:seed
npm run dev
```
`supabase/rls.sql` muss nach **jeder** Migration erneut laufen — `prisma migrate` kennt kein RLS.

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
  der Produktdetailseite, ausdrücklich vom Nutzer gewünscht. Die Ausnahme steht im Dateikopf von
  `components/produkt/GlasHeader.tsx` und gilt nur dort.
