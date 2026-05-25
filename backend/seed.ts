import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@baristyle.com' },
    update: {
      role: 'SUPER_ADMIN'
    },
    create: {
      email: 'admin@baristyle.com',
      name: 'Super Admin',
      password_hash: password,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Super Admin created:', superAdmin.email, '(password: admin123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
