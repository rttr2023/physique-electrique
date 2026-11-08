// Ampéria — interface HTML par-dessus le canvas : barre d'état, dialogues, fenêtres, menu, messages.
(function () {
  'use strict';
  const AMP = window.AMP;
  const UI = AMP.ui = {};
  const $ = function (s) { return document.querySelector(s); };

  UI.ouvert = function () { return !!(UI.dialogueActif || UI.fenetreActive); };

  // ---------- Barre d'état ----------
  UI.majHud = function () {
    const e = AMP.etat;
    if (!e) return;
    const obj = document.getElementById('objectif');
    if (obj) { const t = AMP.monde.objectif ? AMP.monde.objectif() : ''; obj.textContent = t ? '➤ ' + t : ''; obj.hidden = !t || AMP.scene !== 'monde'; }
    const max = AMP.prog.chargeMax(), emax = AMP.prog.energieMax();
    const lieu = AMP.monde.regionCourante ? AMP.monde.regionCourante() : null;
    $('#hud').innerHTML =
      '<div class="hud-g"><span class="hud-nom">' + AMP.esc(e.nom || '…') + '</span> <span class="hud-niv">Niv. ' + e.niveau + '</span>' +
      '<div class="jauge xp" title="Expérience"><i style="width:' + Math.round(100 * e.xp / AMP.prog.xpPourNiveau(e.niveau)) + '%"></i></div>' +
      '<div class="jauge charge" title="Charge : ' + e.charge + ' / ' + max + '"><i style="width:' + Math.round(100 * e.charge / max) + '%"></i><b>⚡ ' + e.charge + '/' + max + '</b></div>' +
      '<span class="energie" title="Énergie (compétences)">' + '◆'.repeat(Math.min(e.energie, emax)) + '<s>' + '◆'.repeat(Math.max(0, emax - e.energie)) + '</s></span></div>' +
      '<div class="hud-d">' + (AMP.monde.estLibre && AMP.monde.estLibre() ? '<span class="hud-lieu">' + AMP.esc(AMP.donnees.libre.nom) + ' · niv. ' + AMP.monde.niveauLibre() + '</span>' : lieu ? '<span class="hud-lieu">' + AMP.esc(lieu.nom) + ' · ' + Math.round(100 * AMP.srs.maitrise(lieu.ch.id)) + ' %</span>' : '<span class="hud-lieu">' + AMP.esc(AMP.donnees.village.nom) + '</span>') +
      '<button class="hud-btn" data-ui="codex" title="Grimoire (C)">📖</button><button class="hud-btn" data-ui="menu" title="Menu (Échap)">☰</button></div>';
  };
  document.addEventListener('click', function (ev) {
    const b = ev.target.closest('[data-ui]');
    if (!b) return;
    if (b.dataset.ui === 'codex') AMP.codex.ouvrir();
    if (b.dataset.ui === 'menu') UI.menu();
  });

  // ---------- Messages éphémères ----------
  UI.toast = function (html, classe, duree) {
    const t = document.createElement('div');
    t.className = 'toast ' + (classe || '');
    t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(function () { t.classList.add('fin'); }, duree || 2600);
    setTimeout(function () { t.remove(); }, (duree || 2600) + 500);
  };
  UI.banniere = function (titre, sous) {
    const b = $('#banniere');
    b.innerHTML = '<strong>' + AMP.esc(titre) + '</strong>' + (sous ? '<span>' + AMP.esc(sous) + '</span>' : '');
    b.classList.remove('vue'); void b.offsetWidth; b.classList.add('vue');
  };

  // ---------- Dialogues (boîte en bas de l'écran) ----------
  // pages : [{ nom, html }] ; fin : appelée après la dernière page.
  UI.dialogue = function (pages, fin) {
    UI.dialogueActif = { pages: pages, i: 0, fin: fin };
    AMP.entree.vider();
    afficherPage();
  };
  function afficherPage() {
    const d = UI.dialogueActif, p = d.pages[d.i], el = $('#dialogue');
    el.hidden = false;
    el.innerHTML = (p.nom ? '<div class="d-nom">' + AMP.esc(p.nom) + '</div>' : '') + '<div class="d-texte">' + p.html + '</div>' +
      '<div class="d-suite">' + (d.i < d.pages.length - 1 ? '▼ ' + (d.i + 1) + '/' + d.pages.length : '✕') + '</div>';
    el.scrollTop = 0;
    AMP.audio.jouer('blip');
  }
  UI.dialogueSuite = function () {
    const d = UI.dialogueActif;
    if (!d) return;
    if (d.i < d.pages.length - 1) { d.i++; afficherPage(); return; }
    $('#dialogue').hidden = true;
    UI.dialogueActif = null;
    AMP.entree.vider();
    if (d.fin) d.fin();
  };
  $('#dialogue').addEventListener('click', function (ev) { if (!ev.target.closest('a')) UI.dialogueSuite(); });

  // ---------- Fenêtres (menu, grimoire, options…) ----------
  UI.fenetre = function (titre, html, opts) {
    opts = opts || {};
    const f = $('#fenetre');
    f.hidden = false;
    f.className = opts.classe || '';
    f.innerHTML = '<div class="f-boite" role="dialog" aria-label="' + AMP.esc(titre) + '"><div class="f-tete"><h2>' + AMP.esc(titre) + '</h2>' +
      (opts.fermable === false ? '' : '<button class="f-fermer" aria-label="Fermer">✕</button>') + '</div><div class="f-corps">' + html + '</div></div>';
    UI.fenetreActive = { onFerme: opts.onFerme, fermable: opts.fermable !== false };
    const b = f.querySelector('.f-fermer');
    if (b) b.addEventListener('click', UI.fermer);
    AMP.entree.vider();
    return f.querySelector('.f-corps');
  };
  UI.fermer = function () {
    const a = UI.fenetreActive;
    $('#fenetre').hidden = true;
    $('#fenetre').innerHTML = '';
    UI.fenetreActive = null;
    AMP.entree.vider();
    if (a && a.onFerme) a.onFerme();
  };
  $('#fenetre').addEventListener('click', function (ev) {
    if (ev.target.id === 'fenetre' && UI.fenetreActive && UI.fenetreActive.fermable) UI.fermer();
  });

  // Touches quand une fenêtre ou un dialogue est ouvert. Renvoie true si la touche est consommée.
  UI.clavier = function (ev, k) {
    if (UI.fenetreActive) {
      if (k === 'Escape' && UI.fenetreActive.fermable) { UI.fermer(); return true; }
      return false; // laisser le clavier aux boutons de la fenêtre
    }
    if (UI.dialogueActif) {
      if ([' ', 'Enter', 'e', 'Escape'].indexOf(k) >= 0 && !ev.repeat) { UI.dialogueSuite(); return true; }
      return true;
    }
    if (AMP.combat && AMP.combat.actif) return AMP.combat.clavier(ev, k);
    if (k === 'c' && !ev.repeat) { AMP.codex.ouvrir(); return true; }
    if ((k === 'Escape' || k === 'm') && !ev.repeat) { UI.menu(); return true; }
    return false;
  };

  // ---------- Menu ----------
  UI.menu = function () {
    if (AMP.combat && AMP.combat.actif) return;
    const corps = UI.fenetre('Menu', '<div class="menu">' +
      '<button data-m="reprendre">▶ Reprendre</button>' +
      '<button data-m="codex">📖 Grimoire</button>' +
      '<button data-m="carnet">📊 Carnet de chantier</button>' +
      '<button data-m="equipement">🎒 Équipement et compétences</button>' +
      '<button data-m="options">⚙ Options</button>' +
      '<button data-m="sauvegarde">💾 Sauvegarde</button>' +
      '<button data-m="aide">❔ Commandes</button>' +
      '<a class="bouton" href="../index.html">← Retour au cours</a></div>');
    corps.addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-m]');
      if (!b) return;
      const m = b.dataset.m;
      if (m === 'reprendre') UI.fermer();
      else if (m === 'codex') AMP.codex.ouvrir();
      else if (m === 'carnet') UI.carnet();
      else if (m === 'equipement') UI.equipement();
      else if (m === 'options') UI.options();
      else if (m === 'sauvegarde') UI.sauvegarde();
      else if (m === 'aide') UI.aide();
    });
    const premier = corps.querySelector('button'); if (premier) premier.focus();
  };

  UI.aide = function () {
    UI.fenetre('Commandes', '<table class="aide">' +
      '<tr><th></th><th>Clavier</th><th>Téléphone</th></tr>' +
      '<tr><td>Se déplacer</td><td>flèches, ZQSD ou WASD</td><td>croix (en bas à gauche)</td></tr>' +
      '<tr><td>Parler / agir</td><td>Espace, Entrée ou E</td><td>bouton A</td></tr>' +
      '<tr><td>Menu</td><td>Échap ou M</td><td>☰</td></tr>' +
      '<tr><td>Grimoire</td><td>C</td><td>📖</td></tr>' +
      '<tr><td>Répondre</td><td>1 à 4, ou saisie + Entrée</td><td>boutons et pavé numérique</td></tr></table>' +
      '<p>Parle aux habitants pour découvrir le cours. Les Parasites se cachent dans les herbes hautes. ' +
      'Les taches rouges qui grésillent sont des <strong>zones corrompues</strong> : ce que tu dois réviser. Marche dessus pour les purifier.</p>');
  };

  UI.carnet = function () {
    const e = AMP.etat, s = e.stats;
    const total = s.justes + s.fautes;
    let h = '<h3>Maîtrise par région</h3><div class="barres">';
    AMP.donnees.regions.forEach(function (r) {
      const m = Math.round(100 * AMP.srs.maitrise(r.ch.id));
      const rv = AMP.srs.aReviser(r.ch.id).length;
      const rg = e.regions[r.ch.id] && e.regions[r.ch.id].boss;
      h += '<div class="barre"><span>' + AMP.esc(r.nom) + (rg ? ' <em class="rang ' + rg + '">' + rg + '</em>' : '') + '</span><div class="jauge maitrise"><i style="width:' + m + '%"></i><b>' + m + ' %</b></div>' +
        (rv ? '<small>' + rv + ' à réviser</small>' : '') + '</div>';
    });
    h += '</div><h3>Précision par attaque</h3><table class="aide"><tr><th>Attaque</th><th>Justes</th><th>Erreurs</th><th>%</th></tr>';
    Object.keys(AMP.questions.TYPES).concat(['etape']).forEach(function (t) {
      const p = s.parType[t] || { j: 0, f: 0 };
      const n = p.j + p.f;
      h += '<tr><td>' + (t === 'etape' ? '👑 Étapes de boss' : AMP.questions.TYPES[t].icone + ' ' + AMP.questions.TYPES[t].nom) + '</td><td>' + p.j + '</td><td>' + p.f + '</td><td>' + (n ? Math.round(100 * p.j / n) + ' %' : '—') + '</td></tr>';
    });
    h += '</table>';
    const rates = Object.keys(e.elements).filter(function (id) { return AMP.donnees.items[id] && e.elements[id].ko > 0; })
      .sort(function (a, b) { return e.elements[b].ko - e.elements[a].ko; }).slice(0, 5);
    h += '<h3>Les 5 éléments les plus ratés</h3>' + (rates.length ? '<ol class="rates">' + rates.map(function (id) {
      const it = AMP.donnees.items[id];
      return '<li><button class="lien" data-codex="' + id + '">' + AMP.esc(it.el.nom || it.el.texte) + '</button> <small>(' + e.elements[id].ko + ' erreur' + (e.elements[id].ko > 1 ? 's' : '') + ')</small></li>';
    }).join('') + '</ol>' : '<p>Aucune erreur pour l\'instant.</p>');
    h += '<h3>Divers</h3><p>' + total + ' réponses (' + (total ? Math.round(100 * s.justes / total) : 0) + ' % justes) · ' + s.combats + ' combats · ' +
      Math.round(s.tempsJeu / 60) + ' min de jeu · ' + AMP.prog.serieJours() + ' jour(s) d\'affilée</p>';
    const corps = UI.fenetre('Carnet de chantier', h);
    corps.addEventListener('click', function (ev) { const b = ev.target.closest('[data-codex]'); if (b) AMP.codex.ouvrir({ id: b.dataset.codex }); });
  };

  UI.equipement = function () {
    const e = AMP.etat;
    let h = '<h3>Équipement</h3><ul class="equip">';
    Object.keys(AMP.prog.EQUIPEMENTS).forEach(function (k) {
      const q = AMP.prog.EQUIPEMENTS[k], a = AMP.prog.a(k);
      const r = AMP.donnees.regions.find(function (x) { return x.equipement === k; });
      h += '<li class="' + (a ? '' : 'manque') + '"><span>' + (a ? q.icone : '❓') + '</span><div><strong>' + (a ? AMP.esc(q.nom) : '???') + '</strong><br><small>' +
        (a ? AMP.esc(q.effet) : 'Récompense du Gardien de ' + AMP.esc(r ? r.nom : '?')) + '</small></div></li>';
    });
    h += '</ul><h3>Compétences (Énergie ◆)</h3><ul class="equip">';
    Object.keys(AMP.prog.COMPETENCES).forEach(function (k) {
      const c = AMP.prog.COMPETENCES[k], a = e.niveau >= c.niveau;
      h += '<li class="' + (a ? '' : 'manque') + '"><span>' + c.cout + '◆</span><div><strong>' + AMP.esc(c.nom) + '</strong><br><small>' + AMP.esc(c.effet) + (a ? '' : ' — niveau ' + c.niveau) + '</small></div></li>';
    });
    UI.fenetre('Équipement et compétences', h + '</ul><p class="q-petit">L\'Énergie se recharge d\'1 ◆ à chaque bonne réponse, et entièrement au Poste Source.</p>');
  };

  UI.options = function () {
    const o = AMP.etat.options;
    const coche = function (k, label, aide) {
      return '<label class="option"><input type="checkbox" data-o="' + k + '"' + (o[k] ? ' checked' : '') + '> <span>' + label + (aide ? '<small>' + aide + '</small>' : '') + '</span></label>';
    };
    let h = coche('sons', 'Sons') + coche('musique', 'Musique') + coche('animations', 'Animations', 'Désactive les éclairs et clignotements si tu y es sensible.') +
      coche('horsCours', 'Inclure les éléments « hors cours »', 'Formules ajoutées hors des polycopiés (badge « hors cours »), comme V = V<sub>max</sub>/√2.') +
      coche('chrono', 'Mode chrono', '30 s par question (60 s pour un calcul), dégâts doublés. Pour s\'entraîner aux conditions d\'examen.') +
      '<label class="option"><span>Taille du texte</span><select data-o="texte"><option value="petit">Petite</option><option value="normal">Normale</option><option value="grand">Grande</option></select></label>' +
      coche('test', 'Mode test', 'Affiche des outils pour essayer le jeu (avancer le temps).');
    if (o.test) {
      h += '<div class="test"><p>Date du jeu : jour +' + AMP.etat.decalageJours + '</p><button data-t="1">Avancer d\'1 jour</button> <button data-t="7">Avancer de 7 jours</button> <button data-t="30">Avancer de 30 jours</button> <button data-t="0">Revenir à aujourd\'hui</button></div>';
    }
    const corps = UI.fenetre('Options', h);
    corps.querySelector('[data-o="texte"]').value = o.texte;
    corps.addEventListener('change', function (ev) {
      const k = ev.target.dataset.o;
      if (!k) return;
      o[k] = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
      if (k === 'horsCours') { AMP.options.horsCours = o.horsCours; AMP.indexer(); AMP.monde.recharger(); }
      if (k === 'texte') document.documentElement.dataset.texte = o.texte;
      if (k === 'musique') { AMP.audio.musique(null); if (o.musique) AMP.audio.musique(AMP.audio.lieuCourant); }
      if (k === 'animations') document.documentElement.classList.toggle('sans-anim', !o.animations);
      AMP.sauvegarde.sauver();
      if (k === 'test') UI.options();
    });
    corps.addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-t]');
      if (!b) return;
      const n = Number(b.dataset.t);
      AMP.etat.decalageJours = n ? AMP.etat.decalageJours + n : 0;
      AMP.decalageJours = AMP.etat.decalageJours;
      AMP.monde.recharger();
      AMP.sauvegarde.sauver();
      UI.options();
    });
  };

  UI.sauvegarde = function () {
    const corps = UI.fenetre('Sauvegarde', '<p>La partie est sauvegardée automatiquement dans ce navigateur.</p>' +
      '<p>Pour passer du PC au téléphone (ou garder une copie), exporte un fichier puis importe-le sur l\'autre appareil.</p>' +
      '<div class="menu"><button data-s="exporter">⬇ Exporter la sauvegarde</button>' +
      '<label class="bouton">⬆ Importer une sauvegarde<input type="file" accept=".json,application/json" hidden></label>' +
      '<button data-s="effacer" class="danger">🗑 Nouvelle partie (efface tout)</button></div><p class="message"></p>');
    const msg = corps.querySelector('.message');
    corps.addEventListener('click', function (ev) {
      const b = ev.target.closest('[data-s]');
      if (!b) return;
      if (b.dataset.s === 'exporter') AMP.sauvegarde.exporter();
      if (b.dataset.s === 'effacer') {
        if (b.dataset.confirme) { AMP.sauvegarde.effacer(); location.reload(); }
        else { b.dataset.confirme = '1'; b.textContent = '⚠ Clique encore pour tout effacer'; }
      }
    });
    corps.querySelector('input[type=file]').addEventListener('change', function (ev) {
      const f = ev.target.files[0];
      if (!f) return;
      AMP.sauvegarde.importer(f).then(function () { msg.textContent = 'Sauvegarde importée. Redémarrage…'; setTimeout(function () { location.reload(); }, 800); })
        .catch(function (e) { msg.textContent = 'Import impossible : ' + e.message; });
    });
  };
})();
