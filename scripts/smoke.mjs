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
  // Shofar magazine chart values (aleph ’, ayin ‘, tsadi ẓ, ḥet ḥ, khaf kh) plus
  // the app's practical vowels. The vocal-shva example guards the yod/vav fix.
  const cases = [
    { input: 'מֵאֵימָתַי', expected: 'me’eimatai', label: 'aleph mark: me’eimatai' },
    { input: 'קוֹרִין', expected: 'korin', label: 'korin' },
    { input: 'מִצְוָתָן', expected: 'miẓvatan', label: 'tsadi: miẓvatan' },
    { input: 'עַל', expected: '‘al', label: 'ayin mark: ‘al' },
    { input: 'כָּל', expected: 'kol', label: 'kamats katan: kol' },
    { input: 'חָכְמָה', expected: 'ḥokhmah', label: 'ḥet: ḥokhmah' },
    { input: 'יְהוּדָה', expected: 'yehuda', label: 'vocal shva: yehuda' },
    { input: 'שַׁבָּת', expected: 'shabbat', label: 'dagesh forte: shabbat' },
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
    { a: { he: ['אָמַר רַב'], en: ['Rav said'] }, b: { he: [], en: [] } },
    { label: 'Amud a 2', he: 'אָמַר רַב', en: 'Rav said' },
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
  'src/lib/sefariaTools.js',
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
// 7. Sefaria tools (offline: specs and adapters only, no network).
// ---------------------------------------------------------------------------
console.log('\n--- 7. Sefaria tools ---');

try {
  const mod = await import('../src/lib/sefariaTools.js');
  const names = Array.isArray(mod.SEFARIA_TOOLS)
    ? mod.SEFARIA_TOOLS.map((t) => t.name)
    : [];
  for (const want of ['sefaria_links', 'sefaria_text', 'sefaria_search', 'sefaria_lexicon']) {
    if (names.includes(want)) pass(`tool ${want} defined`);
    else fail(`tool ${want} defined`, `not in [${names.join(', ')}]`);
  }
  const an = mod.toAnthropicTools();
  if (an.length === names.length && an[0] && an[0].input_schema) pass('toAnthropicTools shape');
  else fail('toAnthropicTools shape', 'missing input_schema');
  const oa = mod.toOpenAiTools();
  if (oa.length === names.length && oa[0] && oa[0].type === 'function' && oa[0].function) pass('toOpenAiTools shape');
  else fail('toOpenAiTools shape', 'missing function wrapper');
  if (typeof mod.runSefariaTool === 'function') pass('runSefariaTool exported');
  else fail('runSefariaTool exported');
  if (typeof mod.describeToolCall === 'function' && typeof mod.describeToolCall('sefaria_text', { ref: 'X' }) === 'string') {
    pass('describeToolCall returns a string');
  } else {
    fail('describeToolCall returns a string');
  }
} catch (err) {
  fail('sefariaTools module imports', err.message);
}

try {
  const mod = await import('../src/lib/sefaria.js');
  if (typeof mod.searchSefaria === 'function') pass('searchSefaria exported');
  else fail('searchSefaria exported');
  if (typeof mod.getLinksForRef === 'function') pass('getLinksForRef exported');
  else fail('getLinksForRef exported');
} catch (err) {
  fail('sefaria search/links exports', err.message);
}

// ---------------------------------------------------------------------------
// 8. Markdown export.
// ---------------------------------------------------------------------------
console.log('\n--- 8. Markdown export ---');

try {
  const mod = await import('../src/lib/exportMarkdown.js');
  const live = mod.turnsToMarkdown({
    dafDisplay: 'Chullin 46',
    turns: [
      { role: 'reader', text: 'my reading' },
      { role: 'partner', text: 'a challenge' },
    ],
  });
  if (live.includes('my reading') && live.includes('a challenge') && live.includes('# Havruta study')) {
    pass('turnsToMarkdown renders the exchange');
  } else {
    fail('turnsToMarkdown renders the exchange', live.slice(0, 80));
  }

  const saved = mod.sessionToMarkdown({
    dafDisplay: 'Chullin 46',
    segmentLabel: 'Amud a 3',
    readings: ['READING'],
    messages: [
      { role: 'user', content: 'BIG DAF CONTEXT BLOCK' },
      { role: 'assistant', content: 'CHALLENGE' },
      { role: 'user', content: 'REPLY' },
    ],
  });
  if (saved.includes('READING') && saved.includes('CHALLENGE') && saved.includes('REPLY')) {
    pass('sessionToMarkdown renders reading and exchange');
  } else {
    fail('sessionToMarkdown renders reading and exchange');
  }
  if (!saved.includes('BIG DAF CONTEXT BLOCK')) {
    pass('sessionToMarkdown skips the daf-context message');
  } else {
    fail('sessionToMarkdown skips the daf-context message', 'context block leaked into export');
  }

  const fn = mod.fileNameFor('Chullin 46 Amud a 3');
  if (typeof fn === 'string' && fn.endsWith('.md') && !/\s/.test(fn)) {
    pass('fileNameFor builds a safe .md name');
  } else {
    fail('fileNameFor builds a safe .md name', fn);
  }
} catch (err) {
  fail('exportMarkdown module imports', err.message);
}

// ---------------------------------------------------------------------------
// 9. Synthesis partner.
// ---------------------------------------------------------------------------
console.log('\n--- 9. Synthesis partner ---');

try {
  const mod = await import('../src/lib/partner.js');
  if (typeof mod.buildSynthesisSystemPrompt === 'function') {
    const sys = mod.buildSynthesisSystemPrompt('Chullin 46', 'an interested amateur');
    if (sys.includes('SYNTHESIS MODE') && sys.includes('reconciliation') && sys.includes('Never produce')) {
      pass('buildSynthesisSystemPrompt extends the base prompt with synthesis mode');
    } else {
      fail('buildSynthesisSystemPrompt extends the base prompt with synthesis mode');
    }
  } else {
    fail('buildSynthesisSystemPrompt exported');
  }

  if (typeof mod.buildSynthesisFirstUserMessage === 'function') {
    const msg = mod.buildSynthesisFirstUserMessage(
      'Chullin 46',
      { a: { he: ['x'], en: ['y'] }, b: { he: [], en: [] } },
      [
        {
          segmentLabel: 'Amud a 2',
          segmentRef: 'Chullin 46a:2',
          readings: ['my line reading'],
          messages: [
            { role: 'user', content: 'CONTEXT' },
            { role: 'assistant', content: 'a challenge' },
          ],
        },
      ],
      'my whole-page synthesis'
    );
    const ok =
      msg.includes('THE LINES I WORKED TODAY') &&
      msg.includes('my line reading') &&
      msg.includes('a challenge') &&
      msg.includes('my whole-page synthesis');
    if (ok) pass('buildSynthesisFirstUserMessage carries the digest and the synthesis');
    else fail('buildSynthesisFirstUserMessage carries the digest and the synthesis');
  } else {
    fail('buildSynthesisFirstUserMessage exported');
  }
} catch (err) {
  fail('synthesis partner imports', err.message);
}

try {
  const mod = await import('../src/lib/sessions.js');
  if (typeof mod.listLineSessionsForDaf === 'function') pass('listLineSessionsForDaf exported');
  else fail('listLineSessionsForDaf exported');
} catch (err) {
  fail('sessions synthesis export', err.message);
}

// ---------------------------------------------------------------------------
// 10. Mermaid label safety: no ASCII double quote used as a Hebrew gershayim
// inside a chart, which closes a Mermaid ["..."] label early and breaks it.
// ---------------------------------------------------------------------------
console.log('\n--- 10. Mermaid label safety ---');

const mdxPages = ['start', 'learn', 'why', 'terms', 'journey'].map(
  (f) => `src/pages/${f}-content.mdx`
);
const chartRe = /chart=\{`([\s\S]*?)`\}/g;
// Hebrew letter, an ASCII double quote, Hebrew letter: a gershayim written wrong.
const gershayimTrap = /[א-ת]"[א-ת]/;
let mermaidIssues = 0;
for (const f of mdxPages) {
  let src;
  try {
    src = readFileSync(resolve(root, f), 'utf8');
  } catch {
    continue;
  }
  let m;
  while ((m = chartRe.exec(src))) {
    if (gershayimTrap.test(m[1])) {
      mermaidIssues += 1;
      fail(`${f}: ASCII quote as gershayim in a chart`, 'use the U+05F4 gershayim ‎״‎');
    }
  }
}
if (mermaidIssues === 0) pass('no ASCII-quote gershayim traps in any chart');

// ---------------------------------------------------------------------------
// 11. Compare translations wiring. The panel stranded on its loading line in
// development because the load effect was gated on the status it set, so React's
// mount/cleanup/mount left the surviving run blocked and the resolving run
// cancelled. Guard the fix statically: the data layer exports the two functions,
// the component imports them, the load effect keys on the panel being open
// rather than on status, and a failed load offers the reader a retry.
// ---------------------------------------------------------------------------
console.log('\n--- 11. Compare translations wiring ---');

try {
  const sefariaSrc = readFileSync(resolve(root, 'src/lib/sefaria.js'), 'utf8');
  if (/export async function getTranslations\(/.test(sefariaSrc)) {
    pass('getTranslations exported');
  } else {
    fail('getTranslations exported', 'not found in src/lib/sefaria.js');
  }
  if (/export async function getTranslationText\(/.test(sefariaSrc)) {
    pass('getTranslationText exported');
  } else {
    fail('getTranslationText exported', 'not found in src/lib/sefaria.js');
  }

  const compareSrc = readFileSync(
    resolve(root, 'src/components/TranslationCompare.jsx'),
    'utf8'
  );
  if (/getTranslations/.test(compareSrc) && /getTranslationText/.test(compareSrc)) {
    pass('TranslationCompare uses the data layer');
  } else {
    fail('TranslationCompare uses the data layer', 'missing import or call');
  }
  // The load effect must not depend on status, or the StrictMode double-run
  // strands the panel on the loading line again.
  const depsMatch = compareSrc.match(/\}, \[([^\]]*)\]\);/);
  if (depsMatch && /open/.test(depsMatch[1]) && !/status/.test(depsMatch[1])) {
    pass('load effect keys on open, not status');
  } else {
    fail(
      'load effect keys on open, not status',
      'the perpetual-spinner regression is back'
    );
  }
  if (/Try again/.test(compareSrc) && /setAttempt/.test(compareSrc)) {
    pass('failed load offers a retry');
  } else {
    fail('failed load offers a retry', 'no retry control on the error state');
  }
} catch (err) {
  fail('compare translations wiring', err.message);
}

