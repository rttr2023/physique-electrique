// CH03 — résultats numériques repris du polycopié (recalculés par intégration numérique sur une période).
module.exports = function (PE, proche, vrai) {
  const N = 100000;
  function moy(fn) { let s = 0; for (let k = 0; k < N; k++) s += fn((k + 0.5) / N); return s / N; } // t en fraction de période
  function eff(fn) { return Math.sqrt(moy(function (t) { return fn(t) * fn(t); })); }

  // Document 3 : courant sinusoïdal de valeur maximale 2 A → valeur efficace 1,41 A (U = √<u²>).
  const sinus = function (t) { return 2 * Math.sin(2 * Math.PI * t); };
  proche('doc 3 : efficace d\'un sinus de 2 A max', eff(sinus), 1.41);
  vrai('doc 1 : le sinus est alternatif (moyenne nulle)', Math.abs(moy(sinus)) < 1e-9);

  // Document 1 : créneaux symétriques → aires égales, valeur moyenne nulle.
  const creneau = function (t) { return t < 0.5 ? 5 : -5; };
  vrai('doc 1 : créneau symétrique de moyenne nulle', Math.abs(moy(creneau)) < 1e-9);

  // Document 5 : triangle autour de 2 V = composante continue (2 V) + ondulation de moyenne nulle.
  const tri = function (t) { return 2 + (t < 0.5 ? -0.5 + 2 * t : 1.5 - 2 * t); };
  proche('doc 5 : composante continue du triangle', moy(tri), 2);
  vrai('doc 5 : ondulation de moyenne nulle', Math.abs(moy(function (t) { return tri(t) - 2; })) < 1e-9);

  // Document 2 : f = 1/T pour les trois exemples (T = 0,8 µs ; 50 ms ; 30 s).
  proche('doc 2 : f pour T = 0,8 µs', 1 / 0.8e-6, 1.25e6);
  proche('doc 2 : f pour T = 50 ms', 1 / 50e-3, 20);
  proche('doc 2 : f pour T = 30 s', 1 / 30, 0.0333);
  // Document 2 : les périodes tombent sur des graduations entières des axes (0,1 µs ; 10 ms ; 5 s).
  vrai('doc 2 : T = 0,8 µs = 8 graduations de 0,1 µs', Math.abs(0.8 / 0.1 - 8) < 1e-9);
  vrai('doc 2 : T = 50 ms = 5 graduations de 10 ms', 50 % 10 === 0);
  vrai('doc 2 : T = 30 s = 6 graduations de 5 s', 30 % 5 === 0);
  // Document 2 : le courant triangulaire 0 → 2 mA et les impulsions 0 / 24 V ont une valeur moyenne non nulle (signaux continus au sens du doc 1).
  const triI = function (t) { return 2e-3 * (t < 0.5 ? 2 * t : 2 - 2 * t); };
  proche('doc 2 : moyenne du triangle 0 → 2 mA', moy(triI), 1e-3);
  vrai('doc 2 : impulsions 0 / 24 V de moyenne non nulle', moy(function (t) { return t < 0.5 ? 24 : 0; }) > 0);

  // Document 3 : définition physique — même puissance dans une résistance que le continu lissé de 1,41 A.
  const R = 10;
  proche('doc 3 : P(sinus 2 A max) = P(continu 1,41 A)', moy(function (t) { return R * sinus(t) * sinus(t); }), R * 1.41 * 1.41);
  proche('doc 3 : 2 A / √2 = 1,41 A', 2 / Math.SQRT2, 1.41);

  // Document 5 : la valeur efficace du signal complet (AC+DC) vaut √(<u>² + U_ond²) ; elle diffère de celle de l'ondulation seule (position AC).
  const Uond = eff(function (t) { return tri(t) - 2; });
  proche('doc 5 : efficace AC+DC = √(<u>² + U_ond²)', eff(tri), Math.sqrt(4 + Uond * Uond));
  vrai('doc 5 : position AC ≠ position AC+DC pour un signal non alternatif', eff(tri) - Uond > 1);
};
