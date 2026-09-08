---
categories: technical
permalink: /blog/securepol-with-watermarking
title: "SecurePoL with Watermarking"
date: 2024-01-18
description: "Official code & experiments for my PhD dissertation: 'Enhancing Security of Proof-of-Learning Against Spoofing Attacks Using Advanced Model Watermarking.'"

---

Official code and experiments for my PhD dissertation, [Enhancing
Proof-of-Learning Security Against Spoofing Attacks Using Model
Watermarking](/publication/2025-dissertation).

Proof-of-Learning asks a model owner to prove they trained a model rather than
downloaded it, by keeping the trajectory the training took. The attack it has to
survive is spoofing: reconstructing a plausible trajectory backwards from a
stolen set of final weights. The dissertation's answer is a second lock, a
watermark woven into the model itself, so that a verifier accepts only when the
training path checks out *and* the mark is present. A forger can copy the curve;
they cannot copy a mark they never trained in.

The repository is a set of Jupyter notebooks covering the three watermarking
strategies the work compares and the spoofing experiments they are tested
against. The published versions are the [IEEE Access
paper](/publication/2024-ieee-access-watermarking) and
[SecurePoL](/publication/2025-secureproofoflearning), and the
[watermarking lab film](/lab/watermarking-comparison/) walks through why each
strategy falls to a different attacker.

[View on GitHub](https://github.com/ozgurural/SecurePoL-with-Watermarking)
