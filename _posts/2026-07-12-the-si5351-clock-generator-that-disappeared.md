---
layout: post
title: "The Si5351 clock generator that disappeared…"
date: 2026-07-12
tags: [si5351, i2c, sdr, rx888]
description: >-
  Writing to reserved registers on the Si5351 (and the MS5351M clone in
  the RX888) wedges the chip on the I2C bus — SDA stuck low, recoverable only by
  a power cycle. Here's the failure, why it matters for the RX888, and the
  firmware guard I added.
---

I've been getting the RX888 firmware ready for people to actually lean on —
which, right before you hand a thing to users, means trying to break it
yourself. The RX888 wires the Infineon/Cypress FX3's I2C bus straight to the 
**MS5351** clock and the **R828** tuner. In the firmware, I had elected to 
emphasize use of the I2CWFX3 and I2CRFX3 vendor commands for configuration of
these devices. That's deliberate: direct I2C command of those two chips
is exactly how I'd tell a future host-app author to get *full* control of the
receiver and largely get out of the developer's way pf getting the most of them. 
But a control surface that raw ought to be poked at hard before trusting it to 
not fail in the wild, so I aimed a **fuzz test** at it — writing random registers, 
random values, random write lengths — and went hunting for latent and unrecoverable 
faults.

I found an entire class of fault. When writing to select registers, the clock 
generator went quiet on the I2C bus — no ACK, response to several SCL clocks, 
nothing. The bus itself was fine; every other device on it still chattered away. 
The MS5351 had simply stopped responding, and it would not recover unless I performed
I whole power-cycle of the device.

## The part and the trouble in the gaps

The Si5351 clone used in the RX888 is the Ruimeng **MS5351M** — is a lovely and versatile 
clock generator: a crystal or clock reference, a couple of PLL and Multisynth stages, 
three indivudually controllable outputs, and a big I2C-addressable register map that 
tells it which frequencies to make and by what ratios. Its truly the workhorse of many 
ham radio projects, including QRP Labs many transceivers. In this part, you are 
setting multiplers, dividers and constants to produce the desired frequency output 
- rather than trying to repeat it, look at the closest information we have on it:

[AN619: Si5351 in 10-MSOP/20-QFN](https://www.skyworksinc.com/-/media/Skyworks/SL/documents/public/application-notes/AN619.pdf)  
[AN1234: Si5351 in 16-QFN](https://www.skyworksinc.com/-/media/Skyworks/SL/documents/public/application-notes/an1234-si5351-16qfn-register-map.pdf)

**FYI**: the registers are slightly different between the 16-QFN and other packages!

The register map isn't solid. Look for the registers and bits marked as *reserved*. 
Silicon Labs' app notes is a little clipped about those: leave the reserved 
bits and registers at their defaults.

What I have found is that - when you Write to these reserved registers. the 
part stops answering to its own I2C address (0x60). Reach for a scope and 
you find **SDA pulled low and held there** — something on the bus won't let go. 
(I couldn't prove whether it's the chip or the master doing the holding; 
either way the line is stuck.) No amount of bus poking brings it back; 
nine clocks and a stop condition won't free it. The only thing that clears it 
is a cold power cycle, which reloads the part's power-on defaults from its NVM.

There's a stranger cousin to the dead-quiet mode, too. On some writes, the chip
stops answering at 0x60 and instead pops up at a scatter of **other** I2C
addresses — a different, seemingly random set on each pass. My best guess is
that we're glimpsing how the part handles its internal one-time-programmable
trim, knocked sideways. That one's a rabbit hole for another day.

## It isn't just the clone — and the clone isn't documented

The MS5351M is a clone, so finding this on an RX888 only proves something about
*that* part — and here's the catch: its [datasheet](/assets/ms5351m-datasheet.pdf) 
is no help. Ten pages of block diagram, pinout, and AC/DC specs, 
with **no register map at all.** Everything we "know" about the MS5351M's registers 
is inferred from the Si5351A and confirmed on the bench, not written down 
anywhere by Ruimeng. As far as testing shows, the two line up 
— the clone's registers appear to do the same things the Si5351A's
do.

The *failure*, happily, isn't just the clone's either. **George Byrkit (K9TRV)**
independently ran tests on this same idea — systematic writes to reserved registers, then
a fuzz pass hammering random addresses and write lengths — against *genuine*
Skyworks parts, both an **Si5351A** and an **Si5351C**, and he hit the same class
of failure: write certain reserved registers and the chip goes unresponsive,
SDA stuck low, power-cycle-only. Same fault, different silicon.

The one concrete *difference* we've turned up is small and telling: exactly
which low-address registers trigger the vanishing act isn't identical between
the clone and the genuine parts — the MS5351M draws its forbidden lines in
slightly different places. We're comparing notes across parts (and deliberately
not peeking at each other's register lists yet, to keep from biasing the
results), so the full per-register, per-variant map is still a work in progress.
But the headline holds: reserved means reserved, on the clone and the genuine
article alike.

## The fix for the RX888

For an RX888 user, "power-cycling the receiver" is a lousy recovery story, so the
firmware shouldn't let a stray host write get that far. My
[rx888-firmware change](https://github.com/ringof/rx888-firmware/pull/164) does
two things:

- **Fence off the reserved space.** Host I2C reads and writes to the
  reserved ranges — per AN619, registers **4–8, 10–14, 93–148, and
  171–188** — are rejected at the USB handler with an I2C STALL. The firmware's
  own initialization still writes what it must; only *arbitrary host* access to
  those ranges is blocked. 
- **Make a reload actually recover.** Init now follows the Skyworks datasheet's 
  Figure 10 programming procedure and rewrites the full configuration map on boot
  (including the spread-spectrum register at 149), so a device left in a
  corrupted-but-allowed state gets cleaned up on reload and the PLL locks again
  instead of limping.

Two thousand fuzz operations later: zero persistent mutes, clean recovery every
reload. I don't love that host drivers reach into the PLL over raw I2C in the
first place — but since that freedom is the whole point for experimenters, the
compromise is to keep it open and just guard the handful of registers that turn
a receiver into a paperweight.

## The lessons learned

- **Only write registers not called RESERVED** If it isn't in the datasheet with a
  stated purpose, don't touch it.
- **Avoid blind read-modify-write.** Reserved bits live inside otherwise-writable
  registers, so a careless "read, OR in a bit, write it back" can disturb one you
  never meant to touch — and readback isn't equally trustworthy across every part
  and clone. Keep a shadow copy of the map in code and write from that, so what
  lands on the chip is exactly what you intended.
- **Initialize from a known-good full map** (AN619 or ClockBuilder output), not
  by poking individual bits blind. And mind your loop bounds — the quickest path
  into a reserved register is a `for` loop that counts one address too far.
- **The clone is undocumented, but bound by the same rules.** The MS5351M ships
  without a register map, so treat the Si5351A's as your reference — but assume
  the reserved traps are just as real, and possibly at slightly different
  addresses.
- **If it goes silent, look at SDA.** In our tests it sat stuck low and only a
  power cycle recovered it — nine-clock bus recovery didn't help. (We couldn't
  prove whether the chip or the master held the line.) And "silent" isn't the
  only failure — sometimes the part answered on scattered wrong addresses
  instead.

None of this lives in the cheerful "getting started" part of the datasheet, and
that's exactly why it's worth writing down. The '5351 is a very useful chip that
will happily make you almost any frequency you ask for — right up until touch the 
RESERVED bits. This all said...I do wonder if there is some recovery sequence we 
have yet to discover.
