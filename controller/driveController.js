import fs from 'node:fs/promises';
import path from 'node:path';

import { uploadsDir } from '../middleware/upload.js';
import {
    agregarArchivo,
    eliminarArchivo,
    obtenerArchivosPorUsuario,
} from '../model/fileModel.js';
import {
    agregarCarpeta,
    eliminarCarpeta,
    obtenerCarpetasid,
    obtenerCarpetasPorUsuario,
} from '../model/folderModel.js';

console.log(
    '\n📦 [MÓDULO controller/driveController.js] Cargando controladores del Drive...',
);

function getQueryMessage(value) {
    return typeof value === 'string' ? value : null;
}

function redirectWithMessage(res, pathname, type, message) {
    const separator = pathname.includes('?') ? '&' : '?';
    const destino = `${pathname}${separator}${type}=${encodeURIComponent(message)}`;
    console.log('   🔁 Redirigiendo a:', destino);
    return res.redirect(destino);
}

export async function getDrive(req, res) {
    console.log('\n🏠 [DRIVE] PASO 1: Cargando "Mi unidad"');
    console.log('   👤 Usuario:', req.user.username, '(ID:', req.user.id + ')');
    console.log('   📥 Query string:', req.query);

    try {
        console.log(
            '   🔎 PASO 2: Consultando carpetas y archivos de la raíz en paralelo...',
        );
        const [folders, files] = await Promise.all([
            obtenerCarpetasPorUsuario(req.user.id),
            obtenerArchivosPorUsuario(req.user.id, null),
        ]);
        console.log('   ✅ Carpetas encontradas:', folders.length);
        console.log('   ✅ Archivos en la raíz:', files.length);

        console.log('   🎨 PASO 3: Renderizando views/index.ejs...');
        return res.render('index', {
            user: req.user,
            folders,
            files,
            currentFolder: null,
            error: getQueryMessage(req.query.error),
            success: getQueryMessage(req.query.success),
        });
    } catch (error) {
        console.log('   💥 Error al cargar mi unidad:', error.message);
        return res.status(500).render('index', {
            user: req.user,
            folders: [],
            files: [],
            currentFolder: null,
            error: 'No se pudo cargar mi unidad',
            success: null,
        });
    }
}

export async function getFolder(req, res) {
    const folder = req.recurso;

    console.log('\n📂 [DRIVE] PASO 1: Cargando una carpeta');
    console.log('   📁 Carpeta:', folder.name, '(ID:', folder.id + ')');
    console.log('   👤 Dueño:', folder.ownerId);
    console.log('   👤 Usuario actual:', req.user.id);

    if (folder.ownerId !== req.user.id) {
        console.log('   ⛔ La carpeta no pertenece al usuario');
        return res.status(403).send('No tienes permiso para ver esta carpeta');
    }

    try {
        console.log('   🔎 PASO 2: Buscando los archivos de la carpeta...');
        const files = await obtenerArchivosPorUsuario(
            req.user.id,
            folder.id,
        );
        console.log('   ✅ Archivos encontrados:', files.length);

        console.log('   🎨 PASO 3: Renderizando views/index.ejs con la carpeta...');
        return res.render('index', {
            user: req.user,
            folders: [],
            files,
            currentFolder: folder,
            error: getQueryMessage(req.query.error),
            success: getQueryMessage(req.query.success),
        });
    } catch (error) {
        console.log('   💥 Error al cargar carpeta:', error.message);
        return res.status(500).render('index', {
            user: req.user,
            folders: [],
            files: [],
            currentFolder: folder,
            error: 'No se pudo cargar la carpeta',
            success: null,
        });
    }
}

