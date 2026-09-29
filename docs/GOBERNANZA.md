# Plan de Gobernanza de Datos y Seguridad

**Proyecto:** Feria de Agricultura Familiar (Plataforma web de productos agroecológicos)
**Asignatura:** Programación Web II
**Universidad:** U.P.D.S. — Santa Cruz, Bolivia
**Fecha:** 2026
**Aplica a:** el sistema en producción (`feria-agricultura-familiar.vercel.app`) y su cadena de desarrollo.

---

## 1. Objetivo

Garantizar que los datos de productores, ferias y productos se gestionen de forma segura, íntegra, disponible y ética; definir roles, procedimientos de despliegue y respuesta ante incidentes; y alinear la operación del sistema con la normativa boliviana aplicable, el modelo OWASP ASVS y los principios de sostenibilidad digital.

---

## 2. Roles y responsabilidades

| Rol | Responsabilidad | Personas |
|---|---|---|
| Administrador del sistema | Gestión de usuarios, ferias y apartados destacados; supervisión de métricas; decisiones de despliegue. | Docente / desarrollador |
| Productor | Gestión de sus propios productos perecederos y vinculación a ferias. | Productores registrados |
| Visitante anónimo | Navega el catálogo público y el tablero de sostenibilidad sin registrarse. | Público |
| Desarrollador / mantenedor | Mantiene el código, aplica actualizaciones, vigila la seguridad y los respaldos. | Equipo de desarrollo |
| Proveedor de datos (hosting/BD) | Infraestructura e integridad de la capa física. | Supabase (PostgreSQL alojado) y Vercel (runtime) |

Cada rol tiene acceso solo a los recursos que necesita (principio de **privilegio mínimo**; ver §4).

---

## 3. Ciclo de vida de los datos

1. **Recolección.** La API recibe datos por formularios validados; las consultas usan **parámetros preparados** (`psycopg`) para blindar contra inyección SQL. Los datos personales son mínimos e indispensables (nombre, email, teléfono comercial).
2. **Almacenamiento.** PostgreSQL en **Supabase**. Las conexiones son cifradas (`sslmode=require`). Las contraseñas de los usuarios se guardan **con hash seguro** (SHA-256 con salt por usuario, algoritmo del formateo interno de la BD) y **nunca** en texto plano.
3. **Uso.** El acceso a datos por la API exige token JWT con expiración; los roles `admin`/`productor` restringen qué se puede leer/modificar.
4. **Respaldo.** Supabase realiza **respaldos automáticos diarios** y retención continua de cambios; complementariamente se programa un **respaldo manual semanal** de la base (`.sql`) al finalizar cada hito de la actividad.
5. **Retención y eliminación.** Las cuentas de prueba se limpian automáticamente tras cada batería de pruebas e2e (contenido tabulado de `scripts/pruebas_e2e.py`). Un pedido de baja de un productor elimina sus datos personales y desvincula sus productos del catálogo.

---

## 4. Acceso y autenticación

- Autenticación por **JWT** (`PyJWT`): token con `exp` de **60 minutos**; las rutas protegidas verifican firma y expiración en cada petición.
- **Roles:** `admin` (administra ferias, destacados y usuarios) y `productor` (administra productos propios). Se validan con el campo `role` del token, firmado, no editable por el cliente.
- **CORS restringido:** `CORS_ORIGINS` contiene únicamente el origen de producción; no se usa `*`.
- **Secretos:** claves (`SECRET_KEY`, `JWT_SECRET`, `DATABASE_URL`) solo en variables de entorno del proveedor; nunca versionadas (`.gitignore` protege `.env*`; `.env.example` documenta los nombres sin valores).
- Tasado de intentos de acceso en el formulario de inicio de sesión: aplazamiento progresivo tras múltiples intentos fallidos (bloqueo tras 5 intentos en el mismo usuario).

---

## 5. Seguridad de la información (OWASP + normativa)

- **Inyección SQL:** consultas con parámetros preparados en `psycopg` (controlado también por tests e2e que intentan payloads maliciosos).
- **XSS:** el backend **escapa y limita** la salida de datos (longitud de campos); la SPA compilada con Vite minimiza la vectores de inyección al no usar `dangerouslySetInnerHTML`.
- **Tokens en el cliente:** el JWT se conserva solo en memoria de la sesión de la app (no en `localStorage` persistente), reduciendo exfiltración en equipos compartidos.
- **Encabezados HTTP:** `X-Content-Type-Options`, `X-Frame-Options` y CSP definidos por el servidor/plataforma; tráfico exclusivamente **HTTPS** (Vercel y Supabase).
- **Normativa boliviana:** tratamiento de información personal bajo los principios del **derecho a la intimidad** (CPE art. 21 y Código Civil) y atención a la **Ley N.º 164 de Telecomunicaciones** y su reglamento de **ciberseguridad**; se declara el tratamiento de datos en la sección de información del producto.
- **Divulgación responsable:** ante una vulnerabilidad real, se comunica al administrador del sistema y se corrige antes de 7 días hábiles antes de cualquier anuncio público.

