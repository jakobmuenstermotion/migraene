import * as T from './vendor/three.module.js';

// Neugestaltung der Sauger: emaillierte Körper, Messingringe, Holzgriffe und ein gerippter Schlauch.
// Nur Darstellung. Die Ansaugöffnung liegt wie zuvor bei z=.204 im Düsenraum (game.js liest diesen Punkt).
const MOUTH_Z = .204;
const shared = new Map();
function material(key, make) { if (!shared.has(key)) shared.set(key, make()); return shared.get(key); }
const brass = () => material('brass', () => new T.MeshStandardMaterial({ color: '#d6a24f', roughness: .32, metalness: .55 }));
const dark = style => material('dark' + style, () => new T.MeshStandardMaterial({ color: style === 'black-hole' ? '#1c1030' : '#1f2b28', roughness: .55 }));
const wood = () => material('wood', () => new T.MeshStandardMaterial({ color: '#9a6a3c', roughness: .7 }));
const rubber = () => material('rubber', () => new T.MeshStandardMaterial({ color: '#33403c', roughness: .8 }));
const cream = () => material('cream', () => new T.MeshStandardMaterial({ color: '#efe3c4', roughness: .55 }));
const glow = color => material('glow' + color, () => new T.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .9, roughness: .3 }));
const enamel = color => material('enamel' + color, () => new T.MeshStandardMaterial({ color, roughness: .42, metalness: .08 }));

// Glockenförmige Düse entlang +z, Öffnung genau bei z=0 der Gruppe.
function bellGeometry(mouth, neck, length) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, r = neck + (mouth - neck) * Math.pow(t, 1.25);
    pts.push(new T.Vector2(r, -length + t * length));
  }
  const g = new T.LatheGeometry(pts, 20);
  g.rotateX(Math.PI / 2);
  return g;
}

function port(root, body, style, x = 0, scale = 1, angle = 0) {
  const g = new T.Group();
  g.position.set(x, 0, MOUTH_Z);
  g.rotation.y = angle;
  g.scale.setScalar(scale);
  root.add(g);
  const bell = new T.Mesh(bellGeometry(.25, .14, .42), body);
  bell.material.side = T.DoubleSide;
  g.add(bell);
  const lip = new T.Mesh(new T.TorusGeometry(.25, .035, 8, 28), brass());
  g.add(lip);
  const inner = new T.Mesh(new T.CircleGeometry(.23, 24), dark(style));
  inner.position.z = -.06;
  g.add(inner);
  for (const z of [-.3, -.36]) {
    const rib = new T.Mesh(new T.TorusGeometry(.13, .022, 6, 20), brass());
    rib.position.z = z;
    g.add(rib);
  }
  const collar = new T.Mesh(new T.CylinderGeometry(.115, .125, .12, 14), rubber());
  collar.rotation.x = Math.PI / 2;
  collar.position.z = -.47;
  g.add(collar);
  return g;
}

