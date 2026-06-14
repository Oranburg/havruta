# Sources and data

Every text and image in this app comes from Sefaria. The partner never generates primary text. This document lists the endpoints that were tested and the rules for displaying what they return. All endpoints were verified working on 2026-06-13.

## What today's daf is

Always ask Sefaria. Do not compute the daf from a cycle start date; that math drifts and breaks. The calendar endpoint returns the day's daf yomi directly.

Endpoint: `https://www.sefaria.org/api/calendars?year=YYYY&month=M&day=D`

Omit the date parameters to get today in the server's timezone. The response has a `calendar_items` array. The entry whose `title.en` is `"Daf Yomi"` carries the day's page. Read its `ref` field (for example `"Chullin 44"`) and its `displayValue.en`.

Verified on 2026-06-13: the Daf Yomi item returned `ref: "Chullin 44"`, display `"Chullin 44"`. The same response also carries Daf a Week, Halakhah Yomit, Tanakh Yomi, and others; ignore those for this app.

## The text of the daf

A daf has two sides, amud aleph (a) and amud bet (b). Sefaria addresses them as `Chullin.44a` and `Chullin.44b`. The day's "Daf Yomi" ref names the daf; load both amudim.

Endpoint (preferred, version 3): `https://www.sefaria.org/api/v3/texts/{tref}`

Examples that were tested: `https://www.sefaria.org/api/v3/texts/Chullin.44a` returns the segmented text; `?return_format=text_only` strips HTML markup. The response carries a `versions` array. For the Hebrew and Aramaic, the William Davidson Edition vocalized text is present. For English, request the William Davidson English version. You can pull both languages in one place with the `texts` API: `https://www.sefaria.org/api/texts/Chullin.44a` returns `he` (Hebrew and Aramaic) and `text` (English) as parallel arrays of segments, plus `next` and `prev` refs for navigation (verified: next `Chullin 44b`, prev `Chullin 43b`).

Each amud is an array of segments. Render them as parallel Hebrew and English, segment by segment, so the reader can move between the two. Strip HTML tags from the English (it contains footnote and formatting markup).

## The page image, the visual daf

Sefaria hosts manuscript and print page images, including the classic Vilna page that yeshivot use.

Endpoint: `https://www.sefaria.org/api/manuscripts/{tref}`

Tested with `https://www.sefaria.org/api/manuscripts/Chullin.44a`. It returns an array of manuscript records. Three were present for this daf:

- Romm Vilna pressing (1880 to 1886), `image_url` `https://manuscripts.sefaria.org/vilna-romm/Chullin_44a.jpg`. This is the classic tzurat hadaf, Gemara in the center with Rashi and Tosafot around it. Make this the default visual daf.
- Bomberg Venice pressing (1523), the first printed Talmud, image under `https://manuscripts.sefaria.org/bomberg/`.
- Munich manuscript 95 (1342), a complete handwritten Talmud.

Display the Vilna image by default with zoom and pan, because on a phone the page is dense and the reader needs to enlarge it. Offer a toggle to the Bomberg and Munich images. Show the manuscript name and date as attribution under the image; these are historical sources and the credit belongs on the page.

The Vilna image URL follows the pattern `https://manuscripts.sefaria.org/vilna-romm/{Tractate}_{daf}{amud}.jpg`. Do not hardcode this pattern as the source of truth; read the `image_url` the manuscripts API returns, because tractate spellings and edge cases vary. Use the pattern only as a fallback.

## Hebrew and Aramaic display rules

These follow the house conventions in Seth's Jewish Studies work.

Hebrew and Aramaic appear in Hebrew characters on the page, right to left, never as transliteration alone. When a term is transliterated, the transliteration goes in parentheses after the Hebrew on first appearance, not in place of it.

The Talmud Bavli is heavily Aramaic, not Hebrew. The partner and the interface should flag Aramaic stretches rather than treating them as Hebrew. Do not auto-vocalize (add nikud to) unpointed text; display what Sefaria returns. The William Davidson vocalized edition already carries pointing, so prefer it for display.

Let the reader control Hebrew font size independently and set it large by default. The page owner reads on a phone and prefers large type.

## Scope: the whole Shas

The app covers the entire Babylonian Talmud across the full daf yomi cycle, about seven and a half years, one folio per day. Because the daf comes from the calendar endpoint, the app is always on the correct page of the current worldwide cycle without tracking the cycle itself. For context only, the current cycle began in January 2020 and reaches its next Siyum HaShas in 2027; on 2026-06-13 the cycle was in tractate Chullin, in Seder Kodashim. Treat that as background, not as data the app depends on.

## Rate and caching

Be a good Sefaria citizen. Cache each fetched daf and image on the device after first load, so revisiting a studied page costs no request and works offline. Sefaria's API is open and does not require a key. Do not hammer it; one fetch per daf per day is the normal load.
