-- ===========================================================================
--  cn-medcan - Row Level Security, Rollen-Gate und Check-Constraints
-- ===========================================================================
--
--  AUSFUEHRUNG (eine der beiden Varianten):
--
--  a) Supabase SQL Editor:
--     Projekt oeffnen -> SQL Editor -> New query -> Inhalt dieser Datei
--     einfuegen -> "Run". Laeuft als Superuser, darf also DDL und Policies.
--
--  b) psql mit der DIREKTEN Verbindung (Port 5432, NICHT der Pooler):
--        psql "$DIRECT_URL" -f supabase/rls.sql
--     Der Transaction-Pooler (Port 6543) vertraegt dieses DDL nicht.
--
--  WICHTIG: Dieses Skript muss nach JEDER Prisma-Migration erneut laufen.
--  `prisma migrate` kennt weder RLS noch Policies noch diese Constraints und
--  kann sie beim Nachziehen des Schemas verwerfen. Das Skript ist idempotent
--  (jedes `create policy` hat ein `drop policy if exists` davor, Constraints
--  werden ueber pg_constraint geprueft), mehrfaches Ausfuehren ist also
--  gefahrlos und der Regelfall.
--
--  HINWEIS zur Service-Rolle: Prisma und die Supabase-Admin-Zugriffe laufen
--  mit `service_role`. Diese Rolle umgeht RLS vollstaendig (BYPASSRLS) -
--  alle Policies hier gelten ausschliesslich fuer `anon` (nicht eingeloggt)
--  und `authenticated` (eingeloggter Supabase-Auth-Nutzer).
-- ===========================================================================


-- ---------------------------------------------------------------------------
--  1. Fachkreis-Gate (§10 HWG)
-- ---------------------------------------------------------------------------
--  §10 HWG verbietet Publikumswerbung fuer verschreibungspflichtige
--  Arzneimittel. Preise und Bestaende, die als solche Werbung gelten koennen,
--  sind in `pharmacy_stock` ueber `nur_fuer_fachkreise` markiert und duerfen
--  nur Fachkreisen (Aerzte, Apotheker) angezeigt werden.
--
--  Die Zugehoerigkeit steht als Claim im JWT:
--      app_metadata.rolle = 'fachkreis' | 'admin'
--
--  ACHTUNG - Sicherheitsgrenze:
--  Dieser Claim wird AUSSCHLIESSLICH serverseitig ueber die Supabase-Admin-API
--  gesetzt (`supabase.auth.admin.updateUserById(id, { app_metadata: { rolle }})`
--  mit dem Service-Role-Key). `app_metadata` ist - anders als `user_metadata` -
--  fuer den Client nicht schreibbar. Der Claim darf NIEMALS aus einem
--  Client-Request, einem Header, einem Cookie oder `user_metadata` uebernommen
--  werden; sonst kann sich jeder Besucher selbst zum Fachkreis erklaeren.
--
--  `security definer` mit leerem `search_path`: die Funktion ist nicht ueber
--  einen untergeschobenen Schema-Pfad umlenkbar, deshalb sind alle Aufrufe
--  darin voll qualifiziert.
create or replace function public.ist_fachkreis()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'rolle') in ('fachkreis', 'admin'),
    false
  );
$$;

comment on function public.ist_fachkreis() is
  'Prueft den JWT-Claim app_metadata.rolle auf fachkreis oder admin. Der Claim wird nur serverseitig ueber die Supabase-Admin-API gesetzt und kommt nie vom Client.';

revoke all on function public.ist_fachkreis() from public;
grant execute on function public.ist_fachkreis() to anon, authenticated, service_role;


-- ---------------------------------------------------------------------------
--  2. RLS auf allen acht Tabellen aktivieren
-- ---------------------------------------------------------------------------
--  Ohne Policy bedeutet aktiviertes RLS: keine Zeile sichtbar (deny by default).
alter table public.unternehmen     enable row level security;
alter table public.terpene         enable row level security;
alter table public.strains         enable row level security;
alter table public.strain_terpene  enable row level security;
alter table public.pharmacies      enable row level security;
alter table public.pharmacy_stock  enable row level security;
alter table public.chargen         enable row level security;
alter table public.reviews         enable row level security;


