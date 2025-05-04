// src/modules/files/routes.js
const handlers = require('./handlers');
const schemas = require('./schemas');

function fileRoutes(fastify, options, done) {
  // Folder operations
  fastify.post('/folders', { 
    schema: schemas.createFolderSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.createFolder);
  
  fastify.put('/folders/:id/rename', {
    schema: schemas.renameFolderSchema,
    preHandler: [fastify.authenticate]
  }, handlers.renameFolder);
  
  fastify.put('/folders/:id/access', {
    schema: schemas.updateFolderAccessLevelSchema,
    preHandler: [fastify.authenticate]
  }, handlers.updateFolderAccessLevel);
  
  fastify.post('/folders/share', {
    schema: schemas.shareFolderSchema,
    preHandler: [fastify.authenticate]
  }, handlers.shareFolder);
  
  fastify.post('/folders/:id/public-link', {
    schema: schemas.createFolderPublicLinkSchema,
    preHandler: [fastify.authenticate]
  }, handlers.createFolderPublicLink);
  
  fastify.get('/folders', { 
    schema: schemas.getFolderContentsSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.getFolderContents);
  
  // Get folder by ID
  fastify.get('/folders/:id', { 
    schema: schemas.getFolderByIdSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.getFolderById);
  
  // Get folder path (breadcrumb)
  fastify.get('/folders/:id/path', { 
    schema: schemas.getFolderPathSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.getFolderPath);
  
  fastify.delete('/folders/:id', { 
    schema: schemas.deleteFolderSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.deleteFolder);
  
  // File operations
  fastify.get('/list', { 
    schema: schemas.listFilesSchema,
    preHandler: [fastify.authenticate] 
  }, handlers.listFiles);
  
  fastify.put('/:id/rename', {
    schema: schemas.renameFileSchema,
    preHandler: [fastify.authenticate]
  }, handlers.renameFile);
  
  fastify.put('/:id/access', {
    schema: schemas.updateFileAccessLevelSchema,
    preHandler: [fastify.authenticate]
  }, handlers.updateFileAccessLevel);
  
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
  
  // Get public file metadata
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