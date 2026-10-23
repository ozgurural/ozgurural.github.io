---
permalink: /lab/cyber-events/
oembed: "/lab/cyber-events/oembed.json"
title: "From Local Reports to Security Alerts"
seo_title: "Security Event Detection from Local-Language Reports"
description: "Turn Turkish posts and news into an investigation queue: learn relevant terms, normalise the language and flag unusual attention around a target."
excerpt: "An interpretable workflow for security analysts: find relevant local-language reports, track unusual activity around named targets and review the evidence behind each alert."
sitemap: true
header:
  og_image: "lab-og/og-cyber-events-film.jpg"
---

<a href="/lab/" class="lab-back"><span>←</span> Back to Research Lab</a>

<section class="lab-card lab-experiment" id="lab-cyb" style="margin-top: 0;">
  <span class="ep-eyebrow">NLP · Security · Low-Resource Languages</span>

  <div class="lab-film">
    <div class="lab-film__frame lab-film__frame--cinema">
      <iframe src="{{ '/films/cyber-events/' | relative_url }}?autoplay=0" title="Hearing an attack in the noise: a narrated film on detecting cyber security events in Turkish" loading="lazy" allow="autoplay; fullscreen" allowfullscreen></iframe>
    </div>

  <div class="lab-lvd">
  <p class="lab-card__lead">A service becomes unreachable. Local users start posting about it, and a news report adds context. Which reports should a security analyst investigate? This workflow turns a stream of Turkish posts and news into <strong>a queue of possible incidents, with source reports to check</strong>.</p>
  <p>From my <a href="/publication/2019-metu-masters-thesis">M.Sc. research at METU</a> with <a href="https://acarturk.net/">Prof. Cengiz Acartürk</a>, published at <a href="/publication/AutomaticDetectionCyberSecurity">ICISSP 2021</a>. The contribution is a working path from language-specific text processing to alerts for analyst review.</p>

  <h2>Where this workflow could help</h2>
  <p><strong>Local incident monitoring.</strong> Follow reports naming an organisation or service and flag unusual attention for investigation. An analyst can check whether people are describing an outage, an attack or an ordinary conversation.</p>
  <p><strong>Threat-intelligence triage.</strong> Bring local-language news and user reports into the same review queue, including warnings about vulnerable applications. The source text gives an analyst evidence to follow up.</p>
  <p><strong>Building a research corpus.</strong> Collect candidate security reports for later review and labelling. The vocabulary and target list can be adjusted to the investigation.</p>
  <p>These are potential uses of the workflow. The published study evaluated a Turkish-language research prototype.</p>

  <aside class="lab-lvd__facts" aria-label="From text to investigation">
    <p class="lab-lvd__facts-title">From text to investigation</p>
    <dl>
      <div><dt>Filter</dt><dd>Use a known incident to find relevant terms and test candidate keywords.</dd></div>
      <div><dt>Normalise</dt><dd>Bring Turkish word forms into a form the detector can match.</dd></div>
      <div><dt>Track</dt><dd>Compare mentions of each named target with its own history.</dd></div>
      <div><dt>Investigate</dt><dd>Review the reports behind an alert before treating it as an incident.</dd></div>
    </dl>
  </aside>
  </div>

  <details class="lab-reveal">
    <summary>How the method works</summary>
    <p><strong>Start from a known incident.</strong> The study began without an annotated Turkish cyber-security corpus. It compared text from before, during and after the nic.tr denial-of-service attack. TF-IDF helped identify candidate terms; keyword tests checked whether adding a term found useful reports without introducing excessive false alarms.</p>
    <p><strong>Make the language matchable.</strong> Turkish builds many word forms through suffixes. Normalising the text through the ITU NLP service lets the detector match forms that would otherwise appear unrelated.</p>
    <p><strong>Look for a change around a target.</strong> In the filtered text, count daily mentions of a predefined organisation, institution or country. Compare each target with a threshold derived from its own history. This makes the alert traceable to the target, the time period and the reports behind it.</p>
    <p><strong>Keep the analyst in the loop.</strong> A message asking whether an account was hacked can contain a security keyword without reporting an incident. An alert starts an investigation; source checking determines what happened.</p>
  </details>

  <details class="lab-reveal">
    <summary>Study scope, limitations and sources</summary>
    <p>The study used historical Turkish Twitter and Hürriyet newspaper data. Its evaluation included confirmed incidents and false alerts, but did not establish how many events were missed. Applying the workflow to another language, source or time period requires fresh evaluation of vocabulary, normalisation and alert thresholds.</p>
    <p>The film illustrates the workflow and reports the original experiment. It is not a comparison against current language models or evidence of a deployed monitoring service. The paper contains the full experimental counts and evaluation criteria.</p>
    <p><a href="https://doi.org/10.5220/0010201600660076">Read the ICISSP paper</a> by Ural and Acartürk, extending the METU M.Sc. thesis. The text processing uses the <a href="https://tools.nlp.itu.edu.tr/">ITU NLP service</a> (<a href="https://doi.org/10.3115/v1/E14-2001">Eryiğit, 2014</a>).</p>
  </details>
  <p class="lab-film__alt"><a href="{{ '/lab/cyber-events/embed/' | relative_url }}" target="_blank" rel="noopener">Explore the original technical animation</a> for the diagrams and formulas behind the workflow.</p>
  </div>
</section>
