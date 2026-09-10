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
    el.textContent = render(to);
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
    el.textContent = render(value);
    tweenState.set(el, { value: value, frame: t === 1 ? 0 : requestAnimationFrame(step) });
  }

  tweenState.set(el, { value: from, frame: requestAnimationFrame(step) });
}
