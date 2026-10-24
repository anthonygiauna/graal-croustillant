// Interface du jeu : écrans, partie, progression, personnages, trophées, réglages.
import * as E from './engine.js';
import { loadLevels } from './levels.js';
import { CHARACTERS, TROPHIES, DIALOGUES, TUTORIALS, MERLIN_QUIPS, SHUFFLE_QUIPS, WIN_QUIPS, LOSE_QUIPS, COMBO_WORDS, DECOR, goldFor, unlockText, starsTotal } from './data.js';
import { courtyard } from './courtyard.js';
import { portrait, medal, scene, svgUrl, pieceIcon, merlinFace, narratorIcon } from './art.js';
import { play, unlockAudio, setSfx, setMusic, vibrate } from './audio.js';
import { BoardView } from './board.js';
import * as Save from './save.js';

const $ = s => document.querySelector(s);
const main = $('#main'), modalEl = $('#modal');
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const charById = id => CHARACTERS.find(c => c.id === id);
const THEMES = ['cour', 'foret', 'lac', 'marais', 'morgane', 'quete'];
// Décor d'un chapitre ; la cour du château montre les compagnons débloqués et les décorations achetées.
const camelotSvg = () => courtyard({ chars: CHARACTERS.filter(c => S.unlocked.includes(c.id)), decor: S.decor || [] });
const sceneOf = theme => (theme === 'cour' ? camelotSvg() : scene(theme));

let S = Save.load();
let DATA = null;
let G = null; // partie en cours

const persist = () => Save.save(S);
const applySettings = () => { setSfx(S.settings.sound); setMusic(S.settings.music && !document.hidden); };
const nextLevel = () => { let n = 1; while (S.levels[n] && n < 60) n++; return n; };
const unlockedLevel = id => id === 1 || !!S.levels[id - 1];

// ---------- Fenêtres et notifications ----------
function modal(html, cls = '') {
  modalEl.className = 'modal ' + cls;
  modalEl.innerHTML = `<div class="panel">${html}</div>`;
}
function closeModal() { modalEl.className = 'modal hidden'; modalEl.innerHTML = ''; }

const toastQueue = [];
let toastBusy = false;
function toast(html, cls = '') {
  toastQueue.push({ html, cls });
  if (!toastBusy) nextToast();
}
function nextToast() {
  const t = toastQueue.shift();
  if (!t) { toastBusy = false; return; }
  toastBusy = true;
  const el = document.createElement('div');
  el.className = 'toast ' + t.cls; el.innerHTML = t.html;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => { el.remove(); nextToast(); }, 3000);
}

// ---------- Trophées et déblocages ----------
function checkTrophies() {
  for (const t of TROPHIES) {
    if (S.trophies[t.id] || !t.check(S)) continue;
    S.trophies[t.id] = Date.now();
    play('trophy');
    toast(`<span class="medal">${medal(true)}</span><div><small>Trophée débloqué !</small><b>${esc(t.title)}</b></div>`, 'trophy');
  }
  checkUnlocks();
}

function checkUnlocks() {
  for (const c of CHARACTERS) {
    if (S.unlocked.includes(c.id)) continue;
    const u = c.unlock;
    const ok = u.type === 'start' || (u.type === 'level' && S.levels[u.value]) || (u.type === 'stars' && starsTotal(S) >= u.value) || (u.type === 'trophy' && S.trophies[u.value]);
    if (ok) S.unlocked.push(c.id);
  }
  // Un trophée peut dépendre des personnages débloqués.
  for (const t of TROPHIES) if (!S.trophies[t.id] && (t.id === 'friends7' || t.id === 'friends-all') && t.check(S)) {
    S.trophies[t.id] = Date.now();
    toast(`<span class="medal">${medal(true)}</span><div><small>Trophée débloqué !</small><b>${esc(t.title)}</b></div>`, 'trophy');
  }
  persist();
}

// Écrans de déblocage en attente, l'un après l'autre.
function showUnlocks(then) {
  const id = S.unlocked.find(x => !S.seen.includes(x) && x !== 'arthur');
  if (!id) return then();
  S.seen.push(id); persist();
  const c = charById(id);
  play('unlock'); vibrate([40, 40, 80], S.settings.vibrate);
  modal(`<div class="confetti">${Array.from({ length: 24 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}</div>
    <p class="kicker">Nouveau compagnon !</p>
    <div class="portrait xl pop">${portrait(c)}</div>
    <h2>${esc(c.name)}</h2><p class="subtitle">${esc(c.title)}</p>
    <div class="bubble">« ${esc(c.hello)} »</div>
    <div class="power-box"><b>${esc(c.powerName)}</b><span>${esc(c.powerDesc)}</span></div>
    <button class="btn big gold" data-act="unlockNext">Bienvenue !</button>`, 'festive');
  ACT.unlockNext = () => { closeModal(); showUnlocks(then); };
}

