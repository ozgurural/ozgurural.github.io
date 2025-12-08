---
permalink: /blog/
title: "Blog"
author_profile: true
layout: archive
redirect_from:
  - /technical-blog/
  - /blog.html
---


Here you'll find deep dives into machine learning security, proof-of-learning protocols, distributed systems, flight simulation software, and engineering best practices. Whether you're a researcher, engineer, or curious technologist, I hope these posts spark new ideas.


{% include base_path %}
{% for post in site.categories.technical %}
  {% include archive-single.html %}
{% endfor %}
