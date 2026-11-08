// Ampéria — effets sonores 8 bits générés par le navigateur (Web Audio), sans fichier audio.
(function () {
  'use strict';
  const AMP = window.AMP;
  const A = AMP.audio = {};
  let ctx = null;

  function contexte() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function actif() { return AMP.etat && AMP.etat.options && AMP.etat.options.sons; }

  // Une note : fréquence (Hz), durée (s), forme d'onde, volume, glissando vers freq2.
  function note(freq, duree, forme, volume, debut, freq2) {
    const c = contexte();
    if (!c) return;
    const t = c.currentTime + (debut || 0);
    const o = c.createOscillator(), g = c.createGain();
    o.type = forme || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (freq2) o.frequency.exponentialRampToValueAtTime(freq2, t + duree);
    g.gain.setValueAtTime((volume || 0.08), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + duree + 0.02);
  }
  function bruit(duree, volume, debut) {
    const c = contexte();
    if (!c) return;
    const n = Math.floor(c.sampleRate * duree), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = b; g.gain.value = volume || 0.08;
    s.connect(g); g.connect(c.destination);
    s.start(c.currentTime + (debut || 0));
  }

  const SONS = {
    blip: function () { note(880, 0.04, 'square', 0.03); },
    choix: function () { note(660, 0.05, 'square', 0.04); },
    juste: function () { [523, 659, 784, 1046].forEach(function (f, i) { note(f, 0.09, 'square', 0.06, i * 0.07); }); },
    demi: function () { note(523, 0.1, 'square', 0.05); note(587, 0.12, 'triangle', 0.05, 0.1); },
    faux: function () { note(220, 0.25, 'sawtooth', 0.06, 0, 110); },
    coup: function () { bruit(0.15, 0.12); note(160, 0.12, 'square', 0.06, 0, 60); },
    eclair: function () { bruit(0.3, 0.1); note(1200, 0.25, 'sawtooth', 0.04, 0, 200); },
    victoire: function () { [523, 659, 784, 659, 784, 1046].forEach(function (f, i) { note(f, 0.12, 'square', 0.06, i * 0.11); }); },
    niveau: function () { [392, 523, 659, 784, 1046, 1318].forEach(function (f, i) { note(f, 0.08, 'triangle', 0.07, i * 0.06); }); },
    porte: function () { note(110, 0.08, 'square', 0.08); bruit(0.08, 0.1, 0.05); note(1500, 0.06, 'square', 0.04, 0.1); },
    decouverte: function () { note(988, 0.07, 'triangle', 0.06); note(1318, 0.12, 'triangle', 0.06, 0.07); },
    rencontre: function () { [880, 660, 880, 660].forEach(function (f, i) { note(f, 0.06, 'square', 0.05, i * 0.06); }); },
    allumage: function () { note(60, 0.6, 'sawtooth', 0.05, 0, 120); bruit(0.2, 0.06, 0.1); }
  };
  A.jouer = function (nom) { if (actif() && SONS[nom]) { try { SONS[nom](); } catch (e) { /* son indisponible */ } } };

  // ---------- Musique d'ambiance (générée, une par lieu) ----------
  // Chaque morceau : une note de base, une gamme pentatonique, un tempo, et une mélodie tirée d'une graine fixe.
  const MORCEAUX = {
    village: { base: 261.6, gamme: [0, 2, 4, 7, 9, 12], tempo: 92, graine: 1, forme: 'triangle' },
    combat: { base: 220, gamme: [0, 3, 5, 7, 10, 12], tempo: 150, graine: 7, forme: 'square' },
    boss: { base: 196, gamme: [0, 1, 5, 7, 8, 12], tempo: 132, graine: 9, forme: 'sawtooth' }
  };
  const BASES = [220, 196, 246.9, 174.6, 207.6, 233.1, 185, 164.8];
  let piste = null, minuteurMusique = null, prochaine = 0, pas = 0;

  function morceau(nom) {
    if (MORCEAUX[nom]) return MORCEAUX[nom];
    const i = Math.abs(AMP.hacher(String(nom))) % BASES.length;
    return { base: BASES[i], gamme: [0, 3, 5, 7, 10, 12], tempo: 100 + (i % 3) * 8, graine: i + 3, forme: 'triangle' };
  }
  function programmer() {
    const c = contexte();
    if (!c || !piste) return;
    const m = piste.m, croche = 60 / m.tempo / 2;
    while (prochaine < c.currentTime + 0.25) {
      const t = prochaine - c.currentTime;
      const motif = piste.motif[pas % piste.motif.length];
      if (motif != null) note(m.base * Math.pow(2, m.gamme[motif] / 12), croche * 0.9, m.forme, 0.018, Math.max(0, t));
      if (pas % 4 === 0) note(m.base / 2 * (pas % 16 < 8 ? 1 : 1.5), croche * 3.5, 'triangle', 0.03, Math.max(0, t));
      pas++;
      prochaine += croche;
    }
  }
  // nom : 'village', 'combat', 'boss' ou id de chapitre ; null = silence.
  A.musique = function (nom) {
    const voulu = nom && AMP.etat && AMP.etat.options.musique ? nom : null;
    if (piste && piste.nom === voulu) return;
    if (minuteurMusique) { clearInterval(minuteurMusique); minuteurMusique = null; }
    piste = null;
    if (!voulu) return;
    const c = contexte();
    if (!c) return;
    const m = morceau(voulu), rnd = AMP.hasard(m.graine * 101);
    const motif = [];
    for (let i = 0; i < 32; i++) motif.push(rnd() < 0.25 ? null : Math.floor(rnd() * m.gamme.length));
    piste = { nom: voulu, m: m, motif: motif };
    prochaine = c.currentTime + 0.1; pas = 0;
    minuteurMusique = setInterval(programmer, 100);
  };
  A.lieuCourant = null;
  // Le navigateur n'autorise le son qu'après un geste de l'utilisateur : on (re)lance la musique à ce moment-là.
  ['pointerdown', 'keydown'].forEach(function (t) {
    window.addEventListener(t, function () { if (A.lieuCourant && !piste) A.musique(A.lieuCourant); }, { passive: true });
  });
})();
