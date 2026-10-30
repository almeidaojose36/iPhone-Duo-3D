// Micro worlds for "Inside the iPhone Duo": the scenes the loupe zooms into, each a pure function of time.
// Every builder returns { root, update(t, params), anchors } and is drawn on the stage's micro canvas.
// Units are arbitrary "micro units" (about 1 unit = 1 nm for the transistor, 1 um for pixels).
import { THREE, clamp01, lerp, ease, prog } from './engine.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0, ...o });
const glowMat = (color, k = 1.5) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k, roughness: 0.3 });
const box = (w, h, d, m, x = 0, y = 0, z = 0, parent) => {
  const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  g.position.set(x, y, z);
  g.castShadow = g.receiveShadow = true;
  if (parent) parent.add(g);
  return g;
};
const hash = (i, k = 1) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
const SPH = new THREE.SphereGeometry(1, 16, 12);
// a pool of small spheres (electrons, ions, holes...) positioned every frame
function pool(n, material, r, parent) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(SPH, material);
    m.scale.setScalar(r);
    m.visible = false;
    parent.add(m);
    arr.push(m);
  }
  return arr;
}

// ------------------------------------------------------------------ loupe reveal (as in the PC film)
// k: 0 hidden, 0..1 loupe circle shows the micro view at (cx, cy), 1..2 it grows to fill the frame, 2 = full
export function revealMicro(el, k, cx = 960, cy = 540) {
  if (k <= 0.001) {
    el.micro.style.opacity = 0;
    el.loupe.style.opacity = 0;
    el.mlabels.style.opacity = 0;
    return false;
  }
  let clip = 'none';
  if (k < 2) {
    const r = k <= 1 ? 250 * ease.outBack(clamp01(k)) : lerp(250, 1300, ease.in(k - 1));
    clip = `circle(${Math.max(1, r)}px at ${cx}px ${cy}px)`;
    el.loupe.style.opacity = k <= 1 ? clamp01(k * 2) : 1 - clamp01((k - 1) * 3);
    el.loupe.style.transform = `translate(${cx - 270}px, ${cy - 270}px) scale(${Math.max(0.01, r / 250)})`;
  } else el.loupe.style.opacity = 0;
  el.micro.style.clipPath = clip;
  el.micro.style.opacity = 1;
  el.mlabels.style.opacity = k >= 1.95 ? 1 : 0;
  return true;
}

