---
title: "Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Turkish Newspaper Data"
seo_title: "Cyber Security Event Detection from Turkish Twitter"
collection: publications
category: theses
permalink: /publication/2019-metu-masters-thesis
excerpt: "Master's thesis introducing NLP methods for detecting cyber-security events in Turkish social media and news streams, advised by Prof. Cengiz Acartürk and the basis of the later ICISSP 2021 paper."
date: 2019-01-01
venue: "Master's Thesis"
paperurl: "https://open.metu.edu.tr/handle/11511/43747"
citation: "Ural, O. (2019). Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Turkish Newspaper Data. Master's Thesis, Middle East Technical University, Ankara, Turkey."
---

Master's thesis in Cyber Security at Middle East Technical University, advised by [Prof. Cengiz Acartürk](https://acarturk.net/). It builds a system that detects cyber-security events from two live Turkish sources, a Twitter stream and newspaper data, and it is the work later extended into the co-authored [ICISSP 2021 paper](/publication/AutomaticDetectionCyberSecurity).

## The problem it takes on

Security incidents are discussed publicly before they are announced officially, so an open stream carries the signal early. The obstacle is that genuine events are a handful in a thousand posts, and Turkish has no large annotated security corpus to train on. The thesis therefore learns its vocabulary from an incident whose ground truth is already known, then treats the size of that keyword set as a tuning problem between missing events and flooding the queue with false ones.

## Why the language matters

Turkish is agglutinative, so a single stem produces a combinatorial family of surface forms that a bag-of-words model reads as unrelated tokens. The thesis addresses this before the classifier rather than inside it, by normalising forms back onto their stems so the statistical evidence concentrates instead of scattering. This is the finding that carried into the published paper.

The full text is available in [METU's open archive](https://open.metu.edu.tr/handle/11511/43747), and there is an [animated explainer](/lab/cyber-events/) of the approach in the Research Lab.
