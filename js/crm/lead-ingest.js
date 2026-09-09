// Lead Ingestion for Kapitea
// Handles insertion of qualified leads into Supabase

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

  // Get montant based on segment
  let montantCapital = null;
  if (state.segment === 'lpp') {
    montantCapital = state.answers.Q_MONTANT || null;
  } else if (state.segment === 'heritage') {
    montantCapital = state.answers.Q_MONTANT_HERITAGE || null;
  }

  // Get scores
  const scoreValeur = state.scores?.score_valeur || null;
  const leadTemp = state.scores?.lead_temp || 'froid';

  // Prepare lead record
  const leadRecord = {
    source: 'questionnaire',
    site_source: 'kapitea',
    type_persona: state.segment, // 'lpp' or 'heritage'
    prenom: prenom,
    tel: tel,
    email: email,
    montant_capital: montantCapital,
    score_faisabilite: scoreValeur,
    lead_temp: leadTemp,
    raw_payload: state, // Store complete state as JSON
    advisor_id: null, // Marc handles leads manually
    stage: 'nouveau',
    created_at: new Date().toISOString(),
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
