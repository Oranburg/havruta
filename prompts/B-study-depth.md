# Mega-prompt B: study depth

Hand this to Copilot after mega-prompt A is merged and the MVP works. It adds the depth that makes daily study richer: a way to dial how hard the partner pushes, the classic commentaries next to the page, Sefaria's web of connections, and a partner that can teach in the reader's own language.

## Read these first

`docs/CONSTITUTION.md` (requirement 4 on calibration, and the rule against inventing text), `docs/SOURCES.md` (Sefaria endpoints and Hebrew display), `docs/PARTNER-PROMPT.md`, `docs/LOOK-AND-FEEL.md`, `docs/VOICE.md`. Build on the existing `src/pages/Today.jsx`, `src/lib/sefaria.js`, `src/pages/Settings.jsx`, and the `api/havruta.js` proxy from mega-prompt A.

## What to build

### The calibration dial

Add a setting for how hard the partner pushes, from gentler to harder, defaulting to the level for a curious amateur who knows the alphabet and looks things up. Feed the chosen level into the `{{LEVEL}}` value of the partner system prompt that `api/havruta.js` sends. At a gentler setting the partner gives one more foothold and slows down; at a harder setting it withholds scaffolding and presses harder. The reader stays the one who decides what the page means at every level. Store the setting on the device and let the reader change it mid-session. This is requirement 4 of `docs/CONSTITUTION.md`.

### Layered commentary

Show the classic commentaries next to the daf, pulled from Sefaria: Rashi, Onkelos (the Aramaic Targum where relevant), Tosafot, and others Sefaria carries for the page. Let the reader choose how much help they want, from hidden, to a light gloss, to the full commentary. Use Sefaria's links and text endpoints to fetch a line's commentaries. Keep the commentary text verbatim from Sefaria with attribution, never generated. Hebrew and Aramaic render in Hebrew characters, right to left.

### Sefaria's connections

For a selected line of the daf, show its connections from Sefaria's link graph: commentaries, parallel passages, and the halakhic codes that cite it. Let the reader follow a connection to read the related text, then return. This opens the page outward the way study does.

### The multilingual partner

Let the reader set a study language. The partner then teaches in that language while the page stays in Hebrew and Aramaic. Pass the chosen language into the partner system prompt so the partner challenges and explains in the reader's language. Store the setting with the reader's other preferences. Default to English. The Claude model already handles many languages, so this is mostly passing the setting through and labeling the interface.

## Acceptance criteria

The reader can set how hard the partner pushes and feel the difference. Rashi, Onkelos, and other commentaries appear next to the daf from Sefaria, verbatim, with attribution, and the reader controls how much shows. A line's Sefaria connections are reachable and followable. The partner teaches in the reader's chosen language. Everything still honors the no-invention rule and the human-acts-first gate. The app builds and runs.

## Constraints

All text, including commentary, comes from Sefaria at runtime and is shown verbatim with attribution. The partner never invents and never rules. Match `docs/LOOK-AND-FEEL.md` and `docs/VOICE.md`.
