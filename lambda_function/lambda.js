const serverless = require('serverless-http');

const binaryMimeTypes = [
  'application/json',
];
const app = require('./server.js');
module.exports.handler = serverless(app, {
  binary: binaryMimeTypes,
});