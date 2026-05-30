---
permalink: /lab/redundancy-reactor/
title: "Redundancy Reactor — Triple-modular redundancy, playable"
description: "Three of the same thing is still one thing. Pick the right N before the rocket disagrees with reality."
excerpt: "Triple-modular redundancy, correlation that bites, and the Ariane-5 story explained as a slider."
sitemap: true
---

<a href="/lab/" style="display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: 2rem; text-decoration: none; font-weight: 600;"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-tmr" style="margin-top: 0;">
  <span class="ep-eyebrow">Aerospace · Fault tolerance</span>
  <h2>Redundancy Reactor</h2>
  <p class="lab-card__lead">✈️ Your A320 has three flight computers and a majority voter. One fails, the other two outvote it. But "three computers" is only "three independent failure paths" if they fail differently. Identical software hits the same overflow at the same millisecond. (Ariane 5, 1996. The rocket disagreed with reality and disassembled itself 39 seconds in.)</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>Based on Triple Modular Redundancy (TMR). Inspired by real-time safety-critical aerospace and flight simulator architecture developed by the author.</span>
  </div>
  <div class="lab-card__mission">
    <span class="lab-card__mission-kicker">Your move</span>
    <strong>Pick the mission; pick the minimum N that beats the safety target.</strong>
    <span>Each mission carries its own correlation (ρ) and per-channel failure rate (q). 5★ means hitting the safety multiplier with the fewest backups; overspending earns 4★.</span>
    <div class="lab-card__mission-pills"><span>5★ minimum N</span><span>4★ overspent win</span><span>3★ close miss</span></div>
  </div>

  <div class="lab-tmr">
    <div class="lab-experiment__controls">
      <div class="lab-levels" data-role="tmr-levels" aria-label="Pick the mission">
        <strong class="lab-levels__title">Pick the mission</strong>
        <div class="lab-levels__row">
          <button type="button" class="lab-level" data-q="0.02" data-rho="0.00" data-goal-gain="200" data-min-n="5" data-name="Bank servers">
            <span class="lab-level__icon">🏢</span>
            <span class="lab-level__name">Bank servers</span>
            <span class="lab-level__hint">need 200× safer</span>
          </button>
          <button type="button" class="lab-level lab-level--active" data-q="0.05" data-rho="0.05" data-goal-gain="13" data-min-n="5" data-name="Self-driving car">
            <span class="lab-level__icon">🚗</span>
            <span class="lab-level__name">Self-driving</span>
            <span class="lab-level__hint">need 13× safer</span>
          </button>
          <button type="button" class="lab-level" data-q="0.08" data-rho="0.10" data-goal-gain="7" data-min-n="7" data-name="A320 cruise">
            <span class="lab-level__icon">✈️</span>
            <span class="lab-level__name">A320 cruise</span>
            <span class="lab-level__hint">need 7× safer</span>
          </button>
          <button type="button" class="lab-level" data-q="0.12" data-rho="0.20" data-goal-gain="4" data-min-n="7" data-name="Mars rover">
            <span class="lab-level__icon">🚀</span>
            <span class="lab-level__name">Mars rover</span>
            <span class="lab-level__hint">need 4× safer</span>
          </button>
        </div>
      </div>
      <label class="lab-control">
        <span class="lab-control__row">
          <span class="lab-control__name">Your strategy: how many backup computers?</span>
          <span class="lab-control__var">N</span>
          <span class="lab-control__value" data-role="n-channels-val">3</span>
        </span>
        <input type="range" min="3" max="9" step="2" value="3" data-role="n-channels" aria-label="how many computers">
      </label>
      <button class="lab-btn lab-btn--train lab-btn--run" type="button" data-role="tmr-run-btn">
        <span class="lab-btn__text">Run experiment</span>
        <span class="lab-btn__bg"></span>
      </button>
      
      <!-- Active Game Controls -->
      <div class="lab-action-panel" data-role="tmr-action-panel">
        <div class="lab-action-panel__row">
          <div class="lab-action-panel__row-top">
            <div class="lab-action-panel__timer" data-role="tmr-game-timer">Telemetry Time: 15s</div>
            <div class="lab-action-panel__health">Integrity: <span class="lab-action-panel__health-val" data-role="tmr-health">100%</span></div>
          </div>
          <div class="lab-action-panel__hint">Click computer labels below to <strong>MUTE</strong> failing channels before they hijack the majority vote!</div>
        </div>
      </div>
    </div>

    <div class="lab-tmr__strip" aria-hidden="true" data-role="tmr-strip">
      <div class="lab-tmr__row" data-ch="1">
        <span class="lab-tmr__row-label">💻 #1</span>
        <div class="lab-tmr__cells" data-cells="1"></div>
      </div>
      <div class="lab-tmr__row" data-ch="2">
        <span class="lab-tmr__row-label">💻 #2</span>
        <div class="lab-tmr__cells" data-cells="2"></div>
      </div>
      <div class="lab-tmr__row" data-ch="3">
        <span class="lab-tmr__row-label">💻 #3</span>
        <div class="lab-tmr__cells" data-cells="3"></div>
      </div>
      <div class="lab-tmr__row lab-tmr__row--sys">
        <span class="lab-tmr__row-label">✈️ Plane</span>
        <div class="lab-tmr__cells" data-cells="sys"></div>
      </div>
    </div>

    <svg class="lab-plot" viewBox="0 0 640 260" data-role="plot-tmr" preserveAspectRatio="xMidYMid meet" role="img" aria-label="system failure rate vs per-channel failure rate"></svg>

    <div class="lab-experiment__scorebar" data-role="stars-tmr" aria-live="polite"></div>
    <div class="lab-experiment__verdict" data-role="verdict-tmr" aria-live="polite">
      <span class="lab-experiment__verdict-head">…</span>
      <span class="lab-experiment__verdict-sub">Pick a mission, choose backup count, hit Run.</span>
    </div>
    <div class="lab-experiment__readout">
      <div class="lab-experiment__metric lab-experiment__metric--naive">
        <span class="lab-experiment__metric-label">Safety multiplier</span>
        <span class="lab-experiment__metric-value" data-role="gain-val">…</span>
        <span class="lab-experiment__metric-formula">vs a single computer</span>
      </div>
      <div class="lab-experiment__metric lab-experiment__metric--detect">
        <span class="lab-experiment__metric-label">Whole-system failure rate</span>
        <span class="lab-experiment__metric-value" data-role="sys-val">…</span>
        <span class="lab-experiment__metric-formula">after majority voting</span>
      </div>
    </div>

    <p class="lab-experiment__insight" data-role="insight-tmr">Drag the sliders. The strip is live and the curves are closed-form.</p>
    <p class="lab-experiment__sweet" data-role="sweet-spot-tmr" hidden></p>
  </div>

  <details class="lab-reveal">
    <summary>🧠 What did you just learn?</summary>
    <p><strong>Three of the same thing is still one thing.</strong> Backup computers only protect you if they fail in different ways. Three identical computers running the same software will hit the same bug at the same moment, and then majority voting gives the wrong answer with confidence.</p>
    <p>This is what crashed the first Ariane 5 rocket in 1996: it had redundant flight computers, but they all ran the same code, so they all overflowed the same variable at the same instant. To get real safety, planes use computers from <em>different vendors</em>, written by <em>different teams</em>, in <em>different programming languages</em>. Same idea protects nuclear reactors, Mars rovers, and the secure chip in your phone.</p>
    <p><strong>Scientific Context:</strong> Triple Modular Redundancy (TMR) is a foundational pattern in high-availability and safety-critical computing. This model shows how correlated failures (common-mode faults) degrade reliability. Similar redundancy and low-latency safety-critical mechanisms are essential in real-time avionics software and flight simulator data pipelines developed by the author.</p>
  </details>

  <div class="lab-share" data-role="tmr-share-root">
    <button type="button" class="lab-share__btn" data-role="tmr-share-btn" aria-haspopup="dialog" aria-expanded="false">
      <span class="lab-share__btn-icon">🔗</span>
      <span class="lab-share__btn-text">Share this run</span>
    </button>
    <div class="lab-share__popover" data-role="tmr-share-popover" role="dialog" aria-label="Share this run" hidden>
      <p class="lab-share__preview" data-role="tmr-share-text">5★ — Redundancy Reactor · share text appears here</p>
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
