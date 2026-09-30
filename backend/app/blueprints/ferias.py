"""
ferias.py — Blueprint /api/ferias (recurso principal del proyecto).

CRUD completo con autorización por rol:
    GET    /api/ferias          → listado (público)
    GET    /api/ferias/<id>     → detalle (público)
    POST   /api/ferias          → crear (productor/admin) → 201
    PUT    /api/ferias/<id>     → editar (dueño o admin)  → 200
    DELETE /api/ferias/<id>     → eliminar (dueño o admin)→ 200

Seguridad:
    - Consultas 100% parametrizadas (%s).
    - Un productor SOLO puede editar/borrar sus propias ferias (403 si no).
    - Transacciones atómicas al vincular productos (db.transaccion).

El serializador devuelve exactamente los campos que espera el frontend
React (fechaInicio, fechaFin, productos, destacada, imagen...).
"""
from datetime import datetime, timedelta, timezone

from flask import Blueprint, g, jsonify, request

from ..auth import permisos, requiere_auth
from ..db import consultar, consultar_una, transaccion

ferias_bp = Blueprint('ferias', __name__)


# ---------- Ayudantes internos (solo para este recurso) ----------

# Bolivia (UTC-4) no aplica horario de verano, así que un offset fijo basta
# y evita depender de la base de datos de zonas horarias del servidor.
ZONA_LOCAL = timezone(timedelta(hours=-4))


def _hoy_local():
    """Fecha de hoy según la hora de Bolivia, no la del servidor (que puede ser UTC)."""
    return datetime.now(ZONA_LOCAL).date()


def _validar_fecha(valor, campo):
    """Valida que una fecha tenga formato YYYY-MM-DD. Devuelve el mensaje de error o ''."""
    if not valor:
        return f'{campo} es obligatorio.'
    try:
        datetime.strptime(valor, '%Y-%m-%d')
        return ''
    except ValueError:
        return f'{campo} debe tener formato AAAA-MM-DD.'


def _fecha_no_pasada(valor, campo, hoy=None):
    """
    Regla de negocio: no se admiten ferias ya realizadas.
    Si la fecha es anterior a hoy devuelve el mensaje de error; si el
    formato es inválido devuelve '' (ese error ya lo reporta _validar_fecha).
    """
    if not valor:
        return ''
    try:
        fecha = datetime.strptime(valor, '%Y-%m-%d').date()
    except ValueError:
        return ''
    if fecha < (hoy or _hoy_local()):
        return f'{campo} no puede ser anterior a la fecha de hoy.'
    return ''


def _obtener_productos(feria_id):
    """Devuelve la lista de nombres de productos de una feria."""
    filas = consultar(
        """
        SELECT p.nombre
          FROM productos p
          JOIN feria_productos fp ON fp.producto_id = p.id
         WHERE fp.feria_id = %s
         ORDER BY p.nombre
        """,
        (feria_id,),
    )
    return [fila['nombre'] for fila in filas]


def _serializar_feria(fila):
    """Convierte una fila de la BD al formato JSON que consume el frontend."""
    return {
        'id': fila['id'],
        'productor_id': fila['productor_id'],
        'nombre': fila['nombre'],
        'ubicacion': fila['ubicacion'],
        'fechaInicio': fila['fecha_inicio'].isoformat(),
        'fechaFin': fila['fecha_fin'].isoformat(),
        'descripcion': fila['descripcion'] or '',
        'correo': fila['correo_contacto'],
        'horario': fila['horario'] or '',
        'organizador': fila['organizador'] or '',
        # Ilustración genérica cuando la feria no tiene foto propia
        'imagen': fila['imagen_url'] or '/images/feria-4.svg',
        'destacada': fila['destacada'],
        'productos': _obtener_productos(fila['id']),
    }


def _vincular_productos(cursor, feria_id, nombres):
    """
    Registra los productos (si no existen) y los asocia a la feria.
    Uso de ON CONFLICT para evitar duplicados. Todo dentro de la
    misma transacción que el INSERT de la feria.
    """
    for nombre in (nombres or []):
        nombre = nombre.strip()
        if not nombre:
            continue
        cursor.execute(
            'INSERT INTO productos (nombre, categoria) VALUES (%s, %s) '
            'ON CONFLICT (nombre) DO NOTHING',
            (nombre, 'General'),
        )
        cursor.execute(
            'SELECT id FROM productos WHERE nombre = %s',
            (nombre,),
        )
        producto = cursor.fetchone()
        cursor.execute(
            'INSERT INTO feria_productos (feria_id, producto_id) VALUES (%s, %s) '
            'ON CONFLICT DO NOTHING',
            (feria_id, producto['id']),
        )


