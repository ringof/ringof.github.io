#!/usr/bin/env node
// Put the hand-authored content back into the map page from handwritten.json.
//
// Use this after a rebuild drops or mangles PINS, DATA.ranchos or DATA.wild
// (verify.js will have told you). It rewrites only those three structures and
// leaves DATA.cats, DATA.acres and the rest of the page untouched.
//
// Run:  node maps/san-diego-land-holders/sources/restore.js [--dry-run]
//
// The restored PINS block is written as plain object literals, so it will not
// be byte-identical to a hand-maintained one that builds its landmark entries
// with .map(). It is equivalent -- verify.js is the check that matters.

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const PAGE = path.join(HERE, '..', 'index.html');
const CANON = path.join(HERE, 'handwritten.json');
const DRY = process.argv.includes('--dry-run');

const strip = o => {
  const c = {};
  for (const k of Object.keys(o)) if (k !== '_provenance') c[k] = o[k];
  return c;
};

const canon = JSON.parse(fs.readFileSync(CANON, 'utf8'));
let src = fs.readFileSync(PAGE, 'utf8');
const changes = [];

// --- PINS -------------------------------------------------------------------
const pins = canon.pins.map(strip);
const block = 'const PINS=[\n' + pins.map(p => '  ' + JSON.stringify(p)).join(',\n') + '\n];';
const pm = src.match(/const PINS\s*=\s*\[[\s\S]*?\n\];/);
if (!pm) {
  throw new Error('no PINS array found in ' + PAGE + ' -- cannot place the restored block safely; ' +
    'add "const PINS=[\\n];" where it belongs and run this again');
}
if (pm[0] !== block) {
  src = src.replace(pm[0], block);
  changes.push('PINS: rewrote ' + pins.length + ' entries');
}

// --- DATA.ranchos and DATA.wild ---------------------------------------------
const lines = src.split('\n');
const i = lines.findIndex(l => l.startsWith('const DATA = '));
if (i < 0) throw new Error('no DATA object found in ' + PAGE);
const data = JSON.parse(lines[i].slice('const DATA = '.length).replace(/;\s*$/, ''));

for (const key of ['ranchos', 'wild']) {
  const want = canon[key].map(strip);
  const had = Array.isArray(data[key]) ? data[key].length : 0;
  if (JSON.stringify(data[key]) !== JSON.stringify(want)) {
    data[key] = want;                       // assigning an existing key keeps its position
    changes.push('DATA.' + key + ': ' + had + ' -> ' + want.length + ' entries');
  }
}
const rebuilt = 'const DATA = ' + JSON.stringify(data) + ';';
if (lines[i] !== rebuilt) { lines[i] = rebuilt; src = lines.join('\n'); }

// --- report and write -------------------------------------------------------
if (!changes.length) { console.log('nothing to restore: the page already matches handwritten.json'); process.exit(0); }
console.log((DRY ? 'would restore' : 'restored') + ':');
for (const c of changes) console.log('  ' + c);
if (DRY) { console.log('\n--dry-run: ' + PAGE + ' not written'); process.exit(0); }
fs.writeFileSync(PAGE, src);
console.log('\nwrote ' + PAGE + '\nnow run: node ' + path.relative(process.cwd(), path.join(HERE, 'verify.js')));
