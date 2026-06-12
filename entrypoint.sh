#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# MUNDIAL 2026 API - Entrypoint de Producción
# ═══════════════════════════════════════════════════════════════
# Este script:
# 1. Aplica el esquema Prisma a la BD (crea tablas si no existen)
# 2. Arranca la aplicación NestJS
# ═══════════════════════════════════════════════════════════════

set -e

echo "🏆 Mundial 2026 API - Iniciando contenedor..."
echo "📦 NODE_ENV: ${NODE_ENV:-production}"
echo "🔌 Puerto: ${PORT:-3000}"

# ─── Paso 1: Sincronizar esquema con la base de datos ─────────
echo ""
echo "🗄️  Ejecutando prisma db push (sincronizando esquema 'mundial')..."
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss --skip-generate
echo "✅ Esquema sincronizado correctamente."

# ─── Paso 2: Arrancar la aplicación ──────────────────────────
echo ""
echo "🚀 Iniciando NestJS en modo producción..."
exec node dist/main.js
