// Deterministic, rule-based Hebrew transliterator for the Havruta app.
//
// One scheme: the Shofar magazine transliteration chart, which Seth supplied.
// The consonant values are Shofar's (aleph ’, ayin ‘, ḥet ḥ, khaf kh, tsadi ẓ,
// and so on). The vowel values and the structural rules (when a shva is vocal,
// how a dagesh forte geminates, how vav and yod and alef and he behave) are the
// app's own practical rules, not part of any published standard. This is a
// pronunciation aid, not an authority, and it is rougher on Aramaic. The
// Tetragrammaton renders as HaShem.
//
// The source text is the William Davidson Vocalized Edition from Sefaria, which
// carries full nikud and dagesh marks. The aid never replaces the Hebrew and it
// does not guess beyond the rules.
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
const DAGESH = 'ּ';
const KAMATS_KATAN = 'ׇ';
const SHIN_DOT = 'ׁ';
const SIN_DOT = 'ׂ';

const ALEF = 'א';
const VAV = 'ו';
const HE = 'ה';
const YOD = 'י';
const SHIN = 'ש';

// Shofar's marks for aleph and ayin: typographic single quotes, which render in
// ordinary fonts (unlike the modifier-letter half rings).
const ALEF_MARK = '’'; // ’ right single quotation mark
const AYIN_MARK = '‘'; // ‘ left single quotation mark

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

const KEPT_MARKS = new Set([...VOWEL_MARKS, DAGESH, SHIN_DOT, SIN_DOT]);

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

const LONG_VOWELS = new Set([TSERE, HOLAM]);

const BEGADKEFAT = new Set(['ב', 'ג', 'ד', 'כ', 'פ', 'ת']);

const NO_GEMINATION = new Set([ALEF, HE, 'ח', 'ע', 'ר']);

// ---------------------------------------------------------------------------
// The Shofar chart, plus the app's vowels.
// ---------------------------------------------------------------------------

// Consonant outputs for the letters handled in the general branch. Alef, he,
// vav, yod, and shin are handled by their own rules and do not read this table
// except where noted. Finals are included because they are handled here.
const CONSONANTS = {
  'א': ALEF_MARK, 'ב': 'v', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
  'ח': 'ḥ', 'ט': 't', 'י': 'y', 'כ': 'kh', 'ך': 'kh', 'ל': 'l', 'מ': 'm',
  'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': AYIN_MARK, 'פ': 'f', 'ף': 'f',
  'צ': 'ẓ', 'ץ': 'ẓ', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
};

const BEGADKEFAT_STOP = {
  'ב': 'b', 'כ': 'k', 'פ': 'p', 'ג': 'g', 'ד': 'd', 'ת': 't',
};
const BEGADKEFAT_FRICATIVE = {
  'ב': 'v', 'כ': 'kh', 'פ': 'f', 'ג': 'g', 'ד': 'd', 'ת': 't',
};

// The app's practical vowel values (not part of the Shofar consonant chart).
const VOWELS = {
  [PATAH]: 'a',
  [KAMATS]: 'a',
  [TSERE]: 'e',
  [SEGOL]: 'e',
  [HIRIQ]: 'i',
  [HOLAM]: 'o',
  [KUBUTS]: 'u',
  [HATAF_PATAH]: 'a',
  [HATAF_SEGOL]: 'e',
  [HATAF_KAMATS]: 'o',
  [KAMATS_KATAN]: 'o',
};

// The Latin a yod adds as a mater after a vowel (the glide): e + i = ei.
const MATER_YOD = {
  [TSERE]: 'i',
  [SEGOL]: 'i',
  [PATAH]: 'i',
  [KAMATS]: 'i',
};

const SHURUK = 'u';
const VOCAL_SHEVA = 'e';
const TETRAGRAMMATON = 'HaShem';

// High-frequency kamats-katan words: the U+05B8 point cannot be told from kamats
// gadol by code, so a small lookup catches the most frequent words that read o.
const KAMATS_KATAN_WORDS = {
  'כל': 'kol',
  'חכמה': 'ḥokhmah',
};

// ---------------------------------------------------------------------------
// Pre-processing.
// ---------------------------------------------------------------------------

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

function isTetragrammaton(letters) {
  if (letters.length !== 4) return false;
  return (
    letters[0].base === YOD &&
    letters[1].base === HE &&
    letters[2].base === VAV &&
    letters[3].base === HE
  );
}

function consonantSkeleton(units) {
  return units.map((u) => u.base).join('');
}

