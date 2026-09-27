'use strict';
// ============================================================
//  RAVAL FIGHTER — core: canvas, utils, color, text, input, fx
// ============================================================
const W = 400, H = 225;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
cv.width = W; cv.height = H;
ctx.imageSmoothingEnabled = false;

function fitCanvas() {
  const s0 = Math.min(innerWidth / W, innerHeight / H);
  const s = s0 >= 2 ? Math.floor(s0) : s0;
  cv.style.width = Math.floor(W * s) + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
}
addEventListener('resize', fitCanvas); fitCanvas();

// ---------- utils ----------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const DEG = Math.PI / 180;
const easeIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeIn = t => t * t;
function RNG(seed) {
  let a = seed >>> 0;
  const f = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  f.r = (x, y) => x + f() * (y - x);
  f.i = (x, y) => Math.floor(x + f() * (y - x + 1));
  f.p = arr => arr[Math.floor(f() * arr.length)];
  return f;
}
function mk(w, h) {
  const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g];
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bay = (x, y) => BAYER[((y & 3) << 2) | (x & 3)] / 16;

// ---------- color ----------
const _rgbC = {};
function rgb(h) {
  let v = _rgbC[h]; if (v) return v;
  let s = h.replace('#', ''); if (s.length === 3) s = s.split('').map(c => c + c).join('');
  const n = parseInt(s, 16); return _rgbC[h] = [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function hex(r, g, b) {
  return '#' + ((1 << 24) | (clamp(Math.round(r), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(b), 0, 255)).toString(16).slice(1);
}
const _mixC = new Map();
function mix(a, b, t) {
  const k = a + b + t; let v = _mixC.get(k); if (v) return v;
  const A = rgb(a), B = rgb(b); v = hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
  _mixC.set(k, v); return v;
}
const _dkC = new Map();
// shadows shift slightly toward purple, like hand-made pixel palettes
function dk(h, k = 0.7) {
  const key = h + k; let v = _dkC.get(key); if (v) return v;
  const A = rgb(h); v = hex(A[0] * k * 0.96, A[1] * k * 0.92, A[2] * k * 1.08 + 4);
  _dkC.set(key, v); return v;
}
function lt(h, k = 0.25) { return mix(h, '#fff8e8', k); }
function mulc(h, t) { const A = rgb(h), B = rgb(t); return hex(A[0] * B[0] / 255, A[1] * B[1] / 255, A[2] * B[2] / 255); }

// ---------- text (pixel font, alpha-thresholded so it stays crisp) ----------
const FONT = "'Press Start 2P', monospace";
const _tc = new Map();
function tsprite(str, size, color) {
  const key = str + '|' + size + '|' + color; let c = _tc.get(key); if (c) return c;
  const [, mg] = mk(4, 4); mg.font = size + 'px ' + FONT;
  const w = Math.max(1, Math.ceil(mg.measureText(str).width));
  const [tc, tg] = mk(w + 2, size + 4);
  tg.font = size + 'px ' + FONT; tg.textBaseline = 'top'; tg.fillStyle = color; tg.fillText(str, 1, 1);
  const d = tg.getImageData(0, 0, tc.width, tc.height), p = d.data, [r, g, b] = rgb(color);
  for (let i = 0; i < p.length; i += 4) { if (p[i + 3] > 100) { p[i] = r; p[i + 1] = g; p[i + 2] = b; p[i + 3] = 255; } else p[i + 3] = 0; }
  tg.putImageData(d, 0, 0); tc.tw = w;
  if (_tc.size > 900) _tc.clear();
  _tc.set(key, tc); return tc;
}
const ARW = {
  '←': ['0001000', '0011000', '0111111', '1111111', '0111111', '0011000', '0001000'],
  '→': ['0001000', '0001100', '1111110', '1111111', '1111110', '0001100', '0001000'],
  '↑': ['0001000', '0011100', '0111110', '1111111', '0011100', '0011100', '0011100'],
  '↓': ['0011100', '0011100', '0011100', '1111111', '0111110', '0011100', '0001000'],
  '↘': ['1100000', '1110000', '0111001', '0011101', '0001111', '0011111', '0111111'],
  '▶': ['1000000', '1110000', '1111100', '1111111', '1111100', '1110000', '1000000'],
  '◀': ['0000001', '0000111', '0011111', '1111111', '0011111', '0000111', '0000001'],
};
const UNACC = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'À': 'A', 'È': 'E', 'Ò': 'O' };
function text(g, str, x, y, o = {}) {
  str = String(str).replace(/[ÁÉÍÓÚÀÈÒ]/g, c => UNACC[c]); if (!str) return 0;
  if (/[←→↑↓↘▶◀]/.test(str)) {
    const size = o.size || 8, k = size / 8, tw = [...str].length * size;
    let cx = Math.round(x) - (o.align === 'center' ? Math.floor(tw / 2) : o.align === 'right' ? tw : 0);
    let buf = '';
    const flush = () => { if (buf) { text(g, buf, cx, y, Object.assign({}, o, { align: 'left' })); cx += buf.length * size; buf = ''; } };
    for (const ch of str) {
      if (ARW[ch]) {
        flush();
        const pat = ARW[ch], draw = (col, ox, oy) => { g.fillStyle = col; pat.forEach((r, yy) => { for (let xx = 0; xx < 7; xx++) if (r[xx] === '1') g.fillRect(cx + xx * k + ox, Math.round(y) + yy * k + oy, k, k); }); };
        if (o.outline) for (const [ax, ay] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) draw(o.outline, ax, ay);
        if (o.shadow) draw(o.shadow, 1, 1);
        draw(o.color || '#fff', 0, 0); cx += size;
      } else buf += ch;
    }
    flush(); return tw;
  }
  const size = o.size || 8, col = o.color || '#fff', s = tsprite(str, size, col);
  let dx = Math.round(x) - 1, dy = Math.round(y) - 1;
  if (o.align === 'center') dx -= Math.floor(s.tw / 2); else if (o.align === 'right') dx -= s.tw;
  if (o.outline) {
    const os = tsprite(str, size, o.outline);
    const offs = o.thick ? [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 2], [1, 2], [2, 1]] : [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
    for (const [ax, ay] of offs) g.drawImage(os, dx + ax, dy + ay);
  }
  if (o.shadow) { const ss = tsprite(str, size, o.shadow); g.drawImage(ss, dx + (o.sd || 1), dy + (o.sd || 1)); }
  g.drawImage(s, dx, dy);
  return s.tw;
}
function twidth(str, size = 8) { return tsprite(String(str), size, '#fff').tw; }
function wrapText(str, maxChars) {
  const out = []; for (const para of String(str).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      if ((line + (line ? ' ' : '') + w).length > maxChars) { if (line) out.push(line); line = w; }
      else line += (line ? ' ' : '') + w;
    }
    out.push(line);
  }
  return out;
}
// gradient-filled big text (logo style)
function textGrad(g, str, x, y, size, cols, outline = '#10061a', align = 'center') {
  str = String(str).replace(/[ÁÉÍÓÚÀÈÒ]/g, c => UNACC[c]);
  const base = tsprite(str, size, '#ffffff');
  const [c, cg] = mk(base.width, base.height);
  cg.drawImage(base, 0, 0); cg.globalCompositeOperation = 'source-atop';
  const n = cols.length;
  for (let yy = 0; yy < base.height; yy++) { cg.fillStyle = cols[Math.min(n - 1, Math.floor(yy / base.height * n))]; cg.fillRect(0, yy, base.width, 1); }
  let dx = Math.round(x) - 1, dy = Math.round(y) - 1;
  if (align === 'center') dx -= Math.floor(base.tw / 2);
  const os = tsprite(str, size, outline);
  for (let ax = -2; ax <= 2; ax++) for (let ay = -2; ay <= 3; ay++) if (Math.abs(ax) + Math.abs(ay) <= 3) g.drawImage(os, dx + ax, dy + ay);
  g.drawImage(c, dx, dy);
}

// ---------- tiny 3x5 font for signs & small UI ----------
const TF = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110',
  ' ': '000000000000000', '.': '000000000000010', ':': '000010000010000', '-': '000000111000000', '/': '001001010100100', "'": '010010000000000',
  ',': '000000000010100', '!': '010010010000010', '?': '110001010000010', '+': '000010111010000', '%': '101001010100101', '€': '011110100110011',
  '·': '000000010000000', '←': '001011111011001', '→': '100110111110100', '↑': '010111010010010', '↓': '010010010111010', '↘': '100010001011011', '>': '100010001010100', '<': '001010100010001', '(': '010100100100010', ')': '010001001001010', '#': '101111101111101', 'º': '010101010000000'
};
function tiny(g, str, x, y, col, sc = 1) {
  str = String(str).toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  g.fillStyle = col; let cx = x;
  for (const ch of str) {
    const m = TF[ch];
    if (m) for (let i = 0; i < 15; i++) if (m[i] === '1') g.fillRect(cx + (i % 3) * sc, y + Math.floor(i / 3) * sc, sc, sc);
    cx += 4 * sc;
  }
  return cx - x - sc;
}
const tinyW = (s, sc = 1) => String(s).length * 4 * sc - sc;

