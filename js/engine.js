// Moteur du jeu : grille, alignements, pièces spéciales, gravité, objectifs, meilleur coup.
// Aucun accès au DOM : le même code sert au jeu, aux tests et au bot de simulation.

export const W = 8, H = 8, N = W * H;

export const PIECES = [
  { id: 'graal', name: 'Graal', plural: 'Graals' },
  { id: 'fromage', name: 'Fromage', plural: 'Fromages' },
  { id: 'epee', name: 'Épée', plural: 'Épées' },
  { id: 'chope', name: 'Chope de cervoise', plural: 'Chopes' },
  { id: 'bouclier', name: 'Bouclier', plural: 'Boucliers' },
  { id: 'couronne', name: 'Couronne', plural: 'Couronnes' },
];

// ---------- Hasard reproductible (mulberry32) ----------
export const makeRng = seed => ({ s: seed >>> 0 });
export function rand(r) {
  let t = (r.s = (r.s + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ri = (r, n) => Math.floor(rand(r) * n);

const piece = (g, c, sp = null) => ({ id: g.uid++, c, sp });
const relic = g => ({ id: g.uid++, c: -1, sp: null, relic: true });
const colorAt = (g, i) => { const p = g.cells[i]; return !p || p.relic || p.sp === 'grail' ? -1 : p.c; };
const rowOf = i => (i / W) | 0, colOf = i => i % W;
export const adjacent = (a, b) => (Math.abs(a - b) === 1 && rowOf(a) === rowOf(b)) || Math.abs(a - b) === W;
function neighbors(i) {
  const r = rowOf(i), c = colOf(i), out = [];
  if (c > 0) out.push(i - 1); if (c < W - 1) out.push(i + 1);
  if (r > 0) out.push(i - W); if (r < H - 1) out.push(i + W);
  return out;
}
const playable = (g, i) => !g.hole[i] && !g.stone[i];

// ---------- Création d'une partie ----------
// Légende des niveaux : '.' case, '_' hors grille, 'w' toile, 'W' double toile, '1'..'3' pierre, 'r' relique.
export function newGame(level, seed = (Math.random() * 2 ** 32) >>> 0) {
  const g = {
    level, colors: level.colors || 5, moves: level.moves, score: 0, movesMade: 0,
    hole: new Uint8Array(N), web: new Uint8Array(N), stone: new Uint8Array(N),
    cells: new Array(N).fill(null), rng: makeRng(seed), uid: 1,
    relicsTotal: 0, relicEvery: level.relicEvery || 4, relicTimer: 0, relicSpawn: 0,
    stat: newStat(), lastCascade: 0,
  };
  const relicCells = [];
  level.layout.forEach((row, r) => {
    for (let c = 0; c < W; c++) {
      const ch = row[c] || '.', i = r * W + c;
      if (ch === '_') g.hole[i] = 1;
      else if (ch === 'w') g.web[i] = 1;
      else if (ch === 'W') g.web[i] = 2;
      else if (ch >= '1' && ch <= '3') g.stone[i] = +ch;
      else if (ch === 'r') relicCells.push(i);
    }
  });
  const rg = level.goals.find(x => x.type === 'relic');
  if (rg) {
    g.relicsTotal = rg.count;
    if (!relicCells.length) {
      const top = []; for (let i = 0; i < N && top.length < 8; i++) if (playable(g, i) && rowOf(i) < 2) top.push(i);
      while (relicCells.length < Math.min(2, rg.count) && top.length) relicCells.push(top.splice(ri(g.rng, top.length), 1)[0]);
    }
  }
  for (let tries = 0; ; tries++) {
    g.cells.fill(null);
    for (const i of relicCells) g.cells[i] = relic(g);
    for (let i = 0; i < N; i++) if (playable(g, i) && !g.cells[i]) g.cells[i] = piece(g, safeColor(g, i));
    if ((!findRuns(g).length && findMoves(g).length) || tries > 200) break;
  }
  g.websTotal = g.web.reduce((a, b) => a + b, 0);
  g.stonesTotal = g.stone.reduce((a, b) => a + b, 0);
  return g;
}

function newStat() {
  return { col: [0, 0, 0, 0, 0, 0], webs: 0, stones: 0, stonesBroken: 0, relics: 0, made: 0,
    swords: 0, bombs: 0, grails: 0, maxCascade: 0, shuffles: 0,
    xCross: 0, xBombSword: 0, xBombBomb: 0, xGrail: 0, xGrail2: 0 };
}

function safeColor(g, i) {
  const r = rowOf(i), c = colOf(i);
  let col;
  for (let t = 0; t < 30; t++) {
    col = ri(g.rng, g.colors);
    const h = c >= 2 && colorAt(g, i - 1) === col && colorAt(g, i - 2) === col;
    const v = r >= 2 && colorAt(g, i - W) === col && colorAt(g, i - 2 * W) === col;
    if (!h && !v) break;
  }
  return col;
}

export function clone(g) {
  return { ...g, web: g.web.slice(), stone: g.stone.slice(), cells: g.cells.slice(),
    rng: { s: g.rng.s }, stat: { ...g.stat, col: g.stat.col.slice() } };
}

export const snap = g => ({ cells: g.cells.slice(), web: g.web.slice(), stone: g.stone.slice(), score: g.score, moves: g.moves });

// ---------- Alignements ----------
export function findRuns(g) {
  const runs = [];
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W;) {
      const col = colorAt(g, r * W + c); let e = c + 1;
      if (col >= 0) while (e < W && colorAt(g, r * W + e) === col) e++;
      if (col >= 0 && e - c >= 3) { const cells = []; for (let k = c; k < e; k++) cells.push(r * W + k); runs.push({ cells, h: true, col }); }
      c = e;
    }
  }
  for (let c = 0; c < W; c++) {
    for (let r = 0; r < H;) {
      const col = colorAt(g, r * W + c); let e = r + 1;
      if (col >= 0) while (e < H && colorAt(g, e * W + c) === col) e++;
      if (col >= 0 && e - r >= 3) { const cells = []; for (let k = r; k < e; k++) cells.push(k * W + c); runs.push({ cells, h: false, col }); }
      r = e;
    }
  }
  return runs;
}

// Regroupe les alignements qui partagent une case (formes en L, en T, en croix).
export function findClusters(g) {
  const runs = findRuns(g);
  if (!runs.length) return [];
  const owner = new Int16Array(N).fill(-1), parent = runs.map((_, k) => k);
  const find = k => (parent[k] === k ? k : (parent[k] = find(parent[k])));
  runs.forEach((run, k) => run.cells.forEach(i => {
    if (owner[i] >= 0) parent[find(k)] = find(owner[i]); else owner[i] = k;
  }));
  const groups = new Map();
  runs.forEach((run, k) => { const root = find(k); if (!groups.has(root)) groups.set(root, []); groups.get(root).push(run); });
  return [...groups.values()].map(rs => ({ runs: rs, cells: [...new Set(rs.flatMap(r => r.cells))], col: rs[0].col }));
}

// Quelle pièce spéciale naît d'un groupe : 5 en ligne → Graal Sacré, L/T → Catapulte, 4 → Épée tournoyante.
export function clusterSpecial(cl, swapCells) {
  const longest = cl.runs.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
  const hasH = cl.runs.some(r => r.h), hasV = cl.runs.some(r => !r.h);
  let sp = null;
  if (longest.cells.length >= 5) sp = 'grail';
  else if (hasH && hasV) sp = 'bomb';
  else if (longest.cells.length === 4) sp = longest.h ? 'row' : 'col';
  if (!sp) return null;
  let at = swapCells ? swapCells.find(i => cl.cells.includes(i)) : undefined;
  if (at === undefined) {
    if (sp === 'bomb') {
      const hc = new Set(cl.runs.filter(r => r.h).flatMap(r => r.cells));
      at = cl.runs.filter(r => !r.h).flatMap(r => r.cells).find(i => hc.has(i));
    }
    if (at === undefined) at = longest.cells[longest.cells.length >> 1];
  }
  return { at, sp };
}

// ---------- Effets des pièces spéciales ----------
const rowCells = (g, r) => { const o = []; for (let c = 0; c < W; c++) if (!g.hole[r * W + c]) o.push(r * W + c); return o; };
const colCells = (g, c) => { const o = []; for (let r = 0; r < H; r++) if (!g.hole[r * W + c]) o.push(r * W + c); return o; };
function square(g, i, rad) {
  const o = [], r0 = rowOf(i), c0 = colOf(i);
  for (let r = r0 - rad; r <= r0 + rad; r++) for (let c = c0 - rad; c <= c0 + rad; c++)
    if (r >= 0 && r < H && c >= 0 && c < W && !g.hole[r * W + c]) o.push(r * W + c);
  return o;
}
const colorCells = (g, col) => { const o = []; for (let i = 0; i < N; i++) if (colorAt(g, i) === col) o.push(i); return o; };
export function commonColor(g) {
  const n = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) { const c = colorAt(g, i); if (c >= 0) n[c]++; }
  return n.indexOf(Math.max(...n));
}

