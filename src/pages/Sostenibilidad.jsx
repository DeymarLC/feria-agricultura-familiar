import { useEffect, useState } from 'react'
import { obtenerMetricas } from '../services/feriasApi.js'

/**
 * Sustenta el número usando formato español (es-BO).
 */
const formatearNumero = (valor) =>
  new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 }).format(valor || 0)

/**
 * Sostenibilidad — Tablero de métricas de sostenibilidad (3 bloques).
 *
 * - técnico:  peso del sitio compilado y CO₂ estimado por visita.
 * - catálogo: conteo real de ferias, productores y productos (PostgreSQL).
 * - social:   km y CO₂ estimados evitados por el consumo de proximidad.
 *
 * Accesibilidad: <dl> para nombre→valor, role="status" durante la carga,
 * role="alert" en errores y <details> para la metodología.
 */
export default function Sostenibilidad() {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    obtenerMetricas()
      .then((respuesta) => {
        if (activo) setDatos(respuesta)
      })
      .catch(() => {
        if (activo) {
          setError('No se pudieron cargar las métricas. Verifica que el servidor esté encendido (npm run server).')
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

  const kab =
    datos?.tecnico.tamano_kb >= 1024
      ? `${formatearNumero(datos.tecnico.tamano_kb / 1024)} MB`
      : `${formatearNumero(datos.tecnico.tamano_kb)} KB`

  return (
    <main id="contenido" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <section aria-labelledby="titulo-sostenibilidad">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-verde-700">
            Tablero de impacto
          </p>
          <h1 id="titulo-sostenibilidad" className="mt-1 text-3xl font-extrabold text-tierra-900">
            Sostenibilidad en tres dimensiones
          </h1>
          <p className="mt-2 max-w-2xl text-tierra-600">
            Métricas del sitio y del impacto del comercio de proximidad. Los cálculos
            usan metodologías documentadas (Website Carbon Calculator y factores de
            distribución local); los conteos del catálogo se leen de la base en vivo.
          </p>
        </header>

        {cargando && (
          <p role="status" className="text-tierra-600">
            Cargando métricas…
          </p>
        )}

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

        {!cargando && !error && datos && (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* ------- Bloque técnico ------- */}
              <section
                aria-labelledby="titulo-tecnico"
                className="rounded-2xl border border-tierra-100 bg-white p-6 shadow-sm"
              >
                <h2 id="titulo-tecnico" className="text-xl font-bold text-verde-700">
                  Impacto técnico del sitio
                </h2>
                <dl className="mt-4 space-y-3">
                  <div className="flex items-baseline justify-between gap-4 border-b border-tierra-100 pb-2">
                    <dt className="text-sm font-medium text-tierra-600">Peso de la aplicación</dt>
                    <dd className="text-xl font-extrabold text-tierra-900">{kab}</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-tierra-100 pb-2">
                    <dt className="text-sm font-medium text-tierra-600">Archivos publicados</dt>
                    <dd className="text-xl font-extrabold text-tierra-900">
                      {formatearNumero(datos.tecnico.num_archivos)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm font-medium text-tierra-600">
                      CO₂ estimado por visita
                    </dt>
                    <dd className="text-xl font-extrabold text-tierra-900">
                      {formatearNumero(datos.tecnico.co2_por_vista_g)} g
                    </dd>
                  </div>
                </dl>
              </section>

              {/* ------- Bloque catálogo ------- */}
              <section
                aria-labelledby="titulo-catalogo"
                className="rounded-2xl border border-tierra-100 bg-white p-6 shadow-sm"
              >
                <h2 id="titulo-catalogo" className="text-xl font-bold text-verde-700">
                  Catálogo en vivo
                </h2>
                <dl className="mt-4 space-y-3">
                  <div className="flex items-baseline justify-between gap-4 border-b border-tierra-100 pb-2">
                    <dt className="text-sm font-medium text-tierra-600">Ferias registradas</dt>
                    <dd className="text-xl font-extrabold text-tierra-900">
                      {formatearNumero(datos.catalogo.total_ferias)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-tierra-100 pb-2">
                    <dt className="text-sm font-medium text-tierra-600">Productoras y productores</dt>
                    <dd className="text-xl font-extrabold text-tierra-900">
                      {formatearNumero(datos.catalogo.total_productores)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-tierra-100 pb-2">
                    <dt className="text-sm font-medium text-tierra-600">Productos del catálogo</dt>
                    <dd className="text-xl font-extrabold text-tierra-900">
                      {formatearNumero(datos.catalogo.total_productos)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm font-medium text-tierra-600">Ferias próximas</dt>
                    <dd className="text-xl font-extrabold text-tierra-900">
                      {formatearNumero(datos.catalogo.proximas_ferias)}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* ------- Bloque social ------- */}
              <section
                aria-labelledby="titulo-social"
                className="rounded-2xl border border-tierra-100 bg-white p-6 shadow-sm"
              >
                <h2 id="titulo-social" className="text-xl font-bold text-verde-700">
                  Impacto del comercio local
                </h2>
                <dl className="mt-4 space-y-3">
                  <div className="flex items-baseline justify-between gap-4 border-b border-tierra-100 pb-2">
                    <dt className="text-sm font-medium text-tierra-600">
                      Productos comercializados
                    </dt>
                    <dd className="text-xl font-extrabold text-tierra-900">
                      {formatearNumero(datos.social.productos_comercializados)}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 border-b border-tierra-100 pb-2">
                    <dt className="text-sm font-medium text-tierra-600">
                      Km de transporte evitados
                    </dt>
                    <dd className="text-xl font-extrabold text-tierra-900">
                      {formatearNumero(datos.social.km_estimados_evitados)} km
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm font-medium text-tierra-600">
                      CO₂ estimado evitado
                    </dt>
                    <dd className="text-xl font-extrabold text-tierra-900">
                      {formatearNumero(datos.social.co2_estimado_evitado_kg)} kg
                    </dd>
                  </div>
                </dl>
              </section>
            </div>

            {/* ------- Metodología ------- */}
            <details className="mt-8 rounded-2xl border border-tierra-100 bg-marfil p-6">
              <summary className="cursor-pointer text-base font-semibold text-verde-700">
                Metodología de cálculo
              </summary>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-tierra-600">
                {Object.entries(datos.metodologia).map(([clave, descripcion]) => (
                  <li key={clave}>
                    <span className="font-medium text-tierra-800">
                      {clave.replace('_', ' ')}:
                    </span>{' '}
                    {descripcion}
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}
      </section>
    </main>
  )
}