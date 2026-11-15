# Hand-authored content in the San Diego land-holders map

The map at `../index.html` has two kinds of content, and they need very
different care.

**The parcel layer is reproducible.** `DATA.cats` — 14,324 records covering
1.76 M acres — is derived wholly from CPAD, SANDAG assessor data and Census
TIGERweb. Every record was checked against those sources: each one traces back
to a `UNIT_NAME`, `SITE_NAME`, `AGNCY_NAME`, `MNG_AGNCY` or Census agency
string. If it is lost, it can be rebuilt.

**The rest is not.** `PINS`, `DATA.ranchos` and `DATA.wild` — 65 records in all
— were researched and typed by hand. `handwritten.json` is their canonical
copy, with a `_provenance` note on every entry.

| | records | what is hand-made |
|---|---|---|
| `PINS` | 26 | marker coordinates, owner attributions, descriptions; National Historic Landmark designations on 18 of them |
| `DATA.ranchos` | 29 | digitised Mexican land-grant boundaries, acreages, grant names |
| `DATA.wild` | 10 | wilderness boundaries, acreages, managing agencies, designation years |

Each name was tested against every name field in the cached CPAD data, and
each match was then read individually. **None of the 65 can be reconstructed
from CPAD.** Five have a same-site CPAD polygon — Balboa Park, Chicano Park,
Guajome, the San Diego Presidio, Anza-Borrego — but CPAD carries neither their
historic designations, nor their marker coordinates, nor their descriptions.
CPAD excludes private and HOA land by design, which is exactly what most of
the pins are: there is no CPAD record at all for Rancho Guejito, Palomar
Observatory, the Star of India or the Oak Grove Butterfield stage station.

## Why this directory exists

This content survived nine rebuild generations only because every rebuild
script rewrote the single line beginning `const DATA = ` and left the script
body alone. That is a convention, not a safeguard. One script that regenerated
the whole page instead of that one line would have erased all 65 records, and
no dataset in the pipeline could have brought them back.

## Using it

Check the page against the canonical copy:

```bash
node maps/san-diego-land-holders/sources/verify.js
```

Put the hand-authored content back after a rebuild has damaged it:

```bash
node maps/san-diego-land-holders/sources/restore.js --dry-run
```

```bash
node maps/san-diego-land-holders/sources/restore.js
```

`restore.js` touches only those three structures and leaves `DATA.cats`,
`DATA.acres` and the rest of the page alone. It writes `PINS` as plain object
literals, so the result is not byte-identical to the hand-maintained block,
which builds its landmark entries with `.map()`; it is equivalent, and
`verify.js` is the check that matters.

Both scripts are verified against five kinds of damage — a pin deleted, a
description silently reworded, an undocumented pin added, the `PINS` block
gutted, and a rebuild that drops `DATA.ranchos` and `DATA.wild`. In every
case `verify.js` exits non-zero before and zero after, and the restored
records are deep-equal to the originals.

**If you change the hand-authored content on purpose**, update
`handwritten.json` to match and keep the `_provenance` note for every entry
you carry over. `verify.js` cannot tell a deliberate edit from an accident,
which is the point.

## Not yet audited

- The provenance of `DATA.base`, `DATA.shoot` and `DATA.blmshoot`.
- The `DATA.cats` audit compared *names* against the source datasets, not
  geometry.
