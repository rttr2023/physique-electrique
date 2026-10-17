// Générateur d'exercices.
//   exercice = { titre, chapitre, enonce (HTML), circuit (ou null), dessin (options de PE.dessin.circuit), questions }
//   question = { texte, valeur (SI), unite, attendu, uniteAff, tolAbs, formules: [ids], correction (HTML), parties }
//   parties : parties du cours travaillées ('ch05/inductif' = section d'id 'inductif' du chapitre ch05),
//   qui servent au tri des exercices selon les cases cochées dans le volet de gauche.
// Les problèmes « type TD » sont dans PE.exercices.problemes ; un nouveau chapitre peut en ajouter :
//   PE.exercices.problemes.push({ id, titre, chapitre, parties: [...], niveau: 1 | 2 | 3, generer() -> exercice })
(function (root) {
  'use strict';
  const PE = root.PE;
  const K = PE.circuit;
  const C = PE.C;
  const num = PE.num, fmt = PE.fmt, nm = PE.nomMath, M = PE.math;
  const X = PE.exercices = { problemes: [] };
  const choix = K.choix, alea = K.alea;

  function eq() { return '<div class="eq">' + M(Array.prototype.slice.call(arguments).join(' = ')) + '</div>'; }

  // Question à réponse numérique. La réponse est attendue dans l'unité affichée (avec préfixe).
  function q(texte, valeur, unite, formules, correction, opts) {
    opts = opts || {};
    const sansPrefixe = unite === '°' || unite === '';
    const g = sansPrefixe ? { e: 0, p: '' } : PE.eng(valeur);
    const k = Math.pow(10, g.e);
    return {
      texte: PE.texte(texte), valeur: valeur, unite: unite,
      attendu: valeur / k, uniteAff: g.p + unite,
      tolAbs: opts.tolAbs || 0, formules: formules || [], correction: correction || '', parties: opts.parties || []
    };
  }
  X.q = q; X.eq = eq;

  X.verifier = function (question, saisie) {
    const x = PE.lire(saisie);
    if (isNaN(x)) return null;
    const a = question.attendu;
    return Math.abs(x - a) <= Math.max(Math.abs(a) * 0.02, question.tolAbs, 1e-12);
  };

  function donnees(circuit) {
    return K.feuilles(circuit.charge).map(function (f) {
      return M(nm(f.nom)) + ' = ' + fmt(f.val, K.UNITE[f.type]);
    }).join(' ; ');
  }
  function melange(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  // ---------- Questions à partir d'un circuit sinusoïdal ----------
  function questionsAC(c, s, niveau) {
    const qs = [];
    const simple = K.estFeuille(c.charge) || (c.charge.type === 'serie' && c.charge.children.every(K.estFeuille));
    const w = s.omega;
    if (niveau === 1) {
      s.feuilles.filter(function (f) { return f.type !== 'R'; }).slice(0, 2).forEach(function (f) {
        const n = nm(f.nom);
        if (f.type === 'L') qs.push(q('Calculer la réactance $X_{' + f.nom + '} = ' + n + 'ω$ de la bobine.', f.val * w, 'Ω', ['omega', 'ZL'],
          eq('ω', '2πf', fmt(w, 'rad/s')) + eq('X_{' + f.nom + '}', n + 'ω', num(f.val) + ' × ' + num(w), fmt(f.val * w, 'Ω')), { parties: ['ch05/inductif', 'ch05/rlc'] }));
        else qs.push(q('Calculer la réactance $X_{' + f.nom + '} = frac(1;' + n + 'ω)$ du condensateur.', 1 / (f.val * w), 'Ω', ['omega', 'ZC'],
          eq('ω', '2πf', fmt(w, 'rad/s')) + eq('X_{' + f.nom + '}', 'frac(1;' + n + 'ω)', 'frac(1;' + num(f.val) + ' × ' + num(w) + ')', fmt(1 / (f.val * w), 'Ω')), { parties: ['ch05/capacitif', 'ch05/rlc'] }));
      });
    }
    qs.push(q('Calculer l\'impédance $Z$ du circuit.', s.Zmod, 'Ω', simple ? ['omega', 'ZR', 'ZL', 'ZC', 'Zserie'] : ['omega', 'ZR', 'ZL', 'ZC', 'Zcomplexe'],
      simple
        ? eq('Z', 'sqrt(R^2 + X^2)', 'sqrt(' + num(s.Z.re) + '^2 + ' + (s.Z.im < 0 ? '(' + num(s.Z.im) + ')' : num(s.Z.im)) + '^2)', fmt(s.Zmod, 'Ω'))
        : eq('cx(Z)', PE.fmtRect(s.Z, 'Ω'), PE.fmtPol(s.Z, 'Ω')) + '<p>Réduction série / dérivation en notation complexe : voir le détail des calculs.</p>', { parties: ['ch05/modele'] }));
    qs.push(q('En déduire la valeur efficace $I$ du courant absorbé.', s.Ieff, 'A', ['ohm'],
      eq('I', 'frac(V;Z)', 'frac(' + num(s.V) + ';' + num(s.Zmod) + ')', fmt(s.Ieff, 'A')), { parties: ['ch05/impedance'] }));
    qs.push(q('Calculer le déphasage $φ$ de la tension par rapport au courant (positif si le courant est en retard).', s.phiDeg, '°',
      simple ? ['tanphi', 'dephasages'] : ['tanphiPQ', 'dephasages'],
      (simple && Math.abs(s.Z.re) > 0
        ? eq('tan φ', 'frac(X;R)', 'frac(' + num(s.Z.im) + ';' + num(s.Z.re) + ')', num(s.Z.im / s.Z.re))
        : '') + eq('φ', PE.fmtDeg(s.phiDeg)) + '<p>Circuit ' + s.nature + '.</p>', { tolAbs: 0.6, parties: ['ch05/modele'] }));
    if (niveau >= 2) {
      const cibles = melange(s.feuilles).slice(0, niveau === 2 ? 1 : 2);
      cibles.forEach(function (f, i) {
        const o = s.info.get(f), n = nm(f.nom);
        const zf = C.abs(o.Z);
        // Dans une branche en dérivation on demande le courant, sinon la tension.
        const demandeI = niveau === 3 && Math.abs(o.Ieff - s.Ieff) > 1e-9 * s.Ieff && i === 0;
        if (demandeI) qs.push(q('Calculer la valeur efficace du courant traversant $' + n + '$.', o.Ieff, 'A', ['ohm', 'serieDeriv'],
          eq('I_{' + f.nom + '}', 'frac(U_{' + f.nom + '};Z_{' + f.nom + '})', 'frac(' + num(o.Veff) + ';' + num(zf) + ')', fmt(o.Ieff, 'A')), { parties: ['ch05/impedance', 'ch05/rlc'] }));
        else qs.push(q('Calculer la valeur efficace de la tension aux bornes de $' + n + '$.', o.Veff, 'V', ['ohm', 'serieDeriv'],
          eq('U_{' + f.nom + '}', 'Z_{' + f.nom + '} × I_{' + f.nom + '}', num(zf) + ' × ' + num(o.Ieff), fmt(o.Veff, 'V')), { parties: ['ch05/impedance', 'ch05/rlc'] }));
      });
      qs.push(q('Calculer la puissance active $P$ absorbée par le circuit.', s.P, 'W', ['P', 'PR', 'boucherot'],
        eq('P', 'V I cos φ', num(s.V) + ' × ' + num(s.Ieff) + ' × ' + num(s.k), fmt(s.P, 'W')) +
        PE.texte('<p>ou, avec Boucherot, la somme des $R I^2$ de chaque résistance.</p>'),
        { tolAbs: 1e-6, parties: ['ch06/active', 'ch06/boucherot'] }));
      qs.push(q('Calculer la puissance réactive $Q$ (négative si le circuit est capacitif).', s.Q, 'var', ['Q', 'QL', 'QC', 'boucherot'],
        eq('Q', 'V I sin φ', num(s.V) + ' × ' + num(s.Ieff) + ' × ' + num(Math.sin(s.phi)), fmt(s.Q, 'var')), { tolAbs: 1e-6, parties: ['ch06/reactive', 'ch06/boucherot'] }));
      qs.push(q('Calculer la puissance apparente $S$.', s.S, 'VA', ['S', 'S2'],
        eq('S', 'V I', num(s.V) + ' × ' + num(s.Ieff), fmt(s.S, 'VA')), { parties: ['ch06/apparente'] }));
      qs.push(q('Calculer le facteur de puissance $k = cos φ$.', s.k, '', ['k'],
        eq('k', 'frac(P;S)', 'frac(' + num(s.P) + ';' + num(s.S) + ')', num(s.k)), { tolAbs: 0.01, parties: ['ch06/facteur'] }));
    }
    if (niveau === 3 && s.Q > 0 && s.k < 0.93) {
      const t1 = s.Q / s.P, t2 = Math.tan(Math.acos(0.95));
      const Cc = s.P * (t1 - t2) / (w * s.V * s.V);
      const S2 = s.P / 0.95;
      qs.push(q('On veut relever le facteur de puissance à $cos φ′ = 0,95$. Calculer la capacité $C$ de la batterie de condensateurs à brancher en dérivation.', Cc, 'F', ['QPtan', 'Ccomp'],
        eq('C', 'frac(P (tan φ − tan φ′);2πf V^2)', 'frac(' + num(s.P) + ' × (' + num(t1) + ' − ' + num(t2) + ');2π × ' + num(s.f) + ' × ' + num(s.V) + '^2)', fmt(Cc, 'F')), { parties: ['ch06/relevement', 'ch06/capacite'] }));
      qs.push(q('Calculer le nouveau courant en ligne $I′$ après relèvement.', S2 / s.V, 'A', ['P'],
        eq('I′', 'frac(P;V cos φ′)', 'frac(' + num(s.P) + ';' + num(s.V) + ' × 0,95)', fmt(S2 / s.V, 'A')), { parties: ['ch06/relevement'] }));
    }
    return qs;
  }

  // ---------- Questions à partir d'un circuit en continu ----------
  function questionsDC(c, s, niveau) {
    const qs = [];
    const q = function (texte, valeur, unite, formules, correction) { return X.q(texte, valeur, unite, formules, correction, { parties: ['ch05/continu'] }); };
    const fini = function (v) { return isFinite(v); };
    if (fini(s.t0.Req)) qs.push(q('Calculer la résistance équivalente vue par la source à $t = 0⁺$.', s.t0.Req, 'Ω', ['etat0'],
      '<p>À t = 0⁺ : condensateur ≡ fil, bobine ≡ interrupteur ouvert.</p>' + eq('R_{eq}(0⁺)', fmt(s.t0.Req, 'Ω'))));
    qs.push(q('Calculer le courant débité par la source à $t = 0⁺$.', s.t0.I, 'A', ['etat0', 'ohmDC'],
      eq('I(0⁺)', 'frac(E;R_{eq}(0⁺))', fmt(s.t0.I, 'A'))));
    if (fini(s.tinf.Req)) qs.push(q('Calculer la résistance équivalente vue par la source en régime permanent ($t → ∞$).', s.tinf.Req, 'Ω', ['etatInf'],
      '<p>En régime permanent : condensateur ≡ interrupteur ouvert, bobine ≡ fil.</p>' + eq('R_{eq}(∞)', fmt(s.tinf.Req, 'Ω'))));
    qs.push(q('Calculer le courant débité par la source en régime permanent.', s.tinf.I, 'A', ['etatInf', 'ohmDC'],
      eq('I(∞)', 'frac(E;R_{eq}(∞))', fmt(s.tinf.I, 'A'))));
    s.reactifs.forEach(function (f) {
      const o = s.tinf.info.get(f), n = nm(f.nom);
      if (f.type === 'C') {
        qs.push(q('Calculer la tension aux bornes de $' + n + '$ en régime permanent.', o.V, 'V', ['etatInf', 'ohmDC'], eq('V_C(∞)', fmt(o.V, 'V'))));
        if (niveau >= 2) {
          qs.push(q('Calculer la charge $Q(∞)$ portée par $' + n + '$.', f.val * o.V, 'C', ['charge'], eq('Q', n + ' V_C(∞)', fmt(f.val * o.V, 'C'))));
          qs.push(q('Calculer l\'énergie $W_C$ stockée dans $' + n + '$ à l\'état final.', 0.5 * f.val * o.V * o.V, 'J', ['WC'], eq('W_C', 'frac(1;2) ' + n + ' V_C(∞)^2', fmt(0.5 * f.val * o.V * o.V, 'J'))));
        }
      } else {
        qs.push(q('Calculer le courant traversant $' + n + '$ en régime permanent.', o.I, 'A', ['etatInf', 'ohmDC'], eq('I_L(∞)', fmt(o.I, 'A'))));
        if (niveau >= 2) qs.push(q('Calculer l\'énergie $W_L$ stockée dans $' + n + '$ à l\'état final.', 0.5 * f.val * o.I * o.I, 'J', ['WL'], eq('W_L', 'frac(1;2) ' + n + ' I_L(∞)^2', fmt(0.5 * f.val * o.I * o.I, 'J'))));
      }
    });
    if (niveau >= 2 && s.tau !== null) {
      const f = s.reactifs[0];
      qs.push(q('Calculer la constante de temps $τ$ du circuit.', s.tau, 's', [f.type === 'C' ? 'tauRC' : 'tauRL'],
        eq('R_{th}', fmt(s.Rth, 'Ω')) + (f.type === 'C' ? eq('τ', 'R_{th} C', fmt(s.tau, 's')) : eq('τ', 'frac(L;R_{th})', fmt(s.tau, 's')))));
    }
    return qs.filter(function (x) { return isFinite(x.valeur); });
  }

  // Parties cochées (tableau de 'ch05/inductif'…) : null = toutes.
  // Une question ou un problème est retenu dès qu'une des parties qu'il travaille est cochée.
  function retenu(cochees, parties) {
    return !cochees || parties.some(function (p) { return cochees.indexOf(p) >= 0; });
  }
  const HORS_SELECTION = 'Aucune question de ce type ne correspond aux parties cochées dans le volet de gauche. Coche d\'autres parties, ou change de régime ou de difficulté.';

  // Exercice construit sur un circuit (aléatoire ou dessiné par l'utilisateur).
  // Seules les questions des parties cochées sont posées.
  X.depuisCircuit = function (circuit, niveau, cochees) {
    const s = K.resoudre(circuit);
    if (!s.ok) return { erreur: s.erreur };
    const dc = circuit.regime === 'DC';
    const questions = (dc ? questionsDC(circuit, s, niveau) : questionsAC(circuit, s, niveau))
      .filter(function (qn) { return retenu(cochees, qn.parties); });
    if (!questions.length) return { erreur: HORS_SELECTION, horsSelection: true };
    return {
      titre: dc ? 'Circuit en régime continu : états à t = 0⁺ et t → ∞' : 'Circuit en régime sinusoïdal',
      chapitre: 'ch05', circuit: circuit, solution: s,
      enonce: (dc
        ? '<p>À l\'instant t = 0, on ferme l\'interrupteur : le générateur de tension continue ' + M('E') + ' = ' + fmt(circuit.V, 'V') +
        ' alimente le circuit ci-dessous. Les condensateurs sont initialement déchargés et aucun courant ne circule dans les bobines.</p>'
        : '<p>Le circuit ci-dessous est alimenté par une tension sinusoïdale de valeur efficace ' + M('V') + ' = ' + fmt(circuit.V, 'V') +
        ' et de fréquence ' + M('f') + ' = ' + fmt(circuit.f, 'Hz') + '.</p>') +
        '<p class="donnees">Données : ' + donnees(circuit) + '</p>',
      questions: questions
    };
  };

  X.aleatoire = function (niveau, regime, cochees) {
    let ex;
    for (let i = 0; i < 20; i++) {
      ex = X.depuisCircuit(K.aleatoire(niveau, regime), niveau, cochees);
      if (!ex.erreur) return ex;
    }
    return ex.horsSelection ? ex : { erreur: 'Impossible de générer un exercice.' };
  };

  X.probleme = function (niveau, cochees) {
    const permis = X.problemes.filter(function (p) { return retenu(cochees, p.parties); });
    if (!permis.length) return { erreur: 'Aucun problème type TD ne correspond aux parties cochées dans le volet de gauche.' };
    const liste = permis.filter(function (p) { return p.niveau === niveau; });
    const p = choix(liste.length ? liste : permis);
    const ex = p.generer();
    ex.titre = p.titre; ex.chapitre = p.chapitre;
    return ex;
  };

  // ================= Problèmes « type TD » =================
  const V_RESEAU = [24, 48, 230, 400];

  X.problemes.push({
    id: 'bobine-parfaite', titre: 'Impédance et inductance d\'une bobine parfaite', chapitre: 'ch05', parties: ['ch05/inductif', 'ch05/impedance', 'ch05/rlc', 'ch05/td'], niveau: 1,
    generer: function () {
      const V = choix(V_RESEAU), f = 50, w = 2 * Math.PI * f;
      const L = K.arr2(alea(0.02, 0.6)), I = Number((V / (L * w)).toPrecision(3)), Z = V / I;
      return {
        circuit: { regime: 'AC', V: V, f: f, charge: K.L(L, 'L') }, dessin: { valeurs: false },
        enonce: '<p>Une bobine considérée parfaite est soumise à une tension sinusoïdale (' + M('V') + ' = ' + fmt(V, 'V') + ' ; ' + M('f') + ' = ' + fmt(f, 'Hz') +
          '). Elle est alors parcourue par un courant de valeur efficace ' + M('I') + ' = ' + fmt(I, 'A') + '.</p>',
        questions: [
          q('Calculer l\'impédance $Z$ de la bobine.', Z, 'Ω', ['ohm'], eq('Z', 'frac(V;I)', 'frac(' + num(V) + ';' + num(I) + ')', fmt(Z, 'Ω'))),
          q('En déduire l\'inductance $L$ de la bobine.', Z / w, 'H', ['ZL', 'omega'], eq('L', 'frac(Z;ω)', 'frac(' + num(Z) + ';2π × ' + num(f) + ')', fmt(Z / w, 'H')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'dipole-frequence', titre: 'Influence de la fréquence sur un dipôle idéal', chapitre: 'ch05', parties: ['ch05/inductif', 'ch05/capacitif', 'ch05/rlc', 'ch05/td'], niveau: 1,
    generer: function () {
      const V = choix([12, 24, 48]), bobine = Math.random() < 0.5;
      const val = bobine ? choix([4.7e-3, 12e-3, 22e-3, 47e-3]) : choix([47e-9, 100e-9, 220e-9, 1e-6]);
      const f1 = 50, f2 = choix([1000, 2000, 5000]);
      const Z = function (f) { const w = 2 * Math.PI * f; return bobine ? val * w : 1 / (val * w); };
      const formule = bobine ? 'Lω' : 'frac(1;Cω)';
      const qs = [];
      [f1, f2].forEach(function (f) {
        qs.push(q('Calculer son impédance pour $f$ = ' + fmt(f, 'Hz') + '.', Z(f), 'Ω', ['omega', bobine ? 'ZL' : 'ZC'], eq('Z', formule, fmt(Z(f), 'Ω'))));
        qs.push(q('Calculer la valeur efficace du courant pour $f$ = ' + fmt(f, 'Hz') + '.', V / Z(f), 'A', ['ohm'], eq('I', 'frac(V;Z)', 'frac(' + num(V) + ';' + num(Z(f)) + ')', fmt(V / Z(f), 'A'))));
      });
      return {
        circuit: { regime: 'AC', V: V, f: f1, charge: bobine ? K.L(val, 'L') : K.Cap(val, 'C') }, dessin: { source: false },
        enonce: '<p>' + (bobine ? 'Une bobine d\'inductance ' + M('L') + ' = ' + fmt(val, 'H') + ', que l\'on considérera parfaite,'
          : 'Un condensateur de capacité ' + M('C') + ' = ' + fmt(val, 'F')) + ' est soumis' + (bobine ? 'e' : '') +
          ' à une tension sinusoïdale de valeur efficace ' + fmt(V, 'V') + '.</p>',
        questions: qs
      };
    }
  });

  X.problemes.push({
    id: 'bobine-reelle', titre: 'Bobine réelle sur le réseau de la salle de TP', chapitre: 'ch05', parties: ['ch05/resistif', 'ch05/modelisation', 'ch05/modele', 'ch05/td'], niveau: 2,
    generer: function () {
      const V = choix([24, 48]), f = 50, w = 2 * Math.PI * f;
      const L = choix([0.05, 0.1, 0.15, 0.2]), r = choix([8, 11, 15, 22]);
      const c = { regime: 'AC', V: V, f: f, charge: K.serie(K.R(r, 'r'), K.L(L, 'L')) };
      const s = K.resoudreAC(c);
      return {
        circuit: c,
        enonce: '<p>On connecte une bobine réelle sur le réseau monophasé ' + fmt(V, 'V') + ', ' + fmt(f, 'Hz') + ' de la table. Sur la bobine il est inscrit ' +
          M('L') + ' = ' + fmt(L, 'H') + ' et ' + M('r') + ' = ' + fmt(r, 'Ω') + '. La résistance ' + M('r') + ' modélise ses pertes par effet Joule.</p>',
        questions: [
          q('Calculer l\'impédance $Z$ de la bobine.', s.Zmod, 'Ω', ['omega', 'Zserie'], eq('Z', 'sqrt(r^2 + (Lω)^2)', 'sqrt(' + num(r) + '^2 + ' + num(L * w) + '^2)', fmt(s.Zmod, 'Ω'))),
          q('En déduire la valeur efficace $I$ du courant.', s.Ieff, 'A', ['ohm'], eq('I', 'frac(V;Z)', fmt(s.Ieff, 'A'))),
          q('Calculer le déphasage $φ$.', s.phiDeg, '°', ['tanphi'], eq('tan φ', 'frac(Lω;r)', num(L * w / r)) + eq('φ', PE.fmtDeg(s.phiDeg)), { tolAbs: 0.6 }),
          q('Calculer la puissance dissipée par effet Joule dans la bobine.', s.P, 'W', ['PR'], eq('P', 'r I^2', num(r) + ' × ' + num(s.Ieff) + '^2', fmt(s.P, 'W')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'selecteur-radio', titre: 'Circuit R, L, C série : tensions et Fresnel', chapitre: 'ch05', parties: ['ch05/rlc', 'ch05/modele', 'ch05/td'], niveau: 2,
    generer: function () {
      const f = choix([100e3, 150e3, 200e3]), w = 2 * Math.PI * f;
      const L = choix([4.7e-3, 6.8e-3, 10e-3]), R = 1000;
      const Cv = K.arr2(1 / (L * w * w) * alea(0.7, 1.4));
      const I = K.arr2(alea(1e-3, 6e-3));
      const VL = L * w * I, VC = I / (Cv * w), VR = R * I;
      const V = Math.hypot(VR, VL - VC), phi = Math.atan2(VL - VC, VR) * 180 / Math.PI;
      return {
        circuit: { regime: 'AC', V: V, f: f, charge: K.serie(K.L(L, 'L'), K.Cap(Cv, 'C'), K.R(R, 'R')) }, dessin: { source: false },
        enonce: '<p>Le circuit ci-dessous peut être utilisé comme sélecteur de fréquence radio. Il est parcouru par un courant de valeur efficace ' +
          M('I') + ' = ' + fmt(I, 'A') + ' à la fréquence ' + M('f') + ' = ' + fmt(f, 'Hz') + '.</p><p class="donnees">Données : ' +
          M('L') + ' = ' + fmt(L, 'H') + ' ; ' + M('C') + ' = ' + fmt(Cv, 'F') + ' ; ' + M('R') + ' = ' + fmt(R, 'Ω') + '</p>',
        questions: [
          q('Calculer la valeur efficace $V_L$.', VL, 'V', ['omega', 'ZL', 'ohm'], eq('V_L', 'Lω I', fmt(VL, 'V'))),
          q('Calculer la valeur efficace $V_C$.', VC, 'V', ['ZC', 'ohm'], eq('V_C', 'frac(I;Cω)', fmt(VC, 'V'))),
          q('Calculer la valeur efficace $V_R$.', VR, 'V', ['ZR', 'ohm'], eq('V_R', 'R I', fmt(VR, 'V'))),
          q('À l\'aide du diagramme de Fresnel (i à l\'origine des phases), en déduire la valeur efficace $V$.', V, 'V', ['fresnelSerie'],
            eq('V', 'sqrt(V_R^2 + (V_L − V_C)^2)', 'sqrt(' + num(VR) + '^2 + ' + num(Math.abs(VL - VC)) + '^2)', fmt(V, 'V'))),
          q('En déduire le déphasage $φ$ de v par rapport à i.', phi, '°', ['fresnelSerie'], eq('tan φ', 'frac(V_L − V_C;V_R)', num((VL - VC) / VR)) + eq('φ', PE.fmtDeg(phi)), { tolAbs: 0.6 })
        ]
      };
    }
  });

  X.problemes.push({
    id: 'relevement', titre: 'Relèvement du facteur de puissance d\'une installation', chapitre: 'ch06', parties: ['ch06/facteur', 'ch06/reactive', 'ch06/relevement', 'ch06/capacite', 'ch06/td'], niveau: 2,
    generer: function () {
      const V = choix([230, 400]), f = 50;
      const P = choix([2, 3, 5, 8, 12, 20]) * 1000, k = choix([0.6, 0.65, 0.7, 0.75, 0.8]), k2 = choix([0.93, 0.95, 1]);
      const t1 = Math.tan(Math.acos(k)), t2 = Math.tan(Math.acos(k2));
      const Cc = P * (t1 - t2) / (2 * Math.PI * f * V * V);
      return {
        circuit: null,
        enonce: '<p>Une installation inductive alimentée sous ' + fmt(V, 'V') + ', ' + fmt(f, 'Hz') + ' absorbe une puissance active ' + M('P') + ' = ' + fmt(P, 'W') +
          ' avec un facteur de puissance ' + M('cos φ') + ' = ' + num(k) + '. On souhaite relever ce facteur de puissance à ' + M('cos φ′') + ' = ' + num(k2) +
          ' à l\'aide d\'une batterie de condensateurs branchée en dérivation.</p>',
        questions: [
          q('Calculer le courant en ligne $I$ avant relèvement.', P / (V * k), 'A', ['P'], eq('I', 'frac(P;V cos φ)', fmt(P / (V * k), 'A'))),
          q('Calculer la puissance réactive $Q$ consommée par l\'installation.', P * t1, 'var', ['QPtan'], eq('Q', 'P tan φ', num(P) + ' × ' + num(t1), fmt(P * t1, 'var'))),
          q('Calculer la capacité $C$ de la batterie de condensateurs.', Cc, 'F', ['Ccomp'], eq('C', 'frac(P (tan φ − tan φ′);2πf V^2)', fmt(Cc, 'F'))),
          q('Calculer le courant en ligne $I′$ après relèvement.', P / (V * k2), 'A', ['P'], eq('I′', 'frac(P;V cos φ′)', fmt(P / (V * k2), 'A')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'ligne-atelier', titre: 'Dimensionnement électrique d\'un atelier (méthode de Boucherot)', chapitre: 'ch06', parties: ['ch06/probleme', 'ch06/apparente', 'ch06/boucherot', 'ch06/methode', 'ch06/td'], niveau: 3,
    generer: function () {
      const V = 230, f = 50, w = 2 * Math.PI * f;
      const P = choix([15, 20, 30, 40]) * 1000, Qa = Math.round(P * choix([0.5, 0.6, 0.75]) / 100) * 100;
      const lg = choix([300, 500, 700, 900]), r1 = choix([7.8e-5, 1.2e-4, 1.8e-4]), l1 = choix([2.39e-7, 3e-7]);
      const r = r1 * lg, l = l1 * lg;
      const S = Math.hypot(P, Qa), I = S / V;
      const PT = P + r * I * I, QT = Qa + l * w * I * I, ST = Math.hypot(PT, QT);
      return {
        circuit: null,
        enonce: '<p>Un atelier consommant ' + M('P') + ' = ' + fmt(P, 'W') + ' et ' + M('Q') + ' = ' + fmt(Qa, 'var') + ' doit être alimenté sous ' + fmt(V, 'V') + ', ' + fmt(f, 'Hz') +
          '. Il est relié au secondaire d\'un transformateur par un câble de longueur ' + num(lg) + ' m, de résistance linéique ' + M('r') + ' = ' + num(r1) +
          ' Ω/m et d\'inductance linéique ' + M('l') + ' = ' + num(l1) + ' H/m. Le câble est modélisé par une résistance en série avec une inductance.</p>',
        questions: [
          q('Calculer la puissance apparente $S$ à l\'extrémité du câble, côté atelier.', S, 'VA', ['S2'], eq('S', 'sqrt(P^2 + Q^2)', fmt(S, 'VA'))),
          q('En déduire la valeur efficace $I$ du courant en ligne.', I, 'A', ['S'], eq('I', 'frac(S;V)', fmt(I, 'A'))),
          q('Calculer la puissance active totale $P_T$ fournie par le transformateur.', PT, 'W', ['boucherot', 'PR'],
            eq('R_{câble}', num(r1) + ' × ' + num(lg), fmt(r, 'Ω')) + eq('P_T', 'P + R_{câble} I^2', fmt(PT, 'W'))),
          q('Calculer la puissance réactive totale $Q_T$.', QT, 'var', ['boucherot', 'QL'],
            eq('L_{câble}', num(l1) + ' × ' + num(lg), fmt(l, 'H')) + eq('Q_T', 'Q + L_{câble}ω I^2', fmt(QT, 'var'))),
          q('En déduire la tension $V_s$ que doit délivrer le secondaire du transformateur.', ST / I, 'V', ['S2', 'S'],
            eq('S_T', 'sqrt(P_T^2 + Q_T^2)', fmt(ST, 'VA')) + eq('V_s', 'frac(S_T;I)', fmt(ST / I, 'V')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'essais-transfo', titre: 'Essais d\'un transformateur monophasé', chapitre: 'ch06', parties: ['ch06/apparente', 'ch06/reactive', 'ch06/relation', 'ch06/rlc', 'ch06/td'], niveau: 3,
    generer: function () {
      const f = 50, w = 2 * Math.PI * f;
      if (Math.random() < 0.5) {
        const V1 = choix([5000, 10000, 20000]), P = choix([600, 1000, 1500]), I1 = Number((P / V1 / alea(0.08, 0.2)).toPrecision(2));
        const S = V1 * I1, Qr = Math.sqrt(S * S - P * P);
        return {
          circuit: null,
          enonce: '<p><strong>Essai à vide.</strong> Le courant secondaire est nul : le modèle équivalent du transformateur se réduit à une résistance ' + M('R_f') +
            ' en dérivation avec une inductance ' + M('L_m') + ', soumises à la tension primaire. L\'essai est réalisé sous tension nominale ' + M('V_1') + ' = ' + fmt(V1, 'V') +
            ' (' + fmt(f, 'Hz') + '). On mesure ' + M('I_1') + ' = ' + fmt(I1, 'A') + ' et ' + M('P') + ' = ' + fmt(P, 'W') + '.</p>',
          questions: [
            q('Calculer la puissance apparente absorbée.', S, 'VA', ['S'], eq('S', 'V_1 I_1', fmt(S, 'VA'))),
            q('En déduire la puissance réactive absorbée.', Qr, 'var', ['S2'], eq('Q', 'sqrt(S^2 − P^2)', fmt(Qr, 'var'))),
            q('Calculer $R_f$ (seul élément consommant la puissance active).', V1 * V1 / P, 'Ω', ['PR', 'serieDeriv'], eq('R_f', 'frac(V_1^2;P)', fmt(V1 * V1 / P, 'Ω'))),
            q('Calculer $L_m$ (seul élément consommant la puissance réactive).', V1 * V1 / (Qr * w), 'H', ['QL', 'serieDeriv'], eq('L_m', 'frac(V_1^2;Q ω)', fmt(V1 * V1 / (Qr * w), 'H')))
          ]
        };
      }
      const V1 = choix([300, 430, 500]), I1 = choix([8, 10, 12]), I2 = choix([600, 833, 1000]);
      const S = V1 * I1, P = Math.round(S * alea(0.25, 0.5) / 100) * 100, Qr = Math.sqrt(S * S - P * P);
      return {
        circuit: null,
        enonce: '<p><strong>Essai en court-circuit.</strong> L\'essai est réalisé sous tension réduite ' + M('V_1') + ' = ' + fmt(V1, 'V') + ' (' + fmt(f, 'Hz') +
          ') : le modèle équivalent se réduit à une résistance ' + M('R_s') + ' en série avec une inductance ' + M('L_s') + ', traversées par le courant secondaire. On mesure ' +
          M('I_1') + ' = ' + fmt(I1, 'A') + ', ' + M('I_2') + ' = ' + fmt(I2, 'A') + ' et ' + M('P') + ' = ' + fmt(P, 'W') + '.</p>',
        questions: [
          q('Calculer la puissance apparente absorbée.', S, 'VA', ['S'], eq('S', 'V_1 I_1', fmt(S, 'VA'))),
          q('En déduire la puissance réactive absorbée.', Qr, 'var', ['S2'], eq('Q', 'sqrt(S^2 − P^2)', fmt(Qr, 'var'))),
          q('Calculer $R_s$.', P / (I2 * I2), 'Ω', ['PR', 'serieDeriv'], eq('R_s', 'frac(P;I_2^2)', fmt(P / (I2 * I2), 'Ω'))),
          q('Calculer $L_s$.', Qr / (w * I2 * I2), 'H', ['QL', 'serieDeriv'], eq('L_s', 'frac(Q;ω I_2^2)', fmt(Qr / (w * I2 * I2), 'H')))
        ]
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
