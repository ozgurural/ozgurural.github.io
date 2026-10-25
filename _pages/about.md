---
permalink: /
title: "Trustworthy AI for Mission-Critical Systems"
hide_title: true
excerpt: "Machine learning research scientist and senior software engineer: trustworthy AI for mission-critical systems. U.S. Ph.D., three first-author IEEE Access papers."
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
  "description": "Machine learning research scientist and senior software engineer at Avion working on trustworthy AI for mission-critical systems: verifiable training and model provenance, adversarial robustness, and AI inside real-time loops. Ph.D. in Electrical Engineering and Computer Science, Embry-Riddle Aeronautical University, USA; three first-author IEEE Access papers.",
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
  <span class="ep-eyebrow">Trustworthy AI · ML security · Real-time &amp; safety-critical systems</span>
  <h1 class="ep-hero__title"><span class="accent">Trustworthy AI</span><br>for mission-critical systems.</h1>
  <p class="ep-hero__lede">
    I'm <strong>Dr. Ozgur Ural</strong>, a machine learning research scientist and senior software engineer at <a href="https://www.aviongroup.aero/">Avion</a>, where I build real-time software for Level D flight simulators and lead the company's AI strategy and reference architecture. My research asks what it takes to trust a model: evidence of how it was trained and who owns it, robustness against attackers, and predictable timing when it runs inside a real-time loop.
  </p>
  <p class="ep-hero__status">
    <span class="ep-status-dot" aria-hidden="true"></span>
    <span>Leiden, Netherlands. Interested in research scientist roles in ML and AI, and open to research collaboration, advisory and speaking.</span>
  </p>
  <div class="ep-hero__cta">
    <a href="#research-agenda"><i class="fas fa-book-open" aria-hidden="true"></i> Research agenda</a>
    <a href="/projects/">Architecture &amp; projects</a>
    <a href="mailto:drozgurural@gmail.com"><i class="fas fa-envelope" aria-hidden="true"></i> Get in touch</a>
  </div>
</section>

## Selected research &amp; architecture

<ul class="ep-cards ep-cards--two">
  <li>
    <a class="media" href="/lab/training-fingerprint/" tabindex="-1" aria-hidden="true"><img src="/images/cards/securepol.webp" alt="" width="640" height="336" loading="lazy" decoding="async"><span class="media__badge media__badge--play">Film · 2:02</span></a>
    <div class="meta">2025 · IEEE Access</div>
    <h3 class="title"><a href="/publication/2025-secureproofoflearning">SecurePoL: Watermarking + Proof-of-Learning</a></h3>
    <p class="desc">Defends proof-of-learning against spoofing by making verification depend on a feature-based model watermark as well. <a href="/lab/training-fingerprint/">Watch SecurePoL</a>.</p>
  </li>
  <li>
    <a class="media" href="/enterprise-ai-architecture.html" tabindex="-1" aria-hidden="true"><img src="/images/cards/enterprise-ai.webp" alt="" width="640" height="336" loading="lazy" decoding="async"><span class="media__badge">Interactive</span></a>
    <div class="meta">2026 · Avion · Architecture</div>
    <h3 class="title"><a href="/enterprise-ai-architecture.html">Enterprise AI strategy and reference architecture</a></h3>
    <p class="desc">The adoption roadmap and reference architecture I wrote for Avion, spanning on-premises inference, governed cloud APIs and edge workloads. The design distinguishes prototypes from proposed capabilities.</p>
  </li>
  <li>
    <a class="media" href="/lab/level-d-60hz/" tabindex="-1" aria-hidden="true"><img src="/images/cards/level-d.webp" alt="" width="640" height="336" loading="lazy" decoding="async"><span class="media__badge media__badge--play">Film · 4:40</span></a>
    <div class="meta">2026 · Research film</div>
    <h3 class="title"><a href="/lab/level-d-60hz/">Inside a Level D flight simulator</a></h3>
    <p class="desc">How a certified simulator earns a pilot's trust, and what a learned model would have to keep to run inside its real-time loop. Every rule is cited from the regulation text.</p>
  </li>
  <li>
    <a class="media" href="/lab/blockchain-ml/" tabindex="-1" aria-hidden="true"><img src="/images/cards/blockchain-ml.webp" alt="" width="640" height="336" loading="lazy" decoding="async"><span class="media__badge media__badge--play">Film · 1:50</span></a>
    <div class="meta">2023 · IEEE Access · Survey</div>
    <h3 class="title"><a href="/publication/2023-ieee-access-survey">Survey on Blockchain-Enhanced Machine Learning</a></h3>
    <p class="desc">Reviews the design space where distributed ledgers meet learning systems. <a href="/lab/blockchain-ml/">Watch collaborative AI</a>.</p>
  </li>
