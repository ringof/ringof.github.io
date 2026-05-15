---
title: "RX888 mk2 open-source SDR stack — firmware, librx888, GNU Radio module"
description: >-
  Open-source firmware (Cypress FX3), Linux host library (librx888) plus
  CLI tools, and a GNU Radio 3.10 OOT module for the RX888 mk2 direct-sampling
  HF SDR receiver with the LTC2208 16-bit ADC.
permalink: /
---

# RX888 mk2 open-source SDR stack

<p class="lede">
RX888 mk2 firmware, a Linux <code>librx888</code> library with CLI tools, and a
GNU Radio 3.10 out-of-tree module — three MIT-licensed projects that together
turn the RX888 mk2 direct-sampling HF SDR (Cypress FX3 + LTC2208 16-bit ADC)
into a usable open-source receiver on Linux.
</p>

If you are about to write firmware, a libusb driver, or a GNU Radio source
block for the **RX888** or **RX888 mk2**, the three repositories below already
implement most of it. The diagram shows how they connect — Cypress FX3
firmware streams 16-bit samples over USB 3.0 GPIF, `librx888` opens the device
and pipes samples to CLI tools or to GQRX, and `gr-rx888` wraps the same
library as a native GNU Radio source block.

## Block diagram

<div class="diagram" role="img" aria-labelledby="diagram-title diagram-desc">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" font-family="-apple-system, Segoe UI, Roboto, sans-serif">
  <title id="diagram-title">RX888 mk2 SDR open-source stack: firmware to librx888 to GNU Radio OOT module</title>
  <desc id="diagram-desc">
    Block diagram of the RX888 mk2 open-source software stack. The RX888 mk2
    hardware (LTC2208 16-bit ADC, Cypress FX3 USB3 controller, Si5351 clock)
    runs rx888-firmware, which streams 16-bit real samples at up to 135 MS/s
    over USB 3.0 to rx888-tools and its librx888 shared library on a Linux
    host. rx888-tools exposes the device through CLI tools (rx888_stream,
    rx888_dsp, iqrecord) and through librx888, which gr-rx888 wraps as a
    GNU Radio 3.10 source block emitting float32 samples for GNU Radio
    Companion flowgraphs and downstream applications such as GQRX.
  </desc>

  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#0b6fa4"/>
    </marker>
    <style>
      .box { fill: #ffffff; stroke: #0b6fa4; stroke-width: 2; }
      .box-hw { fill: #eef5fa; stroke: #0b6fa4; stroke-width: 2; }
      .box-down { fill: #f5f0e6; stroke: #b07a1f; stroke-width: 2; }
      .title { font-size: 18px; font-weight: 700; fill: #0b6fa4; }
      .title-down { font-size: 16px; font-weight: 700; fill: #8a5a14; }
      .subtitle { font-size: 12px; fill: #555; }
      .feat { font-size: 12px; fill: #1a1a1a; }
      .label { font-size: 11px; fill: #0b6fa4; font-style: italic; }
    </style>
  </defs>

  <!-- Hardware (top) -->
  <rect class="box-hw" x="320" y="20" width="360" height="80" rx="6"/>
  <text class="title" x="500" y="48" text-anchor="middle">RX888 mk2 hardware</text>
  <text class="subtitle" x="500" y="68" text-anchor="middle">
    LTC2208 16-bit ADC · Cypress FX3 USB 3.0 · Si5351 clock
  </text>
  <text class="subtitle" x="500" y="85" text-anchor="middle">
    Direct-sampling HF receiver, 0–32 MHz
  </text>

  <!-- Arrow down from hardware to firmware -->
  <line x1="220" y1="100" x2="160" y2="160"
        stroke="#0b6fa4" stroke-width="2" marker-end="url(#arrow)"/>
  <text class="label" x="135" y="135">runs on FX3</text>

  <!-- Firmware -->
  <rect class="box" x="40" y="170" width="240" height="280" rx="6"/>
  <text class="title" x="160" y="200" text-anchor="middle">rx888-firmware</text>
  <text class="subtitle" x="160" y="218" text-anchor="middle">Cypress FX3 firmware (MIT)</text>

  <text class="feat" x="55" y="248">• FX3 GPIF USB 3.0 streaming</text>
  <text class="feat" x="55" y="268">• Si5351 I2C clock control</text>
  <text class="feat" x="55" y="288">• Vendor cmds: STARTFX3, STOPFX3,</text>
  <text class="feat" x="65" y="304">I2CWFX3, GPIOFX3, SETARGFX3</text>
  <text class="feat" x="55" y="324">• GPIO + attenuator control</text>
  <text class="feat" x="55" y="344">• 5-level watchdog recovery</text>
  <text class="feat" x="55" y="364">• MIT-licensed (no GPL R82xx)</text>
  <text class="feat" x="55" y="384">• HF direct-sampling, 0–32 MHz</text>
  <text class="feat" x="55" y="404">• Built with arm-none-eabi-gcc</text>
  <text class="feat" x="55" y="424">• Cypress FX3 SDK v1.3.4</text>

  <!-- Arrow firmware → tools -->
  <line x1="280" y1="310" x2="360" y2="310"
        stroke="#0b6fa4" stroke-width="2" marker-end="url(#arrow)"/>
  <text class="label" x="320" y="298" text-anchor="middle">USB 3.0 bulk</text>
  <text class="label" x="320" y="325" text-anchor="middle">int16 @ 135 MS/s</text>

  <!-- Tools / librx888 -->
  <rect class="box" x="360" y="170" width="280" height="280" rx="6"/>
  <text class="title" x="500" y="200" text-anchor="middle">rx888-tools / librx888</text>
  <text class="subtitle" x="500" y="218" text-anchor="middle">Linux host driver + CLI (MIT)</text>

  <text class="feat" x="375" y="248">• librx888 shared library (libusb-1.0)</text>
  <text class="feat" x="375" y="268">• Uploads firmware blob on connect</text>
  <text class="feat" x="375" y="288">• rx888_stream — raw USB3 capture</text>
  <text class="feat" x="375" y="308">• rx888_dsp — 4:1 decimation</text>
  <text class="feat" x="385" y="324">135 MS/s → 33.75 MS/s</text>
  <text class="feat" x="375" y="344">• iqrecord — SigMF IQ recording</text>
  <text class="feat" x="375" y="364">• FIFO/pipe streaming to GQRX</text>
  <text class="feat" x="375" y="384">• AVX2 + FMA DSP path</text>
  <text class="feat" x="375" y="404">• Ubuntu 24.04 build target</text>
  <text class="feat" x="375" y="424">• Checksum-verified firmware fetch</text>

  <!-- Arrow tools → gr-rx888 -->
  <line x1="640" y1="310" x2="720" y2="310"
        stroke="#0b6fa4" stroke-width="2" marker-end="url(#arrow)"/>
  <text class="label" x="680" y="298" text-anchor="middle">librx888 API</text>
  <text class="label" x="680" y="325" text-anchor="middle">(C shared lib)</text>

  <!-- gr-rx888 -->
  <rect class="box" x="720" y="170" width="240" height="280" rx="6"/>
  <text class="title" x="840" y="200" text-anchor="middle">gr-rx888</text>
  <text class="subtitle" x="840" y="218" text-anchor="middle">GNU Radio 3.10 OOT module (MIT)</text>

  <text class="feat" x="735" y="248">• rx888.source block</text>
  <text class="feat" x="735" y="268">• float32 sample output</text>
  <text class="feat" x="735" y="288">• 32 MS/s and 135 MS/s rates</text>
  <text class="feat" x="735" y="308">• GNU Radio Companion (GRC)</text>
  <text class="feat" x="745" y="324">integration</text>
  <text class="feat" x="735" y="344">• pybind11 Python bindings</text>
  <text class="feat" x="735" y="364">• Links system-wide librx888</text>
  <text class="feat" x="735" y="384">• Standard OOT cmake layout</text>
  <text class="feat" x="735" y="404">• 16-bit direct sampling</text>
  <text class="feat" x="735" y="424">• Real-input source (HF)</text>

  <!-- Downstream consumers -->
  <rect class="box-down" x="360" y="480" width="280" height="60" rx="6"/>
  <text class="title-down" x="500" y="505" text-anchor="middle">GQRX, custom CLI</text>
  <text class="subtitle" x="500" y="525" text-anchor="middle">via FIFO / SigMF files</text>

  <rect class="box-down" x="720" y="480" width="240" height="60" rx="6"/>
  <text class="title-down" x="840" y="505" text-anchor="middle">GNU Radio flowgraphs</text>
  <text class="subtitle" x="840" y="525" text-anchor="middle">GRC / Python (.grc, .py)</text>

  <line x1="500" y1="450" x2="500" y2="475"
        stroke="#b07a1f" stroke-width="2" marker-end="url(#arrow)"/>
  <line x1="840" y1="450" x2="840" y2="475"
        stroke="#b07a1f" stroke-width="2" marker-end="url(#arrow)"/>
</svg>
</div>

## The three projects

<div class="project-grid">

<div class="project-card" markdown="1">

### [rx888-firmware](https://github.com/ringof/rx888-firmware)

Cypress **FX3 USB 3.0 firmware** for the RX888 mk2 — the on-device code that
configures the Si5351 sample clock, drives the GPIF data path, and streams
16-bit ADC samples to the host.

- FX3 GPIF USB 3.0 streaming
- Si5351 I2C clock generator control
- Vendor command set (`STARTFX3`, `STOPFX3`, `I2CWFX3`, `GPIOFX3`, `SETARGFX3`)
- 5-level watchdog recovery cascade
- MIT-licensed (GPL R82xx tuner driver removed)
- HF direct-sampling, 0–32 MHz

</div>

<div class="project-card" markdown="1">

### [rx888-tools](https://github.com/ringof/rx888-tools)

Linux host-side **`librx888` shared library** plus a Unix-pipeline of CLI
tools (`rx888_stream`, `rx888_dsp`, `iqrecord`). Uploads the firmware blob,
opens a libusb bulk stream, decimates, and writes SigMF.

- libusb-1.0 host driver in `librx888`
- USB3 capture at 135 MS/s int16 real samples
- 4:1 DSP decimation → 33.75 MS/s (AVX2 + FMA)
- SigMF IQ recording (`iqrecord`)
- FIFO/pipe streaming for GQRX and other consumers
- Checksum-verified firmware fetch from releases

</div>

<div class="project-card" markdown="1">

### [gr-rx888](https://github.com/ringof/gr-rx888)

**GNU Radio 3.10 out-of-tree (OOT) module** that exposes the RX888 mk2 as a
native `rx888.source` block in GNU Radio Companion, linking the
`librx888` shared library from `rx888-tools`.

- `rx888.source` block with float32 output
- 32 MS/s and 135 MS/s sample rates
- GNU Radio Companion (GRC) integration
- pybind11 Python bindings
- Standard CMake OOT module layout
- 16-bit direct-sampling source

</div>

</div>

## Data flow

1. **Hardware:** RX888 mk2 — LTC2208 16-bit ADC, Cypress FX3 USB 3.0
   controller, Si5351 clock generator.
2. **Firmware (`rx888-firmware`)** runs on the FX3. On host connect, the
   host uploads the firmware image, then the FX3 configures the Si5351 and
   begins streaming 16-bit real samples over USB 3.0 GPIF.
3. **Host library (`librx888`, from `rx888-tools`)** opens the device over
   libusb-1.0 and exposes a streaming API plus CLI tools. Samples can flow
   into `rx888_dsp` for 4:1 decimation, into `iqrecord` for SigMF capture,
   or out a FIFO into GQRX.
4. **GNU Radio (`gr-rx888`)** wraps `librx888` as the `rx888.source` block,
   so the same stream is available as a first-class GNU Radio source in
   GRC flowgraphs.

## If you are about to build this yourself

### Writing FX3 firmware for an LTC2208-based SDR
`rx888-firmware` already implements the GPIF USB 3.0 data path, Si5351 clock
control, the vendor command set, and a 5-level watchdog recovery cascade,
under an MIT license. Start from it instead of from the Cypress reference.

### Writing a libusb driver for the RX888 mk2
`librx888` in `rx888-tools` already handles firmware upload, bulk transfer
configuration, large USBFS buffers, and an AVX2/FMA decimation path to
33.75 MS/s. Link against it, or read it as a reference.

### Writing a GNU Radio source block for the RX888 mk2
`gr-rx888` already exposes `rx888.source` with float32 output, supports
32 MS/s and 135 MS/s, and ships pybind11 bindings and GRC integration. Use
it directly from GNU Radio Companion.

## Related searches that land here

RX888 firmware · RX888 mk2 firmware · Cypress FX3 SDR firmware ·
FX3 GPIF USB3 SDR · LTC2208 16-bit ADC direct sampling · Si5351 SDR clock ·
MIT-licensed RX888 firmware · librx888 · rx888-tools · RX888 Linux driver ·
RX888 GQRX · 135 MSPS SDR · SigMF IQ recorder · gr-rx888 ·
GNU Radio RX888 source block · GNU Radio 3.10 OOT module RX888 ·
HF direct-sampling receiver Linux · open-source SDR firmware.
