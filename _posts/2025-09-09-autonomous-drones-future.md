---
title: "Autonomous Flight Systems: Engineering Mission-Critical Autonomy from Tactical UAVs to Verifiable AI"
date: 2025-09-09
permalink: /posts/2025/09/autonomous-drones-future/
categories: technical
tags:
  - drones
  - autonomy
  - defense
  - real-time
  - safety-critical
  - edge-ai
description: "Architectural lessons from engineering mission-control and ground-control software for Kargu and Togan UAVs: hard real-time constraints, deterministic safety envelopes, and the boundary between learned models and physical actuators."
---

Between February 2019 and November 2020, I served as an Expert Software Engineer at STM Defence Technologies in Ankara, Turkey. During this period, my team and I engineered the core mission-control and ground-control architectures for two landmark autonomous aerial systems: [**Kargu**](https://www.stm.com.tr/en/kargu-autonomous-tactical-multi-rotor-attack-uav), Turkey's first indigenous rotary-wing loitering munition platform and an internationally recognized autonomous tactical system, and [**Togan**](https://www.stm.com.tr/en/togan-multi-rotor-uas), an autonomous multi-rotor reconnaissance unmanned aircraft system (UAS).

Developing software for military-grade autonomous flight is fundamentally different from building conventional enterprise or cloud applications. In this domain, software operates under hard real-time, safety-critical constraints: a deadline overrun is not an inconvenient latency spike or a dropped frame; it is an immediate physical failure, loss of vehicle control, or catastrophic mission outcome.

Below are the architectural foundations, distributed systems patterns, and verification principles required when deploying autonomous intelligence into physical, high-consequence environments.

---

## The Reality of Hard Real-Time Mission Control

Mission control for autonomous unmanned aerial vehicles is where distributed systems, real-time signal processing, and deterministic control theory converge. The software stack must arbitrate between high-frequency onboard flight telemetry, noisy tactical datalinks, computerized vision payloads, and human operator commands.

To meet military reliability and safety standards, we architected the system around three core pillars:

### 1. Deterministic Communications and High-Throughput Telemetry
Tactical radios operate over contested, high-noise radio-frequency (RF) environments subject to intentional jamming, multipath interference, and abrupt bandwidth collapse.
- **Zero-Copy Serialization:** We designed custom binary telemetry pipelines implemented in modern C++ with Boost.Asio. Standard text-based formats (such as JSON or XML) were out of the question due to parsing overhead and payload bloat.
- **Bounded Latency Budgets:** Every telemetry packet, actuator heartbeat, and sensor frame was assigned a rigid temporal budget. Heartbeat packets operated on high-priority asynchronous queues to prevent bufferbloat from stalling critical flight-status frames behind lower-priority video feeds.
- **Fail-Safe Link-Loss Policies:** When datalinks severed, the onboard mission controller had to transition deterministically through pre-programmed contingency state machines (autonomous loiter, dynamic return-to-base, or controlled emergency descent) without requiring operator intervention.

### 2. Low-Latency Operator Consoles and Situational Awareness
A ground control station (GCS) is not merely a monitoring dashboard; it is the primary interface through which an operator retains legal, tactical, and ethical authority over an autonomous airframe.
- **Sub-16ms Frame Budgets:** Built using Qt and QML with high-performance C++ backends, the operator console was designed to process and render live telemetry overlays, moving maps, and spatial tracking vectors within strict 60 Hz frame budgets.
- **Cognitive Load Reduction:** In high-stress operations, cognitive overload causes human error. We engineered UI affordances that surfaced anomalies through deterministic visual hierarchies: sensor drift, motor temperature excursions, and battery cell imbalances were flagged before they escalated into aerodynamic instability.
- **Positive Operator Confirmation:** For loitering munitions such as Kargu, mission execution requires strict human-on-the-loop safeguards. The software enforced multi-step verification protocols that preserved human command authority over targeting decisions, ensuring that autonomous tracking algorithms could never commit kinetic action without explicit, authenticated operator confirmation.

### 3. Built-In Test (BIT) Architectures
In aerospace engineering, failure prevention begins before the propellers ever turn. We designed and implemented comprehensive Built-In Test harnesses across the entire avionics suite:
- **Power-On Built-In Tests (PBIT):** Executed upon cold boot to mathematically verify sensor calibration, IMU health, gimbal motor encoders, electronic speed controllers (ESCs), and cryptographic key integrity. If any sensor exhibited readings outside calibrated tolerances, the system locked the flight state machine, preventing arming.
- **Continuous Built-In Tests (CBIT):** Non-blocking, background diagnostics running concurrently with flight loops. CBIT routines continuously monitored battery internal resistance, GPS signal-to-noise ratios, thermal dissipation, and bus voltage stability. Any degradation immediately triggered progressive contingency states.

---

## Swarm Dynamics and Multi-Aircraft Coordination

Coordinating multiple autonomous airframes in tactical airspace introduces distributed consensus problems under asynchronous and unreliable communication:

1. **Decentralized Spatial Deconfliction:** When multiple aircraft share an operational volume, centralized path planning becomes a single point of failure and a major latency bottleneck. We explored decentralized geometric collision-avoidance models that allowed airframes to negotiate spatial separation trajectories over peer-to-peer radio meshes.
2. **Dynamic Task Allocation:** Allocating surveillance sectors or targets across a group of autonomous airframes requires conflict-free consensus. Under intermittent communication, distributed state synchronization must guarantee that two airframes do not simultaneously claim the same objective while leaving another sector unmonitored.
3. **RF Denial and State Prediction:** In contested electronic warfare environments where GPS and datalinks are jammed, autonomous aircraft must rely on relative visual navigation, dead reckoning, and collaborative state estimation. The flight stack must maintain relative formation geometry even when external positioning references are completely lost.

---

## The Core Rule: Learned Perception Inside a Deterministic Safety Envelope

Much of today's excitement surrounding artificial intelligence focuses on end-to-end deep learning. In autonomous aerospace and robotics, however, pure end-to-end neural network control is an unacceptable liability. Deep neural networks are statistical approximations: they are non-deterministic, opaque to formal verification, and fragile when subjected to out-of-distribution optical distortions, sensor noise, or adversarial attacks.

The engineering principle that governed our work at STM, and one that guides my machine-learning research today, is the **deterministic safety envelope**:

```
[ Unverified World ] 
         │
         ▼
┌─────────────────────────────────┐
│ Learned Perception & Inference  │  <-- Object detection, tracking, visual SLAM
└────────────────┬────────────────┘      (Statistical, unverified, probabilistic)
                 │
                 ▼ Proposed Trajectory / Target Coordinate
┌────────────────────────────────────────────────────────┐
│             Deterministic Safety Envelope              │  <-- Hard-coded C++ invariants
├────────────────────────────────────────────────────────┤
│ • Strict Geofence Enforcement (No-Fly Zones)           │
│ • Dynamic Kinematic Limits (Max Velocity / G-load)     │
│ • Line-of-Sight & Altitude Ground-Clearance Bounds      │
│ • Operator Positive Authentication Interlocks          │
│ • Failsafe Contingency State Machines (RTB / Disarm)   │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼ Certified Command
┌─────────────────────────────────┐
│  Flight Control Computer (FCC)  │  <-- Hard real-time control loops (PID / LQR)
└─────────────────────────────────┘
```

1. **Perception is statistical; control is deterministic.** Computer vision and edge-AI algorithms propose hypotheses (such as target coordinates, classification labels, or suggested search vectors).
2. **The safety layer has absolute veto power.** Before any proposal reaches the flight control computers or actuators, it must pass through hard-coded, mathematically proven safety interlocks. If an inference model suggests a trajectory that violates aerodynamic g-force limits, enters a prohibited geofenced polygon, or exceeds altitude floors, the deterministic safety layer intercepts and overrides the command in microseconds.
3. **Traceability and auditability.** Every inference output, safety check outcome, and operator intervention is logged with microsecond hardware timestamps into tamper-evident storage for post-flight debriefing and formal incident analysis.

This clean separation between probabilistic intelligence and deterministic enforcement is the single most important architectural pattern for anyone deploying AI into physical, safety-critical domains.

---

## Cross-Domain Spillover: From Tactical Defense to Enterprise AI

The engineering discipline required to deploy autonomous systems in defense is directly transferable to high-consequence enterprise and industrial applications:

- **High-Fidelity Flight Simulation:** At [Avion Full Flight Simulators](/posts/2026/05/avion-level-d-ffs/), I apply these exact principles to certified Level D full-flight simulators, architecting telemetry pipelines sustaining 50 GB/s of data throughput under bounded backpressure to guarantee deterministic fidelity for commercial airline pilot training.
- **Verifiable Machine Learning:** My doctoral dissertation at Embry-Riddle Aeronautical University ([SecurePoL](https://ieeexplore.ieee.org/document/11293969)) addresses the foundational security of machine learning: proving through model watermarking and cryptographic Proof-of-Learning protocols that models were trained honestly and have not been spoofed, poisoned, or backdoored.
- **Critical Infrastructure & Autonomous Logistics:** Commercial drone delivery, autonomous maritime inspection, and robotic manufacturing face identical verification hurdles. Organizations that attempt to deploy autonomous AI without rigorous formal safety envelopes and deterministic fallback architectures will inevitably encounter catastrophic field failures.

---

## Technical Advisory and Collaboration

Building autonomous systems that operate correctly when communications degrade, sensors drift, and adversaries intervene requires combining systems programming, real-time control architecture, and rigorous ML security.

If you are an engineering leader, executive, or research organization building mission-critical autonomous platforms, high-throughput simulation engines, or verifiable enterprise AI architectures, I welcome technical discussions, advisory engagements, and collaborative initiatives.

- **Email:** [drozgurural@gmail.com](mailto:drozgurural@gmail.com)
- **Academic Publications:** [Google Scholar](https://scholar.google.com/citations?user=lYx8fqsAAAAJ&hl=en&sortby=pubdate)
- **Projects & Architectures:** [Selected Projects](/projects/)

---

## References

[1] [STM Kargu: Autonomous Tactical Multi-Rotor Attack UAV](https://www.stm.com.tr/en/kargu-autonomous-tactical-multi-rotor-attack-uav)

[2] [STM Togan: Autonomous Multi-Rotor Reconnaissance UAS](https://www.stm.com.tr/en/togan-multi-rotor-uas)
