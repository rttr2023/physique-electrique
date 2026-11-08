// Ampéria — lecture des cartes ASCII (data/cartes/*.json) : cases, objets, zones, accessibilité.
// Fonctionne aussi dans Node (vérification des cartes).
(function (racine) {
  'use strict';
  const AMP = racine.AMP;
  const M = AMP.monde = AMP.monde || {};

  // Cases infranchissables (les portes A, B, C, X dépendent de leur état).
  M.SOLIDES = '#~o|LP012KHhTtng';
  M.PORTES = { A: 1, B: 2, C: 3 }; // porte → nombre de zones à avoir terminées pour l'ouvrir ; X = toutes

  M.analyserCarte = function (json) {
    const lignes = json.lignes;
    const h = lignes.length, w = lignes[0].length;
    const c = { nom: json.nom, w: w, h: h, lignes: lignes, cases: [], pnj: [], portes: [], portails: {}, chantiers: [], depart: null, sortie: null, pupitre: null, boss: null, mentor: null, maisons: [], transfo: null };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = lignes[y][x];
        const t = { x: x, y: y, c: ch };
        c.cases.push(t);
        if (ch === 'S') c.depart = t;
        else if (ch === 'E') c.sortie = t;
        else if (ch === 'P') c.pupitre = t;
        else if (ch === 'K') c.boss = t;
        else if (ch === 'n') c.mentor = t;
        else if (ch === 'H') c.maisons.push(t);
        else if (ch === 'T') c.transfo = t;
        else if (ch === 'g') c.chantiers.push(t);
        else if ('012'.indexOf(ch) >= 0) c.pnj.push({ x: x, y: y, zone: Number(ch) });
        else if ('ABCX'.indexOf(ch) >= 0) c.portes.push({ x: x, y: y, lettre: ch });
        else if ('abcdef'.indexOf(ch) >= 0) c.portails[ch] = t;
      }
    }
    c.nbZones = c.pnj.length ? Math.max.apply(null, c.pnj.map(function (p) { return p.zone; })) + 1 : 0;

    c.at = function (x, y) { return (x < 0 || y < 0 || x >= w || y >= h) ? '#' : lignes[y][x]; };
    // Une porte est ouverte quand `zonesFinies` zones sont terminées.
    c.porteOuverte = function (lettre, zonesFinies) {
      if (lettre === 'X') return zonesFinies >= c.nbZones;
      return zonesFinies >= M.PORTES[lettre];
    };
    c.solide = function (x, y, zonesFinies) {
      const ch = c.at(x, y);
      if ('ABCX'.indexOf(ch) >= 0) return !c.porteOuverte(ch, zonesFinies);
      return M.SOLIDES.indexOf(ch) >= 0;
    };
    // Cases atteignables depuis le départ.
    c.atteignables = function (zonesFinies) {
      const vu = new Uint8Array(w * h);
      if (!c.depart) return vu;
      const file = [[c.depart.x, c.depart.y]];
      vu[c.depart.y * w + c.depart.x] = 1;
      while (file.length) {
        const p = file.shift();
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          const x = p[0] + d[0], y = p[1] + d[1];
          if (x < 0 || y < 0 || x >= w || y >= h || vu[y * w + x] || c.solide(x, y, zonesFinies)) return;
          vu[y * w + x] = 1; file.push([x, y]);
        });
      }
      return vu;
    };
    // Un objet est accessible si on peut se tenir sur lui ou à côté de lui.
    c.accessible = function (pos, zonesFinies) {
      const vu = c.atteignables(zonesFinies);
      return [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) {
        const x = pos.x + d[0], y = pos.y + d[1];
        return x >= 0 && y >= 0 && x < w && y < h && vu[y * w + x];
      });
    };
    // Zone de chaque case : nombre de zones à terminer pour l'atteindre (pour placer la corruption).
    c.zoneDe = new Int8Array(w * h).fill(-1);
    for (let n = 0; n <= c.nbZones; n++) {
      const vu = c.atteignables(n);
      for (let i = 0; i < w * h; i++) if (vu[i] && c.zoneDe[i] < 0) c.zoneDe[i] = n;
    }
    return c;
  };
})(typeof window !== 'undefined' ? window : globalThis);
