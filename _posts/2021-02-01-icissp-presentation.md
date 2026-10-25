---
title: "Presenting at ICISSP 2021: rare-event detection in a low-resource language"
seo_title: "Presenting at ICISSP 2021"
date: 2021-02-01
description: "The talk behind the ICISSP 2021 paper: what an agglutinative language does to keyword detection, and what the sample run measured."
categories: technical
tags:
  - security
  - machine-learning
  - publication
permalink: /posts/2021/02/icissp-presentation/
---

I gave [this talk](https://www.youtube.com/watch?v=MTFimNPxAKw&t=25s) at the International Conference on Information Systems Security and Privacy, on the paper I wrote with Prof. Cengiz Acartürk. The full record of the work is on its [publication page](/publication/AutomaticDetectionCyberSecurity); this post is about presenting it.

Two points drew the most discussion in the room.

The first was that the hard part is not the detection step. Turkish is agglutinative, so one stem yields dozens of legal surface forms, and keyword matching reads them as unrelated tokens. The evidence scatters across the vocabulary until there is too little of it per keyword to count. That is solved before detection, by normalising every text through the ITU NLP service, so the preprocessing is part of the detector rather than cleanup around it. The detector itself is deliberately simple: it counts how often each possible target is named per day and flags a day that departs from that target’s own history.

The second was which number to optimise. In a stream where genuine security events are rare, the false-positive term is multiplied by an enormous negative class, so it, rather than recall, decides whether anyone keeps using the system. We stated both criteria up front: detect the reference incident on the day it happened, and stay under thirty percent false positives across the fortnight that followed.

The audience was mostly researchers and practitioners working on security and privacy from both technical and social angles, which made the question of what a detector owes its operator a more interesting conversation than the modelling.
