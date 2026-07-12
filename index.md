---
title: "ringof blog"
description: >-
  ringof builds open-source radio projects and keeps a blog notebook.
permalink: /
---

I build radios and things to support them — mostly open-source, mostly for
the joy of getting something to work. This is where I keep notes on what's on the
bench, in the hope that some of it saves you an afternoon or the whole project.

I like things you can hold: a receiver that pulls signals out of the air, a board
that turns USB into light, a clock steady enough to trust. I also like to save a
bit of money, where a good hack can do, we do!

Some of it is finished, most of it is in progress, and a fair bit fought back
before it behaved. I explain it like a friend at the workbench — plainly, and 
without pretending it was easy.

If you'd rather jump straight in: the **[RX888 mk2 SDR stack](/rx888/)** is the
most complete thing here, and the **[notebook](/notebook/)** has the running
account of everything else.

## Fresh ink in the notebook

<ul class="post-list post-list--home">
{% for post in site.posts limit:3 %}
  <li class="post-list-item">
    <a class="post-list-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
    <time class="post-list-date" datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%B %-d, %Y" }}</time>
    {%- if post.excerpt %}<p class="post-list-excerpt">{{ post.excerpt | strip_html | truncatewords: 26 }}</p>{% endif -%}
  </li>
{% endfor %}
</ul>

<p><a href="/notebook/">Read the whole notebook →</a></p>

## What's on the bench

<div class="project-grid">

<div class="project-card" markdown="1">

### [The RX888 mk2 SDR stack](/rx888/)

An open-source software stack for the RX888 mk2 direct-sampling HF receiver:
Cypress FX3 **firmware**, the **`librx888`** host library and CLI tools, and a
**GNU Radio 3.10** source block. Three MIT-licensed repos that turn the raw
hardware into a receiver you can actually use on Linux.

</div>

<div class="project-card" markdown="1">

### [USB3-to-fiber link](https://github.com/ringof/usb3-fiber)

A KiCad 8 board that carries USB 3.0 over optical fiber — for getting a noisy
computer far away from a quiet antenna without dragging the hash along with it.

</div>

<div class="project-card" markdown="1">

### [Precision timing bench](https://github.com/ringof/timing-bench)

Scripts and plots for standing up a precision time-and-frequency workbench —
disciplining a reference, measuring how far off it is, and drawing the picture
that tells you.

</div>

<div class="project-card" markdown="1">

### [Loop rotator &amp; tuner](https://github.com/ringof/loop_rotator_tuner)

Arduino firmware for a motor-driven magnetic loop antenna — rotate it, tune it,
and stop fiddling with the capacitor by hand. Born at a Tuesday-night workshop.

</div>

<div class="project-card" markdown="1">

### [More on GitHub](https://github.com/ringof?tab=repositories)

EM simulation with openEMS, IMU magnetometer calibration, a FIT-file ride
analyzer, and the usual drift of small experiments. Have a poke around.

</div>

</div>

I'm glad you stopped by. Pull up a stool.
