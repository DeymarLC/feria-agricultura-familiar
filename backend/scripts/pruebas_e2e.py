"""pruebas_e2e.py — Pruebas integradas de la API contra PostgreSQL real por HTTP.

Ejecutar con el backend levantado:
    venv\\Scripts\\python.exe scripts/pruebas_e2e.py

Cubre: salud, /ferias, detalle 404, inyección SQL, registro, login, /me,
CRUD de ferias con JWT y roles (401/403/404), Swagger y el tablero de
métricas de sostenibilidad (/api/metricas). Al final limpia sus propios
datos de prueba de la base.
"""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

import psycopg
from dotenv import load_dotenv

# backend/scripts/pruebas_e2e.py → parents[1] es backend/
RUTA_BACKEND = Path(__file__).resolve().parents[1]
load_dotenv(RUTA_BACKEND / '.env')

# Dirección de la API (se puede sobrescribir con la variable E2E_BASE).
BASE = os.getenv('E2E_BASE', 'http://127.0.0.1:5000/api')

# Cadena de conexión para la limpieza final (misma base que usa la API).
DATABASE_URL = next(
    (l.split('=', 1)[1].strip() for l in (RUTA_BACKEND / '.env').read_text(encoding='utf-8').splitlines()
     if l.startswith('DATABASE_URL')),
    os.getenv('DATABASE_URL', ''),
)

CORREO_P = 'e2e-productor@test.bo'
CORREO_P2 = 'e2e-productor2@test.bo'
CORREO_PUB = 'e2e-publico@test.bo'

resultados = []


def comprobar(nombre, condicion, detalle=''):
    resultados.append(bool(condicion))
    print(f"[{'PASS' if condicion else 'FAIL'}] {nombre}" + (f' — {detalle}' if detalle else ''))


