// src/modules/search/handlers.js
const SearchService = require('./service');

async function search(request, reply) {
  const searchService = new SearchService(this.prisma);
  
  try {
    const userId = request.user.id;
    const { query } = request.query;
    
    // Parse pagination parameters
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 20;
    
    // Perform search
    const results = await searchService.search(userId, query, { page, limit });
    
    return reply.code(200).send(results);
  } catch (error) {
    request.log.error(error);
    
    if (error.statusCode) {
      return reply.code(error.statusCode).send({ 
        error: error.message 
      });
    }
    
    return reply.code(500).send({ 
      error: 'Internal server error' 
    });
  }
}

module.exports = {
  search
};