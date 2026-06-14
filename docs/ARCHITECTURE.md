# Architecture

This document fixes the stack and the constraints so every build prompt produces one coherent app. When a prompt is silent on a choice, this document answers it.

## The three hard constraints

The owner uses this on a phone, away from a laptop, so the whole study flow has to work in a mobile browser with nothing else running. The owner pays for the Claude usage, so the public must never be able to spend his Claude credits; access is gated by login and the Anthropic key never reaches the browser. The app must never invent a sacred text, so all primary text and page images come from Sefaria at runtime.

## Shape of the system

The app has a frontend the owner sees and a thin backend that holds the secret and talks to Claude.

The frontend is a React app built with Vite, designed mobile-first and installable as a Progressive Web App, so it gets a home-screen icon on the phone and caches studied pages for offline reading. It talks to Sefaria directly for text and images (Sefaria's API is open and needs no key) and talks to its own backend for anything involving Claude.

The backend is a set of serverless functions in the same repository. One function is the Claude proxy: it receives a study exchange from the signed-in owner, adds the Anthropic key from a server environment secret, calls the Claude API, and streams the partner's response back. The key exists only on the server. The browser never sees it.

## Hosting and deploy

Deploy the whole repository to Vercel. Vercel serves the static frontend and runs the serverless functions from the same project, deploys automatically on every push to `main`, gives HTTPS and a stable URL that installs cleanly as a PWA on the phone, and has a free tier that covers a single-user tool. The GitHub coding agent can build the frontend and the functions together in one repo and let Vercel deploy both.

GitHub Pages was the owner's prior deploy pattern, and it is the right tool for a purely static site. It cannot hold a server secret or run auth, so it does not fit once the app has to protect the Claude key. The credit-protection constraint is what moves hosting to Vercel.

## Authentication and credit protection

Sign-in uses the owner's Google login. Because the frontend is a Vite single-page app rather than a Next.js app, the cleanest implementation is Google Identity Services on the client (the Google sign-in button, which returns a signed Google ID token) plus verification of that token on the server. The frontend sends the Google ID token to the proxy; the proxy verifies the token's signature against Google's public keys, checks that its audience matches the app's Google client id, and checks the account email against an allowlist held in an environment variable (`ALLOWED_EMAILS`). Only an allowlisted, verified account reaches a protected function. Everyone else sees the sign-in screen and reaches nothing protected. This avoids server-side session and cookie machinery, which suits a single-page app used on a phone. Auth.js with the Google provider is a heavier alternative if a full session layer is ever wanted.

The Claude proxy function rejects any request without a valid allowlisted session before it ever reads the Anthropic key or calls Claude. So a member of the public who loads the public URL can sign in with their own Google account, fail the allowlist, and get nothing; they cannot reach the proxy, and they cannot spend the owner's credits. Add a simple per-session rate limit on the proxy as a second guard against runaway use.

Secrets to set in Vercel, never in the repository: `ANTHROPIC_API_KEY`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, and `ALLOWED_EMAILS`. The Google OAuth client ID and secret come from the Google Cloud console; creating them is a one-time setup the owner does and is willing to do.

A lower-code alternative exists if the owner prefers it: put a static frontend and a Cloudflare Worker proxy behind Cloudflare Access, configure Access to allow only the owner's Google email, and let the Worker read the verified identity header and hold the Anthropic secret. That removes the auth code from the repo at the cost of adding Cloudflare configuration. The primary build target is the Vercel and Auth.js design above, because it keeps the whole app in one repository the GitHub agent can build end to end.

## Two ways to reach the partner

The owner signs in with Google and his requests go through the server proxy, which holds the Anthropic key and spends the owner's credits. That is the project's reason for existing, and the allowlist on the proxy is what keeps the public off those credits.

A second mode is a welcome bonus rather than a goal: any visitor may paste their own Anthropic API key into the app, where it is stored only in that visitor's own browser and used to call the Claude API directly from that browser (with the header that permits direct browser access). A visitor in this mode spends their own credits, and their key never reaches the owner's server. This mode must never route through the server proxy or the server key. The result is that a stranger with the public URL has exactly two honest options: bring a key and pay their own way, or study the text and page without the partner. Neither option can spend the owner's credits.

Build the owner's Google-gated server path first and completely. Treat bring-your-own-key as an additive mode layered on after the core works, gated so it can never fall back to the server key.

## How the partner is called

The frontend never calls the Anthropic API. It posts the day's verbatim Sefaria text, the owner's own reading, and the running exchange to the backend proxy. The proxy loads the system prompt from `docs/PARTNER-PROMPT.md`, sends it to the Claude API with the latest available Claude model, and streams the reply. Because the primary text travels from Sefaria through the app to the proxy as data, the partner challenges a real text it was handed rather than reciting a text from memory, which is the safeguard against invented quotations.

## State and the study record

The study record stays on the device. Use the browser's local storage (IndexedDB for the session bodies, which can be long) for the daf, the owner's reading, the exchange, and his responses. Provide an export to a Markdown file the owner keeps. Do not send the record to any server and do not commit it to the repository. If cross-device sync is wanted later, that is a deliberate later feature with its own privacy decision, not a default.

## Caching and offline

Cache fetched daf text and page images after first load so a studied page reopens with no network and works on a plane. The app shell and the last studied pages should be available offline. Live Claude exchange needs the network, which is expected.

## Future: a native app in the stores

The owner may want this in the App Store and Play Store one day. Building it as a clean Progressive Web App keeps that path open without a rewrite. A PWA can later be wrapped with Capacitor, which takes the existing web build and produces native iOS and Android projects you open in Xcode and Android Studio and submit to the stores. To keep that path easy, hold the frontend to standard web APIs, keep the app fully responsive and touch-first, and avoid anything that assumes a desktop browser. Treat the store build as a deliberate later phase; do not add native tooling now, just do not make choices that would block it.

## Accessibility and type

Hebrew and Aramaic render right to left in Hebrew characters. The owner reads on a phone and prefers large type, so default font sizes large and give an in-app control to grow them, with the Hebrew size adjustable on its own. Respect reduced-motion settings. Meet WCAG AA contrast.
