# Ampéria — game design

RPG d'aventure en pixel art pour réviser la physique électrique du BTS. Tout le contenu pédagogique vient
de `game/data/*.json` (phase 1). Ce document décrit le jeu ; il ne contient pas de code.

---

## 1. Principes

1. **Le cours est la seule source.** Chaque dialogue, question ou correction vient des JSON. Les éléments
   `à_vérifier` ne sont jamais utilisés. Les éléments `hors_cours` sont signalés par un badge (et
   désactivables dans les options).
2. **Chaque erreur enseigne.** Une mauvaise réponse affiche toujours la bonne réponse, la formule du
   codex et un lien vers le scan source.
3. **Session courte.** Une sortie utile en 5 minutes sur téléphone : quelques combats, une zone purifiée,
   sauvegarde automatique.
4. **Répéter ce qui est fragile.** Le monde lui-même montre ce qu'il faut revoir (zones corrompues).
5. **Ajouter un chapitre = ajouter des données.** Aucune question, région ou boss n'est écrit dans le code.

---

## 2. Univers et histoire

**Ampéria** est un pays alimenté par un immense réseau électrique. Le **Grand Délestage** a tout coupé :
des **Parasites** (créatures nées des erreurs de calcul) ont envahi les postes et dévoré les formules.

Le joueur est un·e **apprenti·e électrotechnicien·ne** (nom au choix). Sa mission : remettre chaque région
sous tension en reconstruisant son savoir. Chaque région restaurée rallume une partie de la carte du
monde ; le village central se rallume peu à peu.

Ton : léger, bienveillant, humour d'atelier (« Encore un qui a oublié de couper au disjoncteur… »). Les
PNJ parlent simplement ; les définitions qu'ils donnent sont celles du cours, mot pour mot.

---

## 3. Direction artistique

| Élément | Choix |
|---|---|
| Résolution | rendu interne **320 × 180**, agrandi en entier (×2, ×3, ×4…) sans flou ; bandes noires si besoin |
| Tuiles | 16 × 16 px ; personnages 16 × 24 px |
| Palette | **32 couleurs** fixes, propre au jeu (voir ci-dessous) |
| Fond | bleu nuit, pour que les lueurs électriques ressortent |
| Code couleur | les 3 couleurs du site : **orange/ambre = tension**, **cyan = courant**, **violet = puissance**. Elles servent partout (UI, sorts, ennemis, codex), ce qui relie le jeu au site |
| Lumière | les objets sous tension ont une lueur qui pulse ; une région hors tension est désaturée et sombre, elle reprend ses couleurs à mesure qu'on la restaure |
| Typographie | police pixel 8 px dessinée pour le jeu (chiffres, lettres accentuées, Ω µ φ ω) pour la carte et les combats ; police normale du site + **KaTeX** pour les questions et formules (lisibilité avant tout) |
| Animations | 2 à 4 images par animation, 8 à 12 images/s ; arcs électriques générés au hasard (jamais deux fois identiques) |
| Graphismes | **dessinés dans le code** sous forme de petites grilles de pixels (une lettre par couleur de la palette). Aucun fichier image à gérer, tout est modifiable dans un éditeur de texte, et le style reste cohérent. |
| Son (phase 4) | effets 8 bits générés par le navigateur (Web Audio), pas de fichiers audio |

**Palette (32 couleurs)** — 4 bleus nuit (fond, ombres), 4 gris acier (métal, câbles), 4 cuivres/ambres
(tension), 4 cyans (courant), 4 violets (puissance), 3 verts (végétation, réussite), 3 rouges
(danger, erreur, Parasites), 2 crèmes (texte, peau claire), 2 bruns (bois, peau foncée), blanc, noir.

---

## 4. Le monde

### 4.1 Carte du monde

Une carte d'ensemble relie le village central aux régions par des lignes électriques. Une région est
accessible quand la précédente a au moins **60 % de maîtrise** ou que son boss est battu (au choix du
joueur : on peut avancer vite ou consolider). Les régions sans données apparaissent « en construction »
(chantier balisé), prêtes à s'ouvrir quand un chapitre sera ajouté.

### 4.2 Régions