def _validar_datos_feria(payload):
    """Valida el cuerpo del POST/PUT y devuelve (errores, datos_limpios)."""
    datos = payload or {}
    errores = {}

    nombre = (datos.get('nombre') or '').strip()
    ubicacion = (datos.get('ubicacion') or '').strip()
    correo = (datos.get('correo') or '').strip().lower()
    fecha_inicio = datos.get('fechaInicio') or ''
    fecha_fin = datos.get('fechaFin') or ''
    descripcion = (datos.get('descripcion') or '').strip()

    if not nombre or len(nombre) < 3:
        errores['nombre'] = 'El nombre debe tener al menos 3 caracteres.'

    if not ubicacion or len(ubicacion) < 3:
        errores['ubicacion'] = 'La ubicación debe tener al menos 3 caracteres.'

    err_fecha = _validar_fecha(fecha_inicio, 'fechaInicio')
    if err_fecha:
        errores['fechaInicio'] = err_fecha
    else:
        # Regla de negocio: una feria no puede empezar en una fecha pasada.
        err_pasada = _fecha_no_pasada(fecha_inicio, 'La fecha de inicio')
        if err_pasada:
            errores['fechaInicio'] = err_pasada
    if _validar_fecha(fecha_fin, 'fechaFin'):
        errores['fechaFin'] = _validar_fecha(fecha_fin, 'fechaFin')
    else:
        # La fecha de fin debe ser posterior o igual a la de inicio
        if fecha_inicio and fecha_fin and fecha_fin < fecha_inicio:
            errores['fechaFin'] = 'La fecha de fin no puede ser anterior a la de inicio.'

    if correo.count('@') != 1:
        errores['correo'] = 'Ingresa un correo de contacto válido.'

    if len(descripcion) < 20:
        errores['descripcion'] = 'La descripción debe tener al menos 20 caracteres.'

    return errores, {
        'nombre': nombre,
        'ubicacion': ubicacion,
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'descripcion': descripcion,
        'correo_contacto': correo,
        'horario': (datos.get('horario') or '').strip(),
        'organizador': (datos.get('organizador') or '').strip(),
        'imagen_url': (datos.get('imagen') or '').strip(),
        'destacada': bool(datos.get('destacada', False)),
        'productos': datos.get('productos') or [],
    }


def _puede_modificar(feria, rol, usuario_id):
    """Regla de negocio: un productor solo modifica sus propias ferias."""
    if rol == 'admin':
        return True
    return feria['productor_id'] == usuario_id


# ---------- Endpoints ----------

@ferias_bp.get('')
def listar_ferias():
    """
    Listar todas las ferias
    ---
    tags: [Ferias]
    parameters:
      - name: solo_destacadas
        in: query
        type: boolean
        required: false
        description: Filtro opcional (true = solo las destacadas)
    responses:
      200:
        description: Lista de ferias normalizadas para el frontend
        schema:
          type: array
          items:
            type: object
            properties:
              id: {type: integer}
              nombre: {type: string}
              fechaInicio: {type: string, example: "2026-10-24"}
              productos: {type: array, items: {type: string}}
      500:
        description: Error interno del servidor
    """
    solo_destacadas = request.args.get('solo_destacadas') == 'true'
    consulta = """
        SELECT * FROM ferias
    """
    parametros = ()
    if solo_destacadas:
        consulta += ' WHERE destacada = TRUE'
    consulta += ' ORDER BY fecha_inicio ASC, nombre ASC'

    ferias_db = consultar(consulta, parametros)
    return jsonify([_serializar_feria(f) for f in ferias_db]), 200


@ferias_bp.get('/<int:feria_id>')
def detalle_feria(feria_id):
    """
    Obtener una feria por su id
    ---
    tags: [Ferias]
    parameters:
      - name: feria_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Feria completa
        schema:
          type: object
          properties:
            id: {type: integer}
            nombre: {type: string}
            horario: {type: string}
            organizador: {type: string}
      404:
        description: Feria no encontrada
    """
    feria = consultar_una('SELECT * FROM ferias WHERE id = %s', (feria_id,))
    if not feria:
        return jsonify({'error': 'Feria no encontrada.'}), 404
    return jsonify(_serializar_feria(feria)), 200


