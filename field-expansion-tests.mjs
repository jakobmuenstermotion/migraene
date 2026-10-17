import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize} from './mondgarten/core.mjs';
import {BEDS} from './mondgarten/village-content.mjs';
import {createVillageField} from './mondgarten/harvest.mjs';
import {expandedFieldCells} from './mondgarten/field-expansion.mjs';
import {getBuildPads,payBuild,bedYield} from './mondgarten/village.mjs';
import {advanceApiary} from './mondgarten/apiary.mjs';
import {HONEY_SECONDS,HONEY_VALUE_MULTIPLIER} from './mondgarten/honey-content.mjs';

test('eight small strips grow every bed without duplicate or moving plants',()=>{
 for(const b of BEDS){let previous=expandedFieldCells(b);for(let level=1;level<=8;level++){
  const cells=expandedFieldCells(b,level);assert.ok(cells.length>previous.length);
  assert.deepEqual(cells.slice(0,previous.length),previous);
  assert.equal(new Set(cells.map(c=>c.x+':'+c.z)).size,cells.length);previous=cells;
 }}
});
test('expansion purchase preserves yields, other prices and cut times across reload',()=>{
 const s=freshState();s.journey.round=1;s.coins=10000;
 const before=getBuildPads(s),yieldBefore=bedYield(s,0),cells=createVillageField(s);
 cells[0].cutAt=10;cells[0].readyAt=50;
 const pad=before.find(p=>p.id==='expand:0');assert.equal(pad.cost,80);
 assert.ok(payBuild(s,pad,10).complete);assert.equal(s.village.expansions[0],1);
 assert.equal(bedYield(s,0),yieldBefore);
 assert.deepEqual(getBuildPads(s).filter(p=>p.kind!=='expansion').map(p=>p.cost),before.filter(p=>p.kind!=='expansion').map(p=>p.cost));
 const grown=createVillageField(s,cells);assert.ok(grown.length>cells.length);assert.equal(grown[0].readyAt,50);
 s.village.fieldCuts={[cells[0].key]:{cutAt:10,readyAt:50}};
 const loaded=normalize(JSON.parse(JSON.stringify(s)));assert.equal(loaded.village.expansions[0],1);assert.equal(createVillageField(loaded)[0].readyAt,50);
 for(let i=1;i<8;i++)assert.ok(payBuild(s,getBuildPads(s).find(p=>p.id==='expand:0'),10).complete);
 assert.ok(getBuildPads(s).find(p=>p.id==='expand:0').max);assert.equal(payBuild(s,pad,10).complete,false);
});
test('new honey is six times as valuable, with unchanged production time and count',()=>{
 const s=freshState();s.journey.round=3;s.village.apiary.hives[0].built=true;
 advanceApiary(s,createVillageField(s),HONEY_SECONDS);
 assert.equal(s.village.apiary.hives[0].count,1);
 assert.equal(s.village.apiary.hives[0].value,bedYield(s,0)*HONEY_VALUE_MULTIPLIER);
 assert.equal(HONEY_VALUE_MULTIPLIER,4*6);
});
