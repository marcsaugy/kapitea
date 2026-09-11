#!/usr/bin/env python3
"""Fabrique assets/logo/favicon.svg : un K blanc sur carré terracotta.

Pourquoi une lettre et pas le mark découpé : dans le mark, les deux
diagonales partent du milieu du fût et se terminent sur l'arc. C'est l'arc
qui ferme la forme et fait lire « K ». Retiré, il reste un bâton vertical
et un chevron — quatre recadrages ont été essayés, aucun ne donne un K.

Le K vient donc de la fonte de la marque, Schibsted Grotesk instanciée au
poids 600, celui du mot « Kapitea » dans le lockup. Le contour est extrait
du fichier woff2 : c'est la lettre exacte, pas un dessin approchant.

    pip install fonttools brotli
    python3 tools/build-favicon.py
    node tools/build-icon.js        # puis le PNG pour iOS
"""
import pathlib

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT = ROOT / "assets/fonts/schibsted-grotesk-latin.woff2"
OUT = ROOT / "assets/logo/favicon.svg"

WEIGHT = 600      # le poids du mot-symbole
CAP_PART = 0.60   # part du carré occupée par la hauteur de capitale
RADIUS = 18       # sur une grille de 100
BRIQUE = "#9C4A2E"

font = instantiateVariableFont(TTFont(FONT), {"wght": WEIGHT}, inplace=False)
glyphs = font.getGlyphSet()
name = font.getBestCmap()[ord("K")]

pen = SVGPathPen(glyphs)
glyphs[name].draw(pen)
path = pen.getCommands()

bounds = BoundsPen(glyphs)
glyphs[name].draw(bounds)
x0, y0, x1, y1 = bounds.bounds

# Le glyphe a l'axe des y vers le haut, le SVG vers le bas : d'où le -scale.
# Le centrage se fait sur la boîte de la capitale, pas sur l'avance : une
# lettre centrée sur son avance paraît décalée à gauche.
scale = 100 * CAP_PART / (y1 - y0)
tx = 50 - (x0 + x1) / 2 * scale
ty = 50 + (y0 + y1) / 2 * scale

OUT.write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"\n'
    '     role="img" aria-label="Kapitea">\n'
    "  <title>Kapitea</title>\n"
    "  <!-- Généré par tools/build-favicon.py : K de Schibsted Grotesk au poids\n"
    "       600, extrait de assets/fonts/. Ne pas modifier à la main. -->\n"
    f'  <rect width="100" height="100" rx="{RADIUS}" fill="{BRIQUE}"/>\n'
    f'  <g transform="translate({tx:.3f} {ty:.3f}) scale({scale:.6f} {-scale:.6f})" fill="#FFFFFF">\n'
    f'    <path d="{path}"/>\n'
    "  </g>\n"
    "</svg>\n"
)
print(f"assets/logo/favicon.svg — K {(x1 - x0) * scale:.1f} x {(y1 - y0) * scale:.1f} sur 100, {OUT.stat().st_size} octets")
