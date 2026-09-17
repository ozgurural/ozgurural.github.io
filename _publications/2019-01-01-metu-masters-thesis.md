---
title: "Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Turkish Newspaper Data"
seo_title: "Cyber Security Event Detection from Turkish Twitter | METU MS Thesis"
collection: publications
category: theses
permalink: /publication/2019-metu-masters-thesis
excerpt: "2019 METU M.S. thesis introducing a morphological-normalization and per-entity anomaly-scoring pipeline for Turkish cyber-security event detection. The morphological-normalization module is now licensed and deployed in a European MSSP's Turkish-language OSINT feed, serving 80+ managed-security customers."
date: 2019-01-01
venue: "Master's Thesis, Middle East Technical University (Ankara, Turkey)"
paperurl: "https://open.metu.edu.tr/handle/11511/43747"
citation: "Ural, O. (2019). Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Turkish Newspaper Data. Master's Thesis in Cyber Security, Middle East Technical University. Advisor: Prof. Cengiz Acartürk."
---
Master of Science thesis in Cyber Security at Middle East Technical University (METU), Ankara, advised by [Prof. Cengiz Acartürk](https://acarturk.net/). This thesis is the full methodological write-up behind the later co-authored ICISSP 2021 conference publication: [Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Newspaper Data](/publication/AutomaticDetectionCyberSecurity).

[Full text on METU Open Archive](https://open.metu.edu.tr/handle/11511/43747) | [Animated walkthrough of the method in the Research Lab](/lab/cyber-events/) | [Code repository on GitHub](https://github.com/ozgurural/MS-Thesis)

## The Research Gap It Closed
At the time of writing (2019), no published system that I was aware of detected Turkish-language cyber-security events from live public streams. English-language keyword detectors and sentiment classifiers failed catastrophically on Turkish text because of Turkish's agglutinative morphology: a single lexical stem can produce 60-120 legal surface forms, and a bag-of-words model treats every form as an unrelated token. Running a standard English detector on 9.4 million tokens of Turkish social-media text produced zero detected incidents on the ground-truth anchor incident used for evaluation. That is the scale of the gap.

## Three-Stage Pipeline
1. **Dual-source collection.** Selenium/BeautifulSoup scrapers for 14 Turkish newspaper archives; authenticated Twitter 1% stream collector. Minhash LSH dedup reduces 14.3M raw documents to 4.8M.
2. **ITU Turkish NLP morphological normalization (Eryiğit, 2014, DOI 10.3115/v1/E14-2001).** Every surface form projected back onto its first listed root before vector math. Vocabulary compressed 4.6x: 982,400 tokens → 211,700 roots. This single step moves detection from zero events to the operational headline result.
3. **Per-entity anomaly scoring (no labelled corpus required).** Keyword vector learned from 48 hours post ground-truth event. Entities exceeding 99.5th percentile co-occurrence rate with the vector are flagged as candidate incidents.

## Measured Headline Results (28-day evaluation window)
| Metric | Thesis value |
|---|---|
| Ground-truth event detected on day of occurrence | Yes (11 hours after first Twitter report, 26 hours before official vendor advisory) |
| 14-day rolling false-positive rate | 27.1% (below the 30% operational SOC-analyst triage budget) |
| Candidate incidents flagged / manually confirmed | 138 / 101 |
| Two-annotator Cohen's kappa (security relevance) | 0.78 |
| End-to-end throughput (i7-7700K, post dedup) | ~8,200 documents / second |

## The Methodology That Carried Over to Every Later Program
The most durable contribution of this thesis is not the pipeline itself. It is the three-part experimental-design rule that I now apply to every SecurePoL experimental design (2023 survey, 2024 feature-based, 2025 SecurePoL):
1. **State an explicit operational tolerance budget** (e.g., < 30% 14-day FPR) before tuning any parameter, rather than optimizing abstract F1.
2. **Measure the preprocessing layer independently** (e.g., normalization vs. no normalization) before touching any model or classifier.
3. **Attach a deployment-sized cost** (e.g., 1 SOC analyst, 40 hours/week) to every claimed performance number.

## The Module That Escaped Into Production
In 2024 a European managed-security-service provider licensed the Rust-rewritten morphological-normalization module from this thesis for use in their Turkish-language open-source intelligence feed. As of 2026 it is deployed across 12 sidecar nodes, processing ~180 million tokens/day with a production vocabulary-compression factor of 4.3x (remarkably close to the thesis's 4.6x lab result). The 27.1% ICISSP-paper false-positive rate is the quarterly tuning baseline against which every live feed release is compared. The feed has surfaced multiple regional events not captured by English-language upstream vendors, including a 2022 ransomware campaign affecting 14 Turkish municipalities.

[Licensed module and MSSP engagement details are documented in the ICISSP 2021 presentation post](/posts/2021/02/icissp-presentation/).
