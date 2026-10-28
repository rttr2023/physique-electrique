// Vérifie le moteur de calcul contre les éléments de réponse des TD, et que chaque rendu s'exécute.
// Usage : node outils/test.js
const fs = require('fs');
const path = require('path');
const racine = path.join(__dirname, '..');

// Charge les scripts dans l'ordre de index.html (sauf app.js, qui a besoin du navigateur).
const charge = require('./charger').charger('index');
const V = require('./verifs');
const PE = charge.PE, K = PE.circuit;

let echecs = 0, total = 0;
function proche(nom, obtenu, attendu, tol) {
  total++;
  const ok = Math.abs(obtenu - attendu) <= Math.abs(attendu) * (tol || 0.01);
  if (!ok) { echecs++; console.log('ÉCHEC ' + nom + ' : obtenu ' + obtenu + ', attendu ' + attendu); }
}
function vrai(nom, cond) { total++; if (!cond) { echecs++; console.log('ÉCHEC ' + nom); } }

// --- Syntaxe de tous les scripts de index.html (app.js compris, qui n'est pas exécuté ici) ---
require('./charger').scriptsIndex().forEach(function (s) {
  try { new (require('vm').Script)(fs.readFileSync(path.join(racine, s), 'utf8'), { filename: s }); vrai('syntaxe ' + s, true); }
  catch (e) { vrai('syntaxe ' + s + ' : ' + e.message, false); }
});

// --- Contrôles numériques propres à chaque chapitre : outils/controles/<id>.js ---
// Chaque fichier exporte function (PE, proche, vrai) { ... } (voir outils/FORMAT-CHAPITRE.md).
const dossierControles = path.join(racine, 'outils', 'controles');
if (fs.existsSync(dossierControles)) {
  fs.readdirSync(dossierControles).filter(function (f) { return /\.js$/.test(f); }).sort().forEach(function (f) {
    const id = f.replace(/\.js$/, '');
    vrai('contrôles ' + f + ' : le chapitre ' + id + ' existe', PE.cours.some(function (c) { return c.id === id; }));
    try { require(path.join(dossierControles, f))(PE, function (nom, o, a, t) { proche(id + ' ' + nom, o, a, t); }, function (nom, c) { vrai(id + ' ' + nom, c); }); }
    catch (e) { vrai('contrôles ' + f + ' : ' + e.message, false); }
  });
}

// --- Structure des chapitres, cohérence entre chapitres, index.html et inventaire des scans ---
charge.erreurs.forEach(function (e) { vrai('chargement ' + e, false); });
PE.cours.forEach(function (ch) { V.verifierChapitre(PE, ch).forEach(function (m) { vrai(m, false); }); total++; });
V.verifierSite(PE).forEach(function (m) { vrai(m, false); });
total++;

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
