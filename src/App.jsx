import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequerirSesion from './components/RequerirSesion.jsx'
import Home from './pages/Home.jsx'
import Ferias from './pages/Ferias.jsx'
import NuevaFeria from './pages/NuevaFeria.jsx'
import DetalleFeria from './pages/DetalleFeria.jsx'
import Ingresar from './pages/Ingresar.jsx'
import Registro from './pages/Registro.jsx'
import AcercaDe from './pages/AcercaDe.jsx'
import NoMatch from './pages/NoMatch.jsx'
import Sostenibilidad from './pages/Sostenibilidad.jsx'

/**
 * App — Configuración de rutas de la aplicación.
 *
 * <Routes> se monta dentro de <Layout>, que aporta el <header> y <footer>
 * compartidos. La ruta "*" captura URLs inexistentes (página 404).
 * /registro-feria está protegida por <RequerirSesion> (productor/admin):
 * sin sesión redirige a /ingresar y con rol insuficiente muestra un aviso.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="ferias" element={<Ferias />} />
        <Route path="ferias/:id" element={<DetalleFeria />} />
        <Route path="ingresar" element={<Ingresar />} />
        <Route path="registro" element={<Registro />} />
        <Route
          path="registro-feria"
          element={
            <RequerirSesion roles={['admin', 'productor']}>
              <NuevaFeria />
            </RequerirSesion>
          }
        />
        <Route path="acerca-de" element={<AcercaDe />} />
        <Route path="sostenibilidad" element={<Sostenibilidad />} />
        <Route path="*" element={<NoMatch />} />
      </Route>
    </Routes>
  )
}