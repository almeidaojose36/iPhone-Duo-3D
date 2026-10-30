// INSIDE THE iPHONE DUO · OUTRO
// The journey recap: every module flies out of the phone onto the bench and lights up as it is recalled,
// then everything flies home, the phone closes, and the end screen (two video tiles + subscribe) holds.
import { Stage, Labels, THREE, cameraPath, prog, ease, clamp01, lerp } from './engine.js';
import { Looks } from './fx.js';
import { loadDuo, foldRig, floorY, topOf, orb } from './duo.js';
import { at, end, start, LAST } from './vo.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CYAN = 0x5fd8ff, AMBER = 0xffb347, WHITE = 0xe8f4ff, GREEN = 0x6ee7a8, ORANGE = 0xff7a2f;

export async function init(el) {
  const S = new Stage(el.macro);
  const M = await loadDuo(S, ['phone', 'hinge', 'batteries', 'boards', 'cameras', 'display', 'sound']);
  const { phone } = M;
  const looks = new Looks();
  const labels = new Labels(el.labels, S);
  el.micro.style.opacity = 0;
  const P = (n) => phone.part(n);

  const T = {
    journey: at('v1', 'journey'), hinge: at('v1', 'hinge'), gears: at('v1', 'gears'),
    screen: at('v2', 'screen'), leds: at('v2', 'leds'), cover: at('v2', 'cover'),
    power: at('v3', 'power'), batteries: at('v3', 'batteries'), transistors: at('v3', 'transistors'), heat: at('v3', 'heat'), graphite: at('v3', 'graphite'),
    mm: at('v4', 'millimeters'),
    enjoyed: at('v5', 'enjoyed'), subscribe: at('v5', 'subscribe')
  };
  const ES = end('v5') + 0.4; // end screen start (held for the tail)

  // ---------------------------------------------------------------- the phone and the bench layout
  const rig = foldRig(phone, 'right');
  const yOpen = floorY(phone) + 0.02;
  rig.place(V(0, yOpen, 0));
  const q0 = new THREE.Quaternion();
  const qBatt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
  const parts = [
    { key: 'display', p: V(0, 0, -15.2), q: q0, d: 0.0 },
    { key: 'hinge', p: V(0, 0, 10.6), q: q0, d: 0.2 },
    { key: 'batteries', p: V(-19.5, 0, -1.5), q: qBatt, d: 0.4 },
    { key: 'boards', p: V(19.2, 0, -5.2), q: q0, d: 0.6 },
    { key: 'cameras', p: V(19.5, 0, 3.4), q: q0, d: 0.8 },
    { key: 'sound', p: V(19.5, 0, 9.6), q: q0, d: 1.0 }
  ];
  for (const it of parts) {
    const m = M[it.key];
    m.root.quaternion.copy(it.q);
    it.p.y = floorY(m) + 0.02;
  }
  const OUT0 = start('v1') + 0.6, HOME0 = T.mm - 2.4;
  const flyOut = (t, d) => prog(t, OUT0 + d, OUT0 + d + 2.0);
  const flyHome = (t, d) => prog(t, HOME0 + (1.0 - d) * 0.35, HOME0 + (1.0 - d) * 0.35 + 1.5);
  const fold = (t) => prog(t, T.mm - 0.2, T.mm + 1.6);

  // ---------------------------------------------------------------- labels
  const lab = (text, t0, t1, anchor, dx, dy, color) => labels.add({ text, t0, t1, anchor, dx, dy, color });
  lab('Hinge · 100+ parts', T.hinge - 0.1, T.screen - 0.3, () => topOf(M.hinge.root), 150, -110, '#dfe9f5');
  lab('Folding OLED screen', T.screen - 0.1, T.power - 0.3, () => topOf(M.display.root), 150, -110);
  lab('Two batteries', T.batteries - 0.2, T.transistors - 0.2, () => topOf(M.batteries.root), 150, -110, '#ffc56e');
  lab('A20 Pro · nanosheet transistors', T.transistors - 0.1, T.graphite - 0.2, () => topOf(M.boards.root), -200, -120, '#8ff0c2');
  lab('Graphite pipe · heat across the fold', T.graphite - 0.1, HOME0 - 0.1, () => topOf(M.hinge.part('Accordion_Flex_Cable')), 160, -120, '#ffb38a');

  // ---------------------------------------------------------------- camera
  const camKeys = [
    orb(0, [0, 0.6, 0], 34, -14, 46, 33),
    orb(OUT0 + 0.4, [0, 3, -1], 52, -10, 52, 34),
    orb(OUT0 + 3.4, [0, 0, -2.4], 72, -4, 66, 34),
    orb(T.hinge + 0.2, [0, 0, 6], 40, -10, 52, 33),
    orb(T.screen + 0.3, [0, 0, -12], 40, -6, 56, 33),
    orb(T.batteries, [-14, 0, -1], 40, -22, 52, 33),
    orb(T.transistors + 0.2, [16, 0, -3], 38, 20, 54, 33),
    orb(T.graphite + 0.2, [0, 0, 6], 38, 8, 54, 33),
    orb(HOME0 - 0.2, [0, 0, -2.4], 70, 0, 64, 34),
    orb(T.mm + 1.0, [0, 1.6, 0], 34, -18, 30, 33),
    orb(ES, [0, 1.2, 0], 30, -28, 26, 32),
    orb(ES + 20, [0, 1.0, 0], 26, -60, 22, 31)
  ];
  const cam = cameraPath(camKeys, { hold: 0.22 });

  // ====================================================================== per frame
  return (t) => {
    rig.set(fold(t));
    const away = prog(t, OUT0, OUT0 + 1.4) * (1 - prog(t, HOME0 + 1.0, HOME0 + 1.8));
    if (away > 0) for (const n of ['Internals_Left', 'Internals_Right', 'Inner_Display_Left', 'Inner_Display_Right', 'Hinge']) looks.opacity(P(n), 1 - 0.85 * away);
    const homeP = V(0, yOpen + 0.2, 0);
    for (const it of parts) {
      const m = M[it.key];
      const o = flyOut(t, it.d), h = flyHome(t, it.d);
      const u = o * (1 - h);
      const p = homeP.clone().lerp(it.p, u);
      p.y += Math.sin(Math.PI * (h > 0 ? h : o)) * 7;
      m.root.position.copy(p);
      m.root.quaternion.copy(q0).slerp(it.q, u);
      const a = prog(t, OUT0 + it.d, OUT0 + it.d + 0.3) * (1 - prog(t, HOME0 + (1.0 - it.d) * 0.35 + 1.1, HOME0 + (1.0 - it.d) * 0.35 + 1.5));
      if (a < 0.999) looks.opacity(m.root, a);
      m.root.visible = a > 0.003;
    }
    const pl = (t0, t1, a = 0.5) => a * (prog(t, t0 - 0.2, t0 + 0.3) - prog(t, t1 - 0.3, t1 + 0.2));
    looks.glow(M.hinge.root, WHITE, pl(T.hinge, T.screen, 0.45));
    looks.glow(M.display.root, CYAN, pl(T.screen, T.power, 0.35));
    looks.glow(M.batteries.root, AMBER, pl(T.power, T.transistors, 0.5));
    looks.glow(M.boards.root, GREEN, pl(T.transistors, T.heat, 0.45));
    looks.glow(M.hinge.part('Accordion_Flex_Cable'), ORANGE, pl(T.graphite, HOME0, 0.9));
    looks.glow(M.boards.part('Logic_SoC'), ORANGE, pl(T.heat, HOME0, 0.6));

    cam(t, S.camera);
    S.setShadowFocus(V(0, 0, -1), 26);
    looks.apply();
    S.render();
    labels.update(t);

    // ---- overlays
    el.chapter.style.opacity = 0;
    const b1 = prog(t, T.mm - 0.3, T.mm + 0.3) * (1 - prog(t, end('v4') + 0.3, end('v4') + 0.8));
    el.big.style.opacity = b1;
    if (b1 > 0) { el.bigNum.textContent = '5.2 mm'; el.bigSub.textContent = 'and it folds in half'; }
    el.title.style.opacity = prog(t, T.enjoyed - 0.4, T.enjoyed + 0.3) * (1 - prog(t, ES - 0.6, ES));
    el.titleH.textContent = 'INSIDE THE iPHONE DUO';
    el.titleP.textContent = 'A FOLDABLE, TAKEN APART';
    el.endcard.style.opacity = 0;
    el.es.style.opacity = prog(t, ES, ES + 1.0);
    el.fade.style.opacity = Math.max(1 - prog(t, 0.0, 0.8), prog(t, LAST + 19.4, LAST + 20.4));
    el.scale.style.opacity = 0;
    el.loupe.style.opacity = 0;
    el.scope.style.opacity = 0;
  };
}
