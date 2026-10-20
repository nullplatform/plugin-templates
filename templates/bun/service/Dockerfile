# syntax=docker/dockerfile:1

ARG BUN_IMAGE=oven/bun:1-alpine
ARG RUNTIME_IMAGE=alpine:3.20

FROM --platform=$BUILDPLATFORM ${BUN_IMAGE} AS build
ARG TARGETARCH
WORKDIR /opt/{{ .Slug }}
COPY package.json bun.lock* ./
RUN bun install --production
COPY src ./src
RUN arch=$([ "${TARGETARCH:-amd64}" = "amd64" ] && echo x64 || echo "$TARGETARCH") \
    && bun build --compile --target="bun-linux-${arch}-musl" src/main.ts --outfile /out/{{ .Slug }}

FROM ${RUNTIME_IMAGE}
RUN apk add --no-cache ca-certificates libstdc++ libgcc \
    && addgroup -S -g 65532 worker \
    && adduser -S -u 65532 -G worker -h /home/worker worker
COPY --from=build /out/{{ .Slug }} /app/packages/{{ .Slug }}/entrypoint
USER 65532
ENV HOME=/home/worker \
    SUPPRESS_NO_CONFIG_WARNING=1 \
    NP_AGENT_PLUGIN=np-agent-v1
ENTRYPOINT ["/app/packages/{{ .Slug }}/entrypoint"]
