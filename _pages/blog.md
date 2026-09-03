---
permalink: /blog/
title: "Field Notes"
author_profile: true
layout: archive
redirect_from:
  - /technical-blog/
  - /blog.html
description: "Field notes on ML security, proof-of-learning, distributed systems, and high-reliability software for researchers, engineers, and technical leaders."

---

<p class="ep-lead">Field notes on ML security, distributed systems, and high-reliability software, written for researchers and engineering leaders. For longer-form parables, see the <a href="/essays/">Essays</a>; for interactive demos, visit the <a href="/lab/">Lab</a>.</p>

{% include base_path %}
{% for post in site.categories.technical %}
  {% include archive-single.html %}
{% endfor %}
