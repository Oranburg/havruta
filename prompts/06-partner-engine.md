# Prompt 06: The study partner

Read first: `docs/CONSTITUTION.md`, `docs/PARTNER-PROMPT.md`, and `docs/ARCHITECTURE.md`.

## Task

Build the study partner: a server proxy that holds the Claude key and a chat panel that challenges the reader's reading of the daf. This is the heart of the app.

## What to build

Create a serverless function on Vercel that proxies to the Claude API. The function holds the Anthropic key in the `ANTHROPIC_API_KEY` environment variable, so the key never reaches the browser. Before it reads the key or calls Claude, it requires a valid allowlisted session from prompt 05. Add a simple per-session rate limit so a runaway loop cannot burn credits.

The function sends the system prompt from `docs/PARTNER-PROMPT.md`, with the bracketed runtime values filled in: the daf reference and, later, the challenge level from prompt 09. Along with the system prompt it sends, as user content, the verbatim Hebrew, Aramaic, and English text of the daf that the app already fetched from Sefaria, plus the reader's own written reading and the running exchange. The partner challenges the text it was handed; it does not recite text from memory. Use the latest available Claude model. Stream the response back to the app.

Reject any request that carries no reading from the reader, so the partner stays unreachable until the reader has written something of their own. This backs up the gate from prompt 04 on the server side.

On the frontend, build the partner panel that unlocked in prompt 04 into a conversation: the reader sees the partner's challenge, answers it in their own words, and the partner presses further. Stream the partner's words as they arrive. Keep the reader's authority visible; the partner asks and challenges, it does not declare the answer or rule on a dispute.

Handle the failure cases plainly: no session, rate limit reached, Claude error, network drop. Never fall back to inventing text or to a generic explanation when the partner is unavailable.

## Acceptance criteria

A signed-in owner writes a reading and gets a real, streaming challenge that engages that specific reading and quotes the supplied daf rather than invented lines. The Anthropic key is never present in the browser or the repo. A request with no reading is refused. The rate limit works. The partner challenges rather than summarizes, and it does not rule on disputes. Failures show calm copy and never produce fake text.

## Constraints

Every requirement in `docs/CONSTITUTION.md` applies here, above all the rule that the partner never generates sacred text and quotes only what it was handed. Use the system prompt in `docs/PARTNER-PROMPT.md` as written. Follow `docs/VOICE.md`.
