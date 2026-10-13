import { prisma } from '../lib/prisma.js';

export async function obtenerArchivos() {
    const files = await prisma.file.findMany();

    return files;
}

export async function obtenerArchivosid(folderId) {
    const filebyid = await prisma.file.findUnique({
        where: {
            id: folderId,
        },
    });

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

    return newfile;
}

export async function actualizarArchivo(
    folderId,
    name,
    size,
    mimeType,
    url,
    ownerId,
    folderId,
) {
    const updatefile = await prisma.file.update({
        where: {
            id: folderId,
        },
        data: {
            name: name,
            size: size,
            mimeType: mimeType,
            url: url,
            ownerId: ownerId,
        },
    });

    return updatefile;
}

export async function eliminarArchivo(folderId) {
    const deletfile = await prisma.file.delete({
        where: {
            id: folderId,
        },
    });

    return deletfile;
}
