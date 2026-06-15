# The Synthesis Partner

Planned, and one of the most important features on the roadmap. Tracked as [issue #8](https://github.com/Oranburg/havruta/issues/8).

## What it is

The reader works the daf one line at a time, each line its own short havruta, each saved. At the end there is a step-back box where the reader writes a reading of the whole sugya and a page-level partner challenges it. That partner currently starts cold: it has the daf and the closing reading, but not the work the reader did on the way down.

The synthesis partner changes that. The closing partner reads all of the day's line exchanges for the daf and becomes a master havruta whose work is assembly rather than fresh challenge. It knows what the reader committed on each line, where the reader was pressed, and what survived, and it helps the reader pull those pieces into an understanding of the sugya as a whole.

## Why it is vital

Line-by-line study has a failure mode built into it: it fragments the page. A reader can work every line, answer every challenge, and reach the bottom of the daf having understood thirty sentences without understanding the sugya. A sugya is an argument the lines make together: a question, an answer, an objection, a resolution, a dispute and its two sides, a conclusion. Working the lines does not, on its own, assemble that argument. The move from the parts to the whole is what turns reading into understanding.

The beit midrash has always known this. Reading the last line does not finish the day's learning; the learner finishes it by saying back what the sugya was doing, and review (chazara) is the discipline that keeps a page learned rather than letting it evaporate by morning. A daf-a-day practice that never synthesizes produces motion without retention.

It is also the payoff of the preserved record. The constitution's fifth requirement keeps every challenge and response so that learning compounds. The synthesis partner is what finally uses that record: the saved line exchanges become the raw material the reader reassembles at the end of every page. And it fits the constitution exactly: the human writes the synthesis first, the partner presses it against the reader's own line readings rather than delivering a summary, and the reader keeps authority over what the page means.

## A first sketch

- Gather the day's saved sessions for the daf, in line order.
- Digest each line to its essentials (the reader's reading, the heart of the challenge, where it landed), so the synthesis stays focused and fits the context window.
- The human writes a synthesis of the sugya first.
- A synthesis-mode prompt, given the whole daf, the digest, and the reader's synthesis, helps name the sugya's structure, surfaces tensions between the reader's own line readings, and asks whether the synthesis answers the question the page raised. It still never invents and still does not rule.
- The synthesis is downloadable as Markdown, a kept artifact and the per-page analog of a siyum.
- If the reader did no line work, the closing partner behaves as it does today.

## Open questions to settle before building

Pedagogical: what the master havruta's leading move should be (review, structure-mapping, reconciliation, or challenge); how it avoids lecturing when the temptation to summarize is strongest; whether it builds a short written account for later review; how it serves a page studied across sittings or reopened on a review day; how it relates to the tractate siyum.

Technological: how to represent many line chats without regurgitation (digest, summarization pass, or full text by context size); token cost across providers; how the digest and line order are built from saved sessions; keeping the synthesis-mode prompt in sync with the line-mode prompt and the constitution; whether the synthesis partner carries the Sefaria tools and whether its cascade differs.

This page captures why the feature matters and a first sketch. The design questions above should be worked through, with the beit-midrash grounding, before implementation.
