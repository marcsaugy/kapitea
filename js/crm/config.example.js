// Supabase Configuration Template for Kapitea
// Copy this file to js/crm/config.js and fill in your actual credentials
// from the existing Hypoteka Supabase project

const SUPABASE_CONFIG = {
  // Supabase project URL
  URL: 'https://YOUR_PROJECT_ID.supabase.co',

  // Supabase anonymous (public) API key
  // This key should have read/write access to the leads table
  ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPABASE_CONFIG;
}
