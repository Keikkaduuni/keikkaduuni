import 'dotenv/config';
import prisma from '../lib/prisma.js';

async function main() {
  const user = await prisma.user.create({
    data: {
      email: 'newuser@example.com',
      name: 'New User',
    },
  });
  console.log('User created:', user);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
