# Format d'un chapitre

Référence pour écrire ou compléter un chapitre du site à partir des polycopiés scannés. Modèles à imiter : `chapitres/ch05.js` (cours avec schémas et TD) et `chapitres/ch06.js` (documents et annexes).

## Fichier et identifiant

Un chapitre = un fichier `chapitres/<id>.js` qui appelle `PE.ajouterCours({...})`.

| Année | `id` et nom de fichier | Exemple |
|---|---|---|
| 1re année | `chNN` (numéro sur deux chiffres) | `ch07` → `chapitres/ch07.js` |
| 2e année | `a2-chNN` | `a2-ch03` → `chapitres/a2-ch03.js` |

`node outils/inventaire.js` donne l'id et le fichier attendus pour chaque chapitre à intégrer.

## Champs du chapitre

| Champ | Contenu |
|---|---|
| `id` | voir ci-dessus |
| `annee` | 1, 2… |
| `numero` | numéro du chapitre (nombre) |
| `titre` | titre du polycopié |
| `programme` | référence du programme si elle figure dans l'en-tête (ex. 'A.1.2 Circuit en régime sinusoïdal'), sinon '' |
| `resume` | une phrase qui dit à quoi sert le chapitre |
| `sources` | **tous** les PDF intégrés, dans l'ordre (sinon ils seront redétectés) |
| `objectifs` | ceux du tableau « À l'issue de la leçon » ; `[]` s'il n'y en a pas |
| `sections` | voir ci-dessous |
| `formules` | voir ci-dessous |

## Sections

Une section par grande partie du polycopié (problématique, chaque paragraphe numéroté ou document, chaque annexe, le TD, les exercices supplémentaires), dans l'ordre du polycopié.

- `id` : court, minuscules, chiffres et tirets (ex. 'capacitif', 'relevement', 'td'). Unique dans le chapitre. **Ne le change jamais une fois publié** : la sélection du volet et le tri des exercices s'appuient dessus. Pour compléter un chapitre, ajoute de nouvelles sections avec de nouveaux id.
- `titre` : fidèle au polycopié (ex. '3. Qu\'est-ce que l\'effet capacitif ?').
- `court` : 2 à 5 mots pour le volet de gauche (ex. 'Effet capacitif', 'Puissance active P'), 40 caractères au plus.
- `blocs` : le contenu.

## Blocs

Le texte reste fidèle au polycopié : on transcrit, on n'invente pas. Les annotations manuscrites utiles (réponses, compléments du professeur) sont intégrées comme du texte normal, ou en `note` si elles complètent le cours.

