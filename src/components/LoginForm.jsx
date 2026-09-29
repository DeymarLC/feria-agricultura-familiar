import { useId, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

/**
 * LoginForm — Formulario de inicio de sesión accesible y validado.
 *
 * Accesibilidad (WCAG AA): mismo patrón que FeriaForm:
 * - <label> + useId para cada campo (WCAG 3.3.2).
 * - Errores con aria-describedby, aria-invalid y summary aria-live (3.3.1).
 * - Errores del servidor con role="alert" (4.1.3).
 * - aria-busy + botón deshabilitado durante la petición (2.2.2).
 * - Botón mostrar/ocultar contraseña con aria-pressed y aria-label.
 * - autocomplete="email" / "current-password" (WCAG 1.3.5).
 * - Después del envío, el foco vuelve al primer campo con error (3.3.1).
 */

const validarCorreo = (valor) => {
  if (!valor.trim()) return 'El correo electrónico es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())) return 'Ingresa un correo electrónico válido.'
  return ''
}

const validarPassword = (valor) => {
  if (!valor) return 'La contraseña es obligatoria.'
  return ''
}

export default function LoginForm() {
  const idCorreo = useId()
  const idPassword = useId()

  const [datos, setDatos] = useState({ correo: '', password: '' })
  const [errores, setErrores] = useState({})
  const [visitados, setVisitados] = useState({})
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const { iniciarSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const manejarCambio = (campo) => (evento) => {
    const valores = { ...datos, [campo]: evento.target.value }
    setDatos(valores)
    if (visitados[campo] || enviado) {
      const mensaje = campo === 'correo' ? validarCorreo(valores.correo) : validarPassword(valores.password)
      setErrores((prev) => ({ ...prev, [campo]: mensaje }))
    }
  }

  const manejarBlur = (campo) => () => {
    setVisitados((prev) => ({ ...prev, [campo]: true }))
    setErrores((prev) => ({
      ...prev,
      [campo]: campo === 'correo' ? validarCorreo(datos.correo) : validarPassword(datos.password),
    }))
  }

  const manejarEnvio = async (evento) => {
    evento.preventDefault()
    setEnviado(true)

    const nuevosErrores = {
      correo: validarCorreo(datos.correo),
      password: validarPassword(datos.password),
    }
    setErrores(nuevosErrores)

    if (nuevosErrores.correo || nuevosErrores.password) {
      const primerCampo = nuevosErrores.correo ? 'correo' : 'password'
      document.getElementById(primerCampo === 'correo' ? idCorreo : idPassword)?.focus()
      return
    }

    setEnviando(true)
    setErrorServidor('')
    const destino = ubicacion.state?.desde || '/'
    try {
      await iniciarSesion(datos.correo, datos.password)
      navegar(destino, { replace: true })
    } catch (error) {
      if (error.status === 401) {
        setErrorServidor('Correo o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.')
      } else {
        setErrorServidor(
          'No se pudo iniciar sesión. Verifica que el servidor esté encendido (npm run server) e inténtalo de nuevo.',
        )
      }
    } finally {
      setEnviando(false)
    }
  }

  const claseConError = (campo) =>
    `w-full rounded-lg border px-4 py-2.5 text-base bg-white text-tierra-900 placeholder:text-tierra-500 transition-colors ${
      errores[campo]
        ? 'border-red-600 ring-2 ring-red-500/20'
        : visitados[campo]
          ? 'border-verde-600'
          : 'border-tierra-100'
    }`

  const mensajeError = (campo, id) =>
    errores[campo] ? (
      <p id={`error-${id}`} className="mt-1 text-sm font-medium text-red-700">
        {errores[campo]}
      </p>
    ) : null

  return (
    <form onSubmit={manejarEnvio} noValidate aria-busy={enviando} className="space-y-6">
      {/* Resumen de errores para lectores de pantalla */}
      <div aria-live="polite" className="sr-only">
        {enviado && (errores.correo || errores.password) && 'Hay campos con errores. Revisa el formulario.'}
      </div>

      {/* Error del servidor */}
      {errorServidor && (
        <div role="alert" className="rounded-lg border border-red-600 bg-red-50 p-4 text-sm font-medium text-red-800">
          {errorServidor}
        </div>
      )}

      {/* Correo */}
      <div>
        <label htmlFor={idCorreo} className="mb-1 block text-sm font-semibold text-tierra-800">
          Correo electrónico <span className="text-red-700">(obligatorio)</span>
        </label>
        <input
          type="email"
          id={idCorreo}
          name="correo"
          value={datos.correo}
          onChange={manejarCambio('correo')}
          onBlur={manejarBlur('correo')}
          placeholder="Ej. productor@feria.bo"
          autoComplete="email"
          required
          aria-required="true"
          aria-describedby={errores.correo ? `error-${idCorreo}` : undefined}
          aria-invalid={errores.correo ? 'true' : 'false'}
          className={claseConError('correo')}
        />
        {mensajeError('correo', idCorreo)}
      </div>

      {/* Contraseña */}
      <div>
        <label htmlFor={idPassword} className="mb-1 block text-sm font-semibold text-tierra-800">
          Contraseña <span className="text-red-700">(obligatorio)</span>
        </label>
        <div className="relative">
          <input
            type={mostrarPassword ? 'text' : 'password'}
            id={idPassword}
            name="password"
            value={datos.password}
            onChange={manejarCambio('password')}
            onBlur={manejarBlur('password')}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
            aria-required="true"
            aria-describedby={errores.password ? `error-${idPassword}` : undefined}
            aria-invalid={errores.password ? 'true' : 'false'}
            className={`${claseConError('password')} pr-20`}
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((anterior) => !anterior)}
            aria-pressed={mostrarPassword}
            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-semibold text-verde-700 hover:bg-verde-500/10"
          >
            {mostrarPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {mensajeError('password', idPassword)}
      </div>

      {/* Envío */}
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-verde-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-verde-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Ingresando…' : 'Iniciar sesión'}
      </button>

      <p className="text-center text-sm text-tierra-600">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/registro" className="font-semibold text-verde-700 hover:text-verde-800">
          Crea una cuenta
        </Link>
      </p>
    </form>
  )
}