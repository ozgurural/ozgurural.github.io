---
permalink: /projects/
title: "Projects"
description: "AI and ML projects by Dr. Ozgur Ural spanning model provenance, verifiable inference, autonomous agents, safety-critical systems, and human-verified clinical tools."

---

<p class="ep-lead">Every project selected here has a concrete AI or ML role: securing model provenance, verifying inference, coordinating agents, training autonomous systems, or measuring whether an AI-enabled system remains safe in production. Historical platforms appear only when they provide the data, control, validation, or human-oversight boundary that the AI depends on. Each project links to its repository or writeup; the <a href="/lab/"><strong>Interactive Lab</strong></a> has eleven playable explanations of the underlying mechanisms.</p>

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">2026 · Enterprise AI · Avion</div>
    <h3 class="title"><a href="/enterprise-ai-architecture.html">Avion AI Strategy &amp; Agent Platform</a></h3>
    <p class="desc">Authored Avion's enterprise AI strategy and built the platform that presents it. A three-tier architecture (air-gapped on-prem LLMs, a governed cloud-LLM API tier, and edge) plus a suite of retrieval-augmented and autonomous agents: an engineering-knowledge copilot with grounded citations and change-impact analysis, an autonomous repository agent, an RFP accelerator, and a training-debrief writer. Built end to end with Flask, SQLite, Docker, and GitLab CI/CD. <a href="/enterprise-ai-architecture.html"><strong>Explore the interactive reference architecture &rarr;</strong></a></p>
  </li>
  <li>
    <div class="meta">Interactive · 11 experiments</div>
    <h3 class="title"><a href="/lab/">Research Lab: interactive experiments</a></h3>
    <p class="desc">Eleven animated experiments connect AI and ML to model provenance, optimization, verifiable inference, autonomous-agent coordination, and safety infrastructure. Consensus and fault tolerance appear where they govern what an AI system may trust or do. Each experiment ties its mechanism to a cited source, a measured result, or a clearly labelled open research direction.</p>
  </li>
</ul>

## Research

<ul class="ep-cards ep-cards--two">
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
    <p class="desc">Detection of cyber-security events from Turkish Twitter and newspaper streams, completed at Middle East Technical University (METU) under <a href="https://acarturk.net/">Prof. Cengiz Acartürk</a>. This research served as the foundation for my published ICISSP paper, co-authored with him.</p>
  </li>
</ul>

## Applied AI Concepts & Architectures

<p class="ep-lead">A collection of brainstormed enterprise AI architectures and proof-of-concept system designs. These models explore how discipline-specific AI agents, grounded in approved corporate data, can use local on-prem inference for data sovereignty alongside secure APIs for de-identified reasoning.</p>

<ul class="ep-cards ep-cards--two">
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Engineering</div>
        <h3 class="title">Engineering Knowledge Copilot</h3>
      </summary>
      <p class="desc">A version-aware copilot over a massive engineering corpus. Answers questions with grounded citations, synthesizes the impact of document and spec changes across downstream artifacts, and generates suggested playbooks. Powered by on-prem multimodal parsing and semantic diffs.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · CI/CD Integration</div>
        <h3 class="title">Autonomous Engineering Staff Agent</h3>
      </summary>
      <p class="desc">A hybrid agent embedded in the software development lifecycle. Conducts autonomous code reviews, verifies release integrity against requirements, and flags integration risks before deployment using self-hosted Git pipelines.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Proposals</div>
        <h3 class="title">RFP Accelerator</h3>
      </summary>
      <p class="desc">An agent that ingests Request for Proposal (RFP) documents, searches past answers, product specs, and OEM manuals, and drafts a clear, cited reply. Reduces RFP cycle-time significantly without data exfiltration.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Education</div>
        <h3 class="title">Instructor Debrief Writer</h3>
      </summary>
      <p class="desc">Enhances training session logs by stripping student identifiers, drafting a polished on-tone debrief from telemetry and instructor bullet notes, and suggesting rubric grades for human approval.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Communications</div>
        <h3 class="title">Customer Update Auto-Writer</h3>
      </summary>
      <p class="desc">Cuts incident turnaround time by translating technical fault summaries into customer-ready bulletins that are on-brand, non-alarmist, and free of proprietary detail, utilizing a PII redaction gateway.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Field Operations</div>
        <h3 class="title">Fault Diagnostics Copilot</h3>
      </summary>
      <p class="desc">Retrieves similar historical cases and OEM bulletins via RAG to classify the likely fault domain (software / hardware / wiring) and assign ownership on the first pass using an air-gapped on-prem model.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">Generative AI · Marketing</div>
        <h3 class="title">Brand-Controlled Visual Generation</h3>
      </summary>
      <p class="desc">A localized Stable Diffusion XL / ControlNet pipeline that enforces strict style-locking and automated brand-compliance checks, generating high-fidelity assets in seconds.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Quality Assurance</div>
        <h3 class="title">Qualification Lifecycle Copilot</h3>
      </summary>
      <p class="desc">Generates hardware qualification plans with time estimates, tracks checklist completion live, and auto-packages test results and telemetry into audit-ready bundles with full requirement traceability.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Leadership</div>
        <h3 class="title">Leadership Briefing Generator</h3>
      </summary>
      <p class="desc">Produces weekly leadership pulses and meeting agendas from a single source of truth by reading commits, pull requests, and support threads through a redaction gateway before summarization.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">ML Forecasting · Operations</div>
        <h3 class="title">Predictive Maintenance Forecaster</h3>
      </summary>
      <p class="desc">Uses fleet-wide operational telemetry to predict component wear and schedule maintenance proactively before a system goes unplanned-offline. Built on Scikit-learn and Prophet time-series models.</p>
    </details>
  </li>