// ------------------------------------------------------------------ 1. Gate-all-around nanosheet transistor
// An array of transistors (the chip), the hero in the middle cut open: source and drain, three stacked
// silicon ribbons, a gate wrapping each ribbon; electrons flow through when the gate is on.
export function buildGAA() {
  const root = new THREE.Group();
  const si = mat(0x8a93a6, { roughness: 0.35, metalness: 0.2 });
  const sub = mat(0x3a4150, { roughness: 0.6 });
  const sd = mat(0xb06a3a, { roughness: 0.45, metalness: 0.2 });
  const gate = mat(0xd2a24c, { roughness: 0.32, metalness: 0.85 });
  const gateGlass = mat(0xd2a24c, { roughness: 0.32, metalness: 0.85, transparent: true, opacity: 0.32, depthWrite: false });
  const oxide = mat(0x4fa8c8, { roughness: 0.2, transparent: true, opacity: 0.45 });
  box(260, 6, 180, sub, 0, -3, 0, root);
  // background array: simplified transistors (gate lines over fins) merged per material
  const geos = { sd: [], g: [] };
  for (let i = -6; i <= 6; i++) for (let j = -4; j <= 4; j++) {
    if (Math.abs(i) <= 1 && Math.abs(j) <= 1) continue;
    const x = i * 18, z = j * 18;
    const a = new THREE.BoxGeometry(14, 5, 6); a.translate(x, 2.5, z); geos.sd.push(a);
    const b = new THREE.BoxGeometry(4, 9, 12); b.translate(x, 4.5, z); geos.g.push(b);
  }
  const merge = (list) => { const g = new THREE.BufferGeometry(); const pos = [], idx = []; let o = 0; for (const x of list) { const p = x.attributes.position.array; pos.push(...p); const ii = x.index.array; for (const v of ii) idx.push(v + o); o += p.length / 3; } g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  const arr = new THREE.Group();
  const m1 = new THREE.Mesh(merge(geos.sd), sd), m2 = new THREE.Mesh(merge(geos.g), mat(0xd2a24c, { roughness: 0.32, metalness: 0.85 }));
  m1.receiveShadow = m2.receiveShadow = m1.castShadow = m2.castShadow = true;
  arr.add(m1, m2);
  root.add(arr);
  // hero transistor (scaled up 3x in the middle)
  const hero = new THREE.Group();
  hero.scale.setScalar(3);
  root.add(hero);
  box(7, 9, 9, sd, -10.5, 4.5, 0, hero); // source
  box(7, 9, 9, sd, 10.5, 4.5, 0, hero);  // drain
  const sheets = [2.0, 4.5, 7.0].map((y) => box(14, 0.9, 6, si, 0, y, 0, hero));
  // gate: slabs between and around the sheets, the front half see-through (cut-away)
  const gateParts = [];
  for (const y of [0.9, 3.25, 5.75, 8.25]) gateParts.push(box(4, y === 8.25 ? 1.6 : 1.5, 8, gate, 0, y, 0, hero));
  gateParts.push(box(4, 8.9, 1.0, gate, 0, 4.6, -3.6, hero));
  const front = box(4, 8.9, 1.0, gateGlass, 0, 4.6, 3.6, hero);
  front.castShadow = false;
  sheets.forEach((s) => { const o = box(4.2, 1.2, 6.3, oxide, 0, s.position.y, 0, hero); o.castShadow = false; });
  // electrons through the ribbons
  const eMat = glowMat(0x5fd8ff, 2.4);
  const electrons = pool(72, eMat, 0.5, hero);
  // leakage hints when off: a few faint electrons only
  const anchors = {
    source: () => hero.localToWorld(V(-10.5, 9.5, 0)), drain: () => hero.localToWorld(V(10.5, 9.5, 0)),
    gate: () => hero.localToWorld(V(0, 9.4, 0)), sheets: () => hero.localToWorld(V(5, 7, 3)), array: () => V(-60, 10, 40)
  };
  return {
    root, anchors,
    // p.on: gate voltage 0..1, p.flow: electron flow speed 0..1
    update(t, p) {
      gateParts.forEach((g) => { g.material = gate; });
      gate.emissive.set(0xffb347);
      gate.emissiveIntensity = 0.9 * (p.on || 0);
      front.material.opacity = 0.32;
      electrons.forEach((e, i) => {
        const lane = i % 3, ph = hash(i, 3);
        const u = ((t * (0.25 + 0.35 * (p.on || 0)) + ph) % 1);
        const vis = (p.on || 0) > 0.05 || (i % 18 === 0 && (p.leak || 0) > 0);
        e.visible = vis;
        if (!vis) return;
        e.position.set(lerp(-12, 12, u), sheets[lane].position.y + 0.55 + (hash(i, 7) - 0.5) * 0.3, (hash(i, 9) - 0.5) * 4.6);
      });
    }
  };
}

// ------------------------------------------------------------------ 2. OLED subpixel cross-section
export function buildOLED() {
  const root = new THREE.Group();
  // see-through layers so the electrons and holes can be followed inside them
  const tr = { transparent: true, opacity: 0.42, depthWrite: false };
  const layers = [
    ['Anode', 0x9fb4c8, 3.0, { metalness: 0.3, ...tr, opacity: 0.6 }],
    ['Hole layer', 0xc77a4a, 3.0, tr],
    ['Emitting layer', 0x3fbf6a, 3.0, { emissive: 0x2bd954, emissiveIntensity: 0.15, ...tr, opacity: 0.5 }],
    ['Electron layer', 0x4a7fc7, 3.0, tr],
    ['Cathode', 0x7d8188, 2.0, { metalness: 0.6, roughness: 0.45, ...tr, opacity: 0.55 }]
  ];
  const meshes = {};
  let y = 0;
  layers.forEach(([name, c, h, o]) => {
    const m = box(60, h, 40, mat(c, o), 0, y + h / 2, 0, root);
    m.name = name;
    meshes[name] = m;
    y += h + 0.25;
  });
  const top = y;
  const eMat = glowMat(0x5fd8ff, 2.2), hMat = glowMat(0xffa25a, 2.0), fMat = glowMat(0x7dff9a, 4.0);
  const elec = pool(28, eMat, 0.75, root), holes = pool(28, hMat, 0.75, root), flashes = pool(28, fMat, 1, root);
  const phot = pool(28, glowMat(0xb7ffcb, 3.5), 0.45, root);
  const emY = meshes['Emitting layer'].position.y;
  return {
    root,
    anchors: Object.fromEntries(Object.entries(meshes).map(([k, m]) => [k, () => m.localToWorld(V(30, 0, 20))])),
    update(t, p) {
      const a = p.on || 0;
      meshes['Emitting layer'].material.emissiveIntensity = 0.15 + 1.2 * a * (0.7 + 0.3 * Math.sin(t * 9));
      for (let i = 0; i < 28; i++) {
        const ph = hash(i, 1), cyc = 1.6;
        const u = ((t / cyc + ph) % 1);
        const x = (hash(i, 2) - 0.5) * 50, z = (hash(i, 4) - 0.5) * 30;
        const meet = 0.6;
        const vis = a > 0.05;
        elec[i].visible = holes[i].visible = vis && u < meet;
        if (u < meet) {
          const v = ease.inOut(u / meet);
          elec[i].position.set(x, lerp(top + 1, emY + 0.6, v), z);
          holes[i].position.set(x, lerp(-1, emY - 0.6, v), z);
        }
        const f = (u - meet) / 0.18;
        flashes[i].visible = vis && f > 0 && f < 1;
        if (flashes[i].visible) { flashes[i].position.set(x, emY, z); flashes[i].scale.setScalar(0.4 + 2.2 * Math.sin(Math.PI * f)); }
        const g = (u - meet) / (1 - meet);
        phot[i].visible = vis && g > 0.05;
        if (phot[i].visible) phot[i].position.set(x + g * 2, lerp(emY, top + 26, g), z);
      }
    }
  };
}

// ------------------------------------------------------------------ 3. Lithium-ion cell: cathode | separator | anode
export function buildLiIon() {
  const root = new THREE.Group();
  const cath = new THREE.Group(), an = new THREE.Group();
  root.add(cath, an);
  const oxide = mat(0x6d5a8a, { roughness: 0.5 }), carbon = mat(0x2d3036, { roughness: 0.55, metalness: 0.3 });
  const sepMat = mat(0xe9ecef, { transparent: true, opacity: 0.55, roughness: 0.8 });
  const foilA = mat(0xb7bcc2, { metalness: 1, roughness: 0.35 }), foilC = mat(0xc9824c, { metalness: 1, roughness: 0.35 });
  // cathode: layered metal-oxide planes (left), on aluminium foil
  box(2, 44, 40, foilA, -42, 22, 0, root);
  for (let i = 0; i < 7; i++) box(28, 2.2, 36, oxide, -26, 4 + i * 5.6, 0, cath);
  // separator: porous membrane
  const sep = box(1.6, 44, 40, sepMat, 0, 22, 0, root);
  sep.castShadow = false;
  // anode: graphite (carbon) sheets (right), on copper foil
  box(2, 44, 40, foilC, 42, 22, 0, root);
  for (let i = 0; i < 9; i++) box(28, 1.4, 36, carbon, 26, 3.5 + i * 4.4, 0, an);
  // electrolyte tint
  const ely = box(84, 44, 40, mat(0x6fb6d6, { transparent: true, opacity: 0.08, depthWrite: false }), 0, 22, 0, root);
  ely.castShadow = false;
  const ion = glowMat(0xd6a8ff, 1.8);
  const ions = pool(60, ion, 0.95, root);
  const eMat = glowMat(0x5fd8ff, 2.2);
  const elec = pool(24, eMat, 0.7, root);
  // external circuit: arc over the top from anode foil to cathode foil
  const arc = new THREE.CatmullRomCurve3([V(42, 46, 0), V(30, 62, 0), V(0, 70, 0), V(-30, 62, 0), V(-42, 46, 0)]);
  const wire = new THREE.Mesh(new THREE.TubeGeometry(arc, 60, 0.6, 8, false), mat(0x8a8f96, { metalness: 1, roughness: 0.35 }));
  root.add(wire);
  return {
    root,
    anchors: { cathode: () => V(-26, 42, 18), separator: () => V(0, 45, 18), anode: () => V(26, 42, 18), wire: () => arc.getPoint(0.5) },
    // p.charge: 0 = all ions in cathode, 1 = all in anode; p.flow: electrons in the wire (discharge)
    update(t, p) {
      const c = p.charge ?? 0;
      ions.forEach((m, i) => {
        const row = i % 7, k = Math.floor(i / 7);
        const from = V(-38 + k * 3.2, 6.8 + row * 5.6, (hash(i, 2) - 0.5) * 30);
        const arow = i % 9;
        const to = V(14 + (i % 8) * 3.2, 5.7 + arow * 4.4, (hash(i, 5) - 0.5) * 30);
        const d = clamp01((c * 1.6 - hash(i, 3) * 0.6));
        const u = ease.inOut(d);
        m.position.lerpVectors(from, to, u);
        m.position.y += Math.sin(Math.PI * u) * 3 * (hash(i, 8) - 0.5);
        m.visible = true;
      });
      elec.forEach((e, i) => {
        const u = ((t * 0.35 + i / elec.length) % 1);
        e.visible = (p.flow || 0) > 0.05;
        e.position.copy(arc.getPoint(u));
      });
    }
  };
}

// ------------------------------------------------------------------ 4. Hall-effect sensor
export function buildHall() {
  const root = new THREE.Group();
  const chip = box(60, 3, 30, mat(0x2a2d33, { roughness: 0.5 }), 0, 1.5, 0, root);
  const plate = box(40, 0.6, 16, mat(0x8fa2b8, { metalness: 0.5, roughness: 0.35 }), 0, 3.3, 0, root);
  for (const sx of [-1, 1]) box(4, 1.2, 16, mat(0xd2a24c, { metalness: 1, roughness: 0.3 }), sx * 22, 3.6, 0, root);
  const sideA = box(36, 1.0, 2, glowMat(0xff6a5a, 0.0), 0, 3.6, -9, root), sideB = box(36, 1.0, 2, glowMat(0x5fd8ff, 0.0), 0, 3.6, 9, root);
  const magnet = new THREE.Group();
  box(26, 8, 14, mat(0xc0392b, { roughness: 0.4 }), 0, 4, 0, magnet);
  box(26, 8, 14, mat(0x2e5fb3, { roughness: 0.4 }), 0, 12, 0, magnet);
  root.add(magnet);
  const eMat = glowMat(0x5fd8ff, 2.2);
  const elec = pool(40, eMat, 0.55, root);
  // field lines (tubes) from the magnet down through the plate
  const fieldMat = new THREE.MeshBasicMaterial({ color: 0xff8a6a, transparent: true, opacity: 0.0 });
  const fields = [-8, -3, 3, 8].map((x) => {
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(V(x, 0, 0), V(x, -18, 0)), 4, 0.25, 6), fieldMat);
    magnet.add(m);
    return m;
  });
  return {
    root,
    anchors: { magnet: () => magnet.localToWorld(V(13, 16, 0)), sensor: () => V(20, 4, 8), plus: () => V(0, 4, 10), minus: () => V(0, 4, -10) },
    // p.near: 0 magnet far away, 1 right above the sensor
    update(t, p) {
      const n = p.near || 0;
      magnet.position.set(lerp(70, 0, n), 10 + lerp(10, 0, n), 0);
      fieldMat.opacity = 0.6 * n;
      sideA.material.emissiveIntensity = 2.0 * n;
      sideB.material.emissiveIntensity = 2.0 * n;
      elec.forEach((e, i) => {
        const u = ((t * 0.3 + hash(i, 1)) % 1);
        const z0 = (hash(i, 2) - 0.5) * 12;
        e.visible = (p.flow ?? 1) > 0.05;
        // the field pushes electrons towards one edge as they travel
        const z = lerp(z0, -7.2, n * ease.out(u));
        e.position.set(lerp(-20, 20, u), 4.1, z);
      });
    }
  };
}

