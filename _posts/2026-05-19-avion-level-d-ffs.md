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

Bolted to the ground. Costs tens of millions of dollars. Designed to fool airline pilots through engine failures that never happen, fog-blind landings that never happen, hydraulic system collapses that never happen. After two hours inside, a pilot can earn the legal right to fly a 737 they have never actually flown. The FAA signs off in writing.

I have been at [Avion](https://www.aviongroup.aero) since 2023, building these. The strange part is what comes next. The same machinery built to fool human pilots is becoming the training ground for the AI that will eventually replace them.

## What "Level D" Actually Means

Regulators certify four tiers of flight simulator. Level A is essentially a video game. Level D is the top. To earn that letter, the device has to do four impossible things at once:

1. Match the real aircraft's controls so closely that a panicked pilot yanking the yoke past the stops feels exactly the resistance they would feel in the real cockpit.
2. Project a wraparound view of the world that is real enough, and fast enough, that the pilot's inner ear and inner skeptic both stay quiet.
3. Pass more than a hundred certification tests covering normal flight, engine failure at takeoff, dual-engine failure, and whatever new low-visibility approach the regulator invented at this morning's meeting.
4. Behave so consistently that pilots cannot reverse-engineer the trick by watching their own instruments.

Pass, and an airline certifies entire crews on a new aircraft without burning a kilogram of jet fuel. Fail, and a twenty-million-dollar device sits on a warehouse floor while everyone in the room looks at the ceiling.

## How We Actually Build the Lie

Three things, relentlessly.

**The data plumbing.** A Level D simulator generates roughly 50 gigabytes of sensor data every second. That data has to be captured, archived, and streamed to the instructor's station without missing a beat. If the data path stutters, the simulator stutters, and a training session worth thousands of dollars goes in the trash.

**The flight model.** Inside the box runs a digital copy of the aircraft's physics, accurate enough to fool a test pilot with thousands of hours in the real machine. We iterate this model nightly, comparing it against certification data, and either it matches the real aircraft or it does not ship. There is no version of "we will patch it in the field." The field is a flight deck.

**The instructor's chair.** The instructor needs a control panel that lets them break the simulator in interesting ways: fail an engine here, drop hydraulics there, blind the windscreen with fog at the exact moment the pilot is committed to land. They need to scrub time backward and forward, like watching a Netflix episode of *How Not to Land an Airplane*. The most useful object in the building is the rewind button. Pilots learn more from thirty seconds of replay than from thirty minutes of lecture.

The whiteboards are never empty. The coffee is always warmer than the hydraulic oil.

## The Bend Toward AI

Three things are reshaping the room at once.

**Yesterday's turbulence becomes tomorrow's lesson.** Real aircraft telemetry now flows back into the simulator. The instructor stops inventing a thunderstorm and starts replaying the one the fleet actually flew through last Thursday. Training stops being scripted and starts being lived.

**The simulator becomes an opponent.** AI systems read the pilot's biometrics, heart rate, where the eyes are looking, how much the hands are over-correcting, and dial scenario difficulty in real time. The simulator stops being a script the instructor plays back and starts being something the pilot has to outthink. Done badly, this is a video-game boss. Done well, it is the most honest assessment instrument aviation has ever had.

**Debrief by math, not memory.** "I think you flared a hair late" becomes a precise reconstruction. Angle of attack, sink rate, control column position against the ideal trajectory, all overlaid on the actual landing. Pilots argue less with a graph than with a person. The instructor's job shifts from explaining what happened to deciding what to do about it.

The deeper bend is one nobody is talking about yet. The same digital-twin substrate is becoming the training ground for autonomous aircraft AI itself. Air taxis, hydrogen-powered turboprops, single-pilot freighters. They all need certified twins before the first passenger boards. The runway lights for autonomous flight were poured by simulator engineers a decade ago.

## What I Tell Anyone Building This Stuff

If you build systems where heavy machinery, software, and human attention collide, four rules that have survived three years of Level D pressure:

1. **Treat every sensor as guilty until proven innocent.** Redundancy and monitoring from day one, not month six when the field complaints start landing.
2. **Automate the boring certification math.** Regulators love repeatability. So will your sleep schedule.
3. **Build instructor tools like mission control, not consumer apps.** Fast feedback beats flashy interface. Dark mode helps. A rewind button helps more.
4. **Invite the pilots into code review.** They ask better edge-case questions than any automated test, because engineers do not actually land airplanes.

We thought we were building a better training device. We were actually building the proving ground for the autonomous aircraft that will eventually replace its users. Until that handover finishes, I will keep the whiteboard ready and the coffee warm.

---

**References**

1. [Avion Group](https://www.aviongroup.aero), where I have been building Level D simulators since 2023
2. [FAA Notice 8900.491: Simulator Qualification Guidance](https://www.faa.gov/documentLibrary/media/Notice/N8900_491.pdf)
3. [ICAO Doc 9625: Manual of Criteria for the Qualification of Flight Simulation Training Devices](https://store.icao.int/en/manual-of-criteria-for-the-qualification-of-flight-simulation-training-devices-doc-9625)
4. [Airbus](https://www.airbus.com) and [Boeing](https://www.boeing.com), the aircraft manufacturers whose machines we are certified to imitate
