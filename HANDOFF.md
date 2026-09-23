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

**Block A (Cloudflare D1) ist abgeschlossen.** Von **Block B** sind **Schritt 1 bis 6** erledigt:
Anmeldung, `/mitglied`, `/admin`, das Umfragemodell samt Schreibschicht, die umgebaute Startseite
und die beiden Seiten `/umfragen` und `/reviews`.

**Als naechstes: die Verwaltung der Umfragen in `/admin`.** `app/admin/umfrage-aktionen.ts`
(Runde anlegen, gesetzten Platz vergeben, Vorschlag uebernehmen, Phase weiterschalten, Ergebnis
verknuepfen) ist vollstaendig und **immer noch durch keinen Klick gelaufen** - es gibt keine
Oberflaeche dazu. Ohne sie kann der Betreiber keine Runde eroeffnen; die Startseite zeigt dann
dauerhaft "Derzeit laeuft keine Abstimmung". Das ist die naechste Luecke.

Danach: die **vier alten Formulare ohne Hydrations-Sperre** (siehe Schritt 5/6, Punkt 1 unter
"Was beim Umsetzen anders kam"), die drei alten offenen Punkte unter "Was noch offen ist" - und
der Mailversand als **Block C**.

---

## Block B, Schritt 5 und 6 - erledigt: Startseite, /umfragen, /reviews

| Datei | Inhalt |
|---|---|
| `app/page.tsx` | Umgebaut. Oben die laufende Runde und daneben die neueste eigene Bewertung, beide in einer eigenen `Suspense`-Grenze. Katalog, Filter und Apotheken darunter, der Rechtshinweis ans Ende. |
| `app/umfragen/page.tsx` | Laufende Runde, Vorschlagsformular (nur in der Vorschlagsphase und nur fuer Freigegebene), Vorschlagsliste, Uebersicht aller Runden. |
| `app/reviews/page.tsx` | Alle freigegebenen Bewertungen des Betreibers. Nicht nutzerbezogen - der erste Kandidat fuer ISR. |
| `lib/query/reviews.ts` | Neu: `neuesteRedaktionelleReview()` und `redaktionelleReviews()`. |
| `lib/query/umfragen.ts` | Neu: `umfragenUebersicht()` - alle Runden mit Phase und Gewinnern in **einer** Query. |
| `lib/query/strains.ts` | Neu: `ladeStrainAuswahl()` - nur Id und Handelsname, fuer das Auswahlfeld. |
| `components/umfrage/UmfrageKarte.tsx` | Die Runde als Karte. Kennt vier Betrachterzustaende, entscheidet aber ueber nichts. |
| `components/umfrage/StimmFormular.tsx`, `VorschlagFormular.tsx` | Die beiden Schreibformulare. |
| `components/review/ReviewKarte.tsx` | Eine Bewertung mit Reel, Noten und Restfeuchte. |
| `components/ui/useHydriert.ts` | Neu, siehe "Was beim Umsetzen anders kam", Punkt 1. |

### Entscheidungen, damit sie niemand zurueckdreht

1. **Der Betrachterzustand entsteht in der Seite, nicht in der Karte.** `UmfrageKarte` bekommt
   `StimmZustand` (`ANONYM`, `FREIGABE_OFFEN`, `STIMMBERECHTIGT`, `ABGESTIMMT`) uebergeben und
   zeigt ihn nur an. Ueber das Schreiben entscheidet erneut `freigabeErforderlich()` in der
   Server Action - die Karte ist Anzeige, kein Gate.
2. **Gesetzte Plaetze bekommen keinen Balken und keinen Zaehler.** `stimmen` ist dort `null`;
   ein Balken auf 0 % hiesse "niemand wollte sie" und waere eine Falschaussage.
3. **In der Vorschlagsphase zeigt die Karte weder Zaehler noch "Deine Stimme".** Beides haengt an
   derselben Bedingung. Sonst behauptet ein Badge einen Zustand, den die Zahlen daneben nicht
   zeigen - im Browser gesehen und behoben.
4. **Die Startseite bleibt `force-dynamic`, jetzt mit einem zweiten Grund:** sie ist
   nutzerbezogen geworden. Die eigene Stimme darf nie gecacht werden. Wenn ISR kommt, wird
   einzeln gecacht (Umfragezahlen, Katalog), nicht die Seite als Ganzes. `/reviews` ist dagegen
   fuer alle Nutzer gleich.
5. **`ReviewKarte` ist nicht `BewertungsListe`.** Die Liste zeigt Bewertungen *zu einem Produkt*
   und nennt das Produkt deshalb nicht; hier ist der Handelsname die Hauptaussage.
