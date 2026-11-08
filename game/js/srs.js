// Ampéria — répétition espacée (boîtes de Leitner) et maîtrise.
// Chaque élément découvert a une boîte (0 à 5) et une date de prochaine révision (en jours).
(function (racine) {
  'use strict';
  const AMP = racine.AMP;

  const S = AMP.srs = {};
  S.INTERVALLES = [0, 1, 3, 7, 14, 30]; // jours avant la révision suivante, par boîte
  S.POIDS = [8, 5, 3, 2, 1, 0.5];       // probabilité relative d'être interrogé, par boîte

  function etats() { return AMP.etat.elements; }
  S.etat = function (id) { return etats()[id] || null; };
  S.decouvert = function (id) { return !!etats()[id]; };

  // Premier contact (PNJ) : l'élément entre dans le grimoire, boîte 0, à réviser tout de suite.
  S.decouvrir = function (id) {
    if (etats()[id]) return false;
    etats()[id] = { boite: 0, prochaine: AMP.aujourdhui(), ok: 0, ko: 0, serie: 0 };
    return true;
  };

  // Enregistre une réponse. resultat : 'juste' | 'demi' | 'faux'.
  // opts.bonus : bonne réponse « forte » (calcul juste du premier coup) → +2 ; opts.aide : aide utilisée → +1 au plus.
  S.repondre = function (id, resultat, opts) {
    opts = opts || {};
    S.decouvrir(id);
    const e = etats()[id];
    if (resultat === 'juste') {
      e.boite = Math.min(5, e.boite + (opts.bonus && !opts.aide ? 2 : 1));
      e.ok++; e.serie++;
    } else if (resultat === 'demi') {
      e.boite = Math.max(0, e.boite - 1);
      e.serie = 0;
    } else {
      e.boite = 0; e.ko++; e.serie = 0;
    }
    e.prochaine = AMP.aujourdhui() + S.INTERVALLES[e.boite];
    e.vu = AMP.aujourdhui();
    return e;
  };

  // En retard : découvert et date de révision dépassée (ou boîte 0 ratée).
  S.enRetard = function (id) {
    const e = etats()[id];
    return !!e && e.prochaine <= AMP.aujourdhui() && (e.boite > 0 || e.ko > 0);
  };

  S.poids = function (id) {
    const e = etats()[id];
    if (!e) return 0;
    return S.POIDS[e.boite] * (e.prochaine <= AMP.aujourdhui() ? 2 : 1);
  };

  // Tire un identifiant au hasard, pondéré par le besoin de révision.
  S.tirer = function (ids, rnd, exclus) {
    const l = ids.filter(function (id) { return !exclus || exclus.indexOf(id) < 0; });
    let total = 0;
    const p = l.map(function (id) { const w = S.poids(id); total += w; return w; });
    if (!total) return l.length ? AMP.choisir(l, rnd) : null;
    let r = (rnd || AMP.alea)() * total;
    for (let i = 0; i < l.length; i++) { r -= p[i]; if (r <= 0) return l[i]; }
    return l[l.length - 1];
  };

  // Maîtrise d'un chapitre : moyenne des boîtes de ses éléments (non découverts = 0), sur 5.
  S.maitrise = function (chId) {
    const items = AMP.donnees.parChapitre[chId] || [];
    if (!items.length) return 0;
    let s = 0;
    items.forEach(function (it) { const e = etats()[it.id]; s += e ? e.boite : 0; });
    return s / (5 * items.length);
  };

  // Éléments d'un chapitre à réviser maintenant.
  S.aReviser = function (chId) {
    return (AMP.donnees.parChapitre[chId] || []).filter(function (it) { return S.enRetard(it.id); }).map(function (it) { return it.id; });
  };

  // État d'une formule dans le grimoire.
  S.statut = function (id) {
    const e = etats()[id];
    if (!e) return 'inconnu';
    if (e.boite >= 5) return 'grave';
    if (e.boite >= 3) return 'maitrise';
    return 'decouvert';
  };
})(typeof window !== 'undefined' ? window : globalThis);