-- ---------------------------------------------------------------------------
--  3. Stammdaten - oeffentlich lesbar, nie schreibbar
-- ---------------------------------------------------------------------------
--  Bewusst NUR `select`. Es gibt kein insert/update/delete fuer `anon` oder
--  `authenticated` auf Stammdaten - die pflegt ausschliesslich die
--  Service-Rolle (Seed, Import, Admin-Jobs), die RLS ohnehin umgeht.

-- strains: nur aktive Produkte. Ausgelistetes bleibt fuer die Historie in der
-- Tabelle, ist aber oeffentlich nicht sichtbar.
drop policy if exists "strains_select_public" on public.strains;
create policy "strains_select_public"
  on public.strains
  for select
  to anon, authenticated
  using (aktiv = true);

drop policy if exists "terpene_select_public" on public.terpene;
create policy "terpene_select_public"
  on public.terpene
  for select
  to anon, authenticated
  using (true);

drop policy if exists "strain_terpene_select_public" on public.strain_terpene;
create policy "strain_terpene_select_public"
  on public.strain_terpene
  for select
  to anon, authenticated
  using (true);

drop policy if exists "pharmacies_select_public" on public.pharmacies;
create policy "pharmacies_select_public"
  on public.pharmacies
  for select
  to anon, authenticated
  using (true);

drop policy if exists "unternehmen_select_public" on public.unternehmen;
create policy "unternehmen_select_public"
  on public.unternehmen
  for select
  to anon, authenticated
  using (true);

drop policy if exists "chargen_select_public" on public.chargen;
create policy "chargen_select_public"
  on public.chargen
  for select
  to anon, authenticated
  using (true);


-- ---------------------------------------------------------------------------
--  4. pharmacy_stock - Preise hinter dem Fachkreis-Gate
-- ---------------------------------------------------------------------------
--  Zeilen mit `nur_fuer_fachkreise = false` sind fuer alle lesbar. Alles
--  andere verlangt den serverseitig gesetzten Rollen-Claim (siehe Abschnitt 1).
--  Kein Schreibrecht fuer anon/authenticated: Bestaende und Preise pflegt die
--  Service-Rolle.
drop policy if exists "pharmacy_stock_select_public" on public.pharmacy_stock;
create policy "pharmacy_stock_select_public"
  on public.pharmacy_stock
  for select
  to anon, authenticated
  using (nur_fuer_fachkreise = false or public.ist_fachkreis());


-- ---------------------------------------------------------------------------
--  5. reviews - eigene Bewertungen schreiben, Freigabe nur durch Redaktion
-- ---------------------------------------------------------------------------
--  Die Freigabe (`freigegeben = true`) setzt AUSSCHLIESSLICH die Service-Rolle
--  in einem redaktionellen Schritt (Moderation). Keine Policy hier erlaubt
--  `anon` oder `authenticated`, die eigene Bewertung freizugeben - weder beim
--  `insert` (with check erzwingt `freigegeben = false`) noch beim `update`
--  (using UND with check erzwingen `freigegeben = false`).

-- Lesen: freigegebene Bewertungen fuer alle, eigene immer - auch unfreigegeben,
-- damit der Autor seinen Beitrag in der Moderationswarteschlange sieht.
drop policy if exists "reviews_select_public" on public.reviews;
create policy "reviews_select_public"
  on public.reviews
  for select
  to anon, authenticated
  using (freigegeben = true or autor_id = auth.uid());

-- Anlegen: nur eingeloggt, nur unter eigener Autor-ID, nur unfreigegeben.
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own"
  on public.reviews
  for insert
  to authenticated
  with check (autor_id = auth.uid() and freigegeben = false);

