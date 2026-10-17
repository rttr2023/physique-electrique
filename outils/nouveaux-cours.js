// Liste les PDF du dossier Cours qui ne sont encore référencés par aucun chapitre (chapitres/*.js).
// Usage : node outils/nouveaux-cours.js
const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, '..');
const pdfs = fs.readdirSync(path.join(racine, 'Cours')).filter(function (f) { return /\.pdf$/i.test(f); }).sort();
const chapitres = fs.readdirSync(path.join(racine, 'chapitres')).filter(function (f) { return /\.js$/.test(f); });
const contenu = chapitres.map(function (f) { return fs.readFileSync(path.join(racine, 'chapitres', f), 'utf8'); }).join('\n');

const nouveaux = pdfs.filter(function (f) { return contenu.indexOf("'" + f + "'") < 0; });
console.log('Chapitres intégrés : ' + chapitres.join(', '));
console.log('PDF dans Cours/ : ' + pdfs.length + ' — déjà intégrés : ' + (pdfs.length - nouveaux.length));
if (!nouveaux.length) console.log('Aucun nouveau PDF à intégrer.');
else {
  console.log('Nouveaux PDF à intégrer (' + nouveaux.length + ') :');
  nouveaux.forEach(function (f) { console.log('  Cours/' + f); });
}
