---
permalink: /
layout: splash
title: "Dr. Ozgur Ural"
excerpt: "Secure & distributed machine learning leader"
hero:
  eyebrow: "Secure & Distributed ML Leader"
  title: "Building trustworthy simulation & ML systems."
  subtitle: "I design resilient training platforms and cloud-native ML pipelines that keep flight crews sharp and critical infrastructure safe."
  badges:
    - "11+ years leading software & research teams"
    - "Ph.D. in Secure & Distributed ML (ERAU, 2025)"
    - "IEEE Access author on proof-of-learning security"
  actions:
    - label: "View résumé"
      url: /Ozgur_Ural_PhD_Resume.pdf
      icon: "fa fa-file-alt"
    - label: "Explore projects"
      url: /projects/
      style: inverse
      icon: "fa fa-cubes"
    - label: "Read the blog"
      url: /blog/
      style: light-outline
      icon: "fa fa-newspaper-o"
  image: /images/ozgururalpp.jpg
  image_alt: "Portrait of Dr. Ozgur Ural"
  spotlight:
    title: "Currently"
    description: "Engineering secure full-flight simulator software at Avion while advancing research on resilient proof-of-learning and watermarking."
    link_label: "Let’s collaborate"
    link_url: "mailto:ozgururalnl@gmail.com"
---

<section class="home-section">
  <header class="home-section__header">
    <p class="home-section__eyebrow">Focus</p>
    <h2>What I build</h2>
    <p>I lead teams that transform advanced research into production systems across aerospace simulation, cybersecurity, and applied machine learning.</p>
  </header>
  <div class="feature-card-grid">
    <article class="feature-card">
      <h3>High-reliability simulators</h3>
      <p>Architecting multithreaded C/C++ flight-training platforms that meet strict latency, safety, and certification requirements.</p>
      <ul>
        <li>Real-time communications and deterministic scheduling</li>
        <li>Hardware-in-the-loop integration and automated validation</li>
        <li>Operational support across global training centers</li>
      </ul>
    </article>
    <article class="feature-card">
      <h3>Secure ML pipelines</h3>
      <p>Designing distributed ML services that resist spoofing, tampering, and data leakage from the edge to the cloud.</p>
      <ul>
        <li>Proof-of-learning protocols hardened with model watermarking</li>
        <li>Scala, Python, and TypeScript services on modern DevSecOps stacks</li>
        <li>Continuous delivery with Docker, GitLab CI/CD, and infrastructure as code</li>
      </ul>
    </article>
    <article class="feature-card">
      <h3>Human-centered products</h3>
      <p>Bridging engineering, research, and UX to ship tools that pilots, analysts, and operators genuinely rely on.</p>
      <ul>
        <li>Evidence-based roadmapping and stakeholder alignment</li>
        <li>Data storytelling for executives, regulators, and research partners</li>
        <li>Mentoring engineers and students across three continents</li>
      </ul>
    </article>
  </div>
</section>

<section class="home-section home-section--accent">
  <header class="home-section__header">
    <p class="home-section__eyebrow">Impact snapshot</p>
    <h2>Signals of trust</h2>
    <p>From the lab to the cockpit, I focus on measurable outcomes that compound.</p>
  </header>
  <dl class="stats-grid">
    <div>
      <dt>11+</dt>
      <dd>years shipping production-grade software</dd>
    </div>
    <div>
      <dt>5x</dt>
      <dd>peer-reviewed publications on secure ML and cybersecurity</dd>
    </div>
    <div>
      <dt>4</dt>
      <dd>critical training platforms launched across two continents</dd>
    </div>
    <div>
      <dt>∞</dt>
      <dd>curiosity for systems that blend research rigor with operational excellence</dd>
    </div>
  </dl>
</section>