// ---------- Écran titre ----------
function title() {
  stopGame();
  main.innerHTML = `<div class="screen title" style="background-image:${svgUrl(camelotSvg())}">
    <div class="logo">
      <img class="logo-grail" src="${pieceIcon({ c: -1, sp: 'grail' }, 160)}" alt="">
      <h1>Le Graal<span>Croustillant</span></h1>
      <p class="tag">Une quête chevaleresque, des fromages, et beaucoup trop de cascades.</p>
      ${S.name ? `<p class="hello">Bienvenue, <b>${esc(S.name)}</b> !</p>` : ""}
    </div>
    <nav class="menu">
      <button class="btn big gold" data-act="map">${S.levels[1] ? 'Continuer' : 'Jouer'}</button>
      <button class="btn" data-act="camelot">Restaurer Camelot <small>${S.gold || 0} pièces d'or</small></button>
      <button class="btn" data-act="gallery">Personnages <small>${S.unlocked.length} / ${CHARACTERS.length}</small></button>
      <button class="btn" data-act="trophies">Salle des trophées <small>${Object.keys(S.trophies).length} / ${TROPHIES.length}</small></button>
      <button class="btn" data-act="settings">Réglages</button>
    </nav>
  </div>`;
}

// ---------- Carte du monde ----------
function mapScreen(focus) {
  stopGame();
  const cur = nextLevel();
  const STEP = 88;
  const chapters = DATA.chapters.map(ch => {
    const lv = DATA.levels.filter(l => l.chapter === ch.id);
    const pts = lv.map((l, k) => ({ l, x: 50 + 30 * Math.sin(k * 1.15 + ch.id), y: 54 + k * STEP }));
    const h = 54 + lv.length * STEP;
    const path = pts.map(p => `${p.x},${p.y}`).join(' ');
    const nodes = pts.map(({ l, x, y }) => {
      const st = (S.levels[l.id] || {}).stars || 0, open = unlockedLevel(l.id);
      const cls = !open ? 'locked' : l.id === cur && !S.levels[l.id] ? 'current' : st ? 'done' : '';
      return `<button class="node ${cls} ${l.boss ? 'boss' : ''}" style="left:${x}%;top:${y}px" data-act="${open ? 'level' : 'locked'}" data-id="${l.id}" aria-label="Niveau ${l.id}">
        <b>${open ? l.id : '🔒'}</b>${open ? `<span class="nstars">${'★'.repeat(st)}<em>${'★'.repeat(3 - st)}</em></span>` : ''}</button>`;
    }).join('');
    const done = lv.filter(l => S.levels[l.id]).length;
    return `<section class="chapter t-${ch.theme}" id="ch${ch.id}">
      <div class="ch-head" style="background-image:${svgUrl(sceneOf(ch.theme))}">
        <span>Chapitre ${ch.id} · ${done}/10</span><h3>${esc(ch.name)}</h3>
        <button class="btn small" data-act="story" data-ch="${ch.id}">Revoir l'histoire</button>
      </div>
      <div class="path" style="height:${h}px">
        <svg viewBox="0 0 100 ${h}" preserveAspectRatio="none"><polyline points="${path}" /></svg>
        ${nodes}
      </div>
    </section>`;
  }).join('');
  main.innerHTML = `<div class="screen map">
    <header class="bar"><button class="btn icon" data-act="title" aria-label="Retour">‹</button><h2>Carte du royaume</h2><span class="pill">★ ${starsTotal(S)} / 180</span></header>
    <div class="map-scroll" id="mapScroll">${chapters}
      ${S.levels[60] ? `<div class="the-end"><h3>Le Graal est retrouvé !</h3><button class="btn" data-act="story" data-ch="fin">Revoir la fin</button></div>` : ''}
    </div></div>`;
  const node = document.querySelector(`.node[data-id="${focus || cur}"]`);
  if (node) node.scrollIntoView({ block: 'center' });
  showUnlocks(() => {});
}

// ---------- Cinématiques ----------
function dialogue(key, then) {
  const lines = DIALOGUES[key];
  let k = 0;
  const theme = key === 'fin' ? 'quete' : THEMES[key - 1];
  const show = () => {
    if (k >= lines.length) {
      if (!S.chapters.includes(key)) { S.chapters.push(key); persist(); }
      closeModal();
      return then();
    }
    const [who, text] = lines[k];
    const c = charById(who);
    const name = c ? c.name : who === 'tous' ? 'Tout le monde' : 'Le narrateur';
    const pic = c ? portrait(c) : narratorIcon();
    modal(`<div class="dlg-scene" style="background-image:${svgUrl(sceneOf(theme))}">
        <p class="dlg-title">${key === 'fin' ? 'Épilogue' : `Chapitre ${key} · ${esc(DATA.chapters[key - 1].name)}`}</p>
      </div>
      <div class="dlg-line ${k % 2 ? 'right' : ''}" data-act="dlgNext">
        <div class="portrait">${pic}</div>
        <div class="dlg-bubble"><b>${esc(name)}</b><p>${esc(text)}</p><small>Touchez pour continuer · ${k + 1}/${lines.length}</small></div>
      </div>
      <button class="btn small skip" data-act="dlgSkip">Passer ›</button>`, 'dialogue');
  };
  ACT.dlgNext = () => { k++; show(); };
  ACT.dlgSkip = () => { k = lines.length; show(); };
  show();
}

