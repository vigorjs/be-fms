// src/modules/search/routes.js
const handlers = require('./handlers');
const schemas = require('./schemas');

function searchRoutes(fastify, options, done) {
  // Search endpoint (requires authentication)
  fastify.get('/', { 
    schema: schemas.searchSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.search);
  
  done();
}

module.exports = searchRoutes;