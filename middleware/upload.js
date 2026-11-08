import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

console.log(
    '\n📦 [MÓDULO middleware/upload.js] Configurando la subida de archivos...',
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📤 [UPLOAD] PASO 1: Calculando la carpeta física de subidas...');
export const uploadsDir = path.join(__dirname, '..', 'uploads');
console.log('   ℹ️ uploadsDir:', uploadsDir);

console.log('📤 [UPLOAD] PASO 2: Creando la carpeta si no existe...');
// recursive: true evita errores si la carpeta ya existe.
fs.mkdirSync(uploadsDir, { recursive: true });
console.log('   ✅ Carpeta lista para recibir archivos');

console.log('📤 [UPLOAD] PASO 3: Configurando el almacenamiento en disco...');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('\n📤 [UPLOAD] PASO 3.1: Multer eligió el destino del archivo');
        console.log('   📄 Archivo original:', file.originalname);
        console.log('   📁 Destino:', uploadsDir);
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        console.log(
            '📤 [UPLOAD] PASO 3.2: Generando un nombre único para el archivo',
        );
        const extension = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${randomUUID()}${extension}`;
        console.log('   🏷️ Nombre generado:', uniqueName);
        console.log(
            '   ℹ️ Se usa Date.now() + UUID para evitar colisiones entre archivos',
        );
        cb(null, uniqueName);
    },
});

console.log('📤 [UPLOAD] PASO 4: Configurando Multer y el límite de tamaño...');
export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
    },
});
console.log('   ✅ Multer listo. Límite máximo: 10 MB por archivo');
