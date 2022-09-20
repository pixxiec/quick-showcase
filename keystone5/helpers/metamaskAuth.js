const {MetamaskAuthStrategy} = require('../classes/metamaskAuthStrategy');

module.exports = (keystone) =>
  keystone.createAuthStrategy({
    type: MetamaskAuthStrategy,
    list: 'User',
    config: {},
  });
