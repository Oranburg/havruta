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
  let url = `${API}/calendars`;
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    url += `?year=${year}&month=${month}&day=${day}`;
  }
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
