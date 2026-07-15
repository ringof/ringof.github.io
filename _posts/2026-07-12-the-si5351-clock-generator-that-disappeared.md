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

I'd been getting the RX888 firmware ready for people to actually lean on —
which, right before you hand a thing to users, means trying to break it
yourself. The RX888 wires the Infineon/Cypress FX3's I2C bus straight to the 
**MS5351** clock generator and the **R828** VHF tuner. In the firmware, 
I had elected to emphasize use of the I2CWFX3 and I2CRFX3 vendor commands for 
configuration of these devices. That's deliberate: direct I2C command of those 
two chips is exactly how I'd tell a future host-app author to get *full* control 
of the receiver and largely get out of the developer's way of getting the most 
of them. But a control surface that raw ought to be poked at hard before 
trusting it to not fail in the wild, so I aimed a **fuzz test** at it — 
writing random registers, random values, random write lengths — and went 
hunting for latent and unrecoverable faults.

Well, I found an entire class of fault. When writing to select registers, the clock 
generator went quiet on the I2C bus — no ACK, no response to several SCL clocks, 
nothing. The bus itself was fine; every other device on it still chattered away. 
The MS5351 had simply stopped responding, and it would not recover unless I performed
a whole power-cycle of the device.

## The part and the knowledge gaps

The RX888 uses the Ruimeng **MS5351M** — a clone of the versatile Skyworks 
Si5351 clock generator: with a crystal or clock reference, it gives individually controllable 
outputs, through an I2C-addressable register map for configuring all of that. It is 
truly the workhorse of many ham radio projects, including QRP Labs' many transceivers. 
In the '5351, you are setting multipliers, dividers and other configurations to 
produce the desired frequency output. Rather than trying to repeat how it works, 
look at the closest information we have on it:

