/**
 * Footer — Pie de página semántico con información institucional.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-tierra-100 bg-marfil">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-tierra-600 sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="" width="40" height="40" className="size-10" />
          <div>
            <p className="text-base font-black text-tierra-900">FeriaCruz</p>
            <p>
              © {new Date().getFullYear()} FeriaCruz — Proyecto de Programación Web 2.
            </p>
          </div>
        </div>
        <nav aria-label="Enlaces institucionales">
          <ul className="flex gap-4">
            <li>
              <a className="hover:text-verde-700" href="#contenido">
                Contacto
              </a>
            </li>
            <li>
              <a className="hover:text-verde-700" href="#contenido">
                Privacidad
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