export async function postUpload(req, res) {
    console.log('\n📤 [UPLOAD] PASO 1: Procesando archivo subido...');
    console.log('   📥 Body recibido:', req.body);
    console.log(
        '   📄 req.file:',
        req.file
            ? {
                  originalname: req.file.originalname,
                  size: req.file.size,
                  mimetype: req.file.mimetype,
                  filename: req.file.filename,
                  path: req.file.path,
              }
            : '(ninguno)',
    );

    let folderId = null;

    if (req.body.folderId) {
        folderId = Number(req.body.folderId);

        if (!Number.isInteger(folderId)) {
            console.log('   ❌ folderId inválido:', req.body.folderId);

            if (req.file) {
                console.log(
                    '   🧹 Borrando el archivo temporal que Multer ya guardó...',
                );
                await fs.unlink(req.file.path).catch(() => {});
            }

            return redirectWithMessage(res, '/', 'error', 'Carpeta inválida');
        }
    }

    const redirectPath = folderId ? `/folders/${folderId}` : '/';

    if (!req.file) {
        console.log('   ❌ No llegó ningún archivo en el campo "file"');
        return redirectWithMessage(
            res,
            redirectPath,
            'error',
            'Selecciona un archivo para subir',
        );
    }

    try {
        if (folderId !== null) {
            console.log(
                '   🔎 PASO 2: Verificando que la carpeta exista y sea del usuario...',
            );
            const folder = await obtenerCarpetasid(folderId);

            if (!folder || folder.ownerId !== req.user.id) {
                console.log('   ❌ La carpeta no existe o no pertenece al usuario');
                await fs.unlink(req.file.path).catch(() => {});
                return redirectWithMessage(
                    res,
                    '/',
                    'error',
                    'La carpeta no existe o no te pertenece',
                );
            }

            console.log('   ✅ Carpeta válida:', folder.name);
        }

        console.log(
            '   💾 PASO 3: Guardando el registro del archivo en la base de datos...',
        );
        const newFile = await agregarArchivo(
            req.file.originalname,
            req.file.size,
            req.file.mimetype,
            `/uploads/${req.file.filename}`,
            req.user.id,
            folderId,
        );

        console.log('   ✅ Archivo guardado con ID:', newFile.id);
        console.log(
            '   🔁 PASO 4: Redirigiendo con mensaje de éxito...',
        );

        return redirectWithMessage(
            res,
            redirectPath,
            'success',
            'Archivo subido correctamente',
        );
    } catch (error) {
        console.log('   💥 Error al guardar:', error.message);
        console.log(
            '   🧹 Borrando el archivo físico para no dejar basura en uploads/...',
        );
        await fs.unlink(req.file.path).catch(() => {});

        return redirectWithMessage(
            res,
            redirectPath,
            'error',
            'No se pudo guardar el archivo',
        );
    }
}

export async function downloadFile(req, res) {
    const file = req.recurso;

    console.log('\n⬇️ [DOWNLOAD] PASO 1: Solicitando archivo:', file.name);
    console.log('   👤 Dueño:', file.ownerId);
    console.log('   👤 Usuario actual:', req.user.id);

    if (file.ownerId !== req.user.id) {
        console.log('   ⛔ El archivo no pertenece al usuario');
        return res
            .status(403)
            .send('No tienes permiso para descargar este archivo');
    }

    console.log(
        '   🛡️ PASO 2: Calculando la ruta física con path.basename() para evitar path traversal...',
    );
    const filename = path.basename(file.url);
    const absolutePath = path.join(uploadsDir, filename);
    console.log('   📁 Ruta física:', absolutePath);

    console.log('   🚚 PASO 3: Enviando el archivo con res.download()...');
    return res.download(absolutePath, file.name, (error) => {
        if (error) {
            console.log('   💥 Error en res.download():', error.message);

            if (!res.headersSent) {
                return res
                    .status(404)
                    .send('El archivo no existe en el disco');
            }
        } else {
            console.log('   ✅ Archivo enviado correctamente');
        }
    });
}

