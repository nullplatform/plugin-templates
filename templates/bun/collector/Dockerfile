# syntax=docker/dockerfile:1
# Collector image — self-contained multi-stage build: the builder stage
# compiles the worker, the runtime ships just the binary, its config and data.
#
# The default command runs the collector on its own: a snapshot every
# `collector.intervalSeconds` plus the watch, until SIGTERM. Run it as a
# long-lived container (a Deployment), or override the command with `--once`
# for a cron job (a Kubernetes CronJob). It needs NP_INGEST_API_URL and
# NP_API_KEY at runtime; never set NP_MODE=dev here (that keeps everything in
# memory and sends nothing).

FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY . .
RUN bun install
# buildkit sets TARGETARCH (amd64|arm64); compile the matching musl target for
# the alpine runtime below.
ARG TARGETARCH
RUN if [ "$TARGETARCH" = "arm64" ]; then t=bun-linux-arm64-musl; else t=bun-linux-x64-musl; fi; \
    bun build --compile --target="$t" ./src/index.ts --outfile /app/worker

FROM alpine:3.20
# the bun musl binary links libstdc++/libgcc dynamically.
RUN apk add --no-cache libstdc++ libgcc
WORKDIR /app
COPY --from=build /app/worker /app/worker
# node-config: custom-environment-variables.json maps env vars -> config keys.
COPY config/ /app/config/
COPY data/ /app/data/
ENV NODE_CONFIG_DIR=/app/config \
    SUPPRESS_NO_CONFIG_WARNING=1
ENTRYPOINT ["/app/worker"]
CMD ["--run"]
