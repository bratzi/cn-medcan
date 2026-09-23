-- ===========================================================================
--  cn-medcan - Wertepruefungen fuer Cloudflare D1 (SQLite)
-- ===========================================================================
--
--  AUSFUEHRUNG:
--      npx wrangler d1 execute cn-medcan-db --local  --file db/constraints.sql
--      npx wrangler d1 execute cn-medcan-db --remote --file db/constraints.sql
--
--  WICHTIG: Dieses Skript muss nach JEDER Migration erneut laufen. Prisma
--  kennt diese Regeln nicht, und SQLite verwirft beim Umbau einer Tabelle
--  (Prisma macht das als create/copy/drop/rename) alle daran haengenden
--  Trigger. Das Skript ist idempotent - jeder Trigger hat ein
--  `drop trigger if exists` davor -, mehrfaches Ausfuehren ist also gefahrlos
--  und der Regelfall.
--
--  WARUM TRIGGER UND NICHT `check`:
--  SQLite kann CHECK-Constraints nur beim `create table` setzen, es gibt kein
--  `alter table ... add constraint`. Die Tabellen erzeugt aber Prisma aus dem
--  Schema, und Prisma kennt diese Bedingungen nicht. Ein Trigger ist das
--  einzige nachruestbare Mittel mit derselben Wirkung: die Schreiboperation
--  bricht mit `RAISE(ABORT, ...)` ab und die Zeile entsteht gar nicht erst.
--
--  WAS HIER NICHT MEHR STEHT - und warum das vertretbar ist:
--  Die frueheren RLS-Policies aus supabase/rls.sql sind ersatzlos entfallen.
--  RLS greift nur, wenn die Verbindung eine Nutzeridentitaet traegt; Prisma
--  verbindet als Eigentuemer, die Policies waren also ausschliesslich auf dem
--  supabase-js-Pfad wirksam, den es nicht mehr gibt. Die fachliche
--  Sichtbarkeitsgrenze - das Fachkreis-Gate nach Paragraph 10 HWG - liegt in
--  der Abfrageschicht: bestandSichtbarkeit() in lib/query/strains.ts. Sie ist
--  dort die EINZIGE Stelle, die die Bedingung formuliert. Wer eine neue
--  Abfrage auf pharmacy_stock schreibt, geht ueber diese Funktion.
--
--  Die Werteliste hier und db/enums.ts muessen uebereinstimmen. Wer dort
--  einen Wert ergaenzt, ergaenzt ihn hier mit - sonst weist die Datenbank ihn ab.
-- ===========================================================================

-- ---------------------------------------------------------------------------
--  unternehmen
-- ---------------------------------------------------------------------------
drop trigger if exists unternehmen_insert_chk;
create trigger unternehmen_insert_chk
before insert on unternehmen
for each row
begin
  select case when NEW.rolle not in ('HERSTELLER','IMPORTEUR','BEIDES') then raise(abort, 'unternehmen.rolle: unbekannter Wert') end;
end;

drop trigger if exists unternehmen_update_chk;
create trigger unternehmen_update_chk
before update on unternehmen
for each row
begin
  select case when NEW.rolle not in ('HERSTELLER','IMPORTEUR','BEIDES') then raise(abort, 'unternehmen.rolle: unbekannter Wert') end;
end;

-- ---------------------------------------------------------------------------
--  terpene
-- ---------------------------------------------------------------------------
drop trigger if exists terpene_insert_chk;
create trigger terpene_insert_chk
before insert on terpene
for each row
begin
  select case when NEW.geschmack not in ('DIESEL','ZITRUS','ERDIG','SUESS','WUERZIG','BLUMIG','HOLZIG','KRAEUTRIG') then raise(abort, 'terpene.geschmack: unbekannter Wert') end;
end;

drop trigger if exists terpene_update_chk;
create trigger terpene_update_chk
before update on terpene
for each row
begin
  select case when NEW.geschmack not in ('DIESEL','ZITRUS','ERDIG','SUESS','WUERZIG','BLUMIG','HOLZIG','KRAEUTRIG') then raise(abort, 'terpene.geschmack: unbekannter Wert') end;
end;

