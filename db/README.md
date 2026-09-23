# Datenbank — Cloudflare D1

D1 ist SQLite und laeuft als **Binding** im Worker: keine Verbindungs-URL, kein
Passwort, kein zusaetzliches Konto. Das Binding heisst `DB` und steht in
`wrangler.jsonc`. Zugriff ausschliesslich ueber `getPrisma()` in `lib/prisma.ts`.

## Dateien hier

| Datei | Zweck |
|---|---|
| `enums.ts` | Die geschlossenen Wertelisten als TS-Unions. SQLite kennt keine Enums. |
| `constraints.sql` | Wertepruefungen als Trigger. Muss nach **jeder** Migration erneut laufen. |
| `.migrate-diff.sqlite` | Arbeitskopie der lokalen D1-Datei, nur fuer `prisma migrate diff`. Wird angelegt und danach wieder geloescht, gehoert nicht ins Repo. |

Die Migrationen liegen in `migrations/` im Projektstamm, weil `wrangler` sie
dort erwartet (`migrations_dir` in `wrangler.jsonc`).

## Erstes Aufsetzen

```bash
npx wrangler login
npx wrangler d1 create cn-medcan-db     # database_id in wrangler.jsonc eintragen
npm run cf-typegen
npm run db:migrate:local
npm run db:constraints:local
npm run db:seed
```

Ohne Cloudflare-Konto funktioniert alles ausser `--remote`: wrangler legt die
Datenbank dann als Datei unter `.wrangler/` an.

## Eine Migration schreiben

`prisma migrate dev` gibt es auf diesem Pfad **nicht** — es setzt eine
Verbindung zur Zieldatenbank voraus, und die hat D1 nicht. Stattdessen:

```bash
# 1. Schema aendern (prisma/schema.prisma)

# 2. Stand der lokalen Datenbank als Diff-Quelle bereitstellen.
#    Prisma 7 kann nur gegen die Datasource aus prisma.config.ts diffen -
#    genau dieser Pfad ist db/.migrate-diff.sqlite.
cp .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite db/.migrate-diff.sqlite

# 3. SQL erzeugen
npx prisma migrate diff \n  --from-config-datasource \n  --to-schema prisma/schema.prisma \n  --script > migrations/000X_<name>.sql
rm db/.migrate-diff.sqlite

# 4. ERGEBNIS LESEN, bevor es laeuft - siehe Falle 3.

# 5. Anwenden
npm run db:migrate:local
npm run db:constraints:local     # Trigger neu setzen, siehe unten
```

**Drei Fallen, alle schon erlebt:**

1. `prisma migrate diff` bricht **still** ab, wenn `prisma.config.ts` keine
   `datasource` hat: Exit-Code 0, leere Ausgabe, keine Fehlermeldung. Die
   Schema-Engine verlangt das Argument auch fuer einen Diff aus dem Nichts.
2. Die Flags heissen seit Prisma 7 `--from-schema` / `--to-schema`,
   `--from-config-datasource`. Weg sind `--to-schema-datamodel`,
   `--from-local-d1` und `--from-url`.
   `--from-migrations` **hilft hier nicht**: der Ordner `migrations/` gehoert
   wrangler und hat flache `.sql`-Dateien, Prisma erwartet seine eigene
   Struktur mit `migration_lock.toml` und bricht mit „Could not determine the
   connector" ab.
3. Der Diff kennt die wrangler-eigene Tabelle `d1_migrations` nicht und kann
   deshalb ein `DROP TABLE d1_migrations` erzeugen. Bei Migration `0002` tat
   er es nicht - trotzdem **jedes Mal nachsehen** und so eine Zeile loeschen,
   sonst vergisst wrangler, was bereits angewendet wurde.

Die allererste Migration entstand mit `--from-empty` statt `--from-migrations`.

## Warum die Pruefungen Trigger sind und keine `check`-Constraints

SQLite kann CHECK-Constraints nur beim `create table` setzen; ein
`alter table ... add constraint` gibt es nicht. Die Tabellen erzeugt aber
Prisma aus dem Schema, und Prisma kennt diese Bedingungen nicht.

Folge: **`db/constraints.sql` nach jeder Migration erneut ausfuehren.** Prisma
baut Tabellen beim Aendern als create/copy/drop/rename um, und SQLite verwirft
dabei alle Trigger der alten Tabelle. Das Skript ist idempotent.

