// Sections de calcul du laboratoire. Chaque section est enregistrée dans PE.calculs.sections :
//   { id, titre, chapitre, parties, regime: 'AC' | 'DC', applicable(ctx) (optionnel), rendu(ctx) -> HTML }
//   parties : sections du cours dont relève le calcul ('ch05/modele'…) ; la section s'affiche dès qu'une est cochée dans le volet.
// ctx = { c: circuit, s: solution (PE.circuit.resoudre), params: { cosCible } }
// Un nouveau chapitre peut ajouter ses propres sections avec PE.calculs.ajouter({...}).
(function (root) {
  'use strict';
  const PE = root.PE;
  const K = PE.circuit;
  const C = PE.C;
  const num = PE.num, fmt = PE.fmt, fmtDeg = PE.fmtDeg, nm = PE.nomMath;
  const Q = PE.calculs = { sections: [] };

  Q.ajouter = function (section) { Q.sections.push(section); };
  Q.pour = function (ctx) {
    return Q.sections.filter(function (s) {
      return s.regime === ctx.s.regime && (!s.applicable || s.applicable(ctx));
    });
  };

  // Ligne d'égalités : eq('Z', 'frac(V;I)', '346 Ω')
  function eq() {
    return '<div class="eq">' + PE.math(Array.prototype.slice.call(arguments).join(' = ')) + '</div>';
  }
  function p(t) { return '<p>' + PE.texte(t) + '</p>'; }
  function res(t) { return '<p class="resultat">' + PE.texte(t) + '</p>'; }
  function table(tetes, lignes) {
    return '<div class="table-wrap"><table><thead><tr>' + tetes.map(function (t) { return '<th>' + t + '</th>'; }).join('') +
      '</tr></thead><tbody>' + lignes.map(function (l) {
        return '<tr>' + l.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  const M = PE.math;
  Q.outils = { eq: eq, p: p, res: res, table: table };

  function serieSimple(n) {
    return K.estFeuille(n) || (n.type === 'serie' && n.children.every(K.estFeuille));
  }
  // Nom de l'impédance d'un nœud dans les formules.
  function etiquettes(charge) {
    const map = new Map();
    let i = 0;
    (function visite(n) {
      if (K.estFeuille(n)) { map.set(n, 'cx(Z)_{' + n.nom + '}'); return; }
      n.children.forEach(visite);
      map.set(n, n === charge ? 'cx(Z)' : 'cx(Z)_{' + 'ABCDEFGH'[i++ % 8] + '}');
    })(charge);
    return map;
  }

  // ================= Régime sinusoïdal =================

  Q.ajouter({
    id: 'pulsation', titre: 'Pulsation et réactances', chapitre: 'ch05', parties: ['ch05/inductif', 'ch05/capacitif', 'ch05/rlc'], regime: 'AC',
    rendu: function (ctx) {
      const s = ctx.s;
      let h = p('La pulsation relie la fréquence de la source aux impédances des bobines et des condensateurs.') +
        eq('ω', '2πf', '2π × ' + num(s.f), fmt(s.omega, 'rad/s'));
      s.feuilles.forEach(function (f) {
        if (f.type === 'L') h += eq('X_{' + f.nom + '}', nm(f.nom) + ' ω', num(f.val) + ' × ' + num(s.omega), fmt(f.val * s.omega, 'Ω'));
        if (f.type === 'C') h += eq('X_{' + f.nom + '}', 'frac(1;' + nm(f.nom) + ' ω)', 'frac(1;' + num(f.val) + ' × ' + num(s.omega) + ')', fmt(1 / (f.val * s.omega), 'Ω'));
      });
      return h;
    }
  });

  Q.ajouter({
    id: 'dipoles', titre: 'Impédance et déphasage de chaque dipôle', chapitre: 'ch05', parties: ['ch05/resistif', 'ch05/inductif', 'ch05/capacitif', 'ch05/rlc'], regime: 'AC',
    rendu: function (ctx) {
      const s = ctx.s;
      const lignes = s.feuilles.map(function (f) {
        const z = s.info.get(f).Z;
        if (f.type === 'R') return [PE.nomHTML(f.nom), 'Résistance', M('Z = R') + ' = ' + fmt(f.val, 'Ω'), M('cx(Z) = R'), 'φ = 0° — courant en phase'];
        if (f.type === 'L') return [PE.nomHTML(f.nom), 'Inductance pure', M('Z = Lω') + ' = ' + fmt(C.abs(z), 'Ω'), M('cx(Z) = jLω'), 'φ = +90° — courant en retard'];
        return [PE.nomHTML(f.nom), 'Condensateur', M('Z = frac(1;Cω)') + ' = ' + fmt(C.abs(z), 'Ω'), M('cx(Z) = frac(1;jCω)'), 'φ = −90° — courant en avance'];
      });
      return p('Pour chaque élément de modélisation, la loi d\'Ohm en sinusoïdal s\'écrit $V = Z I$ entre valeurs efficaces.') +
        table(['Dipôle', 'Nature', 'Impédance', 'Notation complexe', 'Déphasage de i par rapport à v'], lignes);
    }
  });

  Q.ajouter({
    id: 'zeq', titre: 'Impédance équivalente', chapitre: 'ch05', parties: ['ch05/modelisation', 'ch05/modele'], regime: 'AC',
    rendu: function (ctx) {
      const s = ctx.s, ch = ctx.c.charge;
      let h = '';
      if (K.estFeuille(ch)) {
        return p('Le circuit ne comporte qu\'un seul dipôle : son impédance est l\'impédance du circuit.') +
          res('$Z$ = ' + fmt(s.Zmod, 'Ω'));
      }
      if (serieSimple(ch)) {
        const Rs = ch.children.filter(function (f) { return f.type === 'R'; });
        const Ls = ch.children.filter(function (f) { return f.type === 'L'; });
        const Cs = ch.children.filter(function (f) { return f.type === 'C'; });
        const Rt = s.Z.re, X = s.Z.im;
        h += p('Tous les dipôles sont en série : ils sont traversés par le même courant. Sur le diagramme de Fresnel, la tension aux bornes des résistances est en phase avec $I$, celle des bobines est en avance de 90° et celle des condensateurs en retard de 90°. Le théorème de Pythagore donne :');
        const symR = Rs.map(function (f) { return nm(f.nom); }).join(' + ') || '0';
        const symX = (Ls.map(function (f) { return nm(f.nom) + 'ω'; }).join(' + ') +
          Cs.map(function (f) { return ' − frac(1;' + nm(f.nom) + 'ω)'; }).join('')).trim().replace(/^− /, '−') || '0';
        if (Rs.length > 1) h += eq('R', symR, fmt(Rt, 'Ω'));
        if (Ls.length + Cs.length > 0) h += eq('X', symX, fmt(X, 'Ω'));
        const dansR = Rs.length > 1 ? 'R' : symR;
        const multi = Ls.length + Cs.length > 1 || Cs.length === 1;
        h += eq('Z', 'sqrt(' + (Rs.length ? (dansR.indexOf('+') > 0 ? '(' + dansR + ')' : dansR) + '^2 + ' : '') + (multi ? 'X^2' : '(' + symX + ')^2') + ')',
          'sqrt(' + (Rs.length ? num(Rt) + '^2 + ' : '') + (X < 0 ? '(' + num(X) + ')' : num(X)) + '^2)', fmt(s.Zmod, 'Ω'));
        h += res('$Z$ = ' + fmt(s.Zmod, 'Ω'));
        return h;
      }
      const noms = etiquettes(ch);
      h += p('Le schéma mélange série et dérivation : on réduit le circuit groupe par groupe en notation complexe, avec $cx(Z)_R = R$, $cx(Z)_L = jLω$ et $cx(Z)_C = frac(1;jCω)$. En série les impédances s\'ajoutent ; en dérivation ce sont leurs inverses qui s\'ajoutent.');
      (function visite(n) {
        if (K.estFeuille(n)) return;
        n.children.forEach(visite);
        const z = s.info.get(n).Z;
        const enfants = n.children.map(function (c) { return noms.get(c); });
        const titre = n === ch ? 'Circuit complet' : 'Groupe ' + K.decrire(n);
        h += '<h4>' + titre + ' — ' + (n.type === 'serie' ? 'série' : 'dérivation') + '</h4>';
        if (n.type === 'serie') {
          h += eq(noms.get(n), enfants.join(' + '),
            n.children.map(function (c) { return PE.fmtRect(s.info.get(c).Z, 'Ω'); }).join(' + '), PE.fmtRect(z, 'Ω'));
        } else {
          if (n.children.length === 2) h += eq(noms.get(n), 'frac(' + enfants[0] + ' × ' + enfants[1] + ';' + enfants[0] + ' + ' + enfants[1] + ')', PE.fmtRect(z, 'Ω'));
          else h += eq('frac(1;' + noms.get(n) + ')', enfants.map(function (e) { return 'frac(1;' + e + ')'; }).join(' + ')) + eq(noms.get(n), PE.fmtRect(z, 'Ω'));
        }
        h += eq(noms.get(n), PE.fmtPol(z, 'Ω'));
      })(ch);
      h += res('$Z$ = ' + fmt(s.Zmod, 'Ω') + ' (module de $cx(Z)$), argument ' + fmtDeg(s.phiDeg));
      return h;
    }
  });

  Q.ajouter({
    id: 'courant', titre: 'Courant absorbé et déphasage', chapitre: 'ch05', parties: ['ch05/impedance', 'ch05/modele'], regime: 'AC',
    rendu: function (ctx) {
      const s = ctx.s, ch = ctx.c.charge;
      let h = p('Loi d\'Ohm en sinusoïdal, entre valeurs efficaces :') +
        eq('I', 'frac(V;Z)', 'frac(' + num(s.V) + ';' + num(s.Zmod) + ')', fmt(s.Ieff, 'A'));
      if (serieSimple(ch) && !K.estFeuille(ch) && Math.abs(s.Z.re) > 0) {
        h += p('Dans le triangle de Fresnel, $tan φ = frac(côté opposé;côté adjacent)$ :') +
          eq('tan φ', 'frac(X;R)', 'frac(' + num(s.Z.im) + ';' + num(s.Z.re) + ')', num(s.Z.im / s.Z.re)) +
          eq('φ', 'arctan(' + num(s.Z.im / s.Z.re) + ')', fmtDeg(s.phiDeg));
      } else {
        h += p('Le déphasage de la tension par rapport au courant est l\'argument de l\'impédance équivalente :') +
          eq('φ', 'arg(cx(Z))', fmtDeg(s.phiDeg));
      }
      const texte = s.nature === 'inductif' ? 'φ &gt; 0 : le circuit est <strong>inductif</strong>, le courant est en retard sur la tension.'
        : s.nature === 'capacitif' ? 'φ &lt; 0 : le circuit est <strong>capacitif</strong>, le courant est en avance sur la tension.'
          : 'φ = 0 : le circuit est <strong>résistif</strong>, courant et tension sont en phase.';
      return h + res('$I$ = ' + fmt(s.Ieff, 'A') + ' et $φ$ = ' + fmtDeg(s.phiDeg) + '. ' + texte);
    }
  });

  Q.ajouter({
    id: 'detail', titre: 'Tension et courant de chaque dipôle', chapitre: 'ch05', parties: ['ch05/impedance', 'ch05/rlc'], regime: 'AC',
    rendu: function (ctx) {
      const s = ctx.s;
      const lignes = s.feuilles.map(function (f) {
        const o = s.info.get(f);
        return [PE.nomHTML(f.nom), fmt(C.abs(o.Z), 'Ω'), fmt(o.Ieff, 'A'), fmt(o.Veff, 'V'),
          fmtDeg(C.deg(o.I)), fmtDeg(C.deg(o.V))];
      });
      return p('En série, les dipôles sont traversés par le même courant et $U = Z I$. En dérivation, ils sont soumis à la même tension et $I = frac(U;Z)$. Les phases sont données par rapport à la tension de la source.') +
        table(['Dipôle', 'Z', 'I efficace', 'U efficace', 'Phase de i', 'Phase de u'], lignes) +
        p('Attention : les valeurs efficaces ne s\'additionnent pas directement, il faut tenir compte des phases (Fresnel) ou passer par les puissances (Boucherot).');
    }
  });

  Q.ajouter({
    id: 'fresnel', titre: 'Diagramme de Fresnel', chapitre: 'ch05', parties: ['ch05/modele'], regime: 'AC',
    rendu: function (ctx) { return PE.dessin.fresnel(ctx.c, ctx.s); }
  });

  Q.ajouter({
    id: 'puissances', titre: 'Puissances et méthode de Boucherot', chapitre: 'ch06', parties: ['ch06/active', 'ch06/reactive', 'ch06/apparente', 'ch06/boucherot', 'ch06/rlc', 'ch06/methode'], regime: 'AC',
    rendu: function (ctx) {
      const s = ctx.s;
      const lignes = s.feuilles.map(function (f) {
        const o = s.info.get(f);
        const I = num(o.Ieff), U = num(o.Veff), n = nm(f.nom);
        if (f.type === 'R') return [PE.nomHTML(f.nom), M('P = ' + n + ' I^2 = ' + num(f.val) + ' × ' + I + '^2') + ' = ' + fmt(o.P, 'W'), '0'];
        if (f.type === 'L') return [PE.nomHTML(f.nom), '0', M('Q = ' + n + 'ω I^2 = ' + num(f.val * s.omega) + ' × ' + I + '^2') + ' = ' + fmt(o.Q, 'var')];
        return [PE.nomHTML(f.nom), '0', M('Q = −' + n + 'ω U^2 = −' + num(f.val * s.omega) + ' × ' + U + '^2') + ' = ' + fmt(o.Q, 'var')];
      });
      const Ps = s.feuilles.filter(function (f) { return f.type === 'R'; });
      const Qs = s.feuilles.filter(function (f) { return f.type !== 'R'; });
      let h = p('Chaque résistance consomme de la puissance active, chaque bobine consomme de la puissance réactive et chaque condensateur en fournit. $I$ et $U$ sont le courant et la tension du dipôle concerné (section précédente).') +
        table(['Dipôle', 'P (active)', 'Q (réactive)'], lignes);
      h += '<h4>Étape 1 — puissance active totale</h4>' +
        eq('P_T', Ps.map(function (f) { return 'P_{' + f.nom + '}'; }).join(' + ') || '0', fmt(s.P, 'W'));
      h += '<h4>Étape 2 — puissance réactive totale</h4>' +
        eq('Q_T', Qs.map(function (f) { return 'Q_{' + f.nom + '}'; }).join(' + ') || '0', fmt(s.Q, 'var'));
      h += '<h4>Étape 3 — puissance apparente totale</h4>' +
        eq('S_T', 'sqrt(P_T^2 + Q_T^2)', 'sqrt(' + num(s.P) + '^2 + ' + (s.Q < 0 ? '(' + num(s.Q) + ')' : num(s.Q)) + '^2)', fmt(s.S, 'VA'));
      h += '<h4>Étape 4 — retour au courant à l\'entrée</h4>' +
        eq('I', 'frac(S_T;V)', 'frac(' + num(s.S) + ';' + num(s.V) + ')', fmt(s.S / s.V, 'A'));
      h += res('$P$ = ' + fmt(s.P, 'W') + ', $Q$ = ' + fmt(s.Q, 'var') + ', $S$ = ' + fmt(s.S, 'VA') + '. On retrouve bien le courant calculé avec l\'impédance.') +
        p('Le théorème de Boucherot ne s\'applique pas aux puissances apparentes : on n\'additionne jamais les $S$.');
      return h;
    }
  });

  Q.ajouter({
    id: 'fp', titre: 'Facteur de puissance et triangle des puissances', chapitre: 'ch06', parties: ['ch06/facteur', 'ch06/apparente', 'ch06/relation'], regime: 'AC',
    rendu: function (ctx) {
      const s = ctx.s;
      let h = eq('k', 'cos φ', 'frac(P;S)', 'frac(' + num(s.P) + ';' + num(s.S) + ')', num(s.k));
      if (s.P > 0) h += eq('tan φ', 'frac(Q;P)', 'frac(' + num(s.Q) + ';' + num(s.P) + ')', num(s.Q / s.P));
      h += PE.dessin.triangle(s.P, s.Q);
      const avis = s.k >= 0.93 ? 'C\'est un bon facteur de puissance (proche de 1).'
        : 'C\'est un facteur de puissance médiocre : pour la même puissance active, le courant en ligne est plus grand que nécessaire' +
        (s.Q > 0 ? ' (voir le relèvement ci-dessous).' : '.');
      return h + res('$cos φ$ = ' + num(s.k) + ' — circuit ' + s.nature + '. ' + avis);
    }
  });

  Q.ajouter({
    id: 'relevement', titre: 'Relèvement du facteur de puissance', chapitre: 'ch06', parties: ['ch06/relevement', 'ch06/capacite'], regime: 'AC',
    rendu: function (ctx) {
      const s = ctx.s;
      const cible = ctx.params && ctx.params.cosCible > 0 && ctx.params.cosCible <= 1 ? ctx.params.cosCible : 0.95;
      let h = '<p><label>Facteur de puissance visé cos φ′ : <input type="number" class="court" data-param="cosCible" min="0.01" max="1" step="0.01" value="' + cible + '"></label></p>';
      if (!(s.Q > 0) || !(s.P > 0)) {
        return h + p(s.P > 0 ? 'Le circuit n\'est pas inductif : il ne consomme pas de puissance réactive, une batterie de condensateurs n\'apporterait rien.'
          : 'Le circuit ne consomme aucune puissance active : le relèvement n\'a pas de sens ici.');
      }
      if (cible <= s.k) {
        return h + p('Le facteur de puissance actuel (' + num(s.k) + ') est déjà supérieur ou égal à la valeur visée.');
      }
      const t1 = s.Q / s.P, t2 = Math.tan(Math.acos(cible));
      const Cc = s.P * (t1 - t2) / (s.omega * s.V * s.V);
      const Qc = -Cc * s.omega * s.V * s.V;
      const Q2 = s.Q + Qc, S2 = Math.hypot(s.P, Q2);
      h += p('On branche une batterie de condensateurs en dérivation sur l\'installation. Elle ne change pas la puissance active ($P′ = P$) mais fournit de la puissance réactive ($Q′ = Q + Q_C$ avec $Q_C$ négative).');
      h += eq('tan φ', 'frac(Q;P)', num(t1)) + eq('tan φ′', 'tan(arccos ' + num(cible) + ')', num(t2));
      h += eq('C', 'frac(P (tan φ − tan φ′);2πf V^2)', 'frac(' + num(s.P) + ' × (' + num(t1) + ' − ' + num(t2) + ');2π × ' + num(s.f) + ' × ' + num(s.V) + '^2)', fmt(Cc, 'F'));
      h += eq('Q_C', '−Cω V^2', fmt(Qc, 'var')) + eq('Q′', 'Q + Q_C', fmt(Q2, 'var'));
      h += eq('S′', 'sqrt(P^2 + Q′^2)', fmt(S2, 'VA')) + eq('I′', 'frac(S′;V)', fmt(S2 / s.V, 'A'));
      h += PE.dessin.triangle(s.P, s.Q, Q2);
      h += res('$C$ = ' + fmt(Cc, 'F') + '. Le courant en ligne passe de ' + fmt(s.Ieff, 'A') + ' à ' + fmt(S2 / s.V, 'A') + ' pour la même puissance active.');
      return h;
    }
  });

  Q.ajouter({
    id: 'temporel', titre: 'Tension, courant et puissance instantanée', chapitre: 'ch06', parties: ['ch06/instantanee'], regime: 'AC',
    rendu: function (ctx) {
      const s = ctx.s;
      return eq('v(t)', 'V sqrt(2) sin(ωt)', num(s.V * Math.SQRT2) + ' sin(' + num(s.omega) + ' t)') +
        eq('i(t)', 'I sqrt(2) sin(ωt − φ)', num(s.Ieff * Math.SQRT2) + ' sin(' + num(s.omega) + ' t ' + (s.phi >= 0 ? '− ' : '+ ') + num(Math.abs(s.phi)) + ')') +
        eq('p(t)', 'v(t) × i(t)') + PE.dessin.courbes(s) +
        p('La puissance active $P = V I cos φ$ = ' + fmt(s.P, 'W') + ' est la valeur moyenne de la puissance instantanée. Quand $p &lt; 0$, le dipôle restitue de l\'énergie à la source.');
    }
  });

  // ================= Régime continu (t = 0+ et t -> ∞) =================

  function decrireEtat(n, instant, racine) {
    if (n.type === 'R') return n.nom;
    if (n.type === 'C') return instant === '0' ? 'fil' : 'ouvert';
    if (n.type === 'L') return instant === '0' ? 'ouvert' : 'fil';
    const t = n.children.map(function (c) { return decrireEtat(c, instant, false); }).join(n.type === 'serie' ? ' + ' : ' // ');
    return racine === false ? '(' + t + ')' : t;
  }

  function etat(ctx, instant) {
    const s = ctx.s, e = instant === '0' ? s.t0 : s.tinf;
    const ind = instant === '0' ? '0⁺' : '∞';
    let h = p(instant === '0'
      ? 'Juste après la fermeture : un condensateur déchargé garde $u_C = 0$, il se comporte comme un <strong>fil</strong> ; une bobine garde $i_L = 0$, elle se comporte comme un <strong>interrupteur ouvert</strong>.'
      : 'En régime permanent continu, plus rien ne varie : un condensateur chargé ne laisse plus passer de courant (<strong>interrupteur ouvert</strong>) ; une bobine n\'a plus de tension à ses bornes (<strong>fil</strong>).');
    h += '<div class="eq">' + PE.math('R_{eq}(' + ind + ')') + ' = ' + PE.esc(decrireEtat(ctx.c.charge, instant)) + ' = ' + fmt(e.Req, 'Ω') + '</div>';
    h += eq('I(' + ind + ')', 'frac(E;R_{eq}(' + ind + '))', isFinite(e.Req) ? 'frac(' + num(s.V) + ';' + num(e.Req) + ')' : '0', fmt(e.I, 'A'));
    h += table(['Dipôle', 'Courant', 'Tension'], s.feuilles.map(function (f) {
      const o = e.info.get(f);
      return [PE.nomHTML(f.nom), fmt(o.I, 'A'), fmt(o.V, 'V')];
    }));
    return h + res('$R_{eq}(' + ind + ')$ = ' + fmt(e.Req, 'Ω') + ' et $I(' + ind + ')$ = ' + fmt(e.I, 'A'));
  }

  Q.ajouter({ id: 'dc0', titre: 'État à t = 0⁺ (juste après la fermeture)', chapitre: 'ch05', parties: ['ch05/continu'], regime: 'DC', rendu: function (ctx) { return etat(ctx, '0'); } });
  Q.ajouter({ id: 'dcinf', titre: 'État en régime permanent (t → ∞)', chapitre: 'ch05', parties: ['ch05/continu'], regime: 'DC', rendu: function (ctx) { return etat(ctx, 'inf'); } });

  Q.ajouter({
    id: 'dcenergie', titre: 'Charge et énergie stockées', chapitre: 'ch05', parties: ['ch05/continu'], regime: 'DC',
    applicable: function (ctx) { return ctx.s.reactifs.length > 0; },
    rendu: function (ctx) {
      const s = ctx.s;
      let h = '';
      s.reactifs.forEach(function (f) {
        const o = s.tinf.info.get(f), n = nm(f.nom);
        if (f.type === 'C') {
          h += eq('Q(∞)', n + ' × V_C(∞)', num(f.val) + ' × ' + num(o.V), fmt(f.val * o.V, 'C')) +
            eq('W_C', 'frac(1;2) ' + n + ' V_C(∞)^2', '0,5 × ' + num(f.val) + ' × ' + num(o.V) + '^2', fmt(0.5 * f.val * o.V * o.V, 'J'));
        } else {
          h += eq('W_L', 'frac(1;2) ' + n + ' I_L(∞)^2', '0,5 × ' + num(f.val) + ' × ' + num(o.I) + '^2', fmt(0.5 * f.val * o.I * o.I, 'J'));
        }
      });
      return p('Un condensateur stocke de l\'énergie sous forme électrostatique (liée à sa tension), une bobine sous forme magnétique (liée à son courant).') + h;
    }
  });

  Q.ajouter({
    id: 'dctau', titre: 'Constante de temps', chapitre: 'ch05', parties: ['ch05/continu'], regime: 'DC',
    applicable: function (ctx) { return ctx.s.reactifs.length > 0; },
    rendu: function (ctx) {
      const s = ctx.s;
      if (s.tau === null) {
        return p(s.reactifs.length > 1
          ? 'Le circuit contient plusieurs bobines ou condensateurs : il n\'a pas une constante de temps unique.'
          : 'La constante de temps ne peut pas être déterminée pour ce schéma.');
      }
      const f = s.reactifs[0];
      let h = p('$R_{th}$ est la résistance vue depuis les bornes ' + (f.type === 'C' ? 'du condensateur' : 'de la bobine') +
        ' lorsque la source est éteinte (remplacée par un fil).') + eq('R_{th}', fmt(s.Rth, 'Ω'));
      h += f.type === 'C'
        ? eq('τ', 'R_{th} × ' + nm(f.nom), num(s.Rth) + ' × ' + num(f.val), fmt(s.tau, 's'))
        : eq('τ', 'frac(' + nm(f.nom) + ';R_{th})', 'frac(' + num(f.val) + ';' + num(s.Rth) + ')', fmt(s.tau, 's'));
      return h + res('$τ$ = ' + fmt(s.tau, 's') + '. Le régime permanent est pratiquement atteint au bout de $5τ$ = ' + fmt(5 * s.tau, 's') + '.');
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
