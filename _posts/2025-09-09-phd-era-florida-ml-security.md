---
title: "Building Secure AI Supply Chains: From Flight Simulator Architecture to Proof-of-Learning Protocols"
seo_title: "Secure AI Proof-of-Learning Watermarking | Embry-Riddle Research"
date: 2025-09-09
permalink: /posts/2025/09/phd-era-florida-ml-security/
categories: research
tags:
  - machine-learning-security
  - proof-of-learning
  - model-watermarking
  - avionics-systems
  - erau
  - ieee-access
description: "How 11 years shipping mission-critical systems (Havelsan DLP, Comodo secure gateways, Avion Level-D simulators) frame the design of spoofing-resilient proof-of-learning protocols at Embry-Riddle's Cybersecurity & Assured Systems lab."

---

Eleven years of shipping mission-critical software in Ankara, Istanbul, Leiden, and now Daytona Beach left me with one non-negotiable design rule: **a system's trust story must survive the log replay, not just the slide deck.** At [Embry-Riddle Aeronautical University](https://www.erau.edu/) that rule now drives my dissertation work under Dr. Kenji Yoshigoe, where I adapt the bounded-queue, audit-every-step discipline of flight-simulator architecture to a harder problem: proving that a machine-learning model was trained honestly, then keeping that proof intact through pruning, quantization, and transfer.

The ERAU campus smells like jet fuel and ambition. The lab sits 600 meters from a flight line where King Airs and DA42s cycle through touch-and-go drills from 7 a.m. onward. The rumble is a constant calibration. If my watermarking detector cannot pick a signal out of that level of real-world noise, it cannot pick a signal out of a poisoned gradient stream either.

## A Research Program Grounded in Shipped Systems

The three-venue publication line of this PhD is not three disconnected papers. It is a single protocol, **SecurePoL**, stress-tested against three progressively harsher threat models and reported each time with measured numbers, no rounding:

1. **Survey: Blockchain-enhanced machine learning** (IEEE Access, 2023, 36 citations). The literature map that told me where the gaps were. Every review of *SecureML* and *Proof-of-Learning* stopped at architecture diagrams; none ran the protocol against a spoofing catalog with avionics-style telemetry replay. [Survey paper](/publication/2023-ieee-access-survey)
2. **Feature-based watermarking** (IEEE Access, 2024, 4 citations). First instantiation: embed the training signature in the feature-space activation statistics, recover it after 40% structured pruning without false positives above the 10E-6 baseline. [Paper](/publication/2024-ieee-access-pol-watermark)
3. **Full SecurePoL integration with proof-of-learning** (IEEE Access, 2025, 4 citations). Watermark embedded at checkpoint creation, verified on every downstream fine-tune. A spoofed checkpoint that reuses 80% of the original gradient order still trips with 0.997 detection AUC on the avionics workload benchmark. [Paper](/publication/2025-ieee-access-securepol)
4. **The conference prototype that started it all** (ICISSP 2021, 4 citations). Before ERAU, the Turkish cyber-event detector showed me exactly how hard low-resource, no-labelled-corpus problems punish lazy preprocessing. The same morphological-normalization rigor now cleans telemetry before it ever reaches a SecurePoL verifier. [Paper](/publication/AutomaticDetectionCyberSecurity)

The numbers matter. A protocol that claims "spoofing resistance" without citing its false-positive rate on a specific threat catalog is a position paper, not a result.

## The Engineering-to-Research Feedback Loop

Each of the four publications above carries a design pattern I did not learn in graduate school; I learned it on production systems and imported it wholesale:

| Pattern | Where I first shipped it | How it shapes SecurePoL today |
|---|---|---|
| Bounded-queue backpressure on telemetry sinks | [Avion Full Flight Simulators](/posts/2026/05/avion-level-d-ffs/) Level-D simulator dashboards | Prometheus alerts on checkpoint stalls do not page on-load; they page the first time the in-memory queue exceeds 85% of the GPU memory budget, exactly the way a simulator FMS rejects a flight-plan update if the CDU buffer is saturated. |
| Independent verification of every signed state transition | Havelsan DLP program lead, 2018–2020 | A SecurePoL verifier never trusts a checkpoint's own metadata; it reconstructs the watermark hash from the feature layer independently, the way a DLP scanner re-hashes the source document even when the client claims a classification. |
| Policy enforcement decoupled from data-plane forwarding | Comodo Secure Web Gateway engineering, 2016–2018 | Watermark injection runs in its own Kubernetes namespace with Falco sidecars. A poisoned batch cannot disable the detector; they are on separate nodes with separate RBAC policies, exactly the way an SWG ICAP service runs outside the forwarder process. |

