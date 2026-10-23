const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../app/src/main/assets/engine.js');
const teams=require('../app/src/main/assets/teams.js');
const f={...E.defaults,metric:'overall',min:1,max:99,gap:3,gender:'all',kind:'all'};
test('catalog includes every reconciled FC 26 club and national entry once',()=>{
  assert.equal(teams.length,839);assert.equal(new Set(teams.map(t=>t.eaId)).size,839);
  assert.equal(teams.filter(t=>t.kind==='club').length,762);
  assert.equal(teams.filter(t=>t.kind==='national'&&t.gender==='men').length,60);
  assert.equal(teams.filter(t=>t.kind==='national'&&t.gender==='women').length,17);
  assert.equal(E.validateRoster(teams).length,839);
});
test('rating provenance is explicit and every team has a source crest',()=>{
  assert.equal(teams.filter(t=>t.ratingSource==='FC 27').length,739);
  assert.equal(teams.filter(t=>t.ratingSource==='FC 26 fallback').length,100);
  for(const t of teams){assert(t.overall>=1&&t.overall<=99);assert.match(t.crest,/^https:\/\/images\.fifaindex\.com\/fc2[67]\/teams\/\d+\.(png|webp)$/);}
});
test('overall filters and balanced draws operate on numeric overalls',()=>{
  const selected=E.eligible(teams,{...f,min:80,max:85},[],[]);
  assert(selected.length>10);assert(selected.every(t=>t.overall>=80&&t.overall<=85));
  for(let n=0;n<50;n++){const [a,b]=E.draw(teams,{...f,min:80,max:85},[],[]);assert(Math.abs(a.overall-b.overall)<=3);assert.equal(a.gender,b.gender);assert.equal(a.kind,b.kind);assert.notEqual(a.id,b.id);}
});
test('verified-only mode never silently uses FC 26 fallback ratings',()=>{
  const selected=E.eligible(teams,{...f,verifiedOnly:true});assert.equal(selected.length,739);
  assert(selected.every(t=>t.ratingSource==='FC 27'));
});
test('validation retains provenance and rejects arbitrary image origins',()=>{
  const checked=E.validateTeam({...teams[0],crest:'https://untrusted.example/x.png'});
  assert.equal(checked.overall,teams[0].overall);assert.equal(checked.ratingSource,teams[0].ratingSource);assert.equal(checked.crest,undefined);
  assert.throws(()=>E.validateTeam({...teams[0],overall:100}));
});
