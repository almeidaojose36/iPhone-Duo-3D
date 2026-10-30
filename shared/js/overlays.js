// 2D overlays for "Inside the iPhone Duo" drawn on the full-frame #stage-ov canvas:
// line-art explainers, comparison card, dimension lines, the paper-fold analogy, a section key.
const CY = '#5fd8ff', INK = '#e9f7ff', DIM = 'rgba(233,247,255,0.55)';
const clamp01 = (x) => Math.max(0, Math.min(1, x));

export function clear(cv) { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); return g; }

function panel(g, x, y, w, h, title, right) {
  g.save();
  g.fillStyle = 'rgba(6,10,15,0.86)';
  g.strokeStyle = 'rgba(95,216,255,0.4)';
  g.lineWidth = 2;
  g.beginPath(); g.roundRect(x, y, w, h, 20); g.fill(); g.stroke();
  g.fillStyle = INK; g.font = '600 32px Saira, sans-serif'; g.fillText(title, x + 32, y + 52);
  if (right) { g.fillStyle = CY; g.textAlign = 'right'; g.fillText(right, x + w - 32, y + 52); g.textAlign = 'left'; }
  g.restore();
}
function glowStroke(g, color = INK, w = 3) { g.strokeStyle = color; g.lineWidth = w; g.shadowColor = CY; g.shadowBlur = 12; }

// Screen-shape explainer: a square-ish folding screen vs the Duo's 1.4:1, both showing a 16:9 video
export function screenShapes(cv, u) {
  const g = clear(cv);
  const x0 = 1100, y0 = 230, w = 720, h = 560;
  panel(g, x0, y0, w, h, 'INNER SCREEN SHAPE', '16:9 VIDEO');
  const draw = (cx, cy, sw, sh, label, ratioText, a) => {
    g.save();
    g.globalAlpha = a;
    glowStroke(g);
    g.beginPath(); g.roundRect(cx - sw / 2, cy - sh / 2, sw, sh, 14); g.stroke();
    // the video: fit 16:9 inside
    const vw = Math.min(sw - 16, (sh - 16) * 16 / 9), vh = vw * 9 / 16;
    g.shadowBlur = 0;
    const grd = g.createLinearGradient(0, cy - vh / 2, 0, cy + vh / 2);
    grd.addColorStop(0, '#6b5a8a'); grd.addColorStop(1, '#d9a08a');
    g.fillStyle = grd;
    g.fillRect(cx - vw / 2, cy - vh / 2, vw, vh);
    // black bars
    g.fillStyle = 'rgba(0,0,0,0.85)';
    g.fillRect(cx - sw / 2 + 3, cy - sh / 2 + 3, sw - 6, (sh - vh) / 2 - 3);
    g.fillRect(cx - sw / 2 + 3, cy + vh / 2, sw - 6, (sh - vh) / 2 - 3);
    g.fillStyle = INK; g.font = '500 28px Saira, sans-serif'; g.textAlign = 'center';
    g.fillText(label, cx, cy + sh / 2 + 44);
    g.fillStyle = CY; g.font = '600 26px Saira, sans-serif';
    g.fillText(ratioText, cx, cy + sh / 2 + 78);
    g.restore();
  };
  draw(x0 + 190, y0 + 280, 250, 270, 'Square-ish fold', '≈ 1.1 : 1', clamp01(u * 2));
  draw(x0 + 520, y0 + 280, 330, 236, 'iPhone Duo', '≈ 1.4 : 1', clamp01(u * 2 - 0.6));
}

// Duo vs regular iPhone: rows reveal one by one (n = how many rows are visible, fractional fades in)
export function comparison(cv, n, rows) {
  const g = clear(cv);
  const x0 = 1040, y0 = 150, w = 800, rh = 74;
  const h = 120 + rows.length * rh;
  panel(g, x0, y0, w, h, 'iPHONE DUO', 'vs A REGULAR iPHONE');
  rows.forEach(([k, duo, reg], i) => {
    const a = clamp01(n - i);
    if (a <= 0) return;
    const y = y0 + 110 + i * rh;
    g.save();
    g.globalAlpha = a;
    g.fillStyle = 'rgba(95,216,255,0.08)';
    g.beginPath(); g.roundRect(x0 + 20, y - 40, w - 40, rh - 10, 12); g.fill();
    g.fillStyle = DIM; g.font = '500 24px Saira, sans-serif'; g.fillText(k, x0 + 40, y);
    g.fillStyle = INK; g.font = '600 28px Saira, sans-serif'; g.fillText(duo, x0 + 250, y);
    g.fillStyle = DIM; g.font = '400 24px Saira, sans-serif'; g.textAlign = 'right'; g.fillText(reg, x0 + w - 40, y); g.textAlign = 'left';
    g.restore();
  });
}

