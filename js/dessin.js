// Dessins SVG : schéma électrique (mise en page automatique de l'arbre série / parallèle),
// diagramme de Fresnel, triangle des puissances, courbes temporelles.
(function (root) {
  'use strict';
  const PE = root.PE;
  const K = PE.circuit;
  const C = PE.C;
  const D = PE.dessin = {};

  const LEN = 92;   // longueur occupée par un dipôle le long du fil
  const SYM = 44;   // longueur du symbole
  const PAD = 14;   // amorce avant / après un groupe parallèle

  // ---------- Symboles (repère local : fil horizontal, centre en 0,0) ----------
  D.symbole = function (type) {
    if (type === 'R') return '<rect class="sym" x="-22" y="-8" width="44" height="16"/>';
    if (type === 'L') return '<path class="sym" d="M-22 0 a5.5 5.5 0 0 1 11 0 a5.5 5.5 0 0 1 11 0 a5.5 5.5 0 0 1 11 0 a5.5 5.5 0 0 1 11 0"/>';
    if (type === 'C') return '<path class="sym" d="M-22 0 H-4 M4 0 H22 M-4 -12 V12 M4 -12 V12"/>';
    return '';
  };
  D.symboleSource = function (regime) {
    return '<circle class="sym" r="17"/>' + (regime === 'DC'
      ? '<path class="sym" d="M-5 -7 H5 M0 -12 V-2 M-5 8 H5"/>'
      : '<path class="sym" d="M-9 0 q4.5 -10 9 0 t9 0"/>');
  };

  function etiquette(f, opts) {
    const v = opts.valeurs === false ? '' : PE.fmt(f.val, K.UNITE[f.type]);
    return { nom: PE.nomHTML(f.nom).replace(/<sub>/g, '<tspan class="ind" dy="3">').replace(/<\/sub>/g, '</tspan>'), val: v };
  }

  // Encombrement d'un nœud : longueur le long du fil, a = débord côté haut/gauche, b = côté bas/droite.
  function mes(n, dir) {
    if (K.estFeuille(n)) return dir === 'h' ? { len: LEN, a: 34, b: 18 } : { len: LEN, a: 18, b: 86 };
    const ms = n.children.map(function (c) { return mes(c, dir); });
    if (n.type === 'serie') {
      return {
        len: ms.reduce(function (s, m) { return s + m.len; }, 0),
        a: Math.max.apply(null, ms.map(function (m) { return m.a; })),
        b: Math.max.apply(null, ms.map(function (m) { return m.b; }))
      };
    }
    let b = ms[0].b;
    for (let i = 1; i < ms.length; i++) b += ms[i].a + ms[i].b;
    return { len: Math.max.apply(null, ms.map(function (m) { return m.len; })) + 2 * PAD, a: ms[0].a, b: b };
  }

  function pt(x, y, dir, d, off) {
    return dir === 'h' ? [x + d, y + (off || 0)] : [x + (off || 0), y + d];
  }
  function fil(o, p, q) {
    o.push('<line class="fil" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>');
  }
  function noeud(o, p) { o.push('<circle class="noeud" cx="' + p[0] + '" cy="' + p[1] + '" r="2.8"/>'); }

  function tracer(n, x, y, dir, len, o, opts) {
    if (K.estFeuille(n)) {
      const c = pt(x, y, dir, len / 2);
      fil(o, [x, y], pt(x, y, dir, len / 2 - SYM / 2));
      fil(o, pt(x, y, dir, len / 2 + SYM / 2), pt(x, y, dir, len));
      o.push('<g transform="translate(' + c[0] + ' ' + c[1] + ')' + (dir === 'v' ? ' rotate(90)' : '') + '">' + D.symbole(n.type) + '</g>');
      const e = etiquette(n, opts);
      if (dir === 'h') {
        o.push('<text class="lbl" text-anchor="middle" x="' + c[0] + '" y="' + (c[1] - 16) + '">' + e.nom +
          (e.val ? '<tspan dy="' + (e.nom.indexOf('tspan') > 0 ? -3 : 0) + '"> = ' + e.val + '</tspan>' : '') + '</text>');
      } else {
        o.push('<text class="lbl" x="' + (c[0] + 18) + '" y="' + (c[1] - (e.val ? 3 : -4)) + '">' + e.nom + '</text>');
        if (e.val) o.push('<text class="lbl val" x="' + (c[0] + 18) + '" y="' + (c[1] + 13) + '">' + e.val + '</text>');
      }
      return;
    }
    const m = mes(n, dir);
    if (n.type === 'serie') {
      const marge = (len - m.len) / 2;
      let d = marge;
      if (marge > 0) fil(o, [x, y], pt(x, y, dir, marge));
      n.children.forEach(function (c) {
        const mc = mes(c, dir);
        const p = pt(x, y, dir, d);
        tracer(c, p[0], p[1], dir, mc.len, o, opts);
        d += mc.len;
      });
      if (marge > 0) fil(o, pt(x, y, dir, d), pt(x, y, dir, len));
      return;
    }
    // Parallèle : première branche sur l'axe, les suivantes décalées.
    const ms = n.children.map(function (c) { return mes(c, dir); });
    const offs = [0];
    for (let i = 1; i < ms.length; i++) offs.push(offs[i - 1] + ms[i - 1].b + ms[i].a);
    const dernier = offs[offs.length - 1];
    fil(o, [x, y], pt(x, y, dir, PAD));
    fil(o, pt(x, y, dir, len - PAD), pt(x, y, dir, len));
    fil(o, pt(x, y, dir, PAD), pt(x, y, dir, PAD, dernier));
    fil(o, pt(x, y, dir, len - PAD), pt(x, y, dir, len - PAD, dernier));
    n.children.forEach(function (c, i) {
      const p = pt(x, y, dir, PAD, offs[i]);
      tracer(c, p[0], p[1], dir, len - 2 * PAD, o, opts);
      if (i < ms.length - 1) { noeud(o, p); noeud(o, pt(x, y, dir, len - PAD, offs[i])); }
    });
  }

  // Schéma complet : source à gauche, dipôles en série sur le fil du haut,
  // dernier groupe parallèle dessiné "en échelle" entre les deux fils.
  D.circuit = function (circuit, opts) {
    opts = opts || {};
    const charge = circuit.charge;
    if (!charge) return '<p class="vide">Schéma vide : ajoute un dipôle.</p>';
    const items = charge.type === 'serie' ? charge.children.slice() : [charge];
    let echelle = [];
    if (items[items.length - 1].type === 'par') echelle = items.pop().children;
    const mh = items.map(function (n) { return mes(n, 'h'); });
    const mv = echelle.map(function (n) { return mes(n, 'v'); });
    const x0 = 112;
    const y0 = 22 + Math.max.apply(null, [22].concat(mh.map(function (m) { return m.a; })));
    const H = Math.max.apply(null, [132]
      .concat(mh.map(function (m) { return m.b + 26; }))
      .concat(mv.map(function (m) { return m.len; })));
    const yb = y0 + H;
    const o = [];
    const dc = circuit.regime === 'DC';

    // Source
    const ym = (y0 + yb) / 2;
    fil(o, [x0, y0], [x0, ym - 17]);
    fil(o, [x0, ym + 17], [x0, yb]);
    o.push('<g transform="translate(' + x0 + ' ' + ym + ')">' + D.symboleSource(circuit.regime) + '</g>');
    o.push('<path class="fleche" d="M' + (x0 - 28) + ' ' + (ym + 30) + ' V' + (ym - 26) + '"/>' +
      '<path class="pointe" d="M' + (x0 - 28) + ' ' + (ym - 34) + ' l-4 9 h8 z"/>');
    const nomV = opts.nomSource || (dc ? 'E' : 'V');
    if (opts.source === false) {
      o.push('<text class="lbl" text-anchor="end" x="' + (x0 - 38) + '" y="' + (ym + 4) + '">' + nomV + '</text>');
    } else {
      o.push('<text class="lbl" text-anchor="end" x="' + (x0 - 38) + '" y="' + (ym - (dc ? -4 : 4)) + '">' + nomV + ' = ' + PE.fmt(circuit.V, 'V') + '</text>');
      if (!dc) o.push('<text class="lbl val" text-anchor="end" x="' + (x0 - 38) + '" y="' + (ym + 13) + '">f = ' + PE.fmt(circuit.f, 'Hz') + '</text>');
    }

    // Fil du haut, courant I
    let x = x0 + 40;
    fil(o, [x0, y0], [x, y0]);
    o.push('<path class="pointe" d="M' + (x0 + 26) + ' ' + y0 + ' l-9 -4 v8 z"/>' +
      '<text class="lbl" text-anchor="middle" x="' + (x0 + 20) + '" y="' + (y0 - 9) + '">I</text>');
    items.forEach(function (n, i) {
      tracer(n, x, y0, 'h', mh[i].len, o, opts);
      x += mh[i].len;
    });
    let xmax;
    if (echelle.length) {
      const xs = [];
      echelle.forEach(function (n, i) {
        x += Math.max(mv[i].a, 22);
        xs.push(x);
        tracer(n, x, y0, 'v', H, o, opts);
        x += mv[i].b;
      });
      const xd = xs[xs.length - 1];
      fil(o, [xs[0] - Math.max(mv[0].a, 22), y0], [xd, y0]);
      fil(o, [x0, yb], [xd, yb]);
      xs.slice(0, -1).forEach(function (xx) { noeud(o, [xx, y0]); noeud(o, [xx, yb]); });
      xmax = x;
    } else {
      fil(o, [x, y0], [x + 22, y0]);
      fil(o, [x + 22, y0], [x + 22, yb]);
      fil(o, [x0, yb], [x + 22, yb]);
      xmax = x + 40;
    }
    const W = Math.max(xmax + 8, 300);
    const Ht = yb + 22;
    return '<svg class="schema" viewBox="0 0 ' + W + ' ' + Ht + '" width="' + W + '" height="' + Ht +
      '" role="img" aria-label="Schéma électrique : ' + PE.esc(K.decrire(charge)) + '">' + o.join('') + '</svg>';
  };

  // ---------- Diagramme de Fresnel ----------
  // vecteurs : [{ de: complexe, a: complexe, nom, classe }] déjà mis à l'échelle (unité arbitraire).
  function vecteursSVG(vs, W, H) {
    let xmin = 0, xmax = 0, ymin = 0, ymax = 0;
    vs.forEach(function (v) {
      [v.de, v.a].forEach(function (p) {
        xmin = Math.min(xmin, p.re); xmax = Math.max(xmax, p.re);
        ymin = Math.min(ymin, p.im); ymax = Math.max(ymax, p.im);
      });
    });
    const m = 46;
    const k = Math.min((W - 2 * m) / Math.max(xmax - xmin, 1e-9), (H - 2 * m) / Math.max(ymax - ymin, 1e-9));
    const ox = m + (W - 2 * m - k * (xmax - xmin)) / 2 - k * xmin;
    const oy = H - m - (H - 2 * m - k * (ymax - ymin)) / 2 + k * ymin;
    const X = function (p) { return ox + k * p.re; };
    const Y = function (p) { return oy - k * p.im; };
    const o = ['<line class="axe" x1="8" y1="' + oy + '" x2="' + (W - 8) + '" y2="' + oy + '"/>'];
    vs.forEach(function (v) {
      const x1 = X(v.de), y1 = Y(v.de), x2 = X(v.a), y2 = Y(v.a);
      const L = Math.hypot(x2 - x1, y2 - y1);
      if (L < 2) return;
      const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
      const bx = x2 - ux * 9, by = y2 - uy * 9;
      o.push('<g class="vect ' + v.classe + '"><line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + bx.toFixed(1) + '" y2="' + by.toFixed(1) + '"/>' +
        '<path d="M' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' L' + (bx - uy * 4).toFixed(1) + ' ' + (by + ux * 4).toFixed(1) + ' L' + (bx + uy * 4).toFixed(1) + ' ' + (by - ux * 4).toFixed(1) + ' z"/>' +
        '<text x="' + ((x1 + x2) / 2 - uy * 13 * (v.cote || 1)).toFixed(1) + '" y="' + ((y1 + y2) / 2 + ux * 13 * (v.cote || 1) + 4).toFixed(1) + '" text-anchor="middle">' + v.nom + '</text></g>');
    });
    return '<svg class="fresnel" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Diagramme de Fresnel">' + o.join('') + '</svg>';
  }

  D.fresnel = function (circuit, sol) {
    const ch = circuit.charge;
    const info = sol.info;
    const vs = [];
    const rot = function (z, ref) { return C.div(z, C.c(Math.cos(C.arg(ref)), Math.sin(C.arg(ref)))); };
    const zero = C.c(0, 0);
    const nomDe = function (n, g) { return K.estFeuille(n) ? g + '<tspan class="ind" dy="3">' + n.nom + '</tspan>' : g + '<tspan class="ind" dy="3">(' + K.decrire(n) + ')</tspan>'; };
    let legende;
    if (ch.type === 'par') {
      // Même tension : V à l'origine des phases, on additionne les courants.
      const kI = 1 / sol.Ieff;
      vs.push({ de: zero, a: C.c(0.75, 0), nom: 'V', classe: 'tension' });
      let cur = zero;
      ch.children.forEach(function (c) {
        const s = C.mul(info.get(c).I, C.c(kI, 0));
        const fin = C.add(cur, s);
        vs.push({ de: cur, a: fin, nom: nomDe(c, 'I'), classe: 'courant2' });
        cur = fin;
      });
      vs.push({ de: zero, a: C.mul(sol.I, C.c(kI, 0)), nom: 'I', classe: 'courant', cote: -1 });
      legende = 'Dipôles en dérivation : même tension V (origine des phases). Le courant total I est la somme vectorielle des courants de branche.';
    } else {
      // Même courant : I à l'origine des phases, on additionne les tensions.
      const kV = 1 / sol.V;
      vs.push({ de: zero, a: C.c(0.6, 0), nom: 'I', classe: 'courant' });
      const items = ch.type === 'serie' ? ch.children : [ch];
      let cur = zero;
      if (items.length > 1) {
        items.forEach(function (c) {
          const s = C.mul(rot(info.get(c).V, sol.I), C.c(kV, 0));
          const fin = C.add(cur, s);
          vs.push({ de: cur, a: fin, nom: nomDe(c, 'V'), classe: 'tension2' });
          cur = fin;
        });
      }
      vs.push({ de: zero, a: C.mul(rot(C.c(sol.V, 0), sol.I), C.c(kV, 0)), nom: 'V', classe: 'tension', cote: -1 });
      legende = items.length > 1
        ? 'Dipôles en série : même courant I (origine des phases). La tension V est la somme vectorielle des tensions.'
        : 'Le courant I est pris comme origine des phases.';
    }
    return vecteursSVG(vs, 420, 300) + '<p class="legende">' + legende + ' Les tensions et les courants ne sont pas à la même échelle.</p>';
  };

  // Vecteurs libres : [{ de, a (complexes), nom, classe: 'tension' | 'courant' | 'tension2' | 'courant2', cote }].
  D.vecteurs = function (vs, W, H) { return vecteursSVG(vs, W || 380, H || 260); };

  // ---------- Oscillogramme ----------
  // Écran 10 × 8 divisions : v (voie 1) et i (voie 2), centrés sur l'axe.
  // nT : divisions par période ; nV, nI : amplitudes en divisions ; nDt : retard de i sur v en divisions (négatif : avance).
  D.oscillogramme = function (nT, nV, nI, nDt, legende) {
    const d = 40, W = 10 * d, H = 8 * d, N = 240;
    let grille = '';
    for (let k = 0; k <= 10; k++) grille += '<line class="axe" opacity="' + (k % 10 ? 0.25 : 1) + '" x1="' + k * d + '" y1="0" x2="' + k * d + '" y2="' + H + '"/>';
    for (let k = 0; k <= 8; k++) grille += '<line class="axe" opacity="' + (k % 4 ? 0.25 : 1) + '" x1="0" y1="' + k * d + '" x2="' + W + '" y2="' + k * d + '"/>';
    const courbe = function (amp, decal, cls) {
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const x = 10 * i / N;
        pts.push((x * d).toFixed(1) + ',' + (H / 2 - amp * d * Math.sin(2 * Math.PI * (x - decal) / nT)).toFixed(1));
      }
      return '<polyline class="courbe ' + cls + '" points="' + pts.join(' ') + '"/>';
    };
    return '<div class="schema-wrap"><svg class="courbes" viewBox="-1 -1 ' + (W + 2) + ' ' + (H + 2) + '" width="' + W + '" height="' + H +
      '" role="img" aria-label="Oscillogramme de la tension et du courant">' + grille + courbe(nV, 0, 'c-v') + courbe(nI, nDt, 'c-i') +
      '</svg><p class="legende"><span class="pastille c-v"></span> ' + PE.math('v') + ' &nbsp; <span class="pastille c-i"></span> ' + PE.math('i') +
      ' — ' + (legende || '10 × 8 divisions') + '</p></div>';
  };

  // ---------- Triangle des puissances ----------
  D.triangle = function (P, Q, Q2) {
    const vs = [
      { de: C.c(0, 0), a: C.c(P, 0), nom: 'P', classe: 'tension2', cote: Q >= 0 ? 1 : -1 },
      { de: C.c(P, 0), a: C.c(P, Q), nom: 'Q', classe: 'courant2', cote: Q >= 0 ? 1 : -1 },
      { de: C.c(0, 0), a: C.c(P, Q), nom: 'S', classe: 'tension', cote: Q >= 0 ? -1 : 1 }
    ];
    if (typeof Q2 === 'number') vs.push({ de: C.c(0, 0), a: C.c(P, Q2), nom: 'S′', classe: 'courant', cote: -1 });
    return vecteursSVG(vs.filter(function (v) { return C.abs(C.sub(v.a, v.de)) > 0; }), 380, 240);
  };

  // ---------- Courbes v(t), i(t), p(t) ----------
  D.courbes = function (sol) {
    const W = 520, H = 230, m = 14, N = 160;
    const T2 = 2 / sol.f;
    const Vm = sol.V * Math.SQRT2, Im = sol.Ieff * Math.SQRT2;
    const pmax = sol.S + Math.abs(sol.P);
    const ym = H / 2, A = H / 2 - m;
    const courbe = function (fn, amp, cls) {
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const t = T2 * i / N;
        pts.push((m + (W - 2 * m) * i / N).toFixed(1) + ',' + (ym - A * fn(t) / amp).toFixed(1));
      }
      return '<polyline class="courbe ' + cls + '" points="' + pts.join(' ') + '"/>';
    };
    const v = function (t) { return Vm * Math.sin(sol.omega * t); };
    const i = function (t) { return Im * Math.sin(sol.omega * t - sol.phi); };
    const yP = ym - A * sol.P / pmax;
    return '<svg class="courbes" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Courbes de la tension, du courant et de la puissance instantanée">' +
      '<line class="axe" x1="' + m + '" y1="' + ym + '" x2="' + (W - m) + '" y2="' + ym + '"/>' +
      '<line class="axe pointille" x1="' + m + '" y1="' + yP.toFixed(1) + '" x2="' + (W - m) + '" y2="' + yP.toFixed(1) + '"/>' +
      courbe(function (t) { return v(t) * i(t); }, pmax, 'c-p') +
      courbe(v, Vm, 'c-v') + courbe(i, Im * 1.35, 'c-i') +
      '</svg><p class="legende"><span class="pastille c-v"></span> v(t) &nbsp; <span class="pastille c-i"></span> i(t) &nbsp; ' +
      '<span class="pastille c-p"></span> p(t) = v(t) × i(t) &nbsp; — &nbsp; pointillés : valeur moyenne de p, c\'est-à-dire P. Deux périodes sont tracées, chaque courbe à sa propre échelle.</p>';
  };
})(typeof window !== 'undefined' ? window : globalThis);
