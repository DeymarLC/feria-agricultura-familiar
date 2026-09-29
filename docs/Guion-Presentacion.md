# Guion de presentación — Actividades 1 a 4
### Feria de Agricultura Familiar · Programación Web II · U.P.D.S.

> **Duración sugerida:** 10–12 minutos (demo en vivo incluida).
> **Antes de presentar:** confirma que `https://feria-agricultura-familiar.vercel.app` responde (primera carga puede tardar ~30–50 s por *cold start* del plan gratuito). Prepara una pestaña con el tablero `/sostenibilidad` y otra con Swagger `/apidocs/`.

---

## 1. Portada (0:00–0:30)
«Buenos días. Les presentamos la **Feria de Agricultura Familiar**: una plataforma web que conecta a pequeños productores agroecológicos con consumidores urbanos.»

Mostrar: título del proyecto, nombre, asignatura, docente.

---

## 2. ¿Qué es y para quién? (0:30–1:30)
- **Problema:** los productores de Santa Cruz no tienen un canal digital para ofrecer sus productos frescos directamente al consumidor.
- **Solución:** un sitio público con el catálogo de ferias y productos, más un panel de administración para productores.
- **Público:** consumidor (navega sin registrarse) · productor (registra y administra sus productos) · administrador (gestiona ferias y contenido destacado).

---

## 3. Arquitectura técnica (1:30–3:00)
Diagrama:
```
React + Vite (SPA) ──HTTP──> Flask API ──psycopg──> PostgreSQL (Supabase)
   dist/ (compilado)          JWT + roles             nube (SSL)
```

- **Frontend:** React 19 con Vite; enrutado con *fallback* SPA; diseño responsivo y WCAG.
- **Backend:** Flask 3.1, API REST, documentación OpenAPI automática con **Swagger** (`/apidocs/`).
- **Datos:** PostgreSQL alojado en **Supabase**; consultas parametrizadas contra inyección SQL.
- **Autenticación:** **JWT** con expiración de 60 min y roles `admin`/`productor` firmados en el token.

---

## 4. Actividad 4 — Despliegue en producción (3:00–5:00)
- Intentamos **Render**: despliegue todo-en-uno listo (`render.yaml`, `render-build.sh`), pero su plan gratuito **exige tarjeta de crédito** y la única disponible fue rechazada.
- **Solución:** **Vercel (Hobby)** — gratis, sin tarjeta, integrado con GitHub.
  - Entrypoint Python `api/index.py` con la app WSGI `app` de Flask.
  - `vercel.json` reescribe todas las rutas (`/(.*)`) hacia `/api/index`.
  - Dependencias desde el `requirements.txt` de la raíz.
  - El mismo runtime sirve **API + frontend compilado + Swagger**.
- **Variables de entorno** (secreto, nunca en el repo): `DATABASE_URL`, `SECRET_KEY`, `JWT_SECRET`, `JWT_EXPIRES_MINUTES`, `FLASK_ENV`, `CORS_ORIGINS`.
- **Integración continua:** cada *push* a `main` despliega; *rollback* con un clic.

**[DEMO 1]** Mostrar en GitHub el repositorio y los *commits* de la Act. 4.
URL: `https://github.com/DeymarLC/feria-agricultura-familiar`

---

## 5. Actividad 4 — Tablero de sostenibilidad (5:00–7:00)
- Nuevo endpoint `GET /api/metricas` con tres bloques:
  - **Técnico:** peso del sitio y huella por vista → **0,62 g CO₂e/vista** (342,6 KB, 8 archivos).
  - **Catálogo:** 3 ferias · 2 productores · 11 productos · 6 ubicaciones.
  - **Social:** 11 productos comercializados · **105 km evitados** · **16,8 kg CO₂e** no emitidos.
- Metodología abierta en el propio endpoint: 35 km por feria local, 0,16 kg CO₂/km, fórmula de *Website Carbon*.
- Los números son reales, calculados contra nuestra base de datos.

**[DEMO 2]** Abrir `/sostenibilidad` y `/api/metricas`; mostrar Swagger `/apidocs/` con la ruta documentada.

---

## 6. Actividad 4 — Pruebas y gobernanza (7:00–8:30)
- **Pruebas e2e:** suite completa de extremo a extremo — **33/33 PASS**.
  Cubren: login, roles, CRUD de ferias y productos, y métricas de sostenibilidad.
- **Gobernanza** (`docs/GOBERNANZA.md`):
  - Roles con privilegio mínimo; ciclo de vida del dato; respaldos diarios (Supabase) + manual semanal.
  - Seguridad OWASP + Ley N.º 164 (ciberseguridad, Bolivia).
  - Monitorización con *health-check* cada 5 minutos; matriz de incidentes con SLA.
  - Despliegue con *rollback*; accesibilidad WCAG 2.1; sostenibilidad digital.

---

## 7. Demo en vivo del sitio (8:30–10:30)
1. Abrir el sitio → portada y catálogo de ferias (`/`).
2. Ver el detalle de una feria con sus productos.
3. `Ingresar` con el productor de demostración (`productor@feria.bo`).
4. Registrar un producto nuevo y mostrarlo en la feria.
5. Entrar como administrador (`admin@feria.bo`) y crear/editar una feria.
6. Cerrar sesión; navegar `/sostenibilidad` y `/apidocs`.

> Nota: si la primera pantalla tarda, explicar el *cold start* del plan gratuito (transparencia sobre la limitación).

---

## 8. Resultados y aprendizajes (10:30–11:30)
- Aplicación **100 % funcional en producción** con un solo runtime.
- Impacto ambiental **medido y publicado**, no asumido.
- **33/33 pruebas** → despliegue con confianza.
- Aprendizajes: verificar antes de avanzar; las plataformas gratuitas tienen restricciones (tarjeta, *cold start*); nunca versionar secretos.

---

## 9. Cierre y preguntas (11:30–12:00)
«La Feria de Agricultura Familiar queda operativa en Internet, sostenible y gobernada por políticas claras de seguridad y datos. Gracias.»

**Correo/LinkedIn a contactar y disponible para preguntas.**

---

## Tabla de demo rápida

| Ruta | Qué mostrar |
|---|---|
| `/` | Portada y catálogo |
| `/ferias/:id` | Detalle de feria + productos |
| `/ingresar` | Login productor `productor@feria.bo` |
| `/registrar-producto` (sesión productor) | Alta de producto |
| `/nueva-feria` (sesión admin) | Alta/edición de feria |
| `/sostenibilidad` | Tablero de métricas |
| `/apidocs/` | Documentación OpenAPI |

**Credenciales de demostración:** `admin@feria.bo` / `Admin123!` · `productor@feria.bo` / `Productor123!`