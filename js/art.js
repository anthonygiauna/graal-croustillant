// Graphismes dessinés en code : pièces (canvas), portraits, décors et médailles (SVG).
// Style « enluminure cartoon » : couleurs chaudes, contours épais.

export const INK = '#3a2210';
export const PIECE_COLORS = ['#f5c53a', '#ff9a2e', '#4a90e2', '#a8693a', '#e04a3a', '#9b59d0'];

// ---------- Pièces (unités : boîte de 100 x 100) ----------
function outline(ctx, w = 5) { ctx.lineWidth = w; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
function lin(ctx, y0, y1, a, b) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function shine(ctx, x, y, rx, ry, rot = -0.5) {
  ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill(); ctx.restore();
}

const DRAW = [
  // 0 Graal (coupe dorée et rubis)
  ctx => {
    ctx.beginPath();
    ctx.moveTo(22, 20); ctx.lineTo(78, 20); ctx.quadraticCurveTo(80, 56, 54, 60); ctx.lineTo(54, 70);
    ctx.quadraticCurveTo(70, 72, 72, 84); ctx.lineTo(28, 84); ctx.quadraticCurveTo(30, 72, 46, 70); ctx.lineTo(46, 60);
    ctx.quadraticCurveTo(20, 56, 22, 20); ctx.closePath();
    ctx.fillStyle = lin(ctx, 18, 86, '#ffe680', '#e0a21c'); ctx.fill(); outline(ctx);
    ctx.beginPath(); ctx.ellipse(50, 21, 28, 5, 0, 0, Math.PI * 2); ctx.fillStyle = '#b87a10'; ctx.fill(); outline(ctx, 4);
    ctx.beginPath(); ctx.arc(50, 40, 7, 0, Math.PI * 2); ctx.fillStyle = '#e8263a'; ctx.fill(); outline(ctx, 3.5);
    shine(ctx, 34, 36, 4, 10, 0.2);
  },
  // 1 Fromage (part de mimolette trouée)
  ctx => {
    ctx.beginPath(); ctx.moveTo(12, 70); ctx.lineTo(88, 70); ctx.lineTo(88, 40); ctx.lineTo(24, 30); ctx.closePath();
    ctx.fillStyle = lin(ctx, 30, 72, '#ffc04a', '#f08a1a'); ctx.fill(); outline(ctx);
    ctx.beginPath(); ctx.moveTo(12, 70); ctx.lineTo(24, 30); ctx.lineTo(88, 40); ctx.lineTo(80, 44); ctx.lineTo(22, 38); ctx.closePath();
    ctx.fillStyle = '#ffd98a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, 70); ctx.lineTo(88, 70); ctx.lineTo(88, 40); ctx.lineTo(24, 30); ctx.closePath(); outline(ctx);
    for (const [x, y, r] of [[40, 56, 6], [64, 52, 5], [74, 62, 3.5], [28, 62, 3.5], [56, 64, 3]]) {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#c86a10'; ctx.fill(); outline(ctx, 2.5);
    }
  },
  // 2 Épée (lame d'acier, garde dorée, poignée bleue)
  ctx => {
    ctx.save(); ctx.translate(50, 50); ctx.rotate(-Math.PI / 4);
    ctx.beginPath(); ctx.moveTo(-7, -14); ctx.lineTo(-7, -38); ctx.lineTo(0, -46); ctx.lineTo(7, -38); ctx.lineTo(7, -14); ctx.closePath();
    ctx.fillStyle = lin(ctx, -46, -14, '#ffffff', '#b8c8dc'); ctx.fill(); outline(ctx);
    ctx.beginPath(); ctx.moveTo(0, -42); ctx.lineTo(0, -16); ctx.strokeStyle = '#8aa0bc'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-20, -15, 40, 9, 4); ctx.fillStyle = '#f5c53a'; ctx.fill(); outline(ctx, 4.5);
    ctx.beginPath(); ctx.roundRect(-5.5, -7, 11, 28, 4); ctx.fillStyle = '#2f6fd6'; ctx.fill(); outline(ctx, 4.5);
    ctx.beginPath(); ctx.arc(0, 26, 8, 0, Math.PI * 2); ctx.fillStyle = '#f5c53a'; ctx.fill(); outline(ctx, 4.5);
    ctx.restore();
    ctx.beginPath(); ctx.arc(50, 50, 40, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(74,144,226,.0)'; ctx.stroke();
  },
  // 3 Chope de cervoise (bois cerclé, mousse)
  ctx => {
    ctx.beginPath(); ctx.roundRect(22, 30, 44, 54, 6); ctx.fillStyle = lin(ctx, 30, 84, '#c98a4a', '#8a5224'); ctx.fill(); outline(ctx);
    ctx.beginPath(); ctx.moveTo(66, 40); ctx.bezierCurveTo(90, 40, 90, 72, 66, 72); ctx.lineWidth = 13; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = 6; ctx.strokeStyle = '#a8693a'; ctx.stroke();
    for (const y of [42, 70]) { ctx.beginPath(); ctx.rect(22, y - 3, 44, 6); ctx.fillStyle = '#9aa4ae'; ctx.fill(); outline(ctx, 3); }
    ctx.beginPath();
    ctx.arc(30, 28, 10, Math.PI, 0); ctx.arc(46, 24, 11, Math.PI, 0); ctx.arc(60, 28, 9, Math.PI, 0);
    ctx.lineTo(68, 34); ctx.lineTo(20, 34); ctx.closePath();
    ctx.fillStyle = '#fffaf0'; ctx.fill(); outline(ctx, 4.5);
    shine(ctx, 31, 56, 3.5, 10, 0);
  },
  // 4 Bouclier (rouge, croix dorée)
  ctx => {
    ctx.beginPath(); ctx.moveTo(18, 18); ctx.lineTo(82, 18); ctx.lineTo(82, 46); ctx.quadraticCurveTo(82, 74, 50, 88);
    ctx.quadraticCurveTo(18, 74, 18, 46); ctx.closePath();
    ctx.fillStyle = lin(ctx, 18, 88, '#ff6a52', '#c22a1e'); ctx.fill(); outline(ctx);
    ctx.beginPath(); ctx.rect(44, 22, 12, 60); ctx.rect(24, 38, 52, 12); ctx.fillStyle = '#ffd24a'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(18, 18); ctx.lineTo(82, 18); ctx.lineTo(82, 46); ctx.quadraticCurveTo(82, 74, 50, 88);
    ctx.quadraticCurveTo(18, 74, 18, 46); ctx.closePath(); outline(ctx);
    shine(ctx, 30, 30, 4, 7, -0.3);
  },
  // 5 Couronne (violette, bord doré, perles)
  ctx => {
    ctx.beginPath(); ctx.moveTo(16, 74); ctx.lineTo(14, 30); ctx.lineTo(32, 48); ctx.lineTo(50, 22); ctx.lineTo(68, 48);
    ctx.lineTo(86, 30); ctx.lineTo(84, 74); ctx.closePath();
    ctx.fillStyle = lin(ctx, 22, 76, '#c58af0', '#7a2fb8'); ctx.fill(); outline(ctx);
    ctx.beginPath(); ctx.roundRect(14, 66, 72, 14, 4); ctx.fillStyle = '#f5c53a'; ctx.fill(); outline(ctx, 4.5);
    for (const [x, y] of [[14, 28], [50, 19], [86, 28]]) { ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = '#fff4d6'; ctx.fill(); outline(ctx, 3.5); }
    for (const [x, c] of [[30, '#2fd07a'], [50, '#e8263a'], [70, '#2fd07a']]) { ctx.beginPath(); ctx.arc(x, 73, 4, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); outline(ctx, 2.5); }
  },
];

function drawGrailSacred(ctx) {
  ctx.save();
  for (let k = 0; k < 12; k++) {
    ctx.beginPath(); ctx.moveTo(50, 50);
    const a = (k / 12) * Math.PI * 2;
    ctx.arc(50, 50, 48, a, a + 0.22); ctx.closePath();
    ctx.fillStyle = `hsla(${k * 30},90%,65%,.75)`; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(50, 50, 34, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(50, 50, 4, 50, 50, 34); g.addColorStop(0, '#fffef0'); g.addColorStop(1, '#ffe27a');
  ctx.fillStyle = g; ctx.fill(); outline(ctx, 4);
  ctx.translate(50, 52); ctx.scale(0.62, 0.62); ctx.translate(-50, -52);
  ctx.beginPath();
  ctx.moveTo(22, 20); ctx.lineTo(78, 20); ctx.quadraticCurveTo(80, 56, 54, 60); ctx.lineTo(54, 70);
  ctx.quadraticCurveTo(70, 72, 72, 84); ctx.lineTo(28, 84); ctx.quadraticCurveTo(30, 72, 46, 70); ctx.lineTo(46, 60);
  ctx.quadraticCurveTo(20, 56, 22, 20); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill(); outline(ctx, 7);
  ctx.beginPath(); ctx.arc(50, 40, 8, 0, Math.PI * 2); ctx.fillStyle = '#4ad0ff'; ctx.fill(); outline(ctx, 5);
  ctx.restore();
}

function drawRelic(ctx) {
  // La Sainte Chaussette (une relique, ne posez pas de questions)
  ctx.beginPath(); ctx.ellipse(46, 14, 18, 6, 0, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = '#ffd24a'; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(34, 22); ctx.lineTo(60, 22); ctx.lineTo(60, 58); ctx.quadraticCurveTo(84, 60, 84, 74);
  ctx.quadraticCurveTo(84, 88, 64, 88); ctx.lineTo(44, 88); ctx.quadraticCurveTo(32, 88, 34, 70); ctx.closePath();
  ctx.fillStyle = '#fbf3e6'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#d63a2f';
  for (const y of [22, 40, 58, 76]) ctx.fillRect(20, y, 80, 8);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(34, 22); ctx.lineTo(60, 22); ctx.lineTo(60, 58); ctx.quadraticCurveTo(84, 60, 84, 74);
  ctx.quadraticCurveTo(84, 88, 64, 88); ctx.lineTo(44, 88); ctx.quadraticCurveTo(32, 88, 34, 70); ctx.closePath();
  outline(ctx);
  ctx.beginPath(); ctx.roundRect(31, 18, 32, 10, 4); ctx.fillStyle = '#d63a2f'; ctx.fill(); outline(ctx, 4);
}

function overlay(ctx, sp, color) {
  if (sp === 'row' || sp === 'col') {
    ctx.save();
    if (sp === 'col') { ctx.translate(50, 50); ctx.rotate(Math.PI / 2); ctx.translate(-50, -50); }
    ctx.globalAlpha = 0.85;
    for (const y of [38, 62]) { ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(90, y); ctx.lineWidth = 7; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.globalAlpha = 1;
    for (const dir of [-1, 1]) {
      const x = 50 + dir * 44;
      ctx.beginPath(); ctx.moveTo(x, 50); ctx.lineTo(x - dir * 12, 40); ctx.lineTo(x - dir * 12, 60); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); outline(ctx, 3);
    }
    ctx.restore();
  } else if (sp === 'bomb') {
    ctx.beginPath(); ctx.arc(50, 50, 44, 0, Math.PI * 2); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#c8924a'; ctx.setLineDash([9, 5]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(80, 20, 11, 0, Math.PI * 2); ctx.fillStyle = '#8a8a96'; ctx.fill(); outline(ctx, 4);
    ctx.beginPath(); ctx.arc(77, 17, 3, 0, Math.PI * 2); ctx.fillStyle = '#c8c8d2'; ctx.fill();
  }
}

// Dessine une pièce dans une boîte de taille `size` en (x, y).
export function drawPiece(ctx, p, x, y, size) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 100, size / 100);
  if (p.relic) drawRelic(ctx);
  else if (p.sp === 'grail') drawGrailSacred(ctx);
  else {
    if (p.sp) { ctx.save(); ctx.translate(50, 50); ctx.scale(0.86, 0.86); ctx.translate(-50, -50); }
    DRAW[p.c](ctx);
    if (p.sp) ctx.restore();
    overlay(ctx, p.sp, PIECE_COLORS[p.c]);
  }
  ctx.restore();
}

// Cache de sprites : une image par (couleur, spéciale) à la taille voulue.
const sprites = new Map();
let spriteSize = 0;
export function sprite(p, size) {
  if (size !== spriteSize) { sprites.clear(); spriteSize = size; }
  const key = p.relic ? 'relic' : p.sp === 'grail' ? 'grail' : p.c + (p.sp || '');
  let c = sprites.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = c.height = Math.ceil(size);
    drawPiece(c.getContext('2d'), p, 0, 0, size);
    sprites.set(key, c);
  }
  return c;
}

// Icône d'une pièce en SVG-like (via canvas → data URL), pour l'interface (objectifs).
const iconCache = {};
export function pieceIcon(c, size = 64) {
  const key = c + ':' + size;
  if (!iconCache[key]) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    drawPiece(cv.getContext('2d'), typeof c === 'object' ? c : { c, sp: null }, 0, 0, size);
    iconCache[key] = cv.toDataURL();
  }
  return iconCache[key];
}

