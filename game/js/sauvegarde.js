// Ampéria — sauvegarde automatique (localStorage), export et import d'un fichier .json.
// La sauvegarde ne contient que des identifiants : si un chapitre est complété, la progression est conservée.
(function () {
  'use strict';
  const AMP = window.AMP;
  const SV = AMP.sauvegarde = {};
  SV.CLE = 'amperia-sauvegarde';
  SV.VERSION = 1;

  SV.nouvelEtat = function () {
    return {
      version: SV.VERSION, cree: Date.now(), nom: '', niveau: 1, xp: 0, charge: 30, energie: 3,
      lieu: { carte: 'village', x: null, y: null, dir: 'bas' },
      elements: {},     // id → { boite, prochaine, ok, ko, serie, vu }
      regions: {},      // id de chapitre → { boss: rang ('bronze'|'argent'|'or'), restauree: true }
      equipement: [],
      competences: ['sonde', 'memo'],
      introVue: false,
      options: { horsCours: true, sons: true, texte: 'normal', chrono: false, animations: true, test: false },
      stats: { justes: 0, fautes: 0, parType: {}, tempsJeu: 0, jours: [], combats: 0 },
      decalageJours: 0,
      resume: { aReviser: 0, majLe: 0 }
    };
  };

  // Fusionne une sauvegarde lue avec l'état par défaut (pour les champs ajoutés dans une version plus récente).
  function completer(e) {
    const base = SV.nouvelEtat();
    Object.keys(base).forEach(function (k) {
      if (e[k] === undefined) e[k] = base[k];
      else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
        Object.keys(base[k]).forEach(function (j) { if (e[k][j] === undefined) e[k][j] = base[k][j]; });
      }
    });
    e.version = SV.VERSION;
    return e;
  }

  SV.charger = function () {
    try {
      const t = localStorage.getItem(SV.CLE);
      if (t) return completer(JSON.parse(t));
    } catch (e) { /* stockage indisponible ou abîmé : nouvelle partie */ }
    return null;
  };

  let minuteur = null;
  SV.sauver = function (immediat) {
    if (!AMP.etat) return;
    const ecrire = function () {
      minuteur = null;
      try {
        // Petit résumé lisible par le disjoncteur du site (LED).
        let n = 0;
        AMP.donnees.chapitres.forEach(function (ch) { n += AMP.srs.aReviser(ch.id).length; });
        AMP.etat.resume = { aReviser: n, majLe: Date.now() };
        localStorage.setItem(SV.CLE, JSON.stringify(AMP.etat));
      } catch (e) { /* stockage plein ou indisponible */ }
    };
    if (immediat) { if (minuteur) clearTimeout(minuteur); ecrire(); }
    else if (!minuteur) minuteur = setTimeout(ecrire, 400);
  };

  SV.exporter = function () {
    const blob = new Blob([JSON.stringify(AMP.etat, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'amperia-' + (AMP.etat.nom || 'sauvegarde').replace(/[^\w-]+/g, '_') + '-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  };

  // Renvoie une promesse : true si l'import a réussi.
  SV.importer = function (fichier) {
    return fichier.text().then(function (t) {
      const e = JSON.parse(t);
      if (!e || typeof e !== 'object' || !e.elements) throw new Error('Ce fichier n\'est pas une sauvegarde d\'Ampéria.');
      localStorage.setItem(SV.CLE, JSON.stringify(completer(e)));
      return true;
    });
  };

  SV.effacer = function () { try { localStorage.removeItem(SV.CLE); } catch (e) { /* rien */ } };
})();
