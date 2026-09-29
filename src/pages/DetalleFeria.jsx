import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerFeriaPorId } from '../services/feriasApi.js'

/**
 * DetalleFeria — Ficha individual de una feria (ruta /ferias/:id).
 *
 * - Carga la feria por su id con estados de carga, error y "no encontrada".
 * - Estructura semántica: <main> → <article> → <section aria-labelledby>.
 * - Enlace "Volver al catálogo" para navegación de respaldo.
 */
export default function DetalleFeria() {
  const { id } = useParams()
  const [feria, setFeria] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true
    obtenerFeriaPorId(id)
      .then((datos) => {
        if (activo) setFeria(datos)
      })
      .catch(() => {
        if (activo) setError('No se pudo cargar la información de esta feria.')
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [id])

  return (
    <main id="contenido" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Navegación de respaldo */}
      <nav aria-label="Migajas de pan" className="text-sm text-tierra-600">
        <Link to="/ferias" className="hover:text-verde-700">
          ← Volver al catálogo
        </Link>
      </nav>

      {/* Cargando */}
      {cargando && (
        <p role="status" className="mt-8 text-tierra-600">
          Cargando feria…
        </p>
      )}

      {/* Error */}
      {!cargando && error && (
        <div role="alert" className="mt-8 rounded-xl border border-red-600 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {/* No encontrada */}
      {!cargando && !error && !feria && (
        <section aria-labelledby="titulo-no-encontrada" className="mt-8 rounded-2xl border border-tierra-100 bg-marfil p-8 text-center">
          <h1 id="titulo-no-encontrada" className="text-2xl font-bold text-tierra-900">
            Feria no encontrada
          </h1>
          <p className="mt-2 text-tierra-600">
            La feria que buscas no existe o fue eliminada del catálogo.
          </p>
          <Link
            to="/ferias"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-verde-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-verde-800"
          >
            Explorar catálogo de ferias
          </Link>
        </section>
      )}

      {/* Ficha completa */}
      {!cargando && !error && feria && (
        <article aria-labelledby="titulo-feria" className="mt-6 overflow-hidden rounded-3xl border border-tierra-100 bg-marfil shadow-sm">
          {/* Imagen principal */}
          <img
            src={feria.imagen}
            alt={`Vista general de la feria ${feria.nombre} en ${feria.ubicacion}`}
            className="h-64 w-full object-cover sm:h-80"
          />

          <div className="p-6 sm:p-8">
            {/* Fecha legible con formato ISO */}
            <time
              dateTime={feria.fechaISO}
              className="inline-block rounded-full bg-verde-500/10 px-3 py-1 text-sm font-semibold text-verde-700"
            >
              {feria.fecha}
            </time>

            <h1 id="titulo-feria" className="mt-4 text-3xl font-extrabold text-tierra-900">
              {feria.nombre}
            </h1>

            {/* Datos generales */}
            <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-tierra-50 p-4">
                <dt className="font-semibold text-tierra-900">📍 Localización</dt>
                <dd className="mt-1 text-tierra-700">{feria.ubicacion}</dd>
              </div>
              <div className="rounded-xl bg-tierra-50 p-4">
                <dt className="font-semibold text-tierra-900">🕐 Horario</dt>
                <dd className="mt-1 text-tierra-700">{feria.horario}</dd>
              </div>
              <div className="rounded-xl bg-tierra-50 p-4">
                <dt className="font-semibold text-tierra-900">👨‍🌾 Organizador</dt>
                <dd className="mt-1 text-tierra-700">{feria.organizador}</dd>
              </div>
              <div className="rounded-xl bg-tierra-50 p-4">
                <dt className="font-semibold text-tierra-900">✉️ Contacto</dt>
                <dd className="mt-1 text-tierra-700">{feria.correo}</dd>
              </div>
            </dl>

            {/* Descripción */}
            <section aria-labelledby="titulo-descripcion" className="mt-8">
              <h2 id="titulo-descripcion" className="text-xl font-bold text-tierra-900">
                Sobre esta feria
              </h2>
              <p className="mt-3 leading-relaxed text-tierra-700">{feria.descripcion}</p>
            </section>

            {/* Productos disponibles */}
            <section aria-labelledby="titulo-productos" className="mt-8">
              <h2 id="titulo-productos" className="text-xl font-bold text-tierra-900">
                Productos disponibles
              </h2>
              {feria.productos.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Productos disponibles">
                  {feria.productos.map((producto) => (
                    <li key={producto}>
                      <span className="rounded-md bg-tierra-100 px-3 py-1 text-sm font-medium text-tierra-800">
                        {producto}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-tierra-600">Por confirmar por los organizadores.</p>
              )}
            </section>
          </div>
        </article>
      )}
    </main>
  )
}