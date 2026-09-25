# syntax=docker/dockerfile:1
#
# {{ .Slug }} worker image: the package compiled to one binary. The agent
# spawns it and dials it over gRPC/mTLS; it answers every action the package
# declares. The SDK comes from npm through package.json.
#
# At runtime the agent injects NP_GRPC_LISTEN (the port), the mTLS material
# (NP_WORKER_TLS_*) and NP_API_KEY. Never set NP_MODE=dev here: it switches
# the SDK to the in-memory platform client and no lifecycle is ever reported.

FROM oven/bun:1-alpine AS build
WORKDIR /opt/{{ .Slug }}
COPY package.json bun.lock* ./
RUN bun install
COPY src ./src
# Compile for the image's own architecture (buildkit sets TARGETARCH; bun
# names amd64 "x64"). bun cross-compiles, so a multi-arch buildx needs no
# emulation for this step.
ARG TARGETARCH
RUN arch=$([ "${TARGETARCH:-amd64}" = "amd64" ] && echo x64 || echo "$TARGETARCH") \
    && bun build --compile --target="bun-linux-${arch}-musl" src/main.ts --outfile /out/{{ .Slug }}

FROM alpine:3.20
# The bun musl binary links libstdc++/libgcc dynamically. The worker runs as
# an unprivileged user.
RUN apk add --no-cache ca-certificates libstdc++ libgcc \
    && addgroup -S -g 65532 worker \
    && adduser -S -u 65532 -G worker -h /home/worker worker
COPY --from=build /out/{{ .Slug }} /app/packages/{{ .Slug }}/entrypoint
USER 65532
ENV HOME=/home/worker \
    SUPPRESS_NO_CONFIG_WARNING=1 \
    NP_AGENT_PLUGIN=np-agent-v1
ENTRYPOINT ["/app/packages/{{ .Slug }}/entrypoint"]
