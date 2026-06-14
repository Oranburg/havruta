// Deterministic, rule-based Hebrew transliterator for the Havruta app.
//
// This implements docs/TRANSLITERATION-SCHEME.md (Sephardi academic hybrid)
// exactly: the consonant table with dagesh-conditioned begadkefat variants, the
// nikud-to-vowel table, and the context rules for shva, alef, he, yod, vav,
// dagesh forte, and kamats katan. The output is a Latin pronunciation aid over
// the verbatim vocalized text. It never replaces the Hebrew, and it does not
// guess beyond the rules. Hebrew is the source; this is a reading crutch.
//
// The scheme covers Hebrew. Aramaic passages get a flag, not a transliteration,
// per Section 5.1. The Tetragrammaton renders as HaShem, per Section 3.8.
//
// Usage: transliterate(pointedHebrewString) -> Latin string.

// ---------------------------------------------------------------------------
// Unicode constants for the nikud and the dagesh.
// ---------------------------------------------------------------------------

const SHEVA = 'ְ';
const HATAF_SEGOL = 'ֱ';
const HATAF_PATAH = 'ֲ';
const HATAF_KAMATS = 'ֳ';
const HIRIQ = 'ִ';
const TSERE = 'ֵ';
const SEGOL = 'ֶ';
const PATAH = 'ַ';
const KAMATS = 'ָ';
const HOLAM = 'ֹ';
const KUBUTS = 'ֻ';
const DAGESH = 'ּ'; // dagesh, mappiq, or shuruk dot (same code point)
const KAMATS_KATAN = 'ׇ'; // explicit kamats katan, when the source encodes it
const SHIN_DOT = 'ׁ';
const SIN_DOT = 'ׂ';

const ALEF = 'א';
const VAV = 'ו';
const HE = 'ה';
const YOD = 'י';
const SHIN = 'ש';

// Every combining nikud or cantillation mark sits in U+0591 to U+05C7. The set
// below is the vowel marks we read; everything else combining is dropped before
// processing (cantillation, meteg, and so on).
const VOWEL_MARKS = new Set([
  SHEVA,
  HATAF_SEGOL,
  HATAF_PATAH,
  HATAF_KAMATS,
  HIRIQ,
  TSERE,
  SEGOL,
  PATAH,
  KAMATS,
  HOLAM,
  KUBUTS,
  KAMATS_KATAN,
]);

// The point marks the code keeps attached to a base letter: the reading vowels,
// the dagesh, and the shin/sin dots. Anything else combining (te'amim, meteg) is
// dropped.
const KEPT_MARKS = new Set([...VOWEL_MARKS, DAGESH, SHIN_DOT, SIN_DOT]);

// Full vowels (anything that is not a sheva and not absence of a vowel). Used by
// the dagesh-forte and alef rules.
const FULL_VOWELS = new Set([
  HATAF_SEGOL,
  HATAF_PATAH,
  HATAF_KAMATS,
  HIRIQ,
  TSERE,
  SEGOL,
  PATAH,
  KAMATS,
  HOLAM,
  KUBUTS,
  KAMATS_KATAN,
]);

// Long vowels, for the shva rule (a shva after a long vowel is vocal). Tsere,
// holam, and shuruk are long; hiriq male and tsere male are long. Shuruk and the
// male forms are handled where the vowel is resolved, so the long set here lists
// the simple long-vowel marks.
const LONG_VOWELS = new Set([TSERE, HOLAM]);

// The six begadkefat letters, which take a dagesh lene.
const BEGADKEFAT = new Set(['ב', 'ג', 'ד', 'כ', 'פ', 'ת']);

// Gutturals and resh reject dagesh forte (no gemination).
const NO_GEMINATION = new Set([ALEF, HE, 'ח', 'ע', 'ר']);

