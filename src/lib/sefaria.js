// Sefaria API client.
//
// Every text and image in this app comes from Sefaria. The partner never
// generates primary text. These endpoints were verified working on
// 2026-06-13; see docs/SOURCES.md. On any failure these functions throw a
// clear Error rather than returning invented data.

const API = 'https://www.sefaria.org/api';
const MANUSCRIPTS = 'https://www.sefaria.org/api/manuscripts';

// Fetch JSON from a URL and throw a readable error if the request fails.
async function getJson(url) {
  let res;
  try {
    res = await fetch(url);
  } catch (cause) {
    throw new Error(`Could not reach Sefaria at ${url}.`, { cause });
  }
  if (!res.ok) {
    throw new Error(`Sefaria returned ${res.status} for ${url}.`);
  }
  return res.json();
}

// Strip HTML tags and decode the few entities Sefaria's English uses.
function stripHtml(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Flatten a segment field that may be a flat array of strings or nested
// arrays of strings into a single flat array of strings.
function flattenSegments(value) {
  const out = [];
  const walk = (item) => {
    if (Array.isArray(item)) {
      item.forEach(walk);
    } else if (typeof item === 'string') {
      out.push(item);
    }
  };
  walk(value);
  return out;
}

// Get today's daf yomi from Sefaria's calendar endpoint.
// Always ask Sefaria; do not compute the daf from a cycle start date.
// Pass an optional Date to look up a specific day.
// Returns { ref, displayEn, displayHe }.
export async function getTodaysDaf(date) {
  // Default to the device's local date, so the daf is correct for the user's own
  // day rather than the Sefaria server's timezone. A caller may pass a Date to
  // ask for a specific day, for example the next day's daf after nightfall.
  const d =
    date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const url = `${API}/calendars?year=${year}&month=${month}&day=${day}`;
  const data = await getJson(url);
  const items = Array.isArray(data.calendar_items) ? data.calendar_items : [];
  const daf = items.find((item) => item && item.title && item.title.en === 'Daf Yomi');
  if (!daf || !daf.ref) {
    throw new Error('Sefaria did not return a Daf Yomi entry for this day.');
  }
  return {
    ref: daf.ref,
    displayEn: daf.displayValue ? daf.displayValue.en : daf.ref,
    displayHe: daf.displayValue ? daf.displayValue.he : '',
  };
}

// Load one amud (one side of a daf), e.g. "Chullin 44a".
// Returns { ref, heRef, he:[...], en:[...], next, prev }.
async function getAmud(amudRef) {
  const url = `${API}/texts/${encodeURIComponent(amudRef)}?context=0&commentary=0`;
  const data = await getJson(url);
  return {
    ref: data.ref || amudRef,
    heRef: data.heRef || '',
    he: flattenSegments(data.he),
    en: flattenSegments(data.text).map(stripHtml),
    next: data.next || null,
    prev: data.prev || null,
  };
}

// Load any Sefaria ref's text: a commentary, a cited verse, a halakhic code,
// a parallel passage. Same shape and same stripping as getAmud, so commentary
// and connection panels render exactly like the daf does.
// Returns { ref, heRef, he:[...], en:[...] }.
export async function getSefariaText(ref) {
  if (!ref) {
    throw new Error('No reference was given to load.');
  }
  const url = `${API}/texts/${encodeURIComponent(ref)}?context=0&commentary=0`;
  const data = await getJson(url);
  return {
    ref: data.ref || ref,
    heRef: data.heRef || '',
    he: flattenSegments(data.he),
    en: flattenSegments(data.text).map(stripHtml),
  };
}

// Load both amudim of a daf. A daf ref like "Chullin 44" has two sides.
// Returns { a: {...}, b: {...} }.
export async function getDafText(ref) {
  const [a, b] = await Promise.all([getAmud(`${ref}a`), getAmud(`${ref}b`)]);
  return { a, b };
}

// Fetch the link objects for one ref (one amud, or one verse).
// `with_text=0` keeps the payload small; the text loads on demand when the
// reader opens a connection or a commentator.
async function getLinks(ref) {
  const url = `${API}/links/${encodeURIComponent(ref)}?with_text=0`;
  const data = await getJson(url);
  return Array.isArray(data) ? data : [];
}

// Normalize one Sefaria link object to the small shape the UI renders.
// Returns null for a link that lacks the fields the UI needs.
function normalizeLink(link) {
  if (!link || !link.ref) return null;
  const collective = link.collectiveTitle || {};
  const name = collective.en || link.index_title || link.ref;
  return {
    category: link.category || 'Other',
    name,
    heName: collective.he || '',
    ref: link.ref,
    anchorRef: link.anchorRef || '',
  };
}

// Group a flat list of normalized links by commentator name, preserving the
// order names first appear. Returns [{ name, heName, refs:[...] }].
function groupByName(links) {
  const order = [];
  const byName = new Map();
  links.forEach((link) => {
    if (!byName.has(link.name)) {
      order.push(link.name);
      byName.set(link.name, { name: link.name, heName: link.heName, refs: [] });
    }
    byName.get(link.name).refs.push(link.ref);
  });
  return order.map((name) => byName.get(name));
}

// Load the links for both amudim of a daf, normalize, dedupe by ref, and group
// them for display. Commentary is grouped by commentator (Rashi, Tosafot, and
// the rest). Tanakh holds the verses the daf cites. Halakhah holds the codes
// that cite the daf (Mishneh Torah, Tur, Shulchan Arukh). Talmud holds parallel
// passages. Everything else lands in `other`, grouped by work.
// Returns { commentary:[...], halakhah:[...], tanakh:[...], talmud:[...], other:[...] }.
export async function getDafLinks(dafRef) {
  const [aLinks, bLinks] = await Promise.all([
    getLinks(`${dafRef}a`),
    getLinks(`${dafRef}b`),
  ]);

  // Dedupe by linked ref across the two amudim.
  const seen = new Set();
  const all = [];
  [...aLinks, ...bLinks].forEach((raw) => {
    const link = normalizeLink(raw);
    if (!link || seen.has(link.ref)) return;
    seen.add(link.ref);
    all.push(link);
  });

  const inCategory = (cat) => all.filter((link) => link.category === cat);

  // The classic apparatus around the page sits in the Commentary category:
  // Rashi, Tosafot, Rashba, Ramban, Meiri, Rabbeinu Gershom, Steinsaltz, and
  // the rest that attach directly to this daf. The reader reads these beside the
  // page, so they lead the Commentaries list.
  const commentaryLinks = inCategory('Commentary');

  // Quoting Commentary is a different relation: works elsewhere in the library
  // that quote this daf. The reader follows those out, so they belong with the
  // Connections rather than crowding the page's own commentators.
  const quotingLinks = inCategory('Quoting Commentary');

  // Everything not already surfaced in its own group becomes "other".
  const namedCategories = new Set([
    'Commentary',
    'Quoting Commentary',
    'Tanakh',
    'Halakhah',
    'Talmud',
  ]);
  const otherLinks = all.filter((link) => !namedCategories.has(link.category));

  return {
    commentary: groupByName(commentaryLinks),
    halakhah: groupByName(inCategory('Halakhah')),
    tanakh: groupByName(inCategory('Tanakh')),
    talmud: groupByName(inCategory('Talmud')),
    quoting: groupByName(quotingLinks),
    other: groupByName(otherLinks),
  };
}

// Load the commentaries on a single verse, grouped by commentator. A cited
// Torah verse carries Onkelos in the Targum category and the rest under
// Commentary; both are surfaced here so the reader follows the verse down into
// its own commentary, Onkelos and Rashi among them, the way the page intends.
// On a verse outside the Torah (for example a verse from Ecclesiastes) the
// Targum group is simply empty and the commentary stands on its own.
// Returns [{ name, heName, refs:[...] }].
export async function getVerseCommentaries(verseRef) {
  const raw = await getLinks(verseRef);
  const seen = new Set();
  const links = [];
  raw.forEach((item) => {
    if (!item || (item.category !== 'Commentary' && item.category !== 'Targum')) {
      return;
    }
    const link = normalizeLink(item);
    if (!link || seen.has(link.ref)) return;
    seen.add(link.ref);
    links.push(link);
  });
  return groupByName(links);
}

// Turn a manuscript slug into a human label.
// 'romm-vilna-pressing-(1880-86-ce)' -> 'Romm Vilna (1880-86)'
function labelFromSlug(slug) {
  if (!slug) return 'Manuscript';
  // Pull a year or year range out of the slug if one is present.
  const yearMatch = slug.match(/(\d{4}(?:-\d{2,4})?)/);
  const year = yearMatch ? yearMatch[1] : '';
  // Build the name from the slug, dropping the year chunk and noise words.
  const name = slug
    .replace(/[()]/g, ' ')
    .replace(/\d{4}(?:-\d{2,4})?/g, ' ')
    .replace(/\bce\b/gi, ' ')
    .replace(/\bpressing\b/gi, ' ')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
    .trim();
  return year ? `${name} (${year})` : name;
}

// Build the canonical Sefaria web page URL for a ref. Sefaria addresses a page
// with spaces as underscores and the verse or amud separator as a dot, so
// "Chullin 44a" becomes "Chullin.44a" and "Ecclesiastes 2:14" becomes
// "Ecclesiastes_2.14". Both forms were verified to resolve (HTTP 200) on
// 2026-06-13. The link opens the same text on Sefaria itself.
export function sefariaUrl(ref) {
  if (!ref) return 'https://www.sefaria.org/';
  const path = String(ref).trim().replace(/ /g, '_').replace(/:/g, '.');
  return `https://www.sefaria.org/${encodeURI(path)}`;
}

// Remove Hebrew vowel points (nikud) and cantillation marks from a word, so a
// lookup that fails on the pointed form can be retried on the bare consonants.
// The range U+0591 to U+05C7 covers the te'amim and the nekudot.
function stripNikud(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[֑-ׇ]/g, '');
}

