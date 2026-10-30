import { newGame, findRuns, findMoves, playMove, goalState, isWon, usePower, shuffle, bonusPhase, N, starsFor } from '../js/engine.js';
import { assert, eq, at, grid, firstClear } from './helpers.js';

const noEmpty = g => { for (let i = 0; i < N; i++) if (!g.hole[i] && !g.stone[i] && !g.cells[i]) return false; return true; };

test('la grille de test ne contient aucun alignement', () => {
  eq(findRuns(grid()).length, 0);
});

test('détecte un alignement horizontal et vertical', () => {
  const g = grid({ '1,0': '0', '1,1': '0', '1,2': '0', '4,6': '1', '5,6': '1', '6,6': '1' });
  const runs = findRuns(g);
  eq(runs.length, 2);
  assert(runs.some(r => r.h && r.cells.length === 3) && runs.some(r => !r.h && r.cells.length === 3));
});

test('échange sans alignement : refusé, grille et coups intacts', () => {
  const g = grid();
  const before = g.cells.map(p => p.id).join();
  const ev = [];
  eq(playMove(g, at(0, 0), at(0, 1), ev), false);
  eq(g.cells.map(p => p.id).join(), before);
  eq(g.moves, 20);
  eq(ev[0], { t: 'swap', a: 0, b: 1, ok: false });
});

test('échange valide : 3 pièces disparaissent, un coup est consommé, la grille est remplie', () => {
  const g = grid({ '3,0': '0', '3,1': '0', '4,2': '0' });
  const ev = [];
  assert(playMove(g, at(4, 2), at(3, 2), ev));
  eq(g.moves, 19);
  eq(firstClear(ev).cleared.length, 3);
  assert(g.stat.col[0] >= 3);
  assert(noEmpty(g), 'cases vides après la chute');
  eq(findRuns(g).length, 0);
});

test('4 en ligne : Épée tournoyante à la case jouée', () => {
  const g = grid({ '3,0': '0', '3,1': '0', '3,3': '0', '4,2': '0' });
  const ev = [];
  playMove(g, at(4, 2), at(3, 2), ev);
  const c = firstClear(ev);
  eq(c.created.length, 1);
  eq(c.created[0].i, at(3, 2));
  eq(c.created[0].p.sp, 'row');
  eq(g.stat.swords, 1);
});

test('4 en colonne : Épée tournoyante verticale', () => {
  const g = grid({ '1,4': '1', '2,4': '1', '4,4': '1', '3,5': '1' });
  const ev = [];
  playMove(g, at(3, 5), at(3, 4), ev);
  eq(firstClear(ev).created[0].p.sp, 'col');
});

test('forme en L : Catapulte', () => {
  const g = grid({ '2,2': '0', '2,3': '0', '3,4': '0', '0,4': '0', '1,4': '0' });
  const ev = [];
  playMove(g, at(3, 4), at(2, 4), ev);
  const c = firstClear(ev);
  eq(c.cleared.length, 5);
  eq(c.created[0].p.sp, 'bomb');
  eq(c.created[0].i, at(2, 4));
});

test('forme en T : Catapulte', () => {
  const g = grid({ '5,1': '1', '5,3': '1', '6,2': '1', '7,2': '1', '4,2': '1' });
  // 4,2 descend en 5,2 : ligne 5 (1,2,3) + colonne 2 (5,6,7)
  const ev = [];
  playMove(g, at(4, 2), at(5, 2), ev);
  eq(firstClear(ev).created[0].p.sp, 'bomb');
});

test('5 en ligne : Graal Sacré', () => {
  const g = grid({ '6,0': '0', '6,1': '0', '6,3': '0', '6,4': '0', '5,2': '0' });
  const ev = [];
  playMove(g, at(5, 2), at(6, 2), ev);
  const c = firstClear(ev);
  eq(c.created[0].p.sp, 'grail');
  eq(c.created[0].i, at(6, 2));
  eq(g.stat.grails, 1);
});

test("une Épée tournoyante alignée détruit toute sa ligne", () => {
  const g = grid({ '3,0': '0r', '3,1': '0', '4,2': '0' });
  const ev = [];
  playMove(g, at(4, 2), at(3, 2), ev);
  const c = firstClear(ev);
  eq(c.cleared.length, 8);
  assert(c.fx.some(f => f.k === 'row'));
});

test('une Catapulte alignée fait exploser une zone 3x3', () => {
  const g = grid({ '3,3': '0b', '3,4': '0', '4,5': '0' });
  const ev = [];
  playMove(g, at(4, 5), at(3, 5), ev);
  // 3 alignées + 3x3 autour de (3,3) = 9 cases, dont 2 déjà comptées
  eq(firstClear(ev).cleared.length, 10);
});

