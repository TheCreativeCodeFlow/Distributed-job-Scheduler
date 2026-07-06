# ─── BUILD STAGE ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm and build essentials
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

# Copy Worker app manifest
COPY apps/worker/package.json ./apps/worker/

# Install dependencies for compilation
RUN pnpm install --frozen-lockfile

# Copy source directories
COPY packages ./packages
COPY apps/worker ./apps/worker

# Generate Prisma and compile typescript
RUN pnpm --filter @repo/database build && \
    pnpm --filter @repo/worker build

# Prune dev dependencies
RUN pnpm prune --prod --no-optional

# ─── RUNTIME STAGE ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S node -u 1001

# Copy outputs, prod dependencies and shared packages
COPY --from=builder --chown=node:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=node:nodejs /app/packages ./packages
COPY --from=builder --chown=node:nodejs /app/apps/worker ./apps/worker

USER node

CMD ["node", "apps/worker/dist/index.js"]
