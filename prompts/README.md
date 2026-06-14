# Build prompts

These are the tasks you hand to GitHub's coding agent, one at a time, in order. Each prompt builds one feature as one pull request. Review and merge each before starting the next, because later prompts assume the earlier ones landed.

## How to hand a prompt to the agent

Open a new issue in this repository. Paste one prompt file's contents as the issue body. Assign the issue to GitHub Copilot (the coding agent). It opens a pull request that implements the task. Read the pull request, ask for changes in the PR comments if needed, then merge. Move to the next prompt.

Every prompt assumes the agent has read the `docs/` folder first. The first line of each prompt says which docs matter for that task. The docs are the source of truth; when a prompt is silent on a detail, the docs decide it, and `docs/CONSTITUTION.md` overrides everything when there is a conflict.

## The order and what each one adds

1. `01-scaffold.md` sets up the React and Vite Progressive Web App and the Vercel deploy.
2. `02-daf-text.md` loads and shows the day's daf text from Sefaria.
3. `03-visual-daf.md` adds the classic Vilna page image with zoom.
4. `04-study-flow.md` builds the study screen and the rule that you write your reading before the partner is reachable.
5. `05-auth.md` adds Google sign-in restricted to the owner.
6. `06-partner-engine.md` adds the server proxy and the challenging study partner.
7. `07-session-record.md` saves every session on the device and exports it.
8. `08-shas-progress.md` tracks the march through the whole Talmud.
9. `09-calibration.md` adds the dial that sets how hard the partner pushes.
10. `10-bring-your-own-key.md` lets other people use the app with their own key (a bonus, not the goal).
11. `11-pwa-polish.md` finishes offline use, install, accessibility, and large type.

## A standing rule for every prompt

The app never invents sacred text. All Talmud, Bible, and commentary text and all page images come from Sefaria at runtime. The partner quotes only the text it was handed. This is the whole point of the project and it is not negotiable in any feature.
