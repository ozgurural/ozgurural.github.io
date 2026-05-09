---
permalink: /lab/
title: "Lab"
excerpt: "Two playable challenges in distributed systems and ML security: pick a protocol, watch the battles; play the verifier with the key."
---

<p class="ep-lead">
  Two playable challenges. Each one runs a real simulation, scores you, and the score itself is the answer. The protocols and patterns are familiar to anyone who's worked in the field — but the right answer is rarely the intuitive one.
</p>

<section class="lab-card" id="puzzle-tg">
  <span class="ep-eyebrow">Distributed systems · Consensus protocol</span>
  <h2>The Two Generals' Game</h2>
  <p class="lab-card__lead">
    You are General A. The goal: coordinate with General B so that <em>both</em> attack at dawn. If only one of you attacks, that side is destroyed alone. The channel between you loses 40% of messengers. Pick a protocol, run ten battles, and see how often it actually wins. Try every option — the best one is rarely the one that <em>feels</em> safest.
  </p>

  <div class="lab-tg" data-loss-rate="0.4">
    <div class="lab-tg__strategies" role="radiogroup" aria-label="Choose a protocol">
      <label class="lab-tg__strategy">
        <input type="radio" name="tg-strategy" value="naive" checked>
        <div class="lab-tg__strategy-card">
          <span class="lab-tg__strategy-letter">a</span>
          <strong>Naive</strong>
          <span>Send 1 messenger. Always attack. Hope B got the plan.</span>
        </div>
      </label>
      <label class="lab-tg__strategy">
        <input type="radio" name="tg-strategy" value="confirm">
        <div class="lab-tg__strategy-card">
          <span class="lab-tg__strategy-letter">b</span>
          <strong>Wait for ack</strong>
          <span>Send plan. Attack only if B's acknowledgement arrives.</span>
        </div>
      </label>
      <label class="lab-tg__strategy">
        <input type="radio" name="tg-strategy" value="triple">
        <div class="lab-tg__strategy-card">
          <span class="lab-tg__strategy-letter">c</span>
          <strong>Triple round-trip</strong>
          <span>Plan + ack + ack-of-ack + ack-of-ack-of-ack. Attack only if the last one arrived.</span>
        </div>
      </label>
      <label class="lab-tg__strategy">
        <input type="radio" name="tg-strategy" value="abort">
        <div class="lab-tg__strategy-card">
          <span class="lab-tg__strategy-letter">d</span>
          <strong>Abort</strong>
          <span>Recognise the impossibility. Do not engage.</span>
        </div>
      </label>
    </div>

    <div class="lab-tg__field">
      <div class="lab-tg__army lab-tg__army--a">
        <div class="lab-tg__flag" aria-hidden="true">A</div>
        <div class="lab-tg__decision" data-role="a-decision">—</div>
      </div>
      <div class="lab-tg__valley" data-role="valley" aria-hidden="true">
        <span class="lab-tg__valley-label">the channel · 40% loss</span>
      </div>
      <div class="lab-tg__army lab-tg__army--b">
        <div class="lab-tg__flag" aria-hidden="true">B</div>
        <div class="lab-tg__decision" data-role="b-decision">—</div>
      </div>
    </div>

    <div class="lab-tg__controls">
      <button class="lab-btn" data-role="run" type="button">Run 10 battles</button>
      <button class="lab-btn lab-btn--ghost" data-role="reset" type="button">Reset stats</button>
    </div>

    <div class="lab-tg__scoreboard">
      <div class="lab-tg__stat lab-tg__stat--win">
        <span class="lab-tg__stat-label">Both attack · win</span>
        <strong data-role="wins">0</strong>
      </div>
      <div class="lab-tg__stat lab-tg__stat--loss">
        <span class="lab-tg__stat-label">A alone · loss</span>
        <strong data-role="a-alone">0</strong>
      </div>
      <div class="lab-tg__stat lab-tg__stat--loss">
        <span class="lab-tg__stat-label">B alone · loss</span>
        <strong data-role="b-alone">0</strong>
      </div>
      <div class="lab-tg__stat">
        <span class="lab-tg__stat-label">Both retreat · neutral</span>
        <strong data-role="neutral">0</strong>
      </div>
    </div>
    <p class="lab-tg__insight" data-role="insight">Pick a protocol and run 10 battles. Then try the next.</p>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>Run all four. The numbers reveal the point: <strong>more confirmation rounds make things worse, not better.</strong> Each ack adds another 40% chance of loss to the chain. The naive "send and pray" outperforms the careful triple-handshake by a wide margin — and <em>still</em> doesn't reach 100% wins. The Two Generals' Paradox isn't that you'll usually fail. It's that <em>no protocol</em> achieves 100% guaranteed agreement on a lossy channel.</p>
    <p>The implication is foundational. Every distributed system that needs agreement — database commits, blockchain consensus, atomic broadcast — must accept a weaker safety property: <em>agreement with high probability</em>, never with certainty. Production systems use Paxos and Raft variants because they degrade gracefully, not because they remove the impossibility.</p>
  </details>
