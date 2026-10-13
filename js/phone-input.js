/* Le champ téléphone : indicatif devant, numéro mis en forme à la saisie.
 *
 * Repris du composant d'Hypoteka (js/phone-input.js), avec quatre écarts :
 *
 *  - Pas de drapeau en emoji (design.md, §10) : l'indicatif s'affiche
 *    « CH +41 », le code pays en texte.
 *  - Le 0 initial reste affiché pendant la saisie. Un Suisse écrit
 *    « 079 123 45 67 » ; un 0 qui disparaît sous le doigt fait croire à
 *    une touche ratée. Il n'est retiré qu'à l'enregistrement.
 *  - Un « 41 » en tête n'est pris pour l'indicatif que s'il est suivi de
 *    plus de 8 chiffres : « 41 123 45 67 » est un fixe lucernois tapé sans
 *    son 0, et le retirer enregistrait un numéro faux sans le dire.
 *  - Un numéro collé ou rempli par le navigateur avec son indicatif
 *    (« +33 6 12… », « 0033 6 12… ») bascule sur le bon pays au lieu
 *    d'être tronqué en numéro suisse.
 *
 * La valeur enregistrée a la forme d'Hypoteka, « +41 79 123 45 67 » : les
 * deux marques partagent le CRM, un numéro s'y lit de la même façon.
 */
'use strict';

