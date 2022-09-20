require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {Keystone} = require('@keystonejs/keystone');
const {GraphQLApp} = require('@keystonejs/app-graphql');
const {AdminUIApp} = require('@keystonejs/app-admin-ui');
const {MongooseAdapter: Adapter} = require('@keystonejs/mono-repo/packages/adapter-mongoose');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const {createClient} = require('redis');
const depthLimit = require('graphql-depth-limit');
const {createValidation} = require('graphql-no-alias');

const {initializeQueue, scheduleTask} = require('./queue');
const passwordAuth = require('./helpers/passwordAuth');
const metamaskAuth = require('./helpers/metamaskAuth');
const {healthz} = require('./helpers/metrics');

const initialiseData = require('./initial-data');
const redisClient = createClient({
  url: process.env.REDIS_URL,
  legacyMode: true,
});
redisClient.connect().catch(console.error);
const app = 'app';

const permissions = {
  Query: {
    '*': 1,
    GetMyLoans: 1, 
    GetSupportedTokens: 1,
    GetUserAssets: 5,
  },
  Mutation: {
    '*': 1
  }
}
const { validation } = createValidation({ permissions })

redisClient.on('connect', () => {
  console.log('Connected to redis successfully');
});
redisClient.on('error', (err) => {
  console.log('Could not establish a connection with redis. ' + err);
});

// Boot up Keystone
const keystone = new Keystone({
  adapter: new Adapter({}),
  cookieSecret: process.env.COOKIE_SECRET,
  cookie: {
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
  sessionStore: new RedisStore({client: redisClient}),
  onConnect: process.env.CREATE_TABLES !== 'true' && initialiseData,
});

initializeQueue(keystone);

fs.readdirSync(path.join(__dirname, 'lists')).forEach((file) => {
  const schemaPath = path.join(__dirname, 'lists', file);
  // eslint-disable-next-line global-require
  const listSchema = require(schemaPath);
  const listName = path.basename(file, '.js');

  const hookPath = path.join(__dirname, 'hooks', `${listName}.js`);

  if (fs.existsSync(hookPath)) {
    // eslint-disable-next-line global-require
    const hookSchema = require(hookPath);
    const hooks = hookSchema(keystone, scheduleTask);

    listSchema.hooks = hooks.list;

    Object.keys(hooks.field).forEach((field) => {
      listSchema.fields[field].hooks = hooks.field[field];
    });
  }

  const list = keystone.createList(listName, listSchema);
  const extensionPath = path.join(__dirname, 'extensions', `${listName}.js`);

  if (fs.existsSync(extensionPath)) {
    const {adapter} = list;
    // eslint-disable-next-line global-require
    const extensionSchema = require(extensionPath);

    keystone.extendGraphQLSchema(extensionSchema(keystone, adapter));
  }
});

metamaskAuth(keystone);

module.exports = {
  keystone,
  apps: [
    new GraphQLApp({
      isAccessAllowed: ({authentication: {item: user}}) => !!user,
      validationRules: [depthLimit(1), validation],
    }),
    new AdminUIApp({
      name: app,
      enableDefaultRoute: true,
      authStrategy: passwordAuth(keystone),
      isAccessAllowed: ({authentication: {item: user}}) => !!user && !!user.isAdmin,
    }),
  ],
  configureExpress: (app) => {
    app.set('trust proxy', true);
    app.get('/healthz', healthz);
  },
};
