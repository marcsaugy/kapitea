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
-- conseiller, et son prénom. Ni nom de famille, ni e-mail, ni téléphone,
-- ni le moindre champ du lead.
--
-- Le prénom sert à la page de remerciement, qui annonce « Samuel vous
-- appelle dans les 24 heures » plutôt qu'« un conseiller » : sur un numéro
-- inconnu, savoir qui appelle est ce qui décide qu'on décroche. Il est de
-- toute façon public, les fiches de l'équipe le portent déjà.
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
returns table (booking_url text, prenom text)
language sql
security definer
set search_path = public
stable
as $$
  select a.booking_url,
         split_part(a.full_name, ' ', 1)
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

-- L'hôte est bookings.cloud.microsoft : c'est celui vers lequel
-- outlook.office.com redirige, une redirection de moins à traverser.
--
-- Julien Schaedgen et Brahim Dutruit n'ont pas encore de page : leurs
-- leads tombent sur la page générique du site jusqu'à ce qu'on remplisse
-- leur case. Une ligne suffira :
--   update public.advisors set booking_url = 'https://bookings.cloud.microsoft/book/…'
--    where slug = 'julien-schaedgen';

commit;

-- ============================================================
-- 4. VÉRIFICATION
-- ============================================================
--   select slug, full_name, booking_url from public.advisors
--    where 'kapitea' = any(brands) order by full_name;
--
-- Et sur un vrai lead, pour éprouver la fonction de bout en bout :
--   select public.booking_url_for_lead('<id d un lead Kapitea récent>');
