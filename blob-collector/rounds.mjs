import {morningGifts} from './blob-friends.mjs';
import {blobGroup,blobTitle} from './forest-blob-config.mjs';
import {fillBatteryBank} from './battery-bank.mjs';
import {HOME_ROOM,inHome,homeRegion} from './home-space.mjs';
import {placeableType} from './crafting-config.mjs';
import {settleMarket} from './market.mjs';
import {nightShift} from './crafting.mjs';
import {pressNightShift} from './material-press.mjs';
import {applyBatteryCapacity} from './equipment.mjs';

export function createRound(legacy=false){return {day:1,startedAt:0,waking:!legacy,guideVersion:2,tutorial:legacy?7:0,marketExplained:legacy,lastSale:null};}
export function homeFurniture(s,type){return Object.entries(s.placements??{}).find(([id,p])=>placeableType(id)===type&&homeRegion(p.x,p.z))?.[1];}
export function furnitureNearby(s,type,radius=2.4){const p=homeFurniture(s,type);return inHome(s)&&!!p&&Math.hypot(s.player.x-p.x,s.player.z-p.z)<radius;}
export function bedStart(s){const bed=homeFurniture(s,'bed');if(!bed)return false;s.home.interior=true;s.nursery.interior=false;s.round??=createRound();s.round.waking=true;s.roundActive=false;Object.assign(s.player,{x:bed.x,y:HOME_ROOM.floor+.9,z:bed.z,angle:bed.rotation??0,moving:false,sprinting:false});s.flight.active=false;s.anchorPull=null;s.flight.safe={...s.player};return true;}
export function wakeUp(s){if(!s.round?.waking)return false;const bed=homeFurniture(s,'bed');if(bed){const r=bed.rotation??0;Object.assign(s.player,{x:bed.x+Math.cos(r)*1.6,z:bed.z-Math.sin(r)*1.6,y:HOME_ROOM.floor});}s.round.waking=false;s.roundActive=true;s.flight.safe={...s.player};return true;}
export function sleepUntilMorning(s){if(!furnitureNearby(s,'bed',2.8)||s.round?.waking||s.anchorPull||s.flight.active||s.pullingLeaves?.length||s.resources?.some(r=>r.status==='pulling'))return false;const result=settleMarket(s);nightShift(s);pressNightShift(s);s.round??=createRound(true);s.round.lastSale=result;s.round.gifts=morningGifts(s,b=>blobGroup(b.species),blobTitle);s.round.day++;s.round.startedAt=s.time;s.daylightOffset=-s.time;const docked=Boolean(s.charging);s.charging=null;applyBatteryCapacity(s);fillBatteryBank(s);/* Jakob 1.11.: Stand der Sauger an der Station, wartet er dort auch morgens */if(docked){const now=Date.now();s.charging={from:s.battery.max,bankCells:[...(s.batteryBank?.cells??[s.battery.max])],startedAt:now,endsAt:now,ready:true};}s.player.stamina=100;s.suctionEnabled=false;s.worldWind.next=s.worldWind.clock+150;
 // Keep the existing rarity limit, now measured against real player-started days.
 if(s.forestBlobs){s.forestBlobs.daySpawned=false;s.forestBlobs.playSeconds=0;}
 return bedStart(s);}
export function restoreRound(s,data){const r=data?.round;s.round=createRound(!r);if(r){s.round.day=Math.max(1,Math.floor(Number(r.day)||1));s.round.waking=!!r.waking;s.round.tutorial=Math.max(0,Math.min(7,Math.floor(Number(r.tutorial)||0)));if(r.guideVersion!==2&&s.round.tutorial>=3)s.round.tutorial++;s.round.marketExplained=!!r.marketExplained;s.round.lastSale=r.lastSale&&Number.isFinite(r.lastSale.coins)?{coins:Math.max(0,r.lastSale.coins),count:Math.max(0,Math.floor(r.lastSale.count)||0)}:null;}const elapsed=Math.max(0,Number(r?.elapsed)||0);s.round.startedAt=s.time-elapsed;s.daylightOffset=-s.round.startedAt;s.roundActive=!s.round.waking;}
