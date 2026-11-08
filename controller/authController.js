import bcrypt from 'bcryptjs';
import passport from 'passport';
import { agregarUsuario } from '../model/userModel.js';

console.log(
    '\n📦 [MÓDULO controller/authController.js] Cargando controladores de autenticación...',
);

export function getLogin(req, res) {
    console.log(
        '\n🟢 [GET /auth/login] PASO 1: Renderizando la vista de login',
    );
    return res.render('login', { error: null, old: {} });
}

export function getRegister(req, res) {
    console.log(
        '\n🟢 [GET /auth/register] PASO 1: Renderizando la vista de registro',
    );
    return res.render('register', { error: null, old: {} });
}

export async function postRegister(req, res) {
    console.log(
        '\n🔵 [POST /auth/register] PASO 1: Recibiendo datos del formulario',
    );

    const { username, email, name, password } = req.body;
    console.log('   📥 Datos recibidos:', { username, email, name });
    console.log('   🔑 Password: (oculta por seguridad)');

    try {
        console.log(
            '   🔐 PASO 2: Hasheando la contraseña con bcrypt (10 rondas)...',
        );
        const passwordHash = await bcrypt.hash(password, 10);
        console.log('   ✅ Contraseña hasheada');

        console.log(
            '   💾 PASO 3: Insertando el usuario en la base de datos...',
        );
        const newUser = await agregarUsuario(
            username,
            email,
            name,
            passwordHash,
        );
        console.log('   ✅ Usuario creado con ID:', newUser.id);

        console.log(
            '   🔐 PASO 4: Iniciando sesión automáticamente con req.login()...',
        );
        return req.login(newUser, (error) => {
            if (error) {
                console.log('   💥 Error en req.login():', error.message);
                return res.status(500).render('register', {
                    error: 'Error al iniciar sesión',
                    old: { username, email, name },
                });
            }

            console.log('   ✅ Sesión iniciada');
            console.log('   🔁 PASO 5: Redirigiendo a /');
            return res.redirect('/');
        });
    } catch (error) {
        console.log('   💥 Error en postRegister:', error.message);

        if (error?.code === 'P2002') {
            console.log(
                '   ⚠️ Username o email duplicado (código Prisma P2002)',
            );
            return res.status(409).render('register', {
                error: 'El usuario o correo ya está registrado',
                old: { username, email, name },
            });
        }

        return res.status(500).render('register', {
            error: 'Error al registrar el usuario',
            old: { username, email, name },
        });
    }
}

export function postLogin(req, res, next) {
    console.log('\n🔵 [POST /auth/login] PASO 1: Recibiendo credenciales');
    console.log('   📥 Username:', req.body.username);

    console.log('   🛂 PASO 2: Delegando la verificación a Passport...');
    return passport.authenticate('local', (error, user, info) => {
        if (error) {
            console.log('   💥 Error en passport.authenticate:', error.message);
            return res.status(500).render('login', {
                error: 'Error al iniciar sesión',
                old: { username: req.body.username },
            });
        }

        if (!user) {
            console.log('   ❌ Autenticación fallida:', info?.message);
            return res.status(401).render('login', {
                error: info?.message || 'Credenciales inválidas',
                old: { username: req.body.username },
            });
        }

        console.log('   ✅ Usuario autenticado. ID:', user.id);
        console.log('   🔐 PASO 3: Creando la sesión con req.login()...');

        return req.login(user, (loginError) => {
            if (loginError) {
                console.log('   💥 Error en req.login():', loginError.message);
                return res.status(500).render('login', {
                    error: 'Error al iniciar sesión',
                    old: { username: req.body.username },
                });
            }

            console.log('   ✅ Sesión iniciada');
            console.log('   🔁 PASO 4: Redirigiendo a /');
            return res.redirect('/');
        });
    })(req, res, next);
}

export function logout(req, res) {
    console.log('\n🔵 [POST /auth/logout] PASO 1: Cerrando la sesión...');

    return req.logout((error) => {
        if (error) {
            console.log('   💥 Error en req.logout():', error.message);
            return res.status(500).render('login', {
                error: 'Error al cerrar sesión',
                old: {},
            });
        }

        console.log('   ✅ Sesión cerrada');
        console.log('   🔁 PASO 2: Redirigiendo a /auth/login');
        return res.redirect('/auth/login');
    });
}
