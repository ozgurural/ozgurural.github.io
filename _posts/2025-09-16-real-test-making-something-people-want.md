---
title: "The Real Test for Making Something People Want"
date: 2025-09-16
permalink: /posts/2025/09/real-test-making-something-people-want/
categories: technical
tags:
  - product
  - testing
  - startups
---

Scaling conversations dominate startup culture, yet the first question any product must answer is painfully small: will even one person use it when given the chance? The only reliable way to find out is through direct observation. This principle is at the heart of evidence based design, a methodology grounded in human computer interaction research that emphasizes empirical feedback over speculation (Nielsen, 1993). Surveys and interviews hint at preferences, but behavior reveals intent. If your prototype cannot hold the attention of a single user, no amount of marketing will redeem it.

A prototype functions as an experimental apparatus. Eric Ries popularized the concept of the minimum viable product, but academic design literature has long advocated for quick, low fidelity iterations that expose misunderstandings early (Ries, 2011; Snyder, 2003). The goal is not to impress but to learn. Whether the prototype is a paper mock up or a functional script, instrument it to capture interaction data. Event logs, screen recordings, and think aloud protocols transform anecdotal feedback into analyzable evidence.

When we introduced a new diagnostics console for Avion’s Level D simulators, we ran informal usability sessions with instructors before writing production code. Their first instinct was to ignore our polished charts and head straight for raw log streams. Watching them struggle forced us to redesign the navigation and add a “flight mode” that surfaced the single metric they checked during line checks. That single observation saved weeks of building the wrong interface.

Interpreting that evidence requires rigor. Small sample sizes are unavoidable in early stages, making qualitative methods particularly valuable. Techniques such as contextual inquiry and cognitive walkthroughs help teams identify mismatched mental models between users and the interface (Wharton et al., 1994). When quantitative signals do emerge, click through rates, task completion times, or retention curves, apply statistical tools appropriate for sparse data. Bayesian inference, for example, allows teams to update beliefs about feature utility without waiting for large cohorts.

The emotional challenge is resisting the urge to rescue users during tests. From a methodological perspective, each user’s confusion is a natural experiment. Interfering mid task destroys the data. Instead, document the friction points and analyze them afterward. Affinity diagramming, a technique borrowed from qualitative research, helps aggregate observations into actionable themes. These themes then inform targeted revisions, which are tested again in a tight feedback loop.

As the prototype matures, instrumenting it for longitudinal analysis becomes critical. Cohort studies, tracking how different groups of users engage over time, reveal whether changes actually improve retention or merely shuffle initial impressions. Tools like survival analysis quantify how long users stay active, while power analysis guides decisions about when sample sizes are sufficient for A/B testing (Tullis & Albert, 2013). Thinking like a researcher prevents premature scaling based on noisy data.

Ultimately, the test for whether you are building something people want is not a pitch deck statistic but the unsolicited behavior of real users. When early adopters return to your product without prompting, or when they fabricate workarounds to compensate for missing features, you have evidence of genuine demand. Everything else, fundraising, marketing, viral loops, sits downstream of this validation. Treat each prototype session as a research study, and your product roadmap becomes less about guessing and more about cumulative insight.

**References**

1. Nielsen, J. (1993). *Usability Engineering*. Morgan Kaufmann.
2. Ries, E. (2011). *The Lean Startup*. Crown Business.
3. Snyder, C. (2003). *Paper Prototyping: The Fast and Easy Way to Design and Refine User Interfaces*. Morgan Kaufmann.
4. Tullis, T., & Albert, W. (2013). *Measuring the User Experience: Collecting, Analyzing, and Presenting Usability Metrics*. Morgan Kaufmann.
5. Wharton, C., Rieman, J., Lewis, C., & Polson, P. (1994). The cognitive walkthrough method: A practitioner’s guide. In *Usability inspection methods*.
