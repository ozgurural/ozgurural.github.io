---
title: "Mission-Control Engineering and Autonomous Systems"
date: 2025-09-09
permalink: /posts/2025/09/autonomous-drones-future/
categories: technical
tags:
  - drones
  - autonomy
  - defense
  - ai
  - edge-ai
description: "Lessons and research questions from mission-control software work, with clear boundaries between engineering experience and future autonomy research."

header:
  og_image: "lab-og/og-det.png"
---

From February 2019 to November 2020, I worked as an Expert Software Engineer at STM Defence Technologies on mission-control and ground-control systems for Kargu and Togan. My work included C++ components using Boost and Qt under real-time constraints.

## The engineering boundary around autonomy

Mission-control software connects operators, telemetry, and vehicle commands. Clear state, predictable timing, and diagnosable failures matter because the operator must understand what the system is doing and what actions remain available.

These concerns also shape how I think about adding learned components to an autonomous system. A model's prediction needs an explicit interface, defined limits, and tests for the conditions in which it may fail. A useful design question is what the surrounding system should do when the model is uncertain or unavailable.

## Research questions

For civilian applications such as inspection and environmental monitoring, I am interested in how teams can evaluate models under communication loss, changing conditions, and limited onboard computing resources. Coordination between vehicles adds questions about stale information and conflicting decisions.

These are general engineering considerations and research interests. This post describes my role without disclosing employer designs, customer details, or operational performance figures.

I now work on flight-simulation platforms at Avion. I completed my Ph.D. in Electrical Engineering and Computer Science at Embry-Riddle Aeronautical University in the United States in 2025. My [dissertation](/publication/2025-dissertation) concerns Proof-of-Learning security and model watermarking.

## Public product references

- [STM Kargu](https://www.stm.com.tr/en/kargu-autonomous-tactical-multi-rotor-attack-uav)
- [STM Togan](https://www.stm.com.tr/en/togan-multi-rotor-uas)
