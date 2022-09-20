const {PassportAuthStrategy} = require('@keystonejs/auth-passport');
const PassportMetamask = require('../lib/passport-metamask');
const constants = require('../helpers/constants');

/** Class representing the MetaMask Passport auth strategy */
class MetamaskAuthStrategy extends PassportAuthStrategy {
  /** Create a new MetaMask auth object
   * @param {object} keystone A KeystoneJS instance
   * @param {string} listKey The list name to auth against
   * @param {object} config Configuration options
   */
  constructor(keystone, listKey, config) {
    super(
      MetamaskAuthStrategy.authType,
      keystone,
      listKey,
      {
        appId: process.env.METAMASK_OAUTH_CLIENT_ID || constants.DEFAULT_METAMASK_OAUTH_CLIENT_ID,
        appSecret:
          process.env.METAMASK_OAUTH_CLIENT_SECRET ||
          constants.DEFAULT_METAMASK_OAUTH_CLIENT_SECRET,
        sessionIdField: '',
        keystoneSessionIdField: '',
        strategyConfig: {
        },
        loginPath: 'auth/verify',
        callbackPath: 'auth/authenticate',
        idField: 'walletAddress',
        ...config,

        onAuthenticated: async (_, req, res) => {
          res.redirect(`${process.env.FRONTEND_URI}/`);
        },

        onError: (errors, req, res) => {
          const error = Array.isArray(errors) ? errors[0] : errors;
          let {message} = error;

          if (error.message === 'Unable to create a passportSession.item<User>') {
            message = 'Email is already registered using password authentication';
          }

          res.redirect(`${process.env.FRONTEND_URI}/error?msg=${message}`);
        },
      },
      PassportMetamask,
    );
  }
}

MetamaskAuthStrategy.authType = 'metamask';

module.exports = {
  MetamaskAuthStrategy,
};
