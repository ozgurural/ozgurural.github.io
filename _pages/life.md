---
permalink: /life/
title: "Perspectives & Leadership"
author_profile: true
layout: archive
description: "Essays and notes on system architecture, engineering leadership, the academia-to-industry transition, and what twelve years of shipping mission-critical software teaches about building resilient systems."

---
<p class="ep-lead">Essays and notes on system architecture, driving technical excellence, the academia-to-industry transition, and what over a decade of shipping mission-critical software has taught me about building resilient systems. Written more loosely than the <a href="/blog/">technical posts</a>.</p>

{% include base_path %}
{% for post in site.categories.life %}
  {% include archive-single.html %}
{% endfor %}
