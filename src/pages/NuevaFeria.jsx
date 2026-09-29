import FeriaForm from '../components/FeriaForm.jsx'

/**
 * NuevaFeria — Página que envuelve el formulario de registro.
 * La página provee el <main>; el formulario gestiona su propia accesibilidad.
 */
export default function NuevaFeria() {
  return (
    <main id="contenido" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <FeriaForm />
    </main>
  )
}