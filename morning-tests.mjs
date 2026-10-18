import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize} from './mondgarten/core.mjs';
import {createVillageField,cropGrowth} from './mondgarten/harvest.mjs';
import {startRound} from './mondgarten/journey.mjs';
test('every crop and expanded strip is fully grown on the next morning, without changing stock or clocks',()=>{
 const s=freshState();s.village.beds.fill(1);s.village.expansions.fill(8);s.journey.growthTime=100;
 const cells=createVillageField(s);s.village.fieldCuts=Object.fromEntries(cells.map(c=>[c.key,{cutAt:100,readyAt:1000}]));
 s.village.finished={bouquet:3};s.village.finishedValues={bouquet:45};s.bag=2;s.bagValue=9;s.cargo={moonbloom:{count:2,value:9}};
 const old=normalize(JSON.parse(JSON.stringify(s)));assert.ok(createVillageField(old).every(c=>c.readyAt>100));
 s.journey.closed=true;s.journey.pending=1;assert.ok(startRound(s));assert.deepEqual(s.village.fieldCuts,{});
 const fresh=createVillageField(s);assert.equal(fresh.length,cells.length);assert.ok(fresh.every(c=>cropGrowth(c,s.journey.growthTime)===1));
 assert.equal(s.journey.growthTime,100);assert.deepEqual(s.village.finished,{bouquet:3});assert.equal(s.bagValue,9);
 assert.ok(createVillageField(normalize(JSON.parse(JSON.stringify(s)))).every(c=>cropGrowth(c,100)===1));
});
test('an unsuccessful morning transition preserves all cut times',()=>{
 const s=freshState();s.village.fieldCuts={'moon:0':{cutAt:10,readyAt:60}};const before=structuredClone(s.village.fieldCuts);
 assert.equal(startRound(s),false);assert.deepEqual(s.village.fieldCuts,before);
 s.journey.closed=true;assert.equal(startRound(s),false);assert.deepEqual(s.village.fieldCuts,before);
});
