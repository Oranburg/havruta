# Prompt 01: Scaffold the app and deploy

Read first: `docs/ARCHITECTURE.md` and `docs/VOICE.md`.

## Task

Create a mobile-first Progressive Web App using React, Vite, and TypeScript, and set it up to deploy to Vercel automatically on every push to `main`.

## What to build

Set up a React and Vite TypeScript project in this repository. Make it a Progressive Web App: add a web app manifest, a service worker, and app icons, so it installs to a phone home screen and a laptop. Design mobile-first; the primary device is a phone held in one hand.

Add client-side routing with at least a home route that will become the day's study screen and a route for a session archive. Use a routing approach that survives a hard refresh on the deployed host.

Create the page shell: a simple header with the app name (Havruta), a main content area, and room for a bottom area that will hold study controls on a phone. Set base typography large, with a readable serif or a clean sans, and support right-to-left text in a content area (Hebrew and Aramaic come later, but the layout must already allow it). Add a light and dark mode that follows the system setting.

Configure Vercel deployment from this repo: the static frontend and serverless functions (functions arrive in a later prompt) build and deploy together on push to `main`. Add a short `DEPLOY.md` that records the exact steps the owner takes once in the Vercel dashboard and the environment variables that later prompts will need.

## Acceptance criteria

The app builds with no errors. It deploys to a public Vercel URL on push to `main`. On a phone, it installs to the home screen and opens full screen. The home route shows a placeholder that reads as the day's study screen to come. Routing works after a hard refresh. Light and dark mode both look right. No console errors on load.

## Constraints

Follow `docs/VOICE.md` for every word the user sees. Keep dependencies lean. Do not add a backend or any API key yet. Do not invent any Talmud content; the placeholder text is plain interface copy.
