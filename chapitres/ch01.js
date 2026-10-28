// CH01 — Le cas particulier du régime continu
// Transcription des scans listés dans `sources`. Format des blocs : voir outils/FORMAT-CHAPITRE.md
(function (PE) {
  const K = PE.circuit;

  PE.ajouterCours({
    id: 'ch01',
    annee: 1,
    numero: 1,
    titre: 'Le cas particulier du régime continu',
    programme: '',
    resume: 'Relations courant/tension en continu, associations de résistances, modèle de Thévenin, loi d\'Ohm d\'un dipôle actif, diviseur de tension et principe de superposition.',
    sources: ['A1-Ch01-p01.pdf', 'A1-Ch01-p02.pdf', 'A1-Ch01-p03.pdf', 'A1-Ch01-p04.pdf'],
    objectifs: [],
    sections: [
      {
        id: 'definition',
        titre: '1. Qu\'est-ce que le régime continu ?',
        court: 'Le régime continu',
        blocs: [
          { p: 'Le régime continu n\'est qu\'un cas particulier des régimes variables quelconques. Les valeurs instantanées y sont constantes au cours du temps.' },
          { p: 'Toutes les lois et relations établies en régime variable s\'appliquent donc à ce régime.' },
          { p: 'Seule l\'écriture change : on utilise des <strong>majuscules</strong> pour distinguer ce régime particulier.' }
        ]
      },
      {
        id: 'dipoles',
        titre: '2. Que deviennent les relations courant/tension pour les dipôles de base ?',
        court: 'Dipôles de base en continu',
        blocs: [
          { p: 'Sur les schémas du tableau, le courant $I$ et la tension $U$ sont fléchés en sens opposés (convention récepteur).' },
          {
            table: {
              tetes: ['Dipôles', 'Relation tension-courant', 'Commentaires'],
              lignes: [
                ['Purement résistif (résistance $R$)', '$U = R I$', 'Aucun changement pour la résistance. On retrouve la loi d\'Ohm pour une résistance.'],
                ['Purement capacitif (condensateur $C$)', 'La valeur de $u$ étant constante, sa dérivée $frac(du;dt)$ est nulle. Et donc la relation $i = C frac(du;dt)$ devient : $I = 0$', 'Un condensateur est équivalent à un <strong>circuit ouvert</strong> en régime continu (schéma : circuit ouvert, $I = 0$, tension $U$ fléchée entre ses bornes).'],
                ['Purement inductif (bobine $L$)', 'La valeur de $i$ étant constante, sa dérivée $frac(di;dt)$ est nulle. Et donc la relation $u = L frac(di;dt)$ devient : $U = 0$', 'Une inductance est équivalente à un <strong>court-circuit</strong> (un fil) en régime continu (schéma : un fil parcouru par le courant $I$, $U = 0$).']
              ]
            }
          },
        ]
      },
      {
        id: 'associations',
        titre: '3. Quelles sont les relations d\'associations de résistances ?',
        court: 'Associations de résistances',
        blocs: [
          { h: 'Association série' },
          { p: 'Des résistances sont associées en série si elles sont traversées par le même courant. On a alors :' },
          { f: 'R_{eq} = R_1 + R_2 + R_3 + …', cadre: true },
          { h: 'Association en dérivation' },
          { p: 'Des résistances sont associées en dérivation si elles sont soumises à la même tension. On a alors :' },
          { f: 'frac(1;R_{eq}) = frac(1;R_1) + frac(1;R_2) + frac(1;R_3) + …', cadre: true },
          { h: 'Cas particuliers fréquemment rencontrés' },
          { p: '2 résistances en dérivation :' },
          { f: 'R_{eq} = frac(R_1 × R_2;R_1 + R_2)', cadre: true },
          { p: '$n$ résistances identiques en dérivation :' },
          { f: 'R_{eq} = frac(R;n)', cadre: true }
        ]
      },
      {
        id: 'thevenin',
        titre: '4. Qu\'est-ce que le modèle équivalent de Thévenin (MET) pour un dipôle actif ?',
        court: 'Modèle de Thévenin (MET)',
        blocs: [
          { p: 'Les dipôles actifs sont les dipôles pouvant fonctionner en générateur (panneaux solaires, piles…). Certains sont réversibles et peuvent fonctionner en générateur et en récepteur (batteries, MCC…).' },
          { p: 'Ils peuvent être modélisés par leur MET : le dipôle actif vu entre ses bornes A et B est équivalent à une source de tension $E_{TH}$ en série avec une résistance $R_{TH}$, placées entre A et B.' },
          { note: 'Schéma du polycopié (non dessinable automatiquement) : à gauche, un rectangle « Dipôle actif » avec deux bornes A et B ; signe ≡ ; à droite, une source de tension $E_{TH}$ dont une borne est reliée à A à travers la résistance $R_{TH}$ et l\'autre directement à B.' },
          { p: '<strong>Détermination de $E_{TH}$</strong> : $E_{TH}$ est égale à la tension entre les points A et B lorsque le dipôle (D) est déconnecté (tension à vide).' },
          { p: '<strong>Détermination de $R_{TH}$</strong> : une résistance interne $R_{TH}$ égale à la résistance équivalente vue des points A et B lorsque toutes les sources sont éteintes.' },
          { p: 'En pratique :' },
          { liste: [
            'pour éteindre une source de tension sur un schéma, on la remplace par un <strong>court-circuit</strong> ;',
            'pour éteindre une source de courant sur un schéma, on la remplace par un <strong>circuit ouvert</strong>.'
          ] }
        ]
      },
      {
        id: 'ohm-actif',
        titre: '5. Qu\'est-ce que la loi d\'Ohm pour un dipôle actif ?',
        court: 'Loi d\'Ohm d\'un dipôle actif',
        blocs: [
          { p: 'On peut distinguer deux cas.' },
          { h: 'Générateur de fem E et de résistance interne r' },
          { p: 'Le générateur (symbole de pile noté $E, r$) est équivalent à une source de tension $E$ en série avec une résistance $r$. En convention générateur, $I$ et $U$ sont fléchés dans le même sens ; la tension $E$ est fléchée dans le sens de $U$ et la tension $rI$ en sens opposé.' },
          { p: 'En convention générateur :' },
          { f: 'U = E − R I', cadre: true },
          { h: 'Récepteur de fem E et de résistance interne r' },
          { p: 'Même modèle (source $E$ en série avec $r$), mais en convention récepteur : $I$ et $U$ sont fléchés en sens opposés ; $E$ et $rI$ sont fléchées dans le sens de $U$.' },
          { p: 'En convention récepteur :' },
          { f: 'U = E + R I', cadre: true },
          { note: 'Les relations encadrées du polycopié sont écrites avec $R$ alors que la résistance interne est notée $r$ sur les schémas : il s\'agit de la même grandeur ($U = E − rI$ et $U = E + rI$).' }
        ]
      },
      {
        id: 'diviseur',
        titre: '6. Qu\'est-ce que le diviseur de tension ?',
        court: 'Diviseur de tension',
        blocs: [
          { p: 'Il s\'utilise pour le calcul de tension <strong>exclusivement</strong> aux bornes de résistances en série. La relation du diviseur s\'obtient de la manière suivante :' },
          { f: 'tension aux bornes d\'une partie d\'un groupement de résistances en série = frac(somme des résistances de cette partie;somme totale des résistances du groupement) × tension aux bornes de l\'ensemble du groupement de résistance', cadre: true },
          { h: 'Exemple' },
          { p: 'Trois résistances $R_1$, $R_2$, $R_3$ en série sont soumises à la tension $E$. $U$ est la tension aux bornes de $R_1$, $V$ celle aux bornes de $R_2$ et $R_3$, $W$ celle aux bornes de $R_3$.' },
          { schema: { regime: 'DC', V: 12, charge: K.serie(K.R(100, 'R1'), K.R(100, 'R2'), K.R(100, 'R3')) }, legende: 'Diviseur de tension : R₁, R₂, R₃ en série sous la tension E', valeurs: false, nomSource: 'E' },
          { f: 'U = frac(R_1;R_1 + R_2 + R_3) × E' },
          { f: 'V = frac(R_2 + R_3;R_1 + R_2 + R_3) × E' },
          { f: 'W = frac(R_3;R_1 + R_2 + R_3) × E' },
          { f: 'W = frac(R_3;R_2 + R_3) × V' }
        ]
      },
      {
        id: 'superposition',
        titre: '7. Qu\'est-ce que le principe de superposition ?',
        court: 'Principe de superposition',
        blocs: [
          { p: 'C\'est un principe qui est très utile lorsque l\'on veut calculer une tension ou une intensité de courant dans un circuit comportant plusieurs sources.' },
          { alerte: '<strong>Énoncé</strong> : l\'intensité du courant obtenue dans une branche donnée d\'un circuit linéaire soumis à plusieurs sources indépendantes est égale à la somme algébrique des intensités de courant obtenues dans cette branche lorsque chacune de ces sources agit isolément, les autres sources étant éteintes. Il en est de même pour le calcul d\'une tension.' },
          { h: 'Exemple' },
          { p: 'On veut calculer la valeur de la tension $U$ du montage ci-dessous. Données : $R$ = 50 Ω ; $R_1$ = $R_2$ = 30 Ω ; $E$ = 10 V et $I$ = 0,5 A. Comme il comporte plusieurs sources, le théorème de superposition est le moyen le plus efficace pour effectuer ce calcul.' },
          { note: 'Schéma du polycopié (non dessinable automatiquement, il contient une source de courant) : trois branches en dérivation entre deux fils horizontaux. Branche de gauche : source de tension $E$ (fléchée vers le haut) en série avec $R_1$. Branche du milieu : source de courant $I$ (débitant vers le haut) en série avec $R_2$. Branche de droite : résistance $R$, dont la tension $U$ est fléchée vers le haut (borne + en haut).' },
          { h: 'Étape n°1' },
          { p: 'On éteint toutes les sources sauf la source de tension $E$. Cela donne le schéma ci-dessous (la source de courant $I$ est remplacée par un circuit ouvert, la résistance $R_2$ n\'étant alors traversée par aucun courant peut être supprimée du schéma).' },
          { schema: { regime: 'DC', V: 10, charge: K.serie(K.R(30, 'R1'), K.R(50, 'R')) }, legende: 'Étape 1 : E seule, R₁ en série avec R (U′ aux bornes de R)', nomSource: 'E' },
          { p: 'En utilisant le diviseur de tension on obtient :' },
          { f: 'U′ = frac(R;R + R_1) E = frac(50;50 + 30) × 10 = 6,25 V' },
          { note: 'Le polycopié écrit « U′ = 6,25 A » : il s\'agit d\'une tension, l\'unité est le volt.' },
          { h: 'Étape n°2' },
          { p: 'On éteint toutes les sources sauf la source de courant $I$. Cela donne le schéma ci-dessous (la source de tension $E$ est remplacée par un court-circuit).' },
          { note: 'Schéma du polycopié (non dessinable automatiquement, il contient une source de courant) : le montage initial où la source $E$ est remplacée par un fil ; trois branches en dérivation : $R_1$ seule, la source de courant $I$ (débitant vers le haut) en série avec $R_2$, et $R$, dont la tension $U″$ est fléchée vers le haut.' },
          { p: '$R_1$ et $R$ sont alors en parallèle. On peut calculer la résistance équivalente :' },
          { f: 'R_{eq} = frac(R × R_1;R + R_1) = frac(50 × 30;50 + 30) = 18,75 Ω' },
          { p: 'On peut alors remplacer $R$ et $R_1$ par $R_{eq}$ sur le schéma précédent : la source de courant $I$ (en série avec $R_2$) débite directement dans $R_{eq}$. On en déduit que :' },
          { f: 'U″ = R_{eq} × I = 18,75 × 0,5 = 9,38 V' },
          { h: 'Étape n°3' },
          { p: 'On en déduit $U$ en additionnant les résultats des premières étapes :' },
          { f: 'U = U′ + U″ = 6,25 + 9,38 = 15,6 V' }
        ]
      }
    ],
    formules: [
      { id: 'ch01Ohm', groupe: 'Dipôles en continu', nom: 'Loi d\'Ohm (résistance)', expr: 'U = R I', quand: 'Convention récepteur. Majuscules : grandeurs continues.' },
      { id: 'ch01CondDC', groupe: 'Dipôles en continu', nom: 'Condensateur en continu', expr: 'I = 0', quand: 'Équivalent à un circuit ouvert ($i = C frac(du;dt)$ avec $u$ constante).' },
      { id: 'ch01BobDC', groupe: 'Dipôles en continu', nom: 'Bobine en continu', expr: 'U = 0', quand: 'Équivalente à un court-circuit ($u = L frac(di;dt)$ avec $i$ constant).' },
      { id: 'ch01Serie', groupe: 'Associations de résistances', nom: 'Résistances en série', expr: 'R_{eq} = R_1 + R_2 + R_3 + …', quand: 'Résistances traversées par le même courant.' },
      { id: 'ch01Deriv', groupe: 'Associations de résistances', nom: 'Résistances en dérivation', expr: 'frac(1;R_{eq}) = frac(1;R_1) + frac(1;R_2) + frac(1;R_3) + …', quand: 'Résistances soumises à la même tension.' },
      { id: 'ch01Deux', groupe: 'Associations de résistances', nom: '2 résistances en dérivation', expr: 'R_{eq} = frac(R_1 × R_2;R_1 + R_2)', quand: '« Produit sur somme », uniquement pour deux résistances.' },
      { id: 'ch01Ident', groupe: 'Associations de résistances', nom: 'n résistances identiques en dérivation', expr: 'R_{eq} = frac(R;n)', quand: 'n résistances de même valeur R.' },
      { id: 'ch01Thevenin', groupe: 'Dipôles actifs', nom: 'Modèle équivalent de Thévenin', expr: 'E_{TH} en série avec R_{TH}', quand: '$E_{TH}$ : tension à vide entre A et B. $R_{TH}$ : résistance vue de A et B, sources éteintes (tension → court-circuit, courant → circuit ouvert).' },
      { id: 'ch01Gene', groupe: 'Dipôles actifs', nom: 'Générateur (convention générateur)', expr: 'U = E − r I', quand: 'fem E, résistance interne r.' },
      { id: 'ch01Recep', groupe: 'Dipôles actifs', nom: 'Récepteur (convention récepteur)', expr: 'U = E + r I', quand: 'fem E, résistance interne r.' },
      { id: 'ch01Diviseur', groupe: 'Méthodes', nom: 'Diviseur de tension', expr: 'U = frac(R_1;R_1 + R_2 + R_3) × E', quand: 'Exclusivement pour des résistances en série : somme des résistances de la partie sur somme totale, fois la tension totale.' },
      { id: 'ch01Superposition', groupe: 'Méthodes', nom: 'Principe de superposition', expr: 'U = U′ + U″', quand: 'Circuit linéaire à plusieurs sources : chaque source agit seule, les autres éteintes, puis somme algébrique.' }
    ]
  });
})(typeof window !== 'undefined' ? window.PE : globalThis.PE);
