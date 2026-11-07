import * as T from './vendor/three.module.js';

const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
const smooth=t=>t*t*(3-2*t);
function noise(x,y){const a=Math.floor(x),b=Math.floor(y),u=smooth(x-a),v=smooth(y-b);return T.MathUtils.lerp(T.MathUtils.lerp(hash(a,b),hash(a+1,b),u),T.MathUtils.lerp(hash(a,b+1),hash(a+1,b+1),u),v);}
// Neugestaltung: gemalt wirkende Wiese aus weichen Pinselstrichen auf neutralem Grau.
// Die Textur moduliert die vorhandene Bodenfarbe (0,5 = unverändert), ist kachelbar und rein optisch.
function paintedMeadowTexture(){
 const size=1024,canvas=document.createElement('canvas');canvas.width=canvas.height=size;const g=canvas.getContext('2d'),r=seeded(4471);
 g.fillStyle='rgb(128,128,128)';g.fillRect(0,0,size,size);
 const wrap=(draw)=>{for(const ox of [-size,0,size])for(const oy of [-size,0,size]){g.save();g.translate(ox,oy);draw();g.restore();}};
 const blob=(x,y,rx,ry,rot,color,alpha)=>wrap(()=>{g.save();g.translate(x,y);g.rotate(rot);const grad=g.createRadialGradient(0,0,0,0,0,1);grad.addColorStop(0,`rgba(${color},${alpha})`);grad.addColorStop(1,`rgba(${color},0)`);g.scale(rx,ry);g.fillStyle=grad;g.beginPath();g.arc(0,0,1,0,Math.PI*2);g.fill();g.restore();});
 // Großflächige ruhige Farbfelder in drei Tönen; die Halmstruktur erscheint nur an ihren Übergängen.
 // Die Leinwand erscheint im Spiel vertikal gespiegelt: +y auf der Leinwand zeigt am Bildschirm nach oben.
 const TAU=Math.PI*2,phase=[r(),r(),r(),r(),r()].map(v=>v*TAU);
 // Kachelbares Feld: nur ganzzahlige Frequenzen über die Texturbreite.
 const field=(x,y)=>{const u=x/size*TAU,v=y/size*TAU;return .5+.2*Math.sin(2*u+v+phase[0])+.16*Math.sin(3*v-u+phase[1])+.1*Math.sin(4*u+3*v+phase[2])+.07*Math.sin(5*v-4*u+phase[3])+.05*Math.sin(7*u-2*v+phase[4]);};
 const LOW=.42,HIGH=.6,tone={dark:[117,126,104],mid:[128,132,112],light:[143,149,114]};
 const level=f=>f<LOW?'dark':f<HIGH?'mid':'light';
 const img=g.getImageData(0,0,size,size),px=img.data;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const f=field(x,y),i=(y*size+x)*4;
  // schmale weiche Kante (ca. 2 px), sonst flache Felder
  const a=Math.min(1,Math.max(0,(f-LOW)/.006+.5)),b=Math.min(1,Math.max(0,(f-HIGH)/.006+.5));
  for(let c=0;c<3;c++){const lo=tone.dark[c]+(tone.mid[c]-tone.dark[c])*a;px[i+c]=lo+(tone.light[c]-tone.mid[c])*b;}px[i+3]=255;}
 g.putImageData(img,0,0);
 // Halmbüschel entlang der Feldgrenzen: Blätter der einen Farbe greifen in das Nachbarfeld.
 const near=(x,y,m,draw)=>{for(const ox of [-size,0,size])for(const oy of [-size,0,size]){if(x+ox<-m||x+ox>size+m||y+oy<-m||y+oy>size+m)continue;draw(x+ox,y+oy);}};
 const tufts=[];
 for(let i=0;i<60000&&tufts.length<2600;i++){const x=r()*size,y=r()*size,f=field(x,y);const d=Math.min(Math.abs(f-LOW),Math.abs(f-HIGH));if(d>.018)continue;
  const edge=Math.abs(f-LOW)<Math.abs(f-HIGH)?LOW:HIGH,above=f>=edge,fromLevel=above?(edge===LOW?'mid':'light'):(edge===LOW?'dark':'mid');
  const n=3+Math.floor(r()*4),leaves=[];for(let k=0;k<n;k++)leaves.push({ox:(r()-.5)*14,a:Math.PI/2+(k-(n-1)/2)*.42+(r()-.5)*.3,len:10+r()*10,w:3.5+r()*2.5});tufts.push({x,y,leaves,color:tone[fromLevel]});}
 tufts.sort((p,q)=>q.y-p.y);
 for(const t of tufts)near(t.x,t.y,30,(x,y)=>{const [cr,cg,cb]=t.color;g.fillStyle=`rgb(${cr},${cg},${cb})`;for(const l of t.leaves){const lx=x+l.ox+Math.cos(l.a)*l.len*.5,ly=y+Math.sin(l.a)*l.len*.5;g.beginPath();g.ellipse(lx,ly,l.len*.5,l.w*.5,l.a,0,TAU);g.fill();}});
 const texture=new T.CanvasTexture(canvas);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;texture.colorSpace=T.NoColorSpace;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.userData.painted=true;texture.needsUpdate=true;return texture;
}
export function meadowTexture(){
 if(typeof document!=='undefined')return paintedMeadowTexture();
 const size=256,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  // Periodic broad colour pools and small painted blades; never fake collectibles.
  const broad=.5+.18*Math.sin(x*Math.PI*2/size)+.17*Math.cos(y*Math.PI*4/size)+.1*Math.sin((x+y)*Math.PI*6/size);
  const fine=hash(x,y),moss=.5+.23*Math.sin(x*Math.PI*8/size+Math.sin(y*Math.PI*6/size))+.15*Math.cos(y*Math.PI*10/size),grain=.58+broad*.045+moss*.035+fine*.065,i=(y*size+x)*4;
  data.set([grain*240,grain*255,grain*216,255],i);
 }
 for(let i=0;i<3700;i++){
  const x=Math.floor(hash(i,2)*size),y=Math.floor(hash(i,3)*size),length=2+Math.floor(hash(i,4)*5),bend=hash(i,5)>.5?1:-1,light=hash(i,6)>.45;
  for(let j=0;j<length;j++){const px=(x+Math.round(j*j/length*.28)*bend+size)%size,py=(y-j+size)%size,k=(py*size+px)*4,w=(1-j/length)*.38;for(let c=0;c<3;c++)data[k+c]=data[k+c]*(1-w)+(light?[212,224,162][c]:[115,143,88][c])*w;}
 }
 const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;return texture;
}
export function shadeTexture(){
 const n=128,data=new Uint8Array(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const u=(x-n/2)/(n/2),v=(y-n/2)/(n/2),a=Math.atan2(v,u),r=Math.hypot(u,v),edge=.79+.065*Math.sin(a*7)+.045*Math.cos(a*11),core=Math.max(0,Math.min(1,(edge-r)/.31)),dapple=.32+.68*noise(x/7,y/7),i=(y*n+x)*4;data.set([255,255,255,Math.round(core*core*dapple*180)],i);}
 const t=new T.DataTexture(data,n,n);t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export function cozyLeafGeometry(){
 // A folded broad leaf: rounded shoulders, tapered tip and a raised midrib.
 const g=new T.BufferGeometry(),p=[0,.055,0,0,0,-.5,-.22,0,-.31,-.34,-.012,0,-.24,0,.3,0,.025,.5,.24,0,.3,.34,-.012,0,.22,0,-.31];
 for(let i=0;i<p.length;i+=3){p[i]*=1.18;p[i+2]*=1.1;}g.setAttribute('position',new T.Float32BufferAttribute(p,3));const indices=[];for(let i=1;i<=8;i++)indices.push(0,i,i===8?1:i+1);g.setIndex(indices);g.computeVertexNormals();const colors=[];for(let i=0;i<9;i++){const value=i===0?1.08:i%2?.9:1;colors.push(value,value,value);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeBoundingSphere();return g;
}
export function grassSprayGeometry(){
 const positions=[],colors=[];
 for(let j=0;j<5;j++){const a=j*2.399,h=.16+(j%3)*.075,w=.025+(j%2)*.008,dx=Math.sin(a),dz=Math.cos(a),bx=dx*.065,bz=dz*.065;positions.push(bx-dz*w,0,bz+dx*w,bx+dz*w,0,bz-dx*w,bx+dx*.09,h*.65,bz+dz*.09,bx+dz*w,0,bz-dx*w,bx+dx*.14,h,bz+dz*.14,bx+dx*.09,h*.65,bz+dz*.09);for(let k=0;k<6;k++){const t=k===4?1.15:.85;colors.push(t,t,t);}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function seeded(seed=90117){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function autumnLeafGeometry(){
 const outline=[[0,.34],[-.065,.18],[-.20,.24],[-.16,.06],[-.27,.045],[-.14,-.06],[-.17,-.19],[-.035,-.16],[0,-.23],[.035,-.16],[.17,-.19],[.14,-.06],[.27,.045],[.16,.06],[.20,.24],[.065,.18]],positions=[0,.035,.015],colors=[1.06,1.06,1.06],indices=[];
 for(let i=0;i<outline.length;i++){const [x,z]=outline[i];positions.push(x,i%2?.005:0,z);const tint=i%2?.9:.98;colors.push(tint,tint,tint);indices.push(0,i+1,i+1===outline.length?1:i+2);}
 const start=positions.length/3;positions.push(-.012,.002,-.34,.012,.002,-.34,-.012,.008,-.16,.012,.008,-.16);for(let i=0;i<4;i++)colors.push(.48,.39,.24);indices.push(start,start+2,start+1,start+1,start+2,start+3);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
