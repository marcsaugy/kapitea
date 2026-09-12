// Configuration template for Kapitea
// Copy this file to js/config.js and fill in your actual values
// Never commit js/config.js to version control

const CONFIG = {
  // EmailJS configuration (separate Kapitea account, not shared with Hypoteka)
  EMAILJS_SERVICE_ID: 'YOUR_EMAILJS_SERVICE_ID',
  EMAILJS_TEMPLATE_ID: 'kapitea-admin-notification', // Template for Marc (internal notification)
  EMAILJS_TEMPLATE_ID_CLIENT: 'kapitea-client-confirmation', // Template for prospect confirmation
  EMAILJS_PUBLIC_KEY: 'YOUR_EMAILJS_PUBLIC_KEY',

  // Email configuration
  MARC_EMAIL: 'marc.saugy@example.com',
  MARC_EMAIL_NOTIFICATION: 'marc.saugy@example.com', // Destination for lead notifications

  // Analytics and tracking
  GTM_ID: 'YOUR_GOOGLE_TAG_MANAGER_ID',
  META_PIXEL_ID: 'YOUR_META_PIXEL_ID',

  // External services

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
