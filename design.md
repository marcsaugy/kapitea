# Kapitea — direction artistique

Remplace `design.md`. Référence unique pour toute décision visuelle.

---

## 1. Le sujet, avant l'esthétique

Kapitea s'adresse à quelqu'un qui, à un moment charnière de sa vie, se retrouve avec une somme qu'il n'a jamais eu à gérer. Retraite, succession, séparation, cession. L'état d'esprit dominant n'est pas l'excitation, c'est la prudence teintée d'inconfort : *je ne veux pas me tromper avec cet argent*.

Trois conséquences directes sur le design :

**Le calme est le message.** Tout ce qui accélère, clignote, presse ou gamifie travaille contre nous. Un site qui semble vouloir quelque chose de vous déclenche exactement la méfiance qu'on doit désamorcer.

**Les chiffres sont le contenu principal.** Montants, années, pourcentages, projections. La typographie doit être conçue autour des chiffres, pas les subir.

**Le temps est le sujet caché.** Chaque persona est un avant/après. Le seul endroit où l'on s'autorise de l'audace visuelle, c'est la représentation du temps qui fait croître un capital.

Audience réelle : majoritairement 55–70 ans pour LPP et cession, 35–60 pour héritage, divorce et vente. Cela impose un plancher de lisibilité (corps de texte à 17px minimum, contrastes élevés, zones tactiles généreuses) qui n'est pas une contrainte mais une signature : le site respire parce que son public a besoin qu'il respire.

---

## 2. Principe directeur

> Une seule chose est spectaculaire. Tout le reste se tait.

L'élément mémorable de Kapitea est **la courbe de croissance du capital** : elle apparaît dans le simulateur, en miniature dans les résultats du questionnaire, et en filigrane dans le mark du logo. Partout ailleurs : neutralité disciplinée, blanc, alignement, silence.

C'est le principe qui interdit les décorations flottantes, les dégradés d'ambiance, les cartes qui lévitent, les icônes partout. Chaque fois qu'un élément demande à exister, la question est : est-ce que c'est la courbe ? Si non, il doit être discret.

---

## 3. Palette

La palette est construite en trois couches : un socle neutre chaud, un accent unique, et deux couleurs strictement réservées à la donnée.

### Socle — neutres chauds

Pas de gris bleutés, pas de `#111` tinté. Les neutres sont dérivés de la même famille chromatique que l'accent, ce qui donne à l'ensemble une cohérence qu'un gris standard ne produit jamais.

```css
--ink:        #241A15;  /* texte principal, brun-noir chaud */
--ink-2:      #6B5B52;  /* texte secondaire */
--ink-3:      #9E9089;  /* hints, placeholders, légendes */
--paper:      #FBFAF8;  /* fond de page */
--surface:    #FFFFFF;  /* surfaces élevées */
--line:       #E7E1DC;  /* filets, séparateurs */
--line-2:     #D5CCC5;  /* bordures actives, focus */
```

### Accent — terracotta

Une seule couleur d'accent sur tout le site. Elle ne décore jamais : elle signale l'action, l'état actif, et la progression.

```css
--brique:      #9C4A2E;  /* accent principal, CTA, état actif */
--brique-deep: #74341F;  /* pressed, hover foncé */
--brique-wash: #F5EAE5;  /* fond teinté très léger, badges, zone active */
```

### Données — deux couleurs, exclusivement dans les graphiques

Un graphique empilé tout en terracotta devient illisible. La distinction capital apporté / intérêts générés est le cœur de la démonstration, elle mérite deux teintes réellement distinguables, y compris pour un daltonien.

```css
--data-capital:  #8C7B72;  /* la part que vous avez versée — neutre, sobre */
--data-interet:  #9C4A2E;  /* la part générée par le temps — l'accent */
--data-retrait:  #B9AFA8;  /* phase de décaissement */
```

Règle : ces trois valeurs n'apparaissent **jamais** en dehors d'un SVG de graphique.

### États système

```css
--ok:    #4A7C59;
--warn:  #A67C2E;
--err:   #A33A2A;
```

Discrets, désaturés, dans la même température que le reste. Pas de vert fluo ni de rouge d'alerte.

---

## 4. Typographie

### Familles

**UI et display : une seule grotesque, `Schibsted Grotesk`.** Suffisamment neutre pour un contexte financier, avec une personnalité propre que n'ont ni Inter ni Montserrat, et une plage de graisses large qui permet de jouer la hiérarchie par le poids plutôt que par la couleur. Disponible sur Google Fonts.

*Alternative si Schibsted Grotesk pose problème : `Archivo`, avec sa variante Expanded réservée aux très grands titres.*

**Chiffres.** Obligatoire partout où un montant apparaît :

```css
font-variant-numeric: tabular-nums;
font-feature-settings: "tnum" 1;
```

Sans ça, les montants sautent horizontalement quand un slider bouge. C'est le détail qui sépare un outil professionnel d'une page bricolée.