function effectArea(g, i, p) {
  if (p.sp === 'row') return rowCells(g, rowOf(i));
  if (p.sp === 'col') return colCells(g, colOf(i));
  if (p.sp === 'bomb') return square(g, i, 1);
  return colorCells(g, commonColor(g)); // Graal Sacré touché par une explosion
}

// ---------- Une étape de destruction ----------
// clusters : alignements trouvés ; blast : { cells, fx, consumed } pour les combinaisons et pouvoirs.
function clearStep(g, clusters, blast, swapCells, cascade, ev) {
  const hit = new Uint8Array(N), matched = [], created = [], fx = blast ? blast.fx.slice() : [];
  for (const cl of clusters) {
    for (const i of cl.cells) { hit[i] = 1; matched.push(i); }
    const s = clusterSpecial(cl, swapCells);
    if (s) created.push({ i: s.at, p: s.sp === 'grail' ? piece(g, -1, 'grail') : piece(g, cl.col, s.sp) });
  }
  if (blast) for (const i of blast.cells) hit[i] = 1;
  // Réaction en chaîne : une spéciale touchée se déclenche à son tour.
  const fired = new Uint8Array(N), queue = [];
  for (let i = 0; i < N; i++) if (hit[i]) queue.push(i);
  while (queue.length) {
    const i = queue.pop(), p = g.cells[i];
    if (!p || !p.sp || fired[i]) continue;
    fired[i] = 1;
    const area = effectArea(g, i, p);
    fx.push({ k: p.sp, i, area });
    for (const j of area) if (!hit[j]) { hit[j] = 1; queue.push(j); }
  }
  const stoneHit = new Uint8Array(N);
  for (const i of matched) for (const j of neighbors(i)) if (g.stone[j]) stoneHit[j] = 1;
  const cleared = [];
  let pts = 0;
  for (let i = 0; i < N; i++) {
    if (g.hole[i]) continue;
    if (g.stone[i] && (stoneHit[i] || hit[i])) {
      g.stone[i]--; g.stat.stones++; pts += 40;
      if (!g.stone[i]) g.stat.stonesBroken++;
      continue;
    }
    if (!hit[i]) continue;
    const p = g.cells[i];
    if (p && p.relic) continue; // les reliques ne craignent rien
    if (g.web[i]) { g.web[i]--; g.stat.webs++; pts += 40; }
    if (p) { g.cells[i] = null; cleared.push(p); if (p.c >= 0) g.stat.col[p.c]++; pts += 20; }
  }
  for (const { i, p } of created) {
    g.cells[i] = p; g.stat.made++;
    if (p.sp === 'grail') { g.stat.grails++; pts += 300; }
    else if (p.sp === 'bomb') { g.stat.bombs++; pts += 150; }
    else { g.stat.swords++; pts += 100; }
  }
  if (blast && blast.consumed) for (const p of blast.consumed) { cleared.push(p); if (p.c >= 0) g.stat.col[p.c]++; }
  pts *= cascade;
  g.score += pts;
  if (ev) ev.push({ t: 'clear', cleared, created, fx, cascade, pts, snap: snap(g) });
}

