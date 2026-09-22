# Supabase-Setup

Reihenfolge der Schritte. Jeder Schritt setzt den vorherigen voraus.

1. **Supabase-Projekt anlegen** — <https://supabase.com>, Free Tier genuegt.
   Region moeglichst nah an den Nutzern (z. B. `eu-central-1`).

2. **`.env.local` fuellen** — `cp .env.local.example .env.local`, dann die
   Platzhalter ersetzen:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     (Project Settings -> API)
   - `DATABASE_URL` — Transaction-Pooler, Port **6543** (Laufzeit)
   - `DIRECT_URL` — direkte Verbindung, Port **5432** (Migrationen und Seed)

   Der Service-Role-Key gehoert nie in eine `NEXT_PUBLIC_*`-Variable.

3. **Schema migrieren** — `npm run db:migrate`
   Legt die acht Tabellen an (`prisma migrate dev` ueber `DIRECT_URL`).

4. **RLS und Constraints einrichten** — `supabase/rls.sql` ausfuehren:
   - Supabase SQL Editor: Datei einfuegen, "Run", oder
   - `psql "$DIRECT_URL" -f supabase/rls.sql`

5. **Seed einspielen** — `npm run db:seed`
   Fiktive Stammdaten, Apotheken, Bestaende, Chargen und Bewertungen.
   Idempotent, laeuft beliebig oft.

## `rls.sql` muss nach jeder Migration erneut laufen

`prisma migrate` kennt Row Level Security, Policies und die Check-Constraints
aus `rls.sql` nicht und kann sie beim Nachziehen des Schemas verwerfen. Deshalb
gilt: **nach jedem `npm run db:migrate` wieder `supabase/rls.sql` ausfuehren.**
Das Skript ist idempotent (`drop policy if exists` vor jedem `create policy`,
Constraints ueber eine `pg_constraint`-Pruefung), mehrfaches Ausfuehren ist der
Normalfall und gefahrlos.

## Fachkreis-Claim

Die Policy auf `pharmacy_stock` blendet Zeilen mit
`nur_fuer_fachkreise = true` aus (§10 HWG). Freigeschaltet wird ueber den
JWT-Claim `app_metadata.rolle` mit dem Wert `fachkreis` oder `admin`. Dieser
Claim wird ausschliesslich serverseitig mit dem Service-Role-Key gesetzt:

```ts
await admin.auth.admin.updateUserById(userId, {
  app_metadata: { rolle: "fachkreis" },
});
```

`app_metadata` ist fuer den Client nicht schreibbar — `user_metadata` waere es,
und darf deshalb nie fuer diese Entscheidung verwendet werden.

## Moderation von Bewertungen

`freigegeben = true` setzt nur die Service-Rolle. Die Policies erlauben
Autoren, eigene unfreigegebene Bewertungen zu schreiben, zu aendern und zu
loeschen — nie aber, sie selbst freizugeben.
