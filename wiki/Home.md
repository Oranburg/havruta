# Havruta Daf Yomi

Havruta is a daily Talmud study companion that argues with you. It follows the daf yomi calendar through the entire Babylonian Talmud, puts the real page and the real text in front of you, and gives you a study partner that challenges your reading instead of handing you an answer. The partner is the Silicon Havruta described in Seth C. Oranburg's *Judgment Proof*, Chapter 13: a machine built to interrogate rather than deliver, so that the friction of defending your reading is what builds your understanding. The app is a bridge toward the beit midrash, not a replacement for it. The best place to learn the daf is in a real beit midrash with a partner across the table. Not everyone can be there. This app is for the ones who cannot get to the hall yet, and it should always point toward that, never pretend to be it.

**Live at:** https://oranburg.law/havruta/

## What it does today

Today's daf from the Sefaria calendar, with the text in Hebrew and Aramaic and English and the Vilna page image. Study runs line by line: under any line you write one sentence on what the line is doing, and only then does the partner challenge it. The partner runs in your own browser with your own API key, searches Sefaria through its tools, and never invents a text. When you have worked lines, the closing box becomes a synthesis partner that helps you assemble the sugya. The page also gives you tappable Hebrew words with the Sefaria lexicon, a Compare-translations panel, commentaries and connections verbatim from Sefaria, word-over-word transliteration, and a read-aloud control that uses the browser's speech synthesis on a Hebrew voice when one is available. Your record saves on your device, the whole-Shas map tracks your progress, and the app installs and reads offline. The build shell is Astro, with the React app mounting as a client-only island and the content pages authored in MDX.

## The stack

Havruta is built as an Astro static site with the React study app mounted inside it as a single client-only island. Astro runs Vite underneath, and MDX is preserved through `@mdx-js/rollup` for the content pages. It is a progressive web app: it installs, reads previously studied pages offline, and self-heals its service worker so a stale precache does not blank the screen. It deploys to GitHub Pages under `/havruta/`. The partner runs client-side with the reader's own key; there is no server. A path to the Apple and Android app stores, wrapping the PWA or rebuilding the shell, is tracked as an open issue. Aligning the app with the shared Oranburg design system and a breadcrumb home is also tracked as an open issue; the footer carries a link home to oranburg.law today.

## Credits

- Concept and architecture: Seth C. Oranburg, as developed in *Judgment Proof* (Judgment Proof Press)
- Talmud text, page images, commentaries, and connections: [Sefaria](https://www.sefaria.org/), via its open API
- William Davidson vocalized Talmud text: William Davidson Talmud, distributed by Sefaria and Koren Publishers Jerusalem
- Daf images: Romm Vilna Talmud (1880-1886 pressing), hosted by Sefaria; Bomberg Venice pressing (1523) and Munich Manuscript 95 (1342) also available via the manuscripts API
- Historical image research: [National Library of Israel](https://www.nli.org.il/)

## Pages in this wiki

- [Roadmap](Roadmap): the arc from alone, to with help, to with others, to in person; the phases; the full page set
- [Status](Status): what is built and live, what is in the current version, what is deferred
- [Architecture](Architecture): stack, folder layout, study partner, text sources, deploy, and how to add a page
- [Transliteration Schemes](Transliteration-Schemes): the shipped Sephardi academic scheme and the plan for multiple scheme support
- [Synthesis Partner](Synthesis-Partner): the closing havruta that reads the day's line work and helps assemble the sugya

The dated final-state record and the milestone history live in the repository: `docs/STATUS.md` and `CHANGELOG.md`.
