# Kapitea CRM Integration

This folder contains the Supabase and EmailJS integration for Kapitea lead management.

## Setup Instructions

### Step 1: Supabase

Kapitea n'a **pas** de projet Supabase à lui. Les deux marques écrivent
dans la même table `leads`, dans le projet d'Hypoteka, et se relisent dans
le même CRM (`hypoteka.ch/crm`). Ce qui les sépare est la colonne `brand`,
et ce qui décide qui voit quoi est `advisors.brands`.

1. **Exécuter la migration**, une fois, dans l'éditeur SQL du projet
   Supabase existant : `supabase/migration-01-multi-marques.sql`.
   Elle ajoute `leads.brand`, `leads.montant_capital` et
   `advisors.brands`, réécrit les policies RLS pour que la marque prime
   sur tout le reste, et rend le routage des leads conscient des marques.
   Prérequis : le `supabase/schema.sql` d'Hypoteka déjà passé.

2. **Donner les accès** — par défaut la migration laisse les neuf
   conseillers sur Hypoteka seul et donne les deux marques à Marc :
   ```sql
   update public.advisors set brands = array['hypoteka','kapitea'] where slug = '...';
   update public.advisors set brands = array['kapitea']            where slug = '...';
   ```

3. **La configuration est déjà versionnée** (`js/crm/config.js`) et pointe
   sur le même projet qu'Hypoteka — rien à copier. La clé `anon` est
   publique par conception : elle part dans le navigateur de chaque
   visiteur, et ce qui protège les données est la RLS, pas son secret.
   La clé `service_role`, qui contourne la RLS, ne doit jamais apparaître
   dans ce dépôt.

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

- `config.js` — Projet Supabase partagé avec Hypoteka (versionné, clé publique)
- `supabase-client.js` — Supabase client singleton
- `lead-ingest.js` — Lead insertion logic
- `emailjs-sender.js` — Email sending logic
- `../../supabase/migration-01-multi-marques.sql` — Migration base commune (à exécuter une fois)
- `EMAILJS_TEMPLATES.md` — Email template HTML (copy to EmailJS)
- `README.md` — This file

## Data Model

### Inserted Lead Record

When a prospect completes the questionnaire, Kapitea inserts a record into Supabase `leads` table:

```javascript
{
  source: 'questionnaire',            // Valeur fixe (contrainte CHECK côté base)
  brand: 'kapitea',                   // Sépare les deux marques, et pilote la RLS
  segment: 'lpp' | 'heritage' | 'divorce' | 'vente_maison' | 'vente_entreprise',
  prenom: '...',
  tel: '...',                         // Optionnel
  email: '...',
  montant_capital: 400000,            // CHF, curseur du questionnaire
  score_faisabilite: 50,              // 0-100
  lead_temp: 'chaud' | 'tiede' | 'froid',
  raw_payload: {...},                 // État complet du funnel, en JSON
  stage: 'nouveau',
}
```

Trois colonnes sont volontairement absentes de l'insert :

| Colonne | Pourquoi |
|---|---|
| `advisor_id` | Un trigger l'attribue à l'insertion, en écartant les conseillers qui n'ont pas accès à la marque. L'envoyer ici ne sert à rien, il l'écrase. |
| `created_at` | La base a un `default now()`, qui fait foi — pas l'horloge du navigateur du prospect. |
| `localisation` | Kapitea ne demande pas de commune. La laisser nulle est ce qui dit au routage de ne pas chercher. |

## Scoring Logic

- **score_faisabilite** (0-100):
  - Tous les personas : à partir de `montant_capital`
  - <100k → 20, 100k-300k → 50, 300k-600k → 75, >600k → 100

- **lead_temp**:
  - LPP: Based on retirement horizon (high urgency = 90, medium = 50)
  - Heritage: Based on project clarity (precise plan = 80, direction = 50, no idea = 30)
  - Final temperature: 'chaud' if both scores > 60, 'tiede' if one > 60, else 'froid'

## Troubleshooting

### Leads not appearing in Supabase
- Check browser console for errors during submission
- Verify `SUPABASE_CONFIG` is loaded: check `js/crm/config.js` exists and has correct credentials
- Verify que `supabase/migration-01-multi-marques.sql` a bien été exécuté (colonnes `brand`, `montant_capital`)
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

- `js/crm/config.js` **est versionné**, et c'est voulu — le site est
  statique, sans étape de build : un fichier ignoré par git n'existerait
  jamais en production. La clé `anon` est publique par conception.
- Ce qui protège les données n'est donc pas le secret de cette clé mais la
  RLS : le rôle `anon` peut uniquement **insérer** dans `leads`, jamais
  lire, modifier ou supprimer. La clé `service_role`, qui contourne la
  RLS, ne doit jamais toucher ce dépôt.
- Un lead inséré porte la marque que le client déclare. Comme `anon` ne
  peut rien relire, le seul abus possible est d'insérer de faux leads —
  le même risque qu'aujourd'hui côté Hypoteka, à traiter par de
  l'anti-spam (voir « Future Improvements »), pas par la RLS.
- EmailJS public key is public by design (used client-side)
- La clé `service_role` et tout secret serveur n'ont rien à faire ici.

## Future Improvements

- [ ] Automatic lead assignment based on advisor availability
- [ ] SMS notifications instead of email
- [ ] Lead scoring refinements based on historical data
- [ ] Integration with Calendly webhook for automatic follow-up
