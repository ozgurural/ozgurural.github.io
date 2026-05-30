---
permalink: /lab/gradient-pinball/
title: "Gradient Pinball — Optimization, playable"
description: "Land the optimizer in the global minimum. Step size, momentum, the occasional saddle."
excerpt: "Roll a ball down a high-dimensional loss landscape. Sweet spot or side valley — the math has opinions."
sitemap: true
---

<a href="/lab/" style="display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; text-decoration: none; font-weight: 600;"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-gd" style="margin-top: 0;">
  <span class="ep-eyebrow">Deep Learning · Optimization</span>
  <h2>Gradient Pinball</h2>
  <p class="lab-card__lead">⛰️ Every modern model (GPT, Stable Diffusion, your phone's autocorrect) learns by rolling a ball down a high-dimensional loss landscape. The deepest valley is the answer; the smaller dips are traps. Too cautious and you settle in a side valley convinced you've won; too aggressive and the ball leaves the landscape entirely.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Interactive optimization landscape visualizer. Represents the core mathematical optimization mechanism of the deep neural networks studied in the author's machine learning research.</span>
  </div>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Land the optimizer in the global minimum.</strong>
    <span>Pick step size and momentum, then Train. Momentum carries you through small hills the way physics carries a ball through ridges. 5★ only when you land in the real valley, not a saddle.</span>
    <div class="lab-card__mission-pills"><span>5★ global minimum</span><span>4★ close miss</span><span>3★ stuck in a side valley</span></div>
  </div>
  <div class="lab-experiment__panel">
    <div class="lab-experiment__controls">
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Step size</span>
          <span class="lab-control__var">α</span>
          <span class="lab-control__value" data-role="lr-val">0.02</span>
        </span>
        <input type="range" min="0.001" max="0.10" step="0.001" value="0.02" data-role="lr" aria-label="step size">
      </label>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Momentum</span>
          <span class="lab-control__var">β</span>
          <span class="lab-control__value" data-role="mom-val">0.00</span>
        </span>
        <input type="range" min="0.00" max="0.99" step="0.01" value="0.00" data-role="mom" aria-label="momentum">
      </label>
      <div class="lab-playset" aria-label="Gradient descent display options">
        <label class="lab-playset__opt"><input type="checkbox" data-role="gd-turbo" title="Speeds the training cadence"> Faster epochs</label>
      </div>
      <button class="lab-btn lab-btn--train" type="button" data-role="train-btn">
        <span class="lab-btn__text">Train!</span>
        <span class="lab-btn__bg"></span>
      </button>
      <button class="lab-btn lab-btn--train" type="button" data-role="gd-reroll-btn" aria-label="New random landscape and parameters">
        <span class="lab-btn__text">New Challenge</span>
        <span class="lab-btn__bg"></span>
      </button>
      <p class="lab-playbar__hint lab-playbar__hint--wide" data-role="gd-challenge-meta">Challenge: loading...</p>
      
      <!-- Active Game Controls -->
      <div class="lab-action-panel" data-role="gd-action-panel">
        <span class="lab-action-panel__steer">STEER THE PARTICLE LIVE:</span>
        <div class="lab-action-panel__steer-btns">
          <button class="lab-btn lab-btn--ghost lab-action-panel__steer-btn" type="button" data-role="gd-boost">🚀 Boost</button>
          <button class="lab-btn lab-btn--ghost lab-action-panel__steer-btn" type="button" data-role="gd-brake">🛑 Brake</button>
          <button class="lab-btn lab-btn--ghost lab-action-panel__steer-btn" type="button" data-role="gd-nudge-l">⬅️ Nudge L</button>
          <button class="lab-btn lab-btn--ghost lab-action-panel__steer-btn" type="button" data-role="gd-nudge-r">➡️ Nudge R</button>
        </div>
      </div>
    </div>

    <div class="lab-experiment__visual">
      <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-gd" preserveAspectRatio="xMidYMid meet" role="img" aria-label="loss landscape"></svg>
    </div>

    <div class="lab-experiment__scorebar" data-role="stars-gd" aria-live="polite"></div>
    <div class="lab-experiment__verdict" data-role="verdict-gd" aria-live="polite">
      <span class="lab-experiment__verdict-head">…</span>
      <span class="lab-experiment__verdict-sub">Pick step size and momentum, hit Train.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--strict">
        <span class="lab-experiment__metric-label">Final loss</span>
        <span class="lab-experiment__metric-value" data-role="loss-val">…</span>
        <span class="lab-experiment__metric-formula">lower = closer to the answer</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Epochs</span>
        <span class="lab-experiment__metric-value" data-role="epoch-val">0</span>
        <span class="lab-experiment__metric-formula">steps the ball took</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-gd">Set parameters. Hit Train. Watch how step size and momentum interact on different landscapes.</p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Learning is rolling downhill.</strong> Every modern AI (GPT, image generators, the search ranking on your phone) learns by repeatedly nudging its parameters in whichever direction makes the loss smaller. That's literally rolling a ball downhill on a high-dimensional landscape. Step size matters: too small and you crawl forever, too big and you bounce out of the valley you wanted.</p>
    <p><strong>Momentum is the killer feature.</strong> It lets the ball carry forward through small ridges that would otherwise trap it. This idea, invented for physics simulations in the 1960s, is why training a large model in 2026 finishes in days instead of years. Same algorithm in your phone's autocorrect, your camera's autofocus, and every AI lab on Earth.</p>
    <p><strong>Scientific Context:</strong> High-dimensional optimization landscapes govern the training dynamics of deep neural networks. Understanding how learning rates and momentum values navigate local minima and saddle points is essential for designing secure training frameworks like those in the author's machine learning security research.</p>
  </details>

  <div class="lab-share" data-role="gd-share-root">
    <button type="button" class="lab-share__btn" data-role="gd-share-btn" aria-haspopup="dialog" aria-expanded="false">
      <span class="lab-share__btn-icon">🔗</span>
      <span class="lab-share__btn-text">Share this run</span>
    </button>
    <div class="lab-share__popover" data-role="gd-share-popover" role="dialog" aria-label="Share this run" hidden>
      <p class="lab-share__preview" data-role="gd-share-text">5★ — Gradient Pinball · share text appears here</p>
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