// ---------- Portraits (SVG) ----------
const S = (tag, a, inner = '') => `<${tag} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(' ')}>${inner}</${tag}>`;
const st = { stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };

export function portrait(ch) {
  const L = ch.look;
  let s = S('circle', { cx: 50, cy: 50, r: 47, fill: L.bg, ...st });
  if (L.dragon) return svg(s + dragon());
  const hairBack = {
    long: `<path d="M26 42 Q22 82 30 88 L70 88 Q78 82 74 42 Z" fill="${L.hair}" ${a(st)}/>`,
    flowing: `<path d="M27 42 Q20 70 30 76 L70 76 Q80 70 73 42 Z" fill="${L.hair}" ${a(st)}/>`,
    bun: `<circle cx="50" cy="20" r="10" fill="${L.hair}" ${a(st)}/>`,
    mane: `<circle cx="50" cy="46" r="32" fill="${L.hair}" ${a(st)}/>`,
  }[L.hairStyle] || '';
  s += `<g clip-path="url(#pc)">` + hairBack;
  s += `<path d="M12 100 Q14 74 50 70 Q86 74 88 100 Z" fill="${L.cloth}" ${a(st)}/>`;
  if (L.cape) s += `<path d="M12 100 Q12 78 30 73 L50 96 L70 73 Q88 78 88 100 Z" fill="${L.cape}" ${a(st)}/><path d="M26 74 Q50 88 74 74 L70 82 Q50 94 30 82 Z" fill="#fffaf0" ${a({ ...st, "stroke-width": 2.5 })}/>` + [34, 42, 50, 58, 66].map((x, k) => `<path d="M${x} ${80 + (k % 2) * 3} l0 4" stroke="#1a1010" stroke-width="2.4"/>`).join("");
  if (L.apron) s += `<path d="M36 76 L64 76 L66 100 L34 100 Z" fill="#fffaf0" ${a(st)}/>`;
  s += `<rect x="43" y="60" width="14" height="14" fill="${L.skin}" ${a(st)}/>`;
  s += `</g>`;
  s += `<circle cx="29" cy="49" r="5" fill="${L.skin}" ${a(st)}/><circle cx="71" cy="49" r="5" fill="${L.skin}" ${a(st)}/>`;
  s += `<ellipse cx="50" cy="46" rx="20" ry="22" fill="${L.skin}" ${a(st)}/>`;
  const hairFront = {
    short: `<path d="M30 42 Q30 22 50 22 Q70 22 70 42 Q62 32 50 33 Q38 32 30 42 Z" fill="${L.hair}" ${a(st)}/>`,
    long: `<path d="M30 46 Q28 22 50 22 Q72 22 70 46 Q64 30 50 31 Q36 30 30 46 Z" fill="${L.hair}" ${a(st)}/>`,
    flowing: `<path d="M29 44 Q28 20 52 21 Q74 24 71 42 Q60 26 46 34 Q38 38 29 44 Z" fill="${L.hair}" ${a(st)}/>`,
    bowl: `<path d="M28 44 Q28 20 50 20 Q72 20 72 44 L66 40 L60 43 L54 39 L48 43 L42 39 L36 43 Z" fill="${L.hair}" ${a(st)}/>`,
    wild: `<path d="M28 42 L24 30 L33 32 L32 20 L42 26 L48 14 L54 25 L64 17 L64 29 L76 27 L72 42 Q60 31 50 32 Q40 31 28 42 Z" fill="${L.hair}" ${a(st)}/>`,
    bun: `<path d="M30 42 Q30 24 50 24 Q70 24 70 42 Q60 31 50 32 Q40 31 30 42 Z" fill="${L.hair}" ${a(st)}/>`,
    bald: `<path d="M29 46 Q28 38 32 36 M71 46 Q72 38 68 36" fill="none" stroke="${L.hair}" stroke-width="5"/>`,
    mane: `<path d="M31 40 Q34 24 50 24 Q66 24 69 40 Q60 30 50 31 Q40 30 31 40 Z" fill="${L.hair}" ${a(st)}/>`,
  }[L.hairStyle] || '';
  s += hairFront;
  // visage
  const eyesY = 49;
  if (L.bushy) s += `<path d="M36 43 Q41 37 47 41 M53 41 Q59 37 64 43" fill="none" stroke="${L.hair}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<path d="M38 42 Q42 39 46 42 M54 42 Q58 39 62 42" fill="none" ${a({ ...st, 'stroke-width': 2.5 })}/>`;
  s += `<ellipse cx="42" cy="${eyesY}" rx="2.8" ry="3.4" fill="${INK}"/><ellipse cx="58" cy="${eyesY}" rx="2.8" ry="3.4" fill="${INK}"/>`;
  s += `<circle cx="43" cy="${eyesY - 1.2}" r="1" fill="#fff"/><circle cx="59" cy="${eyesY - 1.2}" r="1" fill="#fff"/>`;
  if (L.glasses) s += `<circle cx="42" cy="49" r="6" fill="none" ${a({ ...st, 'stroke-width': 2 })}/><circle cx="58" cy="49" r="6" fill="none" ${a({ ...st, 'stroke-width': 2 })}/><path d="M48 49 L52 49" ${a({ ...st, 'stroke-width': 2 })}/>`;
  s += `<path d="M50 50 Q47 56 51 57" fill="none" ${a({ ...st, 'stroke-width': 2.2 })}/>`;
  if (L.blush) s += `<circle cx="36" cy="56" r="4" fill="#ff8a8a" opacity=".55"/><circle cx="64" cy="56" r="4" fill="#ff8a8a" opacity=".55"/>`;
  const beard = {
    short: `<path d="M31 52 Q32 72 50 74 Q68 72 69 52 Q64 64 50 64 Q36 64 31 52 Z" fill="${L.hair}" ${a(st)}/>`,
    long: `<path d="M31 52 Q30 70 40 80 L50 92 L60 80 Q70 70 69 52 Q64 64 50 64 Q36 64 31 52 Z" fill="${L.hair}" ${a(st)}/>`,
    goatee: `<path d="M44 64 Q50 76 56 64 Z" fill="${L.hair}" ${a(st)}/>`,
    mustache: `<path d="M38 60 Q44 55 50 59 Q56 55 62 60 Q56 62 50 61 Q44 62 38 60 Z" fill="${L.hair}" ${a(st)}/>`,
  }[L.beard] || '';
  const mouth = {
    smile: `<path d="M43 61 Q50 66 57 61" fill="none" ${a({ ...st, 'stroke-width': 2.5 })}/>`,
    grin: `<path d="M41 59 Q50 70 59 59 Z" fill="#fff" ${a({ ...st, 'stroke-width': 2.5 })}/>`,
    worried: `<path d="M43 63 Q46 60 50 63 Q54 66 57 62" fill="none" ${a({ ...st, 'stroke-width': 2.5 })}/>`,
    smirk: `<path d="M44 62 Q52 64 57 59" fill="none" ${a({ ...st, 'stroke-width': 2.5 })}/>`,
    flat: `<path d="M44 62 L56 62" fill="none" ${a({ ...st, 'stroke-width': 2.5 })}/>`,
    sing: `<ellipse cx="50" cy="62" rx="4" ry="5" fill="#7a1a1a" ${a({ ...st, 'stroke-width': 2.5 })}/>`,
  }[L.mouth] || '';
  s += (L.beard === 'mustache' ? mouth + beard : beard + mouth);
  if (L.mouth === 'sing') s += `<text x="74" y="30" font-size="16" fill="${INK}">♪</text><text x="80" y="44" font-size="12" fill="${INK}">♫</text>`;
  const hat = {
    crown: `<path d="M34 26 Q50 14 66 26 Z" fill="#b8202e" ${a(st)}/><path d="M31 30 L28 11 L39 20 L50 5 L61 20 L72 11 L69 30 Z" fill="#f5c53a" ${a(st)}/><rect x="30" y="25" width="40" height="7" rx="2" fill="#e0a21c" ${a({ ...st, "stroke-width": 2.5 })}/><circle cx="28" cy="11" r="2.6" fill="#fff4d6" ${a({ ...st, "stroke-width": 1.5 })}/><circle cx="50" cy="5" r="3" fill="#fff4d6" ${a({ ...st, "stroke-width": 1.5 })}/><circle cx="72" cy="11" r="2.6" fill="#fff4d6" ${a({ ...st, "stroke-width": 1.5 })}/><circle cx="50" cy="28.5" r="3" fill="#e8263a" ${a({ ...st, "stroke-width": 1.5 })}/><circle cx="39" cy="28.5" r="2" fill="#2fb0e8"/><circle cx="61" cy="28.5" r="2" fill="#2fd07a"/>`,
    tiara: `<path d="M36 28 Q50 16 64 28 L60 26 L50 18 L40 26 Z" fill="#f5c53a" ${a({ ...st, 'stroke-width': 2.5 })}/><circle cx="50" cy="20" r="3" fill="#4ad0ff" ${a({ ...st, 'stroke-width': 1.5 })}/>`,
    helmet: `<path d="M27 44 Q26 16 50 16 Q74 16 73 44 L66 44 Q64 30 50 30 Q36 30 34 44 Z" fill="#b8c0cc" ${a(st)}/><path d="M50 16 L50 30" ${a({ ...st, 'stroke-width': 2.5 })}/><path d="M46 30 L54 30 L52 50 L48 50 Z" fill="#b8c0cc" ${a({ ...st, 'stroke-width': 2.5 })}/>`,
    wizard: `<path d="M18 33 Q50 22 82 33 Q50 41 18 33 Z" fill="#2e2266" ${a(st)}/><path d="M31 32 Q44 14 50 -4 Q60 6 70 4 Q62 12 69 32 Z" fill="#4b3a8c" ${a(st)}/><path d="M33 29 Q50 24 67 29" fill="none" stroke="#f5c53a" stroke-width="3.5"/><text x="41" y="21" font-size="9" fill="#f5c53a">★</text><text x="55" y="14" font-size="7" fill="#fff4b0">★</text><path d="M58 24 A4 4 0 1 1 62 19 A3 3 0 1 0 58 24 Z" fill="#fff4b0"/>`,
    jester: `<path d="M28 34 Q30 18 50 22 Q70 18 72 34 Z" fill="#f5c53a" ${a(st)}/><path d="M30 30 Q16 14 12 30 M70 30 Q84 14 88 30" fill="none" ${a({ ...st, 'stroke-width': 7, stroke: '#d14a8a' })}/><circle cx="12" cy="31" r="4" fill="#f5c53a" ${a({ ...st, 'stroke-width': 2 })}/><circle cx="88" cy="31" r="4" fill="#f5c53a" ${a({ ...st, 'stroke-width': 2 })}/>`,
    witch: `<path d="M20 32 Q50 24 80 32 Q50 40 20 32 Z" fill="#1a0a20" ${a(st)}/><path d="M32 30 L58 0 L66 30 Z" fill="#2a1030" ${a(st)}/><path d="M36 26 L64 26" stroke="#9b59d0" stroke-width="4"/>`,
    pearls: `<path d="M32 30 Q50 22 68 30" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="1 5" stroke-linecap="round"/>`,
  }[L.hat] || '';
  s += hat;
  if (L.staff) s += `<path d="M84 98 L80 30" stroke="#7a4a2a" stroke-width="5" stroke-linecap="round"/><path d="M84 98 L80 30" fill="none" ${a({ ...st, "stroke-width": 1.5 })}/><circle cx="80" cy="26" r="9" fill="#7ad8ff" opacity=".35"/><circle cx="80" cy="26" r="5.5" fill="#c8f0ff" ${a({ ...st, "stroke-width": 2 })}/>`;
  return svg(s);
}
const a = o => Object.entries(o).map(([k, v]) => `${k}="${v}"`).join(' ');
const svg = inner => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="pc"><circle cx="50" cy="50" r="45.5"/></clipPath></defs>${inner}</svg>`;

function dragon() {
  return `<path d="M30 30 L24 10 L38 24 Z M70 30 L76 10 L62 24 Z" fill="#f5c53a" ${a(st)}/>
  <path d="M14 100 Q16 76 50 72 Q84 76 86 100 Z" fill="#b8402e" ${a(st)}/>
  <path d="M40 76 L50 86 L60 76" fill="none" stroke="#f5e08a" stroke-width="6"/>
  <ellipse cx="50" cy="46" rx="26" ry="22" fill="#e0583a" ${a(st)}/>
  <ellipse cx="50" cy="60" rx="20" ry="13" fill="#f39a74" ${a(st)}/>
  <ellipse cx="43" cy="58" rx="2.5" ry="2" fill="${INK}"/><ellipse cx="57" cy="58" rx="2.5" ry="2" fill="${INK}"/>
  <circle cx="38" cy="40" r="8" fill="#fff" ${a(st)}/><circle cx="62" cy="40" r="8" fill="#fff" ${a(st)}/>
  <circle cx="40" cy="41" r="3.5" fill="${INK}"/><circle cx="60" cy="41" r="3.5" fill="${INK}"/>
  <path d="M42 66 Q50 71 58 66" fill="none" ${a({ ...st, 'stroke-width': 2.5 })}/>
  <path d="M58 68 Q70 62 76 70 Q68 76 58 68 Z" fill="#2fb04a" ${a({ ...st, 'stroke-width': 2 })}/>
  <circle cx="80" cy="54" r="4" fill="#ddd" opacity=".8"/><circle cx="86" cy="46" r="3" fill="#ddd" opacity=".6"/>`;
}

// Merlin en petit, pour les bulles d'aide.
export const merlinFace = () => portrait({ look: { skin: '#f0c8a8', hair: '#e8e8ee', hairStyle: 'long', beard: 'long', hat: 'wizard', cloth: '#4b3a8c', bg: '#b9b0e8', mouth: 'smile', staff: true, bushy: true } });

export function narratorIcon() {
  return svg(`<circle cx="50" cy="50" r="47" fill="#f3e2b8" ${a(st)}/>
  <path d="M28 70 L28 30 Q40 24 50 32 Q60 24 72 30 L72 70 Q60 64 50 72 Q40 64 28 70 Z" fill="#fffaf0" ${a(st)}/>
  <path d="M50 32 L50 72" ${a(st)}/><path d="M34 40 L44 40 M34 48 L44 48 M56 40 L66 40 M56 48 L66 48 M34 56 L44 56" ${a({ ...st, 'stroke-width': 2 })}/>`);
}

// ---------- Médailles des trophées ----------
export function medal(unlocked, n) {
  const c1 = unlocked ? '#ffd75e' : '#c9c2b4', c2 = unlocked ? '#d9961c' : '#9a9286';
  const r1 = unlocked ? '#d63a2f' : '#a8a092', r2 = unlocked ? '#2f5fb3' : '#8a8478';
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M30 4 L46 42 L36 46 L20 8 Z" fill="${r1}" ${a(st)}/><path d="M70 4 L54 42 L64 46 L80 8 Z" fill="${r2}" ${a(st)}/>
  <circle cx="50" cy="64" r="30" fill="${c2}" ${a(st)}/><circle cx="50" cy="64" r="22" fill="${c1}" ${a({ ...st, 'stroke-width': 2 })}/>
  <text x="50" y="${unlocked ? 73 : 74}" text-anchor="middle" font-size="${unlocked ? 26 : 24}" font-weight="700" fill="${INK}" font-family="Georgia,serif">${unlocked ? '★' : '?'}</text></svg>`;
}

