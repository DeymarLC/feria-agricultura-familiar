"""
__init__.py — Factory de la aplicación Flask (patrón create_app).

Reúne la configuración, CORS restringido, documentación Swagger y el
registro de los Blueprints de cada recurso (/api/usuarios, /api/ferias,
/api/productos). Mantener este archivo pequeño evita el "monolito".
"""
from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger

from .config import Config


def create_app():
    """Crea y configura la instancia de la API Flask."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS restringido: SOLO los orígenes permitidos en el .env.
    # Nunca "*" en producción (ver configuración de CORS_ORIGINS).
    CORS(
        app,
        resources={r"/api/*": {'origins': app.config['CORS_ORIGINS']}},
    )

    # Swagger UI disponible en /apidocs (documentación en cada blueprint)
    Swagger(app, template={
        'swagger': '2.0',
        'info': {
            'title': 'API Feria de Agricultura Familiar',
            'description': 'Backend Flask del proyecto Programación Web II. '
                           'Endpoints de usuarios, ferias y productos con JWT.',
            'version': '1.0.0',
        },
        'securityDefinitions': {
            'Bearer': {
                'type': 'apiKey',
                'name': 'Authorization',
                'in': 'header',
                'description': 'Escribe: Bearer <token JWT>',
            },
        },
        'security': [{'Bearer': []}],
    })

    # Respuestas uniformes en JSON (sin trazas de stack al cliente)
    @app.errorhandler(400)
    def error_400(excepcion):
        return jsonify({'error': 'Solicitud inválida.'}), 400

    @app.errorhandler(401)
    def error_401(excepcion):
        return jsonify({'error': 'Autenticación requerida.'}), 401

    @app.errorhandler(403)
    def error_403(excepcion):
        return jsonify({'error': 'No tienes permisos para esta acción.'}), 403

    @app.errorhandler(404)
    def error_404(excepcion):
        return jsonify({'error': 'Recurso no encontrado.'}), 404

    @app.errorhandler(500)
    def error_500(excepcion):
        # En producción loguea el detalle pero NO lo devuelves al cliente.
        app.logger.error('Error interno: %s', excepcion)
        return jsonify({'error': 'Error interno del servidor.'}), 500

    # Registro de los blueprints modulares
    from .blueprints import registrar_blueprints
    registrar_blueprints(app)

    # Endpoint simple de salud para verificar que la API responde
    @app.get('/api/health')
    def salud():
        """Marca de salud de la API."""
        return jsonify({'estado': 'ok', 'servicio': 'Feria de Agricultura Familiar'})

    return app