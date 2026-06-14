# Prompt 07: Save and export the study record

Read first: `docs/CONSTITUTION.md` (requirement 5) and `docs/ARCHITECTURE.md` (state and privacy).

## Task

Save every study session on the device and let the owner export it. The record is private and stays local.

## What to build

After each session, save it on the device: the daf reference and date, the reader's reading and any later versions of it, the full exchange with the partner, and the reader's responses. Use the browser's local storage on the device, with IndexedDB for the session bodies because they grow long over years. Keep the partner's challenges even when the reader's final reading overcame them, because the challenge is the record of what the reading had to answer for. This is requirement 5 of `docs/CONSTITUTION.md`.

Build a session archive screen: a list of past dapim with dates, openable to reread the whole exchange. Make it searchable by daf and by date.

Add an export that writes the record, or any range of it, to a Markdown file the owner downloads and keeps. Hebrew and Aramaic in the export stay in Hebrew characters. The export carries no app or tool fingerprint.

Keep all of this on the device. Do not send the record to any server. Do not commit any session data to the repository. If the owner later wants sync across devices, that is a separate decision with its own privacy review, not a default here.

## Acceptance criteria

Each finished session is saved on the device and survives a refresh and an app reopen. The archive lists and reopens past sessions and is searchable. Export produces a clean Markdown file with Hebrew intact and no tool fingerprint. No session data leaves the device or enters the repository.

## Constraints

The record is private and local. Follow `docs/VOICE.md`, including no generated-by lines in exports. Never discard a challenge from the saved record.
