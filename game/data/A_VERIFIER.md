# À vérifier

Fichier généré par `node game/outils/verifier-donnees.js` : ne pas le modifier à la main.
Pour corriger : modifie le JSON du chapitre (texte, valeur), passe `"à_vérifier"` à `false` et relance le script.

## 1. Passages illisibles, ambigus ou contradictoires (21)

### ch01

- **ch01 annotation 2** (annotation) — `A1-Ch01-p03.pdf`, § 7, sous et sur le schéma de l'exemple
  Sens ambigu : « E⃗ + U⃗ = 0 » contredit le résultat du cours (U = 15,6 V avec E = 10 V). Probablement une remarque orale de la séance. Non utilisée dans le jeu.

### ch02

- **ch02.condensateur-energie** (notion) — `A1-Ch02-p03.pdf`, § 6, expérience 1
  Réponse absente du scan (donnée par la vidéo n°1). À compléter par Romain ; non utilisée dans le jeu tant qu'elle n'est pas validée.
- **ch02.bobine-energie** (notion) — `A1-Ch02-p03.pdf`, § 7 et § 9 ; § 10 sur A1-Ch02-p04.pdf
  Réponses absentes des scans (vidéos n°2, 3 et 4). À compléter par Romain ; non utilisées dans le jeu tant qu'elles ne sont pas validées.
- **ch02.condensateur-duree** (notion) — `A1-Ch02-p03.pdf`, § 8, annotation manuscrite
  Réponse manuscrite ambiguë (« se vide instantanément » : dans quelles conditions ? à travers la lampe ?). Le polycopié renvoie à la vidéo n°1. À confirmer avant de l'utiliser dans le jeu.
- **ch02 annotation 1** (annotation) — `A1-Ch02-p02.pdf`, § 4, loi des nœuds
  « A_t = A1 + A2 + A3 » semble signifier « courant total = somme des courants des branches » (A pour ampères ?). Ce n'est pas la même écriture que Σ i_k = 0. Sens à confirmer ; non utilisé dans le jeu.

### ch04