Die Werte in `constraints.sql` und `enums.ts` muessen uebereinstimmen. Wer dort
einen Wert ergaenzt, ergaenzt ihn hier mit — sonst weist die Datenbank ihn ab.

## Seed

`npm run db:seed` schreibt mit einem SQLite-Treiber **direkt in die lokale
D1-Datei** unter `.wrangler/`. Der D1-Adapter ist dafuer nicht nutzbar: er
braucht ein `D1Database`-Binding, und das gibt es nur im laufenden Worker.

Fuer die entfernte Datenbank gibt es keinen Dateipfad. Der Weg dorthin:

```bash
npx wrangler d1 export cn-medcan-db --local --no-schema --output db/seed-daten.sql
npx wrangler d1 execute cn-medcan-db --remote --file db/seed-daten.sql
```

## Was es hier nicht mehr gibt: Row Level Security

Die frueheren Policies aus `supabase/rls.sql` sind ersatzlos entfallen — sie
stehen in der Git-Historie. RLS greift nur, wenn die Verbindung eine
Nutzeridentitaet traegt; Prisma verbindet als Eigentuemer, die Policies waren
also ausschliesslich auf dem `supabase-js`-Pfad wirksam, den es nicht mehr gibt.

Die fachliche Sichtbarkeitsgrenze — das Fachkreis-Gate nach §10 HWG — liegt in
der Abfrageschicht: `bestandSichtbarkeit()` in `lib/query/strains.ts`. Sie ist
dort die **einzige** Stelle, die die Bedingung formuliert. Wer eine neue
Abfrage auf `pharmacy_stock` schreibt, geht ueber diese Funktion. Ein
vergessener Filter faellt nicht als Fehler auf, sondern als stilles Datenleck.

## D1-Eigenheiten, die den Code formen

- **Keine echten Transaktionen.** Prisma fuehrt `$transaction` gegen D1 als
  Einzelabfragen aus. Eindeutigkeit wird deshalb ueber Unique-Indizes
  abgesichert, nie ueber eine Transaktion. (Relevant fuer Block B: „eine
  Stimme pro Mitglied" ist ein Unique-Index.)
- **Kein `mode: "insensitive"`.** Freitextsuche laeuft ueber die
  kleingeschriebene Spalte `strains.suchtext`.
- **Kein Json-Typ.** `reviews.geschmacks_matrix` ist JSON-Text.
- **Kein Decimal.** Prozentwerte sind `Float`, Preise bleiben `Int` in Cent.

## Den ersten Betreiber anlegen (Bootstrap)

Rollen vergibt `/admin`. Den **ersten** Admin kann diese Seite nicht vergeben —
wer sie aufruft, muesste schon Admin sein. Der erste Satz wird deshalb einmalig
direkt in der Datenbank gesetzt, nachdem sich das Konto ueber `/registrieren`
angelegt hat:

```
npx wrangler d1 execute cn-medcan-db --local --command \
  "update mitglied set rolle = 'ADMIN', freigegeben = 1, \
   freigegeben_am = strftime('%Y-%m-%dT%H:%M:%f','now') || '+00:00' \
   where user_id = (select id from user where email = '<deine@adresse>');"
```

Fuer die entfernte Datenbank dasselbe mit `--remote` statt `--local`.

Zwei Punkte, die dabei zaehlen:

- **Es gibt keine Rolle `SUPERADMIN`.** Die Werteliste in `db/enums.ts` kennt
  `MITGLIED`, `FACHKREIS`, `ADMIN` — der Trigger aus `db/constraints.sql` weist
  jeden anderen Wert ab (`SQLITE_CONSTRAINT_TRIGGER`). `ADMIN` ist die
  hoechste Rolle.
- `freigegeben_am` wird genau in der Form geschrieben, die Prisma selbst
  schreibt (ISO-8601-Text mit Offset). Ein Integer aus `strftime('%s')*1000`
  wird zwar auch gelesen, steht dann aber als zweite Darstellung derselben
  Spalte in der Tabelle - genau das faellt spaeter jemandem auf die Fuesse.
  `freigegeben_von` bleibt beim Bootstrap leer: es gab noch keinen Betreiber,
  der freigegeben haette.

Danach vergibt der Betreiber jede weitere Freigabe und Rolle ueber `/admin`.
Die eigene Admin-Rolle und die eigene Freigabe kann er dort **nicht** ablegen
(`lib/admin-eingabe.ts`) — sonst waere die Seite fuer alle zu und nur ueber den
Weg oben wieder zu oeffnen.
