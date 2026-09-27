'use strict';
// ============================================================
//  FIGHT — fighters, frame data, AI, projectiles, fx, HUD
// ============================================================
const MOVES = {
  jab:    { anim: 'jab', s: 4, a: 3, r: 8, dmg: 5, hs: 14, bs: 8, push: 2.4, box: [6, -50, 26, 10], lvl: 'mid', snd: 'hitL', stop: 5, cancel: ['cross', 'kick'], meter: 5 },
  cross:  { anim: 'cross', s: 6, a: 3, r: 14, dmg: 8, hs: 17, bs: 10, push: 3.2, box: [6, -50, 32, 10], lvl: 'mid', snd: 'hitM', stop: 7, lunge: 1.4, meter: 7 },
  kick:   { anim: 'kick', s: 7, a: 4, r: 15, dmg: 9, hs: 18, bs: 10, push: 3.6, box: [4, -40, 36, 12], lvl: 'mid', snd: 'hitM', stop: 7, meter: 8 },
  cpunch: { anim: 'cpunch', s: 4, a: 3, r: 8, dmg: 4, hs: 13, bs: 7, push: 2, box: [6, -34, 26, 9], lvl: 'mid', crouch: 1, snd: 'hitL', stop: 5, cancel: ['sweep'], meter: 4 },
  sweep:  { anim: 'sweep', s: 8, a: 4, r: 20, dmg: 8, hs: 20, bs: 10, push: 2, box: [2, -14, 38, 12], lvl: 'low', crouch: 1, kd: 1, snd: 'hitM', stop: 7, meter: 8 },
  jkick:  { anim: 'jkick', s: 4, a: 60, r: 0, dmg: 9, hs: 18, bs: 10, push: 2.6, box: [2, -38, 28, 16], lvl: 'high', air: 1, snd: 'hitM', stop: 7, meter: 7 },
  jpunch: { anim: 'jpunch', s: 4, a: 60, r: 0, dmg: 7, hs: 16, bs: 9, push: 2.2, box: [4, -46, 24, 14], lvl: 'high', air: 1, snd: 'hitL', stop: 6, meter: 6 },
};
const SPECIALS = {
  hero: { special: { anim: 'throw', s: 11, a: 0, r: 22, spawn: { at: 11, type: 'chancla' }, cd: 40, snd: 'throw' }, super: { name: '¡FURIA LATINA!', dmg: 3, fin: 12 } },
  fumeta: { special: { anim: 'blow', s: 15, a: 0, r: 23, spawn: { at: 15, type: 'smoke' }, cd: 110, snd: 'smoke' } },
  latero: { special: { anim: 'throw', s: 11, a: 0, r: 22, spawn: { at: 11, type: 'can' }, cd: 85, snd: 'throw' } },
  carterista: { special: { anim: 'jkick', flip: 1, s: 5, a: 60, r: 0, air: 1, dmg: 9, hs: 18, bs: 10, push: 3, box: [0, -38, 30, 18], lvl: 'high', snd: 'hitM', stop: 8, cd: 70, meter: 8 } },
  relojero: { special: { anim: 'snatch', s: 8, a: 14, r: 16, dash: 5.2, dmg: 8, hs: 26, bs: 12, push: 2, box: [4, -52, 26, 16], lvl: 'mid', snd: 'hitM', stop: 9, steal: '¡MI RELOJ!', cd: 70, meter: 8 } },
  capo: { special: { anim: 'pound', s: 23, a: 0, r: 24, hop: 1, spawn: { at: 23, type: 'wave' }, cd: 110, snd: 'shock' }, super: { name: '¡PEAJE!', dmg: 3, fin: 12 } },
};
const JUMP_V = -6.3, GRAV = 0.3;

