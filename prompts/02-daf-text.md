# Prompt 02: Load and show today's daf text

Read first: `docs/SOURCES.md` and `docs/VOICE.md`.

## Task

Show the text of today's daf yomi, in Hebrew and Aramaic with English, pulled live from Sefaria, on the home study screen.

## What to build

On load, ask Sefaria what today's daf is with the calendars endpoint described in `docs/SOURCES.md`. Read the "Daf Yomi" item's `ref`. Do not compute the daf from a cycle start date.

Fetch the text for both sides of the daf, amud aleph and amud bet, using the Sefaria texts endpoint in `docs/SOURCES.md`. Render the Hebrew and Aramaic segments in Hebrew characters, right to left, and the English translation alongside, segment by segment, so the reader can move between the two. Strip HTML markup out of the English before display.

Give the reader a clear way to read on a phone: a toggle or layout that shows Hebrew only, English only, or both, because both side by side is cramped on a small screen. Let the reader set Hebrew font size on its own, and default it large.

Add navigation to the previous and next daf using the `prev` and `next` refs the texts endpoint returns, so the reader can move back to yesterday or look ahead. Keep a clear marker of which daf is today's official daf yomi.

Show the daf reference at the top in both English and Hebrew (the texts and calendar responses carry a Hebrew reference). Handle the loading state and a failed fetch with plain, calm copy.

## Acceptance criteria

Opening the app shows today's real daf yomi without any hardcoded date or page. The Hebrew and Aramaic display correctly right to left in Hebrew characters. The English shows with no leftover HTML tags. Previous and next navigation works. Hebrew font size control works and starts large. A network failure shows a readable message rather than a blank screen.

## Constraints

All text comes from Sefaria at runtime. Never store or generate Talmud text in the app. Follow `docs/VOICE.md` for interface copy. The Bavli is mostly Aramaic, not Hebrew; do not relabel it as Hebrew in the interface, and do not add vowel points to anything Sefaria returned unpointed.
