// Kapitea LPP Funnel Logic

// Utility functions
function formatCurrency(value) {
  return new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('CHF', 'CHF');
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // Optional field
  const phoneRegex = /^\+41\s?\d{1,2}\s?\d{3}\s?\d{2}\s?\d{2}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ' '));
}

// State management
const initialState = {
  segment: null,
  currentScreen: 0,
  answers: {
    // LPP segment
    Q_HORIZON: null,
    Q_MONTANT: 400000,
    Q_SITUATION_FAMILIALE: null,
    Q_OBJECTIF: null,
    // Heritage segment
    Q_MONTANT_HERITAGE: 250000,
    Q_TYPE_ACTIFS: null,
    Q_NOTAIRE: null,
    Q_PROJET: null,
    // Divorce segment
    Q_MONTANT_DIVORCE: 150000,
    Q_STATUT_PROCEDURE: null,
    Q_PROJET_DIVORCE: null,
    // Real Estate segment (vente_maison)
    Q_MONTANT_VENTE: 300000,
    Q_REINVESTISSEMENT: null,
    Q_DELAI_VENTE: null,
    // Business segment (vente_entreprise)
    Q_MONTANT_CESSION: 500000,
    Q_ROLE_CESSION: null,
    Q_STATUT_CESSION: null,
    // Shared
    Q_CONTACT: {
      firstname: '',
      email: '',
      phone: '',
    },
  },
  flags: {
    urgence: null,
  },
  scores: {
    score_valeur: null,
    score_urgence: null,
    lead_temp: null,
  },
};

let state = { ...initialState };

// Load state from session storage
function loadState() {
  const stored = sessionStorage.getItem('funnel_state_kapitea');
  if (stored) {
    try {
      state = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored state:', e);
      state = { ...initialState };
    }
  }
}

// Save state to session storage
function saveState() {
  sessionStorage.setItem('funnel_state_kapitea', JSON.stringify(state));
}

// Detect niche from URL
function detectNiche() {
  const params = new URLSearchParams(window.location.search);
  const niche = params.get('niche');
  if (['lpp', 'heritage', 'divorce', 'vente_maison', 'vente_entreprise'].includes(niche)) {
    state.segment = niche;
  } else {
    console.warn('Unknown niche or missing niche parameter:', niche);
    state.segment = 'lpp'; // Default to LPP
  }
  saveState();
}

// Calculate score
function calculateScore(state) {
  if (state.segment === 'lpp') {
    return calculateScoreLPP(state);
  } else if (state.segment === 'heritage') {
    return calculateScoreHeritage(state);
  } else if (state.segment === 'divorce') {
    return calculateScoreDivorce(state);
  } else if (state.segment === 'vente_maison') {
    return calculateScoreVenteMaison(state);
  } else if (state.segment === 'vente_entreprise') {
    return calculateScoreVenteEntreprise(state);
  }
  return {
    score_valeur: 0,
    score_urgence: 0,
    lead_temp: 'froid',
  };
}

// Calculate score for LPP segment
function calculateScoreLPP(state) {
  const montant = state.answers.Q_MONTANT;
  let score_valeur = 20;

  if (montant >= 100000 && montant < 300000) {
    score_valeur = 50;
  } else if (montant >= 300000 && montant < 600000) {
    score_valeur = 75;
  } else if (montant >= 600000) {
    score_valeur = 100;
  }

  const urgenceMap = {
    high: 90,
    medium: 50,
  };
  const score_urgence = urgenceMap[state.flags.urgence] || 20;

  let lead_temp = 'froid';
  if (score_valeur > 60 && score_urgence > 60) {
    lead_temp = 'chaud';
  } else if (score_valeur > 60 || score_urgence > 60) {
    lead_temp = 'tiede';
  }

  return {
    score_valeur,
    score_urgence,
    lead_temp,
  };
}

