// Visual traits only: species share the same work and growth rules.
export const SNAIL_LOOKS = {
  garden: { pattern: "freckles", ink: "#76533d", shape: [0.53, 0.56, 0.46] },
  dew: { pattern: "drops", ink: "#e4fbf2", shape: [0.61, 0.44, 0.51] },
  lavender: { pattern: "stripes", ink: "#704c92", shape: [0.44, 0.67, 0.42] },
  honey: { pattern: "bands", ink: "#9d6425", shape: [0.57, 0.52, 0.47] },
  moss: { pattern: "leaves", ink: "#355c38", shape: [0.63, 0.43, 0.52] },
  coral: { pattern: "waves", ink: "#a65763", shape: [0.49, 0.63, 0.43] },
  moon: { pattern: "moons", ink: "#65718f", shape: [0.59, 0.53, 0.47] },
  apple: { pattern: "apples", ink: "#bc6555", shape: [0.57, 0.59, 0.49] },
  amber: { pattern: "diamonds", ink: "#81552e", shape: [0.45, 0.7, 0.43] },
  star: { pattern: "stars", ink: "#fff0b2", shape: [0.51, 0.63, 0.46] },
};
export const FARM_PLACES = {
  kitchen: [7.7, 2.8],
  input: [5.1, 2.8],
  output: [10.3, 2.8],
  visit: [0, 3.4],
};
// A gentle circuit: doorstep, cave, climbing branch, hill, shallow bath, flowers.
const stops = [
  [-2.6, -1.55, 0, "home"],
  [-2.35, 0.2, 0.06, "cave"],
  [-0.7, -0.7, 0.24, "climb"],
  [1.05, -0.2, 0.3, "hill"],
  [2.65, 1.1, -0.06, "bath"],
  [-0.4, 1.5, 0, "flowers"],
];
export function nurseryPose(index, id, clock, progress) {
  const phase = (((clock + id * 13.7) % 120) + 120) % 120,
    segment = Math.floor(phase / 20),
    t = phase % 20;
  const a = stops[segment],
    b = stops[(segment + 1) % stops.length],
    u = Math.max(0, Math.min(1, (t - 6) / 14)),
    ease = u * u * (3 - 2 * u);
  const offset = ((index % 3) - 1) * 0.16;
  return {
    x: a[0] + (b[0] - a[0]) * ease + offset,
    z: a[1] + (b[1] - a[1]) * ease,
    y: a[2] + (b[2] - a[2]) * ease,
    angle: Math.atan2(b[0] - a[0], b[1] - a[1]),
    scale: 0.3 + 0.35 * Math.max(0, Math.min(1, progress)),
    activity: t < 6 ? a[3] : "explore",
  };
}
