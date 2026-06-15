# Architecture

This document fixes the stack and the constraints so the app stays one coherent thing. Where a choice is open, this document answers it.

## The three hard constraints

The owner uses this on a phone, away from a laptop, so the whole study flow has to work in a mobile browser with nothing else running. The owner pays for the AI usage, so the public must never be able to spend the owner's credits; this is now guaranteed because the key lives only ever in the owner's own browser, and there is no server that could leak it. The app must never invent a sacred text, so all primary text and page images come from Sefaria at runtime, and the partner quotes only the daf it was handed or what a Sefaria tool returns.

## Shape of the system

The app is a static Progressive Web App served from GitHub Pages. There is no backend. The frontend talks to Sefaria for text, images, commentaries, links, search, and the lexicons, and it talks to one AI provider's API directly from the browser using the reader's own key.

The frontend is a React app built with Vite, designed mobile-first and installable as a PWA, so it gets a home-screen icon on the phone and caches studied pages for offline reading. Sefaria's API is open and needs no key. The AI provider's API does need a key, and that key is the reader's own.

## Hosting and deploy

The whole app is static and deploys to GitHub Pages from a GitHub Actions workflow (`.github/workflows/deploy.yml`). The Pages source is set to GitHub Actions. The workflow runs `npm ci`, `npm run build`, and `npm run smoke`, then publishes the `dist/` folder to Pages on every push to `main`. The Vite config sets `base: '/havruta/'`, so the site lives under the `/havruta/` path; the live URL is https://oranburg.law/havruta/ on a custom domain pointed at the GitHub Pages endpoint. Because the router is HashRouter, all client-side routes work without a server rewrite rule.

GitHub Pages fits because the app holds no secret and runs no server code. The earlier plan put the app on Vercel with a server proxy to hide an Anthropic key; that plan is abandoned. Moving the key into the reader's own browser removed the reason for a server, and removing the server removed the only place a key could leak. A server proxy (on Vercel or elsewhere) remains possible as a future upgrade if the app ever wants to offer the partner without a key for trusted accounts; it is not part of the current design.

## The in-browser, bring-your-own-key partner

The reader supplies an API key for one provider in Settings. The key is stored only in that reader's browser (localStorage) and is read straight into the request; it never travels to any server, because there is no server.

Two wire protocols cover every supported provider, dispatched by the provider's protocol field:

- `anthropic`: the Anthropic Messages API, for Claude.
- `openai`: the OpenAI-compatible Chat Completions API, which also covers OpenAI (GPT), Google (Gemini) through its compatibility endpoint, OpenRouter, and a custom endpoint.

`src/lib/providers.js` is the registry: each provider names its protocol, a default base URL, a default model, a key hint, and where the reader gets a key. The default model strings are editable in Settings, because a provider can rename or retire a model at any time.

There is a free path: Google Gemini has a free tier, so a reader can study with the partner without paying. A newcomer with no key set is steered to that free option. Credit protection is now simple and automatic. The owner's key, if the owner uses one, lives only in the owner's browser. A visitor either brings their own key and pays their own way, or studies the text and the page without the partner. Neither path can reach the owner's credits, because the owner's key is never anywhere a visitor can see it.

## The Sefaria tool-use loop

The partner can search Sefaria during a turn. `src/lib/sefariaTools.js` defines four tools and the adapters that present them to each protocol:

- `sefaria_links`: the curated cross-references for a line (parallel Talmud, cited Tanakh, commentaries, halakhah, Kabbalah, midrash).
- `sefaria_text`: any reference, verbatim.
- `sefaria_search`: full-text search of the library.
- `sefaria_lexicon`: the dictionaries (Jastrow, BDB, Klein).

The tools reach only Sefaria. There is no open-web tool, so the partner cannot pull non-canonical sources, and it quotes only what a tool returns or the daf it was handed, never from memory. The partner follows a priority cascade that mirrors how a study partner works: parallel Talmud first, then Chumash and the rest of Tanakh, then mystical sources, gematria, and philology when they bear on the line.

## How the partner is called

`src/lib/anthropic.js` holds `streamPartner`, the multi-provider streaming tool-call loop for both protocols. It takes the verbatim Sefaria text the app handed in, the reader's own reading, the running exchange, the system prompt and provider settings from `src/lib/partner.js`, and the reader's key. It streams the provider's reply; when the model asks for a tool, the loop runs that call against Sefaria, feeds the verbatim result back, and continues until the model answers. If a provider rejects tools, the loop falls back to answering without them. A malformed stream line or a failed tool call never becomes invented text, so the never-invent rule of `docs/CONSTITUTION.md` holds across both protocols.

