-- ============================================================
-- MIGRATION 01 — Base commune Hypoteka + Kapitea
--
-- À exécuter UNE FOIS dans l'éditeur SQL du projet Supabase EXISTANT
-- (celui d'Hypoteka). Kapitea n'a pas de projet à lui : les deux marques
-- écrivent dans la même table "leads" et se lisent dans le même CRM.
--
-- Prérequis : supabase/schema.sql d'Hypoteka déjà exécuté (tables
-- advisors, zones, communes_ch, leads, activities).
--
-- Idempotent : réexécutable sans dommage.
--
-- AUCUNE DONNÉE N'EST SUPPRIMÉE. L'éditeur SQL de Supabase affiche un
-- avertissement « destructive operations » parce qu'il voit des DROP :
-- ce sont uniquement des DROP POLICY et DROP CONSTRAINT, chacun suivi
-- immédiatement de sa recréation. Pas de DROP TABLE, pas de DROP COLUMN,
-- pas de DELETE, pas de TRUNCATE — les leads et les activités existants
-- sont conservés tels quels et reçoivent brand = 'hypoteka'.
--
-- Le tout est encadré par BEGIN/COMMIT : si une instruction échoue, rien
-- n'est appliqué et la base reste exactement dans son état d'avant.
-- ============================================================

begin;

-- ============================================================
-- 1. LA COLONNE QUI SÉPARE LES DEUX MARQUES
-- ============================================================
-- "brand" et pas "site_source" : ce n'est pas une métadonnée de
-- provenance qu'on affiche, c'est la clé qui décide qui a le droit de
-- lire la ligne. Le nom doit le dire à chaque policy qui l'utilise.
--
-- default 'hypoteka' : les leads déjà en base ont tous été créés par
-- Hypoteka, la valeur de reprise est donc juste par construction.
alter table public.leads
  add column if not exists brand text not null default 'hypoteka';

alter table public.leads drop constraint if exists leads_brand_valid;
alter table public.leads
  add constraint leads_brand_valid check (brand in ('hypoteka', 'kapitea'));

-- Montant du capital à placer (Kapitea). Hypoteka raisonne en prix_max /
-- hypo_max, qui sont des textes ; ici c'est un vrai montant sur lequel le
-- CRM doit pouvoir trier et sommer, donc numeric.
alter table public.leads
  add column if not exists montant_capital numeric;

-- Le CRM liste toujours "les leads de mes marques, les plus récents
-- d'abord" : c'est cet index-là qu'il lui faut, pas un sur brand seul.
create index if not exists leads_brand_created_idx
  on public.leads (brand, created_at desc);

comment on column public.leads.brand is
  'Marque émettrice du lead. Détermine qui peut le lire (voir advisors.brands).';
comment on column public.leads.montant_capital is
  'Kapitea : capital à placer, en CHF. Null pour les leads Hypoteka.';

-- Kapitea remplit "segment" avec son persona (lpp, heritage, divorce,
-- vente_maison, vente_entreprise) — la colonne existe déjà et fait le
-- travail. Pas de "type_persona" : deux colonnes pour la même chose
-- divergent toujours, et c'est la redondante qui finit par mentir.

-- ============================================================
-- 2. QUI A ACCÈS À QUELLE MARQUE
-- ============================================================
-- Un tableau sur "advisors" plutôt qu'une table de jonction : à deux
-- marques et neuf conseillers, la jonction n'apporterait qu'un join de
-- plus dans chaque policy. À la troisième marque, ou dès qu'un accès
-- porte une date de fin, il faudra normaliser.
alter table public.advisors
  add column if not exists brands text[] not null default array['hypoteka'];

alter table public.advisors drop constraint if exists advisors_brands_valid;
alter table public.advisors
  add constraint advisors_brands_valid check (
    brands <@ array['hypoteka', 'kapitea']::text[]
    -- array_length rend NULL sur un tableau vide, pas 0 : sans le
    -- coalesce, "brands = {}" passerait la contrainte et créerait un
    -- conseiller qui ne voit plus rien, sans message d'erreur.
    and coalesce(array_length(brands, 1), 0) >= 1
  );

comment on column public.advisors.brands is
  'Marques auxquelles ce conseiller a accès. Un lead d''une marque absente lui est invisible, même s''il lui est assigné.';

-- ============================================================
-- 3. LES FONCTIONS UTILITAIRES
-- ============================================================
-- Même motif que is_admin() : SECURITY DEFINER pour qu'une policy sur
-- "leads" puisse interroger "advisors" sans se heurter à la RLS
-- d'"advisors" (et, sur "advisors" elle-même, sans récursion).
create or replace function public.advisor_brands()
returns text[]
language sql
security definer
set search_path = public
stable
as $$
  select brands from public.advisors
  where user_id = auth.uid() and active = true
  limit 1;
$$;

