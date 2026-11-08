// Vérifie les données du jeu (game/data/*.json) et régénère game/data/A_VERIFIER.md.
// Usage : node game/outils/verifier-donnees.js
// Contrôles : structure, id uniques, scans cités existants, variables des calculs déclarées,
// relations vers des id existants, exemples recalculés à partir de leurs données.
'use strict';
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..', '..');
const DATA = path.join(RACINE, 'game', 'data');
const COURS = path.join(RACINE, 'Cours');

const erreurs = [];
const avertissements = [];
const err = (m) => erreurs.push(m);
const warn = (m) => avertissements.push(m);

const index = JSON.parse(fs.readFileSync(path.join(DATA, 'index.json'), 'utf8'));
const chapitres = index.chapitres.map((f) => {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')); }
  catch (e) { err(f + ' : JSON invalide (' + e.message + ')'); return null; }
}).filter(Boolean);

// ---------- Index de tous les id ----------
const ids = new Map(); // id -> { chapitre, genre }
function enregistrer(ch, genre, el) {
  if (!el.id) return err(ch.id + ' : ' + genre + ' sans id');
  if (!el.id.startsWith(ch.id + '.')) err(el.id + ' : l\'id doit commencer par « ' + ch.id + '. »');
  if (ids.has(el.id)) err(el.id + ' : id en double');
  ids.set(el.id, { chapitre: ch.id, genre });
}

// ---------- Traçabilité ----------
function tracabilite(ch, quoi, el) {
  const s = el.source;
  if (!s || !s.fichier) return err(quoi + ' : source manquante');
  const fichiers = s.fichier.split(/\s*;\s*/);
  if (!ch.sources.includes(fichiers[0])) err(quoi + ' : ' + fichiers[0] + ' absent des sources du chapitre');
  if (!fs.existsSync(path.join(COURS, fichiers[0]))) err(quoi + ' : scan introuvable ' + fichiers[0]);
  if (!['scan', 'manuscrit', 'déduit', 'hors_cours'].includes(el.origine)) err(quoi + ' : origine invalide « ' + el.origine + ' »');
  if (!Array.isArray(el.ajouts)) err(quoi + ' : « ajouts » doit être une liste');
  if (typeof el['à_vérifier'] !== 'boolean') err(quoi + ' : « à_vérifier » doit valoir true ou false');
  if (el['à_vérifier'] && !el.note) err(quoi + ' : à_vérifier sans note expliquant pourquoi');
  if (el.origine === 'hors_cours' && !el.ajouts.length) err(quoi + ' : origine hors_cours sans explication dans « ajouts »');
}

// Évalue une expression de calcul avec des valeurs { code: nombre }.
function evaluer(expr, valeurs) {
  const noms = Object.keys(valeurs);
  // eslint-disable-next-line no-new-func
  return Function.apply(null, noms.concat('"use strict"; return (' + expr + ');')).apply(null, noms.map((n) => valeurs[n]));
}
function identifiants(expr) {
  return (expr.replace(/Math\.\w+/g, '').match(/[A-Za-z_][A-Za-z0-9_]*/g) || []);
}

const aVerifier = [];
const ajouts = [];

