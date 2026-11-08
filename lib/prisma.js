import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

console.log(
    '\n📦 [MÓDULO lib/prisma.js] Cargando la conexión a la base de datos...',
);

console.log('🗄️ [PRISMA] PASO 1: dotenv ya cargó las variables de .env');
console.log(
    '   ℹ️ Gracias a dotenv podemos leer DATABASE_URL con process.env.DATABASE_URL',
);

console.log('🗄️ [PRISMA] PASO 2: Leyendo DATABASE_URL...');
const connectionString = `${process.env.DATABASE_URL}`;
console.log(
    '   ℹ️ DATABASE_URL:',
    connectionString && connectionString !== 'undefined'
        ? 'definida (no se muestra por seguridad)'
        : '❌ NO definida',
);

if (!process.env.DATABASE_URL) {
    console.log(
        '   ⚠️ ADVERTENCIA: DATABASE_URL está vacía. La app arrancará, pero cualquier consulta a la base de datos fallará.',
    );
    console.log(
        '   ⚠️ Revisa tu archivo .env y coloca la URL real de PostgreSQL/Supabase.',
    );
}

console.log('🗄️ [PRISMA] PASO 3: Creando el adaptador PrismaPg...');
console.log(
    '   ℹ️ El adaptador conecta Prisma con PostgreSQL usando el driver pg',
);
const adapter = new PrismaPg({ connectionString });
console.log('   ✅ Adaptador creado');

console.log('🗄️ [PRISMA] PASO 4: Creando el cliente Prisma...');
console.log(
    '   ℹ️ Este cliente es el que usan los modelos para hacer consultas',
);
const prisma = new PrismaClient({ adapter });
console.log(
    '   ✅ Cliente Prisma listo y compartido por toda la aplicación',
);

export { prisma };