// ---------------------------------------------------------------------------
// 12. Service-worker hardening. A returning visitor was served a stale precache
// from the old worker, including hashed chunks the new deploy had replaced,
// which blanked the page until a hard reload or incognito. Check that autoUpdate
// plus the workbox purge flags are set, the self-heal registration is wired into
// main, and the chunk-load handler is guarded by a session flag so neither
// reload path can loop.
// ---------------------------------------------------------------------------
console.log('\n--- 12. Service-worker self-heal ---');

try {
  // The PWA options moved from vite.config.js into astro.config.mjs when the
  // build shell became Astro; the @vite-pwa/astro wrapper carries the same
  // workbox config.
  const cfg = readFileSync(resolve(root, 'astro.config.mjs'), 'utf8');
  if (/registerType:\s*'autoUpdate'/.test(cfg)) pass('VitePWA uses registerType autoUpdate');
  else fail('VitePWA uses registerType autoUpdate');
  if (/cleanupOutdatedCaches:\s*true/.test(cfg)) pass('workbox cleanupOutdatedCaches is set');
  else fail('workbox cleanupOutdatedCaches is set');
  if (/clientsClaim:\s*true/.test(cfg)) pass('workbox clientsClaim is set');
  else fail('workbox clientsClaim is set');
  if (/skipWaiting:\s*true/.test(cfg)) pass('workbox skipWaiting is set');
  else fail('workbox skipWaiting is set');
  if (/navigateFallback:/.test(cfg)) pass('workbox has a SPA navigation fallback');
  else fail('workbox has a SPA navigation fallback');
  // The Mermaid/KaTeX globIgnores that keep the precache small must be kept.
  if (/'\*\*\/mermaid\*'/.test(cfg)) pass('the diagram-chunk globIgnores are kept');
  else fail('the diagram-chunk globIgnores are kept');

  // Under the island, App.jsx runs initServiceWorker from a mount effect; the
  // old main.jsx is gone with the Vite entry.
  const main = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
  if (main.includes('sw-register') && /initServiceWorker\(\)/.test(main)) pass('App.jsx wires the self-heal registration');
  else fail('App.jsx wires the self-heal registration');

  const reg = readFileSync(resolve(root, 'src/sw-register.js'), 'utf8');
  if (reg.includes("from 'virtual:pwa-register'")) pass('registration uses the virtual:pwa-register module');
  else fail('registration uses the virtual:pwa-register module');
  if (/controllerchange/.test(reg)) pass('a controllerchange reload is wired');
  else fail('a controllerchange reload is wired');
  if (/sessionStorage/.test(reg) && /CONTROLLER_RELOAD_FLAG|controller-reloaded/.test(reg)) pass('the controller-change reload is guarded by a session flag');
  else fail('the controller-change reload is guarded by a session flag');
  if (/Failed to fetch dynamically imported module|ChunkLoadError/.test(reg)) pass('the chunk-load error handler exists');
  else fail('the chunk-load error handler exists');
  if (/CHUNK_HEAL_FLAG|chunk-heal-attempted/.test(reg)) pass('the chunk-load self-heal is guarded by a session flag');
  else fail('the chunk-load self-heal is guarded by a session flag');
  if (/caches\.keys\(\)/.test(reg) && /unregister\(\)/.test(reg)) pass('the self-heal clears caches and unregisters workers');
  else fail('the self-heal clears caches and unregisters workers');
} catch (err) {
  fail('service-worker self-heal', err.message);
}

