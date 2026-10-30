// Lieux à restaurer en plus de Kaamelott (voir PLACES et DECOR dans data.js), dessinés en SVG.
// Chaque décoration a son propre emplacement, pour qu'aucune n'en cache une autre.
// view : [x, y, largeur, hauteur] pour ne montrer qu'une partie (aperçus de la liste).
import { INK } from './art.js';

export const PLACE_VIEW = {
  // Lac de la Dame
  ponton: [0, 330, 200, 150], nenuphars: [60, 270, 240, 180], saules: [0, 110, 360, 270],
  barque: [180, 300, 180, 135], lanternes: [40, 170, 280, 210], rocher: [100, 210, 160, 120],
  // Tour de Merlin
  jardin: [0, 350, 170, 128], chaudron: [190, 350, 170, 128], hibou: [40, 170, 160, 120],
  escalier: [80, 170, 200, 150], telescope: [120, 30, 180, 135], etoiles: [0, 0, 360, 270],
};

const ink = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"`;
const wrap = (s, view) => {
  const [x, y, w, h] = view || [0, 0, 360, 480];
  return `<svg width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
};

export function lakeScene({ decor = [], view = null } = {}) {
  const has = d => decor.includes(d);
  let s = `<defs><linearGradient id="lk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8e0f8"/><stop offset="1" stop-color="#c8e4f4"/></linearGradient></defs>`;
  s += `<rect width="360" height="480" fill="url(#lk)"/><circle cx="292" cy="70" r="28" fill="#fff8e0"/>`;
  s += `<path d="M0 200 L70 150 L130 185 L200 140 L270 180 L360 150 V250 H0 Z" fill="#a8b8d8" ${ink()}/>`;
  s += `<path d="M0 230 Q180 200 360 230 V480 H0 Z" fill="#8cc45a" ${ink()}/>`;
  s += `<ellipse cx="180" cy="340" rx="168" ry="92" fill="#4aa0d0" ${ink()}/>`;
  for (const [x, y, w] of [[90, 300, 40], [230, 330, 50], [140, 380, 46], [260, 395, 30]]) s += `<path d="M${x} ${y} q${w / 4} -6 ${w / 2} 0 t${w / 2} 0" stroke="#d8f0fa" stroke-width="3" fill="none"/>`;
  for (const x of [18, 30, 330, 342]) s += `<path d="M${x} 300 q-4 -30 2 -56" stroke="#3a6a2a" stroke-width="4" fill="none"/><ellipse cx="${x + 2}" cy="246" rx="4" ry="11" fill="#7a4a2a"/>`;
  // îlot central (toujours là) ; le rocher de l'Épée s'y installe
  s += `<ellipse cx="180" cy="300" rx="40" ry="12" fill="#9ccc65" ${ink()}/>`;
  if (has('rocher')) {
    s += `<path d="M156 300 q4 -26 24 -28 q20 2 24 28 Z" fill="#a8a096" ${ink()}/><path d="M180 276 v-40" stroke="#e8eef4" stroke-width="6"/>` +
      `<path d="M180 276 v-40" stroke="${INK}" stroke-width="1.5"/><rect x="170" y="238" width="20" height="6" fill="#f5c53a" ${ink(2)}/><circle cx="180" cy="232" r="4" fill="#2fb0e8" ${ink(1.5)}/>` +
      `<path d="M196 224 l4 -6 l4 6 l-4 6 Z" fill="#fff"/>`;
  }
  if (has('saules')) {
    for (const x of [44, 316]) {
      s += `<rect x="${x - 6}" y="200" width="12" height="70" fill="#7a4a2a" ${ink()}/><path d="M${x - 40} 260 Q${x - 44} 170 ${x} 160 Q${x + 44} 170 ${x + 40} 260 Z" fill="#7ab84a" ${ink()}/>`;
      for (let k = -3; k <= 3; k++) s += `<path d="M${x + k * 10} 180 q2 40 0 76" stroke="#5a9a3a" stroke-width="3" fill="none"/>`;
    }
  }
  if (has('nenuphars')) {
    for (const [x, y] of [[90, 330], [120, 360], [250, 300], [275, 350], [210, 400], [70, 380]]) {
      s += `<ellipse cx="${x}" cy="${y}" rx="15" ry="6" fill="#5aa83a" ${ink(2)}/><circle cx="${x + 3}" cy="${y - 4}" r="5" fill="#ff8ac8" ${ink(1.5)}/>`;
    }
  }
  if (has('ponton')) {
    s += `<path d="M10 470 L150 380 L170 396 L34 480 Z" fill="#c8924a" ${ink()}/>`;
    for (let k = 0; k < 7; k++) s += `<path d="M${30 + k * 19} ${462 - k * 12} l20 14" stroke="${INK}" stroke-width="2"/>`;
    s += `<rect x="146" y="372" width="8" height="30" fill="#7a4a2a" ${ink(2)}/><rect x="162" y="386" width="8" height="30" fill="#7a4a2a" ${ink(2)}/>`;
  }
  if (has('barque')) {
    s += `<path d="M216 368 q50 22 104 0 l-12 18 h-80 Z" fill="#a8693a" ${ink()}/><path d="M268 368 v-36" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M268 334 l26 18 h-26 Z" fill="#fffaf0" ${ink(2)}/><path d="M232 386 l-16 14" stroke="${INK}" stroke-width="3"/>`;
  }
  if (has('lanternes')) {
    for (const [x, y] of [[80, 210], [140, 190], [230, 200], [290, 220], [110, 330], [240, 360]]) {
      s += `<circle cx="${x}" cy="${y}" r="14" fill="#ffd24a" opacity=".3"/><rect x="${x - 6}" y="${y - 8}" width="12" height="15" rx="3" fill="#ffb84a" ${ink(2)}/>`;
    }
  }
  return wrap(s, view);
}

