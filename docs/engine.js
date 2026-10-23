(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DrawEngine = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const defaults = { mode: 'balanced', gender: 'men', kind: 'club', league: 'all', min: 0.5, max: 5, gap: 0.5, noRepeats: false };
  function validateTeam(t) {
    if (!t || typeof t.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(t.id)) throw Error('Each team needs a unique ID (letters, numbers, - or _).');
    for (const key of ['name', 'league', 'country']) {
      if (typeof t[key] !== 'string' || !t[key].trim() || t[key].length > 80) throw Error('Team name, league and country must each contain 1–80 characters.');
    }
    if (!['men', 'women'].includes(t.gender) || !['club', 'national'].includes(t.kind)) throw Error('Choose a valid team category.');
    if (typeof t.stars !== 'number' || t.stars < 0.5 || t.stars > 5 || t.stars * 2 % 1 !== 0) throw Error('Ratings must be 0.5 to 5 stars in half-star steps.');
    return { id: t.id, name: t.name.trim(), league: t.league.trim(), country: t.country.trim(), gender: t.gender, kind: t.kind, stars: t.stars, custom: !!t.custom };
  }
  function validateRoster(data) {
    if (!Array.isArray(data) || data.length < 2 || data.length > 1000) throw Error('A roster must contain 2–1,000 teams.');
    const teams = data.map(validateTeam);
    if (new Set(teams.map(t => t.id)).size !== teams.length) throw Error('Team IDs must be unique.');
    return teams;
  }
  function eligible(teams, f, excluded = [], used = []) {
    const blocked = new Set(excluded), previous = new Set(used);
    return teams.filter(t => !blocked.has(t.id) && (!f.noRepeats || !previous.has(t.id)) &&
      (f.gender === 'all' || t.gender === f.gender) && (f.kind === 'all' || t.kind === f.kind) &&
      (f.league === 'all' || t.league === f.league) && t.stars >= f.min && t.stars <= f.max);
  }
  function compatible(a, b, f) {
    return a.id !== b.id && a.gender === b.gender && a.kind === b.kind &&
      (f.mode !== 'balanced' || Math.abs(a.stars - b.stars) <= f.gap) &&
      (f.mode !== 'league' || a.league === b.league);
  }
  function pairs(teams, f) {
    const result = [];
    for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++)
      if (compatible(teams[i], teams[j], f)) result.push([teams[i], teams[j]]);
    return result;
  }
  function draw(teams, f, excluded, used, current, side, rng = Math.random) {
    const pool = eligible(teams, f, excluded, used);
    if (side === 0 || side === 1) {
      if (!current || !current[0] || !current[1]) throw Error('Draw both teams first.');
      const fixed = teams.find(t => t.id === current[1 - side].id);
      // A locked team may already be in used; all other active filters still apply.
      if (!fixed || !eligible([fixed], { ...f, noRepeats: false }, excluded, []).length)
        throw Error('The locked team is outside your filters. Draw both teams.');
      const choices = pool.filter(t => compatible(t, fixed, f) && t.id !== current[side].id);
      if (!choices.length) throw Error('No replacement fits. Widen your filters or reset used teams.');
      const next = current.slice(); next[side] = choices[Math.floor(rng() * choices.length)];
      return next;
    }
    const choices = pairs(pool, f);
    if (!choices.length) throw Error('No matchup fits. Widen your filters, enable more teams, or reset used teams.');
    const chosen = choices[Math.floor(rng() * choices.length)].slice();
    return rng() < 0.5 ? chosen : chosen.reverse();
  }
  return { defaults, validateTeam, validateRoster, eligible, compatible, pairs, draw };
});
