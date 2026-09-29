#!/usr/bin/env bash
# Render llama a este script durante el build (buildCommand).
# 1) Instala dependencias Python.
# 2) Ejecuta las migraciones/seed contra $DATABASE_URL (Render lo inyecta).
set -euo pipefail

pip install -r requirements.txt
python scripts/init_db.py