var PhoneInput = (function () {
  var PINNED = [
    { dial: '41', name: 'Suisse', code: 'CH' },
    { dial: '33', name: 'France', code: 'FR' },
    { dial: '39', name: 'Italie', code: 'IT' },
    { dial: '49', name: 'Allemagne', code: 'DE' },
    { dial: '43', name: 'Autriche', code: 'AT' },
    { dial: '34', name: 'Espagne', code: 'ES' },
    { dial: '351', name: 'Portugal', code: 'PT' },
    { dial: '971', name: 'Émirats arabes unis (Dubaï)', code: 'AE' },
    { dial: '1', name: 'États-Unis / Canada', code: 'US' },
  ];

  // Reste des pays, triés alphabétiquement (nom français) — filtrés par
  // la recherche. Liste large mais non exhaustive (territoires rares
  // omis) : suffisant pour couvrir l'immense majorité des cas réels.
  var REST = [
    { dial: '355', name: 'Albanie', code: 'AL' },
    { dial: '213', name: 'Algérie', code: 'DZ' },
    { dial: '244', name: 'Angola', code: 'AO' },
    { dial: '54', name: 'Argentine', code: 'AR' },
    { dial: '374', name: 'Arménie', code: 'AM' },
    { dial: '61', name: 'Australie', code: 'AU' },
    { dial: '994', name: 'Azerbaïdjan', code: 'AZ' },
    { dial: '973', name: 'Bahreïn', code: 'BH' },
    { dial: '880', name: 'Bangladesh', code: 'BD' },
    { dial: '32', name: 'Belgique', code: 'BE' },
    { dial: '229', name: 'Bénin', code: 'BJ' },
    { dial: '591', name: 'Bolivie', code: 'BO' },
    { dial: '387', name: 'Bosnie-Herzégovine', code: 'BA' },
    { dial: '55', name: 'Brésil', code: 'BR' },
    { dial: '359', name: 'Bulgarie', code: 'BG' },
    { dial: '226', name: 'Burkina Faso', code: 'BF' },
    { dial: '257', name: 'Burundi', code: 'BI' },
    { dial: '855', name: 'Cambodge', code: 'KH' },
    { dial: '237', name: 'Cameroun', code: 'CM' },
    { dial: '86', name: 'Chine', code: 'CN' },
    { dial: '357', name: 'Chypre', code: 'CY' },
    { dial: '57', name: 'Colombie', code: 'CO' },
    { dial: '242', name: 'Congo-Brazzaville', code: 'CG' },
    { dial: '243', name: 'Congo (RDC)', code: 'CD' },
    { dial: '82', name: 'Corée du Sud', code: 'KR' },
    { dial: '225', name: "Côte d'Ivoire", code: 'CI' },
    { dial: '385', name: 'Croatie', code: 'HR' },
    { dial: '45', name: 'Danemark', code: 'DK' },
    { dial: '20', name: 'Égypte', code: 'EG' },
    { dial: '971', name: 'Émirats arabes unis', code: 'AE' },
    { dial: '593', name: 'Équateur', code: 'EC' },
    { dial: '34', name: 'Espagne', code: 'ES' },
    { dial: '372', name: 'Estonie', code: 'EE' },
    { dial: '251', name: 'Éthiopie', code: 'ET' },
    { dial: '358', name: 'Finlande', code: 'FI' },
    { dial: '241', name: 'Gabon', code: 'GA' },
    { dial: '233', name: 'Ghana', code: 'GH' },
    { dial: '30', name: 'Grèce', code: 'GR' },
    { dial: '224', name: 'Guinée', code: 'GN' },
    { dial: '852', name: 'Hong Kong', code: 'HK' },
    { dial: '36', name: 'Hongrie', code: 'HU' },
    { dial: '91', name: 'Inde', code: 'IN' },
    { dial: '62', name: 'Indonésie', code: 'ID' },
    { dial: '964', name: 'Irak', code: 'IQ' },
    { dial: '98', name: 'Iran', code: 'IR' },
    { dial: '353', name: 'Irlande', code: 'IE' },
    { dial: '354', name: 'Islande', code: 'IS' },
    { dial: '972', name: 'Israël', code: 'IL' },
    { dial: '81', name: 'Japon', code: 'JP' },
    { dial: '962', name: 'Jordanie', code: 'JO' },
    { dial: '254', name: 'Kenya', code: 'KE' },
    { dial: '965', name: 'Koweït', code: 'KW' },
    { dial: '856', name: 'Laos', code: 'LA' },
    { dial: '371', name: 'Lettonie', code: 'LV' },
    { dial: '961', name: 'Liban', code: 'LB' },
    { dial: '218', name: 'Libye', code: 'LY' },
    { dial: '423', name: 'Liechtenstein', code: 'LI' },
    { dial: '370', name: 'Lituanie', code: 'LT' },
    { dial: '352', name: 'Luxembourg', code: 'LU' },
    { dial: '389', name: 'Macédoine du Nord', code: 'MK' },
    { dial: '212', name: 'Maroc', code: 'MA' },
    { dial: '230', name: 'Maurice', code: 'MU' },
    { dial: '223', name: 'Mali', code: 'ML' },
    { dial: '52', name: 'Mexique', code: 'MX' },
    { dial: '373', name: 'Moldavie', code: 'MD' },
    { dial: '377', name: 'Monaco', code: 'MC' },
    { dial: '382', name: 'Monténégro', code: 'ME' },
    { dial: '258', name: 'Mozambique', code: 'MZ' },
    { dial: '264', name: 'Namibie', code: 'NA' },
    { dial: '977', name: 'Népal', code: 'NP' },
    { dial: '227', name: 'Niger', code: 'NE' },
    { dial: '234', name: 'Nigéria', code: 'NG' },
    { dial: '47', name: 'Norvège', code: 'NO' },
    { dial: '64', name: 'Nouvelle-Zélande', code: 'NZ' },
    { dial: '968', name: 'Oman', code: 'OM' },
    { dial: '92', name: 'Pakistan', code: 'PK' },
    { dial: '507', name: 'Panama', code: 'PA' },
    { dial: '31', name: 'Pays-Bas', code: 'NL' },
    { dial: '51', name: 'Pérou', code: 'PE' },
    { dial: '63', name: 'Philippines', code: 'PH' },
    { dial: '48', name: 'Pologne', code: 'PL' },
    { dial: '974', name: 'Qatar', code: 'QA' },
    { dial: '40', name: 'Roumanie', code: 'RO' },
    { dial: '44', name: 'Royaume-Uni', code: 'GB' },
    { dial: '7', name: 'Russie', code: 'RU' },
    { dial: '221', name: 'Sénégal', code: 'SN' },
    { dial: '381', name: 'Serbie', code: 'RS' },
    { dial: '65', name: 'Singapour', code: 'SG' },
    { dial: '421', name: 'Slovaquie', code: 'SK' },
    { dial: '386', name: 'Slovénie', code: 'SI' },
    { dial: '46', name: 'Suède', code: 'SE' },
    { dial: '216', name: 'Tunisie', code: 'TN' },
    { dial: '90', name: 'Turquie', code: 'TR' },
    { dial: '380', name: 'Ukraine', code: 'UA' },
    { dial: '598', name: 'Uruguay', code: 'UY' },
    { dial: '84', name: 'Vietnam', code: 'VN' },
  ];

  var ALL = PINNED.concat(REST);
  // Du plus long au plus court : « +351 » doit être reconnu avant « +35 ».
  var DIALS = ALL.map(function (c) { return c.dial; })
    .filter(function (d, i, a) { return a.indexOf(d) === i; })
    .sort(function (a, b) { return b.length - a.length; });

  function country(dial) {
    for (var i = 0; i < ALL.length; i++) if (ALL[i].dial === dial) return ALL[i];
    return PINNED[0];
  }

  function digitsOnly(raw) { return String(raw || '').replace(/\D/g, ''); }

  // Indicatif écrit devant le numéro, avec « + » ou « 00 ». Rend le dial
  // reconnu et les chiffres qui le suivent, ou null s'il n'y en a pas.
  function typedDial(raw) {
    var s = String(raw || '').trim();
    var digits;
    if (s.charAt(0) === '+') digits = digitsOnly(s);
    else if (s.slice(0, 2) === '00' && digitsOnly(s).length > 2) digits = digitsOnly(s).slice(2);
    else return null;
    for (var i = 0; i < DIALS.length; i++) {
      if (digits.slice(0, DIALS[i].length) === DIALS[i]) {
        return { dial: DIALS[i], rest: digits.slice(DIALS[i].length) };
      }
    }
    return null;
  }

  // Chiffres affichés : indicatif tapé par réflexe retiré, 0 initial gardé.
  function displayDigits(raw, dial) {
    var digits = digitsOnly(raw);
    if (digits.slice(0, dial.length + 2) === '00' + dial) digits = digits.slice(dial.length + 2);
    if (dial === '41') {
      // Un numéro suisse a 9 chiffres après le 0 : au-delà, le 41 de tête
      // est l'indicatif.
      if (digits.slice(0, 2) === '41' && digits.length >= 10) digits = digits.slice(2);
      digits = digits.replace(/^0+/, '0');
      return digits.slice(0, digits.charAt(0) === '0' ? 10 : 9);
    }
    if (digits.slice(0, dial.length) === dial && digits.length > dial.length + 5) digits = digits.slice(dial.length);
    digits = digits.replace(/^0+/, '0');
    return digits.slice(0, digits.charAt(0) === '0' ? 13 : 12);
  }

  // Le numéro sans son 0 de tête, tel qu'il se compose depuis l'étranger.
  // L'Italie garde le sien : il fait partie des numéros fixes.
  function national(digits, dial) {
    return dial !== '39' && digits.charAt(0) === '0' ? digits.slice(1) : digits;
  }

  // À l'écran, les paires partent du début : les chiffres déjà tapés ne
  // bougent pas. À l'enregistrement, elles partent de la fin, comme on
  // écrit un numéro étranger (« +33 6 12 34 56 78 »).
  function formatLocal(digits, dial, fromEnd) {
    if (dial === '41') {
      var cuts = digits.charAt(0) === '0' ? [3, 6, 8, 10] : [2, 5, 7, 9];
      var parts = [];
      var from = 0;
      cuts.forEach(function (to) {
        if (digits.length > from) parts.push(digits.slice(from, to));
        from = to;
      });
      return parts.join(' ');
    }
    return fromEnd
      ? digits.replace(/\B(?=(\d{2})+$)/g, ' ')
      : digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }

  function getDial(inputEl) { return (inputEl && inputEl.dataset.dial) || '41'; }

  function isValid(inputEl) {
    var dial = getDial(inputEl);
    var n = national(displayDigits(inputEl ? inputEl.value : '', dial), dial);
    return dial === '41'
      ? n.length === 9 && n.charAt(0) !== '0'
      : n.length >= 6 && n.length <= 12;
  }

  // Valeur à enregistrer : « +41 79 123 45 67 ».
  function fullValue(inputEl) {
    var dial = getDial(inputEl);
    var n = national(displayDigits(inputEl ? inputEl.value : '', dial), dial);
    return n ? '+' + dial + ' ' + formatLocal(n, dial, true) : '';
  }

  function isSwiss(inputEl) { return getDial(inputEl) === '41'; }

  function optionHtml(c) {
    return '<button type="button" class="phone-country-option" data-dial="' + c.dial + '">'
      + '<span class="phone-country-code">' + c.code + '</span>'
      + '<span class="phone-country-name">' + c.name + '</span>'
      + '<span class="phone-country-dial">+' + c.dial + '</span></button>';
  }

  function buildList(container, query, onPick) {
    var q = (query || '').trim().toLowerCase().replace(/^\+/, '');
    var matches = function (c) {
      return c.name.toLowerCase().indexOf(q) !== -1 || c.dial.indexOf(q) === 0 || c.code.toLowerCase() === q;
    };
    var html = '';
    if (!q) {
      html += '<div class="phone-country-group-label">Suisse et pays fréquents</div>';
      html += PINNED.map(optionHtml).join('');
      html += '<div class="phone-country-group-label">Tous les pays</div>';
      html += REST.map(optionHtml).join('');
    } else {
      var seen = {};
      var found = ALL.filter(function (c) {
        var key = c.dial + c.code;
        if (seen[key] || !matches(c)) return false;
        seen[key] = true;
        return true;
      });
      html = found.length
        ? found.map(optionHtml).join('')
        : '<div class="phone-country-empty">Aucun pays trouvé.</div>';
    }
    container.innerHTML = html;
    Array.prototype.forEach.call(container.querySelectorAll('.phone-country-option'), function (btn) {
      btn.addEventListener('click', function () { onPick(btn.getAttribute('data-dial')); });
    });
  }

  function mount(inputEl) {
    if (!inputEl || inputEl.dataset.phoneMounted) return;
    inputEl.dataset.phoneMounted = '1';
    inputEl.dataset.dial = '41';

    var wrap = document.createElement('div');
    wrap.className = 'phone-input-wrap';
    inputEl.parentNode.insertBefore(wrap, inputEl);

    var prefixBtn = document.createElement('button');
    prefixBtn.type = 'button';
    prefixBtn.className = 'phone-input-prefix';
    prefixBtn.setAttribute('aria-expanded', 'false');
    prefixBtn.innerHTML = '<span class="phone-prefix-code"></span><span class="phone-prefix-dial"></span>'
      + '<svg class="phone-prefix-caret" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>';

    var dropdown = document.createElement('div');
    dropdown.className = 'phone-country-dropdown';
    dropdown.hidden = true;
    var search = document.createElement('input');
    search.type = 'text';
    search.className = 'phone-country-search';
    search.placeholder = 'Rechercher un pays';
    search.setAttribute('aria-label', 'Rechercher un pays ou un indicatif');
    search.autocomplete = 'off';
    var list = document.createElement('div');
    list.className = 'phone-country-list';
    dropdown.appendChild(search);
    dropdown.appendChild(list);

    wrap.appendChild(prefixBtn);
    wrap.appendChild(inputEl);
    wrap.appendChild(dropdown);
    inputEl.classList.add('phone-input-field');

    function showCountry(c) {
      inputEl.dataset.dial = c.dial;
      prefixBtn.querySelector('.phone-prefix-code').textContent = c.code;
      prefixBtn.querySelector('.phone-prefix-dial').textContent = '+' + c.dial;
      prefixBtn.setAttribute('aria-label', 'Indicatif : ' + c.name + ' +' + c.dial + '. Changer de pays');
    }

    function reformat(raw) {
      var typed = typedDial(raw);
      if (typed) {
        showCountry(country(typed.dial));
        raw = typed.rest;
      } else if (/^\s*(\+|00)/.test(raw) && digitsOnly(raw).length < 4) {
        // « +3 », « 00 » : l'indicatif est en train de s'écrire, on attend
        // qu'il soit complet pour le reconnaître.
        return;
      }
      var dial = getDial(inputEl);
      inputEl.value = formatLocal(displayDigits(raw, dial), dial);
    }

    function close() {
      dropdown.hidden = true;
      prefixBtn.setAttribute('aria-expanded', 'false');
    }

    function pick(dial) {
      showCountry(country(dial));
      inputEl.value = formatLocal(displayDigits(inputEl.value, dial), dial);
      close();
      inputEl.focus();
    }

    function open() {
      search.value = '';
      buildList(list, '', pick);
      dropdown.hidden = false;
      prefixBtn.setAttribute('aria-expanded', 'true');
      search.focus();
    }

    prefixBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (dropdown.hidden) open(); else close();
    });
    search.addEventListener('input', function () { buildList(list, search.value, pick); });
    // Entrée valide l'écran partout dans le questionnaire : dans la
    // recherche, elle doit choisir le premier pays, pas envoyer le lead.
    search.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        var first = list.querySelector('.phone-country-option');
        if (first) pick(first.getAttribute('data-dial'));
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        close();
        prefixBtn.focus();
      } else if (e.key === 'ArrowDown') {
        var firstOpt = list.querySelector('.phone-country-option');
        if (firstOpt) { e.preventDefault(); firstOpt.focus(); }
      }
    });
    list.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        var opts = Array.prototype.slice.call(list.querySelectorAll('.phone-country-option'));
        var i = opts.indexOf(document.activeElement);
        var next = e.key === 'ArrowDown' ? opts[i + 1] : (i > 0 ? opts[i - 1] : search);
        if (next) { e.preventDefault(); next.focus(); }
      } else if (e.key === 'Escape') {
        close();
        prefixBtn.focus();
      }
    });
    dropdown.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });

    inputEl.addEventListener('input', function () { reformat(inputEl.value); });
    // Hors de Suisse, les paires partent du début pendant la frappe ; une
    // fois le champ quitté, on les regroupe comme le numéro s'écrit.
    inputEl.addEventListener('blur', function () {
      var dial = getDial(inputEl);
      if (dial !== '41') inputEl.value = formatLocal(displayDigits(inputEl.value, dial), dial, true);
    });

    showCountry(PINNED[0]);
    if (inputEl.value) setValue(inputEl, inputEl.value);
  }

  // Remet un numéro enregistré dans le champ, indicatif compris.
  function setValue(inputEl, stored) {
    if (!inputEl) return;
    inputEl.value = stored || '';
    inputEl.dispatchEvent(new Event('input'));
    inputEl.dispatchEvent(new Event('blur'));
  }

  return { mount: mount, isValid: isValid, fullValue: fullValue, isSwiss: isSwiss, setValue: setValue };
})();
