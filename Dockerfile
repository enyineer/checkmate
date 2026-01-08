# Stage 1: Install Dependencies and Build Frontend
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
COPY core ./core
COPY plugins ./plugins

# Install all dependencies
#
# WORKAROUND: Using "|| true" because Bun exits with code 1 when optional
# dependencies fail to install, even though they're truly optional.
#
# Affected packages:
#   - cpu-features (optional dep of ssh2): Native module that fails to compile
#     without build tools. ssh2 works fine without it (falls back to JS).
#
# Known issues:
#   - https://github.com/oven-sh/bun/issues/14619 (optional deps cause exit 1)
#   - https://github.com/oven-sh/bun/issues/7274 (--omit=optional inconsistent)
#
# TODO: Remove "|| true" once Bun properly handles optional dependency failures
# by exiting 0 when only optional deps fail. Until then, we verify core packages
# are installed correctly in the next step.
#
RUN bun install --frozen-lockfile || true

# Verify core packages installed correctly (catches real failures vs optional)
RUN test -d core/backend/node_modules/hono && test -d core/backend/node_modules/drizzle-orm && \
  echo "✓ Core packages verified" || \
  (echo "ERROR: Core packages missing! Check bun install output above." && exit 1)

# Build frontend
RUN bun run --filter '@checkmate-monitor/frontend' build

# Stage 2: Production Runtime
FROM oven/bun:1-slim AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends tini wget \
  && rm -rf /var/lib/apt/lists/*

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/core ./core
COPY --from=builder /app/plugins ./plugins
COPY --from=builder /app/core/frontend/dist ./core/frontend/dist
COPY package.json bun.lock ./

RUN mkdir -p /app/runtime_plugins /app/data

ENV NODE_ENV=production
ENV CHECKMATE_DATA_DIR=/app/data
ENV CHECKMATE_PLUGINS_DIR=/app/runtime_plugins
ENV CHECKMATE_FRONTEND_DIST=/app/core/frontend/dist

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bun", "run", "core/backend/src/index.ts"]

EXPOSE 3000
