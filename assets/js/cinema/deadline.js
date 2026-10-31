/*
 * AI meets the deadline: why a real-time controller should use an AI's latest
 * answer rather than wait for it, and stop trusting an answer that is too old.
 *
 * The argument is the lab film's (scripts/narration.json, prefix
 * "determinism") and DeadlineModel's, cut to the one idea that a viewer who
 * knows nothing about it can follow: a controller on a fixed beat, an AI on a
 * variable clock; waiting for the AI misses beats; not waiting keeps every
 * beat but lets the answer in use go stale; so answers carry the time they
 * were made and expire into a safe action. The shared-chip and action-limit
 * points of earlier cuts are left to the lab page.
 *
 * The telling (2026-10-31, after three cuts the owner could not follow): one
 * flat picture, built up the way a 3Blue1Brown scene is, where every motion is
 * the sentence being spoken. Above, a hand must stay under a moving ball; below,
 * two lanes of time, the controller's beats and the AI's answers. The hand
 * moves only on the controller's beats and only to what the answer in use
 * says, so each failure the narration names is something the viewer sees
 * happen: the hand freezing while the controller waits, the hand under where
 * the ball was while the answer is old, the hand stopping once the answer has
 * expired. No name in the voice; the open research direction is said on the
 * card. Everything is drawn on one 2D canvas from film time, from a fixed,
 * seeded schedule that is computed once.
 */
import { THREE, AUTHOR, createCinema, captionsFromTimeline, lerp, ramp, ease, win, seeded } from './engine.js';

const T = { hook: 0, beat: 11.4, think: 22.4, wait: 33.4, split: 44.2, stale: 53.6, stamp: 64.6, rule: 75.8, open: 84.4, close: 96.4, card: 103.5 };
const D = 107.5;

