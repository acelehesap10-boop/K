#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/create-gh-repo-and-push.sh <new_owner_or_org> <new_repo_name> [public|private] [mirror]
# Example: ./scripts/create-gh-repo-and-push.sh my-user new-exchange private mirror

OWNER=${1:-}
REPO=${2:-}
VISIBILITY=${3:-private}
MIRROR=${4:-}

if [[ -z "$OWNER" || -z "$REPO" ]]; then
  echo "Usage: $0 <new_owner_or_org> <new_repo_name> [public|private] [mirror]"
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI (https://cli.github.com/) and authenticate with 'gh auth login' to continue." >&2
  exit 2
fi

if [[ "$VISIBILITY" != "public" && "$VISIBILITY" != "private" ]]; then
  echo "Visibility must be 'public' or 'private'" >&2
  exit 3
fi

REPO_SPEC="$OWNER/$REPO"

echo "Creating repo $REPO_SPEC with visibility=$VISIBILITY..."
if gh repo view "$REPO_SPEC" >/dev/null 2>&1; then
  echo "Repo $REPO_SPEC already exists. Skipping creation.";
else
  if [[ "$VISIBILITY" == "public" ]]; then
    gh repo create "$REPO_SPEC" --public --confirm
  else
    gh repo create "$REPO_SPEC" --private --confirm
  fi
fi

NEW_REMOTE_URL="git@github.com:$REPO_SPEC.git"
echo "Adding remote 'new-origin' -> $NEW_REMOTE_URL"
git remote add new-origin "$NEW_REMOTE_URL" || echo "Remote new-origin already set"

if [[ "$MIRROR" == "mirror" ]]; then
  echo "Pushing mirror to new-origin (all refs & tags) — this will duplicate refs and tags";
  git push --mirror new-origin
else
  echo "Pushing current branches and tags to new repo"
  git push new-origin --all
  git push new-origin --tags

  # Optional: set basic branch protections and enable required checks
  if [[ "$VISIBILITY" != "mirror" ]]; then
    echo "Setting branch protections (main) and disabling force push"
    gh api -X PUT /repos/$REPO_SPEC/branches/main/protection -F required_status_checks.contexts='["ci"]' -F enforce_admins=true -F required_pull_request_reviews.dismiss_stale_reviews=true || true
  fi

  # Optional: Set some secrets related to CI. This uses gh secret set and requires adequate rights
  if [[ -n "${CI_SECRETS:-}" ]]; then
    for s in $(echo "$CI_SECRETS" | tr ',' ' '); do
      echo "Setting secret $s - ensure its value is in environment variable $s"
      echo -n "${!s}" | gh secret set "$s" -R "$REPO_SPEC" || true
    done
  fi
fi

echo "Done. New repo created at https://github.com/$REPO_SPEC"

echo "If you want to remove the old remote reference run: git remote remove new-origin"
