-- ============================================================
-- MIGRATION 02 — Réservation chez le conseiller attribué
--
-- À exécuter UNE FOIS dans l'éditeur SQL du projet Supabase, après
-- migration-01-multi-marques.sql.
--
-- Le tourniquet attribue déjà chaque lead Kapitea à un conseiller. Cette
-- migration permet à la page /merci de proposer l'agenda de CE
-- conseiller-là, au lieu d'une page de réservation générique où le
-- prospect prend un rendez-vous avec quelqu'un qui n'a pas son dossier.
--
-- AUCUNE DONNÉE N'EST SUPPRIMÉE : une colonne ajoutée, une fonction
-- créée. Le tout dans une transaction — en cas d'échec, rien n'est
-- appliqué.
-- ============================================================

begin;

-- ============================================================
-- 1. L'AGENDA DE CHAQUE CONSEILLER
-- ============================================================
-- L'URL vit à côté de la fiche du conseiller, pas dans le code du site :
-- ajouter quelqu'un ou changer son agenda est un UPDATE, sans
-- redéploiement.
alter table public.advisors
  add column if not exists booking_url text;

comment on column public.advisors.booking_url is
  'Page Microsoft Bookings du conseiller, affichée sur /merci au prospect qui lui a été attribué. Null = repli sur la page générique du site.';

-- ============================================================
-- 2. CE QUE LE SITE PUBLIC A LE DROIT DE DEMANDER
-- ============================================================
-- Le rôle anon ne peut pas lire "leads" — c'est voulu, et ça vaut aussi
-- pour le prospect qui vient de remplir le questionnaire. Il ne peut donc
-- pas savoir à qui son dossier a été confié.
--
-- Cette fonction est la seule ouverture : on lui donne l'identifiant d'un
-- lead, elle rend deux choses et deux seulement — l'URL de réservation du
-- conseiller, et son nom. Ni e-mail, ni téléphone, ni le moindre champ du
-- lead.
--
-- Le nom sert à la page de remerciement, qui annonce « Samuel Moyo vous
-- appelle dans les 24 heures » plutôt qu'« un conseiller », et nomme la
-- personne dont on voit l'agenda juste en dessous : sur un numéro inconnu,
-- savoir qui appelle est ce qui décide qu'on décroche. Il est de toute
-- façon public, les fiches de l'équipe le portent déjà.
--
-- SECURITY DEFINER lui permet de traverser la RLS ; trois garde-fous
-- bornent ce qu'elle peut servir :
--   · deux colonnes, toutes deux déjà publiques par nature (la page de
--     réservation est ouverte à qui a le lien) ;
--   · le conseiller doit être actif ;
--   · le lead doit dater de moins de deux heures, ce qui réduit la
--     fonction à son seul usage légitime — le prospect qui vient d'être
--     redirigé sur /merci.
--
-- `create or replace` ne sait pas changer le type de retour d'une fonction
-- existante : sans ce drop, rejouer la migration sur une base qui porte
-- déjà une version antérieure échoue sur « cannot change return type ».
-- Une fonction n'est pas une donnée — la supprimer pour la recréer dans la
-- même transaction ne coûte rien.
drop function if exists public.booking_url_for_lead(uuid);

create function public.booking_url_for_lead(p_lead_id uuid)
returns table (booking_url text, nom text)
language sql
security definer
set search_path = public
stable
as $$
  select a.booking_url,
         a.full_name
  from public.leads l
  join public.advisors a on a.id = l.advisor_id
  where l.id = p_lead_id
    and a.active = true
    and l.created_at > now() - interval '2 hours';
$$;

grant execute on function public.booking_url_for_lead(uuid) to anon;

-- ============================================================
-- 3. LES AGENDAS CONNUS
-- ============================================================
update public.advisors set booking_url =
  'https://bookings.cloud.microsoft/book/Analysedevotrecapital30minutes@SwissLife.onmicrosoft.com/?ismsaljsauthenabled'
 where slug = 'marc-saugy';

update public.advisors set booking_url =
  'https://bookings.cloud.microsoft/book/Analysedevotrecapital30minutes1@SwissLife.onmicrosoft.com/?ismsaljsauthenabled'
 where slug = 'samuel-moyo';

update public.advisors set booking_url =
  'https://bookings.cloud.microsoft/book/Kapitea@SwissLife.onmicrosoft.com/?ismsaljsauthenabled'
 where slug = 'julien-schaedgen';

update public.advisors set booking_url =
  'https://bookings.cloud.microsoft/book/Kapitea1@SwissLife.onmicrosoft.com/?ismsaljsauthenabled'
 where slug = 'brahim-dutruit';

-- « …30min », sans le « utes » de celle de Marc Saugy : deux boîtes
-- distinctes dont les noms ne diffèrent que par la fin. Copiées telles
-- qu'elles ont été fournies ; la vérification ci-dessous s'assure qu'aucun
-- conseiller ne se retrouve avec l'agenda d'un autre.
update public.advisors set booking_url =
  'https://bookings.cloud.microsoft/book/Analysedevotrecapital30min@SwissLife.onmicrosoft.com/?ismsaljsauthenabled'
 where slug = 'alessio-troiano';

-- L'hôte est bookings.cloud.microsoft : c'est celui vers lequel
-- outlook.office.com redirige, une redirection de moins à traverser.
--
-- Les cinq conseillers Kapitea ont désormais leur page. Pour un sixième,
-- une ligne suffira, sans toucher au reste :
--   update public.advisors set booking_url = 'https://bookings.cloud.microsoft/book/…'
--    where slug = '...';

-- ============================================================
-- 3 bis. GARDE-FOU
-- ============================================================
-- Deux conseillers qui partagent une page de réservation, c'est un
-- prospect qui prend rendez-vous avec quelqu'un qui n'a pas son dossier —
-- et rien, ni dans le CRM ni sur le site, ne le signalerait. Vu que les
-- adresses fournies se ressemblent à quatre caractères près
-- (…30min / …30minutes), la migration refuse de s'appliquer plutôt que de
-- laisser passer une ligne collée au mauvais endroit. Le `begin` du haut
-- fait le reste : tout est annulé.
do $$
declare
  v_doublon text;
begin
  select string_agg(full_name, ' et ') into v_doublon
    from public.advisors
   where 'kapitea' = any(brands) and booking_url is not null
   group by booking_url
  having count(*) > 1
   limit 1;

  if v_doublon is not null then
    raise exception
      'Deux conseillers Kapitea partagent la meme page de reservation : %. '
      'Verifiez les adresses avant de rejouer la migration.', v_doublon;
  end if;
end $$;

commit;

-- ============================================================
-- 4. VÉRIFICATION
-- ============================================================
--   select slug, full_name, booking_url from public.advisors
--    where 'kapitea' = any(brands) order by full_name;
--
-- Et sur un vrai lead, pour éprouver la fonction de bout en bout :
--   select public.booking_url_for_lead('<id d un lead Kapitea récent>');
