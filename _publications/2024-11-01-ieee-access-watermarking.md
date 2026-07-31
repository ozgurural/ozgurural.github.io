---
title: "Enhancing Security of Proof-of-Learning against Spoofing Attacks using Feature-Based Model Watermarking"
collection: publications
category: manuscripts
permalink: /publication/2024-ieee-access-watermarking
excerpt: "Feature-based model watermarking scheme that binds ownership proofs to internal activations, surviving fine-tuning and transfer attacks on Proof-of-Learning."
date: 2024-11-01
venue: "IEEE Access"
paperurl: "https://ieeexplore.ieee.org/abstract/document/10741282"
citation: "Ural, O. and Yoshigoe, K. (2024). Enhancing Security of Proof-of-Learning against Spoofing Attacks using Feature-Based Model Watermarking. IEEE Access. DOI: 10.1109/ACCESS.2024.3489776."
---

Proof-of-Learning lets a party prove they trained a model rather than downloaded it, by committing to the trajectory the optimizer actually took. The weakness is that the proof is a transcript, and a transcript can be forged: later work showed that an adversary can replicate the computational path of a legitimate model closely enough to pass verification.

## The idea

This paper attaches a second, independent condition to the proof. A watermark is embedded during training in the model's internal features, so a checkpoint has to be consistent with the recorded trajectory **and** carry the secret mark. The two conditions are checked together, which means defeating one is not enough. A forger who reconstructs a plausible training path still has to produce a model carrying a mark they were never in a position to embed.

## Why the mark goes in the features

Placing the signal in internal activations rather than in the output behaviour is what makes it survive ordinary handling. Fine-tuning and transfer, the operations a thief performs to make a stolen model look like their own, perturb the weights but do not erase a feature-level signal that was learned during training. Removing it means disturbing the representation the model depends on, which costs the accuracy that made the model worth stealing.

## Where it sits in the work

This is the first half of the argument completed in [SecurePoL](/publication/2025-secureproofoflearning) (IEEE Access 2025), which generalises it to three watermarking strategies and reports the measured cost of each, and in the [dissertation](/publication/2025-dissertation). The statistics of detecting a mark spread across many weights are animated in the [Model Heist explainer](/lab/model-heist/); the trajectory side is in the [Proof-of-Learning film](/lab/training-fingerprint/).
