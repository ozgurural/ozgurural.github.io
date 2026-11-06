---
permalink: /projects/
title: "Projects"
description: "Research code, industry systems and applied AI work by Dr. Ozgur Ural: model provenance, real-time flight simulation, UAV mission control, enterprise AI architecture."
---

<p class="ep-lead">What I have built, in research and in industry, and what it is evidence of. Each card says plainly whether it is published research, delivered software or a proposal. For the mechanisms behind the research, the <a href="/lab/"><strong>Research Lab</strong></a> has twelve short films.</p>

## Research

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">Ph.D. · ML security · Code</div>
    <h3 class="title"><a href="/blog/securepol-with-watermarking">SecurePoL with Watermarking</a></h3>
    <p class="desc">The reference implementation behind my dissertation and the SecurePoL paper: proof-of-learning verification that also checks a feature-based model watermark, so a forged training record fails.</p>
  </li>
  <li>
    <div class="meta">Adversarial ML · Code</div>
    <h3 class="title"><a href="/blog/adversarial-examples-for-proof-of-learning">Adversarial Examples for Proof-of-Learning</a></h3>
    <p class="desc">Attacks that try to pass proof-of-learning verification without doing the training. Breaking the protocol first is what shaped the defences in the SecurePoL line of work.</p>
  </li>
  <li>
    <div class="meta">2026 · Research film · Open direction</div>
    <h3 class="title"><a href="/lab/level-d-60hz/">Inside a Level D flight simulator</a></h3>
    <p class="desc">How a certified simulator earns a pilot's trust, and what a learned model would have to keep to run inside its real-time loop. Every rule is cited from the regulation text; the thesis is my own and not yet published.</p>
  </li>
  <li>
    <div class="meta">M.Sc. · NLP for security</div>
    <h3 class="title"><a href="/blog/ms-thesis">Cyber-security events from Turkish text streams</a></h3>
    <p class="desc">My METU master's thesis under <a href="https://acarturk.net/">Prof. Cengiz Acartürk</a>: detecting rare security events in Turkish Twitter and newspaper data, the basis of our ICISSP 2021 paper.</p>
  </li>
</ul>

## Industry

