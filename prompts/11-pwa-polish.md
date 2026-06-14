# Prompt 11: Offline, install, accessibility, and large type

Read first: `docs/ARCHITECTURE.md` (caching, accessibility, future native app) and `docs/VOICE.md`.

## Task

Finish the app as a daily tool a person actually reaches for on a phone: it installs cleanly, the studied pages work offline, the type is large and adjustable, and it reads well for Hebrew and for accessibility. Keep it ready to wrap as a native app later.

## What to build

Make the install solid: a proper manifest, icons at the sizes phones want, a splash and theme color, and an in-app prompt that invites the owner to add it to the home screen.

Cache for offline: after a daf is fetched, keep its text and its page image on the device so reopening that daf needs no network and works on a plane. Cache the app shell and the recent dapim. The live partner exchange needs the network, which is expected; show a calm offline state when the partner is unreachable.

Type and reading: default font sizes large, with an in-app control to grow them further, and a separate control for Hebrew size. Hebrew and Aramaic stay right to left in Hebrew characters. Pick a Hebrew typeface that is clear at large sizes on a phone.

Accessibility: meet WCAG AA contrast in light and dark mode, respect the reduced-motion setting, label controls for screen readers, and make the whole study flow reachable by keyboard and by touch.

Keep the native path open: hold to standard web APIs and stay fully responsive and touch-first, so the app can later be wrapped with Capacitor into iOS and Android projects for the stores. Do not add native tooling now; just avoid choices that would block it. Note the wrap steps briefly in `DEPLOY.md` for the future.

## Acceptance criteria

The app installs to a phone home screen with correct icons and opens full screen. A daf studied once reopens offline with its text and page image. Font size and Hebrew size controls work and start large. Contrast meets AA in both modes, reduced motion is respected, and the study flow works by keyboard and screen reader. Nothing in the build blocks a later Capacitor wrap.

## Constraints

Follow `docs/VOICE.md`, including no tool fingerprints anywhere the user can see. Offline must never show invented text in place of a missing fetch; show a calm offline state instead.
