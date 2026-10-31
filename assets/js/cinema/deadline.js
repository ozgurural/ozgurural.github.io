/*
 * AI Meets the Deadline: a proposal does not own the execution clock.
 * The original ring, model, mailbox, gate and shared-resource scenes remain.
 * Native portrait reflows their framing and adds an event-driven readout.
 * These are schematic authored events at a cinematic timescale, not the
 * six-second interactive trace, a measured robot or a worst-case proof.
 * The separate interactive teaching model is lab-deadline-model.js.
 * Observation age, observation context and action admissibility are distinct.
 * A baseline is not claimed safe without its own plant-specific evidence.
 * Every visual and status is a function of seek time, including backwards seek.
 */
import { AUTHOR, createCinema, captionsFromTimeline, seeded } from './engine.js?v=deadline-20261031-v3';
import { buildDeadlineStage, frameDeadlineStage, deadlineDoorState } from './deadline-stage.js?v=deadline-20261031-v3';

const T = { hook: 0, beat: 8.5, think: 17, wait: 26, split: 36, stale: 46, contract: 55, limits: 65, share: 74.5, close: 86, card: 94 };
const D = 98.5;
// A genuinely reflowed portrait cut; the lab iframe or an explicit export
// selects its dimensions without shrinking a landscape picture into a band.
const requestedAspect = new URLSearchParams(location.search).get('aspect');
const ASPECT = requestedAspect === '9x16' || (!requestedAspect && innerWidth / innerHeight < 0.8) ? '9x16' : '16x9';

const TL_DIR = new URL('../../audio/cinema/deadline/', import.meta.url);
const TL = await fetch(new URL('timeline.json?v=deadline-20261031-v3', TL_DIR)).then(r => (r.ok ? r.json() : null)).catch(() => null);
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

