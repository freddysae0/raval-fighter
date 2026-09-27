'use strict';
// ============================================================
//  STORY — scenes, cutscenes, dialogue, stage flow
// ============================================================
const COUNTRIES = [
  { id: 'co', name: 'COLOMBIA', airport: 'AEROPUERTO EL DORADO · BOGOTÁ', slang: 'parce', son: 'mijo' },
  { id: 've', name: 'VENEZUELA', airport: 'AEROPUERTO DE MAIQUETÍA · CARACAS', slang: 'pana', son: 'mijo' },
  { id: 'pe', name: 'PERÚ', airport: 'AEROPUERTO JORGE CHÁVEZ · LIMA', slang: 'causa', son: 'hijito' },
  { id: 'ar', name: 'ARGENTINA', airport: 'AEROPUERTO DE EZEIZA · BUENOS AIRES', slang: 'che', son: 'nene' },
  { id: 'mx', name: 'MÉXICO', airport: 'AEROPUERTO DE LA CIUDAD DE MÉXICO', slang: 'güey', son: 'mijo' },
  { id: 'ec', name: 'ECUADOR', airport: 'AEROPUERTO MARISCAL SUCRE · QUITO', slang: 'ñaño', son: 'mijo' },
];
const GAME = { country: COUNTRIES[0], stage: 0, tutorialShown: false, startTime: 0, continues: 0 };
const C = () => GAME.country;

const STAGES = [
  {
    name: "CARRER DE L'HOSPITAL", theme: 'hospital', tod: 'afternoon', enemy: 'fumeta', seed: 1101, dist: '850 m', introAnim: 'smoke', music: 'fight',
    ai: { aggr: .32, block: .18, special: .1, jump: .04, react: 18, range: 34, combo: .15, dmg: .72, speed: .9, hp: 90 },
    intro: () => [['fumeta', 'Amigo... amigo... ¿tiene cigarro?'], ['hero', `No fumo, ${C().slang}. Perdona.`], ['fumeta', '¿No? Pues entonces... me das la maleta y en paz.'], ['hero', 'Ni lo sueñes.']],
    outro: () => [['fumeta', 'Tranqui, tranqui... Bienvenido al Raval, bro.']]
  },
  {
    name: 'RAMBLA DEL RAVAL', theme: 'rambla', tod: 'sunset', enemy: 'latero', seed: 2202, dist: '600 m', introAnim: 'canUp', music: 'fight',
    ai: { aggr: .42, block: .28, special: .14, jump: .06, react: 15, range: 34, combo: .28, dmg: .82, speed: 1, hp: 100 },
    intro: () => [['latero', '¡Cerveza, beer, un euro! ¡Agua, cerveza!'], ['hero', `No, gracias, ${C().slang}.`], ['latero', '¿Cómo que no? ¡Aquí todo el mundo compra!'], ['latero', 'Una o te la tiro.']],
    outro: () => [['latero', 'Vale, vale... dos por un euro. Última oferta.']]
  },
  {
    name: 'PLAÇA DELS ÀNGELS', theme: 'macba', tod: 'dusk', enemy: 'carterista', seed: 3303, dist: '400 m', introAnim: 'hipHand', music: 'fight',
    ai: { aggr: .5, block: .34, special: .14, jump: .14, react: 12, range: 36, combo: .38, dmg: .9, speed: 1.2, hp: 100 },
    intro: () => [['carterista', 'Oye guapo, ¿me haces una foto?'], ['hero', 'Claro, ¿con qué móvil...? ¡Oye! ¡Esa es MI cartera!'], ['carterista', 'Uy. Pillada.'], ['carterista', 'Bueno... ¡pues ahora te la quito a golpes!']],
    outro: () => [['carterista', 'Toma tu cartera. Y tu móvil. Y... este otro móvil, que no sé de quién es.']]
  },
  {
    name: 'CARRER DE JOAQUÍN COSTA', theme: 'joaquin', tod: 'night', enemy: 'relojero', seed: 4404, dist: '200 m', introAnim: 'showWatch', music: 'fight',
    ai: { aggr: .56, block: .44, special: .17, jump: .08, react: 10, range: 36, combo: .5, dmg: .98, speed: 1.1, hp: 105 },
    intro: () => [['relojero', 'Amigo, amigo... ¿tiene hora?'], ['hero', 'Sí, son las... ¡Oye! ¡Suelta mi muñeca!'], ['relojero', 'Bonito reloj. Ahora tiene hora... pero es mía.']],
    outro: () => [['relojero', 'Toma, llévate uno. Es Rolex. Casi.']]
  },
  {
    name: 'CARRER DE LA RIERA BAIXA', theme: 'riera', tod: 'rain', enemy: 'capo', seed: 5505, dist: '20 m', introAnim: 'knuckles', music: 'boss', boss: true,
    ai: { aggr: .62, block: .52, special: .14, jump: .1, react: 8, range: 38, combo: .6, dmg: 1.08, speed: 1.05, hp: 125 },
    intro: () => [['capo', 'Amigo... ¿tú de dónde eres?'], ['hero', `De ${C().name.charAt(0) + C().name.slice(1).toLowerCase()}. ¿Algún problema?`], ['capo', 'Aquí en el Raval se paga peaje. Y tú no has pagado.'], ['hero', 'Mi Airbnb está justo ahí. Nadie me va a parar.'], ['capo', 'Eso ya lo veremos, primo.']],
    outro: () => [['capo', 'Respeto, ' + C().slang + '. Tienes calle. Bienvenido al barrio.']]
  },
];
const WIN_QUOTES = ['¡Doce horas de vuelo y aún me sobra energía!', 'Mi abuela pega más fuerte que tú.', 'En mi barrio esto es un saludo.', '¡Déjame pasar, que llego tarde al check-in!', 'La chancla nunca falla.'];

// ---------- scene manager ----------
let SCN = null;
function go(s) { SCN = s; if (s.init) s.init(); }
function goFade(mk, sp = 0.045) { fadeTo(() => go(mk()), sp); }

// ---------- speakers ----------
function SP(k) {
  if (k === 'mega') return { name: 'MEGAFONÍA', voice: 700, color: '#9fe8ff' };
  if (k === 'host') return { name: 'JORDI · AIRBNB', def: CH.host, voice: 380, color: '#ff6f7f' };
  const d = CH[k]; return { name: d.name, def: d, voice: d.voice, color: d.color || '#fff' };
}
let DLG_BOTTOM = false;
class Dialog {
  constructor(sp, text, o = {}) {
    this.sp = sp; this.lines = wrapText(text, o.wide ? 46 : 37); this.total = this.lines.join('').length; this.n = 0; this.t = 0; this.wait = 0;
    this.done = false; this.o = o; this.expr = o.expr || (sp.def && sp.def.expr) || 'normal';
  }
  update() {
    this.t++;
    if (this.n < this.total) {
      if (this.t % 2 === 0) { this.n++; if (this.n % 2 === 0 && this.sp.voice) sfx('blip', this.sp.voice * (0.92 + Math.random() * .16)); }
      if (Input.ok()) this.n = this.total;
    } else { this.wait++; if (Input.ok() || (this.o.auto && this.wait > this.o.auto)) this.done = true; }
  }
  draw(g) {
    const right = this.o.right, hasP = !!this.sp.def, bx = 4, by = this.o.bottom || DLG_BOTTOM ? 152 : 13, bw = W - 8, bh = 70;
    g.fillStyle = OUTL; g.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
    g.fillStyle = '#e8dcc0'; g.fillRect(bx, by, bw, bh);
    g.fillStyle = '#141028'; g.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
    g.fillStyle = '#1e1838'; for (let y = by + 4; y < by + bh - 2; y += 4) g.fillRect(bx + 2, y, bw - 4, 1);
    let tx = bx + 10;
    if (hasP) {
      const px = right ? bx + bw - 74 : bx + 5, py = by + 3;
      g.fillStyle = OUTL; g.fillRect(px - 1, py - 1, 66, 66); g.fillStyle = mix(this.sp.color, '#141028', .55); g.fillRect(px, py, 64, 64);
      const talking = this.n < this.total && (this.t >> 2) % 2 === 0;
      const pc = portraitCanvas(this.sp.def, talking && !['hurt', 'happy', 'proud', 'sleepy'].includes(this.expr) ? 'talk' : this.expr);
      g.save(); g.beginPath(); g.rect(px, py, 64, 64); g.clip();
      const ph = portraitHi(this.sp.def, pc._e || (talking && !['hurt', 'happy', 'proud', 'sleepy'].includes(this.expr) ? 'talk' : this.expr), 1);
      if (right) { g.translate(px + 64, 0); g.scale(-1, 1); g.drawImage(ph, -2, py - 2); } else g.drawImage(ph, px - 2, py - 2);
      g.restore();
      if (!right) tx = px + 74;
    }
    // name tag
    const nw = twidth(this.sp.name) + 12, nx = hasP && !right ? tx - 4 : bx + 8;
    g.fillStyle = OUTL; g.fillRect(nx - 1, by - 9, nw + 2, 12); g.fillStyle = this.sp.color || '#fff'; g.fillRect(nx, by - 8, nw, 10);
    text(g, this.sp.name, nx + 6, by - 7, { color: '#141028' });
    let left = this.n;
    this.lines.forEach((ln, i) => { if (left <= 0) return; const s = ln.slice(0, left); left -= ln.length; text(g, s, tx, by + 12 + i * 13, { color: '#fff', shadow: '#000' }); });
    if (this.n >= this.total && (this.t >> 4) % 2 === 0) { const ax = right ? bx + bw - 86 : bx + bw - 14; g.fillStyle = '#ffd84a'; g.fillRect(ax, by + bh - 12, 6, 2); g.fillRect(ax + 1, by + bh - 10, 4, 1); g.fillRect(ax + 2, by + bh - 9, 2, 1); }
  }
}