test('Graal Sacré + pièce : toutes les pièces de cette couleur disparaissent', () => {
  const g = grid({ '0,0': 'G' });
  const threes = g.cells.filter(p => p && p.c === 3).length; // 3 est en (0,1)
  const ev = [];
  assert(playMove(g, at(0, 0), at(0, 1), ev));
  const c = firstClear(ev);
  eq(c.cleared.filter(p => p.c === 3).length, threes);
  eq(c.cleared.filter(p => p.c !== 3 && p.c !== -1).length, 0);
});

test('Graal Sacré + Graal Sacré : toute la grille', () => {
  const g = grid({ '0,0': 'G', '0,1': 'G' });
  const ev = [];
  playMove(g, at(0, 0), at(0, 1), ev);
  eq(firstClear(ev).cleared.length, 64);
  eq(g.stat.xGrail2, 1);
});

test('Épée + Épée : une croix (ligne + colonne)', () => {
  const g = grid({ '4,4': '0r', '4,5': '1c' });
  const ev = [];
  playMove(g, at(4, 4), at(4, 5), ev);
  eq(firstClear(ev).cleared.length, 15);
  eq(g.stat.xCross, 1);
});

test('Catapulte + Épée : 3 lignes et 3 colonnes', () => {
  const g = grid({ '4,4': '0b', '4,5': '1r' });
  const ev = [];
  playMove(g, at(4, 4), at(4, 5), ev);
  eq(firstClear(ev).cleared.length, 3 * 8 + 3 * 8 - 9);
  eq(g.stat.xBombSword, 1);
});

test('Catapulte + Catapulte : zone 5x5', () => {
  const g = grid({ '4,4': '0b', '4,5': '1b' });
  const ev = [];
  playMove(g, at(4, 4), at(4, 5), ev);
  eq(firstClear(ev).cleared.length, 25);
});

test('Graal Sacré + Épée : toute la couleur devient des Épées qui se déclenchent', () => {
  const g = grid({ '7,0': 'G', '7,1': '3r' });
  const ev = [];
  playMove(g, at(7, 0), at(7, 1), ev);
  assert(ev.some(e => e.t === 'convert'), 'conversion attendue');
  assert(firstClear(ev).cleared.length > 30);
});

test('toile : libérée quand la pièce posée dessus disparaît', () => {
  const g = grid({ '3,0': '0w', '3,1': '0w', '4,2': '0' }, { goals: [{ type: 'web' }] });
  eq(g.websTotal, 2);
  playMove(g, at(4, 2), at(3, 2), []);
  eq(g.web[at(3, 0)] + g.web[at(3, 1)], 0);
  assert(isWon(g));
});

test('pierre : abîmée par un alignement voisin, cassée au dernier coup', () => {
  const g = grid({ '2,0': 's2', '3,0': '0', '3,1': '0', '4,2': '0' }, { goals: [{ type: 'stone' }] });
  playMove(g, at(4, 2), at(3, 2), []);
  eq(g.stone[at(2, 0)], 1);
  eq(goalState(g)[0].have, 1);
  assert(!isWon(g));
});

test('les pièces traversent trous et pierres en tombant', () => {
  const g = grid({ '5,0': 'x', '6,0': 's3', '7,1': '0', '7,2': '0', '6,3': '0' });
  playMove(g, at(6, 3), at(7, 3), []);
  assert(noEmpty(g));
  eq(g.cells[at(5, 0)], null);
});

test('relique : sort en bas de la grille et compte pour l\'objectif', () => {
  const g = grid({ '6,4': 'R', '7,2': '0', '7,3': '0', '7,5': '0' }, { goals: [{ type: 'relic', count: 1 }] });
  const ev = [];
  assert(playMove(g, at(7, 5), at(7, 4), ev));
  assert(ev.some(e => e.t === 'exit'), 'la relique doit sortir');
  eq(g.stat.relics, 1);
  assert(isWon(g));
});

test('une relique ne peut pas être détruite par une explosion', () => {
  const g = grid({ '2,2': 'R', '3,2': '0b', '3,3': '0', '4,4': '0' }, { goals: [{ type: 'relic', count: 3 }] });
  playMove(g, at(4, 4), at(3, 4), []);
  assert(g.cells.some(p => p && p.relic));
});

