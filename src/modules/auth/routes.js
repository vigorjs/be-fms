// src/modules/auth/routes.js
const handlers = require('./handlers');
const schemas = require('./schemas');

function authRoutes(fastify, options, done) {
  // Public routes
  fastify.post('/register', { 
    schema: schemas.registerSchema 
  }, handlers.register);
  
  fastify.post('/login', { 
    schema: schemas.loginSchema 
  }, handlers.login);
  
  // Authenticated routes
  fastify.get('/me', { 
    schema: schemas.getMeSchema,
    preHandler: [fastify.authenticate]
  }, handlers.getMe);
  
  done();
}

module.exports = authRoutes;