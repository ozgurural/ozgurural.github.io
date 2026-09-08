---
title: "Flight Simulators Are Becoming the AI Proving Ground"
date: 2026-05-19
permalink: /posts/2026/05/avion-level-d-ffs/
redirect_from:
  - /posts/2025/09/avion-level-d-ffs/
description: "What if flight simulators are the AI proving ground nobody is talking about? Three years inside Avion."
excerpt: "What if flight simulators are the AI proving ground nobody is talking about? Three years inside Avion."
categories: technical
tags:
  - aviation
  - simulation
  - engineering
  - ai
---

A Level D full-flight simulator is a qualified training device, not a literal digital twin.

It is a large computational and physical architecture. Its engineering purpose is to reproduce specified aircraft behaviour closely enough for the applicable qualification criteria. It can recreate engine failures, low-visibility landings, and hydraulic system collapses. Approved training may support credit for defined tasks under the applicable authority; it does not make the simulator the aircraft or certify every possible flight condition.

I have been at [Avion](https://www.aviongroup.aero) since 2023 building these systems. But looking at the sheer volume of data flowing through these pipelines, a compelling question emerges: Could the same deterministic machinery built to train human pilots be used as the ultimate training ground for Reinforcement Learning models? And more provocatively, is someone already doing it?

## The Architecture of High-Fidelity Simulation

Regulators certify four tiers of flight simulators. Level A is essentially a consumer application. Level D is the absolute top. To earn that certification, the architecture has to solve several complex problems simultaneously in real time.

It must match the real aircraft controls closely enough for the applicable qualification criteria. It must project a wraparound physical environment with the timing and visual performance required for training. It must behave consistently across the tests and tolerances defined by the qualification programme.

Pass the qualification, and an airline can train crews without burning jet fuel. Fail, and an expensive device may sit idle while the engineering team diagnoses the gap.

## Building the Deterministic Pipeline

Delivering this level of fidelity requires three relentless architectural pillars.

**The Data Plumbing.** A Level D simulator does not just render graphics. It calculates many aerodynamic, hydraulic, and avionics variables in real time, generating large streams of internal state and sensor data. This data has to be captured, synchronized, and streamed within tight timing budgets. If the architecture stutters, the physics and training experience can be affected. That makes the pipeline an interesting candidate for studying the infrastructure needed to reduce, rather than eliminate, the Sim-to-Real gap in autonomous AI training.

**The Flight Model.** Inside the hardware runs a computational model of the aircraft's behaviour, validated against qualification data and expert review. Teams compare changes with the applicable reference data and investigate deviations before release. The model is an approximation with defined tolerances, not a claim of perfect physical identity.

**The Instructor Station.** The instructor needs a control panel that lets them stress the system in highly specific ways. They need to fail an engine here, drop hydraulics there, or blind the windscreen with fog exactly when the pilot commits to land. They also need to scrub time backward and forward, like watching a Netflix episode of *How Not to Land an Airplane*. The most useful object in the building is the rewind button. Pilots learn more from thirty seconds of replay than from thirty minutes of lecture.

The whiteboards are never empty. The coffee is always warmer than the hydraulic oil.

## Are Simulators the Secret AI Proving Grounds?

Aviation regulators operate on extended timelines where a decade is considered a rapid transition. They currently view AI as a predictive maintenance tool or a biometric dashboard. This view might be completely underestimating the underlying data architecture.

For a Reinforcement Learning agent, a high-fidelity simulator can reduce some differences between training data and the real aircraft. It does not make the simulation indistinguishable from ground truth, so validation and transfer checks remain essential.

While the commercial aerospace industry focuses entirely on building human training tools, we have to ask if we are inadvertently laying the exact hardware and software foundations required for autonomous systems. Look at the architecture, and ask yourself if these three realities are already quietly rewriting the sector's future:

**1. The End of Scripted Failures.** Yesterday, an instructor pressed a button to simulate a thunderstorm. Today, we have the pipeline capability to route telemetry from actual fleet encounters directly into the simulator. As we move from scripted scenarios to the automated ingestion of global edge cases, what stops future AI models from training on the collective turbulence of an entire fleet?

**2. The Biometric Baseline.** Because we must capture every micro-correction a human pilot makes, we are building a historic dataset. We map eye movements and record the exact moment human panic introduces a critical lag in rudder response. Are we just debriefing humans, or are we compiling the deterministic data needed to map all the specific mathematical boundaries of human failure for an AI?

**3. The Determinism Trap.** Regulators will naturally demand evidence of repeatable behaviour that Deep Learning does not provide automatically. The first autonomous flight applications will face demanding assurance work. A large simulated success count would still be evidence to evaluate, not a guarantee of safe deployment. If a neural network can land a crippled airliner in a crosswind 10,000 times in a row within a carefully specified simulation, regulators would still need to examine the model, the simulator, the coverage, and the transfer assumptions.

## The Obvious Objection

"Regulators will never let an unverified AI fly passengers." That objection is correct today. Future use would still require evidence, oversight, and an accepted certification path. Three things are converging.

**One.** Aviation regulators are already drafting AI-specific certification frameworks. EASA's AI Roadmap and the FAA's emerging machine-learning safety guidance are funded work products, not whiteboard sessions.

**Two.** Cargo has often preceded passenger operations in aviation. An autonomous cargo aircraft could become an operational test bed for later passenger applications, but the timetable is uncertain.

**Three.** The simulator can serve as both a training and a verification environment, but it is not the only evidence needed to audit an AI system. Regulators would need confidence in the simulator, the model, the test coverage, and the operational controls.

## The Reality Check

If you think this is purely theoretical, look at what is already flying. Xwing has flown autonomous Cessna 208 Caravans on FAA Part 135 cargo routes with safety pilots in the seat, an autonomy stack partially trained against high-fidelity flight simulators. Reliable Robotics is walking the same regulatory path with the same airframe. Wisk Aero, the Boeing-backed autonomous eVTOL program, runs thousands of simulated approaches against the same physics models its real aircraft will fly. DARPA's CODE and ALIAS programs have been plugging reinforcement learning into flight-physics engines for years.

Here is a hypothesis, not a forecast: an autonomous cargo aircraft trained partly in a qualified simulator may eventually be certified for routine commercial operations. Reaching that point would require more than a mature data pipeline, including operational evidence and a regulator-accepted safety case.

Regulatory approval is one major obstacle, but it is not the only one. The data pipeline is an enabling component, not a completed certification case.

---

**References**

1. [Avion Group](https://www.aviongroup.aero), where I have been building Level D simulators since 2023
2. [EASA Flight Simulation Training Devices](https://www.easa.europa.eu/en/domains/aircrew-and-medical/flight-simulation-training-devices-fstd)
3. [FAA National Simulator Program](https://www.faa.gov/about/initiatives/nsp)
4. [ICAO Doc 9625 Manual of Criteria for the Qualification of Flight Simulation Training Devices](https://store.icao.int/)
5. [Airbus](https://www.airbus.com), the aircraft manufacturer whose machines we are certified to imitate
