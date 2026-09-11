/* Le tambour de « Ce qu'on regarde avant de parler placement ».
 *
 * Les quatre volets sont posés sur un cylindre, comme les heures d'un
 * minuteur iOS. Le panneau reste épinglé pendant toute la traversée de la
 * piste : la page ne descend pas, c'est le cylindre qui tourne.
 *
 * Amélioration progressive : ce fichier ajoute la classe qui déclenche
 * l'effet. Sans lui — script bloqué, écran étroit, mouvement réduit — le
 * balisage reste la liste verticale d'origine, avec son fil et ses quatre
 * volets lisibles d'un coup.
 */
(function () {
  'use strict';

  /* Le tambour a besoin de largeur — le défilement tactile et la barre
     d'adresse d'iOS rendent l'épinglage instable — et de hauteur : sous
     720px, l'intro et le cylindre ne tiennent plus ensemble dans l'écran
     et le volet du haut viendrait chevaucher le titre. */
  var DESKTOP = '(min-width: 1000px) and (min-height: 720px)';
  var REDUCED = '(prefers-reduced-motion: reduce)';

  /* Pas angulaire entre deux volets. Au-delà de ~40° le volet voisin
     devient illisible ; en deçà de ~25° la rotation ne se voit plus. */
  var STEP_DEG = 34;

  function init() {
    var section = document.querySelector('.approach');
    var track = section && section.querySelector('.approach-track');
    var list = section && section.querySelector('.approach-list');
    if (!track || !list) return;

    var items = Array.prototype.slice.call(list.querySelectorAll('.approach-item'));
    if (items.length < 2) return;

    if (!window.matchMedia(DESKTOP).matches) return;
    if (window.matchMedia(REDUCED).matches) return;

    /* Hauteur d'un volet : celle du plus haut, pour que tous occupent la
       même case du cylindre.

       La mesure se fait une fois le mode tambour posé et la hauteur
       laissée libre. Mesurer avant donnait 237px au lieu de 141 : la
       liste verticale sépare ses volets par 40px de marge haute et basse,
       or sur le cylindre c'est l'écart angulaire qui les sépare, et ces
       80px n'existent plus. Le tambour se retrouvait plus haut que
       l'écran et le premier volet chevauchait le chapô. */
    section.classList.add('approach--drum');
    list.style.setProperty('--item-h', 'auto');

    var itemHeight = items.reduce(function (max, el) {
      return Math.max(max, el.getBoundingClientRect().height);
    }, 0);

    // Rayon du cylindre : celui pour lequel deux volets séparés de
    // STEP_DEG se touchent exactement, sans chevauchement ni trou.
    var radius = (itemHeight / 2) / Math.tan((STEP_DEG / 2) * Math.PI / 180);

    // Hauteur du tambour : exactement ce qu'occupe le volet courant plus
    // ses deux voisins inclinés, ni plus ni moins.
    var reach = radius * Math.sin(STEP_DEG * Math.PI / 180) + itemHeight / 2;

    list.style.setProperty('--item-h', itemHeight + 'px');
    list.style.setProperty('--drum-h', Math.ceil(reach * 2) + 'px');

    var ticking = false;

    function render(force) {
      ticking = false;

      var rect = track.getBoundingClientRect();
      // Hors champ, rien à calculer — sauf au tout premier passage. Sans
      // cette exception, les quatre volets restaient empilés au centre du
      // cylindre, à pleine opacité, jusqu'au premier événement de
      // défilement : le temps d'une image, les textes se superposaient.
      if (!force && (rect.bottom < 0 || rect.top > window.innerHeight)) return;

      var span = track.offsetHeight - window.innerHeight;
      var progress = span > 0 ? -rect.top / span : 0;
      progress = Math.min(Math.max(progress, 0), 1);

      // Le volet 0 est en face au début, le dernier à la fin.
      var active = progress * (items.length - 1);

      for (var i = 0; i < items.length; i++) {
        var deg = (active - i) * STEP_DEG;
        var cos = Math.cos(deg * Math.PI / 180);

        items[i].style.transform =
          'rotateX(' + deg.toFixed(2) + 'deg) translateZ(' + radius.toFixed(1) + 'px)';
        // De face, pleine lecture ; de profil, effacé. Le carré du cosinus
        // creuse le contraste entre le volet courant et ses voisins.
        items[i].style.opacity = cos > 0 ? (0.12 + 0.88 * cos * cos).toFixed(3) : '0';
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      // Pas `requestAnimationFrame(render)` : la frame passerait son
      // horodatage en premier argument, toujours vrai, et `force` serait
      // armé à chaque image.
      requestAnimationFrame(function () { render(false); });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    render(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
