---
title: "Ringof's Notebook — radios, hardware, and works in progress"
description: >-
  A serial workbench notebook from ringof: progress notes on whatever
  is on the bench.
permalink: /notebook/
---

# Notebook

<p class="lede">
Progress notes from the bench. What I built this week, what fought back, and
the small wins worth writing down. Kept short and honest.
</p>

<ul class="post-list">
{% for post in site.posts %}
  <li class="post-list-item">
    <a class="post-list-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
    <time class="post-list-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %-d, %Y" }}</time>
    {%- if post.excerpt %}<p class="post-list-excerpt">{{ post.excerpt | strip_html | truncatewords: 32 }}</p>{% endif -%}
  </li>
{% endfor %}
</ul>
