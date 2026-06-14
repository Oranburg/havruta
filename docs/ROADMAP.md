# Roadmap

This turns the vision into an order of work. It defines the smallest version worth using, then the phases that grow it, then the full feature backlog organized so the project can scale to dozens of features without losing its shape. Each phase names the Copilot mega-prompts that build it. The prompts live in `prompts/`.

The guiding rule is reach a working core fast, then build out. Get a daily loop that Seth actually uses, then add depth.

## Phase 0: Foundation (in progress)

A running, on-brand web app a reader can open. Today's daf from the Sefaria calendar, the Vilna page image, the bilingual text, the dark-mode toggle, the human-acts-first reading box with the partner panel locked. No AI and no accounts yet. This phase is built directly into the repository as the base the later prompts extend, rather than spent as a Copilot prompt.

Done when: the app builds and deploys, opens to today's real daf on a phone, shows text and page, and the reading gate works.

## Phase 1: MVP, the core loop (Copilot mega-prompt A)

The smallest version Seth uses every day. He opens today's daf on his phone, reads the page and the text, writes his own reading, and the partner challenges it. His credits are protected, and the session is saved so he can look back.

Scope:
- Google sign-in restricted to an allowlist, so only Seth reaches the partner through the server.
- A server proxy holding the Anthropic key, requiring a signed-in allowlisted session, with a per-session rate limit.
- The partner: the streaming challenge engine using the system prompt in `docs/PARTNER-PROMPT.md`, challenging the reading, quoting only the supplied Sefaria text, never ruling.
- The study record saved on the device, with a simple archive to reopen past sessions.

Done when: Seth, signed in on his phone, writes a reading and gets a real challenge on today's daf, and the session is saved. This is the MVP.

## Phase 2: Depth (Copilot mega-prompts B and C)

The features that make daily study richer and the app pleasant to keep.

Mega-prompt B, study depth:
- The calibration dial: how hard the partner pushes, matched to capacity.
- Layered guidance: show Rashi, Onkelos, and other commentaries from Sefaria next to the daf, with the reader choosing how much help.
- Sefaria's links: connections from each line to commentaries, parallels, and codes.
- The multilingual partner: the reader sets a study language and the partner teaches in it.

Mega-prompt C, record and platform:
- The whole-Shas progress map: the orders, tractates, and dapim, with studied pages marked, a streak, and revisit.
- Export the record to a file the reader keeps.
- Offline use and install: studied pages reopen with no network, the app installs to the home screen, large type and accessibility finished.
- Bring-your-own-key mode so any visitor can use the partner with their own key.

## Phase 3: Study together (later mega-prompts, one per capability)

The move from one reader to a room. This phase needs accounts and a backend datastore, so it is planned as its own set of prompts.

- Accounts and cross-device sync of the personal record.
- Study rooms: more than one person studying the same daf with the AI partner present.
- Asynchronous rooms first (people study the same daf across the day and see each other's readings and the partner's challenges), then synchronous rooms (studying together in real time).
- Discussion anchored to the lines of the page, the way social annotation works on e-learning platforms.
- Sharing a reading or an exchange.

## Phase 4: Native and scale

- Compile the web app into native iOS and Android apps with Capacitor and submit to the stores.
- Infrastructure for many users: caching, cost controls on the AI, moderation for shared content, analytics that respect privacy.

## The feature backlog, organized for scale

The backlog is grouped into areas so new features land in the right place as the project grows. This is the menu the architect draws mega-prompts from. Items are not in priority order within an area.

### Reading and text
Bilingual display, Hebrew-only and English-only views, font and Hebrew-size controls, prev and next daf, jump to any daf, search, vowelled and unvowelled toggle, the visual page with pinch-zoom and edition switching (Vilna, Bomberg, Munich), a daf yomi calendar view, the Hebrew date, audio of the daf if a source exists.

### The partner
The streaming challenge engine, the calibration dial, the multilingual partner, modes of challenge (find the weak step, raise the counter-text, press the next layer), a summary of what the reader committed to and what survived, the record of challenges kept even when overcome, guardrails that keep it from ruling or inventing.

### Guidance and commentary
Rashi, Onkelos, Tosafot, and other commentaries from Sefaria, progressive disclosure of help, grammar and vocabulary glosses for Aramaic, the link graph to parallels and codes, a beginner walk-through mode, a "just the gist" mode.

### Record and progress
Local session save, the archive, search of the archive, export, the whole-Shas map, streaks and counts, revisit, notes pinned to a daf or a line.

### Social and multiplayer
Accounts, sync, study rooms async and sync, line-anchored discussion, sharing, a group's shared record, invitations, presence, moderation.

### Access, language, and accessibility
Open reading with no login, sign-in for the partner and personal features, bring-your-own-key, study language selection, full right-to-left support, large type, screen-reader support, reduced motion, high-contrast.

### Platform and distribution
Progressive Web App install and offline, native iOS and Android via Capacitor, app-store presence, deep links to a specific daf, cost controls and rate limits on the AI, privacy-respecting analytics.

## How phases map to prompts

Phase 0 is built in the repo. Phase 1 is mega-prompt A. Phase 2 is mega-prompts B and C. Phase 3 and Phase 4 are planned as their own prompts when their phase arrives, because they each need design choices (the backend, the store accounts) that are better made when the core is proven. The architect writes each mega-prompt to be large and specific, since Copilot is paid by the prompt and runs deep on each one.
