---
title: "Tags — browse the notebook"
description: >-
  Browse ringof's workbench notebook by tag — radios, SDR, hardware, timing,
  reverse engineering, and the rest.
permalink: /tags/
---

# Tags

<p class="lede">Every notebook post, grouped by tag. Jump to one, or scroll the lot.</p>

{% assign sorted_tags = site.tags | sort %}

<ul class="tag-cloud">
{%- for tag in sorted_tags -%}
  {%- assign slug = tag[0] | slugify -%}
  <li><a class="post-tag" href="#tag-{{ slug }}">#{{ slug }}</a> <span class="tag-count">{{ tag[1] | size }}</span></li>
{%- endfor -%}
</ul>

{% for tag in sorted_tags %}
{%- assign slug = tag[0] | slugify -%}
<h2 id="tag-{{ slug }}">#{{ slug }}</h2>
<ul class="post-list">
{%- for post in tag[1] -%}
  <li class="post-list-item">
    <a class="post-list-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
    <time class="post-list-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %-d, %Y" }}</time>
  </li>
{%- endfor -%}
</ul>
{% endfor %}
