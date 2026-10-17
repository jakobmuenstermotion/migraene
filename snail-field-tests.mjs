import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,normalize} from './mondgarten/core.mjs';
import {GardenAutomation} from './mondgarten/automation.mjs';
import {createVillageField} from './mondgarten/harvest.mjs';
import {snailProfile,setSnailProfile} from './mondgarten/snail-care.mjs';
import {BEDS} from './mondgarten/village-content.mjs';
function ready(field){const s=freshState();s.village.snails=1;s.village.beds[field]=1;setSnailProfile(s,0,{task:'warehouse',field});return s;}
test('field assignments persist, include fruit trees, and reject locked or invalid fields',()=>{
 const s=ready(4);assert.equal(snailProfile(normalize(JSON.parse(JSON.stringify(s))),0).field,4);
 assert.equal(setSnailProfile(s,0,{field:2}),false);
 setSnailProfile(s,0,{field:999});assert.equal(snailProfile(s,0).field,null);
 const old=ready(0);delete old.village.snailProfiles[0].field;assert.equal(snailProfile(normalize(old),0).field,null);
});
test('assigned helpers harvest only their field or fruit trees and wait if those plants are cut',()=>{
 for(const field of [0,1,4]){
  const s=ready(field),a=new GardenAutomation(s),cells=createVillageField(s),n=a.snails[0],b=BEDS[field];n.x=b.x;n.z=b.z;
  for(let i=0;i<150;i++)a.update(s,cells,null,.1,0);
  assert.ok(n.bag>0);assert.deepEqual(Object.keys(n.items),[b.crop]);
  for(const c of cells)if(c.bed===field)c.readyAt=100;
  n.items={};n.values={};n.bag=0;n.mode='graze';n.target=null;
  for(let i=0;i<20;i++)a.update(s,cells,null,.1,0);
  assert.equal(n.bag,0);assert.equal(n.bed,field);assert.equal(n.target,null);
 }
});
test('changing fields abandons the old target, preserves cargo, and keeps delivery task independent',()=>{
 const s=ready(0);s.village.beds[4]=1;const a=new GardenAutomation(s),n=a.snails[0],cells=createVillageField(s);
 a.update(s,cells,null,.1,0);assert.equal(n.target.bed,0);n.items={moonbloom:3};n.values={moonbloom:7};n.bag=3;
 setSnailProfile(s,0,{...snailProfile(s,0),field:4});a.sync(s);assert.equal(n.target,null);assert.equal(n.bag,3);assert.equal(n.task,'warehouse');
 a.update(s,cells,null,.1,0);assert.equal(n.target.bed,4);assert.deepEqual(n.items,{moonbloom:3});
});
