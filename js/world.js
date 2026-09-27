'use strict';
// ============================================================
//  WORLD — procedural Raval street stages (parallax layers,
//  perspective floor, crowd, pigeons, weather) + cutscene art
// ============================================================
const WORLD_W = 1200;
const HORIZON = 150;
const floorF = y => 0.55 + (y - HORIZON) / (GROUND - HORIZON) * 0.45;
const CROWD_Y = 165, CROWD_F = floorF(CROWD_Y);
const projX = (wx, f, camX) => (wx - camX - W / 2) * f + W / 2;
const layerW = f => Math.ceil((WORLD_W - W) * f + W + 24);

const TOD = {
  afternoon: { sky: ['#6fa3dc', '#8db8e4', '#b8d4ec', '#f3e0b8', '#f8cf8a'], walls: ['#d9a45f', '#c98a4f', '#e2b777', '#b8763f', '#d69c6a', '#cfa77a', '#c9b08a', '#e0c090', '#d4886a'], floor: ['#b9a78f', '#aa977f', '#6e5e52'], haze: '#ecdcc0', tint: null, sun: 1 },
  sunset: { sky: ['#2e2e6a', '#5a3478', '#a8487a', '#e8705e', '#ffb468'], walls: ['#d9a45f', '#c98a4f', '#e2b777', '#c07a50', '#d69c6a', '#e0a880', '#d4886a'], floor: ['#b0907e', '#9c7e6c', '#5e4a44'], haze: '#f0a080', tint: '#ffb89a', amt: .45, sun: 2 },
  dusk: { sky: ['#141a40', '#2a2a5e', '#58387a', '#a8507a', '#e89070'], walls: ['#d9a45f', '#c98a4f', '#e2b777', '#cfa77a', '#e8e0d0', '#d69c6a'], floor: ['#8e8498', '#7e7490', '#48405a'], haze: '#8a7aa0', tint: '#9a8ad0', amt: .7, sun: 0 },
  night: { sky: ['#05071a', '#090d28', '#11173c', '#1c2450'], walls: ['#d9a45f', '#c98a4f', '#e2b777', '#b8763f', '#d69c6a', '#cfa77a'], floor: ['#4c4c66', '#42425c', '#24243a'], haze: '#262a50', tint: '#4a58a8', amt: .82, sun: 0, stars: 1 },
  rain: { sky: ['#04050c', '#080a18', '#0e1228', '#161c36'], walls: ['#c9945f', '#b98a4f', '#d2a777', '#a8763f', '#c69c6a'], floor: ['#3c4058', '#363a52', '#1c1e30'], haze: '#1e2240', tint: '#3e4a86', amt: .86, sun: 0 },
};

// ---------- sky ----------
function buildSky(pal, R) {
  const [c, g] = mk(W, HORIZON);
  const cols = pal.sky.map(rgb), n = cols.length;
  pixels(c, (p, w, h) => {
    for (let y = 0; y < h; y++) {
      const f = y / (h - 1) * (n - 1), i = Math.floor(f), fr = f - i;
      for (let x = 0; x < w; x++) {
        const cc = fr > bay(x, y) ? cols[Math.min(n - 1, i + 1)] : cols[i]; const o = (y * w + x) * 4;
        p[o] = cc[0]; p[o + 1] = cc[1]; p[o + 2] = cc[2]; p[o + 3] = 255;
      }
    }
  });
  if (pal.stars) for (let i = 0; i < 70; i++) { g.fillStyle = R() < .2 ? '#fff' : '#8a90c0'; g.fillRect(R.i(0, W), R.i(0, 90), 1, 1); }
  if (pal.stars) { g.drawImage(glowSprite(14, '#c8d0ff', .5), 300, 8); g.fillStyle = '#f4f0d8'; stamp(g, 314, 22, 9, '#f4f0d8'); stamp(g, 311, 20, 3, '#d8d4c0'); stamp(g, 316, 25, 2, '#d8d4c0'); }
  if (pal.sun === 2) { g.drawImage(glowSprite(40, '#ffd890', .8), 160, 70); stamp(g, 200, 110, 22, '#ffe6a8'); stamp(g, 200, 110, 18, '#fff4d0'); }
  // clouds
  const cloudC = pal.sun === 1 ? ['#ffffff', '#e8eef8', '#c8d8ea'] : pal.sun === 2 ? ['#ffd0a0', '#f09a80', '#b8607a'] : pal.stars ? ['#1c2248', '#161c3c', '#10142e'] : ['#e8a0a0', '#b87090', '#7a4a78'];
  for (let i = 0; i < 6; i++) {
    const cx = R.i(0, W), cy = R.i(10, 70), n2 = R.i(4, 7);
    for (let j = 0; j < n2; j++) { const x = cx + j * 7 - n2 * 3, r = R.i(4, 8); stamp(g, x, cy + 2, r * 2, cloudC[2]); }
    for (let j = 0; j < n2; j++) { const x = cx + j * 7 - n2 * 3, r = R.i(3, 7); stamp(g, x, cy, r * 2, cloudC[1]); stamp(g, x - 1, cy - 2, r * 1.4, cloudC[0]); }
  }
  return c;
}
// ---------- far rooftops ----------
function buildFar(pal, R) {
  const w = layerW(0.2), [c, g] = mk(w, HORIZON);
  const hz = pal.haze, col = mix(pal.sky[pal.sky.length - 1], hz, .5), col2 = dk(col, .88);
  let x = 0;
  while (x < w) {
    const bw = R.i(20, 50), top = R.i(20, 70);
    g.fillStyle = R() < .5 ? col : col2; g.fillRect(x, top, bw, HORIZON - top);
    g.fillStyle = dk(col, .82);
    for (let yy = top + 5; yy < HORIZON - 10; yy += 8) for (let xx = x + 3; xx < x + bw - 3; xx += 6) if (R() < .5) g.fillRect(xx, yy, 2, 3);
    if (R() < .4) { g.fillRect(x + R.i(2, bw - 6), top - 6, 3, 6); }
    if (R() < .25) { g.fillRect(x + 4, top - 10, 10, 10); g.fillRect(x + 3, top - 11, 12, 2); }
    if (R() < .15) { const tx = x + bw / 2; g.fillStyle = col2; g.fillRect(tx - 5, top - 34, 10, 34); polyFill(g, [pt(tx - 6, top - 34), pt(tx + 6, top - 34), pt(tx, top - 46)], col2); }
    x += bw;
  }
  if (pal.tint) tintCanvas(c, pal.tint, pal.amt * .6);
  return c;
}

