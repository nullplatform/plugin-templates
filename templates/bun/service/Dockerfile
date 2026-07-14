# Lean gRPC worker image for this package.
#
# Built + pushed by `np package publish`. The nullplatform agent spawns this as a
# worker (a pod in Kubernetes, a container in Docker) and streams actions to it
# over gRPC. The compiled binary starts the SDK's gRPC server because
# NP_AGENT_PLUGIN is set; at runtime the agent injects NP_GRPC_LISTEN (the port),
# the mTLS material (NP_WORKER_TLS_*), and NP_API_KEY. Do NOT set NP_MODE=dev —
# that switches the SDK to the in-memory client and the worker would never report
# action lifecycle to the platform (scopes would hang/fail).
FROM alpine:3.20

# The bun musl binary links libstdc++/libgcc dynamically.
RUN apk add --no-cache libstdc++ libgcc

# The compiled package binary for this image's architecture (np package build
# --image compiles it for the target platform).
COPY dist/{{ .Slug }}-worker /app/worker
RUN chmod +x /app/worker

# node-config: ship the config dir; custom-environment-variables.json maps env
# vars -> config keys (the single declarative place env config lives).
COPY config/ /app/config/
ENV NODE_CONFIG_DIR=/app/config \
    SUPPRESS_NO_CONFIG_WARNING=1 \
    NP_AGENT_PLUGIN=np-agent-v1

EXPOSE 50051
ENTRYPOINT ["/app/worker"]
