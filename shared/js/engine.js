// Stage engine for the PC teardown film.
// One three.js world rendered frame by frame from timeline time (HyperFrames seek protocol).
// World units are centimetres, +Y up. Everything drawn is a pure function of t.

import * as THREE from '../vendor/three/build/three.module.js';
import { GLTFLoader } from '../vendor/three/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from '../vendor/three/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/three/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/three/jsm/postprocessing/OutputPass.js';
import { GTAOPass } from '../vendor/three/jsm/postprocessing/GTAOPass.js';

export { THREE };

// ------------------------------------------------------------------ easing and keyframes
export const ease = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  outBack: (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2),
  sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2
};
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, x) => a + (b - a) * x;
// progress of t through [t0, t1], eased
export const prog = (t, t0, t1, e = ease.inOut) => e(clamp01((t - t0) / Math.max(1e-6, t1 - t0)));

// Scalar keyframes [[t, v, easeName?], ...]: value at t with per-segment easing (holds at the ends)
export function keys(list) {
  return (t) => {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 0; i < list.length - 1; i++) {
      const [t0, v0] = list[i];
      const [t1, v1, e] = list[i + 1];
      if (t <= t1) return lerp(v0, v1, (ease[e || 'inOut'])((t - t0) / (t1 - t0)));
    }
    return list[list.length - 1][1];
  };
}

// Portrait (Shorts) mode: a page sets globalThis.__PORTRAIT = { w: 1080, h: 1920, fit } before the shots load.
// Stages then render at that size, and each landscape lens becomes a portrait lens whose width spans
// `fit` times the landscape frame's height (fit 1 = the subject that filled the height fills the width).
const PORTRAIT = globalThis.__PORTRAIT || null;
function portraitFov(f) {
  if (!PORTRAIT) return f;
  const half = Math.tan((f * Math.PI) / 360) * (PORTRAIT.fit ?? 1.15) * (PORTRAIT.h / PORTRAIT.w);
  return (Math.atan(half) * 360) / Math.PI;
}

// Camera path: keyframes {t, pos:[x,y,z], look:[x,y,z], fov}. Positions and targets follow a
// centripetal Catmull-Rom spline through the keys, time-warped with a gentle ease per segment so
// the camera never stops dead between keys (one continuous move, the film's signature).
export function cameraPath(list, { hold = 0.18 } = {}) {
  const P = list.map((k) => new THREE.Vector3(...k.pos));
  const L = list.map((k) => new THREE.Vector3(...k.look));
  // a key with cut: true is reached by a jump: no interpolation into it and no spline tangent across it
  const seg = (arr, i) => [
    i - 1 < 0 || list[i].cut ? arr[i] : arr[i - 1],
    arr[i],
    arr[i + 1],
    i + 2 >= arr.length || list[i + 2].cut ? arr[i + 1] : arr[i + 2]
  ];
  const cr = (p0, p1, p2, p3, u, out) => {
    const u2 = u * u, u3 = u2 * u;
    out.set(0, 0, 0)
      .addScaledVector(p0, -0.5 * u3 + u2 - 0.5 * u)
      .addScaledVector(p1, 1.5 * u3 - 2.5 * u2 + 1)
      .addScaledVector(p2, -1.5 * u3 + 2 * u2 + 0.5 * u)
      .addScaledVector(p3, 0.5 * u3 - 0.5 * u2);
    return out;
  };
  // blend between linear time (continuous speed) and eased time (soft stops) per key
  const warp = (u, soft) => lerp(u, ease.sine(u), soft);
  return (t, cam) => {
    let i = 0;
    if (t >= list[list.length - 1].t) i = list.length - 2;
    else while (i < list.length - 2 && t > list[i + 1].t) i++;
    const k0 = list[i], k1 = list[i + 1];
    const raw = clamp01((t - k0.t) / (k1.t - k0.t));
    const soft = k1.soft ?? hold;
    const u = k1.cut ? (raw >= 1 ? 1 : 0) : k1.ease ? ease[k1.ease](raw) : warp(raw, soft * 5 > 1 ? 1 : soft * 5);
    const pos = cr(...seg(P, i), u, new THREE.Vector3());
    const look = cr(...seg(L, i), u, new THREE.Vector3());
    cam.position.copy(pos);
    cam.lookAt(look);
    const f0 = k0.fov ?? 35, f1 = k1.fov ?? f0;
    cam.fov = portraitFov(lerp(f0, f1, u));
    if (k0.roll || k1.roll) cam.rotateZ(lerp(k0.roll || 0, k1.roll || 0, u));
    cam.updateProjectionMatrix();
    return look;
  };
}