// ---------- facades ----------
const SIGNS = {
  hospital: ['FRUTAS', 'KEBAB', 'LOCUTORIO', 'VILA', 'BAZAR', 'PAN', 'HOSTAL', 'MOVILES', 'CAFE', 'HALAL', 'PELUQUERIA'],
  rambla: ['BAR', 'TAPAS', 'KEBAB', 'CAFE', 'FRUTAS', 'HOTEL', 'SUPER'],
  macba: ['SKATE', 'CAFE', 'LLIBRES', 'ART', 'BAR'],
  joaquin: ['BAR', 'COCKTAILS', 'COPAS', 'PUB', 'TAPAS', 'BODEGA', 'VERMUT'],
  riera: ['VINTAGE', 'DISCOS', 'ROPA', 'TATTOO', 'CAFE', 'ARTE', 'RETRO'],
};
const SHUTTER = ['#3f6b4a', '#4a7a52', '#6b4a2e', '#5a6a78', '#2f5a52', '#7a5a3a'];
function graffiti(g, x, y, w, h, R) {
  const cols = ['#ff4fa3', '#4ff0ff', '#ffe14f', '#8fff4f', '#ffffff', '#ff7a2a', '#b06aff'];
  const n = R.i(1, 3);
  for (let i = 0; i < n; i++) {
    const c = R.p(cols), bx = x + R.i(0, Math.max(1, w - 18)), by = y + R.i(2, Math.max(3, h - 12)), letters = R.i(2, 4);
    for (let j = 0; j < letters; j++) { const lx = bx + j * 6, lh = R.i(7, 10); g.fillStyle = OUTL; g.fillRect(lx - 1, by - 1, 7, lh + 2); }
    for (let j = 0; j < letters; j++) { const lx = bx + j * 6, lh = R.i(7, 10); g.fillStyle = c; g.fillRect(lx, by, 5, lh); g.fillStyle = lt(c, .5); g.fillRect(lx + 1, by + 1, 1, lh - 3); g.fillStyle = dk(c, .6); g.fillRect(lx, by + lh - 2, 5, 1); if (R() < .5) { g.fillStyle = OUTL; g.fillRect(lx + 2, by + 3, 1, 2); } }
  }
  g.fillStyle = R() < .5 ? '#111' : '#fff';
  for (let i = 0; i < 3; i++) { let px = x + R.i(0, w), py = y + R.i(0, h); for (let k = 0; k < 8; k++) { g.fillRect(px, py, 1, 1); px += R.i(-1, 1); py += R.i(-1, 1); } }
}
function drawWindow(g, x, y, R, pal, emis, night) {
  const wall = g._wall;
  g.fillStyle = lt(wall, .22); g.fillRect(x - 1, y - 2, 10, 17);
  g.fillStyle = dk(wall, .6); g.fillRect(x - 1, y + 15, 10, 1);
  const r = R(), sc = R.p(SHUTTER);
  if (r < .42) {
    g.fillStyle = sc; g.fillRect(x, y, 8, 14); g.fillStyle = dk(sc, .7);
    for (let yy = y + 1; yy < y + 14; yy += 2) g.fillRect(x, yy, 8, 1);
    g.fillRect(x + 4, y, 1, 14);
  } else {
    const lit = night && R() < .45;
    const inC = lit ? R.p(['#ffd27a', '#ffc860', '#ffe0a0', '#a0c8ff']) : '#2a1d24';
    g.fillStyle = '#1e141a'; g.fillRect(x, y, 8, 14);
    if (lit) emis.push(gg => { gg.fillStyle = inC; gg.fillRect(x + 1, y + 1, 6, 13); gg.fillStyle = dk(inC, .75); gg.fillRect(x + 4, y + 1, 1, 13); gg.fillRect(x + 1, y + 6, 6, 1); if (R() < .3) { gg.fillStyle = '#3a2a30'; gg.fillRect(x + 2, y + 7, 2, 7); gg.fillRect(x + 2, y + 5, 2, 2); } });
    else { g.fillStyle = '#35262e'; g.fillRect(x + 1, y + 1, 6, 13); g.fillStyle = '#4a3a44'; g.fillRect(x + 1, y + 1, 1, 13); if (R() < .4) { g.fillStyle = R.p(['#e8e0d0', '#c0b0a0', '#d0a0a0']); g.fillRect(x + 1, y + 1, 2, 12); } }
    g.fillStyle = sc; g.fillRect(x - 3, y, 2, 14); g.fillRect(x + 9, y, 2, 14);
    g.fillStyle = dk(sc, .7); for (let yy = y + 1; yy < y + 14; yy += 2) { g.fillRect(x - 3, yy, 2, 1); g.fillRect(x + 9, yy, 2, 1); }
    if (r > .85) { g.fillStyle = sc; g.fillRect(x, y, 8, 6); g.fillStyle = dk(sc, .7); for (let yy = y + 1; yy < y + 6; yy += 2) g.fillRect(x, yy, 8, 1); }
  }
  // balcony
  if (R() < .72) {
    const by = y + 15;
    g.fillStyle = lt(wall, .1); g.fillRect(x - 4, by, 16, 2); g.fillStyle = dk(wall, .55); g.fillRect(x - 4, by + 2, 16, 1); g.fillRect(x - 3, by + 3, 1, 1); g.fillRect(x + 10, by + 3, 1, 1);
    const rc = '#241c22';
    g.fillStyle = rc; g.fillRect(x - 4, by - 7, 16, 1);
    for (let xx = x - 4; xx < x + 12; xx += 2) g.fillRect(xx, by - 7, 1, 7);
    g.fillRect(x - 4, by - 2, 16, 1);
    if (R() < .55) { // plants
      const px = x - 3 + R.i(0, 9);
      g.fillStyle = '#a8502a'; g.fillRect(px, by - 4, 4, 3); g.fillStyle = '#7a3a1e'; g.fillRect(px, by - 2, 4, 1);
      const gc = R.p(['#3f8a3a', '#2e6a2e', '#5aa04a']);
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? gc : dk(gc, .75); g.fillRect(px - 2 + R.i(0, 6), by - 9 + R.i(0, 5), 2, 2); }
      if (R() < .6) { g.fillStyle = R.p(['#e8465a', '#ff8ab0', '#ffe14f', '#fff']); g.fillRect(px + R.i(-1, 4), by - 9 + R.i(0, 3), 1, 1); g.fillRect(px + R.i(-1, 4), by - 8 + R.i(0, 3), 1, 1); }
      if (R() < .35) { for (let i = 0; i < R.i(4, 10); i++) { g.fillStyle = dk(gc, .8); g.fillRect(px + R.i(-3, 6), by + i, 1, 1); } }
    }
    if (R() < .25) { // laundry on railing
      for (let i = 0; i < R.i(1, 3); i++) { const lx = x - 3 + i * 5; g.fillStyle = OUTL; g.fillRect(lx - 1, by - 7, 5, 7); g.fillStyle = R.p(['#fff', '#e8465a', '#2e86de', '#f2c14e', '#8e44ad', '#27ae60']); g.fillRect(lx, by - 7, 3, 6); }
    }
    if (R() < .07) { // senyera
      g.fillStyle = OUTL; g.fillRect(x - 1, by, 10, 13); g.fillStyle = '#f5c518'; g.fillRect(x, by, 8, 12); g.fillStyle = '#d0202a'; for (let i = 1; i < 8; i += 2) g.fillRect(x + i, by, 1, 12);
    } else if (R() < .06) { // estelada-free: just a colourful towel
      g.fillStyle = R.p(['#2e86de', '#e67e22', '#16a085']); g.fillRect(x, by, 8, 9); g.fillStyle = '#fff'; g.fillRect(x, by + 3, 8, 1);
    }
  }
  if (R() < .1) { g.fillStyle = OUTL; g.fillRect(x + 11, y + 5, 8, 6); g.fillStyle = '#b8bcc4'; g.fillRect(x + 12, y + 6, 6, 4); g.fillStyle = '#7a7e86'; for (let i = 0; i < 3; i++) g.fillRect(x + 13 + i * 2, y + 7, 1, 2); }
}
function drawGroundUnit(g, x, y, w, h, R, theme, emis, night, dyn) {
  const wall = g._wall;
  const types = theme === 'joaquin' ? ['bar', 'bar', 'shop', 'shutter', 'door'] : theme === 'riera' ? ['shop', 'shop', 'shutter', 'door', 'bar'] : ['shutter', 'shutter', 'shop', 'shop', 'door', 'bar'];
  const ty = R.p(types);
  g.fillStyle = dk(wall, .5); g.fillRect(x - 1, y - 1, w + 2, h + 1);
  if (ty === 'shutter') {
    g.fillStyle = '#8a8e96'; g.fillRect(x, y, w, h);
    for (let yy = y + 1; yy < y + h; yy += 2) { g.fillStyle = yy % 4 ? '#767a82' : '#9a9ea6'; g.fillRect(x, yy, w, 1); }
    g.fillStyle = '#5a5e66'; g.fillRect(x, y, w, 2); g.fillRect(x + w / 2 - 2, y + h - 3, 4, 1);
    graffiti(g, x + 1, y + 2, w - 2, h - 4, R);
    for (let i = 0; i < w; i++) if (R() < .3) { g.fillStyle = 'rgba(40,30,20,.35)'; g.fillRect(x + i, y + h - R.i(1, 5), 1, 5); }
  } else if (ty === 'door') {
    const dc = R.p(['#5a3a24', '#3a2a1e', '#2a3a4a', '#6a2a2a']);
    g.fillStyle = dc; g.fillRect(x + 2, y + 2, Math.min(w - 4, 18), h - 2);
    g.fillStyle = dk(dc, .7); g.fillRect(x + 3, y + 4, 7, 10); g.fillRect(x + 11, y + 4, Math.min(7, w - 15), 10); g.fillRect(x + 3, y + 17, 7, 10); g.fillRect(x + 11, y + 17, Math.min(7, w - 15), 10);
    g.fillStyle = '#d8b050'; g.fillRect(x + 10, y + 16, 1, 2);
    g.fillStyle = '#e8e0d0'; g.fillRect(x + 6, y - 5, 7, 4); tiny(g, R.i(1, 60), x + 7, y - 5, '#223', 1);
    if (w > 26) { g.fillStyle = '#8a8e96'; g.fillRect(x + 22, y, w - 22, h); for (let yy = y + 1; yy < y + h; yy += 2) { g.fillStyle = '#767a82'; g.fillRect(x + 22, yy, w - 22, 1); } graffiti(g, x + 22, y + 2, w - 24, h - 4, R); }
  } else {
    const isBar = ty === 'bar';
    const sign = R.p(SIGNS[theme] || SIGNS.hospital), sw = Math.min(w, tinyW(sign) + 6);
    // interior
    const inC = isBar ? '#3a2418' : '#2b2024';
    g.fillStyle = inC; g.fillRect(x, y + 8, w, h - 8);
    if (night || isBar) emis.push(gg => { gg.fillStyle = isBar ? '#e8a050' : '#f0d8a0'; gg.fillRect(x + 1, y + 9, w - 2, h - 10); gg.fillStyle = isBar ? '#b86a30' : '#c0a878'; for (let i = x + 3; i < x + w - 3; i += 6) gg.fillRect(i, y + h - 8, 3, 7); gg.fillStyle = '#5a3020'; gg.fillRect(x + 1, y + h - 3, w - 2, 2); for (let i = 0; i < 3; i++) { gg.fillStyle = '#3a2020'; const px = x + 4 + R.i(0, Math.max(1, w - 10)); gg.fillRect(px, y + h - 12, 3, 9); gg.fillRect(px, y + h - 14, 3, 2); } });
    else { g.fillStyle = '#4a3a3e'; for (let i = x + 2; i < x + w - 2; i += 5) g.fillRect(i, y + 12, 3, 2); for (let i = x + 2; i < x + w - 2; i += 5) g.fillRect(i, y + 18, 3, 2); }
    g.fillStyle = '#5a4a44'; g.fillRect(x, y + 8, 1, h - 8); g.fillRect(x + w - 1, y + 8, 1, h - 8); g.fillRect(x + Math.floor(w / 2), y + 8, 1, h - 8);
    // sign board
    const bc = R.p(['#c0392b', '#2e5a8a', '#27ae60', '#f2c14e', '#e8e0d0', '#2a2a36', '#8e44ad']);
    g.fillStyle = OUTL; g.fillRect(x + (w - sw) / 2 - 1, y - 1, sw + 2, 9);
    g.fillStyle = bc; g.fillRect(x + (w - sw) / 2, y, sw, 7);
    const tc = rgb(bc)[0] + rgb(bc)[1] > 380 ? '#2a1a14' : '#fff';
    tiny(g, sign, Math.round(x + (w - tinyW(sign)) / 2), y + 1, tc);
    if (isBar && (night)) dyn.push({ type: 'neon', x: x + w / 2, y: y + 3, col: R.p(['#ff4fa3', '#4ff0ff', '#ffe14f', '#ff5a3a']), text: sign, ph: R() * 6 });
    // awning
    if (R() < .6 && !isBar) {
      const ac = R.p(['#c0392b', '#27ae60', '#2e5a8a', '#e67e22']);
      for (let i = 0; i < w; i++) { g.fillStyle = (Math.floor(i / 3) % 2) ? ac : '#f0e8d8'; g.fillRect(x + i, y + 8, 1, 4); }
      g.fillStyle = dk(ac, .6); for (let i = 0; i < w; i += 3) g.fillRect(x + i, y + 12, 2, 1);
    }
    // fruit crates on sidewalk
    if (sign === 'FRUTAS' || sign === 'SUPER') {
      for (let i = 0; i < 3; i++) { const cx = x + 2 + i * 9; g.fillStyle = '#8a5a2a'; g.fillRect(cx, y + h - 6, 8, 6); g.fillStyle = '#6a3a1a'; g.fillRect(cx, y + h - 3, 8, 1); const fc = ['#e8465a', '#ffa030', '#8fcf3a', '#ffe14f'][i % 4]; for (let j = 0; j < 4; j++) { g.fillStyle = fc; g.fillRect(cx + 1 + j * 2, y + h - 8, 2, 2); } }
    }
  }
}
function drawBuilding(g, x0, bw, R, pal, emis, dyn, theme, night) {
  const top = R() < .18 ? R.i(34, 50) : R.i(2, 30), GF = 112;
  const wc = R.p(pal.walls); g._wall = wc;
  const wd = dk(wc, .84), wl = lt(wc, .12);
  g.fillStyle = wc; g.fillRect(x0, top, bw, HORIZON - top);
  for (let i = 0; i < bw * (HORIZON - top) * 0.05; i++) { g.fillStyle = R() < .5 ? wd : wl; g.fillRect(x0 + R.i(0, bw - 1), R.i(top, HORIZON - 1), 1, 1); }
  // peeling plaster patches
  for (let i = 0; i < R.i(0, 3); i++) { const px = x0 + R.i(4, bw - 14), py = R.i(top + 10, GF - 10), pw = R.i(5, 12), ph = R.i(3, 7); g.fillStyle = '#b89070'; g.fillRect(px, py, pw, ph); g.fillStyle = '#9a6a50'; for (let k = 0; k < pw; k += 2) g.fillRect(px + k, py + (k % 4 ? 1 : 3), 2, 1); }
  // grime streaks
  g.fillStyle = 'rgba(40,24,20,.12)'; for (let i = 0; i < 6; i++) { const sx = x0 + R.i(0, bw); g.fillRect(sx, top + 4, 1, R.i(10, 60)); }
  g.fillStyle = dk(wc, .62); g.fillRect(x0, top, 1, HORIZON - top);
  if (R() < .5) { g.fillStyle = '#6a6e76'; g.fillRect(x0 + 2, top + 4, 2, GF - top); g.fillStyle = '#8a8e96'; g.fillRect(x0 + 2, top + 4, 1, GF - top); for (let yy = top + 10; yy < GF; yy += 24) g.fillRect(x0 + 1, yy, 4, 1); }
  // cornice & roof
  g.fillStyle = wl; g.fillRect(x0, top, bw, 3); g.fillStyle = lt(wc, .3); g.fillRect(x0, top, bw, 1); g.fillStyle = dk(wc, .6); g.fillRect(x0, top + 3, bw, 1);
  if (R() < .5) { g.fillStyle = '#3a3a44'; const ax = x0 + R.i(4, bw - 8); g.fillRect(ax, top - 12, 1, 12); g.fillRect(ax - 4, top - 10, 9, 1); g.fillRect(ax - 3, top - 7, 7, 1); }
  if (R() < .4) { const cx = x0 + R.i(4, bw - 10); g.fillStyle = dk(wc, .75); g.fillRect(cx, top - 7, 5, 7); g.fillStyle = '#6a3a2a'; g.fillRect(cx - 1, top - 8, 7, 2); }
  if (R() < .3) { const sx = x0 + R.i(4, bw - 12); g.fillStyle = '#c8ccd4'; stamp(g, sx + 4, top - 5, 8, '#b8bcc4'); g.fillStyle = '#6a6e76'; g.fillRect(sx + 4, top - 2, 1, 3); }
  // upper floors
  const nw = Math.max(1, Math.floor((bw - 6) / 22)), sp = bw / nw;
  for (let fy = GF - 24; fy > top + 6; fy -= 24) {
    g.fillStyle = wd; g.fillRect(x0, fy + 22, bw, 1);
    for (let i = 0; i < nw; i++) drawWindow(g, Math.round(x0 + sp * (i + .5) - 4), fy + 4, R, pal, emis, night);
  }
  // clothesline strung along the facade, anchored to wall hooks under a balcony
  const floors = []; for (let fy = GF - 72; fy > top + 6; fy -= 24) floors.push(fy);
  if (floors.length && R() < .6 && bw > 50) {
    const fy = R.p(floors), len = bw - 10, items = [];
    for (let i = 5; i < len - 5; i += R.i(6, 10)) items.push({ u: i / len, kind: R.p(['shirt', 'shirt', 'pants', 'towel', 'sock', 'dress']), col: R.p(['#f4f0e8', '#e8465a', '#2e86de', '#f2c14e', '#8e44ad', '#27ae60', '#ff8ab0', '#34495e', '#e67e22', '#9ad0ec']), ph: R() * 6 });
    dyn.push({ type: 'line', x: x0 + 5, len, y0: fy + 23, sag: R.i(2, 4), items });
  }
  // ground floor plinth
  g.fillStyle = dk(wc, .72); g.fillRect(x0, GF, bw, HORIZON - GF);
  for (let i = 0; i < bw * 38 * .06; i++) { g.fillStyle = dk(wc, R() < .5 ? .66 : .78); g.fillRect(x0 + R.i(0, bw - 1), R.i(GF, HORIZON - 1), 1, 1); }
  g.fillStyle = dk(wc, .55); g.fillRect(x0, GF, bw, 2);
  const nOpen = bw > 84 ? 2 : 1, uw = Math.floor(bw / nOpen);
  for (let i = 0; i < nOpen; i++) drawGroundUnit(g, x0 + 5 + i * uw, GF + 6, uw - 10, HORIZON - GF - 6, R, theme, emis, night, dyn);
  // wall lantern
  if (R() < .45) {
    const lx = x0 + bw - 3;
    g.fillStyle = '#1e1a1e'; g.fillRect(lx - 6, 98, 7, 1); g.fillRect(lx - 1, 96, 1, 4); g.fillRect(lx - 8, 99, 5, 1);
    g.fillRect(lx - 9, 100, 7, 8); g.fillStyle = night ? '#ffe0a0' : '#d8d0b8'; g.fillRect(lx - 8, 101, 5, 6); g.fillStyle = '#1e1a1e'; g.fillRect(lx - 6, 101, 1, 6); g.fillRect(lx - 10, 99, 9, 1);
    if (night) { emis.push(gg => { gg.fillStyle = '#fff0c0'; gg.fillRect(lx - 8, 101, 5, 6); gg.fillStyle = '#1e1a1e'; gg.fillRect(lx - 6, 101, 1, 6); }); dyn.push({ type: 'lamp', x: lx - 6, y: 104 }); }
  }
}

