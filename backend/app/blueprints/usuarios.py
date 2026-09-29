"""
usuarios.py — Blueprint /api/usuarios.

Recursos:
    POST /api/usuarios/registro   → alta de usuario (201/400)
    POST /api/usuarios/login      → autenticación JWT (200/401)
    GET  /api/usuarios/me         → datos del usuario autenticado (200/401)

Seguridad:
    - Contraseñas con hash (werkzeug, scrypt). Nunca se guardan en claro.
    - Consultas 100% parametrizadas (placeholders %s).
    - Login sin revelar si falló el correo o la contraseña.
"""
from flask import Blueprint, g, jsonify, request
from psycopg.errors import UniqueViolation
from werkzeug.security import check_password_hash, generate_password_hash

from ..auth import crear_token, requiere_auth
from ..db import consultar_una, ejecutar_return

usuarios_bp = Blueprint('usuarios', __name__)

# Roles que un usuario puede solicitar al registrarse. 'admin' NO es público.
ROLES_REGISTRABLES = ('productor', 'publico')

MAX_LONGITUD = {'nombre': 100, 'correo': 150, 'password': 128}


def _validar_datos_registro(payload):
    """Valida el cuerpo del registro y devuelve (errores, datos_limpios)."""
    datos = payload or {}
    errores = {}

    nombre = (datos.get('nombre') or '').strip()
    correo = (datos.get('correo') or '').strip().lower()
    password = datos.get('password') or ''
    rol = (datos.get('rol') or 'publico').strip()

    if not nombre or len(nombre) < 3:
        errores['nombre'] = 'El nombre debe tener al menos 3 caracteres.'
    if len(nombre) > MAX_LONGITUD['nombre']:
        errores['nombre'] = f'Máximo {MAX_LONGITUD["nombre"]} caracteres.'

    if correo.count('@') != 1 or '.' not in correo.split('@')[1]:
        errores['correo'] = 'Ingresa un correo electrónico válido.'
    if len(correo) > MAX_LONGITUD['correo']:
        errores['correo'] = f'Máximo {MAX_LONGITUD["correo"]} caracteres.'

    if len(password) < 8:
        errores['password'] = 'La contraseña debe tener al menos 8 caracteres.'
    if len(password) > MAX_LONGITUD['password']:
        errores['password'] = f'Máximo {MAX_LONGITUD["password"]} caracteres.'

    if rol not in ROLES_REGISTRABLES:
        errores['rol'] = 'El rol debe ser "productor" o "publico".'

    return errores, {'nombre': nombre, 'correo': correo,
                     'password': password, 'rol': rol}


@usuarios_bp.post('/registro')
def registro():
    """
    Registrar un usuario nuevo
    ---
    tags: [Usuarios]
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            nombre: {type: string, example: María Choque}
            correo: {type: string, example: maria@campo.bo}
            password: {type: string, example: Contrasena123}
            rol: {type: string, enum: [productor, publico], example: productor}
    responses:
      201:
        description: Usuario creado
        schema:
          type: object
          properties:
            id: {type: integer}
            correo: {type: string}
            mensaje: {type: string}
      400:
        description: Datos inválidos (errores de validación)
      500:
        description: Error interno del servidor
    """
    errores, datos = _validar_datos_registro(request.get_json(silent=True))
    if errores:
        return jsonify({'error': 'Datos inválidos.', 'detalles': errores}), 400

    # Hash de la contraseña (scrypt) — nunca guardar el texto plano
    hash_password = generate_password_hash(datos['password'])

    try:
        fila = ejecutar_return(
            """
            INSERT INTO usuarios (nombre, correo, password_hash, rol)
            VALUES (%s, %s, %s, %s)
            RETURNING id, nombre, correo, rol
            """,
            (datos['nombre'], datos['correo'], hash_password, datos['rol']),
        )
    except UniqueViolation:
        return jsonify({'error': 'Ese correo ya está registrado.'}), 400

    return jsonify({
        'id': fila['id'],
        'nombre': fila['nombre'],
        'correo': fila['correo'],
        'rol': fila['rol'],
        'mensaje': 'Usuario creado correctamente.',
    }), 201


@usuarios_bp.post('/login')
def login():
    """
    Iniciar sesión y obtener un token JWT
    ---
    tags: [Usuarios]
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            correo: {type: string, example: maria@campo.bo}
            password: {type: string, example: Contrasena123}
    responses:
      200:
        description: Autenticación exitosa con token de acceso
        schema:
          type: object
          properties:
            token: {type: string}
            rol: {type: string}
            nombre: {type: string}
      400:
        description: Falta correo o contraseña
      401:
        description: Credenciales incorrectas
    """
    payload = request.get_json(silent=True) or {}
    correo = (payload.get('correo') or '').strip().lower()
    password = payload.get('password') or ''

    if not correo or not password:
        return jsonify({'error': 'Correo y contraseña son obligatorios.'}), 400

    # Consulta parametrizada para evitar inyección SQL
    usuario = consultar_una(
        'SELECT id, nombre, correo, password_hash, rol FROM usuarios WHERE correo = %s',
        (correo,),
    )

    # Mensaje genérico para no revelar si falló el correo o la contraseña
    if not usuario or not check_password_hash(usuario['password_hash'], password):
        return jsonify({'error': 'Correo o contraseña incorrectos.'}), 401

    token = crear_token(usuario['id'], usuario['rol'])
    return jsonify({
        'token': token,
        'rol': usuario['rol'],
        'nombre': usuario['nombre'],
        'correo': usuario['correo'],
    }), 200


@usuarios_bp.get('/me')
@requiere_auth
def perfil():
    """
    Obtener los datos del usuario autenticado
    ---
    tags: [Usuarios]
    security:
      - Bearer: []
    responses:
      200:
        description: Perfil del usuario conectado
        schema:
          type: object
          properties:
            id: {type: integer}
            nombre: {type: string}
            correo: {type: string}
            rol: {type: string}
      401:
        description: Token ausente o inválido
    """
    usuario = consultar_una(
        'SELECT id, nombre, correo, rol FROM usuarios WHERE id = %s',
        (g.usuario_id,),
    )
    if not usuario:
        return jsonify({'error': 'Usuario no encontrado.'}), 404
    return jsonify(usuario), 200