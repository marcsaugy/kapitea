// EmailJS Email Sender for Kapitea
// Sends confirmation emails to both Marc (admin) and prospect (client)

/**
 * Send confirmation emails via EmailJS
 * @param {Object} state - Complete funnel state
 * @returns {Promise<Object>} - Result object with success status
 */
async function sendConfirmationEmails(state) {
  if (typeof CONFIG === 'undefined') {
    console.error('CONFIG not loaded');
    return {
      success: false,
      error: 'CONFIG not loaded',
    };
  }

  if (typeof emailjs === 'undefined') {
    console.error('EmailJS library not loaded');
    return {
      success: false,
      error: 'EmailJS library not loaded',
    };
  }

  // Initialize EmailJS with public key
  if (!CONFIG.EMAILJS_PUBLIC_KEY) {
    console.warn('EMAILJS_PUBLIC_KEY not configured, skipping email');
    return {
      success: false,
      error: 'EMAILJS_PUBLIC_KEY not configured',
    };
  }

  emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);

  // Extract contact info
  const contact = state.answers.Q_CONTACT || {};
  const prenom = contact.firstname || '';
  const email = contact.email || '';
  const tel = contact.phone || '';

  // Get montant based on segment
  let montantCapital = null;
  let montantFormatted = 'Non spécifié';

  if (state.segment === 'lpp') {
    montantCapital = state.answers.Q_MONTANT || null;
  } else if (state.segment === 'heritage') {
    montantCapital = state.answers.Q_MONTANT_HERITAGE || null;
  }

  if (montantCapital) {
    // formatCHF vient de js/format.js
    montantFormatted = formatCHF(montantCapital);
  }

  // Get scores
  const leadTemp = state.scores?.lead_temp || 'froid';
  const typePersona = state.segment === 'lpp' ? 'Retraite LPP' : 'Héritage';

  // Prepare template variables
  const templateVars = {
    prenom: prenom,
    email: email,
    tel: tel || 'Non fourni',
    type_persona: typePersona,
    montant_capital: montantFormatted,
    lead_temp: leadTemp,
    created_at: new Date().toLocaleString('fr-CH'),
  };

  try {
    // Send admin notification to Marc
    if (CONFIG.EMAILJS_SERVICE_ID && CONFIG.EMAILJS_TEMPLATE_ID && CONFIG.MARC_EMAIL_NOTIFICATION) {
      console.log('Sending admin notification...');

      await emailjs.send(
        CONFIG.EMAILJS_SERVICE_ID,
        CONFIG.EMAILJS_TEMPLATE_ID,
        {
          to_email: CONFIG.MARC_EMAIL_NOTIFICATION,
          ...templateVars,
        }
      );

      console.log('Admin notification sent successfully');
    }

    // Send client confirmation to prospect
    if (
      CONFIG.EMAILJS_SERVICE_ID &&
      CONFIG.EMAILJS_TEMPLATE_ID_CLIENT &&
      email
    ) {
      console.log('Sending client confirmation...');

      await emailjs.send(
        CONFIG.EMAILJS_SERVICE_ID,
        CONFIG.EMAILJS_TEMPLATE_ID_CLIENT,
        {
          to_email: email,
          ...templateVars,
        }
      );

      console.log('Client confirmation sent successfully');
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('EmailJS error:', err);
    return {
      success: false,
      error: err.text || err.message || 'Failed to send emails',
    };
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sendConfirmationEmails };
}
