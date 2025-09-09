---
permalink: /life/
title: "Life Blog"
author_profile: true
layout: archive
---

Thoughts and experiences about life abroad, culture, and personal growth.

{% include base_path %}
{% for post in site.categories.life %}
  {% include archive-single.html %}
{% endfor %}
