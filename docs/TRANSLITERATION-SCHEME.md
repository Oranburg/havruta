# Transliteration Scheme

**Havruta Daf Yomi App: Sephardi Academic Hybrid**

This document specifies the deterministic transliteration scheme for the Havruta app's pronunciation-aid feature. The source text is the William Davidson Vocalized Edition from Sefaria, which carries full nikud (vowel points) and dagesh marks. The scheme is Sephardi academic, hybrid form, matching the house convention of the JEW study files. It is designed to be implementable as a rule-based function with one canonical output per input character or character sequence.

The scheme covers Hebrew. Aramaic passages get a best-effort transliteration with the disclaimer that the aid is rougher on Aramaic; the engine does not flag them inline, because the daf is mostly Aramaic and a flag on nearly every line would be noise.

**Schemes implemented (as of v0.4.0).** The document below specifies the **academic** scheme, which is the default. The app now offers three schemes through one engine (`src/lib/transliterate.js`), selected by a "Pronunciation guide" dropdown:

- **academic** (this document): Modern Israeli / Sephardi academic, with diacritics (ḥ, ʿ, ts), kamatz = a, tav = t.
- **simple**: the same pronunciation written without diacritics (ch for ḥet and khaf, tz for tsadi, alef and ayin dropped).
- **ashkenazi**: Yeshivish Ashkenazi pronunciation, a separate reading: kamatz = o, cholam = oy, tzere = ei, and a tav without a dagesh = s (so Shabbos, boruch, Toyro). Vowels are faithful; syllable stress is not modeled.

A scheme is a configuration the one engine reads, so the structural rules below (shva resolution, dagesh forte, the vav/yod/alef/he rules) are shared; only the output spelling and a few vowel values change. Note the v0.4.0 fix: a vocal shva on a consonantal yod or vav is now sounded (yehuda, not yhuda; the "ve-" prefix, not "v-"), matching the other consonant branches.

---

## 1. Consonant Table

Each Hebrew letter maps to exactly one Latin output. Where a letter has two pronunciations conditioned by dagesh (dagesh lene in the begadkefat letters), both outputs are listed. Final-form letters (כ ם ן ף ץ) map identically to their non-final counterparts.

| Hebrew | Unicode | Transliteration | Notes |
|--------|---------|-----------------|-------|
| א alef | U+05D0 | (see rules) | Silent at word boundary; ʾ intervocalically when the alef carries a vowel between two other vowels. See Section 3. |
| ב with dagesh (bet) | U+05D1 + U+05BC | b | |
| ב without dagesh (vet) | U+05D1 | v | |
| ג (gimel) | U+05D2 | g | Always hard g. |
| ד (dalet) | U+05D3 | d | |
| ה (he) | U+05D4 | h | Silent at end of word when it serves as a mater lectionis (carries no consonantal value). See Section 3. |
| ו (vav) | U+05D5 | v | As consonant. As vowel carrier, see vowel table. |
| ז (zayin) | U+05D6 | z | |
| ח (ḥet) | U+05D7 | ḥ | U+1E25. Distinguishes ḥet from khaf (kh). |
| ט (tet) | U+05D8 | t | Not th. Merges with tav in this scheme; root-readers rely on context. |
| י (yod) | U+05D9 | y | As consonant. As vowel component (hiriq male), see Section 3. |
| כ with dagesh (kaf) | U+05DB + U+05BC | k | |
| כ without dagesh (khaf) | U+05DB | kh | Two letters, not a diacritic. |
| ך final khaf | U+05DA | kh | Same as non-final khaf. |
| ל (lamed) | U+05DC | l | |
| מ (mem) | U+05DE | m | |
| ם final mem | U+05DD | m | |
| נ (nun) | U+05E0 | n | |
| ן final nun | U+05DF | n | |
| ס (samekh) | U+05E1 | s | |
| ע (ʿayin) | U+05E2 | ʿ | U+02BF (modifier letter left half ring). Always marked. |
| פ with dagesh (pe) | U+05E4 + U+05BC | p | |
| פ without dagesh (fe) | U+05E4 | f | |
| ף final fe | U+05E3 | f | |
| צ (tsadi) | U+05E6 | ts | Not tz, not ṣ, not tz. |
| ץ final tsadi | U+05E5 | ts | |
| ק (kuf) | U+05E7 | k | Same output as kaf-with-dagesh. Root distinction is lost; acceptable for a pronunciation aid. |
| ר (resh) | U+05E8 | r | |
| שׁ shin (with shin dot U+05C1) | U+05E9 + U+05C1 | sh | |
| שׂ sin (with sin dot U+05C2) | U+05E9 + U+05C2 | s | Same output as samekh. |
| ת (tav) | U+05EA | t | Never s (Ashkenazi) or th (Tiberian). Same output as tet. |

