// src/plugins/fileupload.js
const fp = require('fastify-plugin');
const busboy = require('busboy');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

module.exports = fp(async function (fastify, opts) {
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default

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
    let fileBuffer = null;
    let fileData = null;
    let fields = {};
    let error = null;

    // Handle file upload
    bb.on('file', (fieldname, file, fileInfo) => {
      fastify.log.info(`Processing file upload: ${fileInfo.filename}`);
      
      const chunks = [];
      let fileSize = 0;

      file.on('data', (chunk) => {
        chunks.push(chunk);
        fileSize += chunk.length;
        
        // Check file size
        if (fileSize > maxFileSize) {
          error = new Error(`File size exceeds the allowed limit of ${maxFileSize} bytes`);
          file.resume(); // Discard the rest of the file
        }
      });

      file.on('end', () => {
        if (!error && chunks.length > 0) {
          fileBuffer = Buffer.concat(chunks);
          fileData = {
            fieldname,
            filename: fileInfo.filename,
            encoding: fileInfo.encoding,
            mimetype: fileInfo.mimeType,
            buffer: fileBuffer,
            size: fileBuffer.length
          };
          fastify.log.info(`File upload complete: ${fileInfo.filename}, size: ${fileBuffer.length} bytes`);
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
        return done(error);
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