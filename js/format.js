// Formatage des montants — référence unique pour tout le site.
// Convention suisse : apostrophe comme séparateur de milliers, CHF en préfixe.
// Intl.NumberFormat('fr-CH') produit « 400 000 CHF » (espace insécable, suffixe),
// ce qui n'est pas la convention retenue.

function formatCHF(value) {
  return 'CHF ' + formatAmount(value);
}

// Nombre seul, sans devise (axes de graphique, champs)
function formatAmount(value) {
  const rounded = Math.round(Number(value) || 0);
  const sign = rounded < 0 ? '-' : '';
  return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

/* Interpolation du montant affiché au-dessus d'un slider.
   Un pas de 10'000 fait sauter le chiffre d'un coup et casse le lien
   entre le geste et la valeur. 120ms le rétablissent sans donner
   l'impression que l'affichage traîne derrière la poignée. */
const TWEEN_MS = 120;
const tweenState = new WeakMap();

/* Le montant est désormais un champ éditable : textContent n'y écrit rien.
   Un seul point de sortie pour les deux cas, plutôt qu'un test dispersé
   dans chaque branche de l'interpolation. */
function writeAmount(el, text) {
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    el.value = text;
  } else {
    el.textContent = text;
  }
}

/* Écarte à la volée ce qui n'est pas un nombre, sans renvoyer le curseur
   de texte en fin de ligne.

   Réécrire la valeur d'un input y replace le curseur à la fin : corriger
   un chiffre au milieu d'un montant deviendrait impossible dès qu'une
   frappe est refusée. On compte donc ce qui a été retiré AVANT le curseur,
   et on le repose à la même place logique.

   `nettoyer` reçoit du texte et renvoie du texte — pas un nombre : pendant
   la frappe, « 4. » est un état légitime qu'un parseur réduirait à « 4 »,
   effaçant le séparateur au moment même où on le tape. */
function sanitizeField(el, nettoyer) {
  const avant = el.value;
  const propre = nettoyer(avant);
  if (propre === avant) {
    return propre;
  }
  const pos = el.selectionStart;
  const retiresAvantCurseur = pos - nettoyer(avant.slice(0, pos)).length;
  el.value = propre;
  const nouveau = Math.max(pos - retiresAvantCurseur, 0);
  // setSelectionRange lève sur un input qui ne le gère pas (type number…)
  try {
    el.setSelectionRange(nouveau, nouveau);
  } catch (e) {
    /* sans importance : la valeur est posée, seul le curseur est perdu */
  }
  return propre;
}

function tweenAmount(el, target, format) {
  const render = format || formatCHF;
  const to = Number(target) || 0;
  const previous = tweenState.get(el);

  if (previous && previous.frame) {
    cancelAnimationFrame(previous.frame);
  }

  // Pas de valeur de départ au premier rendu : rien à interpoler.
  const from = previous ? previous.value : to;

  if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    writeAmount(el, render(to));
    tweenState.set(el, { value: to, frame: 0 });
    return;
  }

  const start = performance.now();

  function step(now) {
    // L'horodatage d'un requestAnimationFrame est celui du début de la
    // frame, qui peut précéder l'appel : sans plancher à 0, la première
    // image afficherait une valeur en deçà du point de départ.
    const t = Math.min(Math.max((now - start) / TWEEN_MS, 0), 1);
    // Sortie cubique : l'essentiel du chemin est parcouru tout de suite
    const value = t === 1 ? to : from + (to - from) * (1 - Math.pow(1 - t, 3));
    writeAmount(el, render(value));
    tweenState.set(el, { value: value, frame: t === 1 ? 0 : requestAnimationFrame(step) });
  }

  tweenState.set(el, { value: from, frame: requestAnimationFrame(step) });
}
