// Jakob 16.11.: Riesen- und Glitzerversionen von Fischen und Faltern.
// Gemeinsame Regeln (Größe, Wert) und das Bild: größer gezeichnet, Glitzerformen mit goldenem Schimmer und funkelnden Sternchen.
export const VARIANTS={big:{prefix:'Riesen-',value:2.2,size:1.5,tank:1.4,jump:1.3,view:1.3,chance:.07},shiny:{prefix:'Glitzer-',value:4,size:1.25,tank:1.2,jump:1.15,view:1.15,chance:.035}};
export const variantKey=(variant,id)=>variant?variant+'_'+id:id;
export const splitVariant=key=>{const m=/^(big|shiny)_(.+)$/.exec(String(key));return m?{variant:m[1],id:m[2]}:null;};
/** Würfelt, ob ein Fang eine besondere Version ist (null, 'big' oder 'shiny'). `roll` liefert 0..1. */
export const rollVariant=(roll,boost=1)=>{const r=roll();return r<VARIANTS.shiny.chance*boost?'shiny':r<(VARIANTS.shiny.chance+VARIANTS.big.chance)*boost?'big':null;};
const STAR=(x,y,r,d)=>`<path d="M${x} ${y-r}Q${x} ${y} ${x+r} ${y}Q${x} ${y} ${x} ${y+r}Q${x} ${y} ${x-r} ${y}Q${x} ${y} ${x} ${y-r}z" fill="#fff6c0" stroke="#f0b840" stroke-width=".6"><animate attributeName="opacity" values="1;.25;1" dur="1.${d}s" repeatCount="indefinite"/></path>`;
/** Nimmt ein fertiges <svg>-Bild und macht es größer bzw. glitzernd. */
export function variantArt(svg,variant){
 const m=/^<svg([^>]*?)viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"([^>]*)>([\s\S]*)<\/svg>$/.exec(svg);if(!m||!VARIANTS[variant])return svg;
 const [,pre,x,y,w,h,post,inner]=m,cx=+x+ +w/2,cy=+y+ +h/2,k=variant==='big'?1.24:1.1,id='vs'+Math.abs([...inner.slice(0,60)].reduce((a,c)=>a*31+c.charCodeAt(0)|0,7))%9973;
 let glow='',stars='';
 if(variant==='shiny'){const r=Math.min(+w,+h)*.5;glow=`<defs><radialGradient id="${id}"><stop offset="0" stop-color="#fff3a0" stop-opacity=".95"/><stop offset=".6" stop-color="#ffd25a" stop-opacity=".45"/><stop offset="1" stop-color="#ffd25a" stop-opacity="0"/></radialGradient></defs><ellipse cx="${cx}" cy="${cy}" rx="${r*1.05}" ry="${r*.8}" fill="url(#${id})"/>`;
  stars=[[.18,.2,4,3],[.82,.16,3,6],[.9,.62,3.4,4],[.12,.7,3,8],[.5,.06,3.6,5]].map(([fx,fy,r2,d])=>STAR(+x+ +w*fx,+y+ +h*fy,r2*1.7*(+w/100),d)).join('');}
 return `<svg${pre}viewBox="${x} ${y} ${w} ${h}"${post} style="overflow:visible">${glow}<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})">${inner}</g>${stars}</svg>`;
}
