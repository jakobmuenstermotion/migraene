import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./mondgarten/game.js',import.meta.url),'utf8');
const imports={};
for(const match of source.matchAll(/^import \{([^}]+)\} from '([^']+)';$/gm)){
 if(['./scene.js','./controls.js','./warehouse-ui.mjs'].includes(match[2]))continue;
 const module=await import(new URL('./mondgarten/'+match[2].slice(2),import.meta.url));
 for(const name of match[1].split(',').map(s=>s.trim()))imports[name]=module[name];
}
function boot(embedded){
 const nodes=new Map(),errors=[],saved=new Map();let renders=0,built=0;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:id==='gameError',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},querySelector(){return node(id+'-child');},querySelectorAll(){return[];},remove(){},append(){},getBoundingClientRect(){return{left:0,right:100,top:0,bottom:100};}});return nodes.get(id);};
 const document={getElementById:node,querySelector:node,createElement:()=>node('created-'+Math.random()),body:node('body'),addEventListener(){}};
 const window={frameElement:embedded?{dataset:{mondgarten:'1'}}:null,addEventListener(){}};
 class GardenScene{build(){built++;}refreshConstruction(){}setDestination(){}update(){}worldToScreen(){return{x:200,y:200,visible:true};}nurseryTargets(){return[];}makeTransfer(){}makeFoodFlight(){}}
 class GardenControls{stop(){}direction(){return{x:0,z:0};}}
 class WarehouseShelf{visible=false;hide(){}refresh(){}position(){}}
 const context={...imports,document,window,GardenScene,GardenControls,WarehouseShelf,URL,location:{href:'https://example.test/mondgarten/index.html'+(embedded?'?embedded=1':''),origin:'https://example.test'},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},matchMedia:()=>({matches:false}),console:{error:e=>errors.push(e)},setTimeout(){},requestAnimationFrame(){renders++;},performance:{now:()=>0}};
 vm.createContext(context);vm.runInContext(source.replace(/^import .*;\r?\n/gm,''),context,{filename:'game.js'});
 vm.runInContext('update(.02)',context,{filename:'first-frame.js'});
 return{context,errors,node,saved,get renders(){return renders;},get built(){return built;}};
}
for(const embedded of [false,true])test(`the full ${embedded?'hosted':'standalone'} game module initializes its world, starts rendering and saves without showing the error screen`,()=>{
 const result=boot(embedded);assert.deepEqual(result.errors.map(e=>String(e)),[]);assert.equal(result.node('gameError').hidden,true);assert.equal(result.built,1);assert.equal(result.renders,1);assert.ok(result.saved.size>0);
});

test('a real game update auto-delivers a whole single-ingredient bag from the wider workshop area and shows its ingredient panel',()=>{
 const result=boot(true);vm.runInContext("state.journey.round=3;state.journey.asleep=false;state.village.workshops.bouquet.level=1;state.cargo={moonbloom:{count:18,value:36}};state.bag=18;state.bagValue=36;player.x=0;player.z=14.8;update(.02);",result.context);
 assert.equal(vm.runInContext('state.bag',result.context),0);assert.equal(vm.runInContext('state.village.workshops.bouquet.inputs.moonbloom',result.context),18);assert.equal(result.node('workshopDelivery').hidden,false);
});
test('a real game update runs fishing without a dialog, shows only a nearby cast button and keeps a caught fish on the stack',()=>{
 const result=boot(true);vm.runInContext("state.journey.round=12;state.journey.asleep=false;state.outdoors.owned=['rod'];player.x=LAKE.shore.x;player.z=LAKE.shore.z;openFishing();update(.02);",result.context);
 assert.equal(result.node('fishingHUD').hidden,false);assert.equal(result.node('outdoorAction').hidden,true);assert.ok(!result.node('modal').open);
 vm.runInContext("state.outdoors.fishing.phase='catch';state.outdoors.fishing.fishId='silver';state.outdoors.fishing.progress=.999;state.outdoors.fishing.marker=.5;state.outdoors.fishing.elapsed=0;update(.02);",result.context);
 assert.equal(vm.runInContext('state.outdoors.fish.silver',result.context),1);assert.equal(result.node('fishingHUD').hidden,true);assert.equal(result.node('stackCount').hidden,false);
 vm.runInContext('player.x=0;player.z=0;update(.02);',result.context);assert.equal(result.node('outdoorAction').hidden,true);
});
