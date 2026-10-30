// INSIDE THE iPHONE DUO · 03 THE SCREEN (v2)
// The inner display lifts off the phone and fans out into a staircase of layers; each layer is explained,
// with magnified insets (bending, nano-texture, touch field, filters, subpixels, pixel gaps) and a loupe
// dive into a single OLED subpixel.
import { Stage, Labels, THREE, cameraPath, prog, ease, clamp01, lerp, keys } from './engine.js';
import { Looks, worldPose } from './fx.js';
import { loadDuo, foldRig, floorY, topOf, orb } from './duo.js';
import { buildOLED, revealMicro } from './microduo.js';
import { at, end, start, LAST } from './vo.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CYAN = 0x5fd8ff, WHITE = 0xe8f4ff;

export async function init(el) {
  const S = new Stage(el.macro);
  const { phone, display } = await loadDuo(S, ['phone', 'display']);
  const looks = new Looks();
  const labels = new Labels(el.labels, S);
  const P = (n) => phone.part(n), D = (n) => display.part(n);

  const T = {
    glass: at('d1', 'glass'), fold: at('d1', 'fold'), flexible: at('d1', 'flexible'), ten: at('d1', 'ten'), layers: at('d1', 'layers'),
    thin: at('d2', 'thin'), outside: at('d2', 'outside'), thinner: at('d2', 'thinner'), possible: at('d2', 'possible'),
    cover: at('d3', 'cover'), microscope: at('d3', 'microscope'), glare: at('d3', 'glare'), replaced: at('d3', 'replaced'),
    glassU: at('dg', 'glass'), another: at('dg', 'another'), dents: at('dg', 'dents'),
    crease: at('d3', 'crease'), foam: at('d10', 'foam'),
    touch: at('d4', 'touch'), mesh: at('d4', 'mesh'), finger: at('d4', 'finger'), touched: at('d4', 'touched'),
    polarizer: at('d5', 'polarizer'), color: at('d5', 'color'), black: at('d5', 'black'),
    lightsrc: at('d6', 'light'), red: at('d6', 'red'), oval: at('d6', 'oval'),
    zoom: at('d7', 'zoom'), sandwich: at('d7', 'sandwich'), electrons: at('d7', 'electrons'), holes: at('d7', 'holes'), meet: at('d7', 'meet'), flash: at('d7', 'flash'), material: at('d7', 'material'),
    transistors: at('d8', 'transistors'),
    camera: at('d9', 'camera'), gaps: at('d9', 'gaps'), lens: at('d9', 'lens'),
    plastic: at('d10', 'plastic'), support: at('d10', 'support'), batteries: at('d10', 'batteries')
  };

  // ---------------------------------------------------------------- phone and the layer stack
  const rig = foldRig(phone, 'right');
  const yOpen = floorY(phone) + 0.02;
  rig.place(V(0, yOpen, 0));
  rig.set(0);
  const home = worldPose(P('Inner_Display_Right'));
  const homeP = V(0, home.p.y, 0);
  const STACK = { p: V(0, 3.2, -6), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0, 0)) };
  const BEND = T.batteries - 3.0;
  const liftU = (t) => prog(t, T.flexible - 0.3, T.flexible + 1.6) * (1 - prog(t, BEND - 2.4, BEND - 0.8));
  const spread = (t) => prog(t, T.ten - 0.4, T.layers + 1.2) * (1 - prog(t, BEND - 3.4, BEND - 2.4));
  const swapA = (t) => prog(t, T.flexible - 0.4, T.flexible) * (1 - prog(t, BEND - 0.9, BEND - 0.6));
  const L = (n) => D(n);
  const LAYERS = ['Cushion_Layer', 'Support_Plate', 'UTG_Lower', 'Back_Film', 'Polyimide_Substrate', 'TFT_Backplane', 'OLED_Emitters', 'Thin_Film_Encapsulation', 'Colour_Filter_Black_Matrix', 'Touch_Sensor', 'UTG_Upper', 'Cover_Adhesive', 'Cover_Layer'];
  const DY = 0.1, DZ = 0.13, N = LAYERS.length;
  const stepOf = (n) => (n === 'Under_Display_Camera_Lens' ? LAYERS.indexOf('TFT_Backplane') : LAYERS.indexOf(n));
  const stair = (f) => {
    for (const n of LAYERS.concat(['Under_Display_Camera_Lens'])) {
      const g = L(n), b = g.userData.basePos, i = stepOf(n);
      g.position.set(b.x, b.y + i * DY * f, b.z + (N - 1 - i) * DZ * f);
    }
  };
  const CMU = 16.6 / 1.6;
  const front = (n) => V(0, STACK.p.y + stepOf(n) * DY * CMU, STACK.p.z + ((N - 1 - stepOf(n)) * DZ + 0.45) * CMU);
  const focusOf = [
    ['Cover_Layer', T.cover - 0.2, T.glassU - 0.3],
    ['UTG_Upper', T.glassU - 0.2, T.another - 0.1],
    ['UTG_Lower', T.another - 0.1, T.touch - 0.3],
    ['Touch_Sensor', T.touch - 0.1, T.polarizer - 0.3],
    ['Colour_Filter_Black_Matrix', T.color - 0.3, T.lightsrc - 0.3],
    ['OLED_Emitters', T.lightsrc - 0.1, end('d7') + 0.2],
    ['TFT_Backplane', T.transistors - 0.2, end('d8') + 0.2],
    ['Under_Display_Camera_Lens', T.camera - 0.1, end('d9') + 0.1],
    ['Polyimide_Substrate', T.plastic - 0.1, T.foam - 0.2],
    ['Cushion_Layer', T.foam - 0.1, T.support - 0.2],
    ['Support_Plate', T.support - 0.1, end('d10') - 1.0]
  ];

  // ---------------------------------------------------------------- labels
  const edge = (n, z = 0.45) => () => L(n).localToWorld(V(0.74, 0, z));
  const lab = (text, t0, t1, anchor, dx, dy, color, size) => labels.add({ text, t0, t1, anchor, dx, dy, color, size });
  lab('Flexible OLED panel', T.flexible + 0.4, T.ten - 0.2, () => topOf(display.root), 150, -130);
  lab('Polymer cover · nano-texture', T.cover - 0.1, T.replaced - 0.2, edge('Cover_Layer'), 140, -110);
  lab('Replaceable on its own', T.replaced - 0.1, end('d3') + 0.3, edge('Cover_Layer'), 140, -110, '#8ff0c2');
  lab('Ultra-thin glass', T.glassU - 0.1, T.another - 0.1, edge('UTG_Upper'), 140, -110, '#bfe9ff');
  lab('Ultra-thin glass · below the panel', T.another - 0.1, end('dg') + 0.2, edge('UTG_Lower'), 140, -110, '#bfe9ff');
  lab('Foam cushion', T.foam - 0.1, T.support - 0.2, edge('Cushion_Layer'), 140, -110, '#dfe9f5');
  lab('Touch sensor · metal mesh', T.touch - 0.1, T.polarizer - 0.3, edge('Touch_Sensor'), 140, -110);
  lab('Color filters + black grid', T.color - 0.2, T.lightsrc - 0.3, edge('Colour_Filter_Black_Matrix'), 140, -110);
  lab('Organic LEDs (RGB)', T.lightsrc - 0.1, T.zoom - 0.2, edge('OLED_Emitters'), -170, -150);
  lab('Thin-film transistors', T.transistors - 0.1, end('d8') + 0.2, edge('TFT_Backplane'), 140, -110);
  lab('Under-display camera', T.camera, end('d9'), () => D('Under_Display_Camera_Lens').localToWorld(V(0, 0, 0)), 150, -140);
  lab('Plastic base (polyimide)', T.plastic - 0.1, T.foam - 0.2, edge('Polyimide_Substrate'), 140, -110, '#ffc56e');
  lab('Metal support plate', T.support - 0.1, end('d10') - 1.0, edge('Support_Plate'), 140, -110, '#dfe9f5');

  // ---------------------------------------------------------------- micro: one OLED subpixel
  const MS = new Stage(el.micro, { floor: false, background: 0x06080b, fog: [300, 1200] });
  MS.setShadowFocus(V(0, 8, 0), 60);
  const oled = buildOLED();
  MS.scene.add(oled.root);
  const mlabels = new Labels(el.mlabels, MS);
  const ml = (text, t0, t1, n, dx, dy, color) => mlabels.add({ text, t0, t1, anchor: oled.anchors[n], dx, dy, color });
  ml('Cathode (−)', T.sandwich, end('d7') - 0.3, 'Cathode', 160, -100, '#dfe9f5');
  ml('Electron layer', T.electrons - 0.2, T.meet - 0.2, 'Electron layer', 160, -60, '#9fe6ff');
  ml('Emitting layer', T.meet - 0.2, end('d7') - 0.3, 'Emitting layer', 170, 0, '#8ff0a8');
  ml('Hole layer', T.holes - 0.2, T.meet - 0.2, 'Hole layer', 160, 60, '#ffb38a');
  ml('Anode (+)', T.sandwich + 0.4, end('d7') - 0.3, 'Anode', 160, 100, '#dfe9f5');
  const loupeK = keys([[0, 0], [T.zoom - 0.4, 0], [T.zoom + 0.4, 1, 'out'], [T.zoom + 1.0, 1], [T.zoom + 2.0, 2, 'in'], [end('d7') - 0.9, 2], [end('d7') + 0.1, 0, 'in']]);
  const mcam = cameraPath([
    { t: 0, pos: [95, 40, 105], look: [0, 8, 0], fov: 34 },
    { t: T.zoom + 2.0, pos: [80, 30, 95], look: [0, 8, 0], fov: 34 },
    { t: T.meet, pos: [50, 22, 70], look: [0, 8, 0], fov: 34 },
    { t: end('d7'), pos: [20, 40, 90], look: [0, 10, 0], fov: 34 }
  ], { hold: 0.2 });

  // ---------------------------------------------------------------- camera
  const fk = (t, n, dist = 30, az = -22, el = 30, fov = 32) => { const p = front(n); return orb(t, [p.x + 3, p.y, p.z - 3], dist, az, el, fov); };
  const camKeys = [
    orb(0, [0, 0.6, 0], 36, -14, 52, 33),
    orb(T.glass + 0.4, [0, 0.6, 0], 30, -6, 60, 32),
    orb(T.flexible + 0.6, [0, 3, -2], 44, -18, 32, 33),
    orb(T.layers + 1.2, [0, 7, 1], 58, -30, 30, 34),
    orb(end('d2'), [0, 7, 1], 56, -22, 32, 34),
    fk(T.cover + 0.4, 'Cover_Layer', 34, -24, 34),
    fk(T.glare, 'Cover_Layer', 32, -18, 36),
    fk(T.glassU + 0.2, 'UTG_Upper', 32, -24, 32),
    fk(T.another + 0.3, 'UTG_Lower', 34, -26, 26),
    fk(T.touch + 0.2, 'Touch_Sensor', 32, -24, 32),
    fk(T.color + 0.2, 'Colour_Filter_Black_Matrix', 32, -28, 30),
    fk(T.oval, 'OLED_Emitters', 30, -22, 30),
    fk(T.zoom + 0.6, 'OLED_Emitters', 18, -12, 28),
    fk(end('d7') + 0.3, 'OLED_Emitters', 30, -22, 30),
    fk(T.transistors + 0.4, 'TFT_Backplane', 32, -24, 26),
    orb(T.camera + 0.6, [4, 6.4, -6.5], 20, -6, 52, 31),
    orb(T.gaps + 0.8, [4, 6.4, -6.5], 17, 8, 56, 31),
    fk(T.plastic + 0.2, 'Polyimide_Substrate', 32, -28, 24),
    fk(T.foam + 0.2, 'Cushion_Layer', 34, -30, 20),
    fk(T.support + 0.4, 'Support_Plate', 34, -30, 22),
    orb(BEND - 2.4, [0, 7, 1], 58, -24, 28, 34),
    orb(BEND + 0.6, [0, 1.2, 0], 36, -18, 32, 33),
    orb(LAST + 3.0, [0, 0.6, 0], 30, -8, 46, 32)
  ];
  const cam = cameraPath(camKeys, { hold: 0.22 });

  // ====================================================================== per frame
  return (t) => {
    const f = 0.85 * (prog(t, BEND - 0.2, BEND + 1.0) - prog(t, T.batteries - 1.6, T.batteries - 0.4));
    rig.set(f);
    const sw = swapA(t);
    for (const n of ['Inner_Display_Left', 'Inner_Display_Right']) if (sw > 0.001) looks.opacity(P(n), 1 - sw);
    const u = liftU(t);
    display.root.position.copy(homeP).lerp(STACK.p, u);
    display.root.position.y += Math.sin(Math.PI * u) * 2;
    display.root.quaternion.identity().slerp(STACK.q, u);
    stair(spread(t));
    if (sw < 0.999) looks.opacity(display.root, sw);
    display.root.visible = sw > 0.003;
    let focus = null;
    for (const [n, t0, t1] of focusOf) if (t >= t0 && t <= t1) focus = n;
    const dimAmt = prog(t, T.cover - 0.4, T.cover + 0.2) * (1 - prog(t, end('d10') - 1.2, end('d10') - 0.6));
    for (const n of LAYERS) {
      if (n === focus) looks.glow(L(n), n === 'OLED_Emitters' ? WHITE : CYAN, n === 'OLED_Emitters' ? 0.15 : 0.32);
      else if (dimAmt > 0) looks.opacity(L(n), sw * (1 - 0.45 * dimAmt));
    }
    if (focus === 'Under_Display_Camera_Lens') looks.glow(L('Under_Display_Camera_Lens'), CYAN, 0.9);

    // ---- macro render (skipped while the micro view fills the frame)
    const k = loupeK(t);
    cam(t, S.camera);
    S.setShadowFocus(V(0, 0, 0), 14);
    looks.apply();
    if (k < 1.99) S.render();
    labels.update(t);
    el.labels.style.opacity = k >= 1.5 ? 0 : 1;
    const op = S.project(L('OLED_Emitters').localToWorld(V(0.3, 0, 0.3)));
    if (revealMicro(el, k, op.x, op.y)) {
      oled.update(t, { on: prog(t, T.meet - 1.2, T.meet - 0.4) });
      mcam(t, MS.camera);
      MS.render();
      mlabels.update(t);
    }

    // ---- magnified insets (scope panel)
    const insets = [
      ['bend', T.outside - 0.4, end('d2') + 0.2],
      ['bumps', T.microscope - 0.2, T.replaced - 0.2],
      ['touch', T.finger - 0.4, end('d4') + 0.3],
      ['filters', T.color, end('d5') + 0.2],
      ['pixels', T.red - 0.2, end('d6') + 0.2],
      ['udc', T.gaps - 0.4, end('d9') + 0.3]
    ];
    let ins = null, ia = 0;
    for (const [kk, t0, t1] of insets) { const a = prog(t, t0, t0 + 0.4) * (1 - prog(t, t1 - 0.3, t1 + 0.1)); if (a > ia) { ia = a; ins = kk; } }
    el.scope.style.opacity = k > 0.01 ? 0 : ia;
    if (ia > 0) drawInset(el.scope, ins, t, { thin: prog(t, T.thinner - 0.3, T.thinner + 0.6) });

    // ---- overlays
    el.chapter.style.opacity = prog(t, 0.6, 1.1) * (1 - prog(t, 5.6, 6.2));
    el.chapNum.textContent = '03';
    el.chapName.textContent = 'THE SCREEN';
    const b1 = prog(t, T.ten - 0.1, T.ten + 0.4) * (1 - prog(t, end('d1') - 0.2, end('d1') + 0.4));
    el.big.style.opacity = b1;
    if (b1 > 0) { el.bigNum.textContent = '10+ layers'; el.bigSub.textContent = 'each one has to bend'; }
    el.title.style.opacity = 0;
    el.fade.style.opacity = Math.max(1 - prog(t, 0.0, 0.8), prog(t, LAST + 2.2, LAST + 3.1));
    el.endcard.style.opacity = prog(t, LAST + 2.3, LAST + 3.0);
    const n = el.endcard.querySelector('#stage-endname');
    if (n && n.textContent !== 'TWO BATTERIES') n.textContent = 'TWO BATTERIES';
    el.scale.style.opacity = 0;
  };
}

