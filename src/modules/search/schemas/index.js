// src/modules/search/schemas/index.js

// Reusable file object schema (simplified version from files module)
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

// Reusable folder object schema (simplified version from files module)
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

// Search schema
const searchSchema = {
  querystring: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    },
    required: ['query']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        files: { 
          type: 'array', 
          items: fileSchema 
        },
        folders: { 
          type: 'array', 
          items: folderSchema 
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            totalFiles: { type: 'integer' },
            totalFolders: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' }
          }
        }
      }
    }
  }
};

module.exports = {
  searchSchema
};