// INSIDE THE iPHONE DUO · 06 CAMERAS
// Phone face down, camera bar up: the three camera modules rise into a row; main and ultra wide are named,
// the sensor shifts, the 2x crop is shown, the lens stacks lift off their sensors, then the selfie cameras.
import { Stage, Labels, THREE, cameraPath, prog, ease, clamp01, lerp, keys } from './engine.js';
import { buildPixels, revealMicro } from './microduo.js';
import { Looks, noLook, TraceLine } from './fx.js';
import { loadDuo, foldRig, floorY, topOf, centreOf, explode, orb } from './duo.js';
import { at, end, start, LAST } from './vo.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CYAN = 0x5fd8ff, AMBER = 0xffb347, WHITE = 0xe8f4ff, GREEN = 0x6ee7a8;

export async function init(el) {
  const S = new Stage(el.macro);
  const { phone, cameras } = await loadDuo(S, ['phone', 'cameras']);
  const looks = new Looks();
  const labels = new Labels(el.labels, S);
  const P = (n) => phone.part(n), C = (n) => cameras.part(n);

  const T = {
    four: at('k1', 'four'), modules: at('k1', 'modules'),
    fusion: at('k2', 'fusion'), light: at('k2', 'light'), shifts: at('k2', 'shifts'), hands: at('k2', 'hands'),
    ultra: at('k3', 'ultra'), hundred: at('k3', '120'), macro: at('k3', 'macro'),
    telephoto: at('k4', 'telephoto'), middle: at('k4', 'middle'), zoom: at('k4', 'zoom'),
    stack: at('k5', 'stack'), sensor: at('k5', 'sensor'),
    zoom2: at('k6', 'zoom'), photodiodes: at('k6', 'photodiodes'), lens: at('k6', 'lens'), filter: at('k6', 'filter'), twice: at('k6', 'twice'), green: at('k6', 'green', 2),
    hits: at('k7', 'hits'), electrons: at('k7', 'electrons'), brighter: at('k7', 'brighter'), counts: at('k7', 'counts'), image: at('k7', 'image'),
    selfies: at('k8', 'selfies'), center: at('k8', 'center'), thin: at('k8', 'thin'), inside: at('k8', 'inside', 2), verdict: end('k8'),
    tricks: at('k9', 'tricks'), tent: at('k9', 'tent'), smart: at('k9', 'smart'), ready: at('k9', 'ready'), dual: at('k9', 'dual'), themselves: at('k9', 'themselves'), sound: at('k9', 'sound'),
    standard: at('k3', 'standard')
  };

  // ---------------------------------------------------------------- phone: open, flipped so the camera bar faces up
  const rig = foldRig(phone, 'right');
  const yOpen = floorY(phone) + 0.02;
  rig.place(V(0, yOpen + 0.5, 0), new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI));
  rig.set(0);
  phone.root.updateWorldMatrix(true, true);
  const pb = new THREE.Box3().setFromObject(phone.root);
  rig.place(V(0, yOpen + 0.5 - pb.min.y + 0.02, 0), new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI));
  rig.set(0);
  S.scene.updateMatrixWorld(true);
  const bar = centreOf(P('Camera_Bar'));
  // camera modules: rise from the bar into a row above the phone
  const ROW = V(0, 5.2, 1.2);
  const rise = (t) => prog(t, T.four - 0.3, T.modules + 0.6);
  const ROT = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.18, 0, 0));
  const lensUp = (t) => prog(t, T.stack - 0.2, T.stack + 1.0) * (1 - prog(t, end('k7') + 0.2, end('k7') + 1.0));
  const sensorPeek = (t) => 0.55 * (prog(t, T.shifts - 0.6, T.shifts) - prog(t, end('k2'), end('k2') + 0.5));
  const mainSensor = C('Main_Image_Sensor'), msBase = mainSensor.position.clone();

  // the dual module starts 1:1 inside its housing in the phone: same place, same lens order (the studio model
  // is mirrored relative to the phone, so it starts turned half a turn about Y and turns back as it rises)
  const housing = centreOf(P('Rear_Dual_Camera'));
  const ROT0 = ROT.clone().multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.PI));
  cameras.root.position.set(0, 0, 0);
  cameras.root.quaternion.copy(ROT0);
  S.scene.updateMatrixWorld(true);
  const START = housing.clone().sub(centreOf(C('Rear_Dual_Camera'))).add(V(0, -0.15, 0));

  // light rays into the main lens, onto its sensor (built once, at the lifted-lens pose of k5)
  cameras.root.position.copy(ROW);
  cameras.root.quaternion.copy(ROT);
  explode(cameras, 1, 1.2);
  S.scene.updateMatrixWorld(true);
  const lt0 = topOf(C('Main_Lens_48MP')), sc0 = centreOf(C('Main_Image_Sensor'));
  explode(cameras, 0, 1.2);
  const rays = [-0.7, 0, 0.7].map((dx) => {
    const tr = new TraceLine([lt0.clone().add(V(dx, 4, 0)), lt0.clone().add(V(dx * 0.25, 0, 0)), sc0.clone().add(V(dx * 0.08, 0.05, 0))], { radius: 0.025, color: 0xfff1c9, tail: 0.5, residual: 0.25, intensity: 4 });
    S.scene.add(noLook(tr.mesh));
    tr.set(0, 0);
    return tr;
  });

  // ---------------------------------------------------------------- labels
  const lab = (text, t0, t1, anchor, dx, dy, color, size) => labels.add({ text, t0, t1, anchor, dx, dy, color, size });
  lab('48 MP Fusion Main · 26 mm · f/1.6', T.fusion - 0.2, T.shifts - 0.2, () => topOf(C('Main_Lens_48MP')), 150, -140);
  lab('Sensor-shift stabilization', T.shifts - 0.1, end('k2') + 0.3, () => centreOf(mainSensor), 160, 120, '#9fe6ff');
  lab('48 MP Ultra Wide · 13 mm · f/2.2', T.ultra - 0.2, end('k3') + 0.2, () => topOf(C('Ultrawide_Lens_48MP')), -190, -130);
  lab('Lens stack', T.stack, T.sensor - 0.1, () => topOf(C('Main_Lens_48MP')), 160, -130);
  lab('Image sensor', T.sensor, T.zoom2 - 0.2, () => centreOf(C('Main_Image_Sensor')), 160, 120, '#9fe6ff');
  lab('12 MP Center Stage · outer screen', T.center - 0.2, T.inside - 0.2, () => topOf(C('Outer_Selfie_Camera')), 150, -140);
  lab('Smart Capture', T.smart - 0.1, T.dual - 0.2, () => centreOf(P('True_Tone_Flash')), 150, -130, '#fff1c9');
  lab('Dual-screen preview', T.dual, end('k9') - 0.2, () => centreOf(P('Outer_Display_Glass')), -190, -130);
  lab('Standard-iPhone class', T.standard - 0.2, end('k3') + 0.3, () => topOf(C('Rear_Dual_Camera')), 150, -130, '#9fe6ff');
  lab('Under-display camera · inner screen', T.inside - 0.1, T.verdict - 0.1, () => topOf(C('Inner_Selfie_Camera')), -190, -140);

  // ---------------------------------------------------------------- micro: image-sensor pixels
  const MS = new Stage(el.micro, { floor: false, background: 0x06080b, fog: [300, 1200] });
  MS.setShadowFocus(V(0, 0, 0), 60);
  const px = buildPixels();
  MS.scene.add(px.root);
  const mlabels = new Labels(el.mlabels, MS);
  const ml = (text, t0, t1, n, dx, dy, color) => mlabels.add({ text, t0, t1, anchor: px.anchors[n], dx, dy, color });
  ml('Photodiodes (light wells)', T.photodiodes - 0.2, T.lens - 0.1, 'diode', 160, 120, '#9fe6ff');
  ml('Microlens', T.lens - 0.1, end('k6') - 0.2, 'lens', -160, -130, '#dfe9f5');
  ml('Color filter · 2 green : 1 red : 1 blue', T.filter - 0.1, end('k6') - 0.2, 'filter', 160, -130, '#8ff0a8');
  ml('Light knocks electrons loose', T.hits, T.counts - 0.2, 'diode', 160, 120, '#5fd8ff');
  ml('Brighter light, more electrons', T.brighter, end('k7') - 0.4, 'filter', 160, -130, '#fff1c9');
  const loupeK = keys([[0, 0], [T.zoom2 - 0.4, 0], [T.zoom2 + 0.4, 1, 'out'], [T.zoom2 + 1.0, 1], [T.zoom2 + 2.0, 2, 'in'], [end('k7') - 0.9, 2], [end('k7') + 0.1, 0, 'in']]);
  const pcam = cameraPath([
    { t: 0, pos: [70, 75, 95], look: [0, 0, 0], fov: 34 },
    { t: T.zoom2 + 2.0, pos: [60, 62, 85], look: [0, 0, 0], fov: 34 },
    { t: T.filter + 0.4, pos: [35, 30, 60], look: [0, -1, 0], fov: 34 },
    { t: T.hits + 0.4, pos: [30, 34, 82], look: [0, -3, 0], fov: 34 },
    { t: end('k7'), pos: [-40, 48, 75], look: [0, 0, 0], fov: 34 }
  ], { hold: 0.2 });

  // ---------------------------------------------------------------- camera
  const cm = (n) => { cameras.root.position.copy(ROW); cameras.root.quaternion.copy(ROT); S.scene.updateMatrixWorld(true); return centreOf(C(n)); };
  const mainC = cm('Rear_Dual_Camera'), uwC = cm('Ultrawide_Lens_48MP'), mlC = cm('Main_Lens_48MP'), inC = cm('Inner_Selfie_Camera'), ouC = cm('Outer_Selfie_Camera');
  const k = (t, p, dist, az, el, fov = 31) => orb(t, [p.x, p.y, p.z], dist, az, el, fov);
  const camKeys = [
    orb(0, [bar.x * 0.6, 0.8, -1], 34, -14, 50, 33),
    orb(T.four - 0.2, [bar.x, 1.2, bar.z], 20, -10, 54, 32),
    orb(T.modules + 0.8, [0, 4.6, 1.2], 22, -14, 30, 31),
    k(T.fusion + 0.2, mlC, 10, 12, 38),
    k(T.shifts + 0.4, mlC, 9, 26, 18),
    k(T.ultra + 0.2, uwC, 10, -16, 40),
    k(T.macro + 0.4, uwC, 11, -8, 46),
    k(T.middle + 0.3, mainC, 13, 4, 50),
    k(T.stack + 0.6, mainC, 13, -24, 20),
    k(T.zoom2 + 0.6, mainC, 9, -6, 34),
    k(end('k7') + 0.4, mainC, 12, -10, 26),
    k(T.center + 0.2, ouC, 10, 18, 42),
    k(T.inside + 0.3, inC, 10, -10, 40),
    orb(T.tricks + 0.4, [0, 3.5, 0], 34, 30, 22, 32),
    orb(T.ready + 0.4, [0, 3.5, 0], 30, -70, 22, 31),
    orb(T.themselves, [0, 3.5, 0], 30, 70, 22, 31),
    orb(LAST + 3.0, [0, 3.5, 0], 34, 50, 22, 32)
  ];
  const cam = cameraPath(camKeys, { hold: 0.22 });

  // ====================================================================== per frame
  return (t) => {
    // ---- modules rise from the camera bar into the row
    const u = rise(t);
    // straight up out of the housing first, then across to the row while turning to face the camera
    const up = prog(u, 0, 0.3), across = prog(u, 0.25, 1, ease.inOut);
    const p = START.clone().add(V(0, 2.2 * up, 0)).lerp(ROW, across);
    cameras.root.position.copy(p);
    cameras.root.quaternion.copy(ROT0).slerp(ROT, across);
    looks.opacity(cameras.root, prog(t, T.four - 0.4, T.four + 0.2));
    cameras.root.visible = t > T.four - 0.45 && t < T.tricks + 0.4;
    if (t > T.tricks - 0.8) looks.opacity(cameras.root, 1 - prog(t, T.tricks - 0.8, T.tricks));
    // k9: the phone stands up like a tent (screen facing the subject), the flash fires, the outer screen previews
    if (t > T.tricks - 0.6) {
      const u = prog(t, T.tricks - 0.6, T.tent + 0.6);
      const q = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), lerp(Math.PI, -2 * Math.PI / 3, u));
      rig.place(V(0, 2, 0), q);
      rig.set(0.667 * u);
      phone.root.updateWorldMatrix(true, true);
      const bb = new THREE.Box3().setFromObject(phone.root);
      phone.root.position.y += 0.02 - bb.min.y;
    }
    // lens barrels up, sensors down (studio explode offsets), plus a sensor peek during k2
    explode(cameras, Math.max(lensUp(t), sensorPeek(t)), 1.2);
    const jig = prog(t, T.shifts - 0.1, T.shifts + 0.3) * (1 - prog(t, end('k2'), end('k2') + 0.4));
    mainSensor.position.x += 0.012 * jig * Math.sin(t * 9.0);
    mainSensor.position.z += 0.009 * jig * Math.sin(t * 7.1 + 1);
    // ---- glows
    const pl = (t0, t1, a = 0.55) => a * (prog(t, t0 - 0.2, t0 + 0.3) - prog(t, t1 - 0.3, t1 + 0.2));
    looks.glow(P('Camera_Bar'), CYAN, pl(T.four - 0.8, T.four + 0.6, 0.6));
    looks.glow(C('Main_Lens_48MP'), CYAN, pl(T.fusion, T.shifts, 0.45));
    looks.glow(mainSensor, CYAN, pl(T.shifts, end('k2') + 0.2, 0.7));
    looks.glow(C('Ultrawide_Lens_48MP'), CYAN, pl(T.ultra, end('k3'), 0.45));
    looks.glow(C('Main_Image_Sensor'), CYAN, pl(T.sensor, T.zoom2 + 0.4, 0.7));
    looks.glow(C('Outer_Selfie_Camera'), CYAN, pl(T.center, T.inside, 0.5));
    looks.glow(C('Inner_Selfie_Camera'), CYAN, pl(T.inside, T.verdict, 0.5));
    const flash = Math.max(0, Math.sin((t - T.ready) * 18)) * (prog(t, T.ready - 0.1, T.ready) - prog(t, T.ready + 0.5, T.ready + 0.6));
    looks.glow(P('True_Tone_Flash'), 0xfff1c9, Math.max(pl(T.smart, T.ready, 0.5), flash));
    looks.glow(P('Outer_Display_Glass'), CYAN, pl(T.dual, T.sound, 0.3));
    // ---- light rays through the main lens onto its sensor
    const ra = prog(t, T.stack + 0.6, T.stack + 1.2) * (1 - prog(t, T.zoom2 - 0.2, T.zoom2 + 0.3));
    rays.forEach((r) => r.set(ra > 0 ? prog(t, T.stack + 0.6, T.sensor + 0.4) * 1.1 : 0, ra));

    // ---- camera, render, labels (macro skipped while the micro view fills the frame)
    const kk = loupeK(t);
    cam(t, S.camera);
    S.setShadowFocus(V(0, 2, 0), 14);
    looks.apply();
    if (kk < 1.99) S.render();
    labels.update(t);
    el.labels.style.opacity = kk >= 1.5 ? 0 : 1;
    const sp = S.project(centreOf(C('Main_Image_Sensor')));
    if (revealMicro(el, kk, sp.x, sp.y)) {
      px.update(t, { light: prog(t, T.hits - 0.6, T.hits), fill: prog(t, T.hits, T.counts + 0.4) });
      pcam(t, MS.camera);
      MS.render();
      mlabels.update(t);
    }

    // ---- 2x crop inset
    const ia = prog(t, T.middle - 0.4, T.middle + 0.2) * (1 - prog(t, end('k4') + 0.1, end('k4') + 0.6));
    el.scope.style.opacity = ia;
    if (ia > 0) drawCrop(el.scope, prog(t, T.middle, T.zoom + 0.4));

    // ---- overlays
    el.chapter.style.opacity = prog(t, 0.6, 1.1) * (1 - prog(t, 5.6, 6.2));
    el.chapNum.textContent = '06';
    el.chapName.textContent = 'CAMERAS';
    const b1 = prog(t, T.four - 0.1, T.four + 0.3) * (1 - prog(t, end('k1') + 0.4, end('k1') + 0.8));
    const b2 = prog(t, T.hundred - 0.1, T.hundred + 0.3) * (1 - prog(t, end('k3') + 0.1, end('k3') + 0.5));
    el.big.style.opacity = Math.max(b1, b2);
    if (b1 > 0) { el.bigNum.textContent = '4 cameras'; el.bigSub.textContent = 'in 3 modules'; }
    else if (b2 > 0) { el.bigNum.textContent = '120°'; el.bigSub.textContent = 'ultra wide field of view'; }
    el.title.style.opacity = 0;
    el.fade.style.opacity = Math.max(1 - prog(t, 0.0, 0.8), prog(t, LAST + 2.2, LAST + 3.1));
    el.endcard.style.opacity = prog(t, LAST + 2.3, LAST + 3.0);
    const n = el.endcard.querySelector('#stage-endname');
    if (n && n.textContent !== 'SOUND & TOUCH') n.textContent = 'SOUND & TOUCH';
    el.scale.style.opacity = 0;
    el.loupe.style.opacity = 0;
  };
}

