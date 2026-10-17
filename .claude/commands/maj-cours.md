---
description: Intègre au site les nouveaux cours (PDF scannés) déposés dans le dossier Cours
argument-hint: "[fichiers ou consigne facultative, ex. « seulement scan0140 à scan0146 »]"
---

Mets à jour le site de physique électrique avec les nouveaux polycopiés du dossier `Cours/`.

Consigne éventuelle de l'utilisateur : $ARGUMENTS

## 1. Trouver ce qui est nouveau

Lance `node outils/nouveaux-cours.js`. Il liste les PDF de `Cours/` qui ne figurent dans le tableau `sources` d'aucun chapitre (`chapitres/*.js`). S'il n'y a rien de nouveau, dis-le et arrête-toi.

## 2. Lire les scans

Lis **chaque** nouveau PDF avec l'outil Read (ce sont des images scannées, souvent une page par fichier, dans l'ordre des numéros). Repère pour chacun : le chapitre (numéro et titre dans l'en-tête), le type de page (problématique, annexe / cours, TD, exercices supplémentaires) et les annotations manuscrites utiles. Des pages sans en-tête sont la suite du fichier précédent.

Si un passage est illisible ou ambigu, ne l'invente pas : transcris ce qui est sûr et signale le doute à la fin.

## 3. Écrire ou compléter le chapitre

Un chapitre = un fichier `chapitres/chNN.js` qui appelle `PE.ajouterCours({...})`. Prends `chapitres/ch06.js` comme modèle.

- Nouveau chapitre : crée `chapitres/chNN.js` et ajoute `<script src="chapitres/chNN.js"></script>` dans `index.html`, entre les repères `COURS:DEBUT` et `COURS:FIN`.
- Suite d'un chapitre existant : complète son fichier (sections, formules) et ajoute les PDF à `sources`.
- Chaque PDF intégré doit apparaître dans `sources`, sinon il sera redétecté la prochaine fois.

Champs : `id` ('ch07'), `numero`, `titre`, `programme`, `resume` (une phrase), `sources`, `objectifs` (ceux du tableau « À l'issue de la leçon »), `sections`, `formules`.

Chaque section a un `id` (court, en minuscules, unique dans le chapitre, ex. 'capacitif', 'relevement' ; ne le change plus ensuite, la sélection du volet et le tri des exercices s'appuient dessus), un `titre` (fidèle au polycopié), un `court` (libellé de 2 à 5 mots affiché dans le volet de gauche, ex. 'Effet capacitif', 'Puissance active P') et ses `blocs`.

Blocs possibles dans `sections[].blocs` (le texte reste fidèle au polycopié) :

| Bloc | Rôle |
|---|---|
| `{ p: '...' }` | paragraphe ; formules entre `$...$` |
| `{ h: '...' }` | sous-titre |
| `{ f: 'V = Z I', cadre: true, unites: '...' }` | formule centrée ; `cadre` pour les relations encadrées du cours |
| `{ liste: [...], ordonnee: true }` | liste (questions d'un exercice, étapes) |
| `{ table: { tetes: [...], lignes: [[...]] } }` | tableau |
| `{ note: '...' }` / `{ alerte: '...' }` | remarque / mise en garde |
| `{ schema: circuit, legende, valeurs: false, source: false, nomSource }` | schéma dessiné automatiquement, avec bouton « Ouvrir dans le laboratoire » |
| `{ fresnel: circuit, legende }` | diagramme de Fresnel d'un circuit |
| `{ reponses: '...' }` | éléments de réponse d'un TD (repliés) |
| `{ html: '...' }` | HTML libre, en dernier recours |

Mini-langage des formules : `frac(a;b)`, `sqrt(a)`, `cx(V)` (grandeur complexe soulignée), `vec(V)`, indices `V_L` ou `R_{eq}`, exposants `I^2`. Écris `&lt;` et `&gt;` pour < et >.

Un circuit s'écrit `{ regime: 'AC' | 'DC', V, f, charge }` avec `K.R(val, 'nom')`, `K.L(...)`, `K.Cap(...)`, `K.serie(...)`, `K.par(...)` (valeurs en Ω, H, F). Un schéma qui ne se réduit pas à des associations série / dérivation d'une source et de dipôles R, L, C (transformateur, triphasé, pont…) ne peut pas être dessiné ainsi : décris-le dans le texte.

`formules` : `{ id, groupe, nom, expr, quand }`. Les `id` sont uniques sur tout le site (ils servent d'aide dans les exercices). N'y mets que des relations présentes dans le cours ; si tu ajoutes un rappel qui n'y figure pas, dis-le à l'utilisateur.

## 4. Étendre le laboratoire et les exercices si le chapitre s'y prête

- **Nouveau calcul sur un schéma** (une grandeur calculable pour un circuit R, L, C) : ajoute une section avec `PE.calculs.ajouter({ id, titre, chapitre, parties, regime, applicable(ctx), rendu(ctx) })` (`parties` : sections du cours dont relève le calcul, sous la forme `'ch07/<id de section>'` ; la section s'affiche dès qu'une est cochée dans le volet) dans `js/calculs.js`, sur le modèle des sections existantes (`ctx.s` est la solution de `PE.circuit.resoudre`).
- **Nouveau type de problème** : ajoute un générateur à `PE.exercices.problemes` dans `js/exercices.js` (`{ id, titre, chapitre, parties, niveau: 1 | 2 | 3, generer() }`), avec des valeurs tirées au hasard et, pour chaque question, `q(texte, valeurSI, unité, [ids de formules], correction)`. Inspire-toi des exercices du TD et vérifie ton générateur avec les éléments de réponse du polycopié.
- **Tri par partie** : `parties` liste les sections du cours que le problème fait travailler, sous la forme `'ch07/<id de section>'`, toujours avec la section du TD. Le problème est proposé dès qu'une de ces parties est cochée dans le volet. Si tu ajoutes des questions aux exercices sur circuit (`questionsAC` / `questionsDC`), passe-leur `{ parties: [...] }` en dernier argument de `q()`. `node outils/test.js` vérifie que chaque partie citée existe.
- Si le chapitre sort du cadre des circuits R, L, C monophasés (triphasé, machines, transformateur…), le moteur `js/circuit.js` ne suffit pas : intègre le cours et les problèmes type TD, et propose à l'utilisateur l'extension du laboratoire au lieu de la bricoler.

## 5. Vérifier

1. Ajoute dans `outils/test.js` une vérification par résultat numérique repris du polycopié (application numérique du cours, éléments de réponse du TD).
2. Lance `node outils/test.js` : tout doit passer.
3. Relance `node outils/nouveaux-cours.js` : il ne doit plus rester de PDF à intégrer (sauf ceux exclus par la consigne).

## 6. Compte rendu

Résume en quelques lignes : chapitres créés ou complétés, formules ajoutées, nouveaux calculs et problèmes, et tout passage illisible ou toute incohérence relevée dans les scans (par exemple un élément de réponse que le calcul ne retrouve pas).
