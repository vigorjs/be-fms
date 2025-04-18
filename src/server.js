const buildApp = require('./app');
const pem = require('pem');
const util = require('util');
require('dotenv').config();

const createCertificate = util.promisify(pem.createCertificate);

const start = async () => {
  try {
    const { serviceKey: key, certificate: cert } = await createCertificate({
      days: 365,
      selfSigned: true,
      keyBitsize: 2048 // 🔐 This ensures no more "key too small" errors
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
        key,
        cert
      }
    });

    const port = process.env.PORT || 443;
    await app.listen({ port, host: '0.0.0.0' });

    const serverUrl = `https://${process.env.HOST || 'localhost'}:${port}`;
    console.clear();
    app.log.info('='.repeat(60));
    app.log.info(`✅ Server successfully started!`);
    app.log.info(`🚀 Server running at: ${serverUrl}`);
    app.log.info(`📚 Documentation: ${serverUrl}/documentation`);
    app.log.info('='.repeat(60));
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

start();
