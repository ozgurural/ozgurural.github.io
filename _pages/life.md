---
permalink: /life/
title: "Perspectives & Leadership"
author_profile: true
layout: archive
---

<p class="ep-lead">Shorter notes on leadership, engineering culture, the academia-to-industry transition, and the things a decade of shipping mission-critical software has taught me. Written more loosely than the <a href="/blog/">technical posts</a>.</p>

{% include base_path %}
{% for post in site.categories.life %}
  {% include archive-single.html %}
{% endfor %}
