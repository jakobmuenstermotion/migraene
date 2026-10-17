import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize} from './mondgarten/core.mjs';
import {BEDS} from './mondgarten/village-content.mjs';
import {getBuildPads,payBuild,completeBuild} from './mondgarten/village.mjs';
import {purchasedSnailCount,snailPurchaseLimit} from './mondgarten/snail-care.mjs';
import {FARM,releaseSnail} from './mondgarten/snail-farm.mjs';
function ready(){const s=freshState();s.journey.round=77;s.coins=1e12;return s;}
const offer=s=>getBuildPads(s).find(p=>p.id==='snail');
test('each unlocked field opens one purchase, capped at seven; field upgrades do not create extra slots',()=>{
 const s=ready();assert.equal(snailPurchaseLimit(s),1);assert.equal(payBuild(s,offer(s),5).complete,true);const paid=s.coins;
 assert.equal(offer(s).locked,true);assert.equal(payBuild(s,offer(s),5).complete,false);assert.equal(s.coins,paid);assert.equal(completeBuild(s,'snail'),false);
 s.village.beds[0]=5;s.village.expansions[0]=8;assert.equal(snailPurchaseLimit(s),1);assert.equal(offer(s).locked,true);
 for(let i=1;i<BEDS.length;i++){s.village.beds[i]=1;assert.equal(offer(s).locked,false);assert.equal(payBuild(s,offer(s),5).complete,true);}
 assert.equal(purchasedSnailCount(s),7);assert.equal(s.village.snails,7);assert.equal(offer(s).max,true);assert.equal(payBuild(s,offer(s),5).complete,false);
});
test('five additional helpers require raising, while farm helpers do not consume purchase entitlements',()=>{
 const s=ready();s.village.beds=BEDS.map(()=>1);s.village.farm.built=true;
 const raise=id=>{s.village.farm.nursery.push({id,species:'garden',growth:FARM.growSeconds,investment:0});return releaseSnail(s,id,'helper');};
 assert.equal(raise(1),true);assert.equal(purchasedSnailCount(s),0);
 for(let i=0;i<7;i++)assert.equal(payBuild(s,offer(s),5).complete,true);
 assert.equal(purchasedSnailCount(s),7);assert.equal(s.village.snails,8);
 for(let i=2;i<=5;i++)assert.equal(raise(i),true);
 assert.equal(s.village.snails,12);assert.equal(purchasedSnailCount(s),7);assert.equal(raise(6),false);assert.equal(payBuild(s,offer(s),5).complete,false);
 const saved=normalize(JSON.parse(JSON.stringify(s)));assert.equal(saved.village.snails,12);assert.equal(purchasedSnailCount(saved),7);assert.equal(saved.village.farm.helpers.filter(Boolean).length,5);
});
test('old saves keep all helpers, species, cargo and coins even when purchases exceed the new cap',()=>{
 const s=ready();s.village.snails=12;s.village.farm.helpers=[null,'garden',null,'dew'];s.village.snailLoads=[{x:1,z:2,mode:'deliver',items:{moonbloom:3},values:{moonbloom:9}}];const saved=normalize(JSON.parse(JSON.stringify(s)));
 assert.equal(saved.village.snails,12);assert.equal(purchasedSnailCount(saved),10);assert.equal(saved.coins,s.coins);assert.deepEqual(saved.village.farm.helpers,s.village.farm.helpers);assert.deepEqual(saved.village.snailLoads[0].items,{moonbloom:3});assert.equal(offer(saved).max,true);
});
test('unlocking a field resumes a partially paid purchase without changing its price or losing the deposit',()=>{
 const s=ready();s.village.snails=1;s.village.beds[1]=1;const p=offer(s);payBuild(s,p,1);const deposit=s.village.payments.snail,coins=s.coins;assert.ok(deposit>0);
 s.village.beds[1]=0;assert.equal(payBuild(s,offer(s),5).complete,false);assert.equal(s.village.payments.snail,deposit);assert.equal(s.coins,coins);
 s.village.beds[1]=1;assert.equal(offer(s).cost,p.cost);assert.equal(payBuild(s,offer(s),5).complete,true);assert.equal(s.village.snails,2);
});