// ---------- actors ----------
class Actor {
  constructor(def, x, facing = 1, o = {}) {
    this.def = def; this.x = x; this.y = o.y || GROUND; this.facing = facing; this.anim = o.anim || 'stand'; this.t = rndi(0, 50); this.expr = o.expr || def.expr || 'normal';
    this.tx = null; this.speed = o.speed || 1.1; this.walkAnim = o.walkAnim || 'walk'; this.idleAnim = o.anim || 'stand'; this.talk = false; this.blinkT = rndi(60, 200); this.bag = !!o.bag; this.visible = true; this.alpha = 1;
  }
  walkTo(x, speed, faceAfter) { this.tx = x; if (speed) this.speed = speed; this.faceAfter = faceAfter || 0; }
  set(a) { if (this.anim !== a) { this.anim = a; this.t = 0; } this.idleAnim = a; }
  get arrived() { return this.tx === null; }
  update() {
    this.t++; if (--this.blinkT < 0) this.blinkT = rndi(120, 260);
    if (this.tx !== null) {
      const d = this.tx - this.x;
      if (Math.abs(d) <= this.speed) { this.x = this.tx; this.tx = null; this.anim = this.idleAnim; this.t = 0; if (this.faceAfter) this.facing = this.faceAfter; }
      else { this.x += Math.sign(d) * this.speed; this.facing = Math.sign(d); if (this.anim !== this.walkAnim) { this.anim = this.walkAnim; this.t = 0; } }
    }
  }
  draw(g, camX, f = 1) {
    if (!this.visible) return;
    let e = this.expr; if (this.talk && (this.t >> 3) % 2 === 0 && e === 'normal') e = 'talk'; else if (this.blinkT < 6 && e === 'normal') e = 'blink';
    const spr = getSprite(this.def, this.anim, this.t, e);
    const sx = f === 1 ? this.x - camX : projX(this.x, f, camX);
    shadow(g, sx, this.y, 24 * this.def.b.s, .35);
    if (this.alpha < 1) g.globalAlpha = this.alpha;
    if (this.bag) drawSuitcase(g, sx, this.y, this.facing, spr, true);
    drawSpr(g, spr, sx, this.y, this.facing);
    if (this.bag) drawSuitcase(g, sx, this.y, this.facing, spr, false);
    g.globalAlpha = 1;
  }
}
function drawSuitcase(g, sx, gy, facing, spr, behind) {
  const hx = sx + spr.hand1.x * facing, hy = gy + spr.hand1.y;
  const im = SMALL.suitcase, bx = Math.round(hx - (facing > 0 ? 8 : 2)), by = gy - im.height + 1;
  if (behind) { g.drawImage(im, bx, by); g.fillStyle = '#6a6e76'; g.fillRect(Math.round(hx), Math.round(hy), 1, Math.max(0, by + 2 - hy)); }
}
function drawSuitcaseAt(g, x, gy) { const im = SMALL.suitcase; g.drawImage(im, Math.round(x - im.width / 2), gy - im.height + 1); g.fillStyle = '#6a6e76'; g.fillRect(Math.round(x) - 1, gy - im.height - 5, 1, 6); g.fillRect(Math.round(x) + 2, gy - im.height - 5, 1, 6); g.fillRect(Math.round(x) - 1, gy - im.height - 5, 4, 1); }

// ---------- generator helpers ----------
function* wait(n) { for (let i = 0; i < n; i++) yield; }
function* until(fn) { while (!fn()) yield; }
class Cutscene {
  constructor() { this.dlg = null; this.co = null; this.t = 0; this.actors = []; this.caption = null; this.skipTo = null; }
  run(gen) { this.co = gen; }
  *say(who, txt, o = {}) {
    const sp = SP(who); const a = this.actors.find(a => a.def === sp.def);
    if (a) a.talk = true;
    this.dlg = new Dialog(sp, txt, o);
    while (!this.dlg.done) yield;
    if (a) a.talk = false; this.dlg = null; yield;
  }
  *talk(lines) { for (const [who, txt, o] of lines) yield* this.say(who, txt, o || {}); }
  step() {
    this.t++; for (const a of this.actors) a.update();
    if (this.dlg) this.dlg.update();
    if (this.co) { const r = this.co.next(); if (r.done) this.co = null; }
    if (this.skipTo && Input.hit('pause')) { const s = this.skipTo; this.skipTo = null; goFade(s, .06); }
  }
  drawOverlay(g) {
    if (this.caption) drawCaption(g, this.caption);
    if (this.dlg) this.dlg.draw(g);
    if (this.skipTo) tiny(g, 'ESC: SALTAR', W - 48, 3, 'rgba(255,255,255,.55)');
  }
}
function drawCaption(g, cap) {
  const lines = Array.isArray(cap) ? cap : [cap];
  const w = Math.max(...lines.map(l => twidth(l))) + 16, h = lines.length * 12 + 8;
  g.fillStyle = OUTL; g.fillRect(7, 7, w + 2, h + 2); g.fillStyle = 'rgba(16,10,30,.9)'; g.fillRect(8, 8, w, h); g.fillStyle = '#ffd84a'; g.fillRect(8, 8, 3, h);
  lines.forEach((l, i) => text(g, l, 16, 13 + i * 12, { color: i ? '#c8c0e0' : '#fff' }));
}
function drawItemGet(g, t, name, hint) {
  const a = clamp(t / 10, 0, 1); drawFade(g, .6 * a, '#05020a');
  const y = 60, bw = 300, bx = W / 2 - bw / 2;
  g.fillStyle = OUTL; g.fillRect(bx - 1, y - 1, bw + 2, 72); g.fillStyle = '#1a1438'; g.fillRect(bx, y, bw, 70); g.fillStyle = '#ffd84a'; g.fillRect(bx, y, bw, 2); g.fillRect(bx, y + 68, bw, 2);
  text(g, '¡HAS CONSEGUIDO!', W / 2, y + 8, { align: 'center', color: '#ffd84a' });
  const im = SMALL.chancla[Math.floor(t / 6) % 4];
  g.drawImage(im, W / 2 - im.width - 2, y + 22, im.width * 2, im.height * 2);
  text(g, name, W / 2, y + 40, { align: 'center', color: '#fff' });
  tiny(g, hint, Math.round(W / 2 - tinyW(hint) / 2), y + 56, '#9fe8ff');
  if (t % 8 < 4) for (let i = 0; i < 6; i++) { const a2 = i / 6 * Math.PI * 2 + t * .05; g.fillStyle = '#fff4a0'; g.fillRect(Math.round(W / 2 + Math.cos(a2) * 36), Math.round(y + 28 + Math.sin(a2) * 14), 2, 2); }
}

