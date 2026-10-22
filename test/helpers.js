import { newGame, W } from '../js/engine.js';

export function assert(cond, msg = 'assertion') { if (!cond) throw new Error(msg); }
export function eq(a, b, msg = '') {
  if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg} attendu ${JSON.stringify(b)}, obtenu ${JSON.stringify(a)}`);
}

export const at = (r, c) => r * W + c;

// Grille de test : fond sans aucun alignement (couleurs 2 à 5 en damier décalé),
// puis cases imposées : { 'r,c': jeton }.
// Jetons : '0'..'5' couleur, suffixe r/c/b = Épée en ligne / en colonne / Catapulte,
// 'G' Graal Sacré, 'R' relique, 'x' hors grille, 's1'..'s3' pierre, suffixe 'w' = toile.
export function grid(over = {}, level = {}) {
  const tok = {};
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) tok[r + ',' + c] = String([[2, 3], [4, 5]][r % 2][c % 2]);
  Object.assign(tok, over);
  const layout = [];
  for (let r = 0; r < 8; r++) {
    let s = '';
    for (let c = 0; c < 8; c++) {
      const t = tok[r + ',' + c];
      s += t === 'x' ? '_' : t[0] === 's' ? t[1] : t.endsWith('w') ? 'w' : '.';
    }
    layout.push(s);
  }
  const g = newGame({ moves: 20, colors: 6, layout, goals: [{ type: 'score', target: 1e9 }], stars: [0, 1e9, 1e9], ...level }, 7);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const i = r * 8 + c;
    let t = tok[r + ',' + c];
    if (t === 'x' || t[0] === 's') { g.cells[i] = null; continue; }
    t = t.replace('w', '');
    if (t === 'R') g.cells[i] = { id: g.uid++, c: -1, sp: null, relic: true };
    else if (t === 'G') g.cells[i] = { id: g.uid++, c: -1, sp: 'grail' };
    else g.cells[i] = { id: g.uid++, c: +t[0], sp: { r: 'row', c: 'col', b: 'bomb' }[t[1]] || null };
  }
  return g;
}

export const firstClear = ev => ev.find(e => e.t === 'clear');
