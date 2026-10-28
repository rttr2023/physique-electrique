// CH01 — résultats numériques repris du polycopié (exemple du principe de superposition).
module.exports = function (PE, proche) {
  const K = PE.circuit;
  const E = 10, I = 0.5, R = 50, R1 = 30;
  // Étape 1 : E seule, diviseur de tension sur R1 + R
  const s1 = K.resoudreDC({ regime: 'DC', V: E, charge: K.serie(K.R(R1, 'R1'), K.R(R, 'R')) });
  const nR = s1.feuilles.filter(function (f) { return f.nom === 'R'; })[0];
  proche('superposition étape 1 : U\'', s1.tinf.info.get(nR).V, 6.25);
  proche('superposition étape 1 : diviseur', R / (R + R1) * E, 6.25);
  // Étape 2 : I seule, R // R1
  const Req = R * R1 / (R + R1);
  proche('superposition étape 2 : Req', Req, 18.75);
  const s2 = K.resoudreDC({ regime: 'DC', V: 1, charge: K.par(K.R(R, 'R'), K.R(R1, 'R1')) });
  proche('superposition étape 2 : Req (moteur)', s2.tinf.Req, 18.75);
  proche('superposition étape 2 : U"', Req * I, 9.38);
  // Étape 3 : somme, recoupée par la loi des nœuds (millman) sur le montage complet
  proche('superposition étape 3 : U', R / (R + R1) * E + Req * I, 15.6);
  proche('superposition : U par Millman', (E / R1 + I) / (1 / R1 + 1 / R), 15.6);
  proche('superposition étape 2 : U" arrondi', 18.75 * 0.5, 9.38, 0.001);
  // Cas particuliers des associations en dérivation (cohérence des relations encadrées)
  proche('dérivation : produit sur somme = formule générale', 30 * 50 / (30 + 50), 1 / (1 / 30 + 1 / 50));
  proche('dérivation : n résistances identiques R/n', 1 / (1 / 60 + 1 / 60 + 1 / 60), 60 / 3);
  // Exemple du diviseur de tension (valeurs arbitraires : le polycopié ne donne pas de valeurs)
  const r1 = 100, r2 = 220, r3 = 330, Ed = 12;
  const sd = K.resoudreDC({ regime: 'DC', V: Ed, charge: K.serie(K.R(r1, 'R1'), K.R(r2, 'R2'), K.R(r3, 'R3')) });
  function tension(nom) { return sd.tinf.info.get(sd.feuilles.filter(function (f) { return f.nom === nom; })[0]).V; }
  const Vd = (r2 + r3) / (r1 + r2 + r3) * Ed;
  proche('diviseur : U = R1/(R1+R2+R3) E', tension('R1'), r1 / (r1 + r2 + r3) * Ed);
  proche('diviseur : V = (R2+R3)/(R1+R2+R3) E', tension('R2') + tension('R3'), Vd);
  proche('diviseur : W = R3/(R1+R2+R3) E', tension('R3'), r3 / (r1 + r2 + r3) * Ed);
  proche('diviseur : W = R3/(R2+R3) V', tension('R3'), r3 / (r2 + r3) * Vd);
};
