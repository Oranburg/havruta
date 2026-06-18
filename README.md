# Havruta

A daf yomi study partner that argues with you, built in the form of the Silicon Havruta described in Seth Oranburg's *Judgment Proof*.

Live at https://oranburg.law/havruta/.

You read the daf and write your own reading before the partner says anything. Then it challenges that reading and refuses to let a weak one pass. You keep deciding what the page means; the partner makes you earn the decision. The friction is the point.

## What it is

A mobile-first web app (a Progressive Web App you can install on your phone and your laptop) that walks you through the whole Babylonian Talmud one page a day, on the daf yomi cycle. Every daf gives you three things:

1. The text of the day's daf, in Hebrew and Aramaic with English, pulled from Sefaria.
2. The actual page image, the classic Vilna tzurat hadaf, supplied by Sefaria.
3. A study partner that challenges your reading instead of handing you an answer.

You can do all of it from your phone, away from a laptop. The partner runs entirely in your own browser. You supply your own API key for one AI provider, and that key is stored only in your browser and never reaches any server, because there is no server. There is a free path through Google Gemini's free tier, and a newcomer with no key is pointed to it. Reading the daf and the page needs no key at all, because that content is free from Sefaria.

## What it does

- Line-by-line study. Under any line of the daf you open "Discuss this line," write one sentence saying what the line is doing, and the partner challenges that reading using the line's own words. The human acts first, now at the level of the single line.
- A partner that can search Sefaria. The partner has four tools the app runs against Sefaria: the curated cross-references for a line, any reference verbatim, a full-text search of the library, and the lexicons (Jastrow, BDB, Klein). It works from parallel Talmud first, then Chumash and the rest of Tanakh, then mystical sources, gematria, and philology when they bear on the line. It reaches only Sefaria, and it quotes only what a tool returns or the daf it was handed, never from memory.
- A synthesis partner. When you have taken up lines through the day, the whole-page reading box at the end becomes a closing havruta: it reads a digest of your line exchanges and helps you assemble the sugya, say it back, reconcile the tensions across your own readings, and write three sentences to keep.
- Transliteration. A single rule-based scheme following the Shofar magazine consonant chart, shown word over word under the Hebrew, off by default. See `docs/TRANSLITERATION-SCHEME.md`.
- The page and the commentaries. The Vilna page image with a pinch-zoom lightbox, tappable Hebrew words that open a Sefaria lexicon popover, a Compare-translations panel that lists the other English versions Sefaria carries for a line, and commentaries (Rashi, Tosafot, and more) and connections (cited verses, codes, parallels) verbatim from Sefaria.
- Read aloud. A play control on the daf reads the on-screen Hebrew and Aramaic with the browser's built-in speech synthesis (the Web Speech API), choosing a Hebrew voice when the browser exposes one. It never speaks until you press play, and when no Hebrew voice is present it says so rather than reading Hebrew with an English voice. The reading quality depends on which Hebrew voice your browser and platform provide, and some Android and Linux builds expose none. This is a plain reading aid, not cantillation.
- The record. The whole-Shas progress map with a streak, the saved study record in your browser, an Archive to reopen past sessions, and a download of any exchange as Markdown.
- Install and offline. Add it to your home screen and reopen studied pages with no network.

## Why it is built this way

*Judgment Proof*, Chapter 13 ("The Silicon Havruta"), draws a line between two ways to build a thinking machine. The Oracle delivers answers and hides how it got them; it removes friction, and removing the friction removes the practice that the friction was teaching. The havruta interrogates answers; it intensifies friction, and the friction is the pedagogy. The book's opening case is the lawyer who asked ChatGPT to confirm six citations, got confident confirmation, and filed a brief in which five of the six cases did not exist. The machine performed knowledge instead of possessing it. This app is built to be the opposite of that machine. It never invents a text. It quotes Sefaria or it says nothing.

The design rules the partner follows are written down in `docs/CONSTITUTION.md`. They are the specification, and every build decision answers to them.

## How it is built

The build shell is Astro. The React app mounts inside it as a single client-only island, so the whole study UI is the same React code it has always been, served from an Astro page that owns the HTML shell, the pre-paint theme script, and the root mount node. Astro runs Vite underneath, so the dev server, the bundler, and the plugin ecosystem are Vite's. The PWA is produced by the Astro PWA integration (autoUpdate, with the service-worker self-heal described below). MDX is preserved through `@mdx-js/rollup` so the content pages stay authored in MDX. The static site builds to `dist/` and deploys to GitHub Pages under `/havruta/`.

