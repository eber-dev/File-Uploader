# File-Uploader

Una versión simplificada de Google Drive (o cualquier otro servicio de almacenamiento personal).

## 📚 Guía de estudio

Si quieres aprender el proyecto paso a paso, desde el arranque hasta el cierre, lee:

**[GUIA_DE_ESTUDIO.md](./GUIA_DE_ESTUDIO.md)**

Allí encontrarás el recorrido completo por cada archivo, el orden real de ejecución, los flujos de autenticación y del Drive, cómo leer los logs, ejercicios y errores comunes.

## 🚀 Inicio rápido

1. Instala dependencias:

```bash
pnpm install
```

2. Configura `.env`:

```env
DATABASE_URL="postgresql://usuario:password@host:5432/base?schema=public"
SESSION_SECRET="un_secreto_largo_y_aleatorio"
PORT=3000
```

3. Genera el cliente de Prisma:

```bash
pnpm prisma generate --config prisma7.config.js
```

4. Arranca:

```bash
pnpm dev
```

5. Abre `http://localhost:3000`.
