const buildApp = require('./app');
const selfsigned = require('selfsigned');
require('dotenv').config();

const attrs = [{ name: 'commonName', value: 'localhost' }]; // You can change to your IP or domain
const pems = selfsigned.generate(attrs, { days: 365 });

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
    const port = process.env.PORT || 443; // Default to HTTPS port
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
