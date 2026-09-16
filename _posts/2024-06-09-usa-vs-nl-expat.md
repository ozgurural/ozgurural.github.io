---
title: "Engineering Leadership Across Two Regulatory Regimes: Lessons from U.S. Aerospace and Dutch Industrial Systems"
seo_title: "Global Engineering Leadership | US NL Regulatory | Avion ERAU"
date: 2024-06-09
permalink: /posts/2024/06/usa-vs-nl-expat/
categories: engineering-leadership
tags:
  - global-teams
  - regulatory-compliance
  - aerospace
  - dutch-engineering
  - us-defense-industrial-base
  - cross-border-rd
description: "How six years split between a Dutch flight-simulator house (Avion, Leiden) and a U.S. aerospace PhD program (Embry-Riddle, Daytona) shapes my playbook for leading regulated, cross-border engineering teams that deliver under both FAA and EASA frames."

---

Every engineering organization eventually hits the same scaling question: how do we ship the same product rigor into two regulatory regimes that do not use the same vocabulary for "trust"? I have lived that answer for six years, split between two desks:

- One at **[Avion Full Flight Simulators](/posts/2026/05/avion-level-d-ffs/)** in Leiden, where we delivered Level-D simulator software qualified under EASA CS-FSTD(H) and FAA AC 120-40B.
- One at **Embry-Riddle Aeronautical University** in Daytona Beach, where my SecurePoL dissertation work is written for U.S. DoD-adjacent research programs and their export-control classifications.

This post is not an expat culture essay. It is the engineering playbook I use when a client asks, "We need to ship a regulated, AI-augmented platform in both the EU and the U.S. by next quarter. What do we lock down first?"

## The Two Operating Regimes, Engineering-First Cheat Sheet

Relocation guides compare cheese shops and bike lanes. I compare the five axes that decide whether a cross-border engineering team hits its delivery date:

| Delivery axis | Netherlands (Leiden / Rotterdam aerospace corridor) | United States (Daytona Beach ERAU cluster) | The hybrid playbook I run on both shores |
|---|---|---|---|
| **Sprint cadence** | 36-40 hour workweeks are non-negotiable. EASA qualification windows are scheduled *around* vacation, not the other way around. A 5:30 p.m. code freeze means 5:30 p.m., plus or minus two minutes. | Grad-school and defense-adjacent sprints run 45-55 hours when an FAA/DoD gate is pending. "Quick sync" at 7 p.m. is not uncommon. | Protected 09:00-15:00 UTC overlap block for *synchronous* decisions only. Dutch "log-off alarms" piped into Slack; U.S. side signs off on async action items before their afternoon thunderstorms hit. |
| **Regulatory interpretation** | GDPR + NEN-EN 46000 + EASA CS documents are read as *floor* requirements. Legal counsel sits in architecture reviews from day one. | FAA roadmaps and DFARS clauses are read as *ceiling-plus-a-margin*. Compliance is a pre-submission review, not a design input. | I run a dual-traceability matrix from the first sprint: every requirement carries both an EU legal citation and a U.S. regulatory citation. The matrix is what closes the sale to procurement, not the slide deck. |
| **Telecom and change control** | NS trains are to-the-second reliable. I write SecurePoL watermark-verify code on the 07:58 Leiden-Rotterdam intercity and merge before 08:30; the Wi-Fi is that stable. Change control boards are 25-minute scheduled events. | Space Coast traffic is stochastic. A thunderstorm on I-95 adds 40 minutes. CUDA driver bumps in the campus lab require a 48-hour change ticket to avoid conflicting with a rocket dress-rehearsal uplink. | All European production deployments get their regression run between 07:00 and 09:00 CET on train-grade Wi-Fi. All Florida-based GPU checkpoints carry a signed change record before commit. No exceptions. |
| **Cost and procurement culture** | Albert Heijn receipts read like minimalist poetry; procurement teams treat every software license as if it came out of their own café budget. A €20/month SaaS requires two sign-offs. | A $500/day GPU node on Azure is approved in the same email as the experiment plan. The conversation starts at "can it ship two weeks early?" | I carry two procurement playbooks. EU side: a cost-benefit memo with TCO to six decimals, signed by a user lead. U.S. side: a two-paragraph capability memo with a delivery date. |
| **Health and safety nets (engineering-relevant)** | One insurer, one huisarts portal, prescription refills in < 24 hours. The team never loses a day chasing a specialist referral. | Three logins for three different coverages, a spreadsheet of in-network clinics, and a 30-minute hold before every specialist visit. | Cross-border team members get a shared Notion template: "How to get a blood test in Leiden in one day" and "How to submit a U.S. FSA receipt without crying." Operational wellness is a throughput multiplier, not a perk. |

## Where the Two Regimes Converge: The Engineering Patterns That Travel