// ---------- Avant la partie : choix du compagnon ----------
function goalHtml(x, g) {
  const icon = {
    collect: () => `<img src="${pieceIcon(x.color, 64)}" alt="">`,
    relic: () => `<img src="${pieceIcon({ relic: true, c: -1 }, 64)}" alt="">`,
    web: () => `<span class="gi web"></span>`,
    stone: () => `<span class="gi stone"></span>`,
    score: () => `<span class="gi score">★</span>`,
  }[x.type]();
  const label = { collect: x.type === 'collect' && E.PIECES[x.color].plural, relic: 'Reliques', web: 'Toiles', stone: 'Pierres', score: 'Score' }[x.type];
  let val;
  if (g) {
    const st = E.goalState(g).find(y => y.type === x.type && y.color === x.color);
    val = st.done ? '✔' : x.type === 'score' ? st.need.toLocaleString('fr-FR') : st.need - st.have;
  } else val = x.type === 'score' ? x.target.toLocaleString('fr-FR') : x.type === 'collect' || x.type === 'relic' ? x.count : 'toutes';
  return `<div class="goal ${val === '✔' ? 'done' : ''}" title="${label}">${icon}<b>${val}</b><small>${label}</small></div>`;
}

function prepare(id) {
  const lv = DATA.levels[id - 1];
  if (!S.chapters.includes(lv.chapter)) return dialogue(lv.chapter, () => prepare(id));
  const best = (S.levels[id] || {}).stars || 0;
  if (!S.unlocked.includes(S.companion)) S.companion = 'arthur';
  const list = CHARACTERS.filter(c => S.unlocked.includes(c.id));
  modal(`<h2>Niveau ${id}${lv.boss ? ' <span class="boss-tag">Défi du chapitre</span>' : ''}</h2>
    <p class="best">${'★'.repeat(best)}<em>${'★'.repeat(3 - best)}</em></p>
    <div class="goals preview">${lv.goals.map(x => goalHtml(x)).join('')}</div>
    <p class="moves-info">${lv.moves} coups</p>
    <h3>Choisis ton compagnon</h3>
    <div class="companions">${list.map(c => `<button class="comp ${c.id === S.companion ? 'on' : ''}" data-act="pickComp" data-id="${c.id}">
      <span class="portrait">${portrait(c)}</span><b>${esc(c.name)}</b><small>${esc(c.powerName)}</small></button>`).join('')}</div>
    <p class="comp-desc" id="compDesc">${esc(charById(S.companion).powerDesc)}</p>
    <div class="row"><button class="btn" data-act="closeModal">Retour</button><button class="btn big gold" data-act="go" data-id="${id}">C'est parti !</button></div>`, 'prep');
}

// ---------- Partie ----------
function stopGame() {
  if (!G) return;
  clearIdle();
  G.view.destroy();
  window.removeEventListener('resize', G.onResize);
  G = null;
}

function startGame(id) {
  stopGame();
  closeModal();
  const level = DATA.levels[id - 1];
  const g = E.newGame(level);
  const comp = charById(S.companion);
  if (new Date().getHours() < 5) S.stats.midnight++;
  main.innerHTML = `<div class="screen game t-${THEMES[level.chapter - 1]}" style="background-image:${svgUrl(sceneOf(THEMES[level.chapter - 1]))}">
    <header class="hud">
      <div class="moves"><small>Coups</small><b id="moves">${g.moves}</b></div>
      <div class="goals" id="goals"></div>
      <div class="score"><small>Niveau ${id}</small><b id="score">0</b><div class="starbar"><i id="starfill"></i>${level.stars.map((v, k) => k ? `<span style="left:${Math.min(100, v / level.stars[2] * 100)}%">★</span>` : '').join('')}</div></div>
    </header>
    <div class="board-wrap" id="boardWrap">
      <canvas id="board" aria-label="Grille de jeu"></canvas>
      <div class="banner hidden" id="banner"></div>
      <div class="merlin hidden" id="merlin"><div class="portrait">${merlinFace()}</div><p></p></div>
    </div>
    <footer class="gamebar">
      <button class="btn" data-act="menu">Menu</button>
      <button class="btn power" data-act="power" id="powerBtn"><span class="portrait">${portrait(comp)}</span><span class="pw"><b>${esc(comp.powerName)}</b><small>${esc(comp.name)} · 1 fois</small></span></button>
    </footer>
  </div>`;
  const view = new BoardView($('#board'), { onSwap: (a, b) => doSwap(a, b), onTap: i => onTap(i) });
  G = { id, level, g, view, comp, busy: false, over: false, powerUsed: false, merlinUsed: false, prevStat: { ...g.stat, col: g.stat.col.slice() } };
  G.onResize = () => layoutBoard();
  window.addEventListener('resize', G.onResize);
  layoutBoard();
  view.setGame(g);
  updateHud();
  persist();
  if (level.tutorial && !S.levels[id]) showTutorial(level.tutorial);
  else scheduleIdle();
}