</ul>

## Research agenda {#research-agenda}

<p class="ep-pillars__note">Three questions, each from a system that has to work the first time. For each: the problem, what I have built or shown, and where it stands.</p>

<ol class="ep-agenda">
  <li>
    <span class="ep-agenda__status">Published · IEEE Access 2023–2025 · Ph.D. 2025</span>
    <h3>Proving how a model was trained, and who owns it</h3>
    <p>Models are bought, fine-tuned and shipped by people who did not train them. Proof-of-learning lets a trainer show the training was really done; a watermark lets an owner show a model is theirs. Each can be forged on its own.</p>
    <p class="ep-agenda__done">My dissertation and SecurePoL study combine the two, so verification succeeds only when the training record and the watermark agree, and evaluate the result against specified spoofing attacks. <a href="/publications/">Publications</a></p>
  </li>
  <li>
    <span class="ep-agenda__status">Open research direction of the author, not yet published</span>
    <h3>AI inside real-time, safety-critical loops</h3>
    <p>A flight simulator answers the pilot within 150 milliseconds, sixty times a second, for hours, and is certified on it. Learned models can make it more realistic, but their timing depends on the input and on whatever shares the processor.</p>
    <p class="ep-agenda__done">Twelve years of hard-real-time and simulator software, from UAV mission control at STM to Level D simulators at Avion, behind one claim: a model earns a place in the loop only if every frame stays on time. <a href="/lab/level-d-60hz/">The argument, as a film</a> · <a href="/lab/determinism/">an architecture experiment</a> with asynchronous inference, expiry checks and fallback.</p>
  </li>
  <li>
    <span class="ep-agenda__status">In industry · Avion, 2026</span>
    <h3>Generative AI an engineering company can govern</h3>
    <p>In an engineering company the useful knowledge sits in its own documents and processes, and an AI system has to respect where that data is allowed to go.</p>
    <p class="ep-agenda__done">I wrote Avion's AI adoption roadmap and a reference architecture spanning on-premises inference, governed cloud APIs and edge workloads, and built engineering-knowledge retrieval prototypes. <a href="/projects/">Projects</a> separates what is built from what is proposed.</p>
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
    <span class="ep-pillar__tag">Real-time &amp; Fault-Tolerant Systems</span>
    <h3>Correct on time, and when parts fail</h3>
    <p>Real-time simulator software and the services around it (C, C++, Scala, TypeScript, gRPC), including a telemetry pipeline that sustains about 50 GB/s through batching and bounded-queue backpressure.</p>
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
    <span class="what"><strong>Ph.D. in Electrical Engineering &amp; Computer Science, Embry-Riddle Aeronautical University</strong> (Graduate Research Assistant). Dissertation: <em>Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model Watermarking</em>, guided by Dr. Kenji Yoshigoe (Committee Chair) and IEEE Fellow <a href="https://umbc.edu/academics/faculty/houbing-song/">Dr. Houbing Song</a>. Three first-author IEEE Access papers, including SecurePoL (December 2025) with Dr. Yoshigoe after graduation. <a href="https://commons.erau.edu/edt/905/">Dissertation</a> · <a href="https://www.parchment.com/u/award/f48bdb435249f1ac871ed66e818ef1ae">Verify diploma</a>.</span>
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
