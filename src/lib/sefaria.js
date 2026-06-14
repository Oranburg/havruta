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

// Load both amudim of a daf. A daf ref like "Chullin 44" has two sides.
// Returns { a: {...}, b: {...} }.
export async function getDafText(ref) {
  const [a, b] = await Promise.all([getAmud(`${ref}a`), getAmud(`${ref}b`)]);
  return { a, b };
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
