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

## Applied AI Concepts & Architectures

<p class="ep-lead">A collection of brainstormed enterprise AI architectures and proof-of-concept system designs. These models explore how discipline-specific AI agents, grounded in approved corporate data, can utilize local on-prem inference for data sovereignty alongside secure APIs for de-identified reasoning.</p>

<ul class="ep-cards">
  <li>
    <div class="meta">AI Agent · Engineering</div>
    <h3 class="title">Engineering Knowledge Copilot</h3>
    <p class="desc">A version-aware copilot over a massive engineering corpus. Answers questions with grounded citations, synthesizes the impact of document and spec changes across downstream artifacts, and generates suggested playbooks. Powered by on-prem multimodal parsing and semantic diffs.</p>
  </li>
  <li>
    <div class="meta">AI Agent · CI/CD Integration</div>
    <h3 class="title">Autonomous Engineering Staff Agent</h3>
    <p class="desc">A hybrid agent embedded in the software development lifecycle. Conducts autonomous code reviews, verifies release integrity against requirements, and flags integration risks before deployment using self-hosted Git pipelines.</p>
  </li>
  <li>
    <div class="meta">AI Agent · Proposals</div>
    <h3 class="title">RFP Accelerator</h3>
    <p class="desc">An agent that ingests Request for Proposal (RFP) documents, searches past answers, product specs, and OEM manuals, and drafts a clear, cited reply. Reduces RFP cycle-time significantly without data exfiltration.</p>
  </li>
  <li>
    <div class="meta">AI Agent · Education</div>
    <h3 class="title">Instructor Debrief Writer</h3>
    <p class="desc">Enhances training session logs by stripping student identifiers, drafting a polished on-tone debrief from telemetry and instructor bullet notes, and suggesting rubric grades for human approval.</p>
  </li>
  <li>
    <div class="meta">AI Agent · Communications</div>
    <h3 class="title">Customer Update Auto-Writer</h3>
    <p class="desc">Cuts incident turnaround time by translating technical fault summaries into customer-ready bulletins—on-brand, non-alarmist, and free of proprietary detail, utilizing a PII redaction gateway.</p>
  </li>
  <li>
    <div class="meta">AI Agent · Field Operations</div>
    <h3 class="title">Fault Diagnostics Copilot</h3>
    <p class="desc">Retrieves similar historical cases and OEM bulletins via RAG to classify the likely fault domain (software / hardware / wiring) and assign ownership on the first pass using an air-gapped on-prem model.</p>
  </li>
  <li>
    <div class="meta">Generative AI · Marketing</div>
    <h3 class="title">Brand-Controlled Visual Generation</h3>
    <p class="desc">A localized Stable Diffusion XL / ControlNet pipeline that enforces strict style-locking and automated brand-compliance checks, generating high-fidelity assets in seconds.</p>
  </li>
  <li>
    <div class="meta">AI Agent · Quality Assurance</div>
    <h3 class="title">Qualification Lifecycle Copilot</h3>
    <p class="desc">Generates hardware qualification plans with time estimates, tracks checklist completion live, and auto-packages test results and telemetry into audit-ready bundles with full requirement traceability.</p>
  </li>
  <li>
    <div class="meta">Analytics · Strategy</div>
    <h3 class="title">Leadership Briefing Generator</h3>
    <p class="desc">Produces weekly leadership pulses and meeting agendas from a single source of truth by reading commits, pull requests, and support threads through a redaction gateway before summarization.</p>
  </li>
  <li>
    <div class="meta">Data Science · Operations</div>
    <h3 class="title">Predictive Maintenance Forecaster</h3>
    <p class="desc">Uses fleet-wide operational telemetry to predict component wear and schedule maintenance proactively before a system goes unplanned-offline. Built on Scikit-learn and Prophet time-series models.</p>
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
    <div class="meta">2024 · Avion Full Flight Simulators</div>
    <h3 class="title"><a href="/files/ace-architecture-report.pdf">Avion Control Engine (ACE) Architecture Report</a></h3>
    <p class="desc">A massive production-grade Instructor Operating Station (IOS) and Telemetry Dashboard built to command A320 flight simulators. Powered by a SvelteKit frontend and Python/gRPC backend. <a href="/files/ace-architecture-report.pdf">Read the architectural deep-dive (PDF).</a></p>
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
