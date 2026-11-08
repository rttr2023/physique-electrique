// Ampéria — commandes : clavier (flèches, ZQSD, WASD, Espace, Entrée, Échap, C) et boutons tactiles.
(function () {
  'use strict';
  const AMP = window.AMP;
  const E = AMP.entree = { dir: null, pile: [], actions: [] };

  const TOUCHES_DIR = {
    ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite',
    z: 'haut', w: 'haut', s: 'bas', q: 'gauche', a: 'gauche', d: 'droite'
  };
  const TOUCHES_ACTION = { ' ': 'A', Enter: 'A', e: 'A', Escape: 'menu', Backspace: 'B', x: 'B', c: 'codex', m: 'menu' };

  // Direction tenue : la dernière pressée gagne.
  // Chaque appui (même très bref) fait un pas : les appuis sont mis en file (3 au plus).
  // Une touche maintenue continue ensuite le déplacement.
  E.taps = [];
  function appuyer(d, repete) {
    E.pile = E.pile.filter(function (x) { return x !== d; }); E.pile.push(d); E.dir = d;
    if (!repete && E.taps.length < 3) E.taps.push(d);
  }
  E.direction = function () { return E.taps.length ? E.taps.shift() : E.dir; };
  function relacher(d) { E.pile = E.pile.filter(function (x) { return x !== d; }); E.dir = E.pile[E.pile.length - 1] || null; }
  E.action = function (a) { E.actions.push(a); };
  E.prendre = function () { const a = E.actions.slice(); E.actions.length = 0; return a; };
  E.vider = function () { E.pile = []; E.dir = null; E.taps = []; E.actions.length = 0; };

  // Le clavier ne pilote le personnage que quand aucune fenêtre HTML (question, codex) n'a le focus.
  function saisieActive(ev) {
    const t = ev.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }
  window.addEventListener('keydown', function (ev) {
    if (saisieActive(ev)) return;
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    if (AMP.ui && AMP.ui.clavier && AMP.ui.clavier(ev, k)) { ev.preventDefault(); return; } // fenêtre ouverte
    if (TOUCHES_DIR[k]) { appuyer(TOUCHES_DIR[k], ev.repeat); ev.preventDefault(); }
    else if (TOUCHES_ACTION[k] && !ev.repeat) { E.action(TOUCHES_ACTION[k]); ev.preventDefault(); }
  });
  window.addEventListener('keyup', function (ev) {
    const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
    if (TOUCHES_DIR[k]) relacher(TOUCHES_DIR[k]);
  });
  window.addEventListener('blur', E.vider);

  // ---------- Croix tactile et boutons A / B ----------
  E.brancherTactile = function (racineEl) {
    const croix = racineEl.querySelector('.croix');
    let doigt = null;
    function viser(ev) {
      const r = croix.getBoundingClientRect();
      const dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * 0.12) { E.pile = []; E.dir = null; return; }
      const d = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'droite' : 'gauche') : (dy > 0 ? 'bas' : 'haut');
      E.pile = [d]; E.dir = d;
      croix.dataset.dir = d;
    }
    croix.addEventListener('pointerdown', function (ev) { doigt = ev.pointerId; croix.setPointerCapture(doigt); viser(ev); if (E.dir && E.taps.length < 3) E.taps.push(E.dir); ev.preventDefault(); });
    croix.addEventListener('pointermove', function (ev) { if (ev.pointerId === doigt) viser(ev); });
    const fin = function (ev) { if (ev.pointerId !== doigt) return; doigt = null; E.pile = []; E.dir = null; croix.dataset.dir = ''; };
    croix.addEventListener('pointerup', fin); croix.addEventListener('pointercancel', fin);
    racineEl.querySelectorAll('[data-action]').forEach(function (b) {
      b.addEventListener('pointerdown', function (ev) { ev.preventDefault(); E.action(b.dataset.action); b.classList.add('appui'); });
      b.addEventListener('pointerup', function () { b.classList.remove('appui'); });
      b.addEventListener('pointerleave', function () { b.classList.remove('appui'); });
    });
  };
})();
