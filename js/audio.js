// Sons et musique générés avec la Web Audio API (aucun fichier audio).
let ctx = null, sfxGain, musicGain, musicOn = true, sfxOn = true, musicTimer = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// À appeler sur un premier geste de la joueuse (les navigateurs l'exigent).
export function unlockAudio() { if (ac() && musicOn) startMusic(); }
export function setSfx(on) { sfxOn = on; }
export function setMusic(on) { musicOn = on; if (on) { if (ctx) startMusic(); } else stopMusic(); }

function tone(freq, t, dur, { type = 'sine', vol = 0.3, attack = 0.005, slide = 0, out } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out || sfxGain); o.start(t); o.stop(t + dur + 0.02);
}

let noiseBuf = null;
function noise(t, dur, { vol = 0.3, freq = 1200, q = 1, type = 'bandpass' } = {}) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t + dur + 0.02);
}

const SFX = {
  tap: t => tone(660, t, 0.06, { type: 'triangle', vol: 0.15 }),
  swap: t => noise(t, 0.12, { vol: 0.15, freq: 2400, q: 0.8 }),
  bad: t => { tone(220, t, 0.12, { type: 'square', vol: 0.08 }); tone(180, t + 0.1, 0.16, { type: 'square', vol: 0.08 }); },
  // cliquetis d'épée : partiels métalliques inharmoniques
  sword: t => { for (const [f, v] of [[1870, 0.12], [2730, 0.08], [4120, 0.05], [5610, 0.03]]) tone(f, t, 0.45, { vol: v }); noise(t, 0.05, { vol: 0.25, freq: 5000, q: 2 }); },
  match: (t, n = 1) => { const base = 520 * Math.pow(1.12246, Math.min(n - 1, 8)); tone(base, t, 0.18, { type: 'triangle', vol: 0.22 }); tone(base * 1.5, t + 0.04, 0.16, { type: 'sine', vol: 0.12 }); },
  coin: t => { tone(1320, t, 0.12, { type: 'square', vol: 0.07 }); tone(1980, t + 0.07, 0.28, { type: 'square', vol: 0.07 }); },
  boom: t => { noise(t, 0.5, { vol: 0.5, freq: 300, q: 0.7, type: 'lowpass' }); tone(110, t, 0.4, { type: 'sine', vol: 0.4, slide: 0.4 }); },
  grail: t => { [0, 4, 7, 12, 16].forEach((s, k) => tone(523 * Math.pow(2, s / 12), t + k * 0.06, 0.5, { type: 'sine', vol: 0.14 })); },
  special: t => { tone(880, t, 0.1, { type: 'triangle', vol: 0.18 }); tone(1320, t + 0.08, 0.25, { type: 'triangle', vol: 0.18 }); },
  shuffle: t => { for (let k = 0; k < 6; k++) noise(t + k * 0.05, 0.06, { vol: 0.12, freq: 1800 + k * 300, q: 3 }); },
  relic: t => { [0, 5, 9].forEach((s, k) => tone(660 * Math.pow(2, s / 12), t + k * 0.08, 0.3, { type: 'triangle', vol: 0.15 })); },
  star: (t, n = 1) => tone(784 * Math.pow(1.26, n - 1), t, 0.35, { type: 'triangle', vol: 0.22 }),
  // fanfare de victoire : « trompettes » en dents de scie filtrées
  win: t => {
    const notes = [[392, 0, 0.15], [523, 0.15, 0.15], [659, 0.3, 0.15], [784, 0.45, 0.5], [659, 0.95, 0.15], [784, 1.1, 0.7]];
    for (const [f, d, l] of notes) { brass(f, t + d, l); brass(f / 2, t + d, l, 0.05); }
  },
  lose: t => { [392, 370, 349, 311].forEach((f, k) => tone(f, t + k * 0.22, 0.3, { type: 'triangle', vol: 0.15 })); },
  unlock: t => { [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, t + k * 0.07, 0.4, { type: 'triangle', vol: 0.15 })); },
  trophy: t => { tone(988, t, 0.15, { type: 'square', vol: 0.06 }); tone(1319, t + 0.12, 0.45, { type: 'square', vol: 0.06 }); },
};

function brass(freq, t, dur, vol = 0.09) {
  const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.value = freq;
  f.type = 'lowpass'; f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(2400, t + 0.05);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + dur + 0.05);
}

export function play(name, arg) {
  if (!sfxOn || !ac()) return;
  try { SFX[name](ctx.currentTime + 0.01, arg); } catch (e) { /* son facultatif */ }
}

// ---------- Musique : petite ritournelle médiévale en ré dorien, luth + bourdon ----------
const D = 293.66, st = n => D * Math.pow(2, n / 12);
const MELODY = [0, 3, 5, 7, 5, 3, 2, 0, 2, 3, 5, 3, 2, -2, 0, null, 7, 9, 10, 9, 7, 5, 3, 5, 7, 5, 3, 2, 0, 2, 0, null];
const BASS = [0, 0, -5, -5, -2, -2, -5, 0];
let step = 0, nextT = 0;

function pluck(freq, t, dur, vol) {
  tone(freq, t, dur, { type: 'triangle', vol, attack: 0.004, out: musicGain });
  tone(freq * 2, t, dur * 0.5, { type: 'sine', vol: vol * 0.3, attack: 0.004, out: musicGain });
}

function startMusic() {
  if (musicTimer || !musicOn) return;
  nextT = ctx.currentTime + 0.1;
  musicTimer = setInterval(() => {
    while (nextT < ctx.currentTime + 0.4) {
      const beat = 0.27, m = MELODY[step % MELODY.length];
      if (m !== null) pluck(st(m), nextT, beat * 1.8, 0.5);
      if (step % 4 === 0) pluck(st(BASS[(step / 4) % BASS.length] - 12), nextT, beat * 4, 0.35);
      step++; nextT += beat;
    }
  }, 120);
}

function stopMusic() { clearInterval(musicTimer); musicTimer = null; }

export function vibrate(pattern, enabled) {
  if (enabled && navigator.vibrate) try { navigator.vibrate(pattern); } catch (e) { /* facultatif */ }
}
