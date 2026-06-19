# MakApp

Aplicación móvil multiplataforma (Android + iOS) para gestionar **tareas, notas y recordatorios**, organizados por categorías y asociables a contactos, con autenticación de usuarios. Backend propio con Node.js y base de datos MySQL.

---

## Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **Flutter (Dart)** | Multiplataforma — un solo código para Android e iOS |
| Backend | **Node.js + Express** | API REST simple y rápida de levantar |
| Base de datos | **MySQL** | Relacional, ideal para datos con relaciones claras entre entidades |
| Autenticación | **JWT + bcrypt** | Tokens sin estado en servidor, contraseñas cifradas |
| Cliente HTTP | **Dio** | Equivalente a Retrofit en el mundo Flutter |
| Almacenamiento seguro | **flutter_secure_storage** | Guarda el token de sesión en el dispositivo |

---

## Decisiones de diseño

### ¿Por qué Flutter?

El proyecto arrancó como una app nativa de Android en Kotlin con Android Studio. Cuando surgió el requisito de que la app también funcionara en **iPhone**, nos encontramos con una limitación real: Android Studio no puede compilar para iOS bajo ninguna circunstancia, y Xcode (la única herramienta capaz de hacerlo) solo corre en macOS.

Evaluamos tres caminos:
1. **Mantener dos apps nativas separadas** (Kotlin para Android + Swift para iOS) — descartado por duplicar todo el trabajo de UI y lógica.
2. **React Native** — válido, pero requería aprender un ecosistema JavaScript distinto al que ya conocíamos, y el documento de la materia no lo permite por estar basado en WebView en algunos casos de uso comunes.
3. **Flutter** — un solo código en Dart que compila a binarios nativos tanto para Android como para iOS, manteniendo buen rendimiento y sin depender de un WebView.

Se eligió **Flutter** porque permitía reescribir la app una sola vez y mantenerla así de ahí en adelante, sin duplicar lógica de negocio ni arriesgar inconsistencias entre versiones.

### ¿Por qué una base de datos relacional (MySQL)?

Desde el inicio el dominio del problema tenía relaciones claras y estructuradas: una tarea, nota o recordatorio pertenece opcionalmente a una categoría y a un contacto, y todos pertenecen a un usuario. Una base de datos relacional como MySQL representa estas relaciones de forma natural mediante llaves foráneas, y permite consultas simples y predecibles — más sencillo de modelar que una base de datos NoSQL para este caso.

### Proceso de desarrollo

El proyecto se construyó en etapas, validando cada parte antes de avanzar a la siguiente:

1. **Backend primero.** Se construyó la API REST completa (CRUD de tareas, notas y recordatorios) y se probó de forma aislada con Postman, antes de tocar nada de interfaz móvil.
2. **Prototipo funcional simple en Android nativo (Kotlin).** Se construyó una primera versión básica en Android Studio, sin diseño visual, solo para **comprobar que la comunicación entre el dispositivo y el backend funcionara correctamente**.
3. **Migración a Flutter**, al surgir el requisito de soporte para iOS, manteniendo los mismos endpoints y contratos de datos ya validados.
4. **Diseño visual.** Se desarrolló un prototipo de diseño (paleta índigo/crema, tarjetas redondeadas, navegación inferior con botón flotante) y se implementó sobre la base funcional ya existente.
5. **Categorías, contactos y refinamiento.** Se agregaron las entidades de categorías y contactos, edición/eliminación completas y vistas de detalle.
6. **Autenticación.** Se agregó registro/login con JWT, y los datos existentes se reestructuraron para pertenecer a cada usuario individualmente (en vez de ser compartidos globalmente).

---

## Estructura del backend

```
backend/
├── .env
├── server.js
├── db.js
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

### Modelo de datos

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
| `categories` | name, color | pertenece a `users` |
| `tasks` | title, description, status, due_date | `category_id`, `contact_id`, `user_id` |
| `notes` | title, content | `category_id`, `user_id` |
| `reminders` | title, description, reminder_date, is_active | `category_id`, `contact_id`, `user_id` |
| `contacts` | name, email, phone | pertenece a `users` |

Todas las llaves foráneas de categoría/contacto usan `ON DELETE SET NULL` (si se borra una categoría o contacto, el elemento asociado simplemente queda sin esa relación). Las llaves hacia `users` usan `ON DELETE CASCADE`.

### Endpoints disponibles

| Método | Ruta | Protegida | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | No | Crea una cuenta nueva |
| POST | `/api/auth/login` | No | Inicia sesión, devuelve un JWT |
| GET/POST/PUT/DELETE | `/api/tasks` `/api/tasks/:id` | Sí | CRUD de tareas |
| GET/POST/PUT/DELETE | `/api/notes` `/api/notes/:id` | Sí | CRUD de notas |
| GET/POST/PUT/DELETE | `/api/reminders` `/api/reminders/:id` | Sí | CRUD de recordatorios |
| GET/POST/PUT/DELETE | `/api/categories` `/api/categories/:id` | Sí | CRUD de categorías |
| GET/POST/PUT/DELETE | `/api/contacts` `/api/contacts/:id` | Sí | CRUD de contactos |

Las rutas protegidas requieren el header `Authorization: Bearer <token>`. Todas filtran automáticamente por el usuario autenticado — cada usuario solo ve y puede modificar sus propios datos.

---

## Estructura del frontend (Flutter)

```
lib/
├── main.dart                    # AuthGate: decide Login o Home según sesión guardada
├── theme/
│   └── app_theme.dart           # paleta de colores, modo claro/oscuro
├── models/
│   ├── user.dart
│   ├── task.dart
│   ├── note.dart
│   ├── reminder.dart
│   ├── category.dart
│   └── contact.dart
├── services/
│   ├── api_client.dart          # Dio + interceptor que adjunta el JWT automáticamente
│   ├── auth_service.dart        # login/registro/logout + almacenamiento seguro del token
│   ├── task_service.dart
│   ├── note_service.dart
│   ├── reminder_service.dart
│   ├── category_service.dart
│   └── contact_service.dart
├── widgets/
│   └── create_item_sheet.dart   # modal de creación rápida (tarea/nota/recordatorio)
└── screens/
    ├── login_screen.dart
    ├── register_screen.dart
    ├── home_screen.dart         # dashboard con filtros por categoría
    ├── category_screen.dart
    ├── contact_screen.dart
    ├── task_screen.dart / note_screen.dart / reminder_screen.dart
    └── task_detail_screen.dart / note_detail_screen.dart / reminder_detail_screen.dart
