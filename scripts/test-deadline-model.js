// Tests the same synthetic scheduler used by the film and browser experiment.
const assert = require('node:assert/strict');
const model = require('../assets/js/lab-deadline-model');
const fast = model.run({ delay: 0 });
assert.equal(fast.directStats.misses, 0, '8 ms inference + 4 ms control fits one period');
assert.equal(fast.directStats.peak, 12);
const delayed = model.run({ delay: 80 });
assert.ok(delayed.directStats.misses > 15, '15 slow calls also delay queued jobs');
assert.equal(delayed.asyncStats.misses, 0, 'isolated fixed costs remain within budget');
assert.equal(delayed.asyncStats.peak, 5);
assert.deepEqual(model.run({ delay: 80 }), delayed, 'replay is deterministic');
for (const frame of [0, 120, 240]) assert.equal(delayed.async[frame].fresh, false, 'startup/context change requires a new proposal');
const shortLife = model.run({ delay: 240, ttl: 50 });
assert.ok(shortLife.async.every(r => !r.fresh || r.age <= 50), 'no expired proposal is used');
assert.ok(shortLife.asyncStats.fresh < model.run({ delay: 240, ttl: 400 }).asyncStats.fresh, 'shorter lifetime trades coverage for freshness');
assert.ok(shortLife.events.length < 60, 'busy inference opportunities are skipped, not queued');
const offline = model.run({ delay: 80, outage: true });
assert.ok(offline.asyncStats.fresh < delayed.asyncStats.fresh, 'outage reduces available AI proposals');
assert.equal(offline.asyncStats.misses, 0, 'outage alone does not block isolated control');
const shared = model.run({ delay: 80, outage: true, shared: true });
assert.equal(shared.asyncStats.misses, 6, 'six explicit shared stalls break six deadlines');
assert.equal(shared.asyncStats.peak, 25, '5 ms work plus a 20 ms stall');
for (const r of [fast, delayed, shortLife, offline, shared]) {
  assert.equal(r.direct.length, 360); assert.equal(r.async.length, 360);
  for (let i = 1; i < r.events.length; i++) assert.ok(r.events[i].at >= r.events[i - 1].done, 'single inference worker cannot overlap requests');
}
console.log('PASS: deadline budgets, queued overruns, context invalidation, expiry, outage, isolation, single-worker scheduling, deterministic replay');