-- ---------------------------------------------------------------------------
--  strains
-- ---------------------------------------------------------------------------
drop trigger if exists strains_insert_chk;
create trigger strains_insert_chk
before insert on strains
for each row
begin
  select case when NEW.kultivar_typ not in ('INDICA','SATIVA','HYBRID','RUDERALIS') then raise(abort, 'strains.kultivar_typ: unbekannter Wert') end;
  select case when NEW.darreichungsform not in ('BLUETE','EXTRAKT','GRANULAT') then raise(abort, 'strains.darreichungsform: unbekannter Wert') end;
  select case when NEW.bestrahlung not in ('GAMMA','E_BEAM','UNBESTRAHLT','UNBEKANNT') then raise(abort, 'strains.bestrahlung: unbekannter Wert') end;
  select case when NEW.thc_min_prozent > NEW.thc_max_prozent then raise(abort, 'strains: thc_min_prozent groesser als thc_max_prozent') end;
  select case when NEW.cbd_min_prozent > NEW.cbd_max_prozent then raise(abort, 'strains: cbd_min_prozent groesser als cbd_max_prozent') end;
  select case when NEW.thc_min_prozent < 0 or NEW.thc_min_prozent > 100 then raise(abort, 'strains.thc_min_prozent ausserhalb 0..100') end;
  select case when NEW.thc_max_prozent < 0 or NEW.thc_max_prozent > 100 then raise(abort, 'strains.thc_max_prozent ausserhalb 0..100') end;
  select case when NEW.cbd_min_prozent < 0 or NEW.cbd_min_prozent > 100 then raise(abort, 'strains.cbd_min_prozent ausserhalb 0..100') end;
  select case when NEW.cbd_max_prozent < 0 or NEW.cbd_max_prozent > 100 then raise(abort, 'strains.cbd_max_prozent ausserhalb 0..100') end;
  select case when NEW.suchtext <> lower(NEW.suchtext) then raise(abort, 'strains.suchtext muss kleingeschrieben sein') end;
end;

drop trigger if exists strains_update_chk;
create trigger strains_update_chk
before update on strains
for each row
begin
  select case when NEW.kultivar_typ not in ('INDICA','SATIVA','HYBRID','RUDERALIS') then raise(abort, 'strains.kultivar_typ: unbekannter Wert') end;
  select case when NEW.darreichungsform not in ('BLUETE','EXTRAKT','GRANULAT') then raise(abort, 'strains.darreichungsform: unbekannter Wert') end;
  select case when NEW.bestrahlung not in ('GAMMA','E_BEAM','UNBESTRAHLT','UNBEKANNT') then raise(abort, 'strains.bestrahlung: unbekannter Wert') end;
  select case when NEW.thc_min_prozent > NEW.thc_max_prozent then raise(abort, 'strains: thc_min_prozent groesser als thc_max_prozent') end;
  select case when NEW.cbd_min_prozent > NEW.cbd_max_prozent then raise(abort, 'strains: cbd_min_prozent groesser als cbd_max_prozent') end;
  select case when NEW.thc_min_prozent < 0 or NEW.thc_min_prozent > 100 then raise(abort, 'strains.thc_min_prozent ausserhalb 0..100') end;
  select case when NEW.thc_max_prozent < 0 or NEW.thc_max_prozent > 100 then raise(abort, 'strains.thc_max_prozent ausserhalb 0..100') end;
  select case when NEW.cbd_min_prozent < 0 or NEW.cbd_min_prozent > 100 then raise(abort, 'strains.cbd_min_prozent ausserhalb 0..100') end;
  select case when NEW.cbd_max_prozent < 0 or NEW.cbd_max_prozent > 100 then raise(abort, 'strains.cbd_max_prozent ausserhalb 0..100') end;
  select case when NEW.suchtext <> lower(NEW.suchtext) then raise(abort, 'strains.suchtext muss kleingeschrieben sein') end;
end;

-- ---------------------------------------------------------------------------
--  strain_terpene
-- ---------------------------------------------------------------------------
drop trigger if exists strain_terpene_insert_chk;
create trigger strain_terpene_insert_chk
before insert on strain_terpene
for each row
begin
  select case when NEW.rang < 1 then raise(abort, 'strain_terpene.rang: 1 ist das dominante Terpen, 0 gibt es nicht') end;
  select case when NEW.konzentration_prozent is not null and (NEW.konzentration_prozent < 0 or NEW.konzentration_prozent > 100) then raise(abort, 'strain_terpene.konzentration_prozent ausserhalb 0..100') end;
