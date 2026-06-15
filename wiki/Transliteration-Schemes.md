# Transliteration Schemes

## Why transliteration matters

The daf is studied aloud. The beit midrash tradition is explicit that Torah must live in the mouth, not only in the eye: words of Torah are to be "sharp and clear in your mouth" (Kiddushin 30a). Reading the Aramaic and Hebrew text aloud is not optional in chevruta; pronouncing a line forces a parsing, which forces a meaning. Mumbling through a line is not reading it.

For a reader who is not fluent in Aramaic or Hebrew, transliteration is the bridge to speaking the text. The app supplies it as a labeled pronunciation aid, not as a substitute for the original characters. Hebrew text appears in Hebrew on screen; the transliteration follows as a reading tool.

Different communities pronounce the same text differently, and a transliteration that looks wrong to one reader sounds exactly right to another.

## The decision (issue #2, closed)

A selector with three schemes (Modern Israeli academic, Modern Israeli simple, Yeshivish Ashkenazi) was built and then removed. Two reasons. The two Israeli variants differed only by academic diacritics that often did not render on a phone, so the choice was mostly invisible to the reader. And there is no official Yeshivish Ashkenazi standard to implement faithfully; offering one would have been pretending to an authority that does not exist.

So the app ships one transliteration, on or off, and it follows a real published reference: the Shofar magazine consonant chart.

## Shipped scheme

- [x] **Shofar magazine chart.** Documented in `docs/TRANSLITERATION-SCHEME.md`. The consonant values are Shofar's: aleph = ’ , ayin = ‘ , ḥet = ḥ , khaf = kh , tsadi = ẓ , sin = s , the begadkefat pairs b/v, k/kh, p/f, and gimel, dalet, tav always g, d, t. The vowel values and the structural rules (shva resolution, dagesh forte, the vav/yod/alef/he behavior) are the app's own practical rules, not part of the Shofar chart or any standard, and the disclaimer says so. Word-over-word: the romanization sits under each Hebrew word. A vocal shva on a consonantal yod or vav is sounded (yehuda, not yhuda; the "ve-" prefix).

## If a scheme choice returns

It would be grounded in a named, published standard rather than an in-house synthesis, so the labels mean something verifiable: the Academy of the Hebrew Language official rules for Modern Israeli, the SBL Handbook or ISO 259 for scholarly. Each would be an alternative rule set in `src/lib/transliterate.js`, sharing the character-walk architecture documented in `docs/TRANSLITERATION-SCHEME.md`. That would reopen as its own issue.