// ---------- Gravité ----------
function colSlots(g, c) { // cases d'une colonne, du bas vers le haut (les pièces traversent trous et pierres)
  const o = [];
  for (let r = H - 1; r >= 0; r--) if (playable(g, r * W + c)) o.push(r * W + c);
  return o;
}

function gravity(g, ev) {
  const falls = [], empty = [];
  for (let c = 0; c < W; c++) {
    const slots = colSlots(g, c);
    let w = 0;
    for (let k = 0; k < slots.length; k++) {
      const p = g.cells[slots[k]];
      if (!p) continue;
      if (k !== w) { g.cells[slots[w]] = p; g.cells[slots[k]] = null; if (ev) falls.push({ id: p.id, to: slots[w] }); }
      w++;
    }
    for (let k = w; k < slots.length; k++) empty.push(slots[k]);
  }
  let relicAt = -1;
  if (g.relicSpawn && empty.length) { relicAt = ri(g.rng, empty.length); g.relicSpawn = 0; }
  const spawns = [];
  if (g.noRefill) return; // évaluation « humaine » du bot : on ne devine pas les pièces qui vont tomber
  empty.forEach((i, k) => {
    const p = k === relicAt ? relic(g) : piece(g, ri(g.rng, g.colors));
    g.cells[i] = p;
    if (ev) spawns.push({ p, i });
  });
  if (ev && (falls.length || spawns.length)) ev.push({ t: 'fall', falls, spawns, snap: snap(g) });
}