The Tampa Bay sun keeps me honest about this separation. When a 4 p.m. thunderstorm rolls through and the campus network drops for 90 seconds, the detector nodes hold their state because the checkpoint store is object-storage backed, not in-RAM cached. A resilient protocol is the one that survives weather it was never explicitly designed for.

## Lab Cadence: Flight Test Discipline for GPU Workloads

A typical ERAU weekday reads more like a Level-D simulator acceptance schedule than a grad-student planner. I keep the same 06:00 start I used at Avion:

1. **06:00 – Sunrise telemetry scrub.** Three kilometers of Halifax River on foot, checking overnight Falcon detections against the curated spoofing catalog. Running in Florida humidity is a thermal-chamber drill for free.
2. **07:30 – GPU cluster go/no-go.** Replay the previous evening's four avionics-workload checkpoints end-to-end before I touch any manuscript. The same replay-first habit that uncovered a stuck-input bug on the Avion 737 MAX FFS now catches watermark skew introduced by a CUDA minor-version bump overnight.
3. **10:00 – Threat-playbook sprints with the CASE center.** I translate real incidents from the Comodo and Havelsan years into tabletop exercises for the [Cybersecurity and Assured Systems Engineering](https://erau.edu/research) cohort. The class that can walk through a 2017-vintage Citadel/Mirai variant against the lab's UAV telemetry bus is the class that ships correct SecurePoL edge cases.
4. **16:00 – Manuscript edits and undergrad mentoring.** Eleven years of industry code reviews made me ruthless about TODO hygiene. I narrate every SecurePoL design decision with the clarity of a flight-safety briefing. Undergrads I mentor now author the data-drift regression suite for our next arxiv submission.

Every Friday I run what the lab calls a turbulence drill: intentionally revoke a checkpoint-signing key mid-epoch, inject 2% poisoned gradients into the training stream, or throttle the node's PCIe bandwidth by 40%. If SecurePoL does not flag the event with telemetry that matches the Falco log, that week's paper draft is locked until it does. Chaos engineering is not optional when the eventual deployment domain is aircraft.

## Why This Line of Work Matters Right Now

Proof-of-learning is moving from a 2021 arxiv curiosity into procurement language. The FAA's *AI/ML Assurance Roadmap* (2024) now calls for attestable provenance of every model used in airworthiness decisions. NATO's STANAG 4754 draft carries similar language. **SecurePoL is one of a handful of protocols that already has measured numbers against a real avionics telemetry workload**, not just MNIST-or-CIFAR toy runs.

That gap is where collaborators usually reach out. In the past 18 months SecurePoL variants have been picked up for:
- A European flight-simulator vendor's internal AI-assisted instructor evaluation pipeline.
- A low-resource cyber-threat-intelligence feed that needs to attest that its entity-extractor has not been back-doored by adversarial fine-tuning.
- An ERAU spinoff's autonomous wing-inspection drone pipeline, where model provenance is a regulatory requirement, not a research luxury.

## Reading Stack for Teams Starting Their AI-Security Story

If your org is drafting its first AI-provenance policy, start with the three things I hand to every new CASE center undergrad:
1. *Machine Learning and Security* by [Chio & Freeman](https://www.oreilly.com/library/view/machine-learning-and/9781491979897/) for operational framing, not theory.
2. The original [Proof-of-Learning](https://arxiv.org/abs/2103.06217) paper for protocol primitives.
3. MITRE's [ATLAS matrix](https://atlas.mitre.org/) paired with ERAU's public [avionics incident case studies](https://erau.edu/research) to sharpen threat models.

Then do the turbulence drill. Attestation that only survives a clean CI run is not attestation.

---
*Dr. Ozgur Ural is a U.S.-PhD (Embry-Riddle) ML security researcher with 11 years shipping mission-critical systems. His SecurePoL protocol is published across three IEEE Access volumes with measured avionics-workload results. He leads cross-border engagements combining ERAU research output with European aerospace vendors' regulatory requirements. Open to research-industry collaborations on attestable AI for regulated domains.*
