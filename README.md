# MakApp — Backend

API REST en Node.js + MySQL para **MakApp**: gestión de tareas, notas, recordatorios, categorías y contactos, con autenticación de usuarios.

> Para el frontend móvil (Flutter), ver el repositorio de la app: **https://github.com/Makkima16/App_notas_flutter**

---

## Stack tecnológico

| Componente | Tecnología | Por qué |
|---|---|---|
| Servidor | **Node.js + Express** | API REST simple y rápida de levantar |
| Base de datos | **MySQL** | Relacional, ideal para datos con relaciones claras entre entidades |
| Autenticación | **JWT + bcrypt** | Tokens sin estado en servidor, contraseñas cifradas |
| Exposición pública | **ngrok** | Túnel para que el backend, corriendo localmente, sea accesible desde la app en distintos dispositivos/redes |

---

## ¿Por qué una base de datos relacional (MySQL)?

El dominio del problema tiene relaciones claras y estructuradas: una tarea, nota o recordatorio pertenece opcionalmente a una categoría y a un contacto, y todo pertenece a un usuario. Una base de datos relacional como MySQL representa estas relaciones de forma natural mediante llaves foráneas, con consultas simples y predecibles — más sencillo de modelar y razonar que una base NoSQL para este caso, donde las relaciones tocaría manejarlas manualmente desde el código de la aplicación.

---

## Proceso de desarrollo del backend

1. **Diseño del modelo de datos** — definición de las tablas de dominio y sus relaciones antes de escribir código.
2. **CRUD base** — se construyeron primero las rutas de tareas, notas y recordatorios, probadas de forma aislada con Postman, sin depender de ninguna interfaz móvil.
3. **Validación de conexión** — antes de invertir tiempo en la app definitiva, se validó que un cliente externo pudiera consumir la API correctamente (peticiones HTTP, parseo de JSON, manejo de errores).
4. **Categorías y contactos** — se extendió el modelo con dos entidades adicionales de dominio, completando las 5 tablas requeridas, todas relacionadas mediante llaves foráneas.
5. **Autenticación** — se agregó registro/login con JWT, y se reestructuraron las tablas existentes para que cada registro pertenezca a un usuario específico (antes los datos eran compartidos globalmente).

---

## Estructura del proyecto

```
backend/
├── .env
├── server.js
├── db.js
├── schema.sql
├── middleware/
│   └── auth.js              # verifica el JWT en cada petición protegida
└── routes/
    ├── auth.js               # registro / login (rutas públicas)
    ├── tasks.js
    ├── notes.js
    ├── reminders.js
    ├── categories.js
    └── contacts.js
```

---

## Modelo de datos

5 tablas de dominio (sin contar `users`, que es de autenticación), todas relacionadas mediante llaves foráneas:

```
users (autenticación — no cuenta como tabla de dominio)
  │  (cada tabla de dominio referencia user_id)
  │
  ├── categories ──┬── tasks ──── contacts
  │                ├── notes
  │                └── reminders ── contacts
```

| Tabla | Campos principales | Relaciones |
|---|---|---|
| `users` | name, email, password_hash | — (tabla de autenticación) |
| `categories` | name, color | pertenece a `users` |
| `tasks` | title, description, status, due_date | `category_id`, `contact_id`, `user_id` |
| `notes` | title, content | `category_id`, `user_id` |
| `reminders` | title, description, reminder_date, is_active | `category_id`, `contact_id`, `user_id` |
| `contacts` | name, email, phone | pertenece a `users` |

Las llaves foráneas hacia `categories`/`contacts` usan `ON DELETE SET NULL` (si se borra una categoría o contacto, el elemento asociado simplemente queda sin esa relación). Las llaves hacia `users` usan `ON DELETE CASCADE`.

El script completo de creación está en `schema.sql`.

---