function layoutBoard() {
  const wrap = $('#boardWrap');
  if (!wrap || !G) return;
  const size = Math.floor(Math.min(wrap.clientWidth - 12, wrap.clientHeight - 12, 620));
  G.view.resize(Math.max(200, size));
}

function updateHud(snap) {
  if (!G) return;
  const g = G.g, score = snap ? snap.score : g.score;
  $('#moves').textContent = snap ? snap.moves : g.moves;
  $('#moves').parentElement.classList.toggle('low', (snap ? snap.moves : g.moves) <= 3);
  $('#score').textContent = score.toLocaleString('fr-FR');
  $('#starfill').style.width = Math.min(100, score / G.level.stars[2] * 100) + '%';
  if (!snap) $('#goals').innerHTML = G.level.goals.map(x => goalHtml(x, g)).join('');
  const pb = $('#powerBtn');
  pb.classList.toggle('used', G.powerUsed);
  pb.classList.toggle('armed', !!G.targeting);
}

function banner(text, ms = 2200) {
  const b = $('#banner');
  if (!b) return;
  b.textContent = text; b.classList.remove('hidden');
  clearTimeout(G && G.bannerT);
  if (ms && G) G.bannerT = setTimeout(() => b.classList.add('hidden'), ms);
}
const hideBanner = () => { const b = $('#banner'); if (b) b.classList.add('hidden'); };

const hooks = {
  comboWord: n => COMBO_WORDS[Math.min(n, COMBO_WORDS.length - 1)],
  vibrate: ms => vibrate(ms, S.settings.vibrate),
  onStep: snap => updateHud(snap),
  onShuffle: () => banner(pick(SHUFFLE_QUIPS), 2600),
};

async function doSwap(a, b) {
  if (!G || G.busy || G.over || G.targeting) return;
  clearIdle();
  G.view.sel = -1;
  const ev = [];
  const ok = E.playMove(G.g, a, b, ev);
  if (!ok) S.stats.badSwaps++;
  G.busy = true;
  await G.view.play(ev, hooks);
  if (!G) return;
  G.busy = false;
  afterAction();
}

function onTap(i) {
  if (!G || G.busy || G.over) return;
  if (G.targeting) return runPower(i);
  clearIdle();
  const v = G.view;
  if (v.sel >= 0 && E.adjacent(v.sel, i)) { const a = v.sel; v.sel = -1; return doSwap(a, i); }
  v.sel = v.sel === i ? -1 : i;
  play('tap');
  scheduleIdle();
}

function absorbStats() {
  const st = G.g.stat, p = G.prevStat;
  for (const k of ['swords', 'bombs', 'grails', 'xCross', 'xBombSword', 'xBombBomb', 'xGrail2', 'shuffles', 'webs', 'stonesBroken', 'relics']) S.stats[k] += st[k] - p[k];
  for (let c = 0; c < 6; c++) S.stats.col[c] += st.col[c] - p.col[c];
  S.stats.maxCascade = Math.max(S.stats.maxCascade, st.maxCascade);
  G.prevStat = { ...st, col: st.col.slice() };
  checkTrophies();
  persist();
}

function afterAction() {
  absorbStats();
  updateHud();
  if (E.isWon(G.g)) return win();
  if (G.g.moves <= 0) return lose();
  scheduleIdle();
}

// ---------- Pouvoir du compagnon ----------
function onPower() {
  if (!G || G.busy || G.over) return;
  if (G.powerUsed) return banner(`${G.comp.name} a déjà donné un coup de main dans ce niveau.`);
  clearIdle();
  if (E.TARGETED[G.comp.power]) {
    G.targeting = !G.targeting;
    G.view.targeting = G.targeting;
    G.view.sel = -1;
    if (G.targeting) banner(`${G.comp.powerName} : touche une case de la grille (ou le bouton pour annuler).`, 0); else { hideBanner(); scheduleIdle(); }
    updateHud();
    return;
  }
  runPower(null);
}

async function runPower(t) {
  const ev = [];
  const ok = E.usePower(G.g, G.comp.power, t, ev);
  if (!ok) { banner('Pas sur cette case !'); return; }
  G.powerUsed = true; G.targeting = false; G.view.targeting = false;
  hideBanner();
  if (!S.stats.powers.includes(G.comp.id)) S.stats.powers.push(G.comp.id);
  play('grail'); vibrate(40, S.settings.vibrate);
  banner(`${G.comp.name} : ${G.comp.powerName} !`, 1600);
  updateHud();
  G.busy = true;
  await G.view.play(ev, hooks);
  if (!G) return;
  G.busy = false;
  afterAction();
}