<p class="ep-lead">The Avion cards describe my role, the architecture and the engineering practice. They disclose no customer, budget or security specifics of the company.</p>

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">2026 · Avion · Enterprise AI</div>
    <h3 class="title"><a href="/enterprise-ai-architecture.html">AI strategy and reference architecture</a></h3>
    <p class="desc">I wrote Avion's AI adoption roadmap and a reference architecture that separates on-premises inference, governed cloud APIs and edge workloads, and built the portal that presents it. The interactive view shows the design, including agents that are proposed rather than deployed.</p>
  </li>
  <li>
    <div class="meta">2026 · Avion · Applied AI</div>
    <h3 class="title">Engineering knowledge assistant</h3>
    <p class="desc">A proof of concept offered to staff: it answers from the company's engineering documents and shows where each answer came from. Every reported problem is replayed against each new build. A prototype agent foundation adds tools and a record of actions; verifiable oversight of those actions is the open R&amp;D question, in a project I prepared and got approved under WBSO, the Dutch government's R&amp;D tax-credit programme.</p>
  </li>
  <li>
    <div class="meta">2023– · Avion · Real-time systems</div>
    <h3 class="title"><a href="/posts/2026/05/avion-level-d-ffs/">Software for Level D full-flight simulators</a></h3>
    <p class="desc">Real-time simulator software in C, C++ and Scala, and a telemetry pipeline built on batching and bounded-queue backpressure, for simulators certified at the highest grade. The field note covers what such a platform offers for evaluating learning systems.</p>
  </li>
  <li>
    <div class="meta">2024– · Avion · Full-stack platform</div>
    <h3 class="title">Avion Cloud Environment</h3>
    <p class="desc">Principal developer (about 70% of commits) of the platform that configures, monitors and diagnoses simulator bus systems: SvelteKit and TypeScript client, Python gRPC backend, Redis and PostgreSQL, with Scala on the side sending the data. It holds time-aligned state of the kind any learned component would have to be evaluated against. Its development was also approved as R&amp;D under WBSO.</p>
  </li>
  <li>
    <div class="meta">2025– · Avion · Delivered software</div>
    <h3 class="title">Avion Debriefing System</h3>
    <p class="desc">Records a full-flight-simulator training session (displays, cockpit camera, instructor station, audio), then packages, encrypts and transfers it for replay. C# on .NET 8 with PowerShell tooling and an MSI installer, installed and verified on a simulator, with user and acceptance-test manuals.</p>
  </li>
  <li>
    <div class="meta">2026 · Avion · Tooling</div>
    <h3 class="title">NavDB Sync</h3>
    <p class="desc">Version control for simulator navigation databases. Operators keep their custom data through 28-day AIRAC updates, and merges run on the server, so a conflict never reaches an instructor at the simulator. Python and GitLab CI/CD.</p>
  </li>
  <li>
    <div class="meta">2019–2020 · STM · Hard real-time</div>
    <h3 class="title"><a href="/posts/2025/09/autonomous-drones-future/">Mission control for autonomous UAVs</a></h3>
    <p class="desc">Mission-control and ground-control software for the <a href="https://www.stm.com.tr/en/kargu-autonomous-tactical-multi-rotor-attack-uav">Kargu</a> and <a href="https://www.stm.com.tr/en/togan-multi-rotor-uas">Togan</a> UAVs in C++ with Boost and Qt, including power-on and continuous built-in tests, under hard-real-time, safety-critical constraints.</p>
  </li>
  <li>
    <div class="meta">2020–2021 · Havelsan · Security</div>
    <h3 class="title">Havelsan DLP</h3>
    <p class="desc">Team lead for <a href="https://www.havelsan.com.tr/en/sectors/cyber-security/cyber-security/products/havelsan-dlp">Havelsan's data-leakage-prevention product</a> for defence and government clients, and developer of its endpoint agent in C, C++, Java and Go. The same policy-enforcement problem now applies to prompts, retrieval indexes and agent actions.</p>
  </li>
  <li>
    <div class="meta">2014–2019 · Comodo · Security</div>
    <h3 class="title">Secure Web Gateway, Patch Manager and Dragon</h3>
    <p class="desc">Windows services and applications in C++ for Comodo's <a href="https://cdome.comodo.com/">Dome Secure Web Gateway</a>, enterprise <a href="https://www.itarian.com/patch-management.php">Patch Manager</a> and Chromium-based <a href="https://www.comodo.com/home/browsers-toolbars/browser.php">Dragon browser</a>; I also set up the team's unit testing, code review and Jenkins CI.</p>
  </li>
</ul>

## Proposed applied-AI workflows

<p class="ep-lead">Designs from the Avion AI strategy, written as proposals rather than deployments. Each keeps a person accountable for the outcome and works only over approved company data; each would need evaluation before use.</p>

<ul class="ep-concepts">
  <li><strong>Change-impact analysis.</strong> Extends the engineering knowledge assistant above with version-aware retrieval and the specifications a change may affect.</li>
  <li><strong>Repository agent.</strong> Proposes review findings and maps changes to requirements in self-hosted pipelines; release approval stays with the team.</li>
  <li><strong>RFP accelerator.</strong> Drafts cited answers from approved past responses and product documentation, for experts to verify.</li>
  <li><strong>Instructor debrief writer.</strong> Drafts a training debrief from telemetry and instructor notes, with student identifiers removed; the instructor owns the assessment.</li>
  <li><strong>Fault diagnostics copilot.</strong> Retrieves similar past cases and bulletins to suggest where to look next; it never clears equipment for service.</li>
  <li><strong>Qualification lifecycle copilot.</strong> Links requirements to test evidence when drafting qualification plans; it is not a substitute for qualification results.</li>
  <li><strong>Predictive maintenance forecaster.</strong> Estimates component wear from telemetry, if reliable failure labels exist and it beats the current maintenance rules on held-out data.</li>
</ul>

## Other

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">Python · PyQt5 · With clinicians</div>
    <h3 class="title"><a href="/blog/pyqt5_image_measurer">EKG measurement and annotation tool</a></h3>
    <p class="desc">A calibrated image-measurement utility built and tested with cardiology professionals. It is a manual tool, not a diagnostic model; measurements of this kind are what a computer-vision model would be checked against.</p>
  </li>
</ul>
