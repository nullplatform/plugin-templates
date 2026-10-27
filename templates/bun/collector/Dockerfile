# syntax=docker/dockerfile:1
#
# {{ .Slug }} collector image: the collector compiled to one binary. Served by
# default: a snapshot now and every interval, plus the watch, until SIGTERM —
# run it as a long-lived container (a Deployment). With NP_ACTION_CONTEXT='{}'
# it takes one snapshot and exits — run it as a cron job (a CronJob).
#
# At runtime it needs NP_API_KEY (exchanged at NP_API_URL, the platform API
# unless set) to feed catalog-ingest-api, and INVENTORY_URL /
# INVENTORY_CHANGES_URL to name its inventory, which src/index.ts reads. The
# image runs src/index.ts, the real ports; src/local.ts, the in-memory ones,
# never ships.

ARG BUN_IMAGE=oven/bun:1-alpine
ARG RUNTIME_IMAGE=alpine:3.20

# The build stage runs on the builder's own architecture and cross-compiles:
# bun targets any platform, so a multi-arch buildx emulates nothing here.
FROM --platform=$BUILDPLATFORM ${BUN_IMAGE} AS build
ARG TARGETARCH
WORKDIR /opt/{{ .Slug }}
COPY package.json bun.lock* ./
RUN bun install --production
COPY src ./src
# bun names amd64 "x64".
RUN arch=$([ "${TARGETARCH:-amd64}" = "amd64" ] && echo x64 || echo "$TARGETARCH") \
    && bun build --compile --target="bun-linux-${arch}-musl" src/index.ts --outfile /out/{{ .Slug }}

FROM ${RUNTIME_IMAGE}
# The bun musl binary links libstdc++/libgcc dynamically. The collector runs
# as an unprivileged user.
RUN apk add --no-cache ca-certificates libstdc++ libgcc \
    && addgroup -S -g 65532 collector \
    && adduser -S -u 65532 -G collector -h /home/collector collector
COPY --from=build /out/{{ .Slug }} /app/{{ .Slug }}
USER 65532
ENV HOME=/home/collector
ENTRYPOINT ["/app/{{ .Slug }}"]
