---
permalink: /lab/level-d-60hz/
oembed: "/lab/level-d-60hz/oembed.json"
title: "Inside a Level D Flight Simulator"
description: "How a Level D flight simulator fools a pilot's senses, is proven against the real aircraft and is never late, and what that means for AI in the loop."
excerpt: "Fidelity earns the trust; determinism keeps it. Collimated displays, motion cueing, objective tests against flight data, the 150 ms gate, and the evidence any AI in the loop will owe."
sitemap: true
header:
  og_image: "lab-og/og-det.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-lvd" style="margin-top: 0;">
  <span class="ep-eyebrow">Simulation · Hard Real Time · Safety-Critical Systems</span>
  <p class="lab-card__lead">✈ A Level D full-flight simulator is trusted to stand in for an airliner: in Europe, an experienced pilot can train for a new type entirely in one and fly the first landings in the real aircraft on airline flights, under an instructor. This page explains how a machine earns that trust, in a narrated film and in the engineering behind it: how it fools the pilot's senses, how it is proven against the real aircraft, why it must answer within 150 milliseconds on every single frame, and what that means for the AI that will join loops like it. The thesis is mine: <strong>fidelity earns the trust, and determinism keeps it.</strong></p>
  <div class="lab-card__usecase">
    <strong>Sources and scope:</strong>
    <span>Every regulatory fact is public and cited where it is used: EASA Part-FCL (FCL.730.A, zero flight time training), EASA CS-FSTD(A) and, for new devices, <a href="https://www.easa.europa.eu/en/document-library/certification-specifications/cs-fstd-issue-1">CS-FSTD Issue 1</a> (2026), and <a href="https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-60">FAA 14 CFR Part 60</a> with Part 121, Appendix H. The engineering discipline is drawn from my work on Level D full-flight-simulator systems at Avion, including the live monitoring layer around those simulators. No employer design is disclosed: the machine shown is the generic six-actuator platform, cockpit and wrap-around display every full-flight simulator shares, and the stage times and rack in the film are illustrative. A companion design study, <a href="/lab/determinism/">AI Meets the Deadline</a>, works out one architecture for an AI planner above a loop like this one.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame lab-film__frame--cinema">
      <iframe src="{{ '/films/level-d/' | relative_url }}?autoplay=0" title="Inside a Level D flight simulator: a narrated film by Dr. Ozgur Ural" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>
    </div>
  </div>

  <details class="lab-reveal" open>
    <summary>👁 Fooling the senses</summary>
    <p><strong>A pilot flies with more than eyes.</strong> Vision, the inner ear, the forces on the controls and the vibration through the seat all report what the aircraft is doing, and a simulator has to feed every channel and keep them in agreement. When the cues disagree, people get simulator sickness; the sensory conflict theory is the standard account of why.</p>
    <p><strong>The picture sits in a mirror, not on a screen.</strong> On an ordinary screen a short way in front of the crew, the angle to the runway depends on where you sit: the captain sees it to one side, the first officer to the other. A collimated display sends the light from every point of the picture out in parallel rays, so the image behaves as if it were far away and the runway appears straight ahead to both crew members (14 CFR Part 60, Appendix C, Attachment 2, §18).</p>
    <p><strong>The motion borrows gravity.</strong> Six actuators can tilt and slide the cabin in all six degrees of freedom (pitch, roll, yaw, heave, sway, surge; Levels C and D require them), but only a short way. A take-off's sustained push cannot be reproduced by moving forward, so the platform gives a brief forward shove for the onset and then tilts the cabin nose-up, slowly enough that the rotation goes unnoticed: Part 60 describes exactly this onset cue and nose-up tilt for the sustained force. It works because the otolith organs of the inner ear sense the sum of gravity and acceleration and cannot tell the two apart, the equivalence principle at the scale of the inner ear. A tilt of <em>θ</em> supplies <em>g</em>·sin <em>θ</em>, so 0.25 g of acceleration needs about 14.5°. The visual system moves with the cabin, so the runway stays level in front of the pilot while gravity presses them into the seat. Then the platform creeps back to the middle below the perception threshold, ready for the next cue.</p>
  </details>

  <details class="lab-reveal">
    <summary>✅ Proving it</summary>
    <p><strong>Level D is earned test by test.</strong> Full-flight simulators are qualified at Levels A to D (FAA Part 60; EASA CS-FSTD(A)), and D is the highest. Qualification is a test campaign: each objective test replays a manoeuvre the real aircraft flew on a flight test, and the simulator's response has to stay inside a stated tolerance around the aircraft's. At Levels C and D a driver program runs the tests automatically. At Level D even the cockpit sound is an objective test, and a device that misses its sound tolerances can only be qualified at Level C.</p>
    <p><strong>And it never stops proving it.</strong> Every appropriate objective test is run again each year, and the device needs a functional preflight check within the 24 hours before anyone trains in it (14 CFR 60.19(a)).</p>
    <p><strong>That is what buys the trust.</strong> Under EASA's zero flight time training, a pilot with at least 500 hours or 100 route sectors on multi-pilot aeroplanes can complete a type rating course entirely in a Level D simulator, then fly the first take-offs and landings in line operations under a type rating instructor (FCL.730.A). The United States allows the equivalent at Levels C and D (14 CFR Part 121, Appendix H).</p>
  </details>

  <details class="lab-reveal" open>
    <summary>⏱ The clock</summary>
    <p><strong>150 ms is a gate, not a target.</strong> Transport delay is the total system processing time from a pilot primary-flight-control input until the motion, visual or instrument systems respond. FAA Part 60 and EASA CS-FSTD(A) cap it at 150 ms for Level C/D aeroplane devices. EASA's CS-FSTD Issue 1, published in July 2026 for the initial qualification of new devices, tightens that to 100 ms for motion, instruments and visual at its highest fidelity level (Subpart D, test 6.a.1). Exceed the applicable ceiling in the qualification test and the device does not meet that requirement.</p>
    <p><strong>A deadline is never met on average.</strong> At 60 Hz each frame gets 16.67 ms. A mean of 8.6 ms looks like a system with half its budget spare, but the mean is the wrong statistic: what matters is the tail mass past the deadline. A four-hour session is 864,000 frames, so <em>E[K] = N·p</em>: one bad frame in a hundred thousand still costs ~9 overruns a session, and a 99.9% success rate costs 864 of them.</p>
    <p><strong>And that estimate is the optimistic one.</strong> <em>E[K] = N·p</em> assumes frames fail independently. They don't: a garbage-collection pause, a page fault or a network stall takes out a run of consecutive frames, so real sessions cluster their failures into visible stutters rather than spreading them thinly.</p>
    <p><strong>Distributed systems compose badly, in two directions at once.</strong> A full-flight simulator is a rack: flight model, avionics, three visual channels, sound, motion, instructor station. The frame closes when the <em>last</em> host publishes, so latency composes as a maximum: one straggler at 19 ms makes the frame late for everyone. Reliability composes as a product: nine hosts at three nines each give 0.999⁹ ≈ 99.1% clean frames, about 7,800 bad frames per session. This is why the budget must be allocated and enforced per host: a system-wide average is not something anyone can engineer against.</p>
    <p><strong>Ship the instrument with the system.</strong> Sampled step time can miss a spike that happens between two polls; an overrun counter is incremented by the runtime at the moment the deadline breaks and cannot be missed. Monotonic counters are the trustworthy primitive for deadline compliance; sampled gauges are for trend. Determinism is not optimised in at the end: it is a budget, allocated per host, enforced every frame, and proven by telemetry that is part of the deliverable.</p>
  </details>

  <details class="lab-reveal" open>
    <summary>🧭 The thesis</summary>
    <p><strong>Fidelity earns the trust; determinism keeps it.</strong> A Level D simulator is not trusted because it is impressive. It is trusted because it brings two kinds of evidence: tests against the real aircraft, and timing proven on every frame by counters that cannot miss.</p>
    <p><strong>AI in the loop will owe the same evidence.</strong> The next components to join loops like this one will be learned models that see, predict and decide. Many of them take input-dependent time (a generated answer's length, the number of objects in a scene), so their slowest answers sit far from their average, which is exactly what a frame deadline punishes. My position is that such a model earns its place the way the simulator did: a measured fidelity against reality, and a measured worst case kept inside its share of the frame, with a defined answer when it is late. Evidence, not averages. This is my view and an open research direction, not a published result; <a href="/lab/determinism/">AI Meets the Deadline</a> explores one architecture for it.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="lvd-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/level-d.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
