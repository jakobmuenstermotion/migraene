export const SNAIL_TASKS = {
  workshop: "Werkstatt beliefern",
  sell: "Direkt verkaufen",
  warehouse: "Ins Lager bringen",
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
  s.village.snailProfiles[index] = normalizeSnailProfile(profile);
  return true;
}