class Fighter {
  constructor(def, x, facing, isP) {
    this.def = def; this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.facing = facing; this.isP = isP;
    this.maxHp = 100; this.hp = 100; this.hpShow = 100; this.meter = 0; this.state = 'idle'; this.st = 0; this.move = null; this.mt = 0;
    this.flash = 0; this.inv = 0; this.combo = 0; this.comboShow = 0; this.comboN = 0; this.projCD = 0; this.bounced = false; this.blinkT = rndi(100, 240);
    this.moves = Object.assign({}, MOVES, SPECIALS[def.id] || {});
    this.spd = 1.35 * (def.speed || 1); this.dmgMul = 1; this.opp = null; this.ctrl = null; this.hitDone = false; this.hitConfirmed = false; this.stun = 0;
    this.s = def.b.s;
  }
  get grounded() { return this.y >= 0 && !['jump', 'knock', 'ko'].includes(this.state) && !(this.move && this.move.air); }
  setState(s) { if (this.state !== s) { this.state = s; this.st = 0; } }
  face() { if (this.opp) { const d = this.opp.x - this.x; if (Math.abs(d) > 2) this.facing = Math.sign(d); } }
  hurtbox() {
    const s = this.s;
    if (['knock', 'down', 'ko', 'getup'].includes(this.state) || this.inv > 0) return null;
    const crouch = this.state === 'crouch' || (this.state === 'blockstun' && this.crouchBlock) || (this.state === 'hitstun' && this.crouchHit) || (this.move && this.move.crouch && this.state === 'attack');
    if (this.y < -2 || this.state === 'jump') return { x: this.x - 10 * s, y: this.y - 56 * s, w: 20 * s, h: 46 * s };
    if (crouch) return { x: this.x - 11 * s, y: -42 * s, w: 22 * s, h: 42 * s };
    return { x: this.x - 10 * s, y: -58 * s, w: 20 * s, h: 58 * s };
  }
  hitbox() {
    const m = this.move; if (!m || !m.box || this.state !== 'attack' || this.hitDone) return null;
    if (this.mt < m.s || this.mt >= m.s + m.a) return null;
    const s = this.s, bx = m.box[0] * s, w = m.box[2] * s;
    const x = this.facing > 0 ? this.x + bx : this.x - bx - w;
    return { x, y: this.y + m.box[1] * s, w, h: m.box[3] * s };
  }
  doMove(name, F) {
    const m = this.moves[name]; if (!m) return false;
    if (m.cd && this.projCD > 0) return false;
    this.move = m; this.moveName = name; this.mt = 0; this.hitDone = false; this.hitConfirmed = false; this.setState('attack');
    if (m.cd) this.projCD = m.cd;
    if (!m.air) this.vx = 0;
    if (m.flip) { this.vy = -5.4; this.vx = this.facing * 3.3; this.y = -1; }
    if (name === 'special' && F) { F.popup(this.x, -70, this.def.id === 'hero' ? '¡CHANCLAZO!' : '', this.def.color); }
    return true;
  }
  jump(dir) { this.setState('jump'); this.vy = JUMP_V; this.vx = dir * 2.3 * this.facing; this.y = -1; this.move = null; this.airAtk = false; sfx('jump'); }
  canBlock() { return ['idle', 'walk', 'crouch', 'blockstun'].includes(this.state) && this.y >= 0; }
  update(F) {
    const c = this.ctrl; this.st++;
    if (this.flash > 0) this.flash--; if (this.inv > 0) this.inv--; if (this.projCD > 0) this.projCD--; if (this.comboShow > 0) this.comboShow--;
    if (--this.blinkT < 0) this.blinkT = rndi(120, 260);
    const act = F.phase === 'fight';
    switch (this.state) {
      case 'idle': case 'walk': case 'crouch': {
        this.face();
        if (!act || !c) { this.setState('idle'); this.vx = 0; break; }
        const down = c.down();
        if (c.press('super') && this.meter >= 100 && this.moves.super) { F.startSuper(this); break; }
        if ((c.press('special') || (c.press('punch') && c.qcf && c.qcf())) && this.moves.special && this.projCD <= 0 && (!this.moves.special.spawn || !F.projs.some(p => p.owner === this))) { this.doMove('special', F); break; }
        if (c.press('punch')) { this.doMove(down ? 'cpunch' : 'jab'); sfx('whiff'); break; }
        if (c.press('kick')) { this.doMove(down ? 'sweep' : 'kick'); sfx('whiffH'); break; }
        if (c.up()) { this.jump(c.fwd() ? 1 : c.back() ? -1 : 0); break; }
        if (down) { this.setState('crouch'); this.vx = 0; break; }
        if (c.fwd()) { this.setState('walk'); this.walkDir = 1; this.vx = this.facing * this.spd; }
        else if (c.back()) { this.setState('walk'); this.walkDir = -1; this.vx = -this.facing * this.spd * 0.78; }
        else { this.setState('idle'); this.vx = 0; }
        break;
      }
      case 'jump': {
        this.vy += GRAV; this.y += this.vy;
        if (act && c && !this.airAtk && this.st > 3) {
          if (c.press('kick')) { this.airAtk = true; this.startAir('jkick'); sfx('whiffH'); }
          else if (c.press('punch')) { this.airAtk = true; this.startAir('jpunch'); sfx('whiff'); }
        }
        if (this.y >= 0) this.land(F);
        break;
      }
      case 'attack': this.updateMove(F); break;
      case 'hitstun': case 'blockstun':
        this.vx *= 0.82;
        if (this.y < 0) { this.vy += GRAV; this.y += this.vy; if (this.y >= 0) { this.y = 0; } }
        if (--this.stun <= 0) { this.setState((this.crouchHit || this.crouchBlock) && c && c.down() ? 'crouch' : 'idle'); this.crouchHit = this.crouchBlock = false; }
        break;
      case 'knock': case 'ko':
        this.vy += GRAV * 1.1; this.y += this.vy;
        if (this.y >= 0) {
          this.y = 0;
          if (!this.bounced && this.vy > 2) { this.bounced = true; this.vy = -2.4; this.y = -1; this.vx *= .5; sfx('fall'); shake(3, 8); F.dust(this.x, 8); F.stage.react('hit', this.x); }
          else { this.vx = 0; this.vy = 0; this.setState('down'); this.downKO = this.hp <= 0; if (!this.bouncedSnd) sfx('land'); }
        }
        break;
      case 'down':
        this.vx = 0;
        if (this.hp > 0 && this.st > 38) { this.setState('getup'); this.inv = 30; }
        break;
      case 'getup': this.vx = 0; if (this.st >= ANIM.getup.total) { this.setState('idle'); this.inv = 8; } break;
      case 'super': this.updateSuper(F); break;
      case 'win': case 'lose': case 'intro': this.vx = 0; break;
    }
    this.x += this.vx;
    if (this.state !== 'knock' && this.state !== 'ko' && this.state !== 'jump' && !(this.move && (this.move.air || this.move.hop) && this.state === 'attack') && this.y < 0 && this.state !== 'hitstun' && this.state !== 'super') { this.y = Math.min(0, this.y + 4); }
  }
  startAir(name) { const m = this.moves[name]; this.move = m; this.moveName = name; this.mt = 0; this.hitDone = false; this.hitConfirmed = false; this.state = 'attack'; }
  land(F) {
    this.y = 0; this.vy = 0; this.vx = 0; this.move = null; this.setState('idle'); sfx('land'); F.dust(this.x, 4); this.face();
  }
  updateMove(F) {
    const m = this.move, c = this.ctrl; this.mt++;
    if (m.air) {
      this.vy += GRAV; this.y += this.vy;
      if (this.y >= 0) { this.land(F); this.st = -4; }
      return;
    }
    if (m.lunge && this.mt < m.s + 2) this.vx = this.facing * m.lunge; else this.vx *= 0.7;
    if (m.dash && this.mt >= m.s && this.mt < m.s + m.a) { this.vx = this.facing * m.dash; if (this.mt === m.s) { sfx('dash'); F.dust(this.x, 3); } }
    if (m.hop) {
      if (this.mt >= 8 && this.mt < 23) this.y = -Math.sin(Math.PI * (this.mt - 8) / 15) * 30 * (this.mt < 15.5 ? 1 : 1);
      else this.y = 0;
      if (this.mt === 23) { shake(5, 14); F.dust(this.x + this.facing * 10, 10); }
    }
    if (m.spawn && this.mt === m.spawn.at) F.spawnProj(this, m.spawn.type);
    if (m.snd && this.mt === (m.spawn ? m.spawn.at - 2 : -1)) sfx(m.snd);
    // cancels (on hit/block)
    if (this.hitConfirmed && c && this.mt >= m.s && F.phase === 'fight') {
      if (m.cancel) {
        const down = c.down();
        if (c.press('punch') && m.cancel.includes('cross') && !down) { this.doMove('cross'); sfx('whiff'); return; }
        if (c.press('kick') && m.cancel.includes('kick') && !down) { this.doMove('kick'); sfx('whiffH'); return; }
        if (c.press('kick') && m.cancel.includes('sweep')) { this.doMove('sweep'); sfx('whiffH'); return; }
      }
      if (c.press('special') && this.moves.special && this.projCD <= 0 && this.moveName !== 'special') { this.doMove('special', F); return; }
      if (c.press('super') && this.meter >= 100 && this.moves.super) { F.startSuper(this); return; }
    }
    if (this.mt >= m.s + m.a + m.r) { this.move = null; this.setState(m.crouch && c && c.down() ? 'crouch' : 'idle'); }
  }
  // ---- super: dash -> rush of punches -> uppercut
  updateSuper(F) {
    const o = this.opp, sp = this.moves.super, d = Math.abs(o.x - this.x);
    this.sst++;
    if (this.sph === 'dash') {
      this.vx = this.facing * 6.2; if (this.sst % 4 === 0) F.dust(this.x, 1);
      if (d < 34 * this.s && o.hurtbox()) {
        if (o.canBlock() && o.ctrl && o.ctrl.back()) { this.vx = 0; this.sph = 'recover'; this.sst = 0; o.setState('blockstun'); o.stun = 22; o.hp = Math.max(1, o.hp - 4); o.vx = this.facing * 3; sfx('block'); F.spark(o.x - this.facing * 6, -40, 'block'); F.hitstop = 8; }
        else { this.sph = 'rush'; this.sst = 0; this.vx = 0; o.setState('hitstun'); o.stun = 999; o.vx = 0; o.face(); }
      } else if (this.sst > 32) { this.sph = 'recover'; this.sst = 0; }
    } else if (this.sph === 'rush') {
      this.vx = 0;
      if (this.sst % 5 === 2 && this.sst < 42) {
        const dmg = sp.dmg * (this.isP ? 1 : this.dmgMul);
        o.hp = Math.max(this.sst > 36 && o.hp - dmg <= 0 ? 0 : 1, o.hp - dmg); o.flash = 3; o.x += this.facing * 1.2;
        F.spark(o.x - this.facing * 8, -44 + rnd(-6, 6), 'hit'); sfx(this.sst % 10 === 2 ? 'hitL' : 'hitM'); shake(2, 4); F.hitstop = 3;
        this.comboN++; this.combo = this.comboN; this.comboShow = 70;
      }
      if (this.sst >= 44) { this.sph = 'upper'; this.sst = 0; }
    } else if (this.sph === 'upper') {
      if (this.sst < 10) this.y = -this.sst * 1.8; else this.y = Math.min(0, this.y + 2);
      if (this.sst === 5) {
        const dmg = sp.fin * (this.isP ? 1 : this.dmgMul);
        o.hp = Math.max(0, o.hp - dmg); this.comboN++; this.combo = this.comboN; this.comboShow = 90;
        o.setState('knock'); o.vy = -6.5; o.vx = this.facing * 2.6; o.y = -2; o.bounced = false; o.stun = 0;
        F.spark(o.x - this.facing * 6, -54, 'big'); sfx('hitH'); shake(6, 16); F.hitstop = 14; flash(4, '#fff');
        F.stage.react('hit', o.x);
        if (o.hp <= 0) F.ko(this, o);
      }
      if (this.sst > 30) { this.y = 0; this.setState('idle'); }
    } else if (this.sph === 'recover') { this.vx *= .8; if (this.sst > 24) this.setState('idle'); }
  }
  animState() {
    const s = this.state;
    const blink = this.blinkT < 6;
    let expr = this.def.expr || 'normal';
    if (blink && expr === 'normal') expr = 'blink';
    switch (s) {
      case 'idle': return ['idle', this.st, expr];
      case 'walk': return [this.walkDir > 0 ? 'walkF' : 'walkB', this.st, expr];
      case 'crouch': return ['crouch', this.st, expr];
      case 'jump': return ['jump', this.st, expr];
      case 'attack': return [this.move.anim, this.mt, 'angry'];
      case 'hitstun': return [this.crouchHit ? 'hitC' : 'hit', Math.min(this.st, 8), 'hurt'];
      case 'blockstun': return [this.crouchBlock ? 'blockC' : 'block', 0, 'angry'];
      case 'knock': return ['knock', this.st, 'hurt'];
      case 'ko': return ['knock', this.st, 'ko'];
      case 'down': return ['lie', 0, this.hp <= 0 ? 'ko' : 'hurt'];
      case 'getup': return ['getup', this.st, 'angry'];
      case 'super':
        if (this.sph === 'dash') return ['dash', this.sst, 'angry'];
        if (this.sph === 'rush') return ['rush', this.sst, 'angry'];
        if (this.sph === 'upper') return ['upper', this.sst + 4, 'angry'];
        return ['idle', this.sst, expr];
      case 'win': return [this.def.id === 'hero' ? 'win' : 'laugh', this.st, 'happy'];
      case 'intro': return [this.introAnim || 'idle', this.st, expr];
      case 'lose': return ['lie', 0, 'ko'];
    }
    return ['idle', this.st, expr];
  }
  draw(g, camX) {
    const [anim, t, expr] = this.animState();
    const spr = getSprite(this.def, anim, t, expr);
    const sx = this.x - camX, sy = GROUND + this.y;
    const sh = clamp(1 + this.y / 90, .4, 1);
    shadow(g, sx, GROUND, 26 * sh * this.s, .4 * sh);
    const img = this.flash > 0 && this.flash % 2 === 1 ? whiteOf(spr) : (this.inv > 0 && this.state === 'getup' && this.st % 4 < 2 ? tintedOf(spr, '#ffffff', .3) : null);
    drawSpr(g, spr, sx, sy, this.facing, img);
    if (this.def.id === 'fumeta' && Math.random() < .08 && this.state !== 'down') FIGHT_REF && FIGHT_REF.smokePuff(this.x + this.facing * 10, this.y - 66);
  }
}
let FIGHT_REF = null;

