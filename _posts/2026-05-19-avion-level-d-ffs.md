---
title: "The FAA-Certified Lie: Building Simulators for the AI Era"
date: 2026-05-19
permalink: /posts/2026/05/avion-level-d-ffs/
redirect_from:
  - /posts/2025/09/avion-level-d-ffs/
description: "A Level D flight simulator is a federally certified lie. I have been at Avion since 2023 making the lie better. Now the same machinery is becoming the training ground for the AI that will replace the pilots."
excerpt: "A Level D flight simulator is a federally certified lie. I have been at Avion since 2023 making it better. Now the same machinery is becoming the training ground for the AI that will replace the pilots."
categories: technical
tags:
  - aviation
  - simulation
  - engineering
  - ai
---

A Level D flight simulator is a federally certified lie.

Bolted to the ground. Costs tens of millions of dollars. Designed to fool airline pilots through engine failures that never happen, fog-blind landings that never happen, hydraulic system collapses that never happen. After two hours inside, a pilot can earn the legal right to fly an A320 that they have never actually flown. The FAA signs off in writing.

I have been at [Avion](https://www.aviongroup.aero) since 2023, building these. The strange part is what comes next. The same machinery built to fool human pilots is becoming the training ground for the AI that will eventually replace them.

## What "Level D" Actually Means

Regulators certify four tiers of flight simulators. Level A is essentially a video game. Level D is the top. To earn that letter, the device has to do four impossible things at once:

1. Match the real aircraft's controls so closely that a panicked pilot yanking the yoke past the stops feels exactly the resistance they would feel in the real cockpit.
2. Project a wraparound view of the world that is real enough, and fast enough, that the pilot's inner ear and inner skeptic both stay quiet.
3. Pass more than a hundred certification tests covering normal flight, engine failure at takeoff, dual-engine failure, and whatever new low-visibility approach the regulator invented at this morning's meeting.
4. Behave so consistently that pilots cannot reverse-engineer the trick by watching their own instruments.

Pass, and an airline certifies entire crews on a new aircraft without burning a kilogram of jet fuel. Fail, and a twenty-million-dollar device sits on a warehouse floor while everyone in the room looks at the ceiling.

## How We Actually Build the Lie

Three things, relentlessly.

**The data plumbing.** A Level D simulator generates roughly 50 gigabytes of sensor data every second. That data has to be captured, archived, and streamed to the instructor's station without missing a beat. If the data path stutters, the simulator stutters, and a training session worth thousands of dollars goes in the trash.

**The flight model.** Inside the box, a digital copy of the aircraft's physics runs, accurate enough to fool a test pilot with thousands of hours in the real machine. We iterate this model nightly, comparing it against certification data, and either it matches the real aircraft, or it does not ship. There is no version of "we will patch it in the field." The field is a flight deck.

**The instructor's chair.** The instructor needs a control panel that lets them break the simulator in interesting ways: fail an engine here, drop hydraulics there, blind the windscreen with fog at the exact moment the pilot is committed to land. They need to scrub time backward and forward, like watching a Netflix episode of *How Not to Land an Airplane*. The most useful object in the building is the rewind button. Pilots learn more from thirty seconds of replay than from thirty minutes of lecture.

The whiteboards are never empty. The coffee is always warmer than the hydraulic oil.

## The Hyperreal Sky: Simulators as AI Proving Grounds

Aviation regulators—bless their conservative hearts—believe the current paradigm will last forever. The FAA and EASA operate on a timeline where a decade is considered a "rapid transition." They see AI as a neat trick for predictive maintenance or, perhaps, a fancy biometric dashboard for the instructor. 

This is a spectacular miscalculation. 

There is a philosophical concept that a perfect simulation eventually becomes indistinguishable from reality itself. In Level D aerospace engineering, this isn't abstract theory; it's a technical specification. For a Reinforcement Learning agent, there is absolutely zero mathematical difference between a 50 GB/s data stream from a real Airbus A320 and a perfectly modeled digital twin. The simulation *is* the reality.

The aerospace industry thinks it is building better training tools for humans. What we are actually building is the world's most expensive, perfectly physically-grounded training environment for the autonomous systems that will eventually replace them. 

Three realities are quietly rewriting the sector:

**1. The End of Scripted Failures.** Yesterday, an instructor pressed a button to simulate a thunderstorm. Today, telemetry from a fleet's actual encounters with severe weather is piped directly into the simulator. We are moving from scripted scenarios to a continuous, automated ingestion of global edge cases. The AI eats the fleet's collective turbulence for breakfast.

**2. The Biometric Baseline.** We are capturing every micro-correction a human pilot makes when an engine flames out. We map their eye movements against the instrument scan. We record the exact moment human panic introduces a 300-millisecond lag in rudder response. The AI doesn't just learn how to fly the plane; it learns all the specific mathematical boundaries of human failure. 

**3. The Determinism Trap.** Regulators will naturally fight the AI transition. They will demand mathematical proofs of determinism that Deep Learning inherently resists. They will drown the first autonomous flight applications in paperwork, terrified of a black-box model controlling a 70-ton aircraft. But eventually, the math will become undeniable. When a neural network can land a crippled airliner in a crosswind 10,000 times in a row without breaking a digital sweat, the regulatory red tape will suddenly look less like a safety net and more like an archaic liability.

## What I Tell Anyone Building This Stuff

If you build systems where heavy machinery, complex architecture, and regulatory bureaucracy collide, here are four rules that survive the pressure test:

1. **Treat every sensor as guilty until proven innocent.** Redundancy from day one. If your data pipeline stutters, your AI trains on garbage, and your twenty-million-dollar simulator becomes a very expensive space heater.
2. **Automate the boring certification math.** Regulators love repeatability. If you hand them a perfectly formatted 500-page automated test report, they rarely ask how the sausage is made.
3. **Build instructor tools like mission control, not consumer apps.** Fast feedback beats flashy interfaces. The most important feature is still the rewind button.
4. **Understand what you are actually compiling.** We tell the FAA we are building a training device to make better pilots. In reality, we are compiling the exact datasets required to train their autonomous replacements. The runway for autonomous aviation isn't being paved with concrete; it is being compiled on our servers, right under the regulator's nose. 

Until that handover finishes, I will keep the whiteboard ready and the coffee warm.

---

**References**

1. [Avion Group](https://www.aviongroup.aero), where I have been building Level D simulators since 2023
2. [FAA Notice 8900.491: Simulator Qualification Guidance](https://www.faa.gov/documentLibrary/media/Notice/N8900_491.pdf)
3. [ICAO Doc 9625: Manual of Criteria for the Qualification of Flight Simulation Training Devices](https://store.icao.int/en/manual-of-criteria-for-the-qualification-of-flight-simulation-training-devices-doc-9625)
4. [Airbus](https://www.airbus.com), the aircraft manufacturer whose machines we are certified to imitate
