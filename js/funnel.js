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
    Q_HORIZON: null,
    Q_MONTANT: 400000,
    Q_SITUATION_FAMILIALE: null,
    Q_OBJECTIF: null,
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
  if (niche === 'lpp') {
    state.segment = 'lpp';
  } else {
    console.warn('Unknown niche or missing niche parameter:', niche);
    state.segment = 'lpp'; // Default to LPP for now
  }
  saveState();
}

// Calculate score
function calculateScore(state) {
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
const screens = document.querySelectorAll('.questionnaire-screen');
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const currentStepSpan = document.getElementById('current-step');
const progressSteps = document.querySelectorAll('.progress-step');

// Update screen display
function showScreen(screenIndex) {
  screens.forEach((screen, index) => {
    screen.classList.remove('active');
    progressSteps[index].classList.remove('active', 'completed');
  });

  screens[screenIndex].classList.add('active');
  currentStepSpan.textContent = screenIndex + 1;

  // Update progress bar
  for (let i = 0; i < screenIndex; i++) {
    progressSteps[i].classList.add('completed');
  }
  progressSteps[screenIndex].classList.add('active');

  // Update button states
  btnBack.disabled = screenIndex === 0;
  btnNext.textContent = screenIndex === 4 ? 'Terminer' : 'Suivant →';

  // Reset form validation on new screen
  clearFormErrors();

  // Initialize screen-specific content
  if (screenIndex === 1) {
    updateMontantDisplay();
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

  return true;
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

// Update montant display
function updateMontantDisplay() {
  const slider = document.getElementById('montant-slider');
  const display = document.getElementById('montant-display');

  function updateDisplay() {
    const value = parseInt(slider.value, 10);
    state.answers.Q_MONTANT = value;
    display.textContent = formatCurrency(value);
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
  showScreen(state.currentScreen);
  setupOptionListeners();

  btnNext.addEventListener('click', handleNext);
  btnBack.addEventListener('click', handleBack);

  // Restore form values on screen 5
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