// ---------- player controller ----------
class PadCtrl {
  constructor(f) { this.f = f; this.hist = []; }
  update() {
    const f = this.f, L = Input.held.left, Rr = Input.held.right, U = Input.held.up, D = Input.held.down;
    const fw = f.facing > 0 ? Rr : L, bk = f.facing > 0 ? L : Rr;
    let n = 5; if (D && bk) n = 1; else if (D && fw) n = 3; else if (D) n = 2; else if (U) n = 8; else if (fw) n = 6; else if (bk) n = 4;
    this.hist.push(n); if (this.hist.length > 24) this.hist.shift();
    this._fw = fw; this._bk = bk;
  }
  fwd() { return this._fw; } back() { return this._bk; } up() { return !!Input.held.up; } down() { return !!Input.held.down; }
  press(b) { return Input.hit(b); }
  qcf() { const h = this.hist.slice(-16); let s = 0; for (const n of h) { if (s === 0 && n === 2) s = 1; else if (s === 1 && n === 3) s = 2; else if (s === 2 && n === 6) s = 3; } return s === 3; }
}

// ---------- AI controller ----------
class AICtrl {
  constructor(me, p) { this.me = me; this.p = p; this.h = { fwd: 0, back: 0, up: 0, down: 0 }; this.pr = {}; this.pt = 0; this.blockT = 0; this.reactT = -1; }
  update(F) {
    this.pr = {};
    const me = this.me, o = me.opp, P = this.p, dist = Math.abs(o.x - me.x);
    if (F.phase !== 'fight') { this.h = { fwd: 0, back: 0, up: 0, down: 0 }; return; }
    this.h.up = 0;
    // threats
    const oAtk = o.state === 'attack' && o.move && o.mt <= o.move.s + 1 && dist < 78;
    const proj = F.projs.find(pr => pr.owner === o && Math.abs(pr.x - me.x) < 110 && Math.sign(me.x - pr.x) === Math.sign(pr.vx || 1));
    const oSuper = o.state === 'super' && o.sph === 'dash' && dist < 120;
    if ((oAtk || proj || oSuper) && this.reactT < 0 && this.blockT <= 0) {
      this.reactT = Math.max(1, P.react - (oSuper ? 4 : 0));
      this.willBlock = Math.random() < P.block * (proj ? 1.1 : 1);
      this.low = (oAtk && o.move.lvl === 'low') || (proj && proj.low);
      this.jumpOver = proj && !this.willBlock && Math.random() < P.jump * 4;
      this.threatWasProj = !!proj;
    }
    if (this.reactT >= 0) {
      if (--this.reactT < 0) {
        if (this.jumpOver && me.state !== 'attack') { this.h = { fwd: 1, back: 0, up: 1, down: 0 }; this.pt = 3; return; }
        if (this.willBlock) this.blockT = this.threatWasProj ? 30 : 20;
      }
    }
    if (this.blockT > 0) { this.blockT--; this.h = { fwd: 0, back: 1, up: 0, down: this.low ? 1 : 0 }; return; }
    // in air: attack near opponent
    if (me.state === 'jump') { if (!me.airAtk && dist < 56 && me.vy > -2 && Math.random() < .5) this.pr.kick = 1; return; }
    // chain combos
    if (me.state === 'attack') { if (me.hitConfirmed && me.move && me.move.cancel && Math.random() < P.combo) { if (me.move.cancel.includes('cross')) this.pr[Math.random() < .6 ? 'punch' : 'kick'] = 1; else this.pr.kick = 1; this.h.down = me.move.crouch ? 1 : 0; } return; }
    if (!['idle', 'walk', 'crouch'].includes(me.state)) return;
    if (this.pt > 0) { this.pt--; if (this.h.up) this.h.up = 0; return; }
    const r = Math.random();
    if (me.meter >= 100 && me.moves.super && dist < 140 && r < .08) { this.pr.super = 1; return; }
    if (o.state === 'down' || o.state === 'getup') { this.h = { fwd: dist > 60 ? 1 : 0, back: 0, up: 0, down: 0 }; this.pt = 10; return; }
    if (dist > P.range) {
      if (me.moves.special && me.projCD <= 0 && r < P.special) {
        const sp = me.moves.special;
        if ((sp.spawn && dist > 70) || (sp.dash && dist < 120 && dist > 50) || (sp.flip && dist < 120 && dist > 55) || (sp.hop && dist > 60)) { this.pr.special = 1; this.pt = 12; return; }
      }
      if (r < P.special + P.jump && dist < 140) { this.h = { fwd: 1, back: 0, up: 1, down: 0 }; this.pt = 4; return; }
      if (Math.random() < P.aggr + .25) { this.h = { fwd: 1, back: 0, up: 0, down: 0 }; this.pt = rndi(8, 26); }
      else { this.h = { fwd: 0, back: Math.random() < .5 ? 1 : 0, up: 0, down: 0 }; this.pt = rndi(10, 28); }
    } else {
      if (r < P.aggr) {
        const a = Math.random();
        if (a < .42) { this.pr.punch = 1; this.h = { fwd: 0, back: 0, up: 0, down: 0 }; }
        else if (a < .75) { this.pr.kick = 1; this.h = { fwd: 0, back: 0, up: 0, down: 0 }; }
        else if (a < .9) { this.pr.kick = 1; this.h = { fwd: 0, back: 0, up: 0, down: 1 }; }
        else { this.pr.punch = 1; this.h = { fwd: 0, back: 0, up: 0, down: 1 }; }
        this.pt = rndi(6, 18) * (1.4 - P.aggr);
      } else if (r < P.aggr + .22) { this.h = { fwd: 0, back: 1, up: 0, down: 0 }; this.pt = rndi(8, 22); }
      else if (r < P.aggr + .3) { this.h = { fwd: 0, back: 0, up: 0, down: 1 }; this.pt = rndi(10, 20); }
      else { this.h = { fwd: 0, back: 0, up: 0, down: 0 }; this.pt = rndi(4, 16); }
    }
  }
  fwd() { return !!this.h.fwd; } back() { return !!this.h.back; } up() { return !!this.h.up; } down() { return !!this.h.down; }
  press(b) { return !!this.pr[b]; } qcf() { return false; }
}

