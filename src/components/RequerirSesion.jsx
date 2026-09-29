import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

/**
 * RequerirSesion — Guard de rutas protegidas.
 *
 * - Mientras se valida la sesión carga nota a los lectores (role="status").
 * - Sin sesión → redirige a /ingresar guardando la URL de origen (state.desde)
 *   para que el login devuelva al usuario donde estaba (WCAG 3.2.5).
 * - Con sesión pero sin el rol requerido → mensaje accesible indicando
 *   que se requiere rol productor o administrador.
 *
 * Uso: <RequerirSesion roles={['admin','productor']}> <Pagina /> </RequerirSesion>
 */
export default function RequerirSesion({ roles = [], children }) {
  const { usuario, token, cargando } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <main id="contenido" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <p role="status" className="text-tierra-600">
          Verificando tu sesión…
        </p>
      </main>
    )
  }

  if (!token) {
    const origen = `${ubicacion.pathname}${ubicacion.search}`
    return <Navigate to="/ingresar" replace state={{ desde: origen }} />
  }

  if (roles.length > 0 && !roles.includes(usuario?.rol)) {
    return (
      <main id="contenido" className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <section
          role="alert"
          aria-labelledby="titulo-sin-permisos"
          className="rounded-3xl border border-tierra-100 bg-marfil p-8 text-center shadow-sm"
        >
          <h1 id="titulo-sin-permisos" className="text-2xl font-bold text-tierra-900">
            Se requiere un rol de productor o administrador
          </h1>
          <p className="mt-3 text-tierra-600">
            La cuenta <strong>{usuario?.correo}</strong> tiene el rol{' '}
            <strong>{usuario?.rol}</strong>, que no puede publicar ferias. Puedes seguir
            explorando el catálogo o cambiar de cuenta.
          </p>
          <Link
            to="/ferias"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-verde-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-verde-800"
          >
            Explorar catálogo de ferias
          </Link>
        </section>
      </main>
    )
  }

  return children
}