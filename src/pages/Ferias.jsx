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
        <header className="mb-8">
          <h1 id="titulo-catalogo" className="text-3xl font-extrabold text-tierra-900">
            Catálogo de ferias
          </h1>
          <p className="mt-2 max-w-2xl text-tierra-600">
            Explora las ferias de agricultura familiar de Santa Cruz, Bolivia. Cada
            tarjeta agrupa la información principal y un enlace a su ficha completa.
          </p>
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
        )}
      </section>
    </main>
  )
}