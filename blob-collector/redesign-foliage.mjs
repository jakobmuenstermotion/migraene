import * as T from './vendor/three.module.js';

// Neugestaltung: Baumkronen bekommen eine Licht-Schatten-Abstufung wie in Jakobs Vorlagen.
// Oben sonnig gelbgrün, unten tiefes Schattengrün. Nur Instanzfarben; jeweils direkt nach
// worldPalette.set(true) aufrufen, weil die Palette die Originalfarben wiederherstellt.
const CELL = 2.5;
const sun = new T.Color('#c3d64e'), shade = new T.Color('#2c5226');

function isFoliage(mesh) {
  return mesh.isInstancedMesh && mesh.instanceColor && mesh.count > 1000 && mesh.geometry.attributes.position.count <= 12;
}

export function shadeCanopies(root) {
  const matrix = new T.Matrix4(), pos = new T.Vector3(), color = new T.Color();
  let shaded = 0;
  root.traverse(mesh => {
    if (!isFoliage(mesh)) return;
    mesh.updateMatrixWorld(true);
    const ys = new Float32Array(mesh.count), keys = new Array(mesh.count), range = new Map();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      pos.setFromMatrixPosition(matrix).applyMatrix4(mesh.matrixWorld);
      const key = Math.floor(pos.x / CELL) + ',' + Math.floor(pos.z / CELL);
      ys[i] = pos.y; keys[i] = key;
      const r = range.get(key);
      if (r) { r[0] = Math.min(r[0], pos.y); r[1] = Math.max(r[1], pos.y); } else range.set(key, [pos.y, pos.y]);
    }
    for (let i = 0; i < mesh.count; i++) {
      const [lo, hi] = range.get(keys[i]);
      // Bodennahe Blätter (Laub, Unterwuchs) bleiben unverändert.
      if (hi - lo < 1.2 || ys[i] < 1.3) continue;
      const t = (ys[i] - lo) / (hi - lo);
      mesh.getColorAt(i, color);
      color.multiplyScalar(.64 + .52 * t);
      if (t > .62) color.lerp(sun, (t - .62) * .55);
      if (t < .45) color.lerp(shade, (.45 - t) * 1.1);
      mesh.setColorAt(i, color);
    }
    mesh.instanceColor.needsUpdate = true;
    shaded++;
  });
  return shaded;
}
