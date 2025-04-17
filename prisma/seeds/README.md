# Database Seeder

This directory contains scripts to seed the database with initial data for development and testing purposes.

## Available Seed Data

The main seed script (`seed.js`) creates:

- 1 Super Admin user
- 1 Admin user
- 100 Regular users with randomly generated information

## Default User Credentials

### Super Admin
- Email: superadmin@example.com
- Password: superadmin123
- Role: SUPER_ADMIN

### Admin
- Email: admin@example.com
- Password: admin123
- Role: ADMIN

### Regular Users
- Email: (randomly generated)
- Password: password123
- Role: USER

## Running the Seeder

Before running the seeder, make sure you have installed the required dependencies:

```bash
# Install Faker.js for generating random user data
npm install @faker-js/faker --save-dev
```

To run the seeder:

```bash
npm run db:seed
```

This will clear all existing users in the database and create new seed data.

**Note:** This seed script is intended for development and testing environments only. Do not run it in production.
