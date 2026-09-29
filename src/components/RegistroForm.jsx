import { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import { registrarUsuario } from '../services/feriasApi.js'

/**
 * RegistroForm — Alta de cuenta accesible con dos roles:
 * productor (puede publicar ferias) y público (solo consultar).
 *
 * Accesibilidad (WCAG AA): mismo patrón que LoginForm/FeriaForm.
 * - Radio group semántico con <fieldset> + <legend> (WCAG 1.3.1).
 * - Tras un registro exitoso se inicia sesión automáticamente (flujo
 *   elegido por el usuario) y se redirige según el rol.
 * - Los mensajes de validación del servidor (detalles) se mapean a
 *   cada campo mediante aria-describedby.
 */

const validarNombre = (valor) => {
  if (!valor.trim()) return 'El nombre es obligatorio.'
  if (valor.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.'
  return ''
}

const validarCorreo = (valor) => {
  if (!valor.trim()) return 'El correo electrónico es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())) return 'Ingresa un correo electrónico válido.'
  return ''
}

const validarPassword = (valor) => {
  if (!valor) return 'La contraseña es obligatoria.'
  if (valor.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  return ''
}

const ROLES = [
  {
    valor: 'productor',
    titulo: 'Productor',
    descripcion: 'Puedo publicar y gestionar mis propias ferias.',
  },
  {
    valor: 'publico',
    titulo: 'Público',
    descripcion: 'Solo quiero consultar el catálogo de ferias.',
  },
]

export default function RegistroForm() {
  const idNombre = useId()
  const idCorreo = useId()
  const idPassword = useId()
  const idRol = useId()

  const [datos, setDatos] = useState({ nombre: '', correo: '', password: '', rol: 'productor' })
  const [errores, setErrores] = useState({})
  const [visitados, setVisitados] = useState({})
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)

  const { iniciarSesion } = useAuth()
  const navegar = useNavigate()

  const errorDeCampo = (campo) => {
    if (campo === 'nombre') return validarNombre(datos.nombre)
    if (campo === 'correo') return validarCorreo(datos.correo)
    if (campo === 'password') return validarPassword(datos.password)
    return ''
  }

  const manejarCambio = (campo) => (evento) => {
    const valores = { ...datos, [campo]: evento.target.value }
    setDatos(valores)
    if (visitados[campo] || enviado) {
      setErrores((prev) => ({ ...prev, [campo]: errorDeCampo(campo) }))
    }
  }

  const manejarBlur = (campo) => () => {
    setVisitados((prev) => ({ ...prev, [campo]: true }))
    setErrores((prev) => ({ ...prev, [campo]: errorDeCampo(campo) }))
  }

  // Conecta cada campo con su id único para devolver el foco al primer error
  const campoAId = (campo) => {
    const mapa = {
      nombre: idNombre,
      correo: idCorreo,
      password: idPassword,
    }
    return mapa[campo]
  }

  const manejarEnvio = async (evento) => {
    evento.preventDefault()
    setEnviado(true)

    const nuevosErrores = {
      nombre: validarNombre(datos.nombre),
      correo: validarCorreo(datos.correo),
      password: validarPassword(datos.password),
    }
    setErrores(nuevosErrores)

    if (Object.values(nuevosErrores).some((error) => error !== '')) {
      const primerCampo = Object.keys(nuevosErrores).find((campo) => nuevosErrores[campo] !== '')
      document.getElementById(campoAId(primerCampo))?.focus()
      return
    }

    setEnviando(true)
    setErrorServidor('')
    try {
      await registrarUsuario({
        nombre: datos.nombre,
        correo: datos.correo,
        password: datos.password,
        rol: datos.rol,
      })
      // Flujo elegido: login automático y redirección según el rol.
      await iniciarSesion(datos.correo, datos.password)
      navegar(datos.rol === 'productor' ? '/registro-feria' : '/', { replace: true })
    } catch (error) {
      if (error.status === 400 && error.detalles) {
        // Errores de validación del servidor → los colocamos en los campos.
        setErrores((prev) => ({ ...prev, ...error.detalles }))
      } else if (error.status === 400) {
        setErrorServidor(error.message)
      } else {
        setErrorServidor(
          'No se pudo crear la cuenta. Verifica que el servidor esté encendido (npm run server) e inténtalo de nuevo.',
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
        {enviado && Object.values(errores).some((error) => error !== '') && 'Hay campos con errores. Revisa el formulario.'}
      </div>

      {/* Error general del servidor */}
      {errorServidor && (
        <div role="alert" className="rounded-lg border border-red-600 bg-red-50 p-4 text-sm font-medium text-red-800">
          {errorServidor}
        </div>
      )}

      {/* Nombre completo */}
      <div>
        <label htmlFor={idNombre} className="mb-1 block text-sm font-semibold text-tierra-800">
          Nombre completo <span className="text-red-700">(obligatorio)</span>
        </label>
        <input
          type="text"
          id={idNombre}
          name="nombre"
          value={datos.nombre}
          onChange={manejarCambio('nombre')}
          onBlur={manejarBlur('nombre')}
          placeholder="Ej. María Choque"
          autoComplete="name"
          required
          aria-required="true"
          aria-describedby={errores.nombre ? `error-${idNombre}` : undefined}
          aria-invalid={errores.nombre ? 'true' : 'false'}
          className={claseConError('nombre')}
        />
        {mensajeError('nombre', idNombre)}
      </div>

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
          placeholder="Ej. maria@campo.bo"
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
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            required
            aria-required="true"
            aria-describedby={errores.password ? `error-${idPassword}` : `ayuda-${idPassword}`}
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
        {errores.password ? (
          mensajeError('password', idPassword)
        ) : (
          <p id={`ayuda-${idPassword}`} className="mt-1 text-sm text-tierra-600">
            Usa al menos 8 caracteres.
          </p>
        )}
      </div>

      {/* Tipo de cuenta: radio group semántico */}
      <fieldset>
        <legend className="mb-1 block text-sm font-semibold text-tierra-800">
          Tipo de cuenta <span className="text-red-700">(obligatorio)</span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((rol) => (
            <label
              key={rol.valor}
              className={`flex cursor-pointer flex-col rounded-lg border p-4 transition-colors ${
                datos.rol === rol.valor
                  ? 'border-verde-700 bg-verde-500/10'
                  : 'border-tierra-100 bg-white hover:border-verde-500'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-tierra-900">
                <input
                  type="radio"
                  name="rol"
                  value={rol.valor}
                  id={rol.valor === 'productor' ? idRol : `${idRol}-publico`}
                  checked={datos.rol === rol.valor}
                  onChange={manejarCambio('rol')}
                  className="size-4 accent-verde-700"
                />
                {rol.titulo}
              </span>
              <span className="mt-2 text-xs text-tierra-600">{rol.descripcion}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Envío */}
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-verde-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-verde-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="text-center text-sm text-tierra-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/ingresar" className="font-semibold text-verde-700 hover:text-verde-800">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}