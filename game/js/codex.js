// Ampéria — le Grimoire : formules, notions et pièges découverts, avec leur scan source.
(function () {
  'use strict';
  const AMP = window.AMP;
  const C = AMP.codex = {};
  const STATUTS = { inconnu: 'inconnu', decouvert: 'découvert', maitrise: 'maîtrisé', grave: 'gravé' };
  let vue = { onglet: 'formule', region: null, recherche: '' };

  // opts.id : ouvrir directement sur un élément ; opts.region : filtrer une région.
  C.ouvrir = function (opts) {
    opts = opts || {};
    if (opts.id && AMP.donnees.items[opts.id]) {
      const it = AMP.donnees.items[opts.id];
      vue = { onglet: it.type, region: it.ch.id, recherche: '', focus: opts.id };
    } else {
      const r = AMP.monde.regionCourante && AMP.monde.regionCourante();
      vue.region = opts.region || (r ? r.ch.id : vue.region);
      vue.focus = null;
    }
    const enCombat = AMP.combat && AMP.combat.actif;
    const corps = AMP.ui.fenetre('Grimoire', '<div class="codex-barre">' +
      '<div class="onglets" role="tablist">' +
      ['formule:Formules', 'notion:Notions', 'piege:Pièges', 'fiche:Fiche de révision'].map(function (o) {
        const p = o.split(':'); return '<button role="tab" data-onglet="' + p[0] + '">' + p[1] + '</button>';
      }).join('') + '</div>' +
      '<select class="codex-region"><option value="">Toutes les régions</option>' + AMP.donnees.regions.map(function (r) {
        return '<option value="' + r.ch.id + '">' + AMP.esc(r.nom) + '</option>';
      }).join('') + '</select>' +
      '<input type="search" class="codex-recherche" placeholder="Chercher (nom, symbole…)"></div><div class="codex-liste"></div>',
    { classe: 'large', onFerme: enCombat ? AMP.combat.retourCodex : null });
    corps.querySelector('.codex-region').value = vue.region || '';
    corps.querySelector('.codex-recherche').value = vue.recherche;
    corps.addEventListener('click', function (ev) {
      const o = ev.target.closest('[data-onglet]');
      if (o) { vue.onglet = o.dataset.onglet; vue.focus = null; remplir(corps); }
      const l = ev.target.closest('[data-codex]');
      if (l) { C.ouvrir({ id: l.dataset.codex }); }
      if (ev.target.closest('[data-imprimer]')) window.print();
    });
    corps.querySelector('.codex-region').addEventListener('change', function (ev) { vue.region = ev.target.value || null; remplir(corps); });
    corps.querySelector('.codex-recherche').addEventListener('input', function (ev) { vue.recherche = ev.target.value; remplir(corps); });
    remplir(corps);
  };

  function items() {
    let l = [];
    AMP.donnees.regions.forEach(function (r) {
      if (vue.region && r.ch.id !== vue.region) return;
      l = l.concat(AMP.donnees.parChapitre[r.ch.id] || []);
    });
    return l;
  }
  function correspond(it) {
    const q = vue.recherche.trim().toLowerCase();
    if (!q || !AMP.srs.decouvert(it.id)) return !q;
    const t = [it.el.nom, it.el.definition, it.el.texte, it.el.latex, (it.el.variables || []).map(function (v) { return v.symbole + ' ' + v.signification; }).join(' ')].join(' ').toLowerCase();
    return t.indexOf(q) >= 0;
  }

  function remplir(corps) {
    corps.querySelectorAll('[data-onglet]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.onglet === vue.onglet); });
    const liste = corps.querySelector('.codex-liste');
    if (vue.onglet === 'fiche') { liste.innerHTML = fiche(); return; }
    const l = items().filter(function (it) { return it.type === vue.onglet && correspond(it); });
    const decouverts = l.filter(function (it) { return AMP.srs.decouvert(it.id); }).length;
    let h = '<p class="codex-compte">' + decouverts + ' / ' + l.length + ' découverts</p>';
    let regionPrec = null;
    l.forEach(function (it) {
      if (!vue.region && it.ch.id !== regionPrec) {
        regionPrec = it.ch.id;
        h += '<h3 class="codex-region-titre">' + AMP.esc(AMP.region(it.ch.id).nom) + ' <small>— ' + AMP.esc(it.ch.titre) + '</small></h3>';
      }
      h += carte(it);
    });
    liste.innerHTML = h || '<p>Rien ici pour l\'instant.</p>';
    if (vue.focus) {
      const f = liste.querySelector('[data-id="' + vue.focus + '"]');
      if (f) { f.classList.add('focus'); f.scrollIntoView({ block: 'center' }); }
    }
  }

  function carte(it) {
    const st = AMP.srs.statut(it.id), e = AMP.srs.etat(it.id);
    const tete = '<div class="c-statut ' + st + '">' + STATUTS[st] + (e ? ' · boîte ' + e.boite + '/5' : '') + '</div>';
    if (st === 'inconnu') {
      return '<article class="codex-carte inconnu" data-id="' + it.id + '">' + tete + '<p>???</p><p class="q-petit">Parle aux habitants de ' + AMP.esc(AMP.region(it.ch.id).nom) + '.</p></article>';
    }
    let h = '<article class="codex-carte ' + st + '" data-id="' + it.id + '">' + tete;
    if (it.type === 'formule') {
      h += '<h4>' + AMP.texte(it.el.nom) + '</h4>' + AMP.questions.ficheFormule(it.el);
      const liees = [].concat.apply([], AMP.donnees.chapitres.map(function (c) { return c.relations; }))
        .filter(function (r) { return AMP.actif(r) && (r.de === it.id || r.vers === it.id); });
      const vus = {};
      const liens = liees.map(function (r) {
        const autre = r.de === it.id ? r.vers : r.de;
        if (vus[autre]) return ''; vus[autre] = true;
        const a = AMP.donnees.items[autre];
        if (!a) return '';
        return '<li><button class="lien" data-codex="' + autre + '">' + AMP.esc(a.el.nom || a.el.texte) + '</button> — ' + AMP.esc(r.explication) + '</li>';
      }).join('');
      if (liens) h += '<details><summary>Formules et notions liées</summary><ul class="liees">' + liens + '</ul></details>';
      const pieges = it.ch.pieges.filter(function (p) { return AMP.actif(p) && (p.lie_a || []).indexOf(it.id) >= 0; });
      if (pieges.length) h += '<ul class="pieges">' + pieges.map(function (p) { return '<li>⚠ ' + AMP.texte(p.texte) + '</li>'; }).join('') + '</ul>';
    } else if (it.type === 'notion') {
      h += '<h4>' + AMP.texte(it.el.nom) + '</h4><p>' + AMP.texte(it.el.definition) + '</p>' + AMP.questions.sourceHtml(it.el);
    } else {
      h += '<p>⚠ ' + AMP.texte(it.el.texte) + '</p>' + AMP.questions.sourceHtml(it.el);
    }
    return h + '</article>';
  }

  // Fiche de révision : toutes les formules découvertes, prête à imprimer.
  function fiche() {
    let h = '<p class="q-petit">Formules découvertes' + (vue.region ? ' de ' + AMP.esc(AMP.region(vue.region).nom) : '') + '. <button data-imprimer>🖨 Imprimer</button></p><div class="fiche">';
    AMP.donnees.regions.forEach(function (r) {
      if (vue.region && r.ch.id !== vue.region) return;
      const f = (AMP.donnees.parChapitre[r.ch.id] || []).filter(function (it) { return it.type === 'formule' && AMP.srs.decouvert(it.id); });
      if (!f.length) return;
      h += '<h3>' + AMP.esc(r.ch.titre) + '</h3><table class="fiche-table">' + f.map(function (it) {
        return '<tr><td>' + AMP.texte(it.el.nom) + '</td><td>' + AMP.tex(it.el.latex) + '</td><td class="q-petit">' + AMP.texte(it.el.conditions || '') + '</td></tr>';
      }).join('') + '</table>';
    });
    return h + '</div>';
  }
})();
