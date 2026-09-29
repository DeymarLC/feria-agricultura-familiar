"""api/index.py — Entrypoint de Vercel (Python runtime).

Vercel detecta la variable de nivel superior `app` como aplicación WSGI
(Flask) y enruta todo el tráfico hacia ella. Mantiene el despliegue
"todo-en-uno": la misma app sirve la API (/api/*), Swagger (/apidocs) y
el frontend compilado (dist/) con fallback SPA.
"""
import os
import sys

# El paquete `app` (backend/app) vive en backend/. Vercel ejecuta desde la
# raíz del repo → agregamos backend/ al módulo search path.
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, 'backend'))

from app import create_app  # noqa: E402

app = create_app()