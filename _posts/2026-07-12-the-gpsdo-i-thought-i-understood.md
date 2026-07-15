---
layout: post
title: "The GPSDO I thought I understood"
date: 2026-07-12 13:00:00
tags: [gpsdo, reverse-engineering, leo-bodnar, si5351, timing]
description: >-
  Building on Benjamin Vernoux's original Linux tool for Leo Bodnar's LBE-142x
  GPS-disciplined clocks, I added support for the LBE-1425 and went back to
  verify the LBE-1420 — where capturing the real USB traffic turned up a "set
  power" command that had quietly been scrambling the GPS config.
---

A Leo Bodnar GPSDO is a lovely little box. A u-blox GNSS receiver on one side, a
Si5351 synthesizer on the other, and just enough cleverness in between to
discipline the synthesizer to GPS — so you get a frequency reference far steadier
than any crystal you'd own, out of a thing that fits in your palm for surprisingly
little money. I have a [weakness for a steady
clock](https://github.com/ringof/timing-bench), so of course I have a couple.

You configure them through a closed vendor tool over USB — but I didn't have to
start from nothing. **Benjamin Vernoux** had already written the original Linux
tool for these clocks, and it's the foundation everything here stands on. What I
wanted was to push it further: to actually *understand* the boxes on my bench,
byte by byte, instead of poking a GUI and hoping. So I
[forked it](https://github.com/ringof/lbe-142x), added the model it didn't cover,
and went back to verify the one it did.

There was a small, funny reunion along the way. The synthesizer inside is a
**Si5351** — the very chip I'd recently watched [vanish off its own I2C
bus](/notebook/2026/07/the-si5351-clock-generator-that-disappeared/) on the
RX888. Nice to meet it again in a box that treats it well.

## Bringing up the 1425

Vernoux's tool didn't speak to the **LBE-1425** at all, so that one I brought up
from scratch. There's no protocol datasheet, so the only honest way up is a
ladder, one sure rung at a time:

1. **Identify** the device from its USB descriptors — who it says it is.
2. **Probe** it with its own status readback, and watch what changes.
3. **Capture** the vendor tool actually talking to it, with `usbmon`, so you're
   reading *real bytes* and not your own hopes.
4. **Write it down** — one decoded field at a time — and keep the captures as
   replay fixtures, so the findings can't quietly rot as the code changes.

That got the 1425 (a dual-output box with a u-blox **M8** receiver) fully
decoded: set an output frequency to the exact Hz and persist it to flash, enable
and disable outputs, read the GPS fix live, choose which GNSS constellations to
track — all of it read off the wire and pinned down with tests.

## Going back to the 1420

The **LBE-1420** was the opposite story. The original tool already supported it —
but that support had been carried on *inference.* The protocol families overlap
enough that you can extrapolate the 1420 from its siblings, wire it up, watch it
more-or-less work, and never once capture the real thing. That's a perfectly
reasonable first pass — and for a device that's hard to get your hands on, often
the only one going. I inherited it, shipped it in the fork, and took it on faith.

Then I got a 1420 onto the bench, put it on `usbmon`, and captured the real
vendor traffic — and the inherited guesses came apart one after another:

- It doesn't speak the format that had been assumed at all — it speaks the
  **1421's** wire format.
- The frequency commands were at the wrong opcodes *and* the wrong byte offset.
- Output-enable wanted `0xFF`, not `0x01`. The status bytes had been decoded
  misaligned — the byte read as power level was actually the GNSS mask, and the
  antenna current was sitting, in milliamps, in a byte nobody was reading.

And then the one that made me wince. The `--pwr1` command — *set output power* —
was sending opcode `0x07`. On this device, `0x07` is **SET_GNSS**. Every time
anyone "adjusted the power," the tool was silently rewriting the GPS
constellation configuration. Nothing errored. Nothing looked wrong. It just
quietly corrupted state — the exact kind of thing you can *never* catch by
reading the code, only by watching the actual bytes on the wire.

All of it corrected against captured evidence, with 1420 replay fixtures added so
it stays corrected.

## The twist: the one I understood least was the newest

Here's the part I love. Once the 1420 was finally being talked to *correctly,* it
turned out to be the more modern device — a u-blox **M10**, two whole generations
past the 1425's M8. Capabilities the M8 simply can't do started showing up:
BeiDou, GPS, and Galileo all tracking *together* (none of the M8's
three-constellation limit, none of its BeiDou exclusion), plus NavIC support that
only the M10 has. The box that had been understood the least was quietly the most
capable one on the bench.

## Capture the bytes; keep the bytes

Inference is seductive. It compiles, it runs, it passes the smoke test — and it's
wrong in precisely the ways you can't see from the inside. The only cure is to
capture the real traffic, decode it a field at a time, and keep the captures so
the truth stays nailed down. It's the same discipline that keeps the tool honest
elsewhere: it won't print timing telemetry it can't actually read back from the
receiver, because a confident wrong number is worse than an honest gap.

Two GPS-disciplined clocks, one closed protocol, now driven from Linux by a tool
that tells the truth — including the parts it had quietly been getting wrong. The
original tool is Benjamin Vernoux's; the 1425 support and the 1420 re-capture are
mine; and the whole reason to write any of it down is that the next person
shouldn't have to guess.
