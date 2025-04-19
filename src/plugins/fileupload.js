// src/plugins/fileupload.js
const fp = require('fastify-plugin');
const busboy = require('busboy');
const util = require('util');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const pump = util.promisify(stream.pipeline);

module.exports = fp(async function (fastify, opts) {
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default
  const storagePath = process.env.STORAGE_PATH || path.resolve(process.cwd(), 'storage');
  const uploadsPath = path.join(storagePath, 'uploads');

  // Ensure upload directory exists
  if (!fs.existsSync(uploadsPath)) {
    fastify.log.info(`Creating uploads directory: ${uploadsPath}`);
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  // Add raw body parser for multipart/form-data
  fastify.addContentTypeParser('multipart/form-data', function (request, payload, done) {
    // Create busboy instance with the request headers
    let bb;
    try {
      bb = busboy({ 
        headers: request.headers,
        limits: {
          fileSize: maxFileSize,
          files: 1 // Only allow one file upload at a time
        }
      });
    } catch (error) {
      fastify.log.error('Error creating busboy instance:', error);
      return done(error);
    }

    let fileData = null;
    let fields = {};
    let error = null;

    // Handle file upload
    bb.on('file', (fieldname, file, fileInfo) => {
      fastify.log.info(`Processing file upload: ${fileInfo.filename} (mimetype: ${fileInfo.mimeType})`);
      
      // Generate unique filename to prevent collisions
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}_${fileInfo.filename}`;
      const filePath = path.join(uploadsPath, uniqueFileName);
      
      let fileSize = 0;
      const writeStream = fs.createWriteStream(filePath);
      
      file.on('data', (chunk) => {
        fileSize += chunk.length;
        fastify.log.debug(`Received chunk of size ${chunk.length} bytes`);
        
        // Check file size
        if (fileSize > maxFileSize) {
          error = new Error(`File size exceeds the allowed limit of ${maxFileSize} bytes`);
          file.resume(); // Discard the rest of the file
          writeStream.end();
        }
      });

      file.on('end', () => {
        fastify.log.info(`File upload complete: ${fileInfo.filename}, size: ${fileSize} bytes`);
        
        if (!error && fileSize > 0) {
          fileData = {
            fieldname,
            filename: fileInfo.filename,
            savedAs: uniqueFileName,
            encoding: fileInfo.encoding,
            mimetype: fileInfo.mimeType,
            path: filePath,
            size: fileSize,
            relativePath: path.join('uploads', uniqueFileName),
            buffer: null // We don't need this since we're writing to disk directly
          };
        } else if (fileSize === 0) {
          error = new Error('Uploaded file is empty (0 bytes)');
          // Try to delete the empty file
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            fastify.log.error(`Failed to delete empty file: ${err.message}`);
          }
        }
      });

      // Handle errors in the streaming process
      pump(file, writeStream).catch(err => {
        fastify.log.error(`Error writing file to disk: ${err.message}`);
        error = err;
      });
    });

    // Handle form fields
    bb.on('field', (name, value) => {
      fields[name] = value;
      fastify.log.info(`Form field: ${name}=${value}`);
    });

    // Handle parsing errors
    bb.on('error', (err) => {
      fastify.log.error('Busboy error:', err);
      error = err;
    });

    // Handle parsing completion
    bb.on('finish', () => {
      if (error) {
        fastify.log.error(`File upload error: ${error.message}`);
        return done(error);
      }
      
      if (!fileData) {
        return done(new Error('No file uploaded or file was empty'));
      }
      
      // Pass the parsed data to the route handler
      done(null, { 
        file: fileData, 
        fields: fields 
      });
    });

    // Pipe the incoming request to busboy
    payload.pipe(bb);
  });

  // Decorate fastify with a method to access uploaded file
  fastify.decorateRequest('file', async function () {
    if (!this.body) {
      throw new Error('No upload data available');
    }
    return this.body;
  });
});