// Calculate score for Heritage segment
function calculateScoreHeritage(state) {
  const montant = state.answers.Q_MONTANT_HERITAGE;
  let score_valeur = 20;

  if (montant >= 100000 && montant < 300000) {
    score_valeur = 50;
  } else if (montant >= 300000 && montant < 600000) {
    score_valeur = 75;
  } else if (montant >= 600000) {
    score_valeur = 100;
  }

  // For heritage, urgence is based on Q_PROJET
  const projetMap = {
    precise_plan: 80,
    general_direction: 50,
    no_idea: 30,
  };
  const score_urgence = projetMap[state.answers.Q_PROJET] || 20;

  let lead_temp = 'froid';
  if (score_valeur > 60 && score_urgence > 60) {
    lead_temp = 'chaud';
  } else if (score_valeur > 60 || score_urgence > 60) {
    lead_temp = 'tiede';
  }

  return {
    score_valeur,
    score_urgence,
    lead_temp,
  };
}

// Calculate score for Divorce segment
function calculateScoreDivorce(state) {
  const montant = state.answers.Q_MONTANT_DIVORCE;
  let score_valeur = 20;

  if (montant >= 100000 && montant < 300000) {
    score_valeur = 50;
  } else if (montant >= 300000 && montant < 600000) {
    score_valeur = 75;
  } else if (montant >= 600000) {
    score_valeur = 100;
  }

  // For divorce, urgence is based on Q_PROJET_DIVORCE
  const projetMap = {
    precise_plan: 80,
    general_direction: 50,
    no_idea: 30,
  };
  const score_urgence = projetMap[state.answers.Q_PROJET_DIVORCE] || 20;

  let lead_temp = 'froid';
  if (score_valeur > 60 && score_urgence > 60) {
    lead_temp = 'chaud';
  } else if (score_valeur > 60 || score_urgence > 60) {
    lead_temp = 'tiede';
  }

  return {
    score_valeur,
    score_urgence,
    lead_temp,
  };
}

// Calculate score for Real Estate (Vente Maison) segment
function calculateScoreVenteMaison(state) {
  const montant = state.answers.Q_MONTANT_VENTE;
  let score_valeur = 20;

  if (montant >= 100000 && montant < 300000) {
    score_valeur = 50;
  } else if (montant >= 300000 && montant < 600000) {
    score_valeur = 75;
  } else if (montant >= 600000) {
    score_valeur = 100;
  }

  // For real estate, urgence is based on Q_DELAI_VENTE
  const delaiMap = {
    less_than_3: 90,
    '3_to_12': 50,
    not_rushed: 20,
  };
  const score_urgence = delaiMap[state.answers.Q_DELAI_VENTE] || 20;

  let lead_temp = 'froid';
  if (score_valeur > 60 && score_urgence > 60) {
    lead_temp = 'chaud';
  } else if (score_valeur > 60 || score_urgence > 60) {
    lead_temp = 'tiede';
  }

  return {
    score_valeur,
    score_urgence,
    lead_temp,
  };
}

// Calculate score for Business (Vente Entreprise) segment
function calculateScoreVenteEntreprise(state) {
  const montant = state.answers.Q_MONTANT_CESSION;
  let score_valeur = 20;

  // Higher thresholds for business
  if (montant >= 300000 && montant < 800000) {
    score_valeur = 50;
  } else if (montant >= 800000 && montant < 1500000) {
    score_valeur = 75;
  } else if (montant >= 1500000) {
    score_valeur = 100;
  }

  // For business, urgence is based on Q_STATUT_CESSION
  const statutMap = {
    finalized: 90,
    ongoing: 50,
    not_signed: 20,
  };
  const score_urgence = statutMap[state.answers.Q_STATUT_CESSION] || 20;

  let lead_temp = 'froid';
  if (score_valeur > 60 && score_urgence > 60) {
    lead_temp = 'chaud';
  } else if (score_valeur > 60 || score_urgence > 60) {
    lead_temp = 'tiede';
  }

  return {
    score_valeur,
    score_urgence,
    lead_temp,
  };
}

// Update urgence flag based on Q_HORIZON
function updateUrgenceFlag(horizon) {
  if (horizon === 'already_retired' || horizon === 'less_than_2') {
    state.flags.urgence = 'high';
  } else if (horizon === '2_to_5') {
    state.flags.urgence = 'medium';
  }
  state.scores = calculateScore(state);
}

// DOM elements
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const currentStepSpan = document.getElementById('current-step');
const progressSteps = document.querySelectorAll('.progress-step');