6. **Das Vorschlagsformular laedt die Katalogliste nur, wenn es angezeigt wird.** Sonst waere es
   eine Abfrage fuer nichts - jede Query ist ein Sub-Request.

### Was beim Umsetzen anders kam als geplant

1. **Vor der Hydration schickt ein Formular einen nativen GET ab** - die Eingaben landen in der
   URL, und es passiert nichts. Reproduzierbar auf einer frisch geladenen Seite, wenn abgeschickt
   wird, bevor React den `onSubmit`-Handler angehaengt hat. Deshalb `components/ui/useHydriert.ts`
   (`useSyncExternalStore`, nicht `useState` plus `useEffect` - die ESLint-Regel
   `react-hooks/set-state-in-effect` verbietet das) und `disabled={laeuft || !hydriert}` am
   Absende-Button. **Die vier aelteren Formulare** (`AnmeldeFormular`, `RegistrierFormular`,
   `ProfilFormular`, `MitgliedAktionen`) haben dieselbe Luecke und sind **nicht** nachgezogen.
2. **Der laufende `next dev` musste neu gestartet werden**, weil er den vor Schritt 4
   generierten Prisma-Client im Speicher hielt: `prisma.umfrage` war `undefined` und
   `review.istRedaktionell` ein unbekanntes Argument. `npm run db:generate`, Prozess beenden,
   `.next` loeschen, neu starten. Wer nach Schritt 4 zum ersten Mal Seiten baut, faengt damit an.
3. **Ein abgebrochener Dev-Server hinterlaesst einen Zustand, in dem gestreamte
   `Suspense`-Inhalte nie eingeblendet werden** - die Seite bleibt bei den Platzhaltern stehen,
   obwohl das ausgelieferte HTML den Inhalt enthaelt (per `curl` geprueft). Betraf auch
   `/produkte`, an dem nichts geaendert war. Ein sauberer Neustart behebt es. Nicht als Fehler im
   eigenen Code suchen.
4. **Ein `wrangler d1 execute` mit mehreren Statements bricht beim ersten Fehler ab und fuehrt
   keines davon aus.** Beim Aufraeumen stand `user_id` statt `userId` in einem `DELETE` - die
   Better-Auth-Tabellen haben camelCase-Spalten. Danach war scheinbar nichts geloescht.
5. **Registrierung und Anmeldung liefen im Browserwerkzeug in ein Haengen** (der POST kam
   minutenlang nicht am Server an). Konto per `curl` gegen `/api/auth/sign-up/email` angelegt -
   **der `Origin`-Header ist Pflicht**, sonst antwortet Better Auth `MISSING_OR_NULL_ORIGIN` -,
   angemeldet per `fetch` aus der Seite heraus. Danach lief alles normal.

### Verifiziert (gegen `next dev` mit echtem D1-Binding, im Browser geklickt)

- `npm run typecheck`, `npx eslint .` und `npm run build` gruen; `/umfragen` und `/reviews`
  erscheinen im Routenbaum.
- **Die Server Actions sind zum ersten Mal echt gelaufen** - das war der offene Punkt aus
  Schritt 4:
  - `stimmeAbgeben`: Klick auf einen Community-Kandidaten schreibt die Stimme (`option_id` = der
    gewaehlte Platz, `mitglied_id` = das angemeldete Konto). Danach ist das Formular weg, der
    Zaehler steht auf 1, das Badge "Deine Stimme" sitzt an der richtigen Zeile.
  - `vorschlagEinreichen`: Vorschlag samt Begruendung landet **getrimmt** in der Datenbank,
    die Bestaetigung erscheint, der Vorschlag steht danach in der Liste ("Offen", mit Autor und
    Datum).
  - **Derselbe Vorschlag ein zweites Mal** ergibt die lesbare Meldung "Diese Sorte hast du in
    dieser Runde schon vorgeschlagen." - der P2002-Pfad war bisher nur als Datenbankregel belegt,
    jetzt auch als Antwort der Aktion.
- **Alle vier Betrachterzustaende gesehen:** abgemeldet (Hinweis und "Anmelden"), angemeldet ohne
  Freigabe (Badge "Freigabe ausstehend"), freigegeben ohne Stimme (Formular mit **nur** den
  Community-Kandidaten, der gesetzte Platz fehlt), nach der Stimme (Bestaetigung).
- **Phasen:** in `VORSCHLAG` keine Zaehler, keine Balken, dafuer Vorschlagsfrist und
  Vorschlagsformular; in `ABSTIMMUNG` Zaehler, Balken und Abstimmfrist.
