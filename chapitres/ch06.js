// CH06 — Les puissances en régime sinusoïdal
// Transcription des scans listés dans `sources`. Format des blocs : voir .claude/commands/maj-cours.md
(function (PE) {
  const K = PE.circuit;

  PE.ajouterCours({
    id: 'ch06',
    annee: 1,
    numero: 6,
    titre: 'Les puissances en régime sinusoïdal',
    programme: 'A.1.2 Circuits en régime sinusoïdal (permanent, monophasé)',
    resume: 'Puissances active, réactive et apparente, facteur de puissance et son relèvement, théorème et méthode de Boucherot.',
    sources: ['scan0125.pdf', 'scan0126.pdf', 'scan0127.pdf', 'scan0128.pdf', 'scan0129.pdf', 'scan0130.pdf', 'scan0131.pdf', 'scan0132.pdf', 'scan0133.pdf'],
    objectifs: [
      'Connaître les noms, les expressions et les unités des puissances p, P, Q et S',
      'Connaître la relation entre P, Q et S',
      'Savoir calculer Q connaissant P et le facteur de puissance',
      'Connaître les différentes relations des puissances P et Q pour une résistance, une inductance pure et un condensateur',
      'Savoir dans quel cas on utilise une des précédentes relations plutôt qu\'une autre',
      'Connaître le théorème de Boucherot',
      'Savoir utiliser la méthode de Boucherot pour déterminer une valeur efficace de tension ou de courant dans une installation'
    ],
    sections: [
      {
        id: 'probleme',
        titre: 'Problématique : dimensionnement des installations électriques',
        court: 'Problématique : dimensionnement',
        blocs: [
          { p: 'On doit alimenter, à partir d\'une source sinusoïdale de fréquence 50 Hz, le primaire d\'un transformateur se situant à 500 m. Le schéma équivalent tient compte des imperfections de la ligne (impédance de ligne $r$, $l$) et du transformateur ($R$ en série, puis $R_f$, $L$ et $R_{charge}$ en dérivation).' },
          { schema: { regime: 'AC', V: 302, f: 50, charge: K.serie(K.R(0.07, 'r'), K.L(1e-4, 'l'), K.R(0.2, 'R'), K.par(K.R(605, 'Rf'), K.L(0.28, 'L'), K.R(1.07, 'Rch'))) }, legende: 'Ligne + schéma équivalent du transformateur', nomSource: 'V₁', source: false },
          { p: 'On veut obtenir aux bornes du primaire du transformateur une tension de valeur efficace $V_2$ = 230 V lorsque celui-ci est en charge. Sachant que le courant en ligne sera de 200 A, on cherche la valeur efficace de la tension $V_1$ qu\'il faudra appliquer, sans passer par un calcul fastidieux.' },
          { p: 'Données — ligne : $r$ = 0,14 mΩ/m ; $l$ = 2·10⁻⁷ H/m ; longueur 500 m. Transformateur : $R$ = 0,2 Ω ; $L$ = 0,28 H ; $R_f$ = 605 Ω ; $R_{charge}$ = 1,07 Ω. $V_2$ = 230 V ; $I$ = 200 A ; $f$ = 50 Hz.' },
          { liste: ['2.1 Calculer la résistance $r$ et l\'inductance $l$ de la ligne.', '2.2 En utilisant la méthode de Boucherot, calculer $V_1$.'] },
          { note: 'Question subsidiaire : la section de la ligne a été dimensionnée uniquement en fonction de l\'ampérage. Dans la pratique, comment dimensionne-t-on cette section pour éviter une telle chute de tension ?' },
          {
            reponses: 'Ligne : r = 0,14·10⁻³ × 500 = 0,07 Ω et l = 2·10⁻⁷ × 500 = 0,1 mH. ' +
              'Étape 1 : P = V₂²/R_f + V₂²/R_charge + (R + r)·I² = 87 + 49 439 + 10 800 ≈ 60,3 kW. ' +
              'Étape 2 : Q = V₂²/(Lω) + lω·I² = 601 + 1 257 ≈ 1,86 kvar. ' +
              'Étape 3 : S = √(P² + Q²) ≈ 60,4 kVA. Étape 4 : V₁ = S / I ≈ 302 V (résolution proposée par le site avec les données de l\'énoncé, à vérifier avec la correction du professeur).'
          }
        ]
      },
      {
        id: 'instantanee',
        titre: 'Document 1 : la puissance instantanée p',
        court: 'Puissance instantanée p',
        blocs: [
          { p: 'Soit un dipôle linéaire alimenté par un générateur de tension sinusoïdale. La puissance instantanée reçue (en convention récepteur) par le dipôle est :' },
          { f: 'p = v(t) × i(t)', cadre: true },
          { p: 'Quand $p &gt; 0$, le dipôle reçoit de la puissance ; quand $p &lt; 0$, il en fournit. Même si les valeurs moyennes de $u$ et de $i$ sont nulles, la valeur moyenne de $p$ est généralement non nulle.' },
          { note: 'Dans le laboratoire, la section « Tension, courant et puissance instantanée » trace ces courbes pour n\'importe quel schéma.' }
        ]
      },
      {
        id: 'active',
        titre: 'Document 2 : la puissance active P',
        court: 'Puissance active P',
        blocs: [
          { p: 'La puissance active (notée $P$) est égale à la valeur moyenne de la puissance instantanée :' },
          { f: 'P = V I cos φ', cadre: true, unites: 'P en W, V en V, I en A' },
          { p: 'La puissance active est liée à la quantité d\'énergie électrique absorbée par un système.' }
        ]
      },
      {
        id: 'apparente',
        titre: 'Document 3 : la puissance apparente S',
        court: 'Puissance apparente S',
        blocs: [
          { p: 'Elle correspond au produit des valeurs efficaces de tension et d\'intensité de courant :' },
          { f: 'S = V I', cadre: true, unites: 'S en VA, V en V, I en A' },
          { p: 'Cette puissance ne représente aucune puissance réelle : c\'est pour cela qu\'on ne l\'exprime pas en W mais en V.A. Elle sert cependant au dimensionnement des installations.' }
        ]
      },
      {
        id: 'facteur',
        titre: 'Document 4 : le facteur de puissance',
        court: 'Facteur de puissance',
        blocs: [
          { p: 'Définition générale, valable pour tous les régimes ($k$ est une grandeur sans unité) :' },
          { f: 'k = frac(P;S)', cadre: true },
          { p: 'Cas particulier du régime sinusoïdal : $P = V I cos φ$ et $S = V I$, d\'où (relation valable uniquement en régime sinusoïdal) :' },
          { f: 'k = cos φ', cadre: true },
          { p: 'On en déduit que $k ≤ 1$. Un bon facteur de puissance est proche de 1.' },
          { p: 'En effet $I = frac(P;V cos φ)$ : plus le facteur de puissance est petit (donc mauvais), plus le courant sera grand pour véhiculer une même puissance active $P$. Ce qui augmente le coût de l\'installation (conducteur admettant une plus grande intensité), les pertes en ligne et les surtaxes de la part des fournisseurs d\'énergie.' }
        ]
      },
      {
        id: 'reactive',
        titre: 'Document 5 : la puissance réactive Q',
        court: 'Puissance réactive Q',
        blocs: [
          { p: 'La puissance réactive est liée à la présence d\'un déphasage, donc à la qualité de l\'énergie. Elle est notée $Q$ et son unité est le VAR (Volt Ampère Réactif). Elle a été définie en régime sinusoïdal telle que :' },
          { f: 'S^2 = P^2 + Q^2', cadre: true, unites: 'S en VA, P en W, Q en VAR' },
          { p: 'Cela permet de construire le <strong>triangle des puissances</strong>, sur lequel sont représentés le déphasage et les puissances active, réactive et apparente.' },
          { triangles: true },
          { p: 'On déduit de cette figure une relation reliant la puissance réactive aux valeurs efficaces et au déphasage :' },
          { f: 'Q = V I sin φ', cadre: true }
        ]
      },
      {
        id: 'boucherot',
        titre: 'Document 6 : le théorème de Boucherot',
        court: 'Théorème de Boucherot',
        blocs: [
          { p: 'La puissance active fournie par le générateur est égale à la somme des puissances actives consommées par chaque récepteur. Le même énoncé s\'applique à la puissance réactive.' },
          { f: 'P_T = P_1 + P_2 + P_3 + …    et    Q_T = Q_1 + Q_2 + Q_3 + …', cadre: true },
          { alerte: 'Ce théorème n\'est pas valable avec les puissances apparentes. Pour calculer $S_T$, on utilise la relation du document 5 : $S_T = sqrt(P_T^2 + Q_T^2)$' }
        ]
      },
      {
        id: 'relevement',
        titre: 'Document 7 : comment relever un mauvais facteur de puissance ?',
        court: 'Relèvement du facteur de puissance',
        blocs: [
          { p: 'La plupart des installations étant inductives (moteurs), donc consommatrices de puissance réactive, il faut ajouter dans l\'installation un élément fournissant de la puissance réactive. Il existe deux solutions :' },
          { liste: ['installation d\'une batterie de condensateurs ;', 'moteur synchrone surexcité et fonctionnant à vide (compensateur synchrone).'] },
          { p: 'Après relèvement, le condensateur est branché en dérivation sur le dipôle inductif : $P′ = P$ et $Q′ = Q + Q_C$ avec $Q_C &lt; 0$, donc $Q′ &lt; Q$.' },
          { schema: { regime: 'AC', V: 230, f: 50, charge: K.par(K.Cap(100e-6, 'C'), K.serie(K.R(20, 'R'), K.L(0.08, 'L'))) }, legende: 'Dipôle inductif (ici R, L série) avec son condensateur de relèvement' },
          { p: '$φ$ diminue, donc $cos φ$ augmente et $I′$ est plus petit que $I$, mais $P$ reste constant. On fournit donc bien une même puissance active tout en ayant un courant en ligne moins important.' }
        ]
      },
      {
        id: 'capacite',
        titre: 'Document 8 : capacité permettant d\'obtenir un facteur de puissance imposé',
        court: 'Capacité pour un cos φ imposé',
        blocs: [
          { p: 'L\'ajout d\'une batterie de condensateurs ne modifie pas la puissance active d\'une installation : on a la même puissance $P$ avant et après redressement du facteur de puissance. Pour passer d\'une valeur $cos φ$ à une valeur plus élevée $cos φ′$ :' },
          { f: 'C = frac(P (tan φ − tan φ′);2πf V^2)', cadre: true, unites: 'C en F, P en W, f en Hz, V en V' },
          { p: 'Avec $V$ et $f$ valeur efficace et fréquence de la tension alimentant l\'installation.' }
        ]
      },
      {
        id: 'relation',
        titre: 'Annexe 1 : relation entre les puissances P et Q',
        court: 'Relation entre P et Q',
        blocs: [
          { p: 'Le triangle des puissances donne une relation directe entre $P$ et $Q$ : $tan φ = frac(Q;P)$ (côté opposé sur côté adjacent). On en tire une relation très pratique pour calculer $Q$ à partir de $P$ et du facteur de puissance :' },
          { f: 'Q = P tan φ', cadre: true }
        ]
      },
      {
        id: 'rlc',
        titre: 'Annexe 2 : expressions de P et Q pour R, L et C',
        court: 'P et Q pour R, L et C',
        blocs: [
          { h: 'La résistance' },
          { p: '$Z = R$ donc $V = R I$ ; $φ = 0$ donc $cos φ = 1$ et $sin φ = 0$.' },
          { f: 'P = V I = R I^2 = frac(V^2;R)    ;    Q = 0' },
          { h: 'L\'inductance pure (bobine idéale)' },
          { p: '$Z = Lω$ donc $V = Lω I$ ; $φ = frac(π;2)$ donc $cos φ = 0$ et $sin φ = 1$.' },
          { f: 'P = 0    ;    Q = V I = Lω I^2 = frac(V^2;Lω)' },
          { h: 'Le condensateur' },
          { p: '$Z = frac(1;Cω)$ donc $V = frac(1;Cω) × I$ ; $φ = −frac(π;2)$ donc $cos φ = 0$ et $sin φ = −1$.' },
          { f: 'P = 0    ;    Q = −V I = −Cω V^2 = −frac(I^2;Cω)' },
          { h: 'Tableau récapitulatif' },
          {
            table: {
              tetes: ['Dipôle', 'P en fonction de I', 'P en fonction de V', 'Q en fonction de I', 'Q en fonction de V'],
              lignes: [
                ['R', '$R I^2$', '$frac(V^2;R)$', '0', '0'],
                ['L', '0', '0', '$Lω I^2$', '$frac(V^2;Lω)$'],
                ['C', '0', '0', '$−frac(I^2;Cω)$', '$−Cω V^2$']
              ]
            }
          }
        ]
      },
      {
        id: 'choix',
        titre: 'Annexe 3 : quand utiliser une relation plutôt qu\'une autre ?',
        court: 'Quelle relation utiliser ?',
        blocs: [
          { p: 'Dans un groupement en <strong>série</strong>, par définition, les dipôles sont traversés par le même courant. Pour ces groupements, on utilise généralement les expressions <strong>en fonction de I</strong>.' },
          { p: 'Dans un groupement en <strong>dérivation</strong>, par définition, les dipôles sont soumis à la même tension. Pour ces groupements, on utilise généralement les expressions <strong>en fonction de V</strong>.' }
        ]
      },
      {
        id: 'methode',
        titre: 'Annexe 4 : la méthode de Boucherot',
        court: 'Méthode de Boucherot',
        blocs: [
          { p: 'C\'est une méthode qui permet de calculer des grandeurs électriques (tension ou courant) en entrée d\'un système électrique, en passant par des calculs de puissances. Elle permet d\'éviter des calculs fastidieux utilisant les nombres complexes lorsque la méthode de Fresnel s\'applique difficilement. Elle combine le tableau récapitulatif et le théorème de Boucherot, en 4 étapes :' },
          { liste: [
            '<strong>Calcul de la puissance active totale $P_T$.</strong> On calcule $P$ pour chaque résistance du schéma équivalent à l\'aide du tableau récapitulatif, puis on additionne l\'ensemble des puissances $P$ calculées.',
            '<strong>Calcul de la puissance réactive totale $Q_T$.</strong> On calcule $Q$ pour chaque bobine et condensateur du schéma équivalent à l\'aide du tableau récapitulatif, puis on additionne l\'ensemble des puissances $Q$ calculées.',
            '<strong>Calcul de la puissance apparente totale $S_T$.</strong> Il suffit d\'utiliser la relation entre $P$, $Q$ et $S$ : $S_T = sqrt(P_T^2 + Q_T^2)$.',
            '<strong>Calcul de V ou de I à l\'entrée du système électrique.</strong> Il suffit d\'utiliser l\'expression de $S$ pour en déduire $V$ ou $I$ : $S_T = V × I$ (en monophasé).'
          ], ordonnee: true }
        ]
      },
      {
        id: 'td',
        titre: 'TD — Exercices',
        court: 'TD — Exercices',
        blocs: [
          { h: 'Exercice 1 : Dimensionnement électrique d\'un atelier' },
          { p: 'Un atelier consommant des puissances $P$ = 30 kW et $Q$ = 22,5 kVAR doit être alimenté sous une tension (230 V, 50 Hz). L\'atelier est connecté au secondaire d\'un transformateur via un câble de longueur 700 m dont les caractéristiques sont : $r$ = 7,8·10⁻⁵ Ω/m ; $l$ = 2,39·10⁻⁷ H/m.' },
          { liste: ['Calculer la puissance apparente $S$ à l\'extrémité du câble côté atelier.', 'En déduire la valeur efficace $I$ du courant en ligne.', 'Calculer la valeur efficace $V_s$ de la tension que doit délivrer le secondaire du transformateur en utilisant la méthode de Boucherot.'], ordonnee: true },
          { reponses: '1. → 37,5 kVA — 2. → 163 A — 3. → 242 V' },
          { h: 'Exercice 2 : Schéma monophasé équivalent d\'une installation triphasée' },
          { p: 'Données : $C$ = 470 µF ; $R$ = 3,33 Ω ; $L$ = 13,3 mH ; $V$ = 230 V et $f$ = 50 Hz. Le courant $I_1$ est celui de la branche R, L.' },
          { schema: { regime: 'AC', V: 230, f: 50, charge: K.par(K.Cap(470e-6, 'C'), K.serie(K.R(3.33, 'R'), K.L(13.3e-3, 'L'))) }, legende: 'Schéma monophasé équivalent' },
          { liste: ['Calculer $I_1$ en passant par un calcul d\'impédance.', 'En déduire la valeur de $I$ en utilisant la méthode de Boucherot.', 'Quelle serait la valeur efficace du courant en ligne, sans la présence du condensateur ?'], ordonnee: true },
          { reponses: '1. → 43,1 A — 2. → 26,9 A' },
          { h: 'Exercice 3 : Schéma équivalent d\'un transformateur monophasé' },
          { p: 'Le schéma équivalent d\'un transformateur monophasé comporte, au primaire, $R_f$ en dérivation avec $L_m$ et, au secondaire, $R_s$ en série avec $L_s$. Pour déterminer la valeur de ces éléments, on réalise deux essais.' },
          { p: '<strong>Partie A : essai à vide.</strong> L\'intensité du courant dans le secondaire est nulle : le modèle se réduit à $R_f$ // $L_m$. Cet essai est réalisé sous tension nominale $V_1$ = 10 000 V. On mesure $I_1$ = 0,85 A et $P$ = 1 kW.' },
          { liste: ['A.1 Calculer la puissance apparente absorbée.', 'A.2 En déduire la puissance réactive absorbée.', 'A.3 Quels sont le ou les éléments consommant la puissance active ?', 'A.4 Quels sont le ou les éléments consommant la puissance réactive ?', 'A.5 Calculer les valeurs de $R_f$ et $L_m$.'] },
          { p: '<strong>Partie B : essai en court-circuit.</strong> Cet essai est réalisé sous tension réduite $V_1$ = 430 V : les éléments du primaire peuvent être négligés, le modèle se réduit à $R_s$ en série avec $L_s$. On mesure $I_1$ = 10 A, $I_2$ = 833 A et $P$ = 1,6 kW.' },
          { liste: ['B.1 Calculer la puissance apparente absorbée.', 'B.2 En déduire la puissance réactive absorbée.', 'B.3 Quels sont le ou les éléments consommant la puissance active ?', 'B.4 Quels sont le ou les éléments consommant la puissance réactive ?', 'B.5 Calculer les valeurs de $R_s$ et de $L_s$.'] },
          { reponses: 'A.1 → 8500 VA — A.2 → 8440 VAR — A.5 → 100 kΩ ; 37,7 H — B.1 → 4300 VA — B.2 → 3991 VAR — B.5 → 2,3 mΩ ; 1,83·10⁻⁵ H' }
        ]
      }
    ],
    formules: [
      { id: 'pinst', groupe: 'Puissances', nom: 'Puissance instantanée', expr: 'p = v(t) × i(t)', quand: 'Convention récepteur ; p en W.' },
      { id: 'P', groupe: 'Puissances', nom: 'Puissance active', expr: 'P = V I cos φ', quand: 'En watts (W). Valeur moyenne de p.' },
      { id: 'Q', groupe: 'Puissances', nom: 'Puissance réactive', expr: 'Q = V I sin φ', quand: 'En VAR. Positive si inductif, négative si capacitif.' },
      { id: 'S', groupe: 'Puissances', nom: 'Puissance apparente', expr: 'S = V I', quand: 'En VA. Sert au dimensionnement.' },
      { id: 'S2', groupe: 'Puissances', nom: 'Triangle des puissances', expr: 'S^2 = P^2 + Q^2', quand: 'Donc $S = sqrt(P^2 + Q^2)$ et $Q = sqrt(S^2 − P^2)$.' },
      { id: 'k', groupe: 'Facteur de puissance', nom: 'Facteur de puissance', expr: 'k = frac(P;S) = cos φ', quand: '$k = cos φ$ uniquement en régime sinusoïdal. $k ≤ 1$.' },
      { id: 'QPtan', groupe: 'Facteur de puissance', nom: 'Q à partir de P', expr: 'Q = P tan φ', quand: 'Quand on connaît P et le facteur de puissance.' },
      { id: 'tanphiPQ', groupe: 'Facteur de puissance', nom: 'Déphasage à partir des puissances', expr: 'tan φ = frac(Q;P)', quand: 'Triangle des puissances.' },
      { id: 'Ccomp', groupe: 'Facteur de puissance', nom: 'Capacité de relèvement', expr: 'C = frac(P (tan φ − tan φ′);2πf V^2)', quand: 'Pour passer de cos φ à cos φ′ ; P ne change pas.' },
      { id: 'PR', groupe: 'Puissances par dipôle', nom: 'Résistance', expr: 'P = R I^2 = frac(V^2;R)  ;  Q = 0', quand: 'En fonction de I en série, de V en dérivation.' },
      { id: 'QL', groupe: 'Puissances par dipôle', nom: 'Inductance pure', expr: 'Q = Lω I^2 = frac(V^2;Lω)  ;  P = 0', quand: 'Une bobine consomme de la puissance réactive.' },
      { id: 'QC', groupe: 'Puissances par dipôle', nom: 'Condensateur', expr: 'Q = −Cω V^2 = −frac(I^2;Cω)  ;  P = 0', quand: 'Un condensateur fournit de la puissance réactive.' },
      { id: 'boucherot', groupe: 'Boucherot', nom: 'Théorème de Boucherot', expr: 'P_T = P_1 + P_2 + …  ;  Q_T = Q_1 + Q_2 + …', quand: 'Jamais avec S. Méthode : $P_T$, puis $Q_T$, puis $S_T = sqrt(P_T^2 + Q_T^2)$, puis $S_T = V I$.' }
    ]
  });
})(typeof window !== 'undefined' ? window.PE : globalThis.PE);
