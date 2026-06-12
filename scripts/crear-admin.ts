/**
 * Crea el usuario administrador en la base de datos.
 * USO: npx ts-node scripts/crear-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'jesus@mundial.com';
  const password = 'admin2026';
  const nombre = 'Jesus Araujo';

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = await prisma.usuario.upsert({
    where: { email },
    update: { passwordHash, rol: 'admin', nombre },
    create: { nombre, email, passwordHash, rol: 'admin' },
  });

  console.log('✅ Admin creado/actualizado:');
  console.log(`   ID: ${admin.id}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Contraseña: ${password}`);
  console.log(`   Rol: ${admin.rol}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
