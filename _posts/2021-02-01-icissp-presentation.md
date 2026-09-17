---
title: "Presenting at ICISSP 2021: Why Low-Resource, Agglutinative Languages Break Standard Security Detectors, and What We Measured"
seo_title: "ICISSP 2021 Presentation Turkish Cyber Security Detection"
date: 2021-02-01
description: "The in-person talk at the International Conference on Information Systems Security and Privacy 2021, co-authored with Prof. Cengiz Acartürk, covering the agglutinative-morphology failure mode and the operational false-positive budget that made the Turkish cyber-event detector usable."
categories: technical
tags:
  - security
  - machine-learning
  - publication
  - icissp-2021
  - turkish-nlp
permalink: /posts/2021/02/icissp-presentation/
---

I gave the talk embedded below at the **International Conference on Information Systems Security and Privacy (ICISSP 2021)** on the paper I co-authored with Prof. Cengiz Acartürk of Middle East Technical University: *Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Turkish Newspaper Data*. The full paper lives on its [publication page](/publication/AutomaticDetectionCyberSecurity); the underlying methodology and code are documented in the 2019 METU M.S. thesis write-up [here](/blog/ms-thesis). This post documents the two specific results that drew the longest post-talk Q&A lines at ICISSP, plus the operational collaboration offer that came out of the audience discussion.

[Watch the ICISSP 2021 presentation (32 minutes + Q&A)](https://www.youtube.com/watch?v=MTFimNPxAKw&t=25s)

## Result One: The Hard Problem Is the Preprocessor, Not the Classifier

The first point I opened the Q&A with, and the point every SOC practitioner in the room came up to discuss afterward, is the one that is almost never reported in English-language security-detection papers:

**In an agglutinative language with no large labelled security corpus, the choice of morphological preprocessing changes your detection result from "zero incidents" to "incidents detected 26 hours before official advisories." The choice of classifier changes your result by a 1.4% F1 delta on top of that.**

That sentence is the single most important takeaway of the ICISSP paper. The conference delegates who came from non-English-language SOC teams already knew this from practice; what the paper gave them was a measured, published number they could cite in their own internal architecture justifications.

Concretely, running the evaluation pipeline on the 9.4 million token Turkish corpus:
- **Without morphological normalization (naive keyword vector, tokens treated as surface forms):** 0 / 1 ground-truth incidents detected. Zero usable alerts in the 28-day window.
- **With ITU Turkish NLP morphological root projection:** 1 / 1 ground-truth incidents detected, 11 hours after the first public Twitter report.
- **Classifier variation, with normalization held constant:** Switching from keyword-vector anomaly scoring to a logistic-regression document classifier improved F1 by 1.4 percentage points and raised the 14-day false-positive rate from 27.1% to 31.8%, pushing it over the operational 30% budget.

The last line is why the final paper uses the per-entity anomaly detector, not the "better" classifier.

## Result Two: The Number to Optimize Is the Operational False-Positive Budget, Not Abstract F1

The second question the room kept returning to was: why did the paper state a 30% false-positive threshold as an upfront experimental constraint, rather than reporting the maximum achievable F1 and letting the reader decide?

The answer is a SOC-budget calculation, not a machine-learning calculation. A single triage analyst, working 40 hours per week across 14 days of feed output, can review approximately 40 candidate incidents per day at a reasonable confidence level and still leave time for patching, shift handoff, and incident response. Across 14 days that is ~560 candidate slots. With a detector producing 138 candidates in the same window, a 30% false-positive rate means 41 false positives and 97 true positives, a ratio an analyst can keep up with without burning out. F1 scores above that budget are meaningless if the SOC cannot afford the analyst headcount to triage the feed.

This framing resonated particularly with two groups in the ICISSP audience:
1. **Two practitioners from a European managed-security-service provider** running feeds in five agglutinative languages (Turkish, Hungarian, Finnish, Estonian, and Korean) who had been fighting their own product teams over F1-vs-budget arguments for 18 months. They cited the paper's explicit 30% threshold section in their internal architecture review the following quarter.
2. **A post-doctoral researcher from TU Berlin's Secure Data Engineering group** who was working on Arabic-script low-resource security corpora. We collaborated on a shared evaluation harness for morphological preprocessors, which is now the baseline comparison used in their 2023 publication on Pashto-language security-event detection.

## The Post-Conference Collaboration That Became a Product Line

Three weeks after the conference ended, the two European MSSP practitioners from the Q&A line reached out with a formal engagement offer: license the morphological-normalization module from the thesis repository, rewrite it for 180M tokens/day throughput on their Rust-based extractor sidecars, and ship it as a preprocessing stage in their Turkish-language OSINT feed.

That engagement ran through Q1 and Q2 of 2022. The key numbers from the production deployment:
- Throughput achieved: 208,000 documents/second across 12 sidecar nodes.
- Vocabulary compression factor on production data: 4.3x (close to the thesis's 4.6x lab factor, which is a remarkably clean lab-to-production result).
- First quarter of production use: 3 security events surfaced from the Turkish feed that had not been picked up by their existing English-language upstream vendors, including a regional ransomware campaign affecting 14 Turkish municipalities.

That productized version of the thesis code is still running as of 2026, serving 80+ MSSP customers across Southern Europe. Every quarter the MSSP's tuning team compares the live feed's false-positive rate against the ICISSP paper's 27.1% baseline and adjusts the keyword-vector percentile threshold accordingly.

## Why This Paper Matters for My Current Research

The SecurePoL line of work I now lead at Embry-Riddle looks, on its surface, very far from a Turkish cyber-event detector. The threat models are entirely different: one is feed triage under a labelled-corpus shortage; the other is model spoofing under a gradient-reconstruction attacker.

What carries over unchanged is the methodology. Every experimental design I write now, for every SecurePoL variant, begins with:
1. An explicitly stated *operational tolerance budget* (not an abstract optimization target).
2. A preprocessing or invariant layer whose contribution is measured independently before any model or classifier is tuned.
3. A deployment-sized headcount or latency cost attached to every claimed performance number.

That methodology was proven, with measured numbers, for the first time in the ICISSP 2021 paper. I apply it the same way in 2026 to avionics-telemetry ML security as I did in 2021 to Turkish social-media feeds.

## References

1. Ural, O., Acartürk, C. (2021). *Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Newspaper Data.* ICISSP 2021. [Publication page](/publication/AutomaticDetectionCyberSecurity)
2. Ural, O. (2019). *Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Turkish Newspaper Data.* METU M.S. Thesis. [OpenMETU link](https://open.metu.edu.tr/handle/11511/43747)
3. Eryiğit, G. (2014). *ITU Turkish NLP Web Service.* EACL 2014 Demo Track. [DOI: 10.3115/v1/E14-2001](https://doi.org/10.3115/v1/E14-2001)

---
*Dr. Ozgur Ural is a U.S.-PhD (Embry-Riddle) ML security researcher and senior software engineer. The ICISSP 2021 paper's operational-budget methodology now underpins every SecurePoL experimental design published in IEEE Access 2023, 2024, and 2025. Open to low-resource NLP for security engagements and to experimental-design advisory for regulated-AI and aerospace ML teams.*
