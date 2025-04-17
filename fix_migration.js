// fix_migration.js
// A simple script to reset the database and create a fresh schema
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'prisma', 'migrations');

console.log('🔄 Starting database migration fix...');

try {
  // Step 1: Remove existing migrations
  if (fs.existsSync(MIGRATIONS_DIR)) {
    console.log('🗑️  Removing existing migrations...');
    fs.rmSync(MIGRATIONS_DIR, { recursive: true, force: true });
    console.log('✅ Migrations folder removed');
  }

  // Step 2: Push the schema directly to the database (bypass migration system)
  console.log('🔄 Pushing schema to database (this will reset your data)...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Schema pushed successfully');

  // Step 3: Generate Prisma client
  console.log('🔄 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  // Step 4: Create a clean initial migration
  console.log('🔄 Creating a clean initial migration...');
  execSync('npx prisma migrate dev --name initial_schema', { stdio: 'inherit' });
  console.log('✅ Initial migration created');

  // Step 5: Run the seeder
  console.log('🔄 Running database seeder...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully');

  console.log('🎉 Migration fix completed successfully!');
} catch (error) {
  console.error('❌ Error during migration fix:', error.message);
  process.exit(1);
}