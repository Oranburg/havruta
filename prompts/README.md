# Build prompts

These are large, specific tasks for GitHub's coding agent. Each one builds a whole layer of the app in a single run, because the agent is paid by the prompt and runs deep on each one. The plan they follow is in `docs/ROADMAP.md`.

## The order

- `A-mvp-partner-and-login.md` builds the MVP: secure Google sign-in restricted to the owner, the server proxy that holds the Claude key, the streaming study partner, and the saved record. After this, the owner can study daily.
- `B-study-depth.md` adds the calibration dial, the classic commentaries next to the page, Sefaria's connections, and a partner that teaches in the reader's language.
- `C-record-and-platform.md` adds the whole-Shas progress map, export, full offline and install and accessibility, and a bring-your-own-key mode for other people.

Phase 0, the running foundation (the app shell, the design system, the Sefaria reading, the page image, the human-acts-first gate), is already built into the repository. These prompts extend it.

Phase 3 (studying together: accounts, sync, study rooms, line-anchored discussion) and Phase 4 (native apps and scale) get their own prompts when those phases arrive, because each needs design choices best made once the core is proven. See `docs/ROADMAP.md` for the full backlog.

## How a build runs

The owner hands one prompt to the coding agent (paste it as a GitHub issue and assign the agent, or open it in the agent's workspace). The agent reads the `docs/` folder first, then builds the feature as a pull request. The architect reviews the pull request, and the agent supports back-and-forth, so the architect can steer it before anything merges. When the pull request is right, the owner merges it. Then the next prompt.

## The standing rules every prompt obeys

The app never invents sacred text; all Talmud, Bible, and commentary text and all page images come from Sefaria at runtime, shown verbatim with attribution. The human acts first; the reader writes their own reading before the partner speaks. The owner's Claude credits are protected; the public can read freely or bring their own key, but cannot spend the owner's credits. Every word the user sees follows `docs/VOICE.md`, and the look follows `docs/LOOK-AND-FEEL.md`. `docs/CONSTITUTION.md` overrides on any conflict.
