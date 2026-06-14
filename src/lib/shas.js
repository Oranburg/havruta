// The structure of the Babylonian Talmud, built from Sefaria, never invented.
//
// The whole-Shas map needs the six orders (sedarim), the tractates in each, and
// the number of dapim in each tractate. None of that is hardcoded from memory.
// It comes from Sefaria's shape API and is cached on the device so the map works
// offline and does not refetch on every visit. See docs/SOURCES.md.
//
// Data source, verified on 2026-06-13:
//   https://www.sefaria.org/api/shape/Talmud
// One call returns every Talmud tractate as an object with `section` (the seder),
// `title`, `heTitle`, and `chapters` (an array indexed by amud, so its length
// divided by two and rounded up is the highest daf). The Bavli tractate names
// were cross-checked against the table of contents at
//   https://www.sefaria.org/api/index/  (Talmud > Bavli)
// to keep the Yerushalmi and the minor tractates out of the daf yomi Shas.

const SHAPE_URL = 'https://www.sefaria.org/api/shape/Talmud';
const CACHE_KEY = 'havruta-shas-structure';

// The six orders of the Mishnah and Talmud, in their traditional sequence, with
// the Hebrew name of each. The shape API tags every tractate with its section;
// these are the section names of the daf yomi Shas. Their order here is the order
// the map shows them in.
const SEDARIM = [
  { section: 'Seder Zeraim', he: 'סדר זרעים', en: 'Seder Zeraim' },
  { section: 'Seder Moed', he: 'סדר מועד', en: 'Seder Moed' },
  { section: 'Seder Nashim', he: 'סדר נשים', en: 'Seder Nashim' },
  { section: 'Seder Nezikin', he: 'סדר נזיקין', en: 'Seder Nezikin' },
  { section: 'Seder Kodashim', he: 'סדר קדשים', en: 'Seder Kodashim' },
  { section: 'Seder Tahorot', he: 'סדר טהרות', en: 'Seder Tahorot' },
];

const SECTION_SET = new Set(SEDARIM.map((s) => s.section));

// Fetch JSON and throw a readable error on failure, matching sefaria.js.
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

// The highest daf number in a tractate, read from the shape API's chapters
// array. Sefaria indexes that array by amud (side), so index 2 is daf 2 side a,
// index 3 is daf 2 side b, and so on. The array length divided by two and
// rounded up is the last daf. Returns 0 when the shape is missing, so a tractate
// with no verifiable length is dropped rather than guessed.
function lastDafFromChapters(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) return 0;
  return Math.ceil(chapters.length / 2);
}

// Turn the raw shape API response into the structure the map renders: the six
// sedarim in order, each with its Bavli tractates, each tractate with its last
// daf. The Talmud bavli starts at daf 2 (there is no daf 1), so a tractate's
// study dapim run from 2 through its last daf.
function buildStructure(rawList) {
  const list = Array.isArray(rawList) ? rawList : [];

  // Group the matching tractates by section, in the order Sefaria returns them
  // within each section (which follows the traditional sequence).
  const bySection = new Map();
  for (const item of list) {
    if (!item || !SECTION_SET.has(item.section)) continue;
    // The shape API mixes the Yerushalmi into the same sections; its titles are
    // prefixed "Jerusalem Talmud". Keep only the Bavli tractates.
    const title = item.title || '';
    if (!title || /^Jerusalem Talmud/.test(title)) continue;
    const lastDaf = lastDafFromChapters(item.chapters);
    if (lastDaf < 2) continue;
    if (!bySection.has(item.section)) bySection.set(item.section, []);
    bySection.get(item.section).push({
      title,
      heTitle: item.heTitle || '',
      lastDaf,
    });
  }

  const orders = SEDARIM.map((seder) => ({
    section: seder.section,
    en: seder.en,
    he: seder.he,
    tractates: bySection.get(seder.section) || [],
  })).filter((order) => order.tractates.length > 0);

  return { fetchedAt: Date.now(), orders };
}

// Read the cached structure, or null if there is none or it is unreadable.
export function readCachedStructure() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.orders) || parsed.orders.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(structure) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(structure));
  } catch {
    // Storage may be full or unavailable. The map still works for this visit
    // from the in-memory value; it just refetches next time.
  }
}

// Get the Shas structure. Returns the cached copy when one exists so the map
// loads instantly and works offline. Pass { force: true } to refetch. On a fetch
// failure with no cache, the error propagates so the page can show a calm
// message rather than invented counts.
export async function getShasStructure({ force = false } = {}) {
  if (!force) {
    const cached = readCachedStructure();
    if (cached) return cached;
  }
  const raw = await getJson(SHAPE_URL);
  const structure = buildStructure(raw);
  if (structure.orders.length === 0) {
    throw new Error('Sefaria returned no Talmud structure to build the map from.');
  }
  writeCache(structure);
  return structure;
}

// Total study dapim across the whole Shas. Each tractate runs from daf 2 through
// its last daf, so it has lastDaf minus one dapim.
export function totalDapim(structure) {
  if (!structure || !Array.isArray(structure.orders)) return 0;
  let total = 0;
  for (const order of structure.orders) {
    for (const tractate of order.tractates) {
      total += Math.max(0, tractate.lastDaf - 1);
    }
  }
  return total;
}

// The set of daf refs the reader has a saved session for. The session's dafRef
// is a daf like "Chullin 44". Returns a Set for quick membership checks.
export function studiedDafSet(sessions) {
  const set = new Set();
  for (const s of sessions || []) {
    const ref = (s.dafRef || '').trim();
    if (ref) set.add(ref);
  }
  return set;
}

// The current study streak in days: consecutive calendar days, ending today or
// yesterday, on which the reader saved at least one session. A streak that last
// touched two or more days ago is over and counts as zero. The count is days the
// reader studied in a row, the way a daf yomi reader thinks about keeping the
// daily page.
export function currentStreak(sessions) {
  const days = new Set();
  for (const s of sessions || []) {
    if (!s.savedAt) continue;
    const d = new Date(s.savedAt);
    if (Number.isNaN(d.getTime())) continue;
    days.add(dayKey(d));
  }
  if (days.size === 0) return 0;

  // Start from today; if today has no session, allow the streak to end
  // yesterday, so an unfinished today does not erase the run.
  const today = new Date();
  let cursor = new Date(today);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// A local-day key, YYYY-MM-DD, so two sessions on the same calendar day count
// once and consecutive days line up.
function dayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
