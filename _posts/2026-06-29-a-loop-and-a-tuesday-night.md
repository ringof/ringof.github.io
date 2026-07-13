---
layout: post
title: "A loop, a stepper, and a Tuesday night"
date: 2026-06-29
tags: [antennas, workshop]
description: >-
  Notes on a motor-driven magnetic loop antenna — an Arduino, a stepper, and a
  tuning capacitor that no longer needs a hand on it.
---

This is a CLASSIC post from work I did 6 years ago with my friends at Len Long's
Tuesday Night Workshop. **Len W1ZTL** my eternal thanks for the space and comraderie
you've provided in your home all these years!

A magnetic loop is an attractive antenna for a small space and a terrible one to
tune. The bandwidth is razor-thin, which is exactly why it's quiet — and
exactly why you spend the evening with one hand out over the knob of the vacuum 
variable capacitor, nudging it a hair at a time and constantly zooming past the low SWR point!

So a few of us took it on as a [Tuesday-night workshop
project](https://github.com/ringof/loop_rotator_tuner): let an Arduino do the
work.

The idea is not clever, which is the best kind of idea. A stepper motor turns
the tuning capacitor. A second motor rotates the loop to null out an
interferer. An Arduino sits in the middle taking commands, and that's the whole
plot. The interesting part was never the code — it was the mechanics. A tuning
cap wants to be turned *gently* and *repeatably*, and a stepper coupled through
a bit of backlash is neither until you make it so.

What I learned, in the order the loop taught me:

- **Backlash is the enemy of repeatability.** The same step count has to land
  on the same capacitance every time, or "tuned" becomes a moving target. An
  anti-backlash coupling earned its keep.
- **Slow is fast.** Ramping the stepper down near resonance beats slamming it
  and overshooting. You feel it dial in.
- **A hard end-stop saves a soft capacitor.** Ask me how I know.

It's not finished — I want a proper resonance-seeking routine so it finds the
dip on its own instead of being told where to look. But last Tuesday it tuned a
band-change in a few seconds without a human hand on the cap, and the room went
appreciatively quiet. That'll do for a first light.

