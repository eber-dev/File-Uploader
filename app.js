import 'dotenv/config';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import expressSession from 'express-session';
import passport from 'passport';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';

import { prisma } from './lib/prisma.js';
import './config/passport.js';

import {
    getLogin,
    getRegister,
    postLogin,
    postRegister,
    logout,
} from './controller/authController.js';
import { estaAutenticado } from './middleware/authMiddleware.js';
import driveRoutes from './routes/driveRoutes.js';

console.log('\n══════════════════════════════════════════════════════════');
console.log('🚀 FILE UPLOADER - INICIO DE LA APLICACIÓN');
console.log('══════════════════════════════════════════════════════════');
console.log('ℹ️ Node.js:', process.version);
console.log('ℹ️ Entorno:', process.env.NODE_ENV || 'development');
console.log('ℹ️ Los módulos importados arriba ya se cargaron en este orden:');
console.log('   1) lib/prisma.js       -> conexión a la base de datos');
console.log('   2) config/passport.js  -> estrategia de autenticación');
console.log('   3) controladores       -> lógica de las rutas');
console.log('   4) middlewares         -> filtros y validaciones');
console.log('   5) routes/driveRoutes  -> tabla de rutas del Drive');

console.log('\n🟢 [PASO 1] Cargando variables de entorno...');
console.log('   ℹ️ dotenv ya leyó el archivo .env al inicio del archivo');
console.log('   ℹ️ PORT:', process.env.PORT || '3000 (valor por defecto)');
console.log(
    '   ℹ️ SESSION_SECRET:',
    process.env.SESSION_SECRET ? 'configurado' : 'NO configurado',
);
console.log(
    '   ℹ️ DATABASE_URL:',
    process.env.DATABASE_URL
        ? 'configurada'
        : 'NO configurada (el CRUD fallará hasta que la pongas en .env)',
);

