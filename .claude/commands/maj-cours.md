---
description: Intègre au site les nouveaux cours (PDF scannés) déposés dans le dossier Cours
argument-hint: "[consigne facultative, ex. « 2e année » ou « seulement scan0140 à scan0146 »]"
---

Intègre au site de physique électrique les nouveaux polycopiés scannés du dossier `Cours/`.

Consigne éventuelle de l'utilisateur : $ARGUMENTS

**L'utilisateur ne veut rien vérifier lui-même.** Tu travailles du début à la fin sans lui poser de question ni lui demander de valider : les doutes se tranchent avec les règles ci-dessous, les contrôles sont automatiques (scripts) ou faits par une relecture indépendante, et ce qui reste incertain est seulement listé dans le compte rendu final. Le volume peut être important (toute une année de cours) : avance chapitre par chapitre, enregistre chaque étape dans Git, et sache que la commande peut être relancée pour reprendre là où elle s'est arrêtée.

Référence du format : `outils/FORMAT-CHAPITRE.md` (lis-la avant d'écrire). Outils : `node outils/inventaire.js`, `node outils/verifier-chapitre.js <fichier>`, `node outils/test.js`.

## 0. Sauvegarde

`git status`. S'il y a des modifications non enregistrées, enregistre-les d'abord (`git add -A` puis `git commit -m "Sauvegarde avant intégration des cours"`). Lance `node outils/test.js` : s'il échoue avant même de commencer, répare d'abord (c'est souvent un chapitre resté à moitié branché lors d'une séance interrompue : voir étape 5).

## 1. Inventaire des scans

Lance `node outils/inventaire.js`. Il liste les PDF « à inventorier » (jamais lus) et les chapitres « à intégrer » (déjà inventoriés). S'il n'y a rien de nouveau, dis-le et arrête-toi.

Pour chaque PDF à inventorier, ajoute une entrée dans `Cours/inventaire.json` (garde l'ordre alphabétique des fichiers, JSON valide) :

```json
"scan0140.pdf": { "annee": 1, "chapitre": 7, "titre": "Théorème de Thévenin", "type": "cours", "note": "" }
```

- `type` : `problematique`, `cours`, `annexe`, `td`, `exercices`, `corrige` ou `autre`.
- `annee` : celle de la consigne si elle en donne une (« 2e année »), sinon celle de l'en-tête du scan, sinon **1**.
- `chapitre` / `titre` : ceux de l'en-tête. **Une page sans en-tête est la suite du PDF précédent** (même année, même chapitre). Si un scan n'appartient à aucun chapitre (page de garde, sommaire, page blanche, document hors sujet), mets `{ "ignore": true, "note": "page de garde" }`.
- Dans `note`, ce qui servira à la rédaction : « annotations manuscrites », « schéma de pont non dessinable », « suite du TD », « partiellement illisible »…

Lecture : chaque PDF se lit avec l'outil Read (scans, souvent une page par fichier, dans l'ordre des numéros).
- Jusqu'à 15 PDF : lis-les toi-même.
- Au-delà : confie la lecture à des sous-agents (outil Agent, jusqu'à 4 en parallèle), par lots de **12 PDF consécutifs**. Consigne à leur donner : « Lis chacun de ces scans avec l'outil Read : <liste>. Pour chacun, renvoie uniquement une ligne JSON { fichier, annee, chapitre, titre, type, note, suite } en suivant ces règles : <recopie les règles ci-dessus>. Mets "suite": true (et chapitre null) pour une page sans en-tête. Ne modifie aucun fichier. » Puis fusionne : une entrée `suite` prend l'année et le chapitre du PDF qui la précède (éventuellement le dernier du lot précédent).

Relance `node outils/inventaire.js` : plus rien à inventorier, aucune incohérence. Enregistre : `git add Cours/inventaire.json && git commit -m "Inventaire des scans"`.

## 2. Plan

`node outils/inventaire.js --json` donne, pour chaque chapitre à intégrer : son `id`, son fichier, `nouveau` ou `suite` (chapitre existant à compléter), et ses scans dans l'ordre. Traite-les dans cet ordre (année puis numéro). Si la consigne restreint les fichiers, ne traite que ceux-là.

## 3. Rédaction

Pour un chapitre, la rédaction consiste à :
1. lire `outils/FORMAT-CHAPITRE.md`, le modèle `chapitres/ch06.js`, et le fichier du chapitre s'il existe déjà (`suite`) ;
2. lire chacun de ses scans avec Read ;
3. écrire `chapitres/<id>.js` (nouveau) ou le compléter (`suite` : nouvelles sections à la fin avec de nouveaux id, nouvelles formules, PDF ajoutés à `sources` ; ne change ni ne supprime les `id` existants) ;
4. écrire `outils/controles/<id>.js` avec un contrôle par résultat numérique recalculable du polycopié ;
5. lancer `node outils/verifier-chapitre.js chapitres/<id>.js` et corriger jusqu'à « OK ».

Ne modifie **pas** `index.html`, `js/` ni `outils/test.js` à cette étape.

- 1 ou 2 chapitres : fais-le toi-même.
- 3 chapitres ou plus : un sous-agent par chapitre (outil Agent), **4 au plus en même temps**. Consigne : « Tu intègres au site le chapitre <id> (<année>, chapitre <n>, « <titre> », <nouveau|suite>) à partir des scans <liste>. Suis exactement les étapes 1 à 5 suivantes : <recopie-les>. Tu ne modifies que chapitres/<id>.js et outils/controles/<id>.js. Tu ne poses aucune question : en cas de doute, transcris ce qui est sûr et note le doute. Termine par un compte rendu : sections créées (id et titre), formules, schémas non dessinables décrits en texte, passages illisibles ou douteux, écarts entre les réponses du polycopié et tes contrôles, et idées d'exercices ou de calculs de laboratoire tirées du TD. »

## 4. Relecture indépendante (remplace la vérification par l'utilisateur)

Pour chaque chapitre rédigé, un **nouveau** sous-agent (pas celui qui a écrit, jusqu'à 4 en parallèle) relit : « Compare les scans <liste> au fichier chapitres/<id>.js. Vérifie un par un : toutes les parties du polycopié sont présentes et dans l'ordre ; chaque formule encadrée du cours apparaît en `cadre: true` ; chaque valeur numérique, unité et signe est identique au scan ; les questions des TD sont toutes là, avec leurs éléments de réponse ; rien n'a été inventé. Corrige directement chapitres/<id>.js (sans changer les id de section déjà présents), ajoute à outils/controles/<id>.js les contrôles manquants, puis relance node outils/verifier-chapitre.js chapitres/<id>.js jusqu'à OK. Renvoie la liste de tes corrections et des doutes qui restent. » Avec 1 ou 2 chapitres traités par toi-même, fais quand même cette relecture via un sous-agent.

## 5. Branchement et enregistrement, chapitre par chapitre

Pour chaque chapitre relu :
1. nouveau chapitre : ajoute `<script src="chapitres/<id>.js"></script>` dans `index.html`, entre `COURS:DEBUT` et `COURS:FIN`, dans l'ordre (année puis numéro) ;
2. `node outils/test.js` : tout doit passer (corrige sinon) ;
3. `git add -A && git commit -m "Cours : <1re année|2e année>, chapitre <n> — <titre>"`.

## 6. Laboratoire et exercices

Une fois tous les chapitres branchés, reprends un par un ceux qui s'y prêtent (idées remontées aux étapes 3 et 4) et suis la partie « Laboratoire et exercices » de `outils/FORMAT-CHAPITRE.md`. Fais-le toi-même, séquentiellement (ces fichiers sont partagés). Après chaque chapitre : `node outils/test.js`, puis commit « Exercices : chapitre <n> ». Priorité : les problèmes type TD (un par exercice de TD bien posé), puis les calculs de laboratoire.

## 7. Contrôle final et compte rendu

1. `node outils/inventaire.js` : plus rien à inventorier ni à intégrer, aucune incohérence. `node outils/test.js` : tout passe.
2. Ajoute en tête de `Cours/journal.md` (crée-le s'il n'existe pas) une entrée datée : chapitres créés ou complétés, nombre de scans, scans ignorés et pourquoi, exercices et calculs ajoutés, et la liste des doutes (passages illisibles, écarts de valeurs, schémas décrits en texte, rappels ajoutés hors cours). Commit « Journal d'intégration ».
3. Compte rendu à l'utilisateur, court : ce qui a été intégré, ce qui est désormais disponible sur le site, et les doutes à garder en tête en révisant (sans lui demander de les vérifier).