// 2x zoom: the 48 MP sensor with its middle quarter (12 MP) highlighted
function drawCrop(cv, u) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  g.fillStyle = 'rgba(6,10,15,0.9)';
  g.strokeStyle = 'rgba(95,216,255,0.4)';
  g.lineWidth = 2;
  g.beginPath(); g.roundRect(1, 1, W - 2, H - 2, 18); g.fill(); g.stroke();
  const sw = 300, sh = 200, sx = 40, sy = 70;
  // full sensor: fine pixel grid
  g.fillStyle = '#20263a';
  g.fillRect(sx, sy, sw, sh);
  g.strokeStyle = 'rgba(120,140,190,0.35)';
  g.lineWidth = 1;
  for (let i = 0; i <= 24; i++) { g.beginPath(); g.moveTo(sx + (i * sw) / 24, sy); g.lineTo(sx + (i * sw) / 24, sy + sh); g.stroke(); }
  for (let j = 0; j <= 16; j++) { g.beginPath(); g.moveTo(sx, sy + (j * sh) / 16); g.lineTo(sx + sw, sy + (j * sh) / 16); g.stroke(); }
  // middle crop
  const cw = sw / 2, ch = sh / 2, cx = sx + sw / 4, cy = sy + sh / 4;
  g.strokeStyle = '#5fd8ff';
  g.lineWidth = 4;
  g.shadowColor = '#5fd8ff';
  g.shadowBlur = 14 * u;
  g.strokeRect(cx, cy, cw, ch);
  g.shadowBlur = 0;
  // enlarged result on the right
  const ex = 380, ey = 70, ew = 200 * (0.6 + 0.4 * u), eh = 133 * (0.6 + 0.4 * u);
  g.globalAlpha = u;
  g.fillStyle = '#2a3350';
  g.fillRect(ex, ey, ew, eh);
  g.strokeStyle = '#5fd8ff';
  g.strokeRect(ex, ey, ew, eh);
  g.globalAlpha = 1;
  g.fillStyle = '#e9f7ff';
  g.font = '600 30px Saira, sans-serif';
  g.fillText('48 MP SENSOR', 34, 40);
  g.fillStyle = '#5fd8ff';
  g.textAlign = 'right';
  g.fillText('2× = 12 MP CROP', W - 34, 40);
  g.textAlign = 'left';
}
