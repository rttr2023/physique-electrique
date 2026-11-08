// Ampéria — fabrication et correction des questions, à partir des JSON de cours.
// Aucune question n'est écrite ici : tout vient de game/data/. Fonctionne aussi dans Node.
(function (racine) {
  'use strict';
  const AMP = racine.AMP;
  const Q = AMP.questions = {};

  Q.TYPES = {
    eclair: { nom: 'Éclair', icone: '⚡', etoiles: 1, aide: 'QCM sur une notion' },
    soudure: { nom: 'Soudure', icone: '🔧', etoiles: 2, aide: 'Compléter une formule' },
    arc: { nom: 'Arc calculé', icone: '🔥', etoiles: 3, aide: 'Calcul avec unité' },
    diagnostic: { nom: 'Diagnostic', icone: '🔍', etoiles: 2, aide: 'Unité ou bonne formule' },
    contre: { nom: 'Contre-piège', icone: '🛡', etoiles: 1, aide: 'Vrai ou faux' }
  };
  Q.TOLERANCE = 0.02;

  // Groupes d'unités faciles à confondre (pour des propositions crédibles).
  const CONFUSIONS = [['W', 'VA', 'VAR', 'J'], ['V', 'A', 'Ω'], ['H', 'F', 'C'], ['Hz', 'rad/s', 's'], ['°', 'rad', ''], ['V/s', 'A/s', 'V'], ['Ω', 'S', 'H']];
  const E12 = [1, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];

  function D() { return AMP.donnees; }
  function itemsDuChapitre(ch, type) { return (D().parChapitre[ch.id] || []).filter(function (it) { return !type || it.type === type; }); }

  // ---------- Morceaux communs ----------
  Q.sourceHtml = function (el) {
    const s = el && el.source;
    if (!s || !s.fichier) return '';
    return '<div class="source">📄 <a href="../Cours/' + encodeURIComponent(s.fichier) + '" target="_blank" rel="noopener">' +
      AMP.esc(s.fichier) + '</a>' + (s.zone ? ' — ' + AMP.esc(s.zone) : '') + badges(el) + '</div>';
  };
  function badges(el) {
    let b = '';
    if (el.origine === 'hors_cours') b += ' <span class="badge hc" title="' + AMP.esc((el.ajouts || []).join(' ; ')) + '">hors cours</span>';
    if (el.origine === 'manuscrit') b += ' <span class="badge ms">manuscrit</span>';
    return b;
  }
  Q.badges = badges;

  // Fiche d'une formule (correction, codex).
  Q.ficheFormule = function (f, avecSource) {
    let h = '<div class="formule-bloc">' + AMP.tex(f.latex, true) + '</div>';
    h += '<table class="variables">' + (f.variables || []).map(function (v) {
      return '<tr><td>' + AMP.tex(v.symbole) + '</td><td>' + AMP.esc(v.signification) + '</td><td class="u">' + AMP.esc(AMP.nomUnite(v.unite)) + '</td></tr>';
    }).join('') + '</table>';
    if (f.conditions) h += '<p class="conditions">' + AMP.texte(f.conditions) + '</p>';
    if (avecSource !== false) h += Q.sourceHtml(f);
    return h;
  };

  // Symbole LaTeX présent « en entier » dans une formule (R ne doit pas trouver R_{eq} ni \varphi).
  function motifSymbole(sym) {
    const e = sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(?<![A-Za-z\\\\])' + e + "(?![A-Za-z_{'])", 'g');
  }
  Q.variablesSoudables = function (f) {
    return (f.variables || []).filter(function (v) {
      if (!v.symbole || v.symbole.indexOf(',') >= 0) return false;
      const n = (f.latex.match(motifSymbole(v.symbole)) || []).length;
      return n > 0;
    });
  };

  // Valeurs réalistes pour une variable d'une formule (voir data/plages.json).
  function specValeur(fId, v) {
    const P = D().plages;
    return (P.formules && P.formules[fId] && P.formules[fId][v.code]) || (P.codes && P.codes[v.code]) ||
      (P.unites && P.unites[AMP.normUnite(v.unite)]) || { plage: [1, 100], sig: 2 };
  }
  function tirerValeur(spec, rnd, dejaTire) {
    if (spec.liste) return { v: AMP.choisir(spec.liste, rnd) };
    if (spec.entier) return { v: Math.floor(AMP.entre(spec.entier[0], spec.entier[1] + 1, rnd)) };
    if (spec.degres) { const d = Math.round(AMP.entre(spec.degres[0], spec.degres[1], rnd)); return { v: d * Math.PI / 180, deg: d }; }
    if (spec.e12) {
      const choix = [];
      for (let dec = -12; dec <= 6; dec++) E12.forEach(function (m) { const x = AMP.arrondir(m * Math.pow(10, dec), 3); if (x >= spec.e12[0] * 0.999 && x <= spec.e12[1] * 1.001) choix.push(x); });
      return { v: AMP.choisir(choix, rnd) };
    }
    let a = spec.plage[0], b = spec.plage[1];
    if (spec.fraction_de) { const ref = dejaTire[spec.fraction_de]; a *= ref; b *= ref; }
    let x;
    if (a > 0 && b / a > 20) x = Math.exp(AMP.entre(Math.log(a), Math.log(b), rnd)); // répartition logarithmique
    else x = AMP.entre(a, b, rnd);
    return { v: AMP.arrondir(x, spec.sig || 2) };
  }

  // Propositions d'unités : la bonne + des unités du chapitre faciles à confondre.
  function unitesProposees(bonne, ch, rnd) {
    bonne = AMP.normUnite(bonne);
    const pool = [];
    CONFUSIONS.forEach(function (g) { if (g.indexOf(bonne) >= 0) g.forEach(function (u) { if (u !== bonne) pool.push(u); }); });
    AMP.melanger(AMP.unitesChapitre(ch), rnd).forEach(function (u) { if (u !== bonne && pool.indexOf(u) < 0) pool.push(u); });
    const l = [bonne].concat(pool.filter(function (u, i) { return pool.indexOf(u) === i; }).slice(0, 4));
    return AMP.melanger(l, rnd);
  }

  // ---------- Quels types d'attaque pour un élément ? ----------
  Q.typesPossibles = function (it) {
    if (it.type === 'notion') return ['eclair'];
    if (it.type === 'piege') return D().affirmations[it.id] ? ['contre'] : [];
    const f = it.el, t = [];
    if (Q.variablesSoudables(f).length) t.push('soudure');
    const autres = itemsDuChapitre(it.ch, 'formule').filter(function (x) { return x.el.latex !== f.latex; });
    if (autres.length >= 3 || (f.variables || []).some(function (v) { return v.unite.indexOf(',') < 0; })) t.push('diagnostic');
    const p = D().plages.formules && D().plages.formules[f.id];
    if (f.calcul && !(p && p.exclure)) t.push('arc');
    return t;
  };

  // Choix du type selon la boîte : on commence par reconnaître, on finit par calculer.
  Q.choisirType = function (it, rnd) {
    const t = Q.typesPossibles(it);
    if (t.length <= 1) return t[0] || null;
    const e = AMP.srs && AMP.etat ? AMP.srs.etat(it.id) : null;
    const b = e ? e.boite : 0;
    const poids = { soudure: b <= 1 ? 3 : b <= 3 ? 2 : 1, diagnostic: b <= 1 ? 3 : b <= 3 ? 2 : 1, arc: b <= 1 ? 1.5 : b <= 3 ? 3 : 4 };
    let total = 0; t.forEach(function (x) { total += poids[x]; });
    let r = (rnd || AMP.alea)() * total;
    for (const x of t) { r -= poids[x]; if (r <= 0) return x; }
    return t[t.length - 1];
  };

  Q.generer = function (it, type, rnd) {
    rnd = rnd || AMP.alea;
    type = type || Q.choisirType(it, rnd);
    const g = { eclair: eclair, soudure: soudure, diagnostic: diagnostic, arc: arc, contre: contre }[type];
    if (!g) return null;
    const q = g(it, rnd);
    if (!q) return null;
    q.type = type; q.itemId = it.id; q.ids = q.ids || [it.id];
    q.etoiles = Q.TYPES[type].etoiles;
    return q;
  };

  // ---------- Éclair : QCM sur une notion ----------
  function eclair(it, rnd) {
    const n = it.el;
    let autres = itemsDuChapitre(it.ch, 'notion').filter(function (x) { return x.id !== it.id; });
    if (autres.length < 3) autres = autres.concat(Object.values(D().items).filter(function (x) { return x.type === 'notion' && x.ch !== it.ch; }));
    const leurres = AMP.melanger(autres, rnd).slice(0, 3);
    const correction = '<p><strong>' + AMP.esc(n.nom) + '</strong> : ' + AMP.texte(n.definition) + '</p>' + Q.sourceHtml(n);
    if (rnd() < 0.5) {
      return {
        titre: 'Que signifie…', enonceHtml: '<p class="q-grand">« ' + AMP.esc(n.nom) + ' » ?</p>', mode: 'choix',
        choix: AMP.melanger([{ html: AMP.texte(n.definition), juste: true }].concat(leurres.map(function (x) { return { html: AMP.texte(x.el.definition), juste: false }; })), rnd),
        correctionHtml: correction
      };
    }
    return {
      titre: 'De quelle notion s\'agit-il ?', enonceHtml: '<blockquote>' + AMP.texte(masquer(n.definition, n.nom)) + '</blockquote>', mode: 'choix',
      choix: AMP.melanger([{ html: AMP.esc(n.nom), juste: true }].concat(leurres.map(function (x) { return { html: AMP.esc(x.el.nom), juste: false }; })), rnd),
      correctionHtml: correction
    };
  }
  // Cache dans la définition les mots significatifs du nom (sinon la réponse est dans la question).
  function masquer(def, nom) {
    const mots = nom.toLowerCase().replace(/[«»():,.'’]/g, ' ').split(/\s+/).filter(function (m) { return m.length > 4; })
      .map(function (m) { return m.slice(0, Math.max(5, m.length - 2)); });
    let d = def;
    mots.forEach(function (m) {
      d = d.replace(new RegExp('\\b' + m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[a-zàâäéèêëïîôöùûüç]*', 'gi'), '▢▢▢');
    });
    return d;
  }
  Q.masquer = masquer;

  // ---------- Soudure : formule à trous ----------
  function soudure(it, rnd) {
    const f = it.el;
    const vars = Q.variablesSoudables(f);
    if (!vars.length) return null;
    const v = AMP.choisir(vars, rnd);
    const latexTrou = f.latex.replace(motifSymbole(v.symbole), '\\boxed{\\,?\\,}');
    const symboles = {};
    itemsDuChapitre(it.ch, 'formule').forEach(function (x) { (x.el.variables || []).forEach(function (w) { if (w.symbole.indexOf(',') < 0) symboles[w.symbole] = true; }); });
    let pool = Object.keys(symboles).filter(function (s) { return s !== v.symbole && AMP.texSimple(s) !== AMP.texSimple(v.symbole); });
    if (pool.length < 3) {
      Object.values(D().items).forEach(function (x) { if (x.type === 'formule') (x.el.variables || []).forEach(function (w) { if (w.symbole.indexOf(',') < 0 && w.symbole !== v.symbole && pool.indexOf(w.symbole) < 0) pool.push(w.symbole); }); });
    }
    // Deux symboles qui s'affichent pareil (V et V souligné) ne doivent pas être proposés ensemble.
    const vus = {}; vus[AMP.texSimple(v.symbole)] = true;
    const leurres = AMP.melanger(pool, rnd).filter(function (s) {
      const k = AMP.texSimple(s); if (vus[k]) return false; vus[k] = true; return true;
    }).slice(0, 3);
    return {
      titre: 'Complète la formule', enonceHtml: '<p class="q-petit">' + AMP.esc(f.nom) + '</p><div class="formule-bloc">' + AMP.tex(latexTrou, true) + '</div>',
      mode: 'choix',
      choix: AMP.melanger([{ html: AMP.tex(v.symbole), juste: true }].concat(leurres.map(function (s) { return { html: AMP.tex(s), juste: false }; })), rnd),
      correctionHtml: '<p>Il manquait ' + AMP.tex(v.symbole) + ' : ' + AMP.esc(v.signification) + '.</p>' + Q.ficheFormule(f),
      aides: { memo: null, unite: null }
    };
  }

  // ---------- Diagnostic : unité ou bonne formule ----------
  function diagnostic(it, rnd) {
    const f = it.el;
    const varsU = (f.variables || []).filter(function (v) { return v.unite.indexOf(',') < 0; });
    const autres = itemsDuChapitre(it.ch, 'formule').filter(function (x) { return x.id !== it.id && x.el.latex !== f.latex; });
    const versionUnite = varsU.length && (autres.length < 3 || rnd() < 0.5);
    if (versionUnite) {
      const v = AMP.choisir(varsU, rnd);
      const bonne = AMP.normUnite(v.unite);
      const prop = unitesProposees(bonne, it.ch, rnd).slice(0, 4);
      if (prop.indexOf(bonne) < 0) prop[0] = bonne;
      return {
        titre: 'Quelle unité ?', enonceHtml: '<p class="q-grand">' + AMP.tex(v.symbole) + '</p><p>' + AMP.esc(v.signification) + ' <span class="q-petit">(' + AMP.esc(f.nom) + ')</span></p>',
        mode: 'choix',
        choix: AMP.melanger(prop, rnd).map(function (u) { return { html: AMP.esc(AMP.nomUnite(u)), juste: u === bonne }; }),
        correctionHtml: '<p>' + AMP.tex(v.symbole) + ' s\'exprime en <strong>' + AMP.esc(AMP.nomUnite(bonne)) + '</strong>.</p>' + Q.ficheFormule(f)
      };
    }
    const leurres = AMP.melanger(autres, rnd).filter(function (x, i, l) { return l.findIndex(function (y) { return y.el.latex === x.el.latex; }) === i; }).slice(0, 3);
    return {
      titre: 'Quelle relation ?', enonceHtml: '<p class="q-grand">' + AMP.esc(f.nom) + '</p>' + (f.conditions ? '<p class="q-petit">' + AMP.texte(f.conditions) + '</p>' : ''),
      mode: 'choix',
      choix: AMP.melanger([{ html: AMP.tex(f.latex), juste: true }].concat(leurres.map(function (x) { return { html: AMP.tex(x.el.latex), juste: false }; })), rnd),
      correctionHtml: Q.ficheFormule(f)
    };
  }

  // ---------- Arc calculé : calcul avec des valeurs réalistes ----------
  Q.tirerCalcul = function (f, rnd) {
    const cible = f.variables.find(function (v) { return v.code === f.calcul.cible; });
    const entrees = f.variables.filter(function (v) { return v.code !== f.calcul.cible; });
    // Les variables qui dépendent d'une autre (fraction_de) sont tirées en dernier.
    entrees.sort(function (a, b) { return (specValeur(f.id, a).fraction_de ? 1 : 0) - (specValeur(f.id, b).fraction_de ? 1 : 0); });
    for (let essai = 0; essai < 40; essai++) {
      const vals = {}, affichage = [];
      entrees.forEach(function (v) {
        const t = tirerValeur(specValeur(f.id, v), rnd, vals);
        vals[v.code] = t.v;
        affichage.push({ v: v, texte: t.deg != null ? t.deg + '°' : AMP.valeur(t.v, v.unite, 4) });
      });
      let r;
      try { r = AMP.evaluer(f.calcul.expression, vals); } catch (e) { return null; }
      if (!isFinite(r) || Math.abs(r) < 1e-13 || Math.abs(r) > 1e10) continue;
      if (cible.unite === '' && f.id.indexOf('.k') >= 0 && (r > 1 || r < 0)) continue;
      let unite = AMP.normUnite(cible.unite), valeur = r;
      const p = D().plages.formules && D().plages.formules[f.id];
      if (unite === 'rad' && !(p && p.reponse_en === 'rad')) { unite = '°'; valeur = r * 180 / Math.PI; }
      return { vals: vals, affichage: affichage, cible: cible, valeur: valeur, unite: unite };
    }
    return null;
  };

  function arc(it, rnd) {
    const f = it.el;
    const t = Q.tirerCalcul(f, rnd);
    if (!t) return null;
    const donnees = '<ul class="donnees">' + t.affichage.map(function (a) {
      return '<li>' + AMP.tex(a.v.symbole) + ' = ' + AMP.esc(a.texte) + ' <span class="q-petit">(' + AMP.esc(a.v.signification) + ')</span></li>';
    }).join('') + '</ul>';
    const enRad = t.unite === 'rad' ? ' Réponds en radians.' : (AMP.normUnite(t.cible.unite) === 'rad' ? ' Réponds en degrés.' : '');
    return {
      titre: 'Calcule !',
      enonceHtml: '<p>Calcule <strong>' + AMP.esc(t.cible.signification) + '</strong> ' + AMP.tex(t.cible.symbole) + '.' + enRad + '</p>' +
        '<p class="q-petit">Relation : ' + AMP.esc(f.nom) + '</p>' + donnees,
      mode: 'saisie',
      attendu: { valeur: t.valeur, unite: t.unite, tolerance: Q.TOLERANCE },
      unites: unitesProposees(t.unite, it.ch, rnd),
      prefixes: !AMP.SANS_PREFIXE[t.unite],
      correctionHtml: '<p>Résultat : <strong>' + AMP.tex(t.cible.symbole) + ' = ' + AMP.esc(AMP.valeur(t.valeur, t.unite, 3)) + '</strong></p>' + Q.ficheFormule(f),
      aides: { memo: AMP.tex(f.latex, true), unite: t.unite }
    };
  }

  // ---------- Contre-piège : vrai ou faux ----------
  function contre(it, rnd) {
    const a = D().affirmations[it.id];
    if (!a) return null;
    const vrai = rnd() < 0.5;
    return {
      titre: 'Vrai ou faux ?', enonceHtml: '<p class="q-grand">' + AMP.texte(vrai ? a.vrai : a.faux) + '</p>', mode: 'choix', vraiFaux: true,
      choix: [{ html: 'Vrai', juste: vrai }, { html: 'Faux', juste: !vrai }],
      correctionHtml: (vrai ? '<p>C\'était <strong>vrai</strong>.</p>' : '<p>C\'était <strong>faux</strong>. Ce qui est juste : ' + AMP.texte(a.vrai) + '</p>') +
        '<p class="piege">⚠ ' + AMP.texte(it.el.texte) + '</p>' + Q.sourceHtml(it.el)
    };
  }

  // ---------- Correction ----------
  // reponse : index du choix (mode choix) ou { valeur (SI), unite } (mode saisie).
  Q.verifier = function (q, reponse) {
    if (q.mode === 'choix') return q.choix[reponse] && q.choix[reponse].juste ? 'juste' : 'faux';
    if (q.mode === 'saisie') {
      if (!reponse || typeof reponse.valeur !== 'number' || isNaN(reponse.valeur)) return 'faux';
      const a = q.attendu;
      const ecart = Math.abs(reponse.valeur - a.valeur) / Math.max(Math.abs(a.valeur), 1e-15);
      const valeurOk = ecart <= (a.tolerance || Q.TOLERANCE);
      const uniteOk = AMP.normUnite(reponse.unite) === AMP.normUnite(a.unite);
      if (valeurOk && uniteOk) return 'juste';
      if (valeurOk) return 'demi';
      return 'faux';
    }
    return reponse === true ? 'juste' : 'faux'; // auto-évaluation
  };

  // ---------- Boss : exercices en plusieurs étapes ----------
  // Une étape sans calcul mais avec une valeur doit correspondre à une donnée pour qu'on puisse changer les valeurs.
  function donneePour(ex, etape) {
    const r = etape.reponse;
    return (ex.donnees || []).find(function (d) { return Math.abs(d.valeur - r.valeur) <= 1e-9 * Math.max(1, Math.abs(r.valeur)) && AMP.normUnite(d.unite) === AMP.normUnite(r.unite); });
  }
  Q.etapesActives = function (ex) {
    return (ex.etapes || []).filter(function (e) { return !e['à_vérifier']; });
  };
  Q.modifiable = function (ex) {
    return Q.etapesActives(ex).every(function (e) {
      return !e.reponse || typeof e.reponse.valeur !== 'number' || e.calcul || donneePour(ex, e);
    }) && (ex.donnees || []).length > 0;
  };
  // Valeurs d'un exemple : celles du cours, ou modifiées de −25 % à +30 % (sauf fréquences et pulsations).
  Q.valeursExemple = function (ex, modifier, rnd) {
    const vals = {};
    (ex.donnees || []).forEach(function (d) {
      let v = d.valeur;
      if (modifier && ['Hz', 'rad/s'].indexOf(AMP.normUnite(d.unite)) < 0) v = AMP.arrondir(v * AMP.entre(0.75, 1.3, rnd), 3);
      vals[d.code] = v;
    });
    return vals;
  };
  // Question d'une étape. vals : valeurs des données de cet exemple.
  Q.etape = function (ex, etape, vals, ch) {
    const ids = (etape.formules || []).filter(function (id) { return D().items[id]; });
    const r = etape.reponse || {};
    const base = {
      type: 'etape', ids: ids, etoiles: 3, titre: etape.question,
      enonceHtml: '<p class="q-grand">' + AMP.esc(etape.question) + '</p>'
    };
    let valeur = null;
    if (typeof r.valeur === 'number') {
      if (etape.calcul) { try { valeur = AMP.evaluer(etape.calcul, vals); } catch (e) { valeur = null; } }
      else { const d = donneePour(ex, etape); valeur = d ? vals[d.code] : r.valeur; }
    }
    const formules = ids.map(function (id) { return D().items[id]; }).filter(function (it) { return it.type === 'formule'; });
    const rappel = formules.map(function (it) { return '<div class="formule-bloc">' + AMP.tex(it.el.latex, true) + '</div>'; }).join('');
    if (valeur != null && isFinite(valeur)) {
      const u = AMP.normUnite(r.unite);
      return Object.assign(base, {
        mode: 'saisie', attendu: { valeur: valeur, unite: u, tolerance: etape.tolerance || Q.TOLERANCE },
        unites: unitesProposees(u, ch, AMP.alea), prefixes: !AMP.SANS_PREFIXE[u],
        correctionHtml: '<p>Résultat attendu : <strong>' + AMP.esc(AMP.valeur(valeur, u, 3)) + '</strong></p>' +
          (r.texte ? '<p class="q-petit">Dans le cours (valeurs d\'origine) : ' + AMP.texte(r.texte) + '</p>' : '') + rappel +
          (etape.note ? '<p class="q-petit">' + AMP.texte(etape.note) + '</p>' : ''),
        aides: { memo: rappel || null, unite: u }
      });
    }
    return Object.assign(base, {
      mode: 'auto',
      correctionHtml: '<p>' + AMP.texte(r.texte || '') + '</p>' + rappel + (etape.note ? '<p class="q-petit">' + AMP.texte(etape.note) + '</p>' : '')
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
