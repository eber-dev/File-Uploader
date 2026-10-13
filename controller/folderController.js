import {
    obtenerCarpetas,
    obtenerCarpetasid,
    agregarCarpeta,
    actualizarCarpeta,
    eliminarCarpeta,
} from '../model/folderModel';

export async function getFolders(req, res) {
    try {
        await obtenerCarpetas();
    } catch (error) {
        console.error('Error getFolders:', error);
        res.status(500).send('Error al obtener las carpetas');
    }
}

export async function getFolderforId(req, res) {
    const { id } = req.params;
    try {
        await obtenerCarpetasid(id);
    } catch (error) {
        console.error('Error getFolderforId:', error);
        res.status(500).send('Error al obtener la carpeta');
    }
}

export async function insertFolder(req, res) {
    const { name, ownerid } = req.body;
    try {
        await agregarCarpeta(name, ownerid);
    } catch (error) {
        console.error('Error insertFolder:', error);
        res.status(500).send('Error al añadir la carpeta');
    }
}

export async function updateFolder(req, res) {
    const { id } = req.params;
    const { name, ownerid } = req.body;
    try {
        await actualizarCarpeta(id, name, ownerid);
    } catch (error) {
        console.error('Error updateFolder:', error);
        res.status(500).send('Error al actualizar carpeta');
    }
}

export async function deleteFolder(req, res) {
    const { id } = req.params;
    try {
        await eliminarCarpeta(id);
    } catch (error) {
        console.error('Error deleteFolder:', error);
        res.status(500).send('Error al eliminar la carpeta');
    }
}
