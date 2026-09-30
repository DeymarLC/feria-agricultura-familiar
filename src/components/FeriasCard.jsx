import { Link } from 'react-router-dom'

/** Imagen usada cuando la feria no tiene una foto propia o el archivo falla. */
const IMAGEN_POR_DEFECTO = '/images/feria-4.svg'

/**
 * FeriasCard — Tarjeta accesible para mostrar la información principal
 * de una feria de agricultura familiar.
 *
 * Accesibilidad implementada:
 * - Etiqueta semántica <article> que agrupa toda la información.
 * - Titular con encabezado (<h3>) para estructura de navegación por títulos.
 * - Imagen con `alt` descriptivo y con `loading="lazy"` para rendimiento.
 * - Un solo enlace por tarjeta ("Ver detalles"), estirado con `after:inset-0`
 *   para que un clic en cualquier punto de la tarjeta abra la ficha.
 * - Área táctil generosa (>= 44px) en el botón de color.
 */
export default function FeriasCard({ feria }) {
  const imagenFeria = feria.imagen?.trim() || IMAGEN_POR_DEFECTO

  return (
    <article className="tarjeta-viva relative flex flex-col overflow-hidden rounded-2xl border border-tierra-100 bg-marfil shadow-sm">
      {/* Imagen de la feria: altura fija, lazy loading y alt descriptivo */}
      <div className="relative overflow-hidden">
        <img
          src={imagenFeria}
          alt={`Vista general de la feria ${feria.nombre} en ${feria.ubicacion}`}
          loading="lazy"
          width="1200"
          height="600"
          onError={(evento) => {
            // Si la URL guardada no existe, se muestra la ilustración genérica
            if (evento.currentTarget.src.endsWith(IMAGEN_POR_DEFECTO)) return
            evento.currentTarget.src = IMAGEN_POR_DEFECTO
          }}
          className="h-48 w-full bg-verde-100 object-cover"
        />
        {feria.destacada && (
          <span className="marca absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow">
            Destacada
          </span>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Fecha como elemento con formato de fecha legible */}
        <time
          dateTime={feria.fechaISO}
          className="self-start rounded-full bg-sol-400/25 px-3 py-1 text-xs font-bold text-sol-800"
        >
          📅 {feria.fecha}
        </time>

        <h3 className="text-xl font-bold text-tierra-900">{feria.nombre}</h3>

        {/* Ubicación con icono decorativo (aria-hidden) */}
        <p className="flex items-start gap-2 text-sm text-tierra-600">
          <span aria-hidden="true">📍</span>
          <span>{feria.ubicacion}</span>
        </p>

        {/* Descripción corta */}
        <p className="line-clamp-3 text-sm leading-relaxed text-tierra-700">
          {feria.descripcion}
        </p>

        {/* Lista de categorías de productos */}
        <ul className="mt-auto flex flex-wrap gap-2" aria-label="Productos disponibles">
          {feria.productos.map((producto) => (
            <li key={producto}>
              <span className="rounded-md bg-verde-500/10 px-2 py-1 text-xs font-medium text-verde-700">
                {producto}
              </span>
            </li>
          ))}
        </ul>

        {/* Enlace principal de la tarjeta → ficha individual /ferias/:id.
            Sin `relative` aquí: el `after:inset-0` se ancla al <article>, que sí
            es `relative`, y por eso el clic funciona en toda la tarjeta. */}
        <div className="pt-2">
          <Link
            to={`/ferias/${feria.id}`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-verde-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-verde-800 focus-visible:outline-verde-500 after:absolute after:inset-0 after:content-['']"
            aria-label={`Ver detalles de la feria ${feria.nombre}`}
          >
            Ver detalles →
          </Link>
        </div>
      </div>
    </article>
  )
}