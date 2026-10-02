# WorldSoft Transfer — kit de logo

Logo final (piste B, « W en flèches ») de WorldSoft Transfer, une solution PWFINTECH.
Tous les SVG sont vectorisés : le texte est en contours, donc ils n'ont pas besoin de police installée.

## Palette

| Rôle | Nom | Hex |
|---|---|---|
| V avant / flèche, texte « Transfer » | Bleu électrique | `#0b4dff` |
| Losange de chevauchement, dégradé d'icône | Bleu fort | `#0637c9` |
| V arrière, « Transfer » en négatif | Bleu ciel | `#3fa0ff` |
| Texte « WorldSoft », fond négatif | Bleu nuit | `#061a52` |
| Fonds profonds (bas du dégradé OG) | Nuit profonde | `#040f33` |
| Losange en négatif, V arrière sur l'icône | Argent | `#c9d3e6` |
| Accent ponctuel uniquement (jamais dans le logo) | Rouge érable | `#e11d2b` |
| Négatif / icône | Blanc | `#ffffff` |

Icône d'app : dégradé diagonal `#0b4dff` → `#0637c9`.

## Typographie

Montserrat (SIL OFL 1.1, Google Fonts).
- « WorldSoft » : Montserrat 900, approche −10/1000 em.
- « Transfer » : Montserrat 500, approche −6/1000 em.
- Signature « une solution **PWFINTECH** » : 500 + 800, approche +20/+40.
- Interface et supports : Montserrat 500–800.

## Zone de protection

Unité **X** = hauteur de capitale du « W » de WorldSoft (environ 54 % de la hauteur du W du symbole).
Laisser au moins **1 X** de vide sur les quatre côtés du logo horizontal ou empilé, et 0,5 X autour du symbole seul.
La pointe de la flèche fait partie du logo : la zone se mesure depuis la pointe.

## Tailles minimales

- Logo horizontal : 120 px de large à l'écran, 30 mm à l'impression.
- Logo empilé : 80 px de large, 22 mm.
- Symbole seul : 24 px. En dessous, utiliser `favicon.svg` (W plein, plus épais, sans losange) : 16 à 48 px.

## Fichiers

- `svg/` : symbol, symbol-negative (sur `#061a52`), symbol-mono-navy, symbol-mono-white, favicon, logo-horizontal, logo-horizontal-negative, logo-stacked, app-icon (1024, carré plein pour iOS, qui applique son propre masque), app-icon-rounded (présentations).
- `png/` : app-icon-1024 (App Store, sans transparence), app-icon-512 (Google Play), android-adaptive-foreground-432 et android-adaptive-background-432 (108 dp à 4x, symbole dans la zone sûre de 66 %), apple-touch-icon-180, icon-192 et icon-512 (PWA), favicon-16/32/48, logo-horizontal@2x et logo-horizontal-negative@2x, og-image-1200x630.
- `favicon.ico` : 16, 32 et 48 px.
- `work/` : sources de génération (géométrie, contours de texte, police Montserrat et sa licence OFL).

## À éviter

- Changer les couleurs, inverser les deux V ou recolorer le losange hors des versions fournies.
- Déformer, incliner, faire pivoter le symbole, ou modifier l'angle de la flèche.
- Ajouter ombres, contours, reflets, effets 3D ou chromés.
- Placer la version couleur sur un fond moyen ou chargé : utiliser la version négative sur bleu nuit, ou une version monochrome.
- Recomposer le nom dans une autre police, ou changer les graisses ou l'espacement.
- Utiliser le rouge érable dans le logo.
- Utiliser le symbole détaillé sous 24 px : passer au favicon.
