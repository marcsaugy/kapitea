# Logos des partenaires

Les fichiers se déposent ici **sous le nom qu'ils ont** : `js/partners.js`
tient la liste exacte (champ `fichier`), espaces, majuscules et suffixes
d'export compris. Rien à renommer.

Pour un partenaire sans `fichier` déclaré, le script retombe sur la
convention par défaut — le nom en minuscules, sans accents, chaque suite de
caractères non alphanumériques remplacée par un tiret — et essaie dans
l'ordre `<slug>.svg`, `.png`, `.webp`, `.jpg`, `.jpeg`. Déposer
`ethenea.svg` suffit donc ; pour un nom de fichier qui ne suit pas cette
forme, ajouter son `fichier` dans `js/partners.js`.

| Partenaire | Fichier en place |
|---|---|
| DWS | `DWS.svg` |
| ETHENEA | — **manquant** |
| Flossbach von Storch | `Flossbach von Storch.svg` |
| Gerifonds | `Gerifonds.svg` |
| LLB Swiss | `LLB Swiss.svg` |
| Pictet | `Pictet.svg` |
| Schroders | `Schroders.svg` |
| Swiss Life | `Swiss Life.jpg` |
| Swisscanto | `Swisscanto.svg` |
| UBS | `UBS.png` |
| J.P. Morgan | `J.P. Morgan.svg` |
| LGT | `LGT.svg` |
| T. Rowe Price | `T.Rowe Price.png` |
| Hauck Aufhäuser | `Hauck Aufhauser.svg` |
| Fidelity | `Fidelity.svg` |
| J. Safra Sarasin | `J. Safra Sarasin.svg` |
| Maveris | — **manquant** |
| HBM Partners | `HBM Partners.svg` |
| Valitas | `Valitas.png` |
| BCV | `BCV.svg` |
| IST | — **manquant** |
| BLKB | `BLKB.svg` |
| Valiant | `Valiant_RGB.png` |
| OLZ | `OLZ.png` |
| SSGA | `SSGA.svg` |
| BlackRock | `BlackRock.svg` |
| zCapital | `zCapital.png` |
| Zweiplus | `Zweiplus.svg` |
| Zwei Wealth | `Zwei Wealth.png` |

Tant qu'un fichier manque, le partenaire s'affiche en toutes lettres sur la
bande : rien ne casse, la case est simplement écrite au lieu d'être dessinée.

## Ce qui rend bien sur la bande

- **SVG de préférence** : net à toute taille et léger. Sinon PNG ou WebP
  détourés.
- **Le JPEG fonctionne aussi**, mais il n'a pas de transparence : il arrive
  avec son fond. La bande le compose en `multiply`, ce qui fait disparaître
  un fond blanc dans le crème de la page — le tracé seul subsiste. Un fond
  de couleur, lui, resterait visible : dans ce cas, préférez un autre
  format ou détourez le fichier.
- Les logos sont affichés en **niveaux de gris**, colorés au survol. Un
  logo déjà monochrome passe donc très bien.
- Hauteur de rendu : **44 px**, largeur libre jusqu'à 150 px. Inutile de
  les redimensionner, le cadrage s'en charge — mais évitez les fichiers de
  plusieurs centaines de kilooctets, il y en a vingt-neuf.
- Rognez les marges blanches autour du logo, sinon il paraîtra plus petit
  que ses voisins.

## Avant de publier

Afficher la marque d'un tiers suppose d'en avoir le droit. La plupart de
ces maisons publient une charte d'utilisation de leur logo, et certaines
demandent un accord écrit pour figurer sur un site commercial. À vérifier
maison par maison avant la mise en ligne.
