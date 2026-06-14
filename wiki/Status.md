# Status

Current as of the most recent commit. For deferred items, see the linked GitHub issues.

## Built and live

These features are deployed at https://oranburg.law/havruta/.

- Daily daf by the reader's local date, fetched from the Sefaria calendar API
- Bilingual Hebrew/Aramaic and English text, both amudim (amud aleph and amud bet), with a view toggle and font controls, and saved preferences
- The daf page image (Vilna Romm pressing) leads the screen with a zoomable lightbox
- The human-acts-first reading gate: the partner panel stays locked until the reader submits their own reading
- In-browser AI study partner: streams responses, never invents text, challenges rather than confirms, never rules on the halakha, and acknowledges when a reading is sound
- Multi-provider choice: Claude, GPT, Gemini, OpenRouter, or a custom endpoint; a free Gemini path requires no paid account; the app defaults to the best free option when no key is set
- Read-aloud transliteration as a labeled pronunciation aid, following the Sephardi academic scheme documented in `docs/TRANSLITERATION-SCHEME.md`
- Engage with the Hebrew: tap a word for the Sefaria lexicon, compare translations side by side, open the passage on Sefaria.org directly, gradient progress bar through the daf
- Commentaries (Rashi, Tosafot, and more) and connections (cited verses, halakhic codes, parallel passages), all verbatim from Sefaria
- Saved study record and Archive page to reopen past sessions
- Whole-Shas progress map with a streak counter
- Install to home screen and offline reading for previously studied pages (PWA)
- Hamburger navigation menu
- Pages: Today (`/`), How the daf is learned (`/learn`), Why this exists (`/why`), Find your way in (`/find`), Your record (`/archive`), Settings (`/settings`)
- Image library cataloged with captions (`assets/images/catalog.json`)

## In this version

These items are in active development in the current branch.

- [ ] Smoke test and CI (continuous integration check on every push)
- [ ] Hardening pass: HTML sanitization, accessibility focus management, graceful degradation on API errors, dead-code removal, smaller PWA precache list
- [ ] Page: Start here (`/start`), onboarding with captioned images and setup instructions
- [ ] Page: Key terms (`/terms`), the Hebrew and Aramaic vocabulary used in study
- [ ] Shas journey companion content on `/shas` with captioned images and Mermaid diagrams

## Deferred (tracked as issues)

These are planned features not yet scheduled. Each should have a corresponding GitHub issue.

- [ ] Multiple transliteration schemes selectable by the reader: Sephardi academic (shipped), Yeshivish Ashkenazi, popular/magazine style, Modern Israeli Hebrew, strict scholarly. See [Transliteration Schemes](Transliteration-Schemes) for the full checklist.
- [ ] Advance the daf at nightfall using Hebcal and the reader's location, rather than at midnight
- [ ] On-device local models (no API key required, no network for the partner)
- [ ] Study-together rooms: asynchronous and synchronous, both require a backend (Phase 3)
- [ ] Two images still to generate: the learn-page hall-in-motion and the why-page video-call
- [ ] Lower-priority refactors identified during the hardening pass
