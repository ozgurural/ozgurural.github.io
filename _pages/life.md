---
permalink: /life/
title: "Perspectives & Leadership"
author_profile: true
layout: archive
---

<p class="ep-lead">Notes on leadership, engineering culture, and resilience — drawn from a decade of building teams and shipping critical systems.</p>

{% include base_path %}
{% for post in site.categories.life %}
  {% include archive-single.html %}
{% endfor %}