// Magnified panel: procedural micro-structure of the layer being described
function drawInset(cv, kind, t, o = {}) {
  const g = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  g.clearRect(0, 0, W, H);
  g.save();
  g.fillStyle = 'rgba(6,10,15,0.9)';
  g.strokeStyle = 'rgba(95,216,255,0.4)';
  g.lineWidth = 2;
  g.beginPath(); g.roundRect(1, 1, W - 2, H - 2, 18); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(14, 50, W - 28, H - 64, 12); g.clip();
  const x0 = 14, y0 = 50, w = W - 28, h = H - 64;
  const drift = t * 6;
  if (kind === 'bend') {
    // two sheets bent round the same radius: thick (left) and thin (right); red = stretched, blue = squeezed
    g.fillStyle = '#0b0f15'; g.fillRect(x0, y0, w, h);
    const arc = (cx, thick, label) => {
      const R = 70, cy = y0 + h - 40;
      for (let i = 0; i < 24; i++) {
        const a0 = Math.PI + (i / 24) * Math.PI, a1 = Math.PI + ((i + 1) / 24) * Math.PI;
        for (let k = 0; k < 6; k++) {
          const r0 = R + (k / 6) * thick, r1 = R + ((k + 1) / 6) * thick;
          const s = (k + 0.5) / 6 - 0.5; // -0.5 inner .. +0.5 outer
          const amt = Math.abs(s) * thick / 16;
          g.fillStyle = s > 0 ? `rgba(255,${Math.round(120 - amt * 90)},${Math.round(100 - amt * 80)},${0.35 + amt})` : `rgba(${Math.round(100 - amt * 80)},${Math.round(150 - amt * 60)},255,${0.35 + amt})`;
          g.beginPath(); g.arc(cx, cy, r1, a0, a1); g.arc(cx, cy, r0, a1, a0, true); g.closePath(); g.fill();
        }
      }
      g.fillStyle = '#e9f7ff'; g.font = '500 24px Saira, sans-serif'; g.textAlign = 'center';
      g.fillText(label, cx, y0 + h - 8); g.textAlign = 'left';
    };
    arc(x0 + w * 0.27, 30, 'thick: big stretch');
    arc(x0 + w * 0.73, lerp(30, 7, o.thin ?? 1), 'thin: small stretch');
  } else if (kind === 'bumps') {
    g.fillStyle = '#30353d'; g.fillRect(x0, y0, w, h);
    for (let j = -1; j < 9; j++) for (let i = -1; i < 22; i++) {
      const cx = x0 + i * 30 + (j % 2) * 15 - (drift % 30), cy = y0 + j * 28;
      const r = 11 + ((i * 7 + j * 13) % 5);
      const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, 1, cx, cy, r);
      gr.addColorStop(0, 'rgba(220,232,245,0.95)'); gr.addColorStop(0.5, 'rgba(120,132,148,0.9)'); gr.addColorStop(1, 'rgba(40,44,52,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    }
  } else if (kind === 'touch') {
    // metal mesh with field lines bulging toward a fingertip
    g.fillStyle = '#0d131b'; g.fillRect(x0, y0, w, h);
    g.strokeStyle = 'rgba(190,215,235,0.8)'; g.lineWidth = 3;
    const by = y0 + h - 30;
    for (let i = 0; i < 14; i++) { const x = x0 + 20 + i * 42; g.beginPath(); g.moveTo(x - 12, by); g.lineTo(x + 12, by); g.stroke(); }
    const fx = x0 + w / 2 + Math.sin(t * 0.8) * 60, fy = y0 + 20;
    g.fillStyle = 'rgba(240,200,170,0.9)';
    g.beginPath(); g.ellipse(fx, fy, 70, 40, 0, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 14; i++) {
      const x = x0 + 20 + i * 42, d = Math.abs(x - fx), pull = Math.max(0, 1 - d / 160);
      g.strokeStyle = `rgba(95,216,255,${0.25 + 0.7 * pull})`; g.lineWidth = 2;
      g.beginPath(); g.moveTo(x, by - 4); g.quadraticCurveTo(x + (fx - x) * 0.5 * pull, lerp(by - 60, fy + 40, pull), lerp(x, fx, pull * 0.8), lerp(by - 90, fy + 38, pull)); g.stroke();
    }
  } else {
    g.fillStyle = '#07080a'; g.fillRect(x0, y0, w, h);
    const cols = { r: kind === 'filters' ? '#c8333a' : '#ff4a3a', g: kind === 'filters' ? '#2f9a4b' : '#46ff78', b: kind === 'filters' ? '#2d4fc4' : '#4a72ff' };
    const glow = kind !== 'filters';
    const cell = 46;
    for (let j = -1; j < 7; j++) for (let i = -1; i < 14; i++) {
      const cx = x0 + i * cell - (drift % cell), cy = y0 + j * cell;
      if (kind === 'udc') {
        const d = Math.hypot(cx + cell / 2 - (x0 + w / 2), cy + cell / 2 - (y0 + h / 2));
        if (d < 70) continue;
        if (d < 120 && (i + j) % 2) continue;
      }
      const ov = (x, y, rx, ry, rot, c) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = c; if (glow) { g.shadowColor = c; g.shadowBlur = 12; } g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.restore(); };
      ov(cx + 12, cy + 12, 8, 6, 0.6, cols.r); ov(cx + 34, cy + 34, 8, 6, -0.6, cols.r);
      ov(cx + 34, cy + 12, 9, 7, -0.5, cols.b); ov(cx + 12, cy + 34, 9, 7, 0.5, cols.b);
      ov(cx + 23, cy + 23, 4.5, 3.5, 0, cols.g);
    }
    if (kind === 'filters') {
      g.strokeStyle = '#000'; g.lineWidth = 5;
      for (let i = -1; i < 30; i++) { g.beginPath(); g.moveTo(x0 + i * 23 - (drift % 23), y0); g.lineTo(x0 + i * 23 - (drift % 23), y0 + h); g.stroke(); }
      for (let j = 0; j < 12; j++) { g.beginPath(); g.moveTo(x0, y0 + j * 23); g.lineTo(x0 + w, y0 + j * 23); g.stroke(); }
    }
    if (kind === 'udc') {
      g.strokeStyle = 'rgba(95,216,255,0.9)'; g.lineWidth = 2; g.setLineDash([6, 6]);
      g.beginPath(); g.arc(x0 + w / 2, y0 + h / 2, 64, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    }
  }
  g.restore();
  const titles = { bend: 'BENDING', bumps: 'NANO-TEXTURE', touch: 'TOUCH FIELD', filters: 'COLOR FILTERS', pixels: 'SUBPIXELS', udc: 'PIXEL GAPS' };
  g.fillStyle = '#e9f7ff';
  g.font = '600 30px Saira, sans-serif';
  g.fillText(titles[kind], 30, 38);
  g.fillStyle = '#5fd8ff';
  g.textAlign = 'right';
  g.fillText(kind === 'bend' ? 'STRETCH vs SQUEEZE' : 'MAGNIFIED', W - 30, 38);
  g.textAlign = 'left';
}
