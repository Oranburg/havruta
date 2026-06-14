# Vision

## What this is

Havruta is a daily Talmud study companion that argues with you. It follows the daf yomi calendar through the whole Babylonian Talmud, puts the real page and the real text in front of you, and gives you a study partner that challenges your reading instead of handing you an answer. The partner is the Silicon Havruta described in Seth Oranburg's *Judgment Proof*, Chapter 13: a machine built to interrogate rather than to deliver, so that the friction of defending your reading is what builds your understanding.

## Who it is for

The first reader is Seth: a curious adult who knows the alphabet, reads parsha sometimes, and looks things up, studying on a phone away from a desk. The design meets that reader and rises with him. Past that first reader, the same tool serves anyone on the daf yomi cycle who wants more than a translation: students who want to be pushed, groups who want to study together, learners in any language who want the page opened at the level of help they actually need.

## A bridge, not a replacement

The best place to learn the daf is a real beit midrash, with a partner across the table and a room full of voices. Not everyone can be there. Distance, time, health, and where life has put a person all keep people from the hall. People learn the daf in many ways now: in person, together on a video call, and alone on a phone in spare minutes. This app is for the ones who cannot get to the hall, and it does not claim to replace it. The hope is that it is a bridge. Studying this way keeps a person in the daf, and G-d willing it leads some of them toward the real thing, an in-person chevruta and a hall full of argument. The app should always point toward that, never pretend to be it.

## The principles that do not change

The partner never invents a sacred text. It quotes what Sefaria supplies or it says nothing. This is the whole point of building the havruta rather than the oracle, and it is the safeguard against the failure that opens Chapter 13, where a machine confirmed six citations and five did not exist.

The human acts first. You write your own reading before the partner speaks, because acting first builds judgment and receiving first wears it away.

The reading is open to everyone. The text and the page come free from Sefaria, so reading the daf needs no account and no key. The partner and the personal features sit behind a sign-in, because they cost compute that someone has to pay for.

The owner's costs are protected. A public visitor can read freely or bring their own key, and neither path can spend the owner's credits.

It stays free and open source. The code lives in the open on GitHub, and the project relies on Sefaria's free texts, so the project gives back by staying free. The licensing terms in `docs/LICENSING.md` shape what "free" has to mean.

## The long shape

The app starts as a single reader studying one page a day with one AI partner. It is built to grow into a place where people study together. The arc runs from one person, to a pair, to a room.

Layered guidance. The page carries Hebrew, Aramaic, Rashi, Onkelos, and more. A reader sets how much help they want, from a light gloss to a full walk through the grammar, and the partner and the interface meet that setting. Sefaria's link graph connects each line to its commentaries, parallels, and codes, so the page opens outward.

Any language. The partner can study in the reader's own language. A reader sets their language when they connect their AI, and the partner teaches the Aramaic page in English, Hebrew, Spanish, French, or whatever the reader reads best.

Study together. The traditional havruta is two people and a text. The app grows toward that: study rooms where more than one person learns the same daf with the AI partner in the room, both at the same time and across time zones, with discussion anchored to the lines of the page the way social annotation works on e-learning platforms. The record of a room's argument becomes part of what the next reader can learn from.

A real app. The web app is built so it can later be compiled into native iOS and Android apps for the stores, without a rewrite.

## How it gets built

Seth is the architect and writes the plan. GitHub's coding agent builds the features from large, specific prompts, one substantial prompt at a time, against the specifications in this repository. The roadmap in `docs/ROADMAP.md` turns the vision into an order of work and into the prompts to hand the agent. The aim is a working core within reach quickly, then steady growth across many features without losing the principles above.