// ============================================================
//  BOOT & TITLE
// ============================================================
class BootScene {
  init() { this.t = 0; this.ready = false; const done = () => { _tc.clear(); this.ready = true; }; try { Promise.race([document.fonts.load("8px 'Press Start 2P'"), new Promise(r => setTimeout(r, 2500))]).then(done, done); } catch (e) { done(); } }
  update() { this.t++; if (this.ready && this.t > 10) go(new TitleScene()); }
  draw(g) { g.fillStyle = '#07060b'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd84a'; for (let i = 0; i < 3; i++) if ((this.t >> 3) % 3 >= i) g.fillRect(W / 2 - 10 + i * 8, H / 2, 4, 4); }
}
class TitleScene {
  init() {
    this.t = 0; this.sel = 0; this.items = ['HISTORIA', 'PELEA RÁPIDA', 'CONTROLES'];
    this.stage = TITLE_STAGE || (TITLE_STAGE = buildStage({ theme: 'joaquin', tod: 'night', seed: 777, arena: 600, crowd: 10 }));
    this.hero = new Actor(CH.hero, 0, 1, { anim: 'idle' }); this.capo = new Actor(CH.capo, 0, -1, { anim: 'idle' });
    playMusic('rumba'); ambient('street'); this.started = false;
  }
  update() {
    this.t++; this.stage.update(); this.hero.update(); this.capo.update();
    if (!this.started) { if (Input.ok() || Input.hit('pause')) { this.started = true; sfx('confirm'); } return; }
    if (Input.hit('up')) { this.sel = (this.sel + 2) % 3; sfx('select'); }
    if (Input.hit('down')) { this.sel = (this.sel + 1) % 3; sfx('select'); }
    if (Input.ok()) {
      sfx('confirm');
      if (this.sel === 0) goFade(() => new CountryScene());
      if (this.sel === 1) goFade(() => new QuickScene());
      if (this.sel === 2) goFade(() => new ControlsScene());
    }
  }
  draw(g) {
    const camX = 400 + Math.sin(this.t * .004) * 180;
    this.stage.drawBack(g, camX); this.stage.drawCrowd(g, camX);
    this.hero.draw(g, 0 - 110); this.capo.draw(g, 0 - 290);
    this.stage.drawFront(g, camX);
    drawFade(g, .35, '#05020a');
    // logo
    const bob = Math.round(Math.sin(this.t * .05) * 2);
    textGrad(g, 'RAVAL', W / 2, 28 + bob, 32, ['#fff8d0', '#ffd860', '#ffa030', '#ff6020', '#d02818']);
    textGrad(g, 'FIGHTER', W / 2, 64 + bob, 24, ['#ffffff', '#ffb0b8', '#ff4a5a', '#b01830']);
    text(g, 'UNA HISTORIA DE BARRIO', W / 2, 94, { align: 'center', color: '#c8c0e0', outline: OUTL });
    drawFlag(g, 'es', W / 2 - 58, 12, 12, 8, this.t, 1); drawFlag(g, 'cat', W / 2 + 46, 12, 12, 8, this.t, 1);
    if (!this.started) { if ((this.t >> 5) % 2 === 0) text(g, 'PULSA ENTER', W / 2, 128, { align: 'center', color: '#fff', outline: OUTL, thick: 1 }); }
    else this.items.forEach((it, i) => {
      const y = 116 + i * 14, s = i === this.sel;
      if (s) { g.fillStyle = 'rgba(255,216,74,.18)'; g.fillRect(W / 2 - 70, y - 3, 140, 13); text(g, '▶', W / 2 - 64, y, { color: '#ffd84a' }); }
      text(g, it, W / 2, y, { align: 'center', color: s ? '#ffd84a' : '#c8c0e0', outline: OUTL });
    });
    tiny(g, '© 2026 RAVAL FIGHTER  ·  M: SONIDO', Math.round(W / 2 - tinyW('© 2026 RAVAL FIGHTER  ·  M: SONIDO') / 2), 216, 'rgba(255,255,255,.5)');
  }
}
let TITLE_STAGE = null;
class ControlsScene {
  init() { this.t = 0; }
  update() { this.t++; if (this.t > 10 && (Input.ok() || Input.hit('pause'))) { sfx('back'); goFade(() => new TitleScene()); } }
  draw(g) {
    g.fillStyle = '#0e0a1c'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { g.fillStyle = '#130e24'; g.fillRect(0, y, W, 2); }
    textGrad(g, 'CONTROLES', W / 2, 12, 16, ['#fff', '#ffd860', '#ff9030']);
    const rows = [['← →', 'MOVERSE (ATRÁS = BLOQUEAR)'], ['↑', 'SALTAR'], ['↓', 'AGACHARSE (↓+ATRÁS = BLOQ. BAJO)'], ['J / Z', 'PUÑETAZO  (J,J = COMBO)'], ['K / X', 'PATADA  (↓+K = BARRIDO)'], ['L / C', 'ESPECIAL: ¡CHANCLAZO!'], ['↓↘→ + J', 'ESPECIAL (MODO PRO)'], ['I / V', 'SUPER (BARRA AZUL LLENA)'], ['ENTER', 'CONFIRMAR / PASAR DIÁLOGO'], ['ESC / P', 'PAUSA · SALTAR ESCENA'], ['M', 'SONIDO ON/OFF']];
    rows.forEach(([k, v], i) => { const y = 38 + i * 15; text(g, k, 110, y, { align: 'right', color: '#ffd84a' }); text(g, v, 122, y, { color: '#e8e0ff' }); });
    tiny(g, 'TAMBIÉN FUNCIONA CON MANDO Y PANTALLA TÁCTIL', Math.round(W / 2 - tinyW('TAMBIÉN FUNCIONA CON MANDO Y PANTALLA TÁCTIL') / 2), 208, '#8a80b0');
  }
}

// ============================================================
//  COUNTRY SELECT
// ============================================================
class CountryScene {
  init() { this.t = 0; this.sel = 0; playMusic('rumba'); }
  update() {
    this.t++;
    if (Input.hit('left')) { this.sel = (this.sel + 5) % 6; sfx('select'); }
    if (Input.hit('right')) { this.sel = (this.sel + 1) % 6; sfx('select'); }
    if (Input.hit('up') || Input.hit('down')) { this.sel = (this.sel + 3) % 6; sfx('select'); }
    if (Input.hit('pause')) { sfx('back'); goFade(() => new TitleScene()); }
    if (Input.ok() && this.t > 8) { sfx('confirm'); GAME.country = COUNTRIES[this.sel]; GAME.startTime = performance.now(); GAME.continues = 0; stopMusic(); goFade(() => new AirportScene(), .03); }
  }
  draw(g) {
    g.fillStyle = '#10204a'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x += 1) if (bay(x, y) < y / H * .5) { g.fillStyle = '#0a1430'; g.fillRect(x, y, 1, 1); }
    textGrad(g, '¿DE DÓNDE VIENES?', W / 2, 14, 16, ['#fff', '#ffe8a0', '#ffc040']);
    COUNTRIES.forEach((c, i) => {
      const col = i % 3, row = Math.floor(i / 3), x = 50 + col * 110, y = 48 + row * 70, s = i === this.sel;
      const fw = 64, fh = 42;
      if (s) { g.fillStyle = (this.t >> 3) % 2 ? '#ffd84a' : '#fff'; g.fillRect(x - 4, y - 4, fw + 8, fh + 8); }
      g.fillStyle = OUTL; g.fillRect(x - 1, y - 1, fw + 2, fh + 2);
      drawFlag(g, c.id, x, y, fw, fh, this.t, s ? 2 : 0);
      text(g, c.name, x + fw / 2, y + fh + 8, { align: 'center', color: s ? '#ffd84a' : '#c8d0f0', outline: OUTL });
    });
    const c = COUNTRIES[this.sel];
    g.fillStyle = OUTL; g.fillRect(20, 190, W - 40, 26); g.fillStyle = '#1a1438'; g.fillRect(21, 191, W - 42, 24);
    text(g, 'SALIDA: ' + c.airport, W / 2, 196, { align: 'center', color: '#fff' });
    tiny(g, '← → ↑ ↓ ELEGIR   ENTER CONFIRMAR', Math.round(W / 2 - tinyW('← → ↑ ↓ ELEGIR   ENTER CONFIRMAR') / 2), 208, '#8a90c0');
  }
}

// ============================================================
//  AIRPORT — farewell
// ============================================================
class AirportScene extends Cutscene {
  init() {
    const c = C(); this.ap = buildAirport(c.id); this.camX = 0; this.camT = 0;
    CH.sis.shirt = FLAGCOL[c.id][0]; _spr.clear(); _ports.clear();
    this.hero = new Actor(CH.hero, 606, -1, { bag: true, anim: 'standBag' });
    this.mom = new Actor(CH.mom, 572, 1); this.dad = new Actor(CH.dad, 544, 1); this.sis = new Actor(CH.sis, 524, 1); this.abuela = new Actor(CH.abuela, 490, 1, { speed: .7 });
    this.actors = [this.sis, this.dad, this.abuela, this.mom, this.hero];
    const R = RNG(5);
    this.travellers = []; for (let i = 0; i < 4; i++) this.travellers.push({ def: randomNPC(R), x: R.i(0, 760), v: (R() < .5 ? -1 : 1) * R.r(.6, .9), t0: R.i(0, 60) });
    this.agent = new Actor(mkChar({ name: 'AGENTE', skin: '#c99064', hair: '#2a1b14', hairStyle: 'bun', jacket: '#2a4a7a', shirt: '#fff', pants: '#2a4a7a', seed: 777 }), 672, -1);
    playMusic('airport'); ambient('airport'); this.item = 0; this.skipTo = () => new FlightScene();
    this.run(this.script());
  }
  *script() {
    this.caption = [C().airport, 'HORA LOCAL 21:50'];
    this.camTarget = 330; yield* wait(170);
    sfx('chime'); yield* wait(50);
    this.caption = null;
    yield* this.say('mega', 'Pasajeros del vuelo RF-023 con destino Barcelona, embarquen por la puerta 12.', { auto: 110 });
    this.mom.set('cry'); this.mom.expr = 'sad';
    yield* this.say('mom', `Ay, ${C().son}... ¿llevas todo? ¿El pasaporte? ¿La chaqueta? ¿Los tuppers?`, { expr: 'sad' });
    yield* this.say('hero', 'Sí, mamá. Todo. Tranquila, que no me voy a la guerra.', { right: true });
    this.dad.set('pockets');
    yield* this.say('dad', 'Allá cuídate mucho. Y no le hables a desconocidos por la calle.');
    this.sis.set('wave');
    yield* this.say('sis', '¡Y tráeme una camiseta del Barça!', { expr: 'happy' });
    this.abuela.walkTo(588, .6); yield* until(() => this.abuela.arrived); this.abuela.set('give');
    yield* this.say('abuela', `Toma, ${C().son}. La chancla de la abuela. Para lo que haga falta.`, { expr: 'happy' });
    this.item = 1; sfx('item'); yield* wait(40); yield* until(() => this.item > 60 && Input.ok()); this.item = 0; this.abuela.set('stand');
    this.hero.expr = 'happy';
    yield* this.say('hero', 'Jajaja... gracias, abuela. Los voy a extrañar muchísimo.', { right: true, expr: 'happy' });
    this.abuela.walkTo(500, .7, 1);
    this.hero.bag = false; this.hero.set('hug'); this.hero.x = 592; this.mom.set('hug'); this.mom.x = 580; this.hero.expr = 'blink'; this.mom.expr = 'blink';
    yield* wait(110);
    this.mom.set('cry'); this.mom.x = 566; this.hero.x = 606; this.hero.bag = true; this.hero.set('standBag'); this.hero.expr = 'proud';
    yield* this.say('hero', 'Les escribo apenas llegue. ¡Barcelona, allá voy!', { right: true, expr: 'proud' });
    this.sis.set('wave'); this.dad.set('wave'); this.abuela.set('wave');
    for (const a of [this.sis, this.dad, this.abuela, this.mom]) if (a.arrived) a.facing = 1;
    this.hero.walkAnim = 'walkBag'; this.hero.idleAnim = 'standBag'; this.hero.walkTo(700, 1); this.camTarget = 360;
    yield* until(() => this.hero.arrived); this.hero.facing = -1; this.hero.expr = 'normal'; yield* wait(40);
    this.hero.walkTo(820, 1); yield* wait(90);
    goFade(() => new FlightScene(), .025);
  }
  update() {
    if (this.camTarget != null) this.camX += (this.camTarget - this.camX) * .02;
    for (const tr of this.travellers) { tr.x += tr.v; if (tr.x < -40) tr.x = 800; if (tr.x > 800) tr.x = -40; }
    if (this.item) this.item++;
    this.step();
  }
  draw(g) {
    const camX = Math.round(this.camX);
    g.drawImage(this.ap.bg, -camX, 0);
    drawFloor(g, this.ap.floor, camX);
    g.drawImage(this.ap.chairs, -camX, 136);
    for (const tr of this.travellers) { const sx = tr.x - camX; if (sx < -30 || sx > W + 30) continue; const spr = getSprite(tr.def, 'walkBag', this.t + tr.t0); drawSuitcase(g, sx, 172, Math.sign(tr.v), spr, true); drawSpr(g, spr, sx, 172, Math.sign(tr.v)); }
    this.agent.draw(g, camX);
    g.fillStyle = OUTL; g.fillRect(640 - camX, 170, 60, 30); g.fillStyle = '#2a4a7a'; g.fillRect(641 - camX, 171, 58, 29); g.fillStyle = '#4a7aba'; g.fillRect(641 - camX, 171, 58, 2); tiny(g, 'PUERTA 12', 652 - camX, 180, '#fff');
    for (const a of this.actors) a.draw(g, camX);
    this.drawOverlay(g);
    if (this.item) drawItemGet(g, this.item, 'LA CHANCLA DE LA ABUELA', 'ESPECIAL: TECLA L  ·  O  ↓ ↘ → + J');
  }
}

