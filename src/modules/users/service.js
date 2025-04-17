// src/modules/users/service.js
const bcrypt = require('bcrypt');
const { createUnauthorizedError, createBadRequestError, createForbiddenError } = require('../../utils/errors');

class UserService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async registerAdmin(userData, role = 'ADMIN') {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw createBadRequestError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user with specified role
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: role
      }
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async registerSuperAdmin(userData) {
    // This is a separate method to register super admins (requires special header)
    return this.registerAdmin(userData, 'SUPER_ADMIN');
  }

  async updateUserRole(userId, newRole, currentUserRole) {
    // Only SUPER_ADMIN can update to any role
    // ADMIN can only update USER roles
    if (currentUserRole !== 'SUPER_ADMIN' && 
        (newRole === 'SUPER_ADMIN' || newRole === 'ADMIN')) {
      throw createForbiddenError('Insufficient permissions to assign this role');
    }

    // Find user to update
    const userToUpdate = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToUpdate) {
      throw createBadRequestError('User not found');
    }

    // ADMIN cannot change roles of other ADMINs or SUPER_ADMINs
    if (currentUserRole === 'ADMIN' && 
       (userToUpdate.role === 'ADMIN' || userToUpdate.role === 'SUPER_ADMIN')) {
      throw createForbiddenError('Cannot modify users with equal or higher role');
    }

    // Limit the number of SUPER_ADMINs
    if (newRole === 'SUPER_ADMIN') {
      const superAdminCount = await this.prisma.user.count({
        where: { role: 'SUPER_ADMIN' }
      });
      
      // Optionally limit the number of super admins (e.g., max 3)
      if (superAdminCount >= 3 && userToUpdate.role !== 'SUPER_ADMIN') {
        throw createBadRequestError('Maximum number of super admins reached');
      }
    }

    // Update the role
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async listUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const users = await this.prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const total = await this.prisma.user.count();
    
    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      throw createBadRequestError('User not found');
    }
    
    return user;
  }

  async searchUsers(searchTerm, role, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    // Build where conditions
    const whereConditions = {};
    
    if (searchTerm) {
      whereConditions.OR = [
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { name: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    if (role) {
      whereConditions.role = role;
    }
    
    // Get matching users
    const users = await this.prisma.user.findMany({
      where: whereConditions,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    const total = await this.prisma.user.count({
      where: whereConditions
    });
    
    return {
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async updateUser(userId, updateData, currentUserRole, currentUserId) {
    // Check user exists
    const userToUpdate = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userToUpdate) {
      throw createBadRequestError('User not found');
    }
    
    // Check permissions
    // ADMIN can only update USER
    if (currentUserRole === 'ADMIN' && userToUpdate.role !== 'USER') {
      throw createForbiddenError('Insufficient permissions to update this user');
    }
    
    // SUPER_ADMIN can update anyone except other SUPER_ADMINs unless it's themselves
    if (currentUserRole === 'SUPER_ADMIN' && 
        userToUpdate.role === 'SUPER_ADMIN' && 
        userToUpdate.id !== currentUserId) {
      throw createForbiddenError('Cannot update other super admin users');
    }
    
    // Hash password if provided
    const dataToUpdate = { ...updateData };
    if (dataToUpdate.password) {
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
    }
    
    // Check if email is being updated and if it's already in use
    if (dataToUpdate.email && dataToUpdate.email !== userToUpdate.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dataToUpdate.email }
      });
      
      if (existingUser) {
        throw createBadRequestError('Email already in use');
      }
    }
    
    // Update user
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: dataToUpdate
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      if (error.code === 'P2002') {
        throw createBadRequestError('Email already in use');
      }
      throw error;
    }
  }

  async deleteUser(userId, currentUserRole, currentUserId) {
    // Check if user exists
    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userToDelete) {
      throw createBadRequestError('User not found');
    }
    
    // Cannot delete yourself
    if (userToDelete.id === currentUserId) {
      throw createBadRequestError('Cannot delete your own account');
    }
    
    // ADMIN can only delete USER
    if (currentUserRole === 'ADMIN' && userToDelete.role !== 'USER') {
      throw createForbiddenError('Insufficient permissions to delete this user');
    }
    
    // SUPER_ADMIN cannot delete other SUPER_ADMINs
    if (currentUserRole === 'SUPER_ADMIN' && userToDelete.role === 'SUPER_ADMIN') {
      throw createForbiddenError('Super admin users cannot be deleted');
    }
    
    // Delete the user
    await this.prisma.user.delete({
      where: { id: userId }
    });
    
    return { success: true, message: 'User deleted successfully' };
  }
}

module.exports = UserService;