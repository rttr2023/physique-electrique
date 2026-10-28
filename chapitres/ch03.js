// CH03 — Mesure de tension
// Transcription des scans listés dans `sources`. Format des blocs : voir outils/FORMAT-CHAPITRE.md
(function (PE) {
  PE.ajouterCours({
    id: 'ch03',
    annee: 1,
    numero: 3,
    titre: 'Mesure de tension',
    programme: '',
    resume: 'Signaux continus et alternatifs, grandeurs périodiques, valeurs moyenne et efficace, et choix du multimètre (non RMS, RMS, TRMS) et de sa position (DC, AC, AC+DC) pour mesurer une tension.',
    sources: ['A1-Ch03-p01.pdf', 'A1-Ch03-p02.pdf', 'A1-Ch03-p03.pdf'],
    objectifs: [],
    sections: [
      {
        id: 'familles',
        titre: 'Document 1 : Quelles sont les 2 grandes familles de signaux ?',
        court: 'Familles de signaux',
        blocs: [
          { p: 'Les signaux électriques (courant ou tension) y sont classés en deux familles : les signaux continus et les signaux alternatifs.' },
          { h: 'Les signaux alternatifs' },
          { p: 'Leur valeur moyenne est nulle : sur les formes d\'ondes cela se repère par des aires égales sous les alternances positives et négatives.' },
          { note: 'Forme d\'onde du polycopié (non dessinable ici) : tension $v_1$ (V) en créneaux, positive pendant la première demi-période puis négative pendant la seconde, de même amplitude ; les deux aires hachurées (au-dessus et au-dessous de l\'axe des temps, entre 0 et $T$) sont égales.' },
          { p: '<strong>Le signal sinusoïdal</strong> représente l\'idéal du signal alternatif. On cherche à l\'atteindre dans de nombreuses applications de l\'électrotechnique.' },
          { note: 'Forme d\'onde du polycopié : tension $v_2$ (V) sinusoïdale, centrée sur 0, de période $T$ (deux périodes représentées).' },
          { h: 'Les signaux continus' },
          { p: 'Tout signal sera considéré comme continu si sa valeur moyenne est non nulle et ce, même si la valeur instantanée n\'est pas constante.' },
          { note: 'Forme d\'onde du polycopié : tension $u_1$ (V) triangulaire, partant de 2 V (seule valeur indiquée sur l\'axe) et restant toujours positive : sa valeur moyenne est non nulle, c\'est donc un signal continu.' },
          { p: '<strong>Le signal continu parfaitement lissé</strong> représente l\'idéal du signal continu. Sa valeur instantanée est constante. On cherche à l\'atteindre dans de nombreuses applications de l\'électrotechnique.' },
          { note: 'Forme d\'onde du polycopié : tension $U_2$ (V) constante, représentée par une droite horizontale au-dessus de l\'axe des temps.' },
          { alerte: '<strong>Remarque :</strong> la définition du signal continu en électronique de puissance diffère de celle de l\'électronique classique. En effet, seuls les signaux parfaitement lissés sont considérés comme continus en électronique classique.' }
        ]
      },
      {
        id: 'periodique',
        titre: 'Document 2 : Qu\'est-ce qu\'une grandeur périodique ?',
        court: 'Grandeur périodique',
        blocs: [
          { p: '<strong>Une grandeur périodique</strong> est une grandeur qui se reproduit à l\'identique à intervalle de temps régulier. Cela se traduit sur la forme d\'onde par une répétition de motifs identiques. Le plus petit de ces motifs est appelé motif élémentaire.' },
          { p: '<strong>La période</strong> correspond à la durée d\'un motif élémentaire. On la note $T$ et son unité est la seconde (s).' },
          { h: 'Exemples de signaux périodiques' },
          {
            table: {
              tetes: ['Signal', 'Forme d\'onde (décrite)', 'Période'],
              lignes: [
                ['Tension $v$', 'créneaux entre 6 V et une valeur négative (non chiffrée sur le polycopié), axe des temps en µs (graduation 0,1)', '$T$ = 0,8 µs'],
                ['Tension $u$', 'impulsions rectangulaires de 24 V et 0 V, axe des temps en ms (graduation 10)', '$T$ = 50 ms'],
                ['Courant $i$', 'triangulaire entre 0 et 2 mA, axe des temps en s (graduation 5)', '$T$ = 30 s']
              ]
            }
          },
          { note: 'Sur le polycopié, le motif élémentaire de chaque exemple est surligné sur la forme d\'onde ; ces graphiques ne peuvent pas être redessinés ici.' },
          { p: '<strong>La fréquence</strong> d\'un signal correspond au nombre de périodes se produisant en une seconde. On la note $f$ et son unité est le hertz (Hz).' },
          { p: 'La fréquence et la période sont reliées par la relation suivante :' },
          { f: 'f = frac(1;T)', cadre: true, unites: 'f en Hz, T en s' }
        ]
      },
      {
        id: 'moyenne-efficace',
        titre: 'Document 3 : Valeur moyenne, valeur efficace : quand mesure-t-on plutôt l\'une que l\'autre ?',
        court: 'Valeur moyenne ou efficace',
        blocs: [
          { p: 'Pour un signal continu, c\'est la valeur moyenne qui sera mesurée. Elle est notée par une minuscule entre 2 crochets (exemples : $&lt;u&gt;$, $&lt;i&gt;$).' },
          { p: 'Pour un signal alternatif, la valeur moyenne étant nulle, on mesure une autre grandeur appelée valeur efficace. Elle est notée par une majuscule (exemples : $U$, $I$).' },
          { p: 'La définition mathématique de la valeur efficace correspond à la relation suivante :' },
          { f: 'U = sqrt(&lt;u^2&gt;)' },
          { p: 'Mais c\'est la définition physique qu\'il faut retenir : la valeur efficace est l\'équivalent du continu parfaitement lissé du point de vue de la puissance.' },
          { p: 'Prenons par exemple un courant sinusoïdal de valeur maximale 2 A. Si on mesure sa valeur efficace on trouvera 1,41 A : cela veut dire que ce courant sinusoïdal fournirait la même puissance à une résistance qu\'un courant continu parfaitement lissé de 1,41 A.' }
        ]
      },
      {
        id: 'multimetres-rms',
        titre: 'Document 4 : Caractéristiques des multimètres « non RMS » et « RMS »',
        court: 'Multimètres non RMS et RMS',
        blocs: [
          { p: 'En position DC, les multimètres « non RMS » et « RMS » sont capables de mesurer correctement les valeurs moyennes de tout type de signal périodique.' },
          { p: 'En position AC, un multimètre « non RMS » ne mesurera la valeur efficace correctement que si le signal est sinusoïdal. La valeur sera erronée pour tout autre signal, qu\'il soit alternatif ou non.' },
          { p: 'En position AC, un multimètre « RMS » ne mesurera la valeur efficace correctement que si le signal est alternatif. La valeur sera erronée pour tout signal non alternatif.' },
          { note: 'Récapitulatif (tableau absent du polycopié, qui reprend seulement les trois phrases ci-dessus) :' },
          {
            table: {
              tetes: ['Multimètre', 'Position DC', 'Position AC'],
              lignes: [
                ['« non RMS »', 'valeur moyenne correcte pour tout signal périodique', 'valeur efficace correcte seulement pour un signal sinusoïdal'],
                ['« RMS »', 'valeur moyenne correcte pour tout signal périodique', 'valeur efficace correcte seulement pour un signal alternatif']
              ]
            }
          }
        ]
      },
      {
        id: 'trms',
        titre: 'Document 5 : Caractéristiques des multimètres TRMS',
        court: 'Multimètres TRMS',
        blocs: [
          { p: 'Un multimètre TRMS (« True RMS » en anglais ; « Vrai RMS » ou « Valeur Efficace Vraie » en français) est capable de mesurer correctement la valeur moyenne et la valeur efficace de tout type de signal périodique.' },
          { p: 'Tout signal périodique de valeur instantanée $u$ peut être décomposé en une <strong>composante continue</strong> égale à sa valeur moyenne $&lt;u&gt;$ et une <strong>composante alternative</strong> (ou ondulation) de valeur moyenne nulle.' },
          { f: 'u = &lt;u&gt; + u_{ond}' },
          { note: 'Cette égalité n\'est pas écrite telle quelle dans le polycopié : c\'est la mise en équation de sa figure « signal complet = composante continue + composante alternative ». Figure du polycopié (non dessinable ici) : signal complet $u$ triangulaire oscillant autour de 2 V (pointillé à 2 V) = composante continue $&lt;u&gt;$ (droite horizontale, valeur moyenne) + composante alternative $u_{ond}$ (triangle centré sur 0, ondulation).' },
          { p: 'Un multimètre TRMS mesure :' },
          { liste: [
            'en position <strong>DC</strong> : la valeur moyenne ;',
            'en position <strong>AC</strong> : la valeur efficace de la composante alternative (fonction rarement utilisée) ;',
            'en position <strong>AC+DC</strong> : la valeur efficace du signal complet (celle qui nous intéresse).'
          ] },
          { note: '<strong>Remarque :</strong> tous les multimètres (non RMS, RMS ou TRMS) ont des limites de mesure en fréquence. Pour connaître cette limite, il faut se référer à la notice constructeur de l\'appareil.' }
        ]
      },
      {
        id: 'notations',
        titre: 'Document 6 : Écriture normalisée des différentes grandeurs',
        court: 'Écriture normalisée',
        blocs: [
          {
            table: {
              tetes: ['', 'Tension', 'Intensité de courant'],
              lignes: [
                ['Valeur instantanée', '$u$ ou $u(t)$', '$i$ ou $i(t)$'],
                ['Valeur efficace', '$U$', '$I$'],
                ['Valeur maximale', 'Û', 'Î'],
                ['Valeur minimale', 'Ǔ', 'Ǐ'],
                ['Valeur moyenne', '$&lt;u&gt;$ ou $&lt;u(t)&gt;$', '$&lt;i&gt;$ ou $&lt;i(t)&gt;$']
              ]
            }
          }
        ]
      },
      {
        id: 'voltmetre',
        titre: 'Document 7 : Utilisation d\'un multimètre en voltmètre',
        court: 'Multimètre en voltmètre',
        blocs: [
          { p: 'Vidéo « Comment connecter et régler un voltmètre ? » (3 min 30) : <a href="https://www.youtube.com/watch?v=KUKaT0goRnc" target="_blank" rel="noopener">https://www.youtube.com/watch?v=KUKaT0goRnc</a>' },
          { note: 'Le polycopié donne aussi un QR code menant à cette vidéo.' }
        ]
      }
    ],
    formules: [
      { id: 'ch03Frequence', groupe: 'Grandeurs périodiques', nom: 'Fréquence et période', expr: 'f = frac(1;T)', quand: 'f en Hz, T en s (durée d\'un motif élémentaire).' },
      { id: 'ch03Efficace', groupe: 'Valeurs moyenne et efficace', nom: 'Valeur efficace (définition mathématique)', expr: 'U = sqrt(&lt;u^2&gt;)', quand: 'Physiquement : la valeur du continu parfaitement lissé qui fournirait la même puissance à une résistance.' },
      { id: 'ch03Decomposition', groupe: 'Valeurs moyenne et efficace', nom: 'Composantes continue et alternative', expr: 'u = &lt;u&gt; + u_{ond}', quand: 'Mise en équation de la figure du document 5 (pas une formule écrite du cours). Composante continue = valeur moyenne ; ondulation de valeur moyenne nulle. TRMS : DC → &lt;u&gt;, AC → efficace de u_ond, AC+DC → efficace de u.' }
    ]
  });
})(typeof window !== 'undefined' ? window.PE : globalThis.PE);