| Chapitre | Région | Ambiance | Boss (exercice du cours) |
|---|---|---|---|
| — | **Le Poste Source** (village) | place centrale, transformateur géant éteint, maison du joueur | — |
| 1. Régime continu | **Vallée du Continu** | prairies calmes, rivières parfaitement lisses, lignes droites | **Le Superposeur** : exemple de superposition (3 étapes) |
| 2. Régimes variables | **Marais des Transitoires** | brume, mares qui se remplissent et se vident, éclairs isolés | **La Bobine Insomniaque** : questions sur Kirchhoff et les conventions (pas d'exercice chiffré dans le cours) |
| 3. Mesure de tension | **Observatoire des Mesures** | instruments géants, cadrans, écrans d'oscilloscope dans le ciel | **L'Imposteur RMS** : choisir le bon multimètre et la bonne position, puis les périodes et fréquences |
| 4. Déphasage | **Forêt de l'Alternatif** | arbres qui ondulent en sinusoïde, deux lianes v et i décalées | **Le Déphaseur** : TD ex. 2 (oscillogramme à 50 Hz, 9 étapes) |
| 5. Modélisation | **Forge des Impédances** | forges, bobines géantes, four à induction rougeoyant | **Le Golem du Four** : problématique du four à induction ou TD ex. 4 (R, L, C) |
| 6. Puissances | **Citadelle de Boucherot** | remparts en triangles des puissances, batteries de condensateurs | **Le Baron Réactif** : TD ex. 1 (atelier, méthode de Boucherot) |
| plus tard | Citadelle Triphasée, Usine des Machines… | | |

### 4.3 Dans une région

- **Carte en tuiles** vue de dessus, une dizaine d'écrans de 20 × 11 tuiles reliés entre eux.
- **PNJ du savoir** : chacun « porte » une notion ou une formule du chapitre. Lui parler affiche la
  définition (texte du cours) et ajoute l'élément au codex comme *découvert*.
- **Herbes hautes / zones de câbles** : rencontres aléatoires avec des Parasites (combat).
- **Disjoncteurs fermés** : barrières qui s'ouvrent quand on a découvert les notions d'une partie
  du chapitre (ex. « associations de résistances ») ou battu un mini-boss.
- **Zones corrompues** : tuiles rouge-violet qui grésillent (voir § 8). Y marcher lance un combat sur
  les éléments à revoir ; les gagner purifie la zone.
- **Panneau du scan** : dans chaque région, un pupitre ouvre la liste des scans du chapitre (lien vers
  les PDF du dossier `Cours/`).
- **Poste de la région** : la salle du boss. Le battre remet la région sous tension (animation de
  rallumage, la région reprend ses couleurs).

**Comment les cartes restent des données** : un petit nombre de *gabarits* de carte (fichiers JSON de
tuiles, réutilisables) + un fichier `game/data/regions.json` qui associe à chaque chapitre une région
(nom, palette, gabarit, boss, Parasites). Les PNJ sont placés automatiquement sur les emplacements
prévus du gabarit, dans l'ordre des notions du chapitre. Sans entrée dans `regions.json`, un nouveau
chapitre reçoit une région par défaut : il est jouable tout de suite, et on peut soigner son décor ensuite.

---

## 5. Combats

### 5.1 Déroulement

Tour par tour, à un contre un. L'écran montre le Parasite, sa barre de vie, la **Charge** (points de
vie) du joueur et son **Énergie** (pour les compétences).

À son tour, le joueur choisit :

- **Attaquer** → une question apparaît. Bonne réponse : dégâts. Mauvaise réponse : le Parasite riposte,
  puis la **correction** s'affiche (réponse attendue, formule en KaTeX, conditions, lien vers le scan).
