# Prompt 10: Let others use their own key (a bonus)

Read first: `docs/ARCHITECTURE.md` (the two-ways-to-reach-the-partner section).

## Task

Let any visitor use the study partner with their own Anthropic API key, paid for and stored by them, without ever touching the owner's server or credits. This is a welcome extra, not the project goal, so build it only after the owner's path works end to end.

## What to build

Add an option for a visitor who is not the owner to paste their own Anthropic API key. Store that key only in the visitor's own browser, and use it to call the Claude API directly from the visitor's browser, with the header that permits direct browser access. A visitor in this mode spends their own credits.

This mode must never route through the owner's server proxy or the owner's key. Gate it so it cannot fall back to the server path: the server proxy stays restricted to the allowlisted owner, and the bring-your-own-key path is a separate client-side call that uses only the visitor's key. The same study partner behavior applies: it uses the system prompt from `docs/PARTNER-PROMPT.md`, challenges rather than rules, and quotes only the supplied Sefaria text.

Make plain to the visitor that their key stays in their own browser and is used only to talk to Claude directly. Give them a way to clear it.

## Acceptance criteria

A visitor who is not the owner can paste their own key and use the partner, with their key stored only in their browser and used for direct browser calls to Claude. This path never reaches the owner's server or key. The owner's credits cannot be spent by anyone but the owner. The visitor can clear their key. The partner behaves the same as for the owner.

## Constraints

Protecting the owner's credits comes first; if this mode cannot be made safe against falling back to the server key, do not ship it. Follow `docs/CONSTITUTION.md` and `docs/VOICE.md`.
