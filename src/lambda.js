const buildApp = require('./app');
const awsLambdaFastify = require('@fastify/aws-lambda');

const app = buildApp({ logger: true });
const proxy = awsLambdaFastify(app);

// ✅ Export the proxy function as the default export
module.exports = proxy;
