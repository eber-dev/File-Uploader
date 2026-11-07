import { obtenerArchivosid } from '../model/fileModel.js';
import { obtenerUsuarioid } from '../model/userModel.js';

export function verificarExistenciaUser() {
    return async (req, res, next) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).send('ID inválido');
        }

        try {
            const usuario = await obtenerUsuarioid(id);

            if (!usuario) {
                return res.status(404).send('Usuario no encontrado');
            }

            req.recurso = usuario;
            return next();
        } catch {
            return res.status(500).send('Error al verificar el usuario');
        }
    };
}

export function verificarExistenciaFile() {
    return async (req, res, next) => {
        const id = Number(req.params.id);

        if (!Number.isInteger(id)) {
            return res.status(400).send('ID inválido');
        }

        try {
            const archivo = await obtenerArchivosid(id);

            if (!archivo) {
                return res.status(404).send('Archivo no encontrado');
            }

            req.recurso = archivo;
            return next();
        } catch {
            return res.status(500).send('Error al verificar el archivo');
        }
    };
}
