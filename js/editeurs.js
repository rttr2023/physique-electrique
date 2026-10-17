// Les deux éditeurs de schéma du laboratoire :
//   PE.blocs : construction par groupes série / dérivation (arbre)
//   PE.libre : dessin libre sur grille, converti en arbre par réduction série / parallèle
(function (root) {
  'use strict';
  const PE = root.PE;
  const K = PE.circuit;

  // ---------- Champ « valeur + préfixe » partagé ----------
  const PREFS = {
    R: [['mΩ', 1e-3], ['Ω', 1], ['kΩ', 1e3], ['MΩ', 1e6]],
    L: [['µH', 1e-6], ['mH', 1e-3], ['H', 1]],
    C: [['pF', 1e-12], ['nF', 1e-9], ['µF', 1e-6], ['mF', 1e-3]]
  };
  const DEFAUT = { R: 100, L: 0.1, C: 100e-6 };
  const UI = PE.ui = {};
  UI.champValeur = function (type, val) {
    const ps = PREFS[type];
    let k = 0;
    for (let i = 0; i < ps.length; i++) if (val >= ps[i][1] * 0.9999) k = i;
    return '<span class="champ-valeur"><input type="number" min="0" step="any" data-val value="' + Number((val / ps[k][1]).toPrecision(6)) + '" aria-label="Valeur">' +
      '<select data-pref aria-label="Unité">' + ps.map(function (p, i) {
        return '<option value="' + p[1] + '"' + (i === k ? ' selected' : '') + '>' + p[0] + '</option>';
      }).join('') + '</select></span>';
  };
  UI.lireChamp = function (el) {
    const w = el.closest('.champ-valeur');
    return PE.lire(w.querySelector('[data-val]').value) * Number(w.querySelector('[data-pref]').value);
  };

  // ================= Éditeur par blocs =================
  const B = PE.blocs = {};

  function noeudA(arbre, chemin) {
    let n = arbre;
    if (chemin === '') return n;
    chemin.split('.').forEach(function (i) { n = n.children[Number(i)]; });
    return n;
  }

  function ligne(n, chemin) {
    if (K.estFeuille(n)) {
      return '<div class="noeud feuille" data-chemin="' + chemin + '"><span class="badge b-' + n.type + '">' + PE.nomHTML(n.nom) + '</span>' +
        UI.champValeur(n.type, n.val) + '<button class="icone" data-act="suppr" title="Supprimer ' + n.nom + '" aria-label="Supprimer ' + n.nom + '">×</button></div>';
    }
    const prefixe = chemin === '' ? '' : chemin + '.';
    return '<div class="noeud groupe g-' + n.type + '" data-chemin="' + chemin + '"><div class="tete">' +
      '<select data-act="type" aria-label="Type de groupe"><option value="serie"' + (n.type === 'serie' ? ' selected' : '') + '>En série</option>' +
      '<option value="par"' + (n.type === 'par' ? ' selected' : '') + '>En dérivation</option></select>' +
      '<button data-act="R">+ R</button><button data-act="L">+ L</button><button data-act="C">+ C</button>' +
      '<button data-act="groupe" title="Ajouter un sous-groupe">+ Groupe</button>' +
      (chemin === '' ? '' : '<button class="icone" data-act="suppr" title="Supprimer le groupe" aria-label="Supprimer le groupe">×</button>') +
      '</div><div class="enfants">' +
      (n.children.length ? n.children.map(function (c, i) { return ligne(c, prefixe + i); }).join('')
        : '<p class="vide">Groupe vide : ajoute des dipôles avec les boutons ci-dessus.</p>') +
      '</div></div>';
  }

  B.rendu = function (arbre) {
    return '<p class="aide">Ajoute des dipôles dans un groupe, puis choisis s\'ils sont en série ou en dérivation. Un groupe peut contenir d\'autres groupes.</p>' + ligne(arbre, '');
  };

  // surChangement(structure) : structure = true si l'arbre a changé de forme (l'éditeur doit être redessiné).
  B.attacher = function (conteneur, lireArbre, surChangement) {
    conteneur.addEventListener('click', function (ev) {
      const b = ev.target.closest('button[data-act]');
      if (!b || !conteneur.contains(b) || !b.closest('.noeud')) return;
      const arbre = lireArbre();
      const chemin = b.closest('.noeud').dataset.chemin;
      const act = b.dataset.act;
      if (act === 'suppr') {
        const i = chemin.lastIndexOf('.');
        noeudA(arbre, i < 0 ? '' : chemin.slice(0, i)).children.splice(Number(chemin.slice(i + 1)), 1);
      } else {
        const g = noeudA(arbre, chemin);
        if (act === 'groupe') g.children.push({ type: g.type === 'serie' ? 'par' : 'serie', children: [] });
        else g.children.push({ type: act, val: DEFAUT[act] });
        K.nommer(arbre);
      }
      surChangement(true);
    });
    conteneur.addEventListener('change', function (ev) {
      if (ev.target.dataset.act !== 'type') return;
      noeudA(lireArbre(), ev.target.closest('.noeud').dataset.chemin).type = ev.target.value;
      surChangement(true);
    });
    conteneur.addEventListener('input', function (ev) {
      const cv = ev.target.closest('.champ-valeur');
      if (!cv || !ev.target.closest('.noeud')) return;
      noeudA(lireArbre(), ev.target.closest('.noeud').dataset.chemin).val = UI.lireChamp(ev.target);
      surChangement(false);
    });
  };

  // ================= Dessin libre =================
  // élément : { id, k: 'W' (fil) | 'R' | 'L' | 'C' | 'S' (source), x1, y1, x2, y2, nom, val }
  const G = PE.libre = { COLS: 17, ROWS: 11, PAS: 40, MARGE: 20 };

  // Convertit le dessin en arbre série / parallèle. Retourne { charge, erreurs, avert }.
  G.analyser = function (els) {
    const erreurs = [], avert = [];
    const parent = {};
    const trouve = function (k) {
      if (parent[k] === undefined) parent[k] = k;
      while (parent[k] !== k) { parent[k] = parent[parent[k]]; k = parent[k]; }
      return k;
    };
    const unir = function (a, b) { parent[trouve(a)] = trouve(b); };
    const cle = function (x, y) { return x + ',' + y; };
    els.forEach(function (e) {
      trouve(cle(e.x1, e.y1)); trouve(cle(e.x2, e.y2));
      if (e.k !== 'W') return;
      // Un fil relie tous les points de grille qu'il traverse (jonctions en T).
      const n = Math.max(Math.abs(e.x2 - e.x1), Math.abs(e.y2 - e.y1));
      const dx = Math.sign(e.x2 - e.x1), dy = Math.sign(e.y2 - e.y1);
      for (let i = 0; i < n; i++) unir(cle(e.x1 + dx * i, e.y1 + dy * i), cle(e.x1 + dx * (i + 1), e.y1 + dy * (i + 1)));
    });
    const sources = els.filter(function (e) { return e.k === 'S'; });
    if (sources.length === 0) erreurs.push('Place une source pour alimenter le schéma.');
    if (sources.length > 1) erreurs.push('Le schéma ne doit contenir qu\'une seule source.');
    let aretes = els.filter(function (e) { return e.k === 'R' || e.k === 'L' || e.k === 'C'; }).map(function (e) {
      return { a: trouve(cle(e.x1, e.y1)), b: trouve(cle(e.x2, e.y2)), n: { type: e.k, nom: e.nom, val: e.val } };
    });
    if (!aretes.length) erreurs.push('Place au moins un dipôle (R, L ou C).');
    if (erreurs.length) return { charge: null, erreurs: erreurs, avert: avert };
    const s = trouve(cle(sources[0].x1, sources[0].y1)), t = trouve(cle(sources[0].x2, sources[0].y2));
    if (s === t) return { charge: null, erreurs: ['La source est court-circuitée par un fil.'], avert: avert };

    // Dipôles reliés à la source
    const vus = {};
    const file = [s, t];
    vus[s] = vus[t] = true;
    while (file.length) {
      const n = file.pop();
      aretes.forEach(function (e) {
        const autre = e.a === n ? e.b : (e.b === n ? e.a : null);
        if (autre !== null && !vus[autre]) { vus[autre] = true; file.push(autre); }
      });
    }
    aretes = aretes.filter(function (e) {
      if (vus[e.a]) return true;
      avert.push(e.n.nom + ' n\'est pas relié au circuit.');
      return false;
    });

    const fusion = function (type, x, y) {
      const ch = [];
      [x, y].forEach(function (n) { if (n.type === type) Array.prototype.push.apply(ch, n.children); else ch.push(n); });
      return { type: type, children: ch };
    };
    const inverse = function (n) { return n.type === 'serie' ? { type: 'serie', children: n.children.slice().reverse() } : n; };
    let change = true;
    while (change) {
      change = false;
      const avant = aretes.length;
      aretes = aretes.filter(function (e) {
        if (e.a !== e.b) return true;
        avert.push(K.decrire(e.n) + ' est court-circuité par un fil : il est ignoré.');
        return false;
      });
      if (aretes.length !== avant) { change = true; continue; }
      const deg = {};
      aretes.forEach(function (e) { deg[e.a] = (deg[e.a] || 0) + 1; deg[e.b] = (deg[e.b] || 0) + 1; });
      const libreN = function (n) { return n !== s && n !== t; };
      // Branche qui ne mène nulle part : aucun courant
      const pend = aretes.findIndex(function (e) { return (libreN(e.a) && deg[e.a] === 1) || (libreN(e.b) && deg[e.b] === 1); });
      if (pend >= 0) {
        avert.push(K.decrire(aretes[pend].n) + ' est dans une branche ouverte : aucun courant ne le traverse, il est ignoré.');
        aretes.splice(pend, 1); change = true; continue;
      }
      // Parallèle : deux arêtes entre les mêmes nœuds
      let fait = false;
      for (let i = 0; i < aretes.length && !fait; i++) {
        for (let j = i + 1; j < aretes.length && !fait; j++) {
          const e = aretes[i], g = aretes[j];
          if ((e.a === g.a && e.b === g.b) || (e.a === g.b && e.b === g.a)) {
            e.n = fusion('par', e.n, g.n);
            aretes.splice(j, 1); fait = true;
          }
        }
      }
      if (fait) { change = true; continue; }
      // Série : nœud intermédiaire relié à exactement deux dipôles
      const noeuds = Object.keys(deg).filter(function (n) { return libreN(n) && deg[n] === 2; });
      if (noeuds.length) {
        const n = noeuds[0];
        const paire = aretes.filter(function (e) { return e.a === n || e.b === n; });
        const e = paire[0], g = paire[1];
        const debut = e.a === n ? e.b : e.a, fin = g.a === n ? g.b : g.a;
        aretes = aretes.filter(function (x) { return x !== e && x !== g; });
        // Chaque arête est orientée a -> b : on garde l'ordre du dessin dans la série.
        aretes.push({ a: debut, b: fin, n: fusion('serie', e.b === n ? e.n : inverse(e.n), g.a === n ? g.n : inverse(g.n)) });
        change = true;
      }
    }
    if (!aretes.length) return { charge: null, erreurs: ['Le circuit est ouvert : aucun chemin fermé ne relie les deux bornes de la source.'], avert: avert };
    if (aretes.length > 1) {
      return { charge: null, erreurs: ['Ce schéma ne se réduit pas en associations série / dérivation (montage en pont) : il ne peut pas être calculé ici.'], avert: avert };
    }
    // La source est dessinée de sa borne basse (x1, y1) vers sa borne haute : le courant sort par t.
    const charge = aretes[0].a === t ? aretes[0].n : inverse(aretes[0].n);
    return { charge: K.nommer(K.normaliser(charge)), erreurs: erreurs, avert: avert };
  };

  const OUTILS = [['sel', 'Sélection'], ['W', 'Fil'], ['R', 'R'], ['L', 'L'], ['C', 'C'], ['S', 'Source'], ['gomme', 'Gomme']];
  function px(v) { return G.MARGE + v * G.PAS; }

  function elementSVG(e, sel, regime) {
    const x1 = px(e.x1), y1 = px(e.y1), x2 = px(e.x2), y2 = px(e.y2);
    const cls = 'el' + (sel ? ' sel' : '');
    if (e.k === 'W') return '<g class="' + cls + '"><line class="fil" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/></g>';
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, vert = x1 === x2;
    const d = e.k === 'S' ? 17 : 22;
    const sg = function (a, b) { return a < b ? -1 : 1; };
    let h = '<g class="' + cls + '">';
    if (vert) {
      h += '<line class="fil" x1="' + x1 + '" y1="' + y1 + '" x2="' + x1 + '" y2="' + (cy + sg(y1, y2) * d) + '"/>' +
        '<line class="fil" x1="' + x1 + '" y1="' + (cy - sg(y1, y2) * d) + '" x2="' + x1 + '" y2="' + y2 + '"/>';
    } else {
      h += '<line class="fil" x1="' + x1 + '" y1="' + y1 + '" x2="' + (cx + sg(x1, x2) * d) + '" y2="' + y1 + '"/>' +
        '<line class="fil" x1="' + (cx - sg(x1, x2) * d) + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y1 + '"/>';
    }
    h += '<g transform="translate(' + cx + ' ' + cy + ')' + (vert && e.k !== 'S' ? ' rotate(90)' : '') + '">' +
      (e.k === 'S' ? PE.dessin.symboleSource(regime) : PE.dessin.symbole(e.k)) + '</g>';
    const texte = e.k === 'S' ? (regime === 'DC' ? 'E' : 'V') : e.nom + ' = ' + PE.fmt(e.val, K.UNITE[e.k]);
    h += vert ? '<text class="lbl" x="' + (cx + (e.k === 'S' ? 23 : 17)) + '" y="' + (cy + 4) + '">' + texte + '</text>'
      : '<text class="lbl" text-anchor="middle" x="' + cx + '" y="' + (cy - (e.k === 'S' ? 23 : 15)) + '">' + texte + '</text>';
    return h + '</g>';
  }

  G.rendu = function (etat, regime) {
    const W = 2 * G.MARGE + (G.COLS - 1) * G.PAS, H = 2 * G.MARGE + (G.ROWS - 1) * G.PAS;
    let pts = '';
    for (let y = 0; y < G.ROWS; y++) for (let x = 0; x < G.COLS; x++) pts += '<circle class="pt" cx="' + px(x) + '" cy="' + px(y) + '" r="1.6"/>';
    // Points de jonction : au moins trois extrémités / passages de fil
    const deg = {};
    const plus = function (x, y, v) { const k = x + ',' + y; deg[k] = (deg[k] || 0) + v; };
    etat.elements.forEach(function (e) {
      plus(e.x1, e.y1, 1); plus(e.x2, e.y2, 1);
      if (e.k !== 'W') return;
      const n = Math.max(Math.abs(e.x2 - e.x1), Math.abs(e.y2 - e.y1));
      const dx = Math.sign(e.x2 - e.x1), dy = Math.sign(e.y2 - e.y1);
      for (let i = 1; i < n; i++) plus(e.x1 + dx * i, e.y1 + dy * i, 2);
    });
    let jonctions = '';
    Object.keys(deg).forEach(function (k) {
      if (deg[k] < 3) return;
      const p = k.split(',');
      jonctions += '<circle class="noeud" cx="' + px(Number(p[0])) + '" cy="' + px(Number(p[1])) + '" r="3.2"/>';
    });
    const sel = etat.elements.find(function (e) { return e.id === etat.sel; });
    let props = '';
    if (sel && sel.k !== 'W' && sel.k !== 'S') {
      props = '<div class="props" data-id="' + sel.id + '"><span class="badge b-' + sel.k + '">' + PE.nomHTML(sel.nom) + '</span>' + UI.champValeur(sel.k, sel.val) +
        '<button data-libre="suppr">Supprimer</button></div>';
    } else if (sel) {
      props = '<div class="props" data-id="' + sel.id + '"><span>' + (sel.k === 'W' ? 'Fil' : 'Source') + ' sélectionné' + (sel.k === 'S' ? 'e' : '') + '</span><button data-libre="suppr">Supprimer</button></div>';
    }
    return '<div class="barre outils" role="toolbar" aria-label="Outils de dessin">' + OUTILS.map(function (o) {
      return '<button data-outil="' + o[0] + '" class="' + (etat.outil === o[0] ? 'actif' : '') + '" aria-pressed="' + (etat.outil === o[0]) + '">' + o[1] + '</button>';
    }).join('') + '<span class="sep"></span><button data-libre="exemple">Exemple</button><button data-libre="vider">Tout effacer</button></div>' +
      '<p class="aide">Choisis un outil puis fais glisser d\'un point de la grille à un autre (horizontalement ou verticalement). Un dipôle occupe au moins deux cases. ' +
      'Avec « Sélection », clique sur un dipôle pour changer sa valeur.</p>' +
      '<div class="grille-wrap"><svg class="grille" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Grille de dessin du schéma">' + pts +
      etat.elements.map(function (e) { return elementSVG(e, e.id === etat.sel, regime); }).join('') + jonctions +
      '<line class="apercu" x1="0" y1="0" x2="0" y2="0" visibility="hidden"/></svg></div>' + props +
      (etat.message ? '<p class="alerte">' + PE.esc(etat.message) + '</p>' : '');
  };

  G.exemple = function () {
    return [
      { id: 1, k: 'S', x1: 2, y1: 7, x2: 2, y2: 2 },
      { id: 2, k: 'R', x1: 2, y1: 2, x2: 5, y2: 2, nom: 'R1', val: 47 },
      { id: 3, k: 'L', x1: 5, y1: 2, x2: 8, y2: 2, nom: 'L1', val: 0.1 },
      { id: 4, k: 'W', x1: 8, y1: 2, x2: 11, y2: 2 },
      { id: 5, k: 'R', x1: 8, y1: 2, x2: 8, y2: 7, nom: 'R2', val: 100 },
      { id: 6, k: 'C', x1: 11, y1: 2, x2: 11, y2: 7, nom: 'C1', val: 47e-6 },
      { id: 7, k: 'W', x1: 2, y1: 7, x2: 11, y2: 7 }
    ];
  };

  // lireEtat() -> état du dessin ; surChangement(redessiner) appelé après chaque modification.
  G.attacher = function (conteneur, lireEtat, surChangement) {
    let depart = null;
    const grille = function (ev) {
      const svg = conteneur.querySelector('svg.grille');
      const r = svg.getBoundingClientRect();
      const k = svg.viewBox.baseVal.width / r.width;
      const gx = Math.round(((ev.clientX - r.left) * k - G.MARGE) / G.PAS), gy = Math.round(((ev.clientY - r.top) * k - G.MARGE) / G.PAS);
      return {
        x: Math.max(0, Math.min(G.COLS - 1, gx)), y: Math.max(0, Math.min(G.ROWS - 1, gy)),
        fx: ((ev.clientX - r.left) * k - G.MARGE) / G.PAS, fy: ((ev.clientY - r.top) * k - G.MARGE) / G.PAS
      };
    };
    const aligne = function (g) {
      return Math.abs(g.x - depart.x) >= Math.abs(g.y - depart.y) ? { x: g.x, y: depart.y } : { x: depart.x, y: g.y };
    };
    const plusProche = function (etat, g) {
      let best = null, dmin = 0.45;
      etat.elements.forEach(function (e) {
        const dx = e.x2 - e.x1, dy = e.y2 - e.y1;
        const u = Math.max(0, Math.min(1, ((g.fx - e.x1) * dx + (g.fy - e.y1) * dy) / (dx * dx + dy * dy)));
        const d = Math.hypot(g.fx - (e.x1 + u * dx), g.fy - (e.y1 + u * dy));
        if (d < dmin) { dmin = d; best = e; }
      });
      return best;
    };

    conteneur.addEventListener('pointerdown', function (ev) {
      if (!ev.target.closest('svg.grille')) return;
      const etat = lireEtat();
      const g = grille(ev);
      etat.message = '';
      if (etat.outil === 'sel' || etat.outil === 'gomme') {
        const e = plusProche(etat, g);
        if (etat.outil === 'gomme' && e) { etat.elements = etat.elements.filter(function (x) { return x !== e; }); etat.sel = null; }
        else etat.sel = e ? e.id : null;
        surChangement(true);
        return;
      }
      depart = { x: g.x, y: g.y };
      ev.target.closest('svg.grille').setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    conteneur.addEventListener('pointermove', function (ev) {
      if (!depart) return;
      const l = conteneur.querySelector('.apercu');
      if (!l) return;
      const a = aligne(grille(ev));
      l.setAttribute('x1', px(depart.x)); l.setAttribute('y1', px(depart.y));
      l.setAttribute('x2', px(a.x)); l.setAttribute('y2', px(a.y));
      l.setAttribute('visibility', 'visible');
    });
    const fin = function (ev) {
      if (!depart) return;
      const etat = lireEtat();
      const a = aligne(grille(ev));
      const d0 = depart;
      depart = null;
      const lg = Math.abs(a.x - d0.x) + Math.abs(a.y - d0.y);
      if (lg === 0) { surChangement(true); return; }
      const k = etat.outil;
      if (k !== 'W' && lg < 2) {
        etat.message = 'Un dipôle doit occuper au moins deux cases de la grille.';
      } else if (k === 'S' && etat.elements.some(function (e) { return e.k === 'S'; })) {
        etat.message = 'Le schéma contient déjà une source.';
      } else {
        const e = { id: Date.now() + Math.random(), k: k, x1: d0.x, y1: d0.y, x2: a.x, y2: a.y };
        if (k === 'R' || k === 'L' || k === 'C') {
          let i = 1;
          const noms = etat.elements.map(function (x) { return x.nom; });
          while (noms.indexOf(k + i) >= 0) i++;
          e.nom = k + i; e.val = DEFAUT[k];
          etat.sel = e.id;
        }
        etat.elements.push(e);
      }
      surChangement(true);
    };
    conteneur.addEventListener('pointerup', fin);
    conteneur.addEventListener('pointercancel', function () { depart = null; });

    conteneur.addEventListener('click', function (ev) {
      const etat = lireEtat();
      const o = ev.target.closest('[data-outil]');
      if (o) { etat.outil = o.dataset.outil; etat.message = ''; surChangement(true); return; }
      const b = ev.target.closest('[data-libre]');
      if (!b) return;
      if (b.dataset.libre === 'vider') { etat.elements = []; etat.sel = null; }
      else if (b.dataset.libre === 'exemple') { etat.elements = G.exemple(); etat.sel = null; }
      else if (b.dataset.libre === 'suppr') {
        etat.elements = etat.elements.filter(function (e) { return e.id !== etat.sel; });
        etat.sel = null;
      }
      etat.message = '';
      surChangement(true);
    });
    conteneur.addEventListener('input', function (ev) {
      const pr = ev.target.closest('.props');
      if (!pr || !ev.target.closest('.champ-valeur')) return;
      const etat = lireEtat();
      const e = etat.elements.find(function (x) { return String(x.id) === pr.dataset.id; });
      if (!e) return;
      e.val = UI.lireChamp(ev.target);
      // Mise à jour de l'étiquette sans redessiner (pour garder le curseur dans le champ)
      surChangement(false);
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
