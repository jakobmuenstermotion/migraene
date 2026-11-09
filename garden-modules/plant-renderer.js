((G)=>{
const ns='http://www.w3.org/2000/svg';
function create({plants}){
 const catalog=new Map(plants.map(p=>[p.id,p]));let serial=0;
 function node(tag,attrs={},parent){const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);parent?.append(n);return n}
 // Jakob 9.11.: Bildausschnitt eng um die ausgewachsene Pflanze – so füllt sie den Knopf, frühere Stufen wachsen in diesen Platz hinein.
 function bounds(m){if(m._bounds)return m._bounds;const part=m.stages[m.stages.length-1],asset=m.assets[part.asset],s=part.scale??1,[x,y]=part.root,ox=m.target[0]-x*s,oy=m.target[1]-y*s,r=part.crop??[0,0,asset.width,asset.height];let x0=ox+r[0]*s,y0=oy+r[1]*s,x1=ox+r[2]*s,y1=oy+r[3]*s;x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(m.frame[0],x1);y1=Math.min(m.frame[1],y1);const pad=(x1-x0)*.04;return m._bounds=[x0-pad,y0-pad,x1-x0+pad*2,y1-y0+pad];}
 function art(id,requested){
  const m=catalog.get(id);if(!m)return null;const stage=Math.max(1,Math.min(m.stages.length,requested)),part=m.stages[stage-1],asset=m.assets[part.asset],[x,y]=part.root,s=part.scale??1;
  const svg=node('svg',{viewBox:bounds(m).join(' '),preserveAspectRatio:m.hanging?'xMaxYMin meet':'xMaxYMax meet',class:'plant-art'+(m.hanging?' hanging':''),'aria-hidden':'true'});svg.dataset.plant=id;svg.dataset.stage=String(stage);
  const paint=node('g',{transform:'translate('+(m.target[0]-x*s)+' '+(m.target[1]-y*s)+') scale('+s+')'},svg);let layer=paint;
  if(part.crop){const clip='garden-clip-'+(++serial),r=part.crop,defs=node('defs',{},svg),cp=node('clipPath',{id:clip},defs);node('rect',{x:r[0],y:r[1],width:r[2]-r[0],height:r[3]-r[1]},cp);layer=node('g',{'clip-path':'url(#'+clip+')'},paint)}
  node('image',{href:asset.file,width:asset.width,height:asset.height},layer);return svg;
 }
 function pivot(svg,id){const m=catalog.get(id);if(!m)return;const b=bounds(m),w=svg.clientWidth,h=svg.clientHeight,s=Math.min(w/b[2],h/b[3]);svg.style.transformOrigin=m.hanging?'100% 0':(w-b[2]*s+(m.target[0]-b[0])*s)+'px '+h+'px'}
 function preview(id){const m=catalog.get(id),svg=art(id,m.preview?.stage??1);if(m.preview?.viewBox)svg.setAttribute('viewBox',m.preview.viewBox.join(' '));svg.setAttribute('preserveAspectRatio','xMidYMid meet');return svg}
 function mount(place,plant){
  if(!plant||!catalog.has(plant.id)){place.replaceChildren();return}let svg=place.querySelector('svg');const stage=Math.min(plant.stage,catalog.get(plant.id).stages.length);
  if(!svg||svg.dataset.plant!==plant.id){svg=art(plant.id,stage);place.replaceChildren(svg)}else if(Number(svg.dataset.stage)!==stage){const next=art(plant.id,stage);svg.replaceChildren(...next.childNodes);svg.dataset.stage=String(stage);svg.querySelector('g')?.classList.add('new-stage')}
  pivot(svg,plant.id);
 }
 return{art,preview,mount,pivot};
}
G.PlantRenderer={create};
})(window.GardenPrototype=window.GardenPrototype||{});
