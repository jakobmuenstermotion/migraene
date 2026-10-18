import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from './mondgarten/vendor/three.module.js';
import {WORKSHOPS} from './mondgarten/village-content.mjs';
import {freshState} from './mondgarten/core.mjs';
import {workshopStatus} from './mondgarten/village.mjs';
const before=globalThis.document;globalThis.document={createElement:()=>({getContext:()=>({fillText(){},fillRect(){},createRadialGradient:()=>({addColorStop(){}})})})};
const {GardenScene}=await import('./mondgarten/scene.js');test.after(()=>globalThis.document=before);
function scene(reduced=false){const v=Object.create(GardenScene.prototype);Object.assign(v,{construction:new T.Group(),world:new T.Group(),scene:new T.Group(),butterflies:[],reducedMotion:()=>reduced});return v;}
test('each workshop has a bounded animated prop and all machine states have a visible status sign',()=>{
 const s=freshState();
 for(const w of WORKSHOPS){const v=scene(),activity=v.makeWorkshopActivity(w);assert.equal(activity.root.name,'workshop-activity:'+w.id);assert.equal(activity.pieces.length,3);
  const visual={activity,statusSign:new T.Sprite(new T.SpriteMaterial({map:new T.Texture()}))};v.updateWorkshopActivity(visual,'waiting',0);assert.equal(activity.root.visible,false);const firstMap=visual.statusSign.material.map;v.updateWorkshopActivity(visual,'waiting',.1);assert.equal(visual.statusSign.material.map,firstMap);v.updateWorkshopActivity(visual,'working',1);assert.ok(activity.root.visible);
  activity.pieces[0].updateMatrix();const pose=activity.pieces[0].matrix.clone();v.updateWorkshopActivity(visual,'working',1.2);activity.pieces[0].updateMatrix();assert.notDeepEqual(activity.pieces[0].matrix,pose);
  s.village.workshops[w.id].level=1;assert.equal(workshopStatus(s,w),'waiting');s.village.workshops[w.id].running=true;assert.equal(workshopStatus(s,w),'working');s.village.workshops[w.id].running=false;s.village.finished[w.product]=1;assert.equal(workshopStatus(s,w),'ready');s.village.finished[w.product]=24;assert.equal(workshopStatus(s,w),'full');s.journey.asleep=true;assert.equal(workshopStatus(s,w),'resting');s.journey.asleep=false;
 }
});
test('gift product has a real wrapped box and bow; capture butterflies use their species color and remain bounded',()=>{
 const v=scene(),gift=v.productBundle('giftbox'),box=new T.Box3().setFromObject(gift);assert.ok(box.max.y-box.min.y>.5);assert.ok(gift.children.some(c=>c.geometry?.type==='TorusGeometry'));
 for(let i=0;i<10;i++)v.releaseButterfly({x:1,z:2},{id:'lavender',color:'#bb91e4'});assert.equal(v.butterflies.length,3);assert.ok(v.butterflies.every(b=>b.collected&&b.root.name==='found-butterfly:lavender'));
});
test('evening effects have a fixed eight-mesh budget and reuse their material on rebuild',()=>{
 const v=scene();v.makeEveningLife();assert.equal(v.fireflies.children.length,8);const m=v.fireflyMaterial;v.makeEveningLife();assert.equal(v.fireflyMaterial,m);
 const reduced=scene(true),w=WORKSHOPS[1],activity=reduced.makeWorkshopActivity(w),visual={activity};reduced.updateWorkshopActivity(visual,'working',1);const y=activity.pieces[0].position.y;reduced.updateWorkshopActivity(visual,'working',8);assert.equal(activity.pieces[0].position.y,y);
});