const CSS = `
  .cin .kick { font: 500 23px/1.2 "JetBrains Mono", monospace; letter-spacing: .14em; color: #a0ecc0; text-transform: uppercase; }
  .cin .hd { font: 600 80px/1.08 "Space Grotesk", sans-serif; letter-spacing: -.012em; color: #f4f7fb; text-wrap: balance; }
  .cin .sb { font: 400 37px/1.38 "Inter", sans-serif; color: #aebcd0; text-wrap: pretty; }
  .cin .blk .sb { margin-top: 30px; max-width: 780px; }
  .cin .sb b { color: #e8eef7; font-weight: 600; }
  .cin em { font-style: normal; color: #a0ecc0; }
  .cin .teal { color: #9df0b7; } .cin .amber { color: #ffbe69; } .cin .red { color: #ff6272; }
  .cin .scrim { position: absolute; }
  .cin .chip { font: 500 25px/1 "JetBrains Mono", monospace; padding: 10px 13px; border-radius: 8px; white-space: nowrap;
               background: rgba(6,12,24,.78); border: 1px solid rgba(127,207,255,.35); color: #cfe9ff; }
  .cin .chip.red { border-color: rgba(255,98,114,.75); color: #ff8a96; }
  .cin .chip.amber { border-color: rgba(255,179,71,.75); color: #ffc477; }
  .cin .stamp { font: 700 28px/1 "Space Grotesk", sans-serif; letter-spacing: .1em; padding: 10px 15px; white-space: nowrap;
                border: 2px solid currentColor; border-radius: 10px; background: rgba(6,10,18,.72); }
  .cin .key { display: flex; gap: 26px; font: 500 22px/1 "JetBrains Mono", monospace; color: #9aa9be; }
  .cin .key i { display: inline-block; width: 14px; height: 14px; border-radius: 4px; margin-right: 9px; vertical-align: -1px; }
  .cin .credit { font: 500 21px/1.5 "JetBrains Mono", monospace; letter-spacing: .03em; color: #b6d7bc; }
  .cin .credit span { display: block; color: #9aa9be; }
  .cin .cl__a { font: 500 44px/1.3 "Inter", sans-serif; color: #c9d4e3; }
  .cin .cl__b { font: 600 88px/1.1 "Space Grotesk", sans-serif; letter-spacing: -.015em; color: #f4f7fb; text-wrap: balance; }
  .cin .end__t { font: 700 110px/1 "Space Grotesk", sans-serif; letter-spacing: -.02em; color: #f4f7fb; }
  .cin .end__s { font: 400 30px/1.4 "Inter", sans-serif; color: #aebcd0; margin: 22px auto 0; max-width: 980px; }
  .cin .end__a { font: 500 24px/1.7 "JetBrains Mono", monospace; color: #a0ecc0; margin-top: 36px; letter-spacing: .03em; }
  .cin .end__u { font: 600 36px/1.3 "Space Grotesk", sans-serif; color: #f4f7fb; margin-top: 52px; }
  .cin .end__u span { display: block; font: 400 25px/1.4 "Inter", sans-serif; color: #8fa2ba; margin-top: 8px; }
  .cin .deadline-evidence { box-sizing: border-box; padding: 24px 30px; border: 1px solid #294e36; border-radius: 4px; background: rgba(3,13,8,.86); }
  .cin .evidence-title { font: 600 28px/1.25 "Space Grotesk", sans-serif; color: #e8eef7; }
  .cin .evidence-line { font: 500 25px/1.35 "Inter", sans-serif; color: #aebcd0; margin-top: 10px; }
  .cin--9x16 .hd { font-size: 86px; line-height: 1.06; }
  .cin--9x16 .blk .sb { display: none; }
  .cin--9x16 .kick { font-size: 30px; letter-spacing: .07em; }
  .cin--9x16 .lb, .cin--9x16 .key { display: none; }
  .cin--9x16 .credit { font: 500 29px/1.35 "Inter", sans-serif; }
  .cin--9x16 .evidence-title { font-size: 47px; }
  .cin--9x16 .evidence-line { font-size: 39px; }
  .cin--9x16 .deadline-evidence { padding: 25px 32px; min-height: 190px; }
  .cin--9x16 .cin-cap { font-size: 54px !important; line-height: 1.3 !important; bottom: 290px !important; max-width: 940px !important; width: 940px !important; white-space: normal !important; text-wrap: balance; padding: 12px 8px !important; }
  .cin--9x16 .cl__a { font-size: 49px; }
  .cin--9x16 .cl__b { font-size: 86px; }
  .cin--9x16 .end__t { font-size: 86px; line-height: 1.08; }
  .cin--9x16 .end__s { font-size: 43px; }
  .cin--9x16 .end__a { font-size: 30px; margin-top: 28px; }
  .cin--9x16 .end__u { font-size: 46px; margin-top: 46px; }
  .cin--9x16 .end__u span { font-size: 32px; }
`;

/* ------------------------------------------------------------ the schedule
   Everything below is computed once, here, and read by frame(t); nothing is
   carried from one frame to the next. Authored seconds throughout. */
const P = 0.5;                 // one beat
const AGE = 1.55;              // a plan older than this is too old to use
const contextAt = t => Math.floor(Math.max(0, t - T.stale) / 4);
const ACT = T.wait + 1.0, ACT_END = T.split + 0.4;        // the blocking design
// While the controller waits on the model it does not act: these are its
// stalls. Each is a slow answer (wait scene) or a busy model on the same
// computer (share scene). A deadline inside one is missed, and so are the
// beats the backlog pushes past (SPILL), because the work queued behind the
// slow answer runs late too.
const SPILL = 2;
// The counterexample appears on "Inference"; the remedy begins on "Isolation".
// Both clocks are derived from the spoken word timings, not a later stopwatch.
const spokenAt = (cue, word, fallback) => {
  const line=TL?.lines.find(l=>l.id===cue),w=line?.words.find(w=>w[0].toLowerCase()===word.toLowerCase());
  return w ? makeWarp(TL.anchors)(line.real+w[1]) : fallback;
};
const CONTEND_AT = spokenAt('share','Inference',T.share+3.4);
const SPLIT_AT = spokenAt('share','Isolation',T.share+7.2);
const STALLS = [
  { s: T.wait + 2.6, e: T.wait + 4.9, why: 'slow' },
  { s: T.wait + 6.4, e: T.wait + 8.1, why: 'slow' },
  { s: CONTEND_AT, e: CONTEND_AT + .65, why: 'busy' },
  { s: CONTEND_AT + 1.0, e: CONTEND_AT + 1.55, why: 'busy' },
];

