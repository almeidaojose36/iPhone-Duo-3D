// Visual effects for the PC teardown film. All state is set from timeline time.
import { THREE, clamp01, lerp, ease } from './engine.js';

// ------------------------------------------------------------------ transparency
// Fade an object's meshes (materials are cloned once into transparent copies).
const fadeCache = new WeakMap();
export function setOpacity(obj, a) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const base = o.userData.baseMaterial || o.material;
    if (a >= 0.999) { o.material = base; o.visible = true; return; }
    o.visible = a > 0.003;
    let m = fadeCache.get(o);
    if (!m) {
      m = base.clone();
      m.transparent = true;
      m.depthWrite = false;
      fadeCache.set(o, m);
    }
    m.opacity = a * (base.opacity ?? 1);
    o.material = m;
    o.castShadow = a > 0.5;
  });
}

// ------------------------------------------------------------------ glowing traces
// A tube along a polyline whose glow head travels from start to end (progress 0..1),
// leaving a dimmer lit trail. Additive, bloom picks up the head.
export class TraceLine {
  constructor(points, { radius = 0.04, color = 0x5fd8ff, tail = 0.25, residual = 0.35, intensity = 4, segments } = {}) {
    const curve = new THREE.CurvePath();
    for (let i = 0; i < points.length - 1; i++) curve.add(new THREE.LineCurve3(points[i], points[i + 1]));
    const len = curve.getLength();
    const geo = new THREE.TubeGeometry(curve, segments || Math.max(32, Math.ceil(len / radius / 2)), radius, 8, false);
    this.uniforms = {
      uHead: { value: 0 },
      uTail: { value: tail },
      uResidual: { value: residual },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uFade: { value: 1 }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uHead, uTail, uResidual, uIntensity, uFade; uniform vec3 uColor; varying vec2 vUv;
        void main(){
          float d = uHead - vUv.x;
          float head = d >= 0.0 ? exp(-d / max(uTail, 1e-4) * 3.0) : 0.0;
          float lit = d >= 0.0 ? uResidual : 0.0;
          float a = clamp(head + lit, 0.0, 1.0) * uFade;
          gl_FragColor = vec4(uColor * (head * uIntensity + lit * 1.2) * uFade, a);
        }`
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.renderOrder = 5;
    this.mesh.frustumCulled = false;
  }
  set(progress, fade = 1) {
    this.uniforms.uHead.value = progress;
    this.uniforms.uFade.value = fade;
    this.mesh.visible = fade > 0.001 && progress > 0;
  }
}

// Manhattan route between two points on a plane (local y fixed), with an optional mid jog
export function manhattan(a, b, y, mid = 0.5) {
  const m = lerp(a.x, b.x, mid);
  return [new THREE.Vector3(a.x, y, a.z), new THREE.Vector3(m, y, a.z), new THREE.Vector3(m, y, b.z), new THREE.Vector3(b.x, y, b.z)];
}

// ------------------------------------------------------------------ textured overlay planes
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// An additive glowing plane (lies in local XZ, facing +Y)
export function glowPlane(w, d, tex, color = 0xffffff, intensity = 2) {
  const m = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(color).multiplyScalar(intensity), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  p.rotation.x = -Math.PI / 2;
  p.renderOrder = 6;
  return p;
}

// Heat: an orange radial bloom that spreads from the centre outward
export function heatTexture() {
  return canvasTexture(512, 512, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(255,190,90,1)');
    r.addColorStop(0.35, 'rgba(255,110,30,0.75)');
    r.addColorStop(0.75, 'rgba(200,40,10,0.25)');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, w, w);
  });
}

// Fan-out traces on the package substrate, revealed outward from the die by uProgress
export function substrateTraces(w, d, dieW, dieD) {
  const tex = canvasTexture(1536, 1280, (g, W, H) => {
    g.fillStyle = 'rgba(0,0,0,0)';
    g.clearRect(0, 0, W, H);
    g.strokeStyle = 'rgba(120,230,255,0.95)';
    g.lineCap = 'round';
    let s = 3;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const cx = W / 2, cy = H / 2, dw = (dieW / w) * W / 2, dd = (dieD / d) * H / 2;
    for (let i = 0; i < 520; i++) {
      // start on the die edge, run outward with one 45-degree bend
      const side = i % 4;
      const f = rnd() * 2 - 1;
      let x0 = cx, y0 = cy, dx = 0, dy = 0;
      if (side === 0) { x0 = cx + f * dw; y0 = cy - dd; dy = -1; }
      if (side === 1) { x0 = cx + f * dw; y0 = cy + dd; dy = 1; }
      if (side === 2) { x0 = cx - dw; y0 = cy + f * dd; dx = -1; }
      if (side === 3) { x0 = cx + dw; y0 = cy + f * dd; dx = 1; }
      const l1 = 20 + rnd() * 80, l2 = 60 + rnd() * 420;
      const bx = (dx || f) * 0.7, by = (dy || f) * 0.7;
      g.lineWidth = 1.2 + rnd() * 1.4;
      g.globalAlpha = 0.35 + rnd() * 0.65;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x0 + dx * l1, y0 + dy * l1);
      g.lineTo(x0 + dx * l1 + bx * l2 + dx * l2 * 0.5, y0 + dy * l1 + by * l2 + dy * l2 * 0.5);
      g.stroke();
      g.globalAlpha = 1;
      g.fillStyle = 'rgba(255,220,140,0.9)';
      g.beginPath();
      g.arc(x0 + dx * l1 + bx * l2 + dx * l2 * 0.5, y0 + dy * l1 + by * l2 + dy * l2 * 0.5, 2.4, 0, Math.PI * 2);
      g.fill();
    }
  });
  const uniforms = { uMap: { value: tex }, uProgress: { value: 0 }, uFade: { value: 0 }, uColor: { value: new THREE.Color(0x5fd8ff) } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uProgress, uFade; uniform vec3 uColor; varying vec2 vUv;
      void main(){
        vec4 t = texture2D(uMap, vUv);
        vec2 p = (vUv - 0.5) * vec2(1.2, 1.0);
        float r = length(p) / 0.75;
        float m = smoothstep(uProgress, uProgress - 0.12, r);
        float edge = smoothstep(0.08, 0.0, abs(r - uProgress)) * 1.5;
        gl_FragColor = vec4(t.rgb * (2.2 + edge * 3.0), t.a * m * uFade);
      }`
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  p.rotation.x = -Math.PI / 2;
  p.renderOrder = 6;
  p.userData.uniforms = uniforms;
  return p;
}

// Land pads lighting up row by row (plane facing -Y, under the package)
export function padLights(w, d, cols = 43, rows = 42) {
  const tex = canvasTexture(1376, 1152, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const mx = W * 0.03, my = H * 0.03;
    const px = (W - 2 * mx) / (cols - 1), py = (H - 2 * my) / (rows - 1);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (c >= 17 && c <= 25 && r >= 16 && r <= 25) continue;
      const x = mx + c * px, y = my + r * py;
      const gr = g.createRadialGradient(x, y, 0, x, y, px * 0.48);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.6)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(x - px / 2, y - py / 2, px, py);
    }
  });
  const uniforms = { uMap: { value: tex }, uRows: { value: 0 }, uFade: { value: 0 }, uColor: { value: new THREE.Color(0x5fd8ff) } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uRows, uFade; uniform vec3 uColor; varying vec2 vUv;
      void main(){
        vec4 t = texture2D(uMap, vUv);
        float lit = smoothstep(uRows, uRows - 0.02, 1.0 - vUv.y);
        float front = smoothstep(0.035, 0.0, abs((1.0 - vUv.y) - uRows)) * 2.0;
        gl_FragColor = vec4(uColor * (2.5 + front * 4.0), t.r * (lit * 0.85 + front) * uFade);
      }`
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  p.rotation.x = Math.PI / 2;
  p.renderOrder = 6;
  p.userData.uniforms = uniforms;
  return p;
}

// ------------------------------------------------------------------ die floor plan
// Die-shot style artwork for the processor die plus colour-coded block highlights.
// Die coordinates in mm: x -11.9..11.9 (long edge), z -5.4..5.4.
export const DIE = { w: 23.8, d: 10.8 };
export const BLOCKS = {
  cores: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ x0: -9.5 + (i % 4) * 3.75, x1: -9.5 + (i % 4) * 3.75 + 3.4, z0: i < 4 ? -5.0 : 1.4, z1: i < 4 ? -1.4 : 5.0 })),
  cache: { x0: -9.5, x1: 5.15, z0: -1.1, z1: 1.1 },
  memctl: { x0: -11.5, x1: -9.85, z0: -5.0, z1: 5.0 },
  gpu: { x0: 5.6, x1: 11.5, z0: -5.0, z1: 1.0 },
  io: { x0: 5.6, x1: 11.5, z0: 1.35, z1: 5.0 }
};

export function dieShotTexture() {
  const W = 2380, H = 1080, k = 100; // 100 px per mm
  const X = (x) => (x + DIE.w / 2) * k, Y = (z) => (z + DIE.d / 2) * k;
  return canvasTexture(W, H, (g) => {
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    g.fillStyle = '#20262c';
    g.fillRect(0, 0, W, H);
    // fine logic texture everywhere
    for (let i = 0; i < 26000; i++) {
      const v = 40 + rnd() * 50;
      g.fillStyle = `rgba(${v * 0.9},${v},${v * 1.15},0.5)`;
      g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 6, 1 + rnd() * 3);
    }
    const sram = (b, cell, hue) => {
      const x0 = X(b.x0), y0 = Y(b.z0), w = X(b.x1) - x0, h = Y(b.z1) - y0;
      g.fillStyle = hue;
      g.fillRect(x0, y0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.08)';
      g.lineWidth = 1;
      for (let x = x0; x < x0 + w; x += cell) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + h); g.stroke(); }
      for (let y = y0; y < y0 + h; y += cell * 0.6) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); }
    };
    const logic = (b, base) => {
      const x0 = X(b.x0), y0 = Y(b.z0), w = X(b.x1) - x0, h = Y(b.z1) - y0;
      g.fillStyle = base;
      g.fillRect(x0, y0, w, h);
      for (let i = 0; i < (w * h) / 900; i++) {
        const v = 60 + rnd() * 90;
        g.fillStyle = `rgba(${v},${v * 0.95},${v * 1.1},${0.25 + rnd() * 0.4})`;
        g.fillRect(x0 + rnd() * w, y0 + rnd() * h, 4 + rnd() * 26, 3 + rnd() * 14);
      }
      g.strokeStyle = 'rgba(0,0,0,0.6)';
      g.lineWidth = 3;
      g.strokeRect(x0 + 1.5, y0 + 1.5, w - 3, h - 3);
    };
    BLOCKS.cores.forEach((c) => {
      logic(c, '#3a4048');
      // each core: L2 SRAM block on its inner side, L1 strip
      const inner = c.z0 < 0 ? { x0: c.x0 + 0.2, x1: c.x1 - 0.2, z0: c.z1 - 1.2, z1: c.z1 - 0.15 } : { x0: c.x0 + 0.2, x1: c.x1 - 0.2, z0: c.z0 + 0.15, z1: c.z0 + 1.2 };
      sram(inner, 9, '#4b5560');
    });
    sram(BLOCKS.cache, 7, '#55606b');
    logic(BLOCKS.memctl, '#3e3a36');
    sram({ ...BLOCKS.gpu, x0: BLOCKS.gpu.x0 + 0.3, x1: BLOCKS.gpu.x1 - 0.3, z0: BLOCKS.gpu.z0 + 0.3, z1: BLOCKS.gpu.z1 - 0.3 }, 14, '#3d3550');
    logic(BLOCKS.io, '#30394a');
    // bond-pad ring
    g.fillStyle = 'rgba(210,180,110,0.55)';
    for (let x = 30; x < W - 30; x += 22) { g.fillRect(x, 10, 10, 10); g.fillRect(x, H - 20, 10, 10); }
    for (let y = 30; y < H - 30; y += 22) { g.fillRect(10, y, 10, 10); g.fillRect(W - 20, y, 10, 10); }
  });
}

// Highlight plate for one block: additive tinted rectangle with a bright rim
export function blockHighlight(b, color, mmToUnit) {
  const w = (b.x1 - b.x0) * mmToUnit, d = (b.z1 - b.z0) * mmToUnit;
  const tex = canvasTexture(256, 256, (g, W) => {
    g.fillStyle = 'rgba(255,255,255,0.32)';
    g.fillRect(0, 0, W, W);
    g.strokeStyle = 'rgba(255,255,255,1)';
    g.lineWidth = 10;
    g.strokeRect(5, 5, W - 10, W - 10);
  });
  const p = glowPlane(w, d, tex, color, 1.6);
  p.position.set(((b.x0 + b.x1) / 2) * mmToUnit, 0, ((b.z0 + b.z1) / 2) * mmToUnit);
  return p;
}

// Thumbnail outline for scale (dashed), lies flat
export function thumbGhost() {
  return canvasTexture(512, 640, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.95)';
    g.lineWidth = 7;
    g.setLineDash([22, 14]);
    g.beginPath();
    g.moveTo(60, H - 30);
    g.lineTo(60, 220);
    g.bezierCurveTo(60, 40, W - 60, 40, W - 60, 220);
    g.lineTo(W - 60, H - 30);
    g.stroke();
    g.beginPath();
    g.moveTo(80, 250);
    g.bezierCurveTo(140, 200, W - 140, 200, W - 80, 250);
    g.stroke();
  });
}

// A simple monitor showing a stylised game frame (procedural sunset landscape)
export function buildMonitor() {
  const g = new THREE.Group();
  g.name = 'Monitor';
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.5, metalness: 0.2 });
  const w = 62, h = 35;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w + 1.2, h + 1.2, 1.6), frameMat);
  body.position.y = 14 + h / 2;
  g.add(body);
  const screenTex = canvasTexture(1920, 1080, (c, W, H) => {
    const sky = c.createLinearGradient(0, 0, 0, H * 0.7);
    sky.addColorStop(0, '#0b1a3a');
    sky.addColorStop(0.55, '#6b3f8f');
    sky.addColorStop(1, '#ff9a4d');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,220,160,0.95)';
    c.beginPath(); c.arc(W * 0.62, H * 0.6, 120, 0, Math.PI * 2); c.fill();
    const ridge = (y, amp, col, seed) => {
      let s = seed;
      const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      c.fillStyle = col;
      c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 40) c.lineTo(x, y - Math.sin(x * 0.004 + seed) * amp - rnd() * amp * 0.4);
      c.lineTo(W, H); c.closePath(); c.fill();
    };
    ridge(H * 0.66, 90, '#3a2350', 3);
    ridge(H * 0.76, 70, '#24163a', 7);
    ridge(H * 0.88, 40, '#120b20', 11);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.font = '600 34px Arial';
    c.fillText('FPS 165', 40, 60);
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: screenTex, color: 0x000000 }));
  screen.position.set(0, 14 + h / 2, 0.95); // clear of the body's front face, so it never z-fights at a distance
  screen.name = 'Monitor_Screen';
  g.add(screen);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(5, 16, 2.4), frameMat);
  neck.position.set(0, 8, -2);
  g.add(neck);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(24, 0.8, 16), frameMat);
  foot.position.set(0, 0.4, -2);
  g.add(foot);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.screen = screen;
  return g;
}

// ------------------------------------------------------------------ pose helpers
const _m = new THREE.Matrix4();
export function worldPose(obj) {
  obj.updateWorldMatrix(true, false);
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  obj.matrixWorld.decompose(p, q, s);
  return { p, q, s };
}
// Put obj at a world pose (p, q) while keeping its own local scale
export function setWorldPose(obj, p, q) {
  const parent = obj.parent;
  parent.updateWorldMatrix(true, false);
  const inv = _m.copy(parent.matrixWorld).invert();
  const pw = new THREE.Vector3(), qw = new THREE.Quaternion(), sw = new THREE.Vector3();
  parent.matrixWorld.decompose(pw, qw, sw);
  obj.position.copy(p).applyMatrix4(inv);
  obj.quaternion.copy(qw.clone().invert().multiply(q));
}
// Arc flight between two poses: lifts by `lift` at the middle
export function flight(a, b, x, lift = 0) {
  const p = new THREE.Vector3().lerpVectors(a.p, b.p, x);
  p.y += Math.sin(Math.PI * x) * lift;
  const q = a.q.clone().slerp(b.q, x);
  return { p, q };
}
export { clamp01, ease };

// ------------------------------------------------------------------ per-frame material looks
// Collects opacity and glow requests during a frame, then applies one material per mesh.
// Meshes flagged userData.noLook (effects with their own shaders) are left alone.
export class Looks {
  constructor() {
    this.cur = new Map();
    this.prev = new Set();
  }
  _touch(obj, fn) {
    obj.traverse((o) => {
      if (!o.isMesh || o.userData.noLook) return;
      let s = this.cur.get(o);
      if (!s) { s = { a: 1, glow: 0, color: 0, scale: 1 }; this.cur.set(o, s); }
      fn(s);
    });
  }
  opacity(obj, a) { if (a < 0.999) this._touch(obj, (s) => { s.a *= Math.max(0, a); }); }
  // scale < 1 softens the tint for near-black parts, where even a small linear-light glow floods the colour
  glow(obj, color, amt, scale = 1) { if (amt > 0.001) this._touch(obj, (s) => { if (amt > s.glow) { s.glow = amt; s.color = color; s.scale = scale; } }); }
  apply() {
    for (const o of this.prev) {
      if (this.cur.has(o)) continue;
      o.material = o.userData.baseMaterial;
      o.visible = true;
      o.castShadow = o.userData.baseCast;
    }
    for (const [o, s] of this.cur) {
      if (!o.userData.baseMaterial) o.userData.baseMaterial = o.material;
      if (o.userData.baseCast === undefined) o.userData.baseCast = o.castShadow;
      const base = o.userData.baseMaterial;
      let m = o.userData.lookMat;
      if (!m) { m = base.clone(); o.userData.lookMat = m; }
      m.copy(base);
      const key = `${s.a < 1}|${s.glow > 0.6}`;
      if (s.a < 1) {
        m.transparent = true;
        m.depthWrite = false;
        m.opacity = (base.opacity ?? 1) * s.a;
      }
      if (s.glow > 0 && m.emissive) {
        const c = new THREE.Color(s.color);
        if (m.color) m.color.lerp(c, s.glow * 0.85 * s.scale);
        m.emissive.copy(c);
        m.emissiveIntensity = s.glow * 1.8 * s.scale;
        if (s.glow > 0.6) m.map = null;
      }
      if (o.userData.lookKey !== key) { m.needsUpdate = true; o.userData.lookKey = key; }
      o.material = m;
      o.visible = s.a > 0.003;
      o.castShadow = o.userData.baseCast && s.a > 0.5;
    }
    this.prev = new Set(this.cur.keys());
    this.cur = new Map();
  }
}
// mark effect meshes so Looks never touches them
export const noLook = (obj) => { obj.traverse((o) => { o.userData.noLook = true; }); return obj; };

// ------------------------------------------------------------------ choreographed paths
// A part's motion as legs: each leg runs from t0 to t1 along a smooth curve through pts
// (arc-length parametrised, eased), turning from q0 to q1. Before the first leg the part
// holds the first point; between legs it holds; after the last leg it rests at the end.
export function legsPose(t, legs) {
  const first = legs[0], last = legs[legs.length - 1];
  if (t <= first.t0) return { p: first.pts[0].clone(), q: first.q0.clone() };
  for (let i = 0; i < legs.length; i++) {
    const L = legs[i];
    if (t < L.t0) { const P = legs[i - 1]; return { p: P.pts[P.pts.length - 1].clone(), q: P.q1.clone() }; }
    if (t <= L.t1) {
      const u = (L.ease || ease.inOut)(clamp01((t - L.t0) / (L.t1 - L.t0)));
      if (!L.curve) L.curve = L.pts.length > 2 ? new THREE.CatmullRomCurve3(L.pts, false, 'centripetal') : null;
      const p = L.curve ? L.curve.getPointAt(u) : new THREE.Vector3().lerpVectors(L.pts[0], L.pts[1], u);
      return { p, q: L.q0.clone().slerp(L.q1, u) };
    }
  }
  return { p: last.pts[last.pts.length - 1].clone(), q: last.q1.clone() };
}
// Pull straight out along a removal axis, pause, then glide on an arc to the final pose
export function extraction(home, axis, pull, fin, t0, { dOut = 0.45, pause = 0.12, dTravel = 1.3, lift = 8, via = null } = {}) {
  const out = home.p.clone().addScaledVector(axis, pull);
  const mid = via ? via.clone() : out.clone().lerp(fin.p, 0.5).add(new THREE.Vector3(0, lift, 0));
  const t1 = t0 + dOut, t2 = t1 + pause;
  return [
    { t0, t1, pts: [home.p.clone(), out], q0: home.q.clone(), q1: home.q.clone() },
    { t0: t2, t1: t2 + dTravel, pts: [out, mid, fin.p.clone()], q0: home.q.clone(), q1: fin.q.clone(), ease: (x) => 0.4 * ease.inOut(x) + 0.6 * (1 - Math.pow(1 - x, 3)) }
  ];
}