- **`freigegeben` wirkt:** die Startseite nahm die neueste *freigegebene* Bewertung, nicht die
  neuere unfreigegebene, an der die Test-Reel-URL zuerst hing.
- `/reviews` zeigt alle vier freigegebenen redaktionellen Bewertungen, eine davon mit
  Reel-`<iframe>`.
- Light geprueft (Screenshot), Dark ueber die berechneten Token-Werte (`--color-surface`,
  `--color-text`, `--color-accent` und weitere schalten unter `[data-theme="dark"]` um). Die
  neuen Komponenten nutzen ausschliesslich semantische Tokens und keine `dark:`-Varianten.
  **Ein Dark-Screenshot ist nicht entstanden** - das Browserwerkzeug brach dabei wiederholt ab.
- Testdaten wieder geloescht: `umfragen`, `umfrage_optionen`, `umfrage_vorschlaege` und `stimmen`
  sind leer, das Testkonto ist weg, die 6 Bewertungen stehen unveraendert und ohne Reel-URL.

### Noch nicht verifiziert

- **`app/admin/umfrage-aktionen.ts` ist weiterhin durch keinen Klick gelaufen** - es gibt keine
  Oberflaeche dazu. Die Testrunde dieser Session wurde per SQL angelegt, nicht ueber die Aktion.
- **Nichts davon lief in workerd.** `npm run cf-build` scheitert auf diesem Rechner weiterhin an
  den Symlinks (EPERM), damit bleiben `npm run preview` und `npm run deploy` ungetestet.

---

## Block B, Schritt 4 — erledigt: Umfragemodell und Schreibschicht

| Datei | Inhalt |
|---|---|
| `prisma/schema.prisma` | Neu: `Umfrage`, `UmfrageVorschlag`, `UmfrageOption`, `Stimme`. Geaendert: `Review.autorId` ist Relation auf `Mitglied` (optional), neu `Review.istRedaktionell`. |
| `migrations/0003_umfragen.sql` | Vier Tabellen, Umbau von `reviews`, dazu zwei `UPDATE` auf Bestandsdaten (siehe unten). |
| `db/enums.ts` | `UMFRAGE_PHASEN`, `UMFRAGE_PHASEN_AKTIV`, `OPTION_HERKUNFT` plus Type-Guards. |
| `db/constraints.sql` | Trigger fuer `umfragen`, `umfrage_optionen` und `stimmen`. |
| `lib/umfrage-eingabe.ts` | Pruefregeln und `gewinnerErmitteln()` als **reine Funktionen**. |
| `lib/query/umfragen.ts` | Leseschicht: `aktiveUmfrage()`, `umfrageLaden()`, `eigeneStimme()`, `vorschlaegeLaden()`. |
| `lib/prisma-fehler.ts` | `istEindeutigkeitsfehler()` (P2002) — der Unique-Verstoss ist hier eine fachliche Antwort, kein Unfall. |
| `app/umfragen/aktionen.ts` | `vorschlagEinreichen`, `stimmeAbgeben`. Beide hinter `freigabeErforderlich()`. |
| `app/admin/umfrage-aktionen.ts` | `umfrageAnlegen`, `gesetztenPlatzVergeben`, `vorschlagUebernehmen`, `phaseWeiterschalten`, `ergebnisVerknuepfen`. Alle hinter `adminErforderlich()`. |
| `prisma/seed.ts` | Die fiktiven Autoren-Ids sind raus, die Seed-Bewertungen sind `istRedaktionell` ohne Autor. |

### Entscheidungen, damit sie niemand zurueckdreht

1. **„Genau eine aktive Umfrage“ haengt an der Spalte `umfragen.aktiv`, nicht an einer Pruefung.**
   Eine laufende Runde traegt dort die Konstante `'AKTIV'`, eine beendete `NULL`. SQLite laesst
   beliebig viele `NULL` in einer Unique-Spalte zu, aber nur ein `'AKTIV'`. Dass Wert und Phase
   zusammenpassen, erzwingt ein Trigger. **Nicht** durch „erst nachsehen, ob eine laeuft“ ersetzen —
   D1 hat keine Transaktionen, das waere eine Race Condition.
2. **Eine Stimme je Mitglied und Runde steht im Unique-Index `(umfrage_id, mitglied_id)`.** Die
   Server Action faengt P2002 ab und macht daraus einen lesbaren Satz — sie prueft nicht vorher.
