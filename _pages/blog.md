---
permalink: /blog/
title: "Technical Writing"
author_profile: true
layout: archive
redirect_from:
  - /technical-blog/
  - /blog.html
description: "<p class='ep-lead'>Technical writing on machine-learning security, proof-of-learning, distributed systems, and the engineering of high-reliability software, ..."

---

<p class="ep-lead">Technical writing on machine-learning security, proof-of-learning, distributed systems, and the engineering of high-reliability software, written for ML researchers, senior engineers, and technical leaders. For longer-form parables on the same ideas see the <a href="/essays/">Essays</a>; for a quick overview see the <a href="/lab/">Lab</a>.</p>

{% include base_path %}
{% for post in site.categories.technical %}
  {% include archive-single.html %}
{% endfor %}