// ------------------------------------------------------------------ 5. Image-sensor pixels: microlens, colour filter, photodiode
export function buildPixels() {
  const root = new THREE.Group();
  const N = 6, P = 10;
  const filt = { R: mat(0xd2363a, { transparent: true, opacity: 0.8 }), G: mat(0x2fae55, { transparent: true, opacity: 0.8 }), B: mat(0x2d57d4, { transparent: true, opacity: 0.8 }) };
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0xdfe8f2, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.55, clearcoat: 1 });
  const wellMat = mat(0x2a3040, { roughness: 0.6, transparent: true, opacity: 0.35, depthWrite: false });
  const siMat = mat(0x3d4352, { roughness: 0.5, metalness: 0.2 });
  // silicon block, cut away in front of the last row so the wells (photodiodes) can be seen
  box(N * P + 4, 10, (N - 1) * P + 2, siMat, 0, -5, -P / 2 - 1, root);
  box(N * P + 4, 2, P + 2, siMat, 0, -11, (N - 1) * P / 2, root);
  const fills = [];
  const eMat = glowMat(0x5fd8ff, 1.8);
  const lensGeo = new THREE.SphereGeometry(4.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const x = (i - (N - 1) / 2) * P, z = (j - (N - 1) / 2) * P;
    const c = i % 2 === 0 ? (j % 2 === 0 ? 'G' : 'R') : (j % 2 === 0 ? 'B' : 'G');
    const front = j === N - 1;
    const wl = box(8, 9.5, 8, wellMat, x, -5.25, z, root);
    wl.castShadow = false;
    if (!front) {
      const f = box(9.4, 1.6, 9.4, filt[c], x, 1.0, z, root);
      f.castShadow = false;
      const l = new THREE.Mesh(lensGeo, lensMat);
      l.position.set(x, 1.8, z);
      l.scale.set(1, 0.6, 1);
      root.add(l);
    }
    // electrons filling the well (a glowing column that rises)
    const fill = box(6.4, 1, 6.4, eMat, x, -9.5, z, root);
    fill.castShadow = false;
    fill.userData.k = c === 'G' ? 1 : c === 'R' ? 0.7 : 0.5;
    fills.push(fill);
  }
  const phot = pool(60, glowMat(0xfff1c9, 3.0), 0.5, root);
  return {
    root,
    anchors: { lens: () => V(-25, 5, 15), filter: () => V(25, 1.5, 18), diode: () => V(15, -6, 26) },
    // p.light: incoming light 0..1, p.fill: how full the wells are 0..1
    update(t, p) {
      fills.forEach((f) => { const h = 0.1 + 8.0 * (p.fill || 0) * f.userData.k; f.scale.y = h; f.position.y = -9.9 + h / 2; });
      phot.forEach((m, i) => {
        const u = ((t * 0.55 + hash(i, 1)) % 1);
        m.visible = (p.light || 0) > 0.05;
        const x = (Math.floor(hash(i, 2) * N) - (N - 1) / 2) * P + (hash(i, 6) - 0.5) * 3;
        const z = (Math.floor(hash(i, 3) * N) - (N - 1) / 2) * P + (hash(i, 7) - 0.5) * 3;
        m.position.set(lerp(x * 1.6, x, u), lerp(40, -2, u), lerp(z * 1.6, z, u));
      });
    }
  };
}

