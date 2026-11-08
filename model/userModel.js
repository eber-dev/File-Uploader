import { prisma } from '../lib/prisma.js';

console.log(
    '\n📦 [MÓDULO model/userModel.js] Cargando funciones de la tabla User...',
);

export async function obtenerUsuarios() {
    console.log(
        '\n🗃️ [MODEL USER] obtenerUsuarios(): buscando TODOS los usuarios...',
    );
    const users = await prisma.user.findMany();
    console.log('   ✅ Total de usuarios:', users.length);

    return users;
}

export async function obtenerUsuarioid(id) {
    console.log(
        '\n🗃️ [MODEL USER] obtenerUsuarioid(): buscando usuario por ID',
        id,
    );

    const userbyid = await prisma.user.findUnique({
        where: {
            id: id,
        },
    });

    console.log(
        '   ✅ Resultado:',
        userbyid ? `"${userbyid.username}"` : 'no encontrado',
    );

    return userbyid;
}

export async function agregarUsuario(username, email, name, password) {
    console.log('\n🗃️ [MODEL USER] agregarUsuario(): insertando un usuario...');
    console.log('   👤 username:', username);
    console.log('   📧 email:', email);
    console.log('   📝 name:', name);
    console.log('   🔑 password: (hash, no se muestra)');

    const newUser = await prisma.user.create({
        data: {
            username: username,
            email: email,
            name: name,
            password: password,
        },
    });

    console.log('   ✅ Usuario insertado con ID:', newUser.id);

    return newUser;
}

export async function actualizarUsuario(id, name, email, password) {
    console.log(
        '\n🗃️ [MODEL USER] actualizarUsuario(): actualizando usuario ID',
        id,
    );

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

    console.log('   ✅ Usuario actualizado:', updateUser.username);

    return updateUser;
}

export async function eliminarUsuario(id) {
    console.log(
        '\n🗃️ [MODEL USER] eliminarUsuario(): eliminando usuario ID',
        id,
    );

    const deleteuser = await prisma.user.delete({
        where: {
            id: id,
        },
    });

    console.log('   ✅ Usuario eliminado:', deleteuser.username);

    return deleteuser;
}
