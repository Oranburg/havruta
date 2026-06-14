# Transliteration Schemes

## Why transliteration matters

The daf is studied aloud. The beit midrash tradition is explicit that Torah must live in the mouth, not only in the eye: words of Torah are to be "sharp and clear in your mouth" (Kiddushin 30a). Reading the Aramaic and Hebrew text aloud is not optional in chevruta; pronouncing a line forces a parsing, which forces a meaning. Mumbling through a line is not reading it.

For a reader who is not fluent in Aramaic or Hebrew, transliteration is the bridge to speaking the text. The app supplies it as a labeled pronunciation aid, not as a substitute for the original characters. Hebrew text appears in Hebrew on screen; the transliteration follows as a reading tool.

Different communities pronounce the same text differently, and a transliteration that looks wrong to one reader sounds exactly right to another. The plan is to offer a choice of schemes so the reader can use the one that matches how they hear and say the words.

## Shipped scheme

- [x] **Sephardi academic (shipped).** The current pronunciation aid, documented fully in `docs/TRANSLITERATION-SCHEME.md`. Sephardi-convention vowels (kamats = a, tav = t, never th or s), academic diacritics for ḥet (ḥ) and ʿayin (ʿ), tsadi = ts, no length distinctions. Aramaic passages receive a flag rather than a transliteration. The app's disclaimer reads: "Transliteration is a pronunciation guide following Sephardi academic convention. It is not authoritative and cannot fully represent Aramaic passages."

## Planned schemes

The following schemes are candidates for a future selector. Each is distinct in ways that matter to readers who use that tradition.

- [ ] **Yeshivish Ashkenazi (planned).** The pronunciation used in many American and Israeli yeshivot descending from the Lithuanian tradition. Key differences from the shipped scheme: kamats = oy or aw (so שַׁבָּת is "Shabbos," not "Shabbat"); tav without dagesh = s (so תּוֹרָה is "toyrah," not "Torah"); segol = e but raised; tsere = ay; holam = oy in some words. This scheme sounds like the spoken tradition many daf yomi learners grew up in.
- [ ] **Popular/magazine style (planned).** The reader-friendly style found in Jewish magazines, Artscroll publisher notes, and general-audience Jewish publications. Lighter on diacritics (no ḥ, no ʿ), phonetic for an English speaker ("Shabbat," "kiddush," "mitzvah"), no distinction between ḥet and khaf or between ʿayin and alef. Good for readers who want to say words correctly without learning the academic system.
- [ ] **Modern Israeli Hebrew (planned).** Standard Israeli pronunciation as taught in Hebrew-language education and used in Israeli public discourse. No distinction between ḥet and khaf, ʿayin silent, dagesh fricatives follow modern conventions, stress patterns follow Israeli norms. Useful for readers whose Hebrew background is Israeli rather than diaspora liturgical.
- [ ] **Strict scholarly (planned).** A maximally precise academic Semitic-studies romanization, close to the SBL (Society of Biblical Literature) Hebrew handbook style. Full diacritics for all emphatic and pharyngeal consonants, length distinctions marked, dagesh forte marked by gemination, shva distinctions marked. For readers who want to connect the transliteration to grammatical analysis.

## Implementation note

This feature is tracked as a GitHub issue. The selector would appear in Settings alongside the existing read-aloud toggle. Each scheme is implemented as an alternative rule set in `src/lib/transliterate.js`, sharing the same character-walk architecture documented in `docs/TRANSLITERATION-SCHEME.md` Section 6. The Sephardi academic scheme ships as the default and is never removed.

This page is the model for how future-feature checklists should be kept in this wiki: one page per feature area, shipped items checked, planned items unchecked, each item described precisely enough that an implementer knows what distinguishes it.
