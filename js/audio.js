'use strict';
// ============================================================
//  AUDIO — chiptune synth (pulse/triangle/noise) + SFX + music
// ============================================================
const AU = { ac: null, master: null, sfx: null, mus: null, noise: null, waves: {}, muted: false, amb: null };

function crushCurve(steps) {
  const n = 2048, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.round(x * steps) / steps; }
  return c;
}
function unlockAudio() {
  if (!AU.ac) {
    try { const AC = window.AudioContext || window.webkitAudioContext; AU.ac = new AC(); } catch (e) { return; }
    const ac = AU.ac;
    AU.master = ac.createGain(); AU.master.gain.value = AU.muted ? 0 : 0.75;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    AU.master.connect(comp); comp.connect(ac.destination);
    // 4-bit-ish crunch on SFX bus for that arcade feel
    const crush = ac.createWaveShaper(); crush.curve = crushCurve(12);
    AU.sfx = ac.createGain(); AU.sfx.gain.value = 0.9; AU.sfx.connect(crush); crush.connect(AU.master);
    AU.mus = ac.createGain(); AU.mus.gain.value = 0.5; AU.mus.connect(AU.master);
    const len = ac.sampleRate; const buf = ac.createBuffer(1, len, ac.sampleRate); const d = buf.getChannelData(0);
    // NES-like LFSR noise
    let reg = 1; for (let i = 0; i < len; i++) { const bit = (reg ^ (reg >> 1)) & 1; reg = (reg >> 1) | (bit << 14); d[i] = (reg & 1) ? 0.9 : -0.9; if (i % 2) d[i] = d[i - 1]; }
    AU.noise = buf;
    const wbuf = ac.createBuffer(1, len, ac.sampleRate), wd = wbuf.getChannelData(0);
    for (let i = 0; i < len; i++) wd[i] = Math.random() * 2 - 1;
    AU.white = wbuf;
    for (const duty of [0.125, 0.25, 0.5]) {
      const n = 48, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty);
      AU.waves[duty] = ac.createPeriodicWave(re, im);
    }
    if (Music.want) { const w = Music.want; Music.cur = null; playMusic(w); }
    if (AU.ambWant) ambient(AU.ambWant);
  }
  if (AU.ac.state === 'suspended') AU.ac.resume();
}
function toggleMute() {
  AU.muted = !AU.muted;
  if (AU.master) AU.master.gain.setTargetAtTime(AU.muted ? 0 : 0.75, AU.ac.currentTime, 0.02);
}

function osc(type, freq, t0, dur, vol, dest, o = {}) {
  const ac = AU.ac; const os = ac.createOscillator();
  if (AU.waves[type]) os.setPeriodicWave(AU.waves[type]); else os.type = type;
  os.frequency.setValueAtTime(freq, t0);
  if (o.slide) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + (o.slideT || dur));
  const g = ac.createGain(); const at = o.attack || 0.003;
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + at);
  if (o.hold) { g.gain.setValueAtTime(vol, t0 + o.hold); }
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  os.connect(g); g.connect(dest || AU.sfx); os.start(t0); os.stop(t0 + dur + 0.05);
  if (o.vib) {
    const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vibF || 5.5; lg.gain.value = o.vib;
    l.connect(lg); lg.connect(os.frequency); l.start(t0 + (o.vibD || 0)); l.stop(t0 + dur + 0.05);
  }
  return os;
}
function nz(t0, dur, vol, o = {}) {
  const ac = AU.ac; const s = ac.createBufferSource(); s.buffer = o.white ? AU.white : AU.noise; s.loop = true;
  if (o.rate) s.playbackRate.value = o.rate;
  const fl = ac.createBiquadFilter(); fl.type = o.type || 'lowpass';
  fl.frequency.setValueAtTime(o.f || 2000, t0); if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
  fl.Q.value = o.q || 0.8;
  const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (o.attack || 0.002));
  if (o.hold) g.gain.setValueAtTime(vol, t0 + o.hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(fl); fl.connect(g); g.connect(o.dest || AU.sfx); s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.05);
}

