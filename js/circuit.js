// Modèle de circuit : une source + une charge décrite par un arbre série / parallèle.
//   feuille : { type: 'R' | 'L' | 'C', nom, val }   (val en Ω, H ou F)
//   groupe  : { type: 'serie' | 'par', children: [...] }
//   circuit : { regime: 'AC' | 'DC', V, f, charge }
(function (root) {
  'use strict';
  const PE = root.PE;
  const C = PE.C;
  const K = PE.circuit = {};

  K.R = function (val, nom) { return { type: 'R', val: val, nom: nom }; };
  K.L = function (val, nom) { return { type: 'L', val: val, nom: nom }; };
  K.Cap = function (val, nom) { return { type: 'C', val: val, nom: nom }; };
  K.serie = function () { return { type: 'serie', children: Array.prototype.slice.call(arguments) }; };
  K.par = function () { return { type: 'par', children: Array.prototype.slice.call(arguments) }; };
  K.estFeuille = function (n) { return n.type === 'R' || n.type === 'L' || n.type === 'C'; };
  K.UNITE = { R: 'Ω', L: 'H', C: 'F' };

  K.feuilles = function (n, acc) {
    acc = acc || [];
    if (!n) return acc;
    if (K.estFeuille(n)) acc.push(n);
    else n.children.forEach(function (c) { K.feuilles(c, acc); });
    return acc;
  };

  // Donne un nom (R1, L1, C1...) aux feuilles qui n'en ont pas.
  K.nommer = function (n) {
    const pris = {};
    const fs = K.feuilles(n);
    fs.forEach(function (f) { if (f.nom) pris[f.nom] = 1; });
    const cpt = { R: 0, L: 0, C: 0 };
    fs.forEach(function (f) {
      if (f.nom) return;
      do { cpt[f.type]++; } while (pris[f.type + cpt[f.type]]);
      f.nom = f.type + cpt[f.type];
      pris[f.nom] = 1;
    });
    return n;
  };

  // Supprime les groupes vides, déplie les groupes à un seul enfant, aplatit
  // série-dans-série et parallèle-dans-parallèle. Les feuilles sont conservées (mêmes objets).
  K.normaliser = function (n) {
    if (!n) return null;
    if (K.estFeuille(n)) return n;
    const ch = [];
    n.children.forEach(function (c) {
      const m = K.normaliser(c);
      if (!m) return;
      if (m.type === n.type) Array.prototype.push.apply(ch, m.children);
      else ch.push(m);
    });
    if (!ch.length) return null;
    if (ch.length === 1) return ch[0];
    return { type: n.type, children: ch };
  };

  // "R1 + (L1 // C1)"
  K.decrire = function (n, racine) {
    if (K.estFeuille(n)) return n.nom;
    const s = n.children.map(function (c) { return K.decrire(c, false); })
      .join(n.type === 'serie' ? ' + ' : ' // ');
    return racine === false ? '(' + s + ')' : s;
  };

  K.copier = function (n) { return JSON.parse(JSON.stringify(n)); };

  // ---------- Régime sinusoïdal ----------
  K.resoudreAC = function (circuit) {
    const charge = circuit.charge;
    if (!charge) return { ok: false, erreur: 'Le schéma ne contient aucun dipôle.' };
    if (!(circuit.V > 0) || !(circuit.f > 0)) return { ok: false, erreur: 'La tension et la fréquence de la source doivent être positives.' };
    const fs = K.feuilles(charge);
    for (let i = 0; i < fs.length; i++) {
      if (!(fs[i].val > 0)) return { ok: false, erreur: 'La valeur de ' + fs[i].nom + ' doit être positive.' };
    }
    const w = 2 * Math.PI * circuit.f;
    const info = new Map();

    function z(n) {
      let r;
      if (n.type === 'R') r = C.c(n.val, 0);
      else if (n.type === 'L') r = C.c(0, n.val * w);
      else if (n.type === 'C') r = C.c(0, -1 / (n.val * w));
      else if (n.type === 'serie') r = n.children.map(z).reduce(C.add);
      else r = C.inv(n.children.map(function (c) { return C.inv(z(c)); }).reduce(C.add));
      info.set(n, { Z: r });
      return r;
    }
    const Z = z(charge);
    if (!(C.abs(Z) > 1e-12) || !isFinite(C.abs(Z))) {
      return { ok: false, erreur: 'L\'impédance équivalente est nulle (résonance sans résistance) : le courant serait infini.' };
    }
    const bad = Array.from(info.values()).some(function (o) { return !isFinite(C.abs(o.Z)); });
    if (bad) return { ok: false, erreur: 'Une branche a une impédance nulle (résonance sans résistance) : calcul impossible.' };

    function repartir(n, V, I) {
      const o = info.get(n);
      o.V = V; o.I = I; o.Veff = C.abs(V); o.Ieff = C.abs(I);
      if (n.type === 'serie') n.children.forEach(function (c) { repartir(c, C.mul(I, info.get(c).Z), I); });
      else if (n.type === 'par') n.children.forEach(function (c) { repartir(c, V, C.div(V, info.get(c).Z)); });
      else {
        o.P = n.type === 'R' ? n.val * o.Ieff * o.Ieff : 0;
        o.Q = n.type === 'L' ? n.val * w * o.Ieff * o.Ieff : (n.type === 'C' ? -o.Ieff * o.Ieff / (n.val * w) : 0);
      }
    }
    const V = C.c(circuit.V, 0);
    const I = C.div(V, Z);
    repartir(charge, V, I);

    let P = 0, Q = 0;
    fs.forEach(function (f) { P += info.get(f).P; Q += info.get(f).Q; });
    const S = Math.hypot(P, Q);
    const phi = C.arg(Z);
    const Ieff = C.abs(I);
    return {
      ok: true, regime: 'AC', omega: w, V: circuit.V, f: circuit.f,
      Z: Z, Zmod: C.abs(Z), I: I, Ieff: Ieff,
      phi: phi, phiDeg: phi * 180 / Math.PI,
      P: P, Q: Q, S: S, k: S > 0 ? P / S : 1,
      nature: Math.abs(Q) < 1e-9 * Math.max(S, 1e-12) ? 'résistif' : (Q > 0 ? 'inductif' : 'capacitif'),
      info: info, feuilles: fs
    };
  };

  // ---------- Régime continu : états à t = 0+ et t -> infini ----------
  // t = 0+ : condensateur déchargé = fil, bobine = circuit ouvert.
  // t -> ∞ : condensateur = circuit ouvert, bobine = fil.
  function etatDC(circuit, instant) {
    const info = new Map();
    function r(n) {
      let v;
      if (n.type === 'R') v = n.val;
      else if (n.type === 'C') v = instant === '0' ? 0 : Infinity;
      else if (n.type === 'L') v = instant === '0' ? Infinity : 0;
      else if (n.type === 'serie') v = n.children.map(r).reduce(function (a, b) { return a + b; }, 0);
      else {
        const rs = n.children.map(r);
        if (rs.some(function (x) { return x === 0; })) v = 0;
        else {
          const g = rs.reduce(function (a, x) { return a + (isFinite(x) ? 1 / x : 0); }, 0);
          v = g === 0 ? Infinity : 1 / g;
        }
      }
      info.set(n, { R: v });
      return v;
    }
    const Req = r(circuit.charge);
    function repartir(n, V, I) {
      const o = info.get(n);
      o.V = V; o.I = I;
      if (n.type === 'serie') {
        const ouverts = n.children.filter(function (c) { return !isFinite(info.get(c).R); });
        n.children.forEach(function (c) {
          const rc = info.get(c).R;
          if (ouverts.length) repartir(c, isFinite(rc) ? 0 : V / ouverts.length, 0);
          else repartir(c, I * rc, I);
        });
      } else if (n.type === 'par') {
        const fils = n.children.filter(function (c) { return info.get(c).R === 0; });
        n.children.forEach(function (c) {
          const rc = info.get(c).R;
          if (fils.length) repartir(c, 0, rc === 0 ? I / fils.length : 0);
          else repartir(c, V, isFinite(rc) ? V / rc : 0);
        });
      }
    }
    const I = Req === 0 ? Infinity : (isFinite(Req) ? circuit.V / Req : 0);
    repartir(circuit.charge, Req === 0 ? 0 : circuit.V, I);
    return { Req: Req, I: I, info: info };
  }

  K.resoudreDC = function (circuit) {
    const charge = circuit.charge;
    if (!charge) return { ok: false, erreur: 'Le schéma ne contient aucun dipôle.' };
    if (!(circuit.V > 0)) return { ok: false, erreur: 'La tension E de la source doit être positive.' };
    const fs = K.feuilles(charge);
    for (let i = 0; i < fs.length; i++) {
      if (!(fs[i].val > 0)) return { ok: false, erreur: 'La valeur de ' + fs[i].nom + ' doit être positive.' };
    }
    const t0 = etatDC(circuit, '0');
    const tinf = etatDC(circuit, 'inf');
    if (t0.Req === 0 || tinf.Req === 0) {
      return {
        ok: false,
        erreur: 'La source est en court-circuit ' + (t0.Req === 0 ? 'à t = 0⁺' : 'en régime permanent') +
          ' : il faut au moins une résistance en série avec ' + (t0.Req === 0 ? 'le condensateur.' : 'la bobine.')
      };
    }
    const reactifs = fs.filter(function (f) { return f.type !== 'R'; });
    let tau = null, Rth = null;
    if (reactifs.length === 1) {
      const x = reactifs[0];
      if (x.type === 'C') {
        const voc = tinf.info.get(x).V, icc = t0.info.get(x).I;
        if (icc > 0 && isFinite(icc)) { Rth = voc / icc; tau = Rth * x.val; }
      } else {
        const voc = t0.info.get(x).V, icc = tinf.info.get(x).I;
        if (icc > 0 && isFinite(icc) && voc > 0) { Rth = voc / icc; tau = x.val / Rth; }
      }
    }
    return { ok: true, regime: 'DC', V: circuit.V, t0: t0, tinf: tinf, feuilles: fs, reactifs: reactifs, tau: tau, Rth: Rth };
  };

  K.resoudre = function (circuit) {
    return circuit.regime === 'DC' ? K.resoudreDC(circuit) : K.resoudreAC(circuit);
  };

  // ---------- Génération aléatoire ----------
  const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
  function alea(a, b) { return a + Math.random() * (b - a); }
  function choix(t) { return t[Math.floor(Math.random() * t.length)]; }
  function arr2(x) { return Number(x.toPrecision(2)); }
  K.choix = choix; K.alea = alea; K.arr2 = arr2;

  K.aleatoire = function (niveau, regime) {
    niveau = niveau || 1;
    if (regime === 'DC') return aleatoireDC(niveau);
    const V = choix([24, 48, 230, 230, 230, 400]);
    const f = niveau === 1 ? 50 : choix([50, 50, 50, 60, 400, 1000]);
    const w = 2 * Math.PI * f;
    const R = function () { return K.R(choix(E12) * choix([1, 1, 10])); };
    // Réactance du même ordre de grandeur que la résistance de référence.
    const L = function (ref) { return K.L(arr2(ref * alea(0.4, 2.5) / w)); };
    const Cp = function (ref) { return K.Cap(arr2(1 / (ref * alea(0.4, 2.5) * w))); };
    const r = R(), r2 = R(), r3 = R();
    const ref = r.val;
    const modeles = {
      1: [
        function () { return r; },
        function () { return L(ref); },
        function () { return Cp(ref); },
        function () { return K.serie(r, L(ref)); },
        function () { return K.serie(r, L(ref)); },
        function () { return K.serie(r, Cp(ref)); }
      ],
      2: [
        function () { return K.serie(r, L(ref), Cp(ref)); },
        function () { return K.par(r, L(ref)); },
        function () { return K.par(r, Cp(ref)); },
        function () { return K.par(Cp(ref * 2), K.serie(r, L(ref))); },
        function () { return K.par(r, L(ref), Cp(ref)); }
      ],
      3: [
        function () { return K.serie(r, L(ref / 3), K.par(r2, L(r2.val))); },
        function () { return K.serie(r, K.par(r2, Cp(r2.val)), L(ref)); },
        function () { return K.par(K.serie(r, L(ref)), K.serie(r2, Cp(r2.val))); },
        function () { return K.serie(r, L(ref / 2), K.par(r2, L(r2.val), r3)); },
        function () { return K.par(Cp(ref * 2), K.serie(r, L(ref)), r2); },
        function () { return K.serie(r, K.par(K.serie(r2, L(r2.val)), Cp(r2.val * 2))); }
      ]
    };
    const charge = K.nommer(K.normaliser(choix(modeles[niveau] || modeles[3])()));
    return { regime: 'AC', V: V, f: f, charge: charge };
  };

  function aleatoireDC(niveau) {
    const V = choix([12, 24, 48]);
    const R = function () { return K.R(choix([10, 15, 20, 22, 33, 47, 68, 100, 150, 220])); };
    const Cp = function () { return K.Cap(choix([100e-6, 220e-6, 470e-6, 1000e-6])); };
    const L = function () { return K.L(choix([0.05, 0.1, 0.2, 0.5, 1])); };
    const X = function () { return Math.random() < 0.5 ? Cp() : L(); };
    const modeles = {
      1: [
        function () { return K.serie(R(), Cp()); },
        function () { return K.serie(R(), L()); },
        function () { return K.serie(R(), K.par(R(), X())); }
      ],
      2: [
        function () { return K.serie(R(), K.par(R(), X())); },
        function () { return K.par(K.serie(R(), X()), R()); },
        function () { return K.serie(R(), R(), K.par(R(), X())); }
      ],
      3: [
        function () { return K.serie(R(), K.par(R(), K.serie(R(), X()))); },
        function () { return K.serie(R(), K.par(R(), R(), X())); },
        function () { return K.serie(R(), K.par(R(), X()), R()); }
      ]
    };
    const charge = K.nommer(K.normaliser(choix(modeles[niveau] || modeles[3])()));
    return { regime: 'DC', V: V, f: 0, charge: charge };
  }
})(typeof window !== 'undefined' ? window : globalThis);
