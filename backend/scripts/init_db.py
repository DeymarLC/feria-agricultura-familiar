"""
init_db.py — Inicializa la base de datos de la API.

Qué hace (de forma idempotente — puede ejecutarse varias veces):
    1. Crea las tablas a partir de db/schema.sql.
    2. Crea usuarios demo (admin y productor) si la tabla está vacía.
    3. Siembra las ferias de Santa Cruz + sus productos de ejemplo.

Uso:
    python scripts/init_db.py

Requiere que DATABASE_URL esté definido en backend/.env o en el entorno
(Render lo inyecta automáticamente en el build).
"""
import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Ruta raíz del backend (la carpeta que contiene app/, db/, scripts/).
RUTA_BACKEND = Path(__file__).resolve().parent.parent

# Carga backend/.env si existe.
load_dotenv(RUTA_BACKEND / '.env')

DATABASE_URL = os.getenv('DATABASE_URL', '')

USUARIOS_DEMO = [
    {
        'nombre': 'Administrador General',
        'correo': 'admin@feria.bo',
        'password': 'Admin123!',
        'rol': 'admin',
    },
    {
        'nombre': 'Productor Santa Cruz',
        'correo': 'productor@feria.bo',
        'password': 'Productor123!',
        'rol': 'productor',
    },
]

FERIAS_DEMO = [
    {
        'nombre': 'Feria Agroecológica del Mercado Mutualista',
        'ubicacion': 'Mercado Mutualista, Av. Banzer, Santa Cruz de la Sierra',
        'fecha_inicio': '2026-10-24',
        'fecha_fin': '2026-10-24',
        'descripcion': 'Encuentro semanal de productores ecológicos de Santa Cruz. '
                       'Hortalizas frescas, frutas tropicales de estación, miel pura '
                       'y derivados de la colmena en venta directa y sin intermediarios.',
        'correo_contacto': 'agroecologica@mutualista.bo',
        'horario': 'Sábados, de 7:00 a 14:00',
        'organizador': 'Asociación de Productores Ecológicos de Santa Cruz',
        'imagen_url': '/images/feria-1.svg',
        'destacada': True,
        'productos': ['Hortalizas', 'Frutas tropicales', 'Miel y derivados'],
    },
    {
        'nombre': 'Feria de la Agricultura Familiar de Cotoca',
        'ubicacion': 'Plaza 12 de Octubre, Cotoca (Santa Cruz)',
        'fecha_inicio': '2026-11-22',
        'fecha_fin': '2026-11-22',
        'descripcion': 'Feria dominical de las familias campesinas del municipio de '
                       'Cotoca. Yuca, maíz y plátano de la zona, huevos de gallina '
                       'criolla, arroz y productos de la chacra.',
        'correo_contacto': 'feriacotoca@campesino.bo',
        'horario': 'Domingos, de 7:00 a 12:00',
        'organizador': 'Central Campesina de Cotoca',
        'imagen_url': '/images/feria-2.svg',
        'destacada': True,
        'productos': ['Yuca', 'Maíz', 'Plátano', 'Huevos', 'Arroz'],
    },
    {
        'nombre': 'Feria Campesina de los Valles de Vallegrande',
        'ubicacion': 'Parque Central, Vallegrande (Santa Cruz)',
        'fecha_inicio': '2026-12-12',
        'fecha_fin': '2026-12-13',
        'descripcion': 'Celebración de productores de los valles cruceños: hortalizas '
                       'de altura, maíz, queso casero, miel y el tradicional vino de '
                       'mísike elaborado por las familias del valle.',
        'correo_contacto': 'valles@vallegrande.bo',
        'horario': 'Sábado y domingo, de 8:00 a 16:00',
        'organizador': 'Asociación de Productores del Valle Vallegrandino',
        'imagen_url': '/images/feria-3.svg',
        'destacada': True,
        'productos': ['Hortalizas', 'Maíz', 'Queso', 'Miel', 'Vino de mísike'],
    },
]