// ============================================================
//  FLIGHT — map, window, proud close-up
// ============================================================
let _skyline = null;
function skyline() {
  if (_skyline) return _skyline;
  const [c, g] = mk(420, 70); const col = '#6a7a98', col2 = '#586884', hi = '#8a9ab8';
  // Montjuic
  for (let x = 0; x < 110; x++) { const h = 26 * Math.sin(Math.min(1, x / 110) * Math.PI); g.fillStyle = '#5a7a5a'; g.fillRect(x, 70 - h - 8, 1, h + 8); }
  g.fillStyle = '#7a8a7a'; g.fillRect(48, 36, 14, 6); g.fillRect(46, 34, 3, 3); g.fillRect(60, 34, 3, 3);
  // city blocks
  const R = RNG(4);
  for (let x = 90; x < 420; x += R.i(4, 9)) { const h = R.i(8, 18); g.fillStyle = R() < .5 ? col : col2; g.fillRect(x, 70 - h - 6, R.i(5, 10), h + 6); g.fillStyle = hi; if (R() < .5) g.fillRect(x + 1, 70 - h - 5, 1, 1); }
  // Sagrada Familia
  const sf = 250; for (const [dx, h] of [[-8, 30], [-5, 36], [-2, 40], [2, 40], [5, 36], [8, 30], [0, 48]]) { g.fillStyle = '#7a7060'; g.fillRect(sf + dx - 1, 70 - h - 6, 3, h); g.fillStyle = '#c8a040'; g.fillRect(sf + dx, 70 - h - 7, 1, 2); }
  g.fillStyle = '#7a7060'; g.fillRect(sf - 11, 70 - 22, 22, 16);
  // Torre Glories
  const tg = 320; for (let y = 0; y < 34; y++) { const w = Math.round(6 * Math.sqrt(Math.min(1, (y + 2) / 12))); g.fillStyle = y % 3 ? '#4a6ab0' : '#c04a4a'; g.fillRect(tg - w, 70 - 6 - 34 + y, w * 2, 1); }
  // W hotel sail
  polyFill(g, [pt(400, 64), pt(408, 64), pt(404, 30)], '#8aa8c8');
  // port cranes
  g.fillStyle = '#b84a3a'; for (const cx of [150, 170]) { g.fillRect(cx, 40, 2, 24); g.fillRect(cx - 6, 40, 14, 2); }
  _skyline = c; return c;
}
let _winMask = null; const VW = 150, VH = 172;
function winMask(w, h) {
  if (_winMask) return _winMask; let g; [_winMask, g] = mk(w, h); const r = 34;
  g.fillStyle = '#fff';
  for (let y = 0; y < h; y++) { let x0 = 0; if (y < r) x0 = r - Math.sqrt(r * r - (r - y) ** 2); else if (y > h - r) x0 = r - Math.sqrt(r * r - (y - (h - r)) ** 2); x0 = Math.round(x0); g.fillRect(x0, y, w - 2 * x0, 1); }
  return _winMask;
}
class FlightScene extends Cutscene {
  init() {
    this.map = buildMap(); this.ph = 'map'; this.pt = 0; playMusic('flight'); ambient('plane'); this.skipTo = () => new StageScene(0, { mode: 'arrival' });
    const cty = CITIES[C().id]; this.from = geoXY(cty[0], cty[1]); this.to = geoXY(41.4, 2.2); this.cityName = cty[2];
    [this.view, this.vg] = mk(VW, VH);
    this.clouds = []; const R = RNG(9); for (let i = 0; i < 30; i++) this.clouds.push({ x: R.r(0, 200), y: R.r(20, VH), s: R.r(.5, 1.6), r: R.r(5, 13), l: R.i(0, 2) });
    this.run(this.script());
  }
  *script() {
    yield* wait(250); sfx('whoosh');
    this.ph = 'window'; this.pt = 0; this.caption = ['12 HORAS DESPUÉS...', 'SOBREVOLANDO EL MEDITERRÁNEO'];
    yield* wait(200); this.caption = null;
    yield* wait(260);
    yield* wait(200);
    this.ph = 'close'; this.pt = 0; sfx('whoosh');
    yield* wait(60);
    yield* this.say('hero', 'España... Barcelona...', { expr: 'proud', bottom: true });
    yield* this.say('hero', 'Aquí empieza mi nueva vida. Mamá, abuela... lo voy a lograr.', { expr: 'proud', bottom: true });
    goFade(() => new StageScene(0, { mode: 'arrival' }), .03);
  }
  update() { this.pt++; this.step(); }
  drawView(t) {
    const g = this.vg, w = VW, h = VH;
    // phases inside window: 0-200 cruise, 200-460 descend, 460+ ground with flag
    const d = clamp((t - 200) / 260, 0, 1), gnd = t > 460;
    if (!gnd) {
      const top = d < .5 ? ['#2e5aa8', '#4a78c0', '#6a98d4', '#9ab8e0', '#e8c890', '#f4b070'] : ['#4a7ac8', '#6a98d8', '#8ab4e4', '#a8c8ec', '#c8dcf0', '#e0ecf6'];
      for (let y = 0; y < h; y++) { const k = y / h * (top.length - 1), i = Math.floor(k); for (let x = 0; x < w; x += 2) { g.fillStyle = (k - i) > bay(x >> 1, y) ? top[Math.min(top.length - 1, i + 1)] : top[i]; g.fillRect(x, y, 2, 1); } }
      if (d < .5) { g.drawImage(glowSprite(26, '#fff0c0', .8), w - 70, h - 90); stamp(g, w - 44, h - 64, 14, '#fff6d8'); }
      if (d > 0) {
        const seaY = Math.round(lerp(h + 10, 92, d));
        g.fillStyle = '#2a5a9a'; g.fillRect(0, seaY, w, h - seaY);
        g.fillStyle = '#3a6aaa'; for (let y = seaY + 4; y < h; y += 5) g.fillRect(0, y, w, 1);
        g.fillStyle = '#9ac8f0'; for (let i = 0; i < 26; i++) g.fillRect(((i * 23 + t * .6) % (w + 10)) - 5, seaY + 6 + (i * 11) % Math.max(1, h - seaY - 6), 3, 1);
        const sk = skyline(); g.drawImage(sk, Math.round(-40 - d * 180), seaY - 64);
        g.fillStyle = '#e8d8b0'; g.fillRect(0, seaY, w, 2);
      }
      for (const c of this.clouds) {
        c.x -= c.s * (1 + d * .5); if (c.x < -24) { c.x = w + 24; }
        const cy = c.y - d * 220 * (c.l + 1) * .5;
        if (cy < -24 || cy > h + 24) continue;
        stamp(g, c.x, cy + 3, c.r * 2 + 3, '#b8c8e0'); stamp(g, c.x, cy, c.r * 2, '#ffffff'); stamp(g, c.x - c.r * .7, cy + 2, c.r * 1.3, '#f0f4fc'); stamp(g, c.x + c.r * .8, cy + 1, c.r * 1.5, '#ffffff');
      }
      // wing
      polyFill(g, [pt(-10, h - 30), pt(100, h - 52), pt(112, h - 50), pt(-10, h - 6)], '#c8ccd4');
      polyFill(g, [pt(-10, h - 20), pt(102, h - 50), pt(112, h - 50), pt(-10, h - 6)], '#8a8e96');
      g.fillStyle = '#e8ecf0'; for (let i = 0; i < 5; i++) g.fillRect(10 + i * 18, h - 33 - i * 4, 8, 1);
      g.fillStyle = t % 40 < 4 ? '#ff3030' : '#802020'; g.fillRect(108, h - 52, 3, 2);
    } else {
      const k = t - 460;
      for (let y = 0; y < h; y++) { g.fillStyle = y < 80 ? mix('#7ab4ec', '#d8ecf8', Math.floor(y / 10) / 8) : '#6a6e78'; g.fillRect(0, y, w, 1); }
      g.fillStyle = '#d8dce0'; g.fillRect(0, 62, w, 20); g.fillStyle = '#6a8aa8'; for (let x = 0; x < w; x += 6) g.fillRect(x + 1, 66, 4, 11);
      g.fillStyle = '#b8bcc0'; g.fillRect(118, 26, 8, 56); g.fillRect(112, 20, 20, 8); g.fillStyle = '#4a6a8a'; g.fillRect(113, 21, 18, 4);
      tiny(g, 'BARCELONA', 8, 56, '#2a4a7a'); tiny(g, 'EL PRAT', 48, 56, '#2a4a7a');
      g.fillStyle = '#f4f4f4'; for (let x = -((k * 1.4) % 24); x < w; x += 24) g.fillRect(Math.round(x), 132, 12, 2);
      g.fillStyle = '#f2c14e'; g.fillRect(0, 150, w, 1);
      // flag pole with big waving flag
      g.fillStyle = '#d0d4d8'; g.fillRect(34, 10, 3, 110); g.fillStyle = '#fff'; g.fillRect(34, 10, 1, 110); stamp(g, 35, 9, 4, '#f2c14e');
      drawFlag(g, 'es', 37, 14, 66, 44, t, 4);
    }
  }
  draw(g) {
    const t = this.pt;
    if (this.ph === 'map') {
      g.drawImage(this.map, 0, 0);
      const a = this.from, b = this.to, cp = pt((a.x + b.x) / 2, Math.min(a.y, b.y) - 60), k = clamp(t / 220, 0, 1);
      const bz = (u) => pt((1 - u) ** 2 * a.x + 2 * (1 - u) * u * cp.x + u * u * b.x, (1 - u) ** 2 * a.y + 2 * (1 - u) * u * cp.y + u * u * b.y);
      for (let i = 0; i <= 60; i++) { const u = i / 60; if (u > k) break; if (i % 2) continue; const p = bz(u); g.fillStyle = '#ffd84a'; g.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
      for (const [p, n] of [[a, this.cityName], [b, 'BARCELONA']]) { stamp(g, p.x, p.y, 6, OUTL); stamp(g, p.x, p.y, 4, t % 30 < 15 ? '#ff4a4a' : '#fff'); tiny(g, n, Math.round(p.x - tinyW(n) / 2), Math.round(p.y) + 5, '#fff'); }
      const pp = bz(k), pn = bz(Math.min(1, k + .01)), ang = Math.atan2(pn.y - pp.y, pn.x - pp.x);
      g.save(); g.translate(Math.round(pp.x), Math.round(pp.y)); g.rotate(Math.round(ang / (Math.PI / 4)) * Math.PI / 4);
      g.fillStyle = OUTL; g.fillRect(-6, -2, 12, 4); g.fillRect(-2, -6, 4, 12); g.fillStyle = '#fff'; g.fillRect(-5, -1, 10, 2); g.fillRect(-1, -5, 2, 10); g.fillRect(-5, -3, 1, 6); g.restore();
      drawCaption(g, ['VUELO RF-023', this.cityName + ' → BARCELONA']);
    } else if (this.ph === 'window') {
      // cabin wall with panels, overhead bin & seats
      g.fillStyle = '#dcd0b8'; g.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x += 2) if (bay(x >> 1, y) < Math.abs(x - W / 2) / W * .6) { g.fillStyle = '#cfc2a8'; g.fillRect(x, y, 2, 1); }
      g.fillStyle = '#b8ac94'; g.fillRect(0, 0, W, 16); g.fillStyle = '#a89c84'; g.fillRect(0, 16, W, 2); g.fillStyle = '#e8e0cc'; g.fillRect(0, 14, W, 1);
      for (let x = 20; x < W; x += 60) { g.fillStyle = '#8a8070'; g.fillRect(x, 6, 16, 4); g.fillStyle = t % 120 < 60 && x === 200 ? '#fff4c0' : '#c8c0a8'; g.fillRect(x + 1, 7, 6, 2); }
      const vx = W / 2 - VW / 2, vy = 26;
      g.fillStyle = '#c4b8a0'; g.fillRect(vx - 18, vy - 14, VW + 36, VH + 26);
      g.fillStyle = '#ece6d8'; g.fillRect(vx - 13, vy - 10, VW + 26, VH + 18);
      g.fillStyle = '#b0a898'; g.fillRect(vx - 5, vy - 4, VW + 10, VH + 8);
      this.drawView(t);
      const vg2 = this.vm || (this.vm = mk(VW, VH)); vg2[1].globalCompositeOperation = 'source-over'; vg2[1].clearRect(0, 0, VW, VH); vg2[1].drawImage(this.view, 0, 0); vg2[1].globalCompositeOperation = 'destination-in'; vg2[1].drawImage(winMask(VW, VH), 0, 0);
      g.drawImage(vg2[0], vx, vy);
      if (t > 470) { g.globalAlpha = .13; g.drawImage(portraitCanvas(CH.hero, 'proud'), vx + 36, vy + 60, 85, 85); g.globalAlpha = 1; }
      // glass glare
      g.globalAlpha = .12; polyFill(g, [pt(vx + 20, vy + 10), pt(vx + 34, vy + 10), pt(vx + 10, vy + 80), pt(vx - 4, vy + 80)], '#ffffff'); g.globalAlpha = 1;
      g.fillStyle = '#f4eee2'; g.fillRect(vx + 18, vy - 3, VW - 36, 6); g.fillStyle = '#c8c0b0'; g.fillRect(vx + 18, vy + 3, VW - 36, 1); g.fillStyle = '#a8a090'; g.fillRect(W / 2 - 4, vy + 4, 8, 3);
      // seat headrests in the foreground
      g.fillStyle = OUTL; g.fillRect(-2, 150, 92, 80); g.fillStyle = '#2a3a6a'; g.fillRect(0, 152, 88, 78); g.fillStyle = '#3a4a80'; g.fillRect(0, 152, 88, 3); g.fillStyle = '#e8e4dc'; g.fillRect(10, 156, 60, 18); g.fillStyle = '#c8c4bc'; g.fillRect(10, 172, 60, 2);
      g.fillStyle = OUTL; g.fillRect(W - 90, 150, 92, 80); g.fillStyle = '#2a3a6a'; g.fillRect(W - 88, 152, 88, 78); g.fillStyle = '#3a4a80'; g.fillRect(W - 88, 152, 88, 3);
      this.drawOverlay(g);
    } else {
      // close-up
      g.fillStyle = '#c8b894'; g.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x += 2) if (bay(x, y) < x / W * .5) { g.fillStyle = '#b8a884'; g.fillRect(x, y, 2, 1); }
      // window with flag on right
      const wx = 250, wy = 14; g.fillStyle = '#e8e2d4'; g.fillRect(wx - 6, wy - 6, 120, 134);
      g.fillStyle = '#9ac8f0'; g.fillRect(wx, wy, 108, 122); g.fillStyle = '#d8dce0'; g.fillRect(wx, wy + 70, 108, 20); g.fillStyle = '#6a6e78'; g.fillRect(wx, wy + 90, 108, 32);
      g.fillStyle = '#d0d4d8'; g.fillRect(wx + 20, wy + 6, 3, 100); g.fillStyle = OUTL; g.fillRect(wx + 23, wy + 9, 72, 48); drawFlag(g, 'es', wx + 23, wy + 10, 70, 46, this.t, 4);
      // portrait, big
      const pc = portraitHi(CH.hero, 'proud', 2), s = 4, px = 70, py = 6 + Math.round(Math.sin(this.t * .03));
      g.drawImage(pc, px, py);
      // sparkle
      const sp = (this.t % 90) / 90; if (sp < .3) { const k = Math.sin(sp / .3 * Math.PI); const cx = px + 20 * s + 6, cy = py + 14 * s + 6; g.fillStyle = '#fff'; g.fillRect(cx - Math.round(k * 5), cy, Math.round(k * 10) + 1, 1); g.fillRect(cx, cy - Math.round(k * 5), 1, Math.round(k * 10) + 1); }
      this.drawOverlay(g);
    }
  }
}

