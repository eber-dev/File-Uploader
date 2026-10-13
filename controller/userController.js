import {
    obtenerUsuarios,
    obtenerUsuarioid,
    agregarUsuario,
    actualizarUsuario,
    eliminarUsuario,
} from '../model/userModel';

export async function getUsers(req, res) {
    try {
        await obtenerUsuarios();
    } catch (error) {
        console.error('Error getUsers:', error);
        res.status(500).send('Error al obtener los usuarios');
    }
}

export async function getUsersforId(req, res) {
    const { id } = req.params;
    try {
        await obtenerUsuarioid(id);
    } catch (error) {
        console.error('Error getUsersforId:', error);
        res.status(500).send('Error al obtener el usuario');
    }
}

export async function insertUser(req, res) {
    const { name, email, password } = req.body;
    try {
        await agregarUsuario(name, email, password);
    } catch (error) {
        console.error('Error insertUser:', error);
        res.status(500).send('Error al añadir el usuario');
    }
}

export async function updateUser(req, res) {
    const { id } = req.params;
    const { name, email, password } = req.body;
    try {
        await actualizarUsuario(id, name, email, password);
    } catch (error) {
        console.error('Error updateUser:', error);
        res.status(500).send('Error al actualizar el usuario');
    }
}

export async function deleteUser(req, res) {
    const { id } = req.params;
    try {
        await eliminarUsuario(id);
    } catch (error) {
        console.error('Error deleteUser:', error);
        res.status(500).send('Error al eliminar el usuario');
    }
}
