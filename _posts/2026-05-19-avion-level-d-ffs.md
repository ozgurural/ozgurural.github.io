---
title: "Flight Simulation and the Evaluation of Learning Systems"
seo_title: "Flight Simulation and Learning Systems"
date: 2026-05-19
permalink: /posts/2026/05/avion-level-d-ffs/
redirect_from:
  - /posts/2025/09/avion-level-d-ffs/
description: "General engineering considerations for evaluating learning systems in simulation, with a proposed research direction and its evidence limits."
excerpt: "General engineering considerations for evaluating learning systems in simulation."
categories: technical
tags:
  - aviation
  - simulation
  - engineering
  - ai
header:
  og_image: "lab-og/og-jira.png"
---

Since October 2023, I have worked as a Senior Software Engineer at Avion Full Flight Simulators. My work includes software for monitoring, configuring, and diagnosing simulator components.

This article discusses general engineering considerations and a research question. It does not disclose employer designs, customer information, budgets, or security specifics.

## What makes simulation useful for engineering

A simulator gives engineers a controlled environment in which to exercise scenarios, observe system behaviour, and investigate failures. Timing, state consistency, and diagnostic information all affect the usefulness of that environment.

For a team evaluating a learned component, the questions extend beyond whether it performs well in one demonstration. Which scenarios were tested? Which assumptions does the simulation make? How would the team detect a failure that the model did not encounter during training?

## A possible research direction

I am interested in how simulation could support the evaluation of learning systems. A proposed study could vary operating conditions, record the model's responses, and examine where performance changes. It would need to distinguish repeatable behaviour within the simulation from evidence about behaviour outside it.

**Open research direction of the author, not yet published.** This article reports no SecurePoL integration into a flight simulator, pilot-scoring deployment, or measured result from such a system.

My published [Proof-of-Learning research](/publication/2025-dissertation) and my engineering role are distinct work. Any future application connecting them would need its own methods, evidence, and review.
