// Configuration template for Kapitea
// Copy this file to js/config.js and fill in your actual values
// Never commit js/config.js to version control

const CONFIG = {
  // EmailJS configuration
  EMAILJS_SERVICE_ID: 'YOUR_EMAILJS_SERVICE_ID',
  EMAILJS_TEMPLATE_ID: 'YOUR_EMAILJS_TEMPLATE_ID',
  EMAILJS_TEMPLATE_ID_CLIENT: 'YOUR_EMAILJS_TEMPLATE_ID_CLIENT',
  EMAILJS_PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',

  // Email configuration
  MARC_EMAIL: 'marc.saugy@example.com',

  // Analytics and tracking
  GTM_ID: 'YOUR_GOOGLE_TAG_MANAGER_ID',
  META_PIXEL_ID: 'YOUR_META_PIXEL_ID',

  // External services
  CALENDLY_URL: 'https://calendly.com/YOUR_USERNAME',

  // Brand configuration
  BRAND_NAME: 'Kapitea',

  // Environment
  ENVIRONMENT: 'production',

  // Optional: API endpoints
  // API_BASE_URL: 'https://api.example.com',
};

// Export for module usage (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
