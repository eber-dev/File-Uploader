import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

console.log('\n📦 [MÓDULO config/passport.js] Configurando Passport...');

console.log('🛂 [PASSPORT] PASO 1: Registrando la estrategia Local...');
console.log(
    '   ℹ️ LocalStrategy lee por defecto los campos "username" y "password" del formulario.',
);

passport.use(
    new LocalStrategy(async (username, password, done) => {
        console.log('\n🔵 [PASSPORT] PASO 2: La estrategia recibió credenciales');
        console.log('   👤 Username:', username);
        console.log('   🔑 Password: (oculta por seguridad)');

        try {
            console.log(
                '   🔎 PASO 2.1: Buscando el usuario por username en la BD...',
            );
            const user = await prisma.user.findUnique({
                where: { username },
            });

            if (!user) {
                console.log('   ❌ Usuario no encontrado');
                return done(null, false, {
                    message: 'Usuario o contraseña incorrectos',
                });
            }

            console.log('   ✅ Usuario encontrado. ID:', user.id);
            console.log(
                '   🔐 PASO 2.2: Comparando la contraseña con bcrypt.compare()...',
            );
            const passwordOk = await bcrypt.compare(password, user.password);

            if (!passwordOk) {
                console.log('   ❌ Contraseña incorrecta');
                return done(null, false, {
                    message: 'Usuario o contraseña incorrectos',
                });
            }

            console.log('   ✅ Contraseña válida. Autenticación exitosa');
            console.log(
                '   ➡️ PASO 2.3: Entregando el usuario a Passport con done(null, user)',
            );
            return done(null, user);
        } catch (error) {
            console.log('   💥 Error en LocalStrategy:', error.message);
            return done(error);
        }
    }),
);

console.log('🛂 [PASSPORT] PASO 3: Configurando serializeUser...');
console.log('   ℹ️ Solo guarda el ID del usuario dentro de la sesión.');
passport.serializeUser((user, done) => {
    console.log('\n📦 [PASSPORT] serializeUser ejecutado');
    console.log('   💾 Guardando el ID en la sesión:', user.id);
    done(null, user.id);
});

console.log('🛂 [PASSPORT] PASO 4: Configurando deserializeUser...');
console.log(
    '   ℹ️ En cada petición con sesión, reconstruye req.user a partir del ID.',
);
passport.deserializeUser(async (id, done) => {
    console.log('\n📂 [PASSPORT] deserializeUser ejecutado');
    console.log('   🔎 Buscando el usuario de la sesión con ID:', id);

    try {
        const userId = Number(id);
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            console.log('   ❌ Usuario de sesión no encontrado (sesión inválida)');
            return done(null, false);
        }

        console.log('   ✅ Usuario restaurado en req.user:', user.username);
        return done(null, user);
    } catch (error) {
        console.log('   💥 Error en deserializeUser:', error.message);
        return done(error);
    }
});

console.log('✅ [PASSPORT] Configuración completa');

export default passport;
