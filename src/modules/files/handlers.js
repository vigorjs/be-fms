// src/modules/files/handlers.js
const FileService = require('./service');
const util = require('util');
const { pipeline } = require('stream');
const pump = util.promisify(pipeline);

// Create folder handler
async function createFolder(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const { name, parentId } = request.body;
    
    const folder = await fileService.createFolder(userId, { name, parentId });
    
    return reply.code(201).send(folder);
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

// Get folder by ID handler
async function getFolderById(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const folderId = parseInt(request.params.id);
    
    const folder = await fileService.getFolderById(userId, folderId);
    
    return reply.code(200).send(folder);
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

// Get folder path handler
async function getFolderPath(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const folderId = parseInt(request.params.id);
    
    const path = await fileService.getFolderPath(userId, folderId);
    
    return reply.code(200).send(path);
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

// Get folder contents handler
async function getFolderContents(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const { folderId } = request.query;
    
    const contents = await fileService.getFolderContents(
      userId, 
      folderId ? parseInt(folderId) : null
    );
    
    return reply.code(200).send(contents);
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

// List files handler
async function listFiles(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const options = {
      search: request.query.search,
      mimeType: request.query.mimeType,
      sortBy: request.query.sortBy || 'createdAt',
      sortOrder: request.query.sortOrder || 'desc',
      page: parseInt(request.query.page || 1),
      limit: parseInt(request.query.limit || 20),
    };
    
    const result = await fileService.listFiles(userId, options);
    
    return reply.code(200).send(result);
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

// Upload file handler
async function uploadFile(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    let uploadData;
    
    try {
      uploadData = await request.file();
    } catch (err) {
      request.log.error(`Error getting file data: ${err.message}`);
      return reply.code(400).send({ error: 'Invalid file upload' });
    }
    
    if (!uploadData || !uploadData.file) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }
    
    request.log.info(`File received: ${uploadData.file.filename}, size: ${uploadData.file.size} bytes`);
    
    // Extract form fields
    const name = uploadData.fields.name || uploadData.file.filename;
    let folderId = null;
    if (uploadData.fields.folderId && uploadData.fields.folderId !== 'null') {
      folderId = parseInt(uploadData.fields.folderId);
    }
    
    // Extract access level with default to PRIVATE
    let accessLevel = 'PRIVATE';
    if (uploadData.fields.accessLevel) {
      // Make sure it's one of the allowed values
      const allowedLevels = ['PRIVATE', 'SHARED', 'PUBLIC'];
      if (allowedLevels.includes(uploadData.fields.accessLevel)) {
        accessLevel = uploadData.fields.accessLevel;
      }
    }
    
    // Log the access level
    request.log.info(`File access level set to: ${accessLevel}`);
    
    // Upload the file
    const uploadedFile = await fileService.uploadFile(userId, uploadData.file, {
      name,
      folderId,
      accessLevel // Pass the access level to the service
    });
    
    return reply.code(201).send(uploadedFile);
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

// Download file handler
async function downloadFile(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const fileId = parseInt(request.params.id);
    
    const file = await fileService.downloadFile(userId, fileId);
    
    // Set response headers for download
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    reply.header('Content-Type', file.mimeType);
    
    // Convert BigInt to String for Content-Length to avoid issues
    reply.header('Content-Length', String(file.size));
    
    // Send the buffer directly
    return reply.send(file.buffer);
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

// Delete file handler
async function deleteFile(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const fileId = parseInt(request.params.id);
    
    const result = await fileService.deleteFile(userId, fileId);
    
    return reply.code(200).send(result);
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

// Delete folder handler
async function deleteFolder(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const folderId = parseInt(request.params.id);
    
    const result = await fileService.deleteFolder(userId, folderId);
    
    return reply.code(200).send(result);
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

// Share file handler
async function shareFile(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const { fileId, email, permission } = request.body;
    
    const result = await fileService.shareFile(userId, fileId, email, permission);
    
    return reply.code(200).send(result);
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

// Create public link handler
async function createPublicLink(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    const fileId = parseInt(request.params.id);
    
    const result = await fileService.createPublicLink(userId, fileId);
    
    return reply.code(200).send(result);
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

// Get file by public token handler
async function getFileByPublicToken(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const token = request.params.token;
    
    const file = await fileService.getFileByPublicToken(token);
    
    // Check if request wants inline display instead of download
    const disposition = request.query.inline === 'true' ? 'inline' : 'attachment';
    
    // Set response headers for download or inline display
    reply.header('Content-Disposition', `${disposition}; filename="${encodeURIComponent(file.name)}"`);
    reply.header('Content-Type', file.mimeType);
    
    // Convert BigInt to String for Content-Length to avoid issues
    reply.header('Content-Length', String(file.size));
    
    // Send the buffer directly
    return reply.send(file.buffer);
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

// Get file info by public token handler (metadata only, no file content)
async function getFileInfoByPublicToken(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const token = request.params.token;
    
    const fileInfo = await fileService.getFileInfoByPublicToken(token);
    
    return reply.code(200).send(fileInfo);
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

// Get user storage info handler
async function getUserStorageInfo(request, reply) {
  const fileService = new FileService(this.prisma);
  
  try {
    const userId = request.user.id;
    
    const result = await fileService.getUserStorageInfo(userId);
    
    return reply.code(200).send(result);
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
  createFolder,
  getFolderById,
  getFolderPath,
  getFolderContents,
  listFiles,
  uploadFile,
  downloadFile,
  deleteFile,
  deleteFolder,
  shareFile,
  createPublicLink,
  getFileByPublicToken,
  getFileInfoByPublicToken,
  getUserStorageInfo
};