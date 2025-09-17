---
permalink: /blog/
title: "Technical Blog"
author_profile: true
layout: archive
classes: wide
entries_layout: grid
redirect_from:
  - /technical-blog/
  - /blog.html
excerpt: "Deep dives into secure & distributed machine learning, aerospace simulation, and engineering leadership."
toc: false
---

<div class="archive-intro">
  <p>Explore production-grade lessons on secure ML, real-time systems, and leadership patterns from the lab to the flight deck.</p>
  <div class="archive-actions">
    <a class="btn" href="/tags/">Browse by topic</a>
    <a class="btn btn--inverse" href="/feed.xml">Subscribe via RSS</a>
  </div>
</div>

{% include base_path %}
{% assign technical_posts = site.categories.technical | default: site.posts %}
<div class="grid__wrapper">
{% for post in technical_posts %}
  {% include archive-single.html type="grid" %}
{% endfor %}
</div>
