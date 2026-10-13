-- ============================================================
-- STATISTIQUES KAPITEA — export pour le suivi des campagnes
--
-- À coller dans l'éditeur SQL de Supabase. Lecture seule : rien n'est
-- modifié. Une ligne par lead Kapitea, sans nom, téléphone ni e-mail —
-- l'export peut être transmis tel quel. Bouton « Download CSV » sous
-- le résultat pour le récupérer.
--
-- Les leads dont le prénom commence par « Test » sont écartés.
--
-- Ce que disent les colonnes :
--   provenance          pub = le prospect est passé par l'écran
--                       d'accroche publicitaire (lien d'annonce) ;
--                       site = il est arrivé depuis kapitea.ch.
--   joint               un appel abouti, un RDV, ou un statut qui
--                       suppose un échange (pièces, RDV, gagné).
--   rdv                 un RDV enregistré, ou un statut RDV / gagné.
--   faux_numero_signale le conseiller l'a écrit dans le motif de perte
--                       ou dans une note (« faux numéro », « numéro
--                       invalide », « n'existe pas »…).
--   numero_suspect      le numéro lui-même a l'air inventé : vide, six
--                       chiffres identiques d'affilée en fin de numéro
--                       (079 000 00 00), une suite complète (079 123 45
--                       67), ou un exemple affiché dans le champ du
--                       questionnaire recopié tel quel : 078 919 08 53
--                       jusqu'au 13.10, 079 123 45 67 depuis (déjà pris
--                       par la règle des suites).
--   numero_en_double    le même numéro a servi pour plusieurs leads.
--   email_suspect       test, example, fake, asdf, a@a…
-- ============================================================

with act as (
  select
    lead_id,
    count(*) filter (where type = 'appel')                                  as appels,
    count(*) filter (where type = 'appel' and outcome in ('pas_joint', 'repondeur')) as appels_sans_reponse,
    bool_or(type = 'appel' and outcome = 'joint')                           as appel_joint,
    bool_or(type = 'rdv')                                                   as rdv_activite,
    bool_or(type = 'rdv' and outcome = 'joint')                             as rdv_honore,
    bool_or(type = 'rdv' and outcome = 'no_show')                           as rdv_no_show,
    bool_or(coalesce(note, '') ~* 'num' and coalesce(note, '') ~* '(faux|mauvais|erron|invalide|inexist|attribu|existe pas)') as note_faux_numero,
    min(created_at) filter (where type = 'appel')                           as premier_appel
  from public.activities
  group by lead_id
),
k as (
  select l.*, regexp_replace(coalesce(l.tel, ''), '\D', '', 'g') as chiffres
  from public.leads l
  where l.brand = 'kapitea'
    and coalesce(l.prenom, '') !~* '^\s*test'
)
select
  to_char(k.created_at at time zone 'Europe/Zurich', 'YYYY-MM-DD')        as date,
  to_char(k.created_at at time zone 'Europe/Zurich', 'IYYY-"S"IW')        as semaine,
  k.segment,
  case when k.raw_payload->>'introSeenFor' is not null then 'pub' else 'site' end as provenance,
  k.montant_capital,
  k.lead_temp,
  a.full_name                                                             as conseiller,
  k.stage,
  coalesce(act.appels, 0)                                                 as appels,
  coalesce(act.appels_sans_reponse, 0)                                    as appels_sans_reponse,
  (coalesce(act.appel_joint, false) or coalesce(act.rdv_activite, false)
     or k.stage in ('pieces_demandees', 'rdv_analyse_fixe', 'rdv_conseil_fixe', 'gagne')) as joint,
  (coalesce(act.rdv_activite, false)
     or k.stage in ('rdv_analyse_fixe', 'rdv_conseil_fixe', 'gagne'))     as rdv,
  coalesce(act.rdv_honore, false)                                         as rdv_honore,
  coalesce(act.rdv_no_show, false)                                        as rdv_no_show,
  k.stage = 'gagne'                                                       as gagne,
  k.stage = 'perdu'                                                       as perdu,
  k.lost_reason_category                                                  as categorie_perte,
  k.lost_reason                                                           as motif_perte,
  (coalesce(k.lost_reason, '') ~* '(faux|mauvais|erron|invalide|inexist|attribu|existe pas)'
     or coalesce(act.note_faux_numero, false))                            as faux_numero_signale,
  (k.chiffres = ''
     or right(k.chiffres, 7) ~ '(\d)\1{5}'
     or right(k.chiffres, 7) in ('0123456', '1234567', '2345678', '3456789',
                                 '9876543', '8765432', '7654321', '6543210')
     or k.chiffres = '41789190853')                                       as numero_suspect,
  (k.chiffres <> '' and count(*) over (partition by k.chiffres) > 1)      as numero_en_double,
  coalesce(k.email, '') ~* '(test|example|fake|asdf|qwert|^a@a\.)'        as email_suspect,
  round((extract(epoch from (act.premier_appel - k.created_at)) / 3600.0)::numeric, 1) as heures_avant_1er_appel
from k
left join public.advisors a on a.id = k.advisor_id
left join act on act.lead_id = k.id
order by k.created_at;