<section class="home-section">
  <header class="home-section__header">
    <p class="home-section__eyebrow">Featured writing & talks</p>
    <h2>Stay ahead with my latest thinking</h2>
    <p>Deep dives on proof-of-learning, simulator engineering, and building teams that deliver secure experiences.</p>
  </header>
  <div class="home-posts">
    {% assign latest_posts = site.posts | slice: 0, 3 %}
    {% for post in latest_posts %}
      <article class="home-post-card">
        <a class="home-post-card__link" href="{{ post.url | relative_url }}">
          <p class="home-post-card__meta">{{ post.date | date: "%b %d, %Y" }}</p>
          <h3>{{ post.title }}</h3>
          {% if post.excerpt %}
            <p class="home-post-card__excerpt">{{ post.excerpt | strip_html | truncate: 150 }}</p>
          {% endif %}
          <span class="home-post-card__cta">Read the story <i class="fa fa-arrow-right" aria-hidden="true"></i></span>
        </a>
      </article>
    {% endfor %}
  </div>
  <div class="home-posts__actions">
    <a class="btn" href="/blog/">Browse technical posts</a>
    <a class="btn btn--inverse" href="/life/">Visit the life blog</a>
  </div>
</section>

<section class="home-section">
  <header class="home-section__header">
    <p class="home-section__eyebrow">Career highlights</p>
    <h2>Quick summary</h2>
    <p>Core themes that run through my work.</p>
  </header>
  <div class="highlights-grid">
    <article>
      <h3>Engineering leadership</h3>
      <p>Drive cross-functional teams that own architecture, delivery, and uptime for mission-critical software.</p>
    </article>
    <article>
      <h3>Academic rigor</h3>
      <p>Ph.D. research spanning proof-of-learning, watermarking, and blockchain-enhanced ML with real-world deployments.</p>
    </article>
    <article>
      <h3>Community impact</h3>
      <p>Mentor engineers, teach university courses, and speak about responsible AI and secure systems.</p>
    </article>
  </div>
</section>

<section class="home-section">
  <header class="home-section__header">
    <p class="home-section__eyebrow">Latest updates</p>
    <h2>Recent milestones</h2>
  </header>
  <ol class="timeline">
    <li>
      <h3>August 2025</h3>
      <p>Graduated with a Ph.D. in Electrical Engineering and Computer Science (ERAU). Dissertation: “Enhancing Proof-of-Learning Security Against Spoofing Attacks Using Model Watermarking.” <a href="https://commons.erau.edu/edt/905/">Read the dissertation</a>.</p>
    </li>
    <li>
      <h3>July 2025</h3>
      <p>Successfully defended my Ph.D. dissertation on resilient proof-of-learning.</p>
    </li>
    <li>
      <h3>November 2024</h3>
      <p>Published <em>“Enhancing Security of Proof-of-Learning against Spoofing Attacks Using Feature-Based Model Watermarking”</em> in IEEE Access. <a href="https://ieeexplore.ieee.org/abstract/document/10741282">Read the article</a>.</p>
    </li>
    <li>
      <h3>December 2023</h3>
      <p>Co-authored the IEEE Access survey <em>“Survey on Blockchain-Enhanced Machine Learning.”</em> <a href="https://ieeexplore.ieee.org/abstract/document/10366252">Read the survey</a>.</p>
    </li>
    <li>
      <h3>May 2022</h3>
      <p>Passed the Ph.D. qualifying exam, moving into dissertation research full time.</p>
    </li>
    <li>
      <h3>May 2021</h3>
      <p>Published <em>“Automatic Detection of Cyber Security Events from Turkish Twitter Stream and Newspaper Data”</em> at ICISSP. <a href="https://www.scitepress.org/PublishedPapers/2021/102016/102016.pdf">Read the paper</a>.</p>
    </li>
  </ol>
</section>

<section class="home-section home-section--closing">
  <div class="closing-card">
    <h2>Let’s build the next secure system together</h2>
    <p>Whether you need a trusted advisor for resilient ML, a speaker for your event, or a hands-on leader for mission-critical software, I’d love to connect.</p>
    <div class="closing-card__actions">
      <a class="btn" href="mailto:ozgururalnl@gmail.com">Email me</a>
      <a class="btn btn--light-outline" href="https://www.linkedin.com/in/uralozgur/">Connect on LinkedIn</a>
    </div>
  </div>
</section>