end;

drop trigger if exists strain_terpene_update_chk;
create trigger strain_terpene_update_chk
before update on strain_terpene
for each row
begin
  select case when NEW.rang < 1 then raise(abort, 'strain_terpene.rang: 1 ist das dominante Terpen, 0 gibt es nicht') end;
  select case when NEW.konzentration_prozent is not null and (NEW.konzentration_prozent < 0 or NEW.konzentration_prozent > 100) then raise(abort, 'strain_terpene.konzentration_prozent ausserhalb 0..100') end;
end;

-- ---------------------------------------------------------------------------
--  pharmacies
-- ---------------------------------------------------------------------------
drop trigger if exists pharmacies_insert_chk;
create trigger pharmacies_insert_chk
before insert on pharmacies
for each row
begin
  select case when NEW.rezept_status not in ('E_REZEPT_ONLY','PAPIER_ONLY','BEIDES') then raise(abort, 'pharmacies.rezept_status: unbekannter Wert') end;
  select case when NEW.lieferzeit_tage_min > NEW.lieferzeit_tage_max then raise(abort, 'pharmacies: lieferzeit_tage_min groesser als lieferzeit_tage_max') end;
  select case when NEW.plz not glob '[0-9][0-9][0-9][0-9][0-9]' then raise(abort, 'pharmacies.plz: genau fuenf Ziffern erwartet') end;
end;

drop trigger if exists pharmacies_update_chk;
create trigger pharmacies_update_chk
before update on pharmacies
for each row
begin
  select case when NEW.rezept_status not in ('E_REZEPT_ONLY','PAPIER_ONLY','BEIDES') then raise(abort, 'pharmacies.rezept_status: unbekannter Wert') end;
  select case when NEW.lieferzeit_tage_min > NEW.lieferzeit_tage_max then raise(abort, 'pharmacies: lieferzeit_tage_min groesser als lieferzeit_tage_max') end;
  select case when NEW.plz not glob '[0-9][0-9][0-9][0-9][0-9]' then raise(abort, 'pharmacies.plz: genau fuenf Ziffern erwartet') end;
end;

-- ---------------------------------------------------------------------------
--  pharmacy_stock
-- ---------------------------------------------------------------------------
drop trigger if exists pharmacy_stock_insert_chk;
create trigger pharmacy_stock_insert_chk
before insert on pharmacy_stock
for each row
begin
  select case when NEW.status not in ('VERFUEGBAR','NACHBESTELLT','NICHT_LIEFERBAR','AUSGELISTET') then raise(abort, 'pharmacy_stock.status: unbekannter Wert') end;
  select case when NEW.preis_pro_gramm_cent is not null and NEW.preis_pro_gramm_cent < 0 then raise(abort, 'pharmacy_stock.preis_pro_gramm_cent negativ') end;
  select case when NEW.packung_gramm <= 0 then raise(abort, 'pharmacy_stock.packung_gramm muss groesser als 0 sein') end;
end;

drop trigger if exists pharmacy_stock_update_chk;
create trigger pharmacy_stock_update_chk
before update on pharmacy_stock
for each row
begin
  select case when NEW.status not in ('VERFUEGBAR','NACHBESTELLT','NICHT_LIEFERBAR','AUSGELISTET') then raise(abort, 'pharmacy_stock.status: unbekannter Wert') end;
  select case when NEW.preis_pro_gramm_cent is not null and NEW.preis_pro_gramm_cent < 0 then raise(abort, 'pharmacy_stock.preis_pro_gramm_cent negativ') end;
  select case when NEW.packung_gramm <= 0 then raise(abort, 'pharmacy_stock.packung_gramm muss groesser als 0 sein') end;
end;

