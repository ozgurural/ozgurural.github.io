---
permalink: /lab/
title: "Lab"
excerpt: "Short, interactive thought experiments at the intersection of ML security, distributed systems, and trustworthy AI."
---

<p class="ep-lead">
  Short, playable thought experiments — each in 60 seconds — at the intersection of ML security, distributed systems, and trustworthy AI. They're not "fun for fun" — each one demonstrates an idea from active research, and you can <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">open an issue</a> to discuss or suggest a new puzzle.
</p>

<section class="lab-card" id="puzzle-tg">
  <span class="ep-eyebrow">Distributed systems · Consensus</span>
  <h2>The Two Generals' Problem</h2>
  <p class="lab-card__lead">
    Two armies must coordinate to attack at dawn. Their only way to communicate is by messenger across enemy-held territory — where each messenger has a real chance of being captured. Click the buttons below and try to reach <em>certain</em> agreement.
  </p>

  <div class="lab-tg" data-loss-rate="0.4">
    <div class="lab-tg__field">
      <div class="lab-tg__army lab-tg__army--a">
        <div class="lab-tg__flag" aria-hidden="true">A</div>
        <div class="lab-tg__state" data-role="state-a">Plan ready · awaiting word from B</div>
      </div>
      <div class="lab-tg__valley" data-role="valley" aria-hidden="true"></div>
      <div class="lab-tg__army lab-tg__army--b">
        <div class="lab-tg__flag" aria-hidden="true">B</div>
        <div class="lab-tg__state" data-role="state-b">Awaiting plan from A</div>
      </div>
    </div>
    <div class="lab-tg__controls">
      <button class="lab-btn" data-role="send-a" type="button">Send messenger A → B</button>
      <button class="lab-btn" data-role="send-b" type="button" disabled>Send messenger B → A</button>
      <button class="lab-btn lab-btn--ghost" data-role="reset" type="button">Reset</button>
    </div>
    <div class="lab-tg__counter">
      <span><strong data-role="sent">0</strong> sent</span>
      <span><strong data-role="lost">0</strong> lost</span>
      <span>common knowledge: <strong data-role="ck">none</strong></span>
    </div>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>This is the <strong>Two Generals' Paradox</strong>. With an unreliable channel, no finite protocol guarantees that both sides are <em>certain</em> the other has agreed. The last messenger could always be the one that's captured — and without knowing the last one arrived, the receiver cannot safely commit.</p>
    <p>The implication is foundational. Every distributed system that needs agreement — database commits, blockchain consensus, atomic broadcast — must accept a weaker safety property: <em>agreement with high probability</em>, never with certainty. It's also why "two-phase commit" is fragile and why production systems lean on three-phase, Paxos, or Raft variants tolerant to message loss.</p>
  </details>
</section>

<section class="lab-card" id="puzzle-wm">
  <span class="ep-eyebrow">ML security · Model watermarking</span>
  <h2>Spot the Watermark</h2>
  <p class="lab-card__lead">
    Each grid below is the output signature of a trained model — colored by per-cell activation. One of them has a <strong>watermark</strong> embedded: a faint, distributed perturbation only a verifier with the secret key can detect. Can you guess which?
  </p>

  <div class="lab-wm">
    <div class="lab-wm__choices">
      <button class="lab-wm__grid" data-role="grid-0" data-index="0" type="button" aria-label="Grid 0"></button>
      <button class="lab-wm__grid" data-role="grid-1" data-index="1" type="button" aria-label="Grid 1"></button>
    </div>
    <div class="lab-wm__feedback" data-role="feedback">Click either grid to make a guess.</div>
    <div class="lab-wm__controls">
      <button class="lab-btn" data-role="new-round" type="button">New round</button>
      <button class="lab-btn lab-btn--ghost" data-role="reveal" type="button">Reveal pattern</button>
      <span class="lab-wm__score">Score: <strong data-role="score">0 / 0</strong></span>
    </div>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>The watermark is embedded as a small, distributed perturbation across specific "key cells." Without the key, the patterns are statistically indistinguishable. With it, verification is fast — and any attempt to remove the watermark distorts model behaviour in ways a verifier can still catch.</p>
    <p>This is the core idea behind <strong>feature-based model watermarking</strong>, the line of research I published in IEEE Access — <a href="https://ieeexplore.ieee.org/abstract/document/10741282">Ural &amp; Yoshigoe (2024)</a> and <a href="https://ieeexplore.ieee.org/document/11293969">SecurePoL (2025)</a> — which integrates watermarking with proof-of-learning to defend against spoofing attacks on training claims.</p>
  </details>
</section>

<section class="lab-footer">
  <p>Got a sharper take, a fix, or an idea for a new puzzle? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
