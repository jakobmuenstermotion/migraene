import {BEDS,WORKSHOPS} from './village-content.mjs';
export const SNAIL_TASKS = {
  workshop: "Werkstatt beliefern",
  sell: "Direkt verkaufen",
  warehouse: "Ins Lager bringen",
  supply: "Lager → feste Werkstatt",
  rest: "Ausruhen",
};
export const SNAIL_NIGHT_LIGHT = 0.68;
export function snailsResting(s) {
  return (
    !!s.journey.asleep ||
    s.journey.round === 0 ||
    (s.journey.light ?? 0) >= SNAIL_NIGHT_LIGHT
  );
}
export function normalizeSnailProfile(raw) {
  return {
    name:
      typeof raw?.name === "string" ? raw.name.trim().slice(0, 24).trim() : "",
    field: Number.isInteger(raw?.field)&&raw.field>=0&&raw.field<BEDS.length?raw.field:null,
    workshop: WORKSHOPS.some(w=>w.id===raw?.workshop)?raw.workshop:null,
    task: Object.hasOwn(SNAIL_TASKS, raw?.task) ? raw.task : "workshop",
  };
}
export function snailProfile(s, index) {
  return normalizeSnailProfile(s.village.snailProfiles?.[index]);
}
export function snailName(s, index) {
  return snailProfile(s, index).name || "Schnecke " + (index + 1);
}
export function setSnailProfile(s, index, profile) {
  if (!Number.isInteger(index) || index < 0 || index >= s.village.snails)
    return false;
  s.village.snailProfiles ??= [];
  while (s.village.snailProfiles.length < s.village.snails)
    s.village.snailProfiles.push(normalizeSnailProfile());
  const normalized=normalizeSnailProfile(profile);
  if(normalized.field!==null&&!s.village.beds[normalized.field])return false;
  if(normalized.workshop!==null&&!s.village.workshops[normalized.workshop]?.level)return false;
  s.village.snailProfiles[index] = normalized;
  return true;
}

// Farm helpers retain their species at their helper index; purchased snails have
// no species entry. Derive provenance so old saves need no speculative counters.
export function purchasedSnailCount(s){const v=s.village;return Math.max(0,v.snails-(v.farm?.helpers??[]).slice(0,v.snails).filter(Boolean).length);}
export function snailPurchaseLimit(s){return Math.min(BEDS.length,s.village.beds.filter(n=>n>0).length);}
export function canBuySnail(s){return s.village.snails<12&&purchasedSnailCount(s)<snailPurchaseLimit(s);}
