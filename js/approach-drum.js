/* Le tambour de « Ce qu'on regarde avant de parler placement ».
 *
 * Les quatre volets sont posés sur un cylindre, comme les heures d'un
 * minuteur iOS. Le panneau reste épinglé pendant toute la traversée de la
 * piste : la page ne descend pas, c'est le cylindre qui tourne.
 *
 * Amélioration progressive : ce fichier ajoute la classe qui déclenche
 * l'effet. Sans lui — script bloqué, écran trop court, mouvement réduit —
 * le balisage reste la liste verticale d'origine, avec son fil et ses
 * quatre volets lisibles d'un coup.
 */
(function () {
  'use strict';

  var REDUCED = '(prefers-reduced-motion: reduce)';

  /* Pas angulaire de départ. Au-delà de ~40° le volet voisin devient
     illisible, en deçà de ~25° la rotation ne se voit plus. Il s'ouvre
     jusqu'à MAX_STEP quand l'écran est trop court : un pas plus large
     rapproche les voisins du profil, donc raccourcit le cylindre. */
  var STEP_DEG = 34;
  var MAX_STEP = 82;

  /* Marge de sécurité sous le cylindre. Sur iOS la hauteur utile bouge
     d'une poignée de pixels selon l'état de la barre d'outils. */
  var SAFETY = 16;

  function init() {
    var section = document.querySelector('.approach');
    var track = section && section.querySelector('.approach-track');
    var sticky = section && section.querySelector('.approach-sticky');
    var intro = section && section.querySelector('.approach-intro');
    var list = section && section.querySelector('.approach-list');
    if (!track || !sticky || !intro || !list) return;

    var items = Array.prototype.slice.call(list.querySelectorAll('.approach-item'));
    if (items.length < 2) return;

    if (window.matchMedia(REDUCED).matches) return;

    var step = STEP_DEG;
    var radius = 0;
    var ticking = false;
    var sized = false;

    /* Géométrie du cylindre. Recalculée à chaque redimensionnement : sur
       téléphone, une rotation d'écran change tout — la largeur des volets,
       donc leur hauteur, donc le rayon. */
    function measure() {
      section.classList.add('approach--drum');

      // Hauteur libre pendant la mesure. Mesurer avant de poser la classe
      // donnait 237px au lieu de 141 : la liste verticale sépare ses
      // volets par 40px de marge haute et basse, or sur le cylindre c'est
      // l'écart angulaire qui les sépare et ces 80px n'existent plus.
      list.style.setProperty('--item-h', 'auto');

      var itemHeight = items.reduce(function (max, el) {
        return Math.max(max, el.getBoundingClientRect().height);
      }, 0);

      var introBox = intro.getBoundingClientRect().height +
                     parseFloat(getComputedStyle(intro).marginBottom || 0);
      var available = sticky.getBoundingClientRect().height - introBox - SAFETY;

      /* La hauteur d'un cylindre vaut h·(2 + cos Δ) : le volet courant, et
         de part et d'autre la projection de ses voisins. On en tire le pas
         le plus serré qui tienne dans la place disponible, plutôt que
         d'imposer 34° et de laisser le volet du haut recouvrir le chapô —
         c'est ce qui arrivait dès qu'on sortait du grand écran. */
      var ratio = available / itemHeight - 2;
      var fitted = ratio >= 1 ? STEP_DEG
                 : ratio <= Math.cos(MAX_STEP * Math.PI / 180) ? Infinity
                 : Math.acos(ratio) * 180 / Math.PI;

      if (fitted === Infinity) {
        // Même à plat le cylindre déborde : la liste verticale reste la
        // meilleure réponse, elle au moins se lit.
        section.classList.remove('approach--drum');
        list.style.removeProperty('--item-h');
        list.style.removeProperty('--drum-h');
        sized = false;
        return;
      }

      step = Math.max(STEP_DEG, fitted);
      radius = (itemHeight / 2) / Math.tan((step / 2) * Math.PI / 180);

      var reach = radius * Math.sin(step * Math.PI / 180) + itemHeight / 2;
      list.style.setProperty('--item-h', itemHeight + 'px');
      list.style.setProperty('--drum-h', Math.ceil(reach * 2) + 'px');
      sized = true;
    }

    function render(force) {
      ticking = false;
      if (!sized) return;

      var rect = track.getBoundingClientRect();
      // Hors champ, rien à calculer — sauf au tout premier passage. Sans
      // cette exception, les quatre volets restaient empilés au centre du
      // cylindre, à pleine opacité, jusqu'au premier événement de
      // défilement : le temps d'une image, les textes se superposaient.
      if (!force && (rect.bottom < 0 || rect.top > window.innerHeight)) return;

      /* La course se mesure sur la hauteur réelle du panneau épinglé, pas
         sur window.innerHeight : sur iOS, celle-ci grandit quand la barre
         d'outils se rétracte, et le cylindre sautait en plein défilement. */
      var span = track.offsetHeight - sticky.getBoundingClientRect().height;
      var progress = span > 0 ? -rect.top / span : 0;
      progress = Math.min(Math.max(progress, 0), 1);

      // Le volet 0 est en face au début, le dernier à la fin.
      var active = progress * (items.length - 1);

      for (var i = 0; i < items.length; i++) {
        var deg = (active - i) * step;
        var cos = Math.cos(deg * Math.PI / 180);

        /* Le cylindre est d'abord reculé de son rayon, pour que la face
           avant se retrouve à z = 0. Sans ce recul, le volet courant est
           à z = +rayon, donc grossi par la perspective — de 20% sur un
           iPhone 12, assez pour que son texte déborde du cadre et se
           fasse couper à droite. Les voisins, eux, s'enfoncent et
           rapetissent : c'est ce que fait un vrai sélecteur. */
        items[i].style.transform =
          'translateZ(' + (-radius).toFixed(1) + 'px) ' +
          'rotateX(' + deg.toFixed(2) + 'deg) ' +
          'translateZ(' + radius.toFixed(1) + 'px)';
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

    var resizeTimer = null;
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        measure();
        render(true);
      }, 150);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    measure();
    render(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
