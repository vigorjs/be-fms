const buildApp = require('./app');
const awsLambdaFastify = require('@fastify/aws-lambda');

const app = buildApp({
  logger: true // no need for fancy dev logs on Vercel
});

const proxy = awsLambdaFastify(app);

exports.handler = proxy;
