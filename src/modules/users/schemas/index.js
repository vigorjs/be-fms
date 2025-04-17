// src/modules/users/schemas/index.js

// Reusable user object schema
const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

const registerAdminSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      name: { type: 'string' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        user: userSchema,
        message: { type: 'string' }
      }
    }
  }
};

const registerSuperAdminSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      name: { type: 'string' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        user: userSchema,
        message: { type: 'string' }
      }
    }
  }
};

const updateRoleSchema = {
  body: {
    type: 'object',
    required: ['userId', 'role'],
    properties: {
      userId: { type: 'integer' },
      role: { 
        type: 'string',
        enum: ['USER', 'ADMIN', 'SUPER_ADMIN']
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        user: userSchema,
        message: { type: 'string' }
      }
    }
  }
};

const listUsersSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: userSchema
        },
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

const getUserByIdSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' }
    }
  },
  response: {
    200: userSchema
  }
};

const searchUsersSchema = {
  querystring: {
    type: 'object',
    properties: {
      search: { type: 'string' },
      role: { type: 'string', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] },
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1, maximum: 100 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: userSchema
        },
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

const updateUserSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' }
    }
  },
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      password: { type: 'string', minLength: 6 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        user: userSchema,
        message: { type: 'string' }
      }
    }
  }
};

const deleteUserSchema = {
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
        message: { type: 'string' }
      }
    }
  }
};

module.exports = {
  userSchema,
  registerAdminSchema,
  registerSuperAdminSchema,
  updateRoleSchema,
  listUsersSchema,
  getUserByIdSchema,
  searchUsersSchema,
  updateUserSchema,
  deleteUserSchema
};