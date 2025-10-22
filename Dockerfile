FROM node:22-alpine AS base

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

FROM base AS deps
RUN apk add --no-cache libc6-compat build-base python3 \
    && rm -rf /var/cache/apk/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_DISABLE_ESLINT=true

RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

RUN chown -R nextjs:nodejs /app && chmod -R 755 /app

USER nextjs
EXPOSE 3000

CMD ["sh", "-c", "npm run start"]
