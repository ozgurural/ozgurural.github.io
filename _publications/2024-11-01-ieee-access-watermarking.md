---
title: "Enhancing Security of Proof-of-Learning Against Spoofing Attacks Using Feature-Based Model Watermarking"
seo_title: "Feature-Based Watermarking for Proof-of-Learning"
collection: publications
category: manuscripts
permalink: /publication/2024-ieee-access-watermarking
excerpt: "Feature-based model watermarking couples an ownership check to a Proof-of-Learning training record to study defences against spoofing."
date: 2024-11-01
venue: "IEEE Access"
paperurl: "https://ieeexplore.ieee.org/abstract/document/10741282"
authors:
  - "Dr. Ozgur Ural"
  - "Kenji Yoshigoe"
citation: "Ural, O. and Yoshigoe, K. (2024). Enhancing Security of Proof-of-Learning Against Spoofing Attacks Using Feature-Based Model Watermarking. IEEE Access, vol. 12, pp. 169567-169591. DOI: 10.1109/ACCESS.2024.3489776."
bibkey: "ural2024featurewatermark"
issn: "2169-3536"
publisher: "IEEE"
pub_type: "journal"
open_access: true
doi: "10.1109/ACCESS.2024.3489776"
volume: "12"
pages: "169567-169591"
license: "https://creativecommons.org/licenses/by-nc-nd/4.0/"
keywords: ["Proof-of-Learning", "feature-based watermarking", "spoofing attacks", "model ownership", "machine learning security"]
author_list:
  - { given: "Ozgur", family: "Ural", orcid: "0000-0003-1329-4303" }
  - { given: "Kenji", family: "Yoshigoe", orcid: "0000-0001-6040-4742" }
---

Proof-of-Learning lets a party prove they trained a model rather than downloaded it, by committing to the trajectory the optimizer actually took. The weakness is that the proof is a transcript, and a transcript can be forged: later work showed that an adversary can replicate the computational path of a legitimate model closely enough to pass verification.

## The idea

This paper attaches a second condition to the proof. A watermark is embedded during training in the model's internal features, so a checkpoint has to be consistent with the recorded trajectory **and** carry the secret mark. The two conditions are checked together, which means defeating one is not enough. A forger who reconstructs a plausible training path still has to produce a model carrying a mark they were never in a position to embed.

## Why the mark goes in the features

The paper studies embedding a watermark into model features or parameters during training and checking it alongside the training record. Robustness depends on the embedding and the attack. Fine-tuning, pruning and other edits need evaluation under an explicit threat model; a watermark check alone does not establish a universal lower bound on the accuracy cost of removal.

## Where it sits in the work

This is the first half of the argument completed in [SecurePoL](/publication/2025-secureproofoflearning) (IEEE Access 2025), which generalises it to three watermarking strategies and reports the measured cost of each, and in the [dissertation](/publication/2025-dissertation). The statistics of detecting a mark spread across many weights are animated in the [Model Heist explainer](/lab/model-heist/); the trajectory side is in the [Proof-of-Learning film](/lab/training-fingerprint/).
