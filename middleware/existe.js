import { obtenerArchivosid } from '../model/fileModel.js';
import { obtenerCarpetasid } from '../model/folderModel.js';
import { obtenerUsuarioid } from '../model/userModel.js';

export async function verificarExistenciaUser() {
    return async (req, res, next) => {
        const { id } = req.params;
        const { nombre } = req.body;

        try {
            const resultado = obtenerUsuarioid(id);

            if (!resultado) {
                return res.status(404).send(`${nombre} no encontrado`);
            }

            req.recurso = resultado;

            next();
        } catch (error) {
            console.error(`Error al obtener ${nombre}:`, error);
            return res.status(500).send(`Error al obtener ${nombre}`);
        }
    };
}

export async function verificarExistenciaFolder() {
    return async (req, res, next) => {
        const { id } = req.params;
        const { nombre } = req.body;

        try {
            const resultado = obtenerCarpetasid(id);

            if (!resultado) {
                return res.status(404).send(`${nombre} no encontrado`);
            }

            req.recurso = resultado;

            next();
        } catch (error) {
            console.error(`Error al obtener ${nombre}:`, error);
            return res.status(500).send(`Error al obtener ${nombre}`);
        }
    };
}

export async function verificarExistenciaFiles() {
    return async (req, res, next) => {
        const { id } = req.params;
        const { nombre } = req.body;

        try {
            const resultado = obtenerArchivosid(id);

            if (!resultado) {
                return res.status(404).send(`${nombre} no encontrado`);
            }

            req.recurso = resultado;

            next();
        } catch (error) {
            console.error(`Error al obtener ${nombre}:`, error);
            return res.status(500).send(`Error al obtener ${nombre}`);
        }
    };
}
