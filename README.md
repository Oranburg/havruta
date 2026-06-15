# Havruta

A daf yomi study partner that argues with you, built in the form of the Silicon Havruta described in Seth Oranburg's *Judgment Proof*.

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
- The page and the commentaries. The Vilna page image with a pinch-zoom lightbox, tappable Hebrew words that open a Sefaria lexicon popover, side-by-side translation compare, and commentaries (Rashi, Tosafot, and more) and connections (cited verses, codes, parallels) verbatim from Sefaria.
- The record. The whole-Shas progress map with a streak, the saved study record in your browser, an Archive to reopen past sessions, and a download of any exchange as Markdown.
- Install and offline. Add it to your home screen and reopen studied pages with no network.

## Why it is built this way

*Judgment Proof*, Chapter 13 ("The Silicon Havruta"), draws a line between two ways to build a thinking machine. The Oracle delivers answers and hides how it got them; it removes friction, and removing the friction removes the practice that the friction was teaching. The havruta interrogates answers; it intensifies friction, and the friction is the pedagogy. The book's opening case is the lawyer who asked ChatGPT to confirm six citations, got confident confirmation, and filed a brief in which five of the six cases did not exist. The machine performed knowledge instead of possessing it. This app is built to be the opposite of that machine. It never invents a text. It quotes Sefaria or it says nothing.

The design rules the partner follows are written down in `docs/CONSTITUTION.md`. They are the specification, and every build decision answers to them.

## How the repository is organized

The app is built and lives at the repository root: a React and Vite Progressive Web App. The specifications and the project record live in `docs/`.

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

The `prompts/` folder is historical. It holds the large prompts from the original plan to build the app by handing tasks to a coding agent. The app is built now, so `prompts/` is part of the record, not the way to build or extend the app. Work happens in `src/`.

## Run it locally

You need Node 18 or newer.

```sh
npm install
npm run dev
npm run build
npm run smoke
```

`npm run dev` serves the app on a local URL (usually http://localhost:5173). `npm run build` writes the static site to `dist/`. `npm run smoke` runs the smoke test, which also runs in CI on every push. The dev machine needs internet access for the study screen to load text and the page image from Sefaria.

See `DEPLOY.md` for deploying to GitHub Pages.

## A note on privacy

This repository is public. Two things follow. The quotations from *Judgment Proof* in `docs/` are kept short and attributed; the unpublished manuscript does not belong here in bulk. Your study record (your readings, your arguments with the partner, your notes across seven and a half years) stays on your device and is never committed. The app writes that record to your browser's local storage, and you can download any exchange to a file you keep. `.gitignore` blocks any session export from entering the repository. Your API key lives only in your own browser and reaches no server.

## Scope

The whole Shas. The daf yomi cycle runs about seven and a half years and covers the entire Babylonian Talmud, one folio a day. The app always asks Sefaria what today's daf is rather than computing it, so the schedule is correct without any cycle math to maintain.