function sfx(name, p) {
  if (!AU.ac || AU.muted) return;
  const t = AU.ac.currentTime + 0.005;
  switch (name) {
    case 'whiff': nz(t, .1, .22, { type: 'bandpass', f: 600, f2: 2600, q: 1.4, white: true }); break;
    case 'whiffH': nz(t, .16, .28, { type: 'bandpass', f: 400, f2: 2000, q: 1.2, white: true }); break;
    case 'hitL': nz(t, .06, .6, { type: 'lowpass', f: 3500 }); osc(0.5, 240, t, .07, .28, null, { slide: 80 }); break;
    case 'hitM': nz(t, .1, .7, { type: 'lowpass', f: 2600, f2: 600 }); osc(0.25, 170, t, .12, .32, null, { slide: 50 }); osc('triangle', 110, t, .16, .55, null, { slide: 40 }); break;
    case 'hitH': nz(t, .16, .8, { type: 'lowpass', f: 2200, f2: 300 }); osc(0.5, 130, t, .22, .36, null, { slide: 35 }); osc('triangle', 80, t, .28, .7, null, { slide: 28 }); break;
    case 'block': osc(0.125, 1250, t, .045, .2); osc(0.125, 1900, t + .02, .06, .15); nz(t, .04, .3, { type: 'highpass', f: 3000, white: true }); break;
    case 'jump': osc(0.5, 190, t, .12, .13, null, { slide: 440 }); break;
    case 'land': nz(t, .07, .3, { type: 'lowpass', f: 420 }); break;
    case 'fall': nz(t, .25, .7, { type: 'lowpass', f: 700, f2: 90 }); osc('triangle', 90, t, .3, .7, null, { slide: 30 }); break;
    case 'ko': osc(0.5, 700, t, 1.1, .22, null, { slide: 55 }); osc(0.25, 466, t + .06, 1.0, .16, null, { slide: 40 }); nz(t, .5, .5, { f: 1500, f2: 90 }); break;
    case 'select': osc(0.25, 660, t, .05, .14); break;
    case 'confirm': [523, 659, 784, 1047].forEach((f, i) => osc(0.25, f, t + i * .045, .07, .15)); break;
    case 'back': osc(0.25, 500, t, .06, .14, null, { slide: 300 }); break;
    case 'blip': osc(0.5, p || 440, t, .028, .06); break;
    case 'throw': nz(t, .14, .3, { type: 'bandpass', f: 500, f2: 1800, q: 1.3, white: true }); osc(0.25, 300, t, .1, .1, null, { slide: 700 }); break;
    case 'chancla': nz(t, .05, .7, { type: 'highpass', f: 1400, white: true }); osc(0.5, 420, t, .06, .25, null, { slide: 180 }); break;
    case 'smoke': nz(t, .5, .35, { type: 'lowpass', f: 900, f2: 300, attack: .05, white: true }); break;
    case 'cough': for (let i = 0; i < 3; i++) nz(t + i * .13, .09, .45, { type: 'bandpass', f: 700, q: 2, white: true }); break;
    case 'can': osc(0.125, 1500, t, .09, .2); osc(0.125, 2300, t + .01, .07, .14); osc(0.125, 1100, t + .09, .08, .12); break;
    case 'fizz': nz(t, .5, .25, { type: 'highpass', f: 4000, f2: 7000, white: true }); break;
    case 'shock': nz(t, .6, .8, { f: 700, f2: 60 }); osc('triangle', 70, t, .55, .8, null, { slide: 25 }); break;
    case 'dash': nz(t, .14, .3, { type: 'bandpass', f: 300, f2: 1400, q: 1, white: true }); break;
    case 'steal': [880, 1175, 1568].forEach((f, i) => osc(0.25, f, t + i * .05, .08, .12)); break;
    case 'super': for (let i = 0; i < 10; i++) osc(0.25, 220 * Math.pow(2, i / 5), t + i * .035, .08, .16);
      nz(t, .5, .35, { type: 'bandpass', f: 300, f2: 5000, q: .8, white: true }); break;
    case 'coin': osc(0.5, 988, t, .08, .16); osc(0.5, 1319, t + .08, .35, .16); break;
    case 'item': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => osc(0.25, f, t + i * .08, .12, .14)); break;
    case 'thunder': nz(t, 2.2, .9, { f: 500, f2: 50, white: true, attack: .02 }); break;
    case 'crowd': nz(t, 1.3, .22, { type: 'bandpass', f: 1000, q: .5, attack: .25, white: true }); nz(t + .1, 1.1, .15, { type: 'bandpass', f: 1800, q: .7, attack: .2, white: true }); break;
    case 'ooh': nz(t, .8, .15, { type: 'bandpass', f: 500, q: 2, attack: .15, white: true }); break;
    case 'door': nz(t, .35, .5, { f: 380 }); osc(0.5, 90, t, .2, .2, null, { slide: 60 }); break;
    case 'beep': osc(0.5, p || 1200, t, .07, .12); break;
    case 'chime': osc('sine', 880, t, .7, .22); osc('sine', 698, t + .45, .9, .22); break;
    case 'whoosh': nz(t, .6, .3, { type: 'bandpass', f: 200, f2: 1600, q: .7, white: true, attack: .2 }); break;
    case 'pigeon': for (let i = 0; i < 4; i++) nz(t + i * .06, .05, .25, { type: 'bandpass', f: 1800, q: 1.5, white: true }); break;
    case 'bark': osc(0.25, 520, t, .09, .18, null, { slide: 320 }); osc(0.25, 480, t + .15, .09, .16, null, { slide: 300 }); break;
    case 'plane': nz(t, 2.5, .4, { f: 300, f2: 1200, attack: 1, white: true }); break;
    case 'round': osc(0.5, 392, t, .12, .15); osc(0.5, 523, t + .12, .25, .15); break;
    case 'fight': [392, 523, 659, 784].forEach((f, i) => osc(0.25, f, t + i * .05, .2, .15)); osc('triangle', 98, t, .5, .5); break;
    case 'lowhp': osc(0.5, 880, t, .06, .08); break;
    case 'tick': osc(0.125, 1800, t, .02, .06); break;
  }
}

