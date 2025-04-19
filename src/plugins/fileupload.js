// src/plugins/fileupload.js
const fp = require('fastify-plugin');
const busboy = require('busboy');
const util = require('util');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

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

    // File buffer to collect the uploaded file data
    let fileData = null;
    let fields = {};
    let error = null;

    // Handle file upload
    bb.on('file', (fieldname, file, fileInfo) => {
      fastify.log.info(`Processing file upload: ${fileInfo.filename} (mimetype: ${fileInfo.mimeType})`);
      
      const chunks = [];
      let fileSize = 0;

      file.on('data', (chunk) => {
        // Store the chunk in memory
        chunks.push(chunk);
        fileSize += chunk.length;
        
        fastify.log.debug(`Received chunk of size ${chunk.length} bytes, total so far: ${fileSize} bytes`);
        
        // Check file size limit
        if (fileSize > maxFileSize) {
          error = new Error(`File size exceeds the allowed limit of ${maxFileSize} bytes`);
          file.resume(); // Discard the rest of the file
        }
      });

      file.on('end', () => {
        if (!error && chunks.length > 0) {
          // Combine all chunks into a single buffer
          const fileBuffer = Buffer.concat(chunks);
          
          // Verify buffer size matches expected size
          if (fileBuffer.length !== fileSize) {
            fastify.log.error(`File size mismatch: expected ${fileSize} bytes, got ${fileBuffer.length} bytes`);
          }
          
          // Generate a unique filename
          const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}_${fileInfo.filename}`;
          const relativePath = path.join('uploads', uniqueFileName);
          const fullPath = path.join(storagePath, relativePath);
          
          // Save the file to disk
          try {
            // Ensure directory exists
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, fileBuffer);
            
            fastify.log.info(`File saved to disk: ${fullPath}, size: ${fileBuffer.length} bytes`);
          } catch (err) {
            fastify.log.error(`Failed to save file to disk: ${err.message}`);
            error = err;
            return;
          }
          
          fileData = {
            fieldname,
            filename: fileInfo.filename,
            encoding: fileInfo.encoding,
            mimetype: fileInfo.mimeType,
            buffer: fileBuffer,  // Keep the buffer for content searching
            size: fileBuffer.length,
            path: fullPath,
            relativePath: relativePath
          };
          
          fastify.log.info(`File upload complete: ${fileInfo.filename}, size: ${fileBuffer.length} bytes`);
        } else if (chunks.length === 0 || fileSize === 0) {
          error = new Error('Uploaded file is empty (0 bytes)');
        }
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