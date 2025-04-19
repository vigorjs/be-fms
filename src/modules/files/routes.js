const handlers = require('./handlers');
const schemas = require('./schemas');

function fileRoutes(fastify, options, done) {
  // Register @fastify/multipart (pastikan ini hanya dipanggil sekali di aplikasi Anda)
  fastify.register(require('@fastify/multipart'), { limits: { fileSize: 65536 } }); // Contoh batas 64KB

  // Folder operations
  fastify.post('/folders', {
    schema: schemas.createFolderSchema,
    preHandler: [fastify.authenticate]
  }, handlers.createFolder);

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

  // Test upload route using @fastify/multipart directly
  fastify.post('/test-upload', async (request, reply) => {
    const data = await request.file();
    if (data) {
      const buffer = await data.toBuffer();
      console.log(`Received ${buffer.length} bytes in test upload`);
      reply.send({ received: buffer.length });
    } else {
      reply.code(400).send({ error: 'No file uploaded' });
    }
  });

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