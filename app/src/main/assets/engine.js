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
    const hasOverall = Number.isInteger(t.overall) && t.overall >= 1 && t.overall <= 99;
    if (!hasOverall && (typeof t.stars !== 'number' || t.stars < 0.5 || t.stars > 5 || t.stars * 2 % 1 !== 0)) throw Error('Enter an overall rating from 1 to 99. Legacy star ratings must be 0.5 to 5.');
    const result = { id: t.id, name: t.name.trim(), league: t.league.trim(), country: t.country.trim(), gender: t.gender, kind: t.kind, custom: !!t.custom };
    if (hasOverall) result.overall = t.overall;
    if (typeof t.stars === 'number' && t.stars >= 0.5 && t.stars <= 5 && t.stars*2%1===0) result.stars=t.stars;
    for(const key of ['attack','midfield','defence','fc26Overall']) if(Number.isInteger(t[key])&&t[key]>=1&&t[key]<=99)result[key]=t[key];
    if(['FC 27','FC 26 fallback','Custom'].includes(t.ratingSource))result.ratingSource=t.ratingSource;
    if(typeof t.crest==='string' && /^https:\/\/images\.fifaindex\.com\/(?:fc26|fc27)\/teams\/\d+\.(?:webp|png)$/.test(t.crest))result.crest=t.crest;
    if(typeof t.eaId==='string' && /^\d+$/.test(t.eaId))result.eaId=t.eaId;
    return result;
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
      (f.league === 'all' || t.league === f.league) && score(t,f) !== null && score(t,f) >= f.min && score(t,f) <= f.max &&
      (!f.verifiedOnly || t.ratingSource === 'FC 27'));
  }
  function score(t,f) { return f.metric === 'overall' ? (Number.isInteger(t.overall) ? t.overall : null) : (typeof t.stars==='number' ? t.stars : null); }
  function compatible(a, b, f) {
    return a.id !== b.id && a.gender === b.gender && a.kind === b.kind &&
      (f.mode !== 'balanced' || (score(a,f)!==null && score(b,f)!==null && Math.abs(score(a,f) - score(b,f)) <= f.gap)) &&
      (f.mode !== 'league' || a.league === b.league);
  }
  function pairs(teams, f) {
    const result = [];
    for (let i = 0; i < teams.length; i++) for (let j = i + 1; j < teams.length; j++)
      if (compatible(teams[i], teams[j], f)) result.push([teams[i], teams[j]]);
    return result;
  }
  function countPairs(teams,f) { let count=0;for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++)if(compatible(teams[i],teams[j],f))count++;return count; }
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
    const count=countPairs(pool,f);
    if (!count) throw Error('No matchup fits. Widen your filters, enable more teams, or reset used teams.');
    let target=Math.floor(rng()*count),chosen;
    outer:for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++)if(compatible(pool[i],pool[j],f)){if(target--===0){chosen=[pool[i],pool[j]];break outer;}}
    return rng()<0.5?chosen:chosen.reverse();
  }
  return { defaults, validateTeam, validateRoster, eligible, compatible, pairs, countPairs, draw };
});