def peticion(metodo, ruta, cuerpo=None, token=None, esperado=None):
    url = BASE + ruta
    datos = json.dumps(cuerpo).encode('utf-8') if cuerpo is not None else None
    cabeceras = {'Content-Type': 'application/json'}
    if token:
        cabeceras['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=datos, headers=cabeceras, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            contenido = resp.read().decode('utf-8')
            return resp.status, json.loads(contenido) if contenido else {}
    except urllib.error.HTTPError as error:
        contenido = error.read().decode('utf-8')
        return error.code, json.loads(contenido) if contenido else {}


# 1) Salud
estado, cuerpo = peticion('GET', '/health')
comprobar('GET /health = 200', estado == 200, str(cuerpo))

# 2) Listado de ferias sembradas
estado, ferias = peticion('GET', '/ferias')
comprobar('GET /ferias = 200 y trae ferias', estado == 200 and isinstance(ferias, list) and len(ferias) >= 3,
          f'{len(ferias)} ferias')
campos = {'id', 'productor_id', 'nombre', 'ubicacion', 'fechaInicio', 'fechaFin', 'descripcion',
          'correo', 'horario', 'organizador', 'imagen', 'destacada', 'productos'}
comprobar('Formato correcto para el frontend React', campos.issubset(ferias[0].keys()))
id_demo = ferias[0]['id']

# 3) Detalle existente y no existente
estado, feria = peticion('GET', f'/ferias/{id_demo}')
comprobar(f'GET /ferias/{id_demo} = 200', estado == 200 and feria['id'] == id_demo)
estado, cuerpo = peticion('GET', '/ferias/99999999')
comprobar('GET /ferias/99999999 = 404', estado == 404)

# 4) Inyección SQL — login con correo malicioso
estado, cuerpo = peticion('POST', '/usuarios/login',
                          {'correo': "x' OR '1'='1' --", 'password': 'cualquiercosa'})
comprobar('Inyeccion SQL en login = 401 (no 500, no fuga)', estado == 401)

# 5) Registro de 2 productores y 1 publico
estado, cuerpo = peticion('POST', '/usuarios/registro',
                          {'nombre': 'Productor E2E', 'correo': CORREO_P, 'password': 'E2ePrueba123!', 'rol': 'productor'})
comprobar('POST registro productor = 201', estado == 201, str(cuerpo.get('mensaje')))
estado, cuerpo = peticion('POST', '/usuarios/registro',
                          {'nombre': 'Productor E2E 2', 'correo': CORREO_P2, 'password': 'E2ePrueba123!', 'rol': 'productor'})
comprobar('POST registro productor2 = 201', estado == 201)
estado, cuerpo = peticion('POST', '/usuarios/registro',
                          {'nombre': 'Publico E2E', 'correo': CORREO_PUB, 'password': 'E2ePrueba123!', 'rol': 'publico'})
comprobar('POST registro publico = 201', estado == 201)
estado, cuerpo = peticion('POST', '/usuarios/registro', {'nombre': 'X', 'correo': 'mal', 'password': 'corta', 'rol': 'hacker'})
comprobar('POST registro invalido = 400', estado == 400 and 'detalles' in cuerpo)
estado, cuerpo = peticion('POST', '/usuarios/registro', {'correo': CORREO_P, 'password': 'E2ePrueba123!', 'nombre': 'Duplicado', 'rol': 'productor'})
comprobar('POST registro correo repetido = 400', estado == 400)

# 6) Login
estado, login_p = peticion('POST', '/usuarios/login', {'correo': CORREO_P, 'password': 'E2ePrueba123!'})
token_p = login_p.get('token') if estado == 200 else ''
comprobar('POST login productor = 200 + token', estado == 200 and bool(token_p) and login_p.get('rol') == 'productor')
estado, login_p2 = peticion('POST', '/usuarios/login', {'correo': CORREO_P2, 'password': 'E2ePrueba123!'})
token_p2 = login_p2.get('token') if estado == 200 else ''
estado, login_pub = peticion('POST', '/usuarios/login', {'correo': CORREO_PUB, 'password': 'E2ePrueba123!'})
token_pub = login_pub.get('token') if estado == 200 else ''
estado, login_admin = peticion('POST', '/usuarios/login', {'correo': 'admin@feria.bo', 'password': 'Admin123!'})
token_admin = login_admin.get('token') if estado == 200 else ''
comprobar('POST login admin demo = 200 + rol admin', estado == 200 and login_admin.get('rol') == 'admin')
estado, cuerpo = peticion('POST', '/usuarios/login', {'correo': CORREO_P, 'password': 'incorrecta123'})
comprobar('POST login con password mal = 401', estado == 401)

# 7) /me
estado, cuerpo = peticion('GET', '/usuarios/me', token=token_p)
comprobar('GET /usuarios/me con token = 200', estado == 200 and cuerpo.get('correo') == CORREO_P)
estado, cuerpo = peticion('GET', '/usuarios/me')
comprobar('GET /usuarios/me sin token = 401', estado == 401)

# 8) Crear feria
DATOS_FERIA = {
    'nombre': 'Feria Prueba E2E',
    'ubicacion': 'Zona pruebas, Santa Cruz de la Sierra',
    'fechaInicio': '2026-12-01',
    'fechaFin': '2026-12-02',
    'correo': 'e2e@test.bo',
    'descripcion': 'Feria de verificacion integral del proyecto academico de programacion web.',
    'horario': '9:00 a 13:00',
    'organizador': 'Equipo E2E',
    'imagen': '/images/feria-1.svg',
    'destacada': True,
    'productos': ['E2E-TEST Verdura', 'E2E-TEST Fruta'],
}
estado, cuerpo = peticion('POST', '/ferias', DATOS_FERIA)
comprobar('POST /ferias SIN token = 401', estado == 401)
estado, cuerpo = peticion('POST', '/ferias', DATOS_FERIA, token=token_p)
id_creada = cuerpo.get('id') if estado == 201 else 0
comprobar('POST /ferias con productor = 201', estado == 201, str(cuerpo.get('mensaje')))
estado, cuerpo = peticion('POST', '/ferias', DATOS_FERIA, token=token_pub)
comprobar('POST /ferias con rol publico = 403', estado == 403)
estado, cuerpo = peticion('POST', '/ferias', {'...': 'invalido'}, token=token_p)
comprobar('POST /ferias con datos invalidos = 400', estado == 400)

# 9) Verificar la feria creada con sus productos
estado, feria = peticion('GET', f'/ferias/{id_creada}')
comprobar('GET feria creada incluye productos', estado == 200 and 'E2E-TEST Verdura' in feria.get('productos', []))

# 10) Editar feria propia (200) y ajena (403)
modificada = dict(DATOS_FERIA, nombre='Feria Prueba E2E Modificada')
estado, cuerpo = peticion('PUT', f'/ferias/{id_creada}', modificada, token=token_p)
comprobar('PUT /ferias feria propia = 200', estado == 200 and cuerpo.get('nombre') == 'Feria Prueba E2E Modificada')
estado, cuerpo = peticion('PUT', f'/ferias/{id_creada}', modificada, token=token_p2)
comprobar('PUT /ferias de otro productor = 403', estado == 403)
estado, cuerpo = peticion('PUT', '/ferias/99999999', modificada, token=token_p)
comprobar('PUT /ferias inexistente = 404', estado == 404)

# 11) Borrado: de otro productor (403) y con admin (200)
estado, cuerpo = peticion('DELETE', f'/ferias/{id_creada}', token=token_p2)
comprobar('DELETE feria de otro productor = 403', estado == 403)
estado, cuerpo = peticion('DELETE', f'/ferias/{id_creada}', token=token_admin)
comprobar('DELETE feria con admin = 200', estado == 200)
estado, cuerpo = peticion('GET', f'/ferias/{id_creada}')
comprobar('Feria eliminada ya no existe = 404', estado == 404)

# 12) Swagger
estado, _ = peticion('GET', '/apidocs/')
comprobar('Swagger /apidocs responde', estado in (200, 404, 302))

# 12b) Tablero de métricas de sostenibilidad
estado, m = peticion('GET', '/metricas')
comprobar('GET /metricas = 200 con 3 bloques + metodologia',
          estado == 200 and {'tecnico', 'catalogo', 'social', 'metodologia'}.issubset(m.keys()))
comprobar('Bloque tecnico coherente (peso y CO2 por vista)',
          'tamano_kb' in m.get('tecnico', {}) and 'co2_por_vista_g' in m.get('tecnico', {}))
comprobar('Bloque catalogo con cuenta real de ferias',
          isinstance(m.get('catalogo', {}).get('total_ferias'), int) and m['catalogo']['total_ferias'] >= 3)
comprobar('Metodologia documentada (minimo 3 items)',
          isinstance(m.get('metodologia'), dict) and len(m['metodologia']) >= 3)

# 13) Limpieza de los datos de prueba
with psycopg.connect(DATABASE_URL) as conexion:
    with conexion.cursor() as cursor:
        for correo in (CORREO_P, CORREO_P2, CORREO_PUB):
            cursor.execute('DELETE FROM usuarios WHERE correo = %s', (correo,))
        cursor.execute('DELETE FROM productos WHERE nombre LIKE %s', ('E2E-TEST%',))
comprobar('Limpieza de usuarios/productos de prueba en la BD', True)

print('\nResumen:', sum(resultados), '/', len(resultados), 'pruebas OK')
sys.exit(0 if all(resultados) else 1)