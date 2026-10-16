---
permalink: /
title: "ML Research & Software Architecture"
hide_title: true
excerpt: "Dr. Ozgur Ural: Senior Software Engineer working on ML security research, software architecture and enterprise AI. U.S. Ph.D. and three first-author IEEE Access papers."
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Dr. Ozgur Ural",
  "honorificPrefix": "Dr.",
  "jobTitle": {{ site.data.person.job_title | jsonify }},
  "description": "Senior Software Engineer at Avion, leading enterprise AI strategy and researching training verification, model ownership and adversarial robustness. Ph.D. in Electrical Engineering and Computer Science, Embry-Riddle Aeronautical University, USA; three first-author IEEE Access papers.",
  "url": "https://ozgurural.github.io",
  "image": "https://ozgurural.github.io/images/ozgururalpp.webp",
  "email": "drozgurural@gmail.com",
  "alumniOf": [
    { "@type": "CollegeOrUniversity", "name": "Embry-Riddle Aeronautical University", "url": "https://erau.edu" },
    { "@type": "CollegeOrUniversity", "name": "Middle East Technical University", "url": "https://www.metu.edu.tr/" }
  ],
  "worksFor": { "@type": "Organization", "name": "Avion Full Flight Simulators", "url": "https://www.aviongroup.aero/" },
  "knowsAbout": {{ site.data.person.knows_about | jsonify }},
  "sameAs": [
    "https://scholar.google.com/citations?user=lYx8fqsAAAAJ",
    "https://orcid.org/0000-0003-1329-4303",
    "https://www.researchgate.net/profile/Ozgur-Ural",
    "https://twitter.com/ozgurural",
    "https://github.com/ozgurural"
  ]
}
</script>
<!-- Ambient constellation is rendered site-wide via #tsparticles (see
     _layouts/default.html + particles-config.js). The page is ordered for a
     reader from industry: the problem space and what was built first, the
     research agenda with its evidence, then experience; the full publication
     record lives on /publications/. -->

<section class="ep-hero">
  <span class="ep-eyebrow">ML security · Model provenance · Distributed systems</span>
  <h1 class="ep-hero__title"><span class="accent">Machine learning research.</span><br>Software architecture.</h1>
  <p class="ep-hero__lede">
    I'm <strong>Dr. Ozgur Ural</strong>. I research how to verify a model's training and ownership, and design software architectures for enterprise AI. My background combines a U.S. Ph.D., three first-author IEEE Access papers and twelve years of software engineering. At Avion, I lead the enterprise AI strategy and reference architecture.
  </p>
  <div class="ep-hero__cta">
    <a href="/publications/"><i class="fas fa-book-open" aria-hidden="true"></i> Read my research</a>
    <a href="/projects/">Architecture &amp; projects</a>
  </div>
</section>

## Selected research &amp; architecture

<ul class="ep-cards ep-cards--two">
  <li>
    <div class="meta">2025 · IEEE Access</div>
    <h3 class="title"><a href="/publication/2025-secureproofoflearning">SecurePoL: Watermarking + Proof-of-Learning</a></h3>
    <p class="desc">Defends proof-of-learning against spoofing by making verification depend on a feature-based model watermark as well.</p>
  </li>
  <li>
    <div class="meta">2026 · Avion · Architecture</div>
    <h3 class="title"><a href="/enterprise-ai-architecture.html">Enterprise AI strategy and reference architecture</a></h3>
    <p class="desc">The adoption roadmap and reference architecture I wrote for Avion, spanning on-premises inference, governed cloud APIs and edge workloads. The design distinguishes prototypes from proposed capabilities.</p>
  </li>
  <li>
    <div class="meta">2024 · IEEE Access</div>
    <h3 class="title"><a href="/publication/2024-ieee-access-watermarking">Model watermarking for Proof-of-Learning</a></h3>
    <p class="desc">Studies how feature-based model watermarking can strengthen proof-of-learning against spoofing attacks.</p>
  </li>
  <li>
    <div class="meta">2023 · IEEE Access · Survey</div>
    <h3 class="title"><a href="/publication/2023-ieee-access-survey">Survey on Blockchain-Enhanced Machine Learning</a></h3>
    <p class="desc">Reviews the design space where distributed ledgers meet learning systems.</p>
  </li>
