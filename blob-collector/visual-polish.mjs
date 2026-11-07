import * as T from './vendor/three.module.js';

const hueScratch = {};
// Neugestaltung: kühleres Blaugrau für Felsen wie in den Referenzbildern.
const rockTint = new T.Color('#7f8896');
const fillTint = new T.Color('#dbe9ef');
const groundTint = new T.Color('#758353');
const sunTint = new T.Color('#fff1cf');

// Phase 1 only: colours and existing light/shadow settings. Geometry is untouched.
export function polishColor(source, target = new T.Color()) {
  target.copy(source);
  const hsl = hueScratch;
  source.getHSL(hsl);
  // Neugestaltung: sattere, wärmere Grüntöne mit mehr Tiefe statt blasser Pastellfarben.
  if (hsl.h > .17 && hsl.h < .48 && hsl.s > .15) {
    const light = T.MathUtils.smoothstep(hsl.l, .3, .6);
    const hue = hsl.h + (.245 - hsl.h) * (.18 + light * .22);
    target.setHSL(hue, Math.min(.82, hsl.s * 1.28 + .04), Math.min(.8, hsl.l * (.86 + light * .12)));
  } else if (hsl.s < .18 && hsl.l > .12 && hsl.l < .82) {
    target.lerp(rockTint, .32).multiplyScalar(.97);
  } else if (hsl.h > .035 && hsl.h < .15 && hsl.s > .18 && hsl.s < .85 && hsl.l < .8) {
    target.setHSL(hsl.h * .97, Math.min(.85, hsl.s * 1.14), Math.min(.8, hsl.l * 1.01));
  }
  return target;
}

export class PolishPalette {
  constructor(roots) {
    this.roots = roots;
    this.attributes = new Map();
    this.materials = new Map();
    this.active = false;
    this.backupBytes = 0;
  }

  capture() {
    const saveAttribute = attribute => {
      if (!attribute || this.attributes.has(attribute)) return;
      const original = attribute.array.slice();
      this.attributes.set(attribute, original);
      this.backupBytes += original.byteLength;
    };
    for (const root of this.roots) root.traverse(object => {
      if (!object.isMesh) return;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material?.color || !(material.isMeshStandardMaterial || material.isMeshLambertMaterial)) continue;
        if (!this.materials.has(material)) this.materials.set(material, material.color.clone());
      }
      saveAttribute(object.geometry?.getAttribute('color'));
      saveAttribute(object.instanceColor);
    });
  }

  set(enabled) {
    if (this.active === enabled) return;
    if (enabled && !this.materials.size) this.capture();
    const color = new T.Color(), result = new T.Color();
    for (const [attribute, original] of this.attributes) {
      attribute.array.set(original);
      if (enabled) for (let i = 0; i < attribute.count; i++) {
        color.setRGB(attribute.getX(i), attribute.getY(i), attribute.getZ(i));
        polishColor(color, result);
        attribute.setXYZ(i, result.r, result.g, result.b);
      }
      attribute.needsUpdate = true;
    }
    for (const [material, original] of this.materials) {
      if (enabled) polishColor(original, material.color);
      else material.color.copy(original);
    }
    this.active = enabled;
  }

  release() {
    this.set(false);
    this.attributes.clear();
    this.materials.clear();
    this.backupBytes = 0;
  }
}

export function applyPolishLight(daylight, renderer, enabled, night = 0, phase = 0) {
  renderer.toneMappingExposure = enabled ? 1.08 : 1.05;
  daylight.sun.shadow.intensity = enabled ? .70 : 1;
  if (!enabled) return;
  const day = 1 - night;
  const sunset = T.MathUtils.smoothstep(phase, .26, .5);
  daylight.ambient.intensity *= .94 - .08 * day;
  daylight.sun.intensity *= 1.0 + .08 * day;
  daylight.ambient.color.lerp(fillTint, .8 * day);
  daylight.ambient.groundColor.lerp(groundTint, .55 * day);
  daylight.sun.color.lerp(sunTint, .75 * day * (1 - sunset));
  applyRedesignLight(daylight, renderer, day);
}

// Neugestaltung: weniger flaches Umgebungslicht, kräftigere warme Sonne und
// tiefere Schatten. Nur Licht und Farbe, keine Geometrie oder Spielwerte.
const redesignSun = new T.Color('#ffcf8a');
const redesignSky = new T.Color('#d2dcb6');
const redesignGround = new T.Color('#5a6634');
function applyRedesignLight(daylight, renderer, day) {
  // Neutral-Tonemapping (game.js) hält die Farben satter als ACES.
  renderer.toneMappingExposure = 1.16;
  daylight.sun.shadow.intensity = .7 + .25 * day;
  daylight.ambient.intensity *= 1 - .52 * day;
  daylight.sun.intensity *= 1 + .34 * day;
  daylight.sun.color.lerp(redesignSun, .45 * day);
  daylight.ambient.color.lerp(redesignSky, .55 * day);
  daylight.ambient.groundColor.lerp(redesignGround, .6 * day);
}