3. **Auf `GESETZT` kann nicht abgestimmt werden**, und eine Stimme muss zur selben Runde gehoeren.
   Beides steht doppelt: als Trigger (damit eine vergessene Pruefung nicht still danebengeht) und
   in der Server Action (damit die Meldung verstaendlich ist).
4. **`stimmen` ist bei gesetzten Plaetzen `null`, nicht `0`.** `null` heisst „steht nicht zur
   Wahl“, `0` hiesse „niemand wollte sie“. Ohne diesen Unterschied wirkt die Abstimmung
   manipuliert.
5. **Phasen laufen nur vorwaerts.** Ein Rueckschritt aus `ABSTIMMUNG` stellte abgegebene Stimmen in
   einen Zustand, den es fachlich nicht gibt; ein Wiederoeffnen machte ein Ergebnis nachtraeglich
   verschiebbar. Wer wiederholen will, legt eine neue Runde an.
6. **Gleichstand am Schnitt entscheidet die kleinere `reihenfolge`** (die fruehere Aufnahme in die
   Runde). Das ist eine gesetzte Regel, keine fachliche Wahrheit — sie muss nur deterministisch
   sein, sonst haengt das Ergebnis an der Sortierung der Datenbank.
7. **Eine Option ohne eine einzige Stimme gewinnt keinen freien Platz.** Sie zur Gewinnerin zu
   erklaeren, weil niemand sonst kandidierte, waere eine Behauptung. Gesetzte Plaetze gewinnen
   dagegen immer — sie standen nie zur Wahl.
8. **`Review.autorId` ist optional und `SetNull`.** Eine Bewertung des Betreibers braucht kein
   Mitglied dahinter, und ein geloeschtes Mitglied nimmt seine Bewertung nicht mit. Wer schreiben
   darf, entscheidet die Schreibschicht, nicht die Spalte.
9. **Beim Beenden werden erst die Gewinner markiert, dann die Runde geschlossen.** Ohne
   Transaktion ist die Reihenfolge die einzige Sicherung: bricht es dazwischen ab, steht eine
   laufende Runde mit markierten Gewinnern da — sichtbar und nachbesserbar. Andersherum stuende
   eine beendete Runde ohne Ergebnis, und nachtragen ginge nicht, weil Phasen nur vorwaerts laufen.

### Was beim Umsetzen anders kam als geplant

1. **Der `cp`-Befehl aus `db/README.md` funktionierte nicht mehr.** Im Ordner
   `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` liegt inzwischen auch `metadata.sqlite`;
   der Glob `*.sqlite` trifft zwei Dateien und `cp` bricht mit „target is not a directory“ ab.
   **`db/README.md` ist korrigiert** (`| grep -v metadata`).
2. **Die Migration enthaelt ein `DROP TABLE "reviews"` — das ist in Ordnung.** Es ist der normale
   SQLite-Tabellenumbau (neu anlegen, Zeilen kopieren, umbenennen), weil SQLite Spalten und
   Fremdschluessel nicht nachtraeglich aendern kann. Nicht mit der `d1_migrations`-Falle
   verwechseln. Die Zeilen werden mitkopiert — 6 Bewertungen vorher, 6 nachher.
3. **Der Umbau laeuft mit `foreign_keys=OFF`** und haette die erfundenen Autoren-Ids aus dem Seed
   stehen lassen: Zeilen, die gegen ihren eigenen Fremdschluessel verstossen und erst beim
   naechsten Schreibzugriff auffallen. Deshalb stehen in `0003` zwei `UPDATE` auf Bestandsdaten —
   entgegen der Regel aus `0002`, und mit Begruendung im Migrationskopf.

### Verifiziert (gegen die lokale D1)

- `npx prisma validate`, `npm run typecheck`, `npx eslint .` und `npm run build` gruen.
- Migration angewendet (32 Befehle), `db/constraints.sql` danach erneut ausgefuehrt.
- Bestandsdaten: 6 Bewertungen vorher und nachher, alle `ist_redaktionell = 1`, alle Autoren-Ids
  geleert. `npm run db:seed` erneut durchgelaufen — weiterhin 6, keine Duplikate.
- **Trigger, 16 Faelle gegen die echte Datenbank, alle korrekt:** laufende Umfrage ohne `AKTIV`
  abgewiesen, unbekannte Phase abgewiesen, beendete Umfrage mit `AKTIV` abgewiesen, leerer Titel
  abgewiesen, **zweite aktive Umfrage vom Unique-Index abgewiesen**, beendete Umfrage daneben
  erlaubt, unbekannte Herkunft abgewiesen, **Stimme auf einen gesetzten Platz abgewiesen**,
  Stimme auf eine Option fremder Runde abgewiesen, Stimme ausserhalb der Abstimmungsphase
  abgewiesen, gueltige Stimme durchgelassen, **zweite Stimme desselben Mitglieds vom
  Unique-Index abgewiesen**.
