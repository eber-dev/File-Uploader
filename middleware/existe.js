import { obtenerArchivosid } from '../model/fileModel.js';
import { obtenerCarpetasid } from '../model/folderModel.js';
import { obtenerUsuarioid } from '../model/userModel.js';

console.log(
    '\n📦 [MÓDULO middleware/existe.js] Cargando verificadores de existencia...',
);

export function verificarExistenciaUser() {
    return async (req, res, next) => {
        console.log('\n🟡 [EXISTE USER] PASO 1: Verificando usuario...');
        const id = Number(req.params.id);
        console.log('   🆔 ID recibido:', id);

        if (!Number.isInteger(id)) {
            console.log('   ❌ ID inválido');
            return res.status(400).send('ID inválido');
        }

        try {
            console.log('   🔎 PASO 2: Buscando usuario en la base de datos...');
            const usuario = await obtenerUsuarioid(id);

            if (!usuario) {
                console.log('   ❌ Usuario no encontrado');
                return res.status(404).send('Usuario no encontrado');
            }

            console.log(
                '   ✅ Usuario encontrado:',
                usuario.username || usuario.email,
            );
            console.log('   📦 PASO 3: Guardando el recurso en req.recurso');
            req.recurso = usuario;
            return next();
        } catch (error) {
            console.log('   💥 Error al verificar usuario:', error.message);
            return res.status(500).send('Error al verificar el usuario');
        }
    };
}

export function verificarExistenciaFile() {
    return async (req, res, next) => {
        console.log('\n🟡 [EXISTE FILE] PASO 1: Verificando archivo...');
        const id = Number(req.params.id);
        console.log('   🆔 ID recibido:', id);

        if (!Number.isInteger(id)) {
            console.log('   ❌ ID inválido');
            return res.status(400).send('ID inválido');
        }

        try {
            console.log('   🔎 PASO 2: Buscando archivo en la base de datos...');
            const archivo = await obtenerArchivosid(id);

            if (!archivo) {
                console.log('   ❌ Archivo no encontrado');
                return res.status(404).send('Archivo no encontrado');
            }

            console.log('   ✅ Archivo encontrado:', archivo.name);
            console.log('   📦 PASO 3: Guardando el recurso en req.recurso');
            req.recurso = archivo;
            return next();
        } catch (error) {
            console.log('   💥 Error al verificar archivo:', error.message);
            return res.status(500).send('Error al verificar el archivo');
        }
    };
}

export function verificarExistenciaFolder() {
    return async (req, res, next) => {
        console.log('\n🟡 [EXISTE FOLDER] PASO 1: Verificando carpeta...');
        const id = Number(req.params.id);
        console.log('   🆔 ID recibido:', id);

        if (!Number.isInteger(id)) {
            console.log('   ❌ ID inválido');
            return res.status(400).send('ID inválido');
        }

        try {
            console.log('   🔎 PASO 2: Buscando carpeta en la base de datos...');
            const carpeta = await obtenerCarpetasid(id);

            if (!carpeta) {
                console.log('   ❌ Carpeta no encontrada');
                return res.status(404).send('Carpeta no encontrada');
            }

            console.log('   ✅ Carpeta encontrada:', carpeta.name);
            console.log('   📦 PASO 3: Guardando el recurso en req.recurso');
            req.recurso = carpeta;
            return next();
        } catch (error) {
            console.log('   💥 Error al verificar carpeta:', error.message);
            return res.status(500).send('Error al verificar la carpeta');
        }
    };
}
