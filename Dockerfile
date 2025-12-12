FROM node:22-alpine AS base
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN apk add --no-cache \
    build-base \
    python3 \
    py3-setuptools \
    py3-pip \
    py3-wheel \
    && rm -rf /var/cache/apk/*
COPY package.json package-lock.json ./
RUN npm ci --force

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
	&& adduser --system --uid 1001 nextjs

RUN rm -rf /.npm && \
	mkdir -p /.npm && \
	chown -R nextjs:nodejs /.npm && \
	chmod -R 777 /.npm

RUN apk add --no-cache openssl
COPY --from=builder /app/package.json ./package.json
RUN npm install --omit=dev prisma@7.0.0 --force

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./prisma.config.js
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