-- ---------------------------------------------------------------------------
--  reviews
-- ---------------------------------------------------------------------------
drop trigger if exists reviews_insert_chk;
create trigger reviews_insert_chk
before insert on reviews
for each row
begin
  select case when NEW.aussehen not between 1 and 5 then raise(abort, 'reviews.aussehen ausserhalb 1..5') end;
  select case when NEW.geruch not between 1 and 5 then raise(abort, 'reviews.geruch ausserhalb 1..5') end;
  select case when NEW.geschmack not between 1 and 5 then raise(abort, 'reviews.geschmack ausserhalb 1..5') end;
  select case when NEW.wirkung not between 1 and 5 then raise(abort, 'reviews.wirkung ausserhalb 1..5') end;
  select case when NEW.konsistenz not between 1 and 5 then raise(abort, 'reviews.konsistenz ausserhalb 1..5') end;
  select case when NEW.feuchtigkeit_prozent is not null and (NEW.feuchtigkeit_prozent < 0 or NEW.feuchtigkeit_prozent > 100) then raise(abort, 'reviews.feuchtigkeit_prozent ausserhalb 0..100') end;
  select case when json_valid(NEW.geschmacks_matrix) = 0 then raise(abort, 'reviews.geschmacks_matrix ist kein gueltiges JSON') end;
end;

drop trigger if exists reviews_update_chk;
create trigger reviews_update_chk
before update on reviews
for each row
begin
  select case when NEW.aussehen not between 1 and 5 then raise(abort, 'reviews.aussehen ausserhalb 1..5') end;
  select case when NEW.geruch not between 1 and 5 then raise(abort, 'reviews.geruch ausserhalb 1..5') end;
  select case when NEW.geschmack not between 1 and 5 then raise(abort, 'reviews.geschmack ausserhalb 1..5') end;
  select case when NEW.wirkung not between 1 and 5 then raise(abort, 'reviews.wirkung ausserhalb 1..5') end;
  select case when NEW.konsistenz not between 1 and 5 then raise(abort, 'reviews.konsistenz ausserhalb 1..5') end;
  select case when NEW.feuchtigkeit_prozent is not null and (NEW.feuchtigkeit_prozent < 0 or NEW.feuchtigkeit_prozent > 100) then raise(abort, 'reviews.feuchtigkeit_prozent ausserhalb 0..100') end;
  select case when json_valid(NEW.geschmacks_matrix) = 0 then raise(abort, 'reviews.geschmacks_matrix ist kein gueltiges JSON') end;
end;


-- ---------------------------------------------------------------------------
--  mitglied
-- ---------------------------------------------------------------------------
-- Werte muessen mit MITGLIED_ROLLEN in db/enums.ts uebereinstimmen.
drop trigger if exists mitglied_insert_chk;
create trigger mitglied_insert_chk
before insert on mitglied
for each row
begin
  select case when NEW.rolle not in ('MITGLIED','FACHKREIS','ADMIN') then raise(abort, 'mitglied.rolle: unbekannter Wert') end;
  select case when length(trim(NEW.anzeigename)) = 0 then raise(abort, 'mitglied.anzeigename leer') end;
end;

drop trigger if exists mitglied_update_chk;
create trigger mitglied_update_chk
before update on mitglied
for each row
begin
  select case when NEW.rolle not in ('MITGLIED','FACHKREIS','ADMIN') then raise(abort, 'mitglied.rolle: unbekannter Wert') end;
  select case when length(trim(NEW.anzeigename)) = 0 then raise(abort, 'mitglied.anzeigename leer') end;
end;


-- ---------------------------------------------------------------------------
--  umfragen
-- ---------------------------------------------------------------------------
-- Werte muessen mit UMFRAGE_PHASEN in db/enums.ts uebereinstimmen.
--
-- Zusaetzlich haelt der zweite Test die Spalte `aktiv` und die Phase
-- zusammen: `aktiv` traegt 'AKTIV', solange die Runde laeuft, und NULL,
-- sobald sie beendet ist. Der Unique-Index auf `aktiv` laesst beliebig viele
-- NULL zu, aber nur ein einziges 'AKTIV' - daraus folgt "genau eine aktive
-- Umfrage". Ohne diesen Trigger koennte eine beendete Runde 'AKTIV' behalten
-- und damit jede neue Runde blockieren; eine laufende mit NULL wuerde die
-- Sperre umgehen. Die Regel gehoert in die Datenbank, weil D1 keine
-- Transaktionen hat und die Schreibschicht sie nicht atomar halten kann.
drop trigger if exists umfragen_insert_chk;
create trigger umfragen_insert_chk
before insert on umfragen
for each row
begin
  select case when NEW.phase not in ('VORSCHLAG','ABSTIMMUNG','BEENDET') then raise(abort, 'umfragen.phase: unbekannter Wert') end;
  select case when NEW.phase = 'BEENDET' and NEW.aktiv is not null then raise(abort, 'umfragen.aktiv: beendete Umfrage muss NULL tragen') end;
  select case when NEW.phase <> 'BEENDET' and NEW.aktiv is not 'AKTIV' then raise(abort, 'umfragen.aktiv: laufende Umfrage muss AKTIV tragen') end;
  select case when length(trim(NEW.titel)) = 0 then raise(abort, 'umfragen.titel leer') end;
  select case when NEW.community_plaetze < 1 then raise(abort, 'umfragen.community_plaetze: mindestens 1') end;
