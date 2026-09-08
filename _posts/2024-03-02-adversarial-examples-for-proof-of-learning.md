---
categories: technical
permalink: /blog/adversarial-examples-for-proof-of-learning
title: "Adversarial Examples for Proof of Learning"
date: 2024-03-02
description: "Code for paper 'Adversary examples' for Proof of Learning"

---

An implementation of the spoofing attack that Proof-of-Learning has to survive,
kept as a working reference rather than as a result.

The premise is short. Proof-of-Learning verifies that a model was trained by
replaying part of the recorded trajectory, so an attacker who holds only the
final weights has to manufacture a path that could plausibly have produced them.
Adversarial-example techniques are one way to try, and having the attack in
runnable form is what makes a defence testable rather than asserted.

My own work on the defence side is published: [Enhancing Security of
Proof-of-Learning against Spoofing Attacks using Feature-Based Model
Watermarking](/publication/2024-ieee-access-watermarking) and
[SecurePoL](/publication/2025-secureproofoflearning), with the dissertation at
[Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model
Watermarking](/publication/2025-dissertation). The
[Proof-of-Learning lab film](/lab/training-fingerprint/) is the three-minute
version of the argument.

[View on GitHub](https://github.com/ozgurural/Adversarial-examples-for-Proof-of-Learning)
