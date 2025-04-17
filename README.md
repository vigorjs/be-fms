# File Management System API

Modern, modular Fastify API for a file management system with JWT authentication, PostgreSQL, and Prisma ORM. Features a clean architecture with service layers, route validation, comprehensive error handling, and role-based access control.

## Features

- **Modular Architecture**: Domain-based structure for better maintainability
- **JWT Authentication**: Built-in auth with register, login, and protected routes
- **Role-Based Access Control (RBAC)**: Three user roles (USER, ADMIN, SUPER_ADMIN) with different permissions
- **PostgreSQL + Prisma ORM**: Type-safe database access with easy migrations
- **Schema Validation**: Request and response validation using JSON Schema
- **Swagger Documentation**: Auto-generated API docs available at `/documentation`
- **Error Handling**: Standardized error responses
- **Logging**: Structured logging with Logtail support
- **Environment Configuration**: Easy environment management
- **API Prefix**: All endpoints are prefixed with `/api` for clarity
- **Clean Separation**: Routes, handlers, services, and schemas are separated for better code organization

## Prerequisites

- Node.js 16+
- PostgreSQL

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/file-management-system.git
cd file-management-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the `.env.example` file to `.env` and update it with your configuration:

```bash
cp .env.example .env
```

```
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/fms_db"

# JWT
JWT_SECRET="your-secret-jwt-token-for-authentication"

# Logger
LOGTAIL_SOURCE_TOKEN=
LOGTAIL_INGESTING_HOST=logs.betterstack.com
LOGGER_FILE=server.log

# Server
PORT=3000

# RBAC
SUPER_ADMIN_KEY="your-super-secret-key-for-creating-super-admin"

# File Storage
STORAGE_PATH="./storage"
MAX_FILE_SIZE="50mb"
```

Make sure to set a secure, random value for JWT_SECRET and SUPER_ADMIN_KEY.

### 4. Set up the database

Make sure PostgreSQL is running and create a database:

```bash
createdb fms_db
```

Run the Prisma migrations:

```bash
npm run db:migrate
```

### 5. Seed the Database (Optional)

To seed the database with test data including 1 super admin, 1 admin, and 100 regular users:

```bash
# First, install the required dependencies
npm install @faker-js/faker --save-dev

# Run the seeder
npm run db:seed
```

Default credentials for seeded users:
- Super Admin: superadmin@example.com / superadmin123
- Admin: admin@example.com / admin123
- Regular Users: (various emails) / password123

### 6. Start the server

Development mode with hot reloading:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## Role-Based Access Control

This application implements role-based access control with three user roles:

- **USER**: Regular users with basic permissions
- **ADMIN**: Administrative users with elevated permissions
- **SUPER_ADMIN**: Top-level administrators with full access

### Creating a Super Admin

To create a Super Admin, send a POST request to `/api/users/super-admin` with the special header:

```bash
X-Super-Admin-Key: your-super-secret-key-from-env
```

This header must match the SUPER_ADMIN_KEY value in your .env file.

### Role Permissions

| Action | USER | ADMIN | SUPER_ADMIN |
|--------|----------|-------|-------------|
| Register/Login | ✓ | ✓ | ✓ |
| Create Admins | ✗ | ✗ | ✓ |
| List/Search Users | ✗ | ✓ | ✓ |
| Change User Roles | ✗ | Limited | ✓ |
| Manage Files | Own Only | All Users | All Users |

## Project Structure

```
src/
├── modules/              # Business domain modules
│   ├── auth/             # Authentication module
│   │   ├── routes.js     # Route definitions
│   │   ├── handlers.js   # Request handlers
│   │   ├── service.js    # Business logic
│   │   └── schemas/      # Validation schemas
│   │       └── index.js
│   └── users/            # User management module
│       ├── routes.js     # Route definitions
│       ├── handlers.js   # Request handlers
│       ├── service.js    # Business logic
│       └── schemas/      # Validation schemas
│           └── index.js
├── plugins/              # Fastify plugins
│   ├── prisma.js         # Database connection
│   ├── jwt.js            # JWT authentication
│   ├── rbac.js           # Role-based access control
│   └── logger.js         # Logging configuration
├── utils/                # Utilities
│   └── errors.js         # Error handling
├── prisma/               # Prisma ORM files
│   └── schema.prisma     # Database schema
├── app.js                # Application setup
└── server.js             # Server entry point
```

## API Endpoints

All endpoints are prefixed with `/api`.

### Authentication

- `POST /api/auth/register` - Register as a USER (public)
- `POST /api/auth/login` - Login and get JWT token (public)
- `GET /api/auth/me` - Get current user info (requires authentication)

### User Management

- `POST /api/users/admin` - Create admin user (requires SUPER_ADMIN role)
- `POST /api/users/super-admin` - Create super admin (requires special header)
- `POST /api/users/role` - Update user role (requires ADMIN or SUPER_ADMIN role)
- `GET /api/users` - List all users (requires ADMIN or SUPER_ADMIN role)
- `GET /api/users/search` - Search users (requires ADMIN or SUPER_ADMIN role)
- `GET /api/users/:id` - Get user details (requires ADMIN or SUPER_ADMIN role)
- `PUT /api/users/:id` - Update user (requires ADMIN or SUPER_ADMIN role)
- `DELETE /api/users/:id` - Delete user (requires ADMIN or SUPER_ADMIN role)

### File Management

#### Folders
- `POST /api/files/folders` - Create a new folder
- `GET /api/files/folders` - List folder contents (files and folders)
- `DELETE /api/files/folders/:id` - Delete a folder and all its contents

#### Files
- `GET /api/files/list` - List all files with filtering and pagination
- `POST /api/files/upload` - Upload a file
- `GET /api/files/:id/download` - Download a file
- `DELETE /api/files/:id` - Delete a file

#### Sharing
- `POST /api/files/share` - Share a file with another user
- `POST /api/files/:id/public-link` - Create a public link for a file
- `GET /api/files/public/:token` - Access a file via public link (no auth required)

#### Storage
- `GET /api/files/storage/info` - Get user's storage usage information

### Other Endpoints

- `GET /health` - Health check endpoint (not prefixed with /api)
- `GET /documentation` - API documentation

## Documentation

The API documentation is available at `/documentation` when the server is running.

## License

MIT