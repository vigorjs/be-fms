const buildApp = require('./app');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const start = async () => {
  try {
    const app = buildApp({
      logger: {
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
      }
    });

    // Load the self-signed SSL cert and private key
    const options = {
      key: fs.readFileSync('./ssl/private.key'),
      cert: fs.readFileSync('./ssl/certificate.crt')
    };

    const port = process.env.PORT || 3000;

    // Create the HTTPS server
    const httpsServer = https.createServer(options, app.server);

    httpsServer.listen(port, () => {
      console.clear();
      app.log.info('='.repeat(60));
      app.log.info(`✅ HTTPS server running at https://localhost:${port}`);
      app.log.info('='.repeat(60));
    });
  } catch (err) {
    console.error('❌ Error starting server:', err);
    process.exit(1);
  }
};

start();