</section>

<section class="lab-card" id="puzzle-wm">
  <span class="ep-eyebrow">ML security · Model watermarking</span>
  <h2>The Verifier's Eye</h2>
  <p class="lab-card__lead">
    You are the verifier. Each round shows one model output grid. Most carry a structured watermark embedded at a known set of cells — a diagonal, a cross, a frame. One round, somewhere in the run, has <strong>no watermark</strong>: just noise. Saying "watermarked" everywhere is the wrong answer. Subtlety rises every round. You get five.
  </p>

  <div class="lab-wm">
    <div class="lab-wm__roundbar">
      <span class="lab-wm__round-label">Round <strong data-role="round-num">1</strong> of 5</span>
      <span class="lab-wm__diff-label" data-role="difficulty">subtlety: low</span>
      <span class="lab-wm__score">Score <strong data-role="score">0 / 0</strong></span>
    </div>

    <div class="lab-wm__grid-wrap">
      <div class="lab-wm__grid" data-role="grid"></div>
    </div>

    <div class="lab-wm__verdict-buttons">
      <button class="lab-btn" data-role="yes" type="button">Watermarked</button>
      <button class="lab-btn lab-btn--ghost" data-role="no" type="button">Plain noise</button>
    </div>

    <p class="lab-wm__feedback" data-role="feedback">Look carefully. The watermark, if present, traces a structured shape. Make your call.</p>

    <div class="lab-wm__finalbar" data-role="finalbar" hidden>
      <p data-role="final-msg"></p>
      <button class="lab-btn lab-btn--ghost" data-role="restart" type="button">Try again with fresh patterns</button>
    </div>
  </div>

  <details class="lab-reveal">
    <summary>What this shows</summary>
    <p>The watermark is a perturbation embedded at a specific structured set of cells (the <em>secret key</em>). With the key, a verifier checks those exact cells — the watermark is unmistakable. Without the key, the watermark blends into normal model output variation; even an attentive eye is roughly at chance on the harder rounds.</p>
    <p>This is the asymmetry that makes <strong>feature-based model watermarking</strong> work as a defence: the verifier — who knows where to look — has overwhelming evidence; the adversary, who doesn't know the cells, has to either accept detection or distort the model badly enough to break it. The line of work is in IEEE Access (<a href="https://ieeexplore.ieee.org/abstract/document/10741282">2024</a>, <a href="https://ieeexplore.ieee.org/document/11293969">2025</a>), integrated with proof-of-learning to defend against spoofing attacks on training claims.</p>
  </details>
</section>

<section class="lab-footer">
  <p>A sharper protocol you'd like to play, a better verifier challenge, a correction? <a href="https://github.com/ozgurural/ozgurural.github.io/issues/new?labels=lab-feedback&amp;title=Lab+feedback">Open an issue</a> or <a href="mailto:drozgurural@gmail.com">email me</a>.</p>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}" defer></script>
