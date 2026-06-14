// Detect the rhetorical opener of a Talmud segment, so the page can mark the
// lines where a real study partner would stop and press.
//
// The Gemara signals its turns with a small set of opening words: a named voice
// speaking, a taught source (a braita), an objection, a question. A learner
// reading with a havruta pounces on these. The app cannot read the whole
// argument, but it can recognize these openers and make the invitation to take
// up the line stronger right there. This never forces a stop; it only labels the
// natural place for one.
//
// The match is deliberately conservative: it strips HTML and vowel points, looks
// at the first one or two words only, and returns null when nothing clearly
// matches. A missed opener costs nothing (the line still shows the plain
// "Discuss this line" invitation); a false one would mislabel, so the word lists
// are short and specific.

// Combining Hebrew points and cantillation, U+0591 to U+05C7.
const POINTS = /[֑-ׇ]/g;

// Reduce a raw Hebrew segment to bare consonantal words: strip HTML, drop the
// points, drop everything that is not a Hebrew letter or a space, collapse runs.
function bareWords(he) {
  return String(he || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(POINTS, '')
    .replace(/[^א-ת\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

// Each group: a cue shown to the reader, and the bare-consonant first words that
// trigger it. Checked in order, so an objection or a taught source is named
// before the generic "a new voice speaks" that a bare אמר would trigger.
const GROUPS = [
  {
    cue: 'An objection enters here.',
    first: ['מתיב', 'מיתיבי', 'איתיביה', 'איתיבי'],
  },
  {
    cue: 'A taught source is cited here.',
    // תנו רבנן, תניא, דתניא, תנן, and תא שמע (first word תא).
    first: ['תנו', 'תניא', 'דתניא', 'תנן', 'תא'],
  },
  {
    cue: 'A question is raised here.',
    first: ['מאי', 'קשיא', 'איבעיא', 'מנא', 'מנהני'],
  },
  {
    cue: 'A new voice speaks here.',
    first: ['אמר', 'איתמר', 'אמרי', 'אמרו'],
  },
];

// Return { cue } for a segment that opens with a recognized marker, or null.
export function detectOpener(he) {
  const words = bareWords(he);
  if (words.length === 0) return null;
  const first = words[0];
  for (const group of GROUPS) {
    if (group.first.includes(first)) {
      return { cue: group.cue };
    }
  }
  return null;
}
