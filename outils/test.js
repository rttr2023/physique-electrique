// Vérifie le moteur de calcul contre les éléments de réponse des TD, et que chaque rendu s'exécute.
// Usage : node outils/test.js
const fs = require('fs');
const path = require('path');
const racine = path.join(__dirname, '..');

// Charge les scripts dans l'ordre de index.html (sauf app.js, qui a besoin du navigateur).
const html = fs.readFileSync(path.join(racine, 'index.html'), 'utf8');
const scripts = Array.from(html.matchAll(/<script src="([^"]+)"/g)).map(function (m) { return m[1]; }).filter(function (s) { return s !== 'js/app.js'; });
scripts.forEach(function (s) { require(path.join(racine, s)); });
const PE = globalThis.PE, K = PE.circuit;

let echecs = 0, total = 0;
function proche(nom, obtenu, attendu, tol) {
  total++;
  const ok = Math.abs(obtenu - attendu) <= Math.abs(attendu) * (tol || 0.01);
  if (!ok) { echecs++; console.log('ÉCHEC ' + nom + ' : obtenu ' + obtenu + ', attendu ' + attendu); }
}
function vrai(nom, cond) { total++; if (!cond) { echecs++; console.log('ÉCHEC ' + nom); } }

// --- CH05 : cours et TD ---
let s = K.resoudreAC({ regime: 'AC', V: 230, f: 50, charge: K.serie(K.R(12, 'r'), K.L(1.1, 'L')) });
proche('cours bobine Z', s.Zmod, 346); proche('cours bobine phi', s.phiDeg, 88); proche('cours bobine I', s.Ieff, 0.667);
s = K.resoudreAC({ regime: 'AC', V: 24, f: 50, charge: K.L(12e-3, 'L') });
proche('TD5 ex1.1 Z', s.Zmod, 3.77); proche('TD5 ex1.1 I', s.Ieff, 6.37);
s = K.resoudreAC({ regime: 'AC', V: 24, f: 1000, charge: K.Cap(100e-9, 'C') });
proche('TD5 ex2.2 Z', s.Zmod, 1590); proche('TD5 ex2.2 I', s.Ieff, 15.1e-3);
s = K.resoudreAC({ regime: 'AC', V: 24, f: 50, charge: K.serie(K.R(11, 'r'), K.L(0.1, 'L')) });
proche('TD5 ex3 Z', s.Zmod, 33.3); proche('TD5 ex3 I', s.Ieff, 0.720); proche('TD5 ex3 phi', s.phiDeg, 70.7);
const ex4 = { regime: 'AC', V: 12, f: 200e3, charge: K.serie(K.L(6.8e-3, 'L'), K.Cap(142e-12, 'C'), K.R(1000, 'R')) };
s = K.resoudreAC(ex4);
proche('TD5 ex4 I', s.Ieff, 3.86e-3, 0.03); proche('TD5 ex4 phi', s.phiDeg, 71, 0.02);
proche('TD5 ex4 VL', s.info.get(ex4.charge.children[0]).Veff, 33, 0.03);

// --- CH06 : TD ---
const ex2 = { regime: 'AC', V: 230, f: 50, charge: K.par(K.Cap(470e-6, 'C'), K.serie(K.R(3.33, 'R'), K.L(13.3e-3, 'L'))) };
s = K.resoudreAC(ex2);
proche('TD6 ex2 I1', s.info.get(ex2.charge.children[1]).Ieff, 43.1); proche('TD6 ex2 I', s.Ieff, 26.9);
proche('Boucherot S = VI', s.S, s.V * s.Ieff, 1e-9);
proche('P = VI cos phi', s.P, s.V * s.Ieff * Math.cos(s.phi), 1e-9);

// --- Régime continu : exercices A et B ---
s = K.resoudreDC({ regime: 'DC', V: 24, charge: K.serie(K.R(10, 'R1'), K.par(K.R(20, 'R2'), K.Cap(1e-3, 'C'))) });
proche('ExA Req0', s.t0.Req, 10); proche('ExA Reqinf', s.tinf.Req, 30); proche('ExA I0', s.t0.I, 2.4); proche('ExA Iinf', s.tinf.I, 0.8);
proche('ExA Vc inf', s.tinf.info.get(s.reactifs[0]).V, 16); proche('ExA tau', s.tau, 6.667e-3);
s = K.resoudreDC({ regime: 'DC', V: 24, charge: K.serie(K.R(10, 'R1'), K.par(K.R(20, 'R2'), K.L(0.1, 'L'))) });
proche('ExB Req0', s.t0.Req, 30); proche('ExB Iinf', s.tinf.I, 2.4); proche('ExB IL inf', s.tinf.info.get(s.reactifs[0]).I, 2.4); proche('ExB tau', s.tau, 0.015);

// --- Dessin libre : l'exemple doit donner R1 + L1 + (R2 // C1) ---
const a = PE.libre.analyser(PE.libre.exemple());
vrai('analyse exemple sans erreur', a.erreurs.length === 0 && a.charge);
if (a.charge) vrai('analyse exemple structure : ' + K.decrire(a.charge), K.feuilles(a.charge).length === 4 && a.charge.type === 'serie');
vrai('schéma sans source refusé', PE.libre.analyser(PE.libre.exemple().slice(1)).erreurs.length > 0);
vrai('circuit ouvert refusé', PE.libre.analyser(PE.libre.exemple().slice(0, 6)).erreurs.length > 0);

