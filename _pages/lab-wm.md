---
permalink: /lab/model-heist/
title: "Model Heist Detector — AI watermarks, playable"
description: "Catch the thief without breaking the model. AI provenance, made tactile."
excerpt: "Spread a faint statistical signature across thousands of weights and read it back through the noise."
sitemap: true
---

<a href="/lab/" style="display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; text-decoration: none; font-weight: 600;"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-wm" style="margin-top: 0;">
  <span class="ep-eyebrow">ML security · Model provenance</span>
  <h2>Model Heist Detector</h2>
  <p class="lab-card__lead">🕵️ Someone leaked your AI and ran it through a disguise. Before publishing, you'd spread a faint statistical signature across thousands of weights, too small to notice individually but together a fingerprint only you can read. The thief tries to scrub it. You have to read it through the noise anyway.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Implements robust statistical watermarking. See the author's paper: <a href="/publication/2024-ieee-access-watermarking">"Feature-Based Model Watermarking for PoL"</a> (IEEE Access 2024).</span>
  </div>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Catch the thief without breaking the model.</strong>
    <span>Each thief level adds more noise. Tune signature strength and number of marks. Push ε too far and the model behaves oddly; under-shoot k and the signal drowns in the noise floor.</span>
    <div class="lab-card__mission-pills"><span>5★ beat the catch target</span><span>4★ catch with collateral</span><span>3★ partial detection</span></div>
  </div>

  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <div class="lab-levels" data-role="wm-levels" aria-label="Pick the thief">
        <strong class="lab-levels__title">Pick the thief</strong>
        <div class="lab-levels__row">
          <button type="button" class="lab-level" data-sigma="0.05" data-goal-det="0.97" data-eps-max="0.15" data-name="Casual">
            <span class="lab-level__icon">🦮</span>
            <span class="lab-level__name">Casual</span>
            <span class="lab-level__hint">light tweaks · need 97% catch</span>
          </button>
          <button type="button" class="lab-level lab-level--active" data-sigma="0.15" data-goal-det="0.90" data-eps-max="0.18" data-name="Pro thief">
            <span class="lab-level__icon">🎭</span>
            <span class="lab-level__name">Pro thief</span>
            <span class="lab-level__hint">fine-tunes · need 90% catch</span>
          </button>
          <button type="button" class="lab-level" data-sigma="0.25" data-goal-det="0.80" data-eps-max="0.20" data-name="Crafty">
            <span class="lab-level__icon">🦹</span>
            <span class="lab-level__name">Crafty</span>
            <span class="lab-level__hint">scrubs hard · need 80% catch</span>
          </button>
          <button type="button" class="lab-level" data-sigma="0.35" data-goal-det="0.65" data-eps-max="0.25" data-name="Mastermind">
            <span class="lab-level__icon">🐉</span>
            <span class="lab-level__name">Mastermind</span>
            <span class="lab-level__hint">nation-state · need 65% catch</span>
          </button>
        </div>
      </div>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Your strategy: how bold is your signature?</span>
          <span class="lab-control__var">ε</span>
          <span class="lab-control__value" data-role="eps-val">0.20</span>
        </span>
        <input type="range" min="0.02" max="0.45" step="0.01" value="0.20" data-role="eps" aria-label="how bold is the watermark signature">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Your strategy: how many hidden marks?</span>
          <span class="lab-control__var">k</span>
          <span class="lab-control__value" data-role="k-val">8</span>
        </span>
        <input type="range" min="1" max="32" step="1" value="8" data-role="k" aria-label="how many hidden marks">
      </label>
      <button class="lab-btn lab-btn--train lab-btn--run" type="button" data-role="wm-run-btn">
        <span class="lab-btn__text">Run experiment</span>
        <span class="lab-btn__bg"></span>
      </button>
      
      <!-- Active Game Controls -->
      <div class="lab-action-panel" data-role="wm-action-panel">
        <div class="lab-action-panel__timer" data-role="wm-game-timer">Scrubbing Storm: 8.0s</div>
        <div class="lab-action-panel__hint">Hover / Drag over key cells (orange) to SHIELD them from the tuning storm!</div>
      </div>
    </div>

    <div class="lab-experiment__visual">
      <div class="lab-wm__grid" data-role="grid" aria-hidden="true"></div>
      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-wm" preserveAspectRatio="xMidYMid meet" role="img" aria-label="detection rate vs attacker noise"></svg>
      <div class="lab-wm-legend" aria-hidden="true">
        <span><span class="lab-wm-legend__swatch lab-wm-legend__swatch--key"></span> watermark key cell</span>
        <span><span class="lab-wm-legend__swatch lab-wm-legend__swatch--value"></span> sampled weight</span>
        <span><span class="lab-wm-legend__swatch lab-wm-legend__swatch--glitch"></span> ε above utility threshold</span>
      </div>
    </div>

    <div class="lab-experiment__scoreline">
      <div class="lab-experiment__scorebar" data-role="stars-wm" aria-live="polite"></div>
      <span class="lab-endings" data-role="endings-wm" title="Each Run lands you in a named ending. Find them all."></span>
    </div>
    <div class="lab-experiment__verdict" data-role="verdict-wm" aria-live="polite">
      <span class="lab-experiment__verdict-head">…</span>
      <span class="lab-experiment__verdict-sub">Pick a thief, set your strategy, hit Run.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Caught the thief</span>
        <span class="lab-experiment__metric-value" data-role="det-val">…</span>
        <span class="lab-experiment__metric-formula">verifier with the secret key</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--fpr">
        <span class="lab-experiment__metric-label">False alarm rate</span>
        <span class="lab-experiment__metric-value" data-role="fpr-val">…</span>
        <span class="lab-experiment__metric-formula">on an innocent model</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-wm">Drag the sliders.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-wm" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Tiny secrets in many places beat one big secret.</strong> An AI model has hundreds of millions of internal numbers. A watermark is a faint statistical pattern spread across many of them. Each individual mark is way too small to notice, but together they form a signature only you can recognize.</p>
    <p>This is how labs at OpenAI, Google, and Anthropic plan to prove "yes, that model is ours" if it gets leaked. The same trick is used to find AI-generated text, mark images from specific cameras, and prove which lab produced a research paper. The harder the thief tries to erase one mark, the more visible the others become.</p>
    <p><strong>Scientific Context:</strong> This simulation implements features similar to the watermark detection schemes analyzed in the author's paper, where aggregate detection over $k$ weights is modeled using a Gaussian Z-test. Read the details in the IEEE Access paper: <a href="/publication/2024-ieee-access-watermarking">"Feature-Based Model Watermarking for PoL"</a> (IEEE Access 2024).</p>
  </details>

  <div class="lab-share" data-role="wm-share-root">
    <button type="button" class="lab-share__btn" data-role="wm-share-btn" aria-haspopup="dialog" aria-expanded="false">
      <span class="lab-share__btn-icon">🔗</span>
      <span class="lab-share__btn-text">Share this run</span>
    </button>
    <div class="lab-share__popover" data-role="wm-share-popover" role="dialog" aria-label="Share this run" hidden>
      <p class="lab-share__preview" data-role="wm-share-text">5★ — Model Heist Detector · share text appears here</p>
      <div class="lab-share__actions">
        <button type="button" data-share="copy">📋 Copy link</button>
        <button type="button" data-share="x">𝕏 Tweet</button>
        <button type="button" data-share="li">in LinkedIn</button>
        <button type="button" data-share="close" aria-label="Close share">✕</button>
      </div>
    </div>
  </div>
</section>

<script src="{{ '/assets/js/lab.js' | relative_url }}?v={{ site.time | date: '%s' }}" defer></script>
