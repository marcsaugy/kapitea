/* Courbe ambiante du hero — accueil uniquement.
   Deux gestes : un tracé unique au chargement, puis un parallaxe au
   défilement. Rien d'autre ne bouge sur le site.

   Le parallaxe ne touche que `transform`, et n'est calculé que dans un
   requestAnimationFrame : un handler de scroll qui écrit dans le style à
   chaque événement fait tomber le défilement sous les 60fps. */
(function () {
  'use strict';

  var DESKTOP = '(min-width: 768px)';
  var REDUCED = '(prefers-reduced-motion: reduce)';
  var DRAW_MS = 1200;
  var PARALLAX = 0.3;

  function init() {
    var curve = document.querySelector('.hero-curve');
    var path = curve && curve.querySelector('.hero-curve-path');
    if (!path) return;

    // Sous 768px la courbe est en display:none : rien à animer.
    if (!window.matchMedia(DESKTOP).matches) return;

    var reduced = window.matchMedia(REDUCED).matches;

    if (reduced) {
      // La courbe reste, seul son tracé disparaît : l'aire est posée
      // directement plutôt que révélée.
      curve.classList.add('drawn');
      return;
    }

    draw(curve, path);
    parallax(curve);
  }

  /* Tracé initial. stroke-dashoffset est la seule propriété qu'on puisse
     animer pour dessiner un trait ; une fois arrivé, on efface le
     pointillé pour ne pas laisser un motif inutile au rendu. */
  function draw(curve, path) {
    var length = path.getTotalLength();

    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    curve.style.willChange = 'transform';

    // Force le calcul du style avant de changer la cible, sinon le
    // navigateur regroupe les deux écritures et il n'y a pas de transition.
    void path.getBoundingClientRect();

    path.style.transition = 'stroke-dashoffset ' + DRAW_MS + 'ms var(--ease-out)';
    path.style.strokeDashoffset = '0';
    // L'aire monte en même temps que le trait avance.
    curve.classList.add('drawn');

    path.addEventListener('transitionend', function () {
      path.style.transition = '';
      path.style.strokeDasharray = 'none';
      path.style.strokeDashoffset = '';
      // will-change réserve de la mémoire vidéo : on ne le laisse pas en
      // place. translate3d suffit ensuite à garder la couche promue.
      curve.style.willChange = '';
    }, { once: true });
  }

  function parallax(curve) {
    var hero = curve.parentElement;
    var ticking = false;

    function update() {
      ticking = false;
      // Au-delà du hero la courbe est hors champ : inutile de continuer
      // à écrire dans le style.
      if (window.scrollY > hero.offsetHeight) return;
      curve.style.transform = 'translate3d(0, ' + (window.scrollY * PARALLAX) + 'px, 0)';
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