for (const ch of chapitres) {
  ['id', 'titre', 'sources', 'notions', 'formules', 'relations', 'pieges', 'exemples'].forEach((k) => {
    if (ch[k] === undefined) err(ch.id + ' : champ « ' + k + ' » manquant');
  });
  ch.sources.forEach((f) => { if (!fs.existsSync(path.join(COURS, f))) err(ch.id + ' : scan introuvable ' + f); });

  const tout = [];
  ch.notions.forEach((n) => { enregistrer(ch, 'notion', n); tout.push(['notion', n.id, n]); if (!n.definition) err(n.id + ' : définition vide'); });
  ch.formules.forEach((f) => {
    enregistrer(ch, 'formule', f); tout.push(['formule', f.id, f]);
    if (!f.latex) err(f.id + ' : latex manquant');
    const codes = new Set();
    (f.variables || []).forEach((v) => {
      if (!v.symbole || !v.code || v.unite === undefined || !v.signification) err(f.id + ' : variable incomplète ' + JSON.stringify(v));
      codes.add(v.code);
    });
    if (f.calcul) {
      if (!codes.has(f.calcul.cible)) err(f.id + ' : cible du calcul « ' + f.calcul.cible + ' » non déclarée');
      identifiants(f.calcul.expression).forEach((x) => { if (!codes.has(x)) err(f.id + ' : « ' + x + ' » utilisé dans le calcul mais non déclaré'); });
      // Essai numérique : toutes les variables à 2 → le résultat doit être un nombre fini.
      const vals = {}; codes.forEach((c) => { vals[c] = 2; });
      try { const r = evaluer(f.calcul.expression, vals); if (!isFinite(r)) err(f.id + ' : calcul non fini pour des valeurs test'); }
      catch (e) { err(f.id + ' : calcul invalide (' + e.message + ')'); }
    }
  });
  ch.pieges.forEach((p) => { enregistrer(ch, 'piège', p); tout.push(['piège', p.id, p]); });
  ch.exemples.forEach((x) => {
    enregistrer(ch, 'exemple', x); tout.push(['exemple', x.id, x]);
    const vals = {};
    (x.donnees || []).forEach((d) => { vals[d.code] = d.valeur; });
    (x.etapes || []).forEach((e, i) => {
      const quoi = x.id + ' étape ' + (i + 1);
      (e.formules || []).forEach((id) => { if (!ids.has(id) && !ch.formules.concat(ch.notions).some((f) => f.id === id)) warn(quoi + ' : formule « ' + id + ' » inconnue (pas encore extraite ?)'); });
      if (e.calcul && e.reponse && typeof e.reponse.valeur === 'number') {
        let r;
        try { r = evaluer(e.calcul, vals); } catch (er) { return err(quoi + ' : calcul invalide (' + er.message + ')'); }
        const ecart = Math.abs(r - e.reponse.valeur) / Math.max(Math.abs(e.reponse.valeur), 1e-12);
        const tol = e.tolerance || 0.02;
        if (ecart > tol) {
          if (e['à_vérifier']) warn(quoi + ' : le recalcul donne ' + r.toPrecision(4) + ' (corrigé : ' + e.reponse.valeur + ') — écart signalé');
          else err(quoi + ' : le recalcul donne ' + r.toPrecision(4) + ' au lieu de ' + e.reponse.valeur);
        }
      }
      if (e['à_vérifier']) aVerifier.push({ ch: ch.id, genre: 'étape d\'exemple', id: quoi, el: Object.assign({ source: x.source }, e) });
    });
  });
  (ch.annotations_manuscrites || []).forEach((a, i) => tout.push(['annotation', ch.id + ' annotation ' + (i + 1), a]));
  (ch.manques || []).forEach((a, i) => tout.push(['manque', ch.id + ' manque ' + (i + 1), a]));
  ch.relations.forEach((r, i) => tout.push(['relation', ch.id + ' relation ' + (i + 1) + ' (' + r.de + ' → ' + r.vers + ')', r]));

  tout.forEach(([genre, quoi, el]) => {
    tracabilite(ch, quoi, el);
    if (el['à_vérifier']) aVerifier.push({ ch: ch.id, genre, id: quoi, el });
    if (el.ajouts && el.ajouts.length) ajouts.push({ ch: ch.id, genre, id: quoi, el });
  });
}

// Relations et pièges : cibles existantes (un chapitre pas encore extrait → simple avertissement).
const chapitresPresents = new Set(chapitres.map((c) => c.id));
for (const ch of chapitres) {
  const cible = (id, quoi) => {
    if (ids.has(id)) return;
    const c = id.split('.')[0];
    (chapitresPresents.has(c) ? err : warn)(quoi + ' : id inconnu « ' + id + ' »');
  };
  ch.relations.forEach((r) => { cible(r.de, ch.id + ' relation'); cible(r.vers, ch.id + ' relation'); });
  ch.pieges.forEach((p) => (p.lie_a || []).forEach((id) => cible(id, p.id)));
}

// ---------- Récapitulatif ----------
function lien(el) { const s = el.source || {}; return '`' + (s.fichier || '?') + '`' + (s.zone ? ', ' + s.zone : ''); }
let md = '# À vérifier\n\nFichier généré par `node game/outils/verifier-donnees.js` : ne pas le modifier à la main.\n' +
  'Pour corriger : modifie le JSON du chapitre (texte, valeur), passe `"à_vérifier"` à `false` et relance le script.\n\n';
md += '## 1. Passages illisibles, ambigus ou contradictoires (' + aVerifier.length + ')\n\n';
for (const c of chapitresPresents) {
  const l = aVerifier.filter((a) => a.ch === c);
  if (!l.length) continue;
  md += '### ' + c + '\n\n';
  l.forEach((a) => { md += '- **' + a.id + '** (' + a.genre + ') — ' + lien(a.el) + '\n  ' + a.el.note.replace(/\n/g, ' ') + '\n'; });
  md += '\n';
}
md += '## 2. Compléments hors scan (connaissances générales, signalés) (' + ajouts.length + ')\n\n' +
  'Ces éléments sont fidèles au scan, mais un détail a été complété (souvent les unités, que le polycopié n\'écrit pas).\n\n';
for (const c of chapitresPresents) {
  const l = ajouts.filter((a) => a.ch === c);
  if (!l.length) continue;
  md += '### ' + c + '\n\n';
  l.forEach((a) => { md += '- **' + a.id + '** : ' + a.el.ajouts.join(' ; ') + '\n'; });
  md += '\n';
}
fs.writeFileSync(path.join(DATA, 'A_VERIFIER.md'), md);

// ---------- Bilan ----------
avertissements.forEach((m) => console.log('  avertissement : ' + m));
erreurs.forEach((m) => console.log('  ERREUR : ' + m));
const n = (k) => chapitres.reduce((s, c) => s + c[k].length, 0);
console.log(chapitres.length + ' chapitre(s) : ' + n('notions') + ' notions, ' + n('formules') + ' formules, ' + n('relations') +
  ' relations, ' + n('pieges') + ' pièges, ' + n('exemples') + ' exemples. À vérifier : ' + aVerifier.length + '.');
if (erreurs.length) { console.log('ÉCHEC — ' + erreurs.length + ' erreur(s).'); process.exit(1); }
console.log('OK');