[AN619: Si5351 in 10-MSOP/20-QFN](https://www.skyworksinc.com/-/media/Skyworks/SL/documents/public/application-notes/AN619.pdf)  
[AN1234: Si5351 in 16-QFN](https://www.skyworksinc.com/-/media/Skyworks/SL/documents/public/application-notes/an1234-si5351-16qfn-register-map.pdf)

**FYI**: the registers are slightly different between the 16-QFN and other packages!

Look specifically at the registers and bits marked as *reserved*. Skyworks' app notes 
are a little clipped about those: leave the reserved bits and registers at their 
defaults.

What I have found is that - if you write to some of these reserved registers, 
the part stops answering to its own I2C address (0x60). Reach for a scope and 
you find **SDA pulled low and held there**. No amount of bus poking brings it 
back; nine clocks and a stop condition won't free it. The only thing that clears it 
is a cold power cycle, which reloads the part's power-on defaults from its NVM.

There's a stranger cousin to the dead-quiet mode, too. On some **reserved** register
writes, the chip stops answering at 0x60 and instead pops up at a scatter 
of **other** I2C addresses. 

The **reserved** register definitions are presumptions based on the Skyworks App Notes. 
The MS5351M is a clone, and sadly, its [datasheet](/assets/ms5351m-datasheet.pdf) 
is no help. Ten pages of block diagram, pinout, and AC/DC specs, with 
**no register map at all.**  Everything we "know" about the MS5351M's registers 
is inferred from the Si5351A and confirmed on the bench, not written down 
anywhere by Ruimeng. As far as testing shows, the two line up — the clone's registers 
appear to do the same things the Si5351A's do.

The reserved register *failure* isn't just in the clone. **George Byrkit (K9TRV)**
independently ran tests on this same idea — systematic writes to reserved registers, then
a fuzz pass hammering random addresses and write lengths — against *genuine*
Skyworks parts, both an **Si5351A** and an **Si5351C**, and he hit the same class
of failure: write certain reserved registers and the chip goes unresponsive,
SDA stuck low, power-cycle-only. Same fault, different silicon.

The one concrete *difference* we've turned up is small and telling: exactly
which low-address registers trigger the vanishing act isn't identical between
the clone and the genuine parts.

## MS5351 on the bench....

I felt it was worth the effort to reduce the uncertainty, and I bought a little 
MS5351M board from QRP Labs to dive into this in detail. I gave the MS5351M 
its own bench — not the RX888 this time, but an FT4232H in MPSSE mode bit-banging 
I2C straight at a bare clone, with a bus-health check after every single write and a
`uhubctl` port-power cycler wired in to recover from each lockup and keep going.
That let me walk all 256 register addresses in isolation — 693 writes in all —
and sort every one into a bucket.

The headline is almost the opposite of what the fuzzing results made it feel 
like: the MS5351M is *forgiving.* Of 256 registers, exactly **two** are genuinely
dangerous. Most reserved writes do nothing brick-inducing at all.

| Class | Count |
|---|---|
| R/W (defined, reserved, undefined alike) | 194 |
| Read-only | 27 |
| **Dangerous** | **2** — reg 5, reg 7 |
| Value-filtered (ACK some values, NAK others) | 2 |
| Side-effect (partial / indirect writes) | 5 |

### Reg 5 — the one that jams SDA

This is the culprit from the RX888, and on the bench I could finally watch it
cleanly: write any *accepted* non-zero value to reg 5 and SDA drops low and stays
there.

Two wrinkles I didn't expect. First, an **acceptance gate** — the chip only ACKs
a write to reg 5 when the top nibble is all-zeros or all-ones; everything in
between is NAKed outright:

| Value | Top nibble | Result |
|---|---|---|
| `0x00` | `0000` | ACK — safe (the default) |
| `0x01`–`0x0F` | `0000` | ACK — **lockup** |
| `0x10`–`0xEF` | mixed | NAK — rejected |
| `0xF0`–`0xFF` | `1111` | ACK — **lockup** |

Second, a **write-lockout**: once you NAK reg 5 with a "middle" value, it stops
accepting *any* write to reg 5 until the next power cycle.

### Reg 7 — the undocumented address register

Remember the stranger cousin — the chip vanishing from `0x60` and popping up at
other addresses? Here's a big piece of it. Reg 7 appears to act like an 
**undocumented I2C address register.** Its top nibble ORs straight 
into the device address:

```
effective address = 0x60 | (reg7 >> 4)   →   0x60 … 0x6F
```

So a stray write to reg 7 doesn't hang anything — it *moves the chip.* From a
host looking for it on `0x60`, a part quietly answering at `0x64` looks
exactly like one that disappeared. The base `0x60` is hardwired — reg
7 can only OR bits *in* — and a power cycle puts it back to `0x60`.

### The clone's other quirks

Beyond the two dangerous registers, the MS5351M has a personality worth noting:

- **Three usable outputs.** MS0–MS2 (regs 42–65) are full R/W multisynths;
  MS3–MS7 (regs 66–91) read back `0xFF` and silently swallow writes. It isn't a
  fuse or a software lock you can flip — the clone simply doesn't expose them.
- **On-die telemetry nobody advertises.** A couple of registers aren't static at
  all. **Reg 222 drifts continuously and seems to track temperature** — it climbs
  as the chip cools, with the occasional `0xFF` spike that looks like a read
  landing mid-conversion; reg 223 sits at `0x78` and jumps to `0xFF` at the very
  same moments.

## Side by side with the Si5351A

I didn't have to take anyone's word for the genuine part in the end — I finally
put a real **Si5351A** on the bench myself, hung off *Port B* of the same
FT4232H so it and the clone ran on identical timing, the same recovery rig, and
the same 256-address walk, live and side by side. Nothing in this comparison is
second-hand.

The headline: **the lockup trap moved by exactly one register.** On the MS5351M the
SDA-jamming lockup lives at **reg 5**; on the genuine Si5351A reg 5 is a
harmless R/W register — it even powers up at `0xFF` — and the lockup sits at
**reg 6** instead. And reg 7, the clone's undocumented address-shift trick, is a
*third* SDA lockup on the genuine part, no address games at all. Same class of
fault, shuffled one door over. That's exactly the kind of thing that turns a
working driver into a brick when you move it between a clone and a real part.

The rest of the sweep filled in the picture:

- **"No holes" isn't a clone tell.** Both parts ACK all 256 addresses on the
  bus — the reserved gaps in the datasheet are on paper, not something the
  silicon refuses. Don't count on a NAK to protect you from a bad address.
- **The upper multisynth registers are live, not hardwired.** Where the clone
  pins MS3–MS7 (regs 66–91) to `0xFF` and swallows writes, the genuine Si5351A
  takes writes there and reads them back from `0x00`. Whether there are actual
  outputs behind those registers I can't say — nothing's bonded out to probe —
  only that the register map itself behaves like different silicon.
- **REVID.** Reg 0 reads `1` on the clone and `0` on the genuine — a cheap first
  way to tell them apart in code.
- **No temperature register.** The clone's live reg 222/223 telemetry is simply
  absent on the genuine part; both sit at a flat `0xFF`.

The neat part: every dangerous register we turned up — 5 and 7 on the clone, 6
and 7 on the genuine part — falls inside AN619's reserved **4–8** block, which is
exactly the range the firmware fence below already keeps the host out of. The
conservative "don't let the host near 4–8" guard turns out to cover precisely
the registers that bite, on either silicon.

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
compromise is to keep it open and just guard the handful of registers whose only
cure is a power cycle — a real pain when the receiver is at a remote site.

## TL;DR

The whole clone-versus-genuine comparison on one card:

| | MS5351M (clone) | Si5351A (genuine) |
|---|---|---|
| REVID (reg 0) | `1` | `0` |
| SDA-lockup register | **reg 5** | **reg 6** |
| Reg 7 | address shift (recoverable) | SDA lockup |
| I2C address remap | yes, via reg 7 | no |
| Dangerous registers | 5, 7 | 6, 7 |
| MS3–MS7 registers (66–91) | hardwired `0xFF`, writes ignored | R/W, read back `0x00` |
| Reg 222 / 223 | live, temperature-tracking | static `0xFF` |
| All 256 addresses ACK | yes | yes |
| Recovery | power-cycle (reg 7 shift: rewrite reg 7) | power-cycle |

## The lessons learned

- **Only write registers not called RESERVED.** If it isn't in the datasheet with a
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

None of this lives in the cheerful "getting started" part of the datasheet, and
that's exactly why it's worth writing down. The '5351 is a very useful chip that
will happily make you almost any frequency you ask for — right up until you touch the 
RESERVED bits. 

This all said...I do wonder if there is some recovery sequence we 
have yet to discover.
