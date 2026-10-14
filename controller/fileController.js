import {
    obtenerArchivos,
    obtenerArchivosid,
    agregarArchivo,
    actualizarArchivo,
    eliminarArchivo,
} from '../model/fileModel';

export async function getFiles(req, res) {
    try {
        await obtenerArchivos();
    } catch (error) {
        console.error('Error getFiles:', error);
        res.status(500).send('Error al obtener los archivos');
    }
}

export async function getFileforId(req, res) {
    const { id } = req.params;
    try {
        await obtenerArchivosid(id);
    } catch (error) {
        console.error('Error getFileforId:', error);
        res.status(500).send('Error al obtener el archivo');
    }
}

export async function insertFile(req, res) {
    const { name, size, mimeType, url, ownerId, folderId } = req.body;
    try {
        await agregarArchivo(name, size, mimeType, url, ownerId, folderId);
    } catch (error) {
        console.error('Error insertFile:', error);
        res.status(500).send('Error al añadir el archivo');
    }
}

export async function updateFile(req, res) {
    const { id } = req.params;
    const { name, size, mimeType, url, ownerId, folderId } = req.body;
    try {
        await actualizarArchivo(
            id,
            name,
            size,
            mimeType,
            url,
            ownerId,
            folderId,
        );
    } catch (error) {
        console.error('Error updateFile:', error);
        res.status(500).send('Error al actualizar el archivo');
    }
}

export async function deleteFile(req, res) {
    const { id } = req.params;
    try {
        await eliminarArchivo(id);
    } catch (error) {
        console.error('Error deleteFile:', error);
        res.status(500).send('Error al eliminar el archivo');
    }
}
