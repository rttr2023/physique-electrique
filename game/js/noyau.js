// Ampéria — noyau : espace de noms, hasard, nombres, unités, rendu des formules.
// Ne dépend pas du navigateur : utilisable dans Node (outils de vérification).
(function (racine) {
  'use strict';
  const AMP = racine.AMP = racine.AMP || {};

  // ---------- Hasard (graine reproductible) ----------
  // Générateur mulberry32 : AMP.hasard(graine) renvoie une fonction qui donne un nombre dans [0, 1[.
  AMP.hasard = function (graine) {
    let a = (graine >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  AMP.alea = Math.random; // remplaçable pour les tests
  AMP.entre = function (min, max, rnd) { return min + ((rnd || AMP.alea)() * (max - min)); };
  AMP.choisir = function (liste, rnd) { return liste[Math.floor((rnd || AMP.alea)() * liste.length)]; };
  AMP.melanger = function (liste, rnd) {
    const l = liste.slice();
    for (let i = l.length - 1; i > 0; i--) {
      const j = Math.floor((rnd || AMP.alea)() * (i + 1));
      const t = l[i]; l[i] = l[j]; l[j] = t;
    }
    return l;
  };
  // Petit hachage d'une chaîne (pour placer des objets de façon stable).
  AMP.hacher = function (s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  // ---------- Nombres ----------
  // Arrondi à `sig` chiffres significatifs.
  AMP.arrondir = function (x, sig) {
    if (!isFinite(x) || x === 0) return x;
    return Number(x.toPrecision(sig || 3));
  };
  // Écriture française : virgule décimale, signe moins typographique.
  AMP.nombre = function (x, sig) {
    if (typeof x !== 'number' || isNaN(x)) return '?';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    const v = AMP.arrondir(x, sig || 3);
    let s;
    if (v !== 0 && (Math.abs(v) >= 1e7 || Math.abs(v) < 1e-4)) {
      const p = v.toExponential((sig || 3) - 1).split('e');
      s = String(Number(p[0])) + ' × 10^' + Number(p[1]);
    } else {
      s = String(v);
      // Séparateur de milliers (espace fine insécable) pour les grands entiers.
      const m = s.split('.');
      if (Math.abs(v) >= 10000) m[0] = m[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      s = m.join('.');
    }
    return s.replace('.', ',').replace(/-/g, '−');
  };

  // Préfixes SI utilisés dans le jeu.
  AMP.PREFIXES = [
    { p: 'p', f: 1e-12 }, { p: 'n', f: 1e-9 }, { p: 'µ', f: 1e-6 }, { p: 'm', f: 1e-3 },
    { p: '', f: 1 }, { p: 'k', f: 1e3 }, { p: 'M', f: 1e6 }, { p: 'G', f: 1e9 }
  ];
  // Unités qui ne prennent pas de préfixe.
  AMP.SANS_PREFIXE = { '': true, '°': true, 'rad': true, 'rad/s': true, 'V²': true };

  // Unités : forme normalisée pour comparer (VAR = var, ohm = Ω…).
  AMP.normUnite = function (u) {
    u = String(u == null ? '' : u).trim();
    const t = { var: 'VAR', VAr: 'VAR', Var: 'VAR', 'V.A': 'VA', 'V·A': 'VA', ohm: 'Ω', ohms: 'Ω', 'Ω': 'Ω', deg: '°', 'rad.s-1': 'rad/s', 'rad·s⁻¹': 'rad/s', sans: '' };
    return Object.prototype.hasOwnProperty.call(t, u) ? t[u] : u;
  };
  AMP.nomUnite = function (u) { return u === '' ? 'sans unité' : u; };

  // Valeur + unité, avec le préfixe le plus lisible (4,7 kΩ ; 0,754 mA ; 230 V).
  AMP.valeur = function (x, unite, sig) {
    unite = AMP.normUnite(unite);
    sig = sig || 3;
    if (AMP.SANS_PREFIXE[unite] || !isFinite(x) || x === 0) {
      return AMP.nombre(x, sig) + (unite ? (unite === '°' ? '°' : ' ' + unite) : '');
    }
    let e = Math.floor(Math.log10(Math.abs(x)) / 3) * 3;
    e = Math.max(-12, Math.min(9, e));
    let m = AMP.arrondir(x / Math.pow(10, e), sig);
    if (Math.abs(m) >= 1000 && e < 9) { m /= 1000; e += 3; }
    const pre = AMP.PREFIXES.find(function (p) { return Math.abs(p.f - Math.pow(10, e)) / p.f < 1e-9; });
    return AMP.nombre(m, sig) + ' ' + (pre ? pre.p : '') + unite;
  };

  // Lecture d'une saisie : "0,72", "1.5e3", "−2", "4,7×10^-3".
  AMP.lireNombre = function (s) {
    s = String(s == null ? '' : s).replace(/\s| | /g, '').replace(/,/g, '.').replace(/[−–]/g, '-')
      .replace(/[×x*]10\^?/i, 'e').replace(/E/g, 'e');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
  };

  // ---------- Texte et formules ----------
  AMP.esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  // Rendu LaTeX : KaTeX s'il est chargé, sinon une écriture simplifiée lisible.
  AMP.tex = function (latex, bloc) {
    const k = racine.katex;
    if (k) {
      try { return k.renderToString(latex, { displayMode: !!bloc, throwOnError: false, strict: false }); }
      catch (e) { /* écriture simplifiée ci-dessous */ }
    }
    return '<span class="tex-simple">' + AMP.esc(AMP.texSimple(latex)) + '</span>';
  };
  // LaTeX → texte lisible (sans KaTeX).
  AMP.texSimple = function (s) {
    const sym = { varphi: 'φ', phi: 'φ', omega: 'ω', pi: 'π', Delta: 'Δ', tau: 'τ', times: '×', cdots: '…', cdot: '·', langle: '⟨', rangle: '⟩', quad: '  ', sum: 'Σ', circ: '°', hat: '' };
    let t = String(s);
    for (let i = 0; i < 4; i++) {
      t = t.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)').replace(/\\sqrt\{([^{}]*)\}/g, '√($1)')
        .replace(/\\(underline|vec|text|boxed|mathrm)\{([^{}]*)\}/g, '$2');
    }
    t = t.replace(/\\([a-zA-Z]+)/g, function (m, n) { return Object.prototype.hasOwnProperty.call(sym, n) ? sym[n] : n; })
      .replace(/\\[,;! ]/g, ' ').replace(/\{,\}/g, ',').replace(/[{}]/g, '').replace(/\^2/g, '²').replace(/\^\\circ|\^°/g, '°');
    return t;
  };
  // Texte du cours contenant des formules entre $...$.
  AMP.texte = function (s) {
    return String(s == null ? '' : s).split(/(\$[^$]+\$)/g).map(function (part) {
      return /^\$[^$]+\$$/.test(part) ? AMP.tex(part.slice(1, -1)) : AMP.esc(part);
    }).join('');
  };

  // Évalue une expression de calcul du JSON avec des valeurs { code: nombre }.
  AMP.evaluer = function (expr, valeurs) {
    const noms = Object.keys(valeurs);
    // eslint-disable-next-line no-new-func
    const f = Function.apply(null, noms.concat('"use strict"; return (' + expr + ');'));
    return f.apply(null, noms.map(function (n) { return valeurs[n]; }));
  };

  // ---------- Temps (en jours) ----------
  // decalageJours sert au mode test (« avancer le temps »).
  AMP.decalageJours = 0;
  AMP.aujourdhui = function () { return Math.floor(Date.now() / 86400000) + AMP.decalageJours; };

  if (typeof module !== 'undefined' && module.exports) module.exports = AMP;
})(typeof window !== 'undefined' ? window : globalThis);
