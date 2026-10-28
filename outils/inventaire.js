// Inventaire des scans du dossier Cours : ce qui reste à lire, à intégrer, et dans quel chapitre.
// L'inventaire est stocké dans Cours/inventaire.json : { "A1-Ch07-p01.pdf": { annee, chapitre, titre, type, note, origine } }
// ou { "scan0139.pdf": { ignore: true, note: "page de garde" } }. Les PDF déjà cités dans les sources
// d'un chapitre y sont ajoutés automatiquement.
// Usage : node outils/inventaire.js          (rapport lisible)
//         node outils/inventaire.js --json   (plan de travail en JSON)
const fs = require('fs');
const path = require('path');
const { racine, charger } = require('./charger');
const V = require('./verifs');

const { PE, erreurs } = charger('dossier');
const inv = V.lireInventaire();

// Compléter l'inventaire avec les PDF déjà intégrés.
const sources = {};
let ajoutes = 0;
PE.cours.forEach(function (ch) {
  (ch.sources || []).forEach(function (s) {
    sources[s] = ch;
    if (!inv[s]) { inv[s] = { annee: PE.annee(ch), chapitre: ch.numero, titre: ch.titre }; ajoutes++; }
  });
});
if (ajoutes) V.ecrireInventaire(inv);

const pdfs = fs.readdirSync(path.join(racine, 'Cours')).filter(function (f) { return /\.pdf$/i.test(f); }).sort();
const aInventorier = pdfs.filter(function (f) { return !inv[f]; });
const ignores = pdfs.filter(function (f) { return inv[f] && inv[f].ignore; });

// Scans inventoriés mais pas encore intégrés, regroupés par chapitre.
const plan = {};
pdfs.forEach(function (f) {
  const e = inv[f];
  if (!e || e.ignore || sources[f]) return;
  const id = V.idAttendu(e.annee, e.chapitre);
  if (!plan[id]) {
    const existant = PE.cours.find(function (c) { return c.id === id; });
    plan[id] = { id: id, annee: e.annee, chapitre: e.chapitre, titre: (existant && existant.titre) || e.titre || '',
      fichier: 'chapitres/' + id + '.js', etat: existant ? 'suite' : 'nouveau', scans: [] };
  }
  plan[id].scans.push(f);
});
const chapitres = Object.keys(plan).map(function (k) { return plan[k]; })
  .sort(function (a, b) { return a.annee - b.annee || a.chapitre - b.chapitre; });
const incoherences = erreurs.concat(V.verifierInventaire(PE));

if (process.argv.indexOf('--json') >= 0) {
  console.log(JSON.stringify({ aInventorier: aInventorier, chapitres: chapitres, incoherences: incoherences }, null, 2));
} else {
  console.log('PDF dans Cours/ : ' + pdfs.length + ' — intégrés : ' + Object.keys(sources).filter(function (f) { return pdfs.indexOf(f) >= 0; }).length +
    ' — ignorés : ' + ignores.length + ' — à inventorier : ' + aInventorier.length);
  if (ajoutes) console.log('(' + ajoutes + ' PDF déjà intégrés ajoutés à Cours/inventaire.json)');
  if (aInventorier.length) {
    console.log('\nÀ inventorier (' + aInventorier.length + ') :');
    aInventorier.forEach(function (f) { console.log('  Cours/' + f); });
  }
  if (chapitres.length) {
    console.log('\nChapitres à intégrer (' + chapitres.length + ') :');
    chapitres.forEach(function (c) {
      console.log('  ' + c.id + ' — ' + (c.annee === 1 ? '1re' : c.annee + 'e') + ' année, chapitre ' + c.chapitre + (c.titre ? ' « ' + c.titre + ' »' : '') +
        ' — ' + (c.etat === 'nouveau' ? 'nouveau fichier ' : 'suite de ') + c.fichier + ' — ' + c.scans.length + ' scan(s) : ' + c.scans.join(', '));
    });
  }
  if (!aInventorier.length && !chapitres.length) console.log('Rien de nouveau : tous les PDF sont intégrés ou ignorés.');
  if (incoherences.length) {
    console.log('\nIncohérences (' + incoherences.length + ') :');
    incoherences.forEach(function (m) { console.log('  ' + m); });
  }
}
process.exit(incoherences.length ? 1 : 0);
