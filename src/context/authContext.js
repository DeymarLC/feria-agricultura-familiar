import { createContext } from 'react'

/**
 * authContext — Contexto de sesión (se comparte con el proveedor y el hook).
 * Separado en su propio módulo para que AuthProvider (componente) y useAuth
 * (hook) sean archivos con una única exportación (fast-refresh limpio).
 */
export const AuthContext = createContext(null)