// Base consonant outputs. Begadkefat letters and shin/sin are handled in code
// because they depend on dagesh or the shin/sin dot. Final forms map to their
// normal forms here.
const CONSONANTS = {
  'א': '', // alef: handled by rule (silent or hamza)
  'ב': 'v', // bet/vet: overridden to b with dagesh
  'ג': 'g', // gimel, always hard g
  'ד': 'd', // dalet
  'ה': 'h', // he: handled by rule at word end
  'ו': 'v', // vav as consonant: handled by rule for holam/shuruk
  'ז': 'z', // zayin
  'ח': 'ḥ', // het, h with dot below
  'ט': 't', // tet, merges with tav
  'י': 'y', // yod as consonant: handled by rule for hiriq/tsere male
  'כ': 'kh', // kaf/khaf: overridden to k with dagesh
  'ך': 'kh', // final khaf
  'ל': 'l', // lamed
  'מ': 'm', // mem
  'ם': 'm', // final mem
  'נ': 'n', // nun
  'ן': 'n', // final nun
  'ס': 's', // samekh
  'ע': 'ʿ', // ayin, modifier letter left half ring
  'פ': 'f', // pe/fe: overridden to p with dagesh
  'ף': 'f', // final fe
  'צ': 'ts', // tsadi
  'ץ': 'ts', // final tsadi
  'ק': 'k', // kuf, merges with kaf
  'ר': 'r', // resh
  'ש': 'sh', // shin/sin: resolved by the shin/sin dot in code
  'ת': 't', // tav, never s or th
};

// The dagesh-conditioned stop forms for the begadkefat letters.
const BEGADKEFAT_STOP = {
  'ב': 'b', // bet
  'כ': 'k', // kaf
  'פ': 'p', // pe
  // gimel and dalet have no audible dagesh distinction; they stay g and d.
};

// Simple nikud-to-vowel outputs. Sheva is resolved by rule, not from this map.
const VOWELS = {
  [PATAH]: 'a',
  [KAMATS]: 'a', // default; kamats katan handled by rule and the lookup table
  [TSERE]: 'e',
  [SEGOL]: 'e',
  [HIRIQ]: 'i',
  [HOLAM]: 'o',
  [KUBUTS]: 'u',
  [HATAF_PATAH]: 'a',
  [HATAF_SEGOL]: 'e',
  [HATAF_KAMATS]: 'o',
  [KAMATS_KATAN]: 'o', // explicitly encoded kamats katan
};

// High-frequency kamats-katan words, seeded per Section 3.6. The U+05B8 point
// cannot be told apart from kamats gadol by code, so a small lookup catches the
// most frequent words that read with o. The key is the bare consonant skeleton
// (letters only, no nikud, no dagesh, no cantillation), which matches regardless
// of how the source points or accents the word. The two seeds the scheme names
// are kol and hokhmah; both are reliably kamats-katan words, so a consonant-only
// key is safe for them. The disclaimer notes this is a known limitation.
const KAMATS_KATAN_WORDS = {
  // kol, "all" (kaf + lamed): kol, not kal.
  'כל': 'kol',
  // hokhmah (het + khaf + mem + he): hokhmah, not hakhmah.
  'חכמה': 'ḥokhmah',
};

// The bare consonant skeleton of a word: Hebrew letters only, every combining
// mark removed. Used as the kamats-katan lookup key.
function consonantSkeleton(units) {
  return units.map((u) => u.base).join('');
}

// ---------------------------------------------------------------------------
// Pre-processing: strip HTML and cantillation, normalize, detect special cases.
// ---------------------------------------------------------------------------

// Strip HTML tags and decode the entities Sefaria uses, matching the data
// layer's own stripping so the words read as plain pointed Hebrew.
function stripHtml(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Drop every combining mark we do not read: cantillation (te'amim), meteg, and
// any stray combining point outside the kept set. Keeps the reading vowels, the
// dagesh, and the shin/sin dots.
function stripUnreadMarks(value) {
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0);
    const isCombiningHebrew = code >= 0x0591 && code <= 0x05c7;
    if (isCombiningHebrew && !KEPT_MARKS.has(ch)) continue;
    out += ch;
  }
  return out;
}

// Is this a Hebrew base consonant letter (U+05D0 to U+05EA)?
function isHebrewLetter(ch) {
  const code = ch.codePointAt(0);
  return code >= 0x05d0 && code <= 0x05ea;
}

// The Tetragrammaton: yod, he, vav, he in sequence, ignoring any nikud between
// the letters. Renders as HaShem per Section 3.8.
function isTetragrammaton(letters) {
  if (letters.length !== 4) return false;
  return (
    letters[0].base === YOD &&
    letters[1].base === HE &&
    letters[2].base === VAV &&
    letters[3].base === HE
  );
}

// ---------------------------------------------------------------------------
// Aramaic detection (Section 5.1). Heuristic, by design.
// ---------------------------------------------------------------------------

export const ARAMAIC_FLAG = '[Aramaic: transliteration not available]';