// ---------------------------------------------------------------------------
// Parse a word into letter units.
// ---------------------------------------------------------------------------

function parseLetters(word) {
  const units = [];
  for (const ch of word) {
    const code = ch.codePointAt(0);
    if (code >= 0x05d0 && code <= 0x05ea) {
      units.push({ base: ch, marks: [] });
    } else if (code >= 0x0591 && code <= 0x05c7) {
      if (units.length > 0) units[units.length - 1].marks.push(ch);
    }
  }
  return units;
}

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
  const word = stripUnreadMarks(rawWord);
  const units = parseLetters(word);
  if (units.length === 0) return '';

  if (isTetragrammaton(units)) return TETRAGRAMMATON;

  const skeleton = consonantSkeleton(units);
  if (Object.prototype.hasOwnProperty.call(KAMATS_KATAN_WORDS, skeleton)) {
    return KAMATS_KATAN_WORDS[skeleton];
  }

  let out = '';
  let prevVowelClass = null;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const prev = i > 0 ? units[i - 1] : null;
    const isFirst = i === 0;
    const isLast = i === units.length - 1;
    const base = unit.base;
    const vowel = vowelOf(unit);

    // --- Vav.
    if (base === VAV) {
      if (hasMark(unit, HOLAM)) {
        out += VOWELS[HOLAM];
        prevVowelClass = 'long';
        continue;
      }
      if (hasDagesh(unit) && !hasMark(unit, HOLAM)) {
        const prevVowel = prev ? vowelOf(prev) : null;
        const prevHasFullVowel = prevVowel && FULL_VOWELS.has(prevVowel);
        if (isFirst || !prevHasFullVowel) {
          out += SHURUK;
          prevVowelClass = 'long';
          continue;
        }
      }
      out += 'v';
      if (vowel) {
        if (vowel === SHEVA) {
          const e = resolveSheva(units, i, prevVowelClass);
          out += e;
          prevVowelClass = e ? 'sheva' : null;
        } else {
          out += emitVowel(vowel);
          prevVowelClass = vowelClass(vowel);
        }
      } else {
        prevVowelClass = null;
      }
      continue;
    }

    // --- Yod.
    if (base === YOD) {
      const prevVowel = prev ? vowelOf(prev) : null;
      if (!isFirst && !vowel && prev) {
        if (prevVowel === HIRIQ) {
          prevVowelClass = 'long';
          continue;
        }
        if (
          prevVowel === TSERE ||
          prevVowel === SEGOL ||
          prevVowel === PATAH ||
          prevVowel === KAMATS
        ) {
          out += Object.prototype.hasOwnProperty.call(MATER_YOD, prevVowel)
            ? MATER_YOD[prevVowel]
            : 'i';
          prevVowelClass = 'long';
          continue;
        }
      }
      out += 'y';
      if (vowel) {
        if (vowel === SHEVA) {
          const e = resolveSheva(units, i, prevVowelClass);
          out += e;
          prevVowelClass = e ? 'sheva' : null;
        } else {
          out += emitVowel(vowel);
          prevVowelClass = vowelClass(vowel);
        }
      } else {
        prevVowelClass = null;
      }
      continue;
    }

    // --- Alef: silent at boundaries, the Shofar mark intervocalically.
    if (base === ALEF) {
      const carriesFullVowel = vowel && vowel !== SHEVA && FULL_VOWELS.has(vowel);
      const precededByVowelSound =
        prevVowelClass === 'short' || prevVowelClass === 'long';
      if (carriesFullVowel && !isFirst && precededByVowelSound) {
        out += ALEF_MARK;
        out += emitVowel(vowel);
        prevVowelClass = vowelClass(vowel);
      } else if (carriesFullVowel) {
        out += emitVowel(vowel);
        prevVowelClass = vowelClass(vowel);
      } else if (vowel === SHEVA) {
        const e = resolveSheva(units, i, prevVowelClass);
        out += e;
        prevVowelClass = e ? 'sheva' : prevVowelClass;
      }
      continue;
    }

    // --- He.
    if (base === HE) {
      const isFinal = isLast;
      const mappiq = hasDagesh(unit);
      if (isFinal && !mappiq && !vowel) {
        continue;
      }
      out += 'h';
      if (vowel) {
        if (vowel === SHEVA) {
          const e = resolveSheva(units, i, prevVowelClass);
          out += e;
          prevVowelClass = e ? 'sheva' : null;
        } else {
          out += emitVowel(vowel);
          prevVowelClass = vowelClass(vowel);
        }
      } else {
        prevVowelClass = null;
      }
      continue;
    }

    // --- Shin / sin.
    if (base === SHIN) {
      const cons = hasMark(unit, SIN_DOT) ? 's' : 'sh';
      out += applyGemination(cons, unit, prev, base);
      if (vowel) {
        if (vowel === SHEVA) {
          const e = resolveSheva(units, i, prevVowelClass);
          out += e;
          prevVowelClass = e ? 'sheva' : null;
        } else {
          out += emitVowel(vowel);
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
      if (hasDagesh(unit)) {
        cons = BEGADKEFAT_STOP[base] || CONSONANTS[base];
      } else {
        cons = BEGADKEFAT_FRICATIVE[base];
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
        out += emitVowel(vowel);
        prevVowelClass = vowelClass(vowel);
      }
    } else {
      prevVowelClass = null;
    }
  }

  return out;
}