const rnd = seeded(2026);
// Plans. In the think and wait scenes one plan at a time, flying straight to
// the controller; from the split on, the model works continuously and leaves
// each plan in the box. A plan's compute time is mostly short, sometimes long.
const PLANS = [];
{
  let e = T.think + 0.6;
  while (e < T.close - 0.5) {
    const asyncMode = e >= T.split + 1.0;
    const slow = rnd() < (asyncMode ? 0.22 : 0.34);
    const d = slow ? 2.0 + rnd() * 1.4 : 0.45 + rnd() * 0.45;
    PLANS.push({ e, d, a: e + d, async: asyncMode, bad: false });
    e += asyncMode ? 0.95 + rnd() * 0.5 : 1.3 + rnd() * 0.4;
  }
  // the wait scene's two stalls are two slow answers: make the plans say so
  for (const st of STALLS.filter(s => s.why === 'slow')) {
    PLANS.push({ e: st.s, d: st.e - st.s, a: st.e, async: false, bad: false, blocking: true });
  }
  // from the limits scene, a few fresh plans ask for more than is allowed
  PLANS.filter(p => p.async && p.a > T.limits + 2.0 && p.a < T.share - 0.5).forEach((p, i) => { if (i % 3 === 1) p.bad = true; });
  PLANS.sort((x, y) => x.e - y.e);
}
const inStall = b => STALLS.find(s => b >= s.s && b < s.e + SPILL * P);
// The newest plan the controller could have used at beat time b.
function newestBy(b) {
  let best = null;
  for (const p of PLANS) if (p.async && p.a <= b && (!best || p.a > best.a)) best = p;
  return best;
}
// What became of the beat whose deadline is b: 0 on time, 1 missed, 2 baseline.
function status(b) {
  if (b > ACT && b < ACT_END && inStall(b)) return 1;
  if (b > T.share && b < SPLIT_AT && inStall(b)) return 1;
  if (Math.abs(b - 4.0) < P * 0.5) return 1;          // the hook: one answer that came too late
  if (b >= T.contract) {
    const p = newestBy(b);
    if (!p || b - p.e > AGE || contextAt(p.e) !== contextAt(b)) return 2;
    if (b >= T.limits + 2.0 && p.bad) return 2;
  }
  return 0;
}
// Where the hand is. It runs on the beat, except that a controller waiting on
// the model stops: inside a stall the hand holds, and when the stall ends it
// jumps to where it should be. The ghost hand, the schedule, never stops.
function handTime(t) {
  for (const s of STALLS) {
    const active = (s.why === 'slow' && t > ACT && t < ACT_END) || (s.why === 'busy' && t < SPLIT_AT);
    if (active && t >= s.s && t < s.e) return s.s;
  }
  return t;
}

