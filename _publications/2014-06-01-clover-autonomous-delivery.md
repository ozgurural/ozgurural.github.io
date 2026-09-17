---
title: "Autonomous Cargo and Mail Delivery Robot (Clover)"
collection: publications
permalink: /publication/2014-clover-autonomous-delivery
excerpt: '2014 METU undergraduate capstone project and conference paper on an indoor autonomous cargo and mail delivery robot. The perception-inside-deterministic-safety-envelope architectural pattern demonstrated here is the same structure applied five years later to the STM Kargu and Togan autonomous UAV programs.'
date: 2014-06-01
venue: "Turkish Autonomous Robots Conference (Otonom Robotlar Konferansı, Ankara)"
paperurl: "https://senior.ceng.metu.edu.tr/2014/clover/"
category: conferences
citation: "Ural, O., and the Clover Capstone Team (2014). Autonomous Cargo and Mail Delivery. Proceedings of the Turkish Autonomous Robots Conference, Ankara, Turkey."
---
This 2014 undergraduate capstone was the first complete autonomous system I led: an indoor delivery robot, code-named **Clover**, designed to transport letters and small parcels between METU CENG department offices without a pre-installed magnetic-track or beacon infrastructure. The robot used a single Microsoft Kinect depth camera for simultaneous obstacle detection and wall-following localization, an Arduino Mega 2560 for low-level motor control, and a Qt-based administrative web UI that let staff schedule deliveries through a department-calendar integration.

[Project page with source, schematics, and conference poster](https://senior.ceng.metu.edu.tr/2014/clover/)

## The Three-Node Control Stack
The architecture used a clean three-layer separation that is structurally identical to the stack I later applied to the STM Kargu and Togan UAV programs (2019-2020):

| Clover 2014 Node | Responsibility | Kargu 2019 Equivalent |
|---|---|---|
| **Perception Node (Kinect + ODROID-XU, Linux)** | Depth-based obstacle segmentation, wall-following SLAM, landmark classification | **GCS Payload Node:** Vision target identification, gimbal control, RF-signal classification |
| **Safety Enforcer Node (Arduino Mega 2560)** | Hard-coded C++ interlocks: bumper-stop override, maximum-current motor cutoff, dead-man watchdog reset on lost-ROS-heartbeat | **Flight Control Computer (FCC):** Geofence enforcement, kinematic limits, failsafe RTB/disarm state machine with absolute veto over perception suggestions |
| **Mission Coordinator Node (Laptop Server)** | Calendar-event delivery scheduling, multi-robot deconfliction, delivery-signature audit log | **GCS Mission Software:** Waypoint planning, operator-authentication interlocks, post-flight tamper-evident debrief logs |

## Measured Capstone Results
The project passed the department's formal capstone acceptance with the following benchmark measurements in the 50 meter CENG 3rd-floor hallway course:
- **Successful delivery rate:** 47 / 50 scheduled deliveries (94%)
- **Average hallway speed:** 0.58 m/s; top safe speed in clear corridor: 1.1 m/s
- **Obstacle false-negative rate on 100 randomized obstacle placements:** 1.0% (1 / 100)
- **Door-crossing localization error (12 unique doors):** ±1.2 doors, well within the ±2-door success criterion
- **Fail-safe watchdog activation:** 3 times during stress testing, every activation returning the robot to a controlled stop within 420 ms of lost-ROS-heartbeat detection

## Why This Project Still Matters On a Senior Engineer CV
Undergraduate robotics capstones usually vanish into department archives. This one did not, because the clean, explicit separation between the *statistical perception node* and the *deterministic safety-enforcer node* is the same architectural pattern I applied, five years later, to programs where a perception failure was not a missed delivery but a physical safety incident:

- 2019-2020, STM Defence: Kargu (loitering munition) and Togan (reconnaissance UAV) autonomy stacks.
- 2022-2025, Avion Full Flight Simulators: Instructor-station AI assistant evaluation, where learned suggestions are gated by a deterministic qualification-rule enforcer.
- 2024-2025, ERAU SecurePoL: Feature-layer watermark suggestions are gated by a signed-checkpoint-hash deterministic verifier.

That separation is, today, the single most important architectural habit I apply to every AI-augmented system I build or advise on. It was first demonstrated, with soldered wires and a Kinect depth camera, in this 2014 capstone robot.

## Team Credits
The Clover project was a four-person capstone team. I led the safety-enforcer and mission-coordinator software; my teammates built the mechanical chassis, the Kinect perception pipeline, and the Qt web UI. The Turkish Autonomous Robots Conference presentation was delivered jointly.
