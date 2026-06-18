# Changelog

The milestone history of the app. Live at https://oranburg.law/havruta/.

## 0.8.1 (June 2026)

- Migrated the build shell from Vite to Astro. The React app now mounts as a single client-only island inside an Astro page that owns the HTML shell, the pre-paint theme script, and the root mount node. Astro runs Vite underneath, the PWA is produced by the Astro PWA integration, and MDX is preserved through `@mdx-js/rollup`. The site builds to `dist/` and deploys to GitHub Pages under `/havruta/`.
- Added a read-aloud control on the daf. It reads the on-screen Hebrew and Aramaic with the browser's speech synthesis (the Web Speech API), choosing a Hebrew voice when one exists, never speaking until the reader presses play, and saying so rather than reading Hebrew with an English voice when no Hebrew voice is present.
- Hardened the service worker against a stale precache leaving a reader on a black page: autoUpdate, cleanup of outdated caches, a one-time reload on controller change, and recovery from a failed chunk load.
- Fixed the Compare-translations panel, which sat on Loading forever (issue #11). A React StrictMode effect set the loading state and then never resolved because it was gated on the same status it set and listed that status in its dependency array. The effect is now re-keyed on the panel opening, the segment, and an attempt counter; the status gate is gone; and a Try again control was added. Verified loading live.
- Mermaid rendering fixed and the content-page diagrams redesigned to carry the argument.

## 0.8.0

- Added the synthesis partner. When the reader has worked lines on a daf, the closing whole-page box reads a digest of the day's line exchanges and helps the reader assemble the sugya, reconcile tensions across their own readings, and write a few sentences to keep.

## 0.7.0

- Hardened the partner's never-invent rule and its refusal to cave; tightened chat spacing; added a Markdown download of any chat.

## 0.6.0

- Gave the partner Sefaria tools: the curated cross-references for a line, any reference verbatim, a full-text search, and the lexicons. It works across the canon in a study partner's order and never leaves Sefaria.

## 0.5.0

- Shipped word-over-word transliteration following the Shofar magazine chart and removed the multiple-scheme dropdown (issue #2).

## 0.3.0

- Moved study to the line. Every line has a Discuss this line control, and the human-acts-first gate is at the line: the reader writes one sentence on what the line is doing before the partner speaks.

## Earlier

- The daily loop: today's daf from the Sefaria calendar, the Vilna page image, the bilingual text, the human-acts-first reading gate, and the in-browser AI partner with the reader's own key. The whole-Shas progress map, the saved record and Archive, install and offline, and the content pages followed.
