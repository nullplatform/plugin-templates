#!/usr/bin/env bash
# Build the lean gRPC worker image, push it, and print `registry/repo@sha256:<digest>`
# on stdout for `np package publish` to register. All build/push logs go to stderr
# so stdout is just the ref.
#
# Registry: set NP_PUSH_REGISTRY to the repo you want to push to, e.g.
#   ghcr.io/acme/myscope | 123456789.dkr.ecr.us-east-1.amazonaws.com/myscope
# You must be authenticated to it first (`docker login <registry>`). This works
# with any registry — nothing here is provider-specific.
set -euo pipefail

registry="${NP_PUSH_REGISTRY:-}"
if [ -z "$registry" ]; then
  echo "publish-image: set NP_PUSH_REGISTRY=<registry>/<repository> and 'docker login' to it first." >&2
  exit 1
fi

# The slug is the worker binary the Dockerfile copies (dist/<slug>-worker), NOT
# the npm package name — those differ (e.g. @nullplatform/scope-foo vs foo).
slug=$(sed -nE 's|^COPY dist/(.+)-worker .*|\1|p' Dockerfile | head -1)
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
