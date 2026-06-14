# Deploy

How to run Havruta locally and how to deploy it on Vercel. This foundation is the static frontend only. Sign-in and the Claude partner come in later prompts; the environment variables they need are listed at the end so the deploy is ready for them.

## Run locally

You need Node 18 or newer.

```sh
npm install
npm run dev
```

Vite prints a local URL (usually http://localhost:5173). Open it in a browser. The app reads today's daf from Sefaria, so the dev machine needs internet access for the study screen to load text and the page image.

To check the production build:

```sh
npm run build
npm run preview
```

`npm run build` writes the static site to `dist/`. `npm run preview` serves that build so you can confirm it works before deploying.

## Deploy on Vercel

1. Push the repository to GitHub as `Oranburg/havruta`.
2. In Vercel, choose Add New, then Project, and import the `Oranburg/havruta` repository.
3. Vercel detects the framework preset as Vite. Leave the build command as `npm run build` and the output directory as `dist`.
4. This foundation needs no environment variables, so deploy with the defaults.
5. Vercel builds and gives a stable HTTPS URL. Open that URL on your phone and use the browser's Add to Home Screen to install it as an app. The icons and the manifest are already in place.

Every push to `main` deploys automatically.

The app uses HashRouter, so routes live after the `#` in the URL and Vercel needs no SPA rewrite rule for them to work.

## Environment variables (coming later)

The partner and sign-in are not in this foundation. When they arrive, set these in Vercel's project settings, never in the repository:

- `ANTHROPIC_API_KEY` is the server-side key for the Claude proxy. It stays on the server and never reaches the browser.
- `AUTH_GOOGLE_ID` is the Google OAuth client ID from the Google Cloud console.
- `AUTH_GOOGLE_SECRET` is the matching Google OAuth client secret.
- `AUTH_SECRET` is the session-signing secret for Auth.js.
- `ALLOWED_EMAILS` is the allowlist of accounts permitted past sign-in, so the public cannot spend the owner's Claude credits.

## Regenerating the icons

The PWA icons are committed under `public/icons/`. To rebuild them from the brand colors:

```sh
python3 scripts/make_icons.py
```

This needs Pillow installed (`pip install Pillow`).
