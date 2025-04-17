// src/modules/users/routes.js
const handlers = require('./handlers');
const schemas = require('./schemas');

function userRoutes(fastify, options, done) {
  // Admin routes
  fastify.post('/admin', { 
    schema: schemas.registerAdminSchema,
    preHandler: [fastify.checkRole(['SUPER_ADMIN'])]
  }, handlers.registerAdmin);
  
  fastify.post('/super-admin', { 
    schema: schemas.registerSuperAdminSchema,
    preHandler: [fastify.allowSuperAdminCreation()]
  }, handlers.registerSuperAdmin);
  
  fastify.post('/role', { 
    schema: schemas.updateRoleSchema,
    preHandler: [fastify.checkRole(['ADMIN', 'SUPER_ADMIN'])]
  }, handlers.updateRole);
  
  // User listing and details
  fastify.get('/', { 
    schema: schemas.listUsersSchema,
    preHandler: [fastify.checkRole(['ADMIN', 'SUPER_ADMIN'])]
  }, handlers.listUsers);
  
  fastify.get('/search', { 
    schema: schemas.searchUsersSchema,
    preHandler: [fastify.checkRole(['ADMIN', 'SUPER_ADMIN'])]
  }, handlers.searchUsers);
  
  fastify.get('/:id', { 
    schema: schemas.getUserByIdSchema,
    preHandler: [fastify.checkRole(['ADMIN', 'SUPER_ADMIN'])]
  }, handlers.getUserById);
  
  // User management
  fastify.put('/:id', { 
    schema: schemas.updateUserSchema,
    preHandler: [fastify.checkRole(['ADMIN', 'SUPER_ADMIN'])]
  }, handlers.updateUser);
  
  fastify.delete('/:id', { 
    schema: schemas.deleteUserSchema,
    preHandler: [fastify.checkRole(['ADMIN', 'SUPER_ADMIN'])]
  }, handlers.deleteUser);
  
  done();
}

module.exports = userRoutes;