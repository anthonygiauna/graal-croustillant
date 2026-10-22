// Affichage de la grille sur un canvas : animations des étapes produites par le moteur, particules, aide, gestes.
import { W, H, N } from './engine.js';
import { sprite, PIECE_COLORS, INK } from './art.js';
import { play } from './audio.js';

const EASE = {
  lin: t => t,
  out: t => 1 - (1 - t) * (1 - t),
  inOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  bounce: t => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
  back: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const rc = i => [i % W, (i / W) | 0];

export class BoardView {
  constructor(canvas, { onSwap, onTap }) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.onSwap = onSwap; this.onTap = onTap;
    this.sprites = new Map(); this.tweens = []; this.parts = []; this.fx = []; this.texts = [];
    this.web = new Uint8Array(N); this.stone = new Uint8Array(N); this.hole = new Uint8Array(N);
    this.sel = -1; this.hint = null; this.shakeT = 0; this.shakeA = 0; this.targeting = false;
    this.speed = 1; this.running = true;
    this.bindInput();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  destroy() { this.running = false; }

  setGame(g) {
    this.hole = g.hole; this.web = g.web.slice(); this.stone = g.stone.slice();
    this.sprites.clear();
    g.cells.forEach((p, i) => { if (p) this.addSprite(p, i); });
    this.drawBg();
  }

  resize(cssSize) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr; this.size = cssSize; this.cs = cssSize / W;
    this.cv.style.width = this.cv.style.height = cssSize + 'px';
    this.cv.width = this.cv.height = Math.round(cssSize * dpr);
    this.drawBg();
  }

  addSprite(p, i, extra = {}) {
    const [x, y] = rc(i);
    const s = { p, x, y, s: 1, a: 1, ...extra };
    this.sprites.set(p.id, s);
    return s;
  }

  // ---------- Tweens ----------
  tween(obj, to, dur, ease = 'out', delay = 0) {
    dur /= this.speed;
    return new Promise(resolve => {
      const from = {};
      for (const k in to) from[k] = obj[k];
      this.tweens.push({ obj, from, to, t0: performance.now() + delay, dur, ease: EASE[ease], resolve });
    });
  }

  // ---------- Fond de grille (mis en cache) ----------
  drawBg() {
    if (!this.cs) return;
    const c = this.bg = document.createElement('canvas');
    c.width = c.height = this.cv.width;
    const x = c.getContext('2d'), cs = this.cs * this.dpr;
    x.lineJoin = 'round';
    // ombre et cadre
    for (let i = 0; i < N; i++) {
      if (this.hole[i]) continue;
      const [cx, cy] = rc(i);
      x.fillStyle = INK; x.fillRect(cx * cs - 3 * this.dpr, cy * cs - 3 * this.dpr, cs + 6 * this.dpr, cs + 6 * this.dpr);
    }
    for (let i = 0; i < N; i++) {
      if (this.hole[i]) continue;
      const [cx, cy] = rc(i);
      x.fillStyle = (cx + cy) % 2 ? '#f3dfae' : '#fbecc8';
      x.fillRect(cx * cs, cy * cs, cs, cs);
      x.fillStyle = 'rgba(160,110,50,.08)'; x.fillRect(cx * cs, cy * cs + cs * 0.85, cs, cs * 0.15);
    }
  }

  // ---------- Boucle de rendu ----------
  loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    // tweens
    for (let k = this.tweens.length - 1; k >= 0; k--) {
      const t = this.tweens[k];
      const u = Math.max(0, Math.min(1, (now - t.t0) / t.dur));
      if (now < t.t0) continue;
      const e = t.ease(u);
      for (const p in t.to) t.obj[p] = t.from[p] + (t.to[p] - t.from[p]) * e;
      if (u >= 1) { this.tweens.splice(k, 1); t.resolve(); }
    }
    this.draw(now);
  }

  draw(now) {
    const { ctx, dpr } = this, cs = this.cs * dpr;
    if (!cs) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.cv.width, this.cv.height);
    if (this.shakeT > now) {
      const k = (this.shakeT - now) / 300 * this.shakeA * dpr;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }
    if (this.bg) ctx.drawImage(this.bg, 0, 0);
    // pierres
    for (let i = 0; i < N; i++) if (this.stone[i]) this.drawStone(ctx, i, cs);
    // aide : halo pulsant
    if (this.hint) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 180);
      for (const i of [this.hint.a, this.hint.b]) {
        const [x, y] = rc(i);
        ctx.fillStyle = `rgba(255,236,120,${0.35 + 0.35 * pulse})`;
        ctx.beginPath(); ctx.roundRect(x * cs + 2, y * cs + 2, cs - 4, cs - 4, cs * 0.2); ctx.fill();
      }
    }
    if (this.sel >= 0) {
      const [x, y] = rc(this.sel);
      ctx.lineWidth = 4 * dpr; ctx.strokeStyle = '#d63a2f';
      ctx.beginPath(); ctx.roundRect(x * cs + 3, y * cs + 3, cs - 6, cs - 6, cs * 0.2); ctx.stroke();
    }
    // pièces
    const size = Math.round(cs * 0.86), pad = (cs - size) / 2;
    for (const s of this.sprites.values()) {
      if (s.a <= 0.01 || s.s <= 0.01) continue;
      const img = sprite(s.p, size);
      let sc = s.s;
      if (this.hint && (this.hint.ids || []).includes(s.p.id)) sc *= 1 + 0.08 * Math.sin(now / 120);
      if (s.p.sp === 'bomb') sc *= 1 + 0.04 * Math.sin(now / 200);
      const cx = s.x * cs + cs / 2, cy = s.y * cs + cs / 2;
      ctx.globalAlpha = s.a;
      if (s.p.sp === 'grail') {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(now / 1500); ctx.drawImage(img, -size / 2 * sc, -size / 2 * sc, size * sc, size * sc); ctx.restore();
      } else ctx.drawImage(img, cx - size / 2 * sc, cy - size / 2 * sc, size * sc, size * sc);
      ctx.globalAlpha = 1;
    }
    // toiles par-dessus les pièces
    for (let i = 0; i < N; i++) if (this.web[i]) this.drawWeb(ctx, i, cs, this.web[i]);
    // flèche de l'aide
    if (this.hint) this.drawArrow(ctx, cs, now);
    if (this.targeting) {
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, 0, this.cv.width, this.cv.height);
    }
    this.drawFx(ctx, cs, now);
  }

  drawStone(ctx, i, cs) {
    const [x, y] = rc(i), lv = this.stone[i], p = cs * 0.06;
    ctx.beginPath(); ctx.roundRect(x * cs + p, y * cs + p, cs - 2 * p, cs - 2 * p, cs * 0.14);
    ctx.fillStyle = ['', '#c9c2b8', '#a8a096', '#8a8278'][lv]; ctx.fill();
    ctx.lineWidth = 3 * this.dpr; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = 2 * this.dpr; ctx.strokeStyle = 'rgba(58,34,16,.55)';
    ctx.beginPath();
    ctx.moveTo(x * cs + cs * 0.15, y * cs + cs * 0.45); ctx.lineTo(x * cs + cs * 0.85, y * cs + cs * 0.45);
    ctx.moveTo(x * cs + cs * 0.5, y * cs + cs * 0.12); ctx.lineTo(x * cs + cs * 0.5, y * cs + cs * 0.45);
    ctx.moveTo(x * cs + cs * 0.3, y * cs + cs * 0.45); ctx.lineTo(x * cs + cs * 0.3, y * cs + cs * 0.86);
    ctx.moveTo(x * cs + cs * 0.72, y * cs + cs * 0.45); ctx.lineTo(x * cs + cs * 0.72, y * cs + cs * 0.86);
    ctx.stroke();
    // pastilles = solidité restante
    for (let k = 0; k < lv; k++) {
      ctx.beginPath(); ctx.arc(x * cs + cs * (0.5 + (k - (lv - 1) / 2) * 0.2), y * cs + cs * 0.68, cs * 0.06, 0, Math.PI * 2);
      ctx.fillStyle = '#fff6dc'; ctx.fill(); ctx.lineWidth = 1.5 * this.dpr; ctx.strokeStyle = INK; ctx.stroke();
    }
  }

  drawWeb(ctx, i, cs, lv) {
    const [x, y] = rc(i), cx = x * cs + cs / 2, cy = y * cs + cs / 2, r = cs * 0.5;
    ctx.save();
    ctx.strokeStyle = lv > 1 ? 'rgba(70,60,90,.85)' : 'rgba(255,255,255,.9)';
    ctx.lineWidth = (lv > 1 ? 2.2 : 1.6) * this.dpr;
    ctx.beginPath();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    for (const f of [0.3, 0.58, 0.86]) {
      for (let k = 0; k <= 8; k++) {
        const a = k * Math.PI / 4, px = cx + Math.cos(a) * r * f, py = cy + Math.sin(a) * r * f;
        if (k === 0) ctx.moveTo(px, py); else ctx.quadraticCurveTo(cx + Math.cos(a - Math.PI / 8) * r * f * 0.8, cy + Math.sin(a - Math.PI / 8) * r * f * 0.8, px, py);
      }
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(58,34,16,.35)'; ctx.lineWidth = 0.8 * this.dpr; ctx.stroke();
    ctx.restore();
  }

  drawArrow(ctx, cs, now) {
    const [ax, ay] = rc(this.hint.a), [bx, by] = rc(this.hint.b);
    const t = (now % 1000) / 1000, k = Math.sin(t * Math.PI);
    const sx = (ax + 0.5) * cs, sy = (ay + 0.5) * cs, ex = (bx + 0.5) * cs, ey = (by + 0.5) * cs;
    const dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
    const off = k * cs * 0.18;
    ctx.save();
    ctx.translate(sx + dx / 2 + ux * off, sy + dy / 2 + uy * off);
    ctx.rotate(Math.atan2(dy, dx));
    const L = cs * 0.42, w = cs * 0.13;
    ctx.beginPath();
    ctx.moveTo(-L / 2, -w / 2); ctx.lineTo(L / 6, -w / 2); ctx.lineTo(L / 6, -w * 1.3); ctx.lineTo(L / 2 + w, 0);
    ctx.lineTo(L / 6, w * 1.3); ctx.lineTo(L / 6, w / 2); ctx.lineTo(-L / 2, w / 2); ctx.closePath();
    ctx.fillStyle = '#fff3a0'; ctx.fill(); ctx.lineWidth = 3 * this.dpr; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }

  // ---------- Effets ----------
  burst(i, color, n = 8) {
    const [x, y] = rc(i);
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 3.5;
      this.parts.push({ x: x + 0.5, y: y + 0.5, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, color, r: 0.05 + Math.random() * 0.07, star: Math.random() < 0.3 });
    }
    if (this.parts.length > 400) this.parts.splice(0, this.parts.length - 400);
  }

  text(str, x, y, { size = 0.5, color = '#fff', big = false } = {}) {
    this.texts.push({ str, x, y, size, color, big, t0: performance.now() });
  }

  shake(amount = 8) { this.shakeT = performance.now() + 300; this.shakeA = amount; }

  drawFx(ctx, cs, now) {
    const dt = 1 / 60;
    for (let k = this.parts.length - 1; k >= 0; k--) {
      const p = this.parts[k];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 9 * dt; p.life -= dt * 1.4;
      if (p.life <= 0) { this.parts.splice(k, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life * 1.5);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.star) { const r = p.r * cs; ctx.save(); ctx.translate(p.x * cs, p.y * cs); ctx.rotate(p.life * 6); ctx.fillRect(-r, -r / 3, r * 2, r / 1.5); ctx.fillRect(-r / 3, -r, r / 1.5, r * 2); ctx.restore(); }
      else { ctx.arc(p.x * cs, p.y * cs, p.r * cs, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    for (let k = this.fx.length - 1; k >= 0; k--) {
      const f = this.fx[k], u = (now - f.t0) / f.dur;
      if (u >= 1) { this.fx.splice(k, 1); continue; }
      if (u < 0) continue;
      const [x, y] = rc(f.i);
      ctx.save();
      if (f.k === 'row' || f.k === 'col') {
        ctx.globalAlpha = 1 - u;
        ctx.fillStyle = '#fffbe0';
        const th = cs * 0.5 * (1 - u * 0.6);
        if (f.k === 'row') ctx.fillRect(0, (y + 0.5) * cs - th / 2, this.cv.width, th);
        else ctx.fillRect((x + 0.5) * cs - th / 2, 0, th, this.cv.height);
        ctx.globalAlpha = 1;
        const d = u * W * cs;
        ctx.fillStyle = '#dfe7ef'; ctx.strokeStyle = INK; ctx.lineWidth = 2 * this.dpr;
        for (const s of [-1, 1]) {
          const px = f.k === 'row' ? (x + 0.5) * cs + s * d : (x + 0.5) * cs, py = f.k === 'row' ? (y + 0.5) * cs : (y + 0.5) * cs + s * d;
          ctx.save(); ctx.translate(px, py); ctx.rotate((f.k === 'row' ? 0 : Math.PI / 2) + (s < 0 ? Math.PI : 0));
          ctx.beginPath(); ctx.moveTo(-cs * 0.3, -cs * 0.07); ctx.lineTo(cs * 0.25, -cs * 0.07); ctx.lineTo(cs * 0.38, 0); ctx.lineTo(cs * 0.25, cs * 0.07); ctx.lineTo(-cs * 0.3, cs * 0.07); ctx.closePath();
          ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f5c53a'; ctx.fillRect(-cs * 0.34, -cs * 0.16, cs * 0.06, cs * 0.32); ctx.fillStyle = '#dfe7ef';
          ctx.restore();
        }
      } else if (f.k === 'bomb' || f.k === 'bomb2' || f.k === 'all') {
        const R = (f.k === 'bomb' ? 1.6 : f.k === 'bomb2' ? 2.6 : 6) * cs * EASE.out(u);
        ctx.globalAlpha = 1 - u;
        ctx.beginPath(); ctx.arc((x + 0.5) * cs, (y + 0.5) * cs, R, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,200,80,.45)'; ctx.fill();
        ctx.lineWidth = cs * 0.12 * (1 - u); ctx.strokeStyle = '#fff2b0'; ctx.stroke();
      } else if (f.k === 'grail') {
        ctx.globalAlpha = 1 - u * 0.8;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 * this.dpr; ctx.shadowColor = '#7ad8ff'; ctx.shadowBlur = 12 * this.dpr;
        for (const j of f.area) {
          const [tx, ty] = rc(j);
          ctx.beginPath(); ctx.moveTo((x + 0.5) * cs, (y + 0.5) * cs);
          const mx = (x + tx + 1) / 2 * cs + (Math.random() - 0.5) * cs * 0.6, my = (y + ty + 1) / 2 * cs + (Math.random() - 0.5) * cs * 0.6;
          ctx.lineTo(mx, my); ctx.lineTo((tx + 0.5) * cs, (ty + 0.5) * cs); ctx.stroke();
        }
      } else if (f.k === 'poof') {
        ctx.globalAlpha = 1 - u;
        ctx.beginPath(); ctx.arc((x + 0.5) * cs, (y + 0.5) * cs, cs * 0.6 * EASE.out(u), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill();
      }
      ctx.restore();
    }
    for (let k = this.texts.length - 1; k >= 0; k--) {
      const t = this.texts[k], u = (now - t.t0) / (t.big ? 1300 : 900);
      if (u >= 1) { this.texts.splice(k, 1); continue; }
      const sc = t.big ? (u < 0.15 ? EASE.back(u / 0.15) : 1) : 1;
      ctx.save();
      ctx.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1;
      ctx.translate(t.x * cs, (t.y - (t.big ? 0 : u * 0.8)) * cs); ctx.scale(sc, sc);
      ctx.font = `900 ${Math.round(t.size * cs)}px Georgia, 'Times New Roman', serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(3, t.size * cs * 0.18); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
      ctx.strokeText(t.str, 0, 0); ctx.fillStyle = t.color; ctx.fillText(t.str, 0, 0);
      ctx.restore();
    }
  }

  // ---------- Lecture des étapes du moteur ----------
  async play(events, hooks = {}) {
    for (const e of events) {
      await this['on_' + e.t](e, hooks);
      if (e.snap) this.reconcile(e.snap);
    }
  }

  async on_swap(e) {
    const A = this.spriteAt(e.a), B = this.spriteAt(e.b);
    if (!A || !B) return;
    const [ax, ay] = rc(e.a), [bx, by] = rc(e.b);
    if (e.ok) {
      play('swap');
      await Promise.all([this.tween(A, { x: bx, y: by }, 170, 'inOut'), this.tween(B, { x: ax, y: ay }, 170, 'inOut')]);
    } else {
      play('bad');
      await Promise.all([this.tween(A, { x: bx, y: by }, 140, 'inOut'), this.tween(B, { x: ax, y: ay }, 140, 'inOut')]);
      await Promise.all([this.tween(A, { x: ax, y: ay }, 160, 'inOut'), this.tween(B, { x: bx, y: by }, 160, 'inOut')]);
    }
  }

  async on_clear(e, hooks) {
    const now = performance.now();
    let big = false, sword = false;
    for (const f of e.fx) {
      this.fx.push({ ...f, t0: now, dur: f.k === 'grail' ? 500 : 420 });
      if (f.k === 'bomb' || f.k === 'bomb2' || f.k === 'all') big = true;
      if (f.k === 'row' || f.k === 'col') sword = true;
    }
    if (e.fx.some(f => f.k === 'grail' || f.k === 'all')) play('grail');
    if (big) play('boom'); else if (sword) play('sword');
    play('match', e.cascade);
    // pièces qui disparaissent
    let sx = 0, sy = 0, n = 0;
    const gone = [];
    for (const p of e.cleared) {
      const s = this.sprites.get(p.id);
      if (!s) continue;
      sx += s.x; sy += s.y; n++;
      this.burst(Math.round(s.y) * W + Math.round(s.x), p.c >= 0 ? PIECE_COLORS[p.c] : '#fff6c0', 6);
      gone.push(this.tween(s, { s: 0, a: 0 }, 200, 'out').then(() => this.sprites.delete(p.id)));
    }
    // toiles et pierres touchées
    for (let i = 0; i < N; i++) {
      if (e.snap.web[i] < this.web[i]) this.burst(i, '#ffffff', 10);
      if (e.snap.stone[i] < this.stone[i]) { this.burst(i, '#9a9286', 10); play('tap'); }
    }
    this.web = e.snap.web.slice(); this.stone = e.snap.stone.slice();
    if (n && e.pts) this.text('+' + e.pts, sx / n + 0.5, sy / n + 0.5, { size: 0.45, color: '#fff6c0' });
    if (e.cascade >= 2 && hooks.comboWord) {
      const w = hooks.comboWord(e.cascade);
      if (w) this.text(w, W / 2, H / 2, { size: 0.8, color: '#ffd24a', big: true });
    }
    if (big || e.cascade >= 3) { this.shake(big ? 10 : 6); hooks.vibrate && hooks.vibrate(big ? 60 : 30); }
    await Promise.all(gone);
    // nouvelles pièces spéciales
    if (e.created.length) {
      play('special');
      await Promise.all(e.created.map(({ i, p }) => {
        const s = this.addSprite(p, i, { s: 0.2 });
        this.burst(i, '#fff6c0', 12);
        return this.tween(s, { s: 1 }, 260, 'back');
      }));
    }
    if (hooks.onStep) hooks.onStep(e.snap);
  }

  async on_fall(e) {
    const jobs = [];
    for (const f of e.falls) {
      const s = this.sprites.get(f.id);
      if (!s) continue;
      const [x, y] = rc(f.to), d = Math.abs(y - s.y) + Math.abs(x - s.x);
      jobs.push(this.tween(s, { x, y }, 140 + 70 * Math.sqrt(d), 'bounce'));
    }
    const perCol = {};
    for (const sp of e.spawns) perCol[sp.i % W] = (perCol[sp.i % W] || 0) + 1;
    const seen = {};
    for (const sp of e.spawns) {
      const [x, y] = rc(sp.i), c = x;
      seen[c] = (seen[c] || 0) + 1;
      const s = this.addSprite(sp.p, sp.i, { y: y - perCol[c] - 0.2 });
      jobs.push(this.tween(s, { y }, 160 + 70 * Math.sqrt(perCol[c] + 0.2), 'bounce'));
    }
    await Promise.all(jobs);
  }

  async on_exit(e, hooks) {
    play('relic');
    await Promise.all(e.ids.map(id => {
      const s = this.sprites.get(id);
      if (!s) return null;
      this.burst(Math.round(s.y) * W + Math.round(s.x), '#ffd24a', 16);
      this.text('+1000', s.x + 0.5, s.y + 0.5, { size: 0.45, color: '#ffd24a' });
      return this.tween(s, { y: s.y + 1, a: 0 }, 380, 'inOut').then(() => this.sprites.delete(id));
    }));
    if (hooks.onStep) hooks.onStep(e.snap);
  }

  async on_shuffle(e, hooks) {
    play('shuffle');
    if (hooks.onShuffle) hooks.onShuffle();
    const all = [...this.sprites.values()];
    await Promise.all(all.map(s => this.tween(s, { x: W / 2 - 0.5, y: H / 2 - 0.5, s: 0.5 }, 320, 'inOut')));
    await wait(120);
    const jobs = [];
    e.snap.cells.forEach((p, i) => {
      if (!p) return;
      const s = this.sprites.get(p.id);
      const [x, y] = rc(i);
      if (s) jobs.push(this.tween(s, { x, y, s: 1 }, 380, 'back'));
    });
    await Promise.all(jobs);
  }

  async on_convert(e) {
    play('special');
    await Promise.all(e.cells.map(i => {
      const p = e.snap.cells[i];
      const old = this.spriteAt(i);
      if (old) this.sprites.delete(old.p.id);
      const s = this.addSprite(p, i, { s: 0.3 });
      this.burst(i, '#fff6c0', 10);
      return this.tween(s, { s: 1 }, 280, 'back');
    }));
  }

  spriteAt(i) {
    const [x, y] = rc(i);
    for (const s of this.sprites.values()) if (Math.abs(s.x - x) < 0.01 && Math.abs(s.y - y) < 0.01 && s.a > 0.5) return s;
    return null;
  }

  // Filet de sécurité : l'affichage reflète exactement l'état du moteur après chaque étape.
  reconcile(snap) {
    const ids = new Set();
    snap.cells.forEach((p, i) => {
      if (!p) return;
      ids.add(p.id);
      const s = this.sprites.get(p.id);
      const [x, y] = rc(i);
      if (!s) this.addSprite(p, i);
      else { s.p = p; if (!this.tweens.some(t => t.obj === s)) { s.x = x; s.y = y; s.s = 1; s.a = 1; } }
    });
    for (const id of [...this.sprites.keys()]) if (!ids.has(id)) this.sprites.delete(id);
    this.web = snap.web.slice(); this.stone = snap.stone.slice();
  }

  // ---------- Gestes : glisser (doigt ou souris) ou toucher deux cases ----------
  cellAt(ev) {
    const r = this.cv.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left) / (r.width / W)), y = Math.floor((ev.clientY - r.top) / (r.height / H));
    if (x < 0 || y < 0 || x >= W || y >= H) return -1;
    const i = y * W + x;
    return this.hole[i] ? -1 : i;
  }

  bindInput() {
    let start = -1, sx = 0, sy = 0, moved = false;
    this.cv.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      start = this.cellAt(ev); sx = ev.clientX; sy = ev.clientY; moved = false;
      if (start >= 0) try { this.cv.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
    });
    this.cv.addEventListener('pointermove', ev => {
      if (start < 0 || moved || this.targeting) return;
      const dx = ev.clientX - sx, dy = ev.clientY - sy, th = this.cv.getBoundingClientRect().width / W * 0.3;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
      moved = true;
      const c = start % W, r = (start / W) | 0;
      let to = -1;
      if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0 && c < W - 1) to = start + 1; if (dx < 0 && c > 0) to = start - 1; }
      else { if (dy > 0 && r < H - 1) to = start + W; if (dy < 0 && r > 0) to = start - W; }
      if (to >= 0 && !this.hole[to]) this.onSwap(start, to);
      start = -1;
    });
    const end = () => {
      if (start >= 0 && !moved) this.onTap(start);
      start = -1;
    };
    this.cv.addEventListener('pointerup', end);
    this.cv.addEventListener('pointercancel', () => { start = -1; });
  }
}
