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
  if (niche === 'lpp' || niche === 'heritage') {
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

// Handle submit
function handleSubmit() {
  // Log state for debugging
  console.log('Funnel completed:', state);

  // Optionally send to backend here (Supabase, EmailJS, etc.)
  // For now, just redirect to thank you page
  window.location.href = '/merci';
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

// Initialize
function init() {
  loadState();
  detectNiche();

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
