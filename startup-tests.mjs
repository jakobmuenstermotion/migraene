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
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:id==='gameError',style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(){},querySelector(){return node(id+'-child');},querySelectorAll(){return[];},remove(){}});return nodes.get(id);};
 const document={getElementById:node,querySelector:node,body:node('body'),addEventListener(){}};
 const window={frameElement:embedded?{dataset:{mondgarten:'1'}}:null,addEventListener(){}};
 class GardenScene{build(){built++;}refreshConstruction(){}}
 class GardenControls{stop(){}}
 class WarehouseShelf{visible=false;hide(){}refresh(){}position(){}}
 const context={...imports,document,window,GardenScene,GardenControls,WarehouseShelf,URL,location:{href:'https://example.test/mondgarten/index.html'+(embedded?'?embedded=1':''),origin:'https://example.test'},localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},matchMedia:()=>({matches:false}),console:{error:e=>errors.push(e)},setTimeout(){},requestAnimationFrame(){renders++;},performance:{now:()=>0}};
 vm.runInNewContext(source.replace(/^import .*;\r?\n/gm,''),context,{filename:'game.js'});
 return{errors,node,saved,get renders(){return renders;},get built(){return built;}};
}
for(const embedded of [false,true])test(`the full ${embedded?'hosted':'standalone'} game module initializes its world, starts rendering and saves without showing the error screen`,()=>{
 const result=boot(embedded);assert.deepEqual(result.errors.map(e=>String(e)),[]);assert.equal(result.node('gameError').hidden,true);assert.equal(result.built,1);assert.equal(result.renders,1);assert.ok(result.saved.size>0);
});
