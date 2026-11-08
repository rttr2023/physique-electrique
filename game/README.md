# Ampéria — le jeu de révision

RPG en pixel art pour réviser la physique électrique. Tout le contenu vient des polycopiés (`Cours/`),
extrait dans `data/`. Design complet : `GAME_DESIGN.md`.

## Lancer le jeu

- **Sur le site en ligne** : bouton « Jouer » (le disjoncteur) dans l'en-tête, ou `…/game/`.
- **En local** : les navigateurs bloquent la lecture des données depuis un fichier, il faut un petit serveur.
  Dans le dossier du site :

  ```
  python -m http.server 8000
  ```

  puis ouvrir <http://localhost:8000/> (site) ou <http://localhost:8000/game/> (jeu directement).
- **Sur téléphone** (même Wi-Fi que le PC) : lancer `python -m http.server 8000 --bind 0.0.0.0`, puis ouvrir
  `http://<adresse IP du PC>:8000/game/` sur le téléphone.

## Commandes

| | Clavier | Téléphone |
|---|---|---|
| Se déplacer | flèches, ZQSD, WASD (maintenir) | croix en bas à gauche |
| Parler / agir | Espace, Entrée, E | bouton A |
| Menu | Échap, M | ☰ |
| Grimoire | C | 📖 |
| Répondre | 1 à 4 ; saisie + Entrée | boutons, pavé numérique |

## Tester rapidement

- **Menu → Options → Mode test** : boutons pour avancer la date du jeu (1, 7 ou 30 jours) et voir
  apparaître les zones corrompues (révisions en retard).
- **`game/?verif`** : rend toutes les formules avec KaTeX et écrit le résultat dans la console du navigateur.
- **Vérifications sans navigateur** (depuis le dossier du site) :
  - `node game/outils/verifier-donnees.js` : données de cours (structure, sources, calculs des TD) et
    régénère `data/A_VERIFIER.md` ;
  - `node game/outils/verifier-jeu.js` : régions, cartes, affirmations, plages, et génère ~7 000 questions
    pour vérifier qu'elles ont toutes une seule bonne réponse et que la correction marche.
- **Repartir de zéro** : Menu → Sauvegarde → Nouvelle partie.

## Organisation

| Dossier / fichier | Rôle |
|---|---|
| `index.html`, `css/jeu.css` | page du jeu et mise en page (PC, téléphone portrait et paysage) |
| `js/noyau.js` | hasard, nombres en français, unités et préfixes, rendu des formules |
| `js/donnees.js` | chargement de `data/`, liste des éléments révisables par chapitre |
| `js/srs.js` | répétition espacée (boîtes de Leitner 0 à 5) et maîtrise |
| `js/questions.js` | les 5 attaques et les étapes de boss, fabriquées depuis les JSON ; correction |
| `js/monde-donnees.js`, `js/monde.js` | cartes ASCII, zones, portes ; exploration, habitants, corruption |
| `js/combat.js` | combats, boss, compétences, saisie avec unité et préfixe |
| `js/sprites.js` | palette de 32 couleurs et graphismes dessinés dans le code |
| `js/ui.js`, `js/codex.js` | barre d'état, dialogues, menus, grimoire |
| `js/progression.js`, `js/sauvegarde.js`, `js/audio.js`, `js/entree.js`, `js/jeu.js` | XP et équipement, sauvegarde, sons, commandes, boucle de jeu |
| `data/chNN.json` | contenu des cours (phase 1) |
| `data/regions.json` | une région par chapitre : nom, carte, couleurs, Parasites, boss, récompense |
| `data/cartes/*.json` | cartes en ASCII (légende dans chaque fichier) |
| `data/plages.json` | valeurs réalistes tirées au hasard pour les calculs |
| `data/affirmations.json` | vrai / faux des pièges (**à relire** : champ `relu`) |
| `data/dialogues.json` | phrases d'ambiance des habitants |
| `../js/disjoncteur.js` | l'entrée vers le jeu, dans l'en-tête du site |

## Ajouter un chapitre

1. Écrire `data/chNN.json` (format : `data/FORMAT.md`) et l'ajouter dans `data/index.json`.
2. Lancer les deux vérificateurs.
3. Facultatif : une entrée dans `data/regions.json` (nom, carte, couleurs, boss…). Sans elle, le chapitre
   reçoit une région par défaut, jouable tout de suite. Les régions 7 et 8 s'ouvrent sur les panneaux
   « chantier » du village.
4. Facultatif : des affirmations vrai/faux pour ses pièges dans `data/affirmations.json`, et des plages de
   valeurs dans `data/plages.json` si une formule donne des calculs peu réalistes.

## KaTeX

Le jeu cherche KaTeX dans `lib/katex/` (copie locale, fonctionne hors ligne), sinon sur le CDN jsDelivr
(version 0.16.11), sinon affiche une écriture simplifiée des formules. Pour la copie locale : télécharger
<https://registry.npmjs.org/katex/-/katex-0.16.11.tgz>, et copier `katex.min.js`, `katex.min.css` et le
dossier `fonts/` de `package/dist/` dans `game/lib/katex/`.