-- Aendern: nur eigene, noch nicht freigegebene Zeilen. Der `with check`-Teil
-- verhindert sowohl das Selbst-Freigeben als auch das Umschreiben der
-- Autor-ID auf einen anderen Nutzer.
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own"
  on public.reviews
  for update
  to authenticated
  using (autor_id = auth.uid() and freigegeben = false)
  with check (autor_id = auth.uid() and freigegeben = false);

-- Loeschen: nur eigene Bewertungen, auch freigegebene (Recht auf Loeschung).
drop policy if exists "reviews_delete_own" on public.reviews;
create policy "reviews_delete_own"
  on public.reviews
  for delete
  to authenticated
  using (autor_id = auth.uid());


-- ---------------------------------------------------------------------------
--  6. Check-Constraints
-- ---------------------------------------------------------------------------
--  `alter table ... add constraint` kennt KEIN `if not exists`. Deshalb wird
--  jeder Constraint in einem do-Block gegen pg_constraint geprueft und nur
--  angelegt, wenn er fehlt. Das macht das Skript wiederholbar.
do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select *
    from (
      values
        -- strains: THC/CBD-Spannen und Wertebereiche
        ('strains',        'strains_thc_spanne_chk',        'thc_min_prozent <= thc_max_prozent'),
        ('strains',        'strains_cbd_spanne_chk',        'cbd_min_prozent <= cbd_max_prozent'),
        ('strains',        'strains_thc_min_bereich_chk',   'thc_min_prozent >= 0 and thc_min_prozent <= 100'),
        ('strains',        'strains_thc_max_bereich_chk',   'thc_max_prozent >= 0 and thc_max_prozent <= 100'),
        ('strains',        'strains_cbd_min_bereich_chk',   'cbd_min_prozent >= 0 and cbd_min_prozent <= 100'),
        ('strains',        'strains_cbd_max_bereich_chk',   'cbd_max_prozent >= 0 and cbd_max_prozent <= 100'),

        -- pharmacy_stock: Preis nie negativ
        ('pharmacy_stock', 'pharmacy_stock_preis_chk',      'preis_pro_gramm_cent is null or preis_pro_gramm_cent >= 0'),

        -- strain_terpene: rang 1 ist das dominante Terpen, 0 gibt es nicht
        ('strain_terpene', 'strain_terpene_rang_chk',       'rang >= 1'),

        -- reviews: die fuenf Noten jeweils 1..5, Restfeuchte 0..100
        ('reviews',        'reviews_aussehen_chk',          'aussehen between 1 and 5'),
        ('reviews',        'reviews_geruch_chk',            'geruch between 1 and 5'),
        ('reviews',        'reviews_geschmack_chk',         'geschmack between 1 and 5'),
        ('reviews',        'reviews_wirkung_chk',           'wirkung between 1 and 5'),
        ('reviews',        'reviews_konsistenz_chk',        'konsistenz between 1 and 5'),
        ('reviews',        'reviews_feuchtigkeit_chk',      'feuchtigkeit_prozent is null or (feuchtigkeit_prozent >= 0 and feuchtigkeit_prozent <= 100)'),

        -- pharmacies: Lieferzeitspanne und deutsche PLZ (genau fuenf Ziffern)
        ('pharmacies',     'pharmacies_lieferzeit_chk',     'lieferzeit_tage_min <= lieferzeit_tage_max'),
        ('pharmacies',     'pharmacies_plz_chk',            'plz ~ ''^[0-9]{5}$''')
    ) as t(tabelle, name, bedingung)
  loop
    if not exists (
      select 1
      from pg_constraint c
      join pg_class     r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
      where n.nspname = 'public'
        and r.relname  = v_constraint.tabelle
        and c.conname  = v_constraint.name
    ) then
      execute format(
        'alter table public.%I add constraint %I check (%s)',
        v_constraint.tabelle, v_constraint.name, v_constraint.bedingung
      );
    end if;
  end loop;
end
$$;
