// Ampéria — chargement des données (cours + réglages du jeu) et index des éléments révisables.
// Fonctionne aussi dans Node : AMP.chargerDonnees reçoit une fonction de lecture.
(function (racine) {
  'use strict';
  const AMP = racine.AMP;

  // Options qui changent les éléments utilisés (modifiées par la sauvegarde).
  AMP.options = { horsCours: true };

  // Un élément de cours est utilisable s'il n'est pas « à vérifier » et, selon l'option, s'il n'est pas hors cours.
  AMP.actif = function (el) {
    return !!el && !el['à_vérifier'] && (AMP.options.horsCours || el.origine !== 'hors_cours');
  };

  const D = AMP.donnees = {
    chapitres: [], parChapitre: {}, items: {}, regions: [], village: null, chantiers: [],
    plages: {}, affirmations: {}, dialogues: {}, cartes: {}
  };

  // lire(chemin) → Promise de l'objet JSON (chemin relatif au dossier data/).
  AMP.chargerDonnees = async function (lire) {
    const index = await lire('index.json');
    D.chapitres = await Promise.all(index.chapitres.map(function (f) { return lire(f); }));
    const res = await Promise.all([lire('regions.json'), lire('plages.json'), lire('affirmations.json'), lire('dialogues.json')]);
    const regions = res[0];
    D.plages = res[1]; D.affirmations = res[2]; D.dialogues = res[3];
    D.village = regions.village;
    D.libre = regions.libre || null;
    D.chantiers = regions.chantiers || [];

    // Une région par chapitre (configuration de regions.json, ou région par défaut).
    const lettres = 'abcdef';
    D.regions = D.chapitres.map(function (ch, i) {
      const cfg = (regions.regions || []).find(function (r) { return r.chapitre === ch.id; }) || {
        chapitre: ch.id, nom: 'Terres de « ' + ch.titre + ' »', gabarit: ['plaine', 'marais', 'forteresse'][i % 3],
        couleur: ['tension', 'courant', 'puissance'][i % 3], theme: {}, parasites: ['court-jus', 'ohmlette', 'spectre'],
        boss: { nom: 'Le Gardien du chapitre ' + ch.numero, exemples: [], serie: 6 }
      };
      return Object.assign({ index: i, portail: cfg.portail || lettres[i] || null }, cfg, { ch: ch });
    });

    const gabarits = ['village'].concat(D.libre ? [D.libre.gabarit] : []).concat(D.regions.map(function (r) { return r.gabarit; }));
    const uniques = gabarits.filter(function (g, i) { return gabarits.indexOf(g) === i; });
    const cartes = await Promise.all(uniques.map(function (g) { return lire('cartes/' + g + '.json'); }));
    uniques.forEach(function (g, i) { D.cartes[g] = cartes[i]; });

    AMP.indexer();
    return D;
  };

  // Construit la liste des éléments révisables de chaque chapitre, dans l'ordre du polycopié.
  AMP.indexer = function () {
    D.items = {};
    D.parChapitre = {};
    const rangType = { notion: 0, formule: 1, piege: 2 };
    D.chapitres.forEach(function (ch) {
      const liste = [];
      const ajouter = function (type, el, i) {
        if (!AMP.actif(el)) return;
        const page = Math.max(0, ch.sources.indexOf(el.source && el.source.fichier));
        const it = { id: el.id, type: type, ch: ch, el: el, tri: page * 10000 + rangType[type] * 1000 + i };
        liste.push(it);
        D.items[el.id] = it;
      };
      ch.notions.forEach(function (n, i) { ajouter('notion', n, i); });
      ch.formules.forEach(function (f, i) { ajouter('formule', f, i); });
      ch.pieges.forEach(function (p, i) { ajouter('piege', p, i); });
      liste.sort(function (a, b) { return a.tri - b.tri; });
      D.parChapitre[ch.id] = liste;
    });
  };

  AMP.chapitre = function (id) { return D.chapitres.find(function (c) { return c.id === id; }); };
  AMP.region = function (chId) { return D.regions.find(function (r) { return r.ch.id === chId; }); };
  AMP.exemple = function (id) {
    for (const ch of D.chapitres) { const x = ch.exemples.find(function (e) { return e.id === id; }); if (x) return { ex: x, ch: ch }; }
    return null;
  };

  // Toutes les unités rencontrées dans un chapitre (pour proposer des unités dans les calculs).
  AMP.unitesChapitre = function (ch) {
    const s = {};
    ch.formules.forEach(function (f) { (f.variables || []).forEach(function (v) { if (v.unite.indexOf(',') < 0) s[AMP.normUnite(v.unite)] = true; }); });
    return Object.keys(s);
  };
  AMP.toutesUnites = function () {
    const s = {};
    D.chapitres.forEach(function (ch) { AMP.unitesChapitre(ch).forEach(function (u) { s[u] = true; }); });
    return Object.keys(s);
  };
})(typeof window !== 'undefined' ? window : globalThis);