// ---------- special landmarks ----------
function drawMacba(g, x0, w, R, night, emis) {
  const top = 22;
  g.fillStyle = '#ecebe6'; g.fillRect(x0, top, w, HORIZON - top);
  g.fillStyle = '#d8d6d0'; for (let i = 0; i < w * 100 * .03; i++) g.fillRect(x0 + R.i(0, w), R.i(top, HORIZON), 1, 1);
  g.fillStyle = '#c8c6c0'; g.fillRect(x0, top, w, 2);
  // glass curtain with ramps
  const gx = x0 + 30, gw = w - 60;
  g.fillStyle = '#3a4a5e'; g.fillRect(gx, top + 16, gw, HORIZON - top - 30);
  for (let i = 0; i < gw; i += 12) { g.fillStyle = '#e8e6e0'; g.fillRect(gx + i, top + 16, 2, HORIZON - top - 30); }
  for (let yy = top + 20; yy < HORIZON - 16; yy += 18) { g.fillStyle = '#f4f2ee'; g.fillRect(gx, yy + 10, gw, 3); g.fillStyle = '#8a9aaa'; g.fillRect(gx, yy + 13, gw, 1); }
  g.fillStyle = '#6a8aa8'; for (let i = 0; i < 30; i++) { const rx = gx + R.i(0, gw), ry = top + 18 + R.i(0, 80); g.fillRect(rx, ry, R.i(3, 9), 1); }
  // diagonal ramp inside glass
  g.fillStyle = '#d8dce0'; for (let i = 0; i < 70; i++) g.fillRect(gx + 20 + i * 2, top + 90 - i, 6, 2);
  // side block & big letters
  g.fillStyle = '#f6f5f0'; g.fillRect(x0 + w - 28, top - 12, 28, HORIZON - top + 12);
  g.fillStyle = '#d0cec8'; g.fillRect(x0 + w - 28, top - 12, 1, HORIZON - top + 12);
  tiny(g, 'MACBA', x0 + 36, top + 5, '#1a1a1a', 2);
  if (night) emis.push(gg => { gg.fillStyle = '#9ab8e0'; for (let yy = top + 20; yy < HORIZON - 20; yy += 18) for (let i = 0; i < gw - 12; i += 12) if (R() < .5) gg.fillRect(gx + i + 3, yy, 8, 9); });
}
function drawBoteroCat(g, cx, by) {
  const B = '#4e3a28', BL = '#7a5a3a', BD = '#2e2014';
  const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(cx + x, by + y, w, h); };
  // pedestal
  px(-26, -6, 52, 6, '#8a8a8a'); px(-26, -6, 52, 1, '#aaa');
  const G = new PGrid(64, 50);
  for (let y = 0; y < 50; y++) for (let x = 0; x < 64; x++) {
    const bx = (x - 32) / 26, bY = (y - 32) / 16; // body
    const hx = (x - 50) / 10, hY = (y - 18) / 9; // head
    if (bx * bx + bY * bY <= 1 || hx * hx + hY * hY <= 1) G.set(x, y, B);
  }
  for (let y = 2; y < 10; y++) { G.set(44 + (y < 6 ? 0 : 1), y + 4, B); G.set(45, y + 4, B); G.set(55 - (y < 6 ? 0 : 1), y + 4, B); G.set(54, y + 4, B); }
  // tail
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * .9; G.disc(8 - Math.sin(a) * 6, 34 - i * 1.1, 2.4, B); }
  // legs
  for (let y = 40; y < 50; y++) { G.hl(14, 20, y, B); G.hl(40, 46, y, B); G.hl(24, 29, y, B); }
  // shading
  for (let y = 0; y < 50; y++) for (let x = 0; x < 64; x++) { const v = G.get(x, y); if (v) { if (G.get(x - 2, y - 2) === null) G.set(x, y, BL); else if (G.get(x + 2, y + 2) === null) G.set(x, y, BD); } }
  G.set(53, 16, '#1a1008'); G.set(54, 16, '#1a1008'); G.set(58, 19, BD); G.hl(56, 60, 22, BD);
  g.drawImage(G.canvas(), cx - 33, by - 57);
}
function drawPalm(g, x, by, h, R) {
  const tr = '#6a4a2e', trd = '#4a321e';
  for (let y = 0; y < h; y++) { const xx = x + Math.round(Math.sin(y / h * 1.2) * 3); g.fillStyle = y % 4 ? tr : trd; g.fillRect(xx - 2, by - y, 4, 1); }
  const tx = x + Math.round(Math.sin(1.2) * 3), ty = by - h;
  const leaf = ['#3f8a3a', '#2e6a2e', '#5aa04a'];
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI + i / 8 * Math.PI + R.r(-.15, .15), L = R.i(16, 24);
    for (let j = 0; j < L; j++) { const f = j / L; const lx = tx + Math.cos(a) * j, ly = ty + Math.sin(a) * j * .6 + f * f * 10; g.fillStyle = leaf[(i + j) % 3]; g.fillRect(Math.round(lx), Math.round(ly), 2, 2); if (j % 3 === 0) g.fillRect(Math.round(lx), Math.round(ly) + 2, 1, 2); }
  }
  g.fillStyle = '#8a5a2a'; g.fillRect(tx - 2, ty, 4, 3);
}
function drawAirbnbDoor(g, x, R, emis, night) {
  const y = 112;
  g.fillStyle = '#e0cdb0'; g.fillRect(x - 16, y - 2, 34, 40);
  g.fillStyle = '#c0a888'; g.fillRect(x - 16, y - 2, 34, 2);
  // arch door
  g.fillStyle = OUTL; g.fillRect(x - 11, y + 5, 24, 33); g.fillRect(x - 9, y + 3, 20, 2);
  g.fillStyle = '#2e4a3a'; g.fillRect(x - 10, y + 6, 22, 32); g.fillRect(x - 8, y + 4, 18, 2);
  g.fillStyle = '#233a2c'; g.fillRect(x - 8, y + 9, 8, 12); g.fillRect(x + 2, y + 9, 8, 12); g.fillRect(x - 8, y + 24, 8, 12); g.fillRect(x + 2, y + 24, 8, 12);
  g.fillStyle = '#d8b050'; g.fillRect(x + 1, y + 23, 1, 3);
  g.fillStyle = '#2a60b0'; g.fillRect(x - 4, y - 9, 10, 7); tiny(g, '23', x - 2, y - 8, '#fff');
  g.fillStyle = '#2a2a2e'; g.fillRect(x + 14, y + 16, 4, 7); g.fillStyle = '#6aff8a'; g.fillRect(x + 15, y + 17, 2, 1);
  if (night) emis.push(gg => { gg.fillStyle = '#6aff8a'; gg.fillRect(x + 15, y + 17, 2, 1); gg.fillStyle = '#fff0c0'; gg.fillRect(x - 4, y - 9, 10, 1); });
}
function drawMetroSign(g, x) {
  g.fillStyle = '#3a3a44'; g.fillRect(x, 88, 2, 62);
  g.fillStyle = OUTL; polyFill(g, [pt(x + 1, 70), pt(x + 13, 82), pt(x + 1, 94), pt(x - 11, 82)], OUTL);
  polyFill(g, [pt(x + 1, 72), pt(x + 11, 82), pt(x + 1, 92), pt(x - 9, 82)], '#d0202a');
  tiny(g, 'M', x, 80, '#fff');
  g.fillStyle = '#d0202a'; g.fillRect(x - 12, 96, 26, 7); tiny(g, 'LICEU', x - 9, 97, '#fff');
}