// ---------- Aide automatique ----------
function scheduleIdle() {
  clearIdle();
  if (!G || G.over || !S.settings.hint) return;
  const first = G.level.tutorial && G.g.movesMade === 0 && !S.levels[G.id];
  G.idle1 = setTimeout(() => {
    if (!G || G.busy || G.over || G.targeting) return;
    const m = E.bestMove(G.g);
    if (m) G.view.hint = { ...m, ids: [G.g.cells[m.a].id, G.g.cells[m.b].id] };
    G.idle2 = setTimeout(showMerlin, 6000);
  }, first ? 2500 : 6000);
}
function clearIdle() {
  if (!G) return;
  clearTimeout(G.idle1); clearTimeout(G.idle2);
  G.view.hint = null;
  const m = $('#merlin'); if (m) m.classList.add('hidden');
}
function showMerlin() {
  const m = $('#merlin');
  if (!m || !G || G.over) return;
  m.querySelector('p').textContent = pick(MERLIN_QUIPS);
  m.classList.remove('hidden');
}

function showTutorial(key) {
  const sample = { sword: { c: 2, sp: 'row' }, bomb: { c: 4, sp: 'bomb' }, grail: { c: -1, sp: 'grail' }, relic: { c: -1, relic: true } }[key];
  modal(`<div class="tuto"><div class="portrait">${merlinFace()}</div>
    <div><b>Leçon de Merlin</b><p>${esc(TUTORIALS[key])}</p></div></div>
    ${sample ? `<img class="tuto-piece" src="${pieceIcon(sample, 128)}" alt="">` : ''}
    <button class="btn big gold" data-act="tutoOk">Compris !</button>`, 'small');
}

// ---------- Fin de partie ----------
async function win() {
  G.over = true;
  clearIdle();
  const left = G.g.moves;
  if (left > 0) {
    banner(`Objectifs atteints ! ${left} coup${left > 1 ? 's' : ''} restant${left > 1 ? 's' : ''} → bonus !`, 0);
    await new Promise(r => setTimeout(r, 900));
    if (!G) return;
    const ev = [];
    E.bonusPhase(G.g, ev);
    G.view.speed = 2.6;
    await G.view.play(ev, hooks);
    if (!G) return;
    hideBanner();
  }
  absorbStats();
  updateHud();
  const g = G.g, id = G.id, stars = E.starsFor(g);
  const prev = S.levels[id] || { stars: 0, best: 0 };
  S.levels[id] = { stars: Math.max(prev.stars, stars), best: Math.max(prev.best, g.score) };
  S.stats.wins++;
  S.stats.maxLeft = Math.max(S.stats.maxLeft, left);
  if (left === 0) S.stats.lastMoveWins++;
  const gold = goldFor(left);
  S.gold = (S.gold || 0) + gold;
  checkTrophies();
  persist();
  play('win'); vibrate([60, 60, 120], S.settings.vibrate);
  const record = g.score > prev.best && prev.best > 0;
  modal(`<p class="kicker">Niveau ${id} réussi${S.name ? `, ${esc(S.name)}` : ""} !</p>
    <div class="big-stars">${[1, 2, 3].map(k => `<span class="${k <= stars ? 'on' : ''}" style="--d:${k * 0.35}s">★</span>`).join('')}</div>
    <p class="final-score">${g.score.toLocaleString('fr-FR')} points${record ? ' <em>Record !</em>' : ''}</p>
    <p class="gold-reward">${gold ? `<span class="coin"></span> +${gold} pièce${gold > 1 ? 's' : ''} d'or pour ${left} coup${left > 1 ? 's' : ''} d'avance${left >= 10 ? ' (coffre royal : double !)' : ''}` : 'Gagne avec des coups d\x27avance pour gagner de l\x27or et restaurer Camelot.'}</p>
    <div class="bubble">${esc(pick(WIN_QUIPS))}</div>
    <div class="row">
      <button class="btn" data-act="map">Carte</button>
      <button class="btn" data-act="go" data-id="${id}">Rejouer</button>
      ${id < 60 ? `<button class="btn big gold" data-act="afterWin" data-id="${id}">Suivant</button>` : `<button class="btn big gold" data-act="afterWin" data-id="${id}">La suite !</button>`}
    </div>`, 'result win');
  [1, 2, 3].forEach(k => k <= stars && setTimeout(() => play('star', k), k * 350 + 150));
}

