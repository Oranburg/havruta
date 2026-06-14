// Deterministic, rule-based Hebrew transliterator for the Havruta app.
//
// One engine, several schemes. The structural rules (how the points are parsed,
// when a shva is vocal, how a dagesh forte geminates, how vav and yod and alef
// and he behave) are the same for every scheme. What changes between schemes is
// the OUTPUT: which Latin letters a consonant or a vowel becomes, and a few vowel
// values. A scheme is a configuration the engine reads, not a separate engine.
//
// The schemes:
//   academic  Modern Israeli / Sephardi academic, with diacritics (ḥ, ʿ, ts).
//             Kamatz = a, tav = t always. The most phonetically transparent.
//   simple    The same pronunciation, written without diacritics: ch for ḥet and
//             khaf, tz for tsadi, alef and ayin dropped. Easiest for an English
//             reader.
//   ashkenazi Yeshivish Ashkenazi pronunciation, a real second reading: kamatz
//             becomes o (boruch), cholam becomes oy (Toyro), tzere becomes ei,
//             and a tav without a dagesh becomes s (Shabbos). Vowels are
//             faithful; syllable stress is not modeled (no scheme models it).
//
// The output is a Latin pronunciation aid over the verbatim vocalized text. It
// never replaces the Hebrew and it does not guess beyond the rules. The Talmud
// is heavily Aramaic, which uses the same letters and points, so the aid is
// rougher on Aramaic; the disclaimer in the UI says so. The Tetragrammaton
// renders as HaShem.
//
// Usage: transliterate(pointedHebrewString, schemeId='academic') -> Latin string.

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

// Long vowels, for the shva rule (a shva after a long vowel is vocal). Structural
// and scheme-independent: it is about the point, not its spelling.
const LONG_VOWELS = new Set([TSERE, HOLAM]);

// The six begadkefat letters, which take a dagesh lene. Finals are handled by the
// per-scheme consonant table, not here.
const BEGADKEFAT = new Set(['ב', 'ג', 'ד', 'כ', 'פ', 'ת']);

// Gutturals and resh reject dagesh forte (no gemination).
const NO_GEMINATION = new Set([ALEF, HE, 'ח', 'ע', 'ר']);

// ---------------------------------------------------------------------------
// The schemes.
// ---------------------------------------------------------------------------