export async function deleteFile(req, res) {
    const file = req.recurso;

    console.log('\n🗑️ [DELETE FILE] PASO 1: Eliminando archivo:', file.name);
    console.log('   👤 Dueño:', file.ownerId);
    console.log('   👤 Usuario actual:', req.user.id);

    if (file.ownerId !== req.user.id) {
        console.log('   ⛔ El archivo no pertenece al usuario');
        return res
            .status(403)
            .send('No tienes permiso para eliminar este archivo');
    }

    const redirectPath = file.folderId ? `/folders/${file.folderId}` : '/';
    const filename = path.basename(file.url);
    const absolutePath = path.join(uploadsDir, filename);

    try {
        console.log(
            '   🗃️ PASO 2: Borrando el registro del archivo en la base de datos...',
        );
        await eliminarArchivo(file.id);
        console.log('   ✅ Registro eliminado de la base de datos');

        try {
            console.log('   🗂️ PASO 3: Borrando el archivo físico del disco...');
            await fs.unlink(absolutePath);
            console.log('   ✅ Archivo borrado del disco:', filename);
        } catch (error) {
            console.log(
                '   ⚠️ El registro se borró, pero el archivo físico no:',
                error.message,
            );
        }

        console.log('   🔁 PASO 4: Redirigiendo con mensaje de éxito...');
        return redirectWithMessage(
            res,
            redirectPath,
            'success',
            'Archivo eliminado correctamente',
        );
    } catch (error) {
        console.log('   💥 Error al eliminar:', error.message);
        return redirectWithMessage(
            res,
            redirectPath,
            'error',
            'No se pudo eliminar el archivo',
        );
    }
}

export async function postCreateFolder(req, res) {
    const name =
        typeof req.body.name === 'string' ? req.body.name.trim() : '';

    console.log('\n📁 [FOLDER] PASO 1: Creando carpeta:', name);
    console.log('   👤 Usuario:', req.user.username, '(ID:', req.user.id + ')');

    if (!name) {
        console.log('   ❌ El nombre de la carpeta está vacío');
        return redirectWithMessage(
            res,
            '/',
            'error',
            'El nombre de la carpeta es obligatorio',
        );
    }

    try {
        console.log(
            '   🗃️ PASO 2: Insertando la carpeta en la base de datos...',
        );
        const folder = await agregarCarpeta(name, req.user.id);
        console.log('   ✅ Carpeta creada con ID:', folder.id);

        console.log('   🔁 PASO 3: Redirigiendo a / con mensaje de éxito...');
        return redirectWithMessage(
            res,
            '/',
            'success',
            'Carpeta creada correctamente',
        );
    } catch (error) {
        console.log('   💥 Error al crear:', error.message);
        return redirectWithMessage(
            res,
            '/',
            'error',
            'No se pudo crear la carpeta',
        );
    }
}

export async function deleteFolder(req, res) {
    const folder = req.recurso;

    console.log('\n🗑️ [FOLDER] PASO 1: Eliminando carpeta:', folder.name);
    console.log('   👤 Dueño:', folder.ownerId);
    console.log('   👤 Usuario actual:', req.user.id);

    if (folder.ownerId !== req.user.id) {
        console.log('   ⛔ La carpeta no pertenece al usuario');
        return res
            .status(403)
            .send('No tienes permiso para eliminar esta carpeta');
    }

    try {
        console.log(
            '   🗃️ PASO 2: Borrando la carpeta de la base de datos...',
        );
        await eliminarCarpeta(folder.id);
        console.log('   ✅ Carpeta eliminada:', folder.id);
        console.log(
            '   ℹ️ Gracias a onDelete: SetNull, sus archivos quedan en la raíz',
        );

        console.log('   🔁 PASO 3: Redirigiendo a / con mensaje de éxito...');
        return redirectWithMessage(
            res,
            '/',
            'success',
            'Carpeta eliminada. Sus archivos quedaron en la raíz.',
        );
    } catch (error) {
        console.log('   💥 Error al eliminar:', error.message);
        return redirectWithMessage(
            res,
            '/',
            'error',
            'No se pudo eliminar la carpeta',
        );
    }
}
