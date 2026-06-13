const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const grupos = await p.grupo.findMany({
    where: { nombre: 'B' },
    include: { pais: { select: { nombre: true } } },
  });
  console.log(JSON.stringify(grupos, null, 2));
  await p.$disconnect();
}
main();
