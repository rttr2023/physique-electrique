// Noyau : nombres complexes, formatage des valeurs, mini-langage de formules.
// Chargé en premier, utilisable aussi sous Node (outils/test.js).
(function (root) {
  'use strict';
  const PE = root.PE = root.PE || {};

  // ---------- Nombres complexes ----------
  const C = {
    c: function (re, im) { return { re: re, im: im || 0 }; },
    add: function (a, b) { return { re: a.re + b.re, im: a.im + b.im }; },
    sub: function (a, b) { return { re: a.re - b.re, im: a.im - b.im }; },
    mul: function (a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; },
    div: function (a, b) {
      const d = b.re * b.re + b.im * b.im;
      return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
    },
    inv: function (a) { return C.div({ re: 1, im: 0 }, a); },
    abs: function (a) { return Math.hypot(a.re, a.im); },
    arg: function (a) { return Math.atan2(a.im, a.re); },
    deg: function (a) { return Math.atan2(a.im, a.re) * 180 / Math.PI; }
  };
  PE.C = C;

  // ---------- Formatage ----------
  const PREFIXES = { '-12': 'p', '-9': 'n', '-6': 'µ', '-3': 'm', '0': '', '3': 'k', '6': 'M', '9': 'G' };
  const SANS_PREFIXE = { '': 1, '°': 1, 'rad': 1, 'rad/s': 1 };
  const NBSP = ' ';

  // Nombre à `sig` chiffres significatifs, virgule décimale.
  function num(x, sig) {
    sig = sig || 3;
    if (typeof x !== 'number' || isNaN(x)) return '?';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    if (x === 0) return '0';
    const v = Number(x.toPrecision(sig));
    let s;
    if (Math.abs(v) >= 1e15 || Math.abs(v) < 1e-6) {
      const p = v.toExponential(sig - 1).split('e');
      s = Number(p[0]) + '×10^{' + Number(p[1]) + '}';
    } else {
      s = String(v);
    }
    return s.replace('.', ',').replace(/-/g, '−');
  }

  // Décomposition ingénieur : x = m × 10^e, e multiple de 3.
  function eng(x, sig) {
    if (x === 0 || !isFinite(x) || isNaN(x)) return { m: x, e: 0, p: '' };
    let e = Math.floor(Math.log10(Math.abs(x)) / 3) * 3;
    e = Math.max(-12, Math.min(9, e));
    let m = Number((x / Math.pow(10, e)).toPrecision(sig || 3));
    if (Math.abs(m) >= 1000 && e < 9) { m /= 1000; e += 3; }
    return { m: m, e: e, p: PREFIXES[String(e)] };
  }

  // Valeur + unité avec préfixe (230 V, 4,7 kΩ, 100 nF...).
  function fmt(x, unite, sig) {
    unite = unite || '';
    if (SANS_PREFIXE[unite] || !isFinite(x) || isNaN(x)) {
      return num(x, sig) + (unite ? (unite === '°' ? '' : NBSP) + unite : '');
    }
    const g = eng(x, sig);
    return num(g.m, sig) + NBSP + g.p + unite;
  }

  function fmtDeg(x) {
    const v = Math.round(x * 10) / 10;
    return num(v === 0 ? 0 : v, 4) + '°';
  }

  // Complexe sous forme algébrique, avec un préfixe commun.
  function fmtRect(z, unite) {
    const g = eng(C.abs(z));
    const k = Math.pow(10, g.e);
    const seuil = C.abs(z) * 1e-9;
    const re = Math.abs(z.re) < seuil ? 0 : z.re / k;
    const im = Math.abs(z.im) < seuil ? 0 : z.im / k;
    let s;
    if (im === 0) s = num(re);
    else if (re === 0) s = (im < 0 ? '−' : '') + 'j' + num(Math.abs(im));
    else s = num(re) + (im < 0 ? ' − ' : ' + ') + 'j' + num(Math.abs(im));
    const u = g.p + (unite || '');
    if (!u) return s;
    return (re !== 0 && im !== 0 ? '(' + s + ')' : s) + NBSP + u;
  }

  // Complexe sous forme polaire : module ∠ argument.
  function fmtPol(z, unite) {
    return fmt(C.abs(z), unite) + ' ∠ ' + fmtDeg(C.deg(z));
  }

  // Lecture d'une saisie utilisateur ("0,72", "1.5e3", " 12 ").
  function lire(s) {
    if (typeof s === 'number') return s;
    s = String(s || '').replace(/\s/g, '').replace(',', '.').replace('−', '-');
    if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }

  PE.num = num; PE.eng = eng; PE.fmt = fmt; PE.fmtDeg = fmtDeg;
  PE.fmtRect = fmtRect; PE.fmtPol = fmtPol; PE.lire = lire;

  // ---------- Mini-langage de formules ----------
  // frac(a;b)  sqrt(a)  cx(V) (grandeur complexe, soulignée)  vec(V)
  // x_1  x_{abc}  x^2  x^{abc}
  function math(s) {
    s = String(s);
    let out = '';
    let i = 0;
    while (i < s.length) {
      const m = /^(frac|sqrt|cx|vec)\(/.exec(s.slice(i, i + 6));
      if (m) {
        let j = i + m[0].length, depth = 1, last = j;
        const parts = [];
        while (j < s.length) {
          const ch = s[j];
          if (ch === '(') depth++;
          else if (ch === ')') { depth--; if (depth === 0) break; }
          else if (ch === ';' && depth === 1) { parts.push(s.slice(last, j)); last = j + 1; }
          j++;
        }
        parts.push(s.slice(last, j));
        i = j + 1;
        const p = parts.map(math);
        if (m[1] === 'frac') out += '<span class="frac"><span class="num">' + p[0] + '</span><span class="den">' + (p[1] || '') + '</span></span>';
        else if (m[1] === 'sqrt') out += '<span class="sqrt">√<span class="rad">' + p[0] + '</span></span>';
        else if (m[1] === 'cx') out += '<span class="cx">' + p[0] + '</span>';
        else out += '<span class="vec">' + p[0] + '</span>';
        continue;
      }
      if ((s[i] === '_' || s[i] === '^') && i + 1 < s.length) {
        const tag = s[i] === '_' ? 'sub' : 'sup';
        let inner;
        if (s[i + 1] === '{') {
          const f = s.indexOf('}', i);
          inner = s.slice(i + 2, f);
          i = f + 1;
        } else {
          inner = s[i + 1];
          i += 2;
        }
        out += '<' + tag + '>' + math(inner) + '</' + tag + '>';
        continue;
      }
      out += s[i++];
    }
    return out;
  }

  PE.math = function (s) { return '<span class="math">' + math(s) + '</span>'; };
  // Texte contenant des formules entre $...$
  PE.texte = function (s) {
    return String(s).replace(/\$([^$]+)\$/g, function (_, f) { return PE.math(f); });
  };
  // "R1" -> "R_{1}" pour le mini-langage.
  PE.nomMath = function (nom) {
    nom = String(nom);
    return nom.length > 1 ? nom[0] + '_{' + nom.slice(1) + '}' : nom;
  };
  PE.nomHTML = function (nom) {
    nom = String(nom);
    return nom.length > 1 ? nom[0] + '<sub>' + nom.slice(1) + '</sub>' : nom;
  };
  PE.esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  // ---------- Registres alimentés par les chapitres ----------
  PE.cours = [];
  PE.formules = {};
  // Année du chapitre (1 par défaut). Ids : 'ch07' en 1re année, 'a2-ch07' en 2e année, etc.
  PE.annee = function (ch) { return ch.annee || 1; };
  PE.ajouterCours = function (ch) {
    PE.cours.push(ch);
    PE.cours.sort(function (a, b) { return PE.annee(a) - PE.annee(b) || a.numero - b.numero; });
    (ch.formules || []).forEach(function (f) {
      f.chapitre = ch.id;
      PE.formules[f.id] = f;
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
