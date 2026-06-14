# Mega-prompt C: the record and the platform

Hand this to Copilot after mega-prompts A and B. It turns the app into a daily tool that tracks the whole journey through Shas and works like an installed app on a phone, and it opens the partner to other people who bring their own key.

## Read these first

`docs/CONSTITUTION.md` (requirement 5 on the record), `docs/ARCHITECTURE.md` (caching, offline, the bring-your-own-key mode, the future native app), `docs/SOURCES.md` (the scope of Shas), `docs/LOOK-AND-FEEL.md`, `docs/VOICE.md`. Build on the existing `src/pages/Shas.jsx`, `src/pages/Archive.jsx`, the saved-session storage from mega-prompt A, and the PWA setup already in `vite.config.js`.

## What to build

### The whole-Shas progress map

Fill in `src/pages/Shas.jsx` with a map of the entire Babylonian Talmud: the six orders, their tractates, and the dapim. Mark which dapim have a saved session, mark today's daf, and show the rest ahead. Show a count and a streak of dapim studied. Tapping a studied daf reopens its saved session; tapping today's daf goes to study it. Use Sefaria for the structure of Shas and for which daf is today's. Do not hardcode the cycle schedule. On a phone, let the reader collapse to orders and tractates and expand into dapim, so the whole of Shas is not a wall of pages at once.

### Export the record

Add an export that writes the saved record, or a chosen range, to a Markdown file the reader keeps. Hebrew and Aramaic stay in Hebrew characters in the export. No build-tool or AI fingerprint in the file. The record stays on the device; export is the reader's own copy.

### Offline, install, accessibility, large type

Finish the Progressive Web App so it is a real daily tool. After a daf is fetched, its text and page image work offline (the caching is already configured; confirm it works and cache the app shell and recent dapim). Add an install prompt inviting the owner to add it to the home screen. Default type large with controls to grow it, the Hebrew size adjustable on its own. Meet WCAG AA contrast in both themes, respect reduced motion, label controls for screen readers, and make the study flow reachable by keyboard and touch. Keep to standard web APIs so the app can later be wrapped with Capacitor for the app stores; note the wrap steps in `DEPLOY.md`.

### Bring-your-own-key mode

Let a visitor who is not the owner paste their own Anthropic API key, stored only in their own browser, and use the partner with direct browser calls to Claude (with the header that permits direct browser access). This path never touches the owner's server or key, and it must never fall back to the server proxy. A visitor with their own key spends their own credits; a visitor without one can still read the daf and the page. Give the visitor a way to clear their key. The partner behaves the same as for the owner: it challenges, quotes only the supplied text, and never rules.

## Acceptance criteria

The reader sees the whole structure of Shas with studied dapim marked and today's highlighted, plus a correct count and streak, and can reopen any studied daf. Export produces a clean Markdown file with Hebrew intact. A studied daf reopens offline. The app installs to a phone home screen. Type controls work and start large. Contrast meets AA, reduced motion is respected, and the flow works by keyboard and screen reader. A non-owner can use the partner with their own key without touching the owner's credits. The app builds and runs.

## Constraints

The owner's credits stay protected; the bring-your-own-key path can never reach the server key. The record stays on the device. All text and images come from Sefaria. Match `docs/LOOK-AND-FEEL.md` and `docs/VOICE.md`.
