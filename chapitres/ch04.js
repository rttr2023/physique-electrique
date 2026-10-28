// CH04 — Le déphasage courant/tension en régime sinusoïdal
// Transcription des scans listés dans `sources`. Format des blocs : voir outils/FORMAT-CHAPITRE.md
// Page d'ouverture du chapitre (problématique, objectifs) non photographiée : rien n'est inventé pour la remplacer.
// Ordre du polycopié : Annexe 1 (documents 1 à 4, p03-p04), puis le TD (p01-p02).
(function (PE) {
  PE.ajouterCours({
    id: 'ch04',
    annee: 1,
    numero: 4,
    titre: 'Le déphasage courant/tension en régime sinusoïdal',
    programme: '',
    resume: 'Définir, mesurer et interpréter le déphasage du courant par rapport à la tension, et lire un oscillogramme ou une représentation de Fresnel.',
    sources: ['A1-Ch04-p01.pdf', 'A1-Ch04-p02.pdf', 'A1-Ch04-p03.pdf', 'A1-Ch04-p04.pdf'],
    objectifs: [],
    sections: [
      {
        id: 'definition',
        titre: 'Document 1 : Qu\'est-ce que le déphasage ?',
        court: 'Définition du déphasage',
        blocs: [
          { p: 'En électrotechnique, lorsque l\'on parle pour un système du déphasage $φ$ sans autre précision, cela correspond au <strong>déphasage du courant par rapport à la tension</strong>.' },
          { p: '$φ$ pourrait s\'appeler également <strong>retard du courant sur la tension</strong> : en effet, lorsque $i$ est en retard sur $v$, $φ$ est compté positivement (et négativement si $i$ est en avance sur $v$).' },
          { p: 'Le polycopié illustre les trois cas par trois oscillogrammes de $v$ et $i$ (même période) :' },
          {
            table: {
              tetes: ['Oscillogramme', 'Déphasage', 'Position de i par rapport à v'],
              lignes: [
                ['1 : $i$ passe par son maximum après $v$', '$φ &gt; 0$ (inductif)', '$i$ est en retard sur $v$'],
                ['2 : $i$ passe par son maximum avant $v$', '$φ &lt; 0$ (capacitif)', '$i$ est en avance sur $v$'],
                ['3 : $i$ et $v$ passent ensemble par leurs maxima et par zéro', '$φ = 0$ (purement résistif)', '$i$ et $v$ sont en phase']
              ]
            }
          },
          { note: 'Les oscillogrammes ne sont pas redessinés ici : voir le polycopié d\'origine (A1-Ch04-p03.pdf, en bas de page). Le laboratoire trace aussi $v(t)$ et $i(t)$ pour n\'importe quel schéma.' },
          { p: '$φ = 0$ correspond au cas idéal : il correspond à un minimum de courant en ligne pour une valeur donnée de puissance reçue par un système. C\'est le cas d\'un chauffage résistif.' },
          { p: 'Dès lors que les systèmes contiennent par exemple des moteurs, $φ$ sera supérieur à zéro.' }
        ]
      },
      {
        id: 'industrie',
        titre: 'Document 2 : Quelle est l\'importance du déphasage dans l\'industrie ?',
        court: 'Déphasage dans l\'industrie',
        blocs: [
          { p: 'Les installations industrielles sont de type inductif : de ce fait, le déphasage du courant par rapport à la tension est positif.' },
          { p: 'Le principal effet de ce déphasage est une <strong>augmentation de l\'intensité du courant en ligne</strong> pour un apport d\'énergie identique. Le surcoût financier engendré à l\'entreprise est double :' },
          { liste: [
            'L\'installation doit être surdimensionnée (câbles de section plus importante…).',
            'Le fournisseur d\'énergie, devant alors supporter des pertes d\'énergie en ligne plus importantes, impose une taxe aux clients dont les installations admettent un trop grand déphasage.'
          ] },
          { p: 'Une des préoccupations économiques de l\'entreprise est donc de minimiser au maximum ce déphasage. Il n\'est pas toujours possible d\'obtenir $φ = 0$, mais pour éviter les surtaxes des fournisseurs d\'électricité, il suffit de le ramener en dessous de 0,38 rad (21,5°).' },
          { f: 'φ &lt; 0,38 rad (21,5°)', unites: 'pour éviter les surtaxes du fournisseur d\'électricité' },
          { note: 'Remarque du site : 0,38 rad × 180/π ≈ 21,8° ; le polycopié indique 21,5°.' }
        ]
      },
      {
        id: 'remede',
        titre: 'Document 3 : Comment remédier à une mauvaise valeur de déphasage ?',
        court: 'Remédier au déphasage',
        blocs: [
          { p: 'Les installations industrielles étant de type inductif, le courant qui leur est délivré par les fournisseurs d\'électricité est en retard sur la tension.' },
          { p: 'Ce retard peut être diminué par l\'ajout d\'une <strong>batterie de condensateurs</strong>. Une batterie de condensateurs est constituée de plusieurs condensateurs connectés en parallèle. La capacité, en farad (F), de la batterie de condensateurs est alors égale à la somme des capacités des condensateurs.' },
          { f: 'C = C_1 + C_2 + C_3 + …', unites: 'condensateurs en parallèle, C en F' },
          { p: 'Seuls, ces condensateurs engendreraient une avance du courant. Associés en parallèle à une installation inductive, ils compensent en tout ou partie le retard du courant : $φ$ se rapproche de zéro (mais peut devenir négatif !).' },
          { p: 'Cette solution implique un calcul de la valeur des condensateurs pour une utilisation donnée des systèmes. Elle manque de souplesse par rapport à la variation des activités de l\'entreprise dans la journée.' },
          { p: 'Pour y pallier, on peut faire le choix de corriger le déphasage de chaque système constituant l\'installation. Cependant des compensations plus sophistiquées existent. Elles réagissent instantanément aux variations du déphasage. Ces solutions sont plus coûteuses mais peuvent être rapidement amorties.' },
          { note: 'Le calcul de la capacité nécessaire est vu au chapitre 6 (relèvement du facteur de puissance).' }
        ]
      },
      {
        id: 'mesure',
        titre: 'Document 4 : Comment mesure-t-on un déphasage ?',
        court: 'Mesurer un déphasage',
        blocs: [
          { p: 'Pour déterminer $φ$ sur une représentation temporelle, on mesure le décalage temporel $Δt$.' },
          { p: 'Figure du polycopié (non redessinée) : deux sinusoïdes $v$ et $i$ de même période $T$, tracées en fonction de $t$ (graduations 0, $T/2$, $T$, $3T/2$). La courbe $i$, de plus grande amplitude, passe par son maximum, par zéro et par son minimum un temps $Δt$ après $v$ ; le même $Δt$ est repéré entre les deux maxima, entre deux passages par zéro et entre les deux minima.' },
          { p: 'Il s\'agit du décalage temporel entre les 2 courbes (entre 2 valeurs maximales, entre 2 passages par zéro de même nature…). Il s\'exprime en seconde (s).' },
          { p: 'On en déduit la valeur absolue du déphasage par un produit en croix :' },
          {
            table: {
              tetes: ['', 'En radians', 'En degrés'],
              lignes: [
                ['Une période $T$', '$2π$', '360°'],
                ['Le décalage $Δt$', '$|φ|$', '$|φ|$']
              ]
            }
          },
          { f: '|φ| = frac(2π × Δt;T)', cadre: true, unites: 'φ en rad, Δt et T en s' },
          { f: '|φ| = frac(360 × Δt;T)', cadre: true, unites: 'φ en degrés, Δt et T en s' },
          { p: '<strong>Le signe :</strong> $φ$ est positif si $i$ est en retard sur $v$ (cas de la figure ci-dessus) et négatif s\'il est en avance.' },
          { p: 'Le logiciel de simulation Psim et l\'oscilloscope utilisé en TP sont dotés de curseurs qui permettent de mesurer facilement $Δt$.' }
        ]
      },
      {
        id: 'td',
        titre: 'TD — Exercices',
        court: 'TD — Exercices',
        blocs: [
          { h: 'Exercice 1' },
          { p: 'Pour chacune des représentations de Fresnel suivantes ($f$ = 50 Hz ; échelles 30 V/cm et 2 A/cm) :' },
          { liste: [
            'Indiquer le déphasage sur la représentation.',
            'Donner la valeur du déphasage.',
            'Déterminer la valeur efficace de $v$ et de $i$.',
            'Donner l\'écriture algébrique de $v$ et de $i$.'
          ] },
          { p: 'Les quatre représentations (non redessinées, à mesurer sur le polycopié imprimé A1-Ch04-p01.pdf) ; le sens positif des angles est le sens trigonométrique (flèche courbe « + ») :' },
          {
            table: {
              tetes: ['Représentation', 'Vecteur $vec(I)$', 'Vecteur $vec(V)$'],
              lignes: [
                ['1', 'horizontal, vers la droite', 'horizontal, vers la droite, superposé à $vec(I)$ sur la même droite et plus long'],
                ['2', 'horizontal, vers la droite', 'plus long, tourné vers le haut (dans le sens +) par rapport à $vec(I)$'],
                ['3', 'horizontal, vers la droite', 'plus long, tourné vers le bas (dans le sens −) par rapport à $vec(I)$'],
                ['4', 'plus court, tourné vers le haut (dans le sens +) par rapport à $vec(V)$', 'horizontal, vers la droite']
              ]
            }
          },
          { reponses: 'Ex1 : 1. → 0° ; 102 V ; 4 A — 2. → 30° ; 102 V ; 4 A — 3. → −18° ; 3,4 A ; 87 V — 4. → −45° ; 3,4 A ; 87 V' },
          { h: 'Exercice 2' },
          { p: 'Soit l\'oscillogramme du polycopié (grille de 10 divisions horizontales sur 8 verticales, deux sinusoïdes $v$ et $i$ de même période, centrées sur l\'axe horizontal ; $v$, de plus grande amplitude, passe par son maximum peu avant $i$ ; non redessiné : voir A1-Ch04-p01.pdf) :' },
          { liste: [
            '<strong>Calibre des temps</strong> : 5 ms/div',
            '<strong>Relevé de la tension</strong> : mesurée avec une sonde 1/20<sup>e</sup> et un calibre de 2 V/div',
            '<strong>Relevé du courant</strong> : mesuré avec une sonde 100 mV/A et un calibre de 50 mV/div'
          ] },
          { liste: [
            'Déterminer la période, la fréquence et la pulsation des grandeurs relevées.',
            'La charge est-elle de type inductif ou capacitif ? Justifier. Quel sera le signe du déphasage ?',
            'Déterminer la valeur du déphasage.',
            'Déterminer la valeur maximale et la valeur efficace de $v$.',
            'Déterminer la valeur maximale et la valeur efficace de $i$.',
            'En prenant $i$ comme origine des phases : 6.1 Réaliser la représentation de Fresnel de $i$ et $v$ (échelles : 0,25 A/cm et 10 V/cm). 6.2 En déduire l\'écriture algébrique de $i$ et $v$.',
            'En prenant $v$ comme origine des phases : 7.1 Réaliser la représentation de Fresnel de $i$ et $v$ (échelles : 0,25 A/cm et 10 V/cm). 7.2 En déduire l\'écriture algébrique de $i$ et $v$.'
          ], ordonnee: true },
          { reponses: 'Ex2 : 1. → 20 ms ; 50 Hz ; 314 rad·s⁻¹ — 3. → 54° — 4. → 72 V ; 50,9 V — 5. → 0,7 A ; 0,495 A' },
          { h: 'Exercice 3' },
          { p: 'Soit l\'oscillogramme du polycopié (grille de 10 divisions horizontales sur 8 verticales, deux sinusoïdes $v$ et $i$ de même période, centrées sur l\'axe horizontal ; $i$, de plus petite amplitude, passe par son maximum peu avant $v$ ; non redessiné : voir A1-Ch04-p02.pdf) :' },
          { liste: [
            '<strong>Calibre des temps</strong> : 50 µs/div',
            '<strong>Relevé de la tension</strong> : mesurée directement avec un calibre de 2 V/div',
            '<strong>Relevé du courant</strong> : mesuré avec une sonde 100 mV/A et un calibre de 5 mV/div'
          ] },
          { liste: [
            'Déterminer la période, la fréquence et la pulsation des grandeurs relevées.',
            'La charge est-elle de type inductif ou capacitif ? Justifier. Quel sera le signe du déphasage ?',
            'Déterminer la valeur du déphasage.',
            'Déterminer la valeur maximale et la valeur efficace de $v$.',
            'Déterminer la valeur maximale et la valeur efficace de $i$.',
            'En prenant $i$ comme origine des phases : 6.1 Réaliser la représentation de Fresnel de $i$ et $v$ (échelles : 10 mA/cm et 1 V/cm). 6.2 En déduire l\'écriture algébrique de $i$ et $v$.',
            'En prenant $v$ comme origine des phases : 7.1 Réaliser la représentation de Fresnel de $i$ et $v$ (échelles : 10 mA/cm et 1 V/cm). 7.2 En déduire l\'écriture algébrique de $i$ et $v$.'
          ], ordonnee: true },
          { reponses: 'Ex3 : 1. → 200 µs ; 5 kHz ; 31 400 rad·s⁻¹ — 3. → −27° — 4. → 4,6 V ; 3,25 V — 5. → 85 mA ; 49 mA' },
          { note: 'Remarque du site sur l\'exercice 3, question 5 : la lecture de l\'oscillogramme confirme $I_{max}$ ≈ 85 mA (environ 1,7 div × 5 mV/div = 8,5 mV, soit 85 mA avec la sonde 100 mV/A), dont la valeur efficace est $frac(85;sqrt(2))$ ≈ 60 mA. Le polycopié indique 49 mA : écart, à vérifier.' }
        ]
      }
    ],
    formules: [
      { id: 'ch04Def', groupe: 'Définition', nom: 'Déphasage φ', expr: 'φ : déphasage de i par rapport à v', quand: '$φ &gt; 0$ : $i$ en retard sur $v$ (inductif) ; $φ &lt; 0$ : $i$ en avance (capacitif) ; $φ = 0$ : en phase (résistif).' },
      { id: 'ch04Seuil', groupe: 'Définition', nom: 'Déphasage toléré', expr: 'φ &lt; 0,38 rad (21,5°)', quand: 'En dessous, pas de surtaxe du fournisseur d\'électricité.' },
      { id: 'ch04PhiRad', groupe: 'Mesure du déphasage', nom: 'Déphasage en radians', expr: '|φ| = frac(2π × Δt;T)', quand: '$Δt$ : décalage entre deux maxima ou deux passages par zéro de même nature. Signe : + si $i$ en retard.' },
      { id: 'ch04PhiDeg', groupe: 'Mesure du déphasage', nom: 'Déphasage en degrés', expr: '|φ| = frac(360 × Δt;T)', quand: 'Même $Δt$ et même $T$, en secondes.' },
      { id: 'ch04Batterie', groupe: 'Compensation', nom: 'Batterie de condensateurs', expr: 'C = C_1 + C_2 + C_3 + …', quand: 'Condensateurs en parallèle ; branchée en parallèle sur l\'installation inductive, elle réduit $φ$.' },
      { id: 'ch04Freq', groupe: 'Rappels (ajoutés, hors polycopié)', nom: 'Fréquence et pulsation', expr: 'f = frac(1;T)  ;  ω = 2πf = frac(2π;T)', quand: 'f en Hz, T en s, ω en rad/s.' },
      { id: 'ch04Eff', groupe: 'Rappels (ajoutés, hors polycopié)', nom: 'Valeur efficace d\'une sinusoïde', expr: 'V = frac(V_{max};sqrt(2))', quand: 'De même $I = frac(I_{max};sqrt(2))$.' },
      { id: 'ch04Ecriture', groupe: 'Rappels (ajoutés, hors polycopié)', nom: 'Écriture algébrique', expr: 'v = V sqrt(2) sin(ωt)  ;  i = I sqrt(2) sin(ωt − φ)', quand: '$v$ origine des phases. Avec $i$ origine des phases : $i = I sqrt(2) sin(ωt)$ et $v = V sqrt(2) sin(ωt + φ)$.' },
      { id: 'ch04Oscillo', groupe: 'Rappels (ajoutés, hors polycopié)', nom: 'Lecture d\'un oscillogramme', expr: 'grandeur = nombre de div × calibre', quand: 'Puis diviser par la sensibilité de la sonde (ex. 100 mV/A) ou multiplier par son rapport (ex. sonde 1/20).' }
    ]
  });
})(typeof window !== 'undefined' ? window.PE : globalThis.PE);
