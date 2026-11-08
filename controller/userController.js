import {
    obtenerUsuarios,
    obtenerUsuarioid,
    agregarUsuario,
    actualizarUsuario,
    eliminarUsuario,
} from '../model/userModel.js';

console.log(
    '\n📦 [MÓDULO controller/userController.js] Cargando controladores de usuarios (no montados en app.js)...',
);

export async function getUsers(req, res) {
    console.log('\n👥 [USER] getUsers(): listando usuarios...');

    try {
        const users = await obtenerUsuarios();
        console.log('   ✅ Usuarios obtenidos:', users.length);
    } catch (error) {
        console.log('   💥 Error getUsers:', error.message);
        res.status(500).send('Error al obtener los usuarios');
    }
}

export async function getUsersforId(req, res) {
    const { id } = req.params;
    console.log('\n👥 [USER] getUsersforId(): buscando usuario ID', id);

    try {
        const user = await obtenerUsuarioid(id);
        console.log('   ✅ Resultado:', user ? user.username : 'no encontrado');
    } catch (error) {
        console.log('   💥 Error getUsersforId:', error.message);
        res.status(500).send('Error al obtener el usuario');
    }
}

export async function insertUser(req, res) {
    const { username, name, email, password } = req.body;
    console.log('\n👥 [USER] insertUser(): creando usuario', username);

    try {
        const user = await agregarUsuario(username, email, name, password);
        console.log('   ✅ Usuario creado con ID:', user.id);
    } catch (error) {
        console.log('   💥 Error insertUser:', error.message);
        res.status(500).send('Error al añadir el usuario');
    }
}

export async function updateUser(req, res) {
    const { id } = req.params;
    const { name, email, password } = req.body;
    console.log('\n👥 [USER] updateUser(): actualizando usuario ID', id);

    try {
        const user = await actualizarUsuario(id, name, email, password);
        console.log('   ✅ Usuario actualizado:', user.username);
    } catch (error) {
        console.log('   💥 Error updateUser:', error.message);
        res.status(500).send('Error al actualizar el usuario');
    }
}

export async function deleteUser(req, res) {
    const { id } = req.params;
    console.log('\n👥 [USER] deleteUser(): eliminando usuario ID', id);

    try {
        const user = await eliminarUsuario(id);
        console.log('   ✅ Usuario eliminado:', user.username);
    } catch (error) {
        console.log('   💥 Error deleteUser:', error.message);
        res.status(500).send('Error al eliminar el usuario');
    }
}
