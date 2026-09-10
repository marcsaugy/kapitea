// Kapitea LPP Funnel Logic

// Utility functions
// formatCHF vient de js/format.js
function formatCurrency(value) {
  return formatCHF(value);
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
    // Collected on its own screen in every segment
    Q_PRENOM: null,
    // LPP segment
    Q_HORIZON: null,
    Q_CHOIX_PRESENTE: null,
    Q_PREOCCUPATION: null,
    Q_MONTANT: 400000,
    Q_SITUATION_FAMILIALE: null,
    Q_OBJECTIF: null,
    // Heritage segment
    Q_ETAPE_SUCCESSION: null,
    Q_TYPE_ACTIFS: null,
    Q_RESSENTI: null,
    Q_MONTANT_HERITAGE: 250000,
    Q_PROJET: null,
    Q_HORIZON_HERITAGE: null,
    // Divorce segment
    Q_STATUT_PROCEDURE: null,
    Q_REPRESENTE: null,
    Q_BESOIN_COURT_TERME: null,
    Q_MONTANT_DIVORCE: 150000,
    Q_REVENUS: null,
    // Real Estate segment (vente_maison)
    Q_ETAPE_VENTE: null,
    Q_REINVESTISSEMENT: null,
    Q_RAISON: null,
    Q_MONTANT_VENTE: 300000,
    Q_DELAI_VENTE: null,
    Q_OBJECTIF_VENTE: null,
    // Business segment (vente_entreprise)
    Q_ROLE_CESSION: null,
    Q_STATUT_CESSION: null,
    Q_ACCOMPAGNEMENT: null,
    Q_MONTANT_CESSION: 500000,
    Q_SUITE: null,
    Q_OBJECTIF_CESSION: null,
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

// Screen order per segment, matching the DOM order of .segment-<name> screens.
// Each entry is either a radio question, the prenom field, the montant slider,
// or the shared contact form.
const SEGMENT_CONFIG = {
  lpp: [
    { key: 'Q_HORIZON', radio: 'horizon' },
    { key: 'Q_CHOIX_PRESENTE', radio: 'choix-presente' },
    { key: 'Q_PREOCCUPATION', radio: 'preoccupation' },
    { key: 'Q_PRENOM', input: 'prenom-lpp' },
    {
      key: 'Q_MONTANT',
      slider: 'montant-slider',
      display: 'montant-display',
      title: 'montant-title',
      titleTpl: (p) => `${p}, quel est le montant approximatif de votre capital de prévoyance ?`,
    },
    { key: 'Q_SITUATION_FAMILIALE', radio: 'situation' },
    { key: 'Q_OBJECTIF', radio: 'objectif' },
    { key: 'Q_CONTACT', contact: true },
  ],
  heritage: [
    { key: 'Q_ETAPE_SUCCESSION', radio: 'etape-succession' },
    { key: 'Q_TYPE_ACTIFS', radio: 'type-actifs' },
    { key: 'Q_RESSENTI', radio: 'ressenti' },
    { key: 'Q_PRENOM', input: 'prenom-heritage' },
    {
      key: 'Q_MONTANT_HERITAGE',
      slider: 'montant-heritage-slider',
      display: 'montant-heritage-display',
      title: 'montant-heritage-title',
      titleTpl: (p) => `${p}, quel montant approximatif avez-vous reçu ou allez-vous recevoir ?`,
    },
    { key: 'Q_PROJET', radio: 'projet' },
    { key: 'Q_HORIZON_HERITAGE', radio: 'horizon-heritage' },
    { key: 'Q_CONTACT', contact: true },
  ],
  divorce: [
    { key: 'Q_STATUT_PROCEDURE', radio: 'statut-procedure' },
    { key: 'Q_REPRESENTE', radio: 'represente' },
    { key: 'Q_BESOIN_COURT_TERME', radio: 'besoin-court-terme' },
    { key: 'Q_PRENOM', input: 'prenom-divorce' },
    {
      key: 'Q_MONTANT_DIVORCE',
      slider: 'montant-divorce-slider',
      display: 'montant-divorce-display',
      title: 'montant-divorce-title',
      titleTpl: (p) => `${p}, quel montant approximatif recevez-vous du partage ?`,
    },
    { key: 'Q_REVENUS', radio: 'revenus' },
    { key: 'Q_CONTACT', contact: true },
  ],
  vente_maison: [
    { key: 'Q_ETAPE_VENTE', radio: 'etape-vente' },
    { key: 'Q_REINVESTISSEMENT', radio: 'reinvestissement' },
    { key: 'Q_RAISON', radio: 'raison' },
    { key: 'Q_PRENOM', input: 'prenom-vente' },
    {
      key: 'Q_MONTANT_VENTE',
      slider: 'montant-vente-slider',
      display: 'montant-vente-display',
      title: 'montant-vente-title',
      titleTpl: (p) => `${p}, quel montant net vous restera-t-il après remboursement de l'hypothèque ?`,
    },
    { key: 'Q_DELAI_VENTE', radio: 'delai-vente' },
    { key: 'Q_OBJECTIF_VENTE', radio: 'objectif-vente' },
    { key: 'Q_CONTACT', contact: true },
  ],
  vente_entreprise: [
    { key: 'Q_ROLE_CESSION', radio: 'role-cession' },
    { key: 'Q_STATUT_CESSION', radio: 'statut-cession' },
    { key: 'Q_ACCOMPAGNEMENT', radio: 'accompagnement' },
    { key: 'Q_PRENOM', input: 'prenom-cession' },
    {
      key: 'Q_MONTANT_CESSION',
      slider: 'montant-cession-slider',
      display: 'montant-cession-display',
      title: 'montant-cession-title',
      titleTpl: (p) => `${p}, quel montant net avez-vous reçu ou allez-vous recevoir ?`,
    },
    { key: 'Q_SUITE', radio: 'suite' },
    { key: 'Q_OBJECTIF_CESSION', radio: 'objectif-cession' },
    { key: 'Q_CONTACT', contact: true },
  ],
};

function getScreenConfig(screenIndex) {
  const screens = SEGMENT_CONFIG[state.segment] || [];
  return screens[screenIndex] || null;
}

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

// Standard montant grid, shared by every segment except vente_entreprise
function scoreMontantStandard(montant) {
  if (montant >= 600000) return 100;
  if (montant >= 300000) return 75;
  if (montant >= 100000) return 50;
  return 20;
}

// Derive lead_temp from the two scores
function withLeadTemp(score_valeur, score_urgence) {
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

// Calculate score for LPP segment
function calculateScoreLPP(state) {
  const score_valeur = scoreMontantStandard(state.answers.Q_MONTANT);

  const urgenceMap = {
    high: 90,
    medium: 50,
  };
  let score_urgence = urgenceMap[state.flags.urgence] || 20;

  // A pending rente/capital decision is an urgency signal on its own
  if (state.answers.Q_CHOIX_PRESENTE === 'decide_soon') {
    score_urgence = 90;
  }

  return withLeadTemp(score_valeur, score_urgence);
}

// Calculate score for Heritage segment
function calculateScoreHeritage(state) {
  const score_valeur = scoreMontantStandard(state.answers.Q_MONTANT_HERITAGE);

  // Urgence is based on Q_PROJET
  const projetMap = {
    precise_plan: 80,
    general_direction: 50,
    no_idea: 30,
  };
  let score_urgence = projetMap[state.answers.Q_PROJET] || 20;

  // Funds already in hand means the decision is live
  if (state.answers.Q_ETAPE_SUCCESSION === 'settled') {
    score_urgence = Math.min(score_urgence + 15, 100);
  }

  return withLeadTemp(score_valeur, score_urgence);
}

// Calculate score for Divorce segment
function calculateScoreDivorce(state) {
  const score_valeur = scoreMontantStandard(state.answers.Q_MONTANT_DIVORCE);

  // Urgence is based on where the procedure stands
  const statutMap = {
    completed: 80,
    ongoing: 50,
    not_started: 25,
  };
  const score_urgence = statutMap[state.answers.Q_STATUT_PROCEDURE] || 20;

  return withLeadTemp(score_valeur, score_urgence);
}

// Calculate score for Real Estate (Vente Maison) segment
function calculateScoreVenteMaison(state) {
  const score_valeur = scoreMontantStandard(state.answers.Q_MONTANT_VENTE);

  // Urgence combines how far along the sale is with the investment deadline
  const etape = state.answers.Q_ETAPE_VENTE;
  const delai = state.answers.Q_DELAI_VENTE;

  let score_urgence = 25;
  if (etape === 'sold' || delai === 'less_than_3') {
    score_urgence = 85;
  } else if (etape === 'under_contract' || delai === '3_to_12') {
    score_urgence = 55;
  }

  return withLeadTemp(score_valeur, score_urgence);
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

  // Urgence is based on where the transaction stands
  const statutMap = {
    finalized: 90,
    closing: 70,
    negotiating: 40,
    considering: 20,
  };
  let score_urgence = statutMap[state.answers.Q_STATUT_CESSION] || 20;

  // Nobody advising them yet on the wealth side
  if (state.answers.Q_ACCOMPAGNEMENT === 'none') {
    score_urgence = Math.min(score_urgence + 10, 100);
  }

  return withLeadTemp(score_valeur, score_urgence);
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
const totalStepsSpan = document.getElementById('total-steps');
const progressStepsContainer = document.getElementById('progress-steps');

// Build the progress bar to match the number of screens in the current segment
function renderProgressSteps(count) {
  progressStepsContainer.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const step = document.createElement('div');
    step.className = 'progress-step';
    progressStepsContainer.appendChild(step);
  }
  totalStepsSpan.textContent = count;
}

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
  const lastScreenIndex = segmentScreens.length - 1;

  allScreens.forEach((screen) => {
    screen.classList.remove('active');
  });

  if (screenIndex < segmentScreens.length) {
    segmentScreens[screenIndex].classList.add('active');
  }

  currentStepSpan.textContent = screenIndex + 1;

  // Update progress bar
  const progressSteps = progressStepsContainer.children;
  for (let i = 0; i < progressSteps.length; i++) {
    progressSteps[i].classList.remove('active', 'completed');
    if (i < screenIndex) {
      progressSteps[i].classList.add('completed');
    } else if (i === screenIndex) {
      progressSteps[i].classList.add('active');
    }
  }

  // Update button states
  btnBack.disabled = screenIndex === 0;
  btnNext.textContent = screenIndex === lastScreenIndex ? 'Terminer' : 'Suivant';

  // Reset form validation on new screen
  clearFormErrors();

  applyPrenomToTitles();

  window.scrollTo(0, 0);
}

// Personalize the montant and contact titles with the firstname collected on Q_PRENOM
function applyPrenomToTitles() {
  const prenom = state.answers.Q_PRENOM;
  const contactTitle = document.getElementById('contact-title');
  const contactHint = document.getElementById('contact-hint');

  const montantScreen = (SEGMENT_CONFIG[state.segment] || []).find((s) => s.title);
  if (montantScreen) {
    const montantTitle = document.getElementById(montantScreen.title);
    if (montantTitle && prenom) {
      montantTitle.textContent = montantScreen.titleTpl(prenom);
    }
  }

  contactTitle.textContent = prenom
    ? `${prenom}, où pouvons-nous vous envoyer votre analyse ?`
    : 'Où pouvons-nous vous envoyer votre analyse ?';

  contactHint.textContent =
    'Un conseiller FINMA vous rappelle sous 24h, sans engagement.';
  contactHint.hidden = false;
}

// Get current screen data
function getCurrentScreenData() {
  const screen = getScreenConfig(state.currentScreen);
  return screen ? screen.key : null;
}

// Validate current screen
function validateCurrentScreen() {
  const screen = getScreenConfig(state.currentScreen);
  if (!screen) {
    return true;
  }

  if (screen.contact) {
    return validateContact();
  }

  if (screen.input) {
    const field = document.getElementById(screen.input);
    const value = field.value.trim();
    const group = field.parentElement;
    if (!value) {
      group.classList.add('error');
      return false;
    }
    group.classList.remove('error');
    state.answers[screen.key] = value;
    return true;
  }

  if (screen.slider) {
    // The slider always holds a value, and writes it to state as it moves
    return true;
  }

  const selected = document.querySelector(`input[name="${screen.radio}"]:checked`);
  if (!selected) {
    return false;
  }
  state.answers[screen.key] = selected.value;

  // Q_HORIZON drives the LPP urgency flag
  if (screen.key === 'Q_HORIZON') {
    updateUrgenceFlag(selected.value);
  }

  state.scores = calculateScore(state);
  return true;
}

// Validate contact form (shared between segments)
function validateContact() {
  // Every segment collects the firstname earlier, on its own screen
  const firstname = state.answers.Q_PRENOM || '';
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const contactConsent = document.getElementById('contact-consent').checked;

  let isValid = true;

  // Validate email
  const emailGroup = document.getElementById('email').parentElement;
  if (!email || !validateEmail(email)) {
    emailGroup.classList.add('error');
    isValid = false;
  } else {
    emailGroup.classList.remove('error');
  }

  // Validate phone (now required)
  const phoneGroup = document.getElementById('phone').parentElement;
  if (!phone || !validatePhone(phone)) {
    phoneGroup.classList.add('error');
    isValid = false;
  } else {
    phoneGroup.classList.remove('error');
  }

  // Validate contact consent checkbox
  const consentGroup = document.getElementById('contact-consent').parentElement.parentElement;
  if (!contactConsent) {
    consentGroup.classList.add('error');
    isValid = false;
  } else {
    consentGroup.classList.remove('error');
  }

  if (isValid) {
    state.answers.Q_CONTACT = {
      firstname,
      email,
      phone,
      contactConsent,
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

  if (state.currentScreen === getSegmentScreens().length - 1) {
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

  // Persist the contact answers so the merci page can read them
  saveState();

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

// Wire the montant slider of the current segment to state and its display
function setupMontantSlider() {
  const screen = (SEGMENT_CONFIG[state.segment] || []).find((s) => s.slider);
  if (!screen) {
    return;
  }

  const slider = document.getElementById(screen.slider);
  const display = document.getElementById(screen.display);
  if (!slider || !display) {
    return;
  }

  if (state.answers[screen.key]) {
    slider.value = state.answers[screen.key];
  }

  function updateDisplay() {
    const value = parseInt(slider.value, 10);
    state.answers[screen.key] = value;
    const formatted = formatCurrency(value);
    // tweenAmount vient de js/format.js
    tweenAmount(display, value, formatCurrency);
    // Un lecteur d'écran annoncerait « 400000 » sans aria-valuetext
    slider.setAttribute('aria-valuenow', value);
    slider.setAttribute('aria-valuetext', formatted);
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

// Entrée valide l'écran courant, depuis n'importe quel champ.
// Les flèches parcourent déjà les réponses : les radios d'un même groupe
// sont nativement navigables, il n'y a rien à ajouter pour ça.
function setupKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing) {
      return;
    }
    // Laisser les boutons faire leur propre travail
    if (e.target.tagName === 'BUTTON') {
      return;
    }
    e.preventDefault();
    handleNext();
  });
}

// Setup checkbox listener for contact consent
function setupCheckboxListener() {
  const checkbox = document.getElementById('contact-consent');
  const checkboxGroup = checkbox?.parentElement;

  if (!checkbox || !checkboxGroup) {
    return;
  }

  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      checkboxGroup.classList.add('selected');
    } else {
      checkboxGroup.classList.remove('selected');
    }
  });

  // Clicks on the padding around the control toggle it too. The checkbox and
  // its label already toggle natively, so forwarding those would undo them.
  checkboxGroup.addEventListener('click', (e) => {
    if (e.target === checkboxGroup) {
      checkbox.click();
    }
  });

  // Restore checked state if already selected
  if (checkbox.checked) {
    checkboxGroup.classList.add('selected');
  }
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

  setupMontantSlider();

  // Restore the firstname collected on its own screen
  const prenomScreen = (SEGMENT_CONFIG[state.segment] || []).find((s) => s.input);
  if (prenomScreen && state.answers.Q_PRENOM) {
    document.getElementById(prenomScreen.input).value = state.answers.Q_PRENOM;
  }

  const segmentScreens = getSegmentScreens();
  renderProgressSteps(segmentScreens.length);

  // Guard against a stale screen index from a previous segment
  if (state.currentScreen > segmentScreens.length - 1) {
    state.currentScreen = 0;
    saveState();
  }

  showScreen(state.currentScreen);
  setupOptionListeners();
  setupCheckboxListener();

  btnNext.addEventListener('click', handleNext);
  btnBack.addEventListener('click', handleBack);
  setupKeyboardNav();

  // Restore form values on the contact screen
  document.getElementById('email').value = state.answers.Q_CONTACT.email || '';
  document.getElementById('phone').value = state.answers.Q_CONTACT.phone || '';
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