// Get screens for current segment
function getSegmentScreens() {
  if (state.segment === 'lpp') {
    return document.querySelectorAll('.questionnaire-screen.segment-lpp');
  } else if (state.segment === 'heritage') {
    return document.querySelectorAll('.questionnaire-screen.segment-heritage');
  } else if (state.segment === 'divorce') {
    return document.querySelectorAll('.questionnaire-screen.segment-divorce');
  } else if (state.segment === 'vente_maison') {
    return document.querySelectorAll('.questionnaire-screen.segment-vente_maison');
  } else if (state.segment === 'vente_entreprise') {
    return document.querySelectorAll('.questionnaire-screen.segment-vente_entreprise');
  }
  return [];
}

// Update screen display
function showScreen(screenIndex) {
  const segmentScreens = getSegmentScreens();
  const allScreens = document.querySelectorAll('.questionnaire-screen');

  allScreens.forEach((screen) => {
    screen.classList.remove('active');
  });
  progressSteps.forEach((step) => {
    step.classList.remove('active', 'completed');
  });

  if (screenIndex < segmentScreens.length) {
    segmentScreens[screenIndex].classList.add('active');
  }

  currentStepSpan.textContent = screenIndex + 1;

  // Update progress bar
  for (let i = 0; i < screenIndex; i++) {
    if (i < progressSteps.length) {
      progressSteps[i].classList.add('completed');
    }
  }
  if (screenIndex < progressSteps.length) {
    progressSteps[screenIndex].classList.add('active');
  }

  // Update button states
  btnBack.disabled = screenIndex === 0;
  btnNext.textContent = screenIndex === 4 ? 'Terminer' : 'Suivant →';

  // Reset form validation on new screen
  clearFormErrors();

  // Initialize screen-specific content
  if (state.segment === 'lpp' && screenIndex === 1) {
    updateMontantDisplay();
  } else if (state.segment === 'heritage' && screenIndex === 0) {
    updateMontantHeritageDisplay();
  } else if (state.segment === 'divorce' && screenIndex === 0) {
    updateMontantDivorceDisplay();
  } else if (state.segment === 'vente_maison' && screenIndex === 0) {
    updateMontantVenteDisplay();
  } else if (state.segment === 'vente_entreprise' && screenIndex === 0) {
    updateMontantCessionDisplay();
  }

  window.scrollTo(0, 0);
}

// Get current screen data
function getCurrentScreenData() {
  const screenNames = [
    'Q_HORIZON',
    'Q_MONTANT',
    'Q_SITUATION_FAMILIALE',
    'Q_OBJECTIF',
    'Q_CONTACT',
  ];
  return screenNames[state.currentScreen];
}

// Validate current screen
function validateCurrentScreen() {
  const screenIndex = state.currentScreen;

  if (state.segment === 'lpp') {
    return validateScreenLPP(screenIndex);
  } else if (state.segment === 'heritage') {
    return validateScreenHeritage(screenIndex);
  } else if (state.segment === 'divorce') {
    return validateScreenDivorce(screenIndex);
  } else if (state.segment === 'vente_maison') {
    return validateScreenVenteMaison(screenIndex);
  } else if (state.segment === 'vente_entreprise') {
    return validateScreenVenteEntreprise(screenIndex);
  }

  return true;
}

