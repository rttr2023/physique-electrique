// Ampéria — démarrage, écran titre, mise en page (PC / téléphone), boucle de jeu et transitions.
(function () {
  'use strict';
  const AMP = window.AMP;
  const JEU = AMP.jeu = {};
  let W = 320, H = 180;                    // résolution interne (plus haute en portrait sur téléphone)
  const toile = document.getElementById('toile');
  const ctx = toile.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  AMP.scene = 'chargement';
  let flash = null;                        // { t, duree, milieu, fait }
  let titreT = 0;

  // ---------- Mise en page ----------
  const tactile = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  document.body.classList.toggle('tactile', tactile);

  JEU.redimensionner = function () {
    const vw = window.innerWidth, vh = window.innerHeight;
    const paysage = vw > vh * 1.1;
    document.body.classList.toggle('paysage', paysage);
    document.body.classList.toggle('portrait', !paysage);
    const hud = document.getElementById('hud').offsetHeight || 0;
    let aw = vw, ah = vh - hud;
    if (document.body.classList.contains('mode-combat')) {
      if (paysage) aw = vw - Math.min(520, Math.max(320, vw * 0.46));
      else ah = Math.min(ah * 0.36, vw * 9 / 16);
    } else if (tactile && !paysage) {
      ah -= 170; // place pour la croix et les boutons sous l'image
    }
    // Exploration en portrait : vue presque carrée (moins de cases, mais plus grandes).
    let w = 320, h = 180;
    if (!paysage && !document.body.classList.contains('mode-combat')) { w = 240; h = Math.max(180, Math.min(320, Math.round(240 * ah / aw / 8) * 8)); }
    if (w !== W || h !== H) { W = w; H = h; toile.width = W; toile.height = H; ctx.imageSmoothingEnabled = false; }
    let s = Math.min(aw / W, ah / H);
    if (s >= 2) s = Math.floor(s * 2) / 2; // pas de demi-pixels flous sur grand écran
    s = Math.max(0.5, s);
    toile.style.width = Math.floor(W * s) + 'px';
    toile.style.height = Math.floor(H * s) + 'px';
  };
  window.addEventListener('resize', JEU.redimensionner);
  window.addEventListener('orientationchange', function () { setTimeout(JEU.redimensionner, 200); });

  // Flash blanc : `milieu` est appelé quand l'écran est complètement blanc.
  JEU.flash = function (duree, milieu) {
    if (!AMP.etat || !AMP.etat.options.animations) { if (milieu) milieu(); return; }
    flash = { t: 0, duree: duree, milieu: milieu, fait: false };
  };

  // ---------- Chargement ----------
  function chargerScript(src) {
    return new Promise(function (ok, ko) {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = ko;
      document.head.appendChild(s);
    });
  }
  function chargerCss(href) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }
  // KaTeX : copie locale (game/lib/katex) si elle existe, sinon CDN, sinon écriture simplifiée.
  async function chargerKatex() {
    const sources = [['lib/katex/katex.min.js', 'lib/katex/katex.min.css'],
      ['https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js', 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css']];
    for (const s of sources) {
      try { await chargerScript(s[0]); chargerCss(s[1]); return true; } catch (e) { /* source suivante */ }
    }
    return false;
  }

  function message(html) {
    document.getElementById('chargement').innerHTML = html;
  }

  async function demarrer() {
    JEU.redimensionner();
    if (location.protocol === 'file:') {
      message('<h1>Ampéria</h1><p>Le jeu doit être ouvert par un petit serveur web (les navigateurs bloquent la lecture des données depuis un fichier).</p>' +
        '<p>Dans le dossier du site, lance :</p><pre>python -m http.server 8000</pre><p>puis ouvre <a href="http://localhost:8000/game/">http://localhost:8000/game/</a>.</p><p>Sur le site en ligne, rien à faire.</p>');
      return;
    }
    message('<h1>Ampéria</h1><p>Mise sous tension…</p>');
    const katex = chargerKatex();
    try {
      await AMP.chargerDonnees(function (f) {
        return fetch('data/' + f, { cache: 'no-cache' }).then(function (r) {
          if (!r.ok) throw new Error(f + ' (' + r.status + ')');
          return r.json();
        });
      });
    } catch (e) {
      message('<h1>Ampéria</h1><p>Impossible de charger les données du jeu : ' + AMP.esc(e.message) + '</p>');
      return;
    }
    await katex;

    // Sauvegarde : options, date de test, puis index des éléments selon l'option « hors cours ».
    AMP.etat = AMP.sauvegarde.charger() || AMP.sauvegarde.nouvelEtat();
    AMP.options.horsCours = AMP.etat.options.horsCours;
    AMP.decalageJours = AMP.etat.decalageJours || 0;
    AMP.indexer();
    document.documentElement.dataset.texte = AMP.etat.options.texte;
    document.documentElement.classList.toggle('sans-anim', !AMP.etat.options.animations);
    if (AMP.etat.charge > AMP.prog.chargeMax()) AMP.etat.charge = AMP.prog.chargeMax();
    AMP.entree.brancherTactile(document.getElementById('tactile'));
    document.getElementById('chargement').hidden = true;

    if (location.search.indexOf('verif') >= 0) { verifierFormules(); }

    // Arrivée par le disjoncteur du site : petite animation de mise sous tension.
    let allumage = false;
    try { allumage = sessionStorage.getItem('amperia-allumage') === '1'; sessionStorage.removeItem('amperia-allumage'); } catch (e) { /* rien */ }
    if (allumage && AMP.etat.options.animations) { JEU.allumage = 1.2; AMP.audio.jouer('allumage'); }

    if (!AMP.etat.nom) ecranTitre();
    else lancerMonde();
    requestAnimationFrame(boucle);
  }

  function lancerMonde() {
    AMP.scene = 'monde';
    const l = AMP.etat.lieu;
    const id = l && (l.carte === 'village' || AMP.region(l.carte)) ? l.carte : 'village';
    AMP.monde.entrer(id, l && l.x != null ? l : null);
    JEU.redimensionner();
    if (!AMP.etat.introVue && id === 'village') setTimeout(function () { AMP.monde.mentor(); }, 600);
  }

  function ecranTitre() {
    AMP.scene = 'titre';
    const corps = AMP.ui.fenetre('Ampéria', '<p class="titre-intro">Le Grand Délestage a plongé Ampéria dans le noir. Des Parasites ont dévoré les formules…<br>Toi seul·e peux remettre le réseau sous tension.</p>' +
      '<label class="option"><span>Ton nom d\'apprenti·e électrotechnicien·ne</span><input class="nom" maxlength="16" autocomplete="off" placeholder="ex. Romain"></label>' +
      '<div class="menu"><button class="go">⚡ Commencer</button><label class="bouton">⬆ Importer une sauvegarde<input type="file" accept=".json,application/json" hidden></label></div><p class="message"></p>',
    { fermable: false, classe: 'titre' });
    const champ = corps.querySelector('.nom');
    const go = function () {
      const n = champ.value.trim();
      if (!n) { champ.focus(); return; }
      AMP.etat.nom = n;
      AMP.prog.soigner();
      AMP.ui.fermer();
      AMP.audio.jouer('allumage');
      JEU.flash(0.6, lancerMonde);
      AMP.sauvegarde.sauver(true);
    };
    corps.querySelector('.go').addEventListener('click', go);
    champ.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') go(); });
    corps.querySelector('input[type=file]').addEventListener('change', function (ev) {
      const f = ev.target.files[0];
      if (f) AMP.sauvegarde.importer(f).then(function () { location.reload(); }).catch(function (e) { corps.querySelector('.message').textContent = e.message; });
    });
    if (!tactile) champ.focus();
  }

  // ---------- Boucle ----------
  let avant = performance.now(), chrono = 0;
  function boucle(maintenant) {
    const dt = Math.min(0.05, (maintenant - avant) / 1000);
    avant = maintenant;
    if (AMP.etat && AMP.scene !== 'titre') {
      AMP.etat.stats.tempsJeu += dt;
      chrono += dt;
      if (chrono > 2) { chrono = 0; AMP.ui.majHud(); }
    }
    if (AMP.scene === 'monde') { AMP.monde.update(dt); AMP.monde.dessiner(ctx, W, H); }
    else if (AMP.scene === 'combat') { AMP.combat.update(dt); AMP.combat.dessiner(ctx, W, H); }
    else dessinerTitre(dt);

    if (JEU.allumage > 0) {
      JEU.allumage -= dt;
      // Néon qui démarre : éteint, allumé, éteint… puis allumé pour de bon.
      const motif = [0, 0, 1, 0, 0, 1, 0, 1, 1, 1];
      const on = motif[Math.floor((1.2 - JEU.allumage) * 8)] !== 0;
      if (!on) { ctx.fillStyle = 'rgba(0,0,0,.92)'; ctx.fillRect(0, 0, W, H); }
    }
    if (flash) {
      flash.t += dt;
      const m = flash.duree / 2;
      if (!flash.fait && flash.t >= m) { flash.fait = true; if (flash.milieu) flash.milieu(); }
      const a = flash.t < m ? flash.t / m : Math.max(0, 1 - (flash.t - m) / m);
      ctx.fillStyle = 'rgba(243,230,200,' + a + ')';
      ctx.fillRect(0, 0, W, H);
      if (flash.t >= flash.duree) flash = null;
    }
    requestAnimationFrame(boucle);
  }

  // Écran titre : nuit, lignes électriques, éclairs.
  function dessinerTitre(dt) {
    titreT += dt;
    ctx.fillStyle = '#0b0e1a'; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = i % 3 ? '#2d3e63' : '#9aa6bd';
      ctx.fillRect((i * 73 + Math.floor(titreT * 3)) % W, (i * 37) % 90, 1, 1);
    }
    ctx.fillStyle = '#141a2e';
    for (let x = 0; x < W; x += 40) { ctx.fillRect(x + 18, 110, 4, 70); ctx.fillRect(x + 8, 112, 24, 2); }
    ctx.strokeStyle = '#2d3e63'; ctx.lineWidth = 1;
    for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let x = 0; x <= W; x += 40) { if (x) ctx.quadraticCurveTo(x - 20, 120 + k * 4, x + 9, 113 + k * 4); else ctx.moveTo(9, 113 + k * 4); } ctx.stroke(); }
    ctx.fillStyle = '#1f2a44'; ctx.fillRect(0, 165, W, 15);
    ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = '#5a2e16'; ctx.fillText('AMPÉRIA', W / 2 + 2, 62);
    ctx.fillStyle = Math.floor(titreT * 6) % 17 === 0 ? '#ffffff' : '#ffc65c'; ctx.fillText('AMPÉRIA', W / 2, 60);
    ctx.font = '8px monospace'; ctx.fillStyle = '#3fd2d6'; ctx.fillText('RPG de physique électrique — BTS Électrotechnique', W / 2, 78);
    if (AMP.etat && AMP.etat.options.animations && Math.floor(titreT * 2) % 3 === 0) AMP.monde.arc(ctx, 60 + Math.random() * 200, 0, 60 + Math.random() * 200, 100, '#b5fff6', 1);
  }

  // Mode vérification (?verif) : rend toutes les formules avec KaTeX et liste les erreurs.
  function verifierFormules() {
    const erreurs = [];
    const tester = function (latex, ou) {
      if (!window.katex) return;
      try { window.katex.renderToString(latex, { throwOnError: true }); } catch (e) { erreurs.push(ou + ' : ' + e.message); }
    };
    AMP.donnees.chapitres.forEach(function (ch) {
      ch.formules.forEach(function (f) { tester(f.latex, f.id); f.variables.forEach(function (v) { tester(v.symbole, f.id + ' / ' + v.code); }); });
      ch.exemples.forEach(function (x) { (x.enonce.match(/\$[^$]+\$/g) || []).forEach(function (m) { tester(m.slice(1, -1), x.id); }); (x.donnees || []).forEach(function (d) { tester(d.symbole, x.id + ' / ' + d.code); }); });
      ch.notions.concat(ch.pieges).forEach(function (n) { ((n.definition || n.texte || '').match(/\$[^$]+\$/g) || []).forEach(function (m) { tester(m.slice(1, -1), n.id); }); });
    });
    console.log('[Ampéria] vérification KaTeX : ' + (window.katex ? (erreurs.length ? erreurs.length + ' erreur(s)' : 'OK') : 'KaTeX non chargé'), erreurs);
    window.AMP_VERIF = { katex: !!window.katex, erreurs: erreurs };
  }

  demarrer();
})();
