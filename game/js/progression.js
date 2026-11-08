// Ampéria — progression : XP, niveaux, Charge, Énergie, équipement, compétences, statistiques.
(function () {
  'use strict';
  const AMP = window.AMP;
  const P = AMP.prog = {};

  P.XP = { eclair: 5, contre: 5, soudure: 10, diagnostic: 10, arc: 20, etape: 30, victoire: 10, boss: 100 };

  P.EQUIPEMENTS = {
    gants: { nom: 'Gants isolants', icone: '🧤', effet: 'Charge maximale +20 %' },
    casque: { nom: 'Casque d\'électricien', icone: '⛑', effet: 'Ripostes des Parasites −25 %' },
    multimetre: { nom: 'Multimètre TRMS', icone: '📟', effet: 'Énergie maximale +2' },
    oscilloscope: { nom: 'Oscilloscope', icone: '📈', effet: 'Soudures et Diagnostics +30 % de dégâts' },
    calculatrice: { nom: 'Calculatrice de chantier', icone: '🧮', effet: 'Calculatrice dans l\'écran de combat' },
    cle: { nom: 'Clé dynamométrique', icone: '🔩', effet: 'Arcs calculés +20 % de dégâts' }
  };
  P.COMPETENCES = {
    sonde: { nom: 'Sonde', cout: 2, niveau: 1, effet: 'Retire 2 mauvaises réponses d\'un QCM' },
    memo: { nom: 'Mémo', cout: 3, niveau: 1, effet: 'Affiche la formule d\'un calcul' },
    pince: { nom: 'Pince ampèremétrique', cout: 2, niveau: 3, effet: 'Indique l\'unité attendue' },
    releve: { nom: 'Relèvement', cout: 4, niveau: 5, effet: 'Rend 30 % de Charge' },
    differentiel: { nom: 'Disjoncteur différentiel', cout: 4, niveau: 7, effet: 'Annule la prochaine riposte' }
  };

  P.a = function (eq) { return AMP.etat.equipement.indexOf(eq) >= 0; };
  P.xpPourNiveau = function (n) { return 60 + (n - 1) * 45; };
  P.chargeMax = function () { return Math.round((30 + (AMP.etat.niveau - 1) * 5) * (P.a('gants') ? 1.2 : 1)); };
  P.energieMax = function () { return 3 + Math.floor(AMP.etat.niveau / 2) + (P.a('multimetre') ? 2 : 0); };
  P.competences = function () {
    return Object.keys(P.COMPETENCES).filter(function (k) { return AMP.etat.niveau >= P.COMPETENCES[k].niveau; });
  };

  // Ajoute de l'XP ; renvoie la liste des niveaux gagnés.
  P.gagnerXp = function (n) {
    const e = AMP.etat, gagnes = [];
    e.xp += n;
    while (e.xp >= P.xpPourNiveau(e.niveau)) {
      e.xp -= P.xpPourNiveau(e.niveau);
      e.niveau++;
      gagnes.push(e.niveau);
      e.charge = P.chargeMax();
      e.energie = P.energieMax();
    }
    return gagnes;
  };
  P.soigner = function () { AMP.etat.charge = P.chargeMax(); AMP.etat.energie = P.energieMax(); };

  P.noterReponse = function (type, resultat) {
    const s = AMP.etat.stats;
    if (!s.parType[type]) s.parType[type] = { j: 0, f: 0 };
    if (resultat === 'juste') { s.justes++; s.parType[type].j++; } else { s.fautes++; s.parType[type].f++; }
    const j = AMP.aujourdhui();
    if (s.jours.indexOf(j) < 0) { s.jours.push(j); if (s.jours.length > 400) s.jours.shift(); }
  };
  // Jours d'affilée (jusqu'à aujourd'hui).
  P.serieJours = function () {
    const s = AMP.etat.stats.jours;
    let n = 0, j = AMP.aujourdhui();
    while (s.indexOf(j) >= 0) { n++; j--; }
    return n;
  };

  // Rang de boss selon le nombre d'erreurs.
  P.rang = function (erreurs) { return erreurs === 0 ? 'or' : erreurs <= 2 ? 'argent' : 'bronze'; };
  P.RANGS = { bronze: 1, argent: 2, or: 3 };
})();
