// INSIDE THE iPHONE DUO · 02 THE HINGE (v2)
// The detailed hinge swaps in through an x-ray, floats to centre stage and is explained part by part; the
// phone returns for the poses and the teardrop loop; then the hinge-angle sensor (loupe into a Hall-effect
// sensor) and the display hand-off from the outer to the inner screen.
import { Stage, Labels, THREE, cameraPath, prog, ease, clamp01, lerp, keys } from './engine.js';
import { Looks, noLook, worldPose } from './fx.js';
import { loadDuo, foldRig, floorY, topOf, centreOf, orb } from './duo.js';
import { buildHall, revealMicro } from './microduo.js';
import { at, end, start, LAST } from './vo.js';
import { clear, dimension, paperFold, sectionKey } from './overlays.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CYAN = 0x5fd8ff, AMBER = 0xffb347, WHITE = 0xe8f4ff, GREEN = 0x6ee7a8, RED = 0xff6a5a;

export async function init(el) {
  const S = new Stage(el.macro);
  const { phone, hinge } = await loadDuo(S, ['phone', 'hinge']);
  const looks = new Looks();
  const labels = new Labels(el.labels, S);
  const P = (n) => phone.part(n), H = (n) => hinge.part(n);

  // ---------------------------------------------------------------- word times
  const T = {
    spine: at('h1', 'spine'), pins: at('h1', 'pins'), chain: at('h1', 'chain'), joints: at('h1', 'joints'), watch: at('h1', 'watch'),
    curved: at('h2', 'curved'), pivot: at('h2', 'pivot'), stretch: at('h2', 'stretch'),
    gears: at('h3', 'gears'), push: at('h3', 'push'), follows: at('h3', 'follows'),
    six: at('hs', 'six'), rotate: at('hs', 'rotate'), springsS: at('hs', 'springs'), gearsS: at('hs', 'gears'), channel: at('hs', 'channel'), mirrored: at('hs', 'mirrored'),
    springs: at('h4', 'springs'), cams: at('h4', 'cams'), lock: at('h4', 'lock'), squeeze: at('h4', 'squeeze'), position: at('h4', 'friction'), a165: at('h4', '165'), laptop: at('h4', 'laptop'), tent: at('h4', 'tent'),
    magnets: at('hm', 'magnets'), shut: at('hm', 'shut'),
    closes: at('h5', 'closes'), teardrop: at('h5', 'teardropshaped'), across: at('h5', 'across'),
    paper: at('hp', 'paper'), wideC: at('hp', 'curve'), flat: at('hp', 'flat'), sharp: at('hp', 'sharp'), m48: at('hp', '48'), halfP: at('hp', 'half'),
    flatEnds: at('he', 'flat'), titanium: at('he', 'titanium'), bumps: at('he', 'bumps'), ip: at('he', 'sixty'),
    support: at('h6', 'support'), holds: at('h6', 'holds'), drops: at('h6', 'drops'),
    accordion: at('h7', 'accordion'), power: at('h7', 'power'), flexes: at('h7', 'flexes'),
    knows: at('h8', 'knows'), magnetic: at('h8', 'magnetic'), magnet: at('h8', 'magnet'), hall: at('h8', 'hall'), electrons: at('h8', 'electrons'), voltage: at('h8', 'voltage'), angle: at('h8', 'angle'),
    apps: at('h9', 'apps'), second: at('h9', 'second'), screens: at('h9', 'screens'), hand: at('h9', 'hand'),
    screen: at('h10', 'screen')
  };

  // ---------------------------------------------------------------- the phone: open, flipped to show the spine, poses
  const rig = foldRig(phone, 'right');
  const yOpen = floorY(phone) + 0.02;
  // visible: h1 start, h4 poses through h5, then from the sensor beat (h8) to the end
  const phoneA = (t) => clamp01(1 - prog(t, T.chain + 0.2, T.chain + 1.0) + prog(t, T.laptop - 1.6, T.laptop - 0.6) - prog(t, end('hp') + 0.2, end('hp') + 0.9) + prog(t, start('h8') - 0.8, start('h8')));
  const flipA = (t) => Math.PI * (prog(t, T.spine - 0.6, T.spine + 0.9) - prog(t, T.chain + 0.9, T.chain + 1.0));
  // fold: laptop, tent, closed (teardrop), the sensor demo (open-close), the hand-off (closed -> open)
  const fold = (t) => {
    let f = 0;
    f = lerp(f, 0.5, prog(t, T.laptop - 0.9, T.laptop + 0.4));
    f = lerp(f, 0.667, prog(t, T.tent - 0.7, T.tent + 0.6));
    f = lerp(f, 0.93, prog(t, start('hm') - 0.3, T.magnets));
    f = lerp(f, 1, prog(t, T.magnets + 0.4, T.shut + 0.1, ease.in));
    f = lerp(f, 0, prog(t, T.m48 - 1.4, T.m48 + 0.2));
    f = lerp(f, 0.5, prog(t, start('h8') - 0.6, start('h8') + 0.4));
    // h8: the phone opens and closes slowly while the sensor reads the angle
    if (t > start('h8')) f = 0.5 + 0.38 * Math.sin((t - start('h8')) * 0.9) * (1 - prog(t, end('h8') - 0.4, end('h8') + 0.4));
    f = lerp(f, 1, prog(t, end('h8') - 0.4, end('h8') + 0.4));
    f = lerp(f, 0, prog(t, T.hand - 0.6, T.hand + 1.8));
    return f;
  };
  const roll = (t) => (-2 * Math.PI / 3) * (prog(t, T.tent - 0.7, T.tent + 0.6) - prog(t, start('hm') - 0.3, T.magnets));

  // ---------------------------------------------------------------- the detailed hinge: inside the phone -> centre stage
  const HUP = 3.4;
  const homeHinge = () => {
    const pw = worldPose(P('Hinge_Fold'));
    return { p: pw.p.clone(), q: pw.q.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0))) };
  };
  const floatPose = { p: V(0, HUP, 0), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0.32, 0, 0)) };
  const hingeA = (t) => clamp01(prog(t, T.pins - 0.3, T.pins + 0.5) - prog(t, T.laptop - 1.4, T.laptop - 0.8) + prog(t, start('h6') - 1.0, start('h6') - 0.2) - prog(t, start('h8') - 0.9, start('h8') - 0.3));
  const hingeOut = (t) => prog(t, T.chain + 0.2, T.joints + 1.4);
  const plates = [H('Swing_Plate_L'), H('Swing_Plate_R')];
  const gears = [];
  hinge.root.traverse((o) => { if (o.isMesh && /Sync_Gear_\d/.test(o.name)) gears.push(o); });
  gears.forEach((g) => { g.userData.rx = g.rotation.x; });
  const springs = [];
  hinge.root.traverse((o) => { if (o.isMesh && /Coil_Springs/.test(o.name)) springs.push(o); });
  const bar = H('Centre_Support_Bar'), barY = bar.position.y;
  const flex = H('Accordion_Flex_Cable'), flexS = flex.scale.clone();
  const guides = [];
  hinge.root.traverse((o) => { if (o.isMesh && /Curved_Guide/.test(o.name)) guides.push(o); });
  const links = ['L_Link_Block_Outer', 'R_Link_Block_Pivot', 'R_Link_Block_Outer'].map(H);

  // ---------------------------------------------------------------- teardrop loop inside the closed phone's spine
  const S_PH = 1.6 / 166;
  const TD_IN = 4; // mm from the end of the phone to the loop's cut face
  const TD_UP = 4; // mm the whole loop sits up inside the spine, so its curve stays within the hinge
  const loop = (() => {
    // screen faces sit 0.53 mm either side of the fold plane; the loop bulges into the spine cavity below
    const half = [[0.53, 12], [0.53, 5.4], [1.1, 4.3], [1.75, 3.2], [1.925, 2.1], [1.55, 1.15], [0.8, 0.75], [0, 0.65]];
    const pts = half.map(([x, y]) => [-x, y]).concat(half.slice(0, -1).reverse().map(([x, y]) => [x, y]));
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => V(x * S_PH, (y + TD_UP) * S_PH, 0)), false, 'centripetal');
    const cp = curve.getPoints(90);
    // a short section at the near end (the cut face), plus a bright outline of the profile; the cut face sits
    // inside the shortened hinge cover, so nothing pokes out past the end of the phone
    const Z0 = (117.8 / 2 - 18.5) * S_PH, Z1 = (117.8 / 2 - TD_IN) * S_PH;
    const pos = [], idx = [];
    cp.forEach((p) => { pos.push(p.x, p.y, Z0, p.x, p.y, Z1); });
    for (let i = 0; i < cp.length - 1; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ color: CYAN, emissive: CYAN, emissiveIntensity: 1.6, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const mesh = new THREE.Mesh(g, m);
    mesh.renderOrder = 4;
    phone.root.add(noLook(mesh));
    const edge = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cp.map((q) => V(q.x, q.y, Z1))), 120, 0.12 * S_PH, 8, false),
      new THREE.MeshStandardMaterial({ color: CYAN, emissive: CYAN, emissiveIntensity: 3, transparent: true, opacity: 0 }));
    edge.renderOrder = 5;
    phone.root.add(noLook(edge));
    mesh.userData.edge = edge;
    return mesh;
  })();

  // ---------------------------------------------------------------- sensor markers: a magnet in one half, a Hall sensor in the other
  const mk = (color) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2.2 })); S.scene.add(noLook(m)); return m; };
  const magDot = mk(RED), senDot = mk(CYAN);
  const S_MM = (x, y, z) => V(x * S_PH, y * S_PH, z * S_PH);
  // positions in each half's own frame (near the fold, top of the phone)
  const magLocal = S_MM(-8, 0, -50), senLocal = S_MM(8, 0, -50);

  // ---------------------------------------------------------------- micro: the Hall-effect sensor
  const MS = new Stage(el.micro, { floor: false, background: 0x06080b, fog: [300, 1200] });
  MS.setShadowFocus(V(0, 0, 0), 90);
  const hall = buildHall();
  MS.scene.add(hall.root);
  const mlabels = new Labels(el.mlabels, MS);
  const mlab = (text, t0, t1, a, dx, dy, color) => mlabels.add({ text, t0, t1, anchor: a, dx, dy, color });
  mlab('Hall-effect sensor', T.hall, T.electrons - 0.2, hall.anchors.sensor, 150, 120);
  mlab('Magnet', T.hall + 0.3, end('h8'), hall.anchors.magnet, 140, -120, '#ff8c7a');
  mlab('Electrons pushed to one side', T.electrons, T.voltage - 0.1, hall.anchors.minus, -200, -120);
  mlab('Voltage ∝ angle', T.voltage, end('h8') - 0.2, hall.anchors.plus, 170, 130, '#8ff0c2');
  const loupeK = keys([[0, 0], [T.hall - 0.6, 0], [T.hall + 0.3, 1, 'out'], [T.hall + 1.2, 1], [T.hall + 2.2, 2, 'in'], [end('h8') - 1.0, 2], [end('h8') - 0.1, 0, 'in']]);
  const mcam = cameraPath([
    { t: 0, pos: [70, 60, 110], look: [0, 4, 0], fov: 34 },
    { t: T.hall + 2.2, pos: [50, 48, 90], look: [0, 4, 0], fov: 34 },
    { t: T.electrons + 0.5, pos: [10, 70, 60], look: [0, 4, 0], fov: 34 },
    { t: end('h8'), pos: [-30, 52, 80], look: [0, 4, 0], fov: 34 }
  ], { hold: 0.2 });

  // ---------------------------------------------------------------- section map, rotation arrows, magnets, crease scan
  const SEC = { rot: 0x5fd8ff, damp: 0xff8c7a, gear: 0x8ff0a8, chan: 0xffd166 };
  const rotParts = [...links, plates[0], plates[1], H('End_Caps')];
  const dampParts = ['L_Spring_Pack_Outer', 'L_Spring_Pack_Inner', 'R_Spring_Pack_Inner', 'R_Spring_Pack_Outer'].map(H);
  const gearParts = ['L_Sync_Gears', 'R_Sync_Gears'].map(H);
  const arrowMat = new THREE.MeshStandardMaterial({ color: CYAN, emissive: CYAN, emissiveIntensity: 2.5, transparent: true, opacity: 0, depthWrite: false, depthTest: false });
  const arrows = gearParts.map((gp) => {
    const grp = new THREE.Group();
    const ARC = Math.PI * 1.2;
    grp.add(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 8, 40, ARC), arrowMat));
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 12), arrowMat);
    head.position.set(0.62 * Math.cos(ARC), 0.62 * Math.sin(ARC), 0);
    head.rotation.z = ARC;
    grp.add(head);
    S.scene.add(noLook(grp));
    return { grp, gp };
  });
  // magnets near the outer corners of both halves (pivot-local, mm)
  const magMk = [];
  for (const [piv, sx, col] of [['Fold_Pivot_Left', -1, RED], ['Fold_Pivot_Right', 1, 0x4f8dff]]) for (const z of [-48, 48]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.9), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 2.2, depthTest: false, transparent: true }));
    m.renderOrder = 9;
    S.scene.add(noLook(m));
    magMk.push({ m, piv, local: S_MM(sx * 76, -2.4, z) });
  }
  // crease height scan: a rainbow height field along the fold of the open screen (height exaggerated x120)
  const creaseScan = (() => {
    const W = 30, L = 104, nx = 60, nz = 40, A = 0.048 * 120;
    const g = new THREE.PlaneGeometry(W * S_PH, L * S_PH, nx, nz);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position, col = [];
    const prof = (x) => -A * Math.exp(-((x / 3.6) ** 2)) + 0.32 * A * Math.exp(-(((Math.abs(x) - 6.5) / 2.6) ** 2));
    for (let i = 0; i < pos.count; i++) {
      const xm = pos.getX(i) / S_PH, h = prof(xm);
      pos.setY(i, h * S_PH);
      const u = (h / A + 1) / 1.32; // 0 low .. 1 high
      const c = new THREE.Color().setHSL(0.66 - 0.66 * Math.min(1, Math.max(0, u)), 1, 0.55);
      col.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, emissive: 0x222222, roughness: 0.35, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    m.position.copy(S_MM(0, 3.4 + A + 0.3, 0)); // lifted so the valley sits just above the glass
    phone.root.add(noLook(m));
    return m;
  })();

  // ---------------------------------------------------------------- labels (macro)
  const lab = (text, t0, t1, anchor, dx, dy, color, size) => labels.add({ text, t0, t1, anchor, dx, dy, color, size });
  lab('Titanium spine', T.spine + 0.6, T.pins - 0.1, () => centreOf(P('Titanium_Hinge_Cover')).add(V(0, 0.6, 0)), 150, -130, '#dfe9f5');
  lab('Linked joints', T.joints - 0.1, end('h1') + 0.3, () => topOf(links[0]), -150, -130);
  lab('Curved guides', T.curved - 0.1, end('h2') + 0.2, () => centreOf(guides[0]), -160, 120);
  lab('Virtual pivot inside the screen', T.pivot, end('h2') + 0.2, () => centreOf(links[1]).add(V(0, 1.2, 0)), 150, -150, '#9fe6ff');
  lab('Synchronization gears', T.gears - 0.1, end('h3') + 0.3, () => topOf(H('L_Sync_Gears')), -170, -140);
  lab('Coil springs', T.springs - 0.1, T.cams - 0.1, () => topOf(H('R_Spring_Pack_Outer')), 160, -140);
  lab('Cams + springs = friction', T.cams, T.laptop - 0.9, () => topOf(H('L_Spring_Pack_Outer')), -190, -140, '#ffb38a');
  lab('Magnets', T.magnets - 0.1, T.shut + 0.4, () => magMk[3].m.position.clone(), 150, -130, '#9fc3ff');
  lab('Flat ends · titanium cover', T.flatEnds - 0.1, T.ip - 0.2, () => topOf(H('End_Caps')), 150, -130, '#dfe9f5');
  lab('Laptop', T.laptop - 0.1, T.tent - 0.4, () => topOf(phone.root), 160, -80, '#9fe6ff');
  lab('Tent', T.tent + 0.2, end('h4') + 0.3, () => topOf(phone.root), 160, -80, '#9fe6ff');
  lab('Screen loops inside the hinge', T.teardrop - 0.1, T.across - 0.3, () => loop.localToWorld(S_MM(-1.3, 2.4 + TD_UP, 20)), -200, -140);
  lab('Center support bar', T.support - 0.1, T.drops - 0.3, () => topOf(bar), 160, -140);
  lab('Drops to make room', T.drops - 0.1, end('h6') + 0.3, () => centreOf(bar), -180, 140, '#9fe6ff');
  lab('Accordion flex cable', T.accordion - 0.1, T.power - 0.2, () => topOf(flex), 160, -140, '#ffc56e');
  lab('Power + data between the halves', T.power - 0.1, end('h7') + 0.3, () => topOf(flex), 160, -140, '#ffc56e');
  lab('Magnet', T.magnet - 0.1, T.hall + 0.2, () => magDot.position.clone(), -150, -120, '#ff8c7a');
  lab('Hall sensor', T.hall - 0.3, T.hall + 0.3, () => senDot.position.clone(), 150, -120);
  lab('Outer screen', T.second, T.hand - 0.2, () => topOf(phone.root), 160, -120);
  lab('Inner screen', T.hand + 1.2, end('h9') + 0.4, () => topOf(P('Inner_Display_Right')), 160, -120);

  // ---------------------------------------------------------------- camera
  const F = [0, HUP, 0];
  const camKeys = [
    orb(0, [0, 0.6, 0], 34, -18, 40, 33),
    orb(T.spine + 0.2, [0, 3.8, 0], 27, -30, 30, 32),
    orb(T.pins + 0.6, [0, 3.2, 0], 24, -12, 36, 31),
    orb(T.joints + 1.4, F, 24, 14, 26, 31),
    orb(T.watch + 0.4, [-1.5, HUP, 0], 15, 30, 26, 30),
    orb(start('hs') + 0.6, F, 22, -6, 40, 31),
    orb(end('hs'), F, 20, 12, 46, 31),
    orb(T.curved + 0.6, [-3.4, HUP - 0.6, 0.2], 11, -62, 24, 30),
    orb(T.pivot + 0.6, [-2.8, HUP - 0.4, 0], 12, -78, 23, 30),
    orb(end('h2'), [-2.5, HUP, 0], 14, -40, 30, 30),
    orb(T.gears + 0.6, [-3.6, HUP, 0], 11, -18, 48, 30),
    orb(T.follows + 0.6, [-2.6, HUP, 0], 14, 20, 40, 30),
    orb(T.springs + 0.4, [2.4, HUP, 0], 11, 26, 44, 30),
    orb(T.cams + 0.3, [1.6, HUP, 0], 11, 40, 30, 30),
    orb(T.position, [1.6, HUP, 0], 16, 34, 34, 31),
    orb(T.laptop + 0.3, [0, 4, 0], 38, 18, 18, 32),
    orb(T.tent + 1.0, [0, 4, 0], 36, -14, 16, 32),
    orb(T.magnets + 0.3, [0, 1, 0], 30, 30, 24, 32),
    orb(start('h5') + 0.6, [0, 0.8, 4], 24, 10, 26, 32),
    orb(T.teardrop + 0.2, [0.1, 0.5, 5.4], 9.5, 2, 18, 30),
    orb(T.flat + 0.4, [0.1, 0.5, 5.4], 10.5, 10, 24, 30),
    orb(T.m48 + 0.6, [0, 0.6, 0], 28, -24, 34, 32),
    orb(end('hp'), [0, 0.6, -1], 24, -10, 42, 32),
    orb(start('h6') + 0.2, F, 22, -10, 30, 31),
    orb(T.support + 0.4, [0, HUP, 0], 14, -16, 40, 30),
    orb(T.drops + 0.2, [0, HUP - 0.6, 0], 12, -86, 24, 30),
    orb(start('h7') + 0.4, [0, HUP + 0.4, 0.4], 12, 24, 52, 30),
    orb(T.flexes + 0.6, [0, HUP + 0.4, 0.4], 14, 44, 40, 30),
    orb(T.flatEnds + 0.4, [5, HUP, 0], 12, 70, 22, 30),
    orb(T.ip + 0.2, F, 22, 20, 30, 31),
    orb(start('h8') + 0.6, [0, 4, -2], 34, -20, 22, 32),
    orb(T.hall - 0.2, [0, 5, -4], 22, -30, 26, 31),
    orb(end('h8'), [0, 4, -2], 34, -16, 24, 32),
    orb(T.hand + 0.2, [0, 3, 0], 34, -10, 30, 32),
    orb(end('h9') + 0.6, [0, 0.8, 0], 32, -4, 52, 32),
    orb(LAST + 3.0, [0, 0.6, 0], 27, 2, 62, 31)
  ];
  // end-on view of the closed phone's hinge (computed from the closed pose)
  rig.place(V(0, yOpen, 0));
  rig.set(1);
  phone.root.updateWorldMatrix(true, true);
  { const b = new THREE.Box3().setFromObject(phone.root); phone.root.position.y += 0.02 - b.min.y; phone.root.updateWorldMatrix(true, true); }
  const tdEnd = loop.localToWorld(S_MM(0, 3.2 + TD_UP, 117.8 / 2 - TD_IN));
  rig.set(0);
  const ki = camKeys.findIndex((k) => k.t === T.teardrop + 0.2);
  camKeys[ki] = { t: T.teardrop + 0.2, pos: [tdEnd.x + 0.3, tdEnd.y + 0.45, tdEnd.z + 4.6], look: [tdEnd.x, tdEnd.y, tdEnd.z], fov: 30 };
  camKeys[ki + 1] = { t: T.flat + 0.4, pos: [tdEnd.x + 0.6, tdEnd.y + 0.7, tdEnd.z + 3.9], look: [tdEnd.x, tdEnd.y, tdEnd.z], fov: 30 };
  const cam = cameraPath(camKeys, { hold: 0.22 });
  const outerImg = P('Outer_Screen_Image').material, innerImgs = ['Inner_Display_Left_Screen_Image', 'Inner_Display_Right_Screen_Image'].map((n) => P(n).material);

  // ====================================================================== per frame
  return (t) => {
    // ---- phone pose (stands on the floor in any pose)
    const q = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), flipA(t) + roll(t));
    const lift = 4 * (prog(t, T.spine - 0.6, T.spine + 0.6) - prog(t, T.chain + 0.9, T.chain + 1.0));
    rig.place(V(0, yOpen + lift, 0), q);
    const f = fold(t);
    rig.set(f);
    if (f > 0.01 || Math.abs(roll(t)) > 0.01) {
      phone.root.updateWorldMatrix(true, true);
      const b = new THREE.Box3().setFromObject(phone.root);
      phone.root.position.y += 0.02 - b.min.y;
    }
    const pa = phoneA(t);
    if (pa < 0.999) looks.opacity(phone.root, pa);
    // x-ray in h1, and the see-through phone around the teardrop loop in h5
    const xr1 = prog(t, T.pins - 0.4, T.pins + 0.3) * (1 - prog(t, T.chain + 0.2, T.chain + 1.0));
    const xr2 = prog(t, T.closes - 0.2, T.teardrop - 0.4) * (1 - prog(t, T.m48 - 1.6, T.m48 - 1.0));
    if (xr1 > 0) for (const n of ['Frame_Left', 'Frame_Right', 'Back_Glass_Camera_Half', 'Outer_Display', 'Inner_Display_Left', 'Inner_Display_Right', 'Internals_Left', 'Internals_Right', 'Hinge_Fold']) looks.opacity(P(n), pa * (1 - 0.85 * xr1));
    if (xr1 > 0) looks.opacity(P('Hinge'), pa * (1 - xr1));
    if (xr2 > 0) {
      for (const n of ['Frame_Left', 'Frame_Right', 'Back_Glass_Camera_Half', 'Outer_Display', 'Inner_Display_Left', 'Inner_Display_Right', 'Internals_Left', 'Internals_Right']) looks.opacity(P(n), pa * (1 - 0.88 * xr2));
      looks.opacity(P('Hinge'), pa * (1 - 0.95 * xr2));
      looks.opacity(P('Titanium_Hinge_Cover'), pa * (1 - 0.7 * xr2));
      looks.glow(P('Titanium_Hinge_Cover'), WHITE, 0.25 * xr2);
    }
    loop.material.opacity = 0.45 * xr2;
    loop.visible = xr2 > 0.01;
    loop.userData.edge.material.opacity = xr2;
    loop.userData.edge.visible = xr2 > 0.01;
    looks.glow(P('Titanium_Hinge_Cover'), WHITE, 0.5 * (prog(t, T.spine, T.spine + 0.5) - prog(t, T.pins - 0.4, T.pins)));

    // ---- sensor markers ride on each half
    const mkA = prog(t, T.magnet - 0.4, T.magnet) * (1 - prog(t, end('h8') - 0.2, end('h8') + 0.3));
    phone.root.updateWorldMatrix(true, true);
    magDot.position.copy(P('Fold_Pivot_Left').localToWorld(magLocal.clone()));
    senDot.position.copy(P('Fold_Pivot_Right').localToWorld(senLocal.clone()));
    magDot.visible = senDot.visible = mkA > 0.01;
    magDot.scale.setScalar(mkA); senDot.scale.setScalar(mkA);

    // ---- display hand-off: outer lit when closed, inner lit as it opens
    const handA = prog(t, start('h9') - 0.2, start('h9') + 0.6);
    const open = 1 - f;
    outerImg.emissiveIntensity = handA > 0 ? 0.55 * lerp(1, clamp01(1 - open * 2.2), handA) : 0.55;
    innerImgs.forEach((m) => { m.emissiveIntensity = handA > 0 ? 0.55 * lerp(1, clamp01((open - 0.25) * 1.6), handA) : 0.55; });

    // ---- hinge pose and motion
    const home = homeHinge();
    const u = hingeOut(t);
    const p = home.p.clone().lerp(floatPose.p, u);
    p.y += Math.sin(Math.PI * u) * 4;
    hinge.root.position.copy(p);
    hinge.root.quaternion.copy(home.q).slerp(floatPose.q, u);
    const ha = hingeA(t);
    if (ha < 0.999) looks.opacity(hinge.root, ha);
    hinge.root.visible = ha > 0.003;
    const swing = 0.32 * Math.sin(Math.max(0, t - T.watch) * 2.2) * (prog(t, T.watch - 0.4, T.watch + 0.4) - prog(t, end('h3') - 0.4, end('h3') + 0.3))
      + 0.32 * Math.sin(Math.max(0, t - T.push) * 2.8) * (prog(t, T.push - 0.3, T.push + 0.3) - prog(t, end('h3') - 0.6, end('h3')));
    plates[0].rotation.x = swing;
    plates[1].rotation.x = -swing;
    gears.forEach((g, i) => { g.rotation.x = g.userData.rx + (i % 2 ? -1 : 1) * swing * 6; });
    const sq = 1 - 0.12 * Math.abs(Math.sin(Math.max(0, t - T.springs) * 2.6)) * (prog(t, T.springs - 0.2, T.springs + 0.3) - prog(t, T.laptop - 1.2, T.laptop - 0.8));
    springs.forEach((m) => { m.scale.x = sq; });
    bar.position.y = barY - 0.03 * prog(t, T.drops - 0.2, T.drops + 0.8);
    const br = prog(t, T.accordion - 0.2, T.accordion + 0.2) * (1 - prog(t, end('h7') - 0.2, end('h7') + 0.3));
    flex.scale.set(flexS.x, flexS.y, flexS.z * (1 + 0.12 * br * Math.sin(Math.max(0, t - T.accordion) * 3.2)));
    const pl = (t0, t1, a = 0.55) => a * (prog(t, t0 - 0.2, t0 + 0.3) - prog(t, t1 - 0.3, t1 + 0.2));
    links.forEach((l) => looks.glow(l, CYAN, pl(T.joints, end('h1') + 0.3, 0.5)));
    guides.forEach((g) => looks.glow(g, CYAN, pl(T.curved, end('h2'), 0.8)));
    for (const n of ['L_Sync_Gears', 'R_Sync_Gears']) looks.glow(H(n), CYAN, pl(T.gears, end('h3') + 0.2, 0.55));
    for (const n of ['L_Spring_Pack_Outer', 'L_Spring_Pack_Inner', 'R_Spring_Pack_Inner', 'R_Spring_Pack_Outer']) looks.glow(H(n), CYAN, pl(T.springs, T.laptop - 0.9, 0.5));
    looks.glow(bar, CYAN, pl(T.support, end('h6') + 0.2, 0.6));
    looks.glow(flex, AMBER, pl(T.accordion, end('h7') + 0.2, 0.8));
    const fa = prog(t, start('h7') - 0.6, start('h7')) * (1 - prog(t, end('h7') + 0.3, end('h7') + 0.9));
    if (fa < 0.999) looks.opacity(flex, fa);

    // ---- section map (hs): each job lights in its colour, then all together
    const on = (t0, t1, a = 0.6) => a * (prog(t, t0 - 0.2, t0 + 0.3) - prog(t, t1 - 0.3, t1 + 0.2));
    const all = on(T.mirrored, end('hs') + 0.2, 0.5);
    rotParts.forEach((o) => looks.glow(o, SEC.rot, Math.max(on(T.rotate, T.springsS, 0.6), all)));
    dampParts.forEach((o) => looks.glow(o, SEC.damp, Math.max(on(T.springsS, T.gearsS, 0.6), all, on(T.cams, T.laptop - 0.9, 0.55))));
    gearParts.forEach((o) => looks.glow(o, SEC.gear, Math.max(on(T.gearsS, T.channel, 0.6), all)));
    looks.glow(bar, SEC.chan, Math.max(on(T.channel, T.mirrored, 0.6), all));
    // rotation arrows sweep round the gears while they turn (h3)
    const ar = on(T.gears, end('h3') + 0.2, 1);
    arrowMat.opacity = ar;
    arrows.forEach((a, i) => {
      a.grp.visible = ar > 0.01 && hinge.root.visible;
      a.grp.position.copy(centreOf(a.gp)).add(V(0, 0.35, 0).applyQuaternion(hinge.root.quaternion));
      a.grp.quaternion.copy(hinge.root.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, (i ? -1 : 1) * swing * 3)));
    });
    // magnets snap it shut (hm)
    const mg = on(T.magnets - 0.2, T.shut + 0.6, 1);
    phone.root.updateWorldMatrix(true, true);
    magMk.forEach((k) => { k.m.visible = mg > 0.01; k.m.position.copy(P(k.piv).localToWorld(k.local.clone())); k.m.quaternion.copy(P(k.piv).getWorldQuaternion(new THREE.Quaternion())); k.m.scale.setScalar(Math.max(0.01, mg)); });
    // crease scan (hp)
    const cs = prog(t, T.m48 - 0.4, T.m48 + 0.6) * (1 - prog(t, end('hp') + 0.1, end('hp') + 0.6));
    creaseScan.visible = cs > 0.01;
    creaseScan.material.opacity = 0.92 * cs;
    creaseScan.scale.set(1, Math.max(0.01, ease.out(cs)), 1);
    // flat titanium ends (he)
    looks.glow(H('End_Caps'), WHITE, on(T.flatEnds, T.ip, 0.6));
    looks.glow(H('Spine_Cover'), WHITE, on(T.titanium, T.ip + 1.0, 0.4));

    // ---- macro camera and render (skipped while the micro view fills the frame)
    const k = loupeK(t);
    cam(t, S.camera);
    S.setShadowFocus(V(0, 0, 0), 14);
    looks.apply();
    if (k < 1.99) S.render();
    labels.update(t);
    el.labels.style.opacity = k >= 1.5 ? 0 : 1;
    // ---- micro: the Hall sensor, its magnet tracking the real fold angle
    const sp = senDot.visible ? S.project(senDot.position) : { x: 960, y: 540 };
    if (revealMicro(el, k, sp.x, sp.y)) {
      hall.update(t, { near: clamp01(f * 1.15), flow: 1 });
      mcam(t, MS.camera);
      MS.render();
      mlabels.update(t);
    }

    // ---- overlays
    el.chapter.style.opacity = prog(t, 0.6, 1.1) * (1 - prog(t, 5.6, 6.2));
    el.chapNum.textContent = '02';
    el.chapName.textContent = 'THE HINGE';
    const b1 = prog(t, T.follows - 0.1, T.follows + 0.4) * (1 - prog(t, end('h3') - 0.2, end('h3') + 0.3));
    const b2 = prog(t, T.apps - 0.2, T.apps + 0.3) * (1 - prog(t, end('h9') + 0.2, end('h9') + 0.7));
    const b3 = prog(t, T.a165 - 0.3, T.a165 + 0.2) * (1 - prog(t, T.laptop - 0.4, T.laptop));
    const b4 = prog(t, T.m48 - 0.1, T.m48 + 0.4) * (1 - prog(t, end('hp') + 0.1, end('hp') + 0.6));
    const b5 = prog(t, T.ip - 0.3, T.ip + 0.2) * (1 - prog(t, end('he') + 0.1, end('he') + 0.6));
    el.big.style.opacity = Math.max(b1, b2, b3, b4, b5);
    if (b1 > 0) { el.bigNum.textContent = '1 : 1'; el.bigSub.textContent = 'both halves, same angle'; }
    else if (b2 > 0) { el.bigNum.textContent = `${Math.round(180 * (1 - f))}°`; el.bigSub.textContent = 'hinge angle, read live'; }
    else if (b3 > 0) { el.bigNum.textContent = '15° – 165°'; el.bigSub.textContent = 'holds any angle in between'; }
    else if (b4 > 0) { el.bigNum.textContent = '≈ 48 µm'; el.bigSub.textContent = 'crease depth when new · height ×120 here'; }
    else if (b5 > 0) { el.bigNum.textContent = 'IP68'; el.bigSub.textContent = 'dust and water, moving parts and all'; }
    // 2D overlays: section key, teardrop width, paper analogy
    const sk = prog(t, T.six - 0.3, T.six + 0.2) * (1 - prog(t, end('hs') + 0.2, end('hs') + 0.7));
    const dm = prog(t, T.across - 0.6, T.across) * (1 - prog(t, end('h5') + 0.1, end('h5') + 0.5));
    const pf = prog(t, T.paper - 0.3, T.paper + 0.3) * (1 - prog(t, T.m48 - 0.8, T.m48 - 0.3));
    el.ov.style.opacity = Math.max(sk, dm, pf);
    if (sk > 0) sectionKey(el.ov, 4.5 * prog(t, T.rotate - 0.4, T.mirrored, (x) => x) + 0.2, [['1·6', 'Rotation hinges', '#5fd8ff'], ['2·4', 'Springs + cams', '#ff8c7a'], ['3', 'Sync gears', '#8ff0a8'], ['5', 'Cable channel', '#ffd166']]);
    else if (pf > 0) paperFold(el.ov, prog(t, T.paper - 0.3, T.flat + 0.6));
    else if (dm > 0) {
      clear(el.ov);
      const Z1 = 117.8 / 2 - 1.5;
      const a = S.project(loop.localToWorld(S_MM(-1.925, 2.1, Z1))), b = S.project(loop.localToWorld(S_MM(1.925, 2.1, Z1)));
      dimension(el.ov, a, b, '3.85 mm', 1, -60);
    } else clear(el.ov);
    el.title.style.opacity = 0;
    el.fade.style.opacity = Math.max(1 - prog(t, 0.0, 0.8), prog(t, LAST + 2.2, LAST + 3.1));
    el.endcard.style.opacity = prog(t, LAST + 2.3, LAST + 3.0);
    const n = el.endcard.querySelector('#stage-endname');
    if (n && n.textContent !== 'THE SCREEN') n.textContent = 'THE SCREEN';
    el.scale.style.opacity = 0;
    el.scope.style.opacity = 0;
  };
}