// ---------- projectiles ----------
class Proj {
  constructor(owner, type) {
    this.owner = owner; this.type = type; this.t = 0; this.dead = false; const f = owner.facing, s = owner.s;
    this.x = owner.x + f * 20 * s; this.y = -44 * s; this.vx = 0; this.vy = 0; this.g = 0; this.w = 12; this.h = 8; this.low = false;
    if (type === 'chancla') { this.vx = f * 4.4; this.dmg = 8; this.hs = 18; this.w = 12; this.h = 8; this.y = -46 * s; }
    if (type === 'smoke') { this.vx = f * 1.5; this.dmg = 7; this.hs = 34; this.w = 16; this.h = 14; this.y = -50 * s; this.life = 170; }
    if (type === 'can') { this.vx = f * 3.3; this.vy = -3.6; this.g = .17; this.dmg = 8; this.hs = 18; this.w = 7; this.h = 7; this.y = -56 * s; }
    if (type === 'wave') { this.x = owner.x + f * 16 * s; this.vx = f * 3.6; this.y = -9; this.dmg = 10; this.hs = 22; this.w = 16; this.h = 14; this.low = true; this.kd = true; }
  }
  box() { return { x: this.x - this.w / 2, y: this.y - this.h / 2, w: this.w, h: this.h }; }
  update(F) {
    this.t++; this.x += this.vx; this.vy += this.g; this.y += this.vy;
    if (this.type === 'smoke') { this.w = Math.min(28, 16 + this.t * .1); this.h = Math.min(24, 14 + this.t * .08); this.vx *= .996; if (this.t > this.life) this.dead = true; if (this.t % 3 === 0) F.smokePuff(this.x + rnd(-6, 6), this.y + rnd(-5, 5), true); }
    if (this.type === 'can' && this.y >= -3) { if (!this.bounce) { this.bounce = true; this.vy = -2; this.y = -3; this.vx *= .5; sfx('can'); } else { this.dead = true; F.parts.push({ type: 'fizz', x: this.x, y: -2, t: 0, life: 30 }); sfx('fizz'); } }
    if (this.type === 'wave' && this.t % 2 === 0) F.parts.push({ type: 'debris', x: this.x + rnd(-6, 6), y: -rnd(0, 6), vx: rnd(-.6, .6), vy: rnd(-2.6, -1), t: 0, life: 24, col: pick(['#c8b8a0', '#8a7a6a', '#fff4c0']) });
    if (this.x < F.arena.l - 40 || this.x > F.arena.r + 40) this.dead = true;
  }
  draw(g, camX) {
    const sx = Math.round(this.x - camX), sy = Math.round(GROUND + this.y), t = this.t;
    if (this.type === 'chancla') { const im = SMALL.chancla[Math.floor(t / 3) % 4]; g.drawImage(im, sx - (im.width >> 1), sy - (im.height >> 1)); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(sx - Math.sign(this.vx) * 10, sy, 5, 1); g.fillRect(sx - Math.sign(this.vx) * 14, sy - 2, 3, 1); }
    if (this.type === 'can') { const im = SMALL.can[Math.floor(t / 3) % 4]; g.drawImage(im, sx - (im.width >> 1), sy - (im.height >> 1)); }
    if (this.type === 'smoke') {
      const cols = ['#e8e8ee', '#c8c8d4', '#a8a8b8'];
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + t * .05; const r = this.w * .22 + (i % 3); stamp(g, sx + Math.cos(a) * this.w * .3, sy + Math.sin(a * 1.3) * this.h * .25, r * 2 + 2, OUTL); }
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + t * .05; const r = this.w * .22 + (i % 3); stamp(g, sx + Math.cos(a) * this.w * .3, sy + Math.sin(a * 1.3) * this.h * .25, r * 2, cols[i % 3]); }
      stamp(g, sx - 2, sy - 3, 5, '#fff');
    }
    if (this.type === 'wave') {
      for (let i = 0; i < 4; i++) { const hh = 6 + ((t + i * 3) % 6) * 2, xx = sx - Math.sign(this.vx) * i * 5; g.fillStyle = OUTL; g.fillRect(xx - 2, GROUND - hh - 1, 5, hh + 1); g.fillStyle = i % 2 ? '#fff4c0' : '#f2c14e'; g.fillRect(xx - 1, GROUND - hh, 3, hh); }
    }
  }
}

