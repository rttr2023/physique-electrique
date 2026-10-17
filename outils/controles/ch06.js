// CH06 — résultats numériques repris du TD.
module.exports = function (PE, proche) {
  const K = PE.circuit;
  const ex2 = { regime: 'AC', V: 230, f: 50, charge: K.par(K.Cap(470e-6, 'C'), K.serie(K.R(3.33, 'R'), K.L(13.3e-3, 'L'))) };
  const s = K.resoudreAC(ex2);
  proche('TD6 ex2 I1', s.info.get(ex2.charge.children[1]).Ieff, 43.1); proche('TD6 ex2 I', s.Ieff, 26.9);
  proche('Boucherot S = VI', s.S, s.V * s.Ieff, 1e-9);
  proche('P = VI cos phi', s.P, s.V * s.Ieff * Math.cos(s.phi), 1e-9);
};