// ---------- perspective floor ----------
function buildFloor(pal, R, style) {
  const TW = WORLD_W + 800, TH = H - HORIZON;
  const [c] = mk(TW, TH);
  const C0 = rgb(pal.floor[0]), C1 = rgb(pal.floor[1]), CS = rgb(pal.floor[2]), HZ = rgb(pal.haze);
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const slabW = style === 'plaza' ? 30 : style === 'tiles' ? 16 : 24, slabD = style === 'tiles' ? 0.1 : 0.16;
  const manholes = [], puddles = [];
  for (let i = 0; i < 5; i++) manholes.push({ x: R.i(100, WORLD_W + 500), d: R.r(1.0, 1.5) });
  if (style === 'wet') for (let i = 0; i < 14; i++) puddles.push({ x: R.i(0, TW), d: R.r(.9, 1.7), w: R.i(14, 40), h: R.r(.04, .09) });
  pixels(c, (p, w, h) => {
    for (let r = 0; r < h; r++) {
      const y = HORIZON + r, f = floorF(y + .5), depth = 1 / f, fog = Math.max(0, 1 - r / 45) * .45;
      const prevDepth = 1 / floorF(y - .5), rowIdx = Math.floor(depth / slabD), seamRow = Math.floor(prevDepth / slabD) !== rowIdx;
      const off = (rowIdx % 2) * slabW * .5;
      for (let u = 0; u < w; u++) {
        const wx = u - 400 + off, sIdx = Math.floor(wx / slabW), m = ((wx % slabW) + slabW) % slabW;
        let col;
        const hv = hash(sIdx, rowIdx);
        const base = hv < .5 ? C0 : C1; const v = (hv - .5) * 18;
        col = [base[0] + v, base[1] + v, base[2] + v];
        if (style === 'tiles') { const gl = (Math.sin(wx * .05) + 1) * .5; col = [col[0] + gl * 18, col[1] + gl * 18, col[2] + gl * 20]; }
        const noise = hash(u, r * 7) ; if (noise < .06) col = [col[0] - 14, col[1] - 14, col[2] - 12]; else if (noise > .97) col = [col[0] + 12, col[1] + 12, col[2] + 10];
        if (seamRow || m < 1 / f) col = [CS[0], CS[1], CS[2]];
        // manholes
        for (const mh of manholes) { const dx = (u - mh.x) / 8, dd = (depth - mh.d) / .06; if (dx * dx + dd * dd < 1) { col = (dx * dx + dd * dd > .7) ? [40, 38, 44] : ((Math.floor(u / 2) + r) % 2 ? [70, 66, 72] : [56, 52, 60]); } }
        for (const pd of puddles) { const dx = (u - pd.x) / pd.w, dd = (depth - pd.d) / pd.h; if (dx * dx + dd * dd < 1) { const sh = (Math.sin(u * .3 + r) > .7) ? 40 : 0; col = [60 + sh, 70 + sh, 110 + sh]; } }
        if (hash(u * 3, r) > .9985) col = [230, 225, 215]; // litter / butts
        const o = (r * w + u) * 4;
        p[o] = lerp(col[0], HZ[0], fog); p[o + 1] = lerp(col[1], HZ[1], fog); p[o + 2] = lerp(col[2], HZ[2], fog); p[o + 3] = 255;
      }
    }
  });
  return c;
}
function drawFloor(g, tex, camX) {
  for (let r = 0; r < H - HORIZON; r++) {
    const y = HORIZON + r, f = floorF(y + .5), sw = W / f, sx = camX + W / 2 - sw / 2 + 400;
    g.drawImage(tex, sx, r, sw, 1, 0, y, W, 1);
  }
}