// ---------- Fight manager ----------
const overlap = (a, b) => a && b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
class Fight {
  constructor(o) {
    this.o = o; this.stage = o.stage; this.center = o.center;
    this.arena = { l: o.center - 300, r: o.center + 300 };
    this.p = new Fighter(o.heroDef, o.center - 60, 1, true);
    this.e = new Fighter(o.enemyDef, o.center + 60, -1, false);
    this.p.opp = this.e; this.e.opp = this.p;
    this.p.ctrl = new PadCtrl(this.p); this.e.ctrl = new AICtrl(this.e, o.ai);
    this.e.dmgMul = o.ai.dmg || 1; this.e.spd *= (o.ai.speed || 1); this.e.maxHp = this.e.hp = this.e.hpShow = o.ai.hp || 100;
    this.round = 1; this.wins = [0, 0]; this.projs = []; this.parts = []; this.pops = []; this.hitstop = 0; this.slow = 0; this.cutin = null;
    this.camX = clamp(o.center - W / 2, this.arena.l, this.arena.r - W); this.tick = 0;
    FIGHT_REF = this;
    this.startRound(o.skipIntro);
  }
  startRound() {
    const c = this.center;
    for (const [f, x, fc] of [[this.p, c - 60, 1], [this.e, c + 60, -1]]) {
      f.x = x; f.y = 0; f.vx = f.vy = 0; f.facing = fc; f.hp = f.hpShow = f.maxHp; f.setState('idle'); f.move = null; f.combo = 0; f.comboN = 0; f.inv = 0; f.flash = 0; f.stun = 0; f.projCD = 0; f.downKO = false; f.bounced = false;
    }
    if (this.round === 1) { this.p.meter = 0; this.e.meter = 0; }
    this.projs = []; this.timer = 60 * 60; this.phase = 'intro'; this.pt = 0; this.koBy = null; this.result = null;
  }
  popup(x, y, txt, col = '#fff') { if (txt) this.pops.push({ x, y, txt, col, t: 0 }); }
  dust(x, n) { for (let i = 0; i < n; i++) this.parts.push({ type: 'dust', x: x + rnd(-8, 8), y: -rnd(0, 3), vx: rnd(-1, 1), vy: rnd(-.8, -.1), t: 0, life: rndi(14, 24) }); }
  smokePuff(x, y, big) { this.parts.push({ type: 'smoke', x, y, vx: rnd(-.2, .2), vy: -rnd(.2, .5), t: 0, life: big ? 30 : 40, r: big ? rnd(3, 6) : rnd(1, 2.5) }); }
  spark(x, y, kind) {
    this.parts.push({ type: kind === 'block' ? 'bspark' : 'spark', x, y, t: 0, life: kind === 'big' ? 12 : 9, big: kind === 'big' });
    const n = kind === 'block' ? 5 : kind === 'big' ? 14 : 8;
    for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), v = rnd(1.5, 3.5) * (kind === 'big' ? 1.4 : 1); this.parts.push({ type: 'bit', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, t: 0, life: rndi(8, 16), col: kind === 'block' ? pick(['#9fe8ff', '#fff', '#5ab0ff']) : pick(['#fff', '#fff4a0', '#ffc040', '#ff8030']) }); }
    if (kind !== 'block' && Math.random() < .5) for (let i = 0; i < 2; i++) this.parts.push({ type: 'sweat', x, y: y - 6, vx: rnd(-1.5, 1.5), vy: rnd(-2.5, -1), t: 0, life: 22 });
  }
  spawnProj(f, type) { this.projs.push(new Proj(f, type)); if (type === 'wave') { sfx('shock'); } else if (type === 'chancla') sfx('throw'); }
  startSuper(f) {
    f.meter = 0; f.setState('super'); f.sph = 'dash'; f.sst = 0; f.move = null; f.comboN = 0; f.inv = 0;
    this.cutin = { f, t: 0, name: f.moves.super.name }; sfx('super'); flash(3, '#fff'); announce(f.moves.super.name.replace(/[¡!]/g, ''));
  }
  // --- apply a hit (melee or projectile)
  hit(att, def, m, isProj, px) {
    const facing = isProj ? Math.sign(isProj.vx) || att.facing : att.facing;
    const lvl = m.lvl || 'mid';
    const holdBack = def.ctrl && def.ctrl.back();
    const crouching = def.ctrl && def.ctrl.down();
    const canB = def.canBlock() && holdBack && !(lvl === 'low' && !crouching) && !(lvl === 'high' && crouching);
    const hx = px != null ? px : def.x - facing * 8, hy = isProj ? isProj.y : (m.box[1] + m.box[3] / 2) * att.s;
    if (canB) {
      def.setState('blockstun'); def.stun = m.bs || 12; def.crouchBlock = crouching; def.vx = facing * (m.push || 2) * .9; def.face();
      if (isProj) def.hp = Math.max(1, def.hp - 1);
      att.meter = Math.min(100, att.meter + (m.meter || 4) * .5); def.meter = Math.min(100, def.meter + 3);
      this.spark(hx, hy, 'block'); sfx('block'); this.hitstop = 4; att.hitConfirmed = true;
      return;
    }
    const wasStun = def.state === 'hitstun' || def.state === 'knock';
    att.comboN = wasStun ? att.comboN + 1 : 1; att.combo = att.comboN; if (att.combo >= 2) att.comboShow = 70;
    const scale = Math.max(.5, 1 - (att.comboN - 1) * .12);
    const dmg = m.dmg * scale * (att.isP ? 1 : att.dmgMul);
    def.hp = Math.max(0, def.hp - dmg); def.flash = 6;
    att.meter = Math.min(100, att.meter + (m.meter || 5)); def.meter = Math.min(100, def.meter + dmg * .7);
    att.hitConfirmed = true;
    const air = def.y < -2 || def.state === 'jump';
    if (def.hp <= 0 || m.kd || air || isProj && isProj.kd) {
      def.setState('knock'); def.vy = def.hp <= 0 ? -5.5 : (m.kd && !air ? -3.8 : -4.2); def.vx = facing * (def.hp <= 0 ? 2.8 : 2.2); def.y = Math.min(def.y, -2); def.bounced = false; def.move = null;
    } else {
      def.setState('hitstun'); def.stun = m.hs || 14; def.crouchHit = def.state === 'crouch' || (def.ctrl && def.ctrl.down() && def.y >= 0); def.vx = facing * (m.push || 2.5); def.move = null;
    }
    // pushback into walls transfers to attacker
    if (!isProj && (def.x <= this.camX + 18 || def.x >= this.camX + W - 18)) att.vx = -facing * (m.push || 2.5) * .8;
    this.spark(hx, hy, dmg >= 9 ? 'big' : 'hit');
    sfx(dmg >= 9 ? 'hitH' : m.snd || 'hitM');
    this.hitstop = m.stop || 6; shake(dmg >= 8 ? 4 : 2, dmg >= 8 ? 10 : 6);
    this.stage.react('hit', def.x);
    if (m.steal && def.isP) { this.popup(def.x, -76, m.steal, '#ffd84a'); sfx('steal'); def.meter = Math.max(0, def.meter - 20); }
    if (def.def.id === 'fumeta' && isProj === false && Math.random() < .3) sfx('cough');
    if (isProj && isProj.type === 'smoke') sfx('cough');
    if (isProj && isProj.type === 'chancla') sfx('chancla');
    if (isProj && isProj.type === 'can') sfx('can');
    if (def.hp <= 0) this.ko(att, def);
  }
  ko(att, def) {
    if (this.phase !== 'fight') return;
    this.phase = 'ko'; this.pt = 0; this.koBy = att; this.slow = 70; this.hitstop = 20; def.setState('ko'); def.vy = -5.8; def.vx = att.facing * 2.8; def.y = -3; def.bounced = false;
    flash(6, '#fff'); sfx('ko'); shake(7, 24); this.stage.react('ko', def.x); setTimeout(() => sfx('crowd'), 400);
    announce('K O');
  }
  update() {
    this.tick++;
    const P = this.p, E = this.e;
    // super cut-in freezes the world
    if (this.cutin) { this.cutin.t++; if (this.cutin.t > 56) this.cutin = null; this.updateParts(); return; }
    this.pt++;
    if (this.phase === 'intro') {
      if (this.pt === 1) { P.setState('intro'); E.setState('intro'); E.introAnim = 'idle'; }
      if (this.pt === 20) { sfx('round'); announce('Ronda ' + ['uno', 'dos', 'tres', 'cuatro', 'cinco'][this.round - 1] || this.round); }
      if (this.pt === 80) { sfx('fight'); announce('¡Pelea!'); }
      if (this.pt === 84) { this.phase = 'fight'; P.setState('idle'); E.setState('idle'); }
    }
    if (this.phase === 'fight') { this.timer--; if (this.timer <= 0) { this.timer = 0; this.phase = 'timeup'; this.pt = 0; announce('Tiempo'); sfx('ko'); } }
    if (this.hitstop > 0) { this.hitstop--; this.updateParts(); return; }
    if (this.slow > 0) { this.slow--; if (this.slow % 3 !== 0) { this.updateParts(); return; } }
    P.ctrl.update(this); E.ctrl.update(this);
    P.update(this); E.update(this);
    // projectiles
    for (const pr of this.projs) pr.update(this);
    for (const a of this.projs) for (const b of this.projs) if (a !== b && a.owner !== b.owner && !a.dead && !b.dead && overlap(a.box(), b.box())) { a.dead = b.dead = true; this.spark((a.x + b.x) / 2, (a.y + b.y) / 2, 'hit'); sfx('block'); }
    if (this.phase === 'fight' || this.phase === 'ko') for (const pr of this.projs) {
      if (pr.dead) continue; const tgt = pr.owner === P ? E : P;
      if (overlap(pr.box(), tgt.hurtbox())) { pr.dead = true; this.hit(pr.owner, tgt, { dmg: pr.dmg, hs: pr.hs, bs: 14, push: 2.4, lvl: pr.low ? 'low' : 'mid', meter: 6, stop: 6, snd: 'hitM' }, pr, pr.x); }
    }
    this.projs = this.projs.filter(p => !p.dead);
    // melee
    if (this.phase === 'fight') for (const [a, d] of [[P, E], [E, P]]) {
      const hb = a.hitbox(); if (!hb) continue;
      if (overlap(hb, d.hurtbox())) { a.hitDone = true; this.hit(a, d, a.move, false); }
    }
    // push boxes
    const dx = E.x - P.x, minD = 20 * Math.max(P.s, E.s);
    const bothLow = P.y > -30 && E.y > -30;
    if (Math.abs(dx) < minD && bothLow && !['down', 'ko', 'knock'].includes(P.state) && !['down', 'ko', 'knock'].includes(E.state)) {
      const push = (minD - Math.abs(dx)) / 2, s = Math.sign(dx) || 1; P.x -= s * push; E.x += s * push;
    }
    // camera + bounds
    const mid = (P.x + E.x) / 2;
    const tgt = clamp(mid - W / 2, this.arena.l, this.arena.r - W);
    this.camX += (tgt - this.camX) * .15;
    for (const f of [P, E]) f.x = clamp(f.x, Math.max(this.arena.l + 14, this.camX + 14), Math.min(this.arena.r - 14, this.camX + W - 14));
    // hp display trail
    for (const f of [P, E]) { if (f.hpShow > f.hp) { if (f.state !== 'hitstun' || f.hpShow - f.hp > 30) f.hpShow = Math.max(f.hp, f.hpShow - .6); } else f.hpShow = f.hp; }
    if (this.phase === 'fight' && P.hp < 25 && this.tick % 40 === 0) sfx('lowhp');
    this.updateParts();
    // phase transitions
    if (this.phase === 'ko' || this.phase === 'timeup') {
      const settled = [P, E].every(f => !['knock', 'ko', 'attack', 'hitstun', 'super', 'jump'].includes(f.state) || f.state === 'down');
      if (this.phase === 'timeup' && this.pt === 1) { for (const f of [P, E]) if (f.state !== 'down') { f.setState('idle'); f.move = null; } }
      if (this.pt > 90 && settled && !this.result) {
        let w;
        if (this.phase === 'ko') w = this.koBy === P ? 0 : 1;
        else w = P.hp === E.hp ? -1 : P.hp > E.hp ? 0 : 1;
        this.result = { w, perfect: w >= 0 && [P, E][w].hp >= [P, E][w].maxHp };
        if (w >= 0) { this.wins[w]++; const wf = [P, E][w]; if (wf.state !== 'down') wf.setState('win'); const lf = [P, E][1 - w]; if (this.phase === 'timeup' && lf.state !== 'down') lf.setState('idle'); }
        if (w === 0) { playMusic(null); setTimeout(() => playMusic('victory'), 100); }
        if (this.result.perfect) announce('Perfecto');
        this.pt2 = 0;
      }
      if (this.result) {
        this.pt2++;
        if (this.pt2 === 170) {
          if (this.wins[0] >= 2 || this.wins[1] >= 2) { this.phase = 'over'; this.o.onEnd(this.wins[0] >= 2); }
          else { this.round++; this.startRound(); playMusic(this.o.music); }
        }
      }
    }
  }
  updateParts() {
    for (const p of this.parts) { p.t++; if (p.vx !== undefined) { p.x += p.vx; p.y += p.vy; } if (p.type === 'bit' || p.type === 'sweat' || p.type === 'debris') p.vy += .18; if (p.type === 'dust') p.vx *= .92; }
    this.parts = this.parts.filter(p => p.t < p.life);
    for (const p of this.pops) { p.t++; p.y -= .4; }
    this.pops = this.pops.filter(p => p.t < 70);
  }
  drawWorld(g) {
    const camX = Math.round(this.camX), P = this.p, E = this.e;
    const order = P.state === 'attack' || P.state === 'super' ? [E, P] : [P, E];
    for (const f of order) f.draw(g, camX);
    for (const pr of this.projs) pr.draw(g, camX);
    for (const p of this.parts) {
      const sx = Math.round(p.x - camX), sy = Math.round(GROUND + p.y), f = p.t / p.life;
      if (p.type === 'dust') { const r = 2 + f * 5; stamp(g, sx, sy - r / 2, r, f < .5 ? '#d8ccb8' : '#a89c88'); }
      if (p.type === 'smoke') { const r = p.r * (1 + f * 2); g.globalAlpha = 1 - f; stamp(g, sx, sy, r * 2, '#c8c8d4'); g.globalAlpha = 1; }
      if (p.type === 'bit') { g.fillStyle = p.col; g.fillRect(sx, sy, f < .5 ? 2 : 1, f < .5 ? 2 : 1); }
      if (p.type === 'sweat') { g.fillStyle = '#bfe8ff'; g.fillRect(sx, sy, 1, 2); g.fillStyle = '#fff'; g.fillRect(sx, sy, 1, 1); }
      if (p.type === 'debris') { g.fillStyle = p.col; g.fillRect(sx, sy, 2, 2); }
      if (p.type === 'fizz') { for (let i = 0; i < 3; i++) { g.fillStyle = '#fff4c0'; g.fillRect(sx + rndi(-3, 3), sy - rndi(0, 6), 1, 1); } }
      if (p.type === 'spark' || p.type === 'bspark') drawSpark(g, sx, sy, p.t, p.type === 'bspark', p.big);
    }
    for (const p of this.pops) { if (p.t % 6 < 5 || p.t < 40) text(g, p.txt, Math.round(p.x - camX), Math.round(GROUND + p.y), { align: 'center', color: p.col, outline: '#10061a' }); }
  }
  drawHUD(g) {
    const P = this.p, E = this.e, t = this.tick;
    const BW = 146, BH = 8, BY = 9;
    for (let side = 0; side < 2; side++) {
      const f = side ? E : P, x0 = side ? W - 36 - BW : 36;
      g.fillStyle = OUTL; g.fillRect(x0 - 2, BY - 2, BW + 4, BH + 4);
      g.fillStyle = '#e8dcc0'; g.fillRect(x0 - 1, BY - 1, BW + 2, BH + 2);
      g.fillStyle = '#16122a'; g.fillRect(x0, BY, BW, BH);
      const hpW = Math.round(BW * f.hp / f.maxHp), trW = Math.round(BW * f.hpShow / f.maxHp);
      const low = f.hp / f.maxHp < .25 && t % 20 < 10;
      // trail
      g.fillStyle = '#ff5048';
      if (!side) g.fillRect(x0 + hpW, BY, trW - hpW, BH); else g.fillRect(x0 + BW - trW, BY, trW - hpW, BH);
      for (let i = 0; i < hpW; i++) {
        const k = i / BW; let col = k < .2 ? '#e8302a' : k < .5 ? mix('#e8302a', '#f5a524', (k - .2) / .3) : mix('#f5a524', '#ffe04a', (k - .5) / .5);
        if (low) col = '#ff3030';
        const xx = side ? x0 + BW - 1 - i : x0 + i;
        g.fillStyle = col; g.fillRect(xx, BY, 1, BH); g.fillStyle = lt(col, .35); g.fillRect(xx, BY + 1, 1, 1); g.fillStyle = dk(col, .75); g.fillRect(xx, BY + BH - 2, 1, 2);
      }
      // super meter
      const MW = 104, MY = 21, mx0 = side ? W - 36 - MW : 36, mw = Math.round(MW * f.meter / 100);
      g.fillStyle = OUTL; g.fillRect(mx0 - 1, MY - 1, MW + 2, 6); g.fillStyle = '#10102a'; g.fillRect(mx0, MY, MW, 4);
      const full = f.meter >= 100, mc = full ? (t % 8 < 4 ? '#8ff0ff' : '#ffffff') : '#2a6aff';
      g.fillStyle = mc; if (!side) g.fillRect(mx0, MY, mw, 4); else g.fillRect(mx0 + MW - mw, MY, mw, 4);
      g.fillStyle = lt(mc, .4); if (!side) g.fillRect(mx0, MY, mw, 1); else g.fillRect(mx0 + MW - mw, MY, mw, 1);
      if (full && f.moves.super) text(g, 'SUPER', side ? mx0 - 4 : mx0 + MW + 4, MY - 2, { color: t % 8 < 4 ? '#8ff0ff' : '#fff', outline: OUTL, align: side ? 'right' : 'left' });
      // portrait
      const px = side ? W - 32 : 6, py = 5;
      g.fillStyle = OUTL; g.fillRect(px - 2, py - 2, 30, 30); g.fillStyle = '#e8dcc0'; g.fillRect(px - 1, py - 1, 28, 28);
      g.fillStyle = side ? '#b0243a' : '#2458b8'; g.fillRect(px, py, 26, 26);
      g.fillStyle = side ? '#c83a50' : '#3a70d0'; for (let yy = 0; yy < 26; yy += 3) g.fillRect(px, py + yy, 26, 1);
      const pc = portraitCanvas(f.def, f.hp <= 0 ? 'hurt' : f.state === 'hitstun' || f.state === 'knock' ? 'hurt' : f.state === 'win' ? 'happy' : (f.def.expr === 'sleepy' ? 'sleepy' : 'normal'));
      g.save(); g.beginPath(); g.rect(px, py, 26, 26); g.clip();
      if (side) { g.translate(px + 26, 0); g.scale(-1, 1); g.drawImage(pc, -1 - 4, py - 3); } else g.drawImage(pc, px - 4, py - 3);
      g.restore();
      // name & wins
      text(g, f.def.name, side ? W - 36 : 36, 28, { color: '#fff', outline: OUTL, align: side ? 'right' : 'left' });
      for (let i = 0; i < 2; i++) {
        const wx = side ? W - 36 - BW + 2 + i * 9 : 36 + BW - 8 - i * 9, wy = 29;
        g.fillStyle = OUTL; g.fillRect(wx - 1, wy - 1, 8, 8);
        g.fillStyle = this.wins[side] > i ? '#ffd84a' : '#3a3450'; g.fillRect(wx, wy, 6, 6);
        if (this.wins[side] > i) { g.fillStyle = '#fff4c0'; g.fillRect(wx + 1, wy + 1, 2, 2); }
      }
      if (f.comboShow > 0 && f.combo >= 2) {
        const cx = side ? W - 60 : 60, cy = 70;
        text(g, f.combo + ' GOLPES', cx, cy, { align: 'center', color: f.comboShow % 6 < 3 ? '#ffe04a' : '#ff8a3a', outline: OUTL, thick: 1 });
      }
    }
    // timer
    const secs = Math.ceil(this.timer / 60);
    g.fillStyle = OUTL; g.fillRect(W / 2 - 17, 3, 34, 22); g.fillStyle = '#16122a'; g.fillRect(W / 2 - 16, 4, 32, 20);
    textGrad(g, String(secs).padStart(2, '0'), W / 2, 6, 16, secs <= 10 && this.tick % 30 < 15 ? ['#ff8080', '#ff3030'] : ['#ffffff', '#f0f0f0', '#d8d8e8', '#b8b8d0']);
    g.fillStyle = OUTL; g.fillRect(W / 2 - 30, 26, 60, 11); g.fillStyle = '#2a1e10'; g.fillRect(W / 2 - 29, 27, 58, 9);
    text(g, 'RONDA ' + this.round, W / 2, 28, { align: 'center', color: '#ffd84a' });
    // announcements
    const ph = this.phase, pt = this.pt;
    if (ph === 'intro') {
      if (pt > 16 && pt < 78) { const x = pt < 26 ? lerp(-100, W / 2, easeOut((pt - 16) / 10)) : W / 2; textGrad(g, 'RONDA ' + this.round, x, 80, 16, ['#ffffff', '#ffe8a0', '#ffc040', '#e88020']); }
      if (pt >= 78) { const s = pt < 84 ? 32 : 24; textGrad(g, '¡PELEA!', W / 2, 74, s, ['#fff4a0', '#ffd040', '#ff8030', '#e83020']); }
      banner(g, this.o.place, pt);
    }
    if (ph === 'fight' && pt < 30) textGrad(g, '¡PELEA!', W / 2, 74 - pt, 24, ['#fff4a0', '#ffd040', '#ff8030', '#e83020']);
    if (ph === 'ko' && pt > 2 && (!this.result || this.pt2 < 150)) { const jit = pt < 20 ? rndi(-2, 2) : 0; textGrad(g, 'K.O.', W / 2 + jit, 70 + jit, 32, ['#ffffff', '#ffb0a0', '#ff4040', '#b01020']); }
    if (ph === 'timeup' && (!this.result || this.pt2 < 150)) textGrad(g, '¡TIEMPO!', W / 2, 72, 24, ['#ffffff', '#a0d0ff', '#4a90ff']);
    if (this.result && this.pt2 > 20 && this.pt2 < 165) {
      const r = this.result;
      const msg = r.w < 0 ? 'EMPATE' : r.w === 0 ? (this.p.def.name + ' GANA') : (this.e.def.name + ' GANA');
      text(g, msg, W / 2, 112, { align: 'center', color: r.w === 0 ? '#8fe0ff' : '#ff8a8a', outline: OUTL, thick: 1 });
      if (r.perfect) textGrad(g, 'PERFECTO', W / 2, 126, 16, ['#fff', '#ffe04a', '#ff9a20']);
    }
    // super cut-in
    if (this.cutin) drawCutin(g, this.cutin);
  }
}
function banner(g, place, t) {
  if (!place) return;
  const w = twidth(place) + 34, x = W / 2 - w / 2, y = 202, a = clamp(t / 10, 0, 1);
  if (a <= 0) return;
  g.fillStyle = OUTL; g.fillRect(x - 1, y - 1, w + 2, 16); g.fillStyle = '#1a1424'; g.fillRect(x, y, w, 14); g.fillStyle = '#3a2e4a'; g.fillRect(x, y, w, 1);
  const dia = (dx) => { g.fillStyle = '#ffd84a'; g.fillRect(dx, y + 6, 1, 1); g.fillRect(dx - 1, y + 7, 3, 1); g.fillRect(dx - 2, y + 8, 5, 1); g.fillRect(dx - 1, y + 9, 3, 1); g.fillRect(dx, y + 10, 1, 1); };
  dia(x + 9); dia(x + w - 10);
  text(g, place, W / 2, y + 4, { align: 'center', color: '#fff' });
}
function drawSpark(g, x, y, t, block, big) {
  const R = (big ? 16 : 11) * (1 - t / (big ? 12 : 9) * .6);
  const cA = block ? '#9fe8ff' : '#fff4a0', cB = block ? '#3a8aff' : '#ff8a20';
  if (t < 2) { stamp(g, x, y, big ? 14 : 9, '#fff'); }
  const rays = big ? 10 : 8;
  for (let i = 0; i < rays; i++) {
    const a = i / rays * Math.PI * 2 + (i % 2) * .2, r0 = t < 2 ? 2 : R * .45, r1 = R * (i % 2 ? .7 : 1);
    const a0 = pt(x + Math.cos(a) * r0, y + Math.sin(a) * r0), a1 = pt(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    seg(g, a0, a1, t < 4 ? 2 : 1, i % 2 ? cB : cA);
  }
  if (t < 5) { stamp(g, x, y, Math.max(1, 6 - t), block ? '#e0f8ff' : '#ffffff'); }
}
function drawCutin(g, c) {
  const t = c.t, f = c.f, side = f.isP ? 1 : -1;
  const a = t < 6 ? t / 6 : t > 48 ? (56 - t) / 8 : 1;
  drawFade(g, .55 * a, '#05020a');
  const bandY = 64, bandH = 76, open = t < 8 ? easeOut(t / 8) : t > 48 ? (56 - t) / 8 : 1;
  const hh = Math.round(bandH * open);
  g.fillStyle = OUTL; g.fillRect(0, bandY + (bandH - hh) / 2 - 1, W, hh + 2);
  g.fillStyle = f.isP ? '#1a3a8a' : '#8a1a2a'; g.fillRect(0, bandY + (bandH - hh) / 2, W, hh);
  g.save(); g.beginPath(); g.rect(0, bandY + (bandH - hh) / 2, W, hh); g.clip();
  for (let i = 0; i < 16; i++) { g.fillStyle = f.isP ? '#2a5ac0' : '#c02a40'; const lx = ((i * 37 + t * 14 * side) % (W + 60) + W + 60) % (W + 60) - 30; g.fillRect(lx, bandY + (i * 13) % bandH, 30, 2); }
  const pc = portraitHi(f.def, 'angry', 1);
  const px = f.isP ? lerp(-80, 40, easeOut(Math.min(1, t / 10))) : lerp(W + 80, W - 40 - 68, easeOut(Math.min(1, t / 10)));
  g.imageSmoothingEnabled = false;
  if (f.isP) g.drawImage(pc, Math.round(px), bandY + 4);
  else { g.save(); g.translate(Math.round(px) + 68, 0); g.scale(-1, 1); g.drawImage(pc, 0, bandY + 4); g.restore(); }
  g.restore();
  if (t > 8 && t < 50) textGrad(g, c.name, f.isP ? 250 : 150, bandY + 30, 16, ['#ffffff', '#fff0a0', '#ffc040', '#ff7020']);
}
