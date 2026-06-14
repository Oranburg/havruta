# Prompt 09: The calibration dial

Read first: `docs/CONSTITUTION.md` (requirement 4) and `docs/PARTNER-PROMPT.md`.

## Task

Let the owner set how hard the partner pushes, and feed that setting into the partner's system prompt. This implements requirement 4 of `docs/CONSTITUTION.md`: friction calibrated to capacity.

## What to build

Add a setting for the challenge level, with a small range from gentler to harder. The default sits at the level for a curious amateur who knows the alphabet and looks things up, which is who the owner is; do not start it at a yeshiva level.

Feed the chosen level into the `{{LEVEL}}` value of the system prompt in `docs/PARTNER-PROMPT.md`, which the proxy from prompt 06 sends to Claude. At a gentler setting the partner gives one more foothold and slows down; at a harder setting it withholds scaffolding and presses harder. The reader stays the one who decides what the page means at every level; the dial changes the difficulty of the challenge, not who holds authority.

Make the setting easy to reach and change from a phone, and remember it on the device. Let the owner change it mid-session if a page is too easy or too hard.

## Acceptance criteria

The owner can set the challenge level on a phone and the partner's behavior changes with it: gentler gives more help, harder presses more. The default is the amateur level. The setting persists and can change mid-session. At every level the partner challenges rather than ruling.

## Constraints

The dial changes difficulty only; it never turns the partner into an oracle that hands over answers. Follow `docs/CONSTITUTION.md` and `docs/VOICE.md`.
