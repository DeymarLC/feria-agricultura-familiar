import { useEffect, useState } from 'react'
import FeriasCard from '../components/FeriasCard.jsx'
import { obtenerFerias } from '../services/feriasApi.js'

/**
 * Ferias — Catálogo completo de ferias, cargado desde la API.
 * Estados accesibles de carga, error y vacío.
 */
export default function Ferias() {
  const [ferias, setFerias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    obtenerFerias()
      .then((datos) => {
        if (activo) setFerias(datos)
      })
      .catch(() => {
        if (activo) {
          setError('No se pudieron cargar las ferias. Verifica que el servidor esté encendido (npm run server).')
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [intento])

  const reintentar = () => {
    setCargando(true)
    setError(null)
    setIntento((n) => n + 1)
  }

  return (
    <main id="contenido" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section aria-labelledby="titulo-catalogo">
        <header className="marca animar-entrada relative isolate mb-10 overflow-hidden rounded-[2rem] px-6 py-10 text-white shadow-xl sm:px-10 sm:py-12">
          <span aria-hidden="true" className="halo -right-10 -top-16 h-56 w-56 bg-sol-500" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-widest text-verde-100">
              Del productor a tu mesa
            </p>
            <h1
              id="titulo-catalogo"
              className="mt-2 text-3xl font-black tracking-tight sm:text-4xl"
            >
              Catálogo de ferias
            </h1>
            <p className="mt-3 max-w-2xl text-verde-50">
              Explora las ferias de la agricultura familiar de Santa Cruz, Bolivia. Cada
              tarjeta muestra la fecha, el lugar y los productos disponibles.
            </p>
            {!cargando && !error && ferias.length > 0 && (
              <p className="mt-5 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur">
                {ferias.length} {ferias.length === 1 ? 'feria disponible' : 'ferias disponibles'}
              </p>
            )}
          </div>
        </header>

        {/* Cargando */}
        {cargando && (
          <p role="status" className="text-tierra-600">
            Cargando ferias…
          </p>
        )}

        {/* Error */}
        {!cargando && error && (
          <div role="alert" className="rounded-xl border border-red-600 bg-red-50 p-4 text-red-800">
            <p className="font-medium">{error}</p>
            <button
              type="button"
              onClick={reintentar}
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Vacío */}
        {!cargando && !error && ferias.length === 0 && (
          <p className="text-tierra-600">Aún no hay ferias registradas. Sé la primera persona en registrar una.</p>
        )}

        {/* Grilla de tarjetas */}
        {!cargando && !error && ferias.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ferias.map((feria) => (
              <FeriasCard key={feria.id} feria={feria} />
            ))}
          </div>
        )}      </section>
    </main>
  )
}