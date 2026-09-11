/* Rend assets/logo/favicon.svg en assets/logo/apple-touch-icon.png (180x180).
 *
 * iOS n'accepte pas le SVG pour l'icône d'écran d'accueil : sans ce PNG,
 * Safari fabrique une vignette de la page, illisible. 180px est la taille
 * demandée par les iPhone récents, les autres la réduisent.
 *
 *   node tools/build-icon.js
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'logo', 'apple-touch-icon.png');
const PORT = 8792;
const SIZE = 180;

(async () => {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(PORT, r));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
  // Pas de transparence : iOS pose l'icône sur le fond de l'écran d'accueil
  // et un PNG translucide y laisserait apparaître le papier peint.
  await page.setContent(
    `<style>html,body{margin:0;background:#9C4A2E}img{display:block;width:${SIZE}px;height:${SIZE}px}</style>` +
    `<img src="http://localhost:${PORT}/assets/logo/favicon.svg">`
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT });
  await browser.close();
  server.close();

  console.log(`assets/logo/apple-touch-icon.png — ${SIZE}x${SIZE}, ${(fs.statSync(OUT).size / 1024).toFixed(1)} Ko`);
})();
