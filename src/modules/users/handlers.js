// src/modules/users/handlers.js
const UserService = require('./service');

async function registerAdmin(request, reply) {
  const userService = new UserService(this.prisma);
  
  try {
    const user = await userService.registerAdmin(request.body);
    
    return reply.code(201).send({ 
      user,
      message: 'Admin user created successfully'
    });
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

async function registerSuperAdmin(request, reply) {
  const userService = new UserService(this.prisma);
  
  try {
    const user = await userService.registerSuperAdmin(request.body);
    
    return reply.code(201).send({ 
      user,
      message: 'Super admin user created successfully'
    });
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

async function updateRole(request, reply) {
  const userService = new UserService(this.prisma);
  
  try {
    const { userId, role } = request.body;
    const updatedUser = await userService.updateUserRole(
      userId, 
      role, 
      request.user.role
    );
    
    return reply.code(200).send({
      user: updatedUser,
      message: `User role updated to ${role}`
    });
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

async function listUsers(request, reply) {
  const userService = new UserService(this.prisma);
  
  try {
    // Pagination parameters
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    
    const result = await userService.listUsers(page, limit);
    
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

async function getUserById(request, reply) {
  const userService = new UserService(this.prisma);
  
  try {
    const userId = parseInt(request.params.id);
    const user = await userService.getUserById(userId);
    
    return reply.code(200).send(user);
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

async function searchUsers(request, reply) {
  const userService = new UserService(this.prisma);
  
  try {
    // Extract search parameters
    const { search, role } = request.query;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    
    const result = await userService.searchUsers(search, role, page, limit);
    
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

async function updateUser(request, reply) {
  const userService = new UserService(this.prisma);
  
  try {
    const userId = parseInt(request.params.id);
    const updateData = request.body;
    const currentUserRole = request.user.role;
    const currentUserId = request.user.id;
    
    const updatedUser = await userService.updateUser(userId, updateData, currentUserRole, currentUserId);
    
    return reply.code(200).send({
      user: updatedUser,
      message: 'User updated successfully'
    });
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

async function deleteUser(request, reply) {
  const userService = new UserService(this.prisma);
  
  try {
    const userId = parseInt(request.params.id);
    const currentUserRole = request.user.role;
    const currentUserId = request.user.id;
    
    await userService.deleteUser(userId, currentUserRole, currentUserId);
    
    return reply.code(200).send({
      message: 'User deleted successfully'
    });
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
  registerAdmin,
  registerSuperAdmin,
  updateRole,
  listUsers,
  getUserById,
  searchUsers,
  updateUser,
  deleteUser
};