// ------------------------------------------------------------------ studio
function studioEnvironment(renderer) {
  // A dark room with three soft-box strips: reflections read as product-photo highlights
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ color: 0x07080a, side: THREE.BackSide })));
  const box = (w, h, rgb, pos, look) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
    m.material.color.setRGB(...rgb);
    m.position.set(...pos);
    m.lookAt(...look);
    env.add(m);
  };
  box(44, 26, [1.7, 1.65, 1.6], [0, 30, 6], [0, 0, 0]);         // big soft overhead key
  box(7, 40, [1.0, 1.2, 1.55], [-34, 10, -6], [0, 0, 0]);         // cool left strip
  box(7, 40, [1.3, 1.25, 1.2], [34, 8, 10], [0, 0, 0]);           // neutral right strip
  box(40, 4, [1.2, 1.4, 1.8], [0, 6, -36], [0, 0, 0]);           // rear rim strip
  box(50, 3, [0.25, 0.25, 0.28], [0, -2, 40], [0, 0, 0]);        // faint front fill (keeps blacks from going dead)
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.035).texture;
  pm.dispose();
  return tex;
}

function floorTexture() {
  // Matte dark slate with a faint fine grid (25 cm squares at repeat 12), like a photo-studio sweep
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#1b1c1f';
  g.fillRect(0, 0, 1024, 1024);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 90000; i++) { // slate grain
    const v = 22 + Math.floor(rnd() * 16);
    g.fillStyle = `rgba(${v},${v + 1},${v + 3},0.4)`;
    g.fillRect(rnd() * 1024, rnd() * 1024, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  g.strokeStyle = 'rgba(120,170,190,0.10)';
  g.lineWidth = 1.5;
  for (let k = 0; k <= 1024; k += 256) {
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, k); g.lineTo(1024, k); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export class Stage {
  constructor(canvas, { width = 1920, height = 1080, background = 0x111214, floor = true, fog = [120, 420], ao = null } = {}) {
    if (PORTRAIT && width === 1920 && height === 1080) [width, height] = [PORTRAIT.w, PORTRAIT.h];
    this.width = width;
    this.height = height;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(1);
    r.setSize(width, height, false);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.1;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color(background);
    scene.fog = fog ? new THREE.Fog(background, fog[0], fog[1]) : null;
    scene.environment = studioEnvironment(r);
    scene.environmentIntensity = 1.0;

    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.05, 2000);

    // floor
    const ft = floorTexture();
    ft.repeat.set(12, 12);
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 1200),
      new THREE.MeshStandardMaterial({ map: ft, color: 0xffffff, roughness: 0.78, metalness: 0.0, envMapIntensity: 0.5 })
    );
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.floor.name = 'Studio_Floor';
    if (floor) scene.add(this.floor);

    // key light with soft shadows, plus a cool rim
    const key = (this.key = new THREE.DirectionalLight(0xfff4e8, 1.5));
    key.position.set(20, 90, -25);
    key.castShadow = true;
    key.shadow.mapSize.set(4096, 4096);
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 6;
    scene.add(key, key.target);
    this.setShadowFocus(new THREE.Vector3(0, 0, 0), 40);
    const rim = (this.rim = new THREE.DirectionalLight(0xbfd6ff, 0.9));
    rim.position.set(-40, 35, -60);
    scene.add(rim);

    // post: MSAA render target -> bloom on the brightest points only -> tone map + sRGB
    const rt = new THREE.WebGLRenderTarget(width, height, { type: THREE.HalfFloatType, samples: 4 });
    const comp = (this.composer = new EffectComposer(r, rt));
    comp.setPixelRatio(1);
    comp.setSize(width, height);
    comp.addPass(new RenderPass(scene, this.camera));
    if (ao) {
      // ground-truth ambient occlusion: contact darkening in crevices (radius in world units)
      const gtao = new GTAOPass(scene, this.camera, width, height);
      gtao.updateGtaoMaterial({ radius: ao.radius ?? 2, distanceExponent: 1.4, thickness: ao.thickness ?? 2, scale: ao.scale ?? 1.2, samples: 16 });
      gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
      gtao.blendIntensity = ao.intensity ?? 1;
      comp.addPass(gtao);
      this.gtao = gtao;
    }
    this.bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.32, 0.5, 2.2);
    comp.addPass(this.bloom);
    comp.addPass(new OutputPass());

    this.loader = new GLTFLoader();
    this.models = {};
  }

  setShadowFocus(center, radius) {
    const k = this.key;
    k.target.position.copy(center);
    k.position.copy(center).add(new THREE.Vector3(20, 90, -25).normalize().multiplyScalar(radius * 3 + 60));
    const c = k.shadow.camera;
    c.left = c.bottom = -radius;
    c.right = c.top = radius;
    c.near = 1;
    c.far = radius * 6 + 200;
    c.updateProjectionMatrix();
  }

  // Load a studio .glb. cmPerUnit converts the studio's normalised units to centimetres.
  async load(name, url, cmPerUnit) {
    const gltf = await this.loader.loadAsync(url);
    const root = gltf.scene;
    root.name = name;
    root.scale.setScalar(cmPerUnit);
    const parts = {};
    root.traverse((o) => {
      if (o.name) parts[o.name] = o;
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        // decals are transparent planes: keep them out of the shadow pass
        if (o.material && o.material.transparent && o.material.depthWrite === false) o.castShadow = false;
        // polished metals go mirror-sharp under a point key light: keep a minimum sheen width
        const m = o.material;
        if (m && m.metalness > 0.5 && m.roughness < 0.42) m.roughness = 0.42;
        // clear-coated parts (silicon dies) get a broad, soft sheen instead of a hard hotspot
        if (m && m.clearcoat) { m.clearcoat = Math.min(m.clearcoat, 0.25); m.clearcoatRoughness = Math.max(m.clearcoatRoughness, 0.38); }
        o.userData.baseMaterial = o.material;
      }
      o.userData.basePosition = o.position.clone();
      o.userData.baseQuaternion = o.quaternion.clone();
    });
    const model = { root, parts, part: (n) => parts[n] || console.warn('missing part', name, n) };
    this.models[name] = model;
    this.scene.add(root);
    return model;
  }

  render() {
    this.composer.render();
  }

  // Screen position (px) of a world point; z > 1 means behind the camera
  project(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x * 0.5 + 0.5) * this.width, y: (-p.y * 0.5 + 0.5) * this.height, behind: p.z > 1 };
  }
}

