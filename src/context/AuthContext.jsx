import { useCallback, useEffect, useState } from 'react'
import { AuthContext } from './authContext.js'
import {
  cerrarSesion as cerrarSesionApi,
  guardarSesion,
  iniciarSesion as iniciarSesionApi,
  leerSesion,
  obtenerPerfil,
} from '../services/feriasApi.js'

/**
 * AuthProvider — Estado global de la sesión del usuario.
 *
 * - Restaura la sesión guardada en localStorage al cargar la app
 *   (inicialización perezosa, sin renders extra).
 * - Valida el token guardado con GET /usuarios/me (si responde 401,
 *   cierra la sesión silenciosamente).
 * - Expone { usuario, token, cargando, iniciarSesion, cerrarSesion }
 *   a través de AuthContext (consumido por useAuth).
 */
export function AuthProvider({ children }) {
  // Lee la sesión guardada una sola vez (token + perfil del usuario).
  const [sesion, setSesion] = useState(() => leerSesion())
  const [cargando, setCargando] = useState(() => Boolean(sesion.token))

  // Valida el token guardado contra la API (una vez al montar y cada vez
  // que la sesión cambia). setState solo ocurre cuando termina el fetch.
  useEffect(() => {
    let activo = true
    if (!sesion.token) return undefined

    obtenerPerfil()
      .then((perfil) => {
        if (activo) {
          setSesion({ token: sesion.token, usuario: perfil })
          guardarSesion(sesion.token, perfil)
        }
      })
      .catch(() => {
        if (!activo) return
        // Token inválido o expirado (401) → cerrar sesión.
        cerrarSesionApi()
        setSesion({ token: '', usuario: null })
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [sesion.token])

  const iniciarSesion = useCallback(async (correo, password) => {
    const datos = await iniciarSesionApi(correo, password)
    const nuevoUsuario = {
      nombre: datos.nombre,
      correo: datos.correo,
      rol: datos.rol,
    }
    guardarSesion(datos.token, nuevoUsuario)
    setSesion({ token: datos.token, usuario: nuevoUsuario })
    return datos
  }, [])

  const cerrarSesion = useCallback(() => {
    cerrarSesionApi()
    setSesion({ token: '', usuario: null })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        usuario: sesion.usuario,
        token: sesion.token,
        cargando,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}