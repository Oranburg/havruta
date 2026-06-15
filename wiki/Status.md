# Status

Current as of the most recent commit. For deferred items, see the linked GitHub issues.

## Built and live

These features are deployed at https://oranburg.law/havruta/.

- Daily daf by the reader's local date, fetched from the Sefaria calendar API
- Bilingual Hebrew/Aramaic and English text, both amudim (amud aleph and amud bet), with a view toggle and font controls, and saved preferences
- The daf page image (Vilna Romm pressing) leads the screen with a zoomable lightbox
- The human-acts-first reading gate: the partner panel stays locked until the reader submits their own reading
- In-browser AI study partner: streams responses, never invents text, challenges rather than confirms, never rules on the halakha, and acknowledges when a reading is sound
- Line-by-line engagement: every line has a Discuss this line control; the human-acts-first gate is at the line (write one sentence on what the line is doing, and the partner challenges that reading with the line's own words). A whole-page reading remains at the end as a closing synthesis.
- The partner can search Sefaria with judgment: it pulls a line's curated cross-references, reads parallel sugyot and cited verses, searches the canon, and looks words up in the dictionaries, following the order a study partner does (Talmud parallels, then Chumash and Tanakh, then mystical sources, gematria, and philology when relevant). It reaches only Sefaria, never the open web, and quotes only what a tool returns.
- Multi-provider choice: Claude, GPT, Gemini, OpenRouter, or a custom endpoint; a free Gemini path requires no paid account; the app defaults to the best free option when no key is set
- Word-over-word transliteration as a pronunciation aid, the romanization sitting under each Hebrew word, following the Shofar magazine consonant chart documented in `docs/TRANSLITERATION-SCHEME.md`; on or off, off by default
- Engage with the Hebrew: tap a word for the Sefaria lexicon, compare translations side by side, open the passage on Sefaria.org directly, gradient progress bar through the daf
- Commentaries (Rashi, Tosafot, and more) and connections (cited verses, halakhic codes, parallel passages), all verbatim from Sefaria
- Saved study record and Archive page to reopen past sessions
- Whole-Shas progress map with a streak counter
- Install to home screen and offline reading for previously studied pages (PWA)
- Hamburger navigation menu
- Pages: Today (`/`), Start here (`/start`), How the daf is learned (`/learn`), Key terms (`/terms`), The cycle and the Siyum (`/journey`), Why this exists (`/why`), Find your way in (`/find`), Your record (`/archive`), Settings (`/settings`)
- Smoke test and CI: build, smoke, and deploy run on every push to main
- Image library cataloged with captions (`assets/images/catalog.json`)

## Recently shipped

- Line-by-line engagement and the per-line partner (v0.3.0)
- Word-over-word transliteration; one Shofar scheme, the multiple-scheme dropdown removed (v0.5.0)
- The Sefaria-searching partner: tool use across the canon, never leaving Sefaria, never inventing (v0.6.0)

## Deferred (tracked as issues)

These are planned features not yet scheduled. Each should have a corresponding GitHub issue.

- [x] Multiple transliteration schemes: closed by decision (issue #2). One scheme shipped, the Shofar magazine chart; the multiple-scheme dropdown was built and removed because the Israeli variants differed only by diacritics that often did not render, and there is no official Ashkenazi standard to implement faithfully. A real published standard (SBL, ISO 259, Academy of the Hebrew Language) can reopen as its own issue. See [Transliteration Schemes](Transliteration-Schemes).
- [ ] Advance the daf at nightfall using Hebcal and the reader's location, rather than at midnight
- [ ] On-device local models (no API key required, no network for the partner)
- [ ] Study-together rooms: asynchronous and synchronous, both require a backend (Phase 3)
- [ ] Two images still to generate: the learn-page hall-in-motion and the why-page video-call
- [ ] Lower-priority refactors identified during the hardening pass
