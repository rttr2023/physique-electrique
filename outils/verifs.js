// Contrôles automatiques des chapitres et de l'inventaire des scans.
// Chaque fonction renvoie une liste de problèmes (chaînes) : liste vide = tout va bien.
const fs = require('fs');
const path = require('path');
const { racine, scriptsIndex, fichiersChapitres } = require('./charger');

const BLOCS = ['p', 'h', 'f', 'note', 'alerte', 'liste', 'table', 'schema', 'fresnel', 'triangles', 'reponses', 'html'];
const FICHIER_INVENTAIRE = path.join(racine, 'Cours', 'inventaire.json');

// Id attendu : 'ch07' en 1re année, 'a2-ch07' en 2e année…
function idAttendu(annee, numero) {
  const n = (numero < 10 ? '0' : '') + numero;
  return (annee > 1 ? 'a' + annee + '-' : '') + 'ch' + n;
}

function sansTrou(html) { return typeof html === 'string' && !/undefined|NaN/.test(html); }

// Structure d'un chapitre.
function verifierChapitre(PE, ch) {
  const pb = [];
  const nom = ch.fichier || ch.id;
  function err(m) { pb.push(nom + ' : ' + m); }
  const annee = PE.annee(ch);
  if (typeof ch.numero !== 'number') err('« numero » doit être un nombre');
  if (ch.id !== idAttendu(annee, ch.numero)) err('id « ' + ch.id + ' » ; attendu « ' + idAttendu(annee, ch.numero) + ' » (année ' + annee + ', chapitre ' + ch.numero + ')');
  if (ch.fichier && ch.fichier !== 'chapitres/' + idAttendu(annee, ch.numero) + '.js') err('le fichier devrait s\'appeler chapitres/' + idAttendu(annee, ch.numero) + '.js');
  ['titre', 'resume'].forEach(function (k) { if (!ch[k] || typeof ch[k] !== 'string') err('champ « ' + k + ' » manquant'); });
  if (!Array.isArray(ch.objectifs)) err('« objectifs » doit être un tableau');
  if (!Array.isArray(ch.sources) || !ch.sources.length) err('aucun PDF dans « sources »');
  (ch.sources || []).forEach(function (f) { if (!fs.existsSync(path.join(racine, 'Cours', f))) err('source introuvable : Cours/' + f); });
  if (!Array.isArray(ch.sections) || !ch.sections.length) { err('aucune section'); return pb; }
  const ids = {};
  ch.sections.forEach(function (s, i) {
    const ou = 'section ' + (i + 1) + ' (' + (s.titre || '?') + ')';
    if (!s.id || !/^[a-z0-9-]+$/.test(s.id)) err(ou + ' : id manquant ou invalide (minuscules, chiffres, tirets)');
    else if (ids[s.id]) err(ou + ' : id « ' + s.id + ' » déjà utilisé dans le chapitre');
    ids[s.id] = true;
    if (!s.titre) err(ou + ' : titre manquant');
    if (!s.court || s.court.length > 40) err(ou + ' : libellé « court » manquant ou trop long (40 caractères max)');
    if (!Array.isArray(s.blocs) || !s.blocs.length) { err(ou + ' : aucun bloc'); return; }
    s.blocs.forEach(function (b, j) {
      const cles = Object.keys(b).filter(function (k) { return BLOCS.indexOf(k) >= 0; });
      if (!cles.length) { err(ou + ', bloc ' + (j + 1) + ' : type inconnu (' + Object.keys(b).join(', ') + ')'); return; }
      try {
        if (b.f && !sansTrou(PE.math(b.f))) err(ou + ' : formule mal rendue « ' + b.f + ' »');
        if (b.schema) {
          if (!sansTrou(PE.dessin.circuit(b.schema, b))) err(ou + ' : schéma mal dessiné');
          const sol = PE.circuit.resoudre(b.schema);
          if (!sol.ok) err(ou + ' : schéma non résoluble (' + sol.erreur + ')');
        }
        if (b.fresnel && !sansTrou(PE.dessin.fresnel(b.fresnel, PE.circuit.resoudreAC(b.fresnel)))) err(ou + ' : Fresnel mal dessiné');
        if (b.table && (!Array.isArray(b.table.tetes) || !Array.isArray(b.table.lignes))) err(ou + ' : tableau sans « tetes » ou « lignes »');
        if (b.table) b.table.lignes.forEach(function (l, k) { if (l.length !== b.table.tetes.length) err(ou + ' : la ligne ' + (k + 1) + ' du tableau n\'a pas autant de cases que d\'en-têtes'); });
        if (b.liste && !Array.isArray(b.liste)) err(ou + ' : « liste » doit être un tableau');
      } catch (e) { err(ou + ', bloc ' + (j + 1) + ' : erreur au rendu (' + e.message + ')'); }
    });
  });
  (ch.formules || []).forEach(function (f) {
    ['id', 'groupe', 'nom', 'expr'].forEach(function (k) { if (!f[k]) err('formule « ' + (f.id || f.nom || '?') + ' » : champ « ' + k + ' » manquant'); });
    try { if (f.expr && !sansTrou(PE.math(f.expr))) err('formule « ' + f.id + ' » mal rendue'); } catch (e) { err('formule « ' + f.id + ' » : ' + e.message); }
  });
  return pb;
}

