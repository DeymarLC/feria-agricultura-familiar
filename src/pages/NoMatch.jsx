import { Link } from 'react-router-dom'

/**
 * NoMatch — Página 404 accesible con alternativa de navegación.
 */
export default function NoMatch() {
  return (
    <main id="contenido" className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
      <p className="text-5xl" aria-hidden="true">🌾</p>
      <h1 className="mt-4 text-3xl font-extrabold text-tierra-900">
        Página no encontrada
      </h1>
      <p className="mt-3 max-w-md text-tierra-600">
        La dirección que buscas no existe o fue movida. Vuelve al inicio para seguir explorando ferias.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-verde-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-verde-800"
      >
        Ir al inicio
      </Link>
    </main>
  )
}