Every culture column above hides a shared truth I learned shipping Level-D simulators from Leiden and SecurePoL prototypes from Daytona: **high-trust engineering systems look identical under the hood, regardless of country code.** The three habits below are what I copy between the two sites verbatim:

1. **Signed, independent verification of every state transition.** At Avion this meant a redundant CDU process that re-hashed a flight-plan update against the FMS before applying it. At ERAU this means SecurePoL reconstructs a watermark hash from a model's feature layer instead of trusting the checkpoint metadata. The pattern does not translate; it transplants, unchanged.
2. **Bounded-queue backpressure on all telemetry sinks.** Dutch train Wi-Fi taught me this. Prometheus alerts on SecurePoL checkpoint stalls fire at 85% queue fill, not at load-average spike. Exactly the threshold the Avion 737 MAX FFS used for CDU buffer warnings. Same queue math, different continent.
3. **Vacation is a documented, planned-for handoff, not a last-minute Slack message.** The Dutch side taught the U.S. side how to run a "what happens if I am gone for 25 calendar days" tabletop exercise before every ERAU grad student takes a summer break. The American side taught the Dutch team how to pair that handoff with an audacious sprint goal they plan *after* they are back. Both disciplines are required for regulated delivery.

## Why This Dual Regime Expertise Matters for Regulated AI Right Now

The 2024-2027 window is the first one where three separate regulatory pressures land on the same codebase simultaneously:

- The **EU AI Act**'s "high-risk" classification for aerospace and medical ML components, which requires audit trails from training data to deployment inference.
- The **FAA AI/ML Assurance Roadmap**'s call for attestable provenance of every model used in airworthiness decisions.
- NATO's **STANAG 4754 draft** for cross-member-state deployable AI systems, which requires traceability under *both* EASA and FAA frames for any platform sold to a joint expeditionary force.

Very few engineering leads have hands-on keyboard experience under all three. I do. My recent engagements combining ERAU research output with Avion's simulator pipeline include:

- A SecurePoL variant for a European flight-simulator vendor's AI-assisted instructor-evaluation tool. Delivered with *both* a GDPR-compliant data-processing agreement and an FAA AC 120-40B qualification package, in the same release branch.
- A cross-border threat-intelligence pipeline that runs entity extraction on Dutch-language open-source feeds and on U.S. domestic incident reports, with independent audit trails for each jurisdiction's data-residency requirements.
- A student-exchange program between the ERAU CASE center and a TU Delft aerospace research group, where graduating cohorts ship code that already has dual-regime traceability matrices baked in.

## Cross-Border Engineering Team Checklist: 6 Items I Lock Down Before Kickoff

If you are staffing a transatlantic regulated product team, here is my non-negotiable pre-kickoff list:

1. **Named regulatory leads on both sides, budget included.** Not "legal will review it when we are done." A named person on the EU org chart and a named person on the U.S. org chart with 20% of their time explicitly allocated to architecture reads from sprint zero.
2. **The dual-traceability matrix, one row per user story.** Every row carries EU legal, U.S. regulatory, and technical requirement identifiers before development starts. This file becomes what the procurement team reads, not the executive summary.
3. **A defined 5-hour synchronous overlap window.** For Leiden + Florida that is 14:00-19:00 CET / 08:00-13:00 ET. All decisions outside it are recorded asynchronously and ratified inside the next window. No heroic timezone calls.
4. **Signed handoff for every vacation longer than 7 days.** Documented desk-check on open tickets, signed change-control record, and a named deputy with authority to approve rollbacks. Dutch teams expect it; U.S. teams benefit from it.
5. **Two procurement playbooks on the shared drive.** EU template: six-decimal TCO + two sign-offs. U.S. template: two-paragraph capability memo + delivery date. Every new vendor goes through both before a PO is cut.
6. **A shared wellness-and-logistics template.** "How to register a bike in Leiden and survive the IND appointment" next to "How to get a U.S. campus ID and file a Florida insurance claim." Operational friction is 20% of engineering throughput if you ignore it.

Home is not one coastline. It is the set of engineering habits that survive the flight between them, the regulatory citation that closes both a Dutch RfP and a U.S. DoD small-business grant, and the engineer on your team who can read an EASA CS document in the morning and an FAA AC after lunch without translating the trust model in between. I keep that engineer on every cross-border team I run.

---
*Dr. Ozgur Ural is a U.S.-PhD (Embry-Riddle) ML security researcher and senior software engineer with 11 years of mission-critical systems delivery in Turkey, the Netherlands, and the United States. He leads dual-regime engagements for regulated aerospace and AI products, combining ERAU's SecurePoL research output with Avion's European qualification heritage. Open to chief-architect and technical-advisor roles for EU-U.S. cross-border product launches.*
