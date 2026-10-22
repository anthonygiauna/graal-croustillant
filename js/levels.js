// Chargement des niveaux (data/levels.json) : formes nommées résolues, chapitre calculé.
let cache = null;

export async function loadLevels(base = '') {
  if (cache) return cache;
  const data = await (await fetch(base + 'data/levels.json')).json();
  cache = prepare(data);
  return cache;
}

export function prepare(data) {
  const levels = data.levels.map(l => ({
    ...l,
    layout: typeof l.layout === 'string' ? data.shapes[l.layout] : l.layout,
    chapter: Math.ceil(l.id / 10),
    boss: l.id % 10 === 0,
    stars: l.stars || [0, 1500 * l.moves / 10, 2600 * l.moves / 10],
  }));
  return { chapters: data.chapters, levels, raw: data };
}