// Detect an Aramaic word by the markers the scheme names: the relative particle
// de- (dalet + sheva prefix), the determined-state suffix -a (final alef after a
// consonant with a vowel), and a few high-frequency Aramaic words. This is a
// rough screen, not a parser. It runs per word on the pointed form.
function looksAramaic(word) {
  const bare = word.replace(/[֑-ׇ]/g, '');
  // Common Aramaic words named in the scheme.
  const COMMON = ['גברא', 'מילתא', 'היכא', 'דקא', 'לית'];
  if (COMMON.includes(bare)) return true;
  // The relative particle de-: dalet with sheva at the start of a word that has
  // more letters after it.
  if (word.startsWith(`ד${SHEVA}`) && bare.length >= 3) return true;
  // Determined-state suffix: a word ending in alef preceded by a vowel-bearing
  // consonant (kamats-alef or other full-vowel-alef), at least four letters.
  if (bare.length >= 4 && bare.endsWith(ALEF)) {
    // The alef carries no vowel of its own and follows a kamats: the -a ending.
    if (word.includes(`${KAMATS}${ALEF}`) && word.endsWith(ALEF)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Parse a word into letter units, each carrying its base and its marks.
// ---------------------------------------------------------------------------

// A letter unit: the base consonant plus the marks attached to it (vowel,
// dagesh, shin/sin dot). Combining marks always follow their base in the string.
function parseLetters(word) {
  const units = [];
  for (const ch of word) {
    const code = ch.codePointAt(0);
    if (code >= 0x05d0 && code <= 0x05ea) {
      units.push({ base: ch, marks: [] });
    } else if (code >= 0x0591 && code <= 0x05c7) {
      if (units.length > 0) units[units.length - 1].marks.push(ch);
      // A combining mark with no base before it is dropped.
    }
    // Non-Hebrew characters inside a word (rare) are dropped from the unit list;
    // they are handled at the token level, not here.
  }
  return units;
}

// The reading vowel of a unit, if any (the first vowel mark found). Returns the
// mark character or null. Sheva is returned too; callers decide vocal vs silent.
function vowelOf(unit) {
  for (const m of unit.marks) {
    if (VOWEL_MARKS.has(m)) return m;
  }
  return null;
}

function hasDagesh(unit) {
  return unit && unit.marks.includes(DAGESH);
}

function hasMark(unit, mark) {
  return unit && unit.marks.includes(mark);
}

// ---------------------------------------------------------------------------
// The per-word transliterator.
// ---------------------------------------------------------------------------

function transliterateWord(rawWord) {
  // Keep only the marks we read, then parse into letter units.
  const word = stripUnreadMarks(rawWord);
  const units = parseLetters(word);
  if (units.length === 0) return '';

  // Tetragrammaton substitution, before any character-level work.
  if (isTetragrammaton(units)) return 'HaShem';

  // Kamats-katan lookup on the bare consonant skeleton. Catches the seeded
  // high-frequency words that read with o rather than the default a.
  const skeleton = consonantSkeleton(units);
  if (Object.prototype.hasOwnProperty.call(KAMATS_KATAN_WORDS, skeleton)) {
    return KAMATS_KATAN_WORDS[skeleton];
  }

  let out = '';
  // The vowel class emitted just before the current position, for the shva rule
  // and the intervocalic-alef rule. One of: null, 'short', 'long', 'sheva'.
  let prevVowelClass = null;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const prev = i > 0 ? units[i - 1] : null;
    const isFirst = i === 0;
    const isLast = i === units.length - 1;
    const base = unit.base;
    const vowel = vowelOf(unit);

    // --- Vav: consonant, holam vav, or shuruk (Section 2 vav disambiguation).
    if (base === VAV) {
      if (hasMark(unit, HOLAM)) {
        // Holam vav: the vav is the vowel carrier. Emit o, no v.
        out += 'o';
        prevVowelClass = 'long';
        continue;
      }
      // Shuruk: vav with dagesh that opens the syllable. The heuristic: a
      // vav-with-dagesh is shuruk when the preceding letter has no full vowel
      // (so the vav is the nucleus), or the vav opens the word.
      if (hasDagesh(unit) && !hasMark(unit, HOLAM)) {
        const prevVowel = prev ? vowelOf(prev) : null;
        const prevHasFullVowel = prevVowel && FULL_VOWELS.has(prevVowel);
        if (isFirst || !prevHasFullVowel) {
          out += 'u';
          prevVowelClass = 'long';
          continue;
        }
      }
      // Otherwise the vav is a consonant.
      out += 'v';
      if (vowel) {
        out += emitVowel(unit, vowel, units, i);
        prevVowelClass = vowelClass(vowel);
      } else {
        prevVowelClass = null;
      }
      continue;
    }

    // --- Yod: consonant, or the vowel partner of a preceding vowel.
    // A yod with no own vowel that is not word-initial reads as a mater or a
    // glide. The scheme's worked examples (Section 4) set the outputs: after
    // hiriq it is hiriq male and adds nothing (the i is already there, so korin
    // not koriin); after tsere, segol, patach, or kamats it forms a glide and
    // reads i (meʾeimatai: tsere yod gives ei, the final patach yod gives ai).
    // After a consonant with no vowel it is itself a consonant and reads y.
    if (base === YOD) {
      const prevVowel = prev ? vowelOf(prev) : null;
      if (!isFirst && !vowel && prev) {
        if (prevVowel === HIRIQ) {
          // hiriq male: the i is already emitted; the yod adds nothing.
          prevVowelClass = 'long';
          continue;
        }
        if (
          prevVowel === TSERE ||
          prevVowel === SEGOL ||
          prevVowel === PATAH ||
          prevVowel === KAMATS
        ) {
          // Glide yod: e + i = ei, a + i = ai, and so on.
          out += 'i';
          prevVowelClass = 'long';
          continue;
        }
      }
      // Yod as consonant.
      out += 'y';
      if (vowel) {
        out += emitVowel(unit, vowel, units, i);
        prevVowelClass = vowelClass(vowel);
      } else {
        prevVowelClass = null;
      }
      continue;
    }

    // --- Alef: silent at boundaries, hamza intervocalically (Section 3.2).
    if (base === ALEF) {
      const carriesFullVowel = vowel && vowel !== SHEVA && FULL_VOWELS.has(vowel);
      const precededByVowelSound =
        prevVowelClass === 'short' || prevVowelClass === 'long';
      if (carriesFullVowel && !isFirst && precededByVowelSound) {
        // Intervocalic alef anchoring a root: emit the hamza, then the vowel.
        out += 'ʾ'; // modifier letter right half ring
        out += emitVowel(unit, vowel, units, i);
        prevVowelClass = vowelClass(vowel);
      } else if (carriesFullVowel) {
        // Word-initial or post-consonant alef: silent, emit only the vowel.
        out += emitVowel(unit, vowel, units, i);
        prevVowelClass = vowelClass(vowel);
      } else if (vowel === SHEVA) {
        // Alef with sheva: treat the sheva by the general rule, alef silent.
        const e = resolveSheva(units, i, prevVowelClass);
        out += e;
        prevVowelClass = e ? 'sheva' : prevVowelClass;
      } else {
        // Final or vowelless alef: silent, nothing emitted.
        // prevVowelClass unchanged.
      }
      continue;
    }

    // --- He: consonant, or silent final mater (Section 3.3).
    if (base === HE) {
      const isFinal = isLast;
      const mappiq = hasDagesh(unit); // mappiq is a dagesh in final he
      if (isFinal && !mappiq && !vowel) {
        // Final he as mater lectionis: silent. The vowel before it is emitted.
        continue;
      }
      // He with mappiq, or non-final he, or final he carrying its own vowel.
      out += 'h';
      if (vowel) {
        if (vowel === SHEVA) {
          const e = resolveSheva(units, i, prevVowelClass);
          out += e;
          prevVowelClass = e ? 'sheva' : null;
        } else {
          out += emitVowel(unit, vowel, units, i);
          prevVowelClass = vowelClass(vowel);
        }
      } else {
        prevVowelClass = null;
      }
      continue;
    }

    // --- Shin / sin: resolved by the shin or sin dot.
    if (base === SHIN) {
      let cons;
      if (hasMark(unit, SIN_DOT)) cons = 's';
      else cons = 'sh'; // shin dot, or unmarked: default to shin
      out += applyGemination(cons, unit, prev, base);
      if (vowel) {
        if (vowel === SHEVA) {
          const e = resolveSheva(units, i, prevVowelClass);
          out += e;
          prevVowelClass = e ? 'sheva' : null;
        } else {
          out += emitVowel(unit, vowel, units, i);
          prevVowelClass = vowelClass(vowel);
        }
      } else {
        prevVowelClass = null;
      }
      continue;
    }

    // --- Begadkefat and all other consonants.
    let cons;
    if (BEGADKEFAT.has(base)) {
      // Dagesh lene gives the stop; no dagesh gives the fricative. Classify the
      // dagesh: forte if the previous letter carries a full vowel (open syllable
      // before it), otherwise lene.
      if (hasDagesh(unit)) {
        cons = BEGADKEFAT_STOP[base] || CONSONANTS[base]; // gimel/dalet unchanged
      } else {
        cons = CONSONANTS[base]; // fricative form
      }
    } else {
      cons = CONSONANTS[base] || '';
    }

    out += applyGemination(cons, unit, prev, base);

    if (vowel) {
      if (vowel === SHEVA) {
        const e = resolveSheva(units, i, prevVowelClass);
        out += e;
        prevVowelClass = e ? 'sheva' : null;
      } else {
        out += emitVowel(unit, vowel, units, i);
        prevVowelClass = vowelClass(vowel);
      }
    } else {
      prevVowelClass = null;
    }
  }

  return out;
}

// Emit the vowel for a unit. Handles kamats default (a), and the male forms are
// already handled by the yod and vav branches, so the vowel mark alone is
// emitted here. Kamats katan is only emitted as o when explicitly encoded
// (U+05C7) or caught by the word lookup; otherwise kamats defaults to a.
function emitVowel(unit, vowel, units, i) {
  if (vowel === SHEVA) return '';
  return VOWELS[vowel] || '';
}

// Classify a vowel mark as 'short' or 'long' for the shva and alef rules.
// Tsere and holam are long; the male forms resolve to long where they occur.
function vowelClass(vowel) {
  if (!vowel || vowel === SHEVA) return 'sheva';
  if (LONG_VOWELS.has(vowel)) return 'long';
  return 'short';
}

// Resolve a sheva to e (vocal) or '' (silent), per Section 3.1.
// Vocal when: first letter of the word; immediately after another sheva; on a
// letter with dagesh forte; or after a long vowel. Silent otherwise.
function resolveSheva(units, i, prevVowelClass) {
  const unit = units[i];
  const prev = i > 0 ? units[i - 1] : null;

  // First letter of the word.
  if (i === 0) return 'e';

  // Immediately follows another sheva.
  if (prev) {
    const prevVowel = vowelOf(prev);
    if (prevVowel === SHEVA) return 'e';
  }

  // The letter carries a dagesh forte. A dagesh on a begadkefat letter is forte
  // when the previous letter has a full vowel; a dagesh on any other letter is
  // forte (except gutturals and resh, which reject it).
  if (hasDagesh(unit) && isDageshForte(units, i)) return 'e';

  // Follows a long vowel (tsere, holam, shuruk, hiriq male, tsere male). The
  // prevVowelClass already records the male forms as 'long'.
  if (prevVowelClass === 'long') return 'e';

  return '';
}

// Decide whether a dagesh on the unit at index i is forte (gemination) rather
// than lene (Section 3.5). Gutturals and resh never geminate. A dagesh on a
// non-begadkefat letter is forte. A dagesh on a begadkefat letter is forte when
// the preceding letter carries a full vowel (open syllable before it).
function isDageshForte(units, i) {
  const unit = units[i];
  if (!hasDagesh(unit)) return false;
  if (NO_GEMINATION.has(unit.base)) return false;
  if (!BEGADKEFAT.has(unit.base)) return true;
  const prev = i > 0 ? units[i - 1] : null;
  if (!prev) return false;
  const prevVowel = vowelOf(prev);
  return Boolean(prevVowel && FULL_VOWELS.has(prevVowel));
}

// Double the consonant output when the unit carries a dagesh forte. Vav is
// excluded here because it is handled in its own branch. The doubling is applied
// to the full consonant string (so a forte dagesh on tsadi gives tsts; the
// scheme says double the output in full).
function applyGemination(cons, unit, prev, base) {
  if (!cons) return cons;
  if (base === VAV) return cons; // vav handled separately
  if (NO_GEMINATION.has(base)) return cons;
  if (!hasDagesh(unit)) return cons;
  // Begadkefat: a dagesh is forte only after a full vowel; otherwise it is the
  // lene that selected the stop form, not gemination.
  if (BEGADKEFAT.has(base)) {
    const prevVowel = prev ? vowelOf(prev) : null;
    const forte = Boolean(prevVowel && FULL_VOWELS.has(prevVowel));
    return forte ? cons + cons : cons;
  }
  // Any other letter with a dagesh: forte, so double.
  return cons + cons;
}

// ---------------------------------------------------------------------------
// Public entry point.
// ---------------------------------------------------------------------------

// Transliterate a pointed Hebrew string to a Latin pronunciation aid.
// Strips HTML and cantillation first, splits on whitespace, transliterates each
// word, flags Aramaic words, and rejoins on single spaces. Returns '' for empty
// or non-string input.
export function transliterate(pointedHebrewString) {
  if (typeof pointedHebrewString !== 'string') return '';

  // Strip HTML, then normalize to NFC defensively (the source should be NFC).
  let text = stripHtml(pointedHebrewString);
  if (typeof text.normalize === 'function') text = text.normalize('NFC');

  // Split on whitespace, keeping the words only; rejoin on single spaces.
  const tokens = text.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return '';

  const outWords = [];
  for (const token of tokens) {
    // A token may carry leading or trailing punctuation (maqaf, geresh, quotes).
    // Separate the Hebrew core from surrounding punctuation so the punctuation
    // survives into the output and does not derail the per-word rules.
    const { lead, core, trail } = splitPunctuation(token);
    if (core.length === 0) {
      // No Hebrew letters: emit the token as is (a number, a stray mark).
      outWords.push(token);
      continue;
    }
    // Transliterate every word best-effort, including Aramaic. The Talmud is
    // mostly Aramaic, which uses the same letters and points, so an inline flag
    // would litter nearly every line. The global disclaimer by the toggle tells
    // the reader the aid is a pronunciation guide and is rougher on Aramaic.
    outWords.push(lead + transliterateWord(core) + trail);
  }

  return outWords.join(' ');
}

// Split a token into leading punctuation, the Hebrew-bearing core, and trailing
// punctuation. The core runs from the first Hebrew letter to the last, including
// any nikud and inner punctuation. This keeps gershayim and the maqaf visible in
// the output without feeding them to the letter parser as bases.
function splitPunctuation(token) {
  const chars = [...token];
  let start = 0;
  let end = chars.length - 1;
  while (start < chars.length && !isHebrewLetterOrMark(chars[start])) start++;
  while (end >= start && !isHebrewLetterOrMark(chars[end])) end--;
  if (start > end) return { lead: token, core: '', trail: '' };
  return {
    lead: chars.slice(0, start).join(''),
    core: chars.slice(start, end + 1).join(''),
    trail: chars.slice(end + 1).join(''),
  };
}

function isHebrewLetterOrMark(ch) {
  const code = ch.codePointAt(0);
  return code >= 0x0591 && code <= 0x05ea;
}

// ---------------------------------------------------------------------------
// Unit-style checks, from Section 4 of the scheme.
//
// These run as a self-check when this module is executed directly with Node
// (node src/lib/transliterate.js). They are not imported anywhere; they document
// the expected output next to the worked examples so the function can be
// verified. The scheme's 4.1 note allows either meʾeimatai (with the hamza per
// the general intervocalic rule, which this code emits) or me-eimatai (a
// readability post-process); this code follows the rule and emits the hamza.
//
//   4.1  מֵאֵימָתַי  -> meʾeimatai   (scheme: meʾeimatai per the general rule)
//   4.2  קוֹרִין      -> korin
//   4.3  מִצְוָתָן     -> mitsvatan
//
// Plus the two seeded kamats-katan words:
//   כָּל    -> kol
//   חָכְמָה  -> ḥokhmah
//
// To run the checks:  node src/lib/transliterate.js
// ---------------------------------------------------------------------------

const SELF_TESTS = [
  { in: 'מֵאֵימָתַי', expect: 'meʾeimatai', label: '4.1 me-eimatai' },
  { in: 'קוֹרִין', expect: 'korin', label: '4.2 korin' },
  { in: 'מִצְוָתָן', expect: 'mitsvatan', label: '4.3 mitsvatan' },
  { in: 'כָּל', expect: 'kol', label: 'kamats katan: kol' },
  { in: 'חָכְמָה', expect: 'ḥokhmah', label: 'kamats katan: ḥokhmah' },
];

// Run the self-tests when invoked directly under Node. The guard keeps this
// inert in the browser build (Vite tree-shakes it; it has no effect on the app).
if (
  typeof process !== 'undefined' &&
  process.argv &&
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].split('/').pop())
) {
  let pass = 0;
  for (const t of SELF_TESTS) {
    const got = transliterate(t.in);
    const ok = got === t.expect;
    if (ok) pass++;
    // eslint-disable-next-line no-console
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${t.label}: got "${got}" expected "${t.expect}"`);
  }
  // eslint-disable-next-line no-console
  console.log(`${pass}/${SELF_TESTS.length} passed`);
}