// Strip the surrounding punctuation a word may carry when it is split out of a
// running line: the Talmud's gershayim and geresh, ordinary quotation marks,
// commas, the maqaf, and the like. The Hebrew letters themselves are kept.
function trimWordPunctuation(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/^[\s.,;:!?'"׳״()\[\]{}־–—“”‘’]+/, '')
    .replace(/[\s.,;:!?'"׳״()\[\]{}־–—“”‘’]+$/, '')
    .trim();
}

// Reduce one lexicon entry from Sefaria to the small shape the popover renders.
// The senses come from entry.content.senses, each of which may carry HTML
// (italics, cross-reference links, embedded Hebrew). Strip the HTML so the
// definition reads as plain text, and drop senses that reduce to nothing (some
// entries carry a bare "(b. h.)" marker sense with no definition).
function normalizeLexiconEntry(entry) {
  if (!entry) return null;
  const content = entry.content || {};
  const rawSenses = Array.isArray(content.senses) ? content.senses : [];
  const senses = rawSenses
    .map((sense) => {
      const def = stripHtml(sense && sense.definition);
      const num = sense && sense.number ? `${sense.number} ` : '';
      return (num + def).trim();
    })
    .filter((text) => text.length > 0);
  return {
    lexicon: entry.parent_lexicon || 'Dictionary',
    headword: entry.headword || entry.word || '',
    senses,
  };
}

// In-memory cache for word lookups, keyed by the exact string queried, so
// tapping the same word twice in a session costs no second request. Sefaria's
// API is open and the app should be a good citizen about repeat calls.
const lexiconCache = new Map();

// Fetch the raw lexicon array for one query string, caching the result. An
// empty array (no entry) is a real, cacheable answer, not an error.
async function fetchLexicon(query) {
  if (lexiconCache.has(query)) return lexiconCache.get(query);
  const url = `${API}/words/${encodeURIComponent(query)}`;
  const data = await getJson(url);
  const arr = Array.isArray(data) ? data : [];
  lexiconCache.set(query, arr);
  return arr;
}

// Order entries so Jastrow comes first. For the Talmud's Aramaic, Jastrow is
// the dictionary that covers the rabbinic vocabulary; the biblical lexicons
// (BDB, Klein) follow when present.
function orderJastrowFirst(entries) {
  return [...entries].sort((a, b) => {
    const aj = /jastrow/i.test(a.lexicon) ? 0 : 1;
    const bj = /jastrow/i.test(b.lexicon) ? 0 : 1;
    return aj - bj;
  });
}

// Look one Hebrew or Aramaic word up in Sefaria's lexicons.
//
// Returns { found, word, query, entries } where each entry is
// { lexicon, headword, senses:[strings] }, with Jastrow ordered first.
//
// The Talmud is heavily Aramaic and the text Sefaria supplies carries vowel
// points, so a word as it appears on the page is often an inflected, pointed
// form that no dictionary indexes. The lookup tries three things in order: the
// word as given, the word with its surrounding punctuation removed, and the
// word with nikud and cantillation stripped. The first try that returns any
// entry wins. When all three come back empty, the word genuinely has no
// dictionary entry under any of these forms, and the function says so with
// { found:false } rather than inventing a definition. The caller still offers
// a Sefaria link so the reader can search the word there.
export async function lookupWord(word) {
  const original = typeof word === 'string' ? word.trim() : '';
  if (!original) {
    return { found: false, word: '', query: '', entries: [] };
  }

  const trimmed = trimWordPunctuation(original);
  const bare = stripNikud(trimmed);

  // Try the forms in order, skipping duplicates (a word with no nikud and no
  // punctuation collapses the three attempts into one).
  const attempts = [];
  [original, trimmed, bare].forEach((q) => {
    if (q && !attempts.includes(q)) attempts.push(q);
  });

  for (const query of attempts) {
    let raw;
    try {
      raw = await fetchLexicon(query);
    } catch {
      // A network failure on one form should not invent a definition; move on
      // and let a later form (or the final not-found) answer.
      continue;
    }
    const entries = raw
      .map(normalizeLexiconEntry)
      .filter((e) => e && e.senses.length > 0);
    if (entries.length > 0) {
      return {
        found: true,
        word: trimmed || original,
        query,
        entries: orderJastrowFirst(entries),
      };
    }
  }

  return { found: false, word: trimmed || original, query: attempts[0], entries: [] };
}

// In-memory caches for translation work: the version list per ref, and each
// named version's text per ref, so opening and reopening the compare panel
// costs at most one request per version.
const versionsCache = new Map();
const versionTextCache = new Map();

// List the English translations Sefaria carries for a ref. The versions API
// returns every version in every language; this keeps the ones marked English.
// Some versions tagged English are actually another language (their title ends
// in a bracketed code like "[de]"); they are kept as Sefaria returns them and
// shown under their own title, so the label is always honest about what it is.
// Returns [{ versionTitle, language }], the default William Davidson first.
export async function getTranslations(ref) {
  if (!ref) return [];
  if (versionsCache.has(ref)) return versionsCache.get(ref);

  const url = `${API}/texts/versions/${encodeURIComponent(ref)}`;
  const data = await getJson(url);
  const arr = Array.isArray(data) ? data : (data && data.versions) || [];
  const english = arr
    .filter((v) => v && v.language === 'en' && v.versionTitle)
    .map((v) => ({ versionTitle: v.versionTitle, language: v.language }));

  // Put the William Davidson edition first; it is the default the page shows,
  // and the comparison reads as "here is the default, and here are the others".
  english.sort((a, b) => {
    const aw = /william davidson/i.test(a.versionTitle) ? 0 : 1;
    const bw = /william davidson/i.test(b.versionTitle) ? 0 : 1;
    return aw - bw;
  });

  versionsCache.set(ref, english);
  return english;
}

// Fetch one named English version's text for a ref, verbatim from Sefaria, and
// return it as a single joined string with HTML stripped. The `ven` parameter
// on the texts API selects a version by its exact title; this was the form that
// reliably returned a named version on 2026-06-13 (the v3 version=lang|title
// form did not). A segment-level ref returns that segment; an amud or verse ref
// returns its segments joined. Returns '' when the version carries no text for
// this ref, which the caller reports plainly rather than filling in.
export async function getTranslationText(ref, versionTitle) {
  if (!ref || !versionTitle) return '';
  const cacheKey = `${ref}||${versionTitle}`;
  if (versionTextCache.has(cacheKey)) return versionTextCache.get(cacheKey);

  const url =
    `${API}/texts/${encodeURIComponent(ref)}` +
    `?context=0&commentary=0&ven=${encodeURIComponent(versionTitle)}`;
  const data = await getJson(url);
  const text = flattenSegments(data.text).map(stripHtml).filter(Boolean).join(' ');
  versionTextCache.set(cacheKey, text);
  return text;
}

// Get manuscript and print page images for an amud, e.g. "Chullin 44a".
// The manuscripts endpoint addresses the amud with a dot: "Chullin.44a".
// Returns [{ slug, imageUrl, label }], with the Vilna page sorted first.
export async function getDafImages(amudRef) {
  const tref = amudRef.replace(/ /g, '.');
  const url = `${MANUSCRIPTS}/${encodeURIComponent(tref)}`;
  const data = await getJson(url);
  const records = Array.isArray(data) ? data : [];
  const images = records
    .filter((rec) => rec && rec.image_url)
    .map((rec) => ({
      slug: rec.manuscript_slug || '',
      imageUrl: rec.image_url,
      label: labelFromSlug(rec.manuscript_slug),
    }));
  // The Vilna page is the classic tzurat hadaf; show it first.
  images.sort((x, y) => {
    const xv = /vilna/i.test(x.slug) ? 0 : 1;
    const yv = /vilna/i.test(y.slug) ? 0 : 1;
    return xv - yv;
  });
  return images;
}
