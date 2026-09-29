"""
productos.py — Blueprint /api/productos.

Recursos:
    GET  /api/productos → listado de productos disponibles (público)
    POST /api/productos → alta de producto (productor/admin) → 201

Seguridad: consultas 100% parametrizadas (%s) y autorización por rol.
"""
from flask import Blueprint, g, jsonify, request
from psycopg.errors import UniqueViolation

from ..auth import permisos, requiere_auth
from ..db import consultar, ejecutar_return

productos_bp = Blueprint('productos', __name__)


@productos_bp.get('')
def listar_productos():
    """
    Listar todos los productos del catálogo
    ---
    tags: [Productos]
    responses:
      200:
        description: Lista de productos
        schema:
          type: array
          items:
            type: object
            properties:
              id: {type: integer}
              nombre: {type: string}
              categoria: {type: string}
      500:
        description: Error interno del servidor
    """
    filas = consultar(
        'SELECT id, nombre, categoria FROM productos ORDER BY categoria, nombre',
    )
    return jsonify(filas), 200


@productos_bp.post('')
@requiere_auth
@permisos('admin', 'productor')
def crear_producto():
    """
    Crear un producto nuevo (requiere rol productor o admin)
    ---
    tags: [Productos]
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            nombre: {type: string, example: Miel pura}
            categoria: {type: string, example: Derivados}
    responses:
      201:
        description: Producto creado
        schema:
          type: object
          properties:
            id: {type: integer}
            nombre: {type: string}
            mensaje: {type: string}
      400:
        description: Datos inválidos o nombre repetido
      401:
        description: Token ausente o inválido
      403:
        description: Rol sin permisos
    """
    payload = request.get_json(silent=True) or {}
    nombre = (payload.get('nombre') or '').strip()
    categoria = (payload.get('categoria') or 'General').strip()

    if not nombre or len(nombre) < 3:
        return jsonify({'error': 'El nombre del producto debe tener al menos 3 caracteres.'}), 400

    try:
        fila = ejecutar_return(
            'INSERT INTO productos (nombre, categoria) VALUES (%s, %s) RETURNING id, nombre, categoria',
            (nombre, categoria),
        )
    except UniqueViolation:
        return jsonify({'error': 'Ese producto ya existe en el catálogo.'}), 400

    return jsonify({**fila, 'mensaje': 'Producto creado correctamente.'}), 201