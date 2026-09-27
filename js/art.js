'use strict';
// ============================================================
//  ART — procedural pixel-art characters
//  Skeleton + keyframed poses -> rasterised with outlined pixel stamps
// ============================================================
const OUTL = '#130b16';
const GROUND = 200;

// ---------- stamping primitives (integer, no AA) ----------
const _disk = {};
function diskSpans(d) {
  if (_disk[d]) return _disk[d];
  const r = d / 2, s = [];
  for (let i = 0; i < d; i++) {
    const yy = i + 0.5 - r, hw = Math.sqrt(Math.max(0, r * r - yy * yy));
    const x0 = Math.round(r - hw), x1 = Math.round(r + hw); s.push([x0, Math.max(1, x1 - x0)]);
  }
  if (d <= 2) for (const sp of s) { sp[0] = 0; sp[1] = d; }
  return _disk[d] = s;
}
function stamp(g, cx, cy, d, col) {
  d = Math.max(1, Math.round(d)); const s = diskSpans(d);
  const ox = Math.round(cx - d / 2), oy = Math.round(cy - d / 2); g.fillStyle = col;
  for (let i = 0; i < d; i++) g.fillRect(ox + s[i][0], oy + i, s[i][1], 1);
}
function seg(g, a, b, d, col) {
  const len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(len / 0.7));
  d = Math.max(1, Math.round(d)); const s = diskSpans(d); g.fillStyle = col;
  for (let i = 0; i <= n; i++) {
    const t = i / n, cx = a.x + (b.x - a.x) * t, cy = a.y + (b.y - a.y) * t;
    const ox = Math.round(cx - d / 2), oy = Math.round(cy - d / 2);
    for (let j = 0; j < d; j++) g.fillRect(ox + s[j][0], oy + j, s[j][1], 1);
  }
}
const pt = (x, y) => ({ x, y });
const padd = (a, v, k = 1) => ({ x: a.x + v.x * k, y: a.y + v.y * k });
const plerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
function V(a, l) { const r = a * DEG; return { x: Math.sin(r) * l, y: Math.cos(r) * l }; }
function polyOut(g, pts, col) {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) polyFill(g, pts.map(p => ({ x: p.x + dx, y: p.y + dy })), OUTL);
  polyFill(g, pts, col);
}

// ---------- pixel grid (for heads / portraits / small sprites) ----------
class PGrid {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  set(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
  get(x, y) { return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.d[y * this.w + x] : null; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  hl(x0, x1, y, c) { for (let x = x0; x <= x1; x++) this.set(x, y, c); }
  disc(cx, cy, r, c) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.set(x, y, c); }
  rotCCW() { const n = new PGrid(this.h, this.w); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) n.set(y, this.w - 1 - x, this.get(x, y)); return n; }
  canvas(outline = OUTL, pad = 1) {
    const [c, g] = mk(this.w + 2 * pad, this.h + 2 * pad);
    if (outline) {
      g.fillStyle = outline;
      for (let y = -pad; y < this.h + pad; y++) for (let x = -pad; x < this.w + pad; x++) {
        if (this.get(x, y)) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) g.fillRect(x + pad, y + pad, 1, 1);
      }
    }
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const v = this.get(x, y); if (v) { g.fillStyle = v; g.fillRect(x + pad, y + pad, 1, 1); } }
    return c;
  }
}

// ============================================================
//  HEADS (18x18 grid, face origin (3,4), faces right)
// ============================================================
const EYE_D = '#1a1014', EYE_W = '#f4efe6';
function paintHead(def, expr) {
  const G = new PGrid(18, 18), ox = 3, oy = 4;
  const S = def.skin, SS = dk(S, .8), SD = dk(S, .62), H = def.hair, HL = lt(H, .2), HD = dk(H, .7), LIP = dk(S, .64);
  const brow = def.brow || (rgb(H)[0] > 150 ? dk(H, .6) : HD);
  const h = (x, y, c) => G.set(ox + x, oy + y, c);
  const R = RNG(def.seed || 7);
  // neck
  for (let y = 10; y < 14; y++) for (let x = 3; x <= 6; x++) h(x, y, x === 3 ? SD : SS);
  const rows = [[3, 8], [2, 9], [1, 10], [1, 10], [1, 10], [1, 11], [1, 11], [1, 10], [2, 10], [2, 10], [3, 9], [4, 8]];
  rows.forEach(([a, b], y) => { for (let x = a; x <= b; x++) h(x, y, x <= 2 ? SS : S); });
  h(4, 11, SS); h(5, 11, SS); h(10, 2, lt(S, .12)); h(9, 1, lt(S, .12));
  // ear
  h(3, 5, SS); h(4, 5, SS); h(3, 6, SS); h(4, 6, SD); h(3, 7, SS);
  // nose
  h(11, 6, SS); h(10, 7, SS);
  // eyes / brows / mouth by expression
  const E = expr || 'normal';
  const eyeOpen = () => { h(8, 5, EYE_W); h(9, 5, EYE_D); h(9, 6, EYE_D); h(8, 6, SS); };
  if (E === 'normal' || E === 'talk') { eyeOpen(); h(8, 4, brow); h(9, 4, brow); h(10, 4, brow); }
  if (E === 'angry') { eyeOpen(); h(7, 3, brow); h(8, 4, brow); h(9, 4, brow); h(10, 5, brow); }
  if (E === 'hurt') { h(8, 3, brow); h(9, 3, brow); h(8, 6, EYE_D); h(9, 6, EYE_D); h(10, 5, EYE_D); }
  if (E === 'ko') { h(8, 4, EYE_D); h(10, 4, EYE_D); h(9, 5, EYE_D); h(8, 6, EYE_D); h(10, 6, EYE_D); }
  if (E === 'happy' || E === 'proud') { h(8, 6, EYE_D); h(9, 5, EYE_D); h(10, 6, EYE_D); h(8, 3, brow); h(9, 3, brow); }
  if (E === 'sleepy') { h(8, 5, SD); h(9, 5, SD); h(8, 6, '#e8a8a0'); h(9, 6, EYE_D); h(8, 4, brow); h(9, 4, brow); }
  if (E === 'blink') { h(8, 6, EYE_D); h(9, 6, EYE_D); h(8, 4, brow); h(9, 4, brow); }
  if (E === 'sad') { eyeOpen(); h(8, 4, brow); h(9, 3, brow); }
  // mouth
  if (E === 'hurt' || E === 'ko' || E === 'talk') { h(9, 9, '#5a1620'); h(10, 9, '#5a1620'); h(9, 10, '#5a1620'); }
  else if (E === 'happy' || E === 'proud') { h(8, 9, LIP); h(9, 9, '#fff4e8'); h(10, 9, '#fff4e8'); h(10, 8, LIP); }
  else if (E === 'sad') { h(9, 9, LIP); h(10, 10, LIP); }
  else { h(9, 9, LIP); h(10, 9, LIP); }
  // beard (under hair so hair wins on sideburns)
  const bd = def.beard;
  if (bd === 'full') {
    for (let y = 7; y <= 11; y++) { const [a, b] = rows[y]; for (let x = Math.max(a, 3); x <= b; x++) { if (y === 9 && (x === 9 || x === 10)) continue; if (y >= 7 && x === 3 && y < 9) continue; h(x, y, (x + y) % 3 ? H : HD); } }
    for (let y = 4; y <= 7; y++) { h(4, y, H); h(5, y, H); }
    h(8, 8, H); h(9, 8, H); h(10, 8, H);
  } else if (bd === 'stubble') {
    for (let y = 8; y <= 11; y++) { const [a, b] = rows[y]; for (let x = Math.max(a, 4); x <= b; x++) if ((x + y) % 2 === 0 && !(y === 9 && x >= 9)) h(x, y, mix(S, H, .45)); }
  } else if (bd === 'mustache') { h(8, 8, H); h(9, 8, H); h(10, 8, H); }
  else if (bd === 'goatee') { h(9, 10, H); h(10, 10, H); h(8, 11, H); h(9, 11, H); h(8, 8, H); h(9, 8, H); h(10, 8, H); }
  // hair
  const hs = def.hairStyle, hc = (x, y) => h(x, y, R() < .16 ? HL : H);
  if (hs === 'curly') {
    const shape = { '-3': [2, 8], '-2': [0, 10], '-1': [-1, 11], '0': [-1, 11], '1': [-1, 10], '2': [-1, 10], '3': [-1, 7] };
    for (const y in shape) { const [a, b] = shape[y]; for (let x = a; x <= b; x++) { if (+y === -3 && R() < .45) continue; if ((x === a || x === b) && R() < .4) continue; hc(x, +y); } }
    for (let y = 4; y <= 8; y++) for (let x = -1; x <= 2; x++) { if (y === 8 && x < 1) continue; if (x === -1 && R() < .5) continue; hc(x, y); }
    h(4, 4, H); h(5, 4, H); h(4, 5, H);
    for (let x = 0; x <= 9; x++) if (R() < .3) h(x, -1, HL);
  } else if (hs === 'buzz') {
    const B = mix(H, S, .3);
    for (let x = 3; x <= 8; x++) h(x, 0, (x % 2) ? H : B);
    for (let x = 2; x <= 9; x++) h(x, 1, (x % 2) ? B : H);
    for (let x = 1; x <= 6; x++) h(x, 2, (x % 2) ? H : B);
    for (let y = 3; y <= 6; y++) { h(1, y, H); h(2, y, B); }
    h(4, 4, B);
  } else if (hs === 'short' || hs === 'slick') {
    for (let x = 3; x <= 9; x++) h(x, -2, H);
    for (let x = 1; x <= 10; x++) { h(x, -1, H); h(x, 0, H); }
    for (let x = 1; x <= 10; x++) h(x, 1, x > 8 ? HL : H);
    for (let x = 1; x <= 7; x++) h(x, 2, H);
    for (let y = 3; y <= 6; y++) { h(1, y, H); h(2, y, H); }
    h(4, 4, H); h(3, 3, H); h(6, -2, HL); h(7, -2, HL);
  } else if (hs === 'cap' || hs === 'capBack') {
    const CP = def.cap || '#222', CD = dk(CP, .7), CL = lt(CP, .2);
    for (let x = 3; x <= 8; x++) h(x, -2, CP);
    for (let y = -1; y <= 2; y++) for (let x = 1; x <= 10; x++) h(x, y, x > 8 && y < 1 ? CL : CP);
    for (let x = 1; x <= 10; x++) h(x, 2, CD);
    if (hs === 'cap') { for (let x = 9; x <= 13; x++) h(x, 3, CD); for (let x = 10; x <= 13; x++) h(x, 2, CP); }
    else { for (let x = -2; x <= 1; x++) h(x, 2, CD); h(-1, 1, CP); h(0, 1, CP); h(6, 1, '#f0f0f0'); }
    for (let y = 3; y <= 5; y++) { h(1, y, H); h(2, y, H); }
  } else if (hs === 'beanie') {
    const CP = def.cap || '#2e7d4f', CL = def.cap2 || lt(CP, .25);
    for (let x = 3; x <= 8; x++) h(x, -3, CP);
    for (let y = -2; y <= 1; y++) for (let x = 1; x <= 10; x++) h(x, y, (x + y) % 4 === 0 ? dk(CP, .8) : CP);
    for (let x = 1; x <= 10; x++) h(x, 2, CL);
    h(5, -4, CL); h(6, -4, CL);
    for (let x = -2; x <= 2; x++) for (let y = 3; y <= 11; y++) if ((x + 5) % 2 === 0 || y < 5) { if (y > 9 && x < 0) continue; h(x, y, (y % 3) ? H : HD); }
  } else if (hs === 'ponytail' || hs === 'long') {
    for (let x = 3; x <= 9; x++) h(x, -2, H);
    for (let y = -1; y <= 2; y++) for (let x = 1; x <= 10; x++) h(x, y, R() < .15 ? HL : H);
    h(9, 3, H); h(10, 3, H); h(8, 3, H);
    for (let y = 3; y <= 7; y++) { h(1, y, H); h(2, y, H); }
    if (hs === 'ponytail') {
      h(0, 1, def.tie || '#e8465a'); h(0, 2, def.tie || '#e8465a');
      const tail = [[-1, 1], [-2, 2], [-3, 3], [-3, 4], [-3, 5], [-3, 6], [-2, 7], [-2, 8], [-2, 9]];
      for (const [x, y] of tail) { h(x, y, H); h(x + 1, y, x + 1 >= 0 ? H : HD); if (y > 2) h(x - 1 < -3 ? x : x, y, H); }
    } else {
      for (let y = 3; y <= 13; y++) for (let x = -1; x <= 2; x++) { if (y > 11 && x < 0) continue; h(x, y, (x + y) % 5 ? H : HD); }
    }
  } else if (hs === 'bun') {
    for (let x = 3; x <= 9; x++) h(x, -2, H);
    for (let y = -1; y <= 2; y++) for (let x = 1; x <= 10; x++) h(x, y, (x * y) % 5 === 1 ? HL : H);
    for (let y = 3; y <= 6; y++) { h(1, y, H); h(2, y, H); }
    for (let y = -4; y <= -1; y++) for (let x = -1; x <= 3; x++) if ((x - 1) ** 2 + (y + 2.5) ** 2 <= 4.5) h(x, y, (x + y) % 2 ? H : HL);
  } else if (hs === 'bald') { h(5, 0, lt(S, .25)); h(6, 0, lt(S, .25)); }
  // accessories
  const acc = def.acc || [];
  if (acc.includes('sunglasses')) { for (let x = 6; x <= 10; x++) h(x, 5, '#111'); h(8, 6, '#111'); h(9, 6, '#111'); h(10, 6, '#111'); h(9, 5, '#556'); h(5, 5, '#111'); }
  if (acc.includes('glassesHead')) { for (let x = 4; x <= 9; x++) h(x, -2, '#1a1a1a'); h(7, -2, '#8ab'); }
  if (acc.includes('earring')) h(3, 8, '#f5c542');
  if (acc.includes('cigarette')) { h(10, 10, '#d9a066'); h(11, 10, '#eee'); h(12, 10, '#eee'); h(13, 10, '#ff7a2a'); }
  return G;
}
const _heads = new Map();
function headCanvas(def, expr, rot) {
  const key = def.id + '|' + expr + '|' + (rot ? 1 : 0); let c = _heads.get(key); if (c) return c;
  let G = paintHead(def, expr); if (rot) G = G.rotCCW();
  c = G.canvas(); _heads.set(key, c); return c;
}

