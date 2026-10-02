---
title: "SecurePoL: Integration of Watermarking With Proof-of-Learning to Enhance Security Against Spoofing Attacks"
seo_title: "SecurePoL: Watermarking Meets Proof-of-Learning"
collection: publications
category: manuscripts
permalink: /publication/2025-secureproofoflearning
excerpt: "Dual-layer framework coupling immutable Proof-of-Learning logs with three watermarking strategies, so verification succeeds only when both the training trajectory and the watermark are consistent."
date: 2025-12-10
venue: "IEEE Access"
paperurl: "https://ieeexplore.ieee.org/document/11293969"
authors:
  - "Dr. Ozgur Ural"
  - "Kenji Yoshigoe"
citation: "Ural, O. and Yoshigoe, K. (2025). SecurePoL: Integration of Watermarking With Proof-of-Learning to Enhance Security Against Spoofing Attacks. IEEE Access, vol. 13, pp. 213067-213091. DOI: 10.1109/ACCESS.2025.3642198."
bibkey: "ural2025securepol"
issn: "2169-3536"
publisher: "IEEE"
pub_type: "journal"
open_access: true
doi: "10.1109/ACCESS.2025.3642198"
volume: "13"
pages: "213067-213091"
date_exact: true
license: "https://creativecommons.org/licenses/by/4.0/"
code: "https://github.com/ozgurural/SecurePoL-with-Watermarking"
keywords: ["Proof-of-Learning", "model watermarking", "spoofing attacks", "model provenance", "training verification", "machine learning security"]
author_list:
  - { given: "Ozgur", family: "Ural", orcid: "0000-0003-1329-4303" }
  - { given: "Kenji", family: "Yoshigoe", orcid: "0000-0001-6040-4742" }
---

SecurePoL presents a dual-layer framework that couples immutable Proof-of-Learning logs with three watermarking strategies (feature-based triggers, sparse parameter perturbations, and a non-intrusive auxiliary head), ensuring verification succeeds only when both the training trajectory and watermark are consistent.

## The problem

Proof-of-Learning attests training effort but stays vulnerable to tolerance-based spoofing, while model watermarking protects ownership without saying anything about how a model was trained. Each mechanism has a blind spot the other covers.

## The design

Coupling them makes verification a joint condition, so an attacker has to satisfy trajectory consistency and watermark integrity at the same time instead of defeating each mechanism on its own. The paper uses three watermarking strategies rather than one: feature-based triggers, sparse parameter perturbations, and a non-intrusive auxiliary head.

## What it costs, measured

On CIFAR-10 with ResNet-20 the design raises the cost of blindfold Top-Q and infinitesimal-update attacks while preserving task utility:

- Baseline accuracy changes by **0.00, 0.03 and 0.58 percentage points** across the three strategies.
- Runtime overhead stays between **0.6% and 17.3%**.
- Proof logs remain **under 12 MB**.

Ownership verification is not free, but the price is small and stated rather than left implicit.

## Questions this paper answers

### What is Proof-of-Learning?

A record of the training run itself: periodic checkpoints of the weights, with the batch hashes and settings needed to replay the steps between them. A verifier replays logged steps and accepts when the result lands within a tolerance of the next checkpoint (Sections II-A and III-A of the paper).

### Why is Proof-of-Learning alone not enough?

Verification has to tolerate small discrepancies, and those tolerances can be exploited to forge, splice or partially synthesise a trajectory at far lower cost than retraining (Section II-A).

### What does SecurePoL add?

A watermark embedded while the logged training runs, and checked together with the trajectory. The verifier's watermark queries are private and are never stored in the public log, so someone who only fabricates or replays checkpoints is reduced to guessing: if one query passes by chance with probability at most *p*, all *m* pass with probability at most *p<sup>m</sup>* (Section III-B).

### What happens if someone removes the watermark?

Removal strong enough to erase the mark changes the weights, so the model no longer replays against its log. In the paper's check, five epochs of late fine-tuning without regenerating the log failed verification immediately (Sections II-C and VI-I).

### Where would it be used?

The paper describes three settings in which a model changes hands: a hospital registry confirming that a deployed model is the audited one, a vehicle maker replaying a supplier's training after an incident, and a cloud provider showing that a model was trained on licensed data (Section V-A).

### What are its limits?

The evaluation is on CIFAR-10 with ResNet-20. Naive checkpoint logging grows linearly with model size, about 4 TB for a billion-parameter run by the paper's own estimate, and verification depends on reproducing training deterministically across hardware (Section VII-B).

Read the [animated explainer](/lab/training-fingerprint/) in the Research Lab, or the [dissertation](/publication/2025-dissertation) this work belongs to.
