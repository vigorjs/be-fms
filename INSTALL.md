# Installation Guide

This guide provides step-by-step instructions to set up the File Management System.

## Prerequisites

- Node.js 16+
- PostgreSQL

## Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd be
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Update the variables in `.env`:
   ```
   # Database
   DATABASE_URL="postgresql://postgres:password@localhost:5432/fms_db"
   
   # JWT
   JWT_SECRET="your-secure-jwt-secret"
   
   # Server
   PORT=6969
   
   # RBAC
   SUPER_ADMIN_KEY="your-super-admin-key"
   
   # File Storage
   STORAGE_PATH="./storage"
   MAX_FILE_SIZE="50mb"
   ```

4. **Run the database fix script**:
   ```bash
   npm run db:fix
   ```
   
   This script will:
   - Reset your database (warning: all data will be lost)
   - Set up the correct schema with BigInt support
   - Run the seeder to create test users

5. **Start the server**:
   ```bash
   npm run dev
   ```

## Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../fe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Default User Credentials (if using seed)

- **Super Admin**: 
  - Email: superadmin@example.com
  - Password: superadmin123

- **Admin**:
  - Email: admin@example.com
  - Password: admin123

- **Regular Users**:
  - Password for all users: password123

## Troubleshooting

If you encounter any issues with dependencies, try:
```bash
npm clean-install
```

For any database issues, you can reset the database:
```bash
npx prisma migrate reset
```

## API Documentation

Once the server is running, you can access the API documentation at:
```
http://localhost:6969/documentation
```