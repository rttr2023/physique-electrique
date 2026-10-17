// Interface : navigation, pages Cours / Laboratoire / Exercices / Formulaire.
(function () {
  'use strict';
  const PE = window.PE;
  const K = PE.circuit;
  const vue = document.getElementById('vue');
  const T = PE.texte;

  // ---------- État sauvegardé dans le navigateur ----------
  function lireStock(cle, defaut) {
    try { const v = JSON.parse(localStorage.getItem(cle)); return v === null || v === undefined ? defaut : v; } catch (e) { return defaut; }
  }
  function ecrireStock(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }

  const labo = Object.assign({
    regime: 'AC', V: 230, f: 50, mode: 'blocs', niveau: 2,
    arbre: { type: 'serie', children: [{ type: 'R', nom: 'R1', val: 12 }, { type: 'L', nom: 'L1', val: 1.1 }] },
    libre: { elements: PE.libre.exemple(), outil: 'sel', sel: null, message: '' },
    params: { cosCible: 0.95 }, fermes: {}
  }, lireStock('pe-labo', {}));
  const exo = Object.assign({ source: 'alea', regime: 'AC', niveau: 1, aide: 1 }, lireStock('pe-exo', {}));
  let stats = lireStock('pe-stats', { 1: { n: 0, ok: 0 }, 2: { n: 0, ok: 0 }, 3: { n: 0, ok: 0 } });
  let exercice = null, etats = [];
  let schemasCours = [];

  function sauver() {
    ecrireStock('pe-labo', labo);
    ecrireStock('pe-exo', exo);
  }

  // ---------- Sélection du volet de gauche : chapitres et parties étudiés ----------
  // On mémorise les parties décochées par leur id ({ ch05: ['capacitif'] }), si bien qu'une nouvelle partie arrive cochée.
  let exclus = lireStock('pe-exclus', {});

  function partieChoisie(ch, i) { return (exclus[ch.id] || []).indexOf(ch.sections[i].id) < 0; }
  function partiesChoisies(ch) { return ch.sections.map(function (_, i) { return i; }).filter(function (i) { return partieChoisie(ch, i); }); }
  function chapitreChoisi(ch) { return partiesChoisies(ch).length > 0; }
  function coursChoisis() { return PE.cours.filter(chapitreChoisi); }
  // Parties cochées sous la forme 'ch05/inductif', pour le tri des exercices.
  function clesChoisies() {
    return PE.cours.reduce(function (t, ch) {
      return t.concat(partiesChoisies(ch).map(function (i) { return ch.id + '/' + ch.sections[i].id; }));
    }, []);
  }
  function libelleCourt(s) { return s.court || s.titre.replace(/^(\d+\.|Document \d+ :|Annexe \d+ :)\s*/, ''); }

  function cocherChapitre(ch, oui) {
    if (oui) delete exclus[ch.id];
    else exclus[ch.id] = ch.sections.map(function (s) { return s.id; });
  }
  function cocherPartie(ch, i, oui) {
    const id = ch.sections[i].id;
    const liste = (exclus[ch.id] || []).filter(function (x) { return x !== id; });
    if (!oui) liste.push(id);
    if (liste.length) exclus[ch.id] = liste; else delete exclus[ch.id];
  }

  const AUCUN = '<section class="carte"><p class="note">Aucun chapitre n\'est coché : choisis dans le volet de gauche les chapitres et les parties que tu étudies.</p></section>';

  // ---------- Années et noms de chapitres ----------
  function annees() {
    return PE.cours.reduce(function (t, c) { if (t.indexOf(PE.annee(c)) < 0) t.push(PE.annee(c)); return t; }, []);
  }
  function nomAnnee(a) { return a === 1 ? '1re année' : a + 'e année'; }
  // « Chapitre 5 », précédé de l'année dès que le site contient plusieurs années.
  function nomChapitre(ch) { return (annees().length > 1 ? nomAnnee(PE.annee(ch)) + ' · ' : '') + 'Chapitre ' + ch.numero; }

  // ---------- Rendu du volet ----------
  let ouverts = lireStock('pe-volet-ouverts', {}); // chapitres dépliés dans le volet
  let recherche = '';
  function sansAccent(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function correspond(texte) { return !recherche || sansAccent(texte.replace(/<[^>]+>|\$/g, '')).indexOf(recherche) >= 0; }

  function chapitreHTML(ch) {
    const n = partiesChoisies(ch).length;
    const titreOk = correspond('Chapitre ' + ch.numero + ' ' + ch.titre);
    const visibles = ch.sections.map(function (_, i) { return i; }).filter(function (i) {
      return titreOk || correspond(libelleCourt(ch.sections[i]) + ' ' + ch.sections[i].titre);
    });
    if (!visibles.length) return '';
    const ouvert = recherche ? true : !!ouverts[ch.id];
    return '<div class="volet-ch">' +
      '<div class="volet-ligne"><button class="volet-plier" data-plier="' + ch.id + '" aria-expanded="' + ouvert + '" aria-label="' + (ouvert ? 'Replier' : 'Déplier') + ' le chapitre ' + ch.numero + '">' + (ouvert ? '▾' : '▸') + '</button>' +
      '<label class="volet-titre"><input type="checkbox" data-ch="' + ch.id + '"' + (n ? ' checked' : '') + '><span>Chapitre ' + ch.numero +
      (n && n < ch.sections.length ? ' <span class="volet-compte">' + n + '/' + ch.sections.length + '</span>' : '') +
      '<small>' + PE.esc(ch.titre) + '</small></span></label>' +
      '<a class="volet-ouvrir" href="#cours/' + ch.id + '" title="Ouvrir le cours : ' + PE.esc(ch.titre) + '">Ouvrir</a></div>' +
      (ouvert ? '<ul>' + visibles.map(function (i) {
        return '<li><label><input type="checkbox" data-ch="' + ch.id + '" data-partie="' + i + '"' + (partieChoisie(ch, i) ? ' checked' : '') + '>' +
          '<span>' + T(libelleCourt(ch.sections[i])) + '</span></label></li>';
      }).join('') + '</ul>' : '') + '</div>';
  }

  function arbreHTML() {
    const h = annees().map(function (a) {
      const chs = PE.cours.filter(function (c) { return PE.annee(c) === a; });
      const corps = chs.map(chapitreHTML).join('');
      if (!corps) return '';
      const n = chs.filter(chapitreChoisi).length;
      return '<section class="volet-annee"><label class="volet-annee-titre"><input type="checkbox" data-annee="' + a + '"' + (n ? ' checked' : '') + '>' +
        '<span>' + nomAnnee(a) + '</span></label>' + corps + '</section>';
    }).join('');
    return h || '<p class="discret">Aucune partie ne correspond à « ' + PE.esc(recherche) + ' ».</p>';
  }

  function majVolet() {
    const v = document.getElementById('volet-arbre');
    v.innerHTML = arbreHTML();
    // Cases à moitié cochées quand seule une partie du chapitre (ou de l'année) est retenue.
    PE.cours.forEach(function (ch) {
      const c = v.querySelector('input[data-ch="' + ch.id + '"]:not([data-partie])');
      const n = partiesChoisies(ch).length;
      if (c) c.indeterminate = n > 0 && n < ch.sections.length;
    });
    annees().forEach(function (a) {
      const c = v.querySelector('input[data-annee="' + a + '"]');
      const chs = PE.cours.filter(function (x) { return PE.annee(x) === a; });
      if (c) c.indeterminate = c.checked && chs.some(function (x) { return partiesChoisies(x).length < x.sections.length; });
    });
  }

  function changerSelection() {
    ecrireStock('pe-exclus', exclus);
    majVolet();
    afficher(true);
  }

  // Circuit courant du laboratoire : { circuit, erreurs, avert }
  function circuitLabo() {
    let charge, erreurs = [], avert = [];
    if (labo.mode === 'libre') {
      const a = PE.libre.analyser(labo.libre.elements);
      charge = a.charge; erreurs = a.erreurs; avert = a.avert;
    } else {
      charge = K.normaliser(K.nommer(labo.arbre));
      if (!charge) erreurs.push('Le schéma est vide : ajoute au moins un dipôle.');
    }
    return { circuit: { regime: labo.regime, V: labo.V, f: labo.f, charge: charge }, erreurs: erreurs, avert: avert };
  }

  function ouvrirDansLabo(circuit) {
    const c = K.copier(circuit);
    labo.regime = c.regime; labo.V = c.V; if (c.f > 0) labo.f = c.f;
    labo.arbre = K.estFeuille(c.charge) ? { type: 'serie', children: [c.charge] } : c.charge;
    labo.mode = 'blocs';
    sauver();
    location.hash = '#labo';
  }

  // ================= Cours =================
  function bloc(b) {
    if (b.p) return '<p>' + T(b.p) + '</p>';
    if (b.h) return '<h4>' + T(b.h) + '</h4>';
    if (b.f) return '<div class="eq' + (b.cadre ? ' cadre' : '') + '">' + PE.math(b.f) + (b.unites ? '<span class="unites">' + b.unites + '</span>' : '') + '</div>';
    if (b.note) return '<p class="note">' + T(b.note) + '</p>';
    if (b.alerte) return '<p class="alerte">' + T(b.alerte) + '</p>';
    if (b.liste) {
      const tag = b.ordonnee ? 'ol' : 'ul';
      return '<' + tag + '>' + b.liste.map(function (l) { return '<li>' + T(l) + '</li>'; }).join('') + '</' + tag + '>';
    }
    if (b.table) {
      return '<div class="table-wrap"><table><thead><tr>' + b.table.tetes.map(function (t) { return '<th>' + T(t) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        b.table.lignes.map(function (l) { return '<tr>' + l.map(function (c) { return '<td>' + T(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    }
    if (b.schema) {
      schemasCours.push(b.schema);
      return '<figure>' + PE.dessin.circuit(b.schema, b) + '<figcaption>' + (b.legende || '') +
        ' <button class="lien" data-schema="' + (schemasCours.length - 1) + '">Ouvrir dans le laboratoire →</button></figcaption></figure>';
    }
    if (b.fresnel) {
      const s = K.resoudreAC(b.fresnel);
      return '<figure>' + PE.dessin.fresnel(b.fresnel, s) + (b.legende ? '<figcaption>' + b.legende + '</figcaption>' : '') + '</figure>';
    }
    if (b.triangles) {
      return '<div class="deux"><figure>' + PE.dessin.triangle(4, 3) + '<figcaption>Circuit de type inductif : Q &gt; 0</figcaption></figure>' +
        '<figure>' + PE.dessin.triangle(4, -3) + '<figcaption>Circuit de type capacitif : Q &lt; 0</figcaption></figure></div>';
    }
    if (b.reponses) return '<details class="reponses"><summary>Éléments de réponse</summary><p>' + T(b.reponses) + '</p></details>';
    if (b.html) return b.html;
    return '';
  }

  function tableFormules(liste) {
    const groupes = [];
    liste.forEach(function (f) {
      let g = groupes.find(function (x) { return x.nom === f.groupe; });
      if (!g) { g = { nom: f.groupe, fs: [] }; groupes.push(g); }
      g.fs.push(f);
    });
    return groupes.map(function (g) {
      return '<h4>' + g.nom + '</h4><div class="table-wrap"><table class="formules"><tbody>' + g.fs.map(function (f) {
        return '<tr><th scope="row">' + f.nom + '</th><td class="f">' + PE.math(f.expr) + '</td><td>' + T(f.quand || '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    }).join('');
  }

  function pageCours(id) {
    schemasCours = [];
    const ch = PE.cours.find(function (c) { return c.id === id; });
    if (!ch) {
      const choisis = coursChoisis();
      return '<h1>Cours</h1><p class="intro">Les chapitres ci-dessous sont la transcription de tes polycopiés (dossier <code>Cours</code>). ' +
        'Quand tu ajoutes de nouveaux scans, lance la commande <code>/maj-cours</code> dans Claude Code pour les intégrer.</p>' +
        (choisis.length ? annees().map(function (a) {
          const chs = choisis.filter(function (c) { return PE.annee(c) === a; });
          if (!chs.length) return '';
          return (annees().length > 1 ? '<h2 class="titre-annee">' + nomAnnee(a) + '</h2>' : '') + '<div class="cartes">' + chs.map(function (c) {
            const n = partiesChoisies(c).length;
            return '<a class="carte lien-carte" href="#cours/' + c.id + '"><span class="tag">' + nomChapitre(c) + '</span><h2>' + c.titre + '</h2><p>' + c.resume + '</p>' +
              '<p class="discret">' + (n < c.sections.length ? n + ' parties cochées sur ' + c.sections.length : c.sections.length + ' parties') + ' · ' + (c.formules || []).length + ' formules</p></a>';
          }).join('') + '</div>';
        }).join('') : AUCUN);
    }
    const parties = partiesChoisies(ch);
    const masquees = ch.sections.length - parties.length;
    return '<p><a href="#cours">← Tous les chapitres</a></p><span class="tag">' + nomChapitre(ch) + ' · ' + (ch.programme || '') + '</span><h1>' + ch.titre + '</h1>' +
      '<p class="intro">' + ch.resume + '</p>' +
      (masquees ? '<p class="note">' + (parties.length ? masquees + ' partie' + (masquees > 1 ? 's' : '') + ' du chapitre ' + (masquees > 1 ? 'sont masquées' : 'est masquée') : 'Toutes les parties de ce chapitre sont masquées') +
        (masquees > 1 ? ' : coche-les' : ' : coche-la') + ' dans le volet de gauche pour l' + (masquees > 1 ? 'es' : 'a') + ' afficher.</p>' : '') +
      '<section class="carte"><h2>Objectifs</h2><ul>' + ch.objectifs.map(function (o) { return '<li>' + o + '</li>'; }).join('') + '</ul></section>' +
      '<nav class="puces" aria-label="Sommaire du chapitre">' + parties.map(function (i) { return '<a href="#cours/' + ch.id + '" data-vers="sec-' + i + '">' + ch.sections[i].titre + '</a>'; }).join('') +
      '<a href="#cours/' + ch.id + '" data-vers="sec-fiche">Fiche résumé</a></nav>' +
      parties.map(function (i) {
        const s = ch.sections[i];
        return '<section class="carte" id="sec-' + i + '"><h2>' + s.titre + '</h2>' + s.blocs.map(bloc).join('') + '</section>';
      }).join('') +
      '<section class="carte" id="sec-fiche"><h2>Fiche résumé — formules du chapitre</h2>' + tableFormules(ch.formules || []) + '</section>' +
      '<section class="carte"><h2>Polycopiés d\'origine</h2><p class="liens-pdf">' + ch.sources.map(function (s) {
        return '<a href="Cours/' + s + '" target="_blank" rel="noopener">' + s + '</a>';
      }).join(' ') + '</p></section>';
  }

  function pageFormulaire() {
    const choisis = coursChoisis();
    return '<h1>Formulaire</h1><p class="intro">Les formules des chapitres cochés dans le volet de gauche, regroupées par thème.</p>' +
      (choisis.length ? choisis.map(function (c) {
        return '<section class="carte"><span class="tag">' + nomChapitre(c) + '</span><h2>' + c.titre + '</h2>' + tableFormules(c.formules || []) + '</section>';
      }).join('') : AUCUN);
  }

  // ================= Laboratoire =================
  function pageLabo() {
    return '<h1>Laboratoire</h1><p class="intro">Génère un schéma au hasard ou construis le tien : tous les calculs possibles s\'affichent en dessous, une section par calcul.</p>' +
      '<section class="carte"><div class="barre">' +
      '<label>Régime <select id="l-regime"><option value="AC">Sinusoïdal</option><option value="DC">Continu (t = 0⁺ et t → ∞)</option></select></label>' +
      '<label><span id="l-nomV">V</span> <input id="l-V" type="number" class="court" min="0" step="any"> V</label>' +
      '<label id="l-f-wrap">f <input id="l-f" type="number" class="court" min="0" step="any"> Hz</label>' +
      '<span class="sep"></span>' +
      '<label>Complexité <select id="l-niveau"><option value="1">Simple</option><option value="2">Moyenne</option><option value="3">Avancée</option></select></label>' +
      '<button id="l-alea" class="primaire">Schéma aléatoire</button></div>' +
      '<div class="onglets" role="tablist"><button data-mode="blocs" role="tab">Blocs série / dérivation</button><button data-mode="libre" role="tab">Dessin libre</button></div>' +
      '<div id="l-editeur"></div><div id="l-statut"></div><div id="l-schema"></div></section>' +
      '<nav id="l-sommaire" class="puces" aria-label="Sections de calcul"></nav><div id="l-calculs"></div>';
  }

  function majEditeur() {
    const ed = document.getElementById('l-editeur');
    ed.innerHTML = labo.mode === 'libre' ? PE.libre.rendu(labo.libre, labo.regime) : PE.blocs.rendu(K.nommer(labo.arbre));
    document.querySelectorAll('.onglets [data-mode]').forEach(function (b) {
      b.classList.toggle('actif', b.dataset.mode === labo.mode);
      b.setAttribute('aria-selected', b.dataset.mode === labo.mode);
    });
  }

  // Sections de calcul dont au moins une partie est cochée dans le volet.
  function calculsChoisis(ctx) {
    const cles = clesChoisies();
    return PE.calculs.pour(ctx).filter(function (sec) {
      return sec.parties.some(function (p) { return cles.indexOf(p) >= 0; });
    });
  }

  function sectionsHTML(ctx) {
    const liste = calculsChoisis(ctx);
    if (!liste.length) return '<section class="carte"><p class="note">Aucune section de calcul ne correspond aux parties cochées dans le volet de gauche.</p></section>';
    return liste.map(function (sec, i) {
      const ch = PE.cours.find(function (c) { return c.id === sec.chapitre; });
      return '<details class="carte calc" id="calc-' + sec.id + '" data-id="' + sec.id + '"' + (labo.fermes[sec.id] ? '' : ' open') + '><summary><span class="numero">' + (i + 1) + '</span> ' + sec.titre +
        (ch ? ' <a class="tag" href="#cours/' + ch.id + '" title="' + PE.esc(nomChapitre(ch) + ' : ' + ch.titre) + '">CH' + ch.numero + '</a>' : '') + '</summary><div class="corps">' + sec.rendu(ctx) + '</div></details>';
    }).join('');
  }

  function majCalculs() {
    const r = circuitLabo();
    const statut = document.getElementById('l-statut');
    const schema = document.getElementById('l-schema');
    const zone = document.getElementById('l-calculs');
    const sommaire = document.getElementById('l-sommaire');
    let msg = r.avert.map(function (a) { return '<p class="note">' + PE.esc(a) + '</p>'; }).join('');
    let s = null;
    if (!r.erreurs.length) {
      s = K.resoudre(r.circuit);
      if (!s.ok) r.erreurs.push(s.erreur);
    }
    msg += r.erreurs.map(function (e) { return '<p class="alerte">' + PE.esc(e) + '</p>'; }).join('');
    if (r.circuit.charge) {
      msg += '<p class="discret">Structure : ' + PE.esc(K.decrire(r.circuit.charge)) + ' &nbsp;(+ : série, // : dérivation)</p>';
      schema.innerHTML = '<div class="schema-wrap">' + PE.dessin.circuit(r.circuit) + '</div>';
    } else schema.innerHTML = '';
    statut.innerHTML = msg;
    if (r.erreurs.length) { zone.innerHTML = ''; sommaire.innerHTML = ''; sauver(); return; }
    const ctx = { c: r.circuit, s: s, params: labo.params };
    sommaire.innerHTML = calculsChoisis(ctx).map(function (sec) { return '<a href="#labo" data-vers="calc-' + sec.id + '">' + sec.titre + '</a>'; }).join('');
    zone.innerHTML = sectionsHTML(ctx);
    sauver();
  }

  function majBarreLabo() {
    document.getElementById('l-regime').value = labo.regime;
    document.getElementById('l-V').value = labo.V;
    document.getElementById('l-f').value = labo.f;
    document.getElementById('l-niveau').value = labo.niveau;
    document.getElementById('l-f-wrap').hidden = labo.regime === 'DC';
    document.getElementById('l-nomV').textContent = labo.regime === 'DC' ? 'E' : 'V';
  }

  function attacherLabo() {
    majBarreLabo(); majEditeur(); majCalculs();
    const ed = document.getElementById('l-editeur');
    PE.blocs.attacher(ed, function () { return labo.arbre; }, function (structure) { if (structure) majEditeur(); majCalculs(); });
    PE.libre.attacher(ed, function () { return labo.libre; }, function (redessiner) { if (redessiner) majEditeur(); majCalculs(); });
    // En dessin libre, l'étiquette sur la grille est rafraîchie à la validation de la valeur.
    ed.addEventListener('change', function (ev) { if (labo.mode === 'libre' && ev.target.closest('.props')) majEditeur(); });
    document.getElementById('l-regime').addEventListener('change', function (ev) { labo.regime = ev.target.value; majBarreLabo(); majEditeur(); majCalculs(); });
    document.getElementById('l-V').addEventListener('input', function (ev) { labo.V = PE.lire(ev.target.value); majCalculs(); });
    document.getElementById('l-f').addEventListener('input', function (ev) { labo.f = PE.lire(ev.target.value); majCalculs(); });
    document.getElementById('l-niveau').addEventListener('change', function (ev) { labo.niveau = Number(ev.target.value); sauver(); });
    document.getElementById('l-alea').addEventListener('click', function () {
      const c = K.aleatoire(labo.niveau, labo.regime);
      ouvrirDansLabo(c);
      majBarreLabo(); majEditeur(); majCalculs();
    });
    document.querySelector('.onglets').addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-mode]');
      if (!b) return;
      labo.mode = b.dataset.mode;
      majEditeur(); majCalculs();
    });
    const zone = document.getElementById('l-calculs');
    zone.addEventListener('change', function (ev) {
      const p = ev.target.dataset.param;
      if (!p) return;
      labo.params[p] = PE.lire(ev.target.value);
      majCalculs();
    });
    zone.addEventListener('toggle', function (ev) {
      if (ev.target.dataset && ev.target.dataset.id) { labo.fermes[ev.target.dataset.id] = !ev.target.open; sauver(); }
    }, true);
  }

  // ================= Exercices =================
  const NIVEAUX = { 1: 'Facile', 2: 'Moyen', 3: 'Difficile' };
  const AIDES = { 1: 'Guidé — formules utiles affichées', 2: 'Formulaire — à toi de choisir', 3: 'Examen — aucune formule' };

  function options(obj, sel) {
    return Object.keys(obj).map(function (k) { return '<option value="' + k + '"' + (String(sel) === k ? ' selected' : '') + '>' + obj[k] + '</option>'; }).join('');
  }

  function pageExercices() {
    return '<h1>Exercices</h1><p class="intro">Deux réglages indépendants : la difficulté de l\'exercice (schéma et questions) et l\'aide apportée sur les formules.</p>' +
      '<section class="carte"><div class="barre">' +
      '<label>Schéma <select id="e-source">' + options({ alea: 'Aléatoire', labo: 'Mon schéma (laboratoire)', td: 'Problème type TD' }, exo.source) + '</select></label>' +
      '<label id="e-regime-wrap">Régime <select id="e-regime">' + options({ AC: 'Sinusoïdal', DC: 'Continu (t = 0⁺ et t → ∞)' }, exo.regime) + '</select></label>' +
      '<label>Difficulté <select id="e-niveau">' + options(NIVEAUX, exo.niveau) + '</select></label>' +
      '<label>Formules <select id="e-aide">' + options(AIDES, exo.aide) + '</select></label>' +
      '<button id="e-nouveau" class="primaire">Nouvel exercice</button></div>' +
      '<p class="discret" id="e-info"></p><p id="e-score" class="score"></p></section><div id="e-zone"></div>';
  }

  function majScore() {
    document.getElementById('e-score').innerHTML = 'Réussite au premier essai — ' + [1, 2, 3].map(function (n) {
      const s = stats[n] || { n: 0, ok: 0 };
      return NIVEAUX[n] + ' : <strong>' + s.ok + '/' + s.n + '</strong>';
    }).join(' · ') + ' <button class="lien" id="e-raz">Remettre à zéro</button>';
  }

  function questionHTML(i) {
    const qn = exercice.questions[i], e = etats[i];
    let h = '<div class="q-texte">' + qn.texte + '</div>';
    if (exo.aide === 1 && qn.formules.length) {
      const fs = qn.formules.map(function (id) { return PE.formules[id]; }).filter(Boolean);
      if (fs.length) h += '<div class="aide-formules"><span class="discret">Formules utiles :</span> ' + fs.map(function (f) {
        return '<span class="pilule" title="' + PE.esc(f.nom) + '">' + PE.math(f.expr) + '</span>';
      }).join(' ') + '</div>';
    }
    h += '<div class="reponse"><input type="text" inputmode="decimal" autocomplete="off" data-q="' + i + '" value="' + PE.esc(e.saisie) + '" aria-label="Réponse à la question ' + (i + 1) + '"' +
      (e.statut === 'juste' ? ' disabled' : '') + '><span class="unite">' + (qn.uniteAff || 'sans unité') + '</span>' +
      '<button data-verif="' + i + '"' + (e.statut === 'juste' ? ' disabled' : '') + '>Vérifier</button>' +
      '<button class="lien" data-corr="' + i + '">' + (e.vu ? 'Masquer la correction' : 'Voir la correction') + '</button></div>';
    if (e.statut === 'juste') h += '<p class="ok">✓ Juste' + (e.essais > 1 ? ' (au ' + e.essais + 'ᵉ essai)' : '') + '</p>';
    else if (e.statut === 'faux') h += '<p class="ko">✗ Ce n\'est pas ça. Vérifie l\'unité demandée et les arrondis (tolérance : 2 %).</p>';
    else if (e.statut === 'invalide') h += '<p class="ko">Saisis un nombre (exemple : 12,5).</p>';
    if (e.vu) h += '<div class="correction">' + qn.correction + '<p class="resultat">Réponse : ' + PE.num(qn.attendu) + ' ' + qn.uniteAff + '</p></div>';
    return h;
  }

  function majExercice() {
    const zone = document.getElementById('e-zone');
    if (!exercice) { zone.innerHTML = ''; return; }
    if (exercice.erreur) {
      zone.innerHTML = '<section class="carte"><p class="alerte">' + PE.esc(exercice.erreur) + '</p>' +
        (exo.source === 'labo' ? '<p><a href="#labo">Ouvrir le laboratoire pour corriger le schéma →</a></p>' : '') + '</section>';
      return;
    }
    const ch = PE.cours.find(function (c) { return c.id === exercice.chapitre; });
    zone.innerHTML = '<section class="carte exercice"><span class="tag">' + NIVEAUX[exo.niveau] + (ch ? ' · ' + nomChapitre(ch) : '') + '</span><h2>' + exercice.titre + '</h2>' +
      exercice.enonce + (exercice.circuit ? '<div class="schema-wrap">' + PE.dessin.circuit(exercice.circuit, exercice.dessin) + '</div>' : '') +
      (exo.aide === 2 ? '<details class="formulaire-exo"><summary>Formulaire</summary>' + coursChoisis().map(function (c) { return tableFormules(c.formules || []); }).join('') + '</details>' : '') +
      '<ol class="questions">' + exercice.questions.map(function (_, i) { return '<li id="q-' + i + '">' + questionHTML(i) + '</li>'; }).join('') + '</ol>' +
      '<div class="barre"><button id="e-tout">Voir toute la correction</button>' +
      (exercice.solution ? '<button id="e-detail">Détail complet des calculs</button>' : '') + '</div><div id="e-detail-zone"></div></section>';
  }

  function nouvelExercice() {
    const cles = clesChoisies();
    if (!cles.length) exercice = { erreur: 'Aucun chapitre n\'est coché : choisis dans le volet de gauche les chapitres que tu étudies.' };
    else if (exo.source === 'td') exercice = PE.exercices.probleme(exo.niveau, cles);
    else if (exo.source === 'labo') {
      const r = circuitLabo();
      exercice = r.erreurs.length ? { erreur: 'Ton schéma du laboratoire n\'est pas utilisable : ' + r.erreurs[0] } : PE.exercices.depuisCircuit(K.copier(r.circuit), exo.niveau, cles);
    } else exercice = PE.exercices.aleatoire(exo.niveau, exo.regime, cles);
    etats = (exercice.questions || []).map(function () { return { saisie: '', statut: null, essais: 0, vu: false, compte: false }; });
    majExercice();
  }

  function verifier(i) {
    const e = etats[i], input = document.querySelector('input[data-q="' + i + '"]');
    e.saisie = input.value;
    const r = PE.exercices.verifier(exercice.questions[i], e.saisie);
    if (r === null) e.statut = 'invalide';
    else {
      e.essais++;
      e.statut = r ? 'juste' : 'faux';
      if (!e.compte) {
        e.compte = true;
        const s = stats[exo.niveau] = stats[exo.niveau] || { n: 0, ok: 0 };
        s.n++;
        if (r && !e.vu) s.ok++;
        ecrireStock('pe-stats', stats);
        majScore();
      }
    }
    document.getElementById('q-' + i).innerHTML = questionHTML(i);
    if (e.statut !== 'juste') { const n = document.querySelector('input[data-q="' + i + '"]'); n.focus(); n.select(); }
    else { const suivant = document.querySelector('input[data-q="' + (i + 1) + '"]'); if (suivant && !suivant.disabled) suivant.focus(); }
  }

  function majInfoExo() {
    document.getElementById('e-regime-wrap').hidden = exo.source !== 'alea';
    document.getElementById('e-info').innerHTML = exo.source === 'labo'
      ? 'L\'exercice portera sur le schéma actuellement construit dans le <a href="#labo">laboratoire</a> (blocs ou dessin libre).'
      : exo.source === 'td' ? 'Problèmes inspirés des TD, avec des valeurs tirées au hasard.' : 'Le schéma et les valeurs sont tirés au hasard selon la difficulté.';
  }

  function attacherExercices() {
    majInfoExo(); majScore();
    [['e-source', 'source', false], ['e-regime', 'regime', false], ['e-niveau', 'niveau', true], ['e-aide', 'aide', true]].forEach(function (d) {
      document.getElementById(d[0]).addEventListener('change', function (ev) {
        exo[d[1]] = d[2] ? Number(ev.target.value) : ev.target.value;
        sauver(); majInfoExo();
        if (d[1] === 'aide') { etats.forEach(function (e, i) { const inp = document.querySelector('input[data-q="' + i + '"]'); if (inp) e.saisie = inp.value; }); majExercice(); }
        else nouvelExercice();
      });
    });
    document.getElementById('e-nouveau').addEventListener('click', nouvelExercice);
    vue.addEventListener('click', clicExercices);
    vue.addEventListener('keydown', toucheExercices);
    nouvelExercice();
  }
  function clicExercices(ev) {
    const t = ev.target;
    if (t.dataset.verif !== undefined) verifier(Number(t.dataset.verif));
    else if (t.dataset.corr !== undefined) {
      const i = Number(t.dataset.corr);
      const inp = document.querySelector('input[data-q="' + i + '"]');
      etats[i].saisie = inp.value;
      etats[i].vu = !etats[i].vu;
      document.getElementById('q-' + i).innerHTML = questionHTML(i);
    } else if (t.id === 'e-tout') {
      etats.forEach(function (e, i) { const inp = document.querySelector('input[data-q="' + i + '"]'); e.saisie = inp.value; e.vu = true; document.getElementById('q-' + i).innerHTML = questionHTML(i); });
    } else if (t.id === 'e-detail') {
      const z = document.getElementById('e-detail-zone');
      const etaitFerme = labo.fermes; labo.fermes = {};
      z.innerHTML = z.innerHTML ? '' : sectionsHTML({ c: exercice.circuit, s: exercice.solution, params: { cosCible: 0.95 } });
      labo.fermes = etaitFerme;
    } else if (t.id === 'e-raz') {
      stats = { 1: { n: 0, ok: 0 }, 2: { n: 0, ok: 0 }, 3: { n: 0, ok: 0 } };
      ecrireStock('pe-stats', stats); majScore();
    }
  }
  function toucheExercices(ev) {
    if (ev.key === 'Enter' && ev.target.dataset.q !== undefined) verifier(Number(ev.target.dataset.q));
  }

  // ================= Navigation =================
  // garderDefilement : vrai quand on redessine la page après un changement dans le volet.
  function afficher(garderDefilement) {
    const h = (location.hash || '#cours').slice(1).split('/');
    const page = h[0] || 'cours';
    vue.removeEventListener('click', clicExercices);
    vue.removeEventListener('keydown', toucheExercices);
    document.querySelectorAll('header nav a').forEach(function (a) {
      const actif = a.getAttribute('href') === '#' + page;
      a.classList.toggle('actif', actif);
      if (actif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (page === 'labo') { vue.innerHTML = pageLabo(); attacherLabo(); }
    else if (page === 'exercices') { vue.innerHTML = pageExercices(); attacherExercices(); }
    else if (page === 'formulaire') vue.innerHTML = pageFormulaire();
    else vue.innerHTML = pageCours(h[1]);
    if (garderDefilement !== true) { window.scrollTo(0, 0); fermerVoletMobile(); }
  }

  // ================= Volet de gauche =================
  const page = document.querySelector('.page');
  const mobile = window.matchMedia('(max-width: 899px)');
  function voletOuvert() { return mobile.matches ? page.classList.contains('volet-mobile') : !page.classList.contains('volet-replie'); }
  function majBoutonVolet() { document.getElementById('volet-bouton').setAttribute('aria-expanded', voletOuvert()); }
  function fermerVoletMobile() { page.classList.remove('volet-mobile'); majBoutonVolet(); }
  if (lireStock('pe-volet-replie', false)) page.classList.add('volet-replie');
  document.getElementById('volet-bouton').addEventListener('click', function () {
    if (mobile.matches) page.classList.toggle('volet-mobile');
    else { page.classList.toggle('volet-replie'); ecrireStock('pe-volet-replie', page.classList.contains('volet-replie')); }
    majBoutonVolet();
  });
  document.getElementById('volet-fond').addEventListener('click', fermerVoletMobile);
  mobile.addEventListener('change', fermerVoletMobile);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && page.classList.contains('volet-mobile')) fermerVoletMobile(); });

  const liste = document.getElementById('volet-liste');
  liste.innerHTML = '<div class="volet-tete"><strong>Chapitres étudiés</strong>' +
    '<span class="volet-tout"><button class="lien" data-tout="1">Tout cocher</button> · <button class="lien" data-tout="0">Aucun</button></span></div>' +
    '<input type="search" id="volet-recherche" placeholder="Rechercher une partie…" aria-label="Rechercher un chapitre ou une partie" autocomplete="off">' +
    '<div id="volet-arbre"></div>';
  document.getElementById('volet-recherche').addEventListener('input', function (ev) {
    recherche = sansAccent(ev.target.value.trim());
    majVolet();
  });
  liste.addEventListener('change', function (ev) {
    const c = ev.target;
    // Case d'une année, d'un chapitre (à moitié cochée ou vide → tout cocher ; pleine → tout décocher) ou d'une partie.
    if (c.dataset.annee) {
      const chs = PE.cours.filter(function (x) { return String(PE.annee(x)) === c.dataset.annee; });
      const pleine = chs.every(function (x) { return partiesChoisies(x).length === x.sections.length; });
      chs.forEach(function (x) { cocherChapitre(x, !pleine); });
      changerSelection();
      return;
    }
    const ch = PE.cours.find(function (x) { return x.id === c.dataset.ch; });
    if (!ch) return;
    if (c.dataset.partie !== undefined) cocherPartie(ch, Number(c.dataset.partie), c.checked);
    else cocherChapitre(ch, partiesChoisies(ch).length < ch.sections.length);
    changerSelection();
  });
  liste.addEventListener('click', function (ev) {
    const p = ev.target.closest('[data-plier]');
    if (p) {
      if (recherche) return; // pendant une recherche, tout ce qui correspond reste déplié
      ouverts[p.dataset.plier] = !ouverts[p.dataset.plier];
      if (!ouverts[p.dataset.plier]) delete ouverts[p.dataset.plier];
      ecrireStock('pe-volet-ouverts', ouverts);
      majVolet();
      return;
    }
    const b = ev.target.closest('[data-tout]');
    if (!b) return;
    PE.cours.forEach(function (ch) { cocherChapitre(ch, b.dataset.tout === '1'); });
    changerSelection();
  });
  majVolet();
  majBoutonVolet();

  // Liens internes (sommaires) et boutons « ouvrir dans le laboratoire »
  document.addEventListener('click', function (ev) {
    const v = ev.target.closest('[data-vers]');
    if (v) {
      ev.preventDefault();
      const cible = document.getElementById(v.dataset.vers);
      if (cible) { if (cible.tagName === 'DETAILS') cible.open = true; cible.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      return;
    }
    const s = ev.target.closest('[data-schema]');
    if (s) ouvrirDansLabo(schemasCours[Number(s.dataset.schema)]);
  });

  // Thème clair / sombre
  const racine = document.documentElement;
  const theme = lireStock('pe-theme', null);
  if (theme) racine.dataset.theme = theme;
  document.getElementById('theme').addEventListener('click', function () {
    const sombre = racine.dataset.theme ? racine.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    racine.dataset.theme = sombre ? 'light' : 'dark';
    ecrireStock('pe-theme', racine.dataset.theme);
  });

  window.addEventListener('hashchange', afficher);
  afficher();
})();