function exitRelics(g, ev) {
  const out = [];
  for (let c = 0; c < W; c++) {
    const slots = colSlots(g, c);
    const i = slots[0], p = i !== undefined && g.cells[i];
    if (p && p.relic) { g.cells[i] = null; out.push(p.id); g.stat.relics++; g.score += 1000; }
  }
  if (ev && out.length) ev.push({ t: 'exit', ids: out, snap: snap(g) });
  return out.length;
}

function settle(g, ev) {
  gravity(g, ev);
  while (exitRelics(g, ev)) gravity(g, ev);
}

function resolve(g, ev, swapCells, blast) {
  let cascade = 0;
  if (blast) { cascade = 1; clearStep(g, [], blast, swapCells, 1, ev); settle(g, ev); }
  for (;;) {
    const clusters = findClusters(g);
    if (!clusters.length) break;
    cascade++;
    clearStep(g, clusters, null, cascade === 1 ? swapCells : null, cascade, ev);
    settle(g, ev);
  }
  g.lastCascade = cascade;
  if (cascade > g.stat.maxCascade) g.stat.maxCascade = cascade;
  if (!g.noRefill && !findMoves(g).length) shuffle(g, ev);
}

// ---------- Coups possibles ----------
function comboOf(p, q) {
  if (p.relic || q.relic) return null;
  if (p.sp === 'grail' || q.sp === 'grail') return 'grail';
  if (p.sp && q.sp) return 'double';
  return null;
}

function runAt(g, i) {
  const col = colorAt(g, i);
  if (col < 0) return false;
  const r = rowOf(i), c = colOf(i);
  let n = 1;
  for (let k = c - 1; k >= 0 && colorAt(g, r * W + k) === col; k--) n++;
  for (let k = c + 1; k < W && colorAt(g, r * W + k) === col; k++) n++;
  if (n >= 3) return true;
  n = 1;
  for (let k = r - 1; k >= 0 && colorAt(g, k * W + c) === col; k--) n++;
  for (let k = r + 1; k < H && colorAt(g, k * W + c) === col; k++) n++;
  return n >= 3;
}

export function canSwap(g, a, b) {
  const p = g.cells[a], q = g.cells[b];
  if (!p || !q || !adjacent(a, b)) return false;
  if (comboOf(p, q)) return true;
  g.cells[a] = q; g.cells[b] = p;
  const ok = runAt(g, a) || runAt(g, b);
  g.cells[a] = p; g.cells[b] = q;
  return ok;
}

export function findMoves(g) {
  const out = [];
  for (let i = 0; i < N; i++) {
    if (!g.cells[i]) continue;
    if (colOf(i) < W - 1 && canSwap(g, i, i + 1)) out.push([i, i + 1]);
    if (rowOf(i) < H - 1 && canSwap(g, i, i + W)) out.push([i, i + W]);
  }
  return out;
}

