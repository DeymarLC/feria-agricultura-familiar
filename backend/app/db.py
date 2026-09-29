"""
db.py — Capa de acceso a la base de datos PostgreSQL con psycopg.

REGLAS DE SEGURIDAD (OWASP):
- TODAS las consultas deben escribir el SQL como cadena y pasar los
  datos como parámetros: cur.execute(sql, (param1, param2)).
- NUNCA concatenar valores directamente en el SQL (ej. f"...{valor}...").
  Eso abre la puerta a inyección SQL.
- psycopg se encarga de escapar y tipificar los parámetros 'portador %s'.
"""
import psycopg
from contextlib import contextmanager
from flask import current_app
from psycopg.rows import dict_row


def _conexion():
    """Abre una conexión a PostgreSQL con los resultados como diccionarios."""
    return psycopg.connect(
        current_app.config['DATABASE_URL'],
        row_factory=dict_row,
    )


@contextmanager
def transaccion():
    """
    Gestor de contexto para operaciones que tocan VARIAS tablas.
    Garantiza atomicidad: si algo falla, todo se revierte.

    Uso:
        with transaccion() as conexion:
            with conexion.cursor() as cursor:
                cursor.execute(...)
    """
    conexion = _conexion()
    try:
        # "with conexion" confirma los cambios si no hubo errores y
        # hace rollback automático si se lanza una excepción.
        with conexion:
            yield conexion
    finally:
        conexion.close()


def consultar(consulta, parametros=()):
    """Ejecuta un SELECT y devuelve una lista de filas (dicts)."""
    with _conexion() as conexion:
        with conexion.cursor() as cursor:
            cursor.execute(consulta, parametros)
            return cursor.fetchall()


def consultar_una(consulta, parametros=()):
    """Ejecuta un SELECT y devuelve la primera fila (dict) o None."""
    filas = consultar(consulta, parametros)
    return filas[0] if filas else None


def ejecutar(consulta, parametros=()):
    """Ejecuta un INSERT/UPDATE/DELETE y confirma la transacción."""
    with _conexion() as conexion:
        with conexion.cursor() as cursor:
            cursor.execute(consulta, parametros)
        conexion.commit()


def ejecutar_return(consulta, parametros=()):
    """
    Ejecuta un INSERT/UPDATE ... RETURNING y devuelve la fila resultante.
    Útil para obtener el id autogenerado: cur.execute(..., ('RETURNING id')).
    """
    with _conexion() as conexion:
        with conexion.cursor() as cursor:
            cursor.execute(consulta, parametros)
            fila = cursor.fetchone()
        conexion.commit()
        return fila