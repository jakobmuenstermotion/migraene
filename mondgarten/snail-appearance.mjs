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
export function nurseryPose(index, id, clock, progress) {
  const phase = clock * 0.32 + id * 2.399963;
  return {
    x: ((index % 3) - 1) * 1.45 + Math.cos(phase) * 0.32,
    z: (index < 3 ? -0.86 : 0.86) + Math.sin(phase) * 0.27,
    angle: Math.atan2(-Math.sin(phase) * 0.32, Math.cos(phase) * 0.27),
    scale: 0.3 + 0.35 * Math.max(0, Math.min(1, progress)),
  };
}
