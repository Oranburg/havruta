# Prompt 03: The visual daf, the classic page image

Read first: `docs/SOURCES.md` and `docs/VOICE.md`.

## Task

Show the classic printed page of the daf, the Vilna tzurat hadaf, as an image the reader can enlarge, alongside the text view from prompt 02.

## What to build

For the current daf, call Sefaria's manuscripts endpoint described in `docs/SOURCES.md`. Read the returned `image_url` values rather than building the URL yourself; use the URL pattern only as a fallback when the API returns nothing.

Display the Romm Vilna pressing image by default, because that is the page layout used in study, with the Gemara in the center and Rashi and Tosafot around it. The page is dense, so on a phone the reader must be able to pinch to zoom and pan, or tap to open a full-screen zoomable view. Make the zoom smooth on touch.

Offer a toggle among the available images the API returned for this daf (Vilna by default, then the Bomberg Venice 1523 first printed edition and the Munich 1342 manuscript when present). Show the edition name and date as a caption under the image, because these are historical sources that deserve the credit.

Give the reader a way to switch between the visual page and the text view, or to see both, depending on screen size. On a phone, a tab or a swipe between "Page" and "Text" is enough. Each amud has its own image; let the reader see the image for the amud they are reading.

Handle a missing image for a given daf gracefully: some dapim may lack one edition; fall back to another, and if none exist, show the text view with a plain note.

## Acceptance criteria

Today's daf shows its real Vilna page image from Sefaria. The reader can zoom and pan it smoothly on a phone. The edition toggle works and the caption names the edition and date. Switching between page and text is easy on a small screen. A daf with no image for one edition falls back without breaking.

## Constraints

Images come only from the Sefaria manuscripts API. Do not host or generate page images. Follow `docs/VOICE.md` for captions and controls. Keep the image attribution visible.
