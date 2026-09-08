---
permalink: /projects/
title: "Projects"
description: "AI and ML projects by Dr. Ozgur Ural spanning model provenance, verifiable inference, autonomous agents, safety-critical systems, and human-verified clinical tools."
---

<p class="ep-lead">Research, prototypes, and engineering foundations for AI systems. Published work and delivered software are distinguished from proposed AI extensions. Historical projects remain part of the record, with their relevance to AI explained below. Explore the linked papers and field notes, or visit the <a href="/lab/"><strong>Interactive Lab</strong></a> for eleven films about the underlying mechanisms.</p>

## Featured

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">2026 · Enterprise AI · Avion</div>
    <h3 class="title"><a href="/enterprise-ai-architecture.html">Avion AI Strategy &amp; Agent Platform</a></h3>
    <p class="desc">Authored Avion's enterprise AI strategy and built the platform that presents it. The reference architecture separates on-premises inference, governed cloud APIs, and edge workloads. It covers engineering knowledge retrieval, repository assistance, proposals, and training debriefs. The interactive view describes the design; it is not evidence that every proposed agent is deployed. <a href="/enterprise-ai-architecture.html"><strong>Explore the interactive reference architecture &rarr;</strong></a></p>
  </li>
  <li>
    <div class="meta">Interactive · 11 films</div>
    <h3 class="title"><a href="/lab/">Research Lab: interactive experiments</a></h3>
    <p class="desc">Eleven interactive films cover distributed consensus, model watermarking, proof-of-learning, fault tolerance, and gradient descent. Each pairs a visual explanation with technical notes and references. Films run approximately two to four minutes; use the chapter controls to revisit a mechanism.</p>
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

<p class="ep-lead">Proposed workflows and proof-of-concept designs, not a catalogue of production deployments. They explore AI assistance over approved corporate data, with human review and explicit data-handling boundaries. Benefits such as time savings, accuracy, and security require evaluation before deployment.</p>

<ul class="ep-cards ep-cards--two">
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Engineering</div>
        <h3 class="title">Engineering Knowledge Copilot</h3>
      </summary>
      <p class="desc">A version-aware retrieval copilot over engineering documents. The proposed workflow returns source citations, highlights potentially affected specifications, and drafts playbooks for an engineer to verify. Evaluation must check retrieval quality, version correctness, and access boundaries.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · CI/CD Integration</div>
        <h3 class="title">Autonomous Engineering Staff Agent</h3>
      </summary>
      <p class="desc">A repository assistant that proposes code-review findings, maps changes to requirements, and runs checks in self-hosted pipelines. Release approval remains with the engineering team; passing automated checks does not establish that a release is safe.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Proposals</div>
        <h3 class="title">RFP Accelerator</h3>
      </summary>
      <p class="desc">A proposed assistant that searches approved past answers, product specifications, and manuals to draft cited replies to Requests for Proposal. Subject-matter experts verify each answer and approve what may leave the organisation.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Education</div>
        <h3 class="title">Instructor Debrief Writer</h3>
      </summary>
      <p class="desc">A proposed workflow that removes student identifiers and drafts a debrief from telemetry and instructor notes. Instructors check the evidence, correct the narrative, and retain responsibility for assessment and grading.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Communications</div>
        <h3 class="title">Customer Update Auto-Writer</h3>
      </summary>
      <p class="desc">Drafts customer updates from approved fault summaries. A proposed redaction step flags personal and proprietary information, followed by human review for accuracy, disclosure, and tone before sending.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Field Operations</div>
        <h3 class="title">Fault Diagnostics Copilot</h3>
      </summary>
      <p class="desc">Retrieves similar historical cases and approved technical bulletins to suggest possible fault domains and next checks. The proposed on-premises assistant supports an engineer's investigation; it does not autonomously clear equipment for service.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">Generative AI · Marketing</div>
        <h3 class="title">Brand-Controlled Visual Generation</h3>
      </summary>
      <p class="desc">A proposed local image-generation pipeline using style references and conditioning controls. Generated drafts would require brand, rights, and factual review before publication; latency and output quality depend on the model and hardware.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Quality Assurance</div>
        <h3 class="title">Qualification Lifecycle Copilot</h3>
      </summary>
      <p class="desc">A proposed assistant for drafting qualification plans and linking requirements to test evidence. Engineers approve the plan and verify traceability; generated summaries are not substitutes for qualification results or certification decisions.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">AI Agent · Leadership</div>
        <h3 class="title">Leadership Briefing Generator</h3>
      </summary>
      <p class="desc">A proposed briefing workflow over approved commits, pull requests, and support records. Summaries link back to their sources and separate reported facts from open questions for the meeting owner to review.</p>
    </details>
  </li>
  <li>
    <details class="ep-concept">
      <summary>
        <div class="meta">ML Forecasting · Operations</div>
        <h3 class="title">Predictive Maintenance Forecaster</h3>
      </summary>
      <p class="desc">A candidate ML workflow for estimating component wear from operational telemetry. Feasibility depends on reliable failure labels, held-out evaluation, and comparison with existing maintenance rules. Scheduling decisions remain with maintenance staff.</p>
    </details>
  </li>
