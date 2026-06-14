// Smoke test for the Havruta app.
//
// Checks four things:
//   1. Every deployed image in assets/images/catalog.json exists on disk.
//   2. transliterate() reproduces the worked examples from docs/TRANSLITERATION-SCHEME.md.
//   3. sefariaUrl() builds the expected canonical Sefaria URL.
//   4. src/App.jsx registers the required routes.
//
// Exit code 0 = all pass. Non-zero = one or more failures.
// Run: node scripts/smoke.mjs

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

let failures = 0;
let passes = 0;

function pass(label) {
  console.log(`PASS  ${label}`);
  passes++;
}

function fail(label, detail) {
  console.error(`FAIL  ${label}${detail ? ': ' + detail : ''}`);
  failures++;
}

// ---------------------------------------------------------------------------
// 1. Deployed image catalog check.
// ---------------------------------------------------------------------------
console.log('\n--- 1. Image catalog ---');

let catalog;
try {
  const raw = readFileSync(resolve(root, 'assets/images/catalog.json'), 'utf8');
  catalog = JSON.parse(raw);
} catch (err) {
  fail('catalog.json readable', err.message);
  catalog = null;
}

if (catalog) {
  const images = Array.isArray(catalog.images) ? catalog.images : [];
  const deployed = images.filter((img) => img.deployed === true);
  if (deployed.length === 0) {
    fail('catalog has deployed entries', 'none found');
  } else {
    for (const img of deployed) {
      // Paths in catalog are relative to the repo root (e.g. "public/learn/hero.jpg").
      const diskPath = resolve(root, img.path);
      if (existsSync(diskPath)) {
        pass(`${img.path} exists`);
      } else {
        fail(`${img.path} exists`, `not found at ${diskPath}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Transliteration worked examples (Section 4 of docs/TRANSLITERATION-SCHEME.md).
// ---------------------------------------------------------------------------
console.log('\n--- 2. Transliteration ---');

let transliterate;
try {
  const mod = await import('../src/lib/transliterate.js');
  transliterate = mod.transliterate;
  if (typeof transliterate !== 'function') throw new Error('transliterate is not a function');
  pass('transliterate module imports');
} catch (err) {
  fail('transliterate module imports', err.message);
  transliterate = null;
}

if (transliterate) {
  // Section 4 worked examples and kamats-katan seeds.
  // The scheme's note on 4.1 says the code should emit the hamza (meʾeimatai)
  // per the general intervocalic rule; the self-test list in transliterate.js
  // confirms this expected output.
  const cases = [
    { input: 'מֵאֵימָתַי', expected: 'meʾeimatai', label: '4.1 meʾeimatai (Berakhot 2a first word)' },
    { input: 'קוֹרִין',    expected: 'korin',          label: '4.2 korin (Berakhot 2a)' },
    { input: 'מִצְוָתָן',   expected: 'mitsvatan',     label: '4.3 mitsvatan (Berakhot 2a)' },
    { input: 'כָּל',       expected: 'kol',            label: 'kamats katan: kol' },
    { input: 'חָכְמָה',    expected: 'ḥokhmah',   label: 'kamats katan: ḥokhmah' },
  ];

  for (const { input, expected, label } of cases) {
    const got = transliterate(input);
    if (got === expected) {
      pass(label);
    } else {
      fail(label, `got "${got}", expected "${expected}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. sefariaUrl() canonical URL check.
// ---------------------------------------------------------------------------
console.log('\n--- 3. sefariaUrl ---');

let sefariaUrl;
try {
  const mod = await import('../src/lib/sefaria.js');
  sefariaUrl = mod.sefariaUrl;
  if (typeof sefariaUrl !== 'function') throw new Error('sefariaUrl is not a function');
  pass('sefariaUrl imports');
} catch (err) {
  fail('sefariaUrl imports', err.message);
  sefariaUrl = null;
}

if (sefariaUrl) {
  // sefariaUrl replaces spaces with underscores and colons with dots.
  // "Chullin 44a" -> "Chullin_44a"; "Ecclesiastes 2:14" -> "Ecclesiastes_2.14".
  const urlCases = [
    {
      input: 'Chullin 44a',
      expected: 'https://www.sefaria.org/Chullin_44a',
      label: 'Chullin 44a -> Chullin_44a',
    },
    {
      input: 'Ecclesiastes 2:14',
      expected: 'https://www.sefaria.org/Ecclesiastes_2.14',
      label: 'Ecclesiastes 2:14 -> Ecclesiastes_2.14',
    },
    {
      input: '',
      expected: 'https://www.sefaria.org/',
      label: 'empty ref -> root URL',
    },
  ];

  for (const { input, expected, label } of urlCases) {
    const got = sefariaUrl(input);
    if (got === expected) {
      pass(label);
    } else {
      fail(label, `got "${got}", expected "${expected}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. App.jsx route registration check.
// ---------------------------------------------------------------------------
console.log('\n--- 4. App.jsx routes ---');

let appSource;
try {
  appSource = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
  pass('src/App.jsx readable');
} catch (err) {
  fail('src/App.jsx readable', err.message);
  appSource = null;
}

if (appSource) {
  const requiredRoutes = ['/', '/learn', '/why', '/find', '/shas', '/archive', '/settings'];
  for (const route of requiredRoutes) {
    // String check: look for path="<route>" in the source.
    const pattern = `path="${route}"`;
    if (appSource.includes(pattern)) {
      pass(`route ${route} registered`);
    } else {
      fail(`route ${route} registered`, `pattern ${pattern} not found in App.jsx`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Per-line partner message (src/lib/partner.js).
// ---------------------------------------------------------------------------
console.log('\n--- 5. Per-line partner message ---');

let buildSegmentFirstUserMessage;
try {
  const mod = await import('../src/lib/partner.js');
  buildSegmentFirstUserMessage = mod.buildSegmentFirstUserMessage;
  if (typeof buildSegmentFirstUserMessage !== 'function') {
    throw new Error('buildSegmentFirstUserMessage is not a function');
  }
  pass('buildSegmentFirstUserMessage exported');
} catch (err) {
  fail('buildSegmentFirstUserMessage exported', err.message);
  buildSegmentFirstUserMessage = null;
}

if (buildSegmentFirstUserMessage) {
  const msg = buildSegmentFirstUserMessage(
    'Chullin 45',
    { label: 'Amud a 2', he: 'אָמַר רַב', en: 'Rav said' },
    { prev: null, next: null },
    'This line introduces a ruling of Rav.'
  );
  const checks = [
    { ok: msg.includes('THE LINE WE ARE ON'), label: 'message marks the line in focus' },
    { ok: msg.includes('Amud a 2'), label: 'message carries the line label' },
    { ok: msg.includes('This line introduces a ruling of Rav.'), label: 'message carries the reader reading' },
    { ok: msg.includes('Chullin 45'), label: 'message names the daf' },
  ];
  for (const { ok, label } of checks) {
    if (ok) pass(label);
    else fail(label);
  }
}

// ---------------------------------------------------------------------------
// 6. Line-level engagement wiring.
// ---------------------------------------------------------------------------
console.log('\n--- 6. Line engagement wiring ---');

const wiringFiles = [
  'src/lib/usePartnerConversation.js',
  'src/components/PartnerTurns.jsx',
  'src/components/LineHavruta.jsx',
];
for (const f of wiringFiles) {
  if (existsSync(resolve(root, f))) {
    pass(`${f} exists`);
  } else {
    fail(`${f} exists`, 'not found');
  }
}

try {
  const todaySrc = readFileSync(resolve(root, 'src/pages/Today.jsx'), 'utf8');
  if (todaySrc.includes('LineHavruta')) pass('Today.jsx wires LineHavruta');
  else fail('Today.jsx wires LineHavruta', 'LineHavruta not referenced');
} catch (err) {
  fail('Today.jsx readable for wiring check', err.message);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${passes + failures} checks: ${passes} passed, ${failures} failed`);
if (failures > 0) {
  process.exit(1);
}
