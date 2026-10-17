// CH05 — résultats numériques repris du polycopié (cours, TD, exercices supplémentaires en continu).
module.exports = function (PE, proche) {
  const K = PE.circuit;
  let s = K.resoudreAC({ regime: 'AC', V: 230, f: 50, charge: K.serie(K.R(12, 'r'), K.L(1.1, 'L')) });
  proche('cours bobine Z', s.Zmod, 346); proche('cours bobine phi', s.phiDeg, 88); proche('cours bobine I', s.Ieff, 0.667);
  s = K.resoudreAC({ regime: 'AC', V: 24, f: 50, charge: K.L(12e-3, 'L') });
  proche('TD5 ex1.1 Z', s.Zmod, 3.77); proche('TD5 ex1.1 I', s.Ieff, 6.37);
  s = K.resoudreAC({ regime: 'AC', V: 24, f: 1000, charge: K.Cap(100e-9, 'C') });
  proche('TD5 ex2.2 Z', s.Zmod, 1590); proche('TD5 ex2.2 I', s.Ieff, 15.1e-3);
  s = K.resoudreAC({ regime: 'AC', V: 24, f: 50, charge: K.serie(K.R(11, 'r'), K.L(0.1, 'L')) });
  proche('TD5 ex3 Z', s.Zmod, 33.3); proche('TD5 ex3 I', s.Ieff, 0.720); proche('TD5 ex3 phi', s.phiDeg, 70.7);
  const ex4 = { regime: 'AC', V: 12, f: 200e3, charge: K.serie(K.L(6.8e-3, 'L'), K.Cap(142e-12, 'C'), K.R(1000, 'R')) };
  s = K.resoudreAC(ex4);
  proche('TD5 ex4 I', s.Ieff, 3.86e-3, 0.03); proche('TD5 ex4 phi', s.phiDeg, 71, 0.02);
  proche('TD5 ex4 VL', s.info.get(ex4.charge.children[0]).Veff, 33, 0.03);
  s = K.resoudreDC({ regime: 'DC', V: 24, charge: K.serie(K.R(10, 'R1'), K.par(K.R(20, 'R2'), K.Cap(1e-3, 'C'))) });
  proche('ExA Req0', s.t0.Req, 10); proche('ExA Reqinf', s.tinf.Req, 30); proche('ExA I0', s.t0.I, 2.4); proche('ExA Iinf', s.tinf.I, 0.8);
  proche('ExA Vc inf', s.tinf.info.get(s.reactifs[0]).V, 16); proche('ExA tau', s.tau, 6.667e-3);
  s = K.resoudreDC({ regime: 'DC', V: 24, charge: K.serie(K.R(10, 'R1'), K.par(K.R(20, 'R2'), K.L(0.1, 'L'))) });
  proche('ExB Req0', s.t0.Req, 30); proche('ExB Iinf', s.tinf.I, 2.4); proche('ExB IL inf', s.tinf.info.get(s.reactifs[0]).I, 2.4); proche('ExB tau', s.tau, 0.015);
};
