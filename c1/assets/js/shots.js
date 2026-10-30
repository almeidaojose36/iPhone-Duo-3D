// INSIDE THE iPHONE DUO · cold open + 01 THE FOLD
// The phone opens, folds, flips and explodes; every move is keyed to the narration's word times.
import { Stage, Labels, THREE, cameraPath, prog, ease, clamp01, lerp } from './engine.js';
import { Looks } from './fx.js';
import { loadDuo, foldRig, floorY, topOf, centreOf, explode, orb, orbL } from './duo.js';
import { at, end, start, LAST } from './vo.js';
import { clear, screenShapes, comparison } from './overlays.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CYAN = 0x5fd8ff, AMBER = 0xffb347, WHITE = 0xe8f4ff, GREEN = 0x6ee7a8;

export async function init(el) {
  const S = new Stage(el.macro);
  const { phone } = await loadDuo(S, ['phone']);
  const looks = new Looks();
  const labels = new Labels(el.labels, S);
  el.micro.style.opacity = 0;
  const P = (n) => phone.part(n);

  // ---------------------------------------------------------------- word times
  const T = {
    thick: at('o1', 'thick'), folds: at('o1', 'folds'),
    hinge0: at('o2', 'hinge'), screen0: at('o2', 'screen'), battery0: at('o2', 'batteries'), two0: at('o2', 'two'), open0: at('o2', 'take'), apart: at('o2', 'apart'),
    duo: at('f1', 'duo'), hand: at('f1', 'hand'), open1: at('f1', 'open'), inch: at('f1', '7.6'), largest: at('f1', 'largest'),
    halves: at('f2', 'halves'), mm: at('f2', 'mm'), titanium: at('f2', 'titanium'), fit: at('f2', 'fit'),
    battery: at('f3', 'battery'), cameras: at('f3', 'cameras'), outer: at('f3', 'outer'), hinge: at('f3', 'hinge'),
    open2: at('f4', 'open'), dozens: at('f4', 'dozens'), moment: at('f4', 'moment'), turning: at('f4', 'turning'), bending: at('f4', 'bending'),
    wide: at('fw', 'wide'), square: at('fw', 'square'),
    regular: at('fx', 'regular'), faceid: at('fx', 'face'), volume: at('fx', 'volume'), dshape: at('fx', 'outer'), usbc: at('fx', 'usbc'), a20x: at('fx', 'a20'),
    power: at('f4', 'power'), waking: at('f4', 'waking'), starts: at('f4', 'starts')
  };
  const TITLE0 = end('o2') + 0.35, TITLE1 = start('f1') - 0.25;

  // ---------------------------------------------------------------- rig: the camera half (+X) stays put, the other half swings
  const rig = foldRig(phone, 'right');
  const yOpen = floorY(phone) + 0.02;
  // fold amount over time: open -> closed (o1) -> open (o2) -> closed (title) -> open (f1) -> tent and back (f4)
  const fold = (t) => {
    let f = 0;
    f = lerp(f, 1, prog(t, T.folds - 0.1, T.folds + 1.7));
    f = lerp(f, 0, prog(t, T.open0 - 0.2, T.open0 + 1.5));
    f = lerp(f, 1, prog(t, TITLE1 - 2.6, TITLE1 - 0.6));
    f = lerp(f, 0, prog(t, T.open1 - 0.15, T.open1 + 1.5));
    f = lerp(f, 0.55, prog(t, T.open2 - 0.6, T.open2 + 0.9));
    f = lerp(f, 0, prog(t, T.open2 + 1.1, T.dozens - 0.1));
    return f;
  };
  // lift (cm) so exploded parts clear the floor, and the flip to show the back in f3
  const lift = (t) => 7.5 * (prog(t, T.open0 + 0.6, T.apart - 0.1) - prog(t, TITLE1 - 3.6, TITLE1 - 2.5))
    + 6 * (prog(t, start('f3') - 0.2, start('f3') + 1.2) - prog(t, end('fx') - 0.2, end('fx') + 1.0)) - settle(t)
    + 7.5 * (prog(t, T.dozens - 0.8, T.dozens + 0.3) - prog(t, T.starts - 1.2, T.starts + 0.2));
  // the flipped phone (camera bar up) settles to just above the floor while the comparison card is up, so it
  // doesn't hover over a big shadow; it rises again in time to flip back
  const qFlip = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI);
  rig.place(V(0, yOpen, 0), qFlip);
  rig.set(0);
  phone.root.updateWorldMatrix(true, true);
  const restFlip = 0.05 - new THREE.Box3().setFromObject(phone.root).min.y;
  const DROP = 6 - restFlip;
  const settle = (t) => DROP * (prog(t, start('fx') - 0.4, T.regular + 0.8) - prog(t, T.a20x - 1.6, T.a20x - 0.4));
  const flipA = (t) => Math.PI * (prog(t, start('f3') + 0.1, start('f3') + 1.6) - prog(t, T.a20x - 0.4, T.a20x + 1.0));
  const expl = (t) => 1.35 * (prog(t, T.apart - 0.3, T.apart + 1.3) - prog(t, TITLE1 - 3.6, TITLE1 - 2.6))
    + 1.35 * (prog(t, T.dozens, T.dozens + 1.4) - prog(t, T.starts - 1.4, T.starts));

  // ---------------------------------------------------------------- labels
  const lab = (text, t0, t1, anchor, dx, dy, color, size) => labels.add({ text, t0, t1, anchor, dx, dy, color, size });
  const at3 = (n, dy = 0) => () => topOf(P(n)).add(V(0, dy, 0));
  lab('5.2 mm per half', T.mm - 0.2, T.titanium - 0.2, () => topOf(P('Frame_Right_Rim')).add(V(3.6, 0, 5.4)), 150, -110);
  lab('Grade 5 titanium', T.titanium - 0.1, end('f2') + 0.3, () => topOf(P('Frame_Left_Rim')).add(V(-3.6, 0, 5.4)), -160, -120, '#dfe9f5');
  lab('7.5 Wh', T.battery, T.cameras - 0.2, at3('Battery_7Wh5_L_Shaped'), -170, -90, '#ffc56e');
  lab('11.6 Wh', T.battery + 0.3, T.cameras - 0.2, at3('Battery_11Wh6_Main'), 170, -90, '#ffc56e');
  lab('48 MP Dual Fusion camera', T.cameras - 0.1, T.outer - 0.2, at3('Camera_Bar'), 140, -120);
  lab('5.4″ outer display', T.outer - 0.1, T.hinge - 0.1, at3('Outer_Display_Glass'), -170, -120);
  lab('Titanium hinge', T.hinge - 0.1, end('f3') + 0.2, () => centreOf(P('Titanium_Hinge_Cover')).add(V(0, 1.5, 0)), 150, -140, '#dfe9f5');
  lab('Hinge', T.turning - 0.1, T.bending - 0.1, () => centreOf(P('Titanium_Hinge_Cover')), 140, 120);
  lab('Screen', T.bending - 0.1, T.power - 0.1, at3('Inner_Display_Right_Panel'), 140, -120);
  lab('Power', T.power - 0.1, T.waking - 0.1, at3('Battery_11Wh6_Main'), -140, 120, '#ffc56e');
  lab('Logic board', T.waking - 0.1, T.starts - 0.2, at3('Logic_Board_PCB'), -150, -120, '#8ff0c2');

  // ---------------------------------------------------------------- camera
  const C = [0, 0.4, 0];
  const camKeys = [
    orb(0, [0, -1.2, 0], 27, 8, 17, 30),
    orb(T.thick + 0.4, [0, -1.0, 0], 24, -4, 16, 30),
    orb(T.folds + 0.2, [2, 1.2, 0], 30, -14, 12, 32),
    orb(start('o2') + 1.8, [4, 2.5, 0], 30, -32, 30, 33),
    orb(T.open0 - 0.2, [2, 2.5, 0], 34, -24, 34, 33),
    orb(T.apart + 0.6, [0, 6.5, 0], 46, -18, 24, 34),
    orb(TITLE1 - 2.5, [0, 6, 0], 50, -10, 22, 34),
    orb(start('f1') + 0.6, [3, 1.2, 0], 34, 22, 26, 32),
    orb(T.open1 + 0.3, [0, 0.6, 0], 36, 12, 42, 33),
    orb(T.largest + 0.4, [0, 0.4, 0], 32, 2, 62, 34),
    orbL(T.wide + 0.4, [0, 0.4, 0], 46, -8, 70, 34, 11),
    orb(T.halves + 0.6, [0, 0.4, 0], 34, -12, 40, 34),
    orb(T.mm, [6, -0.6, 2], 23, 34, 17, 30),
    orb(T.titanium + 0.3, [-2, -0.4, 2], 28, 30, 21, 31),
    orb(end('f2') + 0.4, [0, 4, 0], 40, 14, 24, 33),
    orb(T.battery, [0, 6.5, 0], 34, 6, 52, 33),
    orb(T.cameras + 0.4, [-5, 6.5, -2], 24, -20, 46, 32),
    orb(T.outer + 0.4, [5, 6.5, 0], 27, 18, 50, 32),
    orb(T.hinge + 0.3, [0, 6.5, 0], 30, 4, 58, 33),
    orbL(T.faceid + 0.3, [6, 6.5 - DROP, -1], 30, 40, 22, 32, 7),
    orbL(T.volume + 0.4, [5, 6.5 - DROP, -6], 26, 160, 30, 32, 6),
    orbL(T.dshape + 0.5, [-4, 6.5 - DROP, 0], 32, 10, 62, 32, 8),
    orbL(T.usbc + 0.4, [-4, 6 - DROP, 5], 26, -10, 24, 32, 6),
    orb(start('f4') + 0.6, [0, 2, 0], 36, -22, 24, 33),
    orb(T.dozens + 1.2, [0, 8.5, 0], 50, -16, 22, 34),
    orb(T.waking + 0.6, [0, 6.5, 0], 44, 10, 26, 34),
    orb(LAST + 0.6, [0, 0.8, 0], 30, 4, 30, 32),
    orb(LAST + 3.0, [0, 0.6, 0], 26, 8, 34, 31)
  ];
  const cam = cameraPath(camKeys, { hold: 0.22 });

  // ====================================================================== per frame
  return (t) => {
    // pose: flip about the fold axis (Z) for the back view, lifted while exploded or flipped
    const q = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), flipA(t));
    rig.place(V(0, yOpen + lift(t), 0), q);
    rig.set(fold(t));
    explode(phone, expl(t));

    // ---- glows
    const pulse = (t0, t1, a = 0.55) => a * (prog(t, t0 - 0.2, t0 + 0.3) - prog(t, t1 - 0.3, t1 + 0.2));
    looks.glow(P('Hinge'), CYAN, pulse(T.hinge0, T.screen0, 0.6));
    looks.glow(P('Inner_Display_Left'), CYAN, pulse(T.screen0, T.battery0, 0.35));
    looks.glow(P('Inner_Display_Right'), CYAN, pulse(T.screen0, T.battery0, 0.35));
    for (const b of ['Battery_7Wh5_L_Shaped', 'Battery_11Wh6_Main']) looks.glow(P(b), AMBER, Math.max(pulse(T.battery0, T.open0, 0.7), pulse(T.battery, T.cameras, 0.6), pulse(T.power, T.waking, 0.6)));
    // x-ray: the shells go see-through while batteries are shown
    const xray = Math.max(prog(t, T.battery0 - 0.3, T.battery0 + 0.2) - prog(t, T.open0 - 0.4, T.open0), prog(t, T.battery - 0.3, T.battery + 0.2) - prog(t, T.cameras - 0.4, T.cameras));
    if (xray > 0) for (const n of ['Back_Glass_Camera_Half', 'Outer_Display', 'Frame_Left', 'Frame_Right', 'Inner_Display_Left', 'Inner_Display_Right', 'Hinge_Fold']) looks.opacity(P(n), 1 - 0.82 * xray);
    looks.glow(P('Frame_Left'), CYAN, pulse(T.halves - 0.1, T.halves + 1.0, 0.5));
    looks.glow(P('Frame_Right'), CYAN, pulse(T.halves + 0.7, T.mm - 0.2, 0.5));
    for (const n of ['Frame_Left', 'Frame_Right', 'Titanium_Hinge_Cover']) looks.glow(P(n), WHITE, pulse(T.titanium, end('f2') + 0.2, 0.45));
    looks.glow(P('Camera_Bar'), CYAN, pulse(T.cameras, T.outer, 0.6));
    looks.glow(P('Outer_Display_Glass'), CYAN, pulse(T.outer, T.hinge, 0.4));
    looks.glow(P('Titanium_Hinge_Cover'), CYAN, Math.max(pulse(T.hinge, end('f3') + 0.3, 0.6), pulse(T.turning, T.bending, 0.6), pulse(T.starts - 0.2, LAST + 2.5, 0.6)));
    looks.glow(P('Hinge'), CYAN, pulse(T.turning, T.bending, 0.5));
    for (const n of ['Inner_Display_Left', 'Inner_Display_Right']) looks.glow(P(n), CYAN, pulse(T.bending, T.power, 0.35));
    looks.glow(P('Accordion_Flex_Cable'), AMBER, pulse(T.power, T.waking, 0.9));
    looks.glow(P('Logic_Board'), GREEN, pulse(T.waking, T.starts, 0.6));
    for (const n of ['Button_Side_Button_Touch_ID', 'Touch_ID_Ring']) looks.glow(P(n), CYAN, pulse(T.faceid, T.volume, 0.9));
    for (const n of ['Button_Volume_Up', 'Button_Volume_Down']) looks.glow(P(n), CYAN, pulse(T.volume, T.dshape, 0.9));
    looks.glow(P('Outer_Display_Glass'), CYAN, pulse(T.dshape, T.usbc, 0.35));
    looks.glow(P('USB_C_Port'), AMBER, pulse(T.usbc, T.a20x, 1));

    // ---- camera, render, labels
    cam(t, S.camera);
    S.setShadowFocus(V(0, 0, 0), 14);
    looks.apply();
    S.render();
    labels.update(t);

    // ---- overlays
    const b1 = prog(t, T.thick - 0.1, T.thick + 0.4) * (1 - prog(t, T.folds - 0.2, T.folds + 0.3));
    const b2 = prog(t, T.inch - 0.1, T.inch + 0.4) * (1 - prog(t, end('f1') - 0.2, end('f1') + 0.3));
    const b3 = prog(t, T.dozens - 0.1, T.dozens + 0.4) * (1 - prog(t, T.moment - 0.2, T.moment + 0.3));
    el.big.style.opacity = Math.max(b1, b2, b3);
    if (b1 > 0) { el.bigNum.textContent = '5.2 mm'; el.bigSub.textContent = 'thinnest iPhone ever'; }
    else if (b2 > 0) { el.bigNum.textContent = '7.6″'; el.bigSub.textContent = 'largest iPhone display ever'; }
    else if (b3 > 0) { el.bigNum.textContent = '< 1 s'; el.bigSub.textContent = 'to open, dozens of parts moving'; }
    el.title.style.opacity = prog(t, TITLE0, TITLE0 + 0.6) * (1 - prog(t, TITLE1 - 0.6, TITLE1));
    const shp = prog(t, T.wide - 0.3, T.wide + 0.3) * (1 - prog(t, end('fw') + 0.1, end('fw') + 0.6));
    const cmp = prog(t, T.regular - 0.3, T.regular + 0.3) * (1 - prog(t, end('fx') + 0.1, end('fx') + 0.6));
    el.ov.style.opacity = Math.max(shp, cmp);
    if (shp > 0) screenShapes(el.ov, prog(t, T.wide - 0.3, T.square + 0.4));
    else if (cmp > 0) comparison(el.ov, 0.3 + 6 * prog(t, T.faceid - 0.6, T.a20x + 0.6, (x) => x), [
      ['Unlock', 'Touch ID · side button', 'Face ID'],
      ['Volume buttons', 'top edge', 'left side'],
      ['Screens', '5.4″ D-shape + 7.6″ inner', 'one screen'],
      ['Outer controls', 'down the right edge', 'top and bottom'],
      ['USB-C', 'low on the left half', 'bottom edge'],
      ['Chip', 'A20 Pro', 'A20 Pro (18 Pro)']
    ]);
    else clear(el.ov);
    el.titleH.textContent = 'INSIDE THE iPHONE DUO';
    el.titleP.textContent = 'A FOLDABLE, TAKEN APART';
    el.chapter.style.opacity = prog(t, start('f1') + 0.2, start('f1') + 0.7) * (1 - prog(t, start('f1') + 5.2, start('f1') + 5.8));
    el.chapNum.textContent = '01';
    el.chapName.textContent = 'THE FOLD';
    el.fade.style.opacity = Math.max(1 - prog(t, 0.0, 0.9), prog(t, LAST + 2.2, LAST + 3.1));
    el.endcard.style.opacity = prog(t, LAST + 2.3, LAST + 3.0);
    $endName(el, 'THE HINGE');
    el.scale.style.opacity = 0;
    el.loupe.style.opacity = 0;
    el.scope.style.opacity = 0;
  };
}

function $endName(el, s) {
  const n = el.endcard.querySelector('#stage-endname');
  if (n && n.textContent !== s) n.textContent = s;
}
