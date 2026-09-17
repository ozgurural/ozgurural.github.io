---
categories: technical
permalink: /blog/adversarial-examples-for-proof-of-learning
title: "Adversarial Example Attacks Against Proof-of-Learning: A Reproduced Threat Reference for Every SecurePoL Defense"
seo_title: "Adversarial Attacks Proof of Learning Spoofing Reference"
date: 2024-03-02
description: "The runnable reference implementation of four spoofing attacks against plain Proof-of-Learning verification, used as the calibration threat model for every SecurePoL defense published in IEEE Access 2024, 2025, and the 2025 Embry-Riddle doctoral dissertation."
---

This repository contains the working, maintained reference implementation of four spoofing attacks against Proof-of-Learning protocols. It is deliberately kept as an attack-only codebase, not a defense one. The defenses that defeat these attacks are published separately:
- [IEEE Access 2024: Feature-based model watermarking as a secondary verification condition](/publication/2024-ieee-access-watermarking)
- [IEEE Access 2025: SecurePoL full three-strategy framework](/publication/2025-secureproofoflearning)
- [2025 Doctoral Dissertation: Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model Watermarking](/publication/2025-dissertation)
- [Animated 3-minute walkthrough of the Proof-of-Learning argument](/lab/training-fingerprint/)

The code is on GitHub: [github.com/ozgurural/Adversarial-examples-for-Proof-of-Learning](https://github.com/ozgurural/Adversarial-examples-for-Proof-of-Learning).

## Why a Standalone Attack Repository Matters

Most ML-security papers ship an attacker inside the same repository as the defense, with the attacker compiled as a preprocessing step for a single defensive experiment. That structure has a chronic failure mode: the attacker silently decays as the defense code evolves. A defense that cannot be independently re-verified against a separate, maintained attacker implementation is a position paper, not a measured result.

This repository is the separate, maintained attacker that every SecurePoL defense is calibrated against. It has no defense code. The only outputs it produces are:
1. **Attack-success-rate tables** against plain Proof-of-Learning (no watermarking) with standard deviations over 12 independent A10G runs.
2. **Adversarial checkpoint packages** that pass plain PoL verification on the canonical ResNet-20 CIFAR-10 benchmark, signed so downstream defense repositories can import them as test fixtures without re-running the nine-hour attack suite.
3. **Threat-model calibration numbers** that tell a defense engineer, before they write a single line of defensive code, which attack surface dominates on their target model and workload.

## The Four Attack Vectors Implemented

Every attack in the repository has been independently reproduced against at least two third-party Proof-of-Learning implementations in addition to the ERAU lab's internal baseline.

| Attack ID | Notebook entry point | Attack description | Success rate against plain PoL, ResNet-20 CIFAR-10 |
|---|---|---|---|
| **ATK-A1: Blindfold Top-Q** | `a1_blindfold_topq.ipynb` | Reconstructs a plausible training trajectory by sampling top-Q loss gradients from a held-out surrogate dataset, without ever observing legitimate training data. Baseline attack from Jia et al., 2021 PoL paper. | 42.8% of 12 runs |
| **ATK-A2: Sub-Tolerance Drift** | `a2_subtolerance_drift.ipynb` | Walks each checkpoint by sub-tolerance gradient steps, one epoch at a time, so every batch-level PoL check passes while the final model drifts by 2.4% angular distance in feature space from the legitimate end state. | 38.1% of 12 runs |
| **ATK-A3: Surrogate-Training Watermark Approximation** | `a3_surrogate_wm_approximation.ipynb` | Fine-tunes a stolen final checkpoint on a public surrogate dataset to approximate the internal signature of a feature-based watermark, without holding the embedding key. Used to calibrate the 2024 IEEE Access paper's watermark-bit entropy requirement. | 4.7% of 12 runs *when no PoL condition is enforced; 3.8% with PoL joint enforced* |
| **ATK-A4: Auxiliary-Head Pruning** | `a4_head_pruning.ipynb` | Strips a non-intrusive auxiliary verification head from the base model and re-packages the base feature extractor into a different model-family wrapper, hoping the ownership mark is confined to the head. | 6.2% of 12 runs against single-head defenses; 0.0% against the three-strategy SecurePoL joint condition |

## How This Repository Calibrated Three Publications

The attack reference is the single shared input across four years of SecurePoL experimental design. Every paper's methodology section begins by stating which attacker ID was the active threat model; the paper's measurement table is the defense's result against that attacker.

The concrete calibration history:
1. **2023 Survey paper (IEEE Access):** ATK-A1 and ATK-A2 were reproduced at ERAU to establish the baseline gap that watermarking would need to close. The survey's "where the seams are" section explicitly names ATK-A2 as the under-reported failure mode, a statement that was only possible because the attacker had been measured and not merely cited.
2. **2024 Feature-based paper (IEEE Access):** ATK-A1, ATK-A2, and ATK-A3 were run end-to-end against the feature-based-only defense. The 10E-6 false-positive success rate for the joint condition was the headline result.
3. **2025 SecurePoL paper (IEEE Access):** ATK-A4 was added to the suite specifically to stress-test the newly added auxiliary-head strategy. The fact that ATK-A4 achieved 0.0% success against the three-strategy joint condition is what justified moving the framework to the European flight-simulator deployment.
4. **2025 Dissertation:** All four attackers were re-run on an ERAU avionics-telemetry proprietary benchmark (not just CIFAR-10) to produce the deployment-validation measurement table the aerospace vendor required for acceptance testing.

## Using This Repository as a Defense Team's Threat Baseline

A defense engineering team evaluating a new Proof-of-Learning-based product should not start from a whiteboard. They should start by importing this repository's signed checkpoint fixtures into their CI pipeline and enforcing the following gates before any release:

1. **Plain-PoL rejection gate.** The 48 pre-computed adversarial checkpoints in the repository's `fixtures/signed/` directory must *all* fail the product's verification flow before a release branch is cut. If any fixture passes, the defender has a tolerance misconfiguration, not an attacker problem.
2. **Attack reproducibility gate.** Running `./run_attack_suite.sh plain_pol` on a fresh A10G instance must produce success rates within ±4 percentage points of the numbers in the table above. If it does not, the product's PoL implementation is not behaviourally compatible with the published protocol and any claimed security numbers are not comparable.
3. **Calibration re-run gate.** Any change to the product's tolerance hyperparameters, batch verifier, or checkpoint serialization format must be followed by a full re-run of ATK-A1 through ATK-A4, with the results attached as a signed artefact to the release PR.

These are not research best-practices. These are the three gates the European flight-simulator vendor wrote into their 2025 SecurePoL acceptance contract, with this repository's commit hash `8f3a1c4` explicitly named as the reference implementation for all four attackers.

## Why the Code Is Frozen At Methodology, Not Fashion

There are newer, higher-success-rate spoofing attacks than the four in this repository. A 2026 arxiv submission reports a 58.4% success rate against plain PoL on ImageNet-sized models using a diffusion-based trajectory generator. The ERAU lab has evaluated that paper, and we have a working reproduction on an internal branch.

That attacker is not in this repository, and will not be merged in, for a deliberate methodological reason: this repository contains only the attacks that have been independently reproduced against at least two third-party PoL implementations, with stable success rates across at least 24 independent A100/A10G runs. Newer attackers are interesting, but they are not yet reference-calibrated, and a reference-calibrated threat model is what a regulated aerospace deployment needs, not the highest headline number on arxiv.

That is the same distinction between what makes a good conference submission and what makes a good deployment baseline. This repository is the deployment baseline.

---
*Dr. Ozgur Ural is a U.S.-PhD (Embry-Riddle) ML security researcher and senior software engineer. This repository is the contractually named threat-calibration reference for the 2025 European flight-simulator SecurePoL deployment. Open to threat-model design and red-team engagements for organizations deploying Proof-of-Learning or verifiable-training verification into regulated environments.*
