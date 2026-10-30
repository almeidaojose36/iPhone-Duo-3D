// INSIDE THE iPHONE DUO · 04 TWO BATTERIES
// X-ray to the two cells, lift them out, open the steel shells, release the adhesive, then follow the
// charge from the USB-C port across the hinge flex to the cell in the other half.
import { Stage, Labels, THREE, cameraPath, prog, ease, clamp01, lerp, keys } from './engine.js';
import { Looks, noLook, setWorldPose, TraceLine } from './fx.js';
import { buildLiIon, revealMicro } from './microduo.js';
import { loadDuo, foldRig, floorY, topOf, centreOf, explode, orb } from './duo.js';
import { at, end, start, LAST } from './vo.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CYAN = 0x5fd8ff, AMBER = 0xffb347, WHITE = 0xe8f4ff, GREEN = 0x6ee7a8;

export async function init(el) {
  const S = new Stage(el.macro);
  const { phone, batteries } = await loadDuo(S, ['phone', 'batteries']);
  const looks = new Looks();
  const labels = new Labels(el.labels, S);
  const P = (n) => phone.part(n), B = (n) => batteries.part(n);

  const T = {
    room: at('b1', 'room'), two: at('b1', 'two'), half: at('b1', 'half'),
    lshaped: at('b2', 'l-shaped'), cameras: at('b2', 'cameras'), larger: at('b2', 'larger'), together: at('b2', 'together'), h24: at('b2', '24'),
    shell: at('b3', 'shell'), sheets: at('b3', 'sheets'), electrolyte: at('b3', 'electrolyte'),
    closer: at('b4', 'closer'), oxide: at('b4', 'oxide'), charge: at('b4', 'charge'), ions: at('b4', 'ions'), carbon: at('b4', 'carbon'),
    flow: at('b5', 'flow'), electron: at('b5', 'electron'), powers: at('b5', 'powers'),
    adhesive: at('b6', 'adhesive'), lets: at('b6', 'lets'), current: at('b6', 'current'), surface: at('b6', 'surface'), nine: at('b6', '9'),
    charging: at('b7', 'charging'), accordion: at('b7', 'accordion'), hingeW: at('b7', 'hinge'), sixty: at('b7', '60'), fifty: at('b7', '50%'), brains: at('b7', 'brains')
  };

  // ---------------------------------------------------------------- phone and the two detailed cells
  const rig = foldRig(phone, 'right');
  const yOpen = floorY(phone) + 0.02;
  rig.place(V(0, yOpen, 0));
  rig.set(0);
  batteries.root.position.set(0, 0, 0);
  const cells = [
    { g: B('Battery_Left_7Wh5'), ph: P('Battery_7Wh5_L_Shaped') },
    { g: B('Battery_Right_11Wh6'), ph: P('Battery_11Wh6_Main') }
  ];
  S.scene.updateMatrixWorld(true);
  cells.forEach((c) => {
    const b = new THREE.Box3().setFromObject(c.ph);
    c.home = b.getCenter(V(0, 0, 0));
    c.home.y = b.min.y - 0.02;
    c.stage = V(Math.sign(c.home.x) * 10.5, 3.2, c.home.z * 0.4 - 1);
  });
  // phases
  const xray = (t) => clamp01(prog(t, T.room - 0.2, T.two) - prog(t, T.two + 0.6, T.half + 0.8) + prog(t, start('b7') - 1.0, start('b7') - 0.2) - prog(t, end('b7') + 0.3, end('b7') + 1.0));
  const cellsA = (t) => prog(t, T.two + 0.2, T.two + 0.8) * (1 - prog(t, start('b7') - 1.6, start('b7') - 0.8));
  const out = (t) => prog(t, T.half - 0.2, T.half + 1.6) * (1 - prog(t, start('b7') - 2.4, start('b7') - 1.0));
  const phoneDim = (t) => prog(t, T.half + 0.2, T.half + 1.2) * (1 - prog(t, start('b7') - 2.0, start('b7') - 1.0));
  const openShell = (t) => prog(t, T.shell - 0.3, T.shell + 1.2) * (1 - prog(t, start('b7') - 2.6, start('b7') - 1.6));
  const glueDrop = (t) => prog(t, T.lets - 0.1, T.lets + 1.2) * (1 - prog(t, start('b7') - 2.6, start('b7') - 1.6));

  // ---------------------------------------------------------------- charge path: USB-C -> board -> hinge flex -> far cell
  const SP = 1.6 / 166;
  const pm = (x, y, z) => phone.root.localToWorld(V(x * SP, y * SP, z * SP));
  const route = [pm(-41.9, 0.4, 58.6), pm(-41.9, 0.4, 44), pm(-41.9, 0.4, 24), pm(-30, 0.6, 2), pm(-12, 0.8, -6), pm(-3.5, 1.4, -6), pm(3.5, 1.4, -6), pm(18, 0.8, -6), pm(38, 0.6, -6), pm(42.4, 0.4, -3)];
  const charge = new TraceLine(route, { radius: 0.09, color: AMBER, tail: 0.18, residual: 0.5, intensity: 6 });
  S.scene.add(noLook(charge.mesh));
  charge.set(0, 0);
  const pulse2 = new TraceLine(route, { radius: 0.09, color: AMBER, tail: 0.1, residual: 0, intensity: 7 });
  S.scene.add(noLook(pulse2.mesh));
  pulse2.set(0, 0);
  // current through the adhesive: little sparks along each strip
  const sparks = [];
  ['Battery_Left_7Wh5_Release_Adhesive', 'Battery_Right_11Wh6_Release_Adhesive'].forEach((n) => {
    B(n).traverse((o) => { if (o.isMesh && /Adhesive_Strip/.test(o.name)) sparks.push(o); });
  });

  // ---------------------------------------------------------------- labels
  const lab = (text, t0, t1, anchor, dx, dy, color, size) => labels.add({ text, t0, t1, anchor, dx, dy, color, size });
  lab('7.5 Wh · 1921 mAh', T.lshaped - 0.1, T.together - 0.2, () => topOf(cells[0].g), 150, -130, '#ffc56e');
  lab('11.6 Wh · 2962 mAh', T.larger - 0.1, T.together - 0.2, () => topOf(cells[1].g), -170, -130, '#ffc56e');
  lab('Steel shell', T.shell - 0.1, T.adhesive - 0.3, () => topOf(B('Battery_Right_11Wh6_Shell_Lid')), -160, -120, '#dfe9f5');
  lab('Cathode · separator · anode', T.sheets, T.closer - 0.2, () => centreOf(B('Battery_Right_11Wh6_Pouch_Cell')), 170, 110, '#dfe9f5');
  lab('Electrically releasable adhesive', T.adhesive - 0.1, end('b6') + 0.3, () => centreOf(B('Battery_Left_7Wh5_Release_Adhesive')), 150, 120);
  lab('Charging hardware · USB-C', T.charging - 0.1, T.accordion - 0.2, () => route[0], -160, -120, '#ffc56e');
  lab('Across the hinge flex', T.accordion - 0.1, end('b7') + 0.4, () => route[5].clone().lerp(route[6], 0.5), 150, -140, '#ffc56e');

  // ---------------------------------------------------------------- micro: inside the cell
  const MS = new Stage(el.micro, { floor: false, background: 0x06080b, fog: [300, 1200] });
  MS.setShadowFocus(V(0, 20, 0), 70);
  const li = buildLiIon();
  MS.scene.add(li.root);
  const mlabels = new Labels(el.mlabels, MS);
  const ml = (text, t0, t1, n, dx, dy, color) => mlabels.add({ text, t0, t1, anchor: li.anchors[n], dx, dy, color });
  ml('Cathode · metal oxide + lithium', T.oxide - 0.3, end('b5') - 0.6, 'cathode', -230, -40, '#d6b8ff');
  ml('Separator', T.ions, end('b5') - 0.6, 'separator', 60, -230, '#dfe9f5');
  ml('Anode · layers of carbon', T.carbon - 0.3, end('b5') - 0.6, 'anode', 220, -40, '#9fe6ff');
  ml('Electrons power the phone', T.electron - 0.2, end('b5') - 0.6, 'wire', 150, -100, '#5fd8ff');
  const loupeK = keys([[0, 0], [T.closer - 0.5, 0], [T.closer + 0.3, 1, 'out'], [T.closer + 0.9, 1], [T.closer + 1.9, 2, 'in'], [end('b5') - 0.9, 2], [end('b5') + 0.1, 0, 'in']]);
  const mcam = cameraPath([
    { t: 0, pos: [0, 48, 175], look: [0, 30, 0], fov: 36 },
    { t: T.closer + 1.9, pos: [-24, 50, 168], look: [0, 30, 0], fov: 36 },
    { t: T.carbon, pos: [30, 52, 160], look: [5, 30, 0], fov: 36 },
    { t: T.electron, pos: [0, 66, 175], look: [0, 36, 0], fov: 36 },
    { t: end('b5'), pos: [-10, 60, 168], look: [0, 34, 0], fov: 36 }
  ], { hold: 0.2 });

  // ---------------------------------------------------------------- camera
  const camKeys = [
    orb(0, [0, 0.6, 0], 36, -16, 50, 33),
    orb(T.room + 0.2, [0, 0.6, 0], 32, -8, 56, 32),
    orb(T.half + 1.4, [0, 2.6, 0], 44, -18, 40, 33),
    orb(T.lshaped + 0.2, [9, 3.2, 0], 26, 18, 44, 32),
    orb(T.larger + 0.2, [-9, 3.2, 0], 27, -20, 44, 32),
    orb(T.h24 + 0.4, [0, 3, 0], 44, -6, 42, 33),
    orb(T.shell + 0.8, [-10, 4.5, 0], 34, -22, 34, 32),
    orb(T.adhesive + 0.4, [6, 3, 0], 26, 22, 22, 32),
    orb(T.nine + 0.6, [6, 3, 0], 24, 30, 24, 32),
    orb(start('b7') + 0.2, [0, 0.6, 0], 36, -10, 56, 33),
    orb(T.accordion + 0.4, [0, 0.6, -0.6], 26, 4, 64, 32),
    orb(end('b7') + 0.6, [0, 0.6, 0], 34, -12, 58, 33),
    orb(LAST + 3.0, [0, 0.6, 0], 30, -6, 50, 32)
  ];
  const cam = cameraPath(camKeys, { hold: 0.22 });

  // ====================================================================== per frame
  return (t) => {
    // ---- phone: x-ray shells; dimmed while the cells are on stage
    const xr = xray(t), dim = phoneDim(t), ca = cellsA(t);
    const shellA = Math.min(1 - 0.85 * xr, 1 - 0.9 * dim);
    for (const n of ['Frame_Left', 'Frame_Right', 'Back_Glass_Camera_Half', 'Outer_Display', 'Inner_Display_Left', 'Inner_Display_Right', 'Hinge_Fold', 'Logic_Board', 'IO_Board', 'Rear_Dual_Camera']) if (shellA < 0.999) looks.opacity(P(n), shellA);
    for (const c of cells) {
      if (ca > 0.001) looks.opacity(c.ph, 1 - ca);
      looks.glow(c.ph, AMBER, 0.6 * xr * (1 - ca));
    }
    // ---- cells: shell layers open, adhesive drops; each cell travels home -> stage
    explode(batteries, openShell(t), 1.6);
    for (const n of ['Battery_Left_7Wh5_Release_Adhesive', 'Battery_Right_11Wh6_Release_Adhesive']) {
      const g = B(n);
      g.position.y -= 0.06 * glueDrop(t);
    }
    const u = out(t);
    for (const c of cells) {
      const p = c.home.clone().lerp(c.stage, u);
      p.y += Math.sin(Math.PI * u) * 3;
      setWorldPose(c.g, p, new THREE.Quaternion());
    }
    if (ca < 0.999) looks.opacity(batteries.root, ca);
    batteries.root.visible = ca > 0.003;
    // glows while named
    const pl = (t0, t1, a = 0.55) => a * (prog(t, t0 - 0.2, t0 + 0.3) - prog(t, t1 - 0.3, t1 + 0.2));
    looks.glow(cells[0].g, AMBER, Math.max(pl(T.lshaped, T.larger, 0.5), pl(T.together, end('b2'), 0.4)));
    looks.glow(cells[1].g, AMBER, Math.max(pl(T.larger, T.together + 0.3, 0.5), pl(T.together, end('b2'), 0.4)));
    for (const n of ['Battery_Left_7Wh5_Shell_Lid', 'Battery_Right_11Wh6_Shell_Lid']) looks.glow(B(n), WHITE, pl(T.shell, T.adhesive - 0.2, 0.45));
    const flick = 0.5 + 0.5 * Math.sin(t * 40) * Math.sin(t * 17);
    for (const m of sparks) looks.glow(m, CYAN, pl(T.current - 0.1, end('b6') + 0.2, 0.9) * (0.6 + 0.4 * flick));
    // ---- charge path
    const cp = prog(t, T.charging + 0.2, T.hingeW + 0.6, ease.inOut);
    charge.set(cp * 1.05, 1 - prog(t, end('b7') + 0.4, end('b7') + 1.0));
    const p2 = ((t - T.hingeW) * 0.55) % 1;
    pulse2.set(t > T.hingeW ? p2 * 1.1 : 0, prog(t, T.hingeW, T.hingeW + 0.3) * (1 - prog(t, end('b7') + 0.2, end('b7') + 0.8)));
    looks.glow(P('Accordion_Flex_Cable'), AMBER, pl(T.accordion, end('b7') + 0.3, 1));
    looks.glow(P('Battery_7Wh5_L_Shaped'), AMBER, pl(T.hingeW + 0.4, end('b7') + 0.4, 0.7));
    looks.glow(P('USB_C_Port'), AMBER, pl(T.charging, T.accordion, 0.8));

    // ---- camera, render, labels (macro skipped while the micro view fills the frame)
    const k = loupeK(t);
    cam(t, S.camera);
    S.setShadowFocus(V(0, 0, 0), 16);
    looks.apply();
    if (k < 1.99) S.render();
    labels.update(t);
    el.labels.style.opacity = k >= 1.5 ? 0 : 1;
    const lp = S.project(centreOf(B('Battery_Right_11Wh6_Pouch_Cell')));
    if (revealMicro(el, k, lp.x, lp.y)) {
      // charge: ions move to the anode; discharge (b5): they flow back while electrons go round the wire
      const ch = prog(t, T.charge - 0.2, T.carbon + 0.8) * (1 - prog(t, T.flow - 0.2, T.flow + 2.4));
      li.update(t, { charge: ch, flow: prog(t, T.flow, T.flow + 0.5) });
      mcam(t, MS.camera);
      MS.render();
      mlabels.update(t);
    }

    // ---- overlays
    el.chapter.style.opacity = prog(t, 0.6, 1.1) * (1 - prog(t, 5.6, 6.2));
    el.chapNum.textContent = '04';
    el.chapName.textContent = 'TWO BATTERIES';
    const b1 = prog(t, T.together - 0.1, T.together + 0.4) * (1 - prog(t, T.h24 - 0.5, T.h24 - 0.2));
    const b2 = prog(t, T.h24 - 0.1, T.h24 + 0.3) * (1 - prog(t, end('b2') + 0.2, end('b2') + 0.6));
    const b3 = prog(t, T.nine - 0.1, T.nine + 0.3) * (1 - prog(t, end('b6') + 0.1, end('b6') + 0.5));
    const b4 = prog(t, T.fifty - 0.1, T.fifty + 0.3) * (1 - prog(t, T.brains - 0.3, T.brains + 0.1));
    el.big.style.opacity = Math.max(b1, b2, b3, b4);
    if (b1 > 0) { el.bigNum.textContent = '19.1 Wh'; el.bigSub.textContent = '7.5 + 11.6, in two halves'; }
    else if (b2 > 0) { el.bigNum.textContent = 'up to 24 h'; el.bigSub.textContent = 'typical use'; }
    else if (b3 > 0) { el.bigNum.textContent = '9 V'; el.bigSub.textContent = 'enough to release the adhesive'; }
    else if (b4 > 0) { el.bigNum.textContent = '50% · 20 min'; el.bigSub.textContent = 'with a 60 W charger'; }
    el.title.style.opacity = 0;
    el.fade.style.opacity = Math.max(1 - prog(t, 0.0, 0.8), prog(t, LAST + 2.2, LAST + 3.1));
    el.endcard.style.opacity = prog(t, LAST + 2.3, LAST + 3.0);
    const n = el.endcard.querySelector('#stage-endname');
    if (n && n.textContent !== 'THE BRAINS') n.textContent = 'THE BRAINS';
    el.scale.style.opacity = 0;
    el.loupe.style.opacity = 0;
    el.scope.style.opacity = 0;
  };
}