Because the primary text travels from Sefaria through the app into the request as data, the partner challenges a real text it was handed rather than reciting a text from memory.

## Line-by-line engagement and the synthesis partner

Engagement happens line by line. Each Sefaria segment of the daf is interactive. Under any line the reader opens "Discuss this line," writes one sentence saying what the line is doing (the human-acts-first gate, now at the line), and the partner challenges that reading with the line's own words. `src/components/LineHavruta.jsx` runs this exchange; `src/lib/usePartnerConversation.js` is the shared conversation hook used by both the line partner and the page partner.

At the end of the daf there is a whole-page reading box. When the reader has taken up lines through the day, that box becomes the synthesis partner: it reads a digest of the day's line exchanges (assembled with `listLineSessionsForDaf` from `src/lib/sessions.js`) and helps the reader assemble the sugya, say it back, reconcile the tensions across the reader's own line readings, map the structure, then press, closing by helping the reader write three sentences to keep. This behavior is grounded in GitHub issue #8.

## State and the study record

The study record stays on the device. The browser's local storage holds the daf, the reader's readings, the line exchanges, and the synthesis. `src/lib/sessions.js` saves and retrieves sessions and lists the line sessions for a daf. `src/lib/exportMarkdown.js` turns any exchange into a Markdown file the reader downloads ("Download this chat" in the partner panels, "Download Markdown" in the Archive). The record is never sent to any server and never committed to the repository; `.gitignore` blocks any session export. Cross-device sync, if ever wanted, is a deliberate later feature with its own privacy decision, not a default.

## Caching and offline

Fetched daf text and page images are cached after first load, so a studied page reopens with no network and works on a plane. The app shell and the last studied pages are available offline. A live AI exchange needs the network, which is expected.

## Where text and images come from

All primary text and images come from Sefaria at runtime. `src/lib/sefaria.js` is the verified Sefaria client: today's daf from the calendar endpoint, bilingual text, the Vilna page image from the manuscripts API, commentaries and connections, `getLinksForRef` for the per-line cross-references, and `searchSefaria` for full-text search (a POST to `/api/search-wrapper`). The verified endpoints and caching rules are in `docs/SOURCES.md`.

## Future: a native app in the stores

The owner may want this in the App Store and Play Store one day. Building it as a clean PWA keeps that path open without a rewrite. A PWA can later be wrapped with Capacitor, which takes the existing web build and produces native iOS and Android projects you open in Xcode and Android Studio and submit to the stores. To keep that path easy, hold the frontend to standard web APIs, keep the app fully responsive and touch-first, and avoid anything that assumes a desktop browser. Treat the store build as a deliberate later phase; do not add native tooling now, just do not make choices that would block it.

## Accessibility and type

Hebrew and Aramaic render right to left in Hebrew characters. The owner reads on a phone and prefers large type, so default font sizes large and give an in-app control to grow them, with the Hebrew size adjustable on its own. Respect reduced-motion settings. Meet WCAG AA contrast. `src/components/Mermaid.jsx` renders the diagrams on the content pages, with `securityLevel` set to `loose` so the diagrams render inline.

## Key modules

- `src/lib/sefaria.js`: the verified Sefaria client, including `searchSefaria` (POST `/api/search-wrapper`) and `getLinksForRef`.
- `src/lib/sefariaTools.js`: the four Sefaria tools and the per-protocol adapters.
- `src/lib/anthropic.js`: `streamPartner`, the multi-provider streaming tool-loop.
- `src/lib/partner.js`: the prompts and the provider settings.
- `src/lib/providers.js`: the provider registry (two protocols, default base URLs and models).
- `src/lib/usePartnerConversation.js`: the shared conversation hook used by the line and page partners.
- `src/lib/transliterate.js`: the single Shofar-chart transliteration engine.
- `src/lib/sessions.js`: the study record, including `listLineSessionsForDaf`.
- `src/lib/exportMarkdown.js`: the Markdown export of an exchange.
- `src/lib/shas.js`: the whole-Shas tractate and daf map.
- `src/components/Mermaid.jsx`: the diagram renderer (`securityLevel` `loose`).
