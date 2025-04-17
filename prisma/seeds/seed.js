// prisma/seeds/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');
  
  // Clear existing users
  await prisma.user.deleteMany({});
  console.log('Cleared existing users');
  
  // Create a super admin user
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      password: superAdminPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`Created super admin: ${superAdmin.email}`);

  // Create an admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create 100 regular users
  const usersToCreate = [];
  for (let i = 0; i < 100; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    const password = await bcrypt.hash('password123', 10);
    
    usersToCreate.push({
      email,
      name: `${firstName} ${lastName}`,
      password,
      role: 'USER',
    });
    
    // Log progress every 10 users
    if ((i + 1) % 10 === 0) {
      console.log(`Prepared ${i + 1} regular users...`);
    }
  }
  
  // Batch insert users
  await prisma.user.createMany({
    data: usersToCreate,
  });
  console.log('Created 100 regular users');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