// ============================================================
//  PORTRAITS (32x32, 3/4 front view) for HUD & dialogues
// ============================================================
function paintPortrait(def, expr) {
  const G = new PGrid(32, 32), R = RNG((def.seed || 7) * 13 + 5);
  const S = def.skin, SS = dk(S, .8), SD = dk(S, .62), SL = lt(S, .14), H = def.hair, HL = lt(H, .22), HD = dk(H, .7), LIP = dk(S, .62);
  const brow = def.brow || (rgb(H)[0] > 150 ? dk(H, .55) : HD);
  const top = def.dress || def.jacket || def.shirt;
  // shoulders
  for (let y = 25; y < 32; y++) {
    const xm = Math.max(0, 9 - (y - 25) * 2.2);
    for (let x = Math.floor(xm); x <= 31 - Math.floor(xm); x++) G.set(x, y, x < 11 ? dk(top, .8) : top);
  }
  if (def.jacket) { for (let y = 25; y < 32; y++) for (let x = 13 - (y - 25) * .3; x <= 19 + (y - 25) * .3; x++) G.set(x, y, def.shirt); for (let y = 25; y < 32; y++) { G.set(12 - (y - 25) * .3, y, dk(def.jacket, .6)); G.set(20 + (y - 25) * .3, y, dk(def.jacket, .6)); } }
  if (def.stripe) { for (let y = 26; y < 32; y++) { G.set(4 + (31 - y) * .1, y, def.stripe); G.set(27 - (31 - y) * .1, y, def.stripe); } }
  // neck
  for (let y = 20; y < 27; y++) for (let x = 12; x <= 20; x++) G.set(x, y, x < 15 ? SD : SS);
  if (!def.jacket && def.sleeve !== 'none') { for (let x = 12; x <= 20; x++) G.set(x, 26, dk(top, .7)); }
  // head
  const cx = 16.5, cy = 13.5;
  for (let y = 3; y <= 25; y++) for (let x = 6; x <= 27; x++) {
    let rx = 8.3; const dy = (y - cy) / 10.6;
    if (y > 16) rx = 8.3 * (1 - Math.pow((y - 16) / 10, 1.7) * 0.6);
    if ((x - cx) ** 2 / (rx * rx) + dy * dy <= 1) G.set(x, y, x < cx - 5.2 ? SS : S);
  }
  for (let y = 17; y <= 22; y++) for (let x = 7; x <= 11; x++) { const v = G.get(x, y); if (v === S && G.get(x - 2, y) !== S && G.get(x - 2, y) !== SS) G.set(x, y, SS); }
  G.set(21, 17, SL); G.set(22, 17, SL); G.set(21, 16, SL); G.set(12, 6, SL); G.set(13, 5, SL);
  // ears
  for (let y = 13; y <= 18; y++) { G.set(7, y, SS); G.set(26, y, SS); } G.set(6, 15, SS); G.set(6, 16, SS); G.set(27, 15, SS); G.set(27, 16, SS); G.set(7, 16, SD); G.set(26, 16, SD);
  // eyes
  const E = expr || 'normal';
  const eye = (x) => { G.set(x, 14, EYE_W); G.set(x + 1, 14, EYE_D); G.set(x + 2, 14, EYE_W); G.set(x, 15, SS); G.set(x + 1, 15, EYE_D); G.set(x + 2, 15, SS); G.hl(x, x + 2, 13, dk(S, .5)); };
  if (['normal', 'angry', 'talk', 'sad', 'proud'].includes(E)) { eye(11); eye(19); }
  if (E === 'proud') { G.set(12, 14, '#fff'); G.set(20, 14, '#fff'); G.set(11, 15, '#f2c14e'); G.set(21, 15, '#e0453a'); }
  if (E === 'sleepy') { G.hl(11, 13, 14, SD); G.hl(19, 21, 14, SD); G.set(12, 15, EYE_D); G.set(20, 15, EYE_D); G.set(11, 15, '#e8a8a0'); G.set(13, 15, '#e8a8a0'); G.set(19, 15, '#e8a8a0'); G.set(21, 15, '#e8a8a0'); }
  if (E === 'hurt' || E === 'blink') { G.hl(11, 13, 15, EYE_D); G.hl(19, 21, 15, EYE_D); if (E === 'hurt') { G.set(11, 14, EYE_D); G.set(21, 14, EYE_D); } }
  if (E === 'happy') { G.set(11, 15, EYE_D); G.set(12, 14, EYE_D); G.set(13, 15, EYE_D); G.set(19, 15, EYE_D); G.set(20, 14, EYE_D); G.set(21, 15, EYE_D); }
  if (E === 'ko') { for (const x of [11, 19]) { G.set(x, 13, EYE_D); G.set(x + 2, 13, EYE_D); G.set(x + 1, 14, EYE_D); G.set(x, 15, EYE_D); G.set(x + 2, 15, EYE_D); } }
  // brows
  if (E === 'angry') { G.set(10, 10, brow); G.set(11, 11, brow); G.set(12, 11, brow); G.set(13, 12, brow); G.set(19, 12, brow); G.set(20, 11, brow); G.set(21, 11, brow); G.set(22, 10, brow); }
  else if (E === 'sad' || E === 'hurt') { G.set(10, 12, brow); G.set(11, 11, brow); G.set(12, 11, brow); G.set(13, 10, brow); G.set(19, 10, brow); G.set(20, 11, brow); G.set(21, 11, brow); G.set(22, 12, brow); }
  else { G.hl(10, 13, 11, brow); G.hl(19, 22, 11, brow); if (E === 'proud') { G.set(13, 12, brow); G.set(19, 12, brow); } }
  // nose
  for (let y = 15; y <= 18; y++) G.set(15, y, SS); G.set(16, 19, SS); G.set(17, 19, SS); G.set(15, 19, SD); G.set(18, 19, SD); G.set(17, 16, SL);
  // beard
  const bd = def.beard;
  if (bd === 'full') {
    for (let y = 17; y <= 27; y++) for (let x = 7; x <= 26; x++) { const v = G.get(x, y); if (v === S || v === SS || v === SD || (y > 24 && v)) { if (y < 20 && x > 11 && x < 22) continue; G.set(x, y, (x + y) % 3 ? H : HD); } }
    for (let y = 12; y <= 17; y++) { G.set(8, y, H); G.set(9, y, H); G.set(24, y, H); G.set(25, y, H); }
    G.hl(12, 21, 20, H); G.hl(13, 20, 19, H);
  } else if (bd === 'stubble') {
    for (let y = 18; y <= 25; y++) for (let x = 8; x <= 25; x++) { const v = G.get(x, y); if ((v === S || v === SS) && (x + y) % 2 === 0) G.set(x, y, mix(v, H, .5)); }
  } else if (bd === 'mustache') { G.hl(12, 20, 20, H); G.hl(13, 19, 19, H); }
  else if (bd === 'goatee') { G.hl(13, 19, 20, H); for (let y = 23; y <= 25; y++) G.hl(14, 18, y, H); }
  // mouth
  if (E === 'hurt' || E === 'ko' || E === 'talk') { for (let y = 21; y <= 23; y++) G.hl(14, 18, y, '#4a1018'); G.hl(14, 18, 21, '#f0e8e0'); }
  else if (E === 'happy') { G.hl(13, 19, 21, '#fff4e8'); G.set(12, 20, LIP); G.set(20, 20, LIP); G.hl(14, 18, 22, LIP); }
  else if (E === 'proud') { G.hl(14, 19, 21, LIP); G.set(20, 20, LIP); G.hl(15, 18, 22, SS); }
  else if (E === 'sad') { G.hl(14, 18, 21, LIP); G.set(13, 22, LIP); G.set(19, 22, LIP); }
  else if (E === 'angry') { G.hl(13, 19, 21, LIP); G.hl(14, 18, 22, '#4a1018'); }
  else { G.hl(13, 19, 21, LIP); G.hl(14, 18, 22, SS); }
  // hair
  const hs = def.hairStyle;
  const inHead = (x, y) => { const v = G.get(x, y); return v === S || v === SS || v === SL || v === SD; };
  if (hs === 'curly') {
    for (let i = 0; i < 70; i++) {
      let x = R.r(5, 28), y = R.r(0, 9); if (y > 6 && x > 10 && x < 23) y = R.r(0, 6);
      G.disc(x, y, R.r(1.6, 3), R() < .2 ? HL : H);
    }
    for (let i = 0; i < 14; i++) { G.disc(R.r(5, 9), R.r(7, 14), R.r(1.3, 2.2), H); G.disc(R.r(24, 28), R.r(7, 14), R.r(1.3, 2.2), H); }
    for (let i = 0; i < 18; i++) G.set(R.i(7, 26), R.i(1, 7), HL);
  } else if (hs === 'buzz') {
    for (let y = 2; y <= 10; y++) for (let x = 6; x <= 27; x++) { if (!inHead(x, y) && y > 3) continue; const hl = 5 + Math.abs(x - 16.5) * 0.35; if (y < hl + 2 && ((x + y) % 2 === 0 || y < 6)) G.set(x, y, y < 4 && !inHead(x, y) ? null : H); }
    for (let x = 8; x <= 25; x++) G.set(x, 3, H);
  } else if (hs === 'short' || hs === 'slick' || hs === 'bun' || hs === 'ponytail' || hs === 'long') {
    for (let y = 0; y <= 12; y++) for (let x = 5; x <= 28; x++) {
      const d = ((x - 16.5) / 9.6) ** 2 + ((y - 9) / 8.6) ** 2; const hl = 7 + Math.abs(x - 16.5) * 0.45;
      if (d <= 1 && y < hl) G.set(x, y, R() < .12 ? HL : H);
    }
    for (let y = 9; y <= 15; y++) { G.set(6, y, H); G.set(7, y, H); G.set(26, y, H); G.set(27, y, H); }
    if (hs === 'slick' || hs === 'short') { G.hl(10, 14, 2, HL); G.hl(9, 12, 3, HL); }
    if (hs === 'bun') for (let y = -1; y <= 5; y++) for (let x = 12; x <= 21; x++) if ((x - 16.5) ** 2 + (y - 1.5) ** 2 <= 11) G.set(x, y, (x + y) % 3 ? H : HL);
    if (hs === 'long' || hs === 'ponytail') {
      const bot = hs === 'long' ? 30 : 22;
      for (let y = 10; y <= bot; y++) { for (let x = 4; x <= 7; x++) G.set(x, y, (x + y) % 4 ? H : HD); for (let x = 26; x <= 29; x++) G.set(x, y, (x + y) % 4 ? H : HD); }
    }
  } else if (hs === 'cap' || hs === 'capBack') {
    const CP = def.cap || '#222', CL = lt(CP, .2), CD = dk(CP, .65);
    for (let y = 1; y <= 9; y++) for (let x = 6; x <= 27; x++) if (((x - 16.5) / 10.2) ** 2 + ((y - 9) / 8.4) ** 2 <= 1) G.set(x, y, x > 20 && y < 5 ? CL : CP);
    if (hs === 'cap') { for (let x = 5; x <= 28; x++) { G.set(x, 9, CD); G.set(x, 10, CD); } }
    else { G.hl(8, 25, 9, CD); G.hl(14, 19, 8, dk(CP, .5)); G.set(16, 7, '#eee'); G.set(17, 7, '#eee'); }
    for (let y = 10; y <= 14; y++) { G.set(7, y, H); G.set(26, y, H); }
    G.set(16, 4, lt(CP, .5));
  } else if (hs === 'beanie') {
    const CP = def.cap || '#2e7d4f', CL = def.cap2 || lt(CP, .3);
    for (let y = 0; y <= 9; y++) for (let x = 6; x <= 27; x++) if (((x - 16.5) / 10.4) ** 2 + ((y - 9.5) / 9.2) ** 2 <= 1) G.set(x, y, (x + y) % 4 === 0 ? dk(CP, .8) : CP);
    for (let x = 6; x <= 27; x++) { G.set(x, 8, CL); G.set(x, 9, CL); }
    for (let y = 10; y <= 29; y++) for (const x of [4, 6, 8, 25, 27, 29]) if (G.get(x, y) !== S) { G.set(x, y, (y % 3) ? H : HD); G.set(x + 1, y, HD); }
  } else if (hs === 'bald') { G.set(13, 4, SL); G.set(14, 4, SL); G.set(12, 5, SL); }
  // accessories
  const acc = def.acc || [];
  if (acc.includes('sunglasses')) { G.hl(10, 14, 13, '#111'); for (let y = 14; y <= 15; y++) { G.hl(10, 14, y, '#141418'); G.hl(18, 22, y, '#141418'); } G.hl(18, 22, 13, '#111'); G.hl(15, 17, 14, '#111'); G.set(11, 14, '#667'); G.set(19, 14, '#667'); }
  if (acc.includes('glassesHead')) { G.hl(10, 14, 4, '#141418'); G.hl(18, 22, 4, '#141418'); G.hl(15, 17, 4, '#111'); G.set(11, 4, '#8ab'); }
  if (acc.includes('earring')) { G.set(7, 19, '#f5c542'); G.set(26, 19, '#f5c542'); }
  if (acc.includes('chain')) for (let x = 11; x <= 21; x++) if (x % 2) G.set(x, 27 + (Math.abs(x - 16) < 3 ? 1 : 0), '#f2c14e');
  if (acc.includes('cigarette')) { for (let x = 19; x <= 25; x++) G.set(x, 22 + (x > 22 ? 1 : 0), x < 21 ? '#d9a066' : '#eee'); G.set(26, 23, '#ff7a2a'); G.set(27, 21, '#99a'); G.set(28, 19, '#99a'); }
  return G;
}
const _ports = new Map();
function portraitCanvas(def, expr = 'normal') {
  const key = def.id + '|' + expr; let c = _ports.get(key); if (c) return c;
  c = paintPortrait(def, expr).canvas(); _ports.set(key, c); return c;
}