### Dagesh summary

A dagesh inside a letter is either dagesh lene (affects begadkefat pronunciation) or dagesh forte (gemination). The code must distinguish them. The rule is:

Dagesh lene appears only in the six begadkefat letters (ב ג ד כ פ ת) and only when the letter begins a syllable not immediately preceded by a vowel sound. Dagesh forte appears in any letter (except א, ה, ח, ע, ר in standard grammar) and indicates gemination. See Section 3 for the dagesh forte rule.

The six begadkefat letters in this scheme have two outputs: with dagesh = stop consonant, without = fricative. Gimel and dalet have no audible distinction in modern Sephardi pronunciation, so they always render g and d regardless of dagesh.

---

## 2. Vowel Table

The William Davidson edition uses standard Hebrew Unicode combining characters (U+05B0 through U+05BB, plus U+05C7 for kamats katan when explicitly encoded, plus holam vav and shuruk as special vav forms).

| Vowel name | Hebrew mark | Unicode | Transliteration | Notes |
|------------|-------------|---------|-----------------|-------|
| Patach | ַ | U+05B7 | a | |
| Kamats gadol | ָ | U+05B8 | a | Default for kamats. See kamats katan note in Section 3. |
| Kamats katan | ָ | U+05B8 | o | Same Unicode point as kamats gadol. Cannot be reliably distinguished by code alone. See Section 3. |
| Tsere | ֵ | U+05B5 | e | |
| Tsere male (tsere + yod) | ֵי | U+05B5 + U+05D9 | e | The yod is silent; emit only e, not ey. |
| Segol | ֶ | U+05B4 (sic: U+05B6) | e | U+05B6. Same output as tsere. |
| Hiriq | ִ | U+05B4 | i | |
| Hiriq male (hiriq + yod) | ִי | U+05B4 + U+05D9 | i | The yod is silent; emit only i, not iy. |
| Holam (written over letter) | ֹ | U+05B9 | o | |
| Holam vav (vav + holam) | וֹ | U+05D5 + U+05B9 | o | The vav is the vowel carrier; emit o, not vo. |
| Kubutz | ֻ | U+05BB | u | |
| Shuruk (vav + dagesh) | וּ | U+05D5 + U+05BC | u | The vav is the vowel carrier; emit u, not vu. |
| Shva | ְ | U+05B0 | (see Section 3) | Either e or silent depending on position. |
| Chataf patach | ֲ | U+05B2 | a | Reduced patach under gutturals. |
| Chataf segol | ֱ | U+05B1 | e | Reduced segol under gutturals. |
| Chataf kamats | ֳ | U+05B3 | o | Reduced kamats under gutturals. |

No macrons, no circumflexes, no length distinctions in output. The scheme does not mark vowel length.

### Vav disambiguation

A vav in the source text is one of three things: a consonant (v), a holam vav (o), or a shuruk (u). The code checks in this order:

1. If vav carries holam (U+05B9) attached to it, emit o. Do not emit v.
2. If vav carries dagesh (U+05BC) and has no preceding consonant vowel in the same syllable, treat as shuruk: emit u. Do not emit v.
3. Otherwise emit v.

The shuruk detection (step 2) is a heuristic. A vav-with-dagesh is shuruk when it functions as the syllable nucleus (i.e., the preceding letter has no vowel other than shva nach, or the vav opens the word). When in doubt the simpler rule is: vav-with-dagesh at the start of a syllable = shuruk = u.

---

## 3. Context-Dependent Rules

### 3.1 Shva