// ---------- Mélange ----------
export function shuffle(g, ev) {
  const idx = [];
  for (let i = 0; i < N; i++) if (g.cells[i] && !g.cells[i].relic) idx.push(i);
  for (let t = 0; t < 120; t++) {
    const ps = idx.map(i => g.cells[i]);
    for (let k = ps.length - 1; k > 0; k--) { const j = ri(g.rng, k + 1); [ps[k], ps[j]] = [ps[j], ps[k]]; }
    if (t > 60) for (let k = 0; k < ps.length; k++) if (!ps[k].sp) ps[k] = { ...ps[k], c: ri(g.rng, g.colors) };
    idx.forEach((i, k) => { g.cells[i] = ps[k]; });
    if (!findRuns(g).length && findMoves(g).length) break;
  }
  g.stat.shuffles++;
  if (ev) ev.push({ t: 'shuffle', snap: snap(g) });
}

// ---------- Un coup de la joueuse ----------
function tickRelics(g) {
  if (!g.relicsTotal) return;
  let on = 0;
  for (const p of g.cells) if (p && p.relic) on++;
  if (on >= 2 || on + g.stat.relics >= g.relicsTotal) return;
  if (++g.relicTimer >= g.relicEvery || on === 0) { g.relicTimer = 0; g.relicSpawn = 1; }
}

function comboBlast(g, a, b, ev) {
  // Après l'échange, la pièce déplacée par la joueuse est en b.
  const pa = g.cells[b], pb = g.cells[a];
  const consumed = [pa, pb];
  g.cells[a] = null; g.cells[b] = null;
  const fx = [];
  let cells;
  if (pa.sp === 'grail' || pb.sp === 'grail') {
    const other = pa.sp === 'grail' ? pb : pa, gi = pa.sp === 'grail' ? b : a;
    if (other.sp === 'grail') {
      g.stat.xGrail2++;
      cells = []; for (let i = 0; i < N; i++) if (!g.hole[i]) cells.push(i);
      fx.push({ k: 'all', i: b, area: cells });
    } else if (!other.sp) {
      g.stat.xGrail++;
      cells = colorCells(g, other.c);
      fx.push({ k: 'grail', i: gi, area: cells });
      cells.push(a, b);
    } else {
      g.stat.xGrail++;
      cells = colorCells(g, other.c);
      for (const i of cells) if (!g.cells[i].sp) g.cells[i] = piece(g, other.c, other.sp === 'bomb' ? 'bomb' : (rand(g.rng) < 0.5 ? 'row' : 'col'));
      if (ev) ev.push({ t: 'convert', cells: cells.slice(), snap: snap(g) });
      fx.push({ k: 'grail', i: gi, area: cells.slice() });
      cells.push(a, b);
    }
  } else {
    const bombs = (pa.sp === 'bomb') + (pb.sp === 'bomb');
    const r = rowOf(b), c = colOf(b);
    if (bombs === 0) {
      g.stat.xCross++;
      cells = [...rowCells(g, r), ...colCells(g, c)];
      fx.push({ k: 'row', i: b, area: rowCells(g, r) }, { k: 'col', i: b, area: colCells(g, c) });
    } else if (bombs === 1) {
      g.stat.xBombSword++;
      cells = [];
      for (let d = -1; d <= 1; d++) {
        if (r + d >= 0 && r + d < H) { const rc = rowCells(g, r + d); cells.push(...rc); fx.push({ k: 'row', i: (r + d) * W + c, area: rc }); }
        if (c + d >= 0 && c + d < W) { const cc = colCells(g, c + d); cells.push(...cc); fx.push({ k: 'col', i: r * W + c + d, area: cc }); }
      }
    } else {
      g.stat.xBombBomb++;
      cells = square(g, b, 2);
      fx.push({ k: 'bomb2', i: b, area: cells });
    }
    cells.push(a, b);
  }
  return { cells, fx, consumed };
}