// ============================================================
//  STAGE
// ============================================================
function buildStage(cfg) {
  const R = RNG(cfg.seed || 1234), pal = TOD[cfg.tod], night = ['night', 'rain', 'dusk'].includes(cfg.tod);
  const S = { cfg, pal, night, t: 0, crowd: [], peds: [], pigeons: [], parts: [], dyn: [], fgItems: [], lines: [], cheer: 0, lightning: 0 };
  S.sky = buildSky(pal, R);
  S.far = buildFar(pal, R);
  // facades
  const fw = layerW(0.55), [fc, fg] = mk(fw, HORIZON), emis = [];
  let x = -6;
  const macbaAt = cfg.theme === 'macba' ? 300 : -1;
  while (x < fw) {
    if (macbaAt > 0 && x >= macbaAt && x < macbaAt + 40) { drawMacba(fg, x, 260, R, night, emis); x += 260; continue; }
    const bw = R.i(62, 108); drawBuilding(fg, x, bw, R, pal, emis, S.dyn, cfg.theme, night); x += bw;
  }
  if (cfg.theme === 'hospital') {
    drawMetroSign(fg, 30);
    for (let i = 0; i < 3; i++) S.dyn.push({ type: 'pharmacy', x: 180 + i * 250, y: 100 });
    fg.fillStyle = '#f4f0e6'; fg.fillRect(120, 92, 42, 9); fg.fillStyle = '#a8a090'; fg.fillRect(120, 100, 42, 1); tiny(fg, "C. HOSPITAL", 122, 94, '#1a1a1a');
  }
  if (cfg.theme === 'hospital') {
    // one ordinary balcony (a bit wider door) with the Cuban flag and two neighbours
    const bx = 480, by = 92, px = fg.getImageData(bx - 7, by + 6, 1, 1).data, wall = hex(px[0], px[1], px[2]);
    fg.fillStyle = wall; fg.fillRect(bx - 6, by - 3, 24, 22);
    fg.fillStyle = lt(wall, .22); fg.fillRect(bx - 1, by - 2, 14, 17);
    fg.fillStyle = dk(wall, .6); fg.fillRect(bx - 1, by + 15, 14, 1);
    fg.fillStyle = '#1e141a'; fg.fillRect(bx, by, 12, 15);
    fg.fillStyle = '#35262e'; fg.fillRect(bx + 1, by + 1, 10, 14);
    const sc = '#3f6b4a'; fg.fillStyle = sc; fg.fillRect(bx - 3, by, 2, 14); fg.fillRect(bx + 13, by, 2, 14);
    fg.fillStyle = dk(sc, .7); for (let yy = by + 1; yy < by + 14; yy += 2) { fg.fillRect(bx - 3, yy, 2, 1); fg.fillRect(bx + 13, yy, 2, 1); }
    fg.fillStyle = lt(wall, .1); fg.fillRect(bx - 4, by + 15, 20, 2); fg.fillStyle = dk(wall, .55); fg.fillRect(bx - 4, by + 17, 20, 1); fg.fillRect(bx - 3, by + 18, 1, 1); fg.fillRect(bx + 14, by + 18, 1, 1);
    S.dyn.push({ type: 'cubaBalcony', x: bx, y: by });
  }
  if (cfg.theme === 'riera') drawAirbnbDoor(fg, 560, R, emis, night);
  if (cfg.theme === 'joaquin') { fg.fillStyle = '#f4f0e6'; fg.fillRect(250, 92, 50, 9); tiny(fg, 'C. J. COSTA', 252, 94, '#1a1a1a'); }
  if (cfg.theme === 'riera') { fg.fillStyle = '#f4f0e6'; fg.fillRect(420, 92, 50, 9); tiny(fg, 'RIERA BAIXA', 422, 94, '#1a1a1a'); }
  if (pal.tint) tintCanvas(fc, pal.tint, pal.amt);
  for (const e of emis) e(fg);
  S.fac = fc;
  // mid layer (rambla palms + cat)
  if (cfg.theme === 'rambla') {
    const mw = layerW(0.7), [mc, mg] = mk(mw, HORIZON + 10);
    for (let px = 40; px < mw; px += R.i(90, 130)) drawPalm(mg, px, HORIZON + 8, R.i(70, 95), R);
    drawBoteroCat(mg, 520, HORIZON + 8);
    if (pal.tint) tintCanvas(mc, pal.tint, pal.amt * .8);
    S.mid = mc; S.midF = 0.7;
  }
  // floor
  S.floor = buildFloor(pal, R, cfg.theme === 'macba' ? 'plaza' : cfg.tod === 'rain' ? 'wet' : 'slabs');
  S.lines = S.dyn.filter(d => d.type === 'line');
  // foreground items
  const fgw = layerW(1.3);
  for (let fx = R.i(20, 80); fx < fgw; fx += R.i(150, 260)) S.fgItems.push({ x: fx, type: 'bollard' });
  // crowd around the arena
  const arena = cfg.arena || 700;
  const crowdAnims = ['pockets', 'film', 'stand', 'drink', 'phone', 'pockets', 'film'];
  const nCrowd = cfg.crowd || 9;
  for (let i = 0; i < nCrowd; i++) {
    let def = randomNPC(R);
    def = tintDef(def, pal.tint || '#d8c8b8', pal.tint ? pal.amt * .55 : .35);
    const wx = arena - 330 + i * (660 / nCrowd) + R.i(-14, 14);
    S.crowd.push({ def, wx, anim: R.p(crowdAnims), t0: R.i(0, 200), cheer: 0, y: CROWD_Y + R.i(-3, 2) });
  }
  S.crowd.sort((a, b) => a.y - b.y);
  // pedestrians / skaters
  const nPeds = cfg.theme === 'macba' ? 3 : 2;
  for (let i = 0; i < nPeds; i++) {
    let def = randomNPC(R); def = tintDef(def, pal.tint || '#d8c8b8', pal.tint ? pal.amt * .55 : .35);
    S.peds.push({ def, wx: R.i(0, WORLD_W), v: (R() < .5 ? -1 : 1) * (cfg.theme === 'macba' ? R.r(1.6, 2.2) : R.r(.5, .8)), skate: cfg.theme === 'macba', t0: R.i(0, 100) });
  }
  // pigeons & dog
  for (let i = 0; i < 6; i++) S.pigeons.push({ wx: arena - 200 + R.i(0, 400), y: R.i(168, 176), st: 'peck', t: R.i(0, 60), vx: 0, vy: 0, fx: 0, fy: 0, face: R() < .5 ? 1 : -1 });
  S.dog = { wx: arena + 180 + R.i(-20, 20), y: 168 };
  if (cfg.tod === 'rain') for (let i = 0; i < 140; i++) S.parts.push({ type: 'rain', x: R.i(0, W), y: R.i(0, H), v: R.r(5, 7) });
  return Object.assign(S, StageProto);
}
const StageProto = {
  update() {
    this.t++;
    for (const p of this.peds) { p.wx += p.v; if (p.wx < -100) p.wx = WORLD_W + 100; if (p.wx > WORLD_W + 100) p.wx = -100; }
    for (const c of this.crowd) if (c.cheer > 0) c.cheer--;
    if (this.balc > 0) this.balc--;
    for (const pg of this.pigeons) {
      pg.t++;
      if (pg.st === 'fly') { pg.fx += pg.vx; pg.fy += pg.vy; pg.vy -= 0.03; if (pg.fy < -260) { pg.st = 'gone'; pg.t = 0; } }
      else if (pg.st === 'gone') { if (pg.t > 600) { pg.st = 'peck'; pg.fx = pg.fy = 0; } }
      else if (pg.t % 90 === 0 && Math.random() < .5) pg.face *= -1;
    }
    if (this.cfg.tod === 'rain') {
      for (const r of this.parts) { r.y += r.v; r.x -= r.v * .25; if (r.y > H) { if (Math.random() < .3) this.splash(r.x, rndi(152, 224)); r.y = rnd(-20, 0); r.x = rnd(0, W + 40); } }
      if (this.lightning > 0) this.lightning--; else if (Math.random() < .0025) { this.lightning = 14; sfx('thunder'); }
    }
    this.splashes = (this.splashes || []).filter(s => ++s.t < 8);
  },
  splash(x, y) { (this.splashes = this.splashes || []).push({ x, y, t: 0 }); },
  react(kind, wx) {
    for (const c of this.crowd) if (Math.random() < (kind === 'ko' ? 1 : .35)) c.cheer = kind === 'ko' ? 200 : 60;
    this.balc = Math.max(this.balc || 0, kind === 'ko' ? 220 : 50);
    for (const pg of this.pigeons) if (pg.st === 'peck' && (kind === 'ko' || Math.abs(pg.wx - wx) < 140)) { pg.st = 'fly'; pg.vx = rnd(-1.5, 1.5) + (pg.wx > wx ? 1 : -1); pg.vy = rnd(-2.5, -1.5); pg.t = 0; if (Math.random() < .3) sfx('pigeon'); }
    if (kind === 'ko' && Math.random() < .5) sfx('bark');
  },
  drawBack(g, camX) {
    g.drawImage(this.sky, 0, 0);
    g.drawImage(this.far, -Math.round(camX * 0.2), 0);
    if (this.cfg.tod === 'rain' && this.lightning > 8) { g.fillStyle = '#c8d0ff'; g.globalAlpha = .35; g.fillRect(0, 0, W, HORIZON); g.globalAlpha = 1; }
    const fx = -Math.round(camX * 0.55);
    g.drawImage(this.fac, fx, 0);
    // dynamic facade lights
    for (const d of this.dyn) {
      const sx = d.x + fx; if (sx < -40 || sx > W + 40) continue;
      if (d.type === 'pharmacy') {
        const on = Math.floor(this.t / 20) % 4 !== 3;
        g.fillStyle = OUTL; g.fillRect(sx - 5, d.y - 5, 11, 11);
        g.fillStyle = on ? '#3aff6a' : '#1a6a3a'; g.fillRect(sx - 1, d.y - 4, 3, 9); g.fillRect(sx - 4, d.y - 1, 9, 3);
        if (on) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5; g.drawImage(glowSprite(12, '#3aff6a', .6), sx - 12, d.y - 12); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      }
      if (d.type === 'cubaBalcony') drawCubaBalcony(g, sx, d.y, this.t, this.balc || 0);
      if (d.type === 'lamp') { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55; g.drawImage(glowSprite(18, '#ffc870', .7), sx - 18, d.y - 18); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
      if (d.type === 'neon') {
        const fl = Math.sin(this.t * .07 + d.ph) > -0.9 || Math.random() < .5;
        if (fl) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .6; g.drawImage(glowSprite(16, d.col, .7), sx - 16, d.y - 16); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; tiny(g, d.text, Math.round(sx - tinyW(d.text) / 2), d.y - 2, lt(d.col, .5)); }
      }
    }
    this.drawLines(g, fx);
    if (this.mid) g.drawImage(this.mid, -Math.round(camX * this.midF), 0);
    drawFloor(g, this.floor, camX);
    // light pools on floor at night
    if (this.night) {
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = .22;
      for (const d of this.dyn) if (d.type === 'lamp' || d.type === 'neon') {
        const wx = (d.x - fx) / 0.55; const sx = projX(wx + camX * 0 , floorF(158), camX); void sx;
        const s2 = d.x + fx; g.drawImage(glowSprite(30, d.col || '#ffb860', .8), s2 - 30, 152, 60, 18);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
  },
  drawLines(g, fx) {
    const t = this.t;
    for (const L of this.lines) {
      const x0 = L.x + fx; if (x0 > W + 10 || x0 + L.len < -10) continue;
      const yAt = u => L.y0 + Math.sin(u * Math.PI) * L.sag;
      // wall hooks
      g.fillStyle = '#1a1418'; for (const hx of [x0 - 1, x0 + L.len]) { g.fillRect(Math.round(hx), L.y0 - 2, 2, 3); g.fillRect(Math.round(hx), L.y0 - 3, 1, 1); }
      g.fillStyle = '#3a3238';
      for (let i = 0; i <= L.len; i++) g.fillRect(Math.round(x0 + i), Math.round(yAt(i / L.len)), 1, 1);
      for (const it of L.items) {
        const ix = Math.round(x0 + it.u * L.len), iy = Math.round(yAt(it.u)) + 1, sw = Math.sin(t * .03 + it.ph) > .6 ? 1 : 0;
        const c = this.pal.tint ? mix(it.col, mulc(it.col, this.pal.tint), this.pal.amt * .75) : it.col, cd = dk(c, .75);
        g.fillStyle = OUTL;
        if (it.kind === 'shirt') { g.fillRect(ix - 4, iy - 1, 9, 3); g.fillRect(ix - 2 + sw, iy, 5, 8); g.fillStyle = c; g.fillRect(ix - 3, iy, 7, 1); g.fillRect(ix - 1 + sw, iy, 3, 7); g.fillStyle = cd; g.fillRect(ix - 1 + sw, iy + 5, 3, 2); }
        else if (it.kind === 'pants') { g.fillRect(ix - 3, iy - 1, 7, 10); g.fillStyle = c; g.fillRect(ix - 2 + sw, iy, 2, 8); g.fillRect(ix + 1 + sw, iy, 2, 8); g.fillRect(ix - 2, iy, 5, 2); }
        else if (it.kind === 'towel') { g.fillRect(ix - 3, iy - 1, 7, 9); g.fillStyle = c; g.fillRect(ix - 2 + sw, iy, 5, 7); g.fillStyle = lt(c, .6); g.fillRect(ix - 2 + sw, iy + 5, 5, 1); }
        else if (it.kind === 'dress') { g.fillRect(ix - 2, iy - 1, 5, 6); g.fillRect(ix - 4 + sw, iy + 3, 9, 7); g.fillStyle = c; g.fillRect(ix - 1, iy, 3, 4); g.fillRect(ix - 3 + sw, iy + 4, 7, 5); }
        else { g.fillRect(ix - 1, iy - 1, 3, 6); g.fillStyle = c; g.fillRect(ix + sw * 0, iy, 1, 4); }
        g.fillStyle = '#e8e0c8'; g.fillRect(ix - 1, iy - 2, 1, 1); g.fillRect(ix + 1, iy - 2, 1, 1);
      }
    }
  },
  drawCrowd(g, camX) {
    const t = this.t;
    // pigeons (on the floor)
    for (const pg of this.pigeons) {
      if (pg.st === 'gone') continue;
      const f = floorF(pg.y), sx = projX(pg.wx, f, camX) + pg.fx, sy = pg.y + pg.fy;
      if (sx < -10 || sx > W + 10) continue;
      let fr = pg.st === 'fly' ? 2 + (Math.floor(t / 4) % 2) : (Math.floor((t + pg.wx) / 18) % 5 === 0 ? 1 : 0);
      const im = SMALL.pigeon[fr]; const face = pg.st === 'fly' ? Math.sign(pg.vx) || 1 : pg.face;
      if (face > 0) g.drawImage(im, Math.round(sx), Math.round(sy) - im.height);
      else { g.save(); g.translate(Math.round(sx), 0); g.scale(-1, 1); g.drawImage(im, 0, Math.round(sy) - im.height); g.restore(); }
    }
    // pedestrians behind crowd
    for (const p of this.peds) {
      const sx = projX(p.wx, CROWD_F, camX); if (sx < -40 || sx > W + 40) continue;
      const y = CROWD_Y - 4;
      if (p.skate) {
        const s = getSprite(p.def, 'crouch', 0, 'normal');
        const spr = getSprite(p.def, 'stand', 0, 'normal'); void s;
        g.fillStyle = OUTL; g.fillRect(Math.round(sx) - 9, y - 3, 18, 3); g.fillStyle = '#c0392b'; g.fillRect(Math.round(sx) - 8, y - 3, 16, 1);
        g.fillStyle = '#eee'; g.fillRect(Math.round(sx) - 6, y - 1, 2, 2); g.fillRect(Math.round(sx) + 4, y - 1, 2, 2);
        drawSpr(g, spr, sx, y - 3, Math.sign(p.v));
      } else {
        drawSpr(g, getSprite(p.def, 'walk', t + p.t0, 'normal'), sx, y, Math.sign(p.v));
      }
    }
    // crowd
    for (const c of this.crowd) {
      const sx = projX(c.wx, CROWD_F, camX); if (sx < -40 || sx > W + 40) continue;
      const face = sx < W / 2 ? 1 : -1;
      const anim = c.cheer > 0 ? 'cheer' : c.anim;
      shadow(g, sx, c.y, 16, .25);
      drawSpr(g, getSprite(c.def, anim, t + c.t0, c.cheer > 0 ? 'happy' : 'normal'), sx, c.y, face);
    }
    // dog
    const dsx = projX(this.dog.wx, floorF(this.dog.y), camX);
    if (dsx > -20 && dsx < W + 20) { const im = SMALL.dog[Math.floor(t / 10) % 2]; g.save(); g.translate(Math.round(dsx), 0); g.scale(-1, 1); g.drawImage(im, 0, this.dog.y - im.height); g.restore(); }
  },
  drawFront(g, camX) {
    const t = this.t;
    // foreground bollards & lamp posts
    for (const it of this.fgItems) {
      const sx = it.x - camX * 1.3; if (sx < -20 || sx > W + 20) continue;
      const x = Math.round(sx);
      if (it.type === 'bollard') {
        g.fillStyle = OUTL; g.fillRect(x - 5, 214, 10, 12); stamp(g, x, 214, 12, OUTL);
        g.fillStyle = '#26242c'; g.fillRect(x - 4, 215, 8, 11); stamp(g, x, 214, 10, '#26242c');
        g.fillStyle = '#4a4854'; g.fillRect(x - 3, 215, 2, 11); g.fillRect(x - 2, 210, 2, 3);
        g.fillStyle = '#b8a040'; g.fillRect(x - 4, 220, 8, 2);
      } else {
        g.fillStyle = OUTL; g.fillRect(x - 3, 0, 7, H); g.fillStyle = '#2a2a34'; g.fillRect(x - 2, 0, 5, H); g.fillStyle = '#4a4a58'; g.fillRect(x - 1, 0, 1, H);
        g.fillStyle = OUTL; g.fillRect(x - 5, 190, 11, 35); g.fillStyle = '#2a2a34'; g.fillRect(x - 4, 191, 9, 34);
      }
    }
    // rain
    if (this.cfg.tod === 'rain') {
      g.fillStyle = 'rgba(170,190,255,.55)';
      for (const r of this.parts) g.fillRect(Math.round(r.x), Math.round(r.y), 1, 4);
      g.fillStyle = 'rgba(200,215,255,.7)';
      for (const s of this.splashes || []) { g.fillRect(Math.round(s.x) - s.t / 2, s.y, 1, 1); g.fillRect(Math.round(s.x) + s.t / 2, s.y, 1, 1); if (s.t < 3) g.fillRect(Math.round(s.x), s.y - 2, 1, 2); }
      if (this.lightning > 10) { g.fillStyle = 'rgba(220,230,255,.25)'; g.fillRect(0, 0, W, H); }
    }
    if (this.night) { // vignette
      g.drawImage(vignette(), 0, 0);
    }
  }
};
let _vig = null;
function vignette() {
  if (_vig) return _vig; let g; [_vig, g] = mk(W, H); g.fillStyle = '#05030c';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2); const d = Math.sqrt(dx * dx * .8 + dy * dy * .9); const a = clamp((d - .75) * 1.4, 0, .7); if (bay(x, y) < a) g.fillRect(x, y, 1, 1); }
  return _vig;
}