- **Reine Funktionen: 30 Faelle, alle bestanden** — Trimmen, Laengengrenzen, alle Phasenwechsel
  (auch rueckwaerts und uebersprungen), `communityPlaetze` als „2x“/„2.5“/0/11, und die
  Gewinnerermittlung inklusive Gleichstand, Null-Stimmen und „weniger Kandidaten als Plaetze“.
- Testdaten wieder geloescht.

### Noch nicht verifiziert

**Die Server Actions sind durch keinen echten Aufruf gelaufen.** Es gibt noch keine Oberflaeche,
die sie ausloest, und ein Server-Action-Aufruf laesst sich von Hand nicht sinnvoll nachbauen
(siehe Schritt 2). Belegt sind ihre Entscheidungslogik (reine Funktionen) und die Regeln der
Datenbank (Trigger, Unique-Indizes) — nicht die Verdrahtung dazwischen. **Das ist beim Bauen der
Seiten in Schritt 5 und 6 als Erstes zu pruefen.**

---

## Block B, Schritt 3 — erledigt: /admin mit Freigabe und Rollenvergabe

| Datei | Inhalt |
|---|---|
| `app/admin/page.tsx` | Mitgliedertabelle, offene Freigaben zuerst. Gate: ohne Sitzung 307 auf `/anmelden?weiter=%2Fadmin`, als Nicht-Betreiber **404**. |
| `app/admin/aktionen.ts` | `freigabeSetzen` und `rolleSetzen`. Beide beginnen mit `adminErforderlich()`. |
| `lib/admin-eingabe.ts` | Die Pruefregeln als **reine Funktionen**, ohne Request, Prisma und Sitzung. |
| `components/admin/MitgliedAktionen.tsx` | Freigabe-Button und Rollen-Select je Zeile. |
| `components/ui/Field.tsx`, `Select.tsx` | Neu: `labelVersteckt` — Label bleibt fuer Screenreader, ist in der Tabellenzelle aber unsichtbar, weil die Spaltenueberschrift schon beschriftet. |
| `app/mitglied/page.tsx` | Einstieg „Zur Verwaltung“, nur fuer Rolle `ADMIN`. |
| `db/README.md` | Neuer Abschnitt „Den ersten Betreiber anlegen (Bootstrap)“. |

### Entscheidungen, damit sie niemand zurueckdreht

1. **Als Nicht-Betreiber gibt `/admin` 404, keinen Redirect und keine Meldung „keine Berechtigung“.**
   Wer die Seite nicht benutzen darf, soll nicht erfahren, dass es sie gibt.
2. **Der eigene Satz ist gesperrt**: die eigene Freigabe ist nicht zuruecknehmbar, die eigene
   Betreiber-Rolle nicht ablegbar. Sonst waere `/admin` nach einem Fehlklick fuer alle zu und nur
   noch per `wrangler d1 execute` zu oeffnen. Entschieden wird das in `lib/admin-eingabe.ts`; was
   die Oberflaeche ausgraut, ist nur Bedienkomfort.
3. **Der Einstieg zu `/admin` steht auf `/mitglied`, nicht in der Navigation.** Gleicher Grund wie
   bei Schritt 2: die Navigation muesste sonst auf jeder Seite die Sitzung lesen.
4. **`freigegeben_von` und `freigegeben_am` werden beim Zuruecknehmen geleert.** Eine
   stehengebliebene Freigabe-Spur ohne Freigabe waere spaeter nicht zu deuten.
5. **Den ersten Betreiber kann `/admin` nicht vergeben** — dafuer muesste man schon Betreiber sein.
   Der erste Satz wird einmalig per SQL gesetzt, dokumentiert in `db/README.md`. **Es gibt keine
   Rolle `SUPERADMIN`**: `db/enums.ts` kennt `MITGLIED`, `FACHKREIS`, `ADMIN`, und der Trigger weist
   alles andere ab. `ADMIN` ist die hoechste Rolle.

### Was beim Umsetzen anders kam als geplant

1. **React verwirft Klicks auf Buttons, die es selbst als `disabled` gerendert hat** — auch wenn man
   `disabled` vorher im DOM entfernt und einen `MouseEvent` schickt. Es geht kein Request raus.
   Die Client-Sperre laesst sich im Browser also **nicht** umgehen und damit auch nicht
   gegenpruefen; der serverseitige Selbstschutz ist ueber die reinen Funktionen belegt, nicht ueber
   einen Klick.
