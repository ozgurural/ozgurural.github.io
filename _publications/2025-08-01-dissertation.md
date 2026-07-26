---
title: "Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model Watermarking"
collection: publications
category: theses
permalink: /publication/2025-dissertation
excerpt: "Doctoral research developing SecurePoL, a dual-layer framework coupling Proof-of-Learning trajectory logs with three orthogonal watermarking strategies."
date: 2025-08-01
venue: "Doctoral Dissertation"
paperurl: "https://commons.erau.edu/edt/905/"
citation: "Ural, O. (2025). Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model Watermarking. Doctoral dissertation, Embry-Riddle Aeronautical University."
---

Doctoral dissertation, Ph.D. in Electrical Engineering and Computer Science, Embry-Riddle Aeronautical University (Daytona Beach, Florida). Advisor: Dr. Kenji Yoshigoe.

Proof-of-Learning verifies the computational effort behind a trained model, but on its own it can be spoofed by attacks that manipulate its subset-verification pathways and tolerance parameters. The dissertation first shows how an adversary can replicate the computational trajectory of a legitimate model and, under surrogate-training conditions, even approximate an embedded watermark.

The proposed framework, **SecurePoL**, closes that gap by coupling PoL's training logs with three orthogonal watermarking strategies: feature-based embedding, parameter perturbation, and non-intrusive auxiliary heads. Verification then becomes a joint condition, so a forger has to reproduce both an authentic training log and a watermark-consistent ownership signal, rather than either one alone.

**Measured on CIFAR-10 with ResNet-20:**

- The computational effort required for successful blindfold Top-Q and infinitesimal-update attacks rises by **more than an order of magnitude**.
- Ownership verification costs almost no utility: baseline accuracy changes by +0.00 pp with feature-based watermarking, 0.03 pp with non-intrusive heads, and 0.58 pp with parameter perturbation.

[Read the full dissertation](https://commons.erau.edu/edt/905/) in ERAU Scholarly Commons. The watermarking-plus-PoL construction is also published as [SecurePoL](/publication/2025-secureproofoflearning) in *IEEE Access* (2025), and there is an [animated explainer](/lab/training-fingerprint/) in the Research Lab.