The service worker self-heals so a stale precache does not leave a reader on a black page. It updates automatically, cleans up outdated caches, reloads once on a controller change, and recovers from a failed chunk load by reloading rather than blanking.

The text is Sefaria and only Sefaria. The partner never invents a passage; it quotes a tool result or the daf it was handed, or it says nothing. The partner runs in the reader's own browser with the reader's own API key (Claude, GPT, Gemini, OpenRouter, or a custom endpoint), and that key never reaches any server because there is no server.

## How the repository is organized

The app is built and lives at the repository root. The specifications and the project record live in `docs/`.

- `docs/VISION.md` is what the project is and the long shape it grows toward.
- `docs/ROADMAP.md` is the build phases and the feature backlog, and the current built state.
- `docs/CONSTITUTION.md` is the partner's behavioral contract, sourced to Chapter 13.
- `docs/ARCHITECTURE.md` is the stack, the mobile and credit-protection constraints, and the in-browser multi-provider design.
- `docs/SOURCES.md` is every Sefaria endpoint, verified, with the daf yomi scope and the Hebrew display rules.
- `docs/PARTNER-PROMPT.md` is the system prompt for the partner.
- `docs/TRANSLITERATION-SCHEME.md` is the single Shofar-chart transliteration rule.
- `docs/LOOK-AND-FEEL.md` is the design system: tokens, fonts, and the dark-mode toggle.
- `docs/LICENSING.md` is Sefaria's terms, the attribution and credits, and the non-commercial caveat.
- `docs/VOICE.md` is the voice every line of generated and interface prose must follow.
- `docs/STATUS.md` is the dated record of what is built and verified live, what is deliberately left for later, and what the app depends on outside itself.
- `CHANGELOG.md` is the milestone history.

The `prompts/` folder is historical. It holds the large prompts from the original plan to build the app by handing tasks to a coding agent. The app is built now, so `prompts/` is part of the record, not the way to build or extend the app. Work happens in `src/`.

## Run it locally

You need Node 18 or newer.

```sh
npm install
npm run dev
npm run build
npm run preview
npm run smoke
```

`npm run dev` starts the Astro dev server on a local URL (it prints the address, usually http://localhost:4321). `npm run build` writes the static site to `dist/`. `npm run preview` serves the built `dist/` for a final check. `npm run smoke` runs the smoke test, which also runs in CI on every push; it has more than a hundred static checks across the catalog, transliteration, URL builders, route registration, the read-aloud control, and the Astro shell. The dev machine needs internet access for the study screen to load text and the page image from Sefaria.

See `DEPLOY.md` for deploying to GitHub Pages.

## A note on privacy

This repository is public. Two things follow. The quotations from *Judgment Proof* in `docs/` are kept short and attributed; the unpublished manuscript does not belong here in bulk. Your study record (your readings, your arguments with the partner, your notes across seven and a half years) stays on your device and is never committed. The app writes that record to your browser's local storage, and you can download any exchange to a file you keep. `.gitignore` blocks any session export from entering the repository. Your API key lives only in your own browser and reaches no server.

## Sources and licenses

The text and the page images come from Sefaria through its open API. The English is the William Davidson Talmud, distributed by Sefaria and Koren Publishers Jerusalem. The page image is the classic Vilna tzurat hadaf (the Romm Vilna pressing, 1880 to 1886), hosted by Sefaria; the Bomberg Venice pressing (1523) and the Munich manuscript (1342) are also available through the manuscripts API. The commentaries and the connections (cited verses, codes, parallels) are served verbatim from Sefaria. The reader supplies their own API key for the AI partner; the app ships no model and no key. The browser's speech synthesis supplies the read-aloud voice. Sefaria's terms, the full attribution, and the non-commercial caveat are written out in `docs/LICENSING.md` and `docs/SOURCES.md`. The repository's own code is under the license in `LICENSE`.

## Scope

The whole Shas. The daf yomi cycle runs about seven and a half years and covers the entire Babylonian Talmud, one folio a day. The app always asks Sefaria what today's daf is rather than computing it, so the schedule is correct without any cycle math to maintain.
