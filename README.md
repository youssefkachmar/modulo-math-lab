# Modulo — Arithmétique & RSA

Application pédagogique en français, utilisable directement dans un navigateur.

## Ouvrir

Double-cliquez sur `dist/index.html`. Aucun compte, serveur ou installation nécessaire. Les calculs et les polices fonctionnent entièrement hors ligne.

## Modules

- Inverse modulaire : PGCD, divisions d’Euclide, coefficients de Bézout, représentant positif et vérification ; méthode d’Euler pour les modules jusqu’à 10¹².
- Euclide & Bézout : division euclidienne avec reste positif, PGCD, PPCM et coefficients pour des entiers signés.
- Indicatrice d’Euler : décomposition en facteurs premiers, calcul de φ(n), visualisation des entiers premiers avec n jusqu’à 100.
- RSA : choix de p, q et e, calcul des clés, chiffrement et déchiffrement de nombres ou de textes UTF-8.

Les entiers sont calculés exactement avec BigInt. Les entrées générales acceptent jusqu’à 100 caractères. La factorisation est limitée à 10¹² et les nombres premiers RSA à 10⁶ pour garder les calculs interactifs. Les messages texte sont limités à 500 caractères ; chaque octet est un bloc indépendant, d’où la condition n > 255. Les blocs chiffrés sont séparés par des espaces.

RSA est ici une démonstration scolaire sans bourrage cryptographique ; ne pas l’utiliser pour des secrets réels. Aucune donnée saisie n’est envoyée à un serveur.

## Vérifier les calculs

Avec Node.js : `node test.cjs`.

## Organisation

`dist/math.js` contient les algorithmes, `dist/app.js` les explications et interactions, `dist/style.css` le design et `dist/index.html` la structure. Le bouton « Imprimer la fiche » permet d’imprimer les résultats ou de les enregistrer en PDF via le navigateur.

## Identité visuelle

Le labo utilise un fond quadrillé clair, des fenêtres à contours pixel, des boutons bleus et quatre stations de calcul. `dist/pixel.css` contient ce thème. Les calculs restent lisibles et les animations respectent la préférence de réduction des mouvements.

L’illustration originale `dist/assets/math-lab.png` a été créée avec le générateur d’images intégré. Brief : laboratoire mathématique lumineux en pixel art 16 bits, robot calculatrice bleu, personnage orange tenant une clé, personnage pi violet et coffre RSA ; palette bleu, violet, orange, or et blanc, sans vert ni fond sombre. Les entrées utilisateur ne sont jamais intégrées à l’illustration.