// Validate screen for LPP segment
function validateScreenLPP(screenIndex) {
  if (screenIndex === 0) {
    // Q_HORIZON
    const selected = document.querySelector('input[name="horizon"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_HORIZON = selected.value;
    updateUrgenceFlag(selected.value);
    return true;
  }

  if (screenIndex === 1) {
    // Q_MONTANT - always valid
    return true;
  }

  if (screenIndex === 2) {
    // Q_SITUATION_FAMILIALE
    const selected = document.querySelector('input[name="situation"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_SITUATION_FAMILIALE = selected.value;
    return true;
  }

  if (screenIndex === 3) {
    // Q_OBJECTIF
    const selected = document.querySelector('input[name="objectif"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_OBJECTIF = selected.value;
    return true;
  }

  if (screenIndex === 4) {
    // Q_CONTACT
    return validateContact();
  }

  return true;
}

// Validate screen for Heritage segment
function validateScreenHeritage(screenIndex) {
  if (screenIndex === 0) {
    // Q_MONTANT_HERITAGE - always valid
    return true;
  }

  if (screenIndex === 1) {
    // Q_TYPE_ACTIFS
    const selected = document.querySelector('input[name="type-actifs"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_TYPE_ACTIFS = selected.value;
    return true;
  }

  if (screenIndex === 2) {
    // Q_NOTAIRE
    const selected = document.querySelector('input[name="notaire"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_NOTAIRE = selected.value;
    return true;
  }

  if (screenIndex === 3) {
    // Q_PROJET
    const selected = document.querySelector('input[name="projet"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_PROJET = selected.value;
    state.scores = calculateScore(state);
    return true;
  }

  if (screenIndex === 4) {
    // Q_CONTACT
    return validateContact();
  }

  return true;
}

// Validate screen for Divorce segment
function validateScreenDivorce(screenIndex) {
  if (screenIndex === 0) {
    // Q_MONTANT_DIVORCE - always valid
    return true;
  }

  if (screenIndex === 1) {
    // Q_STATUT_PROCEDURE
    const selected = document.querySelector('input[name="statut-procedure"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_STATUT_PROCEDURE = selected.value;
    return true;
  }

  if (screenIndex === 2) {
    // Q_PROJET_DIVORCE
    const selected = document.querySelector('input[name="projet-divorce"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_PROJET_DIVORCE = selected.value;
    state.scores = calculateScore(state);
    return true;
  }

  if (screenIndex === 3) {
    // Q_CONTACT
    return validateContact();
  }

  return true;
}

// Validate screen for Real Estate (Vente Maison) segment
function validateScreenVenteMaison(screenIndex) {
  if (screenIndex === 0) {
    // Q_MONTANT_VENTE - always valid
    return true;
  }

  if (screenIndex === 1) {
    // Q_REINVESTISSEMENT
    const selected = document.querySelector('input[name="reinvestissement"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_REINVESTISSEMENT = selected.value;
    return true;
  }

  if (screenIndex === 2) {
    // Q_DELAI_VENTE
    const selected = document.querySelector('input[name="delai-vente"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_DELAI_VENTE = selected.value;
    state.scores = calculateScore(state);
    return true;
  }

  if (screenIndex === 3) {
    // Q_CONTACT
    return validateContact();
  }

  return true;
}

// Validate screen for Business (Vente Entreprise) segment
function validateScreenVenteEntreprise(screenIndex) {
  if (screenIndex === 0) {
    // Q_MONTANT_CESSION - always valid
    return true;
  }

  if (screenIndex === 1) {
    // Q_ROLE_CESSION
    const selected = document.querySelector('input[name="role-cession"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_ROLE_CESSION = selected.value;
    return true;
  }

  if (screenIndex === 2) {
    // Q_STATUT_CESSION
    const selected = document.querySelector('input[name="statut-cession"]:checked');
    if (!selected) {
      return false;
    }
    state.answers.Q_STATUT_CESSION = selected.value;
    state.scores = calculateScore(state);
    return true;
  }

  if (screenIndex === 3) {
    // Q_CONTACT
    return validateContact();
  }

  return true;
}

// Validate contact form (shared between segments)
function validateContact() {
  const firstname = document.getElementById('firstname').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();

  let isValid = true;

  // Validate firstname
  const firstnameGroup = document.getElementById('firstname').parentElement;
  if (!firstname) {
    firstnameGroup.classList.add('error');
    isValid = false;
  } else {
    firstnameGroup.classList.remove('error');
  }

  // Validate email
  const emailGroup = document.getElementById('email').parentElement;
  if (!email || !validateEmail(email)) {
    emailGroup.classList.add('error');
    isValid = false;
  } else {
    emailGroup.classList.remove('error');
  }

  // Validate phone
  const phoneGroup = document.getElementById('phone').parentElement;
  if (phone && !validatePhone(phone)) {
    phoneGroup.classList.add('error');
    isValid = false;
  } else {
    phoneGroup.classList.remove('error');
  }

  if (isValid) {
    state.answers.Q_CONTACT = {
      firstname,
      email,
      phone,
    };
  }

  return isValid;
}

// Clear form errors
function clearFormErrors() {
  document.querySelectorAll('.form-group.error').forEach((group) => {
    group.classList.remove('error');
  });
}

// Handle next button
function handleNext() {
  if (!validateCurrentScreen()) {
    return;
  }

  if (state.currentScreen === 4) {
    // Last screen - submit
    handleSubmit();
    return;
  }

  state.currentScreen++;
  saveState();
  showScreen(state.currentScreen);
}

// Handle back button
function handleBack() {
  if (state.currentScreen > 0) {
    state.currentScreen--;
    saveState();
    showScreen(state.currentScreen);
  }
}

// Handle submit - complete flow: Supabase + EmailJS + redirect
async function handleSubmit() {
  console.log('Funnel completed:', state);

  // Show loading state (optional - can add spinner UI here)
  const btnNext = document.getElementById('btn-next');
  const originalText = btnNext.textContent;
  btnNext.disabled = true;
  btnNext.textContent = 'Envoi en cours...';

  try {
    // Step 1: Insert lead into Supabase
    console.log('Step 1: Inserting lead into Supabase...');
    const supabaseResult = await insertLeadAndEmail(state);

    if (!supabaseResult.success) {
      console.error('Supabase insertion failed:', supabaseResult.error);
      // Still redirect to merci page even if insertion fails
      // The data is still in sessionStorage for manual recovery
    } else {
      console.log('Lead inserted successfully');
    }

    // Step 2: Redirect to thank you page
    console.log('Redirecting to thank you page...');
    window.location.href = '/merci';
  } catch (err) {
    console.error('Submission error:', err);
    // Still redirect even if there's an error
    window.location.href = '/merci';
  } finally {
    btnNext.disabled = false;
    btnNext.textContent = originalText;
  }
}

// Combined Supabase + EmailJS submission
async function insertLeadAndEmail(state) {
  // Step 1: Insert into Supabase
  let supabaseResult = {
    success: false,
    error: 'Not executed',
  };

  if (typeof insertLead === 'function') {
    try {
      supabaseResult = await insertLead(state);
    } catch (err) {
      console.error('Error calling insertLead:', err);
      supabaseResult = {
        success: false,
        error: err.message || 'Error inserting lead',
      };
    }
  } else {
    console.warn('insertLead function not available');
  }

  // Step 2: Send confirmation emails
  if (typeof sendConfirmationEmails === 'function') {
    try {
      await sendConfirmationEmails(state);
    } catch (err) {
      console.error('Error sending emails:', err);
      // Don't fail the entire flow if email sending fails
    }
  } else {
    console.warn('sendConfirmationEmails function not available');
  }

  return supabaseResult;
}

// Update montant display (LPP)
function updateMontantDisplay() {
  const slider = document.getElementById('montant-slider');
  const display = document.getElementById('montant-display');

  function updateDisplay() {
    const value = parseInt(slider.value, 10);
    state.answers.Q_MONTANT = value;
    display.textContent = formatCurrency(value);
    state.scores = calculateScore(state);
    saveState();
  }

  updateDisplay();
  slider.addEventListener('input', updateDisplay);
}

// Update montant heritage display (Heritage)
function updateMontantHeritageDisplay() {
  const slider = document.getElementById('montant-heritage-slider');
  const display = document.getElementById('montant-heritage-display');

  if (!slider || !display) {
    return; // Not on heritage screen
  }

  function updateDisplay() {
    const value = parseInt(slider.value, 10);
    state.answers.Q_MONTANT_HERITAGE = value;
    display.textContent = formatCurrency(value);
    state.scores = calculateScore(state);
    saveState();
  }

  updateDisplay();
  slider.addEventListener('input', updateDisplay);
}

// Update montant divorce display (Divorce)
function updateMontantDivorceDisplay() {
  const slider = document.getElementById('montant-divorce-slider');
  const display = document.getElementById('montant-divorce-display');

  if (!slider || !display) {
    return;
  }

  function updateDisplay() {
    const value = parseInt(slider.value, 10);
    state.answers.Q_MONTANT_DIVORCE = value;
    display.textContent = formatCurrency(value);
    state.scores = calculateScore(state);
    saveState();
  }

  updateDisplay();
  slider.addEventListener('input', updateDisplay);
}

// Update montant vente display (Real Estate)
function updateMontantVenteDisplay() {
  const slider = document.getElementById('montant-vente-slider');
  const display = document.getElementById('montant-vente-display');

  if (!slider || !display) {
    return;
  }

  function updateDisplay() {
    const value = parseInt(slider.value, 10);
    state.answers.Q_MONTANT_VENTE = value;
    display.textContent = formatCurrency(value);
    state.scores = calculateScore(state);
    saveState();
  }

  updateDisplay();
  slider.addEventListener('input', updateDisplay);
}

// Update montant cession display (Business)
function updateMontantCessionDisplay() {
  const slider = document.getElementById('montant-cession-slider');
  const display = document.getElementById('montant-cession-display');

  if (!slider || !display) {
    return;
  }

  function updateDisplay() {
    const value = parseInt(slider.value, 10);
    state.answers.Q_MONTANT_CESSION = value;
    display.textContent = formatCurrency(value);
    state.scores = calculateScore(state);
    saveState();
  }

  updateDisplay();
  slider.addEventListener('input', updateDisplay);
}

// Update option styling on selection
function setupOptionListeners() {
  const radioInputs = document.querySelectorAll('input[type="radio"]');

  radioInputs.forEach((input) => {
    input.addEventListener('change', (e) => {
      const options = e.target.parentElement.parentElement.querySelectorAll(
        '.option'
      );
      options.forEach((option) => {
        option.classList.remove('selected');
      });
      e.target.parentElement.classList.add('selected');
    });
  });
}

// Initialize Supabase client
function initSupabase() {
  if (typeof supabaseClientInstance === 'undefined') {
    console.warn('Supabase client not available');
    return;
  }

  if (typeof SUPABASE_CONFIG === 'undefined') {
    console.warn('SUPABASE_CONFIG not loaded');
    return;
  }

  try {
    supabaseClientInstance.init(SUPABASE_CONFIG);
    console.log('Supabase client initialized');
  } catch (err) {
    console.error('Failed to initialize Supabase:', err);
  }
}

// Initialize EmailJS
function initEmailJS() {
  if (typeof emailjs === 'undefined') {
    console.warn('EmailJS library not available');
    return;
  }

  if (typeof CONFIG === 'undefined') {
    console.warn('CONFIG not loaded');
    return;
  }

  if (!CONFIG.EMAILJS_PUBLIC_KEY) {
    console.warn('EMAILJS_PUBLIC_KEY not configured');
    return;
  }

  try {
    emailjs.init(CONFIG.EMAILJS_PUBLIC_KEY);
    console.log('EmailJS initialized');
  } catch (err) {
    console.error('Failed to initialize EmailJS:', err);
  }
}

// Initialize
function init() {
  loadState();
  detectNiche();

  // Initialize external services
  initSupabase();
  initEmailJS();

  // Restore slider values if needed
  if (state.segment === 'lpp') {
    const montantSlider = document.getElementById('montant-slider');
    if (montantSlider && state.answers.Q_MONTANT) {
      montantSlider.value = state.answers.Q_MONTANT;
    }
  } else if (state.segment === 'heritage') {
    const montantHeritageSlider = document.getElementById('montant-heritage-slider');
    if (montantHeritageSlider && state.answers.Q_MONTANT_HERITAGE) {
      montantHeritageSlider.value = state.answers.Q_MONTANT_HERITAGE;
    }
  } else if (state.segment === 'divorce') {
    const montantDivorceSlider = document.getElementById('montant-divorce-slider');
    if (montantDivorceSlider && state.answers.Q_MONTANT_DIVORCE) {
      montantDivorceSlider.value = state.answers.Q_MONTANT_DIVORCE;
    }
  } else if (state.segment === 'vente_maison') {
    const montantVenteSlider = document.getElementById('montant-vente-slider');
    if (montantVenteSlider && state.answers.Q_MONTANT_VENTE) {
      montantVenteSlider.value = state.answers.Q_MONTANT_VENTE;
    }
  } else if (state.segment === 'vente_entreprise') {
    const montantCessionSlider = document.getElementById('montant-cession-slider');
    if (montantCessionSlider && state.answers.Q_MONTANT_CESSION) {
      montantCessionSlider.value = state.answers.Q_MONTANT_CESSION;
    }
  }

  showScreen(state.currentScreen);
  setupOptionListeners();

  btnNext.addEventListener('click', handleNext);
  btnBack.addEventListener('click', handleBack);

  // Restore form values on screen 5 (contact screen)
  if (state.currentScreen === 4) {
    document.getElementById('firstname').value = state.answers.Q_CONTACT.firstname;
    document.getElementById('email').value = state.answers.Q_CONTACT.email;
    document.getElementById('phone').value = state.answers.Q_CONTACT.phone;
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
