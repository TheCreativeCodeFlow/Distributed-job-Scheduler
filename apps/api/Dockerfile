# ─── BUILD STAGE ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm and essential build tools
RUN npm install -g pnpm@9.15.0 && \
    apk add --no-cache python3 make g++

# Copy workspaces configuration
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy packages manifest files to cache install layer
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/logger/package.json ./packages/logger/
COPY packages/shared/package.json ./packages/shared/
COPY packages/utils/package.json ./packages/utils/

# Copy API app manifest
COPY apps/api/package.json ./apps/api/

# Install all dependencies (dev + prod) for building
RUN pnpm install --frozen-lockfile

# Copy source directories
COPY packages ./packages
COPY apps/api ./apps/api

# Generate Prisma client and build all workspace dependencies
RUN pnpm --filter @repo/database build && \
    pnpm --filter @repo/api build

# Prune dev dependencies (keep only production packages)
RUN pnpm prune --prod --no-optional

# ─── RUNTIME STAGE ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002

# Run as non-privileged system user for container security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S node -u 1001

# Copy build output, production node_modules, and assets
COPY --from=builder --chown=node:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=node:nodejs /app/packages ./packages
COPY --from=builder --chown=node:nodejs /app/apps/api ./apps/api

USER node

EXPOSE 3002

CMD ["node", "apps/api/dist/index.js"]