// ---------- input ----------
const Input = { held: {}, pressed: {}, _pad: {} };
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  KeyJ: 'punch', KeyZ: 'punch', KeyK: 'kick', KeyX: 'kick', KeyL: 'special', KeyC: 'special', KeyI: 'super', KeyV: 'super',
  Enter: 'start', Space: 'start', Escape: 'pause', KeyP: 'pause', KeyM: 'mute'
};
function press(a) { if (!Input.held[a]) Input.pressed[a] = true; Input.held[a] = true; }
function release(a) { Input.held[a] = false; }
addEventListener('keydown', e => {
  const a = KEYS[e.code]; if (a) { e.preventDefault(); if (!e.repeat) press(a); }
  if (typeof unlockAudio === 'function') unlockAudio();
});
addEventListener('keyup', e => { const a = KEYS[e.code]; if (a) release(a); });
addEventListener('blur', () => { Input.held = {}; });
Input.hit = a => !!Input.pressed[a];
Input.ok = () => !!(Input.pressed.start || Input.pressed.punch);
Input.endFrame = () => { Input.pressed = {}; };
Input.poll = () => {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads && [...pads].find(p => p);
  if (!gp) return;
  const b = i => gp.buttons[i] && gp.buttons[i].pressed;
  const st = {
    left: b(14) || gp.axes[0] < -0.5, right: b(15) || gp.axes[0] > 0.5, up: b(12) || gp.axes[1] < -0.5, down: b(13) || gp.axes[1] > 0.5,
    punch: b(2), kick: b(0), special: b(3) || b(1), super: b(5) || b(7), start: b(9), pause: b(8)
  };
  for (const k in st) {
    if (st[k] && !Input._pad[k]) press(k);
    if (!st[k] && Input._pad[k]) release(k);
    Input._pad[k] = st[k];
  }
};
// touch
(function setupTouch() {
  const coarse = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
  const root = document.getElementById('touch'); if (!root || !coarse) return;
  root.classList.add('on');
  root.querySelectorAll('.tb').forEach(el => {
    const a = el.dataset.a;
    const on = e => { e.preventDefault(); press(a); el.classList.add('act'); if (typeof unlockAudio === 'function') unlockAudio(); };
    const off = e => { e.preventDefault(); release(a); el.classList.remove('act'); };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off); el.addEventListener('pointerleave', off);
  });
})();
cv.addEventListener('pointerdown', () => { if (typeof unlockAudio === 'function') unlockAudio(); });

