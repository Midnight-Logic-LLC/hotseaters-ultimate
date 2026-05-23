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
# The `prometheus-entity-management` library is consumed via the package.json
# `link:../latest-data/packages/prometheus-entity-management` reference at
# development time. For container builds, the library must be vendored or
# resolved differently because the sibling repo is not in the build context.
#
# We vendor it at build time by copying the dist/ tarball produced by the
# library's `tsup` build. The CI image-build workflow is responsible for:
#   1. cd ../latest-data && pnpm --filter @prometheus-ags/prometheus-entity-management build
#   2. cp -r ../latest-data/packages/prometheus-entity-management/dist /tmp/pem-dist
#   3. cp -r /tmp/pem-dist ./vendor/prometheus-entity-management
# Then this Dockerfile copies ./vendor/prometheus-entity-management/ in.
#
# Alternative (preferred long-term): publish the library to a private npm
# registry. Documented in docs/RUNBOOKS.md.
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

# CI must place a built prometheus-entity-management dist tarball here.
# Local docker build without this requires a different strategy (see header).
COPY vendor/prometheus-entity-management ./vendor/prometheus-entity-management

# Patch the package.json link: to a file:vendor reference for the container
# build. This is the one place we deviate from the workspace setup; it's
# idempotent (script bails if already patched).
COPY scripts/dockerize-deps.mjs ./scripts/dockerize-deps.mjs
RUN node scripts/dockerize-deps.mjs

RUN pnpm install --no-frozen-lockfile --prefer-offline

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
