/**
 * feriasApi — Capa de acceso a datos (API REST Flask + PostgreSQL).
 *
 * Todas las páginas consumen datos a través de estas funciones; nunca
 * importan db.json directamente. Centraliza la URL, el fetch, la
 * normalización de los registros y la sesión del usuario (token JWT).
 */

// Dirección del backend Flask (configurado en backend/.env → puerto 5000).
const API_URL = 'http://localhost:5000/api'

// Claves del navegador donde se guarda la sesión (token + perfil).
const CLAVE_TOKEN = 'feria_token'
const CLAVE_USUARIO = 'feria_usuario'

// Imagen por defecto cuando una feria registrada no define una
const IMAGEN_DEFECTO = '/images/feria-1.svg'

/**
 * ApiError — Error con código HTTP para que la interfaz distinga
 * una sesión vencida (401) de un rol sin permisos (403), etc.
 */
export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
  }
}

// ---------- Sesión (token JWT + perfil) ----------

/** Lee el token JWT guardado tras iniciar sesión (si existe). */
export const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN) || ''

/** Guarda la sesión completa en el navegador (token + perfil). */
export const guardarSesion = (token, usuario) => {
  localStorage.setItem(CLAVE_TOKEN, token)
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
}

/** Devuelve { token, usuario } de una sesión guardada. */
export const leerSesion = () => {
  const token = localStorage.getItem(CLAVE_TOKEN) || ''
  let usuario = null
  try {
    usuario = JSON.parse(localStorage.getItem(CLAVE_USUARIO))
  } catch {
    usuario = null
  }
  return { token, usuario }
}

/** Cierra la sesión eliminando token y perfil del navegador. */
export const cerrarSesion = () => {
  localStorage.removeItem(CLAVE_TOKEN)
  localStorage.removeItem(CLAVE_USUARIO)
}

// ---------- Fetch centralizado ----------

/**
 * peticion — Ejecuta cualquier petición a la API.
 * - Inyecta el token JWT automáticamente (Authorization: Bearer <token>).
 * - Convierte la respuesta en JSON y lanza ApiError con el código HTTP
 *   y el mensaje del servidor ({ error } o { error, detalles }).
 */
async function peticion(metodo, ruta, cuerpo = undefined) {
  const token = obtenerToken()
  const cabeceras = { 'Content-Type': 'application/json' }
  if (token) cabeceras.Authorization = `Bearer ${token}`

  const configuracion = { method: metodo, headers: cabeceras }
  if (cuerpo !== undefined) {
    configuracion.body = JSON.stringify(cuerpo)
  }

  const respuesta = await fetch(`${API_URL}${ruta}`, configuracion)

  let datos = null
  const texto = await respuesta.text()
  if (texto) {
    try {
      datos = JSON.parse(texto)
    } catch {
      datos = null
    }
  }

  if (!respuesta.ok) {
    const mensaje = datos?.error || `Error del servidor (${respuesta.status}).`
    const error = new ApiError(respuesta.status, mensaje)
    if (datos?.detalles) error.detalles = datos.detalles
    throw error
  }
  return datos
}

/**
 * Convierte una fecha "YYYY-MM-DD" en texto legible para Bolivia.
 * Ej.: "2026-10-24" → "24 de octubre de 2026".
 */
const formatearFecha = (fechaISO) => {
  if (!fechaISO) return ''
  const fecha = new Date(`${fechaISO}T12:00:00`)
  if (Number.isNaN(fecha.getTime())) return fechaISO
  return fecha.toLocaleDateString('es-BO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Normaliza un registro crudo de la API al modelo que esperan las vistas.
 * - Genera `fecha` (texto) y `fechaISO` (formato para <time>).
 * - Garantiza que `productos` sea un arreglo.
 * - Aplica imagen por defecto si falta.
 */
const normalizarFeria = (f) => ({
  ...f,
  fecha: formatearFecha(f.fechaInicio),
  fechaISO: f.fechaInicio || '',
  productos: Array.isArray(f.productos) ? f.productos : [],
  imagen: f.imagen || IMAGEN_DEFECTO,
})

/** GET /ferias — devuelve todas las ferias normalizadas */
export async function obtenerFerias() {
  const datos = await peticion('GET', '/ferias')
  return datos.map(normalizarFeria)
}

/** GET /ferias/:id — devuelve una feria normalizada (o null si no existe) */
export async function obtenerFeriaPorId(id) {
  try {
    const datos = await peticion('GET', `/ferias/${id}`)
    return normalizarFeria(datos)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/**
 * POST /api/ferias — registra una feria nueva.
 * El token se inyecta automáticamente; si no hay sesión la API
 * responde 401 y aquí se lanza ApiError(401).
 */
export async function crearFeria(datosFormulario) {
  return peticion('POST', '/ferias', {
    nombre: datosFormulario.nombre.trim(),
    ubicacion: datosFormulario.ubicacion.trim(),
    fechaInicio: datosFormulario.fechaInicio,
    fechaFin: datosFormulario.fechaFin,
    correo: datosFormulario.correo.trim(),
    descripcion: datosFormulario.descripcion.trim(),
    // Texto separado por comas → arreglo de etiquetas
    productos: datosFormulario.productos
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
    horario: 'Horario por confirmar',
    organizador: 'Productores de la agricultura familiar',
    destacada: false,
  })
}

// ---------- Autenticación ----------

/** POST /usuarios/login — valida credenciales y devuelve { token, rol, nombre, correo } */
export async function iniciarSesion(correo, password) {
  return peticion('POST', '/usuarios/login', {
    correo: correo.trim().toLowerCase(),
    password,
  })
}

/**
 * POST /usuarios/registro — crea una cuenta nueva.
 * Rol válido: 'productor' | 'publico'. Devuelve el usuario sin token
 * (el login automático posterior lo entrega).
 */
export async function registrarUsuario({ nombre, correo, password, rol }) {
  return peticion('POST', '/usuarios/registro', {
    nombre: nombre.trim(),
    correo: correo.trim().toLowerCase(),
    password,
    rol,
  })
}

/** GET /usuarios/me — devuelve el perfil del usuario autenticado */
export async function obtenerPerfil() {
  return peticion('GET', '/usuarios/me')
}