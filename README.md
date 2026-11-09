# Modulo — Le labo des nombres

Application pédagogique en français. Les algorithmes et le chiffrement RSA sont calculés en **Python** ; le navigateur affiche les formulaires, les explications et les formules.

## Lancer l’application

Prérequis : Python 3.10 ou plus récent. Aucune bibliothèque Python à installer.

Sous Windows, double-cliquez sur **Lancer Modulo.bat**.

Ou, dans ce dossier :

```powershell
python app.py --open
```

Adresse par défaut : http://127.0.0.1:8766. Si ce port est déjà utilisé : `python app.py --port 8767 --open`.

Gardez la fenêtre du serveur ouverte pendant l’utilisation. Ctrl+C arrête le serveur. Ouvrir directement `dist/index.html` permet de lire le cours, mais les calculs nécessitent le serveur Python.

## Ce que contient l’application

- Inverse modulaire : Euclide étendu, Bézout, représentant positif et vérification.
- PGCD, PPCM et division euclidienne avec reste positif pour les entiers signés.
- PPCM : un calculateur dédié, avec la méthode par le PGCD.
- Congruences : reste de a modulo n, résolution de ax ≡ b (mod n) avec toutes les solutions, ou comparaison de deux entiers.
- Exposant facultatif : laisser k vide calcule directement le reste de a modulo n, sans afficher de puissance. Un zéro saisi reste un véritable exposant nul.
- Fermat et Euler : conditions, réduction de l’exposant et carrés successifs (également sans réduction lorsque les conditions ne sont pas remplies).
- Indicatrice d’Euler : facteurs premiers, calcul et visualisation.
- RSA : génération de clés, chiffrement et déchiffrement de nombres ou de textes UTF-8.
- Carnet de cours : huit chapitres, exemples détaillés, six exercices avec corrections et formules LaTeX rendues avec KaTeX.
- Séries d’exercices : huit thèmes, trois difficultés, 1 à 20 questions et corrections détaillées générées en Python.

## Préparer une série à imprimer

Ouvrez **Les exercices** dans la navigation. Choisissez les thèmes, le niveau et le nombre de questions, puis cliquez sur **Générer une nouvelle série**. Les nombres changent à chaque nouvelle génération ; les questions d’une même feuille sont distinctes et les thèmes sélectionnés alternent.

- **Imprimer les exercices** prépare une feuille A4 avec quatre exercices par page, sans lignes de rédaction et aucun corrigé, même si celui-ci est affiché à l’écran.
- **Afficher le corrigé** révèle les méthodes, les divisions d’Euclide, les coefficients de Bézout et les vérifications.
- **Imprimer le corrigé** prépare un document séparé avec une correction par page. Le même numéro de série figure sur les deux documents.
- Les boutons ouvrent directement la fenêtre d’impression, sans nouvel onglet. Les équations imprimées utilisent le MathML natif ; la feuille temporaire est libérée après fermeture de la fenêtre.
- Pour créer un PDF, choisissez **Enregistrer au format PDF** dans la fenêtre d’impression. Utilisez A4, échelle 100 %, et désactivez les en-têtes/pieds de page ajoutés par le navigateur si nécessaire.
- Copiez le numéro `M1-…` pour rouvrir la série via **Retrouver une série**. Il encode les thèmes, la difficulté, le nombre de questions et la graine aléatoire ; aucun compte ni stockage en ligne n’est nécessaire. L’adresse de la page contient également ce numéro.

Le thème **Équations de congruence** propose des équations ax ≡ b (mod n), avec inverse, simplification par le PGCD ou absence de solution, et un corrigé imprimable. Les anciens numéros de série conservent leurs exercices.

Les difficultés changent la taille des nombres et introduisent des entiers négatifs dans certains exercices Défi. RSA reste scolaire ; la calculatrice est autorisée. Chaque exercice propose trois indices progressifs et une vérification des résultats saisis, champ par champ. Les coefficients de Bézout et les représentants modulaires équivalents sont acceptés. La vérification porte sur les résultats numériques, pas sur le raisonnement rédigé ni la factorisation détaillée. Les feuilles imprimées restent séparées de ces outils interactifs.

Toutes les ressources (illustration, KaTeX, polices) sont locales. Aucun accès Internet n’est nécessaire après le téléchargement. Le serveur écoute uniquement sur votre ordinateur. Les entiers sont transmis au navigateur sous forme de chaînes pour préserver leur précision.

## Organisation

- `app.py` : serveur local et API JSON, bibliothèque standard Python.
- `calculations.py` : algorithmes et validation, indépendants de l’interface.
- `exercises.py` : génération reproductible et corrections ; conserver le format M1 pour retrouver les anciennes séries.
- `dist/exercises.html`, `dist/exercises.js`, `dist/exercises.css` : choix des séries, rendu LaTeX et impression A4.
- `test_calculations.py` : tests des calculs et des cas limites.
- `dist/app.js` : navigation et formulaires.
- `dist/results.js` : appels à Python et mise en forme des résultats.
- `dist/course.js` : cours et expressions LaTeX, faciles à modifier.
- `dist/course.css` : mise en page du carnet.
- `dist/style.css`, `dist/pixel.css` : interface et identité pixel.
- `dist/vendor/katex/` : moteur de composition mathématique, polices et licence MIT.

## Vérifier

```powershell
python -m unittest test_calculations test_exercises test_practice -v
```

Le contrôle de la génération des feuilles et de leur complexité s’exécute avec `node test_print.cjs` (Node.js est nécessaire uniquement pour ce test).

## Limites pédagogiques

Entrées générales : 100 caractères. Factorisation : n ≤ 10¹². Nombres premiers RSA : p et q ≤ 10⁶. Texte : 500 caractères, encodés en UTF-8 ; chaque octet est chiffré séparément, avec n > 255.

Ce RSA est un modèle scolaire sans bourrage cryptographique. Ne pas l’utiliser pour des secrets réels.

## Versions

La version actuelle utilise Python pour les calculs et comprend le nouveau carnet de cours avec formules LaTeX, ainsi qu’un fond uni. Lancez-la localement avec les instructions ci-dessus.

Les versions précédentes restent disponibles : `v0.1-dashboard` (tableau de bord bleu) et `v0.2-pixel-lab` (premier design pixel approuvé).

Le cours reprend les notions de « Inverse Modulaire et Indicatrice d’Euler » fourni en classe, puis développe l’application à RSA. Documentation du moteur de formules : https://katex.org/docs/browser.