// ============================================================
//  PHONE UI (route map / messages)
// ============================================================
function drawPhone(g, x, y, t, stageIdx, msg) {
  const w = 92, h = 140;
  g.fillStyle = OUTL; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = '#1e1e26'; g.fillRect(x, y, w, h); g.fillStyle = '#3a3a46'; g.fillRect(x + 1, y + 1, w - 2, 1);
  g.fillStyle = '#0c0c12'; g.fillRect(x + 36, y + 4, 20, 3);
  const sx = x + 5, sy = y + 10, sw = w - 10, sh = h - 22;
  g.fillStyle = '#e8e6de'; g.fillRect(sx, sy, sw, sh);
  // status bar
  g.fillStyle = '#2a2a36'; g.fillRect(sx, sy, sw, 7); tiny(g, '12:4' + (stageIdx + 1), sx + 2, sy + 1, '#fff'); g.fillStyle = '#6aff8a'; g.fillRect(sx + sw - 10, sy + 2, 7, 3);
  if (msg) {
    g.fillStyle = '#ff5a5f'; g.fillRect(sx, sy + 7, sw, 10); tiny(g, 'AIRBNB', sx + 3, sy + 10, '#fff');
    g.drawImage(portraitCanvas(CH.host, 'happy'), sx + 2, sy + 20, 17, 17);
    tiny(g, 'JORDI', sx + 22, sy + 24, '#333');
    const lines = msg; g.fillStyle = '#fff'; g.fillRect(sx + 3, sy + 40, sw - 6, lines.length * 7 + 5);
    lines.forEach((l, i) => tiny(g, l, sx + 5, sy + 43 + i * 7, '#223'));
    return;
  }
  // map
  g.fillStyle = '#d8d4c8'; g.fillRect(sx, sy + 7, sw, sh - 7);
  const mx = sx, my = sy + 7, R = RNG(3);
  g.fillStyle = '#f8f6f0';
  for (let i = 0; i < 9; i++) g.fillRect(mx, my + 6 + i * 11 + R.i(-2, 2), sw, 2);
  for (let i = 0; i < 7; i++) g.fillRect(mx + 4 + i * 12 + R.i(-2, 2), my, 2, sh - 7);
  g.fillStyle = '#f2c14e'; polyFill(g, [pt(mx + sw - 16, my), pt(mx + sw - 10, my), pt(mx + sw - 4, my + sh), pt(mx + sw - 10, my + sh)], '#f2c14e');
  tiny(g, 'RAMBLA', mx + sw - 26, my + sh - 20, '#8a6a20');
  g.fillStyle = '#9ad08a'; g.fillRect(mx + 8, my + 30, 22, 12); tiny(g, 'MACBA', mx + 9, my + 33, '#2a5a2a');
  const route = [pt(mx + sw - 12, my + sh - 12), pt(mx + 52, my + sh - 20), pt(mx + 40, my + 70), pt(mx + 22, my + 48), pt(mx + 44, my + 26), pt(mx + 30, my + 12)];
  for (let i = 0; i < route.length - 1; i++) { const a = route[i], b = route[i + 1]; seg(g, a, b, 2, i < stageIdx ? '#8a8a9a' : '#2a70e0'); }
  const pin = route[route.length - 1]; g.fillStyle = OUTL; g.fillRect(pin.x - 3, pin.y - 7, 7, 7); g.fillStyle = '#ff5a5f'; g.fillRect(pin.x - 2, pin.y - 6, 5, 5); g.fillRect(pin.x, pin.y - 1, 1, 2);
  const cur = route[Math.min(stageIdx, route.length - 1)]; stamp(g, cur.x, cur.y, 7, '#fff'); stamp(g, cur.x, cur.y, 5, t % 30 < 15 ? '#2a70e0' : '#6aa0ff');
  g.fillStyle = '#2a2a36'; g.fillRect(sx, sy + sh - 12, sw, 12);
  tiny(g, STAGES[stageIdx].dist + ' AL AIRBNB', sx + 3, sy + sh - 9, '#fff');
}

