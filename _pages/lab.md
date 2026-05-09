---
permalink: /lab/
title: "Lab"
excerpt: "Short, interactive thought experiments at the intersection of ML security, distributed systems, and trustworthy AI."
---

<p class="ep-lead">
  Short, playable thought experiments — each in 60 seconds — at the intersection of ML security, distributed systems, and trustworthy AI. They aren't decorative animations: each one is built so the underlying impossibility result, or principle, becomes <em>visible by playing</em>. <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> to discuss or suggest a new one.
</p>

<section class="lab-card" id="puzzle-tg">
  <span class="ep-eyebrow">Distributed systems · Consensus</span>
  <h2>The Two Generals' Problem</h2>
  <p class="lab-card__lead">
    Two armies must coordinate to attack at dawn. They communicate only by messenger across enemy-held territory — each messenger has a real chance of being captured. The strip in the middle shows what <em>actually</em> happens. The two terminals below show what <em>each general actually knows</em>. Watch the gap between them.
  </p>

  <div class="lab-tg" data-loss-rate="0.4">
    <div class="lab-tg__field">
      <div class="lab-tg__army lab-tg__army--a"><div class="lab-tg__flag" aria-hidden="true">A</div></div>
      <div class="lab-tg__valley" data-role="valley" aria-hidden="true">
        <span class="lab-tg__valley-label">the channel</span>
      </div>
      <div class="lab-tg__army lab-tg__army--b"><div class="lab-tg__flag" aria-hidden="true">B</div></div>
    </div>

    <div class="lab-tg__terminals">
      <div class="lab-tg__terminal">
        <header class="lab-tg__terminal-head">A's view</header>
        <dl class="lab-tg__lines">
          <dt>Sent</dt><dd data-role="a-sent">—</dd>
          <dt>Got</dt><dd data-role="a-recv">—</dd>
        </dl>
        <p class="lab-tg__belief" data-role="a-belief">Plan ready. Ready to send the first messenger.</p>
      </div>
      <div class="lab-tg__terminal">
        <header class="lab-tg__terminal-head">B's view</header>
        <dl class="lab-tg__lines">
          <dt>Sent</dt><dd data-role="b-sent">—</dd>
          <dt>Got</dt><dd data-role="b-recv">—</dd>
        </dl>
        <p class="lab-tg__belief" data-role="b-belief">Awaiting first messenger from A.</p>
      </div>
    </div>

    <div class="lab-tg__controls">
      <button class="lab-btn" data-role="next" type="button">Send next  (A → B)</button>
      <button class="lab-btn lab-btn--ghost" data-role="reset" type="button">Reset</button>
    </div>

    <div class="lab-tg__counter">
      <span><strong data-role="rounds">0</strong> rounds</span>
      <span><strong data-role="lost">0</strong> lost</span>
      <span data-role="paradox-status">Both sides still uncertain.</span>
    </div>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>Look at the <strong>Sent</strong> line on either terminal. It always carries a <code>(?)</code>. The sender has no way to tell whether their last messenger arrived — the <em>only</em> way to know would be a confirmation from the other side, which is itself a messenger that may or may not arrive. The <strong>Got</strong> line, on the other hand, only updates when delivery succeeds, and it's the only thing either side knows for certain.</p>
    <p>The pattern is the <strong>Two Generals' Paradox</strong>. With an unreliable channel, no finite protocol guarantees that both sides are <em>certain</em> the other has agreed. However many rounds you play, the <code>(?)</code> never disappears. It is provably impossible to remove.</p>
    <p>The implication is foundational. Every distributed system that needs agreement — database commits, blockchain consensus, atomic broadcast — must accept a weaker safety property: <em>agreement with high probability</em>, never with certainty. It is also why two-phase commit is fragile, and why production systems lean on three-phase, Paxos, or Raft variants tolerant of message loss.</p>
  </details>
</section>

<section class="lab-card" id="puzzle-wm">
  <span class="ep-eyebrow">ML security · Model watermarking</span>
  <h2>Spot the Watermark</h2>
  <p class="lab-card__lead">
    Each grid below is the output signature of a trained model — colored by per-cell activation. One has a <strong>watermark</strong> embedded: a small perturbation applied at a fixed, structured set of cells (the <em>secret key</em>). Without the key, the watermark blends into normal model variation. With the key — which the verifier holds — it forms a recognisable shape.
  </p>

  <div class="lab-wm">
    <div class="lab-wm__choices">
      <button class="lab-wm__grid" data-role="grid-0" data-index="0" type="button" aria-label="Grid 0"></button>
      <button class="lab-wm__grid" data-role="grid-1" data-index="1" type="button" aria-label="Grid 1"></button>
    </div>
    <div class="lab-wm__feedback" data-role="feedback">Click either grid. The watermark is a structured shape — try to spot it.</div>
    <div class="lab-wm__controls">
      <button class="lab-btn" data-role="new-round" type="button">New round</button>
      <button class="lab-btn lab-btn--ghost" data-role="reveal" type="button">Reveal pattern</button>
      <span class="lab-wm__score">Score: <strong data-role="score">0 / 0</strong></span>
    </div>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>The watermark isn't random pixel noise — it's a perturbation embedded at a <em>specific structured set of cells</em> (the secret key). The patterns cycled here are simple shapes — a diagonal, a cross, a centre block, a frame — but they could be anything fixed in advance. When you don't know which cells, the watermark blends into the model's normal output variation. When you do know — as the verifier with the key — it's instantly visible as a shape.</p>
    <p>Any attempt to remove the watermark also distorts model behaviour at those cells, in ways the verifier can still detect. The honest trainer carries the marks naturally; a forger has to know exactly where to put them.</p>
    <p>This is the principle behind <strong>feature-based model watermarking</strong> — the line of work I published in IEEE Access (<a href="https://ieeexplore.ieee.org/abstract/document/10741282">2024</a>, <a href="https://ieeexplore.ieee.org/document/11293969">2025</a>), integrated with proof-of-learning to defend against spoofing attacks on training claims.</p>
  </details>
</section>

<section class="lab-footer">
  <p>Got a sharper take, a fix, or an idea for a new puzzle? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