// ============================================================
//  FLAGS
// ============================================================
function drawFlag(g, id, x, y, w, h, t = 0, wave = 0) {
  const [c, fg] = mk(w, h);
  const hs = (cols, ratios) => { const tot = ratios.reduce((a, b) => a + b, 0); let yy = 0; cols.forEach((col, i) => { const hh = Math.round(h * ratios[i] / tot); fg.fillStyle = col; fg.fillRect(0, yy, w, i === cols.length - 1 ? h - yy : hh); yy += hh; }); };
  const vs = cols => { cols.forEach((col, i) => { fg.fillStyle = col; fg.fillRect(Math.round(i * w / cols.length), 0, Math.ceil(w / cols.length), h); }); };
  if (id === 'co') hs(['#fcd116', '#003893', '#ce1126'], [2, 1, 1]);
  if (id === 've') { hs(['#f4c300', '#00247d', '#cf142b'], [1, 1, 1]); fg.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { const a = Math.PI * (1.15 + i / 7 * .7); fg.fillRect(Math.round(w / 2 + Math.cos(a) * w * .18), Math.round(h * .62 + Math.sin(a) * h * .28), 1, 1); } }
  if (id === 'pe') vs(['#d91023', '#ffffff', '#d91023']);
  if (id === 'ar') { hs(['#74acdf', '#ffffff', '#74acdf'], [1, 1, 1]); stamp(fg, w / 2, h / 2, Math.max(2, Math.round(h / 5)), '#f6b40e'); }
  if (id === 'mx') { vs(['#006847', '#ffffff', '#ce1126']); stamp(fg, w / 2, h / 2, Math.max(2, Math.round(h / 4)), '#8a5a2a'); fg.fillStyle = '#3a8a3a'; fg.fillRect(Math.round(w / 2) - 1, Math.round(h / 2) + 1, 3, 1); }
  if (id === 'ec') { hs(['#ffdd00', '#034ea2', '#ed1c24'], [2, 1, 1]); stamp(fg, w / 2, h / 2, Math.max(2, Math.round(h / 4)), '#8a6a3a'); }
  if (id === 'es') { hs(['#aa151b', '#f1bf00', '#aa151b'], [1, 2, 1]); const ex = Math.round(w * .3), ey = Math.round(h * .35), s = Math.max(2, Math.round(h * .3)); fg.fillStyle = '#aa151b'; fg.fillRect(ex, ey, Math.max(1, Math.round(s * .7)), s); fg.fillStyle = '#c8a040'; fg.fillRect(ex - 1, ey, 1, s); fg.fillRect(ex + Math.round(s * .7), ey, 1, s); }
  if (id === 'cu') {
    for (let i = 0; i < 5; i++) { fg.fillStyle = i % 2 ? '#ffffff' : '#002a8f'; const y0 = Math.round(i * h / 5); fg.fillRect(0, y0, w, Math.round((i + 1) * h / 5) - y0); }
    polyFill(fg, [pt(0, 0), pt(Math.round(w * .45), h / 2), pt(0, h)], '#cf142b');
    const sx = Math.round(w * .15), sy = Math.round(h / 2); fg.fillStyle = '#fff'; fg.fillRect(sx - 1, sy, 3, 1); fg.fillRect(sx, sy - 1, 1, 3);
  }
  if (id === 'cat') { fg.fillStyle = '#fcdd09'; fg.fillRect(0, 0, w, h); fg.fillStyle = '#da121a'; for (let i = 1; i < 9; i += 2) fg.fillRect(0, Math.round(i * h / 9), w, Math.max(1, Math.round(h / 9))); }
  if (!wave) { g.drawImage(c, x, y); return; }
  // waving: column offsets + shading bands
  for (let cx = 0; cx < w; cx++) {
    const ph = t * .12 - cx * .18, amp = wave * (cx / w);
    const oy = Math.round(Math.sin(ph) * amp);
    g.drawImage(c, cx, 0, 1, h, x + cx, y + oy, 1, h);
    const sh = Math.cos(ph);
    if (sh > .55) { g.globalAlpha = .18; g.fillStyle = '#fff'; g.fillRect(x + cx, y + oy, 1, h); g.globalAlpha = 1; }
    else if (sh < -.55) { g.globalAlpha = .22; g.fillStyle = '#000'; g.fillRect(x + cx, y + oy, 1, h); g.globalAlpha = 1; }
  }
}

