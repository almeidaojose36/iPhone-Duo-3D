// The iPhone Duo world: loads the studio models at true size (centimetres) and drives the phone's fold.
// Shared by every chapter of "Inside the iPhone Duo". Built on the PC film's engine (engine.js, fx.js).
import { THREE } from './engine.js';

const M = (name) => new URL(`../models/${name}.glb`, import.meta.url).href;

// centimetres per studio unit (each model's largest real dimension / 1.6 units)
export const CMU = {
  phone: 16.6 / 1.6,
  hinge: 11.8 / 1.6,
  batteries: 16.5 / 1.6,
  boards: 7.6 / 1.6,
  cameras: 7.6 / 1.6,
  display: 16.6 / 1.6,
  sound: 6.0 / 1.6
};
const FILES = {
  phone: 'iPhone_Duo',
  white: 'iPhone_Duo_Star_White',
  hinge: 'iPhone_Duo_Hinge',
  batteries: 'iPhone_Duo_Batteries',
  boards: 'iPhone_Duo_Logic_Board',
  cameras: 'iPhone_Duo_Cameras',
  display: 'iPhone_Duo_Inner_Display',
  sound: 'iPhone_Duo_Sound_Touch'
};

// Load the named models: loadDuo(stage, ['phone', 'hinge', ...]) -> { phone, hinge, ... }
export async function loadDuo(stage, names) {
  const out = {};
  // the film works at phone scale (cm): a near plane of 0.5 cm keeps depth precision for 0.02 mm layers
  stage.camera.near = 0.5;
  stage.camera.far = 900;
  stage.camera.updateProjectionMatrix();
  await Promise.all(
    names.map(async (n) => {
      const cm = CMU[n === 'white' ? 'phone' : n];
      out[n] = await stage.load(n, M(FILES[n]), cm);
      // paper-thin printed layers (screen images, crease sheen, decals) would shadow themselves (acne)
      out[n].root.traverse((o) => {
        if (o.isMesh && /Screen_Image|Crease|Dynamic_Island|Hole_Punch|Marking|Print|Decal|Label|Glint/.test(o.name)) {
          o.castShadow = false;
          o.receiveShadow = false;
          // and they sit a hair above the surface below: pull them forward in depth so they never z-fight
          const m = o.material.clone();
          m.polygonOffset = true;
          m.polygonOffsetFactor = -4;
          m.polygonOffsetUnits = -4;
          o.material = m;
          o.userData.baseMaterial = m;
        }
        // the engine clamps metal roughness for the PC film; the Duo's polished titanium, lens rings
        // and glossy logo need their mirror finish back for the premium look
        const mt = o.isMesh && o.material;
        if (mt && /Grade5_Titanium|Titanium|Lens_Ring|Ring|Camera_Control|Touch_ID|Apple_Logo|Hinge_Cover/i.test((mt.name || '') + ' ' + o.name)) {
          mt.roughness = /Apple_Logo|Ring/i.test((mt.name || '') + o.name) ? 0.12 : 0.2;
          if ('clearcoat' in mt) { mt.clearcoat = Math.max(mt.clearcoat || 0, 0.6); mt.clearcoatRoughness = 0.08; }
          mt.envMapIntensity = Math.max(mt.envMapIntensity || 1, 1.4);
          mt.needsUpdate = true;
        }
        // the hinge cover runs into the rounded inner corners of the frame halves; stop it 2 mm short so its
        // ends never show past the frame (they light up white when the spine glows)
        if (o.isMesh && o.name === 'Titanium_Hinge_Cover') o.scale.z *= 0.965;
      });
    })
  );
  return out;
}

// Height that rests a model's lowest point on the floor (y = 0) at its current pose
export function floorY(model) {
  model.root.position.y = 0;
  model.root.updateWorldMatrix(true, true);
  const b = new THREE.Box3().setFromObject(model.root);
  return -b.min.y;
}

// World-space centre / top of a named part
export const centreOf = (obj) => new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3());
export const topOf = (obj) => { const b = new THREE.Box3().setFromObject(obj); const c = b.getCenter(new THREE.Vector3()); c.y = b.max.y; return c; };