- **Compétence** (coûte de l'Énergie) : voir § 9.2.
- **Codex** : consulter une formule déjà découverte (coûte le tour, sans pénalité de maîtrise).
- **Fuir** (sauf boss).

Pas de minuteur par défaut (on apprend, on ne panique pas). Un **mode chrono** facultatif double les
dégâts pour qui veut s'entraîner aux conditions d'examen.

### 5.2 Les 5 types d'attaques

Chaque type est généré à partir des JSON ; un ennemi propose un type selon sa nature (§ 5.3).

| Attaque | Ce que voit le joueur | Fabriquée à partir de | Dégâts |
|---|---|---|---|
| **Éclair** (QCM notion) | une définition → choisir la notion parmi 4 (ou l'inverse) | `notions` ; mauvaises réponses tirées des autres notions du même chapitre | ★ |
| **Soudure** (formule à trous) | `P = V I \boxed{?}` → choisir parmi 4 morceaux ou symboles | `formules[].latex` ; on masque une `variable` ; leurres : autres variables du chapitre | ★★ |
| **Arc calculé** (calcul) | énoncé avec valeurs → saisir **nombre + préfixe + unité** | `formules[].calcul` + valeurs tirées au hasard (§ 5.4) | ★★★ |
| **Diagnostic** (unité / bonne formule) | « Unité de Q ? » ou « En dérivation, je connais V : quelle expression de P ? » | `variables[].unite`, `formules[].conditions`, `relations` | ★★ |
| **Contre-piège** (vrai ou faux) | une affirmation, vraie ou piégée | `pieges` pour les affirmations vraies ; pour les fausses, des versions inversées écrites pour le jeu dans `game/data/affirmations-fausses.json` (ex. « en continu, la bobine est un circuit ouvert »), que tu relis | ★ |

Le calcul est l'attaque la plus forte : le jeu pousse à faire de vrais calculs sans les rendre obligatoires.

### 5.3 Les Parasites

Chaque Parasite a une **affinité** (tension, courant ou puissance, codée par sa couleur) et un
**point faible** (un type d'attaque qui fait ×1,5). Ils sont génériques et changent de couleur selon la
région, pour en avoir beaucoup avec peu de dessins. Exemples :

| Parasite | Apparence | Point faible |
|---|---|---|
| **Court-Jus** | petite étincelle nerveuse | Éclair |
| **Ohmlette** | boule de résistance qui roule | Arc calculé |
| **Spectre Réactif** | fantôme violet qui oscille | Diagnostic |
| **Fuite-à-la-Terre** | flaque grésillante | Contre-piège |
| **Harmonique** | serpent en dents de scie | Soudure |

L'élément interrogé (notion, formule, piège) n'est pas tiré au hasard : il vient de la file de
répétition espacée (§ 8).

### 5.4 Valeurs aléatoires réalistes et correction

- **Plages de valeurs** dans `game/data/plages.json` (réglages de jeu, pas du contenu de cours) :
  par grandeur, par exemple R entre 10 Ω et 10 kΩ en valeurs normalisées (série E12), V parmi 12, 24, 48,
  230, 400 V, f parmi 50 Hz… ou une plage, L entre 10 mH et 1 H… Une formule peut avoir ses propres
  plages si besoin.
- **Valeurs du cours en priorité** : quand un exemple ou un TD utilise une grandeur, ses valeurs servent
  de modèle (± 30 %), pour rester proche de ce qu'on verra en contrôle.
- **Garde-fous** : on retire un tirage qui donne un résultat absurde (négatif, infini, plus de 6 ordres
  de grandeur d'écart avec le cours).
- **Saisie** : clavier numérique propre au jeu (évite que le clavier du téléphone cache l'écran) avec
  virgule, signe −, puissance de dix, boutons de **préfixe** (p n µ m — k M) et d'**unité** proposées
  (toutes les unités du chapitre, pour ne pas donner la réponse).
- **Correction** : tolérance **2 %** sur la valeur (comme le vérificateur de données) ; l'unité doit être
  la bonne ; les préfixes sont convertis (0,5 A = 500 mA). Valeur juste mais unité fausse = **demi-réussite** :
  moitié des dégâts, et la correction insiste sur l'unité.
- Les angles se donnent en degrés sauf si la question demande des radians.

---

## 6. Boss

Un boss est un **exercice en plusieurs étapes** tiré d'un `exemple` du chapitre (TD ou exemple du cours),
comme au contrôle.

- **Une phase par étape** : chaque bonne réponse retire une partie de son armure ; les résultats déjà
  trouvés restent affichés à l'écran (on s'en sert pour la suite).
- **Valeurs** : la première fois, celles du polycopié (on refait le vrai TD). Les fois suivantes,
  valeurs modifiées et recalculées avec les `calcul` de chaque étape (exercice toujours neuf).
- **Étapes sans calcul** (ex. « inductif ou capacitif ? ») : posées en QCM.
- **Erreur** : on perd de la Charge, la correction de l'étape s'affiche, puis on passe à la suite avec la
  bonne valeur (on ne bloque jamais sur une étape).
- **Victoire** : la région est remise sous tension. On gagne un **objet d'équipement** et un rang de boss
  (bronze, argent ou or selon le nombre d'erreurs), à améliorer en revenant le combattre.

---

## 7. Codex (le Grimoire)

Accessible partout (touche C ou bouton), y compris en combat.

- **Formules**, par région puis par groupe : formule en KaTeX, tableau des variables (symbole, sens,
  unité), conditions d'application, **scan source** (lien vers le PDF et zone de la page), formules liées
  (relations), pièges associés.
- **États** : *inconnue* (silhouette) → *découverte* (après le PNJ) → *maîtrisée* (boîte 3 et plus,
  § 8) → *gravée* (boîte 5, liseré doré).
- **Badges** : « hors cours » pour les ajouts, « manuscrit » pour les annotations du professeur.
- **Notions** et **pièges** ont leur propre onglet.
- **Recherche** par nom ou symbole.
- **Fiche de révision** : bouton qui affiche toutes les formules découvertes d'une région sur une page
  (à imprimer ou consulter avant un contrôle).

---

## 8. Répétition espacée intégrée au jeu

### 8.1 Le modèle

Chaque élément (notion, formule, piège) a une **boîte de Leitner** de 0 à 5 et une **date de révision** :

| Boîte | Révision suivante |
|---|---|
| 0 (nouveau ou raté) | dans la même session |
| 1 | 1 jour |
| 2 | 3 jours |
| 3 | 7 jours |
| 4 | 14 jours |
| 5 | 30 jours |

- Bonne réponse → boîte +1 (+2 pour un calcul juste du premier coup).
- Mauvaise réponse → **retour en boîte 0**. Demi-réussite (unité fausse) → boîte −1.
- Une formule compte pour toutes ses attaques : la Soudure, le Diagnostic et l'Arc calculé d'une même
  formule font bouger la même boîte.

### 8.2 Ce que le joueur voit

- **Rencontres** : le Parasite rencontré interroge en priorité un élément *en retard* ou en boîte basse.
  Tirage pondéré : boîte 0 → poids 8, 1 → 5, 2 → 3, 3 → 2, 4 → 1, 5 → 0,5 ; ×2 si la révision est en retard.
- **Zones corrompues** : quand des éléments d'une région sont en retard, des taches de corruption
  apparaissent sur sa carte (une par élément en retard, au plus 5). Plus le retard dure, plus elles
  grandissent et grésillent. Les purifier = combats sur ces éléments.
- **Carte du monde** : une région pleine de corruption clignote. On voit d'un coup d'œil où revoir.
- **Éléments maîtrisés** : leurs ennemis deviennent rares ; un élément gravé ne revient qu'en révision
  à 30 jours ou en boss.

### 8.3 Maîtrise d'un chapitre

% de maîtrise = moyenne des boîtes de ses éléments ÷ 5. Elle s'affiche sur la carte, dans le codex et
dans les statistiques.

---

## 9. Progression

### 9.1 XP et niveaux

- XP gagnée : Éclair 5, Contre-piège 5, Soudure 10, Diagnostic 10, Arc calculé 20, étape de boss 30,
  bonus de 50 % au premier essai. Aucune XP pour une mauvaise réponse, mais aucune perte non plus.
- Chaque niveau donne **+ Charge maximale** et, tous les 2 niveaux, un **point de compétence**.

### 9.2 Compétences (arbre court)

| Compétence | Effet | Coût |
|---|---|---|
| **Sonde** | retire 2 mauvaises réponses d'un QCM | 2 Énergie |
| **Mémo** | affiche la formule concernée (sans les valeurs) | 3 Énergie |
| **Pince ampèremétrique** | indique l'unité attendue d'un calcul | 2 Énergie |
| **Disjoncteur différentiel** | annule une riposte | 4 Énergie |
| **Relèvement** | rend 30 % de Charge | 4 Énergie |

Utiliser une aide ne fait pas descendre la boîte, mais limite la montée à +1 maximum.

### 9.3 Équipement (gagné sur les boss, un par région)

Multimètre TRMS (Énergie +2), Gants isolants (Charge +20 %), Oscilloscope (bonus sur les questions de
déphasage), Calculatrice de chantier (calculatrice dans l'écran de combat, utile sur téléphone), Casque
d'électricien (riposte −25 %), Clé dynamométrique (dégâts des Arcs calculés +20 %).

### 9.4 Statistiques

Écran « Carnet de chantier » : maîtrise par chapitre (barres), précision par type d'attaque,
**top 5 des éléments les plus ratés** (avec lien vers le codex), temps de jeu, jours d'affilée.

---

## 10. Sauvegarde : localStorage (recommandé)

Le site n'utilise pas Firebase. L'ajouter imposerait des comptes, une configuration et une dépendance
pour peu d'intérêt ici. Recommandation :

- **Sauvegarde automatique dans localStorage** après chaque combat, changement d'écran ou découverte.
- **Exporter / importer la sauvegarde** (fichier `.json`) depuis le menu : c'est aussi le moyen de
  passer du PC au téléphone, et une copie de secours.
- Sauvegarde **versionnée** (numéro de format) pour qu'une mise à jour du jeu ne la casse pas.
- Les éléments sont désignés par leur `id` : si un chapitre est complété plus tard, la progression est
  conservée et les nouveaux éléments arrivent en boîte 0.

Firebase reste possible plus tard (synchronisation automatique entre appareils) sans changer le reste du jeu.

---

## 11. Contrôles et écrans

| | PC | Téléphone |
|---|---|---|
| Déplacement | flèches ou ZQSD/WASD | croix directionnelle tactile (bas gauche) |
| Action / parler | Espace ou Entrée | bouton A (bas droite) |
| Retour / menu | Échap | bouton B / bouton ☰ |
| Codex | C | icône livre |
| Réponses | clic, touches 1 à 4, saisie clavier | grands boutons, clavier numérique du jeu |

- La **carte** est dessinée dans un canvas en pixel art ; les **questions et le codex** s'affichent par
  dessus, en HTML (KaTeX ne dessine pas dans un canvas, et le texte reste net et accessible).
- Téléphone tenu **en largeur** pour explorer ; les questions fonctionnent aussi **en hauteur**.
- Options : taille du texte, vitesse des dialogues, sons, mode chrono, inclure le hors cours,
  réduire les animations (pour qui y est sensible).

---

## 12. Données ajoutées pour le jeu (phase 3)

En plus des JSON de cours (inchangés) :

| Fichier | Rôle |
|---|---|
| `game/data/regions.json` | chapitre → région (nom, palette, gabarit de carte, boss = id d'exemple, Parasites) |
| `game/data/plages.json` | plages réalistes des grandeurs pour les calculs |
| `game/data/cartes/*.json` | gabarits de carte (tuiles, emplacements des PNJ, portes) |
| `game/data/affirmations-fausses.json` | versions fausses des pièges pour le Contre-piège (une par piège, relues par Romain) |
| `game/data/dialogues.json` | phrases d'ambiance des PNJ (« Salut ! Tu savais que… ») autour des définitions du cours |

---

## 13. Entrées vers le jeu depuis le site

Trois idées ; une seule sera faite en phase 3.

### A. Le disjoncteur

Un petit **tableau électrique en pixel art** dans l'en-tête du site, à côté des onglets. Sa manette est
en bas (OFF). On la tire vers le haut (glisser au doigt ou clic) : *clac*, un éclair traverse la page
en zigzag, l'écran clignote deux fois comme un néon qui démarre, puis s'éteint et le jeu s'allume. Une
LED sur le tableau montre l'état de la sauvegarde (rouge : jamais joué, verte : partie en cours, ambre :
des zones corrompues t'attendent).

### B. L'échelle de Jacob

En bas de chaque page de cours, deux électrodes en V avec un **arc électrique qui monte** sans arrêt (la
célèbre expérience des labos). Au survol, l'arc grossit et crépite. Au clic, l'arc s'élargit jusqu'à
devenir un portail qui avale l'écran. Lien direct avec le chapitre lu : « Entraîne-toi sur la Vallée du
Continu ».

### C. L'apprenti qui traverse la page

Le **héros du jeu**, petit sprite pixel, passe de temps en temps en marchant sur le bord de l'en-tête, une
bobine de câble sous le bras. On le touche : il s'arrête, se retourne, une bulle dit « On y va ? » puis
il saute dans une prise murale qui avale l'écran. Il sait dans quel chapitre on est et propose la
région correspondante.

**Recommandation : A**, toujours visible, peu encombrant, compréhensible du premier coup, et la LED donne
une raison de revenir. C peut s'y ajouter en phase 4 comme clin d'œil.

---

## 14. Décisions (validées par Romain le 08/11/2026)

| Question | Décision |
|---|---|
| Entrée vers le jeu | **A. Le disjoncteur** dans l'en-tête du site |
| Périmètre | pas de prototype à une seule région : **toutes les régions**, construites **chapitre par chapitre** |
| Éléments `hors_cours` | **inclus par défaut**, avec badge, désactivables dans les options |
| Nom | **Ampéria** |

## 15. Plan de construction

1. **Moteur + Vallée du Continu (ch01)** : page `game/index.html`, village, carte, PNJ, 5 attaques,
   boss, codex, répétition espacée, zones corrompues, XP, sauvegarde + export, contrôles clavier et
   tactiles, disjoncteur sur le site. Commit.
2. **Une région par chapitre, dans l'ordre** (ch02 → ch06) : entrée dans `regions.json`, gabarit de carte,
   Parasites, boss, affirmations fausses. Vérification et commit après chaque région.
3. **Finitions** : équipement et compétences au complet, statistiques, sons, animations, équilibrage.