// --- Tous les rendus s'exécutent sur des circuits aléatoires ---
function sansTrou(nom, htmlTxt) { vrai(nom + ' : rendu sans undefined / NaN', typeof htmlTxt === 'string' && !/undefined|NaN/.test(htmlTxt)); }
['AC', 'DC'].forEach(function (regime) {
  [1, 2, 3].forEach(function (niveau) {
    for (let i = 0; i < 60; i++) {
      const c = K.aleatoire(niveau, regime);
      const sol = K.resoudre(c);
      vrai('aléatoire ' + regime + niveau + ' résolu (' + K.decrire(c.charge) + ')', sol.ok);
      if (!sol.ok) continue;
      sansTrou('schéma ' + K.decrire(c.charge), PE.dessin.circuit(c));
      PE.calculs.pour({ c: c, s: sol, params: { cosCible: 0.95 } }).forEach(function (sec) {
        sansTrou('section ' + sec.id + ' ' + regime + niveau + ' (' + K.decrire(c.charge) + ')', sec.rendu({ c: c, s: sol, params: { cosCible: 0.95 } }));
      });
      const ex = PE.exercices.depuisCircuit(c, niveau);
      vrai('exercice ' + regime + niveau, !ex.erreur && ex.questions.length >= 2);
      ex.questions.forEach(function (q) {
        vrai('question finie : ' + q.texte, isFinite(q.attendu));
        vrai('la bonne réponse est acceptée', PE.exercices.verifier(q, PE.num(q.attendu, 4).replace('−', '-')) === true);
        sansTrou('correction', q.correction);
      });
    }
  });
});
PE.exercices.problemes.forEach(function (p) {
  for (let i = 0; i < 30; i++) {
    const ex = p.generer();
    sansTrou('problème ' + p.id, ex.enonce);
    if (ex.circuit) sansTrou('schéma problème ' + p.id, PE.dessin.circuit(ex.circuit, ex.dessin));
    ex.questions.forEach(function (q) { vrai('problème ' + p.id + ' valeur finie', isFinite(q.attendu) && q.attendu !== 0); sansTrou('correction ' + p.id, q.correction); });
  }
});

// --- Chapitres : structure et formules référencées ---
PE.cours.forEach(function (ch) {
  vrai(ch.id + ' a des sections', ch.sections.length > 0 && ch.sources.length > 0);
  ch.sections.forEach(function (sec) { vrai(ch.id + ' libellé court pour « ' + sec.titre + ' »', typeof sec.court === 'string' && sec.court.length > 0 && sec.court.length <= 40); });
  ch.sources.forEach(function (f) { vrai(ch.id + ' source présente : ' + f, fs.existsSync(path.join(racine, 'Cours', f))); });
  ch.sections.forEach(function (sec) {
    sec.blocs.forEach(function (b) {
      if (b.schema) sansTrou(ch.id + ' schéma', PE.dessin.circuit(b.schema, b));
      if (b.fresnel) sansTrou(ch.id + ' fresnel', PE.dessin.fresnel(b.fresnel, K.resoudreAC(b.fresnel)));
      if (b.f) sansTrou(ch.id + ' formule', PE.math(b.f));
    });
  });
});
// --- Tri des exercices par partie : chaque partie citée existe, chaque question en cite une ---
const partiesCours = new Set();
PE.cours.forEach(function (ch) {
  ch.sections.forEach(function (sec) {
    vrai(ch.id + ' section avec id : ' + sec.titre, typeof sec.id === 'string' && sec.id.length > 0);
    vrai(ch.id + ' id de section unique : ' + sec.id, !partiesCours.has(ch.id + '/' + sec.id));
    partiesCours.add(ch.id + '/' + sec.id);
  });
});
function partiesValides(nom, parties) {
  vrai(nom + ' cite au moins une partie', Array.isArray(parties) && parties.length > 0);
  (parties || []).forEach(function (p) { vrai(nom + ' : partie « ' + p + ' » définie dans un chapitre', partiesCours.has(p)); });
}
PE.exercices.problemes.forEach(function (p) { partiesValides('problème ' + p.id, p.parties); });
PE.calculs.sections.forEach(function (sec) { partiesValides('calcul du laboratoire ' + sec.id, sec.parties); });
['AC', 'DC'].forEach(function (regime) {
  [1, 2, 3].forEach(function (niveau) {
    for (let i = 0; i < 20; i++) {
      const ex = PE.exercices.depuisCircuit(K.aleatoire(niveau, regime), niveau);
      if (!ex.erreur) ex.questions.forEach(function (q) { partiesValides('question « ' + q.texte.slice(0, 40) + ' »', q.parties); });
    }
  });
});
// Filtre : avec seulement « Effet capacitif » coché, seules restent les questions qui le citent.
for (let i = 0; i < 20; i++) {
  const ex = PE.exercices.aleatoire(1, 'AC', ['ch05/capacitif']);
  if (!ex.erreur) vrai('filtre par partie', ex.questions.every(function (q) { return q.parties.indexOf('ch05/capacitif') >= 0; }));
}
vrai('problème TD filtré par partie', PE.exercices.probleme(2, ['ch06/relevement']).titre === 'Relèvement du facteur de puissance d\'une installation');

const utilisees = new Set();
const src = fs.readFileSync(path.join(racine, 'js', 'exercices.js'), 'utf8');
Array.from(src.matchAll(/\[('[A-Za-z0-9]+'(?:, ?'[A-Za-z0-9]+')*)\]/g)).forEach(function (m) {
  m[1].split(',').forEach(function (x) { utilisees.add(x.trim().replace(/'/g, '')); });
});
utilisees.forEach(function (id) { vrai('formule « ' + id + ' » définie dans un chapitre', !!PE.formules[id]); });

console.log(echecs ? echecs + ' échec(s) sur ' + total + ' vérifications.' : 'OK — ' + total + ' vérifications réussies.');
process.exit(echecs ? 1 : 0);