if (!process.env.SESSION_SECRET) {
    console.log(
        '❌ [PASO 1] Falta SESSION_SECRET en .env. Sin él, Express no puede firmar las cookies de sesión.',
    );
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log('   ℹ️ __dirname calculado:', __dirname);

console.log('\n🟢 [PASO 2] Creando la aplicación de Express...');
const app = express();
const PORT = process.env.PORT || 3000;
console.log('   ✅ app de Express creada');
console.log('   ℹ️ PORT de escucha:', PORT);

console.log('\n🟢 [PASO 3] Configurando EJS como motor de plantillas...');
console.log('   ℹ️ Carpeta de vistas:', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
console.log(
    '   ✅ EJS configurado. res.render("index") buscará views/index.ejs',
);

console.log('\n🟢 [PASO 4] Registrando middlewares globales...');

let contadorPeticiones = 0;

console.log('   ℹ️ Middleware de registro: muestra cada petición y su duración');
app.use((req, res, next) => {
    contadorPeticiones += 1;
    const numero = contadorPeticiones;
    const inicio = Date.now();

    console.log(`\n📥 [PETICIÓN #${numero}] ${req.method} ${req.originalUrl}`);
    console.log(`   🕒 Hora: ${new Date().toISOString()}`);

    res.on('finish', () => {
        const duracion = Date.now() - inicio;
        console.log(
            `📤 [PETICIÓN #${numero}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duracion} ms)`,
        );
    });

    next();
});

console.log(
    '   ℹ️ express.urlencoded: convierte los datos de formularios HTML en req.body',
);
app.use(express.urlencoded({ extended: true }));

console.log(
    '   ℹ️ express.json: permite recibir cuerpos JSON (útil para futuras APIs)',
);
app.use(express.json());

console.log(
    '   ℹ️ express.static: sirve CSS, JS e imágenes desde la carpeta public',
);
app.use(express.static(path.join(__dirname, 'public')));

console.log('\n🟢 [PASO 5] Configurando sesiones con Prisma...');
console.log(
    '   🗄️ Las sesiones se guardarán en la base de datos (tabla "sessions")',
);
console.log('   ℹ️ checkPeriod: cada 2 minutos se limpian sesiones expiradas');
console.log('   ℹ️ cookie.maxAge: la sesión dura 7 días');
console.log(
    '   ℹ️ httpOnly: la cookie no es accesible desde JavaScript del navegador',
);
console.log('   ℹ️ sameSite=lax: ayuda a prevenir CSRF en navegación normal');
app.use(
    expressSession({
        store: new PrismaSessionStore(prisma, {
            checkPeriod: 2 * 60 * 1000,
            dbRecordIdIsSessionId: true,
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        },
    }),
);
console.log('   ✅ Sesiones configuradas');

console.log('\n🟢 [PASO 6] Inicializando Passport...');
console.log(
    '   ℹ️ passport.initialize(): prepara req.login(), req.logout() y req.user',
);
app.use(passport.initialize());

console.log(
    '   ℹ️ passport.session(): restaura el usuario desde la sesión guardada',
);
app.use(passport.session());
console.log('   ✅ Passport listo');

console.log('\n🟢 [PASO 7] Montando rutas...');

const authRouter = express.Router();

console.log('   🛣️ Registrando rutas de autenticación...');
authRouter.get('/login', getLogin);
console.log('      ✅ GET  /auth/login');
authRouter.post('/login', postLogin);
console.log('      ✅ POST /auth/login');
authRouter.get('/register', getRegister);
console.log('      ✅ GET  /auth/register');
authRouter.post('/register', postRegister);
console.log('      ✅ POST /auth/register');
authRouter.post('/logout', logout);
console.log('      ✅ POST /auth/logout');

app.use('/auth', authRouter);
console.log('   🛣️ Rutas de autenticación montadas en /auth');

console.log('   🛣️ Montando rutas del Drive detrás de estaAutenticado...');
app.use('/', estaAutenticado, driveRoutes);
console.log('   ✅ Rutas del drive montadas en / (protegidas)');

console.log('\n🟢 [PASO 8] Configurando manejo de errores...');

app.use((req, res) => {
    console.log('\n🟠 [404] Ruta no encontrada:', req.method, req.originalUrl);
    return res
        .status(404)
        .send(
            '<h1>404 - Página no encontrada</h1><p><a href="/">Volver al inicio</a></p>',
        );
});

console.log('   ℹ️ Manejador 404 registrado');

// Los 4 argumentos son obligatorios para que Express reconozca el error handler.
app.use((error, req, res, next) => {
    console.log('\n🔴 [500] Error interno del servidor');
    console.log('   💥 Mensaje:', error.message);
    console.log('   🧵 Stack:', error.stack);

    return res
        .status(500)
        .send(
            '<h1>500 - Error interno del servidor</h1><p><a href="/">Volver al inicio</a></p>',
        );
});

console.log('   ℹ️ Manejador 500 registrado');

console.log('\n🟢 [PASO 9] Arrancando el servidor...');
const server = app.listen(PORT, () => {
    console.log(`\n🚀 Servidor escuchando en http://localhost:${PORT}`);
    console.log('   ℹ️ Presiona CTRL+C para detenerlo');
});

console.log('\n🟢 [PASO 10] Configurando cierre ordenado...');
async function cerrarAplicacion(senal) {
    console.log(`\n🛑 [SHUTDOWN] Señal recibida: ${senal}`);
    console.log('   🔌 Cerrando el servidor HTTP...');

    server.close(async () => {
        console.log('   ✅ Servidor HTTP cerrado');
        console.log('   🗄️ Desconectando Prisma...');
        await prisma.$disconnect();
        console.log('   ✅ Prisma desconectado');
        console.log('   👋 Aplicación finalizada correctamente');
        process.exit(0);
    });
}

process.on('SIGINT', () => cerrarAplicacion('SIGINT (CTRL+C)'));
process.on('SIGTERM', () => cerrarAplicacion('SIGTERM'));
console.log('   ✅ Cierre ordenado configurado');
