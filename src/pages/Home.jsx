import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FeriasCard from '../components/FeriasCard.jsx'
import { obtenerFerias } from '../services/feriasApi.js'

/**
 * Home — Página de inicio con hero y ferias destacadas.
 * Los datos se cargan desde la API (JSON Server) al montar el componente.
 * El estado `intento` permite reintentar la carga desde el mismo efecto.
 */
export default function Home() {
  const [ferias, setFerias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let activo = true
    obtenerFerias()
      .then((datos) => {
        if (!activo) return
        // Solo las marcadas como destacadas en el catálogo (máx. 3)
        setFerias(datos.filter((f) => f.destacada).slice(0, 3))
      })
      .catch(() => {
        if (activo) {
          setError('No se pudieron cargar las ferias. Verifica que el servidor esté encendido (npm run server).')
        }
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    // Evita actualizar estado de un componente desmontado
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
      {/* Hero */}
      <section aria-labelledby="titulo-inicio" className="rounded-3xl bg-verde-800 px-6 py-12 text-center text-white sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-verde-100">
          Agricultura familiar campesina de Santa Cruz, Bolivia
        </p>
        <h1 id="titulo-inicio" className="mx-auto mt-3 max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          Productos frescos, de temporada y con origen local
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-verde-100 sm:text-lg">
          Conoce las ferias de la agricultura familiar cruceña: un espacio donde
          productores y consumidores se encuentran cada semana.
        </p>
        <Link
          to="/ferias"
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-marfil px-6 py-3 font-semibold text-verde-800 transition-colors hover:bg-verde-100"
        >
          Ver catálogo de ferias
        </Link>
      </section>

      {/* Vista previa de las ferias destacadas */}
      <section aria-labelledby="titulo-destacadas" className="mt-12">
        <h2 id="titulo-destacadas" className="text-2xl font-bold text-tierra-900">
          Ferias destacadas
        </h2>

        {/* Cargando: región live para lectores de pantalla */}
        {cargando && (
          <p role="status" className="mt-6 text-tierra-600">
            Cargando ferias…
          </p>
        )}

        {/* Error: se anuncia con role="alert" y ofrece reintentar */}
        {!cargando && error && (
          <div role="alert" className="mt-6 rounded-xl border border-red-600 bg-red-50 p-4 text-red-800">
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

        {/* Contenido */}
        {!cargando && !error && ferias.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ferias.map((feria) => (
              <FeriasCard key={feria.id} feria={feria} />
            ))}
          </div>
        )}

        {/* Vacío */}
        {!cargando && !error && ferias.length === 0 && (
          <p className="mt-6 text-tierra-600">Aún no hay ferias destacadas registradas.</p>
        )}
      </section>

      {/* Beneficios en fila de tarjetas */}
      <section aria-labelledby="titulo-beneficios" className="mt-14">
        <h2 id="titulo-beneficios" className="sr-only">
          Beneficios de las ferias de agricultura familiar
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {[
            { icono: '🌱', titulo: 'Producción sustentable', texto: 'Prácticas que cuidan el suelo y el agua.' },
            { icono: '🤝', titulo: 'Precios justos', texto: 'Venta directa sin intermediarios.' },
            { icono: '📅', titulo: 'Todas las temporadas', texto: 'Productos según la estación del año.' },
          ].map((beneficio) => (
            <li
              key={beneficio.titulo}
              className="rounded-2xl border border-tierra-100 bg-marfil p-6 text-center shadow-sm"
            >
              <span aria-hidden="true" className="text-3xl">{beneficio.icono}</span>
              <h3 className="mt-3 text-lg font-bold text-tierra-900">{beneficio.titulo}</h3>
              <p className="mt-1 text-sm text-tierra-600">{beneficio.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}