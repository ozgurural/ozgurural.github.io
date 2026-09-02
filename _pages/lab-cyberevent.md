---
permalink: /lab/cyber-events/
oembed: "/lab/cyber-events/oembed.json"
title: "Detecting Cyber-Security Events in a Low-Resource Language, animated"
seo_title: "Cyber-Security Event Detection, animated"
description: "Detecting cyber-security events with no labelled corpus: a keyword vector learned from the nic.tr attack, Turkish morphology, and anomalies per entity."
excerpt: "No labelled corpus, so a known incident becomes the training set. Sensitivity and certainty pull against each other, and the scoreboard is published in full: 29 detections, 22 real, 7 false."
sitemap: true
header:
  og_image: "lab-og/og-cyb.png"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-cyb" style="margin-top: 0;">
  <span class="ep-eyebrow">NLP · Security · Low-Resource Languages</span>
  <p class="lab-card__lead">🛰 Security incidents surface publicly before they surface officially: someone posts that a service is unreachable long before a statement is issued. Detecting that in Turkish meant building the system without the thing everyone else starts from: a labelled corpus. This animation follows the actual construction: learning the keyword vocabulary from an incident whose answer is already known (the nic.tr denial-of-service attack of December 2015), pruning it by A/B test on false positives, normalising an agglutinative language so the evidence survives, and detecting events as an <strong>anomaly in how often a named entity is mentioned</strong> rather than as a classifier verdict.</p>
  <div class="lab-card__usecase">
    <strong>Scientific Reference:</strong>
    <span>The author's <a href="/publication/AutomaticDetectionCyberSecurity">"Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Newspaper Data"</a> (Ural &amp; Acartürk, ICISSP 2021, pp. 66–76), extending the <a href="/publication/2019-metu-masters-thesis">M.Sc. thesis</a> completed at METU under <a href="https://acarturk.net/">Prof. Cengiz Acartürk</a>. Two live sources: the Turkish Twitter stream and the Hürriyet newspaper API, feed a multi-process pipeline that normalises through the <a href="https://tools.nlp.itu.edu.tr/">ITU NLP web service</a> (Eryiğit, 2014). Every figure shown in the film is reported in the paper; the software was released open-source under Apache-2.0.</span>
  </div>

  <div class="lab-film">
    <div class="lab-film__frame" id="cyb-film" role="group" aria-label="Animated explainer: keyword-vector construction, Turkish morphological normalisation, and anomaly-based event detection"></div>
  </div>

  <p class="lab-film__legend" role="img" aria-label="Colour key: grey=ordinary document, rose=event day and false positive, green=accepted keyword and true positive, amber=threshold">
    <span><i style="background:#888888"></i> ordinary document</span>
    <span><i style="background:#fc6255"></i> event day · false positive</span>
    <span><i style="background:#83C167"></i> accepted keyword · true positive</span>
    <span><i style="background:#fbbf24"></i> threshold · two-week window</span>
  </p>

  <details class="lab-reveal" open>
    <summary>🧠 What did you just learn?</summary>
    <p><strong>No labelled corpus, so the incident becomes the training set.</strong> There is no annotated Turkish cyber-security dataset to learn from. The way around it is to pick an incident whose answer is already known: the nic.tr denial-of-service attack of 14 December 2015, and pull three corpora around it: 2,310 tweets from the quiet year before, 28 from the attack day itself, and roughly 400 from the fortnight after. TF-IDF across those tells you which terms genuinely separate an attack from ordinary Turkish.</p>
    <p><strong>Every candidate keyword is then A/B tested on false positives.</strong> A term enters the vector only if it raises detections without flooding the analyst's queue. That is the correct thing to optimise here: in a rare-event problem the false-positive term is multiplied by an enormous negative class, so it, not recall, is what decides whether anyone keeps using the tool.</p>
    <p><strong>The vector is squeezed from both sides.</strong> Too many keywords and the system ingests more documents than it can process while false positives climb, so <em>certainty</em> falls. Too few and events are missed, or noticed days late instead of on the attack day, so <em>sensitivity</em> falls. No setting maximises both, which is why the paper pins both down as acceptance criteria in advance: detect nic.tr on the day, and stay under 30% false positives over the following two weeks. Both were met.</p>
    <p><strong>Turkish decides how much evidence survives preprocessing.</strong> The language is agglutinative: meaning is built by stacking suffixes, so one stem yields a combinatorial family of surface forms that keyword matching sees as unrelated tokens. Every document is normalised through the ITU NLP web service before detection. In a low-resource setting this step moves the result more than the choice of model does.</p>
    <p><strong>Detection is an anomaly, not a verdict.</strong> A named-entity vector lists what can be attacked (institutions, government organisations, countries) and each entity's daily mention count is compared against a threshold derived from its own history. On 14 December 2015 mentions of nic.tr jumped from a background of two or three to 28. No classifier is asked whether that constitutes an attack; the deviation is the signal.</p>
    <p><strong>And the scoreboard is published, not rounded away.</strong> A sample run over 437 documents (186 tweets and 251 Hürriyet articles) produced 29 detections: 22 real and 7 false, about 76% success. The paper prints its failure mode too: the keyword "hacklendi" firing on an everyday message asking whether someone's account was compromised, which describes no event at all. Reporting the false positives alongside the hits is what makes the number worth anything.</p>
  </details>

  <details class="lab-reveal">
    <summary>📐 The math, precisely</summary>
    <div class="lab-math" data-role="cyb-appendix">
      <p>Rendered on load. If equations appear as raw text, your browser blocked the math font CDN.</p>
    </div>
  </details>
</section>

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkQWkzuo3B5mTepMUcHkMB5jZaolc2xDwL6VFqjFALcbeS9Ggm/Yr2r3Dy4lfFg" crossorigin="anonymous"></script>
<script defer src="{{ '/assets/js/lab-anim.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
<script defer src="{{ '/assets/js/lab-films/cyberevent.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
