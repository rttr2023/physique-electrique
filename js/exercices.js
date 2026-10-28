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
        : '') + eq('φ', PE.fmtDeg(s.phiDeg)) + '<p>Circuit ' + s.nature + '.</p>', { tolAbs: 0.6, parties: ['ch05/modele', 'ch04/definition'] }));
    // Mesure : période, valeurs maximales, décalage temporel (ch03, ch04).
    const T = 1 / s.f;
    qs.push(q('Calculer la période $T$ de la tension d\'alimentation.', T, 's', ['ch03Frequence'],
      eq('T', 'frac(1;f)', 'frac(1;' + num(s.f) + ')', fmt(T, 's')), { parties: ['ch03/periodique', 'ch04/mesure'] }));
    qs.push(q('Calculer la valeur maximale $V_{max}$ de la tension d\'alimentation.', s.V * Math.SQRT2, 'V', ['ch03Efficace', 'ch04Eff'],
      eq('V_{max}', 'V sqrt(2)', num(s.V) + ' × sqrt(2)', fmt(s.V * Math.SQRT2, 'V')), { parties: ['ch03/moyenne-efficace', 'ch03/notations', 'ch04/td'] }));
    if (niveau >= 2) qs.push(q('Calculer la valeur maximale $I_{max}$ du courant absorbé.', s.Ieff * Math.SQRT2, 'A', ['ch03Efficace', 'ch04Eff'],
      eq('I', fmt(s.Ieff, 'A')) + eq('I_{max}', 'I sqrt(2)', num(s.Ieff) + ' × sqrt(2)', fmt(s.Ieff * Math.SQRT2, 'A')), { parties: ['ch03/moyenne-efficace', 'ch04/td'] }));
    if (Math.abs(s.phiDeg) > 0.5) qs.push(q('Calculer le décalage temporel $Δt$ entre la tension et le courant (valeur positive).', Math.abs(s.phiDeg) / 360 * T, 's', ['ch04PhiDeg'],
      eq('|φ|', PE.fmtDeg(Math.abs(s.phiDeg))) + eq('Δt', 'frac(|φ| × T;360)', 'frac(' + num(Math.abs(s.phiDeg)) + ' × ' + num(T) + ';360)', fmt(Math.abs(s.phiDeg) / 360 * T, 's')) +
      '<p>Le courant est en ' + (s.phiDeg > 0 ? 'retard' : 'avance') + ' sur la tension.</p>', { parties: ['ch04/mesure'] }));
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
    const q = function (texte, valeur, unite, formules, correction, parties) { return X.q(texte, valeur, unite, formules, correction, { parties: parties || ['ch05/continu'] }); };
    const fini = function (v) { return isFinite(v); };
    const reactif = s.reactifs.length > 0;
    const STOCKAGE = ['ch05/continu', 'ch02/condensateur', 'ch02/bobine'];
    const PERMANENT = ['ch05/continu', 'ch01/dipoles', 'ch01/associations'];
    if (reactif) {
      if (fini(s.t0.Req)) qs.push(q('Calculer la résistance équivalente vue par la source à $t = 0⁺$.', s.t0.Req, 'Ω', ['etat0'],
        '<p>À t = 0⁺ : condensateur ≡ fil, bobine ≡ interrupteur ouvert.</p>' + eq('R_{eq}(0⁺)', fmt(s.t0.Req, 'Ω')), STOCKAGE));
      qs.push(q('Calculer le courant débité par la source à $t = 0⁺$.', s.t0.I, 'A', ['etat0', 'ohmDC'],
        eq('I(0⁺)', 'frac(E;R_{eq}(0⁺))', fmt(s.t0.I, 'A')), STOCKAGE));
    }
    if (fini(s.tinf.Req)) qs.push(q(reactif ? 'Calculer la résistance équivalente vue par la source en régime permanent ($t → ∞$).' : 'Calculer la résistance équivalente $R_{eq}$ vue par la source.',
      s.tinf.Req, 'Ω', reactif ? ['etatInf', 'ch01CondDC', 'ch01BobDC'] : ['ch01Serie', 'ch01Deriv', 'ch01Deux'],
      (reactif ? '<p>En régime permanent : condensateur ≡ interrupteur ouvert, bobine ≡ fil.</p>' : '<p>Associations série (on additionne) et dérivation (inverses ou produit sur somme).</p>') +
      eq('R_{eq}' + (reactif ? '(∞)' : ''), fmt(s.tinf.Req, 'Ω')), PERMANENT));
    qs.push(q(reactif ? 'Calculer le courant débité par la source en régime permanent.' : 'Calculer le courant $I$ débité par la source.', s.tinf.I, 'A', ['ohmDC', 'ch01Ohm'],
      eq('I' + (reactif ? '(∞)' : ''), 'frac(E;R_{eq})', 'frac(' + num(s.V) + ';' + num(s.tinf.Req) + ')', fmt(s.tinf.I, 'A')), ['ch05/continu', 'ch01/dipoles']));
    s.reactifs.forEach(function (f) {
      const o = s.tinf.info.get(f), n = nm(f.nom);
      if (f.type === 'C') {
        qs.push(q('Calculer la tension aux bornes de $' + n + '$ en régime permanent.', o.V, 'V', ['etatInf', 'ohmDC', 'ch01CondDC'], eq('V_C(∞)', fmt(o.V, 'V')), ['ch05/continu', 'ch01/dipoles']));
        if (niveau >= 2) {
          qs.push(q('Calculer la charge $Q(∞)$ portée par $' + n + '$.', f.val * o.V, 'C', ['charge'], eq('Q', n + ' V_C(∞)', fmt(f.val * o.V, 'C'))));
          qs.push(q('Calculer l\'énergie $W_C$ stockée dans $' + n + '$ à l\'état final.', 0.5 * f.val * o.V * o.V, 'J', ['WC'], eq('W_C', 'frac(1;2) ' + n + ' V_C(∞)^2', fmt(0.5 * f.val * o.V * o.V, 'J')),
            ['ch05/continu', 'ch02/condensateur-duree']));
        }
      } else {
        qs.push(q('Calculer le courant traversant $' + n + '$ en régime permanent.', o.I, 'A', ['etatInf', 'ohmDC', 'ch01BobDC'], eq('I_L(∞)', fmt(o.I, 'A')), ['ch05/continu', 'ch01/dipoles']));
        if (niveau >= 2) qs.push(q('Calculer l\'énergie $W_L$ stockée dans $' + n + '$ à l\'état final.', 0.5 * f.val * o.I * o.I, 'J', ['WL'], eq('W_L', 'frac(1;2) ' + n + ' I_L(∞)^2', fmt(0.5 * f.val * o.I * o.I, 'J')),
          ['ch05/continu', 'ch02/bobine-duree']));
      }
    });
    // Résistances : loi d'Ohm (ch01) et puissance reçue (ch02), en régime permanent.
    const resistances = melange(s.feuilles.filter(function (f) { return f.type === 'R' && s.tinf.info.get(f).I > 0; })).slice(0, niveau);
    resistances.forEach(function (f) {
      const o = s.tinf.info.get(f), n = nm(f.nom);
      qs.push(q('Calculer la tension $U_{' + f.nom + '}$ aux bornes de $' + n + '$' + (reactif ? ' en régime permanent.' : '.'), o.V, 'V', ['ch01Ohm', 'ch01Diviseur'],
        eq('I_{' + f.nom + '}', fmt(o.I, 'A')) + eq('U_{' + f.nom + '}', n + ' × I_{' + f.nom + '}', num(f.val) + ' × ' + num(o.I), fmt(o.V, 'V')), ['ch01/dipoles', 'ch01/diviseur']));
      if (niveau >= 2) qs.push(q('Calculer la puissance $P_{' + f.nom + '}$ reçue par $' + n + '$' + (reactif ? ' en régime permanent.' : '.'), o.V * o.I, 'W', ['ch02Pinst'],
        '<p>Convention récepteur : la puissance reçue est positive.</p>' + eq('P_{' + f.nom + '}', 'U_{' + f.nom + '} × I_{' + f.nom + '}', num(o.V) + ' × ' + num(o.I), fmt(o.V * o.I, 'W')), ['ch02/conventions']));
    });
    if (s.tinf.I > 0) qs.push(q('Calculer la puissance fournie par la source' + (reactif ? ' en régime permanent.' : '.'), s.V * s.tinf.I, 'W', ['ch02Pinst'],
      '<p>Convention générateur : la source fournit la puissance ' + M('E × I') + ', égale à la somme des puissances reçues par les résistances.</p>' +
      eq('P', 'E × I', num(s.V) + ' × ' + num(s.tinf.I), fmt(s.V * s.tinf.I, 'W')), ['ch02/conventions']));
    if (niveau >= 2 && s.tau !== null) {
      const f = s.reactifs[0];
      qs.push(q('Calculer la constante de temps $τ$ du circuit.', s.tau, 's', [f.type === 'C' ? 'tauRC' : 'tauRL'],
        eq('R_{th}', fmt(s.Rth, 'Ω')) + (f.type === 'C' ? eq('τ', 'R_{th} C', fmt(s.tau, 's')) : eq('τ', 'frac(L;R_{th})', fmt(s.tau, 's')))));
    }
    return qs.filter(function (x) { return isFinite(x.valeur) && x.valeur !== 0; });
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
    // Chapitre affiché : celui de la première partie cochée travaillée par la première question.
    const premiere = questions[0].parties.filter(function (p) { return retenu(cochees, [p]); })[0] || questions[0].parties[0] || 'ch05/';
    const resistif = dc && !s.reactifs.length;
    return {
      titre: dc ? (resistif ? 'Circuit résistif en régime continu' : 'Circuit en régime continu : états à t = 0⁺ et t → ∞') : 'Circuit en régime sinusoïdal',
      chapitre: premiere.split('/')[0], circuit: circuit, solution: s,
      enonce: (resistif
        ? '<p>Le générateur de tension continue ' + M('E') + ' = ' + fmt(circuit.V, 'V') + ' alimente le circuit ci-dessous.</p>'
        : dc
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
    // Rien pour ce régime dans les parties cochées (ex. chapitre 1 en sinusoïdal) : on essaie l'autre régime.
    if (ex.horsSelection) {
      const autre = regime === 'DC' ? 'AC' : 'DC';
      for (let i = 0; i < 20; i++) {
        const ex2 = X.depuisCircuit(K.aleatoire(niveau, autre), niveau, cochees);
        if (!ex2.erreur) {
          ex2.enonce = '<p class="note">Les parties cochées ne se travaillent pas en régime ' + (regime === 'DC' ? 'continu' : 'sinusoïdal') +
            ' : exercice proposé en régime ' + (autre === 'DC' ? 'continu' : 'sinusoïdal') + '.</p>' + ex2.enonce;
          return ex2;
        }
      }
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

  X.problemes.push({
    id: 'superposition', titre: 'Principe de superposition : source de tension et source de courant', chapitre: 'ch01', parties: ['ch01/superposition', 'ch01/diviseur', 'ch01/associations'], niveau: 2,
    generer: function () {
      const E = choix([6, 10, 12, 24]), I = choix([0.2, 0.5, 1]);
      const R1 = choix([10, 22, 30, 47, 68, 100]), R2 = choix([10, 22, 30, 47]), R = choix([22, 33, 50, 68, 100]);
      const U1 = R / (R + R1) * E, Req = R * R1 / (R + R1), U2 = Req * I;
      return {
        circuit: null,
        enonce: '<p>Trois branches sont associées en dérivation : une source de tension ' + M('E') + ' = ' + fmt(E, 'V') + ' en série avec ' + M('R_1') + ' = ' + fmt(R1, 'Ω') +
          ' ; une source de courant ' + M('I') + ' = ' + fmt(I, 'A') + ' en série avec ' + M('R_2') + ' = ' + fmt(R2, 'Ω') + ' ; une résistance ' + M('R') + ' = ' + fmt(R, 'Ω') +
          '. Les deux sources sont orientées de façon à faire circuler leur courant vers la borne haute de ' + M('R') + '. On cherche la tension ' + M('U') +
          ' aux bornes de ' + M('R') + ' (fléchée vers la borne haute) par le principe de superposition.</p>',
        questions: [
          q('Étape 1 : la source de courant est éteinte (remplacée par un circuit ouvert). Calculer la tension $U′$ aux bornes de $R$.', U1, 'V', ['ch01Diviseur', 'ch01Superposition'],
            '<p>Aucun courant ne circule dans la branche de ' + M('R_2') + ' : ' + M('R_1') + ' et ' + M('R') + ' sont en série et forment un diviseur de tension.</p>' +
            eq('U′', 'frac(R;R + R_1) × E', 'frac(' + num(R) + ';' + num(R) + ' + ' + num(R1) + ') × ' + num(E), fmt(U1, 'V'))),
          q('Étape 2 : la source de tension est éteinte (remplacée par un fil). Calculer la résistance $R_{eq}$ équivalente à $R_1$ et $R$.', Req, 'Ω', ['ch01Deux'],
            '<p>' + M('R_1') + ' et ' + M('R') + ' sont alors en dérivation.</p>' +
            eq('R_{eq}', 'frac(R × R_1;R + R_1)', 'frac(' + num(R) + ' × ' + num(R1) + ';' + num(R) + ' + ' + num(R1) + ')', fmt(Req, 'Ω'))),
          q('Calculer la tension $U″$ aux bornes de $R$ à l\'étape 2.', U2, 'V', ['ch01Ohm', 'ch01Superposition'],
            '<p>Tout le courant ' + M('I') + ' de la source traverse ' + M('R_{eq}') + ' (' + M('R_2') + ', en série avec la source de courant, n\'intervient pas).</p>' +
            eq('U″', 'R_{eq} × I', num(Req) + ' × ' + num(I), fmt(U2, 'V'))),
          q('Étape 3 : en déduire la tension $U$.', U1 + U2, 'V', ['ch01Superposition'], eq('U', 'U′ + U″', num(U1) + ' + ' + num(U2), fmt(U1 + U2, 'V')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'oscillogramme', titre: 'Lecture d\'un oscillogramme : déphasage courant/tension', chapitre: 'ch04', parties: ['ch04/definition', 'ch04/mesure', 'ch04/td'], niveau: 2,
    generer: function () {
      const ct = choix([5e-3, 2e-3, 1e-3, 0.5e-3, 0.2e-3, 0.1e-3, 50e-6, 20e-6]), nT = choix([4, 5, 8]);
      const decalages = [];
      for (let k = 2; k <= Math.floor(nT * 2.2); k++) decalages.push(k / 10);
      const nDt = choix(decalages), retard = Math.random() < 0.5;
      const sonde = choix([1, 20]), cv = choix([0.5, 1, 2, 5]), nV = choix([1.5, 1.8, 2, 2.3, 2.5, 2.8, 3, 3.2]);
      const ci = choix([5e-3, 10e-3, 20e-3, 50e-3, 0.1]), nI = choix([1.2, 1.4, 1.5, 1.7, 2, 2.5]);
      const T = nT * ct, f = 1 / T, w = 2 * Math.PI * f, dt = nDt * ct;
      const phi = (retard ? 1 : -1) * 360 * dt / T;
      const Vmax = nV * cv * sonde, Imax = nI * ci / 0.1;
      return {
        circuit: null,
        enonce: '<p>On relève à l\'oscilloscope la tension ' + M('v') + ' aux bornes d\'un dipôle (voie 1) et le courant ' + M('i') + ' qui le traverse (voie 2). Réglages :</p><ul>' +
          '<li>calibre des temps : ' + fmt(ct, 's') + '/div ;</li>' +
          '<li>voie 1 : ' + (sonde === 1 ? 'mesure directe' : 'sonde 1/20<sup>e</sup>') + ', calibre ' + fmt(cv, 'V') + '/div ;</li>' +
          '<li>voie 2 : sonde de courant 100 mV/A, calibre ' + fmt(ci, 'V') + '/div.</li></ul>' + PE.dessin.oscillogramme(nT, nV, nI, retard ? nDt : -nDt, 'voie 2 : image du courant par la sonde ; 10 × 8 divisions') +
          '<p>Lectures : une période occupe ' + num(nT) + ' div ; le maximum de ' + M('v') + ' est à ' + num(nV) + ' div, celui de ' + M('i') + ' à ' + num(nI) +
          ' div ; ' + M('i') + ' passe par son maximum ' + num(nDt) + ' div ' + (retard ? 'après' : 'avant') + ' ' + M('v') + '.</p>',
        questions: [
          q('Déterminer la période $T$.', T, 's', ['ch04Oscillo'], eq('T', num(nT) + ' div × ' + fmt(ct, 's') + '/div', fmt(T, 's'))),
          q('En déduire la fréquence $f$.', f, 'Hz', ['ch04Freq'], eq('f', 'frac(1;T)', 'frac(1;' + num(T) + ')', fmt(f, 'Hz'))),
          q('Calculer la pulsation $ω$.', w, 'rad/s', ['ch04Freq'], eq('ω', '2πf', '2π × ' + num(f), fmt(w, 'rad/s'))),
          q('Déterminer le déphasage $φ$ de $i$ par rapport à $v$, en degrés et avec son signe.', phi, '°', ['ch04PhiDeg', 'ch04Def'],
            eq('Δt', num(nDt) + ' div × ' + fmt(ct, 's') + '/div', fmt(dt, 's')) + eq('|φ|', 'frac(360 × Δt;T)', 'frac(360 × ' + num(dt) + ';' + num(T) + ')', PE.fmtDeg(Math.abs(phi))) +
            '<p>' + M('i') + ' est en ' + (retard ? 'retard' : 'avance') + ' sur ' + M('v') + ' : ' + M('φ') + ' est ' + (retard ? 'positif (dipôle inductif)' : 'négatif (dipôle capacitif)') +
            ', ' + M('φ') + ' = ' + PE.fmtDeg(phi) + '.</p>', { tolAbs: 1 }),
          q('Déterminer la valeur maximale $V_{max}$ de la tension.', Vmax, 'V', ['ch04Oscillo'],
            eq('V_{max}', num(nV) + ' div × ' + fmt(cv, 'V') + '/div' + (sonde === 1 ? '' : ' × 20'), fmt(Vmax, 'V'))),
          q('En déduire sa valeur efficace $V$.', Vmax / Math.SQRT2, 'V', ['ch04Eff'], eq('V', 'frac(V_{max};sqrt(2))', fmt(Vmax / Math.SQRT2, 'V'))),
          q('Déterminer la valeur maximale $I_{max}$ du courant.', Imax, 'A', ['ch04Oscillo'],
            eq('I_{max}', 'frac(' + num(nI) + ' div × ' + fmt(ci, 'V') + '/div;0,1 V/A)', fmt(Imax, 'A'))),
          q('En déduire sa valeur efficace $I$.', Imax / Math.SQRT2, 'A', ['ch04Eff'], eq('I', 'frac(I_{max};sqrt(2))', fmt(Imax / Math.SQRT2, 'A')))
        ]
      };
    }
  });

  // ---------- Chapitre 1 : régime continu ----------
  const E_DC = [6, 12, 24, 48];
  const R_E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82, 100, 120, 150, 220];

  X.problemes.push({
    id: 'associations-r', titre: 'Associations de résistances et loi d\'Ohm', chapitre: 'ch01', parties: ['ch01/associations', 'ch01/diviseur', 'ch01/dipoles'], niveau: 1,
    generer: function () {
      const E = choix(E_DC), R1 = choix(R_E12), R2 = choix(R_E12), R3 = choix(R_E12);
      const R23 = R2 * R3 / (R2 + R3), Req = R1 + R23, I = E / Req, U23 = R23 * I;
      return {
        circuit: { regime: 'DC', V: E, f: 0, charge: K.serie(K.R(R1, 'R1'), K.par(K.R(R2, 'R2'), K.R(R3, 'R3'))) },
        enonce: '<p>Le générateur de tension continue ' + M('E') + ' = ' + fmt(E, 'V') + ' alimente trois résistances : ' + M('R_1') + ' en série avec l\'association en dérivation de ' +
          M('R_2') + ' et ' + M('R_3') + '.</p><p class="donnees">Données : ' + M('R_1') + ' = ' + fmt(R1, 'Ω') + ' ; ' + M('R_2') + ' = ' + fmt(R2, 'Ω') + ' ; ' + M('R_3') + ' = ' + fmt(R3, 'Ω') + '</p>',
        questions: [
          q('Calculer la résistance $R_{23}$ équivalente à $R_2$ et $R_3$ en dérivation.', R23, 'Ω', ['ch01Deux'],
            eq('R_{23}', 'frac(R_2 × R_3;R_2 + R_3)', 'frac(' + num(R2) + ' × ' + num(R3) + ';' + num(R2) + ' + ' + num(R3) + ')', fmt(R23, 'Ω'))),
          q('En déduire la résistance équivalente $R_{eq}$ de l\'ensemble.', Req, 'Ω', ['ch01Serie'], eq('R_{eq}', 'R_1 + R_{23}', num(R1) + ' + ' + num(R23), fmt(Req, 'Ω'))),
          q('Calculer le courant $I$ débité par le générateur.', I, 'A', ['ch01Ohm'], eq('I', 'frac(E;R_{eq})', 'frac(' + num(E) + ';' + num(Req) + ')', fmt(I, 'A'))),
          q('Calculer la tension $U_{23}$ aux bornes de l\'association $R_2$ // $R_3$.', U23, 'V', ['ch01Diviseur', 'ch01Ohm'],
            '<p>' + M('R_1') + ' et ' + M('R_{23}') + ' sont en série : diviseur de tension.</p>' +
            eq('U_{23}', 'frac(R_{23};R_1 + R_{23}) × E', 'frac(' + num(R23) + ';' + num(Req) + ') × ' + num(E), fmt(U23, 'V'))),
          q('Calculer le courant $I_2$ qui traverse $R_2$.', U23 / R2, 'A', ['ch01Ohm'], eq('I_2', 'frac(U_{23};R_2)', 'frac(' + num(U23) + ';' + num(R2) + ')', fmt(U23 / R2, 'A')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'dipole-actif', titre: 'Loi d\'Ohm d\'un dipôle actif', chapitre: 'ch01', parties: ['ch01/ohm-actif'], niveau: 2,
    generer: function () {
      if (Math.random() < 0.5) {
        const E = choix([12, 24, 48]), r = choix([0.05, 0.1, 0.2, 0.5]), I1 = choix([2, 4, 5]), I2 = choix([10, 15, 20]), I3 = choix([8, 12, 25]);
        const U1 = E - r * I1, U2 = E - r * I2;
        return {
          circuit: null,
          enonce: '<p>Une batterie se comporte en générateur (convention générateur). On mesure ' + M('U_1') + ' = ' + fmt(U1, 'V') + ' lorsqu\'elle débite ' + M('I_1') + ' = ' + fmt(I1, 'A') +
            ', puis ' + M('U_2') + ' = ' + fmt(U2, 'V') + ' lorsqu\'elle débite ' + M('I_2') + ' = ' + fmt(I2, 'A') + '. On la modélise par une fem ' + M('E') + ' en série avec une résistance interne ' + M('r') + '.</p>',
          questions: [
            q('Calculer la résistance interne $r$ de la batterie.', r, 'Ω', ['ch01Gene'],
              '<p>Avec ' + M('U = E − r I') + ' écrit pour les deux mesures, puis soustrait :</p>' + eq('r', 'frac(U_1 − U_2;I_2 − I_1)', 'frac(' + num(U1) + ' − ' + num(U2) + ';' + num(I2) + ' − ' + num(I1) + ')', fmt(r, 'Ω'))),
            q('En déduire sa fem $E$.', E, 'V', ['ch01Gene'], eq('E', 'U_1 + r I_1', num(U1) + ' + ' + num(r) + ' × ' + num(I1), fmt(E, 'V'))),
            q('Quelle tension $U_3$ délivre-t-elle lorsqu\'elle débite $I_3$ = ' + fmt(I3, 'A') + ' ?', E - r * I3, 'V', ['ch01Gene'],
              eq('U_3', 'E − r I_3', num(E) + ' − ' + num(r) + ' × ' + num(I3), fmt(E - r * I3, 'V')))
          ]
        };
      }
      const E = choix([100, 180, 200, 220]), r = choix([0.5, 1, 2]), I = choix([4, 5, 8, 10]), U2 = E + r * choix([12, 15, 20]);
      return {
        circuit: null,
        enonce: '<p>Un moteur à courant continu se comporte en récepteur (convention récepteur). Il est modélisé par une fem ' + M('E') + ' = ' + fmt(E, 'V') +
          ' en série avec une résistance interne ' + M('r') + ' = ' + fmt(r, 'Ω') + '.</p>',
        questions: [
          q('Quelle tension $U$ faut-il appliquer au moteur pour qu\'il absorbe $I$ = ' + fmt(I, 'A') + ' ?', E + r * I, 'V', ['ch01Recep'],
            eq('U', 'E + r I', num(E) + ' + ' + num(r) + ' × ' + num(I), fmt(E + r * I, 'V'))),
          q('Sous $U′$ = ' + fmt(U2, 'V') + ', quel courant $I′$ absorbe-t-il ?', (U2 - E) / r, 'A', ['ch01Recep'],
            eq('I′', 'frac(U′ − E;r)', 'frac(' + num(U2) + ' − ' + num(E) + ';' + num(r) + ')', fmt((U2 - E) / r, 'A')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'thevenin-diviseur', titre: 'Modèle équivalent de Thévenin d\'un pont diviseur', chapitre: 'ch01', parties: ['ch01/thevenin', 'ch01/diviseur', 'ch01/associations'], niveau: 3,
    generer: function () {
      const E = choix([12, 24, 48]), R1 = choix(R_E12), R2 = choix(R_E12), Rc = choix(R_E12);
      const Eth = R2 / (R1 + R2) * E, Rth = R1 * R2 / (R1 + R2), Ic = Eth / (Rth + Rc);
      return {
        circuit: { regime: 'DC', V: E, f: 0, charge: K.serie(K.R(R1, 'R1'), K.par(K.R(R2, 'R2'), K.R(Rc, 'Rc'))) },
        enonce: '<p>Un générateur ' + M('E') + ' = ' + fmt(E, 'V') + ' alimente ' + M('R_1') + ' = ' + fmt(R1, 'Ω') + ' en série avec ' + M('R_2') + ' = ' + fmt(R2, 'Ω') +
          '. Les bornes A et B sont celles de ' + M('R_2') + ' ; on y branche une charge ' + M('R_c') + ' = ' + fmt(Rc, 'Ω') + '. On remplace tout ce qui est à gauche de A et B par son modèle équivalent de Thévenin.</p>',
        questions: [
          q('Calculer $E_{TH}$, tension entre A et B lorsque la charge est débranchée.', Eth, 'V', ['ch01Thevenin', 'ch01Diviseur'],
            '<p>À vide, ' + M('R_1') + ' et ' + M('R_2') + ' sont en série : diviseur de tension.</p>' + eq('E_{TH}', 'frac(R_2;R_1 + R_2) × E', 'frac(' + num(R2) + ';' + num(R1 + R2) + ') × ' + num(E), fmt(Eth, 'V'))),
          q('Calculer $R_{TH}$, résistance vue entre A et B, source éteinte.', Rth, 'Ω', ['ch01Thevenin', 'ch01Deux'],
            '<p>La source de tension éteinte est remplacée par un fil : ' + M('R_1') + ' et ' + M('R_2') + ' sont alors en dérivation.</p>' +
            eq('R_{TH}', 'frac(R_1 × R_2;R_1 + R_2)', 'frac(' + num(R1) + ' × ' + num(R2) + ';' + num(R1) + ' + ' + num(R2) + ')', fmt(Rth, 'Ω'))),
          q('En déduire le courant $I_c$ dans la charge.', Ic, 'A', ['ch01Thevenin', 'ch01Ohm'], eq('I_c', 'frac(E_{TH};R_{TH} + R_c)', 'frac(' + num(Eth) + ';' + num(Rth) + ' + ' + num(Rc) + ')', fmt(Ic, 'A'))),
          q('Calculer la tension $U_{AB}$ aux bornes de la charge.', Rc * Ic, 'V', ['ch01Ohm'], eq('U_{AB}', 'R_c × I_c', num(Rc) + ' × ' + num(Ic), fmt(Rc * Ic, 'V')))
        ]
      };
    }
  });

  // ---------- Chapitre 2 : régimes variables quelconques ----------

  X.problemes.push({
    id: 'kirchhoff', titre: 'Lois des nœuds et des mailles', chapitre: 'ch02', parties: ['ch02/kirchhoff'], niveau: 1,
    generer: function () {
      const i1 = choix([1.5, 2, 3.2, 4]), i2 = choix([0.5, 1.2, 2.5]);
      let i3 = choix([1, 2.8, 3.6, 5]);
      if (Math.abs(i1 + i2 - i3) < 0.05) i3 += 0.4;
      const i4 = Math.round((i1 + i2 - i3) * 10) / 10;
      const e = choix([12, 24, 48]), u1 = Math.round(e * choix([0.2, 0.25, 0.3]) * 10) / 10, u2 = Math.round(e * choix([0.35, 0.4, 0.5]) * 10) / 10;
      const u3 = Math.round((e - u1 - u2) * 10) / 10;
      return {
        circuit: null,
        enonce: '<p>À un instant donné :</p><ul><li>en un nœud, les courants ' + M('i_1') + ' = ' + fmt(i1, 'A') + ' et ' + M('i_2') + ' = ' + fmt(i2, 'A') + ' arrivent, les courants ' +
          M('i_3') + ' = ' + fmt(i3, 'A') + ' et ' + M('i_4') + ' (inconnu) repartent ;</li><li>une maille comporte un générateur de tension ' + M('e') + ' = ' + fmt(e, 'V') +
          ' et trois récepteurs en série de tensions ' + M('u_1') + ' = ' + fmt(u1, 'V') + ', ' + M('u_2') + ' = ' + fmt(u2, 'V') + ' et ' + M('u_3') + ' (inconnue), fléchées dans le sens contraire de ' + M('e') + '.</li></ul>',
        questions: [
          q('Calculer le courant $i_4$.', i4, 'A', ['ch02Noeuds'],
            '<p>Courants arrivant comptés positivement, courants sortants négativement : ' + M('i_1 + i_2 − i_3 − i_4 = 0') + '.</p>' +
            eq('i_4', 'i_1 + i_2 − i_3', num(i1) + ' + ' + num(i2) + ' − ' + num(i3), fmt(i4, 'A')) +
            (i4 < 0 ? '<p>Le résultat est négatif : le courant ' + M('i_4') + ' circule en réalité dans l\'autre sens (il arrive au nœud).</p>' : '')),
          q('Calculer la tension $u_3$.', u3, 'V', ['ch02Mailles'],
            '<p>En parcourant la maille, ' + M('e − u_1 − u_2 − u_3 = 0') + '.</p>' + eq('u_3', 'e − u_1 − u_2', num(e) + ' − ' + num(u1) + ' − ' + num(u2), fmt(u3, 'V')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'conventions', titre: 'Conventions récepteur / générateur et signe de la puissance', chapitre: 'ch02', parties: ['ch02/conventions'], niveau: 1,
    generer: function () {
      const dipoles = [
        { conv: 'récepteur', u: choix([5, 12, 24]), i: choix([0.5, 1.5, 2]) },
        { conv: 'générateur', u: choix([12, 24]), i: choix([1, 3, 4]) },
        { conv: 'récepteur', u: choix([6, 9, 15]), i: -choix([0.2, 0.8, 1.2]) }
      ];
      const sens = function (d) {
        const pp = d.u * d.i;
        return d.conv === 'récepteur' ? (pp > 0 ? 'reçoit' : 'fournit') : (pp > 0 ? 'fournit' : 'reçoit');
      };
      return {
        circuit: null,
        enonce: '<p>On relève, à un instant donné, la tension et le courant de trois dipôles :</p>' +
          '<div class="table-wrap"><table><thead><tr><th>Dipôle</th><th>Convention de fléchage</th><th>' + M('u') + '</th><th>' + M('i') + '</th></tr></thead><tbody>' +
          dipoles.map(function (d, k) { return '<tr><td>D' + (k + 1) + '</td><td>' + d.conv + '</td><td>' + fmt(d.u, 'V') + '</td><td>' + fmt(d.i, 'A') + '</td></tr>'; }).join('') + '</tbody></table></div>',
        questions: dipoles.map(function (d, k) {
          const pp = d.u * d.i;
          return q('Calculer la puissance instantanée $p$ du dipôle D' + (k + 1) + ' (avec son signe).', pp, 'W', ['ch02Pinst'],
            eq('p', 'u × i', num(d.u) + ' × ' + (d.i < 0 ? '(' + num(d.i) + ')' : num(d.i)), fmt(pp, 'W')) +
            '<p>Convention ' + d.conv + ' et ' + M(pp > 0 ? 'p &gt; 0' : 'p &lt; 0') + ' : le dipôle <strong>' + sens(d) + '</strong> de la puissance.</p>');
        })
      };
    }
  });

  X.problemes.push({
    id: 'rampes', titre: 'Condensateur et bobine soumis à des variations linéaires', chapitre: 'ch02', parties: ['ch02/dipoles'], niveau: 2,
    generer: function () {
      const Cv = choix([10e-6, 47e-6, 100e-6, 220e-6]), U = choix([5, 10, 12]), dtC = choix([1e-3, 2e-3, 5e-3, 10e-3]);
      const L = choix([10e-3, 50e-3, 0.1]), I1 = choix([0.2, 0.5]), I2 = choix([1, 1.5, 2]), dtL = choix([1e-3, 2e-3, 5e-3]);
      const iC = Cv * U / dtC, uL = L * (I2 - I1) / dtL;
      return {
        circuit: null,
        enonce: '<p>Un condensateur de capacité ' + M('C') + ' = ' + fmt(Cv, 'F') + ' voit sa tension passer linéairement de 0 à ' + fmt(U, 'V') + ' en ' + fmt(dtC, 's') +
          '. Une bobine d\'inductance ' + M('L') + ' = ' + fmt(L, 'H') + ' voit son courant passer linéairement de ' + fmt(I1, 'A') + ' à ' + fmt(I2, 'A') + ' en ' + fmt(dtL, 's') +
          ', puis redescendre linéairement à ' + fmt(I1, 'A') + ' en ' + fmt(dtL, 's') + '. Les deux dipôles sont en convention récepteur.</p>',
        questions: [
          q('Calculer le courant $i$ dans le condensateur pendant la charge.', iC, 'A', ['ch02IC'],
            '<p>Sur une variation linéaire, la dérivée ' + M('frac(du;dt)') + ' est la pente ' + M('frac(Δu;Δt)') + '.</p>' +
            eq('i', 'C frac(Δu;Δt)', num(Cv) + ' × frac(' + num(U) + ';' + num(dtC) + ')', fmt(iC, 'A'))),
          q('Calculer la tension $u$ aux bornes de la bobine pendant la montée du courant.', uL, 'V', ['ch02UL'],
            eq('u', 'L frac(Δi;Δt)', num(L) + ' × frac(' + num(I2) + ' − ' + num(I1) + ';' + num(dtL) + ')', fmt(uL, 'V'))),
          q('Calculer la tension $u$ aux bornes de la bobine pendant la descente du courant (avec son signe).', -uL, 'V', ['ch02UL'],
            eq('u', 'L frac(Δi;Δt)', num(L) + ' × frac(' + num(I1) + ' − ' + num(I2) + ';' + num(dtL) + ')', fmt(-uL, 'V')) + '<p>Le courant diminue : la tension est négative.</p>')
        ]
      };
    }
  });

  // ---------- Chapitre 3 : mesure de tension ----------

  X.problemes.push({
    id: 'signal-sinusoidal', titre: 'Période, fréquence et valeurs d\'un signal sinusoïdal', chapitre: 'ch03', parties: ['ch03/periodique', 'ch03/moyenne-efficace', 'ch03/notations'], niveau: 1,
    generer: function () {
      const ct = choix([5e-3, 2e-3, 1e-3, 0.5e-3, 0.1e-3, 20e-6]), nT = choix([4, 5, 8, 10]);
      const cv = choix([0.5, 1, 2, 5]), nV = choix([1.5, 2, 2.5, 3, 3.5]);
      const T = nT * ct, Um = nV * cv;
      return {
        circuit: null,
        enonce: '<p>Un oscilloscope affiche une tension sinusoïdale ' + M('u(t)') + ' centrée sur l\'axe. Calibres : ' + fmt(ct, 's') + '/div et ' + fmt(cv, 'V') +
          '/div. Une période occupe ' + num(nT) + ' divisions ; le maximum est à ' + num(nV) + ' divisions au-dessus de l\'axe.</p>',
        questions: [
          q('Déterminer la période $T$.', T, 's', ['ch03Frequence'], eq('T', num(nT) + ' div × ' + fmt(ct, 's') + '/div', fmt(T, 's'))),
          q('En déduire la fréquence $f$.', 1 / T, 'Hz', ['ch03Frequence'], eq('f', 'frac(1;T)', 'frac(1;' + num(T) + ')', fmt(1 / T, 'Hz'))),
          q('Déterminer la valeur maximale $Û$.', Um, 'V', ['ch04Oscillo'], eq('Û', num(nV) + ' div × ' + fmt(cv, 'V') + '/div', fmt(Um, 'V'))),
          q('En déduire la valeur efficace $U$.', Um / Math.SQRT2, 'V', ['ch03Efficace', 'ch04Eff'],
            '<p>Pour une sinusoïde, ' + M('U = frac(Û;sqrt(2))') + ' (comme dans le document 3 : 2 A maximum → 1,41 A efficace). La valeur moyenne, elle, est nulle.</p>' +
            eq('U', 'frac(' + num(Um) + ';sqrt(2))', fmt(Um / Math.SQRT2, 'V')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'multimetre-trms', titre: 'Mesures au multimètre TRMS d\'une tension ondulée', chapitre: 'ch03', parties: ['ch03/trms', 'ch03/multimetres-rms', 'ch03/moyenne-efficace'], niveau: 2,
    generer: function () {
      const U0 = choix([2, 5, 10, 12, 24]), Um = choix([1, 2, 3, 5]);
      const Uond = Um / Math.SQRT2, Utot = Math.sqrt(U0 * U0 + Uond * Uond);
      return {
        circuit: null,
        enonce: '<p>Une tension ' + M('u(t)') + ' est la somme d\'une composante continue ' + M('&lt;u&gt;') + ' = ' + fmt(U0, 'V') + ' et d\'une ondulation sinusoïdale de valeur maximale ' +
          fmt(Um, 'V') + ' : ' + M('u = &lt;u&gt; + u_{ond}') + '. On la mesure avec un multimètre TRMS.</p>',
        questions: [
          q('Quelle valeur affiche le multimètre en position DC ?', U0, 'V', ['ch03Decomposition'], '<p>En position DC, le multimètre mesure la valeur moyenne, c\'est-à-dire la composante continue.</p>' + eq('&lt;u&gt;', fmt(U0, 'V'))),
          q('Quelle valeur affiche-t-il en position AC ?', Uond, 'V', ['ch03Decomposition', 'ch04Eff'],
            '<p>En position AC, il mesure la valeur efficace de la seule composante alternative (l\'ondulation).</p>' + eq('U_{ond}', 'frac(' + num(Um) + ';sqrt(2))', fmt(Uond, 'V'))),
          q('Quelle valeur affiche-t-il en position AC+DC ?', Utot, 'V', ['ch03Efficace'],
            '<p>En position AC+DC, il mesure la valeur efficace du signal complet. Relation ajoutée par le site (hors polycopié) :</p>' +
            eq('U', 'sqrt(&lt;u&gt;^2 + U_{ond}^2)', 'sqrt(' + num(U0) + '^2 + ' + num(Uond) + '^2)', fmt(Utot, 'V'))),
          q('Quelle est la valeur maximale de $u(t)$ ?', U0 + Um, 'V', ['ch03Decomposition'], eq('U_{max}', '&lt;u&gt; + ' + num(Um), fmt(U0 + Um, 'V')))
        ]
      };
    }
  });

  // ---------- Chapitre 4 : déphasage ----------

  X.problemes.push({
    id: 'fresnel-lecture', titre: 'Lecture d\'une représentation de Fresnel', chapitre: 'ch04', parties: ['ch04/td', 'ch04/definition'], niveau: 1,
    generer: function () {
      const kV = choix([10, 20, 30, 50]), kI = choix([0.25, 0.5, 1, 2]);
      const lV = choix([2.5, 3, 3.4, 4, 4.6]), lI = choix([1.5, 2, 2.5, 3]);
      const phi = choix([18, 30, 45, 60]) * (Math.random() < 0.5 ? 1 : -1), r = phi * Math.PI / 180;
      const V = lV * kV, I = lI * kI;
      const dessin = PE.dessin.vecteurs([
        { de: C.c(0, 0), a: C.c(lV, 0), nom: 'V', classe: 'tension' },
        { de: C.c(0, 0), a: C.c(lI * Math.cos(r), -lI * Math.sin(r)), nom: 'I', classe: 'courant', cote: -1 }
      ], 360, 240);
      return {
        circuit: null,
        enonce: '<p>On donne la représentation de Fresnel ci-dessous (sens + : trigonométrique). Échelles : ' + num(kV) + ' V/cm et ' + num(kI) + ' A/cm. On mesure : ' +
          M('V') + ' : ' + num(lV) + ' cm ; ' + M('I') + ' : ' + num(lI) + ' cm ; angle entre les deux vecteurs : ' + Math.abs(phi) + '°, ' + M('I') + ' étant ' +
          (phi > 0 ? 'en dessous' : 'au-dessus') + ' de ' + M('V') + '.</p><div class="schema-wrap">' + dessin + '</div>',
        questions: [
          q('Déterminer la valeur efficace $V$ de la tension.', V, 'V', [], eq('V', num(lV) + ' cm × ' + num(kV) + ' V/cm', fmt(V, 'V'))),
          q('Déterminer la valeur efficace $I$ du courant.', I, 'A', [], eq('I', num(lI) + ' cm × ' + num(kI) + ' A/cm', fmt(I, 'A'))),
          q('Déterminer le déphasage $φ$ de $i$ par rapport à $v$, en degrés et avec son signe.', phi, '°', ['ch04Def'],
            '<p>' + M('I') + ' est ' + (phi > 0 ? 'en retard (tourné dans le sens horaire)' : 'en avance (tourné dans le sens trigonométrique)') + ' par rapport à ' + M('V') +
            ' : ' + M('φ') + ' est ' + (phi > 0 ? 'positif, dipôle inductif' : 'négatif, dipôle capacitif') + '.</p>' + eq('φ', (phi > 0 ? '+' : '−') + Math.abs(phi) + '°'), { tolAbs: 1 }),
          q('Calculer la valeur maximale du courant, utile pour écrire $i(t) = I sqrt(2) sin(ωt − φ)$.', I * Math.SQRT2, 'A', ['ch04Eff', 'ch04Ecriture'],
            eq('I sqrt(2)', num(I) + ' × sqrt(2)', fmt(I * Math.SQRT2, 'A')))
        ]
      };
    }
  });

  X.problemes.push({
    id: 'dephasage-industrie', titre: 'Déphasage d\'une installation et surtaxe', chapitre: 'ch04', parties: ['ch04/mesure', 'ch04/industrie', 'ch04/definition'], niveau: 1,
    generer: function () {
      const f = 50, T = 1 / f, dt = choix([0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]) * 1e-3;
      const deg = 360 * dt / T, rad = 2 * Math.PI * dt / T, dtMax = 0.38 * T / (2 * Math.PI);
      return {
        circuit: null,
        enonce: '<p>Une installation industrielle est alimentée par le réseau (' + fmt(f, 'Hz') + '). À l\'oscilloscope, le courant passe par son maximum ' + fmt(dt, 's') +
          ' après la tension.</p>',
        questions: [
          q('Calculer la période $T$ du réseau.', T, 's', ['ch04Freq'], eq('T', 'frac(1;f)', 'frac(1;' + num(f) + ')', fmt(T, 's'))),
          q('Calculer le déphasage $φ$ en degrés.', deg, '°', ['ch04PhiDeg', 'ch04Def'],
            eq('φ', 'frac(360 × Δt;T)', 'frac(360 × ' + num(dt) + ';' + num(T) + ')', PE.fmtDeg(deg)) + '<p>Le courant est en retard : ' + M('φ') + ' est positif (installation inductive).</p>', { tolAbs: 0.5 }),
          q('Calculer le déphasage $φ$ en radians.', rad, 'rad', ['ch04PhiRad', 'ch04Seuil'],
            eq('φ', 'frac(2π × Δt;T)', 'frac(2π × ' + num(dt) + ';' + num(T) + ')', num(rad) + ' rad') +
            '<p>' + (rad < 0.38 ? 'φ &lt; 0,38 rad : pas de surtaxe.' : 'φ ≥ 0,38 rad : le fournisseur d\'électricité applique une surtaxe ; il faut relever le facteur de puissance avec des condensateurs.') + '</p>'),
          q('Quel décalage $Δt$ maximal permet d\'éviter la surtaxe ?', dtMax, 's', ['ch04PhiRad', 'ch04Seuil'],
            eq('Δt_{max}', 'frac(0,38 × T;2π)', 'frac(0,38 × ' + num(T) + ';2π)', fmt(dtMax, 's')))
        ]
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
