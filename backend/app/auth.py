"""
auth.py — Autenticación y autorización con JWT (JSON Web Tokens).

- `crear_token`: genera el token firmado con el claim de rol.
- `@requiere_auth`: valida el token Bearer (401 si falta o es inválido).
- `@permisos('admin', 'productor')`: valida el rol (403 si no autorizado).

El token contiene:
    sub  → id del usuario
    rol  → 'admin' | 'productor' | 'publico'
    iat  → emitido en
    exp  → expiración (JWT_EXPIRES_MINUTES)
"""
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt as pyjwt
from flask import current_app, g, jsonify, request

TOKEN_SECRETO_CAMPO = 'feria_token'


def crear_token(usuario_id, rol):
    """Genera un token JWT firmado con el rol del usuario."""
    ahora = datetime.now(timezone.utc)
    expiracion = ahora + timedelta(
        minutes=current_app.config['JWT_EXPIRES_MINUTES']
    )
    payload = {
        'sub': str(usuario_id),
        'rol': rol,
        'iat': ahora,
        'exp': expiracion,
    }
    return pyjwt.encode(
        payload,
        current_app.config['JWT_SECRET'],
        algorithm='HS256',
    )


def _leer_token():
    """Extrae y valida el token del header Authorization: Bearer <token>."""
    encabezado = request.headers.get('Authorization', '')
    if not encabezado.startswith('Bearer '):
        return None
    token = encabezado[len('Bearer '):].strip()
    try:
        return pyjwt.decode(
            token,
            current_app.config['JWT_SECRET'],
            algorithms=['HS256'],
        )
    except pyjwt.PyJWTError:
        # Token inválido, expirado o con firma alterada → no autenticado
        return None


def requiere_auth(funcion):
    """
    Decorador de autenticación.
    Guarda en el contexto g: g.usuario_id y g.usuario_rol.
    """
    @wraps(funcion)
    def envoltorio(*args, **kwargs):
        datos_token = _leer_token()
        if not datos_token:
            return jsonify({'error': 'Token de acceso no proporcionado o inválido.'}), 401
        g.usuario_id = int(datos_token['sub'])
        g.usuario_rol = datos_token.get('rol')
        return funcion(*args, **kwargs)
    return envoltorio


def permisos(*roles_permitidos):
    """
    Decorador de autorización por rol. Debe usarse DESPUÉS de @requiere_auth.
    Ej: @requiere_auth + @permisos('admin', 'productor')
    """
    def decorador(funcion):
        @wraps(funcion)
        def envoltorio(*args, **kwargs):
            rol = getattr(g, 'usuario_rol', None)
            if not rol or rol not in roles_permitidos:
                return jsonify({'error': 'No tienes permisos para realizar esta acción.'}), 403
            return funcion(*args, **kwargs)
        return envoltorio
    return decorador