</ul>

## Research agenda {#research-agenda}

<p class="ep-pillars__note">Training evidence, adversarial robustness and the conditions for using learned systems in practice. Published work and open directions are identified below.</p>

<ol class="ep-agenda">
  <li>
    <span class="ep-agenda__status">Published · IEEE Access 2023–2025 · Ph.D. 2025</span>
    <h3>Proving how a model was trained, and who owns it</h3>
    <p>Models are bought, fine-tuned and shipped by people who did not train them. Proof-of-learning lets a trainer show the training was really done; a watermark lets an owner show a model is theirs. Each can be forged on its own.</p>
    <p class="ep-agenda__done">My dissertation and SecurePoL study combine the two, so verification succeeds only when the training record and the watermark agree, and evaluate the result against specified spoofing attacks. <a href="/publications/">Publications</a></p>
  </li>
  <li>
    <span class="ep-agenda__status">Published · IEEE Access 2024–2025</span>
    <h3>Testing security claims against an adversary</h3>
    <p>A verifier can accept a plausible training record that was never honestly produced. A watermark can also be attacked. The useful question is which attacks a defence withstands, under which assumptions and at what cost.</p>
    <p class="ep-agenda__done">My research studies spoofing attacks on proof-of-learning and the use of model watermarking to strengthen verification. <a href="/publication/2024-ieee-access-watermarking">Watermarking study</a> · <a href="/publication/2025-secureproofoflearning">SecurePoL</a></p>
  </li>
  <li>
    <span class="ep-agenda__status">Open research direction of the author, not yet published</span>
    <h3>From model quality to system-level evidence</h3>
    <p>Accuracy alone does not establish that a learned component is useful inside a larger system. Timing, the freshness of its inputs and the behaviour when it is unavailable also need to be evaluated.</p>
    <p class="ep-agenda__done">I am exploring these questions through an executable architecture experiment with asynchronous inference, expiry checks and fallback. <a href="/lab/determinism/">AI Meets the Deadline</a> states the model's assumptions and separates synthetic traces from measured results.</p>
  </li>
</ol>

## Technical leadership &amp; research practice

<ul class="ep-pillars">
  <li class="ep-pillar">
    <span class="ep-pillar__tag">Engineering Leadership</span>
    <h3>Direction, standards, teams</h3>
    <p>I lead Avion's enterprise AI strategy: the adoption roadmap and the reference architecture behind it. Before that I built mission-critical UAV software at STM and led the engineering team that shipped Havelsan's data-leakage-prevention product.</p>
  </li>
  <li class="ep-pillar">
    <span class="ep-pillar__tag">Research Engineering</span>
    <h3>From a question to an experiment</h3>
    <p>Hands-on research in proof-of-learning and model watermarking, backed by twelve years building software in security, distributed systems and simulation. I use that engineering experience to turn research questions into implementations that can be inspected and tested.</p>
  </li>
  <li class="ep-pillar">
    <span class="ep-pillar__tag">Security, then ML Security</span>
    <h3>Thinking like the attacker</h3>
    <p>Seven years building security products (Comodo's secure web gateway and patch manager, Havelsan's DLP) before turning to ML security. A model earns trust by surviving contact with an adversary, not by scoring well on a clean test set.</p>
  </li>
  <li class="ep-pillar">
    <span class="ep-pillar__tag">Research into Practice</span>
    <h3>Evidence a product team can use</h3>
    <p>I turn a research question into something a team can judge: reproducible experiments, working prototypes, and explainers for non-specialists, like the films in the <a href="/lab/">Research Lab</a>.</p>
  </li>
</ul>

## Experience

