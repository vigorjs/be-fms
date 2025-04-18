// src/modules/files/routes.js
const handlers = require('./handlers');
const schemas = require('./schemas');

function fileRoutes(fastify, options, done) {
  // Folder operations
  fastify.post('/folders', { 
    schema: schemas.createFolderSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.createFolder);
  
  fastify.get('/folders', { 
    schema: schemas.getFolderContentsSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.getFolderContents);
  
  fastify.delete('/folders/:id', { 
    schema: schemas.deleteFolderSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.deleteFolder);
  
  // File operations
  fastify.get('/list', { 
    schema: schemas.listFilesSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.listFiles);
  
  fastify.post('/upload', { 
    schema: schemas.uploadFileSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.uploadFile);
  
  fastify.get('/:id/download', { 
    schema: schemas.downloadFileSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.downloadFile);
  
  fastify.delete('/:id', { 
    schema: schemas.deleteFileSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.deleteFile);
  
  // Sharing operations
  fastify.post('/share', { 
    schema: schemas.shareFileSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.shareFile);
  
  fastify.post('/:id/public-link', { 
    schema: schemas.createPublicLinkSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.createPublicLink);
  
  // Public access
  fastify.get('/public/:token', { 
    schema: schemas.getFileByPublicTokenSchema 
  }, handlers.getFileByPublicToken);
  
  // New endpoint: Get public file metadata
  fastify.get('/public/:token/info', { 
    schema: schemas.getFileInfoByPublicTokenSchema 
  }, handlers.getFileInfoByPublicToken);
  
  // Storage info
  fastify.get('/storage/info', { 
    schema: schemas.getUserStorageInfoSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.getUserStorageInfo);
  
  done();
}

module.exports = fileRoutes;