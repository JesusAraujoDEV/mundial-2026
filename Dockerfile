# ═══════════════════════════════════════════════════════════════
# MUNDIAL 2026 API - Dockerfile Multi-stage (Producción)
# Optimizado para NestJS + Prisma + Dokploy
# ═══════════════════════════════════════════════════════════════

# ─── Etapa 1: Dependencias ────────────────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Copiar archivos de definición de paquetes
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (incluye devDeps para el build)
RUN npm ci

# Generar Prisma Client (necesario para compilación TypeScript)
RUN npx prisma generate --schema=prisma/schema.prisma

# ─── Etapa 2: Build ──────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copiar dependencias instaladas de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Copiar código fuente completo
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
COPY prisma ./prisma

# Compilar NestJS (genera carpeta /dist)
RUN npm run build

# ─── Etapa 3: Runner (Producción) ────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# Instalar solo lo necesario para producción
RUN apt-get update -y && apt-get install -y --no-install-recommends dumb-init openssl ca-certificates wget && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root para seguridad
RUN addgroup --gid 1001 --system nodejs && \
    adduser --system --uid 1001 nestjs

# Copiar package.json para instalar solo deps de producción
COPY package.json package-lock.json* ./

# Instalar solo dependencias de producción
RUN npm ci --only=production --ignore-scripts

# Copiar Prisma schema (necesario para db push / migrate en runtime)
COPY prisma ./prisma

# Generar Prisma Client en producción
RUN npx prisma generate --schema=prisma/schema.prisma

# Copiar la app compilada desde el builder
COPY --from=builder /app/dist ./dist

# Copiar el script de inicio
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Dar permisos al usuario nestjs sobre todo /app
RUN chown -R nestjs:nodejs /app

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto (usa variable PORT, default 3000)
EXPOSE ${PORT:-3000}

# Healthcheck básico
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/mundial/ranking || exit 1

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--"]

# Ejecutar el script de arranque
CMD ["sh", "./entrypoint.sh"]
