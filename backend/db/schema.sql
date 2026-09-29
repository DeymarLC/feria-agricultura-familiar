-- ============================================================
-- schema.sql — Esquema relacional de la "Feria de Agricultura
-- Familiar" (PostgreSQL).
--
-- Entidades: usuarios, ferias, productos y la tabla puente
-- feria_productos (relación N:M entre ferias y productos).
-- Cada tabla tiene claves foráneas (FK) e índices en las columnas
-- más consultadas para rendimiento.
--
-- Ejecutar con:  python scripts/init_db.py  (lo hace automáticamente)
-- o manualmente con:  psql -f db/schema.sql $DATABASE_URL
-- ============================================================

-- 1) USUARIOS ---------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    correo        VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    rol           VARCHAR(20)  NOT NULL DEFAULT 'publico'
                  CHECK (rol IN ('admin', 'productor', 'publico')),
    creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para búsquedas rápidas por correo (login).
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios (correo);

-- 2) FERIAS -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ferias (
    id              SERIAL PRIMARY KEY,
    -- Clave foránea: cada feria pertenece a un productor (usuario).
    productor_id    INTEGER      NOT NULL REFERENCES usuarios(id)
                                  ON DELETE CASCADE,
    nombre          VARCHAR(150) NOT NULL,
    ubicacion       VARCHAR(200) NOT NULL,
    fecha_inicio    DATE         NOT NULL,
    fecha_fin       DATE         NOT NULL,
    descripcion     TEXT,
    correo_contacto VARCHAR(150) NOT NULL,
    horario         VARCHAR(120),
    organizador     VARCHAR(150),
    imagen_url      VARCHAR(255),
    destacada       BOOLEAN      NOT NULL DEFAULT FALSE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índices para los filtros más comunes del catálogo.
CREATE INDEX IF NOT EXISTS idx_ferias_fecha_inicio ON ferias (fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_ferias_ubicacion    ON ferias (ubicacion);
CREATE INDEX IF NOT EXISTS idx_ferias_productor    ON ferias (productor_id);

-- 3) PRODUCTOS --------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id        SERIAL PRIMARY KEY,
    nombre    VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(50)  NOT NULL DEFAULT 'General'
);

CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (nombre);

-- 4) FERIA_PRODUCTOS (tabla puente N:M) -------------------------
CREATE TABLE IF NOT EXISTS feria_productos (
    feria_id    INTEGER NOT NULL REFERENCES ferias(id)    ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    PRIMARY KEY (feria_id, producto_id)
);

-- Índices para resolver la relación desde cada lado.
CREATE INDEX IF NOT EXISTS idx_fp_producto ON feria_productos (producto_id);