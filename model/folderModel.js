import { prisma } from '../lib/prisma.js';

console.log(
    '\n📦 [MÓDULO model/folderModel.js] Cargando funciones de la tabla Folder...',
);

export async function obtenerCarpetas() {
    console.log(
        '\n🗃️ [MODEL FOLDER] obtenerCarpetas(): buscando TODAS las carpetas...',
    );
    const folders = await prisma.folder.findMany();
    console.log('   ✅ Total de carpetas:', folders.length);

    return folders;
}

export async function obtenerCarpetasPorUsuario(ownerId) {
    console.log('\n🗃️ [MODEL FOLDER] obtenerCarpetasPorUsuario()');
    console.log('   👤 ownerId:', ownerId);
    console.log(
        '   🔎 Buscando carpetas del usuario e incluyendo el conteo de archivos...',
    );

    const folders = await prisma.folder.findMany({
        where: {
            ownerId: ownerId,
        },
        orderBy: {
            name: 'asc',
        },
        include: {
            _count: {
                select: {
                    files: true,
                },
            },
        },
    });

    console.log('   ✅ Carpetas encontradas:', folders.length);

    return folders;
}

export async function obtenerCarpetasid(id) {
    console.log(
        '\n🗃️ [MODEL FOLDER] obtenerCarpetasid(): buscando carpeta por ID',
        id,
    );

    const folderbyid = await prisma.folder.findUnique({
        where: {
            id: id,
        },
    });

    console.log(
        '   ✅ Resultado:',
        folderbyid ? `"${folderbyid.name}"` : 'no encontrada',
    );

    return folderbyid;
}

export async function agregarCarpeta(name, ownerid) {
    console.log('\n🗃️ [MODEL FOLDER] agregarCarpeta(): insertando una carpeta...');
    console.log('   📁 name:', name);
    console.log('   👤 ownerId:', ownerid);

    const newfolder = await prisma.folder.create({
        data: {
            name: name,
            ownerId: ownerid,
        },
    });

    console.log('   ✅ Carpeta insertada con ID:', newfolder.id);

    return newfolder;
}

export async function actualizarCarpeta(id, name, ownerid) {
    console.log(
        '\n🗃️ [MODEL FOLDER] actualizarCarpeta(): actualizando carpeta ID',
        id,
    );

    const updatefolder = await prisma.folder.update({
        where: {
            id: id,
        },
        data: {
            name: name,
            ownerId: ownerid,
        },
    });

    console.log('   ✅ Carpeta actualizada:', updatefolder.name);

    return updatefolder;
}

export async function eliminarCarpeta(id) {
    console.log(
        '\n🗃️ [MODEL FOLDER] eliminarCarpeta(): eliminando carpeta ID',
        id,
    );

    const deletfolder = await prisma.folder.delete({
        where: {
            id: id,
        },
    });

    console.log('   ✅ Carpeta eliminada:', deletfolder.name);

    return deletfolder;
}
