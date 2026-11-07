import {removeMaterial} from './inventory.mjs';
import {blobHearts} from './blob-friends.mjs';
// Herd (Jakob 3.11., alle Zahlen Testwerte): Mahlzeiten für dich (schneller laufen), Snacks für Blobs (mehr Zuneigung)
// und ein seltener Blob-Köder, der einen wilden Blob in deine Nähe lockt.
export const MEALS={
 mushroompan:{name:'Pilzpfanne',speed:.12,seconds:180},
 grilledfish:{name:'Gebratener Fisch',speed:.18,seconds:240},
 fishstew:{name:'Fischeintopf',speed:.25,seconds:360}
};
export const SNACKS={blobcookie:{name:'Blobkeks',friend:2},fishbite:{name:'Fischhäppchen',friend:4}};
export const SNACK_RULES={perDay:3};
export const BAIT={id:'blobbait',name:'Blob-Köder'};
export const STOVE_RECIPES={
 mushroompan:{inputs:{mushroom:6,moss:2},seconds:20},
 grilledfish:{inputs:{seebluemchen:1,wood:3},seconds:25},
 fishstew:{inputs:{bachflosse:1,mushroom:4,essence:1},seconds:40},
 blobcookie:{inputs:{commonflower:10,paper:1},seconds:15},
 fishbite:{inputs:{bachflosse:1,moss:4},seconds:20},
 blobbait:{inputs:{waldcoin:1,amber:1,rareflower:2,essence:1},seconds:60}
};
export const FOOD_NAMES=Object.fromEntries([...Object.entries(MEALS),...Object.entries(SNACKS)].map(([id,a])=>[id,a.name]).concat([[BAIT.id,BAIT.name]]));

// Eine Mahlzeit auf einmal; eine neue ersetzt die alte, wenn sie stärker ist oder die alte fast vorbei ist.
export function eatMeal(s,id){const m=MEALS[id];if(!m||!removeMaterial(s,id,1))return false;s.mealBoost={id,speed:m.speed,until:s.time+m.seconds};s.events?.push('eat');return true;}
export function mealSpeed(s){const b=s.mealBoost;return b&&s.time<b.until?1+b.speed:1;}
export const mealLeft=s=>s.mealBoost&&s.time<s.mealBoost.until?s.mealBoost.until-s.time:0;
export const snackInBag=s=>Object.keys(SNACKS).sort((a,b)=>SNACKS[b].friend-SNACKS[a].friend).find(k=>(s.inventory.bag[k]??0)>0)??null;

// Füttern: wie Streicheln, aber mehr Zuneigung; höchstens drei Snacks je Blob und Tag.
export function feedBlob(s,b){const id=snackInBag(s);if(!b||!id)return false;const day=s.round?.day??1;if(b.snackDay!==day){b.snackDay=day;b.snacksToday=0;}if(b.snacksToday>=SNACK_RULES.perDay)return false;if(!removeMaterial(s,id,1))return false;b.snacksToday++;const before=blobHearts(b);b.friend=Math.min(100,(b.friend??0)+SNACKS[id].friend);b.petUntil=s.time+2.4;b.emoteUntil=0;s.events?.push(blobHearts(b)>before?'caught':'eat');return true;}
export const canFeed=(s,b)=>Boolean(b&&snackInBag(s)&&!(b.snackDay===(s.round?.day??1)&&b.snacksToday>=SNACK_RULES.perDay));
