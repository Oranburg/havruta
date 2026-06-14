# Prompt 08: Progress through the whole Talmud

Read first: `docs/SOURCES.md` (the scope section) and `docs/VOICE.md`.

## Task

Track the owner's march through the entire Babylonian Talmud across the daf yomi cycle, and let him see where he is and revisit any daf he has studied.

## What to build

Build a map of Shas: the six orders (sedarim), their tractates (masechtot), and the dapim in each. Mark which dapim the owner has a saved session for (from prompt 07), which is today's daf, and which are still ahead. Show his current place in the whole Talmud at a glance, and a simple count and streak of dapim studied.

Let the owner tap any studied daf to reopen its saved session, and tap today's daf to go study it. Looking ahead or back to an unstudied daf opens the text and page for reading.

Use Sefaria as the source for the structure of Shas and for which daf is today's, as described in `docs/SOURCES.md`. Do not hardcode the cycle schedule; the calendar endpoint gives today's daf, and the app marks progress against the owner's own saved sessions.

Make the map usable on a phone: the whole of Shas is large, so let the owner collapse to orders and tractates and expand into dapim, rather than facing every page at once.

## Acceptance criteria

The owner sees the whole structure of Shas with his studied dapim marked and today's daf highlighted. The count and streak are correct against his saved sessions. Tapping a studied daf reopens its session; tapping today's daf starts study. The map works on a phone without becoming a wall of pages. Nothing about the schedule is hardcoded.

## Constraints

Structure and today's daf come from Sefaria. Follow `docs/VOICE.md`. Progress reflects the owner's own saved sessions, which live only on the device.
