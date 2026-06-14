# Wiki staging folder

This folder stages the GitHub wiki content for the Havruta repository.

GitHub wiki pages cannot be created programmatically via the API. The wiki for a repository must be initialized once by hand: visit https://github.com/Oranburg/havruta/wiki and create the first page (call it "Home" and save any content). After that one-time step, the wiki has its own git repository at `https://github.com/Oranburg/havruta.wiki.git`, and `scripts/push-wiki.sh` can publish all pages in this folder to it.

Run the push script from the repo root:

```
bash scripts/push-wiki.sh
```

The script clones the wiki repo into a temporary directory, copies every `wiki/*.md` file into it, commits, and pushes to the `master` branch. If the clone fails, the script will tell you to initialize the wiki in the GitHub web UI first.

## Files in this folder

- `Home.md`: the wiki home page
- `Roadmap.md`: the project arc and phases
- `Status.md`: built and live, in this version, deferred
- `Architecture.md`: stack, layout, partner design, deploy, how to add a page
- `Transliteration-Schemes.md`: the shipped scheme and the plan for multiple scheme support
- `_Sidebar.md`: the GitHub wiki sidebar navigation
