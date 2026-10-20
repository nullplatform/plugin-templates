#!/usr/bin/env bash
set -eu

registry="${NP_PUSH_REGISTRY:-}"
if [ -z "$registry" ]; then
  echo "publish-image: set NP_PUSH_REGISTRY=<registry>/<repository> and 'docker login' to it first." >&2
  exit 1
fi

version="${NP_VERSION:-$(sed -nE 's/.*"version"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' package.json | head -1)}"
version="${version#v}"
version="${version:-0.0.0}"

tag="${registry}:${version}"
meta="$(mktemp)"

docker buildx build --platform linux/amd64,linux/arm64 -t "$tag" --push --metadata-file "$meta" . >&2

digest=$(sed -nE 's/.*"containerimage.digest"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' "$meta" | head -1)
if [ -z "$digest" ]; then
  echo "publish-image: could not read the image digest from buildx metadata" >&2
  exit 1
fi

echo "${registry}@${digest}"
