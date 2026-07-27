---
title: "SecurePoL: Integration of Watermarking With Proof-of-Learning to Enhance Security Against Spoofing Attacks"
collection: publications
category: manuscripts
permalink: /publication/2025-secureproofoflearning
excerpt: "Dual-layer framework coupling immutable Proof-of-Learning logs with three watermarking strategies, so verification succeeds only when both the training trajectory and the watermark are consistent."
date: 2025-12-10
venue: "IEEE Access"
paperurl: "https://ieeexplore.ieee.org/document/11293969"
citation: "Ural, O. and Yoshigoe, K. (2025). SecurePoL: Integration of Watermarking With Proof-of-Learning to Enhance Security Against Spoofing Attacks. IEEE Access, vol. 13, pp. 213067-213091. DOI: 10.1109/ACCESS.2025.3642198."
---

SecurePoL presents a dual-layer framework that couples immutable Proof-of-Learning logs with three watermarking strategies (feature-based triggers, sparse parameter perturbations, and a non-intrusive auxiliary head), ensuring verification succeeds only when both the training trajectory and watermark are consistent.

Proof-of-Learning attests training effort but stays vulnerable to tolerance-based spoofing, while watermarking protects ownership without saying anything about how a model was trained. Coupling them makes verification a joint condition, so an attacker has to satisfy trajectory consistency and watermark integrity at the same time instead of defeating each mechanism on its own.

**Measured on CIFAR-10 with ResNet-20:** the design raises the cost of blindfold Top-Q and infinitesimal-update attacks while preserving task utility. Accuracy changes by 0.00, 0.03 and 0.58 percentage points across the three strategies, runtime overhead stays between 0.6% and 17.3%, and proof logs remain under 12 MB.

Read the [animated explainer](/lab/training-fingerprint/) in the Research Lab, or the [dissertation](/publication/2025-dissertation) this work belongs to.