| Bloc | Rôle |
|---|---|
| `{ p: '...' }` | paragraphe ; formules entre `$...$` |
| `{ h: '...' }` | sous-titre |
| `{ f: 'V = Z I', cadre: true, unites: '...' }` | formule centrée ; `cadre` pour les relations encadrées du cours |
| `{ liste: [...], ordonnee: true }` | liste (questions d'un exercice, étapes) |
| `{ table: { tetes: [...], lignes: [[...]] } }` | tableau (chaque ligne a autant de cases que d'en-têtes) |
| `{ note: '...' }` / `{ alerte: '...' }` | remarque / mise en garde |
| `{ schema: circuit, legende, valeurs: false, source: false, nomSource }` | schéma dessiné automatiquement, avec bouton « Ouvrir dans le laboratoire » |
| `{ fresnel: circuit, legende }` | diagramme de Fresnel d'un circuit |
| `{ reponses: '...' }` | éléments de réponse d'un TD (repliés) |
| `{ html: '...' }` | HTML libre, en dernier recours |

Mini-langage des formules : `frac(a;b)`, `sqrt(a)`, `cx(V)` (grandeur complexe soulignée), `vec(V)`, indices `V_L` ou `R_{eq}`, exposants `I^2`. Écris `&lt;` et `&gt;` pour < et >. Dans les chaînes JavaScript entre apostrophes, échappe les apostrophes : `'l\'effet'`.

Un circuit s'écrit `{ regime: 'AC' | 'DC', V, f, charge }` avec `K.R(val, 'nom')`, `K.L(...)`, `K.Cap(...)`, `K.serie(...)`, `K.par(...)` (valeurs en Ω, H, F ; `const K = PE.circuit;` en tête du fichier). Un schéma qui ne se réduit pas à des associations série / dérivation d'une source et de dipôles R, L, C (transformateur, triphasé, pont, diode, moteur, oscillogramme…) ne peut pas être dessiné : décris-le précisément dans le texte (éléments, branchements, grandeurs fléchées) et signale-le dans ton compte rendu.

## Formules

`formules: [{ id, groupe, nom, expr, quand }]` : la fiche résumé du chapitre. Les `id` sont **uniques sur tout le site** (ils servent d'aide dans les exercices) : préfixe-les si besoin (ex. 'ch07Thevenin'). N'y mets que des relations présentes dans le cours ; un rappel qui n'y figure pas doit être signalé dans le compte rendu.

## Contrôles numériques : `outils/controles/<id>.js`

Pour chaque résultat numérique du polycopié qu'on peut recalculer (application numérique du cours, éléments de réponse du TD), ajoute une vérification. Modèle : `outils/controles/ch05.js`.

```js
// CH07 — résultats numériques repris du polycopié.
module.exports = function (PE, proche, vrai) {
  const K = PE.circuit;
  const s = K.resoudreAC({ regime: 'AC', V: 230, f: 50, charge: K.serie(K.R(12, 'r'), K.L(1.1, 'L')) });
  proche('cours : impédance de la bobine', s.Zmod, 346);          // tolérance 1 % par défaut
  proche('TD ex 2 : courant', 230 / 47.1, 4.88, 0.02);            // calcul direct, tolérance 2 %
};
```

Hors circuits R, L, C, recalcule directement avec les formules du chapitre (`proche(nom, calculé, attendu, tolérance)`). Un élément de réponse du polycopié que le calcul ne retrouve pas n'est pas « corrigé » en douce : garde la valeur du polycopié dans le cours et signale l'écart.

## Vérifier

- `node outils/verifier-chapitre.js chapitres/<id>.js` : structure, rendu des formules et des schémas, unicité des id, cohérence avec l'inventaire, contrôles numériques. Fonctionne avant que le chapitre soit branché dans `index.html`.
- `node outils/test.js` : tout le site (une fois le chapitre branché).

## Laboratoire et exercices

- **Nouveau calcul sur un schéma** (une grandeur calculable pour un circuit R, L, C) : section `PE.calculs.ajouter({ id, titre, chapitre, parties, regime, applicable(ctx), rendu(ctx) })` dans `js/calculs.js`, sur le modèle des sections existantes (`ctx.s` est la solution de `PE.circuit.resoudre`).
- **Nouveau type de problème** : générateur dans `PE.exercices.problemes` (`js/exercices.js`) : `{ id, titre, chapitre, parties, niveau: 1 | 2 | 3, generer() }`, avec des valeurs tirées au hasard et, pour chaque question, `q(texte, valeurSI, unité, [ids de formules], correction)`. S'inspirer des exercices du TD et vérifier le générateur avec les éléments de réponse du polycopié.
- **Tri par partie** : `parties` liste les sections du cours travaillées, sous la forme `'<id du chapitre>/<id de section>'` (ex. `'ch07/thevenin'`), toujours avec la section du TD pour un problème. L'élément est proposé dès qu'une de ces parties est cochée dans le volet. Les questions ajoutées à `questionsAC` / `questionsDC` reçoivent `{ parties: [...] }` en dernier argument de `q()`.
- Hors du cadre des circuits R, L, C monophasés (triphasé, machines, transformateur…), le moteur `js/circuit.js` ne suffit pas : intégrer le cours et des problèmes type TD calculés directement, et noter l'extension du laboratoire comme piste dans le compte rendu au lieu de la bricoler.
