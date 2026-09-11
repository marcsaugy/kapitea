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
-- ============================================================

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
-- 5. ROUTAGE — NE JAMAIS ASSIGNER UN LEAD À QUI NE PEUT PAS LE LIRE
-- ============================================================
-- Le trigger d'origine résout un conseiller à partir de la commune, et
-- retombe sur Marc quand rien ne correspond. Deux choses le cassent en
-- multi-marques : Kapitea ne demande jamais de commune (localisation est
-- toujours null), et surtout rien n'empêche d'assigner un lead Kapitea à
-- un conseiller Hypoteka-seul — qui ne le verrait pas, la RLS le lui
-- masquant. Le lead disparaîtrait alors de toutes les files à la fois.
create or replace function public.resolve_advisor_for_lead(p_brand text, p_localisation text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_advisor uuid;
begin
  -- Le routage géographique n'a de sens que pour Hypoteka : c'est le seul
  -- parcours qui collecte une commune.
  if p_brand = 'hypoteka' then
    v_advisor := public.resolve_advisor_for_localisation(p_localisation);
  end if;

  -- Filet de sécurité : on écarte un conseiller qui ne couvre pas la marque.
  if v_advisor is not null and not exists (
    select 1 from public.advisors
    where id = v_advisor and active = true and p_brand = any(brands)
  ) then
    v_advisor := null;
  end if;

  -- Repli : le premier admin actif qui couvre la marque, Marc en priorité.
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
-- Marc, admin, reçoit les deux marques.
update public.advisors
   set brands = array['hypoteka', 'kapitea']
 where slug = 'marc-saugy';

-- Pour ouvrir Kapitea à quelqu'un d'autre, une ligne suffit :
--   update public.advisors set brands = array['hypoteka','kapitea'] where slug = 'mikela-debonneville';
-- Pour un conseiller Kapitea uniquement :
--   update public.advisors set brands = array['kapitea'] where slug = '...';
-- Pour retirer un accès :
--   update public.advisors set brands = array['hypoteka'] where slug = '...';

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
