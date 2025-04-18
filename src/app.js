// src/app.js
const fastify = require('fastify');
const cors = require('@fastify/cors');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const pino = require('pino');
require('dotenv').config();

// Import plugins
const loggerPlugin = require('./plugins/logger');
const prismaPlugin = require('./plugins/prisma');
const jwtPlugin = require('./plugins/jwt');
const rbacPlugin = require('./plugins/rbac');
const filesystemPlugin = require('./plugins/filesystem');
const fileuploadPlugin = require('./plugins/fileupload');

// Import routes
const authRoutes = require('./modules/auth/routes');
const userRoutes = require('./modules/users/routes');
const fileRoutes = require('./modules/files/routes');
const searchRoutes = require('./modules/search/routes');

// Logger configuration
function createLoggerConfig() {
  const TOKEN = process.env.LOGTAIL_SOURCE_TOKEN;
  const INGESTING_HOST = process.env.LOGTAIL_INGESTING_HOST || "logs.betterstack.com";
  const LOGGER_FILE = process.env.LOGGER_FILE;

  if (TOKEN) {
    return {
      transport: {
        targets: [
          {
            target: "@logtail/pino",
            options: {
              sourceToken: TOKEN,
              options: { endpoint: `https://${INGESTING_HOST}` },
            },
          },
          ...(LOGGER_FILE
            ? [
                {
                  target: "pino/file",
                  options: { destination: LOGGER_FILE },
                },
              ]
            : []),
          {
            target: "pino-pretty",
            options: {
              translateTime: "HH:MM:ss Z",
              ignore: "pid,hostname",
              colorize: true,
            },
          },
        ]
      }
    };
  } else {
    return {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true
        }
      }
    };
  }
}

function build(opts = {}) {
  // Merge default logger config with passed options
  const options = {
    logger: createLoggerConfig(),
    ...opts
  };
  
  const app = fastify(options);

  // Register plugins
  app.register(cors, {
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allow all methods including DELETE
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Super-Admin-Key'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  
  app.register(loggerPlugin);
  app.register(prismaPlugin);
  app.register(jwtPlugin);
  app.register(rbacPlugin);
  app.register(filesystemPlugin);
  app.register(fileuploadPlugin);

  // Swagger documentation
  app.register(swagger, {
    swagger: {
      info: {
        title: 'Fastify API',
        description: 'API documentation',
        version: '1.0.0'
      },
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header'
        }
      }
    }
  });
  
  app.register(swaggerUi, {
    routePrefix: '/documentation',
  });

  // API routes with prefix
  app.register((apiInstance, opts, done) => {
    // Register routes within the /api prefix
    apiInstance.register(authRoutes, { prefix: '/auth' });
    apiInstance.register(userRoutes, { prefix: '/users' });
    apiInstance.register(fileRoutes, { prefix: '/files' });
    apiInstance.register(searchRoutes, { prefix: '/search' });
    
    done();
  }, { prefix: '/api' });

  // Health check (outside API namespace)
  app.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  return app;
}

module.exports = build;