// Cohérence entre chapitres, avec index.html et avec l'inventaire.
// options.index === false : ne pas contrôler index.html (chapitre en cours d'écriture, pas encore branché).
function verifierSite(PE, options) {
  const pb = [];
  const ids = {}, numeros = {}, formules = {}, pdfs = {};
  PE.cours.forEach(function (ch) {
    if (ids[ch.id]) pb.push('id de chapitre en double : ' + ch.id);
    ids[ch.id] = true;
    const cle = PE.annee(ch) + '/' + ch.numero;
    if (numeros[cle]) pb.push('deux chapitres ' + ch.numero + ' en année ' + PE.annee(ch) + ' : ' + numeros[cle] + ' et ' + ch.id);
    numeros[cle] = ch.id;
    (ch.formules || []).forEach(function (f) {
      if (formules[f.id]) pb.push('id de formule « ' + f.id + ' » utilisé dans ' + formules[f.id] + ' et ' + ch.id + ' (les id doivent être uniques sur tout le site)');
      formules[f.id] = ch.id;
    });
    (ch.sources || []).forEach(function (s) {
      if (pdfs[s] && pdfs[s] !== ch.id) pb.push(s + ' figure dans les sources de ' + pdfs[s] + ' et de ' + ch.id);
      pdfs[s] = ch.id;
    });
  });
  if (options && options.index === false) return pb.concat(verifierInventaire(PE));
  // index.html : chaque fichier de chapitres/ doit y être chargé, entre les repères.
  const html = fs.readFileSync(path.join(racine, 'index.html'), 'utf8');
  const bloc = (html.split('COURS:DEBUT')[1] || '').split('COURS:FIN')[0];
  const charges = scriptsIndex().filter(function (s) { return s.indexOf('chapitres/') === 0; });
  fichiersChapitres().forEach(function (f) {
    if (bloc.indexOf('"' + f + '"') < 0) pb.push(f + ' n\'est pas chargé dans index.html (entre COURS:DEBUT et COURS:FIN)');
  });
  charges.forEach(function (f) { if (!fs.existsSync(path.join(racine, f))) pb.push('index.html charge ' + f + ', qui n\'existe pas'); });
  return pb.concat(verifierInventaire(PE));
}

function lireInventaire() {
  if (!fs.existsSync(FICHIER_INVENTAIRE)) return {};
  return JSON.parse(fs.readFileSync(FICHIER_INVENTAIRE, 'utf8'));
}
function ecrireInventaire(inv) {
  const trie = {};
  Object.keys(inv).sort().forEach(function (k) { trie[k] = inv[k]; });
  fs.writeFileSync(FICHIER_INVENTAIRE, JSON.stringify(trie, null, 2) + '\n');
}

// Chaque PDF de l'inventaire existe, a une année et un chapitre (ou est ignoré),
// et le chapitre qui le cite en source est bien celui de l'inventaire.
function verifierInventaire(PE) {
  const pb = [];
  const inv = lireInventaire();
  const sources = {};
  PE.cours.forEach(function (ch) { (ch.sources || []).forEach(function (s) { sources[s] = ch; }); });
  Object.keys(inv).forEach(function (f) {
    const e = inv[f];
    if (!fs.existsSync(path.join(racine, 'Cours', f))) pb.push('inventaire : ' + f + ' n\'existe pas dans Cours/');
    if (e.ignore) { if (sources[f]) pb.push('inventaire : ' + f + ' est marqué « ignore » mais figure dans les sources de ' + sources[f].id); return; }
    if (typeof e.annee !== 'number' || typeof e.chapitre !== 'number') { pb.push('inventaire : ' + f + ' sans « annee » ou « chapitre » numérique'); return; }
    const ch = sources[f];
    if (ch && (PE.annee(ch) !== e.annee || ch.numero !== e.chapitre)) {
      pb.push('inventaire : ' + f + ' est rangé en année ' + e.annee + ' chapitre ' + e.chapitre + ' mais figure dans les sources de ' + ch.id);
    }
  });
  return pb;
}

module.exports = { idAttendu: idAttendu, verifierChapitre: verifierChapitre, verifierSite: verifierSite, verifierInventaire: verifierInventaire, lireInventaire: lireInventaire, ecrireInventaire: ecrireInventaire, FICHIER_INVENTAIRE: FICHIER_INVENTAIRE };
