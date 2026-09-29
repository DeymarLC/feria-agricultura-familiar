#!/usr/bin/env bash
# ============================================================
# Render llama a este script durante el build (buildCommand).
# Despliegue "todo-en-uno":
#   1) Compila el frontend (raíz del repo) → dist/.
#   2) Instala las dependencias Python del backend.
#   3) Ejecuta migraciones/seed contra $DATABASE_URL.
#
# Render ejecuta con cwd = backend/ (rootDir), por eso subimos
# a la raíz del repositorio para compilar el frontend.
# ============================================================
set -euo pipefail

RAIZ_PROYECTO="$(cd "$(dirname "$0")/.." && pwd)"

# 1) Frontend: instala dependencias y genera dist/ (Flask lo sirve).
cd "$RAIZ_PROYECTO"
npm ci
npm run build

# 2) Backend: dependencias de Python.
cd "$RAIZ_PROYECTO/backend"
pip install -r requirements.txt

# 3) Migraciones + datos demo (idempotente).
python scripts/init_db.py