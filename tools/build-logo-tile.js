/* Tuile de marque : le sigle complet (K + arc) en blanc sur le terracotta.
 *
 * Sert aux usages où le logo doit tenir dans un carré plein — photo de
 * profil, vignette d'annuaire, avatar LinkedIn ou WhatsApp Business. Le
 * JPEG est demandé par ces plateformes ; il n'a pas de transparence, ce
 * qui tombe bien puisque le fond est plein par construction.
 *
 *   node tools/build-logo-tile.js [taille]
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const RACINE = path.join(__dirname, '..');
const TERRACOTTA = '#9C4A2E';       // --brique, la teinte du sigle d'origine
const MARGE = 0.16;                  // part du côté laissée libre de chaque côté
const TAILLE = parseInt(process.argv[2], 10) || 2048;

const source = fs.readFileSync(path.join(RACINE, 'assets/logo/kapitea-mark.svg'), 'utf8');
const trace = source.match(/<path d="([^"]+)"/)[1];
const [, , vbW, vbH] = source.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/).slice(1).map(Number);

/* Le sigle est en format paysage (727x517). Sur un carré, c'est donc sa
   LARGEUR qui commande : le caler sur la hauteur le ferait déborder. */
const dispo = TAILLE * (1 - 2 * MARGE);
const echelle = dispo / vbW;
const largeur = vbW * echelle;
const hauteur = vbH * echelle;
const x = (TAILLE - largeur) / 2;
const y = (TAILLE - hauteur) / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TAILLE}" height="${TAILLE}" viewBox="0 0 ${TAILLE} ${TAILLE}">
  <rect width="${TAILLE}" height="${TAILLE}" fill="${TERRACOTTA}"/>
  <g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${echelle.toFixed(6)})">
    <path d="${trace}" fill="#FFFFFF" fill-rule="evenodd"/>
  </g>
</svg>`;

(async () => {
  const sortie = path.join(RACINE, 'assets/logo/kapitea-tuile.jpg');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: TAILLE, height: TAILLE }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0">${svg}</body>`);
  // quality 95 : au-dessus, le JPEG grossit sans gain visible sur un aplat.
  await p.screenshot({ path: sortie, type: 'jpeg', quality: 95 });
  await b.close();
  console.log(`${sortie}  ${TAILLE}x${TAILLE}  sigle ${Math.round(largeur)}x${Math.round(hauteur)}`);
})();
