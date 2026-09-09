// Supabase Client Singleton for Kapitea
// Initializes Supabase client from config

class SupabaseClient {
  constructor() {
    if (SupabaseClient.instance) {
      return SupabaseClient.instance;
    }

    this.client = null;
    this.initialized = false;

    SupabaseClient.instance = this;
  }

  // Initialize client with config
  init(config) {
    if (this.initialized) {
      return this.client;
    }

    if (!config || !config.URL || !config.ANON_KEY) {
      console.error('Supabase config is missing URL or ANON_KEY');
      return null;
    }

    // Load Supabase library from CDN
    if (typeof supabase === 'undefined') {
      console.error('Supabase library not loaded');
      return null;
    }

    // Create client using global supabase object
    this.client = supabase.createClient(config.URL, config.ANON_KEY);
    this.initialized = true;

    return this.client;
  }

  // Get client instance
  getClient() {
    if (!this.initialized) {
      console.warn('Supabase client not initialized');
      return null;
    }
    return this.client;
  }

  // Get table reference
  table(tableName) {
    const client = this.getClient();
    if (!client) {
      return null;
    }
    return client.from(tableName);
  }
}

// Create singleton instance
const supabaseClientInstance = new SupabaseClient();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = supabaseClientInstance;
}
