import { useContext } from 'react'
import { AuthContext } from './authContext.js'

/**
 * useAuth — Consume el contexto de sesión.
 * Debe usarse dentro de <AuthProvider> (envuelto en main.jsx).
 */
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  }
  return contexto
}