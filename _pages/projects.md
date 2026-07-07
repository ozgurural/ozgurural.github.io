---
permalink: /projects/
title: "Projects"
description: "Research code, interactive demos, and production systems by Dr. Ozgur Ural: SecurePoL proof-of-learning security, model watermarking, UAV ground control, Level D flight-simulation platforms, and clinical tooling."

---

<p class="ep-lead">Selected work across Ph.D. research code, interactive demos, C++ systems primitives, and clinical tooling. Each project links to its repository and writeup. The <a href="/lab/"><strong>Interactive Lab</strong></a> contains five playable demos for the same research areas.</p>

<ul class="ep-cards">
  <li>
    <div class="meta">Interactive · 5 experiments</div>
    <h3 class="title"><a href="/lab/">Research Lab: interactive experiments</a></h3>
    <p class="desc">Five interactive experiments covering distributed consensus, model watermarking, proof-of-learning, fault tolerance, and gradient descent. Each presents a real scenario with measurable outcomes. Built to make the core concepts of my research accessible in three minutes.</p>
  </li>
</ul>

## Research

<ul class="ep-cards">
  <li>
    <div class="meta">Ph.D. · ML Security</div>
    <h3 class="title"><a href="/blog/securepol-with-watermarking">SecurePoL with Watermarking</a></h3>
    <p class="desc">Reference implementation accompanying my dissertation. Integrates feature-based model watermarking with proof-of-learning to defend ML training integrity against spoofing attacks.</p>
  </li>
  <li>
    <div class="meta">Adversarial ML</div>
    <h3 class="title"><a href="/blog/adversarial-examples-for-proof-of-learning">Adversarial Examples for Proof-of-Learning</a></h3>
    <p class="desc">Code investigating adversarial strategies that subvert PoL verification. Informs defenses introduced in the SecurePoL line of work.</p>
  </li>
  <li>
    <div class="meta">M.Sc. · NLP Security</div>
    <h3 class="title"><a href="/blog/ms-thesis">METU Master's Thesis</a></h3>
    <p class="desc">Detection of cyber-security events from Turkish Twitter and newspaper streams, completed at Middle East Technical University (METU). This research served as the foundation for my published ICISSP paper.</p>
  </li>
</ul>

## Enterprise AI Strategy & Architecture

<p class="ep-lead">I designed and architected the full enterprise AI strategy for Avion Full Flight Simulators. The strategy outlines discipline-specific agents grounded in approved data, utilizing local on-prem inference (Gemma) for data sovereignty and cloud APIs (Claude 3.5) for de-identified reasoning.</p>

<ul class="ep-cards">
  <li>
    <div class="meta">Strategy Paper · Architect</div>
    <h3 class="title"><a href="/files/avion-ai-strategy.pdf">Avion AI: Proposed Strategy & Vision (PDF)</a></h3>
    <p class="desc">The comprehensive strategy paper covering the vision, competitive landscape, agent architectures, deployment & security tiers (NIST AI RMF), and first-wave delivery plan.</p>
  </li>
  <li>
    <div class="meta">AI Agent · Engineering</div>
    <h3 class="title">Engineering Knowledge Copilot</h3>
    <p class="desc">A version-aware copilot over the entire engineering corpus. Answers questions with grounded citations, synthesizes the impact of document and spec changes across downstream artifacts, and generates suggested playbooks. Powered by on-prem multimodal parsing and semantic diffs.</p>
  </li>
  <li>
    <div class="meta">AI Agent · CI/CD Integration</div>
    <h3 class="title">GitLab Autonomous Engineering Staff Agent</h3>
    <p class="desc">A hybrid agent embedded in the software development lifecycle. Conducts autonomous code reviews, verifies release integrity against requirements, and flags integration risks before deployment.</p>
  </li>
  <li>
    <div class="meta">AI Agent · Field Operations</div>
    <h3 class="title">Fault Diagnostics Copilot</h3>
    <p class="desc">Given a fault signal, retrieves similar historical cases and OEM bulletins via RAG, classifies the likely domain (software / hardware / wiring), and names the owner on the first pass—all on an air-gapped on-prem model to ensure zero data exfiltration.</p>
  </li>
  <li>
    <div class="meta">AI Agent · Data Science</div>
    <h3 class="title">Predictive Maintenance Forecaster</h3>
    <p class="desc">Uses fleet-wide operational telemetry to predict component wear and schedule maintenance proactively before a simulator goes unplanned-offline. Built on Scikit-learn and Prophet time-series models.</p>
  </li>
</ul>

## Production Systems (Industry)

<ul class="ep-cards">
  <li>
    <div class="meta">2023– · Avion Full Flight Simulators</div>
    <h3 class="title"><a href="https://www.aviongroup.aero/">Real-time platforms for Level D flight simulators</a></h3>
    <p class="desc">Architecting real-time simulation platforms and cloud-native infrastructure for Level D full-flight simulators: the highest certification level, where simulator time counts as flight time.</p>
  </li>
  <li>
    <div class="meta">2020–2021 · Havelsan · Team Lead</div>
    <h3 class="title">Havelsan DLP: data-leakage prevention at national scale</h3>
    <p class="desc">Led the 14-engineer team that delivered a data-leakage-prevention product for defence and government clients.</p>
  </li>
  <li>
    <div class="meta">2019–2020 · STM Defence Technologies</div>
    <h3 class="title">Ground control for Kargu &amp; Togan UAVs</h3>
    <p class="desc">Architecture contributions to the mission-control and ground-control systems for the Kargu autonomous tactical UAV and Togan reconnaissance UAV.</p>
  </li>
  <li>
    <div class="meta">2014–2019 · Comodo Cybersecurity</div>
    <h3 class="title">Secure Web Gateway · Patch Manager · Dragon browser</h3>
    <p class="desc">Led design and architecture of Comodo's Secure Web Gateway, enterprise Patch Manager, and the Chromium-based Dragon browser.</p>
  </li>
</ul>

## Applied Tooling

<ul class="ep-cards">
  <li>
    <div class="meta">Python · PyQt5 · Clinical Tooling</div>
    <h3 class="title"><a href="/blog/pyqt5_image_measurer">EKG Image Measurement Tool</a></h3>
    <p class="desc">Specialized desktop utility for cardiology professionals. Built and field-tested with clinicians to provide reliable, real-world scale calibration for EKG diagnostics.</p>
  </li>
</ul>
