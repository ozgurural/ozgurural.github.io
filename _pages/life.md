---
permalink: /life/
title: "Life Notes"
author_profile: true
layout: archive
classes: wide
entries_layout: grid
excerpt: "Reflections on moving across continents, building community, and living curiously."
---

<div class="archive-intro">
  <p>Stories about life abroad, cultural discoveries, and the rituals that keep me grounded.</p>
</div>

{% include base_path %}
{% assign life_posts = site.categories.life | default: site.posts %}
<div class="grid__wrapper">
{% for post in life_posts %}
  {% include archive-single.html type="grid" %}
{% endfor %}
</div>
