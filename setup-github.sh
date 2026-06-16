#!/usr/bin/env bash
#
# Creates a PRIVATE GitHub repo and pushes the existing local commit.
# Run this ONCE, from inside the project folder, on your Mac (gh must be logged in).
#
#   chmod +x setup-github.sh
#   ./setup-github.sh
#
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────
REPO_NAME="mattborowczyk-portfolio"   # change if you want a different name
VISIBILITY="--private"                # use "--public" to make it public
# ──────────────────────────────────────────────────────────────────────────

cd "$(dirname "$0")"

# Clear any stale lock/temp files left by the sandbox mount (harmless if absent).
rm -f .git/HEAD.lock .git/index.lock 2>/dev/null || true
find .git/objects -name 'tmp_obj_*' -delete 2>/dev/null || true

echo "▶ Checking GitHub auth..."
gh auth status

# Commit any pending work (e.g. ROADMAP.md and these scripts) before pushing.
if [ -n "$(git status --porcelain)" ]; then
  echo "▶ Committing pending changes..."
  git add -A
  git commit -m "Add technical roadmap and GitHub setup/issues scripts"
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "▶ 'origin' already set ($(git remote get-url origin)) — pushing instead."
  git push -u origin main
else
  echo "▶ Creating repo '$REPO_NAME' ($VISIBILITY) and pushing..."
  gh repo create "$REPO_NAME" $VISIBILITY --source=. --remote=origin --push
fi

echo "✅ Done. Repo:"
gh repo view --web >/dev/null 2>&1 || true
gh repo view "$REPO_NAME" --json url -q .url 2>/dev/null || git remote get-url origin
echo
echo "Next: run ./create-issues.sh to populate the issue tracker."
