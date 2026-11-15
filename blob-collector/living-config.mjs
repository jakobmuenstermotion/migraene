import {softCoins,cheaper} from './coin-curve.mjs';
import {FLOWERS} from './flower-config.mjs';
import {PLANNED_ACCESSORIES} from './accessory-plan.mjs';
// Provisional tuning for the living-world update. Costs are per purchase.
export const BUILDINGS={press:{name:'Materialpresse',cost:{leaf:500,wood:30},coins:30,requires:null},nursery:{name:'Blob-Aufzuchtstation',cost:{paper:3,essence:2,wood:40},coins:250,requires:'press'}};
export const EQUIPMENT_UPGRADES={battery:[{factor:1.15,coins:400,cost:{paper:2,essence:2}},{factor:1.3,coins:900,cost:{stoneslab:4,mechanical:2}},{factor:1.5,coins:2000,cost:{shelllime:4,filtermodule:3}},{factor:1.75,coins:4500,cost:{coolingmodule:4,fabric:4}},{factor:2,coins:9000,cost:{optical:3,energycore:2}}],backpack:[{factor:1.25,coins:300,cost:{board:2,paper:1}},{factor:1.5,coins:750,cost:{board:4,fibre:2}},{factor:1.8,coins:1600,cost:{fabric:4,filtermodule:2}},{factor:2.15,coins:3500,cost:{stoneslab:4,mechanical:3}},{factor:2.5,coins:7000,cost:{coolingmodule:3,optical:2}}]};
const item=(name,slot,bonus,coins,cost,color,workshop='natureshop')=>({name,slot,bonus,coins,cost,color,workshop,seconds:8});
export const CLOTHING={
 forestshoes:item('Leichte Waldschuhe','shoes',{speed:1.05},200,{fibre:2,wood:2},'#a7ad71'),walkshoes:item('Bequeme Wanderschuhe','shoes',{speed:1.1},800,{fibre:4,resin:2},'#bc986b'),coastshoes:item('Küstenläufer','shoes',{speed:1.15},2000,{fabric:4,shelllime:2},'#73b8b3'),swiftboots:item('Flinke Stiefel','shoes',{speed:1.2},5000,{frostessence:3,mechanical:3},'#a1bad1'),
 forestjacket:item('Waldjacke','jacket',{bag:1.1},250,{fibre:3,paper:1},'#82985e'),collectjacket:item('Sammlerjacke','jacket',{bag:1.2},1000,{fibre:4,resin:2},'#c69b60'),coastjacket:item('Küstenjacke','jacket',{bag:1.3},2500,{fabric:4,filtermodule:2},'#76b8b1'),expeditionjacket:item('Große Expeditionsjacke','jacket',{bag:1.4},6000,{coolingmodule:3,optical:2},'#758da9'),
 fishinghat:item('Einfacher Anglerhut','head',{fish:.9},350,{paper:2,fibre:2},'#bca874'),coasthat:item('Küstenanglerhut','head',{fish:.8},1200,{fabric:3,shelllime:2},'#73aeac'),masterhat:item('Meisteranglerhut','head',{fish:.7},4000,{optical:2,frostessence:2},'#99a9cb'),explorerhat:item('Entdeckerhut','head',{explorer:true},1500,{paper:3,extract:2},'#bd9464'),
 snaileyes:item('Schneckenaugen','head',{},300,{mushroom:6,fibre:3,resin:2},'#c9b48a','sewingmachine'),
 energypouch:item('Kleine Energietasche','accessory',{battery:1.1},1200,{mechanical:2,filtermodule:2},'#d2b978','tinkershop'),collectbelt:item('Sammlergürtel','accessory',{bag:1.1},1000,{board:2,fibre:3},'#ae8262')
};
for(const [id,[name,wearer,, ,cost,coins]] of Object.entries(PLANNED_ACCESSORIES))if(wearer!=='blob')CLOTHING[id]=item(name,'accessory',{},coins,cost,'#bca77e','sewingmachine');
export const RESOURCE_RULES={leaf:{shares:[.75,.15,.1],group:36,radius:4.3,spacing:.065,regen:[35,59]},wood:{shares:[.6,.25,.15],group:10,radius:2.8,spacing:.24,regen:[30,44]},stone:{shares:[.7,.2,.1],group:14,radius:3,spacing:.25,regen:[35,50]},moss:{shares:[.7,.2,.1],group:10,radius:2.4,spacing:.22,regen:[35,55]},mushroom:{shares:[.8,.2],group:8,radius:2.7,spacing:.26,regen:[40,60]}};
export const MATERIAL_MOTION={leaf:{class:'light',seconds:.4},snow:{class:'light',seconds:.42},wood:{class:'rolling',seconds:.62,weight:.7},stone:{class:'rolling',seconds:.85,weight:1},shell:{class:'rolling',seconds:.48,weight:.3},ice:{class:'rolling',seconds:.65,weight:.8},moss:{class:'rooted',release:.15,seconds:.38},mushroom:{class:'rooted',release:.3,seconds:.42},seagrass:{class:'rooted',release:.4,seconds:.45},sand:{class:'mass',release:.45,seconds:.3},desertsand:{class:'light',seconds:.42}};
export const WIND_RULES={interval:[120,240],duration:[5,12],maxActive:96,reach:16,amplitude:[.25,.7,1.2],displacement:[.6,1.2,1.8],height:[.18,.5,.8],scanStep:.15};
export const SHY_BLOBS={notice:7,speed:7.5};

