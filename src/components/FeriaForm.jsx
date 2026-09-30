import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { crearFeria } from '../services/feriasApi.js'

/**
 * FeriaForm — Formulario de registro de ferias con validación
 * en tiempo real y accesibilidad completa.
 *
 * Accesibilidad implementada:
 * - Cada <input>/<textarea>/<select> tiene su propio <label> (WCAG 3.3.2).
 * - Errores visibles asociados con `aria-describedby` (WCAG 3.3.1) y
 *   marcados con `aria-invalid` (WCAG 3.3.1 / ARIA).
 * - Contenedor de errores con `aria-live="polite"` para anunciar cambios
 *   a lectores de pantalla sin mover el foco (WCAG 4.1.3).
 * - Los campos obligatorios se indican con "(obligatorio)" en el texto del
 *   label y con el atributo `required`.
 * - `aria-required` para máxima compatibilidad con lectores antiguos.
 * - Éxito anunciado con `role="status"` (ARIA live region implícita).
 *
 * Validación en tiempo real: cada campo valida al perder el foco (onBlur)
 * y en cada pulsación posterior (onChange) si ya fue visitado o tras el envío.
 */

// ---------- Lógica de validación (pura y reutilizable) ----------

const validarNombre = (valor) => {
  if (!valor.trim()) return 'El nombre de la feria es obligatorio.'
  if (valor.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.'
  return ''
}

const validarUbicacion = (valor) => {
  if (!valor.trim()) return 'La localización es obligatoria.'
  if (valor.trim().length < 3) return 'La localización debe tener al menos 3 caracteres.'
  return ''
}

/**
 * Fecha de hoy en formato YYYY-MM-DD usando la hora local del navegador.
 * No se usa `toISOString()` porque convierte a UTC y en Bolivia (UTC-4)
 * devolvería el día siguiente durante la tarde.
 */
const hoyISO = () => {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

const validarFecha = (valor, fechaFinal) => {
  if (!valor) return 'La fecha de inicio es obligatoria.'
  if (valor < hoyISO()) return 'La fecha de inicio no puede ser en el pasado.'
  if (fechaFinal && fechaFinal < valor) return 'La fecha de fin no puede ser anterior a la de inicio.'
  return ''
}

const validarFechaFin = (valor, fechaInicio) => {
  if (!valor) return 'La fecha de fin es obligatoria.'
  if (fechaInicio && valor < fechaInicio) return 'La fecha de fin no puede ser anterior a la de inicio.'
  return ''
}

const validarCorreo = (valor) => {
  if (!valor.trim()) return 'El correo de contacto es obligatorio.'
  const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  if (!expresion.test(valor.trim())) return 'Ingresa un correo electrónico válido.'
  return ''
}

const validarDescripcion = (valor) => {
  if (!valor.trim()) return 'La descripción es obligatoria.'
  if (valor.trim().length < 20) return 'La descripción debe tener al menos 20 caracteres.'
  return ''
}

// Mapa de validadores por campo (una sola fuente de verdad).
// `productos` es opcional, por eso su validador siempre devuelve ''.
const VALIDADORES = {
  nombre: (valor) => validarNombre(valor),
  ubicacion: (valor) => validarUbicacion(valor),
  fechaInicio: (valor, datos) => validarFecha(valor, datos.fechaFin),
  fechaFin: (valor, datos) => validarFechaFin(valor, datos.fechaInicio),
  correo: (valor) => validarCorreo(valor),
  descripcion: (valor) => validarDescripcion(valor),
  productos: () => '',
}

// Estado vacío del formulario
const VALORES_INICIALES = {
  nombre: '',
  ubicacion: '',
  fechaInicio: '',
  fechaFin: '',
  correo: '',
  descripcion: '',
  productos: '',
}

export default function FeriaForm() {
  // useId genera identificadores únicos (evita colisiones entre formularios)
  const idNombre = useId()
  const idUbicacion = useId()
  const idFechaInicio = useId()
  const idFechaFin = useId()
  const idCorreo = useId()
  const idDescripcion = useId()
  const idProductos = useId()

  const [datos, setDatos] = useState(VALORES_INICIALES)
  const [errores, setErrores] = useState({})
  const [visitados, setVisitados] = useState({})
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorServidor, setErrorServidor] = useState('')
  const [sesionVencida, setSesionVencida] = useState(false)
  const [exito, setExito] = useState(false)

  // Todos los campos del formulario son obligatorios
  const camposObligatorios = Object.keys(VALIDADORES)

  // Valida un único campo y devuelve su mensaje de error (o cadena vacía)
  const errorDeCampo = (campo) => VALIDADORES[campo](datos[campo], datos)

  // Recalcula los errores de un campo al cambiar su valor
  const manejarCambio = (campo) => (evento) => {
    const valor = evento.target.value
    const nuevosDatos = { ...datos, [campo]: valor }
    setDatos(nuevosDatos)

    // Solo muestra el error si el campo ya fue visitado o el formulario se envió
    if (visitados[campo] || enviado) {
      setErrores((prev) => ({ ...prev, [campo]: VALIDADORES[campo](valor, nuevosDatos) }))
    }
  }

  // Marca el campo como visto al salir y muestra su error
  const manejarBlur = (campo) => () => {
    setVisitados((prev) => ({ ...prev, [campo]: true }))
    setErrores((prev) => ({ ...prev, [campo]: errorDeCampo(campo) }))
  }

  // Valida todo al enviar y previene el envío si hay errores
  const manejarEnvio = async (evento) => {
    evento.preventDefault()
    setEnviado(true)

    const nuevosErrores = {}
    camposObligatorios.forEach((campo) => {
      nuevosErrores[campo] = errorDeCampo(campo)
    })
    setErrores(nuevosErrores)

    const esValido = Object.values(nuevosErrores).every((error) => error === '')
    if (!esValido) {
      // Devuelve el foco al primer campo con error (WCAG 3.3.1)
      const primerCampoErroneo = camposObligatorios.find(
        (campo) => nuevosErrores[campo] !== '',
      )
      if (primerCampoErroneo) {
        document.getElementById(campoToId(primerCampoErroneo))?.focus()
      }
      return
    }

    // Envío real a la API (Flask) con estados accesibles
    setEnviando(true)
    setErrorServidor('')
    setSesionVencida(false)
    try {
      await crearFeria(datos)
      setExito(true)
      setDatos(VALORES_INICIALES) // limpia el formulario
      setVisitados({}) // reinicia el estado de campos visitados
    } catch (error) {
      if (error.status === 401) {
        // Token ausente o vencido → invita a iniciar sesión
        setSesionVencida(true)
        setErrorServidor(
          'Tu sesión venció o necesita que inicies sesión para registrar ferias.',
        )
      } else if (error.status === 403) {
        setErrorServidor(
          'Se requiere un rol de productor o administrador para registrar ferias.',
        )
      } else {
        setErrorServidor(
          'No se pudo guardar la feria. Verifica que el servidor esté encendido (npm run server) e inténtalo de nuevo.',
        )
      }
    } finally {
      setEnviando(false)
    }
  }

  // Helper para enlazar el id de un campo con su mapa de useId
  const campoToId = (campo) => {
    const mapa = {
      nombre: idNombre,
      ubicacion: idUbicacion,
      fechaInicio: idFechaInicio,
      fechaFin: idFechaFin,
      correo: idCorreo,
      descripcion: idDescripcion,
      productos: idProductos,
    }
    return mapa[campo]
  }

  // Clases para el input: rojo si hay error, verde si es válido y visitado
  const claseConError = (campo) =>
    `w-full rounded-lg border px-4 py-2.5 text-base bg-white text-tierra-900 placeholder:text-tierra-500 transition-colors ${
      errores[campo]
        ? 'border-red-600 ring-2 ring-red-500/20'
        : visitados[campo]
          ? 'border-verde-600'
          : 'border-tierra-100'
    }`

  // Campo de error visible y asociado mediante aria-describedby
  const mensajeError = (campo, id) =>
    errores[campo] ? (
      <p id={`error-${id}`} className="mt-1 text-sm font-medium text-red-700">
        {errores[campo]}
      </p>
    ) : null

  return (
    /* aria-busy y novalidate: el formulario gestiona su propia validación */
    <form onSubmit={manejarEnvio} noValidate aria-busy={enviando} className="space-y-6">
      {/* Encabezado del formulario */}
      <div>
        <h2 className="text-2xl font-bold text-tierra-900">Registra una nueva feria</h2>
        <p className="mt-1 text-sm text-tierra-600">
          Completa todos los campos obligatorios para publicar tu feria familiar cruceña.
        </p>
      </div>

      {/* Región live para anunciar errores de forma resumida */}
      <div aria-live="polite" className="sr-only">
        {Object.values(errores).some((e) => e !== '') &&
          'Hay algunos campos con errores. Revisa el formulario.'}
      </div>

      {/* Error del servidor: se anuncia como alerta */}
      {errorServidor && (
        <div role="alert" className="rounded-lg border border-red-600 bg-red-50 p-4 text-sm font-medium text-red-800">
          <p>{errorServidor}</p>
          {sesionVencida && (
            <Link
              to="/ingresar"
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      )}

      {/* Nombre de la feria */}
      <div>
        <label htmlFor={idNombre} className="mb-1 block text-sm font-semibold text-tierra-800">
          Nombre de la feria <span className="text-red-700">(obligatorio)</span>
        </label>
        <input
          type="text"
          id={idNombre}
          name="nombre"
          value={datos.nombre}
          onChange={manejarCambio('nombre')}
          onBlur={manejarBlur('nombre')}
          placeholder="Ej. Feria Agroecológica del Valle"
          required
          aria-required="true"
          aria-describedby={errores.nombre ? `error-${idNombre}` : undefined}
          aria-invalid={errores.nombre ? 'true' : 'false'}
          className={claseConError('nombre')}
        />
        {mensajeError('nombre', idNombre)}
      </div>

      {/* Ubicación */}
      <div>
        <label htmlFor={idUbicacion} className="mb-1 block text-sm font-semibold text-tierra-800">
          Localización <span className="text-red-700">(obligatorio)</span>
        </label>
        <input
          type="text"
          id={idUbicacion}
          name="ubicacion"
          value={datos.ubicacion}
          onChange={manejarCambio('ubicacion')}
          onBlur={manejarBlur('ubicacion')}
          placeholder="Ej. Plaza Central de Chillán"
          required
          aria-required="true"
          aria-describedby={errores.ubicacion ? `error-${idUbicacion}` : undefined}
          aria-invalid={errores.ubicacion ? 'true' : 'false'}
          className={claseConError('ubicacion')}
        />
        {mensajeError('ubicacion', idUbicacion)}
      </div>

      {/* Fechas: inicio y fin en la misma fila en pantallas md+ */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={idFechaInicio} className="mb-1 block text-sm font-semibold text-tierra-800">
            Fecha de inicio <span className="text-red-700">(obligatorio)</span>
          </label>
          <input
            type="date"
            id={idFechaInicio}
            name="fechaInicio"
            value={datos.fechaInicio}
            onChange={manejarCambio('fechaInicio')}
            onBlur={manejarBlur('fechaInicio')}
            min={hoyISO()}
            required
            aria-required="true"
            aria-describedby={errores.fechaInicio ? `error-${idFechaInicio}` : undefined}
            aria-invalid={errores.fechaInicio ? 'true' : 'false'}
            className={claseConError('fechaInicio')}
          />
          {mensajeError('fechaInicio', idFechaInicio)}
        </div>

        <div>
          <label htmlFor={idFechaFin} className="mb-1 block text-sm font-semibold text-tierra-800">
            Fecha de fin <span className="text-red-700">(obligatorio)</span>
          </label>
          <input
            type="date"
            id={idFechaFin}
            name="fechaFin"
            value={datos.fechaFin}
            onChange={manejarCambio('fechaFin')}
            onBlur={manejarBlur('fechaFin')}
            min={datos.fechaInicio || hoyISO()}
            required
            aria-required="true"
            aria-describedby={errores.fechaFin ? `error-${idFechaFin}` : undefined}
            aria-invalid={errores.fechaFin ? 'true' : 'false'}
            className={claseConError('fechaFin')}
          />
          {mensajeError('fechaFin', idFechaFin)}
        </div>
      </div>

      {/* Correo de contacto */}
      <div>
        <label htmlFor={idCorreo} className="mb-1 block text-sm font-semibold text-tierra-800">
          Correo de contacto <span className="text-red-700">(obligatorio)</span>
        </label>
        <input
          type="email"
          id={idCorreo}
          name="correo"
          value={datos.correo}
          onChange={manejarCambio('correo')}
          onBlur={manejarBlur('correo')}
          placeholder="Ej. contacto@feriafamiliar.cl"
          autoComplete="email"
          required
          aria-required="true"
          aria-describedby={errores.correo ? `error-${idCorreo}` : undefined}
          aria-invalid={errores.correo ? 'true' : 'false'}
          className={claseConError('correo')}
        />
        {mensajeError('correo', idCorreo)}
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor={idDescripcion} className="mb-1 block text-sm font-semibold text-tierra-800">
          Descripción de la feria <span className="text-red-700">(obligatorio)</span>
        </label>
        <textarea
          id={idDescripcion}
          name="descripcion"
          rows={4}
          value={datos.descripcion}
          onChange={manejarCambio('descripcion')}
          onBlur={manejarBlur('descripcion')}
          placeholder="Cuéntanos qué productos venden, quiénes participan y qué hace especial a esta feria…"
          required
          aria-required="true"
          aria-describedby={errores.descripcion ? `error-${idDescripcion}` : undefined}
          aria-invalid={errores.descripcion ? 'true' : 'false'}
          className={claseConError('descripcion')}
        />
        {mensajeError('descripcion', idDescripcion)}
      </div>

      {/* Productos (opcional): separados por comas */}
      <div>
        <label htmlFor={idProductos} className="mb-1 block text-sm font-semibold text-tierra-800">
          Productos <span className="font-normal text-tierra-500">(opcional)</span>
        </label>
        <input
          type="text"
          id={idProductos}
          name="productos"
          value={datos.productos}
          onChange={manejarCambio('productos')}
          onBlur={manejarBlur('productos')}
          placeholder="Ej. Yuca, maíz, miel, plátano"
          aria-describedby={`ayuda-${idProductos}`}
          className="w-full rounded-lg border border-tierra-100 px-4 py-2.5 text-base text-tierra-900 placeholder:text-tierra-500 transition-colors"
        />
        <p id={`ayuda-${idProductos}`} className="mt-1 text-sm text-tierra-600">
          Escríbelos separados por comas.
        </p>
      </div>

      {/* Botón de envío: se deshabilita durante la petición */}
      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-verde-700 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-verde-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {enviando ? 'Registrando…' : 'Registrar feria'}
      </button>

      {/* Confirmación de éxito: región live que los lectores anuncian */}
      {exito && (
        <div
          role="status"
          className="rounded-lg border border-verde-600 bg-verde-50 p-4 text-sm font-medium text-verde-800"
        >
          ¡Feria registrada exitosamente! Ya puedes verla en el catálogo de ferias.
        </div>
      )}
    </form>
  )
}