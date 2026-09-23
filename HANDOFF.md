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

**Block A (Cloudflare D1) ist abgeschlossen.** Von **Block B** ist **Schritt 1 erledigt**:
Better Auth laeuft mit D1, Schema und Migration stehen, die Anmeldung ist gegen den laufenden
Server geprueft.

**Als naechstes: Block B, Schritt 2** — Registrierung, Anmeldung und `/mitglied` als Oberflaeche.
Der Server-Teil dafuer ist fertig und wartet nur auf Seiten:
`signUp`/`signIn`/`signOut` aus `lib/auth-client.ts`, Leserechte aus `lib/session.ts`.
Danach Schritt 3 (`/admin` mit Mitglieder-Freigabe), dann das Umfragemodell.

Die zwei alten offenen Punkte gelten unveraendert, siehe „Was noch offen ist".

---

## Block B, Schritt 1 — erledigt: Better Auth mit D1

Better Auth `1.7.5` laeuft ueber den **Prisma-Adapter**, nicht ueber Drizzle oder Kysely und
nicht ueber einen D1-Adapter. Gruende, damit das niemand „aufraeumt":

- Die Datenbank laeuft in diesem Projekt ohnehin ueber Prisma. Ein zweites ORM haette einen
  zweiten Migrationspfad bedeutet.