const TL_DIR = new URL('../../audio/cinema/deadline/', import.meta.url);
const TL = await fetch(new URL('timeline.json', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
if (TL) for (const l of TL.lines) if (T[l.id] !== l.at) console.warn(`deadline: cue "${l.id}" is ${T[l.id]} here and ${l.at} in the voice script`);
function makeWarp(anchors) {
  return real => {
    let i = 0;
    while (i < anchors.length - 2 && real > anchors[i + 1][0]) i++;
    const [r0, a0] = anchors[i], [r1, a1] = anchors[i + 1];
    if (real >= r1) return a1 + (real - r1);
    return a0 + (a1 - a0) * (real - r0) / (r1 - r0);
  };
}
// authored time a spoken word begins (lines barely stretch, so at + offset is close enough)
function W(id, word, fallback) {
  const l = TL && TL.lines.find(x => x.id === id);
  const w = l && l.words && l.words.find(x => x[0].toLowerCase().replace(/[^a-z']/g, '') === word);
  return T[id] + 0.35 + (w ? w[1] : fallback);
}

/* -------------------------------------------------------------- palette */
const C = {
  bg: '#0b0f17', ink: '#eef3f9', dim: '#8c9bb0', faint: 'rgba(140,155,176,.35)',
  ball: '#ffd166', hand: '#58c4dd', ai: '#58c4dd', ok: '#5dffc8', late: '#ff6272', safe: '#ffb347',
};

/* ------------------------------------------------------------ the world
   The ball moves on a track; the hand must stay under it. */
const BX = t => 900 + 420 * Math.sin(0.7 * t + 0.3);
const BV = t => 420 * 0.7 * Math.cos(0.7 * t + 0.3);
const CUP = 100;                       // half the cup's width: further off than this, the ball is not over it

/* ------------------------------------------------------------ the schedule
   Computed once; draw(t) only reads it. Authored seconds throughout. */
const B = 0.2;                          // one beat (drawn slower than a real controller, so each one can be seen)
const AGE = 0.6;                        // an answer older than this is too old to use
const M1 = W('beat', 'beat', 2.4);      // the controller's beats appear: the hand moves only on them
const M2 = W('wait', 'waits', 2.0);     // the controller waits for every answer
const M3 = W('split', 'never', 0.8);    // it never waits, and uses the latest answer
const M4 = W('stamp', 'too', 3.6);      // and stops trusting an answer that is too old
const AI_ON = W('think', 'pace', 1.2);
const FREEZE = [W('hook', 'but', 6.6) + 0.2, W('hook', 'but', 6.6) + 2.6];
// a slow answer is forced where the ball crosses the middle at full speed, so the hand's lag is plain to see
const centreAfter = s => Math.ceil((0.7 * s + 0.3) / Math.PI) * Math.PI / 0.7 - 0.3 / 0.7;
const FORCED = [
  { f: M2 + 0.3, d: 1.3 }, { f: M2 + 3.8, d: 1.6 },
  { f: W('stale', 'gets', 4.0) - 0.35, d: 3.2 },
  { f: centreAfter(M4 + 0.1) - 0.5, d: 1.7 },
  { f: T.open + 3.0, d: 1.2 },
];
const rnd = seeded(2031);
const fastD = () => 0.07 + rnd() * 0.1;
function duration(e, pSlow) {
  for (const F of FORCED) if (!F.used && e >= F.f && e < F.f + 0.25) { F.used = true; return F.d; }
  return rnd() < pSlow ? 0.8 + rnd() * 0.6 : fastD();
}
// the AI's answers: shown alone in the think scene, then asked by a waiting
// controller, then running back to back beside one that never waits
const REQ = [];
for (let e = AI_ON; e < M2 - 0.3;) { const d = duration(e, 0.12); REQ.push({ e, a: e + d, kind: 'show' }); e += d + 0.02; }
for (let e = M3; e < D;) { const d = duration(e, e > T.open ? 0.16 : 0); REQ.push({ e, a: e + d, kind: 'async' }); e += d + 0.02; }
// the controller's beats: what it did on each, and where it sent the hand
const NK = Math.ceil(D / B) + 2;
const TICK = [];
{
  let hand = BX(0), pending = null;
  for (let k = 0; k < NK; k++) {
    const tk = k * B;
    let out = -1, tgt = BX(tk), plan = null;
    if (tk < M1) { tgt = BX(tk); }
    else if (tk < M2) { out = 0; tgt = BX(tk); }
    else if (tk < M3) {
      if (pending && pending.a > tk) { out = 1; tgt = hand; plan = pending; }
      else if (pending) { out = 0; tgt = BX(pending.e); plan = pending; pending = null; }
      else {
        const d = duration(tk, 0), r = { e: tk, a: tk + d, kind: 'block' };
        REQ.push(r); plan = r;
        if (d < B * 0.9) { out = 0; tgt = BX(tk); } else { out = 1; tgt = hand; pending = r; }
      }
    } else {
      for (const r of REQ) if (r.kind === 'async' && r.a <= tk && (!plan || r.a > plan.a)) plan = r;
      if (!plan) { out = 0; tgt = hand; }
      else if (tk >= M4 && tk - plan.e > AGE) { out = 2; tgt = hand; }
      else { out = 0; tgt = BX(plan.e); }
    }
    TICK.push({ t: tk, out, tgt, plan, from: hand });
    hand = tgt;
  }
}
// where the hand is at t
function handAt(t) {
  if (t < M1) {
    const f = t > FREEZE[0] && t < FREEZE[1] + 0.5;
    if (!f) return BX(t - 0.06);
    const held = BX(FREEZE[0] - 0.06);
    return lerp(held, BX(t - 0.06), ease.inOutSine(ramp(t, FREEZE[1], FREEZE[1] + 0.5)));
  }
  const k = Math.max(0, Math.min(NK - 1, Math.floor(t / B)));
  const tk = TICK[k];
  const u = ease.outCubic(ramp(t, tk.t, tk.t + 0.1));
  const blend = ramp(t, M1, M1 + 0.4);          // ease from the hook's smooth follow into the beats
  return lerp(BX(t - 0.06), lerp(tk.from, tk.tgt, u), blend);
}
const tickAt = t => TICK[Math.max(0, Math.min(NK - 1, Math.floor(t / B)))];

/* --------------------------------------------------------------- drawing */
const NOW = 1300, S = 240;               // the timeline: "now" at x 1260, 240 px a second
const X0 = 190, X1 = 1770;
const LC = 610, LA = 770;                // controller lane, AI lane
const tx = (t, now) => NOW + (t - now) * S;

function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function label(g, s, x, y, a, o = {}) {
  if (a <= 0.003 || !s) return;
  g.save();
  g.globalAlpha = Math.min(1, a);
  g.font = o.font || '500 34px "Inter", sans-serif';
  g.fillStyle = o.color || C.ink;
  g.textAlign = o.align || 'left';
  g.textBaseline = o.base || 'alphabetic';
  g.fillText(s, x, y + (1 - Math.min(1, a * 1.4)) * 10);
  g.restore();
}
function arrow(g, x0, y0, x1, y1, color, a, w = 3, dash) {
  if (a <= 0.003) return;
  g.save(); g.globalAlpha = Math.min(1, a); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = w;
  if (dash) g.setLineDash(dash);
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
  const an = Math.atan2(y1 - y0, x1 - x0), h = 14;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - h * Math.cos(an - 0.45), y1 - h * Math.sin(an - 0.45));
  g.lineTo(x1 - h * Math.cos(an + 0.45), y1 - h * Math.sin(an + 0.45)); g.closePath(); g.fill();
  g.restore();
}

function draw(g, t) {
  g.clearRect(0, 0, 1920, 1080);
  const all = win(t, -2, T.card + 0.1, 0.6, 0.7);
  const dimForClose = 1 - 0.75 * ease.inOutSine(ramp(t, T.close - 0.2, T.close + 0.9));
  const pic = all * dimForClose;
  const tk = tickAt(t);
  const phase = t < M1 ? 0 : t < M2 ? 1 : t < M3 ? 2 : t < M4 ? 3 : 4;

  /* ---- the world: track, ball, hand, the AI that watches */
  const ball = BX(t), hand = handAt(t);
  const BY = 225, HY = 335;
  g.save(); g.globalAlpha = pic;
  g.strokeStyle = C.faint; g.lineWidth = 2;
  g.beginPath(); g.moveTo(380, HY + 38); g.lineTo(1420, HY + 38); g.stroke();
  // the ghost: where the ball was when the answer in use was made
  const plan = tk.plan;
  const ghostA = (phase >= 3 ? 1 : 0) * win(t, W('stale', 'describes', 6.0) - 0.6, T.rule, 0.5, 0.6);
  if (ghostA > 0 && plan) {
    const gx = BX(plan.e);
    g.globalAlpha = pic * ghostA * Math.min(1, Math.abs(gx - ball) / 60);
    g.setLineDash([8, 7]); g.strokeStyle = C.safe; g.lineWidth = 3;
    g.beginPath(); g.arc(gx, BY, 42, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    label(g, 'where the ball was', gx, BY - 64, pic * ghostA * Math.min(1, Math.abs(gx - ball) / 120), { align: 'center', color: C.safe, font: '500 40px "Inter", sans-serif' });
    g.globalAlpha = pic;
  }
  // the ball
  g.fillStyle = C.ball;
  g.shadowColor = C.ball; g.shadowBlur = 24;
  g.beginPath(); g.arc(ball, BY, 42, 0, Math.PI * 2); g.fill();
  g.shadowBlur = 0;
  // the hand: a cup that flashes when the controller moves it
  const fired = phase >= 1 ? Math.exp(-(t - tk.t) / 0.09) : 0;
  const hc = tk.out === 1 && phase >= 1 ? C.late : tk.out === 2 ? C.safe : C.hand;
  g.strokeStyle = hc; g.lineWidth = 9 + 4 * fired; g.lineCap = 'round'; g.lineJoin = 'round';
  g.shadowColor = hc; g.shadowBlur = 10 + 20 * fired;
  g.beginPath(); g.moveTo(hand - CUP, HY - 44); g.lineTo(hand - CUP + 22, HY + 22); g.lineTo(hand + CUP - 22, HY + 22); g.lineTo(hand + CUP, HY - 44); g.stroke();
  g.shadowBlur = 0;
  // off: the gap between where the ball is and where the hand is
  const off = Math.abs(hand - ball) - CUP;
  if (off > 0) {
    const oc = tk.out === 2 ? C.safe : C.late;
    g.globalAlpha = pic * Math.min(1, off / 40);
    g.strokeStyle = oc; g.lineWidth = 6;
    g.beginPath(); g.moveTo(ball, BY + 60); g.lineTo(hand, BY + 60); g.stroke();
    g.globalAlpha = pic;
  }
  g.restore();
  // the AI, watching the ball and telling the hand
  const aiA = pic * win(t, 0.8, 1e9, 0.6, 0.1);
  g.save(); g.globalAlpha = aiA;
  g.strokeStyle = C.ai; g.lineWidth = 3; rr(g, 1560, 180, 190, 100, 22); g.stroke();
  g.fillStyle = 'rgba(88,196,221,.12)'; g.fill();
  g.restore();
  label(g, 'AI', 1655, 248, aiA, { align: 'center', color: C.ai, font: '600 52px "Space Grotesk", sans-serif' });
  const hookA = pic * win(t, 1.6, T.beat + 1, 0.6, 0.6);
  arrow(g, 1554, 215, ball + 56, BY - 8, C.ai, hookA * 0.6, 2.5, [10, 9]);
  label(g, 'watches', 1420, 160, hookA * win(t, 2.0, T.beat, 0.5, 0.5), { align: 'center', color: C.dim, font: '500 38px "Inter", sans-serif' });
  arrow(g, 1560, 268, hand + CUP + 16, HY - 10, C.ai, hookA * win(t, 3.6, T.beat + 1, 0.5, 0.5), 3);
  label(g, 'tells the hand', 1500, 340, hookA * win(t, 3.8, T.beat, 0.5, 0.5), { align: 'center', color: C.dim, font: '500 38px "Inter", sans-serif' });
  label(g, 'too late', ball, BY - 66, pic * win(t, FREEZE[0] + 0.6, FREEZE[1] + 0.3, 0.3, 0.4), { align: 'center', color: C.late, font: '600 40px "Space Grotesk", sans-serif' });

  /* ---- the timeline */
  const tlA = pic * win(t, M1 - 1.2, 1e9, 0.8, 0.1);
  if (tlA > 0.003) {
    const grow = ease.inOutSine(ramp(t, M1 - 1.2, M1 + 0.2));
    g.save(); g.globalAlpha = tlA;
    g.strokeStyle = C.faint; g.lineWidth = 2;
    g.beginPath(); g.moveTo(X0, LC); g.lineTo(lerp(X0, X1, grow), LC); g.stroke();
    const aiLane = win(t, AI_ON - 1.0, 1e9, 0.7, 0.1);
    g.globalAlpha = tlA * aiLane;
    g.beginPath(); g.moveTo(X0, LA); g.lineTo(lerp(X0, X1, ease.inOutSine(ramp(t, AI_ON - 1.0, AI_ON))), LA); g.stroke();
    // now
    g.globalAlpha = tlA * grow;
    g.setLineDash([6, 8]); g.strokeStyle = C.dim;
    g.beginPath(); g.moveTo(NOW, LC - 70); g.lineTo(NOW, LA + 50); g.stroke(); g.setLineDash([]);
    g.restore();
    label(g, 'now', NOW, LC - 82, tlA * grow, { align: 'center', color: C.dim, font: '500 38px "Inter", sans-serif' });
    label(g, 'controller', X0, LC - 40, tlA * grow, { color: C.ink, font: '600 46px "Space Grotesk", sans-serif' });
    label(g, 'AI answers', X0, LA - 40, tlA * aiLane, { color: C.ai, font: '600 46px "Space Grotesk", sans-serif' });
    label(g, 'time →', X1, LA + 76, tlA * aiLane * win(t, AI_ON, T.wait, 0.5, 0.6), { align: 'right', color: C.dim, font: '500 38px "Inter", sans-serif' });

    // waiting spans (the controller is stuck until the answer comes back)
    g.save();
    for (const r of REQ) {
      if (r.kind !== 'block' || r.a - r.e < B * 0.9) continue;
      const x0 = Math.max(X0, tx(r.e, t)), x1 = Math.min(NOW, tx(Math.min(r.a, t), t));
      if (x1 <= x0 || r.e > t) continue;
      g.globalAlpha = tlA * 0.22; g.fillStyle = C.late; g.fillRect(x0, LC - 40, x1 - x0, 64);
    }
    g.restore();
    // the AI's answers: each a bar from when it was asked to when it came back
    for (const r of REQ) {
      if (r.e > t) continue;
      const end = Math.min(r.a, t);
      const x0 = tx(r.e, t), x1 = tx(end, t);
      if (x1 < X0 || x0 > NOW) continue;
      const a = tlA * aiLane * Math.min(1, (x1 - X0) / 60);
      g.save(); g.globalAlpha = Math.max(0, a);
      const slow = r.a - r.e > 0.5;
      g.fillStyle = slow && r.a > t ? 'rgba(88,196,221,.32)' : 'rgba(88,196,221,.2)';
      g.strokeStyle = C.ai; g.lineWidth = 2.5;
      rr(g, Math.max(X0, x0), LA - 22, Math.max(5, x1 - Math.max(X0, x0)), 44, 10); g.fill(); g.stroke();
      g.restore();
    }
    // the beats
    const kFirst = Math.max(0, Math.floor((t - (NOW - X0) / S) / B)), kLast = Math.floor((t + (X1 - NOW) / S) / B);
    for (let k = kFirst; k <= kLast && k < NK; k++) {
      const b = TICK[k], x = tx(b.t, t);
      if (x < X0 || x > X1) continue;
      const appear = ramp(t, M1 - 1.0 + (x - X0) / 2600, M1 - 0.6 + (x - X0) / 2600);
      if (appear <= 0) continue;
      g.save();
      if (b.t > t || b.out < 0) {                 // still to come: an empty slot
        g.globalAlpha = tlA * appear * (b.t > t ? 0.55 * (1 - ramp(x, NOW + 80, X1)) + 0.2 : 0.4);
        g.strokeStyle = C.dim; g.lineWidth = 2.5;
        g.beginPath(); g.arc(x, LC, 13, 0, Math.PI * 2); g.stroke();
      } else if (b.out === 1) {                   // missed
        g.globalAlpha = tlA * appear; g.strokeStyle = C.late; g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x - 14, LC - 14); g.lineTo(x + 14, LC + 14); g.moveTo(x + 14, LC - 14); g.lineTo(x - 14, LC + 14); g.stroke();
      } else {
        g.globalAlpha = tlA * appear; g.fillStyle = b.out === 2 ? C.safe : C.ok;
        g.beginPath(); g.arc(x, LC, 14, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }
    // the beat that just fired
    if (phase >= 1 && tk.out >= 0) {
      const u = ramp(t, tk.t, tk.t + 0.35), pc = tk.out === 1 ? C.late : tk.out === 2 ? C.safe : C.ok;
      g.save(); g.globalAlpha = tlA * (1 - u); g.strokeStyle = pc; g.lineWidth = 3;
      g.beginPath(); g.arc(tx(tk.t, t), LC, 15 + 30 * u, 0, Math.PI * 2); g.stroke(); g.restore();
    }

    /* ---- what each scene points at */
    // beat: every beat moves the hand
    const beatA = tlA * win(t, M1 + 0.6, T.think, 0.5, 0.5);
    label(g, 'every beat: move the hand', NOW + 30, LC + 74, beatA, { color: C.ok, font: '500 40px "Inter", sans-serif' });
    arrow(g, NOW, LC - 22, hand, HY + 40, C.ok, beatA * 0.7 * Math.exp(-(t - tk.t) / 0.12) + beatA * 0.15, 2.5);
    // think: fast and slow
    const thinkA = tlA * win(t, AI_ON + 2.5, T.wait, 0.5, 0.5);
    let slowR = null;
    for (const r of REQ) if (r.kind === 'show' && r.a - r.e > 0.5 && r.e < t && tx(r.e, t) > X0 + 60 && (!slowR || r.e > slowR.e)) slowR = r;
    if (slowR) label(g, 'slow', (tx(slowR.e, t) + tx(Math.min(slowR.a, t), t)) / 2, LA + 76, thinkA, { align: 'center', color: C.ai, font: '600 40px "Inter", sans-serif' });
    label(g, 'most are quick', X0 + 320, LA + 76, thinkA * win(t, AI_ON + 1.0, T.wait, 0.5, 0.5), { color: C.dim, font: '500 38px "Inter", sans-serif' });
    // wait: the controller asks and waits; the beats it misses
    const waitA = tlA * win(t, M2 - 0.2, M3 - 0.2, 0.4, 0.4);
    if (phase === 2 && tk.plan) {
      const r = tk.plan, pend = r.a > t;
      arrow(g, tx(r.e, t), LC + 16, tx(r.e, t), LA - 22, C.dim, waitA * (pend ? 0.9 : 0.3), 2.5);
      if (!pend) arrow(g, tx(r.a, t), LA - 22, tx(r.a, t), LC + 16, C.ai, waitA * 0.7 * (1 - ramp(t, r.a, r.a + 0.5)), 2.5);
      if (pend && r.a - r.e > 0.5) label(g, 'waiting…', (tx(r.e, t) + NOW) / 2, LC - 40, waitA, { align: 'center', color: C.late, font: '600 40px "Inter", sans-serif' });
    }
    let missed = 0;
    for (let k = kFirst; k <= Math.floor(t / B) && k < NK; k++) if (TICK[k].out === 1 && tx(TICK[k].t, t) > X0) missed++;
    label(g, missed ? `missed beats: ${missed}` : '', X0 + 290, LC - 40, waitA * Math.min(1, missed), { color: C.late, font: '600 42px "Inter", sans-serif' });
    // split onward: the beat uses the latest answer; the line back shows how old it is
    const useA = tlA * win(t, M3 + 0.3, T.rule, 0.5, 0.6);
    if (phase >= 3 && tk.plan) {
      const r = tk.plan, age = t - r.e, old = age > AGE;
      const col = phase === 4 && old ? C.safe : phase === 3 && age > 0.9 ? C.safe : C.ok;
      g.save(); g.globalAlpha = useA; g.strokeStyle = col; g.lineWidth = 3;
      g.beginPath(); g.moveTo(NOW, LC + 14); g.lineTo(tx(r.e, t), LA - 18); g.stroke(); g.restore();
      g.save(); g.globalAlpha = useA; g.fillStyle = col; g.beginPath(); g.arc(tx(r.e, t), LA, 10, 0, Math.PI * 2); g.fill(); g.restore();
      label(g, 'latest answer', tx(r.e, t) - 14, LA + 76, useA * win(t, M3 + 0.6, T.stale + 1.0, 0.5, 0.5), { align: 'left', color: C.ok, font: '500 38px "Inter", sans-serif' });
      // stamp: its age, against the limit
      const ageA = tlA * win(t, W('stamp', 'time', 2.0) - 0.3, T.rule, 0.5, 0.6);
      if (ageA > 0) {
        const xl = tx(t - AGE, t);
        g.save(); g.globalAlpha = ageA; g.strokeStyle = C.safe; g.lineWidth = 3; g.setLineDash([5, 6]);
        g.beginPath(); g.moveTo(xl, LC + 30); g.lineTo(xl, LA + 30); g.stroke(); g.setLineDash([]); g.restore();
        label(g, 'too old', xl - 12, LA + 76, ageA, { align: 'right', color: C.safe, font: '600 38px "Inter", sans-serif' });
        label(g, old ? 'too old: stop' : 'fresh: use it', NOW + 30, LC + 74, ageA, { color: old ? C.safe : C.ok, font: '600 40px "Inter", sans-serif' });
      }
    }
  }

  /* ---- the idea, written once the picture has shown it */
  const ruleA = all * win(t, W('rule', 'advises', 2.3) - 0.2, T.open + 0.2, 0.6, 0.5);
  label(g, 'The AI advises.', 960 - 30, 120, ruleA, { align: 'right', color: C.ai, font: '600 56px "Space Grotesk", sans-serif' });
  label(g, 'The controller keeps the clock.', 960 + 0, 120, all * win(t, W('rule', 'controller', 3.6) - 0.2, T.open + 0.2, 0.6, 0.5), { align: 'left', color: C.ok, font: '600 56px "Space Grotesk", sans-serif' });
  const openA = all * win(t, T.open + 0.4, T.close - 0.2, 0.6, 0.5);
  label(g, 'Open problem: large models, with proof that the timing holds.', 960, 120, openA * win(t, W('open', 'open', 4.0) - 0.2, 1e9, 0.6, 0.1) * ramp(t, T.open + 0.3, T.open + 0.8), { align: 'center', color: C.ink, font: '500 40px "Inter", sans-serif' });
  label(g, 'The guard pattern: L. Sha, “Using Simplicity to Control Complexity,” IEEE Software, 2001.', X0, 1050, openA * 0.85, { color: C.dim, font: '500 22px "JetBrains Mono", monospace' });
  // the close
  label(g, 'AI will keep getting smarter.', 960, 470, all * win(t, T.close + 0.3, 1e9, 0.6, 0.1), { align: 'center', color: C.dim, font: '500 50px "Inter", sans-serif' });
  label(g, 'The beat will never wait for it.', 960, 590, all * win(t, W('close', 'the', 2.2) - 0.1, 1e9, 0.6, 0.1), { align: 'center', color: C.ink, font: '600 92px "Space Grotesk", sans-serif' });
}

const CSS = `
  .cin .end__t { font: 700 110px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 34px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 1080px; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #7fcfff; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 46px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
`;

/* ----------------------------------------------------------------- film */
const film = {
  title: 'AI meets the deadline',
  aspect: '16x9',
  duration: TL ? TL.duration : D,
  warp: TL ? makeWarp(TL.anchors) : null,
  audio: TL ? new URL(TL.audio, TL_DIR).href : null,
  // the closing line is already on screen in large type
  captions: TL ? captionsFromTimeline(TL, 42, ['close']) : null,
  build(ctx) {
    const { scene, text } = ctx;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    scene.background = new THREE.Color(C.bg);

    const k = matchMedia('(pointer: coarse)').matches ? 1 : Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    let g = null;
    text({ at: -3, out: 1e9, words: false, dur: 0.01, rise: 0, place: { x: 0, y: 0, w: 1920 },
           html: `<canvas width="${1920 * k}" height="${1080 * k}" style="width:1920px;height:1080px;display:block"></canvas>`,
           update(t, el) {
             if (!g) { g = el.querySelector('canvas').getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); }
             draw(g, t);
           } });
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: 0.9, rise: 24, place: { x: 160, y: 250, w: 1600, align: 'center' },
           html: `<div class="end__t">AI meets the deadline</div>
                  <div class="end__s">Use the AI&rsquo;s latest answer, never wait for it, and stop trusting an answer that is too old.</div>
                  <div class="end__a">An open research direction &middot; not yet published &middot; schematic timing, not measured</div>
                  <div class="end__u">${AUTHOR}</div>` });
  },
  frame(t, ctx) {
    ctx.grade.uniforms.uFade.value = 1;
  },
};

createCinema(film);
