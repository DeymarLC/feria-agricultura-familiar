"""
config.py — Configuración de la aplicación.

Todas las variables sensibles se leen desde variables de entorno
(preferentemente un archivo .env cargado por python-dotenv).
Nunca se harcodean secretos en el código. Esta es una buena práctica
del checklist OWASP: config externalizada.
"""
import os

from dotenv import load_dotenv

# Carga el archivo .env del directorio del backend (si existe).
load_dotenv()


class Config:
    """Configuración central de la API Flask."""

    FLASK_ENV = os.getenv('FLASK_ENV', 'production')

    SECRET_KEY = os.getenv('SECRET_KEY', '')
    JWT_SECRET = os.getenv('JWT_SECRET', '')
    # Cadena de conexión a PostgreSQL
    DATABASE_URL = os.getenv('DATABASE_URL', '')

    # Tiempo de vida del token de acceso (minutos)
    JWT_EXPIRES_MINUTES = int(os.getenv('JWT_EXPIRES_MINUTES', '60'))

    # Orígenes permitidos para CORS.
    # El valor llega como cadena separada por comas → lista.
    # Si en producción se usa "*" esta configuración lo REEMPLAZA por
    # una lista vacía (comportamiento seguro por defecto).
    CORS_ORIGINS = [
        origen.strip()
        for origen in os.getenv('CORS_ORIGINS', '').split(',')
        if origen.strip() and origen.strip() != '*'
    ]

    # Sin los orígenes permitidos, la API no acepta llamadas del navegador.
    # (En pruebas locales se define http://localhost:5173 en el .env).
    assert CORS_ORIGINS, 'CORS_ORIGINS no puede estar vacío ni usar "*" en producción.'