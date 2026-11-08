// Ampéria — combats au tour par tour : Parasites, zones corrompues et Gardiens (boss en plusieurs étapes).
(function () {
  'use strict';
  const AMP = window.AMP;
  const C = AMP.combat = { actif: false };
  const SP = AMP.sprites, Q = AMP.questions, P = AMP.prog;
  const panneau = document.querySelector('#panneau');
  let st = null;   // état du combat en cours

  // ---------- Lancement ----------
  // opts : { type: 'rencontre' | 'corruption' | 'boss', region, espece, focus: [ids] } ; fin(resultat)
  C.lancer = function (opts, fin) {
    const r = opts.region, e = AMP.etat;
    st = { opts: opts, fin: fin, region: r, type: opts.type, erreurs: 0, focus: (opts.focus || []).slice(), effets: [], secousse: 0, coup: 0,
      differentiel: false, dernier: null, q: null, phase: 'question', temps: 0, xp: 0 };
    if (opts.type === 'boss') {
      const premiere = !(e.regions[r.ch.id] && e.regions[r.ch.id].boss);
      st.etapes = [];
      (r.boss.exemples || []).forEach(function (id) {
        const x = AMP.exemple(id);
        const modif = !premiere && Q.modifiable(x.ex);
        const vals = Q.valeursExemple(x.ex, modif);
        Q.etapesActives(x.ex).forEach(function (et) { st.etapes.push({ ex: x.ex, ch: x.ch, etape: et, vals: vals, modif: modif }); });
      });
      for (let i = 0; i < (r.boss.serie || 0); i++) st.etapes.push({ serie: true });
      st.indexEtape = 0; st.aRejouer = []; st.resultats = {}; st.trouves = {};
      st.ennemi = { nom: r.boss.nom, boss: true, pv: st.etapes.length, pvMax: st.etapes.length, sprite: SP.gardien() };
    } else {
      const def = SP.PARASITES[opts.espece] || SP.PARASITES['court-jus'];
      // Équilibrage : 2 à 3 bonnes réponses pour un Parasite, un peu plus dans les régions avancées.
      const pv = 10 + r.index + (opts.type === 'corruption' ? 2 : 0);
      st.ennemi = { nom: def.nom + (opts.type === 'corruption' ? ' (zone corrompue)' : ''), espece: opts.espece, pv: pv, pvMax: pv, faiblesse: def.faiblesse, sprite: SP.parasite(opts.espece) };
    }
    e.stats.combats++;
    AMP.audio.musique(opts.type === 'boss' ? 'boss' : 'combat');
    C.actif = true;
    AMP.scene = 'combat';
    document.body.classList.add('mode-combat');
    AMP.jeu.redimensionner();
    questionSuivante();
  };

  // ---------- Questions ----------
  function questionSuivante() {
    let q = null;
    st.aide = false;
    if (st.ennemi.boss) {
      if (st.indexEtape >= st.etapes.length && st.aRejouer.length) {
        st.etapes = st.aRejouer; st.aRejouer = []; st.indexEtape = 0;
        AMP.ui.toast('Le Gardien se relève : reprends les étapes ratées !', 'alerte');
      }
      const et = st.etapes[st.indexEtape];
      if (!et) { victoire(); return; }
      st.etapeCourante = et;
      if (et.serie) q = questionLibre();
      else {
        q = Q.etape(et.ex, et.etape, et.vals, et.ch);
        q.contexte = contexteBoss(et);
      }
    } else {
      q = questionLibre();
    }
    if (!q) { victoire(); return; }
    st.q = q;
    st.phase = 'question';
    st.chrono = AMP.etat.options.chrono ? (q.mode === 'saisie' ? 60 : 30) : null;
    st.debut = st.temps;
    afficherQuestion();
  }

  function questionLibre() {
    const ids = AMP.monde.interrogeables(st.region.ch.id);
    const pool = ids.length ? ids : (AMP.donnees.parChapitre[st.region.ch.id] || []).filter(function (it) { return Q.typesPossibles(it).length; }).map(function (it) { return it.id; });
    for (let essai = 0; essai < 6; essai++) {
      const id = st.focus.shift() || AMP.srs.tirer(pool, null, pool.length > 1 ? [st.dernier] : null);
      if (!id) return null;
      const q = Q.generer(AMP.donnees.items[id]);
      if (q) { st.dernier = id; return q; }
    }
    return null;
  }

  function contexteBoss(et) {
    let h = '<details class="c-enonce" open><summary>' + AMP.esc(et.ex.titre) + '</summary><p>' + AMP.texte(et.ex.enonce) + '</p>';
    // Une donnée qui est la réponse d'une étape pas encore jouée (ex. période lue sur l'oscillogramme) reste cachée.
    const trouves = st.trouves[et.ex.id] || {};
    const cachees = {};
    Q.etapesActives(et.ex).forEach(function (e) {
      if (e.calcul || !e.reponse || typeof e.reponse.valeur !== 'number') return;
      const d = Q.donneePour(et.ex, e);
      if (d && !trouves[e.question]) cachees[d.code] = true;
    });
    const visibles = (et.ex.donnees || []).filter(function (d) { return !cachees[d.code]; });
    if (visibles.length) {
      h += (et.modif ? '<p class="alerte">⚡ Nouvelles valeurs pour ce duel : utilise le tableau ci-dessous (l\'énoncé garde celles du cours).</p>' : '') +
        '<ul class="donnees">' + visibles.map(function (d) {
          return '<li>' + AMP.tex(d.symbole) + ' = ' + AMP.esc(AMP.valeur(et.vals[d.code], d.unite, 4)) + '</li>';
        }).join('') + '</ul>';
    }
    if (Object.keys(cachees).length) h += '<p class="q-petit">Certaines valeurs se lisent sur le document du polycopié :</p>';
    h += AMP.questions.sourceHtml(et.ex);
    const res = st.resultats[et.ex.id] || [];
    if (res.length) h += '<p class="q-petit">Déjà trouvé :</p><ul class="resultats">' + res.map(function (r) { return '<li>' + AMP.texte(r) + '</li>'; }).join('') + '</ul>';
    return h + '</details>';
  }

  function tete() {
    const e = AMP.etat, en = st.ennemi, max = P.chargeMax(), emax = P.energieMax();
    const etape = en.boss ? '<span class="q-petit">Étape ' + Math.min(st.indexEtape + 1, st.etapes.length) + '/' + st.etapes.length + '</span>' : '';
    return '<div class="c-tete"><div class="c-ennemi"><strong>' + AMP.esc(en.nom) + '</strong> ' + etape +
      '<div class="jauge pv"><i style="width:' + Math.max(0, Math.round(100 * en.pv / en.pvMax)) + '%"></i></div></div>' +
      '<div class="c-joueur"><div class="jauge charge"><i style="width:' + Math.round(100 * e.charge / max) + '%"></i><b>⚡ ' + e.charge + '/' + max + '</b></div>' +
      '<span class="energie">' + '◆'.repeat(Math.min(e.energie, emax)) + '<s>' + '◆'.repeat(Math.max(0, emax - e.energie)) + '</s></span></div>' +
      (st.chrono ? '<div class="jauge chrono"><i></i></div>' : '') + '</div>';
  }

  function afficherQuestion() {
    const q = st.q, T = Q.TYPES[q.type];
    const etiquette = q.type === 'etape' ? '👑 Étape du Gardien ★★★' : T.icone + ' ' + T.nom + ' ' + '★'.repeat(T.etoiles) +
      (st.ennemi.faiblesse === q.type ? ' <span class="faible">point faible ×1,5</span>' : '');
    let rep = '';
    if (q.mode === 'choix') {
      rep = '<div class="choix-liste' + (q.vraiFaux ? ' vf' : '') + '">' + q.choix.map(function (c, i) {
        return '<button class="choix" data-i="' + i + '"><span class="k">' + (i + 1) + '</span><span>' + c.html + '</span></button>';
      }).join('') + '</div>';
    } else if (q.mode === 'saisie') {
      st.prefixe = ''; st.unite = null;
      const tactile = document.body.classList.contains('tactile');
      rep = '<div class="saisie"><input class="c-valeur" ' + (tactile ? 'readonly inputmode="none"' : 'inputmode="decimal"') + ' autocomplete="off" aria-label="Valeur" placeholder="valeur">' +
        '<span class="c-pref"></span><span class="c-unite">?</span></div>' +
        (q.prefixes ? '<div class="prefixes" aria-label="Préfixe">' + ['p', 'n', 'µ', 'm', '', 'k', 'M', 'G'].map(function (p) {
          return '<button data-pref="' + p + '"' + (p === '' ? ' class="actif"' : '') + '>' + (p || '—') + '</button>';
        }).join('') + '</div>' : '') +
        '<div class="unites" aria-label="Unité">' + q.unites.map(function (u) { return '<button data-unite="' + AMP.esc(u) + '">' + AMP.esc(AMP.nomUnite(u)) + '</button>'; }).join('') + '</div>' +
        '<div class="pave">' + ['7', '8', '9', '⌫', '4', '5', '6', '×10ⁿ', '1', '2', '3', '−', '0', ',', 'C'].map(function (t) {
          return '<button data-pave="' + t + '">' + t + '</button>';
        }).join('') + '</div><button class="valider">Valider ⏎</button>' +
        (P.a('calculatrice') ? '<details class="calc"><summary>🧮 Calculatrice</summary><input class="calc-expr" placeholder="ex. 230/sqrt(12^2+345^2)"><div class="calc-res"></div><p class="q-petit">+ − * / ^ ( ) sqrt pi ; cos sin tan atan en degrés</p></details>' : '');
    } else {
      rep = '<button class="valider" data-voir>Voir la réponse</button><p class="q-petit">Réfléchis (au brouillon), puis compare honnêtement avec la réponse.</p>';
    }
    const outils = P.competences().map(function (k) {
      const c = P.COMPETENCES[k];
      return '<button data-comp="' + k + '" title="' + AMP.esc(c.effet) + '"' + (competenceUtilisable(k) ? '' : ' disabled') + '>' + AMP.esc(c.nom) + ' <small>' + c.cout + '◆</small></button>';
    }).join('') + '<button data-outil="codex">📖 Grimoire</button>' + (st.ennemi.boss ? '' : '<button data-outil="fuir">🏃 Fuir</button>');
    panneau.innerHTML = tete() + '<div class="c-type">' + etiquette + '</div>' + (q.contexte || '') +
      '<div class="c-question">' + (q.type === 'etape' ? '' : '<h3>' + AMP.esc(q.titre) + '</h3>') + q.enonceHtml + '</div>' +
      '<div class="c-aide">' + tutoriel(q) + '</div><div class="c-reponse">' + rep + '</div><div class="c-outils">' + outils + '</div>';
    panneau.scrollTop = 0;
    const champ = panneau.querySelector('.c-valeur');
    if (champ && !document.body.classList.contains('tactile')) champ.focus();
    else { const b = panneau.querySelector('.choix, .valider'); if (b && !document.body.classList.contains('tactile')) b.focus({ preventScroll: true }); }
  }

  // Explication affichée la première fois qu'on rencontre chaque type d'attaque.
  const TUTOS = {
    premier: 'Réponds juste pour attaquer. Une erreur ? Le Parasite riposte (tu perds de la ⚡ Charge), puis la correction s’affiche. Rien n’est perdu : la question reviendra plus tard.',
    eclair: 'Éclair : choisis la bonne définition ou la bonne notion (touches 1 à 4 au clavier).',
    soudure: 'Soudure : la case encadrée cache un symbole. Choisis celui qui complète la formule.',
    arc: 'Arc calculé : écris la valeur (virgule acceptée), choisis le préfixe (m, k…) et l’unité, puis Valider. Tolérance : 2 %. Bonne valeur avec la mauvaise unité = demi-réussite.',
    diagnostic: 'Diagnostic : retrouve l’unité d’une grandeur, ou la relation qui correspond à une situation.',
    contre: 'Contre-piège : cette affirmation est-elle vraie ou fausse ? Méfie-toi, les pièges du cours sont là.',
    etape: 'Étape du Gardien : c’est l’exercice du TD, étape par étape. Les résultats trouvés s’affichent sous l’énoncé pour la suite.',
    competences: 'Les compétences en bas coûtent de l’Énergie ◆ (rechargée à chaque bonne réponse). Le Grimoire est consultable à tout moment.'
  };
  function tutoriel(q) {
    const t = AMP.etat.tutos || (AMP.etat.tutos = {});
    const l = [];
    ['premier', q.type, 'competences'].forEach(function (k) { if (!t[k] && TUTOS[k]) { t[k] = true; l.push(TUTOS[k]); } });
    return l.map(function (x) { return '<div class="memo tuto">💡 ' + AMP.esc(x) + '</div>'; }).join('');
  }

  function competenceUtilisable(k) {
    const c = P.COMPETENCES[k], q = st.q, e = AMP.etat;
    if (e.energie < c.cout || st.phase !== 'question') return false;
    if (k === 'sonde') return q.mode === 'choix' && q.choix.length >= 3 && !st.sondee;
    if (k === 'memo') return !!(q.aides && q.aides.memo);
    if (k === 'pince') return q.mode === 'saisie';
    if (k === 'releve') return e.charge < P.chargeMax();
    if (k === 'differentiel') return !st.differentiel;
    return true;
  }

  function utiliser(k) {
    if (!competenceUtilisable(k)) return;
    const c = P.COMPETENCES[k], q = st.q, aide = panneau.querySelector('.c-aide');
    AMP.etat.energie -= c.cout;
    AMP.audio.jouer('choix');
    if (k === 'sonde') {
      st.sondee = true; st.aide = true;
      const faux = AMP.melanger(q.choix.map(function (x, i) { return i; }).filter(function (i) { return !q.choix[i].juste; })).slice(0, 2);
      faux.forEach(function (i) { const b = panneau.querySelector('.choix[data-i="' + i + '"]'); if (b) { b.disabled = true; b.classList.add('eteint'); } });
    } else if (k === 'memo') { st.aide = true; aide.innerHTML += '<div class="memo">' + q.aides.memo + '</div>'; }
    else if (k === 'pince') { st.aide = true; aide.innerHTML += '<div class="memo">Unité attendue : <strong>' + AMP.esc(AMP.nomUnite(q.aides ? q.aides.unite : q.attendu.unite)) + '</strong></div>'; }
    else if (k === 'releve') { AMP.etat.charge = Math.min(P.chargeMax(), AMP.etat.charge + Math.ceil(P.chargeMax() * 0.3)); }
    else if (k === 'differentiel') { st.differentiel = true; aide.innerHTML += '<div class="memo">🛡 La prochaine riposte sera annulée.</div>'; }
    majTete();
  }

  function majTete() {
    const t = panneau.querySelector('.c-tete');
    if (t) t.outerHTML = tete();
    panneau.querySelectorAll('[data-comp]').forEach(function (b) { b.disabled = !competenceUtilisable(b.dataset.comp); });
    AMP.ui.majHud();
  }

  // ---------- Saisie ----------
  function majSaisie() {
    const p = panneau.querySelector('.c-pref'), u = panneau.querySelector('.c-unite');
    if (p) p.textContent = st.prefixe || '';
    if (u) u.textContent = st.unite == null ? '?' : (st.unite === '' ? '(sans unité)' : st.unite);
    panneau.querySelectorAll('[data-pref]').forEach(function (b) { b.classList.toggle('actif', b.dataset.pref === st.prefixe); });
    panneau.querySelectorAll('[data-unite]').forEach(function (b) { b.classList.toggle('actif', b.dataset.unite === st.unite); });
  }
  function pave(t) {
    const champ = panneau.querySelector('.c-valeur');
    if (!champ) return;
    let v = champ.value;
    if (t === '⌫') v = v.replace(/×10\^$/, '').slice(0, v.endsWith('×10^') ? undefined : -1);
    else if (t === 'C') v = '';
    else if (t === '×10ⁿ') { if (v && v.indexOf('×10^') < 0) v += '×10^'; }
    else if (t === '−') v = /×10\^$/.test(v) ? v + '−' : (v[0] === '−' ? v.slice(1) : '−' + v);
    else if (t === ',') { if (v.split('×10^')[0].indexOf(',') < 0 && v.indexOf('×10^') < 0) v += (v === '' || v === '−' ? '0,' : ','); }
    else v += t;
    champ.value = v;
    AMP.audio.jouer('blip');
  }
  function valider() {
    const q = st.q;
    if (q.mode !== 'saisie' || st.phase !== 'question') return;
    const champ = panneau.querySelector('.c-valeur');
    const n = AMP.lireNombre(champ.value);
    const aide = panneau.querySelector('.c-aide');
    if (isNaN(n)) { aide.innerHTML = '<div class="memo alerte">Écris une valeur numérique (ex. 4,7 ou 1,5×10^-3).</div>'; return; }
    if (st.unite == null) { aide.innerHTML = '<div class="memo alerte">Choisis l\'unité de ton résultat.</div>'; return; }
    const pre = AMP.PREFIXES.find(function (x) { return x.p === st.prefixe; });
    repondre({ valeur: n * (pre ? pre.f : 1), unite: st.unite }, AMP.nombre(n, 6).replace(/ × 10\^/, '×10^') + ' ' + (st.prefixe || '') + AMP.nomUnite(st.unite));
  }

  // Calculatrice de chantier (équipement) : expression sûre, trigonométrie en degrés.
  function calculer(expr) {
    let s = String(expr).replace(/,/g, '.').replace(/π/g, 'pi').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**');
    if (!/^[\d+\-*/().\s eapinqrtcostasq]*$/i.test(s)) return 'expression non reconnue';
    s = s.replace(/\b(sqrt|cos|sin|tan|atan|pi)\b/g, function (m) { return '_' + m; });
    if (/[a-df-z]/i.test(s.replace(/_(sqrt|cos|sin|tan|atan|pi)/g, '').replace(/\de[-+]?\d/gi, ''))) return 'expression non reconnue';
    try {
      const r = AMP.evaluer(s, {
        _sqrt: Math.sqrt, _pi: Math.PI,
        _cos: function (d) { return Math.cos(d * Math.PI / 180); }, _sin: function (d) { return Math.sin(d * Math.PI / 180); },
        _tan: function (d) { return Math.tan(d * Math.PI / 180); }, _atan: function (x) { return Math.atan(x) * 180 / Math.PI; }
      });
      return isFinite(r) ? '= ' + AMP.nombre(r, 6) : 'résultat impossible';
    } catch (e) { return 'expression incomplète'; }
  }

  // ---------- Réponse ----------
  function repondre(rep, texteReponse) {
    if (st.phase !== 'question') return;
    const q = st.q, e = AMP.etat, r = st.region;
    let res = Q.verifier(q, rep);
    if (st.chrono && st.temps - st.debut > st.chrono) res = 'faux';
    st.phase = 'retour';
    q.ids.forEach(function (id) {
      if (AMP.donnees.items[id]) AMP.srs.repondre(id, res, { bonus: (q.type === 'arc' || q.type === 'etape') && res === 'juste', aide: st.aide });
    });
    P.noterReponse(q.type, res);

    let verdict;
    const niveaux = [];
    if (res !== 'faux') {
      let dmg;
      if (st.ennemi.boss) { dmg = 1; if (res === 'demi') st.erreurs++; }
      else {
        dmg = { 1: 4, 2: 5, 3: 7 }[q.etoiles] || 4;
        if (st.ennemi.faiblesse === q.type) dmg *= 1.5;
        if (P.a('oscilloscope') && (q.type === 'soudure' || q.type === 'diagnostic')) dmg *= 1.3;
        if (P.a('cle') && q.type === 'arc') dmg *= 1.2;
        if (st.chrono) dmg *= 2;
        if (res === 'demi') dmg *= 0.5;
        dmg = Math.round(dmg);
      }
      st.ennemi.pv = Math.max(0, st.ennemi.pv - dmg);
      e.energie = Math.min(P.energieMax(), e.energie + 1);
      const xp = Math.round((P.XP[q.type] || 10) * (res === 'demi' ? 0.5 : 1));
      st.xp += xp;
      niveaux.push.apply(niveaux, P.gagnerXp(xp));
      st.effets.push({ type: 'eclair', t: 0, duree: 0.45 });
      for (let k = 0; k < 14; k++) st.effets.push({ type: 'etincelle', t: 0, duree: 0.5 + Math.random() * 0.4, vx: (Math.random() - 0.5) * 140, vy: -Math.random() * 120, c: AMP.choisir(['#ffc65c', '#ffffff', '#3fd2d6']) });
      st.effets.push({ type: 'nombre', t: 0, duree: 1, texte: st.ennemi.boss ? '−1 étape' : '−' + dmg, cote: 'ennemi' });
      st.coup = 0.4;
      AMP.audio.jouer(res === 'juste' ? 'juste' : 'demi');
      AMP.audio.jouer('eclair');
      verdict = res === 'juste' ? '<div class="verdict juste">✔ Juste ! <small>+' + xp + ' XP</small></div>'
        : '<div class="verdict demi">◐ Bonne valeur, mais mauvaise unité ! <small>Dégâts réduits.</small></div>';
      if (st.ennemi.boss && q.mode === 'saisie') noterResultat(q, rep);
    } else {
      let dmg = (st.ennemi.boss ? 6 : 4) + r.index;
      if (P.a('casque')) dmg = Math.round(dmg * 0.75);
      if (st.differentiel) { dmg = 0; st.differentiel = false; }
      e.charge = Math.max(0, e.charge - dmg);
      st.secousse = 0.45;
      st.effets.push({ type: 'riposte', t: 0, duree: 0.5 });
      st.effets.push({ type: 'nombre', t: 0, duree: 1, texte: dmg ? '−' + dmg + ' ⚡' : 'Bloqué !', cote: 'joueur' });
      AMP.audio.jouer('faux'); AMP.audio.jouer('coup');
      if (st.ennemi.boss) { st.erreurs++; st.aRejouer.push(st.etapeCourante); }
      verdict = '<div class="verdict faux">✘ ' + (st.chrono && st.temps - st.debut > st.chrono ? 'Temps écoulé !' : 'Raté…') +
        (texteReponse ? ' <small>Ta réponse : ' + AMP.esc(texteReponse) + '</small>' : '') + '</div>';
      if (st.ennemi.boss && st.etapeCourante.ex && q.mode === 'saisie') noterResultat(q, { valeur: q.attendu.valeur });
    }
    niveaux.forEach(function (n) { AMP.ui.toast('⬆ Niveau ' + n + ' ! Charge et Énergie au maximum.', 'or'); AMP.audio.jouer('niveau'); });

    // Bonne réponse en vert, mauvaise en rouge (QCM).
    if (q.mode === 'choix') {
      panneau.querySelectorAll('.choix').forEach(function (b) {
        const i = Number(b.dataset.i);
        b.disabled = true;
        if (q.choix[i].juste) b.classList.add('bonne');
        else if (i === rep) b.classList.add('mauvaise');
      });
    }
    const corr = res === 'juste' && q.type !== 'etape' ? '<details class="correction"><summary>Voir la fiche</summary>' + q.correctionHtml + '</details>' : '<div class="correction">' + q.correctionHtml + '</div>';
    // QCM : les propositions restent visibles (bonne en vert), le verdict s'affiche dessous.
    let zone = panneau.querySelector('.c-reponse');
    if (q.mode === 'choix') { zone.insertAdjacentHTML('beforeend', '<div class="c-retour"></div>'); zone = zone.querySelector('.c-retour'); }
    zone.innerHTML = verdict + corr + '<button class="valider continuer">Continuer ⏎</button>';
    panneau.querySelectorAll('[data-comp]').forEach(function (b) { b.disabled = true; });
    majTete();
    const cont = panneau.querySelector('.continuer');
    cont.focus({ preventScroll: true });
    zone.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    AMP.sauvegarde.sauver();
  }

  function noterResultat(q, rep) {
    const et = st.etapeCourante;
    if (!et || !et.ex) return;
    (st.trouves[et.ex.id] = st.trouves[et.ex.id] || {})[et.etape.question] = true;
    (st.resultats[et.ex.id] = st.resultats[et.ex.id] || []).push(et.etape.question + ' → ' + AMP.valeur(q.attendu.valeur, q.attendu.unite, 3));
    void rep;
  }

  function continuer() {
    if (st.phase === 'fin') { terminer(st.resultatFinal); return; }
    if (st.phase !== 'retour') return;
    if (AMP.etat.charge <= 0) { defaite(); return; }
    if (st.ennemi.boss) st.indexEtape++;
    if (st.ennemi.pv <= 0) { victoire(); return; }
    questionSuivante();
  }

  // ---------- Fin du combat ----------
  function victoire() {
    const e = AMP.etat, r = st.region;
    let h = '';
    if (st.ennemi.boss) {
      const avant = e.regions[r.ch.id] || {};
      const rang = P.rang(st.erreurs);
      const meilleur = avant.boss && P.RANGS[avant.boss] > P.RANGS[rang] ? avant.boss : rang;
      const premiere = !avant.restauree;
      e.regions[r.ch.id] = { boss: meilleur, restauree: true };
      let xp = P.XP.boss;
      if (premiere && r.equipement && P.EQUIPEMENTS[r.equipement] && !P.a(r.equipement)) e.equipement.push(r.equipement);
      const niveaux = P.gagnerXp(xp);
      niveaux.forEach(function (n) { AMP.ui.toast('⬆ Niveau ' + n + ' !', 'or'); });
      AMP.audio.jouer('victoire');
      const eq = premiere && r.equipement ? P.EQUIPEMENTS[r.equipement] : null;
      h = '<div class="fin-combat victoire"><h2>⚡ ' + AMP.esc(AMP.donnees.dialogues.victoire_boss.replace('{region}', r.nom)) + '</h2>' +
        '<p>Rang : <span class="rang ' + rang + '">' + rang + '</span>' + (meilleur !== rang ? ' (meilleur : ' + meilleur + ')' : '') + ' · ' + st.erreurs + ' erreur(s) · +' + (xp + st.xp) + ' XP</p>' +
        (eq ? '<p class="recompense">' + eq.icone + ' Nouvel équipement : <strong>' + AMP.esc(eq.nom) + '</strong><br><small>' + AMP.esc(eq.effet) + '</small></p>' : '') +
        (premiere && AMP.donnees.regions[r.index + 1] ? '<p>Le portail de <strong>' + AMP.esc(AMP.donnees.regions[r.index + 1].nom) + '</strong> s\'est ouvert au Poste Source.</p>' : '') +
        '<button class="valider continuer">Continuer ⏎</button></div>';
      st.resultatFinal = { victoire: true, boss: true };
    } else {
      P.gagnerXp(P.XP.victoire).forEach(function (n) { AMP.ui.toast('⬆ Niveau ' + n + ' !', 'or'); AMP.audio.jouer('niveau'); });
      AMP.audio.jouer('victoire');
      h = '<div class="fin-combat victoire"><h2>' + (st.type === 'corruption' ? '✨ Zone purifiée !' : '⚡ Parasite neutralisé !') + '</h2><p>+' + (st.xp + P.XP.victoire) + ' XP</p>' +
        '<button class="valider continuer">Continuer ⏎</button></div>';
      st.resultatFinal = { victoire: true };
    }
    st.ennemi.pv = 0;
    st.effets.push({ type: 'disparition', t: 0, duree: 1 });
    st.phase = 'fin';
    panneau.innerHTML = tete() + h;
    panneau.querySelector('.continuer').focus();
    AMP.sauvegarde.sauver(true);
  }

  function defaite() {
    st.phase = 'fin';
    st.resultatFinal = { defaite: true };
    panneau.innerHTML = tete() + '<div class="fin-combat defaite"><h2>Charge à zéro…</h2><p>Ce que tu as appris reste dans ton grimoire, et les questions ratées reviendront bientôt.</p><button class="valider continuer">Retour au Poste Source ⏎</button></div>';
    panneau.querySelector('.continuer').focus();
  }

  function terminer(res) {
    C.actif = false;
    AMP.scene = 'monde';
    document.body.classList.remove('mode-combat');
    panneau.innerHTML = '';
    AMP.jeu.redimensionner();
    const fin = st.fin;
    st = null;
    AMP.audio.musique(AMP.audio.lieuCourant);
    AMP.entree.vider();
    AMP.jeu.flash(0.25, function () { fin(res || {}); });
  }

  // ---------- Événements du panneau ----------
  panneau.addEventListener('click', function (ev) {
    if (!st) return;
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.classList.contains('continuer')) { continuer(); return; }
    if (b.dataset.i != null && st.phase === 'question') { repondre(Number(b.dataset.i)); return; }
    if (b.dataset.pref != null) { st.prefixe = b.dataset.pref; majSaisie(); return; }
    if (b.dataset.unite != null) { st.unite = b.dataset.unite; majSaisie(); AMP.audio.jouer('blip'); return; }
    if (b.dataset.pave) { pave(b.dataset.pave); return; }
    if (b.dataset.comp) { utiliser(b.dataset.comp); return; }
    if (b.dataset.outil === 'codex') { AMP.codex.ouvrir(); return; }
    if (b.dataset.outil === 'fuir') { AMP.ui.toast('Tu prends la fuite…'); terminer({ fuite: true }); return; }
    if (b.hasAttribute('data-voir')) { voirReponse(); return; }
    if (b.dataset.auto) { repondre(b.dataset.auto === 'oui'); return; }
    if (b.classList.contains('valider')) valider();
  });
  panneau.addEventListener('keydown', function (ev) {
    if (!st) return;
    if (ev.target.classList.contains('c-valeur') && ev.key === 'Enter') { ev.preventDefault(); valider(); }
    if (ev.target.classList.contains('calc-expr') && ev.key === 'Enter') { ev.preventDefault(); }
  });
  panneau.addEventListener('input', function (ev) {
    if (ev.target.classList.contains('calc-expr')) panneau.querySelector('.calc-res').textContent = ev.target.value ? calculer(ev.target.value) : '';
  });

  // Étape sans valeur numérique : on révèle la réponse, puis on s'auto-évalue.
  function voirReponse() {
    const z = panneau.querySelector('.c-reponse');
    z.innerHTML = '<div class="correction">' + st.q.correctionHtml + '</div><p>Avais-tu trouvé ?</p><div class="choix-liste vf"><button class="choix" data-auto="oui">✔ J\'avais juste</button><button class="choix" data-auto="non">✘ Je m\'étais trompé·e</button></div>';
    st.q.correctionHtml = '';
  }

  // Lecture de l'état (tests automatiques uniquement).
  C.debug = function () { return st; };

  C.retourCodex = function () { /* le panneau de combat reste en place sous la fenêtre */ };

  C.clavier = function (ev, k) {
    if (!st) return false;
    if ((k === 'Enter' || k === ' ') && panneau.querySelector('.continuer')) { if (!ev.repeat) continuer(); return true; }
    if (st.phase === 'question' && st.q.mode === 'choix' && /^[1-9]$/.test(k)) {
      const i = Number(k) - 1;
      const b = panneau.querySelector('.choix[data-i="' + i + '"]');
      if (b && !b.disabled) repondre(i);
      return true;
    }
    if (k === 'c') { AMP.codex.ouvrir(); return true; }
    return false;
  };

  // ---------- Dessin de la scène de combat ----------
  C.update = function (dt) {
    if (!st) return;
    st.temps += dt;
    st.secousse = Math.max(0, st.secousse - dt);
    st.coup = Math.max(0, st.coup - dt);
    st.effets.forEach(function (f) { f.t += dt; });
    st.effets = st.effets.filter(function (f) { return f.t < f.duree; });
    if (st.chrono && st.phase === 'question') {
      const reste = Math.max(0, 1 - (st.temps - st.debut) / st.chrono);
      const b = panneau.querySelector('.chrono i');
      if (b) b.style.width = Math.round(reste * 100) + '%';
      if (reste <= 0) {
        if (st.q.mode === 'choix') repondre(-1);
        else if (st.q.mode === 'saisie') repondre({ valeur: NaN, unite: '' });
        else repondre(false);
      }
    }
    AMP.entree.prendre().forEach(function (a) { if (a === 'A' && panneau.querySelector('.continuer')) continuer(); });
  };

  C.dessiner = function (ctx, W, H) {
    if (!st) return;
    const r = st.region, anim = AMP.etat.options.animations;
    const coul = { tension: ['#2a1a10', '#5a2e16'], courant: ['#0b2530', '#0e4b5a'], puissance: ['#1d1030', '#3a1f5c'] }[r.couleur] || ['#141a2e', '#2d3e63'];
    ctx.save();
    if (st.secousse > 0 && anim) ctx.translate((Math.random() - 0.5) * 8 * st.secousse * 2, (Math.random() - 0.5) * 6 * st.secousse * 2);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0e1a'); g.addColorStop(0.55, coul[0]); g.addColorStop(1, coul[1]);
    ctx.fillStyle = g; ctx.fillRect(-10, -10, W + 20, H + 20);
    // Lignes de réseau au loin.
    ctx.strokeStyle = 'rgba(155,166,189,.18)'; ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(0, 40 + k * 8); ctx.quadraticCurveTo(W / 2, 55 + k * 8, W, 38 + k * 8); ctx.stroke(); }
    // Socles.
    ctx.fillStyle = 'rgba(11,14,26,.55)';
    ctx.beginPath(); ctx.ellipse(W * 0.72, H * 0.62, 52, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W * 0.25, H * 0.9, 46, 10, 0, 0, Math.PI * 2); ctx.fill();

    // Ennemi.
    const en = st.ennemi, ech = en.boss ? 3 : 3;
    const sw = en.sprite.width * ech, sh = en.sprite.height * ech;
    let ex = W * 0.72 - sw / 2, ey = H * 0.62 - sh + 4 + (anim ? Math.round(Math.sin(st.temps * 3) * 2) : 0);
    const rip = st.effets.find(function (f) { return f.type === 'riposte'; });
    if (rip) ex -= Math.sin(rip.t / rip.duree * Math.PI) * 40;
    const disp = st.effets.find(function (f) { return f.type === 'disparition'; });
    const visible = !(st.coup > 0 && anim && Math.floor(st.temps * 20) % 2) && st.ennemi.pv > 0 || (disp && disp.t < 0.6 && Math.floor(disp.t * 20) % 2);
    if (visible || (st.phase !== 'fin' && st.ennemi.pv <= 0)) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(en.sprite, Math.round(ex), Math.round(ey), sw, sh);
    }
    // Joueur (vu de dos).
    const hero = SP.perso('haut', 0, 0);
    ctx.drawImage(hero, Math.round(W * 0.25 - 24), Math.round(H * 0.9 - 46), 48, 48);

    // Éclair du joueur vers l'ennemi.
    st.effets.forEach(function (f) {
      if (f.type === 'eclair' && f.t < 0.3) {
        const x0 = W * 0.25 + 10, y0 = H * 0.9 - 40, x1 = W * 0.72, y1 = H * 0.62 - sh / 2;
        for (let k = 0; k < (anim ? 3 : 1); k++) AMP.monde.arc(ctx, x0, y0, x1, y1, k ? '#ffc65c' : '#ffffff', k ? 1 : 2);
        if (anim) { ctx.fillStyle = 'rgba(255,255,255,' + (0.25 * (1 - f.t / 0.3)) + ')'; ctx.fillRect(0, 0, W, H); }
      }
      if (f.type === 'etincelle' && anim) {
        ctx.fillStyle = f.c;
        ctx.fillRect(Math.round(W * 0.72 + f.vx * f.t), Math.round(H * 0.62 - sh / 2 + f.vy * f.t + 160 * f.t * f.t), 2, 2);
      }
      if (f.type === 'riposte' && anim) { ctx.fillStyle = 'rgba(184,38,59,' + (0.3 * (1 - f.t / f.duree)) + ')'; ctx.fillRect(-10, -10, W + 20, H + 20); }
      if (f.type === 'nombre') {
        const x = f.cote === 'ennemi' ? W * 0.72 : W * 0.25, y = (f.cote === 'ennemi' ? H * 0.62 - sh : H * 0.9 - 50) - f.t * 18;
        ctx.globalAlpha = 1 - f.t / f.duree;
        ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = '#0b0e1a'; ctx.fillText(f.texte, x + 1, y + 1);
        ctx.fillStyle = f.cote === 'ennemi' ? '#ffc65c' : '#ff6b6b'; ctx.fillText(f.texte, x, y);
        ctx.globalAlpha = 1;
      }
    });
    // Nom de l'ennemi.
    ctx.font = '8px monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(11,14,26,.7)'; ctx.fillRect(4, 4, ctx.measureText(en.nom).width + 8, 12);
    ctx.fillStyle = '#f3e6c8'; ctx.fillText(en.nom, 8, 13);
    ctx.restore();
  };
})();
