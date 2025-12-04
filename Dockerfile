# 1. Base Image (Slim is fine for runtime/deps)
FROM node:20-slim AS base

# 2. Install Dependencies
FROM base AS deps
ARG http_proxy=""
ARG https_proxy=""
ARG HTTP_PROXY=""
ARG HTTPS_PROXY=""
ARG no_proxy="*"
ARG NO_PROXY="*"

RUN apt-get update -y && apt-get install -y openssl ca-certificates
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 3. Build the App (Use Full Node Image)
FROM node:20 AS builder

ARG http_proxy=""
ARG https_proxy=""
ARG HTTP_PROXY=""
ARG HTTPS_PROXY=""
ARG no_proxy="*"
ARG NO_PROXY="*"

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# 🛑 THE FIX IS HERE:
# We provide a fake URL so Prisma doesn't crash during the build.
# This is NOT used in production (docker-compose overrides it).
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Build Next.js
RUN npm run build

# 4. Production Runner (Back to Slim)
FROM base AS runner
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

# Copy Assets
COPY --from=builder /app/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy Standalone Output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Server Code
COPY --from=builder --chown=nextjs:nodejs /app/server ./server

# Copy Prisma Folder (For Seeding)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Install Runtime Deps
COPY package.json ./
RUN npm install ws --no-save && npm install -g tsx

USER nextjs

EXPOSE 3000
EXPOSE 3001

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]