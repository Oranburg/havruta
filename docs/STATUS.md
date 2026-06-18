# Status

Final-state record as of June 18, 2026. Version 0.8.1. Live at https://oranburg.law/havruta/.

A runtime audit on the live Astro build confirmed every feature below working in the browser. Where a feature depends on something outside the app, the dependency is named at the bottom.

## Built and verified live

- Today's daf, chosen from the Sefaria calendar API for the reader's local date.
- The daf text in Hebrew and Aramaic with English, both amudim (aleph and bet), pulled from Sefaria.
- The Vilna page image (the Romm pressing) with a pinch-zoom lightbox.
- The human-acts-first reading gate, at the level of the single line: under any line the reader opens Discuss this line, writes one sentence on what the line is doing, and only then does the partner speak.
- The AI partner, running entirely in the reader's browser with the reader's own key. It streams, it challenges rather than confirms, it never rules on halakha, and it never invents a text. It quotes a Sefaria tool result or the daf it was handed, or it says nothing.
- The partner's Sefaria tools: the curated cross-references for a line, any reference verbatim, a full-text search of the library, and the lexicons (Jastrow, BDB, Klein). It reaches only Sefaria.
- The synthesis partner. When the reader has worked lines on a daf, the closing whole-page box becomes a synthesis partner: it reads a digest of the day's line exchanges and helps the reader assemble the sugya, reconcile tensions across their own line readings, and write a few sentences to keep. The deeper pedagogical design for this partner is still open and tracked in issue #8.
- The Compare-translations panel. Opening it on a line lists the other English versions Sefaria carries for that segment, or shows a clear message when there are no others or the fetch failed. The earlier perpetual-spinner bug (issue #11) is fixed and the loaded state was verified live.
- Read aloud. A play control on the daf reads the on-screen Hebrew and Aramaic with the browser's speech synthesis (the Web Speech API), choosing a Hebrew voice when one exists. It never speaks until the reader presses play; with no Hebrew voice it says so rather than reading Hebrew with an English voice. Quality depends on the browser's available Hebrew voice.
- Settings: the provider, the API key, and the model. The key lives only in the browser.
- The MDX content pages render: Start here, How the daf is learned, Key terms, The cycle and the Siyum, Why this exists, and Find your way in.
- The whole-Shas progress map and the Archive of past sessions, with a streak and a Markdown download of any exchange.
- Word-over-word transliteration following the Shofar magazine chart, off by default.
- The PWA installs and reopens studied pages offline. The service worker self-heals: autoUpdate, cleanup of outdated caches, a one-time reload on controller change, and recovery from a failed chunk load rather than a black page.
- The dark and light toggle, with the choice remembered.
- A persistent link home to oranburg.law in the app footer.
- The build shell is Astro. The React app mounts as a single client-only island, the PWA is produced by the Astro PWA integration, and MDX is preserved through `@mdx-js/rollup`. The site builds to `dist/` and deploys to GitHub Pages under `/havruta/`. The smoke suite runs more than a hundred static checks in CI on every push.

## Deliberately left for later

These are real future work, tracked as open GitHub issues, not gaps in the shipped app.

- The synthesis partner's full pedagogical design: which leading move (review, structure-mapping, reconciliation, challenge), and how it stays a partner rather than a lecturer (issue #8).
- Study-together rooms, asynchronous then synchronous, which need a backend (issue #5).
- On-device local models through WebLLM, so a reader with no key can study (issue #4).
- A path to the Apple and Android app stores, wrapping the PWA or rebuilding the shell (issue #10).
- Advancing the daf at nightfall using Hebcal zmanim and the reader's location, off by default (issue #3).
- Two remaining content images: the study-hall-in-motion on the Learn page and the video-call on the Why page (issue #6).
- The shared Oranburg design system and a true breadcrumb home (issue #9). The footer link to oranburg.law is present and the palette is aligned to the family theme, but the tokens are not yet imported from the shared stylesheet and the home link is a footer link rather than a breadcrumb.
- Lower-priority refactors, accessibility follow-ups, and a real browser end-to-end test (issue #7).

## External dependencies

- Sefaria's open API must be reachable for the daf text, the page image, the commentaries, the connections, and the partner's tools. Previously studied pages reopen offline through the PWA cache.
- The read-aloud voice comes from the browser. A Hebrew voice has to be present for it to speak; some Android and Linux builds expose none, and the control says so rather than mangling the Hebrew.
- The AI partner needs the reader's own API key for one provider. There is a free path through Gemini's free tier, and a newcomer with no key is pointed to it. Reading the daf and the page needs no key.