// ============================================================
//  POSES & ANIMATIONS
//  angles (deg): limbs 0=down, +90=forward, 180=up; torso 0=up, + leans forward
// ============================================================
const BASE = { ff1: 1, ff2: 1, hx: 0, t: 0, ua1: -6, fa1: 4, ua2: 6, fa2: 12, th1: -3, sh1: -5, th2: 4, sh2: 2, ft1: 90, ft2: 90, air: 0, hipY: null, h1: 'fist', h2: 'fist', hdx: 0, hdy: 0, prop: null };
const NUMK = ['ff1', 'ff2', 'hx', 't', 'ua1', 'fa1', 'ua2', 'fa2', 'th1', 'sh1', 'th2', 'sh2', 'ft1', 'ft2', 'hdx', 'hdy'];
const P = o => Object.assign({}, BASE, o);
const X = (b, o) => Object.assign({}, b, o);
const ANIM = {};
function defA(name, loop, keys) { ANIM[name] = { loop: !!loop, keys: keys.map(k => ({ p: k[0], d: k[1] })), total: keys.reduce((s, k) => s + k[1], 0) }; }
// attack helper: frame data aligned (startup s, active a, recovery r)
function atk(name, chamber, active, s, a, r, base) {
  defA(name, 0, [[base, Math.ceil(s / 2)], [chamber, Math.floor(s / 2)], [active, a], [active, Math.ceil(r * 0.45)], [base, Math.floor(r * 0.55)], [base, 1]]);
}

