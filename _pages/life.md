---
permalink: /life/
title: "Personal"
author_profile: true
layout: archive
description: "Personal notes by Dr. Ozgur Ural: the Ph.D. years in Florida, living in the US and the Netherlands, and sailing with the METU team."

---
<p class="ep-lead">Notes from outside work: the Ph.D. years in Florida, living in the US and then the Netherlands, and racing with the METU sailing team. The technical writing is in the <a href="/blog/">field notes</a>.</p>

{% include base_path %}
{% for post in site.categories.life %}
  {% include archive-single.html %}
{% endfor %}
