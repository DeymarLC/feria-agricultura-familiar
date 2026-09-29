import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

/**
 * Layout — Estructura común de todas las páginas.
 *
 * Orden semántico: <header> (Navbar) → <main> (Outlet) → <footer>.
 * `flex flex-col min-h-screen` mantiene el footer al fondo en pantallas cortas.
 */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  )
}