// ------------------------------------------------------------------ 6. Vapor chamber, cut open
export function buildVaporChamber() {
  const root = new THREE.Group();
  const cu = mat(0xb9805f, { metalness: 1, roughness: 0.4 });
  const cuCut = mat(0xd89a72, { metalness: 0.6, roughness: 0.5 });
  box(120, 3, 40, mat(0xb9805f, { metalness: 1, roughness: 0.4, transparent: true, opacity: 0.28, depthWrite: false }), 0, 12, 0, root); // top plate (see-through)
  box(120, 3, 40, cu, 0, 0, 0, root);            // bottom plate
  for (const sx of [-1, 1]) box(3, 15, 40, cu, sx * 60, 6, 0, root);
  const wick = box(116, 1.4, 38, mat(0x9a6a4a, { roughness: 0.9 }), 0, 2.2, 0, root);
  const wickTop = box(116, 1.4, 38, mat(0x9a6a4a, { roughness: 0.9, transparent: true, opacity: 0.35, depthWrite: false }), 0, 9.8, 0, root);
  // the chip below, glowing hot
  const chip = box(30, 4, 26, mat(0x26272b, { emissive: 0xff7a2f, emissiveIntensity: 0 }), -35, -3.6, 0, root);
  const pad = box(32, 1.4, 28, mat(0x8a8f96, { metalness: 0.6, roughness: 0.6 }), -35, -0.9, 0, root);
  const liquid = box(34, 0.8, 30, new THREE.MeshPhysicalMaterial({ color: 0x5fb8e0, transparent: true, opacity: 0.6, roughness: 0.1 }), -35, 3.3, 0, root);
  const bub = pool(40, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, roughness: 0.1 }), 1.1, root);
  const vap = pool(70, glowMat(0xffb38a, 1.8), 0.9, root);
  const drops = pool(40, glowMat(0x5fd8ff, 2.0), 0.95, root);
  return {
    root,
    anchors: { chip: () => V(-35, -6, 14), pad: () => V(-20, -1, 16), vapor: () => V(0, 7, 16), cond: () => V(40, 11, 16), wick: () => V(20, 2, 16) },
    // p.heat: chip heat 0..1, p.cycle: show the boil / spread / condense / return cycle
    update(t, p) {
      const h = p.heat || 0, c = p.cycle || 0;
      chip.material.emissiveIntensity = 1.4 * h;
      bub.forEach((b, i) => {
        const u = ((t * 1.2 + hash(i, 1)) % 1);
        b.visible = c > 0.05;
        b.position.set(-35 + (hash(i, 2) - 0.5) * 28, 3.4 + u * 4, (hash(i, 3) - 0.5) * 26);
        b.scale.setScalar(0.3 + 0.7 * u);
      });
      vap.forEach((v, i) => {
        const u = ((t * 0.45 + hash(i, 4)) % 1);
        v.visible = c > 0.05;
        v.position.set(lerp(-35, 50, u), 6 + Math.sin(u * 9 + i) * 1.5, (hash(i, 5) - 0.5) * 30);
        v.material.color.setRGB(1, lerp(0.7, 0.9, u), lerp(0.55, 1, u));
      });
      drops.forEach((d, i) => {
        const u = ((t * 0.35 + hash(i, 6)) % 1);
        d.visible = c > 0.05;
        // condense on the cool end, then wick back along the bottom
        d.position.set(u < 0.25 ? 40 + (hash(i, 7) - 0.5) * 30 : lerp(50, -30, (u - 0.25) / 0.75), u < 0.25 ? lerp(9.6, 3, u / 0.25) : 2.6, (hash(i, 8) - 0.5) * 30);
      });
    }
  };
}

// a standard micro stage camera helper: orbit around a target
export function orbitCam(cam, target, dist, az, el, fov = 35) {
  const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(el);
  cam.position.set(target.x + dist * Math.cos(e) * Math.sin(a), target.y + dist * Math.sin(e), target.z + dist * Math.cos(e) * Math.cos(a));
  cam.lookAt(target);
  cam.fov = fov;
  cam.updateProjectionMatrix();
}
