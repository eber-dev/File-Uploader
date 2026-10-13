import { prisma } from '../lib/prisma.js';

export async function obtenerCarpetas() {
    const folders = await prisma.folder.findMany();

    return folders;
}

export async function obtenerCarpetasid(ownerid) {
    const folderbyid = await prisma.folder.findUnique({
        where: {
            id: ownerid,
        },
    });

    return folderbyid;
}

export async function agregarCarpeta(name, ownerid) {
    const newfolder = await prisma.folder.create({
        data: {
            name: name,
            ownerId: ownerid,
        },
    });

    return newfolder;
}

export async function actualizarCarpeta(id, name, ownerid) {
    const updatefolder = await prisma.folder.update({
        where: {
            id: id,
        },
        data: {
            name: name,
            ownerId: ownerid,
        },
    });

    return updatefolder;
}

export async function eliminarCarpeta(id) {
    const deletfolder = await prisma.folder.delete({
        where: {
            id: id,
        },
    });

    return deletfolder;
}
