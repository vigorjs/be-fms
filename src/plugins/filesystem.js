// src/plugins/filesystem.js
const fp = require('fastify-plugin');
const fs = require('fs');
const path = require('path');

module.exports = fp(async function(fastify, opts) {
  // Set up storage directory
  const storagePath = process.env.STORAGE_PATH || path.resolve(process.cwd(), 'storage');
  const uploadsPath = path.join(storagePath, 'uploads');
  
  // Create storage directories if they don't exist
  if (!fs.existsSync(storagePath)) {
    fastify.log.info(`Creating storage directory: ${storagePath}`);
    fs.mkdirSync(storagePath, { recursive: true });
  }
  
  if (!fs.existsSync(uploadsPath)) {
    fastify.log.info(`Creating uploads directory: ${uploadsPath}`);
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  
  // Decorate fastify with storage-related utilities
  fastify.decorate('storage', {
    path: storagePath,
    uploadsPath
  });
});