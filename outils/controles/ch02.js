// CH02 — le polycopié ne contient aucun résultat numérique (cours qualitatif et expériences en vidéo).
// Les contrôles ci-dessous vérifient donc :
//  1. la fidélité de la transcription (parties dans l'ordre, formules encadrées, signes du récapitulatif) ;
//  2. des illustrations numériques de la remarque du §2. Les valeurs (230 V, 50 Hz, 0,1 H, 24 V, 10 Ω)
//     sont choisies ici pour l'exemple : le cours affirme seulement, sans calcul, qu'on peut démontrer
//     Z = Lω en sinusoïdal et que l'inductance équivaut à un fil en continu.
module.exports = function (PE, proche, vrai) {
  const ch = PE.cours.filter(function (c) { return c.id === 'ch02'; })[0];
  vrai('chapitre ch02 chargé', !!ch);
  if (!ch) return;

  // Parties du polycopié : introduction puis questions 1 à 10, dans l'ordre.
  const titres = ch.sections.map(function (s) { return s.titre; });
  vrai('11 parties (introduction + questions 1 à 10)', titres.length === 11);
  for (let n = 1; n <= 10; n++) vrai('question ' + n + ' à sa place', titres[n].indexOf(n + '. ') === 0);

  // Expériences 1 à 4 et vidéos 1 à 4.
  const texte = JSON.stringify(ch.sections);
  for (let n = 1; n <= 4; n++) {
    vrai('schéma de l\'expérience ' + n, texte.indexOf('Schéma de l\'expérience ' + n) >= 0);
    vrai('vidéo n°' + n, texte.indexOf('vidéo n°' + n) >= 0);
  }
  vrai('lien padlet de la vidéo n°1', texte.indexOf('https://padlet.com/bts_holst/xyltjqtsf0sh') >= 0);

  // Seules les deux lois de Kirchhoff sont encadrées dans le polycopié.
  const cadres = [];
  ch.sections.forEach(function (s) { s.blocs.forEach(function (b) { if (b.f && b.cadre) cadres.push(b.f); }); });
  vrai('formules encadrées = lois des nœuds et des mailles', cadres.join(' | ') === 'Σ_k i_k = 0 | Σ_k v_k = 0');

  // Récapitulatif des conventions : p = v·i, signe → fonctionnement.
  function fonctionnement(convention, v, i) {
    const p = v * i;
    if (convention === 'recepteur') return p > 0 ? 'récepteur' : 'générateur';
    return p > 0 ? 'générateur' : 'récepteur';
  }
  vrai('convention générateur, p > 0 : fonctionnement en générateur', fonctionnement('generateur', 10, 2) === 'générateur');
  vrai('convention générateur, p < 0 : fonctionnement en récepteur', fonctionnement('generateur', 10, -2) === 'récepteur');
  vrai('convention récepteur, p > 0 : fonctionnement en récepteur', fonctionnement('recepteur', 10, 2) === 'récepteur');
  vrai('convention récepteur, p < 0 : fonctionnement en générateur', fonctionnement('recepteur', -10, 2) === 'générateur');

  // Illustration (valeurs choisies, pas tirées du cours) de la remarque du §2.
  const K = PE.circuit;
  const s = K.resoudreAC({ regime: 'AC', V: 230, f: 50, charge: K.L(0.1, 'L') });
  proche('illustration remarque §2 (valeurs choisies) : Z = Lω en sinusoïdal', s.Zmod, 0.1 * 2 * Math.PI * 50);
  const d = K.resoudreDC({ regime: 'DC', V: 24, charge: K.serie(K.R(10, 'R'), K.L(0.1, 'L')) });
  proche('illustration remarque §2 (valeurs choisies) : L équivaut à un fil en continu', d.tinf.Req, 10);
  vrai('illustration remarque §2 (valeurs choisies) : tension nulle aux bornes de L en continu', Math.abs(d.tinf.info.get(d.reactifs[0]).V) < 1e-9);
};