2. **Der Zeitstempel `freigegeben_am` hat zwei moegliche Darstellungen.** Prisma schreibt
   ISO-8601-Text mit Offset; ein Bootstrap per `strftime('%s','now')*1000` schreibt einen Integer.
   Beides wird gelesen, steht danach aber als zwei Formate in derselben Spalte. `db/README.md`
   nennt deshalb ausdruecklich die ISO-Form.
3. **`curl` gegen `/api/zugang` braucht `--data-urlencode`**, wenn das Passwort ein `&` enthaelt —
   mit `-d` wird es zum Parametertrenner und das Gate antwortet mit `fehler=1`. Ausserdem mangelt
   Git Bash Argumente, die mit `/` beginnen, zu Windows-Pfaden: `MSYS_NO_PATHCONV=1` setzen.
   Das Gate-Cookie ist `Secure` und landet ueber `http` **nicht** im Cookie-Jar — mit
   `-b "cn_gate=..."` von Hand mitgeben.

### Verifiziert (gegen `next dev` mit echtem D1-Binding)

- `npm run typecheck`, `npx eslint .` und `npm run build` gruen; `/admin` erscheint im Routenbaum.
- **Gate:** ohne Sitzung 307 auf `/anmelden?weiter=%2Fadmin`, als einfaches Mitglied **404**,
  als Betreiber 200 mit allen Konten in der Tabelle.
- **`freigabeEingabePruefen` und `rolleEingabePruefen`: 15 Faelle, alle bestanden** — Trimmen,
  leere Id, unbekannte Aktion, kleingeschriebene Aktion/Rolle, alle drei Rollen, eigene Freigabe
  zuruecknehmen abgelehnt, eigene Rolle ablegen abgelehnt, eigene Rolle `ADMIN` erneut setzen erlaubt.
- **Im Browser geklickt:** „Freigeben“ schreibt `freigegeben = 1` samt `freigegeben_am` und
  `freigegeben_von` (Id des handelnden Betreibers); der Rollen-Select schreibt die neue Rolle.
- **Das Rollen-Gate der Server Action greift im echten Durchlauf:** waehrend das Konto kurzzeitig
  nur `FACHKREIS` war, warf derselbe Klick serverseitig `Keine Berechtigung.` und schrieb nichts.
- Eigener Satz: Button und Select sind gesperrt, fremde Zeilen bedienbar.
- Dark und Light geprueft (`data-theme`), Tabelle, Badges und Felder sitzen in beiden Themes.
- Testkonten wieder geloescht.

---

## Block B, Schritt 2 — erledigt: Registrierung, Anmeldung, /mitglied

| Datei | Inhalt |
|---|---|
| `app/registrieren/page.tsx`, `app/anmelden/page.tsx` | Serverseiten. Wer schon angemeldet ist, wird direkt weitergeleitet. |
| `app/mitglied/page.tsx` | Eigenes Konto: Freigabestatus, Rolle, Profilangaben, Abmelden. Ohne Sitzung 307 auf `/anmelden?weiter=%2Fmitglied`. |
| `app/mitglied/aktionen.ts` | Server Action `profilSpeichern`. |
| `lib/mitglied-eingabe.ts` | Die Pruefregeln als **reine Funktion**, ohne Request, Prisma und Sitzung. |
| `lib/weiterleitung.ts` | `sicheresZiel()` gegen offene Weiterleitung ueber `?weiter=`. |
| `components/auth/` | `AnmeldeFormular`, `RegistrierFormular`, `ProfilFormular`, `AbmeldeButton`, `fehlertexte.ts`. |
| `components/ui/Input.tsx` | Fehlendes Primitive, gleiche Klassenbasis wie `Select`, haengt an `Field`. |

### Entscheidungen, damit sie niemand zurueckdreht

1. **`profilSpeichern` nimmt genau zwei Felder entgegen**: `anzeigename` und `instagramHandle`.
   `freigegeben` und `rolle` sind hier **nicht** schreibbar — sonst koennte sich jedes Mitglied
   selbst Stimmrecht und Preissicht geben. Beides vergibt `/admin` (Schritt 3). Die Identitaet
   kommt aus `lib/session.ts`, nie aus dem Formular: eine mitgesendete Mitglieds-Id waere eine
   fremde Identitaet.
2. **Die Pruefregeln liegen in `lib/mitglied-eingabe.ts`, nicht in der Server Action.** Grund:
   ein Server-Action-Aufruf laesst sich von aussen praktisch nicht nachbauen (siehe unten), die
   Regel als reine Funktion dagegen direkt. Wer eine Regel aendert, aendert sie dort.
