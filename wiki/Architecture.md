# Architecture

A practical developer guide to the Havruta codebase.

## Stack

| Layer | Choice |
|-------|--------|
| UI framework | React 18 |
| Build tool | Vite |
| Styling | Tailwind CSS with CSS custom properties for the design token layer |
| Routing | react-router-dom with HashRouter (required for GitHub Pages) |
| Rich pages | MDX (for `/start`, `/learn`, `/terms`, `/journey`, `/why`, `/find`) |
| Diagrams | Mermaid, rendered via a custom `<Mermaid>` component |
| Icons | lucide-react |
| PWA | vite-plugin-pwa |
| Deploy | GitHub Pages under the `/havruta/` base path, via a GitHub Actions workflow |

The base URL is `/havruta/`. The HashRouter means all navigation is handled client-side with hash fragments, so GitHub Pages never needs to serve a path that does not exist as a file.

## Folder layout

```
src/
  pages/          React page components and their MDX content files
  components/     Shared UI components
  lib/            Data-fetching and business logic
public/           Static assets deployed as-is (images that are live on a page)
assets/images/    Image library (stock/ for undeployed; move to public/ when a page uses one)
docs/             Specifications and design documents (not deployed)
prompts/          Copilot mega-prompts used to build each phase
scripts/          Build helpers and the wiki push script
```

Key files inside `src/lib/`:

- `sefaria.js`: the verified Sefaria client. Today's daf from the calendar endpoint, bilingual text, manuscripts, commentaries and connections, `getLinksForRef` for per-line cross-references, and `searchSefaria` (POST `/api/search-wrapper`) for full-text search
- `sefariaTools.js`: the four Sefaria tools the partner can call (`sefaria_links`, `sefaria_text`, `sefaria_search`, `sefaria_lexicon`) and the per-protocol adapters
- `anthropic.js`: `streamPartner`, the multi-provider streaming tool-call loop for both wire protocols
- `partner.js`: the system prompts (`buildSystemPrompt`, `buildSynthesisSystemPrompt`, and the first-message builders) and provider settings
- `providers.js`: the provider registry (two protocols; Claude, GPT, Gemini, OpenRouter, custom endpoint)
- `usePartnerConversation.js`: the shared conversation hook used by the line partner and the page partner
- `transliterate.js`: the rule-based transliteration engine, following the Shofar magazine consonant chart
- `sessions.js`: saves and retrieves study sessions from localStorage, including `listLineSessionsForDaf`
- `exportMarkdown.js`: turns an exchange into a Markdown file the reader downloads
- `shas.js`: the whole-Shas tractate and daf map

## How the study partner works

The partner runs entirely in the reader's browser. No study exchange travels through any server the owner controls.

When a reader provides a key (or uses the free Gemini path), the app calls the selected provider's API directly from the browser, using that reader's own credentials. The owner's credits are never at risk from a public visitor.

The system prompt, defined in `docs/PARTNER-PROMPT.md` and loaded into `src/lib/partner.js`, enforces the core rules from `docs/CONSTITUTION.md`:

1. The human acts first. The partner panel is locked until the reader submits a reading.
2. The partner challenges rather than confirms. It finds the weakness in the reading, not praise for it.
3. The partner never invents sacred text. It quotes only what Sefaria supplied in the current session, or says nothing.
4. The partner never rules. It does not tell you what the halakha is or settle a machloket.
5. When a reading is sound, the partner acknowledges it and presses the next layer.

The verbatim Sefaria text for the current daf travels with every request, so the partner challenges a real text it was handed, not a text it recalled from training.

`src/lib/anthropic.js` holds `streamPartner`, the streaming client for both wire protocols (the Anthropic Messages API and the OpenAI-compatible Chat Completions API, which also covers GPT, Gemini, OpenRouter, and a custom endpoint). It is a tool-call loop: when the model asks for a Sefaria tool, the loop runs that call against Sefaria, feeds the verbatim result back, and continues until the model answers. The four tools are in `src/lib/sefariaTools.js` (cross-references for a line, any reference verbatim, full-text search, and the lexicons). The tools reach only Sefaria, so the partner cannot pull non-canonical sources, and it quotes only what a tool returns or the daf it was handed. If a provider rejects tools, the loop falls back to answering without them.

## Line-by-line engagement and the synthesis partner

Engagement happens line by line. Each Sefaria segment is interactive: under any line the reader opens "Discuss this line," commits a one-sentence reading (the human-acts-first gate, now at the line), and the partner challenges it with the line's own words. `src/components/LineHavruta.jsx` runs this; `src/lib/usePartnerConversation.js` is the shared conversation hook used by both the line partner and the page partner.

At the end of the daf, the whole-page reading box becomes the synthesis partner when the reader has taken up lines. It reads a digest of the day's line exchanges (`listLineSessionsForDaf` in `src/lib/sessions.js`) and helps the reader assemble the sugya: say it back, reconcile tensions across the reader's own readings, map the structure, then press, closing by helping the reader write three sentences to keep. Grounded in GitHub issue #8.

## Where text and images come from

All primary text and images come from Sefaria at runtime. The app never stores or ships Talmud text.

**Today's daf:** `https://www.sefaria.org/api/calendars` with the reader's local date. The `Daf Yomi` entry in the response gives the ref (for example `Chullin 44`).

**Bilingual text:** `https://www.sefaria.org/api/texts/{tref}` returns `he` (Hebrew/Aramaic) and `text` (English) as parallel segment arrays, plus `next` and `prev` refs for navigation.

**Page images:** `https://www.sefaria.org/api/manuscripts/{tref}` returns an array of records. The Vilna Romm pressing is the default; the Bomberg Venice and Munich Manuscript 95 are available as alternatives. The `image_url` from the API response is used; the URL pattern is not hardcoded.

**Commentaries and connections:** Sefaria's links API provides Rashi, Tosafot, and other commentaries, plus cited verses, halakhic codes, and parallel passages, all verbatim.

The verified endpoints and caching rules are documented in `docs/SOURCES.md`.

## Deploy

The app deploys to GitHub Pages automatically on every push to `main`.

The Vite config sets `base: '/havruta/'`. The Actions workflow (`.github/workflows/deploy.yml`) runs `npm ci`, `npm run build`, and `npm run smoke`, then uploads `dist/` as a Pages artifact and deploys it (the Pages source is set to GitHub Actions, not a `gh-pages` branch). The live URL is https://oranburg.law/havruta/ (a custom domain pointed at the GitHub Pages endpoint).

Because the router is HashRouter, all client-side routes work without a server rewrite rule. The PWA manifest and service worker are generated by vite-plugin-pwa into `dist/` at build time.

## How to add a new MDX page

Follow the pattern of the Why page (`src/pages/Why.jsx` and `src/pages/why-content.mdx`).

1. Create `src/pages/your-content.mdx` with the page prose, `<Mermaid caption="..." chart={\`...\`} />` elements for diagrams (not fenced code blocks), and `<LearnImage>` figures for captioned images in `public/`.
2. Create `src/pages/Your.jsx` as a thin wrapper that imports and renders the MDX content, wrapped in the standard page shell.
3. Add the route in `src/App.jsx` with `path="/your-path"` and `element={<Your />}`.
4. Add the link to the hamburger nav in `src/components/NavDrawer.jsx`.
5. If the page needs images, place them in `public/your-path/` and add entries to `assets/images/catalog.json`.

Images in `assets/images/stock/` are version-controlled but not deployed until a page uses them. Move a stock image into the appropriate `public/` subfolder when a page is ready to use it.
