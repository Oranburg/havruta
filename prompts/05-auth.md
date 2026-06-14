# Prompt 05: Google sign-in, restricted to the owner

Read first: `docs/ARCHITECTURE.md` (the authentication section) and `docs/VOICE.md`.

## Task

Add Google sign-in and restrict the app to the owner's account, so that only the owner can reach the parts of the app that will spend the owner's Claude credits.

## What to build

Add authentication with Auth.js (NextAuth) using the Google provider, running in the Vercel serverless functions for this project. On successful Google sign-in, check the account's email against an allowlist held in the `ALLOWED_EMAILS` environment variable (a comma-separated list). Grant a session only to an allowlisted account. A signed-in account that is not on the allowlist gets a clear, calm screen telling them they can use their own key instead (the own-key mode comes in prompt 10) or read the daf and page without the partner.

Reading the daf text and the page image stays open to everyone, because that content is free from Sefaria and costs the owner nothing. The protected boundary is the partner: the next prompt's server proxy must require a valid allowlisted session before it touches the Claude key.

Persist the session so the owner signs in once on the phone and stays signed in, which matters because the whole point is to use this away from a laptop without fuss.

Record in `DEPLOY.md` the environment variables this needs (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `ALLOWED_EMAILS`) and the one-time Google Cloud console steps to create the OAuth client, including the exact redirect URL for the Vercel domain.

## Acceptance criteria

The owner can sign in with Google on a phone and stays signed in. An allowlisted account reaches the protected area; a non-allowlisted account does not and sees a calm explanation. The daf text and page image remain readable without signing in. No secret value appears in the client bundle or the repository. `DEPLOY.md` lists every variable and the Google console steps.

## Constraints

Secrets live only in Vercel environment variables, never in the repo. Follow `docs/VOICE.md` for the sign-in and rejection copy. Keep the allowlist server-side; a client-side email check is not protection.