@ferias_bp.post('')
@requiere_auth
@permisos('admin', 'productor')
def crear_feria():
    """
    Crear una feria nueva (requiere rol productor o admin)
    ---
    tags: [Ferias]
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            nombre: {type: string, example: Feria de la Chona}
            ubicacion: {type: string, example: Warnes, Santa Cruz}
            fechaInicio: {type: string, example: "2026-12-05"}
            fechaFin: {type: string, example: "2026-12-06"}
            correo: {type: string, example: contacto@chona.bo}
            descripcion: {type: string}
            horario: {type: string}
            organizador: {type: string}
            productos: {type: array, items: {type: string}}
    responses:
      201:
        description: Feria creada correctamente
        schema:
          type: object
          properties:
            id: {type: integer}
            nombre: {type: string}
            mensaje: {type: string}
      400:
        description: Datos inválidos
      401:
        description: Token ausente o inválido
      403:
        description: Rol sin permisos para crear ferias
    """
    errores, datos = _validar_datos_feria(request.get_json(silent=True))
    if errores:
        return jsonify({'error': 'Datos inválidos.', 'detalles': errores}), 400

    try:
        with transaccion() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO ferias (
                        productor_id, nombre, ubicacion, fecha_inicio, fecha_fin,
                        descripcion, correo_contacto, horario, organizador,
                        imagen_url, destacada
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        g.usuario_id, datos['nombre'], datos['ubicacion'],
                        datos['fecha_inicio'], datos['fecha_fin'],
                        datos['descripcion'], datos['correo_contacto'],
                        datos['horario'], datos['organizador'],
                        datos['imagen_url'], datos['destacada'],
                    ),
                )
                feria = cursor.fetchone()
                _vincular_productos(cursor, feria['id'], datos['productos'])
        # La conexión se posiciona luego del "with" para confirmar la transacción
    except Exception:
        return jsonify({'error': 'No se pudo guardar la feria.'}), 400

    return jsonify({
        'id': feria['id'],
        'nombre': feria['nombre'],
        'mensaje': 'Feria creada correctamente.',
    }), 201


@ferias_bp.put('/<int:feria_id>')
@requiere_auth
@permisos('admin', 'productor')
def editar_feria(feria_id):
    """
    Editar una feria (solo su propio productor o un admin)
    ---
    tags: [Ferias]
    security:
      - Bearer: []
    parameters:
      - name: feria_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            nombre: {type: string}
            ubicacion: {type: string}
            fechaInicio: {type: string}
            fechaFin: {type: string}
            correo: {type: string}
            descripcion: {type: string}
            productos: {type: array, items: {type: string}}
    responses:
      200:
        description: Feria actualizada
      400:
        description: Datos inválidos
      401:
        description: Token ausente o inválido
      403:
        description: No puedes editar una feria de otro productor
      404:
        description: Feria no encontrada
    """
    existente = consultar_una('SELECT * FROM ferias WHERE id = %s', (feria_id,))
    if not existente:
        return jsonify({'error': 'Feria no encontrada.'}), 404

    if not _puede_modificar(existente, g.usuario_rol, g.usuario_id):
        return jsonify({'error': 'No puedes editar una feria de otro productor.'}), 403

    errores, datos = _validar_datos_feria(request.get_json(silent=True))
    if errores:
        return jsonify({'error': 'Datos inválidos.', 'detalles': errores}), 400

    try:
        with transaccion() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE ferias SET
                        nombre = %s, ubicacion = %s, fecha_inicio = %s,
                        fecha_fin = %s, descripcion = %s,
                        correo_contacto = %s, horario = %s, organizador = %s,
                        imagen_url = %s, destacada = %s
                    WHERE id = %s
                    RETURNING *
                    """,
                    (
                        datos['nombre'], datos['ubicacion'],
                        datos['fecha_inicio'], datos['fecha_fin'],
                        datos['descripcion'], datos['correo_contacto'],
                        datos['horario'], datos['organizador'],
                        datos['imagen_url'], datos['destacada'], feria_id,
                    ),
                )
                feria = cursor.fetchone()
                # Reemplaza los productos asociados
                cursor.execute(
                    'DELETE FROM feria_productos WHERE feria_id = %s',
                    (feria_id,),
                )
                _vincular_productos(cursor, feria_id, datos['productos'])
    except Exception:
        return jsonify({'error': 'No se pudo actualizar la feria.'}), 400

    return jsonify(_serializar_feria(feria)), 200


@ferias_bp.delete('/<int:feria_id>')
@requiere_auth
@permisos('admin', 'productor')
def eliminar_feria(feria_id):
    """
    Eliminar una feria (solo su propio productor o un admin)
    ---
    tags: [Ferias]
    security:
      - Bearer: []
    parameters:
      - name: feria_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Feria eliminada
        schema:
          type: object
          properties:
            mensaje: {type: string}
      401:
        description: Token ausente o inválido
      403:
        description: No puedes eliminar una feria de otro productor
      404:
        description: Feria no encontrada
    """
    existente = consultar_una('SELECT * FROM ferias WHERE id = %s', (feria_id,))
    if not existente:
        return jsonify({'error': 'Feria no encontrada.'}), 404

    if not _puede_modificar(existente, g.usuario_rol, g.usuario_id):
        return jsonify({'error': 'No puedes eliminar una feria de otro productor.'}), 403

    with transaccion() as conexion:
        with conexion.cursor() as cursor:
            cursor.execute('DELETE FROM feria_productos WHERE feria_id = %s', (feria_id,))
            cursor.execute('DELETE FROM ferias WHERE id = %s', (feria_id,))

    return jsonify({'mensaje': 'Feria eliminada correctamente.'}), 200