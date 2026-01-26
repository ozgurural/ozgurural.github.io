---
title: "Why Great Engineering Teams Run on Curiosity"
date: 2025-09-15
permalink: /posts/2025/09/startups-curiosity/
categories: technical
tags:
  - startups
  - curiosity
  - exploration
---

Working on simulator software, defensive cybersecurity platforms, and doctoral research has taught me that durable progress rarely starts with a perfect roadmap. It starts with persistent curiosity. Loewenstein’s review of the psychology of curiosity describes it as a response to information gaps that push humans to seek missing data rather than settle for superficial explanations (Loewenstein, 1994). On the Avion telemetry team those gaps appeared as cockpit workflows that felt clumsy or metrics that refused to line up with pilot reports. Pulling on those loose threads, asking "why does this feel wrong?", often exposed real product opportunities.

Curiosity also provides a formal justification for exploratory behavior. The classic exploration and exploitation trade-off in reinforcement learning (Sutton & Barto, 1998) mirrors the strategic choice my research group faced when evaluating proof-of-learning defenses: pursue the watermarking variant we already understood or investigate an unproven idea that might harden the protocol. Algorithms such as Upper Confidence Bound and Thompson Sampling operationalize curiosity by rewarding actions that maximize expected information gain. Translating that mindset to engineering meant reserving explicit time each sprint for experiments whose only goal was to learn, even when immediate metrics were inconclusive.

Neuroscience offers additional evidence that curiosity has practical value. Itti and Baldi’s notion of Bayesian surprise formalizes the intuitive feeling of “something interesting is happening” as a measurable deviation from prior expectations (Itti & Baldi, 2009). Our defense software teams lived in environments where prior models were frequently wrong; unexpected log spikes or field reports signaled that our assumptions no longer matched reality. Treating those surprises as data rather than annoyances let us update roadmaps faster than teams that dismissed them as noise.

Curiosity-driven research has long informed technical disciplines. Schmidhuber’s work on intrinsic motivation in artificial agents shows that systems rewarded for reducing prediction error learn more generalizable representations (Schmidhuber, 2008). We adopted a similar ethos by instrumenting products to capture anomalies, sudden drops in latency, unconventional user flows, or edge-case datasets. Each anomaly became a mini research project whose resolution built hard-won institutional knowledge.

Operationalizing curiosity requires structure. I maintain a log of “unsolved puzzles” from simulator deployments, DLP customer escalations, and research experiments. Every week I pick one entry to investigate. Some turn out to be trivial configuration errors; others expose foundational flaws or unexpected opportunities. Over time, the log evolves into a research backlog that complements the product roadmap. The practice resembles the scientific method: hypothesize, experiment, observe, and refine. The goal is not to eliminate uncertainty but to channel it toward discovery.

Finally, curiosity cultivates resilience. When progress is measured solely by shipped features, setbacks are demoralizing. A curiosity-driven team evaluates progress by the depth of understanding gained. Even experiments that fail to produce a deployable feature expand the team’s knowledge of the domain. That knowledge compounds, lowering the cost of future exploration. In the long run, teams that treat curiosity as a core competency navigate ambiguity more effectively than those fixated on immediate returns.

**References**

1. Itti, L., & Baldi, P. (2009). Bayesian surprise attracts human attention. *Vision Research*, 49(10), 1295-1306.
2. Loewenstein, G. (1994). The psychology of curiosity: A review and reinterpretation. *Psychological Bulletin*, 116(1), 75-98.
3. Schmidhuber, J. (2008). Driven by compression progress: A simple theory of curiosity, creativity, and discovery. *Neural Networks*, 21(4), 586-596.
4. Sutton, R. S., & Barto, A. G. (1998). *Reinforcement Learning: An Introduction*. MIT Press.
