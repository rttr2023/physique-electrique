// CH05 — Modélisation des systèmes électriques
// Transcription des scans listés dans `sources`. Format des blocs : voir .claude/commands/maj-cours.md
(function (PE) {
  const K = PE.circuit;

  PE.ajouterCours({
    id: 'ch05',
    annee: 1,
    numero: 5,
    titre: 'Modélisation des systèmes électriques',
    programme: 'A.1.2 Circuit en régime sinusoïdal',
    resume: 'Modéliser un système par des résistances, des inductances et des condensateurs pour prévoir le courant absorbé et le déphasage.',
    sources: ['scan0118.pdf', 'scan0119.pdf', 'scan0120.pdf', 'scan0121.pdf', 'scan0122.pdf', 'scan0123.pdf', 'scan0124.pdf'],
    objectifs: [
      'Savoir ce que modélise une résistance dans un schéma équivalent',
      'Savoir calculer la valeur efficace du courant traversant un dipôle, connaissant son impédance et la valeur efficace de la tension à ses bornes',
      'Connaître la valeur du déphasage et l\'expression de l\'impédance pour une résistance, une inductance pure (bobine idéale) et un condensateur idéal',
      'Connaître l\'expression de l\'impédance et du déphasage pour une association R, L série',
      'Savoir tracer la représentation de Fresnel correspondant à une relation'
    ],
    sections: [
      {
        id: 'probleme',
        titre: 'Problématique : installation d\'un four à induction',
        court: 'Problématique : four à induction',
        blocs: [
          { p: 'Vous êtes responsable de la maintenance électrique dans l\'atelier d\'une usine. Un four à induction servant à la fusion de métaux doit être installé. Afin de dimensionner les constituants de l\'installation électrique (protection, section du câble…), il faut vérifier par le calcul la valeur du courant qui sera absorbé ainsi que la valeur du déphasage.' },
          { p: 'Le four est triphasé, mais les calculs sont réalisés sur une phase. Une phase du four peut être modélisée par une inductance pure ($L$ = 60 µH) en série avec une résistance ($r$ = 50 mΩ). Le four est alimenté par une tension sinusoïdale de valeur efficace $V$ = 230 V et de fréquence 600 Hz.' },
          { schema: { regime: 'AC', V: 230, f: 600, charge: K.serie(K.R(0.05, 'r'), K.L(60e-6, 'L')) }, legende: 'Modèle d\'une phase du four à induction' },
          { liste: ['Calculer l\'impédance $Z$ du four.', 'En déduire la valeur efficace $I$ de l\'intensité du courant.', 'Calculer la valeur du déphasage. Que faudra-t-il prévoir dans l\'installation ?'], ordonnee: true },
          { note: 'Ouvre le schéma dans le laboratoire pour voir tous les calculs détaillés. Le déphasage est important : il faudra prévoir un relèvement du facteur de puissance (chapitre 6).' }
        ]
      },
      {
        id: 'resistif',
        titre: '1. Qu\'est-ce que l\'effet résistif ?',
        court: 'Effet résistif',
        blocs: [
          { p: 'Les appareils en fonctionnement sont tous plus ou moins chauds. Ceci s\'explique par l\'effet Joule : tout conducteur parcouru par un courant est le siège d\'un dégagement de chaleur proportionnel au carré de l\'intensité du courant.' },
          { p: 'Le dégagement de chaleur d\'un système est modélisé par une <strong>résistance R</strong>. Plus un système « chauffe » pour une intensité de courant donnée, plus la valeur de la résistance de son modèle sera grande.' }
        ]
      },
      {
        id: 'inductif',
        titre: '2. Qu\'est-ce que l\'effet inductif ?',
        court: 'Effet inductif',
        blocs: [
          { p: 'Un conducteur parcouru par un courant émet un champ magnétique. En électrotechnique, il y a de nombreux cas où ce champ magnétique n\'est pas négligeable (transformateur, machine tournante, câble parcouru par une forte intensité…). Le système est alors le siège de phénomènes d\'induction qui engendrent un <strong>retard du courant sur la tension</strong>.' },
          { p: 'Ces phénomènes sont modélisés par une inductance, représentée par une <strong>bobine idéale d\'inductance L</strong>.' }
        ]
      },
      {
        id: 'capacitif',
        titre: '3. Qu\'est-ce que l\'effet capacitif ?',
        court: 'Effet capacitif',
        blocs: [
          { p: 'Certains systèmes sont le siège de phénomènes électrostatiques : il y a accumulation momentanée d\'électrons à certains endroits du circuit. En sinusoïdal, ces phénomènes se traduisent par une <strong>avance du courant sur la tension</strong>.' },
          { p: 'C\'est le cas des circuits comprenant des condensateurs (accumulation de charge sur leurs armatures), mais pas uniquement : deux câbles conducteurs très proches, séparés par leurs gaines isolantes et éventuellement de l\'air, forment « une sorte de condensateur ».' },
          { p: 'Ces phénomènes sont modélisés par un <strong>condensateur idéal de capacité C</strong>.' }
        ]
      },
      {
        id: 'modelisation',
        titre: '4. Comment modéliser un système électrique ?',
        court: 'Modéliser un système',
        blocs: [
          { p: 'Prenons le câble alimentant les ateliers à partir du transformateur situé à l\'entrée. Parcouru par un courant, ce câble s\'échauffe : il est le siège de pertes par effet Joule sur toute sa longueur (environ 300 m). Ces pertes ne sont pas négligeables et le modèle électrique du câble comprend une résistance.' },
          { p: 'Du fait de la longueur du câble et de l\'intensité du courant qui le traverse, les phénomènes magnétiques ne sont pas négligeables : le câble induit un retard du courant par rapport à la tension. Le modèle comprend donc également une inductance.' },
          { p: 'Si les phénomènes électrostatiques sont négligeables, une modélisation possible du câble est une résistance en série avec une inductance. Les valeurs R et L de ce modèle peuvent se déterminer à partir d\'une mesure de puissance en amont et en aval du câble.' },
          { schema: { regime: 'AC', V: 230, f: 50, charge: K.serie(K.R(0.1, 'R'), K.L(1e-4, 'L')) }, legende: 'Modèle R, L série d\'un câble', valeurs: false }
        ]
      },
      {
        id: 'impedance',
        titre: '5. Qu\'est-ce que l\'impédance ?',
        court: 'Impédance',
        blocs: [
          { p: 'Soit un dipôle traversé par un courant sinusoïdal d\'intensité $i$ et de valeur efficace $I$, soumis à une tension sinusoïdale $v$ de valeur efficace $V$. On définit l\'impédance $Z$ (unité : Ω) de ce dipôle par :' },
          { f: 'Z = frac(V;I)' },
          { p: 'On retient plutôt cette relation sous la forme de la loi d\'Ohm en sinusoïdal :' },
          { f: 'V = Z I', cadre: true }
        ]
      },
      {
        id: 'rlc',
        titre: '6. Impédance et déphasage de chaque élément de modélisation',
        court: 'Impédance et déphasage de R, L, C',
        blocs: [
          { h: 'Cas de la résistance' },
          { p: 'C\'est le cas idéal au niveau du déphasage : courant et tension sont en phase.' },
          { f: 'φ = 0', cadre: true },
          { f: 'Z = R  ;  V = R I', cadre: true },
          { p: 'Notation complexe : $cx(V) = R cx(I)$' },
          { h: 'Cas de l\'inductance pure (bobine idéale)' },
          { p: 'Le courant est en <strong>retard</strong> sur la tension avec un déphasage :' },
          { f: 'φ = +90° = frac(π;2) rad', cadre: true },
          { f: 'Z = Lω  ;  V = Lω I', cadre: true },
          { p: 'Notation complexe : $cx(V) = jLω cx(I)$. La multiplication par $j$ représente l\'angle de 90° entre $vec(I)$ et $vec(V)$.' },
          { h: 'Cas du condensateur' },
          { p: 'Le courant est en <strong>avance</strong> sur la tension avec un déphasage :' },
          { f: 'φ = −90° = −frac(π;2) rad', cadre: true },
          { f: 'Z = frac(1;Cω)  ;  V = frac(I;Cω)', cadre: true },
          { p: 'Notation complexe : $cx(V) = frac(cx(I);jCω)$. La division par $j$ représente l\'angle de −90° entre $vec(I)$ et $vec(V)$.' },
          {
            table: {
              tetes: ['Dipôle', 'Impédance', 'Déphasage φ', 'Courant', 'Notation complexe'],
              lignes: [
                ['Résistance R', '$Z = R$', '0°', 'en phase', '$cx(V) = R cx(I)$'],
                ['Inductance pure L', '$Z = Lω$', '+90°', 'en retard', '$cx(V) = jLω cx(I)$'],
                ['Condensateur C', '$Z = frac(1;Cω)$', '−90°', 'en avance', '$cx(V) = frac(cx(I);jCω)$']
              ]
            }
          },
          { note: 'Rappel : la pulsation vaut $ω = 2πf$ (314 rad/s à 50 Hz).' }
        ]
      },
      {
        id: 'modele',
        titre: '7. Déphasage et impédance d\'un système à partir de son modèle',
        court: 'Impédance d\'un modèle',
        blocs: [
          { p: 'Prenons les bobines utilisées en TP. Le constructeur donne $L$ = 1,1 H et $r$ = 12 Ω : la bobine n\'est pas idéale, elle est soumise à des pertes Joule modélisées par une résistance $r$. Son modèle équivalent est une résistance en série avec une inductance pure.' },
          { schema: { regime: 'AC', V: 230, f: 50, charge: K.serie(K.R(12, 'r'), K.L(1.1, 'L')) }, legende: 'Modèle équivalent de la bobine de TP' },
          { p: 'Pour déterminer le déphasage et l\'impédance, on dessine la représentation de Fresnel. On sait que $cx(V)_r = r cx(I)$ et $cx(V)_L = jLω cx(I)$, donc $cx(V) = cx(V)_r + cx(V)_L = r cx(I) + jLω cx(I)$.' },
          { fresnel: { regime: 'AC', V: 230, f: 50, charge: K.serie(K.R(190, 'r'), K.L(1.1, 'L')) }, legende: 'Allure du triangle de Fresnel (r volontairement agrandie pour la lisibilité).' },
          { p: 'Avec la trigonométrie dans le triangle rectangle ($tan φ = frac(côté opposé;côté adjacent) = frac(Lω I;r I)$) :' },
          { f: 'tan φ = frac(Lω;r)', cadre: true },
          { p: 'Avec le théorème de Pythagore : $V^2 = (rI)^2 + (LωI)^2$, soit $frac(V^2;I^2) = r^2 + (Lω)^2$, d\'où :' },
          { f: 'Z = sqrt(r^2 + (Lω)^2)', cadre: true },
          { h: 'Application numérique' },
          { p: 'La bobine est soumise à la tension du réseau (230 V, 50 Hz) :' },
          { f: 'Z = sqrt(12^2 + (1,1 × 314)^2) = 346 Ω' },
          { f: 'φ = arctan frac(1,1 × 314;12) = 88°' },
          { f: 'I = frac(V;Z) = frac(230;346) = 0,667 A' }
        ]
      },
      {
        id: 'td',
        titre: 'TD — Exercices',
        court: 'TD — Exercices',
        blocs: [
          { h: 'Exercice 1 : Impédances' },
          { p: 'Soit une bobine d\'inductance $L$ = 12 mH, que l\'on considérera parfaite, soumise à une tension sinusoïdale de valeur efficace 24 V.' },
          { liste: ['1.1 Calculer la valeur de son impédance et la valeur efficace du courant qui traversera la bobine pour une fréquence $f$ = 50 Hz.', '1.2 Même question pour $f$ = 1 kHz.', '2. Même travail pour un condensateur de capacité $C$ = 100 nF.'] },
          { reponses: '1.1 → 3,77 Ω ; 6,37 A — 1.2 → 75,4 Ω ; 0,318 A — 2.1 → 31,8 kΩ ; 0,754 mA — 2.2 → 1,59 kΩ ; 15,1 mA' },
          { h: 'Exercice 2 : Impédances' },
          { p: 'Une bobine considérée parfaite est soumise à la tension sinusoïdale du secteur ($V$ = 230 V ; $f$ = 50 Hz). Elle est alors parcourue par un courant de valeur efficace $I$ = 4,88 A. Calculer l\'impédance puis l\'inductance de la bobine.' },
          { reponses: '47,1 Ω ; 150 mH' },
          { h: 'Exercice 3 : Bobine réelle' },
          { p: 'En salle de TP, on souhaite connecter une bobine sur le réseau monophasé 24 V de la table. Sur la bobine, il est inscrit $L$ = 0,1 H, $R$ = 11 Ω et $I_{max}$ = 1 A.' },
          { schema: { regime: 'AC', V: 24, f: 50, charge: K.serie(K.R(11, 'r'), K.L(0.1, 'L')) }, legende: 'Modèle équivalent de la bobine' },
          { liste: ['Que modélise la résistance $r$ sur le schéma équivalent ?', 'Calculer l\'impédance $Z$ de la bobine.', 'En déduire la valeur efficace $I$ de l\'intensité du courant.', 'Peut-on réaliser l\'expérience sans endommager la bobine ?', 'Calculer la valeur du déphasage que l\'on obtiendra.'], ordonnee: true },
          { reponses: '2. → 33,3 Ω — 3. → 0,720 A — 5. → 70,7°' },
          { h: 'Exercice 4 : Principe de la sélection de fréquence radio' },
          { p: 'Le circuit ci-dessous peut être utilisé comme sélecteur de fréquence de radio. Données : $L$ = 6,8 mH ; $C$ = 142 pF ; $R$ = 1 kΩ ; $I$ = 3,86 mA ; $f$ = 200 kHz.' },
          { schema: { regime: 'AC', V: 12, f: 200e3, charge: K.serie(K.L(6.8e-3, 'L'), K.Cap(142e-12, 'C'), K.R(1000, 'R')) }, legende: 'Circuit L, C, R série', source: false },
          { liste: ['Calculer les valeurs efficaces $V_L$, $V_C$ et $V_R$.', 'Montrer que $cx(V) = R cx(I) + jLω cx(I) + frac(cx(I);jCω)$.', 'Tracer le diagramme de Fresnel correspondant à cette relation en prenant $i$ comme origine des phases.', 'En déduire la valeur efficace de $v$ ainsi que $φ_{i/v}$.'], ordonnee: true },
          { reponses: '1. → 33 V ; 21,6 V ; 3,86 V — 4. → 12 V ; 71°' }
        ]
      },
      {
        id: 'continu',
        titre: 'Exercices supplémentaires — circuits RC et RL en continu',
        court: 'Circuits RC et RL en continu',
        blocs: [
          { h: 'Exercice A — Circuit RC' },
          { p: 'Un générateur $E$ = 24 V alimente en série une résistance $R_1$ et un dipôle parallèle $R_2$ // $C$, avec $R_1$ = 10 Ω, $R_2$ = 20 Ω, $C$ = 1000 µF. On s\'intéresse au comportement immédiatement après la fermeture ($t = 0⁺$) et au régime définitif ($t → ∞$).' },
          { schema: { regime: 'DC', V: 24, f: 0, charge: K.serie(K.R(10, 'R1'), K.par(K.R(20, 'R2'), K.Cap(1e-3, 'C'))) }, legende: 'Exercice A' },
          { liste: ['Calculer la résistance équivalente vue par la source à l\'instant $t = 0⁺$ et à l\'état permanent $t → ∞$.', 'Déduire l\'intensité totale $I(0⁺)$ et $I(∞)$.', 'Calculer la tension aux bornes du condensateur $V_C(0⁺)$ et $V_C(∞)$.', 'Calculer la charge $Q(∞)$ sur le condensateur et l\'énergie $W_C$ stockée à l\'état final.', 'Donner la constante de temps $τ$ (sans résoudre l\'équation) utile pour estimer la vitesse de charge.'], ordonnee: true },
          { h: 'Exercice B — Circuit RL' },
          { p: 'Même schéma, mais on remplace $C$ par une inductance $L$ : $E$ = 24 V, $R_1$ = 10 Ω, $R_2$ = 20 Ω, $L$ = 0,1 H. Étudier les valeurs à $t = 0⁺$ et $t → ∞$ : résistances équivalentes, courant total, courants de branche, énergie stockée dans l\'inductance et constante de temps $τ$.' },
          { schema: { regime: 'DC', V: 24, f: 0, charge: K.serie(K.R(10, 'R1'), K.par(K.R(20, 'R2'), K.L(0.1, 'L'))) }, legende: 'Exercice B' },
          { note: 'Ces deux énoncés n\'ont pas de corrigé dans le polycopié : ouvre-les dans le laboratoire pour obtenir la résolution pas à pas. Méthode : à $t = 0⁺$ un condensateur déchargé se comporte comme un fil et une bobine comme un interrupteur ouvert ; en régime permanent c\'est l\'inverse.' }
        ]
      }
    ],
    formules: [
      { id: 'omega', groupe: 'Rappels', nom: 'Pulsation', expr: 'ω = 2πf', quand: 'ω en rad/s, f en Hz. À 50 Hz, ω ≈ 314 rad/s.' },
      { id: 'ohm', groupe: 'Impédance', nom: 'Loi d\'Ohm en sinusoïdal', expr: 'V = Z I', quand: 'Entre valeurs efficaces, pour n\'importe quel dipôle.' },
      { id: 'ZR', groupe: 'Impédance', nom: 'Résistance', expr: 'Z = R  ;  φ = 0', quand: 'Courant et tension en phase.' },
      { id: 'ZL', groupe: 'Impédance', nom: 'Inductance pure', expr: 'Z = Lω  ;  φ = +90°', quand: 'Courant en retard sur la tension.' },
      { id: 'ZC', groupe: 'Impédance', nom: 'Condensateur', expr: 'Z = frac(1;Cω)  ;  φ = −90°', quand: 'Courant en avance sur la tension.' },
      { id: 'dephasages', groupe: 'Impédance', nom: 'Signe du déphasage', expr: 'φ &gt; 0 : inductif  ;  φ &lt; 0 : capacitif', quand: 'φ est le déphasage de la tension par rapport au courant.' },
      { id: 'Zserie', groupe: 'Association série', nom: 'Impédance R, L série', expr: 'Z = sqrt(R^2 + (Lω)^2)', quand: 'Pythagore sur le triangle de Fresnel. Avec un condensateur en série : $Z = sqrt(R^2 + (Lω − frac(1;Cω))^2)$.' },
      { id: 'tanphi', groupe: 'Association série', nom: 'Déphasage R, L série', expr: 'tan φ = frac(Lω;R)', quand: 'Avec un condensateur en série : $tan φ = frac(Lω − frac(1;Cω);R)$.' },
      { id: 'fresnelSerie', groupe: 'Association série', nom: 'Fresnel R, L, C série', expr: 'V = sqrt(V_R^2 + (V_L − V_C)^2)', quand: 'i à l\'origine des phases : $V_R$ en phase, $V_L$ à +90°, $V_C$ à −90°.' },
      { id: 'Zcomplexe', groupe: 'Notation complexe', nom: 'Impédances complexes', expr: 'cx(Z)_R = R  ;  cx(Z)_L = jLω  ;  cx(Z)_C = frac(1;jCω)', quand: 'En série les impédances s\'ajoutent ; en dérivation ce sont leurs inverses. $Z$ est le module, $φ$ l\'argument.' },
      { id: 'serieDeriv', groupe: 'Notation complexe', nom: 'Série ou dérivation', expr: 'série : même I  ;  dérivation : même V', quand: 'Choisir la relation en fonction de I en série, en fonction de V en dérivation.' },
      { id: 'etat0', groupe: 'Régime continu (exercices supplémentaires)', nom: 'État à t = 0⁺', expr: 'C ≡ fil  ;  L ≡ interrupteur ouvert', quand: 'Condensateur initialement déchargé, bobine sans courant.' },
      { id: 'etatInf', groupe: 'Régime continu (exercices supplémentaires)', nom: 'Régime permanent', expr: 'C ≡ interrupteur ouvert  ;  L ≡ fil', quand: 'Quand t → ∞, plus rien ne varie.' },
      { id: 'ohmDC', groupe: 'Régime continu (exercices supplémentaires)', nom: 'Loi d\'Ohm', expr: 'I = frac(E;R_{eq})', quand: 'Série : $R_{eq} = R_1 + R_2$. Dérivation : $R_{eq} = frac(R_1 R_2;R_1 + R_2)$.' },
      { id: 'charge', groupe: 'Régime continu (exercices supplémentaires)', nom: 'Charge d\'un condensateur', expr: 'Q = C V_C', quand: 'Q en coulombs.' },
      { id: 'WC', groupe: 'Régime continu (exercices supplémentaires)', nom: 'Énergie d\'un condensateur', expr: 'W_C = frac(1;2) C V_C^2', quand: 'W en joules.' },
      { id: 'WL', groupe: 'Régime continu (exercices supplémentaires)', nom: 'Énergie d\'une bobine', expr: 'W_L = frac(1;2) L I_L^2', quand: 'W en joules.' },
      { id: 'tauRC', groupe: 'Régime continu (exercices supplémentaires)', nom: 'Constante de temps RC', expr: 'τ = R_{th} C', quand: '$R_{th}$ : résistance vue par le condensateur, source éteinte (remplacée par un fil).' },
      { id: 'tauRL', groupe: 'Régime continu (exercices supplémentaires)', nom: 'Constante de temps RL', expr: 'τ = frac(L;R_{th})', quand: '$R_{th}$ : résistance vue par la bobine, source éteinte (remplacée par un fil).' }
    ]
  });
})(typeof window !== 'undefined' ? window.PE : globalThis.PE);
