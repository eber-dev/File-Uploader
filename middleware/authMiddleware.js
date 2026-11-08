console.log(
    '\n📦 [MÓDULO middleware/authMiddleware.js] Cargando protección de rutas...',
);

function esPeticionApi(req) {
    return (
        req.originalUrl?.startsWith('/api') ||
        req.xhr ||
        req.accepts(['html', 'json']) === 'json'
    );
}

export function estaAutenticado(req, res, next) {
    console.log('\n🔐 [AUTH] PASO 1: Verificando si el usuario tiene sesión...');
    console.log('   ℹ️ Petición:', req.method, req.originalUrl);

    if (req.isAuthenticated?.() === true) {
        console.log('   ✅ Usuario autenticado:', req.user.username);
        console.log('   ➡️ PASO 2: Dejando pasar la petición al controlador');
        return next();
    }

    console.log('   ❌ No hay sesión activa');

    if (esPeticionApi(req)) {
        console.log('   📡 Es una petición API: respondiendo 401 JSON');
        return res.status(401).json({ error: 'No autenticado' });
    }

    console.log('   🌐 Es una petición HTML: redirigiendo a /auth/login');
    return res.redirect('/auth/login');
}