- Das `better-auth`-Skill verspricht fuer v1.5+ eine native D1-Unterstuetzung („`database: env.DB`").
  In `better-auth@1.7.5` gibt es dazu **keine Spur** — kein `D1Database` in den Typen, kein
  D1-Adapter. Die Angabe im Skill ist fuer diese Version falsch.
- `transaction: false` ist Pflicht: D1 hat keine echten Transaktionen. Mit `true` wuerde Better
  Auth eine Garantie annehmen, die die Datenbank nicht gibt.

| Datei | Inhalt |
|---|---|
| `lib/auth.ts` | `getAuth()` — Instanz pro Isolate, gecacht am Prisma-Client. Kein Modul-Singleton: das D1-Binding gibt es erst im Request. Enthaelt den `user.create.after`-Hook, der den `mitglied`-Satz anlegt. |
| `lib/session.ts` | Die Zugriffsschicht (DAL). `aktuellesMitglied()` mit React-`cache()`, dazu `istFreigegeben()`, `istAdmin()` und die drei werfenden Gates fuer Server Actions. **Ueber Rechte entscheidet ausschliesslich diese Datei.** |
| `lib/auth-client.ts` | Browser-Client, nur Bedienoberflaeche. |
| `app/api/auth/[...all]/route.ts` | Alle Auth-Endpunkte. Kein `toNextJsHandler` — der braucht eine Instanz auf Modulebene, die es hier nicht geben kann. |
| `prisma/schema.prisma` | `User`, `Session`, `Account`, `Verification` (Feldnamen von Better Auth vorgegeben, camelCase ohne `@map` — abgeglichen mit `getAuthTables()`), plus eigenes Modell `Mitglied` mit `1:1`. |
| `migrations/0002_better_auth_mitglied.sql` | Fuenf Tabellen, nur `CREATE`, keine Aenderung an Bestandsdaten. |
| `db/enums.ts`, `db/constraints.sql` | `MITGLIED_ROLLEN` (`MITGLIED`/`FACHKREIS`/`ADMIN`) plus Trigger auf `mitglied`. |

E-Mail-Bestaetigung ist **bewusst aus**: es gibt keinen Mailversand-Dienst, und die Verifizierung
ist ohnehin die manuelle Freigabe durch den Betreiber (`mitglied.freigegeben`, Default `false`).

### Was beim Umsetzen anders kam als geplant

1. **`prisma migrate diff --from-migrations` funktioniert hier nicht.** Der Ordner `migrations/`
   gehoert wrangler (flache `.sql`-Dateien), Prisma erwartet seine eigene Struktur mit
   `migration_lock.toml` und bricht mit „Could not determine the connector" ab.
   **Und `--from-url` gibt es in Prisma 7 nicht mehr.** Der Weg, der funktioniert:
   die lokale D1-Datei aus `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite` nach
   `db/.migrate-diff.sqlite` kopieren (genau der Pfad aus `prisma.config.ts`), dann
   `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`,
   danach die Kopie loeschen. Das Ergebnis pruefen: der Diff kennt `d1_migrations` nicht und
   koennte ein `DROP` erzeugen — in `0002` tat er es nicht, in der naechsten Migration erneut
   nachsehen. **`db/README.md` ist entsprechend korrigiert.**
2. **`server-only` war nicht installiert.** Next.js bringt es nicht mit; ohne das Paket ist der
   Import in `lib/session.ts` nur ein Laufzeitfehler-Risiko. Nachinstalliert.

### Verifiziert (gegen `next dev` mit echtem D1-Binding)

- Registrierung ueber `/api/auth/sign-up/email` gibt 200 und setzt `better-auth.session_token`.
- `/api/auth/get-session` liefert Sitzung und Nutzer; Anmeldung mit richtigem Passwort 200,
  mit falschem **401**.
- Der `user.create.after`-Hook legt den `mitglied`-Satz an: `freigegeben = 0`, `rolle = MITGLIED`.
- Der neue Trigger weist `rolle = 'SUPERADMIN'` ab (`SQLITE_CONSTRAINT_TRIGGER`), der Wert bleibt
  unveraendert.
- `delete from user` raeumt den Mitgliedssatz per Cascade mit ab.
- Testnutzer wieder geloescht, die Datenbank ist sauber.

**Zwei Stolpersteine fuer den naechsten Test von Hand:** die Auth-Route liegt hinter dem
Entwicklungs-Passwort aus `proxy.ts` (erst `cn_gate`-Cookie holen), und Better Auth weist
Anfragen ohne `Origin`-Header mit 403 `MISSING_OR_NULL_ORIGIN` ab. Im Browser faellt beides
nicht auf, mit `curl` sofort.

---

## Block A — erledigt

Supabase ist vollständig entfernt (`@supabase/*`, `lib/supabase/`, `supabase/rls.sql`, die
Pooler-URLs). Die Datenbank ist **Cloudflare D1** als Binding `DB`. Was dabei entstand:

| Datei | Inhalt |
|---|---|
| `db/enums.ts` | Die sieben Wertelisten als `as const` plus Unions und Type-Guards. SQLite kennt keine Enums. |
| `db/constraints.sql` | Die früheren CHECK-Constraints als **Trigger**, plus Prüfung der Wertelisten. |
| `db/README.md` | Migrationspfad, Seed-Weg, D1-Eigenheiten. **Vor jeder Migration lesen.** |
| `migrations/0001_initial.sql` | Erzeugt mit `prisma migrate diff`, angewendet mit `wrangler`. |

### Was beim Umsetzen anders kam als geplant

1. **`prisma migrate diff` bricht still ab**, wenn `prisma.config.ts` keine `datasource` hat:
   Exit-Code 0, leere Ausgabe, keine Fehlermeldung. Die Schema-Engine verlangt das Argument auch
   bei `--from-empty`. Dort steht deshalb ein lokaler Dateipfad, in den nie geschrieben wird.
2. **Die Flags aus dem alten Plan gibt es in Prisma 7 nicht mehr.** `--to-schema-datamodel` und
   `--from-local-d1` sind weg; es heißt `--from-schema` / `--to-schema` bzw. `--from-migrations`.
3. **CHECK-Constraints lassen sich in SQLite nicht nachrüsten** — es gibt kein
   `alter table ... add constraint`, sie gehen nur beim `create table`. Die Tabellen erzeugt aber
   Prisma. Deshalb sind die Prüfungen **Trigger** (`RAISE(ABORT, ...)`), und deshalb muss
   `db/constraints.sql` **nach jeder Migration** erneut laufen: SQLite verwirft beim Tabellenumbau
   alle Trigger der alten Tabelle.
4. **Der Seed kann nicht über den D1-Adapter laufen** — der braucht ein `D1Database`-Binding, das
   es nur im Worker gibt. `prisma/seed.ts` schreibt jetzt mit `@prisma/adapter-better-sqlite3`
   direkt in die Miniflare-Datei unter `.wrangler/`. Für die entfernte Datenbank führt der Weg
   über `wrangler d1 export --local` und `wrangler d1 execute --remote`, siehe `db/README.md`.

### Zwei Sicherheitsbefunde, beide behoben

1. **Das Fachkreis-Recht hatte nach dem Umbau keine Quelle mehr.** Es kam aus
   `app_metadata` des Supabase-Nutzers; `FACHKREIS_PASSWORD` war zwar dokumentiert, aber nirgends
   implementiert. Die Rolle steckt jetzt im HMAC-signierten Gate-Token
   (`gate:<ablauf>:<rolle>`), `lib/gate.ts` gibt sie nur nach geprüfter Signatur heraus.
   `istFachkreis()` liest sie dort. Ein manipuliertes Cookie fällt auf „kein Zugang" zurück —
   verifiziert.

2. **Der Zugangsschutz war faktisch wirkungslos** (Fehler war vorher schon da). Im Matcher in
   `proxy.ts` stand `"...|.*\.)..."` — in einem normalen JS-String ist `\.` nur `.`, das Muster
   wurde also zu `.*.` und passte auf jeden nicht leeren Pfad. Die Negation nahm damit **alles
   außer `/`** vom Gate aus: `/produkte` und alle Detailseiten waren ohne Passwort erreichbar.
   Jetzt `\\.`, mit Kommentar. Verifiziert: ohne Cookie liefert `/produkte` 307, mit gültigem
   Cookie 200, `/zugang` bleibt erreichbar.

### Verifiziert

- `npm run typecheck` grün, `npx eslint .` grün (ESLint ignoriert jetzt `.agents/**` und
  `.claude/**` — fremde Referenzdateien der installierten Skills, 22 Fehler stammten von dort).
- `npm run build` grün, alle acht Routen inklusive `/produkte/[slug]`.
- **Gegen echte D1-Daten in `next dev`** (Bindings über `initOpenNextCloudflareForDev`):
  Katalogliste, Filter, Freitextsuche (Groß-/Kleinschreibung über `suchtext`), Produktdetailseite,
  Apothekenseiten, 404 bei unbekanntem Slug. Preisspalte erscheint als Fachkreis und fehlt als
  Besucher, mit §-10-HWG-Hinweis.
- Die Trigger greifen: ein Insert mit unbekanntem Wertelisten-Wert wird abgewiesen
  (`SQLITE_CONSTRAINT_TRIGGER`), der komplette Seed läuft durch sie hindurch.

### Ungetestet geblieben

- **`npm run cf-build` läuft auf diesem Windows-Rechner nicht durch.** OpenNext legt beim Bündeln
  Symlinks unter `.open-next/` an; das scheitert mit `EPERM`, weil der Windows-Entwicklermodus
  nicht aktiv ist. Ein Symlink-Test schlägt auch direkt fehl. `next build` läuft durch — der
  Fehler liegt also im OpenNext-Bündelschritt, nicht im Code.
  **Folge: `npm run preview` (workerd) und `npm run deploy` sind ungetestet.**
  Abhilfe: Entwicklermodus in den Windows-Einstellungen aktivieren, oder den Build in einer
  Shell mit Administratorrechten laufen lassen.

---

## Was noch offen ist

1. **Die D1-Datenbank existiert nur lokal.** In `wrangler.jsonc` steht bei `database_id` ein
   markierter Platzhalter, weil `wrangler login` einen Browser braucht und in der Session nicht
   möglich war. Einmalig nachzuholen:
   ```
   npx wrangler login
   npx wrangler d1 create cn-medcan-db     # ausgegebene ID in wrangler.jsonc eintragen
   npm run cf-typegen
   npm run db:migrate:remote
   npm run db:constraints:remote
   ```
2. **Windows-Entwicklermodus aktivieren**, damit `cf-build`, `preview` und `deploy` laufen.
3. **`BETTER_AUTH_SECRET` fuer den Worker setzen**: `npx wrangler secret put BETTER_AUTH_SECRET`.
   Lokal steht der Wert in `.env.local`, die Vorlage in `.env.local.example`. In Produktion
   zusaetzlich `BETTER_AUTH_URL` auf den echten Host setzen.

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
entfällt dann — zusammen mit der Rolle im Gate-Token und `lib/query/fachkreis.ts`.

### Neue Modelle
| Modell | Felder (Kern) | Wichtig |
|---|---|---|
| `Umfrage` | `titel`, `beschreibung`, `phase` (`VORSCHLAG`/`ABSTIMMUNG`/`BEENDET`), `startAm`, `vorschlagBisAm`, `endetAm`, `communityPlaetze` (Int, Default 2) | Genau **eine** Umfrage darf aktiv sein — über einen partiellen Unique-Index oder eine Prüfung in der Schreibschicht sicherstellen und kommentieren. Kein einzelnes `gewinnerStrainId`: eine Runde hat mehrere Gewinner. |
| `UmfrageVorschlag` | `umfrageId`, `strainId`, `mitgliedId`, `begruendung`, `uebernommen` | Unique `(umfrageId, mitgliedId, strainId)` — ein Mitglied schlägt einen Strain nur einmal vor. |
| `UmfrageOption` | `umfrageId`, `strainId`, `reihenfolge`, **`herkunft`** (`GESETZT`/`COMMUNITY`), `istGewinner`, `ergebnisReviewId` | `GESETZT` = Wahl des Betreibers, nicht abstimmbar, ohne Stimmenzähler in der Oberfläche. `COMMUNITY` = aus einem übernommenen Vorschlag, abstimmbar. Unique `(umfrageId, strainId)` und `(umfrageId, reihenfolge)`. Beim Beenden werden die `communityPlaetze` stimmenstärksten `COMMUNITY`-Optionen plus alle `GESETZT`-Optionen als `istGewinner` markiert. |
| `Stimme` | `umfrageId`, `optionId`, `mitgliedId`, `abgegebenAm` | **Unique `(umfrageId, mitgliedId)`** — jedes Mitglied hat genau eine Stimme, die zwei stimmenstärksten Community-Optionen gewinnen. Das ist die einzige Absicherung gegen Doppelstimmen; **nicht** über eine Transaktion lösen, D1 hat keine. Die Schreibschicht muss zusätzlich prüfen, dass `optionId` zur Umfrage gehört **und** `herkunft = COMMUNITY` ist — sonst ließe sich auf einen gesetzten Platz abstimmen. |
| `Review` (Änderung) | neu: `istRedaktionell` (Boolean) | Trennt die Reviews des Betreibers von Community-Reviews. `autorId` wird Relation auf `mitglied`. |

**Für alle neuen Modelle gilt der D1-Umbau mit:** keine Enums (Werte nach `db/enums.ts`, Prüfung
in `db/constraints.sql` ergänzen), kein `Json`, kein `Decimal`, und jede neue durchsuchbare Spalte
braucht eine kleingeschriebene Suchspalte.

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
1. ~~Better Auth mit D1 einrichten, Schema erweitern, Migration.~~ **erledigt**
2. Registrierung, Anmeldung, `/mitglied`.
3. `/admin` mit Freigabe von Mitgliedern.
4. Umfragemodell, Server Actions für Vorschlag und Stimme, Umfragephasen.
5. Startseite umbauen: Umfrage und neueste Review als Kern.
6. `/umfragen`, `/reviews`.
7. `FACHKREIS_PASSWORD` und das zweite Gate-Passwort ausbauen, Preisanzeige an die Mitgliedsrolle
   binden, HWG-Hinweis setzen.

---

## Was fertig ist

- Scaffold, Cloudflare-Anbindung, `lib/cloudflare.ts` als einziger Binding-Zugang
- Zugangsschutz: `proxy.ts`, `lib/gate.ts` (HMAC-Cookie mit Rolle, zeitkonstanter Vergleich),
  `app/zugang/page.tsx`, `app/api/zugang/route.ts`
- Datenbank: Cloudflare D1, Schema, Migration, Trigger, Seed — siehe `db/README.md`
- Design-System: `.claude/skills/ui-design-engine.md`, Tokens in `app/globals.css`
  (Akzent: klinisches Tiefblau `oklch(0.52 0.11 240)`), 11 Primitives in `components/ui/`
- Edge-Regelwerk: `.claude/skills/edge-stack-master.md` — auf D1 umgeschrieben
- Produktkomponenten: `ProduktCard`, `CannabinoidBar`, `TerpenChips`, `GlasHeader`, `TerpenMap`,
  `BestandTabelle`, `BewertungsListe`, `InstagramEmbed`, `FilterLeiste`, `AktiveFilter`
- Seiten: Layout, Landing, `/produkte` mit Live-Filter, `/produkte/[slug]`, `/apotheken` und
  Detail, 404
