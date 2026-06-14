# Licensing and attribution

The project is free and open source and relies on Sefaria's free texts and images. That generosity comes with terms. This document records what the terms are, what they allow, and the one place they could bite later. Verify the current terms at sefaria.org before any commercial step, because licenses change and some fields the API returns are incomplete.

## What the API actually reports

Checked against the Sefaria API on 2026-06-13 for the Talmud:

- The English translation is the William Davidson Edition, English, license **CC-BY-NC**, sourced from Koren Publishers. CC-BY-NC means anyone may use and share it, with attribution, for non-commercial purposes.
- The Hebrew and Aramaic is the William Davidson Edition, Vocalized Aramaic, sourced from Koren. The API returned its license as "unknown." The Koren Hebrew and Aramaic of this edition is generally offered by Sefaria under CC-BY-NC as well, but treat it as unconfirmed until checked.
- The page images come through Sefaria's manuscripts API. The Bomberg (Venice 1523) record carries an empty license field and a source at the National Library of Israel. The Romm Vilna (1880 to 1886) and the Munich manuscript are old enough to be in the public domain by age, but the digitizations are hosted by Sefaria and the National Library, and attribution is the courteous and likely required practice.

## What this means for the app

While the app is free and non-commercial, the CC-BY-NC text is clean to use as long as the app gives attribution. Attribution should name the William Davidson Talmud and Koren Publishers, credit Sefaria as the source, and credit the National Library of Israel for the page images. A visible "Powered by Sefaria" line with a link, plus a credits screen naming the text edition and the image sources, satisfies this.

The non-commercial clause is the thing to watch. If the app is ever sold, put behind a paywall, or shipped as a paid app in a store, the CC-BY-NC English translation would conflict with that use. Three ways out exist if that day comes:

1. Keep it free. A free app, even one in the stores, stays inside CC-BY-NC.
2. Swap the text. Sefaria also carries public-domain Talmud text (older translations and the public-domain Hebrew), which a paid version could use instead of the Koren edition.
3. Get permission. Koren and Sefaria can license the William Davidson Talmud for other uses; ask before charging.

The recommendation for now is to stay free, which keeps every option open and matches the project's reason for relying on free texts in the first place.

## Sefaria's API terms

Sefaria offers its API openly and asks for attribution and reasonable use. Do not hammer the API; cache fetched text and images on the device after first load, which the app already does. Link back to Sefaria. If usage ever grows large, contact Sefaria, because they ask heavy users to coordinate.

## The code license

The application code in this repository is offered under the MIT License (see `LICENSE`). This covers the code that the project authors wrote. It does not and cannot relicense the Sefaria texts and images, which keep their own terms described above. MIT is a starting choice for v0.1; the owner can change the code license before the project takes outside contributions.

## A credits screen is a feature

Build a credits screen into the app that names: Seth C. Oranburg as the creator, with a link to oranburg.law; *Judgment Proof* as the source of the Silicon Havruta idea the partner is built on, with a link; Sefaria as the text and image source with a link; the William Davidson Talmud and Koren Publishers for the text; and the National Library of Israel and the named pressings for the page images. Keeping the credits visible is both the license requirement and the right thing.

## Author credit

The app is free, and it also stands as the author's work and a quiet connection to his book. Credit Seth C. Oranburg as the creator in the footer and on the credits screen, and connect the partner to *Judgment Proof* as the idea behind it. Keep this tasteful and understated, a line and a link rather than a banner. Follow the standing rule against tool and AI fingerprints: credit the author, never the build tools.
