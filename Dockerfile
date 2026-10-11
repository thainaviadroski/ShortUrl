# syntax=docker/dockerfile:1

FROM node:26-alpine AS base

# 1. Instala dependências
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build da aplicação
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Imagem final de produção
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 4. Migrations do banco (aplicadas a cada start, antes de subir o servidor)
# O standalone só copia os arquivos rastreados pelo Next, então o migrator do
# Drizzle precisa dos pacotes drizzle-orm e postgres completos.
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/src/db/migrate.mjs ./migrate.mjs
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres

USER nextjs

# A Railway injeta PORT em tempo de execução; 3000 é o padrão local
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# DATABASE_URL e REDIS_URL vêm do ambiente (Railway: ${{Postgres.DATABASE_URL}}
# e ${{Redis.REDIS_URL}}). Se a migration falhar, o container não sobe.
CMD ["sh", "-c", "node migrate.mjs && exec node server.js"]
