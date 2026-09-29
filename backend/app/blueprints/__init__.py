"""
blueprints/__init__.py — Registro central de todos los Blueprints.

Cada recurso de la API es un Blueprint independiente (patrón modular).
Si mañana agregas /api/pagos, solo creas pagos.py y lo registras aquí.
"""
from .ferias import ferias_bp
from .productos import productos_bp
from .usuarios import usuarios_bp


def registrar_blueprints(app):
    """Asocia cada Blueprint a su prefijo de URL en la app Flask."""
    app.register_blueprint(usuarios_bp, url_prefix='/api/usuarios')
    app.register_blueprint(ferias_bp, url_prefix='/api/ferias')
    app.register_blueprint(productos_bp, url_prefix='/api/productos')