test('grilles de départ : aucun alignement et au moins un coup (300 grilles)', () => {
  const layouts = [
    ['........', '........', '........', '........', '........', '........', '........', '........'],
    ['__....__', '_......_', '...ww...', '..1..1..', '........', '..2..2..', '_......_', '__....__'],
    ['_wwwwww_', 'ww....ww', 'w......w', 'w..__..w', 'w..__..w', 'w......w', 'ww....ww', '_wwwwww_'],
  ];
  for (let s = 1; s <= 100; s++) for (const [k, layout] of layouts.entries()) {
    const g = newGame({ moves: 20, colors: 4 + (s % 3), layout, goals: [{ type: 'relic', count: 2 }], stars: [0, 1, 2] }, s * 31 + k);
    eq(findRuns(g).length, 0, `graine ${s} forme ${k}`);
    assert(findMoves(g).length > 0, `aucun coup, graine ${s}`);
  }
});

test('mélange : garantit un coup possible et aucun alignement', () => {
  const g = newGame({ moves: 20, colors: 6, layout: Array(8).fill('........'), goals: [{ type: 'score', target: 1 }], stars: [0, 1, 2] }, 5);
  for (let k = 0; k < 20; k++) {
    const ev = [];
    shuffle(g, ev);
    eq(ev[0].t, 'shuffle');
    eq(findRuns(g).length, 0);
    assert(findMoves(g).length > 0);
  }
});

test('une partie complète jouée au hasard reste cohérente', () => {
  const g = newGame({ moves: 40, colors: 5, layout: ['__....__', '_......_', '..ww....', '...1....', '........', '..2..2..', '_......_', '__....__'], goals: [{ type: 'relic', count: 3 }, { type: 'web' }], stars: [0, 1, 2] }, 99);
  let n = 0;
  while (g.moves > 0 && n++ < 100) {
    const ms = findMoves(g);
    assert(ms.length > 0, 'plus de coup possible sans mélange');
    const [a, b] = ms[n % ms.length];
    assert(playMove(g, a, b, []));
    assert(noEmpty(g), 'case vide');
    eq(findRuns(g).length, 0, 'alignement non résolu');
    assert(g.cells.filter(p => p && p.relic).length <= 2, 'trop de reliques');
  }
});

test('étoiles et bonus des coups restants', () => {
  const g = grid({ '3,0': '0', '3,1': '0', '4,2': '0' }, { goals: [{ type: 'score', target: 50 }], stars: [50, 2000, 1e9] });
  playMove(g, at(4, 2), at(3, 2), []);
  assert(isWon(g));
  eq(starsFor(g), 1);
  const left = bonusPhase(g, []);
  eq(left, 19);
  eq(g.moves, 0);
  eq(starsFor(g), 2);
});

test('pouvoirs : Arthur, Gauvain, Merlin, Lancelot', () => {
  const g = grid();
  assert(usePower(g, 'toRow', at(2, 2), []));
  assert(g.cells.some(p => p && ['row', 'col'].includes(p.sp)));
  assert(usePower(g, 'moves3', null, []));
  eq(g.moves, 23);
  assert(usePower(g, 'shuffle', null, []));
  assert(findMoves(g).length > 0);
  const ev = [];
  assert(usePower(g, 'col', at(0, 6), ev));
  assert(firstClear(ev).cleared.length >= 8);
  assert(noEmpty(g));
});

test('pouvoir de la Dame du Lac : retire 3 toiles', () => {
  const g = grid({ '0,0': '2w', '5,5': '3w', '6,1': '4w', '7,7': '5w' }, { goals: [{ type: 'web' }] });
  usePower(g, 'webs3', null, []);
  assert(g.stat.webs >= 3);
});

test('pouvoirs de Keu, Tristan et Galaad', () => {
  const g = grid({}, { goals: [{ type: 'collect', color: 2, count: 30 }] });
  const ev = [];
  assert(usePower(g, 'goal6', null, ev));
  const c = firstClear(ev);
  eq(c.cleared.filter(p => p.c === 2).length >= 6, true, 'Keu range la couleur demandée');
  const g2 = grid();
  const ev2 = [];
  assert(usePower(g2, 'arrows', null, ev2));
  eq(firstClear(ev2).cleared.length >= 8, true, 'une flèche par colonne');
  const g3 = grid();
  assert(usePower(g3, 'bombs2', null, []));
  eq(g3.cells.filter(p => p && p.sp === 'bomb').length >= 2, true, 'deux Catapultes');
  assert(noEmpty(g2));
});

test('pouvoirs de Bédivère (diagonales) et Iseut (3 spéciales)', () => {
  const g = grid();
  const ev = [];
  assert(usePower(g, 'diag', at(3, 3), ev));
  eq(firstClear(ev).cleared.length >= 14, true, 'deux diagonales depuis (3,3) : 8 + 7 cases, dont une commune');
  assert(noEmpty(g));
  eq(usePower(grid(), 'diag', null, []), false, 'il faut choisir une case');
  const g2 = grid();
  assert(usePower(g2, 'mix3', null, []));
  eq(g2.cells.filter(p => p && p.sp).length >= 3, true, 'trois pièces spéciales');
});
