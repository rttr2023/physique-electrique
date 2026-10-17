// Charge le site dans Node (sans navigateur) : le moteur (js/*.js listés dans index.html, sauf app.js)
// puis les chapitres. Utilisé par les outils de vérification et d'inventaire.
const fs = require('fs');
const path = require('path');

const racine = path.join(__dirname, '..');

// Scripts listés dans index.html, dans l'ordre.
function scriptsIndex() {
  const html = fs.readFileSync(path.join(racine, 'index.html'), 'utf8');
  return Array.from(html.matchAll(/<script src="([^"]+)"/g)).map(function (m) { return m[1]; });
}

// Fichiers présents dans chapitres/, triés.
function fichiersChapitres() {
  return fs.readdirSync(path.join(racine, 'chapitres')).filter(function (f) { return /\.js$/.test(f); }).sort()
    .map(function (f) { return 'chapitres/' + f; });
}

// Charge le moteur puis les chapitres. mode 'index' : ceux de index.html ; mode 'dossier' : tous ceux du dossier.
// Chaque chapitre reçoit ch.fichier. Une erreur de chargement n'arrête pas les autres : elle est renvoyée.
function charger(mode) {
  const scripts = scriptsIndex();
  scripts.filter(function (s) { return s.indexOf('js/') === 0 && s !== 'js/app.js'; }).forEach(function (s) { require(path.join(racine, s)); });
  const PE = globalThis.PE;
  const chapitres = mode === 'dossier' ? fichiersChapitres() : scripts.filter(function (s) { return s.indexOf('chapitres/') === 0; });
  const erreurs = [];
  chapitres.forEach(function (f) {
    const avant = PE.cours.slice();
    try { require(path.join(racine, f)); } catch (e) { erreurs.push(f + ' : ' + e.message); return; }
    PE.cours.filter(function (c) { return avant.indexOf(c) < 0; }).forEach(function (c) { c.fichier = f; });
  });
  return { PE: PE, erreurs: erreurs };
}

module.exports = { racine: racine, charger: charger, scriptsIndex: scriptsIndex, fichiersChapitres: fichiersChapitres };
