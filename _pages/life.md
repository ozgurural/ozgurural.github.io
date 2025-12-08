---
permalink: /life/
title: "Perspectives & Leadership"
author_profile: true
layout: archive
---

Lessons on leadership, culture, and resilience drawn from beyond the engineering terminal.

{% include base_path %}
{% for post in site.categories.life %}
  {% include archive-single.html %}
{% endfor %}