---

## 6. Monitorización y disponibilidad

- **Health check**: `GET /api/health` expone estado de la app y de la conexión a base de datos.
- **Uptime:** supervisión programada (cada 5 min) mediante servicio de *uptime monitoring* apuntando a `/api/health`; alerta por correo si detecta caída >1 min.
- **Métricas de sostenibilidad:** el tablero `/sostenibilidad` muestra en vivo `co2_por_vista_g`, `km_evitados` y `co2_evitado_kg`, calculados con la metodología documentada en `/api/metricas`.
- **Característica del plan gratuito:** la instancia entra en **suspensión tras ~15 min de inactividad**; la primera petición tras la suspensión tarda más (aprox. 30–50 s en Vercel por cold start). Se documenta a usuarios y docentes como limitación propia del plan.
- **Registro (logging):** errores de servidor con traza y *stack* se registran en el backend; las peticiones exitosas no se loguean con datos personales (mínimo registro de HTTP).

---

## 7. Gestión de incidentes

| Severidad | Definición | Respuesta | SLA |
|---|---|---|---|
| Crítica | Caída total o fuga de datos real | Desconectar servicio, notificar a administradores, respaldar evidencia, restaurar desde respaldo | < 2 h |
| Alta | API degradada (errores 5xx) o inicio de sesión bloqueado | Reinicio a través de la plataforma, verificar health, revisar logs | < 6 h |
| Media | Fallo menor de una ruta sin afectar catálogo | Corrección en siguiente release con prueba e2e previa | < 48 h |
| Baja | Mejora estética o de texto | Programar en backlog | siguiente iteración |

Después de cada incidente se registra: causa, impacto, remediación y acción preventiva (documento `INCIDENTES.md` si el historial lo amerita).

---

## 8. Gestión de cambios y despliegue

- **Flujo de trabajo:** trabajo en rama local → pruebas e2e (33/33) y lint → *commit* con mensaje descriptivo → *push* a `main` → despliegue automático en Vercel.
- **Integración continua:** cada *push* a `main` detona el build y el despliegue de Vercel; el frontend compilado (`dist/`) y el entrypoint WSGI (`api/index.py`) son parte del repositorio para que la plataforma sirva SPA+API con un solo runtime.
- **Rollback:** Vercel conserva despliegues anteriores; ante una regresión se **re-deploya la versión inmediatamente anterior** (1 clic) sin perder datos, porque datos y código viven separados.
- **Reversión de base de datos:** por el esquema heredado, toda migración destructiva se aprueba por el administrador y se ejecuta con respaldo previo.
- **Versionado semántico de cambios**: cada actividad deja trazas (`Act.3`, `Act.4` en mensajes de *commit*) que permiten reconstruir el recorrido del proyecto.

---

## 9. Accesibilidad y experiencia para todos

- Orientación a **WCAG 2.1 AA**: contraste suficiente de colores, `alt` en imágenes, semántica correcta de botones/inputs y navegación con tab.
- El sitio público **no exige registro** para ver el catálogo, garantizando inclusión de usuarios sin cuenta.
- Texto y etiquetas en español, con instrucciones claras en formularios de registro.

---

## 10. Sostenibilidad digital

- El sistema **mide y publica** su huella (`co2_por_vista_g`) con la fórmula de referencia del sector; el tablero de sostenibilidad hace visible el impacto *per view* y el evitado por compra local.
- Políticas: imágenes vectoriales (SVG) en vez de fotografías pesadas; bundle único minimizado (< 350 KB); sin dependencias *junk*. El repositorio versiona solo lo esencial (se excluyen caches).
- Cada release nuevo contrasta que el tamaño renderizado (`tamano_kb`) no crezca más de un 20 % respecto de la base.

---

## 11. Revisión y mejora continua

- Revisión del plan de gobernanza al menos **una vez por semestre** o ante un cambio importante de tecnología/arquitectura.
- Actualización de dependencias con aviso de vulnerabilidades conocido (`npm audit`, `pip-audit`) cada mes.
- Las métricas y la cobertura de pruebas se revisan en cada hitos del proyecto (Act. 1–4).

---

## Anexo A — Vectores de responsabilidad simplificados

```
 Usuarios ──(HTTPS)──> Vercel (Flask/app WSGI + dist SPA) ──(psycopg con SSL)──> Supabase (PostgreSQL)
                              │
                              ├── /api/health     → monitor externo (cada 5 min)
                              ├── /api/metricas   → tablero de sostenibilidad
                              └── Respaldos       → automáticos diarios (Supabase) + manual semanal (.sql)
```

Este documento complementa el informe APA 7 de la Actividad 4 (referencia cruzada en su sección de metodología y recomendaciones).