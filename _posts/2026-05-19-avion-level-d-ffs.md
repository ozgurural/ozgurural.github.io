---
title: "The FAA-Certified Lie: Building Simulators for the AI Era"
date: 2026-05-19
permalink: /posts/2026/05/avion-level-d-ffs/
redirect_from:
  - /posts/2025/09/avion-level-d-ffs/
description: "A Level D flight simulator is a federally certified lie. I spent two years at Avion making the lie better. Now the same machinery is training the AI that will replace the pilots."
excerpt: "A Level D flight simulator is a federally certified lie. I spent two years at Avion making it better. Now the same machinery is training the AI that will replace the pilots."
categories: technical
tags:
  - aviation
  - simulation
  - engineering
  - ai
  - telemetry
---

A Level D flight simulator is a federally certified lie.

Bolted to the ground. Costs tens of millions. Designed to fool airline pilots through engine failures that never happen, low-visibility approaches that never happen, dual-hydraulic losses that never happen. Pilots walk out type-rated on aircraft they never actually flew. The FAA signs off in writing.

I spent two years at [Avion](https://www.aviongroup.aero) (2023 to 2025) making this lie better. The strange part is what comes next: the same machinery built to fool human pilots is now the training ground for the AI that will replace them.

## What "Level D" Actually Demands

Level D is the top tier of simulator certification. To earn that letter, you have to do four things simultaneously:

1. Match every control force to tight tolerances, even when a panicked pilot yanks the yoke past the stops.
2. Render 180 plus degrees of visuals at sub-20 millisecond latency, so the pilot's inner ear and inner skeptic both stay quiet.
3. Pass 100 plus certification test points covering normal flight, V1 cuts, dual-engine failures, and whatever low-visibility approach the regulator invented in this morning's meeting.
4. Match instrument behavior so perfectly that pilots cannot reverse-engineer the trick by watching their own gauges.

Think of it as a PhD dissertation where the advisor is the FAA and your classmates are Airbus and Boeing. Pass, and an airline type-rates entire crews without burning a kilogram of Jet-A. Fail, and the device gets grounded the same week the salesperson promised delivery.

## Building a Digital Twin That Blinks

We treated each simulator as a living digital twin. My team did three things relentlessly:

**Telemetry pipeline.** Ingested about 50 GB per second of sensor data. Cached the hot path in Redis. Persisted the durable record in PostgreSQL. Streamed instructor-station updates over gRPC and HTTP. The pipeline never blinked, even when an instructor was simulating an electrical bus failure that, in theory, should have taken the pipeline with it.

**Flight model kernels.** Iterated physics in C++ and Scala. Validated against aircraft certification data. Wrapped each release in deterministic test harnesses so the nightly build either met Level D fidelity or did not ship. No "we will patch it in the field." The field is a flight deck.

**Instructor experience.** Built Svelte dashboards that let instructors script cascading failures, watch pilot biometrics, and scrub time like a Netflix episode of *How Not to Land an Airplane*. The most useful UI element in the building was the scrub-time slider. Pilots learn more from a 30 second rewind than from a 30 minute lecture.

Each release rode hardware-in-the-loop rigs with real pilots on headset, and regulators dropping by with edge cases none of us had thought of. The whiteboards were never empty. The coffee was always warmer than the hydraulic oil.

## The Bend Toward AI

Three things are reshaping the room at once.

**Live fleet telemetry into training.** Yesterday's turbulence over the Atlantic becomes tomorrow's training challenge. Real aircraft data flows back into the sim, so scenarios stop being scripted and start being lived. The instructor is not inventing a thunderstorm anymore. They are replaying the one your fleet actually flew through last Thursday.

**Adaptive scenario generation.** Reinforcement-learning agents read pilot biometrics, heart rate, gaze fixation, control-input entropy, and dial scenario difficulty in real time. The sim stops being a script the instructor plays back and starts being an opponent the pilot has to outthink. Done badly, it is a video-game boss. Done well, it is the most honest assessment instrument aviation has ever had.

**Debrief by math, not memory.** "I think you flared a hair late" becomes a precise reconstruction. Angle of attack, sink rate, column displacement against the ideal trajectory, all overlaid on the actual landing. Pilots argue less with a graph than with a person. The instructor's job shifts from "what happened" to "what to do about it."

The deeper bend is second-order. The same digital twin substrate becomes the training ground for the autonomous aircraft AI itself. eVTOLs, hydrogen turboprops, single-pilot freighters. They all need certified twins before the first passenger boards. The runway lights for autonomy were poured by simulator engineers a decade ago.

## What I'd Reuse Tomorrow

If you build systems where hardware, humans, and software collide, four rules that survived two years of Level D pressure:

1. **Treat every sensor as guilty until proven innocent.** Redundancy and aggressive monitoring from day one, not month six when the field complaints start.
2. **Automate the boring certification math.** Regulators love repeatability. So will your sleep schedule.
3. **Design instructor tools like mission control, not consumer apps.** Fast feedback beats flashy UI. Dark mode helps. A scrub-time slider helps more.
4. **Invite the pilots into code review.** They ask better edge-case questions than any linter. They catch the "this is a video game, not a simulator" failure modes that engineers miss because engineers do not actually land airplanes.

We thought we were building a better training device. We were actually building the proving ground for the autonomous aircraft that will eventually replace its users. Until that handover finishes, I will keep the whiteboard ready and the coffee warm.

---

**References**

1. [Avion Group](https://www.aviongroup.aero), the full-flight-simulator OEM I worked at (2023 to 2025)
2. [FAA Notice 8900.491: Simulator Qualification Guidance](https://www.faa.gov/documentLibrary/media/Notice/N8900_491.pdf)
3. [ICAO Doc 9625: Manual of Criteria for the Qualification of FSTDs](https://store.icao.int/en/manual-of-criteria-for-the-qualification-of-flight-simulation-training-devices-doc-9625)
4. [Airbus](https://www.airbus.com) and [Boeing](https://www.boeing.com), the OEMs whose aircraft we were certified to imitate