<ol class="ep-timeline">
  <li>
    <span class="when">2023–now</span>
    <span class="what"><strong>Senior Software Engineer, <a href="https://www.aviongroup.aero/">Avion Full Flight Simulators</a>.</strong> Real-time simulation platforms and cloud-native infrastructure for Level D flight simulators. Since 2026 also the company's AI adoption roadmap and enterprise reference architecture, the platform presenting it, and engineering-knowledge retrieval prototypes.</span>
  </li>
  <li>
    <span class="when">2021–2025</span>
    <span class="what"><strong>Ph.D. in Electrical Engineering &amp; Computer Science, Embry-Riddle Aeronautical University</strong> (Graduate Research Assistant). Dissertation: <em>Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model Watermarking</em>, guided by Dr. Kenji Yoshigoe (Committee Chair) and IEEE Fellow <a href="https://informationsystems.umbc.edu/home/faculty-and-staff/new-faculty-spotlights/houbing-herbert-song/">Dr. Houbing Song</a>. Three first-author IEEE Access papers, including SecurePoL (December 2025) with Dr. Yoshigoe after graduation. <a href="https://commons.erau.edu/edt/905/">Dissertation</a> · <a href="https://www.parchment.com/u/award/f48bdb435249f1ac871ed66e818ef1ae">Verify diploma</a>.</span>
  </li>
  <li>
    <span class="when">2020–2021</span>
    <span class="what"><strong>Software Team Lead, <a href="https://www.havelsan.com/en">Havelsan</a>.</strong> Led a 14-engineer team delivering the <a href="https://www.havelsan.com.tr/en/sectors/cyber-security/cyber-security/products/havelsan-dlp"><em>Havelsan DLP</em></a> data leakage prevention product for defence and government clients.</span>
  </li>
  <li>
    <span class="when">2019–2020</span>
    <span class="what"><strong>Expert Software Engineer, <a href="https://www.stm.com.tr/en">STM Defence Technologies</a>.</strong> Mission-control and ground-control systems for <a href="https://www.stm.com.tr/en/kargu-autonomous-tactical-multi-rotor-attack-uav"><em>Kargu</em></a>, STM's rotary-wing loitering munition in service with the Turkish Armed Forces, and the <a href="https://www.stm.com.tr/en/togan-multi-rotor-uas"><em>Togan</em></a> reconnaissance UAV. Hard-real-time and safety-critical, where a missed deadline is a mission failure.</span>
  </li>
  <li>
    <span class="when">2014–2019</span>
    <span class="what"><strong>Expert Software Engineer, <a href="https://www.comodo.com">Comodo Cybersecurity</a>.</strong> The <a href="https://cdome.comodo.com/">Comodo Dome Secure Web Gateway</a>, the enterprise <a href="https://www.itarian.com/patch-management.php">Patch Manager</a> and the Chromium-based <a href="https://www.comodo.com/home/browsers-toolbars/browser.php">Dragon browser</a>, leading the design and development of Windows services and applications in C++.</span>
  </li>
  <li>
    <span class="when">2010–2014</span>
    <span class="what"><strong>B.Sc. in Computer Engineering, <a href="https://www.metu.edu.tr/">Middle East Technical University (METU)</a>.</strong> Turkey's most selective computer engineering program (English-medium), entered among roughly the top 1,000 of more than 2 million national candidates. Graduated with <strong>1st prize</strong> at <a href="https://www.tubitak.gov.tr">TÜBİTAK</a>'s national project competition and <strong>2nd prize</strong> at the METU CENG graduation Demo Day.</span>
  </li>
</ol>

## Peer Review & Service

- **Program Committee Member**, *2nd Workshop on NLP Applied to Information and Cyber Security (NLPAICS 2026)*, University of Alicante. [Conference](https://nlpaics2026.gplsi.es/)
- **Journal Referee**, *IEEE Access*, and other peer-reviewed journals in ML security, privacy and distributed systems
- **Reviewer**, IEEE and ACM conferences in security, machine learning and distributed systems
