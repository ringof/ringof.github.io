---
layout: post
title: "The RX888, end to end"
date: 2026-07-09
tags: [sdr, rx888, gnu radio]
description: >-
  A milestone note: firmware, host library, and a GNU Radio block finally
  making the RX888 mk2 a receiver you can use on Linux, start to finish.
---

There's a particular kind of satisfaction in watching a signal travel the whole
length of something you built. This week the RX888 mk2 did exactly that — from
the ADC to a waterfall in GNU Radio — with open-source code at every step.

The RX888 mk2 is a lovely, blunt instrument: an LTC2208 sampling the HF spectrum
directly at 16 bits, a Cypress FX3 shoving the samples out over USB 3.0, and not
much software to speak of. So the work split naturally into three repositories,
each handling one leg of the journey:

- **[Firmware](https://github.com/ringof/rx888-firmware)** on the FX3 — sets up
  the sample clock, drives the GPIF data path, and streams 16-bit samples to the
  host. The reward for getting this right is a firehose of data.
- **[`librx888` and the CLI tools](https://github.com/ringof/rx888-tools)** on
  the Linux side — uploads that firmware, opens the USB stream, and hands you the
  samples. Full rate is 135 MS/s, which is more than most flowgraphs want, so
  there's a decimation path down to a friendlier 33.75.
- **[A GNU Radio block](https://github.com/ringof/gr-rx888)** — wraps the library
  as a native `rx888.source` you can drop into a flowgraph like any other radio.

Each piece worked on its own well enough. The milestone was the seam between
them: firmware handing clean samples to the library, the library handing them to
GNU Radio, and nothing dropping or stuttering along the way. That's where the
real bugs live — in the handoffs, not the parts — and it's where most of the
week actually went.

But it's together now. Open the flowgraph, hit run, and the band appears. If
you're staring at an RX888 mk2 and a blank Linux box wondering where to start,
I wrote the whole thing up on its own page: **[the RX888 mk2 SDR
stack](/rx888/)**. Start there instead of from scratch — that's the entire point
of putting it online.