</ul>

## AI Systems Foundations (Industry)

<p class="ep-lead">These systems are not relabelled as AI deliveries after the fact. They are included because they define the operating boundary an AI component needs: deterministic simulation, synchronized telemetry, human authority, fault containment, and evidence for validation. No employer design or customer detail is disclosed.</p>

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">AI Training &amp; Validation · 2023– · Avion</div>
    <h3 class="title"><a href="/posts/2026/05/avion-level-d-ffs/">Level D simulators as AI proving grounds</a></h3>
    <p class="desc">I architect real-time platforms and cloud infrastructure for certified full-flight simulators. These systems can support AI research through repeatable scenarios, controlled fault injection, and synchronised telemetry. Policy training and autonomous-system evaluation are potential extensions, not claims of delivered or certified AI functionality. The linked field note describes the simulation engineering.</p>
  </li>
  <li>
    <div class="meta">AI Observability · 2024 · Avion</div>
    <h3 class="title"><a href="/files/ace-architecture-report.pdf">ACE telemetry as an AI validation substrate</a></h3>
    <p class="desc">The Avion Control Engine combines an Instructor Operating Station with synchronized simulator telemetry through a SvelteKit frontend and Python/gRPC backend. Its AI value is the observability layer: time-aligned state, interventions, and outcomes are the evidence needed to evaluate learned policies, detect anomalous behaviour, and support predictive-maintenance models. <a href="/files/ace-architecture-report.pdf">Read the architecture report (PDF).</a></p>
  </li>
  <li>
    <div class="meta">AI Security &amp; Data Governance · 2020–2021 · Havelsan</div>
    <h3 class="title">DLP foundations for secure enterprise AI</h3>
    <p class="desc">I led the 14-engineer team that delivered Havelsan's data-leakage-prevention product for defence and government clients. The delivered product is DLP, not a generative-AI system. The relevant AI extension is applying policy enforcement and content inspection to prompts, retrieval indexes, training data, and agent actions; this is not a claim about the historical product's AI integrations.</p>
  </li>
  <li>
    <div class="meta">Autonomous Systems · 2019–2020 · STM</div>
    <h3 class="title"><a href="/posts/2025/09/autonomous-drones-future/">Mission control for autonomous UAVs</a></h3>
    <p class="desc">I developed hard-real-time mission-control and ground-control software for Kargu and Togan UAVs. The AI focus is the safety boundary around onboard autonomy: reliable telemetry, operator authority, mission constraints, and deterministic fallback when perception or planning is uncertain. The linked field note separates the systems I built from later directions such as edge inference, collaborative SLAM, and multi-aircraft autonomy.</p>
  </li>
  <li>
    <div class="meta">AI-Assisted Cybersecurity · 2014–2019 · Comodo</div>
    <h3 class="title">Secure Web Gateway, Patch Manager, and Dragon for AI-assisted defence</h3>
    <p class="desc">I led design and architecture for Comodo's Secure Web Gateway, enterprise Patch Manager, and Chromium-based Dragon browser. These products predate today's generative-AI stack, but expose the enforcement and telemetry surfaces an AI security layer needs: web requests, endpoint inventory, vulnerability state, and browser signals. AI can classify and prioritise findings; deterministic controls still enforce the policy.</p>
  </li>
</ul>

## Human-Verified Clinical AI Tooling

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">Human-in-the-Loop AI · Python · PyQt5</div>
    <h3 class="title"><a href="/blog/pyqt5_image_measurer">EKG measurement and annotation interface</a></h3>
    <p class="desc">I built and field-tested a calibrated image-measurement utility with cardiology professionals. The released tool is manual, not a diagnostic model. A proposed AI extension would capture clinician-verified intervals and landmarks as evaluation labels and compare computer-vision suggestions with manual measurements. The linked writeup separates that proposal from the released software.</p>
  </li>
</ul>
