---
layout: post
title: "Waking the RX888's other radio"
date: 2026-07-12
tags: [rx888, vhf, r828d, ka9q-radio]
description: >-
  The RX888 is sold as a direct-sampling HF receiver, but there's a whole second
  radio on the board — an R828D VHF tuner the firmware never drives. Here's how I
  woke it up from the host with no firmware change, and handed it to Phil Karn
  (KA9Q) for ka9q-radio.
---

The RX888 mk2 is sold as a direct-sampling HF receiver, and that's how everyone
uses it. But there's a whole second radio sitting on the board that nobody talks
about: an **R828D** VHF/UHF tuner, wired up and waiting, that the firmware
doesn't drive at all. (The GPL tuner driver got pulled years ago over the same
license clash I keep running into.) I wanted to wake it up — and, more to the
point, hand it to someone who'd actually put it to work: **Phil Karn, KA9Q**,
whose [ka9q-radio](https://github.com/ka9q/ka9q-radio) already runs the RX888.

## Don't bake it into the firmware

My first instinct, a year ago, would have been to teach the FX3 firmware how to
drive the tuner. The [Si5351 saga](/notebook/2026/07/the-si5351-clock-generator-that-disappeared/)
cured me of that. Baking capability into the firmware gets in the way of the
people who actually want to experiment — you end up trying to anticipate
everyone's needs, hiding the hardware behind a wall of commands, and making the
whole thing more brittle in the bargain.

So the plan was the opposite: expose the tuner directly, over the FX3's
diagnostic I2C endpoint, and let driver authors program it themselves — exactly
the way they already program the Si5351 clock. Phil, in particular, *wants* to
drive the tuner himself, so he knows precisely what frequency he's really
getting. Good. My job was just to prove it works and get out of the way.

## The whole thing is a host script

The happy surprise: it needs **no firmware change at all.** I couldn't help
hacking it together on the flight home, and by the time I landed the recipe was
just four steps over that diagnostic endpoint:

1. **Reference clock on.** Program the Si5351's CLKB output to 16 MHz — that's
   the R828D's reference. (Because the tuner's reference comes from the same
   clock as everything else, the whole front end can ride a GPS-locked
   reference.)
2. **Tuner init.** Blast the R828D's init register array and set the channel
   filter.
3. **Tune.** Program the tuner PLL to your frequency and confirm it locks.
4. **Flip the path.** Set one GPIO bit (VHF_EN) to swing the front end off the
   HF direct-sampling input and onto the tuner.

Run it backwards — standby the tuner, CLKB off, clear the bit — and you're back
on HF. The genuinely delightful part was hot-switching between HF and VHF with
almost no effort at all.

## The trick: two actors, one USB pipe

Here's the bit I'm proud of. The tuner setup runs entirely over the FX3's
**EP0** diagnostic endpoint while `radiod` streams ADC samples on **EP1**. The
FX3 finishes each I2C transaction before it starts the next, libusb serializes
the host's commands, and — crucially — nothing the tuner script touches is used
by the sampling path. So a little Python script can retune the front end *live,
underneath ka9q-radio,* with no firmware and nobody stepping on anybody. (The
place that stops being safe is two host processes reaching for the same chip at
once — but for one tuner and one streamer, it just works.)

## The R828D: undocumented, as usual

The tuner is a cousin of the R820T2 that powers a generation of RTL-SDR dongles,
and like so much on this board it comes with no real datasheet — you work from a
leaked 2011 Rafael Micro register description and from librtlsdr, and check on
the bench how far the family resemblance holds. (Far, it turns out.) It does
high-side injection, like the Airspy R2, mixing your VHF signal down to a fixed
~4.57 MHz IF that the ADC then samples.

A few things bit me on the way:

- **The reads come back byte-reversed.** Writes go out MSB-first, but readback
  arrives **LSB-first** — a bit-order flip I've never seen another I2C part do,
  mentioned in exactly one line of the register PDF and confirmed in the osmocom
  and Linux R820T drivers.
- **A calibration-PLL "park trap."** The filter-cal routine wedged near 56 MHz
  (a VCO floor meeting integer-N dither); parking the calibration at 100.1 MHz
  instead stepped right around it.
- **Gain is a puzzle, not a knob.** The low registers (LNA, mixer, image
  gain/phase) interact, there are a couple of "magic sequences" to respect, and
  the tuner's own AGC works — though, like most people who drive these, I trust
  a gain plan I built myself a little more.

One warning worth repeating, because it trips people up: the "never write
registers 4–8" rule from the clock-chip post is about the **Si5351**, not the
tuner. Same board, different chip, opposite advice on those addresses. On the
R828D, those low registers are exactly the ones you *do* need — they power up
the mixer and set the gains.

## Handing it to Phil

The point of all this was to make the tuner *Phil's to use,* not mine to own. So
I wrote up the VHF-on and VHF-off sequences, a wire-format reference for driver
authors, and a "what these registers actually mean" document, and handed the lot
over. Phil's folding tuner control into ka9q-radio's `rx888.c` — programming the
R828D himself, on his own docker test harness, as a patch you can cherry-pick.
My side is still a work in progress ([PR #176](https://github.com/ringof/rx888-firmware/pull/176)),
and the ka9q-radio port is coming together.

One good question Phil raised in passing: with only ~8 MHz of tuner bandwidth,
running the ADC at the full 129.6 MHz is a waste of most of `radiod`'s CPU.
Dropping to ~20 MHz — the rate the Airspy R2 uses with the same tuner family —
would reclaim it. That's the next knob to turn.

## It works

<figure class="post-video">
  <video controls preload="metadata" playsinline>
    <source src="/assets/vhf-fm-demo.mp4" type="video/mp4">
    Your browser can't play this clip — <a href="/assets/vhf-fm-demo.mp4">download the demo</a>.
  </video>
  <figcaption>
    The bench TUI tuning the FM broadcast band through the RX888's R828D tuner —
    the whole front end driven from the host, no firmware flash.
  </figcaption>
</figure>

A receiver sold to sample HF is now pulling the broadcast band out of the air
through a tuner the firmware never touches — GPS-lockable, live under
ka9q-radio, without a single flash. The next step isn't more firmware; it's a
small RX888-family header for driver authors, the way the RTL and R820T world
already has. Expose the hardware, write down what it means, and hand it to
people who'll take it somewhere you didn't think of. That's the fun part.
