import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import FeriasCard from '../components/FeriasCard.jsx'
import { obtenerFerias, obtenerMetricas } from '../services/feriasApi.js'

/**
 * Home — Portada de FeriaCruz.
 *
 * Bloques:
 *  1. Héroe con degradado de marca, halos decorativos y dos llamadas
 *     a la acción (catálogo y publicación de feria).
 *  2. Cifras en vivo: los conteos reales del catálogo y el CO₂ evitado
 *     que calcula el propio backend (`GET /api/metricas`).
 *  3. Ferias destacadas + beneficios.
 *
 * Accesibilidad: un solo <h1>, jerarquía de encabezados correcta,
 * enlaces con texto descriptivo, elementos decorativos con aria-hidden y
 * respeto de `prefers-reduced-motion` en la hoja de estilos.
 */

const formatearNumero = (valor) =>
  new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 }).format(valor || 0)

const BENEFICIOS = [
  {
    icono: '🌱',
    titulo: 'Producción sustentable',
    texto: 'Prácticas agroecológicas que cuidan el suelo, el agua y la biodiversidad.',
  },
  {
    icono: '🤝',
    titulo: 'Precios justos',
    texto: 'Venta directa del productor al consumidor, sin intermediarios.',
  },
  {
    icono: '🧺',
    titulo: 'Producto de temporada',
    texto: 'Hortalizas, frutas, miel, queso y granos cosechados en la región.',
  },
  {
    icono: '📍',
    titulo: 'Cerca de tu casa',
    texto: 'Feras de Santa Cruz con ubicación, horario y fecha de cada evento.',
  },
]

export default function Home() {
  const [ferias, setFerias] = useState([])
  const [metricas, setMetricas] = useState(null)
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
      .catch((fallo) => {
        if (!activo) return
        setError(
          fallo?.status
            ? `La API respondió con el código ${fallo.status}.`
            : 'No se pudo conectar con la API. Revisa tu conexión y presiona "Reintentar".',
        )
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [intento])

  // Las métricas son un extra visual: si fallan, la portada sigue igual.
  useEffect(() => {
    let activo = true
    obtenerMetricas()
      .then((datos) => {
        if (activo) setMetricas(datos)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  const reintentar = () => {
    setCargando(true)
    setError(null)
    setIntento((n) => n + 1)
  }

  const cifras = metricas
    ? [
        { valor: formatearNumero(metricas.catalogo.total_ferias), etiqueta: 'ferias registradas' },
        { valor: formatearNumero(metricas.catalogo.total_productos), etiqueta: 'productos del catálogo' },
        { valor: `${formatearNumero(metricas.social.co2_estimado_evitado_kg)} kg`, etiqueta: 'CO₂ evitado estimado' },
      ]
    : []

  return (
    <main id="contenido" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      {/* ---------------- Héroe ---------------- */}
      <section
        aria-labelledby="titulo-inicio"
        className="marca animar-entrada relative isolate overflow-hidden rounded-[2rem] px-6 py-14 text-white shadow-2xl sm:px-12 sm:py-20"
      >
        {/* Halos decorativos */}
        <span aria-hidden="true" className="halo -left-16 -top-20 h-64 w-64 bg-verde-500" />
        <span aria-hidden="true" className="halo -bottom-24 right-0 h-72 w-72 bg-sol-500" />

        <div className="relative mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-verde-100 backdrop-blur">
            <span aria-hidden="true">🌾</span> Santa Cruz · Bolivia
          </p>

          <h1
            id="titulo-inicio"
            className="texto-marca mt-5 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl"
          >
            FeriaCruz
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-verde-100 sm:text-xl">
            Del campo a tu mesa, directo. Conoce las ferias de la agricultura familiar
            cruceña, sus fechas y sus productos, y publica la tuya en minutos.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/ferias"
              className="relative inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-bold text-verde-800 shadow-lg transition-colors hover:bg-verde-50 sm:w-auto"
            >
              <span className="brillo" aria-hidden="true" />
              Ver catálogo de ferias
            </Link>
            <Link
              to="/registro-feria"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-white/70 px-8 py-3 text-base font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Publicar mi feria
            </Link>
          </div>

          {/* Cifras reales servidas por la API */}
          {cifras.length > 0 && (
            <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {cifras.map((cifra) => (
                <div
                  key={cifra.etiqueta}
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 backdrop-blur"
                >
                  <dd className="text-3xl font-black text-white">{cifra.valor}</dd>
                  <dt className="mt-1 text-xs uppercase tracking-wider text-verde-100">
                    {cifra.etiqueta}
                  </dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      {/* ---------------- Ferias destacadas ---------------- */}
      <section aria-labelledby="titulo-destacadas" className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-sol-700">
              Próximas y destacadas
            </p>
            <h2 id="titulo-destacadas" className="mt-1 text-3xl font-black text-tierra-900">
              Ferias destacadas
            </h2>
          </div>
          <Link
            to="/ferias"
            className="rounded-lg border border-verde-500 px-4 py-2 text-sm font-semibold text-verde-700 transition-colors hover:bg-verde-500/10"
          >
            Ver todas →
          </Link>
        </div>

        {cargando && (
          <p role="status" className="mt-6 text-tierra-600">
            Cargando ferias…
          </p>
        )}

        {!cargando && error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-600 bg-red-50 p-4 text-red-800"
          >
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

        {!cargando && !error && ferias.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ferias.map((feria) => (
              <FeriasCard key={feria.id} feria={feria} />
            ))}
          </div>
        )}

        {!cargando && !error && ferias.length === 0 && (
          <p className="mt-6 text-tierra-600">Aún no hay ferias destacadas registradas.</p>
        )}
      </section>

      {/* ---------------- Banda de sostenibilidad ---------------- */}
      <section
        aria-labelledby="titulo-impacto"
        className="marca-viva animar-entrada-tardia mt-16 overflow-hidden rounded-[2rem] px-6 py-10 text-white shadow-xl sm:px-12"
      >
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 id="titulo-impacto" className="text-2xl font-black sm:text-3xl">
              El impacto de comprar cerca
            </h2>
            <p className="mt-2 max-w-xl text-verde-50">
              Publicamos el impacto medido de la plataforma: kilómetros de transporte
              evitados y CO₂ que no se emite gracias al consumo de proximidad.
            </p>
          </div>
          <Link
            to="/sostenibilidad"
            className="relative inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-white px-7 py-3 font-bold text-verde-800 shadow-lg transition-colors hover:bg-verde-50"
          >
            <span className="brillo" aria-hidden="true" />
            Ver tablero de sostenibilidad
          </Link>
        </div>
      </section>

      {/* ---------------- Beneficios ---------------- */}
      <section aria-labelledby="titulo-beneficios" className="mt-16">
        <h2 id="titulo-beneficios" className="text-3xl font-black text-tierra-900">
          Por qué elegir FeriaCruz
        </h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFICIOS.map((beneficio) => (
            <li
              key={beneficio.titulo}
              className="tarjeta-viva rounded-2xl border border-tierra-100 bg-marfil p-6 text-center shadow-sm"
            >
              <span
                aria-hidden="true"
                className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-verde-500/10 text-2xl"
              >
                {beneficio.icono}
              </span>
              <h3 className="mt-4 text-lg font-bold text-tierra-900">{beneficio.titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-tierra-600">{beneficio.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
