/* Deterministic teaching model, not a robot or a measured inference benchmark.
   Shared by the film, interactive experiment, and executable checks. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DeadlineModel = factory();
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  var DT = 1000 / 60, FRAMES = 360;
  function run(options) {
    var o = Object.assign({ delay: 80, ttl: 150, outage: false, shared: false }, options);
    var direct = [], async = [], events = [], busy = 0, request = 0;
    // One inference worker. Opportunities arrive at 10 Hz; busy opportunities
    // are skipped rather than queued. Context changes every two seconds.
    for (var n = 0; n < FRAMES; n += 6) {
      var at = n * DT;
      if (at < busy - 1e-7) continue;
      var lost = o.outage && at >= 2000 && at < 3000;
      var latency = lost ? 400 : 8 + (request % 4 === 3 ? Number(o.delay) : 0);
      events.push({ at: at, done: at + latency, epoch: Math.floor(n / 120), lost: lost, latency: latency });
      busy = at + latency;
      request++;
    }
    var endDirect = 0, endAsync = 0, cursor = 0, plan = null, rejected = 0;
    for (var i = 0; i < FRAMES; i++) {
      var scheduled = i * DT, deadline = scheduled + DT;
      // The blocking baseline invokes inference every sixth controller job.
      // Jobs queue if a previous invocation has not completed.
      var startD = Math.max(scheduled, endDirect), wait = 0;
      if (i % 6 === 0) {
        var lostD = o.outage && startD >= 2000 && startD < 3000;
        wait = lostD ? 400 : 8 + ((i / 6) % 4 === 3 ? Number(o.delay) : 0);
      }
      var interference = o.shared && i % 60 === 30 ? 20 : 0;
      endDirect = startD + 4 + wait + interference;
      direct.push({ frame: i, cost: endDirect - scheduled, late: endDirect > deadline + 1e-7 });

      var startA = Math.max(scheduled, endAsync), epoch = Math.floor(startA / 2000);
      while (cursor < events.length && events[cursor].done <= startA + 1e-7) {
        var e = events[cursor++];
        if (!e.lost && startA - e.at <= o.ttl && e.epoch === epoch) plan = e;
        else rejected++;
      }
      var age = plan ? startA - plan.at : Infinity;
      var fresh = !!plan && age <= o.ttl && plan.epoch === epoch;
      endAsync = startA + 5 + interference; // 4 ms controller + 1 ms admission
      async.push({ frame: i, cost: endAsync - scheduled, late: endAsync > deadline + 1e-7,
        fresh: fresh, age: Number.isFinite(age) ? age : null, rejected: rejected });
    }
    function stats(rows) {
      return { misses: rows.filter(function (r) { return r.late; }).length,
        peak: Math.max.apply(null, rows.map(function (r) { return r.cost; })),
        fresh: rows.filter(function (r) { return r.fresh; }).length };
    }
    return { options: o, direct: direct, async: async, events: events,
      directStats: stats(direct), asyncStats: stats(async), frames: FRAMES, dt: DT };
  }
  return { run: run, dt: DT, frames: FRAMES };
});
