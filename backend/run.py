"""run.py — Punto de entrada de la API.

Renderm gira también su `startCommand: gunicorn run:app`
para que gunicorn importe la variable `app` desde este módulo.
"""
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Solo para desarrollo local. En producción se usa gunicorn.
    app.run(host='0.0.0.0', port=5000, debug=True)