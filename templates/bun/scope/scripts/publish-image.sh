#!/usr/bin/env bash
# Build the worker image and push it, then print `registry/repo@sha256:<digest>`
# on stdout for `np package publish` to register. All build/push logs go to
# stderr so stdout is just the ref.
#
# Registry: $NP_PUSH_REGISTRY, else ttl.sh (anonymous, ephemeral — fine for
# testing; set NP_PUSH_REGISTRY to a real registry for real publishes).
set -euo pipefail

# The slug is where the Dockerfile bakes the worker (same source the CLI uses),
# NOT the npm package name — those differ (e.g. @nullplatform/scope-foo vs foo).
slug=$(sed -nE 's|.*/app/packages/([^/]+)/entrypoint.*|\1|p' Dockerfile | head -1)
registry="${NP_PUSH_REGISTRY:-ttl.sh/${slug}-${USER:-local}}"
tag="${registry}:$(date +%s)"

{
  arch=$(uname -m)
  if [ "$arch" = "arm64" ] || [ "$arch" = "aarch64" ]; then
    target=bun-linux-arm64-musl
  else
    target=bun-linux-x64-musl
  fi
  bun build --compile --target="$target" ./src/index.ts --outfile "dist/${slug}-worker"
  docker build -t "${slug}-worker:dev" .
  docker tag "${slug}-worker:dev" "$tag"
  docker push "$tag"
  digest=$(docker inspect --format '{{ index .RepoDigests 0 }}' "$tag" | cut -d@ -f2)
} >&2

echo "${registry}@${digest}"
