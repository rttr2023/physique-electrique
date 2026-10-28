# Journal d'intégration des cours

## 2026-10-28 — 1re année, chapitres 1 à 4 (photos)

15 photos de polycopiés converties en PDF (`outils/scanner.py`), puis renommées `A1-Ch01-p01.pdf` … `A1-Ch04-p04.pdf`. Aucun scan ignoré.

Les scans déjà présents (`scan0118` à `scan0133`) ont aussi été renommés `A1-Ch05-…` et `A1-Ch06-…`. Leur ancien nom reste dans `inventaire.json` (champ `origine`).

**Chapitres créés**

| Chapitre | Titre | Scans | Sections |
|---|---|---|---|
| ch01 | Le cas particulier du régime continu | 4 | 7 |
| ch02 | Les régimes variables quelconques | 4 | 11 |
| ch03 | Mesure de tension | 3 | 7 (documents 1 à 7) |
| ch04 | Le déphasage courant/tension en régime sinusoïdal | 4 | Annexe 1 (documents 1 à 4), puis le TD |

**Exercices ajoutés**

- Problème « Principe de superposition » (ch01, niveau 2), sur le modèle de l'exemple du cours.
- Problème « Lecture d'un oscillogramme » (ch04, niveau 2), sur le modèle des exercices 2 et 3 du TD. L'oscillogramme est dessiné ; les réglages du TD font partie des tirages possibles.

**Doutes**

- ch04, TD, exercice 3, question 5 : le polycopié donne I = 49 mA. Or Imax = 85 mA, donc I = 85/√2 ≈ 60 mA. Probable erreur du corrigé ; une note le signale dans le TD.
- ch04, document 2 : 0,38 rad vaut 21,8° et non 21,5°, comme écrit dans le polycopié. Une note le signale.
- ch04 : la page d'ouverture du chapitre (problématique, objectifs) n'a pas été photographiée. Rien n'a été écrit pour la remplacer.
- ch04 : quatre rappels hors polycopié ont été ajoutés pour le TD, dans le groupe « Rappels (ajoutés, hors polycopié) » de la fiche :
  - f = 1/T et ω = 2πf ;
  - V = Vmax/√2 ;
  - écriture algébrique ;
  - lecture d'oscillogramme.
- ch01, étape 1 de la superposition : le polycopié écrit « U′ = 6,25A ». C'est une tension : transcrit 6,25 V, avec une note.
- ch01, § 5 : les relations encadrées U = E ∓ RI notent R la résistance que les schémas notent r. Une note le signale.
- ch02, tableau du § 2 : « u = ri » pour une résistance notée R. Une note le signale.
- ch02, expérience 2 : le rôle de la diode (bloquée tant que l'interrupteur est fermé) est une interprétation du site, signalée comme telle.
- ch02, questions 6 à 10 : leurs réponses viennent des vidéos et ne sont pas rédigées dans le polycopié.
- ch03, document 5 : u = <u> + u_ond est une mise en équation de la figure, signalée comme reformulation.
- ch03, document 4 : le tableau récapitulatif a été ajouté par le site ; il ne reprend que le texte du document.

**Schémas décrits en texte** (le moteur de dessin ne gère ni source de courant, ni diode, ni lampe, ni interrupteur, ni deux vecteurs libres) :

- ch01 : modèle équivalent de Thévenin, conventions générateur/récepteur, montage de superposition ;
- ch02 : expériences 1 à 4 ;
- ch03 : formes d'onde des documents 1, 2 et 5 ;
- ch04 : oscillogrammes du document 1, figure du document 4, représentations de Fresnel et oscillogrammes du TD.

**Pistes pour le laboratoire** (non réalisées)

- Sources de courant et circuits à plusieurs sources dans `js/circuit.js`, pour la superposition et le modèle équivalent de Thévenin.
- Bloc `fresnel` acceptant deux vecteurs libres (module, angle), pour l'exercice 1 du TD du ch04.
- Générateur de signaux qui affiche la valeur moyenne, la valeur efficace et l'ondulation (ch03).
