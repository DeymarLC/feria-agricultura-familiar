import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

/**
 * Navbar — Barra de navegación accesible y responsiva.
 *
 * Accesibilidad implementada:
 * - Estructura semántica: <header>, <nav aria-label="Navegación principal">.
 * - Enlace de salto de contenido ("Saltar al contenido") — WCAG 2.4.1.
 * - Menú móvil con `aria-expanded`, `aria-controls` y cierre con tecla Escape.
 * - `aria-current="page"` automático mediante NavLink de react-router.
 *
 * Sesión:
 * - "Registrar feria" se muestra solo a productores/administradores.
 * - Sin sesión → enlaces "Ingresar" y "Crear cuenta".
 * - Con sesión → chip con el nombre y botón "Cerrar sesión".
 *
 * Mobile-First: el menú de enlaces se oculta en móvil (hidden) y se muestra
 * en pantallas >= md (md:flex). El botón "hamburguesa" solo aparece en móvil.
 */
export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const { usuario, cerrarSesion } = useAuth()

  // Solo productores y administradores pueden publicar ferias.
  const puedeRegistrar = usuario && ['admin', 'productor'].includes(usuario.rol)

  // Estilos que cambian según si el enlace es la página activa
  const claseEnlace = ({ isActive }) =>
    `block rounded-lg px-4 py-2 text-base font-medium transition-colors ${
      isActive
        ? 'bg-verde-500/15 text-verde-700'
        : 'text-tierra-800 hover:text-verde-700'
    }`

  // Cierra el menú con la tecla Escape para personas que usan teclado
  const manejarTecla = (evento) => {
    if (evento.key === 'Escape' && menuAbierto) {
      setMenuAbierto(false)
    }
  }

  const cerrarMenu = () => setMenuAbierto(false)

  const manejarCierreSesion = () => {
    cerrarSesion()
    cerrarMenu()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-tierra-100 bg-marfil/95 backdrop-blur supports-[backdrop-filter]:bg-marfil/80">
      {/* Enlace de salto: oculto visualmente, visible al recibir foco */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-verde-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido principal
      </a>

      <nav
        aria-label="Navegación principal"
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
        onKeyDown={manejarTecla}
      >
        {/* Marca / logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-bold text-verde-700"
          aria-label="Feria de Agricultura Familiar — volver al inicio"
        >
          <span aria-hidden="true" className="text-2xl">
            🌾
          </span>
          <span className="sr-only">Feria de Agricultura Familiar</span>
          <span className="hidden sm:inline">Feria de Agricultura Familiar</span>
        </Link>

        {/* Botón hamburguesa (solo móvil) */}
        <button
          type="button"
          className="rounded-lg p-2 text-tierra-800 hover:bg-tierra-100 md:hidden"
          aria-controls="menu-navegacion"
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {/* Icono hamburguesa / X dibujado en CSS, sin librería externa */}
          <span
            aria-hidden="true"
            className="block"
            style={{ transform: menuAbierto ? 'rotate(90deg)' : 'none' }}
          >
            {menuAbierto ? '✕' : '☰'}
          </span>
        </button>

        {/* Menú de enlaces */}
        <ul
          id="menu-navegacion"
          className={`${
            menuAbierto ? 'flex' : 'hidden'
          } absolute left-0 right-0 top-full flex-col gap-1 border-b border-tierra-100 bg-marfil px-4 py-3 shadow-lg md:static md:flex md:flex-row md:items-center md:shadow-none`}
        >
          <li>
            <NavLink to="/" className={claseEnlace} onClick={cerrarMenu}>
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink to="/ferias" className={claseEnlace} onClick={cerrarMenu}>
              Ferias
            </NavLink>
          </li>

          {/* Registrar feria: solo para productores/administradores */}
          {puedeRegistrar && (
            <li>
              <NavLink to="/registro-feria" className={claseEnlace} onClick={cerrarMenu}>
                Registrar feria
              </NavLink>
            </li>
          )}

          <li>
            <NavLink to="/acerca-de" className={claseEnlace} onClick={cerrarMenu}>
              Acerca de
            </NavLink>
          </li>

          {/* Separador visual en escritorio */}
          <li aria-hidden="true" className="hidden border-t border-tierra-100 my-1 md:mx-2 md:my-0 md:min-h-6 md:border-t-0 md:border-l" />

          {usuario ? (
            <>
              <li className="flex items-center gap-2 px-2 py-1 md:py-0">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-verde-700 text-sm font-bold text-white" aria-hidden="true">
                  {usuario.nombre ? usuario.nombre.charAt(0).toUpperCase() : '?'}
                </span>
                <span className="max-w-[10rem] truncate text-sm font-medium text-tierra-800">
                  {usuario.nombre}
                </span>
                <span className="sr-only">, rol: {usuario.rol}</span>
              </li>
              <li>
                <button
                  type="button"
                  onClick={manejarCierreSesion}
                  className="block w-full rounded-lg px-4 py-2 text-left text-base font-medium text-red-700 transition-colors hover:bg-red-50 md:w-auto"
                >
                  Cerrar sesión
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/ingresar" className={claseEnlace} onClick={cerrarMenu}>
                  Ingresar
                </NavLink>
              </li>
              <li>
                <NavLink to="/registro" className={claseEnlace} onClick={cerrarMenu}>
                  Crear cuenta
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  )
}