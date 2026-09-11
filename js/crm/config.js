// Configuration Supabase — Kapitea
//
// MÊME projet que Hypoteka : les deux marques écrivent dans la table
// "leads" partagée, séparées par la colonne "brand" (voir
// supabase/migration-01-multi-marques.sql). Les valeurs ci-dessous sont
// donc identiques à celles de js/crm/config.js du dépôt Hypoteka.
//
// Ce fichier est versionné, et c'est voulu : la clé "anon" est publique
// par conception, elle part dans le navigateur de chaque visiteur. Ce qui
// protège les données, ce n'est pas son secret, c'est la RLS — le rôle
// anon peut UNIQUEMENT insérer dans "leads", jamais lire, modifier ou
// supprimer quoi que ce soit.
//
// La clé "service_role", elle, contourne la RLS : elle ne doit JAMAIS
// apparaître ici ni dans aucun code exécuté par le navigateur.

const SUPABASE_CONFIG = {
  URL: 'https://oudcaalzybtcikxegdfu.supabase.co',
  ANON_KEY: 'sb_publishable_sg1z8edHcw2fs4U4ohl8MA_6i2n_zgL',
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPABASE_CONFIG;
}
