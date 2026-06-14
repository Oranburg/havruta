# Havruta

A daf yomi study partner that argues with you, built in the form of the Silicon Havruta described in Seth Oranburg's *Judgment Proof*.

You read the daf and write your own reading before the partner says anything. Then it challenges that reading and refuses to let a weak one pass. You keep deciding what the page means; the partner makes you earn the decision. The friction is the point.

## What it is

A mobile-first web app (a Progressive Web App you can install on your phone and your laptop) that walks you through the whole Babylonian Talmud one page a day, on the daf yomi cycle, with three things on every page:

1. The text of the day's daf, in Hebrew and Aramaic with English, pulled from Sefaria.
2. The actual page image, the classic Vilna tzurat hadaf, supplied by Sefaria.
3. A study partner that challenges your reading instead of handing you an answer.

You can do all of it from your phone, away from a laptop. The partner runs on the Claude API from inside the app. The owner signs in with Google, and a small server holds the Anthropic key so the owner's credits are protected and the public cannot spend them. Reading the daf and the page needs no sign-in, because that content is free from Sefaria. Anyone else who wants the partner can bring their own Anthropic key and pay their own way.

## Why it is built this way

*Judgment Proof*, Chapter 13 ("The Silicon Havruta"), draws a line between two ways to build a thinking machine. The Oracle delivers answers and hides how it got them; it removes friction, and removing the friction removes the practice that the friction was teaching. The havruta interrogates answers; it intensifies friction, and the friction is the pedagogy. The book's opening case is the lawyer who asked ChatGPT to confirm six citations, got confident confirmation, and filed a brief in which five of the six cases did not exist. The machine performed knowledge instead of possessing it. This app is built to be the opposite of that machine. It never invents a text. It quotes Sefaria or it says nothing.

The design rules the partner follows are written down in `docs/CONSTITUTION.md`. They are not decoration. They are the specification.

## How the repository is organized

The running app lives at the repository root: a React and Vite Progressive Web App with the foundation already built (the shell, the design system, the Sefaria reading, the page image, the human-acts-first gate). The plan and the specifications live in `docs/`. The build tasks for the rest live in `prompts/`, as large prompts for GitHub's coding agent. The owner hands the agent one prompt at a time; the architect reviews the pull request and steers the agent before it merges. Read `prompts/README.md` for the order and the handoff, and `docs/ROADMAP.md` for the phases.

- `docs/VISION.md` is what the project is and the long shape it grows toward.
- `docs/ROADMAP.md` is the MVP, the phases, and the full feature backlog, mapped to the prompts.
- `docs/CONSTITUTION.md` is the partner's behavioral contract, sourced to Chapter 13.
- `docs/ARCHITECTURE.md` is the stack, the mobile and deploy constraints, and the authentication and credit-protection design.
- `docs/SOURCES.md` is every Sefaria endpoint, verified, with the daf yomi scope and the Hebrew display rules.
- `docs/PARTNER-PROMPT.md` is the system prompt for the partner, ready to drop into the Claude API call.
- `docs/LOOK-AND-FEEL.md` is the design system: the exact tokens, fonts, and dark-mode toggle from the owner's other apps.
- `docs/LICENSING.md` is Sefaria's terms, the attribution and credits, and the non-commercial caveat.
- `docs/VOICE.md` is the voice every line of generated and interface prose must follow.

## Run it locally

Install with `npm install`, run with `npm run dev`, build with `npm run build`. See `DEPLOY.md` for deploying to Vercel and the environment variables the partner needs.

## A note on privacy

This repository is public. Two things follow. The quotations from *Judgment Proof* in `docs/` are kept short and attributed; the unpublished manuscript does not belong here in bulk. Your study record (your readings, your arguments with the partner, your notes across seven and a half years) stays on your device and is never committed. The app writes that record to local storage on your phone and exports it to a file you keep. `.gitignore` blocks any session export from entering the repository.

## Scope

The whole Shas. The daf yomi cycle runs about seven and a half years and covers the entire Babylonian Talmud, one folio a day. The app always asks Sefaria what today's daf is rather than computing it, so the schedule is correct without any cycle math to maintain.
