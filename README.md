# Kapitea

Plateforme de qualification de leads pour la gestion de fortune (retraite LPP et héritage).

## Architecture

- **Stack**: HTML/CSS/JS vanilla, 100% statique
- **Hébergement**: Vercel
- **Framework**: Aucun (pas de build step)

## Structure du projet

```
kapitea/
├── css/
│   ├── base.css        # Variables CSS, typographie, composants de base
│   ├── components.css  # En-tête, navigation, formulaires, footer
│   ├── animations.css  # Animations et transitions réutilisables
│   └── mobile.css      # Media queries responsive
├── js/
│   ├── config.example.js  # Template de configuration (versionné)
│   └── config.js          # Configuration runtime (à gitignorer)
├── assets/
│   └── logo/           # Logos et ressources visuelles
├── index.html          # Page d'accueil
├── vercel.json         # Configuration Vercel + headers de sécurité
├── package.json        # Métadonnées du projet (pas de dépendances npm)
└── .gitignore          # Règles d'exclusion git
```

## Configuration

### 1. Créer le fichier de configuration runtime

```bash
cp js/config.example.js js/config.js
```

### 2. Remplir les clés de configuration

Éditer `js/config.js` avec vos vraies valeurs :
- **EmailJS**: `EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_TEMPLATE_ID_CLIENT`
- **Analytics**: `GTM_ID`, `META_PIXEL_ID`
- **Autres**: `MARC_EMAIL`, `CALENDLY_URL`

## Identité visuelle

### Palette de couleurs

- **Terracotta (primary)**: `#9C4A2E`
- **Terracotta dark**: `#7A3922`
- **Terracotta light**: `#C4694A`
- **Neutrals**: Gris 50-900 (`#F5F6F8` → `#111827`)

### Typographie

Font: **Montserrat** (400, 500, 600, 700, 800 weights)
- H1: 32px, 800
- H2: 24px, 700
- Body: 16px, 400
- Text2 (secondary): 14px, 400

## Développement

### Serveur local

```bash
npm run serve
# ou
python -m http.server 8080
```

Ouvrir `http://localhost:8080`

### Organisation des CSS

1. **base.css**: Variables, reset, typographie, utilitaires
2. **components.css**: Composants réutilisables (header, nav, forms, footer, cards)
3. **animations.css**: @keyframes et classes d'animation
4. **mobile.css**: Breakpoints responsifs (768px, 480px)

## Déploiement

Vercel déploie automatiquement la branche `main`.

### Configuration Vercel (`vercel.json`)

- **buildCommand**: Vide (site 100% statique)
- **outputDirectory**: `.` (racine du repo)
- **Headers de sécurité**:
  - HSTS (HTTP Strict Transport Security)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - Referrer-Policy: strict-origin-when-cross-origin

## Prochaines étapes

À venir dans les prompts suivants :
- [ ] Questionnaire de qualification (questionnaire.html + js/funnel.js)
- [ ] Page de remerciement (merci.html)
- [ ] Intégration Supabase et js/crm/
- [ ] Logique métier du funnel