function lose() {
  G.over = true;
  clearIdle();
  play('lose');
  const st = E.goalState(G.g).filter(x => !x.done);
  const remain = st.map(x => x.type === 'score' ? `${(x.need - x.have).toLocaleString('fr-FR')} points` : `${x.need - x.have} ${{ collect: E.PIECES[x.color] && E.PIECES[x.color].plural.toLowerCase(), relic: 'relique(s)', web: 'toile(s)', stone: 'pierre(s)' }[x.type]}`).join(', ');
  if (!G.merlinUsed) {
    modal(`<div class="tuto"><div class="portrait">${merlinFace()}</div>
      <div><b>Plus de coups !</b><p>Il te manquait : ${esc(remain)}. Merlin, ému, te propose un petit coup de pouce magique.</p></div></div>
      <button class="btn big gold" data-act="merlin5">+5 coups offerts par Merlin</button>
      <button class="btn" data-act="giveUp">Non merci, j'abandonne</button>`, 'small');
  } else giveUp();
}

function giveUp() {
  S.stats.losses++;
  checkTrophies(); persist();
  modal(`<p class="kicker">Niveau ${G.id} raté</p>
    <div class="big-stars lost"><span>★</span><span>★</span><span>★</span></div>
    <div class="bubble">${esc(pick(LOSE_QUIPS))}</div>
    <div class="row"><button class="btn" data-act="map">Carte</button><button class="btn big gold" data-act="go" data-id="${G.id}">Réessayer</button></div>`, 'result lose');
}

// ---------- Restaurer Camelot (récompenses des coups d'avance) ----------
function camelotScreen() {
  stopGame();
  const owned = S.decor || [];
  main.innerHTML = `<div class="screen list-screen">
    <header class="bar"><button class="btn icon" data-act="title" aria-label="Retour">‹</button><h2>Restaurer Camelot</h2><span class="pill"><span class="coin"></span> ${S.gold || 0}</span></header>
    <div class="scroll">
      <div class="camelot-view">${camelotSvg()}</div>
      <p class="camelot-help">Chaque coup d'avance à la fin d'un niveau rapporte une pièce d'or (le double à partir de 10 coups). Les compagnons débloqués s'installent dans la cour.</p>
      <ul class="decor-list">${DECOR.map(d => {
        const have = owned.includes(d.id), afford = (S.gold || 0) >= d.cost;
        return `<li class="${have ? 'on' : ''}"><div><b>${esc(d.name)}</b><small>${esc(d.desc)}</small></div>
          ${have ? '<span class="owned">✔ Installé</span>' : `<button class="btn small ${afford ? 'gold' : ''}" data-act="buyDecor" data-id="${d.id}" aria-label="Installer pour ${d.cost} pièces d'or"><span class="coin"></span> ${d.cost}</button>`}</li>`;
      }).join('')}</ul>
    </div></div>`;
}

function buyDecor(id) {
  const d = DECOR.find(x => x.id === id);
  if (!d || (S.decor || []).includes(id)) return;
  if ((S.gold || 0) < d.cost) {
    return toast(`<div><b>Pas assez d'or</b><small>Il manque ${d.cost - (S.gold || 0)} pièces : gagne des niveaux avec des coups d'avance.</small></div>`);
  }
  S.gold -= d.cost;
  S.decor = [...(S.decor || []), id];
  play('unlock');
  checkTrophies(); persist();
  toast(`<div><b>${esc(d.name)}</b><small>Installé à Camelot !</small></div>`);
  camelotScreen();
}

// ---------- Galerie, trophées, réglages ----------
function gallery() {
  stopGame();
  main.innerHTML = `<div class="screen list-screen">
    <header class="bar"><button class="btn icon" data-act="title" aria-label="Retour">‹</button><h2>Personnages</h2><span class="pill">${S.unlocked.length} / ${CHARACTERS.length}</span></header>
    <div class="scroll"><div class="gallery">${CHARACTERS.map(c => {
      const on = S.unlocked.includes(c.id);
      return `<button class="card ${on ? '' : 'locked'}" data-act="${on ? 'charInfo' : 'charLocked'}" data-id="${c.id}">
        <span class="portrait">${portrait(c)}</span><b>${on ? esc(c.name) : '???'}</b><small>${on ? esc(c.title) : esc(unlockText(c.unlock))}</small></button>`;
    }).join('')}</div></div></div>`;
}

function charInfo(id) {
  const c = charById(id);
  modal(`<div class="portrait xl">${portrait(c)}</div><h2>${esc(c.name)}</h2><p class="subtitle">${esc(c.title)}</p>
    <p class="bio">${esc(c.bio)}</p>
    <div class="power-box"><b>Pouvoir : ${esc(c.powerName)}</b><span>${esc(c.powerDesc)}</span></div>
    <button class="btn big" data-act="closeModal">Fermer</button>`, 'small');
}