// ---------- ambient loops ----------
function ambient(name) {
  AU.ambWant = name;
  if (!AU.ac) return;
  if (AU.amb) { const old = AU.amb; old.g.gain.setTargetAtTime(0.0001, AU.ac.currentTime, 0.3); setTimeout(() => old.nodes.forEach(n => { try { n.stop(); } catch (e) { } }), 1500); AU.amb = null; }
  if (!name) return;
  const ac = AU.ac, g = ac.createGain(); g.gain.value = 0.0001; g.connect(AU.master);
  const nodes = [];
  const src = (buf, type, f, q, vol) => {
    const s = ac.createBufferSource(); s.buffer = buf; s.loop = true;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const gg = ac.createGain(); gg.gain.value = vol; s.connect(fl); fl.connect(gg); gg.connect(g); s.start(); nodes.push(s); return fl;
  };
  if (name === 'plane') { src(AU.white, 'lowpass', 260, .7, .5); src(AU.white, 'bandpass', 120, 3, .4); }
  if (name === 'airport') { src(AU.white, 'bandpass', 480, 1.4, .07); src(AU.white, 'bandpass', 900, 2, .04); }
  if (name === 'street') { src(AU.white, 'bandpass', 700, 1.2, .045); }
  if (name === 'rain') { src(AU.white, 'highpass', 2500, .5, .12); src(AU.white, 'lowpass', 400, .5, .12); }
  g.gain.setTargetAtTime(1, ac.currentTime, 0.5);
  AU.amb = { g, nodes };
}

// ---------- announcer (browser TTS, optional) ----------
function announce() { /* voice announcer removed */ }