function emitVowel(vowel) {
  if (vowel === SHEVA) return '';
  return VOWELS[vowel] || '';
}

function vowelClass(vowel) {
  if (!vowel || vowel === SHEVA) return 'sheva';
  if (LONG_VOWELS.has(vowel)) return 'long';
  return 'short';
}

function resolveSheva(units, i, prevVowelClass) {
  const unit = units[i];
  const prev = i > 0 ? units[i - 1] : null;

  if (i === 0) return VOCAL_SHEVA;

  if (prev) {
    const prevVowel = vowelOf(prev);
    if (prevVowel === SHEVA) return VOCAL_SHEVA;
  }

  if (hasDagesh(unit) && isDageshForte(units, i)) return VOCAL_SHEVA;

  if (prevVowelClass === 'long') return VOCAL_SHEVA;

  return '';
}

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

function applyGemination(cons, unit, prev, base) {
  if (!cons) return cons;
  if (base === VAV) return cons;
  if (NO_GEMINATION.has(base)) return cons;
  if (!hasDagesh(unit)) return cons;
  if (BEGADKEFAT.has(base)) {
    const prevVowel = prev ? vowelOf(prev) : null;
    const forte = Boolean(prevVowel && FULL_VOWELS.has(prevVowel));
    return forte ? cons + cons : cons;
  }
  return cons + cons;
}

// ---------------------------------------------------------------------------
// Public entry point.
// ---------------------------------------------------------------------------

function splitPunctuation(token) {
  const chars = [...token];
  let start = 0;
  let end = chars.length - 1;
  while (start < chars.length && !isHebrewLetterOrMark(chars[start])) start++;
  while (end >= start && !isHebrewLetterOrMark(chars[end])) end -= 1;
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

// Transliterate a pointed Hebrew string to a Latin pronunciation aid in the
// Shofar scheme. Returns '' for empty or non-string input.
export function transliterate(pointedHebrewString) {
  if (typeof pointedHebrewString !== 'string') return '';

  let text = stripHtml(pointedHebrewString);
  if (typeof text.normalize === 'function') text = text.normalize('NFC');

  const tokens = text.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return '';

  const outWords = [];
  for (const token of tokens) {
    const { lead, core, trail } = splitPunctuation(token);
    if (core.length === 0) {
      outWords.push(token);
      continue;
    }
    outWords.push(lead + transliterateWord(core) + trail);
  }

  return outWords.join(' ');
}

// ---------------------------------------------------------------------------
// Self-checks, run only when this module is executed directly under Node:
//   node src/lib/transliterate.js
// ---------------------------------------------------------------------------

const SELF_TESTS = [
  { in: 'מֵאֵימָתַי', expect: 'me’eimatai', label: 'aleph mark: me’eimatai' },
  { in: 'קוֹרִין', expect: 'korin', label: 'korin' },
  { in: 'מִצְוָתָן', expect: 'miẓvatan', label: 'tsadi: miẓvatan' },
  { in: 'עַל', expect: '‘al', label: 'ayin mark: ‘al' },
  { in: 'כָּל', expect: 'kol', label: 'kamats katan: kol' },
  { in: 'חָכְמָה', expect: 'ḥokhmah', label: 'ḥet + kamats katan: ḥokhmah' },
  { in: 'יְהוּדָה', expect: 'yehuda', label: 'vocal shva: yehuda' },
  { in: 'שַׁבָּת', expect: 'shabbat', label: 'dagesh forte: shabbat' },
];

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
