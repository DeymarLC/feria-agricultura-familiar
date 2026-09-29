import RegistroForm from '../components/RegistroForm.jsx'

/**
 * Registro — Página de creación de cuenta.
 * Provee el <main> y el encabezado; RegistroForm gestiona su accesibilidad.
 */
export default function Registro() {
  return (
    <main id="contenido" className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <section aria-labelledby="titulo-registro" className="rounded-3xl border border-tierra-100 bg-marfil p-6 shadow-sm sm:p-8">
        <h1 id="titulo-registro" className="text-3xl font-extrabold text-tierra-900">
          Crear cuenta
        </h1>
        <p className="mt-2 text-tierra-600">
          Regístrate como productor para publicar tus ferias o como público para
          explorar el catálogo.
        </p>
        <div className="mt-8">
          <RegistroForm />
        </div>
      </section>
    </main>
  )
}