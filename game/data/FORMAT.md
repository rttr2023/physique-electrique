# Format des données du jeu (`game/data/chNN.json`)

Un fichier par chapitre. Le moteur du jeu lit ces fichiers : **ajouter un chapitre = ajouter un JSON**
(et l'ajouter à `game/data/index.json`). Vérification : `node game/outils/verifier-donnees.js`.

Contenu tiré des scans de `Cours/` (jamais modifiés). Rien n'est inventé : tout ce qui ne vient pas
directement d'un scan est signalé (voir « Traçabilité »).

## Racine

| Champ | Contenu |
|---|---|
| `id`, `annee`, `numero`, `titre` | identiques à `chapitres/<id>.js` du site |
| `sources` | liste des scans du chapitre |
| `notions` | notions clés (définitions courtes) |
| `formules` | formules du cours |
| `relations` | liens entre formules (dans le chapitre ou vers un autre) |
| `pieges` | pièges classiques |
| `exemples` | exemples et exercices du cours ou du TD, avec leur résolution |
| `annotations_manuscrites` | facultatif : notes à la main du scan qui ne trouvent pas leur place ailleurs (`{ texte, ...traçabilité }`) |
| `manques` | facultatif : parties du cours absentes des scans (même forme) |

## Traçabilité (présente sur **chaque** élément)

| Champ | Contenu |
|---|---|
| `source` | `{ "fichier": "A1-Ch01-p02.pdf", "page": 1, "zone": "§ 4" }` (chaque PDF fait une page) |
| `origine` | `"scan"` : texte imprimé du polycopié · `"manuscrit"` : annotation à la main sur le scan · `"déduit"` : reformulation, rapprochement ou calcul fait à partir du scan, sans connaissance extérieure · `"hors_cours"` : absent des scans, ajouté avec des connaissances générales (expliqué dans `ajouts`) |
| `ajouts` | liste (souvent vide) de ce qui a été complété **hors scan**, avec des connaissances générales. Ex. : `"unités : non écrites sur le scan"` |
| `à_vérifier` | `true` si le passage est illisible, ambigu ou contradictoire ; la raison est dans `note` |
| `note` | facultatif : précision, doute, écart avec le polycopié |

Les éléments `à_vérifier` et les `ajouts` sont repris dans `game/data/A_VERIFIER.md`.

## Notion

`{ id, nom, definition, ...traçabilité }` — `id` unique sur tout le jeu, préfixé par le chapitre (`ch01.regime-continu`).

## Formule

```json
{
  "id": "ch01.deux-derivation",
  "site_id": "ch01Deux",
  "nom": "2 résistances en dérivation",
  "latex": "R_{eq} = \\dfrac{R_1 \\times R_2}{R_1 + R_2}",
  "variables": [
    { "symbole": "R_{eq}", "code": "Req", "signification": "résistance équivalente", "unite": "Ω" }
  ],
  "conditions": "Uniquement pour deux résistances en dérivation.",
  "calcul": { "cible": "Req", "expression": "R1*R2/(R1+R2)" },
  "source": { ... }, "origine": "scan", "ajouts": [], "à_vérifier": false
}
```

- `latex` : écriture KaTeX. `symbole` d'une variable : LaTeX aussi.
- `code` : nom de la variable dans `calcul.expression` (lettres, chiffres, `_`).
- `unite` : symbole SI (`V`, `A`, `Ω`, `W`, `F`, `H`, `s`, `Hz`, `rad/s`, `°`, `rad`, `VAR`, `VA`, `""` si sans unité).
- `calcul` (facultatif) : expression JavaScript de la grandeur `cible` en fonction des autres `code`
  (`Math.sqrt`, `Math.cos`… autorisés, angles en radians). Absente si la formule n'est pas un calcul
  (ex. `I = 0`, énoncé d'une méthode). C'est une simple réécriture de la formule du scan.
- `site_id` : `id` de la même formule dans `chapitres/<id>.js` (ou `null`).

## Relation

`{ de, vers, type, explication, ...traçabilité }` — `type` : `cas_particulier` (de est un cas particulier de vers),
`découle_de`, `utilise`, `équivalent`, `même_grandeur`. `de` / `vers` : `id` de formule ou de notion.

## Piège

`{ id, texte, lie_a: [ids], ...traçabilité }`

## Exemple

```json
{
  "id": "ch01.ex-superposition",
  "titre": "...",
  "type": "exemple_cours" | "td",
  "enonce": "texte, formules entre $...$",
  "donnees": [{ "code": "R", "symbole": "R", "valeur": 50, "unite": "Ω" }],
  "etapes": [{ "question": "...", "formules": ["ch01.diviseur"], "reponse": { "valeur": 6.25, "unite": "V", "texte": "U' = 6,25 V" } }],
  ...traçabilité
}
```

`reponse.valeur` est en unité SI de base (6,25 V → `6.25` ; 49 mA → `0.049`). Quand le corrigé du
polycopié est faux, on garde sa valeur dans `reponse.texte`, on met `à_vérifier: true` sur l'étape et on
explique l'écart dans `note`.