### Échelle

Progression basée sur un rapport ~1.25, ancrée sur un corps de 17px.

| Rôle | Taille | Graisse | Tracking | Interligne |
|---|---|---|---|---|
| Display (hero) | clamp(2.5rem, 6vw, 4.5rem) | 600 | -0.035em | 1.05 |
| Titre de section | clamp(1.75rem, 3vw, 2.25rem) | 600 | -0.025em | 1.15 |
| Question (funnel) | clamp(1.375rem, 2.5vw, 1.75rem) | 550 | -0.02em | 1.25 |
| Montant affiché | clamp(2rem, 5vw, 3rem) | 500 | -0.03em | 1 |
| Corps | 1.0625rem (17px) | 400 | 0 | 1.6 |
| Corps appuyé | 1.0625rem | 550 | 0 | 1.6 |
| Légende / hint | 0.9375rem (15px) | 400 | 0 | 1.5 |
| Micro (mentions) | 0.8125rem (13px) | 450 | 0.01em | 1.45 |

**Le tracking négatif sur les grands titres est non négociable.** C'est ce qui produit la densité optique d'Apple. Un titre de 64px au tracking par défaut a l'air amateur.

### Interdits typographiques

- Pas de majuscules pour les labels (`ALL CAPS` tracké = signature générée).
- Pas de mot isolé en couleur ou en italique dans un titre.
- Pas d'eyebrow au-dessus des titres.
- Pas de flèche `→` collée au texte des boutons.
- Longueur de ligne maximale 68 caractères (`max-width: 34em`).

---

## 5. Structure et grille

### Grille

12 colonnes, gouttière 24px, largeur de contenu maximale 1200px, marges latérales 24px en mobile / 48px en desktop.

**Alignement à gauche par défaut.** Le texte centré sur plusieurs lignes est difficile à lire et signale l'amateurisme. Seules exceptions : le hero de la page d'accueil et le montant central du simulateur.

### Échelle d'espacement

Base 8, avec un seul demi-pas.

```
4 · 8 · 16 · 24 · 40 · 64 · 96 · 144
```

Les sections respirent : 96px de séparation verticale en desktop, 64px en mobile. Le manque d'air est la cause la plus fréquente d'une page qui semble bricolée.

### Rayons — différenciés selon la fonction

L'erreur actuelle est un rayon unique partout. Le rayon doit encoder la nature de l'objet :

```css
--r-input:   8px;   /* champs, sliders — objets précis */
--r-card:    4px;   /* cartes de choix — objets sobres, presque droits */
--r-pill:    999px; /* badges d'état uniquement */
--r-surface: 16px;  /* panneaux larges, le simulateur */
```

### Élévation — quasi absente

Une seule ombre dans tout le système, et elle ne sert que pour les éléments réellement flottants (menu, tooltip) :

```css
--shadow: 0 12px 32px -8px rgba(36, 26, 21, 0.14);
```

Les cartes ne portent **pas** d'ombre. Elles se distinguent par un filet `--line` et par leur fond. Une page où tout flotte est une page où rien n'est important.

---

## 6. La grille de sélection — refonte

Le problème actuel : six cartes identiques rangées en grille neutre, sans hiérarchie.

La correction repose sur trois idées.

**Hiérarchie réelle par le volume.** Les deux personas actifs en publicité (retraite, héritage) occupent une carte pleine largeur ou double largeur en haut. Les trois autres sont plus compacts, en dessous. La densité visuelle reflète la priorité commerciale.

**Suppression des icônes rondes.** Les pastilles circulaires colorées sont une convention de template. À la place : un filet de 2px en haut de chaque carte, dans `--line`, qui passe à `--brique` au survol et au focus. Un seul geste, aucune décoration.

**Le simulateur ne vit pas dans la grille.** Il n'est pas un persona, il ne doit pas ressembler à une carte de plus. Il devient une bande pleine largeur sous la grille, fond `--ink`, texte clair, avec la courbe animée en fond à très faible opacité. C'est la seule inversion de contraste du site, donc elle porte.

```
┌──────────────────────────┬──────────────────────────┐
│  Je pars à la retraite   │  J'ai reçu un héritage   │
│  Capital LPP ou 3e pilier│  Je ne sais pas quoi en  │
│                          │  faire                   │
└──────────────────────────┴──────────────────────────┘
┌───────────────┬───────────────┬───────────────┐
│ Je me sépare  │ J'ai vendu    │ J'ai vendu    │
│               │ un bien       │ mon entreprise│
└───────────────┴───────────────┴───────────────┘
┌─────────────────────────────────────────────────────┐
│ ▓▓ Voir l'effet du temps sur un capital   [courbe] ▓│
└─────────────────────────────────────────────────────┘
```

---

## 7. Direction du mouvement

Trois règles, dans cet ordre de priorité.

