import {readFile,writeFile} from 'node:fs/promises';

// Embed each module once: shared imports do not duplicate Three.js in the HTML.
const modules=[['blob-three','vendor/three.module.js'],['blob-hud-art','hud-art.mjs'],['blob-joystick','joystick.mjs'],['blob-config','sauger-config.mjs'],['blob-advanced-skills','advanced-skills.mjs'],['blob-inventory','inventory.mjs'],['blob-test-world','test-world.mjs'],['blob-sauger-systems','sauger-systems.mjs'],['blob-save','progress-save.mjs'],['blob-test-ui','test-ui.mjs'],['blob-test-view','test-world-view.mjs'],['blob-vacuums','vacuums.mjs'],['blob-ground-skills','ground-skills.mjs'],['blob-ground-systems','ground-systems.mjs'],['blob-find-icons','find-icons.mjs'],['blob-ground-radar','ground-radar-view.mjs'],['blob-skills','vacuum-skills.mjs'],['blob-gesture','vacuum-gesture.mjs'],['blob-vacuum-view','vacuum-view.mjs'],['blob-challenges','challenge-view.mjs'],['blob-vacuum-ui','vacuum-ui.mjs'],['blob-simulation','simulation.mjs'],['blob-effects','effects.mjs'],['blob-leaves','leaf-renderer.mjs'],['blob-game','game.js']];
modules.push(['blob-coast-river-geometry','coast-river-geometry.mjs']);
modules.push(['blob-battery-bank','battery-bank.mjs'],['blob-auto-suction','auto-suction.mjs']);
modules.push(['blob-root-contact','root-contact.mjs'],['blob-stack-order','stack-order.mjs']);
modules.push(['blob-equipment-tree','equipment-tree.mjs']);
modules.push(['blob-recipe-order','recipe-order.mjs']);
modules.push(['blob-beach-wind','beach-wind.mjs']);
modules.push(['blob-cave-space','cave-space.mjs'],['blob-cave-systems','cave-systems.mjs'],['blob-cave-view','cave-view.mjs']);
modules.push(['blob-coast-surface','coast-surface-effects.mjs']);
modules.push(['blob-flowers','flower-config.mjs'],['blob-flower-sites','flower-sites.mjs']);
modules.push(['blob-rounds','rounds.mjs'],['blob-home-life','home-life-ui.mjs']);
modules.push(['blob-visual-polish','visual-polish.mjs']);
modules.push(['blob-cozy-assets','cozy-assets.mjs']);
modules.push(['blob-visual-prototype','visual-prototype.mjs']);
modules.push(['blob-visual-lab','visual-lab.mjs']);
modules.push(['blob-canopy','canopy-visibility.mjs']);
modules.push(['blob-building-art','building-art.mjs']);
modules.push(['blob-building-access','building-access.mjs']);
modules.push(['blob-goal-state','goal-state.mjs'],['blob-goals-ui','goals-ui.mjs']);
modules.push(['blob-shy-blobs','shy-blobs.mjs']);
modules.push(['blob-golden-leaf','golden-leaf.mjs']);
modules.push(['blob-construction-stock','construction-stock.mjs']);
modules.push(['blob-character-polish','character-polish.mjs']);
modules.push(['blob-gear-ui','gear-ui.mjs'],['blob-living-view','living-view.mjs']);
modules.push(['blob-living-config','living-config.mjs'],['blob-equipment','equipment.mjs'],['blob-homebase-build','homebase-build.mjs'],['blob-tree-profiles','tree-profiles.mjs'],['blob-resource-world','resource-world.mjs'],['blob-material-motion','material-motion.mjs'],['blob-world-wind','world-wind.mjs']);
modules.push(['blob-skill-layout','skill-layout.mjs']);
modules.push(['blob-sunny-area','sunny-area.mjs'],['blob-material-press','material-press.mjs'],['blob-sunny-save','sunny-save.mjs'],['blob-sunny-view','sunny-view.mjs'],['blob-sunny-ui','sunny-ui.mjs']);
modules.push(['blob-wood-geometry','wood-geometry.mjs']);
modules.push(['blob-forest-detail','forest-detail.mjs']);
modules.push(['blob-boundary-view','boundary-view.mjs']);
modules.push(['blob-press-tree','press-tree.mjs']);
modules.push(['blob-product-flight','product-flight.mjs']);
modules.push(['blob-daylight','daylight.mjs']);
modules.push(['blob-scenic-geometry','scenic-geometry.mjs']);
modules.push(['blob-transitions','transition-view.mjs']);
modules.push(['blob-terrain-geometry','terrain-geometry.mjs']);
modules.push(['blob-gorge-shape','gorge-shape.mjs'],['blob-gorge-view','gorge-view.mjs']);
modules.push(['blob-world-variety','world-variety.mjs']);
modules.push(['blob-interior-view','interior-view.mjs']);
modules.push(['blob-world-ui','world-ui.mjs'],['blob-charging','charging.mjs']);
modules.push(['blob-forest-config','forest-blob-config.mjs'],['blob-forest-blobs','forest-blobs.mjs'],['blob-forest-view','forest-blob-view.mjs'],['blob-forest-ui','forest-blob-ui.mjs']);
modules.push(['blob-woodlands','woodland-regions.mjs'],['blob-woodland-view','woodland-view.mjs']);
modules.push(['blob-nursery-view','nursery-view.mjs'],['blob-nursery-touch','nursery-touch.mjs']);
modules.push(['blob-navigation','blob-navigation.mjs'],['blob-workers','blob-workers.mjs']);
modules.push(['blob-forest-materials','forest-materials.mjs']);
modules.push(['blob-material-plan-resources','material-plan-resources.mjs']);
modules.push(['blob-special-material-geometry','special-material-geometry.mjs']);
modules.push(['blob-accessory-plan','accessory-plan.mjs']);
modules.push(['blob-workshop-upgrades','workshop-upgrades.mjs'],['blob-workshop-tree','workshop-tree.mjs']);
modules.push(['blob-debug','blob-debug.mjs']);
modules.push(['blob-dress-view','blob-dress-view.mjs']);
modules.push(['blob-material-geometry','forest-material-geometry.mjs']);
modules.push(['blob-placement','placement.mjs'],['blob-placement-ui','placement-ui.mjs']);
modules.push(['blob-coast-area','coast-area.mjs'],['blob-coast-reference-assets','coast-reference-assets.mjs'],['blob-coast-polish','coast-polish.mjs'],['blob-coast-view','coast-view.mjs'],['blob-coast-geometry','coast-geometry.mjs']);
modules.push(['blob-lake','lake-area.mjs'],['blob-fishing','fishing.mjs'],['blob-fishing-view','fishing-view.mjs']);
modules.push(['blob-crafting-config','crafting-config.mjs'],['blob-crafting','crafting.mjs'],['blob-crafting-view','crafting-view.mjs']);
modules.push(['blob-market','market.mjs'],['blob-market-view','market-view.mjs'],['blob-crafting-ui','crafting-ui.mjs'],['blob-blueprint','blueprint.mjs'],['blob-blueprint-view','blueprint-view.mjs']);
modules.push(['blob-home-space','home-space.mjs'],['blob-home-systems','home-systems.mjs'],['blob-home-view','home-view.mjs']);
modules.push(['blob-factory-config','factory-config.mjs'],['blob-factory','factory.mjs']);
modules.push(['blob-trails','trails.mjs'],['blob-trail-view','trail-view.mjs']);
modules.push(['blob-balance','game-balance.mjs']);
modules.push(['blob-item-art','item-art.mjs']);
modules.push(['blob-home-computer','home-computer.mjs']);
modules.push(['blob-pickup-feedback','pickup-feedback.mjs']);
modules.push(['blob-preferences','preferences.mjs'],['blob-game-audio','game-audio.mjs']);
modules.push(['blob-home-surroundings','home-surroundings.mjs']);
modules.push(['blob-terrain-color','terrain-color.mjs']);
modules.push(['blob-production-output','production-output.mjs']);
modules.push(['blob-nursery-space','nursery-space.mjs'],['blob-menu-fusion','blob-menu-fusion.mjs']);
modules.push(['blob-ground-art','ground-art.mjs'],['blob-forest-menu','forest-blob-menu.mjs']);
modules.push(['blob-machine-ui','machine-ui.mjs']);
modules.push(['blob-workshop-atmosphere','workshop-atmosphere.mjs']);
const imports={};
for(const [name,file] of modules){
  let source=await readFile(new URL(file,import.meta.url),'utf8');
  for(const [alias,path] of modules)source=source.replaceAll("'./"+path+"'",JSON.stringify(alias));
  imports[name]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');
}
const css=await readFile(new URL('style.css',import.meta.url),'utf8');
const workshopCSS=await readFile(new URL('workshop.css',import.meta.url),'utf8');
const hudCSS=await readFile(new URL('mobile-hud.css',import.meta.url),'utf8');
const html=(await readFile(new URL('index.html',import.meta.url),'utf8'))
  .replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`)
  .replace('<link rel="stylesheet" href="workshop.css">',`<style>${workshopCSS}</style>`)
  .replace('<link rel="stylesheet" href="mobile-hud.css">',`<style>${hudCSS}</style>`)
  .replace('<link rel="stylesheet" href="sunny-ui.css">',`<style>${await readFile(new URL('sunny-ui.css',import.meta.url),'utf8')}</style>`)
  .replace('<link rel="stylesheet" href="world-ui.css">',`<style>${await readFile(new URL('world-ui.css',import.meta.url),'utf8')}</style>`)
  .replace('<link rel="stylesheet" href="expansion.css">',`<style>${await readFile(new URL('expansion.css',import.meta.url),'utf8')}</style>`)
  .replace('<script type="module" src="game.js"></script>',`<script type="importmap">${JSON.stringify({imports})}</script><script type="module">import 'blob-game';</script>`);
await writeFile(new URL(process.argv.includes('--preview')?'Blob-Collector-preview.html':'Blob-Collector.html',import.meta.url),html);
let backdrop='';try{backdrop='data:image/png;base64,'+(await readFile(new URL('assets/hud-world.png',import.meta.url))).toString('base64');}catch{}
const designs=(await readFile(new URL('hud-designs.template.html',import.meta.url),'utf8')).replace('__ART_MODULE__',JSON.stringify(imports['blob-hud-art'])).replace('__HUD_CSS__',JSON.stringify(hudCSS)).replace('__WORLD_IMAGE__',JSON.stringify(backdrop));
await writeFile(new URL('hud-designs.html',import.meta.url),designs);
console.log('Blob-Collector.html erstellt – alle Module einmal eingebettet, offline spielbar.');
