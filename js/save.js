// Sauvegarde locale (localStorage protégé par try/catch : le jeu marche même si le stockage est bloqué).
const KEY = 'graal-croustillant-v1';

export function blankSave() {
  return {
    v: 1,
    name: '',              // nom du compte, affiché sur l'écran titre
    levels: {},            // { [id]: { stars, best } }
    unlocked: ['arthur'],  // personnages débloqués
    seen: [],              // personnages dont l'écran de déblocage a été montré
    trophies: {},          // { [id]: date }
    chapters: [],          // cinématiques déjà vues
    companion: 'arthur',
    gold: 0,               // pièces d'or gagnées avec les coups d'avance
    decor: [],             // décorations de Camelot achetées
    settings: { sound: true, music: true, hint: true, vibrate: true },
    stats: { wins: 0, losses: 0, swords: 0, bombs: 0, grails: 0, maxCascade: 0, maxLeft: 0, lastMoveWins: 0,
      col: [0, 0, 0, 0, 0, 0], midnight: 0, powers: [], xCross: 0, xBombSword: 0, xBombBomb: 0, xGrail2: 0,
      shuffles: 0, merlinGifts: 0, badSwaps: 0, webs: 0, stonesBroken: 0, relics: 0 },
  };
}

export function load() {
  const base = blankSave();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = JSON.parse(raw);
    return { ...base, ...s, settings: { ...base.settings, ...s.settings }, stats: { ...base.stats, ...s.stats } };
  } catch (e) { return base; }
}

export function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* stockage indisponible : on continue sans */ }
}

export function reset() {
  try { localStorage.removeItem(KEY); } catch (e) { /* rien */ }
  return blankSave();
}

// Code de sauvegarde : pour transférer sa partie vers un autre appareil ou une autre adresse du jeu.
export function exportCode(s) {
  const bytes = new TextEncoder().encode(JSON.stringify(s));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return 'GRAAL1:' + btoa(bin);
}

export function importCode(code) {
  const m = String(code).match(/GRAAL1:\s*([A-Za-z0-9+/=\s]+)/); // tolère du texte autour (copier-coller depuis un message)
  if (!m) return null;
  try {
    const bin = atob(m[1].replace(/\s/g, ''));
    const s = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    if (!s || s.v !== 1 || typeof s.levels !== 'object') return null;
    const base = blankSave();
    return { ...base, ...s, settings: { ...base.settings, ...s.settings }, stats: { ...base.stats, ...s.stats } };
  } catch (e) { return null; }
}
