#!/usr/bin/env bash
# voice-check: skip
set -e

WIKI_REPO="https://github.com/Oranburg/havruta.wiki.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WIKI_SOURCE="$REPO_ROOT/wiki"
TMPDIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

echo "Cloning wiki repo into $TMPDIR ..."
if ! git clone "$WIKI_REPO" "$TMPDIR/wiki" 2>&1; then
  echo ""
  echo "ERROR: Could not clone the wiki repository."
  echo ""
  echo "The GitHub wiki must be initialized once by hand before this script"
  echo "can publish to it. Visit:"
  echo ""
  echo "  https://github.com/Oranburg/havruta/wiki"
  echo ""
  echo "Create a first page (name it 'Home', save any content), then re-run"
  echo "this script."
  exit 1
fi

echo "Copying wiki pages ..."
cp "$WIKI_SOURCE"/*.md "$TMPDIR/wiki/"

cd "$TMPDIR/wiki"

git add -A

if git diff --cached --quiet; then
  echo "No changes to publish. Wiki is already up to date."
  exit 0
fi

COMMIT_DATE="$(date -u '+%Y-%m-%d %H:%M UTC')"
git commit -m "Publish wiki pages from havruta/wiki/ ($COMMIT_DATE)"

echo "Pushing to $WIKI_REPO ..."
git push origin master

echo ""
echo "Done. Visit https://github.com/Oranburg/havruta/wiki to see the result."
