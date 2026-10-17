// Vérifie un ou plusieurs chapitres sans qu'ils soient encore branchés dans index.html.
// Usage : node outils/verifier-chapitre.js chapitres/ch07.js [chapitres/ch08.js …]
//         (sans argument : tous les chapitres du dossier)
const fs = require('fs');
const path = require('path');
const { charger } = require('./charger');
const V = require('./verifs');

const { PE, erreurs } = charger('dossier');
const cibles = process.argv.slice(2).map(function (f) { return f.replace(/\\/g, '/').replace(/^\.\//, ''); });
const chs = PE.cours.filter(function (c) { return !cibles.length || cibles.indexOf(c.fichier) >= 0; });
let pb = erreurs.slice();
cibles.forEach(function (f) {
  if (!PE.cours.some(function (c) { return c.fichier === f; }) && !erreurs.some(function (e) { return e.indexOf(f) === 0; })) {
    pb.push(f + ' : aucun chapitre chargé (le fichier doit appeler PE.ajouterCours)');
  }
});
chs.forEach(function (ch) {
  pb = pb.concat(V.verifierChapitre(PE, ch));
  // Contrôles numériques du chapitre (outils/controles/<id>.js), s'il y en a.
  const ctrl = path.join(__dirname, 'controles', ch.id + '.js');
  if (!fs.existsSync(ctrl)) return;
  try {
    require(ctrl)(PE, function (nom, o, a, t) {
      if (!(Math.abs(o - a) <= Math.abs(a) * (t || 0.01))) pb.push(ch.id + ' contrôle « ' + nom + ' » : obtenu ' + o + ', attendu ' + a);
    }, function (nom, c) { if (!c) pb.push(ch.id + ' contrôle « ' + nom + ' » faux'); });
  } catch (e) { pb.push(ctrl + ' : ' + e.message); }
});
pb = pb.concat(V.verifierSite(PE, { index: false }));

if (pb.length) {
  console.log(pb.length + ' problème(s) :');
  pb.forEach(function (m) { console.log('  ' + m); });
  process.exit(1);
}
console.log('OK — ' + chs.map(function (c) { return c.id + ' (' + c.sections.length + ' sections, ' + (c.formules || []).length + ' formules)'; }).join(', '));
