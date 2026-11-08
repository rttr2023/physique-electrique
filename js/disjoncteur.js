// Entrée vers le jeu Ampéria : un petit disjoncteur dans l'en-tête du site.
// On lève la manette (clic ou glisser vers le haut) → éclair sur la page, clignotement de néon, puis le jeu s'ouvre.
// La LED indique l'état de la sauvegarde du jeu : rouge = jamais joué, verte = partie en cours, ambre = révisions en attente.
(function () {
  'use strict';
  if (typeof document === 'undefined') return; // chargé aussi par les outils de test (Node)

  function etatSauvegarde() {
    try {
      const s = JSON.parse(localStorage.getItem('amperia-sauvegarde'));
      if (!s) return { classe: 'rouge', texte: 'Jamais joué : lève la manette pour commencer !' };
      const n = s.resume && s.resume.aReviser || 0;
      if (n) return { classe: 'ambre', texte: n + ' élément(s) à réviser t\'attendent dans Ampéria.' };
      return { classe: 'verte', texte: 'Partie en cours (' + (s.nom || 'apprenti·e') + ', niveau ' + (s.niveau || 1) + ').' };
    } catch (e) { return { classe: 'rouge', texte: '' }; }
  }

  function creer() {
    const entete = document.querySelector('.entete');
    if (!entete || document.getElementById('disjoncteur')) return;
    const etat = etatSauvegarde();
    const a = document.createElement('a');
    a.id = 'disjoncteur';
    a.href = 'game/';
    a.className = 'disj';
    a.title = 'Ampéria, le jeu de révision. ' + etat.texte;
    a.setAttribute('aria-label', 'Ouvrir Ampéria, le jeu de révision. ' + etat.texte);
    a.innerHTML = '<span class="disj-boitier" aria-hidden="true"><span class="disj-manette"></span><span class="disj-led ' + etat.classe + '"></span></span><span class="disj-texte">Jouer</span>';
    const theme = document.getElementById('theme');
    entete.insertBefore(a, theme);

    let depart = null, lance = false;
    a.addEventListener('pointerdown', function (ev) { depart = ev.clientY; });
    a.addEventListener('pointermove', function (ev) {
      if (depart != null && depart - ev.clientY > 8) { ev.preventDefault(); allumer(a); }
    });
    a.addEventListener('pointerup', function () { depart = null; });
    a.addEventListener('click', function (ev) { ev.preventDefault(); allumer(a); });

    function allumer() {
      if (lance) return;
      lance = true;
      try { sessionStorage.setItem('amperia-allumage', '1'); } catch (e) { /* rien */ }
      const calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      a.classList.add('on');
      if (calme) { location.href = a.href; return; }
      setTimeout(function () { eclair(a); }, 140);
      setTimeout(function () { document.documentElement.classList.add('neon'); }, 420);
      setTimeout(function () { location.href = a.href; }, 1150);
    }
  }

  // Éclair en zigzag du disjoncteur jusqu'au bas de la page (SVG plein écran).
  function eclair(a) {
    const r = a.getBoundingClientRect();
    const w = window.innerWidth, h = window.innerHeight;
    let x = r.left + r.width / 2, y = r.bottom;
    let pts = x + ',' + y;
    while (y < h) {
      y += 30 + Math.random() * 50;
      x = Math.max(10, Math.min(w - 10, x + (Math.random() - 0.5) * 180));
      pts += ' ' + x.toFixed(0) + ',' + Math.min(y, h).toFixed(0);
    }
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'disj-eclair');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML = '<polyline points="' + pts + '" class="halo"/><polyline points="' + pts + '" class="coeur"/>';
    document.body.appendChild(svg);
  }

  // Retour par le bouton « précédent » : on remet la page dans son état normal.
  window.addEventListener('pageshow', function () {
    document.documentElement.classList.remove('neon');
    const s = document.querySelector('.disj-eclair'); if (s) s.remove();
    const a = document.getElementById('disjoncteur'); if (a) a.remove();
    creer();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', creer); else creer();
})();