end;

drop trigger if exists umfragen_update_chk;
create trigger umfragen_update_chk
before update on umfragen
for each row
begin
  select case when NEW.phase not in ('VORSCHLAG','ABSTIMMUNG','BEENDET') then raise(abort, 'umfragen.phase: unbekannter Wert') end;
  select case when NEW.phase = 'BEENDET' and NEW.aktiv is not null then raise(abort, 'umfragen.aktiv: beendete Umfrage muss NULL tragen') end;
  select case when NEW.phase <> 'BEENDET' and NEW.aktiv is not 'AKTIV' then raise(abort, 'umfragen.aktiv: laufende Umfrage muss AKTIV tragen') end;
  select case when length(trim(NEW.titel)) = 0 then raise(abort, 'umfragen.titel leer') end;
  select case when NEW.community_plaetze < 1 then raise(abort, 'umfragen.community_plaetze: mindestens 1') end;
end;

-- ---------------------------------------------------------------------------
--  umfrage_optionen
-- ---------------------------------------------------------------------------
-- Werte muessen mit OPTION_HERKUNFT in db/enums.ts uebereinstimmen.
drop trigger if exists umfrage_optionen_insert_chk;
create trigger umfrage_optionen_insert_chk
before insert on umfrage_optionen
for each row
begin
  select case when NEW.herkunft not in ('GESETZT','COMMUNITY') then raise(abort, 'umfrage_optionen.herkunft: unbekannter Wert') end;
end;

drop trigger if exists umfrage_optionen_update_chk;
create trigger umfrage_optionen_update_chk
before update on umfrage_optionen
for each row
begin
  select case when NEW.herkunft not in ('GESETZT','COMMUNITY') then raise(abort, 'umfrage_optionen.herkunft: unbekannter Wert') end;
end;

-- ---------------------------------------------------------------------------
--  stimmen
-- ---------------------------------------------------------------------------
-- Auf einen GESETZTEN Platz darf nicht abgestimmt werden: er ist die Wahl des
-- Betreibers und traegt keinen Stimmenzaehler. Und eine Stimme muss zu einer
-- Option DERSELBEN Umfrage gehoeren - sonst liesse sich ueber die
-- Unique-Sperre (umfrage_id, mitglied_id) hinweg in einer fremden Runde
-- mitstimmen. Die Schreibschicht prueft das ebenfalls; hier steht es, weil
-- eine vergessene Pruefung sonst still danebengeht.
drop trigger if exists stimmen_insert_chk;
create trigger stimmen_insert_chk
before insert on stimmen
for each row
begin
  select case when (select herkunft from umfrage_optionen where id = NEW.option_id) <> 'COMMUNITY'
    then raise(abort, 'stimmen: nur COMMUNITY-Optionen sind abstimmbar') end;
  select case when (select umfrage_id from umfrage_optionen where id = NEW.option_id) <> NEW.umfrage_id
    then raise(abort, 'stimmen: Option gehoert zu einer anderen Umfrage') end;
  select case when (select phase from umfragen where id = NEW.umfrage_id) <> 'ABSTIMMUNG'
    then raise(abort, 'stimmen: Umfrage ist nicht in der Abstimmungsphase') end;
end;

drop trigger if exists stimmen_update_chk;
create trigger stimmen_update_chk
before update on stimmen
for each row
begin
  select case when (select herkunft from umfrage_optionen where id = NEW.option_id) <> 'COMMUNITY'
    then raise(abort, 'stimmen: nur COMMUNITY-Optionen sind abstimmbar') end;
  select case when (select umfrage_id from umfrage_optionen where id = NEW.option_id) <> NEW.umfrage_id
    then raise(abort, 'stimmen: Option gehoert zu einer anderen Umfrage') end;
end;
