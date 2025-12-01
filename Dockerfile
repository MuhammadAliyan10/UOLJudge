FROM node:20-slim AS base

# 1. Install Dependencies
FROM base AS deps
# Override any proxy settings from Docker daemon
ARG http_proxy=""
ARG https_proxy=""
ARG HTTP_PROXY=""
ARG HTTPS_PROXY=""
ARG no_proxy="*"
ARG NO_PROXY="*"
RUN apt-get update -y && apt-get install -y openssl ca-certificates
WORKDIR /app
COPY package.json package-lock.json* ./
# Clean install
RUN npm ci

# 2. Build the App
FROM base AS builder
# Install OpenSSL for Prisma
ARG http_proxy=""
ARG https_proxy=""
ARG HTTP_PROXY=""
ARG HTTPS_PROXY=""
ARG no_proxy="*"
ARG NO_PROXY="*"
RUN apt-get update -y && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client (Critical for DB access)
RUN npx prisma generate

# Build Next.js
# Note: We skip type checking for speed in production build if you are confident
RUN npm run build

# 3. Production Runner
FROM base AS runner
# Install OpenSSL for Prisma runtime
ARG http_proxy=""
ARG https_proxy=""
ARG HTTP_PROXY=""
ARG HTTPS_PROXY=""
ARG no_proxy="*"
ARG NO_PROXY="*"
RUN apt-get update -y && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Public Assets
COPY --from=builder /app/public ./public

# Set permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy Standalone Output
# This is the "Magic" folder Next.js creates
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Server Code (For WebSocket Engine)
COPY --from=builder --chown=nextjs:nodejs /app/server ./server

# Copy Prisma Folder (For Seeding)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Install Runtime Deps for WebSocket
# We install 'ws' and 'tsx' explicitly in the runner
COPY package.json ./
RUN npm install ws --no-save && npm install -g tsx

USER nextjs

EXPOSE 3000
EXPOSE 3001

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Default command (Overridden by docker-compose)
CMD ["node", "server.js"]