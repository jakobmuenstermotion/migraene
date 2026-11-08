// Jakob 8.11.: Viele Anzeigen setzen in jedem Bild dieselben Werte neu (hidden, aria-*, disabled …).
// Jeder Schreibvorgang kann auf dem iPhone eine Stil-Neuberechnung auslösen. Hier werden gleiche Werte einfach übersprungen.
if(typeof HTMLElement!=='undefined'&&!globalThis.__domGuard){
 globalThis.__domGuard=true;
 const hidden=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'hidden');
 if(hidden?.set)Object.defineProperty(HTMLElement.prototype,'hidden',{...hidden,set(v){if(typeof v==='boolean'||v==null){if(this.hasAttribute('hidden')===Boolean(v))return;}hidden.set.call(this,v);}});
 const set=Element.prototype.setAttribute,skip=new Set(['src','value','href','srcdoc','data']);
 Element.prototype.setAttribute=function(name,value){if(!skip.has(name)&&this.getAttribute(name)===String(value))return;return set.call(this,name,value);};
 const disabled=Object.getOwnPropertyDescriptor(HTMLButtonElement.prototype,'disabled');
 if(disabled?.set)Object.defineProperty(HTMLButtonElement.prototype,'disabled',{...disabled,set(v){if(this.hasAttribute('disabled')===Boolean(v))return;disabled.set.call(this,v);}});
}