const CASUAL = P({});
const STANCE = P({ t: 8, ua1: 35, fa1: 155, ua2: 55, fa2: 148, th1: -6, sh1: -32, th2: 30, sh2: 4 });
const STANCE2 = X(STANCE, { t: 9, ua1: 38, fa1: 150, ua2: 58, fa2: 143, th1: -4, sh1: -37, th2: 34, sh2: 5 });
defA('idle', 1, [[STANCE, 22], [STANCE2, 22]]);
const WF1 = X(STANCE, { th1: 14, sh1: -22, th2: 12, sh2: -8 }), WF2 = X(STANCE, { th1: 26, sh1: -4, th2: -8, sh2: -30 }), WF3 = X(STANCE, { th1: 8, sh1: -30, th2: 6, sh2: -20 });
defA('walkF', 1, [[STANCE, 7], [WF1, 7], [WF2, 7], [WF3, 7]]);
defA('walkB', 1, [[STANCE, 8], [WF3, 8], [WF2, 8], [WF1, 8]]);
const CR = P({ t: 32, ua1: 55, fa1: 165, ua2: 72, fa2: 152, th1: 30, sh1: -100, th2: 95, sh2: -6, hdx: 1 });
defA('crouch', 1, [[CR, 30], [X(CR, { t: 34, ua2: 74 }), 30]]);
const JS = P({ air: 1, t: 10, ua1: 30, fa1: 150, ua2: 60, fa2: 140, th1: 20, sh1: -20, th2: 40, sh2: 0 });
const JU = P({ air: 1, t: 4, ua1: 40, fa1: 165, ua2: 70, fa2: 150, th1: 50, sh1: -40, th2: 85, sh2: -15 });
defA('jump', 0, [[JS, 8], [JU, 22], [JS, 16], [JS, 1]]);
const JAB_C = X(STANCE, { t: 12, ua2: 70, fa2: 120 }), JAB_A = X(STANCE, { t: 16, hx: 2, ua2: 90, fa2: 90, ua1: 30, fa1: 160 });
atk('jab', JAB_C, JAB_A, 4, 3, 8, STANCE);
const CROSS_C = X(STANCE, { t: 14, ua1: 50, fa1: 120 }), CROSS_A = X(STANCE, { t: 26, hx: 4, ua1: 88, fa1: 89, ua2: 40, fa2: 165, th1: -14, sh1: -28, th2: 36, sh2: 8 });
atk('cross', CROSS_C, CROSS_A, 6, 3, 14, STANCE);
const KICK_C = X(STANCE, { t: -4, th1: -6, sh1: -12, th2: 95, sh2: -20 }), KICK_A = X(STANCE, { t: -16, ua1: 10, fa1: 140, ua2: 30, fa2: 150, th1: -8, sh1: -10, th2: 98, sh2: 94, ft2: 105 });
atk('kick', KICK_C, KICK_A, 7, 4, 15, STANCE);
const CP_C = X(CR, { ua2: 65, fa2: 120 }), CP_A = X(CR, { ua2: 86, fa2: 88, t: 36, hx: 2 });
atk('cpunch', CP_C, CP_A, 4, 3, 8, CR);
const SW_C = X(CR, { t: 40, th2: 80, sh2: 20 }), SW_A = X(CR, { t: 45, th2: 62, sh2: 86, ft2: 100, ua1: 20, fa1: 60, ua2: 34, fa2: 80, hx: -2 });
atk('sweep', SW_C, SW_A, 8, 4, 20, CR);
const JK_A = X(JU, { t: -6, th2: 80, sh2: 100, ft2: 115, th1: 30, sh1: -70 });
defA('jkick', 0, [[JU, 3], [JK_A, 2], [JK_A, 60]]);
const JP_A = X(JU, { t: 20, ua2: 60, fa2: 55 });
defA('jpunch', 0, [[JU, 2], [X(JU, { ua2: 40, fa2: 120 }), 2], [JP_A, 60]]);
const TH_C = X(STANCE, { t: -12, ua2: -130, fa2: -165, h2: 'open', ua1: 60, fa1: 120 }), TH_A = X(STANCE, { t: 22, hx: 3, ua2: 100, fa2: 98, h2: 'open', ua1: 20, fa1: -10 });
defA('throw', 0, [[STANCE, 4], [TH_C, 7], [TH_A, 3], [TH_A, 8], [STANCE, 10], [STANCE, 1]]);
const BLOW_C = X(STANCE, { t: -4, ua2: 20, fa2: 168, h2: 'open' }), BLOW_A = X(STANCE, { t: 20, hx: 2, ua2: 60, fa2: 100, h2: 'open' });
defA('blow', 0, [[STANCE, 4], [BLOW_C, 10], [BLOW_A, 4], [BLOW_A, 10], [STANCE, 10], [STANCE, 1]]);
const DASH = X(STANCE, { t: 30, hx: 3, ua1: 30, fa1: 150, ua2: 40, fa2: 160, th1: -30, sh1: -50, th2: 50, sh2: 20 });
defA('dash', 1, [[DASH, 4], [X(DASH, { th1: 10, sh1: -30, th2: 20, sh2: -10 }), 4]]);
const SUPA = X(JAB_A, { t: 24 }), SUPB = X(CROSS_A, { t: 26 });
defA('rush', 1, [[SUPA, 3], [SUPB, 3]]);
const UPPER = X(STANCE, { t: -8, ua2: 172, fa2: 178, ua1: 20, fa1: 120, th1: -10, sh1: -20, th2: 20, sh2: 0 });
defA('upper', 0, [[X(CR, { ua2: 60, fa2: 100 }), 4], [UPPER, 6], [UPPER, 20], [STANCE, 1]]);
const SNATCH = X(STANCE, { t: 34, hx: 4, ua2: 92, fa2: 92, h2: 'open', th1: -30, sh1: -50, th2: 55, sh2: 25 });
defA('snatch', 0, [[STANCE, 4], [X(STANCE, { t: -6, ua2: 20, fa2: 60 }), 4], [SNATCH, 14], [SNATCH, 7], [STANCE, 9], [STANCE, 1]]);
const POUND_U = P({ air: 1, t: -5, ua1: 170, fa1: 178, ua2: 172, fa2: 178, th1: 40, sh1: -30, th2: 60, sh2: -10 });
const POUND_D = X(CR, { t: 44, ua1: 75, fa1: 60, ua2: 85, fa2: 62 });
defA('pound', 0, [[STANCE, 4], [CR, 4], [POUND_U, 12], [POUND_D, 3], [POUND_D, 14], [STANCE, 10], [STANCE, 1]]);
const HIT = X(STANCE, { t: -24, hx: -3, ua1: 10, fa1: 120, ua2: -10, fa2: 60, th1: -14, sh1: -30, th2: 24, sh2: 0, hdx: -1 });
defA('hit', 0, [[HIT, 3], [HIT, 6], [STANCE, 10], [STANCE, 1]]);
const HITC = X(CR, { t: 8, hx: -2, ua2: 20, fa2: 90, ua1: 10, fa1: 100 });
defA('hitC', 0, [[HITC, 6], [CR, 10], [CR, 1]]);
const BLOCK = X(STANCE, { t: -2, hx: -1, ua1: 62, fa1: 176, ua2: 72, fa2: 178 });
defA('block', 1, [[BLOCK, 20]]);
const BLOCKC = X(CR, { t: 24, ua1: 62, fa1: 178, ua2: 75, fa2: 178 });
defA('blockC', 1, [[BLOCKC, 20]]);
const KNOCK = P({ air: 1, t: -60, ua1: -110, fa1: -150, ua2: -90, fa2: -130, th1: 60, sh1: 20, th2: 85, sh2: 45 });
defA('knock', 1, [[KNOCK, 10], [X(KNOCK, { t: -66, ua2: -100 }), 10]]);
const LIE = P({ hipY: -5, t: -90, ua1: -150, fa1: -170, ua2: -120, fa2: -160, th1: 92, sh1: 88, th2: 82, sh2: 98, ft1: 175, ft2: 180 });
defA('lie', 1, [[LIE, 60]]);
const SIT = P({ hipY: -6, t: -28, ua1: -50, fa1: -30, ua2: -35, fa2: -15, th1: 82, sh1: 20, th2: 70, sh2: -10, h1: 'open', h2: 'open' });
defA('sit', 1, [[SIT, 40], [X(SIT, { t: -25 }), 40]]);
defA('getup', 0, [[LIE, 6], [SIT, 9], [CR, 9], [STANCE, 1]]);
const WIN1 = P({ t: -6, ua2: 172, fa2: 178, ua1: -15, fa1: 30, th1: -4, sh1: -6, th2: 8, sh2: 4 });
defA('win', 1, [[WIN1, 12], [X(WIN1, { ua2: 160, fa2: 175, t: -3 }), 12]]);
const LAUGH = P({ t: -14, ua1: 16, fa1: 70, ua2: 25, fa2: -70, th1: -6, sh1: -8, th2: 8, sh2: 5 });
defA('laugh', 1, [[LAUGH, 7], [X(LAUGH, { t: -20, hdy: -1 }), 7]]);
// casual / cutscene
defA('stand', 1, [[CASUAL, 40], [X(CASUAL, { ua1: -4, fa1: 6, ua2: 8, fa2: 15, t: 1 }), 40]]);
const CW0 = P({ t: 3, th1: -22, sh1: -28, th2: 24, sh2: 10, ua1: 22, fa1: 40, ua2: -20, fa2: -8 });
const CW1 = P({ t: 3, th1: 2, sh1: -40, th2: 0, sh2: -2, ua1: 0, fa1: 12, ua2: 0, fa2: 10 });
const CW2 = P({ t: 3, th1: 24, sh1: 10, th2: -22, sh2: -28, ua1: -20, fa1: -8, ua2: 22, fa2: 40 });
const CW3 = P({ t: 3, th1: 0, sh1: -2, th2: 2, sh2: -40, ua1: 0, fa1: 12, ua2: 0, fa2: 10 });
defA('walk', 1, [[CW0, 8], [CW1, 8], [CW2, 8], [CW3, 8]]);
const BAG = { ua1: -34, fa1: -30 };
defA('walkBag', 1, [[X(CW0, BAG), 8], [X(CW1, BAG), 8], [X(CW2, BAG), 8], [X(CW3, BAG), 8]]);
defA('standBag', 1, [[X(CASUAL, BAG), 40], [X(CASUAL, { ...BAG, ua2: 9, fa2: 15 }), 40]]);
defA('wave', 1, [[P({ ua2: 150, fa2: 178, h2: 'open' }), 9], [P({ ua2: 150, fa2: 140, h2: 'open' }), 9]]);
const CRY = P({ t: 12, ua1: 30, fa1: 172, ua2: 36, fa2: 168, hdy: 1, h1: 'open', h2: 'open' });
defA('cry', 1, [[CRY, 6], [X(CRY, { t: 9 }), 6]]);
const HUG = P({ t: 8, ua1: 80, fa1: 40, ua2: 85, fa2: 30, h1: 'open', h2: 'open' });
defA('hug', 1, [[HUG, 30], [X(HUG, { t: 10 }), 30]]);
defA('give', 1, [[P({ ua2: 70, fa2: 85, h2: 'open', prop: 'chancla', t: 4 }), 40]]);
defA('phone', 1, [[P({ t: 4, ua2: 25, fa2: 135, ua1: 20, fa1: 140, hdy: 1, prop: 'phone' }), 40]]);
defA('phoneBag', 1, [[P({ t: 4, ua2: 25, fa2: 135, ...BAG, hdy: 1, prop: 'phone' }), 40]]);
defA('film', 1, [[P({ ua2: 72, fa2: 140, ua1: -4, fa1: 8, prop: 'phone' }), 30], [P({ ua2: 75, fa2: 138, ua1: -4, fa1: 8, prop: 'phone' }), 30]]);
defA('pockets', 1, [[P({ ua1: -10, fa1: 16, ff1: .75, ua2: -12, fa2: 20, ff2: .75, h1: 'hide', h2: 'hide', th2: 8, sh2: 4 }), 60], [P({ ua1: -10, fa1: 16, ff1: .75, ua2: -12, fa2: 20, ff2: .75, h1: 'hide', h2: 'hide', th2: 8, sh2: 4, t: 2, hdy: 1 }), 60]]);
defA('cheer', 1, [[P({ ua1: 160, fa1: 175, ua2: 165, fa2: 178, h1: 'open', h2: 'open' }), 7], [P({ ua1: 135, fa1: 160, ua2: 140, fa2: 165, th1: -10, sh1: -30, th2: 10, sh2: -12, h1: 'open', h2: 'open' }), 7]]);
defA('drink', 1, [[P({ ua2: 22, fa2: 120, prop: 'can' }), 60], [P({ ua2: 18, fa2: 165, prop: 'can', t: -6 }), 30]]);
defA('smoke', 1, [[P({ ua2: 14, fa2: 168, t: -3 }), 36], [P({ ua2: 28, fa2: 110 }), 36]]);
defA('showWatch', 1, [[P({ ua2: 82, fa2: 100, h2: 'open', t: 4 }), 20], [P({ ua2: 86, fa2: 96, h2: 'open', t: 5 }), 20]]);
defA('canUp', 1, [[P({ ua2: 150, fa2: 172, prop: 'can' }), 16], [P({ ua2: 120, fa2: 150, prop: 'can' }), 16]]);
defA('hipHand', 1, [[P({ ua1: -8, fa1: 6, ua2: -14, fa2: 32, t: -3, th2: 10, sh2: 6 }), 30], [P({ ua1: -8, fa1: 6, ua2: -14, fa2: 34, t: -1, hdy: 1, th2: 10, sh2: 6 }), 30]]);
defA('knuckles', 1, [[P({ t: 6, ua1: 60, fa1: 112, ua2: 55, fa2: 100 }), 10], [P({ t: 6, ua1: 58, fa1: 118, ua2: 60, fa2: 94 }), 10]]);
defA('point', 1, [[P({ ua2: 95, fa2: 95, h2: 'open', t: 2 }), 40]]);
defA('shrug', 1, [[P({ ua1: 30, fa1: 120, ua2: 30, fa2: 120, h1: 'open', h2: 'open' }), 30], [P({ ua1: 34, fa1: 125, ua2: 34, fa2: 125, h1: 'open', h2: 'open', hdy: -1 }), 30]]);
defA('seated', 1, [[P({ hipY: -17, t: -4, th1: 85, sh1: 5, th2: 88, sh2: 2, ua1: 30, fa1: 80, ua2: 35, fa2: 120, prop: 'phone' }), 40]]);

