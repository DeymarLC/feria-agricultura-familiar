# 🌾 Feria de Agricultura Familiar — Full Stack

Proyecto académico de la asignatura **Programación Web II (UPDS)**. Frontend
modular y accesible (WCAG AA) con **React + Vite + Tailwind CSS v4** +
**react-router-dom**, y backend **Flask + PostgreSQL** con autenticación JWT,
consultas parametrizadas y documentación Swagger. Los datos de ejemplo
corresponden a ferias de **Santa Cruz, Bolivia**.

## ¿Cómo se ejecuta? (local)

Requisitos: Node.js 18+, Python 3.10+ y una instancia de PostgreSQL.

```bash
# 1) Terminal 1 — Backend Flask
cd backend
python -m venv venv
venv\Scripts\activate            # Windows   (Linux/mac: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env           # Windows   (Linux/mac: cp .env.example .env)
#  ^ edita .env con tu DATABASE_URL (postgresql://usuario:clave@localhost:5432/feria_db)
python scripts/init_db.py        # crea tablas + datos demo (una sola vez)
python run.py                    # http://localhost:5000

# 2) Terminal 2 — Frontend Vite (desde la raíz del proyecto)
npm install
npm run dev                      # http://localhost:5173
```

Otros comandos:

```bash
npm run lint     # análisis estático del frontend
npm run build    # build de producción del frontend
```

### Usuarios demo (backend)

| Rol | Correo | Contraseña |
| --- | ------ | ---------- |
| Admin | `admin@feria.bo` | `Admin123!` |
| Productor | `productor@feria.bo` | `Productor123!` |

> El formulario "Registrar feria" del frontend requiere un token JWT de un
> productor/admin. Documentación Swagger: **http://localhost:5000/apidocs**
> (autoriza con `Bearer <token>` y prueba los POST).

## Arquitectura

```
feria-agricultura-familiar/
├── index.html                 # Meta tags, idioma y título
├── vite.config.js             # Plugins de React + Tailwind
├── public/images/             # Ilustraciones SVG locales
├── src/                       # Frontend React (ver abajo)
└── backend/                   # API Flask + base de datos
    ├── run.py                 # Punto de entrada (gunicorn run:app)
    ├── render.yaml            # Blueprint de despliegue en Render
    ├── requirements.txt
    ├── .env / .env.example    # Variables de entorno (secretos nunca en git)
    ├── app/
    │   ├── __init__.py        # create_app(): CORS restringido + Swagger
    │   ├── config.py          # Configuración desde entorno
    │   ├── db.py              # Acceso PostgreSQL (query parametrizadas)
    │   ├── auth.py            # JWT: crear_token, @requiere_auth, @permisos
    │   └── blueprints/
    │       ├── usuarios.py    # /api/usuarios (registro, login, me)
    │       ├── ferias.py      # /api/ferias    (CRUD + productos)
    │       └── productos.py   # /api/productos (listado y alta)
    ├── db/
    │   ├── schema.sql         # 4 tablas, claves foráneas e índices
    │   ├── rls.sql            # Row Level Security (Postgres/Supabase)
    └── scripts/
        └── init_db.py         # Migración + seed idempotente
```

## Rutas del frontend

| Ruta              | Página     |
| ----------------- | ---------- |
| `/`               | Inicio     |
| `/ferias`         | Catálogo   |
| `/ferias/:id`     | Ficha      |
| `/registro-feria` | Formulario |
| `/acerca-de`      | Información|
| `*`               | 404        |

## API — Endpoints principales

| Método | Endpoint | Autenticación | Respuestas |
| ------ | -------- | ------------- | ---------- |
| POST | `/api/usuarios/registro` | pública | 201, 400 |
| POST | `/api/usuarios/login` | pública | 200, 400, 401 |
| GET | `/api/usuarios/me` | JWT | 200, 401 |
| GET | `/api/ferias` | pública | 200 |
| GET | `/api/ferias/<id>` | pública | 200, 404 |
| POST | `/api/ferias` | productor/admin | 201, 400, 401, 403 |
| PUT | `/api/ferias/<id>` | dueño/admin | 200, 400, 401, 403, 404 |
| DELETE | `/api/ferias/<id>` | dueño/admin | 200, 401, 403, 404 |
| GET | `/api/productos` | pública | 200 |
| POST | `/api/productos` | productor/admin | 201, 400, 401, 403 |

## Flujo de datos

1. `Home` y `Ferias` cargan con `GET http://localhost:5000/api/ferias`.
2. `DetalleFeria` obtiene una feria con `GET /api/ferias/:id`.
3. `FeriaForm` registra una feria con `POST /api/ferias` (Bearer JWT) y
   PostgreSQL la persiste en `ferias` + `feria_productos`.

## Seguridad aplicada (OWASP)

- **Inyección SQL**: 100% consultas parametrizadas (`%s`) vía psycopg.
- **CORS restringido**: solo orígenes del `.env`, prohibido `*` en producción.
- **JWT firmado** con claim `rol` y expiración; contraseñas con hash (scrypt).
- **Autorización por rol**: un productor solo edita sus propias ferias (403).
- **RLS**: políticas a nivel de fila en `db/rls.sql` (defensa en profundidad).

## Despliegue en Render

1. Crea un repositorio con el proyecto.
2. En Render: **New + → Blueprint** → conecta el repo.
3. Render lee `backend/render.yaml`, crea el **Postgres** y la **web** en
   automático, ejecuta las migraciones (`render-build.sh`) y configura las
   variables de entorno.
4. Edita `CORS_ORIGINS` en `render.yaml` con la URL final de tu frontend
   (nunca `*`).

> Nota: el plan gratuito de Postgres en Render expira a los 30 días.