#!/usr/bin/env node
// Tripwire for the hand-authored content in the San Diego land-holders map.
//
// PINS, DATA.ranchos and DATA.wild cannot be rebuilt from CPAD, SANDAG or
// Census data -- see handwritten.json. This script compares what is in the
// page against that canonical copy and exits non-zero if they diverge, so a
// rebuild that drops or mangles them fails loudly instead of silently.
//
// Run:  node maps/san-diego-land-holders/sources/verify.js
// A deliberate edit to the page means regenerating handwritten.json to match;
// keep the _provenance block for any entry you carry over.

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const PAGE = path.join(HERE, '..', 'index.html');
const CANON = path.join(HERE, 'handwritten.json');

function readPage(src) {
  const pm = src.match(/const PINS\s*=\s*(\[[\s\S]*?\n\];)/);
  if (!pm) throw new Error('no PINS array in ' + PAGE);
  const pins = eval('(' + pm[1].replace(/;\s*$/, '') + ')');

  const line = src.split('\n').find(l => l.startsWith('const DATA = '));
  if (!line) throw new Error('no DATA object in ' + PAGE);
  const data = JSON.parse(line.slice('const DATA = '.length).replace(/;\s*$/, ''));

  return { pins, ranchos: data.ranchos, wild: data.wild };
}

// Deep equality over the plain JSON shapes these structures use.
function same(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => same(a[k], b[k]));
  }
  return false;
}

const strip = o => {
  const c = {};
  for (const k of Object.keys(o)) if (k !== '_provenance') c[k] = o[k];
  return c;
};

const canon = JSON.parse(fs.readFileSync(CANON, 'utf8'));
const page = readPage(fs.readFileSync(PAGE, 'utf8'));
const problems = [];

for (const key of ['pins', 'ranchos', 'wild']) {
  const want = canon[key].map(strip);
  const got = page[key] || [];
  const gotByName = new Map(got.map(e => [e.n, e]));

  for (const w of want) {
    const g = gotByName.get(w.n);
    if (!g) { problems.push(key + ': MISSING from the page -- "' + w.n + '"'); continue; }
    if (!same(w, g)) {
      const fields = [...new Set([...Object.keys(w), ...Object.keys(g)])]
        .filter(f => !same(w[f], g[f]));
      problems.push(key + ': CHANGED -- "' + w.n + '" differs in: ' + fields.join(', '));
    }
  }
  const wantNames = new Set(want.map(e => e.n));
  for (const g of got) {
    if (!wantNames.has(g.n)) {
      problems.push(key + ': NEW in the page, not in handwritten.json -- "' + g.n +
        '" (if deliberate, add it there with a _provenance note)');
    }
  }
  if (want.length !== got.length) {
    problems.push(key + ': count ' + got.length + ' in the page vs ' + want.length + ' canonical');
  }
}

const total = ['pins', 'ranchos', 'wild'].reduce((n, k) => n + canon[k].length, 0);
if (problems.length) {
  console.error('hand-authored content DIVERGED from handwritten.json:\n');
  for (const p of problems) console.error('  ' + p);
  console.error('\n' + problems.length + ' problem(s). The page is the thing that ships, but these ' +
    'records cannot be\nrebuilt from source data -- restore them from handwritten.json, or update that\nfile if the change was deliberate.');
  process.exit(1);
}
console.log('ok: all ' + total + ' hand-authored records present and unchanged' +
  ' (' + canon.pins.length + ' pins, ' + canon.ranchos.length + ' ranchos, ' + canon.wild.length + ' wilderness areas)');
