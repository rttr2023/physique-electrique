// Ampéria — exploration : village et régions, déplacements, habitants, portes, zones corrompues, rencontres.
(function () {
  'use strict';
  const AMP = window.AMP;
  const M = AMP.monde;
  const SP = AMP.sprites;
  const T = 16;                // taille d'une tuile en pixels
  const VITESSE = 6.5;         // tuiles par seconde
  const DIRS = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] };

  let lieu = null;             // { id: 'village' | id de chapitre, region }
  let carte = null;            // carte analysée (monde-donnees.js)
  let caches = null;           // images du décor : [image normale, image eau animée]
  let pnjs = [];               // habitants : { x, y, zone, ids, tenue, nom, dir }
  let corruption = [];         // zones corrompues : { x, y, ids }
  let portails = [];           // village : { x, y, region, ouvert }
  let zonesFinies = 0;
  let temps = 0;
  let pasDepuisCombat = 0;
  const J = { x: 0, y: 0, px: 0, py: 0, dir: 'bas', mouv: null, pas: 0 };

  M.regionCourante = function () { return lieu && lieu.region; };
  M.joueur = J;

  // ---------- Régions débloquées ----------
  M.debloquee = function (region) {
    if (region.index === 0) return true;
    const prec = AMP.donnees.regions[region.index - 1];
    const r = AMP.etat.regions[prec.ch.id];
    return !!(r && r.restauree) || AMP.srs.maitrise(prec.ch.id) >= 0.6;
  };
  M.restauree = function (chId) { const r = AMP.etat.regions[chId]; return !!(r && r.restauree); };

  // Éléments qu'on peut demander en combat : découverts et avec au moins une attaque possible.
  M.interrogeables = function (chId) {
    return (AMP.donnees.parChapitre[chId] || []).filter(function (it) {
      return AMP.srs.decouvert(it.id) && AMP.questions.typesPossibles(it).length;
    }).map(function (it) { return it.id; });
  };

  // ---------- Entrer dans un lieu ----------
  // id : 'village' ou id de chapitre ; pos : { x, y, dir } facultatif.
  M.entrer = function (id, pos) {
    const D = AMP.donnees;
    const region = id === 'village' ? null : AMP.region(id);
    lieu = { id: id, region: region };
    const gabarit = region ? region.gabarit : 'village';
    carte = M.analyserCarte(D.cartes[gabarit]);
    construireCaches();
    placerObjets();
    const p = pos && pos.x != null ? pos : carte.depart;
    J.x = p.x; J.y = p.y; J.dir = (pos && pos.dir) || 'bas'; J.mouv = null;
    J.px = J.x * T; J.py = J.y * T;
    AMP.etat.lieu = { carte: id, x: J.x, y: J.y, dir: J.dir };
    if (!region) {
      AMP.prog.soigner();
      AMP.ui.banniere(D.village.nom, 'Batteries rechargées');
    } else {
      AMP.ui.banniere(region.nom, region.ch.titre + ' · maîtrise ' + Math.round(100 * AMP.srs.maitrise(region.ch.id)) + ' %');
    }
    AMP.ui.majHud();
    AMP.sauvegarde.sauver();
  };

  // Après un changement d'option (hors cours) ou de date : on recalcule sans bouger le joueur.
  M.recharger = function () {
    if (!lieu) return;
    placerObjets();
    construireCaches();
    AMP.ui.majHud();
  };

  function theme() { return (lieu.region ? lieu.region.theme : AMP.donnees.village.theme) || {}; }

  function construireCaches() {
    const th = theme(), cle = JSON.stringify(th);
    const w = carte.w * T, h = carte.h * T;
    const images = [0, 1].map(function (frame) {
      const c = SP.canvas(w, h), x = c.getContext('2d');
      carte.cases.forEach(function (t) {
        const variante = AMP.hacher(t.x + ',' + t.y) % 4;
        x.drawImage(SP.tuile(t.c, variante, th, frame, cle), t.x * T, t.y * T);
      });
      return c;
    });
    // Une région pas encore restaurée est sombre et presque sans couleur.
    caches = (lieu.region && !M.restauree(lieu.region.ch.id)) ? images.map(function (c) { return SP.desaturer(c, 0.7); }) : images;
  }

  function placerObjets() {
    pnjs = []; corruption = []; portails = [];
    const D = AMP.donnees;
    if (!lieu.region) {
      D.regions.forEach(function (r, i) {
        let pos = r.portail && carte.portails[r.portail];
        if (!pos && carte.chantiers[i - 6]) pos = carte.chantiers[i - 6]; // régions 7 et 8 : sur les chantiers
        if (pos) portails.push({ x: pos.x, y: pos.y, region: r, ouvert: M.debloquee(r) });
      });
      zonesFinies = 0;
      return;
    }
    // Les éléments du chapitre sont répartis entre les habitants, dans l'ordre du cours.
    const slots = carte.pnj.slice().sort(function (a, b) { return a.zone - b.zone || a.y - b.y || a.x - b.x; });
    const items = D.parChapitre[lieu.region.ch.id] || [];
    const prenoms = D.dialogues.prenoms;
    slots.forEach(function (s, i) {
      const a = Math.floor(i * items.length / slots.length), b = Math.floor((i + 1) * items.length / slots.length);
      const h = AMP.hacher(lieu.region.ch.id + i);
      pnjs.push({ x: s.x, y: s.y, zone: s.zone, ids: items.slice(a, b).map(function (it) { return it.id; }), tenue: 1 + h % (SP.TENUES.length - 1), nom: prenoms[h % prenoms.length], dir: 'bas' });
    });
    zonesFinies = calculerZones();
    majCorruption();
  }

  // Zones terminées : toutes les zones consécutives depuis 0 dont les habitants ont tout transmis.
  function calculerZones() {
    let n = 0;
    for (let z = 0; z < carte.nbZones; z++) {
      const ok = pnjs.filter(function (p) { return p.zone === z; }).every(function (p) { return p.ids.every(AMP.srs.decouvert); });
      if (!ok) break;
      n++;
    }
    return n;
  }
  M.zonesFinies = function () { return zonesFinies; };

  // ---------- Zones corrompues ----------
  function majCorruption() {
    corruption = [];
    if (!lieu.region) return;
    const retard = AMP.srs.aReviser(lieu.region.ch.id).filter(function (id) { return AMP.questions.typesPossibles(AMP.donnees.items[id]).length; });
    if (!retard.length) return;
    const n = Math.min(5, Math.ceil(retard.length / 2));
    const candidates = carte.cases.filter(function (t) {
      if (t.c !== '.' && t.c !== ',' && t.c !== '+') return false;
      const z = carte.zoneDe[t.y * carte.w + t.x];
      if (z < 0 || z > zonesFinies) return false;
      return Math.abs(t.x - carte.depart.x) + Math.abs(t.y - carte.depart.y) > 3 && !pnjs.some(function (p) { return Math.abs(p.x - t.x) + Math.abs(p.y - t.y) < 2; });
    });
    const pris = {};
    for (let k = 0; k < n && candidates.length; k++) {
      const ids = retard.slice(k * 2, k * 2 + 2);
      let i = AMP.hacher(ids[0]) % candidates.length;
      while (pris[i]) i = (i + 1) % candidates.length;
      pris[i] = true;
      corruption.push({ x: candidates[i].x, y: candidates[i].y, ids: ids });
    }
  }
  M.majCorruption = function () { if (lieu) { majCorruption(); } };

  // ---------- Mise à jour ----------
  M.update = function (dt) {
    temps += dt;
    if (AMP.ui.ouvert()) return;
    AMP.entree.prendre().forEach(function (a) {
      if (a === 'A' && !J.mouv) interagir();
      if (a === 'menu') AMP.ui.menu();
      if (a === 'codex') AMP.codex.ouvrir();
    });
    if (AMP.ui.ouvert()) return;
    if (J.mouv) {
      J.mouv.t += dt * VITESSE;
      const t = Math.min(1, J.mouv.t);
      J.px = (J.mouv.x0 + (J.x - J.mouv.x0) * t) * T;
      J.py = (J.mouv.y0 + (J.y - J.mouv.y0) * t) * T;
      if (t >= 1) { J.mouv = null; J.pas = 1 - J.pas; arriver(); }
      return;
    }
    const d = AMP.entree.direction();
    if (!d) return;
    J.dir = d;
    const nx = J.x + DIRS[d][0], ny = J.y + DIRS[d][1];
    if (libre(nx, ny)) {
      J.mouv = { x0: J.x, y0: J.y, t: 0 };
      J.prec = { x: J.x, y: J.y };
      J.x = nx; J.y = ny;
    }
  };

  function libre(x, y) {
    if (carte.solide(x, y, zonesFinies)) return false;
    return !pnjs.some(function (p) { return p.x === x && p.y === y; });
  }

  function arriver() {
    pasDepuisCombat++;
    AMP.etat.lieu = { carte: lieu.id, x: J.x, y: J.y, dir: J.dir };
    const c = carte.at(J.x, J.y);
    // Village : portails.
    const portail = portails.find(function (p) { return p.x === J.x && p.y === J.y; });
    if (portail) {
      if (portail.ouvert) { transition(function () { M.entrer(portail.region.ch.id); }); }
      else {
        AMP.ui.dialogue([{ nom: portail.region.nom, html: AMP.esc(AMP.donnees.dialogues.portail_ferme) }], function () { reculer(); });
      }
      return;
    }
    if (c === 'E' && lieu.region) {
      const r = lieu.region;
      transition(function () {
        const p = carte && M.analyserCarte(AMP.donnees.cartes.village).portails[r.portail];
        M.entrer('village', p ? { x: p.x, y: p.y + 1, dir: 'bas' } : null);
      });
      return;
    }
    const cor = corruption.find(function (z) { return z.x === J.x && z.y === J.y; });
    if (cor) { lancerCombat('corruption', cor.ids); return; }
    if (c === ',' && lieu.region && pasDepuisCombat > 3 && AMP.alea() < 0.13 && M.interrogeables(lieu.region.ch.id).length) {
      lancerCombat('rencontre', []);
      return;
    }
    AMP.sauvegarde.sauver();
  }
  function reculer() {
    if (!J.prec) return;
    J.x = J.prec.x; J.y = J.prec.y; J.px = J.x * T; J.py = J.y * T;
  }

  // Flash blanc entre deux lieux.
  function transition(suite) {
    AMP.audio.jouer('porte');
    AMP.jeu.flash(0.35, suite);
  }

  function lancerCombat(type, focus) {
    pasDepuisCombat = 0;
    AMP.entree.vider();
    AMP.audio.jouer('rencontre');
    const r = lieu.region;
    AMP.jeu.flash(0.3, function () {
      AMP.combat.lancer({ type: type, region: r, espece: AMP.choisir(r.parasites || ['court-jus']), focus: focus }, M.apresCombat);
    });
  }

  M.apresCombat = function (res) {
    if (res.defaite) {
      AMP.prog.soigner();
      M.entrer('village');
      AMP.ui.dialogue([{ nom: 'Mentor', html: AMP.esc(AMP.donnees.dialogues.defaite) }]);
      return;
    }
    if (res.boss) {
      AMP.monde.recharger();
      AMP.ui.banniere(lieu.region.nom, 'Région restaurée !');
    }
    majCorruption();
    AMP.ui.majHud();
    AMP.sauvegarde.sauver();
  };

  // ---------- Interactions (bouton A) ----------
  function interagir() {
    const tx = J.x + DIRS[J.dir][0], ty = J.y + DIRS[J.dir][1];
    const D = AMP.donnees;
    const p = pnjs.find(function (q) { return q.x === tx && q.y === ty; });
    if (p) { parler(p); return; }
    const c = carte.at(tx, ty);
    if (c === 'P' && lieu.region) {
      const ch = lieu.region.ch;
      AMP.ui.dialogue([{ nom: 'Pupitre', html: AMP.esc(D.dialogues.pupitre) + '<ul class="scans">' + ch.sources.map(function (f) {
        return '<li><a href="../Cours/' + encodeURIComponent(f) + '" target="_blank" rel="noopener">📄 ' + AMP.esc(f) + '</a></li>';
      }).join('') + '</ul>' }]);
      return;
    }
    if ('ABC'.indexOf(c) >= 0 && c && !carte.porteOuverte(c, zonesFinies)) { AMP.ui.dialogue([{ nom: 'Disjoncteur', html: AMP.esc(D.dialogues.porte_fermee) }]); return; }
    if (c === 'X' && !carte.porteOuverte('X', zonesFinies)) { AMP.ui.dialogue([{ nom: 'Porte du poste', html: AMP.esc(D.dialogues.porte_boss) }]); return; }
    if (c === 'K' && lieu.region) { gardien(); return; }
    if (c === 'n') { mentor(); return; }
    if (c === 'g') {
      const portail = portails.find(function (q) { return q.x === tx && q.y === ty; });
      if (portail) {
        if (portail.ouvert) transition(function () { M.entrer(portail.region.ch.id); });
        else AMP.ui.dialogue([{ nom: portail.region.nom, html: AMP.esc(D.dialogues.portail_ferme) }]);
        return;
      }
      const i = carte.chantiers.findIndex(function (q) { return q.x === tx && q.y === ty; });
      const ch = D.chantiers[i] || D.chantiers[0];
      AMP.ui.dialogue([{ nom: ch ? ch.nom : 'Chantier', html: AMP.esc(ch ? ch.texte : 'Chantier en cours.') }]);
      return;
    }
    if (c === 'H') { AMP.ui.dialogue([{ nom: 'Maison', html: 'Une maison du Poste Source. Ses habitants attendent le retour du courant.' }]); }
  }

  function parler(p) {
    const D = AMP.donnees;
    p.dir = { haut: 'bas', bas: 'haut', gauche: 'droite', droite: 'gauche' }[J.dir];
    const nouveaux = p.ids.filter(function (id) { return !AMP.srs.decouvert(id); });
    const salut = (nouveaux.length ? D.dialogues.salutations : D.dialogues.deja_vu);
    const pages = [{ nom: p.nom, html: AMP.esc(AMP.choisir(salut).replace('{nom}', AMP.etat.nom)) }];
    p.ids.forEach(function (id) {
      const it = D.items[id];
      let html;
      if (it.type === 'notion') html = '<strong>' + AMP.texte(it.el.nom) + '</strong> — ' + AMP.texte(it.el.definition);
      else if (it.type === 'formule') html = '<strong>' + AMP.texte(it.el.nom) + '</strong>' + AMP.questions.badges(it.el) + '<div class="formule-bloc">' + AMP.tex(it.el.latex, true) + '</div><span class="q-petit">' + AMP.texte(it.el.conditions || '') + '</span>';
      else html = '⚠ <strong>Attention :</strong> ' + AMP.texte(it.el.texte);
      pages.push({ nom: p.nom, html: html + (AMP.srs.decouvert(id) ? '' : ' <span class="nouveau">nouveau</span>') });
    });
    if (!p.ids.length) pages.push({ nom: p.nom, html: 'Je n\'ai rien d\'autre à t\'apprendre. Bonne route !' });
    AMP.ui.dialogue(pages, function () {
      let n = 0;
      p.ids.forEach(function (id) { if (AMP.srs.decouvrir(id)) n++; });
      if (n) { AMP.audio.jouer('decouverte'); AMP.ui.toast('📖 +' + n + ' dans le grimoire'); }
      const avant = zonesFinies;
      zonesFinies = calculerZones();
      if (zonesFinies > avant) {
        AMP.audio.jouer('porte');
        if (zonesFinies >= carte.nbZones) AMP.ui.banniere('La porte du poste s\'ouvre !', 'Le Gardien t\'attend.');
        else AMP.ui.banniere('Disjoncteur réarmé !', 'Une nouvelle zone est sous tension.');
        majCorruption();
      }
      AMP.ui.majHud();
      AMP.sauvegarde.sauver();
    });
  }

  function gardien() {
    const r = lieu.region, D = AMP.donnees;
    const deja = AMP.etat.regions[r.ch.id];
    const intro = deja && deja.restauree
      ? 'Le poste ronronne, sous tension. Le Gardien, apaisé, accepte un nouveau duel pour améliorer ton rang (actuel : ' + deja.boss + ').'
      : r.boss.nom + ' grésille de rage : « Personne ne rallumera ce poste ! Prouve que tu sais résoudre l\'exercice, étape par étape… »';
    AMP.ui.dialogue([{ nom: r.boss.nom, html: AMP.esc(intro) }], function () {
      const corps = AMP.ui.fenetre(r.boss.nom, '<p>Combat de boss : un exercice complet' + ((r.boss.exemples || []).length ? ' tiré du cours ou du TD' : '') + '. Les erreurs ne bloquent pas : la correction s\'affiche et on continue.</p>' +
        '<div class="menu"><button data-g="go">⚔ Combattre</button><button data-g="non">Plus tard</button></div>');
      corps.addEventListener('click', function (ev) {
        const b = ev.target.closest('[data-g]');
        if (!b) return;
        AMP.ui.fermer();
        if (b.dataset.g === 'go') {
          AMP.audio.jouer('rencontre');
          AMP.jeu.flash(0.4, function () { AMP.combat.lancer({ type: 'boss', region: r }, M.apresCombat); });
        }
      });
      corps.querySelector('button').focus();
    });
    void D;
  }

  function mentor() {
    const D = AMP.donnees, e = AMP.etat;
    let pages;
    if (!e.introVue) {
      pages = D.dialogues.mentor.map(function (t) { return { nom: 'Mentor', html: AMP.esc(t.replace('{nom}', e.nom)) }; });
    } else {
      const suivante = D.regions.find(function (r) { return !M.restauree(r.ch.id); });
      let reviser = 0; D.regions.forEach(function (r) { reviser += AMP.srs.aReviser(r.ch.id).length; });
      pages = [{ nom: 'Mentor', html: (reviser ? 'Tu as <strong>' + reviser + '</strong> élément(s) à réviser : regarde les zones corrompues sur les cartes. ' : 'Ton savoir est bien sous tension. ') +
        (suivante ? 'Prochaine étape : <strong>' + AMP.esc(suivante.nom) + '</strong>.' : 'Tout Ampéria est rallumé. Bravo ! Reviens réviser de temps en temps.') }];
    }
    AMP.ui.dialogue(pages, function () { if (!e.introVue) { e.introVue = true; AMP.sauvegarde.sauver(); } });
  }
  M.mentor = mentor;

  // ---------- Dessin ----------
  M.dessiner = function (ctx, W, H) {
    const camX = Math.round(Math.max(0, Math.min(carte.w * T - W, J.px + 8 - W / 2)));
    const camY = Math.round(Math.max(0, Math.min(carte.h * T - H, J.py + 8 - H / 2)));
    ctx.fillStyle = '#0b0e1a';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(caches[Math.floor(temps * 1.6) % 2], camX, camY, W, H, 0, 0, W, H);
    ctx.save();
    ctx.translate(-camX, -camY);
    const objets = [];
    const pousser = function (y, f) { objets.push({ y: y, f: f }); };

    carte.portes.forEach(function (p) { pousser(p.y * T, function () { dessinerPorte(ctx, p); }); });
    carte.maisons.forEach(function (m) { pousser(m.y * T + 40, function () { ctx.drawImage(SP.maisonCache || (SP.maisonCache = SP.maison()), m.x * T, m.y * T - 4); }); });
    if (carte.transfo) {
      const n = AMP.donnees.regions.filter(function (r) { return M.restauree(r.ch.id); }).length;
      pousser(carte.transfo.y * T + 28, function () {
        ctx.drawImage(SP.transfoCache && SP.transfoCache.n === n ? SP.transfoCache.c : (SP.transfoCache = { n: n, c: SP.transfo(n) }).c, carte.transfo.x * T, carte.transfo.y * T - 4);
        if (n && AMP.etat.options.animations) arc(ctx, carte.transfo.x * T + 8, carte.transfo.y * T - 2, carte.transfo.x * T + 24, carte.transfo.y * T - 2, '#3fd2d6', 2);
      });
    }
    portails.forEach(function (p) { pousser(p.y * T, function () { dessinerPortail(ctx, p); }); });
    if (carte.mentor) pousser(carte.mentor.y * T, function () { ctx.drawImage(SP.perso('bas', Math.floor(temps * 2) % 2 && 0, 5), carte.mentor.x * T, carte.mentor.y * T - 4); bulle(ctx, carte.mentor.x * T, carte.mentor.y * T, AMP.etat.introVue ? '…' : '!'); });
    pnjs.forEach(function (p) {
      pousser(p.y * T, function () {
        const bob = Math.floor(temps * 2 + p.x) % 2;
        ctx.drawImage(SP.perso(p.dir, 0, p.tenue), p.x * T, p.y * T - 4 - bob);
        if (p.ids.some(function (id) { return !AMP.srs.decouvert(id); })) bulle(ctx, p.x * T, p.y * T - bob, '!');
      });
    });
    if (lieu.region && carte.boss) {
      const b = carte.boss, apaise = M.restauree(lieu.region.ch.id);
      pousser(b.y * T, function () {
        const g = apaise ? (SP.gardienCalme || (SP.gardienCalme = SP.gardien({ q: 'e', r: 'g', d: 'g' }))) : (SP.gardienCache || (SP.gardienCache = SP.gardien()));
        const dy = apaise ? 0 : Math.round(Math.sin(temps * 3));
        ctx.drawImage(g, b.x * T - 4, b.y * T - 8 + dy);
        if (!apaise && AMP.etat.options.animations && Math.floor(temps * 8) % 5 === 0) arc(ctx, b.x * T + 4, b.y * T - 8, b.x * T + 12, b.y * T - 14, '#ff6b6b', 1);
      });
    }
    corruption.forEach(function (z) { pousser(z.y * T - 1, function () { dessinerCorruption(ctx, z); }); });
    pousser(J.py, function () {
      const pas = J.mouv ? (J.mouv.t < 0.5 ? J.pas : 1 - J.pas) : 0;
      ctx.drawImage(SP.perso(J.dir, J.mouv ? pas : 0, 0), Math.round(J.px), Math.round(J.py) - 4);
    });
    objets.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.f(); });
    ctx.restore();
  };

  function bulle(ctx, x, y, txt) {
    const dy = Math.round(Math.sin(temps * 5) * 1.5);
    ctx.fillStyle = '#0b0e1a'; ctx.fillRect(x + 5, y - 15 + dy, 7, 9);
    ctx.fillStyle = txt === '!' ? '#ffc65c' : '#9aa6bd'; ctx.fillRect(x + 6, y - 14 + dy, 5, 7);
    ctx.fillStyle = '#0b0e1a'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center'; ctx.fillText(txt, x + 8.5, y - 8 + dy);
  }

  // Petit arc électrique en zigzag entre deux points.
  function arc(ctx, x0, y0, x1, y1, couleur, epaisseur) {
    ctx.strokeStyle = couleur; ctx.lineWidth = epaisseur || 1;
    ctx.beginPath(); ctx.moveTo(x0, y0);
    const n = 5;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      ctx.lineTo(x0 + (x1 - x0) * t + (Math.random() - 0.5) * 5, y0 + (y1 - y0) * t + (Math.random() - 0.5) * 5);
    }
    ctx.lineTo(x1, y1); ctx.stroke();
  }
  M.arc = arc;

  function dessinerPorte(ctx, p) {
    const x = p.x * T, y = p.y * T, ouverte = carte.porteOuverte(p.lettre, zonesFinies);
    if (p.lettre === 'X') {
      if (ouverte) { ctx.fillStyle = '#141a2e'; ctx.fillRect(x + 1, y, 14, 16); ctx.fillStyle = '#ffc65c'; ctx.fillRect(x + 1, y, 14, 1); return; }
      ctx.fillStyle = '#2d3e63'; ctx.fillRect(x, y - 4, 16, 20);
      ctx.fillStyle = '#47597e'; ctx.fillRect(x + 1, y - 3, 14, 18);
      ctx.fillStyle = '#ffc65c';
      [[8, 0], [7, 1], [6, 2], [5, 3], [6, 4], [7, 4], [8, 4], [9, 4], [8, 5], [7, 6], [6, 7], [5, 8]].forEach(function (q) { ctx.fillRect(x + q[0] + 1, y + q[1] + 1, 1, 1); });
      return;
    }
    ctx.fillStyle = '#47597e'; ctx.fillRect(x, y - 6, 3, 22); ctx.fillRect(x + 13, y - 6, 3, 22);
    ctx.fillStyle = '#6b7a99'; ctx.fillRect(x + 1, y - 6, 1, 22); ctx.fillRect(x + 14, y - 6, 1, 22);
    ctx.fillStyle = ouverte ? '#6cc04a' : '#ff6b6b'; ctx.fillRect(x, y - 8, 3, 2); ctx.fillRect(x + 13, y - 8, 3, 2);
    if (!ouverte) {
      // Champ électrique infranchissable entre les deux poteaux.
      ctx.globalAlpha = 0.85;
      for (let k = 0; k < 3; k++) arc(ctx, x + 3, y - 2 + k * 6, x + 13, y - 2 + k * 6 + (Math.random() - 0.5) * 3, k % 2 ? '#3fd2d6' : '#b5fff6', 1);
      ctx.globalAlpha = 1;
    }
  }

  function dessinerPortail(ctx, p) {
    const x = p.x * T + 8, y = p.y * T + 8;
    const couleur = p.ouvert ? { tension: '#ffc65c', courant: '#3fd2d6', puissance: '#a77de6' }[p.region.couleur] || '#3fd2d6' : '#47597e';
    ctx.fillStyle = '#0b0e1a'; ctx.beginPath(); ctx.ellipse(x, y + 2, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = couleur; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 2, 8, 5, 0, 0, Math.PI * 2); ctx.stroke();
    if (p.ouvert) {
      if (AMP.etat.options.animations) for (let k = 0; k < 2; k++) arc(ctx, x - 6 + Math.random() * 12, y + 2, x - 3 + Math.random() * 6, y - 10, couleur, 1);
      if (M.restauree(p.region.ch.id)) { ctx.fillStyle = '#ffc65c'; ctx.fillRect(x - 1, y - 14, 3, 3); }
    } else {
      ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 3, y - 1); ctx.lineTo(x + 3, y + 5); ctx.moveTo(x + 3, y - 1); ctx.lineTo(x - 3, y + 5); ctx.stroke();
    }
    // Nom de la région quand on est tout près.
    if (Math.abs(J.x - p.x) + Math.abs(J.y - p.y) <= 2) {
      ctx.font = '7px monospace'; ctx.textAlign = 'center';
      const w = ctx.measureText(p.region.nom).width + 6;
      ctx.fillStyle = 'rgba(11,14,26,.85)'; ctx.fillRect(x - w / 2, y - 24, w, 10);
      ctx.fillStyle = p.ouvert ? '#f3e6c8' : '#9aa6bd'; ctx.fillText(p.region.nom, x, y - 16);
    }
  }

  function dessinerCorruption(ctx, z) {
    const x = z.x * T, y = z.y * T;
    const anim = AMP.etat.options.animations;
    ctx.fillStyle = 'rgba(92,16,32,.55)'; ctx.fillRect(x + 1, y + 1, 14, 14);
    for (let k = 0; k < 9; k++) {
      const r = anim ? Math.random() : ((k * 37) % 13) / 13;
      ctx.fillStyle = ['#b8263b', '#ff6b6b', '#6a3fa0', '#a77de6'][k % 4];
      ctx.fillRect(x + Math.floor(r * 14) + 1, y + Math.floor(((k * 7) % 14)) + 1, 2, 1);
    }
    if (anim && Math.random() < 0.15) { ctx.fillStyle = '#ff6b6b'; ctx.fillRect(x - 2, y + Math.floor(Math.random() * 16), 20, 1); }
  }
})();
