// src/modules/auth/handlers.js
const bcrypt = require('bcrypt');
const AuthService = require('./service');

async function register(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    const user = await authService.register(request.body);
    const token = this.jwt.sign({ id: user.id, email: user.email, role: user.role });
    
    return reply.code(201).send({ 
      user, 
      token
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

async function login(request, reply) {
  const authService = new AuthService(this.prisma);
  
  try {
    const { email, password } = request.body;
    const user = await authService.login(email, password);
    const token = this.jwt.sign({ id: user.id, email: user.email, role: user.role });
    
    return reply.code(200).send({ 
      user, 
      token
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

async function getMe(request, reply) {
  try {
    const authService = new AuthService(this.prisma);
    const user = await authService.getUserProfile(request.user.id);
    
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

module.exports = {
  register,
  login,
  getMe
};