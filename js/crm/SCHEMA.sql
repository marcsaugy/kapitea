-- Kapitea Schema Additions for Supabase
-- Execute these commands manually in your Supabase project's SQL editor
-- This adds support for Kapitea leads to the existing Hypoteka leads table
-- No existing columns are modified, only new ones are added

-- Add site_source column to distinguish leads by platform
-- Default to 'hypoteka' for backward compatibility with existing leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS site_source TEXT DEFAULT 'hypoteka';

-- Add montant_capital column to store the capital amount from the questionnaire
-- Numeric type to allow precise currency calculations
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS montant_capital NUMERIC;

-- Add type_persona column to categorize lead by persona/segment
-- Expected values: 'lpp' (retirement capital), 'heritage' (inheritance)
-- This is redundant with segment but kept for dashboard compatibility
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS type_persona TEXT;

-- (Optional) Create index on site_source for faster filtering
-- Only if you plan to query Kapitea leads separately from Hypoteka
CREATE INDEX IF NOT EXISTS idx_leads_site_source ON leads(site_source);

-- (Optional) Create index on type_persona for segment analysis
CREATE INDEX IF NOT EXISTS idx_leads_type_persona ON leads(type_persona);
