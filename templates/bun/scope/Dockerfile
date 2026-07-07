# Worker image: the nullplatform agent with this package baked in.
# Built + pushed by `np package publish`; run by np-controller as a worker.
#
# The stock agent runs the compiled package binary per action (exec), so we just
# place it at a known path. `deploy/local/fleet.yaml` points a worker at this image.
FROM public.ecr.aws/nullplatform/controlplane-agent:latest

# The bun musl binary links libstdc++/libgcc dynamically; the minimal Alpine
# agent image doesn't ship them.
RUN apk add --no-cache libstdc++ libgcc

# The compiled package binary for this image's architecture (np package build
# --image compiles it for the local platform: arm64 on Apple Silicon, else amd64).
COPY dist/{{ .Slug }}-worker /app/packages/{{ .Slug }}/entrypoint
RUN chmod +x /app/packages/{{ .Slug }}/entrypoint

# node-config: ship the config dir and point NODE_CONFIG_DIR at it (the worker's
# cwd isn't here). custom-environment-variables.json maps env vars -> config keys
# — the single declarative place all env config lives.
COPY config/ /app/packages/{{ .Slug }}/config/
ENV NODE_CONFIG_DIR=/app/packages/{{ .Slug }}/config
ENV SUPPRESS_NO_CONFIG_WARNING=1
