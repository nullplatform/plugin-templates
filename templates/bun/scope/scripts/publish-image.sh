#!/usr/bin/env bash
# Build the lean gRPC worker image and push it as `registry/repo:<version>`, then
# print `registry/repo@sha256:<digest>` on stdout for `np package publish` to
# register (the immutable ref). Build/push logs go to stderr.
#
# Version: $NP_VERSION (the release cuts this from the git tag), else the
# package.json version. Registry: $NP_PUSH_REGISTRY (any registry you're
# `docker login`ed to) — nothing provider-specific here.
set -eu

registry="${NP_PUSH_REGISTRY:-}"
if [ -z "$registry" ]; then
  echo "publish-image: set NP_PUSH_REGISTRY=<registry>/<repository> and 'docker login' to it first." >&2
  exit 1
fi

# Version tag: NP_VERSION (release tag) → package.json version. Drop a leading "v".
version="${NP_VERSION:-$(sed -nE 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' package.json | head -1)}"
version="${version#v}"
version="${version:-0.0.0}"

# The slug is the worker binary the Dockerfile bakes in (dist/<slug>-worker).
slug=$(sed -nE 's|^COPY dist/(.+)-worker .*|\1|p' Dockerfile | head -1)
tag="${registry}:${version}"

{
  arch=$(uname -m)
  if [ "$arch" = "arm64" ] || [ "$arch" = "aarch64" ]; then
    target=bun-linux-arm64-musl
  else
    target=bun-linux-x64-musl
  fi
  bun build --compile --target="$target" ./src/index.ts --outfile "dist/${slug}-worker"
  docker build -t "$tag" .
  docker push "$tag"
  digest=$(docker inspect --format '{{ index .RepoDigests 0 }}' "$tag" | cut -d@ -f2)
} >&2

echo "${registry}@${digest}"
