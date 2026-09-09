# Kapitea CRM Integration

This folder contains the Supabase and EmailJS integration for Kapitea lead management.

## Setup Instructions

### Step 1: Supabase Configuration

1. **Add database schema** (if not already present)
   - Open your existing Hypoteka Supabase project
   - Go to SQL Editor
   - Copy and execute the SQL from `SCHEMA.sql`
   - This adds three new columns to the `leads` table:
     - `site_source` (defaults to 'hypoteka' for backward compatibility)
     - `montant_capital` (stores the capital amount from questionnaire)
     - `type_persona` (stores 'lpp' or 'heritage')

2. **Create CRM configuration file**
   ```bash
   cp js/crm/config.example.js js/crm/config.js
   ```

3. **Fill in Supabase credentials** in `js/crm/config.js`
   - `URL`: Your Supabase project URL (e.g., `https://xyz.supabase.co`)
   - `ANON_KEY`: Your Supabase anonymous/public API key
   - Find these in your Supabase project Settings → API

### Step 2: EmailJS Configuration

1. **Create new EmailJS project** (separate from Hypoteka)
   - Sign up or log in to [EmailJS](https://www.emailjs.com)
   - Create a new project named "Kapitea"
   - Get your **Public Key**

2. **Create email templates** in EmailJS dashboard
   - Create two email service connections (Gmail, Mailgun, SMTP, etc.)
   - Create two email templates using the content from `EMAILJS_TEMPLATES.md`:
     - Template 1: `kapitea-admin-notification` (notification to Marc)
     - Template 2: `kapitea-client-confirmation` (confirmation to prospect)
   - Note down the Service ID and both Template IDs

3. **Fill in EmailJS credentials** in `js/config.js`
   - `EMAILJS_SERVICE_ID`: Your EmailJS service ID
   - `EMAILJS_TEMPLATE_ID`: ID of the admin notification template
   - `EMAILJS_TEMPLATE_ID_CLIENT`: ID of the client confirmation template
   - `EMAILJS_PUBLIC_KEY`: Your EmailJS public key
   - `MARC_EMAIL_NOTIFICATION`: Email where lead notifications are sent

### Step 3: Verify Configuration

1. Test the funnel locally:
   ```bash
   npm run serve  # or python -m http.server 8080
   ```

2. Fill out a questionnaire and submit
   - Check browser console for Supabase and EmailJS logs
   - Verify lead appears in your Supabase dashboard (`leads` table)
   - Verify emails arrive in Marc's inbox and prospect's inbox

## File Structure

- `config.example.js` — Template for Supabase config (copy to `config.js`)
- `supabase-client.js` — Supabase client singleton
- `lead-ingest.js` — Lead insertion logic
- `emailjs-sender.js` — Email sending logic
- `SCHEMA.sql` — Database schema changes (execute manually)
- `EMAILJS_TEMPLATES.md` — Email template HTML (copy to EmailJS)
- `README.md` — This file

## Data Model

### Inserted Lead Record

When a prospect completes the questionnaire, Kapitea inserts a record into Supabase `leads` table:

```javascript
{
  source: 'questionnaire',           // Fixed value
  site_source: 'kapitea',             // Identifies Kapitea leads (vs Hypoteka)
  type_persona: 'lpp' | 'heritage',   // Segment
  prenom: '...',                      // First name
  tel: '...',                         // Phone (optional)
  email: '...',                       // Email address
  montant_capital: 400000,            // Capital amount from slider
  score_faisabilite: 50,              // Score value (0-100)
  lead_temp: 'chaud' | 'tiede' | 'froid', // Lead temperature
  raw_payload: {...},                 // Complete funnel state as JSON
  advisor_id: null,                   // Marc handles manually for now
  stage: 'nouveau',                   // Initial stage
  created_at: '2026-...',             // Timestamp
}
```

## Scoring Logic

- **score_faisabilite** (0-100):
  - LPP & Heritage: Based on `montant_capital` value
  - <100k → 20, 100k-300k → 50, 300k-600k → 75, >600k → 100

- **lead_temp**:
  - LPP: Based on retirement horizon (high urgency = 90, medium = 50)
  - Heritage: Based on project clarity (precise plan = 80, direction = 50, no idea = 30)
  - Final temperature: 'chaud' if both scores > 60, 'tiede' if one > 60, else 'froid'

## Troubleshooting

### Leads not appearing in Supabase
- Check browser console for errors during submission
- Verify `SUPABASE_CONFIG` is loaded: check `js/crm/config.js` exists and has correct credentials
- Verify Supabase table `leads` exists and has the new columns (run `SCHEMA.sql` if needed)
- Check Supabase RLS policies allow anonymous inserts to `leads` table

### Emails not sending
- Check browser console for EmailJS errors
- Verify `CONFIG.EMAILJS_PUBLIC_KEY` is set in `js/config.js`
- Verify email templates exist in EmailJS dashboard with exact names:
  - `kapitea-admin-notification`
  - `kapitea-client-confirmation`
- Check EmailJS credit balance (free tier has limits)

### Template variables not rendering
- Verify template variable names match exactly in EmailJS and in `sendConfirmationEmails()`
- Template variables should use `{{variable_name}}` syntax in EmailJS

## Security Notes

- `js/crm/config.js` is git-ignored (see `.gitignore`)
- Supabase anonymous key is public by design (used client-side)
- EmailJS public key is public by design (used client-side)
- Never commit real API keys to the repository
- Consider Row-Level Security (RLS) policies in Supabase if sensitive data is added

## Future Improvements

- [ ] Automatic lead assignment based on advisor availability
- [ ] SMS notifications instead of email
- [ ] Lead scoring refinements based on historical data
- [ ] Integration with Calendly webhook for automatic follow-up
