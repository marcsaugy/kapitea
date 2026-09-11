// Lead Ingestion for Kapitea
// Handles insertion of qualified leads into Supabase
//
// La base est partagée avec Hypoteka : voir supabase/migration-01-multi-marques.sql.
// C'est la colonne "brand" qui sépare les deux marques et décide, via la
// RLS, qui peut relire la ligne dans le CRM.

// Clé du montant dans state.answers, par persona.
const MONTANT_KEYS = {
  lpp: 'Q_MONTANT',
  heritage: 'Q_MONTANT_HERITAGE',
  divorce: 'Q_MONTANT_DIVORCE',
  vente_maison: 'Q_MONTANT_VENTE',
  vente_entreprise: 'Q_MONTANT_CESSION',
};

/**
 * Insert lead into Supabase after form submission
 * @param {Object} state - Complete funnel state from calculateScore
 * @returns {Promise<Object>} - Result object with success status and data/error
 */
async function insertLead(state) {
  if (!supabaseClientInstance || !supabaseClientInstance.getClient()) {
    console.error('Supabase client not initialized');
    return {
      success: false,
      error: 'Supabase client not initialized',
    };
  }

  if (!state || !state.segment) {
    console.error('Invalid state for lead insertion');
    return {
      success: false,
      error: 'Invalid state',
    };
  }

  // Extract contact info
  const contact = state.answers.Q_CONTACT || {};
  const prenom = contact.firstname || '';
  const email = contact.email || '';
  const tel = contact.phone || null;

  /* Le montant vit sous une clé différente par persona. Trois d'entre eux
     manquaient ici et partaient à null : un lead sans montant n'a pas de
     score_faisabilite exploitable et se retrouve en bas de toutes les
     files du CRM, alors que le prospect avait bougé le curseur. */
  const montantCapital = MONTANT_KEYS[state.segment]
    ? state.answers[MONTANT_KEYS[state.segment]] ?? null
    : null;

  // Get scores
  const scoreValeur = state.scores?.score_valeur || null;
  const leadTemp = state.scores?.lead_temp || 'froid';

  /* Les colonnes sont celles de la table partagée. Trois absences sont
     volontaires :
       - advisor_id : un trigger l'attribue à l'insertion, en écartant les
         conseillers qui n'ont pas accès à la marque. L'envoyer ici ne
         servait à rien, le trigger l'écrase.
       - created_at : la base a un default now(), qui fait foi. L'horloge
         du navigateur du prospect, non.
       - localisation : Kapitea ne demande pas de commune ; la laisser
         nulle est ce qui dit au routage de ne pas chercher. */
  const leadRecord = {
    source: 'questionnaire',
    brand: 'kapitea',
    // "segment" existe déjà côté Hypoteka et porte exactement ça.
    segment: state.segment,
    prenom: prenom,
    tel: tel,
    email: email,
    montant_capital: montantCapital,
    score_faisabilite: scoreValeur,
    lead_temp: leadTemp,
    // L'état complet, plus les réponses en clair pour le CRM (readableAnswers
    // vit dans funnel.js ; le test de type garde l'insert fonctionnel si ce
    // fichier est chargé seul).
    raw_payload: Object.assign({}, state,
      typeof readableAnswers === 'function' ? { reponses: readableAnswers(state) } : {}),
    stage: 'nouveau',
  };

  try {
    console.log('Inserting lead into Supabase:', leadRecord);

    const { data, error } = await supabaseClientInstance
      .table('leads')
      .insert([leadRecord]);

    if (error) {
      console.error('Supabase insert error:', error);
      return {
        success: false,
        error: error.message || 'Failed to insert lead',
      };
    }

    console.log('Lead inserted successfully:', data);

    return {
      success: true,
      data: data,
    };
  } catch (err) {
    console.error('Lead insertion exception:', err);
    return {
      success: false,
      error: err.message || 'Unexpected error during lead insertion',
    };
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { insertLead };
}
