// src/modules/files/schemas/index.js

// Reusable file object schema
const fileSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    mimeType: { type: 'string' },
    size: { type: 'integer' },
    accessLevel: { type: 'string', enum: ['PRIVATE', 'SHARED', 'PUBLIC'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    ownerId: { type: 'integer' },
    folderId: { type: ['integer', 'null'] },
  }
};

// Reusable folder object schema
const folderSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' },
    accessLevel: { type: 'string', enum: ['PRIVATE', 'SHARED', 'PUBLIC'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    ownerId: { type: 'integer' },
    parentId: { type: ['integer', 'null'] },
  }
};

// Reusable file share object schema
const fileShareSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    permission: { type: 'string', enum: ['VIEW', 'EDIT', 'MANAGE'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    fileId: { type: 'integer' },
    userId: { type: 'integer' },
  }
};

// Create folder schema
const createFolderSchema = {
  body: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', minLength: 1 },
      parentId: { type: ['integer', 'null'] }
    }
  },
  response: {
    201: folderSchema
  }
};

// Get folder contents schema
const getFolderContentsSchema = {
  querystring: {
    type: 'object',
    properties: {
      folderId: { type: ['integer', 'null'] }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        folders: { type: 'array', items: folderSchema },
        files: { type: 'array', items: fileSchema }
      }
    }
  }
};

// List files schema
const listFilesSchema = {
  querystring: {
    type: 'object',
    properties: {
      search: { type: 'string' },
      mimeType: { type: 'string' },
      sortBy: { type: 'string', enum: ['name', 'size', 'createdAt', 'updatedAt'] },
      sortOrder: { type: 'string', enum: ['asc', 'desc'] },
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        files: { type: 'array', items: fileSchema },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        }
      }
    }
  }
};

// Upload file schema
const uploadFileSchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      folderId: { type: ['integer', 'null'] }
    }
  },
  response: {
    201: fileSchema
  }
};

// Download file schema
const downloadFileSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' }
    }
  }
};

// Delete file schema
const deleteFileSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  }
};

// Delete folder schema
const deleteFolderSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  }
};

// Share file schema
const shareFileSchema = {
  body: {
    type: 'object',
    required: ['fileId', 'email'],
    properties: {
      fileId: { type: 'integer' },
      email: { type: 'string', format: 'email' },
      permission: { type: 'string', enum: ['VIEW', 'EDIT', 'MANAGE'], default: 'VIEW' }
    }
  },
  response: {
    200: fileShareSchema
  }
};

// Create public link schema
const createPublicLinkSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        publicToken: { type: 'string' },
        url: { type: 'string' }
      }
    }
  }
};

// Get file by public token schema
const getFileByPublicTokenSchema = {
  params: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' }
    }
  }
};

// Get user storage info schema
const getUserStorageInfoSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        storageQuota: { type: 'integer' },
        storageUsed: { type: 'integer' },
        storageAvailable: { type: 'integer' },
        usagePercentage: { type: 'integer' }
      }
    }
  }
};

module.exports = {
  createFolderSchema,
  getFolderContentsSchema,
  listFilesSchema,
  uploadFileSchema,
  downloadFileSchema,
  deleteFileSchema,
  deleteFolderSchema,
  shareFileSchema,
  createPublicLinkSchema,
  getFileByPublicTokenSchema,
  getUserStorageInfoSchema
};