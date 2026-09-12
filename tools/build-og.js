/* Rend tools/og-image.html en assets/og-image.jpg.
 *
 * JPEG et non PNG : WhatsApp bascule sur son aperçu compact — une petite
 * vignette carrée au lieu de la bannière — au-delà d'environ 300 Ko. Le
 * PNG de cette carte pesait 288 Ko, assez pour déclencher ce repli.
 * L'image n'a ni transparence ni aplats nets à préserver, le JPEG la rend
 * à l'identique pour un dixième du poids.
 *
 * L'image de partage était un PNG produit à la main, donc figé : elle a
 * gardé les gris bleutés et l'ancien mark bien après que les deux aient
 * changé dans le site. Le gabarit charge maintenant css/base.css, et ce
 * script le photographie. À relancer après toute modification de la
 * palette, du mark ou des métadonnées Open Graph.
 *
 *   node tools/build-og.js
 *
 * Nécessite Playwright et un Chromium. Le serveur statique est lancé ici :
 * le gabarit charge des feuilles de style et des polices en relatif, que
 * file:// servirait de façon inégale selon la plateforme.
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'og-image.jpg');
const PORT = 8791;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};

function serve() {
  const server = http.createServer((req, res) => {
    // Le gabarit n'appelle que des chemins relatifs connus ; on refuse
    // quand même tout ce qui remonte au-dessus de la racine du dépôt.
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

(async () => {
  const server = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

  await page.goto(`http://localhost:${PORT}/tools/og-image.html`);
  // La fonte est en font-display:swap : sans cette attente, le rendu peut
  // partir sur le repli métrique.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);

  await page.locator('.card').screenshot({ path: OUT, type: 'jpeg', quality: 90 });

  await browser.close();
  server.close();

  const { size } = fs.statSync(OUT);
  console.log(`assets/og-image.jpg — ${(size / 1024).toFixed(0)} Ko`);
  if (size > 300 * 1024) {
    console.error('ATTENTION : au-delà de ~300 Ko, WhatsApp repasse en aperçu compact.');
    process.exit(1);
  }
})();
