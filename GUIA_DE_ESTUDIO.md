# Guía de estudio — File Uploader (Drive simplificado)

> Esta guía está pensada para que aprendas el proyecto **de principio a fin**, entendiendo qué hace cada archivo, en qué orden se ejecuta y por qué existe cada pieza.
>
> No es una documentación aburrida: es un recorrido guiado. Lee, ejecuta la app y ve mirando la consola. Cada acción tiene logs que te dicen exactamente en qué paso estás.

---

## Índice

1. [Qué vas a aprender](#1-qué-vas-a-aprender)
2. [Cómo usar esta guía](#2-cómo-usar-esta-guía)
3. [Requisitos y puesta en marcha](#3-requisitos-y-puesta-en-marcha)
4. [Visión general del proyecto](#4-visión-general-del-proyecto)
5. [Mapa de archivos](#5-mapa-de-archivos)
6. [El orden real de ejecución](#6-el-orden-real-de-ejecución)
7. [Recorrido archivo por archivo](#7-recorrido-archivo-por-archivo)
8. [Flujos completos explicados](#8-flujos-completos-explicados)
9. [Cómo leer los logs](#9-cómo-leer-los-logs)
10. [Conceptos clave](#10-conceptos-clave)
11. [Ejercicios prácticos](#11-ejercicios-prácticos)
12. [Errores comunes y soluciones](#12-errores-comunes-y-soluciones)
13. [Checklist final](#13-checklist-final)
14. [Glosario](#14-glosario)
15. [Siguientes pasos](#15-siguientes-pasos)

---

## 1. Qué vas a aprender

Al terminar esta guía deberías poder explicar, sin mirar el código:

- Cómo arranca una aplicación Express con ESM.
- Cómo se conecta Prisma con PostgreSQL.
- Cómo funcionan las sesiones guardadas en base de datos.
- Cómo Passport autentica con usuario y contraseña.
- Cómo se protege una ruta con un middleware.
- Cómo se organiza un proyecto en capas: `routes → controller → model → prisma`.
- Cómo se sube un archivo con Multer y se guarda en disco.
- Cómo se descarga un archivo de forma segura.
- Cómo se valida que un recurso exista y pertenezca al usuario.
- Cómo se renderiza una vista EJS con datos dinámicos.
- Cómo se manejan errores 404 y 500.
- Cómo se cierra el servidor de forma ordenada.

---

## 2. Cómo usar esta guía

### Regla de oro

No leas todo de golpe. Hazlo en este orden:

1. Lee una sección.
2. Abre el archivo que se menciona.
3. Ejecuta la app.
4. Provoca la acción en el navegador.
5. Mira la consola.
6. Vuelve al código y conecta el log con la línea que lo imprime.

### Sugerencia de ritmo

| Fase | Tema | Archivos principales |
|---|---|---|
| Día 1 | Arranque y configuración | `package.json`, `.env`, `app.js` |
| Día 2 | Base de datos | `prisma/schema.prisma`, `lib/prisma.js`, `model/*` |
| Día 3 | Autenticación | `config/passport.js`, `controller/authController.js` |
| Día 4 | Protección y rutas | `middleware/authMiddleware.js`, `routes/driveRoutes.js` |
| Día 5 | Drive y archivos | `controller/driveController.js`, `middleware/upload.js` |
| Día 6 | Vistas | `views/*.ejs` |
| Día 7 | Repaso y ejercicios | Todo el proyecto |

### Convenciones de esta guía

- `📦` = carga de un módulo.
- `🟢` = paso de arranque.
- `📥 / 📤` = petición HTTP.
- `🗃️` = consulta a base de datos.
- `🎨` = renderizado de vista.
- `🛂` = Passport / autenticación.
- `🔐` = middleware de sesión.

---

## 3. Requisitos y puesta en marcha

### 3.1 Requisitos

- Node.js 20.19+, 22.12+ o 24+.
- pnpm.
- Una base de datos PostgreSQL (puede ser Supabase, Neon, Railway o local).

### 3.2 Instalar dependencias

```bash
pnpm install
```

Si pnpm avisa que ignoró scripts de build de Prisma:

```bash
pnpm approve-builds
```

Permite `prisma` y `@prisma/engines`.

### 3.3 Configurar `.env`

Crea o revisa el archivo `.env` en la raíz:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/base?schema=public"
SESSION_SECRET="un_secreto_largo_y_aleatorio"
PORT=3000
```

> ⚠️ **Estado actual detectado:** tu `.env` tiene `DATABASE_URL=` vacía. La app arranca y muestra los logs, pero las consultas a la base de datos fallarán. Restaura tu URL real antes de probar registro, login o el Drive.

Para generar un secreto:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Generar el cliente de Prisma

```bash
pnpm prisma generate --config prisma7.config.js
```

### 3.5 Arrancar

```bash
pnpm dev
```

Abre `http://localhost:3000`.

### 3.6 Qué deberías ver en consola

Primero verás los logs de los módulos (`📦`), luego los pasos de arranque (`🟢 [PASO 1]` … `[PASO 10]`) y al final:

```text
🚀 Servidor escuchando en http://localhost:3000
```

---

## 4. Visión general del proyecto

### 4.1 ¿Qué hace la app?

Es un clon simplificado de Google Drive:

- Registro e inicio de sesión.
- Sesiones guardadas en PostgreSQL.
- Dashboard con carpetas y archivos.
- Carpetas planas (sin subcarpetas).
- Subida de archivos hasta 10 MB.
- Descarga autenticada.
- Eliminación de archivos y carpetas.
- Cada usuario solo ve sus propios recursos.

### 4.2 Arquitectura en capas

```text
Navegador
   │
   │ HTTP
   ▼
Express (app.js)
   ├── Sesiones (PrismaSessionStore)
   ├── Passport (req.user)
   │
   ├── /auth ──► authController ──► userModel ──► Prisma ──► PostgreSQL
   │              └──► views/login.ejs, views/register.ejs
   │
   └── / ──► estaAutenticado ──► driveRoutes ──► driveController
                                                ├── fileModel / folderModel ──► Prisma ──► PostgreSQL
                                                └── Multer ──► uploads/
```

### 4.3 Flujo de una petición

```text
Petición HTTP
   │
   ▼
Logger de peticiones
   │
   ▼
express.urlencoded / express.json
   │
   ▼
express-session (lee cookie y busca sesión en PostgreSQL)
   │
   ▼
passport.session() (reconstruye req.user)
   │
   ▼
Ruta correspondiente
   │
   ├── Middleware de existencia (si hay :id)
   ├── Middleware de autenticación (en rutas del Drive)
   ▼
Controlador
   │
   ├── Modelo (consulta a BD)
   ├── Multer (si es subida)
   ├── fs (si hay archivo físico)
   ▼
res.render / res.redirect / res.download
   │
   ▼
Logger de respuesta (código + duración)
```

### 4.4 Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| Node.js + ESM | Ejecutar JavaScript moderno con `import` |
| Express 5 | Servidor HTTP y rutas |
| EJS | Plantillas HTML del lado del servidor |
| Prisma 7 | ORM para PostgreSQL |
| PostgreSQL | Base de datos |
| Passport + passport-local | Autenticación con usuario/contraseña |
| bcryptjs | Hashear contraseñas |
| express-session | Manejo de sesiones |
| @quixo3/prisma-session-store | Guardar sesiones en PostgreSQL |
| Multer | Subida de archivos multipart |
| dotenv | Leer variables de `.env` |

---

## 5. Mapa de archivos

```text
File-Uploader/
├── .env                      # Variables secretas (NO se sube a git)
├── .env.example              # Ejemplo de variables
├── .gitignore                # Qué NO subir a git
├── package.json              # Dependencias y scripts
├── prisma7.config.js         # Configuración de la CLI de Prisma
├── app.js                    # Punto de entrada y arranque de Express
│
├── config/
│   └── passport.js           # Estrategia de autenticación
│
├── lib/
│   └── prisma.js             # Cliente Prisma compartido
│
├── middleware/
│   ├── authMiddleware.js     # estaAutenticado
│   ├── existe.js             # verificarExistenciaUser/File/Folder
│   └── upload.js             # Configuración de Multer
│
├── model/
│   ├── userModel.js          # Consultas a User
│   ├── fileModel.js          # Consultas a File
│   └── folderModel.js        # Consultas a Folder
│
├── controller/
│   ├── authController.js     # Login, registro, logout
│   ├── driveController.js    # Dashboard, carpetas, subida, descarga, borrado
│   └── userController.js     # CRUD de usuarios (no montado)
│
├── routes/
│   └── driveRoutes.js        # Tabla de rutas del Drive
│
├── views/
│   ├── login.ejs             # Formulario de login
│   ├── register.ejs          # Formulario de registro
│   └── index.ejs             # Dashboard del Drive
│
├── prisma/
│   ├── schema.prisma         # Modelos de la base de datos
│   └── migrations/           # Historial de migraciones SQL
│
├── uploads/                  # Archivos físicos subidos (NO se sube a git)
├── generated/prisma/         # Cliente generado por Prisma (NO editar)
└── node_modules/             # Dependencias (NO editar)
```

### Responsabilidad de cada capa

| Capa | Archivo | Responsabilidad |
|---|---|---|
| Entrada | `app.js` | Crear Express, configurar middlewares, montar rutas, escuchar |
| Config | `config/passport.js` | Definir cómo se autentica un usuario |
| Conexión | `lib/prisma.js` | Crear el cliente de base de datos |
| Modelo | `model/*.js` | Hablar con la base de datos (CRUD) |
| Controlador | `controller/*.js` | Recibir `req`, decidir, llamar modelos, responder |
| Middleware | `middleware/*.js` | Filtrar, validar o enriquecer la petición antes del controlador |
| Rutas | `routes/*.js` | Unir URL + middlewares + controlador |
| Vista | `views/*.ejs` | Generar el HTML que ve el usuario |

---

## 6. El orden real de ejecución

Cuando ejecutas `node app.js`, **no se ejecuta primero la línea 1 de `app.js`**. Primero se cargan todos los `import`. Esto es clave para entender el orden de los logs.

### 6.1 Orden de carga de módulos

```text
1. app.js empieza a resolverse
2. import 'dotenv/config'          → carga .env
3. import './lib/prisma.js'        → 📦 PRISMA (crea cliente)
4. import './config/passport.js'   → 📦 PASSPORT (configura estrategia)
5. import './controller/authController.js'
      └── import '../model/userModel.js' → 📦 MODEL USER
6. import './middleware/authMiddleware.js' → 📦 AUTH MIDDLEWARE
7. import './routes/driveRoutes.js'
      ├── import '../middleware/upload.js'   → 📦 UPLOAD
      ├── import '../middleware/existe.js'
      │     ├── import '../model/fileModel.js'   → 📦 MODEL FILE
      │     └── import '../model/folderModel.js' → 📦 MODEL FOLDER
      └── import '../controller/driveController.js' → 📦 DRIVE CONTROLLER
8. routes/driveRoutes.js termina e imprime la tabla de rutas
9. app.js ejecuta su cuerpo: 🟢 [PASO 1] ... [PASO 10]
```

### 6.2 Arranque de Express (PASO 1 a 10)

| Paso | Qué hace | Dónde verlo |
|---|---|---|
| `PASO 1` | Carga `.env`, valida `SESSION_SECRET` y `DATABASE_URL` | `app.js` |
| `PASO 2` | Crea `const app = express()` | `app.js` |
| `PASO 3` | Configura EJS y `views/` | `app.js` |
| `PASO 4` | Registra logger, `urlencoded`, `json`, `static` | `app.js` |
| `PASO 5` | Configura sesiones con Prisma | `app.js` |
| `PASO 6` | Inicializa Passport | `app.js` |
| `PASO 7` | Monta `/auth` y `/` | `app.js` |
| `PASO 8` | Registra 404 y 500 | `app.js` |
| `PASO 9` | `app.listen(PORT)` | `app.js` |
| `PASO 10` | Configura cierre con `SIGINT`/`SIGTERM` | `app.js` |

### 6.3 Ciclo de una petición

```text
📥 [PETICIÓN #N]
   → logger
   → sesión
   → passport
   → ruta
   → middleware (auth / existe)
   → controlador
   → modelo / multer / fs
   → render / redirect / download
📤 [PETICIÓN #N] ... → 200 (xx ms)
```

### 6.4 Cierre

```text
CTRL+C
   → 🛑 [SHUTDOWN] SIGINT
   → server.close()
   → prisma.$disconnect()
   → process.exit(0)
```

---

## 7. Recorrido archivo por archivo

> Este es el corazón de la guía. Léelo en orden. Cada archivo tiene: para qué sirve, cuándo se ejecuta, qué mirar y qué aprender.

---

### 7.1 `package.json`

**Para qué sirve:** declara el proyecto, sus dependencias y sus comandos.

**Qué mirar:**

```json
{
  "type": "module",
  "main": "app.js",
  "scripts": {
    "dev": "nodemon app.js",
    "start": "node app.js"
  }
}
```

- `"type": "module"` permite usar `import` en lugar de `require`.
- `main` y los scripts apuntan a `app.js`.
- `dev` usa `nodemon`, que reinicia al guardar cambios.
- `start` usa `node` normal.

**Dependencias importantes:**

| Paquete | Función |
|---|---|
| `express` | Servidor HTTP |
| `ejs` | Plantillas |
| `prisma` / `@prisma/client` | ORM |
| `@prisma/adapter-pg` | Adaptador PostgreSQL para Prisma 7 |
| `passport` / `passport-local` | Autenticación |
| `bcryptjs` | Hash de contraseñas |
| `express-session` | Sesiones |
| `@quixo3/prisma-session-store` | Sesiones en PostgreSQL |
| `multer` | Subida de archivos |
| `dotenv` | Variables de entorno |

**Qué aprender:** en ESM no hay `require`; todo se importa. Los scripts son el contrato de cómo se ejecuta el proyecto.

---

### 7.2 `.env` y `.env.example`

**Para qué sirven:** guardar configuración y secretos fuera del código.

**Variables:**

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `SESSION_SECRET` | Firma de cookies de sesión |
| `PORT` | Puerto del servidor |

**Por qué `.env` no se sube:** contiene secretos. `.gitignore` lo excluye.

**Qué aprender:** nunca escribas contraseñas en el código. Usa `process.env.NOMBRE`.

> ⚠️ Si `DATABASE_URL` está vacía, la app arranca pero falla al consultar la base.

---

### 7.3 `prisma/schema.prisma`

**Para qué sirve:** describe las tablas y relaciones de la base de datos. Prisma genera el cliente a partir de este archivo.

**Modelos:**

#### `User`

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  name      String?
  password  String
  folders   Folder[]
  files     File[]
}
```

- `id` se autoincrementa.
- `username` y `email` son únicos.
- `name` puede ser null (`String?`).
- `password` guarda el hash, nunca la contraseña real.
- `folders` y `files` son relaciones uno-a-muchos.

#### `Folder`

```prisma
model Folder {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  ownerId   Int
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  files     File[]
}
```

- `ownerId` dice quién es el dueño.
- `onDelete: Cascade` significa: si se borra el usuario, sus carpetas también se borran.

#### `File`

```prisma
model File {
  id        Int      @id @default(autoincrement())
  name      String
  size      Int
  mimeType  String
  url       String
  createdAt DateTime @default(now())
  ownerId   Int
  owner     User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  folderId  Int?
  folder    Folder?  @relation(fields: [folderId], references: [id], onDelete: SetNull)
}
```

- `folderId` es opcional: `null` = raíz.
- `onDelete: SetNull` significa: si se borra la carpeta, el archivo queda en la raíz.
- `url` guarda `/uploads/<nombre-generado>`.

#### `Session`

```prisma
model Session {
  id        String   @id
  sid       String   @unique
  data      String
  expiresAt DateTime
  @@map("sessions")
}
```

- La usa `@quixo3/prisma-session-store`.
- `@@map("sessions")` hace que la tabla se llame `sessions` en PostgreSQL.

**Qué aprender:** el schema es la fuente de verdad de la base de datos. Si cambias el schema, debes generar una migración o usar `db push`.

---

### 7.4 `prisma7.config.js`

**Para qué sirve:** configura la CLI de Prisma (no la app en sí).

```js
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env['DATABASE_URL'] },
});
```

**Qué aprender:** la CLI necesita saber dónde está el schema, dónde guardar migraciones y de dónde sacar la URL. Este archivo solo se usa con comandos como `prisma migrate` o `prisma generate`.

---

### 7.5 `lib/prisma.js`

**Para qué sirve:** crear **una sola instancia** de Prisma para toda la app.

```js
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

**Cuándo se ejecuta:** al cargar `app.js`, antes que cualquier controlador.

**Por qué una sola instancia:** crear un cliente por petición agotaría conexiones. Aquí se crea una vez y se reutiliza.

**Logs que verás:**

```text
📦 [MÓDULO lib/prisma.js]
🗄️ [PRISMA] PASO 1 ... PASO 4
⚠️ ADVERTENCIA: DATABASE_URL está vacía...
```

**Qué aprender:** Prisma 7 usa adaptadores. `PrismaPg` conecta con PostgreSQL mediante el driver `pg`.

---

### 7.6 `config/passport.js`

**Para qué sirve:** definir cómo se autentica un usuario y cómo se guarda/restaura en la sesión.

**Tres piezas:**

1. **LocalStrategy**
   - Recibe `username` y `password`.
   - Busca el usuario por `username`.
   - Compara con `bcrypt.compare()`.
   - Si todo va bien: `done(null, user)`.

2. **serializeUser**
   - Se ejecuta al iniciar sesión.
   - Guarda solo el `id` en la sesión.

3. **deserializeUser**
   - Se ejecuta en cada petición con sesión.
   - Busca el usuario por `id`.
   - Lo pone en `req.user`.

**Logs que verás:**

```text
🛂 [PASSPORT] PASO 1: Registrando la estrategia Local...
🛂 [PASSPORT] PASO 3: Configurando serializeUser...
🛂 [PASSPORT] PASO 4: Configurando deserializeUser...
```

Al hacer login:

```text
🔵 [PASSPORT] PASO 2: La estrategia recibió credenciales
   🔎 PASO 2.1: Buscando el usuario...
   🔐 PASO 2.2: Comparando la contraseña...
   ✅ Contraseña válida
```

**Qué aprender:** Passport no guarda la contraseña en la sesión; solo guarda el ID. En cada petición vuelve a buscar el usuario.

---

### 7.7 `model/userModel.js`

**Para qué sirve:** encapsular las consultas a la tabla `User`.

**Funciones:**

| Función | Qué hace |
|---|---|
| `obtenerUsuarios()` | Devuelve todos los usuarios |
| `obtenerUsuarioid(id)` | Busca uno por ID |
| `agregarUsuario(...)` | Crea un usuario |
| `actualizarUsuario(...)` | Actualiza nombre, email y password |
| `eliminarUsuario(id)` | Borra un usuario |

**Patrón:**

```js
export async function obtenerUsuarioid(id) {
    const userbyid = await prisma.user.findUnique({
        where: { id },
    });

    return userbyid;
}
```

**Logs que verás:**

```text
🗃️ [MODEL USER] obtenerUsuarioid(): buscando usuario por ID 1
   ✅ Resultado: "demo"
```

**Qué aprender:** los modelos no saben de HTTP. Solo reciben datos, consultan Prisma y devuelven resultados. Eso los hace reutilizables.

---

### 7.8 `model/fileModel.js`

**Para qué sirve:** encapsular las consultas a la tabla `File`.

**Funciones clave:**

| Función | Qué hace |
|---|---|
| `obtenerArchivosPorUsuario(ownerId, folderId)` | Archivos de un usuario en una carpeta (o raíz) |
| `obtenerArchivosid(id)` | Busca un archivo por ID |
| `agregarArchivo(...)` | Crea el registro del archivo |
| `actualizarArchivo(...)` | Actualiza un archivo |
| `eliminarArchivo(id)` | Borra el registro |

**Detalle importante:**

```js
where: {
    ownerId: ownerId,
    folderId: folderId,
}
```

- Si `folderId` es `null`, Prisma busca `folderId IS NULL`, es decir, archivos en la raíz.
- Si es un número, busca archivos de esa carpeta.

**Logs que verás:**

```text
🗃️ [MODEL FILE] obtenerArchivosPorUsuario()
   👤 ownerId: 1
   📁 folderId: raíz (null)
   ✅ Archivos encontrados: 2
```

**Qué aprender:** el filtro por `ownerId` es lo que garantiza que cada usuario vea solo sus archivos.

---

### 7.9 `model/folderModel.js`

**Para qué sirve:** encapsular las consultas a la tabla `Folder`.

**Funciones clave:**

| Función | Qué hace |
|---|---|
| `obtenerCarpetasPorUsuario(ownerId)` | Carpetas del usuario + conteo de archivos |
| `obtenerCarpetasid(id)` | Busca una carpeta por ID |
| `agregarCarpeta(name, ownerid)` | Crea una carpeta |
| `actualizarCarpeta(...)` | Actualiza una carpeta |
| `eliminarCarpeta(id)` | Borra una carpeta |

**Detalle importante:**

```js
include: {
    _count: {
        select: { files: true },
    },
}
```

Esto añade `folder._count.files`, que la vista usa para mostrar “N archivo(s)”.

**Qué aprender:** `include` sirve para traer relaciones; `_count` sirve para contar sin traer todos los registros.

---

### 7.10 `middleware/authMiddleware.js`

**Para qué sirve:** proteger rutas. Si no hay sesión, no dejas pasar.

```js
export function estaAutenticado(req, res, next) {
    if (req.isAuthenticated?.() === true) {
        return next();
    }

    if (esPeticionApi(req)) {
        return res.status(401).json({ error: 'No autenticado' });
    }

    return res.redirect('/auth/login');
}
```

**Cuándo se ejecuta:** en `app.use('/', estaAutenticado, driveRoutes)`, antes de cualquier ruta del Drive.

**Logs que verás:**

```text
🔐 [AUTH] PASO 1: Verificando si el usuario tiene sesión...
   ✅ Usuario autenticado: demo
   ➡️ PASO 2: Dejando pasar la petición al controlador
```

o

```text
   ❌ No hay sesión activa
   🌐 Es una petición HTML: redirigiendo a /auth/login
```

**Qué aprender:** un middleware es una función `(req, res, next)`. Si llama a `next()`, la petición continúa. Si responde, la petición termina ahí.

---

### 7.11 `middleware/existe.js`

**Para qué sirve:** verificar que un recurso exista antes de que el controlador lo use.

**Tres middlewares:**

| Middleware | Verifica |
|---|---|
| `verificarExistenciaUser()` | Usuario por `req.params.id` |
| `verificarExistenciaFile()` | Archivo por `req.params.id` |
| `verificarExistenciaFolder()` | Carpeta por `req.params.id` |

**Patrón:**

```js
const id = Number(req.params.id);

if (!Number.isInteger(id)) {
    return res.status(400).send('ID inválido');
}

const archivo = await obtenerArchivosid(id);

if (!archivo) {
    return res.status(404).send('Archivo no encontrado');
}

req.recurso = archivo;
next();
```

**Por qué guarda en `req.recurso`:** para que el controlador no tenga que volver a buscar el recurso. Ya está validado y listo.

**Logs que verás:**

```text
🟡 [EXISTE FILE] PASO 1: Verificando archivo...
   🆔 ID recibido: 3
   🔎 PASO 2: Buscando archivo en la base de datos...
   ✅ Archivo encontrado: informe.pdf
   📦 PASO 3: Guardando el recurso en req.recurso
```

**Qué aprender:** separar la validación de existencia del controlador evita repetir código y hace las rutas más legibles.

---

### 7.12 `middleware/upload.js`

**Para qué sirve:** configurar Multer para recibir archivos y guardarlos en `uploads/`.

**Configuración:**

```js
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${randomUUID()}${extension}`;
        cb(null, uniqueName);
    },
});

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});
```

**Decisiones importantes:**

- Se guarda en disco, no en memoria.
- El nombre original se conserva en la base de datos (`File.name`).
- El nombre físico es único para evitar colisiones.
- Límite de 10 MB.

**Logs que verás al subir:**

```text
📤 [UPLOAD] PASO 3.1: Multer eligió el destino del archivo
   📄 Archivo original: foto.png
   📁 Destino: .../uploads
📤 [UPLOAD] PASO 3.2: Generando un nombre único...
   🏷️ Nombre generado: 1730000000000-abc123.png
```

**Qué aprender:** nunca uses el nombre original como nombre físico. Puede repetirse o contener caracteres peligrosos.

---

### 7.13 `controller/authController.js`

**Para qué sirve:** manejar las rutas de autenticación.

**Funciones:**

| Función | Ruta | Qué hace |
|---|---|---|
| `getLogin` | `GET /auth/login` | Renderiza login |
| `postLogin` | `POST /auth/login` | Autentica con Passport |
| `getRegister` | `GET /auth/register` | Renderiza registro |
| `postRegister` | `POST /auth/register` | Crea usuario y lo loguea |
| `logout` | `POST /auth/logout` | Cierra sesión |

**Registro, paso a paso:**

1. Recibe `username`, `email`, `name`, `password`.
2. Hashea la contraseña con `bcrypt.hash(password, 10)`.
3. Crea el usuario con `agregarUsuario()`.
4. `req.login(newUser, ...)` crea la sesión.
5. Redirige a `/`.

**Login, paso a paso:**

1. Recibe credenciales.
2. `passport.authenticate('local', ...)`.
3. Passport ejecuta la estrategia.
4. Si es válido, `req.login()` crea la sesión.
5. Redirige a `/`.

**Manejo de error importante:**

```js
if (error?.code === 'P2002') {
    // username o email duplicado
}
```

`P2002` es el código de Prisma para violación de restricción única.

**Qué aprender:** el controlador no compara contraseñas ni consulta la base directamente. Delega: Passport autentica, el modelo consulta.

---

### 7.14 `controller/driveController.js`

**Para qué sirve:** la lógica principal del Drive.

**Funciones:**

| Función | Ruta | Qué hace |
|---|---|---|
| `getDrive` | `GET /` | Dashboard con carpetas y archivos de la raíz |
| `getFolder` | `GET /folders/:id` | Archivos de una carpeta |
| `postUpload` | `POST /upload` | Guarda archivo físico + registro |
| `downloadFile` | `GET /files/:id/download` | Descarga autenticada |
| `deleteFile` | `POST /files/:id/delete` | Borra registro + archivo físico |
| `postCreateFolder` | `POST /folders` | Crea carpeta |
| `deleteFolder` | `POST /folders/:id/delete` | Borra carpeta |

**Patrón de propiedad:**

```js
if (file.ownerId !== req.user.id) {
    return res.status(403).send('No tienes permiso...');
}
```

Esto se repite en descarga, borrado de archivo y borrado de carpeta.

**Descarga segura:**

```js
const filename = path.basename(file.url);
const absolutePath = path.join(uploadsDir, filename);
res.download(absolutePath, file.name);
```

`path.basename()` evita que alguien manipule la URL para salir de `uploads/` (path traversal).

**Subida:**

1. Multer ya guardó el archivo físico.
2. Se valida `folderId`.
3. Se verifica que la carpeta exista y sea del usuario.
4. Se crea el registro en la BD.
5. Si algo falla, se borra el archivo físico.

**Qué aprender:** el controlador coordina varias piezas: Multer, modelos, `fs` y la respuesta HTTP.

---

### 7.15 `controller/userController.js`

**Para qué sirve:** CRUD de usuarios a nivel de API.

**Importante:** este controlador **no está montado** en `app.js`. Existe como ejemplo o para futuras rutas.

**Funciones:** `getUsers`, `getUsersforId`, `insertUser`, `updateUser`, `deleteUser`.

**Qué aprender:** no todo archivo del proyecto tiene que estar en uso. Es útil distinguir código activo de código de ejemplo.

---

### 7.16 `routes/driveRoutes.js`

**Para qué sirve:** unir URLs con middlewares y controladores.

**Tabla de rutas:**

| Método | Ruta | Middlewares | Controlador |
|---|---|---|---|
| GET | `/` | — | `getDrive` |
| GET | `/folders/:id` | `verificarExistenciaFolder` | `getFolder` |
| POST | `/folders` | — | `postCreateFolder` |
| POST | `/folders/:id/delete` | `verificarExistenciaFolder` | `deleteFolder` |
| POST | `/upload` | `uploadSingle` | `postUpload` |
| GET | `/files/:id/download` | `verificarExistenciaFile` | `downloadFile` |
| POST | `/files/:id/delete` | `verificarExistenciaFile` | `deleteFile` |

**`uploadSingle`:**

```js
function uploadSingle(req, res, next) {
    upload.single('file')(req, res, (error) => {
        if (error) {
            // traduce el error de Multer a un mensaje amigable
        }
        next();
    });
}
```

**Qué aprender:** las rutas deben leerse como una receta: URL → validaciones → controlador.

---

### 7.17 `views/login.ejs`

**Para qué sirve:** formulario de inicio de sesión.

**Qué mirar:**

```html
<form method="POST" action="/auth/login">
    <input name="username" ... />
    <input name="password" type="password" ... />
    <button type="submit">Entrar</button>
</form>
```

- `method="POST"` envía los datos en el cuerpo.
- `action="/auth/login"` coincide con la ruta del backend.
- Los `name` deben coincidir con lo que lee `req.body`.

**Logs que verás:**

```text
🎨 [VISTA login.ejs] PASO 1: Renderizando el formulario de login
```

**Qué aprender:** EJS renderiza HTML en el servidor. El navegador solo recibe HTML.

---

### 7.18 `views/register.ejs`

**Para qué sirve:** formulario de registro.

**Campos:** `username`, `name`, `email`, `password`, `confirm-password`.

**Importante:** el backend solo lee `username`, `email`, `name` y `password`. `confirm-password` se valida en el navegador con HTML, no en el servidor.

**Qué aprender:** las validaciones HTML (`required`, `minlength`, `type="email"`) mejoran la experiencia, pero **no sustituyen** la validación del servidor.

---

### 7.19 `views/index.ejs`

**Para qué sirve:** dashboard del Drive.

**Secciones:**

1. Barra superior con usuario y botón de logout.
2. Breadcrumb si estás dentro de una carpeta.
3. Alertas de error/éxito.
4. Formulario de subida.
5. Formulario de creación de carpeta (solo en la raíz).
6. Grid de carpetas (solo en la raíz).
7. Tabla de archivos.

**Funciones auxiliares dentro de EJS:**

```js
function formatBytes(bytes) {
    // convierte 1024 en "1 KB"
}

function fileIcon(mimeType) {
    // devuelve un emoji según el tipo
}
```

**Datos que recibe del controlador:**

| Variable | Uso |
|---|---|
| `user` | Mostrar el nombre del usuario |
| `folders` | Grid de carpetas |
| `files` | Tabla de archivos |
| `currentFolder` | Saber si estás en la raíz o dentro de una carpeta |
| `error` | Mostrar alerta roja |
| `success` | Mostrar alerta verde |

**Condicionales importantes:**

```ejs
<% if (currentFolder) { %>
    <!-- dentro de una carpeta -->
<% } else { %>
    <!-- en la raíz: mostrar carpetas -->
<% } %>
```

**Qué aprender:** EJS mezcla HTML con JavaScript. Los `<% %>` ejecutan código, `<%= %>` imprime valores escapados.

---

### 7.20 `app.js`

**Para qué sirve:** el punto de entrada. Crea la app, configura todo y arranca.

**Orden del cuerpo:**

1. Banner de inicio.
2. `PASO 1`: variables de entorno.
3. `PASO 2`: crear `app`.
4. `PASO 3`: EJS.
5. `PASO 4`: middlewares globales.
6. `PASO 5`: sesiones.
7. `PASO 6`: Passport.
8. `PASO 7`: rutas.
9. `PASO 8`: 404 y 500.
10. `PASO 9`: `listen`.
11. `PASO 10`: cierre ordenado.

**Logger de peticiones:**

```js
app.use((req, res, next) => {
    const inicio = Date.now();

    console.log(`📥 [PETICIÓN #${numero}] ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
        console.log(
            `📤 [PETICIÓN #${numero}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - inicio} ms)`,
        );
    });

    next();
});
```

**Cierre ordenado:**

```js
process.on('SIGINT', () => cerrarAplicacion('SIGINT (CTRL+C)'));
```

**Qué aprender:** el orden de los `app.use()` importa. Express ejecuta middlewares en el orden en que se registran.

---

### 7.21 `uploads/`

**Para qué sirve:** guardar los archivos físicos.

- No se sirve con `express.static`.
- Solo se accede mediante `GET /files/:id/download`, que verifica sesión y propiedad.
- Está en `.gitignore`.

**Qué aprender:** separar el archivo físico (disco) del registro (base de datos) es un patrón común. Aquí se mantienen sincronizados: al borrar uno, se borra el otro.

---

### 7.22 `generated/prisma/`

**Para qué sirve:** contiene el cliente de Prisma generado.

- **No lo edites.**
- Se regenera con `pnpm prisma generate`.
- Está en `.gitignore`.

**Qué aprender:** el código generado no se versiona ni se modifica a mano.

---

### 7.23 `node_modules/`

**Para qué sirve:** dependencias instaladas.

- No lo edites.
- Se regenera con `pnpm install`.

---

### 7.24 `.gitignore`

**Qué evita subir:**

```text
/node_modules
/generated/prisma
/uploads
.env
```

**Qué aprender:** nunca subas secretos, dependencias ni archivos subidos por usuarios.

---

## 8. Flujos completos explicados

### 8.1 Registro

```text
1. Usuario abre /auth/register
2. GET /auth/register → getRegister → render register.ejs
3. Usuario envía el formulario
4. POST /auth/register → postRegister
5. bcrypt.hash(password, 10)
6. agregarUsuario() → INSERT en User
7. req.login(newUser)
8. serializeUser guarda el ID en la sesión
9. Redirige a /
10. GET / → estaAutenticado → getDrive → render index.ejs
```

### 8.2 Login

```text
1. GET /auth/login → render login.ejs
2. POST /auth/login → postLogin
3. passport.authenticate('local')
4. LocalStrategy busca por username
5. bcrypt.compare()
6. req.login(user)
7. serializeUser guarda el ID
8. Redirige a /
```

### 8.3 Logout

```text
1. POST /auth/logout
2. req.logout()
3. Redirige a /auth/login
```

### 8.4 Dashboard

```text
1. GET /
2. estaAutenticado verifica sesión
3. getDrive
4. Promise.all([carpetas, archivos de la raíz])
5. render index.ejs
```

### 8.5 Crear carpeta

```text
1. POST /folders
2. postCreateFolder valida el nombre
3. agregarCarpeta(name, req.user.id)
4. Redirige a / con mensaje de éxito
```

### 8.6 Ver carpeta

```text
1. GET /folders/:id
2. verificarExistenciaFolder busca la carpeta
3. req.recurso = carpeta
4. getFolder verifica ownerId
5. obtenerArchivosPorUsuario(req.user.id, folder.id)
6. render index.ejs con currentFolder
```

### 8.7 Subir archivo

```text
1. POST /upload (multipart/form-data)
2. uploadSingle → Multer
3. Multer guarda en uploads/ con nombre único
4. postUpload valida folderId
5. Verifica que la carpeta sea del usuario
6. agregarArchivo() → INSERT en File
7. Redirige a / o /folders/:id
```

### 8.8 Descargar

```text
1. GET /files/:id/download
2. verificarExistenciaFile
3. downloadFile verifica ownerId
4. path.basename(file.url)
5. res.download(rutaFísica, file.name)
```

### 8.9 Eliminar archivo

```text
1. POST /files/:id/delete
2. verificarExistenciaFile
3. deleteFile verifica ownerId
4. eliminarArchivo(file.id) → DELETE en File
5. fs.unlink(rutaFísica)
6. Redirige
```

### 8.10 Eliminar carpeta

```text
1. POST /folders/:id/delete
2. verificarExistenciaFolder
3. deleteFolder verifica ownerId
4. eliminarCarpeta(folder.id) → DELETE en Folder
5. Los archivos quedan con folderId = null (raíz)
6. Redirige
```

---

## 9. Cómo leer los logs

### 9.1 Etiquetas

| Etiqueta | Significado |
|---|---|
| `📦 [MÓDULO ...]` | Se cargó un archivo |
| `🟢 [PASO N]` | Arranque de Express |
| `📥 [PETICIÓN #N]` | Llegó una petición |
| `📤 [PETICIÓN #N]` | Terminó una petición |
| `🔐 [AUTH]` | Verificación de sesión |
| `🛂 [PASSPORT]` | Autenticación |
| `🟡 [EXISTE ...]` | Verificación de recurso |
| `🏠 / 📂` | Dashboard / carpeta |
| `📤 [UPLOAD]` | Subida |
| `⬇️ [DOWNLOAD]` | Descarga |
| `🗑️ [DELETE ...]` | Borrado |
| `📁 [FOLDER]` | Carpeta |
| `🗃️ [MODEL ...]` | Consulta a BD |
| `🎨 [VISTA ...]` | Render de EJS |
| `🛑 [SHUTDOWN]` | Cierre |

### 9.2 Traza de ejemplo

```text
📥 [PETICIÓN #3] POST /upload
📤 [RUTA /upload] PASO 1: Multer va a procesar el formulario
📤 [UPLOAD] PASO 3.1: Multer eligió el destino del archivo
📤 [UPLOAD] PASO 3.2: Generando un nombre único...
   ✅ PASO 2: Multer terminó sin errores
📤 [UPLOAD] PASO 1: Procesando archivo subido...
   🔎 PASO 2: Verificando que la carpeta exista...
   💾 PASO 3: Guardando el registro...
🗃️ [MODEL FILE] agregarArchivo(): insertando un archivo...
   ✅ Archivo insertado con ID: 7
   ✅ Archivo guardado con ID: 7
   🔁 Redirigiendo a: /folders/2?success=...
📤 [PETICIÓN #3] POST /upload → 302 (45 ms)
```

### 9.3 Si ves caracteres raros

Los archivos están en UTF-8. Si tu terminal muestra símbolos extraños:

```powershell
chcp 65001
```

O usa Windows Terminal.

---

## 10. Conceptos clave

### ESM

`import` / `export` en lugar de `require`. Los imports se ejecutan antes del cuerpo del módulo. Por eso los logs de `lib/prisma.js` salen antes del banner de `app.js`.

### Middleware

Función `(req, res, next)`. Puede:

- Leer o modificar `req`.
- Responder y cortar la cadena.
- Llamar a `next()` para continuar.

### Sesión

Datos del usuario guardados entre peticiones. Aquí se guardan en PostgreSQL y se identifican con una cookie.

### Passport

Librería de autenticación. `serializeUser` guarda el ID; `deserializeUser` reconstruye `req.user`.

### Prisma

ORM. El schema define las tablas. El cliente ofrece métodos como `findMany`, `findUnique`, `create`, `update`, `delete`.

### Multer

Middleware para `multipart/form-data`. Guarda archivos en disco o memoria.

### EJS

Motor de plantillas. `<% %>` ejecuta código; `<%= %>` imprime valores escapados.

### Ownership check

Comparar `recurso.ownerId` con `req.user.id`. Evita que un usuario acceda a recursos de otro.

### Path traversal

Ataque que intenta salir de una carpeta usando `../`. Se evita con `path.basename()`.

### Códigos HTTP

| Código | Significado |
|---|---|
| 200 | OK |
| 302 | Redirección |
| 400 | Petición inválida |
| 401 | No autenticado |
| 403 | Prohibido (no es tuyo) |
| 404 | No encontrado |
| 409 | Conflicto (duplicado) |
| 500 | Error del servidor |

---

## 11. Ejercicios prácticos

### Nivel 1 — Observar

1. Ejecuta `pnpm dev` y abre `/auth/login`.
2. Identifica en consola: `📥`, `GET /auth/login`, `🎨 [VISTA login.ejs]`, `📤`.
3. Regístrate y sigue la traza completa.
4. Crea una carpeta y observa `📁 [FOLDER]` y `🗃️ [MODEL FOLDER]`.

### Nivel 2 — Cambiar textos

1. Cambia el título de `views/login.ejs`.
2. Cambia el mensaje de éxito al crear una carpeta en `driveController.js`.
3. Observa cómo se refleja en el navegador.

### Nivel 3 — Añadir una función

1. Añade un botón “Renombrar” a cada archivo en `views/index.ejs`.
2. Crea una ruta `POST /files/:id/rename` en `routes/driveRoutes.js`.
3. Crea `renameFile` en `driveController.js`.
4. Usa `actualizarArchivo()` de `model/fileModel.js`.
5. Añade logs con pasos numerados.

### Nivel 4 — Mejorar seguridad

1. Valida que el nombre de la carpeta no esté vacío ni tenga solo espacios (ya está).
2. Limita la longitud del nombre.
3. Añade un middleware `verificarPropietarioFile` para no repetir la comprobación en cada controlador.
4. Añade un mensaje 404 personalizado.

### Nivel 5 — Tests

1. Prueba el flujo completo con un usuario temporal.
2. Verifica que un usuario no pueda descargar el archivo de otro.
3. Verifica que al borrar una carpeta sus archivos queden en la raíz.
4. Verifica que al borrar un archivo se borre el archivo físico.

---

## 12. Errores comunes y soluciones

### `DATABASE_URL` vacía

**Síntoma:**

```text
⚠️ ADVERTENCIA: DATABASE_URL está vacía...
```

**Solución:** coloca la URL real en `.env`.

### `Can't reach database server`

**Causas:** URL incorrecta, base dormida, firewall o credenciales malas.

**Solución:** revisa `DATABASE_URL` y prueba la conexión con `pnpm prisma db pull --config prisma7.config.js`.

### `@prisma/client did not initialize yet`

**Solución:**

```bash
pnpm prisma generate --config prisma7.config.js
```

### `ERR_PNPM_IGNORED_BUILDS`

**Solución:**

```bash
pnpm approve-builds
```

Permite `prisma` y `@prisma/engines`.

### `EADDRINUSE`

El puerto está ocupado.

**Solución:** cambia `PORT` en `.env` o detén el otro proceso.

### `Cannot GET /`

**Causa:** la ruta no existe o la app no está montada.

**Solución:** revisa `app.js` y `routes/driveRoutes.js`.

### `req.user` es `undefined`

**Causa:** no hay sesión o Passport no está configurado.

**Solución:** revisa `passport.session()` y que `serializeUser`/`deserializeUser` estén definidos.

### `EJS ReferenceError`

**Causa:** la vista usa una variable que el controlador no envía.

**Solución:** revisa el `res.render('vista', { ... })` correspondiente.

### `LIMIT_FILE_SIZE`

**Causa:** el archivo supera 10 MB.

**Solución:** sube uno más pequeño o cambia el límite en `middleware/upload.js`.

### Migración no aplicada / drift

**Síntoma:**

```text
Following migration have not yet been applied
```

**Solución:** no ejecutes `prisma migrate dev` a ciegas. Revisa el estado con:

```bash
pnpm prisma migrate status --config prisma7.config.js
```

Si las tablas ya existen, lo más seguro es crear una migración baseline en lugar de aplicar una migración antigua.

---

## 13. Checklist final

Marca cada punto cuando puedas explicarlo sin mirar el código:

- [ ] Sé qué hace `package.json` y por qué `"type": "module"`.
- [ ] Sé para qué sirven `DATABASE_URL` y `SESSION_SECRET`.
- [ ] Entiendo los modelos `User`, `Folder`, `File` y `Session`.
- [ ] Entiendo `onDelete: Cascade` y `onDelete: SetNull`.
- [ ] Sé qué hace `lib/prisma.js` y por qué hay una sola instancia.
- [ ] Entiendo `LocalStrategy`, `serializeUser` y `deserializeUser`.
- [ ] Sé cómo `bcrypt` protege las contraseñas.
- [ ] Entiendo `estaAutenticado` y `req.isAuthenticated()`.
- [ ] Entiendo el patrón `req.recurso` en `existe.js`.
- [ ] Sé cómo Multer guarda archivos en `uploads/`.
- [ ] Entiendo por qué el nombre físico es único.
- [ ] Sé cómo se valida la propiedad de un archivo o carpeta.
- [ ] Entiendo `path.basename()` y el path traversal.
- [ ] Sé cómo se renderiza `index.ejs` con `folders`, `files` y `currentFolder`.
- [ ] Entiendo el orden de los middlewares en `app.js`.
- [ ] Sé cómo se manejan los errores 404 y 500.
- [ ] Entiendo el cierre ordenado con `SIGINT`.
- [ ] Puedo seguir una petición completa en los logs.

---

## 14. Glosario

| Término | Significado |
|---|---|
| ESM | ECMAScript Modules (`import` / `export`) |
| Middleware | Función que procesa la petición antes del controlador |
| ORM | Herramienta que traduce objetos a tablas |
| Prisma Client | Cliente generado para consultar la BD |
| Migración | Archivo SQL que cambia el esquema |
| Seed | Datos iniciales de la BD |
| Sesión | Datos persistidos entre peticiones |
| Cookie | Pequeño dato que el navegador envía al servidor |
| Hash | Transformación irreversible de una contraseña |
| Multipart | Formato para enviar archivos |
| Path traversal | Intento de salir de una carpeta con `../` |
| Ownership | Relación dueño-recurso |
| Render | Generar HTML desde una plantilla |
| Redirect | Responder con 302 para que el navegador vaya a otra URL |

---

## 15. Siguientes pasos

Cuando domines este proyecto, puedes practicar:

1. **Renombrar archivos y carpetas.**
2. **Buscar archivos por nombre.**
3. **Mover archivos entre carpetas.**
4. **Compartir archivos con enlaces temporales.**
5. **Subir múltiples archivos a la vez** (`upload.array('files')`).
6. **Mostrar miniaturas de imágenes.**
7. **Añadir paginación.**
8. **Añadir tests automatizados** con Vitest o Node Test Runner.
9. **Migrar a almacenamiento en la nube** (S3, Supabase Storage).
10. **Añadir roles y permisos.**

---

> **Consejo final:** no memorices el código. Aprende el flujo. Si entiendes que una petición pasa por `logger → sesión → passport → ruta → middleware → controlador → modelo → respuesta`, puedes reconstruir cualquier parte del proyecto.
