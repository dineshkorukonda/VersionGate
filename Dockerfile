# ── Stage 1: Build dashboard & dependencies ──────────────────────────────────
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY dashboard/package.json dashboard/bun.lock* ./dashboard/
RUN cd dashboard && bun install

COPY tsconfig.json ./
COPY src ./src
COPY dashboard ./dashboard

# Build Vite React dashboard to dashboard/out
RUN cd dashboard && bun run build

# ── Stage 2: Production Runner ────────────────────────────────────────────────
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9090

COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/dashboard/out ./dashboard/out

EXPOSE 9090

CMD ["bun", "src/server.ts"]
