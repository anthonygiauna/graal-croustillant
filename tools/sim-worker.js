// Travailleur du bot : règle un niveau puis le joue 200 fois.
// - niveaux « score / collecte » : on garde le nombre de coups prévu et on règle la quantité demandée ;
// - autres niveaux (toiles, pierres, reliques) : on règle le nombre de coups (10 au minimum).
import { botPlay } from '../js/engine.js';

const scaled = (level, k) => ({ ...level, goals: level.goals.map(x =>
  x.type === 'score' ? { ...x, target: Math.max(500, Math.round(x.target * k / 100) * 100) }
  : x.type === 'collect' ? { ...x, count: Math.max(5, Math.round(x.count * k / 5) * 5) } : x) });

const rate = (level, n, seed0) => {
  let wins = 0; const scores = [], left = [];
  for (let k = 0; k < n; k++) {
    const r = botPlay(level, seed0 + k * 7919);
    if (r.won) { wins++; scores.push(r.score); left.push(r.left); }
  }
  return { rate: wins / n, scores, left };
};

self.onmessage = ({ data }) => {
  const { target, tune, games } = data;
  let level = data.level;
  const t0 = performance.now();
  const scalable = level.goals.every(x => x.type === 'score' || x.type === 'collect');
  if (tune && scalable) {
    // Plus l'objectif est grand, moins le bot gagne (mêmes graines) : dichotomie sur le facteur.
    let lo = 0.3, hi = 60;
    for (let it = 0; it < 12; it++) {
      const mid = (lo + hi) / 2;
      if (rate(scaled(level, mid), 200, 1000).rate >= target) lo = mid; else hi = mid;
    }
    level = scaled(level, lo);
  } else if (tune) {
    let lo = 10, hi = 70;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (rate({ ...level, moves: mid }, 200, 1000).rate >= target) hi = mid; else lo = mid + 1;
    }
    level = { ...level, moves: lo };
  }
  const res = rate(level, games, 500000);
  const sc = res.scores.sort((a, b) => a - b);
  const pct = p => sc.length ? sc[Math.min(sc.length - 1, Math.floor(p * sc.length))] : 0;
  self.postMessage({ id: level.id, moves: level.moves, goals: level.goals, rate: res.rate, p50: pct(0.5), p85: pct(0.85),
    avgLeft: res.left.length ? res.left.reduce((a, b) => a + b, 0) / res.left.length : 0, ms: performance.now() - t0 });
};
