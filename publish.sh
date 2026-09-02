#!/usr/bin/env bash
# One-shot publish: ./publish.sh <github-user> [repo-name]
# Needs: git, and either `gh` (GitHub CLI, logged in) or you create the empty repo on github.com first.
set -euo pipefail
USER="${1:?usage: ./publish.sh <github-user> [repo-name]}"
REPO="${2:-claude-plugins}"
cd "$(dirname "$0")"

# fill in the placeholder everywhere
grep -rl YOUR_GH_USER --exclude-dir=.git . | xargs sed -i.bak "s/YOUR_GH_USER/$USER/g" && find . -name '*.bak' -delete
git add -A && git commit -qm "chore: set owner to $USER" || true

if command -v gh >/dev/null 2>&1; then
  gh repo create "$USER/$REPO" --public --source=. --remote=origin --push
else
  echo "gh not found. Create an empty repo https://github.com/new named $REPO, then:"
  echo "  git remote add origin git@github.com:$USER/$REPO.git && git branch -M main && git push -u origin main"
  exit 0
fi

echo
echo "Published. In Claude Code:"
echo "  /plugin marketplace add $USER/$REPO"
echo "  /plugin install clean-forge@$REPO"