// ============================================================
//  STAGE — walk, encounter, fight, aftermath
// ============================================================
class StageScene extends Cutscene {
  constructor(idx, o = {}) { super(); this.idx = idx; this.mode = o.mode || 'story'; }
  init() {
    const st = this.st = STAGES[this.idx]; GAME.stage = this.idx;
    this.arenaC = 620;
    this.world = buildStage({ theme: st.theme, tod: st.tod, seed: st.seed, arena: this.arenaC, crowd: 9 });
    this.hero = new Actor(CH.hero, 40, 1, { bag: true, anim: 'standBag', walkAnim: 'walkBag' });
    this.enemy = null; this.fight = null; this.camX = 0; this.phase = 'cut'; this.paused = false; this.pauseSel = 0; this.bagAt = null; this.phoneT = 0; this.tut = 0;
    this.actors = [this.hero];
    ambient(st.tod === 'rain' ? 'rain' : 'street');
    if (this.mode === 'retry' || this.mode === 'quick') { this.startFight(true); return; }
    playMusic('rumba');
    this.skipTo = null;
    this.run(this.script());
  }
  *script() {
    const st = this.st;
    if (this.mode === 'arrival') {
      this.hero.x = 26; this.hero.alpha = 0;
      this.caption = ['METRO LICEU · EL RAVAL', 'BARCELONA · 12:40'];
      for (let i = 0; i < 20; i++) { this.hero.alpha = i / 20; yield; }
      this.hero.walkTo(120, 1); yield* until(() => this.hero.arrived);
      this.caption = null;
      this.hero.set('phoneBag'); yield* wait(30);
      this.phone = { msg: ['¡BIENVENIDO!', 'RIERA BAIXA 23.', 'EL BARRIO ES', 'MUY TRANQUILO :)'] }; sfx('beep', 1500); yield* wait(10); sfx('beep', 1800);
      yield* wait(60); yield* until(() => Input.ok()); this.phone = null;
      yield* this.say('hero', 'Muy tranquilo... Vale. 850 metros. Pan comido.', { right: true });
      this.hero.set('standBag');
    } else {
      this.hero.x = 30;
      this.phone = { map: true }; sfx('beep', 1500);
      this.caption = [st.name, 'QUEDAN ' + st.dist];
      yield* wait(150); this.phone = null; this.caption = null;
    }
    // walking under player control
    this.phase = 'walk';
    yield* until(() => this.hero.x >= this.arenaC - 60);
    this.phase = 'cut'; this.hero.x = this.arenaC - 60; this.hero.set('standBag'); this.hero.facing = 1;
    // enemy entrance
    playMusic(null);
    const e = this.enemy = new Actor(CH[st.enemy], this.camX + W + 30, -1, { anim: st.introAnim, speed: 1.2 });
    this.actors.push(e); e.walkTo(this.arenaC + 60); yield* until(() => e.arrived); e.facing = -1;
    sfx('ooh');
    const lines = st.intro();
    for (const [who, txt] of lines) yield* this.say(who, txt, { right: who !== 'hero', expr: who === 'hero' ? (txt.includes('!') ? 'angry' : 'normal') : undefined });
    this.startFight(false);
  }
  startFight(direct) {
    const st = this.st;
    this.bagAt = this.arenaC - 150;
    this.hero.bag = false;
    if (!this.enemy) { this.enemy = new Actor(CH[st.enemy], this.arenaC + 60, -1, { anim: st.introAnim }); this.actors.push(this.enemy); }
    this.phase = 'fight'; this.caption = null;
    this.fight = new Fight({ stage: this.world, center: this.arenaC, heroDef: CH.hero, enemyDef: CH[st.enemy], ai: st.ai, place: st.name, music: st.music, onEnd: w => this.endFight(w) });
    this.fight.camX = direct ? this.fight.camX : this.camX;
    if (this.idx === 0 && !GAME.tutorialShown && this.mode !== 'quick') { this.tut = 1; GAME.tutorialShown = true; }
    playMusic(st.music);
  }
  endFight(win) {
    const F = this.fight;
    if (!win) { playMusic('gameover'); setTimeout(() => goFade(() => this.mode === 'quick' ? new QuickScene() : new ContinueScene(this.idx), .03), 900); return; }
    if (this.mode === 'quick') { goFade(() => new QuickScene(this.idx), .03); return; }
    // aftermath
    this.phase = 'after'; this.camX = F.camX;
    this.hero.x = F.p.x; this.hero.facing = F.p.facing; this.hero.set('win'); this.hero.expr = 'happy';
    this.enemy.x = F.e.x; this.enemy.facing = F.e.facing; this.enemy.set('lie'); this.enemy.expr = 'ko';
    this.fight = null; this.run(this.afterScript());
  }
  *afterScript() {
    yield* wait(30);
    yield* this.say('hero', pick(WIN_QUOTES), { expr: 'happy' });
    this.enemy.set('sit'); this.enemy.expr = 'hurt'; yield* wait(20);
    for (const [who, txt] of this.st.outro()) yield* this.say(who, txt, { right: true, expr: 'hurt' });
    this.hero.expr = 'normal';
    if (this.idx === STAGES.length - 1) { goFade(() => new EndingScene(this.hero.x, this.camX), .03); return; }
    // pick up the suitcase and move on
    playMusic('rumba');
    this.hero.set('stand'); this.hero.walkAnim = 'walk'; this.hero.walkTo(this.bagAt + 12, 1.4); yield* until(() => this.hero.arrived);
    this.bagAt = null; this.hero.bag = true; this.hero.walkAnim = 'walkBag'; this.hero.set('standBag'); sfx('select'); yield* wait(20);
    this.camLock = true; this.hero.walkTo(this.camX + W + 40, 1.2); yield* wait(40);
    this.hero.walkTo(WORLD_W + 60, 1.2);
    yield* wait(150);
    goFade(() => new StageScene(this.idx + 1), .03);
  }
  update() {
    if (this.paused) {
      if (Input.hit('up') || Input.hit('down')) { this.pauseSel ^= 1; sfx('select'); }
      if (Input.hit('pause')) { this.paused = false; sfx('back'); }
      if (Input.ok()) { sfx('confirm'); if (this.pauseSel === 0) this.paused = false; else { this.paused = false; goFade(() => new TitleScene()); } }
      return;
    }
    if (Input.hit('pause') && (this.phase === 'fight' || this.phase === 'walk')) { this.paused = true; this.pauseSel = 0; sfx('select'); return; }
    this.world.update();
    if (this.phase === 'walk') {
      const r = Input.held.right, l = Input.held.left;
      if (r || l) { this.hero.facing = r ? 1 : -1; this.hero.x = clamp(this.hero.x + (r ? 1.25 : -1.1), 16, WORLD_W); this.hero.anim !== 'walkBag' && (this.hero.anim = 'walkBag'); }
      else if (this.hero.anim === 'walkBag') { this.hero.anim = 'standBag'; this.hero.t = 0; }
    }
    if (this.fight) { const F = this.fight; F.update(); if (this.fight === F) this.camX = F.camX; if (this.tut) this.tut++; }
    else if (!this.camLock) { const tgt = clamp(this.hero.x - 150, 0, WORLD_W - W); this.camX += (tgt - this.camX) * .1; }
    this.step();
  }
  draw(g) {
    const camX = Math.round(this.camX), wd = this.world;
    wd.drawBack(g, camX); wd.drawCrowd(g, camX);
    if (this.bagAt != null) { shadow(g, this.bagAt - camX, GROUND, 12, .35); drawSuitcaseAt(g, this.bagAt - camX, GROUND); }
    if (this.fight) this.fight.drawWorld(g);
    else for (const a of this.actors) a.draw(g, camX);
    wd.drawFront(g, camX);
    if (this.fight) { this.fight.drawHUD(g); if (this.tut && this.tut < 420) drawTutorial(g, this.tut); }
    if (this.phase === 'walk') { if ((this.caption = null, (wd.t >> 5) % 2 === 0)) { text(g, 'CAMINA  →', W - 20, 40, { align: 'right', color: '#fff', outline: OUTL, thick: 1 }); } tiny(g, STAGES[this.idx].name, 8, 8, '#fff'); }
    if (this.phone) drawPhone(g, W - 110, 20, wd.t, this.idx, this.phone.msg);
    this.drawOverlay(g);
    if (this.paused) {
      drawFade(g, .6, '#05020a');
      textGrad(g, 'PAUSA', W / 2, 70, 24, ['#fff', '#ffd860', '#ff9030']);
      ['CONTINUAR', 'SALIR AL MENÚ'].forEach((s, i) => text(g, (i === this.pauseSel ? '▶ ' : '  ') + s, W / 2, 112 + i * 16, { align: 'center', color: i === this.pauseSel ? '#ffd84a' : '#c8c0e0', outline: OUTL }));
    }
  }
}
function drawTutorial(g, t) {
  const a = t < 20 ? t / 20 : t > 400 ? (420 - t) / 20 : 1; if (a <= 0) return;
  const x = 64, y = 44, w = 272, h = 56;
  g.globalAlpha = a;
  g.fillStyle = OUTL; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = 'rgba(16,10,34,.92)'; g.fillRect(x, y, w, h); g.fillStyle = '#ffd84a'; g.fillRect(x, y, w, 1);
  const rows = ['← →  MOVER    ↑  SALTAR    ↓  AGACHARSE', 'J  PUÑO   K  PATADA   L  CHANCLAZO', 'I  SUPER (BARRA AZUL LLENA)', 'MANTÉN  ATRÁS  PARA BLOQUEAR'];
  rows.forEach((r, i) => tiny(g, r, Math.round(W / 2 - tinyW(r) / 2), y + 8 + i * 12, i === 3 ? '#9fe8ff' : '#fff'));
  g.globalAlpha = 1;
}

