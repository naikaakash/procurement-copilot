# syntax=docker/dockerfile:1.7
#
# Next.js 16 standalone image for Azure Container Apps.
# Three stages: deps (install) → builder (next build) → runner (slim runtime).
#
# Expects next.config.ts to set `output: 'standalone'` so that `.next/standalone`
# contains a minimal `server.js` + only the node_modules actually used at
# runtime. We then layer the static assets and CSV/JSON data folders that the
# app reads from disk (csvDataService loads from procurement_data_sample/).

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone server + its trimmed node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static chunks served by Next
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Public assets (favicon, images, etc.)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# CSV / JSON data the procurement services read at runtime
COPY --from=builder --chown=nextjs:nodejs /app/data ./data
COPY --from=builder --chown=nextjs:nodejs /app/procurement_data_sample ./procurement_data_sample
COPY --from=builder --chown=nextjs:nodejs /app/procurement_data_sample_original ./procurement_data_sample_original
COPY --from=builder --chown=nextjs:nodejs /app/project_memory ./project_memory

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