A shva (U+05B0) is either vocal (shva naʾ, pronounced e) or silent (shva nach, no vowel). The full traditional rule requires syllable analysis. The following decidable approximation is used:

**Emit e (vocal shva) when any of these conditions holds:**

- The shva is on the first letter of a word.
- The shva immediately follows another shva (a shva after a shva is vocal).
- The shva is on a letter with dagesh forte (dagesh chazak).
- The shva follows a long vowel. (Tsere, holam, and shuruk are long vowels for this purpose; hiriq male and tsere male are long.)

**Emit nothing (silent shva) in all other positions.**

This approximation will be wrong in some edge cases, particularly in complex construct chains and in certain verb forms. It is the simplest rule that is defensible for a pronunciation aid. Flag the approximation in the app's disclaimer.

### 3.2 Alef

Alef (א) is a guttural stop that is silent in most positions in Sephardi pronunciation.

- At the start of a word: do not emit any character. The vowel on the alef is emitted from the vowel table; the alef itself is silent.
- At the end of a word (final alef, no vowel): do not emit any character.
- Intervocalically, when the alef carries a full vowel and sits between two other vowel sounds (i.e., removing it would collapse two vowels together and obscure the root): emit ʾ (U+02BE, modifier letter right half ring).

The practical code rule for intervocalic alef: if the alef carries a full vowel (not just shva nach) and is preceded by a vowel sound in the same word, emit ʾ before the vowel. Example: מַאֲמִין (maʾamin), where the alef between the mem-patach and the alef-chataf-patach anchors the root א-מ-נ, so emit ʾ.

When in doubt, err toward emitting ʾ rather than omitting it. A spurious ʾ is less harmful than collapsing a root.

### 3.3 He

Final he (ה) as a mater lectionis (word-final, carries no dagesh, no mappiq): do not emit h. The vowel before it is already emitted.

He with mappiq (ּה, i.e., U+05D4 + U+05BC): emit h. This is a consonantal he (e.g., third-person feminine possessive suffix).

He in non-final position: emit h always.

### 3.4 Yod as consonant vs. vowel component

Yod after hiriq: if the yod follows a letter that carries hiriq (U+05B4) and the yod itself carries no separate vowel point, treat it as hiriq male. Emit nothing for the yod; the i is already emitted from the hiriq.

Yod after tsere: same logic. For tsere male, emit nothing for the yod.

Yod at the start of a word or carrying its own vowel point: emit y.

Yod after a consonant with no vowel (i.e., the yod would itself be a consonant): emit y.

### 3.5 Dagesh forte (gemination)

Dagesh forte in the source text indicates a doubled consonant. The house choice is: **emit a doubled consonant when the dagesh is forte.**

To distinguish forte from lene in code: if the letter is not one of the begadkefat letters (ב ג ד כ פ ת), any dagesh is forte. If the letter is a begadkefat letter, classify as forte when the preceding letter has a full vowel (patach, kamats, tsere, segol, hiriq, holam, kubutz, shuruk, or a chataf vowel), since a forte dagesh requires an open syllable before it.

Emit the doubled consonant in full: dagesh forte on מ gives mm, on ל gives ll, on כ with dagesh (kaf) gives kk, on נ gives nn, and so on.

Exception: do not double the output for gutturals (א ה ח ע) and resh. These letters reject dagesh forte in standard Biblical/Mishnaic grammar. If you encounter a dagesh in one of these letters in the William Davidson text, treat it as dagesh lene (affects only begadkefat behavior, not gemination) or ignore it.

Euphonic dagesh (dagesh in certain prefixed particles such as ל and מ at phrase junctures) does not indicate gemination in pronunciation. The code cannot reliably detect euphonic dagesh. The house choice is: **double the letter when dagesh forte is indicated**, accepting that euphonic doubling will occasionally appear in the output. This is acceptable for a pronunciation aid.

### 3.6 Kamats katan

The Unicode point U+05B8 encodes both kamats gadol (long a) and kamats katan (short o, pronounced like holam). They are typographically identical. The William Davidson edition does not systematically distinguish them with a separate code point (U+05C7 is used in some but not all cases).

