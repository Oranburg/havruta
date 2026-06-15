// The saved record of study sessions.
//
// Requirement 5 of docs/CONSTITUTION.md: every session is saved. The daf, the
// reader's reading, the partner's challenges, and the reader's responses. The
// record stays on the device, is never sent anywhere, and is never committed.
// It keeps the partner's challenges even when the reading overcame them,
// because the challenge is the memory of what the reading had to survive.
//
// Storage is localStorage under one namespaced key holding an array of sessions.

const STORE_KEY = 'havruta-sessions';

// Read all saved sessions, newest first. Returns [] on any read or parse error
// rather than throwing, so a corrupt store never blocks the app.
export function listSessions() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice()
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  } catch {
    return [];
  }
}

function writeAll(sessions) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(sessions));
  } catch {
    // QuotaExceededError or private-mode restriction: the write silently fails.
    // The session record was valid in memory for this visit; it just cannot persist.
  }
}

// A short, sortable id. crypto.randomUUID when available, a fallback otherwise.
function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Create a new session record and store it. The exchange is the full message
// array exchanged with the partner; the reading is the reader's first reading.
// Returns the stored record (with its id) so the caller can keep updating it.
export function createSession({
  dafRef,
  dafDisplay,
  reading,
  messages,
  segmentRef,
  segmentLabel,
}) {
  const record = {
    id: makeId(),
    dafRef: dafRef || '',
    dafDisplay: dafDisplay || dafRef || '',
    // When the session is about one line rather than the whole page, these name
    // it: the Sefaria segment ref and a human label like "Amud a 3". Empty for a
    // whole-page session.
    segmentRef: segmentRef || '',
    segmentLabel: segmentLabel || '',
    savedAt: Date.now(),
    // The reader's own readings, in order. The first reading opens the session;
    // any later readings the reader writes are appended here too.
    readings: reading ? [reading] : [],
    // The full message exchange: user turns and the partner's challenges, in
    // order, exactly as sent and received.
    messages: Array.isArray(messages) ? messages : [],
  };
  const all = listSessions();
  all.push(record);
  writeAll(all);
  return record;
}

// Update an existing session in place by id. Pass the fields to replace.
export function updateSession(id, fields) {
  const all = listSessions();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...fields, savedAt: Date.now() };
  all[idx] = updated;
  writeAll(all);
  return updated;
}

// Delete one session by id.
export function deleteSession(id) {
  const all = listSessions().filter((s) => s.id !== id);
  writeAll(all);
}

// The line-by-line sessions for one daf, in reading order, one per line (the most
// recent if a line was taken up more than once). This is what the synthesis
// partner reads to help the reader pull the page together. Whole-page sessions
// (those with no segmentRef) are left out; this is the line work.
export function listLineSessionsForDaf(dafRef) {
  if (!dafRef) return [];
  const all = listSessions().filter(
    (s) => s && s.dafRef === dafRef && s.segmentRef
  );
  // listSessions is newest first, so the first seen per line is the latest.
  const byLine = new Map();
  for (const s of all) {
    if (!byLine.has(s.segmentRef)) byLine.set(s.segmentRef, s);
  }
  // Order by amud (a before b) then segment number, parsed from the ref tail
  // "Chullin 46a:3".
  const orderKey = (s) => {
    const m = /([ab]):(\d+)\s*$/.exec(s.segmentRef || '');
    const amud = m ? (m[1] === 'a' ? 0 : 1) : 9;
    const idx = m ? parseInt(m[2], 10) : 9999;
    return amud * 100000 + idx;
  };
  return [...byLine.values()].sort((a, b) => orderKey(a) - orderKey(b));
}