// ============================================================
//  MUSIC — step sequencer. Tokens per 16th: note (A4, C#5, A3+C4+E4), '-' hold, '.' rest
//  drums: k kick, s snare, h hat, o open hat, c crash, p palmas (clap)
// ============================================================
const NOTE_I = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function nfreq(n, tr = 0) { const m = /^([A-G]#?)(\d)$/.exec(n); if (!m) return 0; const midi = (+m[2] + 1) * 12 + NOTE_I[m[1]] + tr; return 440 * Math.pow(2, (midi - 69) / 12); }
function parseCh(str) {
  const tk = str.replace(/\|/g, ' ').trim().split(/\s+/); const ev = [];
  for (let i = 0; i < tk.length; i++) {
    const t = tk[i]; if (t === '-' || t === '.') continue;
    let len = 1; while (i + len < tk.length && tk[i + len] === '-') len++;
    ev.push({ s: i, len, n: t });
  }
  return { ev, len: tk.length };
}
const rep = (s, n) => Array(n).fill(s).join(' ');

const TRACKS = {};
(function compose() {
  // ---- FIGHT: andalusian cadence Am G F E, flamenco/phrygian flavour
  const fLeadA = 'E5 - - F5 E5 - D5 - C5 - D5 - E5 - - - | D5 - - E5 D5 - C5 - B4 - C5 - D5 - - - | C5 - - D5 C5 - B4 - A4 - B4 - C5 - B4 A4 | G#4 - - - B4 - - - E5 - - - . . . .';
  const fLeadB = 'A5 - G#5 A5 - E5 - C5 A4 - C5 E5 A5 - - - | G5 - F#5 G5 - D5 - B4 G4 - B4 D5 G5 - - - | F5 - E5 F5 - C5 - A4 F4 - A4 C5 F5 - E5 D5 | E5 - F5 - G#5 - A5 - B5 - C6 - B5 - G#5 -';
  const fArp = [rep('A4 C5 E5 C5', 4), rep('G4 B4 D5 B4', 4), rep('F4 A4 C5 A4', 4), rep('E4 G#4 B4 G#4', 4)].join(' | ');
  const fBass = 'A2 . A3 . A2 . A3 . A2 . A3 . G2 . E2 . | G2 . G3 . G2 . G3 . G2 . G3 . D3 . B2 . | F2 . F3 . F2 . F3 . F2 . F3 . C3 . A2 . | E2 . E3 . E2 . E3 . G#2 . B2 . E3 . D3 .';
  const dr = 'k . h . s . h k k . h . s . h h', drC = 'c . h . s . h k k . h . s . h h', fill = 'k . s . s . s s k s s s s s s s';
  TRACKS.fight = {
    bpm: 150, ch: [
      { w: 0.25, v: .075, n: fLeadA + ' | ' + fLeadB, gate: .9 },
      { w: 0.125, v: .035, n: fArp + ' | ' + fArp, gate: .7 },
      { w: 'triangle', v: .26, n: fBass + ' | ' + fBass, gate: .8 },
      { w: 'drum', v: 1, n: [drC, dr, dr, fill, drC, dr, dr, fill].join(' | ') }
    ]
  };
  // ---- BOSS: E phrygian dominant, faster, heavier
  const bLead = 'E5 - F5 - G#5 - - - A5 - G#5 - F5 - E5 - | F5 - G#5 - A5 - - - B5 - A5 - G#5 - F5 - | G5 - A5 - B5 - - - D6 - C6 - B5 - A5 - | G#5 - F5 - E5 - - - E6 - - - E5 - - -';
  const bLead2 = 'B5 - - - C6 - B5 - A5 - G#5 - A5 - B5 - | C6 - - - B5 - A5 - G#5 - F5 - G#5 - A5 - | B5 - - - D6 - C6 - B5 - A5 - G5 - F5 - | E5 - F5 E5 G#5 - F5 E5 E5 - - - - - . .';
  const bBar = r => `${r}2 ${r}2 . ${r}3 ${r}2 . ${r}2 ${r}3 ${r}2 ${r}2 . ${r}3 ${r}2 . ${r}3 ${r}2`;
  const bBass = [bBar('E'), bBar('F'), bBar('G'), bBar('F')].join(' | ');
  const bArp = [rep('E4 G#4 B4 G#4', 4), rep('F4 A4 C5 A4', 4), rep('G4 B4 D5 B4', 4), rep('F4 A4 C5 A4', 4)].join(' | ');
  const bd = 'k h s h k k s h k h s h k k s h', bdC = 'c h s h k k s h k h s h k k s h', bf = 'k s s s k s s s s s s s s s s s';
  TRACKS.boss = {
    bpm: 164, ch: [
      { w: 0.25, v: .075, n: bLead + ' | ' + bLead2, gate: .9 },
      { w: 0.125, v: .035, n: bArp + ' | ' + bArp, gate: .6 },
      { w: 'triangle', v: .28, n: bBass + ' | ' + bBass, gate: .7 },
      { w: 'drum', v: 1, n: [bdC, bd, bd, bf, bdC, bd, bd, bf].join(' | ') }
    ]
  };
  // ---- RUMBA (title / walking): rumba catalana, Am Dm E Am
  const rLeadA = 'E5 - - E5 - - A5 - G5 - F5 - E5 - - - | F5 - - F5 - - A5 - G5 - F5 - D5 - - - | E5 - - D5 - - C5 - B4 - C5 - B4 - G#4 - | A4 - - - - - - - . . E4 G#4 A4 B4 C5 D5';
  const rLeadB = 'A5 - G5 - E5 - C5 - D5 - E5 - C5 - A4 - | D5 - F5 - A5 - F5 - E5 - D5 - C5 - D5 - | B4 - - G#4 - - E4 - F4 - G#4 - A4 - B4 - | C5 - B4 - A4 - - - . . . . . . . .';
  const strum = c => `${c} . . ${c} . . ${c} . ${c} . ${c} ${c} . ${c} . .`;
  const rCh = [strum('A3+C4+E4'), strum('D4+F4+A4'), strum('E4+G#4+B4'), strum('A3+C4+E4')].join(' | ');
  const rbar = (a, b) => `${a}2 . . . ${b}2 . . ${a}2 . . ${a}2 . ${b}2 . . .`;
  const rBass = [rbar('A', 'E'), rbar('D', 'A'), rbar('E', 'B'), rbar('A', 'E')].join(' | ');
  const rd = 'k . p . . k p . k . p . . k p h';
  TRACKS.rumba = {
    bpm: 118, ch: [
      { w: 0.25, v: .07, n: rLeadA + ' | ' + rLeadB, gate: .85, vib: 4 },
      { w: 0.5, v: .022, n: rCh + ' | ' + rCh, gate: .35 },
      { w: 'triangle', v: .25, n: rBass + ' | ' + rBass, gate: .6 },
      { w: 'drum', v: .8, n: rep(rd, 8) }
    ]
  };
  // ---- AIRPORT (farewell): Am F C G, slow & tender
  const aLead = 'E5 - - - D5 - C5 - D5 - - - E5 - - - | C5 - - - A4 - - - C5 - D5 - C5 - - - | G4 - - - C5 - - - E5 - - - G5 - - - | F5 - E5 - D5 - - - B4 - - - . . . .';
  const aLead2 = 'A5 - - - G5 - E5 - G5 - - - A5 - - - | F5 - - - C5 - - - F5 - G5 - F5 - - - | E5 - - - G5 - - - C6 - - - B5 - A5 - | G5 - - - - - - - D5 - - - B4 - - -';
  const aArp = [rep('A3 E4 A4 E4', 4), rep('F3 C4 F4 C4', 4), rep('C4 G4 C5 G4', 4), rep('G3 D4 G4 D4', 4)].join(' | ');
  TRACKS.airport = {
    bpm: 82, ch: [
      { w: 0.5, v: .055, n: aLead + ' | ' + aLead2, gate: .95, vib: 5, vibD: .15 },
      { w: 'triangle', v: .2, n: aArp + ' | ' + aArp, gate: .9 },
    ]
  };
  // ---- FLIGHT (hope, Barcelona): D A Bm G
  const flLead = 'F#5 - - - A5 - - - D6 - - - A5 - - - | E5 - - - A5 - - - C#6 - - - A5 - - - | D5 - - - F#5 - - - B5 - - - F#5 - - - | G5 - - - B5 - A5 - G5 - F#5 - E5 - - -';
  const flArp = [rep('D4 F#4 A4 F#4', 4), rep('A3 C#4 E4 C#4', 4), rep('B3 D4 F#4 D4', 4), rep('G3 B3 D4 B3', 4)].join(' | ');
  const flBass = 'D2 - - - - - - - A2 - - - - - - - | A2 - - - - - - - E2 - - - - - - - | B2 - - - - - - - F#2 - - - - - - - | G2 - - - - - - - A2 - - - - - - -';
  TRACKS.flight = {
    bpm: 100, ch: [
      { w: 0.25, v: .065, n: flLead, gate: .95, vib: 5, vibD: .2 },
      { w: 0.125, v: .03, n: flArp, gate: .7 },
      { w: 'triangle', v: .22, n: flBass, gate: .95 },
      { w: 'drum', v: .5, n: rep('k . . . h . . . k . k . h . . .', 4) }
    ]
  };
  TRACKS.victory = {
    bpm: 150, loop: false, ch: [
      { w: 0.25, v: .08, n: 'C5 . C5 . C5 . G5 - - - E5 - G5 - C6 - - - - - - - . . . . . . . .' },
      { w: 0.125, v: .04, n: 'E4 . E4 . E4 . B4 - - - G4 - B4 - E5 - - - - - - - . . . . . . . .' },
      { w: 'triangle', v: .25, n: 'C3 . C3 . C3 . G2 - - - C3 - E3 - C3 - - - - - - - . . . . . . . .' },
      { w: 'drum', v: 1, n: 'k . k . k . s . . . k . s . c . . . . . . . . . . . . . . .' }
    ]
  };
  TRACKS.gameover = {
    bpm: 90, loop: false, ch: [
      { w: 0.5, v: .06, n: 'A4 - - - G#4 - - - G4 - - - F#4 - - - F4 - - - - - - - . . . .', vib: 6 },
      { w: 'triangle', v: .22, n: 'A2 - - - G#2 - - - G2 - - - F#2 - - - F2 - - - - - - - . . . .' }
    ]
  };
  for (const k in TRACKS) for (const c of TRACKS[k].ch) { Object.assign(c, parseCh(c.n)); c.tk = c.n.replace(/\|/g, ' ').trim().split(/\s+/); c.at = {}; for (const e of c.ev) (c.at[e.s] = c.at[e.s] || []).push(e); }
  for (const k in TRACKS) TRACKS[k].len = Math.max(...TRACKS[k].ch.map(c => c.len));
})();

const Music = { cur: null, want: null, step: 0, next: 0, timer: null, gain: null };
function playMusic(name) {
  Music.want = name;
  if (!AU.ac) return;
  if (Music.cur === name) return;
  stopMusic(true);
  Music.want = name;
  if (!name || !TRACKS[name]) return;
  Music.cur = name; Music.step = 0; Music.next = AU.ac.currentTime + 0.08;
  Music.gain = AU.ac.createGain(); Music.gain.gain.value = 1; Music.gain.connect(AU.mus);
  Music.timer = setInterval(schedMusic, 25);
}
function stopMusic(quick) {
  if (Music.timer) clearInterval(Music.timer); Music.timer = null;
  if (Music.gain && AU.ac) { const g = Music.gain; g.gain.setTargetAtTime(0.0001, AU.ac.currentTime, quick ? 0.03 : 0.3); setTimeout(() => g.disconnect(), 1500); }
  Music.gain = null; Music.cur = null; Music.want = null;
}
function drum(k, t, dest, v) {
  const o = { dest };
  if (k === 'k' || k === 'c') { osc('sine', 150, t, .16, .8 * v, dest, { slide: 40, slideT: .12 }); nz(t, .03, .3 * v, { f: 1200, dest }); }
  if (k === 's') { nz(t, .12, .45 * v, { type: 'highpass', f: 1200, dest }); osc('triangle', 220, t, .08, .35 * v, dest, { slide: 120 }); }
  if (k === 'h') nz(t, .035, .18 * v, { type: 'highpass', f: 6000, dest, white: true });
  if (k === 'o') nz(t, .18, .16 * v, { type: 'highpass', f: 5000, dest, white: true });
  if (k === 'c') nz(t, .8, .28 * v, { type: 'highpass', f: 3000, dest, white: true });
  if (k === 'p') { nz(t, .05, .35 * v, { type: 'bandpass', f: 1500, q: 1.2, dest, white: true }); nz(t + .012, .07, .3 * v, { type: 'bandpass', f: 1300, q: 1.2, dest, white: true }); }
  return o;
}
function schedMusic() {
  if (!AU.ac || !Music.cur) return;
  const tr = TRACKS[Music.cur]; const sd = 60 / tr.bpm / 4;
  while (Music.next < AU.ac.currentTime + 0.14) {
    const st = Music.step, t = Music.next;
    for (const c of tr.ch) {
      const s = st % tr.len; // channels shorter than track loop independently
      if (c.w === 'drum') {
        const tk = c.tk[st % c.len];
        if (tk && tk !== '.' && tk !== '-') drum(tk, t, Music.gain, c.v);
        continue;
      }
      for (const e of (c.at[st % c.len] || [])) {
        const dur = e.len * sd * (c.gate || .9);
        for (const n of e.n.split('+')) {
          const f = nfreq(n); if (!f) continue;
          osc(c.w, f, t, Math.max(.05, dur), c.v, Music.gain, { attack: .004, hold: Math.max(0.01, dur * .6), vib: c.vib ? f * 0.006 : 0, vibD: c.vibD || 0.1 });
        }
      }
      void s;
    }
    Music.step++; Music.next += sd;
    if (Music.step >= tr.len) {
      if (tr.loop === false) { const g = Music.gain; Music.cur = null; clearInterval(Music.timer); Music.timer = null; setTimeout(() => g && g.disconnect(), 4000); Music.gain = null; return; }
      Music.step = 0;
    }
  }
}