**Default rule: treat all U+05B8 as kamats gadol (a).**

Known exceptions where kamats katan should read o: the word כָּל (kol, "all") and the word חָכְמָה (ḥokhmah) are the most common. A lookup table of high-frequency kamats-katan words may be maintained alongside the code to catch the most frequent errors. The app's disclaimer should note that this is a known limitation.

### 3.7 Prefixed particles

The particles ב, כ, ל, ו, ה, מ, ש when attached to a word as prefixes retain their transliteration per the consonant table and are followed by a hyphen before the root word, following house style.

Examples: בְּ = be-, לְ = le-, הַ = ha-, מִ = mi-, שֶׁ = she-, וְ = ve-, כְּ = ke-.

When a prefix vav carries a shuruk (וּ, before certain consonants), emit u- as the prefix.

### 3.8 Tetragrammaton

The Tetragrammaton (יהוה, vocalized יְהוָה or יְהֹוָה) renders as *HaShem*. Do not transliterate the four letters. Do not emit Adonai. Detect by the character sequence U+05D9 U+05D4 U+05D5 U+05D4, with or without nikud.

---

## 4. Worked Examples

The following three words are taken verbatim from the opening lines of Berakhot 2a in the William Davidson Vocalized Edition (Sefaria, fetched 2026-06-14). They are representative test cases for the code.

### 4.1 מֵאֵימָתַי

**Source text (verified):** מֵאֵימָתַי (Berakhot 2a, first word of the Mishnah)

**Transliteration:** me-eimatai

**Step-by-step:**

| Character | Unicode | Rule | Output |
|-----------|---------|------|--------|
| מ | U+05DE | consonant mem | m |
| ֵ | U+05B5 | tsere on mem | e |
| א | U+05D0 | alef word-internal, preceded by a vowel, carrying its own tsere; sits between two vowel sounds, so emit ʾ (see note below) | ʾ |
| ֵ | U+05B5 | tsere on alef | e |
| י | U+05D9 | yod after tsere with no separate vowel = tsere male; yod is silent | (silent) |
| מ | U+05DE | consonant mem | m |
| ָ | U+05B8 | kamats, default = a | a |
| ת | U+05EA | tav | t |
| ַ | U+05B7 | patach | a |
| י | U+05D9 | word-final yod with no vowel point following; functions as consonant after patach | y |

Full output: m + e + ʾ + e + (silent y) + m + a + t + a + y = **meʾeimatai**

Note on the alef: in common academic romanization this word is usually written *me-eimatai* without the ʾ, because the alef at word-opening of the second morpheme is felt as a prefix juncture. Both *meʾeimatai* and *me-eimatai* are defensible. The code should emit the ʾ per the general intervocalic rule; a post-processing step may strip it for readability if preferred.

**Syllable note:** me-ei-ma-tai (four syllables). Stress on the final syllable (tai) as is typical for this type of form.

### 4.2 קוֹרִין

**Source text (verified):** קוֹרִין (Berakhot 2a, "they recite")

**Transliteration:** korin

**Step-by-step:**

| Character | Unicode | Rule | Output |
|-----------|---------|------|--------|
| ק | U+05E7 | kuf | k |
| וֹ | U+05D5 + U+05B9 | holam vav; vav is vowel carrier | o |
| ר | U+05E8 | resh | r |
| ִ | U+05B4 | hiriq | i |
| י | U+05D9 | yod after hiriq with no separate vowel = hiriq male; silent | (silent) |
| ן | U+05DF | final nun | n |

Full output: k + o + r + i + (silent) + n = **korin**

**Syllable note:** ko-rin (two syllables). Stress on second syllable (rin).

### 4.3 מִצְוָתָן

**Source text (verified):** מִצְוָתָן (Berakhot 2a, "their commandment/obligation")

**Transliteration:** mitsvatan

**Step-by-step:**