// ---------- global screen fx ----------
const FX = { shake: 0, mag: 0, flash: 0, flashCol: '#fff', ox: 0, oy: 0 };
function shake(m, t) { FX.mag = Math.max(FX.mag, m); FX.shake = Math.max(FX.shake, t); }
function flash(t, col = '#fff') { FX.flash = t; FX.flashCol = col; }
FX.update = () => {
  if (FX.shake > 0) { FX.shake--; FX.ox = Math.round(rnd(-FX.mag, FX.mag)); FX.oy = Math.round(rnd(-FX.mag, FX.mag) * 0.7); if (FX.shake <= 0) FX.mag = 0; }
  else { FX.ox = FX.oy = 0; }
  if (FX.flash > 0) FX.flash--;
};
// fade transitions
const Fade = { a: 0, dir: 0, sp: 0.05, cb: null, col: '#000' };
function fadeTo(cb, sp = 0.05, col = '#000') { if (Fade.dir === 1) return; Fade.dir = 1; Fade.sp = sp; Fade.cb = cb; Fade.col = col; }
Fade.update = () => {
  if (Fade.dir === 1) { Fade.a += Fade.sp; if (Fade.a >= 1) { Fade.a = 1; Fade.dir = -1; const cb = Fade.cb; Fade.cb = null; if (cb) cb(); } }
  else if (Fade.dir === -1) { Fade.a -= Fade.sp; if (Fade.a <= 0) { Fade.a = 0; Fade.dir = 0; } }
};
// dithered fade overlay (pixel-art style)
function drawFade(g, a, col) {
  if (a <= 0) return;
  g.fillStyle = col;
  if (a >= 1) { g.fillRect(0, 0, W, H); return; }
  const [c, cg] = ditherTile(a, col);
  const pat = g.createPattern(c, 'repeat'); g.fillStyle = pat; g.fillRect(0, 0, W, H);
}
const _dth = new Map();
function ditherTile(a, col) {
  const lvl = Math.round(a * 16); const key = lvl + col; let v = _dth.get(key); if (v) return v;
  const [c, g] = mk(4, 4); g.fillStyle = col;
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (BAYER[y * 4 + x] < lvl) g.fillRect(x, y, 1, 1);
  v = [c, g]; _dth.set(key, v); return v;
}
// generic even-odd polygon scanline fill with integer spans (no anti-aliasing)
function polyFill(g, pts, col) {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y; }
  g.fillStyle = col; const n = pts.length;
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      if ((p.y <= yc && q.y > yc) || (q.y <= yc && p.y > yc)) xs.push(p.x + (yc - p.y) / (q.y - p.y) * (q.x - p.x));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const x0 = Math.round(xs[i]), x1 = Math.round(xs[i + 1]);
      if (x1 > x0) g.fillRect(x0, y, x1 - x0, 1);
    }
  }
}
// dithered radial glow sprite
const _glow = new Map();
function glowSprite(r, col, inten = 1) {
  const key = r + col + inten; let c = _glow.get(key); if (c) return c;
  let g; [c, g] = mk(r * 2, r * 2); g.fillStyle = col;
  for (let y = 0; y < r * 2; y++) for (let x = 0; x < r * 2; x++) {
    const d = Math.hypot(x - r + .5, y - r + .5) / r;
    if (d < 1) { const a = (1 - d) * (1 - d) * inten; if (bay(x, y) < a) g.fillRect(x, y, 1, 1); }
  }
  _glow.set(key, c); return c;
}
// pixel-level ImageData helper
function pixels(c, fn) {
  const g = c.getContext('2d'); const d = g.getImageData(0, 0, c.width, c.height);
  fn(d.data, c.width, c.height); g.putImageData(d, 0, 0);
}
function tintCanvas(c, tint, amt = 1) {
  const T = rgb(tint);
  pixels(c, (p) => {
    for (let i = 0; i < p.length; i += 4) {
      if (!p[i + 3]) continue;
      p[i] = lerp(p[i], p[i] * T[0] / 255, amt); p[i + 1] = lerp(p[i + 1], p[i + 1] * T[1] / 255, amt); p[i + 2] = lerp(p[i + 2], p[i + 2] * T[2] / 255, amt);
    }
  });
}