// Fold rig. The phone glb carries userData.fold on Fold_Pivot_Left/_Right (rotate +/-90 deg about Z) and
// Hinge_Fold (lift + widen the spine). foldRig(phone, 'right') keeps the right (camera) half still and
// swings the left half over it, like a book opening: set(f) with f = 0 open flat, 1 closed.
// `place` is the open pose of the root (position + quaternion); the anchored half never moves.
export function foldRig(phone, anchor = 'right') {
  const piv = { left: phone.part('Fold_Pivot_Left'), right: phone.part('Fold_Pivot_Right') };
  const hinge = phone.part('Hinge_Fold');
  const nodes = [piv.left, piv.right, hinge];
  const base = nodes.map((n) => ({ p: n.position.clone(), q: n.quaternion.clone(), s: n.scale.clone() }));
  const fixed = piv[anchor];
  const local = (n) => new THREE.Matrix4().compose(n.position, n.quaternion, n.scale);
  const root = phone.root;
  const rootOpen = { p: root.position.clone(), q: root.quaternion.clone(), s: root.scale.clone() };
  const fixedOpen = local(fixed).clone();
  const pose = (f) => {
    nodes.forEach((n, i) => {
      const b = base[i];
      n.position.copy(b.p);
      n.quaternion.copy(b.q);
      n.scale.copy(b.s);
      const spec = n.userData.fold || {};
      if (spec.deg && spec.axis) {
        const e = new THREE.Euler(0, 0, 0);
        e[spec.axis] = THREE.MathUtils.degToRad(spec.deg) * f;
        n.quaternion.multiply(new THREE.Quaternion().setFromEuler(e));
      }
      if (spec.move) n.position.add(new THREE.Vector3().fromArray(spec.move).multiplyScalar(f));
      if (spec.scale) n.scale.multiply(new THREE.Vector3(1, 1, 1).lerp(new THREE.Vector3().fromArray(spec.scale), f));
    });
  };
  return {
    // set the open pose of the whole phone (call before set())
    place(p, q) {
      rootOpen.p.copy(p);
      if (q) rootOpen.q.copy(q);
    },
    set(f) {
      pose(f);
      // root = rootOpen * fixedOpen * fixed(f)^-1 keeps the anchored half where it was when open
      const R0 = new THREE.Matrix4().compose(rootOpen.p, rootOpen.q, rootOpen.s);
      const M = R0.multiply(fixedOpen).multiply(local(fixed).invert());
      M.decompose(root.position, root.quaternion, root.scale);
    }
  };
}

// Mesh list under a node whose names match a pattern (for glows and fades)
export function meshes(obj, re) {
  const out = [];
  obj.traverse((o) => { if (o.isMesh && (!re || re.test(o.name))) out.push(o); });
  return out;
}

// Studio explode offsets travel in the glb as node extras (userData.basePos + explodeVec, model units).
// explode(model, f, k) moves every such node to basePos + explodeVec * f * k.
export function explode(model, f, k = 1) {
  model.root.traverse((n) => {
    const b = n.userData.basePos, v = n.userData.explodeVec;
    if (!b || !v) return;
    n.position.set(b.x + v.x * f * k, b.y + v.y * f * k, b.z + v.z * f * k);
  });
}

// Orbit camera key: target, distance, azimuth (deg, 0 = from +Z), elevation (deg), fov
export function orb(t, target, dist, az, el, fov = 34, extra = {}) {
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  const pos = [target[0] + dist * Math.cos(e) * Math.sin(a), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(e) * Math.cos(a)];
  return { t, pos, look: target, fov, ...extra };
}

// Orbit key that frames the target off-centre: shift > 0 moves the subject to the left of frame (cm),
// leaving the right side free for an overlay card
export function orbL(t, target, dist, az, el, fov = 34, shift = 6) {
  const a = THREE.MathUtils.degToRad(az);
  const tg = [target[0] + Math.cos(a) * shift, target[1], target[2] - Math.sin(a) * shift];
  return orb(t, tg, dist, az, el, fov);
}
