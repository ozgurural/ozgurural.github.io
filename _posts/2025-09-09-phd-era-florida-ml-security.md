---
title: "PhD Life at Embry-Riddle: Machine Learning, Security, and Sunshine"
date: 2025-09-09
permalink: /posts/2025/09/phd-era-florida-ml-security/
categories: life
tags:
  - phd
  - machine-learning
  - security
  - florida
  - erau
---

Embarking on a PhD in Florida means waking up to salt air, sunscreen reminders, and the low rumble of aircraft testing engines at [Embry-Riddle Aeronautical University](https://www.erau.edu/). My advisor jokes that our campus smells like jet fuel and ambition; he’s right on both counts. By 7 a.m. I am usually rolling past the flight line with a notebook full of model checkpoints to validate and a thermos of Cuban coffee strong enough to double as rocket propellant.

## Morning Run-Up

Daytona Beach may be famous for NASCAR and spring breakers, but my calendar reads more like a flight plan than a party invite. A typical weekday looks like this:

| Time | Activity | Why it matters |
| --- | --- | --- |
| 6:15 a.m. | Sunrise run along the Halifax River | Clears the cobwebs and generates half my research ideas. |
| 7:30 a.m. | Lab systems check | Kick off overnight jobs, glance at Prometheus dashboards, and pray to the GPU gods. |
| 10:00 a.m. | Cybersecurity & Assured Systems stand-up | Rapid-fire updates, new attack scenarios, and the occasional donut economics pun. |
| 2:00 p.m. | Proof-of-learning experiments | Replaying distributed training runs, logging watermark robustness metrics. |
| 7:30 p.m. | Manuscript edits or tutoring undergrads | The writing makes the science legible; the teaching keeps me honest. |

I keep a “runway log” in Notion that tracks experiments, paper deadlines, and even the humidity index—because hardware throttling is a real thing when the air feels like soup.

## Research Altitude: Proof-of-Learning Meets Security

My dissertation, **“Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model Watermarking,”** sits at the intersection of machine learning, cryptography, and just enough paranoia to make for great conference talks. Most mornings begin in the GPU lab, where I:

1. Reconstruct adversarial training traces from our spoofing catalog.
2. Stress-test watermarking strategies that survive pruning, quantization, and model surgery.
3. Compare protocol performance with telemetry from simulated avionics workloads.

Working on proof-of-learning keeps me anchored to the questions that pulled me into graduate school: **How do we know a model was trained honestly, and how do we preserve that assurance when adversaries adapt faster than Florida’s weather?**

### Tooling That Keeps the Plane in the Air

* **Core stack:** PyTorch + Lightning, Hydra for configuration, and Weights & Biases for experiment lineage.
* **Security sandbox:** Custom Kubernetes namespace with policy enforcement, plus [Falco](https://falco.org/) alerts piped into Slack for real-time anomaly detection.
* **Data hygiene:** Weekly audits using [Great Expectations](https://greatexpectations.io/) to ensure new telemetry hasn’t quietly drifted off course.

Every Friday, I run a “turbulence drill” where I intentionally sabotage a pipeline component—revoking a key, injecting poisoned gradients, or throttling IO—to verify our detection scripts still trip. It is part chaos monkey, part therapy.

## Community Tower: Mentors, Peers, and Pancakes

I am fortunate to tackle these questions under the guidance of Dr. Kenji Yoshigoe and the research community inside the [Cybersecurity and Assured Systems Engineering center](https://erau.edu/research/cybersecurity-assured-systems). Weekly meetings feel like focused research roundtables, with faculty dissecting avionics incidents and classmates presenting fresh experimental results. Someone inevitably brings pancakes from the student union; security conversations go down easier with maple syrup.

To keep collaboration lively, we rotate responsibilities:

* **Threat-model Thursdays:** One student leads a tabletop exercise simulating a new attack against aircraft systems.
* **Launch-and-Learn nights:** We stream NASA or SpaceX launches from the causeway while debating the ethics of autonomous flight.
* **Paper pilot program:** First-year PhD students co-author blog summaries to demystify recent security papers for undergrads.

These rituals create feedback loops between coursework, research, and community mentorship. They also remind me that the best debugging happens when someone else is holding a plate of pancakes.

## Sunshine, Sanity, and the Occasional Hurricane Watch

Florida’s climate supplies its own rhythm. Afternoon thunderstorms chase me from the lab only to leave sherbet-colored sunsets over the water. On clear nights we carpool south to watch a launch, and the sight of a rocket carving through the sky has become my favorite antidote to research fatigue. When the forecast turns ominous, I switch to a “hurricane mode” checklist: backup datasets to off-site storage, charge every laptop, and stock up on empanadas.

To stay balanced, I lean on a few habits:

* **Pomodoro sprints on the balcony** whenever the UV index dips below “dragon fire.”
* **Mentor walks**—literally pacing the flight line with my advisor, which somehow makes debugging graph neural networks feel breezy.
* **Monthly “data detox” days** with zero commits, where I read fiction at the beach and pretend my models do not exist for six hours.

## Pre-Flight Checklist for Prospective ERAU PhDs

Thinking of mixing machine learning, security, and sunshine yourself? Here are my distilled takeaways:

1. **Design for auditability from day one.** Version everything—datasets, configs, container builds—because future-you will forget which run was the good one.
2. **Get comfortable with interdisciplinary translation.** You will explain backpropagation to pilots and avionics safety to data scientists, often in the same meeting.
3. **Lean into the aerospace ecosystem.** Collaborate with flight test teams, simulation labs, and even meteorology researchers; their constraints sharpen your threat models.
4. **Budget time for funding logistics.** ERAU’s [Graduate Studies page](https://erau.edu/degrees/graduate) lists assistantships early, and they go as fast as prime launch windows.
5. **Protect your joy.** Schedule the beach walk, the surf lesson, the sunset photo. Burnout looks suspiciously like cloud cover if you ignore it long enough.

## Reading Radar

If you’re curious about securing AI, start with *Machine Learning and Security* by [Clarence Chio and David Freeman](https://www.oreilly.com/library/view/machine-learning-and/9781491979897/) for pragmatic frameworks, then dive into the [Proof-of-Learning](https://arxiv.org/abs/2103.06217) literature for protocol mechanics. For a systems spin, the [MITRE ATT&CK for ML](https://attack.mitre.org/techniques/ML/) matrix pairs nicely with ERAU’s avionics case studies.

Research may keep me indoors, but Florida never lets me forget that discovery can be as expansive as the horizon beyond the runway—and that the best ideas often arrive somewhere between a lightning storm and a launch countdown, preferably while holding a mango smoothie.
