import {blobHearts} from './blob-friends.mjs';
import {GARDEN_SPOTS as S} from './nursery-garden.mjs';
import {blobSpecies} from './blob-workers.mjs';
import {canFuse} from './forest-blobs.mjs';
// Leben in der Station (Jakob 31.10.): reine Darstellung. Jede Art hat ihre Persönlichkeit, begrüßt die Figur auf ihre Weise
// und spielt mit anderen. Blobs, die fusionieren könnten, bleiben als Paar zusammen.
const P={
 moss:{spot:S.zones[0],speed:.5,act:'sleep',bubble:'zzz',trait:6,friend:.5,follow:0,hello:'sleep'},
 forest:{spot:S.zones[0],speed:2.1,act:'spin',bubble:'note',trait:1.5,friend:1.5,follow:.2,hello:'peek'},
 tree:{spot:S.zones[0],speed:.8,act:'nuzzle',bubble:'heart',trait:2,friend:3,follow:.5,hello:'nuzzle'},
 sand:{spot:S.zones[1],speed:1,act:'burrow',bubble:'note',trait:3,friend:1,follow:.3,hello:'bounce'},
 tide:{spot:S.pond,speed:1.5,act:'splash',bubble:'note',trait:3,friend:1,follow:.3,hello:'splash'},
 coastal:{spot:S.zones[1],speed:1,act:'wave',bubble:'heart',trait:2,friend:2.5,follow:.5,hello:'wave'},
 snow:{spot:S.zones[2],speed:1.7,act:'roll',bubble:'spark',trait:3,friend:1,follow:.3,hello:'roll'},
 crystal:{spot:S.zones[2],speed:.9,act:'blink',bubble:'spark',trait:3,friend:.5,follow:.4,hello:'blink'},
 mountain:{spot:S.zones[2],speed:.7,act:'nuzzle',bubble:'heart',trait:2,friend:2.5,follow:.4,hello:'nuzzle'},
 ash:{spot:S.zones[3],speed:1,act:'poof',bubble:'spark',trait:3,friend:.8,follow:.3,hello:'poof'},
 lava:{spot:S.zones[3],speed:2,act:'bounce',bubble:'spark',trait:3,friend:1,follow:.8,hello:'bounce'},
 volcanic:{spot:S.zones[3],speed:1.2,act:'bounce',bubble:'heart',trait:2,friend:2,follow:.6,hello:'bounce'},
 storer:{spot:S.storer,speed:1.1,act:'pick',bubble:'note',trait:3,friend:1,follow:.3,hello:'wave'},
 treasure:{spot:S.treasure,speed:1,act:'dig',bubble:'spark',trait:4,friend:.7,follow:.3,hello:'bounce'},
 piler:{spot:S.piler,speed:.9,act:'pick',bubble:'note',trait:3,friend:1,follow:.3,hello:'nuzzle'},
 helper:{spot:S.helper,speed:1.2,act:'hammer',bubble:'note',trait:3,friend:1.5,follow:.5,hello:'wave'},
 portal:{spot:S.pond,speed:.7,act:'blink',bubble:'spark',trait:5,friend:.6,follow:.1,hello:'wave'},
 seller:{spot:S.seller,speed:1.1,act:'sell',bubble:'heart',trait:3,friend:1.2,follow:.8,hello:'sell'}
};
const FLEE=2.4,MEET=2.5;
export class BlobPlay{
 constructor(){this.mem=new Map();this.key='';this.pairs=[];this.partner=new Map();}
 repair(list){const key=list.map(b=>b.id+b.stage+b.species).join();if(key===this.key)return;this.key=key;this.pairs=[];this.partner.clear();const free=[...list];while(free.length){const a=free.shift(),i=free.findIndex(o=>blobSpecies(o)===blobSpecies(a)&&canFuse(a,o));if(i<0)continue;const b=free.splice(i,1)[0],pair={a,b};this.pairs.push(pair);this.partner.set(a.id,{pair,other:b,side:0});this.partner.set(b.id,{pair,other:a,side:1});}}
 update(s,list,room){this.repair(list);const out=new Map(),t=s.time,player=s.player,clamp=(x,z)=>[Math.max(room.x-room.w/2+.8,Math.min(room.x+room.w/2-.8,x)),Math.max(room.z-room.d/2+.9,Math.min(room.z+room.d/2-.9,z))],at=(p,dx=0,dz=0)=>clamp(room.x+p[0]*room.w+dx,room.z+p[1]*room.d+dz),dt=Math.min(.1,Math.max(0,t-(this.time??t)));this.time=t;
  for(const b of list){const sp=blobSpecies(b),p=P[sp]??P.moss;let m=this.mem.get(b.id);if(!m){const [x,z]=at(p.spot,Math.sin(Number(b.id.slice(1))*2.4)*1.6,Math.cos(Number(b.id.slice(1))*2.4)*1.3);m={x,z,mode:'rest',until:0,seed:Number(b.id.slice(1))||1,helloAt:0};this.mem.set(b.id,m);}
   const link=this.partner.get(b.id),dp=Math.hypot(player.x-m.x,player.z-m.z),h=blobHearts(b),meet=MEET+h*.8;let act=null,bubble=null,look=Math.atan2(player.x-m.x,player.z-m.z),speed=p.speed,tx=m.x,tz=m.z;
   if(link){// Paar spielt zusammen: Fangen um einen gemeinsamen Punkt, zwischendurch kuscheln
    const pair=link.pair;pair.cx??=at(P[blobSpecies(pair.a)]?.spot??S.play,Math.sin(m.seed)*1.1,Math.cos(m.seed)*.9);const cycle=(t*.11+pair.a.stage*.3)%1,snug=cycle>.72,angle=t*1.5+link.side*Math.PI,rad=snug?.5:1.05+.2*Math.sin(t*.7);[tx,tz]=clamp(pair.cx[0]+Math.sin(snug?link.side*Math.PI+1.57:angle)*rad,pair.cx[1]+Math.cos(snug?link.side*Math.PI+1.57:angle)*rad);speed=3;const o=this.mem.get(link.other.id);if(o)look=Math.atan2(o.x-m.x,o.z-m.z);act=snug?'nuzzle':'bounce';bubble=snug?'heart':null;pair.x=(m.x+(o?.x??m.x))/2;pair.z=(m.z+(o?.z??m.z))/2;}
   else{
    // Figur kommt näher
    /* Jakob 3.11.: Je mehr Herzen, desto früher bemerkt er dich, desto länger und öfter begrüßt er dich und desto eher läuft er mit.
       0 Herzen: wie seine Art. 3 Herzen: kommt von selbst angelaufen. 5 Herzen: Liebling, bleibt bei dir. */
    if(h>=5&&dp<9&&m.mode!=='hello'&&m.mode!=='buddy'){m.mode='buddy';m.until=t+6;}
    else if(h>=3&&dp<6&&dp>meet&&t>m.helloAt&&!['hello','seek','buddy'].includes(m.mode)&&Math.random()<dt*.25){m.mode='seek';m.until=t+5;}
    if(dp<meet&&t>m.helloAt&&!['hello','buddy'].includes(m.mode)){m.mode='hello';m.until=t+3.2+h*1.2;m.helloAt=t+Math.max(4,14-h*2)+m.seed%5;m.follow=h>=4||Math.random()<Math.min(1,p.follow+h*.15);}
    if(m.mode==='buddy'&&dp<9&&t>m.until)m.until=t+4;
    if(t>m.until&&m.mode!=='sit'){const total=p.trait+p.friend+1.6,roll=Math.random()*total;if(roll<p.trait){m.mode='trait';m.until=t+3+Math.random()*4;const [x,z]=at(p.spot,(Math.random()-.5)*3,(Math.random()-.5)*2.4);m.tx=x;m.tz=z;}else if(roll<p.trait+p.friend&&list.length>1){const near=list.filter(o=>o!==b&&!this.partner.has(o.id));const friend=near[Math.floor(Math.random()*near.length)];if(friend){m.mode='friend';m.friend=friend.id;m.until=t+4+Math.random()*3;}else{m.mode='wander';m.until=t+2.5;}}else{m.mode='wander';m.until=t+2.5+Math.random()*3;const [x,z]=at(p.spot,(Math.random()-.5)*5.4,(Math.random()-.5)*4.2);m.tx=x;m.tz=z;}}
    if(m.mode==='seek'){tx=player.x-(player.x-m.x)/Math.max(.2,dp)*1.4;tz=player.z-(player.z-m.z)/Math.max(.2,dp)*1.4;speed=Math.max(p.speed,2);act=dp<2?'bounce':null;bubble=dp<2.5?'heart':null;if(dp<1.8){m.mode='hello';m.until=t+3+h;m.helloAt=t+Math.max(4,14-h*2);m.follow=h>=4;}}
    else if(m.mode==='buddy'){const side=(m.seed%2?1:-1)*.9,ox=player.x+Math.cos(player.angle)*side-Math.sin(player.angle)*.9,oz=player.z-Math.sin(player.angle)*side-Math.cos(player.angle)*.9;[tx,tz]=clamp(ox,oz);speed=Math.max(p.speed,2.6);const near=Math.hypot(tx-m.x,tz-m.z)<.4;act=near?((t+m.seed)%7<1.2?'spin':'bounce'):null;bubble=(t+m.seed)%5<1.4?'heart':null;}
    else if(m.mode==='hello'){bubble=sp==='moss'&&h<3?'zzz':'heart';act=sp==='moss'&&h>=3?'bounce':p.hello;if(h>=4&&act!=='sleep'&&(t+m.seed)%3<1)act='spin';if(p.hello==='peek'){act=null;if(dp<FLEE){const d=Math.max(.2,dp);[tx,tz]=clamp(m.x-(player.x-m.x)/d*1.6,m.z-(player.z-m.z)/d*1.6);speed=3;}bubble='note';}else if(m.follow&&dp>1.2){tx=m.x+(player.x-m.x)*.5;tz=m.z+(player.z-m.z)*.5;speed=Math.max(p.speed,2.2);}else if(sp==='moss'){act='sleep';speed=0;}else{speed=0;}}
    else if(m.mode==='trait'){tx=m.tx;tz=m.tz;const there=Math.hypot(tx-m.x,tz-m.z)<.3;if(there){act=p.act;bubble=(t+m.seed)%6<2?p.bubble:null;}if(sp==='forest'&&!there)speed=2.4;if(sp==='snow'&&!there)act='roll';look=there?look:undefined;}
    else if(m.mode==='friend'){const o=this.mem.get(m.friend);if(o){const d=Math.hypot(o.x-m.x,o.z-m.z);look=Math.atan2(o.x-m.x,o.z-m.z);if(d>1){tx=o.x;tz=o.z;speed=Math.max(p.speed,1.5);}else{act='nuzzle';bubble=(t+m.seed)%4<1.5?'heart':null;speed=0;}}}
    else{tx=m.tx??m.x;tz=m.tz??m.z;look=undefined;}
   }
   if(b.petUntil>t){act=null;bubble=null;speed=0;look=Math.atan2(player.x-m.x,player.z-m.z);}
   // Laufen
   const dx=tx-m.x,dz=tz-m.z,d=Math.hypot(dx,dz);if(d>.05&&speed>0){const step=Math.min(d,speed*dt);m.x+=dx/d*step;m.z+=dz/d*step;}
   out.set(b.id,{x:m.x,z:m.z,angle:look,act,bubble});}
  // Abstand halten: Blobs schieben sich sanft auseinander, Paare und Kuschelnde dürfen näher.
  const radius=b=>[0,.43,.61,.81,1.03][b.stage]*.72;for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],c=list[j],p=this.mem.get(a.id),q=this.mem.get(c.id);if(!p||!q)continue;let min=radius(a)+radius(c);if(this.partner.get(a.id)?.other===c||p.friend===c.id||q.friend===a.id)min*=.72;let dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);if(d>=min)continue;if(d<.001){dx=1;dz=0;d=1;}const push=Math.min((min-d)/2,dt*2.2);dx/=d;dz/=d;[p.x,p.z]=clamp(p.x-dx*push,p.z-dz*push);[q.x,q.z]=clamp(q.x+dx*push,q.z+dz*push);}
  for(const b of list){const m=this.mem.get(b.id),o=out.get(b.id);if(m&&o){o.x=m.x;o.z=m.z;}}
  return out;}
}
