'use strict';
// ============================================================
//  MAIN LOOP — fixed 60Hz update, render every frame
// ============================================================
let GT = 0;
function tick() {
  Input.poll();
  if (Input.hit('mute')) toggleMute();
  try { SCN.update(); } catch (e) { console.error(e); }
  Fade.update(); FX.update();
  Input.endFrame(); GT++;
}
function render() {
  ctx.fillStyle = '#07060b'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(FX.ox, FX.oy);
  try { SCN.draw(ctx); } catch (e) { console.error(e); }
  ctx.restore();
  if (FX.flash > 0) { ctx.globalAlpha = Math.min(1, FX.flash / 4) * .7; ctx.fillStyle = FX.flashCol; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  drawFade(ctx, Fade.a, Fade.col);
  if (AU.muted) tiny(ctx, 'MUTE', W - 20, H - 7, '#ff8080');
}
let last = performance.now(), acc = 0;
const STEP = 1000 / 60;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  let n = 0; while (acc >= STEP && n < 5) { tick(); acc -= STEP; n++; }
  if (n === 5) acc = 0;
  render();
  requestAnimationFrame(frame);
}
// dev shortcuts: #airport  #flight  #stage=0..4  #arrival  #ending  #quick
const HASH = location.hash.slice(1);
go(new BootScene());
if (HASH) {
  const b = SCN; const orig = b.update.bind(b);
  b.update = () => {
    if (!b.ready) return orig();
    const [k, v] = HASH.split('=');
    GAME.startTime = performance.now();
    if (k === 'airport') go(new AirportScene());
    else if (k === 'flight') go(new FlightScene());
    else if (k === 'arrival') go(new StageScene(0, { mode: 'arrival' }));
    else if (k === 'stage') go(new StageScene(+v || 0));
    else if (k === 'fight') go(new StageScene(+v || 0, { mode: 'retry' }));
    else if (k === 'ending') go(new EndingScene(760, 420));
    else if (k === 'quick') go(new QuickScene());
    else orig();
  };
}
requestAnimationFrame(frame);