// ---------- pose sampling ----------
const _hipMemo = new Map();
function resolveHip(def, p) {
  if (p.hipY != null) return p.hipY * def.b.s;
  if (p.air) return -30 * def.b.s;
  let m = _hipMemo.get(p); if (!m) { m = {}; _hipMemo.set(p, m); }
  if (m[def.id] != null) return m[def.id];
  const k = skel(def, p); return m[def.id] = -(Math.max(k.an1.y, k.an2.y) + 2.5);
}
function samplePose(def, name, t) {
  const A = ANIM[name] || ANIM.stand;
  const tt = A.loop ? ((t % A.total) + A.total) % A.total : Math.min(Math.max(0, t), A.total);
  let acc = 0, i = 0;
  for (; i < A.keys.length; i++) { if (tt < acc + A.keys[i].d || i === A.keys.length - 1) break; acc += A.keys[i].d; }
  const k0 = A.keys[i], k1 = A.loop ? A.keys[(i + 1) % A.keys.length] : (A.keys[i + 1] || k0);
  let f = k0.d > 0 ? clamp((tt - acc) / k0.d, 0, 1) : 1; f = easeIO(f);
  const o = {}; for (const key of NUMK) o[key] = lerp(k0.p[key], k1.p[key], f);
  const dp = f < 0.5 ? k0.p : k1.p;
  o.h1 = dp.h1; o.h2 = dp.h2; o.air = dp.air; o.prop = k0.p.prop || k1.p.prop;
  o.hipY = lerp(resolveHip(def, k0.p), resolveHip(def, k1.p), f);
  return o;
}

// ---------- skeleton ----------
function skel(def, p) {
  const b = def.b, s = b.s;
  const T = b.torso * s, TH = b.thigh * s, SH = b.shin * s, UA = b.upper * s, FA = b.fore * s;
  const tr = p.t * DEG, u = { x: Math.sin(tr), y: -Math.cos(tr) }, n = { x: Math.cos(tr), y: Math.sin(tr) };
  const hip = pt(p.hx, 0);
  const ho = Math.max(0, b.hw / 2 - 2.5), so = Math.max(0, b.sw / 2 - 2.5);
  const hp1 = padd(hip, n, -ho), hp2 = padd(hip, n, ho);
  const C = padd(hip, u, T);
  const sh1 = padd(C, n, -so + 0.5), sh2 = padd(C, n, so - 1);
  const el1 = padd(sh1, V(p.ua1, UA)), ha1 = padd(el1, V(p.fa1, FA * (p.ff1 == null ? 1 : p.ff1)));
  const el2 = padd(sh2, V(p.ua2, UA)), ha2 = padd(el2, V(p.fa2, FA * (p.ff2 == null ? 1 : p.ff2)));
  const kn1 = padd(hp1, V(p.th1, TH)), an1 = padd(kn1, V(p.sh1, SH));
  const kn2 = padd(hp2, V(p.th2, TH)), an2 = padd(kn2, V(p.sh2, SH));
  const neck = padd(C, u, 1.5);
  return { u, n, hip, hp1, hp2, C, sh1, sh2, el1, ha1, el2, ha2, kn1, an1, kn2, an2, neck, T };
}

