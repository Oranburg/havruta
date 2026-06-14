# Prompt 04: The study flow and the rule that you act first

Read first: `docs/CONSTITUTION.md` (especially requirement 1) and `docs/VOICE.md`.

## Task

Build the study screen as a sequence: read the daf, write your own reading, and only then reach the partner. Lock the partner until the reader has written something of their own. The partner itself arrives in prompt 06; this prompt builds the flow and the gate around it.

## What to build

Lay out the day's study as a clear path on a phone. The reader sees the daf (text from prompt 02 and the page image from prompt 03), then a space to write their own reading: a free-text area where they put what they think the page is saying, the line that puzzles them, a paraphrase attempt, or a question. Prompt them plainly for it; the label should ask for their reading, not for an answer to a quiz.

Keep the partner panel present but locked until the reader submits a reading. The lock is real, not cosmetic: there is no way to open the partner, reveal an explanation, or get a summary of the daf before the reader has written their own reading first. After they submit, the partner panel unlocks. This enforces requirement 1 of `docs/CONSTITUTION.md`: the human produces judgment before the machine engages, because acting first builds judgment and receiving first wears it away.

Let the reader edit and add to their reading as the study session goes on, and keep each version, because the record of how their reading changed is worth keeping (prompt 07 saves it).

Make the whole flow comfortable one-handed on a phone: the daf, the reading box, and the partner area reachable by thumb, with the keyboard not covering the text they are typing.

## Acceptance criteria

The reader cannot reach the partner, an explanation, or a daf summary before writing a reading. After writing one, the partner area unlocks. The reading box is easy to use on a phone. The reader's reading is held in app state ready for prompt 06 to send and prompt 07 to save. There is no hidden button that shortcuts the gate.

## Constraints

The gate is a core rule from `docs/CONSTITUTION.md`, not a preference; do not add a skip. Follow `docs/VOICE.md` for every prompt and label. Do not summarize or explain the daf anywhere in this flow; that is the opposite of what the app is for.