3. **Der Instagram-Name wird normalisiert** (fuehrendes `@` faellt weg, leer wird `null`), sonst
   stehen `@name` und `name` als zwei verschiedene Werte in der Spalte.
4. **Der Navigationspunkt ist fest „Mein Konto"**, nicht „Anmelden"/„Mein Konto" je nach Sitzung.
   Sonst muesste das Layout auf **jeder** Seite die Sitzung lesen und waere durchgehend dynamisch.
   `/mitglied` leitet ohne Anmeldung selbst weiter.
5. **Der Instagram-Name wird bei der Registrierung nachgetragen**, nicht mitgeschickt: er gehoert
   zu `mitglied`, nicht zu Better Auth. Schlaegt der Nachtrag fehl, ist das Konto trotzdem da und
   der Name unter `/mitglied` nachtragbar — dafuer wird die Registrierung nicht abgebrochen.
6. **`Input` setzt „(Pflichtangabe)" nicht automatisch aus `required`.** In diesen Formularen ist
   fast jedes Feld Pflicht; der Marker an jedem Label waere Rauschen. Freiwillige Felder sagen es
   im `hinweis`.

### Was beim Umsetzen anders kam als geplant

1. **Ein Server-Action-Aufruf laesst sich mit `curl` nicht sinnvoll nachbauen.** Weder der
   `Next-Action`-Header mit `1_feld`-Namen noch die `$ACTION_ID_<id>`-Variante brachten die
   Felder an: die Datenbank blieb unveraendert, obwohl die Aktion lief. Wer hier testet und aus
   der Fehlermeldung „Bitte einen Anzeigenamen angeben" schliesst, die Pruefung funktioniere,
   sitzt einem falschen Positiv auf: das ist nur der Zweig fuer den leeren Namen.
   **Deshalb die reine Funktion in `lib/mitglied-eingabe.ts`** — sie ist mit `npx tsx` direkt
   pruefbar. Die Action-Id steht uebrigens im Client-Chunk:
   `curl -s http://localhost:3000/_next/static/chunks/<chunk>._.js | grep -oE '"[0-9a-f]{40,}"'`.
   **Achtung, Fehlschluss:** die Log-Zeile `ƒ profilSpeichern({}) in 511ms` zeigt **immer** `{}`,
   auch wenn das FormData vollstaendig ankommt — der Browser-Durchlauf hat das bewiesen. Sie ist
   kein Beleg fuer leere Argumente.
2. **`--data-urlencode` mit `-G` verfaelschte in einem Testlauf die Ergebnisse** (ein `/produkte`
   kam als leerer Parameter an). Weiterleitungsziele mit fertig kodierter URL testen, nicht mit
   `-G`.
3. **Tastatur- und Klick-Simulation im Browserwerkzeug kam auf dieser Seite nicht an** — die
   Felder blieben leer, und der Submit scheiterte still an der nativen `required`-Pruefung, ohne
   dass der eigene Handler lief. Das sah zweimal nach einem Fehler im Formular aus und war
   keiner. Wer hier wieder testet: Werte ueber den `value`-Setter von `HTMLInputElement.prototype`
   setzen, ein `input`-Event verschicken und `form.requestSubmit()` aufrufen — nur so sieht React
   die Eingabe.

### Verifiziert (gegen `next dev` mit echtem D1-Binding)

- `npm run typecheck`, `npx eslint .` und `npm run build` gruen; die drei neuen Routen
  `/anmelden`, `/registrieren`, `/mitglied` erscheinen im Routenbaum.
- Ohne Sitzung: `/anmelden` 200, `/registrieren` 200, `/mitglied` **307** auf
  `/anmelden?weiter=%2Fmitglied`.
- Mit Sitzung: `/mitglied` 200 mit E-Mail, Badge „Freigabe steht aus" und „Rolle: Mitglied";
  `/anmelden` und `/registrieren` leiten **307** auf `/mitglied`.
- Nach `freigegeben = 1` in der Datenbank: Badge „Freigegeben", der §-10-HWG-Hinweis erscheint,
  der Instagram-Name steht im Formularfeld.
- **Offene Weiterleitung abgewehrt:** `?weiter=` mit `https://fremd.example`, `//fremd.example`
  und `/remd.example` faellt auf `/mitglied` zurueck, `/produkte` geht durch.
- **`profilSpeichern` ohne Sitzung:** 500 `Nicht angemeldet.` aus `mitgliedErforderlich()` —
  der Aufruf am Formular vorbei greift also nicht.
