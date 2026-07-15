# voice.md

How this notebook sounds, and how to help me write in it. A living doc —
add to it when something here turns out wrong, or when a post teaches us a
new rule. It's a notebook about the notebook.

## Who I'm writing like

Two lodestars, and most posts lean toward one:

- **Phil's Old Radios** — patient, methodical, warm. "Here's what I found,
  here's why it matters, here's the detail laid out clean." The register of a
  careful investigation. Reverse-engineering writeups, firmware fixes, and
  anything with tables and evidence live here.
- **JF1OZL** — intimate and spare. He tells you how he *felt*. He marvels. He's
  generous, a little humble, and he wants *you* to go build the thing. Personal
  projects, first-light moments, and the joy of a bench live here.

They're not opposites; a good post borrows from both. But know which coat a
post is wearing before you start, and don't force the other one on.

## The three that stay true

From the very first post, and still the spine of everything:

- **Short.** Readable while the soldering iron warms up. Let air in. If a
  paragraph is doing three jobs, it's two paragraphs.
- **Concrete.** Real numbers, real parts, real mistakes. `0x60`, the FT4232H,
  693 writes. No "various registers," no "a certain chip."
- **Kind.** The blogs I learned the most from were generous with the reader.
  Pay it forward. Never lecture, never pretend the path was straight.

## Honesty above polish

This is the one I care about most, and the one I'll push back on hardest.

- **Say what you measured, not what you infer.** Settable registers are not
  proof of hidden outputs. A stuck bus is not proof the chip is holding the
  line unless you watched it. When you cross from observation into guess, *say
  so in the sentence* ("whether there's silicon behind it I can't say — nothing's
  bonded out to probe").
- **Mark presumptions as presumptions.** "Inferred from the Si5351A and
  confirmed on the bench, not written down anywhere by Ruimeng." Give the reader
  the confidence level, not just the claim.
- **Right-size the severity.** It's a lockup that clears on a power cycle, not a
  paperweight. Name the real cost (a power cycle is a genuine pain for a *remote*
  operator) instead of reaching for the scarier word.
- **First-hand beats second-hand, and say which it is.** "Nothing in this
  comparison is second-hand" is a feature. If a result is someone else's, credit
  it as theirs.

If a line overclaims, fix it toward what's true even if the true version is less
punchy. The trust is the whole point.

## Credit generously

- Name people, with callsign where they have one: **George Byrkit (K9TRV)**,
  **Phil Karn (KA9Q)**, **Benjamin Vernoux**, **Len (W1ZTL)**. Collaboration is
  part of the story, not a footnote.
- No blame, ever — even when someone was difficult. Frame contributions
  graciously; leave the friction out.

## Mechanics and house style

- **Em-dashes: sparingly.** A whole post should sit around five, not forty. Use
  commas, colons, and parentheses for asides; keep the dash for the few places
  it does real work (an abrupt reveal, a punch at the end of a line).
- **Follow the reference document's notation.** Use the numbering and naming the
  source uses: the datasheet, the app note, or an earlier discussion. For the
  Si5351 that meant AN619's register numbers (decimal), with values and addresses
  in hex the way the app note writes them. Barring a reference, use whatever
  numbering makes sense in context. Either way, don't slap `0x` on a decimal
  number.
- **Titles are evocative, a little mysterious.** "The Si5351 clock generator
  that disappeared…", "The GPSDO I thought I understood", "A loop, a stepper,
  and a Tuesday night." A trailing "…" is welcome.
- **Structure by investigation.** Keep distinct pieces of work in their own
  sections (the clone on its own bench; the genuine part side-by-side). Don't
  weave two studies into one tangle.
- **Reference tables earn their place** in a dense post (a classification table,
  a TL;DR comparison card). JF1OZL would never make one; Phil would. Use them
  where they save the reader real work.
- **Voice quirks to keep:** contractions, first person, direct address to the
  reader ("you"), dry understatement ("Ask me how I know."). Plain words over
  clever ones.

## Endings

End where the story ends. Don't manufacture a cliffhanger or bolt on wonder for
effect. For Phil and JF1OZL the ending was usually just the end of the project,
so if the work is done, close it there. If the story genuinely stops partway,
it's fine to stop there honestly; Phil often did, and sometimes came back years
later to finish it. The open question at the close of the Si5351 post works
because it's true, not because it's a device.

## How to help me edit

- **Fix outright errors and overclaims freely** — typos, broken grammar, a
  factual leap. Those are always in scope.
- **Leave deliberate voice choices alone**, even slightly rough ones. If I trim
  a paragraph or pick an odd word, that's usually on purpose. When in doubt,
  flag it and ask rather than smoothing it out.
- **Ask before any large voice or structure change.** Small surgical fixes:
  just do them and tell me what changed.
- **Show the result** (a rendered preview) so I can hear it, not just read the
  diff.
