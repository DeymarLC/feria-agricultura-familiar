-- ============================================================
-- rls.sql — Row Level Security (RLS) para PostgreSQL / Supabase.
--
-- RLS permite filtrar filas a NIVEL DE LA BASE DE DATOS según el
-- usuario conectado: aunque la aplicación cometa un error y pida
-- datos de otra tabla, PostgreSQL solo devuelve lo permitido.
-- (Defensa en profundidad — principio OWASP.)
--
-- ⚠ ADAPTACIÓN IMPORTANTE:
--   * SUPABASE: usa `auth.uid()` (el id del usuario autenticado de
--     Supabase Auth) y `auth.role()`.
--   * RENDER (PostgreSQL plano): no existe auth.uid(). El patrón
--     equivalente es pasar el id por sesión:
--         SELECT set_config('app.usuario_id', '7', false);
--     y usarlo como:  (SELECT current_setting('app.usuario_id', true)::int)
--
-- Este script está pensado para SUPABASE. Para Render, reemplaza
-- auth.uid() por la lectura de la sesión indicada arriba y crea un
-- rol postgres `authenticated` con los permisos de SELECT/INSERT/
-- UPDATE/DELETE sobre el esquema `public`.
-- ------------------------------------------------------------

-- 1) Habilitar RLS en cada tabla protegida.
ALTER TABLE ferias        ENABLE ROW LEVEL SECURITY;
ALTER TABLE feria_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios      ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- FERIAS
-- ------------------------------------------------------------

-- Cualquier persona (incluso anónima) puede LEER el catálogo.
DROP POLICY IF EXISTS ferias_politica_lectura ON ferias;
CREATE POLICY ferias_politica_lectura ON ferias
    FOR SELECT
    USING (true);

-- Un productor autenticado puede CREAR una feria asignándose como dueño.
DROP POLICY IF EXISTS ferias_politica_insercion ON ferias;
CREATE POLICY ferias_politica_insercion ON ferias
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Solo el dueño (o admin) puede EDITAR la feria: la fila solo se
-- devuelve al UPDATE si productor_id == id del usuario autenticado.
DROP POLICY IF EXISTS ferias_politica_edicion ON ferias;
CREATE POLICY ferias_politica_edicion ON ferias
    FOR UPDATE
    USING (productor_id = auth.uid());

-- Solo el dueño puede ELIMINAR.
DROP POLICY IF EXISTS ferias_politica_eliminacion ON ferias;
CREATE POLICY ferias_politica_eliminacion ON ferias
    FOR DELETE
    USING (productor_id = auth.uid());

-- ------------------------------------------------------------
-- PRODUCTOS
-- ------------------------------------------------------------

-- Lectura pública.
DROP POLICY IF EXISTS productos_politica_lectura ON productos;
CREATE POLICY productos_politica_lectura ON productos
    FOR SELECT
    USING (true);

-- Solo usuarios autenticados pueden crear productos.
DROP POLICY IF EXISTS productos_politica_insercion ON productos;
CREATE POLICY productos_politica_insercion ON productos
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- FERIA_PRODUCTOS (tabla puente): lectura pública e inserciones
-- solo de usuarios autenticados.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS feria_productos_politica_lectura ON feria_productos;
CREATE POLICY feria_productos_politica_lectura ON feria_productos
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS feria_productos_politica_insercion ON feria_productos;
CREATE POLICY feria_productos_politica_insercion ON feria_productos
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ------------------------------------------------------------
-- USUARIOS: bloqueo de lectura total (nadie lee hashes ajenos).
-- Con RLS activo y SIN política de SELECT, las consultas devuelven 0 filas.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS usuarios_politica_lectura ON usuarios;
CREATE POLICY usuarios_politica_lectura ON usuarios
    FOR SELECT
    USING (id = auth.uid());