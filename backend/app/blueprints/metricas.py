"""
metricas.py — Blueprint /api/metricas (tablero de sostenibilidad).

Devuelve tres bloques para el panel /sostenibilidad del frontend:

    1) tecnico   Peso del sitio compilado (dist/) y huella estimada
                 de CO2 por visita (modelo Website Carbon Calculator v3).
    2) catalogo  Conteo real desde PostgreSQL: ferias, productores,
                 productos, destacadas y ubicaciones.
    3) social    Estimaciones de impacto local: productos comercializados,
                 kilómetros de transporte y CO2 estimados evitados por
                 el consumo de proximidad.

METODOLOGIAS (documentadas para el informe de la actividad 4):
    CO2 por vista:
        gCO2e = (bytes_transferidos x 1.9 x 0.000000151) + 0.522
        Modelo del Website Carbon Calculator (Green Web Foundation):
        factor 1.9 por energía no renovable y margen fijo de 0.522 g.

    Transporte evitado:
        km_evitados = ferias_registradas x 35 km promedio
        (estimación académica: distancia típica entre la zona de
        producción y el punto de venta urbano en Santa Cruz).

    CO2 evitado:
        kg_CO2 = km_evitados x 0.16 kgCO2e/km
        (factor de emisión promedio de distribución local de carga
        liviana; referencia IPCC / GLEC).
"""
from pathlib import Path

from flask import Blueprint, jsonify

from ..db import consultar

metricas_bp = Blueprint('metricas', __name__)

# Este archivo vive en backend/app/blueprints/ →
# parents[3] es la raíz del repositorio (donde se genera dist/).
RAIZ_PROYECTO = Path(__file__).resolve().parents[3]
DIR_DIST = RAIZ_PROYECTO / 'dist'

# Constantes de metodología (ver docstring del módulo).
KM_POR_FERIA = 35            # km promedio de "canasta corta"
CO2_POR_KM = 0.16            # kgCO2e por km de distribución local
_ENERGIA_POR_BYTE = 0.000000151  # kWh por byte (Website Carbon v3)
_FACTOR_NO_RENOVABLE = 1.9
_MARGEN_FIJO_G = 0.522


def _peso_sitio():
    """Suma los bytes de todos los archivos publicables (dist/) y los cuenta."""
    total = 0
    num_archivos = 0
    if DIR_DIST.is_dir():
        for archivo in DIR_DIST.rglob('*'):
            if archivo.is_file():
                num_archivos += 1
                total += archivo.stat().st_size
    return total, num_archivos


@metricas_bp.get('')
def metricas():
    """
    Métricas de sostenibilidad
    ---
    tags: [Métricas]
    responses:
      200:
        description: Tres bloques (técnico, catálogo y social) + metodología
        schema:
          type: object
          properties:
            tecnico:
              type: object
              properties:
                tamano_kb: {type: number}
                num_archivos: {type: integer}
                co2_por_vista_g: {type: number}
            catalogo:
              type: object
              properties:
                total_ferias: {type: integer}
                total_productores: {type: integer}
                total_productos: {type: integer}
                destacadas: {type: integer}
                proximas_ferias: {type: integer}
                ubicaciones: {type: array, items: {type: string}}
            social:
              type: object
              properties:
                productos_comercializados: {type: integer}
                km_estimados_evitados: {type: number}
                co2_estimado_evitado_kg: {type: number}
            metodologia:
              type: object
      500:
        description: Error interno del servidor
    """
    # --- Bloque técnico: huella del sitio compilado -------------------
    bytes_totales, num_archivos = _peso_sitio()
    co2_por_vista_g = round(
        (bytes_totales * _FACTOR_NO_RENOVABLE * _ENERGIA_POR_BYTE) + _MARGEN_FIJO_G,
        2,
    )
    tecnico = {
        'tamano_kb': round(bytes_totales / 1024, 1),
        'num_archivos': num_archivos,
        'co2_por_vista_g': co2_por_vista_g,
    }

    # --- Bloque catálogo: conteos reales desde PostgreSQL -------------
    def _contar(sql, parametros=()):
        return consultar(sql, parametros)[0]['n']

    catalogo = {
        'total_ferias': _contar('SELECT COUNT(*) AS n FROM ferias'),
        'total_productores': _contar(
            "SELECT COUNT(*) AS n FROM usuarios WHERE rol IN ('productor', 'admin')"
        ),
        'total_productos': _contar('SELECT COUNT(*) AS n FROM productos'),
        'destacadas': _contar('SELECT COUNT(*) AS n FROM ferias WHERE destacada = TRUE'),
        'proximas_ferias': _contar(
            'SELECT COUNT(*) AS n FROM ferias WHERE fecha_inicio >= CURRENT_DATE'
        ),
        'ubicaciones': [
            fila['ubicacion']
            for fila in consultar(
                'SELECT DISTINCT ubicacion FROM ferias ORDER BY ubicacion'
            )
        ],
    }

    # --- Bloque social: impacto del consumo de proximidad -------------
    km_evitados = round(catalogo['total_ferias'] * KM_POR_FERIA, 1)
    social = {
        'productos_comercializados': catalogo['total_productos'],
        'km_estimados_evitados': km_evitados,
        'co2_estimado_evitado_kg': round(km_evitados * CO2_POR_KM, 1),
    }

    metodologia = {
        'co2_por_vista': 'gCO2e = (bytes x 1.9 x 0.000000151) + 0.522 '
                         '(Website Carbon Calculator, Green Web Foundation)',
        'km_evitados': 'ferias x 35 km promedio (canasta corta, Santa Cruz)',
        'co2_evitado': 'km x 0.16 kgCO2e/km (factor de distribución local)',
    }

    return jsonify({
        'tecnico': tecnico,
        'catalogo': catalogo,
        'social': social,
        'metodologia': metodologia,
    }), 200