-- Renvoie false pour un visiteur non connecté comme pour un compte sans
-- fiche conseiller : advisor_brands() vaut alors NULL, et NULL = any(NULL)
-- rend NULL, que la RLS traite comme un refus. Le coalesce rend ce refus
-- explicite plutôt que dépendant de cette subtilité.
create or replace function public.can_access_brand(p_brand text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select p_brand = any(coalesce(public.advisor_brands(), '{}'::text[]));
$$;

-- ============================================================
-- 4. RLS — LA MARQUE PASSE AVANT TOUT LE RESTE
-- ============================================================
-- La règle se lit : « la marque d'abord, l'assignation ensuite ».
-- Un admin Kapitea-seul ne voit aucun lead Hypoteka, alors qu'avant
-- is_admin() ouvrait tout. C'est le cœur de ce que la migration change.
drop policy if exists "leads_select_own_or_admin" on public.leads;
create policy "leads_select_own_or_admin"
  on public.leads for select
  using (
    public.can_access_brand(brand)
    and (advisor_id = public.current_advisor_id() or public.is_admin())
  );

drop policy if exists "leads_update_own_or_admin" on public.leads;
create policy "leads_update_own_or_admin"
  on public.leads for update
  using (
    public.can_access_brand(brand)
    and (advisor_id = public.current_advisor_id() or public.is_admin())
  )
  -- Sans "with check", un conseiller pourrait faire basculer un lead vers
  -- une marque qu'il ne couvre pas — et le perdre de vue au passage.
  with check (
    public.can_access_brand(brand)
    and (advisor_id = public.current_advisor_id() or public.is_admin())
  );

drop policy if exists "leads_delete_admin" on public.leads;
create policy "leads_delete_admin"
  on public.leads for delete
  using (public.is_admin() and public.can_access_brand(brand));

-- L'insertion publique reste ouverte au rôle anon : c'est ce qui permet
-- aux deux sites d'écrire avec la clé publique. La contrainte CHECK de
-- l'étape 1 est ce qui borne les valeurs de "brand" ; anon ne peut
-- toujours ni lire, ni modifier, ni supprimer quoi que ce soit.
drop policy if exists "leads_insert_public" on public.leads;
create policy "leads_insert_public"
  on public.leads for insert
  to anon
  with check (true);

-- ── Activités : elles héritent de la marque de leur lead ───────────────
-- Sans ça, un admin d'une seule marque lirait les notes d'appel de
-- l'autre — le contenu le plus sensible de la base.
drop policy if exists "activities_select_own_lead_or_admin" on public.activities;
create policy "activities_select_own_lead_or_admin"
  on public.activities for select
  using (exists (
    select 1 from public.leads l
    where l.id = lead_id
      and public.can_access_brand(l.brand)
      and (l.advisor_id = public.current_advisor_id() or public.is_admin())
  ));

drop policy if exists "activities_insert_own_lead_or_admin" on public.activities;
create policy "activities_insert_own_lead_or_admin"
  on public.activities for insert
  with check (exists (
    select 1 from public.leads l
    where l.id = lead_id
      and public.can_access_brand(l.brand)
      and (l.advisor_id = public.current_advisor_id() or public.is_admin())
  ));

-- ============================================================
-- 5. ROUTAGE — À CHAQUE MARQUE SA LOGIQUE
-- ============================================================
-- Hypoteka route à la commune (c'est le seul parcours qui en collecte
-- une). Kapitea distribue au tour de rôle : lead 1 au conseiller A,
-- lead 2 au B, et ainsi de suite, en boucle.
--
-- Le mode est une donnée, pas un "if" gravé dans une fonction : le
-- changer plus tard est un UPDATE d'une ligne, pas une migration.
create table if not exists public.lead_routing (
  brand           text primary key,
  mode            text not null default 'round_robin'
                    check (mode in ('geo', 'round_robin')),
  -- Mémoire du tourniquet : le dernier conseiller servi pour cette marque.
  last_advisor_id uuid references public.advisors(id) on delete set null,
  updated_at      timestamptz not null default now()
);

insert into public.lead_routing (brand, mode) values
  ('hypoteka', 'geo'),
  ('kapitea',  'round_robin')
on conflict (brand) do nothing;

comment on table public.lead_routing is
  'Mode d''attribution par marque, et état du tourniquet. geo = à la commune (zones), round_robin = chacun son tour.';

alter table public.lead_routing enable row level security;

-- Lecture réservée aux admins de la marque : sert à afficher « prochain
-- servi » dans le CRM. Personne n'écrit ici à la main — seule la fonction
-- d'attribution le fait, en SECURITY DEFINER.
drop policy if exists "lead_routing_select_admin" on public.lead_routing;
create policy "lead_routing_select_admin"
  on public.lead_routing for select
  using (public.is_admin() and public.can_access_brand(brand));

-- ── Le tourniquet ─────────────────────────────────────────────────────
-- Prend le conseiller qui suit le dernier servi, dans un ordre stable, et
-- revient au premier en fin de tour.
--
-- « Le suivant après le dernier » plutôt qu'un compteur modulo le nombre
-- de conseillers : un compteur redistribue tout le tour dès qu'on ajoute
-- ou désactive quelqu'un, alors qu'ici la rotation reprend simplement à sa
-- place. Si le dernier servi quitte la marque, sa position dans l'ordre
-- reste connue et le tour continue après elle.
create or replace function public.next_advisor_round_robin(p_brand text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last      uuid;
  v_last_name text;
  v_next      uuid;
begin
  insert into public.lead_routing (brand) values (p_brand)
    on conflict (brand) do nothing;

  -- "for update" verrouille la ligne du tourniquet : deux soumissions
  -- simultanées doivent recevoir deux conseillers différents, pas deux
  -- fois le même. La seconde attend ici que la première ait avancé.
  select last_advisor_id into v_last
    from public.lead_routing
   where brand = p_brand
     for update;

  -- Position du dernier servi dans l'ordre. On la lit même s'il n'a plus
  -- la marque ou n'est plus actif : ce qui compte est où reprendre.
  select full_name into v_last_name from public.advisors where id = v_last;

  select a.id into v_next
    from public.advisors a
   where a.active = true
     and p_brand = any(a.brands)
     and (v_last is null or (a.full_name, a.id) > (v_last_name, v_last))
   order by a.full_name, a.id
   limit 1;

  -- Fin du tour : on repart du début.
  if v_next is null then
    select a.id into v_next
      from public.advisors a
     where a.active = true and p_brand = any(a.brands)
     order by a.full_name, a.id
     limit 1;
  end if;

  if v_next is not null then
    update public.lead_routing
       set last_advisor_id = v_next, updated_at = now()
     where brand = p_brand;
  end if;

  return v_next;
end;
$$;

-- ── Le résolveur, commun aux deux marques ─────────────────────────────
-- Quel que soit le mode, un lead ne doit JAMAIS atterrir chez quelqu'un
-- qui n'a pas accès à la marque : la RLS le lui masquerait et le lead
-- disparaîtrait de toutes les files à la fois.
create or replace function public.resolve_advisor_for_lead(p_brand text, p_localisation text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mode    text;
  v_advisor uuid;
begin
  select mode into v_mode from public.lead_routing where brand = p_brand;

  if v_mode = 'geo' then
    v_advisor := public.resolve_advisor_for_localisation(p_localisation);
  else
    -- round_robin, et repli par défaut pour une marque non déclarée.
    v_advisor := public.next_advisor_round_robin(p_brand);
  end if;

  -- Filet de sécurité : on écarte un conseiller qui ne couvre pas la
  -- marque. Le tourniquet ne peut pas en produire, le routage géographique
  -- si — il ignore tout des marques.
  if v_advisor is not null and not exists (
    select 1 from public.advisors
    where id = v_advisor and active = true and p_brand = any(brands)
  ) then
    v_advisor := null;
  end if;

  -- Dernier repli : un admin actif qui couvre la marque, Marc en priorité.
  -- Mieux vaut un lead dans la file de quelqu'un que non assigné : un lead
  -- sans advisor_id n'apparaît chez personne sauf les admins de sa marque.
  if v_advisor is null then
    select id into v_advisor from public.advisors
    where active = true and role = 'admin' and p_brand = any(brands)
    order by (slug = 'marc-saugy') desc, full_name
    limit 1;
  end if;

  return v_advisor;
end;
$$;

-- Le trigger leads_auto_assign existe déjà et pointe sur cette fonction :
-- la remplacer suffit, il n'y a pas à recréer le trigger.
create or replace function public.assign_lead_advisor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.advisor_id := public.resolve_advisor_for_lead(new.brand, new.localisation);
  new.assigned_at := now();
  return new;
end;
$$;

-- ============================================================
-- 6. ATTRIBUTION DES ACCÈS
-- ============================================================
-- Par défaut (étape 2), les neuf conseillers restent Hypoteka-seuls.
-- Trois personnes travaillent sur les deux marques — ce sont elles, et
-- elles seules, qui se partagent les leads Kapitea au tour de rôle
-- (section 5). Ajouter quelqu'un ici l'ajoute au tourniquet.
update public.advisors
   set brands = array['hypoteka', 'kapitea']
 where slug in ('marc-saugy', 'julien-schaedgen', 'samuel-moyo');

-- Le tourniquet repart de zéro si la liste change en cours de route :
-- inutile de toucher à lead_routing, il reprend simplement à la position
-- suivante dans le nouvel ordre.

-- Pour ouvrir Kapitea à quelqu'un d'autre :
--   update public.advisors set brands = array['hypoteka','kapitea'] where slug = '...';
-- Pour un conseiller Kapitea uniquement :
--   update public.advisors set brands = array['kapitea'] where slug = '...';
-- Pour retirer l'accès Kapitea (le sort aussi du tourniquet) :
--   update public.advisors set brands = array['hypoteka'] where slug = '...';

commit;

-- ============================================================
-- 7. VÉRIFICATION
-- ============================================================
-- À lire après exécution : chaque ligne doit refléter ce qui précède.
--
--   select slug, role, active, brands from public.advisors order by slug;
--   select brand, count(*) from public.leads group by brand;
--
-- Test réel des policies, en se connectant au CRM avec un compte
-- Hypoteka-seul : /crm/leads ne doit afficher aucun lead Kapitea.
-- Un test SQL en tant que "postgres" ne prouve rien — ce rôle contourne
-- la RLS (BYPASSRLS) et voit tout quoi qu'il arrive.