export function playMove(g, a, b, ev) {
  const pa = g.cells[a], pb = g.cells[b];
  if (!pa || !pb || !adjacent(a, b) || g.moves <= 0) return false;
  const combo = comboOf(pa, pb);
  g.cells[a] = pb; g.cells[b] = pa;
  if (!combo && !runAt(g, a) && !runAt(g, b)) {
    g.cells[a] = pa; g.cells[b] = pb;
    if (ev) ev.push({ t: 'swap', a, b, ok: false });
    return false;
  }
  if (ev) ev.push({ t: 'swap', a, b, ok: true });
  g.moves--; g.movesMade++;
  tickRelics(g);
  const blast = combo ? comboBlast(g, a, b, ev) : null;
  resolve(g, ev, [b, a], blast);
  return true;
}

// ---------- Objectifs, étoiles ----------
export function goalState(g) {
  return g.level.goals.map(x => {
    let have = 0, need = 0;
    if (x.type === 'score') { need = x.target; have = g.score; }
    else if (x.type === 'collect') { need = x.count; have = g.stat.col[x.color]; }
    else if (x.type === 'web') { need = g.websTotal; have = g.stat.webs; }
    else if (x.type === 'stone') { need = g.stonesTotal; have = g.stat.stones; }
    else if (x.type === 'relic') { need = x.count; have = g.stat.relics; }
    return { ...x, need, have: Math.min(have, need), done: have >= need };
  });
}
export const isWon = g => goalState(g).every(x => x.done);
export function starsFor(g) {
  if (!isWon(g)) return 0;
  const s = g.level.stars || [0, 1e9, 1e9];
  return 1 + (g.score >= s[1]) + (g.score >= s[2]);
}

// Coups restants → Épées tournoyantes qui partent toutes seules, plus 200 points par coup.
export function bonusPhase(g, ev) {
  const left = g.moves;
  if (left <= 0) return 0;
  g.score += left * 200;
  const pool = [];
  for (let i = 0; i < N; i++) if (g.cells[i] && !g.cells[i].sp && !g.cells[i].relic) pool.push(i);
  const chosen = [];
  for (let k = 0; k < Math.min(left, 10) && pool.length; k++) chosen.push(pool.splice(ri(g.rng, pool.length), 1)[0]);
  for (const i of chosen) g.cells[i] = piece(g, g.cells[i].c, rand(g.rng) < 0.5 ? 'row' : 'col');
  g.moves = 0;
  if (ev) ev.push({ t: 'convert', cells: chosen, snap: snap(g) });
  resolve(g, ev, null, { cells: chosen, fx: [] });
  return left;
}

// ---------- Pouvoirs des compagnons (une fois par niveau, ne coûtent pas de coup) ----------
export const TARGETED = { toRow: 1, toBomb: 1, toGrail: 1, col: 1, bomb3: 1 };

function randomCells(g, n, filter = p => !p.relic) {
  const pool = [];
  for (let i = 0; i < N; i++) if (g.cells[i] && filter(g.cells[i])) pool.push(i);
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(ri(g.rng, pool.length), 1)[0]);
  return out;
}

