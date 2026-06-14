# Havruta

A daf yomi study partner that argues with you, built in the form of the Silicon Havruta described in Seth Oranburg's *Judgment Proof*.

You read the daf and write your own reading before the partner says anything. Then it challenges that reading and refuses to let a weak one pass. You keep deciding what the page means; the partner makes you earn the decision. The friction is the point.

## What it is

A mobile-first web app (a Progressive Web App you can install on your phone and your laptop) that walks you through the whole Babylonian Talmud one page a day, on the daf yomi cycle, with three things on every page:

1. The text of the day's daf, in Hebrew and Aramaic with English, pulled from Sefaria.
2. The actual page image, the classic Vilna tzurat hadaf, supplied by Sefaria.
3. A study partner that challenges your reading instead of handing you an answer.

You can do all of it from your phone, away from a laptop. The partner runs on the Claude API called from inside the app, using your own Anthropic key stored on your device. There is no Claude Code, Cowork, or terminal in the loop.

## Why it is built this way

*Judgment Proof*, Chapter 13 ("The Silicon Havruta"), draws a line between two ways to build a thinking machine. The Oracle delivers answers and hides how it got them; it removes friction, and removing the friction removes the practice that the friction was teaching. The havruta interrogates answers; it intensifies friction, and the friction is the pedagogy. The book's opening case is the lawyer who asked ChatGPT to confirm six citations, got confident confirmation, and filed a brief in which five of the six cases did not exist. The machine performed knowledge instead of possessing it. This app is built to be the opposite of that machine. It never invents a text. It quotes Sefaria or it says nothing.

The design rules the partner follows are written down in `docs/CONSTITUTION.md`. They are not decoration. They are the specification.

## How the repository is organized

The human work (architecture, the partner's behavior, the verified data sources, the voice) lives in `docs/`. The build work is delegated. `prompts/` holds a numbered sequence of self-contained build tasks written for GitHub's coding agent. You hand the agent one prompt at a time; it opens a pull request that builds that feature against the docs. Read `prompts/README.md` for the order and the handoff.

- `docs/CONSTITUTION.md` is the partner's behavioral contract, sourced to Chapter 13.
- `docs/ARCHITECTURE.md` is the stack decision and the mobile and deploy constraints.
- `docs/SOURCES.md` is every Sefaria endpoint, verified, with the daf yomi scope and the Hebrew display rules.
- `docs/PARTNER-PROMPT.md` is the system prompt for the challenge engine, ready to drop into the Claude API call.
- `docs/VOICE.md` is the voice every line of generated and interface prose must follow.

## A note on privacy

This repository is public. Two things follow. The quotations from *Judgment Proof* in `docs/` are kept short and attributed; the unpublished manuscript does not belong here in bulk. Your study record (your readings, your arguments with the partner, your notes across seven and a half years) stays on your device and is never committed. The app writes that record to local storage on your phone and exports it to a file you keep. `.gitignore` blocks any session export from entering the repository.

## Scope

The whole Shas. The daf yomi cycle runs about seven and a half years and covers the entire Babylonian Talmud, one folio a day. The app always asks Sefaria what today's daf is rather than computing it, so the schedule is correct without any cycle math to maintain.
