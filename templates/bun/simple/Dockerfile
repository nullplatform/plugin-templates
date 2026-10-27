# syntax=docker/dockerfile:1
#
# {{ .Slug }} worker image: the package compiled to one binary. The agent
# spawns it and dials it over gRPC/mTLS; it answers every action the package
# declares. The SDK comes from npm through package.json.
#
# At runtime the agent injects NP_GRPC_LISTEN (the port), the mTLS material
# (NP_WORKER_TLS_*) and NP_API_KEY, which src/index.ts's main() reads. The
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
# The bun musl binary links libstdc++/libgcc dynamically. The worker runs as
# an unprivileged user. Add here the CLIs your handlers drive (kubectl, aws…).
RUN apk add --no-cache ca-certificates libstdc++ libgcc \
    && addgroup -S -g 65532 worker \
    && adduser -S -u 65532 -G worker -h /home/worker worker
COPY --from=build /out/{{ .Slug }} /app/packages/{{ .Slug }}/entrypoint
USER 65532
ENV HOME=/home/worker \
    NP_AGENT_PLUGIN=np-agent-v1
ENTRYPOINT ["/app/packages/{{ .Slug }}/entrypoint"]