// ============================================================
//  CONTINUE / GAME OVER
// ============================================================
class ContinueScene {
  constructor(idx) { this.idx = idx; }
  init() { this.t = 0; this.n = 9; this.over = false; ambient(null); }
  update() {
    this.t++;
    if (this.over) { if (this.t > 200 || (this.t > 40 && Input.ok())) goFade(() => new TitleScene()); return; }
    if (this.t % 70 === 0) { this.n--; sfx('tick'); if (this.n < 0) { this.over = true; this.t = 0; playMusic('gameover'); } }
    if (Input.ok() && this.t > 20) { sfx('confirm'); GAME.continues++; goFade(() => new StageScene(this.idx, { mode: 'retry' })); }
    if (Input.hit('kick')) this.t += 69 - (this.t % 70);
  }
  draw(g) {
    g.fillStyle = '#0a0612'; g.fillRect(0, 0, W, H);
    const pc = portraitCanvas(CH.hero, this.over ? 'ko' : 'hurt');
    g.globalAlpha = .9; g.drawImage(portraitHi(CH.hero, this.over ? 'ko' : 'hurt', 1), W / 2 - 34, 40); g.globalAlpha = 1;
    if (this.over) { textGrad(g, 'GAME OVER', W / 2, 150, 24, ['#fff', '#ff9a9a', '#ff3030', '#901020']); text(g, 'EL RAVAL TE HA GANADO... POR AHORA.', W / 2, 186, { align: 'center', color: '#c8c0e0' }); return; }
    textGrad(g, '¿CONTINUAR?', W / 2, 140, 16, ['#fff', '#ffe8a0', '#ffc040']);
    textGrad(g, String(Math.max(0, this.n)), W / 2, 164, 32, ['#fff', '#ffd860', '#ff6020']);
    text(g, 'ENTER: ¡OTRA VEZ!', W / 2, 206, { align: 'center', color: (this.t >> 4) % 2 ? '#fff' : '#ffd84a' });
  }
}

// ============================================================
//  QUICK FIGHT
// ============================================================
class QuickScene {
  constructor(sel = 0) { this.sel = sel; }
  init() { this.t = 0; playMusic('rumba'); ambient(null); }
  update() {
    this.t++;
    if (Input.hit('left')) { this.sel = (this.sel + STAGES.length - 1) % STAGES.length; sfx('select'); }
    if (Input.hit('right')) { this.sel = (this.sel + 1) % STAGES.length; sfx('select'); }
    if (Input.hit('pause')) { sfx('back'); goFade(() => new TitleScene()); }
    if (Input.ok() && this.t > 8) { sfx('confirm'); const s = this.sel; goFade(() => new StageScene(s, { mode: 'quick' })); }
  }
  draw(g) {
    g.fillStyle = '#1a0e24'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 20; i++) { g.fillStyle = '#241634'; g.fillRect(((i * 40 + this.t) % (W + 40)) - 40, 0, 20, H); }
    textGrad(g, 'ELIGE RIVAL', W / 2, 12, 16, ['#fff', '#ffb0b8', '#ff4a5a']);
    STAGES.forEach((s, i) => {
      const x = 28 + i * 72, y = 44, sel = i === this.sel, d = CH[s.enemy];
      g.fillStyle = sel ? ((this.t >> 3) % 2 ? '#ffd84a' : '#fff') : OUTL; g.fillRect(x - 3, y - 3, 58, 58);
      g.fillStyle = mix(d.color || '#888', '#141028', .5); g.fillRect(x, y, 52, 52);
      g.drawImage(portraitHi(d, sel ? 'angry' : 'normal', 1), x - 8, y - 8);
    });
    const s = STAGES[this.sel], d = CH[s.enemy];
    const spr = getSprite(d, 'idle', this.t, d.expr); drawSpr(g, spr, 350, 206, -1);
    const hs = getSprite(CH.hero, 'idle', this.t); drawSpr(g, hs, 50, 206, 1);
    textGrad(g, d.name, W / 2, 118, 16, ['#fff', '#ffe8a0', '#ffc040']);
    text(g, s.name, W / 2, 142, { align: 'center', color: '#c8c0e0', outline: OUTL });
    text(g, 'VS', W / 2, 170, { align: 'center', color: '#ff4a5a', outline: OUTL, thick: 1 });
    tiny(g, '← → ELEGIR   ENTER PELEAR   ESC VOLVER', Math.round(W / 2 - tinyW('← → ELEGIR   ENTER PELEAR   ESC VOLVER') / 2), 214, '#8a80b0');
  }
}

