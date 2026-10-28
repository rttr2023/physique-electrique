// CH04 — résultats numériques repris du polycopié (Annexe 1, éléments de réponse du TD).
// Les lectures en divisions et en cm ne sont pas imprimées dans l'énoncé : ce sont celles qui
// redonnent les éléments de réponse (et qui concordent avec les scans, à la précision de la photo).
module.exports = function (PE, proche, vrai) {
  const r2 = Math.SQRT2;
  const deg = function (dt, T) { return 360 * dt / T; };

  // Annexe 1, document 2 : 0,38 rad ≈ 21,5° (calcul : 21,8°, d'où la tolérance de 2 %).
  proche('Doc 2 : 0,38 rad en degrés', 0.38 * 180 / Math.PI, 21.5, 0.02);
  proche('Doc 2 : note du site, 0,38 rad = 21,8°', 0.38 * 180 / Math.PI, 21.8, 0.002);
  // Document 4 : les deux formules donnent le même angle.
  proche('Doc 4 : rad et degrés cohérents', 2 * Math.PI * 3e-3 / 20e-3 * 180 / Math.PI, deg(3e-3, 20e-3), 1e-9);

  // TD ex 1 : échelles 30 V/cm et 2 A/cm (longueurs mesurées sur la feuille imprimée).
  proche('TD ex1.1-2 V (3,4 cm)', 3.4 * 30, 102); proche('TD ex1.1-2 I (2 cm)', 2 * 2, 4);
  proche('TD ex1.3-4 V (2,9 cm)', 2.9 * 30, 87); proche('TD ex1.3-4 I (1,7 cm)', 1.7 * 2, 3.4);
  vrai('TD ex1.3-4 rapport V/I des vecteurs (photo ≈ 1,65)', Math.abs((2.9 / 1.7) - 1.65) < 0.1);

  // TD ex 2 : 5 ms/div ; sonde 1/20 et 2 V/div ; sonde 100 mV/A et 50 mV/div.
  const T2 = 4 * 5e-3;                       // période sur 4 divisions
  proche('TD ex2 T', T2, 20e-3); proche('TD ex2 f', 1 / T2, 50); proche('TD ex2 omega', 2 * Math.PI / T2, 314);
  proche('TD ex2 phi (Δt = 0,6 div)', deg(0.6 * 5e-3, T2), 54);
  const Vm2 = 1.8 * 2 * 20;                  // 1,8 div
  proche('TD ex2 Vmax', Vm2, 72); proche('TD ex2 Veff', Vm2 / r2, 50.9);
  const Im2 = 1.4 * 50e-3 / 0.1;             // 1,4 div
  proche('TD ex2 Imax', Im2, 0.7); proche('TD ex2 Ieff', Im2 / r2, 0.495);

  // TD ex 3 : 50 µs/div ; 2 V/div en direct ; sonde 100 mV/A et 5 mV/div.
  const T3 = 4 * 50e-6;
  proche('TD ex3 T', T3, 200e-6); proche('TD ex3 f', 1 / T3, 5000); proche('TD ex3 omega', 2 * Math.PI / T3, 31400);
  proche('TD ex3 |phi| (Δt = 0,3 div)', deg(0.3 * 50e-6, T3), 27);
  const Vm3 = 2.3 * 2;
  proche('TD ex3 Vmax', Vm3, 4.6); proche('TD ex3 Veff', Vm3 / r2, 3.25);
  const Im3 = 1.7 * 5e-3 / 0.1;
  proche('TD ex3 Imax', Im3, 0.085);
  // Écart signalé : le polycopié donne Ieff = 49 mA, or 85 mA / √2 = 60,1 mA ; 49 mA = 85 mA / √3.
  proche('TD ex3 Ieff recalculé', Im3 / r2, 0.0601);
  proche('TD ex3 note du site : 85 mA / √2 ≈ 60 mA', 0.085 / r2, 0.060, 0.01);
  proche('TD ex3 mesure Imax : 8,5 mV avec sonde 100 mV/A', 8.5e-3 / 0.1, 0.085);
  proche('TD ex3 phi en rad cohérent avec 27°', 2 * Math.PI * (0.3 * 50e-6) / T3 * 180 / Math.PI, 27);
  vrai('TD ex3 Ieff du polycopié (49 mA) = Imax/√3, pas Imax/√2', Math.abs(Im3 / Math.sqrt(3) - 0.049) < 0.0005 && Math.abs(Im3 / r2 - 0.049) > 0.01);
};
