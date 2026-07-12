---
layout: post
title: "Fellow travelers on the TAPRx888"
date: 2026-07-12 12:00:00
tags: [rx888, taprx888, tapr, hardware]
description: >-
  I spent a long while deep in the RX888 thinking I was mostly on my own — then
  found a whole group building the same thing, properly: the TAPRx888. A note on
  collaborating with Paul Elliott (WB6CXC) and George Byrkit (K9TRV), and the
  small things I got to nudge into the copper before it went to fab.
---

"My good friend and I came heartbreakingly close to the same work." That's what
I wrote the day I found them. For a long while I'd been elbow-deep in the RX888
on my own — reverse-engineering firmware, chasing a
[clock chip that kept vanishing off the bus](/notebook/2026/07/the-si5351-clock-generator-that-disappeared/),
waking up a VHF tuner nobody used — quietly sure I was one of a handful of people
who cared this much about one funny little SDR. And then I found a whole group
doing it properly: the **TAPRx888**.

The TAPRx888 is [TAPR](https://tapr.org)'s open-hardware take on the RX888 — an
MIT-licensed board that keeps what's good about the original and fixes what
isn't. Same bones (the LTC2208 ADC that goes back to the OpenHPSDR days, a Si5351
clock, a Cypress FX3 moving the firehose), but simplified for a real job:
HamSCI's science use, on one robust board, with the unused parts stripped out,
proper RF input filtering, and thermal handling that used to be an afterthought.
**Paul Elliott (WB6CXC)** of Turn Island Systems was doing the schematic capture
and layout; **George Byrkit (K9TRV)** was running the TAPR side — the parts
preorder, the JLCPCB run, the repository; **Rob Robinett (AI6VN)** was testing.

## Why they let a stranger in

Here's the lucky part. Because I'd done all my work *without knowing theirs,* I
was a good person to look at their design cold — no shared assumptions to paper
over the cracks. And the timing was perfect: they were at the final review
before spending real money — five boards, a genuine parts order, a firm
deadline. The one window where changing the board is still cheap.

That's the whole case for test points and debug features: **copper is free.** Ask
for them after the boards come back and you're begging for a re-spin; ask for
them now and it's a few pads on the top layer. So I asked.

Meanwhile my firmware had quietly become *the* firmware — Rob had it running at
WsprDaemon sites, ka9q-radio compatible and stable, which is a lovely thing to
learn from someone else's syslog.

## The small things that made it into the copper

Most of what I brought was unglamorous, which is exactly why it mattered — the
stuff you only know to ask for after it's cost you a holiday.

- **Debug test points.** Pads for the FX3's UART, so you can watch the ARM side
  during a firmware bring-up the way the RX888 already lets you; access to the
  GPIF data path, which I'd been reaching by repurposing the bias-T I/O; and a
  do-not-populate option to bring the Si clock out — or feed an external one in.
  I earned that last one the hard way: my Christmas-and-New-Year's debugging
  involved tacking leads onto the LVDS clock and cutting traces to chase a lock
  problem. Nobody should have to do that twice. All top-copper, all cheap.
- **An SPI boot PROM — and cheap fiber.** This is the one I care about most. As
  it stands, the FX3 always needs USB 2.0 at power-on to load its firmware — and
  that requirement is exactly what makes running an RX888 over
  [USB3-to-fiber](https://github.com/ringof/usb3-fiber) expensive. Put a small
  SPI flash on the board, load the firmware *once,* and it comes up as a plain
  USB 3 device from then on — at which point the fiber link gets cheap, with
  lovely DC isolation thrown in. (I argued for SPI over I2C boot, hard: the I2C
  bus is already busy with direct Si5351 control, so booting off it is asking to
  corrupt your own boot image, and it's slow besides.)

There's a nice loop hiding in that last point. The same reserved-register
misbehavior that made [the clock chip
vanish](/notebook/2026/07/the-si5351-clock-generator-that-disappeared/) is *why*
the boot story has to be careful — and it was in this group, over a "does anyone
have a Si5351 dev board this weekend?" message, that George and I kicked off the
bench experiment that pinned it down.

## Clear is kind

The other thing I brought was a way of writing things down. Every issue I filed
was one item, no bundling — a single specific problem, a snapshot where it
helped, and a link to the exact datasheet page, app note, or reverse-engineering
shot that backed it up. It's slower to write and much faster to act on, and it
keeps a review from turning into an argument about what somebody meant. Clear is
kind.

## The pleasure of not being alone

None of us had met. A designer with the schematic, a TAPR hand in the Midwest
wrangling the repository, a tester running receivers across the country, and me
at my bench — converging on the same odd little board, from four directions,
right before it went to fab. The heartbreak of "we came so close to the same
work" turned, over a couple of weeks, into its opposite: the plain good fortune
of finding the others, and getting to make the thing a little better together
before the copper was cast.

That's the part the datasheets never cover. Build in the open long enough, and
the fellow travelers find you.
