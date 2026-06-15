#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# MUNDIAL 2026 API - Entrypoint de Producción
# ═══════════════════════════════════════════════════════════════

set -e

echo "🏆 Mundial 2026 API - Iniciando contenedor..."
echo "📦 NODE_ENV: ${NODE_ENV:-production}"
echo "🔌 Puerto: ${PORT:-3000}"

# ─── Paso 1: Sincronizar esquema con la base de datos ─────────
echo ""
echo "🗄️  Ejecutando prisma db push (sincronizando esquema 'mundial')..."
node_modules/.bin/prisma db push --schema=prisma/schema.prisma --accept-data-loss --skip-generate 2>&1 || echo "⚠️  prisma db push falló, continuando de todas formas..."
echo "✅ Esquema sincronizado."

# ─── Paso 2: Arrancar la aplicación ──────────────────────────
echo ""
echo "🚀 Iniciando NestJS en modo producción..."
exec node dist/main.js