// ---------- Décors des chapitres ----------
export function scene(theme) {
  const body = {
    cour: `<rect width="400" height="300" fill="#f9d98a"/><circle cx="320" cy="70" r="34" fill="#fff2b0"/>
      <path d="M0 230 Q100 205 200 225 T400 220 L400 300 L0 300Z" fill="#9ccc65"/>
      <g fill="#d8c3a0" stroke="${INK}" stroke-width="4" stroke-linejoin="round">
        <rect x="90" y="110" width="220" height="120"/><rect x="60" y="80" width="50" height="150"/><rect x="290" y="80" width="50" height="150"/>
        <path d="M60 80 l0-14 h10 v8 h10 v-8 h10 v8 h10 v-8 h10 v14Z"/><path d="M290 80 l0-14 h10 v8 h10 v-8 h10 v8 h10 v-8 h10 v14Z"/>
        <path d="M170 230 v-50 q30 -30 60 0 v50Z" fill="#7a4a2a"/></g>
      <path d="M85 66 v-36 l30 10 -30 10" fill="#d63a2f" stroke="${INK}" stroke-width="3"/><path d="M315 66 v-36 l30 10 -30 10" fill="#2f5fb3" stroke="${INK}" stroke-width="3"/>`,
    foret: `<rect width="400" height="300" fill="#cfe8b0"/><path d="M0 240 Q200 215 400 240 L400 300 L0 300Z" fill="#6aa84f"/>
      ${[30, 110, 200, 290, 370].map((x, k) => `<rect x="${x - 8}" y="${170 + (k % 2) * 10}" width="16" height="70" fill="#7a4a2a" stroke="${INK}" stroke-width="4"/>
      <circle cx="${x}" cy="${150 + (k % 2) * 10}" r="${44 - (k % 2) * 8}" fill="${k % 2 ? '#4a9a3a' : '#3a8a4a'}" stroke="${INK}" stroke-width="4"/>`).join('')}
      <g stroke="${INK}" stroke-width="3"><path d="M150 250 q12 -20 24 0Z" fill="#e04a3a"/><rect x="158" y="250" width="8" height="12" fill="#fff"/></g>`,
    lac: `<rect width="400" height="300" fill="#bfe4f2"/><path d="M0 170 Q60 140 120 160 T260 150 T400 165 L400 300 L0 300Z" fill="#7ab86a"/>
      <ellipse cx="200" cy="225" rx="180" ry="52" fill="#4aa0d0" stroke="${INK}" stroke-width="4"/>
      <path d="M60 225 q15 -8 30 0 M150 240 q15 -8 30 0 M250 220 q15 -8 30 0" stroke="#d8f0fa" stroke-width="4" fill="none"/>
      <path d="M200 215 v-70" stroke="#e8eef4" stroke-width="10"/><path d="M200 215 v-70" stroke="${INK}" stroke-width="2" fill="none"/>
      <rect x="186" y="150" width="28" height="7" fill="#f5c53a" stroke="${INK}" stroke-width="3"/>
      <path d="M190 228 q0 -16 10 -16 q10 0 10 16Z" fill="#cfe6ef" stroke="${INK}" stroke-width="3"/>`,
    marais: `<rect width="400" height="300" fill="#c8d0b8"/><rect y="200" width="400" height="100" fill="#6a7a4a"/>
      <ellipse cx="120" cy="240" rx="90" ry="20" fill="#4a5a3a"/><ellipse cx="300" cy="255" rx="80" ry="16" fill="#4a5a3a"/>
      ${[40, 70, 340, 370].map(x => `<path d="M${x} 230 q-6 -50 4 -90" stroke="#3a4a2a" stroke-width="5" fill="none"/><ellipse cx="${x + 3}" cy="140" rx="5" ry="14" fill="#7a4a2a"/>`).join('')}
      <path d="M220 200 v-90 l-20 -20 M220 140 l25 -25" stroke="#4a3a2a" stroke-width="9" fill="none" stroke-linecap="round"/>
      <g stroke="${INK}" stroke-width="3"><circle cx="150" cy="236" r="7" fill="#9ccc65"/><circle cx="166" cy="236" r="7" fill="#9ccc65"/></g>
      <circle cx="150" cy="236" r="2.5" fill="${INK}"/><circle cx="166" cy="236" r="2.5" fill="${INK}"/>
      <rect y="120" width="400" height="40" fill="#fff" opacity=".25"/>`,
    morgane: `<rect width="400" height="300" fill="#4a2a6a"/><circle cx="300" cy="70" r="36" fill="#f0d8ff"/><circle cx="314" cy="62" r="32" fill="#4a2a6a"/>
      <path d="M0 230 L60 140 L110 200 L180 110 L250 210 L320 130 L400 220 L400 300 L0 300Z" fill="#2a1a3a" stroke="${INK}" stroke-width="4"/>
      <path d="M170 120 v-60 l10 -16 l10 16 v60Z" fill="#3a1a4a" stroke="${INK}" stroke-width="4"/><rect x="176" y="70" width="8" height="10" fill="#f5c53a"/>
      ${[[40, 40], [90, 80], [140, 30], [230, 50], [370, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#fff"/>`).join('')}`,
    quete: `<rect width="400" height="300" fill="#ffe9a8"/>
      ${Array.from({ length: 12 }, (_, k) => `<path d="M200 90 L${200 + Math.cos(k / 12 * 6.283) * 400} ${90 + Math.sin(k / 12 * 6.283) * 400} L${200 + Math.cos((k + .5) / 12 * 6.283) * 400} ${90 + Math.sin((k + .5) / 12 * 6.283) * 400}Z" fill="#fff6d0"/>`).join('')}
      <path d="M0 260 L140 120 L200 90 L260 120 L400 260 L400 300 L0 300Z" fill="#c8a06a" stroke="${INK}" stroke-width="4"/>
      <path d="M140 120 L200 90 L260 120 L230 135 L200 120 L170 135Z" fill="#fff"/>
      <circle cx="200" cy="72" r="20" fill="#fff2a0" opacity=".9"/>
      <path d="M188 58 h24 q0 18 -9 20 v6 q8 1 8 6 h-22 q0 -5 8 -6 v-6 q-9 -2 -9 -20Z" fill="#f5c53a" stroke="${INK}" stroke-width="3"/>`,
  }[theme] || '';
  return `<svg width="400" height="300" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

export const svgUrl = s => "url('data:image/svg+xml," + encodeURIComponent(s).replace(/'/g, '%27') + "')";