def leer_schema():
    """Lee el contenido del archivo db/schema.sql como texto."""
    with open(RUTA_BACKEND / 'db' / 'schema.sql', encoding='utf-8') as archivo:
        return archivo.read()


def crear_schema(conexion):
    """Ejecuta el DDL. psycopg permite múltiples sentencias separadas por ';'."""
    with conexion.cursor() as cursor:
        cursor.execute(leer_schema())
    print('✔ Tablas creadas/verificadas.')


def sembrar_usuarios(conexion):
    """Inserta los usuarios demo SOLO si la tabla está vacía."""
    with conexion.cursor() as cursor:
        cursor.execute('SELECT COUNT(*) FROM usuarios')
        total = cursor.fetchone()[0]
        if total > 0:
            print('ℹ Usuarios ya existen; no se siembran de nuevo.')
            return {}

        ids = {}
        for usuario in USUARIOS_DEMO:
            cursor.execute(
                """
                INSERT INTO usuarios (nombre, correo, password_hash, rol)
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (
                    usuario['nombre'],
                    usuario['correo'],
                    generate_password_hash(usuario['password']),
                    usuario['rol'],
                ),
            )
            ids[usuario['rol']] = cursor.fetchone()[0]
        print('✔ Usuarios demo creados (admin@feria.bo / productor@feria.bo).')
        return ids


def sembrar_ferias(conexion, id_productor):
    """Inserta ferias de Santa Cruz + sus productos relacionados."""
    with conexion.cursor() as cursor:
        cursor.execute('SELECT COUNT(*) FROM ferias')
        total = cursor.fetchone()[0]
        if total > 0:
            print('ℹ Ferias ya existen; no se siembran de nuevo.')
            return

        for feria in FERIAS_DEMO:
            cursor.execute(
                """
                INSERT INTO ferias (
                    productor_id, nombre, ubicacion, fecha_inicio, fecha_fin,
                    descripcion, correo_contacto, horario, organizador,
                    imagen_url, destacada
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    id_productor, feria['nombre'], feria['ubicacion'],
                    feria['fecha_inicio'], feria['fecha_fin'],
                    feria['descripcion'], feria['correo_contacto'],
                    feria['horario'], feria['organizador'],
                    feria['imagen_url'], feria['destacada'],
                ),
            )
            id_feria = cursor.fetchone()[0]

            for producto in feria['productos']:
                cursor.execute(
                    'INSERT INTO productos (nombre, categoria) VALUES (%s, %s) '
                    'ON CONFLICT (nombre) DO NOTHING',
                    (producto, 'General'),
                )
                cursor.execute(
                    'SELECT id FROM productos WHERE nombre = %s',
                    (producto,),
                )
                id_producto = cursor.fetchone()[0]
                cursor.execute(
                    'INSERT INTO feria_productos (feria_id, producto_id) VALUES (%s, %s) '
                    'ON CONFLICT DO NOTHING',
                    (id_feria, id_producto),
                )
        print('✔ Ferias de Santa Cruz sembradas.')


def main():
    # Evita UnicodeEncodeError cuando la consola usa cp1252 (Windows).
    for flujo in (sys.stdout, sys.stderr):
        try:
            flujo.reconfigure(encoding='utf-8', errors='replace')
        except (AttributeError, ValueError):
            pass

    if not DATABASE_URL:
        print('ERROR: Define DATABASE_URL en backend/.env (ver .env.example).')
        sys.exit(1)

    print('Conectando a PostgreSQL…')
    with psycopg.connect(DATABASE_URL) as conexion:
        crear_schema(conexion)
        ids = sembrar_usuarios(conexion)

        # Para sembrar ferias necesitamos el id del productor demo.
        if not ids:
            with conexion.cursor() as cursor:
                cursor.execute("SELECT id FROM usuarios WHERE rol = 'productor' ORDER BY id LIMIT 1")
                fila = cursor.fetchone()
            id_productor = fila[0] if fila else None
        else:
            id_productor = ids.get('productor')

        if id_productor:
            sembrar_ferias(conexion, id_productor)

    print('✅ Base de datos lista.')


if __name__ == '__main__':
    main()