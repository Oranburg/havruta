# Mega-prompt A: the MVP, secure login and the study partner

You are extending an existing, building React and Vite app in this repository. The foundation already runs: it loads today's daf yomi from Sefaria, shows the Hebrew and Aramaic with English and the Vilna page image, and has a reading box where the user writes their own reading before a locked "Your havruta" panel. Your job is to make that panel a real, secure, streaming study partner that only the owner can run, and to save each session. When you finish, the owner can study tonight: sign in with Google on a phone, write a reading of today's daf, and get challenged by the partner.

## Read these first (they are the source of truth, do not contradict them)

- `docs/CONSTITUTION.md` is the partner's behavioral contract. Every rule there is binding, above all that the partner never invents sacred text and quotes only the text it was handed.
- `docs/PARTNER-PROMPT.md` is the exact system prompt for the partner. Use it as written.
- `docs/ARCHITECTURE.md` is the system shape, including the authentication and credit-protection design.
- `docs/LOOK-AND-FEEL.md` is the visual system. Match it.
- `docs/VOICE.md` governs every word the user sees.
- `docs/LICENSING.md` defines the attribution and credit the app must show.

The existing files you will build on include `src/pages/Today.jsx` (the reading box and the locked partner panel), `src/lib/sefaria.js` (the verified data client), `src/App.jsx` (the shell, routes, theme toggle, footer), and `src/pages/Archive.jsx` and `src/pages/Settings.jsx` (placeholders to fill).

## The three things to build

### 1. Secure sign-in with Google, restricted to the owner

Add Google sign-in using Google Identity Services on the client. The sign-in returns a Google ID token (a signed JWT). The app does not need its own session or cookies; it holds the ID token in memory (and may keep it in local storage for convenience on a phone) and sends it to the server with each partner request as an `Authorization: Bearer` header.

Reading the daf text and the page image stays open to everyone with no sign-in, because that content is free from Sefaria and costs nothing. Only the partner requires sign-in.

The client reads the Google client id from `VITE_GOOGLE_CLIENT_ID`. Show a clear, calm sign-in screen or button on the partner panel when the user is not signed in. When signed in, show who is signed in and a way to sign out.

### 2. The server proxy that holds the Claude key and runs the partner

Create a Vercel serverless function at `api/havruta.js` (Vercel serves files in `api/` as serverless functions for a Vite project). The function is the only place the Anthropic key exists. It must:

- Require a valid Google ID token. Verify the token on the server: check its signature against Google's public keys, check that its audience equals `GOOGLE_CLIENT_ID`, and check that the verified email is in the `ALLOWED_EMAILS` allowlist (a comma-separated environment variable). Use a maintained library for verification (for example `google-auth-library`). Reject anything that fails with a clear 401 or 403, before reading the Anthropic key or calling Claude.
- Refuse any request that carries no reading from the user, returning a clear error. This enforces the human-acts-first rule on the server, so the partner is unreachable until the user has written their own reading. This matches `docs/CONSTITUTION.md` requirement 1.
- Apply a simple per-session rate limit (for example a small in-memory or token-bucket limit keyed by the verified email) so a runaway loop cannot burn credits.
- Read `ANTHROPIC_API_KEY` from the environment and call the Claude API with the latest available Claude model. Send the system prompt from `docs/PARTNER-PROMPT.md` (copy its text into the server code or load it), with the bracketed values filled: the daf reference, and a challenge level (default to the amateur level for now; the dial arrives in a later prompt). Send as user content the verbatim daf text the client supplies (the Hebrew and Aramaic and the English the app already fetched from Sefaria), the user's written reading, and the running exchange. The partner challenges the text it was handed and never recites text from memory.
- Stream the response back to the client so the partner appears to think with the reader. Use streaming from the Anthropic API and forward the chunks.

Never expose the Anthropic key to the client or commit it. All secrets live in Vercel environment variables.

### 3. The partner panel as a real conversation, and the saved record

In `src/pages/Today.jsx`, turn the locked panel into a live exchange once the reader submits a reading:

- The reader writes a reading, submits it, and the panel unlocks. Do not add any control that reveals an answer, a summary, or an explanation of the daf before the reading is submitted.
- Send the reading and the daf text to `api/havruta`, stream the partner's challenge into the panel, and let the reader answer in their own words. Each answer continues the exchange (send the updated history). The partner presses further: it finds the weak step, raises a counter-text from the supplied page, asks what the reading must account for. It does not rule, does not settle a dispute, and does not grade.
- Keep the reader's authority visible. The partner asks and challenges; the reader decides what the page means.
- Handle every failure plainly: not signed in, not allowlisted, rate limit reached, Claude error, network drop. Never fall back to inventing text or to a generic explanation. Show calm copy.

Save each session on the device (local storage, with IndexedDB if the exchange grows long): the daf reference and date, the reader's reading, and the full exchange. Fill in `src/pages/Archive.jsx` to list saved sessions and reopen them. Keep the partner's challenges in the record even when the reader's reading overcame them. The record stays on the device and is never sent to a server or committed.

### Also: the credits screen and the owner's credit

Add an About or Credits screen reachable from `src/pages/Settings.jsx`, per `docs/LICENSING.md`: it names Seth C. Oranburg as the creator with a link to oranburg.law, connects the partner to *Judgment Proof*, credits Sefaria with a link, credits the William Davidson Talmud and Koren Publishers for the text, and credits the National Library of Israel and the named pressings for the page images. Keep it tasteful. Put no build-tool or AI fingerprint anywhere the user can see.

## Setup the owner will do (document it in DEPLOY.md)

Update `DEPLOY.md` with exact steps and the environment variables this introduces:

- `ANTHROPIC_API_KEY` (server secret, the owner's Claude key).
- `GOOGLE_CLIENT_ID` (server, for token verification) and `VITE_GOOGLE_CLIENT_ID` (client, the same value).
- `ALLOWED_EMAILS` (server, comma-separated; the owner's Google email).

Document the one-time Google Cloud console steps to create an OAuth client id for a web app, including the authorized JavaScript origins and redirect handling for Google Identity Services, and the exact Vercel steps to set the variables and deploy. Write it so a non-specialist can follow it in a few minutes.

## Acceptance criteria

The owner signs in with Google on a phone. Reading the daf and the page needs no sign-in. After writing a reading, the owner gets a real, streaming challenge that engages that specific reading and quotes the supplied daf rather than invented lines. A request with no reading is refused by the server. A signed-in account not on the allowlist cannot reach the partner. The Anthropic key is never in the client bundle or the repository. The rate limit works. Sessions are saved on the device and reopen from the Archive. The credits screen is present. The app builds with `npm run build` and runs with `npm run dev`. Follow `docs/VOICE.md` throughout.

## Constraints

Honor every rule in `docs/CONSTITUTION.md`. The partner never invents sacred text and never rules. Secrets live only in Vercel environment variables. The study record stays on the device. Match `docs/LOOK-AND-FEEL.md`. Keep the foundation's structure and style; extend it rather than replacing it.
