# HANDOFF — Stand der Arbeit

> Diese Datei ist das Übergabemedium zwischen Sessions. Sie wird nach jedem Arbeitsblock
> aktualisiert und committet. Wer hier weiterarbeitet, liest sie zuerst und braucht den
> Chatverlauf nicht.

**Letzte Aktualisierung:** 2026-09-22
**Repo:** https://github.com/bratzi/cn-medcan (public)
**Branch:** `main`, gepusht bis Commit `40a1a2c`

---

## Was das Projekt ist

`cn-medcan` — Produktkatalog für den deutschen Medizinalcannabis-Markt. Produkte nach
BfArM-Handelsnamen, Apotheken-Bestände mit Preis pro Gramm, chargenbezogene Community-Bewertungen.

**Harte Randbedingung: alles muss kostenlos bleiben.**

---

## Stack, wie er tatsächlich steht

| Schicht | Wahl | Begründung |
|---|---|---|
| Framework | Next.js 16.3.6, React 19.2.8, App Router | — |
| Styling | Tailwind v4, CSS-first (`@theme` in `app/globals.css`), keine `tailwind.config.js` | — |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` 1.20.6 | Pages/`next-on-pages` ist deprecated; vinext ist nur ein Vite-Reimplement der Next-API |
| Datenbank | Supabase Postgres (Free Tier) | |
| ORM | Prisma 7.10 mit `@prisma/adapter-pg` | Prisma 7 verwaltet URLs in `prisma.config.ts`, **nicht** im Schema |
| Nutzerzugriff | `@supabase/supabase-js` + `@supabase/ssr` | Prisma umgeht RLS (Service-Rolle), deshalb zwei Pfade |
| Zugangsschutz | Passwort-Gate als Worker-Middleware | Cloudflare Access schützt keine `workers.dev`-Subdomain, eigene Domain kostet Geld |

### Verworfene Alternativen — nicht erneut vorschlagen
- **D1 + Drizzle** war zuerst geplant, wurde durch Supabase + Prisma ersetzt. Alle Reste sind entfernt.
- **vinext** statt OpenNext — verworfen, weil echtes Next 16 gewünscht ist.
- **Cloudflare Pages** — verworfen, deprecated für Next.
- **Cloudflare Access (Zero Trust, E-Mail-PIN)** — verworfen wegen Domainkosten. Upgrade-Pfad ist
  in `.claude/skills/edge-stack-master.md` dokumentiert, falls später eine Domain dazukommt.

### Zwei Grenzen, die jede Designentscheidung binden
1. **Workers Free Tier: 10 ms CPU pro Request, 50 Sub-Requests.** Deshalb: `Intl`-Formatter als
   Modulkonstanten, keine N+1-Queries, jede Liste mit `take`, Prisma-Client als Isolate-Singleton.
2. **§10 HWG** verbietet Publikumswerbung für verschreibungspflichtige Arzneimittel. Apothekenpreise
   und Bestände sind nur für Fachkreise sichtbar — gesteuert über `pharmacy_stock.nur_fuer_fachkreise`,
   eine RLS-Policy und einen **serverseitig** gesetzten JWT-Claim (`app_metadata.rolle`). Der Claim
   darf nie aus Cookie oder Request-Body kommen.

---

## Dateistand

```
C:\cn
├── .claude/skills/
│   ├── ui-design-engine.md + ui-design-engine/SKILL.md      FERTIG
│   └── edge-stack-master.md + edge-stack-master/SKILL.md    FERTIG
├── app/
│   ├── globals.css        FERTIG — 8px-Tokens, OKLCH, Dark Mode doppelt gegated
│   ├── layout.tsx         lang="de", sonst noch Scaffold-Metadata
│   ├── page.tsx           NOCH SCAFFOLD — muss ersetzt werden
│   ├── zugang/page.tsx    FERTIG — Referenzimplementierung für den Designstil
│   └── api/zugang/route.ts FERTIG
├── lib/
│   ├── cloudflare.ts      FERTIG — getEnv, getEnvSync, requireVar
│   ├── prisma.ts          FERTIG — getPrisma() Singleton, Adapter über DATABASE_URL
│   ├── gate.ts            FERTIG — HMAC-Cookie, zeitkonstanter Vergleich
│   ├── supabase/{server,client}.ts  FERTIG
│   └── generated/prisma/  generiert, gitignored
├── prisma/
│   ├── schema.prisma      FERTIG, valide
│   └── seed.ts            von Agent in Arbeit
├── supabase/
│   ├── rls.sql            von Agent in Arbeit
│   └── README.md          von Agent in Arbeit
├── middleware.ts          FERTIG — sperrt alles außer /zugang
├── prisma.config.ts       FERTIG — lädt .env.local, nutzt DIRECT_URL
├── wrangler.jsonc         FERTIG — kein D1 mehr
└── .env.local.example     FERTIG — die Vorlage für alle Zugangsdaten
```

### Datenmodell (`prisma/schema.prisma`, valide, nicht ändern ohne Grund)
`Unternehmen` (Hersteller/Importeur mit Rolle) · `Terpen` (mit Geschmacksachse) · `Strain`
(BfArM-Handelsname, THC/CBD-Spannen als `Decimal`, Bestrahlung, Herstellerbildpfad) ·
`StrainTerpen` (Join mit `rang`, 1 = dominant) · `Pharmacy` (Versandapotheke mit Lieferzeitspanne
und `RezeptStatus`) · `PharmacyStock` (Join, Preis als **Integer-Cent**, `nurFuerFachkreise`) ·
`Charge` (Batch mit Ist-Werten) · `Review` (fünf Noten 1–5, Feuchtigkeit, `geschmacksMatrix` als
JSON über acht Achsen, `instagramReelUrl`, `freigegeben`).

---

## Was als Nächstes dran ist

1. **Agents abwarten** (liefen bei Erstellung dieser Datei noch): RLS + Seed, UI-Primitives,
   Abfrageschicht. Ergebnis prüfen, `npx tsc --noEmit` grün halten, committen.
2. **Seiten bauen** — noch offen:
   - `app/page.tsx` — Landing, ersetzt das Scaffold
   - `app/produkte/page.tsx` — Live-Filter-Übersicht: Apothekenverfügbarkeit, Preis pro Gramm,
     THC-Gehalt, dominanter Geschmack. Filter über URL-Suchparameter, Server Component.
   - `app/produkte/[slug]/page.tsx` — Detailseite mit Glasmorphismus-Header im Dunkelmodus,
     Instagram-Reel-Einbettung, interaktiver Terpen-Map für Bewertungen.
     *Hinweis:* Der Glasmorphismus ist eine bewusste, vom Nutzer gewünschte Ausnahme von der
     Anti-Deko-Regel in `ui-design-engine.md` — auf diesen einen Header begrenzt halten.
   - `app/apotheken/**` — Liste und Detail mit Bestandstabelle hinter dem Fachkreis-Gate
3. **Datenbank scharf schalten** — sobald `.env.local` gefüllt ist: `npm run db:migrate`,
   dann `supabase/rls.sql` im Supabase SQL Editor ausführen, dann `npm run db:seed`.
4. **Deploy** — `npx wrangler login`, `npm run cf-build`, `npm run preview` (workerd-Smoke-Test),
   dann `npm run deploy`. Secrets mit `wrangler secret put` setzen, nicht in `wrangler.jsonc`.

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

Cloudflare-Zugangsdaten gehören **nicht** in die Datei — Deployment läuft über `wrangler login`.

Ohne diese Werte lässt sich alles bauen und typprüfen, aber keine Migration, kein Seed, kein
echter Datenabruf.

---

## Arbeitsweise in diesem Projekt

- Antwortstil: Caveman-Modus `full` (knapp, keine Füllwörter), deutsch. Gilt für Chat, **nicht**
  für Code, Kommentare, Commits und Dokumente wie diese Datei.
- Verifikation vor jeder Fertigmeldung: `npx tsc --noEmit` und `npx eslint . --max-warnings=0`.
  Behauptungen nur mit Beleg.
- Commit je abgeschlossener Welle, Push gesammelt sobald Typecheck und Build grün sind.
- Unabhängige Teilaufgaben parallel an Subagents geben. Jeder Agent bekommt explizite
  Dateigrenzen, damit sich zwei nie dieselbe Datei teilen.
- **Heredocs (`cat > datei <<EOF`) werden in dieser Umgebung teils verstümmelt** — Dateiinhalte
  über das Write-Tool schreiben. Das hat schon zweimal Arbeit gekostet.
