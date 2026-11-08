import express from 'express';

import { upload } from '../middleware/upload.js';
import {
    verificarExistenciaFile,
    verificarExistenciaFolder,
} from '../middleware/existe.js';
import {
    deleteFile,
    deleteFolder,
    downloadFile,
    getDrive,
    getFolder,
    postCreateFolder,
    postUpload,
} from '../controller/driveController.js';

console.log(
    '\n📦 [MÓDULO routes/driveRoutes.js] Definiendo las rutas del Drive...',
);

const router = express.Router();

function uploadSingle(req, res, next) {
    console.log('\n📤 [RUTA /upload] PASO 1: Multer va a procesar el formulario');
    upload.single('file')(req, res, (error) => {
        if (error) {
            console.log('❌ [UPLOAD] Error de Multer:', error.message);
            console.log('   ℹ️ Código de error:', error.code);

            const message =
                error.code === 'LIMIT_FILE_SIZE'
                    ? 'El archivo supera el límite de 10 MB'
                    : 'No se pudo subir el archivo';

            return res.redirect(`/?error=${encodeURIComponent(message)}`);
        }

        console.log('   ✅ PASO 2: Multer terminó sin errores');
        console.log(
            '   📄 Archivo recibido:',
            req.file?.originalname || '(ninguno)',
        );
        return next();
    });
}

console.log('🛣️ [RUTAS] Registrando endpoints...');

router.get('/', getDrive);
console.log('   ✅ GET  /');

router.get('/folders/:id', verificarExistenciaFolder(), getFolder);
console.log('   ✅ GET  /folders/:id');

router.post('/folders', postCreateFolder);
console.log('   ✅ POST /folders');

router.post('/folders/:id/delete', verificarExistenciaFolder(), deleteFolder);
console.log('   ✅ POST /folders/:id/delete');

router.post('/upload', uploadSingle, postUpload);
console.log('   ✅ POST /upload');

router.get('/files/:id/download', verificarExistenciaFile(), downloadFile);
console.log('   ✅ GET  /files/:id/download');

router.post('/files/:id/delete', verificarExistenciaFile(), deleteFile);
console.log('   ✅ POST /files/:id/delete');

console.log('🛣️ [RUTAS] Todas las rutas del Drive registradas');

export default router;
