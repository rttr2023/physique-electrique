// Ampéria — graphismes en pixel art, dessinés dans le code (aucun fichier image).
// Chaque sprite est une grille de caractères : un caractère = une couleur de la palette, '.' = transparent.
// Les tuiles du décor sont générées avec un hasard à graine fixe (toujours identiques d'une partie à l'autre).
(function (racine) {
  'use strict';
  const AMP = racine.AMP;
  const SP = AMP.sprites = {};

  // ---------- Palette (32 couleurs) ----------
  // Bleus nuit 0-3, aciers 4-7, cuivres a-d (tension), cyans e-h (courant), violets i-l (puissance),
  // verts m-o, rouges p-r, crème s, peau t, bruns u-v, blanc w, bois sombre x.
  SP.PALETTE = {
    0: '#0b0e1a', 1: '#141a2e', 2: '#1f2a44', 3: '#2d3e63', 4: '#47597e', 5: '#6b7a99', 6: '#9aa6bd', 7: '#d6dce6',
    a: '#5a2e16', b: '#a8551f', c: '#e08a2e', d: '#ffc65c',
    e: '#0e4b5a', f: '#13889a', g: '#3fd2d6', h: '#b5fff6',
    i: '#3a1f5c', j: '#6a3fa0', k: '#a77de6', l: '#e3cdfb',
    m: '#1c4a2a', n: '#2f7d3b', o: '#6cc04a',
    p: '#5c1020', q: '#b8263b', r: '#ff6b6b',
    s: '#f3e6c8', t: '#f7c9a0', u: '#5b3a22', v: '#8d5a36', w: '#ffffff', x: '#3b2a1a'
  };
  SP.COULEURS_JEU = { tension: 'c', courant: 'g', puissance: 'k' };

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  SP.canvas = canvas;

  // Dessine une grille de caractères. theme : remplacement de couleurs { 'n': 'e', ... } ; miroir : retourner à l'horizontale.
  SP.grille = function (lignes, theme, miroir) {
    const h = lignes.length, w = lignes[0].length;
    const c = canvas(w, h), x = c.getContext('2d');
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        let ch = lignes[j][i];
        if (ch === '.' || ch === ' ') continue;
        if (theme && theme[ch]) ch = theme[ch];
        x.fillStyle = SP.PALETTE[ch] || '#f0f';
        x.fillRect(miroir ? w - 1 - i : i, j, 1, 1);
      }
    }
    return c;
  };

  // ---------- Tuiles générées ----------
  // On dessine sur une grille 16×16 de caractères, puis on la convertit.
  function vide(fond) { const g = []; for (let j = 0; j < 16; j++) g.push(new Array(16).fill(fond)); return g; }
  function pt(g, x, y, c) { if (x >= 0 && y >= 0 && x < 16 && y < 16) g[y][x] = c; }
  function disque(g, cx, cy, r, c) { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) g[y][x] = c; }
  function herbe(g, rnd) {
    for (let k = 0; k < 10; k++) pt(g, Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? 'o' : 'm');
    for (let k = 0; k < 3; k++) { const x = Math.floor(rnd() * 15), y = Math.floor(rnd() * 14) + 1; pt(g, x, y, 'o'); pt(g, x + 1, y - 1, 'o'); }
  }
  function lignes(g) { return g.map(function (r) { return r.join(''); }); }

  const GEN = {
    '.': function (g, rnd) { herbe(g, rnd); },
    ',': function (g, rnd) {
      herbe(g, rnd);
      for (let k = 0; k < 7; k++) {
        const x = 1 + Math.floor(rnd() * 13), y = 5 + Math.floor(rnd() * 10);
        for (let d = 0; d < 4; d++) pt(g, x + (d > 2 ? 1 : 0), y - d, d === 3 ? 'o' : 'm');
        pt(g, x + 1, y, 'm'); pt(g, x - 1, y - 1, 'o'); pt(g, x + 2, y - 2, 'o');
      }
    },
    '#': function (g, rnd) {
      herbe(g, rnd);
      for (let y = 12; y < 16; y++) { pt(g, 7, y, 'u'); pt(g, 8, y, 'x'); }
      disque(g, 8, 7, 7, '0'); disque(g, 8, 7, 6, 'm'); disque(g, 7, 6, 4, 'n'); disque(g, 6, 5, 2, 'o');
      for (let k = 0; k < 6; k++) pt(g, 3 + Math.floor(rnd() * 10), 2 + Math.floor(rnd() * 10), rnd() < 0.5 ? 'm' : 'o');
    },
    '~': function (g, rnd, f) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g[y][x] = 'f';
      for (let k = 0; k < 6; k++) {
        const x = Math.floor(rnd() * 12), y = Math.floor(rnd() * 15);
        const dx = f ? 2 : 0;
        pt(g, x + dx, y, 'g'); pt(g, x + 1 + dx, y, 'g'); pt(g, x + 2 + dx, y + 1, 'h');
      }
      for (let k = 0; k < 8; k++) pt(g, Math.floor(rnd() * 16), Math.floor(rnd() * 16), 'e');
    },
    '=': function (g, rnd) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g[y][x] = 's';
      for (let k = 0; k < 14; k++) pt(g, Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.6 ? 't' : '6');
    },
    '+': function (g, rnd) {
      herbe(g, rnd);
      const fl = ['r', 'd', 'k', 'l', 'w', 'c'];
      for (let k = 0; k < 3; k++) {
        const x = 2 + Math.floor(rnd() * 12), y = 2 + Math.floor(rnd() * 12), c = AMP.choisir(fl, rnd);
        pt(g, x, y, c); pt(g, x - 1, y, c); pt(g, x + 1, y, c); pt(g, x, y - 1, c); pt(g, x, y + 1, 'm'); pt(g, x, y, 'd');
      }
    },
    'o': function (g, rnd) {
      herbe(g, rnd);
      disque(g, 8, 9, 6, '3'); disque(g, 8, 9, 5, '5'); disque(g, 7, 8, 3, '6'); pt(g, 6, 7, '7');
      for (let x = 3; x < 14; x++) pt(g, x, 15, 'm');
    },
    '|': function (g) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g[y][x] = '4';
      for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) pt(g, x, y, '3');
      for (let y = 0; y < 16; y += 4) { const o = (y / 4) % 2 ? 4 : 0; for (let x = o; x < 16; x += 8) for (let d = 0; d < 4; d++) pt(g, x, y + d, '3'); }
      for (let y = 1; y < 16; y += 4) for (let x = 1; x < 16; x += 8) pt(g, x, y, '5');
    },
    'b': function (g) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g[y][x] = 'v';
      for (let x = 0; x < 16; x += 4) for (let y = 0; y < 16; y++) pt(g, x, y, 'u');
      for (let x = 0; x < 16; x++) { pt(g, x, 0, 'x'); pt(g, x, 15, 'x'); }
    },
    'L': function (g, rnd) {
      herbe(g, rnd);
      for (let y = 1; y < 16; y++) { const l = 5 + Math.floor(y / 5), r = 10 - Math.floor(y / 5); pt(g, l, y, '5'); pt(g, r, y, '5'); if (y % 3 === 0) for (let x = l; x <= r; x++) pt(g, x, y, '4'); }
      for (let x = 2; x < 14; x++) pt(g, x, 3, '6');
      pt(g, 2, 4, 'g'); pt(g, 13, 4, 'g'); pt(g, 7, 2, 'g'); pt(g, 8, 2, 'g');
    },
    'P': function (g, rnd) {
      herbe(g, rnd);
      for (let y = 5; y < 15; y++) for (let x = 3; x < 13; x++) pt(g, x, y, y < 8 ? 'v' : 'u');
      for (let y = 6; y < 8; y++) for (let x = 4; x < 12; x++) pt(g, x, y, 's');
      for (let x = 5; x < 11; x++) pt(g, x, 6, '5');
      pt(g, 4, 15, 'x'); pt(g, 11, 15, 'x'); pt(g, 6, 4, 'd'); pt(g, 7, 3, 'd'); pt(g, 8, 4, 'd');
    },
    'E': function (g, rnd) {
      GEN['='](g, rnd);
      for (let k = 0; k < 3; k++) { const x = 3 + k * 4; pt(g, x, 7, 'd'); pt(g, x - 1, 8, 'd'); pt(g, x, 9, 'd'); }
    },
    'g': function (g) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) g[y][x] = 's';
      for (let y = 5; y < 11; y++) for (let x = 1; x < 15; x++) pt(g, x, y, ((x + y) >> 1) % 2 ? 'd' : '0');
      for (let y = 11; y < 16; y++) { pt(g, 2, y, '5'); pt(g, 13, y, '5'); }
    }
  };
  // Tuiles posées sur l'herbe (objets dessinés à part, ou sol simple).
  ['S', 'K', '0', '1', '2', 'n', 'a', 'b', 'c', 'd', 'e', 'f', 'h', 't', 'H', 'T', 'A', 'B', 'C', 'X'].forEach(function (k) {
    if (!GEN[k]) GEN[k] = GEN['.'];
  });

  const cache = {};
  // Tuile 16×16. variante : 0 à 3 ; frame : pour l'eau (animation).
  SP.tuile = function (ch, variante, theme, frame, cleTheme) {
    const cle = ch + variante + (frame || 0) + (cleTheme || '');
    if (cache[cle]) return cache[cle];
    const gen = GEN[ch] || GEN['.'];
    const g = vide(ch === '~' ? 'f' : 'n');
    gen(g, AMP.hasard(AMP.hacher(ch) + variante * 7919), frame);
    return (cache[cle] = SP.grille(lignes(g), theme));
  };

  // ---------- Personnages (16×16) ----------
  // c/d : casque, g/f : bleu de travail, t : peau, u : cheveux, 3 : pantalon, x : chaussures.
  const HEROS = {
    bas: [
      '................', '.....cccccc.....', '....cddddddc....', '...cccccccccc...', '....uttttttu....', '....t0tttt0t....',
      '....tttttttt....', '.....tt00tt.....', '....ffggggff....', '...tfggdgggft...', '...tfggggggft...', '....ffffffff....',
      '....33333333....', '....333..333....', '....xxx..xxx....', '................'],
    bas2: [
      '................', '.....cccccc.....', '....cddddddc....', '...cccccccccc...', '....uttttttu....', '....t0tttt0t....',
      '....tttttttt....', '.....tt00tt.....', '....ffggggff....', '...tfggdgggft...', '...tfggggggft...', '....ffffffff....',
      '....33333333....', '....33....333...', '....xx....xxx...', '................'],
    haut: [
      '................', '.....cccccc.....', '....cddddddc....', '...cccccccccc...', '....uuuuuuuu....', '....uuuuuuuu....',
      '....tuuuuuut....', '.....tttttt.....', '....ffggggff....', '...tfggggggft...', '...tfggggggft...', '....ffffffff....',
      '....33333333....', '....333..333....', '....xxx..xxx....', '................'],
    haut2: [
      '................', '.....cccccc.....', '....cddddddc....', '...cccccccccc...', '....uuuuuuuu....', '....uuuuuuuu....',
      '....tuuuuuut....', '.....tttttt.....', '....ffggggff....', '...tfggggggft...', '...tfggggggft...', '....ffffffff....',
      '....33333333....', '...333....33....', '...xxx....xx....', '................'],
    cote: [
      '................', '.....cccccc.....', '....cddddddcc...', '....ccccccccccc.', '.....uutttttt...', '.....utttt0tt...',
      '.....utttttttt..', '.......tttt.....', '.....fggggff....', '.....fgggttt....', '.....fggggff....', '.....ffffff.....',
      '.....333333.....', '.....33..33.....', '.....xx..xx.....', '................'],
    cote2: [
      '................', '.....cccccc.....', '....cddddddcc...', '....ccccccccccc.', '.....uutttttt...', '.....utttt0tt...',
      '.....utttttttt..', '.......tttt.....', '.....fggggff....', '.....fgggttt....', '.....fggggff....', '.....ffffff.....',
      '......3333......', '......3333......', '......xxxx......', '................']
  };
  // Variantes de PNJ : on change le casque, la tenue et la peau.
  SP.TENUES = [
    {}, { c: 'q', d: 'r', f: 'j', g: 'k' }, { c: 'n', d: 'o', f: 'b', g: 'c', t: 'v' }, { c: 'f', d: 'g', f: '4', g: '6' },
    { c: 'j', d: 'k', f: 'n', g: 'o', t: 'v', u: '0' }, { c: '5', d: '7', f: 'q', g: 'r' }, { c: 'b', d: 'c', f: 'e', g: 'f', t: 'v', u: 'x' }
  ];
  const persoCache = {};
  // dir : 'bas' | 'haut' | 'gauche' | 'droite' ; pas : 0 ou 1 ; tenue : index dans SP.TENUES.
  SP.perso = function (dir, pas, tenue) {
    const cle = dir + pas + '|' + (tenue || 0);
    if (persoCache[cle]) return persoCache[cle];
    const base = dir === 'gauche' || dir === 'droite' ? 'cote' : dir;
    const g = HEROS[base + (pas ? '2' : '')];
    return (persoCache[cle] = SP.grille(g, SP.TENUES[tenue || 0], dir === 'gauche'));
  };

  // ---------- Parasites (16×16, affichés ×2 en combat) ----------
  SP.PARASITES = {
    'court-jus': { nom: 'Court-Jus', faiblesse: 'eclair', g: [
      '.......d........', '......dd...d....', '..d...dcd.dd....', '...dddcccdd.....', '....dcccccd..d..', '.ddccwcccwccdd..',
      '...dcw0cc0wcd...', '...dccccccccd...', '..ddcc0000ccdd..', '....dcc00ccd....', '...dd.dccd.dd...', '..d....dd....d..',
      '......d..d......', '.....d....d.....', '................', '................'] },
    'ohmlette': { nom: 'Ohmlette', faiblesse: 'arc', g: [
      '................', '......xxxx......', '....xxvvvvxx....', '...xvvvvvvvvx...', '..xvwwvvvvwwvx..', '..xvw0vvvv0wvx..',
      '.xvvvvvvvvvvvvx.', 'xqqvvccvvddvvqqx', 'xvqvvccvvddvqvvx', '.xvvvvv00vvvvvx.', '..xvvvv00vvvvx..', '...xxvvvvvvxx...',
      '.....xxxxxx.....', '....66....66....', '....66....66....', '................'] },
    'spectre': { nom: 'Spectre Réactif', faiblesse: 'diagnostic', g: [
      '................', '.....iiiiii.....', '....ijjjjjji....', '...ijkkkkkkji...', '..ijkwwkkwwkji..', '..ijkw0kkw0kji..',
      '..ijkkkkkkkkji..', '..ijkkk00kkkji..', '..ijkkkkkkkkji..', '..ijjkkkkkkjji..', '..ijjjkkkkjjji..', '..ijjjjjjjjjji..',
      '..ij.ijj.jji.ji.', '..i...ii..i...i.', '................', '................'] },
    'fuite': { nom: 'Fuite-à-la-Terre', faiblesse: 'contre', g: [
      '................', '................', '................', '................', '.......gg.......', '......gffg......',
      '.....gffffg.....', '....gfwffwfg....', '...gff0ff0ffg...', '..gfffffffffff..', '.gffff0000ffffg.', 'gfeeffffffffeefg',
      'geeeeeeeeeeeeeeg', '.eeeeeeeeeeeeee.', '..ee..eeee..ee..', '................'] },
    'harmonique': { nom: 'Harmonique', faiblesse: 'soudure', g: [
      '................', '..........qq....', '.........qwwq...', '........qw0wq...', '.......qqqqqqr..', '......qq...rr...',
      '.....qq.........', '....qq....rr....', '...qq....qqqq...', '..qq....qq..qq..', '.qq....qq....qq.', 'qq....qq......q.',
      '.qq..qq.........', '..qqqq..........', '...rr...........', '................'] }
  };
  const parasiteCache = {};
  SP.parasite = function (espece, theme) {
    const cle = espece + JSON.stringify(theme || {});
    if (!parasiteCache[cle]) parasiteCache[cle] = SP.grille(SP.PARASITES[espece].g, theme);
    return parasiteCache[cle];
  };

  // ---------- Gardien (boss, 24×24) : transformateur corrompu ----------
  const GARDIEN = [
    '........gg......gg......', '........gf......fg......', '.......4444....4444.....', '.......4554....4554.....',
    '...4444444444444444444..', '..455555555555555555554.', '..45qqq55555555555qqq54.', '..45qrq5d555555d5qrq554.',
    '..45qqq55555555555qqq54.', '..455555555555555555554.', '..45550000000000000555 4'.replace(' ', '5'), '..4555rrrrrrrrrrrr05554.',
    '..455505555555555505554.', '..4555000000000000055554'.slice(0, 23) + '.', '..455555555555555555554.', '.c4cccccc4444444cccccc4c',
    '.c4c55c55c55c55c55c55c4c'.slice(0, 24), '.c4cccccc4444444cccccc4c', '..455555555555555555554.', '..444444444444444444444.',
    '...44.............44....', '..4444...........4444...', '..4444...........4444...', '........................'
  ].map(function (l) { return (l + '........................').slice(0, 24); });
  SP.gardien = function (theme) { return SP.grille(GARDIEN, theme); };

  // ---------- Objets du village ----------
  SP.maison = function () {
    const g = [];
    for (let y = 0; y < 48; y++) g.push(new Array(48).fill('.'));
    const p = function (x, y, c) { if (x >= 0 && y >= 0 && x < 48 && y < 48) g[y][x] = c; };
    for (let y = 18; y < 46; y++) for (let x = 4; x < 44; x++) p(x, y, (y % 6 === 0) ? 'u' : 's');
    for (let y = 0; y < 22; y++) for (let x = 22 - y - 2; x < 26 + y + 2; x++) p(x, y + 2, y % 4 === 0 ? 'p' : 'q');
    for (let y = 32; y < 46; y++) for (let x = 20; x < 28; x++) p(x, y, 'v');
    p(26, 39, 'd');
    [[9, 26], [33, 26]].forEach(function (o) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) p(o[0] + x, o[1] + y, (x === 0 || y === 0 || x === 7 || y === 7 || x === 4 || y === 4) ? 'x' : 'h'); });
    for (let x = 4; x < 44; x++) p(x, 46, 'x');
    return SP.grille(g.map(function (r) { return r.join(''); }));
  };
  // Transformateur central (32×32). allume : nombre de régions restaurées (0 à 6).
  SP.transfo = function (allume) {
    const g = [];
    for (let y = 0; y < 32; y++) g.push(new Array(32).fill('.'));
    const p = function (x, y, c) { if (x >= 0 && y >= 0 && x < 32 && y < 32) g[y][x] = c; };
    for (let y = 8; y < 30; y++) for (let x = 4; x < 28; x++) p(x, y, x === 4 || x === 27 || y === 29 ? '3' : (x % 4 === 0 ? '4' : '5'));
    for (let k = 0; k < 3; k++) for (let y = 1; y < 9; y++) { p(8 + k * 8, y, '6'); p(9 + k * 8, y, '7'); if (y % 2) { p(7 + k * 8, y, '4'); p(10 + k * 8, y, '4'); } }
    for (let k = 0; k < 6; k++) { const c = k < allume ? (k % 2 ? 'g' : 'd') : '2'; for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) p(7 + k * 3 + x, 13 + y, c); }
    for (let x = 8; x < 24; x++) p(x, 20, 'd'); p(15, 22, 'q'); p(16, 22, 'q'); p(15, 23, 'q'); p(16, 24, 'q');
    for (let x = 2; x < 30; x++) p(x, 30, '1');
    return SP.grille(g.map(function (r) { return r.join(''); }));
  };

  // ---------- Couleurs utilitaires ----------
  // Version désaturée et assombrie d'un canvas (région hors tension).
  SP.desaturer = function (src, force) {
    const c = canvas(src.width, src.height), x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      d[i] = (d[i] * (1 - force) + l * force) * 0.62 + 6;
      d[i + 1] = (d[i + 1] * (1 - force) + l * force) * 0.62 + 8;
      d[i + 2] = (d[i + 2] * (1 - force) + l * force) * 0.62 + 18;
    }
    x.putImageData(im, 0, 0);
    return c;
  };
})(typeof window !== 'undefined' ? window : globalThis);
