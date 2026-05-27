# =============================================================================
# Dockerfile — hotseaters-ultimate
#
# Builds the SPA static bundle and serves it with nginx (COOP/COEP required
# for PGlite SharedArrayBuffer + OPFS).
#
# Build context: this repo's root (`hotseaters-ultimate/`).
#
#   docker build -f Dockerfile -t hotseaters-ultimate \
#     --build-arg VITE_SUPABASE_URL=https://hotbase.prometheusags.ai \
#     --build-arg VITE_SUPABASE_ANON_KEY=<anon> \
#     --build-arg VITE_ELECTRIC_URL=https://electricsql.prometheusags.ai \
#     .
#
# HARD CONSTRAINT (per ./CLAUDE.md):
#   Self-hosted Supabase only. VITE_SUPABASE_URL must NOT match *.supabase.co.
#   The Vite build itself enforces this guard rail (see vite.config.ts).
#
# The `prometheus-entity-management` library is consumed via `workspace:*`
# during development (git submodule at packages/prometheus-entity-management).
# For container builds the submodule is not in the build context, so
# dockerize-deps.mjs rewrites the dep to `^2.0.0` before pnpm install,
# letting the npm registry supply the package. No vendor directory required.
# =============================================================================

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS build

# Vite inlines VITE_* at build time. NO *.supabase.co; vite.config.ts refuses.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_ELECTRIC_URL
ARG VITE_APP_NAME=HotSeaters
ARG VITE_APP_VERSION=0.0.1
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_ELECTRIC_URL=$VITE_ELECTRIC_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION

RUN corepack enable

WORKDIR /app

# Copy manifest first for dependency-layer caching.
COPY package.json pnpm-lock.yaml* ./

# Rewrite workspace:* → ^2.0.0 so pnpm resolves the library from npm.
# Idempotent — exits 0 if already rewritten.
COPY scripts/dockerize-deps.mjs ./scripts/dockerize-deps.mjs
RUN node scripts/dockerize-deps.mjs

RUN pnpm install --no-frozen-lockfile

# Copy the rest of the source.
COPY tsconfig.json tsconfig.build.json vite.config.ts components.json eslint.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/
COPY content/ ./content/
COPY scripts/ ./scripts/

# Compile MDX → HTML + JSON fragments, then bundle.
#
# `gen:pglite-schema` is intentionally NOT run during the image build:
# the script reads sibling-repo paths (../latest-data/supabase/migrations/)
# that do not exist inside the container. `src/shared/db/local-schema.sql`
# is the canonical pre-generated artifact shipped from the source repo and
# copied in via `COPY src/`. CI must run `pnpm gen:pglite-schema` against
# the source tree before kicking off the docker build (the
# `gen:pglite-schema:check` script in package.json enforces no drift).
RUN pnpm manual:compile
# Production typecheck uses tsconfig.build.json which excludes test files
# (vitest tests are validated separately in CI, not in the production image).
RUN pnpm exec tsc -p tsconfig.build.json
RUN pnpm exec vite build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf
# Vite copies `public/` (including `public/user-manual/fragments/` written by
# `pnpm manual:compile`) into `dist/` at build time, so the manual fragments
# are already served at `/user-manual/fragments/<slug>.html` via the
# `dist/` mount below. No separate manual COPY needed.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