// Vowel spellings. academic and simple share these; ashkenazi differs.
const VOWELS_ISRAELI = {
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

const VOWELS_ASHKENAZI = {
  [PATAH]: 'a',
  [KAMATS]: 'o', // kamatz reads o: boruch, Dovid
  [TSERE]: 'ei', // tzere reads ei: beis, Omein
  [SEGOL]: 'e',
  [HIRIQ]: 'i',
  [HOLAM]: 'oy', // cholam reads oy: Toyro, Moishe
  [KUBUTS]: 'u',
  [HATAF_PATAH]: 'a',
  [HATAF_SEGOL]: 'e',
  [HATAF_KAMATS]: 'o',
  [KAMATS_KATAN]: 'o',
};

// The Latin a yod adds when it is a mater after a vowel (the glide). academic and
// simple add i (e + i = ei). ashkenazi already spells tzere as ei, so a yod after
// a tzere adds nothing; the other vowels still add i.
const MATER_YOD_ISRAELI = {
  [TSERE]: 'i',
  [SEGOL]: 'i',
  [PATAH]: 'i',
  [KAMATS]: 'i',
};
const MATER_YOD_ASHKENAZI = {
  [TSERE]: '',
  [SEGOL]: 'i',
  [PATAH]: 'i',
  [KAMATS]: 'i',
};

// Consonant outputs for the letters handled in the general branch (alef, he, vav,
// yod, and shin are handled by their own rules and do not read these). Finals are
// included because they are handled here, not in the begadkefat branch.
const CONSONANTS_ACADEMIC = {
  'א': '', 'ב': 'v', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
  'ח': 'ḥ', 'ט': 't', 'י': 'y', 'כ': 'kh', 'ך': 'kh', 'ל': 'l', 'מ': 'm',
  'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'ʿ', 'פ': 'f', 'ף': 'f',
  'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
};
const CONSONANTS_SIMPLE = {
  'א': '', 'ב': 'v', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
  'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'ch', 'ך': 'ch', 'ל': 'l', 'מ': 'm',
  'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': '', 'פ': 'f', 'ף': 'f',
  'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't',
};
// Ashkenazi shares the simple consonant spellings except where the begadkefat
// fricative table overrides (the tav without a dagesh becomes s there).
const CONSONANTS_ASHKENAZI = { ...CONSONANTS_SIMPLE };

const BEGADKEFAT_STOP = {
  'ב': 'b', 'כ': 'k', 'פ': 'p', 'ג': 'g', 'ד': 'd', 'ת': 't',
};
const BEGADKEFAT_FRICATIVE_ACADEMIC = {
  'ב': 'v', 'כ': 'kh', 'פ': 'f', 'ג': 'g', 'ד': 'd', 'ת': 't',
};
const BEGADKEFAT_FRICATIVE_SIMPLE = {
  'ב': 'v', 'כ': 'ch', 'פ': 'f', 'ג': 'g', 'ד': 'd', 'ת': 't',
};
const BEGADKEFAT_FRICATIVE_ASHKENAZI = {
  'ב': 'v', 'כ': 'ch', 'פ': 'f', 'ג': 'g', 'ד': 'd', 'ת': 's', // tav rafe = s
};

const SCHEMES = {
  academic: {
    id: 'academic',
    consonants: CONSONANTS_ACADEMIC,
    begadkefatStop: BEGADKEFAT_STOP,
    begadkefatFricative: BEGADKEFAT_FRICATIVE_ACADEMIC,
    vowels: VOWELS_ISRAELI,
    materYod: MATER_YOD_ISRAELI,
    shinDot: 'sh',
    sinDot: 's',
    alefHamza: 'ʾ',
    shuruk: 'u',
    tetragrammaton: 'HaShem',
    kamatsKatanWords: { 'כל': 'kol', 'חכמה': 'ḥokhmah' },
  },
  simple: {
    id: 'simple',
    consonants: CONSONANTS_SIMPLE,
    begadkefatStop: BEGADKEFAT_STOP,
    begadkefatFricative: BEGADKEFAT_FRICATIVE_SIMPLE,
    vowels: VOWELS_ISRAELI,
    materYod: MATER_YOD_ISRAELI,
    shinDot: 'sh',
    sinDot: 's',
    alefHamza: '',
    shuruk: 'u',
    tetragrammaton: 'HaShem',
    kamatsKatanWords: { 'כל': 'kol', 'חכמה': 'chochma' },
  },
  ashkenazi: {
    id: 'ashkenazi',
    consonants: CONSONANTS_ASHKENAZI,
    begadkefatStop: BEGADKEFAT_STOP,
    begadkefatFricative: BEGADKEFAT_FRICATIVE_ASHKENAZI,
    vowels: VOWELS_ASHKENAZI,
    materYod: MATER_YOD_ASHKENAZI,
    shinDot: 'sh',
    sinDot: 's',
    alefHamza: '',
    shuruk: 'u',
    tetragrammaton: 'HaShem',
    // No override needed: kamatz already reads o, so kol and chochmoh fall out
    // of the rules.
    kamatsKatanWords: {},
  },
};

export const DEFAULT_SCHEME_ID = 'academic';

// The schemes offered in the UI dropdown, in order. "None" is added by the UI.
export const TRANSLIT_SCHEMES = [
  { id: 'academic', label: 'Modern Israeli (academic)' },
  { id: 'simple', label: 'Modern Israeli (simple)' },
  { id: 'ashkenazi', label: 'Yeshivish Ashkenazi' },
];

function getScheme(schemeId) {
  return SCHEMES[schemeId] || SCHEMES[DEFAULT_SCHEME_ID];
}

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

function isHebrewLetter(ch) {
  const code = ch.codePointAt(0);
  return code >= 0x05d0 && code <= 0x05ea;
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

function transliterateWord(rawWord, scheme) {
  const word = stripUnreadMarks(rawWord);
  const units = parseLetters(word);
  if (units.length === 0) return '';

  if (isTetragrammaton(units)) return scheme.tetragrammaton;

  const skeleton = consonantSkeleton(units);
  if (Object.prototype.hasOwnProperty.call(scheme.kamatsKatanWords, skeleton)) {
    return scheme.kamatsKatanWords[skeleton];
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
        out += scheme.vowels[HOLAM];
        prevVowelClass = 'long';
        continue;
      }
      if (hasDagesh(unit) && !hasMark(unit, HOLAM)) {
        const prevVowel = prev ? vowelOf(prev) : null;
        const prevHasFullVowel = prevVowel && FULL_VOWELS.has(prevVowel);
        if (isFirst || !prevHasFullVowel) {
          out += scheme.shuruk;
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
          out += emitVowel(unit, vowel, scheme);
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
          const add = Object.prototype.hasOwnProperty.call(scheme.materYod, prevVowel)
            ? scheme.materYod[prevVowel]
            : 'i';
          out += add;
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
          out += emitVowel(unit, vowel, scheme);
          prevVowelClass = vowelClass(vowel);
        }
      } else {
        prevVowelClass = null;
      }
      continue;
    }

    // --- Alef.
    if (base === ALEF) {
      const carriesFullVowel = vowel && vowel !== SHEVA && FULL_VOWELS.has(vowel);
      const precededByVowelSound =
        prevVowelClass === 'short' || prevVowelClass === 'long';
      if (carriesFullVowel && !isFirst && precededByVowelSound) {
        out += scheme.alefHamza;
        out += emitVowel(unit, vowel, scheme);
        prevVowelClass = vowelClass(vowel);
      } else if (carriesFullVowel) {
        out += emitVowel(unit, vowel, scheme);
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
          out += emitVowel(unit, vowel, scheme);
          prevVowelClass = vowelClass(vowel);
        }
      } else {
        prevVowelClass = null;
      }
      continue;
    }

    // --- Shin / sin.
    if (base === SHIN) {
      const cons = hasMark(unit, SIN_DOT) ? scheme.sinDot : scheme.shinDot;
      out += applyGemination(cons, unit, prev, base);
      if (vowel) {
        if (vowel === SHEVA) {
          const e = resolveSheva(units, i, prevVowelClass);
          out += e;
          prevVowelClass = e ? 'sheva' : null;
        } else {
          out += emitVowel(unit, vowel, scheme);
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
        cons = scheme.begadkefatStop[base] || scheme.consonants[base];
      } else {
        cons = scheme.begadkefatFricative[base];
      }
    } else {
      cons = scheme.consonants[base] || '';
    }

    out += applyGemination(cons, unit, prev, base);

    if (vowel) {
      if (vowel === SHEVA) {
        const e = resolveSheva(units, i, prevVowelClass);
        out += e;
        prevVowelClass = e ? 'sheva' : null;
      } else {
        out += emitVowel(unit, vowel, scheme);
        prevVowelClass = vowelClass(vowel);
      }
    } else {
      prevVowelClass = null;
    }
  }

  return out;
}