export function towerScene({ decor = [], view = null } = {}) {
  const has = d => decor.includes(d);
  let s = `<defs><linearGradient id="tw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2a5a"/><stop offset="1" stop-color="#4a5a9a"/></linearGradient></defs>`;
  s += `<rect width="360" height="480" fill="url(#tw)"/><circle cx="70" cy="70" r="26" fill="#fff4c0"/><circle cx="82" cy="62" r="22" fill="#1e2a5a"/>`;
  for (const [x, y] of [[150, 40], [240, 30], [320, 90], [30, 160], [300, 200], [110, 120]]) s += `<circle cx="${x}" cy="${y}" r="2" fill="#fff"/>`;
  if (has('etoiles')) {
    s += `<path d="M0 150 Q90 100 180 130 T360 110 V170 Q270 150 180 180 T0 200 Z" fill="#7ad8c8" opacity=".35"/>`;
    s += `<path d="M200 50 L230 70 L260 55 L290 80 M40 110 L70 90 L100 105" stroke="#fff6a0" stroke-width="1.5" fill="none"/>`;
    for (const [x, y] of [[200, 50], [230, 70], [260, 55], [290, 80], [40, 110], [70, 90], [100, 105]]) s += `<path d="M${x} ${y - 6} l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 Z" fill="#fff6a0"/>`;
  }
  s += `<path d="M0 380 Q180 350 360 380 V480 H0 Z" fill="#2e4a3a" ${ink()}/>`;
  for (const x of [20, 70, 300, 345]) s += `<path d="M${x} 390 l-24 -76 l24 -44 l24 44 l-24 76 Z" fill="#1e3a2a" ${ink()}/>`;
  // la tour
  s += `<path d="M146 390 L152 140 L208 140 L214 390 Z" fill="#b8c4dc" ${ink()}/>`;
  for (const y of [180, 230, 280, 330]) s += `<path d="M150 ${y} h60" stroke="${INK}" stroke-width="1.5" opacity=".35"/>`;
  s += `<path d="M144 142 L180 76 L216 142 Z" fill="#4b3a8c" ${ink()}/><path d="M180 76 v-14" stroke="${INK}" stroke-width="2.5"/><circle cx="180" cy="58" r="4" fill="#f5c53a" ${ink(1.5)}/>`;
  s += `<rect x="170" y="190" width="20" height="28" rx="10" fill="#ffe680" ${ink(2)}/><path d="M166 390 v-36 a14 14 0 0 1 28 0 v36 Z" fill="#7a4a2a" ${ink()}/>`;
  if (has('escalier')) {
    for (let k = 0; k < 6; k++) {
      const y = 370 - k * 38, left = k % 2 === 0;
      s += `<path d="M${left ? 120 : 214} ${y} L${left ? 146 : 240} ${y - 24}" stroke="#c9b184" stroke-width="9" stroke-linecap="round"/><path d="M${left ? 120 : 214} ${y} L${left ? 146 : 240} ${y - 24}" stroke="${INK}" stroke-width="1.5"/>`;
    }
  }
  if (has('telescope')) {
    s += `<rect x="200" y="132" width="44" height="8" fill="#7a4a2a" ${ink(2)}/><path d="M214 130 l46 -40" stroke="#c8902a" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M214 130 l46 -40" stroke="${INK}" stroke-width="1.5"/><circle cx="262" cy="88" r="5" fill="#c8f0ff" ${ink(1.5)}/>`;
  }
  if (has('hibou')) {
    s += `<path d="M60 250 h70" stroke="#7a4a2a" stroke-width="6" stroke-linecap="round"/><ellipse cx="100" cy="230" rx="16" ry="20" fill="#a8784a" ${ink()}/>` +
      `<circle cx="93" cy="224" r="6" fill="#fff" ${ink(1.5)}/><circle cx="107" cy="224" r="6" fill="#fff" ${ink(1.5)}/><circle cx="93" cy="224" r="2.5" fill="${INK}"/><circle cx="107" cy="224" r="2.5" fill="${INK}"/>` +
      `<path d="M97 232 l3 5 l3 -5 Z" fill="#f5c53a"/><path d="M86 212 l4 -8 l4 8 M106 212 l4 -8 l4 8" fill="#a8784a" ${ink(1.5)}/>`;
  }
  if (has('jardin')) {
    for (let k = 0; k < 6; k++) {
      const x = 20 + k * 22, c = ['#e8263a', '#9b59d0', '#f5c53a', '#2fd07a', '#ff8ac8', '#2fb0e8'][k];
      s += `<path d="M${x} 440 v-30" stroke="#2fa04a" stroke-width="3"/><path d="M${x} 426 q-8 -4 -8 -12 M${x} 420 q8 -4 8 -12" stroke="#2fa04a" stroke-width="3" fill="none"/><circle cx="${x}" cy="406" r="6" fill="${c}" ${ink(1.5)}/>`;
    }
    s += `<rect x="8" y="440" width="140" height="10" fill="#7a4a2a" ${ink(2)}/>`;
  }
  if (has('chaudron')) {
    s += `<path d="M262 450 l-10 20 M318 450 l10 20" stroke="${INK}" stroke-width="4"/><path d="M270 470 q20 -16 40 0" fill="#ff8a2a" ${ink(2)}/>` +
      `<path d="M254 410 h72 q0 44 -36 44 q-36 0 -36 -44 Z" fill="#3a3a4a" ${ink()}/><ellipse cx="290" cy="410" rx="36" ry="8" fill="#5ae07a" ${ink(2)}/>` +
      `<circle cx="280" cy="396" r="6" fill="#5ae07a" opacity=".8"/><circle cx="298" cy="386" r="4" fill="#5ae07a" opacity=".7"/><circle cx="288" cy="374" r="3" fill="#5ae07a" opacity=".6"/>`;
  }
  return wrap(s, view);
}
