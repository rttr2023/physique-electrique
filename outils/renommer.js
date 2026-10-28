// Renomme les scans inventoriés d'après leur chapitre : A<année>-Ch<NN>-p<KK>.pdf (ex. A1-Ch07-p03.pdf),
// en continuant la numérotation des pages déjà présentes. Le nom d'origine est gardé dans « origine ».
// Met à jour Cours/inventaire.json et les « sources » des chapitres. Les scans ignorés gardent leur nom.
// Usage : node outils/renommer.js
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { racine } = require('./charger');
const V = require('./verifs');

const MOTIF = /^A(\d+)-Ch(\d{2})-p(\d{2})\.pdf$/;
const inv = V.lireInventaire();
const deux = function (n) { return (n < 10 ? '0' : '') + n; };

// Dernière page déjà numérotée de chaque chapitre.
const derniere = {};
Object.keys(inv).forEach(function (f) {
  const m = f.match(MOTIF);
  if (m) { const cle = 'A' + m[1] + '-Ch' + m[2]; derniere[cle] = Math.max(derniere[cle] || 0, +m[3]); }
});

// Nouveaux noms, dans l'ordre alphabétique des scans (donc l'ordre de numérisation).
const renommes = {};
const neuf = {};
Object.keys(inv).sort().forEach(function (f) {
  const e = inv[f];
  if (MOTIF.test(f) || e.ignore || typeof e.annee !== 'number' || typeof e.chapitre !== 'number') { neuf[f] = e; return; }
  const cle = 'A' + e.annee + '-Ch' + deux(e.chapitre);
  derniere[cle] = (derniere[cle] || 0) + 1;
  const nom = cle + '-p' + deux(derniere[cle]) + '.pdf';
  renommes[f] = nom;
  neuf[nom] = Object.assign({}, e, { origine: e.origine || f });
});

const anciens = Object.keys(renommes);
if (!anciens.length) { console.log('Rien à renommer.'); process.exit(0); }

anciens.forEach(function (f) {
  const de = path.join('Cours', f), vers = path.join('Cours', renommes[f]);
  try { cp.execFileSync('git', ['mv', de, vers], { cwd: racine, stdio: 'ignore' }); }
  catch (e) { fs.renameSync(path.join(racine, de), path.join(racine, vers)); } // scan pas encore suivi par Git
  console.log('  ' + f + ' → ' + renommes[f]);
});
V.ecrireInventaire(neuf);

fs.readdirSync(path.join(racine, 'chapitres')).filter(function (c) { return /\.js$/.test(c); }).forEach(function (c) {
  const p = path.join(racine, 'chapitres', c);
  const avant = fs.readFileSync(p, 'utf8');
  let t = avant;
  anciens.forEach(function (f) { t = t.split("'" + f + "'").join("'" + renommes[f] + "'"); });
  if (t !== avant) fs.writeFileSync(p, t);
});
console.log(anciens.length + ' scan(s) renommé(s).');