function emitVowel(unit, vowel, scheme) {
  if (vowel === SHEVA) return '';
  return scheme.vowels[vowel] || '';
}

function vowelClass(vowel) {
  if (!vowel || vowel === SHEVA) return 'sheva';
  if (LONG_VOWELS.has(vowel)) return 'long';
  return 'short';
}

function resolveSheva(units, i, prevVowelClass) {
  const unit = units[i];
  const prev = i > 0 ? units[i - 1] : null;

  if (i === 0) return 'e';

  if (prev) {
    const prevVowel = vowelOf(prev);
    if (prevVowel === SHEVA) return 'e';
  }

  if (hasDagesh(unit) && isDageshForte(units, i)) return 'e';

  if (prevVowelClass === 'long') return 'e';

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

// Transliterate a pointed Hebrew string to a Latin pronunciation aid in the
// chosen scheme (default: academic). Returns '' for empty or non-string input.
export function transliterate(pointedHebrewString, schemeId = DEFAULT_SCHEME_ID) {
  if (typeof pointedHebrewString !== 'string') return '';
  const scheme = getScheme(schemeId);

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
    outWords.push(lead + transliterateWord(core, scheme) + trail);
  }

  return outWords.join(' ');
}

// ---------------------------------------------------------------------------
// Self-checks, run only when this module is executed directly under Node:
//   node src/lib/transliterate.js
// ---------------------------------------------------------------------------

const SELF_TESTS = [
  // academic worked examples, Section 4 of docs/TRANSLITERATION-SCHEME.md.
  { in: 'מֵאֵימָתַי', scheme: 'academic', expect: 'meʾeimatai', label: '4.1 meʾeimatai' },
  { in: 'קוֹרִין', scheme: 'academic', expect: 'korin', label: '4.2 korin' },
  { in: 'מִצְוָתָן', scheme: 'academic', expect: 'mitsvatan', label: '4.3 mitsvatan' },
  { in: 'כָּל', scheme: 'academic', expect: 'kol', label: 'academic kamats katan: kol' },
  { in: 'חָכְמָה', scheme: 'academic', expect: 'ḥokhmah', label: 'academic kamats katan: ḥokhmah' },
  // simple: same pronunciation, simpler spelling.
  { in: 'מִצְוָתָן', scheme: 'simple', expect: 'mitzvatan', label: 'simple: mitzvatan (ts->tz)' },
  { in: 'כָּל', scheme: 'simple', expect: 'kol', label: 'simple kamats katan: kol' },
  // ashkenazi: a real second reading.
  // The bet carries a dagesh chazak, so it geminates (shabbos, not shabos): the
  // tav without a dagesh becomes s and the kamatz becomes o.
  { in: 'שַׁבָּת', scheme: 'ashkenazi', expect: 'shabbos', label: 'ashkenazi: shabbos (tav rafe = s, kamatz = o)' },
  { in: 'תּוֹרָה', scheme: 'ashkenazi', expect: 'toyro', label: 'ashkenazi: toyro (cholam = oy, kamatz = o)' },
  { in: 'שַׁבָּת', scheme: 'academic', expect: 'shabbat', label: 'academic: shabbat (control)' },
  { in: 'תּוֹרָה', scheme: 'academic', expect: 'tora', label: 'academic: tora (control)' },
];

if (
  typeof process !== 'undefined' &&
  process.argv &&
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].split('/').pop())
) {
  let pass = 0;
  for (const t of SELF_TESTS) {
    const got = transliterate(t.in, t.scheme);
    const ok = got === t.expect;
    if (ok) pass++;
    // eslint-disable-next-line no-console
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${t.label}: got "${got}" expected "${t.expect}"`);
  }
  // eslint-disable-next-line no-console
  console.log(`${pass}/${SELF_TESTS.length} passed`);
}