| Character | Unicode | Rule | Output |
|-----------|---------|------|--------|
| מ | U+05DE | mem | m |
| ִ | U+05B4 | hiriq | i |
| צ | U+05E6 | tsadi | ts |
| ְ | U+05B0 | shva; mid-word, follows hiriq (short vowel), not word-initial; shva nach = silent | (silent) |
| ו | U+05D5 | vav; carries kamats = full vowel, not holam marker here; vav is consonant | v |
| ָ | U+05B8 | kamats on vav = a | a |
| ת | U+05EA | tav | t |
| ָ | U+05B8 | kamats | a |
| ן | U+05DF | final nun | n |

Full output: m + i + ts + (silent) + v + a + t + a + n = **mitsvatan**

**Syllable note:** mits-va-tan (three syllables). Stress on final syllable (tan).

These three words together exercise: holam vav (4.2), hiriq male (4.2, 4.1), shva nach in mid-word position (4.3), kuf (4.2), tsadi (4.3), final nun (4.2, 4.3), intervocalic alef (4.1), and tsere male (4.1).

---

## 5. Caveats

### 5.1 Aramaic

The William Davidson edition contains substantial Aramaic (the stam, the gemara discussion). This scheme covers Hebrew. It does not cover Aramaic morphology, Aramaic-specific phonology, or Aramaic vocabulary patterns. Applying it to Aramaic text will produce output that is internally consistent with the rules above but may be systematically wrong for Aramaic pronunciation.

The app should detect Aramaic passages (heuristics: relative particle דְּ, determined-state suffix ָא, common Aramaic words such as גַּבְרָא, מִילְּתָא, הֵיכָא) and display a flag rather than a transliteration. The recommended flag string is:

> [Aramaic: transliteration not available]

Do not attempt to transliterate Aramaic with Hebrew rules.

### 5.2 Kamats katan

As noted in Section 3.6, the code cannot reliably detect kamats katan. Words that should be pronounced with o will appear with a. The most common case is כָּל (kol), which the code will render *kal*. A lookup table of high-frequency kamats-katan words is the recommended mitigation.

### 5.3 Shva accuracy

The shva rule in Section 3.1 is an approximation. Misclassification of shva naʾ as nach (or vice versa) will produce incorrect syllabification. This affects primarily parsing-heavy verb forms and longer words with complex syllable structure.

### 5.4 Dagesh euphonicum

Certain prefixed particles (especially ל and ב before gutturals, and ו-consecutive in certain forms) may carry a dagesh that is euphonic, not geminating. The code will double the letter in these cases. The effect on readability is minor.

### 5.5 Tet and tav merge

Both ט and ת render t. A reader who has studied Semitic phonology will know these are historically distinct phonemes; Sephardi pronunciation merges them. This is the correct house choice for a pronunciation aid aimed at Sephardi-convention readers. It is not a bug.

### 5.6 Kuf and kaf merge

Both ק and כ-with-dagesh render k. Same reasoning as 5.5.

### 5.7 Recommended app disclaimer

The following one-line disclaimer should appear wherever the transliteration feature is surfaced:

> Transliteration is a pronunciation guide following Sephardi academic convention. It is not authoritative and cannot fully represent Aramaic passages.

---

## 6. Implementation Notes

The recommended implementation order:

1. Normalize input to NFC (Unicode canonical decomposition followed by canonical composition). The William Davidson text from Sefaria should already be NFC, but normalize defensively.
2. Detect and flag Aramaic segments before applying any other rule.
3. Detect the Tetragrammaton sequence and substitute *HaShem* before character-level processing.
4. Walk the string character by character, maintaining a small state: previous character, previous vowel class (long or short), position in word (initial, medial, final), and whether the current consonant has a following dagesh.
5. Apply the vowel table entries before emitting a consonant, because the vowel determines whether a following yod or vav is consonantal or a mater.
6. Apply the shva rule using the state from step 4.
7. Apply the holam-vav and shuruk detection for vav.
8. Insert hyphens after prefixed particles as a post-processing step (requires a prefix lookup, since the code cannot derive prefix boundaries from nikud alone in all cases).

The dagesh classification (forte vs. lene) requires look-ahead: a dagesh in a begadkefat letter is lene if the preceding character (skipping any nikud combining marks) has no vowel or is a word boundary; otherwise it is forte.

The scheme is designed to run entirely at the Unicode character level without a lexicon, except for the Tetragrammaton substitution and the optional kamats-katan lookup table.
