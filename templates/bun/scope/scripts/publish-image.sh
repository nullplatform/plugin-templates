#!/usr/bin/env bash
# Build the lean gRPC worker image for amd64 + arm64 and push it as
# `registry/repo:<version>`, then print `registry/repo@sha256:<digest>` on stdout
# for `np package publish` to register (the immutable multi-arch index digest).
# Build/push logs go to stderr.
#
# Multi-arch so the worker runs on x86 and ARM nodes alike. Version: $NP_VERSION
# (the release cuts this from the git tag) → package.json version. Registry:
# $NP_PUSH_REGISTRY (any registry you're `docker login`ed to). Needs docker buildx.
set -eu

registry="${NP_PUSH_REGISTRY:-}"
if [ -z "$registry" ]; then
  echo "publish-image: set NP_PUSH_REGISTRY=<registry>/<repository> and 'docker login' to it first." >&2
  exit 1
fi

version="${NP_VERSION:-$(sed -nE 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' package.json | head -1)}"
version="${version#v}"
version="${version:-0.0.0}"

# The slug is the worker binary the Dockerfile bakes in (dist/<slug>-worker-<arch>).
slug=$(sed -nE 's|^COPY dist/(.+)-worker-.*|\1|p' Dockerfile | head -1)
tag="${registry}:${version}"
meta="$(mktemp)"

{
  # bun cross-compiles both arches from any host — no emulation needed to compile.
  bun build --compile --target=bun-linux-x64-musl   ./src/index.ts --outfile "dist/${slug}-worker-amd64"
  bun build --compile --target=bun-linux-arm64-musl ./src/index.ts --outfile "dist/${slug}-worker-arm64"
  docker buildx build --platform linux/amd64,linux/arm64 -t "$tag" --push --metadata-file "$meta" .
} >&2

digest=$(sed -nE 's/.*"containerimage.digest"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' "$meta" | head -1)
if [ -z "$digest" ]; then
  echo "publish-image: could not read the image digest from buildx metadata" >&2
  exit 1
fi

echo "${registry}@${digest}"