function trophies() {
  stopGame();
  const n = Object.keys(S.trophies).length;
  main.innerHTML = `<div class="screen list-screen">
    <header class="bar"><button class="btn icon" data-act="title" aria-label="Retour">‹</button><h2>Salle des trophées</h2><span class="pill">${n} / ${TROPHIES.length}</span></header>
    <div class="scroll"><ul class="trophies">${TROPHIES.map(t => {
      const on = !!S.trophies[t.id];
      return `<li class="${on ? 'on' : ''}"><span class="medal">${medal(on)}</span><div><b>${esc(t.title)}</b><small>${esc(t.desc)}</small></div></li>`;
    }).join('')}</ul></div></div>`;
}

function settings() {
  stopGame();
  const sw = (k, label, hint) => `<button class="switch-row" data-act="toggle" data-k="${k}" role="switch" aria-checked="${S.settings[k]}">
    <span><b>${label}</b><small>${hint}</small></span><i class="switch ${S.settings[k] ? 'on' : ''}"></i></button>`;
  main.innerHTML = `<div class="screen list-screen">
    <header class="bar"><button class="btn icon" data-act="title" aria-label="Retour">‹</button><h2>Réglages</h2><span></span></header>
    <div class="scroll"><div class="settings">
      ${sw('sound', 'Effets sonores', 'Épées, pièces, fanfares')}
      ${sw('music', 'Musique', 'La ritournelle du château')}
      ${sw('hint', 'Aide automatique', 'Montre le meilleur coup après 6 secondes sans jouer')}
      ${sw('vibrate', 'Vibrations', 'Sur les téléphones qui le permettent')}
      <div class="savecode">
        <b>Nom du compte</b>
        <div class="row name-row"><input id="playerName" maxlength="24" autocomplete="off" aria-label="Nom du compte" value="${esc(S.name)}" placeholder="Ton nom de chevalière"><button class="btn small gold" data-act="saveName">Enregistrer</button></div>
      </div>
      <div class="savecode">
        <b>Code de sauvegarde</b>
        <small>Pour retrouver ta partie sur un autre téléphone ou une autre adresse du jeu : copie ton code ici, puis colle-le là-bas.</small>
        <textarea id="saveCode" rows="3" spellcheck="false" aria-label="Code de sauvegarde" placeholder="Colle ici un code GRAAL1:…"></textarea>
        <div class="row"><button class="btn small" data-act="copyCode">Copier mon code</button><button class="btn small gold" data-act="loadCode">Charger ce code</button></div>
      </div>
      <button class="btn danger" data-act="resetAsk">Réinitialiser la progression</button>
      <p class="about">Le Graal Croustillant · jeu original, graphismes et sons fabriqués en code.<br>Progression enregistrée sur cet appareil.</p>
    </div></div></div>`;
}

