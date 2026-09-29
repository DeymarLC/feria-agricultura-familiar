/**
 * Footer — Pie de página semántico con información institucional.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-tierra-100 bg-marfil">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-tierra-600 sm:flex-row sm:px-6">
        <p>
          © {new Date().getFullYear()} Feria de Agricultura Familiar — Proyecto de Programación Web 2.
        </p>
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