// ---------------------------------------------------------------------------
// Read-aloud control (browser speech synthesis)
// ---------------------------------------------------------------------------
// PocketTorah's leyning recordings cover the Torah, not the Talmud, so the daf
// uses a plain browser read-aloud. These checks confirm the control exists and is
// wired into the reading view, that it never autoplays, that it checks for a
// Hebrew voice and degrades gracefully when none exists rather than reading
// Hebrew with an English voice, and that it cancels speech on unmount.
console.log('\n--- Read-aloud control ---');
try {
  const speech = await import('../src/lib/speech.js');
  typeof speech.speechSupported === 'function'
    ? pass('speech.js exports speechSupported') : fail('speech.js exports speechSupported');
  typeof speech.hebrewVoices === 'function'
    ? pass('speech.js exports hebrewVoices') : fail('speech.js exports hebrewVoices');
  typeof speech.cancelSpeech === 'function'
    ? pass('speech.js exports cancelSpeech') : fail('speech.js exports cancelSpeech');
  // plainTextFromHtml strips markup so the synthesizer reads the words, and it
  // works without a DOM (this smoke test runs in Node).
  if (typeof speech.plainTextFromHtml === 'function') {
    const stripped = speech.plainTextFromHtml('<b>שלום</b> <i>עולם</i>');
    stripped === 'שלום עולם'
      ? pass('plainTextFromHtml strips HTML to plain Hebrew') : fail('plainTextFromHtml strips HTML', `got "${stripped}"`);
  } else { fail('speech.js exports plainTextFromHtml'); }
  // The Hebrew-voice filter keys on a he/iw/-IL language tag, so an English voice
  // never qualifies. Confirm the source matches Hebrew tags.
  const speechSrc = readFileSync(resolve(root, 'src/lib/speech.js'), 'utf8');
  /he\\b|iw\\b|-IL\\b/.test(speechSrc)
    ? pass('hebrewVoices filters on a Hebrew language tag') : fail('hebrewVoices filters on a Hebrew language tag');

  const compSrc = readFileSync(resolve(root, 'src/components/ReadAloud.jsx'), 'utf8');
  // No autoplay: speech begins only from the user's start(), reached by the play
  // button, never from an effect.
  /function start\(\)[\s\S]*speechSynthesis\.speak/.test(compSrc)
    ? pass('speech starts only from the user start()') : fail('speech starts only from the user start()');
  /useEffect\([^)]*\.speak\(/.test(compSrc)
    ? fail('the control must not speak from an effect') : pass('the control does not speak from an effect');
  // The Hebrew-voice check and the graceful fallback both exist.
  /hasHebrewVoice/.test(compSrc) && /hebrewVoices\(\)/.test(compSrc)
    ? pass('the control checks for a Hebrew voice') : fail('the control checks for a Hebrew voice');
  /does not offer a Hebrew voice/.test(compSrc)
    ? pass('the control degrades gracefully with no Hebrew voice') : fail('the control degrades gracefully');
  /mangle/.test(compSrc)
    ? pass('the control refuses to read Hebrew with an English voice') : fail('the control refuses an English voice');
  // It listens for voiceschanged so a late-arriving voice list is picked up.
  /voiceschanged/.test(compSrc)
    ? pass('the control refreshes on voiceschanged') : fail('the control refreshes on voiceschanged');
  // Cleanup: an unmount effect cancels speech.
  /return\s*\(\)\s*=>\s*{[\s\S]*cancelSpeech\(\)/.test(compSrc)
    ? pass('the control cancels speech on unmount') : fail('the control cancels speech on unmount');
  // The reset effect is keyed on the joined text, a stable input, not on the
  // speaking flag it clears.
  /\},\s*\[joined\]\)/.test(compSrc)
    ? pass('the reset effect is keyed on the text, not its own speaking flag')
    : fail('the reset effect is keyed on the text, not its own speaking flag');
  // Play, pause/resume, and stop are all present.
  /function pauseOrResume\(/.test(compSrc) && /function stop\(/.test(compSrc)
    ? pass('the control has play, pause, and stop') : fail('the control has play, pause, and stop');

  // The reading view wires the control in, fed the daf's Hebrew segments.
  const todaySrc = readFileSync(resolve(root, 'src/pages/Today.jsx'), 'utf8');
  todaySrc.includes('ReadAloud') ? pass('the daf view renders the read-aloud control') : fail('the daf view renders the read-aloud control');
  /text\.a\.he/.test(todaySrc) && /text\.b\.he/.test(todaySrc)
    ? pass('the control is fed both amudim of Hebrew') : fail('the control is fed both amudim of Hebrew');
} catch (err) {
  fail('read-aloud control', err.message);
}

// ---------------------------------------------------------------------------
// Astro build shell + island. The whole React app mounts as a single
// client-only island, the base path is /havruta/, and the emitted dist/ carries
// the app shell, the built assets, the service worker, and the manifest under
// the base. Astro is only the host; the React app is unchanged.
// ---------------------------------------------------------------------------
console.log('\n--- Astro build shell + island ---');
try {
  const astroPage = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf8');
  astroPage.includes("import App from '../App.jsx'")
    ? pass('index.astro imports the existing App') : fail('index.astro imports the existing App');
  /<App\s+client:only="react"\s*\/>/.test(astroPage)
    ? pass('index.astro mounts App as a client:only react island') : fail('index.astro mounts App as a client:only react island');
  // The pre-paint theme script and the root div are carried over.
  astroPage.includes('havruta-theme') ? pass('index.astro keeps the pre-paint theme script') : fail('index.astro keeps the pre-paint theme script');
  astroPage.includes('id="root"') ? pass('index.astro keeps the root mount node') : fail('index.astro keeps the root mount node');

  const cfg = readFileSync(resolve(root, 'astro.config.mjs'), 'utf8');
  /base:\s*'\/havruta\/'/.test(cfg)
    ? pass("astro.config.mjs sets base '/havruta/'") : fail("astro.config.mjs sets base '/havruta/'");
  /output:\s*'static'/.test(cfg)
    ? pass('astro.config.mjs builds a static site') : fail('astro.config.mjs builds a static site');
  // The MDX pages keep compiling as React: @mdx-js/rollup runs in Astro's Vite,
  // not the Astro MDX integration, so the React components-prop pattern survives.
  /@mdx-js\/rollup/.test(cfg) && /enforce:\s*'pre'/.test(cfg)
    ? pass('astro.config.mjs keeps @mdx-js/rollup (enforce pre) for React MDX') : fail('astro.config.mjs keeps @mdx-js/rollup for React MDX');

  // The emitted build, if present, serves the shell with base-correct assets and
  // ships the service worker and manifest under the base. The check is skipped
  // before the first build so the harness still runs offline; CI runs it after
  // astro build, where dist/ is present.
  const distIndex = resolve(root, 'dist/index.html');
  if (existsSync(distIndex)) {
    const html = readFileSync(distIndex, 'utf8');
    /\/havruta\/_astro\//.test(html) || /src="\/havruta\//.test(html)
      ? pass('dist/index.html references built assets under /havruta/') : fail('dist/index.html references built assets under /havruta/');
    existsSync(resolve(root, 'dist/sw.js'))
      ? pass('dist ships the service worker (sw.js)') : fail('dist ships the service worker (sw.js)');
    existsSync(resolve(root, 'dist/manifest.webmanifest'))
      ? pass('dist ships the PWA manifest') : fail('dist ships the PWA manifest');
  } else {
    console.log('SKIP  dist/ checks (no build present; run astro build first)');
  }
} catch (err) {
  fail('Astro build shell + island', err.message);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${passes + failures} checks: ${passes} passed, ${failures} failed`);
if (failures > 0) {
  process.exit(1);
}
