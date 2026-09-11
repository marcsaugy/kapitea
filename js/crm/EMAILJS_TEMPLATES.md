# EmailJS Templates for Kapitea

Create two email templates in your EmailJS dashboard with the content below.
Use the template names and IDs in `js/config.js` (EMAILJS_TEMPLATE_ID and EMAILJS_TEMPLATE_ID_CLIENT).

---

## Template 1: Admin Notification (Internal)

**Name in EmailJS:** `kapitea-admin-notification`

**Subject:**
```
Nouveau lead Kapitea — {{prenom}} · {{type_persona}} · {{lead_temp}}
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #9C4A2E; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background-color: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; }
    .value { font-size: 16px; color: #111; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge.chaud { background-color: #FECACA; color: #991B1B; }
    .badge.tiede { background-color: #FCD34D; color: #78350F; }
    .badge.froid { background-color: #D1D5DB; color: #374151; }
    .footer { font-size: 12px; color: #999; text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Kapitea — Nouveau lead</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Prénom</div>
        <div class="value">{{prenom}}</div>
      </div>
      
      <div class="field">
        <div class="label">Email</div>
        <div class="value">{{email}}</div>
      </div>
      
      <div class="field">
        <div class="label">Téléphone</div>
        <div class="value">{{tel}}</div>
      </div>
      
      <div class="field">
        <div class="label">Type de persona</div>
        <div class="value">{{type_persona}}</div>
      </div>
      
      <div class="field">
        <div class="label">Montant du capital</div>
        <div class="value">{{montant_capital}}</div>
      </div>
      
      <div class="field">
        <div class="label">Température du lead</div>
        <div class="value">
          <span class="badge {{lead_temp}}">{{lead_temp}}</span>
        </div>
      </div>
      
      <div class="field">
        <div class="label">Date de création</div>
        <div class="value">{{created_at}}</div>
      </div>
    </div>
    
    <div class="footer">
      <p>Lead reçu via le questionnaire Kapitea — <a href="https://www.kapitea.ch">kapitea.ch</a></p>
    </div>
  </div>
</body>
</html>
```

---

## Template 2: Client Confirmation

**Name in EmailJS:** `kapitea-client-confirmation`

**Subject:**
```
{{prenom}}, votre demande est bien reçue — Kapitea
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #111827; background-color: #f5f6f8; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background-color: #9C4A2E; color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
    .header-subtitle { font-size: 16px; margin-top: 8px; opacity: 0.9; }
    .content { padding: 40px 20px; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0; }
    .section p { color: #6B7280; margin: 0 0 12px 0; line-height: 1.8; }
    .checklist { list-style: none; padding: 0; margin: 0; }
    .checklist li { padding: 10px 0; padding-left: 28px; position: relative; color: #6B7280; }
    .checklist li::before { content: '✓'; position: absolute; left: 0; color: #10B981; font-weight: bold; font-size: 18px; }
    .button { display: inline-block; background-color: #9C4A2E; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
    .footer { background-color: #f5f6f8; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #EAECF0; }
    .footer p { margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Merci {{prenom}}</h1>
      <p class="header-subtitle">Votre demande est bien reçue</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>Bienvenue chez Kapitea</h2>
        <p>Nous avons bien reçu votre demande de qualification. Un conseiller FINMA indépendant étudiera votre profil et vous proposera une stratégie personnalisée.</p>
      </div>
      
      <div class="section">
        <h2>Prochaines étapes</h2>
        <ul class="checklist">
          <li>Étude de votre dossier : 24 à 48h</li>
          <li>Contact du conseiller par email ou téléphone</li>
          <li>Rendez-vous de consultation pour affiner votre stratégie</li>
        </ul>
      </div>
      
      <div class="section">
        <h2>Accélérez le processus</h2>
        <p>Vous pouvez réserver directement un créneau de 30 minutes avec le conseiller. Les créneaux disponibles sont affichés après l'envoi de ce message.</p>
        <a href="https://www.kapitea.ch/merci" class="button">Voir les créneaux disponibles</a>
      </div>
      
      <div class="section">
        <p style="font-size: 14px; color: #6B7280; margin: 0;">
          <strong>Questions ?</strong> Vous pouvez répondre directement à cet email ou contacter le conseiller au numéro visible sur le site.
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p>&copy; 2026 Kapitea — Conseil en gestion de fortune</p>
      <p>Conseiller FINMA inscrit au registre BX</p>
    </div>
  </div>
</body>
</html>
```

---

## Integration Notes

- Replace `{{prenom}}`, `{{email}}`, `{{tel}}`, `{{type_persona}}`, `{{montant_capital}}`, `{{lead_temp}}`, and `{{created_at}}` with the actual template variables from your funnel state.
- Template variables should match the field names sent via EmailJS from `js/funnel.js` (see `sendConfirmationEmails()` function).
- Color `#9C4A2E` is the Kapitea terracotta brand color (see `design.md`).
- Adjust links and footer text as needed for your deployment (e.g., replace `kapitea.ch/merci` with actual URL).