## Endpoints disponibles

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | No | Crea una cuenta nueva |
| POST | `/api/auth/login` | No | Inicia sesión, devuelve un JWT |
| GET | `/api/tasks` | Sí | Lista las tareas del usuario autenticado |
| GET | `/api/tasks/:id` | Sí | Detalle de una tarea |
| POST | `/api/tasks` | Sí | Crea una tarea |
| PUT | `/api/tasks/:id` | Sí | Actualiza una tarea |
| DELETE | `/api/tasks/:id` | Sí | Elimina una tarea |
| GET/POST/PUT/DELETE | `/api/notes` `/api/notes/:id` | Sí | CRUD de notas |
| GET/POST/PUT/DELETE | `/api/reminders` `/api/reminders/:id` | Sí | CRUD de recordatorios |
| GET/POST/PUT/DELETE | `/api/categories` `/api/categories/:id` | Sí | CRUD de categorías |
| GET/POST/PUT/DELETE | `/api/contacts` `/api/contacts/:id` | Sí | CRUD de contactos |

Las rutas protegidas requieren el header `Authorization: Bearer <token>`. Todas filtran automáticamente por el usuario autenticado (`req.userId`, extraído del token) — cada usuario solo puede leer y modificar sus propios datos.

---

## Autenticación

- Las contraseñas se almacenan cifradas con **bcrypt** (`bcryptjs`), nunca en texto plano.
- Al registrarse o iniciar sesión, el servidor firma un **JWT** (`jsonwebtoken`) que incluye el `id` del usuario, válido por 7 días.
- Un middleware (`middleware/auth.js`) intercepta toda petición a rutas protegidas, valida el token contra `JWT_SECRET` (definido en `.env`), y adjunta `req.userId` para que cada consulta SQL filtre correctamente por ese usuario.

---

## Variables de entorno (`.env`)

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=crud_app
PORT=3000
JWT_SECRET=una_clave_larga_y_aleatoria_unica
```

---

## Método de conexión (exposición del backend)

**Método elegido: túnel local con ngrok.** El backend corre en un portátil de desarrollo y se expone temporalmente a internet para que la app (en emuladores, dispositivos físicos o la Mac de la universidad) pueda alcanzarlo sin necesidad de estar en la misma red local.

```bash
# 1. Levantar el backend
node server.js          # corre en localhost:3000

# 2. Exponerlo con ngrok (en otra terminal)
ngrok http 3000
```

ngrok entrega una URL pública temporal, por ejemplo:
```
https://7dd4-170-246-112-130.ngrok-free.app
```

> Esta URL cambia cada vez que se reinicia ngrok (plan gratuito). La URL vigente para pruebas/demo debe actualizarse en la app móvil (ver README del repositorio Flutter).

**URL de prueba actual:** `_(completar con la URL activa de ngrok antes de la entrega/demo)_`

**Alternativa sin ngrok** (mismo dispositivo/red local): el backend también es accesible directamente vía `http://localhost:3000` o por la IP local del equipo en la misma red WiFi.

> Nota técnica: con ngrok gratuito, las peticiones deben incluir el header `ngrok-skip-browser-warning: true`, o ngrok intercepta la petición con su propia página de advertencia en vez de dejarla pasar al backend.

### Despliegue

Se optó por **ejecución local + túnel ngrok** en lugar de contenedores (Docker/Podman) o Kubernetes, dado el alcance y tiempo disponible del proyecto. El backend se ejecuta directamente con Node.js sobre el portátil de desarrollo, sin contenerización.

---

## Cómo correr el backend

```bash
npm install
# Configura .env con tus credenciales de MySQL y un JWT_SECRET propio
mysql -u root -p < schema.sql
node server.js
```

Para exponerlo a internet (si se va a probar desde otro dispositivo/red):
```bash
ngrok http 3000
# copiar la URL generada y configurarla en la app móvil
```

---

## Probar la API sin la app móvil

Con Postman o `curl`, por ejemplo:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'
```

La respuesta incluye el `token` necesario para autenticar el resto de peticiones.

---

## Estado del backend

- [x] Registro e inicio de sesión funcionales (JWT + bcrypt)
- [x] CRUD completo en las 5 tablas de dominio
- [x] Base de datos relacional con 5 tablas de dominio, relacionadas por llaves foráneas
- [x] Cada usuario accede únicamente a sus propios datos
- [x] Conexión expuesta mediante túnel (ngrok)
- [ ] Despliegue containerizado (no implementado — se optó por ejecución local + túnel)

> Para el estado y funcionalidades del lado de la app móvil (pantallas, UI, modo oscuro, etc.), ver el repositorio Flutter: **https://github.com/Makkima16/App_notas_flutter**