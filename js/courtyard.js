// Cour de Camelot (écran titre et écran Camelot), dessinée en SVG.
// Format vertical pensé pour les téléphones. chars : personnages débloqués (debout dans la cour),
// decor : décorations achetées avec l'or des coups d'avance (voir DECOR dans data.js).
import { INK, portrait } from './art.js';

export function courtyard({ chars = [], decor = [] } = {}) {
  const has = d => decor.includes(d);
  const roofA = has('toits') ? '#ffd24a' : '#c8402e', roofB = has('toits') ? '#f5b52a' : '#2f5fb3';
  const stone = '#e2cfa6', stoneDark = '#c9b184';
  const ink = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"`;
  const win = (x, y, w, h, k) => {
    const glass = has('vitraux') ? ['#e8263a', '#2fb0e8', '#f5c53a', '#2fd07a'][k % 4] : '#3a2a1a';
    return `<path d="M${x} ${y + h} v${-h + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 v${h - w / 2} Z" fill="${glass}" ${ink(2)}/>` +
      (has('vitraux') ? `<path d="M${x + w / 2} ${y} v${h} M${x} ${y + h * 0.6} h${w}" stroke="${INK}" stroke-width="1.2"/>` : '');
  };
  const crenels = (x0, x1, y) => {
    let p = '';
    for (let x = x0; x < x1 - 4; x += 14) p += `<rect x="${x}" y="${y - 9}" width="8" height="10" fill="${stone}" ${ink()}/>`;
    return p;
  };
  const cone = (cx, y, w, h, fill, flag) => `<path d="M${cx - w / 2} ${y} L${cx} ${y - h} L${cx + w / 2} ${y} Z" fill="${fill}" ${ink()}/>` +
    `<path d="M${cx} ${y - h} v-16" stroke="${INK}" stroke-width="2.5"/><path d="M${cx} ${y - h - 16} l16 5 -16 5" fill="${flag}" ${ink(2)}/>`;

  let s = `<defs><linearGradient id="cs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffefc0"/><stop offset="1" stop-color="#ffc66e"/></linearGradient></defs>`;
  s += `<rect width="360" height="640" fill="url(#cs)"/><circle cx="292" cy="96" r="36" fill="#fff6c8"/>`;
  if (has('feux')) {
    for (const [x, y, c] of [[70, 120, '#e8263a'], [200, 60, '#2fb0e8'], [300, 190, '#9b59d0'], [120, 210, '#f5c53a']]) {
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2;
        s += `<path d="M${x + Math.cos(a) * 8} ${y + Math.sin(a) * 8} L${x + Math.cos(a) * 26} ${y + Math.sin(a) * 26}" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`;
      }
      s += `<circle cx="${x}" cy="${y}" r="4" fill="#fff"/>`;
    }
  }
  for (const [x, y, r] of [[60, 70, 34], [210, 40, 28], [320, 170, 24]]) {
    s += `<g fill="#fffdf4" ${ink(2)}><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.45}"/>` +
      `<ellipse cx="${x - r * 0.4}" cy="${y - r * 0.25}" rx="${r * 0.5}" ry="${r * 0.4}"/><ellipse cx="${x + r * 0.35}" cy="${y - r * 0.3}" rx="${r * 0.45}" ry="${r * 0.38}"/></g>`;
  }
  s += `<path d="M0 300 Q90 250 180 285 T360 270 L360 360 L0 360Z" fill="#a8d070" ${ink()}/>`;

  // Remparts, tours et donjon
  s += `<rect x="14" y="236" width="332" height="100" fill="${stoneDark}" ${ink()}/>${crenels(14, 346, 236)}`;
  for (const [x, roof, flag] of [[26, roofA, '#2f5fb3'], [278, roofB, '#d63a2f']]) {
    s += `<rect x="${x}" y="176" width="56" height="160" fill="${stone}" ${ink()}/>${cone(x + 28, 176, 70, 70, roof, flag)}`;
    s += win(x + 23, 206, 10, 18, x) + win(x + 23, 262, 10, 18, x + 1);
  }
  s += `<rect x="112" y="150" width="136" height="186" fill="${stone}" ${ink()}/>${crenels(112, 248, 150)}`;
  s += `<rect x="154" y="86" width="52" height="66" fill="${stone}" ${ink()}/>${cone(180, 86, 66, 62, roofA, '#f5c53a')}${win(175, 104, 10, 20, 2)}`;
  [130, 160, 190, 220].forEach((x, k) => { s += win(x, 170, 11, 20, k); });
  for (const [x, y] of [[40, 300], [60, 230], [300, 300], [130, 230], [214, 214], [236, 300], [126, 300]]) {
    s += `<path d="M${x} ${y} h14 M${x + 4} ${y + 7} h12" stroke="${INK}" stroke-width="1.5" opacity=".35"/>`;
  }
  // Porte et herse
  s += `<path d="M152 336 v-52 a28 28 0 0 1 56 0 v52 Z" fill="#7a4a2a" ${ink()}/>`;
  for (const x of [160, 170, 180, 190, 200]) s += `<path d="M${x} 262 v74" stroke="${INK}" stroke-width="2" opacity=".55"/>`;
  for (const y of [282, 300, 318]) s += `<path d="M154 ${y} h52" stroke="${INK}" stroke-width="2" opacity=".55"/>`;
  if (has('bannieres')) {
    for (const [x, y, c] of [[122, 196, '#d63a2f'], [222, 196, '#2f5fb3'], [36, 236, '#2f5fb3'], [306, 236, '#d63a2f']]) {
      s += `<path d="M${x} ${y} h18 v40 l-9 -8 -9 8 Z" fill="${c}" ${ink(2)}/><path d="M${x + 9} ${y + 8} v18 M${x + 4} ${y + 15} h10" stroke="#f5c53a" stroke-width="2.5"/>`;
    }
  }
  // Cour pavée et herbe
  s += `<path d="M0 336 H360 V430 H0 Z" fill="#ead6ac" ${ink()}/>`;
  for (let k = 0; k < 26; k++) s += `<ellipse cx="${(k * 53) % 350 + 8}" cy="${346 + (k * 29) % 80}" rx="9" ry="4" fill="#dcc496"/>`;
  s += `<path d="M0 430 Q180 412 360 430 V640 H0 Z" fill="#8cc45a" ${ink()}/>`;
  if (has('fleurs')) {
    for (let k = 0; k < 22; k++) s += `<circle cx="${8 + k * 16}" cy="${330 + (k % 2) * 4}" r="4.5" fill="${['#e8263a', '#f5c53a', '#ff8ac8', '#ffffff'][k % 4]}" ${ink(1.5)}/>`;
    for (let k = 0; k < 18; k++) s += `<circle cx="${14 + k * 19}" cy="${446 + (k % 3) * 6}" r="5" fill="${['#ff8ac8', '#ffffff', '#f5c53a'][k % 3]}" ${ink(1.5)}/>`;
  }
  if (has('fontaine')) {
    s += `<ellipse cx="44" cy="378" rx="34" ry="12" fill="#9aa4ae" ${ink()}/><ellipse cx="44" cy="374" rx="26" ry="7" fill="#7ad0f0"/>` +
      `<rect x="39" y="344" width="10" height="30" fill="#9aa4ae" ${ink(2)}/><path d="M44 344 q-14 -14 -22 10 M44 344 q14 -14 22 10" fill="none" stroke="#7ad0f0" stroke-width="3.5"/>`;
  }
  if (has('statue')) {
    s += `<rect x="296" y="360" width="40" height="22" fill="#b8b0a4" ${ink()}/><path d="M306 360 v-26 q10 -10 20 0 v26 Z" fill="#c9c2b8" ${ink()}/>` +
      `<circle cx="316" cy="324" r="8" fill="#c9c2b8" ${ink()}/><path d="M309 317 l2 -7 3 5 2 -6 2 6 3 -5 2 7 Z" fill="#f5c53a" ${ink(1.5)}/>` +
      `<path d="M330 362 v-40" stroke="#dfe7ef" stroke-width="4"/><path d="M325 330 h10" stroke="${INK}" stroke-width="3"/>`;
  }
  if (has('table')) {
    s += `<ellipse cx="180" cy="356" rx="62" ry="14" fill="#a8693a" ${ink()}/><ellipse cx="180" cy="353" rx="54" ry="9" fill="#c98a4a"/>`;
  }
  // Compagnons débloqués : jusqu'à 7 devant, les autres derrière
  const back = chars.slice(0, Math.max(0, chars.length - 7)), front = chars.slice(back.length);
  const row = (list, feet, size) => list.map((c, k) => {
    const x = list.length === 1 ? 180 : 66 + k * (228 / (list.length - 1));
    return figure(c, x, feet, size);
  }).join('');
  s += row(back, 374, 32) + row(front, 414, 40);
  return `<svg width="360" height="640" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

function figure(c, x, feet, size) {
  const L = c.look, head = L.dragon ? size * 1.25 : size;
  const body = L.dragon ? '' :
    `<path d="M${x - size * 0.42} ${feet} Q${x - size * 0.38} ${feet - size * 0.62} ${x} ${feet - size * 0.66} Q${x + size * 0.38} ${feet - size * 0.62} ${x + size * 0.42} ${feet} Z" ` +
    `fill="${L.cape || L.cloth || '#c8402e'}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const top = L.dragon ? feet - head : feet - size * 0.6 - head;
  return `<ellipse cx="${x}" cy="${feet + 2}" rx="${size * 0.5}" ry="${size * 0.12}" fill="${INK}" opacity=".18"/>${body}` +
    portrait(c).replace('<svg ', `<svg x="${x - head / 2}" y="${top}" width="${head}" height="${head}" `);
}