</ul>

## AI Systems Foundations (Industry)

<p class="ep-lead">These systems are not relabelled as AI deliveries after the fact. They are included because they define the operating boundary an AI component needs: deterministic simulation, synchronized telemetry, human authority, fault containment, and evidence for validation. No employer design or customer detail is disclosed.</p>

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">AI Training &amp; Validation · 2023– · Avion</div>
    <h3 class="title"><a href="/posts/2026/05/avion-level-d-ffs/">Level D simulators as AI proving grounds</a></h3>
    <p class="desc">I architect real-time platforms and cloud infrastructure for certified full-flight simulators. Their AI role is concrete: a deterministic digital twin can generate controlled failure data, train reinforcement-learning policies, and test autonomous behaviour against repeatable scenarios before any model reaches an aircraft. This is the AI direction described in the linked field note, not a claim that Avion's certified product is an autonomous aircraft.</p>
  </li>
  <li>
    <div class="meta">AI Observability · 2024 · Avion</div>
    <h3 class="title"><a href="/files/ace-architecture-report.pdf">ACE telemetry as an AI validation substrate</a></h3>
    <p class="desc">The Avion Control Engine combines an Instructor Operating Station with synchronized simulator telemetry through a SvelteKit frontend and Python/gRPC backend. Its AI value is the observability layer: time-aligned state, interventions, and outcomes are the evidence needed to evaluate learned policies, detect anomalous behaviour, and support predictive-maintenance models. <a href="/files/ace-architecture-report.pdf">Read the architecture report (PDF).</a></p>
  </li>
  <li>
    <div class="meta">AI Security &amp; Data Governance · 2020–2021 · Havelsan</div>
    <h3 class="title">DLP foundations for secure enterprise AI</h3>
    <p class="desc">I led the 14-engineer team that delivered Havelsan's data-leakage-prevention product for defence and government clients. The delivered product was DLP, not a generative-AI system. Its current AI role is the policy and inspection boundary needed to stop sensitive corporate data from entering prompts, retrieval indexes, model-training sets, or unauthorized agent actions.</p>
  </li>
  <li>
    <div class="meta">Autonomous Systems · 2019–2020 · STM</div>
    <h3 class="title"><a href="/posts/2025/09/autonomous-drones-future/">Mission control for autonomous UAVs</a></h3>
    <p class="desc">I developed hard-real-time mission-control and ground-control software for Kargu and Togan UAVs. The AI focus is the safety boundary around onboard autonomy: reliable telemetry, operator authority, mission constraints, and deterministic fallback when perception or planning is uncertain. The linked field note separates the systems I built from later directions such as edge inference, collaborative SLAM, and multi-aircraft autonomy.</p>
  </li>
  <li>
    <div class="meta">AI-Assisted Cybersecurity · 2014–2019 · Comodo</div>
    <h3 class="title">Secure Web Gateway, Patch Manager, and Dragon for AI-assisted defence</h3>
    <p class="desc">I led design and architecture for Comodo's Secure Web Gateway, enterprise Patch Manager, and Chromium-based Dragon browser. These products predate today's generative-AI stack, but expose the enforcement and telemetry surfaces an AI security layer needs: web requests, endpoint inventory, vulnerability state, and browser signals. AI can classify and prioritize findings; deterministic controls still enforce the policy.</p>
  </li>
</ul>

## Human-Verified Clinical AI Tooling

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">Human-in-the-Loop AI · Python · PyQt5</div>
    <h3 class="title"><a href="/blog/pyqt5_image_measurer">EKG measurement and annotation interface</a></h3>
    <p class="desc">I built and field-tested a calibrated image-measurement utility with cardiology professionals. The released tool is manual, not a diagnostic model. Its AI role is to capture clinician-verified intervals and landmarks as training or evaluation labels, while its deterministic measurements provide a baseline for checking computer-vision suggestions. The linked writeup defines a human-confirmed AI extension without claiming it has already been delivered.</p>
  </li>
</ul>
