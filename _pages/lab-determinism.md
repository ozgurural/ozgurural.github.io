---
permalink: /lab/determinism/
oembed: "/lab/determinism/oembed.json"
title: "AI Meets the Deadline"
description: "Explore how AI planning meets real-time execution: an animated architecture experiment with latency, stale proposals, fallback and resource contention."
excerpt: "A better model still needs a timing contract. Compare blocking inference with asynchronous proposals in a reproducible 60 Hz teaching model."
sitemap: true
header:
  og_image: "lab-og/og-ai-deadline.png"
---

<a href="/lab/" class="lab-back"><span>&larr;</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-det" style="margin-top: 0;">
  <span class="ep-eyebrow">AI architecture &middot; Physical systems &middot; Real-time execution</span>
  <p class="lab-card__lead">AI can plan the next move. <strong>The system still has to meet the next deadline.</strong> As robot models gain new capabilities, an architecture decision becomes more important: where should inference run, when may its answer be used, and what happens while it is unavailable? This film and executable experiment explore those choices around a 60 Hz controller.</p>
  <div class="lab-card__usecase"><strong>Design study:</strong> <span>Open research direction of the author, not yet published. The traces below come from a synthetic scheduling model, not a deployed robot, an AI benchmark or a certification test. The work connects my interests in machine-learning security and real-time systems; it discloses no employer design.</span></div>

  <div class="lab-film"><div class="lab-film__frame" id="det-film" role="group" aria-label="Animated architecture experiment: AI Meets the Deadline"></div></div>
  <p class="lab-film__legend"><span><i style="background:#58c4dd"></i> on time</span><span><i style="background:#fc6255"></i> deadline missed</span><span><i style="background:#fbbf24"></i> fallback</span></p>

  <h2>The decision: let intelligence improve without blocking execution</h2>
  <p>In this design, inference runs in a separate worker. The execution loop consumes an admitted proposal or uses a defined baseline controller. A proposal carries the observation time and context version it was computed from. Admission and expiry checks apply before use. That preserves a place for richer planning while making availability, freshness and timing explicit responsibilities.</p>
  <p>The tradeoff is real: the execution loop can meet every deadline while spending most of its time without useful AI input. A freshness limit can reject outdated proposals, but cannot establish that an action is correct. Resource isolation, action constraints, state estimation and the baseline controller require their own evidence.</p>

  <h2>Try the architecture under stress</h2>
  <div id="deadline-experiment" class="deadline-lab">
    <p>Change the delay pattern, disconnect inference, or remove resource isolation. Both designs use the same latency rule. Their request times differ because blocking execution queues jobs, while the asynchronous worker skips requests when busy.</p>
    <div class="deadline-controls">
      <label for="deadline-delay">Extra delay on every fourth request <output id="deadline-delay-value" for="deadline-delay">80 ms</output><input id="deadline-delay" type="range" min="0" max="240" step="8" value="80"></label>
      <label for="deadline-ttl">Maximum observation age <output id="deadline-ttl-value" for="deadline-ttl">150 ms</output><input id="deadline-ttl" type="range" min="50" max="400" step="10" value="150"></label>
      <label class="deadline-check" for="deadline-outage"><input id="deadline-outage" type="checkbox"> Simulate an inference outage from 2 to 3 seconds</label>
      <label class="deadline-check" for="deadline-shared"><input id="deadline-shared" type="checkbox"> Inject shared-resource stalls of 20 ms, once per second</label>
    </div>
    <dl class="deadline-metrics" aria-live="polite" aria-atomic="true">
      <div><dt>Blocking: missed deadlines</dt><dd id="deadline-direct">Loading</dd></div>
      <div><dt>Async: missed deadlines</dt><dd id="deadline-async">Loading</dd></div>
      <div><dt>Async: fresh-AI coverage</dt><dd id="deadline-fresh">Loading</dd></div>
      <div><dt>Peak response time: blocking / async</dt><dd id="deadline-peak">Loading</dd></div>
    </dl>
    <canvas width="960" height="250" role="img" aria-label="Comparison of controller job deadlines"></canvas>
    <p class="deadline-key">Cyan: on time. Red: missed deadline. Amber: on time using fallback. Fresh-AI coverage counts jobs with an admitted proposal, including any late jobs.</p>
    <p id="deadline-interpretation"></p>
    <div class="deadline-actions"><button type="button" id="deadline-reset">Reset experiment</button><button type="button" id="deadline-download">Download this trace (JSON)</button></div>
    <noscript><p>The interactive model needs JavaScript. Its assumptions and executable source are available below.</p></noscript>
  </div>

  <details class="lab-reveal">
    <summary>Model assumptions and what these numbers mean</summary>
    <p>360 controller jobs are released at 60 Hz over six simulated seconds. Each has a deadline one period after release: 16.67 ms. The controller costs 4 ms; the asynchronous design adds a fixed 1 ms admission cost. These are chosen inputs, not measured hardware timings. The model completes queued jobs even if they finish after the release window.</p>
    <p>Inference takes 8 ms, with the selected extra delay on every fourth call. The blocking design calls inference every sixth job. The asynchronous design offers a request every 100 ms to one worker, skips busy opportunities and transfers completed proposals atomically. The worker's first result becomes available after startup. An outage abandons requests that begin in its window after a 400 ms timeout.</p>
    <p>Context changes every two seconds. A proposal is usable only if its observation age is within the selected limit and its context matches at execution time. Expired proposals trigger fallback. Shared contention adds 20 ms to one controller job per second in both designs. The model assumes no other operating-system jitter and does not simulate a plant, action quality, a model's accuracy or the safety of fallback.</p>
    <p>A zero miss count here follows from the chosen execution costs and isolation assumptions. It is not a worst-case timing proof. All traces are deterministic and use the same model as the animation. Inspect the <a href="https://github.com/ozgurural/ozgurural.github.io/blob/master/assets/js/lab-deadline-model.js">model source</a> and its <a href="https://github.com/ozgurural/ozgurural.github.io/blob/master/scripts/test-deadline-model.js">executable checks</a>.</p>
  </details>

  <h2>What recent AI work makes worth exploring</h2>
  <p><strong>Keep moving while inference runs.</strong> Physical Intelligence's <a href="https://www.pi.website/research/real_time_chunking">Real-Time Action Chunking</a> studies asynchronous generation of action sequences and continuity between them. It addresses the harder question of compatible actions during motion. The simple freshness checks in this lab do not implement that algorithm.</p>
  <p><strong>Move inference closer to execution.</strong> <a href="https://deepmind.google/blog/gemini-robotics-on-device-brings-ai-to-local-robotic-devices/">Gemini Robotics On-Device</a> explores local execution to address latency and connectivity, and describes integration with low-level safety controllers. Local inference can remove a network dependency; it still needs timing and resource analysis.</p>
  <p><strong>Generate more demanding test candidates.</strong> <a href="https://docs.nvidia.com/cosmos/latest/introduction.html">NVIDIA Cosmos</a> provides world-model tools for physical AI. My proposed next experiment is to use generated scenario variations to search for failures, then reproduce relevant cases in an independently checked simulator. A plausible generated video is not a validated physical model.</p>

  <h2>What I would measure before changing the design</h2>
  <div class="deadline-table"><table><thead><tr><th>Decision</th><th>Potential gain</th><th>Evidence needed</th></tr></thead><tbody>
    <tr><td>Larger or remote model</td><td>More capable planning</td><td>Successful task completion per unit time, inference cost, delay distribution and outage behaviour</td></tr>
    <tr><td>Local model with isolated resources</td><td>Fewer network dependencies</td><td>Timing under competing load, memory limits, thermal throttling and update procedures</td></tr>
    <tr><td>Longer proposal lifetime</td><td>More AI availability</td><td>Task outcomes when observations age or the environment changes</td></tr>
    <tr><td>AI-generated test scenarios</td><td>Broader failure search</td><td>Reproducible failures, scenario validity and comparison with a fixed regression set</td></tr>
  </tbody></table></div>
  <p>An initial experiment could replay identical observation traces across candidate designs, inject delay and context changes, and report task success alongside timing and fallback use. Version the model, test inputs and admission rules together so an apparent improvement can be reproduced.</p>

  <details class="lab-reveal">
    <summary>The timing mathematics, with assumptions stated</summary>
    <p>At frequency <em>f</em>, the period is <em>1/f</em>. At 60 Hz this is 16.67 ms. A job misses its deadline when completion time exceeds release time plus that period. The frequency here is a teaching choice, not a qualification requirement.</p>
    <p>For a count of missed deadlines, <em>E[K] = &Sigma; p<sub>i</sub></em>. If every frame has the same marginal miss probability <em>p</em>, this becomes <em>Np</em>. Independence is not required for that expectation. Correlation affects clustering and the distribution of the count. Four hours at 60 Hz gives 864,000 frames; at <em>p = 10<sup>&minus;5</sup></em>, the expected count is 8.64.</p>
    <p>For an idealised parallel barrier, completion time is the maximum participant time, plus any omitted communication and coordination overhead. The probability that all participants meet their budgets equals a product only when their success events are independent. Shared resource stalls violate that assumption.</p>
  </details>
  <p><a href="/projects/">Explore the engineering projects</a> &middot; <a href="/publications/">Read the published research</a></p>
</section>
<link rel="stylesheet" href="{{ '/assets/css/lab-deadline.css' | relative_url }}">
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-deadline-model.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/determinism.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
