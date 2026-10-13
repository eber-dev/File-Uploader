import { prisma } from '../lib/prisma.js';

export async function obtenerUsuarios() {
    const users = await prisma.user.findMany();

    return users;
}

export async function obtenerUsuarioid(id) {
    const userbyid = await prisma.user.findUnique({
        where: {
            id: id,
        },
    });

    return userbyid;
}

export async function agregarUsuario(email, name, password) {
    const newUser = await prisma.user.create({
        data: {
            email: email,
            name: name,
            password: password,
        },
    });

    return newUser;
}

export async function actualizarUsuario(id, name, email, password) {
    const updateUser = await prisma.user.update({
        where: {
            id: id,
        },
        data: {
            name: name,
            email: email,
            password: password,
        },
    });

    return updateUser;
}
export async function eliminarUsuario(id) {
    const deleteuser = await prisma.user.delete({
        where: {
            id: id,
        },
    });

    return deleteuser;
}