// ---------- Actions des boutons ----------
const ACT = {
  title, map: () => { closeModal(); mapScreen(); }, gallery, trophies, settings, camelot: () => camelotScreen(),
  buyDecor: b => buyDecor(b.dataset.id),
  closeModal,
  level: b => prepare(+b.dataset.id),
  locked: () => toast('<div><b>Pas encore !</b><small>Termine d\'abord le niveau précédent.</small></div>'),
  story: b => dialogue(b.dataset.ch === 'fin' ? 'fin' : +b.dataset.ch, () => mapScreen()),
  pickComp: b => {
    S.companion = b.dataset.id; persist();
    document.querySelectorAll('.comp').forEach(x => x.classList.toggle('on', x === b));
    $('#compDesc').textContent = charById(S.companion).powerDesc;
  },
  go: b => startGame(+b.dataset.id),
  afterWin: b => {
    const id = +b.dataset.id;
    closeModal();
    showUnlocks(() => {
      if (id === 60) return dialogue('fin', () => mapScreen(60));
      prepare(id + 1);
    });
  },
  menu: () => {
    if (!G || G.busy) return;
    clearIdle();
    modal(`<h2>Pause</h2><p class="subtitle">Niveau ${G.id}</p>
      <button class="btn big gold" data-act="resume">Reprendre</button>
      <button class="btn" data-act="go" data-id="${G.id}">Recommencer</button>
      <button class="btn" data-act="map">Carte du royaume</button>
      <div class="row"><button class="btn small" data-act="toggleQuick" data-k="sound">Sons : ${S.settings.sound ? 'oui' : 'non'}</button>
      <button class="btn small" data-act="toggleQuick" data-k="music">Musique : ${S.settings.music ? 'oui' : 'non'}</button></div>`, 'small');
  },
  resume: () => { closeModal(); scheduleIdle(); },
  toggleQuick: b => { S.settings[b.dataset.k] = !S.settings[b.dataset.k]; persist(); applySettings(); b.textContent = (b.dataset.k === 'sound' ? 'Sons : ' : 'Musique : ') + (S.settings[b.dataset.k] ? 'oui' : 'non'); },
  power: onPower,
  tutoOk: () => { closeModal(); scheduleIdle(); },
  merlin5: () => {
    G.merlinUsed = true; G.over = false;
    G.g.moves += 5; S.stats.merlinGifts++;
    checkTrophies(); persist();
    closeModal(); updateHud();
    banner('Abracadabra ! +5 coups.', 1600);
    scheduleIdle();
  },
  giveUp,
  charInfo: b => charInfo(b.dataset.id),
  charLocked: b => toast(`<div><b>Personnage mystère</b><small>${esc(unlockText(charById(b.dataset.id).unlock))}</small></div>`),
  toggle: b => {
    const k = b.dataset.k;
    S.settings[k] = !S.settings[k];
    if (k === 'music' && !S.settings.music && !S.trophies.silence) { /* rien de spécial */ }
    persist(); applySettings();
    b.setAttribute('aria-checked', S.settings[k]);
    b.querySelector('.switch').classList.toggle('on', S.settings[k]);
  },
  saveName: () => {
    S.name = $("#playerName").value.trim().slice(0, 24); persist();
    toast(`<div><b>Nom enregistré</b><small>${S.name ? `Bienvenue, ${esc(S.name)} !` : "Le compte n'a plus de nom."}</small></div>`);
  },
  copyCode: () => {
    const ta = $('#saveCode');
    ta.value = Save.exportCode(S);
    const done = () => toast('<div><b>Code copié</b><small>Colle-le dans les Réglages de l\'autre version du jeu.</small></div>');
    const fallback = () => { ta.focus(); ta.select(); toast('<div><b>Code affiché</b><small>Sélectionne-le et copie-le à la main.</small></div>'); };
    try { navigator.clipboard.writeText(ta.value).then(done, fallback); } catch (e) { fallback(); }
  },
  loadCode: () => {
    const s = Save.importCode($('#saveCode').value);
    if (!s) return toast('<div><b>Code invalide</b><small>Il doit commencer par GRAAL1: et être complet.</small></div>');
    S = s; persist(); applySettings();
    toast(`<div><b>Partie chargée</b><small>${starsTotal(S)} étoiles, ${Object.keys(S.levels).length} niveaux réussis.</small></div>`);
    title();
  },
  resetAsk: () => modal(`<h2>Tout effacer ?</h2><p>Les étoiles, les personnages et les trophées seront perdus. Impossible de revenir en arrière.</p>
    <div class="row"><button class="btn" data-act="closeModal">Annuler</button><button class="btn danger" data-act="resetYes">Oui, tout effacer</button></div>`, 'small'),
  resetYes: () => { S = Save.reset(); applySettings(); closeModal(); toast('<div><b>Progression effacée</b><small>Une nouvelle quête commence !</small></div>'); title(); },
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  unlockAudio();
  const f = ACT[b.dataset.act];
  if (!f) return;
  if (!['dlgNext', 'pickComp'].includes(b.dataset.act)) play('tap');
  f(b);
});
document.addEventListener('pointerdown', () => unlockAudio(), { once: true });
document.addEventListener('visibilitychange', applySettings);

// Lien de sauvegarde (…/?code=GRAAL1:…) : propose de charger la partie, puis retire le code de l'adresse.
function offerLinkedSave() {
  const raw = new URLSearchParams(location.search).get('code');
  if (!raw) return;
  try { history.replaceState(null, '', location.pathname); } catch (e) { /* rien */ }
  const s = Save.importCode(raw.replace(/ /g, '+'));
  if (!s) return toast('<div><b>Lien de sauvegarde incomplet</b><small>Recopie le lien en entier.</small></div>');
  const n = Object.keys(s.levels).length;
  modal(`<h2>Charger une partie ?</h2>
    <p>${s.name ? `Partie de <b>${esc(s.name)}</b> : ` : ''}${n} niveau${n > 1 ? 'x' : ''} réussi${n > 1 ? 's' : ''}, ${starsTotal(s)} étoiles, ${s.unlocked.length} personnages.</p>
    <p class="subtitle">Elle remplace la progression enregistrée sur cet appareil.</p>
    <div class="row"><button class="btn" data-act="closeModal">Non merci</button><button class="btn big gold" data-act="linkedSaveYes">Charger</button></div>`, 'small');
  ACT.linkedSaveYes = () => {
    S = s; persist(); applySettings(); closeModal();
    toast(`<div><b>Partie chargée</b><small>Bon retour, ${esc(s.name || 'chevalière')} !</small></div>`);
    title();
  };
}

// ---------- Démarrage ----------
(async () => {
  try {
    DATA = await loadLevels();
  } catch (e) {
    main.innerHTML = '<div class="loading">Impossible de charger les niveaux. Lance le jeu depuis un serveur (voir LISEZMOI.md).</div>';
    return;
  }
  checkUnlocks();
  applySettings();
  title();
  offerLinkedSave();
  const local = location.hostname === 'localhost' && !location.search.includes('sw=1'); // en local, pas de cache pour voir les modifications
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !local) navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__game = { get G() { return G; }, get S() { return S; }, DATA, E };
})();