// A dimension line between two screen points with end ticks and a value
export function dimension(cv, a, b, text, alpha = 1, offset = -40) {
  const g = cv.getContext('2d');
  if (alpha <= 0) return;
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const A = { x: a.x + nx * offset, y: a.y + ny * offset }, B = { x: b.x + nx * offset, y: b.y + ny * offset };
  g.save();
  g.globalAlpha = alpha;
  glowStroke(g, CY, 3);
  g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke();
  for (const [P, Q] of [[a, A], [b, B]]) { g.beginPath(); g.moveTo(P.x, P.y); g.lineTo(Q.x + nx * -10, Q.y + ny * -10); g.stroke(); }
  g.shadowBlur = 0;
  g.fillStyle = 'rgba(5,9,14,0.75)';
  g.font = '600 40px Saira, sans-serif';
  const tw = g.measureText(text).width;
  const mx = (A.x + B.x) / 2 + nx * -40, my = (A.y + B.y) / 2 + ny * -40;
  g.beginPath(); g.roundRect(mx - tw / 2 - 16, my - 36, tw + 32, 52, 12); g.fill();
  g.fillStyle = INK; g.textAlign = 'center'; g.fillText(text, mx, my);
  g.restore();
}

// Paper analogy: a sheet folded round a wide curve (opens smooth) vs pressed flat (sharp crease)
export function paperFold(cv, u) {
  const g = clear(cv);
  const x0 = 1080, y0 = 250, w = 760, h = 520;
  panel(g, x0, y0, w, h, 'WHY A WIDE CURVE', 'PAPER TEST');
  const draw = (cx, wide, label, sub, a) => {
    g.save();
    g.globalAlpha = a;
    glowStroke(g, INK, 4);
    const top = y0 + 140, len = 220, r = wide ? 46 : 3;
    g.beginPath();
    g.moveTo(cx - r, top); g.lineTo(cx - r, top + len);
    g.arc(cx, top + len, r, Math.PI, 0, true);
    g.lineTo(cx + r, top);
    g.stroke();
    if (!wide) { g.strokeStyle = '#ff8c7a'; g.shadowColor = '#ff8c7a'; g.beginPath(); g.arc(cx, top + len, 10, 0, Math.PI * 2); g.stroke(); }
    g.shadowBlur = 0;
    g.fillStyle = INK; g.font = '500 28px Saira, sans-serif'; g.textAlign = 'center';
    g.fillText(label, cx, top + len + 110);
    g.fillStyle = wide ? '#8ff0c2' : '#ff8c7a'; g.font = '600 26px Saira, sans-serif';
    g.fillText(sub, cx, top + len + 146);
    g.restore();
  };
  draw(x0 + 220, true, 'Wide curve', 'opens smooth', clamp01(u * 2));
  draw(x0 + 540, false, 'Pressed flat', 'sharp crease', clamp01(u * 2 - 0.7));
}

// Coloured key for the hinge's sections (items: [number, name, colour])
export function sectionKey(cv, n, items) {
  const g = clear(cv);
  const x0 = 110, y0 = 600, w = 560, rh = 66;
  panel(g, x0, y0, w, 90 + items.length * rh, 'HINGE · 6 JOBS', '');
  items.forEach(([num, name, col], i) => {
    const a = clamp01(n - i);
    if (a <= 0) return;
    const y = y0 + 110 + i * rh;
    g.save();
    g.globalAlpha = a;
    g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 14;
    g.beginPath(); g.roundRect(x0 + 32, y - 34, 70, 44, 10); g.fill();
    g.shadowBlur = 0;
    g.fillStyle = '#05080c'; g.font = '700 26px Saira, sans-serif'; g.textAlign = 'center'; g.fillText(num, x0 + 67, y - 3);
    g.textAlign = 'left'; g.fillStyle = INK; g.font = '500 28px Saira, sans-serif'; g.fillText(name, x0 + 124, y - 3);
    g.restore();
  });
}
