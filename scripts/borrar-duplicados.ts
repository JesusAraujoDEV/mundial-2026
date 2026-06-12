import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ids = [49, 50, 51, 52, 53, 54];
  
  for (const id of ids) {
    try {
      await prisma.grupo.deleteMany({ where: { paisId: id } });
      await prisma.jugador.deleteMany({ where: { paisId: id } });
      await prisma.pais.delete({ where: { id } });
      console.log(`✅ Eliminado país ID ${id}`);
    } catch (e: any) {
      console.log(`⏭️  ID ${id}: ${e.code || e.message?.slice(0, 80)}`);
    }
  }
}

main()
  .finally(() => prisma.$disconnect());