/* ----------------------------------------------------------------- film */
const film = {
  title: 'AI meets the deadline',
  aspect: ASPECT,
  duration: TL ? TL.duration : D,
  warp: TL ? makeWarp(TL.anchors) : null,
  audio: TL ? new URL(TL.audio + '?v=deadline-20261031-v3', TL_DIR).href : null,
  captions: TL ? captionsFromTimeline(TL, ASPECT === '9x16' ? 72 : 58) : null,
  build(ctx) {
    const { camera, text } = ctx;
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    camera.fov = 33;
    camera.updateProjectionMatrix();
    ctx.bloom.strength = .18;
    // The time-offset grain hash bands at later times on the Intel renderer.
    // Keep this film clean instead of shipping that compression-heavy artefact.
    ctx.grade.uniforms.uGrain.value = 0;
    ctx.setViewShift(ctx.wide ? 0.2 : 0, ctx.wide ? -0.04 : -0.015);

    buildDeadlineStage(ctx);

    /* ------------------------------------------------------------- type */
    const KICK = ctx.wide ? { x: 120, y: 88, w: 900 } : { x: 72, y: 300, w: 936 };
    const HD = ctx.wide ? { x: 120, y: 190, w: 720 } : { x: 72, y: 380, w: 936 };
    const say = (at, out, hd, sb) => text({ at, out, outDur: .12, cls: 'blk', place: HD,
      html: `<div class="hd">${hd}</div>` + (sb ? `<div class="sb">${sb}</div>` : '') });
    const scrim = (at, out, place, background) => text({ at, out, cls: 'scrim', words: false, dur: 0.8, rise: 0, html: '', place,
      style: { height: (ctx.wide ? place.h : ctx.H) + 'px', background: ctx.wide ? background : 'transparent' } });
    const gone = 0.05;

    scrim(-3, T.close - 0.2, { x: 0, y: 0, w: 1000, h: 1080 },
          'linear-gradient(to right, rgba(3,5,10,.86) 0%, rgba(3,5,10,.6) 60%, rgba(3,5,10,0) 100%)');
    scrim(T.close - 0.3, 1e9, { x: 0, y: 0, w: 1920, h: 1080 },
          'radial-gradient(ellipse 56% 50% at 50% 50%, rgba(3,5,10,.9) 0%, rgba(3,5,10,.72) 55%, rgba(3,5,10,.15) 100%)');
    text({ at: -3, out: T.beat - .05, cls: 'kick', place: KICK, words: false, dur: 0.01,
      html: 'AI meets the deadline' });
    text({ at: T.beat, out: T.share - .1, cls: 'kick', place: KICK, words: false,
      html: 'Dr. Ozgur Ural &middot; design study' });
    text({ at: T.share, out: T.close - .3, cls: 'kick', place: KICK, words: false,
      html: 'Follow the dependency' });

    say(-3, T.beat - gone, 'Your AI has a plan.<br><span class="amber">Who sets the rules?</span>',
        'A useful answer still needs a valid moment to act.');
    say(T.beat, T.think - gone, 'The world <em>keeps moving</em>.',
        'A periodic controller has a deadline on every job.');
    say(T.think, T.wait - gone, 'One fast answer.<br>Then a <span class="amber">late one</span>.',
        'The experiment injects variable inference delay.');
    say(T.wait, T.split - gone, 'One wait.<br>A <span class="amber">queue behind it</span>.',
        'Work waiting behind inference also arrives late.');
    say(T.split, T.stale - gone, 'Let intelligence<br><em>propose</em>.',
        'The controller admits proposals through a bounded path.');
    say(T.stale, T.contract - gone, 'New arrival.<br><span class="amber">Old world</span>.',
        'Result arrival and observation freshness are different clocks.');
    say(T.contract, T.limits - gone, 'Power is not<br><em>permission</em>.',
        'Observation age and context must both match the admission rule.');
    say(T.limits, T.share - gone, 'A valid plan can<br>still be <span class="amber">unsafe</span>.',
        'Action constraints and baseline behaviour need separate evidence.');
    say(T.share, T.close - .02, 'Outside the loop.<br><span class="amber">Inside the machine</span>.',
        'Asynchrony is not a worst-case execution-time guarantee.');
    text({ at: -3, out: T.close - .25, cls: 'credit', words: false,
      place: ctx.wide ? { x: 120, y: 1000, w: 800 } : { x: 72, y: 1730, w: 936 },
      html: 'Original architecture study. Synthetic timing.<span>Dr. Ozgur Ural · open research direction, not yet published.</span>' });

    // The readout is driven by the same schedule and proposals as the ring.
    // It describes schematic events; there are no invented robot-success scores.
    text({ at: -3, out: T.close - .2, cls: 'deadline-evidence', words: false, rise: 0, dur: .1,
      place: ctx.wide ? { x: 1060, y: 710, w: 760 } : { x: 72, y: 1210, w: 936 },
      html: '<div class="evidence-title"></div><div class="evidence-line"></div>',
      update: (t, el) => {
        const p = newestBy(t), age = p ? t - p.e : Infinity;
        const contextMatches = !!p && contextAt(p.e) === contextAt(t);
        const fresh = !!p && age <= AGE && contextMatches;
        const blocked = handTime(t) < t - .01;
        let title, detail, color = '#a0ecc0';
        if (t < T.beat) { title = t < 3.65 ? 'ACCESS HAS A WINDOW' : 'THE WINDOW HAS CLOSED'; detail = t < 3.65 ? 'The key is approaching its access window.' : t < 4.4 ? 'The window closed before the key arrived.' : 'The key is here. The opportunity is gone.'; }
        else if (t < T.think) { title = 'CONTROLLER: ACT ON EACH BEAT'; detail = 'The schedule keeps moving.'; }
        else if (t < T.wait) {
          const door=deadlineDoorState(t,T);
          title = door.ready ? 'AI REQUEST: RESULT AVAILABLE' : 'AI REQUEST: STILL THINKING';
          detail = door.ready&&door.arrival>door.deadline ? 'The result missed its access window.' : 'The answer must arrive while the window is valid.';
        } else if (t < T.split) {
          title = blocked ? 'CONTROLLER: WAITING' : 'CONTROLLER: WORK RESUMES';
          detail = 'The deadline clock never waited.'; color = blocked ? '#ff6272' : '#a0ecc0';
        } else if (t < T.stale) { title = 'PROPOSE → ADMIT → ACT'; detail = 'Bounded handoff. Isolated worker assumed.'; }
        else if (t < T.contract) { title = contextMatches ? 'ARRIVAL TIME ≠ OBSERVATION TIME' : 'THE CONTEXT HAS CHANGED'; detail = 'The new reply can describe the old state.'; color = '#ffbe69'; }
        else if (t < T.limits) { title = fresh ? 'PROPOSAL: ADMITTED' : 'PROPOSAL: REJECTED'; detail = fresh ? 'Age and context pass this rule.' : !contextMatches ? 'Context mismatch. Use baseline.' : 'Observation expired. Use baseline.'; color = fresh ? '#9df0b7' : '#ffbe69'; }
        else if (t < T.share) { title = 'FRESHNESS IS ONLY ONE GATE'; detail = 'Action limits and baseline safety remain unproven.'; color = '#ffbe69'; }
        else { title = t >= SPLIT_AT ? 'RESOURCES ISOLATED IN THIS MODEL' : blocked ? 'SHARED RESOURCE: DEADLINE MISSED' : 'ASYNCHRONOUS ≠ ISOLATED'; detail = 'Worst-case timing still needs its own analysis.'; color = blocked ? '#ff6272' : '#a0ecc0'; }
        el.dataset.fresh = String(fresh); el.dataset.contextMatches = String(contextMatches);
        el.dataset.blocked = String(blocked); el.dataset.status = String(status(Math.floor(t / P) * P));
        el.querySelector('.evidence-title').textContent = title;
        el.querySelector('.evidence-title').style.color = color;
        el.querySelector('.evidence-line').textContent = detail;
      } });
    text({ at: T.close, out: T.card - .05, outDur: .15, cls: 'cl__a',
      place: ctx.wide ? { x: 260, y: 300, w: 1400, align: 'center' } : { x: 72, y: 650, w: 936, align: 'center' },
      html: 'Did it act on time?' });
    text({ at: T.close + 2.4, out: T.card - .05, outDur: .15, cls: 'cl__b',
      place: ctx.wide ? { x: 260, y: 410, w: 1400, align: 'center' } : { x: 72, y: 790, w: 936, align: 'center' },
      html: 'Did the AI<br><em>still help</em>?' });
    text({ at: T.card, out: 1e9, cls: 'end', words: false, dur: .9, rise: 0,
      place: ctx.wide ? { x: 160, y: 250, w: 1600, align: 'center' } : { x: 72, y: 540, w: 936, align: 'center' },
      html: `<div class="end__t">AI meets the deadline</div>
        <div class="end__s">Intelligence proposes.<br>Execution needs a contract.</div>
        <div class="end__a">Synthetic design study · not yet published</div>
        <div class="end__u">${AUTHOR}</div>` });

  },

  frame(t, ctx) {
    const p = newestBy(t);
    frameDeadlineStage(t, ctx, {
      plans: PLANS.filter(p => t >= p.e && t < p.a + .35),
      busy: PLANS.some(p => t >= p.e && t < p.a),
      handTime: handTime(t), blocked: handTime(t) < t - .01,
      contextMatches: !!p && contextAt(p.e) === contextAt(t),
      lastProposalBad: !!p && p.bad,
      rejection: PLANS.find(p => p.bad && t >= p.a && t < p.a + 1.6),
      isolateAt: SPLIT_AT,
      fresh: !!p && t - p.e <= AGE && contextAt(p.e) === contextAt(t),
    }, T);
  },
};

createCinema(film);