// ============================================================
//  BODY RENDERER
// ============================================================
const SPR_W = 150, SPR_H = 124, AX = 75, AY = 116;
function renderPose(def, p, expr) {
  const [c, g] = mk(SPR_W, SPR_H);
  const k0 = skel(def, p), oy = AY + p.hipY;
  const k = {}; for (const key in k0) { const v = k0[key]; k[key] = (v && v.x !== undefined && key !== 'u' && key !== 'n') ? pt(v.x + AX, v.y + oy) : v; }
  const b = def.b, S = def.skin;
  const far = col => dk(col, .8);
  const acc = def.acc || [];
  // ---- limb painters
  const armCols = () => {
    const up = def.jacket || (def.sleeve === 'long' ? (def.dress || def.shirt) : S);
    const fo = def.jacket || (def.sleeve === 'long' ? (def.dress || def.shirt) : S);
    const topC = def.dress || def.jacket || def.shirt;
    return [up === topC ? dk(up, .88) : up, fo === topC ? dk(fo, .88) : fo];
  };
  const fill2 = (a, bb, d, col) => { seg(g, a, bb, d, dk(col, .78)); seg(g, pt(a.x - .5, a.y - .5), pt(bb.x - .5, bb.y - .5), Math.max(1, d - 1), col); };
  const stripe = (a, bb, col, side = 1) => {
    const dx = bb.x - a.x, dy = bb.y - a.y, L = Math.hypot(dx, dy) || 1; const q = { x: -dy / L * side, y: dx / L * side };
    seg(g, padd(a, q, 1.4), padd(bb, q, 1.4), 1, col);
  };
  function hand(h, el, type, isFar) {
    if (type === 'hide') return;
    const fs = b.fist || 4, col = isFar ? far(S) : S;
    if (type === 'open') {
      const dx = h.x - el.x, dy = h.y - el.y, L = Math.hypot(dx, dy) || 1, hh = pt(h.x + dx / L * 1.2, h.y + dy / L * 1.2);
      seg(g, h, hh, fs + 1, OUTL); seg(g, h, hh, fs - 1, dk(col, .85)); stamp(g, hh.x - .5, hh.y - .5, fs - 2, col);
    } else { stamp(g, h.x, h.y, fs + 2, OUTL); stamp(g, h.x, h.y, fs, dk(col, .8)); stamp(g, h.x - .5, h.y - .5, fs - 1, col); }
  }
  function arm(sh, el, ha, isFar, htype) {
    let [cu, cf] = armCols(); if (isFar) { cu = far(cu); cf = far(cf); }
    seg(g, sh, el, b.uw + 2, OUTL); seg(g, el, ha, b.fw + 2, OUTL);
    fill2(sh, el, b.uw, cu); fill2(el, ha, b.fw, cf);
    if (!def.jacket && def.sleeve === 'short') {
      const top = def.dress || def.shirt, m = plerp(sh, el, .55), sc = isFar ? far(top) : top;
      seg(g, sh, m, b.uw + 3, OUTL); fill2(sh, m, b.uw + 1, sc);
    }
    if (def.stripe) { stripe(sh, el, isFar ? far(def.stripe) : def.stripe, -1); stripe(el, ha, isFar ? far(def.stripe) : def.stripe, -1); }
    if (acc.includes('watches')) {
      for (const tt of [.72, .5]) { const w = plerp(el, ha, tt); g.fillStyle = OUTL; g.fillRect(Math.round(w.x) - 2, Math.round(w.y) - 2, 4, 4); g.fillStyle = isFar ? '#b08a30' : '#f2c14e'; g.fillRect(Math.round(w.x) - 1, Math.round(w.y) - 1, 2, 2); }
    }
    hand(ha, el, htype, isFar);
  }
  function leg(hp, kn, an, ft, isFar) {
    const legSkin = def.dress && !def.tights;
    let tc = legSkin ? S : def.pants, sc = (def.shorts || legSkin) ? S : def.pants;
    if (def.tights) { tc = def.tights; sc = def.tights; }
    if (isFar) { tc = far(tc); sc = far(sc); }
    seg(g, hp, kn, b.tw + 2, OUTL); seg(g, kn, an, b.shw + 2, OUTL);
    fill2(hp, kn, b.tw, tc); fill2(kn, an, b.shw, sc);
    if (def.shorts && !legSkin) { const pc = isFar ? far(def.pants) : def.pants; const m = plerp(hp, kn, .8); seg(g, hp, m, b.tw + 3, OUTL); fill2(hp, m, b.tw + 1, pc); }
    if (def.stripe && !def.shorts) { const st = isFar ? far(def.stripe) : def.stripe; stripe(hp, kn, st, 1); stripe(kn, an, st, 1); }
    // shoe
    const f = V(ft, 1), dn = pt(-f.y, f.x);
    const s0 = padd(an, f, -1), s1 = padd(an, f, 4 * b.s);
    const shc = isFar ? far(def.shoes) : def.shoes;
    seg(g, s0, s1, 6, OUTL); seg(g, s0, s1, 4, dk(shc, .8)); seg(g, pt(s0.x - .5, s0.y - .5), pt(s1.x - .5, s1.y - .5), 3, shc);
    seg(g, padd(padd(an, dn, 1.5), f, -1.2), padd(padd(an, dn, 1.5), f, 4.3 * b.s), 1, isFar ? far(def.sole) : def.sole);
  }
  // ---- torso
  function torso() {
    const u = k.u, n = k.n, hip = k.hip, hw = b.hw / 2, sw = b.sw / 2, T = k.T, bel = b.belly || 0;
    const Q = (uk, nk) => pt(hip.x + u.x * uk + n.x * nk, hip.y + u.y * uk + n.y * nk);
    const pc = def.dress || def.pants;
    const pel = [Q(-2, -hw), Q(-2, hw), Q(5, hw), Q(5, -hw)];
    polyOut(g, pel, pc);
    if (def.dress && !def.noSkirt) {
      // skirt hangs vertically
      const sk = [pt(hip.x - hw - 1, hip.y - 1), pt(hip.x + hw + 1, hip.y - 1), pt(hip.x + hw + 4, hip.y + 12 * b.s), pt(hip.x - hw - 4, hip.y + 12 * b.s)];
      polyOut(g, sk, def.dress);
      polyFill(g, [sk[0], plerp(sk[0], sk[1], .3), plerp(sk[3], sk[2], .3), sk[3]], dk(def.dress, .8));
      g.fillStyle = dk(def.dress, .7); for (let i = 1; i < 4; i++) { const a = plerp(sk[0], sk[1], i / 4), bb = plerp(sk[3], sk[2], i / 4); seg(g, plerp(a, bb, .4), bb, 1, dk(def.dress, .72)); }
    }
    const topC = def.dress || def.jacket || def.shirt;
    const tor = [Q(3, -hw - .5), Q(3, hw + .5 + bel), Q(T * .55, sw + bel * .6), Q(T, sw), Q(T, -sw)];
    polyOut(g, tor, topC);
    polyFill(g, [tor[0], plerp(tor[0], tor[1], .28), plerp(tor[4], tor[3], .28), tor[4]], dk(topC, .8));
    // chest highlight
    polyFill(g, [plerp(tor[3], tor[4], .15), plerp(tor[3], tor[4], .35), plerp(tor[2], tor[0], .35), plerp(tor[2], tor[0], .1)], lt(topC, .1));
    if (def.jacket) {
      const strip = [Q(4, hw - 3.8 + bel), Q(4, hw - .8 + bel), Q(T - 1, sw - 1), Q(T - 1, sw - 4.5)];
      polyFill(g, strip, def.shirt);
      seg(g, Q(4, hw - 3.8 + bel), Q(T - 1, sw - 4.5), 1, dk(def.jacket, .55));
      if (def.stripe) { seg(g, Q(4, -hw + 1), Q(T - 1, -sw + 1.5), 1, def.stripe); }
    }
    if (def.hood) { seg(g, Q(T - 1, -sw + 1), Q(T + 1, -sw + 4), 3, dk(topC, .7)); }
    // belt
    if (!def.dress) seg(g, Q(3.5, -hw), Q(3.5, hw + bel * .5), 1, dk(def.pants, .6));
    // collar
    if (!def.jacket && def.sleeve !== 'none') seg(g, Q(T - .5, -1), Q(T - .5, sw - 2), 1, dk(topC, .65));
    if (def.sleeve === 'none' && !def.jacket) { seg(g, Q(T - 1, -sw + 1.5), Q(T - 1, -sw + 2.5), 1, S); }
    // accessories on torso
    if (acc.includes('chain')) { const a = Q(T - .5, -2), m = Q(T - 5, 1.5), e = Q(T - .5, sw - 1.5); seg(g, a, m, 1, '#f2c14e'); seg(g, m, e, 1, '#f2c14e'); }
    if (acc.includes('bag')) {
      const bp = Q(2, -hw - 3); seg(g, Q(T - 1, sw - 2), bp, 1, '#d8d8d0');
      g.fillStyle = OUTL; g.fillRect(Math.round(bp.x) - 4, Math.round(bp.y) - 3, 9, 10);
      g.fillStyle = '#ecece4'; g.fillRect(Math.round(bp.x) - 3, Math.round(bp.y) - 2, 7, 8);
      g.fillStyle = '#c9c9c0'; g.fillRect(Math.round(bp.x) - 3, Math.round(bp.y) + 4, 7, 2);
      g.fillStyle = '#c8323c'; g.fillRect(Math.round(bp.x) - 2, Math.round(bp.y) - 4, 2, 3); g.fillStyle = '#2c8a3a'; g.fillRect(Math.round(bp.x) + 1, Math.round(bp.y) - 4, 2, 3);
      g.fillStyle = '#d0d4dc'; g.fillRect(Math.round(bp.x) - 2, Math.round(bp.y) - 4, 2, 1); g.fillRect(Math.round(bp.x) + 1, Math.round(bp.y) - 4, 2, 1);
    }
    if (acc.includes('crossbag')) {
      const bp = Q(4, hw + 1); seg(g, Q(T - 1, -sw + 2), bp, 1, '#2a1a14');
      g.fillStyle = OUTL; g.fillRect(Math.round(bp.x) - 3, Math.round(bp.y) - 2, 6, 5); g.fillStyle = '#6b3a2a'; g.fillRect(Math.round(bp.x) - 2, Math.round(bp.y) - 1, 4, 3); g.fillStyle = '#f2c14e'; g.fillRect(Math.round(bp.x), Math.round(bp.y), 1, 1);
    }
    if (acc.includes('backpack')) { const bp = Q(T * .6, -sw - 2); g.fillStyle = OUTL; g.fillRect(Math.round(bp.x) - 4, Math.round(bp.y) - 5, 7, 11); g.fillStyle = def.pack || '#c0392b'; g.fillRect(Math.round(bp.x) - 3, Math.round(bp.y) - 4, 5, 9); }
  }
  // ---- head
  function head() {
    const rot = p.t < -50;
    const hc = headCanvas(def, expr, rot);
    if (!rot) g.drawImage(hc, Math.round(k.neck.x - 9 + p.hdx), Math.round(k.neck.y - 18 + p.hdy));
    else g.drawImage(hc, Math.round(k.neck.x - 18), Math.round(k.neck.y - 10));
  }
  function prop() {
    const h = k.ha2;
    if (p.prop === 'phone') { g.fillStyle = OUTL; g.fillRect(Math.round(h.x) - 2, Math.round(h.y) - 5, 5, 7); g.fillStyle = '#26262e'; g.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 4, 3, 5); g.fillStyle = '#9fe8ff'; g.fillRect(Math.round(h.x), Math.round(h.y) - 4, 2, 3); }
    if (p.prop === 'can') { g.fillStyle = OUTL; g.fillRect(Math.round(h.x) - 2, Math.round(h.y) - 5, 5, 7); g.fillStyle = '#c8323c'; g.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 4, 3, 5); g.fillStyle = '#e0e4ea'; g.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 4, 3, 1); }
    if (p.prop === 'chancla') { g.fillStyle = OUTL; g.fillRect(Math.round(h.x) - 1, Math.round(h.y) - 4, 9, 4); g.fillStyle = '#2f7fd1'; g.fillRect(Math.round(h.x), Math.round(h.y) - 3, 7, 2); g.fillStyle = '#f2c14e'; g.fillRect(Math.round(h.x) + 2, Math.round(h.y) - 4, 3, 1); }
  }
  // ---- draw order
  arm(k.sh1, k.el1, k.ha1, true, p.h1);
  leg(k.hp1, k.kn1, k.an1, p.ft1, true);
  leg(k.hp2, k.kn2, k.an2, p.ft2, false);
  torso();
  head();
  arm(k.sh2, k.el2, k.ha2, false, p.h2);
  prop();
  return { c, ax: AX, ay: AY, hand1: pt(k.ha1.x - AX, k.ha1.y - AY), hand2: pt(k.ha2.x - AX, k.ha2.y - AY), top: pt(k.neck.x - AX, k.neck.y - AY - 14) };
}

