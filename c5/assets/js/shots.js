// INSIDE THE iPHONE DUO · 05 THE BRAINS (v2)
// The single-layer logic board lifts out; the A20 Pro is opened down to its gate-all-around nanosheet
// transistors; the other chips are named; then the heat path: metal-over-foam, the vapor chamber (cut open)
// and the graphite pipe that carries heat through the hinge to the other half.
import { Stage, Labels, THREE, cameraPath, prog, ease, clamp01, lerp, keys } from './engine.js';
import { Looks, noLook, setWorldPose, TraceLine, glowPlane, heatTexture } from './fx.js';
import { loadDuo, foldRig, floorY, topOf, centreOf, orb } from './duo.js';
import { buildGAA, buildVaporChamber, revealMicro } from './microduo.js';
import { at, end, start, LAST } from './vo.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CYAN = 0x5fd8ff, AMBER = 0xffb347, WHITE = 0xe8f4ff, GREEN = 0x6ee7a8, ORANGE = 0xff7a2f;
const U = 1.6 / 76; // board-model units per mm

export async function init(el) {
  const S = new Stage(el.macro);
  const { phone, boards } = await loadDuo(S, ['phone', 'boards']);
  const looks = new Looks();
  const labels = new Labels(el.labels, S);
  const P = (n) => phone.part(n), B = (n) => boards.part(n);

  const T = {
    years: at('l1', 'years'), stacked: at('l1', 'stacked'), sandwiched: at('l1', 'sandwiched'), single: at('l1', 'single'),
    center: at('l2', 'center'), a20: at('l2', 'a20'), nm: at('l2', 'nanometer'), cpu: at('l2', 'cpu'), memory: at('l2', 'memory'),
    inside: at('l3', 'inside'), billions: at('l3', 'billions'), switches: at('l3', 'switches'),
    shape: at('l4', 'shape'), channel: at('l4', 'channel'), ribbons: at('l4', 'ribbons'), gate: at('l4', 'gate'), hand: at('l4', 'hand'),
    voltage: at('l5', 'voltage'), remove: at('l5', 'remove'), surrounds: at('l5', 'surrounds'), leaks: at('l5', 'leaks'),
    nand: at('l6', 'nand'), c2: at('l6', 'c2'), n1: at('l6', 'n1'),
    power: at('l7', 'power'), voltages: at('l7', 'voltages'),
    heat: at('l8', 'heat'), foam: at('l8', 'overfoam'), vapor: at('l8', 'vapor'),
    boils: at('l9', 'boils'), spreads: at('l9', 'spreads'), condenses: at('l9', 'condenses'), back: at('l9', 'back'),
    half: at('l10', 'half'), graphite: at('l10', 'graphite'), hinge: at('l10', 'hinge'), shed: at('l10', 'shed'), cameras: at('l10', 'cameras')
  };

  // ---------------------------------------------------------------- phone and the logic board
  const rig = foldRig(phone, 'right');
  const yOpen = floorY(phone) + 0.02;
  rig.place(V(0, yOpen, 0));
  rig.set(0);
  S.scene.updateMatrixWorld(true);
  const LB = B('Logic_Board'), IB = B('IO_Board');
  IB.visible = false;
  const lbHome = (() => { const b = new THREE.Box3().setFromObject(P('Logic_Board_PCB')); return b.getCenter(V(0, 0, 0)); })();
  const LB_STAGE = V(0, 3.0, -1.6);
  const out = (t) => prog(t, T.years - 0.3, T.years + 1.4) * (1 - prog(t, start('l10') - 0.4, start('l10') + 1.4));
  const ghost = LB.clone(true);
  LB.parent.add(ghost);
  ghost.traverse((o) => { if (o.isMesh) { o.userData.baseMaterial = o.material; o.userData.lookMat = null; } });
  const ghostA = (t) => prog(t, T.stacked - 0.2, T.sandwiched) * (1 - prog(t, T.single - 0.2, T.single + 0.9));
  const chip = (n) => B(n);

  // PMIC power rails along the board surface
  const surf = 0.6 * U;
  const pos = (n) => chip(n).position.clone().setY(surf);
  const rails = ['Logic_SoC', 'Logic_NAND_Flash', 'Logic_C2_Cellular_Modem', 'Logic_N1_Wireless_Chip', 'Logic_Audio_Codec', 'Logic_RF_Transceiver'].map((n, i) => {
    const a = pos('Logic_PMIC'), b = pos(n), mid = 0.3 + 0.1 * (i % 3);
    const line = new TraceLine([a, V(lerp(a.x, b.x, mid), surf, a.z), V(lerp(a.x, b.x, mid), surf, b.z), b], { radius: 0.25 * U, color: AMBER, tail: 0.25, residual: 0.4, intensity: 6 });
    LB.add(noLook(line.mesh));
    line.set(0, 0);
    return line;
  });

  // metal-over-foam pad + vapor chamber + heat bloom over the SoC
  const soc = chip('Logic_SoC');
  const socTop = 1.5 * U;
  const mk = (geo, color, metal, rough, name) => { const m = new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough }); const me = new THREE.Mesh(geo, m); me.name = name; me.castShadow = me.receiveShadow = true; me.userData.baseMaterial = m; LB.add(me); return me; };
  const pad = mk(new THREE.BoxGeometry(23 * U, 0.6 * U, 19.5 * U), 0x9a9ea4, 0.7, 0.55, 'Metal_Over_Foam');
  const vc = mk(new THREE.BoxGeometry(46 * U, 0.4 * U, 28 * U), 0xb9805f, 1, 0.42, 'Vapor_Chamber');
  const padRest = V(soc.position.x, socTop + 0.35 * U, soc.position.z);
  const vcRest = V(soc.position.x - 2 * U, socTop + 0.9 * U, soc.position.z + 1.5 * U);
  const heatTex = heatTexture();
  const heatGlow = glowPlane(30 * U, 26 * U, heatTex, ORANGE, 1.6);
  heatGlow.position.copy(vcRest).add(V(0, 0.4 * U, 0));
  LB.add(noLook(heatGlow));
  const padIn = (t) => prog(t, T.foam - 0.5, T.foam + 0.6) * (1 - prog(t, start('l10') - 0.6, start('l10')));
  const vcIn = (t) => prog(t, T.vapor - 0.4, T.vapor + 0.9) * (1 - prog(t, start('l10') - 0.6, start('l10')));

  // ---------------------------------------------------------------- graphite pipe through the hinge (phone frame, mm)
  const SP = 1.6 / 166;
  const pm = (x, y, z) => V(x * SP, y * SP, z * SP);
  const pipePts = [pm(-30, 1.3, -40), pm(-12, 1.3, -40), pm(-4, 1.6, -40), pm(0, 0.6, -40), pm(4, 1.6, -40), pm(14, 1.3, -40), pm(30, 1.3, -36), pm(46, 1.3, -30)];
  const pipeCurve = new THREE.CatmullRomCurve3(pipePts);
  const pipeGeo = new THREE.TubeGeometry(pipeCurve, 80, 2.6 * SP, 10, false);
  const pipe = new THREE.Mesh(pipeGeo, new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.5, metalness: 0.6 }));
  pipe.name = 'Graphite_Pipe';
  pipe.userData.baseMaterial = pipe.material;
  phone.root.add(pipe);
  const heatFlow = new TraceLine(pipeCurve.getPoints(80).map((q) => q.clone().add(V(0, 1.6 * SP, 0))), { radius: 1.4 * SP, color: ORANGE, tail: 0.3, residual: 0.35, intensity: 7 });
  phone.root.add(noLook(heatFlow.mesh));
  heatFlow.set(0, 0);
  const pipeA = (t) => prog(t, T.graphite - 0.6, T.graphite + 0.2);

  // ---------------------------------------------------------------- micro worlds: GAA transistor, vapor chamber
  const MS = new Stage(el.micro, { floor: false, background: 0x06080b, fog: [500, 2200] });
  MS.setShadowFocus(V(0, 0, 0), 160);
  const gaa = buildGAA();
  const vcx = buildVaporChamber();
  MS.scene.add(gaa.root, vcx.root);
  const mlabels = new Labels(el.mlabels, MS);
  const g = gaa.anchors, w = vcx.anchors;
  const ml = (text, t0, t1, a, dx, dy, color) => mlabels.add({ text, t0, t1, anchor: a, dx, dy, color });
  ml('Billions of transistors', T.billions - 0.2, T.shape - 0.2, g.array, -170, -120, '#9fe6ff');
  ml('Silicon ribbons (channel)', T.ribbons - 0.2, T.gate - 0.1, g.sheets, 170, -40, '#dfe9f5');
  ml('Gate wraps all around', T.gate, T.voltage - 0.2, g.gate, 150, -140, '#ffc56e');
  ml('Source', T.voltage - 0.2, end('l5') - 0.4, g.source, -150, -110, '#ffb38a');
  ml('Drain', T.voltage - 0.2, end('l5') - 0.4, g.drain, 150, -110, '#ffb38a');
  ml('ON', T.voltage, T.remove - 0.1, g.gate, 150, -140, '#8ff0c2');
  ml('OFF', T.remove, T.surrounds - 0.1, g.gate, 150, -140, '#ff8c7a');
  ml('Less leakage', T.leaks - 0.4, end('l5') - 0.4, g.gate, 150, -140, '#8ff0c2');
  ml('Hot chip', T.boils - 0.4, T.spreads - 0.1, w.chip, -150, 110, '#ffb38a');
  ml('Liquid boils', T.boils, T.spreads - 0.1, w.pad, 140, 120, '#ffb38a');
  ml('Vapor spreads', T.spreads - 0.1, T.condenses - 0.1, w.vapor, 140, -140, '#ffd0b8');
  ml('Condenses', T.condenses - 0.1, T.back - 0.1, w.cond, 140, -140, '#9fe6ff');
  ml('Flows back through the wick', T.back - 0.1, end('l9') - 0.3, w.wick, 150, 120, '#9fe6ff');
  const loupeA = keys([[0, 0], [T.inside - 0.4, 0], [T.inside + 0.4, 1, 'out'], [T.inside + 1.0, 1], [T.inside + 2.0, 2, 'in'], [end('l5') - 0.9, 2], [end('l5') + 0.1, 0, 'in']]);
  const loupeB = keys([[0, 0], [start('l9') - 0.6, 0], [start('l9') + 0.2, 1, 'out'], [start('l9') + 0.7, 1], [start('l9') + 1.6, 2, 'in'], [end('l9') - 0.8, 2], [end('l9') + 0.2, 0, 'in']]);
  const gcam = cameraPath([
    { t: 0, pos: [-160, 140, 260], look: [-20, 0, 0], fov: 34 },
    { t: T.inside + 2.0, pos: [-140, 120, 230], look: [-10, 0, 0], fov: 34 },
    { t: T.shape, pos: [-60, 60, 120], look: [0, 14, 0], fov: 34 },
    { t: T.ribbons + 0.4, pos: [30, 34, 80], look: [0, 14, 0], fov: 34 },
    { t: T.gate + 1.0, pos: [55, 40, 70], look: [0, 14, 0], fov: 34 },
    { t: T.voltage + 0.5, pos: [10, 40, 85], look: [0, 14, 0], fov: 34 },
    { t: end('l5'), pos: [-30, 46, 85], look: [0, 14, 0], fov: 34 }
  ], { hold: 0.2 });
  const vcam = cameraPath([
    { t: start('l9') - 1, pos: [-10, 26, 120], look: [-5, 5, 0], fov: 34 },
    { t: T.spreads, pos: [15, 22, 115], look: [5, 6, 0], fov: 34 },
    { t: end('l9'), pos: [0, 28, 125], look: [0, 5, 0], fov: 34 }
  ], { hold: 0.2 });

  // ---------------------------------------------------------------- labels (macro)
  const lab = (text, t0, t1, anchor, dx, dy, color, size) => labels.add({ text, t0, t1, anchor, dx, dy, color, size });
  const topc = (n) => () => topOf(chip(n));
  lab('Stacked boards (earlier iPhones)', T.stacked, T.single - 0.2, () => topOf(ghost), 160, -130, '#9fe6ff');
  lab('Single layer', T.single, end('l1') + 0.4, () => topOf(LB), 170, -120, '#8ff0c2');
  lab('A20 Pro', T.a20 - 0.1, T.cpu - 0.1, topc('Logic_SoC'), 150, -140, '#8ff0c2');
  lab('6-core CPU · 7-core GPU', T.cpu, T.memory - 0.1, topc('Logic_SoC'), 150, -140, '#9fe6ff');
  lab('Memory beside the processor', T.memory, end('l2') + 0.2, topc('Logic_SoC'), 150, -140, '#9fe6ff');
  lab('NAND flash · up to 2 TB', T.nand - 0.1, T.c2 - 0.2, topc('Logic_NAND_Flash'), 150, -120, '#8ff0c2');
  lab('Apple C2 modem · 5G', T.c2 - 0.1, T.n1 - 0.2, topc('Logic_C2_Cellular_Modem'), -170, -130, '#8ff0c2');
  lab('Apple N1 · Wi-Fi 7 · Bluetooth 6 · Thread', T.n1 - 0.1, end('l6') + 0.3, topc('Logic_N1_Wireless_Chip'), 150, 120, '#8ff0c2');
  lab('Power management IC', T.power - 0.1, end('l7') + 0.2, topc('Logic_PMIC'), -170, -130, '#ffc56e');
  lab('Metal-over-foam', T.foam, T.vapor - 0.1, () => pad.localToWorld(V(0, 0, 0)), 160, -140, '#dfe9f5');
  lab('Vapor chamber', T.vapor + 0.4, end('l8') + 0.3, () => vc.localToWorld(V(0, 0, 0)), 160, -140, '#ffc56e');
  lab('Graphite pipe through the hinge', T.graphite, end('l10') - 1.0, () => phone.root.localToWorld(pm(0, 2, -40)), 160, -140, '#ffb38a');

  // ---------------------------------------------------------------- camera (chip centres at the stage pose)
  setWorldPose(LB, LB_STAGE, new THREE.Quaternion());
  S.scene.updateMatrixWorld(true);
  const ck = (t, n, dist, az, el, fov = 31) => { const p = centreOf(chip(n)); return orb(t, [p.x, p.y, p.z], dist, az, el, fov); };
  const camKeys = [
    orb(0, [0, 0.6, 0], 34, -16, 50, 33),
    orb(1.8, [-4, 0.6, -3], 26, -16, 54, 32),
    orb(T.years + 1.4, [0, 3, -1.4], 24, -18, 36, 32),
    orb(T.sandwiched + 0.4, [0, 3.6, -1.4], 22, -28, 26, 32),
    ck(T.a20 + 0.3, 'Logic_SoC', 12, -14, 46),
    ck(T.memory + 0.3, 'Logic_SoC', 11, 10, 50),
    ck(T.inside + 0.6, 'Logic_SoC', 8, 0, 58),
    ck(end('l5') + 0.3, 'Logic_SoC', 13, -10, 48),
    ck(T.nand + 0.3, 'Logic_NAND_Flash', 12, 16, 46),
    ck(T.c2 + 0.3, 'Logic_C2_Cellular_Modem', 11, -10, 48),
    ck(T.n1 + 0.3, 'Logic_N1_Wireless_Chip', 12, 12, 48),
    ck(T.power + 0.3, 'Logic_PMIC', 13, -22, 50),
    orb(T.voltages + 0.6, [0, 3, -1.4], 20, -8, 58, 31),
    ck(T.heat + 0.2, 'Logic_SoC', 15, -26, 34),
    ck(T.vapor + 0.8, 'Logic_SoC', 16, -14, 46),
    ck(end('l9') + 0.2, 'Logic_SoC', 16, -14, 46),
    orb(T.graphite + 0.4, [0, 0.8, -3.8], 20, -8, 52, 31),
    orb(T.shed + 0.6, [0, 0.8, -2], 34, 6, 58, 32),
    orb(LAST + 3.0, [0, 0.6, 0], 32, 4, 60, 32)
  ];
  const cam = cameraPath(camKeys, { hold: 0.22 });

  // ====================================================================== per frame
  return (t) => {
    // ---- phone x-ray; logic board out to stage and back (l10)
    const u = out(t);
    const xr = Math.max(prog(t, 0.8, 1.8) * (1 - prog(t, start('l10') + 1.4, start('l10') + 2.0)), 0.75 * prog(t, start('l10') + 1.2, start('l10') + 2.0));
    for (const n of ['Frame_Left', 'Frame_Right', 'Back_Glass_Camera_Half', 'Outer_Display', 'Inner_Display_Left', 'Inner_Display_Right', 'Hinge_Fold', 'Internals_Left', 'Internals_Right']) looks.opacity(P(n), Math.min(1 - 0.85 * xr, 1 - 0.6 * u));
    looks.opacity(P('Logic_Board'), 1 - prog(t, T.years - 0.3, T.years - 0.1) + prog(t, start('l10') + 1.0, start('l10') + 1.4));
    looks.glow(P('Logic_Board'), GREEN, 0.6 * prog(t, 0.8, 1.8) * (1 - u) * (1 - prog(t, start('l10'), start('l10') + 0.4)));
    const p = lbHome.clone().lerp(LB_STAGE, u);
    p.y += Math.sin(Math.PI * u) * 3;
    setWorldPose(LB, p, new THREE.Quaternion());
    const lbA = prog(t, T.years - 0.4, T.years - 0.1) * (1 - prog(t, start('l10') + 1.0, start('l10') + 1.4));
    looks.opacity(LB, lbA);
    LB.visible = lbA > 0.003;
    const ga = ghostA(t);
    setWorldPose(ghost, p.clone().add(V(0, 0.55 + 1.2 * prog(t, T.single - 0.2, T.single + 0.9), 0)), new THREE.Quaternion());
    looks.opacity(ghost, 0.45 * ga);
    looks.glow(ghost, CYAN, 0.35 * ga);
    ghost.visible = ga > 0.003;

    // ---- chips
    const pl = (t0, t1, a = 0.55) => a * (prog(t, t0 - 0.2, t0 + 0.3) - prog(t, t1 - 0.3, t1 + 0.2));
    looks.glow(soc, GREEN, pl(T.a20, end('l2') + 0.2, 0.6));
    looks.glow(chip('Logic_NAND_Flash'), GREEN, pl(T.nand, T.c2, 0.6));
    looks.glow(chip('Logic_C2_Cellular_Modem'), GREEN, pl(T.c2, T.n1, 0.6));
    looks.glow(chip('Logic_N1_Wireless_Chip'), GREEN, pl(T.n1, end('l6') + 0.3, 0.6));
    looks.glow(chip('Logic_PMIC'), AMBER, pl(T.power, end('l7') + 0.3, 0.7));
    rails.forEach((r, i) => r.set(prog(t, T.voltages - 0.4 + i * 0.12, T.voltages + 0.9 + i * 0.12) * 1.05, 1 - prog(t, end('l7') + 0.2, end('l7') + 0.8)));
    // ---- heat: the chip warms, the pad and the vapor chamber go on
    const hot = prog(t, T.heat - 0.3, T.heat + 0.6) * (1 - prog(t, start('l10') - 0.6, start('l10')));
    looks.glow(soc, ORANGE, 0.75 * hot);
    const pi = padIn(t), vi = vcIn(t);
    pad.visible = pi > 0.003; vc.visible = vi > 0.003;
    pad.position.copy(padRest).add(V(0, (1 - pi) * 18 * U, 0));
    vc.position.copy(vcRest).add(V(0, (1 - vi) * 25 * U, 0));
    looks.opacity(pad, pi); looks.opacity(vc, vi);
    heatGlow.material.opacity = 0.8 * hot * vi;
    // ---- graphite pipe through the hinge (l10)
    const pa = pipeA(t);
    pipe.visible = pa > 0.003;
    looks.opacity(pipe, pa);
    heatFlow.set(t > T.graphite ? ((t - T.graphite) * 0.45) % 1.2 : 0, pa * (1 - prog(t, end('l10') - 0.4, end('l10') + 0.4)));
    looks.glow(P('Frame_Right'), ORANGE, 0.25 * prog(t, T.hinge, T.shed) * (1 - prog(t, end('l10') - 0.2, end('l10') + 0.6)));
    looks.glow(P('Frame_Left'), ORANGE, 0.25 * prog(t, T.graphite, T.hinge) * (1 - prog(t, end('l10') - 0.2, end('l10') + 0.6)));

    // ---- macro render (skipped while a micro view fills the frame)
    const ka = loupeA(t), kb = loupeB(t), k = Math.max(ka, kb);
    cam(t, S.camera);
    S.setShadowFocus(V(0, 2, 0), 14);
    looks.apply();
    if (k < 1.99) S.render();
    labels.update(t);
    el.labels.style.opacity = k >= 1.5 ? 0 : 1;
    const sp = S.project(centreOf(soc));
    if (revealMicro(el, k, sp.x, sp.y)) {
      gaa.root.visible = ka > 0;
      vcx.root.visible = kb > 0;
      if (ka > 0) {
        const on = prog(t, T.voltage - 0.2, T.voltage + 0.3) * (1 - prog(t, T.remove - 0.1, T.remove + 0.3)) + prog(t, T.surrounds, T.surrounds + 0.6);
        gaa.update(t, { on: clamp01(on), leak: prog(t, T.remove, T.remove + 0.3) * (1 - prog(t, T.surrounds, T.surrounds + 0.5)) });
        gcam(t, MS.camera);
      } else {
        vcx.update(t, { heat: 1, cycle: prog(t, start('l9') - 0.4, start('l9') + 0.6) });
        vcam(t, MS.camera);
      }
      MS.render();
      mlabels.update(t);
    }

    // ---- overlays
    el.chapter.style.opacity = prog(t, 0.6, 1.1) * (1 - prog(t, 5.6, 6.2));
    el.chapNum.textContent = '05';
    el.chapName.textContent = 'THE BRAINS';
    const b1 = prog(t, T.nm - 0.1, T.nm + 0.3) * (1 - prog(t, T.cpu - 0.2, T.cpu + 0.2));
    const b2 = prog(t, T.billions - 0.1, T.billions + 0.3) * (1 - prog(t, T.shape - 0.4, T.shape));
    el.big.style.opacity = Math.max(b1, b2);
    if (b1 > 0) { el.bigNum.textContent = '2 nm'; el.bigSub.textContent = "Apple's first 2-nanometer iPhone chip"; }
    else if (b2 > 0) { el.bigNum.textContent = 'billions'; el.bigSub.textContent = 'of tiny switches'; }
    el.title.style.opacity = 0;
    el.fade.style.opacity = Math.max(1 - prog(t, 0.0, 0.8), prog(t, LAST + 2.2, LAST + 3.1));
    el.endcard.style.opacity = prog(t, LAST + 2.3, LAST + 3.0);
    const n = el.endcard.querySelector('#stage-endname');
    if (n && n.textContent !== 'CAMERAS') n.textContent = 'CAMERAS';
    el.scale.style.opacity = 0;
    el.scope.style.opacity = 0;
  };
}