export function usePower(g, power, t, ev) {
  const p = t !== undefined && t !== null ? g.cells[t] : null;
  let blast = null;
  const convert = (cells, make) => {
    for (const i of cells) g.cells[i] = make(g.cells[i]);
    if (ev) ev.push({ t: 'convert', cells, snap: snap(g) });
    g.stat.made += cells.length;
  };
  switch (power) {
    case 'shuffle': shuffle(g, ev); return true;
    case 'moves3': g.moves += 3; return true;
    case 'toRow': case 'toBomb': case 'toGrail':
      if (!p || p.relic || (p.sp === 'grail' && power !== 'toGrail')) return false;
      convert([t], q => power === 'toGrail' ? piece(g, -1, 'grail') : piece(g, q.c, power === 'toRow' ? (rand(g.rng) < 0.5 ? 'row' : 'col') : 'bomb'));
      if (!findMoves(g).length) shuffle(g, ev);
      return true;
    case 'stripes2':
      convert(randomCells(g, 2, q => !q.relic && !q.sp), q => piece(g, q.c, rand(g.rng) < 0.5 ? 'row' : 'col'));
      return true;
    case 'col':
      if (t === undefined || t === null || g.hole[t]) return false;
      blast = { cells: colCells(g, colOf(t)), fx: [{ k: 'col', i: t, area: colCells(g, colOf(t)) }] };
      break;
    case 'bomb3':
      if (t === undefined || t === null || g.hole[t]) return false;
      blast = { cells: square(g, t, 1), fx: [{ k: 'bomb', i: t, area: square(g, t, 1) }] };
      break;
    case 'random3': {
      const cells = randomCells(g, 3);
      blast = { cells, fx: cells.map(i => ({ k: 'poof', i, area: [i] })) };
      break;
    }
    case 'cross': {
      const [i] = randomCells(g, 1);
      const cells = [...rowCells(g, rowOf(i)), ...colCells(g, colOf(i))];
      blast = { cells, fx: [{ k: 'row', i, area: rowCells(g, rowOf(i)) }, { k: 'col', i, area: colCells(g, colOf(i)) }] };
      break;
    }
    case 'stones': case 'webs3': {
      const cells = [];
      for (let i = 0; i < N; i++) if (power === 'stones' ? g.stone[i] : g.web[i]) cells.push(i);
      while (power === 'webs3' && cells.length > 3) cells.splice(ri(g.rng, cells.length), 1);
      if (cells.length < 3) cells.push(...randomCells(g, 3 - cells.length, q => !q.relic).filter(i => !cells.includes(i)));
      blast = { cells, fx: cells.map(i => ({ k: 'poof', i, area: [i] })) };
      break;
    }
    case 'chopes': case 'lion': {
      const col = power === 'chopes' && colorCells(g, 3).length ? 3 : commonColor(g);
      let cells = colorCells(g, col);
      if (power === 'lion') while (cells.length > 6) cells.splice(ri(g.rng, cells.length), 1);
      blast = { cells, fx: cells.map(i => ({ k: 'poof', i, area: [i] })) };
      break;
    }
    default: return false;
  }
  resolve(g, ev, null, blast);
  return true;
}

// ---------- Meilleur coup (aide automatique et bot) ----------
// On simule chaque échange possible, cascades comprises, puis on classe :
// 1) avancée sur les objectifs, 2) pièces spéciales créées, 3) score.
export function progressUnits(g) {
  let u = 0;
  for (const x of goalState(g)) {
    if (x.type === 'score') u += x.have / 100;
    else if (x.type === 'web' || x.type === 'stone') u += x.have * 1.5;
    else if (x.type === 'relic') {
      u += x.have * 10;
      for (let i = 0; i < N; i++) if (g.cells[i] && g.cells[i].relic) u += rowOf(i) * 0.6;
    } else u += x.have;
  }
  return u;
}

export function compareKeys(a, b) {
  for (let k = 0; k < a.length; k++) if (Math.abs(a[k] - b[k]) > 1e-9) return a[k] - b[k];
  return 0;
}

export function rateMove(g, a, b, base = progressUnits(g), human = false) {
  const c = clone(g);
  c.noRefill = human;
  playMove(c, a, b, null);
  return [progressUnits(c) - base, c.stat.made - g.stat.made, c.score - g.score];
}

export function bestMove(g, human = false) {
  const base = progressUnits(g);
  let best = null;
  for (const [a, b] of findMoves(g)) {
    const key = rateMove(g, a, b, base, human);
    if (!best || compareKeys(key, best.key) > 0) best = { a, b, key };
  }
  return best;
}

// Bot « simple » : comme une joueuse, il juge chaque coup sur ce qu’il voit (sans deviner les pièces qui tomberont),
// joue parfois au hasard, et n’utilise ni compagnon ni les +5 coups de Merlin.
export function botPlay(level, seed, noise = 0.2) {
  const g = newGame(level, seed), r = makeRng(seed ^ 0x5bd1e995);
  while (g.moves > 0 && !isWon(g)) {
    const ms = findMoves(g);
    if (!ms.length) break;
    let m;
    if (rand(r) < noise) { const x = ms[ri(r, ms.length)]; m = { a: x[0], b: x[1] }; }
    else m = bestMove(g, true);
    playMove(g, m.a, m.b, null);
  }
  const won = isWon(g), left = g.moves;
  if (won) bonusPhase(g, null);
  return { won, left, score: g.score };
}
