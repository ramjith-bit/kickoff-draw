/* UI and persistence shared by the bundled Android WebView and local browser preview. */
(function () {
  'use strict';
  const E = window.DrawEngine, $ = id => document.getElementById(id);
  const KEY = 'kickoff-draw-v1';
  const webDefaults={...E.defaults,metric:'overall',min:40,max:99,gap:3,verifiedOnly:false};
  const catalogById=new Map(STARTER_TEAMS.map(t=>[t.id,t]));
  const blank = () => ({ version: 1, roster: STARTER_TEAMS.map(t => ({ ...t })), catalogVersion: CATALOG_INFO.catalogVersion, filters: { ...webDefaults }, excluded: [], used: [], current: null, history: [], names: ['Player 1', 'Player 2'] });
  let state = blank(), page = 'draw', editing = null, confirmAction = null;
  let saveWarning = '';
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stars = n => `${Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 })} ★`;
  const gender = t => t.gender === 'men' ? 'Men' : 'Women';
  const category = t => `${gender(t)} · ${t.kind === 'club' ? 'Club' : 'National'}`;
  function validateFilters(f) {
    const next = { ...webDefaults };
    if (!f || typeof f !== 'object') return next;
    for (const [key, choices] of Object.entries({ mode:['balanced','random','league'], gender:['men','women','all'], kind:['club','national','all'] })) if (choices.includes(f[key])) next[key] = f[key];
    if (typeof f.league === 'string') next.league = f.league;
    for (const key of ['min', 'max']) if (f.metric==='overall' && Number.isInteger(f[key]) && f[key]>=1 && f[key]<=99) next[key]=f[key];
    if (next.min > next.max) [next.min,next.max] = [next.max,next.min];
    if(f.metric==='overall' && [0,1,2,3,5,10,20,99].includes(f.gap))next.gap=f.gap;
    next.verifiedOnly=f.verifiedOnly===true;
    next.noRepeats = f.noRepeats === true;
    return next;
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.version !== 1) throw Error('Unknown save version');
      const roster = E.validateRoster(saved.roster), ids = new Set(roster.map(t=>t.id));
      const idArray = v => Array.isArray(v) ? [...new Set(v.filter(id => typeof id === 'string' && ids.has(id)))] : [];
      state.catalogVersion=saved.catalogVersion;state.roster = roster; state.filters = validateFilters(saved.filters);
      state.excluded = idArray(saved.excluded); state.used = idArray(saved.used);
      if (Array.isArray(saved.names) && saved.names.length === 2 && saved.names.every(n => typeof n === 'string')) state.names = saved.names.map((n,i)=>n.trim().slice(0,30) || `Player ${i+1}`);
      if (Array.isArray(saved.current) && saved.current.length === 2 && saved.current[0] !== saved.current[1] && saved.current.every(id => ids.has(id))) state.current = saved.current;
      if (Array.isArray(saved.history)) state.history = saved.history.filter(h => {
        try { return Array.isArray(h.teams) && h.teams.length === 2 && h.teams.every(t=>E.validateTeam(t)) && Array.isArray(h.names) && h.names.length === 2 && h.names.every(n=>typeof n==='string' && n.length<=30) && ['balanced','random','league'].includes(h.mode) && Number.isFinite(h.time) && h.time>0; } catch { return false; }
      }).slice(0,30);
    }
  } catch { saveWarning = 'Saved data could not be loaded. The starter roster has been restored.'; }
  if(state.catalogVersion!==CATALOG_INFO.catalogVersion || !state.roster.some(t=>t.id.startsWith('ea-'))) {
    const aliases={'bayern munich':'bayern munchen','olympique lyon':'ol lyonnes','atletico madrid':'atletico de madrid','napoli':'napoli','bayer leverkusen':'bayer 04 leverkusen','athletic club':'athletic club de bilbao','wolfsburg':'vfl wolfsburg','kansas city current':'kansas city current','washington spirit':'washington spirit','nj/ny gotham':'gotham fc'};
    const norm=n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^fc /,'').trim();
    const replacements=new Map();const custom=[];
    state.roster.forEach(old=>{const name=norm(old.name);const found=STARTER_TEAMS.find(t=>t.gender===old.gender&&t.kind===old.kind&&(norm(t.name)===(aliases[name]||name)));if(found){replacements.set(old.id,found.id);if(old.custom)custom.push({...found,...old,id:found.id,overall:old.overall||found.overall,ratingSource:'Custom'});}else if(old.custom||old.id.startsWith('custom-'))custom.push(old);});
    const edits=new Map(custom.map(t=>[t.id,t]));state.roster=STARTER_TEAMS.map(t=>({...t,...(edits.get(t.id)||{})}));
    custom.filter(t=>!catalogById.has(t.id)).forEach(t=>state.roster.push(t));
    const remap=id=>replacements.get(id)||id;state.excluded=[...new Set(state.excluded.map(remap))];state.used=[...new Set(state.used.map(remap))];if(state.current)state.current=state.current.map(remap);
    state.catalogVersion=CATALOG_INFO.catalogVersion;
  }
  function rating(t){return Number.isInteger(t.overall)?String(t.overall):stars(t.stars);}
  function badge(t,small=false){const original=t.crest||catalogById.get(t.id)?.crest;return original?`<span class="crest-wrap ${small?'small':''}"><img class="crest" src="${esc(original)}" alt="${esc(t.name)} crest" loading="${small?'lazy':'eager'}" referrerpolicy="no-referrer"><span class="crest-fallback" aria-hidden="true">${esc(initials(t.name))}</span></span>`:`<span class="crest-wrap fallback ${small?'small':''}" aria-hidden="true">${esc(initials(t.name))}</span>`;}
  document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement&&event.target.classList.contains('crest'))event.target.parentElement.classList.add('failed');},true);
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { saveWarning = 'Device storage is unavailable. Changes will last only while this app stays open.'; $('draw-message').textContent = saveWarning; }
  }
  function current() { return state.current && state.current.map(id => state.roster.find(t=>t.id===id)); }
  function fillStars(id,selected){$(id).innerHTML=Array.from({length:99},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');$(id).value=selected;}
  function pool() { return E.eligible(state.roster, state.filters, state.excluded, state.used); }
  function filtersChanged() { syncFilters(); save(); updateCounts(); $('draw-message').textContent = ''; }
  function syncFilters() {
    const f = state.filters;
    const leagues = [...new Set(state.roster.filter(t=>(f.gender==='all'||f.gender===t.gender)&&(f.kind==='all'||f.kind===t.kind)).map(t=>t.league))].sort();
    if (f.league !== 'all' && !leagues.includes(f.league)) f.league = 'all';
    $('league').innerHTML = '<option value="all">All leagues</option>' + leagues.map(l=>`<option value="${esc(l)}">${esc(l)}</option>`).join('');
    for (const key of ['gender','kind','league','min','max','gap']) $(key).value = f[key];
    $('no-repeats').checked = f.noRepeats; $('verified-only').checked=f.verifiedOnly;
    document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode===f.mode)));
    $('gap-label').hidden = f.mode !== 'balanced';
    $('mode-description').textContent = { balanced:'Match teams within the overall-rating gap below.',random:'Any two teams in your pool. Ratings can differ.',league:'Two teams from the same competition.' }[f.mode];
  }
  function updateCounts() {
    const eligible = pool(), count = E.countPairs(eligible,state.filters);
    $('pool-count').textContent = `${eligible.length} teams · ${count} pairs`;
    $('used-count').textContent = `${state.used.length} teams used this session`;
    $('draw-label').textContent = state.current ? 'Draw again' : 'Draw teams';
    // Keep Draw enabled when empty so a tap gives a useful explanation.
  }
  function initials(name) { return name.split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,3).join('').toUpperCase(); }
  function renderMatch() {
    const match = current();
    for (let i=0;i<2;i++) {
      $(`player-${i}`).textContent = state.names[i];
      const t = match && match[i];
      $(`team-${i}`).innerHTML=t?`${badge(t)}<div class="team-name">${esc(t.name)}</div><div class="team-league">${esc(t.league)} · ${esc(t.country)}</div><div class="rating-line"><span class="overall">${rating(t)} <small>OVR</small></span><span class="rating-origin ${t.ratingSource==='FC 26 fallback'?'fallback-source':''}">${esc(t.ratingSource||'Custom')}</span></div><div class="attributes">${[['attack','ATT'],['midfield','MID'],['defence','DEF']].map(([key,label])=>`<span>${label} <strong>${Number.isInteger(t[key])?t[key]:'—'}</strong></span>`).join('')}</div>`:'<div class="empty-crest" aria-hidden="true">+</div><div class="team-name">'+(i===0?'Home team':'Away team')+'</div><div class="team-league">Draw to find your club</div><div class="rating-line"><span class="overall">— <small>OVR</small></span></div>';
      $(`reroll-${i}`).disabled = !t;
    }
    $('swap').disabled = !match;
    $('match-status').textContent = match ? `${Number.isInteger(match[0].overall)&&Number.isInteger(match[1].overall)?Math.abs(match[0].overall-match[1].overall)+' OVR gap':'Legacy rating'} · ${gender(match[0])} · ${match[0].kind==='club'?'Clubs':'National teams'}` : 'Ready when you are.';
    updateCounts();
  }
  function draw(side) {
    try {
      const match = E.draw(state.roster,state.filters,state.excluded,state.used,current(),side);
      state.current = match.map(t=>t.id);
      state.used = [...new Set([...state.used,...state.current])];
      state.history.unshift({time:Date.now(),teams:match.map(t=>({...t})),names:state.names.slice(),mode:state.filters.mode});
      state.history = state.history.slice(0,30);
      save(); renderMatch();
      $('draw-message').classList.remove('error');
      $('draw-message').textContent = saveWarning || `${state.names[0]}: ${match[0].name}. ${state.names[1]}: ${match[1].name}.`;
      $('matchup').classList.remove('revealing');
      void $('matchup').offsetWidth; $('matchup').classList.add('revealing');
    } catch (e) { $('draw-message').classList.add('error'); $('draw-message').textContent = e.message; }
  }
  function navigate(next) {
    page = next;
    for (const name of ['draw','teams','history']) $(`${name}-page`).hidden = name!==next;
    document.querySelectorAll('[data-page]').forEach(b=>{if(b.dataset.page===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if (next==='teams') renderRoster(); if(next==='history')renderHistory();
    window.scrollTo(0,0);
  }
  function renderRoster() {
    const q = $('team-search').value.toLocaleLowerCase().trim();
    const list = state.roster.filter(t=>`${t.name} ${t.league} ${t.country} ${category(t)}`.toLocaleLowerCase().includes(q)).sort((a,b)=>a.name.localeCompare(b.name)||a.gender.localeCompare(b.gender));
    $('roster-count').textContent = `${state.roster.length-state.excluded.length} / ${state.roster.length} enabled`;
    $('roster-list').innerHTML = list.length ? list.map(t=>`<div class="roster-row"><label><input type="checkbox" data-enable="${esc(t.id)}" aria-label="Include ${esc(t.name)} (${gender(t)})" ${state.excluded.includes(t.id)?'':'checked'}></label>${badge(t,true)}<button class="roster-edit" data-edit="${esc(t.id)}" aria-label="Edit ${esc(t.name)} (${gender(t)})"><strong>${esc(t.name)} <span class="rating">${rating(t)} OVR</span></strong><small>${esc(t.league)} · ${esc(category(t))} · ${esc(t.ratingSource||'Custom')}</small></button><span aria-hidden="true">›</span></div>`).join('') : '<div class="roster-empty">No teams match your search.</div>';
  }
  function renderHistory() {
    $('history-count').textContent = `${state.history.length} saved matchups`;
    $('clear-history').disabled = !state.history.length;
    $('history-list').innerHTML = state.history.length ? state.history.map(h=>`<article class="history-item"><div class="history-head"><span>${esc(new Date(h.time).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}))}</span><span>${{balanced:'Balanced',random:'Anything goes',league:'Same league'}[h.mode]}</span></div><div class="history-match"><div><strong>${esc(h.teams[0].name)}</strong><small>${esc(h.names[0])} · ${rating(h.teams[0])} OVR · ${gender(h.teams[0])}</small></div><span class="history-vs">VS</span><div><strong>${esc(h.teams[1].name)}</strong><small>${esc(h.names[1])} · ${rating(h.teams[1])} OVR · ${gender(h.teams[1])}</small></div></div></article>`).join('') : '<div class="empty-state"><div class="empty-icon" aria-hidden="true">◷</div><strong>The night starts here.</strong><p>Draw your first matchup.<br>It’ll be waiting here after the game.</p></div>';
  }
  function confirm(title,text,fn) { confirmAction=fn; $('confirm-title').textContent=title; $('confirm-text').textContent=text; $('confirm-dialog').showModal(); }
  function openTeam(id) {
    editing = id || null;
    const t = id ? state.roster.find(t=>t.id===id) : {name:'',gender:'men',kind:'club',league:'',country:'',overall:75};
    $('team-dialog-title').textContent=id?'Edit team':'Add a team';
    for(const key of ['name','gender','kind','league','country','stars']) $(`edit-${key}`).value=key==='stars'?(t.overall||75):t[key];
    $('team-error').textContent=''; $('delete-team').hidden=!id;
    $('team-dialog').showModal();
  }
  function rosterChanged() {
    const ids = new Set(state.roster.map(t=>t.id));
    state.excluded=state.excluded.filter(id=>ids.has(id));state.used=state.used.filter(id=>ids.has(id));
    if(state.current && !state.current.every(id=>ids.has(id))) state.current=null;
    syncFilters();save();renderRoster();renderMatch();
  }
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.filters.mode=b.dataset.mode;filtersChanged();}));
  document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
  for(const key of ['gender','kind','league','min','max','gap']) $(key).addEventListener('change',()=>{
    state.filters[key]=['min','max','gap'].includes(key)?Number($(key).value):$(key).value;
    if(state.filters.min>state.filters.max) { if(key==='min')state.filters.max=state.filters.min;else state.filters.min=state.filters.max; }
    filtersChanged();
  });
  $('no-repeats').addEventListener('change',()=>{state.filters.noRepeats=$('no-repeats').checked;filtersChanged();});
  $('verified-only').addEventListener('change',()=>{state.filters.verifiedOnly=$('verified-only').checked;filtersChanged();});
  $('draw-button').addEventListener('click',()=>draw());
  [0,1].forEach(i=>$(`reroll-${i}`).addEventListener('click',()=>draw(i)));
  $('swap').addEventListener('click',()=>{if(state.current){state.current.reverse();save();renderMatch();$('draw-message').textContent='Teams swapped. Players keep their home / away positions.';}});
  $('reset-used').addEventListener('click',()=>{state.used=[];save();updateCounts();$('draw-message').textContent='Used teams reset. Everyone is back in the draw.';});
  $('names-button').addEventListener('click',()=>{[0,1].forEach(i=>$(`name-${i}`).value=state.names[i]);$('names-dialog').showModal();});
  $('names-form').addEventListener('submit',event=>{event.preventDefault();state.names=[0,1].map(i=>$(`name-${i}`).value.trim()||`Player ${i+1}`);save();renderMatch();$('names-dialog').close();});
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $('team-search').addEventListener('input',renderRoster);
  $('roster-list').addEventListener('change',event=>{const id=event.target.dataset.enable;if(!id)return;state.excluded=state.excluded.filter(x=>x!==id);if(!event.target.checked)state.excluded.push(id);save();renderRoster();updateCounts();});
  $('roster-list').addEventListener('click',event=>{const b=event.target.closest('[data-edit]');if(b)openTeam(b.dataset.edit);});
  $('enable-all').addEventListener('click',()=>{state.excluded=[];save();renderRoster();updateCounts();});
  $('add-team').addEventListener('click',()=>openTeam());
  $('team-form').addEventListener('submit',event=>{
    event.preventDefault();
    try {
      if(!editing && state.roster.length>=1000)throw Error('The roster limit is 1,000 teams.');
      const t={id:editing||`custom-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,custom:true};
      for(const key of ['name','gender','kind','league','country'])t[key]=$(`edit-${key}`).value;
      t.overall=Number($('edit-stars').value);t.ratingSource='Custom';if(editing){const prior=state.roster.find(x=>x.id===editing);if(prior.crest)t.crest=prior.crest;}const valid=E.validateTeam(t);
      if(state.roster.some(x=>x.id!==valid.id&&x.name.toLocaleLowerCase()===valid.name.toLocaleLowerCase()&&x.gender===valid.gender&&x.kind===valid.kind))throw Error('That team already exists in this category.');
      if(editing)state.roster=state.roster.map(x=>x.id===editing?valid:x);else state.roster.push(valid);
      rosterChanged();$('team-dialog').close();
    }catch(e){$('team-error').textContent=e.message;}
  });
  $('delete-team').addEventListener('click',()=>{
    if(state.roster.length<=2){$('team-error').textContent='Keep at least two teams in your roster.';return;}
    const id=editing;confirm('Delete this team?','This removes it from the roster. Saved history is kept.',()=>{state.roster=state.roster.filter(t=>t.id!==id);rosterChanged();$('team-dialog').close();});
  });
  $('clear-history').addEventListener('click',()=>confirm('Clear matchup history?','Your filters, team roster and used-team exclusions will stay.',()=>{state.history=[];save();renderHistory();}));
  $('confirm-cancel').addEventListener('click',()=>{$('confirm-dialog').close();confirmAction=null;});
  $('confirm-yes').addEventListener('click',()=>{const fn=confirmAction;confirmAction=null;$('confirm-dialog').close();if(fn)fn();});
  $('import-button').addEventListener('click',()=>{$('roster-json').value=JSON.stringify(state.roster,null,2);$('import-error').textContent='';$('data-dialog').showModal();});
  $('select-json').addEventListener('click',()=>{$('roster-json').focus();$('roster-json').select();});
  $('import-confirm').addEventListener('click',()=>{
    try {
      if($('roster-json').value.length>1000000)throw Error('The JSON is too large (maximum 1 MB).');
      const teams=E.validateRoster(JSON.parse($('roster-json').value));
      confirm('Replace your team roster?',`Import ${teams.length} teams? The current draw, excluded teams and used-team list will reset.`,()=>{state.roster=teams;state.current=null;state.excluded=[];state.used=[];rosterChanged();$('data-dialog').close();});
    }catch(e){$('import-error').textContent=e instanceof SyntaxError?'That is not valid JSON. Paste the complete roster array.':e.message;}
  });
  window.KickoffApp={back(){const dialogs=[...document.querySelectorAll('dialog[open]')];if(dialogs.length){dialogs[dialogs.length-1].close();return true;}if(page!=='draw'){navigate('draw');return true;}return false;}};
  fillStars('min',state.filters.min);fillStars('max',state.filters.max);fillStars('edit-stars',75);
  syncFilters();renderMatch();$('draw-message').textContent=saveWarning;save();
  const details=$('rules-details');if(details&&window.matchMedia('(max-width:760px)').matches)details.open=false;
  $('catalog-summary').textContent=CATALOG_INFO.teamCount+' teams · FC 26 catalog';
})();
