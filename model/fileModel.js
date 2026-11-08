import { prisma } from '../lib/prisma.js';

console.log(
    '\n📦 [MÓDULO model/fileModel.js] Cargando funciones de la tabla File...',
);

export async function obtenerArchivos() {
    console.log(
        '\n🗃️ [MODEL FILE] obtenerArchivos(): buscando TODOS los archivos...',
    );
    const files = await prisma.file.findMany();
    console.log('   ✅ Total de archivos:', files.length);

    return files;
}

export async function obtenerArchivosPorUsuario(ownerId, folderId = null) {
    console.log('\n🗃️ [MODEL FILE] obtenerArchivosPorUsuario()');
    console.log('   👤 ownerId:', ownerId);
    console.log(
        '   📁 folderId:',
        folderId === null ? 'raíz (null)' : folderId,
    );
    console.log('   🔎 Consultando archivos del usuario en esa carpeta...');

    const files = await prisma.file.findMany({
        where: {
            ownerId: ownerId,
            folderId: folderId,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    console.log('   ✅ Archivos encontrados:', files.length);

    return files;
}

export async function obtenerArchivosid(id) {
    console.log(
        '\n🗃️ [MODEL FILE] obtenerArchivosid(): buscando archivo por ID',
        id,
    );

    const filebyid = await prisma.file.findUnique({
        where: {
            id: id,
        },
    });

    console.log(
        '   ✅ Resultado:',
        filebyid ? `"${filebyid.name}"` : 'no encontrado',
    );

    return filebyid;
}

export async function agregarArchivo(
    name,
    size,
    mimeType,
    url,
    ownerId,
    folderId,
) {
    console.log('\n🗃️ [MODEL FILE] agregarArchivo(): insertando un archivo...');
    console.log('   📄 name:', name);
    console.log('   📏 size:', size, 'bytes');
    console.log('   🧾 mimeType:', mimeType);
    console.log('   🔗 url:', url);
    console.log('   👤 ownerId:', ownerId);
    console.log(
        '   📁 folderId:',
        folderId === null ? 'raíz (null)' : folderId,
    );

    const newfile = await prisma.file.create({
        data: {
            name: name,
            size: size,
            mimeType: mimeType,
            url: url,
            ownerId: ownerId,
            folderId: folderId,
        },
    });

    console.log('   ✅ Archivo insertado con ID:', newfile.id);

    return newfile;
}

export async function actualizarArchivo(
    id,
    name,
    size,
    mimeType,
    url,
    ownerId,
    folderId,
) {
    console.log(
        '\n🗃️ [MODEL FILE] actualizarArchivo(): actualizando archivo ID',
        id,
    );

    const updatefile = await prisma.file.update({
        where: {
            id: id,
        },
        data: {
            name: name,
            size: size,
            mimeType: mimeType,
            url: url,
            ownerId: ownerId,
            folderId: folderId,
        },
    });

    console.log('   ✅ Archivo actualizado:', updatefile.name);

    return updatefile;
}

export async function eliminarArchivo(id) {
    console.log(
        '\n🗃️ [MODEL FILE] eliminarArchivo(): eliminando archivo ID',
        id,
    );

    const deletefile = await prisma.file.delete({
        where: {
            id: id,
        },
    });

    console.log('   ✅ Registro eliminado:', deletefile.name);

    return deletefile;
}