// ============================================================
//  CUTSCENE BACKDROPS
// ============================================================
function buildAirport(country) {
  const AW = 760, R = RNG(99);
  const [c, g] = mk(AW, HORIZON + 4);
  // outside sky through glass
  const skyC = ['#8ec6f0', '#a8d4f4', '#c8e4f8', '#e8f2fa'];
  for (let y = 0; y < 130; y++) { for (let x = 0; x < AW; x++) { const f = y / 130 * 3, i = Math.floor(f); g.fillStyle = (f - i) > bay(x, y) ? skyC[Math.min(3, i + 1)] : skyC[i]; g.fillRect(x, y, 1, 1); } }
  // mountains (Andes-ish)
  for (let x = 0; x < AW; x++) { const hgt = 30 + Math.sin(x * .02) * 12 + Math.sin(x * .053) * 8 + Math.sin(x * .11) * 3; g.fillStyle = '#7a9ab8'; g.fillRect(x, 108 - hgt, 1, hgt); g.fillStyle = '#9ab4cc'; if (hgt > 42) g.fillRect(x, 108 - hgt, 1, 3); }
  // tarmac & grass
  g.fillStyle = '#7a9a5a'; g.fillRect(0, 104, AW, 6); g.fillStyle = '#8a8e96'; g.fillRect(0, 110, AW, 20); g.fillStyle = '#f0f0f0'; for (let x = 0; x < AW; x += 18) g.fillRect(x, 119, 9, 1);
  // parked airliner
  const plane = (px, py, s, tail) => {
    g.fillStyle = OUTL; g.fillRect(px - 1, py - 1, 150 * s + 2, 16 * s + 2);
    g.fillStyle = '#f4f6f8'; g.fillRect(px, py, 150 * s, 16 * s); g.fillStyle = '#d8dce2'; g.fillRect(px, py + 11 * s, 150 * s, 5 * s);
    g.fillStyle = tail[1]; g.fillRect(px, py + 9 * s, 150 * s, 2 * s);
    stamp(g, px + 150 * s, py + 8 * s, 16 * s, '#f4f6f8'); g.fillStyle = '#2a3a4a'; g.fillRect(px + 150 * s, py + 4 * s, 6 * s, 3 * s);
    polyFill(g, [pt(px, py), pt(px + 22 * s, py), pt(px + 6 * s, py - 30 * s), pt(px - 10 * s, py - 30 * s)], tail[0]);
    polyFill(g, [pt(px + 2 * s, py - 10 * s), pt(px + 10 * s, py - 10 * s), pt(px + 4 * s, py - 20 * s), pt(px - 4 * s, py - 20 * s)], tail[1]);
    g.fillStyle = '#3a4a5e'; for (let i = 20; i < 140; i += 5) g.fillRect(px + i * s, py + 5 * s, 2 * s, 2 * s);
    g.fillStyle = '#b8bcc4'; g.fillRect(px + 60 * s, py + 14 * s, 44 * s, 4 * s); g.fillStyle = '#8a8e96'; g.fillRect(px + 70 * s, py + 18 * s, 16 * s, 8 * s); g.fillStyle = '#2a2a30'; g.fillRect(px + 70 * s, py + 19 * s, 3 * s, 6 * s);
    g.fillStyle = '#2a2a30'; g.fillRect(px + 40 * s, py + 16 * s, 2 * s, 6 * s); g.fillRect(px + 130 * s, py + 16 * s, 2 * s, 6 * s);
  };
  const cc = FLAGCOL[country] || ['#c00', '#fc0'];
  plane(60, 86, 1, cc);
  plane(470, 100, .5, ['#2a60b0', '#d0202a']);
  // jet bridge
  g.fillStyle = '#9aa0a8'; g.fillRect(220, 88, 120, 14); g.fillStyle = '#7a8088'; g.fillRect(220, 100, 120, 2); g.fillStyle = '#c0c4ca'; for (let x = 224; x < 336; x += 10) g.fillRect(x, 90, 6, 6);
  // glass mullions & frame
  for (let x = 0; x < AW; x += 56) { g.fillStyle = '#3a3e48'; g.fillRect(x, 0, 4, 130); g.fillStyle = '#5a5e68'; g.fillRect(x + 1, 0, 1, 130); }
  g.fillStyle = '#3a3e48'; g.fillRect(0, 62, AW, 2);
  g.globalAlpha = .12; g.fillStyle = '#fff'; for (let x = 0; x < AW; x += 56) polyFill(g, [pt(x + 10, 0), pt(x + 22, 0), pt(x + 6, 130), pt(x - 6, 130)], '#fff'); g.globalAlpha = 1;
  // ceiling
  g.fillStyle = '#d8d8d4'; g.fillRect(0, 0, AW, 12); g.fillStyle = '#b8b8b4'; g.fillRect(0, 12, AW, 2);
  for (let x = 10; x < AW; x += 40) { g.fillStyle = '#fffbe8'; g.fillRect(x, 9, 18, 2); }
  // interior wall base
  g.fillStyle = '#c8c4bc'; g.fillRect(0, 130, AW, 24); g.fillStyle = '#a8a49c'; g.fillRect(0, 130, AW, 2);
  // departures board
  g.fillStyle = OUTL; g.fillRect(372, 20, 112, 50); g.fillStyle = '#10141c'; g.fillRect(374, 22, 108, 46);
  tiny(g, 'SALIDAS  DEPARTURES', 377, 24, '#f2c14e');
  const rows = [['MADRID', '21:10', 'SALIDO'], ['MIAMI', '22:30', 'SALIDO'], ['BARCELONA', '23:45', 'EMBARQUE'], ['LIMA', '00:20', 'A TIEMPO'], ['PARIS', '01:05', 'A TIEMPO']];
  rows.forEach((r, i) => { tiny(g, r[0], 377, 32 + i * 7, '#e8e8e8'); tiny(g, r[1], 420, 32 + i * 7, '#e8e8e8'); tiny(g, r[2], 443, 32 + i * 7, i === 2 ? '#6aff8a' : '#9aa'); });
  // gate sign
  g.fillStyle = '#1a1e28'; g.fillRect(600, 24, 110, 18); g.fillStyle = '#f2c14e'; g.fillRect(602, 26, 18, 14); tiny(g, '12', 605, 30, '#1a1e28', 2);
  tiny(g, 'PUERTA  BARCELONA', 624, 30, '#fff'); g.fillStyle = '#3a3e48'; g.fillRect(630, 14, 1, 10); g.fillRect(690, 14, 1, 10);
  // boarding desk
  g.fillStyle = OUTL; g.fillRect(640, 118, 60, 36); g.fillStyle = '#2a4a7a'; g.fillRect(641, 119, 58, 35); g.fillStyle = '#3a5a8a'; g.fillRect(641, 119, 58, 3);
  // country flag hanging banner
  drawFlag(g, country, 150, 18, 48, 32);
  g.fillStyle = '#3a3e48'; g.fillRect(150, 14, 1, 4); g.fillRect(197, 14, 1, 4);
  // plants
  for (const px of [20, 340, 560]) { g.fillStyle = '#8a8e96'; g.fillRect(px, 136, 10, 16); for (let i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#3f8a3a' : '#2e6a2e'; g.fillRect(px - 4 + R.i(0, 16), 118 + R.i(0, 18), 3, 3); } }
  // chairs row
  const chairs = mk(AW, 40); const cg = chairs[1];
  for (let x = 250; x < 560; x += 14) { cg.fillStyle = OUTL; cg.fillRect(x - 1, 6, 12, 16); cg.fillStyle = '#2e5a9a'; cg.fillRect(x, 7, 10, 8); cg.fillRect(x, 16, 10, 4); cg.fillStyle = '#4a7aba'; cg.fillRect(x, 7, 10, 1); cg.fillStyle = '#6a6e76'; cg.fillRect(x + 4, 20, 2, 10); }
  cg.fillStyle = '#6a6e76'; cg.fillRect(250, 30, 310, 2);
  const floor = buildFloor({ floor: ['#d8d8d0', '#ccccc4', '#a8a8a0'], haze: '#e8e8e0' }, R, 'tiles');
  return { bg: c, chairs: chairs[0], floor, AW };
}
const FLAGCOL = { co: ['#fcd116', '#003893'], ve: ['#f4c300', '#00247d'], pe: ['#d91023', '#8a0a14'], ar: ['#74acdf', '#f6b40e'], mx: ['#006847', '#ce1126'], ec: ['#ffdd00', '#034ea2'] };

// ---------- world map for flight ----------
function geoXY(lat, lon) { return pt((lon + 110) / 130 * W, (60 - lat) / 100 * H); }
const CONTINENTS = [
  [[-80, 10], [-72, 12], [-62, 11], [-52, 5], [-35, -7], [-39, -15], [-48, -26], [-58, -38], [-65, -42], [-68, -55], [-73, -50], [-72, -30], [-71, -18], [-77, -12], [-81, -5], [-80, 0], [-78, 8]],
  [[-120, 34], [-117, 33], [-110, 23], [-105, 20], [-97, 16], [-92, 15], [-87, 13], [-83, 9], [-79, 9], [-77, 8], [-83, 11], [-84, 15], [-88, 16], [-87, 21], [-90, 21], [-97, 22], [-97, 26], [-94, 29], [-89, 30], [-84, 30], [-81, 25], [-80, 32], [-76, 35], [-70, 42], [-66, 45], [-60, 47], [-55, 52], [-60, 56], [-70, 62], [-120, 62]],
  [[-85, 22], [-80, 23], [-74, 20], [-78, 20]],
  [[-6, 35.8], [-10, 30], [-13, 27], [-17, 21], [-17, 14], [-12, 8], [-8, 4.5], [-2, 5], [5, 6], [9, 4], [10, -2], [13, -10], [12, -17], [15, -27], [20, -35], [25, -35], [25, 32], [10, 37]],
  [[-10, 36], [-9, 43], [-2, 43.5], [-1.5, 46], [-4.5, 48], [-1.5, 49.5], [2, 51], [5, 53.5], [8, 54], [9, 57.5], [12, 56], [25, 55], [25, 40], [18, 40], [15, 38], [12, 42], [9, 44], [7, 43.5], [3, 43], [3, 42], [0, 39], [-2, 36.8], [-5.5, 36]],
  [[-5, 50], [1, 51], [2, 53], [0, 54], [-2, 57], [-4, 59], [-6, 57], [-5, 54], [-3, 53], [-5, 51]],
  [[-24, 64], [-13, 64], [-15, 66], [-22, 66]],
];
const CITIES = { co: [4.7, -74.1, 'BOGOTA'], ve: [10.5, -66.9, 'CARACAS'], pe: [-12, -77, 'LIMA'], ar: [-34.6, -58.4, 'BUENOS AIRES'], mx: [19.4, -99.1, 'CDMX'], ec: [-0.2, -78.5, 'QUITO'] };
function buildMap() {
  const [c, g] = mk(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { g.fillStyle = bay(x, y) < .15 + y / H * .2 ? '#0c1a3a' : '#10224a'; g.fillRect(x, y, 1, 1); }
  g.fillStyle = '#16305e'; for (let x = 0; x < W; x += 20) g.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 20) g.fillRect(0, y, W, 1);
  for (const poly of CONTINENTS) { const pts = poly.map(([lo, la]) => geoXY(la, lo)); polyFill(g, pts.map(p => pt(p.x + 1, p.y + 1)), '#0a1428'); polyFill(g, pts, '#2e6a4a'); }
  // coastline highlight
  pixels(c, (p, w, h) => { const cp = new Uint8ClampedArray(p); for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) { const o = (y * w + x) * 4; if (cp[o + 1] === 106 && (cp[o - 4 + 1] !== 106 || cp[o - w * 4 + 1] !== 106)) { p[o] = 90; p[o + 1] = 160; p[o + 2] = 110; } } });
  return c;
}


// ---------- Cuban balcony: blonde neighbour + shirtless neighbour (in shorts) ----------
const _mini = new Map();
function miniNeighbour(who, pose) {
  const key = who + pose; let c = _mini.get(key); if (c) return c;
  const G = new PGrid(7, 12), blonde = who === 'rubia';
  const S = blonde ? '#f0c8a0' : '#b98356', SS = dk(S, .8), H = blonde ? '#f2d468' : '#1e1612', cheer = pose.startsWith('cheer');
  // head
  G.hl(2, 4, 1, S); G.hl(2, 4, 2, S); G.hl(2, 4, 3, S);
  G.set(2, 2, EYE_D); G.set(4, 2, EYE_D); if (cheer) G.set(3, 3, '#5a1620');
  G.hl(2, 4, 0, H);
  if (blonde) { for (let y = 0; y <= 5; y++) { G.set(1, y, H); G.set(5, y, H); } G.set(3, 0, '#fff0a8'); }
  else { G.set(1, 1, H); G.set(5, 1, H); G.set(3, 3, cheer ? '#5a1620' : dk(S, .7)); }
  G.set(3, 4, SS);
  // torso: woman in a pink top, man shirtless with shorts
  for (let y = 5; y <= 11; y++) for (let x = 1; x <= 5; x++) G.set(x, y, x === 1 ? dk(blonde ? '#e8467a' : S, .82) : (blonde ? '#e8467a' : S));
  if (blonde) { G.hl(2, 4, 5, S); }
  else { G.set(2, 6, SS); G.set(4, 6, SS); G.set(3, 7, SS); for (let y = 9; y <= 11; y++) G.hl(1, 5, y, y === 9 ? '#1c3f8a' : '#2e5fb8'); G.set(3, 10, '#1c3f8a'); }
  // arms
  if (cheer) { const u = pose === 'cheer1' ? 0 : 1; for (let y = u; y <= 5; y++) { G.set(0, y, S); G.set(6, y, S); } }
  else { for (let y = 6; y <= 8; y++) { G.set(0, y, S); G.set(6, y, S); } G.set(1, 9, S); G.set(5, 9, S); }
  if (pose === 'idleB') { const n = new PGrid(7, 12); for (let y = 1; y < 12; y++) for (let x = 0; x < 7; x++) n.set(x, y, G.get(x, y - 1)); c = n.canvas(); }
  else c = G.canvas();
  _mini.set(key, c); return c;
}
let _cuFlag = null;
function cubaFlagVertical() {
  if (_cuFlag) return _cuFlag;
  const [h, hg] = mk(12, 7); drawFlag(hg, 'cu', 0, 0, 12, 7);
  let g; [_cuFlag, g] = mk(9, 14); g.fillStyle = OUTL; g.fillRect(0, 0, 9, 14);
  // hung from the railing: rotate 90° so the stripes run vertically, triangle at the top
  g.save(); g.translate(8, 1); g.rotate(Math.PI / 2); g.drawImage(h, 0, 0); g.restore();
  return _cuFlag;
}
function drawCubaBalcony(g, sx, y, t, cheer) {
  const x = Math.round(sx);
  const pose = cheer > 0 ? ((t >> 3) % 2 ? 'cheer1' : 'cheer2') : ((t >> 6) % 3 === 0 ? 'idleB' : 'idle');
  const pose2 = cheer > 0 ? ((t >> 3) % 2 ? 'cheer2' : 'cheer1') : ((t >> 6) % 3 === 1 ? 'idleB' : 'idle');
  g.drawImage(miniNeighbour('rubia', pose), x - 3, y + 1);
  g.drawImage(miniNeighbour('hombre', pose2), x + 3, y + 1);
  // wrought-iron railing (same size as every other balcony)
  g.fillStyle = '#241c22'; g.fillRect(x - 4, y + 9, 20, 1); g.fillRect(x - 4, y + 14, 20, 1);
  for (let xx = x - 4; xx < x + 16; xx += 2) g.fillRect(xx, y + 9, 1, 6);
  // Cuban flag hanging vertically from the railing, swaying a little
  const sw = Math.sin(t * .04) > .5 ? 1 : 0;
  g.drawImage(cubaFlagVertical(), x + 10 + sw, y + 9);
}
