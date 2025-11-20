#!/usr/bin/env bash
set -euo pipefail

IMAGE=${1:-}
if [[ -z "$IMAGE" ]]; then
  echo "Usage: $0 <image:tag>" >&2
  exit 1
fi

if ! command -v cosign >/dev/null 2>&1; then
  echo "cosign not found. Install cosign from https://github.com/sigstore/cosign/releases" >&2
  exit 2
fi

echo "Signing image: $IMAGE"
cosign sign --key $COSIGN_KEY "$IMAGE"
echo "Signed $IMAGE"