- **ch04.td-ex3 étape 9** (étape d'exemple) — `A1-Ch04-p02.pdf`, exercice 3 et éléments de réponse
  Erreur probable du corrigé : 85 mA / √2 ≈ 60 mA, pas 49 mA (et la lecture de l'oscillogramme confirme bien I_max ≈ 85 mA).
- **ch04.seuil** (formule) — `A1-Ch04-p03.pdf`, annexe 1, document 2, dernière phrase
  Incohérence du polycopié : 0,38 rad × 180/π ≈ 21,8°, et non 21,5°. Quelle valeur retenir ?
- **ch04.ecriture-temporelle** (formule) — `A1-Ch04-p04.pdf`, annotation manuscrite en bas à droite
  Les deux expressions manuscrites portent le même « + φ » : u et i seraient alors en phase. Il manque l'origine des phases (u ou i) et le signe. Le site a choisi v = V√2 sin(ωt) et i = I√2 sin(ωt − φ) (rappel hors polycopié). À confirmer.
- **ch04 annotation 1** (annotation) — `A1-Ch04-p03.pdf`, bas de page, sous le document 2
  Fraction illisible (peut-être tan φ = Q/P, vue au chapitre 6 ?). Non utilisée dans le jeu.
- **ch04 manque 1** (manque) — `A1-Ch04-p01.pdf`, —
  Scanner la page manquante si elle existe, puis relancer l'extraction du chapitre.

### ch05

- **ch05.td-ex3 étape 4** (étape d'exemple) — `A1-Ch05-p06.pdf`, TD, exercice 3 et éléments de réponse
  Réponse non donnée dans le corrigé. Ambiguïté : « I_max = 1 A » inscrit sur la bobine est-il un courant maximal admissible en valeur efficace, ou une valeur crête (à comparer à 0,72 × √2 ≈ 1,02 A) ?
- **ch05.etats-limites** (notion) — `A1-Ch05-p07.pdf`, exercices supplémentaires A et B (énoncés seulement)
  Hors cours : à valider par Romain (ou par le professeur) avant utilisation dans le jeu.
- **ch05.charge-q** (formule) — `A1-Ch05-p07.pdf`, exercice A, question 4 (énoncé seulement)
  Hors cours : à valider avant utilisation dans le jeu.
- **ch05.energie-c** (formule) — `A1-Ch05-p07.pdf`, exercice A, question 4 (énoncé seulement)
  Hors cours : à valider avant utilisation dans le jeu.
- **ch05.energie-l** (formule) — `A1-Ch05-p07.pdf`, exercice B (énoncé seulement)
  Hors cours : à valider avant utilisation dans le jeu.
- **ch05.tau-rc** (formule) — `A1-Ch05-p07.pdf`, exercice A, question 5 (énoncé seulement)
  Hors cours : à valider avant utilisation dans le jeu.
- **ch05.tau-rl** (formule) — `A1-Ch05-p07.pdf`, exercice B (énoncé seulement)
  Hors cours : à valider avant utilisation dans le jeu.
- **ch05.ex-a-rc** (exemple) — `A1-Ch05-p07.pdf`, exercice A (énoncé)
  Pas de corrigé dans le polycopié : résolution proposée, à faire valider avant utilisation dans le jeu.
- **ch05.ex-b-rl** (exemple) — `A1-Ch05-p07.pdf`, exercice B (énoncé)
  Pas de corrigé dans le polycopié : résolution proposée, à faire valider avant utilisation dans le jeu.

### ch06

- **ch06.ex-probleme étape 6** (étape d'exemple) — `A1-Ch06-p04.pdf`, problématique ; données et questions sur A1-Ch06-p05.pdf
  Données incohérentes dans l'énoncé : sous V_2 = 230 V, R_charge = 1,07 Ω absorbe déjà 230/1,07 ≈ 215 A, plus que les 200 A annoncés en ligne. Le résultat (302 V) applique la méthode aux données telles quelles ; à comparer à la correction du professeur.
- **ch06 manque 1** (manque) — `A1-Ch06-p05.pdf`, travail à effectuer, dernière consigne
  Peut-être l'annexe 1 du ch04 (déphasage) ou un document manquant. À vérifier.

## 2. Compléments hors scan (connaissances générales, signalés) (37)

Ces éléments sont fidèles au scan, mais un détail a été complété (souvent les unités, que le polycopié n'écrit pas).

### ch01

- **ch01.ohm** : unités V, Ω, A : non écrites sur le scan
- **ch01.cond-continu** : unité A : non écrite sur le scan
- **ch01.bob-continu** : unité V : non écrite sur le scan
- **ch01.serie** : unité Ω : non écrite sur le scan ; calcul limité à 3 résistances (le scan écrit « + … »)
- **ch01.derivation** : unité Ω : non écrite sur le scan ; calcul limité à 3 résistances
- **ch01.deux-derivation** : unité Ω : non écrite sur le scan
- **ch01.identiques-derivation** : unité Ω : non écrite sur le scan
- **ch01.generateur** : unités : non écrites sur le scan
- **ch01.recepteur** : unités : non écrites sur le scan
- **ch01.diviseur** : unités : non écrites sur le scan
- **ch01.diviseur-partiel** : unités : non écrites sur le scan

### ch02

- **ch02.resistance** : unités : non écrites sur le scan
- **ch02.condensateur** : unités (A, F, V/s) : non écrites sur le scan
- **ch02.bobine** : unités (V, H, A/s) : non écrites sur le scan
- **ch02.puissance-instantanee** : unités (W, V, A) : non écrites sur le scan
- **ch02.loi-noeuds** : unité A : non écrite sur le scan
- **ch02.loi-mailles** : unité V : non écrite sur le scan

### ch03

- **ch03.efficace** : unités (V, V²) : non écrites sur le scan
- **ch03.decomposition** : unité V : non écrite sur le scan
- **ch03.ex-efficace** : calcul Î/√2 : la relation n'est pas écrite dans ce chapitre (rappel ajouté hors polycopié au ch04)

### ch04

- **ch04.pulsation** : unités (rad/s, Hz) : non écrites
- **ch04.puissance-manuscrit** : unités : non écrites
- **ch04.courant-manuscrit** : unités : non écrites
- **ch04.efficace-sinus** : formule absente des scans : connaissance générale, utilisée implicitement par les éléments de réponse du TD
- **ch04.oscillo** : méthode non écrite dans les scans : connaissance générale nécessaire au TD
- **ch04.piege-sonde** : méthode de lecture hors scan

### ch05

- **ch05.etats-limites** : méthode absente des scans (les exercices A et B n'ont ni cours ni corrigé) ; l'état t → ∞ rejoint le ch01 (condensateur = circuit ouvert, bobine = court-circuit en continu)
- **ch05.zl** : unités H et rad/s : non écrites sur le scan
- **ch05.zc** : unités F et rad/s : non écrites sur le scan
- **ch05.charge-q** : formule absente des scans, nécessaire à l'exercice A
- **ch05.energie-c** : formule absente des scans, nécessaire à l'exercice A
- **ch05.energie-l** : formule absente des scans, nécessaire à l'exercice B
- **ch05.tau-rc** : formule absente des scans ; R_th se calcule comme au ch01 (MET, sources éteintes)
- **ch05.tau-rl** : formule absente des scans ; R_th se calcule comme au ch01 (MET, sources éteintes)
- **ch05.ex-a-rc** : résolution complète faite hors polycopié (aucun corrigé)
- **ch05.ex-b-rl** : résolution complète faite hors polycopié (aucun corrigé)

### ch06

- **ch06.p-inst** : unités : non écrites dans le document 1