- **`profilEingabePruefen`: 11 Faelle, alle bestanden** — Trimmen, `@`-Entfernung (auch mehrfach),
  leerer Name, Grenzen 60 und 30 Zeichen (je genau/ueberschritten), Sonderzeichen, Leerzeichen,
  nur `@` ergibt `null`.
- Testnutzer wieder geloescht, `user` und `mitglied` sind leer — die Kaskade greift.

### Verifiziert im Browser (echter Durchlauf durch die Oberflaeche)

- Passwort-Gate, dann Registrierung: ungleiche Passwoerter zeigen „Die beiden Passwoerter stimmen
  nicht ueberein", gleiche legen das Konto an und leiten auf `/mitglied`.
- Der Instagram-Nachtrag nach der Registrierung greift: `@Browser.Kanal_1` steht als
  `Browser.Kanal_1` in der Spalte.
- `/mitglied`: Profil speichern mit ungueltigem Handle zeigt die Meldung der Server Action,
  gueltig gespeichert steht getrimmt und normalisiert in der Datenbank („  Geaenderter Name  "
  -> `Geänderter Name`, `@Neuer.Kanal_2` -> `Neuer.Kanal_2`), Bestaetigung „Gespeichert."
- Abmelden: `/mitglied` faellt danach auf `/anmelden?weiter=%2Fmitglied` zurueck.
- Anmelden: falsches Passwort zeigt „E-Mail-Adresse oder Passwort ist falsch", richtiges fuehrt
  auf `/mitglied`.
- Dark und Light geprueft (`data-theme="light"`): Badge „✓ Freigegeben" mit Haken, Rolle,
  §-10-HWG-Hinweis, Felder und Fokusringe sitzen in beiden Themes.

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

## Block C — Mailversand (vom Nutzer beauftragt, nach Block B)

Eingetaktet am 2026-09-23. **Erst nach Block B**, weil es den Produktkern nicht beruehrt.
Heute verschickt das Projekt **keine** E-Mail: es gibt keinen Mailversand-Dienst, kein
Kontaktformular, und die E-Mail-Bestaetigung in Better Auth ist bewusst aus (die Verifizierung
ist die manuelle Freigabe). Es gibt also auch keine „normale Routine“, die man testen koennte —
die entsteht erst hier.

1. **Mailversand einbauen.** Kandidat: Cloudflare Email Sending (Skill
   `cloudflare:cloudflare-email-service`), passend zum Worker-Stack und ohne zweiten Anbieter.
   Absenderdomain und DNS sind Voraussetzung. Zugangsdaten als Worker-Secret, nie in
   `wrangler.jsonc` (siehe `edge-stack-master`, §7).
2. **Benachrichtigung an den Betreiber, wenn sich jemand registriert** und auf Freigabe wartet —
   Ziel ist die Betreiber-Adresse, Ausloeser der `user.create.after`-Hook in `lib/auth.ts`, der
   heute schon den `mitglied`-Satz anlegt. **Der Versand darf die Registrierung nicht scheitern
   lassen**, gleiche Begruendung wie beim Instagram-Nachtrag in Schritt 2: das Konto ist wichtiger
   als die Benachrichtigung.
3. Danach ist eine Testmail „so wie sie beim Nutzer ankommt“ ueber die echte Routine moeglich.

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
2. ~~Registrierung, Anmeldung, `/mitglied`.~~ **erledigt**
3. ~~`/admin` mit Freigabe von Mitgliedern.~~ **erledigt**
4. ~~Umfragemodell, Server Actions für Vorschlag und Stimme, Umfragephasen.~~ **erledigt**
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
  (Akzent: klinisches Tiefblau `oklch(0.52 0.11 240)`), 12 Primitives in `components/ui/`
- Edge-Regelwerk: `.claude/skills/edge-stack-master.md` — auf D1 umgeschrieben
- Produktkomponenten: `ProduktCard`, `CannabinoidBar`, `TerpenChips`, `GlasHeader`, `TerpenMap`,
  `BestandTabelle`, `BewertungsListe`, `InstagramEmbed`, `FilterLeiste`, `AktiveFilter`
- Anmeldung: Better Auth mit D1, `lib/auth.ts`, `lib/session.ts` als einzige Rechtequelle,
  `components/auth/`
- Seiten: Layout, Landing, `/produkte` mit Live-Filter, `/produkte/[slug]`, `/apotheken` und
  Detail, `/anmelden`, `/registrieren`, `/mitglied`, `/admin`, 404