```

---

## Método de conexión App ↔ Backend

**Método elegido: túnel local con ngrok**, dado que el backend corre en el portátil personal y necesita ser accesible desde los emuladores/dispositivos usados en clase (incluyendo la Mac de la universidad).

```bash
# 1. Levantar el backend
cd backend
node server.js          # corre en localhost:3000

# 2. Exponerlo con ngrok (en otra terminal)
ngrok http 3000
```

ngrok entrega una URL pública temporal, por ejemplo:
```
https://abc123.ngrok-free.app
```

> **Esta URL cambia cada vez que se reinicia ngrok** (plan gratuito). La URL vigente para la demostración se actualiza en `lib/services/api_client.dart`, en la constante `baseUrl`.

**URL de prueba actual:** `_(completar aquí con la URL activa de ngrok antes de la entrega/demo)_`

**Alternativas usadas durante desarrollo** (cuando no se necesita acceso externo):

| Entorno | URL |
|---|---|
| Emulador Android | `http://10.0.2.2:3000/api/` |
| Simulador iOS | `http://localhost:3000/api/` |
| Flutter Web | `http://localhost:3000/api/` |

> Nota técnica: con ngrok gratuito, las peticiones deben incluir el header `ngrok-skip-browser-warning: true` (ya configurado en `api_client.dart`) para evitar que ngrok intercepte la petición con su página de advertencia.

### Despliegue

Para este proyecto se optó por **ejecución local + túnel ngrok** en lugar de contenedores (Docker/Podman) o Kubernetes, dado el alcance y tiempo disponible. El backend se ejecuta directamente con Node.js sobre el portátil de desarrollo.

---

## Funcionalidades

- ✅ Registro e inicio de sesión con JWT, contraseñas cifradas con bcrypt
- ✅ Cada usuario ve únicamente sus propios datos (tareas, notas, recordatorios, categorías, contactos)
- ✅ CRUD completo de tareas, notas, recordatorios, categorías y contactos (crear, ver, editar, eliminar)
- ✅ Categorías personalizables con color, asignables a tareas/notas/recordatorios
- ✅ Contactos (nombre, correo, teléfono) asignables a tareas y recordatorios
- ✅ Botón "Enviar a [contacto]" — abre la app de correo con la info de la tarea/recordatorio prellenada
- ✅ Filtrado de toda la app por categoría
- ✅ Dashboard principal: Inicio / Recordatorios / Tareas / Notas + botón flotante de creación rápida
- ✅ Tareas con fecha de vencimiento opcional y marcado de completado
- ✅ Recordatorios con barra de progreso visual según cercanía a la fecha
- ✅ Vista de detalle individual por cada elemento, consultada vía API (GET por id)
- ✅ Modo claro / oscuro
- ✅ Compatible con Android, iOS y Web

---

## Cómo correr el proyecto

### Backend

```bash
cd backend
npm install
# Configura .env con tus credenciales de MySQL y un JWT_SECRET propio
mysql -u root -p < schema.sql
node server.js
```

### Exponer el backend (si se prueba desde otro dispositivo/red)

```bash
ngrok http 3000
# copiar la URL generada y actualizarla en lib/services/api_client.dart
```

### Flutter

```bash
cd flutter_app
flutter pub get
flutter run
```

> El backend debe estar corriendo (y, si aplica, el túnel ngrok activo) **antes** de abrir la app, sin importar en qué dispositivo o emulador se pruebe.

---

## Estado del proyecto / pendientes

- [x] Registro e inicio de sesión funcionales
- [x] CRUD completo en backend
- [x] Base de datos relacional con 5 tablas de dominio (categories, tasks, notes, reminders, contacts)
- [x] Conexión App-backend mediante túnel (ngrok)
- [x] Aplicación operativa en Android (confirmado)
- [ ] Aplicación operativa en iOS (pendiente de prueba final en Mac)
- [x] Mínimo 5 pantallas de dominio (dashboard, categorías, contactos, tareas, notas, recordatorios + detalles)
- [x] Documentación con README y endpoints
- [ ] Video demostrativo (máx. 3 min)