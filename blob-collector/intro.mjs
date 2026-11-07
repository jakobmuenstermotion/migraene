import {HOME_ROOM,HOME_FITTINGS,inHome} from './home-space.mjs';
import {factoryState} from './factory.mjs';
import {SUNNY,inServiceZone} from './sunny-area.mjs';
import {MARKET} from './market.mjs';
import {homeFurniture} from './rounds.mjs';
// Neuer Spielstart (Jakob 6.11.): Man hat noch keinen Sauger. Die ersten Blätter sammelt man von Hand, bis die Figur nach 20 Blättern
// sagt, dass das zu lange dauert. Am Hauscomputer kauft man dann Bodensauger und Ladestation für 50 Blätter. Danach führt die Figur in
// Sprechblasen Schritt für Schritt weiter: Ladestation, Saugen, Verkaufsstand, Schlafen, Pinnwand, Lager. Alles Weitere erklärt sich
// einmalig, sobald man es zum ersten Mal hat. Nur für neue Spiele; bestehende Stände haben kein s.intro.
// Jakob 7.11.: Der Satz kommt erst nach 40 Blättern; Ladestation mit Sauger kostet 100 Blätter (charger-building.mjs) und wird frei im Haus aufgestellt.
export const INTRO={handLeaves:40,price:{leaf:100},suckLeaves:30};
export const INTRO_STEPS=['wake','leaves','computer','charger','suck','market','sleep','board','storage','done'];
const BOARD={x:-14.2,z:-8.2};
export const COMPUTER_POS=()=>({x:HOME_ROOM.x+2.9,z:HOME_ROOM.z-3.7});
export const CHARGER_POS=(s)=>{for(const [id,p] of Object.entries(s?.placements??{}))if(id.startsWith('charger_'))return p;const f=HOME_FITTINGS.find(f=>f.id==='charger');return {x:HOME_ROOM.x+f.x,z:HOME_ROOM.z+f.z};};
const chargerStanding=s=>Object.keys(s.placements??{}).some(id=>id.startsWith('charger_'));
export function startIntro(s){s.intro={step:'wake',hand:0};factoryState(s).owned=[];s.suctionEnabled=false;if(s.round){s.round.tutorial=7;s.round.marketExplained=true;}}
export const introOn=s=>Boolean(s.intro&&s.intro.step!=='done');
// Noch kein Sauger gekauft: Der Saugerknopf ist die Hand, Saugen und Laden gehen nicht.
export const noVacuum=s=>Boolean(s.intro&&!s.builtSites?.introVacuum);
export function grantStarter(s){const f=factoryState(s);if(!f.owned.includes('ground'))f.owned.unshift('ground');s.vacuumId='ground';const now=Date.now(),max=s.battery.max;s.battery.charge=max;s.charging={from:max,bankCells:[...(s.batteryBank?.cells??[max])],startedAt:now,endsAt:now,ready:true};}
export function countHandLeaf(s){if(s.intro)s.intro.hand=(s.intro.hand??0)+1;}
const near=(s,p,r)=>Math.hypot(s.player.x-p.x,s.player.z-p.z)<r;
const stockCount=s=>Object.values(s.market?.stock??{}).reduce((a,b)=>a+(b>0?b:0),0);
// Schritt weiterschalten, sobald die Aufgabe erledigt ist.
export function updateIntro(s){const i=s.intro;if(!i||i.step==='done')return;const go=step=>{i.step=step;};
 switch(i.step){
  case 'wake':if(!s.round?.waking)go('leaves');break;
  case 'leaves':if((i.hand??0)>=INTRO.handLeaves)go('computer');break;
  case 'computer':if(s.builtSites?.introVacuum&&chargerStanding(s))go('charger');break;
  case 'charger':if(!s.charging)go('suck');break;
  case 'suck':if((Number(s.stats?.leaf)||0)>=INTRO.suckLeaves)go('market');break;
  case 'market':if(stockCount(s)>0)go('sleep');break;
  case 'sleep':if((s.round?.day??1)>=2&&!s.round?.waking)go('board');break;
  case 'board':if(!inHome(s)&&near(s,BOARD,3.2))go('storage');break;
  case 'storage':if(inServiceZone(s,'storage'))go('done');break;
 }}
// Kamera-Ziel je Schritt (für die Sprechblase dieses Schritts).
export function introFocus(s,step){if(step==='computer')return COMPUTER_POS();if(step==='charger')return CHARGER_POS(s);if(step==='market')return {x:MARKET.x,z:MARKET.z};if(step==='sleep')return homeFurniture(s,'bed')??null;if(step==='board')return BOARD;if(step==='storage')return SUNNY.storage;return null;}
export const introSnapshot=s=>s.intro?{step:s.intro.step,hand:s.intro.hand??0}:null;
export function restoreIntro(s,d){s.intro=d&&INTRO_STEPS.includes(d.step)?{step:d.step,hand:Math.max(0,Math.floor(Number(d.hand)||0))}:undefined;}