// Provisional rope quantities approved for sewn footwear.
for(const [i,a]of Object.values(CLOTHING).filter(a=>a.slot==='shoes').entries())a.cost.rope=i+1;

for(const [id,f]of Object.entries(FLOWERS)){RESOURCE_RULES[id]={regen:f.regen};MATERIAL_MOTION[id]={class:'rooted',release:.12,seconds:.45};}

RESOURCE_RULES.driftwood={regen:[200,340]};RESOURCE_RULES.coral={regen:[240,420]};MATERIAL_MOTION.driftwood={class:'rolling',seconds:.6,weight:.6};MATERIAL_MOTION.coral={class:'rooted',release:.25,seconds:.45};
// Neugestaltung Eistal: Nachwachsen und Saugverhalten der neuen Weltmaterialien (Testwerte).
Object.assign(RESOURCE_RULES,{desertsand:{regen:[50,110]},clay:{regen:[120,200]},coloredearth:{regen:[200,320]},cactusfibre:{regen:[160,260]},desertflower:{regen:[400,640]},cactusfruit:{regen:[400,640]},suncapsule:{regen:[900,1300]},snow:{regen:[90,150]},frostwood:{regen:[150,260]},frostflower:{regen:[220,360]},frostmoss:{regen:[120,200]},pinecone:{regen:[300,480]},cinderpod:{regen:[300,480]},icebell:{regen:[600,900]},starcone:{regen:[900,1300]}});
Object.assign(MATERIAL_MOTION,{snow:{class:'mass',release:.35,seconds:.3},frostwood:{class:'rolling',seconds:.62,weight:.6},frostflower:{class:'rooted',release:.25,seconds:.4},frostmoss:{class:'rooted',release:.2,seconds:.38},ice:{class:'rolling',seconds:.55,weight:.7},icecrystal:{class:'rolling',seconds:.5,weight:.5},ironore:{class:'rolling',seconds:.7,weight:.9}});
for(const id of ['resinlump','rarestone','beachglass']){
 RESOURCE_RULES[id]={regen:[120,240]};
 MATERIAL_MOTION[id]={class:'rolling',seconds:.48,weight:.3};
}
for(const id of ['seedpod','glowfruit','palmfruit','windshell','shimmershell']){
 RESOURCE_RULES[id]={regen:id==='glowfruit'?[900,1200]:[480,900]};
 MATERIAL_MOTION[id]={class:'light',seconds:.45};
}

for(const c of Object.values(CLOTHING)){c.coins=softCoins(c.coins);cheaper(c.cost);}for(const l of Object.values(EQUIPMENT_UPGRADES))for(const c of l){c.coins=softCoins(c.coins);cheaper(c.cost);}
// Jakob 1.11.: Blobstation und Presse günstiger. Holz etwas häufiger.
Object.assign(BUILDINGS.press,{cost:{leaf:300,wood:15},coins:15});Object.assign(BUILDINGS.nursery,{cost:{paper:2,essence:1,wood:15},coins:80});
Object.assign(RESOURCE_RULES.wood,{group:13,regen:[20,32]});