// ---------- sprite cache ----------
const _spr = new Map();
function getSprite(def, anim, t, expr = 'normal') {
  const A = ANIM[anim] || ANIM.stand;
  let tt = A.loop ? ((Math.floor(t) % A.total) + A.total) % A.total : Math.min(Math.floor(t), A.total);
  tt = Math.floor(tt / 2) * 2;
  const key = def.id + '|' + anim + '|' + tt + '|' + expr;
  let s = _spr.get(key);
  if (!s) {
    s = renderPose(def, samplePose(def, anim, tt), expr);
    if (_spr.size > 2400) { let i = 0; for (const k of _spr.keys()) { _spr.delete(k); if (++i > 600) break; } }
    _spr.set(key, s);
  }
  return s;
}
function whiteOf(s) {
  if (s.white) return s.white;
  const [c, g] = mk(s.c.width, s.c.height); g.drawImage(s.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  return s.white = c;
}
function tintedOf(s, col, a) {
  const k = 'tint' + col + a; if (s[k]) return s[k];
  const [c, g] = mk(s.c.width, s.c.height); g.drawImage(s.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  return s[k] = c;
}
function drawSpr(g, s, x, y, facing, img) {
  const im = img || s.c; x = Math.round(x); y = Math.round(y);
  if (facing >= 0) g.drawImage(im, x - s.ax, y - s.ay);
  else { g.save(); g.translate(x, 0); g.scale(-1, 1); g.drawImage(im, -s.ax, y - s.ay); g.restore(); }
}
function shadow(g, x, y, w, a = 0.35) {
  g.globalAlpha = a; g.fillStyle = '#0a0612';
  const hw = Math.round(w / 2); g.fillRect(Math.round(x) - hw + 2, Math.round(y) - 1, hw * 2 - 4, 3); g.fillRect(Math.round(x) - hw, Math.round(y), hw * 2, 1);
  g.globalAlpha = 1;
}

// ============================================================
//  CHARACTER DEFINITIONS
// ============================================================
let _cid = 0;
function mkChar(o) {
  const d = Object.assign({
    id: 'c' + (_cid++), name: '???', skin: '#b97d4b', hair: '#1a1311', hairStyle: 'short', beard: null, shirt: '#1e6d68', sleeve: 'short',
    jacket: null, stripe: null, pants: '#2d54a3', shorts: false, shoes: '#ecebe6', sole: '#9d9a90', dress: null, acc: [], voice: 300, seed: _cid * 17 + 3, expr: 'normal'
  }, o);
  d.b = Object.assign({ s: 1.22, torso: 19, thigh: 13, shin: 13, upper: 10, fore: 10, sw: 14, hw: 12, tw: 7, shw: 6, uw: 6, fw: 5, fist: 5, belly: 0 }, o.b || {});
  return d;
}
const CH = {
  hero: mkChar({ id: 'hero', name: 'MATEO', skin: '#b77a48', hair: '#1b1411', hairStyle: 'curly', shirt: '#1f6e69', pants: '#2c55a8', shoes: '#ecebe6', voice: 330, seed: 11, color: '#4fb3ff' }),
  mom: mkChar({ id: 'mom', name: 'MAMÁ', skin: '#b98356', hair: '#2a1b14', hairStyle: 'bun', dress: '#b8324a', shoes: '#5a2a1a', sole: '#3a1a10', acc: ['earring'], voice: 520, b: { s: 1.12, sw: 13, hw: 12 }, seed: 21, color: '#ff8fb0' }),
  dad: mkChar({ id: 'dad', name: 'PAPÁ', skin: '#a86f45', hair: '#231a15', hairStyle: 'slick', beard: 'mustache', shirt: '#e9e4d8', sleeve: 'long', pants: '#5d5d66', shoes: '#3a2a20', sole: '#1a1410', voice: 220, b: { sw: 15, hw: 13, belly: 2 }, seed: 31, color: '#ffd27a' }),
  sis: mkChar({ id: 'sis', name: 'VALE', skin: '#b98356', hair: '#2a1b14', hairStyle: 'ponytail', shirt: '#f2c14e', pants: '#d6457a', shorts: true, shoes: '#f4f4f4', voice: 640, b: { s: .74, sw: 10, hw: 9, tw: 5, shw: 4, uw: 4, fw: 4, fist: 4 }, seed: 41, color: '#ffe07a' }),
  abuela: mkChar({ id: 'abuela', name: 'ABUELA', skin: '#b98a62', hair: '#cfcac2', hairStyle: 'bun', dress: '#3f4f7f', jacket: null, shoes: '#2a2a2a', sole: '#111', voice: 470, b: { s: 1.06, sw: 13, hw: 13 }, seed: 51, color: '#c9b0ff', brow: '#8a847a' }),
  fumeta: mkChar({ id: 'fumeta', name: 'EL FUMETA', skin: '#c9a27e', hair: '#3b2a1c', hairStyle: 'beanie', cap: '#2e7d4f', cap2: '#e0c341', jacket: '#6d7f2a', shirt: '#56651f', hood: true, pants: '#7b7c85', shoes: '#2a2a2e', sole: '#555', acc: ['cigarette'], expr: 'sleepy', voice: 200, b: { sw: 12, hw: 10, tw: 6, shw: 5, uw: 5, fw: 4 }, seed: 61, color: '#9fdc5a' }),
  latero: mkChar({ id: 'latero', name: 'EL LATERO', skin: '#7a4a2e', hair: '#111', hairStyle: 'buzz', beard: 'stubble', shirt: '#e8c43c', pants: '#3b4252', shoes: '#d8d8d8', acc: ['bag'], voice: 260, seed: 71, color: '#ffd84a' }),
  carterista: mkChar({ id: 'carterista', name: 'LA CARTERISTA', skin: '#dcae84', hair: '#4a2616', hairStyle: 'ponytail', tie: '#ffd84a', shirt: '#d8437a', sleeve: 'none', pants: '#44679e', shorts: true, shoes: '#f0f0f0', acc: ['glassesHead', 'crossbag', 'earring'], voice: 560, b: { s: 1.18, sw: 12, hw: 12, torso: 18, tw: 6, shw: 5, uw: 5, fw: 4, fist: 4 }, seed: 81, color: '#ff6fa8' }),
  relojero: mkChar({ id: 'relojero', name: 'EL RELOJERO', skin: '#c48b5a', hair: '#15110f', hairStyle: 'capBack', cap: '#1b1b1f', jacket: '#1d1d26', shirt: '#2a2a36', stripe: '#e8e8e8', pants: '#1d1d26', shoes: '#f2f2f2', beard: 'goatee', acc: ['watches', 'chain'], voice: 280, seed: 91, color: '#f2c14e' }),
  capo: mkChar({ id: 'capo', name: 'EL BRAYAN', skin: '#ae7650', hair: '#17110e', hairStyle: 'curly', beard: 'full', jacket: '#7a2432', shirt: '#b9b9bd', pants: '#26262c', shoes: '#eeeeee', acc: ['chain'], voice: 170, b: { s: 1.3, sw: 17, hw: 13, tw: 8, shw: 7, uw: 7, fw: 6, fist: 6, belly: 1 }, seed: 101, color: '#ff4a4a' }),
  host: mkChar({ id: 'host', name: 'JORDI', skin: '#e2b894', hair: '#6b4a2a', hairStyle: 'short', beard: 'stubble', shirt: '#e8e2d0', pants: '#6a7a4a', voice: 380, seed: 111 }),
};
// random crowd / pedestrians
const SKINS = ['#f0c8a0', '#e0b088', '#c99064', '#b07850', '#8a5a3a', '#6a4028', '#d8a878', '#a06a44'];
const HAIRS = ['#1a1311', '#2a1b14', '#4a2616', '#6b4a2a', '#a07040', '#d8b060', '#111', '#8a8a8a', '#c04a2a'];
const SHIRTS = ['#e8e2d0', '#2a2a36', '#c0392b', '#2e86de', '#f2c14e', '#27ae60', '#8e44ad', '#e67e22', '#ecf0f1', '#16a085', '#d35480', '#34495e', '#7f8c8d'];
const PANTS = ['#2c55a8', '#26262c', '#5d5d66', '#3b4252', '#7a6a50', '#4a6fa5', '#2a3a2a', '#8a7a6a'];
const STYLES = ['short', 'curly', 'buzz', 'cap', 'capBack', 'ponytail', 'long', 'bun', 'slick', 'bald', 'beanie'];
function randomNPC(R, o = {}) {
  const hs = R.p(STYLES), fem = hs === 'ponytail' || hs === 'long' || hs === 'bun';
  const d = mkChar(Object.assign({
    name: 'VECINO', skin: R.p(SKINS), hair: R.p(HAIRS), hairStyle: hs, cap: R.p(SHIRTS), shirt: R.p(SHIRTS), pants: R.p(PANTS), shorts: R() < .25,
    sleeve: R() < .7 ? 'short' : 'long', jacket: R() < .18 ? R.p(['#3a3a4a', '#6a2a2a', '#2a4a3a', '#8a6a3a']) : null,
    beard: !fem && R() < .3 ? R.p(['full', 'stubble', 'mustache', 'goatee']) : null, shoes: R.p(['#eee', '#222', '#8a5a3a', '#c0392b']), sole: '#777',
    acc: [R() < .15 ? 'sunglasses' : null, R() < .12 ? 'backpack' : null, fem && R() < .4 ? 'earring' : null].filter(Boolean), pack: R.p(SHIRTS),
    dress: fem && R() < .3 ? R.p(['#b8324a', '#2e86de', '#f2c14e', '#27ae60', '#e8e2d0']) : null,
    seed: R.i(1, 99999), b: { s: R.r(.9, 1.0), sw: R.i(11, 13), hw: R.i(10, 12), tw: 6, shw: 5, uw: 5, fw: 4, fist: 4, belly: R() < .2 ? 2 : 0 }
  }, o));
  return d;
}
function tintDef(def, tint, amt) {
  const t = c => c ? mix(c, mulc(c, tint), amt) : c;
  const d = Object.assign({}, def, { id: def.id + '_t' + tint + amt });
  for (const k of ['skin', 'hair', 'shirt', 'jacket', 'pants', 'shoes', 'sole', 'dress', 'cap', 'cap2', 'stripe', 'pack']) if (d[k]) d[k] = t(d[k]);
  return d;
}

// ---------- small pixel sprites (pigeon, dog, suitcase, chancla, can ...) ----------
function gridFrom(rows, pal) { const G = new PGrid(rows[0].length, rows.length); rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) G.set(x, y, pal[ch]); })); return G; }
const SMALL = {};
(function buildSmall() {
  const pp = { g: '#8a8a96', d: '#5a5a66', w: '#c8c8d0', o: '#f0a030', k: '#1a1414', p: '#9a6aa0', n: '#6a8a70' };
  SMALL.pigeon = [
    gridFrom(['..dd..', '.gkgd.', 'ogggggd', '..nggggd', '...wggd.', '....o.o.'], pp).canvas(),
    gridFrom(['......', '..dd..', '.gkgd.', 'ogggggd', '..ngggd', '...o.o.'], pp).canvas(),
    gridFrom(['d.....d', 'gd...dg', '.gdddg.', '..gkg..', '..ggg..', '...o...'], pp).canvas(),
    gridFrom(['.......', '..dkd..', 'dggggdd', 'gd.o.dg', '.......', '.......'], pp).canvas(),
  ];
  const dp = { b: '#8a5a32', d: '#5a3a1e', l: '#c08a52', k: '#1a1010', w: '#f0e8e0', r: '#c83a4a' };
  SMALL.dog = [
    gridFrom(['.........dd.', 'd.......dbbd', 'bd......bbkb', '.bbbbbbbbbbd', '.bbllllbbbd.', '.bdb..bdbd..', '.bd...bd....'], dp).canvas(),
    gridFrom(['.........dd.', '........dbbd', 'dd......bbkb', '.bbbbbbbbbbd', '.bbllllbbbd.', '.bdb..bdbd..', '.bd...bd....'], dp).canvas(),
  ];
  const sp = { r: '#b8323c', d: '#7a1a24', l: '#e0606a', k: '#1a1414', s: '#9aa0a8', g: '#555' };
  SMALL.suitcase = gridFrom(['...ss...', '...s.s..', '.dddddd.', 'drrrrrrd', 'drlrrlrd', 'drrrrrrd', 'drlrrlrd', 'drrrrrrd', 'drlrrlrd', 'drrrrrrd', 'drrrrrrd', '.dddddd.', '.g....g.'], sp).canvas();
  const cp = { b: '#2f7fd1', d: '#1c4f8a', y: '#f2c14e' };
  SMALL.chancla = [
    gridFrom(['.bbbbbb.', 'bbbbbbbb', '.dyyyyd.', '..y..y..'], cp).canvas(),
    gridFrom(['..bb', '.bbb', 'bbby', 'bbby', 'bby.', 'bby.', 'bbb.', '.bb.'], cp).canvas(),
    gridFrom(['..y..y..', '.dyyyyd.', 'bbbbbbbb', '.bbbbbb.'], cp).canvas(),
    gridFrom(['.bb.', 'bbb.', '.ybb', '.ybb', 'ybbb', 'ybbb', 'bbb.', 'bb..'], cp).canvas(),
  ];
  const kp = { r: '#c8323c', s: '#e0e4ea', d: '#8a1a24', w: '#fff' };
  SMALL.can = [
    gridFrom(['ss', 'rr', 'rw', 'rr', 'dd'], kp).canvas(), gridFrom(['srrd', 'srwd'], kp).canvas(),
    gridFrom(['dd', 'rr', 'wr', 'rr', 'ss'], kp).canvas(), gridFrom(['drrs', 'dwrs'], kp).canvas()
  ];
})();

