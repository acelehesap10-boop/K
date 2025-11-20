#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/push-changes-and-create-branch.sh "Commit message here"
# This script: ensures git-lfs is present, stages all changes, commits,
# creates a branch named system-updates-<date>-<short-branch> and pushes it to origin.

MSG=${1:-"Apply system updates: metrics, telemetry, CORS, infra & docs"}
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Check git
if ! command -v git >/dev/null 2>&1; then
  echo "git not found on PATH. Install git and retry." >&2
  exit 1
fi

# Check git-lfs, warn but continue if not installed
if ! command -v git-lfs >/dev/null 2>&1; then
  echo "Warning: git-lfs not found. If this repository uses LFS you should install it to avoid push errors." >&2
  echo "Install: sudo apt-get install git-lfs && git lfs install" >&2
else
  git lfs install --local || true
fi

# Show status
echo "Git status (before):"
git status --porcelain

# Stage and commit
git add -A
if git diff --cached --quiet; then
  echo "No staged changes after git add -A; nothing to commit." >&2
else
  git commit -m "$MSG"
  echo "Committed changes: $MSG"
fi

# Determine branch name
DATE=$(date +%Y%m%d)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD || echo "unknown-branch")
SAFE_BRANCH_NAME="system-updates-${DATE}-${CURRENT_BRANCH//[^a-zA-Z0-9_-]/-}"

# Create new branch from current HEAD
git checkout -b "$SAFE_BRANCH_NAME"

# Push branch to origin
echo "Pushing branch $SAFE_BRANCH_NAME to origin..."
# If pre-push hook blocks due to LFS and you intentionally want to bypass, you can rename the hook first
if [ -f .git/hooks/pre-push ] && ! command -v git-lfs >/dev/null 2>&1; then
  echo "Detected pre-push hook and no git-lfs installed. To avoid push-block, you can temporarily disable the hook:" 
  echo "  mv .git/hooks/pre-push .git/hooks/pre-push.disabled"
  echo "I will attempt 'git push' now; if it fails, follow the above to disable the hook or install git-lfs."
fi

git push -u origin "$SAFE_BRANCH_NAME"

echo "Push complete. Open a PR from branch: $SAFE_BRANCH_NAME -> main"

echo
echo "Next recommended steps:"
echo "  1) Open PR on GitHub and request review"
echo "  2) Run CI checks and fix issues if any"
echo "  3) Merge to main via PR"

exit 0
