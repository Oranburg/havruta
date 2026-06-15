# Roadmap

## The arc

The project is organized around a single idea: the app is a bridge to the beit midrash. That gives the whole project its shape. The arc carries a person from studying alone, toward studying with help, toward studying with others, toward studying in person. Every page either deepens solo study or moves the reader one step along that arc. The app should never pretend to be the hall. It should always point toward it.

The four positions on the arc:

- **Alone.** The daily page and the record. A person keeps the daf even when no one else is there.
- **With help.** The partner, the commentaries, the lexicon, the read-aloud, the learn page. The page opens.
- **With others.** Study rooms and a found partner. Solo study becomes shared.
- **In person.** A local shiur, a real chevruta, a hall full of argument. The far side of the bridge.

## The pages

Each page has a place on the arc, a purpose, and a build status.

| Page | Route | Arc position | Purpose | Status |
|------|-------|-------------|---------|--------|
| Today | `/` | Alone, with help | The daily core: the page image, the text, the reading, the partner | Built |
| The daf, learned | `/learn` | With help | Why and how the daf is learned in a beit midrash, with Mermaid diagrams and images | Built |
| Why this exists | `/why` | With help (the soul) | The bridge stance and the arc, told with the image story | Built |
| Find your way in | `/find` | In person (bridge made concrete) | Real ways to find a daf yomi shiur, a chevruta, and a minyan | Built |
| Your journey through Shas | `/shas` | Alone, milestone | The map of the whole Talmud, plus streak and progress | Map built; companion planned |
| Your record | `/archive` | Alone | The saved sessions | Built |
| Settings and credits | `/settings` | With help | Provider and key, calibration, the read-aloud, the credits | Built |
| Start here | `/start` | Onboarding | How to use the app, how to set up the free partner, why you write first | In this version |
| Key terms | `/terms` | With help | The Hebrew and Aramaic vocabulary the study uses | In this version |
| Study together | rooms | With others | Asynchronous then synchronous rooms with the partner present | Future (Phase 3) |

## Build phases

### Phase 0: Foundation

A running, on-brand web app a reader can open. Today's daf from the Sefaria calendar, the Vilna page image, the bilingual text, the dark-mode toggle, the human-acts-first reading box with the partner panel locked. Built directly into the repository as the base the later phases extend.

Done when: the app builds and deploys, opens to today's real daf on a phone, shows text and page, and the reading gate works.

### Phase 1: MVP, the core loop

The smallest version worth using every day. The reader opens today's daf on a phone, reads the page and the text, writes a reading, and the partner challenges it. The study record is saved.

Scope: Google sign-in with an allowlist protecting the owner's credits; a server proxy holding the Anthropic key; the streaming challenge engine; the study record saved on device with an archive to reopen past sessions; multi-provider support so any visitor can bring their own key.

Done when: a signed-in reader writes a reading and gets a real challenge on today's daf, and the session is saved.

### Phase 2: Depth

Features that make daily study richer and the app pleasant to keep.

Study depth: the calibration dial; layered commentaries (Rashi, Tosafot, and more) from Sefaria; the Sefaria link graph to parallels and codes; the multilingual partner.

Record and platform: the whole-Shas progress map with streak; export the record; offline use and install to home screen; bring-your-own-key mode.

### Phase 3: Study together

The move from one reader to a room. Needs accounts and a backend datastore. Planned as its own set of prompts when the core is proven.

Features: accounts and cross-device sync; asynchronous study rooms (people study the same daf across the day and see each other's readings and the partner's challenges); synchronous rooms (studying together in real time); discussion anchored to lines of the page; sharing a reading or an exchange.

### Phase 4: Native and scale

Compile the web app into native iOS and Android apps with Capacitor and submit to the stores. Infrastructure for many users: caching, cost controls on the AI, moderation for shared content, analytics that respect privacy.

## Feature backlog

The backlog is grouped into areas so new features land in the right place as the project grows.

**Reading and text.** Bilingual display, Hebrew-only and English-only views, font and Hebrew-size controls, prev and next daf, jump to any daf, search, the visual page with pinch-zoom and edition switching (Vilna, Bomberg, Munich), a daf yomi calendar view, the Hebrew date.

**The partner.** The streaming challenge engine, the calibration dial, the multilingual partner, modes of challenge (find the weak step, raise the counter-text, press the next layer), a summary of what the reader committed to and what survived, guardrails that keep it from ruling or inventing. The line-by-line partner and its Sefaria tool use are built. The **synthesis partner**, the closing havruta that reads the day's line-by-line work and helps the reader assemble the whole sugya, is one of the most important planned features, because it is the step that turns daily reading into retained understanding; see [Synthesis Partner](Synthesis-Partner) and [issue #8](https://github.com/Oranburg/havruta/issues/8).

**Guidance and commentary.** Rashi, Tosafot, and other commentaries from Sefaria; progressive disclosure of help; grammar and vocabulary glosses for Aramaic; the link graph to parallels and codes.

**Record and progress.** Local session save, the archive, search of the archive, export, the whole-Shas map, streaks and counts, revisit, notes pinned to a daf or a line.

**Social and multiplayer.** Accounts, sync, study rooms async and sync, line-anchored discussion, sharing, a group's shared record, invitations, presence, moderation.

**Access, language, and accessibility.** Open reading with no login, sign-in for the partner and personal features, bring-your-own-key, study language selection, full right-to-left support, large type, screen-reader support, reduced motion, high-contrast.

**Platform and distribution.** Progressive Web App install and offline, native iOS and Android via Capacitor, app-store presence, deep links to a specific daf, cost controls and rate limits on the AI, privacy-respecting analytics.