// ---------- Scale2x (EPX) upscaling for big portraits: keeps pixel-art shapes, smooths diagonals ----------
function scale2x(src) {
  const w = src.width, h = src.height, sd = src.getContext('2d').getImageData(0, 0, w, h).data;
  const [c, g] = mk(w * 2, h * 2), out = g.createImageData(w * 2, h * 2), o = out.data;
  const P = (x, y) => ((y < 0 ? 0 : y >= h ? h - 1 : y) * w + (x < 0 ? 0 : x >= w ? w - 1 : x)) * 4;
  const eq = (a, b) => sd[a] === sd[b] && sd[a + 1] === sd[b + 1] && sd[a + 2] === sd[b + 2] && sd[a + 3] === sd[b + 3];
  const put = (x, y, s) => { const d = (y * w * 2 + x) * 4; o[d] = sd[s]; o[d + 1] = sd[s + 1]; o[d + 2] = sd[s + 2]; o[d + 3] = sd[s + 3]; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = P(x, y), A = P(x, y - 1), B = P(x + 1, y), Cc = P(x - 1, y), D = P(x, y + 1);
    let e0 = p, e1 = p, e2 = p, e3 = p;
    if (!eq(A, D) && !eq(Cc, B)) { if (eq(Cc, A)) e0 = A; if (eq(A, B)) e1 = B; if (eq(Cc, D)) e2 = Cc; if (eq(D, B)) e3 = D; }
    put(x * 2, y * 2, e0); put(x * 2 + 1, y * 2, e1); put(x * 2, y * 2 + 1, e2); put(x * 2 + 1, y * 2 + 1, e3);
  }
  g.putImageData(out, 0, 0); return c;
}
const _portHi = new Map();
function portraitHi(def, expr = 'normal', lvl = 1) {
  const key = def.id + '|' + expr + '|' + lvl; let c = _portHi.get(key); if (c) return c;
  c = portraitCanvas(def, expr); for (let i = 0; i < lvl; i++) c = scale2x(c);
  _portHi.set(key, c); return c;
}
