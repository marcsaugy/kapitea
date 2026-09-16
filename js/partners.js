/* La bande des partenaires.
 *
 * Deux copies de la même liste défilent côte à côte, et l'animation
 * translate l'ensemble d'exactement une copie : au moment où elle boucle,
 * la seconde occupe la place qu'occupait la première. Rien ne saute, il
 * n'y a pas de fin de liste à gérer.
 *
 * Chaque partenaire s'affiche en toutes lettres, et ce fichier tente en
 * parallèle de charger son logo dans assets/partners/. Dès qu'un fichier
 * répond, il remplace le libellé ; sinon le libellé reste, et la bande
 * reste présentable. Amélioration progressive : sans JS, la liste est une
 * liste lisible.
 */
(function () {
  'use strict';

  /* L'ordre est celui fourni.
   *
   * `fichier` est le nom du fichier tel qu'il a été livré — espaces,
   * majuscules, accents absents, suffixe d'export : on ne renomme pas
   * vingt-six fichiers qui viennent des chartes graphiques des maisons,
   * c'est le code qui s'adapte. Une seule requête par logo, aucun essai
   * à l'aveugle.
   *
   * Sans `fichier`, on retombe sur la convention par défaut :
   * <slug>.svg, puis .png, .webp, .jpg, .jpeg. C'est le cas des trois
   * logos encore manquants — il suffira de déposer le fichier, ou
   * d'ajouter ici son nom exact s'il ne suit pas la convention.
   *
   * `clair` : le fichier est la version blanche du logo, prévue pour un
   * fond sombre. Sur le crème de la page, elle est invisible ; on
   * l'inverse. Mesuré sur canvas, luminance moyenne de l'encre :
   * Gerifonds 1.00, Zwei Wealth 1.00, LLB Swiss 0.96 — contre 0.10 à 0.56
   * pour tous les autres. À retirer le jour où la version foncée arrive.
   *
   * `zoom` : le tracé ne remplit que 60 % de la hauteur de sa toile, le
   * logo paraît deux fois plus petit que ses voisins à cadre égal. On
   * rattrape les marges du fichier plutôt que de le recadrer.
   */
  var PARTENAIRES = [
    { nom: 'DWS', fichier: 'DWS.svg' },
    { nom: 'ETHENEA' },
    { nom: 'Flossbach von Storch', fichier: 'Flossbach von Storch.svg' },
    { nom: 'Gerifonds', fichier: 'Gerifonds.svg', clair: true },
    { nom: 'LLB Swiss', fichier: 'LLB Swiss.svg', clair: true },
    { nom: 'Pictet', fichier: 'Pictet.svg' },
    { nom: 'Schroders', fichier: 'Schroders.svg' },
    { nom: 'Swiss Life', fichier: 'Swiss Life.jpg', zoom: 1.45 },
    { nom: 'Swisscanto', fichier: 'Swisscanto.svg', zoom: 1.2 },
    { nom: 'UBS', fichier: 'UBS.png' },
    { nom: 'J.P. Morgan', fichier: 'J.P. Morgan.svg' },
    { nom: 'LGT', fichier: 'LGT.svg' },
    { nom: 'T. Rowe Price', fichier: 'T.Rowe Price.png' },
    { nom: 'Hauck Aufhäuser', fichier: 'Hauck Aufhauser.svg' },
    { nom: 'Fidelity', fichier: 'Fidelity.svg' },
    { nom: 'J. Safra Sarasin', fichier: 'J. Safra Sarasin.svg' },
    { nom: 'Maveris' },
    /* Le fichier livré tranche l'hésitation sur le nom : c'est bien
       HBM Partners, et non HBM Asset Management. */
    { nom: 'HBM Partners', fichier: 'HBM Partners.svg' },
    { nom: 'Valitas', fichier: 'Valitas.png' },
    { nom: 'BCV', fichier: 'BCV.svg' },
    { nom: 'IST' },
    { nom: 'BLKB', fichier: 'BLKB.svg' },
    { nom: 'Valiant', fichier: 'Valiant_RGB.png' },
    { nom: 'OLZ', fichier: 'OLZ.png' },
    { nom: 'SSGA', fichier: 'SSGA.svg' },
    { nom: 'BlackRock', fichier: 'BlackRock.svg' },
    { nom: 'zCapital', fichier: 'zCapital.png' },
    { nom: 'Zweiplus', fichier: 'Zweiplus.svg' },
    { nom: 'Zwei Wealth', fichier: 'Zwei Wealth.png', clair: true },
  ];

  /* Essayées dans cet ordre, du meilleur au plus contraint :
     SVG (net à toute taille), puis les formats à transparence, et le JPEG
     en dernier — il vient forcément avec un fond opaque. Le CSS neutralise
     ce fond quand il est clair (voir mix-blend-mode dans index.html). */
  var EXTENSIONS = ['svg', 'png', 'webp', 'jpg', 'jpeg'];

  function slug(nom) {
    return nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')  // é → e, ä → a
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /* Les noms de fichiers contiennent des espaces (« Swiss Life.jpg ») :
     c'est légal dans une URL à condition de les encoder. encodeURIComponent
     laisse points et tirets intacts et ne touche qu'à ce qui doit l'être. */
  function url(fichier) {
    return 'assets/partners/' + encodeURIComponent(fichier);
  }

  function candidats(partenaire) {
    if (partenaire.fichier) {
      return [url(partenaire.fichier)];
    }
    return EXTENSIONS.map(function (ext) {
      return url(slug(partenaire.nom) + '.' + ext);
    });
  }

  /* La recherche n'est faite qu'une fois par partenaire, quel que soit le
     nombre de copies de la liste : la seconde s'abonne au résultat de la
     première. Sans ça, les logos absents rejoueraient leurs essais
     infructueux à chaque copie. */
  var memo = {};

  /* Essaie les candidats l'un après l'autre. On passe par un objet Image
     plutôt que par un <img> posé dans la page : une image manquante
     afficherait sinon l'icône de fichier cassé le temps de l'échec. */
  function chercherLogo(partenaire, surSucces) {
    var entree = memo[partenaire.nom];
    if (entree) {
      if (entree.url) {
        surSucces(entree.url);
      } else if (entree.attente) {
        entree.attente.push(surSucces);
      }
      // url nulle et plus personne en attente : le fichier n'existe pas.
      return;
    }

    entree = memo[partenaire.nom] = { url: null, attente: [surSucces] };
    var pistes = candidats(partenaire);
    var i = 0;
    function essayer() {
      if (i >= pistes.length) {
        entree.attente = null;
        return;
      }
      var piste = pistes[i];
      i++;
      var img = new Image();
      img.onload = function () {
        entree.url = piste;
        var attente = entree.attente;
        entree.attente = null;
        attente.forEach(function (rappel) { rappel(piste); });
      };
      img.onerror = essayer;
      img.src = piste;
    }
    essayer();
  }

  /* `decoratif` : la seconde copie ne sert que la boucle. Un lecteur
     d'écran qui la lirait énoncerait les partenaires deux fois de suite. */
  function creerItem(partenaire, decoratif) {
    var item = document.createElement('li');
    item.className = 'partner';

    var texte = document.createElement('span');
    texte.className = 'partner-nom';
    texte.textContent = partenaire.nom;
    item.appendChild(texte);

    chercherLogo(partenaire, function (src) {
      var img = document.createElement('img');
      img.className = 'partner-logo' + (partenaire.clair ? ' partner-logo--clair' : '');
      img.src = src;
      img.alt = decoratif ? '' : partenaire.nom;
      img.loading = 'lazy';
      img.decoding = 'async';
      if (partenaire.zoom) {
        img.style.setProperty('--zoom', partenaire.zoom);
      }
      item.replaceChild(img, texte);
    });

    return item;
  }

  function creerListe(decoratif) {
    var liste = document.createElement('ul');
    liste.className = 'partners-liste';
    if (decoratif) {
      liste.setAttribute('aria-hidden', 'true');
    }
    PARTENAIRES.forEach(function (partenaire) {
      liste.appendChild(creerItem(partenaire, decoratif));
    });
    return liste;
  }

  function init() {
    var piste = document.querySelector('.partners-track');
    if (!piste) {
      return;
    }

    /* Les deux copies sont construites, pas clonées : cloneNode ne
       reprendrait pas les images encore en cours de chargement, et la
       seconde resterait en texte. Le cache du navigateur fait que les
       mêmes fichiers ne sont demandés qu'une fois. */
    piste.appendChild(creerListe(false));
    piste.appendChild(creerListe(true));

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
