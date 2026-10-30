// INSIDE THE iPHONE DUO · 07 SOUND AND TOUCH
// The Taptic Engine opens: magnet mass on springs beside a coil; the current flips and the mass shakes.
// Then the speaker: coil, diaphragm and magnet; the diaphragm pumps and sound rings out of the grille.
import { Stage, Labels, THREE, cameraPath, prog, ease, clamp01, lerp } from './engine.js';
import { Looks, noLook } from './fx.js';
import { loadDuo, foldRig, floorY, topOf, centreOf, explode, orb } from './duo.js';
import { at, end, start, LAST } from './vo.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const CYAN = 0x5fd8ff, AMBER = 0xffb347, WHITE = 0xe8f4ff, ORANGE = 0xff7a2f;

export async function init(el) {
  const S = new Stage(el.macro);
  const { phone, sound } = await loadDuo(S, ['phone', 'sound']);
  const looks = new Looks();
  const labels = new Labels(el.labels, S);
  el.micro.style.opacity = 0;
  const P = (n) => phone.part(n), Q = (n) => sound.part(n);

  const T = {
    sound0: at('s1', 'sound'), touch0: at('s1', 'touch'),
    taptic: at('s2', 'taptic'), magnet: at('s2', 'magnet'), springs: at('s2', 'springs'), coil: at('s2', 'coil'),
    current: at('s3', 'current'), pushes: at('s3', 'pushes'), reverse: at('s3', 'reverse'), shake: at('s3', 'shake'), tap: at('s3', 'tap'), buzz: at('s3', 'buzz'),
    speakers: at('s4', 'speakers'), coil2: at('s4', 'coil'), diaphragm: at('s4', 'diaphragm'), music: at('s4', 'music'), air: at('s4', 'air'),
    drivers: at('s5', 'drivers'), chamber: at('s5', 'chamber'), two: at('s5', 'two'), stereo: at('s5', 'stereo')
  };

  // ---------------------------------------------------------------- phone (fades out) and the sound + touch parts
  const rig = foldRig(phone, 'right');
  const yOpen = floorY(phone) + 0.02;
  rig.place(V(0, yOpen, 0));
  rig.set(0);
  const PART_Y = 2.2;
  const phoneA = (t) => 1 - prog(t, T.taptic - 1.6, T.taptic - 0.4) + prog(t, LAST - 1.4, LAST - 0.2);
  const partsIn = (t) => prog(t, T.touch0 - 0.4, T.taptic) * (1 - prog(t, LAST - 1.6, LAST - 0.4));
  // which parts are opened: the Taptic Engine in s2-s3, the speaker in s4-s5
  const tapticOpen = (t) => prog(t, T.taptic + 0.2, T.magnet + 0.4) * (1 - prog(t, end('s3') - 0.4, end('s3') + 0.4));
  const speakerOpen = (t) => prog(t, T.speakers, T.coil2 + 0.4) * (1 - prog(t, T.chamber - 0.6, T.chamber + 0.2));
  const mass = Q('Taptic_Moving_Mass'), coil = Q('Taptic_Coil'), dia = Q('Speaker_Diaphragm'), vcoil = Q('Speaker_Voice_Coil');

  // sound waves: expanding rings out of the grille (+X side of the speaker)
  const rings = [0, 1, 2, 3, 4].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 8, 64), new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0 }));
    m.rotation.y = Math.PI / 2;
    S.scene.add(noLook(m));
    return m;
  });
  // vibration arcs around the Taptic Engine
  const buzz = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 6, 48, Math.PI * 0.6), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0 }));
    S.scene.add(noLook(m));
    return m;
  });

  // ---------------------------------------------------------------- labels
  const lab = (text, t0, t1, anchor, dx, dy, color, size) => labels.add({ text, t0, t1, anchor, dx, dy, color, size });
  lab('Taptic Engine', T.taptic - 0.1, T.magnet - 0.2, () => topOf(Q('Taptic_Engine')), -160, -130);
  lab('Magnet mass', T.magnet - 0.1, T.current - 0.2, () => topOf(mass), -150, -130, '#dfe9f5');
  lab('Springs', T.springs - 0.1, T.current - 0.2, () => topOf(Q('Taptic_Springs')), -170, 100, '#dfe9f5');
  lab('Coil', T.coil - 0.1, end('s3') - 0.2, () => topOf(coil), 140, 110, '#ffb38a');
  lab('Tap · click · buzz', T.tap - 0.2, end('s3') - 0.2, () => topOf(mass), -170, -150, '#ffc56e');
  lab('Speaker', T.speakers - 0.1, T.coil2 - 0.2, () => topOf(Q('Speaker')), 150, -130);
  lab('Voice coil', T.coil2 - 0.1, T.music - 0.2, () => topOf(vcoil), 160, 100, '#ffb38a');
  lab('Diaphragm', T.diaphragm - 0.1, end('s4') - 0.2, () => topOf(dia), 150, -130, '#dfe9f5');
  lab('Magnet', T.diaphragm + 0.4, T.music - 0.2, () => topOf(Q('Speaker_Magnet')), -150, 110, '#dfe9f5');
  lab('Acoustic chamber', T.chamber - 0.2, T.two - 0.2, () => topOf(Q('Speaker_Chamber')), 150, -120);
  lab('× 2 · stereo', T.two - 0.1, end('s5') + 0.3, () => topOf(Q('Speaker')), 150, -120, '#8ff0c2');

  // ---------------------------------------------------------------- camera
  sound.root.position.set(0, PART_Y, 0);
  S.scene.updateMatrixWorld(true);
  const tc = centreOf(Q('Taptic_Engine')), sc = centreOf(Q('Speaker'));
  const k = (t, p, dist, az, el, fov = 31) => orb(t, [p.x, p.y, p.z], dist, az, el, fov);
  const camKeys = [
    orb(0, [0, 0.6, 0], 34, -14, 46, 33),
    orb(T.touch0, [0, 1.8, 0], 22, -10, 34, 32),
    k(T.taptic + 0.4, tc, 9, -24, 34),
    k(T.coil + 0.4, tc, 7.5, -36, 40),
    k(T.shake, tc, 7, -10, 30),
    k(end('s3'), tc, 8, 10, 38),
    k(T.speakers + 0.6, sc, 8, 24, 36),
    k(T.music + 0.4, sc, 7, 40, 26),
    k(T.chamber + 0.3, sc, 8, 16, 42),
    orb(T.stereo + 0.4, [0, 1.8, 0], 16, 6, 36, 32),
    orb(LAST + 3.0, [0, 0.6, 0], 30, 2, 50, 32)
  ];
  const cam = cameraPath(camKeys, { hold: 0.22 });

  // ====================================================================== per frame
  return (t) => {
    const pa = phoneA(t);
    if (pa < 0.999) looks.opacity(phone.root, clamp01(pa));
    phone.root.visible = pa > 0.003;
    const ia = partsIn(t);
    sound.root.position.set(0, PART_Y + (1 - ia) * 1.5, 0);
    if (ia < 0.999) looks.opacity(sound.root, ia);
    sound.root.visible = ia > 0.003;
    // open one device at a time: explode, then put back the other's parts
    explode(sound, 1, 1);
    const tO = tapticOpen(t), sO = speakerOpen(t);
    sound.root.traverse((n) => {
      const b = n.userData.basePos, v = n.userData.explodeVec;
      if (!b || !v) return;
      const inTaptic = n.name.startsWith('Taptic'), f = inTaptic ? tO : sO;
      n.position.set(b.x + v.x * f, b.y + v.y * f, b.z + v.z * f);
    });
    // the Taptic mass shakes as the coil current flips
    const drive = prog(t, T.pushes - 0.2, T.pushes + 0.2) * (1 - prog(t, end('s3') - 0.3, end('s3') + 0.2));
    const slow = t < T.shake ? 1.8 : 9.0;
    const x = Math.sin((t - T.pushes) * slow * Math.PI) * drive;
    mass.position.x = mass.userData.basePos.x + 0.012 * x;
    looks.glow(coil, x > 0 ? CYAN : ORANGE, Math.abs(x) * 0.9 * drive);
    // the speaker diaphragm pumps with the music
    const play = prog(t, T.music - 0.2, T.music + 0.4) * (1 - prog(t, end('s5') - 0.2, end('s5') + 0.4));
    const dv = Math.sin(t * 24) * 0.5 + Math.sin(t * 37) * 0.3;
    dia.position.y += 0.004 * play * dv;
    vcoil.position.y += 0.004 * play * dv;
    looks.glow(vcoil, dv > 0 ? CYAN : ORANGE, Math.abs(dv) * 0.7 * play);
    // glows
    const pl = (t0, t1, a = 0.55) => a * (prog(t, t0 - 0.2, t0 + 0.3) - prog(t, t1 - 0.3, t1 + 0.2));
    looks.glow(mass, WHITE, pl(T.magnet, T.current, 0.4));
    looks.glow(Q('Taptic_Springs'), CYAN, pl(T.springs, T.current, 0.7));
    looks.glow(dia, CYAN, pl(T.diaphragm, T.music, 0.5));
    looks.glow(Q('Speaker_Chamber'), CYAN, pl(T.chamber, T.two, 0.4));
    // waves
    S.scene.updateMatrixWorld(true);
    const grille = centreOf(Q('Speaker_Grille'));
    rings.forEach((r, i) => {
      const u = ((t * 0.8 + i / rings.length) % 1);
      r.position.copy(grille).add(V(0.3 + u * 2.4, 0, 0));
      r.scale.setScalar(0.15 + u * 1.2);
      r.material.opacity = play * (1 - u) * 0.8;
      r.visible = play > 0.01;
    });
    const tm = centreOf(Q('Taptic_Engine'));
    buzz.forEach((b, i) => {
      const u = ((t * 1.4 + i / 3) % 1);
      b.position.copy(tm).add(V(0, 0.4, 0));
      b.rotation.set(Math.PI / 2, 0, i * 2.1);
      b.scale.setScalar(1.2 + u * 1.5);
      b.material.opacity = drive * (t > T.shake ? 1 : 0.3) * (1 - u) * 0.8;
      b.visible = drive > 0.01;
    });

    // ---- camera, render, labels
    cam(t, S.camera);
    S.setShadowFocus(V(0, 1, 0), 10);
    looks.apply();
    S.render();
    labels.update(t);

    // ---- overlays
    el.chapter.style.opacity = prog(t, 0.6, 1.1) * (1 - prog(t, 5.6, 6.2));
    el.chapNum.textContent = '07';
    el.chapName.textContent = 'SOUND & TOUCH';
    el.big.style.opacity = 0;
    el.title.style.opacity = 0;
    el.fade.style.opacity = Math.max(1 - prog(t, 0.0, 0.8), prog(t, LAST + 2.2, LAST + 3.1));
    el.endcard.style.opacity = prog(t, LAST + 2.3, LAST + 3.0);
    const n = el.endcard.querySelector('#stage-endname');
    if (n && n.textContent !== 'THE JOURNEY') n.textContent = 'THE JOURNEY';
    el.scale.style.opacity = 0;
    el.loupe.style.opacity = 0;
    el.scope.style.opacity = 0;
  };
}
