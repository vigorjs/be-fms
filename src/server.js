const buildApp = require('./app');
const selfsigned = require('selfsigned');
require('dotenv').config();

// Generate a 2048-bit RSA key (stronger key)
const attrs = [{ name: 'commonName', value: process.env.HOST || 'localhost' }];
const pems = selfsigned.generate(attrs, {
  days: 365,
  keySize: 2048, // <- This fixes the error
});

const app = buildApp({
  logger: process.env.NODE_ENV === 'development' ? {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        colorize: true,
        messageFormat: '{msg}',
        suppressFlushSyncWarning: true
      }
    },
    disableRequestLogging: true
  } : true,
  https: {
    key: pems.private,
    cert: pems.cert,
  }
});

const start = async () => {
  try {
    const port = process.env.PORT || 443;
    await app.listen({ port, host: '0.0.0.0' });

    const serverUrl = `https://${process.env.HOST || 'localhost'}:${port}`;
    const docsUrl = `${serverUrl}/documentation`;
    const apiUrl = `${serverUrl}/api`;

    console.clear();
    app.log.info('='.repeat(60));
    app.log.info(`✅ Server successfully started!`);
    app.log.info(`🚀 Server running at: ${serverUrl}`);
    app.log.info(`📚 API Documentation: ${docsUrl}`);
    app.log.info(`🔌 API Endpoints: ${apiUrl}`);
    app.log.info(`🔍 Health Check: ${serverUrl}/health`);
    app.log.info('='.repeat(60));
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
