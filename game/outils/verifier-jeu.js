// Vérifie le jeu sans navigateur : régions, cartes, affirmations, plages, et génère des centaines de questions.
// Usage : node game/outils/verifier-jeu.js
'use strict';
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const DATA = path.join(RACINE, 'data');
global.AMP = undefined;
['noyau', 'donnees', 'srs', 'questions', 'monde-donnees'].forEach(function (m) { require(path.join(RACINE, 'js', m + '.js')); });
const AMP = globalThis.AMP;

const erreurs = [];
const avert = [];
const err = (m) => erreurs.push(m);

(async function () {
  await AMP.chargerDonnees(async (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')));
  const D = AMP.donnees;
  AMP.etat = { elements: {} };

  // ---------- Régions ----------
  D.regions.forEach((r) => {
    if (!D.cartes[r.gabarit]) err(r.ch.id + ' : gabarit de carte introuvable « ' + r.gabarit + ' »');
    (r.boss.exemples || []).forEach((id) => {
      const x = AMP.exemple(id);
      if (!x) err(r.ch.id + ' : exemple de boss introuvable ' + id);
      else if (x.ex['à_vérifier']) err(r.ch.id + ' : le boss utilise un exemple à vérifier ' + id);
    });
    const nbEtapes = (r.boss.exemples || []).reduce((s, id) => s + AMP.questions.etapesActives(AMP.exemple(id).ex).length, 0) + (r.boss.serie || 0);
    if (!nbEtapes) err(r.ch.id + ' : boss sans aucune étape');
  });

  // ---------- Cartes ----------
  Object.keys(D.cartes).forEach((nom) => {
    const c = D.cartes[nom];
    const w = c.lignes[0].length;
    c.lignes.forEach((l, y) => { if (l.length !== w) err('carte ' + nom + ' : ligne ' + y + ' de longueur ' + l.length + ' au lieu de ' + w); });
    const inconnus = new Set();
    c.lignes.join('').split('').forEach((ch) => { if (!c.legende[ch]) inconnus.add(ch); });
    if (inconnus.size) err('carte ' + nom + ' : caractères sans légende ' + [...inconnus].join(' '));
    const carte = AMP.monde.analyserCarte(c);
    if (!carte.depart) err('carte ' + nom + ' : pas de départ S');
    if (nom === 'village') {
      'abcdef'.split('').forEach((p) => { if (!carte.portails[p]) err('village : portail ' + p + ' absent'); });
      Object.keys(carte.portails).forEach((p) => { if (!carte.accessible(carte.portails[p], 99)) err('village : portail ' + p + ' inaccessible'); });
      if (!carte.mentor || !carte.accessible(carte.mentor, 99)) err('village : mentor inaccessible');
      if (D.libre && (!carte.libre || !carte.accessible(carte.libre, 99))) err('village : portail du monde libre (m) absent ou inaccessible');
      return;
    }
    if (c.biomes) {
      // Monde libre : chaque champion doit être accessible avec seulement la place centrale et son territoire.
      if (c.biomes.length !== c.lignes.length || c.biomes.some((l) => l.length !== w)) err('carte ' + nom + ' : grille des territoires de mauvaise taille');
      if (!carte.sortie) err('carte ' + nom + ' : pas de retour au village E');
      for (let k = 1; k <= D.regions.length; k++) {
        const ch = carte.champions.filter((t) => carte.biome(t.x, t.y) === k);
        if (!ch.length) { avert.push('carte ' + nom + ' : territoire ' + k + ' sans champion'); continue; }
        carte.ouverts = { 0: true }; carte.ouverts[k] = true;
        if (!carte.accessible(ch[0], 0)) err('carte ' + nom + ' : champion du territoire ' + k + ' inaccessible');
        const herbes = carte.cases.filter((t) => t.c === ',' && carte.biome(t.x, t.y) === k).length;
        if (herbes < 30) avert.push('carte ' + nom + ' : territoire ' + k + ' : ' + herbes + ' cases d’herbes hautes');
      }
      carte.ouverts = null;
      return;
    }
    // Zones : sans gabarit cohérent, les portes ne servent à rien.
    if (!carte.boss) err('carte ' + nom + ' : pas de boss K');
    if (!carte.sortie) err('carte ' + nom + ' : pas de sortie E');
    carte.pnj.forEach((p) => {
      if (!carte.accessible(p, p.zone)) err('carte ' + nom + ' : PNJ (' + p.x + ',' + p.y + ') de la zone ' + p.zone + ' inaccessible avec ' + p.zone + ' porte(s) ouvertes');
      if (p.zone > 0 && carte.accessible(p, p.zone - 1)) err('carte ' + nom + ' : PNJ (' + p.x + ',' + p.y + ') de la zone ' + p.zone + ' accessible trop tôt');
    });
    if (!carte.accessible(carte.boss, 99)) err('carte ' + nom + ' : boss inaccessible');
    if (carte.accessible(carte.boss, carte.nbZones - 1)) err('carte ' + nom + ' : boss accessible sans ouvrir la porte du poste');
    if (!carte.accessible(carte.sortie, 0)) err('carte ' + nom + ' : sortie inaccessible');
    if (carte.pupitre && !carte.accessible(carte.pupitre, 0)) err('carte ' + nom + ' : pupitre inaccessible');
    const herbes = carte.cases.filter((t) => t.c === ',').length;
    if (herbes < 20) avert.push('carte ' + nom + ' : seulement ' + herbes + ' cases d\'herbes hautes');
  });

  // ---------- Affirmations et plages ----------
  Object.keys(D.affirmations).filter((k) => k[0] !== '_').forEach((id) => {
    const it = Object.values(D.chapitres).flatMap((c) => c.pieges).find((p) => p.id === id);
    if (!it) err('affirmations.json : piège inconnu ' + id);
    const a = D.affirmations[id];
    if (!a.vrai || !a.faux) err('affirmations.json : ' + id + ' sans vrai/faux');
  });
  D.chapitres.forEach((c) => c.pieges.forEach((p) => { if (AMP.actif(p) && !D.affirmations[p.id]) avert.push('piège sans affirmation (pas de vrai/faux) : ' + p.id); }));
  Object.keys(D.plages.formules || {}).forEach((id) => {
    const f = D.chapitres.flatMap((c) => c.formules).find((x) => x.id === id);
    if (!f) { err('plages.json : formule inconnue ' + id); return; }
    Object.keys(D.plages.formules[id]).forEach((k) => {
      if (['exclure', 'reponse_en'].includes(k)) return;
      if (!f.variables.some((v) => v.code === k)) err('plages.json : ' + id + ' : variable inconnue ' + k);
    });
  });

  // ---------- Questions ----------
  const rnd = AMP.hasard(42);
  AMP.alea = rnd;
  let nb = 0;
  const parType = {};
  Object.values(D.items).forEach((it) => {
    const types = AMP.questions.typesPossibles(it);
    if (!types.length) { avert.push('élément sans attaque possible : ' + it.id); return; }
    types.forEach((t) => {
      for (let i = 0; i < 25; i++) {
        const q = AMP.questions.generer(it, t, rnd);
        if (!q) { err(it.id + ' : génération ' + t + ' impossible'); return; }
        nb++; parType[t] = (parType[t] || 0) + 1;
        if (q.mode === 'choix') {
          const justes = q.choix.filter((c) => c.juste).length;
          if (justes !== 1) err(it.id + ' (' + t + ') : ' + justes + ' bonne(s) réponse(s)');
          const textes = q.choix.map((c) => c.html);
          if (new Set(textes).size !== textes.length) err(it.id + ' (' + t + ') : propositions en double');
          if (q.choix.length < 2) err(it.id + ' (' + t + ') : moins de 2 propositions');
          const ij = q.choix.findIndex((c) => c.juste);
          if (AMP.questions.verifier(q, ij) !== 'juste') err(it.id + ' : la bonne réponse est refusée');
        } else if (q.mode === 'saisie') {
          const a = q.attendu;
          if (!isFinite(a.valeur)) err(it.id + ' : valeur attendue non finie');
          if (!q.unites.map(AMP.normUnite).includes(AMP.normUnite(a.unite))) err(it.id + ' : unité attendue absente des propositions');
          if (AMP.questions.verifier(q, { valeur: a.valeur * 1.01, unite: a.unite }) !== 'juste') err(it.id + ' : réponse à 1 % refusée');
          if (AMP.questions.verifier(q, { valeur: a.valeur * 1.05, unite: a.unite }) !== 'faux') err(it.id + ' : réponse à 5 % acceptée');
          if (AMP.questions.verifier(q, { valeur: a.valeur, unite: a.unite === 'V' ? 'A' : 'V' }) !== 'demi') err(it.id + ' : unité fausse non détectée');
          if (/NaN|undefined|Infinity/.test(q.enonceHtml)) err(it.id + ' : énoncé de calcul incorrect');
        }
        if (/undefined/.test(q.enonceHtml + q.correctionHtml)) err(it.id + ' (' + t + ') : « undefined » dans le texte');
      }
    });
  });

  // ---------- Boss ----------
  D.regions.forEach((r) => {
    (r.boss.exemples || []).forEach((id) => {
      const x = AMP.exemple(id);
      if (!x) return;
      [false, true].forEach((modifier) => {
        const vals = AMP.questions.valeursExemple(x.ex, modifier && AMP.questions.modifiable(x.ex), rnd);
        AMP.questions.etapesActives(x.ex).forEach((e, i) => {
          const q = AMP.questions.etape(x.ex, e, vals, x.ch);
          if (q.mode === 'saisie') {
            if (!isFinite(q.attendu.valeur)) err(id + ' étape ' + (i + 1) + ' : valeur non finie');
            if (!modifier && typeof e.reponse.valeur === 'number' && Math.abs(q.attendu.valeur - e.reponse.valeur) / Math.max(1e-12, Math.abs(e.reponse.valeur)) > 0.02)
              err(id + ' étape ' + (i + 1) + ' : avec les valeurs du cours, ' + q.attendu.valeur + ' ≠ ' + e.reponse.valeur);
          }
        });
      });
      if (!AMP.questions.modifiable(x.ex)) avert.push('boss ' + id + ' : valeurs du cours seulement (exercice non modifiable)');
    });
  });

  avert.forEach((m) => console.log('  avertissement : ' + m));
  erreurs.slice(0, 60).forEach((m) => console.log('  ERREUR : ' + m));
  console.log(D.regions.length + ' régions, ' + Object.keys(D.items).length + ' éléments, ' + nb + ' questions générées ' + JSON.stringify(parType) + '.');
  if (erreurs.length) { console.log('ÉCHEC — ' + erreurs.length + ' erreur(s).'); process.exit(1); }
  console.log('OK');
})().catch((e) => { console.error(e); process.exit(1); });