**1. Le mouvement répond à une action, il ne se déclenche pas tout seul.** Pas d'apparition au défilement section par section, pas de compteurs qui s'animent quand on arrive dessus. Ces effets sont la signature la plus reconnaissable d'une page générée.

**2. Un seul moment orchestré sur tout le site.** La courbe du simulateur se dessine une fois, de gauche à droite, à la première ouverture. C'est tout. Elle ne se rejoue pas au défilement.

**3. Chaque transition explique un changement d'état.** Si une animation n'apprend rien à l'utilisateur, elle est retirée.

### Courbes et durées

```css
--ease-out:   cubic-bezier(0.16, 1, 0.3, 1);    /* entrées, révélations */
--ease-inout: cubic-bezier(0.65, 0, 0.35, 1);   /* déplacements */
--t-fast:   140ms;  /* retour tactile : survol, pression */
--t-base:   240ms;  /* changement d'écran, ouverture */
--t-slow:   420ms;  /* la courbe qui se dessine */
```

Rien au-delà de 420ms. Une animation lente donne l'impression que le site rame.

### Transitions du questionnaire

C'est le cœur de l'expérience, elle mérite un traitement spécifique.

- **Avancer :** l'écran sortant glisse de 24px vers la gauche en passant à `opacity: 0` sur 180ms ; l'écran entrant arrive de 24px depuis la droite sur 240ms. Le sens du mouvement encode le sens de la navigation.
- **Reculer :** exactement l'inverse. L'utilisateur sent qu'il revient en arrière.
- **Barre de progression :** croissance continue en `--t-base`, jamais de saut sec.
- **Sélection d'une réponse :** le filet de la carte passe à `--brique` en 140ms, puis passage automatique à l'écran suivant après 260ms. Ce court délai est délibéré : il confirme le choix avant de faire disparaître l'écran, sinon l'utilisateur doute d'avoir cliqué au bon endroit.

### Sliders de montant

Le chiffre au-dessus du slider ne se contente pas de changer : il s'interpole. Quand la valeur passe de 400 000 à 410 000, le nombre affiché parcourt les valeurs intermédiaires sur 120ms. Cela crée la sensation de matière, la même que le défilement à inertie d'iOS.

### Graphique du simulateur

Redessin à chaque `input`, sans transition CSS sur les barres — la fluidité vient de la fréquence de rafraîchissement, pas d'une animation. Seule exception : le premier dessin, en `--t-slow`.

### Accessibilité du mouvement

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Non négociable. Une partie de l'audience cible est sensible au mouvement.

---

## 8. Plancher de qualité

À vérifier avant toute mise en production. Ces points ne sont pas des améliorations, ce sont les conditions minimales.

- **Focus visible** sur tout élément interactif : `outline: 2px solid var(--brique); outline-offset: 3px`. Jamais `outline: none` sans remplacement.
- **Navigation complète au clavier** dans le questionnaire : flèches pour parcourir les réponses, Entrée pour valider, Échap sans effet destructeur.
- **Zones tactiles** de 48px minimum en hauteur.
- **Contraste** : 4.5:1 minimum pour le texte courant, 3:1 pour les grands titres. `--ink-3` ne sert jamais à du texte porteur d'information.
- **Sliders** utilisables au clavier et annoncés correctement (`aria-valuenow`, `aria-valuetext` avec le montant formaté en français).
- **Aucun décalage de mise en page** au chargement des polices : `font-display: swap` avec une métrique de repli ajustée.
- **Formatage suisse des montants** : apostrophe typographique comme séparateur de milliers (`CHF 400'000`), pas d'espace ni de virgule.

---

## 9. Voix

Phrases courtes. Verbes actifs. Vouvoiement. Jamais de point d'exclamation.

Un bouton dit ce qui se passe : « Voir mon analyse », pas « Envoyer ». Le même mot est utilisé du début à la fin d'un parcours.

Les erreurs ne s'excusent pas et ne sont jamais vagues : « Ce numéro ne semble pas valide en Suisse », pas « Une erreur est survenue ».

Un écran vide propose une action.

---

## 10. Ce qui est explicitement banni

- Cartes toutes identiques avec la même ombre douce grise.
- Dégradés utilisés comme décoration de fond.
- Pastilles d'icônes circulaires colorées.
- Apparitions au défilement.
- Emoji comme icônes.
- Deux couleurs d'accent concurrentes.
- Labels en majuscules trackées.
- Chaînes de méta séparées par des points médians.
- Effets de verre dépoli.
- Illustrations décoratives sans fonction.

---

## 11. Le logo, plus tard

Le mark actuel (K dont la barre devient une flèche) reste une esquisse de direction, pas un fichier de production. À reprendre une fois le système en place, en le construisant sur la même courbe que le graphique du simulateur plutôt que sur une flèche générique : la cohérence entre le mark et l'outil est ce qui rendra la marque mémorable.
