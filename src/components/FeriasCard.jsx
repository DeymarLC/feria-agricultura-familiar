import { Link } from 'react-router-dom'

/**
 * FeriasCard — Tarjeta accesible para mostrar la información principal
 * de una feria de agricultura familiar.
 *
 * Accesibilidad implementada:
 * - Etiqueta semántica <article> que agrupa toda la información.
 * - Titular con encabezado (<h2>) para estructura de navegación por títulos.
 * - Imagen con `alt` descriptivo y con `loading="lazy"` para rendimiento.
 * - Enlace claro "Ver detalles" como única acción (evita enlaces duplicados).
 * - Área táctil generosa (>= 44px) en el botón de color.
 */
export default function FeriasCard({ feria }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-tierra-100 bg-marfil shadow-sm transition-shadow hover:shadow-md">
      {/* Imagen de la feria: altura fija, lazy loading y alt descriptivo */}
      <img
        src={feria.imagen}
        alt={`Vista general de la feria ${feria.nombre} en ${feria.ubicacion}`}
        loading="lazy"
        className="h-44 w-full object-cover"
      />

      {/* Contenido de la tarjeta */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Fecha como elemento con formato de fecha legible */}
        <time
          dateTime={feria.fechaISO}
          className="self-start rounded-full bg-verde-500/10 px-3 py-1 text-xs font-semibold text-verde-700"
        >
          {feria.fecha}
        </time>

        <h3 className="text-xl font-bold text-tierra-900">{feria.nombre}</h3>

        {/* Ubicación con icono decorativo (aria-hidden) */}
        <p className="flex items-center gap-2 text-sm text-tierra-600">
          <span aria-hidden="true">📍</span>
          <span>{feria.ubicacion}</span>
        </p>

        {/* Descripción corta */}
        <p className="text-sm leading-relaxed text-tierra-700">{feria.descripcion}</p>

        {/* Lista de categorías de productos */}
        <ul className="mt-auto flex flex-wrap gap-2" aria-label="Productos disponibles">
          {feria.productos.map((producto) => (
            <li key={producto}>
              <span className="rounded-md bg-tierra-100 px-2 py-1 text-xs font-medium text-tierra-800">
                {producto}
              </span>
            </li>
          ))}
        </ul>

        {/* Enlace principal de la tarjeta → ficha individual /ferias/:id */}
        <div className="pt-2">
          <Link
            to={`/ferias/${feria.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-verde-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-verde-800 focus-visible:outline-verde-500"
            aria-label={`Ver detalles de la feria ${feria.nombre}`}
          >
            Ver detalles
          </Link>
        </div>
      </div>
    </article>
  )
}