# Le Graal Croustillant

Jeu de match-3 arthurien et humoristique : 150 niveaux en 15 chapitres, 19 compagnons à débloquer, 40 trophées, 3 lieux à restaurer (Kaamelott, le Lac de la Dame, la Tour de Merlin).
Tout est original et fabriqué en code (graphismes, sons, musique). Aucune installation nécessaire.

## Jouer en local (sans Node)

```
powershell -ExecutionPolicy Bypass -File tools\serve.ps1
```
Puis ouvrir http://localhost:8790/ (le jeu a besoin d'un petit serveur : les modules JavaScript ne marchent pas en double-cliquant sur le fichier).

## Tests et réglage de la difficulté

- Tests du moteur et de l'aide automatique : http://localhost:8790/test/index.html
- Bot de simulation (200 parties par niveau, cible 40 à 70 % de réussite) : http://localhost:8790/tools/simulate.html
  - « Régler les coups puis mesurer » ajuste chaque niveau ; cocher « Enregistrer » réécrit `data/levels.json` et `data/simulation.md`.
  - `?levels=3,12` pour ne traiter que certains niveaux.
- Icônes de l'application : http://localhost:8790/tools/make-icons.html

## Mettre en ligne gratuitement

Render (site statique) : créer le dépôt GitHub, pousser le code, puis sur render.com « New » → « Blueprint » et choisir le dépôt
(`render.yaml` décrit tout). Chaque push redéploie le site. Penser à changer `VERSION` dans `sw.js` à chaque mise à jour,
pour que les téléphones qui ont installé le jeu récupèrent la nouvelle version.

GitHub Pages marche aussi : Settings → Pages → branche `main`, dossier racine.

## Organisation

- `js/engine.js` : moteur pur (grille, alignements, spéciales, gravité, objectifs, meilleur coup, bot), sans DOM.
- `js/board.js` : rendu canvas, animations, particules, gestes. `js/app.js` : écrans et progression.
- `js/art.js` : pièces, portraits, décors et médailles dessinés en code. `js/audio.js` : sons Web Audio.
- `js/data.js` : personnages, trophées, dialogues, phrases. `data/levels.json` : les 60 niveaux.
- `js/save.js` : sauvegarde locale et code de sauvegarde (Réglages) pour changer d'appareil.
- `sw.js` + `manifest.webmanifest` + `icons/` : application installable et jouable hors ligne.
