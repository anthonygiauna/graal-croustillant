import { bestMove, canSwap, newGame, rateMove, findMoves } from '../js/engine.js';
import { assert, eq, at, grid } from './helpers.js';

const same = (m, a, b) => (m.a === a && m.b === b) || (m.a === b && m.b === a);
// Deux coups possibles : A aligne trois pièces de couleur 1, B aligne cinq pièces de couleur 0 (Graal Sacré).
const twoMoves = (extra = {}) => ({ '3,0': '1', '3,1': '1', '4,2': '1', '6,3': '0', '6,4': '0', '6,6': '0', '6,7': '0', '5,5': '0', ...extra });

test('meilleur coup : l\'objectif passe avant les pièces spéciales et le score', () => {
  const g = grid(twoMoves(), { goals: [{ type: 'collect', color: 1, count: 10 }] });
  const m = bestMove(g);
  assert(same(m, at(4, 2), at(3, 2)), 'il fallait aligner la couleur demandée, obtenu ' + JSON.stringify(m));
});

test('meilleur coup : à objectif égal, la pièce spéciale l\'emporte', () => {
  const g = grid(twoMoves(), { goals: [{ type: 'collect', color: 5, count: 0 }] });
  const m = bestMove(g);
  assert(same(m, at(5, 5), at(6, 5)), 'il fallait créer le Graal Sacré');
  eq(m.key[1] >= 1, true);
});

test('meilleur coup : libérer des toiles plutôt que créer une spéciale', () => {
  const g = grid(twoMoves({ '3,0': '1w', '3,1': '1w' }), { goals: [{ type: 'web' }] });
  assert(same(bestMove(g), at(4, 2), at(3, 2)));
});

test('meilleur coup : faire descendre une relique', () => {
  const g = grid({ '5,4': 'R', '6,2': '1', '6,3': '1', '7,4': '1', '0,0': '0', '0,1': '0', '1,2': '0' }, { goals: [{ type: 'relic', count: 2 }] });
  assert(same(bestMove(g), at(7, 4), at(6, 4)));
});

test('meilleur coup : un combo Graal + Graal bat tout le reste', () => {
  const g = grid(twoMoves({ '0,6': 'G', '0,7': 'G' }), { goals: [{ type: 'collect', color: 1, count: 30 }] });
  assert(same(bestMove(g), at(0, 6), at(0, 7)));
});

test('meilleur coup : le score départage, clé = [objectif, spéciales, score]', () => {
  const g = grid(twoMoves(), { goals: [{ type: 'collect', color: 1, count: 10 }] });
  const k = rateMove(g, at(4, 2), at(3, 2));
  eq(k.length, 3);
  assert(k[0] >= 3 && k[2] >= 60);
});

test('meilleur coup : toujours un échange valide, résultat reproductible (40 grilles)', () => {
  for (let s = 1; s <= 40; s++) {
    const g = newGame({ moves: 20, colors: 4 + (s % 3), layout: Array(8).fill('........'), goals: [{ type: 'score', target: 9999 }], stars: [0, 1, 2] }, s);
    const m = bestMove(g), m2 = bestMove(g);
    assert(canSwap(g, m.a, m.b), 'coup invalide');
    eq([m.a, m.b], [m2.a, m2.b]);
    assert(findMoves(g).length >= 1);
  }
});

test('meilleur coup : assez rapide pour un téléphone (< 40 ms en moyenne)', () => {
  const g = newGame({ moves: 20, colors: 5, layout: Array(8).fill('........'), goals: [{ type: 'score', target: 9999 }], stars: [0, 1, 2] }, 3);
  const t = performance.now();
  for (let k = 0; k < 10; k++) bestMove(g);
  const avg = (performance.now() - t) / 10;
  assert(avg < 40, 'trop lent : ' + avg.toFixed(1) + ' ms');
});
