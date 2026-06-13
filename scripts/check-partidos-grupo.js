const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const partidos = await p.partido.findMany({
    where: { id: { in: [209, 210, 211] } },
    select: { id: true, grupo: true, fase: true, golesLocal: true, golesVisitante: true },
  });
  console.log(partidos);
  await p.$disconnect();
}
main();