// ------------------------------------------------------------------ highlights
// "X-ray" highlight: blend a mesh towards a flat glowing colour (the film's colour code)
const glowCache = new WeakMap();
export function setGlow(obj, colorHex, amount) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const base = o.userData.baseMaterial;
    if (amount <= 0.001) { o.material = base; return; }
    let m = glowCache.get(o);
    if (!m) {
      m = base.clone();
      glowCache.set(o, m);
    }
    const c = new THREE.Color(colorHex);
    m.color.copy(base.color || new THREE.Color(1, 1, 1)).lerp(c, amount * 0.85);
    m.emissive = c.clone();
    m.emissiveIntensity = amount * 1.6;
    m.map = amount > 0.6 ? null : base.map;
    m.needsUpdate = true;
    o.material = m;
  });
}

// ------------------------------------------------------------------ labels
// HTML labels pinned to 3D anchors, typed on, with a thin leader line.
export class Labels {
  constructor(layer, stage) {
    this.layer = layer;
    this.stage = stage;
    this.items = [];
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', stage.width);
    this.svg.setAttribute('height', stage.height);
    this.svg.style.cssText = 'position:absolute;inset:0;overflow:visible;pointer-events:none';
    layer.appendChild(this.svg);
  }
  // spec: { text, anchor: () => Vector3, t0, t1, dx, dy, color, size, align }
  add(spec) {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.style.color = spec.color || 'var(--cyan)';
    if (spec.size) el.style.fontSize = spec.size + 'px';
    this.layer.appendChild(el);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', spec.color || 'var(--cyan)');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    this.svg.appendChild(line);
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '4.5');
    dot.setAttribute('fill', spec.color || 'var(--cyan)');
    this.svg.appendChild(dot);
    this.items.push({ ...spec, el, line, dot });
  }
  update(t) {
    const placed = [];
    for (const it of this.items) {
      const fadeIn = clamp01((t - it.t0) / 0.35);
      const fadeOut = 1 - clamp01((t - (it.t1 - 0.4)) / 0.4);
      const a = Math.min(fadeIn, fadeOut);
      if (a <= 0 || t < it.t0 || t > it.t1) {
        it.el.style.opacity = 0;
        it.line.setAttribute('opacity', 0);
        it.dot.setAttribute('opacity', 0);
        continue;
      }
      const p = this.stage.project(it.anchor(t));
      // a label may carry its own portrait (Shorts) offsets; the landscape film always uses dx/dy
      const off = PORTRAIT && it.portrait ? it.portrait : it;
      let dx = off.dx ?? 120;
      const dy = off.dy ?? -90;
      // keep the whole (fully typed) label inside a safe margin: flip sides if it would overflow, then clamp
      if (it.w == null) {
        it.el.textContent = it.text;
        it.w = it.el.offsetWidth;
        it.h = it.el.offsetHeight;
      }
      const M = 48, W = this.stage.width, H = this.stage.height;
      const boxL = (d) => (d < 0 ? p.x + d - 12 - it.w : p.x + d + 12);
      const over = (d) => Math.max(0, M - boxL(d), boxL(d) + it.w - (W - M));
      // flip only when a big part would be cut off; small overflows just slide in (flipping can land on other labels)
      if (over(dx) > 0.35 * it.w && over(-dx) === 0) dx = -dx;
      let lx = p.x + dx, ly = p.y + dy;
      const left = boxL(dx);
      if (left < M) lx += M - left;
      else if (left + it.w > W - M) lx -= left + it.w - (W - M);
      ly = Math.min(Math.max(ly, M + 22), H - M - it.h + 22);
      placed.push({ it, p, a, lx, ly, right: dx < 0 });
    }
    // portrait frames are narrow: labels that sat side by side can collide, so nudge them apart
    // vertically (earlier labels keep their place) and keep them off the Short's caption band
    if (PORTRAIT) {
      const M = 48, H = this.stage.height, gap = 10;
      const box = (q) => ({ l: q.right ? q.lx - 12 - q.it.w : q.lx + 12, t: q.ly - 22, w: q.it.w, h: q.it.h });
      const hit = (A, B) => A.l < B.l + B.w && B.l < A.l + A.w && A.t < B.t + B.h && B.t < A.t + A.h;
      const avoid = (PORTRAIT.avoid || []).map(([l, t, w, h]) => ({ l, t, w, h }));
      placed.sort((x, y) => x.it.t0 - y.it.t0);
      const done = [];
      for (const q of placed) {
        for (let k = 0; k < 6; k++) {
          const b = box(q);
          const o = [...avoid, ...done].find((B) => hit(b, B));
          if (!o) break;
          const up = o.t - gap - b.h - b.t, down = o.t + o.h + gap - b.t;
          const okUp = b.t + up >= M, okDown = b.t + b.h + down <= H - M;
          q.ly += okUp && (!okDown || -up <= down) ? up : down;
        }
        done.push(box(q));
      }
    }
    for (const { it, p, a, lx, ly, right } of placed) {
      const n = Math.ceil(it.text.length * clamp01((t - it.t0) / Math.max(0.3, it.text.length * 0.035)));
      it.el.textContent = it.text.slice(0, n);
      it.el.style.transform = `translate(${right ? lx - 12 : lx + 12}px, ${ly - 22}px) translateX(${right ? '-100%' : '0'})`;
      it.el.style.opacity = a;
      // leader: anchor -> elbow -> under the label
      const grow = prog(t, it.t0, it.t0 + 0.35, ease.out);
      const ex = lerp(p.x, lx, grow), ey = lerp(p.y, ly, grow);
      it.line.setAttribute('points', `${p.x},${p.y} ${ex},${ey}`);
      it.line.setAttribute('opacity', a);
      it.dot.setAttribute('cx', p.x);
      it.dot.setAttribute('cy', p.y);
      it.dot.setAttribute('opacity', a);
    }
  }
}