// ============================================================
//  ENDING — door, video call, credits
// ============================================================
class EndingScene extends Cutscene {
  constructor(heroX, camX) { super(); this.hx = heroX; this.cx = camX; }
  init() {
    this.world = buildStage({ theme: 'riera', tod: 'rain', seed: STAGES[4].seed, arena: 620, crowd: 10 });
    this.hero = new Actor(CH.hero, this.hx, 1, { bag: true, anim: 'standBag', walkAnim: 'walkBag' });
    this.capo = new Actor(CH.capo, this.hx + 70, -1, { anim: 'sit', expr: 'hurt' });
    this.actors = [this.capo, this.hero]; this.camX = this.cx; this.ph = 'street'; this.doorOpen = 0; this.call = null;
    playMusic('flight'); ambient('rain');
    this.run(this.script());
  }
  doorScreenX() { return 560 - this.camX * 0.55; }
  *script() {
    yield* wait(40);
    const target = () => this.doorScreenX() + this.camX;
    this.hero.walkTo(target(), 1.1);
    while (!this.hero.arrived) { this.hero.tx = target(); yield; }
    this.hero.facing = 1;
    this.caption = ['C/ RIERA BAIXA, 23', '¡POR FIN!'];
    yield* wait(40);
    for (const k of [1200, 1350, 1500, 1800]) { sfx('beep', k); yield* wait(14); }
    sfx('coin'); this.caption = null; yield* wait(20);
    sfx('door'); for (let i = 0; i < 20; i++) { this.doorOpen = i / 20; yield; }
    for (let i = 0; i < 30; i++) { this.hero.alpha = 1 - i / 30; this.hero.y = GROUND - i * .1; yield; }
    this.hero.visible = false;
    yield* wait(30);
    fadeTo(() => { this.ph = 'room'; ambient('rain'); this.hero = new Actor(CH.hero, 150, 1, { anim: 'seated' }); this.hero.y = 196; this.actors = [this.hero]; }, .03); yield* wait(60);
    yield* wait(60);
    sfx('beep', 1000); yield* wait(20); sfx('beep', 1000); yield* wait(30);
    this.call = 1; DLG_BOTTOM = true;
    yield* this.say('mom', `¡${C().son.charAt(0).toUpperCase() + C().son.slice(1)}! ¿Llegaste bien? ¿Comiste algo?`, { expr: 'happy' });
    yield* this.say('hero', 'Sí, mamá. Todo bien. Barcelona me ha recibido... con mucho cariño.', { right: true, expr: 'happy' });
    yield* this.say('dad', '¿Y el barrio qué tal? ¿Tranquilo?');
    yield* this.say('hero', 'Tranquilo, papá. Muy... tranquilo.', { right: true });
    yield* this.say('abuela', '¿Y la chancla, mijo? ¿La usaste?');
    yield* this.say('hero', 'Abuela... la chancla me salvó la vida.', { right: true, expr: 'proud' });
    yield* this.say('sis', '¿¡Y MI CAMISETA DEL BARÇA!?', { expr: 'angry' });
    yield* this.say('hero', '...Mañana, Vale. Mañana.', { right: true, expr: 'happy' });
    this.call = null; DLG_BOTTOM = false; yield* wait(40);
    goFade(() => new CreditsScene(), .02);
  }
  update() { this.world.update(); if (this.call) this.call++; this.step(); }
  draw(g) {
    if (this.ph === 'street') {
      const camX = Math.round(this.camX);
      this.world.drawBack(g, camX); this.world.drawCrowd(g, camX);
      if (this.doorOpen > 0) { const dx = Math.round(this.doorScreenX()); g.fillStyle = '#ffd890'; g.fillRect(dx - 10, 118, Math.round(22 * this.doorOpen), 32); g.fillStyle = '#c89a50'; g.fillRect(dx - 10, 146, Math.round(22 * this.doorOpen), 4); }
      for (const a of this.actors) a.draw(g, camX);
      this.world.drawFront(g, camX);
    } else {
      drawRoom(g, this.t);
      for (const a of this.actors) a.draw(g, 0);
      if (this.call) drawVideoCall(g, this.call, this.dlg);
    }
    this.drawOverlay(g);
  }
}
let _room = null;
function drawRoom(g, t) {
  if (!_room) {
    let rg; [_room, rg] = mk(W, H);
    rg.fillStyle = '#e8d8b8'; rg.fillRect(0, 0, W, 170);
    for (let y = 0; y < 170; y += 12) for (let x = (y / 12 % 2) * 6; x < W; x += 12) { rg.fillStyle = '#dccaa6'; rg.fillRect(x, y, 2, 2); }
    rg.fillStyle = '#8a5a3a'; rg.fillRect(0, 164, W, 6);
    for (let y = 170; y < H; y++) for (let x = 0; x < W; x++) { rg.fillStyle = ((Math.floor(x / 14) + Math.floor((y - 170) / 7)) % 2) ? '#b85a4a' : '#e8e0d0'; rg.fillRect(x, y, 1, 1); }
    // window
    rg.fillStyle = OUTL; rg.fillRect(239, 29, 112, 92); rg.fillStyle = '#10142a'; rg.fillRect(240, 30, 110, 90);
    const R = RNG(12);
    for (let x = 240; x < 350; x += R.i(8, 16)) { const h = R.i(20, 50); rg.fillStyle = '#1a1e3a'; rg.fillRect(x, 120 - h, R.i(8, 14), h); for (let yy = 120 - h + 3; yy < 118; yy += 5) for (let xx = x + 2; xx < x + 10; xx += 4) if (R() < .35) { rg.fillStyle = '#ffd27a'; rg.fillRect(xx, yy, 2, 2); } }
    rg.fillStyle = '#e8e0d0'; rg.fillRect(294, 30, 2, 90); rg.fillRect(240, 74, 110, 2);
    rg.fillStyle = '#c0392b'; rg.fillRect(228, 24, 12, 100); rg.fillRect(350, 24, 12, 100); rg.fillStyle = '#8a2a20'; for (let y = 24; y < 124; y += 3) { rg.fillRect(230, y, 1, 2); rg.fillRect(356, y, 1, 2); }
    // bed
    rg.fillStyle = OUTL; rg.fillRect(60, 160, 200, 40); rg.fillStyle = '#5a3a24'; rg.fillRect(60, 150, 8, 50); rg.fillStyle = '#f0ece4'; rg.fillRect(68, 166, 190, 20); rg.fillStyle = '#2e86de'; rg.fillRect(120, 166, 138, 22); rg.fillStyle = '#2468b8'; rg.fillRect(120, 184, 138, 4); rg.fillStyle = '#fff'; rg.fillRect(72, 160, 34, 10);
    rg.fillStyle = '#6a4a2e'; rg.fillRect(62, 186, 196, 10);
    // lamp, poster
    rg.fillStyle = '#5a3a24'; rg.fillRect(20, 150, 30, 40); rg.fillStyle = '#f2c14e'; rg.fillRect(26, 128, 18, 14); rg.fillStyle = '#333'; rg.fillRect(34, 142, 2, 8);
    rg.fillStyle = OUTL; rg.fillRect(119, 39, 52, 72); rg.fillStyle = '#a50044'; rg.fillRect(120, 40, 25, 70); rg.fillStyle = '#004d98'; rg.fillRect(145, 40, 25, 70); tiny(rg, 'BCN', 135, 70, '#f2c14e', 1);
    drawSuitcaseAt(rg, 300, 198);
  }
  g.drawImage(_room, 0, 0);
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35; g.drawImage(glowSprite(40, '#ffc870', .7), -5, 95); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.fillStyle = 'rgba(160,180,255,.5)'; for (let i = 0; i < 20; i++) { const x = 240 + ((i * 37 + t * 2) % 110), y = 30 + ((i * 53 + t * 5) % 90); g.fillRect(x, y, 1, 3); }
}
function drawVideoCall(g, t, dlg) {
  const x = 150, y = 6, w = 120, h = 140, a = clamp(t / 12, 0, 1), yy = Math.round(lerp(H, y, easeOut(a)));
  g.fillStyle = OUTL; g.fillRect(x - 1, yy - 1, w + 2, h + 2); g.fillStyle = '#1e1e26'; g.fillRect(x, yy, w, h);
  g.fillStyle = '#0c0c12'; g.fillRect(x + 4, yy + 4, w - 8, h - 8);
  const fam = [CH.mom, CH.dad, CH.sis, CH.abuela];
  fam.forEach((d, i) => {
    const px = x + 6 + (i % 2) * 55, py = yy + 8 + Math.floor(i / 2) * 58, speaking = dlg && dlg.sp.def === d;
    g.fillStyle = speaking ? '#ffd84a' : '#3a3a46'; g.fillRect(px - 1, py - 1, 54, 54);
    g.fillStyle = mix(d.color || '#888', '#141028', .5); g.fillRect(px, py, 52, 52);
    const talk = speaking && (t >> 2) % 2 === 0 && dlg.n < dlg.total;
    g.save(); g.beginPath(); g.rect(px, py, 52, 52); g.clip(); g.drawImage(portraitHi(d, talk ? 'talk' : 'happy', 1), px - 8, py - 5); g.restore();
  });
  g.fillStyle = '#e8465a'; stamp(g, x + w / 2, yy + h - 10, 9, '#e8465a'); g.fillStyle = '#fff'; g.fillRect(x + w / 2 - 2, yy + h - 11, 5, 2);
}
class CreditsScene {
  init() { this.t = 0; this.fw = []; playMusic('rumba'); ambient(null); const ms = performance.now() - GAME.startTime; this.time = Math.floor(ms / 60000) + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0'); }
  update() {
    this.t++;
    if (this.t % 50 === 0) { const x = rnd(40, W - 40), y = rnd(20, 90), col = pick(['#ffd84a', '#ff4a5a', '#4ff0ff', '#8fff4f', '#ff8ab0', '#fff']); for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; this.fw.push({ x, y, vx: Math.cos(a) * rnd(1, 2.2), vy: Math.sin(a) * rnd(1, 2.2), t: 0, col }); } sfx('hitL'); }
    for (const f of this.fw) { f.t++; f.x += f.vx; f.y += f.vy; f.vy += .03; f.vx *= .98; }
    this.fw = this.fw.filter(f => f.t < 60);
    if (this.t > 120 && Input.ok()) goFade(() => new TitleScene());
  }
  draw(g) {
    const sky = TITLE_SKY || (TITLE_SKY = buildSky(TOD.night, RNG(3)));
    g.drawImage(sky, 0, 0); g.fillStyle = '#0a0c20'; g.fillRect(0, 150, W, 75);
    g.drawImage(skyline(), -10, 100); g.fillStyle = '#0a0c20'; g.fillRect(0, 164, W, 61);
    for (const f of this.fw) { g.fillStyle = f.t < 40 ? f.col : dk(f.col, .6); g.fillRect(Math.round(f.x), Math.round(f.y), f.t < 20 ? 2 : 1, f.t < 20 ? 2 : 1); }
    const lines = ['RAVAL FIGHTER', '', 'MATEO LLEGÓ A SU AIRBNB.', 'EL BARRIO LE ABRIÓ LAS PUERTAS...', '...A CHANCLAZOS.', '', 'TIEMPO: ' + this.time + '   CONTINUES: ' + GAME.continues, '', 'GRACIAS POR JUGAR', '', 'UN JUEGO DE FREDDYSAEZ.ES', '', 'DEDICADO A TODOS LOS QUE', 'UN DÍA HICIERON LA MALETA.'];
    const y0 = Math.round(H - this.t * .35);
    lines.forEach((l, i) => { const y = y0 + i * 16; if (y < -10 || y > H) return; if (i === 0) textGrad(g, l, W / 2, y, 16, ['#fff8d0', '#ffd860', '#ff6020']); else text(g, l, W / 2, y, { align: 'center', color: l.includes('FREDDYSAEZ') ? '#ffd84a' : '#e8e0ff', outline: OUTL }); });
    if (y0 + lines.length * 16 < 60) textGrad(g, 'FIN', W / 2, 90, 32, ['#fff', '#ffd860', '#ff9030']);
  }
}
let TITLE_SKY = null;
