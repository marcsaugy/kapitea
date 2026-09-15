/* La bande des partenaires.
 *
 * Deux copies de la même liste défilent côte à côte, et l'animation
 * translate l'ensemble d'exactement une copie : au moment où elle boucle,
 * la seconde occupe la place qu'occupait la première. Rien ne saute, il
 * n'y a pas de fin de liste à gérer.
 *
 * Les logos ne sont pas encore dans le dépôt. Chaque partenaire s'affiche
 * donc en toutes lettres, et ce fichier tente en parallèle de charger
 * assets/partners/<slug>.svg — puis .png. Dès qu'un fichier existe, il
 * remplace le libellé. Rien à modifier ici le jour où ils arrivent : il
 * suffit de déposer les fichiers.
 *
 * Amélioration progressive : sans JS, la liste reste une liste lisible.
 */
(function () {
  'use strict';

  /* L'ordre est celui fourni. Le slug sert à la fois de nom de fichier et
     de clé : « J.P. Morgan » devient « jp-morgan ». */
  var PARTENAIRES = [
    'DWS', 'ETHENEA', 'Flossbach von Storch', 'Gerifonds', 'LLB Swiss',
    'Pictet', 'Schroders', 'Swiss Life', 'Swisscanto', 'UBS', 'J.P. Morgan',
    'LGT', 'T. Rowe Price', 'Hauck Aufhäuser', 'Fidelity', 'J. Safra Sarasin',
    'Maveris', 'HBM Asset Management', 'Valitas', 'BCV', 'IST', 'BLKB',
    'Valiant', 'OLZ', 'SSGA', 'BlackRock', 'zCapital', 'Zweiplus',
    'Zwei Wealth',
  ];

  var EXTENSIONS = ['svg', 'png'];

  function slug(nom) {
    return nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')  // é → e, ä → a
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /* Essaie les extensions l'une après l'autre. On passe par un objet Image
     plutôt que par un <img> posé dans la page : une image manquante
     afficherait sinon l'icône de fichier cassé le temps de l'échec. */
  function chercherLogo(nom, surSucces) {
    var i = 0;
    function essayer() {
      if (i >= EXTENSIONS.length) {
        return;
      }
      var url = 'assets/partners/' + slug(nom) + '.' + EXTENSIONS[i];
      i++;
      var img = new Image();
      img.onload = function () { surSucces(url); };
      img.onerror = essayer;
      img.src = url;
    }
    essayer();
  }

  function creerItem(nom) {
    var item = document.createElement('li');
    item.className = 'partner';

    var texte = document.createElement('span');
    texte.className = 'partner-nom';
    texte.textContent = nom;
    item.appendChild(texte);

    chercherLogo(nom, function (url) {
      var img = document.createElement('img');
      img.className = 'partner-logo';
      img.src = url;
      img.alt = nom;
      img.loading = 'lazy';
      img.decoding = 'async';
      item.replaceChild(img, texte);
    });

    return item;
  }

  function init() {
    var piste = document.querySelector('.partners-track');
    if (!piste) {
      return;
    }

    var liste = document.createElement('ul');
    liste.className = 'partners-liste';
    PARTENAIRES.forEach(function (nom) {
      liste.appendChild(creerItem(nom));
    });

    /* La copie est décorative : un lecteur d'écran qui la lirait
       énoncerait vingt-neuf partenaires deux fois de suite. */
    var copie = liste.cloneNode(true);
    copie.setAttribute('aria-hidden', 'true');
    // cloneNode ne copie pas les images encore en cours de chargement :
    // on relance la recherche sur la copie, avec les mêmes fichiers (le
    // cache du navigateur fait que c'est gratuit).
    Array.prototype.forEach.call(copie.querySelectorAll('.partner-nom'), function (texte) {
      var item = texte.parentNode;
      chercherLogo(texte.textContent, function (url) {
        var img = document.createElement('img');
        img.className = 'partner-logo';
        img.src = url;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        item.replaceChild(img, texte);
      });
    });

    piste.appendChild(liste);
    piste.appendChild(copie);
    /* Sur la SECTION, pas sur le parent direct de la piste : celui-ci est
       le cadre qui estompe les bords, la règle d'affichage porte un cran
       au-dessus. */
    var section = piste.closest('.partners');
    if (section) {
      section.classList.add('partners--anime');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
