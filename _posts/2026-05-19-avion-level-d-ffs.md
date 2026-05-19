---
title: "The FAA-Certified Lie: Building Simulators for the AI Era"
date: 2026-05-19
permalink: /posts/2026/05/avion-level-d-ffs/
redirect_from:
  - /posts/2025/09/avion-level-d-ffs/
categories: technical
tags:
  - aviation
  - simulation
  - engineering
  - ai
  - telemetry
---

When you strap into a Level D full flight simulator, you are not flying a plane. You are inhabiting a multi-million-dollar lie — certified by the FAA, EASA, and a small army of test pilots whose job is to find the seams.

I spent two years at [Avion](https://www.aviongroup.aero) (2023–2025) making that lie better. The interesting part is that the same machinery we built to fool human pilots is about to train the autonomous agents that will replace them.

## What "Level D" Actually Demands

Level D is the top tier of simulator certification. To earn that letter you have to:

1. Match every control force to within tight tolerances — even when a panicked pilot yanks the yoke past the stops.
2. Render 180°+ visuals at sub-20 ms latency so the pilot's inner ear and inner skeptic both stay quiet.
3. Prove via 100+ certification test points that the sim behaves exactly like the aircraft — in normal flight, in V1 cuts, in dual-engine failures, in low-vis approaches the regulator just invented in the meeting.

Think of it as a PhD dissertation where the advisor is the FAA and your classmates are Airbus and Boeing. Pass and an airline can type-rate entire crews without burning a kilogram of Jet-A. Fail and the device gets grounded the same week the salesperson promised delivery.

## Building a Digital Twin That Blinks

We treated each simulator as a living digital twin. My team:

1. **Telemetry pipeline.** Ingested ~50 GB/s of sensor data, cached the hot path in Redis, persisted the durable record in PostgreSQL, and streamed instructor-station updates over gRPC and HTTP.
2. **Flight-model kernels.** Iterated physics in C++ and Scala, validated against aircraft certification data, then wrapped each release in deterministic test harnesses so the nightly build either met Level D fidelity or didn't ship. No "we'll patch it in the field" — the field is a flight deck.
3. **Instructor experience.** Built Svelte dashboards that let instructors script cascading failures, watch pilot biometrics, and scrub time like a Netflix episode of *How Not to Land an Airplane*.

Each release rode hardware-in-the-loop rigs with real pilots on headset and regulators dropping by with new edge cases. The whiteboards were never empty and the coffee was always warmer than the hydraulic oil.

## The Bend Toward AI

Three things are reshaping the room at once:

**Live fleet telemetry into training.** Yesterday's turbulence over the Atlantic becomes tomorrow's training challenge. Real aircraft data flows back into the sim so scenarios stop being scripted and start being *lived*. The instructor is no longer inventing a thunderstorm; they're replaying the one your fleet actually flew through last Thursday.

**Adaptive scenario generation.** Reinforcement-learning agents read pilot biometrics — heart rate, gaze fixation, control-input entropy — and dial scenario difficulty in real time. The sim stops being a script the instructor plays back and starts being an opponent the pilot has to outthink. Done badly, it's a video-game boss; done well, it's the most honest assessment instrument aviation has ever had.

**Debrief by math, not memory.** "I think you flared a hair late" becomes a precise reconstruction — angle of attack, sink rate, column displacement vs. the ideal trajectory — overlaid on the actual landing. Pilots argue less with a graph than with a person.

The interesting bend is the second-order one: the same digital-twin substrate becomes the training ground for the autonomous aircraft AI itself. eVTOLs, hydrogen turboprops, single-pilot freighters. They all need certified twins before the first passenger boards. The runway lights for autonomy were poured by simulator engineers a decade ago.

## What I'd Reuse Tomorrow

If you build systems where hardware, humans, and software collide, four rules that survived two years of Level D pressure:

1. **Treat every sensor as guilty until proven innocent.** Redundancy and aggressive monitoring from day one — not month six when the field complaints start.
2. **Automate the boring certification math.** Regulators love repeatability. So will your sleep schedule.
3. **Design instructor tools like mission control, not consumer apps.** Fast feedback beats flashy UI. Dark mode helps. A scrub-time slider helps more.
4. **Invite the pilots into code review.** They will ask better edge-case questions than any linter — and they catch the "this is a video game, not a simulator" failure modes that engineers miss.

We thought we were building a better training device. We were actually building the proving ground for the autonomous aircraft that will eventually replace its users. Until that handover finishes, I'll keep the whiteboard ready and the coffee warm.

---

**References**
1. [Avion Group](https://www.aviongroup.aero) — full-flight simulator OEM I worked at (2023–2025)
2. [FAA Notice 8900.491 — Simulator Qualification Guidance](https://www.faa.gov/documentLibrary/media/Notice/N8900_491.pdf)
3. [ICAO Doc 9625 — Manual of Criteria for the Qualification of FSTDs](https://store.icao.int/en/manual-of-criteria-for-the-qualification-of-flight-simulation-training-devices-doc-9625)
4. [Airbus](https://www.airbus.com)
5. [Boeing](https://www.boeing.com)
