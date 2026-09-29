-- ============================================================
-- MIGRATION 03 — Un seul tourniquet pour les leads Kapitea
--
-- À exécuter UNE FOIS dans l'éditeur SQL du projet Supabase, après
-- migration-01-multi-marques.sql. Réexécutable sans dommage.
--
-- LE PROBLÈME
-- La migration 003_deductions_v1.sql d'Hypoteka (16.09) a ajouté un
-- second trigger d'attribution, "leads_assign_via_routing", à côté de
-- "leads_auto_assign" posé par la migration 01. Postgres déclenche les
-- triggers BEFORE INSERT par ordre alphabétique : le nouveau passe en
-- premier, choisit un conseiller dans l'ordre de leurs identifiants et
-- avance le tourniquet ; celui de la migration 01 passe ensuite, repart
-- de ce conseiller-là, en choisit un autre dans l'ordre des noms et
-- écrase le premier choix.
--
-- Chaque lead fait donc avancer le tourniquet deux fois, selon deux
-- ordres différents. Selon les identifiants, la rotation se referme sur
-- deux ou trois conseillers, voire sur un seul, et les autres ne
-- reçoivent plus rien : c'est la répartition constatée en production
-- (Julien 6, Samuel 1, Brahim 1 sur 15 leads).
--
-- LA CORRECTION
-- On retire le second trigger et ses deux fonctions, que rien d'autre
-- n'appelle. Reste celui de la migration 01, qui verrouille le
-- tourniquet contre les soumissions simultanées, écarte un conseiller
-- sans accès à la marque et replie sur un admin plutôt que de laisser
-- un lead sans conseiller.
--
-- Le reste de la migration 003 (canton, température, relances) n'est
-- pas touché. Aucune donnée n'est modifiée : les leads déjà attribués
-- gardent leur conseiller, le tourniquet reprend après le dernier servi.
-- ============================================================

begin;

drop trigger if exists leads_assign_via_routing on public.leads;
drop function if exists public.assign_lead_via_routing_trigger();
drop function if exists public.assign_lead_via_routing(text, text);

-- ============================================================
-- GARDE-FOU
-- ============================================================
-- Il doit rester exactement un trigger d'attribution, et ce doit être
-- celui de la migration 01. Si schema.sql d'Hypoteka a été rejoué depuis,
-- assign_lead_advisor() est revenue à la version géographique, qui envoie
-- tous les leads Kapitea chez Marc : mieux vaut s'arrêter ici que de
-- laisser croire que tout est réglé.
do $$
declare
  v_triggers int;
begin
  select count(*) into v_triggers
    from pg_trigger t
    join pg_proc p on p.oid = t.tgfoid
   where t.tgrelid = 'public.leads'::regclass
     and not t.tgisinternal
     and pg_get_functiondef(p.oid) ~* 'advisor_id\s*:=';

  if v_triggers <> 1 then
    raise exception
      'Attendu un seul trigger qui attribue advisor_id sur leads, trouve % : '
      'verifiez pg_trigger avant de continuer.', v_triggers;
  end if;

  if position('resolve_advisor_for_lead' in
       pg_get_functiondef('public.assign_lead_advisor'::regproc)) = 0 then
    raise exception
      'assign_lead_advisor() n''est plus la version de la migration 01 : '
      'rejouez migration-01-multi-marques.sql, puis celle-ci.';
  end if;
end $$;

commit;

-- ============================================================
-- VÉRIFICATION
-- ============================================================
-- Les triggers restants sur leads (leads_assign_via_routing ne doit
-- plus y figurer) :
--   select tgname from pg_trigger
--    where tgrelid = 'public.leads'::regclass and not tgisinternal;
--
-- Puis, au fil des prochains leads, l'ordre doit être
-- Alessio → Brahim → Julien → Marc → Samuel, et ainsi de suite :
--   select l.created_at, a.full_name
--     from leads l join advisors a on a.id = l.advisor_id
--    where l.brand = 'kapitea' order by l.created_at desc limit 10;
