// CH02 — Les régimes variables quelconques
// Transcription des scans listés dans `sources`. Format des blocs : voir outils/FORMAT-CHAPITRE.md
(function (PE) {
  PE.ajouterCours({
    id: 'ch02',
    annee: 1,
    numero: 2,
    titre: 'Les régimes variables quelconques',
    programme: '',
    resume: 'Étudier les régimes transitoires avec les valeurs instantanées : relations tension-courant de R, L et C, conventions récepteur et générateur, lois de Kirchhoff et stockage d\'énergie.',
    sources: ['A1-Ch02-p01.pdf', 'A1-Ch02-p02.pdf', 'A1-Ch02-p03.pdf', 'A1-Ch02-p04.pdf'],
    objectifs: [],
    sections: [
      {
        id: 'intro',
        titre: 'Introduction',
        court: 'Introduction',
        blocs: [
          { p: 'Les régimes transitoires sont des régimes variables quelconques. Ils ne sont ni continus, ni sinusoïdaux, ni même périodiques. Par exemple, le régime correspondant à la charge d\'un condensateur est un régime variable quelconque. Quelles sont les relations et les lois qui permettent d\'étudier ces systèmes ?' }
        ]
      },
      {
        id: 'definition',
        titre: '1. Qu\'appelle-t-on régime variable quelconque ?',
        court: 'Régime variable quelconque',
        blocs: [
          { p: 'Les régimes étudiés dans ce chapitre sont quelconques : ils sont variables, mais de manière <strong>non périodique</strong>.' },
          { p: 'Cela correspond entre autres aux cas des <strong>régimes transitoires</strong>. Les outils utilisés en régime sinusoïdal (vecteurs de Fresnel, utilisation des nombres complexes) ne sont pas valables pour ce type de régime.' },
          { p: 'La décomposition en série de Fourier ne s\'applique pas non plus (elle est définie pour une fonction périodique).' },
          { p: 'Les valeurs moyennes et efficaces ne sont pas définies et n\'ont aucun sens pour ces régimes.' },
          { alerte: 'Tous les calculs doivent s\'effectuer directement avec les <strong>valeurs instantanées</strong>.' }
        ]
      },
      {
        id: 'dipoles',
        titre: '2. Quelles sont les relations tension/courant pour les dipôles de base en régime variable quelconque ?',
        court: 'Relations tension-courant',
        blocs: [
          { p: 'Sur les schémas du tableau, la tension $u$ et le courant $i$ de chaque dipôle sont fléchés en sens contraires (c\'est la convention récepteur du paragraphe 3).' },
          {
            table: {
              tetes: ['Dipôle', 'Relation tension-courant'],
              lignes: [
                ['Purement résistif (résistance R)', '$u = r i$ (le polycopié note $r$ la résistance $R$ du schéma)'],
                ['Purement capacitif (condensateur C)', '$i = C frac(du;dt)$'],
                ['Purement inductif (inductance L)', '$u = L frac(di;dt)$']
              ]
            }
          },
          { f: 'u = R i' },
          { f: 'i = C frac(du;dt)' },
          { f: 'u = L frac(di;dt)' },
          { note: 'Remarque : ces relations sont valables quel que soit le régime. Elles permettent par exemple de démontrer mathématiquement pour une inductance pure que $Z = Lω$ en sinusoïdal et qu\'elle est équivalente à un fil en continu.' }
        ]
      },
      {
        id: 'conventions',
        titre: '3. Qu\'est-ce que les conventions récepteurs et générateurs ?',
        court: 'Conventions récepteur / générateur',
        blocs: [
          { h: 'Convention générateur (utilisée naturellement pour les générateurs)' },
          { p: 'Tension et courant sont fléchés <strong>dans le même sens</strong> (la flèche de $v$ et la flèche de $i$ pointent du même côté du dipôle).' },
          { p: 'La puissance instantanée électrique associée au dipôle s\'écrit $p = v × i$ :' },
          { liste: ['si $p &gt; 0$ : le dipôle fournit de la puissance ;', 'si $p &lt; 0$ : le dipôle reçoit de la puissance.'] },
          { h: 'Convention récepteur (utilisée naturellement pour les récepteurs)' },
          { p: 'Tension et courant sont fléchés <strong>dans le sens contraire</strong>.' },
          { p: 'La puissance instantanée électrique associée au dipôle s\'écrit toujours $p = v × i$ :' },
          { liste: ['si $p &gt; 0$ : le dipôle reçoit de la puissance ;', 'si $p &lt; 0$ : le dipôle fournit de la puissance.'] },
          { h: 'Récapitulatif' },
          {
            table: {
              tetes: ['', 'Convention générateur', 'Convention récepteur'],
              lignes: [
                ['$p &gt; 0$', 'Fonctionnement en générateur', 'Fonctionnement en récepteur'],
                ['$p &lt; 0$', 'Fonctionnement en récepteur', 'Fonctionnement en générateur']
              ]
            }
          }
        ]
      },
      {
        id: 'kirchhoff',
        titre: '4. Qu\'est-ce que les lois de Kirchhoff ?',
        court: 'Lois de Kirchhoff',
        blocs: [
          { h: 'Définitions' },
          { liste: [
            '<strong>Nœud</strong> : connexion qui relie au moins 3 fils.',
            '<strong>Branche</strong> : portion de circuit comprise entre 2 nœuds consécutifs.',
            '<strong>Maille</strong> : association de branches en série composant un circuit fermé.'
          ] },
          { h: 'La loi des nœuds' },
          { p: 'En considérant tous les courants $i_k$ sortant et entrant dans un nœud, on a :' },
          { f: 'Σ_k i_k = 0', cadre: true },
          { p: 'En comptant positifs les courants entrant dans le nœud et négatifs les courants sortant du nœud.' },
          { h: 'La loi des mailles' },
          { p: 'En considérant toutes les tensions $v_k$ d\'une maille et en choisissant arbitrairement un sens (S) de parcours de la maille, alors :' },
          { f: 'Σ_k v_k = 0', cadre: true },
          { p: 'En comptant positives les tensions fléchées dans le sens de (S) et négatives les tensions fléchées dans le sens opposé.' }
        ]
      },
      {
        id: 'resistance',
        titre: '5. Une résistance peut-elle stocker de l\'énergie ?',
        court: 'Résistance et énergie',
        blocs: [
          { p: 'Les résistances ne peuvent pas emmagasiner de l\'énergie. Toute l\'énergie électrique reçue est dissipée instantanément sous forme de chaleur par effet Joule.' }
        ]
      },
      {
        id: 'condensateur',
        titre: '6. Un condensateur peut-il stocker de l\'énergie ?',
        court: 'Condensateur et énergie',
        blocs: [
          { h: 'Schéma de l\'expérience 1' },
          { p: 'Une source de tension (bornes + et −), un voltmètre et un condensateur $C$ sont branchés tous trois en dérivation. Une lampe est dessinée à part, sous le montage, sans être reliée au circuit.' },
          { p: '⇨ Voir vidéo n°1 (cliquez sur le lien ci-dessous) : <a href="https://padlet.com/bts_holst/xyltjqtsf0sh" target="_blank" rel="noopener">https://padlet.com/bts_holst/xyltjqtsf0sh</a>' }
        ]
      },
      {
        id: 'bobine',
        titre: '7. Une bobine peut-elle stocker de l\'énergie ?',
        court: 'Bobine et énergie',
        blocs: [
          { h: 'Schéma de l\'expérience 2' },
          { p: 'Une source de tension (bornes + et −) alimente, à travers un interrupteur, deux branches en dérivation :' },
          { liste: [
            'une bobine $L$ en série avec une lampe $L_1$ ;',
            'une diode en série avec une lampe $L_2$ ; sur le schéma, la cathode de la diode est tournée du côté de l\'interrupteur.'
          ] },
          { p: '⇨ Voir vidéo n°2' },
          { note: 'Lecture du schéma (interprétation, le polycopié ne le dit pas) : avec la cathode côté interrupteur, la diode est bloquée tant que l\'interrupteur est fermé ; elle ne peut conduire que dans le sens qui fait passer dans $L_2$ le courant de la bobine, une fois l\'interrupteur ouvert.' }
        ]
      },
      {
        id: 'condensateur-duree',
        titre: '8. Un condensateur peut-il stocker de l\'énergie dans la durée ?',
        court: 'Condensateur : stockage durable',
        blocs: [
          { p: '⇨ Revoir vidéo n°1' }
        ]
      },
      {
        id: 'bobine-duree',
        titre: '9. Une bobine peut-elle stocker de l\'énergie dans la durée ?',
        court: 'Bobine : stockage durable',
        blocs: [
          { h: 'Schéma de l\'expérience 3' },
          { p: 'Une source de tension (bornes + et −) est branchée directement aux bornes d\'une bobine $L$. Une lampe est dessinée à part, sous le montage, sans être reliée au circuit.' },
          { p: '⇨ Voir vidéo n°3' }
        ]
      },
      {
        id: 'bobine-energie',
        titre: '10. Que devient l\'énergie stockée dans la bobine lors de l\'expérience 3 ?',
        court: 'Devenir de l\'énergie de la bobine',
        blocs: [
          { h: 'Schéma de l\'expérience 4' },
          { p: 'Une source de tension (bornes + et −) alimente une bobine $L$ à travers un interrupteur (source, interrupteur et bobine en série).' },
          { p: '⇨ Voir vidéo n°4' },
          { note: 'Le polycopié ne rédige pas les réponses aux questions 6 à 10 : elles sont à tirer des vidéos d\'expérience.' }
        ]
      }
    ],
    formules: [
      { id: 'ch02UR', groupe: 'Relations tension-courant', nom: 'Résistance', expr: 'u = R i', quand: 'Valable quel que soit le régime, en valeurs instantanées (écrite u = ri dans le polycopié).' },
      { id: 'ch02IC', groupe: 'Relations tension-courant', nom: 'Condensateur', expr: 'i = C frac(du;dt)', quand: 'Valable quel que soit le régime, en convention récepteur.' },
      { id: 'ch02UL', groupe: 'Relations tension-courant', nom: 'Inductance pure', expr: 'u = L frac(di;dt)', quand: 'Valable quel que soit le régime, en convention récepteur.' },
      { id: 'ch02Pinst', groupe: 'Conventions', nom: 'Puissance instantanée', expr: 'p = v × i', quand: 'Convention récepteur : p &gt; 0 le dipôle reçoit. Convention générateur : p &gt; 0 le dipôle fournit.' },
      { id: 'ch02Noeuds', groupe: 'Lois de Kirchhoff', nom: 'Loi des nœuds', expr: 'Σ_k i_k = 0', quand: 'Courants entrant comptés positifs, sortant négatifs.' },
      { id: 'ch02Mailles', groupe: 'Lois de Kirchhoff', nom: 'Loi des mailles', expr: 'Σ_k v_k = 0', quand: 'Tensions fléchées dans le sens de parcours (S) positives, les autres négatives.' }
    ]
  });
})(typeof window !== 'undefined' ? window.PE : globalThis.PE);
