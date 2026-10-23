const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../app/src/main/assets/engine.js');
const roster = require('../app/src/main/assets/teams.js');
const f = overrides => ({...E.defaults,...overrides});
const men = roster.filter(t=>t.gender==='men');
const team = (id,stars=4,extra={})=>({id,name:id,stars,league:'Test league',country:'Test country',gender:'men',kind:'club',...extra});
function seeded(seed=42){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}

test('the entire 32-club starter snapshot validates with unique IDs',()=>{
  assert.equal(E.validateRoster(roster).length,32);
  assert.equal(men.length,16);assert.equal(roster.filter(t=>t.gender==='women').length,16);
});
test('eligible pool combines gender, type, league, stars and exclusions',()=>{
  const selected=E.eligible(roster,f({league:'Premier League',min:5}),['liverpool-m'],[]);
  assert.deepEqual(selected.map(t=>t.id).sort(),['arsenal-m','man-city-m']);
});
test('balanced draws always obey star gap and never draw the same team twice',()=>{
  const rng=seeded();for(let n=0;n<5000;n++){
    const [a,b]=E.draw(roster,f({gap:0}),[],[],null,null,rng);
    assert.notEqual(a.id,b.id);assert.equal(a.stars,b.stars);assert.equal(a.gender,'men');
  }
});
test('random mode permits unequal ratings',()=>{
  const teams=[team('a',1),team('b',5)];
  assert.equal(E.pairs(teams,f({mode:'random'})).length,1);
  assert.equal(E.pairs(teams,f({mode:'balanced'})).length,0);
});
test('all-category draws never mix genders or club/national categories',()=>{
  const teams=[...roster,team('nat-a',5,{kind:'national'}),team('nat-b',5,{kind:'national'})];
  const filter=f({gender:'all',kind:'all'});
  const choices=E.pairs(E.eligible(teams,filter),filter);
  assert(choices.length>0);for(const [a,b] of choices){assert.equal(a.gender,b.gender);assert.equal(a.kind,b.kind);}
});
test('same-league draws keep both teams in one competition',()=>{
  const rng=seeded();for(let n=0;n<1000;n++){
    const [a,b]=E.draw(roster,f({mode:'league',gender:'all'}),[],[],null,null,rng);
    assert.equal(a.league,b.league);assert.equal(a.gender,b.gender);
  }
});
test('custom enabled pool cannot leak excluded teams',()=>{
  const included=men.slice(0,2),excluded=roster.filter(t=>!included.includes(t)).map(t=>t.id);
  const pair=E.draw(roster,f(),excluded,[],null,null,seeded());
  assert.deepEqual(new Set(pair.map(t=>t.id)),new Set(included.map(t=>t.id)));
});
test('no-repeat sessions exhaust cleanly without silently resetting',()=>{
  const filter=f({noRepeats:true}),used=[];const rng=seeded();
  for(let n=0;n<8;n++){
    const result=E.draw(roster,filter,[],used,null,null,rng);
    for(const t of result){assert(!used.includes(t.id));used.push(t.id);}
  }
  assert.equal(new Set(used).size,16);
  assert.throws(()=>E.draw(roster,filter,[],used),/No matchup/);
  assert.equal(E.eligible(roster,filter,[],[]).length,16);
});
test('single-side redraw keeps the opponent and changes only the requested side',()=>{
  const filter=f(),match=[men[0],men[1]];
  const next=E.draw(roster,filter,[],[],match,0,seeded());
  assert.equal(next[1],match[1]);assert.notEqual(next[0].id,match[0].id);
  const away=E.draw(roster,filter,[],[],match,1,seeded());
  assert.equal(away[0],match[0]);assert.notEqual(away[1].id,match[1].id);
  assert.deepEqual(match,[men[0],men[1]]);
});
test('locked used team remains allowed, replacement must be unused',()=>{
  const match=[men[0],men[1]],filter=f({noRepeats:true});
  const next=E.draw(roster,filter,[],match.map(t=>t.id),match,0,seeded());
  assert.equal(next[1].id,match[1].id);assert(!match.some(t=>t.id===next[0].id));
});
test('a locked team outside updated filters cannot leak into a redraw',()=>{
  assert.throws(()=>E.draw(roster,f({gender:'women'}),[],[],[men[0],men[1]],0),/locked team/);
  assert.throws(()=>E.draw(roster,f(),[men[1].id],[],[men[0],men[1]],0),/locked team/);
});
test('two-team pools give a useful error for impossible replacement',()=>{
  assert.throws(()=>E.draw(men.slice(0,2),f(),[],[],men.slice(0,2),0),/No replacement/);
});
test('empty, single-team and incompatible pools produce clear errors',()=>{
  assert.throws(()=>E.draw([],f(),[],[]),/No matchup/);
  assert.throws(()=>E.draw([men[0]],f(),[],[]),/No matchup/);
  assert.throws(()=>E.draw(roster,f({kind:'national'}),[],[]),/No matchup/);
  assert.throws(()=>E.draw(roster,f(),[],[],null,0),/Draw both/);
});
test('each eligible pair and both home/away orders can be selected',()=>{
  const teams=[team('a'),team('b'),team('c')],filter=f();
  for(const [r,expected] of [[0,['a','b']],[0.4,['a','c']],[0.99,['b','c']]]){
    let i=0;const rng=()=>[r,0][i++];
    assert.deepEqual(E.draw(teams,filter,[],[],null,null,rng).map(t=>t.id),expected);
    i=0;const reverse=()=>[r,0.9][i++];
    assert.deepEqual(E.draw(teams,filter,[],[],null,null,reverse).map(t=>t.id),expected.slice().reverse());
  }
});
test('seeded distribution does not strongly favor one eligible pair',()=>{
  const teams=[team('a'),team('b'),team('c')],counts={ab:0,ac:0,bc:0},rng=seeded();
  for(let i=0;i<12000;i++)counts[E.draw(teams,f(),[],[],null,null,rng).map(t=>t.id).sort().join('')]++;
  for(const count of Object.values(counts))assert(count>3700&&count<4300);
});
test('roster validation rejects bad imports atomically',()=>{
  const invalid=[null,{},[team('a')],[team('a'),team('a')],[team('a',6),team('b')],[team('a',4.3),team('b')],[team('a',4,{gender:'other'}),team('b')],[team('a',4,{name:' '}),team('b')],[team('a',4,{id:'<script>'}),team('b')]];
  for(const value of invalid)assert.throws(()=>E.validateRoster(value));
  assert.equal(E.validateRoster([team('a',0.5,{kind:'national'}),team('b',5)]).length,2);
});
test('rating boundaries are inclusive',()=>{
  const teams=[team('a',3.5),team('b',4),team('c',4.5)];
  assert.equal(E.eligible(teams,f({min:3.5,max:4.5})).length,3);
  assert.equal(E.pairs(teams,f({gap:0.5})).length,2);
});
