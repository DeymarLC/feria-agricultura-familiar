import LoginForm from '../components/LoginForm.jsx'

/**
 * Ingresar — Página de inicio de sesión.
 * Provee el <main> y el encabezado; LoginForm gestiona su accesibilidad.
 */
export default function Ingresar() {
  return (
    <main id="contenido" className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <section aria-labelledby="titulo-ingresar" className="rounded-3xl border border-tierra-100 bg-marfil p-6 shadow-sm sm:p-8">
        <h1 id="titulo-ingresar" className="text-3xl font-extrabold text-tierra-900">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-tierra-600">
          Ingresa con tu correo y contraseña para publicar y gestionar ferias.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  )
}