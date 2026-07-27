---
permalink: /lab/determinism/
title: "Determinism at 60 Hz, animated"
description: "What hard real time actually costs in a Level D full-flight simulator: the 150 ms transport-delay gate, why the mean frame time is the wrong statistic, and how latency and reliability compose across a rack of hosts."
excerpt: "A deadline is met or missed, never averaged. The 150 ms qualification ceiling, 864,000 frames per session, and why one straggler host owns the whole frame."
sitemap: true
header:
  og_image: "lab-og/og-det.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-det" style="margin-top: 0;">
  <span class="ep-eyebrow">Hard Real Time · Safety-Critical Systems</span>
  <p class="lab-card__lead">⏱ A Level D simulator is legally a substitute for the aircraft — an airline logs real type-rating hours on it — so its fidelity requirements are written as regulation rather than as goals. The strictest is <strong>transport delay</strong>: 150 milliseconds from a pilot's control input to the motion, visual and instrument response. This animation works out what that ceiling costs in engineering terms: why a healthy-looking mean frame time is the wrong statistic, how latency composes as a <em>maximum</em> across a rack of hosts while reliability composes as a <em>product</em>, and why the telemetry that proves it has to ship as part of the product.</p>
  <div class="lab-card__usecase">
    <strong>Engineering Reference:</strong>
    <span>Transport-delay and qualification limits are public: <a href="https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-60">FAA 14 CFR Part 60</a> and the equivalent EASA CS-FSTD(A). The engineering discipline is drawn from the author's work on Level D full-flight-simulator systems at Avion — including the live monitoring layer described in the <a href="/files/ace-architecture-report.pdf">ACE architecture report</a>. No employer design is disclosed; the topology shown is the generic multi-host layout common to every Level D device.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="det-film" role="group" aria-label="Animated explainer: hard real-time determinism in a Level D full-flight simulator"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: cyan=within budget, amber=budget boundary, rose=deadline breach, green=margin">
    <span><i style="background:#58C4DD"></i> within budget</span>
    <span><i style="background:#fbbf24"></i> budget boundary</span>
    <span><i style="background:#fc6255"></i> deadline breach</span>
    <span><i style="background:#83C167"></i> margin · healthy</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>150 ms is a gate, not a target.</strong> Transport delay is the total system processing time from a pilot primary-flight-control input until the motion, visual or instrument systems respond. FAA Part 60 and EASA CS-FSTD(A) cap it at 150 ms for Level C/D aeroplane devices — and at 100 ms for helicopters, because a hovering rotorcraft is unstable and the pilot closes the loop far faster. Miss the ceiling and the device does not qualify; the hours flown on it do not count.</p>
    <p><strong>A deadline is never met on average.</strong> At 60 Hz each frame gets 16.67 ms. A mean of 8.6 ms looks like a system with half its budget spare, but the mean is the wrong statistic: what matters is the tail mass past the deadline. A four-hour session is 864,000 frames, so <em>E[K] = N·p</em> — one bad frame in a hundred thousand still costs ~9 overruns a session, and a 99.9% success rate costs 864 of them.</p>
    <p><strong>And that estimate is the optimistic one.</strong> <em>E[K] = N·p</em> assumes frames fail independently. They don't: a garbage-collection pause, a page fault or a network stall takes out a run of consecutive frames, so real sessions cluster their failures into visible stutters rather than spreading them thinly.</p>
    <p><strong>Distributed systems compose badly, in two directions at once.</strong> A full-flight simulator is a rack — flight model, avionics, three visual channels, sound, motion, instructor station. The frame closes when the <em>last</em> host publishes, so latency composes as a maximum: one straggler at 19 ms makes the frame late for everyone. Reliability composes as a product: nine hosts at three nines each give 0.999⁹ ≈ 99.1% clean frames, about 7,800 bad frames per session. This is why the budget must be allocated and enforced per host — a system-wide average is not something anyone can engineer against.</p>
    <p><strong>Ship the instrument with the system.</strong> Sampled step time can miss a spike that happens between two polls; an overrun counter is incremented by the runtime at the moment the deadline breaks and cannot be missed. Monotonic counters are the trustworthy primitive for deadline compliance — sampled gauges are for trend. Determinism is not optimised in at the end: it is a budget, allocated per host, enforced every frame, and proven by telemetry that is part of the deliverable.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="det-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/determinism.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