function add(root, geometry, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new T.Mesh(geometry, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  root.add(m);
  return m;
}

export function makeVacuumTool(mode) {
  const root = new T.Group(), spins = [];
  root.userData.spins = spins;
  const body = enamel(mode.color);
  switch (mode.style) {
    case 'floor': {
      // Breiter Bodenkopf mit Bürstenleiste, Rädern und Messingkante.
      const head = add(root, new T.CapsuleGeometry(.1, .52, 4, 12), body, 0, 0, .08, 0, 0, Math.PI / 2);
      head.scale.set(1, 1, 1.5);
      add(root, new T.BoxGeometry(.66, .05, .08), dark(mode.style), 0, -.06, .2);
      add(root, new T.BoxGeometry(.7, .022, .03), brass(), 0, .02, .225);
      for (let i = 0; i < 11; i++) add(root, new T.BoxGeometry(.035, .05, .02), cream(), -.3 + i * .06, -.085, .21);
      for (const x of [-.34, .34]) {
        add(root, new T.CylinderGeometry(.075, .075, .06, 14), rubber(), x, -.04, -.04, 0, 0, Math.PI / 2);
        add(root, new T.CylinderGeometry(.035, .035, .07, 10), brass(), x, -.04, -.04, 0, 0, Math.PI / 2);
      }
      add(root, new T.CylinderGeometry(.06, .075, .2, 12), rubber(), 0, .12, -.08, -.5);
      add(root, new T.TorusGeometry(.07, .018, 6, 16), brass(), 0, .07, -.05, Math.PI / 2 - .5);
      break;
    }
    case 'fan': {
      // Drei Trichter an einem Holzjoch.
      port(root, body, mode.style, -.28, .62, -.35);
      port(root, body, mode.style, 0, .78);
      port(root, body, mode.style, .28, .62, .35);
      add(root, new T.BoxGeometry(.7, .07, .09), wood(), 0, 0, -.16);
      for (const x of [-.36, .36]) add(root, new T.SphereGeometry(.05, 10, 8), brass(), x, 0, -.16);
      break;
    }
    case 'vortex': {
      port(root, body, mode.style, 0, 1);
      const ring = add(root, new T.TorusGeometry(.33, .026, 8, 36), brass(), 0, 0, .12);
      const ring2 = add(root, new T.TorusGeometry(.27, .018, 6, 32), glow(mode.color), 0, 0, .06);
      spins.push(ring, ring2);
      add(root, new T.SphereGeometry(.06, 12, 10), glow(mode.color), 0, 0, -.02);
      break;
    }
    case 'focus': {
      // Schlanke Präzisionslanze mit Messingringen und leuchtender Linse.
      port(root, body, mode.style, 0, .6);
      add(root, new T.CylinderGeometry(.075, .1, .5, 14), body, 0, 0, -.18, Math.PI / 2);
      for (const z of [-.02, -.18, -.34]) add(root, new T.TorusGeometry(.095, .016, 6, 18), brass(), 0, 0, z);
      add(root, new T.CylinderGeometry(.035, .035, .16, 10), wood(), 0, .12, -.2, Math.PI / 2);
      add(root, new T.SphereGeometry(.04, 12, 10), glow('#8ff0ff'), 0, .12, -.1);
      break;
    }
    case 'power': {
      // Schwere Düse mit Motorblock, Lüftungsschlitzen und Messingkolben.
      port(root, body, mode.style, 0, 1.12);
      add(root, new T.BoxGeometry(.46, .32, .26), body, 0, 0, -.34);
      for (let i = 0; i < 4; i++) add(root, new T.BoxGeometry(.3, .03, .27), dark(mode.style), 0, -.09 + i * .06, -.34);
      for (const x of [-.25, .25]) {
        add(root, new T.CylinderGeometry(.045, .045, .46, 10), brass(), x, .06, -.14, Math.PI / 2);
        add(root, new T.CylinderGeometry(.06, .06, .08, 10), rubber(), x, .06, -.38, Math.PI / 2);
      }
      add(root, new T.SphereGeometry(.035, 10, 8), glow('#ffb45c'), 0, .18, -.34);
      break;
    }
    default: port(root, body, mode.style, 0, 1);
  }
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return root;
}

// Gerippter Schlauch statt glatter Röhre, gleiche Kurve wie im Spiel.
export function ribbedHose(oldMesh) {
  const curve = oldMesh.geometry.parameters?.path;
  if (!curve) return;
  const segments = 64, radial = 10, geometry = new T.TubeGeometry(curve, segments, .075, radial, false);
  const pos = geometry.attributes.position, center = new T.Vector3(), v = new T.Vector3();
  for (let i = 0; i <= segments; i++) {
    curve.getPointAt(i / segments, center);
    const k = 1 + (i % 2 ? .16 : -.04);
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(center).multiplyScalar(k).add(center);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geometry.computeVertexNormals();
  oldMesh.geometry.dispose();
  oldMesh.geometry = geometry;
  oldMesh.material = new T.MeshStandardMaterial({ color: '#3e524c', roughness: .7 });
}

// Messingbänder, Verschluss und Anzeige auf dem Rückentank.
export function decorateTank(body) {
  const tank = body.children.find(o => o.isMesh && Math.abs(o.position.x) < .01 && Math.abs(o.position.y - .77) < .01 && Math.abs(o.position.z + .35) < .01);
  if (!tank || tank.userData.redesigned) return;
  tank.userData.redesigned = true;
  tank.material = enamel('#5f8a72');
  const g = new T.Group();
  g.position.copy(tank.position);
  body.add(g);
  for (const y of [-.2, .16]) {
    const band = new T.Mesh(new T.TorusGeometry(.33, .022, 6, 28), brass());
    band.rotation.x = Math.PI / 2; band.position.y = y; band.scale.set(1, .58, 1);
    g.add(band);
  }
  const gauge = new T.Mesh(new T.CylinderGeometry(.075, .075, .03, 16), cream());
  gauge.rotation.x = Math.PI / 2; gauge.position.set(.16, .05, -.18);
  g.add(gauge);
  const rim = new T.Mesh(new T.TorusGeometry(.075, .014, 6, 16), brass());
  rim.position.set(.16, .05, -.196);
  g.add(rim);
  const needle = new T.Mesh(new T.BoxGeometry(.008, .055, .006), dark('x'));
  needle.position.set(.16, .065, -.2); needle.rotation.z = -.6;
  g.add(needle);
  const cap = new T.Mesh(new T.CylinderGeometry(.06, .07, .06, 12), brass());
  cap.position.set(-.18, .3, -.06);
  g.add(cap);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  // VacuumView gleicht die Sichtbarkeit an, falls die Figur den alten Tank ausblendet.
  return { tank, group: g };
}
